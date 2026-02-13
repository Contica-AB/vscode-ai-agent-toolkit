# Azure Integration Services Assessment Framework

This document defines the comprehensive methodology for conducting Azure Integration Services environment assessments. The framework consists of 10 sequential phases, each building on the outputs of previous phases.

> **Primary Reference**: All findings are evaluated against the Contica SSOT standards in `/standards/contica-ssot/`.
>
> **Supplementary Reference**: Use Microsoft Docs MCP to query Azure Cloud Adoption Framework (CAF) and Well-Architected Framework (WAF) guidance. Include CAF/WAF links as supporting tips alongside SSOT findings.

---

## Overview

| Phase | Name                           | Objective                                                    | AI-Assisted Duration |
| ----- | ------------------------------ | ------------------------------------------------------------ | -------------------- |
| 0     | Preflight Validation           | Verify environment and config                                | 5 min                |
| 1     | Discovery                      | Enumerate all integration resources                          | 10-20 min            |
| 2     | Integration Services Deep Dive | Analyze all integration resource configurations and patterns | 30-60 min            |
| 3     | Failure Analysis               | Identify failure patterns across all resources               | 15-30 min            |
| 4     | Security Audit                 | Evaluate security posture vs SSOT                            | 15-30 min            |
| 5     | Unused Resource Detection      | Find unused/legacy resources across all types                | 10-20 min            |
| 6     | Monitoring Gaps                | Assess observability coverage                                | 10-20 min            |
| 7     | Naming & Tagging               | Evaluate compliance vs SSOT                                  | 5-10 min             |
| 8     | Report Generation              | Synthesize findings                                          | 20-40 min            |
| 9     | Sales Opportunities            | Identify service opportunities                               | 15-25 min            |

**Total Estimated Effort (AI-Assisted)**: 2-5 hours depending on environment size

> **Note**: Manual assessment without AI/MCP would take 20-35 hours. The MCP tools automate data collection entirely, and AI handles analysis and report generation.

---

## Phase 0: Preflight Validation

### Objective

Verify that the environment is properly configured and all prerequisites are met before starting the assessment.

### Checks

| Check          | Validation                                      |
| -------------- | ----------------------------------------------- |
| Azure CLI      | Authenticated and correct subscription          |
| Client Config  | No placeholder values                           |
| MCP Servers    | Accessible and responding                       |
| SSOT Standards | All files present in `/standards/contica-ssot/` |
| Output Folders | Exist and are writable                          |

### Expected Outputs

- Confirmation message listing all passed checks
- OR list of blockers that must be resolved

### Prompt

Use `/prompts/00-preflight.md`

### Estimated Effort (AI-Assisted)

- All environments: 5 min

---

## Phase 1: Discovery

### Objective

Create a complete inventory of all integration-related Azure resources in-scope, capturing configuration details, relationships, and metadata.

### Data Sources

| Source                 | Tool            | Purpose                   |
| ---------------------- | --------------- | ------------------------- |
| Azure Resource Graph   | Azure MCP / KQL | Bulk resource enumeration |
| Logic Apps API         | Logic Apps MCP  | Logic App specifics       |
| Azure Resource Manager | Azure MCP       | Resource details          |

### Expected Outputs

1. **Resource Inventory JSON** (`/output/{client-name}/{YYYY-MM-DD}/inventory/resources.json`)
   - All integration resources with full metadata
   - Structured by resource type
   - Includes tags, SKU, region, state

2. **Resource Summary** (`/output/{client-name}/{YYYY-MM-DD}/inventory/summary.md`)
   - Count by resource type
   - Distribution by region
   - Distribution by resource group
   - Tag coverage statistics

### Key Questions to Answer

- [ ] How many Logic Apps exist? (Consumption vs Standard breakdown)
- [ ] How many Service Bus namespaces, queues, topics?
- [ ] Which API Management instances exist?
- [ ] How many Function Apps are integration-related?
- [ ] What Key Vaults are used by integration resources?
- [ ] What's the geographic distribution?
- [ ] Which resource groups contain integration resources?
- [ ] What's the overall tag coverage?

### Procedure

1. Read client config to confirm scope (subscriptions, resource groups)
2. Execute Resource Graph query for all integration resource types
3. For Logic Apps, use Logic Apps MCP to get additional details
4. Aggregate results into structured inventory
5. Generate summary statistics
6. Save outputs

### Estimated Effort (AI-Assisted)

- Small environment (< 50 resources): 10 min
- Medium environment (50-200 resources): 15 min
- Large environment (> 200 resources): 20 min

> MCP automates all API calls. Human effort is just reviewing the output.

---

## Phase 2: Integration Services Deep Dive

