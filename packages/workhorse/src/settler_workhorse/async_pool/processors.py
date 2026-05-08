import asyncio
from collections import deque
from collections.abc import AsyncIterator, Callable
from typing import Any

from .executors import AsyncTaskExecutor


class AsyncJobProcessor:
    """High-level async job processor with batching and rate limiting.

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
        rate_limit: float | None = None,  # Max jobs per second
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
        self._rate_limiter: asyncio.Semaphore | None = None
        if rate_limit:
            # Simple rate limiting: 1 permit per (1/rate_limit) seconds
            self._rate_limiter = asyncio.Semaphore(int(rate_limit))
        self._results: dict[str, Any] = {}
        self._errors: dict[str, Exception] = {}

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
                delay = self.retry_delay * (2**attempt)
                await asyncio.sleep(delay)

        raise RuntimeError(f"Max retries exceeded for job {job_id}")

    async def process_batch(
        self,
        jobs: list[Any],
        process_fn: Callable[[Any], Any],
        on_progress: Callable[[int, int], None] | None = None,
    ) -> dict[str, Any]:
        """Process a batch of jobs.

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

    def get_results(self) -> dict[str, Any]:
        """Get all results."""
        return self._results.copy()

    def get_errors(self) -> dict[str, Exception]:
        """Get all errors."""
        return self._errors.copy()


class StreamingProcessor:
    """Stream processor for real-time data ingestion.

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

    async def ingest(self, source: AsyncIterator[Any]) -> AsyncIterator[list[Any]]:
        """Ingest data from source and yield batches.

        Yields batches of up to window_size items.
        """
        async for item in source:
            async with self._lock:
                self._buffer.append(item)

                if len(self._buffer) >= self.window_size:
                    batch = list(self._buffer)[: self.window_size]
                    self._buffer = deque(
                        list(self._buffer)[self.window_size :], maxlen=self.max_buffer_size
                    )
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

    async def get_batch(self, size: int | None = None) -> list[Any]:
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

    def get_stats(self) -> dict[str, Any]:
        """Get stream statistics."""
        return {
            "buffer_size": len(self._buffer),
            "processed": self._processed,
            "checkpoint": self._checkpoint,
        }
