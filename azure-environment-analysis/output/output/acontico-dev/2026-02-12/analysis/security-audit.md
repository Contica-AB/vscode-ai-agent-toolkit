# Security Audit Report

**Client**: Acontico Dev  
**Date**: 2026-02-12  
**Security Option**: Standard (per client config)  
**SSOT Baseline**: Helium Level 3 for Security

---

## Executive Summary

This security audit identified **2 HIGH**, **5 MEDIUM**, and **3 LOW** severity findings across the assessed resources. The most critical issues are:

1. **HTTP trigger without authentication** on `cosi-member-adobe-dev-logic`
2. **Public blob access enabled** on `demowebinarsa` storage account

---

## Findings Summary

| Severity  | Count | Description                                        |
| --------- | ----- | -------------------------------------------------- |
| 🔴 HIGH   | 2     | Critical security risks requiring immediate action |
| 🟡 MEDIUM | 5     | Security improvements recommended                  |
| 🟢 LOW    | 3     | Minor improvements or best practices               |

---

## HIGH Severity Findings

### H-01: Logic App HTTP Trigger Without Authentication

| Property           | Value                                                      |
| ------------------ | ---------------------------------------------------------- |
| **Resource**       | cosi-member-adobe-dev-logic                                |
| **Resource Group** | cosi-member-adobe-0073.i001-dev-rg                         |
| **Issue**          | HTTP trigger is publicly accessible without authentication |
| **Risk**           | Anyone with the URL can invoke this workflow               |
| **SSOT Violation** | Authentication Matrix requires MI or access keys           |

**Evidence**:

```json
"triggers": {
  "When_a_HTTP_request_is_received": {
    "kind": "Http",
    "type": "Request"
    // No authentication property
  }
}
```

**Remediation**:

1. Add SAS token authentication to the HTTP trigger
2. Or configure OAuth authentication via Azure AD
3. Or restrict access via IP filtering

---

### H-02: Storage Account Public Blob Access Enabled

| Property           | Value                                                    |
| ------------------ | -------------------------------------------------------- |
| **Resource**       | demowebinarsa                                            |
| **Resource Group** | rg-demo-webinar                                          |
| **Issue**          | `allowBlobPublicAccess` is set to `true`                 |
| **Risk**           | Containers can be configured for anonymous public access |
| **SSOT Violation** | Level 3 Security requires public access disabled         |

**Evidence**:

```json
{
  "publicAccess": true,
  "httpsOnly": true,
  "minimumTlsVersion": "TLS1_2"
}
```

**Remediation**:

1. Set `allowBlobPublicAccess` to `false`
2. Review all container access levels
3. Use SAS tokens or Managed Identity for access

---

## MEDIUM Severity Findings

### M-01: Logic Apps Using Connection Strings Instead of Managed Identity

| Property           | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Resources**      | demo-webinar-la, demo-upload-webinar-la                            |
| **Issue**          | API Connections use connection strings instead of Managed Identity |
| **Risk**           | Connection strings can be exposed or misconfigured                 |
| **SSOT Violation** | Authentication Matrix requires MI where available                  |

**Affected Connectors**:

- Azure Service Bus (supports MI)
- Azure Blob Storage (supports MI)

**Remediation**:

1. Enable System-Assigned Managed Identity on Logic Apps
2. Grant appropriate RBAC roles on target resources
3. Update connection configurations to use MI authentication

---

### M-02: Key Vault Without Network Restrictions

| Property           | Value                                              |
| ------------------ | -------------------------------------------------- |
| **Resource**       | kv-cls-metrics-dev001                              |
| **Resource Group** | rg-cls-metrics-dev                                 |
| **Issue**          | No network ACLs configured (networkAcls: null)     |
| **Risk**           | Key Vault is accessible from any network           |
| **SSOT Level 3**   | Requires network restrictions or private endpoints |

**Current Configuration**:

```json
{
  "enableRbacAuthorization": true,
  "enableSoftDelete": true,
  "enablePurgeProtection": null,
  "networkAcls": null
}
```

**Positive Notes**:

- ✓ RBAC authorization enabled (good)
- ✓ Soft delete enabled (good)

**Remediation**:

1. Configure Key Vault firewall rules
2. Allow only specific VNets or IP ranges
3. Consider private endpoint for Level 5 security

---

### M-03: Storage Accounts Without Network Restrictions

| Property         | Value                                        |
| ---------------- | -------------------------------------------- |
| **Resources**    | All 5 storage accounts                       |
| **Issue**        | Network rule default action is "Allow"       |
| **Risk**         | Storage accounts accessible from any network |
| **SSOT Level 3** | Requires network restrictions                |

**Remediation**:

1. Configure storage firewall rules
2. Allow only necessary VNets, services, or IP ranges
3. Use service endpoints or private endpoints

