# Logic App Analysis: demo-upload-webinar-la

**Assessment Date:** 2026-02-11  
**Logic App Type:** Consumption  
**Subscription:** AIS Platform Dev  
**Resource Group:** rg-demo-webinar  
**Location:** West Europe

---

## Overview

| Property      | Value                  |
| ------------- | ---------------------- |
| Name          | demo-upload-webinar-la |
| State         | Enabled                |
| Created       | 2024-09-16             |
| Last Modified | 2024-09-17             |
| Version       | 1.0.0.0                |

---

## Workflow Description

This Logic App processes invoice messages from a Service Bus queue and uploads them to blob storage. It forms part of a demo invoice processing flow.

### Business Purpose

- Receive invoice messages from the `faktura-queue` Service Bus queue
- Decode the base64 content
- Upload the invoice to the "bankens-sftp" blob container

---

## Trigger

| Property          | Value                                |
| ----------------- | ------------------------------------ |
| Type              | Service Bus - Poll Queue             |
| Trigger Name      | När*ett_meddelande*är_mottaget_i_kön |
| Queue             | faktura-queue                        |
| Polling Frequency | Every 3 minutes                      |
| Operation         | Peek messages                        |

### Trigger Analysis

- **⚠️ Polling Pattern**: Uses polling (peek) instead of push trigger
- **Recommendation**: Consider using message sessions or dead-letter processing for better reliability

---

## Actions

### Action Flow

```
[Trigger: Service Bus Queue Peek]
    → [Ladda_upp_fakturan_på_bankens_sftp] (Blob Upload)
    → [Complete_the_message_in_a_queue] (Service Bus Complete)
```

### Action Details

| #   | Action Name                        | Type                           | Dependencies |
| --- | ---------------------------------- | ------------------------------ | ------------ |
| 1   | Ladda_upp_fakturan_på_bankens_sftp | Azure Blob - Create Blob       | Trigger      |
| 2   | Complete_the_message_in_a_queue    | Service Bus - Complete Message | Action 1     |

---

## Connectors Used

| Connector          | Type        | Status       | Authentication    |
| ------------------ | ----------- | ------------ | ----------------- |
| Azure Blob Storage | Managed API | ✅ Connected | Connection String |
| Service Bus        | Managed API | ✅ Connected | Connection String |

### Connection Details

- **azureblob**: Uses "AccountNameFromSettings" parameter reference
- **servicebus**: Connected to `faktura-queue`

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

1. **No explicit error handling**: If blob upload fails, the message won't be completed but will remain in queue
2. **No dead-letter handling**: Failed messages could be retried indefinitely
3. **No alerting**: No mechanism to notify on failures

### Recommendations

1. Add a Scope around the main actions with a "Catch" branch
2. Implement dead-letter queue handling
3. Add a Send Email or Teams notification action on failure

---

## Dependencies

### Service Bus

- **Namespace**: aisplatform-dev-messaging-bus
- **Queue**: faktura-queue
- **Direction**: Consumer (reads from queue)

### Storage Account

- **Account**: demowebinarsa (inferred from connection)
- **Container**: bankens-sftp
- **Direction**: Producer (writes files)

---

## Security Analysis

| Check            | Status         | Notes                                  |
| ---------------- | -------------- | -------------------------------------- |
| Managed Identity | ❌ Not Used    | Uses connection strings                |
| Secure Inputs    | ❌ Not Enabled | Trigger content visible in run history |
| Secure Outputs   | ❌ Not Enabled | Action outputs visible in run history  |
| IP Restrictions  | ❌ None        | Default public endpoints               |

### Security Recommendations

1. **HIGH**: Switch to Managed Identity for Service Bus and Storage
2. **MEDIUM**: Enable secure inputs/outputs to mask sensitive data in run history
3. **MEDIUM**: Consider enabling private endpoints

---

## Performance Analysis

| Metric           | Value     | Assessment                  |
| ---------------- | --------- | --------------------------- |
| Polling Interval | 3 minutes | Acceptable for non-realtime |
| Transfer Mode    | Chunked   | ✅ Good for large files     |
| Concurrency      | Default   | No concurrency limits set   |

---

## Compliance with SSOT

Requires comparison with `/standards/contica-ssot/baseline-levels.md`

| Standard       | Compliance       | Notes                                         |
| -------------- | ---------------- | --------------------------------------------- |
| Authentication | ⚠️ Partial       | Uses connection strings, not Managed Identity |
| Error Handling | ❌ Non-Compliant | Missing retry and failure handling            |
| Monitoring     | ❌ Unknown       | Check diagnostic settings                     |
| Naming         | ✅ Compliant     | Follows naming convention                     |

---

## Recommendations Summary

| Priority | Recommendation                                 | Effort |
| -------- | ---------------------------------------------- | ------ |
| HIGH     | Implement Managed Identity authentication      | Medium |
| HIGH     | Add proper error handling with Scope and Catch | Low    |
| MEDIUM   | Enable secure inputs/outputs                   | Low    |
| MEDIUM   | Add alerting on failure                        | Low    |
| LOW      | Document workflow purpose in tags              | Low    |

---

_Generated by Azure Integration Services Assessment Agent_
