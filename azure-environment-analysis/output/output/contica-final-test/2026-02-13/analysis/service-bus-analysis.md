# Service Bus Deep Dive

> **Client**: Contica Final Test  
> **Subscription**: AIS Platform Dev  
> **Analysis Date**: 2026-02-13

---

## Summary

| Metric              | Value               |
| ------------------- | ------------------- |
| Total Namespaces    | 4                   |
| Total Queues        | 2                   |
| Total Topics        | 0                   |
| SKU Distribution    | 3 Standard, 1 Basic |
| TLS Compliance      | ✅ All use TLS 1.2  |
| Zone Redundant      | ✅ All enabled      |
| Local Auth Disabled | ❌ None             |

---

## Namespace Inventory

| Namespace                     | Resource Group     | SKU      | Region        | Zone Redundant |
| ----------------------------- | ------------------ | -------- | ------------- | -------------- |
| aisplatform-dev-messaging-bus | rg-demo-webinar    | Basic    | westeurope    | ✅             |
| simontestservicebus-dev-sbs   | testing-deployment | Standard | westeurope    | ✅             |
| sb-inv-001-ext-2216           | rg-inv-001-ext     | Standard | westeurope    | ✅             |
| sbclsmetricsdev001            | rg-cls-metrics-dev | Standard | swedencentral | ✅             |

---

## Security Assessment

| Namespace                     | TLS    | Public Access | Local Auth | Private Endpoint |
| ----------------------------- | ------ | ------------- | ---------- | ---------------- |
| aisplatform-dev-messaging-bus | 1.2 ✅ | ⚠️ Enabled    | ⚠️ Enabled | ❌ None          |
| simontestservicebus-dev-sbs   | 1.2 ✅ | ⚠️ Enabled    | ⚠️ Enabled | ❌ None          |
| sb-inv-001-ext-2216           | 1.2 ✅ | ⚠️ Enabled    | ⚠️ Enabled | ❌ None          |
| sbclsmetricsdev001            | 1.2 ✅ | ⚠️ Enabled    | ⚠️ Enabled | ❌ None          |

### Security Findings

| Severity  | Finding                                                | Affected Namespaces |
| --------- | ------------------------------------------------------ | ------------------- |
| ⚠️ MEDIUM | Local authentication (connection strings) not disabled | All 4               |
| ⚠️ MEDIUM | Public network access enabled                          | All 4               |
| ℹ️ LOW    | No private endpoints configured                        | All 4               |

---

## Detailed Namespace Analysis

### 1. aisplatform-dev-messaging-bus

**Role**: Message broker for demo invoice processing workflows

| Property       | Value       | Assessment                                    |
| -------------- | ----------- | --------------------------------------------- |
| SKU            | Basic       | ⚠️ Limited features (no topics/subscriptions) |
| Location       | West Europe | ✅                                            |
| TLS Version    | 1.2         | ✅                                            |
| Zone Redundant | Yes         | ✅                                            |
| Public Access  | Enabled     | ⚠️ Should restrict in production              |
| Local Auth     | Enabled     | ⚠️ Should disable and use AAD                 |

#### Queues

| Queue         | Max Size | DLQ on Expiration | Max Delivery | Lock Duration |
| ------------- | -------- | ----------------- | ------------ | ------------- |
| faktura-queue | 1 GB     | ❌                | 10           | 1 minute      |

**Queue Assessment - faktura-queue**:

- ⚠️ Dead-lettering on message expiration disabled
- ⚠️ Lock duration (1 min) may be too short for complex processing
- ✅ Max delivery count (10) is reasonable

#### Consumers

| Logic App              | Operation                      |
| ---------------------- | ------------------------------ |
| demo-webinar-la        | Producer (sends to queue)      |
| demo-upload-webinar-la | Consumer (receives from queue) |

---

### 2. simontestservicebus-dev-sbs

**Role**: Test/demo namespace

| Property       | Value       | Assessment         |
| -------------- | ----------- | ------------------ |
| SKU            | Standard    | ✅ Supports topics |
| Location       | West Europe | ✅                 |
| TLS Version    | 1.2         | ✅                 |
| Zone Redundant | Yes         | ✅                 |
| Queues         | 0           | ℹ️ Empty namespace |
| Topics         | 0           | ℹ️ Empty namespace |

**Assessment**:

- ⚠️ Empty namespace - consider cleanup if unused
- Name suggests test/development purpose

---

### 3. sb-inv-001-ext-2216

**Role**: Integration worklog processing

| Property       | Value       | Assessment |
| -------------- | ----------- | ---------- |
| SKU            | Standard    | ✅         |
| Location       | West Europe | ✅         |
| TLS Version    | 1.2         | ✅         |
| Zone Redundant | Yes         | ✅         |

