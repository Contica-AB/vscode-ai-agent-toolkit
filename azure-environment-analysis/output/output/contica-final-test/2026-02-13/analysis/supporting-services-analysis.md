# Supporting Services Deep Dive

> **Client**: Contica Final Test  
> **Subscription**: AIS Platform Dev  
> **Analysis Date**: 2026-02-13

This analysis covers Key Vault, Storage Accounts, and other supporting services used by the integration resources.

---

## Key Vault Analysis

### Summary

| Metric           | Value  |
| ---------------- | ------ |
| Total Key Vaults | 1      |
| RBAC Enabled     | ✅ 1/1 |
| Soft Delete      | ✅ 1/1 |
| Purge Protection | ❌ 0/1 |

### Key Vault Inventory

| Key Vault             | Resource Group     | SKU      | Soft Delete | Purge Protection | RBAC |
| --------------------- | ------------------ | -------- | ----------- | ---------------- | ---- |
| kv-cls-metrics-dev001 | rg-cls-metrics-dev | Standard | ✅          | ❌               | ✅   |

---

### kv-cls-metrics-dev001

| Property              | Value              | Assessment                 |
| --------------------- | ------------------ | -------------------------- |
| Resource Group        | rg-cls-metrics-dev | ✅                         |
| SKU                   | Standard           | ✅ Appropriate for dev     |
| Location              | Sweden Central     | ✅                         |
| Soft Delete           | ✅ Enabled         | ✅                         |
| Purge Protection      | ❌ Not Enabled     | ⚠️ Enable for production   |
| RBAC Authorization    | ✅ Enabled         | ✅ Best practice           |
| Public Network Access | Enabled            | ⚠️ Should restrict in prod |
| Network ACLs          | Not Configured     | ⚠️ No restrictions         |
| Tags                  | ❌ None            | ⚠️ Missing                 |

#### Usage Analysis

This Key Vault is likely used by:

- `func-cls-metrics-dev-001` (same resource group)
- `sbclsmetricsdev001` Service Bus namespace
- `stclsmetricsdev001` Storage Account

#### Security Findings

| Severity  | Finding                       |
| --------- | ----------------------------- |
| ⚠️ MEDIUM | Purge protection not enabled  |
| ⚠️ MEDIUM | Public network access enabled |
| ℹ️ LOW    | No firewall rules configured  |

#### Recommendations

1. **Enable Purge Protection** - Prevents permanent deletion of secrets
2. **Add Network Restrictions** - Configure allowed networks or private endpoint
3. **Add Standard Tags** - Environment, Owner, Project

---

## Storage Account Analysis

### Summary

| Metric                      | Value         |
| --------------------------- | ------------- |
| Total Storage Accounts      | 5             |
| TLS 1.2+                    | 3/5 ❌        |
| Blob Public Access Disabled | 4/5 ✅        |
| HTTPS Only                  | 5/5 ✅        |
| Shared Key Access Enabled   | 1/5 confirmed |

### Storage Account Inventory

| Storage Account      | Resource Group                   | TLS    | Public Blob | Public Network  | HTTPS Only |
| -------------------- | -------------------------------- | ------ | ----------- | --------------- | ---------- |
| demowebinarsa        | rg-demo-webinar                  | 1.2 ✅ | ⚠️ True     | Enabled         | ✅         |
| lasvalidatorfuncdev  | LogicAppStandardValidator-dev-rg | 1.0 🔴 | False       | Unknown         | ✅         |
| stclsmetricsdev001   | rg-cls-metrics-dev               | 1.2 ✅ | False       | **Disabled** ✅ | ✅         |
| stclsmetricsrtdev001 | rg-cls-metrics-dev               | 1.2 ✅ | False       | **Disabled** ✅ | ✅         |
| stinv001ext8101      | rg-inv-001-ext                   | 1.0 🔴 | False       | Unknown         | ✅         |

---

### Detailed Storage Account Analysis

#### 1. demowebinarsa

**Role**: Used by demo webinar Logic Apps for invoice file storage

| Property              | Value           | Assessment            |
| --------------------- | --------------- | --------------------- |
| Resource Group        | rg-demo-webinar | ✅                    |
| SKU                   | Standard_LRS    | ⚠️ No redundancy      |
| TLS Version           | 1.2             | ✅                    |
| Blob Public Access    | ⚠️ **Enabled**  | 🔴 Security Risk      |
| Shared Key Access     | Enabled         | ⚠️ Consider disabling |
| Public Network Access | Enabled         | ⚠️                    |
| HTTPS Only            | ✅              | ✅                    |
| Tags                  | ❌ None         | ⚠️                    |

**Containers Used**:

- `/fakturor-sftp` - Source for invoices
- `/bankens-sftp` - Destination for processed invoices

**Security Findings**:

- 🔴 **HIGH**: Blob public access enabled - containers could be made publicly accessible
- ⚠️ MEDIUM: Shared key access enabled - applications can use storage keys

**Recommendations**:

1. Disable blob public access
2. Disable shared key access and use Managed Identity
3. Add network restrictions

---

#### 2. lasvalidatorfuncdev

**Role**: Storage for LAS Validator Function App

