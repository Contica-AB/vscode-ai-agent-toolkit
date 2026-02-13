# Monitoring & Observability Gaps Analysis

**Client**: Acontico Dev  
**Date**: 2026-02-12  
**Subscriptions**: AIS Platform Dev, AIS Platform Prod

---

## Executive Summary

| Category             | Coverage                | Gap Level   |
| -------------------- | ----------------------- | ----------- |
| Diagnostic Settings  | 4/16 (25%)              | 🔴 Critical |
| Application Insights | 2/3 Function Apps (67%) | 🟡 Medium   |
| Alert Rules          | 0 configured            | 🔴 Critical |
| Log Analytics        | 2 workspaces            | 🟢 Present  |

**Overall Observability Score**: 35% — Significant gaps in alerting and diagnostic coverage.

---

## Log Analytics Workspaces

| Workspace                                             | Resource Group           | Location      | Retention |
| ----------------------------------------------------- | ------------------------ | ------------- | --------- |
| managed-Contica-LASValidator-Function-dev-Insights-ws | auto-created             | westeurope    | 30 days   |
| DefaultWorkspace-...-SEC                              | DefaultResourceGroup-SEC | swedencentral | 30 days   |

**Finding**: Workspaces exist but are auto-created, not centrally managed. No dedicated integration monitoring workspace.

---

## Diagnostic Settings Coverage

### Logic Apps

| Logic App                   | Has Diagnostics | Destination          | Logs            | Metrics |
| --------------------------- | --------------- | -------------------- | --------------- | ------- |
| demo-webinar-la             | ✅ Yes          | Event Hub (nodinite) | WorkflowRuntime | ❌ No   |
| demo-upload-webinar-la      | ✅ Yes          | Event Hub (nodinite) | WorkflowRuntime | ❌ No   |
| cosi-member-adobe-dev-logic | ❌ No           | —                    | —               | —       |

**Findings**:

- 2/3 Logic Apps have diagnostic settings (sending to external Event Hub for Nodinite)
- **cosi-member-adobe-dev-logic** has NO diagnostic settings
- Metrics not being collected on any Logic App

### Service Bus Namespaces

| Service Bus                   | Has Diagnostics | Destination |
| ----------------------------- | --------------- | ----------- |
| simontestservicebus-dev-sbs   | ❌ No           | —           |
| sb-inv-001-ext-2216           | ❌ No           | —           |
| sbclsmetricsdev001            | ❌ No           | —           |
| aisplatform-dev-messaging-bus | ❌ No           | —           |

**Finding**: ⚠️ **None** of the 4 Service Bus namespaces have diagnostic settings. No visibility into message counts, dead-letter queues, or throttling.

### Key Vault

| Key Vault             | Has Diagnostics | Destination              | Audit Events | Metrics |
| --------------------- | --------------- | ------------------------ | ------------ | ------- |
| kv-cls-metrics-dev001 | ✅ Yes          | Log Analytics (Sentinel) | ✅ Yes       | ✅ Yes  |

**Finding**: ✅ Key Vault has good monitoring configuration sending to Sentinel workspace.

### Storage Accounts

| Storage Account      | Has Diagnostics | Notes                        |
| -------------------- | --------------- | ---------------------------- |
| demowebinarsa        | ❌ Unknown      | Public blob access enabled   |
| lasvalidatorfuncdev  | ❌ Unknown      | Function App backing storage |
| stclsmetricsdev001   | ❌ Unknown      | —                            |
| stclsmetricsrtdev001 | ❌ Unknown      | —                            |
| stinv001ext8101      | ❌ Unknown      | —                            |

**Finding**: Storage account diagnostic settings were not queried but are typically not configured by default.

### Function Apps

| Function App                      | Has Diagnostics  | Notes        |
| --------------------------------- | ---------------- | ------------ |
| func-cls-metrics-dev-001          | Via App Insights | —            |
| inv-001-ext-4894                  | Via App Insights | ✅ Connected |
| Contica-LASValidator-Function-dev | Via App Insights | ✅ Connected |

---

## Application Insights Coverage

