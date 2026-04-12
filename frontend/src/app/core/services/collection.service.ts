/**
 * @module app/core/services/collection.service
 *
 * **Purpose:** User-defined book collections (shelves): CRUD and membership management.
 *
 * **Responsibilities:** Call `/collections` REST endpoints; return cold observables per call.
 *
 * **Integration notes:** Optimistic UI not implemented—components should reload on success.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICollection, ICollectionBook } from '../models/collection.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<ICollection[]> {
    return this.http.get<ICollection[]>(`${this.apiUrl}/collections`);
  }

  getOne(id: string): Observable<ICollection> {
    return this.http.get<ICollection>(`${this.apiUrl}/collections/${id}`);
  }

  create(data: { name: string }): Observable<ICollection> {
    return this.http.post<ICollection>(`${this.apiUrl}/collections`, data);
  }

  update(id: string, data: { name: string }): Observable<ICollection> {
    return this.http.patch<ICollection>(`${this.apiUrl}/collections/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/collections/${id}`);
  }

  addBook(collectionId: string, bookId: string): Observable<ICollectionBook> {
    return this.http.post<ICollectionBook>(
      `${this.apiUrl}/collections/${collectionId}/books/${bookId}`,
      {},
    );
  }

  removeBook(collectionId: string, bookId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/collections/${collectionId}/books/${bookId}`,
    );
  }

  getBookCollections(bookId: string): Observable<ICollection[]> {
    return this.http.get<ICollection[]>(`${this.apiUrl}/books/${bookId}/collections`);
  }
}
