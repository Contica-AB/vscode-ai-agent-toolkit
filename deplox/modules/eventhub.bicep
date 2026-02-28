@description('Event Hubs namespace name (6–50 chars, letters/numbers/hyphens)')
@minLength(6)
@maxLength(50)
param namespaceName string

@description('Location')
param location string

@allowed(['Basic', 'Standard', 'Premium'])
param sku string = 'Standard'

@description('Event Hubs to create')
param eventHubs array = []

@description('Message retention in days')
param messageRetentionInDays int = 1

@description('Tags')
param tags object = {}

resource ehNamespace 'Microsoft.EventHub/namespaces@2021-11-01' = {
  name: namespaceName
  location: location
  sku: {
    name: sku
    tier: sku
    capacity: 1
  }
  tags: tags
}

resource ehubs 'Microsoft.EventHub/namespaces/eventhubs@2021-11-01' = [for eh in eventHubs: {
  parent: ehNamespace
  name: eh
  properties: {
    messageRetentionInDays: messageRetentionInDays
    partitionCount: 2
  }
}]

output namespaceId string = ehNamespace.id
output namespaceName string = ehNamespace.name
