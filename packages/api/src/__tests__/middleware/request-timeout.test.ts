import { requestTimeoutMiddleware, getRequestTimeout } from "../../middleware/request-timeout";
import { logWarn } from "../../utils/logger";

jest.mock("../../utils/logger", () => ({
  logWarn: jest.fn(),
}));

describe("Request Timeout Middleware", () => {
  let mockReq: any;
  let mockRes: any;
  let nextFn: any;
  let originalDateNow: () => number;

  beforeEach(() => {
    jest.useFakeTimers();
    originalDateNow = Date.now;
    Date.now = jest.fn(() => 1000000);

    mockReq = {
      path: "/api/test",
      method: "GET",
    };

    mockRes = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };

    nextFn = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    Date.now = originalDateNow;
  });

  describe("requestTimeoutMiddleware", () => {
    it("should skip timeout for /health path", () => {
      mockReq.path = "/health";
      const middleware = requestTimeoutMiddleware();
      middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockReq.timeout).toBeUndefined();
    });

    it("should skip timeout for /metrics path", () => {
      mockReq.path = "/metrics";
      const middleware = requestTimeoutMiddleware();
      middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockReq.timeout).toBeUndefined();
    });

    it("should set timeout for regular paths", () => {
      const middleware = requestTimeoutMiddleware(5000);
      middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockReq.timeout).toBeDefined();
      expect(mockReq.startTime).toBe(1000000);
    });

    it("should fire timeout and return 408 if headers are not sent", () => {
      const middleware = requestTimeoutMiddleware(5000);
      middleware(mockReq, mockRes, nextFn);

      Date.now = jest.fn(() => 1000000 + 5000); // Simulate time passage
      jest.advanceTimersByTime(5000);

      expect(logWarn).toHaveBeenCalledWith("Request timeout", {
        method: "GET",
        path: "/api/test",
        timeout: 5000,
        duration: 5000,
      });
      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Request Timeout",
        message: "Request exceeded timeout of 5000ms",
        timeout: 5000,
      });
    });

    it("should not send 408 response if headers are already sent when timeout fires", () => {
      const middleware = requestTimeoutMiddleware(5000);
      middleware(mockReq, mockRes, nextFn);

      mockRes.headersSent = true;
      jest.advanceTimersByTime(5000);

      expect(logWarn).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should clear timeout when response finishes normally via end()", () => {
      const middleware = requestTimeoutMiddleware(5000);
      middleware(mockReq, mockRes, nextFn);

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      mockRes.end("test chunk");

      expect(clearTimeoutSpy).toHaveBeenCalledWith(mockReq.timeout);
    });

    it("should handle min timeout boundary", () => {
      const middleware = requestTimeoutMiddleware(500); // Below 1000
      middleware(mockReq, mockRes, nextFn);

      jest.advanceTimersByTime(999);
      expect(mockRes.status).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockRes.status).toHaveBeenCalledWith(408);
    });

    it("should handle max timeout boundary", () => {
      const middleware = requestTimeoutMiddleware(400000); // Above 300000
      middleware(mockReq, mockRes, nextFn);

      jest.advanceTimersByTime(299999);
      expect(mockRes.status).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockRes.status).toHaveBeenCalledWith(408);
    });
  });

  describe("getRequestTimeout", () => {
    it("should return 60000ms for POST /jobs", () => {
      expect(getRequestTimeout("/api/v1/jobs", "POST")).toBe(60000);
    });

    it("should return 45000ms for GET /reports", () => {
      expect(getRequestTimeout("/api/v1/reports", "GET")).toBe(45000);
    });

    it("should return 30000ms for other routes", () => {
      expect(getRequestTimeout("/api/v1/users", "GET")).toBe(30000);
    });
  });
});
