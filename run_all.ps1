# AGROMAYA 1-Click PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Starting AGROMAYA / BIOCHAR CONNECT Platform...       " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/3] Starting AI Microservice on Port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\ai-service'; python -m uvicorn main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting Backend API Server on Port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; npx tsx src/server.ts"

Start-Sleep -Seconds 3

Write-Host "[3/3] Starting Frontend React App on Port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "`nOpening browser at http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"
