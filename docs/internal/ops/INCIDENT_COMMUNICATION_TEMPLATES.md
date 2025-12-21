# Incident Communication Templates

**Version:** 1.0  
**Date:** January 2026  
**Status:** Active  
**Purpose:** Standardized templates for incident communication

---

## Status Page Updates

### Incident Detected (Critical)

```
🔴 Investigating: [Service Name] Outage

We're currently investigating an issue affecting [Service Name]. 
Some customers may be experiencing [specific issue].

We'll provide updates every 30 minutes until resolved.

Last updated: [Time]
```

### Incident Update (In Progress)

```
🟡 Monitoring: [Service Name] Issue

We've identified the root cause and are working on a fix. 
[Brief description of fix in progress]

Expected resolution: [Time estimate]

Last updated: [Time]
```

### Incident Resolved

```
✅ Resolved: [Service Name] Issue

The issue has been resolved. [Brief description of what was fixed]

We apologize for any inconvenience. We'll publish a post-mortem within 24 hours.

Last updated: [Time]
```

---

## Customer Email Templates

### Critical Incident Notification

**Subject:** Important: Service Disruption Notice

```
Subject: Important: Service Disruption Notice

Dear [Customer Name],

We're writing to inform you of a service disruption affecting Settler.dev.

**What's happening:**
[Brief description of issue]

**Impact:**
[What customers are experiencing]

**What we're doing:**
[What we're doing to fix it]

**Expected resolution:**
[Time estimate]

**Status updates:**
You can track the status at: https://status.settler.dev

We apologize for any inconvenience and will keep you updated.

Best regards,
Settler Operations Team
```

### High Priority Incident Notification

**Subject:** Service Degradation Notice

```
Subject: Service Degradation Notice

Dear [Customer Name],

We're experiencing a service degradation affecting [Service Name].

**What's happening:**
[Brief description of issue]

**Impact:**
[What customers are experiencing]

**What we're doing:**
[What we're doing to fix it]

**Expected resolution:**
[Time estimate]

**Status updates:**
You can track the status at: https://status.settler.dev

We'll keep you updated as we resolve this issue.

Best regards,
Settler Operations Team
```

### Resolution Notification

**Subject:** Service Restored

```
Subject: Service Restored

Dear [Customer Name],

The service disruption affecting Settler.dev has been resolved.

**What was fixed:**
[Brief description of fix]

**Timeline:**
- Detected: [Time]
- Resolved: [Time]
- Total downtime: [Duration]

**Post-mortem:**
We'll publish a detailed post-mortem within 24 hours at: https://status.settler.dev

We apologize for any inconvenience and appreciate your patience.

Best regards,
Settler Operations Team
```

---

## Internal Communication Templates

### Slack Alert (Critical)

```
🚨 CRITICAL INCIDENT: [Service Name] Outage

**Severity:** P0 - Critical
**Status:** Investigating
**Impact:** [Affected customers/features]
**Detected:** [Time]
**Incident Commander:** [Name]

**Actions:**
- [ ] Status page updated
- [ ] Customer notification sent
- [ ] Team notified

**Updates:** [Link to incident ticket]
```

### Slack Update (In Progress)

```
📢 INCIDENT UPDATE: [Service Name] Issue

**Status:** Fixing
**Root Cause:** [Brief description]
**ETA:** [Time estimate]

**Progress:**
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Testing in progress
- [ ] Deployed

**Updates:** [Link to incident ticket]
```

### Slack Resolution

```
✅ INCIDENT RESOLVED: [Service Name] Issue

**Status:** Resolved
**Resolution Time:** [Duration]
**Root Cause:** [Brief description]
**Fix:** [Brief description]

**Post-Incident:**
- [ ] Post-mortem scheduled
- [ ] Action items identified
- [ ] Customer notification sent

**Updates:** [Link to incident ticket]
```

---

## Social Media Templates

### Twitter/X (Incident Detected)

```
We're currently experiencing an issue affecting [Service Name]. 
We're working to resolve it ASAP. 
Status updates: https://status.settler.dev
```

### Twitter/X (Incident Resolved)

```
The issue affecting [Service Name] has been resolved. 
We apologize for any inconvenience. 
Post-mortem: https://status.settler.dev
```

---

## Post-Mortem Template

### Public Post-Mortem

```
# Post-Mortem: [Incident Name]

**Date:** [Date]
**Duration:** [Duration]
**Severity:** [P0/P1/P2/P3]
**Impact:** [Affected customers/features]

## Summary

[Brief summary of incident]

## Timeline

- **[Time]** - Incident detected
- **[Time]** - Root cause identified
- **[Time]** - Fix implemented
- **[Time]** - Service restored

## Root Cause

[Detailed root cause analysis]

## Impact

- **Affected Customers:** [Number]
- **Downtime:** [Duration]
- **Error Rate:** [Percentage]

## Resolution

[How issue was resolved]

## Prevention

[Prevention measures implemented]

## Action Items

- [ ] [Action item 1] - [Owner] - [Deadline]
- [ ] [Action item 2] - [Owner] - [Deadline]

## Lessons Learned

[Key learnings]

---

We apologize for any inconvenience and appreciate your patience.
```

---

## Pricing Change Notification Template

**Subject:** Important: Pricing Update Notice

```
Subject: Important: Pricing Update Notice

Dear [Customer Name],

We're writing to inform you of upcoming changes to Settler pricing.

**What's changing:**
[Brief description of changes]

**When:**
Changes take effect on [Date] (30 days from today).

**Impact:**
[How this affects the customer]

**What you need to do:**
[Any action required]

**Questions:**
If you have questions, please contact us at support@settler.io

We appreciate your continued support.

Best regards,
Settler Team
```

---

## Update Notification Template

**Subject:** Product Update: [Feature Name]

```
Subject: Product Update: [Feature Name]

Dear [Customer Name],

We're excited to share a new feature: [Feature Name].

**What's new:**
[Brief description]

**How to use it:**
[Brief instructions]

**Learn more:**
[Link to documentation]

We hope you find this useful!

Best regards,
Settler Team
```

---

**Document Status:** Active  
**Last Updated:** January 2026  
**Next Review:** After first incident (update based on usage)
