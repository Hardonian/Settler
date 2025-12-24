# Missing Images & Generation Prompts

## Overview
This document lists all missing images, placeholders, and infographics needed for the Settler website, along with short prompts for AI image generation.

---

## 1. Architecture Diagram (Homepage Preview)
**Location:** `/workspace/packages/web/src/app/page.tsx` (line 405-408)  
**Current:** Placeholder div with gray background  
**Needed:** Architecture preview image for homepage  
**Dimensions:** 1408x768 (16:9 aspect ratio)

**Prompt:**
```
Modern SaaS architecture diagram showing API gateway routing to microservices (reconciliation engine, receipts API, feature flags), connected to distributed event-sourced database. Clean blue/purple tech aesthetic, minimalist style, no text labels, professional diagram style.
```

---

## 2. Customer Logos
**Location:** `/workspace/packages/web/src/components/CustomerLogos.tsx`  
**Current:** Emoji placeholders (🏢 🚀 🛒 💰 🏪 ☁️)  
**Needed:** 6-8 actual customer company logos  
**Dimensions:** 192x192px each (square, transparent background)

**Prompts:**
```
1. TechCorp logo: Modern tech company logo, blue gradient, geometric shapes, professional, minimalist
2. StartupXYZ logo: Startup company logo, vibrant colors, dynamic, modern typography
3. EcomPlus logo: E-commerce platform logo, shopping cart icon, green/blue colors, friendly
4. FinanceApp logo: Fintech app logo, dollar sign or chart icon, professional blue/gold
5. RetailPro logo: Retail business logo, storefront icon, warm colors, trustworthy
6. SaaSCo logo: SaaS company logo, cloud icon, modern, tech-forward, purple/blue
```

---

## 3. Edge AI Architecture Diagram
**Location:** `/workspace/packages/web/src/app/edge-ai/page.tsx` (line 41)  
**Current:** Missing diagram  
**Needed:** Dual-layer cloud + edge architecture visualization  
**Dimensions:** 1408x768 (16:9)

**Prompt:**
```
Dual-layer architecture diagram: Cloud core (top) with API gateway, reconciliation engine, AI matching. Edge nodes (bottom) with local processing, on-device models, offline sync. Arrows showing data flow. Modern tech diagram style, blue/purple gradient, clean lines.
```

---

## 4. Workflow Schematics Diagrams
**Location:** `/workspace/packages/web/src/app/schematics/page.tsx`  
**Current:** Icon-based cards, no actual diagrams  
**Needed:** 6-8 workflow diagram images  
**Dimensions:** 800x600 each

**Prompts:**
```
1. Authentication flow: User login → API key validation → token generation → access granted. Flowchart style, blue/green colors.
2. Reconciliation workflow: Source data → matching algorithm → exception detection → resolution → audit log. Process flow diagram.
3. Receipt processing: PDF/image upload → OCR extraction → JSON parsing → validation → storage. Step-by-step visual.
4. Feature flag evaluation: Request → edge evaluation → flag check → response. Simple flow diagram.
5. Webhook delivery: Event trigger → webhook queue → retry logic → delivery confirmation. Network diagram style.
6. Data sync flow: Edge node → local processing → cloud sync → conflict resolution. Dual-layer visualization.
```

---

## 5. Feature Showcase Images
**Location:** `/workspace/packages/web/src/components/landing/FeatureShowcase.tsx`  
**Current:** Icon-based, no feature images  
**Needed:** Visual representations for each feature  
**Dimensions:** 600x400 each

**Prompts:**
```
1. Meaningful Changes: Dashboard showing ranked changes with impact scores, color-coded by urgency, modern UI mockup
2. Smart Reconciliation: Visual of transaction matching with confidence scores, before/after comparison
3. Exception Detection: Alert dashboard with prioritized exceptions, action buttons, status indicators
4. Hash Chain Receipts: Visual of receipt chain with cryptographic hashes, tamper-evident design
5. AI Analysis: Chart showing AI insights, recommendations, trend analysis, modern analytics style
```

