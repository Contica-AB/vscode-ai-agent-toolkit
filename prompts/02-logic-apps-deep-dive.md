# Phase 2: Integration Services Deep Dive

## Objective
For each integration resource discovered in Phase 1, perform a detailed configuration and pattern analysis. This covers Logic Apps, Service Bus, Function Apps, API Management, Key Vault, Storage, Event Grid, Event Hub, and App Configuration.

---

## Output Location

Read the client name from the active client config.
Outputs for this phase go to: `/output/{client-name}/{YYYY-MM-DD}/analysis/`
- Logic Apps: `/output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/` (per-Logic-App files)
- Service Bus: `/output/{client-name}/{YYYY-MM-DD}/analysis/service-bus-analysis.md`
- Function Apps: `/output/{client-name}/{YYYY-MM-DD}/analysis/function-apps-analysis.md`
- API Management: `/output/{client-name}/{YYYY-MM-DD}/analysis/apim-analysis.md`
- Supporting Services: `/output/{client-name}/{YYYY-MM-DD}/analysis/supporting-services-analysis.md`

The folders should already exist from Phase 0.

---

## Tool Selection Strategy

> **MCP-First Rule**: Always try MCP tools first. Only fall back to CLI if MCP fails.

| Operation | Primary (MCP) | Fallback (CLI) |
|-----------|---------------|----------------|
| Get Workflow Definition (Consumption) | Logic Apps MCP | `az logic workflow show -g {rg} -n {name} -o json` |
| Get Workflow Definition (Standard) | Logic Apps MCP | `az rest --method GET --url ".../Microsoft.Web/sites/{name}/workflows/{workflowName}?api-version=2023-01-01"` |
| List Connections | Logic Apps MCP | `az rest --method GET --url ".../Microsoft.Web/connections?api-version=2016-06-01"` |
| Service Bus config | Azure MCP | `az servicebus namespace show` |
| Function App config | Azure MCP | `az functionapp show` |
| APIM config | Azure MCP | `az apim show` |
| Key Vault config | Azure MCP | `az keyvault show` |
| Storage config | Azure MCP | `az storage account show` |
| Event Grid config | Azure MCP | `az eventgrid topic show` |
| Event Hub config | Azure MCP | `az eventhubs namespace show` |
| App Configuration | Azure MCP | `az appconfig show` |

### CLI Fallback Commands (if MCP fails)

**Consumption Logic App:**
```bash
az logic workflow show \
  --resource-group "rg-name" \
  --name "logic-app-name" \
  --output json
```

**Standard Logic App (get all workflows):**
```bash
# List workflows in a Standard Logic App
az rest --method GET \
  --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Web/sites/{app-name}/workflows?api-version=2023-01-01"

# Get specific workflow definition
az rest --method GET \
  --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Web/sites/{app-name}/workflows/{workflow-name}?api-version=2023-01-01"
```

---

## Prerequisites

Before running this prompt:
1. **Phase 0 and Phase 1 must be complete**
2. Read `/output/{client-name}/{YYYY-MM-DD}/inventory/resources.json` to get the Logic Apps list
3. Have the client config available
4. Reference `/standards/contica-ssot/authentication-matrix.md` for MI requirements

---

## Prompt

