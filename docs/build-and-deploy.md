# Build & Deploy Guide

This document describes the build pipeline, deployment process, and how to troubleshoot build issues for the Settler monorepo.

## Overview

The Settler monorepo uses:

- **Turbo** for monorepo task orchestration
- **TypeScript** with strict type checking
- **Vercel** for deployment of the API and Web packages
- \*\*Node.js 20+ (see `.nvmrc`)

## Monorepo Structure

The monorepo contains the following packages:

- `@settler/types` - Shared TypeScript types
- `@settler/adapters` - Payment adapter implementations
- `@settler/sdk` - JavaScript/TypeScript SDK
- `@settler/cli` - Command-line interface tool
- `@settler/api` - API server (deployed to Vercel)
- `@settler/web` - Next.js web application (deployed to Vercel)

### Package Dependencies

The build order is managed by Turbo and follows this dependency graph:

```
@settler/types → @settler/adapters → @settler/sdk → @settler/api
                                              ↓
                                         @settler/cli
```

## Local Development

### Prerequisites

- Node.js >= 20.0.0 (use `.nvmrc` for version management)
- npm >= 10.0.0

### Setup

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run full validation (lint + typecheck + format check)
npm run validate

# Run build health check (lint + typecheck)
npm run check
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
cd packages/api && npm run build
```

The build pipeline ensures:

1. Dependencies are built first (`^build` dependency)
2. Type checking runs before builds (`typecheck` dependency)
3. Outputs are cached by Turbo for faster subsequent builds

## TypeScript Configuration

### Root Configuration

The root `tsconfig.json` defines strict settings:

- `strict: true` - All strict type checking enabled
- `noUnusedLocals: true` - Unused local variables are errors
- `noUnusedParameters: true` - Unused parameters are errors
- `skipLibCheck: true` - Skip type checking of declaration files

### Package Configurations

Each package extends the root config:

- `packages/*/tsconfig.json` - Extends `../../tsconfig.json`
- Package-specific overrides are allowed (e.g., `outDir`, `rootDir`)

### Handling Intentionally Unused Code

For code that is intentionally unused (e.g., reserved for future features):

1. **Unused parameters**: Prefix with `_` (e.g., `_req`, `_config`)
2. **Unused variables**: Prefix with `_` and add `void _variable;` to mark as intentionally unused
3. **Unused private properties**: Reference them with `void this._property;` in constructor or initialization
4. **Unused functions**: Export them or add module-level reference: `void _functionName;`

Example:

```typescript
// Reserved for future use
const _futureFeature = computeSomething();
void _futureFeature;

// Unused parameter in Express route
router.get("/endpoint", async (_req: Request, res: Response) => {
  res.json({ data: "ok" });
});
```

## Vercel Deployment

### Configuration

Vercel configuration is in `packages/api/vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run typecheck && npm run build",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ],
  "functions": {
    "api/index.ts": {
      "maxDuration": 30
    }
  }
}
```

### Build Process

Vercel runs the following steps:

1. **Install dependencies**: `npm install` (from monorepo root)
2. **Type check**: `npm run typecheck` (runs `turbo run typecheck`)
3. **Build**: `npm run build` (runs `turbo run build`)

### Build Pipeline

The Turbo pipeline (`turbo.json`) ensures:

- `typecheck` runs before `build` for all packages
- Dependencies are built in the correct order (`^build`)
- Build outputs are cached (`dist/**`, `.next/**`, `build/**`)

### Packages Deployed to Vercel

- **@settler/api** - API server (serverless functions)
- **@settler/web** - Next.js web application

The CLI package (`@settler/cli`) is **not** deployed to Vercel but is included in the build pipeline to ensure it remains type-safe and buildable.

## Troubleshooting

### TypeScript Errors

If you encounter TypeScript errors:

1. **Unused variable/parameter errors (TS6133)**:
   - Remove the unused code if not needed
   - Prefix with `_` if intentionally unused
   - Add `void _variable;` for variables that must exist but aren't used

2. **Unused property errors (TS6138)**:
   - For private properties: Add `void this._property;` in constructor
   - For module-level constants: Add `void _constant;` at module level

3. **Run typecheck locally**:
   ```bash
   npm run typecheck
   ```

### Build Failures

1. **Check Turbo cache**:

   ```bash
   npm run clean
   npm run build
   ```

2. **Verify dependencies are built**:

   ```bash
   # Build dependencies first
   cd packages/types && npm run build
   cd ../adapters && npm run build
   cd ../sdk && npm run build
   ```

3. **Check Node version**:
   ```bash
   node --version  # Should be >= 20.0.0
   ```

### Vercel Build Failures

1. **Check build logs** in Vercel dashboard
2. **Reproduce locally**:
   ```bash
   npm run typecheck
   npm run build
   ```
3. **Verify environment variables** are set in Vercel project settings
4. **Check Node version** - Vercel uses Node 20+ by default (configured via `.nvmrc`)

## CI/CD Integration

### Pre-commit Hooks

Husky is configured to run:

- `lint-staged` - Runs ESLint and Prettier on staged files

### Recommended CI Checks

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm install

- name: Type check
  run: npm run typecheck

- name: Lint
  run: npm run lint

- name: Build
  run: npm run build
```

## Best Practices

1. **Always run `npm run check` before pushing** - This catches lint and type errors
2. **Keep unused code clean** - Remove truly unused code, mark intentionally unused code with `_` prefix
3. **Test builds locally** - Run `npm run build` before pushing to catch build issues early
4. **Use Turbo cache** - Don't clear cache unless necessary; Turbo's cache significantly speeds up builds
5. **Follow TypeScript strict mode** - Don't disable strict checks; fix the underlying issues instead

## Node Version Management

The project uses Node.js 20.x (specified in `.nvmrc`). To ensure consistency:

```bash
# Using nvm
nvm use

# Or manually verify
node --version  # Should show v20.x.x
```

Vercel will automatically use the Node version specified in `.nvmrc` or the project's `engines` field in `package.json`.

## Additional Resources

- [Turbo Documentation](https://turbo.build/repo/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vercel Documentation](https://vercel.com/docs)
