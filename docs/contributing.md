# Contributing to Settler

Thank you for your interest in contributing to Settler! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/settler.git
   cd settler
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Locally

```bash
# Start all services
npm run dev

# Run specific package
cd packages/api && npm run dev
cd packages/web && npm run dev
```

### Testing

```bash
# Run all tests
npm run test

# Run tests for specific package
cd packages/api && npm test

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## Project Structure

```
settler/
├── packages/
│   ├── api/          # API server
│   ├── sdk/           # TypeScript SDK
│   ├── cli/           # CLI tool
│   ├── web/           # Next.js web UI
│   └── adapters/      # Platform adapters
├── docs/              # Documentation
├── tests/             # E2E tests
└── .github/           # GitHub Actions workflows
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable names
- Add JSDoc comments for public APIs

### Code Style

- Use Prettier for formatting (configured in `.prettierrc`)
- Use ESLint for linting (configured in `.eslintrc.js`)
- Run `npm run format` before committing

### Git Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new adapter for Square
fix: resolve rate limiting issue
docs: update API documentation
test: add tests for webhook validation
```

## Adding Features

### New Adapter

1. Create adapter class in `packages/adapters/src/`
2. Implement `Adapter` interface
3. Add tests
4. Update documentation
5. Submit PR

See [adapters.md](./adapters.md) for detailed guide.

### New API Endpoint

1. Add route handler in `packages/api/src/routes/`
2. Add validation schema (Zod)
3. Add tests
4. Update SDK client
5. Update API documentation

### New SDK Feature

1. Add client method in `packages/sdk/src/clients/`
2. Add TypeScript types
3. Add tests
4. Update SDK documentation

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** (if applicable)
5. **Create PR** with clear description

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] TypeScript types are correct
- [ ] No linting errors
- [ ] Commit messages follow conventional commits

## Reporting Issues

Use GitHub Issues to report bugs or request features.

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Node version:
- npm version:
- OS:

**Additional Context**
Any other relevant information
```

## Code Review

- Be respectful and constructive
- Focus on code, not the person
- Ask questions if something is unclear
- Suggest improvements when possible

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open a GitHub Discussion
- Join our Discord (coming soon)
- Email: dev@settler.io

Thank you for contributing! 🎉
