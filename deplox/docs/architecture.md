# DeploX — Architecture

## Overview

DeploX is a **local-first** deployment toolkit. There is no cloud backend — everything runs on the developer's machine. The user interacts through a browser UI; an AI chatbot guides them through questions, then triggers Azure deployments via Bicep templates.

---

## High-Level Architecture

```
+-----------------------------------------------------------------------+
|                   D E V E L O P E R   M A C H I N E                   |
+-----------------------------------------------------------------------+
|                                                                       |
|   +-- BROWSER  (localhost:3000) ------------------------------------+ |
|   |  index.html  (HTML + CSS + Vanilla JS -- no framework)        |   |
|   |                                                                |  |
|   |  +---------------+  +--------------+  +----------------+      |   |
|   |  |  Chat Window  |  | Choice Chips |  |  Deploy Card   |      |   |
|   |  |  (SSE stream) |  |  (buttons)   |  | (log terminal) |      |   |
|   |  +-------+-------+  +------+-------+  +-------+--------+      |   |
|   +----------|--------------------|-------------------|------------+  |
|              | POST /api/chat     |             | POST /api/deploy    |
|              v                    v                   v               |
|   +-- SERVER  server.js  (Express) ---------------------------------+ |
|   |                                                                |  |
|   |  +---------------------+   +--------------------------------+  |  |
|   |  |   State Machine     |   |   Deploy Pipeline              |  |  |
|   |  |  start              |   |  1. az account set             |  |  |
|   |  |    -> collecting    |   |  2. az group create            |  |  |
|   |  |    -> confirm       |   |  3. az deployment group create |  |  |
|   |  |    -> done          |   |     (Bicep template)           |  |  |
|   |  +---------+-----------+   |  4. zip-deploy  (optional)     |  |  |
|   |            |               |  5. surface outputs            |  |  |
|   |  +---------v-----------+   +----------------+---------------+  |  |
|   |  |  SESSION STORE      |                    |                  |  |
|   |  |  (in-memory Map)    |                    |                  |  |
|   |  +---------------------+                    |                  |  |
|   +-----------------------------------------------|----------------+  |
|                              |                   |                    |
|   +------------------------+ |   +---------------v-----------+        |
|   |  Ollama  (local LLM)   | |   |  Azure CLI  (az)          |        |
|   |  llama3.2:1b           +-+   |  + Bicep modules          |        |
|   |  port 11434            |     |  modules/*.bicep          |        |
|   +------------------------+     +---------------------------+        |
|                                                |                      |
+-----------------------------------------------------------------------+
|                                                | ARM REST API         |
|                                                v                      |
|                                     +---------------------+           |
|                                     |    Azure Cloud      |           |
|                                     |   (subscription)    |           |
|                                     +---------------------+           |
+-----------------------------------------------------------------------+
```

---

## Component Breakdown

### 1. Browser UI — `chatbot/public/index.html`
Single HTML file, no framework, no build step.

| Section | Purpose |
|---|---|
| **Chat window** | Streams tokens from the server via SSE. Renders bot/user messages. |
| **Model dropdown** | Top-right pill — lists all installed Ollama models with descriptions. Selection is saved to localStorage and sent with every chat request. |
| **Choice chips** | Dynamic buttons rendered from server-sent `choices` events. Used for subscriptions, SKUs, regions, service picks, edit targets, and confirm actions. |
| **Welcome chips** | Always-visible shortcut buttons for each Azure service on the home screen. |
| **Deploy card** | Auto-renders when server emits a `deploy_config` event. Shows the exact config being deployed and a terminal-style log of deployment steps. |
| **Login bar** | Top-right — shows logged-in user, subscription, and logout button. |

### 2. Backend Server — `chatbot/server.js`
Express app, ~800 lines. No database. All state is in-memory.

| Module | Purpose |
|---|---|
| **SESSION STORE** | `Map<sessionId, SessionObject>`. New session per page load. |
| **STATE MACHINE** | Seven states: `start` → `confirming_service` → `collecting` → `confirm` → `editing` → `done`. Controls what question to ask next and when to involve Ollama. |
| **SERVICE_SCHEMAS** | Parameter definitions for each Azure service. Each param has key, label, type, validation, and optional `skipIf` logic. |
| **COMMON_SCHEMA** | Shared params appended to every service: subscription, resource group, location, environment tag. |
| **buildDeployConfig()** | Assembles collected answers into an ARM-compatible deploy config object. |
| **Deploy pipeline** | Spawns `az` CLI commands in sequence; streams stdout/stderr back to browser via SSE. |
| **Ollama integration** | Used for `start`, `confirming_service`, and `confirming_service` retry states. All `collecting`, `confirm`, `editing`, and `done` states use direct text — no LLM. Deployment outcome (success/failure/portal link) is always factual, never LLM-generated. |

