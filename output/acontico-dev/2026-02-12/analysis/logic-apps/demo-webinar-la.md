# Logic App Analysis: demo-webinar-la

**Resource Group**: rg-demo-webinar  
**Location**: West Europe  
**State**: Enabled  
**Created**: 2024-06-10  
**Last Modified**: 2024-09-16

---

## Overview

This Logic App monitors a blob container for invoice files, filters for files starting with "faktura", and sends them to a Service Bus queue for processing.

---

## Trigger

| Type               | Details                            |
| ------------------ | ---------------------------------- |
| **Trigger Type**   | Azure Blob - When file is updated  |
| **Container Path** | /fakturor-sftp                     |
| **Recurrence**     | Every 3 minutes                    |
| **Max Files**      | 1 per trigger                      |
| **Split On**       | Yes (processes files individually) |

---

## Actions

| #   | Action Name                            | Type                     | Description                               |
| --- | -------------------------------------- | ------------------------ | ----------------------------------------- |
| 1   | Lista_blob                             | Azure Blob - List Files  | Lists files in /fakturor-sftp container   |
| 2   | Filter_array                           | Data Operations - Filter | Filters for files starting with "faktura" |
| 3   | För_varje                              | For Each Loop            | Iterates over filtered files              |
| 3.1 | Hämta_blob_content                     | Azure Blob - Get Content | Gets file content                         |
| 3.2 | Skicka_service_bus_meddelande_till_kön | Service Bus - Send       | Sends message to faktura-queue            |

---

## Connectors Used

| Connector          | Type         | Authentication                     |
| ------------------ | ------------ | ---------------------------------- |
| Azure Blob Storage | Azure-Native | Connection String (API Connection) |
| Service Bus        | Azure-Native | Connection String (API Connection) |

---

## Error Handling Analysis

| Pattern                       | Present? | Details                              |
| ----------------------------- | -------- | ------------------------------------ |
| Scope with Try-Catch          | ❌ No    | No scopes defined                    |
| runAfter with Failed/TimedOut | ❌ No    | Only "Succeeded" runAfter conditions |
| Terminate action              | ❌ No    | No explicit termination paths        |
| Retry Policies                | ❌ No    | Using default policies               |

**⚠️ Risk**: If any action in the ForEach loop fails, there's no notification or compensation logic. The file will remain in the container and could be reprocessed.

---

## Dependencies

| Dependency Type   | Resource         | Resource Group  |
| ----------------- | ---------------- | --------------- |
| Storage Account   | (via connection) | rg-demo-webinar |
| Service Bus Queue | faktura-queue    | rg-demo-webinar |

---

## Authentication Analysis

| Component               | Method            | Secure?   |
| ----------------------- | ----------------- | --------- |
| Blob Storage Connection | Connection String | ⚠️ Medium |
| Service Bus Connection  | Connection String | ⚠️ Medium |

**Recommendation**: Consider using Managed Identity for both connections.

---

## Data Flow

```
Blob Container (/fakturor-sftp)
         ↓
   [File Updated Trigger]
         ↓
   [List Blobs]
         ↓
   [Filter: startsWith "faktura"]
         ↓
   [ForEach File]
         ↓
     [Get File Content]
         ↓
     [Base64 Encode]
         ↓
     [Send to Service Bus: faktura-queue]
```

---

## Integration Pattern

This Logic App works in conjunction with `demo-upload-webinar-la`:

1. **demo-webinar-la**: Picks up invoice files from blob → sends to Service Bus
2. **demo-upload-webinar-la**: Receives from Service Bus → uploads to bank's SFTP (stored in blob)

---

## Findings

| Severity | Finding                                              |
| -------- | ---------------------------------------------------- |
| MEDIUM   | No error handling in ForEach loop                    |
| MEDIUM   | No idempotency check - files could be reprocessed    |
| MEDIUM   | Using connection strings instead of Managed Identity |
| LOW      | No file archival after processing                    |
| LOW      | Swedish action names (localization)                  |

---

_Analyzed: 2026-02-12_
