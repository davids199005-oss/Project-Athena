/**

 * @module create-book.dto

 *

 * **Purpose:** Validate admin book creation metadata alongside multipart file uploads handled in controllers.

 *

 * **Responsibilities:** Enforce string length/range constraints; constrain enums for genre/language/file type.

 *

 * **Integration notes:** File bodies are not part of this DTO—Multer populates separate arguments in the controller.

 */



// src/books/dto/create-book.dto.ts



import {

  IsEnum,

  IsInt,

  IsOptional,

  IsString,

  Length,

  Max,

  Min,

} from 'class-validator';

import { Type } from 'class-transformer';

import { BookFileType } from '../entities/book.entity';



/**

 * ADMIN create metadata. Book/cover binaries come from Multer, not this JSON body.

 * Multipart sends numbers as strings—use @Type(() => Number) before @IsInt().

 */

export class CreateBookDto {

  @IsString()

  @Length(1, 500)

  title!: string;



  @IsString()

  @Length(1, 255)

  author!: string;



  @IsOptional()

  @IsString()

  description?: string;



  @IsString()

  @Length(1, 100)

  genre!: string;



  @IsString()

  @Length(1, 50)

  language!: string;



  @IsOptional()

  @IsString()

  @Length(1, 20)

  isbn?: string;



  @IsOptional()

  @Type(() => Number)

  @IsInt()

  @Min(1)

  pageCount?: number;



  @IsOptional()

  @Type(() => Number)

  @IsInt()

  @Min(1000)

  @Max(2100)

  publishedYear?: number;



  @IsEnum(BookFileType, { message: 'fileType must be either EPUB or PDF' })

  fileType!: BookFileType;

}

