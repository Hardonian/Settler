#!/usr/bin/env bash
# scripts/security-scan.sh — quick local secret + hygiene scan before push.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
echo "== Hardonian secret/hygiene scan =="
# 1. No committed .env with real values
if [ -f .env ] && grep -qE "=(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|sk_live_|rk_live_|AKIA[0-9A-Z]{16})" .env; then
  echo "FAIL: .env contains a likely real secret. Do not commit .env."
  exit 1
fi
# 2. No private key blocks in tracked files
if git grep -n "BEGIN.*PRIVATE KEY" -- ':!*.md' 2>/dev/null; then
  echo "FAIL: private key material found in tracked files."
  exit 1
fi
# 3. .env must be gitignored
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "FAIL: .env is tracked by git. Run: git rm --cached .env && echo '.env' >> .gitignore"
  exit 1
fi
echo "OK: no obvious secret exposure."
