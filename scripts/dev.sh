#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_HOST="127.0.0.1"
DEFAULT_PORT="5173"
DEFAULT_URL="http://${DEFAULT_HOST}:${DEFAULT_PORT}/"

cd "$ROOT_DIR"

if [ ! -d node_modules ]; then
  echo "Dependencies are missing. Run: npm install"
  exit 1
fi

echo "Starting Moonly dev server..."
echo "Agent mode binds to ${DEFAULT_HOST} to avoid sandbox issues with IPv6 localhost."
echo "Expected local URL: $DEFAULT_URL"
echo "If port ${DEFAULT_PORT} is occupied, use the URL printed by Vite."

exec npm run dev -- --host "$DEFAULT_HOST" --port "$DEFAULT_PORT" "$@"
