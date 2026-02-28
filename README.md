# VS Code AI Agent Toolkit

AI-powered tools for Azure consulting, built to run inside VS Code with GitHub Copilot.

## Projects

### [DeploX](deplox/) ⚠️ EXPERIMENTAL — POC

> **First proof of concept** demonstrating how to build a self-service portal for deploying Azure resources through a conversational AI interface using existing Bicep templates. Templates included are basic starters — more will be developed as needed. Do not use in production.

A local AI chatbot (runs at `localhost:3000`) that guides you through deploying Azure Integration Services via Bicep templates — no Azure Portal, no YAML pipelines, no memorizing CLI flags.

**Supported Services:** Service Bus, Event Hubs, Logic App (Consumption & Standard), Function App, API Management, Integration Account, Key Vault, Event Grid

**How it works:** Run `deploy.ps1` → open browser → chat with the AI → confirm → Azure resource is deployed.

**Requirements:** Node.js ≥ 18, Azure CLI, Ollama with `llama3.2:1b`

---

### [SoW Infrastructure Generator](sow-infrastructure-generator/)

Automated Azure infrastructure deployment file generation from Confluence Statements of Work. Uses a 4-agent chain with specialized models for optimal performance.

**What it generates:**
- `parameters-dev.json` - Azure Bicep deployment parameters (Dev environment)
- `parameters-test.json` - Azure Bicep deployment parameters (Test environment)
- `parameters-prod.json` - Azure Bicep deployment parameters (Prod environment)
- `trigger.yml` - Azure DevOps multi-stage pipeline (Dev → Test → Prod)

All files are output to a `Deployment/` subfolder in the target workspace.

**Agent Chain:**
| Agent | Model | Task |
|-------|-------|------|
| Orchestrator | - | Coordinates workflow |
| Planning | Claude Sonnet 4 | Reads SoW, extracts requirements |
| Implementation | Claude Opus 4.5 | Generates deployment files |
| Pipeline | GPT-4o | Validates & deploys |

**How it works:** Provide SoW URL → Agent reads Confluence → Generates ready-to-deploy files

### [Azure Environment Analysis](azure-environment-analysis/)

Automated assessment of client Azure Integration Services environments. Runs a structured sequence of prompts through Copilot Chat to produce a full environment report — resource inventory, Logic Apps deep-dive, failure analysis, security audit, monitoring gaps, and sales opportunities.

**How it works:** Set up client credentials → paste prompts into Copilot Chat → get a complete assessment report.

### [Scope Guardian](Scope%20Guardian/)

Issue classification tool that determines whether a reported issue is a **bug**, **change request**, or **unclear**. Cross-references Jira/Azure DevOps issues against requirements docs, Azure implementations, and source code.

**How it works:** Load an issue → Copilot finds requirements & checks implementation → outputs a classification with evidence.

## Getting Started

Each project has its own `START-HERE.md` with step-by-step instructions. Open the respective `.code-workspace` file in VS Code to begin.

## Global Agent Installation

To make agents available in **any workspace** (recommended), install them to your VS Code user prompts folder:

### macOS
```bash
cp sow-infrastructure-generator/.github/agents/*.agent.md ~/Library/Application\ Support/Code/User/prompts/
```

### Windows
```powershell
Copy-Item "sow-infrastructure-generator\.github\agents\*.agent.md" "$env:APPDATA\Code\User\prompts\"
```

### Linux
```bash
cp sow-infrastructure-generator/.github/agents/*.agent.md ~/.config/Code/User/prompts/
```

After installation, agents are available globally via `@agent-name` in Copilot Chat.

## Requirements

- VS Code with GitHub Copilot
- Azure MCP server (for Azure resource access)
- Node.js (for setup scripts)
