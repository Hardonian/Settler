🎯 **What:** Replace `Math.random()` with cryptographically secure `crypto.randomBytes(8).toString("hex")` for generation of ID strings in `FeeExtractionService`, `MatchingEngine`, and `FXService`.

⚠️ **Risk:** `Math.random()` generates predictable values, creating insecure randomness. An attacker could potentially predict generated IDs (e.g. for transactions, matching records, or fee records) and leverage this for unauthorized access, tampering, or causing system conflicts.

🛡️ **Solution:** Switched the internal `generateId()` implementations in these services to use the `node:crypto` module, specifically `crypto.randomBytes(8).toString("hex")` to ensure cryptographically secure unpredictability while preserving the existing string format.
