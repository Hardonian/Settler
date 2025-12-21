# Quick Start Guide

## Prerequisites

- Node.js >= 24.0.0
- PostgreSQL (via Supabase)
- npm or pnpm

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/settler-enterprise.git
cd settler-enterprise
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

### 4. Database Setup

#### Run Migrations

```bash
export DATABASE_URL="your-connection-string"
npx tsx scripts/run-migrations-remote.ts
```

#### Configure Super Admin (Optional)

```bash
export DATABASE_URL="your-connection-string"
export USER_EMAIL="admin@settler.dev"
npx tsx scripts/configure-super-admin.ts
```

### 5. Start Development Server

```bash
cd packages/web
pnpm dev
```

Access:
- Web app: `http://localhost:3000`
- Console: `http://localhost:3000/console` (after signup)

## Access Developer Console

1. Navigate to `http://localhost:3000`
2. Sign up at `/signup`
3. Access Console at `/console`
4. Create API keys, monitor usage, manage resources

## Verify Setup

```bash
# Run all tests
export DATABASE_URL="your-connection-string"
./scripts/run-all-tests.sh

# Or run individual tests
npx tsx scripts/test-setup.ts
npx tsx scripts/integration-test.ts
```

## Next Steps

- [Console Documentation](./CONSOLE.md)
- [API Documentation](./API.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Remote Setup Guide](./REMOTE_SETUP_GUIDE.md)
