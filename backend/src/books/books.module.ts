/**
 * @module books.module
 *
 * **Purpose:** Nest module boundary for book entities, catalog service, parser, and AI/notification imports.
 *
 * **Responsibilities:** Register TypeORM features, wire `BooksController`, export repositories/service for other modules.
 *
 * **Integration notes:** Exports `BooksService` for AI/collection flows; imports `AiModule` for embeddings/summaries.
 */

import { Module } from '@nestjs/common';
import { Book } from './entities/book.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookChunk } from './entities/book-chunk.entity';
import { BookSummary } from './entities/book-summary.entity';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BooksParserService } from './books-parser.service';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [
      TypeOrmModule.forFeature([Book, BookChunk, BookSummary]),
      AiModule,
      NotificationModule,
    ],
    controllers: [BooksController],
    providers: [BooksService, BooksParserService],
    exports: [TypeOrmModule, BooksService],
})
export class BooksModule {}
