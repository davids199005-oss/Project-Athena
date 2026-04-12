/**
 * @module app/core/services/admin.service
 *
 * **Purpose:** Typed HTTP access to admin-only reporting and moderation endpoints (stats,
 * review queries, deletes).
 *
 * **Responsibilities:** Serialize query objects into `HttpParams`; return observables for
 * dashboard and review table features.
 *
 * **Integration notes:** Backend must enforce admin role; client guards only hide routes.
 * Parameter serialization drops `undefined`/`null` keys.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { IAdminStats, IAdminReviewsResponse, IQueryReviewsParams } from '../models/admin.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getStats(): Observable<IAdminStats> {
    return this.http.get<IAdminStats>(`${this.apiUrl}/admin/stats`);
  }

  getReviews(params: IQueryReviewsParams): Observable<IAdminReviewsResponse> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<IAdminReviewsResponse>(`${this.apiUrl}/admin/reviews`, { params: httpParams });
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/reviews/${id}`);
  }
}
