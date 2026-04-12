/**
 * @module app/core/models/ai.model
 *
 * **Purpose:** Types for AI chat sessions/messages, semantic search hits, and related enums.
 *
 * **Responsibilities:** Describe payloads for `AiService`, `SocketService`, and chat UI components.
 *
 * **Integration notes:** `ChatMessageRole` values are lowercase strings per API contract; must match server when parsing streams.
 */
import { IBook } from './book.model';

export enum ChatMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface IAiChatSession {
  id: string;
  userId: string;
  bookId: string;
  createdAt: string;
  updatedAt: string;
  book?: IBook;
}

export interface IAiChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  tokensUsed: number | null;
  createdAt: string;
}

export interface ISearchResult {
  id: string;
  bookId: string;
  chunkIndex: number;
  content: string;
  chapterTitle: string | null;
  distance: number;
}