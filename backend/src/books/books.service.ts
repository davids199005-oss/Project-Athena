/**
 * @module books.service
 *
 * **Purpose:** Domain service for catalog CRUD, file path handling, ingestion (parse → chunk →
 * embed → summarize), and notifications when AI pipelines complete.
 *
 * **Responsibilities:** Query/filter catalog; stream file paths; admin create/update/delete with
 * disk cleanup; orchestrate `BooksParserService`, `AiService`, and `NotificationService` on ingest.
 *
 * **Integration notes:** Ingest failures after `save(book)` are logged but do not roll back the book
 * row—operators may see books without chunks/summaries. Embeddings use raw SQL to cast JSON into
 * `vector(1536)` to match pgvector expectations.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBooksDto } from './dto/query-books.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BookChunk } from './entities/book-chunk.entity';
import { BooksParserService } from './books-parser.service';
import { chunkText } from '@/utils/text-chunker';
import { AiService } from '../ai/ai.service';
import { BookSummary } from './entities/book-summary.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

/**
 * Book catalog and ingestion orchestrator.
 *
 * Multer persists uploads before this service runs; here we only trust paths and database state.
 * Deletes prefer DB-first ordering to avoid orphaned metadata without files.
 */
@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookChunk)
    private readonly bookChunkRepository: Repository<BookChunk>,
    private readonly parserService: BooksParserService,
    private readonly aiService: AiService,
    @InjectRepository(BookSummary)
    private readonly bookSummaryRepository: Repository<BookSummary>,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Catalog (authenticated users) ───

  /**
   * Paginated catalog query with dynamic filters and PostgreSQL full-text search when `search` is set.
   *
   * **Why QueryBuilder:** Filters are optional—this builds a single parameterized SQL statement instead of
   * branching `find()` permutations. **Side effects:** None (read-only). **Cost:** `getManyAndCount` issues
   * a list query plus a `COUNT(*)` for pagination metadata.
   */
  async findAll(query: QueryBooksDto) {
    const {
      page,
      limit,
      genre,
      language,
      minRating,
      search,
      sortBy,
      sortOrder,
    } = query;

    // createQueryBuilder('book') builds SELECT * FROM books AS book.
    // Alias 'book' is used for column references: book.title, book.genre, etc.
    const qb = this.bookRepository.createQueryBuilder('book');

    // ─── Filters ───
    // andWhere is applied only when the corresponding filter is provided.
    // :genre is a bound parameter (SQL injection safe).
    // TypeORM passes values via the driver's prepared statement.

    if (genre) {
      qb.andWhere('book.genre = :genre', { genre });
    }

    if (language) {
      qb.andWhere('book.language = :language', { language });
    }

    if (minRating !== undefined) {
      qb.andWhere('book.rating >= :minRating', { minRating });
    }

    // Full-text search via searchVector (plainto_tsquery); ILIKE removed in favor of tsvector.
    if (search) {
      qb.andWhere('book."searchVector" @@ plainto_tsquery(:search)', {
        search,
      });
    }

    // ─── Sort ───
    // Use allowlist mapping instead of string interpolation to prevent SQL injection
    // even if DTO enum validation is somehow bypassed
    const sortColumnMap: Record<string, string> = {
      createdAt: 'book.createdAt',
      rating: 'book.rating',
      title: 'book.title',
      publishedYear: 'book.publishedYear',
    };
    const sortColumn = sortColumnMap[sortBy!] || 'book.createdAt';
    qb.orderBy(sortColumn, sortOrder);

    // ─── Pagination ───
    // skip = rows to skip (offset); take = page size (limit).
    // Example: page=1, limit=12 → skip=0, take=12; page=2 → skip=12, take=12.
    const skip = (page! - 1) * limit!;
    qb.skip(skip).take(limit);

    // getManyAndCount runs two queries: list rows + COUNT(*) for totalPages.
    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  /**
   * Loads a single book or throws `NotFoundException`—used as a shared guard for mutations and downloads.
   */
  async findOne(id: string): Promise<Book> {
    const book = await this.bookRepository.findOne({ where: { id } });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }
  /** Returns stored AI summary or 404 when generation never succeeded. */
  async getSummary(bookId: string): Promise<BookSummary> {
    const summary = await this.bookSummaryRepository.findOne({ where: { bookId } });
    if (!summary) {
      throw new NotFoundException('Summary not found for this book');
    }
    return summary;
  }
  // ─── CRUD (ADMIN only) ───

  /**
   * Admin ingest pipeline: persist metadata, parse/chunk/embed, generate summary, and notify on success.
   *
   * **Side effects:** Writes `Book`, many `BookChunk` rows, updates vectors via raw SQL, inserts `BookSummary`,
   * and may enqueue a user notification. **Failure behavior:** parse/AI failures are logged; the `Book` row may
   * still exist without chunks—operators should monitor logs.
   */
  async create(
    dto: CreateBookDto,
    filePath: string,
    coverImageUrl?: string,
    uploadedByUserId?: string,
  ): Promise<Book> {
    const book = this.bookRepository.create({
      ...dto,
      filePath,
      coverImageUrl: coverImageUrl || null,
    });
  
    const savedBook = await this.bookRepository.save(book);
  
    try {
      const sections = await this.parserService.parse(filePath, dto.fileType);
      const textChunks = chunkText(sections);
  
      const chunkEntities = textChunks.map((chunk, index) =>
        this.bookChunkRepository.create({
          bookId: savedBook.id,
          chunkIndex: index,
          content: chunk.content,
          chapterTitle: chunk.chapterTitle,
        }),
      );
  
      const savedChunks = await this.bookChunkRepository.save(chunkEntities);
      this.logger.log(
        `Created ${savedChunks.length} chunks for book ${savedBook.id}`,
      );
  
      // ─── Embeddings ───
      const texts = savedChunks.map((chunk) => chunk.content);
      const embeddings = await this.aiService.generateEmbeddings(texts);
  
      for (let i = 0; i < savedChunks.length; i++) {
        await this.bookChunkRepository.query(
          `UPDATE book_chunks SET embedding = $1, embedding_vec = $1::text::vector(1536) WHERE id = $2`,
          [JSON.stringify(embeddings[i]), savedChunks[i].id],
        );
      }
      // ─── Summary ───
      await this.aiService.generateSummary(
        savedBook.id,
        dto.title,
        dto.author,
        savedChunks.map((c) => ({ content: c.content, chunkIndex: c.chunkIndex })),
      );
  
      this.logger.log(
        `Generated embeddings for ${embeddings.length} chunks of book ${savedBook.id}`,
      );

      // Notify user that summary is ready
      if (uploadedByUserId) {
        await this.notificationService.create(
          uploadedByUserId,
          NotificationType.SUMMARY_READY,
          'AI Summary Ready',
          `Summary for "${dto.title}" has been generated.`,
          `/books/${savedBook.id}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to parse book ${savedBook.id}: ${error}`);
    }
  
    return savedBook;
  }

  /**
   * Recomputes embeddings for all chunks of a book in batches to respect API limits and reduce memory spikes.
   *
   * **Side effects:** Issues many OpenAI embedding calls and updates `embedding`/`embedding_vec` via raw SQL.
   */
  async regenerateEmbeddings(bookId: string): Promise<{ generated: number }> {
    const book = await this.findOne(bookId);

    const chunks = await this.bookChunkRepository.find({
      where: { bookId: book.id },
      order: { chunkIndex: 'ASC' },
    });

    if (chunks.length === 0) {
      throw new NotFoundException('No chunks found for this book');
    }

    const BATCH_SIZE = 50;
    let generated = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.content);
      const embeddings = await this.aiService.generateEmbeddings(texts);

      for (let j = 0; j < batch.length; j++) {
        await this.bookChunkRepository.query(
          `UPDATE book_chunks SET embedding = $1, embedding_vec = $1::text::vector(1536) WHERE id = $2`,
          [JSON.stringify(embeddings[j]), batch[j].id],
        );
      }
      generated += batch.length;
      this.logger.log(
        `Embeddings batch ${i / BATCH_SIZE + 1}: ${generated}/${chunks.length} for book ${bookId}`,
      );
    }

    this.logger.log(`Regenerated ${generated} embeddings for book ${bookId}`);
    return { generated };
  }

  /**
   * Updates mutable metadata fields only—binary book/cover files use dedicated flows.
   */
  async update(id: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);

    Object.assign(book, dto);

    return this.bookRepository.save(book);
  }

  /**
   * Replaces cover image path after deleting the previous file from disk (best-effort unlink via private helper).
   */
  async updateCover(id: string, coverImageUrl: string): Promise<Book> {
    const book = await this.findOne(id);

    // Remove previous cover file from disk if present
    if (book.coverImageUrl) {
      await this.deleteFileFromDisk(book.coverImageUrl);
    }

    book.coverImageUrl = coverImageUrl;
    return this.bookRepository.save(book);
  }

  /**
   * Deletes DB row first (relying on cascades for related rows), then removes book/cover files from disk.
   *
   * **Ordering rationale:** Avoid losing files if the DB delete fails; orphaned files are acceptable and logged.
   */
  async remove(id: string): Promise<void> {
    const book = await this.findOne(id);

    // Snapshot paths before DB delete
    const { filePath, coverImageUrl } = book;

    // Delete DB row (CASCADE removes chunks, progress, bookmarks, etc.)
    await this.bookRepository.remove(book);

    // Delete files from disk
    await this.deleteFileFromDisk(filePath);
    if (coverImageUrl) {
      await this.deleteFileFromDisk(coverImageUrl);
    }
  }

  /**
   * Resolves the on-disk path for controllers using `sendFile`/`createReadStream` (requires absolute paths).
   */
  async getFilePath(
    id: string,
  ): Promise<{ absolutePath: string; fileType: string }> {
    const book = await this.findOne(id);

    // path.resolve turns a relative path into an absolute one for res.sendFile().
    const absolutePath = path.resolve(book.filePath);

    return { absolutePath, fileType: book.fileType };
  }

  // ─── Private helpers ───

  /**
   * Best-effort file deletion for maintenance paths; swallows missing-file errors to keep UX flowing.
   */
  private async deleteFileFromDisk(filePath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath);
      await fs.unlink(absolutePath);
    } catch (error) {
      // Missing file or permission denied: log only (Logger.warn above).
      this.logger.warn(`Failed to delete file: ${filePath}`, error);
    }
  }
}
