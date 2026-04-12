/**
 * @module collection.controller
 *
 * **Purpose:** HTTP API for user-defined book collections and membership management.
 *
 * **Responsibilities:** Map CRUD routes to `CollectionService`; scope operations via `@CurrentUser()`.
 *
 * **Integration notes:** Duplicate membership rules are enforced in services with `ConflictException` where applicable.
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
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Controller()
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  // ─── Collection CRUD ───

  @Post('collections')
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collectionService.create(userId, dto);
  }

  @Get('collections')
  findAll(@CurrentUser('id') userId: string) {
    return this.collectionService.findAll(userId);
  }

  @Get('collections/:id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collectionService.findOne(userId, id);
  }

  @Patch('collections/:id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionService.update(userId, id, dto);
  }

  @Delete('collections/:id')
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collectionService.remove(userId, id);
  }

  // ─── Collection Books ───

  @Post('collections/:id/books/:bookId')
  addBook(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('bookId', ParseUUIDPipe) bookId: string,
  ) {
    return this.collectionService.addBook(userId, id, bookId);
  }

  @Delete('collections/:id/books/:bookId')
  removeBook(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('bookId', ParseUUIDPipe) bookId: string,
  ) {
    return this.collectionService.removeBook(userId, id, bookId);
  }

  // ─── Book Collections ───

  @Get('books/:bookId/collections')
  getBookCollections(
    @CurrentUser('id') userId: string,
    @Param('bookId', ParseUUIDPipe) bookId: string,
  ) {
    return this.collectionService.getBookCollections(userId, bookId);
  }
}
