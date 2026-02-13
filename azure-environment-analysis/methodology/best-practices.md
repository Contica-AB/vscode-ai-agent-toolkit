# Azure Integration Services Best Practices

This document defines best practices for Azure Integration Services. Use this as a reference when evaluating client environments.

> **⚠️ Note**: The primary evaluation baseline is the Contica SSOT standards in `/standards/contica-ssot/`. This document provides supplementary guidance. When there is a conflict, the SSOT standards take precedence.
>
> **Azure CAF/WAF**: Use Microsoft Docs MCP to search for Azure Cloud Adoption Framework and Well-Architected Framework guidance for each category. Include CAF/WAF links as "Microsoft Recommendation" tips alongside SSOT findings.

---

## 1. Error Handling Patterns

### 1.1 Logic Apps Error Handling

#### Scopes for Try-Catch
**Best Practice**: Use Scope actions to group related actions and implement try-catch-finally patterns.

```json
{
  "Try_Scope": {
    "type": "Scope",
    "actions": { /* main logic */ }
  },
  "Catch_Scope": {
    "type": "Scope",
    "runAfter": {
      "Try_Scope": ["Failed", "TimedOut"]
    },
    "actions": { /* error handling */ }
  },
  "Finally_Scope": {
    "type": "Scope",
    "runAfter": {
      "Try_Scope": ["Succeeded", "Failed", "Skipped", "TimedOut"],
      "Catch_Scope": ["Succeeded", "Failed", "Skipped", "TimedOut"]
    },
    "actions": { /* cleanup */ }
  }
}
```

**What to look for**:
- ✅ Scopes used to group related actions
- ✅ Catch scopes with `runAfter` on Failed/TimedOut
- ✅ Error details captured and logged
- ❌ No error handling (actions run sequentially with no protection)
- ❌ Generic catch-all without proper logging

#### Retry Policies
**Best Practice**: Configure retry policies appropriate to the operation type.

| Scenario | Policy | Interval | Count |
|----------|--------|----------|-------|
| Transient failures (HTTP 429, 503) | Exponential | Start 5s | 4 retries |
| Database operations | Fixed | 30s | 3 retries |
| External API calls | Exponential | Start 10s | 3 retries |
| File operations | None | - | - |

**What to look for**:
- ✅ Retry policies configured on HTTP actions
- ✅ Exponential backoff for rate-limited APIs
- ✅ Reasonable retry counts (not infinite)
- ❌ Default policies on everything (4 retries may be too many)
- ❌ No retry on operations that should retry

#### Terminate Action
**Best Practice**: Use Terminate action with "Failed" status for critical failures that should stop the workflow.

**What to look for**:
- ✅ Terminate used for unrecoverable errors
- ✅ Error code and message populated
- ❌ Workflow continues after critical failures
- ❌ Terminate used too liberally (everything fails hard)

### 1.2 Service Bus Patterns

#### Dead-Letter Queue Handling
**Best Practice**: 
- Configure dead-letter queues on all queues/subscriptions
- Monitor DLQ message count
- Implement DLQ processing Logic App

**What to look for**:
- ✅ Max delivery count configured (typically 10)
- ✅ DLQ monitored with alerts
- ✅ Process to review/reprocess DLQ messages
- ❌ Messages silently dead-lettered with no monitoring
- ❌ DLQ growing unbounded

#### Duplicate Detection
**Best Practice**: Enable duplicate detection for critical message flows.

**What to look for**:
- ✅ Duplicate detection enabled where needed
- ✅ Appropriate time window (based on retry scenarios)
- ❌ No duplicate detection on financial/order messages

### 1.3 Compensation Logic

**Best Practice**: For multi-step transactions, implement compensation (undo) logic.

**What to look for**:
- ✅ Compensating transactions defined
- ✅ Saga pattern for distributed transactions
- ✅ Idempotent operations
- ❌ Partial state possible with no rollback

---

## 2. Naming Conventions

### 2.1 Microsoft Recommended Patterns

| Resource Type | Pattern | Example |
|---------------|---------|---------|
| Resource Group | `rg-{workload}-{env}-{region}` | `rg-integration-prod-eus` |
| Logic App (Consumption) | `logic-{workload}-{function}` | `logic-orders-processing` |
| Logic App (Standard) | `logic-{workload}-{env}` | `logic-integration-prod` |
| Function App | `func-{workload}-{function}` | `func-orders-validator` |
| Service Bus Namespace | `sb-{workload}-{env}` | `sb-integration-prod` |
| Service Bus Queue | `sbq-{function}` | `sbq-orders-inbound` |
| Service Bus Topic | `sbt-{domain}` | `sbt-orders` |
| Service Bus Subscription | `sbs-{subscriber}` | `sbs-warehouse` |
| Key Vault | `kv-{workload}-{env}` | `kv-integration-prod` |
| Storage Account | `st{workload}{env}` | `stintegrationprod` |
| API Management | `apim-{workload}-{env}` | `apim-integration-prod` |
| App Configuration | `appcs-{workload}-{env}` | `appcs-integration-prod` |
| Application Insights | `appi-{workload}-{env}` | `appi-integration-prod` |

