# Phase 4: Security Audit

## Objective
Evaluate the security posture of all integration resources against the security checklist, rating findings by severity.

---

## Output Location

Read the client name from the active client config.
All outputs for this phase go to: `/output/{client-name}/{YYYY-MM-DD}/analysis/`
The folder should already exist from Phase 0.

---

## Prerequisites

Before running this prompt:
1. **Phase 0 through Phase 3 must be complete**
2. Read the SSOT security standards:
   - `/standards/contica-ssot/baseline-levels.md` — Compliance levels
   - `/standards/contica-ssot/authentication-matrix.md` — Required MI/RBAC
   - `/standards/contica-ssot/network-security.md` — Security options
   - `/standards/contica-ssot/required-tiers.md` — Minimum tiers
   - `/standards/contica-ssot/azure-policies.md` — Required Azure Policies
   - `/standards/contica-ssot/known-exceptions.md` — Accepted exceptions
3. Read Azure recommendation APIs:
   - `/standards/azure-apis/advisor-recommendations.md` — Azure Advisor queries
   - `/standards/azure-apis/defender-recommendations.md` — Defender for Cloud findings
   - `/standards/azure-apis/policy-compliance.md` — Azure Policy compliance
4. Read `/methodology/security-checklist.md` for additional checks
5. **Use Microsoft Docs MCP** to fetch Azure CAF security baseline guidance:
   - Search: "Azure Cloud Adoption Framework security baseline"
   - Search: "Azure Well-Architected Framework security pillar"
   - Include CAF/WAF links as supporting tips alongside SSOT findings
5. Have the inventory available from `/output/{client-name}/{YYYY-MM-DD}/inventory/`
6. Note the client's `securityOption` setting (Standard/Advanced)

---

## Tool Selection Strategy

> **MCP-First Rule**: Always try MCP tools first. Only fall back to CLI if MCP fails.

| Operation | Primary (MCP) | Fallback (CLI) |
|-----------|---------------|----------------|
| RBAC role assignments | Azure MCP | `az role assignment list` |
| Key Vault configuration | Azure MCP | `az keyvault show` |
| Network settings | Azure MCP | `az network` commands |
| Diagnostic settings | Azure MCP | `az monitor diagnostic-settings list` |
| Logic App definitions | Logic Apps MCP | `az logic workflow show -g {rg} -n {name}` |
| Search for hardcoded secrets | Logic Apps MCP → parse JSON | `az logic workflow show` → parse JSON |
| Service Bus security | Azure MCP | `az servicebus namespace show` |
| Storage security | Azure MCP | `az storage account show` |
| Event Grid security | Azure MCP | `az eventgrid topic show` |
| Event Hub security | Azure MCP | `az eventhubs namespace show` |
| App Config security | Azure MCP | `az appconfig show` |

---

## Prompt

