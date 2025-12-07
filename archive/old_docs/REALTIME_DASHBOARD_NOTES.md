# Real-time Dashboard Implementation Notes

This document describes the real-time dashboard implementation for reconciliation status updates.

## Architecture

### Server-Sent Events (SSE)

We chose SSE over WebSockets because:

- **Simpler**: HTTP-based, no protocol upgrade needed
- **Automatic reconnection**: Browsers handle reconnection automatically
- **Unidirectional**: Perfect for server-to-client updates
- **Less overhead**: No need for ping/pong frames

### Implementation

**Backend**: `/api/v1/realtime/reconciliations/:jobId`

- SSE endpoint that streams execution updates
- Polls database every 2 seconds for updates
- Sends heartbeat every 30 seconds
- Handles client disconnects gracefully

**Frontend**: React component (`RealtimeDashboard`)

- Uses native `EventSource` API
- Automatically reconnects on errors
- Displays live updates with status, summary, logs, errors

## Authentication

### Current Implementation

SSE endpoints use the same authentication middleware as REST endpoints:

- Bearer token in `Authorization` header
- Tenant isolation enforced
- Job ownership verified

### Considerations

**SSE Limitations**:

- Cannot send custom headers in browser `EventSource` API
- Workaround: Use query parameter for auth token (less secure)
- Better: Use cookies with SameSite=Strict

**Recommended Approach**:

```typescript
// Use cookies for SSE authentication
res.cookie("auth_token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
});
```

## Backpressure

### Current Implementation

- **Polling interval**: 2 seconds
- **Heartbeat**: 30 seconds
- **Connection limit**: None (should be added)

### Recommended Improvements

1. **Connection Limits**

   ```typescript
   const MAX_CONNECTIONS_PER_TENANT = 10;
   const MAX_CONNECTIONS_PER_JOB = 5;
   ```

2. **Rate Limiting**

   ```typescript
   // Limit updates per connection
   const MAX_UPDATES_PER_SECOND = 1;
   ```

3. **Backpressure Handling**
   ```typescript
   // Check if client can receive data
   if (res.writable && !res.destroyed) {
     res.write(data);
   } else {
     // Client disconnected or buffer full
     sseConnections.delete(connectionId);
   }
   ```

## Reconnect Behavior

### Automatic Reconnection

Browsers automatically reconnect SSE connections:

- On network errors
- On server errors
- After timeout

### Custom Reconnection Logic

```typescript
eventSource.onerror = (error) => {
  console.error("SSE error:", error);
  eventSource.close();

  // Exponential backoff
  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
  setTimeout(() => {
    retryCount++;
    // Reconnect
    eventSource = new EventSource(url);
  }, delay);
};
```

## Scaling Considerations

### Current Limitations

- **In-memory connections**: Connections stored in memory (single server)
- **No horizontal scaling**: Won't work with multiple servers
- **No message queue**: Direct database polling

### Recommended Improvements

1. **Redis Pub/Sub**

   ```typescript
   // Publish updates to Redis
   redis.publish(`job:${jobId}:updates`, JSON.stringify(update));

   // Subscribe in SSE handler
   redis.subscribe(`job:${jobId}:updates`, (message) => {
     res.write(`data: ${message}\n\n`);
   });
   ```

2. **WebSocket Alternative**

   ```typescript
   // Use Socket.IO or ws library
   // Better for bidirectional communication
   // Better scaling with Redis adapter
   ```

3. **Message Queue**
   ```typescript
   // Use BullMQ or similar
   // Better for reliable delivery
   // Better for horizontal scaling
   ```

## Security Considerations

### Current Implementation

- ✅ Authentication required
- ✅ Tenant isolation
- ✅ Job ownership verified
- ⚠️ No rate limiting
- ⚠️ No connection limits

### Recommended Improvements

1. **Rate Limiting**

   ```typescript
   // Limit connections per IP
   const rateLimiter = rateLimit({
     windowMs: 60000,
     max: 10, // 10 connections per minute per IP
   });
   ```

2. **Connection Limits**

   ```typescript
   // Limit connections per tenant
   const tenantConnections = new Map<string, number>();
   if (tenantConnections.get(tenantId) >= MAX_CONNECTIONS) {
     return res.status(429).json({ error: "Too many connections" });
   }
   ```

3. **Input Validation**
   ```typescript
   // Validate jobId format
   if (!isValidUUID(jobId)) {
     return res.status(400).json({ error: "Invalid job ID" });
   }
   ```

## Performance Optimization

### Current Implementation

- **Polling interval**: 2 seconds (may be too frequent)
- **Database queries**: One query per connection per poll
- **No caching**: Every poll hits database

### Recommended Improvements

1. **Adaptive Polling**

   ```typescript
   // Poll more frequently when job is running
   const pollInterval = execution.status === "running" ? 1000 : 5000;
   ```

2. **Caching**

   ```typescript
   // Cache execution status
   const cached = await cache.get(`execution:${jobId}`);
   if (cached && Date.now() - cached.timestamp < 2000) {
     return cached.data;
   }
   ```

3. **Event-Driven Updates**
   ```typescript
   // Instead of polling, listen to events
   eventBus.subscribe("execution.updated", (event) => {
     broadcastJobUpdate(event.jobId, event.tenantId, event.data);
   });
   ```

## Monitoring

### Metrics to Track

1. **Connection Count**

   ```promql
   sse_connections_active
   ```

2. **Update Rate**

   ```promql
   rate(sse_updates_sent_total[5m])
   ```

3. **Reconnection Rate**

   ```promql
   rate(sse_reconnections_total[5m])
   ```

4. **Error Rate**
   ```promql
   rate(sse_errors_total[5m])
   ```

## Example Usage

### Frontend

```typescript
import RealtimeDashboard from './realtime-dashboard';

function App() {
  return (
    <RealtimeDashboard
      jobId="job-123"
      apiKey="your-api-key"
    />
  );
}
```

### Backend (Broadcast Update)

```typescript
import { broadcastJobUpdate } from "./routes/realtime";

// After execution update
broadcastJobUpdate(jobId, tenantId, {
  type: "execution_update",
  executionId: execution.id,
  status: execution.status,
  summary: execution.summary,
});
```

## Future Enhancements

1. **WebSocket Support**: For bidirectional communication
2. **GraphQL Subscriptions**: Alternative to SSE
3. **Serverless SSE**: Using AWS API Gateway or similar
4. **Multi-job Dashboard**: Watch multiple jobs simultaneously
5. **Historical Replay**: Replay past execution updates
6. **Filtering**: Filter updates by status, type, etc.

## Troubleshooting

### Connection Not Establishing

1. Check authentication token
2. Check CORS settings
3. Check network connectivity
4. Check server logs for errors

### Updates Not Receiving

1. Check database polling is working
2. Check job ownership verification
3. Check connection is still active
4. Check server logs for errors

### High CPU Usage

1. Reduce polling frequency
2. Implement connection limits
3. Use event-driven updates instead of polling
4. Add caching layer
