# Start Here - Pure Chat-Based Assessment Tool

**Welcome!** This tool runs **100% through VS Code Copilot Chat**. Zero terminal commands required - just copy/paste prompts and the agent does everything.

---

## 🚀 Complete Setup & Assessment (Pure Chat)

### Step 1: Open VS Code Copilot Chat

Press `Ctrl+Shift+I` (or `Cmd+Shift+I` on Mac)

**Make sure `@workspace` is enabled** at the bottom of the chat input.

---

### Step 2: One-Prompt Setup (First Time Only)

Copy and paste this entire prompt:

```
Set up my Azure assessment environment from scratch:

PHASE 1: DEPENDENCIES
1. Install Node.js dependencies by running: npm install
2. Wait for it to complete and confirm success

PHASE 2: AZURE ACCOUNT VERIFICATION
3. Check my current Azure CLI session by running: az account show --output json
4. Show me which account I'm currently logged in as (display: user name, tenant ID, subscription name)
5. Ask me: "Do you want to continue with this account, or log in to a different account/tenant?"
   - If I want to switch: run "az login" and let me authenticate, then show the new account details
   - If I want to continue: proceed to the next phase
   - If I'm not logged in at all: run "az login" first
6. Run: az account list --output table
7. Show me ALL subscriptions I have access to as a numbered list (every single one, not grouped)
8. Ask me to select which subscriptions to include in the assessment (let me pick individual ones or all)

PHASE 3: SERVICE PRINCIPAL (OPTIONAL)
9. Ask me: "Do you want to use a service principal, or continue with Azure CLI authentication?"
   - If service principal: ask me for Tenant ID, Client ID, Client Secret (or help me create one)
   - If Azure CLI: skip service principal setup and use the current az login session
10. Ask me for my company/client name (e.g., "contoso-corp")

PHASE 4: CONFIGURATION
11. Create the client configuration file at: clients/{client-name}/config.json
    - Use the template from clients/_template/config.json
    - Fill in the authentication method (service-principal or azure-cli) and client name
    - Add the subscriptions I selected in Phase 2
    - Set assessmentDate to today

12. If using service principal: Create a PowerShell script (for Windows) at: set-env-vars.ps1
    - Contains commands to set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
    - Tell me to run this script

13. If using service principal: Create a bash script (for Mac/Linux) at: set-env-vars.sh
    - Contains export commands for the same variables

PHASE 5: VALIDATION
14. Run the validation script to test credentials: node scripts/credential-helper.js validate
15. If validation fails, help me troubleshoot
16. If validation succeeds, show me:
    - ✓ Authentication method (service principal or Azure CLI)
    - ✓ Tenant ID confirmed
    - ✓ Number of subscriptions accessible
    - ✓ Access level confirmed

PHASE 6: MCP CHECK
17. Check my MCP configuration: node scripts/check-mcp-config.js
18. Verify I have:
    - Azure MCP (required)
    - Atlassian MCP (required)
    - Microsoft Docs MCP (optional)
19. If any are missing, show me how to install them in VS Code

PHASE 7: READY
20. Create the output folder structure under a date subfolder: output/{client-name}/{YYYY-MM-DD}/inventory/, output/{client-name}/{YYYY-MM-DD}/analysis/, output/{client-name}/{YYYY-MM-DD}/analysis/logic-apps/, output/{client-name}/{YYYY-MM-DD}/reports/
21. Tell me I'm ready and show me the next prompt to run the assessment

Execute all of this automatically. Ask me questions when you need input, but do all the file creation, script execution, and validation yourself.
```

**The agent will now:**
- ✅ Install dependencies
- ✅ Check your current Azure CLI account and ask if you want to switch
- ✅ List ALL your subscriptions and let you pick which to assess
- ✅ Let you choose: service principal or Azure CLI authentication
- ✅ Create all configuration files
- ✅ Validate everything works
- ✅ Tell you what to do next

**Important**: If using a service principal, the agent creates `set-env-vars.ps1` — you'll need to run it once:
```powershell
.\set-env-vars.ps1
```

(If using Azure CLI authentication, no environment variable scripts are needed)

---

