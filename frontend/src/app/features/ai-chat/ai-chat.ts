/**
 * @module app/features/ai-chat/ai-chat
 *
 * **Purpose:** Placeholder route-level shell for an AI chat area (selector `app-ai-chat`).
 * The primary conversational UI currently lives in `ChatWidgetComponent`, which is driven by
 * `AiService` + WebSocket streaming.
 *
 * **Responsibilities:** At present, only declares an empty component with template/styles—
 * reserved for a future full-page chat experience or deep links.
 *
 * **Integration notes:** Safe to extend with imports and state later; keep routing and lazy
 * bundles in mind if this becomes heavy. No providers here, so it inherits app-wide services.
 */
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-ai-chat',
  imports: [RouterLink, Button],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
})
/** Empty stub: real AI UX is embedded globally via `app-chat-widget` + `AiService`. */
export class AiChatComponent {}
