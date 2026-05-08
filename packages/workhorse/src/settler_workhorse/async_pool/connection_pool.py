import asyncio
import time
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator, Callable, Coroutine
from contextlib import asynccontextmanager, suppress
from typing import Any

from .models import PoolState, PoolStats


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
    """Async connection pool with health checks and lifecycle management.

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
        self._in_use: set[ConnectionInterface] = set()
        self._waiting: int = 0
        self._stats = PoolStats()
        self._state = PoolState.INITIALIZING
        self._lock = asyncio.Lock()
        self._health_check_task: asyncio.Task | None = None
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
                raise RuntimeError(f"Failed to initialize pool: {e}") from e

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

        conn: ConnectionInterface | None = None
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
                    self._stats.avg_wait_time_ms * (self._stats.total_requests - 1) + wait_time
                ) / self._stats.total_requests

                # Try to get from pool
                try:
                    conn = await asyncio.wait_for(
                        self._pool.get(),
                        timeout=self.max_wait_seconds,
                    )
                except TimeoutError as err:
                    self._stats.total_failures += 1
                    raise RuntimeError("Timeout waiting for connection") from err

                # Validate connection
                if not conn.is_valid():
                    # Close and create new
                    with suppress(Exception):
                        await conn.close()

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
                        self._stats.avg_use_time_ms * (self._stats.total_requests - 1) + use_time
                    ) / self._stats.total_requests

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
                        except TimeoutError:
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
                with suppress(asyncio.CancelledError):
                    await self._health_check_task

            # Close all idle connections
            while not self._pool.empty():
                try:
                    conn = self._pool.get_nowait()
                    await conn.close()
                except (asyncio.QueueEmpty, Exception):
                    break

            # Close in-use connections (with warning)
            for conn in list(self._in_use):
                with suppress(Exception):
                    await conn.close()

            self._in_use.clear()
            self._state = PoolState.CLOSED

    def get_stats(self) -> PoolStats:
        """Get pool statistics."""
        self._stats.idle_connections = self._pool.qsize()
        self._stats.active_connections = len(self._in_use)
        self._stats.waiting_requests = self._waiting
        return self._stats
