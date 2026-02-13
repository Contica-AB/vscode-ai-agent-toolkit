# Naming & Tagging Compliance Report

**Assessment Date:** 2026-02-11  
**Client:** Contica AB DEMO new  
**SSOT Reference:** `/standards/contica-ssot/naming-convention.md`

---

## Executive Summary

| Metric                           | Value         |
| -------------------------------- | ------------- |
| **Naming Compliant**             | 8 of 19 (42%) |
| **Naming Partially Compliant**   | 6 of 19 (32%) |
| **Naming Non-Compliant**         | 5 of 19 (26%) |
| **Tag Coverage (Required Tags)** | 0%            |
| **Resources with ANY Tags**      | 3 of 19       |

**Assessment:** The environment has significant governance gaps. While some resources follow naming patterns, **no resources have the required tags** defined in SSOT standards.

---

## Required Tags (SSOT Standard)

| Tag               | Description                | Status         |
| ----------------- | -------------------------- | -------------- |
| `Owner`           | Team or person responsible | ❌ 0% coverage |
| `Environment`     | dev/test/staging/prod      | ❌ 0% coverage |
| `CostCenter`      | For cost allocation        | ❌ 0% coverage |
| `BusinessProcess` | Business capability        | ❌ 0% coverage |
| `ManagedBy`       | Deployment method          | ❌ 0% coverage |

**Finding:** Not a single resource has any required tags. This prevents:

- Cost allocation by business process
- Ownership accountability
- Environment classification for automation
- Deployment tracking

---

## Naming Compliance Analysis

### Naming Pattern: SSOT Standard

```
<resource-type>-<project>-<component>-<environment>[-<region>]
```

### Resource Analysis

#### ✅ Compliant (8 resources)

| Resource                 | Type             | Analysis                                  |
| ------------------------ | ---------------- | ----------------------------------------- |
| func-cls-metrics-dev-001 | Function App     | ✅ Correct prefix, environment, component |
| kv-cls-metrics-dev001    | Key Vault        | ✅ Correct prefix, project, environment   |
| asp-cls-metrics-dev-001  | App Service Plan | ✅ Correct prefix, project, environment   |
| sb-inv-001-ext-2216      | Service Bus      | ✅ Integration-style naming with number   |
| stclsmetricsdev001       | Storage Account  | ✅ Correct format (no hyphens required)   |
| stclsmetricsrtdev001     | Storage Account  | ✅ Correct format (no hyphens required)   |
| stinv001ext8101          | Storage Account  | ✅ Correct format (no hyphens required)   |
| acdb-cls-metrics-dev-001 | Cosmos DB        | ✅ Correct prefix, project, environment   |

#### ⚠️ Partially Compliant (6 resources)

| Resource                      | Type            | Issue                                  | Suggested Name                  |
| ----------------------------- | --------------- | -------------------------------------- | ------------------------------- |
| cosi-member-adobe-dev-logic   | Logic App       | Should use `logic` prefix              | `logic-cosi-member-adobe-dev`   |
| demo-webinar-la               | Logic App       | Missing project, informal name         | `logic-demo-webinar-dev`        |
| demo-upload-webinar-la        | Logic App       | Missing project, informal name         | `logic-demo-upload-webinar-dev` |
| inv-001-ext-4894              | Function App    | Uses `func` pattern but missing prefix | `func-inv-001-ext-4894`         |
| aisplatform-dev-messaging-bus | Service Bus     | Wrong prefix (should be `sb-`)         | `sb-aisplatform-messaging-dev`  |
| demowebinarsa                 | Storage Account | All lowercase, missing structure       | `stdemowebinardev`              |

#### ❌ Non-Compliant (5 resources)

| Resource                          | Type             | Issue                        | Suggested Name                    |
| --------------------------------- | ---------------- | ---------------------------- | --------------------------------- |
| simontestservicebus-dev-sbs       | Service Bus      | Personal name, wrong format  | `sb-{project}-{purpose}-dev`      |
| SwedenCentralPlan                 | App Service Plan | Wrong prefix, confusing name | `asp-{project}-swedencentral-dev` |
| sbclsmetricsdev001                | Service Bus      | Missing hyphens              | `sb-cls-metrics-dev-001`          |
| lasvalidatorfuncdev               | Storage Account  | Unclear purpose              | `stlasvalidatordevxxx`            |
| Contica-LASValidator-Function-dev | Function App     | Wrong prefix, mixed case     | `func-lasvalidator-dev`           |

---

## Tag Coverage Detail

### Resources by Tag Status

| Tag Status       | Count | Resources                                |
| ---------------- | ----- | ---------------------------------------- |
| No tags (null)   | 10    | Logic Apps, Connections, serverFarms     |
| Empty tags ({})  | 6     | Storage Accounts, Service Bus, Key Vault |
| System tags only | 3     | Function Apps (App Insights links only)  |
| Meaningful tags  | 0     | None                                     |

### Tags Found (Non-Required)

