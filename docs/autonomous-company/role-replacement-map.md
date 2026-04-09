# Autonomous Company Role Replacement Map

This document maps human startup roles to autonomous AI agents that replace them.

## Overview

Settler operates as a mostly self-running SaaS company through systematic role replacement with durable AI/automation systems. Each agent makes decisions, produces artifacts, detects problems early, and reduces cognitive load while compounding over time.

---

## 1. CEO / Strategy → Strategic Governor Agent

**Replaced Role**: CEO / Strategy  
**Agent**: `strategic-governor-agent`  
**Schedule**: Weekly (every Monday)

### What It Replaces

- Roadmap debates
- Priority thrash
- "What should we build next?" decisions

### What It Automates

- Continuous signal ingestion (usage, churn, errors, revenue)
- Constraint-aware prioritization
- Risk flags ("this feature is eating support time")

### Implementation

- Reads metrics tables (users, revenue, churn, errors, support)
- Compares against stated business goals
- Produces a ranked backlog with rationale
- Writes to `/docs/strategy/weekly-YYYY-MM-DD.md`

### Outputs

- `strategic_backlog` table with prioritized items
- Weekly strategy markdown document
- Business goal status report

### Artifacts

- Weekly strategy reports in `/docs/strategy/`
- Prioritized backlog items in database

---

## 2. CTO / Tech Lead → Architecture Sentinel Agent

**Replaced Role**: CTO / Tech Lead  
**Agent**: `architecture-sentinel-agent`  
**Schedule**: Daily

### What It Replaces

- Code reviews
- "Is this getting messy?" intuition
- Tech debt amnesia

### What It Automates

- Repo drift detection
- Dependency risk alerts
- Complexity creep warnings
- Performance regressions
- RLS policy violations

### Implementation

- Scans repo structure (via database patterns)
- Tracks file growth, dependency changes
- Flags patterns violating architecture rules
- Opens issues or PR comments automatically

### Outputs

- `architecture_violations` table
- Alerts for critical violations
- Performance regression warnings

### Artifacts

- Violation reports
- Architecture health metrics

---

## 3. Product Manager → User Intent Synthesizer Agent

**Replaced Role**: Product Manager  
**Agent**: `user-intent-synthesizer-agent`  
**Schedule**: Daily

### What It Replaces

- User interviews
- Feature request triage
- Guessing what users want

### What It Automates

- Behavior-based inference (what users actually do)
- Pain-point clustering from errors + drop-offs
- Feature demand scoring without surveys

### Implementation

- Reads receipt usage patterns
- Analyzes console abandonment points
- Examines error logs
- Outputs: "Users trying to do X but failing"
- Outputs: "Features already being misused as Y"

### Outputs

- `user_intent_insights` table
- Pain point analysis
- Feature demand scoring
- Drop-off point identification

### Artifacts

- User behavior insights
- Feature suggestion reports

---

## 4. Customer Support → Preemptive Support AI Agent

**Replaced Role**: Customer Support  
**Agent**: `preemptive-support-agent`  
**Schedule**: Real-time (on errors) + Daily batch

### What It Replaces

- Tickets
- FAQ upkeep
- Repetitive explanations

### What It Automates

- Predict confusion before users ask
- Inline explanations generated from real data
- Auto-responses tailored to context

### Implementation

- Monitors error frequency by user/org
- Detects repeated UI hesitation patterns
- Triggers in-app explanations
- "We noticed X—here's what's happening"
- Only escalates to human if confidence < threshold (0.7)

### Outputs

- `preemptive_support_actions` table
- In-app explanations
- Email guidance (for abandonment risk)

### Artifacts

- Support action logs
- User interaction tracking

---

## 5. Growth Marketer → Organic Growth Engine Agent

**Replaced Role**: Growth Marketer  
**Agent**: `organic-growth-agent`  
**Schedule**: Weekly

### What It Replaces

