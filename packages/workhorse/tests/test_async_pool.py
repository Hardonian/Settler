import pytest

from settler_workhorse.async_pool import batch_process


@pytest.mark.asyncio
async def test_batch_process_basic():
    """Test basic functionality of batch_process."""
    items = list(range(10))

    async def process_fn(batch):
        return [x * 2 for x in batch]

    results = await batch_process(items, process_fn, batch_size=3)

    # Check results (parallel_map returns results in order)
    assert results == [[0, 2, 4], [6, 8, 10], [12, 14, 16], [18]]


@pytest.mark.asyncio
async def test_batch_process_empty():
    """Test batch_process with empty items list."""
    items = []

    async def process_fn(batch):
        return [x * 2 for x in batch]

    results = await batch_process(items, process_fn, batch_size=3)

    assert results == []


@pytest.mark.asyncio
async def test_batch_process_exception():
    """Test batch_process when process_fn raises an exception."""
    items = list(range(5))

    async def process_fn(batch):
        if 3 in batch:
            raise ValueError("Test error")
        return [x * 2 for x in batch]

    results = await batch_process(items, process_fn, batch_size=2)

    # Since parallel_map uses return_exceptions=True by default in asyncio.gather
    assert isinstance(results[1], ValueError)
    assert results[1].args[0] == "Test error"

    # First batch was successful
    assert results[0] == [0, 2]
    # Third batch was successful
    assert results[2] == [8]
