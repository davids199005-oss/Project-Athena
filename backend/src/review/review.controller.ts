/**
 * @module review.controller
 *
 * **Purpose:** REST endpoints for book reviews created by authenticated users.
 *
 * **Responsibilities:** Delegate to `ReviewService`; pass current user id for ownership checks.
 *
 * **Integration notes:** Rating aggregation side effects live in the service layer when reviews change.
 */

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    ParseUUIDPipe,
  } from '@nestjs/common';
  import { CurrentUser } from '../auth/decorators/current-user.decorator';
  import { ReviewService } from './review.service';
  import { CreateReviewDto } from './dto/create-review.dto';
  import { UpdateReviewDto } from './dto/update-review.dto';
  
  @Controller()
  export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}
  
    @Post('books/:bookId/reviews')
    create(
      @CurrentUser('id') userId: string,
      @Param('bookId', ParseUUIDPipe) bookId: string,
      @Body() dto: CreateReviewDto,
    ) {
      return this.reviewService.create(userId, bookId, dto);
    }
  
    @Get('books/:bookId/reviews')
    getByBook(@Param('bookId', ParseUUIDPipe) bookId: string) {
      return this.reviewService.getByBook(bookId);
    }
  
    @Patch('reviews/:id')
    update(
      @CurrentUser('id') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdateReviewDto,
    ) {
      return this.reviewService.update(userId, id, dto);
    }
  
    @Delete('reviews/:id')
    remove(
      @CurrentUser('id') userId: string,
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return this.reviewService.remove(userId, id);
    }
  }