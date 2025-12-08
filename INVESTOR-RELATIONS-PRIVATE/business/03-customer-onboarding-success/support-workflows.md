# Support & Triage Workflows

**Version:** 1.0  
**Last Updated:** January 2026

---

## Support Bot Prompt

### Support Bot Configuration

**Bot Name:** Settler Support Bot  
**Platform:** Intercom / Zendesk / Custom  
**Language:** English  
**Tone:** Friendly, helpful, technical

---

### Support Bot Prompt Template

```
You are Settler Support Bot, a helpful assistant for Settler's reconciliation-as-a-service platform.

**Your Role:**
- Help users with technical questions about Settler
- Provide documentation links and code examples
- Escalate complex issues to human support
- Collect information for support tickets

**Your Knowledge:**
- Settler API documentation
- SDK usage and examples
- Common troubleshooting steps
- Integration guides
- Best practices

**Your Capabilities:**
- Answer technical questions
- Provide code examples
- Link to documentation
- Create support tickets
- Escalate to human support

**Your Limitations:**
- Don't provide financial or legal advice
- Don't access user data without permission
- Don't make changes to user accounts
- Don't provide pricing information (direct to sales)

**Your Tone:**
- Friendly and helpful
- Technical but accessible
- Professional but conversational
- Empathetic and patient

**Response Format:**
1. Acknowledge the question
2. Provide helpful answer or documentation link
3. Offer additional help or escalation
4. End with friendly closing

**Example Responses:**

User: "How do I create a reconciliation job?"
Bot: "I can help you create a reconciliation job! Here's how:

1. Install the SDK: `npm install @settler/sdk`
2. Initialize the client with your API key
3. Create a job with source and target adapters

Here's a code example:
\`\`\`typescript
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: { adapter: "shopify", config: {...} },
  target: { adapter: "stripe", config: {...} },
  rules: { matching: [...] }
});
\`\`\`

Full documentation: https://docs.settler.io/guides/create-job

Need more help? I can escalate to our support team!"

User: "My reconciliation is failing"
Bot: "I'm sorry to hear that! Let's troubleshoot:

1. Check adapter connectivity
2. Review error logs
3. Validate data format
4. Check matching rules

Error troubleshooting guide: https://docs.settler.io/guides/troubleshooting

Can you share the error message? I can help diagnose the issue or escalate to our support team."
```

---

## Internal Escalation Matrix

### Escalation Levels

**Level 1: Support Bot / Self-Service**
- Documentation
- Community (Discord, GitHub)
- Knowledge base
- Automated responses

**Level 2: Support Engineer**
- Email support
- Standard support tickets
- Technical questions
- Integration help

**Level 3: Senior Support Engineer**
- Complex technical issues
- Escalated tickets
- Performance problems
- Integration challenges

**Level 4: Engineering Team**
- Bugs and product issues
- Feature requests
- Performance optimization
- Infrastructure issues

**Level 5: Leadership**
- Critical incidents
- Security issues
- Customer escalations
- Strategic issues

---

### Escalation Criteria

| Issue Type | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 |
|------------|---------|---------|---------|---------|---------|
| **Documentation Questions** | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| **API Usage Questions** | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| **Integration Help** | ⚠️ | ✅ | ✅ | ⚠️ | ❌ |
| **Technical Issues** | ❌ | ✅ | ✅ | ✅ | ⚠️ |
| **Bugs** | ❌ | ⚠️ | ✅ | ✅ | ⚠️ |
| **Performance Issues** | ❌ | ❌ | ✅ | ✅ | ⚠️ |
| **Security Issues** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Critical Incidents** | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| **Customer Escalations** | ❌ | ⚠️ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Primary responsibility
- ⚠️ Secondary responsibility
- ❌ Not responsible

---

### Escalation Process

**Step 1: Initial Triage**
- Support bot attempts to resolve
- Check documentation and knowledge base
- Provide self-service resources

**Step 2: Level 2 Escalation**
- Support engineer reviews ticket
- Provides technical assistance
- Escalates if needed

**Step 3: Level 3 Escalation**
- Senior support engineer reviews
- Provides advanced technical assistance
- Escalates to engineering if needed

**Step 4: Level 4 Escalation**
- Engineering team reviews
- Fixes bugs or implements features
- Provides technical solutions

**Step 5: Level 5 Escalation**
- Leadership reviews
- Makes strategic decisions
- Handles critical incidents

