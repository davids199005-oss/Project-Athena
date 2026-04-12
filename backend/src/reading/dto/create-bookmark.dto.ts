/**
 * @module create-bookmark.dto
 *
 * **Purpose:** Validate bookmark creation with a reader-specific position token and optional label.
 *
 * **Responsibilities:** Require non-empty position; enforce label length bounds when present.
 *
 * **Integration notes:** Does not verify that the position exists in the book file—only structural validation.
 */

import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  position!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;
}