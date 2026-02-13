# Security Audit Report

**Client**: Contica Final Test  
**Generated**: 2026-02-13  
**Subscription**: AIS Platform Dev (e074dd64-b0c6-459d-95be-8673743234f6)  
**Security Option**: Standard (inferred from resource configuration)

---

## Executive Summary

| Severity    | Finding Count | % of Total |
| ----------- | ------------- | ---------- |
| 🔴 CRITICAL | 3             | 15%        |
| 🔴 HIGH     | 8             | 40%        |
| ⚠️ MEDIUM   | 7             | 35%        |
| ℹ️ LOW      | 2             | 10%        |
| **Total**   | **20**        | 100%       |

### Security Score: **35/100 (POOR)**

### Top Critical Findings

1. **HTTP trigger without authentication** — cosi-member-adobe-dev-logic
2. **TLS 1.0 allowed on 2 Storage Accounts** — lasvalidatorfuncdev, stinv001ext8101
3. **SSH host key validation disabled** — SFTP connection (documented in Phase 2)

---

## Category 1: Authentication & Authorization

### 1.1 Managed Identity Usage

| Resource Type | Total | With MI | Without MI | MI Adoption        |
| ------------- | ----- | ------- | ---------- | ------------------ |
| Logic Apps    | 3     | 0       | 3          | 0% 🔴              |
| Function Apps | 3     | 1       | 2          | 33% ⚠️             |
| Service Bus   | 4     | N/A     | N/A        | Local auth enabled |
| Storage       | 5     | N/A     | N/A        | Shared key enabled |

#### Detailed Findings

| ID      | Resource                          | Type         | Finding                                             | Severity  |
| ------- | --------------------------------- | ------------ | --------------------------------------------------- | --------- |
| AUTH-01 | demo-upload-webinar-la            | Logic App    | No Managed Identity                                 | ⚠️ MEDIUM |
| AUTH-02 | demo-webinar-la                   | Logic App    | No Managed Identity                                 | ⚠️ MEDIUM |
| AUTH-03 | cosi-member-adobe-dev-logic       | Logic App    | No Managed Identity                                 | ⚠️ MEDIUM |
| AUTH-04 | inv-001-ext-4894                  | Function App | No Managed Identity                                 | ⚠️ MEDIUM |
| AUTH-05 | Contica-LASValidator-Function-dev | Function App | No Managed Identity                                 | ⚠️ MEDIUM |
| AUTH-06 | All Service Bus namespaces        | Service Bus  | Local auth NOT disabled (`disableLocalAuth: false`) | 🔴 HIGH   |

**Recommendation**: Enable Managed Identity on all Logic Apps and Function Apps. Disable local authentication on Service Bus namespaces when all consumers use Managed Identity.

---

### 1.2 RBAC Configuration

| Finding                                   | Count | Severity  |
| ----------------------------------------- | ----- | --------- |
| Owner role at subscription scope          | 2     | 🔴 HIGH   |
| Service Principals with broad Contributor | 5+    | ⚠️ MEDIUM |
| User Access Administrator at subscription | 1     | 🔴 HIGH   |

#### Subscription-Level Role Assignments (Security Concern)

| Principal                                | Role                      | Scope        | Severity  |
| ---------------------------------------- | ------------------------- | ------------ | --------- |
| ahmed.bayoumy@contica.se                 | Owner                     | Subscription | 🔴 HIGH   |
| Foreign Group (Crayon AB TenantAdmins)   | Owner                     | Subscription | 🔴 HIGH   |
| EID-SEC-PIM-Eligible-SB-AIS_Platform_Dev | User Access Administrator | Subscription | 🔴 HIGH   |
| 5+ Service Principals                    | Contributor               | Subscription | ⚠️ MEDIUM |

**Analysis**:

- ✅ Good: Use of PIM (Privileged Identity Management) groups visible
- ⚠️ Concern: Standing Owner assignments instead of JIT
- ⚠️ Concern: Multiple service principals with Contributor at subscription scope

