# Phase 7: Naming & Tagging Compliance

## Objective
Evaluate adherence to naming conventions and tagging strategies across all integration resources.

---

## Output Location

Read the client name from the active client config.
All outputs for this phase go to: `/output/{client-name}/{YYYY-MM-DD}/analysis/`
The folder should already exist from Phase 0.

---

## Prerequisites

Before running this prompt:
1. Phases 1-6 must be complete
2. Have the inventory available from `/output/{client-name}/{YYYY-MM-DD}/inventory/`
3. **Primary**: Read `/standards/contica-ssot/naming-convention.md` for Contica naming standards
4. Check if client has custom patterns in `customChecks.namingConventionPattern` field
5. **Secondary**: Reference `/methodology/best-practices.md` for additional guidance
6. **Use Microsoft Docs MCP** to fetch Azure CAF naming and tagging guidance:
   - Search: "Azure Cloud Adoption Framework naming conventions"
   - Search: "Azure Cloud Adoption Framework resource tagging strategy"
   - Include CAF links as supporting tips alongside SSOT findings

---

## Prompt

```
I need to perform Phase 7: Naming & Tagging Compliance analysis for the Azure Integration Services assessment.

### Step 1: Naming Convention Analysis

For each resource in the inventory, analyze the naming pattern:

**Reference**: Load naming patterns from `/standards/contica-ssot/naming-convention.md`

The SSOT defines abbreviations and patterns for each resource type:
| Resource Type | Abbreviation | Pattern Example |
|---------------|--------------|------------------|
| Resource Group | `rg` | rg-{workload}-{env}-{region} |
| Logic App (Consumption) | `logic` | logic-{workload}-{function} |
| Logic App (Standard) | `logicapp` | logicapp-{workload}-{env} |
| Function App | `func` | func-{workload}-{function} |
| Service Bus Namespace | `sbns` | sbns-{workload}-{env} |
| Service Bus Queue | `sbq` | sbq-{function} |
| Service Bus Topic | `sbt` | sbt-{domain} |
| Key Vault | `kv` | kv-{workload}-{env} |
| Storage Account | `st` | st{workload}{env}{unique} |
| API Management | `apim` | apim-{workload}-{env} |
| App Configuration | `appcs` | appcs-{workload}-{env} |

**Note**: Storage accounts have special rules (lowercase, no hyphens, 3-24 chars).

**Analyze against SSOT standards**:
1. Does the name use the correct abbreviation prefix?
2. Is the environment identifiable? (dev/test/staging/prod)
3. Is the purpose/function clear from the name?
4. Is there consistency across related resources?
5. Are there cryptic or numeric-only names?

### Step 2: Pattern Detection

Group resources by detected naming patterns:

1. **Well-Named**: Clear pattern, environment, purpose
2. **Partially Compliant**: Some elements present
3. **Non-Compliant**: No clear pattern, cryptic names
4. **Inconsistent**: Mixed patterns in same resource group

### Step 3: Tagging Analysis

**Required Tags** (from `/standards/contica-ssot/naming-convention.md`):
| Tag | Purpose | Expected Values |
|-----|---------|------------------|
| `environment` | Deployment stage | dev, test, staging, prod |
| `owner` | Responsible party | team name or email |
| `cost-center` | Cost allocation | CC code |
| `project` | Project/application | project name |

**Optional but Recommended**:
| Tag | Purpose |
|-----|----------|
| `created-by` | Deployment method (terraform, arm, manual) |
| `created-date` | Creation timestamp |
| `data-classification` | Data sensitivity level |

**For each resource, check**:
1. Which required tags are present?
2. Which are missing?
3. Are tag values consistent? (e.g., "prod" vs "production")

### Step 4: Tag Coverage Statistics

Calculate:
- Overall tag coverage (% of resources with all required tags)
- Per-tag coverage (% for each required tag)
- Per-resource-type coverage
- Per-resource-group coverage

### Step 5: Azure CAF / WAF Alignment

Use Microsoft Docs MCP to cross-reference naming and tagging findings with Microsoft guidance:
- Search: "Azure CAF naming conventions for resources"
- Search: "Azure CAF tagging strategy best practices"
- Search: "Azure CAF abbreviation examples for resource types"
- For each finding, include a **"Microsoft Recommendation"** tip with the relevant CAF guidance
- Note where Contica SSOT naming convention aligns with or extends beyond CAF

**Important**: CAF/WAF guidance supplements SSOT — it does not replace it.

### Step 6: Identify Inconsistencies

Look for:
- Same tag with different values (prod/production/PROD)
- Same resource type with different naming patterns
- Resources missing owner information
- Cost attribution gaps

### Output Requirements

Save compliance report:
`/output/{client-name}/{YYYY-MM-DD}/analysis/naming-tagging.md`

Structure:
```markdown
# Naming & Tagging Compliance Report

