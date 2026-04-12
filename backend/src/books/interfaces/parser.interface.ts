/**

 * @module parser.interface

 *

 * **Purpose:** Shared structural types between EPUB/PDF parsing, chunking, and ingestion orchestration.

 *

 * **Responsibilities:** Define `ParsedSection` and `TextChunk` contracts without importing Nest or TypeORM.

 *

 * **Integration notes:** Keeps parser output decoupled from storage so chunking can be unit-tested in isolation.

 */



// src/books/interfaces/parser.interfaces.ts



// Shared parser/chunker contracts (books-parser.service, text-chunker, books.service)



/**

 * One logical section from the parser: EPUB chapter HTML or PDF page text.

 */

export interface ParsedSection {

  title: string | null;

  content: string;

}



/**

 * Chunk ready for `book_chunks` (global chunkIndex assigned after all sections are flattened).

 */

export interface TextChunk {

  content: string;

  chapterTitle: string | null;

}