```
I need to perform Phase 2: Integration Services Deep Dive for the Azure Integration Services assessment.

Read the inventory from Phase 1:
- Read /output/{client-name}/{YYYY-MM-DD}/inventory/resources.json
- Get the list of ALL integration resources (Logic Apps, Service Bus, Function Apps, APIM, Key Vault, Storage, Event Grid, Event Hub, App Configuration)

---

## PART A: Logic Apps Deep Dive

Get the list of all Logic Apps (Consumption and Standard).

For EACH Logic App, perform the following analysis:

### 1. Workflow Definition Analysis

Use Logic Apps MCP to get the workflow definition. If MCP fails, use CLI fallback:

**CLI Fallback for Consumption Logic Apps:**
```bash
az logic workflow show -g "{resource-group}" -n "{logic-app-name}" -o json
```

**CLI Fallback for Standard Logic Apps:**
```bash
az rest --method GET --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Web/sites/{app}/workflows/{workflow}?api-version=2023-01-01"
```

From the definition, extract:
- Full JSON definition (save to file)
- Trigger type and configuration
- All actions (enumerate each one)
- Control flow structures (conditions, loops, switches)

### 2. Connector Inventory

For each Logic App, identify:
- All connectors used (e.g., Office365, ServiceBus, HTTP, SQL)
- Connection references
- Authentication method for each connection:
  - Managed Identity
  - Connection string
  - OAuth
  - API Key

### 3. Error Handling Patterns

Analyze each workflow for:

a) **Scopes**
   - Are Scopes used for grouping?
   - Is there a try-catch pattern (Scope with runAfter on Failed)?
   
b) **Retry Policies**
   - Which actions have retry policies?
   - What type? (Fixed, Exponential, None)
   - Are they appropriate for the action type?

c) **Terminate Actions**
   - Is Terminate used for critical failures?
   - Are error codes/messages populated?

d) **Run After Configuration**
   - Are there actions configured to run after failures?
   - Is there proper error notification?

Rate error handling: GOOD / ADEQUATE / POOR

### 4. Dependency Mapping

For each Logic App, identify:
- **Service Bus**: Queues/topics consumed or published
- **APIs**: External endpoints called
- **Key Vault**: Secrets referenced
- **Storage**: Accounts/containers accessed
- **Other Logic Apps**: Nested workflow calls
- **Databases**: SQL/Cosmos connections

### 5. Complexity Assessment

Calculate:
- Total action count
- Nesting depth (max)
- Number of branches
- Estimated complexity: Simple / Medium / Complex

### Output Requirements

1. Save per-Logic-App analysis:
   `/output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/{logic-app-name}.md`
   
   Template:
   ```markdown
   # Logic App Analysis: {name}
   
   ## Overview
   | Property | Value |
   |----------|-------|
   | Resource Group | {rg} |
   | Type | Consumption/Standard |
   | State | Enabled/Disabled |
   | Region | {region} |
   
   ## Trigger
   - Type: {trigger type}
   - Configuration: {details}
   
   ## Actions Summary
   | Action Count | {n} |
   | Connectors Used | {list} |
   | Complexity | Simple/Medium/Complex |
   
   ## Connectors
   | Connector | Auth Method | Notes |
   |-----------|-------------|-------|
   
   ## Error Handling Assessment
   - Scopes: Yes/No
   - Try-Catch Pattern: Yes/No
   - Retry Policies: {count} actions
   - Overall Rating: GOOD/ADEQUATE/POOR
   
   ## Dependencies
   - Service Bus: {list}
   - APIs: {list}
   - Key Vault: {list}
   - Storage: {list}
   - Other Logic Apps: {list}
   
   ## Recommendations
   1. {recommendation}
   ```

2. Save connector summary:
   `/output/{client-name}/{YYYY-MM-DD}/analysis/connector-inventory.md`
   
   Aggregate all connectors across all Logic Apps.

3. Save pattern analysis:
   `/output/{client-name}/{YYYY-MM-DD}/analysis/pattern-analysis.md`
   
   Document common patterns and anti-patterns observed.

### Key Questions to Answer

- What are the most common trigger types?
- What connectors are most prevalent?
- How consistent is error handling?
- Are there any Logic Apps without error handling?
- What external dependencies exist?
- Are there circular dependencies?
- Is there code reuse (child workflows)?
```

---

## PART B: Service Bus Deep Dive

For each Service Bus namespace from the inventory:

### 1. Namespace Configuration
```bash
az servicebus namespace show --resource-group "{rg}" --name "{namespace}" -o json
```
Document: SKU/tier, capacity units, zone redundancy, geo-replication, TLS version.

### 2. Queue Analysis
```bash
az servicebus queue list --resource-group "{rg}" --namespace-name "{namespace}" -o json
```
For each queue, document:
- Max size, message TTL, lock duration
- Dead-letter queue enabled? Max delivery count
- Auto-forwarding configured? Target queue/topic
- Sessions enabled? Partitioning enabled?
- Duplicate detection window

