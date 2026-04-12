/**
 * @module collection.module
 *
 * **Purpose:** Nest module for shelf/collection features and join table between collections and books.
 *
 * **Responsibilities:** Register entities; export `CollectionService` for auth registration side effects.
 *
 * **Integration notes:** `AuthService` imports this service to seed default collections—avoid circular imports elsewhere.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from './entities/collection.entity';
import { CollectionBook } from './entities/collection-book.entity';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Collection, CollectionBook])],
  controllers: [CollectionController],
  providers: [CollectionService],
  exports: [CollectionService],
})
export class CollectionModule {}
