"""Tests for the async_pool module."""

import asyncio
import pytest
from settler_workhorse.async_pool import sync_to_async


def sample_sync_function(a: int, b: int) -> int:
    """A sample sync function for testing."""
    return a + b


def sample_sync_function_with_kwargs(a: int, b: int = 0, *, c: int = 0) -> int:
    return a + b + c


def sample_sync_function_raises():
    raise ValueError("Test error")


@pytest.mark.asyncio
async def test_sync_to_async_basic():
    """Test basic execution of sync_to_async."""
    async_func = sync_to_async(sample_sync_function)
    result = await async_func(2, 3)
    assert result == 5


@pytest.mark.asyncio
async def test_sync_to_async_kwargs():
    """Test argument passing with kwargs."""
    async_func = sync_to_async(sample_sync_function_with_kwargs)
    result = await async_func(2, b=3, c=4)
    assert result == 9


@pytest.mark.asyncio
async def test_sync_to_async_exception():
    """Test that exceptions raised in the sync function bubble up."""
    async_func = sync_to_async(sample_sync_function_raises)
    with pytest.raises(ValueError, match="Test error"):
        await async_func()


def test_sync_to_async_wraps():
    """Test that wrapper preserves func name and docstring."""
    async_func = sync_to_async(sample_sync_function)
    assert async_func.__name__ == "sample_sync_function"
    assert async_func.__doc__ == "A sample sync function for testing."
