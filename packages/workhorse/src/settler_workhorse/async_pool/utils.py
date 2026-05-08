import asyncio
import functools
from collections.abc import Callable, Coroutine
from typing import Any


async def parallel_map(
    func: Callable[[Any], Any],
    items: list[Any],
    max_concurrent: int = 10,
    timeout: float | None = None,
) -> list[Any]:
    """Map function over items in parallel.

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
        return await asyncio.wait_for(
            asyncio.gather(*tasks, return_exceptions=True), timeout=timeout
        )
    else:
        return await asyncio.gather(*tasks, return_exceptions=True)


async def batch_process(
    items: list[Any],
    process_fn: Callable[[list[Any]], Any],
    batch_size: int = 100,
    max_concurrent: int = 5,
) -> list[Any]:
    """Process items in batches with concurrency control.

    Example:
        results = await batch_process(
            records,
            lambda batch: model.predict(batch),
            batch_size=32,
            max_concurrent=3,
        )
    """
    # Split into batches
    batches = [items[i : i + batch_size] for i in range(0, len(items), batch_size)]

    # Process batches in parallel
    results = await parallel_map(process_fn, batches, max_concurrent)
    return results


def sync_to_async(func: Callable) -> Callable[..., Coroutine]:
    """Convert a sync function to async.

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
