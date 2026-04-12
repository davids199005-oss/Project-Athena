/**
 * @module environments/environment
 *
 * **Purpose:** Development environment configuration consumed via path mapping in `angular.json`
 * (replace file for production builds).
 *
 * **Responsibilities:** Expose `apiUrl`, `wsUrl`, and `production` flag for services and build tooling.
 *
 * **Integration notes:** `apiUrl: '/api'` assumes a dev proxy or same-origin gateway; `wsUrl`
 * points to the raw backend for Socket.IO during local dev. Not imported in server-side code.
 */
export const environment = {
    production: false,
    apiUrl: '/api',
    wsUrl: 'http://localhost:4000',
  };