## 2025-02-26 - [Avoid N+1 queries by fetching references in bulk outside loop]

**Learning:** In `TemplateImprover`, N+1 queries were observed when fetching `reconJob` and `reconResult` for individual items iteratively within a loop, causing significant performance overhead and unnecessary round trips to the database.
**Action:** Fix N+1 queries by fetching relevant relations via a bulk `IN` clause before looping, grouping results using a `Map` where needed, and distributing items inside the loop based on the memory groups. This reduces database queries from O(N) to O(1) chunks and speeds up the entire execution. For very large record sets, use chunking to prevent query size limit exceptions.
