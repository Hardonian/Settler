#!/usr/bin/env bash
set -euo pipefail

# Universal load test
ENDPOINT="${1:-http://localhost:8080/health}"
DURATION="${2:-30s}"
CONNECTIONS="${3:-100}"
THREADS="${4:-4}"

echo "=== Load Test ==="
echo "Endpoint: $ENDPOINT"
echo "Duration: $DURATION"
echo "Connections: $CONNECTIONS"
echo "Threads: $THREADS"

if ! command -v wrk >/dev/null; then
    echo "wrk not installed. Install with: sudo apt install wrk"
    exit 1
fi

wrk -t"$THREADS" -c"$CONNECTIONS" -d"$DURATION" --latency "$ENDPOINT" | tee load_test_results.txt

echo
echo "=== SLA Gates ==="
echo "Check load_test_results.txt for:"
echo "  - p99 latency < 100ms"
echo "  - Error rate < 0.1%"
echo "  - Throughput > 1000 req/s"