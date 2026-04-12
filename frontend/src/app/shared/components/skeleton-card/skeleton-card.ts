import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  template: `
    <div class="skeleton-card">
      <div class="skeleton-cover shimmer"></div>
      <div class="skeleton-body">
        <div class="skeleton-line shimmer" style="width: 80%"></div>
        <div class="skeleton-line skeleton-line--sm shimmer" style="width: 50%"></div>
        <div class="skeleton-meta">
          <div class="skeleton-badge shimmer"></div>
          <div class="skeleton-badge shimmer" style="width: 40px"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-card {
      border-radius: var(--athena-radius-lg);
      border: 1px solid var(--athena-border-card);
      background: var(--athena-surface-card);
      overflow: hidden;
    }
    .skeleton-cover {
      width: 100%;
      aspect-ratio: 3 / 4;
    }
    .skeleton-body {
      padding: 0.85rem 1rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .skeleton-line {
      height: 14px;
      border-radius: 6px;
    }
    .skeleton-line--sm { height: 12px; }
    .skeleton-meta {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .skeleton-badge {
      height: 22px;
      width: 56px;
      border-radius: var(--athena-radius-full);
    }
    .shimmer {
      background: linear-gradient(
        90deg,
        var(--p-surface-ground) 25%,
        rgba(255, 255, 255, 0.5) 50%,
        var(--p-surface-ground) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.8s ease-in-out infinite;
    }
  `],
})
export class SkeletonCardComponent {}
