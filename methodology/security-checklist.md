# Azure Integration Services Security Checklist

This checklist provides comprehensive security checks for Azure Integration Services environments. Each check includes verification methods and remediation guidance.

---

## Severity Definitions

| Severity | Description | Example |
|----------|-------------|---------|
| **HIGH** | Immediate security risk, data exposure, compliance violation | Hardcoded secrets, public endpoints without auth |
| **MEDIUM** | Missing best practice, increased attack surface | No managed identity, excessive permissions |
| **LOW** | Minor improvement, defense in depth | Missing tags, documentation gaps |

---

## 1. Authentication & Authorization

### 1.1 Managed Identity Usage

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| AUTH-01 | Logic Apps use Managed Identity | MEDIUM | Logic Apps MCP: Check connection authentication types | Enable System or User Assigned Managed Identity |
| AUTH-02 | Function Apps use Managed Identity | MEDIUM | Azure MCP: Check identity configuration | Enable System Assigned Managed Identity |
| AUTH-03 | No service principals with client secrets | MEDIUM | Azure MCP: Check app registrations | Migrate to Managed Identity or certificates |
| AUTH-04 | APIM uses Managed Identity for backends | MEDIUM | Azure MCP: Check APIM backend configs | Configure Managed Identity authentication |

### 1.2 RBAC Configuration

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| RBAC-01 | No Owner role at resource level | MEDIUM | Azure MCP: List role assignments | Use Contributor or custom roles |
| RBAC-02 | Least privilege principle followed | MEDIUM | Azure MCP: Analyze role assignments | Review and reduce permissions |
| RBAC-03 | No standing privileged access | HIGH | Azure MCP: Check permanent Owner/Contributor | Implement PIM for just-in-time access |
| RBAC-04 | Service accounts have minimal scope | MEDIUM | Azure MCP: Check SP role assignments | Scope to resource group, not subscription |
| RBAC-05 | No deprecated roles used | LOW | Azure MCP: Check for classic roles | Migrate to Azure RBAC |

### 1.3 Key Vault Usage

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| KV-01 | All secrets in Key Vault | HIGH | Logic Apps MCP: Check workflow definitions for hardcoded values | Move secrets to Key Vault, use references |
| KV-02 | Key Vault access policies follow least privilege | MEDIUM | Azure MCP: Check access policies | Review and restrict permissions |
| KV-03 | Key Vault uses RBAC (preferred over policies) | LOW | Azure MCP: Check permission model | Enable RBAC permission model |
| KV-04 | Soft delete enabled | MEDIUM | Azure MCP: Check Key Vault properties | Enable soft delete |
| KV-05 | Purge protection enabled | MEDIUM | Azure MCP: Check Key Vault properties | Enable purge protection |

### 1.4 SAS Token Management

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| SAS-01 | SAS tokens have expiration | HIGH | Azure MCP: Check SAS configurations | Set appropriate expiration |
| SAS-02 | SAS tokens have minimal permissions | MEDIUM | Azure MCP: Check SAS permissions | Use read-only where possible |
| SAS-03 | Stored access policies used | LOW | Azure MCP: Check storage policies | Implement stored access policies |
| SAS-04 | No account-level SAS in production | MEDIUM | Review workflow definitions | Use service or container SAS |

---

## 2. Network Security

### 2.1 Private Endpoints

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| NET-01 | Key Vault uses private endpoint | HIGH | Azure MCP: Check private endpoints | Configure private endpoint |
| NET-02 | Service Bus uses private endpoint | HIGH | Azure MCP: Check private endpoints | Configure private endpoint |
| NET-03 | Storage accounts use private endpoints | MEDIUM | Azure MCP: Check private endpoints | Configure private endpoint |
| NET-04 | Logic Apps Standard uses VNet integration | MEDIUM | Azure MCP: Check VNet config | Enable VNet integration |
| NET-05 | APIM uses VNet (internal or external) | MEDIUM | Azure MCP: Check APIM network mode | Deploy in VNet |

### 2.2 IP Restrictions

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| IP-01 | Logic Apps have IP restrictions configured | MEDIUM | Logic Apps MCP: Check access control | Configure allowed IP ranges |
| IP-02 | Function Apps have IP restrictions | MEDIUM | Azure MCP: Check network config | Configure access restrictions |
| IP-03 | APIM has IP filtering policies | LOW | Azure MCP: Check APIM policies | Add IP filter policies |
| IP-04 | Storage firewall enabled | MEDIUM | Azure MCP: Check firewall rules | Enable storage firewall |
| IP-05 | Service Bus firewall enabled | MEDIUM | Azure MCP: Check firewall rules | Enable IP filtering |

