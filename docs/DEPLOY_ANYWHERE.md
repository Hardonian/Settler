# Deploy Anywhere Guide

Settler is designed to deploy on any platform that supports Node.js. This guide covers deployment on Vercel, Fly.io, Render, and Docker.

## Prerequisites

- Node.js 24+ and npm 10+
- Supabase project (for database and auth)
- Stripe account (for subscriptions)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

## Deploy on Vercel

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will auto-detect Next.js and build

```bash
# Or use Vercel CLI
vercel --prod
```

## Deploy on Fly.io

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Create app**: `fly launch`
3. **Set secrets**:
   ```bash
   fly secrets set SUPABASE_URL=...
   fly secrets set SUPABASE_ANON_KEY=...
   # ... etc
   ```
4. **Deploy**: `fly deploy`

## Deploy on Render

1. **Create new Web Service** in Render dashboard
2. **Connect repository**
3. **Set build command**: `npm install && npm run build`
4. **Set start command**: `cd packages/web && npm start`
5. **Add environment variables** in dashboard
6. **Deploy**

## Deploy with Docker

### Build image:
```bash
docker build -t settler .
```

### Run container:
```bash
docker run -p 3000:3000 \
  -e SUPABASE_URL=... \
  -e SUPABASE_ANON_KEY=... \
  # ... etc
  settler
```

### Or use docker-compose:
```bash
docker-compose up -d
```

## Database Migrations

After deployment, run migrations:

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL
psql $DATABASE_URL < supabase/migrations/*.sql
```

## Health Checks

The app exposes a health endpoint:
- `GET /api/health` - Returns 200 if healthy

## Troubleshooting

### 500 Errors on /console or /playground

Set `SAFE_MODE=true` to force public minimal mode:
```bash
export SAFE_MODE=true
```

### Database Connection Issues

1. Check `DATABASE_URL` is correct
2. Verify Supabase project is active
3. Check RLS policies are applied

### Build Failures

1. Ensure Node.js 24+ is installed
2. Run `npm install` locally first
3. Check for TypeScript errors: `npm run typecheck`

## Production Checklist

- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Stripe webhook configured
- [ ] Health checks passing
- [ ] Smoke tests passing (`npm run qa:smoke`)
- [ ] Link integrity verified (`npm run qa:links`)
