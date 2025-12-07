# Community & Open Source Contributor Guidelines

Welcome to the Settler community! 🎉 We're thrilled you're interested in contributing. This guide will help you understand our open source strategy, how to contribute, and what makes our community special.

---

## Our Open Source Philosophy

### What's Open Source?

**MIT Licensed (Free & Open):**

- ✅ **Core SDK** (`@settler/sdk`) — TypeScript SDK for integrating with Settler
- ✅ **Adapter SDK** (`@settler/adapter-sdk`) — Build your own adapters
- ✅ **Community Adapters** — Individual platform adapters
- ✅ **Documentation** — Full docs (CC BY 4.0)
- ✅ **Self-Hosted Core** — Core reconciliation engine (AGPL v3)

**Proprietary (Hosted Service):**

- 🔒 **Hosted Service** — Managed infrastructure, scaling, SLA
- 🔒 **Enterprise Features** — SSO, dedicated infrastructure, custom SLAs
- 🔒 **Advanced Analytics** — ML-powered insights, predictive alerts
- 🔒 **Compliance Certifications** — SOC 2, PCI-DSS (hosted only)

### Why This Model?

We believe in:

- **Developer Freedom** — Self-host if you want full control
- **Sustainable Business** — Hosted service funds development
- **Community Growth** — Open source enables contributions and adoption
- **Best of Both Worlds** — Open core + managed service

---

## How to Contribute

### 1. Code Contributions

**Types of Contributions:**

- 🐛 **Bug Fixes** — Fix issues, improve error handling
- ✨ **New Features** — Add functionality to SDK, API, or adapters
- 📚 **Documentation** — Improve docs, add examples, fix typos
- 🧪 **Tests** — Add test coverage, improve test quality
- 🎨 **UI/UX** — Improve web dashboard, playground, or CLI

**Getting Started:**

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/settler.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `npm test`
7. Submit a pull request

**Code Standards:**

- Use TypeScript for all new code
- Follow existing code style (Prettier + ESLint)
- Add JSDoc comments for public APIs
- Write tests for new features
- Follow [Conventional Commits](https://www.conventionalcommits.org/)

### 2. Adapter Contributions

**Building a New Adapter:**

Adapters are the heart of Settler. They connect Settler to external platforms (Stripe, Shopify, QuickBooks, etc.).

**Step 1: Create Adapter Class**

```typescript
// packages/adapters/src/your-platform.ts
import { Adapter, NormalizedData, FetchOptions } from "@settler/adapter-sdk";

export class YourPlatformAdapter implements Adapter {
  name = "your-platform";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    // Fetch data from your platform's API
    const response = await fetch(`https://api.your-platform.com/data`, {
      headers: { Authorization: `Bearer ${options.config.apiKey}` },
    });
    const data = await response.json();
    return data.map((item) => this.normalize(item));
  }

  normalize(rawData: any): NormalizedData {
    return {
      id: rawData.id,
      amount: rawData.amount,
      currency: rawData.currency,
      date: new Date(rawData.created_at),
      metadata: rawData.metadata,
    };
  }

  validate(data: NormalizedData): ValidationResult {
    // Validate normalized data
    if (!data.id || !data.amount) {
      return { valid: false, errors: ["Missing required fields"] };
    }
    return { valid: true };
  }
}
```

**Step 2: Register Adapter**

```typescript
// packages/adapters/src/index.ts
export { YourPlatformAdapter } from "./your-platform";
```

**Step 3: Add Tests**

```typescript
// packages/adapters/src/__tests__/your-platform.test.ts
import { YourPlatformAdapter } from "../your-platform";

