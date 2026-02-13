# Access Requirements for Azure Integration Assessment

This document defines the minimum and recommended RBAC permissions required to perform a comprehensive Azure Integration Services assessment.

---

## Executive Summary

| Access Level | Scope | Use Case |
|--------------|-------|----------|
| Minimum | Subscription Reader | Basic inventory and configuration review |
| Recommended | Subscription Reader + specific roles | Full assessment including run history and secrets metadata |
| Full | Contributor (time-limited) | Assessment with remediation capabilities |

---

## Minimum Required Roles

These roles are **required** for the assessment to function. Without these, the assessment cannot proceed.

### Subscription Level

| Role | Purpose | Scope |
|------|---------|-------|
| **Reader** | Enumerate all resources, read configurations, view diagnostic settings | Target subscription(s) |

### Resource-Specific (if not using Subscription Reader)

| Resource Type | Minimum Role | Purpose |
|---------------|--------------|---------|
| Logic Apps | Logic App Operator | List workflows, view definitions, read run history |
| Service Bus | Azure Service Bus Data Receiver | Read queue/topic metadata, view dead-letter counts |
| Key Vault | Key Vault Reader | List secrets/keys/certificates (not read values) |
| Storage Accounts | Reader | View configuration, access policies |
| API Management | API Management Service Reader | View APIs, policies, subscriptions |
| Function Apps | Reader | View configuration, app settings structure |
| Log Analytics | Log Analytics Reader | Execute KQL queries for monitoring analysis |

---

## Recommended Roles

These roles enable **full assessment capabilities** including detailed failure analysis and monitoring queries.

### Subscription Level

| Role | Purpose |
|------|---------|
| **Reader** | Base resource enumeration |
| **Monitoring Reader** | Access to metrics, alerts, diagnostic settings |
| **Log Analytics Reader** | Execute KQL queries against Log Analytics workspaces |

### Resource-Specific Enhancements

| Resource Type | Recommended Role | Additional Capabilities |
|---------------|------------------|------------------------|
| Logic Apps | **Logic App Contributor** | Access run history details, action inputs/outputs, expression traces |
| Key Vault | **Key Vault Secrets User** | View secret metadata (not values) for rotation analysis |
| Service Bus | **Azure Service Bus Data Owner** | Full queue/topic inspection including message counts |
| Application Insights | **Application Insights Component Contributor** | Query telemetry, view application maps |

---

## Role Assignment Commands

### Assign Minimum Access (Reader)

```bash
# Get user/service principal object ID
USER_OBJECT_ID=$(az ad user show --id "assessor@domain.com" --query id -o tsv)

# Assign Reader at subscription scope
az role assignment create \
  --assignee $USER_OBJECT_ID \
  --role "Reader" \
  --scope "/subscriptions/{subscription-id}"
```

### Assign Recommended Access

```bash
# Reader + Monitoring Reader + Log Analytics Reader
az role assignment create --assignee $USER_OBJECT_ID --role "Reader" --scope "/subscriptions/{subscription-id}"
az role assignment create --assignee $USER_OBJECT_ID --role "Monitoring Reader" --scope "/subscriptions/{subscription-id}"
az role assignment create --assignee $USER_OBJECT_ID --role "Log Analytics Reader" --scope "/subscriptions/{subscription-id}"

# Logic App Contributor for specific resource groups
az role assignment create \
  --assignee $USER_OBJECT_ID \
  --role "Logic App Contributor" \
  --scope "/subscriptions/{subscription-id}/resourceGroups/{rg-name}"
```

### Assign via Service Principal (Automated)

```bash
# Create service principal with Reader role
az ad sp create-for-rbac \
  --name "contica-assessment-sp" \
  --role "Reader" \
  --scopes "/subscriptions/{subscription-id}" \
  --years 1
```

---

## Permission Validation Matrix

Use this matrix during preflight to validate access levels:

