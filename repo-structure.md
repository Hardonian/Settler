# Repository Structure

Complete file structure and descriptions for the Settler monorepo.

## Root Directory

```
settler/
├── .github/                    # GitHub configuration
│   └── workflows/             # CI/CD workflows
│       ├── ci.yml             # Continuous integration
│       └── deploy-preview.yml # Vercel preview deployments
├── .husky/                    # Git hooks
│   └── pre-commit            # Pre-commit hook for lint-staged
├── docs/                      # Documentation
│   ├── api.md                # Complete API reference
│   ├── adapters.md           # Adapter development guide
│   ├── contributing.md       # Contribution guidelines
│   └── troubleshooting.md    # Common issues and solutions
├── packages/                  # Monorepo packages
│   ├── api/                  # API server package
│   ├── sdk/                  # TypeScript SDK package
│   ├── cli/                  # CLI tool package
│   ├── web/                  # Next.js web UI package
│   └── adapters/             # Platform adapters package
├── tests/                     # E2E tests
│   └── e2e/                  # Playwright E2E tests
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore rules
├── .lintstagedrc.js          # Lint-staged configuration
├── .prettierrc               # Prettier configuration
├── .prettierignore           # Prettier ignore rules
├── package.json              # Root package.json (workspaces)
├── playwright.config.ts      # Playwright E2E test config
├── README.md                 # Main README
├── repo-structure.md         # This file
├── tsconfig.json             # TypeScript root config
└── turbo.json                # Turborepo configuration
```

## Packages

### `packages/api/` - API Server

Serverless-ready Express API server.

```
packages/api/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── middleware/
│   │   ├── auth.ts          # Authentication middleware (JWT/API keys)
│   │   ├── error.ts         # Error handling middleware
│   │   └── validation.ts    # Request validation middleware (Zod)
│   └── routes/
│       ├── adapters.ts      # Adapter listing endpoints
│       ├── health.ts        # Health check endpoint
│       ├── jobs.ts          # Job CRUD endpoints
│       ├── reports.ts       # Report generation endpoints
│       └── webhooks.ts      # Webhook management endpoints
├── src/__tests__/
│   └── jobs.test.ts         # Unit tests
├── jest.config.js           # Jest configuration
├── package.json             # Package dependencies
└── tsconfig.json            # TypeScript config
```

**Key Files:**
- `src/index.ts` - Express app setup, middleware, route registration
- `src/middleware/auth.ts` - API key and JWT authentication
- `src/routes/jobs.ts` - Reconciliation job endpoints (create, list, get, run, delete)
- `src/routes/reports.ts` - Report generation and retrieval

### `packages/sdk/` - TypeScript SDK

npm-installable SDK for the Settler API.

```
packages/sdk/
├── src/
│   ├── index.ts              # Main export (default export SettlerClient)
│   ├── client.ts             # Core client class (SettlerClient)
│   ├── types.ts              # TypeScript type definitions
│   └── clients/
│       ├── adapters.ts       # AdaptersClient class
│       ├── jobs.ts           # JobsClient class
│       ├── reports.ts        # ReportsClient class
│       └── webhooks.ts       # WebhooksClient class
├── README.md                 # SDK documentation
├── package.json              # Package metadata (publishable)
└── tsconfig.json             # TypeScript config
```

**Key Files:**
- `src/client.ts` - Main client class with HTTP request handling
- `src/types.ts` - All TypeScript interfaces and types
- `src/clients/jobs.ts` - Job management methods

### `packages/cli/` - Command Line Tool

CLI for interacting with Settler API from terminal.

```
packages/cli/
├── src/
│   ├── index.ts              # CLI entry point (commander.js)
│   └── commands/
│       ├── adapters.ts      # Adapter listing command
│       ├── jobs.ts           # Job management commands
│       ├── reports.ts        # Report viewing commands
│       └── webhooks.ts       # Webhook management commands
├── package.json              # CLI package config (bin: "settler")
└── tsconfig.json             # TypeScript config
```

**Key Files:**
- `src/index.ts` - Commander.js setup, command registration
- `src/commands/jobs.ts` - `settler jobs list`, `settler jobs create`, etc.

### `packages/web/` - Next.js Web UI

Next.js application with playground and documentation.

```
packages/web/
├── src/
│   └── app/
│       ├── layout.tsx        # Root layout
│       ├── page.tsx          # Home page
│       ├── globals.css       # Global styles (Tailwind)
│       ├── playground/
│       │   └── page.tsx     # Interactive playground
│       └── docs/
│           └── page.tsx     # Documentation page
├── next.config.js           # Next.js configuration (MDX support)
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── package.json              # Next.js dependencies
└── tsconfig.json             # TypeScript config
```

**Key Files:**
- `src/app/page.tsx` - Landing page with quick start
- `src/app/playground/page.tsx` - Interactive code playground

### `packages/adapters/` - Platform Adapters

Adapter implementations for external platforms.

```
packages/adapters/
├── src/
│   ├── index.ts              # Adapter exports
│   ├── base.ts               # Adapter interface and base types
│   ├── stripe.ts             # Stripe adapter implementation
│   ├── shopify.ts            # Shopify adapter implementation
│   ├── quickbooks.ts         # QuickBooks adapter implementation
│   └── paypal.ts             # PayPal adapter implementation
├── package.json              # Adapter package config
└── tsconfig.json             # TypeScript config
```

**Key Files:**
- `src/base.ts` - `Adapter` interface, `NormalizedData` type
- `src/stripe.ts` - Stripe payment reconciliation adapter

## Documentation

### `docs/api.md`

Complete API reference with:
- Authentication methods
- All endpoints with request/response examples
- Error codes and formats
- Webhook event schemas

### `docs/adapters.md`

Adapter development guide:
- Built-in adapters documentation
- Creating custom adapters
- Normalized data format
- Best practices

### `docs/contributing.md`

Contribution guidelines:
- Development setup
- Coding standards
- PR process
- Testing requirements

### `docs/troubleshooting.md`

Common issues and solutions:
- Authentication problems
- Rate limiting
- Job execution issues
- Adapter connection problems

## Configuration Files

### Root Config Files

- **`package.json`** - Workspace configuration, shared scripts, dependencies
- **`tsconfig.json`** - TypeScript root config with path aliases
- **`turbo.json`** - Turborepo pipeline configuration
- **`.eslintrc.js`** - ESLint rules for all packages
- **`.prettierrc`** - Code formatting rules
- **`.lintstagedrc.js`** - Pre-commit hook configuration
- **`playwright.config.ts`** - E2E test configuration

### CI/CD

- **`.github/workflows/ci.yml`** - Lint, test, build on push/PR
- **`.github/workflows/deploy-preview.yml`** - Vercel preview deployments

## Testing

### Unit Tests

- Located in `packages/*/src/__tests__/`
- Jest configuration per package
- Run with `npm run test`

### E2E Tests

- Located in `tests/e2e/`
- Playwright tests
- Run with `npm run test:e2e`

## Build Outputs

- **`packages/*/dist/`** - Compiled TypeScript output
- **`packages/web/.next/`** - Next.js build output
- **`node_modules/`** - Dependencies (gitignored)

## Key Design Decisions

1. **Monorepo Structure** - All packages in one repo for easier development
2. **Workspaces** - npm workspaces for dependency management
3. **Turborepo** - Build system for efficient parallel builds
4. **TypeScript** - Full type safety across all packages
5. **Serverless-Ready** - API designed for edge/serverless deployment
6. **Adapter Pattern** - Pluggable adapters for extensibility
