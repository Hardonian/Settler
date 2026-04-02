# FP&A Forecast Model Spec

## Driver model

- Funnel: SQO -> Pilot -> Paid -> Renewal/Expansion
- Pricing: list price, discount rate, mix by plan
- Delivery: implementation capacity and onboarding throughput
- Support: ticket load per active customer
- Churn/expansion: by cohort

## Scenarios

- Conservative: lower conversion, slower collections, higher churn
- Base: current expected run-rate
- Aggressive: improved conversion + expansion without support overload

## Update triggers

- New enterprise deal > threshold
- Material churn event
- Discount policy exception trend
- Major infra cost shift

## Sensitivity priorities

1. Pilot->paid conversion
2. Effective discount rate
3. Implementation capacity bottlenecks
4. Collections lag

## Decision-use guidance

Use forecast for staffing and cash planning, not for external guarantee claims.
