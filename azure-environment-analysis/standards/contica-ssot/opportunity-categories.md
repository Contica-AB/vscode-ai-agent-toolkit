# Contica SSOT - Opportunity Categories

This document defines the categories of sales opportunities that can be identified during Azure Integration Services assessments.

---

## Opportunity Categories

### 1. Security & Compliance Remediation

**Trigger Findings:**
- Non-compliant resources per SSOT standards
- Missing Managed Identity implementations
- Hardcoded secrets or connection strings
- Missing network isolation (Private Endpoints, VNet integration)
- Non-compliant Azure Policy findings
- Defender for Cloud high-severity recommendations

**Service Offerings:**

| Service | Description | Typical Effort | Value |
|---------|-------------|----------------|-------|
| Managed Identity Migration | Replace connection strings with MI | 2-5 days/resource type | Eliminate credential exposure |
| Network Security Hardening | Implement Private Endpoints, VNet integration | 3-10 days | Reduce attack surface |
| Key Vault Migration | Move secrets from app settings to Key Vault | 1-3 days/app | Centralized secret management |
| Policy Remediation | Remediate non-compliant resources | Variable | Meet compliance requirements |
| Security Posture Review | Deep-dive security assessment | 5-10 days | Risk reduction roadmap |

**Pricing Guidance:**
- Day rate: €1,200 - €1,800
- Fixed price packages available for common scenarios

---

### 2. Operational Excellence Improvements

**Trigger Findings:**
- Missing or incomplete monitoring
- No alerting configured
- Logic Apps without error handling (scopes, retry policies)
- Missing Application Insights integration
- No dashboards or operational visibility

**Service Offerings:**

| Service | Description | Typical Effort | Value |
|---------|-------------|----------------|-------|
| Monitoring Implementation | Set up Log Analytics, App Insights, alerts | 5-15 days | Proactive issue detection |
| Alert Configuration | Configure actionable alerts | 2-5 days | Reduce MTTR |
| Dashboard Creation | Build operational dashboards | 3-7 days | Real-time visibility |
| Error Handling Patterns | Implement proper try-catch, retry policies | 2-4 days/flow | Improved resilience |
| Runbook Development | Create operational procedures | 3-5 days | Consistent operations |

**Pricing Guidance:**
- Day rate: €1,200 - €1,500
- Monitoring packages: €5,000 - €15,000 depending on scope

---

### 3. Technical Debt Reduction

**Trigger Findings:**
- Dead or unused flows (no runs in 90+ days)
- Legacy resources (old SKUs, deprecated services)
- Redundant or duplicate integrations
- Poor naming/tagging compliance
- Inconsistent patterns across integrations

**Service Offerings:**

| Service | Description | Typical Effort | Value |
|---------|-------------|----------------|-------|
| Dead Flow Cleanup | Decommission unused integrations | 2-5 days | Cost savings, reduced complexity |
| Legacy Modernization | Upgrade to current SKUs/services | Variable | Better performance, support |
| Consolidation Analysis | Identify redundant integrations | 3-5 days | Simplified landscape |
| Naming/Tagging Remediation | Standardize naming and tags | 2-5 days | Improved governance |
| Architecture Standardization | Align patterns across integrations | 5-15 days | Maintainability |

**Pricing Guidance:**
- Day rate: €1,200 - €1,500
- Cleanup packages based on resource count

---

### 4. Cost Optimization

**Trigger Findings:**
- Azure Advisor cost recommendations
- Oversized/underutilized resources
- Resources in wrong tier for usage
- Idle resources in non-production environments
- Missing Reserved Instances for stable workloads

**Service Offerings:**

| Service | Description | Typical Effort | Value |
|---------|-------------|----------------|-------|
| Cost Analysis & Right-sizing | Analyze usage, recommend changes | 3-5 days | Monthly savings identified |
| Reserved Instance Planning | Analyze workloads for RI | 2-3 days | Up to 72% savings |
| Dev/Test Optimization | Implement auto-shutdown, lower tiers | 2-5 days | Reduced non-prod costs |
| Storage Tiering | Implement lifecycle policies | 2-3 days | Storage cost reduction |
| Consumption Baseline | Establish cost baselines and budgets | 2-3 days | Predictable costs |

**Pricing Guidance:**
- Often priced as % of identified savings (10-20% of first year savings)
- Or fixed price: €3,000 - €8,000

