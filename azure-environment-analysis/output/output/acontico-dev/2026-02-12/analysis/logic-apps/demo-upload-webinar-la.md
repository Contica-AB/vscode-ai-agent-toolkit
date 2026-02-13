# Logic App Analysis: demo-upload-webinar-la

**Resource Group**: rg-demo-webinar  
**Location**: West Europe  
**State**: Enabled  
**Created**: 2024-09-16  
**Last Modified**: 2024-09-17

---

## Overview

This Logic App processes invoice messages from a Service Bus queue and uploads them to blob storage.

---

## Trigger

| Type                 | Details                       |
| -------------------- | ----------------------------- |
| **Trigger Type**     | Service Bus Queue (Peek-Lock) |
| **Queue Name**       | faktura-queue                 |
| **Recurrence**       | Every 3 minutes               |
| **Session Handling** | None                          |

---

## Actions

| #   | Action Name                        | Type                     | Description                                        |
| --- | ---------------------------------- | ------------------------ | -------------------------------------------------- |
| 1   | Ladda_upp_fakturan_på_bankens_sftp | Azure Blob - Create File | Uploads invoice content to /bankens-sftp container |
| 2   | Complete_the_message_in_a_queue    | Service Bus - Complete   | Completes the message after successful upload      |

---

## Connectors Used

| Connector          | Type         | Authentication                     |
| ------------------ | ------------ | ---------------------------------- |
| Service Bus        | Azure-Native | Connection String (API Connection) |
| Azure Blob Storage | Azure-Native | Connection String (API Connection) |

---

## Error Handling Analysis

| Pattern                       | Present? | Details                              |
| ----------------------------- | -------- | ------------------------------------ |
| Scope with Try-Catch          | ❌ No    | No scopes defined                    |
| runAfter with Failed/TimedOut | ❌ No    | Only "Succeeded" runAfter conditions |
| Terminate action              | ❌ No    | No explicit termination paths        |
| Retry Policies                | ❌ No    | Using default policies               |

**⚠️ Risk**: If `Ladda_upp_fakturan_på_bankens_sftp` fails, the message will NOT be completed, which is correct behavior. However, there's no error notification or logging configured.

---

## Dependencies

| Dependency Type   | Resource         | Resource Group  |
| ----------------- | ---------------- | --------------- |
| Service Bus Queue | faktura-queue    | rg-demo-webinar |
| Storage Account   | (via connection) | rg-demo-webinar |

---

## Authentication Analysis

| Component               | Method            | Secure?   |
| ----------------------- | ----------------- | --------- |
| Service Bus Connection  | Connection String | ⚠️ Medium |
| Blob Storage Connection | Connection String | ⚠️ Medium |

**Recommendation**: Consider using Managed Identity for both Service Bus and Blob Storage connections.

---

## Data Flow

```
Service Bus Queue (faktura-queue)
         ↓
   [Peek Message]
         ↓
   [Decode Base64]
         ↓
   [Upload to Blob Storage: /bankens-sftp/{MessageId}]
         ↓
   [Complete Message]
```

---

## Findings

| Severity | Finding                                               |
| -------- | ----------------------------------------------------- |
| MEDIUM   | No error handling implemented                         |
| MEDIUM   | Using connection strings instead of Managed Identity  |
| LOW      | No diagnostic settings configured (verify separately) |
| LOW      | Swedish action names (localization)                   |

---

_Analyzed: 2026-02-12_
