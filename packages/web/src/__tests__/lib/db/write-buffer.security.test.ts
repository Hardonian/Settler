import { flushApiCallLogs, bufferApiCallLog } from "@/lib/db/write-buffer";
import { prisma } from "@/shared/db/prismaClient";

jest.mock("@/shared/db/prismaClient", () => ({
  prisma: {
    $executeRaw: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock("@/lib/utils/logger", () => ({
  appLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Write Buffer Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should safely handle SQL injection attempts in API call logs", async () => {
    const maliciousLog = {
      tenantId: "tenant-1",
      userId: "user-1",
      method: "GET",
      path: "/api/test",
      statusCode: 200,
      responseTime: 100,
      userAgent: "') OR '1'='1",
      ipAddress: "127.0.0.1",
      error: "'); DROP TABLE api_call_logs; --",
      createdAt: new Date(),
    };

    // Trigger sync write (since buffering is disabled in test env by default)
    await bufferApiCallLog(maliciousLog);

    expect(prisma.$executeRaw).toHaveBeenCalled();

    // The first argument to $executeRaw should be a template strings array (or something that Prisma handles)
    // When using tagged template literals, the parameters are passed separately from the SQL string.
    const mockPrisma = prisma as any;
    const call = mockPrisma.$executeRaw.mock.calls[0];
    const sqlParts = call[0];

    // Verify that malicious strings are passed as parameters, not part of the SQL string
    const params = call.slice(1);

    let foundUserAgent = false;
    let foundError = false;
    for (const param of params) {
      if (param === maliciousLog.userAgent) foundUserAgent = true;
      if (param === maliciousLog.error) foundError = true;
    }
    expect(foundUserAgent).toBe(true);
    expect(foundError).toBe(true);

    // Ensure the SQL itself doesn't contain the unescaped malicious strings
    const fullSql = sqlParts.join("?");
    expect(fullSql).not.toContain("OR '1'='1");
    expect(fullSql).not.toContain("DROP TABLE api_call_logs");
  });

  it("should safely handle batch inserts with malicious data", async () => {
    const maliciousLogs = [
      {
        tenantId: "tenant-1",
        userId: "user-1",
        method: "GET",
        path: "/api/test1",
        statusCode: 200,
        responseTime: 100,
        userAgent: "safe-agent",
        ipAddress: "127.0.0.1",
        createdAt: new Date(),
      },
      {
        tenantId: "tenant-1",
        userId: "user-1",
        method: "POST",
        path: "/api/test2",
        statusCode: 500,
        responseTime: 200,
        userAgent: "') UNION SELECT NULL--",
        ipAddress: "127.0.0.2",
        error: "injection'); --",
        createdAt: new Date(),
      },
    ];

    // We need to put logs into the in-memory buffer first
    const { inMemoryBuffers } = require("@/lib/db/write-buffer");
    inMemoryBuffers.apiCallLogs.push(...maliciousLogs);

    await flushApiCallLogs();

    expect(prisma.$executeRaw).toHaveBeenCalled();

    // Check parameters of the batch insert
    const mockPrisma = prisma as any;
    const call = mockPrisma.$executeRaw.mock.calls[0];
    const params = call.slice(1);

    let foundUserAgent = false;
    let foundError = false;
    for (const param of params) {
      if (param === maliciousLogs[1].userAgent) foundUserAgent = true;
      if (param === maliciousLogs[1].error) foundError = true;
    }
    expect(foundUserAgent).toBe(true);
    expect(foundError).toBe(true);
  });
});
