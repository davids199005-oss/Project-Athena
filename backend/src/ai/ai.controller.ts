/**
 * @module ai.controller
 *
 * **Purpose:** REST surface for semantic search, recommendations, summaries, and chat session lifecycle.
 *
 * **Responsibilities:** Map DTOs to `AiService`; apply throttles where annotated; attach current user from JWT.
 *
 * **Integration notes:** Heavy operations (embeddings, chat) should stay rate-limited—WebSocket streaming uses `AiGateway` instead.
 */

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SearchChunksDto } from './dto/search-chunks.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // POST /api/ai/search — semantic chunk search
  @Post('search')
  async searchChunks(@Body() dto: SearchChunksDto) {
    return this.aiService.searchChunks(dto.query, dto.bookId, dto.limit);
  }

  // GET /api/ai/recommendations/:bookId — similar books
  @Get('recommendations/:bookId')
  async getRecommendations(
    @Param('bookId', ParseUUIDPipe) bookId: string,
  ) {
    return this.aiService.getRecommendations(bookId);
  }

  // POST /api/ai/sessions — create chat session for a book
  @Post('sessions')
  async createSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChatDto,
  ) {
    return this.aiService.createSession(userId, dto.bookId);
  }

  // GET /api/ai/sessions — list user sessions
  @Get('sessions')
  async getSessions(@CurrentUser('id') userId: string) {
    return this.aiService.getSessions(userId);
  }

  // DELETE /api/ai/sessions/:id — delete chat session
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.deleteSession(sessionId, userId);
  }

  // GET /api/ai/sessions/:id/messages — session message history
  @Get('sessions/:id/messages')
  async getMessages(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.getMessages(sessionId, userId);
  }

  // POST /api/ai/sessions/:id/messages — send message, non-streaming reply
  @Throttle({
    short: { limit: 1, ttl: 1000 },
    medium: { limit: 5, ttl: 10000 },
    long: { limit: 10, ttl: 60000 },
  })
  @Post('sessions/:id/messages')
  async sendMessage(
    @Param('id', ParseUUIDPipe) sessionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiService.sendMessage(sessionId, userId, dto.content);
  }
  }
