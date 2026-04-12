/**
 * @module send-message.dto
 *
 * **Purpose:** Validate user chat content for REST/WebSocket chat endpoints.
 *
 * **Responsibilities:** Enforce non-empty strings with an upper bound to control token spend and abuse surface.
 *
 * **Integration notes:** Length limits are not tokenizer-aware—very dense languages may exceed expected token counts sooner.
 */

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  // User message; cap limits prompt/token cost.
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}