# Contica SSOT - Known Exceptions (Checks to Disable)

> **Source**: Synced from Confluence page "Azure Integration Services Baseline" (Checks to disable section) on 2026-02-11

This document lists checks that Contica deliberately disables or accepts as exceptions, along with the rationale. These are acceptable Helium check dismissals per resource type.

---

## Permanent Exceptions

These are architectural decisions or Azure limitations that create permanent exceptions to standard rules.

### 1. Function App Storage Connection String

| Item                  | Value                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Check**             | Connection strings should not be stored in app settings                                                                                                    |
| **Affected Resource** | Function App                                                                                                                                               |
| **Setting**           | `WEBSITE_CONTENTAZUREFILECONNECTIONSTRING` & `AzureWebJobsStorage`                                                                                         |
| **Reason**            | Azure runtime requirement. The Functions host requires these connection strings to access the storage account that stores function code and configuration. |
| **Alternative**       | Use Key Vault reference where possible: `@Microsoft.KeyVault(SecretUri=...)`                                                                               |
| **Status**            | Permanent – Azure platform limitation                                                                                                                      |

### 2. Logic Apps Standard Storage Connection String

| Item                  | Value                                                             |
| --------------------- | ----------------------------------------------------------------- |
| **Check**             | Connection strings should not be stored in app settings           |
| **Affected Resource** | Logic App Standard (ASE-based)                                    |
| **Setting**           | `AzureWebJobsStorage`, `WEBSITE_CONTENTAZUREFILECONNECTIONSTRING` |
| **Reason**            | Same as Function Apps – Azure runtime requirement.                |
| **Status**            | Permanent – Azure platform limitation                             |

### 3. Service Bus RootManageSharedAccessKey

| Item                  | Value                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| **Check**             | No shared access keys should exist                                                                 |
| **Affected Resource** | Service Bus Namespace                                                                              |
| **Setting**           | `RootManageSharedAccessKey`                                                                        |
| **Reason**            | Created automatically by Azure and cannot be deleted. Required for some administrative operations. |
| **Mitigation**        | Do not use this key in applications; use Managed Identity instead. Monitor for key usage.          |
| **Status**            | Permanent – Azure platform behavior                                                                |

### 4. Event Hub RootManageSharedAccessKey

| Item                  | Value                                        |
| --------------------- | -------------------------------------------- |
| **Check**             | No shared access keys should exist           |
| **Affected Resource** | Event Hub Namespace                          |
| **Setting**           | `RootManageSharedAccessKey`                  |
| **Reason**            | Same as Service Bus – automatically created. |
| **Status**            | Permanent – Azure platform behavior          |

### 5. Key Vault Firewall Bypass for Trusted Services

| Item                  | Value                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Check**             | Key Vault should have network restrictions                                                                             |
| **Affected Resource** | Key Vault                                                                                                              |
| **Setting**           | `bypass: AzureTrustedServices`                                                                                         |
| **Reason**            | Required for Azure services (Logic Apps, Functions, App Service) to access Key Vault secrets without VNet integration. |
| **Mitigation**        | Review which services are trusted; consider Private Endpoints for higher security.                                     |
| **Status**            | Permanent – Operational requirement                                                                                    |

### 6. Storage Account Firewall Bypass for Trusted Services

| Item                  | Value                                                        |
| --------------------- | ------------------------------------------------------------ |
| **Check**             | Storage should deny public network access                    |
| **Affected Resource** | Storage Account                                              |
| **Setting**           | `bypass: AzureServices`                                      |
| **Reason**            | Required for Azure services like Azure Monitor, Backup, etc. |
| **Status**            | Permanent – Operational requirement                          |

---

## Conditional Exceptions

These exceptions apply only under specific circumstances documented in client configuration.

### 1. APIM Developer Portal Public Access

| Item           | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| **Check**      | APIM should not have public network access                       |
| **Condition**  | Client explicitly uses Developer Portal for external partners    |
| **Config Key** | `customChecks.allowPublicDevPortal: true`                        |
| **Mitigation** | Ensure portal has proper AAD authentication; review exposed APIs |
| **Status**     | Conditional – Per client decision                                |

### 2. Logic App Consumption Public Access

