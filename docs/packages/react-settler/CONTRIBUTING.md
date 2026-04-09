# Contributing to React.Settler

Thank you for your interest in contributing to React.Settler! This document outlines the contribution guidelines and OSS boundary requirements.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## OSS Boundary Requirements

**CRITICAL:** React.Settler is an open-source package. The following restrictions apply:

### ✅ Allowed

- Import from `@settler/protocol` (OSS)
- Import from React and standard libraries
- Use public/demo API endpoints in examples
- Reference generic reconciliation concepts

### ❌ Forbidden

- Import from `@settler/api` or other proprietary packages
- Use internal Settler API endpoints
- Include API keys, secrets, or credentials
- Expose proprietary matching algorithms
- Hardcode internal URLs or endpoints

### Enforcement

All PRs are checked for:

- No proprietary imports
- No secrets or credentials
- No internal URLs
- OSS packages work standalone

## Development Setup

```bash
# Clone the repository
git clone https://github.com/settler/react-settler.git
cd react-settler

# Install dependencies
npm install

# Build packages
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## Making Changes

1. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow TypeScript best practices
   - Add tests for new features
   - Update documentation

3. **Test your changes**

   ```bash
   npm run test
   npm run lint
   npm run typecheck
   ```

4. **Commit your changes**

   ```bash
   git commit -m "feat: add your feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Process

1. **Checklist**
   - [ ] Code follows project style guidelines
   - [ ] Tests pass locally
   - [ ] Documentation updated
   - [ ] No OSS boundary violations
   - [ ] No secrets or credentials

2. **PR Description**
   - Describe the change
   - Link to related issues
   - Include examples if applicable

3. **Review Process**
   - Maintainers will review within 48 hours
   - Address feedback promptly
   - Be open to suggestions

## Adding New Components

When adding new components:

1. **Create component file**

   ```tsx
   // packages/react-settler/src/components/YourComponent.tsx
   ```

2. **Export from index**

   ```tsx
   // packages/react-settler/src/index.ts
   export { YourComponent } from "./components/YourComponent";
   ```

3. **Add types**

   ```tsx
   export type { YourComponentProps } from "./components/YourComponent";
   ```

4. **Update documentation**
   - Add to README.md
   - Create example if needed
   - Update PROTOCOL.md if adding new widget types

## Testing

- Write unit tests for components
- Test both UI and config modes
- Test compiler output
- Ensure no OSS boundary violations

## Documentation

- Update README.md for user-facing changes
- Update PROTOCOL.md for protocol changes
- Add examples for new features
- Keep inline comments clear and helpful

## Questions?

- Open an issue for questions
- Check existing documentation
- Ask in discussions

Thank you for contributing! 🎉
