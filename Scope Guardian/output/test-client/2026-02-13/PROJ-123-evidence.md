# Evidence Collection

## Issue Details

**Source**: Jira  
**Key**: PROJ-123  
**URL**: https://example.atlassian.net/browse/PROJ-123  
**Type**: Bug (reported)  
**Status**: Open  
**Reporter**: john.doe@company.com  
**Created**: 2026-02-10

### Reported Problem

> Orders from the web shop are not appearing in the ERP system in real-time. There's approximately a 15-minute delay between order placement and ERP visibility.

### Expected Behavior (per reporter)

> Orders should appear in ERP immediately after customer completes checkout.

---

## Requirements Search

### Search Attempts

| Location             | Search Terms        | Results        |
| -------------------- | ------------------- | -------------- |
| Confluence INT space | "order sync"        | 3 pages found  |
| Confluence INT space | "real-time orders"  | 0 pages        |
| ADO Work Items       | "order integration" | 2 closed items |

### Documents Found

#### 1. Order Sync Integration Spec (Primary)

**URL**: https://example.atlassian.net/wiki/spaces/INT/pages/123  
**Status**: Approved (2025-11-20)  
**Author**: Jane Smith

**Relevant Quotes**:

> Section 3.1 - Polling Strategy:
> "The Order Sync integration SHALL poll the source system every 15 minutes to retrieve new orders. This interval was chosen to balance system load with acceptable latency."

> Section 3.2 - Performance Requirements:
> "Orders SHALL be visible in the target system within 20 minutes of placement under normal conditions."

---

## Implementation Verification

### Resource: la-order-sync-prod

**Type**: Logic App (Consumption)  
**Resource Group**: rg-integration-prod  
**Location**: West Europe

#### Trigger Configuration

```json
{
  "type": "Recurrence",
  "recurrence": {
    "frequency": "Minute",
    "interval": 15
  }
}
```

#### Recent Run History

| Run ID | Start Time          | Status    | Duration |
| ------ | ------------------- | --------- | -------- |
| abc123 | 2026-02-13 09:45:00 | Succeeded | 12s      |
| def456 | 2026-02-13 09:30:00 | Succeeded | 14s      |
| ghi789 | 2026-02-13 09:15:00 | Succeeded | 11s      |

**Success Rate (24h)**: 98.5% (142/144 runs)

---

## Conclusion

Implementation matches specification. The 15-minute delay is **by design**.
