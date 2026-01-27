# AGENTS.md

## 1. Build/Lint/Test Commands

### Core Package Scripts

**Build Commands:**
```bash
# Build all packages
npm run build

# Build specific package
cd packages/[package-name] && npm run build

# Clean build artifacts
npm run clean
```

**Lint Commands:**
```bash
# Lint all packages
npm run lint

# Lint specific package
cd packages/[package-name] && npm run lint

# Auto-fix lint issues
npm run lint:fix
```

**Type Checking:**
```bash
# Type check all packages
npm run typecheck

# Type check specific package
cd packages/[package-name] && npm run typecheck
```

**Testing Commands:**
```bash
# Run all tests
npm run test

# Run tests for specific package
cd packages/[package-name] && npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run a specific test file
npx jest [test-file-path]

# Run tests matching a pattern
npx jest --testNamePattern="pattern"

# Run a specific test suite
npx jest --testNamePattern="TestSuiteName"

# Run a single test by file path
npx jest packages/api/src/__tests__/route-inventory.test.ts
```

**Formatting Commands:**
```bash
# Check code formatting
npm run format:check

# Apply code formatting
npm run format
```

### Running a Single Test

To run a single test file:
```bash
# From root
npx jest packages/api/src/__tests__/route-inventory.test.ts

# From package directory
cd packages/api
npx jest src/__tests__/route-inventory.test.ts

# Run specific test suite within a file
npx jest src/__tests__/route-inventory.test.ts --testNamePattern="should have app instance"
```

## 2. Code Style Guidelines

### Import Organization
1. External libraries first (sorted alphabetically)
2. Internal modules second (sorted alphabetically)
3. Type-only imports use `import type { Type } from 'module'`
4. Use absolute imports when possible with path aliases
5. Group related imports with blank lines between groups

### File Naming Conventions
1. Use kebab-case for file names (e.g., `api-client.ts`, `user-service.ts`)
2. Use PascalCase for components and classes (e.g., `UserProfile.tsx`, `PaymentService.ts`)
3. Use descriptive names that clearly indicate purpose
4. Avoid cryptic abbreviations

### Code Formatting
1. Use 2-space indentation
2. Always use semicolons
3. Trailing commas in multi-line objects and arrays
4. Single quotes for strings unless containing single quotes
5. Maximum line length: 100 characters
6. Always use explicit types for function returns and parameters
7. Use `const` for variables that don't reassign
8. Use `readonly` for arrays and objects when appropriate

### Type Safety
1. Enable strict TypeScript options
2. Avoid `any` types except where explicitly needed
3. Use union types instead of enums where possible
4. Prefer `interface` over `type` for object shapes
5. Use `satisfies` operator for type narrowing
6. Always type function parameters and return values
7. Use `undefined` instead of `null` where possible

### Error Handling
1. Always handle promises with `.catch()` or `try/catch`
2. Create custom error classes that extend `Error`
3. Include context in error messages
4. Never ignore errors silently
5. Use structured error logging with context
6. Implement centralized error handling where appropriate
7. Use consistent error response formats

### Naming Conventions
1. Use camelCase for variables and functions
2. Use PascalCase for classes and interfaces
3. Use UPPER_CASE for constants
4. Use descriptive variable names (avoid abbreviations)
5. Use action verbs for functions (e.g., `getUser`, `calculateTotal`)
6. Use boolean prefixes for boolean variables (e.g., `isLoading`, `hasPermission`)
7. Use plural names for arrays and collections

### Documentation
1. Exported functions must have JSDoc comments
2. Complex logic must have explanatory comments
3. All public APIs must be documented
4. Include example usage in documentation
5. Document expected errors and edge cases
6. Keep documentation in sync with code changes

### Function Design
1. Functions should do one thing and do it well
2. Prefer pure functions without side effects
3. Use early returns to reduce nesting
4. Avoid functions longer than 50 lines
5. Limit function parameters to 3-4 where possible
6. Use named parameters object for complex APIs

### Module Design
1. Each file should have a single responsibility
2. Export only what's necessary
3. Use index.ts barrel files for public APIs
4. Avoid circular dependencies
5. Keep modules small and focused
6. Use dependency injection for testability

### Testing
1. Write unit tests for all business logic
2. Use descriptive test names that explain expected behavior
3. Test edge cases and error conditions
4. Mock external dependencies
5. Use test factories for complex test data
6. Include both positive and negative test cases

