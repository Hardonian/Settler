# Changelog

All notable changes to Settler will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### UI/UX Improvements

#### Design System

- Enhanced console navigation with better spacing, active states, and visual hierarchy
- Added smooth hover animations and transition effects to navigation items
- Improved sidebar layout with backdrop blur and overflow handling
- Enhanced mobile navigation menu with better touch targets and visual feedback

#### Marketing & Copy

- Improved pricing page copy to accurately describe reconciliation capabilities
- Removed hype-driven messaging in favor of factual, product-focused descriptions
- Eliminated manipulative urgency tactics (limited-time offers, countdown timers)
- Aligned messaging with Settler's core value proposition: deterministic financial reconciliation

#### Technical Quality

- Fixed TypeScript compilation error in CLI package by adding missing module paths
- Cleaned up unused imports and variables across web package
- Verified all builds pass with no errors

### Changed

- **Subscription Checks**: Fixed subscription status API to never return 500
- **Error Boundaries**: Enhanced error boundaries with better UX

### Security

- **PII Filtering**: Automatic sanitization of personally identifiable information
- **Tenant Isolation**: RLS policies enforce tenant boundaries
- **Access Control**: Server-side enforcement of access rules
- **Rate Limiting**: Protection against abuse and DDoS

## Migration Guide

### Database Migrations

Run the following migrations in order:

1. `20241201000000_create_api_call_logs.sql`
2. `20241201000001_optimize_api_call_logs.sql`
3. `20241201000002_add_log_retention_policy.sql`
4. `20241201000003_enhance_rls_policies.sql`

### Configuration

1. Set up super admin:

   ```bash
   export DATABASE_URL="your-connection-string"
   export USER_EMAIL="admin@settler.dev"
   npx tsx scripts/configure-super-admin.ts
   ```

2. Verify setup:
   ```bash
   npx tsx scripts/test-setup.ts
   ```

## Documentation

- [Console Documentation](docs/CONSOLE.md)
- [API Documentation](docs/API.md)
- [Setup Guide](REMOTE_SETUP_GUIDE.md)
- [Implementation Details](IMPLEMENTATION_COMPLETE.md)
