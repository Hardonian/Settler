with open(".github/workflows/secrets-scan.yml", "r") as f:
    content = f.read()

# Replace config-path (which is invalid as of v2 maybe) or add GITHUB_TOKEN.
# The error says: "Unexpected input(s) 'config-path', valid inputs are ['']" for gitleaks-action@v2
# And "GITHUB_TOKEN is now required to scan pull requests"

# So we need to add:
# env:
#   GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
# And remove config-path: .gitleaks.toml

new_content = content.replace("        with:\n          config-path: .gitleaks.toml", "        env:\n          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}")

with open(".github/workflows/secrets-scan.yml", "w") as f:
    f.write(new_content)

with open(".github/workflows/security.yml", "r") as f:
    sec_content = f.read()

sec_content = sec_content.replace("        with:\n          config-path: .gitleaks.toml\n          no-git: false\n          verbose: true\n          redact: true", "")
with open(".github/workflows/security.yml", "w") as f:
    f.write(sec_content)
