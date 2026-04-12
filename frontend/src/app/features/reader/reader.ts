/**
 * @module app/features/reader/reader
 *
 * **Purpose:** Full-screen reading experience for EPUB (`epub.js`) and PDF (`pdf.js`) with
 * synced progress, bookmarks, highlights, and optional quote capture—backed by REST APIs.
 *
 * **Responsibilities:** Load book metadata and binary via authenticated HTTP; initialize the
 * correct renderer; track CFI (EPUB) or page index (PDF) as `currentPosition`; persist on
 * destroy; wire text selection to highlight creation; re-apply stored highlights (annotations
 * or span styling) after render.
 *
 * **Integration notes:** `afterNextRender` defers EPUB/PDF init until `*ngIf` has inserted the
 * host nodes—otherwise `ViewChild` refs are undefined. `HttpClient` ensures the interceptor
 * adds JWT to file downloads. `pdfjs` worker URL is set per init (global side effect). EPUB
 * `locations.generate` powers percentage progress; invalid CFI on navigation is swallowed when
 * re-highlighting. PDF highlight matching walks text-layer spans heuristically (may mis-align
 * on complex layouts). `saveProgress` fires HTTP on teardown without waiting (fire-and-forget).
 */
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy, signal, inject, Injector, afterNextRender } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../core/services/book.service';
import { ReadingService } from '../../core/services/reading.service';
import { IBook } from '../../core/models/book.model';
import { IBookmark, IQuote } from '../../core/models/reading.model';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import ePub from 'epubjs';
import type { Book, Rendition } from 'epubjs';
import * as pdfjsLib from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';

