# Autonomous Systems - Quick Reference

**Last Updated:** 2026-01-27

## 🎯 System Count

- **Before:** 43+ systems
- **After:** 22 systems
- **Reduction:** 49%

## 📋 Core Systems

### Agents (7)
1. Strategic Governor - Weekly strategy
2. Architecture Sentinel - Daily monitoring
3. Autonomous CFO - Daily finances
4. Preemptive Support - Daily + real-time
5. Organic Growth - Weekly content
6. User Intent Synthesizer - Daily insights
7. Release Gatekeeper - Real-time safety

### Infrastructure (4)
1. Agent Orchestrator - Coordination
2. Agent Monitor - Dead-man switches
3. Automated Health Checks - System health
4. Automated Alerting - All notifications

### CI/CD (3)
1. Migration Guardian - Safe migrations
2. CI Pipeline - Build validation
3. Production Deployment - Deploy to prod

## 🚀 Quick Commands

### Check Agent Status
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"action": "status"}'
```

### Run Agent Manually
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/agent-orchestrator \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"agent_type": "strategic_governor", "action": "run"}'
```

### Get Founder Digest
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/automated-alerting \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"action": "digest", "type": "daily"}'
```

### Trigger Migration
```bash
gh workflow run migration-guardian.yml
```

## 📊 Monitoring Queries

### Recent Agent Runs
```sql
SELECT agent_type, status, started_at, duration_ms 
FROM agent_runs 
ORDER BY started_at DESC LIMIT 10;
```

### Recent Alerts
```sql
SELECT severity, title, created_at 
FROM alerts 
ORDER BY created_at DESC LIMIT 10;
```

### Health Check Status
```sql
SELECT overall_status, timestamp 
FROM health_checks 
ORDER BY timestamp DESC LIMIT 5;
```

## 🔧 Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| Agent not running | `agent_runs` table | Check cron job, manual trigger |
| Alerts not received | `alerts` table | Check RESEND_API_KEY |
| Migration stuck | GitHub Actions logs | Review MIGRATION_LOG.md |
| Health check failing | `health_checks` table | Check system status |

## 📚 Documentation

- **Full Guide:** `/docs/internal/autonomous-systems-guide.md`
- **Audit Report:** `/docs/internal/autonomous-systems-governance-audit.md`
- **Implementation:** `/docs/internal/implementation-summary.md`

## ⚡ Key Principles

1. **Single Source of Truth** - One system per domain
2. **Route Through Orchestrator** - Never bypass
3. **Centralized Alerting** - All alerts go through automated-alerting
4. **Dead-Man Switches** - Agent Monitor checks every 30 min
5. **Founder Digest** - Daily summary of all activity

---

*For detailed information, see the full guide.*
