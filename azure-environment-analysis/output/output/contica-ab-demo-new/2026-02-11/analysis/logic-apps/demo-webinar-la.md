# Logic App Analysis: demo-webinar-la

**Assessment Date:** 2026-02-11  
**Logic App Type:** Consumption  
**Subscription:** AIS Platform Dev  
**Resource Group:** rg-demo-webinar  
**Location:** West Europe

---

## Overview

| Property | Value           |
| -------- | --------------- |
| Name     | demo-webinar-la |
| State    | Enabled         |
| Version  | 1.0.0.0         |

---

## Workflow Description

This Logic App monitors a blob storage container for new invoice files and sends them to a Service Bus queue for downstream processing. It pairs with `demo-upload-webinar-la` to form a complete invoice processing flow.

### Business Purpose

- Monitor the "fakturor-sftp" blob container for new files
- Filter files starting with "faktura"
- Encode file content as base64
- Send to the `faktura-queue` Service Bus queue

---

## Trigger

| Property          | Value                                             |
| ----------------- | ------------------------------------------------- |
| Type              | Azure Blob - When files are added or modified     |
| Trigger Name      | När_en_faktura_blivit_uppladdad_i_blob-containern |
| Container         | /fakturor-sftp                                    |
| Polling Frequency | Every 3 minutes                                   |
| Max File Count    | 1                                                 |
| Split On          | Enabled (processes each file separately)          |

### Trigger Analysis

- **✅ Split On**: Correctly uses splitOn for individual file processing
- **⚠️ Max File Count**: Limited to 1 file per trigger - may cause delays with many files
- **Recommendation**: Consider increasing maxFileCount or using Event Grid trigger

---

## Actions

### Action Flow

```
[Trigger: Blob Modified]
    → [Lista_blob] (List all blobs)
    → [Filter_array] (Filter files starting with "faktura")
    → [För_varje] (For Each)
        → [Hämta_blob_content] (Get blob content)
        → [Skicka_service_bus_meddelande_till_kön] (Send to Service Bus)
```

### Action Details

| #   | Action Name                            | Type                           | Dependencies |
| --- | -------------------------------------- | ------------------------------ | ------------ |
| 1   | Lista_blob                             | Azure Blob - List Blobs        | Trigger      |
| 2   | Filter_array                           | Data Operations - Filter Array | Action 1     |
| 3   | För_varje (For Each)                   | Control - For Each             | Action 2     |
| 3a  | Hämta_blob_content                     | Azure Blob - Get Blob Content  | Loop Item    |
| 3b  | Skicka_service_bus_meddelande_till_kön | Service Bus - Send Message     | Action 3a    |

---

## Connectors Used

| Connector          | Type        | Status       | Authentication    |
| ------------------ | ----------- | ------------ | ----------------- |
| Azure Blob Storage | Managed API | ✅ Connected | Connection String |
| Service Bus        | Managed API | ✅ Connected | Connection String |

### Connection Details

- **azureblob**: Connection ID `/subscriptions/.../connections/azureblob`
- **servicebus**: Connection ID `/subscriptions/.../connections/servicebus`

---

## Error Handling Analysis

### Current Error Handling

| Pattern                | Implemented | Notes                        |
| ---------------------- | ----------- | ---------------------------- |
| Try-Catch (Scope)      | ❌ No       | No scopes defined            |
| runAfter Configuration | ⚠️ Basic    | Only "Succeeded" conditions  |
| Terminate Action       | ❌ No       | No explicit failure handling |
| Retry Policy           | ❌ Default  | Using default retry policy   |

### ⚠️ Issues Found

1. **For Each without error handling**: If one file fails, entire batch processing continues with default behavior
2. **No file archival**: Processed files remain in source container
3. **No dead-letter strategy**: Failed files are not tracked

### Recommendations

1. Add Scope with Configure Run After for failed items
2. Implement file archival (move processed files to archive container)
3. Add compensation logic for partial failures

---

## Dependencies

### Storage Account

- **Container (Source)**: /fakturor-sftp
- **Direction**: Consumer (reads files)

### Service Bus

- **Namespace**: aisplatform-dev-messaging-bus
- **Queue**: faktura-queue
- **Direction**: Producer (sends messages)

### Related Logic Apps

- **Downstream**: `demo-upload-webinar-la` (consumes from same queue)

---

## Security Analysis

| Check            | Status         | Notes                               |
| ---------------- | -------------- | ----------------------------------- |
| Managed Identity | ❌ Not Used    | Uses connection strings             |
| Secure Inputs    | ❌ Not Enabled | File content visible in run history |
| Secure Outputs   | ❌ Not Enabled | Action outputs visible              |
| IP Restrictions  | ❌ None        | Default public endpoints            |

### Security Recommendations

1. **HIGH**: Switch to Managed Identity for Blob and Service Bus
2. **MEDIUM**: Enable secure inputs/outputs for blob content
3. **MEDIUM**: Consider VNet integration for private access

---

## Performance Analysis

| Metric               | Value        | Assessment                        |
| -------------------- | ------------ | --------------------------------- |
| Polling Interval     | 3 minutes    | Acceptable                        |
| Max File Count       | 1            | ⚠️ May bottleneck with many files |
| For Each Concurrency | Default (20) | OK for normal load                |

### Performance Recommendations

1. Increase maxFileCount to process more files per run
2. Consider Event Grid trigger for real-time processing

---

## Integration Pattern

This Logic App implements a **File Polling → Message Queue** pattern:

```
[Blob Storage] ──polling──> [Logic App] ──message──> [Service Bus Queue]
```

Pairs with `demo-upload-webinar-la` which implements:

```
[Service Bus Queue] ──message──> [Logic App] ──upload──> [Blob Storage/SFTP]
```

---

## Compliance with SSOT

| Standard       | Compliance       | Notes                                         |
| -------------- | ---------------- | --------------------------------------------- |
| Authentication | ⚠️ Partial       | Uses connection strings, not Managed Identity |
| Error Handling | ❌ Non-Compliant | Missing retry and failure handling            |
| Monitoring     | ❌ Unknown       | Check diagnostic settings                     |
| Naming         | ✅ Compliant     | Follows naming convention                     |

---

## Recommendations Summary

| Priority | Recommendation                            | Effort |
| -------- | ----------------------------------------- | ------ |
| HIGH     | Implement Managed Identity authentication | Medium |
| HIGH     | Add error handling for For Each loop      | Low    |
| MEDIUM   | Enable secure inputs/outputs              | Low    |
| MEDIUM   | Implement file archival pattern           | Medium |
| LOW      | Consider Event Grid trigger for real-time | Medium |

---

_Generated by Azure Integration Services Assessment Agent_
