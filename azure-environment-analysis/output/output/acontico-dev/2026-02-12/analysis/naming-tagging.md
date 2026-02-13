# Naming & Tagging Compliance Report

**Client**: Acontico Dev  
**Date**: 2026-02-12  
**Standard Reference**: `/standards/contica-ssot/naming-convention.md`

---

## Executive Summary

| Category           | Score      | Status                       |
| ------------------ | ---------- | ---------------------------- |
| Naming Compliance  | 31% (5/16) | 🔴 Non-Compliant             |
| Required Tags      | 0%         | 🔴 Critical                  |
| Overall Compliance | 15%        | 🔴 Needs Immediate Attention |

---

## Naming Convention Standard

Per Contica SSOT, the naming pattern should follow:

```
<resource-type>-<project>-<component/function>-<environment>[-<region>]
```

### Required Prefixes

| Resource Type   | Expected Prefix                   |
| --------------- | --------------------------------- |
| Logic App       | `logic`                           |
| Function App    | `func`                            |
| Service Bus     | `sb`                              |
| Key Vault       | `kv`                              |
| Storage Account | `st` (no hyphens, lowercase only) |

---

## Naming Compliance Analysis

### Logic Apps (3 resources)

| Resource Name               | Prefix OK? | Environment?    | Purpose Clear? | Rating              |
| --------------------------- | ---------- | --------------- | -------------- | ------------------- |
| demo-upload-webinar-la      | ❌ `demo-` | ❌ No           | ⚠️ Partial     | Non-Compliant       |
| demo-webinar-la             | ❌ `demo-` | ❌ No           | ⚠️ Partial     | Non-Compliant       |
| cosi-member-adobe-dev-logic | ❌ `cosi-` | ⚠️ `dev` at end | ✅ Yes         | Partially Compliant |

**Issues**:

- None use `logic-` prefix
- Environment indicator missing or misplaced
- `demo-*` suggests test/demo but not production convention

**Recommended Names**:
| Current | Suggested |
|---------|-----------|
| demo-upload-webinar-la | logic-demo-upload-webinar-dev |
| demo-webinar-la | logic-demo-webinar-dev |
| cosi-member-adobe-dev-logic | logic-cosi-adobe-member-dev |

---

### Service Bus Namespaces (4 resources)

| Resource Name                 | Prefix OK?          | Environment? | Purpose Clear?  | Rating              |
| ----------------------------- | ------------------- | ------------ | --------------- | ------------------- |
| simontestservicebus-dev-sbs   | ❌ Wrong prefix     | ✅ `-dev-`   | ❌ `simon test` | Non-Compliant       |
| sb-inv-001-ext-2216           | ✅ `sb-`            | ❌ No        | ⚠️ Cryptic ID   | Partially Compliant |
| sbclsmetricsdev001            | ⚠️ `sb` without `-` | ✅ `dev`     | ✅ Yes          | Partially Compliant |
| aisplatform-dev-messaging-bus | ❌ Wrong prefix     | ✅ `-dev-`   | ✅ Yes          | Non-Compliant       |

**Issues**:

- Mixed naming patterns across resources
- Personal names in resource names (`simon`)
- Cryptic numeric suffixes

**Recommended Names**:
| Current | Suggested |
|---------|-----------|
| simontestservicebus-dev-sbs | sb-test-simon-dev |
| sb-inv-001-ext-2216 | sb-inv-001-ext-dev |
| sbclsmetricsdev001 | sb-cls-metrics-dev |
| aisplatform-dev-messaging-bus | sb-platform-messaging-dev |

---

### Function Apps (3 resources)

| Resource Name                     | Prefix OK?      | Environment? | Purpose Clear? | Rating              |
| --------------------------------- | --------------- | ------------ | -------------- | ------------------- |
| func-cls-metrics-dev-001          | ✅ `func-`      | ✅ `-dev-`   | ✅ Yes         | ✅ Compliant        |
| inv-001-ext-4894                  | ❌ No prefix    | ❌ No        | ⚠️ Cryptic     | Non-Compliant       |
| Contica-LASValidator-Function-dev | ❌ Wrong format | ✅ `-dev`    | ✅ Yes         | Partially Compliant |

**Recommended Names**:
| Current | Suggested |
|---------|-----------|
| inv-001-ext-4894 | func-inv-001-ext-dev |
| Contica-LASValidator-Function-dev | func-lasvalidator-dev |

---

### Key Vaults (1 resource)

| Resource Name         | Prefix OK? | Environment? | Purpose Clear?   | Rating       |
| --------------------- | ---------- | ------------ | ---------------- | ------------ |
| kv-cls-metrics-dev001 | ✅ `kv-`   | ✅ `dev`     | ✅ `cls-metrics` | ✅ Compliant |

**Finding**: ✅ Key Vault follows naming convention.

---

### Storage Accounts (5 resources)

**Note**: Storage accounts require lowercase, no hyphens, max 24 characters.

