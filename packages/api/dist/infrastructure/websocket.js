"use strict";
/**
 * WebSocket Infrastructure
 *
 * Provides real-time updates for:
 * - Reconciliation job status
 * - Webhook deliveries
 * - System notifications
 * - Live metrics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = initializeWebSocket;
exports.getWebSocketServer = getWebSocketServer;
exports.broadcastJobUpdate = broadcastJobUpdate;
exports.broadcastWebhookUpdate = broadcastWebhookUpdate;
const socket_io_1 = require("socket.io");
const logger_1 = require("../utils/logger");
let wsServer = null;
/**
 * Initialize WebSocket server
 */
function initializeWebSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
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
    io.on('connection', (socket) => {
        const tenantId = socket.handshake.auth.tenantId;
        (0, logger_1.logInfo)('WebSocket client connected', {
            socketId: socket.id,
            tenantId,
        });
        // Join tenant room
        if (tenantId) {
            socket.join(`tenant:${tenantId}`);
        }
        // Handle room subscriptions
        socket.on('subscribe', (room) => {
            socket.join(room);
            (0, logger_1.logInfo)('Client subscribed to room', {
                socketId: socket.id,
                room,
            });
        });
        socket.on('unsubscribe', (room) => {
            socket.leave(room);
            (0, logger_1.logInfo)('Client unsubscribed from room', {
                socketId: socket.id,
                room,
            });
        });
        socket.on('disconnect', () => {
            (0, logger_1.logInfo)('WebSocket client disconnected', {
                socketId: socket.id,
            });
        });
    });
    wsServer = {
        io,
        broadcast: (event, data) => {
            io.emit(event, data);
        },
        broadcastToTenant: (tenantId, event, data) => {
            io.to(`tenant:${tenantId}`).emit(event, data);
        },
        broadcastToRoom: (room, event, data) => {
            io.to(room).emit(event, data);
        },
    };
    return wsServer;
}
/**
 * Get WebSocket server instance
 */
function getWebSocketServer() {
    return wsServer;
}
/**
 * Broadcast reconciliation job update
 */
function broadcastJobUpdate(tenantId, jobId, status, data) {
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
function broadcastWebhookUpdate(tenantId, webhookId, status) {
    if (!wsServer) {
        return;
    }
    wsServer.broadcastToTenant(tenantId, 'webhook:update', {
        webhookId,
        status,
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=websocket.js.map