/**
 * @module update-user.dto
 *
 * **Purpose:** Partial profile updates (names, bio, avatar URL) for self-service editing.
 *
 * **Responsibilities:** Optional fields with string length constraints; validate URL shape for avatar references.
 *
 * **Integration notes:** Avatar file uploads may use a separate multipart flow—this DTO covers metadata updates only.
 */

// src/users/dto/update-user.dto.ts

import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

/**
 * PATCH profile: all fields optional; omitted keys stay unchanged.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;
}