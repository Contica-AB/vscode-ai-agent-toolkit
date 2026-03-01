# DeploX — How to Use

## Table of Contents
1. [First-Time Setup](#1-first-time-setup)
2. [Starting the App](#2-starting-the-app)
3. [Using the Chat UI](#3-using-the-chat-ui)
   - [3.1 Switch AI model](#31-switch-ai-model)
   - [3.2 Sign in to Azure](#32-sign-in-to-azure)
   - [3.3 Describe what you want to deploy — or learn first](#33-describe-what-you-want-to-deploy--or-learn-first)
   - [3.4 Explore included templates](#34-explore-included-templates)
   - [3.5 Answer the questions](#35-answer-the-questions)
   - [3.6 Review and edit before deploying](#36-review-and-edit-before-deploying)
   - [3.7 Watch the deployment](#37-watch-the-deployment)
   - [3.8 Start a new session](#38-start-a-new-session)
4. [Deploying Each Service](#4-deploying-each-service)
5. [Stopping the App](#5-stopping-the-app)
6. [Troubleshooting](#6-troubleshooting)

---

> **All commands below are run from the DeploX project root folder.**
> Open PowerShell (5 or 7), navigate to the folder, then run the commands:
> ```powershell
> cd C:\projects\deploxV0.01    # adjust to wherever you put the folder
> ```
> If you get an execution policy error, run this once:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

---

## 1. First-Time Setup

### Step 1 — Install Node.js (if missing)

```powershell
node --version    # check if already installed (need v18 or higher)
```
If missing:
```powershell
winget install OpenJS.NodeJS.LTS
```
Or download manually from https://nodejs.org

---

### Step 2 — Install Azure CLI (if missing)

```powershell
az --version    # check if already installed
```
If missing:
```powershell
winget install Microsoft.AzureCLI
```
Then log in and install Bicep:
```powershell
az login
az bicep install
```

---

### Step 3 — Install Ollama + choose your AI model

#### Choose a model based on your machine's RAM

| Model | RAM needed | Download size | Quality | Command |
|---|---|---|---|---|
| `llama3.2:1b` | 4 GB | ~1 GB | Basic — fast, minimal reasoning | `ollama pull llama3.2:1b` |
| `llama3.2:3b` | 6 GB | ~2 GB | Good — better responses | `ollama pull llama3.2:3b` |
| `phi3.5:mini` | 6 GB | ~2.3 GB | Good — strong at following instructions | `ollama pull phi3.5:mini` |
| `llama3.1:8b` ⭐ | 10 GB | ~5 GB | Great — reliable reasoning, less hallucination | `ollama pull llama3.1:8b` |
| `mistral:7b` | 10 GB | ~4.5 GB | Great — excellent instruction following | `ollama pull mistral:7b` |

> **Default model is `llama3.1:8b`** — recommended if you have 16 GB+ RAM.
> To switch models at any time, use the **model dropdown in the top-right corner of the UI** — it shows all installed models with a short description. Your selection is saved across sessions.
> To change the default, set the environment variable before starting: `$env:OLLAMA_MODEL = 'mistral:7b'`

You can pull multiple models and switch freely in the UI:
```powershell
ollama pull llama3.2:3b    # fast option
ollama pull llama3.1:8b    # quality option
```

#### Install Ollama + pull your chosen model

**Option A — Automated (recommended):**
```powershell
.\chatbot\setup-ollama.ps1
```

The script handles:

| Step | Action |
|---|---|
| 1 | Check Node.js ≥ 18 |
| 2 | Run `npm install` (installs Express) |
| 3 | Install Ollama via `winget` if not found |
| 4 | Start the Ollama service |
| 5 | Pull `llama3.1:8b` model (~5 GB, only once) |
| 6 | Verify Azure CLI is installed |

**Option B — Manual (pick your model from the table above):**
```powershell
winget install Ollama.Ollama
ollama pull llama3.1:8b    # replace with your chosen model
cd chatbot
npm install
cd ..
```

---

## 2. Starting the App

Every time you want to use DeploX, open PowerShell and run:

```powershell
cd C:\projects\deploxV0.01    # adjust to your path
.\chatbot\start.ps1
```


This script:
1. Kills anything already running on port 3000
2. Starts Ollama in the background (with Intel GPU support if available)
3. Opens your browser at **http://localhost:3000** automatically
4. Starts the Node.js server

You'll see:
```
  DeploX chatbot running at http://localhost:3000
  Model: llama3.1:8b   Press Ctrl+C to stop.
```

> **Keep this PowerShell window open** while using the app. Closing it stops the server.

---

## 3. Using the Chat UI

### 3.1 Switch AI model

In the **top-right corner** you will see a dropdown showing every Ollama model installed on your machine. The list is fetched live from Ollama on page load — models you have not pulled will never appear.

Each model is labelled automatically based on its parameter size:

| Size in name | Label shown |
|---|---|
| 1b – 2b | Fastest · very light |
| 3b – 4b | Fast · light |
| 7b – 9b | Balanced · good quality |
| 10b – 20b | High quality · slower |
| 21b + | Best quality · requires strong hardware |

Models with no size in the name (e.g. `:latest` tags) show just the model name. Click the dropdown to switch at any time. Your choice is saved in the browser and applied to all future messages.

### 3.2 Sign in to Azure

When the page loads, check the **top-right corner**:

- If you see your name and subscription → you're already signed in ✅
- If you see a **Sign in** button → click it. A browser login window opens. Complete the Microsoft login flow.

### 3.3 Describe what you want to deploy — or learn first

You do not have to click a button — just describe what you need in plain language:

- *"I need to manage and secure my APIs"*
- *"Set up a message queue for my orders service"*
- *"I want to host a serverless function in Azure"*

**Want to learn before you deploy?** Click **Learn about Azure services** at the bottom of the welcome screen, or just ask a question:

- *"What is Service Bus?"*
- *"When should I use Event Hubs vs Service Bus?"*
- *"What does your APIM template deploy?"*

The bot will answer using its own Azure knowledge plus the actual Bicep template source, and append a link to the official Microsoft Learn documentation. After each answer you get two buttons:

- **Deploy [service] now** — transitions straight into the deployment flow
- **Keep learning** — ask another question
- **Explain the included template** — see section 3.4 below

When you are ready to deploy, the AI identifies the right Azure service and **confirms its understanding before asking any questions**:

> *"It sounds like you want to centralise and secure access to your APIs. Azure API Management is the right service for this — it provides a single gateway with built-in rate limiting, authentication and monitoring. Shall I proceed with deploying API Management?"*

Two buttons appear:

- **Yes, deploy API Management** — moves to parameter collection
- **Choose a different service** — shows the full service list

You can also click the service chips on the welcome screen to go directly.

### 3.4 Explore included templates

The welcome screen has a dedicated **"Explore included templates"** section below the service chips. Click any service name to get an immediate walkthrough of the Bicep template DeploX uses to deploy it.

The explanation is written from the perspective of a solutions architect describing their own design choices. It covers:

1. **Why Bicep** — why infrastructure-as-code was chosen and what advantages it brings
2. **What the template deploys** — every Azure resource created, the SKU or tier selected, and why that default was chosen
3. **What you can configure** — each parameter, what it controls, its default value and any restrictions
4. **What was kept simple on purpose** — advanced options intentionally excluded to keep deployments reliable and focused
5. **Outputs** — what values the template returns after a successful deployment and how to use them

This is available for all nine supported services and does not start a deployment. After reading, you can click **Deploy [service] now** to continue into the deployment flow.

### 3.5 Answer the questions

The bot asks one question at a time. For each question:

| Input type | How to answer |
|---|---|
| **Text** | Type the value and press Enter |
| **Choice buttons** | Click one of the chip buttons shown below the message |
| **Default value** | Click the **Use default (X)** button to accept the suggested value |
| **Optional (Skip)** | Click **Skip** or type `skip` to leave it blank |
| **Comma-separated list** | Type `queue1, queue2, queue3` — or click **Skip** for none |

If you enter an invalid value (wrong length, wrong characters), the bot shows a clear error and asks again.

> **Changed your mind mid-way?** Click the **Change service** button or type *"start over"* / *"wrong service"* at any point. Your subscription selection is kept.

### 3.6 Review and edit before deploying

After all questions are answered, the bot shows a **full summary** of what will be deployed:

```
Service: Service Bus
Subscription: My Azure Sub
Resource Group: my-rg
Location: westeurope
Environment: dev
namespaceName: myapp-bus
sku: Standard
queues: orders, notifications
```

Three buttons appear:

| Button | Action |
|---|---|
| **Yes, deploy** | Starts the deployment immediately |
| **Edit a setting** | Shows every setting as a button — click any to change its value. Full validation runs on the new value. Returns to this summary when done. |
| **Change service** | Resets and lets you pick a different service |

You can edit as many settings as you like before confirming.

### 3.7 Watch the deployment

When you confirm, a **deployment card** appears in the chat showing the exact config being deployed. A **terminal panel** opens at the bottom with live log output:

```
[~] Setting subscription: My Azure Sub
[+] Creating resource group: my-rg in westeurope
[>] Deploying Service Bus → my-rg ...
...
[+] Deployment outputs:
    namespaceId: /subscriptions/.../servicebus/myapp-bus

Deployment completed successfully.
```

When the deployment finishes, the chat shows the actual result — success or failure — with no guessing from the AI:

**On success:**
> Deployment complete. **Service Bus** is live in resource group **my-rg** (westeurope).
> [Open in Azure Portal →](https://portal.azure.com/...)

The portal link goes **directly to the deployed resource** — not just the portal homepage.

**On failure:**
> Deployment failed.
> `{"code": "NameInUse", ...}`
> Check the terminal output above for the full error.

### 3.8 Start a new session

- **Refresh the page** — always starts a completely fresh session (no stale state)
- **New Chat button** (if available) — resets the chat while keeping the page loaded

---

## 4. Deploying Each Service

### Service Bus
Questions asked:
1. Namespace name (6–50 chars, letters/numbers/hyphens, globally unique)
2. SKU: `Basic` / `Standard` / `Premium`
3. Queues to pre-create (optional, comma-separated)
4. Topics to pre-create (optional) — **auto-skipped if Basic SKU selected**

### Event Hubs
Questions asked:
1. Namespace name (6–50 chars, globally unique)
2. SKU: `Basic` / `Standard` / `Premium`
3. Event hub instances to pre-create (optional)
4. Message retention in days (1 / 3 / 7) — **auto-skipped if no hubs named**

### Logic App Standard
Questions asked:
1. Logic App name (2–60 chars)
2. Storage account name (3–24 lowercase letters/numbers, **globally unique**)
3. Hosting plan: `WS1` / `WS2` / `WS3`
4. Local workflows folder path (optional — for zip deploy of existing code)

> Logic App Standard supports zip deploy. Point to a folder containing your `host.json`, `local.settings.json`, and workflow subfolders.

### Logic App Consumption
Questions asked:
1. Logic App name (2–80 chars)
2. Integration Account resource ID (optional — links an existing Integration Account)

> Consumption Logic Apps deploy with an empty workflow. You author the workflow in the Azure Portal or VS Code after deployment.

### Function App
Questions asked:
1. Function App name (2–60 chars)
2. Storage account name (3–24 lowercase letters/numbers, **globally unique**)
3. Runtime: `dotnet` / `dotnet-isolated` / `node` / `python` / `java`
4. Local code folder path (optional — for zip deploy of existing functions)

### API Management
Questions asked:
1. Service name (1–50 chars, must start with a letter, letters/numbers/hyphens, globally unique)
2. Publisher email
3. Publisher organisation name
4. SKU: `Consumption` / `Developer` / `Basic` / `Standard` / `Premium`
5. Rate limit per client IP — max calls per minute (default: 60)
6. CORS allowed origins (default: `*`)

> ⚠️ All tiers except **Consumption** take **30–45 minutes** to provision. The terminal log will show activity throughout — this is normal.
>
> The deployed APIM includes a global rate-limiting policy, a global CORS policy, and a sample Echo API pre-configured.

### Integration Account
Questions asked:
1. Account name (1–80 chars)
2. SKU: `Free` / `Basic` / `Standard`

### Key Vault
Questions asked:
1. Vault name (3–24 chars, letters/numbers/hyphens)
2. SKU: `standard` / `premium`

> Your Azure user object ID is automatically injected as the vault admin — you'll have full access immediately after deploy.

### Event Grid
Questions asked:
1. Topic name (3–50 chars)

---

## 5. Stopping the App

In the PowerShell window where you ran `start.ps1`, press:

```
Ctrl + C
```

This stops the Node.js server. Ollama continues running in the background (it's a separate process). To stop Ollama too:

```powershell
Stop-Process -Name "ollama" -Force
```

---

## 6. Troubleshooting

### "Not logged in to Azure"
Run `az login` in PowerShell, complete the browser login, then retry.

### "Ollama not running" / bot doesn't respond
```powershell
# Start Ollama manually
ollama serve
```
Then refresh the browser.

### "model not found" error
```powershell
ollama pull llama3.1:8b
```

### Port 3000 already in use
The start script kills existing processes on port 3000 automatically. If it persists:
```powershell
# Find and kill manually
netstat -ano | Select-String ":3000"
# Note the PID in the last column, then:
Stop-Process -Id <PID> -Force
```

### Deployment fails with "NameInUse"
Azure service names (Service Bus namespaces, storage accounts, Key Vault names, etc.) must be **globally unique** across all Azure customers. Add your organisation name or a unique suffix, e.g. `contoso-myapp-bus` instead of `myapp-bus`.

### APIM deployment looks stuck
This is expected — non-Consumption APIM tiers genuinely take 30–45 minutes. Leave the browser tab open and wait. The deployment is running in Azure even if the log goes quiet.

### Refresh loses my progress
This is by design — each page refresh creates a fresh session. If you accidentally refresh mid-flow, just start the deployment again from the service chip.