### Step 3: Sync SSOT Standards from Confluence

Copy and paste this prompt:

```
Use Atlassian MCP to fetch all SSOT standards from Confluence:

1. Connect to Confluence space "TSSOTAI"

2. Fetch these 8 pages and save them as markdown in /standards/contica-ssot/:
   - "Baseline Levels" → baseline-levels.md
   - "Authentication Matrix" → authentication-matrix.md
   - "Network Security" → network-security.md
   - "Required Tiers" → required-tiers.md
   - "Naming Convention" → naming-convention.md
   - "Azure Policies" → azure-policies.md
   - "Known Exceptions" → known-exceptions.md
   - "Opportunity Categories" → opportunity-categories.md

3. For each page:
   - Search for it by exact title in space TSSOTAI
   - Get the page content in markdown format
   - Save to the specified file path
   - Preserve all formatting, tables, and code blocks

4. After syncing, show me:
   - ✓ Which pages were synced successfully
   - ⚠ Which pages had issues (if any)
   - Summary of what changed from the previous version (if it exists)

If Atlassian MCP is not available, use the local SSOT files and warn me they might be outdated.
```

---

### Step 4: Run Complete Assessment

Copy and paste this prompt (replace `my-company-name` with your client folder name from `clients/` and update the date):

**Important**: The client name you use here must match your folder name under `clients/`. For example, if your config is at `clients/acme-corp/config.json`, use `acme-corp` everywhere below.

