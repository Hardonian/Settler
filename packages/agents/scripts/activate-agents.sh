#!/bin/bash
# 24/7 Sub-Agent Activation Script
# Usage: ./activate-agents.sh [--daemon]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$AGENTS_DIR/src"

echo "🤖 KILOCLAW Sub-Agent Activation"
echo "================================"
echo ""
echo "Date: $(date)"
echo "Agents Directory: $AGENTS_DIR"
echo ""

# Check environment
check_env() {
    local var=$1
    local required=$2
    
    if [ -z "${!var}" ]; then
        if [ "$required" = "true" ]; then
            echo "❌ Required: $var is not set"
            return 1
        else
            echo "⚠️  Optional: $var is not set"
        fi
    else
        echo "✅ $var is configured"
    fi
}

echo "Checking environment variables..."
echo ""

# Required
check_env "NEXT_PUBLIC_SUPABASE_URL" "true" || exit 1
check_env "SUPABASE_SERVICE_ROLE_KEY" "true" || exit 1

# Optional but recommended
check_env "SLACK_WEBHOOK_URL" "false"
check_env "VERCEL_TOKEN" "false"
check_env "GITHUB_TOKEN" "false"

echo ""

# Check if TypeScript is compiled
if [ ! -d "$AGENTS_DIR/dist" ]; then
    echo "📦 Building agents..."
    cd "$AGENTS_DIR"
    
    if command -v pnpm &> /dev/null; then
        pnpm build
    elif command -v npm &> /dev/null; then
        npm run build
    else
        echo "❌ No package manager found (pnpm or npm)"
        exit 1
    fi
fi

# Function to start an agent
start_agent() {
    local agent=$1
    local cmd=$2
    
    echo "🚀 Starting $agent..."
    
    if [ "$DAEMON_MODE" = "true" ]; then
        # Run in background
        nohup $cmd > "$AGENTS_DIR/logs/$agent.log" 2>&1 &
        echo $! > "$AGENTS_DIR/pids/$agent.pid"
        echo "   PID: $(cat "$AGENTS_DIR/pids/$agent.pid")"
    else
        # Run in foreground (for testing)
        echo "   Running: $cmd"
        echo "   (Press Ctrl+C to stop)"
        $cmd
    fi
}

# Create necessary directories
mkdir -p "$AGENTS_DIR/logs"
mkdir -p "$AGENTS_DIR/pids"
mkdir -p "$AGENTS_DIR/data"

# Parse arguments
DAEMON_MODE="false"
if [ "$1" = "--daemon" ]; then
    DAEMON_MODE="true"
fi

echo "Activation Mode: $([ "$DAEMON_MODE" = "true" ] && echo "Daemon (Background)" || echo "Foreground")"
echo ""

# Option 1: Start Orchestrator (recommended)
echo "Option 1: Start Orchestrator (Manages all agents)"
echo "------------------------------------------------"
start_agent "orchestrator" "node $SRC_DIR/orchestrator-agent.js"

# Option 2: Start individual agents (alternative)
# echo ""
# echo "Option 2: Start Individual Agents"
# echo "---------------------------------"
# start_agent "monitor" "node $SRC_DIR/monitor-agent.js"
# start_agent "security" "node $SRC_DIR/security-agent.js --scan=all"

echo ""
echo "✅ Sub-Agents Activated!"
echo ""

if [ "$DAEMON_MODE" = "true" ]; then
    echo "Agents running in background."
    echo ""
    echo "Commands:"
    echo "  View logs:    tail -f $AGENTS_DIR/logs/*.log"
    echo "  Stop agents:  ./scripts/stop-agents.sh"
    echo "  Check status: ./scripts/agent-status.sh"
    echo ""
    echo "PIDs:"
    for pid_file in "$AGENTS_DIR/pids"/*.pid; do
        if [ -f "$pid_file" ]; then
            agent=$(basename "$pid_file" .pid)
            pid=$(cat "$pid_file")
            echo "  $agent: $pid"
        fi
    done
else
    echo "Agents running in foreground."
    echo "Press Ctrl+C to stop."
fi

echo ""
