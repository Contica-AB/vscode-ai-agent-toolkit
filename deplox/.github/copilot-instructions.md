# GitHub Copilot Instructions — DeploX

This file provides context and guidelines for GitHub Copilot when working in this repository.
Source: [Contica Development Guidelines](https://contica.atlassian.net/wiki/spaces/TSSOTAI/pages/766181379)

---

## About This Repository

**DeploX** (v0.01, POC) is a local AI chatbot by **Contica** that deploys Azure Integration Services via Bicep templates through a conversational UI at `localhost:3000`.

> ⚠️ **EXPERIMENTAL — PROOF OF CONCEPT.** Do NOT use in production. Expect breaking changes, incomplete features, and rough edges.

### What DeploX Does

- Accepts plain-language requests to deploy Azure services
- Uses a local LLM (via Ollama) to detect service intent and collect parameters
- Renders live Mermaid.js architecture diagrams of planned and deployed services
- Executes deterministic `az deployment` CLI calls — the LLM never generates deployment commands
- Logs all deployments to `deplox-history.json`

### Key Tech

| Layer | Technology |
|---|---|
| Backend | Node.js / Express (ES modules) |
| Frontend | Vanilla HTML + CSS + JS (no framework) |
| Local LLM | Ollama (`llama3.1:8b` default) |
| Deployment | Azure CLI + Bicep |
| Diagrams | Mermaid.js (client-side render) |

---

## Coding Guidelines

### General Rules
- Follow naming conventions aligned with the Contica SSOT (Tools & Blueprints).
- Always parameterize environment-specific values (endpoints, secrets, connection strings).
- Use **Managed Identity** instead of hardcoded credentials — never commit secrets.
- Implement logging and error handling consistently across all integrations.
- Comment code/workflows where business logic is not obvious.
- Avoid duplication — extract reusable components (functions, shared workflows).

### Node.js / Express
- Use ES modules (`import`/`export`) — the project has `"type": "module"` in `package.json`.
- Follow clean code principles with clear, descriptive error messages.
- Implement structured logging with correlation IDs where applicable.
- Handle exceptions gracefully — surface errors to the SSE stream so the browser UI can display them.

### Cross-Platform Scripting
- Use `stdio: 'ignore'` or `stdio: ['pipe', 'pipe', 'ignore']` in `execSync` options for cross-platform compatibility — **never** use shell redirects like `2>/dev/null` or `2>nul` in Node.js server code.
- Paired scripts in `scripts/` follow the `.ps1` (Windows) + `.sh` (macOS/Linux) convention. Every script change must be applied to both files.

### Bicep Modules
- Each module in `modules/` is **self-contained** — no cross-module dependencies.
- Every Bicep template must have a matching `.json` parameter file.
- All parameters must have sensible defaults or explicit required markers.
- Tag every deployed resource with at minimum: `Owner`, `Environment`, `System`.

### Azure Functions / APIs
- Follow clean code principles.
- Implement structured logging with correlation IDs.
- Handle exceptions gracefully with clear, descriptive error messages.

---

## Repository Structure

> This section describes the layout of the **standalone DeploX repository** (i.e. once the project is hosted at its own GitHub repo root).

```
.github/
  copilot-instructions.md   ← this file
README.md                   ← full feature list, prerequisites, model table
START-HERE.md               ← quick-start guide
scripts/                    ← all user-facing scripts (.ps1 + .sh pairs)
  setup.ps1 / setup.sh      ← first-time setup (Node, Ollama, model, Azure CLI)
  start.ps1 / start.sh      ← launch the chatbot server + browser
  deploy.ps1                ← terminal-only interactive deployer (Windows)
chatbot/                    ← Express server + UI (implementation only)
  server.js                 ← Express app + route mounting
  package.json
  public/
    index.html              ← frontend (HTML shell + sidebar)
    css/styles.css          ← all styles
    js/
      app.js                ← init + event wiring
      chat.js               ← SSE chat send/receive
      deploy.js             ← deploy card + plan card
      projects.js           ← project sidebar module
      state.js              ← shared mutable state
      ...                   ← helpers, icons, diagram, etc.
  lib/
    config.js               ← env vars + path constants
    projects.js             ← project CRUD + persistence
    azure-status.js         ← compare local vs Azure deployments
    history.js              ← deployment history log
    ...                     ← ollama, schemas, session
  routes/
    projects.js             ← REST API for project management
    chat.js                 ← chat SSE endpoint
    deploy.js               ← deploy SSE endpoint
    ...                     ← azure, diagram, ollama, session
docs/
  architecture.md           ← system design, component breakdown, request flow
  how-to-use.md             ← step-by-step usage guide, troubleshooting
  specification.md          ← supported services, conversation flow, API reference
modules/                    ← Bicep templates (one per Azure service)
  servicebus.bicep / .json
  eventhub.bicep / .json
  logicapp-consumption.bicep / .json
  logicapp-standard.bicep / .json
  functionapp.bicep / .json
  apim.bicep / .json
  integrationaccount.bicep / .json
  keyvault.bicep / .json
  eventgrid.bicep / .json
```

### Files That Must Never Be Committed
- `.env`, `*.env.*`, `.env.local` — environment/secrets files
- `projects/` — per-project JSON files with client deployment data
- `deplox-history.json` — local deployment history log
- `node_modules/`, `package-lock.json`
- `*.pem`, `*.key`, `*.crt` — certificates and private keys

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `develop` | Developer testing only |
| `feature/version/<integration-name>` | New feature work, branched from a release version |
| `hotfix/<id>` | Urgent production fixes |

### Rules
- Always create a PR — peer review is mandatory before merging to `release`, `preprod`, or `main`.
- CI pipeline must pass before merge.
- Enforce code owner approval for critical repos.

### Branch Naming Examples
```
feature/v0.01/deplox-macos-setup
feature/v1.0/servicebus-dead-letter-handler
hotfix/42
```

---

## Technology Notes

### Local LLM (Ollama)
- Default model: `llama3.1:8b`. The UI model dropdown lists only models actually installed on the machine (fetched live from Ollama on page load).
- The LLM handles service detection, Q&A, and template explanation — **deployment steps are always deterministic CLI calls, never LLM-generated**.
- Supported models range from `llama3.2:1b` (4 GB RAM) to `llama3.1:8b` (10 GB RAM).

### Azure CLI + Bicep
- Deployments use `az deployment group create` with Bicep templates from the `modules/` folder.
- Each module is self-contained — parameters are collected via the chat flow and passed directly to the CLI call.
- The `az bicep install` command installs the Bicep CLI extension as part of setup.

### Project Management
- Per-project JSON files are stored in `projects/<slug>.json` (gitignored).
- Each project holds deployment defaults (subscription, resource group, location, tags) and a full deployment history.

### SSE Streaming
- Both `/api/chat` and `/api/deploy` use Server-Sent Events (SSE) for real-time streaming to the browser.
- The `lib/sse.js` helper provides a standard `send(res, type, data)` interface.

---

## Pre-Commit Checklist
- [ ] Code formatted and linted
- [ ] No secrets or hardcoded credentials
- [ ] Logging and error handling in place
- [ ] Cross-platform compatibility verified (`.ps1` and `.sh` scripts kept in sync)
- [ ] Unit tests written and passing

## Pre-Merge Checklist
- [ ] Pull request reviewed and approved
- [ ] CI build pipeline passed
- [ ] Documentation updated if needed

---

## Keeping This File Up to Date

This instructions file must be kept accurate as the repository evolves. When making changes to the codebase:

- **Structure changes** — If files/folders are added, moved, or removed, update the Repository Structure section above.
- **New conventions** — If a new pattern or convention is introduced (naming, tooling, workflow), add it to the relevant section.
- **Corrections** — If you discover that any instruction here is outdated or wrong, fix it immediately as part of the current commit.
- **Technology changes** — If dependencies, MCP servers, or tooling change, update the Technology Notes section.

Treat this file as a living document. Every PR that changes project structure, conventions, or tooling should include an update to this file.
