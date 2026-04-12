/**
 * @module app/core/models/collection.model
 *
 * **Purpose:** User collections (shelves) and join rows linking books to collections.
 *
 * **Responsibilities:** Provide `ICollection` / `ICollectionBook` for list/detail UIs.
 *
 * **Integration notes:** `isDefault` may affect delete/disable rules on the server—UI should reflect backend errors.
 */
import { IBook } from './book.model';

export interface ICollection {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  bookCount?: number;
  collectionBooks?: ICollectionBook[];
}

export interface ICollectionBook {
  id: string;
  collectionId: string;
  bookId: string;
  createdAt: string;
  book?: IBook;
}
