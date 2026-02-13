# Logic App Analysis: cosi-member-adobe-dev-logic

## Overview

| Property       | Value                              |
| -------------- | ---------------------------------- |
| Resource Group | cosi-member-adobe-0073.i001-dev-rg |
| Type           | Consumption                        |
| State          | ✅ Enabled                         |
| Region         | Sweden Central                     |
| Created        | 2025-01-22                         |
| Last Modified  | 2025-01-22                         |

### Tags

| Tag            | Value                               |
| -------------- | ----------------------------------- |
| Component      | Integration                         |
| Product        | CoSI MemberAdobe                    |
| TechnicalOwner | contica-ais@contica.onmicrosoft.com |
| Environment    | Development                         |

✅ **Well-Tagged** - This is the only Logic App with proper tagging.

---

## Trigger

| Property            | Value                 |
| ------------------- | --------------------- |
| Type                | HTTP Request (Manual) |
| Authentication      | ❌ None               |
| IP Restrictions     | ❌ Not Configured     |
| Request Body Schema | ❌ Not Defined        |

### Security Concern

🔴 **HIGH RISK**: HTTP trigger is configured **without authentication**. Anyone with the trigger URL can invoke this Logic App.

---

## Actions Summary

| Metric          | Value                              |
| --------------- | ---------------------------------- |
| Total Actions   | 4                                  |
| Connectors Used | 1 (SFTP-SSH)                       |
| Complexity      | **Medium**                         |
| Nesting Depth   | 3 (For Each → Condition → Actions) |
| Branches        | 1 (If/Else)                        |

### Action Flow

```
[Trigger: HTTP Request]
    │
    ├─► List_files_in_folder (SFTP - List Files)
    │       Lists files in /customerExport folder
    │
    └─► For_each (For Each Loop)
            Iterates through files
            │
            └─► Check_if_item_is_folder (Condition)
                    If NOT a folder:
                    │
                    ├─► Get_file_content (SFTP - Get Content)
                    │       Downloads file content
                    │
                    └─► Compose (Data Operations)
                            Strips XML declarations:
                            - Removes: <?xml version="1.0" encoding="utf-8"?><contacts...>
                            - Removes: </contacts>

                    Else:
                    └─► (No action)
```

### Processing Logic Analysis

The workflow processes XML files from SFTP:

1. Lists files from `/customerExport` folder on `ftp.voyado.com`
2. For each file (excluding folders):
   - Gets file content
   - Strips XML wrapper elements (contacts root element)
3. **No output action** - The Compose result is not used anywhere

⚠️ **INCOMPLETE WORKFLOW**: The Compose action output is not consumed by any subsequent action. This workflow appears to be under development or incomplete.

---

## Connectors

| Connector | Auth Method          | Connection Name      | Status    |
| --------- | -------------------- | -------------------- | --------- |
| SFTP-SSH  | 🟡 Username/Password | VoyadoSftpConnection | Connected |

### Connection Details

| Setting                 | Value                      |
| ----------------------- | -------------------------- |
| Host                    | ftp.voyado.com             |
| Port                    | 22                         |
| Username                | clasohlson.staging.contica |
| Root Folder             | /                          |
| Accept Any SSH Host Key | ⚠️ **TRUE**                |

### Authentication Assessment

| Aspect                  | Status          | Notes                                     |
| ----------------------- | --------------- | ----------------------------------------- |
| Managed Identity        | N/A             | SFTP connector requires username/password |
| Hardcoded Secrets       | ⚠️ Risk         | Password stored in connection             |
| Key Vault Integration   | ❌ None         | Password not from Key Vault               |
| SSH Host Key Validation | 🔴 **DISABLED** | Accepts any host key - MITM vulnerability |

---

## Error Handling Assessment

| Aspect                  | Status             | Notes                |
| ----------------------- | ------------------ | -------------------- |
| Scopes                  | ❌ Not Used        | No try-catch pattern |
| Try-Catch Pattern       | ❌ Not Implemented | No error handling    |
| Retry Policies          | ❌ Default Only    | No custom retries    |
| Terminate Actions       | ❌ None            | No termination logic |
| Error Notifications     | ❌ None            | No alerting          |
| Run After Configuration | ⚠️ Default         | Only success paths   |

