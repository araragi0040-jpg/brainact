#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT"
python3 -m uvicorn api.index:app --host 127.0.0.1 --port 8765 &
API_PID=$!
python3 -m http.server 8080 &
UI_PID=$!
cleanup() { kill "$API_PID" "$UI_PID" 2>/dev/null || true; }
trap cleanup INT TERM EXIT
printf '\nVirtual Brain UI: http://127.0.0.1:8080\nPython API:      http://127.0.0.1:8765/api/health\n\n'
wait
