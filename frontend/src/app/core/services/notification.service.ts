/**
 * @module app/core/services/notification.service
 *
 * **Purpose:** In-app notifications: REST for history and unread counts, Socket.IO for live
 * pushes after login.
 *
 * **Responsibilities:** Manage `BehaviorSubject` streams for list + unread badge; connect with
 * JWT `auth` handshake; merge socket events into the list and increment unread.
 *
 * **Integration notes:** `connect` is idempotent when already connected; `disconnect` tears
 * down the socket for logout. Initial load runs after socket setup—duplicates are not deduped
 * between HTTP list and a simultaneous socket event (edge case on reconnect).
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { INotification } from '../models/notification.model';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private apiUrl = environment.apiUrl;

  private socket: Socket | null = null;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<INotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.tokenService.getAccessToken();
    if (!token) return;

    this.socket = io(`${environment.wsUrl}/notifications`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('notification', (notification: INotification) => {
      this.notificationsSubject.next([notification, ...this.notificationsSubject.value]);
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    });

    // Hydrate from REST so the panel has history before live events arrive
    this.loadNotifications();
    this.loadUnreadCount();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  loadNotifications(): void {
    this.http.get<INotification[]>(`${this.apiUrl}/notifications`).subscribe({
      next: (list) => this.notificationsSubject.next(list),
    });
  }

  loadUnreadCount(): void {
    this.http.get<number>(`${this.apiUrl}/notifications/unread-count`).subscribe({
      next: (count) => this.unreadCountSubject.next(count),
    });
  }

  markAsRead(id: string): Observable<INotification> {
    return this.http.patch<INotification>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllAsRead(): void {
    this.http.post(`${this.apiUrl}/notifications/read-all`, {}).subscribe({
      next: () => {
        this.unreadCountSubject.next(0);
        const updated = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
        this.notificationsSubject.next(updated);
      },
    });
  }
}
