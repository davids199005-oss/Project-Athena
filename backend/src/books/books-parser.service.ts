/**
 * @module books-parser.service
 *
 * **Purpose:** Extract structured text sections from uploaded EPUB/PDF files for chunking and embeddings.
 *
 * **Responsibilities:** Normalize parser outputs to `ParsedSection[]`; isolate EPUB/PDF quirks in private methods.
 *
 * **Integration notes:** Memory/latency scales with file size; failures bubble to `BooksService.create` which logs and continues with a saved book lacking chunks.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EPub } from 'epub2';
import { PDFParse } from 'pdf-parse';
import { ParsedSection } from './interfaces/parser.interface';
import { readFile } from 'fs/promises';


@Injectable()
export class BooksParserService {
  private readonly logger = new Logger(BooksParserService.name);

  async parse(filePath: string, fileType: 'EPUB' | 'PDF'): Promise<ParsedSection[]> {
    this.logger.log(`Parsing ${fileType} file: ${filePath}`);

    const sections =
      fileType === 'EPUB'
        ? await this.parseEpub(filePath)
        : await this.parsePdf(filePath);

    this.logger.log(`Parsed ${sections.length} sections from ${fileType}`);
    return sections;
  }

  private async parseEpub(filePath: string): Promise<ParsedSection[]> {
    const epub = await EPub.createAsync(filePath);
    const sections: ParsedSection[] = [];

    for (const chapter of epub.flow) {
      try {
        const html = await epub.getChapterAsync(chapter.id);

        const text = html
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n\n')
          .trim();

        if (!text || text.length < 50) continue;

        const tocEntry = epub.toc.find(
          (t: any) => t.href && chapter.href && t.href.includes(chapter.href),
        );
        const title = tocEntry?.title || null;

        sections.push({ title, content: text });
      } catch (error) {
        this.logger.warn(`Failed to parse chapter ${chapter.id}: ${error}`);
      }
    }

    return sections;
  }

  private async parsePdf(filePath: string): Promise<ParsedSection[]> {
    const buffer = await readFile(filePath);

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    const sections: ParsedSection[] = [];

    for (const page of result.pages) {
      const text = page.text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      if (!text || text.length < 30) continue;

      sections.push({
        title: `Page ${page.num}`,
        content: text,
      });
    }

    await parser.destroy();
    return sections;
  }
}