```
I need to perform Phase 4: Security Audit for the Azure Integration Services assessment.

Read the security checklist from /methodology/security-checklist.md and systematically evaluate each check.

### Category 1: Authentication & Authorization

**1.1 Managed Identity Usage**
For each integration resource:
- Check if Managed Identity is enabled (System or User Assigned)
- Identify resources using stored credentials instead
- Document authentication method for each

**1.2 RBAC Configuration**
Using Azure MCP:
- List all role assignments on integration resources
- Check for Owner role at resource level (should be avoided)
- Identify overly permissive assignments
- Look for standing privileged access

**1.3 Key Vault Usage**
- Identify Key Vaults used by integration resources
- Check access policies or RBAC permissions
- Verify soft delete and purge protection
- Search Logic App definitions for hardcoded secrets

**1.4 SAS Token Analysis**
For Service Bus and Storage:
- Check SAS token configurations
- Verify expiration policies
- Assess permission scope

### Category 2: Network Security

**2.1 Private Endpoints**
For each resource type, check:
- Key Vault: private endpoint configured?
- Service Bus: private endpoint configured?
- Storage: private endpoint configured?
- Logic Apps Standard: VNet integration?

**2.2 IP Restrictions**
- Logic Apps: access control configuration
- Function Apps: network restrictions
- APIM: IP filtering policies
- Storage/Service Bus firewall rules

**2.3 NSG Analysis**
If integration resources are in subnets:
- Check NSG association
- Review inbound/outbound rules
- Flag any allow-all rules

### Category 3: Data Protection

**3.1 Encryption**
- Verify encryption at rest (default, but confirm)
- Check TLS version settings (minimum 1.2)
- Verify secure transfer for storage

**3.2 Secure Inputs/Outputs**
For Logic Apps:
- Check for Secure Inputs on sensitive actions
- Check for Secure Outputs where needed
- Verify HTTP triggers have authentication

### Category 4: Secrets Management

**4.1 Hardcoded Secrets**
Search Logic App workflow definitions for:
- Connection strings
- API keys
- Passwords
- Tokens

Flag any hardcoded values as HIGH severity.

**4.2 Secret Rotation**
- Check Key Vault secret expiration dates
- Assess rotation practices (if documented)

### Category 5: Monitoring & Auditing

**5.1 Diagnostic Settings**
For each resource:
- Check if diagnostic settings exist
- Verify logs go to Log Analytics (not just Storage)
- Check retention policies

**5.2 Alert Rules**
- List existing alert rules
- Check for failure alerts on Logic Apps
- Check for Key Vault access alerts
- Check for Service Bus DLQ alerts

### Category 6: Event-Driven & Configuration Services Security

**6.1 Event Grid Security**
For each Event Grid topic:
- Check access keys vs Managed Identity for event delivery
- Check if topic uses system-assigned or user-assigned MI for subscriptions
- Verify private endpoints configured (if required by security option)
- Check input schema validation settings
- Review event subscription endpoint authentication (webhook validation, AAD auth)

**6.2 Event Hub Security**
For each Event Hub namespace:
- Check SAS policies and their permissions (Send, Listen, Manage)
- Verify Managed Identity usage for producers/consumers
- Check network rules (IP filtering, VNet rules, private endpoints)
- Verify TLS version (minimum 1.2)
- Check if namespace uses customer-managed keys for encryption
- Review authorization rules — flag any with Manage claims that aren't needed

**6.3 App Configuration Security**
For each App Configuration store:
- Check access method: access keys vs Azure RBAC (RBAC preferred)
- Verify private endpoints configured (if required by security option)
- Check if customer-managed encryption keys are used
- Verify no secrets are stored as plain key-values (should use Key Vault references)
- Check if access keys are disabled (best practice when using RBAC)

### Category 7: Azure Built-in Recommendations

**6.1 Azure Advisor Security Recommendations**
Using queries from `/standards/azure-apis/advisor-recommendations.md`:
- Query Azure Advisor for security recommendations
- Focus on integration resources (Logic Apps, Service Bus, Key Vault, APIM)
- Document High/Medium impact recommendations
- Cross-reference with our findings

**6.2 Microsoft Defender for Cloud**
Using queries from `/standards/azure-apis/defender-recommendations.md`:
- Query Defender for Cloud recommendations
- Check secure score for integration resources
- Document unhealthy resources
- Note any actively exploited vulnerabilities

**6.3 Azure Policy Compliance**
Using queries from `/standards/azure-apis/policy-compliance.md`:
- Query policy compliance state
- Check against required policies in `/standards/contica-ssot/azure-policies.md`
- Document non-compliant resources
- Identify missing policy assignments

**Note**: If Azure Advisor, Defender, or Policy data is not available (permissions), document as "Not evaluated - insufficient permissions".

### Category 8: Azure CAF / WAF Alignment

**7.1 Microsoft Cloud Adoption Framework**
Use Microsoft Docs MCP to search for Azure CAF guidance relevant to findings:
- Search: "Azure CAF security baseline for {resource-type}" for each resource type
- Search: "Azure CAF identity and access management"
- Search: "Azure CAF network topology and connectivity"
- Include relevant CAF recommendations as **"Microsoft Recommendation"** tips in findings
- Note where Contica SSOT aligns with or goes beyond CAF

**7.2 Well-Architected Framework Security Pillar**
Use Microsoft Docs MCP to search:
- Search: "Azure Well-Architected Framework security checklist"
- Cross-reference WAF security recommendations with SSOT findings
- Include links to relevant Microsoft Learn articles in the report

**Important**: CAF/WAF guidance supplements SSOT — it does not replace it. Present as additional context and tips.

### Output Requirements

1. Save security audit:
   `/output/{client-name}/{YYYY-MM-DD}/analysis/security-audit.md`
   
   Structure:
   ```markdown
   # Security Audit Report
   
   **Date**: {date}
   **Client**: {client}
   
   ## Executive Summary
   
   | Severity | Count |
   |----------|-------|
   | HIGH | {n} |
   | MEDIUM | {n} |
   | LOW | {n} |
   
   Overall Security Score: {X}/100
   
   ## Findings by Category
   
   ### Authentication & Authorization
   Score: {X}/10
   
   | ID | Check | Status | Severity | Finding |
   |----|-------|--------|----------|---------|
   | AUTH-01 | Managed Identity | ⚠️ | MEDIUM | 3/10 Logic Apps missing MI |
   
   #### AUTH-01: Managed Identity Usage
   
   **Status**: Partial Compliance
   **Severity**: MEDIUM
   
   **Finding**: 
   3 Logic Apps are not using Managed Identity:
   - logic-legacy-import (rg-integration)
   - logic-old-sync (rg-integration)
   - logic-test-flow (rg-dev)
   
   **Evidence**:
   - Checked via `az logic workflow show` definition analysis
   - These use connection strings stored in connection objects
   
   **Remediation**:
   1. Enable System Assigned Managed Identity on each Logic App
   2. Update connectors to use MI authentication
   3. Remove stored credentials
   
   **Effort**: Medium (2-3 hours per Logic App)
   
   [... continue for each finding ...]
   
   ## Security Scorecard
   
   | Category | Score | Critical Issues |
   |----------|-------|-----------------|
   | Authentication & Authorization | 7/10 | None |
   | Network Security | 5/10 | 1 HIGH |
   | Data Protection | 8/10 | None |
   | Secrets Management | 4/10 | 2 HIGH |
   | Monitoring & Auditing | 6/10 | None |
   
   ## Prioritized Remediation Plan
   
   ### Immediate (HIGH severity)
   1. {finding and fix}
   
   ### Short-term (MEDIUM severity)
   1. {finding and fix}
   
   ### Long-term (LOW severity)
   1. {finding and fix}
   ```

### Severity Guidelines

- **HIGH**: Immediate security risk
  - Hardcoded secrets in workflows
  - Public endpoints without authentication
  - No RBAC (anonymous access)
  - Missing Key Vault audit logs

- **MEDIUM**: Missing best practice
  - No Managed Identity
  - Excessive permissions
  - No IP restrictions
  - No diagnostic settings

- **LOW**: Minor improvements
  - Missing tags
  - Documentation gaps
  - Non-critical monitoring gaps
```

---

## Tool Usage Reference

| Operation | Tool/Command |
|-----------|-------------|
| RBAC queries | Azure MCP or `az role assignment list` |
| Key Vault config | Azure MCP or `az keyvault show` |
| Network settings | Azure MCP or `az network` commands |
| Diagnostic settings | `az monitor diagnostic-settings list` |
| Logic App definitions (for secrets search) | `az logic workflow show` |
| Trigger auth | Parse workflow definition JSON |

**MCP-First Rule**: Always try Logic Apps MCP first for workflow definitions. Use `az logic workflow show` only as fallback if MCP fails.

---

## Success Criteria

- [ ] All checklist items evaluated
- [ ] Findings documented with evidence
- [ ] Severity ratings assigned with justification
- [ ] Security scores calculated
- [ ] Remediation plan created
- [ ] Report saved
- [ ] Ready for Phase 5
