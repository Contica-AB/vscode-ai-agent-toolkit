# Monitoring & Observability Gaps Report

**Assessment Date:** 2026-02-11  
**Client:** Contica AB DEMO new  
**Subscriptions Analyzed:** AIS Platform Dev, AIS Platform Prod

---

## Executive Summary

| Metric                                 | Value           |
| -------------------------------------- | --------------- |
| **Resources with Diagnostic Settings** | 3 of 19 (16%)   |
| **Application Insights Coverage**      | 3 Function Apps |
| **Alert Rules Configured**             | 0               |
| **Log Analytics Workspaces**           | 2               |
| **Observability Score**                | 35%             |

**Assessment:** The environment has partial monitoring coverage. Logic Apps in the demo resource group have Event Hub logging (Nodinite), but most resources lack diagnostic settings or centralized monitoring.

---

## Monitoring Coverage Summary

### By Resource Type

| Resource Type            | Total | With Diagnostics | Coverage                |
| ------------------------ | ----- | ---------------- | ----------------------- |
| Logic Apps (Consumption) | 3     | 2                | 67%                     |
| Service Bus              | 4     | 0                | 0%                      |
| Function Apps            | 3     | 3                | 100% (via App Insights) |
| Storage Accounts         | 5     | 0                | 0%                      |
| Key Vault                | 1     | 1                | 100%                    |

---

## Detailed Analysis

### Diagnostic Settings

#### ✅ Resources WITH Diagnostic Settings

| Resource               | Destination              | Logs Enabled       | Metrics Enabled |
| ---------------------- | ------------------------ | ------------------ | --------------- |
| demo-webinar-la        | Event Hub (Nodinite)     | WorkflowRuntime ✅ | AllMetrics ❌   |
| demo-upload-webinar-la | Event Hub (Nodinite)     | WorkflowRuntime ✅ | AllMetrics ❌   |
| kv-cls-metrics-dev001  | Log Analytics (Sentinel) | AuditEvent ✅      | AllMetrics ✅   |

**Findings:**

- Logic Apps send logs to Event Hub for Nodinite processing (external monitoring tool)
- Key Vault sends audit logs to Sentinel Log Analytics workspace
- Metrics are NOT enabled on Logic Apps diagnostic settings

#### ❌ Resources WITHOUT Diagnostic Settings

| Resource                      | Type            | Impact                                 |
| ----------------------------- | --------------- | -------------------------------------- |
| cosi-member-adobe-dev-logic   | Logic App       | No run visibility outside Azure Portal |
| aisplatform-dev-messaging-bus | Service Bus     | No queue depth or DLQ monitoring       |
| sbclsmetricsdev001            | Service Bus     | No queue depth or DLQ monitoring       |
| sb-inv-001-ext-2216           | Service Bus     | No queue depth or DLQ monitoring       |
| simontestservicebus-dev-sbs   | Service Bus     | No queue depth or DLQ monitoring       |
| demowebinarsa                 | Storage Account | No access logging                      |
| 4 other Storage Accounts      | Storage Account | No access logging                      |

---

### Application Insights Coverage

| Function App                      | App Insights Instance                      | Status       |
| --------------------------------- | ------------------------------------------ | ------------ |
| func-cls-metrics-dev-001          | func-cls-metrics-dev-001                   | ✅ Connected |
| inv-001-ext-4894                  | inv-001-ext-4894                           | ✅ Connected |
| Contica-LASValidator-Function-dev | Contica-LASValidator-Function-dev-Insights | ✅ Connected |

**Assessment:** All Function Apps have Application Insights configured - this is the best practice.

---

### Log Analytics Workspaces

| Workspace                                             | Resource Group           | SKU       | Purpose                |
| ----------------------------------------------------- | ------------------------ | --------- | ---------------------- |
| managed-Contica-LASValidator-Function-dev-Insights-ws | (Auto-managed)           | PerGB2018 | Function App telemetry |
| DefaultWorkspace-e074dd64-...-SEC                     | DefaultResourceGroup-SEC | PerGB2018 | Default workspace      |

**Note:** Key Vault logs are also sent to a separate Sentinel workspace in another subscription (f78cd82c-...).

**Issues:**

- No central Log Analytics workspace for all integration resources
- Multiple workspaces create fragmented visibility
- No cross-resource queries possible without workspace federation

---

### Alert Rules

| Subscription      | Alert Rules | Status                  |
| ----------------- | ----------- | ----------------------- |
| AIS Platform Dev  | 0           | ❌ No alerts configured |
| AIS Platform Prod | 0           | ❌ No alerts configured |

**Critical Missing Alerts:**

| Recommended Alert         | Priority | Reason                                    |
| ------------------------- | -------- | ----------------------------------------- |
| Logic App Failed Runs     | HIGH     | Detect integration failures immediately   |
| Service Bus DLQ Count > 0 | HIGH     | Dead letters indicate processing failures |
| Service Bus Queue Depth   | MEDIUM   | Detect backlog buildup                    |
| Logic App Latency         | MEDIUM   | Detect performance degradation            |
| Key Vault Access Failures | MEDIUM   | Detect unauthorized access attempts       |

---

## Gap Analysis

### Critical Gaps (HIGH)

| #   | Gap                                        | Impact                                | Recommendation             |
| --- | ------------------------------------------ | ------------------------------------- | -------------------------- |
| G1  | No alert rules                             | No proactive notification of failures | Create metric alerts       |
| G2  | Service Bus no diagnostics                 | Cannot monitor queue health           | Enable diagnostic settings |
| G3  | cosi-member-adobe-dev-logic no diagnostics | Cannot trace runs                     | Add diagnostic settings    |

