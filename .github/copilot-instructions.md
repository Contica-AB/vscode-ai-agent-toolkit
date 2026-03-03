# GitHub Copilot Instructions

This file provides context and guidelines for GitHub Copilot when working in this repository.
Source: [Contica Development Guidelines](https://contica.atlassian.net/wiki/spaces/TSSOTAI/pages/766181379)

---

## About This Repository

This is the **VS Code AI Agent Toolkit** by **Contica** — an integration consultancy. It contains multiple AI-powered tools for Azure consulting work, all designed to run inside VS Code with GitHub Copilot. Each project lives in its own top-level folder with its own `.code-workspace` file and `START-HERE.md`.

### Projects

| Folder | What it does | Key tech |
|---|---|---|
| `deplox/` | **DeploX** (v0.01, POC) — Local AI chatbot that deploys Azure Integration Services via Bicep templates through a conversational UI at `localhost:3000`. Moved to its own repository: [Contica-AB/deplox](https://github.com/Contica-AB/deplox). | Node.js/Express, Ollama (local LLM), Azure CLI, Bicep |
| `azure-environment-analysis/` | **Azure Environment Analysis** — Structured assessment of client Azure environments. Prompt-driven workflow through Copilot Chat producing inventory, security, failure analysis, and monitoring reports. | Azure MCP, prompt chain (phases 0–9), Node.js scripts |
| `Scope Guardian/` | **Scope Guardian** — Issue classification tool. Cross-references Jira/ADO issues against requirements docs and Azure implementations to classify as bug, change request, or unclear. | Atlassian MCP, Azure MCP, prompt chain (phases 0–6) |
| `sow-infrastructure-generator/` | **SoW Infrastructure Generator** — Reads Confluence Statements of Work and generates Azure Bicep parameter files + DevOps pipeline YAML via a 4-agent chain. | Copilot agents (`@sow-infra-orchestrator`, `@sow-planning`, `@sow-implementation`, `@sow-pipeline`), Atlassian MCP |

### Key Conventions
- Each project has a `START-HERE.md` — always read it before working in that project.
- Client-specific data goes under `clients/<client-name>/` (templated from `clients/_template/`).
- Generated output goes under `output/` folders — these are gitignored.
- Agent definitions live in `.github/agents/*.agent.md` and can be installed globally to VS Code's user prompts folder.
- Assessment prompts are numbered sequentially (`00-preflight.md`, `01-inventory.md`, etc.) and must be run in order.

---

## Coding Guidelines

### General Rules
- Follow naming conventions aligned with the Contica SSOT (Tools & Blueprints).
- Always parameterize environment-specific values (endpoints, secrets, connection strings).
- Use **Managed Identity** instead of hardcoded credentials — never commit secrets.
- Implement logging and error handling consistently across all integrations.
- Comment code/workflows where business logic is not obvious.
- Avoid duplication — extract reusable components (functions, shared workflows).

### Logic Apps
- Use scopes for error handling.
- Standardize retry policies.
- Tag each workflow with `Owner`, `Environment`, `System`.

### Azure Functions / APIs
- Follow clean code principles.
- Implement structured logging with correlation IDs.
- Handle exceptions gracefully with clear, descriptive error messages.

### Data Factory / Synapse Pipelines
- Parameterize all pipeline configs.
- Store mappings in external files where possible.
- Define a consistent failure/retry strategy.

---

## Repository Structure

```
.github/
  copilot-instructions.md     ← this file
azure-environment-analysis/   ← client Azure environment assessment tool
  clients/                    ← per-client config (from _template/)
  methodology/                ← assessment framework, checklists
  prompts/                    ← numbered prompt chain (00–09)
  scripts/                    ← setup, validation, report generation
  standards/                  ← access requirements, SSOT, Azure API refs
deplox/                       ← conversational Azure deployer (POC) — moved to Contica-AB/deplox
  .github/
    copilot-instructions.md   ← Copilot instructions for the deplox repo
  scripts/                    ← all user-facing scripts (.ps1 + .sh pairs)
  chatbot/                    ← Express server + UI (implementation only)
  docs/                       ← architecture, specification, how-to-use
  modules/                    ← Bicep templates (one per Azure service)
Scope Guardian/               ← issue classification tool
  clients/                    ← per-client config
  methodology/                ← classification rules, evidence requirements
  prompts/                    ← numbered prompt chain (00–06)
  scripts/                    ← report generation, setup, validation
sow-infrastructure-generator/ ← SoW-to-deployment-files agent chain
  .github/agents/             ← Copilot agent definitions
  output/                     ← generated deployment files
  reference/                  ← integration setup prompt
```

### Files That Must Never Be Committed
- `.env`, `*.env.*`, `.env.local` — environment/secrets files
- `clients/*/config.json` — client credentials (template is OK)
- `output/` contents — generated client reports and artifacts
- `*.pem`, `*.key`, `*.crt` — certificates and private keys
- `node_modules/`, `package-lock.json`

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

### Branch naming examples
```
feature/v1.0/servicebus-dead-letter-handler
feature/v0.01/deplox-macos-setup
hotfix/42
```

---

## Technology Notes

### Bicep Modules (deplox)
Each module in `deplox/modules/` is self-contained — no cross-dependencies. Supported services: Service Bus, Event Hubs, Logic App (Consumption & Standard), Function App, API Management, Integration Account, Key Vault, Event Grid. Each service has both a `.bicep` template and a `.json` parameter file. See the [deplox repository](https://github.com/Contica-AB/deplox) for the latest templates.

### MCP Servers
Several projects rely on MCP (Model Context Protocol) servers for external access:
- **Atlassian MCP** — Jira and Confluence (used by Scope Guardian, SoW generator, Environment Analysis)
- **Azure MCP** — Azure Resource Graph, resource management (used by Environment Analysis, Scope Guardian)

### Local LLM (deplox only)
DeploX uses Ollama with a local model (default: `llama3.1:8b`). The LLM handles service detection, Q&A, and template explanation — deployment steps are always deterministic CLI calls, never LLM-generated.

---

## Pre-Commit Checklist
- [ ] Code formatted and linted
- [ ] No secrets or hardcoded credentials
- [ ] Logging and error handling in place
- [ ] Unit tests written and passing

## Pre-Merge Checklist
- [ ] Pull request reviewed and approved
- [ ] CI build pipeline passed
- [ ] Documentation updated if needed

---

## Keeping This File Up to Date

This instructions file must be kept accurate as the repository evolves. When making changes to the codebase:

- **Structure changes** — If files/folders are added, moved, or removed, update the Repository Structure section above.
- **New projects** — Add a row to the Projects table and update the structure tree.
- **New conventions** — If a new pattern or convention is introduced (naming, tooling, workflow), add it to the relevant section.
- **Corrections** — If you discover that any instruction here is outdated or wrong, fix it immediately as part of the current commit.
- **Technology changes** — If dependencies, MCP servers, or tooling change, update the Technology Notes section.

Treat this file as a living document. Every PR that changes project structure, conventions, or tooling should include an update to this file.
