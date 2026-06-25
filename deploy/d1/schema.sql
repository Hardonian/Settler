CREATE TABLE IF NOT EXISTS audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_name TEXT NOT NULL,
    repo_url TEXT,
    audited_at TEXT NOT NULL,
    overall_score REAL,
    critical_findings INTEGER DEFAULT 0,
    high_findings INTEGER DEFAULT 0,
    medium_findings INTEGER DEFAULT 0,
    total_findings INTEGER DEFAULT 0,
    report_json TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    recommendation TEXT,
    resource_type TEXT,
    resource_name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id INTEGER NOT NULL,
    format TEXT DEFAULT 'markdown',
    content TEXT,
    delivered_via TEXT,
    delivered_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audits(workspace_name);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_finding_audit ON findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_finding_severity ON findings(severity);