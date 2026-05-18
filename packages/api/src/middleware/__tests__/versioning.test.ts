import { Request, Response, NextFunction } from "express";
import { versionMiddleware, deprecateEndpoint, VersionedRequest } from "../versioning";

describe("Versioning Middleware", () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      get: jest.fn(),
    };
    mockResponse = {
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe("versionMiddleware", () => {
    it("should extract version from URL path correctly", () => {
      mockRequest.path = "/api/v2/resource";

      versionMiddleware(mockRequest as VersionedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.apiVersion).toBe("v2");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("Settler-Version", "v2");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("API-Version", "v2");
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should extract version from Settler-Version header", () => {
      mockRequest.path = "/api/resource";
      (mockRequest.get as jest.Mock).mockImplementation((headerName: string) => {
        if (headerName === "Settler-Version") return "v3";
        return undefined;
      });

      versionMiddleware(mockRequest as VersionedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.apiVersion).toBe("v3");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("Settler-Version", "v3");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("API-Version", "v3");
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should extract version from API-Version header", () => {
      mockRequest.path = "/api/resource";
      (mockRequest.get as jest.Mock).mockImplementation((headerName: string) => {
        if (headerName === "API-Version") return "v4";
        return undefined;
      });

      versionMiddleware(mockRequest as VersionedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.apiVersion).toBe("v4");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("Settler-Version", "v4");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("API-Version", "v4");
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should prefix header version with 'v' if it doesn't start with 'v'", () => {
      mockRequest.path = "/api/resource";
      (mockRequest.get as jest.Mock).mockImplementation((headerName: string) => {
        if (headerName === "API-Version") return "5";
        return undefined;
      });

      versionMiddleware(mockRequest as VersionedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.apiVersion).toBe("v5");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("Settler-Version", "v5");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("API-Version", "v5");
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should default to 'v1' if no version is provided in URL or headers", () => {
      mockRequest.path = "/api/resource";
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      versionMiddleware(mockRequest as VersionedRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.apiVersion).toBe("v1");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("Settler-Version", "v1");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("API-Version", "v1");
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe("deprecateEndpoint", () => {
    it("should set Deprecation and Sunset headers", () => {
      const sunsetDate = "2026-12-31T00:00:00Z";
      const middleware = deprecateEndpoint(sunsetDate);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith("Deprecation", "true");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("Sunset", sunsetDate);
      expect(mockResponse.setHeader).not.toHaveBeenCalledWith("Link", expect.any(String));
      expect(nextFunction).toHaveBeenCalled();
    });

    it("should set Link header with migration guide URL if provided", () => {
      const sunsetDate = "2026-12-31T00:00:00Z";
      const migrationGuideUrl = "/docs/migrations/v1-to-v2";
      const middleware = deprecateEndpoint(sunsetDate, migrationGuideUrl);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.setHeader).toHaveBeenCalledWith("Deprecation", "true");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("Sunset", sunsetDate);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Link",
        `<${migrationGuideUrl}>; rel="deprecation"`
      );
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
