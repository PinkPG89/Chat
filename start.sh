#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-55173}"
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="/tmp/aiops-chat"
LOG_DIR="${RUN_DIR}/logs"
PID_FILE="${RUN_DIR}/pids"

mkdir -p "${LOG_DIR}"
: > "${PID_FILE}"

echo "Starting chat UI on port ${PORT}..."
(
  cd "${BASE_DIR}"
  nohup bash -lc "npm run dev -- --port ${PORT} --strictPort" > "${LOG_DIR}/chat.log" 2>&1 &
  echo "$!" >> "${PID_FILE}"
)

for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:${PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

cat <<EOF

Chat started.

URLs:
  Local:     http://localhost:${PORT}/
  Tailscale: http://100.82.71.91:${PORT}/

Logs:
  ${LOG_DIR}

PIDs:
  ${PID_FILE}

Stop:
  kill \$(cat ${PID_FILE})
EOF