### 3. Topic & Subscription Analysis
```bash
az servicebus topic list --resource-group "{rg}" --namespace-name "{namespace}" -o json
az servicebus topic subscription list --resource-group "{rg}" --namespace-name "{namespace}" --topic-name "{topic}" -o json
```
For each topic/subscription:
- Subscription count per topic
- Filter rules (SQL/correlation filters)
- Forwarding rules, DLQ forwarding
- Max delivery count, message TTL

### 4. Service Bus Health Check
```bash
az servicebus queue show --resource-group "{rg}" --namespace-name "{namespace}" --name "{queue}" -o json
```
Check `countDetails` for each queue: active messages, DLQ count, scheduled messages, transfer DLQ.

### Output: `/output/{client-name}/{YYYY-MM-DD}/analysis/service-bus-analysis.md`

Template:
```markdown
# Service Bus Analysis

## Namespace: {name}
| Property | Value |
|----------|-------|
| SKU | {Basic/Standard/Premium} |
| Region | {region} |
| Queues | {count} |
| Topics | {count} |

## Queues
| Queue | Max Size | TTL | DLQ Count | Sessions | Partitioned | Forwarding |
|-------|----------|-----|-----------|----------|-------------|------------|

## Topics
| Topic | Subscriptions | Filters | DLQ Forwarding |
|-------|---------------|---------|----------------|

## Findings
1. {finding with evidence}

## Recommendations
1. {recommendation}
```

---

## PART C: Function Apps Deep Dive

For each Function App from the inventory:

### 1. App Configuration
```bash
az functionapp show --resource-group "{rg}" --name "{app}" -o json
```
Document: Runtime stack/version, hosting plan (Consumption/Premium/Dedicated), OS, state, HTTPS only.

### 2. App Settings (Scan for Secrets)
```bash
az functionapp config appsettings list --resource-group "{rg}" --name "{app}" -o json
```
Scan for:
- Hardcoded connection strings (not Key Vault references)
- Settings that look like secrets (contain "key", "secret", "password", "connectionstring")
- Key Vault references (should use `@Microsoft.KeyVault(...)` format)

### 3. Functions Inventory
```bash
az functionapp function list --resource-group "{rg}" --name "{app}" -o json
```
For each function: trigger type (HTTP, Timer, Queue, Blob, Event Grid, etc.), bindings.

### 4. Scaling & Performance
Document: Min/max instance count, always-on setting, plan type appropriateness for workload.

### Output: `/output/{client-name}/{YYYY-MM-DD}/analysis/function-apps-analysis.md`

Template:
```markdown
# Function Apps Analysis

## App: {name}
| Property | Value |
|----------|-------|
| Runtime | {dotnet/node/python/java} |
| Version | {version} |
| Plan | {Consumption/Premium/Dedicated} |
| State | {Running/Stopped} |
| Functions | {count} |

## Functions
| Function | Trigger | Bindings | Notes |
|----------|---------|----------|-------|

## App Settings Security
| Risk | Setting | Issue |
|------|---------|-------|
| HIGH | {setting} | Hardcoded secret (not Key Vault ref) |

## Recommendations
1. {recommendation}
```

---

## PART D: API Management Deep Dive

For each APIM instance from the inventory:

### 1. Instance Configuration
```bash
az apim show --resource-group "{rg}" --name "{apim}" -o json
```
Document: SKU, capacity, VNet mode, developer portal status, custom domains.

### 2. API Inventory
```bash
az apim api list --resource-group "{rg}" --service-name "{apim}" -o json
```
For each API: name, path, protocols, backend URL, authentication method.

### 3. Product & Subscription Model
```bash
az rest --method GET --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{apim}/products?api-version=2022-08-01"
```
Document: Products, subscription requirements, approval required, rate limits.

### 4. Policies Analysis
```bash
az rest --method GET --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ApiManagement/service/{apim}/policies?api-version=2022-08-01"
```
Check for: rate-limiting, IP filtering, JWT validation, CORS, transformation policies, caching.

