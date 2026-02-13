# Contica SSOT - Naming Convention

> **Source**: Synced from Confluence page "Azure Naming Convention & Tagging" on 2026-02-11

This document defines Contica's naming convention and tagging requirements for Azure resources.

---

## Naming Structure

The standard naming pattern follows this structure:

```
<resource-type>-<project>-<component/function>-<environment>[-<region>]
```

### Components

| Component            | Description                           | Example                          |
| -------------------- | ------------------------------------- | -------------------------------- |
| `resource-type`      | Short abbreviation (see table below)  | `logic`, `func`, `sb`, `kv`      |
| `project`            | Project or customer abbreviation      | `contoso`, `sol`, `ps`           |
| `component/function` | What the resource does or contains    | `orders`, `api`, `common`        |
| `environment`        | Environment identifier                | `dev`, `test`, `staging`, `prod` |
| `region`             | Only if multi-region (MS short codes) | `weu`, `eus`, `neu`              |

### Integration-Specific Naming

For integrations with an assigned number:

```
<resource-type>-<integration-number>-<project>-<workload>-<environment>[-<region>]
```

| Component            | Description                      | Example                   |
| -------------------- | -------------------------------- | ------------------------- |
| `integration-number` | Official integration ID          | `001`, `002`, `015`       |
| `workload`           | The specific integration or flow | `ordersync`, `custupdate` |

---

## Resource Type Abbreviations

| Resource Type                    | Abbreviation | Example (Prod)                        |
| -------------------------------- | ------------ | ------------------------------------- |
| Logic App (Consumption/Standard) | `logic`      | `logic-001-crm-orders-prod`           |
| Integration Account              | `ia`         | `ia-001-crm-orders-prod`              |
| API Connection                   | `apic`       | `apic-001-crm-orders-prod`            |
| API Management                   | `apim`       | `apim-001-crm-gateway-prod`           |
| Service Bus Namespace            | `sb`         | `sb-ps-common-prod`                   |
| Service Bus Queue                | `sbq`        | `sbq-001-crm-orders-prod`             |
| Service Bus Topic                | `sbt`        | `sbt-001-crm-orders-prod`             |
| Event Grid Topic                 | `evgt`       | `evgt-001-crm-orders-prod`            |
| Event Hub Namespace              | `eh`         | `eh-ps-common-prod`                   |
| Data Factory                     | `adf`        | `adf-ps-common-prod`                  |
| Web App / App Service            | `app`        | `app-001-crm-orders-prod`             |
| Function App                     | `func`       | `func-001-crm-orders-prod`            |
| Storage Account                  | `st`         | `stpslasruntimedev` (special rules)   |
| Key Vault                        | `kv`         | `kv-ps-common-prod`                   |
| SQL Database Server              | `sql`        | `sql-ps-common-prod`                  |
| Cosmos DB Account                | `cosmos`     | `cosmos001crmordersprod` (no hyphens) |
| Data Lake Gen2                   | `dls`        | `dls001crmordersprod` (no hyphens)    |
| App Service Plan                 | `asp`        | `asp-ps-las-infra-prod`               |
| Container Registry               | `acr`        | `acr-ps-common-prod`                  |
| Kubernetes Service               | `aks`        | `aks-ps-common-prod`                  |
| Virtual Network                  | `vnet`       | `vnet-ps-common-prod`                 |
| Subnet                           | `snet`       | `snet-001-crm-int-prod`               |
| Network Security Group           | `nsg`        | `nsg-001-crm-int-prod`                |
| Public IP                        | `pip`        | `pip-001-crm-int-prod`                |
| Application Gateway              | `agw`        | `agw-001-crm-gateway-prod`            |
| Firewall                         | `afw`        | `afw-001-crm-int-prod`                |
| Private Endpoint                 | `pep`        | `pep-001-crm-int-prod`                |
| Resource Group                   | `rg`         | `rg-001-crm-int-prod`                 |
| Log Analytics Workspace          | `log`        | `log-ps-common-prod`                  |
| Application Insights             | `appi`       | `appi-ps-common-prod`                 |

---

## Special Naming Rules

### Storage Accounts

- **Globally unique**, lowercase + numbers only, **no hyphens or special characters**
- Maximum 24 characters
- Format: `st<project><purpose><environment>`
- Example: `stpslasruntimedev`, `stcrmordersblobprod`

### Cosmos DB & Data Lake

- **Globally unique**, lowercase + numbers only, **no hyphens**
- Format: `<type><integration><project><workload><environment>`
- Example: `cosmos001crmordersprod`, `dls001crmordersprod`

### Key Vault

- **Globally unique**, 3-24 characters
- Can only contain alphanumeric characters and hyphens
- Must start with a letter
- Example: `kv-ps-secrets-prod`

### Container Registry (ACR)

- **Globally unique**, 5-50 characters
- Alphanumeric only (no hyphens)
- Example: `acrpscommonprod`