```
Execute the complete Azure Integration Services assessment for client "my-company-name":

IMPORTANT: Use dated folder structure!
Assessment Date: 2026-02-10
Output Location: output/my-company-name/2026-02-10/

═══════════════════════════════════════════
PRE-FLIGHT CHECKS
═══════════════════════════════════════════

1. Verify client configuration exists: clients/my-company-name/config.json
2. Verify environment variables are set (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
3. Verify SSOT standards are present in /standards/contica-ssot/
4. Create dated output folder: output/my-company-name/2026-02-10/
5. Create subfolders: inventory/, analysis/, analysis/logic-apps/, reports/
6. Check MCP server connectivity (Azure MCP, Atlassian MCP, Microsoft Docs MCP)

═══════════════════════════════════════════
PHASE 0: PREFLIGHT VALIDATION
═══════════════════════════════════════════

7. Read /prompts/00-preflight.md
8. Execute all preflight checks:
   - Azure CLI status
   - Client config validation
   - MCP servers available
   - Azure permissions verified
   - SSOT standards present
   - Dated output folder created

9. Save results to: output/my-company-name/2026-02-10/analysis/preflight-validation.md

═══════════════════════════════════════════
PHASE 1: RESOURCE DISCOVERY
═══════════════════════════════════════════

10. Read /prompts/01-inventory.md
11. Use Azure MCP to discover all integration resources:
    - Logic Apps (Consumption and Standard)
    - Service Bus Namespaces (queues, topics, subscriptions)
    - API Management instances
    - Function Apps
    - Key Vaults
    - Storage Accounts
    - App Configuration stores
    - Event Grid topics
    - Event Hubs

12. Save inventory to:
    - output/my-company-name/2026-02-10/inventory/resources.json (full details)
    - output/my-company-name/2026-02-10/inventory/summary.md (human-readable)

═══════════════════════════════════════════
PHASE 2: INTEGRATION SERVICES DEEP DIVE
═══════════════════════════════════════════

13. Read /prompts/02-logic-apps-deep-dive.md
14. For EACH integration resource type, perform deep analysis:

    Logic Apps:
    - Extract workflow definitions, connectors, error handling, dependencies
    - Save per-Logic-App: output/my-company-name/2026-02-10/analysis/logic-apps/{name}.md

    Service Bus:
    - Namespace config, queues, topics, subscriptions, DLQ settings, forwarding
    - Save: output/my-company-name/2026-02-10/analysis/service-bus-analysis.md

    Function Apps:
    - Runtime stack, functions inventory, app settings (scan for secrets), scaling
    - Save: output/my-company-name/2026-02-10/analysis/function-apps-analysis.md

    API Management:
    - APIs, policies, products/subscriptions, backends, developer portal
    - Save: output/my-company-name/2026-02-10/analysis/apim-analysis.md

    Supporting Services (Key Vault, Storage, Event Grid, Event Hub, App Config):
    - Save: output/my-company-name/2026-02-10/analysis/supporting-services-analysis.md

15. Create connector inventory:
    - output/my-company-name/2026-02-10/analysis/connector-inventory.md

═══════════════════════════════════════════
PHASE 3: FAILURE ANALYSIS
═══════════════════════════════════════════

16. Read /prompts/03-failure-analysis.md
17. Analyze failures across ALL resource types:
    - Logic Apps: Top 10 failing flows, error patterns, root cause analysis
    - Service Bus: DLQ message counts, server errors, throttling
    - Function Apps: Http5xx/4xx rates, function-level errors
    - APIM: Failed requests, per-API error breakdown, backend health
    - Cross-resource failure correlations

18. Save to: output/my-company-name/2026-02-10/analysis/failure-analysis.md

═══════════════════════════════════════════
PHASE 4: SECURITY AUDIT
═══════════════════════════════════════════

21. Read /prompts/04-security-audit.md
22. Use Microsoft Docs MCP to fetch Azure security best practices
23. Use SSOT standards from /standards/contica-ssot/
24. Audit:
    - Authentication & authorization (Managed Identity vs. secrets)
    - Network security (private endpoints, VNet integration)
    - Data protection (encryption, TLS versions)
    - Secrets management (Key Vault usage)
    - Monitoring & auditing (diagnostic settings)

25. Rate findings: HIGH / MEDIUM / LOW severity
26. Save to: output/my-company-name/2026-02-10/analysis/security-audit.md

═══════════════════════════════════════════
PHASE 5: UNUSED RESOURCE DETECTION
═══════════════════════════════════════════

23. Read /prompts/05-dead-flow-detection.md
24. Detect unused resources across ALL types:
    - Logic Apps: Zero runs in 90 days, always fails, disabled 90+ days
    - Service Bus: Empty namespaces, queues with zero messages
    - Function Apps: Zero invocations, stopped apps, deprecated runtimes
    - APIM: APIs with zero traffic, unused products
    - Key Vault, Storage, Event Grid, Event Hub, App Config: Zero activity

25. Save to: output/my-company-name/2026-02-10/analysis/dead-flows.md

═══════════════════════════════════════════
PHASE 6: MONITORING GAPS
═══════════════════════════════════════════

30. Read /prompts/06-monitoring-gaps.md
31. Check for:
    - Resources without diagnostic settings
    - Missing Application Insights connections
    - Missing alert rules
    - Log Analytics workspace configuration

32. Save to: output/my-company-name/2026-02-10/analysis/monitoring-gaps.md

═══════════════════════════════════════════
PHASE 7: NAMING & TAGGING COMPLIANCE
═══════════════════════════════════════════

33. Read /prompts/07-naming-tagging-compliance.md
34. Evaluate against SSOT naming convention standard
35. Check for required tags (environment, owner, cost-center, etc.)
36. Save to: output/my-company-name/2026-02-10/analysis/naming-tagging.md

═══════════════════════════════════════════
PHASE 8: FINAL REPORT GENERATION
═══════════════════════════════════════════

37. Read /prompts/08-generate-report.md
38. Read all analysis files from output/my-company-name/2026-02-10/analysis/
39. Generate comprehensive report with:
    - Executive Summary (business language)
    - Environment Overview
    - Integration Flows Summary
    - Security Assessment (HIGH/MEDIUM/LOW findings)
    - Operational Health
    - Technical Debt & Dead Flows
    - Prioritized Recommendations
    - Appendix

40. Save to: output/my-company-name/2026-02-10/reports/current-state-assessment.md

═══════════════════════════════════════════
PHASE 9: SALES OPPORTUNITIES
═══════════════════════════════════════════

41. Read /prompts/09-sales-opportunities.md
42. Check salesOpportunities.includeInReport in client config
43. If enabled, generate:
    - Map findings to opportunity categories (security, operational excellence, etc.)
    - Size each opportunity (XS/S/M/L/XL) with effort and revenue estimates
    - Include pitch tips for account managers

44. Save to:
    - output/my-company-name/2026-02-10/reports/improvement-opportunities.md
    - output/my-company-name/2026-02-10/reports/opportunity-summary.md

If salesOpportunities.includeInReport is false, skip this phase.

═══════════════════════════════════════════
POST-ASSESSMENT CREDENTIAL CLEANUP
═══════════════════════════════════════════

45. Check azureAccess.authenticationType in the client config
46. If "service-principal":
    - Ask me: "Have you copied the client secret to a secure location (e.g., Key Vault, password manager)?"
    - Wait for my confirmation
    - Once I confirm, clean up:
      • Delete set-env-vars.ps1 from the project root (if it exists)
      • Delete set-env-vars.sh from the project root (if it exists)
      • Remove clientSecret from the client config (if stored there)
      • Tell me to clear environment variables from my session
      • Ask if I want to delete the service principal from Azure AD
47. If "azure-cli": Skip cleanup — no secrets to remove

═══════════════════════════════════════════
GENERATE INTERACTIVE HTML REPORT
═══════════════════════════════════════════

48. Run: npm run report -- my-company-name 2026-02-10
49. This compiles ALL assessment documents into a single interactive HTML file
50. The HTML report is saved to: output/my-company-name/2026-02-10/reports/assessment-report.html
51. Tell me to open the file in a browser to view the interactive report

═══════════════════════════════════════════
POST-ASSESSMENT SUMMARY
═══════════════════════════════════════════

52. Show me:
    - ✓ Total resources discovered
    - ✓ Number of HIGH/MEDIUM/LOW severity findings
    - ✓ Number of unused resources identified
    - ✓ Top 5 recommendations
    - ✓ Sales opportunities generated (if enabled)
    - ✓ Credential cleanup status (if service principal was used)
    - ✓ HTML report generated
    - ✓ All files generated (with paths)

53. Tell me where to find the deliverables:
    - Markdown report: output/my-company-name/2026-02-10/reports/current-state-assessment.md
    - Interactive HTML: output/my-company-name/2026-02-10/reports/assessment-report.html

Execute all phases sequentially. Show progress updates as you complete each phase. If any phase fails, show the error and continue with the next phase.
```

