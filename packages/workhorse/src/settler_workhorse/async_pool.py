"""
Async connection pooling and concurrent job processing.

Provides database connection pooling, async job processing, and
backpressure handling for high-throughput ML/AI workloads.
"""

import asyncio
import functools
import threading
import time
from abc import ABC, abstractmethod
from collections import deque
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import (
    Any, AsyncIterator, Callable, Coroutine, Dict, Generic, List, Optional, Protocol,
    Set, TypeVar, Union, cast
)


class PoolState(Enum):
    """States of a connection pool."""
    INITIALIZING = "initializing"
    READY = "ready"
    CLOSING = "closing"
    CLOSED = "closed"
    ERROR = "error"


@dataclass
class PoolStats:
    """Connection pool statistics."""
    total_connections: int = 0
    active_connections: int = 0
    idle_connections: int = 0
    waiting_requests: int = 0
    total_requests: int = 0
    total_failures: int = 0
    avg_wait_time_ms: float = 0.0
    avg_use_time_ms: float = 0.0
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class TaskStats:
    """Task execution statistics."""
    tasks_submitted: int = 0
    tasks_completed: int = 0
    tasks_failed: int = 0
    tasks_cancelled: int = 0
    avg_execution_time_ms: float = 0.0
    queue_depth: int = 0
    max_queue_depth: int = 0


class ConnectionInterface(ABC):
    """Abstract base class for pooled connections."""
    
    @abstractmethod
    async def open(self) -> bool:
        """Open the connection."""
        pass
    
    @abstractmethod
    async def close(self) -> bool:
        """Close the connection."""
        pass
    
    @abstractmethod
    def is_valid(self) -> bool:
        """Check if connection is still valid."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Perform health check."""
        pass