| Check | Command | Expected Result | If Fails |
|-------|---------|-----------------|----------|
| List Resource Groups | `az group list --subscription {sub}` | JSON array of RGs | No Reader access |
| List Logic Apps | `az logic workflow list --subscription {sub}` | JSON array of Logic Apps | No Logic App access |
| Get Logic App Definition | `az logic workflow show --name {name} --resource-group {rg}` | Workflow JSON | Insufficient Logic App role |
| List Logic App Runs | `az logic workflow-run list --workflow-name {name} --resource-group {rg}` | Run history array | Need Logic App Operator+ |
| Get Run Action Details | `az logic workflow-run-action show ...` | Action details | Need Logic App Contributor |
| List Service Bus Namespaces | `az servicebus namespace list --subscription {sub}` | Namespace array | No Service Bus access |
| List Key Vaults | `az keyvault list --subscription {sub}` | Key Vault array | No Key Vault access |
| List Key Vault Secrets | `az keyvault secret list --vault-name {name}` | Secret list (names only) | Need Key Vault Reader |
| Query Log Analytics | `az monitor log-analytics query ...` | Query results | Need Log Analytics Reader |

---

## Access Levels for Assessment Phases

| Phase | Minimum Access | Recommended Access | Notes |
|-------|----------------|-------------------|-------|
| 0 - Preflight | Reader | Reader | Validates environment |
| 1 - Discovery | Reader | Reader | Resource enumeration only |
| 2 - Logic Apps Deep Dive | Logic App Operator | Logic App Contributor | Contributor for action I/O |
| 3 - Failure Analysis | Logic App Operator | Logic App Contributor | Contributor for expression traces |
| 4 - Security Audit | Reader + Key Vault Reader | + Monitoring Reader | For diagnostic settings |
| 5 - Dead Flow Detection | Logic App Operator | Logic App Contributor | For run history analysis |
| 6 - Monitoring Gaps | Monitoring Reader | + Log Analytics Reader | For KQL queries |
| 7 - Naming/Tagging | Reader | Reader | Config review only |
| 8 - Report Generation | N/A | N/A | Uses collected data |
| 9 - Sales Opportunities | N/A | N/A | Uses collected data |

---

## Service Principal Configuration

For automated assessments, configure a service principal in the client config:

```json
{
  "authenticationType": "servicePrincipal",
  "servicePrincipal": {
    "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "secretLocation": "keyvault://contica-vault/assessment-sp-secret"
  }
}
```

**Security Requirements**:
- Never store client secrets in config files
- Use Key Vault references or environment variables
- Rotate service principal credentials every 90 days
- Use certificate-based authentication where possible

---

## Access Request Template

Use this template when requesting access from client IT teams:

```
Subject: Access Request for Azure Integration Assessment - {Client Name}

Dear IT Security Team,

Contica is conducting an Azure Integration Services assessment for {Client Name}. 
We require the following access to complete the assessment:

MINIMUM REQUIRED:
- Reader role at subscription scope for: {subscription-id-list}

RECOMMENDED (for full assessment):
- Logic App Contributor on resource groups: {rg-list}
- Log Analytics Reader at subscription scope
- Monitoring Reader at subscription scope

DURATION: {start-date} to {end-date} (recommend 2 weeks)

ACCESS METHOD:
[ ] User account: {assessor-email}
[ ] Service Principal (we will provide the App ID)

The assessment is read-only and will not modify any resources.
We will provide a detailed report of findings upon completion.

Please let us know if you have any questions.

Best regards,
{Assessor Name}
Contica Integration Consulting
```

---

## Troubleshooting Access Issues

### "AuthorizationFailed" Errors

```
The client '{object-id}' with object id '{object-id}' does not have authorization 
to perform action '{action}' over scope '{scope}'
```

**Resolution**: Request the specific role listed in the error message for the scope mentioned.

### "ForbiddenByRbac" on Key Vault

Key Vault uses both RBAC and Access Policies. Ensure:
1. RBAC role is assigned (Key Vault Reader), OR
2. Access Policy grants List permission for secrets/keys/certificates

### Logic App Run History Empty

If `az logic workflow-run list` returns empty but Logic Apps exist:
1. Verify Logic App Operator or higher role
2. Check if Logic Apps are in a different subscription
3. Verify the Logic App has actually been triggered (check portal)

### Log Analytics Query Fails

```
The provided credentials have insufficient access to perform the requested operation
```

**Resolution**: 
1. Assign Log Analytics Reader role at workspace scope
2. Verify workspace is in the target subscription
3. Check if workspace has RBAC access control enabled

---

## Compliance Notes

- All access should be **time-limited** (max 30 days for assessment)
- Document all access granted in the assessment report
- Remove access upon assessment completion
- Service principal credentials must be treated as confidential
- Assessment data must be stored securely per client data handling agreement
