# DeploX v0.01 — Product Specification

## 1. Purpose

DeploX is a **local developer tool** that lets you deploy Azure Integration Services through a conversational browser UI — no Azure Portal, no YAML pipelines, no memorizing CLI flags. You answer a few questions in a chat, click confirm, and the deployment runs.

It is intentionally simple: no cloud backend, no database, no authentication server. Everything runs on the developer's laptop.

---

## 2. Core Principles

| Principle | How it's applied |
|---|---|
| **Local-first** | Node.js + Ollama run locally. Nothing is sent to any external service except Azure's own ARM API. |
| **No hallucination in critical paths** | Ollama (LLM) is only used for greeting messages. All deployment questions, validation, and confirmation use direct text — deterministic, not AI-generated. |
| **Bicep as the single source of truth** | Each service's parameter schema is derived from its Bicep file. If the Bicep changes, the schema should be updated to match. |
| **Fresh session per page load** | Refreshing the browser always starts a clean session. No stale state from previous deployments. |
| **Minimal dependencies** | Frontend: vanilla JS, no framework. Backend: Express only. No ORM, no Redis, no message queue. |

---

## 3. Supported Services

| Service | Bicep Module | Code Deploy | Notes |
|---|---|---|---|
| **Service Bus** | `servicebus.bicep` | — | Queues and topics optionally pre-created. Basic SKU blocks topics (auto-skipped with warning). |
| **Event Hubs** | `eventhub.bicep` | — | Event hub instances optionally pre-created. Retention question skipped if no hubs named. |
| **Logic App Consumption** | `logicapp-consumption.bicep` | — | `Microsoft.Logic/workflows`. Optional Integration Account link. |
| **Logic App Standard** | `logicapp-standard.bicep` | ✅ zip deploy | `Microsoft.Web/sites`. Asks for local workflows folder path. Uses `az logicapp deployment source config-zip`. |
| **Function App** | `functionapp.bicep` | ✅ zip deploy | Consumption plan (Y1/Dynamic). Asks for local code folder path. Uses `az functionapp deployment source config-zip`. |
| **API Management** | `apim.bicep` | — | SKUs: Consumption, Developer, Basic, Standard, Premium. Non-Consumption tiers take 30–45 min to provision. |
| **Integration Account** | `integrationaccount.bicep` | — | SKUs: Free, Basic, Standard. |
| **Key Vault** | `keyvault.bicep` | — | Automatically injects current user's object ID as `adminObjectId` so the vault is accessible after deploy. |
| **Event Grid** | `eventgrid.bicep` | — | Creates a custom topic with EventGrid schema, public network access enabled. |

---

## 4. Conversation Flow

### 4.1 States

The chatbot has 4 states per session:

```
start → collecting → confirm → done
```

**`start`**
- Shown on first message or after completing/cancelling a deployment.
- Ollama generates a welcome message.
- User picks a service via chip button or free text.

**`collecting`**
- Bot asks one question at a time, in schema order.
- Each answer is validated immediately. Invalid answers re-ask the same question with an error hint.
- Some params are conditionally skipped (`skipIf`) based on earlier answers (e.g. topics skipped for Basic SKU).
- Service-specific params are asked first, then common params (subscription, RG, location, environment).

**`confirm`**
- Full deployment summary shown to user.
- Two choices: "Yes, deploy" or "Cancel".
- Cancel resets to `start`.

**`done`**
- Deployment is running (via Deploy Card in the UI).
- Next user message resets to `start`, keeping subscription + environment tag.

### 4.2 Service Switch
At any state, if the user mentions a different service, the bot abandons the current flow and starts fresh for the new service. Already-collected common params (subscription, environment) are preserved.

---

## 5. Parameter Schema System

Each service has a `SERVICE_SCHEMAS` entry — an array of param definitions:

```js
{
  key: 'namespaceName',           // maps to Bicep param name
  label: 'Service Bus namespace name',
  type: 'text',                   // see types below
  q: 'What name for the namespace? (6–50 chars)',
  validate: v => v.length < 6 ? 'Must be at least 6 characters.' : null,
  paramType: 'int',               // optional: coerce to int for ARM params
  skipIf: c => c.sku === 'Basic', // optional: skip this param conditionally
  skipMsg: '[!] Skipped: reason', // optional: message shown when skipped
}
```

### Parameter Types

| Type | Behaviour | UI |
|---|---|---|
| `text` | Free text, validated inline | Plain text input |
| `text_optional` | Free text, "skip" accepted | Text input + Skip chip |
| `choice` | Must match one of `choices[]` | Button chips |
| `list_optional` | Comma-separated list or skip → stored as array | Text input + Skip chip |
| `subscription` | Matched against live `az account list` | Button chips |
| `rg_select` | Live list from `az group list` + "Create new" option | Button chips |

### Common Schema (appended to every service)
1. `__subscription` — auto-filled from default, or user picks
2. `__rgPick` — pick existing resource group or "Create new"
3. `__rgName` — only asked if "Create new" was picked
4. `__location` — Azure region choice
5. `__env` — environment tag (dev/test/prod), auto-inferred from subscription name

