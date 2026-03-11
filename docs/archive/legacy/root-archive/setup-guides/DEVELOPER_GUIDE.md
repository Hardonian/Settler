# Developer Guide

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis (optional, for caching)

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start database
docker-compose up -d

# Run migrations
npm run migrate

# Start development server
npm run dev
```

## Code Style

### TypeScript
- Use strict mode (enforced)
- No `any` types (use `unknown` with type guards)
- Explicit return types for public APIs
- Use discriminated unions for state

### Error Handling
```typescript
// ✅ Good
try {
  await operation();
} catch (error: unknown) {
  handleRouteError(res, error, "Operation failed", 500);
}

// ❌ Bad
try {
  await operation();
} catch (error: any) {
  res.status(500).json({ error: error.message });
}
```

### Database Queries
```typescript
// ✅ Good
interface UserRow {
  id: string;
  email: string;
  name: string | null;
}
const users = await query<UserRow>("SELECT id, email, name FROM users");

// ❌ Bad
const users = await query<any>("SELECT * FROM users");
```

## Adding New Features

### 1. Define Domain Model
Create entity in `packages/api/src/domain/entities/`

### 2. Create Application Service
Add service in `packages/api/src/application/services/`

### 3. Add Route Handler
Create route in `packages/api/src/routes/`

### 4. Add Validation Schema
Use Zod for input validation

### 5. Write Tests
Add unit and integration tests

## Common Tasks

### Adding a New Endpoint

1. Create Zod validation schema
2. Add route handler with middleware
3. Use `handleRouteError` for error handling
4. Add tests

### Adding a New Adapter

1. Implement adapter interface in `packages/adapters/src/`
2. Add webhook normalization
3. Add signature verification
4. Update adapter registry

### Adding a New Error Type

1. Extend `ApiError` in `packages/api/src/utils/typed-errors.ts`
2. Use in application services
3. Update error middleware if needed

## Best Practices

1. **Type Safety**: Always use proper types, never `any`
2. **Error Handling**: Use typed errors, not generic Error
3. **Validation**: Validate all inputs with Zod
4. **Logging**: Use structured logging with context
5. **Testing**: Write tests for critical paths
6. **Documentation**: Add JSDoc for public APIs

## Troubleshooting

### Type Errors
- Check `tsconfig.json` strict settings
- Use type guards for `unknown` types
- Ensure all imports are typed

### Build Errors
- Run `npm run typecheck` to see all errors
- Fix `any` types first
- Check for missing type assertions

### Runtime Errors
- Check error logs for context
- Verify input validation
- Check database connection
