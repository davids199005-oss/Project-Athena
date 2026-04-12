/**
 * @module notification.entity
 *
 * **Purpose:** Persisted user notifications with optional deep links into the SPA.
 *
 * **Responsibilities:** Store enum-typed `NotificationType`; track read state; index by user + recency.
 *
 * **Integration notes:** `link` is an app-relative path—clients must validate before navigation if untrusted.
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

export enum NotificationType {
  NEW_BOOK = 'NEW_BOOK',
  SUMMARY_READY = 'SUMMARY_READY',
  READING_REMINDER = 'READING_REMINDER',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  // App-relative navigation target on click (e.g. /books/:id)
  @Column({ type: 'varchar', length: 500, nullable: true })
  link!: string | null;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
