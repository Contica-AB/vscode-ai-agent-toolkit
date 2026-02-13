# Connector Inventory

**Client**: Contica Final Test  
**Generated**: 2026-02-13  
**Scope**: All Logic Apps in AIS Platform Dev subscription

---

## Executive Summary

| Metric                        | Value    |
| ----------------------------- | -------- |
| Total Logic Apps              | 3        |
| Unique Connector Types        | 4        |
| Total Connector Instances     | 7        |
| Using Managed Identity        | 0 (0%)   |
| Using Connection Strings/Keys | 7 (100%) |

**🔴 CRITICAL**: No connectors use Managed Identity authentication. All use legacy credential-based methods.

---

## Connector Type Summary

| Connector Type     | Count | Auth Method       | Security Rating |
| ------------------ | ----- | ----------------- | --------------- |
| Service Bus        | 3     | Connection String | 🔴 HIGH RISK    |
| Azure Blob Storage | 2     | Storage Key       | 🔴 HIGH RISK    |
| SFTP-SSH           | 1     | Username/Password | 🔴 HIGH RISK    |
| HTTP (Trigger)     | 1     | None configured   | 🔴 CRITICAL     |

---

## Detailed Connector Inventory

### 1. Service Bus Connectors

#### Connector: servicebus-1

- **Used By**: demo-upload-webinar-la
- **Connection Name**: `servicebus-1`
- **Namespace**: aisplatform-dev-messaging-bus.servicebus.windows.net
- **Queue**: `faktura-queue`
- **Operation**: GetMessages (trigger)
- **Authentication**: Connection String
- **Managed Identity**: ❌ No
- **Gateway**: None

#### Connector: servicebus (demo-webinar-la)

- **Used By**: demo-webinar-la
- **Connection Name**: `servicebus`
- **Namespace**: aisplatform-dev-messaging-bus.servicebus.windows.net
- **Queue**: `faktura-queue`
- **Operation**: SendMessage
- **Authentication**: Connection String
- **Managed Identity**: ❌ No
- **Gateway**: None

#### Connector: servicebus (cosi-member-adobe-dev-logic)

- **Used By**: cosi-member-adobe-dev-logic
- **Connection Name**: `servicebus`
- **Namespace**: (configured in parameters)
- **Queue**: Unknown
- **Operation**: SendMessage
- **Authentication**: Connection String
- **Managed Identity**: ❌ No
- **Gateway**: None

---

### 2. Azure Blob Storage Connectors

#### Connector: azureblob (demo-upload-webinar-la)

- **Used By**: demo-upload-webinar-la
- **Connection Name**: `azureblob`
- **Storage Account**: demowebinarsa
- **Container**: `faktura`
- **Operation**: CreateFile
- **Authentication**: Storage Account Key
- **Managed Identity**: ❌ No
- **Gateway**: None

#### Connector: azureblob (demo-webinar-la)

- **Used By**: demo-webinar-la
- **Connection Name**: `azureblob`
- **Storage Account**: demowebinarsa
- **Container**: `faktura`
- **Operation**: ListFolder, GetFileContent
- **Authentication**: Storage Account Key
- **Managed Identity**: ❌ No
- **Gateway**: None

---

### 3. SFTP-SSH Connector

#### Connector: sftpwithssh

- **Used By**: cosi-member-adobe-dev-logic
- **Connection Name**: `sftpwithssh`
- **Host**: (configured in parameters)
- **Port**: 22 (default)
- **Operation**: CreateFile
- **Authentication**: Username/Password
- **SSH Host Key Validation**: ❌ DISABLED
- **Managed Identity**: ❌ No (not supported)
- **Gateway**: None

**🔴 CRITICAL FINDING**: SSH host key validation is disabled, making this connection vulnerable to man-in-the-middle attacks.

---

### 4. HTTP Trigger

#### Connector: manual (HTTP Request)

- **Used By**: cosi-member-adobe-dev-logic
- **Type**: Trigger (not connector)
- **Schema**: JSON with properties (documentNumber, documentType, etc.)
- **Authentication**: ❌ NONE CONFIGURED
- **Relative Path**: Not set

**🔴 CRITICAL FINDING**: HTTP trigger has no authentication configured. Anyone with the endpoint URL can invoke this Logic App.

---

## Connector-to-Logic App Matrix

| Logic App                   | Service Bus  | Blob Storage | SFTP-SSH | HTTP Trigger |
| --------------------------- | ------------ | ------------ | -------- | ------------ |
| demo-upload-webinar-la      | ✅ (trigger) | ✅           | -        | -            |
| demo-webinar-la             | ✅ (action)  | ✅           | -        | -            |
| cosi-member-adobe-dev-logic | ✅           | -            | ✅       | ✅           |

---

## Authentication Risk Analysis

### High Risk Patterns Identified

1. **Connection String Proliferation**
   - 5 connectors use connection strings
   - Connection strings may be shared across environments
   - No rotation policy identified
   - Credentials stored in API Connection resources

2. **No Managed Identity Usage**
   - 0% adoption of Managed Identity
   - All Logic Apps support System-assigned MI
   - Modern Service Bus and Blob connectors support MI auth

3. **SFTP Credentials**
   - Username/password stored in connection
   - SSH host key validation disabled
   - No certificate-based authentication

4. **Unauthenticated HTTP Endpoint**
   - HTTP trigger without authentication
   - Publicly accessible once URL is known
   - No AAD, API Key, or SAS protection

---

## Recommendations

### Immediate (HIGH Priority)

| #   | Action                                   | Affected Resources          | Effort |
| --- | ---------------------------------------- | --------------------------- | ------ |
| 1   | Enable HTTP trigger authentication       | cosi-member-adobe-dev-logic | S      |
| 2   | Enable SSH host key validation           | SFTP-SSH connection         | S      |
| 3   | Migrate Service Bus to Managed Identity  | 3 Logic Apps                | M      |
| 4   | Migrate Blob Storage to Managed Identity | 2 Logic Apps                | M      |

### Short-term (MEDIUM Priority)

| #   | Action                                    | Affected Resources          | Effort |
| --- | ----------------------------------------- | --------------------------- | ------ |
| 5   | Implement connection string rotation      | All Service Bus connections | M      |
| 6   | Document SFTP credential rotation process | cosi-member-adobe-dev-logic | S      |
| 7   | Audit API Connection access permissions   | All connections             | S      |

### Best Practice (LOW Priority)

| #   | Action                                              | Affected Resources | Effort |
| --- | --------------------------------------------------- | ------------------ | ------ |
| 8   | Create dedicated Managed Identities per environment | All Logic Apps     | M      |
| 9   | Implement Azure Policy for MI enforcement           | Subscription       | L      |
| 10  | Document connection inventory in wiki               | All                | S      |

---

## Appendix: Connection Resource Details

### API Connections in Subscription

| Connection Name | Type                      | Resource Group           | State               |
| --------------- | ------------------------- | ------------------------ | ------------------- |
| azureblob       | Microsoft.Web/connections | rg-demo-webinar          | Confirmed connected |
| servicebus      | Microsoft.Web/connections | rg-demo-webinar          | Confirmed connected |
| servicebus-1    | Microsoft.Web/connections | rg-demo-webinar          | Confirmed connected |
| sftpwithssh     | Microsoft.Web/connections | rg-cosi-member-adobe-dev | Confirmed connected |

---

_Generated as part of Azure Integration Services Assessment_
