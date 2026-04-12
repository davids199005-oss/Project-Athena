/**
 * @module text-chunker
 *
 * **Purpose:** Deterministic chunking of parsed sections for embedding/RAG with paragraph-aware splits and overlap.
 *
 * **Responsibilities:** Greedy paragraph packing under size budgets; sentence splitting for oversized paragraphs; global ordering via `chunkText`.
 *
 * **Integration notes:** Token estimates are heuristic (character-based); non-Latin scripts may yield different effective token densities per chunk.
 */

import { ParsedSection, TextChunk } from '@/books/interfaces/parser.interface';

// ─── Tunables ───

/**
 * ~2000 chars targets ~500 tokens (embedding model handles up to 8191; shorter chunks often embed better).
 * Character/token ratio varies by language (~4 chars/token EN, denser for Cyrillic).
 */
const CHUNK_SIZE = 2000;

/**
 * ~200 char overlap (~50 tokens) keeps sentence boundaries from splitting across chunk edges.
 * ~10% of CHUNK_SIZE is a common default.
 */
const CHUNK_OVERLAP = 200;

// ─── Oversized paragraph: split on ". " ───

/**
 * Split one paragraph longer than CHUNK_SIZE into sentence-based pieces.
 * Uses ". " to avoid breaking abbreviations like "e.g." or "Dr.".
 */
function splitLongParagraph(paragraph: string): string[] {
  const sentences = paragraph.split('. ').map((s, i, arr) =>
    i < arr.length - 1 ? s + '.' : s,
  );

  const parts: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 <= CHUNK_SIZE) {
      current = current ? current + ' ' + sentence : sentence;
    } else {
      if (current) parts.push(current);
      current = sentence;
    }
  }

  if (current) parts.push(current);

  return parts;
}

// ─── One section → chunks ───

/**
 * Greedy paragraph packing with \n\n breaks; overlap on flush; huge paragraphs go through splitLongParagraph.
 */
function chunkSection(section: ParsedSection): TextChunk[] {
  const { title, content } = section;

  if (!content || !content.trim()) return [];

  const paragraphs = content
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return [];

  const chunks: TextChunk[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > CHUNK_SIZE) {
      if (currentChunk.trim()) {
        chunks.push({ content: currentChunk.trim(), chapterTitle: title });
        currentChunk = '';
      }

      const parts = splitLongParagraph(paragraph);
      for (const part of parts) {
        chunks.push({ content: part, chapterTitle: title });
      }
      continue;
    }

    const separator = currentChunk ? '\n\n' : '';
    const wouldBe = currentChunk + separator + paragraph;

    if (wouldBe.length <= CHUNK_SIZE) {
      currentChunk = wouldBe;
    } else {
      if (currentChunk.trim()) {
        chunks.push({ content: currentChunk.trim(), chapterTitle: title });
      }

      const overlap = currentChunk.slice(-CHUNK_OVERLAP);
      currentChunk = overlap + '\n\n' + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), chapterTitle: title });
  }

  return chunks;
}

// ─── Whole book ───

/**
 * Flatten all sections; assign chunkIndex in the caller (BooksService) after concatenation.
 */
export function chunkText(sections: ParsedSection[]): TextChunk[] {
  const allChunks: TextChunk[] = [];

  for (const section of sections) {
    const sectionChunks = chunkSection(section);
    allChunks.push(...sectionChunks);
  }

  return allChunks;
}
