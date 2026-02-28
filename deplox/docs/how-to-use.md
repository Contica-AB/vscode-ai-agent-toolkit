# DeploX — How to Use

## Table of Contents
1. [First-Time Setup](#1-first-time-setup)
2. [Starting the App](#2-starting-the-app)
3. [Using the Chat UI](#3-using-the-chat-ui)
4. [Deploying Each Service](#4-deploying-each-service)
5. [Stopping the App](#5-stopping-the-app)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. First-Time Setup

### Step 1 — Install Node.js (if missing)

Check if you have it:
```powershell
node --version
```
If missing, install via winget:
```powershell
winget install OpenJS.NodeJS.LTS
```
Or download manually from https://nodejs.org (version 18 or higher).

---

### Step 2 — Install Azure CLI (if missing)

Check if you have it:
```powershell
az --version
```
If missing, install via winget:
```powershell
winget install Microsoft.AzureCLI
```
Or download manually from https://aka.ms/installazurecliwindows.

Then log in:
```powershell
az login
```

Install the Bicep extension (required for deployments):
```powershell
az bicep install
```

---

### Step 3 — Install Ollama + pull the AI model

Option A — Run the automated setup script (recommended):
```powershell
cd C:\path\to\deploxV0.01\chatbot
powershell -ExecutionPolicy Bypass -File .\setup-ollama.ps1
```

The script will:

| Step | Action |
|---|---|
| 1 | Check Node.js ≥ 18 |
| 2 | Run `npm install` (installs Express) |
| 3 | Install Ollama via `winget` if not found |
| 4 | Start the Ollama service |
| 5 | Pull `llama3.2:1b` model (~1 GB, only once) |
| 6 | Verify Azure CLI is installed |

Option B — Manual:
```powershell
# Install Ollama
winget install Ollama.Ollama

# Pull the model
ollama pull llama3.2:1b

# Install npm dependencies
cd C:\path\to\deploxV0.01\chatbot
npm install
```

When setup completes you'll see:
```
  Setup complete! Run:  powershell -ExecutionPolicy Bypass -File .\start.ps1
```

---

## 2. Starting the App

Every time you want to use DeploX, open PowerShell and run:

```powershell
cd C:\path\to\deploxV0.01\chatbot
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

This script:
1. Kills anything already running on port 3000
2. Starts Ollama in the background (with Intel GPU support if available)
3. Opens your browser at **http://localhost:3000** automatically
4. Starts the Node.js server

You'll see:
```
  DeploX chatbot running at http://localhost:3000
  Model: llama3.2:1b   Press Ctrl+C to stop.
```

> **Keep this PowerShell window open** while using the app. Closing it stops the server.

---

## 3. Using the Chat UI

### 3.1 Sign in to Azure

When the page loads, check the **top-right corner**:

- If you see your name and subscription → you're already signed in ✅
- If you see a **Sign in** button → click it. A browser login window opens. Complete the Microsoft login flow.

### 3.2 Pick a service to deploy

The welcome screen shows quick-launch chips for all supported services:

```
[ Service Bus ]  [ Event Hubs ]  [ Logic App Standard ]  [ Logic App Consumption ]
[ APIM ]  [ Function App ]  [ Key Vault ]  [ More... ]
```

Click any chip to start that deployment. You can also type what you want, e.g.:
- *"I want to deploy a Service Bus"*
- *"Set up a Key Vault"*
- *"Logic App Standard"*

### 3.3 Answer the questions

The bot asks one question at a time. For each question:

| Input type | How to answer |
|---|---|
| **Text** | Type the value and press Enter |
| **Choice buttons** | Click one of the chip buttons shown below the message |
| **Optional (Skip)** | Click **Skip** or type `skip` to leave it blank |
| **Comma-separated list** | Type `queue1, queue2, queue3` — or click **Skip** for none |

If you enter an invalid value (wrong length, wrong characters), the bot shows an error and asks again.

> **Tip:** You can switch to a different service at any point — just click a service chip or type the service name. Your subscription and environment selections are kept.

### 3.4 Review and confirm

After all questions are answered, the bot shows a **summary** of what will be deployed:

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

Then two buttons appear:

- **Yes, deploy** — starts the deployment
- **Cancel** — goes back to the service picker

### 3.5 Watch the deployment

When you confirm, a **terminal card** appears in the chat with live log output:

```
[~] Setting subscription: My Azure Sub
[+] Creating resource group: my-rg in westeurope
[>] Deploying Service Bus → my-rg ...
...
[+] Deployment outputs:
    namespaceId: /subscriptions/.../servicebus/myapp-bus
    namespaceName: myapp-bus

Deployment completed successfully.
```

When done, the service chips reappear so you can deploy something else.

### 3.6 Start a new session

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
1. Service name (1–50 chars)
2. Publisher email
3. Publisher organisation name
4. SKU: `Consumption` / `Developer` / `Basic` / `Standard` / `Premium`

> ⚠️ All tiers except **Consumption** take **30–45 minutes** to provision. The terminal log will show activity throughout — this is normal.

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
ollama pull llama3.2:1b
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
