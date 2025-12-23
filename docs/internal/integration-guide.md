# Integration Guide - Complete Workflow Implementation

**Status:** ✅ All implementations complete, integration guide provided  
**Date:** 2025-01-27

---

## Quick Start Integration

### 1. Install Dependencies

```bash
cd packages/api
npm install node-cron @types/node-cron
```

---

### 2. Initialize Scheduler Service

**Option A: Standalone Process**

Add to `packages/api/package.json`:
```json
{
  "scripts": {
    "scheduler": "tsx src/index-scheduler.ts",
    "scheduler:prod": "node dist/index-scheduler.js"
  }
}
```

Run scheduler:
```bash
npm run scheduler
```

**Option B: Integrated into Main App**

In `packages/api/src/index.ts`:
```typescript
import { getJobSchedulerService } from './infrastructure/jobs/scheduler-service';
import { prisma } from './db/prisma';

// After app initialization
const scheduler = getJobSchedulerService(prisma);
await scheduler.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await scheduler.stop();
  await prisma.$disconnect();
});
```

---

### 3. Integrate Failure Notifications

In `packages/api/src/infrastructure/jobs/scheduler-service.ts`, add to `executeJob()` error handler:

```typescript
import { notifyJobFailure } from '../../services/notifications/job-failure';

// In catch block:
await notifyJobFailure(prisma, {
  jobId: job.id,
  resultId: result.id,
  errorMessage: errorMessage,
  errorStack: errorStack,
  tenantId: job.tenantId,
  userId: 'system',
});
```

---

### 4. Integrate Progress Tracking

In `packages/api/src/services/recon-core.ts` (or job execution service), add progress updates:

```typescript
// During job execution:
await prisma.reconResult.update({
  where: { id: resultId },
  data: {
    metadata: {
      ...existingMetadata,
      progress: {
        stage: 'fetching_source',
        percentage: 25,
        message: 'Fetching transactions from source adapter...',
      },
    },
  },
});
```

---

### 5. Integrate Retry Logic

In adapter connection service:

```typescript
import { executeWithRetry } from '../services/adapters/retry';

const connection = await executeWithRetry(
  () => adapter.connect(config),
  { maxRetries: 3 }
);
```

---

## Testing

### Unit Tests

Create test files:
- `packages/api/src/__tests__/infrastructure/jobs/scheduler-service.test.ts`
- `packages/api/src/__tests__/services/notifications/job-failure.test.ts`
- `packages/api/src/__tests__/services/receipt-matching.test.ts`
- `packages/api/src/__tests__/services/rule-optimizer.test.ts`
- `packages/api/src/__tests__/services/adapters/retry.test.ts`

### Integration Tests

Test end-to-end workflows:
- Job creation → execution → results viewing
- Exception review → manual matching
- Scheduled job execution
- Export functionality

---

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - For email notifications (optional)
- `NEXT_PUBLIC_APP_URL` - Base URL for email links

Optional:
- `EMAIL_PROVIDER` - 'resend' or 'sendgrid' (default: 'resend')
- `EMAIL_FROM` - From email address

---

## Monitoring

### Health Checks

Scheduler status endpoint (add to API):
```typescript
GET /api/admin/scheduler/status
```

Returns:
```json
{
  "isRunning": true,
  "activeJobCount": 5,
  "jobIds": ["job-1", "job-2", ...],
  "hasCronLibrary": true
}
```

### Logging

All services include comprehensive logging:
- `[JobScheduler]` - Scheduler service logs
- `[JobFailureNotification]` - Notification logs
- `[ReceiptMatching]` - Receipt matching logs
- `[RuleOptimizer]` - Rule optimization logs

---

## Troubleshooting

### Scheduler Not Running

1. Check if `node-cron` is installed
2. Verify scheduler service is started
3. Check logs for errors
4. Verify database connection

### Notifications Not Sending

1. Check `RESEND_API_KEY` is set
2. Verify email templates exist
3. Check email service logs
4. Verify user email addresses

### Jobs Not Executing

1. Verify job status is 'active'
2. Check cron expression is valid
3. Verify scheduler is running
4. Check job execution logs

---

## Performance Considerations

### Scheduler
- Checks for new jobs every 5 minutes
- Health check every 1 minute
- Limits concurrent executions per job

### Exports
- Processes exports asynchronously
- Limits to 10,000 rows per export
- Uses streaming for large files

### Receipt Matching
- Processes in batches
- Limits to 100 transactions per match
- Uses efficient string matching

---

## Security Considerations

- ✅ All endpoints require authentication
- ✅ Tenant isolation enforced
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma)
- ✅ Rate limiting (via existing middleware)
- ✅ Audit logging for all actions

---

**Status:** ✅ Integration guide complete
