## 2026-05-01 - [O(N^2) Array Operations]

**Learning:** Repeatedly combining `Array.prototype.find()` and `Array.prototype.some()` loops through a secondary array is highly inefficient, leading to quadratic or even cubic time complexities depending on nested constraints. In this case, `savedInsights.some(s => s.id === id)` inside `insights.find` was generating excessive latency.
**Action:** Optimize bounded searches in loops by mapping objects directly at insertion time (`{ id, insight }`), completely bypassing the need to search the source dataset later.
