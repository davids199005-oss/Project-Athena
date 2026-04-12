/**
 * @module notification.module
 *
 * **Purpose:** Compose notification persistence, REST inbox, and Socket.IO gateway with JWT auth.
 *
 * **Responsibilities:** Register `Notification` entity; wire gateway + service push callback.
 *
 * **Integration notes:** Imports `JwtModule` for gateway handshake validation; keep secrets aligned with auth.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    JwtModule.register({}),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
