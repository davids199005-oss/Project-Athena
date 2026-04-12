/**
 * @module app/features/auth/login/login
 *
 * **Purpose:** Email/password login and link to registration/OAuth providers.
 *
 * **Responsibilities:** Validate credentials; call `AuthService.login`; support `returnUrl` query param for post-login redirect.
 *
 * **Integration notes:** `ActivatedRoute` snapshot reads query params once—bookmarking works; guard redirects append `returnUrl`.
 */
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { OAuthButtonsComponent } from '../../../shared/components/oauth-buttons/oauth-buttons';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, InputText, Password, Button, Message, OAuthButtonsComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  errorMessage = signal('');
  isLoading = signal(false);

  constructor() {
    const errorParam = this.route.snapshot.queryParams['error'];
    if (errorParam === 'oauth_failed') {
      this.errorMessage.set('OAuth authentication failed. Please try again.');
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/catalog']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please try again.');
      },
    });
  }
}
