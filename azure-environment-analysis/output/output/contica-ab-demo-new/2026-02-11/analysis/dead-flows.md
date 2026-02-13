# Dead Flow Detection Report

**Assessment Date:** 2026-02-11  
**Client:** Contica AB DEMO new  
**Subscriptions Analyzed:** AIS Platform Dev, AIS Platform Prod

---

## Executive Summary

| Metric                    | Value |
| ------------------------- | ----- |
| **Total Logic Apps**      | 3     |
| **Confirmed Dead Flows**  | 3     |
| **Disabled Flows**        | 0     |
| **Enabled but Never Run** | 3     |

**Finding:** All 3 Logic Apps in scope are classified as "dead flows" — they are enabled but have no run history in the assessment period (90 days).

---

## Dead Flow Criteria

A Logic App is classified as a "dead flow" if it meets any of these criteria:

| Criteria               | Description                         |
| ---------------------- | ----------------------------------- |
| Zero runs in 90 days   | No successful or failed runs at all |
| Only failed runs       | Never succeeds, always fails        |
| Disabled + No activity | Disabled and no runs in 90+ days    |
| No trigger activity    | Trigger never fires                 |

---

## Dead Flow Inventory

### 1. demo-webinar-la

| Attribute               | Value           |
| ----------------------- | --------------- |
| **Resource Group**      | rg-demo-webinar |
| **State**               | Enabled         |
| **Last Modified**       | 2024-09-16      |
| **Trigger Type**        | HTTP Request    |
| **Runs (Last 90 Days)** | 0               |
| **Classification**      | Dead Flow       |

**Analysis:**

- Logic App is enabled but has never been triggered
- HTTP trigger means it requires external calls to execute
- Last modified over 1 year ago (stale)
- No ADO work items found referencing this flow

**Recommendation:** Candidate for decommissioning or archival

---

### 2. demo-upload-webinar-la

| Attribute               | Value           |
| ----------------------- | --------------- |
| **Resource Group**      | rg-demo-webinar |
| **State**               | Enabled         |
| **Last Modified**       | 2024-09-17      |
| **Trigger Type**        | HTTP Request    |
| **Runs (Last 90 Days)** | 0               |
| **Classification**      | Dead Flow       |

**Analysis:**

- Logic App is enabled but has never been triggered
- Appears to be a demo or proof-of-concept workflow
- Last modified over 1 year ago (stale)
- Related to demo-webinar-la (same resource group, similar naming)

**Recommendation:** Candidate for decommissioning or archival

---

### 3. cosi-member-adobe-dev-logic

| Attribute               | Value                              |
| ----------------------- | ---------------------------------- |
| **Resource Group**      | cosi-member-adobe-0073.i001-dev-rg |
| **State**               | Enabled                            |
| **Last Modified**       | 2025-01-22                         |
| **Trigger Type**        | HTTP Request                       |
| **Runs (Last 90 Days)** | 0                                  |
| **Classification**      | Dead Flow (Development)            |

**Analysis:**

- Logic App is enabled but has never been triggered
- More recently modified than the demo flows
- Naming suggests this is a DEV environment workflow
- May be actively under development but not yet integrated

**Recommendation:** Verify with development team if still in active development

---

## Dependency Analysis

### Are Any Dead Flows Referenced by Active Flows?

| Dead Flow                   | Referenced By                | Status                      |
| --------------------------- | ---------------------------- | --------------------------- |
| demo-webinar-la             | None                         | No dependencies             |
| demo-upload-webinar-la      | demo-webinar-la (calls this) | Self-referencing dead group |
| cosi-member-adobe-dev-logic | None                         | No dependencies             |

**Finding:** demo-webinar-la calls demo-upload-webinar-la via HTTP action. Both are dead flows, indicating the entire demo is unused.

---

## Cost Analysis

| Resource                    | Monthly Est. Cost | Annual Est. Cost |
| --------------------------- | ----------------- | ---------------- |
| demo-webinar-la             | $0 (no runs)      | $0               |
| demo-upload-webinar-la      | $0 (no runs)      | $0               |
| cosi-member-adobe-dev-logic | $0 (no runs)      | $0               |
| **Total**                   | **$0**            | **$0**           |

**Note:** Consumption Logic Apps have no standing cost when not running. However, they:

- Clutter the environment
- Create security attack surface (HTTP triggers are publicly accessible)
- Require governance effort

---

## Recommendations

### Immediate Actions

| #   | Action                                                         | Priority |
| --- | -------------------------------------------------------------- | -------- |
| 1   | Confirm demo-webinar flows are no longer needed                | High     |
| 2   | Disable HTTP triggers on unused flows to reduce attack surface | High     |

### Short Term Actions

| #   | Action                                                | Timeline       |
| --- | ----------------------------------------------------- | -------------- |
| 3   | Archive workflow definitions before deletion          | 1-2 weeks      |
| 4   | Delete confirmed dead flows                           | After archival |
| 5   | Verify cosi-member-adobe-dev-logic development status | 1 week         |

### Proposed Cleanup

```bash
# Step 1: Export workflow definitions for archival
az logic workflow show --name demo-webinar-la --resource-group rg-demo-webinar > demo-webinar-la-backup.json
az logic workflow show --name demo-upload-webinar-la --resource-group rg-demo-webinar > demo-upload-webinar-la-backup.json

# Step 2: Disable instead of delete (reversible)
az logic workflow update --name demo-webinar-la --resource-group rg-demo-webinar --state Disabled
az logic workflow update --name demo-upload-webinar-la --resource-group rg-demo-webinar --state Disabled

# Step 3: After validation period, delete
# az logic workflow delete --name demo-webinar-la --resource-group rg-demo-webinar
```

---

## ADO Cross-Reference

**Search Performed:** Queried Azure DevOps for work items referencing these Logic Apps.

| Logic App                   | Work Items Found | Notes                   |
| --------------------------- | ---------------- | ----------------------- |
| demo-webinar-la             | 0                | No documentation in ADO |
| demo-upload-webinar-la      | 0                | No documentation in ADO |
| cosi-member-adobe-dev-logic | 0                | No documentation in ADO |

**Conclusion:** No ADO work items reference these flows, suggesting:

- They are undocumented proof-of-concepts
- They may have been created for demos or testing
- Safe to decommission after team confirmation

---

## Risk Assessment

| Risk                         | Level  | Mitigation                             |
| ---------------------------- | ------ | -------------------------------------- |
| Deleting actively used flow  | LOW    | No runs in 90 days, no ADO references  |
| Breaking dependencies        | LOW    | Self-contained, no external references |
| Losing business logic        | MEDIUM | Export definitions before delete       |
| Regulatory/compliance issues | LOW    | Demo/dev flows, not production data    |

---

_Generated by Azure Integration Services Assessment Agent_
