## 2024-05-06 - [Reduce N+1 Existence Queries in DB Migration Verification]

**Learning:** Checking table and function existence one-by-one with `SELECT EXISTS` against `information_schema` is an N+1 performance bottleneck that adds considerable latency during migration script execution (particularly visible over network connections).
**Action:** Replace looped `SELECT EXISTS` queries with a single query using `ANY($1)` and arrays, caching the result in a `Set` for fast local lookup. This reduces query volume significantly while maintaining output parity.