describe("YourPlatformAdapter", () => {
  it("should fetch data", async () => {
    const adapter = new YourPlatformAdapter();
    const data = await adapter.fetch({ config: { apiKey: "test" } });
    expect(data).toBeDefined();
  });
});
```

**Step 4: Update Documentation**

Add your adapter to:

- `docs/adapters.md` — Adapter documentation
- `packages/adapters/README.md` — Adapter list

**Step 5: Submit PR**

Create a pull request with:

- Adapter implementation
- Tests
- Documentation
- Example usage

**Adapter Requirements:**

- ✅ Implement `Adapter` interface from `@settler/adapter-sdk`
- ✅ Normalize data to Settler's standard format
- ✅ Handle errors gracefully
- ✅ Include tests (80%+ coverage)
- ✅ Document configuration options
- ✅ Follow naming conventions (`platform-name`)

**Popular Adapters to Build:**

- WooCommerce
- BigCommerce
- Magento
- Salesforce
- HubSpot
- Zoho
- Sage
- Xero
- NetSuite
- SAP

### 3. Documentation Contributions

**Types of Documentation:**

- 📖 **API Documentation** — Endpoint descriptions, examples
- 🎓 **Tutorials** — Step-by-step guides, use cases
- 🔍 **Troubleshooting** — Common issues and solutions
- 📝 **Code Comments** — Inline documentation
- 🌐 **Website Content** — Blog posts, landing pages

**Documentation Standards:**

- Use clear, concise language
- Include code examples
- Add screenshots/GIFs where helpful
- Keep examples up-to-date
- Follow markdown best practices

**Where to Contribute:**

- `/docs` — Main documentation
- `/packages/*/README.md` — Package-specific docs
- `/website` — Website content (if applicable)

### 4. Bug Reports

**Before Reporting:**

1. Check existing issues (GitHub Issues)
2. Search documentation and FAQ
3. Try to reproduce the issue
4. Check if it's a known issue

**Bug Report Template:**

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

- Node version: 20.x
- npm version: 10.x
- OS: macOS/Windows/Linux
- Settler SDK version: 1.0.0

**Additional Context**

- Screenshots, logs, error messages
- Related issues or PRs
```

### 5. Feature Requests

**Before Requesting:**

1. Check roadmap and existing issues
2. Consider if it fits Settler's vision
3. Think about use cases and impact

**Feature Request Template:**

```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this feature needed? What problem does it solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other approaches you've considered

**Additional Context**

- Mockups, examples, references
- Related features or issues
```

---

## Development Workflow

### Setting Up Development Environment

**Prerequisites:**

- Node.js 20+
- npm 10+
- Git

**Setup:**

```bash
# Clone repository
git clone https://github.com/settler/settler.git
cd settler

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start development servers
npm run dev
```

### Project Structure

```
settler/
├── packages/
│   ├── api/              # API server (Express, TypeScript)
│   ├── sdk/              # TypeScript SDK (@settler/sdk)
│   ├── cli/              # CLI tool (@settler/cli)
│   ├── web/              # Next.js web UI
│   └── adapters/         # Platform adapters
├── docs/                 # Documentation
├── tests/                # E2E tests
├── .github/              # GitHub Actions workflows
└── marketing/            # Marketing assets
```

### Running Locally

**API Server:**

```bash
cd packages/api
npm run dev  # Runs on http://localhost:3000
```

**Web UI:**

```bash
cd packages/web
npm run dev  # Runs on http://localhost:3001
```

**SDK:**

```bash
cd packages/sdk
npm run build
npm test
```

### Testing

**Run All Tests:**

```bash
npm test
```

**Run Specific Tests:**

```bash
cd packages/api && npm test
cd packages/sdk && npm test
```

**E2E Tests:**

```bash
npm run test:e2e
```

**Test Coverage:**

```bash
npm run test:coverage
```

### Code Quality

**Linting:**

```bash
npm run lint
```

**Formatting:**

```bash
npm run format
```

**Type Checking:**

```bash
npm run typecheck
```

**Pre-commit Hooks:**
We use Husky and lint-staged to automatically:

- Run linter
- Format code
- Run tests
- Check types

---

## Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Add/update docs for new features
   - Update README if needed
   - Add code examples

2. **Add Tests**
   - Unit tests for new code
   - Integration tests for API changes
   - E2E tests for UI changes

3. **Ensure Quality**
   - All tests pass
   - No linting errors
   - Code is formatted
   - Types are correct

4. **Update CHANGELOG**
   - Add entry for new features/fixes
   - Follow [Keep a Changelog](https://keepachangelog.com/) format

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] TypeScript types are correct
- [ ] No linting errors
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] CHANGELOG updated (if applicable)
- [ ] Breaking changes documented

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

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG updated
```

### Review Process

1. **Automated Checks**
   - CI/CD runs tests, linting, type checking
   - Must pass before review

2. **Code Review**
   - At least one maintainer reviews
   - Address feedback promptly
   - Be respectful and constructive

3. **Merge**
   - Squash and merge (preferred)
   - Maintainer merges after approval

---

## Community Guidelines

### Code of Conduct

**Be Respectful:**

- Treat everyone with respect
- Be inclusive and welcoming
- Value diverse perspectives

**Be Constructive:**

- Provide helpful feedback
- Focus on code, not the person
- Ask questions if unclear

**Be Collaborative:**

- Help others learn and grow
- Share knowledge and resources
- Celebrate successes together

**Be Professional:**

- Use clear, professional language
- Follow project conventions
- Respect maintainers' time

### Communication Channels

**GitHub:**

- **Issues** — Bug reports, feature requests
- **Discussions** — Questions, ideas, general discussion
- **Pull Requests** — Code contributions

**Discord:**

- **General** — Community chat
- **Help** — Get help with integration
- **Showcase** — Share your projects

**Email:**

- **Support** — support@settler.io
- **Security** — security@settler.io
- **Partnerships** — partnerships@settler.io

### Getting Help

**Before Asking:**

1. Check documentation
2. Search existing issues
3. Try to debug yourself

**When Asking:**

1. Provide clear description
2. Include code examples
3. Share error messages/logs
4. Explain what you've tried

**Response Time:**

- **GitHub Issues:** Within 48 hours
- **Discord:** Community-driven (usually quick)
- **Email:** Within 24 hours (business days)

---

## Recognition & Rewards

### Contributor Recognition

**Hall of Fame:**

- Contributors listed in README
- Featured in blog posts
- Highlighted in release notes

**Badges:**

- GitHub contributor badge
- Community contributor badge
- Adapter author badge

**Swag:**

- Settler t-shirts
- Stickers
- Limited edition items

### Contributor Program

**Tiers:**

- 🌱 **Seed** — First contribution
- 🌿 **Sprout** — 5+ contributions
- 🌳 **Tree** — 20+ contributions
- 🌲 **Forest** — 50+ contributions

**Benefits:**

- Free hosted service credits
- Early access to features
- Direct line to maintainers
- Contributor-only events

### Adapter Marketplace

**Monetization:**

- Free adapters — MIT licensed, community-maintained
- Premium adapters — Paid adapters (revenue share)
- Enterprise adapters — Custom adapters (consulting)

**Revenue Share:**

- 70% to adapter author
- 30% to Settler (hosting, support)

---

## Security

### Reporting Security Issues

**DO NOT** create a public GitHub issue for security vulnerabilities.

**Instead:**

1. Email security@settler.io
2. Include detailed description
3. Provide steps to reproduce
4. Wait for response before disclosure

**Response Time:**

- Initial response: Within 24 hours
- Fix timeline: Depends on severity
- Disclosure: After fix is deployed

### Security Best Practices

**For Contributors:**

- Never commit secrets/API keys
- Use environment variables
- Follow secure coding practices
- Review dependencies for vulnerabilities

**For Maintainers:**

- Regular security audits
- Dependency updates
- Penetration testing
- Bug bounty program (planned)

---

## Licensing

### Contributor License Agreement

By contributing, you agree that:

- Your contributions will be licensed under the same license as the project
- You have the right to contribute the code
- Your contributions are your original work (or you have permission)

**Licenses:**

- **Core SDK & Adapters:** MIT License
- **Self-Hosted Core:** AGPL v3
- **Documentation:** CC BY 4.0

### Third-Party Code

**Before Using:**

- Check license compatibility
- Get approval from maintainers
- Attribute properly
- Follow license terms

---

## Roadmap & Priorities

### Current Priorities

1. **Core Features**
   - Advanced matching rules
   - Multi-currency support
   - Scheduled jobs
   - Webhook improvements

2. **Adapters**
   - WooCommerce
   - BigCommerce
   - Salesforce
   - HubSpot

3. **Developer Experience**
   - Better error messages
   - Improved playground
   - More examples
   - Better documentation

### How to Influence Roadmap

**Ways to Contribute:**

- Submit feature requests (GitHub Issues)
- Vote on existing requests (👍 reactions)
- Participate in discussions (GitHub Discussions)
- Build adapters (most needed)
- Improve documentation (always welcome)

**Roadmap Process:**

1. Community submits ideas
2. Maintainers review and prioritize
3. Roadmap updated quarterly
4. Contributors assigned (volunteer or maintainer)

---

## FAQ

### Can I use Settler commercially?

**Yes!** Settler is MIT licensed. Use it however you want:

- Commercial projects ✅
- Personal projects ✅
- Enterprise deployments ✅
- Self-hosted ✅

### Do I need to contribute to use Settler?

**No!** Contributions are optional but appreciated. Use Settler freely, and contribute if you want to help improve it.

### How do I become a maintainer?

**Path to Maintainer:**

1. Make consistent, high-quality contributions
2. Help review PRs and answer questions
3. Show commitment to the project
4. Get invited by existing maintainers

### Can I build a paid adapter?

**Yes!** We're building an adapter marketplace. You can:

- Build free adapters (MIT licensed)
- Build premium adapters (revenue share)
- Build enterprise adapters (consulting)

### How do I get help?

**Ways to Get Help:**

- Check documentation first
- Search GitHub Issues
- Ask in Discord
- Email support@settler.io

### What if my PR is rejected?

**Don't Take It Personally:**

- Maintainers provide feedback
- Address concerns and resubmit
- Ask questions if unclear
- Learn and improve

---

## Resources

**Documentation:**

- [API Documentation](./docs/api.md)
- [Adapter Guide](./docs/adapters.md)
- [Contributing Guide](./docs/contributing.md)
- [Troubleshooting](./docs/troubleshooting.md)

**Community:**

- [GitHub](https://github.com/settler/settler)
- [Discord](https://discord.gg/settler)
- [Twitter](https://twitter.com/settler_io)
- [Website](https://settler.io)

**Support:**

- support@settler.io
- security@settler.io
- partnerships@settler.io

---

## Thank You! 🙏

Thank you for contributing to Settler! Your contributions make Settler better for everyone. Whether you're fixing bugs, building adapters, improving docs, or helping others, we appreciate you.

**Let's build something amazing together!** 🚀

---

**Last Updated:** 2026  
**Maintained By:** Settler Community & Maintainers
