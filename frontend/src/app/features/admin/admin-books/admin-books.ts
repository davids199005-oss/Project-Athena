/**
 * @module app/features/admin/admin-books/admin-books
 *
 * **Purpose:** Admin CRUD for catalog books: paginated table, search/genre filters, create/edit
 * dialog with multipart uploads for manuscript and cover.
 *
 * **Responsibilities:** Drive PrimeNG `Table` lazy loading; debounce search input via a
 * `Subject`; create books through raw `HttpClient` `FormData` POST; update metadata and/or
 * cover via `BookService`; delete with confirmation.
 *
 * **Integration notes:** `finalize` + `queueMicrotask` reset `isSaving` after the observable
 * completes so OnPush sees the flag flip. Create path requires a file + mandatory fields;
 * update path batches metadata PATCH and optional cover upload. Direct `DELETE` to `/books/:id`
 * bypasses `BookService`—keep API contracts aligned with backend admin rules.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../../core/services/book.service';
import { IBook } from '../../../core/models/book.model';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { FileUpload } from 'primeng/fileupload';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Tag } from 'primeng/tag';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { finalize, Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-admin-books',
  imports: [
    FormsModule, TableModule, Button, Dialog, InputText, Select,
    Textarea, Tag, ConfirmDialog, FileUpload, IconField, InputIcon,
  ],
  providers: [ConfirmationService],
  templateUrl: './admin-books.html',
  styleUrl: './admin-books.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBooksComponent implements OnInit {
  private bookService = inject(BookService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private http = inject(HttpClient);

  books = signal<IBook[]>([]);
  totalRecords = signal(0);
  isLoading = signal(true);
  showBookDialog = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  editingBook = signal<IBook | null>(null);
  isSaving = signal(false);

  // Filters
  searchQuery = signal('');
  selectedGenre = signal<string | null>(null);
  currentPage = signal(1);
  rows = signal(10);

  /** Debounced trigger: `onSearchInput` pushes here; subscription resets page and reloads to avoid a request per keystroke. */
  private searchSubject = new Subject<string>();

  newBook = {
    title: '',
    author: '',
    description: '',
    genre: '',
    language: '',
    isbn: '',
    pageCount: null as number | null,
    publishedYear: null as number | null,
    fileType: 'EPUB',
  };

  bookFile: File | null = null;
  coverFile: File | null = null;

  genres = [
    { label: 'Fiction', value: 'fiction' },
    { label: 'Non-fiction', value: 'non-fiction' },
    { label: 'Science', value: 'science' },
    { label: 'History', value: 'history' },
    { label: 'Philosophy', value: 'philosophy' },
    { label: 'Technology', value: 'technology' },
    { label: 'Biography', value: 'biography' },
  ];

  fileTypes = [
    { label: 'EPUB', value: 'EPUB' },
    { label: 'PDF', value: 'PDF' },
  ];

  private apiUrl = environment.apiUrl;

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(400)).subscribe(() => {
      this.currentPage.set(1);
      this.loadBooks();
    });
    this.loadBooks();
  }

  loadBooks(): void {
    this.isLoading.set(true);
    const params: Record<string, unknown> = {
      page: this.currentPage(),
      limit: this.rows(),
    };
    if (this.searchQuery()) params['search'] = this.searchQuery();
    if (this.selectedGenre()) params['genre'] = this.selectedGenre();

    this.bookService.findAll(params as any).subscribe({
      next: (res) => {
        this.books.set(res.data);
        this.totalRecords.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load books' });
      },
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.currentPage.set(Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1);
    this.rows.set(event.rows ?? 10);
    this.loadBooks();
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onGenreFilter(): void {
    this.currentPage.set(1);
    this.loadBooks();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedGenre.set(null);
    this.currentPage.set(1);
    this.loadBooks();
  }

  openCreateDialog(): void {
    this.dialogMode.set('create');
    this.editingBook.set(null);
    this.resetForm();
    this.showBookDialog.set(true);
  }

  openEditDialog(book: IBook): void {
    this.dialogMode.set('edit');
    this.editingBook.set(book);
    this.newBook = {
      title: book.title,
      author: book.author,
      description: book.description || '',
      genre: book.genre,
      language: book.language,
      isbn: book.isbn || '',
      pageCount: book.pageCount,
      publishedYear: book.publishedYear,
      fileType: book.fileType,
    };
    this.bookFile = null;
    this.coverFile = null;
    this.showBookDialog.set(true);
  }

  onBookFileSelect(event: any): void {
    this.bookFile = event.files[0];
  }

  onCoverFileSelect(event: any): void {
    this.coverFile = event.files[0];
  }

  saveBook(): void {
    if (this.dialogMode() === 'create') {
      this.createBook();
    } else {
      this.updateBook();
    }
  }

  private createBook(): void {
    if (!this.bookFile || !this.newBook.title || !this.newBook.author || !this.newBook.genre || !this.newBook.language) {
      return;
    }

    this.isSaving.set(true);

    const formData = new FormData();
    formData.append('file', this.bookFile);
    if (this.coverFile) formData.append('cover', this.coverFile);
    formData.append('title', this.newBook.title);
    formData.append('author', this.newBook.author);
    formData.append('fileType', this.newBook.fileType);
    formData.append('genre', this.newBook.genre);
    formData.append('language', this.newBook.language);
    if (this.newBook.description) formData.append('description', this.newBook.description);
    if (this.newBook.isbn) formData.append('isbn', this.newBook.isbn);
    if (this.newBook.pageCount) formData.append('pageCount', this.newBook.pageCount.toString());
    if (this.newBook.publishedYear) formData.append('publishedYear', this.newBook.publishedYear.toString());

    this.http
      .post(`${this.apiUrl}/books`, formData)
      .pipe(finalize(() => queueMicrotask(() => this.isSaving.set(false))))
      .subscribe({
        next: () => {
          this.showBookDialog.set(false);
          this.resetForm();
          this.loadBooks();
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Book created successfully' });
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create book' });
        },
      });
  }

  private updateBook(): void {
    const book = this.editingBook();
    if (!book || !this.newBook.title || !this.newBook.author || !this.newBook.genre || !this.newBook.language) {
      return;
    }

    this.isSaving.set(true);

    const data: Record<string, unknown> = {};
    if (this.newBook.title !== book.title) data['title'] = this.newBook.title;
    if (this.newBook.author !== book.author) data['author'] = this.newBook.author;
    if (this.newBook.genre !== book.genre) data['genre'] = this.newBook.genre;
    if (this.newBook.language !== book.language) data['language'] = this.newBook.language;
    if (this.newBook.description !== (book.description || '')) data['description'] = this.newBook.description || null;
    if (this.newBook.isbn !== (book.isbn || '')) data['isbn'] = this.newBook.isbn || null;
    if (this.newBook.pageCount !== book.pageCount) data['pageCount'] = this.newBook.pageCount;
    if (this.newBook.publishedYear !== book.publishedYear) data['publishedYear'] = this.newBook.publishedYear;

    const hasMetadataChanges = Object.keys(data).length > 0;
    const hasCoverChange = !!this.coverFile;

    if (!hasMetadataChanges && !hasCoverChange) {
      this.isSaving.set(false);
      this.showBookDialog.set(false);
      return;
    }

    const onSuccess = () => {
      this.isSaving.set(false);
      this.showBookDialog.set(false);
      this.loadBooks();
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Book updated successfully' });
    };

    const onError = () => {
      this.isSaving.set(false);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update book' });
    };

    if (hasMetadataChanges) {
      this.bookService.update(book.id, data).subscribe({
        next: () => {
          if (hasCoverChange) {
            this.bookService.updateCover(book.id, this.coverFile!).subscribe({ next: onSuccess, error: onError });
          } else {
            onSuccess();
          }
        },
        error: onError,
      });
    } else {
      this.bookService.updateCover(book.id, this.coverFile!).subscribe({ next: onSuccess, error: onError });
    }
  }

  confirmDelete(book: IBook): void {
    this.confirmationService.confirm({
      message: `Delete "${book.title}"? This cannot be undone.`,
      header: 'Confirm deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.http.delete(`${this.apiUrl}/books/${book.id}`).subscribe({
          next: () => {
            this.loadBooks();
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Book deleted successfully' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete book' });
          },
        });
      },
    });
  }

  private resetForm(): void {
    this.newBook = { title: '', author: '', description: '', genre: '', language: '', isbn: '', pageCount: null, publishedYear: null, fileType: 'EPUB' };
    this.bookFile = null;
    this.coverFile = null;
  }
}
