@echo off
title The Owners Hub - build installer
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Opening the download page - install the LTS version, then run this file again.
  start https://nodejs.org/en/download
  pause
  exit /b 1
)
echo Installing build tools (first time takes a few minutes)...
call npm install
if errorlevel 1 ( echo Install failed. & pause & exit /b 1 )
echo Building the Windows installer...
call npm run dist
if errorlevel 1 ( echo Build failed. & pause & exit /b 1 )
echo.
echo Done! Opening the folder with your installer...
start "" "%~dp0dist"
pause
