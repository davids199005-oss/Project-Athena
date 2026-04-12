/**
 * @module app/core/services/book.service
 *
 * **Purpose:** Catalog/book API: paginated lists, detail, file URL helper, metadata updates,
 * and cover uploads.
 *
 * **Responsibilities:** Build `HttpParams` from query DTOs; return `IPaginatedResponse` for tables;
 * expose `getFileUrl` for readers that need the same path the backend serves.
 *
 * **Integration notes:** `findAll` powers both user catalog and admin tables (different callers,
 * same contract). File URLs are relative to the app origin when `apiUrl` is `/api`.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBook, IBookSummary, IQueryBooksParams } from '../models/book.model';
import { IPaginatedResponse } from '../models/pagination.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  findAll(params: IQueryBooksParams): Observable<IPaginatedResponse<IBook>> {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<IPaginatedResponse<IBook>>(`${this.apiUrl}/books`, { params: httpParams });
  }

  findOne(id: string): Observable<IBook> {
    return this.http.get<IBook>(`${this.apiUrl}/books/${id}`);
  }

  getSummary(id: string): Observable<IBookSummary> {
    return this.http.get<IBookSummary>(`${this.apiUrl}/books/${id}/summary`);
  }

  getFileUrl(id: string): string {
    return `${this.apiUrl}/books/${id}/file`;
  }

  update(id: string, data: Record<string, unknown>): Observable<IBook> {
    return this.http.patch<IBook>(`${this.apiUrl}/books/${id}`, data);
  }

  updateCover(id: string, coverFile: File): Observable<IBook> {
    const formData = new FormData();
    formData.append('cover', coverFile);
    return this.http.patch<IBook>(`${this.apiUrl}/books/${id}/cover`, formData);
  }
}