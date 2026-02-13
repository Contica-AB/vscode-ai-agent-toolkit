# Logic App Analysis: demo-webinar-la

## Overview

| Property       | Value           |
| -------------- | --------------- |
| Resource Group | rg-demo-webinar |
| Type           | Consumption     |
| State          | ✅ Enabled      |
| Region         | West Europe     |
| Created        | 2024-06-10      |
| Last Modified  | 2024-09-16      |

---

## Trigger

| Property        | Value                                         |
| --------------- | --------------------------------------------- |
| Type            | Azure Blob Storage (Polling)                  |
| Folder          | `/fakturor-sftp`                              |
| Storage Account | demowebinarsa                                 |
| Frequency       | Every 3 minutes                               |
| Batch Size      | 1 file                                        |
| Split On        | ✅ Enabled (processes each file individually) |

---

## Actions Summary

| Metric          | Value                       |
| --------------- | --------------------------- |
| Total Actions   | 4                           |
| Connectors Used | 2 (Azure Blob, Service Bus) |
| Complexity      | **Medium**                  |
| Nesting Depth   | 2 (For Each loop)           |
| Branches        | 0                           |

### Action Flow

```
[Trigger: When file is uploaded to /fakturor-sftp]
    │
    ├─► Lista_blob (Azure Blob - List Blobs)
    │       Lists all blobs in /fakturor-sftp folder
    │
    ├─► Filter_array (Data Operations - Filter)
    │       Filters blobs where name starts with 'faktura'
    │
    └─► För_varje (For Each Loop)
            Iterates through filtered blobs
            │
            ├─► Hämta_blob_content (Azure Blob - Get Content)
            │       Retrieves blob content
            │
            └─► Skicka_service_bus_meddelande_till_kön (Service Bus - Send)
                    Sends base64-encoded content to faktura-queue
```

---

## Connectors

| Connector          | Auth Method          | Connection Name        | Status    |
| ------------------ | -------------------- | ---------------------- | --------- |
| Azure Blob Storage | 🔴 Storage Key       | blob-container         | Connected |
| Service Bus        | 🔴 Connection String | service-bus-connection | Connected |

### Authentication Assessment

| Aspect                | Status      | Notes                              |
| --------------------- | ----------- | ---------------------------------- |
| Managed Identity      | ❌ Not Used | Both connectors use key-based auth |
| Hardcoded Secrets     | ⚠️ Risk     | Keys stored in connection objects  |
| Key Vault Integration | ❌ None     | No Key Vault references            |

**Recommendation**: Migrate both connections to use Managed Identity.

---

## Error Handling Assessment

| Aspect                  | Status             | Notes                    |
| ----------------------- | ------------------ | ------------------------ |
| Scopes                  | ❌ Not Used        | No scopes for grouping   |
| Try-Catch Pattern       | ❌ Not Implemented | No error handling        |
| Retry Policies          | ❌ Default Only    | No custom retry policies |
| Terminate Actions       | ❌ None            | No explicit termination  |
| Error Notifications     | ❌ None            | No alerting              |
| Run After Configuration | ⚠️ Default         | Only success paths       |

**Overall Rating**: 🔴 **POOR**

### Critical Error Handling Gaps

1. **For Each loop has no error handling** - If one blob fails, remaining blobs in batch still process but failure is silent
2. **No compensation logic** - If Service Bus send fails after blob was read, no cleanup
3. **No idempotency** - Same file could be processed multiple times if trigger fires again
4. **Blob not deleted after processing** - Files remain in folder, may cause reprocessing

---

## Dependencies

| Dependency Type    | Resource                      | Details                            |
| ------------------ | ----------------------------- | ---------------------------------- |
| Azure Blob Storage | demowebinarsa                 | Folder: /fakturor-sftp (source)    |
| Service Bus        | aisplatform-dev-messaging-bus | Queue: faktura-queue (destination) |

### Dependency Diagram

