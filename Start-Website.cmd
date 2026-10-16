@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to start this preview.
  pause
  exit /b 1
)
if not defined WEIZTECH_PORT set "WEIZTECH_PORT=5176"
start "" "http://127.0.0.1:%WEIZTECH_PORT%"
node server.mjs
pause
