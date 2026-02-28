#Requires -Version 5.1
<#
.SYNOPSIS
    DeploX v0.01 — Interactive Azure Integration Services Deployer
.DESCRIPTION
    Interactively guides you through deploying any Azure integration service
    using Bicep modules. Powered by Azure CLI (az).
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── Colours ──────────────────────────────────────────────────────────────────
function Write-Header  { Write-Host "`n$args" -ForegroundColor Cyan }
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Err     { Write-Host $args -ForegroundColor Red }
function Write-Info    { Write-Host $args -ForegroundColor Yellow }
function Write-Step    { Write-Host "  → $args" -ForegroundColor White }

# ── Prompt helpers ────────────────────────────────────────────────────────────
function Ask {
    param([string]$Label, [string]$Default = "")
    if ($Default) {
        $val = Read-Host "$Label [$Default]"
        if ($val -eq "") { return $Default } else { return $val }
    }
    do { $val = Read-Host $Label } while ($val -eq "")
    return $val
}

function AskOptional {
    param([string]$Label, [string]$Default = "")
    $val = Read-Host "$Label (leave blank to skip)"
    if ($val -eq "") { return $Default } else { return $val }
}

function Pick {
    param([string]$Label, [string[]]$Options, [int]$DefaultIndex = 0)
    Write-Host "`n$Label" -ForegroundColor Cyan
    for ($i = 0; $i -lt $Options.Count; $i++) {
        $marker = if ($i -eq $DefaultIndex) { "●" } else { "○" }
        Write-Host "  $($i+1). $marker $($Options[$i])"
    }
    do {
        $raw = Read-Host "  Choice (1-$($Options.Count)) [default: $($DefaultIndex+1)]"
        if ($raw -eq "") { return $Options[$DefaultIndex] }
        $n = [int]$raw - 1
    } while ($n -lt 0 -or $n -ge $Options.Count)
    return $Options[$n]
}

# ── Check az CLI ──────────────────────────────────────────────────────────────
function Assert-AzCli {
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        Write-Err "Azure CLI (az) not found. Install from https://aka.ms/installazurecliwindows"
        exit 1
    }
}

# ── Azure login check ─────────────────────────────────────────────────────────
function Assert-Login {
    Write-Step "Checking Azure login..."
    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Info "Not logged in. Launching browser login..."
        az login | Out-Null
        $account = az account show | ConvertFrom-Json
    }
    Write-Success "Logged in as: $($account.user.name)"
    return $account
}

# ── Subscription picker ───────────────────────────────────────────────────────
function Select-Subscription {
    Write-Header "Select Subscription"
    $subs = az account list --output json | ConvertFrom-Json
    $names = $subs | ForEach-Object { "$($_.name)  [$($_.id)]" }
    $chosen = Pick "Available subscriptions:" $names 0
    $idx = $names.IndexOf($chosen)
    $sub = $subs[$idx]
    az account set --subscription $sub.id | Out-Null
    Write-Success "Using subscription: $($sub.name)"
    return $sub
}

# ── Resource group ────────────────────────────────────────────────────────────
function Select-ResourceGroup {
    param([string]$Location)
    Write-Header "Resource Group"
    $existing = @(az group list --output json | ConvertFrom-Json | ForEach-Object { $_.name })
    $mode = Pick "Resource group:" @("Use existing", "Create new") 0

    if ($mode -eq "Create new") {
        $rgName = Ask "New resource group name"
        az group create --name $rgName --location $Location --output none
        Write-Success "Created resource group: $rgName"
        return $rgName
    } else {
        return (Pick "Select resource group:" $existing 0)
    }
}

# ── Tags builder ──────────────────────────────────────────────────────────────
function Build-Tags {
    Write-Info "`nAdd tags? (optional)"
    $tags = @{ Environment = "dev"; CreatedBy = "DeploX" }
    while ($true) {
        $key = AskOptional "Tag key"
        if ($key -eq "") { break }
        $val = Ask "Tag value"
        $tags[$key] = $val
    }
    return $tags
}

