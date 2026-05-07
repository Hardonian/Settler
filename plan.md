1.  **Analyze CI Failure**:
    The GitHub Actions CI failed with the following error:
    ```
    This request has been automatically failed because it uses a deprecated version of `actions/upload-artifact: v3`.
    ```
    This means we need to find `.github/workflows` YAML files and update `actions/upload-artifact@v3` to `actions/upload-artifact@v4`.

2.  **Implementation (Done)**:
    - Searched for `actions/upload-artifact@v3`.
    - Found it in `.github/workflows/auto-merge.yml`, `.github/workflows/schema-parity-check.yml`, and `.github/workflows/classify.yml`.
    - Used `sed` to replace all instances of `@v3` with `@v4` for `upload-artifact`.
    - Verified replacement using `grep`.
    - Also verified `download-artifact` is already using `v4` in the codebase.

3.  **Verification (Done)**:
    - Verified the `.github/workflows` folder no longer contains `actions/upload-artifact@v3` or `actions/download-artifact@v3`.

4.  **Pre-commit steps**:
    - Commit the changes and update the PR.

5.  **Submit**:
    - Submit the changes.
