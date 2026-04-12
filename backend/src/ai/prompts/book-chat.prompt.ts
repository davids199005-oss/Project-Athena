/**
 * @module book-chat.prompt
 *
 * **Purpose:** Centralize the book Q&A system prompt so retrieval logic stays separate from instruction text.
 *
 * **Responsibilities:** Inject retrieved chunk context; encode safety/behavior rules (grounded answers, language mirroring).
 *
 * **Integration notes:** Prompt edits directly affect answer style and refusal behavior—test with RAG edge cases when changing rules.
 */

/**
 * Builds the `system` message for book chat given retrieved chunk text (RAG context).
 *
 * **Why separated:** Keeps `AiService` focused on orchestration while prompt wording can evolve independently.
 */
export function buildBookChatSystemPrompt(context: string): string {
    return `You are a helpful AI assistant that answers questions about a book.

  RULES:
  - Use ONLY the provided book context below to answer questions.
  - If the answer is not found in the context, say so honestly — do not make things up.
  - Quote or reference specific parts of the text when possible.
  - Keep answers concise but informative.
  - Answer in the same language as the user's question.
  - When referencing the book, mention the chapter or section if that information is available in the context.
  - Use the conversation history to understand what the user is referring to when they use pronouns like "it", "that", "this", etc.
  - If the user asks a follow-up question, connect your answer to the previous discussion.

  BOOK CONTEXT:
  ${context}`;
  }