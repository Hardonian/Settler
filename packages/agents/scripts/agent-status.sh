#!/bin/bash
# Check Sub-Agent Status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(dirname "$SCRIPT_DIR")"

echo "🤖 Sub-Agent Status Report"
echo "=========================="
echo "Time: $(date)"
echo ""

# Check if PIDs exist
if [ ! -d "$AGENTS_DIR/pids" ]; then
    echo "❌ No PID directory found. Agents may not be running."
    exit 1
fi

# Check each agent
for pid_file in "$AGENTS_DIR/pids"/*.pid; do
    if [ -f "$pid_file" ]; then
        agent=$(basename "$pid_file" .pid)
        pid=$(cat "$pid_file" 2>/dev/null)
        
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            # Get process info
            cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null || echo "N/A")
            mem=$(ps -p "$pid" -o %mem= 2>/dev/null || echo "N/A")
            
            echo "✅ $agent"
            echo "   PID: $pid"
            echo "   CPU: $cpu%"
            echo "   Memory: $mem%"
            
            # Check log file
            log_file="$AGENTS_DIR/logs/$agent.log"
            if [ -f "$log_file" ]; then
                log_size=$(du -h "$log_file" | cut -f1)
                last_log=$(tail -1 "$log_file" 2>/dev/null || echo "No recent logs")
                echo "   Log Size: $log_size"
                echo "   Last Activity: $last_log"
            fi
        else
            echo "❌ $agent (Not running)"
            echo "   PID File: $pid (stale)"
        fi
        echo ""
    fi
done

# Check log files for recent activity
echo "Recent Log Activity"
echo "-------------------"
for log_file in "$AGENTS_DIR/logs"/*.log; do
    if [ -f "$log_file" ]; then
        agent=$(basename "$log_file" .log)
        last_modified=$(stat -c %Y "$log_file" 2>/dev/null || stat -f %m "$log_file" 2>/dev/null)
        now=$(date +%s)
        age=$((now - last_modified))
        
        if [ $age -lt 300 ]; then  # Less than 5 minutes
            echo "✅ $agent: Active (last activity ${age}s ago)"
        elif [ $age -lt 3600 ]; then  # Less than 1 hour
            echo "⚠️  $agent: Recent (last activity $((age/60))m ago)"
        else
            echo "❌ $agent: Stale (last activity $((age/3600))h ago)"
        fi
    fi
done

echo ""
echo "Summary:"
running=$(find "$AGENTS_DIR/pids" -name "*.pid" -exec sh -c 'kill -0 $(cat "$1") 2>/dev/null' _ {} \; -print 2>/dev/null | wc -l)
total=$(ls "$AGENTS_DIR/pids"/*.pid 2>/dev/null | wc -l)
echo "  Running: $running / $total agents"
