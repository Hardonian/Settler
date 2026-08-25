import {
  traceBusiness,
  traceDatabase,
  traceCache,
  traceQueue,
  traceFunction,
  initializeTracing,
} from "../tracing";
import * as opentelemetryApi from "@opentelemetry/api";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("tracing", () => {
  let mockSpan: any;
  let mockTracer: any;

  // Mock the config so initializeTracing works
  jest.mock("../../../config", () => ({
    config: { observability: { otlpEndpoint: "http://localhost:4317", serviceName: "test" } },
  }));

  beforeAll(async () => {
    // We need to wait for the dynamic imports to resolve
    initializeTracing();
    await delay(500); // Wait enough time for async imports
  });

  beforeEach(() => {
    mockSpan = {
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    };

    mockTracer = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
    };

    // Override the getTracer on the real API that the tracing file already imported
    jest.spyOn(opentelemetryApi.trace, "getTracer").mockReturnValue(mockTracer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("traceFunction", () => {
    it("should execute function and return result on success", async () => {
      const result = await traceFunction("test-operation", async () => {
        return "success";
      });

      expect(result).toBe("success");
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.OK,
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("should set span status to ERROR when function throws", async () => {
      const error = new Error("Test function error");

      await expect(
        traceFunction("test-operation", async () => {
          throw error;
        })
      ).rejects.toThrow(error);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.ERROR,
        message: "Test function error",
      });
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("should set span status to ERROR with fallback message when non-Error thrown", async () => {
      await expect(
        traceFunction("test-operation", async () => {
          throw "string error";
        })
      ).rejects.toEqual("string error");

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.ERROR,
        message: "Unknown error", // Fallback for string error
      });
      expect(mockSpan.recordException).toHaveBeenCalled();
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe("traceBusiness", () => {
    it("should execute function and return result on success", async () => {
      const result = await traceBusiness("test-operation", async () => {
        return "success";
      });

      expect(result).toBe("success");
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.OK,
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("should set span status to ERROR when function throws", async () => {
      const error = new Error("Test business error");

      await expect(
        traceBusiness("test-operation", async () => {
          throw error;
        })
      ).rejects.toThrow(error);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.ERROR,
        message: "Test business error",
      });
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe("traceDatabase", () => {
    it("should execute function and return result on success", async () => {
      const result = await traceDatabase("select", "SELECT 1", async () => {
        return "success";
      });

      expect(result).toBe("success");
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.OK,
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("should set span status to ERROR when function throws", async () => {
      const error = new Error("Test database error");

      await expect(
        traceDatabase("select", "SELECT * FROM users", async () => {
          throw error;
        })
      ).rejects.toThrow(error);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.ERROR,
        message: "Test database error",
      });
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe("traceCache", () => {
    it("should execute function and return result on success", async () => {
      const result = await traceCache("get", "key", async () => {
        return "success";
      });

      expect(result).toBe("success");
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.OK,
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("should set span status to ERROR when function throws", async () => {
      const error = new Error("Test cache error");

      await expect(
        traceCache("get", "user:1", async () => {
          throw error;
        })
      ).rejects.toThrow(error);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.ERROR,
        message: "Test cache error",
      });
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe("traceQueue", () => {
    it("should execute function and return result on success", async () => {
      const result = await traceQueue("queue", "op", async () => {
        return "success";
      });

      expect(result).toBe("success");
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.OK,
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("should set span status to ERROR when function throws", async () => {
      const error = new Error("Test queue error");

      await expect(
        traceQueue("emails", "process", async () => {
          throw error;
        })
      ).rejects.toThrow(error);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: opentelemetryApi.SpanStatusCode.ERROR,
        message: "Test queue error",
      });
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });
});
