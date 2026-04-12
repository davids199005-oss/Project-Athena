/**
 * @module app/core/services/reading.service
 *
 * **Purpose:** Reading lifecycle API: progress, bookmarks, favorites, highlights, quotes, and
 * aggregate stats for profile/history views.
 *
 * **Responsibilities:** Thin `HttpClient` wrappers around `/books/:id/*` and `/reading/*`
 * routes; no local persistence.
 *
 * **Integration notes:** Position encoding differs by format (CFI vs page number string)—callers
 * must stay consistent with `ReaderComponent`. High-frequency progress writes from the reader
 * should be mindful of network cost (not debounced here).
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IReadingProgress, IBookmark, IFavorite, IQuote, IReadingStats } from '../models/reading.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReadingService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  upsertProgress(bookId: string, data: { currentPosition: string; progressPercent: number }): Observable<IReadingProgress> {
    return this.http.put<IReadingProgress>(`${this.apiUrl}/books/${bookId}/progress`, data);
  }

  getProgress(bookId: string): Observable<IReadingProgress> {
    return this.http.get<IReadingProgress>(`${this.apiUrl}/books/${bookId}/progress`);
  }

  getHistory(): Observable<IReadingProgress[]> {
    return this.http.get<IReadingProgress[]>(`${this.apiUrl}/reading/history`);
  }

  createBookmark(bookId: string, data: { position: string; title?: string }): Observable<IBookmark> {
    return this.http.post<IBookmark>(`${this.apiUrl}/books/${bookId}/bookmarks`, data);
  }

  getBookmarks(bookId: string): Observable<IBookmark[]> {
    return this.http.get<IBookmark[]>(`${this.apiUrl}/books/${bookId}/bookmarks`);
  }

  removeBookmark(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bookmarks/${id}`);
  }

  addFavorite(bookId: string): Observable<IFavorite> {
    return this.http.post<IFavorite>(`${this.apiUrl}/books/${bookId}/favorite`, {});
  }

  removeFavorite(bookId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/books/${bookId}/favorite`);
  }

  getFavorites(): Observable<IFavorite[]> {
    return this.http.get<IFavorite[]>(`${this.apiUrl}/favorites`);
  }

  // ─── Stats ───

  getReadingStats(): Observable<IReadingStats> {
    return this.http.get<IReadingStats>(`${this.apiUrl}/reading/stats`);
  }

  // ─── Quotes ───

  createQuote(bookId: string, data: {
    text: string;
    source?: string;
    note?: string;
    cfiRange?: string;
    pageNumber?: number;
  }): Observable<IQuote> {
    return this.http.post<IQuote>(`${this.apiUrl}/books/${bookId}/quotes`, data);
  }

  getQuotesByBook(bookId: string): Observable<IQuote[]> {
    return this.http.get<IQuote[]>(`${this.apiUrl}/books/${bookId}/quotes`);
  }

  getAllQuotes(): Observable<IQuote[]> {
    return this.http.get<IQuote[]>(`${this.apiUrl}/quotes`);
  }

  removeQuote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/quotes/${id}`);
  }
}