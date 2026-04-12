/**
 * @module app/shared/components/navbar/navbar
 *
 * **Purpose:** Primary navigation, user menu, notifications popover, and admin link visibility.
 *
 * **Responsibilities:** Subscribe to `AuthService` and `NotificationService` streams; connect/disconnect notification socket based on login; mark notifications read.
 *
 * **Integration notes:** Uses `AsyncPipe` for observables in template to reduce manual subscription cleanup; `connect()` is idempotent. Role checks use `UserRole.ADMIN`.
 * Desktop layout centers primary routes in the shell while `.navbar-end` pins search + account actions to the right.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IUser, UserRole } from '../../../core/models/user.model';
import { INotification } from '../../../core/models/notification.model';
import { InputText } from 'primeng/inputtext';
import { Avatar } from 'primeng/avatar';
import { Menu } from 'primeng/menu';
import { Popover } from 'primeng/popover';
import { Badge } from 'primeng/badge';
import { Button } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, FormsModule, InputText, Avatar, Menu, Popover, Badge, Button, AsyncPipe, DatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  notificationService = inject(NotificationService);

  user = signal<IUser | null>(null);
  userMenuItems = signal<MenuItem[]>([]);
  searchQuery = '';
  mobileMenuOpen = signal(false);

  userInitials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    const first = u.firstName?.charAt(0) || '';
    const last = u.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  });

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user.set(user);
      this.buildUserMenu();
      if (user) {
        this.notificationService.connect();
      }
    });
  }

  onNotificationClick(notification: INotification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/catalog'], {
        queryParams: { search: this.searchQuery.trim() },
      });
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  private buildUserMenu(): void {
    const u = this.user();
    this.userMenuItems.set([
      {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => this.router.navigate(['/profile']),
      },
      ...(u?.role === UserRole.ADMIN
        ? [{
            label: 'Admin panel',
            icon: 'pi pi-shield',
            command: () => this.router.navigate(['/admin']),
          }]
        : []),
      { separator: true },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => this.authService.logout(),
      },
    ]);
  }
}
