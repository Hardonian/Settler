import { Server as HTTPServer } from "http";
import {
  initializeWebSocket,
  getWebSocketServer,
  broadcastJobUpdate,
  broadcastWebhookUpdate,
} from "../websocket";

// Create mocks outside the factory to reference them in tests
const mSocket = {
  id: "test-socket-id",
  handshake: {
    auth: { tenantId: "test-tenant-id", token: "test-token" },
    headers: { authorization: "Bearer test-token" },
  },
  join: jest.fn(),
  leave: jest.fn(),
  on: jest.fn(),
};

const mIo = {
  use: jest.fn(),
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
};

jest.mock("socket.io", () => {
  return {
    Server: jest.fn().mockImplementation(() => mIo),
  };
});

jest.mock("../../utils/logger", () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

describe("WebSocket Infrastructure", () => {
  let mockHttpServer: HTTPServer;
  let socketIoMock: any;

  beforeEach(() => {
    mockHttpServer = new HTTPServer();
    jest.clearAllMocks();
    socketIoMock = require("socket.io");

    // reset mock implementations
    mIo.use.mockImplementation((_middleware: any) => {
      // Don't call automatically
    });
  });

  describe("initializeWebSocket", () => {
    it("should initialize and return the websocket server instance", () => {
      expect(getWebSocketServer()).toBeNull();

      const server = initializeWebSocket(mockHttpServer);

      expect(server).toBeDefined();
      expect(server.io).toBeDefined();
      expect(getWebSocketServer()).toBe(server);
      expect(socketIoMock.Server).toHaveBeenCalledWith(mockHttpServer, expect.any(Object));
    });

    it("should set up connection handlers", () => {
      initializeWebSocket(mockHttpServer);

      expect(mIo.use).toHaveBeenCalled();
      expect(mIo.on).toHaveBeenCalledWith("connection", expect.any(Function));
    });
  });

  describe("broadcasting", () => {
    let server: any;

    beforeEach(() => {
      server = initializeWebSocket(mockHttpServer);
    });

    it("should broadcast to all clients", () => {
      server.broadcast("test-event", { data: "test" });
      expect(mIo.emit).toHaveBeenCalledWith("test-event", { data: "test" });
    });

    it("should broadcast to specific tenant", () => {
      server.broadcastToTenant("tenant-1", "test-event", { data: "test" });
      expect(mIo.to).toHaveBeenCalledWith("tenant:tenant-1");
      expect(mIo.emit).toHaveBeenCalledWith("test-event", { data: "test" });
    });

    it("should broadcast to specific room", () => {
      server.broadcastToRoom("room-1", "test-event", { data: "test" });
      expect(mIo.to).toHaveBeenCalledWith("room-1");
      expect(mIo.emit).toHaveBeenCalledWith("test-event", { data: "test" });
    });
  });

  describe("broadcast helper functions", () => {
    beforeEach(() => {
      initializeWebSocket(mockHttpServer);
    });

    it("broadcastJobUpdate should format and send job update to tenant", () => {
      // Mock Date to have deterministic timestamp
      const mockDate = new Date("2023-01-01T00:00:00.000Z");
      const realDate = global.Date;
      global.Date = class extends realDate {
        constructor() {
          super();
          return mockDate;
        }
      } as any;

      broadcastJobUpdate("tenant-1", "job-1", "completed", { detail: "done" });

      expect(mIo.to).toHaveBeenCalledWith("tenant:tenant-1");
      expect(mIo.emit).toHaveBeenCalledWith("job:update", {
        jobId: "job-1",
        status: "completed",
        data: { detail: "done" },
        timestamp: "2023-01-01T00:00:00.000Z",
      });

      // Restore Date
      global.Date = realDate;
    });

    it("broadcastWebhookUpdate should format and send webhook update to tenant", () => {
      const mockDate = new Date("2023-01-01T00:00:00.000Z");
      const realDate = global.Date;
      global.Date = class extends realDate {
        constructor() {
          super();
          return mockDate;
        }
      } as any;

      broadcastWebhookUpdate("tenant-1", "webhook-1", "delivered");

      expect(mIo.to).toHaveBeenCalledWith("tenant:tenant-1");
      expect(mIo.emit).toHaveBeenCalledWith("webhook:update", {
        webhookId: "webhook-1",
        status: "delivered",
        timestamp: "2023-01-01T00:00:00.000Z",
      });

      global.Date = realDate;
    });
  });

  describe("connection handling", () => {
    it("should handle client connection and subscribe to tenant room", () => {
      initializeWebSocket(mockHttpServer);

      // Get the connection handler
      const connectionHandler = mIo.on.mock.calls.find((call: any) => call[0] === "connection")[1];

      // Call it with our mock socket
      connectionHandler(mSocket);

      expect(mSocket.join).toHaveBeenCalledWith("tenant:test-tenant-id");
      expect(mSocket.on).toHaveBeenCalledWith("subscribe", expect.any(Function));
      expect(mSocket.on).toHaveBeenCalledWith("unsubscribe", expect.any(Function));
      expect(mSocket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
    });

    it("should handle subscribe event", () => {
      initializeWebSocket(mockHttpServer);

      const connectionHandler = mIo.on.mock.calls.find((call: any) => call[0] === "connection")[1];
      connectionHandler(mSocket);

      // Find the subscribe handler
      const subscribeHandler = mSocket.on.mock.calls.find(
        (call: any) => call[0] === "subscribe"
      )[1];

      subscribeHandler("custom-room");
      expect(mSocket.join).toHaveBeenCalledWith("custom-room");
    });

    it("should handle unsubscribe event", () => {
      initializeWebSocket(mockHttpServer);

      const connectionHandler = mIo.on.mock.calls.find((call: any) => call[0] === "connection")[1];
      connectionHandler(mSocket);

      const unsubscribeHandler = mSocket.on.mock.calls.find(
        (call: any) => call[0] === "unsubscribe"
      )[1];

      unsubscribeHandler("custom-room");
      expect(mSocket.leave).toHaveBeenCalledWith("custom-room");
    });
  });

  describe("authentication middleware", () => {
    it("should allow connection with valid token", () => {
      initializeWebSocket(mockHttpServer);

      // Get the auth middleware
      const authMiddleware = mIo.use.mock.calls[0][0];
      const nextMock = jest.fn();

      authMiddleware(mSocket, nextMock);

      expect(nextMock).toHaveBeenCalledWith(); // Called without error
    });

    it("should allow connection with authorization header token", () => {
      initializeWebSocket(mockHttpServer);

      const authMiddleware = mIo.use.mock.calls[0][0];
      const nextMock = jest.fn();

      const headerSocket = {
        handshake: {
          auth: {},
          headers: { authorization: "Bearer header-token" },
        },
      };

      authMiddleware(headerSocket, nextMock);

      expect(nextMock).toHaveBeenCalledWith(); // Called without error
    });

    it("should reject connection without token", () => {
      initializeWebSocket(mockHttpServer);

      const authMiddleware = mIo.use.mock.calls[0][0];
      const nextMock = jest.fn();

      // Create a socket without token
      const invalidSocket = {
        handshake: {
          auth: {},
          headers: {},
        },
      };

      authMiddleware(invalidSocket, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
      expect(nextMock.mock.calls[0][0].message).toBe("Authentication required");
    });
  });
});
