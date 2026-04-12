/**
 * @module reading-progress.entity
 *
 * **Purpose:** Track per-user reading position and completion percent for each book.
 *
 * **Responsibilities:** Enforce uniqueness on (user, book); index `lastReadAt` for history queries.
 *
 * **Integration notes:** `currentPosition` is stored as string for flexible reader implementations.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';

// ─── Composite uniqueness ───
// @Unique(userId, bookId): one progress row per user per book; reopen updates the same row.
@Unique(['userId', 'bookId'])
@Entity('reading_progress')
export class ReadingProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  @Index()
  @Column({ type: 'uuid' })
  bookId!: string;

  // Reading position: EPUB CFI or PDF page as string—formats differ by file type.
  @Column({ type: 'varchar', length: 255 })
  currentPosition!: string;

  // Read progress percent; DECIMAL(5,2) (intended range 0–100).
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercent!: number;

  // Last read activity; unlike updatedAt, only meaningful read events should touch this.
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastReadAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
