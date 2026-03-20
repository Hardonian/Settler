# Common Setup Traps

**Last Updated:** 2026-03-18  
**Purpose:** Guide to avoiding common setup issues when running Settler locally.

---

## Overview

This document covers the most frequent issues operators encounter when setting up Settler for local development, with clear solutions.

---

## Trap 1: Node.js Version Mismatch

### Symptom
- Build failures
- Unexpected runtime errors
- "Module not found" errors

### Cause
Using wrong Node.js version (not 24.x).

### Solution
```bash
# Check current version
node --version

# Use nvm to switch
nvm install 24
nvm use 24

# Verify
node --version  # Should show v24.x.x
```

---

## Trap 2: Missing .env.local

### Symptom
- "Missing environment variable" errors
- App won't start

### Cause
`.env.local` not created from example.

### Solution
```bash
# Create from example
cp .env.local.example .env.local

# Or run bootstrap (recommended)
pnpm run bootstrap
```

---

## Trap 3: Docker Not Running

### Symptom
- "Connection refused" errors
- TigerBeetle/Postgres unavailable

### Cause
Docker not running or not accessible.

### Solution
```bash
# Start Docker Desktop (Windows/Mac)
# Or start dockerd (Linux)
sudo systemctl start docker

# Verify
docker ps
```

---

## Trap 4: Port Already in Use

### Symptom
- "EADDRINUSE: address already in use"
- Web or API won't start

### Cause
Another process using port 3000 or 4000.

### Solution
```bash
# Find process
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Kill process
taskkill /PID <PID> /F         # Windows
kill -9 <PID>                  # Mac/Linux
```

Or use different ports:
```bash
PORT=3001 pnpm dev
```

---

## Trap 5: pnpm Not Installed

### Symptom
- "pnpm: command not found"

### Solution
```bash
# Install pnpm
npm install -g pnpm

# Verify
pnpm --version  # Should be 10.13+
```

---

## Trap 6: Dependencies Not Installed

### Symptom
- "Cannot find module" errors
- Build fails

### Solution
```bash
# Clean install
rm -rf node_modules
pnpm install
```

---

## Trap 7: Prisma Client Not Generated

### Symptom
- "Unknown type `X`" errors
- Database queries fail

### Solution
```bash
# Generate Prisma client
pnpm prisma:generate

# Or push schema
pnpm prisma:push
```

---

## Trap 8: Database Migrations Not Run

### Symptom
- "Relation does not exist" errors
- App starts but data operations fail

### Solution
```bash
# Run migrations
pnpm db:migrate:local

# Or push schema
pnpm db:push

# Check status
pnpm prisma:status
```

---

## Trap 9: Seed Data Missing

### Symptom
- Console shows no transactions
- Reconciliation runs have no data

### Solution
```bash
# Seed demo data
pnpm demo:seed

# Verify
pnpm run doctor
# Should show "Seed Data: OK"
```

---

## Trap 10: TigerBeetle Container Crashed

### Symptom
- Ledger errors
- Financial transactions fail

### Solution
```bash
# Reset TigerBeetle
pnpm tb:reset

# Restart
pnpm tb:start

# Check status
pnpm tb:status
```

---

## Verification Checklist

Run this to confirm setup is healthy:

```bash
# 1. Check Node version
node --version  # v24.x.x

# 2. Check pnpm version
pnpm --version  # 10.13+

# 3. Check Docker
docker ps  # Should show running containers

# 4. Check env file
ls -la .env.local

# 5. Run doctor
pnpm run doctor

# 6. Check services
pnpm tb:status
```

---

## Debug Commands

| Issue | Command |
|-------|---------|
| Check Node | `node --version` |
| Check pnpm | `pnpm --version` |
| Check Docker | `docker ps` |
| Check env | `ls .env.local` |
| Doctor | `pnpm run doctor -- --first-run` |
| DB check | `pnpm db:check` |
| TB status | `pnpm tb:status` |
| TB logs | `pnpm tb:logs` |

---

## Still Stuck?

1. Run full verification: `pnpm verify`
2. Check logs: `pnpm tb:logs`
3. Reset everything:
   ```bash
   pnpm tb:reset
   rm -rf node_modules
   pnpm run bootstrap
   ```

---

## Related Documentation

- [SETUP.md](../SETUP.md)
- [Verification Commands](../VERIFICATION_COMMANDS.md)
- [Troubleshooting README](./README.md)
