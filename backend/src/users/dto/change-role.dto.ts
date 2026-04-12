/**
 * @module change-role.dto
 *
 * **Purpose:** Admin-only role change payload with a constrained enum surface.
 *
 * **Responsibilities:** Prevent arbitrary role strings from entering the domain layer.
 *
 * **Integration notes:** Authorization to call endpoints carrying this DTO must still be enforced via guards.
 */

// src/users/dto/change-role.dto.ts

import { IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

/**
 * Admin role change: single `role` field; @IsEnum restricts to UserRole values.
 */
export class ChangeRoleDto {
  @IsEnum(UserRole, { message: 'Role must be either USER or ADMIN' })
  role!: UserRole;
}