### 5. Backend Configuration
Document: Backend URLs, circuit breaker settings, load balancing.

### Output: `/output/{client-name}/{YYYY-MM-DD}/analysis/apim-analysis.md`

Template:
```markdown
# API Management Analysis

## Instance: {name}
| Property | Value |
|----------|-------|
| SKU | {Developer/Basic/Standard/Premium} |
| Region | {region} |
| APIs | {count} |
| Products | {count} |
| Developer Portal | {Enabled/Disabled} |

## APIs
| API | Path | Backend | Auth | Policies |
|-----|------|---------|------|----------|

## Products
| Product | APIs | Subscription Required | Rate Limit |
|---------|------|-----------------------|------------|

## Policy Assessment
| Policy Type | Applied | Notes |
|-------------|---------|-------|
| Rate Limiting | Yes/No | |
| JWT Validation | Yes/No | |
| IP Filtering | Yes/No | |
| CORS | Yes/No | |
| Caching | Yes/No | |

## Recommendations
1. {recommendation}
```

---

## PART E: Supporting Services Deep Dive

### Key Vault Analysis

For each Key Vault:
```bash
az keyvault show --name "{vault}" -o json
az keyvault secret list --vault-name "{vault}" -o json
az keyvault key list --vault-name "{vault}" -o json
az keyvault certificate list --vault-name "{vault}" -o json
```
Document:
- Access model (access policies vs RBAC)
- Soft delete & purge protection enabled?
- Secret/key/certificate count
- Expiring secrets/certificates (within 90 days)
- Network rules (public access, private endpoints, allowed IPs)

### Storage Account Analysis

For each integration-related Storage Account:
```bash
az storage account show --resource-group "{rg}" --name "{account}" -o json
az storage container list --account-name "{account}" --auth-mode login -o json
```
Document:
- Account kind, SKU, access tier
- TLS minimum version, HTTPS-only
- Public blob access enabled?
- Lifecycle management policies
- Integration usage (Logic App state, Function App storage, diagnostics)

### Event Grid Analysis

For each Event Grid topic:
```bash
az eventgrid topic show --resource-group "{rg}" --name "{topic}" -o json
az eventgrid event-subscription list --source-resource-id "{topicResourceId}" -o json
```
Document:
- Topic type (system vs custom), input schema
- Subscriptions: endpoint types, retry policy, dead-letter destination
- Delivery failure counts (via metrics)

### Event Hub Analysis

For each Event Hub namespace:
```bash
az eventhubs namespace show --resource-group "{rg}" --name "{namespace}" -o json
az eventhubs eventhub list --resource-group "{rg}" --namespace-name "{namespace}" -o json
```
Document:
- SKU, throughput units, auto-inflate
- Event Hubs: partition count, message retention, capture settings
- Consumer groups per Event Hub

### App Configuration Analysis

For each App Configuration store:
```bash
az appconfig show --resource-group "{rg}" --name "{store}" -o json
az appconfig kv list --name "{store}" --auth-mode login -o json 2>/dev/null || echo "Access denied — check permissions"
```
Document:
- SKU, encryption, private endpoints
- Key-value count, label usage
- Feature flags (keys starting with `.appconfig.featureflag/`)

### Output: `/output/{client-name}/{YYYY-MM-DD}/analysis/supporting-services-analysis.md`

Template:
```markdown
# Supporting Services Analysis

## Key Vaults
| Vault | Access Model | Secrets | Keys | Certs | Expiring Soon | Soft Delete |
|-------|-------------|---------|------|-------|---------------|-------------|

## Storage Accounts
| Account | SKU | Public Blob | TLS | Lifecycle | Integration Use |
|---------|-----|-------------|-----|-----------|-----------------|

## Event Grid
| Topic | Type | Subscriptions | Dead-Letter | Failures |
|-------|------|---------------|-------------|----------|

## Event Hubs
| Namespace | SKU | Hubs | Partitions | Capture | Retention |
|-----------|-----|------|------------|---------|-----------|

## App Configuration
| Store | SKU | Keys | Feature Flags | Private Endpoint |
|-------|-----|------|---------------|------------------|

## Findings
1. {finding with evidence}

## Recommendations
1. {recommendation}
```