**This runs the entire assessment automatically!**

---

## Alternative: Run Phases Individually

If you want more control, run one phase at a time:

### Phase 0: Preflight Validation
```
Read /prompts/00-preflight.md and execute Phase 0: Preflight Validation for client "my-company-name"

Assessment date: {YYYY-MM-DD}
Output root: output/my-company-name/{YYYY-MM-DD}/

Verify: Azure CLI, client config, MCP servers, SSOT standards, output folders.
Save to: output/my-company-name/{YYYY-MM-DD}/analysis/preflight-validation.md
```

### Phase 1: Resource Discovery
```
Read /prompts/01-inventory.md and execute Phase 1 for client "my-company-name"

Inventory all integration resources and save to:
- output/my-company-name/{YYYY-MM-DD}/inventory/resources.json
- output/my-company-name/{YYYY-MM-DD}/inventory/summary.md
```

### Phase 2: Integration Services Deep Dive
```
Read /prompts/02-logic-apps-deep-dive.md and execute Phase 2 for client "my-company-name"

Analyze ALL resource types (Logic Apps, Service Bus, Function Apps, APIM, Key Vault, Storage, Event Grid, Event Hub, App Config).

Save to:
- output/my-company-name/{YYYY-MM-DD}/analysis/logic-apps/{name}.md (per Logic App)
- output/my-company-name/{YYYY-MM-DD}/analysis/service-bus-analysis.md
- output/my-company-name/{YYYY-MM-DD}/analysis/function-apps-analysis.md
- output/my-company-name/{YYYY-MM-DD}/analysis/apim-analysis.md
- output/my-company-name/{YYYY-MM-DD}/analysis/supporting-services-analysis.md
- output/my-company-name/{YYYY-MM-DD}/analysis/connector-inventory.md
```

