# Phase 5: Unused Resource Detection

## Objective

Identify unused, legacy, or redundant integration resources across ALL resource types — Logic Apps, Service Bus, Function Apps, APIM, Key Vault, Storage, Event Grid, Event Hub, and App Configuration — that are candidates for decommissioning or cleanup.

---

## Output Location

Read the client name from the active client config.
All outputs for this phase go to: `/output/{client-name}/{YYYY-MM-DD}/analysis/`
The folder should already exist from Phase 0.

---

## Prerequisites

Before running this prompt:

1. **Required**: Phase 0 (Preflight) and Phase 1 (Discovery) must be complete.
2. Read the inventory from `/output/{client-name}/{YYYY-MM-DD}/inventory/`
3. **Optional enrichment**: If Phase 3 was selected and completed, read its output for run history context. If not available, proceed with fresh metric queries.
4. Reference `/standards/azure-apis/resource-health.md` for health status queries

---

## Tool Selection Strategy

> **MCP-First Rule**: Always try MCP tools first. Only fall back to CLI if MCP fails.

| Resource      | Operation            | Primary (MCP)    | Fallback (CLI)                                                            |
| ------------- | -------------------- | ---------------- | ------------------------------------------------------------------------- |
| Logic Apps    | Run history          | Logic Apps MCP   | `az rest --method GET --url ".../workflows/{name}/runs..."`               |
| Service Bus   | Queue message counts | Azure MCP        | `az servicebus queue show -g {rg} --namespace-name {ns} -n {queue}`       |
| Service Bus   | List topics/subs     | Azure MCP        | `az servicebus topic list -g {rg} --namespace-name {ns}`                  |
| Function Apps | Execution metrics    | Azure MCP        | `az monitor metrics list --resource {id} --metric FunctionExecutionCount` |
| Function Apps | List functions       | Azure MCP        | `az functionapp function list -g {rg} -n {app}`                           |
| APIM          | Request metrics      | Azure MCP        | `az monitor metrics list --resource {id} --metric TotalRequests`          |
| APIM          | List APIs            | Azure MCP        | `az apim api list -g {rg} --service-name {apim}`                          |
| Key Vault     | Activity metrics     | Azure MCP        | `az monitor metrics list --resource {id} --metric ServiceApiHit`          |
| Event Grid    | Delivery metrics     | Azure MCP        | `az monitor metrics list --resource {id} --metric PublishSuccessCount`    |
| Event Hub     | Throughput metrics   | Azure MCP        | `az monitor metrics list --resource {id} --metric IncomingMessages`       |
| Any resource  | Tags/metadata        | Azure MCP        | `az resource show`                                                        |
| Any resource  | ADO work items       | Azure DevOps MCP | —                                                                         |

**Example - Logic App runs from last 90 days:**

_Windows (PowerShell):_

```powershell
$START_DATE = (Get-Date).AddDays(-90).ToString("yyyy-MM-ddT00:00:00Z")
az rest --method GET --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{name}/runs?api-version=2016-06-01&`$filter=startTime ge $START_DATE"
```

_Linux/macOS (Bash):_

```bash
START_DATE=$(date -d "90 days ago" +%Y-%m-%dT00:00:00Z 2>/dev/null || date -v-90d +%Y-%m-%dT00:00:00Z)
az rest --method GET \
  --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{name}/runs?api-version=2016-06-01&\$filter=startTime ge $START_DATE"
```

**Tip**: The agent can also calculate the ISO 8601 date directly without shell commands.

**MCP-First Rule**: Always try Logic Apps MCP first for run history. Use `az rest` only as fallback if MCP fails.

---

## Prompt

```
I need to perform Phase 5: Unused Resource Detection for the Azure Integration Services assessment.

---

## PART A: Logic Apps — Dead Flow Detection

### Definition of "Dead Flows"

A Logic App is considered a candidate for decommissioning if it meets ANY of these criteria:

| Category | Criteria | Confidence |
|----------|----------|------------|
| Zero Activity | No runs in 90 days | High |
| Always Fails | Only failed runs, never succeeds | High |
| Disabled Long-term | Disabled state for 90+ days | Medium |
| No Trigger Activity | Trigger exists but never fires | Medium |

### Step A1: Query Run History

For each Logic App from the inventory:
- Query run history for the last 90 days
- Record:
  - Total runs
  - Successful runs
  - Last successful run date
  - Last run date (any status)
  - Current state (enabled/disabled)

### Step A2: Classify Each Logic App

Assign each Logic App to a category:

| Status | Criteria |
|--------|----------|
| **Active** | Successful runs in last 30 days |
| **Low Activity** | Successful runs in 30-90 days |
| **Inactive** | No runs in 90 days |
| **Failing** | Runs but never succeeds |
| **Disabled** | Disabled state |
| **Dead** | Inactive + Disabled for 90+ days |

### Step A3: Gather Context for Candidates

For each "dead flow" candidate:

1. **Check Dependencies**
   - Is this Logic App called by other Logic Apps?
   - Does it consume Service Bus queues that still receive messages?
   - Are there scheduled triggers that might still be needed?

2. **Check Documentation**
   - Search Azure DevOps (if configured) for work items mentioning this Logic App
   - Check tags for owner or project information

3. **Assess Risk of Removal**
   - Unknown purpose = investigate before removing
   - Clear test/temp = safe to recommend removal
   - Critical name but inactive = needs stakeholder confirmation

---

## PART B: Service Bus — Unused Entities

### Step B1: Unused Namespace Detection

For each Service Bus namespace:
- Check if namespace has any queues or topics
- If namespace is empty (no entities), flag as unused

### Step B2: Unused Queue Detection

For each queue, check:
```

az servicebus queue show -g {rg} --namespace-name {ns} -n {queue}

```
Flag as unused if:
- `countDetails.activeMessageCount` == 0 AND
- No messages processed in 90 days (check via metrics: `az monitor metrics list --resource {nsId} --metric IncomingMessages --interval P1D`)
- AND no Logic App or Function App consumes from this queue (cross-reference Phase 2 analysis)

### Step B3: Unused Topic/Subscription Detection

For each topic:
- Topics with zero subscriptions → likely unused
- Subscriptions with no consumers (cross-reference with Logic Apps/Functions)
- Topics with zero incoming messages in 90 days

### Step B4: Service Bus Summary

| Namespace | Entity | Type | Messages (90d) | Consumers | Status | Recommendation |
|-----------|--------|------|----------------|-----------|--------|----------------|
| {ns} | {queue} | Queue | 0 | None found | Unused | Review for deletion |

---

## PART C: Function Apps — Unused Functions

### Step C1: Zero-Invocation Detection

For each Function App:
```

az monitor metrics list --resource {functionAppId} --metric FunctionExecutionCount --interval P1D --start-time {90_days_ago} --end-time {now}

```
Flag as unused if total invocations over 90 days == 0.

### Step C2: Stopped/Disabled Function Apps

Check each Function App state:
```

az functionapp show -g {rg} -n {app} --query "state"

```
- State == "Stopped" for 90+ days → flag as unused
- Disabled individual functions (if identifiable)

### Step C3: Deprecated Runtime Detection

Check runtime versions:
```

az functionapp config show -g {rg} -n {app} --query "linuxFxVersion || netFrameworkVersion"

```
Flag Function Apps running on:
- .NET Core 3.1 (EOL)
- Node.js 14 or earlier (EOL)
- Python 3.8 or earlier (EOL)
- Any deprecated Azure Functions runtime version

### Step C4: Function Apps Summary

| Function App | Invocations (90d) | State | Runtime | Status | Recommendation |
|--------------|-------------------|-------|---------|--------|----------------|
| {name} | 0 | Running | node18 | Unused | Investigate |
| {name} | 0 | Stopped | dotnet6 | Dead + Deprecated | Delete |

---

## PART D: API Management — Unused APIs

### Step D1: Zero-Traffic API Detection

For each APIM instance, check per-API request counts:
```

az monitor log-analytics query -w {workspaceId} --analytics-query "
ApiManagementGatewayLogs
| where TimeGenerated > ago(90d)
| summarize RequestCount=count() by ApiId
"

```

If Log Analytics is unavailable, use APIM metrics:
```

az monitor metrics list --resource {apimId} --metric TotalRequests --interval P1D --start-time {90_days_ago}

```

Flag APIs with zero requests in 90 days.

### Step D2: Unused Products/Subscriptions

Check for:
- Products with no subscriptions → likely unused
- Named values not referenced in any policy
- Unused backends (not referenced by any API)

### Step D3: APIM Summary

| APIM Instance | API/Entity | Requests (90d) | Subscriptions | Status | Recommendation |
|---------------|------------|----------------|---------------|--------|----------------|
| {apim} | {api-name} | 0 | 0 | Unused | Review for deletion |

---

## PART E: Supporting Services — Unused Resources

### Step E1: Key Vault Activity

