# Failure Analysis Report

**Client**: Contica Final Test  
**Generated**: 2026-02-13  
**Analysis Period**: Last 90 days (Logic Apps), Last 30 days (metrics)  
**Subscription**: AIS Platform Dev (e074dd64-b0c6-459d-95be-8673743234f6)

---

## Executive Summary

| Resource Type      | Total Resources | With Activity | With Failures | Critical Issues |
| ------------------ | --------------- | ------------- | ------------- | --------------- |
| Logic Apps         | 3               | 0             | 0             | N/A (No runs)   |
| Service Bus Queues | 1               | 0             | 0             | None            |
| Function Apps      | 3               | 1             | 1             | 9 server errors |
| API Management     | 0               | N/A           | N/A           | N/A             |

### Key Findings

1. **🔴 All Logic Apps are inactive** — Zero run history in 90 days
2. **⚠️ func-cls-metrics-dev-001** has 9 HTTP 5xx errors and 76 HTTP 4xx errors in 30 days
3. **✅ Service Bus is healthy** — No DLQ messages, no throttling, no errors
4. **🔴 2 of 3 Function Apps are unused** — Zero executions in 30 days

---

## Part A: Logic Apps Failure Analysis

### Run History Summary

| Logic App                   | Resource Group                     | Total Runs (90d) | Failed | Success | Cancelled | Status     |
| --------------------------- | ---------------------------------- | ---------------- | ------ | ------- | --------- | ---------- |
| demo-upload-webinar-la      | rg-demo-webinar                    | 0                | 0      | 0       | 0         | 🔴 No runs |
| demo-webinar-la             | rg-demo-webinar                    | 0                | 0      | 0       | 0         | 🔴 No runs |
| cosi-member-adobe-dev-logic | cosi-member-adobe-0073.i001-dev-rg | 0                | 0      | 0       | 0         | 🔴 No runs |

### Analysis

**All 3 Logic Apps have zero execution history in the last 90 days.**

This means either:

1. The workflows have never been triggered (newly deployed)
2. The triggers have not received any events (no messages in queues, no HTTP calls)
3. The Logic Apps are disabled
4. Run history has been purged (unlikely within 90 days)

### Root Cause Assessment

| Logic App                   | Trigger Type                        | Likely Cause of No Activity         |
| --------------------------- | ----------------------------------- | ----------------------------------- |
| demo-upload-webinar-la      | Service Bus Queue (`faktura-queue`) | No messages in queue                |
| demo-webinar-la             | Recurrence (manual start?)          | Trigger not firing / disabled       |
| cosi-member-adobe-dev-logic | HTTP Request                        | No external system calling endpoint |

### Recommendations

| #   | Action                                                                   | Priority | Effort |
| --- | ------------------------------------------------------------------------ | -------- | ------ |
| 1   | Send test messages to `faktura-queue` to verify trigger works            | High     | S      |
| 2   | Review recurrence trigger configuration for demo-webinar-la              | Medium   | S      |
| 3   | Document HTTP endpoint for cosi-member-adobe-dev-logic and test manually | Medium   | S      |
| 4   | Enable diagnostic settings to capture trigger history even without runs  | Low      | S      |

---

## Part B: Service Bus Health Analysis

### Queue Status Summary

| Namespace                     | Queue/Topic   | Type  | Active Msgs | DLQ Msgs | Status     |
| ----------------------------- | ------------- | ----- | ----------- | -------- | ---------- |
| aisplatform-dev-messaging-bus | faktura-queue | Queue | 0           | 0        | ✅ Healthy |

### Service Bus Metrics (Last 30 Days)

| Namespace                     | Server Errors | User Errors | Throttled Requests | Status     |
| ----------------------------- | ------------- | ----------- | ------------------ | ---------- |
| aisplatform-dev-messaging-bus | 0             | 0           | 0                  | ✅ Healthy |

### Empty Namespaces (No Entities)

| Namespace          | Status  | Recommendation                    |
| ------------------ | ------- | --------------------------------- |
| sb-conticademo-dev | Empty   | Consider deleting to reduce costs |
| sbclsmetricsdev001 | Empty   | Consider deleting to reduce costs |
| sb-inv-001-ext     | Unknown | Verify usage before deletion      |

### Analysis

Service Bus infrastructure is healthy with no operational issues:

- No messages poisoning queues (DLQ count = 0)
- No server-side errors
- No throttling (capacity is adequate)
- No client errors

**However**, the lack of queue activity correlates with Logic Apps not running — messages aren't being sent to queues because the producer Logic Apps aren't executing.

---

## Part C: Function Apps Failure Analysis

### Execution Metrics Summary (Last 30 Days)

| Function App                      | Resource Group                   | Executions | Http 5xx | Http 4xx | Error Rate  | Status          |
| --------------------------------- | -------------------------------- | ---------- | -------- | -------- | ----------- | --------------- |
| func-cls-metrics-dev-001          | rg-cls-metrics-dev               | 6,540      | 9        | 76       | 0.14% (5xx) | ⚠️ Minor Issues |
| inv-001-ext-4894                  | rg-inv-001-ext                   | 0          | 0        | 0        | N/A         | 🔴 No activity  |
| Contica-LASValidator-Function-dev | LogicAppStandardValidator-dev-rg | 0          | 0        | 0        | N/A         | 🔴 No activity  |

