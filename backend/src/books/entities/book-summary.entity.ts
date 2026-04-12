/**
 * @module book-summary.entity
 *
 * **Purpose:** Store generated AI summaries per book for fast reads without re-invoking the model.
 *
 * **Responsibilities:** Link 1:1 to `Book`; record model name and token usage for auditing.
 *
 * **Integration notes:** Regeneration policies (if any) belong in services—entity is insert/update only via ORM.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Book } from './book.entity';

@Entity('book_summaries')
export class BookSummary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // OneToOne Book; CASCADE; unique bookId enforces 1:1
  @OneToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  @Column({ type: 'uuid', unique: true })
  bookId!: string;

  // Generated summary text (cached after first run)
  @Column({ type: 'text' })
  summary!: string;

  // Model id for audits / regressions
  @Column({ type: 'varchar', length: 50 })
  model!: string;

  // Token usage for cost tracking
  @Column({ type: 'int' })
  tokensUsed!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
