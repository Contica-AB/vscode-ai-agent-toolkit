# Logic App Analysis: cosi-member-adobe-dev-logic

**Assessment Date:** 2026-02-11  
**Logic App Type:** Consumption  
**Subscription:** AIS Platform Dev  
**Resource Group:** cosi-member-adobe-0073.i001-dev-rg  
**Location:** Sweden Central

---

## Overview

| Property | Value                       |
| -------- | --------------------------- |
| Name     | cosi-member-adobe-dev-logic |
| State    | Enabled                     |
| Version  | 1.0.0.0                     |

---

## Workflow Description

This Logic App connects to an external SFTP server to retrieve customer export files in XML format. It processes the files by stripping XML headers and footers.

### Business Purpose

- Receive HTTP requests to trigger processing
- Connect to external SFTP server
- List and retrieve files from `/customerExport` folder
- Process XML contact export files (strip XML wrapper)

---

## Trigger

| Property     | Value                                        |
| ------------ | -------------------------------------------- |
| Type         | HTTP Request (When HTTP request is received) |
| Trigger Name | When_a_HTTP_request_is_received              |
| Method       | Any (not restricted)                         |
| Callback URL | Generated on save                            |

### Trigger Analysis

- **⚠️ No HTTP method restriction**: Accepts all HTTP methods
- **⚠️ No request schema**: No validation on incoming payload
- **⚠️ Public endpoint**: No IP restrictions or authentication
- **Recommendation**: Add request schema, restrict to POST, enable IP restrictions

---

## Actions

### Action Flow

```
[Trigger: HTTP Request]
    → [List_files_in_folder] (SFTP List)
    → [For_each] (Loop through files)
        → [Check_if_item_is_folder] (Condition)
            ├─ If NOT a folder:
            │   → [Get_file_content] (SFTP Get)
            │   → [Compose] (XML Transformation)
            └─ Else: (no action)
```

### Action Details

| #   | Action Name             | Type                    | Dependencies   | Notes                   |
| --- | ----------------------- | ----------------------- | -------------- | ----------------------- |
| 1   | List_files_in_folder    | SFTP - List Files       | Trigger        | Folder: /customerExport |
| 2   | For_each                | Control - For Each      | Action 1       | Loops through all files |
| 3   | Check_if_item_is_folder | Control - Condition     | Loop Item      | IsFolder == false       |
| 3a  | Get_file_content        | SFTP - Get File Content | Condition true | Gets file from SFTP     |
| 3b  | Compose                 | Data Operations         | Action 3a      | Strips XML wrapper      |

---

## Connectors Used

| Connector  | Type        | Status       | Authentication   |
| ---------- | ----------- | ------------ | ---------------- |
| SFTP - SSH | Managed API | ✅ Connected | SSH Key/Password |

### Connection Details

- **sftpwithssh**: Connects to external SFTP server
- **Folder Path**: /customerExport (encoded as L2N1c3RvbWVyRXhwb3J0)

---

## Data Transformation

### XML Processing

The Compose action strips the XML declaration and root element:

```javascript
// Input (example):
<?xml version="1.0" encoding="utf-8"?>
<contacts xmlns="http://eClub.Schemas.ExportMember">
  <!-- contact data -->
</contacts>

// Output:
  <!-- contact data only, no wrapper -->
```

### ⚠️ Transformation Issues

1. **Brittle string replacement**: Assumes exact header format
2. **No XML validation**: Doesn't validate well-formed XML
3. **Incomplete workflow**: Processed content isn't used anywhere

---

## Error Handling Analysis

### Current Error Handling

| Pattern                | Implemented | Notes                          |
| ---------------------- | ----------- | ------------------------------ |
| Try-Catch (Scope)      | ❌ No       | No scopes defined              |
| runAfter Configuration | ⚠️ Basic    | Only "Succeeded" conditions    |
| Terminate Action       | ❌ No       | No explicit failure handling   |
| Retry Policy           | ❌ Default  | Using default retry policy     |
| HTTP Response          | ❌ No       | No response returned to caller |

