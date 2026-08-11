import {
  RequestContext,
  MiddlewareNext,
  createLoggingMiddleware,
} from "../../src/utils/middleware";

describe("Logging Middleware", () => {
  it("should log request start and completion", async () => {
    const mockInfo = jest.fn();
    const mockError = jest.fn();

    const logger = {
      info: mockInfo,
      error: mockError,
    };

    const middleware = createLoggingMiddleware(logger);

    const context: RequestContext = {
      method: "GET",
      path: "/api/test",
      headers: {},
    };

    const mockNext: MiddlewareNext = jest.fn().mockResolvedValue({
      status: 200,
      headers: {},
      data: { success: true },
    });

    const response = await middleware(context, mockNext);

    expect(response.status).toBe(200);
    expect(mockInfo).toHaveBeenCalledTimes(2);
    expect(mockInfo).toHaveBeenNthCalledWith(1, "[Settler SDK] GET /api/test", expect.any(Object));
    expect(mockInfo).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("[Settler SDK] GET /api/test 200"),
      expect.any(Object)
    );
    expect(mockError).not.toHaveBeenCalled();
  });

  it("should log errors", async () => {
    const mockInfo = jest.fn();
    const mockError = jest.fn();

    const logger = {
      info: mockInfo,
      error: mockError,
    };

    const middleware = createLoggingMiddleware(logger);

    const context: RequestContext = {
      method: "POST",
      path: "/api/error",
      headers: {},
    };

    const mockErrorObj = new Error("Test error");
    const mockNext: MiddlewareNext = jest.fn().mockRejectedValue(mockErrorObj);

    await expect(middleware(context, mockNext)).rejects.toThrow("Test error");

    expect(mockInfo).toHaveBeenCalledTimes(1);
    expect(mockInfo).toHaveBeenNthCalledWith(
      1,
      "[Settler SDK] POST /api/error",
      expect.any(Object)
    );
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining("[Settler SDK] POST /api/error ERROR"),
      expect.any(Object)
    );
  });
});
