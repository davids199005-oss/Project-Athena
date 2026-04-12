/**
 * @module app/core/services/socket.service
 *
 * **Purpose:** Socket.IO client for AI chat streaming (`/chat` namespace) with JWT auth.
 *
 * **Responsibilities:** Lazily connect; expose RxJS subjects for chunk/end/error events;
 * emit structured payloads keyed by `sessionId` for multi-session UIs.
 *
 * **Integration notes:** Multiple `connect` calls short-circuit when already connected; token is
 * read at connect time—token rotation does not auto-reconnect. Subjects are hot; subscribe in
 * components and unsubscribe on destroy.
 */
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private tokenService = inject(TokenService);
  private socket: Socket | null = null;

  private streamChunk$ = new Subject<{ sessionId: string; chunk: string }>();
  private streamEnd$ = new Subject<{ sessionId: string; message: any }>();
  private streamStart$ = new Subject<{ sessionId: string }>();
  private error$ = new Subject<{ message: string }>();

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.tokenService.getAccessToken();
    if (!token) return;

    this.socket = io(`${environment.wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('streamChunk', (data) => this.streamChunk$.next(data));
    this.socket.on('streamEnd', (data) => this.streamEnd$.next(data));
    this.socket.on('streamStart', (data) => this.streamStart$.next(data));
    this.socket.on('error', (data) => this.error$.next(data));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  sendMessage(sessionId: string, content: string): void {
    this.socket?.emit('sendMessage', { sessionId, content });
  }

  onStreamChunk(): Observable<{ sessionId: string; chunk: string }> {
    return this.streamChunk$.asObservable();
  }

  onStreamEnd(): Observable<{ sessionId: string; message: any }> {
    return this.streamEnd$.asObservable();
  }

  onStreamStart(): Observable<{ sessionId: string }> {
    return this.streamStart$.asObservable();
  }

  onError(): Observable<{ message: string }> {
    return this.error$.asObservable();
  }
}
