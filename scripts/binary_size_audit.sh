#!/usr/bin/env bash
set -euo pipefail

# Universal binary size audit
echo "=== Binary Size Audit ==="

# Find all binaries
find . -type f \( -name "*.exe" -o -name "*.bin" -o -path "*/dist/*" -o -path "*/build/*" \) -executable 2>/dev/null | while read bin; do
    size=$(stat -c%s "$bin" 2>/dev/null || stat -f%z "$bin" 2>/dev/null)
    echo "$bin: $(numfmt --to=iec $size 2>/dev/null || echo "$size bytes")"
done

# Rust-specific
if command -v cargo >/dev/null && [ -f Cargo.toml ]; then
    echo
    echo "=== Rust bloaty analysis ==="
    cargo build --release --workspace --locked 2>/dev/null
    for bin in target/release/*; do
        [ -f "$bin" ] && [ -x "$bin" ] && command -v bloaty >/dev/null && bloaty "$bin" -d compileunits,sections --sort=-size 2>/dev/null | head -20
    done
fi

# Go-specific
if command -v go >/dev/null && [ -f go.mod ]; then
    echo
    echo "=== Go binary size ==="
    go build -trimpath -ldflags="-s -w" -o /tmp/app ./... 2>/dev/null
    ls -lh /tmp/app 2>/dev/null
fi