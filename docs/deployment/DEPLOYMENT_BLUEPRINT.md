# Deployment Blueprint

## Recommended Infrastructure

### Frontend

**Platform:** Vercel

- **Benefits:** Automatic deployments, CDN, edge functions
- **Configuration:** Next.js app with API routes
- **Domain:** app.settler.io

### Backend

**Platform:** Supabase + Vercel Edge Functions

- **Database:** Supabase PostgreSQL
- **Edge Functions:** Vercel Edge Functions for job orchestration
- **Storage:** Supabase Storage (or S3/GCS)

### Queue System

**Options:**

1. **Supabase KV** (Recommended for start)
2. **Durable Queues** (Vercel)
3. **Redis** (For scale)

### Multi-Region Strategy

**Phase 1:** Single region (US)
**Phase 2:** Multi-region (US + EU)
**Phase 3:** Global distribution

### CDN Caching

- **Static Assets:** Vercel CDN
- **API Responses:** Cache headers + CDN
- **Database Queries:** Redis cache layer

## Deployment Steps

### 1. Environment Setup

```bash
# Set environment variables
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=sk_...
JWT_SECRET=...
```

### 2. Database Migration

```bash
# Run migrations
npm run db:migrate:prod

# Generate Prisma client
npm run prisma:generate
```

### 3. Deploy Frontend

```bash
# Deploy to Vercel
vercel deploy --prod
```

### 4. Deploy Backend

```bash
# Deploy API to Vercel
vercel deploy --prod
```

### 5. Configure Edge Functions

```bash
# Deploy edge functions
vercel deploy --prod
```

## Operational Hardening

### Dead-Letter Queues

```typescript
// Example dead-letter queue implementation
const deadLetterQueue = new Queue("dead-letters", {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});
```

### Retry & Backoff Rules

- **Exponential Backoff:** 1s, 2s, 4s, 8s, 16s
- **Max Attempts:** 5
- **Jitter:** Random 0-1s added to prevent thundering herd

### Health Checks

```typescript
// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: await checkDatabase(),
    redis: await checkRedis(),
  });
});
```

### Rate Limiters

- **Token Bucket:** Per tenant, per endpoint
- **Distributed:** Redis-based for multi-instance
- **Tier-Based:** Different limits per tier

### Job Isolation

- **Process Isolation:** Each job in separate process
- **Resource Limits:** CPU, memory limits per job
- **Timeout:** Max execution time per job

### Consistent Error Objects

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  traceId: string;
  timestamp: string;
  code?: string;
}
```

## Security Expansion

### Per-Tenant Isolation

- **RLS Policies:** Database-level isolation
- **Application Filtering:** Tenant ID in all queries
- **Encrypted Configs:** Tenant configurations encrypted

### Global Input Validation

```typescript
// Zod schemas for all inputs
const createJobSchema = z.object({
  name: z.string().min(1).max(255),
  sourceAdapter: z.string(),
  targetAdapter: z.string(),
});
```

### Structured Logging

```typescript
// Structured logging for all API calls
logger.info("API request", {
  method: req.method,
  path: req.path,
  tenantId: req.tenantId,
  userId: req.userId,
  traceId: req.traceId,
});
```

### Secret Rotation

- **API Keys:** Rotate every 90 days
- **JWT Secrets:** Rotate every 30 days
- **Database Credentials:** Rotate every 60 days

### Secure Webhook Handling

- **HMAC Signing:** All webhooks signed
- **Timestamp Validation:** Prevent replay attacks
- **Retry Logic:** Exponential backoff
- **Dead-Letter Queue:** Failed webhooks

---

**Next:** [Pricing Intelligence](./PRICING_INTELLIGENCE.md)
