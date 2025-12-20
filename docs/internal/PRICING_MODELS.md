# Pricing Model Alternatives - Phase 4B

**Date**: 2025-01-XX  
**Purpose**: Design 2-4 alternative pricing models based on value, reliance, and trust

## Design Principles

1. **Pricing must scale with reliance, not curiosity**
2. **Margins must improve with usage**
3. **Plans must be explainable in one sentence**
4. **No feature matrices**
5. **Never gate trust, visibility, or explanations**

## Model 1: Pure Volume-Based (Simplest)

### Structure
- Single dimension: Monthly reconciliation volume
- Linear pricing per reconciliation
- Volume discounts at thresholds

### Pricing
- **Starter**: $0.01 per reconciliation (first 10k free)
- **Growth**: $0.008 per reconciliation (10k-100k)
- **Scale**: $0.005 per reconciliation (100k-1M)
- **Enterprise**: Custom (1M+)

### Example
- 50k reconciliations/month = $400/month (10k free + 40k × $0.01)
- 500k reconciliations/month = $3,200/month (10k free + 90k × $0.01 + 400k × $0.008)

### Pros
- ✅ Simplest possible
- ✅ One sentence: "Pay per reconciliation, volume discounts apply"
- ✅ Scales with reliance
- ✅ No feature matrices
- ✅ Margins improve with usage

### Cons
- ⚠️ Doesn't reflect system complexity
- ⚠️ Doesn't account for connected systems

### Verdict
**Good baseline, but too simple**

---

## Model 2: Volume + Connected Systems

### Structure
- Base: Reconciliation volume
- Multiplier: Number of connected systems (platforms)
- Systems = reliance on Settler

### Pricing
- **Base**: $0.01 per reconciliation
- **System Multiplier**: 
  - 1-2 systems: 1.0x (no multiplier)
  - 3-5 systems: 1.2x
  - 6-10 systems: 1.5x
  - 11+ systems: 2.0x

### Example
- 50k reconciliations, 3 systems = $600/month (50k × $0.01 × 1.2)
- 500k reconciliations, 8 systems = $7,500/month (500k × $0.01 × 1.5)

### Pros
- ✅ Reflects reliance (more systems = more reliance)
- ✅ Scales with complexity
- ✅ One sentence: "Pay per reconciliation, more systems = higher multiplier"
- ✅ Margins improve with usage

### Cons
- ⚠️ Slightly more complex
- ⚠️ System count might be gamed

### Verdict
**Better, reflects reliance**

---

## Model 3: Volume + Automation Depth

### Structure
- Base: Reconciliation volume
- Multiplier: Automation depth (real-time vs batch, continuous vs periodic)
- Deeper automation = more reliance

### Pricing
- **Base**: $0.01 per reconciliation
- **Automation Multiplier**:
  - Batch/Periodic: 1.0x
  - Continuous: 1.3x
  - Real-time: 1.5x

### Example
- 50k reconciliations, continuous = $650/month (50k × $0.01 × 1.3)
- 500k reconciliations, real-time = $7,500/month (500k × $0.01 × 1.5)

### Pros
- ✅ Reflects reliance (continuous = more reliance)
- ✅ Encourages system-native behavior
- ✅ One sentence: "Pay per reconciliation, continuous/real-time costs more"

### Cons
- ⚠️ Might discourage continuous reconciliation (wrong incentive)
- ⚠️ Violates "continuous beats batch by default"

### Verdict
**Wrong incentive - penalizes continuous**

---

## Model 4: Volume + Exception Supervision (Recommended)

### Structure
- Base: Reconciliation volume
- Included: Exception supervision (automatic)
- Overage: Exception review actions (human supervision)

### Pricing
- **Base**: $0.01 per reconciliation
- **Included**: 1% exception rate (automatic explanations)
- **Overage**: $0.10 per exception requiring human review

### Example
- 50k reconciliations, 500 exceptions (1%) = $500/month (50k × $0.01)
- 50k reconciliations, 1,000 exceptions (2%) = $550/month (50k × $0.01 + 500 × $0.10)

