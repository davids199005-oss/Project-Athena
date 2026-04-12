/**
 * @module book.entity
 *
 * **Purpose:** ORM model for catalog books, denormalized ratings, and relations to chunks/summaries/reading data.
 *
 * **Responsibilities:** Map columns and indexes; expose relations for eager/lazy loading in services.
 *
 * **Integration notes:** `searchVector` is maintained for FTS queries; synchronize mode must stay compatible with migrations in non-dev environments.
 */

// src/books/entities/book.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookChunk } from './book-chunk.entity';
import { BookSummary } from './book-summary.entity';
import { ReadingProgress } from '../../reading/entities/reading-progress.entity';
import { Bookmark } from '../../reading/entities/bookmark.entity';
import { Favorite } from '../../reading/entities/favorite.entity';
import { Review } from '../../review/entities/review.entity';
import { AiChatSession } from '../../ai/entities/ai-chat-session.entity';
import { AiLog } from '../../ai/entities/ai-log.entity';
import { CollectionBook } from '../../collection/entities/collection-book.entity';

/** Source file format (drives parser + reader). */
export enum BookFileType {
  EPUB = 'EPUB',
  PDF = 'PDF',
}

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  author!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  genre!: string;

  @Column({ type: 'varchar', length: 50 })
  language!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  isbn!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: 'int', nullable: true })
  pageCount!: number | null;

  @Column({ type: 'int', nullable: true })
  publishedYear!: number | null;

  @Column({ type: 'enum', enum: BookFileType })
  fileType!: BookFileType;

  @Column({ type: 'varchar', length: 500 })
  filePath!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ type: 'int', default: 0 })
  ratingsCount!: number;

  @Index()
  @Column({ type: 'tsvector', select: false, nullable: true })
  searchVector!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ─── Relations ───
  @OneToOne(() => BookSummary, (bs) => bs.book)
  summary!: BookSummary;

  // OneToMany: chunks, reading state, bookmarks, etc.
  @OneToMany(() => BookChunk, (bc) => bc.book)
  chunks!: BookChunk[];

  @OneToMany(() => ReadingProgress, (rp) => rp.book)
  readingProgress!: ReadingProgress[];

  @OneToMany(() => Bookmark, (b) => b.book)
  bookmarks!: Bookmark[];

  @OneToMany(() => Favorite, (f) => f.book)
  favorites!: Favorite[];

  @OneToMany(() => Review, (r) => r.book)
  reviews!: Review[];

  @OneToMany(() => AiChatSession, (s) => s.book)
  aiChatSessions!: AiChatSession[];

  @OneToMany(() => AiLog, (l) => l.book)
  aiLogs!: AiLog[];

  @OneToMany(() => CollectionBook, (cb) => cb.book)
  collectionBooks!: CollectionBook[];
}