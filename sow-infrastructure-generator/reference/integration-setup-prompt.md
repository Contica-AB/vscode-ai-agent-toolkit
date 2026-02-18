# Integration Infrastructure Setup Prompt

## USER INPUTS (Change these values for each project)

```yaml
# Required: Link to the Statement of Work in Confluence
CONFLUENCE_SOW_URL: "https://contica.atlassian.net/wiki/spaces/TSSOTAI/pages/1091207169/Statement+of+Work+-+MCP+Template"

# Required: GitHub repository containing deployment templates and Bicep files
GITHUB_TEMPLATES_REPO: "https://github.com/Contica-AB/contica-azure-utils/tree/dev"
```

---

## INSTRUCTIONS

You are a senior DevOps engineer specializing in Azure infrastructure deployment. Your task is to generate deployment configuration files based on the Statement of Work (SoW) provided in Confluence and the deployment templates available in the GitHub repository.

### PRIMARY OBJECTIVES

1. **Read and analyze** the Statement of Work from the provided Confluence URL
2. **Read and understand** the deployment templates and Bicep files from the GitHub repository
3. **Generate** per-environment parameter files (`parameters-dev.json`, `parameters-test.json`, `parameters-prod.json`) that match the structure used by the deployment templates
4. **Generate** a `trigger.yml` Azure DevOps pipeline file
5. **Output** all files to a `Deployment/` subfolder in the target workspace
6. **Never assume or hallucinate** - only include values explicitly stated in the SoW

---

## SOW SECTION MAPPING

The Statement of Work follows this structure. Extract values from each section:

### Section 9.1: Environment & Identity
| SoW Field | Maps To |
|-----------|---------|
| Azure Region | `commonTags.environment`, pipeline `location` |
| Integration Number | `commonTags.integrationNumber` |
| Integration Name | Resource naming prefix |
| Scale Unit | `commonTags.scaleUnit` |
| Integration Class | `commonTags.integrationClass` |
| Resource Group (Dev/Test/Prod) | Default RG if not specified per-resource |

### Section 9.2: Networking Requirements
| SoW Field | Maps To |
|-----------|---------|
| VNet Resource Group | `commonResources.vnetResourceGroupName` |
| VNet Name | `commonResources.vnetName` |
| Outbound Subnet | Used for app VNet integration |
| Private Endpoint Subnet | Used for PE configurations |
| Public Network Access | Default for resources if not specified |

### Section 9.3: Shared Infrastructure References
| SoW Field | Maps To |
|-----------|---------|
| Log Analytics Workspace | `commonResources.logAnalyticsWorkspaceName` |
| Logic App Service Plan | `commonResources.logicAppServicePlanName` |
| Logic App Runtime Storage Account | `commonResources.logicRuntimeStorageAccountName` |
| Function App Service Plan | `functionAppArray[].appServicePlanName` |
| Function App Runtime Storage Account | `functionAppArray[].runtimeStorageAccountName` |
| Web App Service Plan | `webAppArray[].appServicePlanName` |

### Section 9.7: Environment Mapping
Use this section to resolve per-environment values:
| Environment | Subscription ID | VNet RG | VNet Name |
|-------------|-----------------|---------|-----------|

---

## CRITICAL RULES

### Rule 1: No Assumptions
- If a value is NOT explicitly stated in the Statement of Work, mark it with a placeholder: `"{{PLACEHOLDER_DESCRIPTION}}"`
- Do NOT infer, guess, or assume any values
- Do NOT use example values from templates as actual values

### Rule 2: Placeholder Format
For any missing or unspecified value, use this exact format:
```json
"fieldName": "{{FIELD_PURPOSE_DESCRIPTION}}"
```

### Rule 3: Multi-Value Field Parsing
The SoW uses **semicolons (;)** to separate multiple values:
- `[queue1; queue2]` → `["queue1", "queue2"]`
- `[container1; container2]` → `[{"containerName": "container1"}, {"containerName": "container2"}]`

### Rule 4: Networking Generation Rules

#### For Apps (Logic Apps, Function Apps, Web Apps)
The SoW uses a **"Networking"** column with values: `None`, `Outbound`, `Secured`

