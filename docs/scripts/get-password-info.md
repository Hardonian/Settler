# Database Password Required

To run migrations, I need your Supabase database password.

## How to Get Your Database Password

1. Go to your Supabase project: https://app.supabase.com/project/johfcvvmtfiomzxipspz
2. Navigate to **Settings → Database**
3. Look for **Database Password** section
4. If you haven't set one, click **Reset Database Password**
5. Copy the password

## Then Provide It

You can provide it in one of these ways:

**Option 1: Environment Variable**

```bash
export SUPABASE_DB_PASSWORD="your-password-here"
npm run db:migrate:auto
```

**Option 2: Update .env file**
Edit `.env` and replace `[YOUR_PASSWORD]` with your actual password:

```
DATABASE_URL=postgresql://postgres:your-actual-password@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres
```

**Option 3: Full Connection String**
Provide the complete connection string with password:

```
DATABASE_URL=postgresql://postgres:your-password@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres
```

Once you provide the password, I can run all migrations immediately!
