# Settler Financial Reconciliation Workflows Analysis

## Overview

This document outlines the current financial and reconciliation workflows in the Settler backend, focusing on reconciliation processes, financial transaction handling, ledger systems, money movement tracking, key services, event triggers, and audit mechanisms.

## 1. Existing Reconciliation Processes

### Recon Core Engine (Phase I)

- **Location**: `packages/api/src/services/recon-core/`
- **Core Components**:
  - `recon-core-engine.ts`: Unified deterministic reconciliation engine
  - Performs matching between source and target transactions
  - Supports multiple reconciliation strategies (deterministic, ML-enhanced)
  - Generates reconciliation results with match/unmatched counts
  - Emits lifecycle events (started, completed, failed)

### FinTech Module - Ledger Reconciliation (Phase IV)

- **Location**: `packages/api/src/services/verticals/fintech/ledger-recon.ts`
- **LedgerReconService**:
  - Reconciles ledger entries using the Recon Core Engine
  - Matches entries by date, amount, account, reference
  - Returns matched/unmatched entries and balance drift
  - Includes accounting drift detection functionality

### Automated Review Process

- **Location**: `packages/api/src/services/reconciliation/`
- **Services**:
  - `automated-review.ts`: Implements industry-standard automated review
  - `automated-review-trigger.ts`: Triggers review after reconciliation completion
  - **Process**:
    1. After reconciliation completes, trigger automated review
    2. Review matches based on confidence thresholds:
       - ≥0.95: Auto-approve (SOC 2 compliant)
       - 0.80-0.94: Rule-based resolution
       - 0.60-0.79: Automated exception handling
       - <0.60: System flagged (NOT human review)
    3. All actions logged to audit trail
    4. Eliminates manual intervention while maintaining compliance

### Multi-Source Reconciliation

- **Location**: `packages/api/src/services/multi-source-reconciliation.ts`
- Handles reconciliation with multiple source adapters against single target
- Detects conflicts (same transaction from multiple sources)
- Groups transactions by external ID or amount+date+description

### Graph-Based Reconciliation

- **Location**: `packages/api/src/services/reconciliation-graph/`
- Real-time graph of transactions and relationships
- Each transaction is a node; reconciliation is edge relationships
- Updates continuously as new transactions arrive
- Supports stream processing for real-time updates

## 2. Financial Transaction Handling

### Normalized Transaction Schema

- **Location**: `prisma/schema.prisma` (normalized_transactions model)
- Fields:
  - `id`: UUID
  - `ingestion_id`: Source ingestion reference
  - `tenant_id`: Multi-tenancy
  - `source_id`: Adapter source
  - `external_id`: External transaction ID
  - `amount`: Decimal (15,6)
  - `currency`: String
  - `date`: DateTime
  - `description`: String
  - `category`: String (optional)
  - `payment_method`: String (optional)
  - `reference`: String (optional)
  - `metadata`: JSON
  - `aggregated`: Boolean flag

### Ingestion Services

- **Stripe Connector** (`packages/api/src/services/ingestion/stripe-connector.ts`):
  - Fetches Stripe balance transactions
  - Normalizes to internal format (amount in dollars, uppercase currency)
  - Handles both transactions and payouts
- **CSV Importer** (`packages/api/src/services/ingestion/csv-importer.ts`):
  - Maps CSV columns to normalized transaction format
  - Handles date, amount, currency, description, category, payment method
- **Ingestion Service** (`packages/api/src/services/ingestion/ingestion-service.ts`):
  - Creates normalized transactions in database
  - Supports batch creation for performance

### Currency Conversion

- **Location**: `packages/api/src/services/currency-conversion.ts`
- Converts amounts between currencies
- Logs conversions for audit trail
- Used in reconciliation to handle multi-currency scenarios

### Receipt Matching

- **Location**: `packages/api/src/services/receipt-matching.ts`
- Matches receipts to transactions based on:
  - Amount (within tolerance)
  - Date (within window)
  - Merchant name similarity
  - Returns confidence-scored matches

## 3. Ledger-Like Systems

### LedgerReconService Interface

- **Location**: `packages/api/src/services/verticals/fintech/ledger-recon.ts`
- **LedgerEntry**:
  ```typescript
  export interface LedgerEntry {
    id: string;
    date: Date;
    account: string;
    debit: number;
    credit: number;
    description: string;
    reference?: string;
  }
  ```
