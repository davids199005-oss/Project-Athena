/**
 * @module change-password.dto
 *
 * **Purpose:** Validate password rotation with confirmation to prevent typos in credentials updates.
 *
 * **Responsibilities:** Minimum length policy for new password; require current password for verification.
 *
 * **Integration notes:** Strength rules beyond length are not enforced here—could be extended with custom validators.
 */

import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
