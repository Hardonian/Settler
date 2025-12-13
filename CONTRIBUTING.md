# Contributing to Settler

Thank you for contributing to Settler! This guide will help you get started.

## Developer Console

When contributing to Console features:
- ✅ Use unified auth (`lib/api/unified-auth.ts`)
- ✅ Support both session and API key auth
- ✅ Never return 500 - use graceful degradation
- ✅ Log activities using `logActivity()`
- ✅ Update shared types in `shared/types/console.ts`
- ✅ Test with SDK, CLI, and Console UI

See [Console Complete Guide](docs/CONSOLE_COMPLETE.md) for details.

Thank you for your interest in contributing to Settler! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20.19.6+ (see `.nvmrc`)
- npm 10.0.0+
- PostgreSQL 15+ (or Supabase account)
- Redis (or Upstash account)
- Docker & Docker Compose (for local development)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/shardie-github/Settler-API.git
cd Settler-API

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API keys

# Start services (PostgreSQL, Redis)
docker-compose up -d

# Run database migrations
cd packages/api
npm run migrate

# Start development server
npm run dev
```

## Code Style

### TypeScript

- **Strict mode**: Always enabled. No `any` types (use `unknown` if needed)
- **Naming**: Use descriptive names. Prefer `getUserById` over `getUser`
- **Imports**: Use absolute imports when possible: `import { Job } from '@settler/api/domain'`
- **Exports**: Prefer named exports over default exports

### Formatting

- **Prettier**: Auto-formats on save (configured in `.prettierrc`)
- **Line length**: 100 characters
- **Indentation**: 2 spaces
- **Semicolons**: Required

### Linting

- **ESLint**: Runs on save and in CI
- **Rules**: TypeScript ESLint with strict rules
- **Fix**: Run `npm run lint:fix` to auto-fix issues

### Code Organization

- **Layers**: Follow hexagonal architecture (domain → application → infrastructure → routes)
- **Single Responsibility**: Each function/class should do one thing
- **DRY**: Don't repeat yourself. Extract common logic to utilities
- **Comments**: Add JSDoc comments for public APIs

## Testing

### Writing Tests

- **Coverage**: Maintain 70%+ coverage minimum
- **Unit tests**: Test domain logic and utilities in isolation
- **Integration tests**: Test API endpoints with Supertest
- **E2E tests**: Test full workflows with Playwright

### Running Tests

```bash
# All tests
npm run test

# Unit tests only
cd packages/api && npm run test

# Integration tests
cd packages/api && npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
cd packages/api && npm run test:coverage
```

## Pull Request Process

### Before Submitting

1. **Create feature branch**: `git checkout -b feature/your-feature-name`
2. **Make changes**: Write code, add tests, update docs
3. **Run checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run format:check
   ```
4. **Commit changes**: Use conventional commit format (see below)

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes
- `perf`: Performance improvements
- `style`: Code style changes (formatting)

**Examples:**

```
feat(api): add webhook retry mechanism
fix(auth): handle expired refresh tokens
docs(readme): add troubleshooting section
refactor(repos): extract job repository interface
```

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated (README, JSDoc, etc.)
- [ ] No linter errors (`npm run lint`)
- [ ] No type errors (`npm run typecheck`)
- [ ] Code formatted (`npm run format:check`)
- [ ] Coverage maintained (70%+)
- [ ] Commit messages follow conventional format

## Security Guidelines

- **Never commit secrets**: Use environment variables
- **Input validation**: Validate all inputs with Zod
- **SQL injection**: Always use parameterized queries
- **XSS prevention**: Sanitize output data
- **Rate limiting**: Apply rate limits to public endpoints
- **Authentication**: Protect all routes except health/metrics

## Documentation

### Code Documentation

- **JSDoc**: Add JSDoc comments for all public APIs
- **Examples**: Include usage examples in JSDoc
- **Types**: Document complex types and interfaces

### README Updates

- Update README if adding new features
- Add troubleshooting tips for common issues
- Update environment variable documentation

## Getting Help

- **Documentation**: Check [README.md](./README.md) and [docs/README.md](./docs/README.md)
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Email**: support@settler.dev

## Code Review Process

1. **Automated checks**: CI runs lint, typecheck, format check, and tests
2. **Review**: At least one maintainer reviews the PR
3. **Feedback**: Address review comments promptly
4. **Approval**: PR is merged after approval and CI passes

Thank you for contributing to Settler! 🎉