---

## 6. Comparison Table Visual
**Location:** `/workspace/packages/web/src/components/landing/ComparisonTable.tsx`  
**Current:** Text-based table  
**Needed:** Visual comparison chart/infographic  
**Dimensions:** 1200x800

**Prompt:**
```
Comparison infographic: Settler vs Competitors table. Feature checkmarks, highlighted Settler advantages, side-by-side comparison. Modern infographic style, blue/green color scheme, professional chart design.
```

---

## 7. Integration Flow Diagram
**Location:** `/workspace/packages/web/src/components/IntegrationLogos.tsx`  
**Current:** Just logos  
**Needed:** Visual showing how integrations connect  
**Dimensions:** 1408x768

**Prompt:**
```
Integration ecosystem diagram: Settler hub in center, connected to Stripe, Shopify, PayPal, QuickBooks, Xero, Square, Adyen, WooCommerce, BigCommerce. Data flow arrows, modern network diagram, colorful but professional.
```

---

## 8. Reconciliation Flow Infographic (Enhanced)
**Location:** `/workspace/packages/web/public/assets/infographics/reconciliation-flow.svg`  
**Current:** Basic SVG  
**Needed:** Enhanced detailed flow diagram  
**Dimensions:** 1200x800

**Prompt:**
```
Detailed reconciliation flow: Multiple data sources (Stripe, Shopify, databases) → normalization → matching engine → confidence scoring → exception queue → resolution → audit trail. Step-by-step process diagram with icons, modern infographic style.
```

---

## 9. Pricing Comparison Infographic (Enhanced)
**Location:** `/workspace/packages/web/public/assets/infographics/pricing-comparison.svg`  
**Current:** Basic SVG  
**Needed:** Enhanced pricing visualization  
**Dimensions:** 1200x800

**Prompt:**
```
Pricing comparison chart: Settler volume-based pricing vs manual reconciliation costs. Bar chart showing cost savings, ROI calculation, time savings. Modern infographic style, green for savings, professional financial chart aesthetic.
```

---

## 10. ROI Analysis Infographic (Enhanced)
**Location:** `/workspace/packages/web/public/assets/infographics/roi-comparison.svg`  
**Current:** Basic SVG  
**Needed:** Enhanced ROI visualization  
**Dimensions:** 1200x800

**Prompt:**
```
ROI analysis infographic: Before/after comparison showing manual reconciliation costs vs Settler automation. Time savings, error reduction, cost breakdown. Modern financial infographic, charts and graphs, professional design.
```

---

## 11. Security & Compliance Visual
**Location:** Various security/trust pages  
**Current:** Text-based  
**Needed:** Security architecture diagram  
**Dimensions:** 1408x768

**Prompt:**
```
Security architecture: Encryption at rest/transit, SOC 2 compliance badges, GDPR compliance, audit trails, access controls. Modern security diagram, shield icons, lock symbols, professional security visualization.
```

---

## 12. Feature Flags Visual
**Location:** `/workspace/packages/web/src/app/feature-flags/page.tsx`  
**Current:** Text description  
**Needed:** Feature flag evaluation flow  
**Dimensions:** 1000x600

**Prompt:**
```
Feature flag evaluation flow: Request with context → edge evaluation → flag check → typed payload → response. Real-time evaluation diagram, modern tech flow, blue/purple gradient.
```

---

## Summary

**Total Images Needed:** 12-15 images  
**Priority Order:**
1. Architecture Diagram (Homepage) - HIGH
2. Customer Logos (6-8) - HIGH  
3. Edge AI Architecture - MEDIUM
4. Workflow Schematics (6-8) - MEDIUM
5. Integration Flow Diagram - MEDIUM
6. Feature Showcase Images (5) - LOW
7. Enhanced Infographics (3) - LOW
8. Security Visual - LOW
9. Feature Flags Visual - LOW

**Format:** PNG with transparent backgrounds where appropriate, optimized for web  
**Style Guide:** Modern, professional, tech-forward, blue/purple gradient theme, minimalist where possible
