@description('Function App name (2–60 chars)')
@minLength(2)
@maxLength(60)
param functionAppName string

@description('Location')
param location string

@allowed(['dotnet', 'dotnet-isolated', 'node', 'python', 'java'])
param runtime string = 'dotnet'

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
  sku: { name: 'Standard_LRS' }
  tags: tags
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${functionAppName}-plan'
  location: location
  sku: { name: 'Y1', tier: 'Dynamic' }
  tags: tags
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        { name: 'AzureWebJobsStorage', value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value}' }
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: runtime }
      ]
    }
  }
}

output functionAppId string = functionApp.id
output functionAppName string = functionApp.name