### Multiple Resources for Same Integration

- Add letter suffix: `a`, `b`, `c`
- Example: `logic-002a-erp-sync-prod`, `logic-002b-erp-sync-prod`

### Shared/Project-Level Resources

- For resources shared across integrations (Storage, Service Bus NS, Event Hub NS, ASP, VNet, Key Vault):
- Use: `<type>-<project>-<purpose>-<environment>` (no integration number)
- Example: `sb-ps-common-prod`, `kv-ps-secrets-prod`, `asp-ps-las-infra-prod`

### Multi-Region Deployments

- Include region code only if deploying to multiple regions
- Use Microsoft short codes: `weu` (West Europe), `eus` (East US), `neu` (North Europe), `sea` (Southeast Asia)
- Example: `logic-001-crm-orders-prod-weu`

---

## Required Tags

Every resource MUST have these tags for proper governance and cost management:

| Tag               | Required | Example Values                      | Notes                                    |
| ----------------- | -------- | ----------------------------------- | ---------------------------------------- |
| `Owner`           | YES      | `Integration Team`, `Platform Team` | Team or individual responsible           |
| `Environment`     | YES      | `dev`, `test`, `staging`, `prod`    | Use consistent lowercase                 |
| `CostCenter`      | YES      | `12345`, `CC-Integration`           | For cost allocation and chargeback       |
| `BusinessProcess` | YES      | `OrderToCash`, `CustomerSync`       | Business process or capability supported |
| `ManagedBy`       | YES      | `Terraform`, `Bicep`, `Manual`      | How the resource is deployed/managed     |

### Optional Tags

| Tag                  | Description            | Example                              |
| -------------------- | ---------------------- | ------------------------------------ |
| `IntegrationId`      | The integration number | `INT-001`                            |
| `CreatedDate`        | Resource creation date | `2026-01-15`                         |
| `LastModified`       | Last modification date | `2026-02-10`                         |
| `Application`        | Application name       | `CRM`, `ERP`, `WMS`                  |
| `DataClassification` | Data sensitivity       | `Public`, `Internal`, `Confidential` |
| `CriticalityTier`    | Business criticality   | `Tier1`, `Tier2`, `Tier3`            |

---

## Agent Evaluation Rules

### Naming Compliance Check

For each resource, evaluate:

1. **Correct prefix?** — Does it use the correct abbreviation from the table?
2. **Includes environment?** — Is env clearly indicated (dev/test/qa/prod)?
3. **Purpose identifiable?** — Can you tell what the resource does from its name?
4. **Consistent pattern?** — Does it follow the same pattern as related resources?
5. **Follows special rules?** — Storage accounts without hyphens, etc.

### Tag Compliance Check

For each resource, verify:

1. **All required tags present?** — Owner, Environment, CostCenter, BusinessProcess
2. **Tag values consistent?** — Same environment value used across resources
3. **No placeholder values?** — Tags should have real values, not "TBD" or "N/A"

---

## Compliance Ratings

| Rating                  | Criteria                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| **Compliant**           | Correct prefix, includes environment, purpose clear, all tags present |
| **Partially Compliant** | 1-2 issues (e.g., missing one tag, minor naming deviation)            |
| **Non-Compliant**       | Multiple issues or critical problems                                  |

---

## Reporting Format

```markdown
## Naming & Tagging Compliance

### Naming Compliance Summary

| Rating              | Count | Percentage |
| ------------------- | ----- | ---------- |
| Compliant           | 45    | 75%        |
| Partially Compliant | 10    | 17%        |
| Non-Compliant       | 5     | 8%         |

### Non-Compliant Resources

| Resource     | Type        | Current Name   | Issue                | Suggested Name                         |
| ------------ | ----------- | -------------- | -------------------- | -------------------------------------- |
| logic1       | Logic App   | `logic1`       | Cryptic, no context  | `logic-001-{project}-{workload}-{env}` |
| myservicebus | Service Bus | `myservicebus` | Wrong prefix, no env | `sb-{project}-{purpose}-{env}`         |

### Tag Coverage

| Tag             | Present | Missing | Coverage |
| --------------- | ------- | ------- | -------- |
| Owner           | 55      | 5       | 92%      |
| Environment     | 58      | 2       | 97%      |
| CostCenter      | 40      | 20      | 67%      |
| BusinessProcess | 35      | 25      | 58%      |

### Resources Missing Required Tags

| Resource                  | Missing Tags                |
| ------------------------- | --------------------------- |
| logic-001-crm-orders-prod | CostCenter, BusinessProcess |
| func-002-erp-sync-dev     | Owner                       |
```

---

## Notes

- The naming convention supports Azure limits (most resources allow 1-128 characters)
- Storage accounts are the most restrictive (3-24 characters, lowercase + numbers only)
- Consistency within a client environment is more important than perfect adherence to the standard
- If a client has an existing convention, document deviations in `/clients/{client}/notes.md`
