# Selected Pricing Model - Model 4: Volume + Exception Supervision

**Date**: 2025-01-XX  
**Status**: ✅ SELECTED

## Selected Model

**Model 4: Volume + Exception Supervision**

### Structure
- **Base**: $0.01 per reconciliation
- **Included**: 1% exception rate (automatic explanations)
- **Overage**: $0.10 per exception requiring human review

### Pricing Tiers

#### Starter
- **Base**: 10,000 reconciliations/month included
- **Price**: $0/month (first 10k free)
- **Exception Rate**: 1% included (100 exceptions auto-explained)
- **Overage**: $0.10 per exception requiring review

#### Growth
- **Base**: 100,000 reconciliations/month included
- **Price**: $900/month (100k × $0.01 - 10k free)
- **Exception Rate**: 1% included (1,000 exceptions auto-explained)
- **Overage**: $0.10 per exception requiring review

#### Scale
- **Base**: 1,000,000 reconciliations/month included
- **Price**: $9,900/month (1M × $0.01 - 10k free)
- **Exception Rate**: 1% included (10,000 exceptions auto-explained)
- **Overage**: $0.10 per exception requiring review

#### Enterprise
- **Base**: Custom volume
- **Price**: Custom pricing
- **Exception Rate**: Custom threshold
- **Overage**: Volume discounts available

## Why Model 4 Wins

### 1. Aligns with Core Invariant ✅
- "Humans supervise exceptions; systems integrate continuously"
- Pricing directly reflects this

### 2. Scales with Reliance ✅
- More reconciliations = more reliance
- More exceptions = more supervision = more reliance

### 3. Encourages Right Behavior ✅
- Automatic reconciliation = lower exception rate = lower cost
- System-native behavior = lower cost

### 4. Simple to Explain ✅
- "Pay per reconciliation, exceptions requiring review cost extra"
- CFO can understand in 30 seconds

### 5. No Feature Matrices ✅
- No "AI tokens"
- No "feature flag evaluations"
- No "platform adapters"
- Just: volume + exceptions

### 6. Margins Improve with Usage ✅
- Base reconciliation: $0.01 (high margin)
- Exception review: $0.10 (very high margin)
- More usage = better margins

### 7. Discourages Self-Build ✅
- Exception handling is hard
- $0.10 per exception is cheap vs building it
- Clear value proposition

## Why Others Were Rejected

- **Model 1**: Too simple, doesn't reflect complexity
- **Model 2**: Good but doesn't capture exception supervision
- **Model 3**: Wrong incentive (penalizes continuous)
- **Model 5**: Too complex, Model 4 is sufficient

## Implementation Requirements

### Database Schema
- Plans table: volume tiers, exception thresholds
- Usage counters: reconciliations, exceptions
- Entitlements: automatic exception rate

### Backend Logic
- Track reconciliation volume
- Track exception count
- Distinguish automatic vs manual exceptions
- Calculate overage

### Frontend
- Simple pricing page
- Clear exception explanation
- Usage dashboard shows exceptions
- Upgrade path clear

## Next Steps

1. ✅ Model selected
2. ⏳ Implement backend (Phase 5)
3. ⏳ Update frontend (Phase 6)
4. ⏳ Ensure failure/trust models (Phase 7)
