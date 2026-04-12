/**
 * @module app/features/admin/admin.routes
 *
 * **Purpose:** Child route table for the admin area: dashboard, books, users, reviews, with a
 * default redirect to the dashboard.
 *
 * **Responsibilities:** Lazy-load each admin screen component under the `AdminComponent` shell
 * whose path is `''` in this config (parent path is `/admin` from `app.routes`).
 *
 * **Integration notes:** Empty-path parent loads `AdminComponent` once; children swap inside
 * `router-outlet`. Order of redirects is standard: `''` → `dashboard`. All paths here are
 * relative to `/admin`.
 */
import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin').then(c => c.AdminComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./admin-dashboard/admin-dashboard').then(c => c.AdminDashboardComponent) },
      { path: 'books', loadComponent: () => import('./admin-books/admin-books').then(c => c.AdminBooksComponent) },
      { path: 'users', loadComponent: () => import('./admin-users/admin-users').then(c => c.AdminUsersComponent) },
      { path: 'reviews', loadComponent: () => import('./admin-reviews/admin-reviews').then(c => c.AdminReviewsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  }
];