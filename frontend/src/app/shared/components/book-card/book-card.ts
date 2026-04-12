/**
 * @module app/shared/components/book-card/book-card
 *
 * **Purpose:** Reusable catalog card showing cover, title, author, genre tags, and link to detail.
 *
 * **Responsibilities:** Accept `IBook` via required signal input; resolve cover URL with fallback placeholder logic.
 *
 * **Integration notes:** Pure presentation—parent lists own loading/error states; `getCoverUrl` encodes API path assumptions.
 */
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IBook } from '../../../core/models/book.model';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-book-card',
  imports: [RouterLink, Tag],
  templateUrl: './book-card.html',
  styleUrl: './book-card.scss',
})
export class BookCardComponent {
  book = input.required<IBook>();

  getCoverUrl(): string {
    const cover = this.book().coverImageUrl;
    return cover ? '/' + cover : '/assets/no-cover.png';
  }

  getRatingStars(): string {
    const rating = Number(this.book().rating);
    if (!rating || rating === 0) return 'No ratings';
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }
}