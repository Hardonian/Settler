/**
 * WebSocket Infrastructure
 * 
 * Provides real-time updates for:
 * - Reconciliation job status
 * - Webhook deliveries
 * - System notifications
 * - Live metrics
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logInfo } from '../utils/logger';

export interface WebSocketServer {
  io: SocketIOServer;
  broadcast: (event: string, data: unknown) => void;
  broadcastToTenant: (tenantId: string, event: string, data: unknown) => void;
  broadcastToRoom: (room: string, event: string, data: unknown) => void;
}

let wsServer: WebSocketServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer): WebSocketServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    // In production, verify JWT token
    // For now, allow connection
    next();
  });

  io.on('connection', (socket: Socket) => {
    const tenantId = socket.handshake.auth.tenantId;
    
    logInfo('WebSocket client connected', {
      socketId: socket.id,
      tenantId,
    });

    // Join tenant room
    if (tenantId) {
      socket.join(`tenant:${tenantId}`);
    }

    // Handle room subscriptions
    socket.on('subscribe', (room: string) => {
      socket.join(room);
      logInfo('Client subscribed to room', {
        socketId: socket.id,
        room,
      });
    });

    socket.on('unsubscribe', (room: string) => {
      socket.leave(room);
      logInfo('Client unsubscribed from room', {
        socketId: socket.id,
        room,
      });
    });

    socket.on('disconnect', () => {
      logInfo('WebSocket client disconnected', {
        socketId: socket.id,
      });
    });
  });

  wsServer = {
    io,
    broadcast: (event: string, data: unknown) => {
      io.emit(event, data);
    },
    broadcastToTenant: (tenantId: string, event: string, data: unknown) => {
      io.to(`tenant:${tenantId}`).emit(event, data);
    },
    broadcastToRoom: (room: string, event: string, data: unknown) => {
      io.to(room).emit(event, data);
    },
  };

  return wsServer;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): WebSocketServer | null {
  return wsServer;
}

/**
 * Broadcast reconciliation job update
 */
export function broadcastJobUpdate(tenantId: string, jobId: string, status: string, data?: unknown): void {
  if (!wsServer) {
    return;
  }

  wsServer.broadcastToTenant(tenantId, 'job:update', {
    jobId,
    status,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast webhook delivery update
 */
export function broadcastWebhookUpdate(tenantId: string, webhookId: string, status: string): void {
  if (!wsServer) {
    return;
  }

  wsServer.broadcastToTenant(tenantId, 'webhook:update', {
    webhookId,
    status,
    timestamp: new Date().toISOString(),
  });
}
