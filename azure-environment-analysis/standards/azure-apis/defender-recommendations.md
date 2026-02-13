# Microsoft Defender for Cloud Recommendations

This document describes how to query Microsoft Defender for Cloud (formerly Azure Security Center) for security recommendations.

---

## Overview

Microsoft Defender for Cloud provides:
- **Security posture assessment** – Secure Score and recommendations
- **Threat protection** – Alerts and incident detection
- **Regulatory compliance** – Compliance against standards (CIS, PCI-DSS, etc.)

---

## Querying Defender Recommendations

### Azure Resource Graph - Security Recommendations

```kql
securityresources
| where type == 'microsoft.security/assessments'
| extend
    displayName = tostring(properties.displayName),
    status = tostring(properties.status.code),
    severity = tostring(properties.metadata.severity),
    description = tostring(properties.metadata.description),
    resourceId = tostring(properties.resourceDetails.Id)
| where status == 'Unhealthy'
| project displayName, severity, status, resourceId, description
| order by severity
```

### High Severity Recommendations

```kql
securityresources
| where type == 'microsoft.security/assessments'
| where properties.status.code == 'Unhealthy'
| where properties.metadata.severity == 'High'
| extend
    displayName = tostring(properties.displayName),
    resourceId = tostring(properties.resourceDetails.Id)
| project displayName, resourceId
```

### Filter by Resource Type (Integration Resources)

```kql
securityresources
| where type == 'microsoft.security/assessments'
| where properties.status.code == 'Unhealthy'
| extend
    displayName = tostring(properties.displayName),
    severity = tostring(properties.metadata.severity),
    resourceId = tostring(properties.resourceDetails.Id)
| where resourceId contains 'Microsoft.Web/sites'
    or resourceId contains 'Microsoft.Logic/workflows'
    or resourceId contains 'Microsoft.ServiceBus/namespaces'
    or resourceId contains 'Microsoft.ApiManagement/service'
    or resourceId contains 'Microsoft.KeyVault/vaults'
    or resourceId contains 'Microsoft.Storage/storageAccounts'
| project displayName, severity, resourceId
| order by severity
```

### Secure Score

```kql
securityresources
| where type == 'microsoft.security/securescores'
| extend
    displayName = tostring(properties.displayName),
    currentScore = todouble(properties.score.current),
    maxScore = todouble(properties.score.max),
    percentage = todouble(properties.score.percentage)
| project displayName, currentScore, maxScore, percentage
```

### Recommendations Summary by Category

```kql
securityresources
| where type == 'microsoft.security/assessments'
| extend
    category = tostring(properties.metadata.category),
    status = tostring(properties.status.code)
| summarize
    Healthy = countif(status == 'Healthy'),
    Unhealthy = countif(status == 'Unhealthy'),
    NotApplicable = countif(status == 'NotApplicable')
    by category
| order by Unhealthy desc
```

---

## Using Azure CLI

```bash
# List security assessments
az security assessment list --output json

# List security alerts
az security alert list --output json

# Get secure score
az security secure-score list --output json

# List security recommendations for a subscription
az security assessment list --subscription <subscription-id> --output json
```

---

## Key Security Recommendations for Integration

### Identity & Access

| Recommendation | Severity | Relevance |
|----------------|----------|-----------|
| MFA should be enabled | High | All accounts |
| Deprecated accounts should be removed | High | Security hygiene |
| External accounts with owner permissions | High | Privileged access |
| Service principals should not have owner role | High | Over-privileged apps |

### Data Protection

| Recommendation | Severity | Relevance |
|----------------|----------|-----------|
| Storage accounts should restrict network access | High | Data exposure |
| Storage accounts secure transfer | Medium | Data in transit |
| Key Vault should have soft delete enabled | Medium | Key protection |
| Key Vault should have purge protection | Medium | Key protection |

### Network Security

| Recommendation | Severity | Relevance |
|----------------|----------|-----------|
| Subnets should have NSG | High | Network segmentation |
| Public IP addresses should have DDoS protection | Medium | Availability |
| Private endpoints should be used | Medium | Data exposure |

### Application Security

| Recommendation | Severity | Relevance |
|----------------|----------|-----------|
| Function apps should use managed identity | Medium | Authentication |
| App Service should use HTTPS | High | Data in transit |
| Web apps should request SSL certificates | Medium | Client authentication |
| CORS should not allow every resource | Medium | API security |

---

## Regulatory Compliance

Query compliance against standards:

```kql
securityresources
| where type == 'microsoft.security/regulatorycompliancestandards'
| extend
    standardName = tostring(properties.standard),
    state = tostring(properties.state),
    passedControls = toint(properties.passedControls),
    failedControls = toint(properties.failedControls)
| project standardName, state, passedControls, failedControls
```

### Common Compliance Standards

| Standard | Relevance |
|----------|-----------|
| Azure CIS 1.4.0 | General security baseline |
| PCI DSS 4.0 | Payment card data |
| ISO 27001:2013 | Information security |
| SOC 2 Type 2 | Service organization controls |

---

## Reporting Format

```markdown
## Microsoft Defender for Cloud Assessment

### Secure Score

| Subscription | Current Score | Max Score | Percentage |
|--------------|---------------|-----------|------------|
| Production | 68 | 100 | 68% |
| Development | 55 | 100 | 55% |

### Recommendations Summary

| Severity | Unhealthy | Healthy | Not Applicable |
|----------|-----------|---------|----------------|
| High | 8 | 45 | 12 |
| Medium | 15 | 78 | 25 |
| Low | 5 | 42 | 18 |

### High Severity Security Findings

| Recommendation | Affected Resources | Category |
|----------------|-------------------|----------|
| MFA should be enabled for owner accounts | 3 accounts | Identity |
| Storage should restrict network access | 5 storage accounts | Data |
| Subnets should have NSG | 2 subnets | Network |
| Public IP should have DDoS protection | 4 public IPs | Network |

### Integration Resources Security Status

| Resource | Type | Unhealthy Recommendations |
|----------|------|---------------------------|
| func-001-crm-orders-prod | Function App | Not using managed identity |
| st-legacy-data | Storage | Public network access enabled |
| kv-ps-secrets-prod | Key Vault | Soft delete not enabled |

### Regulatory Compliance Summary

| Standard | Passed Controls | Failed Controls | Compliance % |
|----------|-----------------|-----------------|--------------|
| Azure CIS 1.4.0 | 85 | 15 | 85% |
| PCI DSS 4.0 | 120 | 30 | 80% |
```

---

## Integration with Assessment

During the assessment:

1. **Phase 1 (Discovery)**: Note Secure Score as baseline metric
2. **Phase 4 (Security Audit)**: Primary source for security findings
3. **Phase 8 (Report)**: Include Secure Score and top recommendations
4. **Phase 9 (Sales Opportunities)**: Security remediation services

---

## Notes

- Defender for Cloud requires specific plans enabled (may have cost)
- Some recommendations require Defender plans (enhanced security)
- Secure Score is per-subscription
- Recommendations may take time to update after remediation
- Cross-reference with SSOT security standards for prioritization
