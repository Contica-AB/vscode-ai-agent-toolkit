@description('Logic App Standard name (2–60 chars)')
@minLength(2)
@maxLength(60)
param logicAppName string

@description('Location')
param location string

@allowed(['WS1', 'WS2', 'WS3'])
param skuName string = 'WS1'

@description('Storage account name (3–24 lowercase letters/numbers)')
@minLength(3)
@maxLength(24)
param storageAccountName string

@description('Tags')
param tags object = {}

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  tags: tags
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${logicAppName}-plan'
  location: location
  sku: {
    name: skuName
    tier: 'WorkflowStandard'
  }
  tags: tags
}

resource logicApp 'Microsoft.Web/sites@2022-09-01' = {
  name: logicAppName
  location: location
  kind: 'workflowapp,functionapp'
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value}' }
        { name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING', value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value}' }
        { name: 'WEBSITE_CONTENTSHARE', value: toLower('${logicAppName}-content') }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'APP_KIND', value: 'workflowApp' }
      ]
    }
  }
}

output logicAppId string = logicApp.id
output logicAppName string = logicApp.name
output storageAccountName string = storageAccount.name
