# Logic App Analysis: demo-upload-webinar-la

## Overview

| Property       | Value           |
| -------------- | --------------- |
| Resource Group | rg-demo-webinar |
| Type           | Consumption     |
| State          | ✅ Enabled      |
| Region         | West Europe     |
| Created        | 2024-09-16      |
| Last Modified  | 2024-09-17      |

---

## Trigger

| Property   | Value                         |
| ---------- | ----------------------------- |
| Type       | Service Bus Queue (Polling)   |
| Queue      | `faktura-queue`               |
| Namespace  | aisplatform-dev-messaging-bus |
| Frequency  | Every 3 minutes               |
| Queue Type | Main                          |

---

## Actions Summary

| Metric          | Value                       |
| --------------- | --------------------------- |
| Total Actions   | 2                           |
| Connectors Used | 2 (Service Bus, Azure Blob) |
| Complexity      | **Simple**                  |
| Nesting Depth   | 1                           |

### Action Flow

```
[Trigger: Service Bus Queue Message]
    │
    ├─► Ladda_upp_fakturan_på_bankens_sftp (Azure Blob - Create File)
    │       Uploads message content to /bankens-sftp container
    │
    └─► Complete_the_message_in_a_queue (Service Bus - Complete Message)
            Completes the Service Bus message
```

---

## Connectors

| Connector          | Auth Method          | Connection Name        | Status    |
| ------------------ | -------------------- | ---------------------- | --------- |
| Service Bus        | 🔴 Connection String | service-bus-connection | Connected |
| Azure Blob Storage | 🔴 Storage Key       | blob-container         | Connected |

### Authentication Assessment

| Aspect                | Status      | Notes                                           |
| --------------------- | ----------- | ----------------------------------------------- |
| Managed Identity      | ❌ Not Used | Neither connector uses Managed Identity         |
| Hardcoded Secrets     | ⚠️ Risk     | Connection strings stored in connection objects |
| Key Vault Integration | ❌ None     | No Key Vault references found                   |

**Recommendation**: Migrate both connections to use Managed Identity for improved security.

---

## Error Handling Assessment

| Aspect                  | Status             | Notes                              |
| ----------------------- | ------------------ | ---------------------------------- |
| Scopes                  | ❌ Not Used        | No scopes for grouping actions     |
| Try-Catch Pattern       | ❌ Not Implemented | No error handling scopes           |
| Retry Policies          | ❌ Default Only    | No custom retry policies           |
| Terminate Actions       | ❌ None            | No explicit termination on failure |
| Error Notifications     | ❌ None            | No alerting on failures            |
| Run After Configuration | ⚠️ Default         | Only runs after success            |

**Overall Rating**: 🔴 **POOR**

### Missing Error Handling Patterns

1. **No try-catch scope** - If blob upload fails, message is not completed but also no notification
2. **No dead-letter handling** - Failed messages may be retried indefinitely
3. **No logging** - No Application Insights or custom logging actions
4. **No notification** - No email/Teams alert on failure

---

## Dependencies

| Dependency Type    | Resource                      | Details                  |
| ------------------ | ----------------------------- | ------------------------ |
| Service Bus        | aisplatform-dev-messaging-bus | Queue: faktura-queue     |
| Azure Blob Storage | demowebinarsa                 | Container: /bankens-sftp |

### Dependency Diagram

```
┌─────────────────────────┐
│  aisplatform-dev-       │
│  messaging-bus          │
│  (Service Bus)          │
│  ├─ faktura-queue ──────┼───► [demo-upload-webinar-la]
└─────────────────────────┘            │
                                       │
┌─────────────────────────┐            │
│  demowebinarsa          │◄───────────┘
│  (Storage Account)      │
│  └─ /bankens-sftp       │
└─────────────────────────┘
```

---

## Security Findings

| Severity  | Finding                                                                            |
| --------- | ---------------------------------------------------------------------------------- |
| 🔴 HIGH   | Using connection string authentication for Service Bus instead of Managed Identity |
| 🔴 HIGH   | Using storage account key for Blob access instead of Managed Identity              |
| ⚠️ MEDIUM | No input/output obfuscation for sensitive data                                     |
| ⚠️ MEDIUM | Publishing to /bankens-sftp - verify this is intentional container name            |

---

## Recommendations

### Priority 1 - Security

1. **Migrate to Managed Identity** - Configure system-assigned managed identity and update both connections to use MI authentication
2. **Enable Secure Inputs/Outputs** - Mark actions handling potentially sensitive invoice data

### Priority 2 - Resilience

3. **Add Try-Catch Scope** - Wrap upload operation in a scope with error handling
4. **Implement Dead Letter Handling** - Add logic to handle messages that fail after max retries
5. **Add Retry Policy** - Configure exponential retry on blob upload action

### Priority 3 - Observability

6. **Enable Tracked Properties** - Add key fields as tracked properties for monitoring
7. **Add Alert Rule** - Create Azure Monitor alert for failed runs
8. **Add Notification Action** - Send Teams/email notification on failure

---

## Raw Definition

```json
{
  "triggers": {
    "När_ett_meddelande_är_mottaget_i_kön": {
      "type": "ApiConnection",
      "inputs": {
        "method": "get",
        "path": "/@{encodeURIComponent(encodeURIComponent('faktura-queue'))}/messages/head/peek"
      },
      "recurrence": {
        "frequency": "Minute",
        "interval": 3
      }
    }
  },
  "actions": {
    "Ladda_upp_fakturan_på_bankens_sftp": {
      "type": "ApiConnection",
      "inputs": {
        "method": "post",
        "path": "/v2/datasets/.../files",
        "body": "@json(base64ToString(triggerBody()?['ContentData']))"
      }
    },
    "Complete_the_message_in_a_queue": {
      "type": "ApiConnection",
      "runAfter": {
        "Ladda_upp_fakturan_på_bankens_sftp": ["Succeeded"]
      }
    }
  }
}
```

---

_Analysis Date: 2026-02-13_
