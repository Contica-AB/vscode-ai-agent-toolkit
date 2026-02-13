# Contica SSOT - Network Security Standards

> **Source**: Synced from Confluence pages "Azure Integration Services Baseline", "Standard Security Baseline", and "Advanced Security Baseline" on 2026-02-11

This document defines the two security options and their network configuration requirements.

---

## Security Options Overview

Contica implementations follow one of two security models:

| Aspect               | Standard Security                         | Advanced Security                                   |
| -------------------- | ----------------------------------------- | --------------------------------------------------- |
| Private Endpoints    | No                                        | Yes (Required)                                      |
| Service Endpoints    | Yes                                       | No                                                  |
| Network Traffic      | Microsoft Backbone                        | Virtual Network                                     |
| Public Access        | Enabled (IP filter)                       | Disabled                                            |
| Network Restrictions | Whitelist VNET or NGW IP                  | Firewall rules or NSG                               |
| Topology             | Single or more LZ (1+ Sub, 1+ VNET)       | Hub-spoke (3+ Subs, 3+ VNETs)                       |
| Hub/Outbound Traffic | NAT Gateway (NGW)                         | Azure Firewall or NVA                               |
| Deployment           | Managed DevOps Pools or Self-hosted Agent | Managed DevOps Pools or Self-hosted Agent with VNET |

---

## Standard Security Option

### Overview

The Standard Security Baseline ensures **good level of security while keeping cost and complexity low**. Suitable for most customers who need secure Azure Integration Services without the overhead of fully private networking.

### Key Characteristics

- **Security Level**: Cost-effective security with public endpoints protected by IP filtering
- **Network Approach**: Uses Microsoft Backbone with Service Endpoints and NAT Gateway
- **Complexity**: Lower complexity, easier to maintain
- **Cost**: More cost-effective than Advanced option

### Helium Security Level Requirements

Resources must **pass all checks in Helium levels 1-3** for security.

### How Service Endpoints Work

Service Endpoints enable secure connections from your VNET to Azure services. When enabled on a subnet, traffic to the Azure service travels over the Microsoft backbone network rather than the public internet. The destination service then restricts access to only allow connections from your VNET.

### NAT Gateway for Static IP

Resources in Azure normally use dynamic IP addresses. When calling external APIs or partner systems that require IP whitelisting, the NAT Gateway solves this by routing all outbound traffic through a single static public IP.

### Acceptable Configurations

| Configuration                   | Acceptable?                       |
| ------------------------------- | --------------------------------- |
| Service Endpoints enabled       | ✅ Yes                            |
| Private Endpoints               | ✅ Optional (exceeds requirement) |
| Public access with IP filtering | ✅ Yes                            |
| Public access without filtering | ❌ No — finding                   |
| VNet integration on apps        | ✅ Yes                            |

---

## Advanced Security Option

### Overview

The Advanced Security Baseline ensures **high level of security where a fully locked down and private environment is prioritized**. Suitable for customers with strict security requirements and compliance needs.

### Key Characteristics

- **Security Level**: Maximum security with fully private networking
- **Network Approach**: Private Endpoints with Virtual Network isolation
- **Complexity**: Higher complexity, requires advanced networking expertise
- **Cost**: Higher cost due to Premium tiers and private networking infrastructure

### Helium Security Level Requirements

Resources must **pass all checks in Helium levels 1-5** for security.

### Required Infrastructure

- **Hub-Spoke Topology**: 3+ Subscriptions, 3+ VNETs
- **Azure Firewall or NVA**: All outbound traffic controlled centrally
- **Private Endpoints**: Mandatory for all supported resources
- **No Public Access**: All public endpoints disabled
- **Premium Tiers**: Required for resources to support Private Endpoints (e.g., Service Bus Premium, API Management Premium)

### Deployment Requirements

- Managed DevOps Pools or Self-hosted Agents with VNET connectivity
- VPN Gateway IPSec Tunnel for on-premises access (no On-Premises Data Gateway)

### Network Characteristics

- **Network Traffic**: Flows through Virtual Network (private IP addresses only)
- **Public Access**: Disabled on all resources
- **Private Endpoints**: Mandatory for all supported Azure PaaS services
- **Network Restrictions**: Controlled by firewall rules or Network Security Groups (NSGs)

### Acceptable Configurations

| Configuration               | Acceptable?                     |
| --------------------------- | ------------------------------- |
| Private Endpoints           | ✅ Required                     |
| Service Endpoints only      | ❌ No — finding                 |
| Public access enabled       | ❌ No — finding                 |
| Azure Firewall for outbound | ✅ Yes                          |
| NAT Gateway for outbound    | ⚠️ Acceptable but not preferred |

---

## Service Endpoint and Network Restriction Matrix

For each combination of source and destination, this table defines:

