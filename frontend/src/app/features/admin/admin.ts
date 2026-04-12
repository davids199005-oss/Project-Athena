/**
 * @module app/features/admin/admin
 *
 * **Purpose:** Layout wrapper for the `/admin` section: sidebar navigation and outlet for
 * nested admin feature routes.
 *
 * **Responsibilities:** Provide `RouterLink` / `RouterLinkActive` chrome only; no data loading.
 *
 * **Integration notes:** Actual route guards (`authGuard`, `adminGuard`) are on the parent
 * route in `app.routes.ts`; this component assumes the user is already authorized.
 */
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class AdminComponent {}