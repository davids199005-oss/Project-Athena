/**
 * @module app/features/profile/profile
 *
 * **Purpose:** Account overview: editable profile, reading stats/history, favorites, quotes, and collections.
 *
 * **Responsibilities:** Aggregate data from `UserService`, `ReadingService`, `CollectionService`; expose tabbed UI with OnPush signals.
 *
 * **Integration notes:** Avatar upload and profile save share loading flags—ensure future changes keep UX consistent; collection/book data is refetched after mutations in various handlers.
 */
import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { ReadingService } from '../../core/services/reading.service';
import { CollectionService } from '../../core/services/collection.service';
import { AuthService } from '../../core/services/auth.service';
import { IUser } from '../../core/models/user.model';
import { IReadingProgress, IFavorite, IQuote, IReadingStats } from '../../core/models/reading.model';
import { ICollection } from '../../core/models/collection.model';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';
import { Message } from 'primeng/message';
import { BookCardComponent } from '../../shared/components/book-card/book-card';
import { DatePipe } from '@angular/common';
import { Dialog } from 'primeng/dialog';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, InputText, Button, Avatar, Message, BookCardComponent, DatePipe, Dialog, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private readingService = inject(ReadingService);
  private collectionService = inject(CollectionService);
  private authService = inject(AuthService);

  user = signal<IUser | null>(null);
  history = signal<IReadingProgress[]>([]);
  favorites = signal<IFavorite[]>([]);
  collections = signal<ICollection[]>([]);
  quotes = signal<IQuote[]>([]);
  stats = signal<IReadingStats | null>(null);

  showCreateDialog = signal(false);
  newCollectionName = '';
  editingCollection = signal<ICollection | null>(null);
  editCollectionName = '';

  // Profile edit
  currentPassword = '';
  newPassword = '';
  passwordMessage = signal('');
  passwordError = signal('');
  newEmail = '';
  emailPassword = '';
  emailMessage = signal('');
  emailError = signal('');
  avatarMessage = signal('');

  editFirstName = '';
  editLastName = '';
  isSaving = signal(false);
  saveMessage = signal('');

  userInitials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return ((u.firstName?.charAt(0) || '') + (u.lastName?.charAt(0) || '')).toUpperCase();
  });

  ngOnInit(): void {
    this.loadUser();
    this.loadHistory();
    this.loadFavorites();
    this.loadCollections();
    this.loadQuotes();
    this.loadStats();
  }

  private loadUser(): void {
    this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.user.set(u);
        this.editFirstName = u.firstName;
        this.editLastName = u.lastName;
      }
    });
  }

  private loadHistory(): void {
    this.readingService.getHistory().subscribe({
      next: (history) => this.history.set(history),
    });
  }

  private loadFavorites(): void {
    this.readingService.getFavorites().subscribe({
      next: (favorites) => this.favorites.set(favorites),
    });
  }

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword) return;
    this.passwordMessage.set('');
    this.passwordError.set('');

    this.userService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.passwordMessage.set('Password changed successfully');
        this.currentPassword = '';
        this.newPassword = '';
      },
      error: (err) => {
        this.passwordError.set(err.error?.message || 'Failed to change password');
      },
    });
  }

  changeEmail(): void {
    if (!this.newEmail || !this.emailPassword) return;
    this.emailMessage.set('');
    this.emailError.set('');

    this.userService.changeEmail({
      newEmail: this.newEmail,
      password: this.emailPassword,
    }).subscribe({
      next: () => {
        this.emailMessage.set('Email changed successfully');
        this.newEmail = '';
        this.emailPassword = '';
        this.authService.getMe().subscribe();
      },
      error: (err) => {
        this.emailError.set(err.error?.message || 'Failed to change email');
      },
    });
  }

  onAvatarSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.userService.uploadAvatar(file).subscribe({
      next: () => {
        this.avatarMessage.set('Avatar updated');
        this.authService.getMe().subscribe();
        this.loadUser();
      },
      error: () => {
        this.avatarMessage.set('Failed to upload avatar');
      },
    });
  }

  private loadStats(): void {
    this.readingService.getReadingStats().subscribe({
      next: (stats) => this.stats.set(stats),
    });
  }

  private loadQuotes(): void {
    this.readingService.getAllQuotes().subscribe({
      next: (quotes) => this.quotes.set(quotes),
    });
  }

  removeQuote(id: string): void {
    if (!confirm('Delete this quote?')) return;

    this.readingService.removeQuote(id).subscribe({
      next: () => this.loadQuotes(),
    });
  }

  private loadCollections(): void {
    this.collectionService.getAll().subscribe({
      next: (collections) => this.collections.set(collections),
    });
  }

  createCollection(): void {
    if (!this.newCollectionName.trim()) return;

    this.collectionService.create({ name: this.newCollectionName.trim() }).subscribe({
      next: () => {
        this.showCreateDialog.set(false);
        this.newCollectionName = '';
        this.loadCollections();
      },
    });
  }

  openRenameDialog(collection: ICollection): void {
    this.editingCollection.set(collection);
    this.editCollectionName = collection.name;
  }

  renameCollection(): void {
    const collection = this.editingCollection();
    if (!collection || !this.editCollectionName.trim()) return;

    this.collectionService.update(collection.id, { name: this.editCollectionName.trim() }).subscribe({
      next: () => {
        this.editingCollection.set(null);
        this.editCollectionName = '';
        this.loadCollections();
      },
    });
  }

  deleteCollection(collection: ICollection): void {
    if (!confirm(`Delete "${collection.name}"? Books won't be deleted, only the collection.`)) return;

    this.collectionService.remove(collection.id).subscribe({
      next: () => this.loadCollections(),
    });
  }

  saveProfile(): void {
    this.isSaving.set(true);
    this.saveMessage.set('');

    this.userService.updateProfile({
      firstName: this.editFirstName,
      lastName: this.editLastName,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveMessage.set('Profile updated successfully');
        this.authService.getMe().subscribe();
      },
      error: () => {
        this.isSaving.set(false);
        this.saveMessage.set('');
      },
    });
  }
}
