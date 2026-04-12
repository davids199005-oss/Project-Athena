/**
 * @module app/features/admin/admin-dashboard/admin-dashboard
 *
 * **Purpose:** High-level admin overview: aggregated counts, recent activity lists, and genre
 * distribution for quick health checks.
 *
 * **Responsibilities:** Fetch `IAdminStats` once on init; expose derived `computed` signals so
 * the template stays declarative; format large token counts for display.
 *
 * **Integration notes:** Errors clear loading state silently—no toast (by design here); extend
 * if operators need failure visibility. Skeletons rely on `isLoading` + null `stats`.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { IAdminStats } from '../../../core/models/admin.model';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DatePipe, Tag, Skeleton],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  stats = signal<IAdminStats | null>(null);
  isLoading = signal(true);

  totalUsers = computed(() => this.stats()?.users.total ?? 0);
  newUsersThisMonth = computed(() => this.stats()?.users.newThisMonth ?? 0);
  totalBooks = computed(() => this.stats()?.books.total ?? 0);
  totalReviews = computed(() => this.stats()?.reviews.total ?? 0);
  averageRating = computed(() => this.stats()?.reviews.averageRating ?? 0);
  totalAiSessions = computed(() => this.stats()?.ai.totalSessions ?? 0);
  totalTokensUsed = computed(() => this.stats()?.ai.totalTokensUsed ?? 0);

  recentUsers = computed(() => this.stats()?.recentActivity.recentUsers ?? []);
  recentBooks = computed(() => this.stats()?.recentActivity.recentBooks ?? []);
  recentReviews = computed(() => this.stats()?.recentActivity.recentReviews ?? []);

  genreDistribution = computed(() => this.stats()?.books.byGenre ?? []);

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  formatTokens(count: number): string {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
  }
}
