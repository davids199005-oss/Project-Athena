/**
 * @module ai-log.entity
 *
 * **Purpose:** Audit trail for AI operations (tokens, duration, model) for admin analytics and cost tracking.
 *
 * **Responsibilities:** Capture user/book context references; classify action via enum for aggregation queries.
 *
 * **Integration notes:** Logging failures are swallowed in `AiService`—missing rows are possible under DB errors.
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

/** Logged OpenAI call category (cost/analytics/admin filters). */
export enum AiAction {
  SUMMARY = 'summary',
  CHAT = 'chat',
  RECOMMENDATION = 'recommendation',
  EMBEDDING = 'embedding',
}

@Entity('ai_logs')
export class AiLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  // Optional book (some recommendation logs are global)
  @ManyToOne(() => Book, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bookId' })
  book!: Book | null;

  @Column({ type: 'uuid', nullable: true })
  bookId!: string | null;

  // Indexed action type for admin queries
  @Index()
  @Column({ type: 'enum', enum: AiAction })
  action!: AiAction;

  // Model id (e.g. gpt-4o, text-embedding-3-small)
  @Column({ type: 'varchar', length: 50 })
  model!: string;

  // Token usage for cost tracking
  @Column({ type: 'int' })
  tokensUsed!: number;

  // Request duration (latency monitoring)
  @Column({ type: 'int' })
  durationMs!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
