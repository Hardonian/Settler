# Settler.dev — Data Recovery Runbook

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Procedures for data backup, recovery, and disaster recovery

---

## Overview

This runbook provides procedures for:
- Data backup verification
- Data recovery from backups
- Disaster recovery procedures
- Data integrity verification

**Backup Schedule:** Daily automated backups  
**Retention Policy:** 30 days (extendable for Enterprise)  
**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 24 hours

---

## Backup Procedures

### Automated Backups

**Schedule:**
- **Database:** Daily at 2 AM UTC
- **File Storage:** Daily at 3 AM UTC
- **Configuration:** Weekly on Sundays at 1 AM UTC

**Backup Locations:**
- **Primary:** Supabase automated backups
- **Secondary:** AWS S3 (encrypted)
- **Tertiary:** Offsite backup (monthly)

### Manual Backup

**Create Database Backup:**
```bash
# Using Supabase CLI
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# Or using pg_dump directly
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

**Verify Backup Integrity:**
```bash
# Check backup file size
ls -lh backup-*.sql

# Verify backup contains data
grep -c "INSERT INTO" backup-*.sql

# Test restore (dry run)
psql $DATABASE_URL < backup-*.sql --dry-run
```

---

## Data Recovery Procedures

### Scenario 1: Accidental Data Deletion

**Symptoms:**
- Customer reports missing data
- Data appears deleted in database
- Audit logs show deletion event

**Recovery Steps:**

1. **Identify Data Loss Scope**
   ```sql
   -- Check audit logs for deletion events
   SELECT * FROM audit_logs
   WHERE event_type = 'DELETE'
   AND timestamp >= NOW() - INTERVAL '24 hours'
   ORDER BY timestamp DESC;
   
   -- Check soft-deleted records
   SELECT * FROM [table_name]
   WHERE deleted_at IS NOT NULL
   AND deleted_at >= NOW() - INTERVAL '24 hours';
   ```

2. **Restore from Backup**
   ```bash
   # Identify backup file
   ls -lt backup-*.sql | head -5
   
   # Restore specific table (if possible)
   pg_restore -t [table_name] backup-[date].sql
   
   # Or restore full database
   psql $DATABASE_URL < backup-[date].sql
   ```

3. **Verify Data Recovery**
   ```sql
   -- Verify data restored
   SELECT COUNT(*) FROM [table_name];
   
   -- Check data integrity
   SELECT * FROM [table_name]
   WHERE id IN ([affected_ids])
   LIMIT 10;
   ```

4. **Notify Customer**
   - Inform customer of data recovery
   - Apologize for inconvenience
   - Verify data is correct

---

### Scenario 2: Database Corruption

**Symptoms:**
- Database errors
- Data inconsistencies
- Query failures

**Recovery Steps:**

1. **Assess Corruption Scope**
   ```sql
   -- Check database integrity
   SELECT * FROM pg_stat_database WHERE datname = 'settler';
   
   -- Check for corruption errors
   SELECT * FROM pg_stat_activity WHERE state = 'error';
   ```

2. **Restore from Most Recent Backup**
   ```bash
   # Stop application
   # Restore database
   psql $DATABASE_URL < backup-[most-recent].sql
   ```

3. **Verify Recovery**
   ```sql
   -- Check database integrity
   VACUUM ANALYZE;
   
   -- Verify critical tables
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM tenants;
   SELECT COUNT(*) FROM jobs;
   ```

4. **Resume Service**
   - Start application
   - Monitor for errors
   - Verify functionality

---

### Scenario 3: Complete Database Loss

**Symptoms:**
- Database unreachable
- Connection errors
- Complete data loss

**Recovery Steps:**

1. **Assess Situation**
   - Check database server status
   - Verify network connectivity
   - Check Supabase status page

2. **Restore from Backup**
   ```bash
   # Restore from most recent backup
   psql $DATABASE_URL < backup-[most-recent].sql
   
   # Or use Supabase restore
   supabase db restore backup-[most-recent].sql
   ```

3. **Verify Recovery**
   ```sql
   -- Check critical tables
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM tenants;
   SELECT COUNT(*) FROM jobs;
   SELECT COUNT(*) FROM subscriptions;
   ```

4. **Resume Service**
   - Start application
   - Monitor for errors
   - Verify functionality
   - Notify customers if needed

---

## Disaster Recovery Procedures

### Scenario 1: Regional Outage

**Symptoms:**
- Complete service outage
- Database unreachable
- Infrastructure failure

**Recovery Steps:**

1. **Activate Disaster Recovery Plan**
   - Notify team
   - Assess situation
   - Activate backup infrastructure (if available)

2. **Restore from Backup**
   ```bash
   # Restore database to backup region
   psql $BACKUP_DATABASE_URL < backup-[most-recent].sql
   ```

3. **Update DNS/Configuration**
   - Point DNS to backup infrastructure
   - Update environment variables
   - Verify connectivity

4. **Resume Service**
   - Start application
   - Monitor for errors
   - Verify functionality

---

### Scenario 2: Data Center Failure

**Symptoms:**
- Complete infrastructure loss
- No access to primary systems
- Extended outage

**Recovery Steps:**

1. **Activate Disaster Recovery Plan**
   - Notify team and customers
   - Activate backup infrastructure
   - Restore from offsite backups

2. **Restore Infrastructure**
   - Provision new infrastructure
   - Restore database from backup
   - Restore application code
   - Restore configuration

3. **Verify Recovery**
   - Test all critical functions
   - Verify data integrity
   - Monitor for errors

4. **Resume Service**
   - Start application
   - Monitor for errors
   - Notify customers of recovery

---

## Data Integrity Verification

### Daily Verification

**Automated Checks:**
```sql
-- Check data consistency
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT tenant_id) as total_tenants,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_users
FROM users;

