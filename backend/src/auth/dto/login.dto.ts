/**
 * @module login.dto
 *
 * **Purpose:** Minimal credential payload validation for `/auth/login` style endpoints.
 *
 * **Responsibilities:** Validate email shape and password length bounds only.
 *
 * **Integration notes:** Account lockout and password verification occur in services, not here.
 */

import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Login payload: email + password.
 * Account checks and password verification happen in AuthService; this DTO only shapes input.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Password must be less than 64 characters long' })
  password!: string;
}