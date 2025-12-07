# Quick Redis Setup Guide

## ✅ Perfect! You Have Everything You Need

You have the **Redis URL** from Upstash, which includes all connection details:

```
REDIS_URL="rediss://default:AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY@pretty-buck-23396.upstash.io:6379"
```

This single URL works for:

- ✅ BullMQ job queues (TCP connection)
- ✅ Caching operations
- ✅ Rate limiting

---

## Environment Variables for Vercel

Set this in **Vercel Dashboard → Settings → Environment Variables**:

```bash
# Redis URL (Primary - works for everything)
REDIS_URL=rediss://default:AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY@pretty-buck-23396.upstash.io:6379

# REST API (Optional - only if using Upstash REST client directly)
UPSTASH_REDIS_REST_URL=https://pretty-buck-23396.upstash.io
UPSTASH_REDIS_REST_TOKEN=AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY
```

**That's it!** The `REDIS_URL` is all you need. The code will automatically:

- Use TLS (the `rediss://` protocol indicates secure connection)
- Connect to the correct host and port
- Authenticate with the password

**Note:** The `rediss://` protocol (with double 's') means Redis Secure/TLS, which is required for Upstash.

---

## Testing

After setting variables, your app will automatically test the connection on startup. Check logs for:

- ✅ "Redis connected successfully"
- ❌ "Redis connection failed" (if TCP details are wrong)

---

## Security ⚠️

**Never commit these to git!** Store only in Vercel environment variables.

See `docs/UPSTASH_TCP_SETUP.md` for detailed troubleshooting.
