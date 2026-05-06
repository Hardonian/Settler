## 2024-05-19 - Trust codebase over prompt snippets for exact types

**Learning:** The task description provided a simplified `Current Code` snippet indicating that `verifyStripeWebhook` returned a boolean. However, inspecting the actual file revealed it returned `WebhookVerificationResult` (`{ valid: boolean, error?: string }`). Relying solely on the prompt's snippet led to code review flagging the correct implementation as a mismatch.
**Action:** Always verify function signatures and implementations directly in the codebase (e.g., via `grep` or reading the file) before writing tests or making modifications, as task descriptions may sometimes contain simplified, outdated, or inaccurate code snippets.
