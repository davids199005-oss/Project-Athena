/**
 * @module app/app.routes
 *
 * **Purpose:** Declares top-level lazy-loaded routes, auth boundaries, and the wildcard
 * fallback so navigation stays consistent with guard expectations.
 *
 * **Responsibilities:** Map URL segments to feature bundles (`loadComponent` / `loadChildren`),
 * apply `authGuard` / `guestGuard` / `adminGuard` where appropriate, and redirect unknown paths.
 *
 * **Integration notes:** OAuth callback is public (no guest guard) so the IdP redirect can
 * land without a logged-in session. `path: '**'` sends everything unknown to `catalog`, which
 * requires auth—unauthenticated users hitting bad URLs will be redirected by `authGuard`
 * (typically to login). Lazy imports keep initial bundle small; route order matters for the
 * catch-all.
 */
import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/oauth-callback/oauth-callback').then(c => c.OAuthCallbackComponent),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.authRoutes),
  },
  {
    path: 'catalog',
    canActivate: [authGuard],
    loadComponent: () => import('./features/catalog/catalog').then(c => c.CatalogComponent),
  },
  {
    path: 'books/:id/read',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reader/reader').then(c => c.ReaderComponent),
  },
  {
    path: 'books/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/book-detail/book-detail').then(c => c.BookDetailComponent),
  },
  {
    path: 'collections/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/collection/collection').then(c => c.CollectionComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then(c => c.ProfileComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(r => r.adminRoutes),
  },
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then(c => c.LandingComponent),
  },
  { path: '**', redirectTo: 'catalog' },
];