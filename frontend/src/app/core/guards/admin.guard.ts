/**
 * @module app/core/guards/admin.guard
 *
 * **Purpose:** Restrict `/admin` routes to users whose role is `ADMIN`, using in-memory user
 * when available or `getMe()` to hydrate role after refresh.
 *
 * **Responsibilities:** Synchronously allow/deny when `currentUser` is populated; otherwise
 * return an observable from `getMe()` that maps to `true` or a catalog `UrlTree`.
 *
 * **Integration notes:** `getMe()` also updates `AuthService` subscribers as a side effect.
 * Non-admins never reach admin components; URL is replaced, not a full navigation stack reset.
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser) {
    return authService.currentUser.role === UserRole.ADMIN
      ? true
      : router.createUrlTree(['/catalog']);
  }

  return authService.getMe().pipe(
    map(user => {
      return user.role === UserRole.ADMIN
        ? true
        : router.createUrlTree(['/catalog']);
    }),
  );
};