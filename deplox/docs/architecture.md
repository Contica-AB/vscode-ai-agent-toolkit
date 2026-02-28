# DeploX — Architecture

## Overview

DeploX is a **local-first** deployment toolkit. There is no cloud backend — everything runs on the developer's machine. The user interacts through a browser UI; an AI chatbot guides them through questions, then triggers Azure deployments via Bicep templates.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Developer Machine                        │
│                                                                 │
│  Browser (localhost:3000)                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  index.html  (Single-page app — HTML + CSS + Vanilla JS) │   │
│  │                                                          │   │
│  │  ┌─────────────┐   ┌──────────────┐  ┌───────────────┐  │   │
│  │  │ Chat Window │   │ Choice Chips │  │ Deploy Card   │  │   │
│  │  │ (SSE stream)│   │ (buttons)    │  │ (log terminal)│  │   │
│  │  └──────┬──────┘   └──────┬───────┘  └───────┬───────┘  │   │
│  └─────────┼────────────────┼──────────────────┼───────────┘   │
│            │  POST /api/chat │                  │ POST /api/deploy│
│            ▼                ▼                  ▼               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Node.js  server.js  (Express)               │   │
│  │                                                          │   │
│  │  ┌────────────────────┐   ┌──────────────────────────┐   │   │
│  │  │   State Machine    │   │    Deploy Pipeline       │   │   │
│  │  │  start → collecting│   │  1. az account set       │   │   │
│  │  │  → confirm → done  │   │  2. az group create      │   │   │
│  │  └────────┬───────────┘   │  3. az deployment group  │   │   │
│  │           │               │     create (Bicep)       │   │   │
│  │  ┌────────▼───────────┐   │  4. zip-deploy (opt.)    │   │   │
│  │  │  SESSION STORE     │   │  5. surface outputs      │   │   │
│  │  │  (in-memory Map)   │   └──────────┬───────────────┘   │   │
│  │  └────────────────────┘              │                   │   │
│  └───────────────┬──────────────────────┼───────────────────┘   │
│                  │                      │                       │
│        ┌─────────▼──────────┐  ┌────────▼────────────────┐     │
│        │  Ollama (local LLM) │  │  Azure CLI (az)         │     │
│        │  llama3.2:1b        │  │  + Bicep modules        │     │
│        │  port 11434         │  │  modules/*.bicep        │     │
│        └─────────────────────┘  └─────────────────────────┘     │
│                                          │                      │
└──────────────────────────────────────────┼──────────────────────┘
                                           │  ARM REST API
                                           ▼
                                  ┌─────────────────┐
                                  │  Azure Cloud    │
                                  │  (subscription) │
                                  └─────────────────┘
```

---

## Component Breakdown

### 1. Browser UI — `chatbot/public/index.html`
Single HTML file, no framework, no build step.

| Section | Purpose |
|---|---|
| **Chat window** | Streams tokens from the server via SSE. Renders bot/user messages. |
| **Choice chips** | Dynamic buttons rendered from server-sent `choices` events. Used for subscriptions, SKUs, regions, and service picks. |
| **Welcome chips** | Always-visible shortcut buttons for each Azure service on the home screen. |
| **Deploy card** | Auto-renders when server emits a `deploy_config` event. Shows a terminal-style log of deployment steps. |
| **Login bar** | Top-right — shows logged-in user, subscription, and logout button. |

### 2. Backend Server — `chatbot/server.js`
Express app, ~800 lines. No database. All state is in-memory.

| Module | Purpose |
|---|---|
| **SESSION STORE** | `Map<sessionId, SessionObject>`. New session per page load. |
| **STATE MACHINE** | Five states: `start` → `collecting` → `confirm` → `done`. Controls what question to ask next. |
| **SERVICE_SCHEMAS** | Parameter definitions for each Azure service. Each param has key, label, type, validation, and optional `skipIf` logic. |
| **COMMON_SCHEMA** | Shared params appended to every service: subscription, resource group, location, environment tag. |
| **buildDeployConfig()** | Assembles collected answers into an ARM-compatible deploy config object. |
| **Deploy pipeline** | Spawns `az` CLI commands in sequence; streams stdout/stderr back to browser via SSE. |
| **Ollama integration** | Used only for `start` state (welcome/service picker). All collecting/confirm states use direct text — no LLM. |

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

### 4. Local AI — Ollama (`llama3.2:1b`)
Runs as a local process on port 11434. Only used to generate the conversational greeting when a user first arrives. All structured questions (collecting params, confirm screen) bypass Ollama entirely and use direct text — this is intentional, because small models hallucinate when given strict formatting directives.

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
┌─────────────────────────────────────────────────────────────┐
│                         STATE MACHINE                       │
│                                                             │
│   ┌───────┐  service detected  ┌────────────┐              │
│   │ start │ ─────────────────► │ collecting │              │
│   └───────┘                    └─────┬──────┘              │
│       ▲                              │ all params filled    │
│       │                              ▼                      │
│       │                        ┌─────────┐                 │
│       │          cancel        │ confirm │                 │
│       │ ◄──────────────────── │         │                 │
│       │                        └────┬────┘                 │
│       │                             │ "yes, deploy"        │
│       │                             ▼                      │
│       │                        ┌──────┐                    │
│       └──────────────────────  │ done │                    │
│            next message        └──────┘                    │
│                                                             │
│  Service switch: detected at ANY state → reset to           │
│  collecting for new service (keeps subscription + env)      │
└─────────────────────────────────────────────────────────────┘
```

**Session data structure:**
```js
{
  state: 'start' | 'collecting' | 'confirm' | 'done',
  service: 'servicebus' | 'eventhub' | ... | null,
  schema: [ ...paramDefs ],   // deep-copied from SERVICE_SCHEMAS
  schemaIdx: 2,               // which param we're on
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
