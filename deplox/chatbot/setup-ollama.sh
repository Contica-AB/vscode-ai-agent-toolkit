#!/usr/bin/env bash
# DeploX v0.01 — Setup (macOS)
# Mirrors setup-ollama.ps1 for macOS/Linux environments.
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

step()  { echo -e "\n${CYAN}-> $*${RESET}"; }
ok()    { echo -e "  ${GREEN}[OK]${RESET} $*"; }
warn()  { echo -e "  ${YELLOW}[WARN]${RESET} $*"; }
fail()  { echo -e "  ${RED}[FAIL]${RESET} $*"; }

echo ""
echo -e "  ${CYAN}DeploX v0.01 -- Setup${RESET}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# -- 1. Check Node.js --------------------------------------------------------
step "Checking Node.js (18+ required)..."
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')
  if [ "$NODE_MAJOR" -lt 18 ]; then
    fail "Node $NODE_VER found but 18+ is required."
    echo "  Install via Homebrew: brew install node"
    echo "  Or download from:     https://nodejs.org"
    exit 1
  fi
  ok "Node $NODE_VER"
else
  fail "Node.js not found."
  echo "  Install via Homebrew: brew install node"
  echo "  Or download from:     https://nodejs.org"
  exit 1
fi

# -- 2. Install npm dependencies ---------------------------------------------
step "Installing npm dependencies..."
pushd "$SCRIPT_DIR" > /dev/null
npm install --silent
popd > /dev/null
ok "npm install complete"

# -- 3. Check / Install Ollama -----------------------------------------------
step "Checking Ollama..."
if command -v ollama &>/dev/null; then
  ok "Ollama already installed: $(command -v ollama)"
else
  warn "Ollama not found. Attempting install via Homebrew..."
  if command -v brew &>/dev/null; then
    brew install ollama
    ok "Ollama installed via Homebrew"
  else
    fail "Homebrew not found. Install Ollama manually from https://ollama.com/download"
    open "https://ollama.com/download" 2>/dev/null || true
    exit 1
  fi
fi

# -- 4. Start Ollama service (if not running) --------------------------------
step "Checking Ollama service..."
if curl -sf --max-time 3 http://localhost:11434/api/tags > /dev/null 2>&1; then
  ok "Ollama is running"
else
  warn "Ollama not running -- starting it in the background..."
  ollama serve > /dev/null 2>&1 &
  sleep 4
  if curl -sf --max-time 3 http://localhost:11434/api/tags > /dev/null 2>&1; then
    ok "Ollama started"
  else
    fail "Could not start Ollama. Try running 'ollama serve' manually in a separate terminal."
    exit 1
  fi
fi

# -- 5. Pull model -----------------------------------------------------------
step "Pulling llama3.1:8b model (approx 5 GB -- this may take a while)..."
TAGS=$(curl -sf http://localhost:11434/api/tags 2>/dev/null || echo '{}')
if echo "$TAGS" | grep -q '"llama3.1'; then
  ok "llama3.1:8b already pulled"
else
  if ollama pull llama3.1:8b; then
    ok "llama3.1:8b pulled"
  else
    warn "Pull failed. Run manually: ollama pull llama3.1:8b"
  fi
fi

# -- 6. Check az CLI ---------------------------------------------------------
step "Checking Azure CLI..."
if command -v az &>/dev/null; then
  AZ_VER=$(az version --output json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['azure-cli'])" 2>/dev/null || echo "unknown")
  ok "Azure CLI $AZ_VER"
else
  warn "Azure CLI not found."
  echo "  Install via Homebrew: brew install azure-cli"
  echo "  Or download from:     https://aka.ms/installazurecli"
  warn "Deployment features will not work without it."
fi

echo ""
echo -e "  ${GREEN}Setup complete! Run:  bash start.sh${RESET}"
echo ""
