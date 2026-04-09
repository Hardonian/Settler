# Governance Model

**Last Updated:** 2025-01-20  
**Status:** Production Reality  
**Purpose:** Explicit governance rules for OSS ↔ Platform boundaries

## Overview

This document defines **governance rules** for managing the boundary between open-source components and the proprietary platform. It prevents drift and ensures clear boundaries.

**Philosophy:** No "gentleman's agreements." Governance must be mechanical, not social.

---

## OSS ↔ Platform Boundaries

### Open Source Components

**What Is Open Source:**

- `packages/protocol` - MIT License (protocol definitions)
- `packages/react-settler` - Dual licensed (MIT for OSS, Commercial for paid features)
- SDKs (TypeScript, Python, Ruby, Go) - MIT License
- Documentation (public docs) - CC BY 4.0

**Purpose:**

- Enable developer adoption
- Provide integration tools
- Build developer community
- Standardize protocols

**Limitations:**

- OSS components are incomplete without platform
- OSS components do not include proprietary logic
- OSS components do not include platform-specific features

---

### Proprietary Platform

**What Is Proprietary:**

- Core reconciliation engine
- Receipt parsing AI/ML models
- Multi-tenant infrastructure
- Billing and subscription logic
- Admin/operator tools
- Enterprise features

**Purpose:**

- Provide core value proposition
- Enable monetization
- Protect competitive advantages
- Ensure platform security

**Limitations:**

- Proprietary components are not open source
- Proprietary components require platform access
- Proprietary components are not self-hostable

---

## Governance Rules

### Rule 1: No Proprietary Logic in OSS

**Rule:** OSS components must not contain proprietary logic.

**Enforcement:**

- ✅ Code review checks for proprietary logic
- ✅ Automated tests verify OSS components
- ✅ CI/CD blocks proprietary code in OSS components

**Examples:**

- ❌ Proprietary matching algorithms in OSS
- ❌ Proprietary AI/ML models in OSS
- ❌ Proprietary billing logic in OSS
- ✅ Protocol definitions in OSS
- ✅ SDKs in OSS
- ✅ Documentation in OSS

---

### Rule 2: OSS Components Are Incomplete

**Rule:** OSS components must be incomplete without platform.

**Enforcement:**

- ✅ OSS components require platform API keys
- ✅ OSS components cannot function standalone
- ✅ OSS components are integration tools, not complete solutions

**Examples:**

- ✅ SDKs require platform API keys
- ✅ Protocol definitions require platform implementation
- ✅ React components require platform backend
- ❌ OSS components cannot function standalone
- ❌ OSS components cannot replace platform

---

### Rule 3: Clear Licensing Boundaries

**Rule:** Licensing must be clear and unambiguous.

**Enforcement:**

- ✅ OSS components use permissive licenses (MIT)
- ✅ Proprietary components are not open source
- ✅ Dual-licensed components clearly marked
- ✅ License files in all packages

**Examples:**

- ✅ `packages/protocol` - MIT License
- ✅ `packages/react-settler` - Dual licensed (MIT/Commercial)
- ✅ SDKs - MIT License
- ❌ Proprietary components - Not open source

---

### Rule 4: No Accidental Leakage

**Rule:** Proprietary logic must not leak into OSS components.

**Enforcement:**

- ✅ Code review checks for leakage
- ✅ Automated tests verify boundaries
- ✅ CI/CD blocks accidental leakage

**Examples:**

- ❌ Proprietary algorithms in OSS
- ❌ Proprietary API keys in OSS
- ❌ Proprietary configuration in OSS
- ✅ Public APIs in OSS
- ✅ Protocol definitions in OSS

---

### Rule 5: Sync Rules Are Explicit

**Rule:** OSS ↔ Platform sync rules must be explicit and automated.

**Enforcement:**

- ✅ Automated sync from platform to OSS (protocol definitions)
- ✅ Manual review for OSS to platform changes
- ✅ Versioning ensures compatibility

