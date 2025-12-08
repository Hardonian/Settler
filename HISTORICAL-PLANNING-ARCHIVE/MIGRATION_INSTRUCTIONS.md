# Migration Instructions - IPv6 Connectivity Issue

## Issue

The current environment cannot connect to your Supabase database because:
- The database hostname resolves to IPv6 only
- This environment doesn't have IPv6 connectivity

## Solutions

### Option 1: Run Migrations from Your Local Machine (Recommended)

1. **Clone/access this repository on your local machine**

2. **Set up environment:**
   ```bash
   cp .env.template .env
   # Edit .env and add:
   DATABASE_URL=postgresql://postgres:XoogH4uSsWQ3mhFD@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run migrations:**
   ```bash
   npm run db:migrate:auto
   ```

### Option 2: Use Supabase Dashboard SQL Editor

1. Go to: https://app.supabase.com/project/johfcvvmtfiomzxipspz
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content in order:
   - `supabase/migrations/20251128193735_initial_schema.sql`
   - `supabase/migrations/20251128193816_functions_and_triggers.sql`
   - `supabase/migrations/20251128193816_reconciliation_graph_tables.sql`
   - `supabase/migrations/20251128193816_rls_policies.sql`
4. Run each migration
5. Then run the seed file: `supabase/seeds/seed.sql`

### Option 3: Use Supabase CLI (if available)

```bash
# Link to your project
supabase link --project-ref johfcvvmtfiomzxipspz

# Run migrations
supabase db push
```

### Option 4: Manual Migration via psql

If you have `psql` installed locally:

```bash
psql "postgresql://postgres:XoogH4uSsWQ3mhFD@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres" -f supabase/migrations/20251128193735_initial_schema.sql
psql "postgresql://postgres:XoogH4uSsWQ3mhFD@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres" -f supabase/migrations/20251128193816_functions_and_triggers.sql
psql "postgresql://postgres:XoogH4uSsWQ3mhFD@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres" -f supabase/migrations/20251128193816_reconciliation_graph_tables.sql
psql "postgresql://postgres:XoogH4uSsWQ3mhFD@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres" -f supabase/migrations/20251128193816_rls_policies.sql
psql "postgresql://postgres:XoogH4uSsWQ3mhFD@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres" -f supabase/seeds/seed.sql
```

## What Gets Migrated

- ✅ 16+ database tables
- ✅ 50+ indexes
- ✅ 10+ functions
- ✅ 20+ triggers  
- ✅ Row Level Security policies
- ✅ Seed data (tenant, user, API keys)

## Verification

After migrations, check in Supabase Dashboard:
- **Table Editor** - Should see all tables created
- **SQL Editor** - Run `SELECT * FROM tenants;` to verify seed data

---

**All migration files are ready in `supabase/migrations/` directory!**
