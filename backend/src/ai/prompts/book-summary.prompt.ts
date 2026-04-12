/**
 * @module book-summary.prompt
 *
 * **Purpose:** Define catalog-style summary instructions separate from chunk sampling in `AiService`.
 *
 * **Responsibilities:** Combine title/author metadata with a text sample; constrain tone (objective, multi-paragraph).
 *
 * **Integration notes:** Sample quality limits summary fidelity—partial/wrong coverage is a product concern, not validated here.
 */

/**
 * Builds the prompt used to generate a stored book summary from a bounded text sample.
 */
export function buildBookSummaryPrompt(bookTitle: string, bookAuthor: string, textSample: string): string {
    return `You are a professional book reviewer and summarizer.
  
  TASK: Generate a concise but informative summary of the book "${bookTitle}" by ${bookAuthor}.
  
  RULES:
  - Write 3-5 paragraphs covering: main theme, key ideas, structure, and who this book is for.
  - Be objective and informative — this is a library catalog summary, not a personal review.
  - If the text sample is insufficient to understand the full book, note what you can determine from the available text.
  - Write the summary in the same language as the book text below.
  
  BOOK TEXT SAMPLE:
  ${textSample}`;
  }