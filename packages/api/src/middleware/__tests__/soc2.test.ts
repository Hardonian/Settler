import { enforceIpAllowlist } from "../ip-allowlist";
import { soc2AuditLogger } from "../soc2-audit-logger";
import { AuthRequest } from "../auth";
import { Response } from "express";
import { query } from "../../db";

// Mock the database query
jest.mock("../../db", () => ({
  query: jest.fn(),
}));

describe("SOC 2 Enterprise Hardening Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "info").mockImplementation(() => {});
  });

  describe("IP Allowlist (SOC 2 CC6.1)", () => {
    it("should pass request if no tenant is set (public routes)", async () => {
      const req = { tenantId: undefined } as unknown as AuthRequest;
      const res = {} as Response;
      const next = jest.fn();

      await enforceIpAllowlist(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should pass request if tenant has no CIDR blocks configured", async () => {
      const req = {
        tenantId: "tenant-1",
        ip: "192.168.1.1",
        headers: {},
        socket: {},
      } as unknown as AuthRequest;
      const res = {} as Response;
      const next = jest.fn();

      (query as jest.Mock).mockResolvedValueOnce([]); // No blocks

      await enforceIpAllowlist(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should block request if client IP is not in configured CIDR block", async () => {
      const req = {
        tenantId: "tenant-1",
        ip: "203.0.113.1", // Unapproved IP
        headers: {},
        socket: {},
      } as unknown as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      const next = jest.fn();

      // Configure a CIDR block that does NOT include 203.0.113.1
      (query as jest.Mock).mockResolvedValueOnce([{ cidr_block: "192.168.1.0/24" }]);

      await enforceIpAllowlist(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "NETWORK_ACCESS_DENIED",
        })
      );
    });

    it("should pass request if client IP IS within configured CIDR block", async () => {
      const req = {
        tenantId: "tenant-1",
        ip: "192.168.1.50", // Approved IP
        headers: {},
        socket: {},
      } as unknown as AuthRequest;
      const res = {} as Response;
      const next = jest.fn();

      (query as jest.Mock).mockResolvedValueOnce([{ cidr_block: "192.168.1.0/24" }]);

      await enforceIpAllowlist(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("SOC 2 Audit Logger (SOC 2 CC7.2)", () => {
    it("should ignore GET requests", () => {
      const req = { method: "GET" } as AuthRequest;
      const res = {} as Response;
      const next = jest.fn();

      soc2AuditLogger()(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
    });

    it("should log POST mutations upon response finish", () => {
      const req = {
        method: "POST",
        path: "/api/v1/exceptions",
        tenantId: "tenant-1",
        userId: "user-123",
        ip: "10.0.0.1",
        headers: {},
        socket: {},
      } as unknown as AuthRequest;

      // Mock response finish event
      let finishCallback: () => void = () => {};
      const res = {
        statusCode: 201,
        on: jest.fn().mockImplementation((event, cb) => {
          if (event === "finish") finishCallback = cb;
        }),
      } as unknown as Response;

      const next = jest.fn();

      soc2AuditLogger()(req, res, next);
      expect(next).toHaveBeenCalled();

      // Trigger the finish event
      finishCallback();

      // Assert that the structured SOC 2 log was emitted
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"_soc2_audit":true'));
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"action":"HTTP_POST__API_V1_EXCEPTIONS"')
      );
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"userId":"user-123"'));
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"statusCode":201'));
    });
  });
});
