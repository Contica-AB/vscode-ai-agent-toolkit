@description('Logic App name (2–80 chars)')
@minLength(2)
@maxLength(80)
param logicAppName string

@description('Location')
param location string

@description('Integration Account resource ID (optional)')
param integrationAccountId string = ''

@description('Tags')
param tags object = {}

resource logicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: logicAppName
  location: location
  tags: tags
  properties: {
    state: 'Enabled'
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      triggers: {}
      actions: {}
    }
    integrationAccount: integrationAccountId != '' ? {
      id: integrationAccountId
    } : null
  }
}

output logicAppId string = logicApp.id
output logicAppName string = logicApp.name