### Important Gaps (MEDIUM)

| #   | Gap                            | Impact                    | Recommendation                  |
| --- | ------------------------------ | ------------------------- | ------------------------------- |
| G4  | Logic App metrics disabled     | Performance not tracked   | Enable AllMetrics               |
| G5  | Storage Account no diagnostics | Access patterns invisible | Enable logging                  |
| G6  | Multiple workspaces            | Fragmented visibility     | Consolidate to single workspace |
| G7  | No dashboards                  | No at-a-glance view       | Create Azure Dashboard          |

### Minor Gaps (LOW)

| #   | Gap                 | Impact                  | Recommendation      |
| --- | ------------------- | ----------------------- | ------------------- |
| G8  | No retention policy | Logs may grow unbounded | Configure retention |

---

## Nodinite Integration

**Finding:** Two Logic Apps send logs to Event Hub for Nodinite processing.

```
Event Hub Namespace: eventhub-nodinite
Event Hub Name: logic-apps
Subscription: AIS Shared Resources Dev
```

**Analysis:**

- Nodinite is a third-party integration monitoring tool
- Provides business-level visibility into message flows
- This is a POSITIVE finding - demonstrates mature monitoring approach

**Recommendation:** Ensure all production Logic Apps follow this pattern.

---

## Recommended Monitoring Architecture

### Centralized Monitoring Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                    Central Log Analytics Workspace               │
│                     law-integration-prod-westeu                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Logic Apps│  │Service   │  │Function  │  │Key Vault         │ │
│  │          │→ │Bus       │→ │Apps      │→ │                  │ │
│  │Diagnostic│  │Diagnostic│  │App       │  │Diagnostic Logs   │ │
│  │Settings  │  │Settings  │  │Insights  │  │                  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                       Alert Rules                                │
│  • Logic App Failures    • SB Dead Letters    • KV Access Denied│
├─────────────────────────────────────────────────────────────────┤
│                       Action Groups                              │
│  • Email to ops team     • Teams notification  • Incident system │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────┐
                    │     Nodinite      │
                    │ (Business Level)   │
                    └───────────────────┘
```

---

## Remediation Steps

### Step 1: Create Alert Rules (High Priority)

```bash
# Logic App Failed Runs Alert
az monitor metrics alert create \
  --name "Logic App Failed Runs" \
  --resource-group rg-demo-webinar \
  --scopes "/subscriptions/e074dd64-b0c6-459d-95be-8673743234f6/resourceGroups/rg-demo-webinar/providers/Microsoft.Logic/workflows/demo-webinar-la" \
  --condition "total RunsFailed > 0" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group /subscriptions/.../resourceGroups/.../providers/Microsoft.Insights/actionGroups/integration-ops
```

### Step 2: Enable Service Bus Diagnostics

```bash
# Enable diagnostic settings on Service Bus
az monitor diagnostic-settings create \
  --name "sb-diagnostics" \
  --resource "/subscriptions/e074dd64-b0c6-459d-95be-8673743234f6/resourceGroups/rg-demo-webinar/providers/Microsoft.ServiceBus/namespaces/aisplatform-dev-messaging-bus" \
  --workspace "/subscriptions/.../resourceGroups/.../providers/Microsoft.OperationalInsights/workspaces/law-integration-prod" \
  --logs '[{"category": "OperationalLogs", "enabled": true}]' \
  --metrics '[{"category": "AllMetrics", "enabled": true}]'
```

### Step 3: Add Missing Logic App Diagnostics

```bash
# Add diagnostic settings to cosi-member-adobe-dev-logic
az monitor diagnostic-settings create \
  --name "nodinite-logging" \
  --resource "/subscriptions/e074dd64-b0c6-459d-95be-8673743234f6/resourceGroups/cosi-member-adobe-0073.i001-dev-rg/providers/Microsoft.Logic/workflows/cosi-member-adobe-dev-logic" \
  --event-hub-rule "/subscriptions/ae2cbfcc-4341-4d8f-99cb-c9ebe91d89e4/resourceGroups/rg-eventhub-ais-platform-dev-westeu/providers/Microsoft.EventHub/namespaces/eventhub-nodinite/authorizationrules/RootManageSharedAccessKey" \
  --event-hub "logic-apps" \
  --logs '[{"category": "WorkflowRuntime", "enabled": true}]'
```

---

## Cost Considerations

| Action                               | Estimated Monthly Cost |
| ------------------------------------ | ---------------------- |
| Diagnostic settings to Log Analytics | $5-20 per GB ingested  |
| Application Insights (existing)      | Already in place       |
| Alert rules                          | Free (up to 100 rules) |
| Action groups                        | Low (per notification) |

**Recommendation:** Start with alert rules (free) and expand diagnostic coverage gradually while monitoring costs.

---

## Summary Matrix

| Category            | Current          | Target | Gap      |
| ------------------- | ---------------- | ------ | -------- |
| Diagnostic Coverage | 16%              | 100%   | 84%      |
| Alert Rules         | 0                | 10+    | 100%     |
| App Insights        | 100% (Functions) | 100%   | 0%       |
| Centralized Logging | Partial          | Full   | Moderate |
| Dashboards          | 0                | 1+     | 100%     |

---

_Generated by Azure Integration Services Assessment Agent_
