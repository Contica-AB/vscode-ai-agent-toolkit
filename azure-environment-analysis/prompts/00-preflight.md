# Phase 0: Preflight Validation

## Objective
Validate the environment, tool connectivity, credentials, and configuration before starting the assessment. This phase is **interactive** — the agent will ask you to fix issues and verify fixes before proceeding.

---

## Output Location

Read the client name from the active client config.
Derive the assessment date from the client config's `assessmentDate` field (or use today's date in YYYY-MM-DD format).
All outputs for this assessment go to: `/output/{client-name}/{YYYY-MM-DD}/`
Create the folder structure if it doesn't exist.

---

## Tool Selection Strategy

> **CRITICAL**: This toolkit uses a combination of tools. Understand which to use BEFORE starting.

### Primary Tools

> **MCP-First Rule**: Always try MCP tools first. Only fall back to CLI if MCP fails.

| Resource Type | Primary (MCP) | Fallback (CLI) |
|--------------|---------------|----------------|
| Logic Apps (Consumption) | Logic Apps MCP | `az logic workflow list` |
| Logic Apps (Standard) | Logic Apps MCP | `az webapp list --query "[?kind contains 'workflowapp']"` |
| Logic App Definitions | Logic Apps MCP | `az logic workflow show` or REST API |
| Logic App Run History | Logic Apps MCP | Azure REST API via `az rest` |
| Logic App Action Details | Logic Apps MCP | Azure REST API via `az rest` |
| Function Apps | Azure MCP | `az functionapp list` |
| Service Bus | Azure MCP | `az servicebus namespace list` |
| Key Vault | Azure MCP | `az keyvault list` |
| Storage | Azure MCP | `az storage account list` |
| APIM | Azure MCP | `az apim list` |
| Event Grid | Azure MCP | `az eventgrid topic list` |
| Event Hubs | Azure MCP | `az eventhubs namespace list` |

**Note**: Logic Apps MCP may have authentication issues in some environments. The preflight test (Step 3) will determine if it works — if not, CLI fallback is used automatically.

---

## Prerequisites Checklist

Before running any assessment, this preflight check validates:
1. ✅ Azure CLI is installed and authenticated
2. ✅ Correct subscription is selected
3. ✅ MCP servers are tested (working ones identified)
4. ✅ Client configuration has real values
5. ✅ Azure permissions are sufficient
6. ✅ Standards files are present
7. ✅ Output folders created

---

## Prompt

```
I need to perform Phase 0: Preflight Validation before starting the Azure Integration Services assessment.

**IMPORTANT**: This is an INTERACTIVE validation. When issues are found:
1. Report the issue clearly
2. Provide the exact command/action to fix it
3. ASK the user to confirm they've fixed it
4. Re-test to verify the fix worked
5. Only proceed when all critical checks pass

---

### Step 1: Validate Azure CLI Installation and Login

**1.1 Check Azure CLI is installed:**
```bash
az version
```
- ✅ CLI installed → continue
- ❌ Not found → ASK user to install Azure CLI, then re-check

**1.2 Check Azure login status:**
```bash
az account show --output json
```
- ✅ Returns account info → extract subscription details
- ❌ Error "Please run 'az login'" → ASK user:
  ```
  You are not logged in to Azure CLI. Please run:
  
  az login
  
  Then tell me to continue.
  ```
  Wait for user confirmation, then re-check.

**1.3 Record current subscription:**
- Extract: subscription ID, subscription name, tenant ID
- Store these for comparison with client config

---

### Step 2: Validate Client Configuration

**2.1 Identify the client:**
Ask: "Which client folder should I use?" 
List available folders in `/clients/`

**2.2 Read client config:**
Read `/clients/{client}/config.json`

**2.3 Check for placeholder values:**

| Field | Placeholder to Reject | Found Value | Status |
|-------|----------------------|-------------|--------|
| `client` | `CLIENT_NAME` | | |
| `subscriptions[].id` | `SUBSCRIPTION_ID` | | |
| `subscriptions[].name` | `SUBSCRIPTION_NAME` | | |
| `assessmentDate` | `YYYY-MM-DD` | | |
| `azureAccess.tenantId` | `TENANT_ID` | | |

If ANY placeholder found → ASK user to update the config file:
```
The client config has placeholder values. Please update:

File: /clients/{client}/config.json

Fields to fix:
- {field}: currently "{value}" - needs real value

