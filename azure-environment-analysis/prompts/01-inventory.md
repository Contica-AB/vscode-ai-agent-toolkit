# Phase 1: Resource Discovery

## Objective

Enumerate all integration-related Azure resources and produce a complete inventory.

---

## Output Location

Read the client name from the active client config.
All outputs for this phase go to: `/output/{client-name}/{YYYY-MM-DD}/inventory/`
The folder should already exist from Phase 0.

---

## Tool Selection Strategy

> **IMPORTANT**: Use the right tool for each resource type.

| Resource Type          | Primary (MCP)  | Fallback (CLI)                                            |
| ---------------------- | -------------- | --------------------------------------------------------- |
| Logic Apps Consumption | Logic Apps MCP | `az logic workflow list`                                  |
| Logic Apps Standard    | Logic Apps MCP | `az webapp list --query "[?kind contains 'workflowapp']"` |
| Function Apps          | Azure MCP      | `az functionapp list`                                     |
| Service Bus            | Azure MCP      | `az servicebus namespace list`                            |
| Key Vault              | Azure MCP      | `az keyvault list`                                        |
| Storage                | Azure MCP      | `az storage account list`                                 |
| APIM                   | Azure MCP      | `az apim list`                                            |
| Event Grid             | Azure MCP      | `az eventgrid topic list`                                 |
| Event Hubs             | Azure MCP      | `az eventhubs namespace list`                             |

**MCP-First Rule**: Always try MCP tools first. If Logic Apps MCP fails (tested in Phase 0), use CLI fallback. Document any MCP failures.

---

## Prerequisites

Before running this prompt:

1. **Phase 0 must pass** - tools and credentials validated
2. Confirm the client folder: `/clients/{client}/`
3. Read and understand `/clients/{client}/config.json`
4. Note any resource group inclusions/exclusions
5. Note the `securityOption` setting (Standard/Advanced) for tier validation

---

## Prompt

````
I need to perform Phase 1: Discovery for the Azure Integration Services assessment.

First, read the client configuration:
- Read /clients/{client}/config.json to get the assessment scope
- Note the subscriptions, resource group filters, and any exclusions

Then, enumerate ALL integration-related resources in scope:

### Resources to Discover

1. **Logic Apps** (both Consumption and Standard)
   - Use Logic Apps MCP to list all Logic Apps (fallback: `az logic workflow list` / `az webapp list`)
   - Capture: name, resource group, type (Consumption/Standard), state, SKU, region, tags

2. **Service Bus**
   - Use Azure MCP to list Service Bus namespaces (fallback: `az servicebus namespace list`)
   - For each namespace, get: queues, topics, subscriptions
   - Capture: SKU, region, tags

3. **API Management**
   - Use Azure MCP to list APIM instances (fallback: `az apim list`)
   - Capture: SKU, region, tags, gateway URL

4. **Function Apps**
   - Use Azure MCP to list Function Apps (fallback: `az functionapp list`)
   - Focus on those related to integration
   - Capture: runtime, SKU, region, tags

5. **Key Vaults**
   - Use Azure MCP to list Key Vaults (fallback: `az keyvault list`)
   - Capture: SKU, region, tags, access policies count

6. **Storage Accounts**
   - Use Azure MCP to list Storage Accounts (fallback: `az storage account list`)
   - Focus on those used by integration resources
   - Capture: SKU, region, tags, blob/queue/table enabled

7. **App Configuration**
   - Use Azure MCP to list App Configuration stores (fallback: `az appconfig list`)
   - Capture: SKU, region, tags

8. **Event Grid**
   - Use Azure MCP to list Event Grid topics (fallback: `az eventgrid topic list`)
   - Capture: type, region, tags

9. **Event Hubs**
   - Use Azure MCP to list Event Hub namespaces (fallback: `az eventhubs namespace list`)
   - Capture: SKU, region, tags

10. **Networking (integration-related)**
    - Use Azure MCP to discover VNets and Private Endpoints (fallback: `az network`)
    - Capture: associated resources

### Output Requirements

1. Save the complete inventory as JSON:
   `/output/{client-name}/{YYYY-MM-DD}/inventory/resources.json`

   Structure:
   ```json
   {
     "metadata": {
       "client": "{client}",
       "date": "{date}",
       "subscriptions": [...],
       "resourceGroupsIncluded": [...],
       "resourceGroupsExcluded": [...]
     },
     "resources": {
       "logicApps": [...],
       "serviceBus": [...],
       "apiManagement": [...],
       "functionApps": [...],
       "keyVaults": [...],
       "storageAccounts": [...],
       "appConfiguration": [...],
       "eventGrid": [...],
       "eventHubs": [...],
       "networking": [...]
     },
     "summary": {
       "totalResources": n,
       "byType": {...},
       "byRegion": {...},
       "byResourceGroup": {...}
     }
   }
````

2. Save a markdown summary:
   `/output/{client-name}/{YYYY-MM-DD}/inventory/summary.md`

   Include:
   - Total resource count table
   - Distribution by region
   - Distribution by resource group
   - Tag coverage statistics
   - Any discovery issues encountered

### Verification

After completing the inventory:

- Confirm total count matches expectations
- Flag any resources that couldn't be accessed
- Note any unusual findings

````

---

## Tool Usage Reference

| Resource Type | Primary (MCP) | Fallback (CLI) |
|--------------|---------------|----------------|
| Logic Apps Consumption | Logic Apps MCP | `az logic workflow list -o json` |
| Logic Apps Standard | Logic Apps MCP | `az webapp list -o json --query "[?kind contains 'workflowapp']"` |
| Function Apps | Azure MCP | `az functionapp list -o json` |
| Service Bus | Azure MCP | `az servicebus namespace list -o json` |
| Key Vault | Azure MCP | `az keyvault list -o json` |
| Storage | Azure MCP | `az storage account list -o json` |
| APIM | Azure MCP | `az apim list -o json` |
| Event Grid | Azure MCP | `az eventgrid topic list -o json` |
| Event Hubs | Azure MCP | `az eventhubs namespace list -o json` |
| App Config | Azure MCP | `az appconfig list -o json` |

**MCP-First Rule**: Always try MCP first. Use CLI commands only as fallback if MCP fails.

---

## Sample KQL Query

If MCP tools are insufficient, run this Resource Graph query:

```kql
// See /scripts/resource-graph-queries/all-integration-resources.kql
resources
| where type in~ (
    'microsoft.logic/workflows',
    'microsoft.web/sites',
    'microsoft.servicebus/namespaces',
    'microsoft.apimanagement/service',
    'microsoft.keyvault/vaults',
    'microsoft.storage/storageaccounts',
    'microsoft.appconfiguration/configurationstores',
    'microsoft.eventgrid/topics',
    'microsoft.eventhub/namespaces'
)
| project name, type, resourceGroup, location, sku, tags, properties
````

---

## Success Criteria

- [ ] All resource types enumerated
- [ ] JSON inventory file saved
- [ ] Markdown summary created
- [ ] No access errors (or errors documented)
- [ ] Tag coverage calculated
- [ ] Ready for Phase 2
