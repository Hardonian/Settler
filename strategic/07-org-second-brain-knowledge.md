# Org "Second Brain," Learning, Knowledge Network

## Settler Strategic Framework 2026-2031

**Version:** 1.0  
**Date:** 2026  
**Status:** Strategic Planning Document

---

## Executive Summary

This document proposes systems and playbooks for Settler to never lose internal learning. We design a "second brain" that captures decisions, knowledge, and patterns, ensuring institutional knowledge persists even as the team grows and changes.

**Key Principles:**

- **Living Decision Logs:** Every decision is documented with context, rationale, and outcomes
- **Fork-Friendly Documentation:** Knowledge is version-controlled, forkable, and remixable
- **Adversarial & Canonical Records:** Capture both "how we ship" and "how we react/learn"
- **AI-Driven Knowledge Base:** LLM-powered assistant for internal knowledge discovery

---

## Knowledge Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Settler Knowledge Network                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Decision     │  │ Learning     │  │ Pattern      │     │
│  │ Logs         │  │ Records      │  │ Library      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │               │
│  ┌──────▼─────────────────▼─────────────────▼───────┐     │
│  │         Knowledge Graph (Vector Database)          │     │
│  │  - Semantic search                                  │     │
│  │  - Relationship mapping                             │     │
│  │  - Pattern discovery                                │     │
│  └──────┬─────────────────┬─────────────────┬───────┘     │
│         │                 │                 │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
│  │ AI Knowledge │  │ Onboarding    │  │ Continuous    │     │
│  │ Assistant    │  │ Automation    │  │ Learning      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component 1: Living Decision Logs

### Concept

Every significant decision is documented with:

- **Context:** What was the situation?
- **Decision:** What did we decide?
- **Rationale:** Why did we decide this?
- **Alternatives:** What other options did we consider?
- **Outcomes:** What happened? (updated over time)
- **Lessons Learned:** What would we do differently?

### Format

```markdown
# Decision: [Title]

**Date:** 2026-01-15
**Decision Makers:** [Names]
**Status:** [Proposed | Accepted | Rejected | Superseded]

## Context

[What was the situation? What problem were we solving?]

## Decision

[What did we decide? Be specific and actionable.]

## Rationale

[Why did we decide this? What evidence/data supported this decision?]

## Alternatives Considered

1. [Alternative 1] - [Why we didn't choose this]
2. [Alternative 2] - [Why we didn't choose this]

## Expected Outcomes

[What did we expect to happen?]

## Actual Outcomes (Updated Over Time)

- 2026-01-20: [What actually happened?]
- 2026-02-15: [Updated outcomes]
- 2026-03-15: [Final outcomes]

## Lessons Learned

[What would we do differently? What worked well?]

## Related Decisions

- [Link to related decisions]
```

### Example

```markdown
# Decision: Use Vercel for API Hosting

**Date:** 2026-01-15
**Decision Makers:** CTO, Engineering Lead
**Status:** Accepted

## Context

We need to host our API serverlessly. Options: Vercel, AWS Lambda, Cloudflare Workers.

## Decision

Use Vercel Functions for API hosting.

## Rationale

- Developer experience (fastest deployment, best DX)
- Cost-effective for our scale (pay-as-you-go)
- Edge network (low latency globally)
- TypeScript-first (matches our stack)

## Alternatives Considered

1. AWS Lambda - More complex setup, slower deployment
2. Cloudflare Workers - Limited runtime support, smaller ecosystem

## Expected Outcomes

- Fast deployment (<1 minute)
- Low latency (edge network)
- Cost-effective (<$100/month for our scale)

## Actual Outcomes

- 2026-01-20: Deployment is fast (<30 seconds), latency is low (p95 <50ms)
- 2026-02-15: Cost is $80/month (within budget)
- 2026-03-15: No issues, decision validated

## Lessons Learned

- Vercel's developer experience is excellent (faster than AWS Lambda)
- Edge network provides low latency globally
- Cost is predictable and within budget

## Related Decisions

- [Decision: Use TypeScript for API]
- [Decision: Use PostgreSQL for Database]
```

### Implementation

**Tools:**

- **GitHub Discussions:** For decision proposals and discussions
- **Markdown Files:** For decision logs (version-controlled)
- **AI Assistant:** For decision log generation (from meeting notes)

**Process:**

1. **Proposal:** Decision proposed in GitHub Discussion
2. **Discussion:** Team discusses, provides feedback
3. **Decision:** Decision made, logged in markdown file
4. **Update:** Outcomes updated over time (quarterly reviews)

**Success Metrics:**

- 100% of significant decisions documented
- Decision logs updated quarterly (outcomes, lessons learned)
- Decision logs referenced in future decisions (avoid repeating mistakes)

---

## Component 2: Fork-Friendly Documentation

