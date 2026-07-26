@echo off
cd /d "%~dp0"
python -m pip install -r requirements-brian2.txt
if errorlevel 1 (
  echo Brian2 installation failed.
  pause
  exit /b 1
)
echo.
echo Brian2 installation completed. Run start_all.bat next.
pause
