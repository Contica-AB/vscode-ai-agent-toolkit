# Phase 9: Sales Opportunities Generation

## Objective

Synthesize all assessment findings into actionable sales opportunities for the account manager.

---

## Output Location

Read the client name from the active client config.
All outputs for this phase go to: `/output/{client-name}/{YYYY-MM-DD}/reports/`
The folder should already exist from Phase 0.

---

## Prerequisites

Before running this prompt:
1. ✅ Phases 1-8 completed
2. ✅ All analysis files exist in `/output/{client-name}/{YYYY-MM-DD}/analysis/`
3. ✅ Final report generated in `/output/{client-name}/{YYYY-MM-DD}/reports/`
4. ✅ Client config loaded with currency and account manager info

---

## Client Configuration

Read the client configuration to get:
- `currency` – Currency for pricing (EUR, GBP, USD, etc.)
- `salesOpportunities.includeInReport` – Whether to append to main report
- `accountManager` – Who receives the opportunity summary
- `clientDecisionMaker` – Primary contact for opportunities

---

## Input Files

Read the following files for opportunity identification:

```
/output/{client-name}/{YYYY-MM-DD}/analysis/security-audit.md
/output/{client-name}/{YYYY-MM-DD}/analysis/failure-analysis.md
/output/{client-name}/{YYYY-MM-DD}/analysis/dead-flows.md
/output/{client-name}/{YYYY-MM-DD}/analysis/monitoring-gaps.md
/output/{client-name}/{YYYY-MM-DD}/analysis/naming-tagging.md
/output/{client-name}/{YYYY-MM-DD}/analysis/service-bus-analysis.md
/output/{client-name}/{YYYY-MM-DD}/analysis/function-apps-analysis.md
/output/{client-name}/{YYYY-MM-DD}/analysis/apim-analysis.md
/output/{client-name}/{YYYY-MM-DD}/analysis/supporting-services-analysis.md
/output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/*.md
/output/{client-name}/{YYYY-MM-DD}/reports/current-state-assessment.md
/standards/contica-ssot/opportunity-categories.md
```

---

## Opportunity Identification Process

### Step 1: Map Findings to Categories

For each finding in the assessment, determine which opportunity category it maps to:

| Finding Type | Maps To |
|--------------|---------|
| HIGH severity security issue | Security & Compliance Remediation |
| Missing Managed Identity | Security & Compliance Remediation |
| Hardcoded secrets | Security & Compliance Remediation |
| No Private Endpoints | Security & Compliance Remediation |
| Failed runs / error patterns | Operational Excellence |
| Missing monitoring | Operational Excellence |
| No alerting | Operational Excellence |
| Dead/unused flows | Technical Debt Reduction |
| Legacy resources | Technical Debt Reduction |
| Naming/tagging non-compliance | Technical Debt Reduction |
| Azure Advisor cost recommendations | Cost Optimization |
| Oversized resources | Cost Optimization |
| Service Bus DLQ buildup | Operational Excellence |
| Function App failures/timeouts | Operational Excellence |
| APIM error rates / no policies | Operational Excellence |
| Unused resources (any type) | Cost Optimization |
| No error handling patterns | Operational Excellence |
| Missing Service Bus partitioning | Performance & Scalability |
| APIM without rate limiting | Security & Compliance Remediation |
| Key Vault secrets expiring | Security & Compliance Remediation |
| Skill gaps mentioned | Knowledge Transfer |
| Ongoing support needs | Managed Services |

### Step 2: Group and Prioritize

Group similar findings into opportunities:
- Don't create one opportunity per finding
- Combine related findings into coherent service offerings
- Prioritize based on:
  1. Client pain level (highest first)
  2. Revenue potential
  3. Strategic value (opens door to more work)

### Step 3: Size Each Opportunity