### Objective

For each integration resource, extract detailed configuration and analyze patterns in design, error handling, and dependencies. Covers Logic Apps, Service Bus, Function Apps, APIM, Key Vault, Storage, Event Grid, Event Hub, and App Configuration.

### Data Sources

| Source               | Tool                                 | Purpose                                               |
| -------------------- | ------------------------------------ | ----------------------------------------------------- |
| Workflow Definitions | `az logic workflow show` / `az rest` | Extract JSON definitions                              |
| Service Bus Config   | `az servicebus` CLI                  | Queue/topic/subscription analysis                     |
| Function Apps Config | `az functionapp` CLI                 | Runtime, settings, functions inventory                |
| APIM Config          | `az apim` CLI / `az rest`            | API, policy, product analysis                         |
| Supporting Services  | Azure MCP / `az` CLI                 | Key Vault, Storage, Event Grid, Event Hub, App Config |

### Expected Outputs

1. **Per-Logic-App Analysis** (`/output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/{name}.md`)
   - Trigger type and configuration
   - Action inventory with types
   - Connectors used
   - Error handling patterns
   - Dependencies identified

2. **Connector Summary** (`/output/{client-name}/{YYYY-MM-DD}/analysis/connector-inventory.md`)
   - All connectors in use across all Logic Apps
   - Connection authentication methods
   - Shared vs dedicated connections

3. **Pattern Analysis** (`/output/{client-name}/{YYYY-MM-DD}/analysis/pattern-analysis.md`)
   - Common patterns observed
   - Anti-patterns detected
   - Complexity metrics

### Key Questions to Answer

- [ ] What triggers are used? (HTTP, Recurrence, Service Bus, Event Grid, etc.)
- [ ] What connectors are most common?
- [ ] Are error handling patterns consistent?
- [ ] Do Logic Apps use scopes for try-catch?
- [ ] Are retry policies configured appropriately?
- [ ] What external dependencies exist?
- [ ] Are there nested workflow calls?
- [ ] Is there code reuse via child workflows?

### Procedure

1. For each Logic App from inventory:
   a. Get workflow definition
   b. Parse trigger configuration
   c. Enumerate actions and their types
   d. Check for scope/error handling patterns
   e. Extract connector references
   f. Identify dependencies
   g. Document findings
2. Aggregate connector usage
3. Identify pattern commonalities
4. Document anti-patterns

### Estimated Effort (AI-Assisted)

- Per Logic App: 30 seconds (automated)
- 20 Logic Apps: 15-20 min
- 50 Logic Apps: 30-40 min

> AI analyzes workflow definitions in parallel. Human reviews findings.

---

## Phase 3: Failure Analysis

### Objective

Analyze operational health across all integration resources — Logic Apps run history, Service Bus dead-letter queues, Function App execution failures, and APIM error rates — to identify failure patterns, recurring errors, and root causes.

### Data Sources

| Source                | Tool                                        | Purpose                               |
| --------------------- | ------------------------------------------- | ------------------------------------- |
| Logic App Run History | `az rest` (ARM API)                         | Historical runs, failed actions       |
| Service Bus Metrics   | `az servicebus` / `az monitor metrics list` | DLQ counts, throttling, errors        |
| Function App Metrics  | `az monitor metrics list`                   | Execution counts, Http5xx/4xx         |
| APIM Metrics          | `az monitor metrics list` / Log Analytics   | Request counts, error rates, capacity |

### Expected Outputs

1. **Failure Summary** (`/output/{client-name}/{YYYY-MM-DD}/analysis/failure-analysis.md`)
   - Top 10 failing Logic Apps
   - Service Bus DLQ summary
   - Function App error rates
   - APIM failure rates
   - Cross-resource correlations
   - Error pattern categorization
   - Trend analysis

2. **Root Cause Analysis** (per major failure)
   - Failed action identification
   - Error codes and messages
   - Input/output at failure point
   - Remediation recommendations

### Key Questions to Answer

- [ ] Which Logic Apps fail most frequently?
- [ ] What are the most common error types?
- [ ] Are failures intermittent or consistent?
- [ ] Do failures correlate with specific times?
- [ ] What's the failure rate trend (improving/worsening)?
- [ ] Are there external dependency failures?
- [ ] Are retries exhausted before failures?

### Procedure

1. Query run history for configured period (default: 90 days)
2. Aggregate failure counts by Logic App
3. Identify top 10 failing flows
4. For each top failing flow:
   a. Get sample failed runs
   b. Trace to failed action
   c. Extract error details
   d. Analyze patterns
   e. Propose root cause
5. Categorize errors by type
6. Analyze trends over time

