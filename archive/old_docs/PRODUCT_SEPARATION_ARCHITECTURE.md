# Product Separation Architecture

## Overview

Settler.dev and AIAS are **two independent SaaS ventures** that share internal technical components but maintain complete separation in branding, pricing, UI, and business logic.

## Core Principle: Shared Engine, Separate Products

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared Edge AI Core                      │
│  (Brand-neutral technical components)                        │
│  - Device profiling                                          │
│  - Model optimization                                        │
│  - Inference engines                                         │
│  - Quantization utilities                                    │
│  - Runtime selection                                         │
│  - Deployment templates                                      │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │                              │
    ┌────▼────┐                    ┌────▼────┐
    │  AIAS   │                    │ Settler │
    │         │                    │   .dev  │
    │ Platform│                    │         │
    │         │                    │Product  │
    └─────────┘                    └─────────┘
```

## Separation Rules

### ✅ What CAN Be Shared

**Technical Components Only:**

- `/packages/edge-ai-core` - Brand-neutral engine
- Device profiling utilities
- Model optimization pipelines
- Inference execution layers
- Quantization algorithms
- Runtime selection logic
- Deployment templates
- Security utilities

### ❌ What CANNOT Be Shared

**Product-Specific:**

- UI components and pages
- Branding and marketing content
- Pricing structures
- Customer databases
- Authentication systems
- API documentation (public-facing)
- Marketing websites
- GTM flows
- Subscription logic
- Feature flags (product-level)

## Architecture Implementation

### 1. Shared Module: `@settler/edge-ai-core`

**Location**: `/workspace/packages/edge-ai-core/`

**Purpose**: Brand-neutral technical utilities

**Contents**:

- Device profiling
- Model optimization
- Inference engines
- Quantization
- Runtime selection
- Deployment
- Model distribution
- Security

**Usage**:

```typescript
// Both AIAS and Settler.dev can import
import { generateDeviceProfile, selectOptimalRuntime } from "@settler/edge-ai-core";
```

### 2. AIAS Integration (API-Based)

**Location**: `/workspace/packages/api/src/services/aias/client.ts`

**Pattern**: HTTP API client, NOT direct code dependency

**Why**:

- Settler.dev calls AIAS via HTTP API
- No code coupling
- Independent versioning
- Can be replaced with alternative provider

**Example**:

```typescript
// Settler.dev uses AIAS via API
const aiasClient = getAIASClient();
const result = await aiasClient.optimizeModel({ ... });
```

### 3. Settler.dev Edge AI Routes

**Location**: `/workspace/packages/api/src/routes/edge-ai.ts`

**Dependencies**:

- ✅ Uses `@settler/edge-ai-core` for utilities
- ✅ Uses AIAS API client for model optimization
- ❌ Does NOT import AIAS UI code
- ❌ Does NOT share AIAS branding
- ❌ Does NOT share AIAS pricing

### 4. Database Separation

**Settler.dev Tables**:

- `edge_nodes` - Settler.dev edge nodes
- `model_versions` - Settler.dev models
- `reconciliation_candidates` - Settler.dev matches
- `anomaly_events` - Settler.dev anomalies

**AIAS Tables** (separate):

- AIAS has its own database schema
- No shared tables
- No cross-product queries

### 5. Frontend Separation

**Settler.dev Frontend**:

- `/packages/web/src/app/edge-ai/` - Settler.dev Edge AI pages
- Settler.dev branding
- Settler.dev pricing display
- No AIAS branding

**AIAS Frontend** (separate):

- AIAS has its own frontend
- AIAS branding
- AIAS pricing
- No Settler.dev branding

## Integration Patterns

### Pattern 1: Shared Core Module

```typescript
// Both products import shared utilities
import { generateDeviceProfile } from "@settler/edge-ai-core";

// Settler.dev usage
const profile = generateDeviceProfile("server");
// ... Settler.dev-specific logic

// AIAS usage (in separate codebase)
const profile = generateDeviceProfile("server");
// ... AIAS-specific logic
```

### Pattern 2: API-Based Integration

```typescript
// Settler.dev calls AIAS via HTTP API
const aiasClient = getAIASClient();
const result = await aiasClient.optimizeModel({
  modelId: "settler-model-123",
  targetDevices: ["x86_64"],
  quantization: "int8",
  optimizationLevel: "balanced",
});
```

### Pattern 3: Independent Deployment

- Settler.dev deploys independently
- AIAS deploys independently
- No shared deployment pipeline
- No shared infrastructure (except optional shared services)

## Guardrails

### Code Review Checklist

When adding features, ensure:

- [ ] No AIAS branding in Settler.dev code
- [ ] No Settler.dev branding in AIAS code
- [ ] Shared code is in `edge-ai-core` (brand-neutral)
- [ ] API integration, not code coupling
- [ ] Separate database schemas
- [ ] Separate UI components
- [ ] Separate pricing logic
- [ ] Separate marketing content

### Testing Separation

- Settler.dev tests don't require AIAS code
- AIAS tests don't require Settler.dev code
- Shared module tests are independent
- Integration tests use API mocks

## Future Exit Strategy Protection

This architecture enables:

1. **Independent Fundraising**: Each product can raise separately
2. **Independent Acquisitions**: Products can be sold separately
3. **Shared IP Licensing**: Core engine can be licensed
4. **HoldCo Strategy**: Both products under one holding company
5. **Product Spin-offs**: Either product can be spun out

## Documentation

### Internal Documentation

- Can mention both products
- Can explain shared components
- Can show integration patterns

### External Documentation

- Settler.dev docs: Settler.dev only
- AIAS docs: AIAS only
- No cross-linking in public docs
- No shared marketing materials

## Examples

### ✅ Correct: Using Shared Core

```typescript
// Settler.dev route
import { generateDeviceProfile } from '@settler/edge-ai-core';

export async function getDeviceProfile() {
  const profile = generateDeviceProfile();
  // Settler.dev-specific logic
  return { profile, settlerMetadata: {...} };
}
```

### ❌ Incorrect: Direct Code Coupling

```typescript
// DON'T DO THIS
import { AIASDashboard } from "@aias/web-components";
import { AIASPricing } from "@aias/pricing";

// This creates coupling and breaks separation
```

### ✅ Correct: API Integration

```typescript
// Settler.dev uses AIAS via API
const aiasClient = getAIASClient();
const result = await aiasClient.optimizeModel({...});
```

### ❌ Incorrect: Shared UI

```typescript
// DON'T DO THIS
import { SharedEdgeAIDashboard } from "@shared/ui";

// UI must be product-specific
```

## Summary

- **Shared**: Technical engine components (`edge-ai-core`)
- **Separate**: UI, branding, pricing, marketing, databases
- **Integration**: API-based, not code-based
- **Goal**: Product independence with engineering efficiency

This architecture protects both ventures while enabling code reuse where it makes sense.
