# Ops Intelligence & Founder Briefings

## Overview

Ops Intelligence is a closed-loop operational intelligence system that transforms Settler from "I can see what's happening" to "The system tells me what matters, why, and what to do next."

## Architecture

### Components

1. **Insights Engine** (`packages/api/src/services/ops-intelligence/insights-engine.ts`)
   - Generates insights from real metrics
   - Types: cost, support, usage, stability
   - Deterministic, evidence-based

2. **Recommendation Engine** (`packages/api/src/services/ops-intelligence/recommendation-engine.ts`)
   - Rules-based action recommendations
   - Risk assessment and reversibility tracking
   - Actionable prescriptions

3. **Action Ledger** (Database: `ops_actions`)
   - Tracks all actions taken
   - Verification status
   - Outcome notes

4. **Weekly Briefing Generator** (`supabase/functions/generate-weekly-briefing/`)
   - Automated founder briefings
   - Summarizes insights, recommendations, actions
   - Markdown + structured JSON

### Database Schema

- `ops_insights` - Generated insights with evidence
- `ops_recommendations` - Action recommendations linked to insights
- `ops_actions` - Action ledger with verification
- `ops_briefings` - Weekly founder briefings

## Insight Types

### Cost Insights

- Cost WoW/MoM changes beyond thresholds
- High-cost orgs with low revenue
- Cost per event spikes
- Cost-to-value ratio anomalies

### Support Insights

- Ticket spikes by category
- Repeated tickets with same root cause
- Orgs with abnormal ticket density
- Support cost per org anomalies

### Usage Insights

- Feature adoption rising/falling
- Inactive or churn-risk orgs
- Heavy users approaching limits
- Low engagement after signup

### Stability Insights

- Error rate spikes
- Webhook failure trends
- Job backlog growth
- Route-level instability

## Recommendation Types

- `investigate` - Review and analyze
- `upgrade` - Plan or service upgrade
- `throttle` - Rate limiting or throttling
- `outreach` - Customer communication
- `document` - Documentation updates
- `fix` - Code or configuration fixes
- `monitor` - Enhanced monitoring
- `verify` - Verify configuration
- `retry` - Retry logic improvements

## Usage

### Viewing Insights

Navigate to `/console/insights` to:

- Filter by type, severity, status
- View insight details with evidence
- See linked recommendations
- Track action history

### Viewing Briefings

Navigate to `/console/briefings` to:

- View weekly founder briefings
- See summary statistics
- Review recommendations and actions

### Executing Recommendations

1. Navigate to an insight detail page
2. Review recommendations
3. Click "Execute Action"
4. Provide action taken and outcome notes
5. System creates action record and updates recommendation status

### API Endpoints

- `GET /api/console/ops-insights` - List insights with filters
- `GET /api/console/ops-insights/[id]` - Get insight detail
- `PATCH /api/console/ops-insights/[id]` - Update insight status
- `POST /api/console/ops-recommendations/[id]/execute` - Execute recommendation
- `GET /api/console/ops-briefings` - List briefings
- `GET /api/console/ops-briefings/[id]` - Get briefing detail

## Scheduled Jobs

### Daily Insights Generation

- **Schedule**: Daily at 2 AM UTC
- **Function**: `generate-ops-insights`
- **Purpose**: Generate new insights from metrics

### Weekly Briefing Generation

- **Schedule**: Monday at 9 AM UTC
- **Function**: `generate-weekly-briefing`
- **Purpose**: Generate weekly founder briefing

### Insight Expiration

- **Schedule**: Daily at 3 AM UTC
- **Function**: `expire_insights()` RPC
- **Purpose**: Mark expired insights as expired

## Safety & Governance

- **No Automatic Actions**: All actions require admin approval
- **Reversibility Tracking**: Every recommendation notes if it's reversible
- **Evidence Required**: All insights link to underlying metrics
- **Confidence Scores**: Insights include confidence (0-1)
- **Admin Override**: All actions can be overridden by admins

## Testing

Run tests:

```bash
npm test -- ops-intelligence
```

Test files:

- `packages/api/src/services/ops-intelligence/__tests__/insights-engine.test.ts`
- `packages/api/src/services/ops-intelligence/__tests__/recommendation-engine.test.ts`

## Future Enhancements

- Customer-facing insights (org-level mini version)
- ML-enhanced anomaly detection
- Predictive insights
- Automated action execution (with safeguards)
- Integration with external tools (Slack, email)