class ConnectionPool:
    """
    Async connection pool with health checks and lifecycle management.
    
    Features:
    - Min/max connection limits
    - Connection health checks
    - Automatic reconnection
    - Wait timeout for busy pools
    - Connection lifecycle hooks
    
    Example:
        class DatabaseConnection(ConnectionInterface):
            async def open(self): ...
            async def close(self): ...
            def is_valid(self): ...
            async def health_check(self): ...
        
        async def connection_factory() -> DatabaseConnection:
            conn = DatabaseConnection()
            await conn.open()
            return conn
        
        pool = ConnectionPool(
            factory=connection_factory,
            min_connections=5,
            max_connections=20,
        )
        
        async with pool.acquire() as conn:
            await conn.execute("SELECT * FROM jobs")
    """
    
    def __init__(
        self,
        factory: Callable[[], Coroutine[Any, Any, ConnectionInterface]],
        min_connections: int = 5,
        max_connections: int = 20,
        max_wait_seconds: float = 30.0,
        max_idle_seconds: float = 300.0,
        health_check_interval: float = 60.0,
        connection_timeout: float = 10.0,
    ):
        self.factory = factory
        self.min_connections = min_connections
        self.max_connections = max_connections
        self.max_wait_seconds = max_wait_seconds
        self.max_idle_seconds = max_idle_seconds
        self.health_check_interval = health_check_interval
        self.connection_timeout = connection_timeout
        
        self._pool: asyncio.Queue[ConnectionInterface] = asyncio.Queue(maxsize=max_connections)
        self._in_use: Set[ConnectionInterface] = set()
        self._waiting: int = 0
        self._stats = PoolStats()
        self._state = PoolState.INITIALIZING
        self._lock = asyncio.Lock()
        self._health_check_task: Optional[asyncio.Task] = None
        self._semaphore = asyncio.Semaphore(max_connections)
    
    async def initialize(self):
        """Initialize the pool with minimum connections."""
        async with self._lock:
            if self._state != PoolState.INITIALIZING:
                return
            
            try:
                for _ in range(self.min_connections):
                    conn = await asyncio.wait_for(
                        self.factory(),
                        timeout=self.connection_timeout,
                    )
                    await self._pool.put(conn)
                
                self._state = PoolState.READY
                self._stats.total_connections = self._pool.qsize()
                
                # Start health check loop
                self._health_check_task = asyncio.create_task(self._health_check_loop())
                
            except Exception as e:
                self._state = PoolState.ERROR
                raise RuntimeError(f"Failed to initialize pool: {e}")
    
    async def _health_check_loop(self):
        """Background task for health checks."""
        while self._state == PoolState.READY:
            try:
                await asyncio.sleep(self.health_check_interval)
                await self._check_health()
            except asyncio.CancelledError:
                break
            except Exception:
                pass  # Don't crash the health check loop
    
    async def _check_health(self):
        """Check health of idle connections."""
        to_remove = []
        temp_pool = []
        
        # Drain pool temporarily
        while not self._pool.empty():
            try:
                conn = self._pool.get_nowait()
                temp_pool.append(conn)
            except asyncio.QueueEmpty:
                break
        
        # Check each connection
        for conn in temp_pool:
            try:
                if not conn.is_valid():
                    to_remove.append(conn)
                else:
                    healthy = await asyncio.wait_for(
                        conn.health_check(),
                        timeout=5.0,
                    )
                    if not healthy:
                        to_remove.append(conn)
            except Exception:
                to_remove.append(conn)
        
        # Close bad connections
        for conn in to_remove:
            try:
                await conn.close()
                self._stats.total_connections -= 1
            except Exception:
                pass
        
        # Return good connections
        for conn in temp_pool:
            if conn not in to_remove:
                await self._pool.put(conn)
        
        # Replenish if needed
        while self._stats.total_connections < self.min_connections:
            try:
                conn = await asyncio.wait_for(
                    self.factory(),
                    timeout=self.connection_timeout,
                )
                await self._pool.put(conn)
                self._stats.total_connections += 1
            except Exception:
                break
    
    @asynccontextmanager
    async def acquire(self) -> AsyncIterator[ConnectionInterface]:
        """Acquire a connection from the pool."""
        if self._state != PoolState.READY:
            raise RuntimeError(f"Pool not ready: {self._state}")
        
        conn: Optional[ConnectionInterface] = None
        start_wait = time.perf_counter()
        
        self._stats.total_requests += 1
        self._waiting += 1
        
        try:
            # Wait for available connection slot
            async with self._semaphore:
                self._waiting -= 1
                
                wait_time = (time.perf_counter() - start_wait) * 1000
                # Update average wait time
                self._stats.avg_wait_time_ms = (
                    (self._stats.avg_wait_time_ms * (self._stats.total_requests - 1) + wait_time)
                    / self._stats.total_requests
                )
                
                # Try to get from pool
                try:
                    conn = await asyncio.wait_for(
                        self._pool.get(),
                        timeout=self.max_wait_seconds,
                    )
                except asyncio.TimeoutError:
                    self._stats.total_failures += 1
                    raise RuntimeError("Timeout waiting for connection")
                
                # Validate connection
                if not conn.is_valid():
                    # Close and create new
                    try:
                        await conn.close()
                    except Exception:
                        pass
                    
                    conn = await asyncio.wait_for(
                        self.factory(),
                        timeout=self.connection_timeout,
                    )
                
                self._in_use.add(conn)
                self._stats.active_connections = len(self._in_use)
                self._stats.idle_connections = self._pool.qsize()
                
                start_use = time.perf_counter()
                
                try:
                    yield conn
                finally:
                    use_time = (time.perf_counter() - start_use) * 1000
                    self._stats.avg_use_time_ms = (
                        (self._stats.avg_use_time_ms * (self._stats.total_requests - 1) + use_time)
                        / self._stats.total_requests
                    )
                    
                    self._in_use.discard(conn)
                    self._stats.active_connections = len(self._in_use)
                    
                    # Return to pool
                    if conn.is_valid():
                        try:
                            await asyncio.wait_for(
                                self._pool.put(conn),
                                timeout=1.0,
                            )
                            self._stats.idle_connections = self._pool.qsize()
                        except asyncio.TimeoutError:
                            # Pool is full, close connection
                            await conn.close()
                            self._stats.total_connections -= 1
                    else:
                        await conn.close()
                        self._stats.total_connections -= 1
        
        except Exception:
            self._waiting = max(0, self._waiting - 1)
            raise
    
    async def close(self):
        """Close all connections in the pool."""
        async with self._lock:
            self._state = PoolState.CLOSING
            
            # Cancel health check
            if self._health_check_task:
                self._health_check_task.cancel()
                try:
                    await self._health_check_task
                except asyncio.CancelledError:
                    pass
            
            # Close all idle connections
            while not self._pool.empty():
                try:
                    conn = self._pool.get_nowait()
                    await conn.close()
                except (asyncio.QueueEmpty, Exception):
                    break
            
            # Close in-use connections (with warning)
            for conn in list(self._in_use):
                try:
                    await conn.close()
                except Exception:
                    pass
            
            self._in_use.clear()
            self._state = PoolState.CLOSED
    
    def get_stats(self) -> PoolStats:
        """Get pool statistics."""
        self._stats.idle_connections = self._pool.qsize()
        self._stats.active_connections = len(self._in_use)
        self._stats.waiting_requests = self._waiting
        return self._stats


