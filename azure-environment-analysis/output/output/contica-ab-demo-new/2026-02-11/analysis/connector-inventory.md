# Connector Inventory

**Assessment Date:** 2026-02-11  
**Client:** Contica AB DEMO new

---

## Summary

| Metric                           | Count |
| -------------------------------- | ----- |
| **Total API Connections**        | 3     |
| **Unique Connector Types**       | 3     |
| **Logic Apps Using Connections** | 3     |

---

## API Connections

| Connection Name | Connector Type     | Status       | Resource Group                     | Used By                                 |
| --------------- | ------------------ | ------------ | ---------------------------------- | --------------------------------------- |
| azureblob       | Azure Blob Storage | ✅ Connected | rg-demo-webinar                    | demo-webinar-la, demo-upload-webinar-la |
| servicebus      | Service Bus        | ✅ Connected | rg-demo-webinar                    | demo-webinar-la, demo-upload-webinar-la |
| sftpwithssh     | SFTP - SSH         | ✅ Connected | cosi-member-adobe-0073.i001-dev-rg | cosi-member-adobe-dev-logic             |

---

## Connector Usage by Logic App

### demo-webinar-la

| Connector          | Usage                        |
| ------------------ | ---------------------------- |
| Azure Blob Storage | List blobs, Get blob content |
| Service Bus        | Send message to queue        |

### demo-upload-webinar-la

| Connector          | Usage                        |
| ------------------ | ---------------------------- |
| Azure Blob Storage | Create blob                  |
| Service Bus        | Peek queue, Complete message |

### cosi-member-adobe-dev-logic

| Connector  | Usage                        |
| ---------- | ---------------------------- |
| SFTP - SSH | List files, Get file content |

---

## Connector Categories

### Microsoft First-Party Connectors

| Connector          | Count        | Authentication Method |
| ------------------ | ------------ | --------------------- |
| Azure Blob Storage | 1 connection | Connection String     |
| Service Bus        | 1 connection | Connection String     |

### Third-Party / External Connectors

| Connector  | Count        | Authentication Method |
| ---------- | ------------ | --------------------- |
| SFTP - SSH | 1 connection | SSH Key or Password   |

---

## Authentication Analysis

### Current State

| Auth Method       | Connectors            | Security Rating |
| ----------------- | --------------------- | --------------- |
| Connection String | azureblob, servicebus | ⚠️ MEDIUM       |
| SSH Key/Password  | sftpwithssh           | ⚠️ MEDIUM       |
| Managed Identity  | None                  | -               |

### ⚠️ Security Findings

1. **No Managed Identity usage**: All Azure connectors use connection strings instead of Managed Identity
2. **SFTP credentials in connector**: SSH credentials stored in Microsoft.Web/connections resource
3. **Shared connections**: Multiple Logic Apps share the same connections (acceptable but requires access control)

---

## Compliance with SSOT Authentication Matrix

Based on `/standards/contica-ssot/authentication-matrix.md`:

| Resource                 | SSOT Recommended | Actual            | Compliant |
| ------------------------ | ---------------- | ----------------- | --------- |
| Logic App → Blob Storage | Managed Identity | Connection String | ❌ No     |
| Logic App → Service Bus  | Managed Identity | Connection String | ❌ No     |
| Logic App → SFTP         | SSH Key          | SSH Key/Password  | ⚠️ Verify |

---

## Connector Health Status

| Connection  | Last Tested | Health       |
| ----------- | ----------- | ------------ |
| azureblob   | 2026-02-11  | ✅ Connected |
| servicebus  | 2026-02-11  | ✅ Connected |
| sftpwithssh | 2026-02-11  | ✅ Connected |

---

## Recommendations

### HIGH Priority

1. **Migrate to Managed Identity for Azure services**
   - Azure Blob Storage: Use System-Assigned Managed Identity
   - Service Bus: Use System-Assigned Managed Identity
   - Eliminates need for connection strings

### MEDIUM Priority

2. **Review SFTP connection security**
   - Verify SSH key is used instead of password
   - Implement key rotation policy
   - Document credential owner and rotation schedule

3. **Connection access control**
   - Review who has access to shared connections
   - Consider dedicated connections per Logic App for isolation

### LOW Priority

4. **Document connections**
   - Add tags to connection resources
   - Document purpose and ownership

---

## Connection Dependencies Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Logic Apps                                   │
├─────────────────────────┬─────────────────────┬─────────────────────┤
│   demo-webinar-la      │ demo-upload-webinar │ cosi-member-adobe   │
├─────────────────────────┴─────────────────────┴─────────────────────┤
│                        Connections                                   │
├─────────────────────────┬─────────────────────┬─────────────────────┤
│   azureblob           │    servicebus       │    sftpwithssh      │
│   (shared)             │    (shared)         │    (dedicated)      │
├─────────────────────────┴─────────────────────┴─────────────────────┤
│                        Backend Services                             │
├─────────────────────────┬─────────────────────┬─────────────────────┤
│   demowebinarsa        │ aisplatform-dev-    │    External         │
│   (Storage Account)    │ messaging-bus (SB)  │    SFTP Server      │
└─────────────────────────┴─────────────────────┴─────────────────────┘
```

---

_Generated by Azure Integration Services Assessment Agent_
