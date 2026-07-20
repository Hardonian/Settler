import { PrioritizedQueue, QueuePriority } from "../../../infrastructure/queue/PrioritizedQueue";
import { TenantTier } from "../../../domain/entities/Tenant";
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { traceQueue } from "../../../infrastructure/observability/tracing";

jest.mock("bullmq");
jest.mock("ioredis");
jest.mock("../../../infrastructure/observability/tracing", () => ({
  traceQueue: jest.fn().mockImplementation(async (queueName, operation, fn) => fn()),
}));
jest.mock("../../../infrastructure/observability/metrics", () => ({
  queueDepth: { set: jest.fn() },
}));
jest.mock("../../../config", () => ({
  config: {
    redis: {
      host: "localhost",
      port: 6379,
    },
  },
}));

describe("PrioritizedQueue", () => {
  let queue: PrioritizedQueue;
  let mockProcessor: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Queue mock setup to ensure basic queue operations work
    (Queue as unknown as jest.Mock).mockImplementation(() => ({
      add: jest.fn(),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      pause: jest.fn(),
      resume: jest.fn(),
      close: jest.fn(),
    }));

    mockProcessor = jest.fn().mockResolvedValue("success");
    queue = new PrioritizedQueue("test-queue", mockProcessor);
  });

  afterEach(async () => {
    // Clear interval set in constructor to avoid open handles
    jest.useRealTimers();
    await queue.close();
  });

  describe("Initialization", () => {
    it("should initialize queue with proper configuration", () => {
      expect(Redis).toHaveBeenCalled();
      expect(Queue).toHaveBeenCalledWith("test-queue", expect.any(Object));
    });
  });

  describe("Adding jobs", () => {
    it("should calculate priority correctly for FREE tier", async () => {
      const mockAdd = jest.fn();
      (Queue as unknown as jest.Mock).mockImplementation(() => ({
        add: mockAdd,
        getWaitingCount: jest.fn().mockResolvedValue(0),
        getActiveCount: jest.fn().mockResolvedValue(0),
        getDelayedCount: jest.fn().mockResolvedValue(0),
        close: jest.fn(),
      }));

      const localQueue = new PrioritizedQueue("test-queue-2", mockProcessor);

      await localQueue.add(
        {
          tenantId: "tenant-1",
          tenantTier: TenantTier.FREE,
        },
        QueuePriority.NORMAL
      );

      expect(mockAdd).toHaveBeenCalledWith(
        "job",
        expect.any(Object),
        expect.objectContaining({ priority: 5 }) // FREE(1) * NORMAL(5) = 5
      );

      await localQueue.close();
    });

    it("should bypass queue and execute immediately for ENTERPRISE tier", async () => {
      const jobData = {
        tenantId: "tenant-ent",
        tenantTier: TenantTier.ENTERPRISE,
        jobId: "job-123",
      };

      await queue.add(jobData, QueuePriority.NORMAL);

      // Should call processor directly
      expect(mockProcessor).toHaveBeenCalledTimes(1);

      // Should not add to Queue
      const mockQueueAdd = (queue as any).queue.add;
      expect(mockQueueAdd).not.toHaveBeenCalled();

      // Should trace the execution
      expect(traceQueue).toHaveBeenCalledWith(
        "test-queue",
        "execute_immediate",
        expect.any(Function),
        "tenant-ent",
        "job-123"
      );
    });

    it("should pass options correctly when adding jobs", async () => {
      const mockAdd = jest.fn();
      (Queue as unknown as jest.Mock).mockImplementation(() => ({
        add: mockAdd,
        getWaitingCount: jest.fn().mockResolvedValue(0),
        getActiveCount: jest.fn().mockResolvedValue(0),
        getDelayedCount: jest.fn().mockResolvedValue(0),
        close: jest.fn(),
      }));

      const localQueue = new PrioritizedQueue("test-queue-3", mockProcessor);

      const jobData = {
        tenantId: "tenant-1",
        tenantTier: TenantTier.PRO,
        jobId: "custom-job-id",
      };

      await localQueue.add(jobData, QueuePriority.HIGH, { delay: 5000 });

      expect(mockAdd).toHaveBeenCalledWith(
        "job",
        jobData,
        expect.objectContaining({
          priority: 50, // PRO(5) * HIGH(10) = 50
          delay: 5000,
          jobId: "custom-job-id",
        })
      );

      await localQueue.close();
    });
  });

  describe("Worker", () => {
    it("should start worker and process jobs", () => {
      queue.startWorker(10);

      expect(Worker).toHaveBeenCalledWith(
        "test-queue",
        expect.any(Function),
        expect.objectContaining({
          concurrency: 10,
          limiter: expect.any(Object),
        })
      );
    });

    it("should not start multiple workers if already started", () => {
      queue.startWorker(5);
      queue.startWorker(10);

      expect(Worker).toHaveBeenCalledTimes(1);
    });
  });

  describe("Queue Operations", () => {
    it("should retrieve queue stats correctly", async () => {
      const mockQueue = (queue as any).queue;
      mockQueue.getWaitingCount.mockResolvedValue(10);
      mockQueue.getActiveCount.mockResolvedValue(5);
      mockQueue.getCompletedCount.mockResolvedValue(100);
      mockQueue.getFailedCount.mockResolvedValue(2);
      mockQueue.getDelayedCount.mockResolvedValue(3);

      const stats = await queue.getStats();

      expect(stats).toEqual({
        waiting: 10,
        active: 5,
        completed: 100,
        failed: 2,
        delayed: 3,
      });
    });

    it("should pause and resume queue", async () => {
      const mockQueue = (queue as any).queue;

      await queue.pause();
      expect(mockQueue.pause).toHaveBeenCalled();

      await queue.resume();
      expect(mockQueue.resume).toHaveBeenCalled();
    });
  });
});
