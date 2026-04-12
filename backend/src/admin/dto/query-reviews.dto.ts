/**
 * @module query-reviews.dto
 *
 * **Purpose:** Validation and coercion for paginated admin review listing queries.
 *
 * **Responsibilities:** Constrain page/limit bounds; whitelist sort fields to reduce SQL injection surface via controlled keys.
 *
 * **Integration notes:** Used with `ValidationPipe` (transform enabled) so string query params coerce to numbers.
 */

import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryReviewsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['createdAt', 'rating'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