### API Design
1. Follow REST conventions
2. Use consistent response formats
3. Implement proper status codes
4. Include comprehensive API documentation
5. Version APIs appropriately
6. Handle authentication consistently
7. Implement proper rate limiting
8. Return appropriate error structures

### Security
1. Validate all input
2. Sanitize user input before processing
3. Implement proper authentication
4. Use secure headers
5. Implement input length limits
6. Avoid exposing internal details in error messages
7. Use environment-specific secrets
8. Implement proper CORS settings

### Performance
1. Minimize bundle size
2. Use efficient algorithms
3. Implement caching where appropriate
4. Optimize database queries
5. Use lazy loading for client-side code
6. Implement proper indexing in databases
7. Monitor and optimize hot paths
8. Use connection pooling for database connections

### Repository Hygiene
1. No dead code or commented-out code
2. No scratchpad files
3. No markdown files outside `/docs/`
4. No duplicate business documents
5. Clear commit messages with conventional commit format
6. Archive deprecated content in appropriate directories
7. Regular cleanup of unused branches and files
8. All builds must pass type checks, linting, and tests
9. No broken imports after restructuring
10. All documentation links must work

### Branch Management
1. Delete merged branches
2. Delete abandoned branches older than 90 days
3. Keep only active branches with real work-in-progress

## 3. Development Workflow

### Creating New Features
1. Create a feature branch from main
2. Implement changes with tests
3. Ensure all tests pass locally
4. Run linting and formatting checks
5. Create a pull request with clear description

### Code Reviews
1. Review all code changes
2. Check for security issues
3. Verify performance implications
4. Ensure code quality standards
5. Validate API design
6. Confirm test coverage

### Deployment
1. Ensure all checks pass
2. Verify environment variables
3. Run deployment scripts
4. Monitor post-deployment

## 4. Environment and Setup

### Prerequisites
- Node.js >= 24.0.0
- pnpm >= 10.0.0
- PostgreSQL (via Supabase)
- Redis (via Upstash, optional)

### Local Development
1. Clone repository
2. Install dependencies with `pnpm install`
3. Set up environment variables
4. Run database migrations
5. Start development server

### Database Setup
1. Configure database connection
2. Run migrations
3. Seed development data if needed
4. Verify connection with health checks

## 5. Monitoring and Debugging

### Health Checks
1. Run `npm run test` to verify all tests pass
2. Run `npm run lint` to check for linting issues
3. Run `npm run typecheck` to verify TypeScript
4. Check `/api/console/health` endpoint for runtime health

### Performance Monitoring
1. Check API response times
2. Monitor database query performance
3. Review error rates and patterns
4. Track resource utilization

## 6. Documentation Standards

### API Documentation
1. All public APIs must be documented
2. Include examples for all endpoints
3. Document error responses
4. Include rate limiting information
5. Provide authentication details

### Code Documentation
1. All exported functions must have JSDoc comments
2. Complex algorithms must be explained
3. Business logic must be documented
4. Configuration options must be documented
5. Environment variables must be documented

## 7. Security Practices

### Authentication
1. All API routes must be authenticated unless public
2. Implement proper session management
3. Use secure password hashing
4. Implement proper token expiration
5. Validate all authentication tokens

### Authorization
1. Implement role-based access control
2. Validate permissions for all operations
3. Implement proper tenant isolation
4. Use secure session tokens
5. Implement audit logging for sensitive operations

### Data Protection
1. Sanitize all user input
2. Encrypt sensitive data at rest
3. Implement proper data retention policies
4. Use secure communication protocols
5. Implement proper data backup procedures

## 8. Testing Best Practices

### Unit Tests
1. Test all business logic functions
2. Mock external dependencies
3. Test edge cases and error conditions
4. Use test factories for complex data

### Integration Tests
1. Test API endpoints
2. Verify database operations
3. Check authentication flows
4. Validate data integrity

### End-to-End Tests
1. Test critical user flows
2. Verify UI behavior
3. Check error handling
4. Validate performance under load

## 9. Performance Optimization

### Code Optimization
1. Minimize bundle size
2. Use efficient algorithms
3. Implement proper caching
4. Optimize database queries
5. Use lazy loading

### Database Optimization
1. Use proper indexing
2. Optimize complex queries
3. Implement connection pooling
4. Monitor query performance
5. Use query analysis tools

## 10. Error Handling

### Error Response Format
1. Consistent error structure
2. Include error codes
3. Provide helpful messages
4. Include request context
5. Log all errors appropriately

### Error Logging
1. Centralized error handling
2. Structured logging format
3. Include context information
4. Implement proper log levels
5. Monitor error rates and patterns