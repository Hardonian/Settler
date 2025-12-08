# Voice-of-Customer Feedback System

**Structured feedback collection and aggregation system for Settler**

---

## Overview

The Voice-of-Customer (VOC) system collects, structures, and analyzes customer feedback to drive product decisions and improve customer satisfaction.

---

## Feedback Collection

### Input Sources

1. **Sales Calls**
   - Recorded calls transcribed
   - Key points extracted
   - Format: Structured feedback entry

2. **User Interviews**
   - Structured interviews (30-60 min)
   - Notes transcribed
   - Format: Full feedback template

3. **Support Tickets**
   - Support ticket → feedback entry
   - If pain/feature request identified
   - Format: Pain + workaround + feature requests

4. **GitHub Issues**
   - GitHub issue → feedback entry
   - Format: Pain + desired outcome + feature requests

5. **Community Messages**
   - Slack/Discord messages
   - If substantive feedback
   - Format: Pain + quotes + feature requests

6. **Surveys**
   - Monthly user survey
   - Quarterly NPS survey
   - Format: Pain + desired outcome + NPS + feature requests

---

## Feedback Structure

### Normalized Format

```typescript
interface Feedback {
  id: string;
  timestamp: string;
  source: "sales_call" | "user_interview" | "support_ticket" | "github_issue" | "community" | "survey";
  persona: "cto" | "cfo" | "finance_ops" | "developer";
  userId?: string;
  company?: string;
  context: {
    stage: "evaluating" | "onboarding" | "active" | "churned";
    useCase: string;
    transactionVolume?: string;
  };
  pain: {
    description: string;
    severity: "high" | "medium" | "low";
    frequency: "daily" | "weekly" | "monthly" | "one-time";
  };
  desiredOutcome: {
    description: string;
    successMetric?: string;
  };
  workaround?: {
    description: string;
    painPoints: string[];
  };
  quotes: string[];
  featureRequests: Array<{
    feature: string;
    priority: "high" | "medium" | "low";
    rationale: string;
  }>;
  tags: string[];
}
```

---

## Feedback Collection Forms

### Sales Call Feedback Form

**After each sales call, fill out:**

1. **Persona:** CTO / CFO / Finance Ops / Developer
2. **Pain:** What problem are they trying to solve?
3. **Desired Outcome:** What does success look like?
4. **Workaround:** What are they doing now?
5. **Quotes:** Notable quotes (verbatim)
6. **Feature Requests:** What features did they ask for?

**Template:**
```
Sales Call Feedback
Date: [Date]
Customer: [Company Name]
Persona: [CTO/CFO/etc]
Pain: [Description]
Desired Outcome: [Description]
Workaround: [Current solution]
Quotes:
- "[Quote 1]"
- "[Quote 2]"
Feature Requests:
- [Feature 1] (Priority: High/Medium/Low) - [Rationale]
```

### User Interview Feedback Form

**After each user interview:**

1. **Context:** Stage, use case, transaction volume
2. **Pain:** Detailed pain description
3. **Desired Outcome:** Success metrics
4. **Workaround:** Current solution and pain points
5. **Quotes:** Verbatim quotes
6. **Feature Requests:** Prioritized list

**Template:**
```
User Interview Feedback
Date: [Date]
User: [User ID / Email]
Persona: [Persona]
Context:
- Stage: [evaluating/onboarding/active/churned]
- Use Case: [Description]
- Transaction Volume: [Volume]
Pain:
- Description: [Detailed description]
- Severity: [High/Medium/Low]
- Frequency: [Daily/Weekly/Monthly]
Desired Outcome:
- Description: [What they want]
- Success Metric: [How they'll measure success]
Workaround:
- Description: [Current solution]
- Pain Points: [List of pain points]
Quotes:
- "[Quote 1]"
- "[Quote 2]"
Feature Requests:
- [Feature 1] (Priority: High) - [Rationale]
Tags: [tag1, tag2, tag3]
```

### Support Ticket Feedback Form

**For support tickets that indicate pain or feature requests:**

1. **Ticket ID:** Reference ticket
2. **Pain:** What problem did they report?
3. **Workaround:** What workaround did we suggest?
4. **Feature Request:** What feature would solve this?

**Template:**
```
Support Ticket Feedback
Ticket ID: [ID]
User: [User ID]
Pain: [Problem reported]
Workaround: [Solution provided]
Feature Request: [Feature that would help]
Priority: [High/Medium/Low]
```

---

