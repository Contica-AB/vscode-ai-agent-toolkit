# Security Audit Report

**Assessment Date:** 2026-02-11  
**Client:** Contica AB DEMO new  
**Security Option:** Standard (per client configuration)  
**SSOT Reference:** `/standards/contica-ssot/baseline-levels.md`

---

## Executive Summary

| Metric                       | Count |
| ---------------------------- | ----- |
| **Total Resources Audited**  | 19    |
| **HIGH Severity Findings**   | 3     |
| **MEDIUM Severity Findings** | 5     |
| **LOW Severity Findings**    | 2     |
| **Resources Compliant**      | ~40%  |

**Overall Assessment:** The environment has several security gaps compared to SSOT standards, particularly around Managed Identity usage and public blob access.

---

## Findings Summary

### HIGH Severity (Immediate Action Required)

| #   | Resource                    | Finding                                              | SSOT Violation        |
| --- | --------------------------- | ---------------------------------------------------- | --------------------- |
| H1  | demowebinarsa               | Public blob access enabled                           | Security Level 3      |
| H2  | All Logic Apps              | No Managed Identity configured                       | Authentication Matrix |
| H3  | cosi-member-adobe-dev-logic | HTTP trigger publicly accessible, no IP restrictions | Security Level 3      |

### MEDIUM Severity (Should Address)

| #   | Resource                      | Finding                                             | SSOT Violation        |
| --- | ----------------------------- | --------------------------------------------------- | --------------------- |
| M1  | kv-cls-metrics-dev001         | Purge protection not enabled                        | Security Level 3      |
| M2  | kv-cls-metrics-dev001         | No network restrictions                             | Security Level 3      |
| M3  | aisplatform-dev-messaging-bus | Local auth enabled (disableLocalAuth=false)         | Authentication Matrix |
| M4  | aisplatform-dev-messaging-bus | Basic SKU - no Premium features                     | Required Tiers        |
| M5  | All Logic Apps                | Connection strings used instead of Managed Identity | Authentication Matrix |

### LOW Severity (Consider Addressing)

| #   | Resource   | Finding                           | Notes                    |
| --- | ---------- | --------------------------------- | ------------------------ |
| L1  | Logic Apps | Secure inputs/outputs not enabled | Run history exposes data |
| L2  | Logic Apps | No IP access restrictions         | Default public endpoints |

---

## Detailed Findings

### H1: Public Blob Access Enabled

**Resource:** `demowebinarsa` (Storage Account)

**Current State:**

```json
{
  "allowBlobPublicAccess": true,
  "publicNetworkAccess": "Enabled"
}
```

**Risk:** Blobs can be accidentally exposed publicly if a container's access level is set to "Blob" or "Container".

**SSOT Requirement:** Storage Accounts must have `allowBlobPublicAccess: false` for Security Level 3.

**Remediation:**

```bash
az storage account update \
  --name demowebinarsa \
  --resource-group rg-demo-webinar \
  --allow-blob-public-access false
```

**Positive Findings:**

- ✅ TLS 1.2 enforced
- ✅ Default to OAuth authentication enabled

---

### H2: Logic Apps Without Managed Identity

**Resources:** All 3 Logic Apps

**Current State:**

```json
{
  "identity": null,
  "accessControl": null
}
```

**Risk:** Logic Apps use connection strings for authentication which:

- Can be leaked through run history
- Are harder to rotate
- Don't leverage Azure AD security features

**SSOT Requirement:** Authentication Matrix mandates Managed Identity for Logic App → Service Bus and Logic App → Storage Account connections.

**Remediation:**

1. Enable System-Assigned Managed Identity on each Logic App
2. Grant appropriate RBAC roles to the identity
3. Update connectors to use Managed Identity authentication

```bash
# Enable MI on Logic App
az logic workflow update \
  --name demo-webinar-la \
  --resource-group rg-demo-webinar \
  --assign-identity
```

---

### H3: HTTP Trigger Without IP Restrictions

**Resource:** `cosi-member-adobe-dev-logic`

**Current State:**

- Trigger Type: HTTP Request
- IP Restrictions: None (publicly accessible)
- Authentication: SAS token only

**Risk:** Anyone with the URL can invoke the Logic App. This:

- Exposes business logic
- Can be used for denial-of-service
- May expose sensitive customer data

**SSOT Requirement:** HTTP triggers should have IP restrictions or additional authentication.

**Remediation:**

```bash
# Add IP restrictions via Azure Portal or ARM template
# Access Control → Triggers → Specific IPs
```

---

### M1: Key Vault Purge Protection Not Enabled

**Resource:** `kv-cls-metrics-dev001`

**Current State:**

```json
{
  "enableSoftDelete": true,
  "enablePurgeProtection": null
}
```

**Risk:** Deleted secrets can be permanently purged before soft-delete retention expires.

**Remediation:**

```bash
az keyvault update \
  --name kv-cls-metrics-dev001 \
  --enable-purge-protection true
```

---

### M2: Key Vault Without Network Restrictions

**Resource:** `kv-cls-metrics-dev001`

**Current State:**

