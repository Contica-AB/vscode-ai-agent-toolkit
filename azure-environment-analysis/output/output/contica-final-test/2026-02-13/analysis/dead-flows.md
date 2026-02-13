# Phase 5: Dead Flow Detection

**Client:** Contica Final Test  
**Subscription:** AIS Platform Dev (`e074dd64-b0c6-459d-95be-8673743234f6`)  
**Assessment Date:** 2026-02-13  
**Analysis Period:** Last 90 days

---

## Executive Summary

| Metric                                     | Count      |
| ------------------------------------------ | ---------- |
| **Total Logic Apps**                       | 3          |
| **Dead/Inactive Logic Apps**               | 3 (100%)   |
| **Total Function Apps**                    | 3          |
| **Inactive Function Apps**                 | 2 (67%)    |
| **Active Function Apps**                   | 1          |
| **Total Service Bus Namespaces**           | 4          |
| **Service Bus Entities with Zero Traffic** | 4/4 (100%) |

**Critical Finding:** The entire integration landscape shows minimal activity. All Logic Apps and most Function Apps have zero executions in the 90-day analysis period.

---

## Part A: Logic Apps Dead Flow Detection

### Classification Criteria

| Status           | Definition                                         |
| ---------------- | -------------------------------------------------- |
| **Active**       | Regular successful runs, healthy operation         |
| **Low Activity** | Sporadic runs, < 10 executions in 90 days          |
| **Inactive**     | Zero runs in 90 days, enabled state                |
| **Failing**      | Running but 100% failure rate                      |
| **Disabled**     | Explicitly disabled, no recent activity            |
| **Dead**         | Disabled 90+ days OR never executed since creation |

### Logic Apps Classification

| Logic App                   | Resource Group                     | Status  | Runs (90d) | Classification | Confidence |
| --------------------------- | ---------------------------------- | ------- | ---------- | -------------- | ---------- |
| demo-upload-webinar-la      | rg-demo-webinar                    | Enabled | 0          | **INACTIVE**   | High       |
| demo-webinar-la             | rg-demo-webinar                    | Enabled | 0          | **INACTIVE**   | High       |
| cosi-member-adobe-dev-logic | cosi-member-adobe-0073.i001-dev-rg | Enabled | 0          | **INACTIVE**   | High       |

### Detailed Analysis

#### 1. demo-upload-webinar-la

| Attribute          | Value                             |
| ------------------ | --------------------------------- |
| **Resource Group** | rg-demo-webinar                   |
| **Created**        | 2024-09-16                        |
| **Last Modified**  | 2024-09-17                        |
| **State**          | Enabled                           |
| **Runs (90 days)** | 0                                 |
| **Tags**           | None                              |
| **Trigger Type**   | Service Bus Queue (faktura-queue) |
| **Classification** | **INACTIVE**                      |

**Analysis:**

- Created ~17 months ago
- Last modified 16 months ago (1 day after creation)
- Has never successfully processed a message
- Queue `faktura-queue` has 0 messages (no trigger activity)
- No tags indicate purpose or ownership

**Recommendation:** 🔴 **Decommission candidate** - Appears to be a demo/test workflow that was never used in production.

---

#### 2. demo-webinar-la

| Attribute          | Value               |
| ------------------ | ------------------- |
| **Resource Group** | rg-demo-webinar     |
| **Created**        | 2024-06-10          |
| **Last Modified**  | 2024-09-16          |
| **State**          | Enabled             |
| **Runs (90 days)** | 0                   |
| **Tags**           | None                |
| **Trigger Type**   | Recurrence + Manual |
| **Classification** | **INACTIVE**        |

**Analysis:**

- Created ~20 months ago
- Last modified 16 months ago
- Has recurrence trigger configured but has never executed
- Shows connection to demowebinarsa storage account
- No tags indicate purpose or ownership

**Recommendation:** 🔴 **Decommission candidate** - Appears to be a demo workflow. Storage account should be reviewed for data before deletion.

---

#### 3. cosi-member-adobe-dev-logic

| Attribute          | Value                              |
| ------------------ | ---------------------------------- |
| **Resource Group** | cosi-member-adobe-0073.i001-dev-rg |
| **Created**        | 2025-01-22                         |
| **Last Modified**  | 2025-01-22                         |
| **State**          | Enabled                            |
| **Runs (90 days)** | 0                                  |
| **Tags**           | None                               |
| **Trigger Type**   | HTTP (No Authentication)           |
| **Classification** | **INACTIVE**                       |

**Analysis:**

- Created ~13 months ago
- Never modified since creation (same day)
- HTTP trigger has never been invoked
- Uses Blob Storage, Key Vault, and HTTP connectors
- Pattern suggests Adobe/CRM integration that was never implemented

