/**
 * @module app/core/services/token.service
 *
 * **Purpose:** Thin wrapper around `localStorage` for JWT access/refresh tokens using shared
 * key constants.
 *
 * **Responsibilities:** Read/write/clear tokens; expose `hasAccessToken` for guard checks.
 *
 * **Integration notes:** Synchronous and global to the tab; clearing tokens does not notify
 * `AuthService`—callers must orchestrate logout. Not suitable for SSR (browser-only storage).
 */
import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';

@Injectable({
  providedIn: 'root',
})
export class TokenService {

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }
}