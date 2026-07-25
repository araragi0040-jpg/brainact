@echo off
cd /d %~dp0
start "Virtual Brain API" cmd /k "python -m uvicorn api.index:app --host 127.0.0.1 --port 8765"
start "Virtual Brain UI" cmd /k "python -m http.server 8080"
timeout /t 2 /nobreak >nul
start http://127.0.0.1:8080
