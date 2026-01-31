namespace Settler.Sdk.Exceptions;

/// <summary>Base exception for all Settler SDK errors.</summary>
public class SettlerException : Exception
{
    public int StatusCode { get; }

    public SettlerException(string message, int statusCode = 0) : base(message)
    {
        StatusCode = statusCode;
    }

    public SettlerException(string message, Exception innerException) : base(message, innerException) { }
}

/// <summary>Network-related errors (timeout, connection, etc.).</summary>
public class NetworkException : SettlerException
{
    public NetworkException(string message, Exception? innerException = null)
        : base(message, innerException ?? new Exception(message)) { }
}

/// <summary>Authentication errors (401/403).</summary>
public class AuthenticationException : SettlerException
{
    public AuthenticationException(string message) : base(message, 401) { }
}

/// <summary>Validation errors (400).</summary>
public class ValidationException : SettlerException
{
    public ValidationException(string message) : base(message, 400) { }
}

/// <summary>Resource not found (404).</summary>
public class NotFoundException : SettlerException
{
    public NotFoundException(string message) : base(message, 404) { }
}

/// <summary>Rate limit exceeded (429).</summary>
public class RateLimitException : SettlerException
{
    public RateLimitException(string message) : base(message, 429) { }
}

/// <summary>Server errors (5xx).</summary>
public class ServerException : SettlerException
{
    public ServerException(string message, int statusCode = 500) : base(message, statusCode) { }
}
