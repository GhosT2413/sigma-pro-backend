import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<number, Set<string>> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub as number;
      client.userId = userId;
      client.userRole = payload.role;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error instanceof Error ? error.message : 'Unknown error');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId && this.userSockets.has(client.userId)) {
      const sockets = this.userSockets.get(client.userId)!;
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(client.userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket): { event: string; data: string } {
    return { event: 'pong', data: 'pong' };
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ): { event: string; data: { room: string } } {
    client.join(data.room);
    this.logger.log(`Client ${client.id} joined room: ${data.room}`);
    return { event: 'subscribed', data: { room: data.room } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ): { event: string; data: { room: string } } {
    client.leave(data.room);
    this.logger.log(`Client ${client.id} left room: ${data.room}`);
    return { event: 'unsubscribed', data: { room: data.room } };
  }

  sendToUser(userId: number, event: string, data: any): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  sendToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, data);
  }

  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
  }

  sendNotification(userId: number, notification: {
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): void {
    this.sendToUser(userId, 'notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  getUserSocketCount(userId: number): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}