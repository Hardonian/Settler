# Feature Flag Matrix

This matrix tracks environment-controlled flags that alter runtime behavior.

| Flag                                | Subsystem              | Default              | Effect when enabled                                            | Failure/rollback note                                    |
| ----------------------------------- | ---------------------- | -------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| `ENABLE_SCHEMA_PER_TENANT`          | API tenancy            | `false`              | Enables schema-per-tenant behavior                             | keep `false` unless migration/tenancy model is validated |
| `ENABLE_REQUEST_TIMEOUT`            | API runtime            | `true`               | Enforces API request timeout behavior                          | disable only for controlled diagnostics                  |
| `ENABLE_API_DOCS`                   | API docs surface       | `true`               | Exposes API docs endpoints                                     | can disable for hardened prod surface                    |
| `JOBFORGE_INTEGRATION_ENABLED`      | Enterprise integration | `false`              | Enables JobForge integration path                              | keep off for OSS baseline                                |
| `JOBFORGE_BUNDLE_EXECUTION_ENABLED` | Enterprise integration | `false`              | Enables JobForge bundle execution path                         | keep off unless operator-approved                        |
| `SETTLER_KERNEL_ENABLED`            | Kernel runtime         | `false` (unless set) | Allows kernel usage path                                       | can be overridden by `SETTLER_DISABLE_KERNEL=1`          |
| `SETTLER_KERNEL_CANONICALIZE`       | Kernel runtime         | `false` (unless set) | Enables kernel canonicalization path                           | fallback remains TS canonicalization                     |
| `SETTLER_KERNEL_SHADOW_MODE`        | Kernel runtime         | `false`              | Runs kernel in shadow mode                                     | safe for production comparison rollout                   |
| `SETTLER_KERNEL_EXECUTION_MODE`     | Kernel runtime         | `primary`            | Explicit mode: `disabled`, `compare_only`, `shadow`, `primary` | use `shadow` or `disabled` for rollback                  |
| `SETTLER_DISABLE_KERNEL`            | Kernel kill switch     | `false`              | Forces kernel off and fallback path                            | primary emergency rollback control                       |
| `SAFE_MODE`                         | Web safety mode        | `false`              | Enables conservative/safe behavior toggles                     | use in incident response if needed                       |
| `ALERT_NOTIFIER_DRY_RUN`            | Alerting               | `false`              | suppresses outbound notification sends                         | use during channel setup verification                    |