### Estimated Effort (AI-Assisted)

- Small environment (< 100 failures/month): 10 min
- Medium environment (100-1000 failures/month): 20 min
- Large environment (> 1000 failures/month): 30 min

> MCP fetches run history. AI identifies patterns and categorizes failures automatically.

---

## Phase 4: Security Audit

### Objective

Evaluate the security posture of integration resources against the security checklist, rating findings by severity.

### Data Sources

| Source              | Tool           | Purpose             |
| ------------------- | -------------- | ------------------- |
| RBAC Assignments    | Azure MCP      | Permission analysis |
| Key Vault Config    | Azure MCP      | Secrets management  |
| Network Config      | Azure MCP      | Network security    |
| Diagnostic Settings | Azure MCP      | Audit logging       |
| Workflow Security   | Logic Apps MCP | Logic App specific  |

### Expected Outputs

1. **Security Audit Report** (`/output/{client-name}/{YYYY-MM-DD}/analysis/security-audit.md`)
   - Findings table with severity
   - Evidence for each finding
   - Remediation recommendations
   - Risk summary

2. **Security Scorecard**
   - Score by category
   - Overall security posture rating
   - Critical findings count

### Key Questions to Answer

- [ ] Are managed identities used instead of stored credentials?
- [ ] Is RBAC following least-privilege principle?
- [ ] Are secrets stored in Key Vault?
- [ ] Are there hardcoded connection strings?
- [ ] Are private endpoints configured?
- [ ] Is network access restricted appropriately?
- [ ] Are diagnostic settings enabled?
- [ ] Is TLS 1.2+ enforced?

### Procedure

1. Load security checklist (`/methodology/security-checklist.md`)
2. For each category:
   a. Execute relevant checks
   b. Document findings
   c. Rate severity
   d. Record evidence
3. Calculate security scores
4. Prioritize remediations

### Estimated Effort (AI-Assisted)

- All environments: 15-30 min

> Security checks are automated via Resource Graph queries.

---

## Phase 5: Unused Resource Detection

### Objective

Identify unused, legacy, or redundant integration resources across all types — Logic Apps, Service Bus, Function Apps, APIM, Key Vault, Storage, Event Grid, Event Hub, and App Configuration — that are candidates for decommissioning or cleanup.

### Data Sources

| Source                | Tool                      | Purpose                              |
| --------------------- | ------------------------- | ------------------------------------ |
| Logic App Run History | `az rest` (ARM API)       | Activity analysis                    |
| Resource Metrics      | `az monitor metrics list` | Usage metrics for all resource types |
| Resource State        | Azure MCP / `az` CLI      | Enabled/disabled/stopped state       |
| ADO Work Items        | Azure DevOps MCP          | Context gathering                    |

### Expected Outputs

1. **Unused Resource Report** (`/output/{client-name}/{YYYY-MM-DD}/analysis/dead-flows.md`)
   - Unused resources by type (Logic Apps, Service Bus entities, Function Apps, APIs, etc.)
   - Last activity dates and metrics
   - Categorization (inactive, failing, disabled, zero-traffic)
   - Cost impact estimates
   - Recommendations per resource

### Key Questions to Answer

- [ ] Which Logic Apps have zero runs in 90 days?
- [ ] Which Logic Apps are disabled?
- [ ] Which Logic Apps only have failed runs?
- [ ] Which Service Bus queues/topics have zero messages in 90 days?
- [ ] Which Function Apps have zero executions in 90 days?
- [ ] Which APIM APIs have zero requests in 90 days?
- [ ] Which Key Vaults have no access operations in 90 days?
- [ ] Which Event Grid topics have zero published events in 90 days?
- [ ] Which Event Hub namespaces have zero messages in 90 days?
- [ ] Are any unused resources referenced as dependencies?
- [ ] Is there documentation about their purpose?

### Procedure

1. Query run history and metrics for all integration resources
2. Identify resources with no activity in the assessment period
3. Check resource state (enabled/disabled)
4. Cross-reference with ADO for context
5. Categorize candidates by resource type
6. Make recommendations

### Estimated Effort (AI-Assisted)

- Typically: 10-15 min regardless of environment size

> Run history analysis is fully automated.

---

## Phase 6: Monitoring & Observability Gaps

### Objective

Identify resources lacking proper monitoring, alerting, and observability.

### Data Sources

| Source               | Tool      | Purpose           |
| -------------------- | --------- | ----------------- |
| Diagnostic Settings  | Azure MCP | Log configuration |
| Alert Rules          | Azure MCP | Alerting coverage |
| Log Analytics        | Azure MCP | Workspace config  |
| Application Insights | Azure MCP | APM coverage      |

