/**
 * REDIS_REQUIRED_FOR_PRODUCTION startup gate
 */

const getRedisClientMock = jest.fn();

jest.mock("../cache", () => ({
  getRedisClient: (...args: unknown[]) => getRedisClientMock(...args),
}));

jest.mock("../../db", () => ({
  initDatabase: jest.fn(),
  query: jest.fn(() => Promise.resolve([{ "?column?": 1 }])),
}));

jest.mock("../schema-validation", () => ({
  validateSchema: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../../../../config/env.schema", () => ({
  getRequiredEnvVars: () => [],
  validateEnvVar: () => ({ valid: true }),
}));

jest.mock("../../config", () => ({
  config: {
    nodeEnv: "production",
    encryption: { key: "x".repeat(32) },
    jwt: { secret: "y".repeat(32) },
    logging: { level: "error" },
  },
}));

describe("validateRedisProductionRequirement", () => {
  const orig = process.env.REDIS_REQUIRED_FOR_PRODUCTION;

  afterEach(() => {
    if (orig === undefined) {
      delete process.env.REDIS_REQUIRED_FOR_PRODUCTION;
    } else {
      process.env.REDIS_REQUIRED_FOR_PRODUCTION = orig;
    }
    jest.clearAllMocks();
  });

  it("returns null when gate is off", async () => {
    delete process.env.REDIS_REQUIRED_FOR_PRODUCTION;
    const { validateRedisProductionRequirement } = await import("../startup-validation");
    expect(await validateRedisProductionRequirement()).toBeNull();
  });

  it("errors when gate is on and Redis client is missing", async () => {
    process.env.REDIS_REQUIRED_FOR_PRODUCTION = "true";
    getRedisClientMock.mockReturnValue(null);
    const { validateRedisProductionRequirement } = await import("../startup-validation");
    const r = await validateRedisProductionRequirement();
    expect(r?.status).toBe("error");
    expect(r?.name).toBe("redis_production_requirement");
    expect(r?.message).toMatch(/not configured/);
  });

  it("ok when gate is on and Redis pings", async () => {
    process.env.REDIS_REQUIRED_FOR_PRODUCTION = "1";
    getRedisClientMock.mockReturnValue({ ping: jest.fn(() => Promise.resolve("PONG")) });
    const { validateRedisProductionRequirement } = await import("../startup-validation");
    const r = await validateRedisProductionRequirement();
    expect(r?.status).toBe("ok");
  });
});