## Feedback Storage

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  source VARCHAR(50) NOT NULL,
  persona VARCHAR(50),
  company VARCHAR(255),
  context JSONB,
  pain JSONB NOT NULL,
  desired_outcome JSONB NOT NULL,
  workaround JSONB,
  quotes TEXT[],
  feature_requests JSONB[],
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_source ON feedback(source);
CREATE INDEX idx_feedback_persona ON feedback(persona);
CREATE INDEX idx_feedback_tags ON feedback USING GIN (tags);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
```

---

## Feedback Aggregation

### Weekly Aggregation Process

**Monday:** Collect all feedback from previous week
- Sales calls (SDR/AE)
- User interviews (Product/Founder)
- Support tickets (Support)
- GitHub issues (Engineering)
- Community messages (Community manager)

**Tuesday:** Categorize and prioritize
- Group by persona
- Group by pain type (Activation, Retention, Expansion)
- Tag with severity
- Count frequency

**Wednesday:** Map to roadmap
- Match feedback to existing epics/stories
- Create new stories if needed
- Prioritize based on frequency + impact
- Estimate effort

**Thursday:** Update roadmap
- Add high-priority items to current sprint
- Add medium-priority items to backlog
- Defer low-priority items

**Friday:** Share insights
- Weekly feedback summary
- Top 5 pains this week
- Roadmap updates
- Customer quotes

---

## Insight Outputs

### JTBD Statements

**Developer (CTO/VP Eng):**
- "When I'm building payment integrations, I want to eliminate custom reconciliation code so that I can focus on core product features and reduce maintenance burden."
- "When I'm evaluating reconciliation tools, I want a simple API integration so that I can get started in minutes without complex setup."

**Finance (CFO/Finance Director):**
- "When I'm closing the books, I want automated reconciliation so that I can reduce month-end close time from 5-7 days to 1 day."
- "When I'm ensuring compliance, I want complete audit trails so that I can pass audits without manual documentation."

**Operations (Finance Ops Manager):**
- "When I'm reconciling transactions, I want an exception queue so that I can quickly resolve unmatched items without digging through spreadsheets."
- "When I'm handling multi-currency transactions, I want automatic FX conversion so that I don't have to manually look up exchange rates."

### Top Pains & Outcomes

**Activation Pains:**
1. Adapter configuration unclear (Frequency: High, Impact: High)
2. No test mode (Frequency: Medium, Impact: High)
3. Generic error messages (Frequency: High, Impact: High)

**Retention Pains:**
1. Exception queue missing (Frequency: High, Impact: High)
2. Report format overwhelming (Frequency: Medium, Impact: Medium)
3. No confidence scores (Frequency: Medium, Impact: Medium)

**Expansion Pains:**
1. Multi-currency support missing (Frequency: Low, Impact: High)
2. No direct accounting sync (Frequency: Medium, Impact: Medium)

### Language Bank

**Problem Language:**
- "Manual reconciliation takes hours"
- "Spreadsheets are error-prone"
- "We can't scale manual processes"
- "Multi-gateway fragmentation"
- "API changes break our custom code"
- "Month-end close takes too long"
- "We need audit trails"
- "Finance team is overwhelmed"

**Solution Language:**
- "Automate reconciliation"
- "Real-time matching"
- "99%+ accuracy"
- "5-minute integration"
- "Zero maintenance"
- "Self-serve for finance"
- "Compliance-ready"
- "Developer-friendly API"

---

## Feedback → Roadmap Loop

### Simple Rules

**Rule 1: Activation Blockers**
- If 3+ customers report same activation blocker → Fix in current sprint

**Rule 2: Retention Risks**
- If 2+ customers churn due to same issue → Fix in current sprint

**Rule 3: High-Value Feature Requests**
- If 5+ enterprise customers request same feature → Add to roadmap (next quarter)

**Rule 4: Competitive Threats**
- If 2+ customers mention competitor → Analyze competitor, prioritize differentiation

**Rule 5: Market Signals**
- If 10+ customers request same feature → Add to roadmap (next quarter)

---

## Implementation

### Feedback API Routes

```typescript
// Create feedback
POST /api/v1/feedback
{
  source: "sales_call",
  persona: "cto",
  pain: { description: "...", severity: "high" },
  desiredOutcome: { description: "..." },
  // ...
}

// List feedback
GET /api/v1/feedback?persona=cto&source=sales_call

// Get feedback insights
GET /api/v1/feedback/insights
// Returns: Top pains, JTBD statements, language bank
```

---

**Last Updated:** 2026-01-15
