# Settler.dev — Canonical Language, Terminology & Naming Governance

**Version:** 1.0  
**Date:** January 2026  
**Status:** FINALIZED — PHASE II COMPLETE  
**Classification:** Internal — Canonical Reference

---

## Purpose

This document eliminates linguistic drift and cognitive friction permanently. It defines approved terminology, forbidden terms, and tone rules for all Settler communication—marketing, console, playground, docs, errors, and states.

**This document is non-negotiable.** All communication must align with this language canon.

---

## Core Language Principle

**"Reconciliation is a system behavior, not a human task."**

This principle guides all terminology choices. Language must emphasize:
- **Automatic behavior** over manual configuration
- **System-native** over user-managed
- **Exception supervision** over manual review
- **Continuous matching** over scheduled jobs

---

## Inventory of Key Terms

### Core Product Terms

#### Reconciliation
- **Approved Term:** `reconciliation` (noun), `reconcile` (verb), `reconciling` (gerund)
- **Plain-Language Definition:** The process of matching transactions across platforms (e.g., matching a Stripe payment to a Shopify order)
- **Allowed Contexts:**
  - "Reconciliation happens automatically"
  - "Continuous reconciliation"
  - "Reconciliation reports"
  - "Reconciliation engine"
- **Forbidden Contexts:**
  - "Manual reconciliation" (use "manual matching" instead)
  - "Configure reconciliation" (use "configure matching rules" instead)
  - "Set up reconciliation" (use "connect platforms" instead)
- **Synonyms to Avoid:** "matching," "matching job," "reconciliation job" (use "reconciliation" or "reconciliation run" instead)

#### Transaction Match
- **Approved Term:** `transaction match` (noun), `match` (verb), `matching` (gerund)
- **Plain-Language Definition:** A successful pairing of two transactions from different platforms (e.g., Stripe payment matched to Shopify order)
- **Allowed Contexts:**
  - "Transaction matches automatically"
  - "Matching rules"
  - "Match transactions"
- **Forbidden Contexts:**
  - "Manual matching" (use "manual transaction review" instead)
  - "Match job" (use "reconciliation run" instead)

#### Exception
- **Approved Term:** `exception` (noun), `exception report` (noun phrase)
- **Plain-Language Definition:** A transaction that Settler cannot match automatically, flagged for user review with a clear explanation
- **Allowed Contexts:**
  - "Exception report"
  - "Exception supervision"
  - "Review exceptions"
- **Forbidden Contexts:**
  - "Exception handling" (use "exception supervision" instead)
  - "Manual exception" (redundant—all exceptions require review)

#### Platform
- **Approved Term:** `platform` (noun), `platform adapter` (noun phrase)
- **Plain-Language Definition:** A third-party service that Settler integrates with (e.g., Stripe, Shopify, QuickBooks)
- **Allowed Contexts:**
  - "Connect platforms"
  - "Platform adapter"
  - "Multi-platform reconciliation"
- **Forbidden Contexts:**
  - "Platform integration" (use "platform adapter" instead)
  - "Platform connector" (use "platform adapter" instead)

#### Adapter
- **Approved Term:** `adapter` (noun), `platform adapter` (noun phrase)
- **Plain-Language Definition:** A Settler component that connects to a specific platform (e.g., Stripe adapter, Shopify adapter)
- **Allowed Contexts:**
  - "Platform adapter"
  - "Adapter configuration"
  - "Connect adapters"
- **Forbidden Contexts:**
  - "Adapter integration" (redundant)
  - "Adapter connector" (redundant)

#### Matching Rule
- **Approved Term:** `matching rule` (noun phrase), `rule` (noun, when context is clear)
- **Plain-Language Definition:** A configuration that defines how transactions should match (e.g., match by order ID, amount, timestamp)
- **Allowed Contexts:**
  - "Configure matching rules"
  - "Matching rule configuration"
  - "Rule-based matching"