### Detailed Analysis: func-cls-metrics-dev-001

This is the only actively used Function App in the subscription.

#### Error Distribution

| Metric                   | Count | Rate  | Severity |
| ------------------------ | ----- | ----- | -------- |
| Total Executions         | 6,540 | -     | -        |
| HTTP 5xx (Server Errors) | 9     | 0.14% | ⚠️ Low   |
| HTTP 4xx (Client Errors) | 76    | 1.16% | ⚠️ Low   |

#### Daily Error Pattern

The errors appear distributed across days without concentration on specific dates:

- HTTP 5xx: 5 on one day, 4 on another
- HTTP 4xx: Distributed across 9+ days (range: 1-39 per day)

#### Error Categorization

| Error Type           | Likely Causes                                              | Recommended Action                                 |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| HTTP 5xx (9 errors)  | Unhandled exceptions, dependency timeouts, runtime crashes | Enable Application Insights for detailed traces    |
| HTTP 4xx (76 errors) | Bad requests, validation failures, auth errors             | Review function input validation and caller errors |

### Inactive Function Apps

| Function App                      | Days Since Last Activity | Potential Issue         |
| --------------------------------- | ------------------------ | ----------------------- |
| inv-001-ext-4894                  | 30+                      | Unused or orphaned      |
| Contica-LASValidator-Function-dev | 30+                      | Unused or test resource |

### Recommendations

| #   | Action                                                                    | Priority | Effort |
| --- | ------------------------------------------------------------------------- | -------- | ------ |
| 1   | Enable Application Insights on func-cls-metrics-dev-001 for error tracing | High     | S      |
| 2   | Review HTTP 5xx errors in Kudu logs or App Insights                       | High     | M      |
| 3   | Verify purpose of inv-001-ext-4894 — delete if unused                     | Medium   | S      |
| 4   | Verify purpose of Contica-LASValidator-Function-dev — delete if unused    | Medium   | S      |

---

## Part D: Operational Health Summary

### Overall Health Score

| Category      | Weight | Score               | Weighted Score |
| ------------- | ------ | ------------------- | -------------- |
| Logic Apps    | 40%    | 0/100 (no activity) | 0              |
| Service Bus   | 20%    | 100/100             | 20             |
| Function Apps | 40%    | 70/100              | 28             |
| **Total**     | 100%   | -                   | **48/100**     |

### Health Rating: ⚠️ POOR

The low score is primarily due to:

1. All Logic Apps inactive (suggesting unused or misconfigured environment)
2. 2 of 3 Function Apps inactive
3. One active Function App has errors (though low rate)

---

## Part E: Failure Pattern Analysis

### Pattern 1: No Activity / Unused Resources

**Affected Resources**: 5 of 7 integration resources show no activity

| Resource Type      | Inactive Count | Active Count |
| ------------------ | -------------- | ------------ |
| Logic Apps         | 3              | 0            |
| Function Apps      | 2              | 1            |
| Service Bus Queues | 1 (0 messages) | 0            |

**Root Cause Hypothesis**:

- This appears to be a **development/demo environment** with resources provisioned but not actively used
- Integration flows may have been deployed but integration testing never completed
- External systems (HTTP callers, message producers) may not be configured

**Recommendation**: Conduct a purpose review of all resources to determine:

- Which are actively needed for development
- Which can be decommissioned
- Which need configuration to become active

### Pattern 2: Function App Errors Without Monitoring

**Affected Resource**: func-cls-metrics-dev-001

The Function App is processing ~6,500 requests/month but has no Application Insights connected. This makes root cause analysis difficult.

**Impact**:

- Cannot determine specific error causes
- Cannot trace request flow
- Cannot identify performance bottlenecks
- Errors may go unnoticed

**Recommendation**: Enable Application Insights immediately for this Function App.

---

## Appendix: Raw Data References

### Logic Apps Run History Query

```powershell
# Command used
az rest --method GET --url "https://management.azure.com/subscriptions/e074dd64-b0c6-459d-95be-8673743234f6/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{name}/runs?api-version=2016-06-01"

# All returned empty: { "value": [] }
```

### Service Bus Metrics Query

```powershell
az monitor metrics list --resource "/subscriptions/.../Microsoft.ServiceBus/namespaces/aisplatform-dev-messaging-bus" --metric ServerErrors,UserErrors,ThrottledRequests --interval P1D
# Result: All metrics = 0
```

### Function App Metrics Query

```powershell
az monitor metrics list --resource "/subscriptions/.../Microsoft.Web/sites/func-cls-metrics-dev-001" --metric FunctionExecutionCount,Http5xx,Http4xx --interval P1D
# Result: 6540 executions, 9 Http5xx, 76 Http4xx
```

---

## Next Steps for Phase 4: Security Audit

Based on failure analysis, the security audit should prioritize:

1. Authentication on HTTP-triggered Logic App (cosi-member-adobe-dev-logic)
2. Error tracing setup for func-cls-metrics-dev-001
3. Access review for unused resources (potential attack surface)

---

_Generated as part of Azure Integration Services Assessment_
