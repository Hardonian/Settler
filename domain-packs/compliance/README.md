# Compliance Domain Pack

Industry-specific templates and workflows for compliance and regulatory requirements.

## Contents

### Policy Comparison Templates

- **Privacy Policy Comparison:** Compare privacy policies
- **Terms of Service Comparison:** Compare ToS versions
- **Policy Drift Detection:** Detect policy changes

### Compliance Workflows

- **GDPR Compliance Audit:** GDPR compliance checking
- **Data Retention Audit:** Data retention compliance
- **DPIA Generation:** Data Protection Impact Assessment

## Usage

```javascript
const { SettlerClient } = require("@settler/sdk");

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Use Compliance module
const diff = await client.compliance.comparePrivacyPolicies(policy1, policy2);

console.log("Policy differences:", diff);
```

## Templates

- `privacy-policy-comparison.json` - Privacy policy comparison
- `gdpr-compliance-audit.json` - GDPR compliance workflow
- `data-retention-audit.json` - Data retention audit

---

**For more information, see:** [Compliance Documentation](../../docs/VERTICAL_MODULES.md#compliance-module)
