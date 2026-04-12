/**
 * @module ai.gateway
 *
 * **Purpose:** Socket.IO namespace `/chat` for authenticated streaming AI replies with JWT handshakes.
 *
 * **Responsibilities:** Verify tokens on connection; stream assistant deltas to rooms; delegate to `AiService.sendMessageStream`.
 *
 * **Integration notes:** CORS `origin: '*'` is permissive—tighten in production if the frontend origin is fixed. Room IDs are session UUIDs.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { WsSendMessageDto } from './dto/ws-send-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/chat',
})
export class AiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AiGateway.name);

  constructor(
    private readonly aiService: AiService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token
        || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      (client as any).userId = payload.sub;
      this.logger.log(`Client connected: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: WsSendMessageDto,
  ): Promise<void> {
    const userId = (client as any).userId;
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      // Notify client: stream started
      client.emit('streamStart', { sessionId: data.sessionId });

      const assistantMessage = await this.aiService.sendMessageStream(
        data.sessionId,
        userId,
        data.content,
        (chunk: string) => {
          client.emit('streamChunk', { sessionId: data.sessionId, chunk });
        },
      );

      // Notify client: stream finished
      client.emit('streamEnd', {
        sessionId: data.sessionId,
        message: assistantMessage,
      });
    } catch (error: any) {
      client.emit('error', {
        message: error.message || 'Failed to process message',
      });
    }
  }
}