**Recommendation**:

1. Convert standing Owner assignments to PIM-eligible roles
2. Scope Service Principal permissions to resource group level where possible
3. Review necessity of all service principal assignments

---

### 1.3 Key Vault Usage

| Key Vault             | RBAC Enabled | Soft Delete | Purge Protection | Public Access | Private Endpoint |
| --------------------- | ------------ | ----------- | ---------------- | ------------- | ---------------- |
| kv-cls-metrics-dev001 | ✅ Yes       | ✅ Yes      | ❌ No            | Enabled       | ❌ None          |

#### Findings

| ID    | Finding                       | Severity  | Remediation                            |
| ----- | ----------------------------- | --------- | -------------------------------------- |
| KV-01 | Purge protection not enabled  | ⚠️ MEDIUM | Enable purge protection for compliance |
| KV-02 | Public network access enabled | ⚠️ MEDIUM | Configure private endpoint or firewall |
| KV-03 | No network ACLs configured    | ⚠️ MEDIUM | Add IP restrictions for production     |

---

### 1.4 HTTP Trigger Authentication

| Logic App                   | Trigger Type | Authentication | Severity    |
| --------------------------- | ------------ | -------------- | ----------- |
| cosi-member-adobe-dev-logic | HTTP Request | ❌ None        | 🔴 CRITICAL |

**Finding**: The HTTP trigger has no authentication configured. The only protection is the SAS token embedded in the URL, which can be leaked.

**Impact**:

- Anyone with the URL can invoke the workflow
- No caller identity auditing
- No rate limiting per caller

**Recommendation**: Configure one of:

- Azure AD authentication (recommended)
- API Key (Basic tier)
- IP restrictions

---

## Category 2: Network Security

### 2.1 Private Endpoints

| Resource Type   | Total | With Private Endpoint | Without | Coverage |
| --------------- | ----- | --------------------- | ------- | -------- |
| Key Vault       | 1     | 0                     | 1       | 0% 🔴    |
| Service Bus     | 4     | 0                     | 4       | 0% 🔴    |
| Storage Account | 5     | 0                     | 5       | 0% 🔴    |
| Function Apps   | 3     | 0                     | 3       | 0% 🔴    |

**Finding**: Zero private endpoints configured across all integration resources.

| ID     | Finding                              | Severity |
| ------ | ------------------------------------ | -------- |
| NET-01 | No private endpoints in subscription | 🔴 HIGH  |

**Recommendation**: For production workloads, implement private endpoints for:

1. Key Vault (highest priority)
2. Service Bus namespaces
3. Storage accounts with sensitive data
4. Function Apps processing sensitive data

---

### 2.2 Public Network Access

| Resource                                    | Public Network | Firewall/ACL | Status |
| ------------------------------------------- | -------------- | ------------ | ------ |
| kv-cls-metrics-dev001 (Key Vault)           | Enabled        | None         | 🔴     |
| aisplatform-dev-messaging-bus (Service Bus) | Enabled        | None         | ⚠️     |
| simontestservicebus-dev-sbs (Service Bus)   | Enabled        | None         | ⚠️     |
| sb-inv-001-ext-2216 (Service Bus)           | Enabled        | None         | ⚠️     |
| sbclsmetricsdev001 (Service Bus)            | Enabled        | None         | ⚠️     |
| demowebinarsa (Storage)                     | Enabled        | None         | ⚠️     |
| lasvalidatorfuncdev (Storage)               | null           | None         | ⚠️     |
| stclsmetricsdev001 (Storage)                | ✅ Disabled    | N/A          | ✅     |
| stclsmetricsrtdev001 (Storage)              | ✅ Disabled    | N/A          | ✅     |
| stinv001ext8101 (Storage)                   | null           | None         | ⚠️     |

**Positive**: 2 storage accounts have public network access disabled.

---

