/**
 * @module notification.service
 *
 * **Purpose:** Persisted in-app notifications with optional real-time delivery via a gateway-registered
 * push callback.
 *
 * **Responsibilities:** CRUD-ish reads for a user; unread counts; mark read/all read; fan-out
 * `createForMany` sequentially.
 *
 * **Integration notes:** `setPushCallback` must be wired once at startup (typically from a WebSocket
 * gateway); without it, notifications persist but no live push occurs. `createForMany` awaits per user—
 * large ID lists may be slow (no batch insert).
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

/**
 * Notification persistence + optional realtime fan-out.
 *
 * **Limitation:** In-memory callback reference—only one gateway instance should set it per process.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /** Optional WebSocket push hook registered by `NotificationGateway` at bootstrap. */
  private pushCallback: ((userId: string, notification: Notification) => void) | null = null;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  /**
   * Injects the realtime delivery function; idempotent last-write-wins per process.
   */
  setPushCallback(cb: (userId: string, notification: Notification) => void): void {
    this.pushCallback = cb;
  }

  // ─── Create + optional push ───

  /**
   * Persists then optionally invokes `pushCallback` (errors in callback are not handled here).
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      type,
      title,
      message,
      link: link || null,
    });

    const saved = await this.notificationRepo.save(notification);

    if (this.pushCallback) {
      this.pushCallback(userId, saved);
    }

    this.logger.log(`Notification created for user ${userId}: ${title}`);
    return saved;
  }

  // Fan-out create (e.g. new book for all users)
  async createForMany(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ): Promise<void> {
    for (const userId of userIds) {
      await this.create(userId, type, title, message, link);
    }
  }

  // ─── Per-user reads ───

  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }
}
