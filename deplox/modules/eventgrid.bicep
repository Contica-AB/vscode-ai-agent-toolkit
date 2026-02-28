@description('Event Grid topic name (3–50 chars)')
@minLength(3)
@maxLength(50)
param topicName string

@description('Location')
param location string

@description('Tags')
param tags object = {}

resource eventGridTopic 'Microsoft.EventGrid/topics@2022-06-15' = {
  name: topicName
  location: location
  tags: tags
  properties: {
    inputSchema: 'EventGridSchema'
    publicNetworkAccess: 'Enabled'
  }
}

output topicId string = eventGridTopic.id
output topicName string = eventGridTopic.name
output topicEndpoint string = eventGridTopic.properties.endpoint