- **LedgerReconResult**:
  ```typescript
  export interface LedgerReconResult {
    matched: Array<{
      source: LedgerEntry;
      target: LedgerEntry;
      confidence: number;
    }>;
    unmatchedSource: LedgerEntry[];
    unmatchedTarget: LedgerEntry[];
    balanceDrift: number;
  }
  ```

### Accounting Drift Detection

- Calculates drift: `actualBalance - expectedBalance`
- Computes percentage: `(drift / |expectedBalance|) * 100`
- Severity levels:
  - Low: <1%
  - Medium: 1-5%
  - High: 5-10%
  - Critical: >10%

## 4. Money Movement Tracking

### Transaction Relationships

- **Reconciliation Matches Table** (`prisma/schema.prisma`):
  - Links source and target transactions
  - Tracks match type (exact/fuzzy/manual/unmatched)
  - Stores confidence score
  - Records amount/date differences
  - Audit fields (reviewed, reviewedBy, reviewedAt, metadata)

### Balance Tracking

- **Reconciliation Results** (`prisma/schema.prisma` ReconResult model):
  - `totalAmountSource`: Decimal (15,2)
  - `totalAmountTarget`: Decimal (15,2)
  - `totalAmountMatched`: Decimal (15,2)
  - `totalAmountUnmatched`: Decimal (15,2)
  - `currency`: String
  - `confidenceAvg/Min/Max`: Decimal (5,4)

### Balance Drift Calculation

- In LedgerReconService: `balanceDrift` field in result
- Represents net difference between source and target totals
- Used for drift detection and variance analysis

## 5. Key Services in Financial Workflows

### Core Reconciliation Services

1. **LedgerReconService** (fintech/ledger-recon.ts):
   - Main ledger reconciliation interface
   - Uses Recon Core Engine for matching
   - Provides drift detection

2. **ReconciliationMatcher** (ingestion/reconciliation-matcher.ts):
   - Matches source transactions to targets
   - Handles currency, date, amount tolerances
   - Integrates cross-customer intelligence
   - Stores matches in database

3. **MultiSourceReconciliationService** (multi-source-reconciliation.ts):
   - Handles multiple source adapters
   - Detects duplicate transactions across sources
   - Consolidates matches

4. **ReceiptMatchingService** (receipt-matching.ts):
   - Matches receipts to transactions
   - Uses amount, date, merchant similarity scoring

### Supporting Services

5. **AutomatedReviewService** (reconciliation/automated-review.ts):
   - Industry-standard automated review process
   - Eliminates manual intervention
   - SOC 2, PCI-DSS, GAAP/IFRS compliant

6. **AutomatedReviewTriggerService** (reconciliation/automated-review-trigger.ts):
   - Triggers review after reconciliation completion
   - Scheduled job processor (every 5 minutes)
   - Quality threshold checking

7. **IntegrityService** (reconciliation/integrity.ts):
   - Hash-chain verification for audit trails
   - SHA-256 based integrity chaining
   - Tamper-evident reconciliation records

8. **QualityMonitorService** (reconciliation/quality-monitor.ts):
   - Monitors reconciliation quality metrics
   - Generates quality reports
   - Triggers alerts when thresholds exceeded

9. **ProgressTrackingService** (progress-tracking.ts):
   - Real-time progress tracking for jobs
   - Estimates completion time
   - Tracks transactions processed

10. **CurrencyConversionService** (currency-conversion.ts):
    - Handles multi-currency reconciliation
    - Logs conversions for audit

### Event Intelligence Services

11. **LearningLoopsService** (learning-loops.ts):
    - Learns from reconciliation outcomes
    - Improves matching patterns over time
    - Learns validation patterns

12. **EnhancedCrossCustomerIntelligence** (matching/enhanced-cross-customer-intelligence.ts):
    - Aggregates anonymized patterns across customers
    - Proprietary data moat for matching accuracy

## 6. Events and Triggers

### Reconciliation Lifecycle Events

- **Emitted by Recon Core Engine**:
  - `reconciliation_run_started`
  - `reconciliation_run_completed`
  - `reconciliation_run_failed`

### Automated Review Triggers

1. **Post-Reconciliation Trigger**:
   - Called automatically after reconciliation completes
   - Verifies run status is "completed"
   - Executes autoReviewRun()
   - Checks quality thresholds
   - Generates quality report

