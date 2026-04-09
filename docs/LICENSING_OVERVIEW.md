# Licensing Overview

**Last Updated:** January 2026

This document explains the licensing structure of the Settler platform, clarifying what is open source, what is proprietary, and what rights you have to use, modify, and distribute different components.

---

## Overview

Settler uses a **dual-licensing model** with clear boundaries between open source and proprietary components:

- **Open Source Components:** Licensed under MIT License, free to use and modify
- **Proprietary Platform:** Settler Enterprise API, licensed under Proprietary License
- **Commercial Features:** Require paid subscription (Commercial License Agreement)

---

## Open Source Components

### What is Open Source?

The following components are licensed under the **MIT License** and are free to use, modify, and distribute:

1. **`@settler/protocol`** (`packages/protocol`)
   - Core protocol types and interfaces
   - Validation utilities
   - Security utilities
   - Telemetry types
   - **License:** MIT License (see `packages/protocol/LICENSE`)

2. **React.Settler OSS Components** (`packages/react-settler`)
   - Basic React components
   - Core UI components
   - Config compiler
   - Basic validation and security
   - **License:** MIT License (OSS tier)

### What You Can Do with OSS Components

✅ **Allowed:**

- Use in commercial products
- Modify the source code
- Distribute modified or unmodified versions
- Create derivative works
- Use in proprietary software
- Sell products that include OSS components

✅ **Required:**

- Include the MIT License notice
- Include copyright notice
- Include the original license text

### What You Cannot Do with OSS Components

❌ **Not Allowed:**

- Remove copyright notices
- Remove license notices
- Claim you wrote the software
- Use Settler trademarks without permission

---

## Proprietary Components

### Settler Enterprise API

The **Settler Enterprise API** (`packages/api`, `packages/web`) is proprietary software licensed under a Proprietary License (see root `/LICENSE`).

**What This Includes:**

- Core API server
- Developer Console
- Managed SaaS platform
- Enterprise features

**License Terms:**

- Licensed, not sold
- Non-transferable
- Non-exclusive
- Subject to Terms of Service

**What You Can Do:**
✅ Access and use the API via subscription
✅ Integrate with your applications
✅ Use according to Terms of Service

**What You Cannot Do:**
❌ Copy, modify, or create derivative works
❌ Reverse engineer or decompile
❌ Resell or redistribute
❌ Use to compete with Settler
❌ Remove proprietary notices

---

## Commercial Features (React.Settler)

React.Settler uses a **dual-licensing model**:

### OSS Tier (Free)

**License:** MIT License

**Includes:**

- Core protocol types
- Basic React components
- Config compiler
- Basic validation and security
- Mobile and accessibility support

**Usage:** Free forever, no restrictions beyond MIT License terms

### Commercial Tier ($99/month or $990/year)

**License:** Commercial License Agreement (see `/LEGAL/COMMERCIAL_LICENSE.md`)

**Includes:**

- All OSS features
- Platform integrations (Shopify, Stripe, MCP)
- Virtualized tables
- Advanced telemetry
- Audit logging
- Webhook manager
- Advanced export features

**Usage:** Requires paid subscription, non-transferable, single organization use

### Enterprise Tier (Custom Pricing)

**License:** Enterprise License Agreement (custom contract)

**Includes:**

- All Commercial features
- SSO and RBAC
- Custom integrations
- White-label options
- Dedicated support (24/7)
- SLA guarantees

**Usage:** Governed by separate Enterprise Agreement

---

## License Tiers Summary

| Component                      | OSS Tier         | Commercial Tier | Enterprise Tier    |
| ------------------------------ | ---------------- | --------------- | ------------------ |
| **@settler/protocol**          | ✅ MIT (Free)    | ✅ MIT (Free)   | ✅ MIT (Free)      |
| **React.Settler (OSS)**        | ✅ MIT (Free)    | ✅ MIT (Free)   | ✅ MIT (Free)      |
| **React.Settler (Commercial)** | ❌ Not Available | ✅ $99/month    | ✅ Included        |
| **Settler Enterprise API**     | ❌ Not Available | ✅ Subscription | ✅ Custom Contract |

---

## Self-Hosting

### OSS Components

✅ **You can self-host OSS components** (MIT License allows this)

**Includes:**

- `@settler/protocol` - Can be self-hosted
- React.Settler OSS components - Can be self-hosted

### Proprietary Components

❌ **You cannot self-host proprietary components** without an Enterprise Agreement

**Includes:**

- Settler Enterprise API - Managed SaaS only (unless Enterprise self-hosting agreement)
- Commercial features of React.Settler - Require subscription

**Exception:** Enterprise customers may negotiate self-hosting rights in Enterprise Agreement

---

## Trademarks

**Settler**, **Settler Enterprise**, **React.Settler**, and related marks are trademarks of Settler, Inc.

**What You Can Do:**
✅ Use trademarks to refer to Settler products (fair use)
✅ Use in documentation when referring to Settler products

**What You Cannot Do:**
❌ Use trademarks in your product names
❌ Use trademarks to imply endorsement without permission
❌ Register similar trademarks

---

## License Compatibility

### Using Settler Components in Your Project

**OSS Components (MIT License):**

- ✅ Compatible with any license (MIT is permissive)
- ✅ Can be used in proprietary software
- ✅ Can be used in GPL projects (MIT is GPL-compatible)

**Proprietary Components:**

- ❌ Cannot be combined with other licenses
- ❌ Subject to Proprietary License terms only

---

## Questions?

### License Questions

- **Email:** legal@settler.dev
- **Commercial Licensing:** enterprise@settler.io
- **OSS Questions:** See `/packages/protocol/LICENSE` or `/packages/react-settler/LICENSE`

### Documentation

- **Terms of Service:** `/LEGAL/TERMS_OF_SERVICE.md`
- **Commercial License:** `/LEGAL/COMMERCIAL_LICENSE.md`
- **Privacy Policy:** `/LEGAL/PRIVACY_POLICY.md`

---

## License Files

- **Root LICENSE:** Proprietary License (Settler Enterprise API)
- **packages/protocol/LICENSE:** MIT License
- **packages/react-settler/LICENSE:** MIT License (OSS) + Commercial License (Commercial features)

---

**This licensing overview is provided for informational purposes. For legal questions, consult with legal counsel or contact legal@settler.dev.**