---

## Tool Usage Reference

| Resource | Operation | CLI/REST Command |
|----------|-----------|------------------|
| Logic Apps | Get Consumption Definition | `az logic workflow show -g {rg} -n {name} -o json` |
| Logic Apps | Get Standard Definition | `az rest --method GET --url ".../Microsoft.Web/sites/{app}/workflows/{workflow}..."` |
| Logic Apps | List Connections | `az rest --method GET --url ".../Microsoft.Web/connections..."` |
| Service Bus | Show Namespace | `az servicebus namespace show -g {rg} -n {ns}` |
| Service Bus | List Queues | `az servicebus queue list -g {rg} --namespace-name {ns}` |
| Service Bus | List Topics | `az servicebus topic list -g {rg} --namespace-name {ns}` |
| Service Bus | Show Queue (DLQ count) | `az servicebus queue show -g {rg} --namespace-name {ns} -n {q}` |
| Function Apps | Show App | `az functionapp show -g {rg} -n {app}` |
| Function Apps | List Settings | `az functionapp config appsettings list -g {rg} -n {app}` |
| Function Apps | List Functions | `az functionapp function list -g {rg} -n {app}` |
| APIM | Show Instance | `az apim show -g {rg} -n {apim}` |
| APIM | List APIs | `az apim api list -g {rg} --service-name {apim}` |
| Key Vault | Show Vault | `az keyvault show -n {vault}` |
| Key Vault | List Secrets | `az keyvault secret list --vault-name {vault}` |
| Storage | Show Account | `az storage account show -g {rg} -n {acct}` |
| Event Grid | Show Topic | `az eventgrid topic show -g {rg} -n {topic}` |
| Event Hub | Show Namespace | `az eventhubs namespace show -g {rg} -n {ns}` |
| App Config | Show Store | `az appconfig show -g {rg} -n {store}` |

**MCP-First Rule**: Always try Logic Apps MCP first for workflow operations. Use CLI commands only as fallback if MCP fails.

---

## Analysis Checklist

### Logic Apps (per app):
- [ ] Definition extracted
- [ ] Triggers documented
- [ ] Actions enumerated
- [ ] Connectors identified
- [ ] Auth methods noted
- [ ] Error handling assessed
- [ ] Dependencies mapped
- [ ] Complexity rated

### Service Bus (per namespace):
- [ ] Namespace config documented
- [ ] All queues analyzed (TTL, DLQ, sessions, forwarding)
- [ ] All topics/subscriptions analyzed (filters, DLQ)
- [ ] DLQ message counts checked

### Function Apps (per app):
- [ ] Runtime and plan documented
- [ ] Functions and triggers inventoried
- [ ] App settings scanned for hardcoded secrets
- [ ] Scaling configuration assessed

### API Management (per instance):
- [ ] APIs inventoried
- [ ] Policies analyzed (rate limiting, JWT, CORS)
- [ ] Products and subscriptions documented
- [ ] Backend configuration checked

### Supporting Services:
- [ ] Key Vaults: access model, expiring secrets, network rules
- [ ] Storage: public access, TLS, lifecycle policies
- [ ] Event Grid: subscriptions, retry, dead-letter config
- [ ] Event Hubs: partitions, capture, consumer groups
- [ ] App Configuration: keys, feature flags, access control

---

## Success Criteria

- [ ] All Logic Apps analyzed with per-app markdown files
- [ ] Service Bus analysis complete (queues, topics, DLQ counts)
- [ ] Function Apps analysis complete (functions, settings, secrets scan)
- [ ] APIM analysis complete (APIs, policies, products)
- [ ] Supporting services analyzed (Key Vault, Storage, Event Grid, Event Hub, App Config)
- [ ] Connector inventory aggregated
- [ ] Pattern analysis documented
- [ ] All output files saved
- [ ] Ready for Phase 3
