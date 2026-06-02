@echo off
REM Start budge-it app using PM2 (requires global npm install of pm2)
REM This script should be run from the project root directory

cd /d "%~dp0"
pm2 start ecosystem.config.js