Edit the file and tell me when done.
```
Wait for confirmation, then re-read and verify.

**2.4 Verify subscription matches:**
- Compare CLI subscription ID with config `subscriptions[0].id`
- If mismatch → ASK user:
  ```
  Subscription mismatch!
  
  CLI is set to: {cli_subscription} ({cli_id})
  Config expects: {config_subscription} ({config_id})
  
  Please run:
  az account set --subscription "{config_id}"
  
  Then tell me to continue.
  ```
  Wait, then re-verify.

---

### Step 3: Test MCP Server Connectivity

**IMPORTANT**: Test each MCP server and record which ones work. DO NOT assume all work.

**3.1 Azure MCP Server:**
Try to list resource groups or use any Azure MCP command:
- ✅ Works → Record "Azure MCP: ✅ Working"
- ❌ Fails → Record "Azure MCP: ❌ Failed - {error}"
- Fallback: Azure CLI is always available

**3.2 Logic Apps MCP Server:**
Try to call any logicapps-mcp tool (e.g., list Logic Apps):
- ✅ Works → Record "Logic Apps MCP: ✅ Working" — use as primary for Logic Apps throughout assessment
- ❌ Fails → Record "Logic Apps MCP: ❌ Failed - using CLI fallback" — use `az logic` / `az rest` for Logic Apps
- This is a known potential issue. Do NOT ask user to fix it — just record status and use CLI fallback if needed

**3.3 Azure DevOps MCP Server (if ADO configured):**
If client config has ADO settings, try listing projects:
- ✅ Works → Record working
- ❌ Fails → Record failed, note ADO features will be skipped

**Output tool status table:**
```markdown
| MCP Server | Status | Fallback |
|------------|--------|----------|
| Azure MCP | ✅ Working | CLI backup |
| Logic Apps MCP | ❌ Auth issue | Using CLI + REST API |
| Azure DevOps MCP | ✅ / ❌ / N/A | Manual ADO search |
```

---

### Step 4: Validate Azure Permissions

**Test actual permissions using working tools:**

| Test | Command | Required Role | Pass Criteria |
|------|---------|---------------|---------------|
| List Resource Groups | `az group list -o table` | Reader | Returns list |
| List Logic Apps | `az logic workflow list` | Reader | Returns JSON |
| Get Logic App Definition | `az logic workflow show -g {rg} -n {name}` | Reader | Returns definition |
| List Service Bus | `az servicebus namespace list` | Reader | Returns namespaces |
| List Key Vaults | `az keyvault list` | Reader | Returns vaults |
| List Function Apps | Azure MCP or `az functionapp list` | Reader | Returns apps |

**Permission Test Process:**
1. Run each test
2. Record PASS ✅ or FAIL ❌
3. If failures → identify missing role and report

**If critical tests fail:**
```
Insufficient Azure permissions detected.

Failed tests:
- {test}: {error}

Required roles at subscription scope:
- Reader (minimum)
- Logic App Operator (for run history)
- Key Vault Reader (for secret list)

Please request access, then tell me to re-test.
```

---

### Step 5: Validate Standards Files

Check these files exist (read first few lines to confirm):

**Contica SSOT Standards (`/standards/contica-ssot/`):**
- [ ] `baseline-levels.md`
- [ ] `authentication-matrix.md`
- [ ] `network-security.md`
- [ ] `required-tiers.md`
- [ ] `naming-convention.md`
- [ ] `azure-policies.md`
- [ ] `known-exceptions.md`
- [ ] `opportunity-categories.md`

**Azure API Instructions (`/standards/azure-apis/`):**
- [ ] `advisor-recommendations.md`
- [ ] `policy-compliance.md`
- [ ] `defender-recommendations.md`
- [ ] `resource-health.md`

**Methodology Files (`/methodology/`):**
- [ ] `assessment-framework.md`
- [ ] `security-checklist.md`
- [ ] `best-practices.md`
- [ ] `report-template.md`

**Access Requirements:**
- [ ] `/standards/access-requirements.md`

Report missing files but continue (not blocking).

---

### Step 6: Create Output Folders

Derive client output folder:
- Read "client" field from config
- Lowercase, replace spaces with hyphens
- Read "assessmentDate" from config (or use today's date YYYY-MM-DD)
- Create folder structure:
  ```
  /output/{client-name}/{YYYY-MM-DD}/
  /output/{client-name}/{YYYY-MM-DD}/inventory/
  /output/{client-name}/{YYYY-MM-DD}/analysis/
  /output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/
  /output/{client-name}/{YYYY-MM-DD}/reports/
  ```

**IMPORTANT**: Do NOT create folders without the date subfolder. All output folders MUST be under the `{YYYY-MM-DD}/` directory. Creating `/output/{client-name}/analysis/` directly would leave empty ghost folders.

---

### Step 7: Load Assessment Settings

Record settings that affect assessment behavior:

| Setting | Value | Impact |
|---------|-------|-------|
| `securityOption` | standard/advanced | Network/tier standards to use |
| `monitoringPlatform` | nodinite/native | Skip diagnostics checks if nodinite |
| `usesCMK` | true/false | Skip CMK checks if false |
| `usesNSGMicroSegmentation` | true/false | Skip NSG checks if false |

ASK user to confirm these settings are correct before proceeding.

---

## Output: Preflight Validation Report

Generate and save: `/output/{client-name}/{YYYY-MM-DD}/analysis/preflight-validation.md`

```markdown
# Preflight Validation Report

