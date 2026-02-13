# Phase 3: Failure Analysis

## Objective

Analyze operational health across ALL integration resources — Logic Apps run history, Service Bus dead-letter queues, Function App execution failures, and APIM error rates — to identify failure patterns, recurring errors, and root causes.

---

## Output Location

Read the client name from the active client config.
All outputs for this phase go to: `/output/{client-name}/{YYYY-MM-DD}/analysis/`
The folder should already exist from Phase 0.

---

## Tool Selection Strategy

> **MCP-First Rule**: Always try MCP tools first. Only fall back to CLI if MCP fails.

### Primary Tools (MCP)

| Operation              | Primary (MCP)  | Fallback (CLI)                   |
| ---------------------- | -------------- | -------------------------------- |
| Logic App run history  | Logic Apps MCP | `az rest` (ARM API)              |
| Logic App run details  | Logic Apps MCP | `az rest` (ARM API)              |
| Logic App action I/O   | Logic Apps MCP | `az rest` (ARM API)              |
| Service Bus DLQ counts | Azure MCP      | `az servicebus queue show`       |
| Service Bus metrics    | Azure MCP      | `az monitor metrics list`        |
| Function App metrics   | Azure MCP      | `az monitor metrics list`        |
| APIM metrics           | Azure MCP      | `az monitor metrics list`        |
| Log Analytics queries  | Azure MCP      | `az monitor log-analytics query` |

### CLI Fallback — Logic Apps REST API Endpoints

| Operation            | REST API Endpoint                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **List Run History** | `GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{name}/runs?api-version=2016-06-01&$filter=status eq 'Failed'`   |
| **Get Run Details**  | `GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{name}/runs/{runId}?api-version=2016-06-01`                      |
| **List Run Actions** | `GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{name}/runs/{runId}/actions?api-version=2016-06-01`              |
| **Get Action I/O**   | `GET /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{name}/runs/{runId}/actions/{actionName}?api-version=2016-06-01` |

### CLI Fallback — Service Bus, Function Apps & APIM

| Operation                                     | Command                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| **SB: Queue runtime info (DLQ counts)**       | `az servicebus queue show --resource-group {rg} --namespace-name {ns} --name {queue}`                                                                                     |
| **SB: Topic subscription runtime**            | `az servicebus topic subscription show --resource-group {rg} --namespace-name {ns} --topic-name {topic} --name {sub}`                                                     |
| **SB: Namespace metrics**                     | `az monitor metrics list --resource {sbNamespaceId} --metric ServerErrors,UserErrors,ThrottledRequests --interval PT1H --start-time {start} --end-time {end}`             |
| **FA: Execution metrics**                     | `az monitor metrics list --resource {functionAppId} --metric FunctionExecutionCount,FunctionExecutionUnits,Http5xx --interval PT1H --start-time {start} --end-time {end}` |
| **FA: Function invocation details**           | `az rest --method GET --url "https://management.azure.com{functionAppId}/functions?api-version=2023-12-01"`                                                               |
| **APIM: Request metrics**                     | `az monitor metrics list --resource {apimId} --metric TotalRequests,FailedRequests,UnauthorizedRequests,Capacity --interval PT1H --start-time {start} --end-time {end}`   |
| **APIM: Requests by API (via Log Analytics)** | `az monitor log-analytics query -w {workspaceId} --analytics-query "ApiManagementGatewayLogs                                                                              | where TimeGenerated > ago(30d) | summarize Total=count(), Failed=countif(ResponseCode >= 400) by ApiId"` |

### Example Commands

**List Failed Runs (last 30 days):**

_Windows (PowerShell):_

