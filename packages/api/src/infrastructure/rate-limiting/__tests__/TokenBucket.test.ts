const redisClient = {
  defineCommand: jest.fn(),
  on: jest.fn(),
  hmget: jest.fn().mockResolvedValue([null, null]),
  del: jest.fn().mockResolvedValue(1),
  quit: jest.fn().mockResolvedValue("OK"),
};

jest.mock("ioredis", () => ({
  __esModule: true,
  default: jest.fn(() => redisClient),
}));

import Redis from "ioredis";
import { TokenBucket } from "../TokenBucket";

const RedisMock = Redis as unknown as jest.Mock;

describe("TokenBucket connection lifecycle", () => {
  beforeEach(() => {
    RedisMock.mockClear();
    redisClient.defineCommand.mockClear();
    redisClient.on.mockClear();
    redisClient.hmget.mockClear();
    redisClient.del.mockClear();
    redisClient.quit.mockClear();
  });

  it("does not open Redis during construction", async () => {
    const bucket = new TokenBucket();

    expect(RedisMock).not.toHaveBeenCalled();
    await bucket.close();
    expect(redisClient.quit).not.toHaveBeenCalled();
  });

  it("opens one shared connection on first Redis-backed operation", async () => {
    const bucket = new TokenBucket();
    const config = { capacity: 10, refillRate: 1 };

    await bucket.peek("tenant-a", config);
    await bucket.peek("tenant-a", config);

    expect(RedisMock).toHaveBeenCalledTimes(1);
    expect(redisClient.defineCommand).toHaveBeenCalledTimes(1);
    expect(redisClient.hmget).toHaveBeenCalledTimes(2);

    await bucket.close();
    expect(redisClient.quit).toHaveBeenCalledTimes(1);
  });
});