For each opportunity, determine:
- **T-Shirt Size**: XS, S, M, L, XL
- **Effort Estimate**: Days
- **Revenue Range**: Based on opportunity-categories.md pricing guidance
- **Confidence Level**: High, Medium, Low

### Step 4: Write Opportunity Summaries

For each opportunity, write:
1. **Title** – Clear, client-friendly name
2. **Problem Statement** – What issue does this address? (client language)
3. **Evidence** – Specific findings that justify this opportunity
4. **Proposed Solution** – What Contica will do
5. **Business Value** – Benefits to the client
6. **Estimate** – Size, effort, price range
7. **Next Steps** – How to proceed

---

## Output Format

### Opportunity Summary (for Account Manager)

```markdown
# Sales Opportunities Summary

**Client**: {client_name}
**Assessment Date**: {date}
**Account Manager**: {account_manager}
**Prepared By**: Assessment Agent

---

## Executive Summary

- **Total Opportunities Identified**: {count}
- **Total Estimated Revenue**: {currency} {min} - {max}
- **Top Priority**: {top_opportunity_title}

---

## Opportunities by Priority

### 1. {Opportunity Title} ⭐ TOP PRIORITY

**Category**: {category}
**Size**: {t_shirt_size} | **Effort**: {days} days | **Revenue**: {currency} {min} - {max}
**Confidence**: {HIGH/MEDIUM/LOW}

**Problem**:
{Client-friendly problem statement}

**Evidence from Assessment**:
- {Finding 1 with specific resource/metric}
- {Finding 2}
- {Finding 3}

**Proposed Solution**:
{What Contica will deliver}

**Business Value**:
- {Benefit 1}
- {Benefit 2}

**Next Steps**:
1. {Action 1}
2. {Action 2}

---

### 2. {Next Opportunity}
...
```

### Opportunity Detail (per opportunity)

```markdown
## Opportunity: {Title}

### Overview

| Attribute | Value |
|-----------|-------|
| Category | {category} |
| Size | {XS/S/M/L/XL} |
| Effort | {days} days |
| Revenue | {currency} {min} - {max} |
| Confidence | {HIGH/MEDIUM/LOW} |
| Decision Maker | {client_decision_maker} |

### Problem Statement

{2-3 sentences describing the problem in client-friendly terms}

### Assessment Evidence

| Finding | Source | Severity | Resource(s) |
|---------|--------|----------|-------------|
| {finding} | {phase} | {severity} | {resources} |

### Proposed Solution

**Scope**:
- {Deliverable 1}
- {Deliverable 2}
- {Deliverable 3}

**Approach**:
{Brief methodology description}

**Timeline**:
{Estimated duration}

### Business Value

| Benefit | Metric |
|---------|--------|
| {Benefit 1} | {Quantified if possible} |
| {Benefit 2} | {Quantified if possible} |

### Risks & Considerations

- {Risk or consideration 1}
- {Risk or consideration 2}

### Next Steps

1. {Immediate action}
2. {Follow-up action}
3. {Proposal/SOW creation}
```

---

## Revenue Summary Table

```markdown
## Revenue Summary

| # | Opportunity | Category | Size | Effort | Min ({currency}) | Max ({currency}) | Confidence |
|---|-------------|----------|------|--------|------------------|------------------|------------|
| 1 | {title} | {category} | M | 8d | 10,000 | 15,000 | High |
| 2 | {title} | {category} | S | 4d | 5,000 | 7,500 | Medium |
| 3 | {title} | {category} | L | 15d | 20,000 | 30,000 | Low |
| **Total** | | | | | **35,000** | **52,500** | |
```

---

## Cross-Reference Checklist

Before finalizing, verify:

- [ ] Every HIGH severity finding has a corresponding opportunity
- [ ] Security findings → Security & Compliance category
- [ ] Failure patterns → Operational Excellence category
- [ ] Dead flows → Technical Debt category
- [ ] No duplicate opportunities (consolidated properly)
- [ ] Pricing aligns with opportunity-categories.md
- [ ] Currency matches client config
- [ ] Account manager and decision maker populated

