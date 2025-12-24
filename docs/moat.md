# Defensibility Moat: Rules Engine

**Last Updated:** 2025-12-24  
**Status:** Implemented and Compounding

## What It Is

A Rules Engine that stores user mapping rules and learned patterns that improve match rate over time. This creates **data gravity** and **workflow lock-in**.

## Why It's Hard

1. **Domain-specific logic**: Each business has unique mapping rules
2. **Learning curve**: Rules improve with usage (success_rate increases)
3. **Accumulation**: Rules compound over time - more rules → better matches → more usage → more rules
4. **Switching cost**: Users build custom logic that's hard to replicate elsewhere

## How It Compounds

### Phase 1: User Creates Rules
- User maps "Stripe Payment" → "Shopify Order"
- User normalizes vendor names ("Stripe Inc" → "Stripe")
- User sets amount tolerance ($0.50 difference is OK)

### Phase 2: Rules Learn
- Each rule usage is tracked (`rule_usage_events`)
- Success rate calculated: `matched_count / total_usage`
- Rules with high success rate are prioritized

### Phase 3: Match Rate Improves
- Better rules → more matches → less manual work
- User sees value → uses more → creates more rules
- Cycle repeats: **compounding effect**

### Phase 4: Switching Cost Grows
- User has 50+ custom rules
- Rules are domain-specific (their vendors, their mappings)
- Switching to competitor = rebuild all rules
- **Data gravity**: Rules are valuable data that compounds

## Database Schema

### `reconciliation_rules`
- Stores user-defined rules
- Tracks `match_count` and `success_rate`
- Auto-updates via trigger on `rule_usage_events`

### `rule_usage_events`
- Tracks each time a rule is used
- Records whether it matched and confidence
- Used to calculate success rate

## Implementation

- **Location**: `packages/web/src/lib/moat/rules-engine.ts`
- **Database**: `prisma/migrations/add_rules_engine_moat.sql`
- **Usage**: Call `createRule()` when user creates mapping, `recordRuleUsage()` when rule is applied

## How It Shows Up in Retention

1. **Early**: User creates 5 rules → sees improvement → stays
2. **Mid**: User has 20 rules → match rate 85% → hard to leave
3. **Late**: User has 100+ rules → match rate 95% → **switching cost is massive**

## Proof Points

- **Rule count**: `SELECT COUNT(*) FROM reconciliation_rules WHERE billing_account_id = X`
- **Success rate**: `SELECT AVG(success_rate) FROM reconciliation_rules WHERE billing_account_id = X`
- **Usage**: `SELECT SUM(match_count) FROM reconciliation_rules WHERE billing_account_id = X`

## Investor Narrative

"This isn't just software - it's a learning system. Every rule our users create makes the system smarter for them. After 6 months, a typical customer has 50+ custom rules with 90%+ success rates. That's not something they can easily replicate elsewhere."
