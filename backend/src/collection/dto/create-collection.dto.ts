/**
 * @module create-collection.dto
 *
 * **Purpose:** Validate collection name when creating a user shelf.
 *
 * **Responsibilities:** Enforce non-empty bounded string input.
 *
 * **Integration notes:** Uniqueness per user (if required) belongs in services, not DTOs.
 */

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
