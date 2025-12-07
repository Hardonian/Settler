# Error Handling Guide

**Best practices for handling errors in Settler.dev API**

---

## Overview

Settler.dev uses standard HTTP status codes and structured error responses. This guide explains how to handle errors effectively in your integration.

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context",
    "traceId": "unique-trace-id-for-support"
  }
}
```

---

## HTTP Status Codes

### 400 Bad Request

**Meaning:** Invalid request (missing required fields, invalid format, etc.)

**Example:**

```json
{
  "error": "BAD_REQUEST",
  "message": "Job ID is required",
  "details": {
    "field": "jobId",
    "traceId": "trace_123"
  }
}
```

**How to Handle:**

- Check request payload
- Verify all required fields are present
- Validate field formats
- Retry with corrected request

---

### 401 Unauthorized

**Meaning:** Missing or invalid API key

**Example:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid API key",
  "details": {
    "traceId": "trace_123"
  }
}
```

**How to Handle:**

- Verify API key is correct
- Check API key hasn't been revoked
- Regenerate API key if needed
- Ensure API key is included in Authorization header

---

### 403 Forbidden

**Meaning:** Valid API key but insufficient permissions

**Example:**

```json
{
  "error": "FORBIDDEN",
  "message": "Feature not available in your plan",
  "details": {
    "feature": "webhooks",
    "requiredPlan": "commercial",
    "currentPlan": "free",
    "traceId": "trace_123"
  }
}
```

**How to Handle:**

- Check plan limits
- Upgrade plan if needed
- Use alternative approach if available
- Contact support for plan questions

---

### 404 Not Found

**Meaning:** Resource doesn't exist or you don't have access

**Example:**

```json
{
  "error": "NOT_FOUND",
  "message": "Job not found",
  "details": {
    "resource": "job",
    "id": "job_123",
    "traceId": "trace_123"
  }
}
```

**How to Handle:**

- Verify resource ID is correct
- Check resource hasn't been deleted
- Verify you have access to resource
- Create resource if it doesn't exist

---

### 409 Conflict

**Meaning:** Resource conflict (e.g., job already running)

**Example:**

```json
{
  "error": "CONFLICT",
  "message": "Job is already running",
  "details": {
    "jobId": "job_123",
    "currentStatus": "running",
    "traceId": "trace_123"
  }
}
```

**How to Handle:**

- Wait for current operation to complete
- Check resource status before retry
- Use webhooks to be notified of completion
- Poll status endpoint if needed

---

### 429 Too Many Requests

**Meaning:** Rate limit exceeded

