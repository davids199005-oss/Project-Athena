/**
 * @module app/core/interceptors/auth.interceptor
 *
 * **Purpose:** Functional HTTP interceptor that attaches JWT access tokens, refreshes on 401,
 * and logs the user out when refresh is impossible or fails.
 *
 * **Responsibilities:** Clone requests with `Authorization` when an access token exists; skip
 * for refresh endpoint to avoid overriding the refresh-token header set by `AuthService`;
 * on 401, chain `refreshTokens` and retry once with the new access token.
 *
 * **Integration notes:** Side effects: may call `authService.logout()` which clears tokens and
 * navigates—global to the app. Recursive refresh loops are prevented by excluding `/auth/refresh`
 * from the retry branch. Login/register 401s still propagate; callers handle those.
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  // Do not attach the access token to refresh requests — `AuthService.refreshTokens` sets `Authorization` to the refresh JWT explicitly
  if (!req.url.includes('/auth/refresh')) {
    const accessToken = tokenService.getAccessToken();
    if (accessToken) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${accessToken}` },
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        const refreshToken = tokenService.getRefreshToken();

        if (refreshToken) {
          return authService.refreshTokens().pipe(
            switchMap(() => {
              const newToken = tokenService.getAccessToken();
              const clonedReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(clonedReq);
            }),
            catchError(() => {
              authService.logout();
              return throwError(() => error);
            }),
          );
        }

        authService.logout();
      }

      return throwError(() => error);
    }),
  );
};