```
If Networking = "None":
  → "vnetIntegration": {}

If Networking = "Outbound":
  → "vnetIntegration": {
      "vnetResourceGroupName": [from 9.7 by environment],
      "vnetName": [from 9.7 by environment],
      "subnetName": [Outbound Subnet from 9.2]
    }

If Networking = "Secured":
  → "vnetIntegration": {
      "vnetResourceGroupName": [from 9.7 by environment],
      "vnetName": [from 9.7 by environment],
      "subnetName": [Outbound Subnet from 9.2],
      "privateEndpoints": {
        "privateEndpointName": "pep-[app-name]",
        "vnetResourceGroupName": [from 9.7 by environment],
        "vnetName": [from 9.7 by environment],
        "subnetName": [PE Subnet from 9.2]
      }
    }
```

#### For Data Resources (Service Bus, Storage, Key Vault, Data Factory)
The SoW uses a **"Private Endpoint"** column with values: `Yes`, `No`

```
If Private Endpoint = "No":
  → "vnetIntegration": {}

If Private Endpoint = "Yes":
  → Generate full vnetIntegration with privateEndpoints
  → For Storage Accounts: Create PEs for sub-resources that have items defined
  → For Data Factory: Create both dataFactory and portal PEs
```

### Rule 5: Per-Resource Resource Group
Each resource row in section 9.4 has its own **"Resource Group"** column. Use that value directly instead of inferring from 9.1.

### Rule 6: Environment-Specific Subscription ID
Look up the Subscription ID from section **9.7 Environment Mapping** based on the resource's Environment column.

---

## OUTPUT FORMAT

**CRITICAL:** Generate THREE parameter files, one for each environment (Dev, Test, Prod). Each file contains ONLY resources for that specific environment.

### Output Files

All files are written to `Deployment/` subfolder:
- `Deployment/parameters-dev.json` - Dev environment resources only
- `Deployment/parameters-test.json` - Test environment resources only  
- `Deployment/parameters-prod.json` - Prod environment resources only
- `Deployment/trigger.yml` - Azure DevOps pipeline

### File Structure: parameters-{env}.json

Generate a complete parameters file for each environment. Include ONLY resource arrays that have entries for that specific environment in the SoW.

