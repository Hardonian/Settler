import { deprecateEndpoint } from "../../middleware/versioning";
import { Request, Response, NextFunction } from "express";

describe("deprecateEndpoint Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      setHeader: jest.fn(),
    };
    nextFn = jest.fn() as NextFunction;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should set Deprecation and Sunset headers and call next", () => {
    const sunsetDate = "2026-12-31T00:00:00Z";
    const middleware = deprecateEndpoint(sunsetDate);

    middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.setHeader).toHaveBeenCalledWith("Deprecation", "true");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Sunset", sunsetDate);
    expect(mockRes.setHeader).toHaveBeenCalledTimes(2);
    expect(nextFn).toHaveBeenCalled();
  });

  it("should set Deprecation, Sunset, and Link headers when migrationGuideUrl is provided", () => {
    const sunsetDate = "2026-12-31T00:00:00Z";
    const migrationGuideUrl = "https://example.com/migration-guide";
    const middleware = deprecateEndpoint(sunsetDate, migrationGuideUrl);

    middleware(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.setHeader).toHaveBeenCalledWith("Deprecation", "true");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Sunset", sunsetDate);
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Link",
      `<${migrationGuideUrl}>; rel="deprecation"`
    );
    expect(mockRes.setHeader).toHaveBeenCalledTimes(3);
    expect(nextFn).toHaveBeenCalled();
  });
});