### 2.3 Network Security Groups

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| NSG-01 | Integration subnet has NSG | MEDIUM | Azure MCP: Check subnet NSG | Associate NSG with rules |
| NSG-02 | NSG rules follow least privilege | MEDIUM | Azure MCP: Analyze NSG rules | Review and restrict rules |
| NSG-03 | No allow-all inbound rules | HIGH | Azure MCP: Check for 0.0.0.0/0 rules | Remove or scope down |
| NSG-04 | NSG flow logs enabled | LOW | Azure MCP: Check flow logs | Enable NSG flow logs |

---

## 3. Data Protection

### 3.1 Encryption

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| ENC-01 | Storage accounts use encryption at rest | LOW | Azure MCP: Check encryption (default on) | Verify enabled |
| ENC-02 | Service Bus uses encryption | LOW | Azure MCP: Check encryption | Verify enabled (default) |
| ENC-03 | Customer-managed keys where required | LOW | Azure MCP: Check CMK config | Implement CMK if compliance requires |
| ENC-04 | Key Vault keys are HSM-backed | LOW | Azure MCP: Check key type | Use HSM-backed keys for sensitive data |

### 3.2 Transport Security

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| TLS-01 | TLS 1.2 minimum enforced | HIGH | Azure MCP: Check TLS settings | Set minimum TLS to 1.2 |
| TLS-02 | Storage secure transfer required | HIGH | Azure MCP: Check secure transfer | Enable secure transfer |
| TLS-03 | APIM enforces HTTPS | HIGH | Azure MCP: Check APIM settings | Disable HTTP, enforce HTTPS |
| TLS-04 | Custom domains use managed certificates | LOW | Azure MCP: Check certificates | Use Azure-managed certificates |

### 3.3 Secure Inputs/Outputs

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| SIO-01 | Sensitive operations use Secure Inputs | MEDIUM | Check workflow definition action settings | Enable "Secure Inputs" |
| SIO-02 | Sensitive operations use Secure Outputs | MEDIUM | Check workflow definition action settings | Enable "Secure Outputs" |
| SIO-03 | HTTP triggers require authentication | HIGH | Check trigger config in workflow definition | Configure OAuth or SAS auth |

---

## 4. Secrets Management

### 4.1 Secret Storage

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| SEC-01 | No hardcoded connection strings in workflows | HIGH | Search workflow definition JSON for patterns: `SharedAccessKey`, `AccountKey`, `Password`, `ConnectionString` | Use Key Vault references |
| SEC-02 | No hardcoded API keys | HIGH | Search workflow definition JSON for patterns: `api-key`, `apikey`, `x-api-key`, `subscription-key` | Store in Key Vault |
| SEC-03 | App Settings reference Key Vault | MEDIUM | Azure MCP: Check app settings | Use @Microsoft.KeyVault() references |
| SEC-04 | No secrets in source control | HIGH | Review repo if accessible | Use CI/CD secret injection |

### 4.2 Secret Rotation

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| ROT-01 | Key Vault secrets have expiration dates | MEDIUM | Azure MCP: Check secret properties | Set expiration dates |
| ROT-02 | Certificate rotation process exists | MEDIUM | Interview/documentation | Implement rotation runbook |
| ROT-03 | SAS keys rotated regularly | LOW | Check storage key rotation | Implement regular rotation |
| ROT-04 | Service Bus keys rotated | LOW | Check rotation history | Implement regular rotation |

---

## 5. Monitoring & Auditing

### 5.1 Diagnostic Settings

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| MON-01 | Logic Apps have diagnostic settings | MEDIUM | Azure MCP: Check diagnostic settings | Enable to Log Analytics |
| MON-02 | Service Bus has diagnostic settings | MEDIUM | Azure MCP: Check diagnostic settings | Enable to Log Analytics |
| MON-03 | Key Vault has diagnostic settings | HIGH | Azure MCP: Check diagnostic settings | Enable audit logging |
| MON-04 | APIM has diagnostic settings | MEDIUM | Azure MCP: Check diagnostic settings | Enable to Log Analytics |
| MON-05 | Logs sent to Log Analytics (not just Storage) | MEDIUM | Azure MCP: Check log destinations | Configure Log Analytics sink |

### 5.2 Activity Logs

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| ACT-01 | Activity logs retained > 90 days | MEDIUM | Azure MCP: Check retention | Configure retention policy |
| ACT-02 | Activity logs forwarded to SIEM | LOW | Azure MCP: Check export config | Configure export if required |

### 5.3 Alert Rules

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| ALT-01 | Alerts for Logic App failures | MEDIUM | Azure MCP: Check alert rules | Create failure alert |
| ALT-02 | Alerts for Key Vault access anomalies | HIGH | Azure MCP: Check alert rules | Configure Key Vault alerts |
| ALT-03 | Alerts for Service Bus dead-letter growth | MEDIUM | Azure MCP: Check alert rules | Create DLQ metric alert |
| ALT-04 | Alerts for authentication failures | HIGH | Azure MCP: Check alert rules | Configure auth failure alerts |