| Tag                       | Count | Purpose                            |
| ------------------------- | ----- | ---------------------------------- |
| `hidden-link:...`         | 2     | System-generated App Insights link |
| `defaultExperience`       | 1     | Cosmos DB system tag               |
| `hidden-cosmos-mmspecial` | 1     | Cosmos DB system tag               |
| `hidden-workload-type`    | 1     | Cosmos DB system tag               |

**Finding:** Only Cosmos DB has a meaningful tag (`hidden-workload-type: Development/Testing`) but it's a system tag not the required `Environment` tag.

---

## Resource Group Naming

| Resource Group                     | Environment | Compliant                      |
| ---------------------------------- | ----------- | ------------------------------ |
| rg-demo-webinar                    | dev         | ⚠️ Partially - missing project |
| rg-cls-metrics-dev                 | dev         | ⚠️ Partially - missing -001    |
| rg-inv-001-ext                     | dev         | ✅ Integration pattern         |
| cosi-member-adobe-0073.i001-dev-rg | dev         | ⚠️ Partially - unusual format  |
| LogicAppStandardValidator-dev-rg   | dev         | ❌ Wrong prefix format         |

---

## Environment Patterns Detected

Despite no explicit `Environment` tag, environment is (inconsistently) embedded in names:

| Pattern        | Count | Examples                             |
| -------------- | ----- | ------------------------------------ |
| `-dev` suffix  | 8     | func-cls-metrics-dev-001             |
| `-dev-` middle | 4     | aisplatform-dev-messaging-bus        |
| `dev` embedded | 3     | stclsmetricsdev001                   |
| No environment | 4     | demo-webinar-la, simontestservicebus |

**Recommendation:** Extract environment to tag and standardize naming.

---

## Recommendations

### Critical (Week 1)

| #   | Action                                                    | Impact                                     |
| --- | --------------------------------------------------------- | ------------------------------------------ |
| 1   | Add required tags to all resources                        | Enable cost allocation, ownership tracking |
| 2   | Create tag policy to prevent untagged resource deployment | Prevent future gaps                        |

### High Priority (Month 1)

| #   | Action                                                | Impact                |
| --- | ----------------------------------------------------- | --------------------- |
| 3   | Rename non-compliant resources during next deployment | Improve clarity       |
| 4   | Document exceptions for existing resources            | Governance tracking   |
| 5   | Create Azure Policy for naming convention             | Automated enforcement |

### Implementation Plan

#### Step 1: Add Required Tags (Bulk Update)

```powershell
# Add required tags to all resources in a resource group
$requiredTags = @{
    Owner = "Integration Team"
    Environment = "dev"
    CostCenter = "CC-Integration"
    BusinessProcess = "Demo"
    ManagedBy = "Manual"
}

Get-AzResource -ResourceGroupName "rg-demo-webinar" | ForEach-Object {
    $existingTags = $_.Tags
    if ($null -eq $existingTags) { $existingTags = @{} }
    $mergedTags = $existingTags + $requiredTags
    Set-AzResource -ResourceId $_.ResourceId -Tag $mergedTags -Force
}
```

#### Step 2: Create Tag Policy

```json
{
  "displayName": "Require Owner and Environment tags",
  "mode": "Indexed",
  "policyRule": {
    "if": {
      "anyOf": [
        { "field": "tags['Owner']", "exists": "false" },
        { "field": "tags['Environment']", "exists": "false" }
      ]
    },
    "then": {
      "effect": "deny"
    }
  }
}
```

---

## Compliance Matrix

### By Resource Type

| Type             | Naming Compliant | Tags Compliant |
| ---------------- | ---------------- | -------------- |
| Logic Apps       | 0/3 (0%)         | 0/3 (0%)       |
| Function Apps    | 1/3 (33%)        | 0/3 (0%)       |
| Service Bus      | 2/4 (50%)        | 0/4 (0%)       |
| Storage Accounts | 3/5 (60%)        | 0/5 (0%)       |
| Key Vault        | 1/1 (100%)       | 0/1 (0%)       |

### By Environment (Inferred)

| Environment | Resource Count | Naming | Tags |
| ----------- | -------------- | ------ | ---- |
| dev         | 19             | 42%    | 0%   |
| prod        | 0              | N/A    | N/A  |

---

## Priority Actions Summary

| Priority    | Action                           | Effort  | Impact |
| ----------- | -------------------------------- | ------- | ------ |
| 🔴 Critical | Add required tags                | 2 hours | High   |
| 🔴 Critical | Create tag policy                | 1 hour  | High   |
| 🟡 High     | Rename 5 non-compliant resources | 4 hours | Medium |
| 🟡 High     | Document naming exceptions       | 1 hour  | Low    |
| 🟢 Medium   | Create naming policy             | 2 hours | Medium |

---

## Quick Reference: Required Tag Template

```json
{
  "Owner": "Integration Team",
  "Environment": "dev | test | staging | prod",
  "CostCenter": "CC-001",
  "BusinessProcess": "Demo | CustomerSync | OrderProcessing",
  "ManagedBy": "Manual | Terraform | Bicep | ARM"
}
```

---

_Generated by Azure Integration Services Assessment Agent_
