/**
 * @module create-quote.dto
 *
 * **Purpose:** Validate user-saved quotes tied to a book with optional note and ordering metadata.
 *
 * **Responsibilities:** Constrain string lengths; capture optional page/position hints for UI re-navigation.
 *
 * **Integration notes:** Position formats are client-defined strings—server does not parse reader coordinates.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  MaxLength,
} from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  source?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  note?: string;

  @IsString()
  @IsOptional()
  cfiRange?: string;

  @IsInt()
  @IsOptional()
  pageNumber?: number;
}
