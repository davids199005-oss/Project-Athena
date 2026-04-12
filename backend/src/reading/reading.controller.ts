/**
 * @module reading.controller
 *
 * **Purpose:** HTTP API for per-user reading progress, bookmarks, favorites, highlights, quotes, and stats.
 *
 * **Responsibilities:** Bind `@CurrentUser()`; route DTOs to `ReadingService`; keep REST shapes stable for the client.
 *
 * **Integration notes:** All routes are user-scoped—never accept `userId` from clients without admin review.
 */

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    ParseUUIDPipe,
  } from '@nestjs/common';
  import { CurrentUser } from '../auth/decorators/current-user.decorator';
  import { ReadingService } from './reading.service';
  import { UpsertProgressDto } from './dto/upsert-progress.dto';
  import { CreateBookmarkDto } from './dto/create-bookmark.dto';
  import { CreateQuoteDto } from './dto/create-quote.dto';
  
  @Controller()
  export class ReadingController {
    constructor(private readonly readingService: ReadingService) {}
  
    // ─── Reading Progress ───
  
    @Put('books/:bookId/progress')
    upsertProgress(
      @CurrentUser('id') userId: string,
      @Param('bookId', ParseUUIDPipe) bookId: string,
      @Body() dto: UpsertProgressDto,
    ) {
      return this.readingService.upsertProgress(userId, bookId, dto);
    }
  
    @Get('books/:bookId/progress')
    getProgress(
      @CurrentUser('id') userId: string,
      @Param('bookId', ParseUUIDPipe) bookId: string,
    ) {
      return this.readingService.getProgress(userId, bookId);
    }
  
    @Get('reading/history')
    getHistory(@CurrentUser('id') userId: string) {
      return this.readingService.getHistory(userId);
    }
  
    // ─── Bookmarks ───
  
    @Post('books/:bookId/bookmarks')
    createBookmark(
      @CurrentUser('id') userId: string,
      @Param('bookId', ParseUUIDPipe) bookId: string,
      @Body() dto: CreateBookmarkDto,
    ) {
      return this.readingService.createBookmark(userId, bookId, dto);
    }
  
    @Get('books/:bookId/bookmarks')
    getBookmarks(
      @CurrentUser('id') userId: string,
      @Param('bookId', ParseUUIDPipe) bookId: string,
    ) {
      return this.readingService.getBookmarks(userId, bookId);
    }
  
    @Delete('bookmarks/:id')
    removeBookmark(
      @CurrentUser('id') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return this.readingService.removeBookmark(userId, id);
    }
  
    // ─── Favorites ───
  
    @Post('books/:bookId/favorite')
    addFavorite(
      @CurrentUser('id') userId: string,
      @Param('bookId', ParseUUIDPipe) bookId: string,
    ) {
      return this.readingService.addFavorite(userId, bookId);
    }
  
    @Delete('books/:bookId/favorite')
    removeFavorite(
      @CurrentUser('id') userId: string,
      @Param('bookId', ParseUUIDPipe) bookId: string,
    ) {
      return this.readingService.removeFavorite(userId, bookId);
    }
  
    @Get('favorites')
    getFavorites(@CurrentUser('id') userId: string) {
      return this.readingService.getFavorites(userId);
    }

    // ─── Quotes ───

    @Post('books/:bookId/quotes')
    createQuote(
      @CurrentUser('id') userId: string,
      @Param('bookId', ParseUUIDPipe) bookId: string,
      @Body() dto: CreateQuoteDto,
    ) {
      return this.readingService.createQuote(userId, bookId, dto);
    }

    @Get('books/:bookId/quotes')
    getQuotesByBook(
      @CurrentUser('id') userId: string,
      @Param('bookId', ParseUUIDPipe) bookId: string,
    ) {
      return this.readingService.getQuotesByBook(userId, bookId);
    }

    @Get('quotes')
    getAllQuotes(@CurrentUser('id') userId: string) {
      return this.readingService.getAllQuotes(userId);
    }

    // ─── Reading Stats ───

    @Get('reading/stats')
    getReadingStats(@CurrentUser('id') userId: string) {
      return this.readingService.getReadingStats(userId);
    }

    @Delete('quotes/:id')
    removeQuote(
      @CurrentUser('id') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return this.readingService.removeQuote(userId, id);
    }
  }