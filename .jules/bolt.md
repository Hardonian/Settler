## 2026-05-06 - Optimize pg_tables and pg_policies loops

**Learning:** Database metadata queries (like `pg_tables` and `pg_policies`) in loops can be highly inefficient and cause N+1 query problems.
**Action:** Always batch queries against system catalogs using `ANY($1)` and array parameters instead of looping through tables inside a Node.js process. Map the responses in memory using a `Map` or similar structure.