### 2.3 IP Restrictions

| Resource Type | Resources Checked | With IP Restrictions | Without |
| ------------- | ----------------- | -------------------- | ------- |
| Logic Apps    | 3                 | 0                    | 3       |
| Function Apps | 3                 | 0                    | 3       |
| Service Bus   | 4                 | 0                    | 4       |
| Key Vault     | 1                 | 0                    | 1       |

| ID    | Finding                               | Severity  |
| ----- | ------------------------------------- | --------- |
| IP-01 | No Logic Apps have IP restrictions    | ⚠️ MEDIUM |
| IP-02 | No Function Apps have IP restrictions | ⚠️ MEDIUM |
| IP-03 | No Key Vault firewall configured      | 🔴 HIGH   |

---

## Category 3: Data Protection

### 3.1 TLS Configuration

| Resource                | Minimum TLS | Status      |
| ----------------------- | ----------- | ----------- |
| All Service Bus         | TLS 1.2     | ✅          |
| demowebinarsa           | TLS 1.2     | ✅          |
| stclsmetricsdev001      | TLS 1.2     | ✅          |
| stclsmetricsrtdev001    | TLS 1.2     | ✅          |
| **lasvalidatorfuncdev** | **TLS 1.0** | 🔴 CRITICAL |
| **stinv001ext8101**     | **TLS 1.0** | 🔴 CRITICAL |

| ID     | Finding                            | Severity    |
| ------ | ---------------------------------- | ----------- |
| TLS-01 | lasvalidatorfuncdev allows TLS 1.0 | 🔴 CRITICAL |
| TLS-02 | stinv001ext8101 allows TLS 1.0     | 🔴 CRITICAL |

**Impact**: TLS 1.0 is deprecated and vulnerable to POODLE and BEAST attacks.

**Recommendation**: Immediately upgrade minimum TLS version to 1.2 on both storage accounts.

---

### 3.2 HTTPS Enforcement

| Resource                          | HTTPS Only | Status  |
| --------------------------------- | ---------- | ------- |
| func-cls-metrics-dev-001          | ✅ Yes     | ✅      |
| inv-001-ext-4894                  | ❌ No      | 🔴 HIGH |
| Contica-LASValidator-Function-dev | ❌ No      | 🔴 HIGH |
| All Storage Accounts              | ✅ Yes     | ✅      |

| ID       | Finding                                                  | Severity |
| -------- | -------------------------------------------------------- | -------- |
| HTTPS-01 | inv-001-ext-4894 does not enforce HTTPS                  | 🔴 HIGH  |
| HTTPS-02 | Contica-LASValidator-Function-dev does not enforce HTTPS | 🔴 HIGH  |

---

### 3.3 Blob Public Access

| Storage Account      | Allow Blob Public Access | Status  |
| -------------------- | ------------------------ | ------- |
| demowebinarsa        | ✅ True                  | 🔴 HIGH |
| lasvalidatorfuncdev  | ❌ False                 | ✅      |
| stclsmetricsdev001   | ❌ False                 | ✅      |
| stclsmetricsrtdev001 | ❌ False                 | ✅      |
| stinv001ext8101      | ❌ False                 | ✅      |

| ID      | Finding                                 | Severity |
| ------- | --------------------------------------- | -------- |
| BLOB-01 | demowebinarsa allows blob public access | 🔴 HIGH  |

---

### 3.4 Secure Inputs/Outputs (Logic Apps)

Based on Phase 2 analysis, no Logic Apps use Secure Inputs/Outputs on sensitive actions.

| ID     | Finding                          | Severity  |
| ------ | -------------------------------- | --------- |
| SIO-01 | No Logic Apps use Secure Inputs  | ⚠️ MEDIUM |
| SIO-02 | No Logic Apps use Secure Outputs | ⚠️ MEDIUM |

---

## Category 4: Secrets Management

### 4.1 Hardcoded Secrets

