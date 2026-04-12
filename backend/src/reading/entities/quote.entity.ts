/**
 * @module quote.entity
 *
 * **Purpose:** Persist user-curated quotes from books with optional metadata for display and sorting.
 *
 * **Responsibilities:** Map user/book relations; store ordering key for stable UI sorting.
 *
 * **Integration notes:** Large quote bodies should remain bounded at DTO layer to avoid oversized rows.
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

@Entity('quotes')
export class Quote {
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

  // Quote body
  @Column({ type: 'text' })
  text!: string;

  // Source label (chapter title or page)
  @Column({ type: 'varchar', length: 500, nullable: true })
  source!: string | null;

  // User note on the quote
  @Column({ type: 'text', nullable: true })
  note!: string | null;

  // Navigation to the quote location in the book
  @Column({ type: 'text', nullable: true })
  cfiRange!: string | null;

  @Column({ type: 'int', nullable: true })
  pageNumber!: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
