# SoW Infrastructure Generator - Output Validation Checklist

This checklist helps verify that the generated infrastructure files match the expected structure and format.

## Pre-Validation

- [ ] Implementation agent has completed successfully
- [ ] Four files generated: `parameters-dev.json`, `parameters-test.json`, `parameters-prod.json`, `trigger.yml`
- [ ] All files are valid JSON/YAML (no syntax errors)

## Parameters Files Structure (All Environments)

### Top-Level Structure
- [ ] Contains `$schema` field
- [ ] Contains `contentVersion` field  
- [ ] Contains `parameters` object wrapping all parameters
- [ ] Each parameter has a `value` wrapper

### Required Parameters (All Environments)
- [ ] `commonTags` exists with: `environment`, `scaleUnit`, `integrationNumber`, `integrationClass`
- [ ] `resourceGroupNames` is an array of strings (unique RGs for this environment)
- [ ] `commonResources` exists with networking and shared infrastructure references

### commonResources Fields (All Environments)
- [ ] `apimObjectId` (null is valid)
- [ ] `vnetResourceGroupName`
- [ ] `vnetName`
- [ ] `logicAppOutSubnet`
- [ ] `functionAppOutSubnet`
- [ ] `webAppOutSubnet`
- [ ] `logAnalyticsWorkspaceName`
- [ ] `logAnalyticsWorkspaceResourceGroupName`
- [ ] `storageAccountOutSubnet`
- [ ] `serviceBusSubnet`
- [ ] `keyVaultSubnet`
- [ ] `privateEndpointSubnetName`

### Service Plans in commonResources
- [ ] `logicRuntimeStorageAccountName`
- [ ] `logicRuntimeStorageAccountResourceGroupName`
- [ ] `logicAppServicePlanName`
- [ ] `logicAppServicePlanResourceGroupName`
- [ ] `functionRuntimeStorageAccountName`
- [ ] `functionRuntimeStorageAccountResourceGroupName`
- [ ] `functionAppServicePlanName`
- [ ] `functionAppServicePlanResourceGroupName`
- [ ] `webRuntimeStorageAccountName` (if web apps present)
- [ ] `webRuntimeStorageAccountResourceGroupName` (if web apps present)
- [ ] `webAppServicePlanName` (if web apps present)
- [ ] `webAppServicePlanResourceGroupName` (if web apps present)

### Resource Array Naming
- [ ] Uses `serviceBusArray` (NOT `serviceBus`)
- [ ] Uses `storageAccountArray` (NOT `storageAccounts`)
- [ ] Uses `logicAppArray` (NOT `logicApps`)
- [ ] Uses `functionAppArray` (NOT `functionApps`)
- [ ] Uses `webAppArray` (NOT `webApps`)
- [ ] Uses `keyVaultArray` (NOT `keyVaults`)
- [ ] Uses `dataFactoryArray` (NOT `dataFactories`)

### Resource Filtering by Environment
- [ ] `parameters-dev.json` only contains resources where environment = "dev"
- [ ] `parameters-test.json` only contains resources where environment = "test"
- [ ] `parameters-prod.json` only contains resources where environment = "prod"

### Empty Resource Arrays
- [ ] If an environment has no resources of a type, that array parameter is **omitted entirely**
- [ ] Empty arrays `[]` should **not** appear in the output

### Networking Transformation

#### For Apps (Logic/Function/Web Apps)
- [ ] `Networking = "None"` → `"vnetIntegration": {}`
- [ ] `Networking = "Outbound"` → `vnetIntegration` with `vnetResourceGroupName`, `vnetName`, `subnetName`
- [ ] `Networking = "Secured"` → `vnetIntegration` with outbound **AND** `privateEndpoints` object

#### For Data Resources (Service Bus, Storage, Key Vault)
- [ ] `Private Endpoint = "No"` → `"vnetIntegration": {}`
- [ ] `Private Endpoint = "Yes"` → `vnetIntegration` with `privateEndpoints` configuration

#### Storage Account Private Endpoints
- [ ] Only generates PEs for sub-resource types that have items defined
- [ ] If `blobContainers` is empty → no blob PE
- [ ] If `queues` is empty → no queue PE
- [ ] If `tables` is empty → no table PE
- [ ] If `fileShares` is empty → no file share PE

### Resource Properties

#### Service Bus
- [ ] Has `serviceBusNamespaceName`
- [ ] Has `resourceGroupName`
- [ ] Has `subscriptionId` (from environmentMapping)
- [ ] Has `sku`
- [ ] Has `publicNetworkAccess` (typically "Disabled")
- [ ] Has `disableLocalAuth` (typically true)
- [ ] Has `vnetIntegration`
- [ ] Has `queues` array (can be empty)
- [ ] Has `topics` array (can be empty)
- [ ] Has `tags`

#### Storage Account
- [ ] Has `storageAccountName`
- [ ] Has `resourceGroupName`
- [ ] Has `subscriptionId`
- [ ] Has `sku`
- [ ] Has `isHnsEnabled`
- [ ] Has `deleteBlobLifeCycle`
- [ ] Has `deleteBlobLifeCycleDays`
- [ ] Has `archiveBlobLifeCycle`
- [ ] Has `archiveBlobLifeCycleDays`
- [ ] Has `publicNetworkAccess`
- [ ] Has `vnetIntegration`
- [ ] Has `tables`, `queues`, `blobContainers`, `fileShares` arrays
- [ ] Has `tags`

