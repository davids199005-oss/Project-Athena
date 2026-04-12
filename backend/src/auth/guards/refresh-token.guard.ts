/**
 * @module refresh-token.guard
 *
 * **Purpose:** Activate Passport `jwt-refresh` strategy for token rotation endpoints.
 *
 * **Responsibilities:** Thin `AuthGuard` subclass—behavior lives in `JwtRefreshStrategy`.
 *
 * **Integration notes:** Expects refresh tokens in the configured extractor (often cookies/headers per strategy).
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Uses Passport strategy `jwt-refresh` (refresh token rotation endpoints).
 */
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}