#!/usr/bin/env bash
# DeploX v0.01 — Start chatbot (macOS/Linux)
# Mirrors start.ps1 for macOS/Linux environments.
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill anything already using port 3000
if lsof -ti:3000 &>/dev/null; then
  echo -e "  ${YELLOW}Killing existing process on port 3000...${RESET}"
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

# Ensure Ollama is running
if curl -sf --max-time 3 http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo -e "  ${GREEN}Ollama already running.${RESET}"
else
  echo -e "  ${YELLOW}Starting Ollama...${RESET}"
  ollama serve > /dev/null 2>&1 &
  sleep 4
  if curl -sf --max-time 3 http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "  ${GREEN}Ollama started.${RESET}"
  else
    echo -e "  ${YELLOW}Warning: Ollama may not be running. Start it manually: ollama serve${RESET}"
  fi
fi

# Open browser after a short delay
(sleep 2 && open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null) &

cd "$SCRIPT_DIR"
echo ""
echo -e "  ${CYAN}DeploX chatbot running at http://localhost:3000${RESET}"
echo -e "  ${GRAY}Press Ctrl+C to stop.${RESET}"
echo ""
node server.js
