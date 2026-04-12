/**
 * @module collection.entity
 *
 * **Purpose:** ORM model for user-owned named collections (shelves) with optional default flags.
 *
 * **Responsibilities:** Relate to `CollectionBook` join rows; enforce per-user name uniqueness when configured.
 *
 * **Integration notes:** Default collections are created in `CollectionService` during auth registration.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CollectionBook } from './collection-book.entity';

@Unique(['userId', 'name'])
@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (u) => u.collections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  // Prevents delete/rename of system (default) collections
  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  // Display order in the UI
  @Column({ type: 'int', default: 0 })
  position!: number;

  @OneToMany(() => CollectionBook, (cb) => cb.collection)
  collectionBooks!: CollectionBook[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
