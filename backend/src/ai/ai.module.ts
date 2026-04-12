/**
 * @module ai.module
 *
 * **Purpose:** Compose AI persistence entities, OpenAI service, REST controller, and Socket.IO gateway.
 *
 * **Responsibilities:** Register `AiService` providers; import JWT module for gateway auth; expose entities via TypeORM.
 *
 * **Integration notes:** `JwtModule.register({})` supplies defaults—gateway validates tokens independently of HTTP guards.
 */

import { Module } from '@nestjs/common';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiLog } from './entities/ai-log.entity';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiGateway } from './ai.gateway';
import { BookChunk } from '../books/entities/book-chunk.entity';
import { BookSummary } from '../books/entities/book-summary.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiChatSession, AiChatMessage, AiLog, BookChunk, BookSummary]),
    ConfigModule,
    JwtModule.register({}),
  ],
  controllers: [AiController],
  providers: [AiService, AiGateway],
  exports: [AiService, TypeOrmModule],
})
export class AiModule {}
