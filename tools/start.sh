#!/usr/bin/env bash
# Cozy Creatures — Launch everything
#
# Usage: ./tools/start.sh [--no-docker]
#
# Starts Docker (LiveKit), installs deps, and launches dev servers.
# Pass --no-docker to skip LiveKit (voice chat disabled).

set -e
cd "$(dirname "$0")/.."

SKIP_DOCKER=false
for arg in "$@"; do
  case "$arg" in
    --no-docker) SKIP_DOCKER=true ;;
  esac
done

echo "=== Cozy Creatures ==="

# 1. Docker / LiveKit
if [ "$SKIP_DOCKER" = false ]; then
  echo ""
  echo "[1/3] Starting LiveKit (Docker)..."
  if docker compose up -d 2>/dev/null; then
    echo "  LiveKit running on port 7880"
  else
    echo "  WARNING: Docker not available — voice chat will be disabled"
  fi
else
  echo ""
  echo "[1/3] Skipping Docker (--no-docker)"
fi

# 2. Install dependencies
echo ""
echo "[2/3] Installing dependencies..."
pnpm install --silent

# 3. Start dev servers
echo ""
echo "[3/3] Starting dev servers..."
echo "  Client: https://localhost:5173"
echo "  Server: http://localhost:3001"
echo ""
exec pnpm dev
