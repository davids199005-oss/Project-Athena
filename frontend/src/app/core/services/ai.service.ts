/**
 * @module app/core/services/ai.service
 *
 * **Purpose:** Client API for Athena AI features: semantic search, per-book chat sessions,
 * messages, recommendations, and lightweight UI state shared with the floating chat widget.
 *
 * **Responsibilities:** HTTP calls under `/ai/*`; maintain `BehaviorSubject`s for whether the
 * chat drawer is open, which book is in context, and which session is active (for consumers
 * that do not use routed state).
 *
 * **Integration notes:** Stateless REST for CRUD; streaming for assistant replies is handled
 * separately via `SocketService` in `ChatWidgetComponent`. `closeChat` is invoked from
 * `AuthService.logout` to reset UX. Subjects are in-memory only—refreshing the page loses
 * open/ session selection unless restored by callers.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { IAiChatSession, IAiChatMessage, ISearchResult } from '../models/ai.model';
import { IBookRecommendation } from '../models/book.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AiService {

  private apiUrl = environment.apiUrl;

  private chatOpenSubject = new BehaviorSubject<boolean>(false);
  chatOpen$ = this.chatOpenSubject.asObservable();

  private activeBookIdSubject = new BehaviorSubject<string | null>(null);
  activeBookId$ = this.activeBookIdSubject.asObservable();

  private activeSessionSubject = new BehaviorSubject<IAiChatSession | null>(null);
  activeSession$ = this.activeSessionSubject.asObservable();

  constructor(private http: HttpClient) {}

  openChat(bookId: string): void {
    this.activeBookIdSubject.next(bookId);
    this.chatOpenSubject.next(true);
  }

  closeChat(): void {
    this.chatOpenSubject.next(false);
  }

  setActiveSession(session: IAiChatSession | null): void {
    this.activeSessionSubject.next(session);
  }

  search(data: { query: string; bookId?: string; limit?: number }): Observable<ISearchResult[]> {
    return this.http.post<ISearchResult[]>(`${this.apiUrl}/ai/search`, data);
  }

  createSession(bookId: string): Observable<IAiChatSession> {
    return this.http.post<IAiChatSession>(`${this.apiUrl}/ai/sessions`, { bookId });
  }

  getSessions(): Observable<IAiChatSession[]> {
    return this.http.get<IAiChatSession[]>(`${this.apiUrl}/ai/sessions`);
  }

  getMessages(sessionId: string): Observable<IAiChatMessage[]> {
    return this.http.get<IAiChatMessage[]>(`${this.apiUrl}/ai/sessions/${sessionId}/messages`);
  }

  sendMessage(sessionId: string, content: string): Observable<IAiChatMessage> {
    return this.http.post<IAiChatMessage>(`${this.apiUrl}/ai/sessions/${sessionId}/messages`, { content });
  }

  deleteSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ai/sessions/${sessionId}`);
  }

  getRecommendations(bookId: string): Observable<IBookRecommendation[]> {
    return this.http.get<IBookRecommendation[]>(`${this.apiUrl}/ai/recommendations/${bookId}`);
  }
}