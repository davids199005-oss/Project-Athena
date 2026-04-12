/**
 * @module app/core/constants/storage.constants
 *
 * **Purpose:** Single source of truth for `localStorage` keys used by `TokenService` so renames
 * stay consistent and grep-friendly.
 *
 * **Responsibilities:** Export a const object of string keys; no runtime behavior.
 *
 * **Integration notes:** Changing values invalidates existing user sessions in storage (tokens
 * stored under old keys would be ignored).
 */
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
  } as const;