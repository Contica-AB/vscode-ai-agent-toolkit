#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$chatbotDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ollamaExe  = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
if (-not (Test-Path $ollamaExe)) { $ollamaExe = "ollama" }

# Kill anything already using port 3000
$existing = netstat -ano 2>$null | Select-String ":3000\s"
foreach ($line in $existing) {
    $parts  = ($line.ToString().Trim() -split '\s+')
    $procId = $parts[-1]
    if ($procId -match '^\d+$') {
        Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
    }
}

# Ensure Ollama is running with Intel GPU
try {
    Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop | Out-Null
    Write-Host "  Ollama already running." -ForegroundColor Green
} catch {
    Write-Host "  Starting Ollama with Intel GPU support..." -ForegroundColor Yellow
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName  = $ollamaExe
    $startInfo.Arguments = "serve"
    $startInfo.UseShellExecute = $false
    $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $startInfo.EnvironmentVariables["OLLAMA_INTEL_GPU"] = "1"
    [System.Diagnostics.Process]::Start($startInfo) | Out-Null
    Start-Sleep -Seconds 4
    Write-Host "  Ollama started." -ForegroundColor Green
}

# Open browser
Start-Job -ScriptBlock { Start-Sleep -Seconds 2; Start-Process "http://localhost:3000" } | Out-Null

Push-Location $chatbotDir
Write-Host ""
Write-Host "  DeploX chatbot running at http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Model: llama3.2:1b   Press Ctrl+C to stop.`n" -ForegroundColor Gray
node server.js
Pop-Location