- **Forbidden Contexts:**
  - "Reconciliation rule" (use "matching rule" instead)
  - "Match configuration" (use "matching rule" instead)

#### Reconciliation Run
- **Approved Term:** `reconciliation run` (noun phrase), `run` (noun, when context is clear)
- **Plain-Language Definition:** A single execution of the reconciliation process for a specific time period or data set
- **Allowed Contexts:**
  - "Reconciliation run"
  - "Run reconciliation"
  - "Last run"
- **Forbidden Contexts:**
  - "Reconciliation job" (deprecated—use "reconciliation run" instead)
  - "Job execution" (deprecated—use "reconciliation run" instead)
  - "Reconciliation task" (deprecated—use "reconciliation run" instead)

### Developer Terms

#### API Key
- **Approved Term:** `API key` (noun phrase), `key` (noun, when context is clear)
- **Plain-Language Definition:** A secret token used to authenticate API requests to Settler
- **Allowed Contexts:**
  - "API key"
  - "Create API key"
  - "API key authentication"
- **Forbidden Contexts:**
  - "API token" (use "API key" instead)
  - "Secret key" (use "API key" instead)
  - "Auth key" (use "API key" instead)

#### Webhook
- **Approved Term:** `webhook` (noun), `webhook event` (noun phrase)
- **Plain-Language Definition:** An HTTP callback that Settler sends to your application when a reconciliation event occurs
- **Allowed Contexts:**
  - "Webhook"
  - "Webhook event"
  - "Configure webhook"
- **Forbidden Contexts:**
  - "Webhook callback" (redundant)
  - "Webhook notification" (redundant—use "webhook event" instead)

#### SDK
- **Approved Term:** `SDK` (noun, acronym), `software development kit` (noun phrase, when spelling out)
- **Plain-Language Definition:** A library that provides Settler functionality for a specific programming language (e.g., TypeScript SDK, Python SDK)
- **Allowed Contexts:**
  - "SDK"
  - "TypeScript SDK"
  - "Install SDK"
- **Forbidden Contexts:**
  - "Client library" (use "SDK" instead)
  - "API client" (use "SDK" instead)

### Product Features

#### Receipt Parsing
- **Approved Term:** `receipt parsing` (noun phrase), `parse receipt` (verb phrase), `receipt parser` (noun phrase)
- **Plain-Language Definition:** The process of extracting structured data (amount, date, merchant, items) from receipt images or PDFs using AI/OCR
- **Allowed Contexts:**
  - "Receipt parsing"
  - "Parse receipt"
  - "Receipt parser"
- **Forbidden Contexts:**
  - "Receipt OCR" (use "receipt parsing" instead)
  - "Receipt extraction" (use "receipt parsing" instead)

#### Feature Flag
- **Approved Term:** `feature flag` (noun phrase), `flag` (noun, when context is clear)
- **Plain-Language Definition:** A configuration that enables or disables a feature in your application based on conditions (user, environment, percentage)
- **Allowed Contexts:**
  - "Feature flag"
  - "Evaluate feature flag"
  - "Flag configuration"
- **Forbidden Contexts:**
  - "Feature toggle" (use "feature flag" instead)
  - "Feature switch" (use "feature flag" instead)

#### Playground
- **Approved Term:** `playground` (noun), `Settler Playground` (proper noun)
- **Plain-Language Definition:** An interactive web interface where users can test Settler functionality without writing code
- **Allowed Contexts:**
  - "Playground"
  - "Try Playground"
  - "Playground interface"
- **Forbidden Contexts:**
  - "Sandbox" (use "playground" instead)
  - "Test environment" (use "playground" instead)

#### Console
- **Approved Term:** `Console` (proper noun), `Developer Console` (proper noun phrase), `console` (noun, when context is clear)
- **Plain-Language Definition:** The Settler web interface for managing API keys, viewing reconciliation reports, and configuring settings
- **Allowed Contexts:**
  - "Console"
  - "Developer Console"
  - "Access Console"
