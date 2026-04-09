# EdTech Domain Pack

Industry-specific templates and workflows for education technology.

## Contents

### QTI Validation Templates

- **QTI 2.1 Validator:** Validate QTI 2.1 format
- **QTI 3.0 Validator:** Validate QTI 3.0 format
- **Learning Outcome Mapping:** Map learning outcomes

### LMS Compatibility

- **Canvas Compatibility:** Canvas LMS compatibility checks
- **Blackboard Compatibility:** Blackboard compatibility checks
- **Moodle Compatibility:** Moodle compatibility checks

## Usage

```javascript
const { SettlerClient } = require("@settler/sdk");

const client = new SettlerClient({
  apiKey: process.env.SETTLER_API_KEY,
});

// Use EdTech module
const result = await client.edtech.validateQTI(qtiContent);

console.log("QTI validation:", result);
```

## Templates

- `qti-validator-template.json` - QTI validation template
- `learning-outcome-mapping.json` - Learning outcome mapping
- `lms-compatibility-check.json` - LMS compatibility workflow

---

**For more information, see:** [EdTech Documentation](../../docs/VERTICAL_MODULES.md#edtech-module)
