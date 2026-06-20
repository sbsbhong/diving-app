#!/bin/sh
set -eu

case "${CONFIGURATION:-}" in
  *Debug*) ;;
  *) exit 0 ;;
esac

if [ -n "${RCT_NO_LAUNCH_PACKAGER:-}" ]; then
  echo "RCT_NO_LAUNCH_PACKAGER enabled; skipping Metro startup."
  exit 0
fi

PORT="${RCT_METRO_PORT:-8081}"
STATUS_URL="http://localhost:${PORT}/status"

metro_status() {
  curl -fsS --max-time 2 "$STATUS_URL" 2>/dev/null || true
}

if [ "$(metro_status)" = "packager-status:running" ]; then
  echo "Metro is already running on port ${PORT}."
  exit 0
fi

if command -v nc >/dev/null 2>&1 && nc -w 2 -z localhost "$PORT" >/dev/null 2>&1; then
  echo "error: Port ${PORT} is in use, but it is not a React Native Metro server." >&2
  echo "Stop the process using that port or set RCT_METRO_PORT to a free port." >&2
  exit 2
fi

PROJECT_ROOT="${SRCROOT}/.."
PACKAGER_SCRIPT="${REACT_NATIVE_PATH:-${SRCROOT}/../../../node_modules/react-native}/scripts/packager.sh"
LOG_PATH="${TMPDIR:-/tmp}/dive-mobile-metro-${PORT}.log"

if [ ! -f "$PACKAGER_SCRIPT" ]; then
  echo "error: React Native packager script not found at ${PACKAGER_SCRIPT}." >&2
  exit 2
fi

echo "Starting Metro on port ${PORT}..."
nohup /bin/sh -c '
  export PROJECT_ROOT="$1"
  export RCT_METRO_PORT="$2"
  exec /bin/sh "$3" --reset-cache --port "$2"
' sh "$PROJECT_ROOT" "$PORT" "$PACKAGER_SCRIPT" > "$LOG_PATH" 2>&1 &

ATTEMPTS=60
while [ "$ATTEMPTS" -gt 0 ]; do
  if [ "$(metro_status)" = "packager-status:running" ]; then
    echo "Metro started on port ${PORT}."
    exit 0
  fi

  ATTEMPTS=$((ATTEMPTS - 1))
  sleep 1
done

echo "error: Metro did not report ready within 60 seconds. See ${LOG_PATH}." >&2
exit 2