- **Forbidden Contexts:**
  - "Dashboard" (use "Console" instead)
  - "Admin panel" (use "Console" instead)
  - "Control panel" (use "Console" instead)

### Error & State Terms

#### Error
- **Approved Term:** `error` (noun), `error message` (noun phrase)
- **Plain-Language Definition:** A failure condition that prevents Settler from completing an operation, with a clear explanation and recovery guidance
- **Allowed Contexts:**
  - "Error"
  - "Error message"
  - "Error handling"
- **Forbidden Contexts:**
  - "Failure" (use "error" instead)
  - "Exception" (reserved for unmatched transactions—use "error" for system failures)

#### Warning
- **Approved Term:** `warning` (noun), `warning message` (noun phrase)
- **Plain-Language Definition:** A condition that doesn't prevent operation but may indicate a problem (e.g., low confidence match, delayed webhook)
- **Allowed Contexts:**
  - "Warning"
  - "Warning message"
- **Forbidden Contexts:**
  - "Alert" (use "warning" for user-facing messages, "alert" for system monitoring)

#### Status
- **Approved Term:** `status` (noun), `status message` (noun phrase)
- **Plain-Language Definition:** The current state of a reconciliation run or operation (e.g., "running," "completed," "failed")
- **Allowed Contexts:**
  - "Status"
  - "Status message"
  - "Check status"
- **Forbidden Contexts:**
  - "State" (use "status" instead)
  - "Condition" (use "status" instead)

### Pricing & Billing Terms

#### Reconciliation Volume
- **Approved Term:** `reconciliation volume` (noun phrase), `volume` (noun, when context is clear)
- **Plain-Language Definition:** The number of transaction matches (reconciliations) processed in a billing period
- **Allowed Contexts:**
  - "Reconciliation volume"
  - "Monthly volume"
  - "Volume limits"
- **Forbidden Contexts:**
  - "Reconciliation count" (use "reconciliation volume" instead)
  - "Transaction count" (use "reconciliation volume" instead)

#### Plan Tier
- **Approved Term:** `plan tier` (noun phrase), `tier` (noun, when context is clear)
- **Plain-Language Definition:** A pricing level that determines usage limits and features (e.g., Starter, Growth, Scale, Enterprise)
- **Allowed Contexts:**
  - "Plan tier"
  - "Tier limits"
  - "Upgrade tier"
- **Forbidden Contexts:**
  - "Plan level" (use "plan tier" instead)
  - "Subscription tier" (use "plan tier" instead)

#### Usage Limit
- **Approved Term:** `usage limit` (noun phrase), `limit` (noun, when context is clear)
- **Plain-Language Definition:** The maximum number of reconciliations, receipt parses, or feature flag evaluations allowed per billing period
- **Allowed Contexts:**
  - "Usage limit"
  - "Limit exceeded"
  - "Check limits"
- **Forbidden Contexts:**
  - "Quota" (use "usage limit" instead)
  - "Allowance" (use "usage limit" instead)

#### Overage
- **Approved Term:** `overage` (noun), `overage charge` (noun phrase)
- **Plain-Language Definition:** Usage that exceeds the plan tier's included limits, charged at a per-unit rate
- **Allowed Contexts:**
  - "Overage"
  - "Overage charge"
  - "Overage pricing"
- **Forbidden Contexts:**
  - "Excess usage" (use "overage" instead)
  - "Over-limit charge" (use "overage charge" instead)

---

## Canonical Term Definitions

### Core Product Terms