```json
{
  "networkAcls": null
}
```

**Risk:** Key Vault accessible from public internet without network restrictions.

**SSOT Requirement:** For Standard Security Option (Level 3), Key Vault should have firewall rules or service endpoints.

**Remediation:**

- Add service endpoint from VNet
- Configure firewall rules for allowed IPs
- Consider private endpoint for Advanced Security Option

---

### M3: Service Bus Local Auth Enabled

**Resource:** `aisplatform-dev-messaging-bus`

**Current State:**

```json
{
  "disableLocalAuth": false
}
```

**Risk:** Connection strings and SAS tokens can be used instead of Managed Identity, weakening security posture.

**SSOT Requirement:** Authentication Matrix prefers Managed Identity for all Service Bus connections.

**Remediation:**

1. Migrate all clients to use Managed Identity
2. Disable local auth:

```bash
az servicebus namespace update \
  --name aisplatform-dev-messaging-bus \
  --resource-group rg-demo-webinar \
  --disable-local-auth true
```

---

### M4: Service Bus Basic SKU

**Resource:** `aisplatform-dev-messaging-bus`

**Current State:**

- SKU: Basic

**Limitations:**

- No topics/subscriptions support
- No dead-letter queues viewing in Portal
- Limited message size (256KB)
- No duplicate detection

**SSOT Requirement:** For integration workloads, Standard or Premium SKU is recommended.

**Recommendation:** Upgrade to Standard SKU for full feature support.

---

### M5: Connection Strings Used Instead of Managed Identity

**Resources:** All Logic Apps

**Current State:**
API Connections use connection strings:

- `azureblob`: Connection string authentication
- `servicebus`: Connection string authentication
- `sftpwithssh`: SSH key/password (acceptable for external SFTP)

**Risk:** Connection strings:

- Are stored in the connection resource
- Can be extracted by anyone with Reader access
- Require manual rotation

**SSOT Requirement:** Authentication Matrix mandates Managed Identity where available.

---

## Compliance Matrix

### Per Resource Type (vs SSOT Baseline Level 3)

| Resource Type           | Required Level | Current Level | Status       |
| ----------------------- | -------------- | ------------- | ------------ |
| Storage Account         | 3              | 2             | ❌ Gaps      |
| Service Bus             | 3              | 2             | ❌ Gaps      |
| Key Vault               | 3              | 2             | ❌ Gaps      |
| Function App            | 3              | 3             | ✅ Compliant |
| Logic App (Consumption) | 3              | 2             | ❌ Gaps      |

### Function App - Compliant Areas ✅

| Check            | Status             |
| ---------------- | ------------------ |
| HTTPS Only       | ✅ Enabled         |
| TLS Version      | ✅ 1.2             |
| Managed Identity | ✅ System-Assigned |

---

## Positive Findings

| Resource             | Finding                              |
| -------------------- | ------------------------------------ |
| All Storage Accounts | TLS 1.2 minimum enforced             |
| All Service Bus      | TLS 1.2 minimum enforced             |
| Function Apps        | Managed Identity enabled             |
| Function Apps        | HTTPS only enabled                   |
| demowebinarsa        | Default OAuth authentication enabled |
| Key Vault            | Soft delete enabled                  |

---

## Recommendations Prioritized

### Immediate (Week 1)

| #   | Action                                          | Effort  | Impact |
| --- | ----------------------------------------------- | ------- | ------ |
| 1   | Disable public blob access on demowebinarsa     | 5 mins  | HIGH   |
| 2   | Enable Managed Identity on Logic Apps           | 15 mins | HIGH   |
| 3   | Add IP restrictions to HTTP-triggered Logic App | 10 mins | HIGH   |

### Short Term (Month 1)

| #   | Action                                                | Effort  | Impact |
| --- | ----------------------------------------------------- | ------- | ------ |
| 4   | Enable purge protection on Key Vault                  | 5 mins  | MEDIUM |
| 5   | Configure Key Vault firewall                          | 30 mins | MEDIUM |
| 6   | Migrate Logic App connections to use Managed Identity | 2 hours | MEDIUM |
| 7   | Upgrade Service Bus to Standard SKU                   | 15 mins | MEDIUM |

### Medium Term (Quarter 1)

| #   | Action                                            | Effort  | Impact |
| --- | ------------------------------------------------- | ------- | ------ |
| 8   | Implement VNet integration for Logic Apps         | 4 hours | MEDIUM |
| 9   | Disable Service Bus local auth after MI migration | 15 mins | MEDIUM |
| 10  | Enable secure inputs/outputs on Logic Apps        | 30 mins | LOW    |

---

## Risk Summary

| Risk Category         | Level  | Notes                                 |
| --------------------- | ------ | ------------------------------------- |
| Data Exposure         | MEDIUM | Public blob access + no secure inputs |
| Unauthorized Access   | MEDIUM | HTTP trigger publicly accessible      |
| Credential Compromise | MEDIUM | Connection strings used               |
| Compliance            | MEDIUM | Multiple SSOT Level 3 gaps            |

---

_Generated by Azure Integration Services Assessment Agent_
