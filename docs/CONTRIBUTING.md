# Contributing to Settler

Thank you for your interest in contributing to Settler! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20+ and npm 10+
- PostgreSQL 15+ (or Supabase account)
- Redis (or Upstash account)
- Docker & Docker Compose (for local development)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/settler/settler.git
cd settler

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

### Test Structure

```typescript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

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
- [ ] Coverage maintained (70%+)
- [ ] Commit messages follow conventional format

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Architecture Guidelines

### Domain Layer (`domain/`)

- **Pure business logic**: No dependencies on frameworks
- **Entities**: Rich domain models with behavior
- **Value Objects**: Immutable objects representing domain concepts
- **Repository Interfaces**: Contracts for data access (ports)

### Application Layer (`application/`)

- **Orchestration**: Coordinates domain objects to fulfill use cases
- **Services**: Thin layer that delegates to domain
- **DTOs**: Data Transfer Objects for API boundaries

### Infrastructure Layer (`infrastructure/`)

- **Repositories**: Database implementations of repository interfaces
- **Security**: Password hashing, encryption, JWT handling
- **Observability**: Logging, tracing, metrics
- **Resilience**: Retry logic, circuit breakers

### Routes Layer (`routes/`)

- **Thin controllers**: Translate HTTP to application calls
- **Validation**: Use Zod schemas for input validation
- **Error handling**: Use `sendError()` from `api-response.ts`
- **No business logic**: Delegate to application services

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

- **Documentation**: Check [README.md](../README.md) and [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Email**: support@settler.io

## Code Review Process

1. **Automated checks**: CI runs lint, typecheck, and tests
2. **Review**: At least one maintainer reviews the PR
3. **Feedback**: Address review comments promptly
4. **Approval**: PR is merged after approval and CI passes

## Release Process

- **Versioning**: Follow [Semantic Versioning](https://semver.org/)
- **Changelog**: Update CHANGELOG.md with changes
- **Tags**: Create git tags for releases
- **Deployment**: Automated via CI/CD

Thank you for contributing to Settler! 🎉
