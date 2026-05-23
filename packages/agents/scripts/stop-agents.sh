#!/bin/bash
<<<<<<< HEAD
set -euo pipefail
=======
# Stop All Sub-Agents
>>>>>>> origin/pr-833

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(dirname "$SCRIPT_DIR")"

<<<<<<< HEAD
rm -rf "$AGENTS_DIR/pids"

echo "Settler agents stop boundary"
echo
echo "No daemonized local agents are supported from packages/agents."
echo "Any stale PID directory has been removed."

exit 0
=======
echo "🛑 Stopping Sub-Agents"
echo "====================="
echo ""

# Stop each agent
for pid_file in "$AGENTS_DIR/pids"/*.pid; do
    if [ -f "$pid_file" ]; then
        agent=$(basename "$pid_file" .pid)
        pid=$(cat "$pid_file" 2>/dev/null)
        
        if [ -n "$pid" ]; then
            echo "Stopping $agent (PID: $pid)..."
            
            # Try graceful shutdown first
            if kill -0 "$pid" 2>/dev/null; then
                kill -TERM "$pid" 2>/dev/null
                
                # Wait up to 5 seconds
                for i in {1..5}; do
                    if ! kill -0 "$pid" 2>/dev/null; then
                        echo "  ✅ Graceful shutdown complete"
                        break
                    fi
                    sleep 1
                done
                
                # Force kill if still running
                if kill -0 "$pid" 2>/dev/null; then
                    echo "  ⚠️  Force killing..."
                    kill -9 "$pid" 2>/dev/null
                fi
            else
                echo "  ⚠️  Process not running (stale PID file)"
            fi
        fi
        
        # Remove PID file
        rm -f "$pid_file"
    fi
done

echo ""
echo "✅ All agents stopped"
echo ""

# Summary
echo "Cleanup:"
echo "  PID files removed"
echo "  Log files preserved in: $AGENTS_DIR/logs"
echo ""
>>>>>>> origin/pr-833
