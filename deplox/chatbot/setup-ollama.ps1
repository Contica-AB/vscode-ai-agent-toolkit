#Requires -Version 5.1
<#
.SYNOPSIS
    Sets up Ollama and pulls the llama3.1:8b model for DeploX chatbot.
#>

$ErrorActionPreference = "Stop"

function Write-Step  { Write-Host "`n-> $args" -ForegroundColor Cyan }
function Write-OK    { Write-Host "  [OK] $args" -ForegroundColor Green }
function Write-Warn  { Write-Host "  [WARN] $args" -ForegroundColor Yellow }
function Write-Fail  { Write-Host "  [FAIL] $args" -ForegroundColor Red }

Write-Host ""
Write-Host "  DeploX v0.01 -- Setup" -ForegroundColor Cyan
Write-Host ""

# -- 1. Check Node.js --------------------------------------------------------
Write-Step "Checking Node.js (18+ required)..."
try {
    $nodeVer = node --version 2>&1
    $major = [int]([regex]::Match($nodeVer, 'v(\d+)').Groups[1].Value)
    if ($major -lt 18) { Write-Fail "Node $nodeVer found but 18+ is required. Install from https://nodejs.org"; exit 1 }
    Write-OK "Node $nodeVer"
} catch {
    Write-Fail "Node.js not found. Install from https://nodejs.org"
    exit 1
}

# -- 2. Install npm dependencies ---------------------------------------------
Write-Step "Installing npm dependencies..."
$chatbotDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $chatbotDir
npm install --silent
Pop-Location
Write-OK "npm install complete"

# -- 3. Check / Install Ollama -----------------------------------------------
Write-Step "Checking Ollama..."
$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollamaCmd) {
    Write-OK "Ollama already installed: $($ollamaCmd.Source)"
} else {
    Write-Warn "Ollama not found. Attempting install via winget..."
    try {
        winget install --id Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements
        Write-OK "Ollama installed via winget"
        Write-Warn "Please restart your terminal, then run this script again."
        exit 0
    } catch {
        Write-Fail "winget install failed. Download manually from https://ollama.com/download"
        Start-Process "https://ollama.com/download"
        exit 1
    }
}

# -- 4. Start Ollama service (if not running) --------------------------------
Write-Step "Checking Ollama service..."
try {
    Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop | Out-Null
    Write-OK "Ollama is running"
} catch {
    Write-Warn "Ollama not running -- starting it..."
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 4
    Write-OK "Ollama started"
}

# -- 5. Pull model -----------------------------------------------------------
Write-Step "Pulling llama3.1:8b model (approx 5 GB -- this may take a while)..."
try {
    $tags = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing | ConvertFrom-Json
    $has = $tags.models | Where-Object { $_.name -like "llama3.1*" }
    if ($has) {
        Write-OK "llama3.1:8b already pulled"
    } else {
        ollama pull llama3.1:8b
        Write-OK "llama3.1:8b pulled"
    }
} catch {
    Write-Warn "Could not check model status: $_"
    Write-Warn "Run manually: ollama pull llama3.1:8b"
}

# -- 6. Check az CLI ---------------------------------------------------------
Write-Step "Checking Azure CLI..."
$az = Get-Command az -ErrorAction SilentlyContinue
if ($az) {
    $azVer = (az version --output json | ConvertFrom-Json).'azure-cli'
    Write-OK "Azure CLI $azVer"
} else {
    Write-Warn "Azure CLI not found. Install from https://aka.ms/installazurecliwindows"
    Write-Warn "Deployment features will not work without it."
}

Write-Host ""
Write-Host "  Setup complete! Run:  powershell -ExecutionPolicy Bypass -File .\start.ps1" -ForegroundColor Green
Write-Host ""
