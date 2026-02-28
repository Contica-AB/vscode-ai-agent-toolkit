@description('Key Vault name (3–24 chars, letters/numbers/hyphens)')
@minLength(3)
@maxLength(24)
param keyVaultName string

@description('Location')
param location string

@description('Object ID of the principal to grant access')
param adminObjectId string = ''

@allowed(['standard', 'premium'])
param sku string = 'standard'

@description('Tags')
param tags object = {}

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: sku
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
  }
}

output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
