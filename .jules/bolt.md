## 2026-05-09 - Code Refactoring and Regression Prevention
 **Learning:** When refactoring large monolithic files, you must copy the implementation line-by-line exactly. Any attempt to simplify or rewrite will often cause silent regressions in method signatures, default arguments, or nuanced logic (like cache key generation).
 **Action:** Prioritize copy-pasting the exact code into new files instead of manually transcribing it to prevent regressions.
