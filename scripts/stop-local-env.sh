#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

STOPPED_COUNT=0

# Try to read PIDs from file
if [ -f .local-env-pids ]; then
    source .local-env-pids

    # Stop Hardhat node
    if [ ! -z "$HARDHAT_PID" ] && kill -0 $HARDHAT_PID 2>/dev/null; then
        kill $HARDHAT_PID 2>/dev/null || true
        ((STOPPED_COUNT++))
    fi

    # Stop backend server
    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null || true
        ((STOPPED_COUNT++))
    fi
fi

# Remove PID file
rm -f .local-env-pids

# Check and stop by port (fallback)
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    lsof -ti:8545 | xargs kill -9 2>/dev/null || true
    ((STOPPED_COUNT++))
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    ((STOPPED_COUNT++))
fi

# Remove .env.local by default (unless --keep-env is specified)
if [ "$1" != "--keep-env" ] && [ -f .env.local ]; then
    rm -f .env.local
fi

# Clean up log files (optional)
if [ "$1" == "--clean" ]; then
    rm -f hardhat-node.log backend.log .env.local .local-env-pids
fi

echo ""
if [ $STOPPED_COUNT -eq 0 ]; then
    echo "No services were running"
else
    echo "Stopped $STOPPED_COUNT process(es)"
fi
echo ""
