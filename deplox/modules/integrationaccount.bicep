@description('Integration Account name (1–80 chars)')
@minLength(1)
@maxLength(80)
param integrationAccountName string

@description('Location')
param location string

@allowed(['Free', 'Basic', 'Standard'])
param sku string = 'Basic'

@description('Tags')
param tags object = {}

resource integrationAccount 'Microsoft.Logic/integrationAccounts@2019-05-01' = {
  name: integrationAccountName
  location: location
  sku: {
    name: sku
  }
  tags: tags
  properties: {}
}

output integrationAccountId string = integrationAccount.id
output integrationAccountName string = integrationAccount.name
