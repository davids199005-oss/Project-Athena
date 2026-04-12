/**

 * @module query-books.dto

 *

 * **Purpose:** Typed catalog filters, sorting, and pagination for public book listing endpoints.

 *

 * **Responsibilities:** Whitelist sort fields via enum; coerce numeric query params; constrain search/sort inputs.

 *

 * **Integration notes:** `search` feeds PostgreSQL full-text (`plainto_tsquery`)—syntax differs from fuzzy search.

 */



// src/books/dto/query-books.dto.ts



import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { Type } from 'class-transformer';



/**

 * Whitelisted ORDER BY fields (avoids raw string injection into ORDER BY).

 */

export enum BookSortBy {

  CREATED_AT = 'createdAt',

  RATING = 'rating',

  TITLE = 'title',

  PUBLISHED_YEAR = 'publishedYear',

}



export enum SortOrder {

  ASC = 'ASC',

  DESC = 'DESC',

}



/**

 * GET /api/books query string. Values arrive as strings; @Type(() => Number) coerces numeric fields before validation.

 */

export class QueryBooksDto {

  // ─── Pagination ───



  @IsOptional()

  @Type(() => Number)

  @IsInt()

  @Min(1)

  page?: number = 1;



  @IsOptional()

  @Type(() => Number)

  @IsInt()

  @Min(1)

  @Max(50)

  limit?: number = 12;



  // ─── Filters ───



  @IsOptional()

  @IsString()

  genre?: string;



  @IsOptional()

  @IsString()

  language?: string;



  @IsOptional()

  @Type(() => Number)

  @Min(0)

  @Max(5)

  minRating?: number;



  // ─── Search ───

  // Full-text via searchVector / plainto_tsquery



  @IsOptional()

  @IsString()

  search?: string;



  // ─── Sort ───



  @IsOptional()

  @IsEnum(BookSortBy)

  sortBy?: BookSortBy = BookSortBy.CREATED_AT;



  @IsOptional()

  @IsEnum(SortOrder)

  sortOrder?: SortOrder = SortOrder.DESC;

}