---

### M-04: Service Bus Basic SKU Limitations

| Property           | Value                                         |
| ------------------ | --------------------------------------------- |
| **Resource**       | aisplatform-dev-messaging-bus                 |
| **Resource Group** | rg-demo-webinar                               |
| **Issue**          | Using Basic SKU                               |
| **Risk**           | No dead-letter queues, no topics, no sessions |
| **Impact**         | Cannot implement reliable messaging patterns  |

**Remediation**:

1. Upgrade to Standard or Premium SKU for production workloads
2. Basic is acceptable only for development/testing

---

### M-05: SFTP Credentials in API Connection

| Property      | Value                                                        |
| ------------- | ------------------------------------------------------------ |
| **Resource**  | cosi-member-adobe-dev-logic                                  |
| **Connector** | SFTP with SSH                                                |
| **Issue**     | SFTP username/password stored in API Connection              |
| **Risk**      | Credentials could be viewed by anyone with connection access |

**Remediation**:

1. Store SFTP password in Key Vault
2. Use Key Vault reference in API Connection
3. Consider certificate-based authentication if supported

---

## LOW Severity Findings

### L-01: Key Vault Purge Protection Not Enabled

| Property     | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| **Resource** | kv-cls-metrics-dev001                                        |
| **Issue**    | `enablePurgeProtection` is not enabled                       |
| **Risk**     | Secrets could be permanently deleted during retention period |

**Remediation**:
Enable purge protection for production Key Vaults.

---

### L-02: No Diagnostic Settings Verified

| Property  | Value                                                      |
| --------- | ---------------------------------------------------------- |
| **Issue** | Diagnostic settings not verified for Key Vault and Storage |
| **Risk**  | Security events may not be logged                          |

**Remediation**:
Enable diagnostic settings to Log Analytics for:

- Key Vault audit events
- Storage account data plane logs
- Logic App run history

---

### L-03: Missing Tags for Security Classification

| Property  | Value                                                          |
| --------- | -------------------------------------------------------------- |
| **Issue** | Most resources have no tags                                    |
| **Risk**  | Cannot identify data classification or compliance requirements |

**Remediation**:
Add security-relevant tags:

- `data-classification` (public/internal/confidential)
- `compliance` (GDPR, ISO27001, etc.)
- `owner` (security contact)

---

## SSOT Compliance Summary

### Baseline Level 3 (Standard Security) Requirements

| Check                  | Storage | Service Bus | Key Vault | Logic Apps |
| ---------------------- | ------- | ----------- | --------- | ---------- |
| HTTPS Only             | ✓ Pass  | ✓ Pass      | ✓ Pass    | ✓ Pass     |
| TLS 1.2+               | ✓ Pass  | ✓ Pass      | ✓ Pass    | ✓ Pass     |
| Network Restrictions   | ❌ Fail | N/A         | ❌ Fail   | N/A        |
| Managed Identity       | ❌ Fail | ❌ Fail     | N/A       | ❌ Fail    |
| Public Access Disabled | ❌ Fail | ✓ Pass      | N/A       | ❌ Fail    |
| Soft Delete            | N/A     | N/A         | ✓ Pass    | N/A        |

**Overall Compliance**: 50% (5 of 10 applicable checks passing)

---

## Authentication Analysis

| Source                      | Target                      | Current Auth      | Required Auth       | Status |
| --------------------------- | --------------------------- | ----------------- | ------------------- | ------ |
| demo-webinar-la             | Azure Blob                  | Connection String | Managed Identity    | ❌     |
| demo-webinar-la             | Service Bus                 | Connection String | Managed Identity    | ❌     |
| demo-upload-webinar-la      | Azure Blob                  | Connection String | Managed Identity    | ❌     |
| demo-upload-webinar-la      | Service Bus                 | Connection String | Managed Identity    | ❌     |
| cosi-member-adobe-dev-logic | SFTP                        | Username/Password | Key Vault Reference | ⚠️     |
| External                    | cosi-member-adobe-dev-logic | None              | SAS/OAuth           | ❌     |

---

## Recommendations Priority

### Immediate (This Week)

1. Add authentication to HTTP trigger (H-01)
2. Disable public blob access (H-02)

### Short-term (Next 30 Days)

1. Enable Managed Identity on Logic Apps (M-01)
2. Configure Key Vault network restrictions (M-02)
3. Configure Storage firewall rules (M-03)

### Medium-term (Next Quarter)

1. Review Service Bus SKU requirements (M-04)
2. Move SFTP credentials to Key Vault (M-05)
3. Enable diagnostic settings (L-02)
4. Add security classification tags (L-03)

---

_Generated: 2026-02-12_
_SSOT Version: 2026-02-11_
