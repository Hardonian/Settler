# Security Best Practices

React.Settler is built with enterprise-grade security in mind. This document outlines security best practices for using the library.

## Input Validation

Always validate user input before passing it to React.Settler components:

```tsx
import { useValidation, sanitizeString } from "@settler/react-settler";

function MyComponent() {
  const { validateTransaction } = useValidation();

  const handleSubmit = (data: unknown) => {
    // Sanitize input
    const sanitized = sanitizeString(String(data));

    // Validate transaction
    const result = validateTransaction(data as ReconciliationTransaction);
    if (!result.valid) {
      // Handle validation errors
      return;
    }

    // Use validated data
  };
}
```

## XSS Protection

React.Settler automatically sanitizes string inputs to prevent XSS attacks:

- Transaction IDs
- Provider names
- Reference IDs
- Exception descriptions

All string values are sanitized using `sanitizeString()` before rendering.

## Content Security Policy

Configure CSP headers in your application:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.settler.dev;
```

## Audit Logging

Enable audit logging for compliance:

```tsx
import { setAuditLogHandler } from "@settler/react-settler";

setAuditLogHandler((entry) => {
  // Send to your audit log service
  sendToAuditLog(entry);
});
```

## PII Masking

Enable PII masking in telemetry:

```tsx
import { setTelemetryConfig } from "@settler/react-settler";

setTelemetryConfig({
  scrubPII: true,
  trackUsers: false,
});
```

## Error Handling

Use ErrorBoundary to catch and handle errors securely:

```tsx
import { ErrorBoundary } from "@settler/react-settler";

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log error securely (don't expose sensitive data)
    logError(error, { componentStack: errorInfo.componentStack });
  }}
>
  <YourComponent />
</ErrorBoundary>;
```

## Security Context

Provide security context for access control:

```tsx
import { ReconciliationDashboard } from "@settler/react-settler";

<ReconciliationDashboard
  config={{
    securityContext: {
      userId: "user-123",
      permissions: ["read:transactions", "write:exceptions"],
      roles: ["operator"],
    },
  }}
>
  {/* Components */}
</ReconciliationDashboard>;
```

## Rate Limiting

Implement rate limiting in your backend:

```tsx
// Backend example
app.use(
  "/api/reconciliation",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
```

## Secure Data Transmission

- Always use HTTPS in production
- Use secure WebSocket connections (WSS) for real-time updates
- Validate SSL certificates

## Dependency Security

Regularly update dependencies:

```bash
npm audit
npm audit fix
```

## Reporting Security Issues

If you discover a security vulnerability, please email security@settler.dev instead of opening a public issue.
