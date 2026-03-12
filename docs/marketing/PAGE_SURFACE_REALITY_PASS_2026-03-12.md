# Page Surface Reality Pass (2026-03-12)

## Scope and Method

Inventory was generated directly from Next app routes under `packages/web/src/app/**/page.tsx`.

- Command used: `python` filesystem walk over `packages/web/src/app`
- Classification rule:
  - **Static page**: route path has no bracket segment (`[`)
  - **Dynamic page**: route path contains at least one bracket segment

## Current Reality

- Total page routes: **254**
- Static pages: **220**
- Dynamic pages: **34**

**Conclusion:** The previously-reported **198 static pages is stale**; current static surface area is **220**.

## Static Surface Distribution (Top Groups)

| Top-level group | Static pages |
| --------------- | -----------: |
| `console`       |           58 |
| `app`           |           25 |
| `admin`         |           19 |
| `docs`          |           17 |
| `dashboard`     |            9 |
| `legal`         |            8 |

## Stale / Drift Findings

1. **Use-case content drift (fixed this pass):**
   - `/use-cases/[slug]` embedded a local content registry in the page file while sitemap used a different hardcoded slug set.
   - Result: potential mismatch between canonical pages and SEO-discoverable pages.

2. **Token drift in use-case detail page (fixed this pass):**
   - Page used direct slate/blue gradient utility classes and custom section shells instead of shared site primitives.
   - Result: inconsistent visual system relative to Stitch-aligned marketing surfaces.

3. **Programmatic route opportunity (implemented):**
   - Use-case detail pages were dynamic-only without explicit static param generation despite finite slug set.
   - Added deterministic static params generation to align with compile-time route truth.

## Static/Dynamic Recommendation Matrix

| Surface                                                                  | Current mode                                         | Recommendation                                          | Reasoning                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `/use-cases/[slug]`                                                      | Dynamic render, finite local map                     | **Static params + shared content source** (implemented) | finite known catalog, predictable SEO + route determinism       |
| `/integrations/[integrationId]` docs/product pages                       | Dynamic-like path families                           | Keep dynamic; validate canonical ID source              | integration list may evolve, avoid stale generated artifacts    |
| `/console/**`                                                            | Mostly static route files with runtime data fetching | Keep route topology static, data dynamic                | preserves route integrity while backend remains source of truth |
| marketing singleton pages (`/about`, `/architecture`, `/platform`, etc.) | Static files                                         | Keep static + tokenized primitives                      | stable narrative surfaces with deterministic builds             |

## Implementation Done in This Pass

1. Consolidated use-case truth into `src/content/useCases.ts` and removed duplicated registries.
2. Converted `/use-cases/[slug]` to:
   - use shared content source
   - emit `generateStaticParams()`
   - use shared site primitives (`PublicPageShell`, `PageHero`, `Section`, `CTASection`) to reduce token/CSS drift
3. Updated sitemap generation to derive use-case URLs from the same shared content source.

## Residual Risk

- This pass intentionally targeted the highest-value inconsistency (use-case truth split + token drift).
- Broader legacy style variance still exists across older admin/app surfaces; that variance is lower risk for public IA truth but should be handled in phased batches to avoid decorative churn.