For each Key Vault:
```

az monitor metrics list --resource {kvId} --metric ServiceApiHit --interval P1D --start-time {90_days_ago} --end-time {now}

```
Flag as potentially unused if zero API hits in 90 days.
Also check for expired secrets/certificates that were never rotated.

### Step E2: Storage Account Usage

For each integration-related Storage Account:
```

az monitor metrics list --resource {storageId} --metric Transactions --interval P1D --start-time {90_days_ago} --end-time {now}

```
Flag as potentially unused if near-zero transactions (exclude accounts used solely for Logic App state storage or diagnostics — check container names for "azure-webjobs-hosts", "flow-", or "insights-").

### Step E3: Event Grid — Unused Topics

For each Event Grid topic:
```

az monitor metrics list --resource {topicId} --metric PublishSuccessCount --interval P1D --start-time {90_days_ago} --end-time {now}

```
Flag as unused if:
- Zero published events in 90 days
- Topics with no event subscriptions

### Step E4: Event Hub — Zero Throughput

For each Event Hub namespace:
```

az monitor metrics list --resource {nsId} --metric IncomingMessages --interval P1D --start-time {90_days_ago} --end-time {now}

```
Flag as unused if zero incoming messages in 90 days.

### Step E5: App Configuration — Unused Stores

For each App Configuration store:
```

az monitor metrics list --resource {storeId} --metric HttpIncomingRequestCount --interval P1D --start-time {90_days_ago} --end-time {now}

````
Flag as unused if zero requests in 90 days.

---

## PART F: Cross-Resource Context & Recommendations

### Step F1: Gather Context for All Candidates

For each unused resource candidate:
1. Check tags for owner, project, environment
2. Check creation date — recently created resources might still be in development
3. Cross-reference with Phase 2 dependency analysis — is anything referencing this resource?
4. Search Azure DevOps (if configured) for related work items

### Step F2: Make Recommendations

For each unused resource, recommend:

| Action | When |
|--------|------|
| **Delete** | Confirmed test/temp, no dependencies, stakeholder approved |
| **Disable/Stop** | Uncertain purpose, want to test impact |
| **Downgrade** | Resource is over-provisioned for actual usage |
| **Investigate** | Unknown purpose, potential dependencies |
| **Keep** | Intentionally inactive (seasonal, backup, DR) |

---

## Output Requirements

Save unused resource report:
`/output/{client-name}/{YYYY-MM-DD}/analysis/dead-flows.md`

Structure:
```markdown
# Unused Resource Detection Report

**Date**: {date}
**Period Analyzed**: Last 90 days

## Executive Summary

| Resource Type | Total | Active | Unused Candidates | Potential Savings |
|---------------|-------|--------|-------------------|-------------------|
| Logic Apps | {n} | {n} | {n} | {estimate} |
| Service Bus Entities | {n} | {n} | {n} | {estimate} |
| Function Apps | {n} | {n} | {n} | {estimate} |
| APIM APIs | {n} | {n} | {n} | {estimate} |
| Key Vaults | {n} | {n} | {n} | {estimate} |
| Storage Accounts | {n} | {n} | {n} | {estimate} |
| Event Grid Topics | {n} | {n} | {n} | {estimate} |
| Event Hub Namespaces | {n} | {n} | {n} | {estimate} |
| App Config Stores | {n} | {n} | {n} | {estimate} |
| **Total** | {n} | {n} | {n} | {total} |

## Part A: Logic Apps Activity

### Classification Summary
| Category | Count |
|----------|-------|
| Active | {n} |
| Low Activity | {n} |
| Inactive (candidates) | {n} |
| Failing Only | {n} |
| Disabled | {n} |
| **Total** | {n} |

### Dead Flow Candidates

#### High Confidence (Recommend Removal Review)
| Logic App | Resource Group | Last Run | Last Success | State | Recommendation |
|-----------|---------------|----------|--------------|-------|----------------|

#### Medium Confidence (Needs Investigation)
| Logic App | Resource Group | Last Run | Notes | Recommendation |
|-----------|---------------|----------|-------|----------------|

## Part B: Service Bus Unused Entities

| Namespace | Entity | Type | Messages (90d) | Consumers | Recommendation |
|-----------|--------|------|----------------|-----------|----------------|

## Part C: Function Apps

| Function App | Invocations (90d) | State | Runtime | Recommendation |
|--------------|-------------------|-------|---------|----------------|

## Part D: APIM Unused APIs

| Instance | API/Entity | Requests (90d) | Recommendation |
|----------|------------|----------------|----------------|

## Part E: Supporting Services

### Key Vaults
| Vault | API Hits (90d) | Expired Secrets | Recommendation |
|-------|----------------|-----------------|----------------|

