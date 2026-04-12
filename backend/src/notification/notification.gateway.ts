/**
 * @module notification.gateway
 *
 * **Purpose:** Realtime notification delivery via Socket.IO with JWT-authenticated connections.
 *
 * **Responsibilities:** Register push callback on `NotificationService`; join per-user rooms; emit persisted events.
 *
 * **Integration notes:** Uses permissive CORS—tighten for production; room naming must match client subscription expectations.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  // Map userId → Set of socket IDs (multiple tabs per user)
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(): void {
    // Register push callback on NotificationService
    this.notificationService.setPushCallback(
      (userId: string, notification: Notification) => {
        this.pushToUser(userId, notification);
      },
    );
    this.logger.log('Notification gateway initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const userId = payload.sub;
      (client as any).userId = userId;

      // Track socket under userId
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`Notification client connected: ${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = (client as any).userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  private pushToUser(userId: string, notification: Notification): void {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds || socketIds.size === 0) return;

    for (const socketId of socketIds) {
      this.server.to(socketId).emit('notification', notification);
    }
  }
}