```powershell
$START_DATE = (Get-Date).AddDays(-30).ToString("yyyy-MM-ddT00:00:00Z")
az rest --method GET --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{workflow}/runs?api-version=2016-06-01&`$filter=status eq 'Failed' and startTime ge $START_DATE"
```

_Linux/macOS (Bash):_

```bash
START_DATE=$(date -d "30 days ago" +%Y-%m-%dT00:00:00Z 2>/dev/null || date -v-30d +%Y-%m-%dT00:00:00Z)
az rest --method GET \
  --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{workflow}/runs?api-version=2016-06-01&\$filter=status eq 'Failed' and startTime ge $START_DATE"
```

**Tip**: The agent can also calculate the ISO 8601 date directly without shell commands.

**Get Run Details:**

```bash
az rest --method GET \
  --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{workflow}/runs/{runId}?api-version=2016-06-01"
```

**List Actions in a Run:**

```bash
az rest --method GET \
  --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{workflow}/runs/{runId}/actions?api-version=2016-06-01"
```

**Get Action Inputs/Outputs:**

```bash
az rest --method GET \
  --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{workflow}/runs/{runId}/actions/{actionName}?api-version=2016-06-01"
```

**Service Bus DLQ Check:**

```powershell
# Get dead-letter message count for a queue
az servicebus queue show --resource-group {rg} --namespace-name {ns} --name {queue} --query "countDetails.deadLetterMessageCount"
```

**Function App Error Metrics (last 30 days):**

```powershell
$START = (Get-Date).AddDays(-30).ToString("yyyy-MM-ddTHH:mm:ssZ")
$END = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
az monitor metrics list --resource {functionAppId} --metric FunctionExecutionCount,Http5xx --interval P1D --start-time $START --end-time $END
```

**APIM Failed Requests (last 30 days):**

```powershell
$START = (Get-Date).AddDays(-30).ToString("yyyy-MM-ddTHH:mm:ssZ")
$END = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
az monitor metrics list --resource {apimId} --metric TotalRequests,FailedRequests --interval P1D --start-time $START --end-time $END
```

---

## Prerequisites

Before running this prompt:

1. **Required**: Phase 0 (Preflight) and Phase 1 (Discovery) must be complete.
2. Read `/output/{client-name}/{YYYY-MM-DD}/inventory/resources.json` for full resource inventory
3. **Optional enrichment**: If Phase 2 was selected and completed, read its output for deeper context:
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/` — Logic App definitions
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/service-bus-analysis.md` — Service Bus configs
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/function-apps-analysis.md` — Function App configs
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/apim-analysis.md` — APIM configs
     If not available, proceed with inventory data only.
4. Confirm run history period from client config (default: 90 days)
5. Reference `/standards/azure-apis/advisor-recommendations.md` for supplementary findings

---

## Prompt

```
I need to perform Phase 3: Failure Analysis for the Azure Integration Services assessment.

Read the client config to determine:
- Run history analysis period (default: 90 days)
- Failure analysis period (default: 30 days for detailed analysis)

---

## PART A: Logic Apps Failure Analysis

### Step A1: Aggregate Run History

For each Logic App, use Azure REST API to:
- Query run history using: `az rest --method GET --url ".../workflows/{name}/runs?..."`
- Get counts: total runs, succeeded, failed, cancelled
- Calculate failure rate percentage

### Step A2: Identify Top Failing Flows

Rank Logic Apps by:
1. Absolute failure count (descending)
2. Failure rate percentage (for frequently running flows)

Identify the **Top 10** failing Logic Apps for detailed analysis.

### Step A3: Error Pattern Categorization

For the top failing flows, categorize errors:

| Category | Examples |
|----------|----------|
| Connection Failures | Timeout, connection refused, DNS errors |
| Authentication Errors | 401, 403, token expired |
| Data Validation | Schema mismatch, null values, format errors |
| External Service Errors | 500, 502, 503 from APIs |
| Throttling | 429, rate limit exceeded |
| Timeout | Action timeout, workflow timeout |
| Business Logic | Condition failures, data issues |

### Step A4: Root Cause Analysis

For each top failing Logic App:

1. Get sample failed runs (3-5 recent failures)
2. Use `az rest` to get run details: `.../workflows/{name}/runs/{runId}`
3. Identify the failed action from the actions list
4. Use `az rest` to get action I/O: `.../runs/{runId}/actions/{actionName}`
5. Document:
   - Which action failed
   - Error code and message
   - Input that caused the failure
   - Pattern (always fails vs intermittent)

### Step A5: Logic Apps Trend Analysis

Analyze failure trends:
- Are failures increasing or decreasing?
- Are there time-based patterns (peak hours, weekends)?
- Are there correlated failures (multiple flows failing together)?

---

## PART B: Service Bus Health Analysis

### Step B1: Dead-Letter Queue Assessment

For each Service Bus namespace from the inventory:

1. **List all queues and check DLQ counts:**
```

az servicebus queue show --resource-group {rg} --namespace-name {ns} --name {queue}

```
Extract from response:
- `countDetails.deadLetterMessageCount` — messages in DLQ
- `countDetails.activeMessageCount` — messages in main queue
- `countDetails.transferDeadLetterMessageCount` — transfer DLQ count

2. **List all topic subscriptions and check DLQ counts:**
```

az servicebus topic subscription show --resource-group {rg} --namespace-name {ns} --topic-name {topic} --name {sub}

```
Same `countDetails` fields apply.

3. **Flag any queue/subscription with DLQ count > 0** — these represent failed message processing.

### Step B2: Service Bus Error Metrics

For each Service Bus namespace, query Azure Monitor metrics:
```

az monitor metrics list --resource {sbNamespaceId} \
 --metric ServerErrors,UserErrors,ThrottledRequests \
 --interval P1D --start-time {30_days_ago} --end-time {now}

```

Capture:
- **ServerErrors**: Internal Service Bus failures (5xx equivalent)
- **UserErrors**: Client-side errors (bad requests, auth failures, 4xx equivalent)
- **ThrottledRequests**: Rate-limited requests (capacity issues)

### Step B3: Service Bus Root Cause Analysis

For queues/subscriptions with DLQ messages > 0:
1. Document which entity has DLQ buildup
2. Determine the likely cause:
   - **MaxDeliveryCount exhausted**: Message retried too many times → check consuming Logic App/Function for errors
   - **TTL expired**: Message sat in queue too long → check consumer availability
   - **Filter mismatch**: Topic subscription filters rejected messages → check filter rules
3. Cross-reference with Logic Apps that consume these queues — are the consuming flows failing?

### Step B4: Service Bus Summary Table

Produce a summary:

| Namespace | Entity | Type | Active Msgs | DLQ Msgs | Server Errors | Throttled |
|-----------|--------|------|-------------|----------|---------------|-----------|
| {ns} | {queue} | Queue | {n} | {n} | {n} | {n} |
| {ns} | {topic}/{sub} | Subscription | {n} | {n} | {n} | {n} |

---

## PART C: Function Apps Failure Analysis

### Step C1: Function Execution Metrics

For each Function App from the inventory:

```

az monitor metrics list --resource {functionAppId} \
 --metric FunctionExecutionCount,FunctionExecutionUnits,Http5xx,Http4xx \
 --interval P1D --start-time {30_days_ago} --end-time {now}

```

Capture daily totals:
- **FunctionExecutionCount**: Total invocations
- **FunctionExecutionUnits**: Compute consumption (useful for cost context)
- **Http5xx**: Server-side errors (500+)
- **Http4xx**: Client-side errors (400+)

### Step C2: Function-Level Failure Details

If a Function App shows errors, drill into individual functions:

1. **List functions in the app:**
```

az rest --method GET --url "https://management.azure.com{functionAppId}/functions?api-version=2023-12-01"

```

2. **Check Application Insights** (if connected):
Query via Log Analytics workspace:
```

az monitor log-analytics query -w {workspaceId} --analytics-query "
FunctionAppLogs
| where TimeGenerated > ago(30d)
| where Level == 'Error' or Level == 'Warning'
| summarize ErrorCount=count() by FunctionName, Level
| order by ErrorCount desc
"

```