2. **Scheduled Review Processor**:
   - Runs every 5 minutes (scheduledReviewProcessor)
   - Processes pending reviews from last 24 hours
   - Limited to 100 runs per execution

### Webhook Events

- **Location**: `packages/api/src/services/webhooks/event-registry.ts`
- Events:
  - `reconciliation.started`
  - `reconciliation.completed`
  - `reconciliation.failed`
  - `reconciliation.partial`
  - `job.created`, `job.updated`, `job.deleted`

### Quality Threshold Triggers

- **Location**: `reconciliation/quality-monitor.ts`
- Checks metrics after reconciliation:
  - Match rate thresholds
  - Confidence score thresholds
  - Unmatched transaction thresholds
  - Drift detection thresholds

## 7. Audit Trails and Reporting Mechanisms

### Comprehensive Audit Trail

- **Reconciliation Audits Table** (`prisma/schema.prisma` ReconAudit model):
  - Tracks all changes to reconciliation entities
  - Before/after state snapshots
  - User/IP/user agent tracking
  - JSON metadata for extensibility
  - Linked to reconJobs and reconResults

### Integrity Verification

- **Hash-Chain Mechanism** (`reconciliation/integrity.ts`):
  - Each reconciliation run gets a hash
  - Chain hash links to previous run's hash
  - Tamper-evident sequence of reconciliations
  - SHA-256 algorithm
  - Schema versioning for future compatibility

### Automated Audit Logging

- **In Automated Review Process** (`automated-review.ts`):
  - Logs audit trail for each auto-reviewed match
  - Captures before/after states
  - Records action taken and resolution rule
  - Includes metadata (confidence, match type, diffs)

### Reporting and Export Services

1. **Export Service** (`ingestion/export-service.ts`):
   - Exports matched transactions to CSV (lossy)
   - Exports unmatched transactions to CSV
   - Exports all transactions to CSV
   - Exports reconciliation report to CSV
   - Excludes ML-derived fields for compliance

2. **PDF Export Service** (`export/pdf-generator.ts`):
   - Generates PDF reports for reconciliation data
   - Includes graph-based visualization data

3. **Quality Reporting**:
   - Generates quality reports post-reconciliation
   - Includes metrics: match rate, confidence avg, drift
   - Flags exceptions requiring attention

4. **Review Statistics**:
   - Tracks reviewed/auto-approved/rule-resolved counts
   - Monitors exception handling vs system flagging
   - Calculates average confidence scores

### Compliance Features

- **SOC 2**: Complete audit trail with before/after states
- **PCI-DSS**: Secure automated processing (no manual handling)
- **GAAP/IFRS**: Multi-field matching with tolerances
- **Deterministic Guarantee**: Reproducible reconciliation runs
- **Non-Repudiation**: Hash-chain integrity verification

## Key Architectural Patterns

### Phase-Based Implementation

- **Phase I**: Foundational Recon Core Engine
- **Phase II**: Billing Expansion
- **Phase III**: Intelligence & Learning Systems
- **Phase IV**: Vertical Modules (FinTech, LegalTech, etc.)

### Separation of Concerns

- **Ingestion Layer**: Data normalization from external sources
- **Matching Layer**: Transaction-to-transaction reconciliation
- **Review Layer**: Automated review and exception handling
- **Integrity Layer**: Audit trails and tamper evidence
- **Reporting Layer**: Export and visualization services
- **Intelligence Layer**: Learning and pattern detection

### Data Flow

1. External data ingested → Normalized transactions
2. Transactions matched → Reconciliation matches stored
3. Reconciliation completed → Automated review triggered
4. Review results → Audit trail updated
5. Quality metrics → Reports generated
6. Integrity hashes → Chain verification possible

## Recommendations for Enhancement

Based on the analysis, the financial reconciliation workflows are robust and comprehensive. Potential enhancements could include:

1. **Real-Time Dashboard**: Live reconciliation progress visualization
2. **Advanced ML Models**: Improved matching accuracy for complex patterns
3. **Extended Vertical Modules**: Additional industry-specific templates
4. **Enhanced Reporting**: Customizable financial statement generation
5. **Cross-Border Support**: Improved multi-currency and regulatory compliance
6. **API Enhancements**: More granular control over reconciliation parameters

The current implementation provides a solid foundation for financial reconciliation with strong audit capabilities, automated processing, and extensibility for future enhancements.
