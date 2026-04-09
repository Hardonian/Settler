# Legal Domain Pack

Industry-specific templates and workflows for legal tech.

## Contents

### Contract Diff Templates

- **Contract Version Comparison:** Compare contract versions
- **Clause Extraction:** Extract key clauses from contracts
- **Obligation Mapping:** Map obligations between contracts

### Workflows

- **Contract Reconciliation Workflow:** Automated contract comparison
- **Risk Assessment Workflow:** AI-powered risk scoring

## Usage

```javascript
const { SettlerClient } = require("@settler/sdk");

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Use LegalTech module
const diff = await client.legaltech.diffContracts(contract1, contract2);

console.log("Contract differences:", diff);
```

## Templates

- `contract-diff-template.json` - Contract comparison template
- `obligation-mapping-template.json` - Obligation mapping template
- `risk-scoring-workflow.json` - Risk assessment workflow

---

**For more information, see:** [LegalTech Documentation](../../docs/VERTICAL_MODULES.md#legaltech-module)