---

### 5. New Integration Development

**Trigger Findings:**
- Client mentions upcoming projects
- Integration gaps identified in landscape
- Manual processes that could be automated
- Missing connections between systems

**Service Offerings:**

| Service | Description | Typical Effort | Value |
|---------|-------------|----------------|-------|
| Integration Design | Architecture for new integration | 3-5 days | Solid foundation |
| Integration Development | Build new Logic Apps, Functions | Variable | Automation, efficiency |
| API Development | Build APIs in APIM | Variable | Standardized interfaces |
| Process Automation | Automate manual workflows | Variable | Time savings |
| System Connectivity | Connect new systems to integration layer | Variable | Extended capabilities |

**Pricing Guidance:**
- Day rate: €1,200 - €1,800
- Fixed price based on complexity

---

### 6. Knowledge Transfer & Training

**Trigger Findings:**
- Client team lacks Azure integration expertise
- Poor patterns suggest skill gaps
- No documentation exists
- High dependency on specific individuals

**Service Offerings:**

| Service | Description | Typical Effort | Value |
|---------|-------------|----------------|-------|
| Logic Apps Training | Hands-on training for team | 2-3 days | Self-sufficiency |
| Azure Integration Workshop | Comprehensive integration training | 3-5 days | Skill development |
| Documentation Sprint | Document existing integrations | 3-10 days | Knowledge preservation |
| Best Practices Workshop | Review and teach patterns | 1-2 days | Quality improvement |
| Pair Programming | Mentor while building | Ongoing | Practical learning |

**Pricing Guidance:**
- Training day rate: €1,500 - €2,000
- Documentation: per-integration pricing

---

### 7. Managed Services

**Trigger Findings:**
- Client lacks ongoing operational capacity
- Recurring issues requiring intervention
- No 24/7 support for critical integrations
- Client wants to focus on core business

**Service Offerings:**

| Service | Description | Typical Effort | Value |
|---------|-------------|----------------|-------|
| Integration Monitoring | 24/7 monitoring and alerting | Monthly | Peace of mind |
| Incident Response | On-call support for issues | Monthly | Reduced MTTR |
| Maintenance & Updates | Regular maintenance tasks | Monthly | System health |
| Capacity Planning | Proactive scaling recommendations | Quarterly | Avoid bottlenecks |
| Full Managed Service | Complete operational ownership | Monthly | Focus on business |

**Pricing Guidance:**
- Monitoring: €500 - €2,000/month depending on scope
- Full managed: €3,000 - €15,000/month depending on complexity

---

## Opportunity Sizing

### T-Shirt Sizes

| Size | Effort | Revenue Range |
|------|--------|---------------|
| XS | 1-2 days | €1,500 - €3,000 |
| S | 3-5 days | €4,000 - €8,000 |
| M | 5-10 days | €8,000 - €15,000 |
| L | 10-20 days | €15,000 - €35,000 |
| XL | 20+ days | €35,000+ |

### Confidence Levels

| Level | Meaning | Evidence Required |
|-------|---------|-------------------|
| **High** | Clear need, client aware | Finding is documented, client acknowledged issue |
| **Medium** | Likely need, may need discovery | Finding exists, client may not be aware |
| **Low** | Potential need, requires validation | Inferred from patterns, needs discussion |

---

## Opportunity Qualification

For each opportunity, assess:

1. **Pain Level** – How much does this hurt the client? (1-5)
2. **Urgency** – How soon do they need to act? (1-5)
3. **Budget Availability** – Can they fund this? (Yes/No/Unknown)
4. **Decision Maker Access** – Can we reach the decision maker? (Yes/No)
5. **Competition** – Are others competing? (Yes/No/Unknown)

---

## Cross-Reference with Assessment Phases

| Phase | Primary Opportunities |
|-------|----------------------|
| Phase 1: Discovery | New Integration Development (landscape gaps) |
| Phase 2: Logic Apps Deep Dive | Technical Debt, Operational Excellence |
| Phase 3: Failure Analysis | Operational Excellence, Managed Services |
| Phase 4: Security Audit | Security & Compliance Remediation |
| Phase 5: Dead Flow Detection | Technical Debt Reduction |
| Phase 6: Monitoring Gaps | Operational Excellence |
| Phase 7: Naming & Tagging | Technical Debt Reduction |
| Phase 8: Report | Knowledge Transfer (documentation) |
