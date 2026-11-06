@echo off
title AGROMAYA Launcher
echo ========================================================
echo   Starting AGROMAYA / BIOCHAR CONNECT Platform...
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Launching AI Microservice on Port 8000...
start "AGROMAYA - AI Service (Port 8000)" cmd /k "cd ai-service && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/3] Launching Backend API Server on Port 5000...
start "AGROMAYA - Backend Server (Port 5000)" cmd /k "cd backend && npx tsx src/server.ts"

timeout /t 3 /nobreak >nul

echo [3/3] Launching Frontend Web Dashboard on Port 3000...
start "AGROMAYA - Frontend React (Port 3000)" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo   All 3 services have been launched in separate windows!
echo   Opening browser at http://localhost:3000 ...
echo ========================================================
start http://localhost:3000
pause
