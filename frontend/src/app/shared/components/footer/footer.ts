/**
 * @module app/shared/components/footer/footer
 *
 * **Purpose:** Static footer shell for global layout branding and links.
 *
 * **Responsibilities:** Template-only chrome; no state.
 *
 * **Integration notes:** Rendered inside `App` when `showLayout` is true.
 */
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {}