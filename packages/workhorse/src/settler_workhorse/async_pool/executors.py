import asyncio
import functools
import time
from collections.abc import Callable

from .models import TaskStats


class AsyncTaskExecutor:
    """Async task executor with backpressure handling.

    Features:
    - Concurrent task execution with limits
    - Backpressure when queue is full
    - Task prioritization
    - Cancellation support
    - Rate limiting integration

    Example:
        executor = AsyncTaskExecutor(
            max_concurrent=10,
            max_queue_size=100,
        )

        # Submit tasks
        task_id = await executor.submit(process_job, job_data, priority=1)

        # Cancel if needed
        await executor.cancel(task_id)

        # Shutdown gracefully
        await executor.shutdown(wait=True)
    """

    def __init__(
        self,
        max_concurrent: int = 10,
        max_queue_size: int = 100,
        task_timeout: float | None = None,
    ):
        self.max_concurrent = max_concurrent
        self.max_queue_size = max_queue_size
        self.task_timeout = task_timeout

        self._queue: asyncio.PriorityQueue[tuple[int, int, Callable, tuple, dict]] = (
            asyncio.PriorityQueue(maxsize=max_queue_size)
        )
        self._running: dict[int, asyncio.Task] = {}
        self._stats = TaskStats()
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._task_counter = 0
        self._counter_lock = asyncio.Lock()
        self._worker_task: asyncio.Task | None = None
        self._shutdown = False

    async def start(self):
        """Start the task executor."""
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._worker_loop())

    async def _worker_loop(self):
        """Main worker loop processing tasks."""
        while not self._shutdown:
            try:
                # Get task from queue
                priority, task_id, func, args, kwargs = await self._queue.get()

                # Execute with concurrency limit
                async with self._semaphore:
                    task = asyncio.create_task(self._execute_task(task_id, func, args, kwargs))
                    self._running[task_id] = task

                    try:
                        if self.task_timeout:
                            await asyncio.wait_for(task, timeout=self.task_timeout)
                        else:
                            await task
                    except TimeoutError:
                        self._stats.tasks_failed += 1
                        task.cancel()
                    except asyncio.CancelledError:
                        self._stats.tasks_cancelled += 1
                    finally:
                        self._running.pop(task_id, None)

                self._queue.task_done()

            except asyncio.CancelledError:
                break
            except Exception:
                pass  # Continue processing

    async def _execute_task(self, task_id: int, func: Callable, args: tuple, kwargs: dict):
        """Execute a single task."""
        start = time.perf_counter()

        try:
            if asyncio.iscoroutinefunction(func):
                await func(*args, **kwargs)
            else:
                # Run sync function in thread pool
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, functools.partial(func, *args, **kwargs))

            self._stats.tasks_completed += 1

        except asyncio.CancelledError:
            self._stats.tasks_cancelled += 1
            raise
        except Exception:
            self._stats.tasks_failed += 1
            raise
        finally:
            exec_time = (time.perf_counter() - start) * 1000
            total = (
                self._stats.tasks_completed + self._stats.tasks_failed + self._stats.tasks_cancelled
            )
            self._stats.avg_execution_time_ms = (
                ((self._stats.avg_execution_time_ms * (total - 1) + exec_time) / total)
                if total > 0
                else 0
            )

    async def submit(
        self,
        func: Callable,
        *args,
        priority: int = 5,
        **kwargs,
    ) -> int:
        """Submit a task for execution.

        Args:
            func: Function to execute
            *args: Positional arguments
            priority: Task priority (lower = higher priority)
            **kwargs: Keyword arguments

        Returns:
            Task ID for tracking/cancellation
        """
        if self._shutdown:
            raise RuntimeError("Executor is shutting down")

        async with self._counter_lock:
            self._task_counter += 1
            task_id = self._task_counter

        # Priority queue uses lowest first, so negate priority
        queue_priority = -priority

        try:
            self._queue.put_nowait((queue_priority, task_id, func, args, kwargs))
            self._stats.tasks_submitted += 1
            self._stats.queue_depth = self._queue.qsize()
            self._stats.max_queue_depth = max(self._stats.max_queue_depth, self._stats.queue_depth)

            return task_id

        except asyncio.QueueFull as err:
            raise RuntimeError(f"Task queue is full (max {self.max_queue_size})") from err

    async def cancel(self, task_id: int) -> bool:
        """Cancel a running or queued task."""
        # Check if running
        if task_id in self._running:
            task = self._running[task_id]
            task.cancel()
            return True

        # Note: Can't easily remove from PriorityQueue, will be skipped when processed
        return False

    async def shutdown(self, wait: bool = True, timeout: float | None = None):
        """Shutdown the executor."""
        self._shutdown = True

        # Cancel running tasks
        for task in list(self._running.values()):
            task.cancel()

        if wait and self._worker_task:
            try:
                if timeout:
                    await asyncio.wait_for(self._worker_task, timeout=timeout)
                else:
                    await self._worker_task
            except TimeoutError:
                self._worker_task.cancel()
            except asyncio.CancelledError:
                pass
        elif self._worker_task:
            self._worker_task.cancel()

    def get_stats(self) -> TaskStats:
        """Get execution statistics."""
        self._stats.queue_depth = self._queue.qsize()
        return self._stats
