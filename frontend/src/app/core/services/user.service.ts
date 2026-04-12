/**
 * @module app/core/services/user.service
 *
 * **Purpose:** HTTP facade for user profile and admin user-management endpoints (list, role,
 * block) separate from `AuthService` identity flows.
 *
 * **Responsibilities:** Map REST verbs to `/users` resources; keep URLs centralized via
 * `environment.apiUrl`.
 *
 * **Integration notes:** `getAll`/`changeRole`/`toggleBlock` require admin privileges server-side;
 * failures surface to callers only. Not cached—components should avoid redundant calls.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMe(): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/users/me`);
  }

  updateProfile(data: { firstName?: string; lastName?: string; avatarUrl?: string }): Observable<IUser> {
    return this.http.patch<IUser>(`${this.apiUrl}/users/me`, data);
  }

  getAll(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.apiUrl}/users`);
  }

  changeRole(userId: string, role: UserRole): Observable<IUser> {
    return this.http.patch<IUser>(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  toggleBlock(userId: string): Observable<IUser> {
    return this.http.patch<IUser>(`${this.apiUrl}/users/${userId}/block`, {});
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/users/me/password`, data);
  }

  changeEmail(data: { newEmail: string; password: string }): Observable<IUser> {
    return this.http.patch<IUser>(`${this.apiUrl}/users/me/email`, data);
  }

  uploadAvatar(file: File): Observable<IUser> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<IUser>(`${this.apiUrl}/users/me/avatar`, formData);
  }
}