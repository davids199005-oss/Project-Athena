/**
 * @module app/core/guards/guest.guard
 *
 * **Purpose:** Inverse guard for auth screens: only allow guests (no access token) so logged-in
 * users do not see login/register again.
 *
 * **Responsibilities:** If a token exists, redirect to `/catalog`; otherwise allow activation.
 *
 * **Integration notes:** Applied to `/auth` child routes; pairs with `authGuard` on app routes.
 */
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { inject } from '@angular/core';

export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.hasAccessToken()) {
    
    return router.createUrlTree(['/catalog']);
  }

  return true;
};
