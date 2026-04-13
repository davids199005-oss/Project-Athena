/**
 * @module app/features/catalog/catalog
 *
 * **Purpose:** Searchable/sortable book catalog with server pagination and filters.
 *
 * **Responsibilities:** Map UI state to `IQueryBooksParams`; call `BookService.findAll`; sync PrimeNG paginator with API meta.
 *
 * **Integration notes:** Query params in the URL can be added later—currently state is component-local; changing page size triggers refetch.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../core/services/book.service';
import { IBook, IQueryBooksParams, BookSortBy, SortOrder } from '../../core/models/book.model';
import { BookCardComponent } from '../../shared/components/book-card/book-card';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Paginator, PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, BookCardComponent, SkeletonCardComponent, InputText, Select, Paginator],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent implements OnInit {
  private bookService = inject(BookService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  books = signal<IBook[]>([]);
  totalRecords = signal(0);
  isLoading = signal(false);

  search = '';
  selectedGenre: string | null = null;
  selectedLanguage: string | null = null;
  selectedSort = BookSortBy.CREATED_AT;
  sortOrder = SortOrder.DESC;
  page = 1;
  limit = 10;

  genres = [
    { label: 'All genres', value: null },
    { label: 'Fiction', value: 'fiction' },
    { label: 'Non-fiction', value: 'non-fiction' },
    { label: 'Science', value: 'science' },
    { label: 'History', value: 'history' },
    { label: 'Philosophy', value: 'philosophy' },
    { label: 'Technology', value: 'technology' },
    { label: 'Biography', value: 'biography' },
  ];

  languages = [
    { label: 'All languages', value: null },
    { label: 'English', value: 'en' },
    { label: 'Russian', value: 'ru' },
    { label: 'Hebrew', value: 'he' },
  ];

  sortOptions = [
    { label: 'Newest first', value: BookSortBy.CREATED_AT },
    { label: 'Top rated', value: BookSortBy.RATING },
    { label: 'By title', value: BookSortBy.TITLE },
    { label: 'By year', value: BookSortBy.PUBLISHED_YEAR },
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.search = params['search'];
      }
      this.loadBooks();
    });
  }

  loadBooks(): void {
    this.isLoading.set(true);

    const params: IQueryBooksParams = {
      page: this.page,
      limit: this.limit,
      sortBy: this.selectedSort,
      sortOrder: this.selectedSort === BookSortBy.TITLE ? SortOrder.ASC : SortOrder.DESC,
    };

    if (this.search.trim()) params.search = this.search.trim();
    if (this.selectedGenre) params.genre = this.selectedGenre;
    if (this.selectedLanguage) params.language = this.selectedLanguage;

    this.bookService.findAll(params).subscribe({
      next: (res) => {
        this.books.set(res.data);
        this.totalRecords.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadBooks();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadBooks();
  }

  onPageChange(event: PaginatorState): void {
    this.page = (event.page ?? 0) + 1;
    this.limit = event.rows ?? 12;
    this.loadBooks();
  }
}
