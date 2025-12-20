# Supabase Database Setup - Quick Start

Your Supabase database migrations are ready to run! Follow these steps to get everything set up.

## 🚀 Quick Setup (Choose One)

### Option 1: Remote Supabase Project (Production/Staging)

1. **Get your connection details:**
   - Go to your Supabase project: https://app.supabase.com
   - Navigate to **Settings → Database**
   - Copy the **Connection string** (under "Connection pooling" or "Direct connection")
   - Or note your project URL and database password

2. **Set environment variables:**
   ```bash
   # Create .env file from template
   cp .env.template .env
   
   # Edit .env and add your connection string:
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

3. **Run migrations:**
   ```bash
   npm run db:migrate:auto
   ```

### Option 2: Local Supabase (Development)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   # OR
   brew install supabase/tap/supabase
   ```

2. **Start local Supabase:**
   ```bash
   supabase start
   ```

3. **Run migrations:**
   ```bash
   npm run db:migrate:auto
   ```

### Option 3: Check Connection First

Test your connection before running migrations:

```bash
npm run db:check
```

This will verify your database connection and provide helpful guidance if something is wrong.

## 📋 What Gets Migrated?

The migration script will automatically:

1. ✅ **Run all schema migrations** (in order):
   - Initial schema (tables, indexes)
   - Functions and triggers
   - Reconciliation graph tables
   - Row Level Security policies

2. ✅ **Load seed data**:
   - Default tenant
   - Example user (admin@example.com)
   - Example API key
   - Webhook configurations

## ✅ Verification

After migrations complete, you should see:

```
✅ All migrations completed successfully!
```

Your database is now fully set up and ready to use!

## 🔧 Troubleshooting

### Connection Errors

**Error: `ECONNREFUSED`**
- Local Supabase: Make sure `supabase start` is running
- Remote Supabase: Check your connection string and ensure your IP is allowed

**Error: `password authentication failed`**
- Verify your database password in Supabase dashboard
- Make sure you're using the correct connection string

**Error: `SSL required`**
- For remote Supabase, SSL is required (handled automatically)
- For local, SSL is disabled by default

### Migration Errors

**"already exists" warnings**
- These are safe to ignore - migrations are idempotent
- The script handles them automatically

**Permission errors**
- Ensure you're using a database user with sufficient privileges
- For Supabase, use the `postgres` user with your database password

## 📚 More Information

- See `scripts/setup-supabase.md` for detailed documentation
- See `.env.example` for all available environment variables

## 🆘 Need Help?

1. Check connection: `npm run db:check`
2. Review logs: Migration script provides detailed output
3. Check Supabase dashboard: Verify tables were created

---

**Ready to go?** Run `npm run db:migrate:auto` after setting up your connection!
