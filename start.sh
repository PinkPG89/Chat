#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-serve}"
PORT="${PORT:-55173}"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="/tmp/aiops-chat"
LOG_DIR="${RUN_DIR}/logs"
PID_FILE="${RUN_DIR}/pids"

mkdir -p "${LOG_DIR}"

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Stopping existing Chat UI on port ${port}: ${pids}"
    kill ${pids} 2>/dev/null || true
    sleep 1
  fi

  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Force stopping existing Chat UI on port ${port}: ${pids}"
    kill -9 ${pids} 2>/dev/null || true
  fi
}

status() {
  if lsof -iTCP:"${PORT}" -sTCP:LISTEN -P -n >/dev/null 2>&1; then
    echo "Chat UI listening: http://localhost:${PORT}/"
  else
    echo "Chat UI down on port ${PORT}"
  fi
  pgrep -af 'vite|agent-console-chat-ui|npm run dev' || true
}

case "${MODE}" in
  status)
    status
    exit 0
    ;;
  stop)
    kill_port "${PORT}"
    : > "${PID_FILE}"
    exit 0
    ;;
  serve)
    ;;
  *)
    PORT="${MODE}"
    ;;
esac

kill_port "${PORT}"
: > "${PID_FILE}"

cat <<EOF
Starting chat UI on port ${PORT}

URLs:
  Local:     http://localhost:${PORT}/
  Tailscale: http://100.82.71.91:${PORT}/

Logs:
  ${LOG_DIR}/chat.log

Press Ctrl-C to stop Chat UI.
EOF

cd "${BASE_DIR}"
exec npm run dev -- --port "${PORT}" --strictPort 2>&1 | tee "${LOG_DIR}/chat.log"
