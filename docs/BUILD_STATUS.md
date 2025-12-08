# Build Status & Health

## Current Status

✅ **Build System**: Healthy  
✅ **TypeScript**: Strict mode enabled  
✅ **Linting**: Configured  
✅ **Vercel**: Ready for deployment  

## Quick Health Check

```bash
# Run all checks
npm run maintainer:check

# Individual checks
npm run build:guardian    # Build health
npm run typecheck         # Type checking
npm run lint              # Linting
npm run maintainer:audit  # Code audit
```

## Build Configuration

### Monorepo Setup
- **Turbo**: Build orchestration
- **TypeScript**: Strict mode across all packages
- **ESLint**: Consistent code style
- **Prettier**: Code formatting

### Package Structure
```
packages/
  ├── api/          # Express API server
  ├── web/          # Next.js application
  ├── sdk/          # Client SDK
  ├── types/        # Shared types
  └── adapters/     # Data adapters
```

## Build Commands

### Development
```bash
npm run dev          # Start all dev servers
npm run dev --filter=@settler/web  # Web only
npm run dev --filter=@settler/api  # API only
```

### Building
```bash
npm run build                    # Build all packages
npm run build --filter=@settler/web  # Build web
npm run build --filter=@settler/api  # Build API
```

### Quality Checks
```bash
npm run validate           # Full validation
npm run typecheck          # Type checking
npm run lint               # Linting
npm run format:check       # Format check
```

## Vercel Deployment

### Web App (`packages/web`)
- Framework: Next.js 14
- Build Command: `cd ../.. && npx turbo run build --filter=@settler/web...`
- Install Command: `npm ci`
- Output Directory: `.next`

### Configuration
- See `packages/web/vercel.json` for deployment config
- Environment variables required (see `.env.example`)

## Common Issues

### Build Fails
1. Check TypeScript errors: `npm run typecheck`
2. Check linting: `npm run lint`
3. Verify dependencies: `npm ci`
4. Check Prisma: `npm run prisma:generate`

### Type Errors
- Run `npm run typecheck` to see all errors
- Fix incrementally
- Use proper types (avoid `any`)

### Vercel Build Issues
- Check build logs in Vercel dashboard
- Verify environment variables
- Test build locally first

## Maintenance

See [MAINTAINER_GUIDE.md](./MAINTAINER_GUIDE.md) for detailed maintenance procedures.

## Support

For build issues:
1. Check [BUILD_GUARDIAN.md](./BUILD_GUARDIAN.md)
2. Run `npm run build:guardian`
3. Review build logs
4. Open an issue with details
