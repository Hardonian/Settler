💡 **What:**
Added the required `GITHUB_TOKEN` environment variable to the `gitleaks-action` step in `.github/workflows/secrets-scan.yml` and removed the invalid `config-path` input.

🎯 **Why:**
The `gitleaks-action` v2 recently introduced a breaking change requiring `GITHUB_TOKEN` to scan pull requests. The missing token caused the `scan` job to fail in CI. Additionally, `config-path` is no longer a valid input parameter for the action and was raising a warning.
