/**
 * @module app/features/admin/admin-users/admin-users
 *
 * **Purpose:** Admin user directory with local filtering (search, role, blocked status) and
 * actions to promote/demote roles and block/unblock accounts.
 *
 * **Responsibilities:** Load full user list via `UserService.getAll`; derive `filteredUsers`
 * with `computed` signals (client-side only—no server paging); prevent operators from acting
 * on their own row via `isSelf`.
 *
 * **Integration notes:** `currentUserId` comes from `AuthService.currentUser` at init—if `getMe`
 * has not completed, it may be empty (self-check could be wrong briefly). Each mutation reloads
 * the whole list (simple but chatty for large directories).
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { IUser, UserRole } from '../../../core/models/user.model';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { DatePipe } from '@angular/common';
import { Tooltip } from 'primeng/tooltip';
import { Select } from 'primeng/select';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-users',
  imports: [
    FormsModule, TableModule, Button, Tag, DatePipe, Tooltip,
    Select, IconField, InputIcon, InputText,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  allUsers = signal<IUser[]>([]);
  isLoading = signal(true);
  currentUserId = '';

  // Filters
  searchQuery = signal('');
  roleFilter = signal<string | null>(null);
  statusFilter = signal<string | null>(null);

  filteredUsers = computed(() => {
    let result = this.allUsers();
    const q = this.searchQuery().toLowerCase();
    if (q) {
      result = result.filter(u =>
        u.email.toLowerCase().includes(q) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q),
      );
    }
    const role = this.roleFilter();
    if (role) {
      result = result.filter(u => u.role === role);
    }
    const status = this.statusFilter();
    if (status === 'blocked') {
      result = result.filter(u => u.isBlocked);
    } else if (status === 'active') {
      result = result.filter(u => !u.isBlocked);
    }
    return result;
  });

  roleOptions = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'User', value: 'USER' },
  ];

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Blocked', value: 'blocked' },
  ];

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUser?.id || '';
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAll().subscribe({
      next: (users) => {
        this.allUsers.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users' });
      },
    });
  }

  toggleRole(user: IUser): void {
    const newRole = user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
    this.userService.changeRole(user.id, newRole).subscribe({
      next: () => {
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Role changed to ${newRole}` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to change role' });
      },
    });
  }

  toggleBlock(user: IUser): void {
    this.userService.toggleBlock(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: user.isBlocked ? 'User unblocked' : 'User blocked',
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update block status' });
      },
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set(null);
    this.statusFilter.set(null);
  }

  isSelf(user: IUser): boolean {
    return user.id === this.currentUserId;
  }
}
