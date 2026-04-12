/**
 * @module main
 *
 * **Purpose:** Application entry point that bootstraps the root Angular component with the
 * shared `ApplicationConfig`, enabling standalone bootstrap without `AppModule`.
 *
 * **Responsibilities:** Invoke `bootstrapApplication`, wire `App` + `appConfig`, and surface
 * fatal bootstrap errors to the console (no custom error UI here).
 *
 * **Integration notes:** `appConfig` pulls in router, HTTP (with `authInterceptor`), PrimeNG,
 * and animations; failures during provider setup surface here. Changing bootstrap target or
 * config must stay aligned with `index.html` root selector.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