**Example:**

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded",
  "details": {
    "limit": 100,
    "remaining": 0,
    "resetAt": "2026-01-15T10:30:00Z",
    "traceId": "trace_123"
  }
}
```

**How to Handle:**

- Wait until `resetAt` time
- Implement exponential backoff
- Reduce request frequency
- Upgrade plan for higher limits
- Use webhooks instead of polling

---

### 500 Internal Server Error

**Meaning:** Server error (our fault)

**Example:**

```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "details": {
    "traceId": "trace_123"
  }
}
```

**How to Handle:**

- Retry with exponential backoff
- Log traceId for support
- Check status page for outages
- Contact support if persistent

---

### 503 Service Unavailable

**Meaning:** Service temporarily unavailable (maintenance, overload)

**Example:**

```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Service temporarily unavailable",
  "details": {
    "retryAfter": 60,
    "traceId": "trace_123"
  }
}
```

**How to Handle:**

- Wait `retryAfter` seconds
- Retry with exponential backoff
- Check status page
- Use webhooks to avoid polling

---

## Error Codes Reference

### Authentication & Authorization

- `UNAUTHORIZED` - Invalid or missing API key
- `FORBIDDEN` - Insufficient permissions
- `TOKEN_EXPIRED` - API key expired

### Validation Errors

- `BAD_REQUEST` - Invalid request format
- `VALIDATION_ERROR` - Field validation failed
- `MISSING_REQUIRED_FIELD` - Required field missing

### Resource Errors

- `NOT_FOUND` - Resource doesn't exist
- `CONFLICT` - Resource conflict
- `ALREADY_EXISTS` - Resource already exists

### Quota & Limits

- `QUOTA_EXCEEDED` - Plan limit reached
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `FEATURE_LIMIT_REACHED` - Feature limit reached

### Adapter Errors

- `ADAPTER_ERROR` - Adapter connection failed
- `ADAPTER_TIMEOUT` - Adapter request timeout
- `ADAPTER_AUTH_FAILED` - Adapter authentication failed

### Job Errors

- `JOB_NOT_FOUND` - Job doesn't exist
- `JOB_ALREADY_RUNNING` - Job is already running
- `JOB_EXECUTION_FAILED` - Job execution failed

### System Errors

- `INTERNAL_ERROR` - Unexpected server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `DATABASE_ERROR` - Database operation failed

---

## Error Handling Best Practices

### 1. Always Check Status Codes

```typescript
try {
  const response = await fetch("/api/v1/jobs", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const error = await response.json();
    handleError(error, response.status);
  }

  const data = await response.json();
  return data;
} catch (error) {
  handleNetworkError(error);
}
```

### 2. Implement Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Don't retry client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### 3. Handle Rate Limits

```typescript
async function handleRateLimit(error: any) {
  if (error.error === "RATE_LIMIT_EXCEEDED") {
    const resetAt = new Date(error.details.resetAt);
    const waitTime = resetAt.getTime() - Date.now();

    if (waitTime > 0) {
      console.log(`Rate limit exceeded. Waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return true; // Retry
    }
  }
  return false;
}
```

### 4. Log Errors with Context

```typescript
function logError(error: any, context: Record<string, any>) {
  console.error("Settler API Error:", {
    error: error.error,
    message: error.message,
    traceId: error.details?.traceId,
    context,
    timestamp: new Date().toISOString(),
  });

  // Send to error tracking service (Sentry, etc.)
  if (typeof window !== "undefined" && window.Sentry) {
    window.Sentry.captureException(error, { extra: context });
  }
}
```

### 5. Provide User-Friendly Messages

```typescript
function getUserFriendlyMessage(error: any): string {
  const messages: Record<string, string> = {
    UNAUTHORIZED: "Your API key is invalid. Please check your settings.",
    QUOTA_EXCEEDED:
      "You've reached your plan limit. Please upgrade or wait for next billing cycle.",
    RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment and try again.",
    JOB_NOT_FOUND: "The reconciliation job was not found. It may have been deleted.",
    ADAPTER_ERROR: "Failed to connect to the platform. Please check your API keys.",
  };

  return messages[error.error] || error.message || "An unexpected error occurred";
}
```

---

## Common Error Scenarios

### Scenario 1: Invalid API Key

**Error:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid API key"
}
```

**Solution:**

1. Verify API key in dashboard
2. Check API key hasn't been revoked
3. Regenerate API key if needed
4. Ensure correct Authorization header format: `Bearer sk_...`

---

### Scenario 2: Job Already Running

**Error:**

```json
{
  "error": "CONFLICT",
  "message": "Job is already running"
}
```

**Solution:**

1. Check job status: `GET /api/v1/jobs/:id`
2. Wait for completion or cancel current run
3. Use webhooks to be notified of completion
4. Don't retry immediately

---

### Scenario 3: Rate Limit Exceeded

**Error:**

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "details": {
    "resetAt": "2026-01-15T10:30:00Z"
  }
}
```

**Solution:**

1. Wait until `resetAt` time
2. Implement exponential backoff
3. Reduce request frequency
4. Use webhooks instead of polling
5. Consider upgrading plan

---

### Scenario 4: Adapter Connection Failed

**Error:**

```json
{
  "error": "ADAPTER_ERROR",
  "message": "Failed to connect to Shopify API"
}
```

**Solution:**

1. Verify adapter API keys are correct
2. Check adapter API status
3. Verify network connectivity
4. Check adapter rate limits
5. Retry with exponential backoff

---

### Scenario 5: Quota Exceeded

**Error:**

```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "Reconciliation limit reached",
  "details": {
    "currentUsage": 100000,
    "limit": 100000
  }
}
```

**Solution:**

1. Wait for next billing cycle
2. Upgrade plan for higher limits
3. Reduce reconciliation frequency
4. Contact support for temporary increase

---

## Error Recovery Strategies

### Transient Errors (Retry)

- 500 Internal Server Error
- 503 Service Unavailable
- Network timeouts
- Rate limit exceeded (after waiting)

### Permanent Errors (Don't Retry)

- 400 Bad Request (fix request first)
- 401 Unauthorized (fix API key)
- 403 Forbidden (upgrade plan)
- 404 Not Found (resource doesn't exist)

### Conditional Retries

- 409 Conflict (check status, then retry)
- 429 Rate Limit (wait, then retry)

---

## Getting Help

If you encounter errors not covered here:

1. **Check Documentation:** [docs.settler.io](https://docs.settler.io)
2. **Search Discord:** [discord.gg/settler](https://discord.gg/settler)
3. **GitHub Issues:** [github.com/settler/settler/issues](https://github.com/settler/settler/issues)
4. **Email Support:** [support@settler.io](mailto:support@settler.io)

**Include in Support Requests:**

- Error code and message
- Trace ID (from error details)
- Request details (endpoint, payload)
- Steps to reproduce
- Expected vs actual behavior

---

## SDK Error Handling

If using the TypeScript SDK:

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({ apiKey: process.env.SETTLER_API_KEY });

try {
  const job = await settler.jobs.create({
    /* ... */
  });
} catch (error) {
  if (error instanceof Settler.APIError) {
    console.error("API Error:", error.code, error.message);
    console.error("Trace ID:", error.traceId);

    // Handle specific error codes
    switch (error.code) {
      case "UNAUTHORIZED":
        // Fix API key
        break;
      case "QUOTA_EXCEEDED":
        // Upgrade plan or wait
        break;
      case "RATE_LIMIT_EXCEEDED":
        // Wait and retry
        break;
    }
  } else {
    // Network or other error
    console.error("Unexpected error:", error);
  }
}
```

---

## Complete Error Handling Example

Here's a complete example showing error handling in a production application:

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({ apiKey: process.env.SETTLER_API_KEY });

async function createJobWithErrorHandling(jobConfig: any) {
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const job = await settler.jobs.create(jobConfig);
      return { success: true, job };
    } catch (error: any) {
      lastError = error;

      // Don't retry client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        return handleClientError(error);
      }

      // Retry server errors (5xx) with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  return { success: false, error: lastError };
}

function handleClientError(error: any) {
  switch (error.error) {
    case "UNAUTHORIZED":
      console.error("Invalid API key. Please check your SETTLER_API_KEY.");
      // Alert user to fix API key
      return { success: false, error, action: "fix_api_key" };

    case "QUOTA_EXCEEDED":
      console.error("Plan limit reached:", error.details);
      // Show upgrade prompt
      return { success: false, error, action: "upgrade_plan" };

    case "RATE_LIMIT_EXCEEDED":
      const resetAt = new Date(error.details.resetAt);
      const waitTime = resetAt.getTime() - Date.now();
      console.log(`Rate limit exceeded. Wait ${waitTime}ms`);
      // Queue request for later
      return { success: false, error, action: "retry_later", waitTime };

    case "BAD_REQUEST":
      console.error("Invalid request:", error.message);
      // Show validation errors to user
      return { success: false, error, action: "fix_request" };

    default:
      console.error("Client error:", error);
      return { success: false, error, action: "contact_support" };
  }
}
```

---

## Error Monitoring & Alerting

### Recommended Setup

1. **Error Tracking Service** (Sentry, Rollbar, etc.)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Capture errors
try {
  await settler.jobs.create(config);
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: "reconciliation" },
    extra: { jobConfig: config },
  });
  throw error;
}
```

2. **Logging**

```typescript
import { logError } from "./logger";

try {
  await settler.jobs.create(config);
} catch (error) {
  logError("Job creation failed", error, {
    userId: req.userId,
    jobConfig: config,
    traceId: error.details?.traceId,
  });
}
```

3. **Alerting**

```typescript
// Alert on critical errors
if (error.error === "INTERNAL_ERROR" || error.status >= 500) {
  await sendAlert({
    severity: "critical",
    message: `Settler API error: ${error.message}`,
    traceId: error.details?.traceId,
  });
}
```

---

**Last Updated:** January 2026
