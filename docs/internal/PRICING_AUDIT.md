# Pricing & Monetization Audit - Phase 4A

**Date**: 2025-01-XX  
**Purpose**: Identify and remove pricing clichés, feature matrices, and misaligned models

## Current Pricing Structure

### Existing Plans

1. **Free** ($0)
   - 1,000 reconciliations/month
   - 100 receipt parses/month
   - 100k feature flag evaluations/month
   - 2 platform adapters
   - 7-day log retention
   - Community support

2. **Commercial** ($99/month)
   - 100,000 reconciliations/month
   - 10,000 receipt parses/month
   - 1M feature flag evaluations/month
   - 100k AI tokens/month
   - Unlimited adapters
   - 30-day log retention
   - Email support

3. **Enterprise** (Custom)
   - 1M+ reconciliations/month
   - 100k+ receipt parses/month
   - 10M+ feature flag evaluations/month
   - 1M AI tokens/month
   - Unlimited log retention
   - Dedicated support (SLA)
   - SSO & SAML
   - RBAC
   - White-label options

## Violations Identified

### ❌ Builder Fallacy Violations

1. **Feature-Checklist Pricing**
   - Plans defined by feature lists
   - "AI tokens" as separate line item
   - "Feature flag evaluations" as separate metric
   - Violates: "Pricing must scale with reliance, not curiosity"

2. **Free / Pro / Enterprise Cliché**
   - Classic SaaS tier structure
   - "Enterprise" as catch-all
   - Violates: "No feature matrices"

3. **Underpriced Core Behavior**
   - Reconciliation is core value, but priced low
   - $99 for 100k reconciliations = $0.001 per reconciliation
   - Violates: "Pricing must scale with reliance"

4. **Hidden Gating**
   - AI tokens as add-on (not core)
   - Feature flags separate from reconciliation
   - Violates: "No hidden or aspirational gating"

5. **Vanity Plans**
   - "Free" plan exists but doesn't build trust
   - "Enterprise" is vague
   - Violates: "Plans must be explainable in one sentence"

### ❌ Product Truth Violations

1. **Exposes Internals**
   - "AI tokens" exposes AI mechanics
   - "Feature flag evaluations" exposes internals
   - Violates: "Never mention AI models, pipelines, agents"

2. **Configuration Burden**
   - Plans imply configuration (adapters, retention)
   - Violates: "No configuration burden"

3. **Doesn't Scale with Reliance**
   - Pricing based on volume, not reliance
   - Doesn't reflect trust transfer
   - Violates: "Pricing must scale with reliance"

## What Pricing Should Reflect

### Core Value Drivers

1. **Reconciliation Volume** ✅ (keep)
   - Core behavior
   - Scales with business size
   - Reflects reliance

2. **Connected Systems** ✅ (keep)
   - More systems = more reliance
   - More complexity = more value

3. **Exception Throughput** ⚠️ (needs definition)
   - Exceptions require supervision
   - More exceptions = more reliance
   - But: Should be automatic, not manual

4. **Data Retention** ⚠️ (needs rethinking)
   - Compliance requirement
   - But: Should be automatic, not gated

5. **Automation Intensity** ✅ (keep)
   - Continuous vs batch
   - Real-time vs periodic
   - Reflects reliance

### What Should NOT Be Priced

1. **AI Tokens** ❌
   - Exposes internals
   - Not user-facing value
   - Should be included, not separate

2. **Feature Flag Evaluations** ❌
   - Exposes internals
   - Not core to reconciliation
   - Should be included

3. **Platform Adapters** ⚠️
   - Should be unlimited by default
   - Not a pricing dimension

4. **Log Retention** ⚠️
   - Compliance requirement
   - Should be automatic
   - Not a pricing dimension

## Recommended Pricing Dimensions

### Option 1: Reconciliation Volume + Systems
- Base: Reconciliation volume
- Multiplier: Number of connected systems
- Simple, clear, scales with reliance

### Option 2: Reconciliation Volume + Automation Depth
- Base: Reconciliation volume
- Multiplier: Real-time vs batch, continuous vs periodic
- Reflects reliance on system behavior

### Option 3: Reconciliation Volume + Exception Supervision
- Base: Reconciliation volume
- Multiplier: Exception throughput (but automatic)
- Reflects system complexity

### Option 4: Pure Volume-Based
- Single dimension: Reconciliation volume
- Simplest possible
- Scales linearly with reliance

## Next Steps

1. Design 2-4 alternative pricing models
2. Evaluate against Settler Constitution
3. Select best model
4. Document why it wins
5. Implement backend
6. Update frontend
