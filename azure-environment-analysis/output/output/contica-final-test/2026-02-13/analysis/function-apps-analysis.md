# Function Apps Deep Dive

> **Client**: Contica Final Test  
> **Subscription**: AIS Platform Dev  
> **Analysis Date**: 2026-02-13

---

## Summary

| Metric               | Value               |
| -------------------- | ------------------- |
| Total Function Apps  | 3                   |
| Runtime              | .NET Isolated (all) |
| HTTPS Only           | 1/3 ⚠️              |
| Managed Identity     | 1/3 ⚠️              |
| App Insights Enabled | 2/3 ⚠️              |
| All Running          | ✅                  |

---

## Function App Inventory

| Function App                      | Resource Group                   | Runtime       | State      |
| --------------------------------- | -------------------------------- | ------------- | ---------- |
| inv-001-ext-4894                  | rg-inv-001-ext                   | .NET Isolated | ✅ Running |
| func-cls-metrics-dev-001          | rg-cls-metrics-dev               | .NET Isolated | ✅ Running |
| Contica-LASValidator-Function-dev | LogicAppStandardValidator-dev-rg | .NET Isolated | ✅ Running |

---

## Security Assessment

| Function App                      | HTTPS Only | Managed Identity  | Public Access | FTP State |
| --------------------------------- | ---------- | ----------------- | ------------- | --------- |
| inv-001-ext-4894                  | ❌ No      | ❌ None           | ⚠️ Enabled    | Unknown   |
| func-cls-metrics-dev-001          | ✅ Yes     | ✅ SystemAssigned | ⚠️ Enabled    | Unknown   |
| Contica-LASValidator-Function-dev | ❌ No      | ❌ None           | ⚠️ Enabled    | Unknown   |

### Security Findings

| Severity  | Finding                        | Affected                                            |
| --------- | ------------------------------ | --------------------------------------------------- |
| 🔴 HIGH   | HTTPS not enforced             | inv-001-ext-4894, Contica-LASValidator-Function-dev |
| ⚠️ MEDIUM | No Managed Identity configured | inv-001-ext-4894, Contica-LASValidator-Function-dev |
| ⚠️ MEDIUM | Public network access enabled  | All                                                 |

---

## Detailed Function App Analysis

### 1. inv-001-ext-4894

**Purpose**: Worklog integration processing

| Property            | Value                                | Assessment           |
| ------------------- | ------------------------------------ | -------------------- |
| Resource Group      | rg-inv-001-ext                       | ✅                   |
| Runtime             | .NET Isolated                        | ✅                   |
| State               | Running                              | ✅                   |
| HTTPS Only          | ❌ No                                | 🔴 **Security Risk** |
| Managed Identity    | ❌ None                              | ⚠️ Should enable     |
| App Insights        | ✅ Configured                        | ✅                   |
| Instrumentation Key | 29be7523-6cfe-4c63-9047-848c8dab382c | ✅                   |
| Tags                | ❌ None                              | ⚠️ Missing           |

**Recommendations**:

1. Enable HTTPS Only
2. Configure System Assigned Managed Identity
3. Add standard tags (Environment, Owner, Project)

---

### 2. func-cls-metrics-dev-001

**Purpose**: CLS Metrics solution processing

| Property              | Value              | Assessment         |
| --------------------- | ------------------ | ------------------ |
| Resource Group        | rg-cls-metrics-dev | ✅                 |
| Runtime               | .NET Isolated      | ✅                 |
| State                 | Running            | ✅                 |
| HTTPS Only            | ✅ Yes             | ✅                 |
| Managed Identity      | ✅ SystemAssigned  | ✅                 |
| App Insights          | ❌ Not Configured  | 🔴 **Gap**         |
| Public Network Access | Enabled            | ⚠️ Should restrict |
| Tags                  | ❌ None            | ⚠️ Missing         |

**Assessment**: Best security posture of the three, but missing Application Insights.

**Recommendations**:

1. Configure Application Insights
2. Add standard tags
3. Consider network restrictions

---

### 3. Contica-LASValidator-Function-dev

**Purpose**: Logic App Standard validator utility

| Property            | Value                                | Assessment           |
| ------------------- | ------------------------------------ | -------------------- |
| Resource Group      | LogicAppStandardValidator-dev-rg     | ✅                   |
| Runtime             | .NET Isolated                        | ✅                   |
| State               | Running                              | ✅                   |
| HTTPS Only          | ❌ No                                | 🔴 **Security Risk** |
| Managed Identity    | ❌ None                              | ⚠️ Should enable     |
| App Insights        | ✅ Configured                        | ✅                   |
| Instrumentation Key | 87baead8-9f10-4377-8549-79cef4a19ae1 | ✅                   |
| Tags                | ❌ None                              | ⚠️ Missing           |

**Recommendations**:

1. Enable HTTPS Only
2. Configure System Assigned Managed Identity
3. Add standard tags

---

## Monitoring Coverage

| Function App                      | App Insights | Log Analytics | Alerts  |
| --------------------------------- | ------------ | ------------- | ------- |
| inv-001-ext-4894                  | ✅           | Unknown       | Unknown |
| func-cls-metrics-dev-001          | ❌           | Unknown       | Unknown |
| Contica-LASValidator-Function-dev | ✅           | Unknown       | Unknown |

### Gap Analysis

- **func-cls-metrics-dev-001**: Missing Application Insights - no visibility into function executions, exceptions, or performance
- No alert rules discovered for Function App failures

---

## Integration Patterns

### inv-001-ext-4894

Based on naming and resource group, likely integrates with:

- Service Bus: sb-inv-001-ext-2216 (worklog queue)
- Storage: stinv001ext8101

### func-cls-metrics-dev-001

Based on naming, likely integrates with:

- Service Bus: sbclsmetricsdev001
- Key Vault: kv-cls-metrics-dev001
- Storage: stclsmetricsdev001

### Contica-LASValidator-Function-dev

Based on naming, a utility function for validating Logic App Standard deployments.

---

## Recommendations Summary

### Priority 1 - Security

| #   | Recommendation             | Affected                       | Effort |
| --- | -------------------------- | ------------------------------ | ------ |
| 1   | Enable HTTPS Only          | inv-001-ext-4894, LASValidator | Low    |
| 2   | Configure Managed Identity | inv-001-ext-4894, LASValidator | Low    |
| 3   | Disable FTP/FTPS           | All                            | Low    |

### Priority 2 - Observability

| #   | Recommendation        | Affected                 | Effort |
| --- | --------------------- | ------------------------ | ------ |
| 4   | Add App Insights      | func-cls-metrics-dev-001 | Low    |
| 5   | Create failure alerts | All                      | Low    |
| 6   | Review log retention  | All                      | Low    |

### Priority 3 - Governance

| #   | Recommendation             | Affected | Effort |
| --- | -------------------------- | -------- | ------ |
| 7   | Add standard tags          | All      | Low    |
| 8   | Document function purposes | All      | Low    |
| 9   | Review runtime versions    | All      | Low    |

---

## Runtime Information

| Function App | Runtime Version | EOL Status   |
| ------------ | --------------- | ------------ |
| All          | .NET Isolated   | ✅ Supported |

**Note**: .NET Isolated is the recommended hosting model for Azure Functions going forward.

---

_Analysis Date: 2026-02-13_
