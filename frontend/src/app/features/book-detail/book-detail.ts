/**
 * @module app/features/book-detail/book-detail
 *
 * **Purpose:** Book detail page: metadata, reviews, recommendations, read/favorite actions, and AI entry points.
 *
 * **Responsibilities:** Load book by route param; merge reviews, reading state, and recommendations; handle review CRUD and AI chat launch.
 *
 * **Integration notes:** `AiService.openChat` is global UI state shared with `ChatWidgetComponent`; favorite/review calls refetch slices selectively—watch for stale data if backend adds caching.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../core/services/book.service';
import { ReviewService } from '../../core/services/review.service';
import { ReadingService } from '../../core/services/reading.service';
import { AuthService } from '../../core/services/auth.service';
import { IBook, IBookSummary, IBookRecommendation } from '../../core/models/book.model';
import { IReview } from '../../core/models/review.model';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Rating } from 'primeng/rating';
import { Textarea } from 'primeng/textarea';
import { Message } from 'primeng/message';
import { Popover } from 'primeng/popover';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AiService } from '../../core/services/ai.service';
import { CollectionService } from '../../core/services/collection.service';
import { ICollection } from '../../core/models/collection.model';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-book-detail',
  imports: [RouterLink, FormsModule, Button, Tag, Rating, Textarea, Message, DatePipe, DecimalPipe, Popover],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private reviewService = inject(ReviewService);
  private readingService = inject(ReadingService);
  private authService = inject(AuthService);
  private aiService = inject(AiService);
  private collectionService = inject(CollectionService);
  private messageService = inject(MessageService);

  book = signal<IBook | null>(null);
  summary = signal<IBookSummary | null>(null);
  reviews = signal<IReview[]>([]);
  isFavorite = signal(false);
  collections = signal<ICollection[]>([]);
  bookCollectionIds = signal<Set<string>>(new Set());
  recommendations = signal<IBookRecommendation[]>([]);
  recommendationsLoading = signal(false);
  isLoading = signal(true);
  summaryLoading = signal(false);
  showSummary = signal(true);

  newRating = 0;
  newReviewText = '';
  reviewError = signal('');
  reviewSubmitting = signal(false);

  private bookId = '';

  coverUrl = computed(() => {
    const b = this.book();
    if (!b?.coverImageUrl) return '/assets/no-cover.png';
    return '/' + b.coverImageUrl;
  });

  currentUserId = computed(() => this.authService.currentUser?.id || '');

  openChat(): void {
    this.aiService.openChat(this.bookId);
  }

  ngOnInit(): void {
    this.bookId = this.route.snapshot.params['id'];
    this.loadBook();
    this.loadReviews();
    this.checkFavorite();
    this.loadCollections();
  }

  loadBook(): void {
    this.bookService.findOne(this.bookId).subscribe({
      next: (book) => {
        this.book.set(book);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  loadSummary(): void {
    this.summaryLoading.set(true);
    this.bookService.getSummary(this.bookId).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.summaryLoading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Ready', detail: 'AI summary generated' });
      },
      error: () => {
        this.summaryLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate summary. Try again.' });
      },
    });
  }

  loadReviews(): void {
    this.reviewService.getByBook(this.bookId).subscribe({
      next: (reviews) => this.reviews.set(reviews),
    });
  }

  checkFavorite(): void {
    this.readingService.getFavorites().subscribe({
      next: (favorites) => {
        this.isFavorite.set(favorites.some(f => f.bookId === this.bookId));
      },
    });
  }

  toggleFavorite(): void {
    if (this.isFavorite()) {
      this.readingService.removeFavorite(this.bookId).subscribe({
        next: () => {
          this.isFavorite.set(false);
          this.messageService.add({ severity: 'info', summary: 'Removed', detail: 'Removed from favorites' });
        },
      });
    } else {
      this.readingService.addFavorite(this.bookId).subscribe({
        next: () => {
          this.isFavorite.set(true);
          this.messageService.add({ severity: 'success', summary: 'Added', detail: 'Added to favorites' });
        },
      });
    }
  }

  private loadCollections(): void {
    this.collectionService.getAll().subscribe({
      next: (collections) => this.collections.set(collections),
    });
    this.collectionService.getBookCollections(this.bookId).subscribe({
      next: (cols) => this.bookCollectionIds.set(new Set(cols.map(c => c.id))),
    });
  }

  isInCollection(collectionId: string): boolean {
    return this.bookCollectionIds().has(collectionId);
  }

  toggleCollection(collectionId: string): void {
    if (this.isInCollection(collectionId)) {
      this.collectionService.removeBook(collectionId, this.bookId).subscribe({
        next: () => {
          const ids = new Set(this.bookCollectionIds());
          ids.delete(collectionId);
          this.bookCollectionIds.set(ids);
        },
      });
    } else {
      this.collectionService.addBook(collectionId, this.bookId).subscribe({
        next: () => {
          const ids = new Set(this.bookCollectionIds());
          ids.add(collectionId);
          this.bookCollectionIds.set(ids);
        },
      });
    }
  }

  loadRecommendations(): void {
    this.recommendationsLoading.set(true);
    this.aiService.getRecommendations(this.bookId).subscribe({
      next: (recs) => {
        this.recommendations.set(recs);
        this.recommendationsLoading.set(false);
      },
      error: () => this.recommendationsLoading.set(false),
    });
  }

  submitReview(): void {
    if (this.newRating === 0) {
      this.reviewError.set('Please select a rating');
      return;
    }

    this.reviewSubmitting.set(true);
    this.reviewError.set('');

    const data: { rating: number; text?: string } = { rating: this.newRating };
    if (this.newReviewText.trim()) {
      data.text = this.newReviewText.trim();
    }

    this.reviewService.create(this.bookId, data).subscribe({
      next: () => {
        this.newRating = 0;
        this.newReviewText = '';
        this.reviewSubmitting.set(false);
        this.loadReviews();
        this.loadBook();
        this.messageService.add({ severity: 'success', summary: 'Thank you', detail: 'Your review has been submitted' });
      },
      error: (err) => {
        this.reviewSubmitting.set(false);
        this.reviewError.set(err.error?.message || 'Failed to submit review');
      },
    });
  }
}
