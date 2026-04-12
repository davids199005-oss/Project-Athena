/**
 * @module create-chat.dto
 *
 * **Purpose:** Bind a new AI chat session to a specific catalog book.
 *
 * **Responsibilities:** Validate UUID format for `bookId` references.
 *
 * **Integration notes:** Authorization to access the book is enforced in services/controllers, not in this DTO.
 */

import { IsUUID } from 'class-validator';

export class CreateChatDto {
  // Book this chat thread is scoped to.
  @IsUUID()
  bookId!: string;
}