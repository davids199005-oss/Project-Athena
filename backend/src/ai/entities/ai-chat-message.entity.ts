/**
 * @module ai-chat-message.entity
 *
 * **Purpose:** Persist ordered chat turns for RAG conversations, including token usage metadata when available.
 *
 * **Responsibilities:** Store role discriminator; link to session; optional `tokensUsed` for assistant rows.
 *
 * **Integration notes:** Streaming responses may persist `tokensUsed = 0` when usage metadata is unavailable.
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
import { AiChatSession } from './ai-chat-session.entity';

/** Mirrors OpenAI chat roles for replay from DB into `messages[]`. */
export enum ChatMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('ai_chat_messages')
export class AiChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Session container; CASCADE deletes messages with the session
  @ManyToOne(() => AiChatSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session!: AiChatSession;

  @Index()
  @Column({ type: 'uuid' })
  sessionId!: string;

  // user | assistant
  @Column({ type: 'enum', enum: ChatMessageRole })
  role!: ChatMessageRole;

  // Message body
  @Column({ type: 'text' })
  content!: string;

  // Assistant completion tokens (null for user rows)
  @Column({ type: 'int', nullable: true })
  tokensUsed!: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
