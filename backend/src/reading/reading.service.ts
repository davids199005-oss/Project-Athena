/**
 * @module reading.service
 *
 * **Purpose:** Per-user reading state: progress, bookmarks, favorites, highlights, quotes, and
 * aggregated reading statistics for profile/dashboard endpoints.
 *
 * **Responsibilities:** Upsert idempotent progress rows; enforce ownership on mutations via
 * `userId` scopes; compute rollups (counts, monthly activity) with PostgreSQL-specific SQL where needed.
 *
 * **Integration notes:** "Completed" is defined as `progressPercent >= 95` (not explicit status enums).
 * Stats queries may be heavier for large histories—indexes on `userId`/`lastReadAt` matter at scale.
 */

import {
    Injectable,
    NotFoundException,
    ConflictException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { ReadingProgress } from './entities/reading-progress.entity';
  import { Bookmark } from './entities/bookmark.entity';
  import { Favorite } from './entities/favorite.entity';
  import { Quote } from './entities/quote.entity';
  import { UpsertProgressDto } from './dto/upsert-progress.dto';
  import { CreateBookmarkDto } from './dto/create-bookmark.dto';
  import { CreateQuoteDto } from './dto/create-quote.dto';
  
  /**
   * User-scoped reading data service (TypeORM repositories, no cross-user access).
   *
   * **Consistency:** Favorite add is explicitly conflicted on duplicate; progress upsert is last-write-wins.
   */
  @Injectable()
  export class ReadingService {
    constructor(
      @InjectRepository(ReadingProgress)
      private readonly progressRepo: Repository<ReadingProgress>,
      @InjectRepository(Bookmark)
      private readonly bookmarkRepo: Repository<Bookmark>,
      @InjectRepository(Favorite)
      private readonly favoriteRepo: Repository<Favorite>,
      @InjectRepository(Quote)
      private readonly quoteRepo: Repository<Quote>,
    ) {}
  
    // ─── Reading Progress ───
  
    /**
     * Creates or updates reading progress for a user/book pair, bumping `lastReadAt`.
     *
     * **Side effects:** Always touches `lastReadAt` on save path.
     */
    async upsertProgress(
      userId: string,
      bookId: string,
      dto: UpsertProgressDto,
    ): Promise<ReadingProgress> {
      let progress = await this.progressRepo.findOne({
        where: { userId, bookId },
      });
  
      if (progress) {
        progress.currentPosition = dto.currentPosition;
        progress.progressPercent = dto.progressPercent;
        progress.lastReadAt = new Date();
      } else {
        progress = this.progressRepo.create({
          userId,
          bookId,
          ...dto,
          lastReadAt: new Date(),
        });
      }
  
      return this.progressRepo.save(progress);
    }
  
    async getProgress(
      userId: string,
      bookId: string,
    ): Promise<ReadingProgress | null> {
      return this.progressRepo.findOne({ where: { userId, bookId } });
    }
  
    async getHistory(userId: string): Promise<ReadingProgress[]> {
      return this.progressRepo.find({
        where: { userId },
        relations: ['book'],
        order: { lastReadAt: 'DESC' },
      });
    }
  
    // ─── Bookmarks ───
  
    async createBookmark(
      userId: string,
      bookId: string,
      dto: CreateBookmarkDto,
    ): Promise<Bookmark> {
      const bookmark = this.bookmarkRepo.create({
        userId,
        bookId,
        ...dto,
      });
  
      return this.bookmarkRepo.save(bookmark);
    }
  
    async getBookmarks(userId: string, bookId: string): Promise<Bookmark[]> {
      return this.bookmarkRepo.find({
        where: { userId, bookId },
        order: { createdAt: 'DESC' },
      });
    }
  
    async removeBookmark(userId: string, id: string): Promise<void> {
      const bookmark = await this.bookmarkRepo.findOne({
        where: { id, userId },
      });
  
      if (!bookmark) {
        throw new NotFoundException('Bookmark not found');
      }
  
      await this.bookmarkRepo.remove(bookmark);
    }
  
    // ─── Favorites ───
  
    async addFavorite(userId: string, bookId: string): Promise<Favorite> {
      const existing = await this.favoriteRepo.findOne({
        where: { userId, bookId },
      });
  
      if (existing) {
        throw new ConflictException('Book already in favorites');
      }
  
      const favorite = this.favoriteRepo.create({ userId, bookId });
      return this.favoriteRepo.save(favorite);
    }
  
    async removeFavorite(userId: string, bookId: string): Promise<void> {
      const favorite = await this.favoriteRepo.findOne({
        where: { userId, bookId },
      });
  
      if (!favorite) {
        throw new NotFoundException('Favorite not found');
      }
  
      await this.favoriteRepo.remove(favorite);
    }
  
    async getFavorites(userId: string): Promise<Favorite[]> {
      return this.favoriteRepo.find({
        where: { userId },
        relations: ['book'],
        order: { createdAt: 'DESC' },
      });
    }
  
    // ─── Quotes ───

    async createQuote(
      userId: string,
      bookId: string,
      dto: CreateQuoteDto,
    ): Promise<Quote> {
      const quote = this.quoteRepo.create({
        userId,
        bookId,
        ...dto,
      });

      return this.quoteRepo.save(quote);
    }

    async getQuotesByBook(userId: string, bookId: string): Promise<Quote[]> {
      return this.quoteRepo.find({
        where: { userId, bookId },
        order: { createdAt: 'DESC' },
      });
    }

    async getAllQuotes(userId: string): Promise<Quote[]> {
      return this.quoteRepo.find({
        where: { userId },
        relations: ['book'],
        order: { createdAt: 'DESC' },
      });
    }

    async removeQuote(userId: string, id: string): Promise<void> {
      const quote = await this.quoteRepo.findOne({
        where: { id, userId },
      });

      if (!quote) {
        throw new NotFoundException('Quote not found');
      }

      await this.quoteRepo.remove(quote);
    }

    // ─── Reading Stats ───

    /**
     * Aggregates counts and time-bucketed activity for dashboards.
     *
     * **Performance:** Issues parallel queries; monthly SQL uses `TO_CHAR` (PostgreSQL-specific).
     */
    async getReadingStats(userId: string) {
      const [
        totalBooks,
        completedBooks,
        inProgressBooks,
        totalQuotes,
        totalBookmarks,
        recentActivity,
        monthlyProgress,
      ] = await Promise.all([
        // Books with any progress row
        this.progressRepo.count({ where: { userId } }),

        // Completed (>= 95%)
        this.progressRepo
          .createQueryBuilder('rp')
          .where('rp.userId = :userId', { userId })
          .andWhere('rp.progressPercent >= 95')
          .getCount(),

        // In progress (0 < p < 95%)
        this.progressRepo
          .createQueryBuilder('rp')
          .where('rp.userId = :userId', { userId })
          .andWhere('rp.progressPercent > 0')
          .andWhere('rp.progressPercent < 95')
          .getCount(),

        // Quotes count
        this.quoteRepo.count({ where: { userId } }),

        // Bookmarks count
        this.bookmarkRepo.count({ where: { userId } }),

        // Last 5 reading activities
        this.progressRepo.find({
          where: { userId },
          relations: ['book'],
          order: { lastReadAt: 'DESC' },
          take: 5,
        }),

        // Monthly aggregates (last 6 months)
        this.progressRepo
          .createQueryBuilder('rp')
          .select("TO_CHAR(rp.lastReadAt, 'YYYY-MM')", 'month')
          .addSelect('COUNT(DISTINCT rp.bookId)', 'booksRead')
          .addSelect('AVG(rp.progressPercent)', 'avgProgress')
          .where('rp.userId = :userId', { userId })
          .andWhere("rp.lastReadAt >= NOW() - INTERVAL '6 months'")
          .groupBy("TO_CHAR(rp.lastReadAt, 'YYYY-MM')")
          .orderBy('month', 'ASC')
          .getRawMany(),
      ]);

      // Average progress across books
      const avgProgressResult = await this.progressRepo
        .createQueryBuilder('rp')
        .select('AVG(rp.progressPercent)', 'avg')
        .where('rp.userId = :userId', { userId })
        .getRawOne();

      return {
        totalBooks,
        completedBooks,
        inProgressBooks,
        averageProgress: Math.round(parseFloat(avgProgressResult?.avg || '0')),
        totalQuotes,
        totalBookmarks,
        recentActivity,
        monthlyProgress,
      };
    }
  }