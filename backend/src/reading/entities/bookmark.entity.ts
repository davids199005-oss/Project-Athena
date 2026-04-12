/**
 * @module bookmark.entity
 *
 * **Purpose:** Persist named bookmarks pointing to reader-specific positions within a book.
 *
 * **Responsibilities:** Store optional note/title; index by user/book for retrieval APIs.
 *
 * **Integration notes:** Position strings are opaque; clients must keep them consistent across sessions.
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
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';

@Entity('bookmarks')
export class Bookmark {
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

  // Reader position (EPUB CFI or PDF page string); same format as ReadingProgress.currentPosition.
  @Column({ type: 'varchar', length: 255 })
  position!: string;

  // Optional user-facing label (e.g. quote label, resume here).
  @Column({ type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