---

## 6. Deployment Pipeline

When the user confirms, the server:

1. **Validates login** — `az account show`. Returns friendly error if not logged in.
2. **Sets subscription** — `az account set --subscription <id>`
3. **Creates resource group** — `az group create` (idempotent — safe if RG exists)
4. **Deploys Bicep** — `az deployment group create --template-file <module>.bicep --parameters @params.json`
   - Parameters file written to a temp file, cleaned up after deploy.
   - ARM params are type-coerced: `int` params parsed with `parseInt()`, arrays passed as JSON arrays.
   - Key Vault: `adminObjectId` auto-injected from `az ad signed-in-user show`.
5. **Code deploy** _(Function App / Logic App Standard only, if folder path provided)_
   - `Compress-Archive` zips the local code folder.
   - `az functionapp deployment source config-zip` / `az logicapp deployment source config-zip` pushes the zip.
   - Zip file cleaned up after deploy.
6. **Surfaces outputs** — `az deployment group show --query properties.outputs` printed in the terminal log.

All steps stream stdout/stderr to the browser via SSE in real time.

---

## 7. API Reference

### Chat endpoint
```
POST /api/chat
Body: { message: string, sessionId: string }
Response: SSE stream

SSE event types:
  token       — { content: string }   AI or direct text fragment
  choices     — { choices: string[] } chip buttons to render
  deploy_config — { config: object }  triggers Deploy Card in browser
  done        — {}                    stream complete
  error       — { message: string }   something went wrong
```

### Deploy endpoint
```
POST /api/deploy
Body: { config: DeployConfig }
Response: SSE stream

SSE event types:
  log     — { message: string }   terminal line (stdout/stderr)
  warn    — { message: string }   warning line
  success — { message: string }   deployment complete
  error   — { message: string }   deployment failed
```

### Azure context
```
GET  /api/azure/context    → { subscriptions[], locations[] }
GET  /api/azure/account    → { loggedIn, user, subscription, tenant }
POST /api/azure/login      → SSE stream (opens browser)
POST /api/azure/logout     → { ok }
POST /api/azure/subscription  Body: { subscriptionId } → { ok, subscription }
```

### Session management
```
DELETE /api/session/:id    → { ok }   clears server-side session
```

### Ollama
```
GET /api/ollama/status     → { running, models[], hasModel }
POST /api/ollama/start     → SSE stream (starts Ollama process)
```

---

## 8. Frontend Architecture

The entire frontend is `chatbot/public/index.html` — one file, no build, no bundler.

### Key sections

| Section | Purpose |
|---|---|
| **CSS variables** | Dark theme: `--bg`, `--surface`, `--accent`, `--accent2` |
| **IC object** | SVG icon constants (Lucide-style stroke icons) used throughout the UI |
| **`addMessage()`** | Renders a chat bubble (bot or user) with avatar |
| **`renderChoices()`** | Creates choice-chip buttons below a bot message |
| **`buildDeployCard()`** | Renders a terminal-style deploy card, auto-starts deploy via `startDeploy()` |
| **`startDeploy()`** | POSTs to `/api/deploy`, streams log lines into the card |
| **`sendMessage()`** | Sends user text to `/api/chat`, streams response |
| **`quickSend()`** | Used by welcome chips — sends a predefined message as if typed |
| **Login bar** | Checks `/api/azure/account` on load, shows user info or login prompt |

### SSE streaming pattern
```
fetch('/api/chat', { method: 'POST', body: ... })
→ ReadableStream of SSE events
  → token events: append to current bot message
  → choices event: render chip buttons
  → deploy_config event: insert Deploy Card
  → done event: finalise message, enable input
```

---

## 9. Configuration

All config is via environment variables (with sensible defaults):

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `llama3.2:1b` | Model to use for chat |
| `OLLAMA_EXE` | Auto-detected from `%LOCALAPPDATA%` | Path to `ollama.exe` |

---

## 10. Prerequisites

| Requirement | Version | Install |
|---|---|---|
| Node.js | ≥ 18 | https://nodejs.org |
| Azure CLI | Latest | https://aka.ms/installazurecliwindows |
| Bicep (via Azure CLI) | Latest | `az bicep install` |
| Ollama | Latest | https://ollama.com |
| llama3.2:1b model | — | `ollama pull llama3.2:1b` |
| Azure subscription | — | Must be logged in via `az login` |

---

## 11. Known Limitations (v0.01)

- **In-memory sessions** — restarting the server loses all active sessions.
- **Single user** — no multi-user support; sessions are identified by a browser-generated random ID, not by Azure identity.
- **No deployment history** — once the browser tab is closed, there's no record of past deployments.
- **Logic App Consumption** — workflow definition is deployed empty. The user must author workflows in the Azure Portal or via separate tooling after deployment.
- **APIM provisioning time** — non-Consumption tiers take 30–45 minutes; the SSE connection may time out on some network configurations. Deploy still completes in Azure even if the browser disconnects.
- **No rollback** — failed deployments are not automatically rolled back. Partial resources may exist in Azure.