### 3. Bicep Modules — `modules/*.bicep`
One Bicep file per Azure service. Each is self-contained — no shared modules or dependencies between them.

| File | Deploys |
|---|---|
| `servicebus.bicep` | Service Bus namespace + optional queues and topics |
| `eventhub.bicep` | Event Hubs namespace + optional event hubs |
| `logicapp-consumption.bicep` | Logic App (Consumption) — `Microsoft.Logic/workflows` |
| `logicapp-standard.bicep` | Logic App (Standard) — `Microsoft.Web/sites` + Storage + App Service Plan |
| `functionapp.bicep` | Function App + Storage + Consumption App Service Plan |
| `apim.bicep` | API Management service |
| `integrationaccount.bicep` | Integration Account (B2B/EDI) |
| `keyvault.bicep` | Key Vault + access policy for deploying user |
| `eventgrid.bicep` | Event Grid custom topic |

### 4. Local AI — Ollama (`llama3.1:8b`)
Runs as a local process on port 11434. Used to generate conversational responses in `start` (welcome/service picker) and `confirming_service` (understanding confirmation + explanation) states. All structured states — `collecting`, `confirm`, `editing`, `done` — bypass Ollama and use direct deterministic text. Deployment results (success/failure/portal link) are derived entirely from the `az` CLI output — the LLM never reports deployment status.

The active model is selected at runtime via the UI dropdown and stored per-session. Multiple models can be installed and switched without restarting the server.

---

## Request Flow — Full Deployment

```
+-----------+                +-------------+                   +-------------+          +---------------+
|  Browser  |                |  server.js  |                   |  Azure CLI  |          |  Azure Cloud  |
+-----------+                +-------------+                   +-------------+          +---------------+
      |                             |                                 |                         |
      |----------------------------->                                 |                         |
      |   GET /api/azure/context    |                                 |                         |
      |                             |                                 |                         |
      |                             |--------------------------------->                         |
      |                             |         az account list         |                         |
      |                             |                                 |                         |
      |                             <---------------------------------|                         |
      |                             |         subscriptions[]         |                         |
      |                             |                                 |                         |
      <-----------------------------|                                 |                         |
      | { subscriptions, locations }|                                 |                         |
      |                             |                                 |                         |
      |                             |                                 |                         |
      |----------------------------->                                 |                         |
      | POST /api/chat  "Service Bus"                                 |                         |
      |                             |                                 |                         |
      |                             |-->                              |                         |
      |                             |    detectService()  state=collecting                      |
      |                             |                                 |                         |
      <-----------------------------|                                 |                         |
      |     SSE: first question     |                                 |                         |
      |                             |                                 |                         |
      |                             |                                 |                         |
      |----------------------------->                                 |                         |
      |   POST /api/chat  answer    |                                 |                         |
      |                             |                                 |                         |
      |                             |-->                              |                         |
      |                             |    validate + store in collected{}                        |
      |                             |                                 |                         |
      <-----------------------------|                                 |                         |
      | SSE: next question + choices|                                 |                         |
      |                             |                                 |                         |
      |                             |                                 |                         |
      |----------------------------->                                 |                         |
      | POST /api/chat  last answer |                                 |                         |
      |                             |                                 |                         |
      |                             |-->                              |                         |
      |                             |    state = confirm              |                         |
      |                             |                                 |                         |
      <-----------------------------|                                 |                         |
      | SSE: summary + ["Yes","Cancel"]                               |                         |
      |                             |                                 |                         |
      |                             |                                 |                         |
      |----------------------------->                                 |                         |
      | POST /api/chat  "Yes, deploy"                                 |                         |
      |                             |                                 |                         |
      |                             |-->                              |                         |
      |                             |    buildDeployConfig()          |                         |
      |                             |                                 |                         |
      <-----------------------------|                                 |                         |
      |  SSE: deploy_config event   |                                 |                         |
      |                             |                                 |                         |
      |----------------------------->                                 |                         |
      |      POST /api/deploy       |                                 |                         |
      |                             |                                 |                         |
      |                             |                                 |                         |
      |                             |--------------------------------->                         |
      |                             |  az account set --subscription  |                         |
      |                             |                                 |                         |
      |                             |--------------------------------->                         |
      |                             |         az group create         |                         |
      |                             |                                 |                         |
      |                             |--------------------------------->                         |
      |                             | az deployment group create (Bicep)                        |
      |                             |                                 |                         |
      |                             |                                 |------------------------->
      |                             |                                 |      ARM API call       |
      |                             |                                 |                         |
      |                             |                                 <-------------------------|
      |                             |                                 |   deployment complete   |
      |                             |                                 |                         |
      |                             <---------------------------------|                         |
      |                             |  outputs: { namespaceId, ... }  |                         |
      |                             |                                 |                         |
      <-----------------------------|                                 |                         |
      | SSE: live logs + outputs + success                            |                         |
      |                             |                                 |                         |
+-----------+                +-------------+                   +-------------+          +---------------+
|  Browser  |                |  server.js  |                   |  Azure CLI  |          |  Azure Cloud  |
+-----------+                +-------------+                   +-------------+          +---------------+
```

