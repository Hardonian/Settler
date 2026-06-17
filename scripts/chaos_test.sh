#!/usr/bin/env bash
set -euo pipefail

# Universal chaos testing with toxiproxy
TOXIPROXY_URL="${TOXIPROXY_URL:-http://localhost:8474}"
SERVICE_PORT="${SERVICE_PORT:-8080}"

echo "=== Chaos Testing ==="
echo "Toxiproxy: $TOXIPROXY_URL"
echo "Service port: $SERVICE_PORT"

PROXY_NAME="api-chaos"
curl -s -X POST "$TOXIPROXY_URL/proxies" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$PROXY_NAME\",\"upstream\":\"localhost:$SERVICE_PORT\",\"listen\":\"0.0.0.0:8666\",\"enabled\":true}" | jq .

echo
echo "Injecting latency (100ms)..."
curl -s -X POST "$TOXIPROXY_URL/proxies/$PROXY_NAME/toxics" \
  -H "Content-Type: application/json" \
  -d '{"name":"latency","type":"latency","attributes":{"latency":100,"jitter":10}}' | jq .

echo "Test your service at http://localhost:8666"
echo "Press Ctrl+C to remove toxic and exit"

trap 'curl -s -X DELETE "$TOXIPROXY_URL/proxies/$PROXY_NAME/toxics/latency"' EXIT
sleep infinity