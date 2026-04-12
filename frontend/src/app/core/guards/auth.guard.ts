/**
 * @module app/core/guards/auth.guard
 *
 * **Purpose:** Route guard that requires a present access token (client-side session) before
 * entering protected areas like catalog or reader.
 *
 * **Responsibilities:** Read `TokenService.hasAccessToken()`; redirect unauthenticated users
 * to `/auth/login` via `UrlTree`.
 *
 * **Integration notes:** Token presence does not guarantee server validity—expired tokens may
 * still pass until the first HTTP 401 triggers refresh/logout in `authInterceptor`.
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.hasAccessToken()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};