@Component({
  selector: 'app-reader',
  imports: [FormsModule, Button, Drawer, InputText],
  templateUrl: './reader.html',
  styleUrl: './reader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private readingService = inject(ReadingService);
  private injector = inject(Injector);
  private http = inject(HttpClient);

  @ViewChild('epubArea') epubArea!: ElementRef<HTMLDivElement>;
  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfTextLayer') pdfTextLayer!: ElementRef<HTMLDivElement>;

  book = signal<IBook | null>(null);
  bookmarks = signal<IBookmark[]>([]);
  showBookmarks = signal(false);
  newBookmarkTitle = '';
  progressPercent = signal(0);
  currentPosition = signal('');
  isLoading = signal(true);

  pdfCurrentPage = signal(1);
  pdfTotalPages = signal(0);

  private bookId = '';
  private epubBook: Book | null = null;
  private epubRendition: Rendition | null = null;
  private pdfDoc: any = null;

  ngOnInit(): void {
    this.bookId = this.route.snapshot.params['id'];
    this.loadBook();
    this.loadBookmarks();
  }

  /** Intentionally empty: reader hosts are created asynchronously after `isLoading` flips; initialization runs in `afterNextRender` from `loadBook`. */
  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.epubBook) {
      this.epubBook.destroy();
    }
    this.saveProgress();
  }

  private loadBook(): void {
    this.bookService.findOne(this.bookId).subscribe({
      next: (book) => {
        this.book.set(book);
        this.loadProgress();
        // Set isLoading false so the reader container renders in the DOM,
        // then init the reader after the view updates
        this.isLoading.set(false);
        afterNextRender(() => {
          if (book.fileType === 'EPUB') {
            this.initEpubReader();
          } else {
            this.initPdfReader();
          }
        }, { injector: this.injector });
      },
    });
  }

  private loadProgress(): void {
    this.readingService.getProgress(this.bookId).subscribe({
      next: (progress) => {
        if (progress) {
          this.progressPercent.set(progress.progressPercent);
          this.currentPosition.set(progress.currentPosition);
        }
      },
    });
  }

  private loadBookmarks(): void {
    this.readingService.getBookmarks(this.bookId).subscribe({
      next: (bookmarks) => this.bookmarks.set(bookmarks),
    });
  }

  private initEpubReader(): void {
    const url = this.bookService.getFileUrl(this.bookId);

    // Fetch EPUB as ArrayBuffer via HttpClient (includes auth token from interceptor)
    this.http.get(url, { responseType: 'arraybuffer' }).subscribe({
      next: (buffer) => this.renderEpub(buffer),
    });
  }

  private renderEpub(buffer: ArrayBuffer): void {
    this.epubBook = ePub(buffer as any);

    this.epubRendition = this.epubBook.renderTo(this.epubArea.nativeElement, {
      width: '100%',
      height: '100%',
      spread: 'none',
    });

    const pos = this.currentPosition();
    if (pos) {
      this.epubRendition.display(pos);
    } else {
      this.epubRendition.display();
    }

    this.epubRendition.on('relocated', (location: any) => {
      this.currentPosition.set(location.start.cfi);
      const progress = this.epubBook?.locations?.percentageFromCfi(location.start.cfi);
      if (progress !== undefined) {
        this.progressPercent.set(Math.round(progress * 100));
      }
    });

    this.epubBook.ready.then(() => {
      return this.epubBook!.locations.generate(1024);
    });

  }

  private initPdfReader(): void {
    const url = this.bookService.getFileUrl(this.bookId);

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';

    this.http.get(url, { responseType: 'arraybuffer' }).subscribe({
      next: (buffer) => {
        pdfjsLib.getDocument({ data: buffer }).promise.then((pdf: any) => {
          this.pdfDoc = pdf;
          this.pdfTotalPages.set(pdf.numPages);

          const pos = this.currentPosition();
          const startPage = pos ? parseInt(pos, 10) : 1;
          this.renderPdfPage(startPage);
        });
      },
    });
  }

  renderPdfPage(pageNum: number): void {
    if (!this.pdfDoc || pageNum < 1 || pageNum > this.pdfTotalPages()) return;

    this.pdfCurrentPage.set(pageNum);
    this.currentPosition.set(pageNum.toString());
    this.progressPercent.set(Math.round((pageNum / this.pdfTotalPages()) * 100));

    this.pdfDoc.getPage(pageNum).then((page: any) => {
      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d')!;
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      page.render({ canvasContext: context, viewport });

      // PDF.js text layer: transparent positioned spans over the canvas for selection + our highlight pass
      const textLayerDiv = this.pdfTextLayer?.nativeElement;
      if (textLayerDiv) {
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;

        // PDF.js v5 TextLayer expects these custom properties for correct scale/rounding (see pdf_viewer.css)
        const wrapper = textLayerDiv.parentElement!;
        wrapper.style.setProperty('--total-scale-factor', `${scale}`);
        wrapper.style.setProperty('--scale-round-x', '1px');
        wrapper.style.setProperty('--scale-round-y', '1px');

        page.getTextContent().then((textContent: any) => {
          const textLayer = new TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport,
          });
          textLayer.render().then(() => {
            textLayerDiv.style.width = `${viewport.width}px`;
            textLayerDiv.style.height = `${viewport.height}px`;
          });
        });
      }
    });
  }

  epubPrev(): void {
    this.epubRendition?.prev();
  }

  epubNext(): void {
    this.epubRendition?.next();
  }

  pdfPrev(): void {
    this.renderPdfPage(this.pdfCurrentPage() - 1);
  }

  pdfNext(): void {
    this.renderPdfPage(this.pdfCurrentPage() + 1);
  }

  addBookmark(): void {
    const pos = this.currentPosition();
    if (!pos) return;

    this.readingService.createBookmark(this.bookId, {
      position: pos,
      title: this.newBookmarkTitle || undefined,
    }).subscribe({
      next: () => {
        this.newBookmarkTitle = '';
        this.loadBookmarks();
      },
    });
  }

  goToBookmark(bookmark: IBookmark): void {
    if (this.book()?.fileType === 'EPUB' && this.epubRendition) {
      this.epubRendition.display(bookmark.position);
    } else if (this.book()?.fileType === 'PDF') {
      this.renderPdfPage(parseInt(bookmark.position, 10));
    }
    this.showBookmarks.set(false);
  }

  removeBookmark(id: string): void {
    this.readingService.removeBookmark(id).subscribe({
      next: () => this.loadBookmarks(),
    });
  }

  saveProgress(): void {
    const pos = this.currentPosition();
    if (!pos) return;

    this.readingService.upsertProgress(this.bookId, {
      currentPosition: pos,
      progressPercent: this.progressPercent(),
    }).subscribe();
  }

  goBack(): void {
    this.router.navigate(['/books', this.bookId]);
  }
}
