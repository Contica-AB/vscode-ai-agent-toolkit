# Contica SSOT - Authentication Matrix

> **Source**: Synced from Confluence page "Azure Integration Services Baseline" on 2026-02-11

This document defines the required authentication methods between Azure resources. All connections between resources should utilize Managed Identity and Role-Based Access Control (RBAC) roles for authentication and authorization.

---

## Authentication Requirements Matrix

| Initializing Resource                                               | Target Resource                   | Managed Identity Required      | Optional Additional Auth            |
| ------------------------------------------------------------------- | --------------------------------- | ------------------------------ | ----------------------------------- |
| API Management                                                      | Logic App HTTP Trigger            | YES                            | Access key (Dual Auth Not Possible) |
| API Management                                                      | Function App HTTP Trigger         | YES                            | Function key                        |
| API Management                                                      | App Service                       | YES                            | None                                |
| API Management                                                      | Storage Account (Blob)            | YES                            | Access key                          |
| App Service                                                         | Application Insights              | YES                            | Instrumentation key                 |
| Function App                                                        | API Management                    | YES                            | Subscription key                    |
| Function App                                                        | Service Bus                       | YES                            | Access key                          |
| Function App                                                        | Application Insights              | YES                            | Instrumentation key                 |
| Function App Env Variable: AzureWebJobsStorage                      | Runtime Storage Account           | YES                            | Account key                         |
| Function App Env Variable: WEBSITE_CONTENTAZUREFILECONNECTIONSTRING | Runtime Storage Account           | NOT SUPPORTED                  | Account key (required)              |
| Logic App                                                           | API Management                    | YES                            | Subscription key                    |
| Logic App                                                           | Dynamics 365 API                  | YES                            | App registration                    |
| Logic App                                                           | Service Bus                       | YES                            | Access key                          |
| Logic App Env Variable: AzureWebJobsStorage                         | Runtime Storage Account           | YES                            | Account key                         |
| Logic App Env Variable: WEBSITE_CONTENTAZUREFILECONNECTIONSTRING    | Runtime Storage Account           | NOT SUPPORTED                  | Account key (required)              |
| Data Factory                                                        | Storage Account (Blob/File/Table) | YES                            | Access key                          |
| Data Factory                                                        | Function App HTTP Trigger         | YES                            | Function key                        |
| External Consumer (System)                                          | API Management (Any tier)         | Federated identity (preferred) | App registration                    |

---

## Authentication Rules

### Rule 1: System-Assigned MI is ALWAYS Preferred

- **System-assigned Managed Identity** is preferred over User-assigned MI
- System-assigned MI provides:
  - Automatic lifecycle management (deleted with resource)
  - Simpler RBAC setup (identity is 1:1 with resource)
  - Clearer audit trail
  - Prevents potential misuse of identity by other resources

### Rule 2: Where MI is Available, It MUST Be Used

- If a connection supports Managed Identity, it **MUST** be configured
- Fallback to keys/connection strings alone is a **security finding**
- Severity: **MEDIUM** (if MI available but not used) or **HIGH** (if hardcoded in code)

### Rule 3: Known Exceptions

The following are **NOT findings** because MI is genuinely not supported:

| Setting                                    | Reason                                                      |
| ------------------------------------------ | ----------------------------------------------------------- |
| `WEBSITE_CONTENTAZUREFILECONNECTIONSTRING` | Azure limitation — MI not supported for file share mounting |
| Function App consumption plan cold start   | Requires key-based access for runtime initialization        |

### Rule 4: Dual Authentication When Possible

Some connections support dual auth (MI + key):

- API Management → Function App: MI + Function Key ✅
- Logic App → Service Bus: MI + Access Key ✅
- Using dual auth is **recommended** but not required

---

## Agent Verification Checklist

The agent should verify authentication by checking:

### For Logic Apps

1. **Connections**: Check each API connection's authentication type
   - Look at connector configuration in workflow definition
   - Check for `authentication` property in HTTP actions
2. **Managed Identity**: Verify identity is enabled on the Logic App resource
3. **RBAC**: Confirm MI has appropriate role on target resource

### For Function Apps

1. **App Settings**: Check authentication-related settings
   - `AzureWebJobsStorage`: Acceptable to use connection string
   - `WEBSITE_CONTENTAZUREFILECONNECTIONSTRING`: Acceptable (known exception)
   - Other connection strings: Should use Key Vault references
2. **Managed Identity**: Verify identity is enabled
3. **RBAC**: Confirm MI has appropriate roles

### For API Management

1. **Backend Authentication**: Check backend configuration
   - Should show MI authentication configured
2. **Named Values**: Sensitive values should be Key Vault references
3. **Certificate Auth**: Where used, certs should be in Key Vault

### For Data Factory

1. **Linked Services**: Check authentication method
   - Should show MI where supported
2. **Integration Runtime**: Check managed identity settings

---

## RBAC Role Requirements

When MI is used, these are the minimum roles required:

| Target Resource         | Required Role                          | Notes                        |
| ----------------------- | -------------------------------------- | ---------------------------- |
| Storage Account (Blob)  | Storage Blob Data Contributor          | Or Reader if read-only       |
| Storage Account (Queue) | Storage Queue Data Contributor         |                              |
| Storage Account (Table) | Storage Table Data Contributor         |                              |
| Service Bus             | Azure Service Bus Data Sender/Receiver | Depends on operation         |
| Key Vault (Secrets)     | Key Vault Secrets User                 | For reading secrets          |
| Key Vault (Keys)        | Key Vault Crypto User                  | For cryptographic operations |
| SQL Database            | db_datareader / db_datawriter          | Via Azure AD auth            |

---

## Reporting Format

When reporting authentication findings, use:

```markdown
## Authentication Assessment

### Managed Identity Coverage

| Resource Type | With MI | Without MI | Coverage |
| ------------- | ------- | ---------- | -------- |
| Logic Apps    | 15      | 3          | 83%      |
| Function Apps | 8       | 2          | 80%      |
| Data Factory  | 1       | 1          | 50%      |

### Authentication Findings

| ID       | Severity | Resource    | Finding                                                   | Expected      | Actual                 |
| -------- | -------- | ----------- | --------------------------------------------------------- | ------------- | ---------------------- |
| AUTH-001 | MEDIUM   | func-orders | No Managed Identity                                       | MI enabled    | Disabled               |
| AUTH-002 | HIGH     | logic-sync  | Hardcoded connection string                               | Key Vault ref | Inline secret          |
| AUTH-003 | INFO     | logic-api   | WEBSITE_CONTENTAZUREFILECONNECTIONSTRING uses account key | Account key   | Account key (expected) |
```

---

## Notes

- Always check the client's `securityOption` — Advanced security may require stricter authentication
- Cross-reference with Key Vault usage — secrets should be in Key Vault, not in app settings
- Check RBAC role assignments to ensure MI actually has the permissions it needs
