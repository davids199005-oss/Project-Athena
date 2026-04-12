/**
 * @module environments/environment.prod
 *
 * **Purpose:** Production build replacement for `environment.ts` (fewer keys, `production: true`).
 *
 * **Responsibilities:** Provide `apiUrl` for same-origin API routes in deployment.
 *
 * **Integration notes:** Missing `wsUrl` means any code that reads it must tolerate `undefined`
 * or rely on build-time assumptions—verify Socket.IO URL strategy for prod before enabling features.
 */
export const environment = {
    production: true,
    apiUrl: '/api',
    wsUrl: '',  // same-origin — Socket.IO will connect to window.location.origin
  };