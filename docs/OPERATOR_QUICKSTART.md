# Settler Operator Quick Start

## What to Do in Your First 10 Minutes

### 1. Understand the Dashboard

Navigate to **Console** (`/console`). You'll see:

- **KPI cards**: Total API calls, active keys, recent activity
- **Onboarding wizard**: Follow the guided steps if this is your first visit
- **Quick actions**: Shortcuts to common tasks

### 2. Create an API Key

Go to **Console > API Keys** (`/console/api-keys`):

- Click "Create API Key"
- Name it (e.g., "Development" or "Production")
- Copy and store the key securely — it won't be shown again

### 3. Try the Playground

Go to **Console > Playground** (`/console/playground`):

- Paste sample data or use the pre-loaded examples
- Run a test reconciliation
- See how records are matched and mismatches are flagged

### 4. Review a Run

Go to **Console > Runs** (`/console/runs`):

- Each run shows: status, duration, match count, unmatched count, conflicts
- Click "Open detail" to see the full breakdown
- Summary state tells you if everything matched ("success") or needs attention ("review needed")

### 5. Check Exceptions

Go to **Console > Exceptions** (`/console/exceptions`):

- Filter by status, severity, or type
- Each exception explains what happened and why
- Actions: Resolve (confirmed fix), Investigate (needs more info), Ignore (noise)

---

## Key Concepts

| Term          | Meaning                                                              |
| ------------- | -------------------------------------------------------------------- |
| **Run**       | A single reconciliation execution comparing source vs target records |
| **Match**     | A source record successfully paired with a target record             |
| **Exception** | A discrepancy requiring operator review                              |
| **Tolerance** | How much difference is allowed before flagging a mismatch            |
| **Adapter**   | A connector to an external system (Stripe, Shopify, bank, etc.)      |

For the complete glossary, see **Console > Docs > Glossary** (`/console/docs/glossary`).

---

## Common Workflows

### Triage Exceptions

1. Open Exceptions page, filter to "Pending" status
2. Review each exception's type, severity, and description
3. For each: Resolve (if fixed), Investigate (if unclear), or Ignore (if noise)
4. All actions are logged in the audit trail

### Monitor Match Rate

1. Check the Runs page for recent run summaries
2. Look at the "Matched" vs "Unmatched" counts
3. If match rate drops, check the exception queue for new patterns
4. Adjust tolerance rules if needed

### Connect a New Integration

1. Go to Settings or use the Integrations page
2. Select the adapter (Stripe, Shopify, QuickBooks, etc.)
3. Authenticate via OAuth or enter API credentials
4. Wait for initial sync to complete
5. Create a reconciliation job using the new adapter

---

## Getting Help

- **In-app glossary**: `/console/docs/glossary`
- **API documentation**: `/console/docs`
- **Demo console**: `/demo/console` (no auth required)
- **Support**: `/support`
