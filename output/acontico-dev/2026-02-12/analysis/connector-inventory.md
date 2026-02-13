# Connector Inventory

**Client**: Acontico Dev  
**Date**: 2026-02-12

---

## Summary

| Connector Type         | Count | Logic Apps Using                        |
| ---------------------- | ----- | --------------------------------------- |
| Azure Service Bus      | 2     | demo-webinar-la, demo-upload-webinar-la |
| Azure Blob Storage     | 2     | demo-webinar-la, demo-upload-webinar-la |
| SFTP with SSH          | 1     | cosi-member-adobe-dev-logic             |
| HTTP Request (Trigger) | 1     | cosi-member-adobe-dev-logic             |

**Total Unique Connectors**: 4

---

## Connector Details

### Azure Service Bus

| Property           | Details                          |
| ------------------ | -------------------------------- |
| **Type**           | Azure-Native (Managed Connector) |
| **API Type**       | ApiConnection                    |
| **Authentication** | Connection String                |
| **Queue Used**     | faktura-queue                    |

**Used By**:

- `demo-webinar-la` - Send messages to queue
- `demo-upload-webinar-la` - Receive and complete messages

**Security Assessment**:

- ⚠️ Uses Connection String authentication
- ✓ Standard operations (send/receive/complete)
- **Recommendation**: Migrate to Managed Identity

---

### Azure Blob Storage

| Property            | Details                          |
| ------------------- | -------------------------------- |
| **Type**            | Azure-Native (Managed Connector) |
| **API Type**        | ApiConnection                    |
| **Authentication**  | Connection String                |
| **Containers Used** | /fakturor-sftp, /bankens-sftp    |

**Used By**:

- `demo-webinar-la` - List blobs, get content
- `demo-upload-webinar-la` - Create files

**Security Assessment**:

- ⚠️ Uses Connection String authentication
- ⚠️ Storage account `demowebinarsa` has public blob access enabled
- **Recommendation**: Migrate to Managed Identity, disable public access

---

### SFTP with SSH

| Property           | Details                       |
| ------------------ | ----------------------------- |
| **Type**           | External (Third-Party System) |
| **API Type**       | ApiConnection                 |
| **Authentication** | Username/Password (SSH)       |
| **Path Used**      | /customerExport               |

**Used By**:

- `cosi-member-adobe-dev-logic` - List files, get content

**Security Assessment**:

- ⚠️ Credentials stored in API Connection
- External system dependency (not Azure-managed)
- **Recommendation**: Store credentials in Key Vault, use certificate-based auth if possible

---

### HTTP Request (Trigger)

| Property           | Details            |
| ------------------ | ------------------ |
| **Type**           | Built-in           |
| **Authentication** | ❌ None configured |

**Used By**:

- `cosi-member-adobe-dev-logic` - Workflow trigger

**Security Assessment**:

- 🔴 **HIGH RISK**: No authentication on HTTP trigger
- Anyone with the URL can invoke the workflow
- **Recommendation**: Add SAS token or OAuth authentication

---

## Authentication Summary

| Connector    | Current Auth      | Recommended Auth        | Risk Level |
| ------------ | ----------------- | ----------------------- | ---------- |
| Service Bus  | Connection String | Managed Identity        | Medium     |
| Blob Storage | Connection String | Managed Identity        | Medium     |
| SFTP         | Username/Password | Certificate + Key Vault | Medium     |
| HTTP Trigger | None              | SAS / OAuth             | **High**   |

---

## Connector Categories

### Azure-Native Connectors (2)

- Azure Service Bus
- Azure Blob Storage

### External Connectors (1)

- SFTP with SSH

### Built-in (1)

- HTTP Request

---

## Recommendations

### Priority 1: Security

1. **Add authentication to HTTP trigger** on `cosi-member-adobe-dev-logic`
2. **Migrate to Managed Identity** for Service Bus and Blob Storage connections

### Priority 2: Best Practices

1. Use Key Vault for SFTP credentials
2. Review connection string rotation policies
3. Consider using API Connections with Managed Identity where available

### Priority 3: Operations

1. Document all connector dependencies
2. Set up monitoring for connector health
3. Plan for connector updates and deprecations

---

_Generated: 2026-02-12_