3. If App Insights is NOT connected, note this as a **monitoring gap** (cross-reference with Phase 6).

### Step C3: Function App Error Categorization

Categorize Function App errors:

| Category | Indicators |
|----------|-----------|
| Timeout | FunctionExecutionUnits spike, duration exceeds timeout setting |
| Out of Memory | App restarts, platform errors in logs |
| Dependency Failure | Errors correlating with external service outages |
| Cold Start Issues | Errors concentrated at function startup |
| Configuration | Missing app settings, connection string errors |
| Runtime Errors | Unhandled exceptions, null references |

### Step C4: Function Apps Summary Table

| Function App | Total Invocations | Http 5xx | Http 4xx | Error Rate | Top Error |
|--------------|-------------------|----------|----------|------------|-----------|
| {name} | {n} | {n} | {n} | {%} | {category} |

---

## PART D: API Management Failure Analysis

### Step D1: APIM Request Metrics

For each APIM instance from the inventory:

```

az monitor metrics list --resource {apimId} \
 --metric TotalRequests,SuccessfulRequests,FailedRequests,UnauthorizedRequests,Capacity \
 --interval P1D --start-time {30_days_ago} --end-time {now}

```

Capture daily totals:
- **TotalRequests**: Overall traffic volume
- **SuccessfulRequests**: 2xx responses
- **FailedRequests**: Non-success responses (4xx + 5xx)
- **UnauthorizedRequests**: 401 responses specifically
- **Capacity**: APIM instance utilization (%) — flag if consistently > 80%

### Step D2: Per-API Error Breakdown

If APIM has diagnostic logs in Log Analytics, query per-API errors:

```

az monitor log-analytics query -w {workspaceId} --analytics-query "
ApiManagementGatewayLogs
| where TimeGenerated > ago(30d)
| where ResponseCode >= 400
| summarize
Total=count(),
Client4xx=countif(ResponseCode >= 400 and ResponseCode < 500),
Server5xx=countif(ResponseCode >= 500)
by ApiId, OperationId
| order by Total desc
| take 20
"

```

If Log Analytics is not available, note as a **monitoring gap**.

### Step D3: APIM Error Categorization

| Category | Response Codes | Indicates |
|----------|---------------|-----------|
| Authentication Failures | 401, 403 | Invalid API keys, expired tokens, missing subscriptions |
| Rate Limiting | 429 | Throttling policies triggered, quota exceeded |
| Backend Failures | 502, 503, 504 | Backend services unavailable or timing out |
| Client Errors | 400, 404, 405 | Bad requests, wrong endpoints, missing resources |
| Gateway Errors | 500 | APIM policy errors, transformation failures |
| Capacity Issues | Capacity metric > 80% | Instance undersized for traffic |

### Step D4: APIM Backend Health

Check if APIM backends are healthy:
```

az monitor metrics list --resource {apimId} \
 --metric BackendRequestDuration \
 --interval P1D --start-time {30_days_ago} --end-time {now}

````

Flag backends with:
- Average response time > 5 seconds (slow backends)
- High variance in response times (unstable backends)

### Step D5: APIM Summary Table

| APIM Instance | Total Requests | Failed | Unauthorized | Error Rate | Capacity Avg | Top Error |
|---------------|----------------|--------|--------------|------------|-------------|-----------|
| {name} | {n} | {n} | {n} | {%} | {%} | {category} |

---

## PART E: Cross-Resource Correlation

### Step E1: Dependency Chain Analysis

Identify failure cascades across resources:
1. **Service Bus DLQ → Logic App failures**: If a Logic App consumes from a queue with DLQ messages, are the Logic App failures causing the DLQ buildup or vice versa?
2. **APIM errors → Backend Function App failures**: Do APIM 502/503 errors correlate with Function App Http5xx spikes?
3. **Logic App → Service Bus publish failures**: Are Logic Apps failing when publishing to Service Bus (throttling, auth)?

### Step E2: Timeline Correlation

Compare failure timelines across resources:
- Plot daily failure counts for Logic Apps, Service Bus errors, Function App errors, APIM errors
- Identify days with correlated spikes across multiple resources
- Document any shared root cause (e.g., a network outage, certificate expiry, platform incident)

---

## Output Requirements

Save failure analysis to:
`/output/{client-name}/{YYYY-MM-DD}/analysis/failure-analysis.md`

Structure:
```markdown
# Failure Analysis Report