- SEO hustle
- Content calendar guilt
- Social posting grind

### What It Automates

- Programmatic content from live data
- SEO pages generated from actual use cases
- Shareable artifacts users already want

### Implementation

- Turns anonymized receipt insights into public pages
- Auto-creates changelogs, case studies, benchmarks
- Maintains sitemap + schema without manual edits

### Outputs

- `growth_content` table
- Blog posts, case studies, benchmarks
- SEO-optimized pages

### Artifacts

- Published content (after review)
- Content performance metrics

---

## 6. Finance / Ops → Autonomous CFO Lite Agent

**Replaced Role**: Finance / Ops  
**Agent**: `autonomous-cfo-agent`  
**Schedule**: Daily

### What It Replaces

- Revenue anxiety
- Cost surprises
- "Are we okay?" vibes

### What It Automates

- Runway tracking
- Cost anomaly detection
- Pricing pressure alerts

### Implementation

- Reads Stripe usage
- Tracks Supabase + Vercel costs
- Monitors active org counts
- Outputs: "You have X months runway at current growth"
- Outputs: "This feature costs more than it returns"
- Outputs: "Raise prices or cap usage here"

### Outputs

- `financial_insights` table
- Runway estimates
- Cost anomaly alerts
- Revenue forecasts

### Artifacts

- Financial reports
- Cost analysis

---

## 7. QA / Release Manager → Release Gatekeeper Agent

**Replaced Role**: QA / Release Manager  
**Agent**: `release-gatekeeper-agent`  
**Schedule**: On PR/commit events + Post-deploy

### What It Replaces

- Manual testing
- "Should we ship?" fear
- Post-deploy firefighting

### What It Automates

- Pre-merge safety checks
- Post-deploy smoke tests
- Automatic rollback signals

### Implementation

- Blocks deploys if error rate spikes
- Detects RLS violations
- Runs synthetic tests on key flows
- Auto-annotates releases with risk summary

### Outputs

- `release_safety_checks` table
- Deployment blocking decisions
- Rollback recommendations

### Artifacts

- Release safety reports
- Risk summaries

---

## Agent Orchestration

All agents are coordinated by the `agent-orchestrator` function which:

- Schedules agents based on their cadence
- Enforces max concurrent runs
- Implements kill switches
- Monitors agent health

## Guardrails & Safety

### Kill Switches

- Each agent can be disabled via orchestrator
- Kill switches checked before every run
- Critical agents have redundant checks

### Timeouts

- All agents have configurable timeouts
- Prevents runaway processes
- Default: 1-5 minutes depending on agent

### Confidence Thresholds

- Preemptive Support: Only auto-resolve if confidence >= 0.7
- Other agents: Use severity levels (low/medium/high/critical)

### Rollback Mechanisms

- Release Gatekeeper can block deployments
- Can recommend rollbacks automatically
- All actions are logged and reversible

---

## Remaining Human Decisions

While most roles are automated, humans still need to:

1. **Approve Strategic Backlog Items**: Review and approve prioritized items from Strategic Governor
2. **Review Architecture Violations**: Critical violations require human review before action
3. **Publish Growth Content**: Content is generated but requires human review before publishing
4. **Handle Escalated Support**: Preemptive Support escalates low-confidence cases to humans
5. **Make Financial Decisions**: CFO agent provides insights, but major financial decisions require human approval
6. **Override Release Blocks**: Release Gatekeeper can be overridden with human approval

---

## Verification & Compounding Value

### Weekly Metrics

- Agent run success rate
- Artifacts produced
- Issues detected vs. resolved
- Manual intervention required

### Compounding Indicators

- Decreasing manual effort over time
- Increasing agent confidence scores
- More accurate predictions
- Fewer false positives

### Success Criteria

- Each week the system produces new insight or leverage
- Manual effort trends toward zero
- The product improves even if the founder is absent

---

_Last updated: 2026-01-27_  
_Generated by: Autonomous Company System_
