/**
 * @module app/shared/components/chat-widget/chat-widget
 *
 * **Purpose:** Global floating AI chat UI: list sessions per book, load messages, send prompts,
 * and render assistant output streamed over WebSocket.
 *
 * **Responsibilities:** React to `AiService` open/book/session signals; connect `SocketService`
 * when opened; optimistically append user messages; accumulate streaming chunks until `streamEnd`
 * replaces with the final `IAiChatMessage`.
 *
 * **Integration notes:** Unsubscribe in `ngOnDestroy` prevents leaks; `scrollToBottom` uses a
 * short timeout to wait for DOM updates. Temporary message IDs (`temp-*`) are client-only until
 * the server echoes real rows. Errors reset streaming state but do not rollback the optimistic user row.
 */
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AiService } from '../../../core/services/ai.service';
import { SocketService } from '../../../core/services/socket.service';
import { IAiChatSession, IAiChatMessage, ChatMessageRole } from '../../../core/models/ai.model';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-chat-widget',
  imports: [FormsModule, Button, InputText, ProgressSpinner],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  private aiService = inject(AiService);
  private socketService = inject(SocketService);

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  isOpen = signal(false);
  sessions = signal<IAiChatSession[]>([]);
  activeSession = signal<IAiChatSession | null>(null);
  messages = signal<IAiChatMessage[]>([]);
  messageInput = '';
  isSending = signal(false);
  isLoadingMessages = signal(false);
  showSessions = signal(false);
  streamingContent = signal('');

  private bookId: string | null = null;
  private subs: Subscription[] = [];

  ChatMessageRole = ChatMessageRole;

  ngOnInit(): void {
    this.subs.push(
      this.aiService.chatOpen$.subscribe(open => {
        this.isOpen.set(open);
        if (open) {
          this.socketService.connect();
          this.onChatOpen();
        }
      }),
      this.aiService.activeBookId$.subscribe(id => this.bookId = id),
      this.socketService.onStreamChunk().subscribe(({ chunk }) => {
        this.streamingContent.update(c => c + chunk);
        this.scrollToBottom();
      }),
      this.socketService.onStreamEnd().subscribe(({ message }) => {
        this.streamingContent.set('');
        this.messages.update(list => [...list, message]);
        this.isSending.set(false);
        this.scrollToBottom();
      }),
      this.socketService.onError().subscribe(() => {
        this.streamingContent.set('');
        this.isSending.set(false);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private onChatOpen(): void {
    if (!this.bookId) return;

    this.aiService.getSessions().subscribe({
      next: (sessions) => {
        const filtered = sessions.filter(s => s.bookId === this.bookId);
        this.sessions.set(filtered);
        if (filtered.length > 0) {
          this.selectSession(filtered[0]);
        } else {
          this.createNewSession();
        }
      },
    });
  }

  selectSession(session: IAiChatSession): void {
    this.activeSession.set(session);
    this.showSessions.set(false);
    this.loadMessages();
  }

  deleteSession(event: Event, session: IAiChatSession): void {
    event.stopPropagation();
    if (!confirm('Delete this chat session? Messages will be lost.')) return;

    this.aiService.deleteSession(session.id).subscribe({
      next: () => {
        this.sessions.update(list => list.filter(s => s.id !== session.id));
        if (this.activeSession()?.id === session.id) {
          const remaining = this.sessions();
          if (remaining.length > 0) {
            this.selectSession(remaining[0]);
          } else {
            this.createNewSession();
          }
        }
      },
    });
  }

  createNewSession(): void {
    if (!this.bookId) return;

    this.aiService.createSession(this.bookId).subscribe({
      next: (session) => {
        this.sessions.update(list => [session, ...list]);
        this.activeSession.set(session);
        this.messages.set([]);
        this.showSessions.set(false);
      },
    });
  }

  private loadMessages(): void {
    const session = this.activeSession();
    if (!session) return;

    this.isLoadingMessages.set(true);
    this.aiService.getMessages(session.id).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.isLoadingMessages.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.isLoadingMessages.set(false);
      },
    });
  }

  sendMessage(): void {
    const session = this.activeSession();
    if (!this.messageInput.trim() || !session || this.isSending()) return;

    const content = this.messageInput.trim();
    this.messageInput = '';
    this.isSending.set(true);
    this.streamingContent.set('');

    this.messages.update(list => [...list, {
      id: 'temp-' + Date.now(),
      sessionId: session.id,
      role: ChatMessageRole.USER,
      content,
      tokensUsed: null,
      createdAt: new Date().toISOString(),
    }]);
    this.scrollToBottom();

    // WebSocket path enables token-by-token streaming; REST `sendMessage` would be non-streaming
    this.socketService.sendMessage(session.id, content);
  }

  close(): void {
    this.aiService.closeChat();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
}
