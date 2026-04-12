/**
 * @module app/core/services/review.service
 *
 * **Purpose:** Book reviews: list by book, create/update/delete for authenticated readers.
 *
 * **Responsibilities:** Map to `/books/:bookId/reviews` and `/reviews/:id` endpoints.
 *
 * **Integration notes:** Server enforces one review per user per book; errors bubble to callers.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IReview } from '../models/review.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getByBook(bookId: string): Observable<IReview[]> {
    return this.http.get<IReview[]>(`${this.apiUrl}/books/${bookId}/reviews`);
  }

  create(bookId: string, data: { rating: number; text?: string }): Observable<IReview> {
    return this.http.post<IReview>(`${this.apiUrl}/books/${bookId}/reviews`, data);
  }

  update(reviewId: string, data: { rating?: number; text?: string }): Observable<IReview> {
    return this.http.patch<IReview>(`${this.apiUrl}/reviews/${reviewId}`, data);
  }

  remove(reviewId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reviews/${reviewId}`);
  }
}