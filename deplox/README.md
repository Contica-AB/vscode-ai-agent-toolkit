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
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```

Then open **http://localhost:3000** in your browser.

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
- [Node.js](https://nodejs.org) ≥ 18
- [Azure CLI](https://aka.ms/installazurecliwindows) logged in via:
  ```powershell
  az login
  ```
- [Ollama](https://ollama.com) installed and the required model pulled:
  ```powershell
  ollama pull llama3.2:1b
  ```
  > Or run the automated setup script (handles Ollama install + model pull):
  > ```powershell
  > powershell -ExecutionPolicy Bypass -File .\chatbot\setup-ollama.ps1
  > ```
