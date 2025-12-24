# Scripts Directory

This directory contains utility scripts for development, testing, deployment, and maintenance.

## Setup & Migration Scripts

### Database Setup
- `run-migrations-remote.ts` - Run database migrations via remote connection
- `configure-super-admin.ts` - Configure super admin access
- `test-setup.ts` - Verify database setup
- `check-schema.ts` - Check database schema

### Testing Scripts
- `test-api-routes.ts` - Test API route functionality
- `integration-test.ts` - Integration tests
- `test-end-to-end.ts` - End-to-end flow tests
- `verify-all-routes.ts` - Verify all routes and components
- `final-verification.ts` - Final verification suite
- `run-all-tests.sh` - Run all test scripts

## Usage

### Run Migrations
```bash
export DATABASE_URL="your-connection-string"
npx tsx scripts/run-migrations-remote.ts
```

### Configure Super Admin
```bash
export DATABASE_URL="your-connection-string"
export USER_EMAIL="admin@settler.dev"
npx tsx scripts/configure-super-admin.ts
```

### Run All Tests
```bash
export DATABASE_URL="your-connection-string"
./scripts/run-all-tests.sh
```

## Script Categories

### Setup Scripts
Scripts for initial setup and configuration.

### Test Scripts
Scripts for testing and verification.

### Migration Scripts
Scripts for database migrations and schema changes.

### Maintenance Scripts
Scripts for ongoing maintenance and operations.

## Documentation

For detailed documentation on specific scripts, see:
- [Remote Setup Guide](../REMOTE_SETUP_GUIDE.md)
- [Implementation Complete](../IMPLEMENTATION_COMPLETE.md)
- [Console Documentation](../docs/CONSOLE.md)
