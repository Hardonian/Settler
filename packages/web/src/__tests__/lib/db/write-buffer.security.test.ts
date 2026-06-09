import { flushApiCallLogs, bufferApiCallLog, inMemoryBuffers } from "@/lib/db/write-buffer";
import { prisma } from "@/shared/db/prismaClient";

jest.mock("@/shared/db/prismaClient", () => {
  const { Prisma } = jest.requireActual("@prisma/client");

  return {
    Prisma,
    prisma: {
      $executeRaw: jest.fn().mockResolvedValue(1),
    },
  };
});

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
    inMemoryBuffers.apiCallLogs.length = 0;
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

    await bufferApiCallLog(maliciousLog);

    expect(prisma.$executeRaw).toHaveBeenCalled();

    const mockPrisma = prisma as any;
    const call = mockPrisma.$executeRaw.mock.calls[0];
    const sqlParts = call[0];
    const params = call.slice(1);

    expect(params).toContain(maliciousLog.userAgent);
    expect(params).toContain(maliciousLog.error);

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

    inMemoryBuffers.apiCallLogs.push(...maliciousLogs);

    await flushApiCallLogs();

    expect(prisma.$executeRaw).toHaveBeenCalled();

    const mockPrisma = prisma as any;
    const call = mockPrisma.$executeRaw.mock.calls[0];
    const sqlParts = call[0];
    const joinedValues = call[1]?.values ?? [];

    expect(joinedValues).toContain(maliciousLogs[1].userAgent);
    expect(joinedValues).toContain(maliciousLogs[1].error);

    const fullSql = sqlParts.join("?");
    expect(fullSql).not.toContain("UNION SELECT");
    expect(fullSql).not.toContain("injection'); --");
  });
});