### Concept

All documentation is:

- **Version-Controlled:** Git-based (GitHub, GitLab)
- **Forkable:** Anyone can fork and remix
- **Remixable:** Documentation can be combined, modified, extended
- **Living:** Continuously updated (not static)

### Documentation Structure

```
/docs
  /decisions          # Decision logs
  /architecture       # System architecture docs
  /playbooks          # Operational playbooks
  /onboarding         # Onboarding guides
  /runbooks           # Incident response runbooks
  /patterns           # Design patterns, best practices
  /lessons-learned    # Post-mortems, retrospectives
```

### Documentation Standards

**Format:**

- Markdown (`.md` files)
- Version-controlled (Git)
- Linkable (internal links between docs)
- Searchable (semantic search via AI)

**Content:**

- **Context:** Why does this exist?
- **How:** Step-by-step instructions
- **Why:** Rationale, trade-offs
- **Examples:** Code examples, use cases
- **Related:** Links to related docs

### Example: Architecture Documentation

```markdown
# API Architecture

## Context

Our API is the core of Settler. It handles reconciliation jobs, reports, and webhooks.

## Architecture
```

┌──────────────┐
│ API Gateway │
└──────┬───────┘
│
┌──────▼───────┐
│ API Server │
└──────┬───────┘
│
┌──────▼───────┐
│ Database │
└──────────────┘

```

## Components

### API Gateway
- **Purpose:** Authentication, rate limiting, routing
- **Technology:** Cloudflare Workers
- **Why:** Edge network, low latency

### API Server
- **Purpose:** Business logic, reconciliation engine
- **Technology:** Vercel Functions (Node.js, TypeScript)
- **Why:** Serverless, scalable, TypeScript-first

### Database
- **Purpose:** Store jobs, reports, users
- **Technology:** PostgreSQL (Supabase)
- **Why:** Relational data, ACID transactions

## Related
- [Decision: Use Vercel for API Hosting](./decisions/vercel-api-hosting.md)
- [API Documentation](./api.md)
```

### Implementation

**Tools:**

- **GitHub:** Version control, collaboration
- **AI Assistant:** Documentation generation (from code, meetings)
- **Semantic Search:** Vector database (Pinecone, Weaviate) for knowledge discovery

**Process:**

1. **Documentation as Code:** Documentation in same repo as code
2. **Continuous Updates:** Documentation updated with code changes
3. **AI Generation:** AI generates docs from code, meetings, decisions
4. **Community Contributions:** External contributors can fork and improve docs

**Success Metrics:**

- 100% of systems documented
- Documentation updated within 1 week of code changes
- Documentation referenced in onboarding (new hires find answers quickly)

---

## Component 3: Adversarial & Canonical Records

### Concept

Capture both:

- **Canonical Records:** "How we ship" (standard processes, best practices)
- **Adversarial Records:** "How we react/learn" (incidents, failures, lessons learned)

### Canonical Records: "How We Ship"

**Purpose:** Document standard processes, best practices, patterns.

**Examples:**

- How we deploy (CI/CD pipeline, deployment process)
- How we code review (review process, standards)
- How we test (testing strategy, test coverage)
- How we design (design system, UI patterns)

**Format:**

```markdown
# How We [Process]

## Standard Process

[Step-by-step process]

## Best Practices

[What works well?]

## Anti-Patterns

[What to avoid?]

## Examples

[Real examples from codebase]

## Related

[Links to related processes]
```

### Adversarial Records: "How We React/Learn"

**Purpose:** Document incidents, failures, lessons learned.

**Examples:**

