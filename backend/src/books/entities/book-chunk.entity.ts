/**
 * @module book-chunk.entity
 *
 * **Purpose:** Persist searchable text segments and embedding payloads for vector retrieval (RAG).
 *
 * **Responsibilities:** Store chunk ordering, optional chapter titles, JSON/text embedding fields for pgvector queries.
 *
 * **Integration notes:** Raw SQL updates embedding vectors because TypeORM typing for `vector` is limited; keep dimensions aligned with OpenAI model output.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Book } from './book.entity';

@Entity('book_chunks')
export class BookChunk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ManyToOne Book; CASCADE deletes orphan chunks
  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  // Explicit FK column for filters without joining Book
  @Index()
  @Column({ type: 'uuid' })
  bookId!: string;

  // Per-book ordering for stable context assembly
  @Column({ type: 'int' })
  chunkIndex!: number;

  // Chunk body used as RAG context
  @Column({ type: 'text' })
  content!: string;

  // Optional chapter title (EPUB) for citation in chat UI
  @Column({ type: 'varchar', length: 500, nullable: true })
  chapterTitle!: string | null;

  // Embedding as text JSON for TypeORM; SQL casts to vector in queries
  @Column({ type: 'text', nullable: true, select: false })
  embedding!: string | null;

  // Mirrored vector(1536) for IVFFlat; column typed as text in ORM, real type via migration
  @Column({ type: 'text', nullable: true, select: false })
  embedding_vec!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
