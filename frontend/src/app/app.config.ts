/**
 * @module app/app.config
 *
 * **Purpose:** Central `ApplicationConfig` for the standalone Angular app: registers core
 * providers (router, HTTP, theming, global error hooks) in one place.
 *
 * **Responsibilities:** Define the Athena PrimeNG theme preset (semantic colors), enable
 * async animations, register `authInterceptor` on `HttpClient`, and expose `MessageService`
 * for PrimeNG toast usage app-wide.
 *
 * **Integration notes:** `provideHttpClient(withInterceptors([authInterceptor]))` means every
 * `HttpClient` call (including binary book downloads in the reader) gets JWT handling and
 * 401 refresh logic. `darkModeSelector: '.dark-mode'` is declarative only until a class is
 * toggled on `document`. `provideBrowserGlobalErrorListeners` forwards unhandled errors to
 * Angular's handler pipeline (behavior depends on Angular version defaults).
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { provideHttpClient } from '@angular/common/http';
import { withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { MessageService } from 'primeng/api';

// Semantic palette aligned with global CSS tokens — airy surfaces, teal/sapphire primary.
const AthenaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef8fb',
      100: '#d4eef6',
      200: '#a8dce9',
      300: '#6fc4d4',
      400: '#2db5a8',
      500: '#0f8ab8',
      600: '#0c7499',
      700: '#0a5f7d',
      800: '#0c2744',
      900: '#081a2e',
      950: '#040d18',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#faf9f7',
          100: '#f3f6f8',
          200: '#e8eef3',
          300: '#d5dee6',
          400: '#a8b8c6',
          500: '#7a8fa0',
          600: '#556b7d',
          700: '#3a4f60',
          800: '#243545',
          900: '#14232f',
          950: '#0a141c',
        },
        primary: {
          color: '#0f8ab8',
          inverseColor: '#ffffff',
          hoverColor: '#0c7499',
          activeColor: '#0c2744',
        },
        highlight: {
          background: '#eef8fb',
          focusBackground: '#d4eef6',
          color: '#0c2744',
          focusColor: '#0f8ab8',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideAnimationsAsync(),
    providePrimeNG({
      overlayAppendTo: 'body',
      theme: {
        preset: AthenaPreset,
        options: {
          darkModeSelector: '.dark-mode',
          cssLayer: false,
        },
      },
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    MessageService,
  ]
};
