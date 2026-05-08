"""Database layer exceptions."""

class DatabaseError(Exception):
    """Database operation error."""

    pass


class TenantContextError(Exception):
    """Tenant context not set for RLS."""

    pass
