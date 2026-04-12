/**
 * @module change-email.dto
 *
 * **Purpose:** Validate email change requests requiring password confirmation.
 *
 * **Responsibilities:** Enforce email format/max length; require current password string for re-auth.
 *
 * **Integration notes:** Actual password verification happens in the service layer, not in class-validator.
 */

import { IsEmail, IsString, MaxLength } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail()
  @MaxLength(255)
  newEmail!: string;

  @IsString()
  password!: string;
}
