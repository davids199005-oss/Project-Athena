/**
 * @module app/features/auth/auth.routes
 *
 * **Purpose:** Lazy routes for email/password (and UI) auth screens mounted under `/auth`.
 *
 * **Responsibilities:** Map `login` and `register` paths to standalone components.
 *
 * **Integration notes:** Parent route in `app.routes.ts` applies `guestGuard`; OAuth callback
 * lives outside this module at `/auth/callback`.
 */
import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(c => c.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then(c => c.RegisterComponent),
  },
];