| Logic App                   | Hardcoded Secrets Found | Status |
| --------------------------- | ----------------------- | ------ |
| demo-upload-webinar-la      | None detected           | ✅     |
| demo-webinar-la             | None detected           | ✅     |
| cosi-member-adobe-dev-logic | None detected           | ✅     |

**Analysis**: Logic App definitions were searched for patterns: `SharedAccessKey`, `Password`, `ConnectionString`, `AccountKey`, `api-key`, `secret`. No matches found.

**Note**: Credentials may still be stored in API Connection resources (checked in Phase 2 — all use connection string auth).

---

### 4.2 SFTP Security

| ID      | Finding                          | Severity    |
| ------- | -------------------------------- | ----------- |
| SFTP-01 | SSH host key validation disabled | 🔴 CRITICAL |

**Impact**: Without host key validation, the connection is vulnerable to man-in-the-middle attacks.

---

## Category 5: Monitoring & Auditing

### 5.1 Diagnostic Settings

| Resource Type | Checked | With Diagnostics | Without | Coverage   |
| ------------- | ------- | ---------------- | ------- | ---------- |
| Logic Apps    | 3       | 1 (partial)      | 2       | 33%        |
| Function Apps | 3       | Unknown          | Unknown | Unverified |
| Service Bus   | 4       | Unknown          | Unknown | Unverified |
| Key Vault     | 1       | Unknown          | Unknown | Unverified |

**Finding**: Diagnostic settings on `demo-upload-webinar-la` exist but have null workspace/storage destination.

| ID     | Finding                                     | Severity  |
| ------ | ------------------------------------------- | --------- |
| MON-01 | Diagnostic settings not properly configured | ⚠️ MEDIUM |
| MON-02 | No centralized logging strategy apparent    | ⚠️ MEDIUM |

---

### 5.2 Alert Rules

| Finding                          | Severity  |
| -------------------------------- | --------- |
| No metric alert rules configured | ⚠️ MEDIUM |

**Recommendation**: Configure alerts for:

1. Logic App failures
2. Service Bus dead-letter queue counts
3. Function App 5xx errors
4. Key Vault access anomalies

---

### 5.3 Log Analytics Workspaces

| Workspace                                             | Resource Group           | Retention | Status               |
| ----------------------------------------------------- | ------------------------ | --------- | -------------------- |
| managed-Contica-LASValidator-Function-dev-Insights-ws | Managed RG               | 30 days   | App Insights managed |
| DefaultWorkspace-...-SEC                              | DefaultResourceGroup-SEC | 30 days   | Default workspace    |

**Analysis**: Workspaces exist but are not being used by integration resources.

---

## Findings Summary by Severity

### 🔴 CRITICAL (3)

| ID      | Finding              | Resource                    | Remediation                        |
| ------- | -------------------- | --------------------------- | ---------------------------------- |
| TLS-01  | TLS 1.0 allowed      | lasvalidatorfuncdev         | Set minimumTlsVersion to TLS1_2    |
| TLS-02  | TLS 1.0 allowed      | stinv001ext8101             | Set minimumTlsVersion to TLS1_2    |
| HTTP-01 | No HTTP trigger auth | cosi-member-adobe-dev-logic | Configure Azure AD or API Key auth |

### 🔴 HIGH (8)

| ID       | Finding                  | Resource                          | Remediation                   |
| -------- | ------------------------ | --------------------------------- | ----------------------------- |
| AUTH-06  | Local auth enabled       | All Service Bus                   | Set disableLocalAuth to true  |
| RBAC-01  | Standing Owner role      | User accounts                     | Move to PIM eligible          |
| RBAC-02  | User Access Admin at sub | PIM Group                         | Verify necessary              |
| NET-01   | No private endpoints     | All resources                     | Implement private endpoints   |
| IP-03    | No Key Vault firewall    | kv-cls-metrics-dev001             | Configure network ACLs        |
| HTTPS-01 | HTTPS not enforced       | inv-001-ext-4894                  | Enable httpsOnly              |
| HTTPS-02 | HTTPS not enforced       | Contica-LASValidator-Function-dev | Enable httpsOnly              |
| BLOB-01  | Public blob access       | demowebinarsa                     | Disable allowBlobPublicAccess |