| Item           | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| **Check**      | Resources should use Private Endpoints                         |
| **Condition**  | Logic App Consumption SKU (does not support Private Endpoints) |
| **Config Key** | N/A – Detected automatically by SKU                            |
| **Mitigation** | Use IP restrictions, authentication on triggers                |
| **Status**     | Conditional – SKU limitation                                   |

### 3. Function App Consumption Public Access

| Item           | Value                                     |
| -------------- | ----------------------------------------- |
| **Check**      | Function App should use Private Endpoints |
| **Condition**  | Consumption plan (limited VNet support)   |
| **Config Key** | N/A – Detected automatically by plan      |
| **Mitigation** | Use function keys, AAD authentication     |
| **Status**     | Conditional – Plan limitation             |

### 4. Self-Hosted Integration Runtime Connection String

| Item           | Value                                                   |
| -------------- | ------------------------------------------------------- |
| **Check**      | Connection strings should not be stored in Data Factory |
| **Condition**  | SHIR requires connection to on-premises systems         |
| **Config Key** | `customChecks.usesSelfHostedIR: true`                   |
| **Reason**     | SHIR communicates with ADF using built-in mechanism     |
| **Status**     | Conditional – Architecture requirement                  |

---

## Deprecated Exceptions

These exceptions were previously valid but are no longer accepted.

### 1. Service Bus Standard Tier for Production

| Item                   | Value                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| **Previous Exception** | Standard tier acceptable for low-volume production                     |
| **New Requirement**    | Premium tier required for production (per required-tiers.md)           |
| **Reason**             | Service Bus Premium now supports Private Endpoints, MI, and better SLA |
| **Migration**          | Upgrade to Premium tier                                                |
| **Status**             | ❌ No longer accepted                                                  |

### 2. Key Vault Access Policies

| Item                   | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Previous Exception** | Access policies acceptable if managed carefully          |
| **New Requirement**    | RBAC required (per azure-policies.md)                    |
| **Reason**             | RBAC provides better audit trail and granular control    |
| **Migration**          | Enable RBAC, migrate access policies to role assignments |
| **Status**             | ❌ No longer accepted                                    |

---

## Agent Behavior

When the agent encounters a check failure that matches a known exception:

### For Permanent Exceptions

1. **Do not report as HIGH severity** – Reduce to INFO or note as "Known Exception"
2. **Include in report** – Still document for visibility
3. **Check mitigations** – Verify the mitigation is in place (e.g., Key Vault reference used where possible)

### For Conditional Exceptions

1. **Check client config** – Is the condition documented?
2. **If documented**: Reduce severity, note as "Accepted Exception"
3. **If not documented**: Report as finding, recommend documenting or remediating

### For Deprecated Exceptions

1. **Report as finding** – This should be remediated
2. **Note previous status** – "Previously accepted, no longer valid"
3. **Include migration path** – How to remediate

---

## Reporting Format

```markdown
## Known Exception Findings

### Permanent Exceptions Encountered

| Resource                 | Exception                              | Mitigation Status            |
| ------------------------ | -------------------------------------- | ---------------------------- |
| func-001-crm-orders-prod | Function App storage connection string | ✅ Using Key Vault reference |
| func-002-erp-sync-prod   | Function App storage connection string | ❌ Plain connection string   |
| sb-ps-common-prod        | RootManageSharedAccessKey exists       | ✅ Not used by applications  |

### Conditional Exceptions

| Resource                   | Exception                    | Config Key           | Status                            |
| -------------------------- | ---------------------------- | -------------------- | --------------------------------- |
| logic-003-partner-api-prod | Logic App Consumption public | Auto-detected        | ⚠️ IP restrictions not configured |
| apim-ps-gateway-prod       | Developer Portal public      | allowPublicDevPortal | ✅ AAD authentication enabled     |

### Deprecated Exceptions Found

| Resource               | Previous Exception          | Required Action    |
| ---------------------- | --------------------------- | ------------------ |
| sb-legacy-prod         | Standard tier in production | Upgrade to Premium |
| kv-legacy-secrets-prod | Access policies             | Migrate to RBAC    |
```

---

## Adding New Exceptions

To add a new exception:

1. Document in this file with full rationale
2. Specify whether Permanent, Conditional, or time-limited
3. Include mitigation requirements
4. Update agent prompts to recognize the exception
5. Review quarterly – exceptions should not grow indefinitely
