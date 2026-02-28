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

@description('Rate limit: max API calls per minute per client IP')
param rateLimitCallsPerMinute int = 60

@description('CORS allowed origins — use * for all, or a specific domain e.g. https://myapp.com')
param corsAllowedOrigins string = '*'

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

// Global policy: rate limiting by client IP + CORS
resource globalPolicy 'Microsoft.ApiManagement/service/policies@2022-08-01' = {
  parent: apim
  name: 'policy'
  properties: {
    format: 'xml'
    value: '<policies><inbound><rate-limit-by-key calls="${rateLimitCallsPerMinute}" renewal-period="60" counter-key="@(context.Request.IpAddress)" /><cors allow-credentials="false"><allowed-origins><origin>${corsAllowedOrigins}</origin></allowed-origins><allowed-methods><method>GET</method><method>POST</method><method>PUT</method><method>DELETE</method><method>OPTIONS</method></allowed-methods><allowed-headers><header>*</header></allowed-headers></cors><base /></inbound><backend><base /></backend><outbound><base /></outbound><on-error><base /></on-error></policies>'
  }
}

// Sample Echo API — replace serviceUrl with your own backend
resource echoApi 'Microsoft.ApiManagement/service/apis@2022-08-01' = {
  parent: apim
  name: 'echo-api'
  properties: {
    displayName: 'Echo API'
    description: 'Sample API for testing — replace serviceUrl with your own backend'
    serviceUrl: 'https://httpbin.org/anything'
    path: 'echo'
    protocols: ['https']
    subscriptionRequired: false
  }
}

output apimId string = apim.id
output apimName string = apim.name
output gatewayUrl string = apim.properties.gatewayUrl
output echoApiUrl string = '${apim.properties.gatewayUrl}/echo'