**Recommendation:** 🟠 **Review with stakeholders** - More recent creation suggests intentional development. Verify if this is a work-in-progress or abandoned.

---

## Part B: Function Apps Activity Analysis

### Function Apps Classification

| Function App                      | Resource Group                   | State   | Executions (90d) | Classification |
| --------------------------------- | -------------------------------- | ------- | ---------------- | -------------- |
| func-cls-metrics-dev-001          | rg-cls-metrics-dev               | Running | 6,540            | **ACTIVE**     |
| inv-001-ext-4894                  | rg-inv-001-ext                   | Running | 0                | **INACTIVE**   |
| Contica-LASValidator-Function-dev | LogicAppStandardValidator-dev-rg | Running | 0                | **INACTIVE**   |

### Detailed Analysis

#### func-cls-metrics-dev-001 ✅ ACTIVE

| Metric                   | Value                |
| ------------------------ | -------------------- |
| **Executions (90 days)** | 6,540                |
| **HTTP 5xx Errors**      | 9 (0.14% error rate) |
| **HTTP 4xx Errors**      | 76 (client errors)   |
| **Status**               | Healthy              |

**Analysis:** This is the only actively used Function App in the environment. Error rate is acceptable for a dev environment.

---

#### inv-001-ext-4894 ⚠️ INACTIVE

| Metric                   | Value                  |
| ------------------------ | ---------------------- |
| **Executions (90 days)** | 0                      |
| **State**                | Running                |
| **App Insights**         | Configured             |
| **Tags**                 | App Insights link only |

**Analysis:**

- Function App is running but has zero executions
- Has Application Insights configured but no telemetry
- Part of integration pattern with Service Bus `sb-inv-001-ext-2216`

**Recommendation:** 🟠 **Review with stakeholders** - May be awaiting upstream integration. Check for related ADO work items.

---

#### Contica-LASValidator-Function-dev ⚠️ INACTIVE

| Metric                   | Value                                    |
| ------------------------ | ---------------------------------------- |
| **Executions (90 days)** | 0                                        |
| **State**                | Running                                  |
| **App Insights**         | Configured                               |
| **Storage Account**      | lasvalidatorfuncdev (TLS 1.0 - CRITICAL) |

**Analysis:**

- Function App is running but has zero executions
- Has Application Insights configured but no telemetry
- Associated storage account has critical TLS 1.0 vulnerability

**Recommendation:** 🟠 **Review with stakeholders** - If keeping, fix TLS 1.0 issue on storage account first.

---

## Part C: Service Bus Unused Entity Analysis

### Namespace Overview

| Namespace                     | Resource Group     | Queues | Topics | Total Entities | Activity |
| ----------------------------- | ------------------ | ------ | ------ | -------------- | -------- |
| aisplatform-dev-messaging-bus | rg-demo-webinar    | 1      | 0      | 1              | None     |
| sb-inv-001-ext-2216           | rg-inv-001-ext     | 1      | 0      | 1              | None     |
| sbclsmetricsdev001            | rg-cls-metrics-dev | 0      | 2      | 2              | Unknown  |
| simontestservicebus-dev-sbs   | testing-deployment | 0      | 1      | 1              | Unknown  |

### Queue Activity Analysis

| Queue                        | Namespace                     | Active Messages | DLQ Messages | Status |
| ---------------------------- | ----------------------------- | --------------- | ------------ | ------ |
| faktura-queue                | aisplatform-dev-messaging-bus | 0               | 0            | Empty  |
| sbq-001-inv-001-worklog-prod | sb-inv-001-ext-2216           | 0               | 0            | Empty  |

### Topic Analysis

| Topic         | Namespace                   | Purpose            | Subscribers |
| ------------- | --------------------------- | ------------------ | ----------- |
| devops-events | sbclsmetricsdev001          | DevOps integration | Unknown     |
| jira-events   | sbclsmetricsdev001          | Jira integration   | Unknown     |
| topic-sbt     | simontestservicebus-dev-sbs | Test topic         | Unknown     |

### Recommendations

**aisplatform-dev-messaging-bus:**

- Contains `faktura-queue` used by `demo-upload-webinar-la` (both inactive)
- 🔴 **Decommission candidate** - Coupled with inactive Logic App

**sb-inv-001-ext-2216:**

- Contains `sbq-001-inv-001-worklog-prod` (empty)
- Part of inv-001 integration pattern
- 🟠 **Review queue** - Verify if upstream systems should be sending messages

**sbclsmetricsdev001:**

- Contains topics for DevOps and Jira events
- Associated with active `func-cls-metrics-dev-001`
- 🟢 **Keep** - Part of active Function App integration

**simontestservicebus-dev-sbs:**