**Period**: {start_date} to {end_date}
**Total Resources Analyzed**: {n}

## Executive Summary
- Total Logic App failures: {n} ({%} failure rate)
- Service Bus DLQ messages: {n} across {n} entities
- Function App errors: {n} Http 5xx across {n} apps
- APIM failed requests: {n} ({%} of total)
- Top failure category: {category}
- Cross-resource correlations: {description}

## Part A: Logic Apps Run History

### Run History Summary
| Logic App | Total Runs | Succeeded | Failed | Rate |
|-----------|------------|-----------|--------|------|

### Top 10 Failing Logic Apps

#### 1. {Logic App Name}

**Failure Count**: {n}
**Failure Rate**: {%}
**Primary Error**: {error type}

##### Sample Failure Analysis

**Run ID**: {id}
**Timestamp**: {datetime}
**Failed Action**: {action name}
**Error Code**: {code}
**Error Message**:
` ` `
{error message}
` ` `

**Root Cause**: {analysis}
**Recommendation**: {fix}

### Logic Apps Error Pattern Summary
| Category | Count | % of Failures | Primary Flows |
|----------|-------|---------------|---------------|

### Logic Apps Trend Analysis
{trends description}

## Part B: Service Bus Health

### DLQ Summary
| Namespace | Entity | Type | Active Msgs | DLQ Msgs | Likely Cause |
|-----------|--------|------|-------------|----------|--------------|

### Service Bus Metrics Summary
| Namespace | Server Errors | User Errors | Throttled Requests |
|-----------|---------------|-------------|-------------------|

### Service Bus Findings
{findings and root cause analysis}

## Part C: Function Apps Health

### Function App Error Summary
| Function App | Invocations | Http 5xx | Http 4xx | Error Rate |
|--------------|-------------|----------|----------|------------|

### Function-Level Errors
{per-function error details if available from App Insights}

### Function App Findings
{findings and root cause analysis}

## Part D: API Management Health

### APIM Request Summary
| Instance | Total Requests | Failed | Unauthorized | Error Rate | Capacity |
|----------|----------------|--------|--------------|------------|----------|

### Per-API Error Breakdown
| API | Operation | Total Errors | 4xx | 5xx |
|-----|-----------|-------------|-----|-----|

### APIM Findings
{findings and root cause analysis}

## Part E: Cross-Resource Correlations

### Dependency Chain Failures
{description of correlated failures across resources}

### Timeline Analysis
{description of temporal patterns}

## Consolidated Error Pattern Summary
| Category | Logic Apps | Service Bus | Function Apps | APIM | Total |
|----------|-----------|-------------|---------------|------|-------|
| Connection Failures | {n} | {n} | {n} | {n} | {n} |
| Authentication Errors | {n} | {n} | {n} | {n} | {n} |
| Throttling | {n} | {n} | {n} | {n} | {n} |
| Timeout | {n} | {n} | {n} | {n} | {n} |
| Data/Validation | {n} | {n} | {n} | {n} | {n} |
| External Service | {n} | {n} | {n} | {n} | {n} |

## Recommendations
1. {recommendation with priority and affected resources}
````

### Key Questions to Answer

**Logic Apps:**

- Which Logic Apps fail most often?
- What are the most common error types?
- Are failures concentrated in specific flows or widespread?
- Are retry policies helping or exhausted?

**Service Bus:**

