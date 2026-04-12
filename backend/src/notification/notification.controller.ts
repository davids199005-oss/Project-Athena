/**
 * @module notification.controller
 *
 * **Purpose:** REST endpoints for listing notifications and marking them read (single/all).
 *
 * **Responsibilities:** Scope operations to `@CurrentUser()`; no cross-user access paths.
 *
 * **Integration notes:** Controller is likely mounted under a global prefix—client paths should include `/api`.
 */

import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('notifications')
  findAll(@CurrentUser('id') userId: string) {
    return this.notificationService.findAll(userId);
  }

  @Get('notifications/unread-count')
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch('notifications/:id/read')
  markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.markAsRead(userId, id);
  }

  @Post('notifications/read-all')
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}