**Environment Filtering:** When generating `parameters-dev.json`, only include resources where the Environment column = "Dev". Same rule applies for Test and Prod.

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "commonTags": {
      "value": {
        "environment": "[Azure Region from 9.1]",
        "scaleUnit": "[Scale Unit from 9.1]",
        "integrationNumber": "[Integration Number from 9.1]",
        "integrationClass": "[Integration Class from 9.1]"
      }
    },
    "resourceGroupNames": [
      "[Resource Group Dev from 9.1]",
      "[Resource Group Test from 9.1]",
      "[Resource Group Prod from 9.1]"
    ],
    "commonResources": {
      "value": {
        "apimObjectId": null,
        "vnetResourceGroupName": "[VNet Resource Group from 9.2]",
        "vnetName": "[VNet Name from 9.2]",
        "logicAppOutSubnet": "[Outbound Subnet from 9.2]",
        "functionAppOutSubnet": "[Outbound Subnet from 9.2]",
        "logAnalyticsWorkspaceName": "[Log Analytics Workspace from 9.3]",
        "logAnalyticsWorkspaceResourceGroupName": "[Log Analytics RG from 9.3]",
        "storageAccountOutSubnet": "[PE Subnet from 9.2]",
        "serviceBusSubnet": "[PE Subnet from 9.2]",
        "webAppOutSubnet": "[Outbound Subnet from 9.2]",
        "keyVaultSubnet": "[PE Subnet from 9.2]",
        "logicRuntimeStorageAccountName": "[Logic App Runtime Storage from 9.3]",
        "logicRuntimeStorageAccountResourceGroupName": "[Logic App Runtime Storage RG from 9.3]",
        "logicAppServicePlanName": "[Logic App Service Plan from 9.3]",
        "logicAppServicePlanResourceGroupName": "[Logic App Service Plan RG from 9.3]"
      }
    }
  }
}
```

#### Resource Array Templates

**Service Bus Array** (from SoW section 9.4):
```json
"serviceBusArray": {
  "value": [
    {
      "serviceBusNamespaceName": "[Namespace Name]",
      "resourceGroupName": "[Resource Group column]",
      "subscriptionId": "[from 9.7 by Environment]",
      "sku": "[SKU column]",
      "publicNetworkAccess": "Disabled",
      "disableLocalAuth": true,
      "vnetIntegration": "[Generate based on Private Endpoint column]",
      "queues": [
        { "queueName": "[parsed from Queues column]" }
      ],
      "topics": [
        { "topicName": "[parsed from Topics column]" }
      ],
      "tags": {}
    }
  ]
}
```

**Storage Account Array** (from SoW section 9.4):
```json
"storageAccountArray": {
  "value": [
    {
      "storageAccountName": "[Storage Account Name]",
      "resourceGroupName": "[Resource Group column]",
      "subscriptionId": "[from 9.7 by Environment]",
      "sku": "[SKU column]",
      "isHnsEnabled": false,
      "deleteBlobLifeCycle": true,
      "deleteBlobLifeCycleDays": 90,
      "archiveBlobLifeCycle": false,
      "archiveBlobLifeCycleDays": 90,
      "publicNetworkAccess": "Disabled",
      "vnetIntegration": "[Generate based on Private Endpoint column]",
      "tables": [
        { "tableName": "[parsed from Tables column]" }
      ],
      "queues": [
        { "queueName": "[parsed from Queues column]" }
      ],
      "blobContainers": [
        { "containerName": "[parsed from Blob Containers column]" }
      ],
      "fileShares": [
        { "fileshareName": "[parsed from File Shares column]" }
      ],
      "tags": {}
    }
  ]
}
```

**Logic App Array** (from SoW section 9.4):
```json
"logicAppArray": {
  "value": [
    {
      "appName": "[App Name]",
      "resourceGroupName": "[Resource Group column]",
      "runtimeStorageAccountName": "[Logic App Runtime Storage from 9.3]",
      "runtimeStorageAccountResourceGroupName": "[Logic App Runtime Storage RG from 9.3]",
      "appServicePlanName": "[Logic App Service Plan from 9.3]",
      "appServicePlanResourceGroupName": "[Logic App Service Plan RG from 9.3]",
      "runtime": "",
      "runtimeStorageAccountRbacAuthEnabled": true,
      "keyVaultName": "[Key Vault Reference column]",
      "vnetIntegration": "[Generate based on Networking column: None/Outbound/Secured]",
      "applicationAuthSettings": [],
      "diagnosticSettings": {},
      "applicationInsights": {
        "applicationInsightsName": "[app-name]-appins",
        "logAnalyticsWorkspaceName": "[Log Analytics Workspace from 9.3]",
        "logAnalyticsWorkspaceResourceGroupName": "[Log Analytics RG from 9.3]"
      },
      "customAppSettings": "[parsed from Custom App Settings column]",
      "tags": {}
    }
  ]
}
```

**Function App Array** (from SoW section 9.4):
```json
"functionAppArray": {
  "value": [
    {
      "appName": "[App Name]",
      "resourceGroupName": "[Resource Group column]",
      "runtimeStorageAccountName": "[Function App Runtime Storage from 9.3]",
      "runtimeStorageAccountResourceGroupName": "[Function App Runtime Storage RG from 9.3]",
      "appServicePlanName": "[Function App Service Plan from 9.3]",
      "appServicePlanResourceGroupName": "[Function App Service Plan RG from 9.3]",
      "runtime": "[Runtime column]",
      "runtimeStorageAccountRbacAuthEnabled": true,
      "keyVaultName": "[Key Vault Reference column]",
      "vnetIntegration": "[Generate based on Networking column: None/Outbound/Secured]",
      "applicationAuthSettings": [],
      "diagnosticSettings": {},
      "applicationInsights": {
        "applicationInsightsName": "[app-name]-appins",
        "logAnalyticsWorkspaceName": "[Log Analytics Workspace from 9.3]",
        "logAnalyticsWorkspaceResourceGroupName": "[Log Analytics RG from 9.3]"
      },
      "customAppSettings": [],
      "tags": {}
    }
  ]
}
```

**Web App Array** (from SoW section 9.4):
```json
"webAppArray": {
  "value": [
    {
      "appName": "[App Name]",
      "resourceGroupName": "[Resource Group column]",
      "appServicePlanName": "[Web App Service Plan from 9.3]",
      "appServicePlanResourceGroupName": "[Web App Service Plan RG from 9.3]",
      "runtime": "[Runtime column]",
      "vnetIntegration": "[Generate based on Networking column: None/Outbound/Secured]",
      "applicationAuthSettings": [],
      "diagnosticSettings": {},
      "applicationInsights": {
        "applicationInsightsName": "[app-name]-appins",
        "logAnalyticsWorkspaceName": "[Log Analytics Workspace from 9.3]",
        "logAnalyticsWorkspaceResourceGroupName": "[Log Analytics RG from 9.3]"
      },
      "customAppSettings": [],
      "tags": {}
    }
  ]
}
```

**Key Vault Array** (from SoW section 9.4):
```json
"keyVaultArray": {
  "value": [
    {
      "keyVaultName": "[Key Vault Name]",
      "resourceGroupName": "[Resource Group column]",
      "subscriptionId": "[from 9.7 by Environment]",
      "skuName": "standard",
      "enabledForTemplateDeployment": true,
      "enableRbacAuthorization": "[RBAC Enabled column: Yes=true, No=false]",
      "publicNetworkAccess": "Disabled",
      "networkAclsBypass": "AzureServices",
      "networkAclsDefaultAction": "Deny",
      "networkAclsIpRules": [],
      "networkAclsVirtualNetworkRules": [],
      "enableSoftDelete": true,
      "softDeleteRetentionInDays": 14,
      "vnetIntegration": "[Generate based on Private Endpoint column]",
      "secrets": [
        {
          "secretName": "[parsed from Secrets column]",
          "secretValue": "{{SECRET_VALUE_FOR_[secret-name]}}"
        }
      ],
      "tags": {}
    }
  ]
}
```

**Data Factory Array** (from SoW section 9.4):
```json
"dataFactoryArray": {
  "value": [
    {
      "dataFactoryName": "[Data Factory Name]",
      "resourceGroupName": "[Resource Group column]",
      "managedIdentity": true,
      "globalParameters": {},
      "tags": {},
      "network": {
        "publicNetworkAccess": false,
        "privateEndpoints": "[If Private Endpoint=Yes, generate dataFactory and portal PEs]"
      },
      "integrationRuntimes": "[parsed from Integration Runtimes column]",
      "linkedServices": {
        "azureKeyVault": "[parsed from Linked Services if contains KeyVault]",
        "sqlServer": "[parsed from Linked Services if contains SQL Server]",
        "azureSqlDatabase": "[parsed from Linked Services if contains Azure SQL]"
      }
    }
  ]
}
```

**Role Assignments** (from SoW section 9.5):
```json
"roleAssignments": {
  "value": [
    {
      "name": "[auto-generated from principal names]",
      "resourceGroupName": "[target resource's RG]",
      "principals": [
        {
          "appName": "[Principal App Name]",
          "assignmentTargets": [
            {
              "resourceType": "[infer from Target Resource type]",
              "resourceName": "[Target Resource]",
              "roleDefinitionIds": ["[Role GUID for Role column]"],
              "childResources": []
            }
          ]
        }
      ],
      "sharedAssignmentTargets": []
    }
  ]
}
```

---

### File 2: trigger.yml

Generate an Azure DevOps pipeline with stages for each environment in section 9.7:

```yaml
trigger:
  batch: true
  branches:
    include:
      - develop
      - main
      - release/*

variables:
  - name: vmImage
    value: "windows-2025"
  - name: utilsRepoName
    value: "contica-azure-utils"
  - name: repoName
    value: "[Repository Name from 9.6]"
  - name: location
    value: "[Azure Region from 9.1]"

  - ${{ if eq(variables['Build.SourceBranch'], 'refs/heads/develop') }}:
    - group: [Azure DevOps Variable Group from 9.6]

resources:
  repositories:
    - repository: contica-azure-utils-dev
      type: github
      ref: dev
      name: Contica-AB/contica-azure-utils
      endpoint: contica-azure-utils
    - repository: contica-azure-utils-main
      type: github
      ref: main
      name: Contica-AB/contica-azure-utils
      endpoint: contica-azure-utils

stages:
- stage: dev
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/develop')
  jobs:
    - deployment: "deploy_to_dev"
      environment: "[Pipeline Environment Dev from 9.6]"
      displayName: "Deploy to dev"
      pool:
        vmImage: "$(vmImage)"
      strategy:
        runOnce:
          deploy:
            steps:
              - checkout: self
              - checkout: contica-azure-utils-dev

              - template: Yaml/integrationInfrastructure.Blueprint.yml@contica-azure-utils-dev
                parameters:
                  subscriptionId: "[Subscription ID for Dev from 9.7]"
                  location: "[Azure Region from 9.1]"
                  environment: "Dev"

- stage: test
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
  jobs:
    - deployment: "deploy_to_test"
      environment: "[Pipeline Environment Test from 9.6]"
      displayName: "Deploy to test"
      pool:
        vmImage: "$(vmImage)"
      strategy:
        runOnce:
          deploy:
            steps:
              - checkout: self
              - checkout: contica-azure-utils-main

              - template: Yaml/integrationInfrastructure.Blueprint.yml@contica-azure-utils-main
                parameters:
                  subscriptionId: "[Subscription ID for Test from 9.7]"
                  location: "[Azure Region from 9.1]"
                  environment: "Test"

- stage: prod
  condition: startsWith(variables['Build.SourceBranch'], 'refs/heads/release/')
  jobs:
    - deployment: "deploy_to_prod"
      environment: "[Pipeline Environment Prod from 9.6]"
      displayName: "Deploy to prod"
      pool:
        vmImage: "$(vmImage)"
      strategy:
        runOnce:
          deploy:
            steps:
              - checkout: self
              - checkout: contica-azure-utils-main

              - template: Yaml/integrationInfrastructure.Blueprint.yml@contica-azure-utils-main
                parameters:
                  subscriptionId: "[Subscription ID for Prod from 9.7]"
                  location: "[Azure Region from 9.1]"
                  environment: "Prod"
```

---

## EXECUTION STEPS

1. **Read SoW Sections 9.1-9.7**: Extract all infrastructure values from the Confluence page
2. **Parse Multi-Value Fields**: Split semicolon-separated values into arrays
3. **Resolve Environment Mapping**: Use section 9.7 to get subscription/VNet per environment
4. **Generate VNet Integration**: Apply networking rules (None/Outbound/Secured for apps, Yes/No for data)
5. **Create Resource Arrays**: Only include arrays for resources defined in section 9.4
6. **Generate Role Assignments**: Map section 9.5 to roleAssignments structure
7. **Output Files**: Produce `Deployment/parameters-dev.json`, `Deployment/parameters-test.json`, `Deployment/parameters-prod.json`, and `Deployment/trigger.yml`

---

## VALIDATION CHECKLIST

Before providing output, verify:
- [ ] All JSON is syntactically valid
- [ ] All YAML is properly indented and valid
- [ ] THREE parameter files generated (one per environment: dev, test, prod)
- [ ] Each parameter file only contains resources for that specific environment
- [ ] All files are placed in `Deployment/` subfolder
- [ ] No values were assumed or hallucinated
- [ ] All missing values use the `{{PLACEHOLDER}}` format
- [ ] Subscription IDs are correctly mapped from 9.7 per environment
- [ ] Resource Groups are taken from each resource row, not defaulted
- [ ] Networking is generated based on column type (Networking vs Private Endpoint)
- [ ] Multi-value fields are properly split by semicolons
- [ ] Only resources with rows in section 9.4 are included in their respective environment files

---

## REFERENCE LINKS

- **Pipeline Tasks and Bicep Templates**: [Contica Azure Utils](https://github.com/Contica-AB/contica-azure-utils/tree/dev)
- **Statement of Work Template**: [SoW MCP Template](https://contica.atlassian.net/wiki/spaces/TSSOTAI/pages/1091207169/Statement+of+Work+-+MCP+Template)

---

## ROLE DEFINITION ID REFERENCE

Common Azure RBAC role definition IDs:

| Role Name | Role Definition ID |
|-----------|-------------------|
| Key Vault Secrets User | `4633458b-17de-408a-b874-0445c86b69e6` |
| Storage Blob Data Contributor | `ba92f5b4-2d11-453d-a403-e96b0029c9fe` |
| Storage Blob Data Reader | `2a2b9908-6ea1-4ae2-8e65-a410df84e7d1` |
| Storage Queue Data Contributor | `974c5e8b-45b9-4653-ba55-5f855dd0fb88` |
| Storage Table Data Contributor | `0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3` |
| Azure Service Bus Data Sender | `69a216fc-b8fb-44d8-bc22-1f3c2cd27a39` |
| Azure Service Bus Data Receiver | `4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0` |
| Data Factory Contributor | `673868aa-7521-48a0-acc6-0f60742d39f5` |

---

**END OF PROMPT**