-- Check for orphaned records
SELECT COUNT(*) FROM jobs j
LEFT JOIN tenants t ON j.tenant_id = t.id
WHERE t.id IS NULL;

-- Check for data anomalies
SELECT COUNT(*) FROM usage_events
WHERE timestamp > NOW() + INTERVAL '1 day';
```

### Weekly Verification

**Manual Checks:**
- Review backup integrity
- Verify backup retention
- Check data consistency
- Review audit logs

### Monthly Verification

**Comprehensive Checks:**
- Full database integrity check
- Backup restoration test
- Disaster recovery drill
- Review and update procedures

---

## Backup Retention Policy

### Standard Retention

- **Daily Backups:** 7 days
- **Weekly Backups:** 4 weeks
- **Monthly Backups:** 12 months

### Enterprise Retention

- **Daily Backups:** 30 days
- **Weekly Backups:** 12 weeks
- **Monthly Backups:** 7 years (compliance)

---

## Recovery Testing

### Monthly Recovery Test

**Procedure:**
1. Create test database
2. Restore from backup
3. Verify data integrity
4. Test critical functions
5. Document results

**Success Criteria:**
- Backup restores successfully
- Data integrity verified
- Critical functions work
- Recovery time < RTO (4 hours)

---

## Emergency Contacts

**Database Team:**
- **Primary:** [Database contact]
- **Secondary:** [Backup contact]

**Infrastructure Team:**
- **Primary:** [Infrastructure contact]
- **Secondary:** [Backup contact]

**On-Call Engineer:**
- **Rotation:** [On-call schedule]

---

## Prevention

### Regular Tasks

1. **Daily:**
   - Verify backups completed
   - Check backup integrity
   - Monitor database health

2. **Weekly:**
   - Review backup retention
   - Test backup restoration
   - Verify data consistency

3. **Monthly:**
   - Full disaster recovery drill
   - Review and update procedures
   - Test backup restoration

---

**Last Updated:** January 2026  
**Owner:** Engineering/Operations Team  
**Review Frequency:** Monthly
