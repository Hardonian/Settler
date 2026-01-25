#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT_PATH="$ROOT_DIR/fixtures/input/engine_input.json"
EXPECTED_PATH="$ROOT_DIR/fixtures/expected/hashes.json"
OUTPUT_DIR="$ROOT_DIR/fixtures/output"

rm -rf "$OUTPUT_DIR"

(
  cd "$ROOT_DIR"
  go run . --input "$INPUT_PATH"
)

ROOT_DIR="$ROOT_DIR" python3 - <<'PY'
import json
import hashlib
import os
from pathlib import Path

root = Path(os.environ["ROOT_DIR"]).resolve()
output_dir = root / 'fixtures' / 'output' / 'evidence'
expected_path = root / 'fixtures' / 'expected' / 'hashes.json'

files = {
    'normalized.jsonl': output_dir / 'normalized.jsonl',
    'variances.jsonl': output_dir / 'variances.jsonl',
}

hashes = {}
for key, path in files.items():
    content = path.read_bytes()
    hashes[key] = hashlib.sha256(content).hexdigest()

expected = json.loads(expected_path.read_text())
if hashes != expected:
    raise SystemExit(f"Fixture hashes mismatch. Expected {expected} got {hashes}")

print("Fixture hashes match expected.")
PY
