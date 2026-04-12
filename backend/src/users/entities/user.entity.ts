/**
 * @module user.entity
 *
 * **Purpose:** ORM model for authentication identity, profile fields, OAuth linkage, and security counters.
 *
 * **Responsibilities:** Map columns for JWT claims (`role`), refresh token hash storage, and lockout state.
 *
 * **Integration notes:** Refresh tokens are stored hashed—never log raw tokens. OAuth users may have `passwordHash = null`.
 */

// src/users/entities/user.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReadingProgress } from '../../reading/entities/reading-progress.entity';
import { Bookmark } from '../../reading/entities/bookmark.entity';
import { Favorite } from '../../reading/entities/favorite.entity';
import { Review } from '../../review/entities/review.entity';
import { AiChatSession } from '../../ai/entities/ai-chat-session.entity';
import { AiLog } from '../../ai/entities/ai-log.entity';
import { Collection } from '../../collection/entities/collection.entity';
import { Exclude } from 'class-transformer';
/** Application roles (used in guards and DTOs). */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  // Null for OAuth users (no local password)
  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  // enum column → CHECK constraint in PostgreSQL
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  // OAuth provider id or null for local accounts
  @Column({ type: 'varchar', length: 50, nullable: true })
  oauthProvider!: string | null;

  // Provider subject id
  @Column({ type: 'varchar', length: 255, nullable: true })
  oauthId!: string | null;

  // Stored hash of refresh token (logout / rotation invalidates)
  @Exclude()
  @Column({ type: 'varchar', length: 500, nullable: true })
  refreshToken!: string | null;

  @Column({ type: 'boolean', default: false })
  isBlocked!: boolean;

  // ─── Account Lockout (OWASP A04: Insecure Design) ───
  // Failed login counter; reset on success; 5 failures → 15m lockoutUntil
  @Column({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  // Lockout expiry; null = not locked out
  @Column({ type: 'timestamp', nullable: true })
  lockoutUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ─── Inverse OneToMany sides (enable relations: ['reviews'], etc.) ───

  @OneToMany(() => ReadingProgress, (rp) => rp.user)
  readingProgress!: ReadingProgress[];

  @OneToMany(() => Bookmark, (b) => b.user)
  bookmarks!: Bookmark[];

  @OneToMany(() => Favorite, (f) => f.user)
  favorites!: Favorite[];

  @OneToMany(() => Review, (r) => r.user)
  reviews!: Review[];

  @OneToMany(() => AiChatSession, (s) => s.user)
  aiChatSessions!: AiChatSession[];

  @OneToMany(() => AiLog, (l) => l.user)
  aiLogs!: AiLog[];

  @OneToMany(() => Collection, (c) => c.user)
  collections!: Collection[];
}