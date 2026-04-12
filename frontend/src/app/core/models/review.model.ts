/**
 * @module app/core/models/review.model
 *
 * **Purpose:** Book review entity as returned by public and admin APIs (includes optional user relation).
 *
 * **Responsibilities:** Type reviews for detail pages and moderation tables.
 *
 * **Integration notes:** `text` may be null for rating-only reviews; admin views should null-check.
 */
import { IUser } from './user.model';

export interface IReview {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  text: string | null;
  createdAt: string;
  updatedAt: string;
  user?: IUser;
}