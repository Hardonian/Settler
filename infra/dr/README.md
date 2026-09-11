# Settler Disaster Recovery & Point-in-Time Recovery (PITR)

## Architecture

Settler stores high-throughput transaction journals and evidence records in PostgreSQL with Row-Level Security (RLS) and writes double-entry postings to TigerBeetle.

### Continuous Archiving Strategy
- **Base Backups**: Automated full physical base backups taken every 24 hours.
- **WAL Archiving**: Continuous Write-Ahead Log (WAL) shipping to geo-replicated object storage with immutable Object Lock (WORM).
- **RPO (Recovery Point Objective)**: $\le 10\text{ seconds}$.
- **RTO (Recovery Time Objective)**: $\le 15\text{ minutes}$.

### Executing a Drill
```bash
./infra/dr/pitr-drill.sh "2026-09-11 12:00:00 UTC"
```