| Term | Definition | Allowed Contexts | Forbidden Contexts |
|------|-----------|-----------------|-------------------|
| **reconciliation** | The process of matching transactions across platforms | "Reconciliation happens automatically"<br>"Continuous reconciliation"<br>"Reconciliation reports" | "Manual reconciliation"<br>"Configure reconciliation"<br>"Set up reconciliation" |
| **transaction match** | A successful pairing of two transactions from different platforms | "Transaction matches automatically"<br>"Matching rules" | "Manual matching"<br>"Match job" |
| **exception** | A transaction that Settler cannot match automatically, flagged for review | "Exception report"<br>"Exception supervision" | "Exception handling"<br>"Manual exception" |
| **platform** | A third-party service that Settler integrates with | "Connect platforms"<br>"Platform adapter" | "Platform integration"<br>"Platform connector" |
| **adapter** | A Settler component that connects to a specific platform | "Platform adapter"<br>"Adapter configuration" | "Adapter integration"<br>"Adapter connector" |
| **matching rule** | A configuration that defines how transactions should match | "Configure matching rules"<br>"Rule-based matching" | "Reconciliation rule"<br>"Match configuration" |
| **reconciliation run** | A single execution of the reconciliation process | "Reconciliation run"<br>"Run reconciliation" | "Reconciliation job"<br>"Job execution" |

### Developer Terms

| Term | Definition | Allowed Contexts | Forbidden Contexts |
|------|-----------|-----------------|-------------------|
| **API key** | A secret token used to authenticate API requests | "API key"<br>"Create API key" | "API token"<br>"Secret key"<br>"Auth key" |
| **webhook** | An HTTP callback that Settler sends when a reconciliation event occurs | "Webhook"<br>"Webhook event" | "Webhook callback"<br>"Webhook notification" |
| **SDK** | A library that provides Settler functionality for a programming language | "SDK"<br>"TypeScript SDK" | "Client library"<br>"API client" |

### Product Features

| Term | Definition | Allowed Contexts | Forbidden Contexts |
|------|-----------|-----------------|-------------------|
| **receipt parsing** | Extracting structured data from receipt images/PDFs using AI/OCR | "Receipt parsing"<br>"Parse receipt" | "Receipt OCR"<br>"Receipt extraction" |
| **feature flag** | A configuration that enables/disables features based on conditions | "Feature flag"<br>"Evaluate feature flag" | "Feature toggle"<br>"Feature switch" |
| **playground** | Interactive web interface for testing Settler without code | "Playground"<br>"Try Playground" | "Sandbox"<br>"Test environment" |
| **Console** | Settler web interface for managing API keys and viewing reports | "Console"<br>"Developer Console" | "Dashboard"<br>"Admin panel" |

### Error & State Terms

| Term | Definition | Allowed Contexts | Forbidden Contexts |
|------|-----------|-----------------|-------------------|
| **error** | A failure condition that prevents operation completion | "Error"<br>"Error message" | "Failure"<br>"Exception" (reserved for unmatched transactions) |
| **warning** | A condition that doesn't prevent operation but may indicate a problem | "Warning"<br>"Warning message" | "Alert" (reserved for system monitoring) |
| **status** | The current state of a reconciliation run or operation | "Status"<br>"Status message" | "State"<br>"Condition" |

### Pricing & Billing Terms

| Term | Definition | Allowed Contexts | Forbidden Contexts |
|------|-----------|-----------------|-------------------|
| **reconciliation volume** | The number of transaction matches processed in a billing period | "Reconciliation volume"<br>"Monthly volume" | "Reconciliation count"<br>"Transaction count" |
| **plan tier** | A pricing level that determines usage limits and features | "Plan tier"<br>"Tier limits" | "Plan level"<br>"Subscription tier" |
| **usage limit** | The maximum number of reconciliations allowed per billing period | "Usage limit"<br>"Limit exceeded" | "Quota"<br>"Allowance" |
| **overage** | Usage that exceeds plan tier limits, charged at per-unit rate | "Overage"<br>"Overage charge" | "Excess usage"<br>"Over-limit charge" |

---

## Do-Not-Use List (Deprecated or Misleading Terms)

### Deprecated Terms

These terms are deprecated and must not be used in new content:

