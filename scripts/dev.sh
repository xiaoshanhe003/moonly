#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_URL="http://localhost:5173/"

cd "$ROOT_DIR"

if [ ! -d node_modules ]; then
  echo "Dependencies are missing. Run: npm install"
  exit 1
fi

echo "Starting Moonly dev server..."
echo "Expected local URL: $DEFAULT_URL"
echo "If port 5173 is occupied, use the URL printed by Vite."

exec npm run dev -- "$@"
