/**
 * @module review.module
 *
 * **Purpose:** Compose review persistence with book aggregates for rating updates.
 *
 * **Responsibilities:** Register `Review` and `Book` repositories for transactional updates in `ReviewService`.
 *
 * **Integration notes:** Exports TypeORM module for potential cross-module repository access patterns.
 */

import { Module } from '@nestjs/common';
import { Review } from './entities/review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { Book } from '../books/entities/book.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Review, Book])],
    controllers: [ReviewController],
    providers: [ReviewService],
    exports: [TypeOrmModule],
})
export class ReviewModule {}
