/**
 * @module app/features/auth/oauth-callback/oauth-callback
 *
 * **Purpose:** OAuth redirect target that exchanges httpOnly cookies for JWTs via `/auth/oauth/exchange`.
 *
 * **Responsibilities:** Call exchange endpoint to retrieve tokens from httpOnly cookies set during
 * OAuth redirect; persist via `TokenService`; hydrate user with `getMe()`; navigate to catalog or show error.
 *
 * **Integration notes:** Tokens are never exposed in URL query parameters — they travel in httpOnly
 * cookies that are exchanged once and cleared server-side.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TokenService } from '../../../core/services/token.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-oauth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="oauth-callback">
      @if (error()) {
        <p>{{ error() }}</p>
        <p>Redirecting to login...</p>
      } @else {
        <p>Signing you in...</p>
      }
    </div>
  `,
  styles: [`
    .oauth-callback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-size: 1.2rem;
      color: var(--p-text-muted-color);
    }
  `],
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private authService = inject(AuthService);

  error = signal<string | null>(null);

  ngOnInit(): void {
    const errorParam = this.route.snapshot.queryParams['error'];

    if (errorParam) {
      this.error.set('Authentication failed. Please try again.');
      setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      return;
    }

    // Exchange httpOnly cookies for tokens via backend endpoint
    this.http.post<{ accessToken: string; refreshToken: string }>(
      `${environment.apiUrl}/auth/oauth/exchange`, {},
      { withCredentials: true },
    ).subscribe({
      next: (res) => {
        this.tokenService.setTokens(res.accessToken, res.refreshToken);
        this.authService.getMe().subscribe({
          next: () => this.router.navigate(['/catalog']),
          error: () => {
            this.tokenService.clearTokens();
            this.error.set('Failed to load user profile.');
            setTimeout(() => this.router.navigate(['/auth/login']), 3000);
          },
        });
      },
      error: () => {
        this.error.set('Failed to complete authentication.');
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
    });
  }
}
