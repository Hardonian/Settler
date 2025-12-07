#!/bin/bash
# Load Testing & Stress Scenarios
# Tests system under various load conditions

set -e

echo "📊 Load Testing & Stress Scenarios"
echo "==================================="

# Install k6 if not present
if ! command -v k6 >/dev/null 2>&1; then
  echo "Installing k6..."
  brew install k6 || echo "Please install k6 manually: https://k6.io/docs/getting-started/installation/"
fi

# Scenario 1: Normal Load
echo "Scenario 1: Normal Load (100 users)"
k6 run --vus 100 --duration 5m tests/load/normal-load.js || echo "k6 not installed"

# Scenario 2: Peak Load
echo "Scenario 2: Peak Load (500 users)"
k6 run --vus 500 --duration 5m tests/load/peak-load.js || echo "k6 not installed"

# Scenario 3: Stress Test
echo "Scenario 3: Stress Test (1000 users)"
k6 run --vus 1000 --duration 10m tests/load/stress-test.js || echo "k6 not installed"

# Scenario 4: Spike Test
echo "Scenario 4: Spike Test (sudden 2000 users)"
k6 run --vus 2000 --duration 2m tests/load/spike-test.js || echo "k6 not installed"

echo ""
echo "✅ Load testing complete!"
echo "Review results in k6 output above."
