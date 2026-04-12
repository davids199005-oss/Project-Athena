/**
 * @module register.dto
 *
 * **Purpose:** Input validation contract for credential registration endpoint bodies.
 *
 * **Responsibilities:** Enforce email/password/name formats before hitting `AuthService.register`.
 *
 * **Integration notes:** Regex constraints are not a substitute for server-side uniqueness checks against the DB.
 */

import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Registration body contract for POST /api/auth/register.
 * Global ValidationPipe validates against these decorators; failures return 400 before handlers run.
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email must be less than 255 characters long' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Password must be less than 64 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100)
  lastName!: string;
}