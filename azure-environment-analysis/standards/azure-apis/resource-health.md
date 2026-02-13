# Azure Resource Health

This document describes how to query Azure Resource Health for availability and issue detection.

---

## Overview

Azure Resource Health provides:
- **Current health status** – Is the resource available now?
- **Historical health** – Past availability issues
- **Root cause analysis** – Platform-side vs. user-initiated events
- **Health alerts** – Proactive notifications

---

## Querying Resource Health

### Azure Resource Graph - Current Health Status

```kql
resourcehealthresources
| where type == 'microsoft.resourcehealth/availabilitystatuses'
| extend
    availabilityState = tostring(properties.availabilityState),
    summary = tostring(properties.summary),
    reasonType = tostring(properties.reasonType),
    resourceId = tostring(id)
| project resourceId, availabilityState, summary, reasonType
| where availabilityState != 'Available'
```

### All Resources Health Summary

```kql
resources
| project resourceId = id, resourceType = type, resourceGroup, subscriptionId
| join kind=leftouter (
    resourcehealthresources
    | where type == 'microsoft.resourcehealth/availabilitystatuses'
    | extend
        availabilityState = tostring(properties.availabilityState),
        summary = tostring(properties.summary)
    | project resourceId = tostring(properties.targetResourceId), availabilityState, summary
) on resourceId
| summarize count() by availabilityState
```

### Integration Resources Health

```kql
resources
| where type in (
    'microsoft.web/sites',
    'microsoft.logic/workflows',
    'microsoft.servicebus/namespaces',
    'microsoft.apimanagement/service',
    'microsoft.keyvault/vaults',
    'microsoft.storage/storageaccounts'
)
| project resourceId = id, name, type, resourceGroup
| join kind=leftouter (
    resourcehealthresources
    | where type == 'microsoft.resourcehealth/availabilitystatuses'
    | extend
        availabilityState = tostring(properties.availabilityState),
        summary = tostring(properties.summary),
        reasonType = tostring(properties.reasonType)
    | project resourceId = tostring(properties.targetResourceId), availabilityState, summary, reasonType
) on resourceId
| project name, type, resourceGroup, availabilityState, summary, reasonType
| where availabilityState != 'Available' or isnull(availabilityState)
```

### Health by Availability State

```kql
resourcehealthresources
| where type == 'microsoft.resourcehealth/availabilitystatuses'
| extend availabilityState = tostring(properties.availabilityState)
| summarize count() by availabilityState
```

---

## Availability States

| State | Meaning | Action |
|-------|---------|--------|
| **Available** | Resource is healthy | None |
| **Unavailable** | Platform detected resource is not working | Investigate, may need support ticket |
| **Degraded** | Resource is partially available | Check specific functionality |
| **Unknown** | Health status not determined | May be transient, check later |

---

## Reason Types

| Reason Type | Meaning |
|-------------|---------|
| **PlatformInitiated** | Azure platform issue (not customer action) |
| **UserInitiated** | Customer action caused state change (restart, etc.) |
| **Unknown** | Cause not determined |

---

## Using Azure CLI

```bash
# Get availability status for a specific resource
az resource show --ids <resource-id> --query properties.availabilityState

# List availability statuses using REST API via CLI
az rest --method get \
  --url "https://management.azure.com/subscriptions/{subscription-id}/providers/Microsoft.ResourceHealth/availabilityStatuses?api-version=2020-05-01"
```

---

## Using Azure MCP Server

The Azure MCP Server provides access to Resource Health through the `resourcehealth` tool:

```
# Tool: mcp_azure_mcp_ser_resourcehealth
# Use this tool to query resource health status
```

---

## Historical Health Events

### Query Past 30 Days

```kql
resourcehealthresources
| where type == 'microsoft.resourcehealth/events'
| extend
    eventType = tostring(properties.eventType),
    status = tostring(properties.status),
    impactStartTime = todatetime(properties.impactStartTime),
    impactEndTime = todatetime(properties.impactMitigationTime),
    title = tostring(properties.title)
| where impactStartTime > ago(30d)
| project eventType, status, impactStartTime, impactEndTime, title
| order by impactStartTime desc
```

---

## Service Health vs Resource Health

| Aspect | Resource Health | Service Health |
|--------|-----------------|----------------|
| Scope | Individual resources | Azure services/regions |
| Use case | "Is my resource working?" | "Is Azure having issues?" |
| Query | `resourcehealthresources` | `servicehealthresources` |

### Query Service Health Issues

```kql
servicehealthresources
| where type == 'microsoft.resourcehealth/events'
| extend
    eventType = tostring(properties.eventType),
    status = tostring(properties.status),
    impactedServices = properties.impact,
    title = tostring(properties.title)
| project eventType, status, title, impactedServices
```

---

## Reporting Format

```markdown
## Resource Health Assessment

### Current Health Summary

| Status | Count | Percentage |
|--------|-------|------------|
| Available | 58 | 97% |
| Unavailable | 1 | 2% |
| Degraded | 0 | 0% |
| Unknown | 1 | 2% |

### Resources Not Available

| Resource | Type | Status | Summary | Reason |
|----------|------|--------|---------|--------|
| func-legacy-001 | Function App | Unavailable | App is stopped | UserInitiated |
| logic-old-sync | Logic App | Unknown | Health check pending | Unknown |

### Health Status by Resource Type

| Resource Type | Available | Unavailable | Unknown |
|---------------|-----------|-------------|---------|
| Logic App | 25 | 0 | 1 |
| Function App | 12 | 1 | 0 |
| Service Bus | 5 | 0 | 0 |
| Storage Account | 10 | 0 | 0 |
| Key Vault | 4 | 0 | 0 |
| APIM | 2 | 0 | 0 |

### Recent Health Events (Past 30 Days)

| Date | Resource | Event Type | Duration | Root Cause |
|------|----------|------------|----------|------------|
| 2026-01-28 | sb-ps-common-prod | Degraded | 15 min | PlatformInitiated |
| 2026-01-15 | func-001-crm-orders-prod | Unavailable | 5 min | UserInitiated (restart) |

### Service Health Incidents (Past 30 Days)

| Date | Service | Region | Impact |
|------|---------|--------|--------|
| 2026-01-20 | Azure Logic Apps | West Europe | Delayed triggers |
```

---

## Integration with Assessment

During the assessment:

1. **Phase 1 (Discovery)**: Record current health status of all resources
2. **Phase 3 (Failure Analysis)**: Cross-reference failures with health events
3. **Phase 5 (Dead Flow Detection)**: Unavailable status may indicate dead resources
4. **Phase 6 (Monitoring Gaps)**: Check for health alert rules

---

## Health Alerts

Check if health alerts are configured:

```kql
resources
| where type == 'microsoft.insights/activitylogalerts'
| where properties.condition.allOf has 'ResourceHealth'
| extend
    name = name,
    scopes = properties.scopes,
    enabled = properties.enabled
| project name, scopes, enabled
```

---

## Notes

- Resource Health is free for all Azure resources
- Historical data is retained for up to 30 days
- Some resource types have limited health monitoring
- PlatformInitiated events may entitle SLA credits
- Use health alerts for proactive monitoring