---

## Issue Severity Model

### Severity Levels

**P0: Critical**
- System down
- Data breach
- Security incident
- Complete service outage

**P1: High**
- Major feature broken
- High error rate (>10%)
- Performance degradation
- Customer impact (multiple customers)

**P2: Medium**
- Minor feature broken
- Moderate error rate (5-10%)
- Performance issues
- Customer impact (single customer)

**P3: Low**
- Documentation issues
- UI/UX improvements
- Feature requests
- Low error rate (<5%)

---

### Severity Response Times

| Severity | Response Time | Resolution Time | Escalation |
|----------|---------------|------------------|------------|
| **P0: Critical** | 15 minutes | 4 hours | Immediate |
| **P1: High** | 1 hour | 24 hours | 4 hours |
| **P2: Medium** | 4 hours | 72 hours | 24 hours |
| **P3: Low** | 24 hours | 7 days | 72 hours |

---

### Severity Assignment

**P0: Critical**
- System completely down
- Data breach or security incident
- Complete service outage
- Multiple customers affected

**P1: High**
- Major feature broken
- High error rate (>10%)
- Performance degradation (>50%)
- Multiple customers affected

**P2: Medium**
- Minor feature broken
- Moderate error rate (5-10%)
- Performance issues (10-50%)
- Single customer affected

**P3: Low**
- Documentation issues
- UI/UX improvements
- Feature requests
- Low error rate (<5%)

---

## Support Workflow

### Ticket Creation

**Triggers:**
- Email to support@settler.io
- In-app support widget
- Support bot escalation
- Phone call (Enterprise)

**Information Collected:**
- Customer name and email
- Plan tier
- Issue description
- Error messages/logs
- Steps to reproduce
- Expected vs. actual behavior

---

### Ticket Triage

**Step 1: Categorize**
- Technical issue
- Integration help
- Billing question
- Feature request
- Bug report

**Step 2: Assign Severity**
- P0: Critical
- P1: High
- P2: Medium
- P3: Low

**Step 3: Route**
- Support bot (Level 1)
- Support engineer (Level 2)
- Senior support engineer (Level 3)
- Engineering team (Level 4)
- Leadership (Level 5)

---

### Ticket Resolution

**Step 1: Investigation**
- Review issue details
- Reproduce issue (if possible)
- Check logs and metrics
- Identify root cause

**Step 2: Solution**
- Provide solution or workaround
- Fix bug or implement feature
- Update documentation
- Communicate resolution

**Step 3: Follow-Up**
- Verify resolution
- Collect feedback
- Close ticket
- Document learnings

---

## Support Metrics

### Response Time Metrics

**Target Response Times:**
- P0: Critical - 15 minutes
- P1: High - 1 hour
- P2: Medium - 4 hours
- P3: Low - 24 hours

**Measurement:**
- Time from ticket creation to first response
- Tracked by support system
- Reported weekly

---

### Resolution Time Metrics

**Target Resolution Times:**
- P0: Critical - 4 hours
- P1: High - 24 hours
- P2: Medium - 72 hours
- P3: Low - 7 days

**Measurement:**
- Time from ticket creation to resolution
- Tracked by support system
- Reported weekly

---

### Customer Satisfaction Metrics

**CSAT (Customer Satisfaction):**
- Target: 4.5/5.0
- Measurement: Post-resolution survey
- Tracked by support system

**NPS (Net Promoter Score):**
- Target: >50
- Measurement: Quarterly survey
- Tracked by support system

---

## Support Tools

### Support System
- **Platform:** Zendesk / Intercom / Custom
- **Features:** Ticket management, knowledge base, chat, email

### Documentation
- **Platform:** GitBook / Notion / Custom
- **Features:** API docs, guides, tutorials, examples

### Monitoring
- **Platform:** Datadog / New Relic / Custom
- **Features:** Error tracking, performance monitoring, alerts

### Communication
- **Platform:** Slack / Discord / Email
- **Features:** Team communication, customer communication

---

## Support Best Practices

### Communication
- Respond within SLA
- Use clear, technical language
- Provide code examples when helpful
- Follow up to ensure resolution

### Documentation
- Document common issues
- Update knowledge base regularly
- Share learnings with team
- Create reusable solutions

### Escalation
- Escalate early if stuck
- Provide context when escalating
- Follow up on escalated tickets
- Learn from escalations

---

**Last Updated:** January 2026