#### Queues

| Queue                        | Max Size | DLQ on Expiration | Max Delivery | Lock Duration |
| ---------------------------- | -------- | ----------------- | ------------ | ------------- |
| sbq-001-inv-001-worklog-prod | 1 GB     | ❌                | 10           | 5 minutes     |

**Queue Assessment - sbq-001-inv-001-worklog-prod**:

- ⚠️ Dead-lettering on message expiration disabled
- ✅ Lock duration (5 min) reasonable for worklog processing
- ✅ Max delivery count (10) is reasonable
- ⚠️ Queue name suggests "prod" but is in dev subscription

---

### 4. sbclsmetricsdev001

**Role**: CLS Metrics solution messaging

| Property       | Value          | Assessment |
| -------------- | -------------- | ---------- |
| SKU            | Standard       | ✅         |
| Location       | Sweden Central | ✅         |
| TLS Version    | 1.2            | ✅         |
| Zone Redundant | Yes            | ✅         |
| Queues         | 0              | ℹ️ Empty   |
| Topics         | 0              | ℹ️ Empty   |

**Assessment**:

- ⚠️ Empty namespace - may be unused or provisioned for future use

---

## Integration Patterns

### Queue-Based Decoupling Pattern

The `faktura-queue` implements a classic queue-based decoupling pattern:

```
┌──────────────────┐        ┌─────────────────────┐        ┌──────────────────────┐
│  Blob Storage    │───────►│  demo-webinar-la    │───────►│  faktura-queue       │
│  /fakturor-sftp  │ trigger│  (Producer)         │ enqueue│  (aisplatform-dev-   │
└──────────────────┘        └─────────────────────┘        │  messaging-bus)      │
                                                            └──────────┬───────────┘
                                                                       │ dequeue
                            ┌─────────────────────┐        ┌───────────▼──────────┐
                            │  Blob Storage       │◄───────│  demo-upload-        │
                            │  /bankens-sftp      │  upload│  webinar-la          │
                            └─────────────────────┘        │  (Consumer)          │
                                                            └──────────────────────┘
```

**Pattern Assessment**:

- ✅ Good separation of concerns
- ⚠️ No dead letter handling configured
- ⚠️ No monitoring/alerting for queue depth
- ⚠️ Both Logic Apps use connection strings instead of Managed Identity

---

## Recommendations

### Priority 1 - Security

| #   | Recommendation                    | Namespace | Effort |
| --- | --------------------------------- | --------- | ------ |
| 1   | Disable local authentication      | All       | Low    |
| 2   | Configure Managed Identity access | All       | Medium |
| 3   | Add IP/VNet restrictions          | All       | Medium |

### Priority 2 - Resilience

| #   | Recommendation                              | Namespace                   | Effort |
| --- | ------------------------------------------- | --------------------------- | ------ |
| 4   | Enable dead-lettering on message expiration | faktura-queue, worklog-prod | Low    |
| 5   | Implement dead-letter queue monitoring      | All active queues           | Low    |
| 6   | Review lock duration settings               | faktura-queue               | Low    |

### Priority 3 - Operations

| #   | Recommendation                             | Namespace                                       | Effort |
| --- | ------------------------------------------ | ----------------------------------------------- | ------ |
| 7   | Remove unused namespaces                   | simontestservicebus-dev-sbs, sbclsmetricsdev001 | Low    |
| 8   | Add queue depth alerts                     | All active queues                               | Low    |
| 9   | Implement retry/DLQ handling in Logic Apps | demo-upload-webinar-la                          | Medium |

### Priority 4 - Governance

| #   | Recommendation                           | Namespace           | Effort |
| --- | ---------------------------------------- | ------------------- | ------ |
| 10  | Add consistent tagging                   | All                 | Low    |
| 11  | Review "prod" naming in dev subscription | sb-inv-001-ext-2216 | Low    |
| 12  | Document queue ownership and purpose     | All                 | Low    |

---

## Dead Letter Queue Analysis

Currently, no dead-letter queue monitoring is in place. Recommended approach:

```
Implement Azure Monitor alerts for:
- DeadLetteredMessages > 0
- ActiveMessages > 100 (adjust threshold)
```

---

## Capacity Planning

| Namespace                     | Current SKU | Max Queue Size | Recommendation                     |
| ----------------------------- | ----------- | -------------- | ---------------------------------- |
| aisplatform-dev-messaging-bus | Basic       | 1 GB           | Consider Standard if topics needed |
| sb-inv-001-ext-2216           | Standard    | 1 GB           | Adequate for dev                   |
| Others                        | Standard    | 1 GB           | Adequate                           |

---

_Analysis Date: 2026-02-13_
