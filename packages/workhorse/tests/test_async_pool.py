import asyncio

import pytest

from settler_workhorse.async_pool import batch_process


@pytest.mark.asyncio
async def test_batch_process_basic():
    """Test batch processing happy path."""
    items = [1, 2, 3, 4, 5]

    async def process_fn(batch):
        await asyncio.sleep(0.01)
        return [i * 2 for i in batch]

    result = await batch_process(items, process_fn, batch_size=2, max_concurrent=2)

    # We should get a list of results (list of lists) which we can flatten or check
    assert len(result) == 3
    assert result == [[2, 4], [6, 8], [10]]


@pytest.mark.asyncio
async def test_batch_process_empty():
    """Test batch processing with empty list."""
    items = []

    async def process_fn(batch):
        return batch

    result = await batch_process(items, process_fn, batch_size=2, max_concurrent=2)
    assert result == []


@pytest.mark.asyncio
async def test_batch_process_exception():
    """Test batch processing when an exception occurs."""
    items = [1, 2, 3]

    async def process_fn(batch):
        if 2 in batch:
            raise ValueError("Test error")
        return [i * 2 for i in batch]

    # With return_exceptions=True (which is the default in parallel_map),
    # an exception in the process_fn should be returned as the result for that batch
    result = await batch_process(items, process_fn, batch_size=2, max_concurrent=2)
    assert len(result) == 2
    assert isinstance(result[0], ValueError)
    assert str(result[0]) == "Test error"
    assert result[1] == [6]
