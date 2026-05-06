## 2026-05-06 - [Reconciliation Performance Optimization]

**Learning:** O(n\*m) array lookups within loops can severely degrade performance on large datasets.
**Action:** Replace `Array.prototype.find` inside loops with O(1) Map lookups built before the loop.
