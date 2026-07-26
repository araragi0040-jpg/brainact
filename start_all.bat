@echo off
cd /d "%~dp0"
start "Virtual Brain API" cmd /k "python -m uvicorn backend.server:app --host 127.0.0.1 --port 8765"
start "Virtual Brain Frontend" cmd /k "cd /d public && python -m http.server 8080"
start "" http://127.0.0.1:8080
