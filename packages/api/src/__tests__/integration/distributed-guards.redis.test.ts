import { spawn, spawnSync, ChildProcessWithoutNullStreams } from "child_process";
import Redis from "ioredis";

let redisClient: Redis | null = null;
let redisProcess: ChildProcessWithoutNullStreams | null = null;

jest.mock("../../utils/cache", () => ({
  getRedisClient: () => redisClient,
}));

jest.mock("../../db", () => ({
  query: jest.fn(),
}));

import { consumeRateLimitShared, consumeWebhookReplayKey } from "../../services/distributed-guards";

function waitForRedisReady(proc: ChildProcessWithoutNullStreams): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("redis-server startup timeout")), 10_000);

    proc.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      if (text.includes("Ready to accept connections")) {
        clearTimeout(timeout);
        resolve();
      }
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      if (text.toLowerCase().includes("error")) {
        clearTimeout(timeout);
        reject(new Error(text));
      }
    });

    proc.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`redis-server exited early: ${code}`));
    });
  });
}

describe("distributed guards with real redis", () => {
  const port = 6391;
  let redisAvailable = false;

  beforeAll(async () => {
    const probe = spawnSync("redis-server", ["--version"], { encoding: "utf8" });
    if (probe.status !== 0) {
      redisAvailable = false;
      return;
    }

    redisAvailable = true;
    redisProcess = spawn("redis-server", [
      "--save",
      "",
      "--appendonly",
      "no",
      "--port",
      String(port),
    ]);
    await waitForRedisReady(redisProcess);

    redisClient = new Redis(port, "127.0.0.1", { lazyConnect: false, maxRetriesPerRequest: 1 });
    await redisClient.flushdb();
  });

  afterAll(async () => {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
    if (redisProcess) {
      redisProcess.kill("SIGTERM");
    }
  });

  it("enforces shared redis rate limits", async () => {
    if (!redisAvailable || !redisClient) {
      return;
    }

    const key = { tenantScope: "tenant-r", routeScope: "post:/jobs", limit: 2, windowMs: 30_000 };
    const first = await consumeRateLimitShared(key);
    const second = await consumeRateLimitShared(key);
    const third = await consumeRateLimitShared(key);

    expect(first.guarantee).toBe("distributed_shared");
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("enforces shared redis webhook replay dedupe", async () => {
    if (!redisAvailable || !redisClient) {
      return;
    }

    const first = await consumeWebhookReplayKey({
      adapter: "stripe",
      tenantId: "tenant-r",
      payload: { id: "evt_redis_1" },
      signature: "sig_redis",
    });

    const second = await consumeWebhookReplayKey({
      adapter: "stripe",
      tenantId: "tenant-r",
      payload: { id: "evt_redis_1" },
      signature: "sig_redis",
    });

    expect(first.guarantee).toBe("distributed_shared");
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
  });
});
