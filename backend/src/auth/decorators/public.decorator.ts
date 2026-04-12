/**
 * @module public.decorator
 *
 * **Purpose:** Metadata flag consumed by `JwtAuthGuard` to bypass JWT checks for explicit routes.
 *
 * **Responsibilities:** Attach `IS_PUBLIC_KEY` metadata to handlers/controllers.
 *
 * **Integration notes:** Misuse on sensitive routes would expose endpoints—pair with route review and tests.
 */

import { SetMetadata } from '@nestjs/common';

// Metadata key read by JwtAuthGuard
export const IS_PUBLIC_KEY = 'isPublic';

// @Public() — skip JWT for this route
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);