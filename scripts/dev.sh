#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${MOONLY_HOST:-127.0.0.1}"
PORT="${MOONLY_PORT:-5173}"
EXTRA_ARGS=()

is_port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

find_available_port() {
  local candidate="$1"

  while is_port_in_use "$candidate"; do
    candidate="$((candidate + 1))"
  done

  echo "$candidate"
}

resolve_lan_ip() {
  local default_interface
  default_interface="$(route get default 2>/dev/null | awk '/interface:/{print $2; exit}')"

  if [ -n "${default_interface:-}" ]; then
    ipconfig getifaddr "$default_interface" 2>/dev/null && return 0
  fi

  ifconfig | awk '/inet / && $2 != "127.0.0.1" { print $2; exit }'
}

cd "$ROOT_DIR"

if [ ! -d node_modules ]; then
  echo "Dependencies are missing. Run: npm install"
  exit 1
fi

while [ "$#" -gt 0 ]; do
  case "$1" in
    --lan)
      HOST="0.0.0.0"
      shift
      ;;
    --host)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --host"
        exit 1
      fi
      HOST="$2"
      shift 2
      ;;
    --port)
      if [ "$#" -lt 2 ]; then
        echo "Missing value for --port"
        exit 1
      fi
      PORT="$2"
      shift 2
      ;;
    *)
      EXTRA_ARGS+=("$1")
      shift
      ;;
  esac
done

ORIGINAL_PORT="$PORT"
PORT="$(find_available_port "$PORT")"
DEFAULT_URL="http://${HOST}:${PORT}/"

echo "Starting Moonly dev server..."
if [ "$HOST" = "0.0.0.0" ]; then
  LAN_IP="$(resolve_lan_ip || true)"
  echo "LAN mode exposes the dev server on your local network."
  if [ -n "${LAN_IP:-}" ]; then
    echo "Expected network URL: http://${LAN_IP}:${PORT}/"
  else
    echo "Expected network URL: use the Network URL printed by Vite."
  fi
else
  echo "Agent mode binds to ${HOST} to avoid sandbox issues with IPv6 localhost."
fi
echo "Expected local URL: $DEFAULT_URL"
if [ "$PORT" != "$ORIGINAL_PORT" ]; then
  echo "Port ${ORIGINAL_PORT} is busy, switched to ${PORT}."
fi

exec npm run dev -- --host "$HOST" --port "$PORT" "${EXTRA_ARGS[@]}"
