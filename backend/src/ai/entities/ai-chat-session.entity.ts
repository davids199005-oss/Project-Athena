/**
 * @module ai-chat-session.entity
 *
 * **Purpose:** ORM model for per-user, per-book AI chat sessions (conversation threads).
 *
 * **Responsibilities:** Foreign keys to user/book; timestamps for ordering sessions; message relation container.
 *
 * **Integration notes:** Deleting a session cascades messages depending on DB rules—verify onDelete semantics in migrations when not using synchronize.
 */

// src/ai/entities/ai-chat-session.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';
import { AiChatMessage } from './ai-chat-message.entity';

/** Per user + book; multiple sessions per book allowed (no @Unique on pair). */
@Entity('ai_chat_sessions')
export class AiChatSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.aiChatSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Book, (book) => book.aiChatSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  @Index()
  @Column({ type: 'uuid' })
  bookId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ─── Relations ───
  // Full thread via relations: ['messages']
  @OneToMany(() => AiChatMessage, (msg) => msg.session)
  messages!: AiChatMessage[];
}