1. **"reconciliation job"** → Use **"reconciliation run"** instead
2. **"job execution"** → Use **"reconciliation run"** instead
3. **"reconciliation task"** → Use **"reconciliation run"** instead
4. **"match job"** → Use **"reconciliation run"** instead
5. **"matching job"** → Use **"reconciliation run"** instead

### Misleading Terms

These terms are misleading and must not be used:

1. **"manual reconciliation"** → Use **"manual transaction review"** instead (reconciliation is always automatic)
2. **"configure reconciliation"** → Use **"configure matching rules"** instead
3. **"set up reconciliation"** → Use **"connect platforms"** instead
4. **"tune reconciliation"** → Use **"adjust matching rules"** instead
5. **"reconciliation rule"** → Use **"matching rule"** instead
6. **"platform integration"** → Use **"platform adapter"** instead
7. **"adapter connector"** → Use **"platform adapter"** instead
8. **"API token"** → Use **"API key"** instead
9. **"secret key"** → Use **"API key"** instead
10. **"dashboard"** → Use **"Console"** instead (when referring to Settler's web interface)

### Jargon Terms

These terms are jargon and must be avoided in user-facing content:

1. **"reconciliation"** (without context) → Use **"transaction matching"** or **"matching transactions"** in marketing/landing pages
2. **"exception"** (without context) → Use **"unmatched transaction"** or **"transaction that needs review"** in marketing/landing pages
3. **"adapter"** (without context) → Use **"platform connection"** or **"integration"** in marketing/landing pages
4. **"matching rule"** (without context) → Use **"how transactions should match"** or **"matching configuration"** in marketing/landing pages

---

## Tone Rules

### Precision Over Persuasion

**Rule:** Use precise, accurate language over persuasive marketing language.

**Examples:**
- ❌ "Eliminates manual work" → ✅ "Reduces manual work from hours to minutes"
- ❌ "100% accurate matching" → ✅ "Most transactions match automatically; exceptions are flagged for review"
- ❌ "Instant reconciliation" → ✅ "Webhook-driven reconciliation: Transactions matched as soon as platform webhooks arrive (typically within seconds)"

### Neutral, Professional, Non-Hype

**Rule:** Use neutral, professional language. Avoid hype, superlatives, and marketing fluff.

**Examples:**
- ❌ "Revolutionary reconciliation platform" → ✅ "Reconciliation-as-a-service platform"
- ❌ "Game-changing automation" → ✅ "Automated transaction matching"
- ❌ "Cutting-edge technology" → ✅ "Event-sourced reconciliation engine"
- ❌ "Industry-leading accuracy" → ✅ "Configurable matching rules with exception reporting"

### User-Respecting, Not Sales-Driven

**Rule:** Respect user intelligence. Provide clear information, not sales pitches.

**Examples:**
- ❌ "Join thousands of companies using Settler" → ✅ "Settler processes millions of transactions monthly"
- ❌ "Don't miss out—upgrade now!" → ✅ "Upgrade to increase usage limits and access advanced features"
- ❌ "Limited time offer" → ✅ "Pricing: $99/month for Starter tier"

### Clarity Over Brevity

**Rule:** Prefer clear, complete explanations over brief, ambiguous statements.

**Examples:**
- ❌ "Pay per reconciliation" → ✅ "Pay per transaction match. Each time Settler matches a transaction (e.g., Stripe payment to Shopify order), it counts as one reconciliation."
- ❌ "Real-time reconciliation" → ✅ "Webhook-driven reconciliation: Transactions are matched as soon as platform webhooks arrive (typically within seconds, but depends on platform delivery)."
- ❌ "50+ platforms" → ✅ "Supported platforms: Stripe, Shopify, QuickBooks, PayPal, Square, Xero, NetSuite, and 40+ others. See full list at [link]."

### Honesty Over Optimism

**Rule:** Be honest about limitations, exceptions, and edge cases. Set realistic expectations.

**Examples:**
- ❌ "Zero exceptions" → ✅ "Most transactions match automatically; exceptions are flagged for review"
- ❌ "Instant matching" → ✅ "Matching typically occurs within seconds of webhook delivery"
- ❌ "Works with any platform" → ✅ "Works with 50+ platforms via adapters. Custom adapters available for Enterprise customers."

---

## Context-Specific Language Rules

### Marketing & Landing Pages

**Goal:** Explain the problem and solution clearly, avoiding jargon.

**Rules:**
- Use **"transaction matching"** instead of **"reconciliation"** in headlines and hero copy
- Use **"unmatched transaction"** instead of **"exception"** in marketing copy
- Use **"platform connection"** instead of **"adapter"** in marketing copy
- Define technical terms on first use
- Use benefit-focused language, not feature-focused

**Examples:**
- ✅ "Stop manually matching payments to orders"
- ✅ "Settler automatically matches your Stripe payments with Shopify orders"
- ✅ "Transactions that don't match are flagged for quick review"

### Console & Developer Documentation

**Goal:** Use precise technical terminology consistently.

**Rules:**
- Use **"reconciliation"** consistently (not "matching" or "matching job")
- Use **"exception"** for unmatched transactions
- Use **"adapter"** for platform connections
- Use **"matching rule"** for configuration
- Use **"reconciliation run"** (not "job" or "execution")

**Examples:**
- ✅ "Reconciliation run completed: 1,234 matches, 12 exceptions"
- ✅ "Configure matching rules for this adapter"
- ✅ "Exception report: 12 unmatched transactions"

### Error Messages & States

**Goal:** Provide clear, actionable error messages with recovery guidance.

**Rules:**
- Use **"error"** for system failures (not "exception" or "failure")
- Use **"warning"** for non-blocking conditions
- Use **"status"** for operation states (not "state" or "condition")
- Provide clear explanations and recovery steps
- Avoid technical jargon in user-facing errors

**Examples:**
- ✅ "Error: API key invalid. Check your API key and try again."
- ✅ "Warning: Low confidence match (65%). Review this transaction manually."
- ✅ "Status: Reconciliation run in progress (45% complete)"

### Pricing & Billing

**Goal:** Explain pricing clearly, avoiding jargon and ambiguity.

**Rules:**
- Use **"reconciliation volume"** instead of **"reconciliation count"**
- Use **"plan tier"** instead of **"subscription tier"**
- Use **"usage limit"** instead of **"quota"**
- Use **"overage"** for excess usage charges
- Define terms upfront (e.g., "What is a reconciliation?")

**Examples:**
- ✅ "Starter: $99/month — 50,000 reconciliations/month included"
- ✅ "Overage: $0.001 per reconciliation beyond plan limits"
- ✅ "What is a reconciliation? A reconciliation is when Settler matches one transaction (like a Stripe payment) to another (like a Shopify order)."

---

## Language Consistency Checklist

### Before Publishing Any Content

- [ ] All terms match the canonical definitions in this document
- [ ] No deprecated terms are used
- [ ] No misleading terms are used
- [ ] Technical terms are defined on first use (in marketing/landing pages)
- [ ] Tone matches context (marketing vs. console vs. docs)
- [ ] No jargon without explanation (in marketing/landing pages)
- [ ] No absolutes without qualifiers ("most" not "all," "reduces" not "eliminates")
- [ ] No hype language ("revolutionary," "game-changing," "cutting-edge")
- [ ] Clear, complete explanations (not brief, ambiguous statements)
- [ ] Honest about limitations and exceptions

---

## Completion Marker

**PHASE II — COMPLETE**

This document serves as the canonical language reference for Settler.dev. All communication must align with these terminology and tone rules.

**Next Phase:** PHASE III — Canonical User Journeys & Cognitive Flow (Mobile-First)

---

**Document Status:** FINALIZED  
**Last Updated:** January 2026  
**Maintained By:** Product Team  
**Review Cycle:** Quarterly
