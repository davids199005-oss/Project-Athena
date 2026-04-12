/**
 * @module app/features/collection/collection
 *
 * **Purpose:** Display a single collection and its books with remove-from-collection actions.
 *
 * **Responsibilities:** Resolve collection id from route; load `ICollection`; render `BookCard` list.
 *
 * **Integration notes:** Default collections may be immutable server-side—errors should surface via toast patterns if extended.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CollectionService } from '../../core/services/collection.service';
import { ICollection } from '../../core/models/collection.model';
import { BookCardComponent } from '../../shared/components/book-card/book-card';
import { Button } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-collection',
  imports: [BookCardComponent, Button, ProgressSpinner, RouterLink],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private collectionService = inject(CollectionService);

  collection = signal<ICollection | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.collectionService.getOne(id).subscribe({
        next: (collection) => {
          this.collection.set(collection);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  removeBook(bookId: string): void {
    const col = this.collection();
    if (!col) return;
    if (!confirm('Remove this book from the collection?')) return;

    this.collectionService.removeBook(col.id, bookId).subscribe({
      next: () => {
        const updated = {
          ...col,
          collectionBooks: col.collectionBooks?.filter(cb => cb.bookId !== bookId),
        };
        this.collection.set(updated);
      },
    });
  }
}