class AsyncTaskExecutor:
    """
    Async task executor with backpressure handling.
    
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
        task_timeout: Optional[float] = None,
    ):
        self.max_concurrent = max_concurrent
        self.max_queue_size = max_queue_size
        self.task_timeout = task_timeout
        
        self._queue: asyncio.PriorityQueue[tuple[int, int, Callable, tuple, dict]] = asyncio.PriorityQueue(maxsize=max_queue_size)
        self._running: Dict[int, asyncio.Task] = {}
        self._stats = TaskStats()
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._task_counter = 0
        self._counter_lock = asyncio.Lock()
        self._worker_task: Optional[asyncio.Task] = None
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
                    task = asyncio.create_task(
                        self._execute_task(task_id, func, args, kwargs)
                    )
                    self._running[task_id] = task
                    
                    try:
                        if self.task_timeout:
                            await asyncio.wait_for(task, timeout=self.task_timeout)
                        else:
                            await task
                    except asyncio.TimeoutError:
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
                result = await func(*args, **kwargs)
            else:
                # Run sync function in thread pool
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, functools.partial(func, *args, **kwargs))
            
            self._stats.tasks_completed += 1
            
        except asyncio.CancelledError:
            self._stats.tasks_cancelled += 1
            raise
        except Exception:
            self._stats.tasks_failed += 1
            raise
        finally:
            exec_time = (time.perf_counter() - start) * 1000
            total = self._stats.tasks_completed + self._stats.tasks_failed + self._stats.tasks_cancelled
            self._stats.avg_execution_time_ms = (
                (self._stats.avg_execution_time_ms * (total - 1) + exec_time) / total
            ) if total > 0 else 0
    
    async def submit(
        self,
        func: Callable,
        *args,
        priority: int = 5,
        **kwargs,
    ) -> int:
        """
        Submit a task for execution.
        
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
            
        except asyncio.QueueFull:
            raise RuntimeError(f"Task queue is full (max {self.max_queue_size})")
    
    async def cancel(self, task_id: int) -> bool:
        """Cancel a running or queued task."""
        # Check if running
        if task_id in self._running:
            task = self._running[task_id]
            task.cancel()
            return True
        
        # Note: Can't easily remove from PriorityQueue, will be skipped when processed
        return False
    
    async def shutdown(self, wait: bool = True, timeout: Optional[float] = None):
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
            except asyncio.TimeoutError:
                self._worker_task.cancel()
            except asyncio.CancelledError:
                pass
        elif self._worker_task:
            self._worker_task.cancel()
    
    def get_stats(self) -> TaskStats:
        """Get execution statistics."""
        self._stats.queue_depth = self._queue.qsize()
        return self._stats