| Resource Name        | Format OK?      | Environment? | Purpose Clear?    | Rating              |
| -------------------- | --------------- | ------------ | ----------------- | ------------------- |
| demowebinarsa        | ✅ Valid format | ❌ No        | ✅ `demo webinar` | Partially Compliant |
| lasvalidatorfuncdev  | ✅ Valid format | ✅ `dev`     | ✅ Yes            | ✅ Compliant        |
| stclsmetricsdev001   | ✅ `st` prefix  | ✅ `dev`     | ✅ Yes            | ✅ Compliant        |
| stclsmetricsrtdev001 | ✅ `st` prefix  | ✅ `dev`     | ⚠️ `rt` unclear   | Partially Compliant |
| stinv001ext8101      | ✅ `st` prefix  | ❌ No        | ⚠️ Cryptic ID     | Partially Compliant |

**Recommended Names**:
| Current | Suggested |
|---------|-----------|
| demowebinarsa | stdemowebinardev |
| stclsmetricsrtdev001 | stclsmetricsruntimedev |
| stinv001ext8101 | stinv001extdev |

---

## Naming Compliance Summary

| Rating                 | Count | Percentage |
| ---------------------- | ----- | ---------- |
| ✅ Compliant           | 5     | 31%        |
| ⚠️ Partially Compliant | 7     | 44%        |
| ❌ Non-Compliant       | 4     | 25%        |

---

## Tagging Compliance Analysis

### Required Tags (Per SSOT)

| Tag             | Required |
| --------------- | -------- |
| Owner           | YES      |
| Environment     | YES      |
| CostCenter      | YES      |
| BusinessProcess | YES      |
| ManagedBy       | YES      |

### Tag Coverage by Resource

| Resource                          | Owner | Environment | CostCenter | BusinessProcess | ManagedBy | Tags Present |
| --------------------------------- | ----- | ----------- | ---------- | --------------- | --------- | ------------ |
| demo-upload-webinar-la            | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| demo-webinar-la                   | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| cosi-member-adobe-dev-logic       | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| simontestservicebus-dev-sbs       | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| sb-inv-001-ext-2216               | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| sbclsmetricsdev001                | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| aisplatform-dev-messaging-bus     | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| func-cls-metrics-dev-001          | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| inv-001-ext-4894                  | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| Contica-LASValidator-Function-dev | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| kv-cls-metrics-dev001             | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| demowebinarsa                     | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| lasvalidatorfuncdev               | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| stclsmetricsdev001                | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| stclsmetricsrtdev001              | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |
| stinv001ext8101                   | ❌    | ❌          | ❌         | ❌              | ❌        | 0/5          |

### Tag Coverage Summary

| Tag             | Present | Missing | Coverage |
| --------------- | ------- | ------- | -------- |
| Owner           | 0       | 16      | 0%       |
| Environment     | 0       | 16      | 0%       |
| CostCenter      | 0       | 16      | 0%       |
| BusinessProcess | 0       | 16      | 0%       |
| ManagedBy       | 0       | 16      | 0%       |

**Finding**: ⚠️ **ZERO** resources have required tags. Complete tagging governance failure.

---

## Impact Analysis

### Missing Tags Impact

| Missing Tag     | Impact                                       |
| --------------- | -------------------------------------------- |
| Owner           | No accountability, unclear escalation path   |
| Environment     | Cannot filter dev vs prod resources          |
| CostCenter      | No cost allocation or chargeback possible    |
| BusinessProcess | Unknown business impact during outages       |
| ManagedBy       | Unknown if resource is IaC-managed or manual |

### Naming Issues Impact

| Issue                       | Impact                                |
| --------------------------- | ------------------------------------- |
| Inconsistent prefixes       | Difficult to find resources by type   |
| Missing environment         | Risk of dev/prod confusion            |
| Personal names in resources | Not portable, unclear ownership       |
| Cryptic IDs                 | Purpose unclear without documentation |

---

## Recommendations

### Immediate (High Priority)

1. **Apply required tags** to all resources using Azure Policy
2. **Document resource purposes** in a wiki or resource metadata
3. **Create Azure Policy** to enforce tagging on new resources

### Short-Term

4. **Rename non-compliant resources** (requires coordination for connected resources)
5. **Establish resource group naming** convention (`rg-<project>-<workload>-<env>`)
6. **Remove personal names** from resource names

### Long-Term

7. **Implement IaC** (Bicep/Terraform) with naming modules
8. **Audit tag compliance** quarterly
9. **Create naming convention documentation** for the team

---

## Azure Policy Recommendations

### Required Tag Policy

```json
{
  "if": {
    "field": "[concat('tags[', parameters('tagName'), ']')]",
    "exists": "false"
  },
  "then": {
    "effect": "deny"
  }
}
```

### Tag Inheritance Policy

Configure tag inheritance from resource groups to child resources.

---

## SSOT Compliance Score

| Criterion             | Weight | Score   |
| --------------------- | ------ | ------- |
| Naming Compliance     | 40%    | 31%     |
| Required Tags Present | 40%    | 0%      |
| Consistent Patterns   | 20%    | 44%     |
| **Weighted Total**    | 100%   | **18%** |

---

_Generated: 2026-02-12_