### Phase 3: Failure Analysis
```
Read /prompts/03-failure-analysis.md and execute Phase 3 for client "my-company-name"

Analyze failures across Logic Apps, Service Bus DLQs, Function Apps errors, and APIM error rates.
Save to: output/my-company-name/{YYYY-MM-DD}/analysis/failure-analysis.md
```

### Phase 4: Security Audit
```
Read /prompts/04-security-audit.md and execute Phase 4 for client "my-company-name"

Use SSOT standards and Microsoft Docs MCP for validation. Rate all findings HIGH/MEDIUM/LOW.
Save to: output/my-company-name/{YYYY-MM-DD}/analysis/security-audit.md
```

### Phase 5: Unused Resource Detection
```
Read /prompts/05-dead-flow-detection.md and execute Phase 5 for client "my-company-name"

Identify unused resources across ALL types (Logic Apps, Service Bus, Function Apps, APIM, etc.).
Save to: output/my-company-name/{YYYY-MM-DD}/analysis/dead-flows.md
```

### Phase 6: Monitoring Gaps
```
Read /prompts/06-monitoring-gaps.md and execute Phase 6 for client "my-company-name"

Check diagnostic settings, alerts, and observability for all resource types.
Save to: output/my-company-name/{YYYY-MM-DD}/analysis/monitoring-gaps.md
```

### Phase 7: Naming & Tagging
```
Read /prompts/07-naming-tagging-compliance.md and execute Phase 7 for client "my-company-name"

Evaluate against SSOT naming conventions and required tags.
Save to: output/my-company-name/{YYYY-MM-DD}/analysis/naming-tagging.md
```

### Phase 8: Generate Report
```
Read /prompts/08-generate-report.md and execute Phase 8 for client "my-company-name"

Read ALL analysis files including service-bus-analysis.md, function-apps-analysis.md, apim-analysis.md, and supporting-services-analysis.md. Synthesize into comprehensive report.

Save to: output/my-company-name/{YYYY-MM-DD}/reports/current-state-assessment.md

Then check client config — if salesOpportunities.includeInReport is true, automatically proceed to Phase 9.
```

### Phase 9: Sales Opportunities
```
Read /prompts/09-sales-opportunities.md and execute Phase 9 for client "my-company-name"

Map all assessment findings to sales opportunity categories. Size and prioritize opportunities.
Include pitch tips for account managers.

Save to:
- output/my-company-name/{YYYY-MM-DD}/reports/improvement-opportunities.md
- output/my-company-name/{YYYY-MM-DD}/reports/opportunity-summary.md
```

---

## Common Operations (Pure Chat Prompts)

### View My Report
```
Read my assessment report at: output/my-company-name/2026-02-10/reports/current-state-assessment.md

Show me:
1. Executive summary (3-5 bullet points)
2. Count of HIGH/MEDIUM/LOW severity findings
3. Top 5 recommendations with priority
4. List of all output files generated

Note: Replace date (2026-02-10) with your actual assessment date
```

### Find All Failed Logic Apps
```
Use Azure MCP to find all Logic Apps with failed runs:

1. List all Logic Apps across all subscriptions
2. Query run history for the last 30 days
3. Identify Logic Apps with failure rate > 10%
4. Show me:
   - Logic App name
   - Resource group
   - Total runs
   - Failed runs
   - Failure rate %
   - Most common error message

Sort by failure count descending.
```

### Security Quick Check
```
Quick security audit for client "my-company-name":

1. Use Azure MCP to list all Storage Accounts
2. Check which allow public blob access (allowBlobPublicAccess = true)
3. Use Microsoft Docs MCP to fetch Azure Storage security best practices
4. Compare actual config vs. Microsoft recommendations
5. Use SSOT standard from /standards/contica-ssot/baseline-levels.md
6. Generate findings with HIGH/MEDIUM/LOW severity

Show results in a table:
| Resource | Issue | Microsoft Recommendation | SSOT Baseline | Severity |
```

### Sync SSOT Standards Again
```
Re-sync all SSOT standards from Confluence space "TSSOTAI":

1. Use Atlassian MCP to fetch all 8 standard pages
2. Save to /standards/contica-ssot/ (overwrite existing)
3. Compare with previous version:
   - Show files that changed
   - Show what changed in each file (diff summary)
   - Show files that stayed the same

Tell me if any standards were updated.
```

