/**
 * @module roles.decorator
 *
 * **Purpose:** Declare required role sets for endpoints enforced by `RolesGuard`.
 *
 * **Responsibilities:** Store role metadata under `ROLES_KEY` for reflection at runtime.
 *
 * **Integration notes:** Effective only when `RolesGuard` is applied and JWT user includes `role`.
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Metadata key RolesGuard reads via Reflector.
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles(...) — required roles for a handler (OR semantics when multiple values).
 * Example: @Roles(UserRole.ADMIN) or @Roles(UserRole.ADMIN, UserRole.USER).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);