---

## 6. Logic Apps Specific

### 6.1 Trigger Security

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| LA-01 | HTTP triggers have authentication | HIGH | Logic Apps MCP: Check trigger config | Enable OAuth or API key |
| LA-02 | SAS keys regenerated after exposure | HIGH | Check trigger URLs | Regenerate keys if compromised |
| LA-03 | Request trigger validates schema | LOW | Logic Apps MCP: Check schema validation | Add JSON schema validation |
| LA-04 | Webhook subscriptions authenticated | MEDIUM | Logic Apps MCP: Check webhook auth | Configure authentication |

### 6.2 Connection Security

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| LA-05 | Connections use Managed Identity | MEDIUM | Logic Apps MCP: Check connections | Migrate to MI auth |
| LA-06 | No shared connections across environments | MEDIUM | Review connection usage | Use environment-specific connections |
| LA-07 | Connection consent properly configured | LOW | Azure MCP: Check API connections | Review consent settings |

### 6.3 Workflow Security

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| LA-08 | Run history retention configured | LOW | Logic Apps MCP: Check settings | Configure appropriate retention |
| LA-09 | Content security enabled (Standard) | MEDIUM | Azure MCP: Check app settings | Enable content security |
| LA-10 | Integration Service Environment for isolation | LOW | Azure MCP: Check ISE usage | Consider ISE for strict isolation |

---

## 7. Service Bus Specific

### 7.1 Authentication

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| SB-01 | Managed Identity preferred over SAS | MEDIUM | Azure MCP: Check auth methods | Migrate to Managed Identity |
| SB-02 | Separate SAS policies per application | MEDIUM | Azure MCP: Check SAS policies | Create app-specific policies |
| SB-03 | Minimal rights on SAS policies | MEDIUM | Azure MCP: Check policy rights | Use Send or Listen, not Manage |
| SB-04 | Root namespace key not in applications | HIGH | Review app configurations | Use queue/topic specific keys |

### 7.2 Network

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| SB-05 | Premium tier for VNet support | MEDIUM | Azure MCP: Check SKU | Upgrade to Premium if VNet needed |
| SB-06 | IP filtering configured | MEDIUM | Azure MCP: Check network rules | Configure IP rules |
| SB-07 | Private endpoint for secure access | HIGH | Azure MCP: Check private endpoints | Configure private endpoint |

---

## 8. API Management Specific

### 8.1 Authentication

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| APIM-01 | Subscription keys required | MEDIUM | Azure MCP: Check product settings | Require subscription |
| APIM-02 | OAuth 2.0 configured for APIs | MEDIUM | Azure MCP: Check API auth | Configure OAuth validation |
| APIM-03 | Certificate validation for backends | MEDIUM | Azure MCP: Check backend config | Configure cert validation |
| APIM-04 | Self-hosted gateway secured | HIGH | Azure MCP: Check gateway config | Configure gateway security |

### 8.2 Policies

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| APIM-05 | Rate limiting configured | MEDIUM | Azure MCP: Check policies | Add rate-limit policy |
| APIM-06 | CORS properly configured | MEDIUM | Azure MCP: Check CORS policy | Configure appropriate origins |
| APIM-07 | Validate-jwt policy for OAuth | MEDIUM | Azure MCP: Check policies | Add JWT validation |
| APIM-08 | IP filtering in policies | LOW | Azure MCP: Check policies | Add IP filter if needed |

### 8.3 Developer Portal

| ID | Check | Severity | How to Verify | Remediation |
|----|-------|----------|---------------|-------------|
| APIM-09 | Developer portal authentication | MEDIUM | Azure MCP: Check portal settings | Configure AAD auth |
| APIM-10 | No sensitive data in API samples | MEDIUM | Review API documentation | Remove sensitive examples |

---

## Audit Summary Template

```markdown
## Security Audit Summary

**Date**: YYYY-MM-DD
**Client**: {client_name}
**Assessor**: Contica Integration Assessment Agent

### Findings Summary

| Severity | Count |
|----------|-------|
| HIGH | X |
| MEDIUM | X |
| LOW | X |

### High Severity Findings

| ID | Finding | Resource | Remediation Priority |
|----|---------|----------|---------------------|
| | | | |

### Security Score by Category

| Category | Score | Notes |
|----------|-------|-------|
| Authentication & Authorization | X/10 | |
| Network Security | X/10 | |
| Data Protection | X/10 | |
| Secrets Management | X/10 | |
| Monitoring & Auditing | X/10 | |
| Logic Apps | X/10 | |
| Service Bus | X/10 | |
| API Management | X/10 | |

**Overall Score**: X/100
```
