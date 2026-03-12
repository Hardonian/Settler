# Feature Flag Matrix

This matrix tracks environment-controlled flags that alter runtime behavior.

| Flag                                | Subsystem              | Default              | Effect when enabled                                            | Failure/rollback note                                                        |
| ----------------------------------- | ---------------------- | -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ENABLE_SCHEMA_PER_TENANT`          | API tenancy            | `false`              | Enables schema-per-tenant behavior                             | keep `false` unless migration/tenancy model is validated                     |
| `ENABLE_REQUEST_TIMEOUT`            | API runtime            | `true`               | Enforces API request timeout behavior                          | disable only for controlled diagnostics                                      |
| `ENABLE_API_DOCS`                   | API docs surface       | `true`               | Exposes API docs endpoints                                     | can disable for hardened prod surface                                       |
| `JOBFORGE_INTEGRATION_ENABLED`      | Enterprise integration | `false`              | Enables JobForge integration path                              | keep off for OSS baseline                                                    |
| `JOBFORGE_BUNDLE_EXECUTION_ENABLED` | Enterprise integration | `false`              | Enables JobForge bundle execution path                         | keep off unless operator-approved                                            |
| `SETTLER_KERNEL_ENABLED`            | Kernel runtime         | `false`              | Allows kernel usage path                                       | still requires per-operation allowlist for primary mode                     |
| `SETTLER_KERNEL_CANONICALIZE`       | Kernel runtime         | `false`              | Enables kernel canonicalization/hash path                      | fallback remains TS canonicalization                                         |
| `SETTLER_KERNEL_EXECUTION_MODE`     | Kernel runtime         | `primary`            | Explicit mode: `disabled`, `compare_only`, `shadow`, `primary` | set `shadow`/`compare_only` for safe rollout, `disabled` for rollback       |
| `SETTLER_KERNEL_SHADOW_ONLY`        | Kernel runtime         | `false`              | Legacy shortcut forcing execution mode to `shadow`             | lower clarity than explicit mode; prefer `SETTLER_KERNEL_EXECUTION_MODE`    |
| `SETTLER_KERNEL_SHADOW_MODE`        | Kernel runtime         | `false`              | Legacy shortcut forcing shadow behavior                        | lower clarity than explicit mode; prefer `SETTLER_KERNEL_EXECUTION_MODE`    |
| `SETTLER_DISABLE_KERNEL`            | Kernel kill switch     | `false`              | Forces kernel off and fallback path                            | highest-precedence emergency rollback control                                |
| `SETTLER_DISABLE_OPERATION`         | Kernel kill switch     | empty                | Disables listed kernel operations                              | use for scoped rollback when only one operation is unstable                 |
| `SETTLER_KERNEL_PRIMARY_ALLOWLIST`  | Kernel routing         | empty                | Allows listed operations to run primary via kernel             | empty allowlist means no primary-kernel operation even when kernel is on     |
| `SETTLER_KERNEL_ALLOW_CARGO`        | Kernel runner policy   | `false` in prod      | Allows cargo-run fallback runner                               | should remain off in production; dev/local bootstrap only                    |
| `SAFE_MODE`                         | Web safety mode        | `false`              | Enables conservative/safe behavior toggles                     | use in incident response if needed                                           |
| `ALERT_NOTIFIER_DRY_RUN`            | Alerting               | `false`              | Suppresses outbound notification sends                         | use during channel setup verification                                        |

## Kernel precedence (actual runtime order)

1. `SETTLER_DISABLE_KERNEL=1` forces disabled mode.
2. `SETTLER_KERNEL_SHADOW_ONLY=1` forces shadow mode.
3. `SETTLER_KERNEL_EXECUTION_MODE` applies if valid.
4. `SETTLER_KERNEL_SHADOW_MODE=1` forces shadow mode.
5. Otherwise default execution mode is `primary`.

Primary mode still requires `SETTLER_KERNEL_PRIMARY_ALLOWLIST` to include each operation.
