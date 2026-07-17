import {
  PrioritizedQueue,
  QueuePriority,
  QueueJobData,
} from "../../../infrastructure/queue/PrioritizedQueue";
import { TenantTier } from "../../../domain/entities/Tenant";
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

// Mock dependencies
jest.mock("bullmq");
jest.mock("ioredis");
jest.mock("../../../config", () => ({
  config: {
    redis: {
      url: "redis://localhost:6379",
    },
  },
}));
jest.mock("../../../infrastructure/observability/tracing", () => ({
  traceQueue: jest.fn(async (queueName, operation, fn) => {
    return await fn();
  }),
}));
jest.mock("../../../infrastructure/observability/metrics", () => ({
  queueDepth: {
    set: jest.fn(),
  },
}));

describe("PrioritizedQueue", () => {
  let queue: PrioritizedQueue;
  let mockProcessor: jest.Mock;
  let mockQueueInstance: any;
  let mockWorkerInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockProcessor = jest.fn();
    mockQueueInstance = {
      add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (Queue as unknown as jest.Mock).mockReturnValue(mockQueueInstance);

    mockWorkerInstance = {
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };
    (Worker as unknown as jest.Mock).mockReturnValue(mockWorkerInstance);

    queue = new PrioritizedQueue("test-queue", mockProcessor);
  });

  afterEach(async () => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("constructor", () => {
    it("should initialize Queue and Redis connections", () => {
      expect(Redis).toHaveBeenCalled();
      expect(Queue).toHaveBeenCalledWith("test-queue", expect.any(Object));
    });

    it("should set up periodic queue depth metric updates", async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve(); // allow the async interval handler to tick
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      expect(mockQueueInstance.getWaitingCount).toHaveBeenCalled();
      expect(mockQueueInstance.getActiveCount).toHaveBeenCalled();
      expect(mockQueueInstance.getDelayedCount).toHaveBeenCalled();
    });
  });

  describe("add", () => {
    it("should process enterprise jobs immediately without queuing", async () => {
      const data: QueueJobData = {
        tenantId: "tenant-1",
        tenantTier: TenantTier.ENTERPRISE,
        jobId: "job-1",
      };

      await queue.add(data);

      expect(mockProcessor).toHaveBeenCalled();
      expect(mockQueueInstance.add).not.toHaveBeenCalled();
    });

    it("should calculate priority correctly based on tier and base priority", async () => {
      const data: QueueJobData = {
        tenantId: "tenant-1",
        tenantTier: TenantTier.PRO,
      };

      await queue.add(data, QueuePriority.HIGH); // PRO (5) * HIGH (10) = 50

      expect(mockQueueInstance.add).toHaveBeenCalledWith(
        "job",
        data,
        expect.objectContaining({ priority: 50 })
      );
      expect(mockProcessor).not.toHaveBeenCalled();
    });

    it("should support delay option", async () => {
      const data: QueueJobData = {
        tenantId: "tenant-1",
        tenantTier: TenantTier.FREE,
      };

      await queue.add(data, QueuePriority.NORMAL, { delay: 1000 });

      expect(mockQueueInstance.add).toHaveBeenCalledWith(
        "job",
        data,
        expect.objectContaining({ delay: 1000 })
      );
    });

    it("should pass jobId to queue options if provided", async () => {
      const data: QueueJobData = {
        tenantId: "tenant-1",
        tenantTier: TenantTier.FREE,
        jobId: "custom-job-id",
      };

      await queue.add(data, QueuePriority.NORMAL);

      expect(mockQueueInstance.add).toHaveBeenCalledWith(
        "job",
        data,
        expect.objectContaining({ jobId: "custom-job-id" })
      );
    });
  });

  describe("startWorker", () => {
    it("should initialize and start the worker", () => {
      queue.startWorker(10);

      expect(Worker).toHaveBeenCalledWith(
        "test-queue",
        expect.any(Function),
        expect.objectContaining({
          concurrency: 10,
        })
      );
      expect(mockWorkerInstance.on).toHaveBeenCalledWith("completed", expect.any(Function));
      expect(mockWorkerInstance.on).toHaveBeenCalledWith("failed", expect.any(Function));
    });

    it("should not start multiple workers", () => {
      queue.startWorker();
      queue.startWorker();

      expect(Worker).toHaveBeenCalledTimes(1);
    });
  });

  describe("getStats", () => {
    it("should return queue statistics", async () => {
      mockQueueInstance.getWaitingCount.mockResolvedValue(5);
      mockQueueInstance.getActiveCount.mockResolvedValue(2);
      mockQueueInstance.getCompletedCount.mockResolvedValue(10);
      mockQueueInstance.getFailedCount.mockResolvedValue(1);
      mockQueueInstance.getDelayedCount.mockResolvedValue(3);

      const stats = await queue.getStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 10,
        failed: 1,
        delayed: 3,
      });
    });
  });

  describe("lifecycle methods", () => {
    it("should pause the queue", async () => {
      await queue.pause();
      expect(mockQueueInstance.pause).toHaveBeenCalled();
    });

    it("should resume the queue", async () => {
      await queue.resume();
      expect(mockQueueInstance.resume).toHaveBeenCalled();
    });

    it("should close the queue, worker, and redis connections", async () => {
      queue.startWorker();

      const quitMock = jest.fn();
      // Access the private redis instance using any
      (queue as any).redis.quit = quitMock;

      await queue.close();

      expect(mockWorkerInstance.close).toHaveBeenCalled();
      expect(mockQueueInstance.close).toHaveBeenCalled();
      expect(quitMock).toHaveBeenCalled();
    });
  });
});
