/**

 * @module books.controller

 *

 * **Purpose:** HTTP API for book catalog queries, file download/streaming, and admin mutations

 * including multipart uploads.

 *

 * **Responsibilities:** Validate/route DTOs; attach Multer interceptors; enforce guards/roles where

 * applied; map service errors to HTTP exceptions indirectly via Nest.

 *

 * **Integration notes:** File paths from Multer are forwarded to `BooksService`—disk layout must stay

 * consistent with `initUploadDirs` and static hosting in `main.ts`.

 */



import {

  Body,

  Controller,

  Delete,

  Get,

  Param,

  ParseUUIDPipe,

  Patch,

  Post,

  Query,

  Res,

  UploadedFile,

  UploadedFiles,

  UseGuards,

  UseInterceptors,

  BadRequestException,

} from '@nestjs/common';

import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';

import type { Response } from 'express';

import { BooksService } from './books.service';

import { CreateBookDto } from './dto/create-book.dto';

import { UpdateBookDto } from './dto/update-book.dto';

import { QueryBooksDto } from './dto/query-books.dto';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { UserRole } from '../users/entities/user.entity';

import {

  combinedStorage,

  combinedFileFilter,

  coverStorage,

  coverFileFilter,

  BOOK_MAX_SIZE,

  COVER_MAX_SIZE,

} from '../utils/multer';



/**

 * Catalog routes (authenticated) vs admin CRUD (ADMIN + RolesGuard).

 */

@Controller('books')

export class BooksController {

  constructor(private readonly booksService: BooksService) {}



  // ═══════════════════════════════════════════

  // Catalog

  // ═══════════════════════════════════════════



  /**

   * GET /api/books — list with QueryBooksDto.

   */

  @Get()

  findAll(@Query() query: QueryBooksDto) {

    return this.booksService.findAll(query);

  }



  /**

   * GET /api/books/:id/file — stream EPUB/PDF for the reader (res.sendFile).

   */

  @Get(':id/file')

  async getFile(

    @Param('id', ParseUUIDPipe) id: string,

    @Res() res: Response,

  ) {

    const { absolutePath, fileType } = await this.booksService.getFilePath(id);



    const contentType = fileType === 'EPUB'

      ? 'application/epub+zip'

      : 'application/pdf';



    res.setHeader('Content-Type', contentType);

    res.sendFile(absolutePath);

  }



  // GET /api/books/:id/summary

  @Get(':id/summary')

  async getSummary(@Param('id', ParseUUIDPipe) id: string) {

    return this.booksService.getSummary(id);

  }



  // POST /api/books/:id/embeddings — recompute chunk embeddings

  @Post(':id/embeddings')

  @UseGuards(RolesGuard)

  @Roles(UserRole.ADMIN)

  regenerateEmbeddings(@Param('id', ParseUUIDPipe) id: string) {

    return this.booksService.regenerateEmbeddings(id);

  }



  /**

   * GET /api/books/:id — must stay after /:id/file and /:id/summary to avoid param shadowing.

   */

  @Get(':id')

  findOne(@Param('id', ParseUUIDPipe) id: string) {

    return this.booksService.findOne(id);

  }



  // ═══════════════════════════════════════════

  // CRUD (ADMIN only)

  // ═══════════════════════════════════════════



  /**

   * POST /api/books — multipart fields `file` (book) and optional `cover`.

   */

  @Post()

  @UseGuards(RolesGuard)

  @Roles(UserRole.ADMIN)

  @UseInterceptors(

    FileFieldsInterceptor(

      [

        { name: 'file', maxCount: 1 },

        { name: 'cover', maxCount: 1 },

      ],

      {

        storage: combinedStorage,

        fileFilter: combinedFileFilter,

        limits: { fileSize: BOOK_MAX_SIZE },

      },

    ),

  )

  create(

    @CurrentUser('id') userId: string,

    @Body() dto: CreateBookDto,

    @UploadedFiles()

    files: {

      file?: Express.Multer.File[];

      cover?: Express.Multer.File[];

    },

  ) {

    if (!files.file || files.file.length === 0) {

      throw new BadRequestException('Book file is required (EPUB or PDF)');

    }



    const filePath = files.file[0].path;



    const coverImageUrl = files.cover?.[0]?.path || undefined;



    return this.booksService.create(dto, filePath, coverImageUrl, userId);

  }



  /**

   * PATCH /api/books/:id — metadata JSON only.

   */

  @Patch(':id')

  @UseGuards(RolesGuard)

  @Roles(UserRole.ADMIN)

  update(

    @Param('id', ParseUUIDPipe) id: string,

    @Body() dto: UpdateBookDto,

  ) {

    return this.booksService.update(id, dto);

  }



  /**

   * PATCH /api/books/:id/cover — single multipart field `cover` (replaces file on disk in service).

   */

  @Patch(':id/cover')

  @UseGuards(RolesGuard)

  @Roles(UserRole.ADMIN)

  @UseInterceptors(

    FileInterceptor('cover', {

      storage: coverStorage,

      fileFilter: coverFileFilter,

      limits: { fileSize: COVER_MAX_SIZE },

    }),

  )

  updateCover(

    @Param('id', ParseUUIDPipe) id: string,

    @UploadedFile() file: Express.Multer.File,

  ) {

    if (!file) {

      throw new BadRequestException('Cover image file is required');

    }



    return this.booksService.updateCover(id, file.path);

  }



  /**

   * DELETE /api/books/:id — DB row + filesystem cleanup.

   */

  @Delete(':id')

  @UseGuards(RolesGuard)

  @Roles(UserRole.ADMIN)

  async remove(@Param('id', ParseUUIDPipe) id: string) {

    await this.booksService.remove(id);

    return { message: 'Book deleted successfully' };

  }

}

