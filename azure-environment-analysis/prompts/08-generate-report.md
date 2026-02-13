# Phase 8: Generate Assessment Report

## Objective
Synthesize all findings from Phases 1-7 into a comprehensive Current State Assessment Report.

---

## Output Location

Read the client name from the active client config and the assessment date.
All outputs for this phase go to: `/output/{client-name}/{YYYY-MM-DD}/reports/`
The folder should already exist from Phase 0.

---

## Prerequisites

Before running this prompt:
1. **All previous phases must be complete**
2. Verify these files exist:
   - `/output/{client-name}/{YYYY-MM-DD}/inventory/resources.json`
   - `/output/{client-name}/{YYYY-MM-DD}/inventory/summary.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/service-bus-analysis.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/function-apps-analysis.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/apim-analysis.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/supporting-services-analysis.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/connector-inventory.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/failure-analysis.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/security-audit.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/dead-flows.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/monitoring-gaps.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/naming-tagging.md`
   - `/output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/*.md`
3. Have the report template ready: `/methodology/report-template.md`
4. Know the client name from config
5. After saving the report, check `salesOpportunities.includeInReport` in client config — if true, proceed to Phase 9 immediately
6. **Use Microsoft Docs MCP** to include Azure CAF/WAF links in the report:
   - Search: "Azure Cloud Adoption Framework integration services"
   - Search: "Azure Well-Architected Framework security pillar"
   - Include relevant Microsoft Learn links as supporting references in findings

---

## Prompt

```
I need to generate the final Current State Assessment Report for the Azure Integration Services assessment.

### Step 1: Gather All Inputs

Read all output files from previous phases:

1. **Inventory Data**
   - /output/{client-name}/{YYYY-MM-DD}/inventory/resources.json
   - /output/{client-name}/{YYYY-MM-DD}/inventory/summary.md

2. **Phase 2 Deep Dive Analysis Files**
   - /output/{client-name}/{YYYY-MM-DD}/analysis/service-bus-analysis.md
   - /output/{client-name}/{YYYY-MM-DD}/analysis/function-apps-analysis.md
   - /output/{client-name}/{YYYY-MM-DD}/analysis/apim-analysis.md
   - /output/{client-name}/{YYYY-MM-DD}/analysis/supporting-services-analysis.md
   - /output/{client-name}/{YYYY-MM-DD}/analysis/connector-inventory.md

3. **Phase 3-7 Analysis Files**
   - /output/{client-name}/{YYYY-MM-DD}/analysis/failure-analysis.md
   - /output/{client-name}/{YYYY-MM-DD}/analysis/security-audit.md
   - /output/{client-name}/{YYYY-MM-DD}/analysis/dead-flows.md
   - /output/{client-name}/{YYYY-MM-DD}/analysis/monitoring-gaps.md
   - /output/{client-name}/{YYYY-MM-DD}/analysis/naming-tagging.md

4. **Logic App Details**
   - /output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/*.md (summarize, don't include all)

4. **Template**
   - /methodology/report-template.md

### Step 2: Write Executive Summary

Write 2-3 paragraphs in **business language** (not technical jargon):

1. **Overview Paragraph**: What is the integration environment? What business processes does it support? What's the scale?

2. **Key Findings Paragraph**: What are the most important findings? Focus on:
   - Security risks that need attention
   - Operational issues affecting reliability
   - Cost optimization opportunities
   - Technical debt concerns

3. **Recommendation Paragraph**: What are the top 3-5 recommendations? Frame in terms of business value.

### Step 3: Populate Each Section

Follow the template structure:

**Section 2: Scope & Methodology**
- Copy from client config (subscriptions, resource groups)
- Document any limitations encountered

**Section 3: Environment Overview**
- Resource counts from inventory
- Geographic distribution
- Resource group structure
- High-level architecture description

**Section 4: Integration Flows Summary**
- Logic Apps activity summary (from logic-apps/*.md)
- Service Bus analysis summary (from service-bus-analysis.md)
- Function Apps summary (from function-apps-analysis.md)
- APIM summary (from apim-analysis.md)
- Supporting services summary (from supporting-services-analysis.md)
- Trigger types distribution
- Connector usage summary (from connector-inventory.md)
- Complexity distribution

**Section 5: Security Assessment**
- Security scores from audit
- Findings table (all severities)
- Detailed HIGH severity findings
- Include evidence and remediation
- Include **"Microsoft Recommendation"** tips from CAF/WAF where relevant

**Section 6: Operational Health**
- Run history statistics
- Top failing flows (from failure analysis)
- Error patterns
- Monitoring coverage stats

**Section 7: Technical Debt & Dead Flows**
- Dead flow candidates
- Technical debt items
- Cost impact

**Section 8: Recommendations**
- Consolidate all recommendations from phases
- Prioritize: Quick Wins, Medium-term, Strategic
- Create implementation roadmap

**Section 9: Appendix**
- Reference detailed files (don't duplicate content)

### Step 4: Quality Checks

Before finalizing:
- [ ] Executive summary is business-readable (no jargon)
- [ ] All findings have evidence
- [ ] All recommendations are actionable
- [ ] Severity ratings are justified
- [ ] Numbers are consistent across sections
- [ ] No confidential data exposed inappropriately
- [ ] Table of contents is accurate
- [ ] Client name is correct throughout

### Output Requirements

Save the final report:
`/output/{client-name}/{YYYY-MM-DD}/reports/current-state-assessment.md`

### Report Quality Standards

**Executive Summary**:
- ✅ Written for C-level audience
- ✅ No acronyms without explanation
- ✅ Business impact focus
- ✅ Clear call to action

**Findings**:
- ✅ Every finding has evidence
- ✅ Resource names included
- ✅ Timestamps where relevant
- ✅ Clear severity justification

**Recommendations**:
- ✅ Specific and actionable
- ✅ Effort estimate included
- ✅ Expected value/impact stated
- ✅ Prioritized logically

**Formatting**:
- ✅ Consistent heading levels
- ✅ Tables for structured data
- ✅ Code blocks for technical content
- ✅ Proper markdown rendering
```

