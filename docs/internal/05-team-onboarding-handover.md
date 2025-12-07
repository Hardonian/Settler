# Internal/External Handover and Team Onboarding

**Complete onboarding guide: CONTRIBUTING.md, new engineer checklist, ownership matrix, and tribal knowledge documentation**

**Founder & CEO:** Scott Hardie  
Email: scottrmhardie@gmail.com  
LinkedIn: [linkedin.com/in/scottrmhardie](https://linkedin.com/in/scottrmhardie)

---

## Table of Contents

1. [CONTRIBUTING.md](#contributingmd)
2. [New Engineer Onboarding Checklist](#new-engineer-onboarding-checklist)
3. [Areas of Ownership](#areas-of-ownership)
4. [Tribal Knowledge Kill List](#tribal-knowledge-kill-list)

---

## CONTRIBUTING.md

### Contributing to Settler

Thank you for your interest in contributing to Settler! This guide will help you get started.

---

### Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Environment Setup](#development-environment-setup)
4. [Making Changes](#making-changes)
5. [Submitting Changes](#submitting-changes)
6. [Code Style](#code-style)
7. [Testing](#testing)
8. [Documentation](#documentation)
9. [Support](#support)

---

### Code of Conduct

Settler is committed to providing a welcoming and inclusive environment. All contributors are expected to:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

---

### Getting Started

**Before you start:**

1. Check existing issues and pull requests
2. Join our Discord: [discord.gg/settler](https://discord.gg/settler)
3. Read this contributing guide
4. Set up your development environment

**Good first issues:**

- Look for issues labeled `good-first-issue`
- Check our [GitHub Issues](https://github.com/settler/settler/issues)

---

### Development Environment Setup

#### Prerequisites

- **Node.js:** 18+ (check with `node --version`)
- **npm:** 9+ (check with `npm --version`)
- **PostgreSQL:** 14+ (or use Docker)
- **Redis:** 7+ (or use Docker)
- **Docker:** Optional but recommended
- **Git:** Latest version

#### Step 1: Clone Repository

```bash
git clone https://github.com/settler/settler.git
cd settler
```

#### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm run install:all
```

#### Step 3: Set Up Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# - REDIS_HOST, REDIS_PORT
# - JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY
```

#### Step 4: Start Infrastructure

```bash
# Using Docker Compose (recommended)
cd packages/api
docker-compose up -d

# Or start manually:
# - PostgreSQL on port 5432
# - Redis on port 6379
```

#### Step 5: Run Migrations

```bash
cd packages/api
npm run migrate

# Or manually:
psql -U postgres -d settler -f src/db/migrations/001-initial-schema.sql
```

#### Step 6: Start Development Server

```bash
# API server
cd packages/api
npm run dev

# Web UI (optional)
cd packages/web
npm run dev

# SDK (for testing)
cd packages/sdk
npm run build
```

**Verify setup:**

```bash
curl http://localhost:3000/health
# Should return: {"status":"healthy","database":"connected","redis":"connected"}
```

---

### Making Changes

#### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

**Examples:**

- `feature/add-paypal-adapter`
- `fix/webhook-retry-logic`
- `docs/update-api-docs`

#### Code Style

**TypeScript:**

- Use TypeScript strict mode
- Follow ESLint rules (run `npm run lint`)
- Use Prettier for formatting (run `npm run format`)

**Naming Conventions:**

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

**Example:**

```typescript
// Good
export class ReconciliationService {
  private readonly apiKey: string;

  async createJob(config: JobConfig): Promise<Job> {
    // ...
  }
}

// Bad
export class reconciliation_service {
  private readonly api_key: string;

  async create_job(config: job_config): Promise<job> {
    // ...
  }
}
```

#### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Examples:**

```
feat(api): add PayPal adapter

Add support for PayPal transactions reconciliation.
Includes adapter implementation and tests.

Closes #123
```

```
fix(webhooks): retry failed webhook deliveries

Fix issue where webhooks weren't retried after failure.
Add exponential backoff and max retry limit.

Fixes #456
```

---

### Submitting Changes

#### Step 1: Create Pull Request

1. **Push your branch:**

   ```bash
   git push origin feature/your-feature
   ```

2. **Create PR on GitHub:**
   - Go to [GitHub Pull Requests](https://github.com/settler/settler/pulls)
   - Click "New Pull Request"
   - Select your branch
   - Fill out PR template

#### Step 2: PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass (`npm test`)
- [ ] Documentation updated
- [ ] No linter errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] PR description explains changes
- [ ] Linked to related issues

#### Step 3: Review Process

1. **Automated checks:** CI runs tests, linting, type checking
2. **Code review:** At least one maintainer must approve
3. **Address feedback:** Make requested changes
4. **Merge:** Squash and merge (preferred) or merge commit

---

### Testing

#### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific package
cd packages/api
npm test
```

#### Writing Tests

**Unit Tests:**

```typescript
// __tests__/services/JobService.test.ts
import { JobService } from "../services/JobService";

describe("JobService", () => {
  it("should create a job", async () => {
    const service = new JobService();
    const job = await service.create({ name: "Test Job" });
    expect(job.name).toBe("Test Job");
  });
});
```

**Integration Tests:**

```typescript
// __tests__/integration/jobs.test.ts
import request from "supertest";
import app from "../../src/index";

describe("POST /api/v1/jobs", () => {
  it("should create a job", async () => {
    const response = await request(app)
      .post("/api/v1/jobs")
      .set("X-API-Key", "test-key")
      .send({ name: "Test Job" });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Test Job");
  });
});
```

**Test Coverage:**

- Aim for 80%+ coverage
- Critical paths should have 100% coverage
- Use `npm run test:coverage` to check

---

### Documentation

#### Code Documentation

**JSDoc comments:**

````typescript
/**
 * Creates a reconciliation job.
 *
 * @param config - Job configuration
 * @returns Created job
 * @throws {ValidationError} If config is invalid
 * @example
 * ```typescript
 * const job = await createJob({
 *   name: 'Shopify-Stripe',
 *   source: { adapter: 'shopify', config: {...} },
 *   target: { adapter: 'stripe', config: {...} }
 * });
 * ```
 */
export async function createJob(config: JobConfig): Promise<Job> {
  // ...
}
````

#### API Documentation

- Update `docs/api.md` for API changes
- Include request/response examples
- Document error codes

#### README Updates

- Update relevant README files
- Add examples if needed
- Update setup instructions if changed

---

### Support

**Questions?**

- **Discord:** [discord.gg/settler](https://discord.gg/settler)
- **GitHub Issues:** [github.com/settler/settler/issues](https://github.com/settler/settler/issues)
- **Email:** dev@settler.io

**Need Help?**

- Check [Documentation](./docs/)
- Search [GitHub Issues](https://github.com/settler/settler/issues)
- Ask in [Discord](https://discord.gg/settler)

---

## New Engineer Onboarding Checklist

### Week 1: Setup & Orientation

#### Day 1: Environment Setup

- [ ] **Access & Accounts**
  - [ ] GitHub access granted
  - [ ] Slack/Discord access
  - [ ] Email account set up
  - [ ] Calendar access
  - [ ] Password manager access

- [ ] **Development Environment**
  - [ ] Node.js 18+ installed
  - [ ] PostgreSQL 14+ installed (or Docker)
  - [ ] Redis 7+ installed (or Docker)
  - [ ] Git configured
  - [ ] IDE/Editor set up (VS Code recommended)
  - [ ] Repository cloned
  - [ ] Dependencies installed (`npm install`)
  - [ ] Environment variables configured
  - [ ] Database migrations run
  - [ ] Development server running (`npm run dev`)
  - [ ] Health check passes (`curl http://localhost:3000/health`)

- [ ] **Documentation Review**
  - [ ] README.md read
  - [ ] CONTRIBUTING.md read
  - [ ] Architecture docs reviewed
  - [ ] API docs reviewed

#### Day 2-3: Codebase Exploration

- [ ] **Codebase Tour**
  - [ ] Monorepo structure understood
  - [ ] Key packages identified (api, sdk, web, adapters)
  - [ ] Main entry points located
  - [ ] Database schema reviewed
  - [ ] API routes explored

- [ ] **First Contribution**
  - [ ] Small bug fix or documentation update
  - [ ] PR created and reviewed
  - [ ] PR merged

#### Day 4-5: Deep Dive

- [ ] **Core Functionality**
  - [ ] Reconciliation flow understood
  - [ ] Adapter system understood
  - [ ] Webhook system understood
  - [ ] Multi-tenancy understood

- [ ] **Testing**
  - [ ] Tests run successfully
  - [ ] Test structure understood
  - [ ] First test written

---

### Week 2: First Feature

#### Feature Assignment

- [ ] **Feature Assigned**
  - [ ] Feature requirements understood
  - [ ] Design/architecture discussed
  - [ ] Timeline agreed upon

- [ ] **Development**
  - [ ] Feature branch created
  - [ ] Code written
  - [ ] Tests written
  - [ ] Documentation updated

- [ ] **Review & Merge**
  - [ ] PR created
  - [ ] Code reviewed
  - [ ] Feedback addressed
  - [ ] PR merged

---

### Week 3-4: Integration & Ownership

#### Team Integration

- [ ] **Meetings**
  - [ ] Standup attended
  - [ ] Sprint planning attended
  - [ ] Retrospective attended

- [ ] **Communication**
  - [ ] Slack/Discord channels joined
  - [ ] On-call rotation understood
  - [ ] Escalation process understood

#### Ownership Areas

- [ ] **Assigned Ownership**
  - [ ] Primary ownership area assigned
  - [ ] Secondary ownership areas assigned
  - [ ] On-call responsibilities understood

- [ ] **Documentation**
  - [ ] Runbooks reviewed
  - [ ] Incident response process understood
  - [ ] Deployment process understood

---

### Month 2-3: Mastery

#### Advanced Topics

- [ ] **Architecture**
  - [ ] Event sourcing understood
  - [ ] CQRS patterns understood
  - [ ] Saga patterns understood

- [ ] **Operations**
  - [ ] Monitoring/alerting understood
  - [ ] Incident response participated
  - [ ] Deployment process followed

#### Mentorship

- [ ] **Mentor Assigned**
  - [ ] Regular 1:1s scheduled
  - [ ] Feedback received
  - [ ] Growth plan discussed

---

## Areas of Ownership

### Code Ownership Matrix

| Area               | Primary Owner | Secondary Owner | Escalation         |
| ------------------ | ------------- | --------------- | ------------------ |
| **API Server**     | [Name]        | [Name]          | Scott Hardie (CEO) |
| **SDK**            | [Name]        | [Name]          | Engineering Lead   |
| **Web UI**         | [Name]        | [Name]          | Engineering Lead   |
| **Adapters**       | [Name]        | [Name]          | Engineering Lead   |
| **Database**       | [Name]        | [Name]          | Scott Hardie (CEO) |
| **Infrastructure** | [Name]        | [Name]          | Scott Hardie (CEO) |
| **Security**       | [Name]        | [Name]          | Scott Hardie (CEO) |
| **Documentation**  | [Name]        | [Name]          | Product Lead       |

### Documentation Ownership

| Document              | Owner              | Last Updated | Review Frequency |
| --------------------- | ------------------ | ------------ | ---------------- | --------- |
| **README.md**         | Engineering Lead   | [Date]       | [Date]           | Quarterly |
| **CONTRIBUTING.md**   | Engineering Lead   | [Date]       | Quarterly        |
| **API Docs**          | API Team           | [Date]       | Monthly          |
| **Architecture Docs** | Scott Hardie (CEO) | [Date]       | Quarterly        |
| **Runbooks**          | SRE Team           | [Date]       | Monthly          |

### Support Contacts

| Type                      | Contact             | Response Time |
| ------------------------- | ------------------- | ------------- |
| **Technical Questions**   | dev@settler.io      | 24 hours      |
| **Security Issues**       | security@settler.io | 4 hours       |
| **Infrastructure Issues** | infra@settler.io    | 1 hour        |
| **On-Call**               | PagerDuty           | Immediate     |

---

## Tribal Knowledge Kill List

### What Must Be Documented

#### 1. Setup & Configuration

**Missing Docs:**

- [ ] **Environment Variables:** Complete list with descriptions
- [ ] **Database Setup:** Step-by-step setup guide
- [ ] **Redis Setup:** Configuration and troubleshooting
- [ ] **Local Development:** Common issues and solutions
- [ ] **Cloud Deployment:** Deployment runbook

**Action Items:**

- Create `.env.example` with all variables documented
- Create `docs/setup.md` with detailed setup instructions
- Create `docs/deployment.md` with deployment guide

---

#### 2. Architecture Decisions

**Missing Docs:**

- [ ] **Why Event Sourcing?** Decision rationale
- [ ] **Why CQRS?** Benefits and trade-offs
- [ ] **Why Multi-Tenancy?** Architecture choices
- [ ] **Why PostgreSQL?** Database selection rationale

**Action Items:**

- Create `docs/architecture-decisions.md` (ADR format)
- Document key architectural decisions
- Include alternatives considered

---

#### 3. Business Logic

**Missing Docs:**

- [ ] **Matching Algorithm:** How matching works
- [ ] **Confidence Scoring:** How confidence is calculated
- [ ] **Exception Handling:** How unmatched records are handled
- [ ] **Quota Enforcement:** How quotas are enforced

**Action Items:**

- Create `docs/reconciliation-algorithm.md`
- Document matching rules and logic
- Include examples and edge cases

---

#### 4. Operations & Troubleshooting

**Missing Docs:**

- [ ] **Common Issues:** Troubleshooting guide
- [ ] **Performance Tuning:** Optimization guide
- [ ] **Scaling:** How to scale the system
- [ ] **Disaster Recovery:** Recovery procedures

**Action Items:**

- Create `docs/troubleshooting.md`
- Document common issues and solutions
- Include performance tuning tips

---

#### 5. Sample Data & Scripts

**Missing:**

- [ ] **Sample Data:** Test data for development
- [ ] **Migration Scripts:** Data migration tools
- [ ] **Seed Scripts:** Database seeding scripts
- [ ] **Test Fixtures:** Reusable test data

**Action Items:**

- Create `scripts/sample-data.sql`
- Create `scripts/seed.ts`
- Create `tests/fixtures/` directory

---

#### 6. Videos & Recordings

**Missing:**

- [ ] **Setup Walkthrough:** Video of local setup
- [ ] **Architecture Overview:** Video explaining architecture
- [ ] **Demo:** Product demo video
- [ ] **Onboarding:** New engineer onboarding video

**Action Items:**

- Record setup walkthrough
- Create architecture overview video
- Record product demo
- Create onboarding video series

---

### Documentation Checklist

**Must-Have Documents:**

- [ ] **README.md** - Project overview, quick start
- [ ] **CONTRIBUTING.md** - How to contribute
- [ ] **docs/setup.md** - Detailed setup guide
- [ ] **docs/architecture.md** - Architecture overview
- [ ] **docs/api.md** - API documentation
- [ ] **docs/deployment.md** - Deployment guide
- [ ] **docs/troubleshooting.md** - Common issues
- [ ] **docs/runbooks/** - Operational runbooks
- [ ] **docs/architecture-decisions.md** - ADRs

**Nice-to-Have Documents:**

- [ ] **docs/performance.md** - Performance guide
- [ ] **docs/security.md** - Security practices
- [ ] **docs/testing.md** - Testing guide
- [ ] **docs/monitoring.md** - Monitoring guide

---

### Knowledge Transfer Process

#### When Someone Leaves

**Checklist:**

- [ ] **Documentation Review:** Ensure all knowledge is documented
- [ ] **Code Review:** Review code ownership
- [ ] **Handover Meeting:** 1-hour handover session
- [ ] **Access Revocation:** Revoke access after handover
- [ ] **Knowledge Base Update:** Update documentation

**Handover Template:**

```markdown
## Handover: [Name] - [Date]

### Areas of Ownership

- [Area 1]
- [Area 2]

### Key Knowledge

- [Knowledge point 1]
- [Knowledge point 2]

### Pending Work

- [Task 1]
- [Task 2]

### Contacts

- [Contact 1]
- [Contact 2]
```

---

## Next Steps & TO DOs

### Immediate Actions (This Week)

| Task                           | Owner            | Time Estimate | Priority |
| ------------------------------ | ---------------- | ------------- | -------- |
| Create CONTRIBUTING.md         | Engineering Lead | 2 hours       | P0       |
| Create onboarding checklist    | Engineering Lead | 1 hour        | P0       |
| Document environment variables | Engineering      | 1 hour        | P0       |
| Create setup guide             | Engineering      | 2 hours       | P1       |

### Short-Term (This Month)

| Task                              | Owner       | Time Estimate | Priority |
| --------------------------------- | ----------- | ------------- | -------- |
| Create architecture decisions doc | CTO         | 4 hours       | P1       |
| Record setup walkthrough video    | Engineering | 2 hours       | P1       |
| Create troubleshooting guide      | SRE         | 4 hours       | P1       |
| Document matching algorithm       | Engineering | 4 hours       | P2       |

### Long-Term (This Quarter)

| Task                           | Owner       | Time Estimate | Priority |
| ------------------------------ | ----------- | ------------- | -------- |
| Create comprehensive runbooks  | SRE         | 1 week        | P1       |
| Build sample data scripts      | Engineering | 2 days        | P2       |
| Create onboarding video series | Engineering | 1 week        | P2       |
| Document all tribal knowledge  | All         | Ongoing       | P2       |

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ Ready for Use