**Client**: {client name}
**Date**: {date}
**Validated By**: GitHub Copilot Assessment Agent

---

## Azure CLI Status

| Check | Result |
|-------|--------|
| CLI Installed | ✅ v{version} |
| Logged In | ✅ {user} |
| Subscription | {name} |
| Subscription ID | {id} |
| Tenant ID | {tenant} |
| Matches Config | ✅ |

---

## Client Configuration

- **Config File**: `/clients/{client}/config.json`
- **Validation**: ✅ No placeholders / ❌ Had placeholders (fixed)
- **Assessment Date**: {date}

---

## Tool Availability

| Tool | Status | Notes |
|------|--------|-------|
| Azure CLI | ✅ Required | Fallback for all operations |
| Azure MCP Server | ✅ / ❌ | {status details} |
| Logic Apps MCP | ✅ / ❌ | {status — if failed, using CLI fallback} |
| Azure DevOps MCP | ✅ / ❌ / N/A | {status} |

### Tool Usage Strategy

For this assessment, I will use:
- **Azure MCP Server**: Primary tool for all non-Logic-App resources
- **Logic Apps MCP**: Primary for Logic Apps (if working) / CLI fallback (if failed)
- **Azure CLI**: Fallback for any MCP failures

---

## Azure Permissions

| Test | Status | Notes |
|------|--------|-------|
| List Resource Groups | ✅ / ❌ | |
| List Logic Apps | ✅ / ❌ | |
| Get Logic App Definition | ✅ / ❌ | |
| List Service Bus | ✅ / ❌ | |
| List Key Vaults | ✅ / ❌ | |
| List Function Apps | ✅ / ❌ | |

**Access Level**: {Full / Recommended / Minimum / Insufficient}

---

## Standards Files

| Category | Found | Missing |
|----------|-------|---------|
| Contica SSOT | {n}/8 | {list} |
| Azure APIs | {n}/4 | {list} |
| Methodology | {n}/4 | {list} |

---

## Output Folders

- Created: `/output/{client-name}/{YYYY-MM-DD}/`
- Subfolders: inventory/, analysis/, analysis/logic-apps/, reports/

---

## Assessment Settings

| Setting | Value | Notes |
|---------|-------|-------|
| Security Option | {value} | |
| Monitoring Platform | {value} | |
| Uses CMK | {value} | |
| Uses NSG Micro-Segmentation | {value} | |

---

## Preflight Status

**{✅ PASSED - Ready to begin Phase 1: Discovery}**

or

**{❌ FAILED - Issues to resolve:}**
{list of blocking issues}
```

---

## Interactive Flow Summary

```
┌─────────────────────────────────────────┐
│ Start Preflight                         │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ Check Azure CLI installed?              │
│ ❌ → Ask user to install → wait → retry │
│ ✅ → Continue                           │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ Check Azure login?                      │
│ ❌ → Ask user to run az login → wait    │
│ ✅ → Continue                           │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ Check client config placeholders?       │
│ ❌ → Ask user to edit config → wait     │
│ ✅ → Continue                           │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ Check subscription matches?             │
│ ❌ → Ask user to switch subscription    │
│ ✅ → Continue                           │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ Test MCP servers                        │
│ Record status, set fallbacks            │
│ Logic Apps MCP expected to fail → OK    │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ Test Azure permissions                  │
│ ❌ critical → Ask user to get access    │
│ ✅ → Continue                           │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ Validate files, create folders          │
│ Report status                           │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ Ask user to confirm settings            │
│ Generate preflight report               │
│ ✅ PASSED → Ready for Phase 1           │
└─────────────────────────────────────────┘
```

---

## Success Criteria

Preflight passes when:
1. ✅ Azure CLI installed and logged in
2. ✅ Subscription matches client config
3. ✅ No placeholder values in config
4. ✅ At least Azure CLI works (MCP is bonus)
5. ✅ Reader permissions confirmed
6. ✅ Output folders created
7. ✅ User confirmed assessment settings

---

## Common Issues and Resolutions

| Issue | Resolution |
|-------|------------|
| "az: command not found" | Install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli |
| "Please run 'az login'" | Run `az login` and authenticate |
| Wrong subscription | Run `az account set --subscription "{id}"` |
| Logic Apps MCP auth error | Expected - use CLI fallback (automatic) |
| Permission denied | Request Reader role at subscription scope |
| Missing standards files | Pull latest from repo |
