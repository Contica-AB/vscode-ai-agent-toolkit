# DeploX v0.01

---

# ⚠️ EXPERIMENTAL — PROOF OF CONCEPT ⚠️

> ## THIS IS A FIRST POC (PROOF OF CONCEPT)
>
> ### The purpose of this project is to prove that it is possible to build a self-service portal that deploys Azure resources through a conversational AI interface using existing Bicep templates.
>
> ### The Bicep templates included are basic starter templates. They are intentionally simple as a starting point — more templates and services will be developed and added as needed.
>
> ### DO NOT use this in production. Expect breaking changes, incomplete features, and rough edges.

---

Interactive Azure Integration Services deployer — a local AI chatbot that guides you through deploying Azure services via Bicep templates.

## Quick Start

```powershell
cd C:\projects\deploxV0.01    # adjust to your path
.\chatbot\start.ps1
```

Then open **http://localhost:3000** in your browser.

> First time? Run setup first: `.\chatbot\setup-ollama.ps1`

## Documentation

| Document | Description |
|---|---|
| [How to Use](docs/how-to-use.md) | Setup, startup commands, step-by-step usage guide, troubleshooting |
| [Architecture](docs/architecture.md) | System design, component breakdown, request flow diagrams, state machine detail |
| [Specification](docs/specification.md) | Full product spec: supported services, conversation flow, API reference, configuration |

## Supported Services

| Service | Code Deploy |
|---|---|
| Service Bus | — |
| Event Hubs | — |
| Logic App Consumption | — |
| Logic App Standard | ✅ zip deploy |
| Function App | ✅ zip deploy |
| API Management | — |
| Integration Account | — |
| Key Vault | — |
| Event Grid | — |

## Prerequisites

### 1. Node.js ≥ 18
```powershell
winget install OpenJS.NodeJS.LTS
```
Verify: `node --version`

### 2. Azure CLI
```powershell
winget install Microsoft.AzureCLI
az login
az bicep install
```

### 3. Ollama + model

Choose a model based on your RAM:

| Model | RAM needed | Quality | Command |
|---|---|---|---|
| `llama3.2:1b` | 4 GB | Basic | `ollama pull llama3.2:1b` |
| `llama3.2:3b` | 6 GB | Good | `ollama pull llama3.2:3b` |
| `phi3.5:mini` | 6 GB | Good | `ollama pull phi3.5:mini` |
| `llama3.1:8b` ⭐ | 10 GB | Great | `ollama pull llama3.1:8b` |
| `mistral:7b` | 10 GB | Great | `ollama pull mistral:7b` |

**Option A — Automated (recommended):**
```powershell
.\chatbot\setup-ollama.ps1
```

**Option B — Manual:**
```powershell
winget install Ollama.Ollama
ollama pull llama3.1:8b    # replace with your chosen model
cd chatbot && npm install
```

> To change the model: use the **model dropdown in the top-right of the UI** — it lists all installed Ollama models with descriptions. Your choice is saved automatically. You can also set `$env:OLLAMA_MODEL = 'your-model'` before starting to change the default.

---

## Authors & Credits

| Role | Name |
|---|---|
| **Designed & built by** | Ahmed Bayoumy |
| **AI coding assistant** | GitHub Copilot CLI |
| **Underlying AI model** | Claude (Anthropic) via GitHub Copilot |

> This project was conceived, designed, and developed by **Ahmed Bayoumy** using **GitHub Copilot CLI** powered by **Claude** as an AI pair-programmer.


