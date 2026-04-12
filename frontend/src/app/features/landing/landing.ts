/**
 * @module app/features/landing/landing
 *
 * **Purpose:** Marketing/home route (`''`) with CTA to catalog/auth; adapts copy when a token exists.
 *
 * **Responsibilities:** Read `TokenService` once at construction to seed `isLoggedIn` signal for template branching.
 *
 * **Integration notes:** Signal does not react to login events on this page without refresh—acceptable for landing; router navigation replaces the view after auth.
 * Visual motion is CSS-driven (mesh/parallax drift) to avoid extra listeners and respect reduced-motion globally.
 */
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { TokenService } from '../../core/services/token.service';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Button],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private tokenService = inject(TokenService);
  isLoggedIn = signal(this.tokenService.hasAccessToken());
}