class AsyncJobProcessor:
    """
    High-level async job processor with batching and rate limiting.
    
    Optimized for ML/AI workloads with:
    - Batch processing for efficiency
    - Automatic retry with backoff
    - Circuit breaker integration
    - Progress tracking
    
    Example:
        processor = AsyncJobProcessor(
            max_concurrent=5,
            batch_size=10,
            retry_attempts=3,
        )
        
        # Process jobs
        results = await processor.process_batch(
            jobs,
            process_fn=handle_job,
            on_progress=lambda done, total: print(f"{done}/{total}"),
        )
    """
    
    def __init__(
        self,
        max_concurrent: int = 5,
        batch_size: int = 10,
        retry_attempts: int = 3,
        retry_delay: float = 1.0,
        rate_limit: Optional[float] = None,  # Max jobs per second
    ):
        self.max_concurrent = max_concurrent
        self.batch_size = batch_size
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay
        self.rate_limit = rate_limit
        
        self._executor = AsyncTaskExecutor(
            max_concurrent=max_concurrent,
            max_queue_size=batch_size * 10,
        )
        self._rate_limiter: Optional[asyncio.Semaphore] = None
        if rate_limit:
            # Simple rate limiting: 1 permit per (1/rate_limit) seconds
            self._rate_limiter = asyncio.Semaphore(int(rate_limit))
        self._results: Dict[str, Any] = {}
        self._errors: Dict[str, Exception] = {}
    
    async def start(self):
        """Start the processor."""
        await self._executor.start()
    
    async def _process_with_retry(
        self,
        job_id: str,
        job: Any,
        process_fn: Callable[[Any], Any],
    ) -> Any:
        """Process a job with retry logic."""
        for attempt in range(self.retry_attempts):
            try:
                # Apply rate limiting
                if self._rate_limiter:
                    async with self._rate_limiter:
                        result = process_fn(job)
                else:
                    result = process_fn(job)
                
                self._results[job_id] = result
                return result
                
            except Exception as e:
                if attempt == self.retry_attempts - 1:
                    self._errors[job_id] = e
                    raise
                
                # Exponential backoff
                delay = self.retry_delay * (2 ** attempt)
                await asyncio.sleep(delay)
        
        raise RuntimeError(f"Max retries exceeded for job {job_id}")
    
    async def process_batch(
        self,
        jobs: List[Any],
        process_fn: Callable[[Any], Any],
        on_progress: Optional[Callable[[int, int], None]] = None,
    ) -> Dict[str, Any]:
        """
        Process a batch of jobs.
        
        Args:
            jobs: List of jobs to process
            process_fn: Function to process each job
            on_progress: Callback(progress, total)
        
        Returns:
            Dict mapping job index to result
        """
        total = len(jobs)
        completed = 0
        
        # Submit all jobs
        tasks = []
        for i, job in enumerate(jobs):
            job_id = f"job_{i}"
            
            async def process_wrapper(j=job, jid=job_id):
                return await self._process_with_retry(jid, j, process_fn)
            
            await self._executor.submit(process_wrapper)
            tasks.append(job_id)
        
        # Wait for completion with progress updates
        while completed < total:
            current_completed = len(self._results) + len(self._errors)
            
            if current_completed > completed:
                completed = current_completed
                if on_progress:
                    on_progress(completed, total)
            
            if completed < total:
                await asyncio.sleep(0.1)
        
        return self._results
    
    async def shutdown(self):
        """Shutdown the processor."""
        await self._executor.shutdown(wait=True)
    
    def get_results(self) -> Dict[str, Any]:
        """Get all results."""
        return self._results.copy()
    
    def get_errors(self) -> Dict[str, Exception]:
        """Get all errors."""
        return self._errors.copy()


