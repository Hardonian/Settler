# Environment Variables Setup Guide

## File Locations

Two `.env` files have been created:

1. **Root `.env`** (`/workspace/.env`) - Shared across monorepo
2. **Web `.env`** (`/workspace/packages/web/.env`) - Next.js web app specific

## Next.js Environment Variable Priority

Next.js reads environment variables in this order (highest priority first):

1. `packages/web/.env.local` (highest priority, gitignored)
2. `packages/web/.env.development` (when `NODE_ENV=development`)
3. `packages/web/.env`
4. Root `.env` (if Next.js is configured to read it)

**Recommendation**: Use `packages/web/.env.local` for your actual secrets (it's gitignored).

## Required Supabase Keys

### 1. Supabase Project URL
- **Location**: Supabase Dashboard → Settings → API → Project URL
- **Format**: `https://[your-project-ref].supabase.co`
- **Variables**:
  - `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL` (for client-side)

### 2. Supabase Anon Key (Public)
- **Location**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Safe for**: Client-side code (exposed to browser)
- **Variables**:
  - `SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for client-side)

### 3. Supabase Service Role Key (SECRET)
- **Location**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **⚠️ SECRET**: Never expose to client-side code
- **Variable**: `SUPABASE_SERVICE_ROLE_KEY`

### 4. Database Connection String (Required for Prisma)
- **Location**: Supabase Dashboard → Settings → Database → Connection string → **Direct connection**
- **Format**: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **Variables** (use at least one):
  - `DATABASE_URL` (Prisma reads this automatically)
  - `SUPABASE_DATABASE_URL` (alternative name)
  - `DIRECT_URL` (used by Supabase CLI)

### 5. Supabase CLI & Migration Keys (Optional)
- **SUPABASE_ACCESS_TOKEN**: Supabase Dashboard → Account → Access Tokens
- **SUPABASE_PROJECT_REF**: Found in your project URL (the part before `.supabase.co`)
- **SUPABASE_DB_PASSWORD**: Your database password (set during project creation)

## Quick Setup Steps

1. **Get Supabase Keys**:
   ```bash
   # Go to: https://supabase.com/dashboard
   # Select your project
   # Settings → API → Copy:
   #   - Project URL → SUPABASE_URL
   #   - anon public key → SUPABASE_ANON_KEY
   #   - service_role secret key → SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Get Database Connection String**:
   ```bash
   # Supabase Dashboard → Settings → Database
   # Connection string → Direct connection → Copy
   # Paste into: DATABASE_URL, SUPABASE_DATABASE_URL, or DIRECT_URL
   ```

3. **Update `.env` files**:
   ```bash
   # Edit packages/web/.env.local (recommended) or packages/web/.env
   # Replace all "your-*" placeholders with actual values
   ```

4. **Restart Dev Server**:
   ```bash
   # Environment variables are loaded at startup
   # Stop and restart: npm run dev
   ```

## Verification

After setting up your `.env` file, verify Prisma can read `DATABASE_URL`:

```bash
# Check if DATABASE_URL is loaded
cd packages/web
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')"
```

Or check in your Next.js app:
```typescript
// In a server component or API route
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
```

## Troubleshooting

### Prisma not reading DATABASE_URL

1. **Check file location**: Ensure `.env` is in `packages/web/` directory
2. **Check variable name**: Must be exactly `DATABASE_URL`, `SUPABASE_DATABASE_URL`, or `DIRECT_URL`
3. **Restart server**: Environment variables load at startup
4. **Check for typos**: No spaces around `=` sign: `DATABASE_URL=value` not `DATABASE_URL = value`
5. **Check quotes**: Don't quote the value unless it contains spaces

### Next.js not loading .env

- Next.js only loads `.env` files from `packages/web/` directory
- Use `.env.local` for local development (it's gitignored)
- Restart the dev server after changing `.env` files

### Prisma Client Engine Type Error

If you see "requires either adapter or accelerateUrl":
- Ensure `DATABASE_URL` is set in `.env`
- Check that the connection string is valid PostgreSQL format
- Restart the dev server

## Security Notes

- ✅ `.env.local` is gitignored (safe for secrets)
- ✅ `.env` files are gitignored (safe for secrets)
- ⚠️ Never commit `.env` files with real secrets
- ⚠️ `NEXT_PUBLIC_*` variables are exposed to the browser
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` is SECRET - server-side only

## All Supabase Environment Variables

```bash
# Required for Supabase Client
SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for Prisma/Database
DATABASE_URL=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
SUPABASE_DATABASE_URL=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres

# Optional for CLI/Migrations
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_REALTIME_EVENTS_PER_SECOND=10
```
