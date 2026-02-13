# Azure Policy Compliance

This document describes how to query Azure Policy compliance state for assessment purposes.

---

## Overview

Azure Policy compliance shows:
- Which resources comply with assigned policies
- Non-compliant resources and the specific policy violated
- Exemptions and their reasons

---

## Querying Policy Compliance

### Azure Resource Graph - Compliance Summary

```kql
policyresources
| where type == 'microsoft.policyinsights/policystates'
| where properties.complianceState == 'NonCompliant'
| extend
    policyDefinitionName = tostring(properties.policyDefinitionName),
    policyDefinitionId = tostring(properties.policyDefinitionId),
    resourceId = tostring(properties.resourceId),
    resourceType = tostring(properties.resourceType),
    resourceGroup = tostring(properties.resourceGroup)
| project
    policyDefinitionName,
    resourceId,
    resourceType,
    resourceGroup
| summarize count() by policyDefinitionName
| order by count_ desc
```

### Non-Compliant Resources by Policy

```kql
policyresources
| where type == 'microsoft.policyinsights/policystates'
| where properties.complianceState == 'NonCompliant'
| extend
    policyDefinitionName = tostring(properties.policyDefinitionName),
    resourceId = tostring(properties.resourceId),
    resourceType = tostring(properties.resourceType)
| project policyDefinitionName, resourceId, resourceType
| order by policyDefinitionName
```

### Filter by Resource Type (Integration Resources)

```kql
policyresources
| where type == 'microsoft.policyinsights/policystates'
| where properties.complianceState == 'NonCompliant'
| where properties.resourceType in (
    'Microsoft.Web/sites',
    'Microsoft.Logic/workflows',
    'Microsoft.ServiceBus/namespaces',
    'Microsoft.ApiManagement/service',
    'Microsoft.KeyVault/vaults',
    'Microsoft.Storage/storageAccounts'
)
| extend
    policyDefinitionName = tostring(properties.policyDefinitionName),
    resourceId = tostring(properties.resourceId),
    resourceType = tostring(properties.resourceType)
| project policyDefinitionName, resourceId, resourceType
```

### Compliance Summary by Policy Definition

```kql
policyresources
| where type == 'microsoft.policyinsights/policystates'
| extend
    complianceState = tostring(properties.complianceState),
    policyDefinitionName = tostring(properties.policyDefinitionName)
| summarize
    Compliant = countif(complianceState == 'Compliant'),
    NonCompliant = countif(complianceState == 'NonCompliant'),
    Exempt = countif(complianceState == 'Exempt')
    by policyDefinitionName
| extend ComplianceRate = round(100.0 * Compliant / (Compliant + NonCompliant), 1)
| order by NonCompliant desc
```

---

## Using Azure CLI

```bash
# Get policy compliance summary for subscription
az policy state summarize --subscription <subscription-id> --output json

# List non-compliant resources
az policy state list --filter "complianceState eq 'NonCompliant'" --output json

# List compliant resources for a specific policy
az policy state list --policy-definition <policy-definition-name> --output json

# Get policy assignments
az policy assignment list --subscription <subscription-id> --output json
```

---

## Using Azure MCP Server

The Azure MCP Server provides access to Policy through the `policy` tool:

```
# Tool: mcp_azure_mcp_ser_policy
# Use this tool to query policy assignments and compliance
```

---

## Key Policies for Integration Assessments

### Security Policies

| Policy | Expected State | Impact of Non-Compliance |
|--------|----------------|--------------------------|
| Key Vault should use RBAC | Compliant | Coarse access control |
| Storage secure transfer | Compliant | Data in transit exposure |
| APIM should use encrypted protocols | Compliant | Data exposure |
| Minimum TLS version | Compliant | Protocol vulnerabilities |

### Governance Policies

| Policy | Expected State | Impact of Non-Compliance |
|--------|----------------|--------------------------|
| Allowed locations | Compliant | Data residency violation |
| Allowed resource types | Compliant | Ungoverned resources |
| Required tags | Compliant | Governance gaps |

### Network Policies

| Policy | Expected State | Impact of Non-Compliance |
|--------|----------------|--------------------------|
| Deny public network access | Compliant | Attack surface |
| Require private endpoints | Compliant | Data exposure |

---

## Policy Exemptions

Query for exemptions to understand accepted risks:

```kql
policyresources
| where type == 'microsoft.policyinsights/policystates'
| where properties.complianceState == 'Exempt'
| extend
    policyDefinitionName = tostring(properties.policyDefinitionName),
    resourceId = tostring(properties.resourceId),
    exemptionCategory = tostring(properties.policyExemptionInfo.exemptionCategory)
| project policyDefinitionName, resourceId, exemptionCategory
```

---

## Reporting Format

```markdown
## Azure Policy Compliance

### Overall Compliance Summary

| Status | Count | Percentage |
|--------|-------|------------|
| Compliant | 234 | 87% |
| Non-Compliant | 28 | 10% |
| Exempt | 8 | 3% |

### Non-Compliant by Policy

| Policy | Non-Compliant Resources | Impact |
|--------|-------------------------|--------|
| Key Vault should use RBAC | 3 | High |
| Minimum TLS version | 2 | Medium |
| Required tags (Owner) | 15 | Low |
| Required tags (CostCenter) | 8 | Low |

### Non-Compliant Integration Resources

| Resource | Type | Policy Violated | Severity |
|----------|------|-----------------|----------|
| kv-legacy-secrets-prod | Key Vault | RBAC not enabled | High |
| st-legacy-data | Storage | TLS 1.0 allowed | Medium |
| func-old-service | Function App | Missing Owner tag | Low |

### Policy Exemptions

| Resource | Policy | Exemption Reason |
|----------|--------|------------------|
| kv-cicd-pipeline | Public access denied | CI/CD requires public access temporarily |

### Cross-Reference with SSOT

| SSOT Policy (azure-policies.md) | Assigned | Compliance Rate |
|---------------------------------|----------|-----------------|
| APIM policies inherit parent scope | ✅ | 100% |
| APIM subscriptions not scoped to all | ✅ | 85% |
| Key Vault should use RBAC | ❌ | N/A (not assigned) |
| Secure transfer for storage | ✅ | 100% |
```

---

## Integration with Assessment

During the assessment:

1. **Phase 1 (Discovery)**: Query all policy assignments in scope
2. **Phase 4 (Security Audit)**: Focus on security policy compliance
3. **Phase 7 (Naming & Tagging)**: Check tag-related policy compliance
4. **Cross-reference**: Compare with `/standards/contica-ssot/azure-policies.md`

---

## Notes

- Policy compliance state refreshes every 24 hours (or on-demand scan)
- Non-compliance doesn't mean the resource was created after policy - could be pre-existing
- Exemptions should have documented reasons
- Compare assigned policies against SSOT requirements
