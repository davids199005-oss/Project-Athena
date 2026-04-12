/**
 * @module app/app
 *
 * **Purpose:** Root shell component that wraps routed content with global chrome (header,
 * navbar, footer, chat widget, toast host) and toggles that chrome based on route.
 *
 * **Responsibilities:** On init, hydrate the current user via `AuthService.getMe()` when a
 * token exists; subscribe to `NavigationEnd` and compute `showLayout` so auth and marketing
 * landing stay visually distinct.
 *
 * **Integration notes:** Layout visibility uses `urlAfterRedirects` to match the final URL.
 * `shellScrolled` drives the fixed top shell shrink state (visual only).
 * Logged-out users on `/` see no shell; logged-in users on `/` still get the shell. `getMe()`
 * mutates `AuthService` state used by guards and header; runs once at startup, not on every
 * navigation.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, inject, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { HeaderComponent } from './shared/components/header/header';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, NavbarComponent, FooterComponent, ChatWidgetComponent, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  showLayout = signal(true);

  /** Shrinks the fixed top shell after scroll for a premium “toolbar” feel. */
  shellScrolled = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.shellScrolled.set(window.scrollY > 16);
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.authService.getMe().subscribe();
    }

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.showLayout.set(
          !(url.startsWith('/auth') || (url === '/' && !this.authService.isLoggedIn)),
        );
      });
  }
}
