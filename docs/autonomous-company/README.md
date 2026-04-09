# Autonomous Company System

Settler operates as a **mostly self-running SaaS company** through systematic role replacement with durable AI/automation systems.

## Philosophy

> "Stop thinking of AI as 'features' and start thinking of it as governance. Every agent should answer one question: What decision would a human have to make here—and can I codify it? If yes → automate it permanently."

## Quick Start

1. **Deploy Database Schema**

   ```bash
   supabase db push
   ```

2. **Deploy Edge Functions**

   ```bash
   supabase functions deploy strategic-governor-agent
   supabase functions deploy architecture-sentinel-agent
   supabase functions deploy user-intent-synthesizer-agent
   supabase functions deploy preemptive-support-agent
   supabase functions deploy organic-growth-agent
   supabase functions deploy autonomous-cfo-agent
   supabase functions deploy release-gatekeeper-agent
   supabase functions deploy agent-orchestrator
   ```

3. **Set Up Cron Jobs** (see [Setup Guide](./setup-guide.md))

4. **Monitor Agents**
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/agent-orchestrator \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"action": "status"}'
   ```

## Agent Overview

| Agent                       | Role Replaced    | Schedule          | Purpose                            |
| --------------------------- | ---------------- | ----------------- | ---------------------------------- |
| **Strategic Governor**      | CEO/Strategy     | Weekly            | Prioritized backlog from metrics   |
| **Architecture Sentinel**   | CTO/Tech Lead    | Daily             | Code quality & tech debt detection |
| **User Intent Synthesizer** | Product Manager  | Daily             | Behavior analysis & feature demand |
| **Preemptive Support**      | Customer Support | Real-time + Daily | Proactive issue resolution         |
| **Organic Growth**          | Growth Marketer  | Weekly            | Content generation from usage      |
| **Autonomous CFO**          | Finance/Ops      | Daily             | Runway tracking & cost analysis    |
| **Release Gatekeeper**      | QA/Release       | On PR/Deploy      | Automated safety checks            |

## Key Features

### ✅ Decision Automation

- Strategic prioritization based on metrics
- Architecture enforcement
- Feature demand scoring
- Financial forecasting

### ✅ Artifact Production

- Weekly strategy reports
- Prioritized backlogs
- User insights
- Generated content
- Financial reports

### ✅ Early Problem Detection

- Error rate spikes
- Performance regressions
- Security violations
- Cost anomalies
- Churn risks

### ✅ Compounding Value

- Each week produces new insights
- Manual effort trends toward zero
- Product improves autonomously

## Documentation

- **[Role Replacement Map](./role-replacement-map.md)** - Detailed mapping of roles to agents
- **[Setup Guide](./setup-guide.md)** - Installation and configuration
- **[Verification Report](./verification-report.md)** - Tracking compounding value

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Agent Orchestrator (Scheduler)           │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ Strategic │ │Architecture│ │User Intent │
│ Governor  │ │ Sentinel   │ │ Synthesizer│
└───────────┘ └───────────┘ └───────────┘
        │           │           │
        ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│Preemptive │ │  Organic  │ │Autonomous │
│ Support   │ │  Growth   │ │    CFO    │
└───────────┘ └───────────┘ └───────────┘
        │           │           │
        └───────────┼───────────┘
                    │
        ┌───────────▼───────────┐
        │  Release Gatekeeper   │
        └───────────────────────┘
                    │
        ┌───────────▼───────────┐
        │   Database Tables     │
        │  (Artifacts Storage)  │
        └───────────────────────┘
```

## Safety & Guardrails

- **Kill Switches**: All agents can be disabled instantly
- **Timeouts**: Prevent runaway processes (1-5 min)
- **Confidence Thresholds**: Only auto-resolve high-confidence cases
- **Human Override**: Critical decisions require approval
- **Rollback Mechanisms**: Release Gatekeeper can block/rollback

## Remaining Human Decisions

While most roles are automated, humans still:

1. Approve strategic backlog items
2. Review critical architecture violations
3. Publish growth content (after review)
4. Handle escalated support cases
5. Make major financial decisions
6. Override release blocks (with approval)

## Success Metrics

Track weekly:

- Agent execution success rate
- Artifacts produced
- Manual interventions required
- Compounding value indicators

See [Verification Report](./verification-report.md) for detailed metrics.

## Next Steps

1. Review [Role Replacement Map](./role-replacement-map.md) to understand each agent
2. Follow [Setup Guide](./setup-guide.md) to deploy
3. Monitor [Verification Report](./verification-report.md) weekly
4. Gradually reduce manual interventions as confidence grows

---

**Goal**: Transform Settler from "a startup you run" into "an asset that runs itself"

_Last updated: 2026-01-27_