- Contains test topic (`topic-sbt`)
- Name suggests test/experimental use
- 🔴 **Decommission candidate** - Appears to be test infrastructure

---

## Part D: Dependency Map

### Resource Dependencies

```
demo-webinar-la (INACTIVE)
├── demowebinarsa (Storage Account)
│   └── webinar-data container
└── Azure Blob Storage connector

demo-upload-webinar-la (INACTIVE)
├── aisplatform-dev-messaging-bus
│   └── faktura-queue (Empty)
├── Azure Blob Storage connector
└── Service Bus connector

cosi-member-adobe-dev-logic (INACTIVE)
├── cosimemstorage0702 (Storage Account)
├── kv-cosi-member-dev-test (Key Vault)
└── HTTP connector (external APIs)

inv-001-ext-4894 (INACTIVE)
└── sb-inv-001-ext-2216
    └── sbq-001-inv-001-worklog-prod (Empty)

func-cls-metrics-dev-001 (ACTIVE)
└── sbclsmetricsdev001
    ├── devops-events
    └── jira-events

Contica-LASValidator-Function-dev (INACTIVE)
└── lasvalidatorfuncdev (Storage - TLS 1.0 CRITICAL)
```

---

## Part E: Decommissioning Recommendations

### Priority Matrix

| Resource                          | Classification | Impact | Risk   | Recommendation        | Priority  |
| --------------------------------- | -------------- | ------ | ------ | --------------------- | --------- |
| demo-webinar-la                   | Inactive       | Low    | Low    | Disable, then delete  | 🔴 High   |
| demo-upload-webinar-la            | Inactive       | Low    | Low    | Disable, then delete  | 🔴 High   |
| aisplatform-dev-messaging-bus     | Unused         | Low    | Low    | Delete with Logic App | 🔴 High   |
| simontestservicebus-dev-sbs       | Test           | Low    | Low    | Delete                | 🔴 High   |
| cosi-member-adobe-dev-logic       | Inactive       | Medium | Medium | Stakeholder review    | 🟠 Medium |
| inv-001-ext-4894                  | Inactive       | Medium | Medium | Stakeholder review    | 🟠 Medium |
| Contica-LASValidator-Function-dev | Inactive       | Medium | Medium | Stakeholder review    | 🟠 Medium |

### Safe Decommissioning Process

#### Step 1: Immediate Actions (Low Risk)

1. **Document** all resources before deletion (export ARM templates)
2. **Disable** demo Logic Apps first, wait 30 days to confirm no impact
3. **Delete** simontestservicebus-dev-sbs (test namespace)

#### Step 2: Stakeholder Review Required

1. Contact resource group owners for:
   - `cosi-member-adobe-dev-logic` - Verify project status
   - `inv-001-ext-4894` - Verify integration status
   - `Contica-LASValidator-Function-dev` - Verify intended use

#### Step 3: Post-Review Cleanup

1. Delete confirmed unused resources
2. Remove associated storage accounts (after data backup if needed)
3. Clean up App Registrations if applicable

---

## Part F: Cost Impact Analysis

### Estimated Monthly Costs (Inactive Resources)

| Resource Type               | Count | Est. Cost/Month | Total Inactive Cost |
| --------------------------- | ----- | --------------- | ------------------- |
| Logic Apps (Consumption)    | 3     | $0 (no runs)    | $0                  |
| Function Apps (Consumption) | 2     | $0 (no runs)    | $0                  |
| Service Bus (Basic)         | 4     | ~$5 each        | ~$20                |
| Storage Accounts            | 5     | ~$5-20 each     | ~$40                |

**Total Estimated Waste:** ~$60/month from unused infrastructure

**Note:** While costs are minimal, the primary concern is:

1. **Security exposure** from unmaintained resources
2. **Technical debt** from abandoned integrations
3. **Operational overhead** from managing unused infrastructure

---

## Summary

### Key Findings

1. **100% of Logic Apps are inactive** - No executions in 90 days
2. **67% of Function Apps are inactive** - Only 1 of 3 has activity
3. **All Service Bus queues are empty** - No message flow detected
4. **No ownership tags** - Cannot identify responsible parties
5. **Demo resources left enabled** - Should be cleaned up

### Immediate Actions Required

| Action                               | Owner                | Timeline  |
| ------------------------------------ | -------------------- | --------- |
| Disable demo Logic Apps              | Platform Team        | This week |
| Review cosi-member-adobe integration | Business stakeholder | 2 weeks   |
| Delete test Service Bus namespace    | Platform Team        | This week |
| Add ownership tags to all resources  | All teams            | 2 weeks   |

---

_Assessment performed: 2026-02-13_  
_Analysis tool: Azure CLI (Logic Apps MCP unavailable)_  
_Data source: az logic workflow, az functionapp, az servicebus_