### Expected Outputs

1. **Monitoring Gaps Report** (`/output/{client-name}/{YYYY-MM-DD}/analysis/monitoring-gaps.md`)
   - Resources without diagnostic settings
   - Missing alert rules
   - Log Analytics coverage
   - Recommendations

### Key Questions to Answer

- [ ] Which resources have no diagnostic settings?
- [ ] Is there a central Log Analytics workspace?
- [ ] Are critical alert rules in place?
- [ ] Is Application Insights used for Functions?
- [ ] Are dashboards available for operations?

### Procedure

1. Check diagnostic settings for all resources
2. Query existing alert rules
3. Assess Log Analytics configuration
4. Check Application Insights coverage
5. Identify gaps
6. Prioritize recommendations

### Estimated Effort (AI-Assisted)

- Typically: 10-20 min

> Diagnostic settings and alert rules are checked via Azure MCP.

---

## Phase 7: Naming & Tagging Compliance

### Objective

Evaluate adherence to naming conventions and tagging strategies.

### Data Sources

| Source            | Tool      | Purpose        |
| ----------------- | --------- | -------------- |
| Resource Metadata | Azure MCP | Names and tags |
| Resource Graph    | KQL       | Bulk analysis  |

### Expected Outputs

1. **Compliance Report** (`/output/{client-name}/{YYYY-MM-DD}/analysis/naming-tagging.md`)
   - Naming convention analysis
   - Tag coverage statistics
   - Non-compliant resources list
   - Recommendations

### Key Questions to Answer

- [ ] Are naming conventions consistent?
- [ ] What's the tag coverage percentage?
- [ ] Which required tags are missing?
- [ ] Are tag values standardized?

### Procedure

1. Extract all resource names and tags
2. Analyze naming patterns
3. Check for required tags
4. Calculate compliance percentages
5. Identify outliers
6. Make recommendations

### Estimated Effort (AI-Assisted)

- Typically: 5-10 min

> Tag analysis is a simple aggregation over inventory data.

---

## Phase 8: Report Generation

### Objective

Synthesize all findings into a comprehensive Current State Assessment Report.

### Data Sources

| Source                                          | Purpose           |
| ----------------------------------------------- | ----------------- |
| `/output/{client-name}/{YYYY-MM-DD}/inventory/` | Resource data     |
| `/output/{client-name}/{YYYY-MM-DD}/analysis/`  | All phase outputs |
| `/methodology/report-template.md`               | Structure         |

### Expected Outputs

1. **Assessment Report** (`/output/{client-name}/{YYYY-MM-DD}/reports/current-state-assessment.md`)
   - Executive Summary
   - Detailed findings
   - Recommendations
   - Appendices

### Procedure

1. Read all output files
2. Follow report template
3. Write executive summary (business language)
4. Populate each section
5. Prioritize recommendations
6. Add appendices
7. Review and finalize

### Estimated Effort (AI-Assisted)

- All assessments: 20-40 min

> AI synthesizes findings from all phases into structured report automatically.

---

## Phase 9: Sales Opportunities

### Objective

Synthesize assessment findings into actionable sales opportunities for the account manager.

### Data Sources

| Source                                              | Purpose             |
| --------------------------------------------------- | ------------------- |
| `/output/{client-name}/{YYYY-MM-DD}/analysis/`      | All findings        |
| `/standards/contica-ssot/opportunity-categories.md` | Opportunity mapping |
| Client config                                       | Currency, contacts  |

### Expected Outputs

1. **Full Opportunity Details** (`/output/{client-name}/{YYYY-MM-DD}/reports/improvement-opportunities.md`)
   - All opportunities with evidence
   - Sizing and pricing
   - Confidence levels

2. **Account Manager Summary** (`/output/{client-name}/{YYYY-MM-DD}/reports/opportunity-summary.md`)
   - Executive view
   - Priority ranking
   - Next steps

### Procedure

1. Map each finding to opportunity category
2. Group related findings into service offerings
3. Size opportunities (XS/S/M/L/XL)
4. Estimate revenue ranges
5. Prioritize by pain and revenue
6. Write summaries

### Estimated Effort (AI-Assisted)

- All assessments: 15-25 min

> Only run if `salesOpportunities.includeInReport` is true in client config.

---

## Quality Checklist

Before finalizing the assessment, verify:

- [ ] All phases completed
- [ ] All outputs saved with correct naming
- [ ] Evidence provided for all findings
- [ ] Severity ratings justified
- [ ] Recommendations prioritized
- [ ] Executive summary is business-readable
- [ ] No confidential data exposed inappropriately
- [ ] Report follows template structure