- Which queues/subscriptions have DLQ buildup?
- Is there throttling indicating capacity issues?
- Are consuming applications processing messages successfully?

**Function Apps:**

- Which Function Apps have the highest error rates?
- Are errors related to dependencies or internal code issues?
- Are there cold start or timeout patterns?

**APIM:**

- What percentage of API requests are failing?
- Are failures concentrated in specific APIs or widespread?
- Are backend services or policies causing errors?
- Is APIM capacity sufficient for the traffic?

**Cross-Resource:**

- Are there failure cascades between connected resources?
- Do failures correlate temporally across resources?
- Is there a single root cause affecting multiple services?

```

---

## Tool Usage Reference

| Resource | Operation | Command |
|----------|-----------|---------|
| Logic Apps | List failed runs | `az rest --method GET --url ".../workflows/{name}/runs?$filter=status eq 'Failed'"` |
| Logic Apps | Get run details | `az rest --method GET --url ".../workflows/{name}/runs/{runId}"` |
| Logic Apps | List run actions | `az rest --method GET --url ".../workflows/{name}/runs/{runId}/actions"` |
| Logic Apps | Get action I/O | `az rest --method GET --url ".../workflows/{name}/runs/{runId}/actions/{action}"` |
| Service Bus | Queue DLQ count | `az servicebus queue show -g {rg} --namespace-name {ns} -n {queue}` |
| Service Bus | Subscription DLQ count | `az servicebus topic subscription show -g {rg} --namespace-name {ns} --topic-name {topic} -n {sub}` |
| Service Bus | Error metrics | `az monitor metrics list --resource {id} --metric ServerErrors,UserErrors,ThrottledRequests` |
| Function Apps | Execution metrics | `az monitor metrics list --resource {id} --metric FunctionExecutionCount,Http5xx,Http4xx` |
| Function Apps | Function-level errors | `az monitor log-analytics query -w {wsId} --analytics-query "FunctionAppLogs | ..."` |
| APIM | Request metrics | `az monitor metrics list --resource {id} --metric TotalRequests,FailedRequests,Capacity` |
| APIM | Per-API errors | `az monitor log-analytics query -w {wsId} --analytics-query "ApiManagementGatewayLogs | ..."` |
| APIM | Backend latency | `az monitor metrics list --resource {id} --metric BackendRequestDuration` |

**MCP-First Rule**: Always try Logic Apps MCP first for run history and action details. Use `az rest` only as fallback if MCP fails.

---

## Success Criteria

### Logic Apps
- [ ] Run history queried for all Logic Apps
- [ ] Failure counts aggregated
- [ ] Top 10 failing flows identified
- [ ] Root cause analysis for top failures (3-5 sample runs each)
- [ ] Error categories documented
- [ ] Trends analyzed

### Service Bus
- [ ] DLQ message counts checked for all queues and subscriptions
- [ ] Namespace error metrics queried (ServerErrors, UserErrors, ThrottledRequests)
- [ ] Root cause analysis for entities with DLQ buildup
- [ ] Cross-referenced with consuming Logic Apps/Functions

### Function Apps
- [ ] Execution metrics queried for all Function Apps
- [ ] Error rates calculated (Http5xx, Http4xx)
- [ ] Function-level errors investigated (via App Insights if available)
- [ ] Missing App Insights flagged as monitoring gap

### API Management
- [ ] Request metrics queried for all APIM instances
- [ ] Per-API error breakdown obtained (if Log Analytics available)
- [ ] Backend health assessed
- [ ] Capacity utilization checked

### Cross-Resource
- [ ] Dependency chain failures identified
- [ ] Timeline correlation analyzed
- [ ] Consolidated error pattern summary produced

### Report
- [ ] Failure analysis report saved to `/output/{client-name}/{YYYY-MM-DD}/analysis/failure-analysis.md`
- [ ] Recommendations provided with priority and affected resources
- [ ] Ready for Phase 4
```