```
┌─────────────────────────┐         ┌─────────────────────────┐
│  demowebinarsa          │         │  aisplatform-dev-       │
│  (Storage Account)      │         │  messaging-bus          │
│  └─ /fakturor-sftp ─────┼──► [demo-webinar-la] ───►│  └─ faktura-queue      │
└─────────────────────────┘         └─────────────────────────┘
```

### Integration Flow Context

This Logic App is the **producer** in a queue-based integration pattern:

1. Files uploaded to Storage → `demo-webinar-la` → Service Bus Queue
2. Service Bus Queue → `demo-upload-webinar-la` → Processed files

---

## Data Flow Analysis

### Input

- **Source**: Azure Blob Storage (`/fakturor-sftp`)
- **Filter**: Files starting with 'faktura'
- **Format**: File content (any format)

### Transformation

- File content is Base64-encoded
- Original filename preserved in message properties (`SendFileName`)

### Output

- **Destination**: Service Bus Queue (`faktura-queue`)
- **Message Format**:
  ```json
  {
    "ContentData": "<base64-encoded-content>",
    "Properties": {
      "SendFileName": "<original-filename>"
    }
  }
  ```

---

## Security Findings

| Severity  | Finding                                                              |
| --------- | -------------------------------------------------------------------- |
| 🔴 HIGH   | Using storage account key authentication instead of Managed Identity |
| 🔴 HIGH   | Using Service Bus connection string instead of Managed Identity      |
| ⚠️ MEDIUM | Storage account has public blob access enabled                       |
| ⚠️ MEDIUM | No file validation before processing                                 |

---

## Recommendations

### Priority 1 - Security

1. **Migrate to Managed Identity** - Use system-assigned MI for both Blob and Service Bus
2. **Disable Public Blob Access** - Storage account `demowebinarsa` should not allow public access

### Priority 2 - Resilience

3. **Add Error Handling Scope** - Wrap For Each operations in try-catch pattern
4. **Implement File Archival** - Move processed files to archive folder
5. **Add Idempotency Check** - Track processed files to prevent duplicates
6. **Configure For Each Concurrency** - Currently unlimited; consider sequential processing

### Priority 3 - Observability

7. **Add Tracked Properties** - Include filename, file size in tracked properties
8. **Create Alert Rule** - Monitor for failed runs
9. **Add Completion Logging** - Log successful file processing count

### Priority 4 - Design Improvements

10. **Consider Event-Based Trigger** - Replace polling with Event Grid blob trigger for real-time processing
11. **Add File Validation** - Validate file format before sending to queue
12. **Implement Cleanup Logic** - Delete or archive processed files

---

## Raw Definition

```json
{
  "triggers": {
    "När_en_faktura_blivit_uppladdad_i_blob-containern": {
      "type": "ApiConnection",
      "recurrence": { "frequency": "Minute", "interval": 3 },
      "splitOn": "@triggerBody()",
      "inputs": {
        "path": "/v2/datasets/.../triggers/batch/onupdatedfile",
        "queries": { "folderId": "/fakturor-sftp", "maxFileCount": 1 }
      }
    }
  },
  "actions": {
    "Lista_blob": { "type": "ApiConnection" },
    "Filter_array": {
      "type": "Query",
      "inputs": {
        "from": "@body('Lista_blob')?['value']",
        "where": "@startsWith(item()?['Name'],'faktura')"
      }
    },
    "För_varje": {
      "type": "Foreach",
      "foreach": "@outputs('Filter_array')['body']",
      "actions": {
        "Hämta_blob_content": { "type": "ApiConnection" },
        "Skicka_service_bus_meddelande_till_kön": {
          "type": "ApiConnection",
          "inputs": {
            "body": {
              "ContentData": "@{base64(body('Hämta_blob_content'))}",
              "Properties": {
                "SendFileName": "@items('För_varje')?['DisplayName']"
              }
            }
          }
        }
      }
    }
  }
}
```

---

_Analysis Date: 2026-02-13_
