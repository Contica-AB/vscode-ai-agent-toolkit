# Dead Flow Detection Report

**Client**: Acontico Dev  
**Date**: 2026-02-12  
**Analysis Period**: Last 90 days

---

## Executive Summary

**All 3 Logic Apps (100%)** in the assessment scope show no execution activity in the analysis period. These workflows are candidates for decommissioning or require clarification of their business purpose.

---

## Dead Flow Criteria

A workflow is classified as a "dead flow" if it meets ANY of these criteria:

| Criteria             | Threshold |
| -------------------- | --------- |
| Zero successful runs | 90+ days  |
| Only failed runs     | 30+ days  |
| Disabled state       | 90+ days  |
| No trigger activity  | 90+ days  |

---

## Dead Flow Analysis

### Summary Table

| Logic App                   | State   | Runs (90d) | Last Success | Classification |
| --------------------------- | ------- | ---------- | ------------ | -------------- |
| demo-upload-webinar-la      | Enabled | 0          | Never        | 🔴 Dead Flow   |
| demo-webinar-la             | Enabled | 0          | Never        | 🔴 Dead Flow   |
| cosi-member-adobe-dev-logic | Enabled | 0          | Never        | 🔴 Dead Flow   |

---

## Individual Analysis

### 1. demo-upload-webinar-la

| Property            | Value                             |
| ------------------- | --------------------------------- |
| **Resource Group**  | rg-demo-webinar                   |
| **State**           | Enabled                           |
| **Created**         | 2024-09-16                        |
| **Last Modified**   | 2024-09-17                        |
| **Runs in 90 Days** | 0                                 |
| **Trigger Type**    | Service Bus Queue (faktura-queue) |

**Analysis**:

- Workflow is enabled but has never run
- Trigger depends on Service Bus queue `faktura-queue`
- Either the queue has no messages OR the queue doesn't exist

**Recommendation**:

- ⚠️ Verify if `faktura-queue` exists and has messages
- If the workflow is no longer needed, disable or delete it
- Consider cost: Enabled Logic Apps may incur minimal charges

---

### 2. demo-webinar-la

| Property            | Value                      |
| ------------------- | -------------------------- |
| **Resource Group**  | rg-demo-webinar            |
| **State**           | Enabled                    |
| **Created**         | 2024-06-10                 |
| **Last Modified**   | 2024-09-16                 |
| **Runs in 90 Days** | 0                          |
| **Trigger Type**    | Blob Storage (file update) |

**Analysis**:

- Workflow is enabled but has never run
- Trigger monitors `/fakturor-sftp` container for file updates
- No files have been uploaded to trigger this workflow

**Recommendation**:

- ⚠️ Verify if the blob container is being used
- If this is a demo workflow, consider moving to a sandbox subscription
- If no longer needed, disable or delete it

---

### 3. cosi-member-adobe-dev-logic

| Property            | Value                              |
| ------------------- | ---------------------------------- |
| **Resource Group**  | cosi-member-adobe-0073.i001-dev-rg |
| **State**           | Enabled                            |
| **Created**         | 2025-01-22                         |
| **Last Modified**   | 2025-01-22                         |
| **Runs in 90 Days** | 0                                  |
| **Trigger Type**    | HTTP Request                       |

**Analysis**:

- Recently created (January 2025) but never triggered
- HTTP trigger requires manual invocation
- Workflow appears incomplete (no output action)

**Recommendation**:

- ⚠️ This appears to be development-in-progress work
- Contact creator to determine status
- If abandoned, consider disabling or deleting

---

## Business Impact Assessment

| Impact Level            | Logic Apps                              |
| ----------------------- | --------------------------------------- |
| **Low Risk to Disable** | demo-upload-webinar-la, demo-webinar-la |
| **Clarify First**       | cosi-member-adobe-dev-logic             |

### Low Risk to Disable

- `demo-*` naming suggests these are demonstration/test workflows
- Both are in `rg-demo-webinar` resource group
- Safe to disable after confirmation with stakeholders

### Clarify First

- `cosi-member-adobe-dev-logic` references a specific integration (Adobe)
- Resource group naming suggests a client project
- Should confirm with the development team before any action

---

## Cost Impact

| Logic App                   | SKU         | Estimated Monthly Cost (Idle) |
| --------------------------- | ----------- | ----------------------------- |
| demo-upload-webinar-la      | Consumption | $0 (no runs)                  |
| demo-webinar-la             | Consumption | $0 (no runs)                  |
| cosi-member-adobe-dev-logic | Consumption | $0 (no runs)                  |

**Note**: Consumption Logic Apps only incur charges when executed. These idle workflows have $0 cost.

---

## Recommendations

### Immediate Actions

1. **Validate Business Need**: Contact workflow owners to confirm if these are still needed
2. **Document Purpose**: Add descriptions to each workflow explaining their intended use

### If Workflows Are Not Needed

| Action                        | Priority   |
| ----------------------------- | ---------- |
| Disable workflows             | Immediate  |
| Delete after 30-day retention | Short-term |
| Document decommissioning      | Same time  |

### If Workflows Are Needed

| Action                        | Priority   |
| ----------------------------- | ---------- |
| Complete workflow development | Immediate  |
| Add monitoring and alerting   | Short-term |
| Schedule regular testing      | Ongoing    |

---

## Questions for Stakeholders

1. What is the business purpose of the `demo-*` workflows?
2. Are these workflows intended for production use?
3. Who is responsible for the `cosi-member-adobe` integration?
4. Should these workflows be moved to a sandbox subscription?
5. What is the expected timeline for completion/deployment?

---

## Related Findings

- **Security**: `cosi-member-adobe-dev-logic` has an unauthenticated HTTP trigger (HIGH severity)
- **Completeness**: `cosi-member-adobe-dev-logic` appears to be an incomplete workflow

---

_Generated: 2026-02-12_
