/**
 * @module app/core/models/admin.model
 *
 * **Purpose:** DTOs for admin dashboard statistics, review moderation lists, and query parameters.
 *
 * **Responsibilities:** Shape nested stats (`users`, `books`, `reviews`, `ai`, `recentActivity`) for templates and `AdminService`.
 *
 * **Integration notes:** Optional nested objects should be guarded in templates—API may omit sections on partial failure.
 */
export interface IUserStats {
  total: number;
  newThisMonth: number;
  blocked: number;
  admins: number;
}

export interface IBookStats {
  total: number;
  byGenre: { genre: string; count: number }[];
  byFileType: { fileType: string; count: number }[];
}

export interface IReviewStats {
  total: number;
  averageRating: number;
}

export interface IAiStats {
  totalSessions: number;
  totalTokensUsed: number;
}

export interface IRecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface IRecentBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  createdAt: string;
}

export interface IRecentReview {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string } | null;
  book: { id: string; title: string } | null;
}

export interface IRecentActivity {
  recentUsers: IRecentUser[];
  recentBooks: IRecentBook[];
  recentReviews: IRecentReview[];
}

export interface IAdminStats {
  users: IUserStats;
  books: IBookStats;
  reviews: IReviewStats;
  ai: IAiStats;
  recentActivity: IRecentActivity;
}

export interface IAdminReview {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  book: { id: string; title: string; author: string } | null;
}

export interface IAdminReviewsResponse {
  data: IAdminReview[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IQueryReviewsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