**Overall Rating**: 🔴 **POOR**

### Critical Gaps

1. **No error handling for SFTP operations** - Connection failures or file access errors are unhandled
2. **No response configuration** - HTTP trigger doesn't return a response to caller
3. **No logging** - No tracking of files processed

---

## Dependencies

| Dependency Type | Resource       | Details                 |
| --------------- | -------------- | ----------------------- |
| External SFTP   | ftp.voyado.com | Folder: /customerExport |

### Dependency Diagram

```
┌─────────────────────────────────────┐
│  External System: Voyado            │
│  ├─ SFTP: ftp.voyado.com:22        │
│  │   └─ /customerExport ───────────┼───► [cosi-member-adobe-dev-logic]
│  └─ User: clasohlson.staging        │           │
└─────────────────────────────────────┘           │
                                                  ▼
                                          [No Output - Incomplete]
```

---

## Security Findings

| Severity        | Finding                                              | Details                            |
| --------------- | ---------------------------------------------------- | ---------------------------------- |
| 🔴 **CRITICAL** | HTTP trigger has no authentication                   | Anyone can invoke with trigger URL |
| 🔴 HIGH         | SSH host key validation disabled                     | MITM attacks possible              |
| 🔴 HIGH         | External SFTP credentials stored in plain connection | Should use Key Vault               |
| ⚠️ MEDIUM       | Accessing external system (Voyado)                   | Third-party dependency             |
| ⚠️ MEDIUM       | Workflow is incomplete                               | Compose output not used            |

---

## Recommendations

### Priority 1 - Critical Security Fixes

1. **Enable HTTP Trigger Authentication**
   - Option A: Enable Azure AD authentication
   - Option B: Add SAS authentication
   - Option C: Add IP restrictions for known callers only

2. **Enable SSH Host Key Validation**
   - Obtain and configure the Voyado SFTP server's SSH host key
   - Set `acceptAnySshHostKey: false`

3. **Secure SFTP Credentials**
   - Store SFTP password in Key Vault
   - Consider using SSH key authentication if supported

### Priority 2 - Completeness

4. **Complete the Workflow**
   - Add output action after Compose (HTTP response, Service Bus, storage, etc.)
   - Or add response action to return processed data

5. **Add Response Action**
   - Return HTTP 200 with processing summary
   - Return HTTP 500 on errors

### Priority 3 - Resilience

6. **Add Error Handling**
   - Wrap SFTP operations in try-catch scope
   - Return proper HTTP error codes on failure

7. **Add Retry Policy**
   - Configure exponential retry for SFTP operations

### Priority 4 - Observability

8. **Add Tracked Properties**
   - File count processed
   - Processing duration

9. **Create Alert Rule**
   - Monitor for failures and long-running executions

---

## XML Processing Details

The Compose action performs XML manipulation:

**Input Pattern**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<contacts xmlns="http://eClub.Schemas.ExportMember">
  <!-- contact data -->
</contacts>
```

**Output Pattern**:

```xml
  <!-- contact data (inner XML only) -->
```

This suggests the workflow is intended to:

1. Download member export files from Voyado
2. Strip the XML wrapper
3. (Missing) Send the inner content somewhere (API, database, etc.)

---

## Environment Context

This is a **Development** environment Logic App (per tags). The security issues should be addressed before promotion to higher environments.

---

## Raw Definition

```json
{
  "triggers": {
    "When_a_HTTP_request_is_received": {
      "kind": "Http",
      "type": "Request"
    }
  },
  "actions": {
    "List_files_in_folder": {
      "type": "ApiConnection",
      "inputs": {
        "path": "/datasets/default/folders/@{encodeURIComponent('/customerExport')}"
      }
    },
    "For_each": {
      "type": "Foreach",
      "foreach": "@body('List_files_in_folder')",
      "actions": {
        "Check_if_item_is_folder": {
          "type": "If",
          "expression": { "equals": ["@item()['IsFolder']", false] },
          "actions": {
            "Get_file_content": { "type": "ApiConnection" },
            "Compose": {
              "type": "Compose",
              "inputs": "@replace(replace(body('Get_file_content'), '<?xml...>', ''), '</contacts>', '')"
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
