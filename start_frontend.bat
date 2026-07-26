@echo off
cd /d "%~dp0public"
python -m http.server 8080
