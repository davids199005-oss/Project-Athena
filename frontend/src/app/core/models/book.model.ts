/**
 * @module app/core/models/book.model
 *
 * **Purpose:** Book domain types: file formats, sorting, list filters, recommendations, and full book records.
 *
 * **Responsibilities:** Enumerations and interfaces consumed by `BookService`, catalog, reader, and admin flows.
 *
 * **Integration notes:** `IQueryBooksParams` mirrors backend querystring contracts; changing field names requires API coordination.
 */
export enum BookFileType {
    EPUB = 'EPUB',
    PDF = 'PDF',
  }
  
  export enum BookSortBy {
    CREATED_AT = 'createdAt',
    RATING = 'rating',
    TITLE = 'title',
    PUBLISHED_YEAR = 'publishedYear',
  }
  
  export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
  }
  
  export interface IBook {
    id: string;
    title: string;
    author: string;
    description: string | null;
    genre: string;
    language: string;
    isbn: string | null;
    coverImageUrl: string | null;
    pageCount: number | null;
    publishedYear: number | null;
    fileType: BookFileType;
    filePath: string;
    rating: number;
    ratingsCount: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface IBookSummary {
    id: string;
    bookId: string;
    summary: string;
    model: string;
    tokensUsed: number;
    createdAt: string;
  }
  
  export interface IBookRecommendation {
    id: string;
    title: string;
    author: string;
    genre: string;
    coverImageUrl: string | null;
    rating: number;
    similarity: number;
  }

  export interface IQueryBooksParams {
    page?: number;
    limit?: number;
    genre?: string;
    language?: string;
    minRating?: number;
    search?: string;
    sortBy?: BookSortBy;
    sortOrder?: SortOrder;
  }