/**
 * @module admin.module
 *
 * **Purpose:** Isolate admin controllers/services with explicit TypeORM feature imports for analytics queries.
 *
 * **Responsibilities:** Register `AdminController`/`AdminService` and required entities for aggregation.
 *
 * **Integration notes:** Does not re-export repositories—consumers use HTTP API only.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { Review } from '../review/entities/review.entity';
import { AiChatSession } from '../ai/entities/ai-chat-session.entity';
import { AiLog } from '../ai/entities/ai-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Book, Review, AiChatSession, AiLog]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
