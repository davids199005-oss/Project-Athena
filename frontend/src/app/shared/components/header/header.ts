/**
 * @module app/shared/components/header/header
 *
 * **Purpose:** Top brand bar with logo/title linking home for consistent navigation context.
 *
 * **Responsibilities:** Static presentation with `RouterLink` to `/catalog`.
 *
 * **Integration notes:** Complements `NavbarComponent` which holds interactive menus.
 * Brand artwork (`/images/header/header.png`) is intentionally framed to read as a jewel on the glass shell.
 */
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {}