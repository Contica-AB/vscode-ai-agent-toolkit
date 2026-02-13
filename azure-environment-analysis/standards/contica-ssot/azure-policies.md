# Contica SSOT - Azure Policies

> **Source**: Synced from Confluence page "Azure Integration Services Baseline" (Azure Policy section) on 2026-02-11

This document defines the Azure Policies that must be assigned at Management Group scope for Contica implementations.

---

## Required Azure Policies

These policies should be assigned at the Management Group level with **Deny** effect to prevent non-compliant deployments.

| Policy Definition                                                                         | Type     | Category       | Effect | Scope            |
| ----------------------------------------------------------------------------------------- | -------- | -------------- | ------ | ---------------- |
| APIM policies should inherit parent scope using `<base />`                                | Built-in | API Management | Deny   | Management Group |
| APIM subscriptions should not be scoped to all APIs                                       | Built-in | API Management | Deny   | Management Group |
| APIM APIs should use only encrypted protocols                                             | Built-in | API Management | Deny   | Management Group |
| APIM secret named values should be stored in Key Vault                                    | Built-in | API Management | Deny   | Management Group |
| APIM calls to backends should not bypass certificate thumbprint validation                | Built-in | API Management | Deny   | Management Group |
| APIM direct management API endpoint should be disabled                                    | Built-in | API Management | Deny   | Management Group |
| APIM minimum API version should be set to 2019-12-01 or higher                            | Built-in | API Management | Deny   | Management Group |
| App Service apps should only be accessible over HTTPS                                     | Built-in | App Service    | Deny   | Management Group |
| Function apps should only be accessible over HTTPS                                        | Built-in | App Service    | Deny   | Management Group |
| Function apps should have authentication enabled                                          | Built-in | App Service    | Audit  | Management Group |
| Key Vault should use RBAC permission model                                                | Built-in | Key Vault      | Deny   | Management Group |
| Key Vault secrets should have expiration date set                                         | Built-in | Key Vault      | Audit  | Management Group |
| Remove all auth rules except RootManageSharedAccessKey from Service Bus                   | Built-in | Service Bus    | Deny   | Management Group |
| Service Bus namespaces should use private link                                            | Built-in | Service Bus    | Audit  | Management Group |
| Remove all auth rules except RootManageSharedAccessKey from Event Hub                     | Built-in | Event Hub      | Deny   | Management Group |
| Secure transfer to storage accounts should be enabled                                     | Built-in | Storage        | Deny   | Management Group |
| Storage accounts should have minimum TLS version of 1.2                                   | Built-in | Storage        | Deny   | Management Group |
| Storage accounts should disable public network access                                     | Built-in | Storage        | Audit  | Management Group |
| Logic Apps Integration Service Environment should be encrypted with customer-managed keys | Built-in | Logic Apps     | Audit  | Management Group |
| Logic Apps should have diagnostics enabled                                                | Built-in | Logic Apps     | Audit  | Management Group |
| Resources should only use allowed locations                                               | Custom   | Governance     | Deny   | Management Group |
| Resource groups should only use allowed locations                                         | Custom   | Governance     | Deny   | Management Group |
| Allowed Resource Types                                                                    | Custom   | Governance     | Deny   | Management Group |
| Require tag on resources                                                                  | Custom   | Governance     | Deny   | Management Group |

---

## Policy Details

### API Management Policies

#### APIM policies should inherit parent scope using `<base />`

- **Purpose**: Ensures API policies inherit from product/global scope
- **Risk if missing**: Policies may be incomplete, security policies bypassed
- **Check**: API-level policies should include `<base />` element

#### APIM subscriptions should not be scoped to all APIs

- **Purpose**: Prevents overly permissive subscription keys
- **Risk if missing**: Single key grants access to all APIs
- **Check**: Subscription scope should be API or Product, not "all"

#### APIM APIs should use only encrypted protocols

- **Purpose**: Enforces HTTPS-only for API traffic
- **Risk if missing**: Sensitive data transmitted over HTTP
- **Check**: API protocols should only include "https"

#### APIM secret named values should be stored in Key Vault

- **Purpose**: Prevents secrets stored in plain text
- **Risk if missing**: Secrets visible in APIM configuration
- **Check**: Named values with secret flag should use Key Vault reference

#### APIM calls to backends should not bypass cert validation

- **Purpose**: Ensures TLS certificate validation
- **Risk if missing**: Man-in-the-middle attacks possible
- **Check**: Backend configuration should not disable cert validation

### App Service / Function App Policies

#### Apps should only be accessible over HTTPS

- **Purpose**: Enforces HTTPS-only access
- **Risk if missing**: Credentials/data sent over HTTP
- **Check**: httpsOnly should be true

### Key Vault Policies

#### Key Vault should use RBAC permission model

- **Purpose**: Enables granular, auditable access control
- **Risk if missing**: Access policies are coarse-grained
- **Check**: enableRbacAuthorization should be true

### Service Bus / Event Hub Policies

#### Remove all auth rules except RootManageSharedAccessKey

- **Purpose**: Limits shared access keys, promotes MI usage
- **Risk if missing**: Multiple access keys increase attack surface
- **Check**: Only RootManageSharedAccessKey should exist

### Storage Policies

#### Secure transfer should be enabled

- **Purpose**: Enforces HTTPS for storage operations
- **Risk if missing**: Data in transit exposure
- **Check**: supportsHttpsTrafficOnly should be true

#### Minimum TLS version

- **Purpose**: Enforces TLS 1.2 or higher
- **Risk if missing**: Older TLS versions have vulnerabilities
- **Check**: minimumTlsVersion should be TLS1_2

### Governance Policies

#### Allowed locations

- **Purpose**: Restricts deployments to approved regions
- **Risk if missing**: Data residency violations
- **Check**: Resources should be in allowed region list

#### Allowed resource types

- **Purpose**: Prevents deployment of unsanctioned services
- **Risk if missing**: Shadow IT, ungoverned resources
- **Check**: Resource types should be in allowed list

---

## Agent Verification

The agent should verify policy compliance by:

### 1. Check Policy Assignments

```bash
# List policy assignments at subscription level
az policy assignment list --subscription <id> --output json

# List policy assignments at management group level (if accessible)
az policy assignment list --scope /providers/Microsoft.Management/managementGroups/<mg-id>
```

### 2. Check Policy Compliance State

```bash
# Get policy compliance summary
az policy state summarize --subscription <id> --output json
```

### 3. Cross-Reference with Required Policies

Compare the assigned policies against this document:

- Which required policies are assigned?
- Which are missing?
- What's the compliance percentage per policy?

---

## Reporting Format

```markdown
## Azure Policy Assessment

### Policy Assignment Summary

| Status                     | Count |
| -------------------------- | ----- |
| Required policies assigned | 12/15 |
| Missing policies           | 3     |
| Compliance rate (assigned) | 89%   |

### Policy Assignment Status

| Policy                                    | Assigned | Compliance | Notes                     |
| ----------------------------------------- | -------- | ---------- | ------------------------- |
| APIM policies should inherit parent scope | ✅       | 100%       |                           |
| APIM subscriptions not scoped to all APIs | ✅       | 85%        | 2 resources non-compliant |
| APIM APIs use only encrypted protocols    | ✅       | 100%       |                           |
| Key Vault should use RBAC                 | ❌       | N/A        | Policy not assigned       |
| Secure transfer for storage               | ✅       | 100%       |                           |
| Minimum TLS version for storage           | ✅       | 95%        | 1 resource non-compliant  |

### Missing Policies

| Policy                    | Impact                             | Recommendation                      |
| ------------------------- | ---------------------------------- | ----------------------------------- |
| Key Vault should use RBAC | Key Vaults may use access policies | Assign policy, migrate existing KVs |

### Non-Compliant Resources

| Resource  | Policy                   | Compliance State | Details                         |
| --------- | ------------------------ | ---------------- | ------------------------------- |
| apim-dev  | APIM subscriptions scope | Non-compliant    | Subscription scoped to all APIs |
| st-legacy | Minimum TLS version      | Non-compliant    | TLS1_0 configured               |
```

---

## Notes

- Policy assignment at Management Group level is preferred (applies to all subscriptions)
- Custom policies may need to be created/deployed first
- Some policies have parameters (e.g., allowed locations list)
- Non-compliance may be due to exemptions — check for documented exceptions
- If the agent cannot access Management Group scope, note this as a limitation
