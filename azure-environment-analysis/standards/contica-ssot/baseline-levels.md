# Contica SSOT - Baseline Levels

> **Source**: Synced from Confluence page "Azure Integration Services Baseline" on 2026-02-11

This document defines the required Helium compliance levels per resource type.

---

## Applicability

This baseline applies to **all customers** of Contica. It serves as a guideline for developers when building solutions and architects designing new solutions. Resources created must meet the requirements of this baseline.

---

## Security Options

### Standard Security Option (Secure & Cost Effective)

- Goal: Good level of security while keeping cost and complexity low
- Resources must pass all checks in **Helium levels 1-3** for security

### Advanced Security Option (Highly Secure)

- Goal: High level of security with fully locked down private environment
- Resources must pass all checks in **Helium levels 1-5** for security

---

## Helium Baseline Levels by Resource Type

| Resource Type                    | Security (Standard) | Security (Advanced) | Best Practice     | Maintainability | Log & Alarm | Runtime |
| -------------------------------- | ------------------- | ------------------- | ----------------- | --------------- | ----------- | ------- |
| Storage Account                  | 3                   | 5                   | 1                 | 3               | 1           | 1       |
| Service Bus                      | 3                   | 5                   | N/A               | N/A             | N/A         | 2       |
| SQL Server                       | 3                   | 5                   | N/A               | N/A             | N/A         | 1       |
| API Management                   | 3                   | 5                   | N/A               | 3               | 1           | 3       |
| API Management API               | 3                   | 3                   | N/A               | 1               | N/A         | 3       |
| API Management Operation         | 3                   | 3                   | 2                 | N/A             | N/A         | 3       |
| Function App                     | 3                   | 5                   | 3                 | 1               | 1           | 1       |
| Logic App Site (Standard)        | 3                   | 5                   | N/A               | 3               | N/A         | 1       |
| Logic App Workflow (Standard)    | 3                   | 3                   | 4                 | 2               | 2           | 1       |
| Logic App Workflow (Consumption) | 3                   | 3                   | N/A               | N/A             | N/A         | N/A     |
| App Service (Web App)            | 3                   | 5                   | 3                 | N/A             | N/A         | 1       |
| Key Vault                        | 3                   | 5                   | N/A               | N/A             | N/A         | 1       |
| Application Insights             | 3                   | 3                   | N/A               | N/A             | N/A         | 1       |
| Data Factory                     | 3                   | 5                   | (with exceptions) | 3               | N/A         | 1       |

---

## Understanding the Levels

### Level Definitions

- **Level 1**: Focuses on fundamentals of security, considerations for availability and geo-redundancy
- **Level 2**: Involves managed identities and key vaults, along with considerations for scaling and performance
- **Level 3**: Addresses security, performance, and cost optimization ("Secure Public")
- **Level 4**: Centers on virtual networks, geo-redundancy, and high availability
- **Level 5**: Represents maximum security, performance, and availability

### Security Option Interpretation

- **Standard Security Option**: Minimum level is 3 — uses service endpoints and IP filtering
- **Advanced Security Option**: Minimum level is 5 — fully private networking with private endpoints

### N/A Interpretation

- **N/A** means no Helium checks exist for that category/resource combination
- The agent should **skip evaluation** for those categories
- Do NOT flag as a finding if a category is N/A

---

## Deviations from the Baseline

When a solution **diverges** from the established baseline:

- Risks must be acknowledged by either the customer or Contica
- Rationale must be documented by dismissing checks in Helium

Acceptable deviation scenarios:

1. Customer has opted to exclude specific features and accepted associated risks
2. A particular scenario is unsupported (e.g., connector doesn't support Managed Identity)

---

## Primary Assessment Categories (Helium)

- **Security**: Ensuring resources are fortified against potential threats
- **Best Practice**: Aligning resources with effective operational standards
- **Maintainability**: Evaluating how easily resources can be managed and updated
- **Log and Alarm**: Ensuring proper logging and alerting mechanisms
- **Runtime**: Assessing efficiency and performance during operation

---

## Agent Evaluation Guidance

For each resource, the agent should:

1. **Identify the client's security option** from `/clients/{client}/config.json` → `securityOption` field
2. **Look up the required level** from the table above
3. **Map Helium levels to Azure configuration checks** (see below)
4. **Report compliance status** as: Compliant / Below Baseline / N/A

### Example Configuration Checks by Level

#### Storage Account - Security

| Level | Configuration Requirements                 |
| ----- | ------------------------------------------ |
| 1     | Resource exists                            |
| 2     | HTTPS only enabled                         |
| 3     | TLS 1.2 enforced, secure transfer required |
| 4     | Network restrictions in place (VNet/IP)    |
| 5     | Private endpoint, public access disabled   |

#### Service Bus - Security

| Level | Configuration Requirements                                    |
| ----- | ------------------------------------------------------------- |
| 1     | Resource exists                                               |
| 2     | TLS 1.2 enforced                                              |
| 3     | Network restrictions or service endpoint                      |
| 4     | Managed Identity enabled, local auth considered               |
| 5     | Private endpoint, public access disabled, local auth disabled |

#### Function App - Security

| Level | Configuration Requirements                          |
| ----- | --------------------------------------------------- |
| 1     | Resource exists                                     |
| 2     | HTTPS only enforced                                 |
| 3     | Managed Identity enabled, VNet integration possible |
| 4     | VNet integration active, IP restrictions            |
| 5     | Private endpoint, public access disabled            |

#### Key Vault - Security

| Level | Configuration Requirements               |
| ----- | ---------------------------------------- |
| 1     | Resource exists                          |
| 2     | Soft delete enabled                      |
| 3     | Purge protection, RBAC mode              |
| 4     | Network restrictions in place            |
| 5     | Private endpoint, public access disabled |

---

## Reporting Format

When reporting SSOT compliance, use this format:

```markdown
## SSOT Baseline Compliance

| Resource Type   | Count | Compliant | Below Baseline | N/A |
| --------------- | ----- | --------- | -------------- | --- |
| Storage Account | 5     | 3         | 2              | 0   |
| Service Bus     | 2     | 2         | 0              | 0   |
| Function App    | 8     | 6         | 2              | 0   |

...

### Resources Below Baseline

| Resource     | Type            | Required Level | Current | Gap                      |
| ------------ | --------------- | -------------- | ------- | ------------------------ |
| st-prod-data | Storage Account | 5 (Advanced)   | 3       | Missing private endpoint |
```

---

## Notes

- The agent should always check the `securityOption` in client config to determine which column to use
- If `securityOption` is not set, default to **Standard** (column 2)
- For Data Factory "with exceptions" — check if the specific pipeline/activity has valid justification in client notes
