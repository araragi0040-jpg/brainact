#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
python3 -m pip install -r requirements-brian2.txt
printf '\nBrian2 installation completed. Start the app with ./start_all.sh\n'
