# Current State Assessment Report Template

Use this template to generate the final deliverable for Azure Integration Services assessments.

**Save the final report to**: `/output/{client-name}/{YYYY-MM-DD}/reports/current-state-assessment.md`

---

# Azure Integration Services

# Current State Assessment Report

**Client**: {CLIENT_NAME}

**Engagement**: Azure Integration Environment Assessment

**Date**: {DATE}

**Prepared by**: Contica

**Version**: 1.0

---

## Document Control

| Version | Date   | Author  | Changes            |
| ------- | ------ | ------- | ------------------ |
| 1.0     | {DATE} | Contica | Initial assessment |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope & Methodology](#2-scope--methodology)
3. [Environment Overview](#3-environment-overview)
4. [Integration Flows Summary](#4-integration-flows-summary)
5. [Security Assessment](#5-security-assessment)
6. [Operational Health](#6-operational-health)
7. [Technical Debt & Dead Flows](#7-technical-debt--dead-flows)
8. [Recommendations](#8-recommendations)
9. [Appendix](#9-appendix)
10. [Sales Opportunities](#10-sales-opportunities) _(Internal Only)_

---

## 1. Executive Summary

{Write 2-3 paragraphs in business language summarizing:}

### Overview

{Brief description of the client's integration environment and its purpose. What business processes does it support?}

### Key Findings

{Summarize the most important findings across security, operations, and architecture. Use business impact language, not technical jargon.}

### Top Recommendations

{List the top 3-5 recommendations with expected business value.}

| Priority | Recommendation   | Business Impact |
| -------- | ---------------- | --------------- |
| 1        | {recommendation} | {impact}        |
| 2        | {recommendation} | {impact}        |
| 3        | {recommendation} | {impact}        |

---

## 2. Scope & Methodology

### 2.1 Assessment Scope

| Item                 | Value                    |
| -------------------- | ------------------------ |
| Subscription(s)      | {subscription names/IDs} |
| Resource Groups      | {list or "all"}          |
| Exclusions           | {any excluded resources} |
| Assessment Period    | {date range}             |
| Run History Analysis | {X} days                 |

### 2.2 Methodology

This assessment followed Contica's 10-phase methodology. Check `selectedPhases` in client config to determine which phases were executed.

| Phase | Name                           | Status                                               |
| ----- | ------------------------------ | ---------------------------------------------------- |
| 0     | Preflight Validation           | {Always executed}                                    |
| 1     | Discovery                      | {Always executed}                                    |
| 2     | Integration Services Deep Dive | {Executed / Skipped — check selectedPhases}          |
| 3     | Failure Analysis               | {Executed / Skipped — check selectedPhases}          |
| 4     | Security Audit                 | {Executed / Skipped — check selectedPhases}          |
| 5     | Dead Flow Detection            | {Executed / Skipped — check selectedPhases}          |
| 6     | Monitoring Gaps                | {Executed / Skipped — check selectedPhases}          |
| 7     | Naming & Tagging               | {Executed / Skipped — check selectedPhases}          |
| 8     | Report Generation              | {Always executed if any analysis phase ran}          |
| 9     | Sales Opportunities            | {Executed / Skipped — check selectedPhases + config} |

**Preset Used**: {Full Assessment / Security Focus / Quick Health Check / Compliance Review / Custom}

If `selectedPhases` does not exist in the config, assume all phases were run (backward compatible).

### 2.3 Evaluation Standards

Findings were evaluated against Contica's Single Source of Truth (SSOT) standards:

| Standard              | Purpose                                    |
| --------------------- | ------------------------------------------ |
| Baseline Levels       | Helium compliance levels by resource type  |
| Authentication Matrix | Required authentication methods            |
| Network Security      | Standard vs Advanced security options      |
| Required Tiers        | Minimum resource tiers per security option |
| Naming Convention     | Naming patterns and required tags          |
| Azure Policies        | Required policy assignments                |

Additionally, findings were cross-referenced with:

- **Azure Cloud Adoption Framework (CAF)** — Microsoft's governance and security baselines
- **Azure Well-Architected Framework (WAF)** — Security, operational excellence pillars

CAF/WAF guidance is presented as supplementary "Microsoft Recommendation" tips alongside SSOT findings.

### 2.4 Tools Used

- Azure MCP Server — Resource discovery and configuration analysis
- Azure CLI / REST API — Logic Apps workflow definitions and run history
- Azure Resource Graph — KQL queries for bulk analysis
- Microsoft Docs MCP — Azure CAF/WAF best practices and security baselines
- Atlassian MCP — Contica SSOT standards from Confluence (if configured)
- Azure DevOps MCP Server — Work item cross-reference (if applicable)

### 2.5 Limitations

{Document any limitations encountered:}

- Access restrictions
- Data unavailable
- Scope boundaries
- Time constraints

---

## 3. Environment Overview

### 3.1 Resource Summary

| Resource Type            | Count | Notes |
| ------------------------ | ----- | ----- |
| Logic Apps (Consumption) | {n}   |       |
| Logic Apps (Standard)    | {n}   |       |
| Service Bus Namespaces   | {n}   |       |
| Service Bus Queues       | {n}   |       |
| Service Bus Topics       | {n}   |       |
| API Management           | {n}   |       |
| Function Apps            | {n}   |       |
| Key Vaults               | {n}   |       |
| Storage Accounts         | {n}   |       |
| App Configuration        | {n}   |       |
| Event Grid Topics        | {n}   |       |
| Event Hubs               | {n}   |       |
| **Total**                | {n}   |       |

### 3.2 Geographic Distribution

| Region   | Resource Count | Primary Use   |
| -------- | -------------- | ------------- |
| {region} | {n}            | {description} |

### 3.3 Resource Group Structure

| Resource Group | Purpose   | Resources |
| -------------- | --------- | --------- |
| {rg-name}      | {purpose} | {count}   |

### 3.4 Architecture Overview

{Describe the high-level architecture. Include:}

- Primary integration patterns (pub/sub, request/reply, file transfer)
- External system connections
- Internal service dependencies
- Data flow directions

{If a diagram would be helpful, describe what it would show:}

```
[Diagram Description]
- External systems on the left
- Integration layer (Logic Apps, APIM, Service Bus) in the center
- Internal systems on the right
- Key data flows indicated
```

---

## 4. Integration Flows Summary

<!-- Phase 2: integration-services-deep-dive -->
<!-- If Phase 2 was not selected, replace this entire section with: -->
<!-- "*Integration Services Deep Dive was not included in this assessment scope.*" -->

### 4.1 Logic Apps Overview

| Category                      | Count | Percentage |
| ----------------------------- | ----- | ---------- |
| Active (runs in last 30 days) | {n}   | {%}        |
| Inactive (no runs in 30 days) | {n}   | {%}        |
| Disabled                      | {n}   | {%}        |
| **Total**                     | {n}   | 100%       |

### 4.2 Trigger Types

| Trigger Type | Count | Examples        |
| ------------ | ----- | --------------- |
| HTTP/Webhook | {n}   | {example names} |
| Recurrence   | {n}   | {example names} |
| Service Bus  | {n}   | {example names} |
| Event Grid   | {n}   | {example names} |
| Blob Storage | {n}   | {example names} |
| Other        | {n}   | {example names} |

### 4.3 Connector Usage

| Connector        | Usage Count | Authentication Method |
| ---------------- | ----------- | --------------------- |
| {connector name} | {n}         | {MI/SAS/OAuth/etc}    |

### 4.4 Complexity Distribution

| Complexity | Criteria      | Count |
| ---------- | ------------- | ----- |
| Simple     | < 10 actions  | {n}   |
| Medium     | 10-30 actions | {n}   |
| Complex    | > 30 actions  | {n}   |

### 4.5 Service Bus Summary

| Namespace | SKU                      | Queues | Topics | DLQ Messages | Notes   |
| --------- | ------------------------ | ------ | ------ | ------------ | ------- |
| {name}    | {Basic/Standard/Premium} | {n}    | {n}    | {n}          | {notes} |

### 4.6 Function Apps Summary

| Function App | Runtime              | Plan                  | Functions | State             | Trigger Types              |
| ------------ | -------------------- | --------------------- | --------- | ----------------- | -------------------------- |
| {name}       | {dotnet/node/python} | {Consumption/Premium} | {n}       | {Running/Stopped} | {HTTP, Timer, Queue, etc.} |

### 4.7 API Management Summary

| Instance | SKU                          | APIs | Products | Developer Portal   | VNet Mode                |
| -------- | ---------------------------- | ---- | -------- | ------------------ | ------------------------ |
| {name}   | {Developer/Standard/Premium} | {n}  | {n}      | {Enabled/Disabled} | {None/External/Internal} |

### 4.8 Event-Driven Services Summary

| Resource | Type                | Config Summary              | Notes   |
| -------- | ------------------- | --------------------------- | ------- |
| {name}   | Event Grid Topic    | {n} subscriptions, {schema} | {notes} |
| {name}   | Event Hub Namespace | {n} hubs, {SKU}, {TU} TUs   | {notes} |

### 4.9 Supporting Services Summary

| Resource | Type              | Key Config                        | Integration Role                       |
| -------- | ----------------- | --------------------------------- | -------------------------------------- |
| {name}   | Key Vault         | {RBAC/Access Policy}, {n} secrets | Secrets management                     |
| {name}   | Storage Account   | {SKU}, {access tier}              | {Logic App state / diagnostics / data} |
| {name}   | App Configuration | {SKU}, {n} keys                   | Configuration management               |

---

## 5. Security Assessment

<!-- Phase 4: security -->
<!-- If Phase 4 was not selected, replace this entire section with: -->
<!-- "*Security Audit was not included in this assessment scope.*" -->

### 5.1 Security Posture Summary

| Category                       | Score  | Status       |
| ------------------------------ | ------ | ------------ |
| Authentication & Authorization | {X}/10 | {⬤⬤⬤◯◯◯◯◯◯◯} |
| Network Security               | {X}/10 | {⬤⬤⬤⬤⬤◯◯◯◯◯} |
| Data Protection                | {X}/10 | {⬤⬤⬤⬤⬤⬤⬤◯◯◯} |
| Secrets Management             | {X}/10 | {⬤⬤⬤⬤◯◯◯◯◯◯} |
| Monitoring & Auditing          | {X}/10 | {⬤⬤⬤⬤⬤⬤◯◯◯◯} |
| **Overall**                    | {X}/50 |              |

### 5.2 Security Findings

| ID      | Severity | Finding   | Affected Resources | Recommendation |
| ------- | -------- | --------- | ------------------ | -------------- |
| SEC-001 | HIGH     | {finding} | {resource list}    | {remediation}  |
| SEC-002 | MEDIUM   | {finding} | {resource list}    | {remediation}  |

### 5.3 High Severity Details

#### SEC-001: {Finding Title}

**Finding**: {Detailed description of the security issue}

**Evidence**:

- {Specific resource name}
- {Configuration detail}
- {Screenshot/log reference if applicable}

**Risk**: {Explain the potential impact}

**Remediation**:

1. {Step 1}
2. {Step 2}

**Effort**: {Low/Medium/High}

---

## 6. Operational Health

<!-- Phase 3: failure-patterns (sections 6.1-6.6) -->
<!-- Phase 6: monitoring-gaps (section 6.7) -->
<!-- If Phase 3 was not selected, replace sections 6.1-6.6 with: "*Failure Analysis was not included in this assessment scope.*" -->
<!-- If Phase 6 was not selected, replace section 6.7 with: "*Monitoring & Observability Gaps was not included in this assessment scope.*" -->

### 6.1 Run History Summary

| Metric                     | Value     |
| -------------------------- | --------- |
| Total Runs (last {X} days) | {n}       |
| Successful Runs            | {n} ({%}) |
| Failed Runs                | {n} ({%}) |
| Average Daily Runs         | {n}       |

### 6.2 Failure Analysis

#### Top Failing Logic Apps

| Rank | Logic App | Failures | Failure Rate | Primary Error |
| ---- | --------- | -------- | ------------ | ------------- |
| 1    | {name}    | {n}      | {%}          | {error type}  |
| 2    | {name}    | {n}      | {%}          | {error type}  |
| 3    | {name}    | {n}      | {%}          | {error type}  |

#### Error Categories

| Error Category          | Count | Percentage | Primary Cause |
| ----------------------- | ----- | ---------- | ------------- |
| Connection failures     | {n}   | {%}        | {cause}       |
| Timeout errors          | {n}   | {%}        | {cause}       |
| Authentication errors   | {n}   | {%}        | {cause}       |
| Data validation errors  | {n}   | {%}        | {cause}       |
| External service errors | {n}   | {%}        | {cause}       |

#### Failure Trends

{Describe whether failures are increasing, decreasing, or stable. Note any patterns (time of day, day of week).}

### 6.3 Service Bus Health

| Namespace | Entity   | Type                 | Active Msgs | DLQ Msgs | Server Errors | Throttled |
| --------- | -------- | -------------------- | ----------- | -------- | ------------- | --------- |
| {name}    | {entity} | {Queue/Subscription} | {n}         | {n}      | {n}           | {n}       |

{Summary of Service Bus health findings — DLQ buildup causes, throttling issues, capacity concerns.}

### 6.4 Function App Health

| Function App | Invocations (30d) | Http 5xx | Http 4xx | Error Rate | Top Error  |
| ------------ | ----------------- | -------- | -------- | ---------- | ---------- |
| {name}       | {n}               | {n}      | {n}      | {%}        | {category} |

{Summary of Function App error patterns — timeouts, dependency failures, cold start issues.}

### 6.5 API Management Health

| Instance | Total Requests (30d) | Failed | Unauthorized | Error Rate | Capacity Avg |
| -------- | -------------------- | ------ | ------------ | ---------- | ------------ |
| {name}   | {n}                  | {n}    | {n}          | {%}        | {%}          |

{Summary of APIM health — backend errors, rate limiting, capacity.}

### 6.6 Cross-Resource Correlations

{Description of failure cascades between connected resources. E.g., Service Bus DLQ buildup correlated with Logic App failures, APIM backend errors correlated with Function App 5xx.}

### 6.7 Monitoring Coverage

| Metric                             | Coverage          | Gap          |
| ---------------------------------- | ----------------- | ------------ |
| Resources with Diagnostic Settings | {n}/{total} ({%}) | {n} missing  |
| Resources in Log Analytics         | {n}/{total} ({%}) | {n} missing  |
| Alert Rules Configured             | {n}               | {assessment} |
| Dashboards Available               | {n}               | {assessment} |

#### Resources Missing Monitoring

| Resource | Type   | Missing             |
| -------- | ------ | ------------------- |
| {name}   | {type} | Diagnostic settings |

---

## 7. Technical Debt & Unused Resources

<!-- Phase 5: dead-flows -->
<!-- Phase 7: naming-tagging (contributes to technical debt items) -->
<!-- If Phase 5 was not selected, replace sections 7.1-7.5 with: "*Unused Resource Detection was not included in this assessment scope.*" -->
<!-- If Phase 7 was not selected, omit naming/tagging debt items from section 7.6 -->

### 7.1 Unused Resource Summary

| Resource Type        | Total | Active | Unused Candidates | Est. Monthly Savings |
| -------------------- | ----- | ------ | ----------------- | -------------------- |
| Logic Apps           | {n}   | {n}    | {n}               | {estimate}           |
| Service Bus Entities | {n}   | {n}    | {n}               | {estimate}           |
| Function Apps        | {n}   | {n}    | {n}               | {estimate}           |
| APIM APIs            | {n}   | {n}    | {n}               | {estimate}           |
| Key Vaults           | {n}   | {n}    | {n}               | {estimate}           |
| Storage Accounts     | {n}   | {n}    | {n}               | {estimate}           |
| Event Grid/Hub       | {n}   | {n}    | {n}               | {estimate}           |
| **Total**            | {n}   | {n}    | {n}               | **{total}**          |

### 7.2 Dead Logic Apps

| Logic App | Last Run | Last Success | State              | Recommendation |
| --------- | -------- | ------------ | ------------------ | -------------- |
| {name}    | {date}   | {date}       | {enabled/disabled} | {action}       |

### 7.3 Unused Service Bus Entities

| Namespace | Entity   | Type          | Messages (90d) | Recommendation |
| --------- | -------- | ------------- | -------------- | -------------- |
| {name}    | {entity} | {Queue/Topic} | 0              | {action}       |

### 7.4 Unused Function Apps & APIs

| Resource | Type         | Activity (90d) | State             | Recommendation |
| -------- | ------------ | -------------- | ----------------- | -------------- |
| {name}   | Function App | 0 invocations  | {Running/Stopped} | {action}       |
| {name}   | APIM API     | 0 requests     | —                 | {action}       |

### 7.5 Other Unused Resources

| Resource | Type                                                | Activity (90d) | Recommendation |
| -------- | --------------------------------------------------- | -------------- | -------------- |
| {name}   | {Key Vault/Storage/Event Grid/Event Hub/App Config} | {metric}       | {action}       |

### 7.6 Technical Debt Items

| Item        | Impact   | Effort to Fix  | Priority |
| ----------- | -------- | -------------- | -------- |
| {debt item} | {impact} | {Low/Med/High} | {1-5}    |

---

## 8. Recommendations

### 8.1 Prioritization Framework

| Priority     | Criteria                                                |
| ------------ | ------------------------------------------------------- |
| **Critical** | Security risk, compliance violation, operational impact |
| **High**     | Best practice violation, efficiency impact              |
| **Medium**   | Improvement opportunity, technical debt                 |
| **Low**      | Nice to have, minor improvement                         |

### 8.2 Quick Wins (< 1 week effort)

| #   | Recommendation   | Category   | Effort | Impact   |
| --- | ---------------- | ---------- | ------ | -------- |
| 1   | {recommendation} | {category} | {days} | {impact} |

### 8.3 Medium-Term (1-4 weeks effort)

| #   | Recommendation   | Category   | Effort  | Impact   |
| --- | ---------------- | ---------- | ------- | -------- |
| 1   | {recommendation} | {category} | {weeks} | {impact} |

### 8.4 Strategic (> 1 month effort)

| #   | Recommendation   | Category   | Effort   | Impact   |
| --- | ---------------- | ---------- | -------- | -------- |
| 1   | {recommendation} | {category} | {months} | {impact} |

### 8.5 Recommended Roadmap

```
Month 1: Quick Wins + Critical Security Fixes
- [ ] {item}
- [ ] {item}

Month 2-3: Medium-Term Improvements
- [ ] {item}
- [ ] {item}

Month 4+: Strategic Initiatives
- [ ] {item}
- [ ] {item}
```

---

## 9. Appendix

### A. Detailed Resource Inventory

{Reference to inventory JSON file}

See: `/output/{client-name}/{YYYY-MM-DD}/inventory/resources.json`

### B. Logic App Analysis Details

{Reference to per-Logic-App analysis}

See: `/output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/`

### C. Full Security Checklist Results

{Reference to detailed security findings}

See: `/output/{client-name}/{YYYY-MM-DD}/analysis/security-audit.md`

### D. KQL Queries Used

{List the Resource Graph queries used}

| Query                     | File                            | Purpose        |
| ------------------------- | ------------------------------- | -------------- |
| All Integration Resources | `all-integration-resources.kql` | Discovery      |
| Security Posture          | `security-posture.kql`          | Security audit |
| Monitoring Coverage       | `monitoring-coverage.kql`       | Gap analysis   |

### E. Glossary

| Term             | Definition                                        |
| ---------------- | ------------------------------------------------- |
| Logic App        | Azure's serverless workflow orchestration service |
| Service Bus      | Enterprise messaging service                      |
| APIM             | Azure API Management                              |
| DLQ              | Dead-letter queue                                 |
| Managed Identity | Azure AD identity for Azure resources             |

---

## 10. Sales Opportunities

> **⚠️ INTERNAL ONLY** — This section is for Contica internal use. Remove before delivering to client unless explicitly requested.

_Include this section only if `salesOpportunities.includeInReport == true` in client config._

### 10.1 Opportunity Summary

| #   | Opportunity         | Category   | Size    | Revenue Range            | Confidence     |
| --- | ------------------- | ---------- | ------- | ------------------------ | -------------- |
| 1   | {opportunity_title} | {category} | {S/M/L} | {currency} {min} - {max} | {HIGH/MED/LOW} |

**Total Estimated Revenue**: {currency} {total_min} - {total_max}

### 10.2 Top Priority Opportunities

#### Opportunity 1: {Title}

**Category**: {Security / Operational Excellence / Technical Debt / Cost Optimization}

**Problem**:
{Client-friendly description of the issue}

**Evidence from Assessment**:

- {Finding 1 with specific resource}
- {Finding 2}

**Proposed Solution**:
{What Contica will deliver}

**Business Value**:

- {Benefit 1}
- {Benefit 2}

**Estimate**: {Size} | {Days} days | {Currency} {min} - {max}

---

### 10.3 All Opportunities by Category

#### Security & Compliance Remediation

| Finding | Opportunity | Size | Revenue |
| ------- | ----------- | ---- | ------- |

#### Operational Excellence

| Finding | Opportunity | Size | Revenue |
| ------- | ----------- | ---- | ------- |

#### Technical Debt Reduction

| Finding | Opportunity | Size | Revenue |
| ------- | ----------- | ---- | ------- |

#### Cost Optimization

| Finding | Opportunity | Size | Revenue |
| ------- | ----------- | ---- | ------- |

### 10.4 Next Steps

1. {Immediate action for account manager}
2. {Follow-up meeting to discuss priorities}
3. {SOW/Proposal creation for top opportunities}

---

**Sales Contact**: {account_manager}

**Full Opportunity Details**: See `/output/{client-name}/{YYYY-MM-DD}/reports/improvement-opportunities.md`

---

## Document End

**Prepared by**: Contica Integration Assessment Agent

**Date**: {DATE}

**Contact**: {Contica contact information}

---

_This document is confidential and intended for {CLIENT_NAME} use only._