- Post-mortems (incident analysis, root cause, prevention)
- Retrospectives (what went well, what didn't, improvements)
- Failure modes (common failures, how to prevent)

**Format:**

```markdown
# Incident: [Title]

**Date:** 2026-01-15
**Severity:** [Low | Medium | High | Critical]
**Duration:** [How long did it last?]
**Impact:** [How many customers affected?]

## Timeline

[Chronological timeline of events]

## Root Cause

[What caused the incident?]

## Resolution

[How was it resolved?]

## Prevention

[How do we prevent this in the future?]

## Lessons Learned

[What did we learn?]

## Related

[Links to related incidents, decisions]
```

### Implementation

**Tools:**

- **GitHub Issues:** For incident tracking
- **Post-Mortem Templates:** Standardized format
- **Retrospective Templates:** Standardized format
- **AI Assistant:** Generate post-mortems from incident logs

**Process:**

1. **Incident Occurs:** Documented in GitHub Issue
2. **Post-Mortem:** Written within 1 week (standardized template)
3. **Lessons Learned:** Incorporated into processes, documentation
4. **Prevention:** Changes made to prevent recurrence

**Success Metrics:**

- 100% of incidents have post-mortems
- Post-mortems written within 1 week
- Prevention measures implemented within 1 month

---

## Component 4: AI-Driven Knowledge Base Assistant

### Concept

LLM-powered assistant that helps team members discover knowledge, answer questions, and learn from past decisions and incidents.

### Capabilities

1. **Knowledge Discovery:**
   - "How do we deploy to production?"
   - "What was the decision on using Vercel?"
   - "What incidents have we had with Stripe adapter?"

2. **Question Answering:**
   - "Why did we choose PostgreSQL over MongoDB?"
   - "What's our process for handling security incidents?"
   - "How do I add a new adapter?"

3. **Pattern Recognition:**
   - "What patterns do we see in failed deployments?"
   - "What decisions have led to the best outcomes?"
   - "What incidents have similar root causes?"

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         AI Knowledge Base Assistant                          │
│                                                              │
│  [User Query] → [Semantic Search] → [Knowledge Graph]      │
│         ↓              ↓                    ↓                │
│  Vector Database    LLM (Claude/GPT-4)   Context Retrieval │
│         ↓              ↓                    ↓                │
│  [Relevant Docs] → [Answer Generation] → [Response]         │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

**Phase 1: Foundation (Q2 2026)**

- Set up vector database (Pinecone, Weaviate)
- Index all documentation (decisions, playbooks, runbooks)
- Build semantic search (embedding-based)

**Phase 2: AI Assistant (Q3 2026)**

- Integrate LLM (Claude, GPT-4)
- Build question-answering pipeline
- Create Slack bot (internal knowledge assistant)

**Phase 3: Advanced Features (Q4 2026)**

- Pattern recognition (identify patterns in decisions, incidents)
- Proactive suggestions ("Based on past decisions, you might want to consider...")
- Learning recommendations ("You might find this decision log helpful...")

### Success Metrics

- 80%+ of questions answered correctly
- 50%+ reduction in time to find information
- 30%+ of team members use AI assistant weekly

---

## Component 5: Internal Onboarding Automation

### Concept

Automate onboarding process using AI and knowledge base, ensuring new hires get up to speed quickly.

### Onboarding Flow

**Day 1: Welcome**

- [ ] Welcome email (with links to onboarding docs)
- [ ] Access to systems (GitHub, Slack, tools)
- [ ] Onboarding checklist (automated)

**Week 1: Foundation**

- [ ] Read core documentation (decisions, architecture)
- [ ] Set up development environment (automated scripts)
- [ ] First code contribution (guided by AI assistant)

**Month 1: Deep Dive**

- [ ] Team introductions (automated scheduling)
- [ ] Shadow experienced team members
- [ ] Contribute to real projects (guided by mentors)

### AI-Powered Onboarding

**Personalized Learning Path:**

- AI analyzes new hire's role, background
- Generates personalized learning path
- Recommends relevant documentation, decisions, incidents

**Automated Checklists:**

- Onboarding checklist (automated, tracked)
- Progress tracking (what's done, what's remaining)
- Reminders (automated notifications)

**Knowledge Discovery:**

- AI assistant answers onboarding questions
- Recommends relevant documentation
- Connects new hires with experts (based on questions)

### Implementation

**Phase 1: Foundation (Q2 2026)**

- Create onboarding documentation (comprehensive guides)
- Build onboarding checklist (automated tracking)
- Set up AI assistant (for onboarding questions)

**Phase 2: Automation (Q3 2026)**

- Automated onboarding emails
- Personalized learning paths (AI-generated)
- Progress tracking (dashboard)

**Phase 3: Advanced (Q4 2026)**

- AI-powered mentor matching
- Automated team introductions
- Onboarding analytics (time to productivity)

### Success Metrics

- 50%+ reduction in time to productivity (new hires)
- 90%+ onboarding checklist completion rate
- 4.5+ out of 5 onboarding satisfaction score

---

## Knowledge Network Success Metrics

**By End of 2026:**

- 100+ decision logs documented
- 50+ post-mortems written
- AI knowledge assistant operational
- Onboarding automation in place

**By End of 2027:**

- 500+ decision logs documented
- 200+ post-mortems written
- AI knowledge assistant used by 80%+ of team
- Onboarding time reduced by 50%+

---

## Risk Mitigation

**Risk:** Knowledge not captured (decisions, incidents not documented)
**Mitigation:** Automated capture (AI generates docs from meetings, incidents), mandatory templates

**Risk:** Knowledge not discoverable (docs exist but hard to find)
**Mitigation:** Semantic search (vector database), AI assistant (natural language queries)

**Risk:** Knowledge becomes stale (docs not updated)
**Mitigation:** Continuous updates (docs updated with code changes), quarterly reviews

---

**Document Owner:** Engineering & People Ops  
**Review Cycle:** Quarterly  
**Next Review:** Q2 2026
