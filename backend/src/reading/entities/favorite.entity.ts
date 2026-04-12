/**
 * @module favorite.entity
 *
 * **Purpose:** Many-to-many-lite user↔book favorites list with timestamps.
 *
 * **Responsibilities:** Unique constraint prevents duplicate favorites; relations enable catalog joins.
 *
 * **Integration notes:** Deleting books may require ON DELETE behavior alignment with migrations.
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
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';

// Unique (userId, bookId): duplicate favorites fail at the DB layer.
@Unique(['userId', 'bookId'])
@Entity('favorites')
export class Favorite {
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

  @CreateDateColumn()
  createdAt!: Date;
}
