# Resource Inventory Summary

**Assessment Date:** 2026-02-11  
**Client:** Contica AB DEMO new

---

## Overview

| Metric                          | Count  |
| ------------------------------- | ------ |
| **Total Integration Resources** | 19     |
| **Subscriptions Assessed**      | 2 of 4 |
| **Resource Groups**             | 6      |

---

## Subscription Coverage

| Subscription              | Status        | Resource Count |
| ------------------------- | ------------- | -------------- |
| AIS Platform Dev          | ✅ Accessible | 19             |
| AIS Platform Prod         | ✅ Accessible | 0              |
| AIS Shared Resources Prod | ❌ No Access  | -              |
| AIS Shared Resources Dev  | ❌ No Access  | -              |

---

## Resource Summary by Type

| Resource Type            | Count | Status   |
| ------------------------ | ----- | -------- |
| Logic Apps (Consumption) | 3     | ✅ Found |
| Logic Apps (Standard)    | 0     | -        |
| Service Bus Namespaces   | 4     | ✅ Found |
| Function Apps            | 3     | ✅ Found |
| Key Vaults               | 1     | ✅ Found |
| Storage Accounts         | 5     | ✅ Found |
| API Management           | 0     | -        |
| Event Grid Topics        | 0     | -        |
| Event Hubs               | 0     | -        |
| App Configuration        | 0     | -        |

---

## Logic Apps (Consumption) - 3 Total

| Name                        | Resource Group                     | Location      | State   |
| --------------------------- | ---------------------------------- | ------------- | ------- |
| demo-upload-webinar-la      | rg-demo-webinar                    | westeurope    | Enabled |
| demo-webinar-la             | rg-demo-webinar                    | westeurope    | Enabled |
| cosi-member-adobe-dev-logic | cosi-member-adobe-0073.i001-dev-rg | swedencentral | Enabled |

---

## Service Bus Namespaces - 4 Total

| Name                          | Resource Group     | SKU      | Location      |
| ----------------------------- | ------------------ | -------- | ------------- |
| simontestservicebus-dev-sbs   | testing-deployment | Standard | swedencentral |
| sb-inv-001-ext-2216           | rg-inv-001-ext     | Standard | swedencentral |
| sbclsmetricsdev001            | rg-cls-metrics-dev | Standard | swedencentral |
| aisplatform-dev-messaging-bus | rg-demo-webinar    | Basic    | westeurope    |

### Service Bus Queues

| Namespace                     | Queues        |
| ----------------------------- | ------------- |
| aisplatform-dev-messaging-bus | faktura-queue |

---

## Function Apps - 3 Total

| Name                              | Resource Group                   | Location       | State   |
| --------------------------------- | -------------------------------- | -------------- | ------- |
| func-cls-metrics-dev-001          | rg-cls-metrics-dev               | Sweden Central | Running |
| inv-001-ext-4894                  | rg-inv-001-ext                   | Sweden Central | Running |
| Contica-LASValidator-Function-dev | LogicAppStandardValidator-dev-rg | West Europe    | Running |

---

## Key Vaults - 1 Total

| Name                  | Resource Group     | Location      |
| --------------------- | ------------------ | ------------- |
| kv-cls-metrics-dev001 | rg-cls-metrics-dev | swedencentral |

---

## Storage Accounts - 5 Total

| Name                 | Resource Group                   | SKU          | Public Blob Access |
| -------------------- | -------------------------------- | ------------ | ------------------ |
| demowebinarsa        | rg-demo-webinar                  | Standard_LRS | ⚠️ **Enabled**     |
| lasvalidatorfuncdev  | LogicAppStandardValidator-dev-rg | Standard_LRS | ✅ Disabled        |
| stclsmetricsdev001   | rg-cls-metrics-dev               | Standard_LRS | ✅ Disabled        |
| stclsmetricsrtdev001 | rg-cls-metrics-dev               | Standard_LRS | ✅ Disabled        |
| stinv001ext8101      | rg-inv-001-ext                   | Standard_LRS | ✅ Disabled        |

### ⚠️ Security Note

1 storage account has public blob access enabled. This should be reviewed in the Security Audit phase.

---

## Resource Group Distribution

| Resource Group                     | Subscription     | Resources                                                 |
| ---------------------------------- | ---------------- | --------------------------------------------------------- |
| rg-demo-webinar                    | AIS Platform Dev | 4 (2 Logic Apps, 1 Service Bus, 1 Storage)                |
| rg-cls-metrics-dev                 | AIS Platform Dev | 5 (1 Function App, 1 Service Bus, 1 Key Vault, 2 Storage) |
| cosi-member-adobe-0073.i001-dev-rg | AIS Platform Dev | 1 (1 Logic App)                                           |
| testing-deployment                 | AIS Platform Dev | 1 (1 Service Bus)                                         |
| rg-inv-001-ext                     | AIS Platform Dev | 3 (1 Function App, 1 Service Bus, 1 Storage)              |
| LogicAppStandardValidator-dev-rg   | AIS Platform Dev | 2 (1 Function App, 1 Storage)                             |

---

## Regions Used

| Region         | Resource Count |
| -------------- | -------------- |
| Sweden Central | 12             |
| West Europe    | 7              |

---

## Next Steps

1. **Phase 2:** Analyze each Logic App workflow in detail
2. **Phase 3:** Query run history for failure patterns
3. **Phase 4:** Audit security configuration against SSOT standards
4. **Phase 5:** Identify dead/unused flows
5. **Phase 6:** Check monitoring and observability gaps

---

_Generated by Azure Integration Services Assessment Agent_