### Check MCP Connectivity
```
Test connectivity to all MCP servers:

1. Run: node scripts/check-mcp-config.js
2. Show me which MCPs are:
   - ✓ Connected and working
   - ⚠ Optional but not installed
   - ✗ Required but missing

For any missing MCPs, show me installation instructions.
```

### List All Azure Resources
```
Use Azure MCP to inventory all integration resources:

1. List all Logic Apps (show count by type: Consumption vs. Standard)
2. List all Service Bus namespaces (show count of queues/topics per namespace)
3. List all Function Apps (show runtime version)
4. List all Key Vaults (show network config: public vs. private)
5. List all Storage Accounts (show public access setting)

Group by subscription and resource group.
Show totals at the end.
```

---

## Troubleshooting (Pure Chat)

### Setup Failed - Diagnose
```
Help me troubleshoot my setup:

1. Check if Node.js dependencies are installed: ls node_modules
2. Check if environment variables are set:
   - On Windows: Run in PowerShell: echo $env:AZURE_TENANT_ID
   - On Mac/Linux: Run in bash: echo $AZURE_TENANT_ID

3. If variables are missing:
   - Create the set-env-vars script for me
   - Tell me to run it

4. Run validation: node scripts/credential-helper.js validate

5. Show me the error (if any) and suggest fixes
```

### Authentication Failed
```
Fix my Azure authentication:

1. Test credentials: node scripts/credential-helper.js validate

2. If it fails:
   - Check if service principal still exists: az ad sp list --display-name "azure-assessment-sp"
   - Check role assignments: az role assignment list --assignee {my-client-id}
   - Try interactive login: az login

3. If needed, create a new service principal:
   - az ad sp create-for-rbac --name "azure-assessment-sp-new" --role Reader --scopes /subscriptions/{subscription-id}
   - Update my client config with new credentials
   - Create new set-env-vars script

4. Re-validate and confirm it works
```

### MCP Not Working
```
Diagnose MCP connectivity issues:

1. Check my MCP configuration: node scripts/check-mcp-config.js

2. Read my VS Code MCP config: C:\Users\AhmedBayoumy\AppData\Roaming\Code\User\mcp.json

3. For each required MCP (Azure MCP, Atlassian MCP):
   - Is it in the config?
   - Is the configuration correct?
   - Can I install it if missing?

4. Test connectivity by:
   - Trying a simple Azure MCP query (list resource groups)
   - Trying Atlassian MCP (search Confluence)

5. Show me what's broken and how to fix it
```

### No Resources Found
```
Figure out why no resources are being found:

1. Check current Azure subscription: az account show
2. List resource groups: az group list --output table
3. Try to list Logic Apps directly: az logic workflow list --output table
4. Check service principal permissions: az role assignment list --assignee {my-client-id}

5. Possible issues:
   - Wrong subscription selected
   - Service principal has no access
   - No resources in this subscription
   - Resource group filters in config too restrictive

6. Show me what you find and suggest fixes
```

---

## Advanced: Multi-Client Assessments

### Set Up New Client (Reuse Setup)
```
Set up a second client for assessment:

1. Ask me for the new client information:
   - Client name (e.g., "fabrikam")
   - Azure Tenant ID (if different)
   - Service Principal Client ID
   - Service Principal Client Secret
   - Subscription IDs to assess

2. Create new client config: clients/fabrikam/config.json
   - Use template from clients/_template/config.json
   - Fill in the new credentials

3. If using different credentials, create new environment variable script:
   - set-env-vars-fabrikam.ps1

4. Validate the new credentials

5. Create output folder: output/fabrikam/

6. Tell me I'm ready to run assessment for the new client
```

### Compare Two Assessments
```
Compare assessments for two clients:

Client 1: "contoso-corp"
Client 2: "fabrikam"

Read the reports for both:
- output/contoso-corp/{YYYY-MM-DD}/reports/current-state-assessment.md
- output/fabrikam/{YYYY-MM-DD}/reports/current-state-assessment.md

Show me a comparison:
1. Resource counts (Logic Apps, Service Bus, etc.)
2. Security findings (HIGH/MEDIUM/LOW counts)
3. Dead flows identified
4. Monitoring coverage %
5. SSOT compliance score (estimated)

Which client has better Azure integration hygiene?
```