---

## Output Files

Save opportunities to:

```
/output/{client-name}/{YYYY-MM-DD}/reports/improvement-opportunities.md     # Full details
/output/{client-name}/{YYYY-MM-DD}/reports/opportunity-summary.md           # Account manager summary
```

If `salesOpportunities.includeInReport == true` in client config:
- Append Section 10 to the main assessment report

---

## Pitch Tips for Account Managers

Include a "How to Pitch" section in the opportunity summary with advice per category:

### Security & Compliance Remediation
- **Lead with risk**: "Your integration layer processes business-critical data but has {N} high-severity gaps"
- **Quantify exposure**: "Hardcoded secrets in {N} workflows create a single-point-of-failure if credentials leak"
- **Compliance angle**: "These gaps would be flagged in any SOC 2 / ISO 27001 audit"

### Operational Excellence
- **Lead with downtime cost**: "Your workflows failed {N} times in the last 30 days — each failure means {business impact}"
- **Show trend**: "Failure rate is {increasing/stable} — without action this will worsen"
- **DLQ buildup**: "{N} dead-lettered messages in Service Bus = lost or delayed business transactions"

### Technical Debt Reduction
- **Cost waste angle**: "{N} unused resources are costing you monthly with zero business value"
- **Maintenance burden**: "Dead flows and unused resources create confusion and slow down your team"
- **Quick win**: "Cleaning up unused resources is a quick win that reduces cost and complexity"

### Cost Optimization
- **Hard numbers**: "Right-sizing these resources could save approximately {currency} {amount}/month"
- **Oversized resources**: "{N} resources are on Premium tiers but only need Standard"

### Knowledge Transfer
- **Bus factor**: "If your integration specialist leaves, who maintains these {N} workflows?"
- **Documentation gap**: "No runbooks or documentation exist for your critical integration flows"

---

## Notes

- Be conservative with estimates — underpromise, overdeliver
- Confidence level should reflect assessment evidence quality
- Don't include opportunities with no supporting evidence
- High-confidence opportunities should be prioritized in discussions
- This output is internal — do not share raw opportunity docs with client

---

## Post-Assessment Credential Cleanup

**After Phase 9 is complete**, perform credential cleanup:

1. Read `azureAccess.authenticationType` from the client config
2. **If `"service-principal"`**:
   - ASK the user:
     ```
     The assessment is complete. You used a service principal for authentication.

     Have you copied the client secret to a secure location
     (e.g., Azure Key Vault, password manager)?

     Once you confirm, I will clean up all traces of the secret from this project.
     ```
   - **Wait for explicit confirmation** — do NOT proceed without it
   - Once confirmed, clean up:
     - Delete `set-env-vars.ps1` from the project root (if it exists)
     - Delete `set-env-vars.sh` from the project root (if it exists)
     - Remove `clientSecret` from the client config if stored there
     - Tell the user to clear environment variables:
       - Windows: `Remove-Item Env:AZURE_CLIENT_SECRET`
       - Linux/macOS: `unset AZURE_CLIENT_SECRET`
     - Ask: "Do you also want to delete the service principal from Azure AD?"
       - If yes: `az ad sp delete --id {clientId}`
       - If no: skip
   - Report cleanup actions taken
3. **If `"azure-cli"`**: No cleanup needed — skip this step

**Important**: Never leave client secrets in project files after the assessment is complete.

---

## Generate Interactive HTML Report

**After credential cleanup, generate the final HTML report.**

```bash
npm run report -- {client-name} {YYYY-MM-DD}
```

This compiles ALL assessment documents into a single offline interactive HTML file.
Saves to: `/output/{client-name}/{YYYY-MM-DD}/reports/assessment-report.html`

Tell the user to open the HTML file in a browser to view the interactive report.
