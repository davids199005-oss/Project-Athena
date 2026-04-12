/**
 * @module app/features/admin/admin-reviews/admin-reviews
 *
 * **Purpose:** Administrative moderation view for user reviews: paginated listing with delete.
 *
 * **Responsibilities:** Load reviews via `AdminService.getReviews`, sync table pagination with
 * lazy-load events, and confirm destructive deletes before calling the API.
 *
 * **Integration notes:** Sort defaults (`createdAt` DESC) match backend expectations; errors
 * surface through PrimeNG `MessageService` only (no retry UX). `truncateText` is purely presentational.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { IAdminReview } from '../../../core/models/admin.model';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-admin-reviews',
  imports: [DatePipe, TableModule, Button, ConfirmDialog, Tooltip],
  providers: [ConfirmationService],
  templateUrl: './admin-reviews.html',
  styleUrl: './admin-reviews.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReviewsComponent implements OnInit {
  private adminService = inject(AdminService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  reviews = signal<IAdminReview[]>([]);
  totalRecords = signal(0);
  isLoading = signal(true);
  currentPage = signal(1);
  rows = signal(10);

  readonly stars = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading.set(true);
    this.adminService.getReviews({
      page: this.currentPage(),
      limit: this.rows(),
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    }).subscribe({
      next: (res) => {
        this.reviews.set(res.data);
        this.totalRecords.set(res.meta.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load reviews' });
      },
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.currentPage.set(Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1);
    this.rows.set(event.rows ?? 10);
    this.loadReviews();
  }

  confirmDelete(review: IAdminReview): void {
    const bookTitle = review.book?.title ?? 'Unknown';
    this.confirmationService.confirm({
      message: `Delete this review for "${bookTitle}"? This cannot be undone.`,
      header: 'Confirm deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.adminService.deleteReview(review.id).subscribe({
          next: () => {
            this.loadReviews();
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Review deleted successfully' });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete review' });
          },
        });
      },
    });
  }

  truncateText(text: string | null, maxLength = 80): string {
    if (!text) return '—';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