---

## What Happens During Assessment?

The agent will:
- ✅ **Read prompt files** from /prompts/ directory
- ✅ **Use Azure MCP** to query Azure resources
- ✅ **Use Atlassian MCP** to fetch SSOT standards from Confluence
- ✅ **Use Microsoft Docs MCP** to validate against best practices
- ✅ **Create output files** in Markdown and JSON formats
- ✅ **Ask questions** when it needs clarification
- ✅ **Show progress** as each phase completes
- ✅ **Handle errors** gracefully with suggestions

**You don't need to know anything about:**
- Azure CLI commands
- KQL queries
- Logic Apps API
- Markdown formatting
- File structure

**The agent handles all of it!**

---

## Time Estimates

| Activity | Time |
|----------|------|
| Initial setup (first time only) | 5-10 minutes |
| SSOT sync from Confluence | 2 minutes |
| Full assessment (Phases 0-9) | 45-90 minutes (automatic) |
| Individual phase | 3-10 minutes |
| Report review | 10-20 minutes |

**Total from zero to finished report: ~60-120 minutes** (most of it automated)

---

## Output Files Generated

After running the assessment, you'll have:

```
output/
  └── my-company-name/
      └── 2026-02-10/                            (DATED FOLDER - one per assessment)
          ├── inventory/
          │   ├── resources.json                 (Full resource details)
          │   └── summary.md                     (Human-readable summary)
          │
          ├── analysis/
          │   ├── preflight-validation.md        (Phase 0)
          │   ├── service-bus-analysis.md        (Phase 2 - Service Bus)
          │   ├── function-apps-analysis.md      (Phase 2 - Function Apps)
          │   ├── apim-analysis.md               (Phase 2 - API Management)
          │   ├── supporting-services-analysis.md (Phase 2 - KV, Storage, etc.)
          │   ├── connector-inventory.md         (Phase 2 - Connectors used)
          │   ├── failure-analysis.md            (Phase 3)
          │   ├── security-audit.md              (Phase 4 - WITH SEVERITY RATINGS)
          │   ├── dead-flows.md                  (Phase 5)
          │   ├── monitoring-gaps.md             (Phase 6)
          │   ├── naming-tagging.md              (Phase 7)
          │   └── logic-apps/                    (Phase 2 - Per-flow analysis)
          │       ├── logic-order-processing.md
          │       ├── logic-customer-sync.md
          │       └── [... one file per Logic App ...]
          │
          └── reports/
              ├── current-state-assessment.md    (FINAL DELIVERABLE - Markdown)
              ├── improvement-opportunities.md   (SALES OPPORTUNITIES)
              ├── opportunity-summary.md         (ACCOUNT MANAGER SUMMARY)
              └── assessment-report.html         (INTERACTIVE HTML REPORT)
```

**Benefits of Dated Folders:**
- ✅ Run multiple assessments for same client (monthly/quarterly)
- ✅ Compare progress over time (Jan vs. Feb vs. Mar)
- ✅ Never overwrite previous results
- ✅ Clean organization (one folder per assessment date)

**Total per assessment: ~70 files, ~250 KB of documentation**

---

## Ready to Start?

### 🎯 First Time User?

1. Open VS Code Copilot Chat (`Ctrl+Shift+I`)
2. Enable `@workspace` mode
3. Go back to **Step 2** above
4. Copy the "One-Prompt Setup" and paste it
5. Answer the agent's questions
6. Run the set-env-vars script when asked
7. You're ready!

### 🎯 Already Set Up?

Go straight to **Step 4** and run the complete assessment prompt.

### 🎯 Want to Browse All Prompts?

See the `prompts/` folder for all 10 phase prompts (00 through 09).

---

## Questions?

Just ask in the chat:

```
I need help with [describe your issue]
```

The agent will help you troubleshoot!

---

**Last Updated:** 2026-02-10
**Maintained by:** Contica Integration Architecture Team
**Support:** Internal tool - ask the team for help
