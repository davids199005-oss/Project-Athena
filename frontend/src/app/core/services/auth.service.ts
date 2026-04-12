/**
 * @module app/core/services/auth.service
 *
 * **Purpose:** Single source of truth for authentication state: credentials exchange, token
 * lifecycle hooks, and the current user stream consumed across the UI and guards.
 *
 * **Responsibilities:** Expose register/login/refresh/logout/me; persist tokens via
 * `TokenService`; push `IUser` through `BehaviorSubject`; on logout clear AI UI state.
 *
 * **Integration notes:** `refreshTokens` uses the refresh token in `Authorization` as the
 * backend expects—must stay consistent with `authInterceptor` (which skips attaching the
 * access token to `/auth/refresh`). `logout` calls `AiService.closeChat()` to avoid stale
 * sessions leaking into the next user. `getMe` updates `currentUserSubject` for any subscriber;
 * guards typically rely on token presence, not necessarily a populated user object.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import { AiService } from './ai.service';
import { IUser, IAuthResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = environment.apiUrl;
  private aiService = inject(AiService);

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router,
  ) {}

  register(data: { email: string; password: string; firstName: string; lastName: string }): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(res => this.handleAuthResponse(res)),
    );
  }

  login(data: { email: string; password: string }): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap(res => this.handleAuthResponse(res)),
    );
  }

  refreshTokens(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.apiUrl}/auth/refresh`, {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    ).pipe(
      tap(res => this.tokenService.setTokens(res.accessToken, res.refreshToken)),
    );
  }

  /** Clears client auth state, closes the AI panel (book-scoped session UX), and navigates away. Server logout is best-effort (no error handling). */
  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe();
    this.tokenService.clearTokens();
    this.currentUserSubject.next(null);
    this.aiService.closeChat();
    this.router.navigate(['/auth/login']);
  }

  getMe(): Observable<IUser> {
    return this.http.get<IUser>(`${this.apiUrl}/auth/me`).pipe(
      tap(user => this.currentUserSubject.next(user)),
    );
  }

  get currentUser(): IUser | null {
    return this.currentUserSubject.getValue();
  }

  get isLoggedIn(): boolean {
    return this.tokenService.hasAccessToken();
  }

  private handleAuthResponse(res: IAuthResponse): void {
    this.tokenService.setTokens(res.accessToken, res.refreshToken);
    this.currentUserSubject.next(res.user);
  }
}