### ⚠️ Issues Found

1. **No HTTP response**: Caller never receives a response
2. **No SFTP error handling**: Connection failures not handled
3. **Orphaned output**: Compose action result is not used
4. **No file cleanup**: Files remain on SFTP after processing

### Recommendations

1. Add Response action to return status to caller
2. Add Scope with error handling around SFTP operations
3. Complete the workflow - send processed data somewhere
4. Implement file archival/deletion on SFTP

---

## Dependencies

### External Systems

- **SFTP Server**: External system (endpoint in connection)
- **Folder**: /customerExport
- **File Format**: XML (eClub.Schemas.ExportMember)

### ⚠️ No Downstream Dependencies

The workflow processes data but doesn't send it anywhere. This appears to be an incomplete implementation.

---

## Security Analysis

| Check             | Status            | Notes                                  |
| ----------------- | ----------------- | -------------------------------------- |
| HTTP Trigger Auth | ❌ None           | Public endpoint with SAS token only    |
| Managed Identity  | ❌ Not Applicable | SFTP uses username/password or SSH key |
| Secure Inputs     | ❌ Not Enabled    | SFTP content visible in run history    |
| Secure Outputs    | ❌ Not Enabled    | Processed data visible                 |
| IP Restrictions   | ❌ None           | Any IP can trigger                     |

### Security Recommendations

1. **HIGH**: Add IP restrictions to HTTP trigger
2. **HIGH**: Enable secure inputs/outputs (customer data exposure risk)
3. **MEDIUM**: Review SFTP credentials storage and rotation
4. **MEDIUM**: Consider restricting HTTP methods to POST only

---

## Performance Analysis

| Metric                | Value        | Assessment        |
| --------------------- | ------------ | ----------------- |
| Trigger Type          | Request      | ✅ On-demand      |
| For Each Concurrency  | Default (20) | OK                |
| Sequential Processing | Default      | Could parallelize |

---

## Workflow Completeness

### ⚠️ Incomplete Implementation

This Logic App appears to be incomplete:

| Expected Step         | Status         |
| --------------------- | -------------- |
| Receive trigger       | ✅ Implemented |
| List SFTP files       | ✅ Implemented |
| Get file content      | ✅ Implemented |
| Transform XML         | ✅ Implemented |
| **Output/Store data** | ❌ **Missing** |
| **Return response**   | ❌ **Missing** |
| **Clean up source**   | ❌ **Missing** |

### Recommendation

Complete the workflow by adding:

1. Data destination (Service Bus, Storage, API call)
2. HTTP Response action
3. SFTP file archival/deletion

---

## Compliance with SSOT

| Standard       | Compliance       | Notes                                |
| -------------- | ---------------- | ------------------------------------ |
| Authentication | ⚠️ Partial       | HTTP trigger is publicly accessible  |
| Error Handling | ❌ Non-Compliant | Missing all error handling           |
| Monitoring     | ❌ Unknown       | Check diagnostic settings            |
| Naming         | ⚠️ Partial       | Has project prefix, but inconsistent |

---

## Recommendations Summary

| Priority | Recommendation                          | Effort |
| -------- | --------------------------------------- | ------ |
| HIGH     | Complete the workflow - add data output | Medium |
| HIGH     | Add HTTP Response action                | Low    |
| HIGH     | Enable IP restrictions on HTTP trigger  | Low    |
| HIGH     | Add error handling for SFTP operations  | Medium |
| MEDIUM   | Enable secure inputs/outputs            | Low    |
| MEDIUM   | Improve XML transformation robustness   | Medium |
| LOW      | Add request/response schema             | Low    |

---

## Risk Assessment

**Overall Risk: MEDIUM-HIGH**

This Logic App has significant gaps:

1. **Incomplete**: Data is processed but not stored/forwarded
2. **Insecure**: HTTP trigger is publicly accessible
3. **No error handling**: Failures aren't handled or reported
4. **Potential data exposure**: Customer export data in run history

---

_Generated by Azure Integration Services Assessment Agent_
