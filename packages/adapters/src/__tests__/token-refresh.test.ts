import { refreshTokenIfNeeded } from "../token-refresh";
import { ConnectorDriver } from "../connector-driver";
import { createClient } from "@supabase/supabase-js";
import { decryptToken } from "../credential-encryption";

jest.mock("@supabase/supabase-js", () => {
  return {
    createClient: jest.fn(),
  };
});

jest.mock("../credential-encryption", () => {
  return {
    encryptToken: jest.fn(),
    decryptToken: jest.fn(),
  };
});

describe("token-refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("error handling", () => {
    it("should handle Error object thrown during token refresh", async () => {
      const mockDriver: ConnectorDriver = {
        refreshToken: jest.fn().mockRejectedValue(new Error("Network connection failed")),
        id: "test",
        name: "Test",
      } as any;

      const credentials = {
        refresh_token: "old-refresh-token",
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "connector-1", config: {} },
        }),
      };

      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      (decryptToken as jest.Mock).mockResolvedValue("decrypted-token");

      const result = await refreshTokenIfNeeded(
        mockDriver,
        "test",
        "tenant-1",
        credentials,
        "http://localhost",
        "secret-key"
      );

      expect(result).toEqual({
        refreshed: false,
        error: "Network connection failed",
      });
    });

    it("should handle non-Error object thrown during token refresh", async () => {
      const mockDriver: ConnectorDriver = {
        refreshToken: jest.fn().mockRejectedValue("Some weird error string"),
        id: "test",
        name: "Test",
      } as any;

      const credentials = {
        refresh_token: "old-refresh-token",
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "connector-1", config: {} },
        }),
      };

      (createClient as jest.Mock).mockReturnValue(mockSupabase);
      (decryptToken as jest.Mock).mockResolvedValue("decrypted-token");

      const result = await refreshTokenIfNeeded(
        mockDriver,
        "test",
        "tenant-1",
        credentials,
        "http://localhost",
        "secret-key"
      );

      expect(result).toEqual({
        refreshed: false,
        error: "Token refresh failed",
      });
    });

    it("should return false if connector is not found", async () => {
      const mockDriver: ConnectorDriver = {
        refreshToken: jest.fn(),
        id: "test",
        name: "Test",
      } as any;

      const credentials = {
        refresh_token: "old-refresh-token",
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
        }),
      };

      (createClient as jest.Mock).mockReturnValue(mockSupabase);

      const result = await refreshTokenIfNeeded(
        mockDriver,
        "test",
        "tenant-1",
        credentials,
        "http://localhost",
        "secret-key"
      );

      expect(result).toEqual({
        refreshed: false,
        error: "Connector not found",
      });
    });
  });
});
