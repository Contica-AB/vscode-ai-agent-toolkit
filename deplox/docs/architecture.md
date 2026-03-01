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
|   +-- BROWSER  (localhost:3000) ----------------------------------+   |
|   |  index.html  (HTML + CSS + Vanilla JS -- no framework)        |   |
|   |                                                               |   |
|   |  +---------------+  +--------------+  +----------------+      |   |
|   |  |  Chat Window  |  | Choice Chips |  |  Deploy Card   |      |   |
|   |  |  (SSE stream) |  |  (buttons)   |  | (log terminal) |      |   |
|   |  +-------+-------+  +------+-------+  +-------+--------+      |   |
|   +----------|--------------------|-------------------|-----------+   |
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
| **Model dropdown** | Top-right pill — lists only the Ollama models actually installed (fetched live from `/api/ollama/status` on page load). Labels are auto-derived from model parameter size. Selection saved to localStorage and sent with every chat request. |
| **Choice chips** | Dynamic buttons rendered from server-sent `choices` events. Used for subscriptions, SKUs, regions, service picks, edit targets, and confirm actions. |
| **Welcome chips** | Shortcut buttons for each Azure service on the home screen. |
| **Template explore chips** | "Explore included templates" section on the home screen — one chip per service. Clicking immediately explains that service's Bicep template in chat. |
| **Learn mode** | Triggered by the "Learn about Azure services" chip or any question about Azure. Streams Q&A answers with a Microsoft Learn docs link appended. |
| **History button** | Clock icon in header — renders all past deployments in the chat. Each entry shows service, date, RG, location, result, and portal link. |
| **Deploy card** | Auto-renders when server emits a `deploy_config` event. Shows the exact config being deployed and a terminal-style log of deployment steps. |
| **Login bar** | Top-right — shows logged-in user, subscription, and logout button. |

### 2. Backend Server — `chatbot/server.js`
Express app, ~1100 lines. No database. All state is in-memory.

| Module | Purpose |
|---|---|
| **SESSION STORE** | `Map<sessionId, SessionObject>`. New session per page load. |
| **STATE MACHINE** | Eight states: `start` → `confirming_service` → `collecting` → `confirm` → `editing` → `done`, plus `learning` (parallel path from `start`). Controls what question to ask next and when to involve Ollama. |
| **SERVICE_SCHEMAS** | Parameter definitions for each Azure service. Each param has key, label, type, validation, and optional `skipIf` logic. |
| **COMMON_SCHEMA** | Shared params appended to every service: subscription, resource group, location, environment tag. |
| **loadBicepContext()** | Reads all nine `.bicep` files at startup. Returns two maps: `BICEP_TEMPLATES` (stripped to param/resource/output lines — small context for Q&A) and `BICEP_FULL` (full source for template explain walkthroughs). |
| **fetchLearnContent()** | Fetches the live Microsoft Learn page for a service (6 s timeout, HTML stripped to plain text, max 4000 chars). Results cached in memory per URL. Injected into Ollama context during learn mode Q&A. |
| **LEARN_INTENT_WORDS** | Array of phrases that trigger learn mode automatically from `start` state (e.g. "what is", "explain", "when should I use"). |
| **appendHistory()** | Appends a deployment record to `deplox-history.json` (project root) after every deploy — success or failure. Capped at 200 entries, newest first. File is gitignored. |
| **PORTAL_PATHS_SRV** | Server-side copy of the ARM provider path map. Used by `buildPortalLink()` to construct the Azure Portal deep-link stored in history records. |
| **buildDeployConfig()** | Assembles collected answers into an ARM-compatible deploy config object. |
| **Deploy pipeline** | Spawns `az` CLI commands in sequence; streams stdout/stderr back to browser via SSE. |
| **PORTAL_PATHS** | Maps each service key to its Azure Portal ARM provider path. Used to build a direct deep-link to the deployed resource after a successful deployment. |
| **Ollama integration** | Used for: `start` (service detection/welcome), `confirming_service` (why this service fits), `learning` (Q&A with Bicep + MS Learn context), `wantsTemplateExplain` (Bicep design walkthrough). All `collecting`, `confirm`, `editing`, and `done` states use direct text — no LLM. Deployment outcome (success/failure/portal link) is always factual, never LLM-generated. |

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
Runs as a local process on port 11434. The active model is fetched live from `/api/tags` on page load — the UI dropdown shows only models actually installed. Labels are inferred from the parameter size in the model name. The selected model is stored per-session and can be switched without restarting the server.

Used for conversational generation in: `start` (welcome/service detection), `confirming_service` (why this service), `learning` (Q&A answers, template design walkthroughs). All structured states (`collecting`, `confirm`, `editing`, `done`) use deterministic direct text — Ollama is never called. Deployment results, portal links, and factual status messages are derived entirely from `az` CLI output.

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
+---------------------------------------------------------------------------------------------+
|                                     STATE MACHINE                                           |
+---------------------------------------------------------------------------------------------+
|                                                                                             |
|  +-------+   learn intent / __learn__   +----------+                                        |
|  | start | ---------------------------> | learning | <- Q&A loop (Ollama)                   |
|  +-------+   or __template_svc__        +----+-----+    Bicep context + MS Learn fetched    |
|      |                                       |                                              |
|      |                                       | "Deploy X now"                               |
|      |   service detected                    |                                              |
|      +-------------> +--------------------+ <+                                              |
|                      | confirming_service |                                                 |
|      ^               |  AI explains why & |                                                 |
|      |               |  asks to confirm   |                                                 |
|      |               +---------+----------+                                                 |
|      |  "Choose diff."         |                                                            |
|      | <-----------------------+ "Yes, deploy X"                                            |
|      |                         v                                                            |
|      |               +------------+                                                         |
|      |               | collecting | <- one param at a time, full validation                 |
|      | <------------ +-----+------+  "Change service"                                       |
|      |                     |                                                                |
|      |           all params filled                                                          |
|      |                     v                                                                |
|      |               +---------+                                                            |
|      |               | confirm | <- summary shown                                           |
|      | <------------ +---------+  "Change service"                                          |
|      |                /       \                                                             |
|      |   "Edit"      /         \ "Yes, deploy"                                              |
|      |              v           v                                                           |
|      |        +---------+    +------+                                                       |
|      |        | editing |    | done |                                                       |
|      |        +---------+    +------+                                                       |
|      |             |            |                                                           |
|      +-------------+------------+  (any message resets to start)                            |
|                                                                                             |
|  Ollama used in:  start, confirming_service, learning (Q&A + template explain)              |
|  Direct text in:  collecting, confirm, editing, done                                        |
|  Deploy result:   factual from az CLI output  — LLM never reports status                    |
|  Portal link:     built from PORTAL_PATHS + subscription ID — never LLM-generated           |
|                                                                                             |
+---------------------------------------------------------------------------------------------+
```

**Session data structure:**
```js
{
  state: 'start' | 'confirming_service' | 'collecting' | 'confirm' | 'editing' | 'done' | 'learning',
  service: 'servicebus' | 'eventhub' | ... | null,
  _pendingService: 'apim',           // set during confirming_service, cleared on confirm
  _learnService: 'servicebus',       // tracked in learning state, drives Bicep context + MS Learn URL
  _pendingLearnLink: 'https://...',  // MS Learn URL to emit as learn_link SSE event after stream
  schema: [ ...paramDefs ],          // deep-copied from SERVICE_SCHEMAS
  schemaIdx: 2,                      // which param we're on
  _editingKey: 'namespaceName',      // set during editing state, null when in pick mode
  model: 'llama3.1:8b',              // active Ollama model for this session
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
