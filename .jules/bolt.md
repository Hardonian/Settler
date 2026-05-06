## 2024-05-18 - Optimized N+1 queries in TemplateImprover

**Learning:** Using `findMany` inside a loop can lead to N+1 query problems and significantly slow down operations like `TemplateImprover.improveTemplates`. Pre-fetching records using an `IN` clause isn't always safe if it completely unbounds previous limits like `take`.
**Action:** Execute the bounded queries concurrently using `Promise.all` instead of sequentially awaiting in loops to significantly reduce latency while keeping bounded memory limits intact.