- What Service Endpoint must be enabled on the **outbound subnet**
- What network restriction must be configured on the **destination resource**

### Standard Security Option — Required Configuration

| Initializing Resource                                                        | Destination Resource                    | Service Endpoint Required                 | Network Restriction on Destination                         |
| ---------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| App Service / Logic Apps Standard / Function Apps Premium / Flex Consumption | Storage Account                         | `Microsoft.Storage` on outbound subnet    | Allow VNET in Storage Account network settings             |
| App Service / Logic Apps Standard / Function Apps Premium / Flex Consumption | Key Vault                               | `Microsoft.KeyVault` on outbound subnet   | Allow VNET in Key Vault network settings                   |
| App Service / Logic Apps Standard / Function Apps Premium / Flex Consumption | Service Bus Premium                     | `Microsoft.ServiceBus` on outbound subnet | Allow VNET in Service Bus network settings                 |
| App Service / Logic Apps Standard / Function Apps Premium / Flex Consumption | Service Bus Standard/Basic              | Route via NGW/NVA/Firewall for static IP  | Allow IP in Service Bus network settings                   |
| App Service / Logic Apps Standard / Function Apps Premium / Flex Consumption | APIM Standard V2 / Developer            | Route via NGW/NVA/Firewall for static IP  | Whitelist IP in Global policy with IP-Filter               |
| App Service / Logic Apps Standard / Function Apps Premium / Flex Consumption | Function App HTTP Trigger               | `Microsoft.Web` on outbound subnet        | Allow VNET in Function App network settings                |
| App Service / Logic Apps Standard / Function Apps Premium / Flex Consumption | Logic App HTTP Trigger                  | `Microsoft.Web` on outbound subnet        | Allow VNET in Logic App network settings                   |
| App Service / Logic Apps Standard / Function Apps Premium / Flex Consumption | Event Hub                               | `Microsoft.EventHub` on outbound subnet   | Allow VNET in Event Hub network settings                   |
| App Service / Logic Apps Standard / Function Apps Premium / Flex Consumption | Azure SQL Database                      | `Microsoft.Sql` on outbound subnet        | Allow VNET in SQL Server network settings                  |
| APIM Standard V2                                                             | Function App / Logic App HTTP Trigger   | `Microsoft.Web` on outbound subnet        | Allow VNET in app network settings                         |
| APIM Standard V2                                                             | Storage Account                         | `Microsoft.Storage` on outbound subnet    | Allow VNET in Storage Account network settings             |
| APIM Standard V2                                                             | Event Hub                               | `Microsoft.EventHub` on outbound subnet   | Allow VNET in Event Hub network settings                   |
| APIM Standard V2                                                             | Key Vault                               | `Microsoft.KeyVault` on outbound subnet   | Allow VNET in Key Vault network settings                   |
| APIM Basic (Classic) / Developer                                             | Function App / Logic App HTTP Trigger   | Not supported (public IP)                 | Allow IP in app network settings                           |
| APIM Basic (Classic) / Developer                                             | Storage Account / Event Hub / Key Vault | Not supported (public IP)                 | Allow IP in resource network settings                      |
| External Consumer                                                            | API Management (Any tier)               | N/A                                       | Whitelist IP in Global/API/Operation policy with IP-Filter |

---

## Agent Verification Checklist

### For Standard Security Option

The agent should verify:

1. **Service Endpoints on Subnets**

   ```
   Check: Are the required service endpoints enabled on subnets used by integration resources?
   Query: Get VNet integration subnet → check serviceEndpoints property
   ```

2. **VNet/IP Whitelisting on Destinations**

   ```
   Check: Are source VNets or IPs whitelisted in destination network settings?
   Query: Check networkAcls.virtualNetworkRules and networkAcls.ipRules on destination
   ```

3. **NAT Gateway for Static IP**
   ```
   Check: Do resources that need static IP outbound have NAT Gateway?
   Query: Check subnet's natGateway property
   ```

### For Advanced Security Option

The agent should verify:

1. **Private Endpoints Exist**

   ```
   Check: Does every Key Vault, Storage, Service Bus have a private endpoint?
   Query: List private endpoints, cross-reference with resources
   ```

2. **Public Access Disabled**

   ```
   Check: Is publicNetworkAccess set to 'Disabled' on all resources?
   Query: Check publicNetworkAccess property on each resource
   ```

3. **No Service Endpoint Reliance**
   ```
   Check: Resources should not rely on service endpoints for security
   Note: Service endpoints can exist alongside private endpoints, but private should be primary
   ```

---

## Notes

- The `securityOption` in client config determines which set of checks to apply
- If `securityOption` is not specified, default to **Standard**
- For Advanced security, ANY resource with public access enabled is a finding
- For Standard security, missing VNet rules where service endpoints exist is a finding
