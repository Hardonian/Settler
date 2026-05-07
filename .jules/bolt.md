## 2026-05-07 - Avoid redundant lookups in filtered arrays
 **Learning:** When iterating over a subset array created by `filter` from a main array, there's no need to use `find()` on the main array to locate the item by ID. The iterated element is already a reference to the same object. Redundant array lookups cause O(N^2) complexity bottlenecks.
 **Action:** Check inner loops for unnecessary array lookups (`find`/`filter`), especially when dealing with data that was already derived from the source being searched. Use the item directly or build an O(1) Map for lookups.