---

## State Machine Detail

```
+---------------------------------------------------------------------------------+
|                              STATE MACHINE                                      |
+---------------------------------------------------------------------------------+
|                                                                                 |
|    +-------+    service detected    +----------------------+                    |
|    | start | ----------------------> | confirming_service   |                   |
|    +-------+    (keyword or AI)     |  AI explains why &   |                   |
|        ^                            |  asks to confirm      |                   |
|        |                            +----------+-----------+                    |
|        |   "Choose different"                  |                                |
|        | <------------------------------------  | "Yes, deploy X"               |
|        |                                       v                                |
|        |                             +------------+                             |
|        |        "Change service"     | collecting |  ← one param at a time     |
|        | <-------------------------- +-----+------+  ← full validation          |
|        |                                   |                                    |
|        |                     all params filled                                  |
|        |                                   v                                    |
|        |                            +---------+                                 |
|        |        "Change service"    | confirm |  ← summary shown               |
|        | <------------------------- +---------+                                 |
|        |                             /       \                                  |
|        |          "Edit a setting"  /         \ "Yes, deploy"                  |
|        |                           v           v                                |
|        |                    +---------+    +--------+                           |
|        |    edit done       | editing |    |  done  |                           |
|        |    back to confirm +---------+    +--------+                           |
|        |                         |              |                               |
|        |                         |    next msg  |                               |
|        +-------------------------+--------------+                               |
|                                                                                 |
|   Ollama used in:  start, confirming_service                                    |
|   Direct text in:  collecting, confirm, editing, done                           |
|   Deployment result: factual from az CLI output — LLM never reports status      |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

**Session data structure:**
```js
{
  state: 'start' | 'confirming_service' | 'collecting' | 'confirm' | 'editing' | 'done',
  service: 'servicebus' | 'eventhub' | ... | null,
  _pendingService: 'apim',          // set during confirming_service, cleared on confirm
  schema: [ ...paramDefs ],         // deep-copied from SERVICE_SCHEMAS
  schemaIdx: 2,                     // which param we're on
  _editingKey: 'namespaceName',     // set during editing state, null when in pick mode
  model: 'llama3.1:8b',             // active Ollama model for this session
  collected: {
    namespaceName: 'myapp-bus',
    sku: 'Standard',
    __subscription: { id: '...', name: '...' },
    __rgName: 'my-rg',
    __location: 'westeurope',
    __env: 'dev'
  },
  messages: [ ...ollamaHistory ],
  subs: [ ...azureSubscriptions ],
  _skipMsgs: []
}
```

---

## Folder Structure

```
deploxV0.01/
├── docs/
│   ├── architecture.md     ← this file
│   └── specification.md    ← full product spec
├── modules/                ← Bicep templates (one per service)
│   ├── servicebus.bicep
│   ├── eventhub.bicep
│   ├── logicapp-consumption.bicep
│   ├── logicapp-standard.bicep
│   ├── functionapp.bicep
│   ├── apim.bicep
│   ├── integrationaccount.bicep
│   ├── keyvault.bicep
│   └── eventgrid.bicep
├── chatbot/
│   ├── public/
│   │   └── index.html      ← entire frontend (single file)
│   ├── server.js           ← Express backend + state machine
│   ├── package.json
│   └── start.ps1           ← starts Ollama + Node in one command
├── deploy.ps1              ← top-level launcher
└── README.md
```