### 2.2 Evaluation Criteria

**What to look for**:
- ✅ Consistent pattern across all resources
- ✅ Environment clearly indicated
- ✅ Purpose/function identifiable from name
- ✅ Region indicated for multi-region deployments
- ❌ Inconsistent patterns (mix of conventions)
- ❌ Cryptic names (e.g., `logic1`, `test123`)
- ❌ No environment differentiation
- ❌ Names that don't indicate purpose

---

## 3. Tagging Strategy

### 3.1 Required Tags

| Tag | Purpose | Example Values |
|-----|---------|----------------|
| `environment` | Deployment environment | `dev`, `test`, `staging`, `prod` |
| `owner` | Responsible team/person | `integration-team`, `john.doe@company.com` |
| `cost-center` | Cost allocation | `CC-12345`, `IT-Integration` |
| `project` | Project/application name | `order-management`, `customer-sync` |
| `created-by` | Deployment mechanism | `terraform`, `arm-template`, `manual` |

### 3.2 Recommended Tags

| Tag | Purpose | Example Values |
|-----|---------|----------------|
| `business-unit` | Business ownership | `sales`, `finance`, `operations` |
| `data-classification` | Data sensitivity | `public`, `internal`, `confidential` |
| `criticality` | Business criticality | `low`, `medium`, `high`, `critical` |
| `sla` | Service level | `bronze`, `silver`, `gold` |
| `compliance` | Compliance requirements | `pci`, `hipaa`, `gdpr` |

### 3.3 Evaluation Criteria

**What to look for**:
- ✅ All resources have required tags
- ✅ Tag values are consistent (not `prod` and `production`)
- ✅ Tags support cost allocation
- ✅ Tags support operational queries
- ❌ Missing tags on resources
- ❌ Inconsistent tag values
- ❌ No tag governance/enforcement

---

## 4. Environment Separation

### 4.1 Subscription Strategy

**Best Practice**: Separate subscriptions for production and non-production.

| Model | Description | When to Use |
|-------|-------------|-------------|
| Single Subscription | All environments | Small organizations, dev/test only |
| Prod/Non-Prod Split | 2 subscriptions | Most organizations |
| Per-Environment | Dev, Test, Prod subscriptions | Large enterprises |
| Per-Team | Team-specific subscriptions | Large, decentralized orgs |

### 4.2 Resource Group Strategy

**Best Practice**: Separate resource groups by:
- Environment (dev, test, prod)
- Lifecycle (deploy together, delete together)
- Permission boundary

**What to look for**:
- ✅ Clear environment separation
- ✅ Logical resource grouping
- ✅ Permissions scoped appropriately
- ❌ Mixed environments in one resource group
- ❌ Monolithic resource groups with everything
- ❌ No clear grouping strategy

### 4.3 Configuration Separation

**Best Practice**: Use Azure App Configuration or environment-specific Key Vaults.

**What to look for**:
- ✅ Environment-specific configuration stores
- ✅ No production config in non-prod
- ✅ Feature flags for controlled rollout
- ❌ Hardcoded environment differences
- ❌ Shared configuration across environments

---

## 5. CI/CD Patterns

### 5.1 Infrastructure as Code

**Best Practice**: All integration resources deployed via IaC.

| Tool | Use Case |
|------|----------|
| ARM Templates | Native Azure, complex deployments |
| Bicep | Simplified ARM, Azure-native |
| Terraform | Multi-cloud, existing Terraform estate |
| Pulumi | Developer-familiar languages |

**What to look for**:
- ✅ All resources defined in code
- ✅ Templates in source control
- ✅ Parameterized for environments
- ❌ Manual deployments in production
- ❌ No source control for templates
- ❌ Hardcoded values in templates

### 5.2 Logic App Deployment

**Best Practice**: 
- Consumption: ARM templates with parameters file per environment
- Standard: ZIP deploy via CI/CD pipeline

**What to look for**:
- ✅ Automated deployment pipeline
- ✅ Parameter files for each environment
- ✅ Connection references (not embedded connections)
- ❌ Export/import via portal
- ❌ Direct edits in production

### 5.3 Pipeline Best Practices

**What to look for**:
- ✅ Separate pipelines for build and release
- ✅ Approval gates for production
- ✅ Automated testing before deployment
- ✅ Rollback capability
- ❌ Direct push to production
- ❌ No testing gate
- ❌ No approval process

---

## 6. Monitoring and Alerting

### 6.1 Diagnostic Settings

**Best Practice**: All resources send diagnostics to Log Analytics.

| Resource | Logs to Enable |
|----------|----------------|
| Logic Apps | WorkflowRuntime |
| Service Bus | OperationalLogs |
| Key Vault | AuditEvent |
| APIM | GatewayLogs, WebSocketConnectionLogs |
| Function Apps | FunctionAppLogs |
| Storage | StorageRead, StorageWrite |

