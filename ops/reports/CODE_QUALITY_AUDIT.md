# Code Quality Audit Report

Generated: 2025-12-28T04:23:14.726Z

## Summary

- Critical: 0
- High: 0
- Medium: 422
- Low: 0
- Total: 422

## Issues


### 1. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/application/eventsourcing/EventProjectionService.ts:25
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 2. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/cache/advanced-cache.ts:25
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 3. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/cache/advanced-cache.ts:52
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 4. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/cache/advanced-cache.ts:76
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 5. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/queue/PrioritizedQueue.ts:72
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 6. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/queue/PrioritizedQueue.ts:94
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 7. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/queue/PrioritizedQueue.ts:113
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 8. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/queue/PrioritizedQueue.ts:161
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 9. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/queue/PrioritizedQueue.ts:165
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 10. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/query-optimization.ts:24
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 11. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/query-optimization.ts:92
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 12. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/query-optimization.ts:144
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 13. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/query-optimization.ts:209
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 14. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/security/token-rotation.ts:166
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 15. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/security/token-rotation.ts:188
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 16. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/security/token-rotation.ts:205
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 17. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/jobs/scheduler-service.ts:87
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 18. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/infrastructure/jobs/scheduler-service.ts:249
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 19. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/db/migrate.ts:193
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 20. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/v1/webhooks/receive.ts:77
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 21. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/health.ts:61
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 22. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/health.ts:72
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 23. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/health.ts:84
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 24. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/exceptions.ts:278
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 25. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/exceptions.ts:329
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 26. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/tenant-data.ts:278
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 27. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/realtime.ts:22
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 28. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/edge-ai.ts:149
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 29. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/users.ts:70
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 30. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/api-keys.ts:343
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 31. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/aias.ts:539
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 32. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/routes/billing.ts:632
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 33. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/ops/reports/daily-report.ts:99
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 34. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/ops/reports/daily-report.ts:610
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 35. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/ops/reports/weekly-report.ts:112
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 36. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/ops/reports/weekly-report.ts:684
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 37. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/ops/billing-hardening.ts:26
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 38. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/ops/billing-hardening.ts:70
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 39. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/ops/billing-hardening.ts:179
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 40. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/index-scheduler.ts:44
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 41. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/security/integration-security.ts:111
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 42. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/security/integration-security.ts:148
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 43. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/security/integration-security.ts:245
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 44. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/security/edge-function-security.ts:74
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 45. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/security/edge-function-security.ts:116
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 46. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/export-service.ts:101
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 47. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/export-service.ts:185
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 48. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/export-service.ts:246
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 49. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/export-service.ts:300
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 50. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/export-service.ts:373
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 51. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/export-service.ts:461
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 52. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/job-runner.ts:32
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 53. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/job-runner.ts:79
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 54. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/job-runner.ts:194
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 55. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/stripe-connector.ts:77
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 56. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/stripe-connector.ts:101
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 57. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/stripe-connector.ts:130
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 58. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/stripe-connector.ts:154
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 59. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/stripe-connector.ts:273
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 60. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/stripe-connector.ts:290
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 61. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/reconciliation-matcher.ts:119
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 62. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/reconciliation-matcher.ts:435
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 63. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/ingestion-service.ts:286
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 64. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ingestion/ingestion-service.ts:302
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 65. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/bulk-operations.ts:173
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 66. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/backups.ts:280
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 67. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/alerting.ts:302
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 68. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/cost-controls.ts:118
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 69. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/cost-controls.ts:312
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 70. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/kill-switches.ts:106
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 71. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/kill-switches.ts:113
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 72. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/kill-switches.ts:120
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 73. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/kill-switches.ts:153
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 74. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/kill-switches.ts:173
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 75. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/kill-switches.ts:189
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 76. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/operator-mode/kill-switches.ts:209
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 77. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/analytics/events.ts:45
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 78. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/analytics/events.ts:59
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 79. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/analytics/events.ts:70
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 80. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/approval-workflows.ts:130
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 81. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/approval-workflows.ts:202
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 82. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/usage/tracker.ts:94
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 83. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/usage/tracker.ts:113
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 84. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/usage/tracker.ts:123
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 85. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/usage/tracker.ts:130
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 86. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ai-insights/dropoff-analyzer.ts:61
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 87. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ai-insights/dropoff-analyzer.ts:188
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 88. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/ai-insights/dropoff-analyzer.ts:304
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 89. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/onboarding/tracker.ts:127
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 90. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/onboarding/tracker.ts:135
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 91. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/services/receipt-matching.ts:233
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 92. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/config/addon-config.ts:220
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 93. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/middleware/idempotency.ts:7
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 94. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/middleware/test-mode.ts:35
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 95. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/middleware/auth.ts:90
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 96. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/usage-tracking.ts:73
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 97. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/usage-tracking.ts:94
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 98. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/cache.ts:183
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 99. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/performance.ts:9
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 100. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/performance.ts:11
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 101. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/performance.ts:55
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 102. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/rate-limiter.ts:22
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 103. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/cache-invalidation.ts:12
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 104. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/cache-invalidation.ts:30
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 105. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/cache-invalidation.ts:47
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 106. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/cache-invalidation.ts:63
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 107. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/cache-invalidation.ts:79
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 108. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/cache-invalidation.ts:93
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 109. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/webhook-queue.ts:130
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 110. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/webhook-queue.ts:156
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 111. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/usage-tracker.ts:63
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 112. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/api/src/utils/webhook-signature.ts:4
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 113. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/types/api.ts:25
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 114. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/types/api.ts:37
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 115. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/components/billing/AddOnCard.tsx:58
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 116. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/components/billing/IntegrationCard.tsx:77
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 117. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/components/console/ShareButton.tsx:69
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 118. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/components/docs/CodeBlock.tsx:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 119. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/components/NewsletterSignup.tsx:13
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 120. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/components/chatbot/Chatbot.tsx:285
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 121. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/components/chatbot/Chatbot.tsx:297
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 122. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/components/PwaInstallPrompt.tsx:28
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 123. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/usageService.ts:31
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 124. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/usageService.ts:127
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 125. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/reconciliation.ts:163
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 126. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/reconciliation.ts:199
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 127. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/stripeService.ts:131
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 128. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/stripeService.ts:202
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 129. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/stripeService.ts:275
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 130. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/stripeService.ts:288
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 131. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/stripeService.ts:377
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 132. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/stripeService.ts:416
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 133. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/billing/entitlements.ts:34
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 134. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/console/apiKeys.ts:155
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 135. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/console/apiKeys.ts:237
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 136. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/console/api-logs.ts:225
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 137. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/console/featureFlags.ts:126
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 138. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/console/featureFlags.ts:169
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 139. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/domain/featureFlags/evaluator.ts:13
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 140. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/audit/logger.ts:172
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 141. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/audit/logger.ts:191
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 142. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/audit/logger.ts:210
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 143. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/audit/logger.ts:229
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 144. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/audit/logger.ts:250
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 145. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/health-check.ts:246
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 146. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/health-check.ts:271
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 147. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/correlation.ts:35
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 148. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/correlation.ts:107
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 149. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/error-alerts.ts:167
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 150. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/alerts.ts:25
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 151. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/alerts.ts:175
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 152. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/metrics.ts:128
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 153. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/metrics.ts:154
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 154. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/monitoring/metrics.ts:183
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 155. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/ai/insights-generator.ts:311
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 156. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/auth/guest.ts:23
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 157. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/auth/guest.ts:31
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 158. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/auth/investor-auth.ts:61
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 159. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/auth/entitlements.ts:168
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 160. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/referrals.ts:35
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 161. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/referrals.ts:71
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 162. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/referrals.ts:119
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 163. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/referrals.ts:157
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 164. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/analytics.ts:50
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 165. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/analytics.ts:64
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 166. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/analytics.ts:80
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 167. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/analytics.ts:92
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 168. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/cache.ts:51
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 169. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/cache.ts:103
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 170. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/cache.ts:128
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 171. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/cache.ts:130
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 172. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/query-builder.ts:58
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 173. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/db/query-optimizer.ts:21
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 174. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/console/subscription.ts:147
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 175. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/cache/api-cache.ts:100
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 176. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/unified-auth.ts:124
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 177. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/idempotency.ts:120
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 178. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/subscription-gate.ts:120
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 179. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/console-middleware.ts:28
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 180. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/console-middleware.ts:106
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 181. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/auth-gate.ts:175
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 182. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/error-handler.ts:39
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 183. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/request-logger.ts:16
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 184. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/external.ts:121
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 185. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/console-route-optimizer.ts:20
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 186. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/api/client.ts:108
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 187. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/support/ticket-system.ts:94
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 188. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/support/ticket-system.ts:122
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 189. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/support/ticket-system.ts:154
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 190. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/gtm/demo-data.ts:23
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 191. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/gtm/demo-data.ts:63
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 192. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/gtm/demo-data.ts:202
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 193. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/gtm/demo-data.ts:242
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 194. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/gtm/value-events.ts:262
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 195. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/lifecycle-automation.ts:53
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 196. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/lifecycle-automation.ts:99
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 197. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/lifecycle-automation.ts:188
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 198. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/lifecycle-automation.ts:253
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 199. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/activation-events.ts:119
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 200. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/conversion.ts:75
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 201. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/conversion.ts:90
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 202. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/conversion.ts:99
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 203. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/conversion.ts:109
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 204. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/conversion.ts:118
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 205. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/conversion.ts:128
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 206. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/conversion.ts:139
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 207. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/conversion.ts:150
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 208. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/analytics/conversion.ts:160
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 209. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/alerts/reliability-alerts.ts:123
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 210. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/ai-anomaly-detection.ts:23
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 211. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/ai-anomaly-detection.ts:88
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 212. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/ai-anomaly-detection.ts:129
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 213. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/ai-anomaly-detection.ts:191
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 214. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/ai-anomaly-detection.ts:252
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 215. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/reconciliation/value-event-listener.ts:14
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 216. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/reconciliation/value-event-listener.ts:19
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 217. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/reconciliation/value-event-listener.ts:31
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 218. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/images/sharp-optimizer.ts:63
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 219. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/images/sharp-optimizer.ts:82
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 220. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/images/sharp-optimizer.ts:87
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 221. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/systemwide-anomaly-detection.ts:21
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 222. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/systemwide-anomaly-detection.ts:79
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 223. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/flags/hooks.ts:195
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 224. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/flags/resolver.ts:290
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 225. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/usage/tracking.ts:382
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 226. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/usage/tracking.ts:416
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 227. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/usage/tracking.ts:426
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 228. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/emails/lifecycle.ts:64
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 229. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/emails/lifecycle.ts:77
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 230. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/emails/lifecycle.ts:95
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 231. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/emails/lifecycle.ts:108
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 232. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/emails/lifecycle.ts:126
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 233. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/vercel/blob.ts:148
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 234. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/vercel/blob.ts:177
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 235. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/vercel/kv.ts:210
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 236. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/moat/rules-engine.ts:55
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 237. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/moat/rules-engine.ts:115
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 238. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/moat/rules-engine.ts:146
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 239. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/moat/rules-engine.ts:177
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 240. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/email-automation.ts:20
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 241. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/email-automation.ts:113
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 242. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/email-automation.ts:122
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 243. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/email-automation.ts:132
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 244. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/email-automation.ts:142
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 245. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/email-automation.ts:151
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 246. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/email-automation.ts:164
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 247. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/personalization.ts:138
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 248. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/authz.ts:108
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 249. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/authz.ts:127
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 250. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/customer-segmentation.ts:20
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 251. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/customer-segmentation.ts:40
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 252. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/customer-segmentation.ts:68
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 253. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/customer-segmentation.ts:162
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 254. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/features/flags.ts:74
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 255. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/affiliates.ts:19
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 256. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/affiliates.ts:66
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 257. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/affiliates.ts:115
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 258. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/error-handling/console-errors.ts:120
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 259. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/feedback-loops/usage-insights-service.ts:170
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 260. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/data/jobs.ts:19
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 261. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/webhooks/manager.ts:127
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 262. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/webhooks/manager.ts:154
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 263. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/webhooks/manager.ts:208
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 264. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/webhooks/manager.ts:238
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 265. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/webhooks/manager.ts:269
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 266. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/milestones.ts:83
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 267. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/security/rate-limiter-redis.ts:59
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 268. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/security/headers.ts:64
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 269. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/security/billing-enforcement.ts:230
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 270. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/security/billing-enforcement.ts:407
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 271. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/services/pivot-engine.ts:109
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 272. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/services/triage-engine.ts:112
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 273. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/services/triage-engine.ts:182
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 274. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/services/triage-engine.ts:244
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 275. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/services/cost-signal-engine.ts:78
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 276. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/services/cost-signal-engine.ts:216
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 277. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/services/cost-signal-engine.ts:309
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 278. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/services/cost-signal-engine.ts:337
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 279. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/tenant/permissions.ts:29
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 280. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/tenant/permissions.ts:40
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 281. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/tenant/permissions.ts:54
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 282. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/tenant/permissions.ts:66
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 283. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/tenant/server.ts:186
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 284. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/tenant/experimentResolver.ts:85
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 285. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/tenant/experimentResolver.ts:106
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 286. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/tenant/setup.ts:12
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 287. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/tenant/setup.ts:73
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 288. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/future-proof/cache.ts:77
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 289. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/future-proof/cache.ts:132
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 290. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/future-proof/performance.ts:8
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 291. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/future-proof/performance.ts:10
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 292. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/middleware/apply-middleware.ts:33
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 293. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/middleware/with-middleware.ts:21
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 294. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/data-retention/policies.ts:123
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 295. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/escalation.ts:33
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 296. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/escalation.ts:78
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 297. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/escalation.ts:135
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 298. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/value-ledger/index.ts:202
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 299. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/value-ledger/index.ts:269
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 300. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/value-ledger/index.ts:310
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 301. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/jobs/idempotency.ts:33
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 302. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/jobs/worker.ts:107
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 303. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/jobs/worker.ts:249
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 304. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/jobs/handlers/run-processor.ts:15
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 305. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/jobs/handlers/run-processor.ts:67
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 306. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/jobs/handlers/run-processor.ts:83
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 307. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/jobs/handlers/run-processor.ts:117
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 308. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/jobs/handlers/run-processor.ts:148
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 309. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/jobs/handlers/run-processor.ts:179
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 310. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/content-provider.ts:52
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 311. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/server/settler/ai-tokens.ts:95
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 312. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/entitlements/index.ts:359
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 313. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/supabase/safe-query.ts:120
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 314. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/supabase/safe-query.ts:127
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 315. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/supabase/safe-query.ts:141
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 316. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/supabase/safe-query.ts:147
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 317. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/testing/integration-helpers.ts:53
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 318. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/lib/testing/integration-helpers.ts:64
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 319. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/hooks/useValueTracking.ts:26
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 320. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/hooks/useValueTracking.ts:44
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 321. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/auth/roles.ts:121
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 322. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/auth/roles.ts:170
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 323. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/auth/roles.ts:183
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 324. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/auth/roles.ts:205
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 325. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/auth/apiKey.ts:50
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 326. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/db/prismaClient.ts:265
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 327. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/db/prismaClient.ts:278
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 328. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/db/prismaSafe.ts:37
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 329. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/db/prismaSafe.ts:44
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 330. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/shared/usage/usageEvent.ts:51
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 331. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/middleware/usage-limits.ts:187
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 332. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/middleware/usage-tracking.ts:64
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 333. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/middleware/usage-tracking.ts:88
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 334. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/middleware/usage-tracking.ts:145
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 335. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/middleware/usage-enforcement.ts:131
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 336. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/middleware/billing-gate-universal.ts:32
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 337. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/use-cases/[slug]/page.tsx:114
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 338. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/use-cases/[slug]/page.tsx:144
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 339. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/dashboard/addons/page.tsx:237
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 340. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/dashboard/addons/page.tsx:241
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 341. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/briefings/page.tsx:20
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 342. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/support/page.tsx:19
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 343. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/analytics/page.tsx:19
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 344. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/api-logs/page.tsx:15
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 345. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/control-plane/page.tsx:74
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 346. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/ops/page.tsx:20
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 347. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/playground/cli/page.tsx:14
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 348. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/admin/activation/page.tsx:54
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 349. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/admin/tenants/page.tsx:18
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 350. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/insights/page.tsx:20
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 351. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/workflows/page.tsx:60
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 352. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/workflows/page.tsx:73
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 353. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/workflows/page.tsx:84
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 354. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/workflows/new/page.tsx:24
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 355. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/workflows/[id]/page.tsx:43
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 356. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/workflows/[id]/page.tsx:55
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 357. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/workflows/[id]/page.tsx:72
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 358. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/api-playground/page.tsx:167
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 359. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/inspector/page.tsx:74
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 360. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/console/reality/page.tsx:29
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 361. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/health/route.ts:23
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 362. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/health/stripe/route.ts:38
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 363. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/support/tickets/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 364. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/support/tickets/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 365. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/support/triage/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 366. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/support/triage/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 367. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/analytics/saved-views/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 368. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/analytics/saved-views/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 369. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/analytics/datasets/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 370. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/analytics/datasets/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 371. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/analytics/pivot/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 372. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/analytics/pivot/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 373. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/analytics/rollup/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 374. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/analytics/rollup/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 375. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/feature-flags/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 376. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/feature-flags/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 377. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/feature-flags/[id]/environments/[env]/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 378. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/feature-flags/[id]/environments/[env]/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 379. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/api-logs/route.ts:24
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 380. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/meaningful-changes/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 381. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/meaningful-changes/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 382. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/ai-analysis/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 383. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/ai-analysis/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 384. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/ai-tokens/usage/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 385. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/ai-tokens/usage/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 386. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/insights/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 387. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/insights/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 388. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/performance/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 389. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/performance/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 390. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/tenants/route.ts:24
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 391. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/reality/route.ts:6
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 392. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/console/reality/route.ts:17
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 393. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/metrics/route.ts:18
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 394. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/stripe/webhook/route.ts:74
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 395. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/stripe/webhook/route.ts:87
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 396. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/stripe/webhook/route.ts:137
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 397. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/stripe/webhook/route.ts:254
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 398. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/vercel-example/route.ts:92
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 399. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/vercel-example/route.ts:120
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 400. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/vercel-example/route.ts:141
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 401. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/api/vercel-example/route.ts:163
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 402. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/support/contact/page.tsx:25
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 403. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/trust/page.tsx:53
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 404. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/playground/page.tsx:66
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 405. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/admin/pages/DeletePageButton.tsx:15
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 406. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/admin/pages/new/page.tsx:18
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 407. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/admin/pages/[id]/editor/page.tsx:5
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 408. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/admin/pages/[id]/editor/EditorClient.tsx:66
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 409. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/admin/experiments/new/page.tsx:8
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 410. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/admin/experiments/new/NewExperimentForm.tsx:25
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 411. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/admin/experiments/[id]/page.tsx:5
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 412. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/admin/experiments/[id]/ExperimentDashboardClient.tsx:23
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 413. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/admin/experiments/[id]/ExperimentDashboardClient.tsx:41
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 414. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/cookbooks/page.tsx:201
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 415. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/investor/proof/page.tsx:20
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 416. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/instrumentation.ts:7
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 417. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/signup/page.tsx:19
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 418. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/signup/page.tsx:122
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 419. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/cookbook/page.tsx:201
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 420. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/[slug]/page.tsx:24
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 421. [MEDIUM] Async function without try-catch block

**Category:** Error Handling
**File:** packages/web/src/app/[slug]/page.tsx:47
**Recommendation:** Wrap await calls in try-catch blocks for proper error handling


### 422. [MEDIUM] Found 261 uses of 'any' type

**Category:** Type Safety

**Recommendation:** Consider using proper types or unknown instead of any