### Pros
- ✅ Reflects reliance (more exceptions = more supervision needed)
- ✅ Encourages automatic reconciliation (lower exception rate = lower cost)
- ✅ Exception supervision is core value
- ✅ One sentence: "Pay per reconciliation, exceptions requiring review cost extra"
- ✅ Margins improve with usage
- ✅ Aligns with "humans supervise exceptions"

### Cons
- ⚠️ Slightly more complex
- ⚠️ Need to define "exception requiring review"

### Verdict
**BEST - Aligns with core invariant**

---

## Model 5: Hybrid - Volume + Systems + Exception Overage

### Structure
- Base: Reconciliation volume × system multiplier
- Included: Exception supervision (automatic)
- Overage: Exception review actions

### Pricing
- **Base**: $0.01 per reconciliation × system multiplier (1-2: 1.0x, 3-5: 1.2x, 6-10: 1.5x, 11+: 2.0x)
- **Included**: 1% exception rate (automatic)
- **Overage**: $0.10 per exception requiring review

### Example
- 50k reconciliations, 3 systems, 500 exceptions = $600/month (50k × $0.01 × 1.2)
- 500k reconciliations, 8 systems, 5,000 exceptions = $7,500/month (500k × $0.01 × 1.5)

### Pros
- ✅ Combines best of Models 2 and 4
- ✅ Reflects both system complexity and exception supervision
- ✅ Scales with reliance on multiple dimensions
- ✅ One sentence: "Pay per reconciliation with system multiplier, exceptions requiring review cost extra"

### Cons
- ⚠️ More complex than Model 4
- ⚠️ Might be harder to explain

### Verdict
**Good, but Model 4 is simpler and sufficient**

---

## Recommendation: Model 4 (Volume + Exception Supervision)

### Why Model 4 Wins

1. **Aligns with Core Invariant**
   - "Humans supervise exceptions; systems integrate continuously"
   - Pricing reflects this directly

2. **Scales with Reliance**
   - More reconciliations = more reliance
   - More exceptions = more supervision = more reliance

3. **Encourages Right Behavior**
   - Automatic reconciliation = lower exception rate = lower cost
   - System-native behavior = lower cost

4. **Simple to Explain**
   - "Pay per reconciliation, exceptions requiring review cost extra"
   - CFO can understand in 30 seconds

5. **No Feature Matrices**
   - No "AI tokens"
   - No "feature flag evaluations"
   - No "platform adapters"
   - Just: volume + exceptions

6. **Margins Improve with Usage**
   - Base reconciliation: $0.01 (high margin)
   - Exception review: $0.10 (very high margin)
   - More usage = better margins

7. **Discourages Self-Build**
   - Exception handling is hard
   - $0.10 per exception is cheap vs building it
   - Clear value proposition

### Why Others Were Rejected

- **Model 1**: Too simple, doesn't reflect complexity
- **Model 2**: Good but doesn't capture exception supervision
- **Model 3**: Wrong incentive (penalizes continuous)
- **Model 5**: Too complex, Model 4 is sufficient

## Implementation Plan

1. **Database Schema**
   - Plans table: volume tiers, exception thresholds
   - Usage counters: reconciliations, exceptions
   - Entitlements: automatic exception rate

2. **Pricing Tiers**
   - **Starter**: 10k reconciliations/month, 1% exception rate included
   - **Growth**: 100k reconciliations/month, 1% exception rate included
   - **Scale**: 1M reconciliations/month, 1% exception rate included
   - **Enterprise**: Custom volume, custom exception rate

3. **Exception Overage**
   - Automatic exceptions (system explains): Included
   - Exceptions requiring review: $0.10 each
   - Clear distinction between automatic and manual

4. **Frontend**
   - Simple pricing page: Volume + Exception overage
   - No feature matrices
   - Clear explanation of exception pricing

## Next Steps

1. ✅ Select Model 4
2. ⏳ Implement backend (Phase 5)
3. ⏳ Update frontend (Phase 6)
4. ⏳ Ensure failure/trust models (Phase 7)