# ── Deploy Bicep module ───────────────────────────────────────────────────────
function Deploy-Module {
    param(
        [string]$ResourceGroup,
        [string]$DeploymentName,
        [string]$BicepFile,
        [hashtable]$Params
    )

    # Build ARM-style parameters JSON: { "key": { "value": ... }, ... }
    $armParams = @{}
    foreach ($kv in $Params.GetEnumerator()) {
        $armParams[$kv.Key] = @{ value = $kv.Value }
    }
    $paramsJson = $armParams | ConvertTo-Json -Depth 10 -Compress
    $tmpFile = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.json'
    $paramsJson | Set-Content -Path $tmpFile -Encoding utf8

    Write-Header "Deploying: $DeploymentName"
    Write-Step "Bicep: $BicepFile"
    Write-Step "Params file: $tmpFile"

    $confirm = Read-Host "`nProceed with deployment? (Y/n)"
    if ($confirm -eq "n") {
        Remove-Item $tmpFile -ErrorAction SilentlyContinue
        Write-Info "Deployment skipped."
        return
    }

    Write-Info "Deploying... (this may take a few minutes)"

    try {
        az deployment group create `
            --resource-group $ResourceGroup `
            --name $DeploymentName `
            --template-file $BicepFile `
            --parameters "@$tmpFile" `
            --output table
    } finally {
        Remove-Item $tmpFile -ErrorAction SilentlyContinue
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Success "✔ Deployment complete: $DeploymentName"
    } else {
        Write-Err "✖ Deployment failed. Check output above for details."
    }
}

# ══════════════════════════════════════════════════════════════════════════════
#  SERVICE INSTALLERS
# ══════════════════════════════════════════════════════════════════════════════

function Install-ServiceBus {
    param([string]$RG, [string]$Location, [hashtable]$Tags)
    Write-Header "Service Bus Configuration"
    $name = Ask "Namespace name"
    $sku  = Pick "SKU:" @("Standard", "Premium", "Basic") 0

    $queues = @()
    Write-Info "Add queues? (leave blank to skip)"
    while ($true) {
        $q = AskOptional "Queue name"
        if ($q -eq "") { break }
        $queues += $q
    }

    $topics = @()
    Write-Info "Add topics? (leave blank to skip)"
    while ($true) {
        $t = AskOptional "Topic name"
        if ($t -eq "") { break }
        $topics += $t
    }

    Deploy-Module -ResourceGroup $RG -DeploymentName "sb-$name" `
        -BicepFile "$ScriptDir\modules\servicebus.bicep" `
        -Params @{
            namespaceName = $name
            location      = $Location
            sku           = $sku
            queues        = $queues
            topics        = $topics
            tags          = $Tags
        }
}

function Install-EventHub {
    param([string]$RG, [string]$Location, [hashtable]$Tags)
    Write-Header "Event Hubs Configuration"
    $name = Ask "Namespace name"
    $sku  = Pick "SKU:" @("Standard", "Premium", "Basic") 0

    $hubs = @()
    Write-Info "Add event hubs? (leave blank to skip)"
    while ($true) {
        $h = AskOptional "Event Hub name"
        if ($h -eq "") { break }
        $hubs += $h
    }

    $retention = [int](Ask "Message retention in days" "1")

    Deploy-Module -ResourceGroup $RG -DeploymentName "eh-$name" `
        -BicepFile "$ScriptDir\modules\eventhub.bicep" `
        -Params @{
            namespaceName          = $name
            location               = $Location
            sku                    = $sku
            eventHubs              = $hubs
            messageRetentionInDays = $retention
            tags                   = $Tags
        }
}

function Install-LogicApp {
    param([string]$RG, [string]$Location, [hashtable]$Tags)
    Write-Header "Logic App Configuration"
    $type = Pick "Logic App type:" @("Standard (WS plan)", "Consumption (serverless)") 0

    if ($type -eq "Standard (WS plan)") {
        $name    = Ask "Logic App name"
        $storage = Ask "Storage account name (must be globally unique, 3-24 chars lowercase)"
        $sku     = Pick "SKU:" @("WS1", "WS2", "WS3") 0

        Deploy-Module -ResourceGroup $RG -DeploymentName "la-std-$name" `
            -BicepFile "$ScriptDir\modules\logicapp-standard.bicep" `
            -Params @{
                logicAppName        = $name
                location            = $Location
                skuName             = $sku
                storageAccountName  = $storage
                tags                = $Tags
            }
    } else {
        $name    = Ask "Logic App name"
        $iaId    = AskOptional "Integration Account resource ID (optional)"

        Deploy-Module -ResourceGroup $RG -DeploymentName "la-con-$name" `
            -BicepFile "$ScriptDir\modules\logicapp-consumption.bicep" `
            -Params @{
                logicAppName         = $name
                location             = $Location
                integrationAccountId = $iaId
                tags                 = $Tags
            }
    }
}

function Install-APIM {
    param([string]$RG, [string]$Location, [hashtable]$Tags)
    Write-Header "API Management Configuration"
    Write-Info "⚠  Developer/Standard/Premium SKUs take 20-40 min to deploy."
    $name   = Ask "APIM service name"
    $email  = Ask "Publisher email"
    $pubName = Ask "Publisher name"
    $sku    = Pick "SKU:" @("Consumption", "Developer", "Basic", "Standard", "Premium") 0

    Deploy-Module -ResourceGroup $RG -DeploymentName "apim-$name" `
        -BicepFile "$ScriptDir\modules\apim.bicep" `
        -Params @{
            apimName       = $name
            location       = $Location
            publisherEmail = $email
            publisherName  = $pubName
            sku            = $sku
            tags           = $Tags
        }
}

function Install-IntegrationAccount {
    param([string]$RG, [string]$Location, [hashtable]$Tags)
    Write-Header "Integration Account Configuration"
    $name = Ask "Integration Account name"
    $sku  = Pick "SKU:" @("Basic", "Standard", "Free") 0

    Deploy-Module -ResourceGroup $RG -DeploymentName "ia-$name" `
        -BicepFile "$ScriptDir\modules\integrationaccount.bicep" `
        -Params @{
            integrationAccountName = $name
            location               = $Location
            sku                    = $sku
            tags                   = $Tags
        }
}

function Install-FunctionApp {
    param([string]$RG, [string]$Location, [hashtable]$Tags)
    Write-Header "Function App Configuration"
    $name    = Ask "Function App name"
    $storage = Ask "Storage account name (3-24 chars lowercase)"
    $runtime = Pick "Runtime:" @("dotnet", "dotnet-isolated", "node", "python", "java") 0

    Deploy-Module -ResourceGroup $RG -DeploymentName "fa-$name" `
        -BicepFile "$ScriptDir\modules\functionapp.bicep" `
        -Params @{
            functionAppName    = $name
            location           = $Location
            storageAccountName = $storage
            runtime            = $runtime
            tags               = $Tags
        }
}

function Install-KeyVault {
    param([string]$RG, [string]$Location, [hashtable]$Tags)
    Write-Header "Key Vault Configuration"
    $name    = Ask "Key Vault name (3-24 chars)"
    $sku     = Pick "SKU:" @("standard", "premium") 0
    $adminId = AskOptional "Your Entra Object ID for admin access (optional)"

    Deploy-Module -ResourceGroup $RG -DeploymentName "kv-$name" `
        -BicepFile "$ScriptDir\modules\keyvault.bicep" `
        -Params @{
            keyVaultName    = $name
            location        = $Location
            sku             = $sku
            adminObjectId   = $adminId
            tags            = $Tags
        }
}

function Install-EventGrid {
    param([string]$RG, [string]$Location, [hashtable]$Tags)
    Write-Header "Event Grid Configuration"
    $name = Ask "Event Grid topic name"

    Deploy-Module -ResourceGroup $RG -DeploymentName "eg-$name" `
        -BicepFile "$ScriptDir\modules\eventgrid.bicep" `
        -Params @{
            topicName = $name
            location  = $Location
            tags      = $Tags
        }
}

# ══════════════════════════════════════════════════════════════════════════════
#  MAIN FLOW
# ══════════════════════════════════════════════════════════════════════════════

Clear-Host
Write-Host @"
╔══════════════════════════════════════════════════════╗
║       DeploX v0.01                                   ║
║       Azure Integration Services Deployer            ║
╚══════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Assert-AzCli
Assert-Login | Out-Null
Select-Subscription | Out-Null

# Location
$regions = @('westeurope','northeurope','eastus','eastus2','westus','westus2','centralus','uksouth','ukwest','australiaeast','southeastasia','japaneast')
$location = Pick "Azure region:" $regions 0

# Resource group
$rg = Select-ResourceGroup -Location $location

# Tags
$tags = Build-Tags

# Service selection loop
$services = @(
    "Logic App (Consumption or Standard)"
    "Service Bus"
    "Event Hubs"
    "API Management (APIM)"
    "Integration Account"
    "Function App"
    "Key Vault"
    "Event Grid Topic"
    "Done - Exit"
)

while ($true) {
    Write-Header "What would you like to deploy?"
    $choice = Pick "Select a service:" $services ($services.Count - 1)

    switch ($choice) {
        "Logic App (Consumption or Standard)" { Install-LogicApp           -RG $rg -Location $location -Tags $tags }
        "Service Bus"                          { Install-ServiceBus         -RG $rg -Location $location -Tags $tags }
        "Event Hubs"                           { Install-EventHub           -RG $rg -Location $location -Tags $tags }
        "API Management (APIM)"               { Install-APIM               -RG $rg -Location $location -Tags $tags }
        "Integration Account"                  { Install-IntegrationAccount -RG $rg -Location $location -Tags $tags }
        "Function App"                         { Install-FunctionApp        -RG $rg -Location $location -Tags $tags }
        "Key Vault"                            { Install-KeyVault           -RG $rg -Location $location -Tags $tags }
        "Event Grid Topic"                     { Install-EventGrid          -RG $rg -Location $location -Tags $tags }
        "Done - Exit"                          { Write-Host "`n✔ All done! Happy integrating 🚀`n" -ForegroundColor Cyan; exit 0 }
    }

    $more = Read-Host "`nDeploy another service? (Y/n)"
    if ($more -eq "n") { Write-Host "`n✔ All done! Happy integrating 🚀`n" -ForegroundColor Cyan; exit 0 }
}