### Storage Accounts
| Account | Transactions (90d) | Integration Use | Recommendation |
|---------|-------------------|-----------------|----------------|

### Event Grid Topics
| Topic | Events (90d) | Subscriptions | Recommendation |
|-------|-------------|---------------|----------------|

### Event Hub Namespaces
| Namespace | Messages (90d) | Recommendation |
|-----------|----------------|----------------|

### App Configuration
| Store | Requests (90d) | Recommendation |
|-------|----------------|----------------|

## Cost Impact

Removing unused resources could save:
- Logic Apps: {estimate}
- Service Bus: {estimate} (empty namespaces still incur base cost)
- Function Apps: {estimate} (especially Premium/Dedicated plans)
- APIM: {estimate} (unused APIs on paid tiers)
- Supporting Services: {estimate}
- **Total estimated monthly savings**: {total}

## Next Steps

1. Review candidates with stakeholders
2. Get approval for deletions/downgrades
3. Archive definitions before deleting (export ARM templates)
4. Disable/stop first, wait 30 days, then delete
5. Update documentation
````

### Key Questions to Answer

**Logic Apps:**

- How many Logic Apps have no activity?
- Are there patterns (same project, same environment)?

**Service Bus:**

- Are there namespaces with no entities (paying for nothing)?
- Are there queues no one consumes from?

**Function Apps:**

- Are there stopped apps still on paid plans?
- Are any running deprecated runtimes?

**APIM:**

- Are there APIs with zero traffic?
- Are there unused products or subscriptions?

**Supporting Services:**

- Are Key Vaults being accessed?
- Are Storage Accounts being used or just legacy?
- Are Event Grid/Hub resources receiving any events?

**Cross-Resource:**

- What's the total cost impact of unused resources?
- Are unused resources concentrated in specific resource groups (e.g., dev/test)?

```

---

## Tool Usage Reference

| Resource | Operation | Command |
|----------|-----------|---------|
| Logic Apps | Run history | `az rest --method GET --url ".../workflows/{name}/runs?api-version=2016-06-01"` |
| Service Bus | Queue details | `az servicebus queue show -g {rg} --namespace-name {ns} -n {queue}` |
| Service Bus | Incoming metrics | `az monitor metrics list --resource {id} --metric IncomingMessages` |
| Function Apps | Execution count | `az monitor metrics list --resource {id} --metric FunctionExecutionCount` |
| Function Apps | Runtime config | `az functionapp config show -g {rg} -n {app}` |
| APIM | Request count | `az monitor metrics list --resource {id} --metric TotalRequests` |
| APIM | Per-API logs | `az monitor log-analytics query -w {wsId} --analytics-query "ApiManagementGatewayLogs | ..."` |
| Key Vault | API hits | `az monitor metrics list --resource {id} --metric ServiceApiHit` |
| Storage | Transactions | `az monitor metrics list --resource {id} --metric Transactions` |
| Event Grid | Published events | `az monitor metrics list --resource {id} --metric PublishSuccessCount` |
| Event Hub | Incoming messages | `az monitor metrics list --resource {id} --metric IncomingMessages` |
| App Config | Request count | `az monitor metrics list --resource {id} --metric HttpIncomingRequestCount` |
| Any resource | Tags/metadata | Azure MCP or `az resource show` |
| ADO | Work item search | Azure DevOps MCP (if working) |

**MCP-First Rule**: Always try Logic Apps MCP first for run history. Use `az rest` only as fallback if MCP fails.

---

## Success Criteria

### Logic Apps
- [ ] All Logic Apps classified by activity level
- [ ] Dead flow candidates identified with context

### Service Bus
- [ ] Empty namespaces flagged
- [ ] Queues with zero messages in 90 days identified
- [ ] Topics with no subscriptions flagged

### Function Apps
- [ ] Zero-invocation apps identified
- [ ] Stopped apps flagged
- [ ] Deprecated runtimes detected

### APIM
- [ ] Zero-traffic APIs identified
- [ ] Unused products/subscriptions flagged

### Supporting Services
- [ ] Key Vaults with no access checked
- [ ] Storage accounts with no transactions checked
- [ ] Event Grid topics with no events checked
- [ ] Event Hub namespaces with no throughput checked
- [ ] App Config stores with no requests checked

### Overall
- [ ] Dependencies cross-referenced for all candidates
- [ ] ADO cross-reference attempted
- [ ] Cost impact estimated
- [ ] Recommendations made per resource
- [ ] Report saved
- [ ] Ready for Phase 6
```