| Property           | Value                            | Assessment                    |
| ------------------ | -------------------------------- | ----------------------------- |
| Resource Group     | LogicAppStandardValidator-dev-rg | ✅                            |
| SKU                | Standard_LRS                     | ⚠️                            |
| TLS Version        | **1.0**                          | 🔴 **Critical Security Risk** |
| Blob Public Access | False                            | ✅                            |
| HTTPS Only         | ✅                               | ✅                            |
| Tags               | ❌ None                          | ⚠️                            |

**Security Findings**:

- 🔴 **CRITICAL**: TLS 1.0 enabled - vulnerable to known security exploits
- This is a Function App backing store

**Recommendations**:

1. **Immediately upgrade to TLS 1.2**
2. Review Function App configuration

---

#### 3. stclsmetricsdev001

**Role**: CLS Metrics solution storage

| Property              | Value              | Assessment           |
| --------------------- | ------------------ | -------------------- |
| Resource Group        | rg-cls-metrics-dev | ✅                   |
| SKU                   | Standard_LRS       | ⚠️                   |
| TLS Version           | 1.2                | ✅                   |
| Blob Public Access    | False              | ✅                   |
| Public Network Access | **Disabled**       | ✅ **Best Practice** |
| HTTPS Only            | ✅                 | ✅                   |
| Tags                  | ❌ None            | ⚠️                   |

**Assessment**: ✅ Best configured storage account - network access disabled

---

#### 4. stclsmetricsrtdev001

**Role**: CLS Metrics real-time storage

| Property              | Value              | Assessment           |
| --------------------- | ------------------ | -------------------- |
| Resource Group        | rg-cls-metrics-dev | ✅                   |
| SKU                   | Standard_LRS       | ⚠️                   |
| TLS Version           | 1.2                | ✅                   |
| Blob Public Access    | False              | ✅                   |
| Public Network Access | **Disabled**       | ✅ **Best Practice** |
| HTTPS Only            | ✅                 | ✅                   |
| Tags                  | ❌ None            | ⚠️                   |

**Assessment**: ✅ Well configured

---

#### 5. stinv001ext8101

**Role**: Integration worklog storage

| Property           | Value          | Assessment                    |
| ------------------ | -------------- | ----------------------------- |
| Resource Group     | rg-inv-001-ext | ✅                            |
| SKU                | Standard_LRS   | ⚠️                            |
| TLS Version        | **1.0**        | 🔴 **Critical Security Risk** |
| Blob Public Access | False          | ✅                            |
| HTTPS Only         | ✅             | ✅                            |
| Tags               | ❌ None        | ⚠️                            |

**Security Findings**:

- 🔴 **CRITICAL**: TLS 1.0 enabled

**Recommendations**:

1. **Immediately upgrade to TLS 1.2**

---

## Security Findings Summary

### Critical (Immediate Action Required)

| Resource            | Issue   | Impact                              |
| ------------------- | ------- | ----------------------------------- |
| lasvalidatorfuncdev | TLS 1.0 | Vulnerable to POODLE, BEAST attacks |
| stinv001ext8101     | TLS 1.0 | Vulnerable to POODLE, BEAST attacks |

### High Severity

| Resource      | Issue                      | Impact                          |
| ------------- | -------------------------- | ------------------------------- |
| demowebinarsa | Blob public access enabled | Containers could be made public |

### Medium Severity

| Resource              | Issue                     | Impact                               |
| --------------------- | ------------------------- | ------------------------------------ |
| kv-cls-metrics-dev001 | No purge protection       | Secrets could be permanently deleted |
| demowebinarsa         | Shared key access enabled | Keys could be compromised            |
| Multiple              | Public network access     | Exposed to internet                  |

---

## Recommendations Summary

### Priority 1 - Critical Security Fixes

| #   | Action                     | Resource            | Effort |
| --- | -------------------------- | ------------------- | ------ |
| 1   | Upgrade to TLS 1.2         | lasvalidatorfuncdev | Low    |
| 2   | Upgrade to TLS 1.2         | stinv001ext8101     | Low    |
| 3   | Disable blob public access | demowebinarsa       | Low    |

### Priority 2 - Security Hardening

| #   | Action                    | Resource              | Effort |
| --- | ------------------------- | --------------------- | ------ |
| 4   | Enable purge protection   | kv-cls-metrics-dev001 | Low    |
| 5   | Disable shared key access | demowebinarsa         | Medium |
| 6   | Add network restrictions  | kv-cls-metrics-dev001 | Medium |

### Priority 3 - Governance

| #   | Action                      | Resource           | Effort |
| --- | --------------------------- | ------------------ | ------ |
| 7   | Add standard tags           | All                | Low    |
| 8   | Document container purposes | Storage accounts   | Low    |
| 9   | Review SKU for redundancy   | All (Standard_LRS) | Medium |

---

## Network Security Posture

| Resource Type        | Private Endpoint | VNet Integration | Public Restricted |
| -------------------- | ---------------- | ---------------- | ----------------- |
| Key Vault            | ❌               | ❌               | ❌                |
| Storage (2 accounts) | ❌               | ❌               | ✅ Disabled       |
| Storage (3 accounts) | ❌               | ❌               | ❌                |

**Recommendation**: For production workloads, consider:

1. Private endpoints for Key Vault and Storage
2. VNet integration for Function Apps
3. Firewall rules restricting access to known IPs

---

_Analysis Date: 2026-02-13_
