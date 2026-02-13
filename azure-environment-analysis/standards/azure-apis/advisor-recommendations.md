# Azure Advisor Recommendations

This document describes how to query Azure Advisor for optimization recommendations.

---

## Overview

Azure Advisor provides personalized recommendations across five categories:
- **Cost** – Reduce spending, optimize utilization
- **Security** – Identify vulnerabilities (now links to Defender)
- **Reliability** – Improve availability and resilience
- **Operational Excellence** – Improve deployment and management
- **Performance** – Improve speed and responsiveness

---

## Querying Advisor Recommendations

### Azure Resource Graph Query

```kql
advisorresources
| where type == 'microsoft.advisor/recommendations'
| where properties.category in ('Cost', 'Security', 'HighAvailability', 'OperationalExcellence', 'Performance')
| extend
    category = tostring(properties.category),
    impact = tostring(properties.impact),
    impactedType = tostring(properties.impactedField),
    impactedValue = tostring(properties.impactedValue),
    shortDescription = tostring(properties.shortDescription.problem),
    recommendation = tostring(properties.shortDescription.solution),
    resourceId = tostring(properties.resourceMetadata.resourceId)
| project
    category,
    impact,
    impactedType,
    impactedValue,
    shortDescription,
    recommendation,
    resourceId
| order by category, impact desc
```

### Filter by Impact Level

```kql
advisorresources
| where type == 'microsoft.advisor/recommendations'
| where properties.impact == 'High'
| extend
    category = tostring(properties.category),
    shortDescription = tostring(properties.shortDescription.problem),
    resourceId = tostring(properties.resourceMetadata.resourceId)
| project category, shortDescription, resourceId
```

### Filter by Category

```kql
advisorresources
| where type == 'microsoft.advisor/recommendations'
| where properties.category == 'Security'
| extend
    impact = tostring(properties.impact),
    shortDescription = tostring(properties.shortDescription.problem),
    recommendation = tostring(properties.shortDescription.solution),
    resourceId = tostring(properties.resourceMetadata.resourceId)
| project impact, shortDescription, recommendation, resourceId
```

### Filter by Resource Type (Integration Resources)

```kql
advisorresources
| where type == 'microsoft.advisor/recommendations'
| where properties.impactedField in (
    'Microsoft.Web/sites',
    'Microsoft.Logic/workflows',
    'Microsoft.ServiceBus/namespaces',
    'Microsoft.ApiManagement/service',
    'Microsoft.KeyVault/vaults',
    'Microsoft.Storage/storageAccounts'
)
| extend
    category = tostring(properties.category),
    impact = tostring(properties.impact),
    impactedType = tostring(properties.impactedField),
    shortDescription = tostring(properties.shortDescription.problem),
    resourceId = tostring(properties.resourceMetadata.resourceId)
| project category, impact, impactedType, shortDescription, resourceId
```

---

## Using Azure CLI

```bash
# List all recommendations for a subscription
az advisor recommendation list --subscription <subscription-id> --output json

# Filter by category
az advisor recommendation list --category Security --output json

# Filter by resource group
az advisor recommendation list --resource-group <rg-name> --output json
```

---

## Using Azure MCP Server

The Azure MCP Server provides access to Advisor recommendations through the `advisor` tool:

```
# Tool: mcp_azure_mcp_ser_advisor
# Use this tool to query Advisor recommendations
```

---

## Relevant Recommendations for Integration Assessments

### Cost Recommendations

| Recommendation | Impact | Relevance |
|----------------|--------|-----------|
| Right-size underutilized VMs | High | App Service Plans |
| Delete unattached disks | Medium | Storage cleanup |
| Use reserved instances | High | Long-running resources |
| Deallocate idle resources | Medium | Dev/test environments |

### Security Recommendations

| Recommendation | Impact | Relevance |
|----------------|--------|-----------|
| Enable MFA for accounts | High | AAD accounts |
| Restrict network access | High | Storage, Key Vault |
| Enable encryption | High | Storage, databases |
| Use managed identities | Medium | App authentication |

### Reliability Recommendations

| Recommendation | Impact | Relevance |
|----------------|--------|-----------|
| Enable zone redundancy | High | Service Bus, Storage |
| Configure multiple replicas | High | APIM, databases |
| Enable backup | High | Data protection |
| Use availability zones | High | Production workloads |

### Performance Recommendations

| Recommendation | Impact | Relevance |
|----------------|--------|-----------|
| Scale up compute | Medium | Slow Logic Apps, Functions |
| Enable caching | Medium | API responses |
| Optimize queries | Medium | Database access |

---

## Reporting Format

```markdown
## Azure Advisor Recommendations

### Summary by Category

| Category | High Impact | Medium Impact | Low Impact | Total |
|----------|-------------|---------------|------------|-------|
| Cost | 3 | 5 | 2 | 10 |
| Security | 8 | 4 | 1 | 13 |
| Reliability | 2 | 3 | 0 | 5 |
| Performance | 1 | 2 | 1 | 4 |
| Operational Excellence | 0 | 2 | 3 | 5 |

### High Impact Recommendations

| Category | Problem | Solution | Affected Resource |
|----------|---------|----------|-------------------|
| Security | Public network access enabled | Restrict to private endpoints | sb-ps-common-prod |
| Security | Key Vault using access policies | Migrate to RBAC | kv-ps-secrets-prod |
| Cost | Underutilized App Service Plan | Right-size or delete | asp-ps-dev-infra |
| Reliability | No zone redundancy | Enable zone redundancy | sb-ps-common-prod |

### Recommendations by Resource Group

| Resource Group | Count | High Impact |
|----------------|-------|-------------|
| rg-integration-prod | 12 | 4 |
| rg-integration-dev | 8 | 1 |
| rg-shared-services | 5 | 2 |
```

---

## Integration with Assessment

During the assessment:

1. **Phase 1 (Discovery)**: Query Advisor for all recommendations in scope
2. **Phase 4 (Security Audit)**: Incorporate Security category recommendations
3. **Phase 6 (Monitoring Gaps)**: Check for Operational Excellence recommendations
4. **Phase 9 (Sales Opportunities)**: Cost recommendations → optimization services

---

## Notes

- Advisor recommendations refresh periodically (not real-time)
- Some recommendations may be suppressed/dismissed by the client
- Security recommendations now link to Microsoft Defender for Cloud
- Cost recommendations may include pricing suggestions
