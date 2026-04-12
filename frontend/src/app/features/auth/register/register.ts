/**
 * @module app/features/auth/register/register
 *
 * **Purpose:** Email/password registration form with validation and optional OAuth entry points.
 *
 * **Responsibilities:** Build reactive form; call `AuthService.register`; navigate on success; surface API errors.
 *
 * **Integration notes:** Successful register uses same `handleAuthResponse` path as login via service tap—tokens stored before navigation.
 */
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { OAuthButtonsComponent } from '../../../shared/components/oauth-buttons/oauth-buttons';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, InputText, Password, Button, Message, OAuthButtonsComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
  });

  errorMessage = signal('');
  isLoading = signal(false);

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/catalog']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
      },
    });
  }
}
