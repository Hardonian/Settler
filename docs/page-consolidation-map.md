# Page Consolidation Map

## Objective

Reduce repeated static page implementations by introducing shared templates while preserving URLs and SEO semantics.

## Consolidation candidates

| Cluster                     | Routes in scope                                                                            | Proposed template system                                | Target delivery                                      |
| --------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------- |
| SDK documentation           | `/docs/sdk/page`, `/docs/sdk/nodejs`, `/docs/sdk/python`, `/docs/sdk/ruby`, `/docs/sdk/go` | `SdkDocTemplate` backed by language config/content map  | TEMPLATE_DRIVEN (SSG/ISR)                            |
| Legal corpus                | `/legal/*`, `/privacy`, `/terms`                                                           | `LegalDocumentTemplate` fed by frontmatter/MDX data     | TEMPLATE_DRIVEN (SSG)                                |
| Changelog entries           | `/changelog`, `/changelog/[slug]`                                                          | `ChangelogTemplate` + slug-indexed content registry     | TEMPLATE_DRIVEN (SSG with `generateStaticParams`)    |
| Use cases                   | `/use-cases`, `/use-cases/[slug]`                                                          | `UseCaseTemplate` with structured YAML/JSON definitions | TEMPLATE_DRIVEN (SSG with `generateStaticParams`)    |
| Support knowledge pages     | `/support/articles/[articleId]`, `/support/category/[categoryId]`                          | `SupportArticleTemplate` with article/category schema   | TEMPLATE_DRIVEN (SSG/ISR)                            |
| Console playground variants | `/console/playground/*`                                                                    | `ConsolePlaygroundTemplate` parameterized by tool mode  | TEMPLATE_DRIVEN (dynamic shell + static descriptors) |
| Site experiment views       | `/console/site/experiments`, `/console/site/experiments/[id]`                              | `ExperimentConsoleTemplate` with list/detail variants   | TEMPLATE_DRIVEN (dynamic data + shared view model)   |

## Template migration guardrails

- Keep one source-of-truth schema per template family (frontmatter or typed JSON).
- Enforce deterministic rendering inputs to avoid cross-tenant cache bleed on mixed static/dynamic pages.
- Keep route-level metadata generated from content schema to maintain canonical and social previews.
- Add snapshot checks for generated HTML head tags on representative pages per template family.
