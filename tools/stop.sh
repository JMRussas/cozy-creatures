#!/usr/bin/env bash
# Cozy Creatures — Stop everything
#
# Stops dev servers (if backgrounded) and Docker containers.

set -e
cd "$(dirname "$0")/.."

echo "=== Stopping Cozy Creatures ==="

# Stop Docker containers
if docker compose down 2>/dev/null; then
  echo "  LiveKit stopped"
else
  echo "  Docker not running (or not available)"
fi

echo "  Done. Dev servers will stop when their terminal closes."
