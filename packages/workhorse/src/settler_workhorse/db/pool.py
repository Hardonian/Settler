"""Database connection pool initialization."""

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from settler_workhorse.config import Settings, get_settings

def create_connection_pool(settings: Settings | None = None) -> ConnectionPool:
    """Create a database connection pool.

    Args:
        settings: Application settings

    Returns:
        Configured connection pool
    """
    settings = settings or get_settings()

    pool = ConnectionPool(
        str(settings.database_url),
        min_size=5,
        max_size=settings.database_pool_size,
        kwargs={"row_factory": dict_row},
    )

    return pool
