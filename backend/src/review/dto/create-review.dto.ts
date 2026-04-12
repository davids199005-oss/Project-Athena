/**
 * @module create-review.dto
 *
 * **Purpose:** Validate star rating and optional review text for book reviews.
 *
 * **Responsibilities:** Clamp rating to 1–5; allow empty text for rating-only reviews depending on UI.
 *
 * **Integration notes:** Uniqueness (one review per user/book) is enforced in `ReviewService`, not here.
 */

import { IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  text?: string;
}