### ⚠️ MEDIUM (7)

| ID            | Finding             | Resource                    |
| ------------- | ------------------- | --------------------------- |
| AUTH-01 to 05 | No Managed Identity | Logic Apps, 2 Function Apps |
| KV-01         | No purge protection | kv-cls-metrics-dev001       |
| MON-01        | No alert rules      | Subscription                |

### ℹ️ LOW (2)

| ID     | Finding                         | Resource                 |
| ------ | ------------------------------- | ------------------------ |
| MON-02 | 30-day log retention            | Log Analytics workspaces |
| DOC-01 | No security documentation found | N/A                      |

---

## Compliance Gap Analysis

### Against Contica SSOT Baseline (Helium)

| Requirement                           | Current State  | Gap                              |
| ------------------------------------- | -------------- | -------------------------------- |
| Managed Identity for Azure connectors | 0% adoption    | 100% gap                         |
| TLS 1.2 minimum                       | 60% compliant  | 2 storage accounts non-compliant |
| Private endpoints for Key Vault       | Not configured | 100% gap                         |
| Diagnostic settings to Log Analytics  | Partial        | Incomplete                       |
| Alert rules for failures              | None           | 100% gap                         |

---

## Remediation Roadmap

### Immediate (Week 1)

| Priority | Action                                                        | Effort | Impact      |
| -------- | ------------------------------------------------------------- | ------ | ----------- |
| 1        | Upgrade TLS to 1.2 on lasvalidatorfuncdev and stinv001ext8101 | S      | 🔴 Critical |
| 2        | Enable HTTP trigger authentication                            | S      | 🔴 Critical |
| 3        | Enable HTTPS on 2 Function Apps                               | S      | 🔴 High     |
| 4        | Disable blob public access on demowebinarsa                   | S      | 🔴 High     |

### Short-term (Month 1)

| Priority | Action                                             | Effort | Impact    |
| -------- | -------------------------------------------------- | ------ | --------- |
| 5        | Enable Managed Identity on all Logic Apps          | M      | ⚠️ Medium |
| 6        | Enable Managed Identity on remaining Function Apps | M      | ⚠️ Medium |
| 7        | Configure Key Vault firewall                       | M      | 🔴 High   |
| 8        | Enable purge protection on Key Vault               | S      | ⚠️ Medium |

### Medium-term (Quarter 1)

| Priority | Action                                          | Effort | Impact    |
| -------- | ----------------------------------------------- | ------ | --------- |
| 9        | Implement private endpoints for Key Vault       | L      | 🔴 High   |
| 10       | Review and scope RBAC assignments               | M      | 🔴 High   |
| 11       | Configure diagnostic settings for all resources | M      | ⚠️ Medium |
| 12       | Create alert rules for failures                 | M      | ⚠️ Medium |

---

## Appendix: Data Collection Summary

### Commands Used

```powershell
# RBAC
az role assignment list --scope "/subscriptions/{sub}" --include-inherited

# Logic Apps
az logic workflow list --query "[].{identity, accessControl}"

# Function Apps
az functionapp list --query "[].{identity, httpsOnly, publicNetworkAccess}"

# Service Bus
az servicebus namespace list --query "[].{disableLocalAuth, publicNetworkAccess}"

# Storage
az storage account list --query "[].{minimumTlsVersion, allowBlobPublicAccess}"

# Key Vault
az keyvault show --name "..." --query "{enableRbacAuthorization, enablePurgeProtection}"

# Private Endpoints
az network private-endpoint list

# Alert Rules
az monitor metrics alert list
```

---

_Generated as part of Azure Integration Services Assessment_
