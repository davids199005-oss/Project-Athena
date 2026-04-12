/**
 * @module review.entity
 *
 * **Purpose:** ORM model for user-authored book reviews driving aggregate rating fields on `Book`.
 *
 * **Responsibilities:** Enforce uniqueness per (user, book); index foreign keys for admin listings.
 *
 * **Integration notes:** Service layer must update denormalized averages when rows change—no DB triggers assumed here.
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

// One review per user per book; edits update the same row.
@Unique(['userId', 'bookId'])
@Entity('reviews')
export class Review {
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

  // Rating 1–5; range validation lives on DTOs, not the entity schema.
  @Column({ type: 'int' })
  rating!: number;

  // Optional review body (stars-only allowed).
  @Column({ type: 'text', nullable: true })
  text!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  // updatedAt tracks edits to the review text/rating.
  @UpdateDateColumn()
  updatedAt!: Date;
}
