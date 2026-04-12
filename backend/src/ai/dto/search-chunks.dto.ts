/**
 * @module search-chunks.dto
 *
 * **Purpose:** Input contract for semantic chunk search (global or book-scoped) with optional top-k limit.
 *
 * **Responsibilities:** Coerce numeric limits; validate UUID scope; require query text for embedding.
 *
 * **Integration notes:** Higher limits increase OpenAI embedding cost and DB work—controller throttles should align.
 */

import { IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchChunksDto {
  // Query text embedded for cosine similarity search.
  @IsString()
  @IsNotEmpty()
  query!: string;

  // Optional scope: single book vs entire catalog.
  @IsOptional()
  @IsUUID()
  bookId?: string;

  // Top-k chunks (default 5); more context = higher prompt cost.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number = 5;
}