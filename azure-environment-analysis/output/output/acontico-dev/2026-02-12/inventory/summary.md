# Resource Inventory Summary

**Client**: Acontico Dev  
**Date**: 2026-02-12  
**Subscriptions**: AIS Platform Dev, AIS Platform Prod

---

## Overview

| Category                 | Count |
| ------------------------ | ----- |
| **Total Resources**      | 16    |
| Logic Apps (Consumption) | 3     |
| Logic Apps (Standard)    | 0     |
| Service Bus Namespaces   | 4     |
| Function Apps            | 3     |
| Key Vaults               | 1     |
| Storage Accounts         | 5     |
| API Management           | 0     |
| Event Grid Topics        | 0     |
| Event Hubs               | 0     |
| App Configuration        | 0     |

---

## Logic Apps (Consumption)

| Name                        | Resource Group                     | Location      | State   |
| --------------------------- | ---------------------------------- | ------------- | ------- |
| demo-upload-webinar-la      | rg-demo-webinar                    | westeurope    | Enabled |
| demo-webinar-la             | rg-demo-webinar                    | westeurope    | Enabled |
| cosi-member-adobe-dev-logic | cosi-member-adobe-0073.i001-dev-rg | swedencentral | Enabled |

**Standard Logic Apps**: None found

---

## Service Bus Namespaces

| Name                          | Resource Group     | Location      | SKU      |
| ----------------------------- | ------------------ | ------------- | -------- |
| simontestservicebus-dev-sbs   | testing-deployment | swedencentral | Standard |
| sb-inv-001-ext-2216           | rg-inv-001-ext     | swedencentral | Standard |
| sbclsmetricsdev001            | rg-cls-metrics-dev | swedencentral | Standard |
| aisplatform-dev-messaging-bus | rg-demo-webinar    | westeurope    | ⚠️ Basic |

> **Note**: `aisplatform-dev-messaging-bus` uses **Basic SKU** which has limited features (no topics, no dead-letter).

---

## Function Apps

| Name                              | Resource Group                   | Location      | State   | App Insights |
| --------------------------------- | -------------------------------- | ------------- | ------- | ------------ |
| func-cls-metrics-dev-001          | rg-cls-metrics-dev               | swedencentral | Running | ❓ Unknown   |
| inv-001-ext-4894                  | rg-inv-001-ext                   | swedencentral | Running | ✓ Connected  |
| Contica-LASValidator-Function-dev | LogicAppStandardValidator-dev-rg | westeurope    | Running | ✓ Connected  |

---

## Key Vaults

| Name                  | Resource Group     | Location      |
| --------------------- | ------------------ | ------------- |
| kv-cls-metrics-dev001 | rg-cls-metrics-dev | swedencentral |

---

## Storage Accounts

| Name                 | Resource Group                   | Location      | SKU          | Public Access  |
| -------------------- | -------------------------------- | ------------- | ------------ | -------------- |
| demowebinarsa        | rg-demo-webinar                  | westeurope    | Standard_LRS | ⚠️ **ENABLED** |
| lasvalidatorfuncdev  | LogicAppStandardValidator-dev-rg | westeurope    | Standard_LRS | Disabled       |
| stclsmetricsdev001   | rg-cls-metrics-dev               | swedencentral | Standard_LRS | Disabled       |
| stclsmetricsrtdev001 | rg-cls-metrics-dev               | swedencentral | Standard_LRS | Disabled       |
| stinv001ext8101      | rg-inv-001-ext                   | swedencentral | Standard_LRS | Disabled       |

> **⚠️ Security Alert**: `demowebinarsa` has **public blob access enabled**. Review if this is intentional.

---

## Resource Distribution by Subscription

### AIS Platform Dev

- All 16 resources are in this subscription

### AIS Platform Prod

- No integration resources found

---

## Resource Groups

| Resource Group                     | Resources                                                 |
| ---------------------------------- | --------------------------------------------------------- |
| rg-demo-webinar                    | 4 (2 Logic Apps, 1 Service Bus, 1 Storage)                |
| rg-cls-metrics-dev                 | 4 (1 Service Bus, 1 Function App, 1 Key Vault, 2 Storage) |
| rg-inv-001-ext                     | 3 (1 Service Bus, 1 Function App, 1 Storage)              |
| cosi-member-adobe-0073.i001-dev-rg | 1 (1 Logic App)                                           |
| testing-deployment                 | 1 (1 Service Bus)                                         |
| LogicAppStandardValidator-dev-rg   | 2 (1 Function App, 1 Storage)                             |

---

## Initial Observations

### Security Concerns

1. **PUBLIC_BLOB_ACCESS**: Storage account `demowebinarsa` allows public blob access

### Architecture Notes

1. **Basic SKU Service Bus**: `aisplatform-dev-messaging-bus` uses Basic tier (consider upgrading for production use)
2. **No Managed APIM**: No API Management instances found
3. **Production Empty**: AIS Platform Prod subscription has no resources

### Tagging

- Most resources have **no tags** set
- This makes cost allocation and ownership tracking difficult

---

_Generated: 2026-02-12_