**Date**: {date}

## Summary

### Naming Compliance
| Rating | Count | Percentage |
|--------|-------|------------|
| Well-Named | {n} | {%} |
| Partially Compliant | {n} | {%} |
| Non-Compliant | {n} | {%} |

### Tag Coverage
| Metric | Value |
|--------|-------|
| Resources with ALL required tags | {n} ({%}) |
| Resources with NO tags | {n} ({%}) |
| Average tags per resource | {n} |

## Naming Analysis

### Pattern Compliance by Resource Type

| Resource Type | Total | Compliant | Partial | Non-Compliant |
|---------------|-------|-----------|---------|---------------|
| Logic Apps | {n} | {n} | {n} | {n} |
| Service Bus | {n} | {n} | {n} | {n} |
| Key Vault | {n} | {n} | {n} | {n} |

### Naming Issues Identified

#### Non-Compliant Names

| Resource | Type | Current Name | Issue | Suggested Name |
|----------|------|--------------|-------|----------------|
| {id} | Logic App | logic1 | Cryptic, no context | logic-{purpose}-{env} |
| {id} | Service Bus | test123 | Numeric, unclear | sb-{workload}-{env} |

#### Inconsistent Patterns

| Resource Group | Pattern A | Pattern B | Resources |
|----------------|-----------|-----------|-----------|
| rg-integration | logic-xxx-yyy | la-xxx | 10 vs 3 |

## Tagging Analysis

### Tag Coverage by Tag

| Tag | Present | Missing | Coverage |
|-----|---------|---------|----------|
| environment | {n} | {n} | {%} |
| owner | {n} | {n} | {%} |
| cost-center | {n} | {n} | {%} |
| project | {n} | {n} | {%} |
| created-by | {n} | {n} | {%} |

### Resources Missing Required Tags

| Resource | Type | Missing Tags |
|----------|------|--------------|
| {name} | Logic App | owner, cost-center |

### Tag Value Inconsistencies

| Tag | Values Found | Recommended |
|-----|--------------|-------------|
| environment | prod, production, PROD, Production | prod |
| owner | team-a, Team A, teama | team-a |

## Impact Assessment

### Cost Attribution
- Resources without cost-center tag: {n}
- Estimated unattributed spend: Cannot calculate costs

### Ownership Gaps
- Resources without owner tag: {n}
- Risk: No accountability for incidents

### Environment Clarity
- Resources without environment tag: {n}
- Risk: Accidental production changes

## Recommendations

### High Priority

1. **Standardize tag values**
   - Define allowed values in Azure Policy
   - Environment: dev, test, staging, prod
   - Implement tag inheritance

2. **Add missing owner tags**
   - {n} resources need owner
   - Default to resource group owner if unknown

### Medium Priority

1. **Rename non-compliant resources**
   - Requires redeployment for some resources
   - Plan migration for: {list}

2. **Implement Azure Policy**
   - Require tags on create
   - Audit existing resources

### Low Priority

1. **Create naming convention documentation**
2. **Add created-by automation tagging**

## Compliance Checklist for New Resources

- [ ] Name follows pattern: `{type}-{workload}-{function}-{env}`
- [ ] Has `environment` tag
- [ ] Has `owner` tag
- [ ] Has `cost-center` tag
- [ ] Has `project` tag
- [ ] Matches existing resources in same group
```
```

---

## Tool Usage Reference

| Operation | Primary (MCP) | Fallback (CLI) |
|-----------|---------------|----------------|
| Resource metadata | Azure MCP | `az resource list` |
| Tags | Azure MCP | `az resource show --query tags` |
| Tag policy compliance | Azure MCP | `az policy state list` |

**MCP-First Rule**: Use Azure MCP as primary tool for resource metadata and tag queries. Fall back to CLI if MCP fails.

---

## KQL Query for Tag Analysis

```kql
// See /scripts/resource-graph-queries/tagging-compliance.kql
resources
| where type in~ (
    'microsoft.logic/workflows',
    'microsoft.servicebus/namespaces',
    'microsoft.keyvault/vaults'
)
| extend 
    hasEnvironment = isnotnull(tags.environment),
    hasOwner = isnotnull(tags.owner),
    hasCostCenter = isnotnull(tags['cost-center']),
    hasProject = isnotnull(tags.project)
| summarize 
    total = count(),
    withEnv = countif(hasEnvironment),
    withOwner = countif(hasOwner),
    withCost = countif(hasCostCenter),
    withProject = countif(hasProject)
    by type
```

---

## Success Criteria

- [ ] All resources analyzed for naming compliance
- [ ] Tag coverage calculated
- [ ] Inconsistencies identified
- [ ] Recommendations prioritized
- [ ] Report saved
- [ ] Ready for Phase 8
