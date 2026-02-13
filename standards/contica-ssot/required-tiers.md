# Contica SSOT - Required Resource Tiers

> **Source**: Synced from Confluence pages "Azure Integration Services Baseline", "Standard Security Baseline", and "Advanced Security Baseline" on 2026-02-11

This document defines the minimum required resource tiers per security option.

---

## Required Resource Tiers Overview

|              | API Management                             | Key Vault         | Service Bus              | Logic App | Function App              | Event Hub         | On-Prem Access                                     |
| ------------ | ------------------------------------------ | ----------------- | ------------------------ | --------- | ------------------------- | ----------------- | -------------------------------------------------- |
| **Standard** | Basic (Classic), Standard V2, Premium, Dev | Standard, Premium | Basic, Standard, Premium | Standard  | Premium, Flex Consumption | Standard, Premium | VPN Gateway IPSec Tunnel, On-Premises Data Gateway |
| **Advanced** | Premium, Dev                               | Standard, Premium | **Premium**              | Standard  | Premium, Flex Consumption | Standard, Premium | **VPN Gateway IPSec Tunnel**                       |

---

## Standard Security Option - Required Tiers

| Resource       | Allowed Tiers                                      | Notes                                               |
| -------------- | -------------------------------------------------- | --------------------------------------------------- |
| API Management | Basic (Classic), Standard V2, Premium, Developer   | Developer only for non-prod                         |
| Key Vault      | Standard, Premium                                  | Standard sufficient for most cases                  |
| Service Bus    | Basic, Standard, Premium                           | Basic lacks topics — use Standard+ if topics needed |
| Logic App      | Standard                                           | Consumption acceptable for simple, low-volume flows |
| Function App   | Premium, Flex Consumption                          | Flex Consumption is newer, cost-optimized           |
| Event Hub      | Standard, Premium                                  | Standard sufficient unless high throughput needed   |
| On-Prem Access | VPN Gateway IPSec Tunnel, On-Premises Data Gateway | OPDG for Logic Apps/Power Platform connectors       |

---

## Advanced Security Option - Required Tiers

| Resource       | Allowed Tiers                     | Notes                                                      |
| -------------- | --------------------------------- | ---------------------------------------------------------- |
| API Management | Premium, Developer (dev only)     | Premium required for Private Endpoints support             |
| Key Vault      | Standard, Premium                 | Premium if HSM-backed keys required                        |
| Service Bus    | **Premium only**                  | Premium required for private endpoints                     |
| Logic App      | Standard                          | Consumption not supported with private networking          |
| Function App   | Premium, Flex Consumption         | Premium required for VNet integration                      |
| Event Hub      | Standard, Premium                 | Premium for private endpoints                              |
| On-Prem Access | **VPN Gateway IPSec Tunnel only** | No On-Premises Data Gateway (runs through public internet) |

---

## Tier Capability Reference

### API Management Tiers

| Tier            | VNet Support      | Private Endpoint | Capacity Units | Use Case                    |
| --------------- | ----------------- | ---------------- | -------------- | --------------------------- |
| Consumption     | No                | No               | Per-request    | Dev/test, low volume        |
| Developer       | External only     | No               | 1              | Development, testing        |
| Basic (Classic) | No                | No               | 1-2            | Basic production            |
| Standard V2     | External          | No               | 1-10           | Standard production         |
| Premium         | Internal/External | Yes              | 1-12+          | Enterprise, private network |

### Service Bus Tiers

| Tier     | Topics Support | Private Endpoint | Throughput          | Use Case                    |
| -------- | -------------- | ---------------- | ------------------- | --------------------------- |
| Basic    | No             | No               | 100 ops/sec         | Simple queue-only scenarios |
| Standard | Yes            | No               | 1000 ops/sec        | Standard production         |
| Premium  | Yes            | Yes              | Variable (MU-based) | Enterprise, private network |

### Function App Tiers

| Tier             | VNet Integration | Private Endpoint | Scale        | Use Case                     |
| ---------------- | ---------------- | ---------------- | ------------ | ---------------------------- |
| Consumption      | No               | No               | Event-driven | Low-cost, intermittent       |
| Premium          | Yes              | Yes              | Pre-warmed   | Production, VNet required    |
| Flex Consumption | Yes              | Yes              | Event-driven | Cost-optimized, VNet capable |
| Dedicated (ASP)  | Yes              | Yes              | Manual/Auto  | Consistent workloads         |

### Key Vault Tiers

| Tier     | HSM-backed Keys | Private Endpoint | Transactions | Use Case              |
| -------- | --------------- | ---------------- | ------------ | --------------------- |
| Standard | No              | Yes              | 100K/10sec   | Most scenarios        |
| Premium  | Yes             | Yes              | 100K/10sec   | Regulatory/compliance |

---

## Agent Verification

The agent should check:

1. **Identify security option** from client config
2. **For each resource**, check if tier is in the allowed list
3. **Flag findings** for resources below minimum tier

### Example Checks

```bash
# Check APIM tier
az apim show --name <name> --resource-group <rg> --query "sku.name"

# Check Service Bus tier
az servicebus namespace show --name <name> --resource-group <rg> --query "sku.name"

# Check Function App tier
az functionapp show --name <name> --resource-group <rg> --query "sku.tier"
```

---

## Common Findings

| Finding                                        | Severity | Scenario                                  |
| ---------------------------------------------- | -------- | ----------------------------------------- |
| Service Bus Basic with Advanced security       | HIGH     | Basic cannot have private endpoints       |
| APIM Basic with VNet requirement               | HIGH     | Basic doesn't support VNet                |
| Function App Consumption with VNet requirement | MEDIUM   | Consumption has limited VNet support      |
| OPDG with Advanced security                    | MEDIUM   | OPDG traffic goes through public internet |

---

## Reporting Format

```markdown
## Resource Tier Assessment

### Security Option: {Standard / Advanced}

### Tier Compliance Summary

| Resource Type  | Compliant | Non-Compliant |
| -------------- | --------- | ------------- |
| API Management | 1         | 0             |
| Service Bus    | 1         | 1             |
| Function App   | 5         | 2             |
| Key Vault      | 3         | 0             |

### Non-Compliant Resources

| Resource         | Type         | Current Tier | Required Tier(s)        | Impact                          |
| ---------------- | ------------ | ------------ | ----------------------- | ------------------------------- |
| sb-basic-dev     | Service Bus  | Basic        | Premium (Advanced)      | Cannot enable private endpoints |
| func-consumption | Function App | Consumption  | Premium/Flex (Advanced) | Limited VNet support            |
```

---

## Exceptions

Some scenarios may have valid exceptions:

1. **Development environments**: May use lower tiers for cost
   - Document in client notes if intentional
2. **Migration in progress**: Resources being upgraded
   - Should have timeline for upgrade
3. **Cost constraints**: Client accepted risk
   - Document the risk acceptance

Always check `/clients/{client}/notes.md` for documented exceptions before flagging.
