# Hardonian standard justfile — works for any stack.
# Install just: pipx install rust-just

# Detect and install deps + create .env
bootstrap:
    ./scripts/bootstrap.sh

# Run the app (override per repo)
dev:
    @echo "Override 'dev' in your repo justfile"

# Run tests
test:
    @echo "Override 'test' in your repo justfile"

# Smoke / health check
smoke:
    @echo "Override 'smoke' in your repo justfile"

# Show status
status:
    @curl -fsS http://127.0.0.1:8000/health || echo "no health endpoint on :8000"
