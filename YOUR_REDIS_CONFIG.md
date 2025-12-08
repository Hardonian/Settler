# Your Redis Configuration

## ✅ Ready to Use

Copy this into **Vercel Dashboard → Settings → Environment Variables**:

```bash
REDIS_URL=rediss://default:AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY@pretty-buck-23396.upstash.io:6379
```

**Optional (for REST API operations):**
```bash
UPSTASH_REDIS_REST_URL=https://pretty-buck-23396.upstash.io
UPSTASH_REDIS_REST_TOKEN=AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY
```

---

## What This Enables

- ✅ **BullMQ Job Queues** - Background job processing
- ✅ **Caching** - Fast data caching
- ✅ **Rate Limiting** - API rate limiting

---

## Security ⚠️

**Never commit this to git!** Only store in Vercel environment variables.

The code has been updated to automatically use `REDIS_URL` if provided, which makes setup easier.

---

## Testing

After setting the variable, your app will automatically test the connection on startup. Check logs for:
- ✅ "Redis connected successfully"
- ❌ "Redis connection failed" (if there's an issue)