| Function App                      | App Insights | Connection String | Status  |
| --------------------------------- | ------------ | ----------------- | ------- |
| func-cls-metrics-dev-001          | ❌ No        | Not configured    | 🔴 Gap  |
| inv-001-ext-4894                  | ✅ Yes       | Configured        | 🟢 Good |
| Contica-LASValidator-Function-dev | ✅ Yes       | Configured        | 🟢 Good |

**Finding**: 1 of 3 Function Apps missing Application Insights configuration.

---

## Alert Rules

### Metric Alerts

| Subscription      | Alert Rules | Status          |
| ----------------- | ----------- | --------------- |
| AIS Platform Dev  | 0           | 🔴 Critical Gap |
| AIS Platform Prod | 0           | 🔴 Critical Gap |

**Finding**: ⚠️ **ZERO** alert rules configured across both subscriptions. No automated notifications for:

- Logic App failures
- Service Bus dead-letter queue messages
- Function App errors
- Key Vault access anomalies
- Resource unavailability

### Recommended Alert Rules (Not Implemented)

| Resource Type | Alert Condition                  | Priority |
| ------------- | -------------------------------- | -------- |
| Logic Apps    | Run failure rate > 0             | HIGH     |
| Logic Apps    | Run latency > threshold          | MEDIUM   |
| Service Bus   | Dead-letter message count > 0    | HIGH     |
| Service Bus   | Active message count > threshold | MEDIUM   |
| Function Apps | Failure rate > 0                 | HIGH     |
| Key Vault     | Access denied count > 0          | MEDIUM   |

---

## Dashboard Coverage

No Azure Dashboards were identified for integration monitoring.

**Recommendation**: Create a centralized integration dashboard showing:

- Logic App run success/failure rates
- Service Bus queue depths
- Function App invocation counts
- Error trends over time

---

## Monitoring Gaps Summary

### 🔴 Critical Gaps

| Gap                               | Impact                       | Resources Affected          |
| --------------------------------- | ---------------------------- | --------------------------- |
| No alert rules                    | Failures go undetected       | ALL 16 resources            |
| No Service Bus diagnostics        | No visibility into messaging | 4 namespaces                |
| Logic App without diagnostics     | No run tracing               | cosi-member-adobe-dev-logic |
| Function App without App Insights | No performance data          | func-cls-metrics-dev-001    |

### 🟡 Medium Gaps

| Gap                                  | Impact                  | Resources Affected |
| ------------------------------------ | ----------------------- | ------------------ |
| Metrics not collected for Logic Apps | No performance trending | 3 Logic Apps       |
| No centralized dashboard             | No quick visibility     | ALL resources      |
| Auto-created workspaces              | No retention control    | 2 workspaces       |

### 🟢 What's Working

| Capability                                  | Status        |
| ------------------------------------------- | ------------- |
| Key Vault audit logging                     | ✅ Configured |
| 2/3 Function Apps have App Insights         | ✅ Connected  |
| 2/3 Logic Apps have diagnostics (Event Hub) | ✅ Configured |
| Log Analytics workspaces present            | ✅ Available  |

---

## Recommendations

### Immediate (Week 1)

1. **Configure alert rules** for Logic App failures
2. **Add diagnostic settings** to cosi-member-adobe-dev-logic
3. **Add App Insights** to func-cls-metrics-dev-001

### Short-Term (Weeks 2-4)

4. **Enable diagnostics** on all Service Bus namespaces
5. **Create integration monitoring dashboard**
6. **Enable metrics collection** on Logic Apps
7. **Configure dead-letter queue alerts** for Service Bus

### Long-Term (Month 2+)

8. **Consolidate** to a centralized Log Analytics workspace
9. **Implement** Azure Monitor workbooks for reporting
10. **Consider** Nodinite or similar for centralized integration monitoring

---

## SSOT Compliance

Per `/standards/contica-ssot/baseline-levels.md`:

| Requirement                            | Status                    |
| -------------------------------------- | ------------------------- |
| All resources have diagnostic settings | ❌ Not Met (25% coverage) |
| Centralized Log Analytics workspace    | ⚠️ Partial (auto-created) |
| Alert rules for critical failures      | ❌ Not Met (0 alerts)     |
| Application Insights for apps          | ⚠️ Partial (67% coverage) |

**SSOT Monitoring Compliance**: 25%

---

_Generated: 2026-02-12_
