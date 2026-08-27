-- Partitioning normalized_transactions by date (monthly)
-- PostgreSQL doesn't allow altering an existing non-partitioned table into a partitioned one directly.
-- We must rename, create partitioned, move data, and rename back.

-- 1. Partition normalized_transactions
ALTER TABLE normalized_transactions RENAME TO normalized_transactions_old;

CREATE TABLE normalized_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    ingestion_id UUID,
    source_id UUID,
    external_id TEXT,
    amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, date)
) PARTITION BY RANGE (date);

-- Create initial partitions for this year
CREATE TABLE normalized_transactions_y2026m01 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE normalized_transactions_y2026m02 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE normalized_transactions_y2026m03 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE normalized_transactions_y2026m04 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE normalized_transactions_y2026m05 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE normalized_transactions_y2026m06 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE normalized_transactions_y2026m07 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE normalized_transactions_y2026m08 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE normalized_transactions_y2026m09 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE normalized_transactions_y2026m10 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE normalized_transactions_y2026m11 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE normalized_transactions_y2026m12 PARTITION OF normalized_transactions FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE normalized_transactions_default PARTITION OF normalized_transactions DEFAULT;

-- Insert data from old table
INSERT INTO normalized_transactions SELECT * FROM normalized_transactions_old;

-- Drop old table
DROP TABLE normalized_transactions_old CASCADE;

-- Reapply indexes and constraints
CREATE INDEX idx_normalized_transactions_tenant ON normalized_transactions(tenant_id);
CREATE INDEX idx_normalized_transactions_ingestion ON normalized_transactions(ingestion_id);
CREATE INDEX idx_normalized_transactions_source ON normalized_transactions(source_id);
CREATE INDEX idx_normalized_transactions_date ON normalized_transactions(date);
CREATE INDEX idx_normalized_transactions_external_id ON normalized_transactions(tenant_id, external_id);

ALTER TABLE normalized_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_normalized_transactions ON normalized_transactions
    FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 2. Partition reconciliation_matches
ALTER TABLE reconciliation_matches RENAME TO reconciliation_matches_old;

CREATE TABLE reconciliation_matches (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    run_id UUID NOT NULL,
    source_transaction_id UUID NOT NULL,
    target_transaction_id UUID,
    match_type TEXT NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL,
    match_reason TEXT,
    amount_diff DECIMAL(19, 4),
    date_diff INTEGER,
    reviewed BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions
CREATE TABLE reconciliation_matches_y2026m01 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE reconciliation_matches_y2026m02 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE reconciliation_matches_y2026m03 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE reconciliation_matches_y2026m04 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE reconciliation_matches_y2026m05 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE reconciliation_matches_y2026m06 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE reconciliation_matches_y2026m07 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE reconciliation_matches_y2026m08 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE reconciliation_matches_y2026m09 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE reconciliation_matches_y2026m10 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE reconciliation_matches_y2026m11 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE reconciliation_matches_y2026m12 PARTITION OF reconciliation_matches FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
CREATE TABLE reconciliation_matches_default PARTITION OF reconciliation_matches DEFAULT;

-- Insert data
INSERT INTO reconciliation_matches SELECT * FROM reconciliation_matches_old;

DROP TABLE reconciliation_matches_old CASCADE;

CREATE INDEX idx_reconciliation_matches_tenant ON reconciliation_matches(tenant_id);
CREATE INDEX idx_reconciliation_matches_run ON reconciliation_matches(run_id);
CREATE INDEX idx_reconciliation_matches_source ON reconciliation_matches(source_transaction_id);
CREATE INDEX idx_reconciliation_matches_target ON reconciliation_matches(target_transaction_id);

ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_reconciliation_matches ON reconciliation_matches
    FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
