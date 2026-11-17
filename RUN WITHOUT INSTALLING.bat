@echo off
title The Owners Hub
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 ( echo Node.js is not installed. Opening the download page... & start https://nodejs.org/en/download & pause & exit /b 1 )
if not exist node_modules ( echo First run: installing, this takes a few minutes... & call npm install )
call npm start
