@description('APIM service name (1–50 chars)')
@minLength(1)
@maxLength(50)
param apimName string

@description('Location')
param location string

@description('Publisher email')
param publisherEmail string

@description('Publisher name')
param publisherName string

@allowed(['Consumption', 'Developer', 'Basic', 'Standard', 'Premium'])
param sku string = 'Developer'

@description('Tags')
param tags object = {}

resource apim 'Microsoft.ApiManagement/service@2022-08-01' = {
  name: apimName
  location: location
  sku: {
    name: sku
    capacity: sku == 'Consumption' ? 0 : 1
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: publisherName
  }
  tags: tags
}

output apimId string = apim.id
output apimName string = apim.name
output gatewayUrl string = apim.properties.gatewayUrl
