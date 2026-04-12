/**
 * @module upsert-progress.dto
 *
 * **Purpose:** Validate progress snapshots for a user/book pair (position + percent completion).
 *
 * **Responsibilities:** Keep `currentPosition` opaque string; clamp percent to 0–100 at validation layer.
 *
 * **Integration notes:** `currentPosition` format depends on client reader implementation (EPUB CFI, PDF page, etc.).
 */

import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class UpsertProgressDto {
  @IsString()
  @IsNotEmpty()
  currentPosition!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent!: number;
}