**Examples:**

- ✅ Protocol definitions synced from platform to OSS
- ✅ SDKs updated when APIs change
- ✅ Documentation synced from platform to OSS
- ❌ Proprietary logic synced to OSS

---

## Sync Procedures

### Platform → OSS Sync

**What Syncs:**

- Protocol definitions
- API schemas
- SDK updates
- Documentation updates

**Process:**

1. Changes made in platform
2. Automated sync to OSS (if applicable)
3. OSS components updated
4. Tests run
5. OSS components published

**Frequency:**

- Protocol definitions: Real-time (automated)
- SDKs: On API changes (automated)
- Documentation: On doc changes (automated)

---

### OSS → Platform Sync

**What Syncs:**

- Bug fixes
- Security patches
- Performance improvements
- Documentation improvements

**Process:**

1. Changes made in OSS
2. Manual review for proprietary logic
3. Platform components updated
4. Tests run
5. Platform components deployed

**Frequency:**

- Bug fixes: As needed (manual review)
- Security patches: Immediate (manual review)
- Performance improvements: As needed (manual review)

---

## Versioning

### Version Strategy

**OSS Components:**

- Semantic versioning (major.minor.patch)
- Independent versioning from platform
- Backward compatibility maintained

**Platform:**

- Semantic versioning (major.minor.patch)
- API versioning (/api/v1/, /api/v2/)
- Backward compatibility maintained

**Sync:**

- OSS components versioned independently
- Platform versioned independently
- Compatibility ensured through versioning

---

## Testing & Verification

### OSS Component Testing

**Tests:**

- Unit tests (OSS components)
- Integration tests (OSS + Platform)
- Compatibility tests (version compatibility)

**Verification:**

- ✅ No proprietary logic in OSS
- ✅ OSS components incomplete without platform
- ✅ Licensing boundaries clear
- ✅ No accidental leakage

---

### Platform Component Testing

**Tests:**

- Unit tests (platform components)
- Integration tests (platform + OSS)
- End-to-end tests (full system)

**Verification:**

- ✅ Proprietary logic protected
- ✅ Platform functionality intact
- ✅ OSS integration works
- ✅ No OSS dependencies break platform

---

## Compliance & Legal

### License Compliance

**OSS Licenses:**

- MIT License (permissive)
- CC BY 4.0 (documentation)
- Dual licenses (MIT/Commercial)

**Proprietary Licenses:**

- Proprietary (all rights reserved)
- Commercial licenses (enterprise)

**Compliance:**

- ✅ License files in all packages
- ✅ License compatibility verified
- ✅ Attribution requirements met
- ✅ Commercial licenses enforced

---

### Export Control

**OSS Components:**

- Export-controlled if applicable
- Compliance with export regulations
- No encryption restrictions (MIT License)

**Proprietary Components:**

- Export-controlled if applicable
- Compliance with export regulations
- Encryption restrictions may apply

---

## Summary

Settler's governance model:

- ✅ **OSS Components:** Protocol definitions, SDKs, documentation (MIT License)
- ✅ **Proprietary Platform:** Core engine, AI/ML models, multi-tenant infrastructure
- ✅ **Governance Rules:** No proprietary logic in OSS, OSS incomplete without platform, clear licensing, no accidental leakage, explicit sync rules
- ✅ **Sync Procedures:** Platform → OSS (automated), OSS → Platform (manual review)
- ✅ **Versioning:** Independent versioning, semantic versioning, backward compatibility
- ✅ **Testing & Verification:** OSS component testing, platform component testing, compliance verification
- ✅ **Compliance & Legal:** License compliance, export control, commercial licenses

**Key Principles:**

- No "gentleman's agreements"
- Governance must be mechanical, not social
- Clear boundaries prevent drift
- Automated enforcement where possible

**When in doubt, OSS is incomplete without platform. Proprietary logic stays proprietary.**