#### Logic App / Function App
- [ ] Has `appName`
- [ ] Has `resourceGroupName`
- [ ] Has `runtimeStorageAccountName`
- [ ] Has `runtimeStorageAccountResourceGroupName`
- [ ] Has `appServicePlanName`
- [ ] Has `appServicePlanResourceGroupName`
- [ ] Has `runtime` (empty string for Logic Apps)
- [ ] Has `runtimeStorageAccountRbacAuthEnabled`
- [ ] Has `keyVaultName`
- [ ] Has `vnetIntegration`
- [ ] Has `applicationAuthSettings` array
- [ ] Has `diagnosticSettings`
- [ ] Has `applicationInsights` object
- [ ] Has `customAppSettings` array
- [ ] Has `tags`

#### Key Vault
- [ ] Has `keyVaultName`
- [ ] Has `resourceGroupName`
- [ ] Has `subscriptionId`
- [ ] Has `skuName`
- [ ] Has `enabledForTemplateDeployment`
- [ ] Has `enableRbacAuthorization`
- [ ] Has `publicNetworkAccess`
- [ ] Has `networkAclsBypass`
- [ ] Has `networkAclsDefaultAction`
- [ ] Has `enableSoftDelete`
- [ ] Has `softDeleteRetentionInDays`
- [ ] Has `vnetIntegration`
- [ ] Has `secrets` array
- [ ] Has `tags`

### Role Assignments
- [ ] Grouped by resource group
- [ ] Each entry has `name`, `resourceGroupName`
- [ ] Each entry has `principals` array
- [ ] Each principal has `appName` and `assignmentTargets` array
- [ ] Each assignment target has `resourceType`, `resourceName`, `roleDefinitionIds`, `childResources`
- [ ] Has `sharedAssignmentTargets` array for resources accessed by multiple principals

## trigger.yml Structure

### Top-Level
- [ ] Has `trigger` with `batch: true` and branches
- [ ] Triggers on: `develop`, `main`, `release/*`
- [ ] Has `variables` section
- [ ] Has `resources` section with repository references
- [ ] Has `stages` section

### Variables
- [ ] `vmImage` = "windows-2025"
- [ ] `utilsRepoName` = "contica-azure-utils"
- [ ] `repoName` = from SoW pipeline config
- [ ] `location` = from SoW identity.azureRegion (lowercase)
- [ ] Conditional variable group for develop branch

### Repository Resources
- [ ] Has `contica-azure-utils-dev` (ref: dev)
- [ ] Has `contica-azure-utils-main` (ref: main)
- [ ] Both point to `Contica-AB/contica-azure-utils`

### Stage: dev
- [ ] Condition: `eq(variables['Build.SourceBranch'], 'refs/heads/develop')`
- [ ] Environment name from SoW
- [ ] Checks out: self + contica-azure-utils-dev
- [ ] Calls template: `Yaml/integrationInfrastructure.Blueprint.yml@contica-azure-utils-dev`
- [ ] Parameters: subscriptionId (from envMapping for Dev), location, environment="Dev"

### Stage: test
- [ ] Condition: `eq(variables['Build.SourceBranch'], 'refs/heads/main')`
- [ ] Environment name from SoW
- [ ] Checks out: self + contica-azure-utils-main
- [ ] Calls template: `Yaml/integrationInfrastructure.Blueprint.yml@contica-azure-utils-main`
- [ ] Parameters: subscriptionId (from envMapping for Test), location, environment="Test"

### Stage: prod
- [ ] Condition: `contains(variables['Build.SourceBranch'], 'refs/heads/release/')`
- [ ] Environment name from SoW
- [ ] Checks out: self + contica-azure-utils-main
- [ ] Calls template: `Yaml/integrationInfrastructure.Blueprint.yml@contica-azure-utils-main`
- [ ] Parameters: subscriptionId (from envMapping for Prod), location, environment="Prod"

### Branch Condition Verification (CRITICAL)
- [ ] Dev stage triggers on `develop` branch
- [ ] Test stage triggers on `main` branch
- [ ] Prod stage triggers on `release/*` branches
- [ ] **NOT**: dev→develop, test→release/*, prod→main (old incorrect pattern)

## File Comparison

### Compare with Expected Output
- [ ] Open `output/expected output/parameters.json`
- [ ] Compare structure with generated `parameters-dev.json`
- [ ] Verify all top-level parameters present
- [ ] Verify resource array naming matches
- [ ] Verify nested object structures match

### Compare with Expected trigger.yml
- [ ] Open `output/expected output/trigger.yml`
- [ ] Compare stages with generated `trigger.yml`
- [ ] Verify branch conditions match
- [ ] Verify template references match

## Common Issues to Check

- [ ] NO custom project metadata in parameters (should use commonTags)
- [ ] NO `environments` array parameter (deprecated, use per-file approach)
- [ ] NO resource arrays named without "Array" suffix
- [ ] NO empty [] arrays (should omit parameter entirely)
- [ ] NO service plans as separate arrays (should be in commonResources)
- [ ] NO incorrect branch conditions in trigger.yml
- [ ] NO environment tokens like `{env}` in resource names (should be explicit)

## Final Validation

- [ ] All placeholders are clearly marked with `{{DESCRIPTION}}` format
- [ ] All subscription IDs resolved from environmentMapping
- [ ] All VNet details resolved per environment
- [ ] JSON is valid and properly indented (2 spaces)
- [ ] YAML is valid and properly indented (2 spaces)
- [ ] Files saved to correct locations: `output/parameters-{env}.json`, `output/trigger.yml`

---

## Quick Structural Comparison

**Expected:**
```json
{
  "parameters": {
    "commonTags": { "value": {...} },
    "resourceGroupNames": { "value": [...] },
    "commonResources": { "value": {...} },
    "logicAppArray": { "value": [...] }
  }
}
```

**NOT This:**
```json
{
  "parameters": {
    "projectMetadata": { "value": {...} },
    "environments": { "value": [...] },
    "logicApps": { "value": [...] }
  }
}
```
