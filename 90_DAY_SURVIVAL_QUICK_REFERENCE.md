# 90-Day Survival Test — Quick Reference

## Migrations Applied

All migrations are in `/supabase/migrations/`:

1. `20260128000000_90_day_survival_data_retention.sql` - Data cleanup
2. `20260128000001_90_day_survival_job_recovery.sql` - Job retry logic
3. `20260128000002_90_day_survival_billing_protection.sql` - Revenue protection
4. `20260128000003_90_day_survival_support_automation.sql` - User help
5. `20260128000004_90_day_survival_trust_protection.sql` - Confidence tracking
6. `20260128000005_90_day_survival_external_shock.sql` - Circuit breakers
7. `20260128000006_90_day_survival_drift_detection.sql` - Staleness detection
8. `20260128000007_90_day_survival_re_entry_readiness.sql` - System snapshots

## Key Functions

### Data Retention
```sql
SELECT run_data_retention_cleanup(); -- Master cleanup
SELECT get_table_size_monitoring(); -- Monitor table sizes
```

### Job Recovery
```sql
SELECT retry_failed_jobs(); -- Retry failed jobs
SELECT check_critical_job_failures(); -- Check for critical failures
```

### Billing
```sql
SELECT reconcile_daily_billing(); -- Daily reconciliation
SELECT detect_billing_discrepancies(); -- Find discrepancies
SELECT ensure_usage_synced_to_stripe(); -- Ensure sync
```

### Support
```sql
SELECT detect_user_confusion(); -- Detect confusion
SELECT process_unresolved_confusion(); -- Provide help
```

### Trust
```sql
SELECT detect_low_confidence_results(); -- Find low confidence
SELECT ensure_receipt_confidence(); -- Set missing confidence
SELECT validate_data_integrity(); -- Validate data
```

### External Shock
```sql
SELECT check_circuit_breaker('stripe'); -- Check breaker status
SELECT check_rate_limit('user_id', 'user', '/api/v1/receipts'); -- Check rate limit
SELECT check_degraded_mode(); -- Check degraded mode
```

### Drift
```sql
SELECT detect_stale_content(); -- Find stale content
SELECT auto_archive_stale_content(); -- Archive stale
SELECT detect_assumption_drift(); -- Find drift
SELECT check_data_freshness(); -- Check freshness
```

### Re-Entry
```sql
SELECT create_system_state_snapshot('daily'); -- Create snapshot
SELECT get_re_entry_summary(90); -- Get summary
SELECT get_change_audit_summary(90); -- Get audit summary
```

## Key Tables

- `job_failure_log` - Failed jobs and retries
- `billing_reconciliation_log` - Billing reconciliation
- `user_confusion_events` - User confusion tracking
- `confidence_events` - Confidence scores
- `circuit_breakers` - Circuit breaker states
- `rate_limits` - Rate limit tracking
- `staleness_checks` - Stale content tracking
- `system_state_snapshots` - System state snapshots
- `automated_decisions` - Decision audit trail

## Monitoring Queries

### Check System Health
```sql
-- Recent alerts
SELECT * FROM alerts 
WHERE resolved_at IS NULL 
ORDER BY created_at DESC LIMIT 10;

-- Failed jobs
SELECT * FROM job_failure_log 
WHERE status = 'failed' 
ORDER BY created_at DESC LIMIT 10;

-- Open circuit breakers
SELECT * FROM circuit_breakers 
WHERE status = 'open';

-- Low confidence results
SELECT * FROM confidence_events 
WHERE flagged_low_confidence = true 
AND created_at > NOW() - INTERVAL '24 hours';
```

### Check Billing
```sql
-- Unreconciled discrepancies
SELECT * FROM billing_reconciliation_log 
WHERE status = 'discrepancy' 
ORDER BY ABS(discrepancy_amount) DESC LIMIT 10;

-- Payment failures
SELECT * FROM billing_reconciliation_log 
WHERE reconciliation_type = 'payment_failed' 
ORDER BY created_at DESC LIMIT 10;
```

### Check User Support
```sql
-- Unresolved confusion
SELECT * FROM user_confusion_events 
WHERE resolved_at IS NULL 
ORDER BY detected_at DESC LIMIT 10;
```

### Check System State
```sql
-- Latest snapshot
SELECT * FROM system_state_snapshots 
ORDER BY snapshot_date DESC, created_at DESC LIMIT 1;

-- Re-entry summary
SELECT get_re_entry_summary(90);
```

## Cron Jobs

All cron jobs are scheduled automatically. View with:
```sql
SELECT * FROM cron.job ORDER BY jobname;
```

Key schedules:
- Data retention cleanup: Daily 3 AM UTC
- Job retry: Every 15 minutes
- Billing reconciliation: Daily 2 AM UTC
- Confusion detection: Every 15 minutes
- Low confidence detection: Hourly
- Circuit breaker check: Every 5 minutes
- Staleness detection: Daily 6 AM UTC
- System snapshot: Daily midnight UTC

## Alert Severities

- `critical` - Immediate action required
- `high` - Action required soon
- `medium` - Monitor closely
- `low` - Informational

## Status

✅ **All systems hardened for 90-day autonomous operation**

See `90_DAY_SURVIVAL_AUDIT_REPORT.md` for complete details.
