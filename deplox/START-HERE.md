# DeploX — Start Here

DeploX is a local AI chatbot that deploys Azure Integration Services via Bicep templates. All commands are run from the `deplox/` folder.

---

## 1. First-Time Setup

### Windows (PowerShell)
```powershell
.\scripts\setup.ps1
```

### macOS / Linux
```bash
bash scripts/setup.sh
```

This installs Node.js dependencies, Ollama, pulls the default AI model (`llama3.1:8b`), and checks for Azure CLI.

---

## 2. Start the App

### Windows (PowerShell)
```powershell
.\scripts\start.ps1
```

### macOS / Linux
```bash
bash scripts/start.sh
```

Opens **http://localhost:3000** — chat with the AI to deploy Azure services.

---

## 3. Terminal-Only Deployer (No AI)

For a guided PowerShell-only experience (no chatbot, no Ollama):

```powershell
.\scripts\deploy.ps1
```

---

## Project Structure

```
deplox/
  START-HERE.md         ← you are here
  README.md             ← full feature list, prerequisites, model table
  scripts/              ← all runnable scripts
    setup.ps1 / .sh     ← first-time setup (Node, Ollama, model, Azure CLI)
    start.ps1 / .sh     ← launch the chatbot server + browser
    deploy.ps1           ← terminal-only interactive deployer (Windows)
  chatbot/              ← server implementation
    server.js            ← Express backend + state machine
    package.json
    public/              ← browser UI (single HTML file)
  modules/              ← Bicep templates (one per Azure service)
  docs/                 ← architecture, specification, how-to-use
```

---

## More Details

| Document | Description |
|---|---|
| [README.md](README.md) | Full feature list, prerequisites, model table |
| [How to Use](docs/how-to-use.md) | Step-by-step usage guide, troubleshooting |
| [Architecture](docs/architecture.md) | System design, component breakdown, request flow |
| [Specification](docs/specification.md) | Supported services, conversation flow, API reference |
