/**
 * @module app/core/models/reading.model
 *
 * **Purpose:** Reading activity: progress snapshots, bookmarks, highlights, quotes, favorites, and stats.
 *
 * **Responsibilities:** Unify EPUB/PDF position encoding (`currentPosition`, `cfiRange`, `pageNumber`) for `ReadingService` consumers.
 *
 * **Integration notes:** `currentPosition` meaning is format-specific—never assume numeric without checking `BookFileType`.
 */
import { IBook } from './book.model';

export interface IReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  currentPosition: string;
  progressPercent: number;
  lastReadAt: string;
  createdAt: string;
  updatedAt: string;
  book?: IBook;
}

export interface IBookmark {
  id: string;
  userId: string;
  bookId: string;
  position: string;
  title: string | null;
  createdAt: string;
}

export interface IFavorite {
  id: string;
  userId: string;
  bookId: string;
  createdAt: string;
  book?: IBook;
}

export interface IQuote {
  id: string;
  userId: string;
  bookId: string;
  text: string;
  source: string | null;
  note: string | null;
  cfiRange?: string | null;
  pageNumber?: number | null;
  createdAt: string;
  book?: IBook;
}

export interface IReadingStats {
  totalBooks: number;
  completedBooks: number;
  inProgressBooks: number;
  averageProgress: number;
  totalQuotes: number;
  totalBookmarks: number;
  recentActivity: IReadingProgress[];
  monthlyProgress: { month: string; booksRead: string; avgProgress: string }[];
}

