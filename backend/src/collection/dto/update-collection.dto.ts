/**
 * @module update-collection.dto
 *
 * **Purpose:** Validate renaming a collection with the same constraints as creation.
 *
 * **Responsibilities:** Single required field with length cap for simplicity.
 *
 * **Integration notes:** Partial updates could be merged with `PartialType` if rename-only becomes insufficient.
 */

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCollectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