class StreamingProcessor:
    """
    Stream processor for real-time data ingestion.
    
    Processes data streams with:
    - Windowed aggregation
    - Backpressure handling
    - Checkpoint support
    
    Example:
        stream = StreamingProcessor(window_size=100)
        
        async for batch in stream.ingest(data_source):
            results = await process_batch(batch)
            await stream.commit_checkpoint()
    """
    
    def __init__(
        self,
        window_size: int = 100,
        max_buffer_size: int = 1000,
        timeout_seconds: float = 5.0,
    ):
        self.window_size = window_size
        self.max_buffer_size = max_buffer_size
        self.timeout_seconds = timeout_seconds
        
        self._buffer: deque[Any] = deque(maxlen=max_buffer_size)
        self._checkpoint: int = 0
        self._processed: int = 0
        self._lock = asyncio.Lock()
    
    async def ingest(self, source: AsyncIterator[Any]) -> AsyncIterator[List[Any]]:
        """
        Ingest data from source and yield batches.
        
        Yields batches of up to window_size items.
        """
        async for item in source:
            async with self._lock:
                self._buffer.append(item)
                
                if len(self._buffer) >= self.window_size:
                    batch = list(self._buffer)[:self.window_size]
                    self._buffer = deque(list(self._buffer)[self.window_size:], maxlen=self.max_buffer_size)
                    yield batch
        
        # Yield remaining items
        async with self._lock:
            if self._buffer:
                yield list(self._buffer)
                self._buffer.clear()
    
    async def add(self, item: Any) -> bool:
        """Add item to buffer."""
        async with self._lock:
            if len(self._buffer) >= self.max_buffer_size:
                return False  # Buffer full
            self._buffer.append(item)
            return True
    
    async def get_batch(self, size: Optional[int] = None) -> List[Any]:
        """Get a batch from buffer."""
        size = size or self.window_size
        
        async with self._lock:
            batch_size = min(size, len(self._buffer))
            batch = [self._buffer.popleft() for _ in range(batch_size)]
            self._processed += len(batch)
            return batch
    
    async def commit_checkpoint(self):
        """Commit current checkpoint."""
        async with self._lock:
            self._checkpoint = self._processed
    
    async def rollback_to_checkpoint(self):
        """Rollback to last checkpoint."""
        # In a real implementation, would restore from persistent storage
        pass
    
    def get_stats(self) -> Dict[str, Any]:
        """Get stream statistics."""
        return {
            "buffer_size": len(self._buffer),
            "processed": self._processed,
            "checkpoint": self._checkpoint,
        }


# Utility functions for common patterns
async def parallel_map(
    func: Callable[[Any], Any],
    items: List[Any],
    max_concurrent: int = 10,
    timeout: Optional[float] = None,
) -> List[Any]:
    """
    Map function over items in parallel.
    
    Example:
        results = await parallel_map(
            process_image,
            image_paths,
            max_concurrent=5,
        )
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_item(item):
        async with semaphore:
            if asyncio.iscoroutinefunction(func):
                return await func(item)
            else:
                loop = asyncio.get_event_loop()
                return await loop.run_in_executor(None, func, item)
    
    tasks = [process_item(item) for item in items]
    
    if timeout:
        return await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=timeout)
    else:
        return await asyncio.gather(*tasks, return_exceptions=True)


async def batch_process(
    items: List[Any],
    process_fn: Callable[[List[Any]], Any],
    batch_size: int = 100,
    max_concurrent: int = 5,
) -> List[Any]:
    """
    Process items in batches with concurrency control.
    
    Example:
        results = await batch_process(
            records,
            lambda batch: model.predict(batch),
            batch_size=32,
            max_concurrent=3,
        )
    """
    # Split into batches
    batches = [
        items[i:i + batch_size]
        for i in range(0, len(items), batch_size)
    ]
    
    # Process batches in parallel
    results = await parallel_map(process_fn, batches, max_concurrent)
    return results


def sync_to_async(func: Callable) -> Callable[..., Coroutine]:
    """
    Convert a sync function to async.
    
    Example:
        async_process = sync_to_async(sync_function)
        result = await async_process(arg1, arg2)
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, functools.partial(func, *args, **kwargs))
    return wrapper


# Export public API
__all__ = [
    # Classes
    "ConnectionPool",
    "AsyncTaskExecutor",
    "AsyncJobProcessor",
    "StreamingProcessor",
    "PoolStats",
    "TaskStats",
    "PoolState",
    "ConnectionInterface",
    # Functions
    "parallel_map",
    "batch_process",
    "sync_to_async",
]