---

## Report Sections Checklist

| Section | Content Source | Priority |
|---------|---------------|----------|
| Executive Summary | All phases | High |
| Scope & Methodology | Client config | Medium |
| Environment Overview | Inventory | High |
| Integration Flows | Deep dive + inventory | High |
| Security Assessment | Security audit | High |
| Operational Health | Failure analysis + monitoring | High |
| Technical Debt | Dead flows + patterns | Medium |
| Recommendations | All phases | High |
| Appendix | File references | Low |

---

## Sample Executive Summary

```markdown
## Executive Summary

{Client}'s Azure integration environment supports critical business processes 
including order management, customer data synchronization, and partner integrations. 
The environment comprises {n} Logic Apps, {n} Service Bus namespaces, and {n} 
Function Apps distributed across {n} resource groups in the {region} region.

Our assessment identified several areas requiring attention. From a security 
perspective, we found {n} high-severity issues including {brief description}. 
Operationally, {n} Logic Apps experienced failures in the past 90 days, with 
{top issue} being the primary cause. We also identified {n} inactive integrations 
that are candidates for decommissioning, representing potential cost savings and 
reduced maintenance overhead.

We recommend prioritizing the remediation of security findings, particularly 
{top security issue}. Additionally, implementing proper monitoring and alerting 
will improve operational visibility and reduce mean-time-to-resolution for 
incidents. The complete recommendations are detailed in Section 8, organized 
by implementation effort and business impact.
```

---

## Recommendation Consolidation

Gather recommendations from:
- Service Bus analysis (messaging improvements)
- Function Apps analysis (compute improvements)
- APIM analysis (API governance)
- Supporting services analysis (infrastructure improvements)
- Security audit (security fixes)
- Failure analysis (reliability improvements)
- Monitoring gaps (observability)
- Naming/tagging (governance)
- Dead flows (cleanup)

Deduplicate and prioritize:
1. **Critical**: Security risks, compliance issues
2. **High**: Operational stability, cost optimization
3. **Medium**: Best practices, efficiency
4. **Low**: Nice-to-have, minor improvements

---

## Success Criteria

- [ ] All sections populated
- [ ] Executive summary complete
- [ ] Findings have evidence
- [ ] Recommendations prioritized
- [ ] Quality checks passed
- [ ] Report saved to correct location

---

## Next Step: Phase 9 (Sales Opportunities)

**After saving the report, ALWAYS check the client config for `salesOpportunities.includeInReport`.**

- If `true`: **Read `/prompts/09-sales-opportunities.md` and execute Phase 9 immediately.** Do NOT stop — continue directly into Phase 9. (Credential cleanup happens after Phase 9.)
- If `false`: Assessment is complete. **Proceed to Post-Assessment Credential Cleanup below**, then show the user a summary of all generated files.

---

## Post-Assessment Credential Cleanup

**This step runs when the assessment is complete** (after Phase 9, or here if Phase 9 is skipped).

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

**After credential cleanup (or after Phase 9 if it ran), generate the final HTML report.**

This compiles ALL markdown and JSON files from the assessment into a single offline interactive HTML file with tabbed navigation.

**Run the script:**
```bash
npm run report -- {client-name} {YYYY-MM-DD}
```

**Example:**
```bash
npm run report -- acme-corp 2026-02-12
```

**What it does:**
- Reads all `.md` and `.json` files from `/output/{client-name}/{YYYY-MM-DD}/`
- Converts markdown to styled HTML
- Creates a tabbed interface grouped by: Reports, Inventory, Analysis, Logic Apps
- Generates a single self-contained HTML file (no external dependencies)
- Saves to: `/output/{client-name}/{YYYY-MM-DD}/reports/assessment-report.html`

**If `npm run report` fails** (e.g., `marked` not installed), run:
```bash
npm install
npm run report -- {client-name} {YYYY-MM-DD}
```

**Final output**: Tell the user to open the HTML file in a browser to view the interactive report.

This ensures sales opportunity reports are always generated when configured.