**What to look for**:
- ✅ Central Log Analytics workspace
- ✅ All resources sending logs
- ✅ Appropriate retention configured
- ❌ No diagnostic settings
- ❌ Logs only to Storage (hard to query)
- ❌ Inconsistent log destinations

### 6.2 Alert Rules

**Best Practice**: Alerts for operational health and security events.

| Alert Type | Threshold | Severity |
|------------|-----------|----------|
| Logic App failures | > 5 in 15 min | Warning |
| Logic App failure rate | > 10% | Error |
| Service Bus DLQ count | > 100 | Warning |
| Key Vault access denied | > 3 in 5 min | Critical |
| Function App errors | > 10 in 5 min | Warning |
| APIM 5xx responses | > 1% | Warning |

**What to look for**:
- ✅ Alerts on failures and errors
- ✅ Alerts on security events
- ✅ Alerts route to appropriate teams
- ✅ Actionable alert thresholds
- ❌ No alerting configured
- ❌ Alert fatigue (too sensitive)
- ❌ Alerts nobody monitors

### 6.3 Dashboards

**Best Practice**: Operational dashboards for integration health.

**What to look for**:
- ✅ Overview dashboard exists
- ✅ Key metrics visible
- ✅ Drill-down capability
- ❌ No operational visibility
- ❌ Reliance on portal for monitoring

---

## 7. Performance and Scalability

### 7.1 Logic Apps Performance

**Best Practice**: Optimize for throughput and reliability.

| Pattern | Recommendation |
|---------|----------------|
| Large messages | Use chunk transfer or claim check |
| High throughput | Use batching, parallel branches |
| Long-running | Use durable functions or async patterns |
| Complex orchestration | Break into child workflows |

**What to look for**:
- ✅ Appropriate patterns for use case
- ✅ Pagination for large result sets
- ✅ Chunking for large files
- ❌ Processing large payloads inline
- ❌ Sequential processing when parallel is possible
- ❌ Monolithic workflows doing everything

### 7.2 Service Bus Sizing

**Best Practice**: Choose appropriate tier and configure for load.

| Tier | Use Case |
|------|----------|
| Basic | Dev/test, simple queues |
| Standard | Production, topics needed |
| Premium | High throughput, VNet, partitioning |

**What to look for**:
- ✅ Tier appropriate for requirements
- ✅ Partitioning for high throughput
- ✅ Premium for production (if VNet needed)
- ❌ Basic tier in production
- ❌ Undersized for load

### 7.3 APIM Caching

**Best Practice**: Cache responses where appropriate.

**What to look for**:
- ✅ Cache policies on stable data
- ✅ Appropriate cache duration
- ✅ Cache vary by headers where needed
- ❌ No caching strategy
- ❌ Caching sensitive/dynamic data

---

## 8. Cost Optimization

### 8.1 Right-Sizing

**Best Practice**: Choose appropriate SKUs for workload.

| Resource | Cost Consideration |
|----------|-------------------|
| Logic Apps | Consumption for low-volume, Standard for high-volume |
| Service Bus | Basic/Standard adequate for most, Premium only when needed |
| APIM | Developer/Basic for dev, Standard/Premium for prod |
| Functions | Consumption for sporadic, Premium for consistent load |

**What to look for**:
- ✅ SKU matches workload
- ✅ Dev/test uses cheaper tiers
- ✅ Regular review of usage
- ❌ Premium everywhere
- ❌ No usage analysis

### 8.2 Reserved Capacity

**Best Practice**: Use reserved capacity for predictable workloads.

**What to look for**:
- ✅ Reservations for stable production workloads
- ✅ Annual review of reservations
- ❌ All pay-as-you-go for predictable loads

### 8.3 Idle Resource Cleanup

**Best Practice**: Remove or disable unused resources.

**What to look for**:
- ✅ Regular review process
- ✅ Dead flows identified and removed
- ✅ Dev resources scaled down after hours
- ❌ Forgotten resources running
- ❌ No cleanup process

---

## Evaluation Summary Template

```markdown
## Best Practices Evaluation

**Client**: {client_name}
**Date**: YYYY-MM-DD

### Compliance Summary

| Category | Score | Key Findings |
|----------|-------|--------------|
| Error Handling | ⬤⬤⬤◯◯ | |
| Naming Conventions | ⬤⬤⬤⬤◯ | |
| Tagging Strategy | ⬤⬤◯◯◯ | |
| Environment Separation | ⬤⬤⬤⬤⬤ | |
| CI/CD Patterns | ⬤⬤⬤◯◯ | |
| Monitoring & Alerting | ⬤⬤◯◯◯ | |
| Performance & Scalability | ⬤⬤⬤⬤◯ | |
| Cost Optimization | ⬤⬤⬤◯◯ | |

⬤ = Compliant, ◯ = Gap

### Key Deviations

1. {deviation description}
2. {deviation description}

### Recommendations

1. {recommendation}
2. {recommendation}
```
