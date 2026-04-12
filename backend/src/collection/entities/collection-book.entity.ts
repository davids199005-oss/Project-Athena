/**
 * @module collection-book.entity
 *
 * **Purpose:** Join table linking collections to catalog books with ordering metadata.
 *
 * **Responsibilities:** Prevent duplicate membership via unique constraints; store optional sort keys.
 *
 * **Integration notes:** Removing a book may cascade depending on DB rules—verify in migrations.
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
import { Collection } from './collection.entity';
import { Book } from '../../books/entities/book.entity';

// A book may appear at most once per collection
@Unique(['collectionId', 'bookId'])
@Entity('collection_books')
export class CollectionBook {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Collection, (c) => c.collectionBooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collectionId' })
  collection!: Collection;

  @Index()
  @Column({ type: 'uuid' })
  collectionId!: string;

  @ManyToOne(() => Book, (b) => b.collectionBooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  @Index()
  @Column({ type: 'uuid' })
  bookId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
