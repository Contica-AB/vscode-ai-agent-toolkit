# Phase 6: Monitoring & Observability Gaps

## Objective

Identify resources lacking proper monitoring, alerting, and observability configuration.

---

## Output Location

Read the client name from the active client config.
All outputs for this phase go to: `/output/{client-name}/{YYYY-MM-DD}/analysis/`
The folder should already exist from Phase 0.

---

## Prerequisites

Before running this prompt:

1. **Required**: Phase 0 (Preflight) and Phase 1 (Discovery) must be complete.
   **Optional enrichment**: If Phases 2-5 were selected and completed, read their outputs for deeper context. If not available, proceed with inventory data only.
2. Have the inventory available from `/output/{client-name}/{YYYY-MM-DD}/inventory/`
3. Know the Log Analytics workspace(s) in use
4. Note the client's `monitoringPlatform` setting from config
5. Read `/standards/contica-ssot/known-exceptions.md` for accepted monitoring gaps
6. Read `/standards/azure-apis/resource-health.md` for resource health queries
7. **Use Microsoft Docs MCP** to fetch Azure CAF/WAF monitoring guidance:
   - Search: "Azure Cloud Adoption Framework management and monitoring"
   - Search: "Azure Well-Architected Framework operational excellence monitoring"
   - Include CAF/WAF links as supporting tips alongside SSOT findings

---

## Monitoring Platform Handling

Check the client config `monitoringPlatform` field:

| Value          | Behavior                                                                          |
| -------------- | --------------------------------------------------------------------------------- |
| `AzureMonitor` | Full analysis of all Azure native monitoring (default)                            |
| `nodinite`     | Skip App Insights, diagnostic settings checks — document "Monitored via Nodinite" |
| `other`        | Document third-party monitoring tool, recommend verifying coverage manually       |

**If `monitoringPlatform` is `nodinite`:**

- Do NOT flag missing diagnostic settings as gaps
- Do NOT flag missing App Insights as gaps
- Document: "Client uses Nodinite for integration monitoring. Native Azure monitoring skipped."
- Still check for Service Bus DLQ alerts (these are often separate)
- Still verify Key Vault audit logs (security requirement)

---

## Prompt

````
I need to perform Phase 6: Monitoring & Observability Gaps analysis for the Azure Integration Services assessment.

### Step 1: Diagnostic Settings Audit

For EACH integration resource in the inventory, check:

1. **Does the resource have diagnostic settings?**
   - Use Azure MCP to query diagnostic settings
   - Record: Yes/No

2. **If yes, where are logs sent?**
   - Log Analytics Workspace (preferred)
   - Storage Account (acceptable for archival)
   - Event Hub (for SIEM integration)
   - None configured (gap)

3. **Which log categories are enabled?**
   - For Logic Apps: WorkflowRuntime
   - For Service Bus: OperationalLogs
   - For Key Vault: AuditEvent (critical!)
   - For APIM: GatewayLogs
   - For Event Grid: DeliveryFailures, PublishFailures
   - For Event Hub: OperationalLogs, ArchiveLogs
   - For App Configuration: HttpRequest, Audit

4. **What's the retention policy?**
   - Check retention days configured
   - Flag if < 30 days

### Step 2: Log Analytics Assessment

If there's a Log Analytics workspace:
- List all workspaces in scope
- Check which integration resources send logs to each
- Identify resources NOT sending logs
- Check query performance (any issues?)

### Step 3: Application Insights Check

For resources that support Application Insights:
- **Function Apps**: Is App Insights connected?
- **Logic Apps Standard**: Is App Insights configured?
- **APIM**: Is App Insights integration enabled?

Record:
- Connected: Yes/No
- Instrumentation Key or Connection String configured
- Sampling settings

### Step 4: Alert Rules Inventory

List all alert rules related to integration resources:

**Expected Alerts**:
| Resource Type | Alert | Criticality |
|---------------|-------|-------------|
| Logic Apps | Failed runs | High |
| Logic Apps | Run latency | Medium |
| Service Bus | Dead-letter queue size | High |
| Service Bus | Active messages threshold | Medium |
| Service Bus | Throttled requests | Medium |
| Key Vault | Access denied events | High |
| Function Apps | Error rate | High |
| Function Apps | Execution timeout | Medium |
| APIM | 5xx response rate | High |
| APIM | Capacity > 80% | Medium |
| Event Grid | Delivery failures | High |
| Event Grid | Dropped events | Medium |
| Event Hub | Throttled requests | High |
| Event Hub | Incoming messages threshold | Medium |

Check:
- Which expected alerts exist?
- What are the thresholds?
- Who receives notifications?
- Are alert rules enabled?

### Step 5: Dashboard Assessment

Check for Azure Dashboards:
- Are there dashboards for integration monitoring?
- What metrics are displayed?
- Are they up to date?
- Who has access?

### Step 6: Azure CAF / WAF Alignment

Use Microsoft Docs MCP to cross-reference monitoring gaps with Microsoft guidance:
- Search: "Azure CAF management and monitoring best practices"
- Search: "Azure WAF operational excellence observability"
- For each gap, include a **"Microsoft Recommendation"** tip with the relevant CAF/WAF guidance
- Note where Contica SSOT aligns with or extends beyond CAF recommendations

**Important**: CAF/WAF guidance supplements SSOT — it does not replace it.

### Step 7: Gap Identification

Create a gap analysis:

| Gap Type | Description | Impact |
|----------|-------------|--------|
| No diagnostics | Resources without diagnostic settings | Blind spot |
| Wrong destination | Logs to storage only (not queryable) | Slow troubleshooting |
| Missing alerts | No failure notifications | Delayed response |
| No App Insights | Missing APM data | No performance insights |

### Step 8: Check Known Exceptions

Read `/standards/contica-ssot/known-exceptions.md` and filter findings:

**For each identified gap:**
1. Check if it's listed as a known/accepted exception
2. If exception exists, note it but don't count as a gap
3. Document exception reason from the SSOT

**Examples of known exceptions:**
- Diagnostic settings may not apply to certain legacy resource types
- Some third-party monitoring tools don't require native Azure diagnostics
- Specific resources may have documented exemptions

### Output Requirements

Save monitoring gaps report:
`/output/{client-name}/{YYYY-MM-DD}/analysis/monitoring-gaps.md`

Structure:
```markdown
# Monitoring & Observability Gaps Report

**Date**: {date}

## Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| Resources with Diagnostic Settings | {n} | {%} |
| Resources sending to Log Analytics | {n} | {%} |
| Resources with App Insights | {n} | {%} |
| Alert Rules Configured | {n} | — |

**Overall Observability Score**: {X}/100

## Diagnostic Settings Coverage

### By Resource Type

| Resource Type | Total | With Diagnostics | Gap |
|---------------|-------|------------------|-----|
| Logic Apps | {n} | {n} | {n} |
| Service Bus | {n} | {n} | {n} |
| Key Vault | {n} | {n} | {n} |
| Function Apps | {n} | {n} | {n} |
| APIM | {n} | {n} | {n} |
| Storage | {n} | {n} | {n} |
| Event Grid | {n} | {n} | {n} |
| Event Hub | {n} | {n} | {n} |
| App Configuration | {n} | {n} | {n} |

### Resources Missing Diagnostic Settings

| Resource | Type | Resource Group | Impact |
|----------|------|----------------|--------|
| {name} | Logic App | {rg} | ⚠️ Cannot troubleshoot |

### Log Destinations

| Destination | Resources | Notes |
|-------------|-----------|-------|
| Log Analytics: {workspace} | {n} | Primary |
| Storage Account: {account} | {n} | Archival only |
| Not Configured | {n} | **Gap** |

## Application Insights Coverage

| Resource | Type | App Insights | Status |
|----------|------|--------------|--------|
| func-orders | Function App | ✅ Connected | OK |
| logic-standard-app | Logic App Standard | ❌ Missing | Gap |

## Alert Rules Assessment

### Existing Alerts

| Alert Name | Resource | Metric | Threshold | Notification |
|------------|----------|--------|-----------|--------------|
| {name} | {resource} | {metric} | {value} | {email/action group} |

### Missing Critical Alerts

| Expected Alert | Resource(s) | Severity | Recommendation |
|----------------|-------------|----------|----------------|
| Logic App Failures | All Logic Apps | High | Create metric alert |
| Key Vault Access Denied | kv-integration | Critical | Create log alert |

## Recommendations

### High Priority

1. **Enable diagnostic settings on {n} resources**
   - Resources: {list}
   - Send to: {log analytics workspace}
   - Effort: Low (ARM template available)

2. **Create failure alerts for Logic Apps**
   - Coverage: All production Logic Apps
   - Threshold: > 3 failures in 15 minutes
   - Action: Email + Teams notification

### Medium Priority

1. **Configure Application Insights for Standard Logic Apps**
2. **Add Service Bus DLQ monitoring**

### Low Priority

1. **Create operational dashboards**
2. **Set up log retention policies**

## Implementation Checklist

- [ ] Enable diagnostics on {n} resources
- [ ] Configure Log Analytics workspace
- [ ] Create alert rules ({n} needed)
- [ ] Set up action groups for notifications
- [ ] Connect App Insights to Function Apps
- [ ] Create monitoring dashboard
````

````

---

## Tool Usage Reference

| Operation | Primary (MCP) | Fallback (CLI) |
|-----------|---------------|----------------|
| Diagnostic settings | Azure MCP | `az monitor diagnostic-settings list --resource {id}` |
| Alert rules | Azure MCP | `az monitor alert list` |
| Log Analytics | Azure MCP | `az monitor log-analytics workspace` |
| App Insights | Azure MCP | `az monitor app-insights component show` |

**MCP-First Rule**: Use Azure MCP as primary tool for all monitoring queries. Fall back to CLI if MCP fails.

---

## KQL Query for Coverage Check

```kql
// See /scripts/resource-graph-queries/monitoring-coverage.kql
resources
| where type in~ (
    'microsoft.logic/workflows',
    'microsoft.servicebus/namespaces',
    'microsoft.keyvault/vaults',
    'microsoft.web/sites',
    'microsoft.apimanagement/service',
    'microsoft.eventgrid/topics',
    'microsoft.eventhub/namespaces',
    'microsoft.appconfiguration/configurationstores'
)
| extend hasDiagnostics = isnotnull(properties.diagnosticSettings)
| summarize count() by type, hasDiagnostics
````

---

## Success Criteria

- [ ] All resources checked for diagnostic settings
- [ ] Log Analytics coverage documented
- [ ] App Insights coverage checked
- [ ] Alert rules inventoried
- [ ] Gaps identified and prioritized
- [ ] Recommendations provided
- [ ] Report saved
- [ ] Ready for Phase 7
