@description('Service Bus namespace name (6–50 chars, letters/numbers/hyphens)')
@minLength(6)
@maxLength(50)
param namespaceName string

@description('Location')
param location string

@allowed(['Basic', 'Standard', 'Premium'])
param sku string = 'Standard'

@description('Queues to create')
param queues array = []

@description('Topics to create')
param topics array = []

@description('Tags')
param tags object = {}

resource sbNamespace 'Microsoft.ServiceBus/namespaces@2021-11-01' = {
  name: namespaceName
  location: location
  sku: {
    name: sku
    tier: sku
  }
  tags: tags
}

resource sbQueues 'Microsoft.ServiceBus/namespaces/queues@2021-11-01' = [for q in queues: {
  parent: sbNamespace
  name: q
  properties: {
    enablePartitioning: false
  }
}]

resource sbTopics 'Microsoft.ServiceBus/namespaces/topics@2021-11-01' = [for t in topics: {
  parent: sbNamespace
  name: t
}]

output namespaceId string = sbNamespace.id
output namespaceName string = sbNamespace.name
