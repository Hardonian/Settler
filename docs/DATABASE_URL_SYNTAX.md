# DATABASE_URL Syntax Guide

## Standard PostgreSQL Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database][?parameters]
```

## Examples

### 1. Supabase Direct Connection (Recommended)

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Example:**
```
postgresql://postgres:mySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**Where to find:**
- Supabase Dashboard → Settings → Database → Connection string
- Select "Direct connection" (not pooling)
- Copy the connection string and replace `[YOUR-PASSWORD]` with your actual password

### 2. Supabase Connection Pooling

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Example:**
```
postgresql://postgres.abcdefghijklmnop:mySecurePassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Benefits:**
- Better for serverless environments
- Handles connection pooling automatically
- Port 6543 (pooler) vs 5432 (direct)

### 3. Local PostgreSQL

```
postgresql://[user]:[password]@localhost:[port]/[database]
```

**Example:**
```
postgresql://postgres:postgres@localhost:5432/settler
```

### 4. Local Supabase (Development)

```
postgresql://postgres:postgres@localhost:54322/postgres
```

**Note:** Supabase local development uses port `54322` by default.

## URL Components Explained

| Component | Description | Example |
|-----------|-------------|---------|
| `postgresql://` | Protocol | `postgresql://` (or `postgres://`) |
| `postgres` | Username | `postgres` (default Supabase user) |
| `[YOUR-PASSWORD]` | Password | Your database password |
| `db.[PROJECT-REF]` | Hostname | `db.abcdefghijklmnop.supabase.co` |
| `5432` | Port | `5432` (direct) or `6543` (pooler) |
| `postgres` | Database name | `postgres` (default) |

## Query Parameters (Optional)

You can add query parameters for additional configuration:

```
postgresql://postgres:password@host:5432/postgres?sslmode=require&connection_limit=5&pool_timeout=20
```

### Common Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `sslmode` | SSL mode | `require`, `prefer`, `disable` |
| `connection_limit` | Max connections | `5`, `10`, `20` |
| `pool_timeout` | Connection timeout (seconds) | `20`, `30` |
| `schema` | Default schema | `public` |

**Example with parameters:**
```
postgresql://postgres:password@db.project.supabase.co:5432/postgres?sslmode=require&connection_limit=5
```

## Special Characters in Password

If your password contains special characters, URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `#` | `%23` |
| `?` | `%3F` |
| `&` | `%26` |
| `=` | `%3D` |
| `%` | `%25` |
| ` ` (space) | `%20` |

**Example:**
```
# Password: "my@pass:word"
postgresql://postgres:my%40pass%3Aword@db.project.supabase.co:5432/postgres
```

## Getting Your Supabase Connection String

### Method 1: Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string**
5. Select **URI** tab
6. Copy the connection string
7. Replace `[YOUR-PASSWORD]` with your actual database password

### Method 2: Connection Pooling

1. Same as above, but select **Connection pooling** tab
2. Use port `6543` instead of `5432`
3. Use `postgres.[PROJECT-REF]` instead of `postgres` as username

### Method 3: From .env.connection File

If you have a `.env.connection` file:
```bash
cat .env.connection
```

## Setting DATABASE_URL

### Option 1: Environment Variable (Temporary)

```bash
export DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
```

### Option 2: .env File (Local Development)

Create `.env` file:
```bash
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
```

### Option 3: Vercel/Production

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `DATABASE_URL` with your connection string
3. Set for Production, Preview, and/or Development environments

## Verification

Test your connection string:

```bash
# Using psql
psql "postgresql://postgres:password@db.project.supabase.co:5432/postgres" -c "SELECT 1"

# Using Node.js
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT 1').then(() => { console.log('✅ Connected'); pool.end(); }).catch(e => { console.error('❌ Error:', e.message); process.exit(1); });"
```

## Common Issues

### Issue: Connection Refused

**Possible causes:**
- Wrong hostname
- Wrong port
- Firewall blocking connection
- Database not accessible

**Solution:**
- Verify hostname format: `db.[PROJECT-REF].supabase.co`
- Check port: `5432` for direct, `6543` for pooler
- Ensure IP allowlist allows your IP (Supabase Dashboard → Settings → Database → Connection pooling)

### Issue: Authentication Failed

**Possible causes:**
- Wrong password
- Special characters not URL-encoded
- Wrong username

**Solution:**
- Reset password in Supabase Dashboard
- URL-encode special characters in password
- Use `postgres` as username (not your Supabase account email)

### Issue: SSL Required

**Error:** `SSL connection required`

**Solution:**
Add `?sslmode=require` to connection string:
```
postgresql://postgres:password@db.project.supabase.co:5432/postgres?sslmode=require
```

## Security Best Practices

1. ✅ **Never commit passwords to git**
   - Use `.env` file (add to `.gitignore`)
   - Use environment variables in production

2. ✅ **Use connection pooling for serverless**
   - Better performance
   - Handles connection limits

3. ✅ **Rotate passwords regularly**
   - Change database password periodically
   - Update all environment variables

4. ✅ **Use IP allowlisting**
   - Restrict database access to known IPs
   - Supabase Dashboard → Settings → Database → Connection pooling

5. ✅ **Use different passwords for different environments**
   - Separate passwords for dev/staging/production

## Quick Reference

```bash
# Supabase Direct Connection
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase Connection Pooling
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Local Development
postgresql://postgres:postgres@localhost:54322/postgres

# With SSL and Connection Limits
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require&connection_limit=5
```

## Example for Settler Project

Based on your `.env.connection` file:

```bash
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.johfcvvmtfiomzxipspz.supabase.co:5432/postgres
```

Replace `[YOUR_PASSWORD]` with your actual Supabase database password.
