# Upstash Redis TCP Connection Setup (for BullMQ)

**Important:** BullMQ requires a **TCP connection** to Redis, not the REST API.

You have:

- ✅ REST URL: `https://pretty-buck-23396.upstash.io`
- ✅ REST Token: `AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY`

**You still need:** TCP connection details

---

## How to Get TCP Connection Details

### Step 1: Go to Upstash Dashboard

1. Visit [console.upstash.com](https://console.upstash.com)
2. Log in to your account
3. Click on your database: **pretty-buck-23396**

### Step 2: Find TCP Endpoint

1. In your database dashboard, look for **"TCP Endpoint"** or **"Endpoint"** section
2. You should see something like:
   - **Endpoint:** `pretty-buck-23396.upstash.io:6379`
   - **Password:** `Axxxxx...` (long password string)

### Step 3: Copy TCP Details

Copy these values:

- **TCP Host:** `pretty-buck-23396.upstash.io` (without `:6379`)
- **TCP Port:** `6379`
- **TCP Password:** `Axxxxx...` (this is different from REST token!)

---

## Environment Variables to Set

Once you have the TCP details, set these in Vercel:

```bash
# REST API (for caching, simple operations)
UPSTASH_REDIS_REST_URL=https://pretty-buck-23396.upstash.io
UPSTASH_REDIS_REST_TOKEN=AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY

# TCP Connection (for BullMQ job queues)
REDIS_HOST=pretty-buck-23396.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-tcp-password-here
REDIS_TLS=true
```

**Important Notes:**

- `REDIS_PASSWORD` is the **TCP password**, NOT the REST token
- `REDIS_TLS=true` is required for Upstash
- `REDIS_HOST` should NOT include `https://` or `:6379`

---

## Testing the Connection

### Test REST API (Optional)

```bash
curl https://pretty-buck-23396.upstash.io/get/test \
  -H "Authorization: Bearer AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY"
```

### Test TCP Connection (Required for BullMQ)

The TCP connection will be tested automatically when your app starts. Check logs for:

- ✅ "Redis connected successfully"
- ❌ "Redis connection failed" (if TCP details are wrong)

---

## Security Reminder

⚠️ **Never commit these credentials to git!**

- Store them in Vercel Environment Variables only
- Don't share them publicly
- Rotate them if accidentally exposed

---

## Troubleshooting

### Error: "Connection timeout"

- Check `REDIS_TLS=true` is set
- Verify `REDIS_HOST` doesn't include `https://` or port
- Check firewall/network settings

### Error: "Authentication failed"

- Verify you're using TCP password (not REST token)
- Check password doesn't have extra spaces
- Regenerate password in Upstash dashboard if needed

### Error: "TLS required"

- Ensure `REDIS_TLS=true` is set
- Upstash requires TLS for all connections

---

## Next Steps

1. Get TCP connection details from Upstash dashboard
2. Set all environment variables in Vercel
3. Test connection (app will test on startup)
4. Verify BullMQ queues work (check logs)
