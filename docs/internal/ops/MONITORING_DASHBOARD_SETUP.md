# Monitoring Dashboard Setup

**Version:** 1.0  
**Date:** January 2026  
**Status:** ✅ Complete  
**Purpose:** Documentation for the admin monitoring dashboard

---

## Overview

The **Admin Monitoring Dashboard** provides comprehensive real-time monitoring of all key business and operational metrics. It's accessible at `/admin/monitoring` for admin users.

---

## Access

**URL:** `/admin/monitoring`

**Authentication:** Admin users only (role check: `admin` or email ends with `@settler.dev`)

**Navigation:** Available in admin sidebar under "Monitoring"

---

## Metrics Displayed

### System Health
- **System Status:** Overall health (healthy/degraded)
- **Active Customers:** Number of active billing accounts
- **Active Subscriptions:** Number of active subscriptions
- **Open Support Tickets:** Current open tickets
- **SLA Violations:** Current SLA violations

### Business Metrics
- **Monthly Recurring Revenue (MRR):** Total MRR across all subscriptions
- **Average Revenue Per User (ARPU):** Calculated ARPU
- **Churn Rate:** 30-day churn rate percentage
- **Churned Customers:** Number of customers churned in last 30 days
- **Usage (30d):** Total reconciliations in last 30 days
- **Plan Distribution:** Breakdown by plan tier

### SLA Compliance
- **Overall SLA Percentage:** Average SLA compliance across all tiers
- **SLA by Tier:** Detailed breakdown per tier
  - Total tickets
  - SLA met vs. missed
  - Average response time
- **Current Violations:** Active SLA violations

### Support Metrics
- **Total Tickets:** Total tickets in last 30 days
- **Open Tickets:** Currently open tickets
- **SLA Met/Missed:** SLA compliance breakdown
- **By Priority:** Breakdown by priority (critical, high, medium, low)

---

## API Endpoints

### `/api/admin/monitoring/health`
**Method:** GET  
**Returns:** System health metrics

**Response:**
```json
{
  "status": "healthy",
  "metrics": {
    "active_customers": 100,
    "active_subscriptions": 95,
    "open_support_tickets": 5,
    "sla_violations": 1,
    "timestamp": "2026-01-20T12:00:00Z"
  }
}
```

### `/api/admin/monitoring/sla`
**Method:** GET  
**Returns:** SLA compliance metrics

**Response:**
```json
{
  "period": {
    "start": "2025-12-20T12:00:00Z",
    "end": "2026-01-20T12:00:00Z"
  },
  "accounts": [
    {
      "billing_account_id": "uuid",
      "tier": "starter",
      "total_tickets": 10,
      "sla_met": 9,
      "sla_missed": 1,
      "sla_percentage": 90.0,
      "avg_response_time_hours": 18.5
    }
  ],
  "violations": {
    "current": 1,
    "alerts_sent": 1
  }
}
```

### `/api/admin/monitoring/unit-economics`
**Method:** GET  
**Returns:** Unit economics metrics

**Response:**
```json
{
  "mrr": 50000,
  "active_subscriptions": 100,
  "plan_distribution": {
    "starter": 50,
    "growth": 30,
    "scale": 20
  },
  "usage": {
    "total_reconciliations_30d": 1000000
  },
  "calculated_metrics": {
    "arpu": 500,
    "cost_per_reconciliation": 0.0006
  }
}
```

### `/api/admin/monitoring/operational`
**Method:** GET  
**Returns:** Operational metrics

**Response:**
```json
{
  "support": {
    "total": 50,
    "open": 5,
    "resolved": 45,
    "sla_met": 40,
    "sla_missed": 5,
    "by_priority": {
      "critical": 2,
      "high": 10,
      "medium": 30,
      "low": 8
    }
  },
  "period": {
    "start": "2025-12-20T12:00:00Z",
    "end": "2026-01-20T12:00:00Z"
  }
}
```

### `/api/admin/monitoring/business`
**Method:** GET  
**Returns:** Business metrics

**Response:**
```json
{
  "customers": {
    "total": 150,
    "active": 140,
    "churned_30d": 5,
    "churn_rate": 3.33
  },
  "timestamp": "2026-01-20T12:00:00Z"
}
```

---

## Auto-Refresh

The dashboard automatically refreshes every **30 seconds** to show real-time metrics.

---

## Features

### Real-Time Updates
- Auto-refresh every 30 seconds
- Manual refresh available
- Last updated timestamp displayed

### Visual Indicators
- **Green:** Healthy/good metrics
- **Red:** Critical/violations
- **Amber:** Warnings/degraded
- **Blue:** Informational

### Responsive Design
- Works on desktop and mobile
- Grid layout adapts to screen size
- Cards stack on smaller screens

---

## Security

### Authentication
- Requires admin authentication
- Role check: `admin` role or `@settler.dev` email
- Returns 401 if not authenticated
- Returns 403 if not admin

### Authorization
- All endpoints check admin status
- No customer data exposed (aggregated only)
- Secure API routes (Next.js API routes)

---

## Data Sources

### Database Tables
- `billing_accounts` - Customer data
- `subscriptions` - Subscription data
- `support_tickets` - Support ticket data
- `usage_aggregate_daily` - Usage data

### Services
- SLA tracking service (for SLA metrics)
- Data retention service (for retention status)

---

## Troubleshooting

### Dashboard Not Loading
1. Check admin authentication
2. Verify API routes are accessible
3. Check browser console for errors
4. Verify database tables exist

### Metrics Not Updating
1. Check auto-refresh interval (30s)
2. Verify API endpoints are responding
3. Check database connectivity
4. Review server logs

### Missing Data
1. Verify database tables exist
2. Check data exists in tables
3. Verify date ranges are correct
4. Review API endpoint logic

---

## Related Documents

- `MONITORING_SETUP.md` - Overall monitoring setup
- `INCIDENT_RESPONSE_PLAYBOOK.md` - Incident response
- `UNIT_ECONOMICS_TRACKING.md` - Unit economics tracking

---

**Document Status:** ✅ Complete  
**Last Updated:** January 2026  
**Next Review:** After first use (update based on feedback)
