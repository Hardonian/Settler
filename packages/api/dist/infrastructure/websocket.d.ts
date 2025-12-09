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
import { Server as SocketIOServer } from 'socket.io';
export interface WebSocketServer {
    io: SocketIOServer;
    broadcast: (event: string, data: unknown) => void;
    broadcastToTenant: (tenantId: string, event: string, data: unknown) => void;
    broadcastToRoom: (room: string, event: string, data: unknown) => void;
}
/**
 * Initialize WebSocket server
 */
export declare function initializeWebSocket(httpServer: HTTPServer): WebSocketServer;
/**
 * Get WebSocket server instance
 */
export declare function getWebSocketServer(): WebSocketServer | null;
/**
 * Broadcast reconciliation job update
 */
export declare function broadcastJobUpdate(tenantId: string, jobId: string, status: string, data?: unknown): void;
/**
 * Broadcast webhook delivery update
 */
export declare function broadcastWebhookUpdate(tenantId: string, webhookId: string, status: string): void;
//# sourceMappingURL=websocket.d.ts.map