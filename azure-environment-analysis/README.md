# Azure Integration Services Environment Assessment

A reusable VS Code project for performing AI-powered Azure Integration Services environment assessments. Used by **Contica** (integration consultancy) to analyze client Azure environments.

---

## 🚀 New to This Project? Start Here!

**Choose your starting point based on how you want to work:**

| How You Want to Work                                  | Start Here                         | Time                      |
| ----------------------------------------------------- | ---------------------------------- | ------------------------- |
| ⭐ **Copy/paste prompts only** (Recommended)          | **[START-HERE.md](START-HERE.md)** | 5 min + 45 min assessment |
| 🎯 **Advanced** - Want technical architecture details | Continue reading below             | 10 min                    |

**Most users should start with [START-HERE.md](START-HERE.md) - it runs entirely through VS Code Copilot Chat with ready-to-paste prompts!**

### Quick Commands

```bash
# First time? Run the interactive setup wizard
npm install
npm run setup

# Already set up? Validate your credentials
npm run validate

# Ready to assess? Open VS Code
code .
# Then in Copilot Chat: "Execute Phase 0 for client 'your-client-name'"
```

---

## What This Project Does

This project provides a structured methodology and AI-assisted tooling for comprehensive Azure Integration Services assessments:

- **Resource Inventory**: Enumerate all integration resources (Logic Apps, Service Bus, APIM, Functions, etc.)
- **Security Posture Evaluation**: Check for hardcoded secrets, RBAC issues, network exposure
- **Failure Pattern Analysis**: Identify recurring errors and root causes
- **Dead Flow Detection**: Find unused or legacy integrations
- **Monitoring Gap Analysis**: Identify resources lacking observability
- **Naming & Tagging Compliance**: Evaluate governance adherence
- **Current State Assessment Report**: Synthesize findings into a deliverable

## Prerequisites

| Requirement    | Version   | Check Command |
| -------------- | --------- | ------------- |
| Node.js        | 20+ LTS   | `node -v`     |
| npm            | 10+       | `npm -v`      |
| Azure CLI      | 2.50+     | `az version`  |
| VS Code        | Latest    | —             |
| GitHub Copilot | Extension | —             |

### Installation

**Windows (PowerShell)**:

```powershell
# Install Node.js
winget install OpenJS.NodeJS.LTS

# Install Azure CLI
winget install Microsoft.AzureCLI

# Authenticate to Azure
az login
```

**Note**: MCP servers run automatically via `npx` - no global install required.

**macOS/Linux**:

```bash
# Install Node.js (via nvm recommended)
nvm install --lts

# Install Azure CLI
brew install azure-cli  # macOS
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Ubuntu/Debian

# Authenticate to Azure
az login
```

**Note**: MCP servers are invoked via `npx -y` in the project configuration, which downloads and caches them automatically on first use.

## Quick Start

### 1. Clone/Open the Project

```bash
cd ~/projects/azure-environment-analysis
code .
```

### 2. Validate Environment

```bash
npm run validate
```

### 3. Set Up for a New Client

```bash
# Copy the template
cp -r clients/_template clients/acme-corp

# Edit the configuration
code clients/acme-corp/config.json
```

Update `config.json` with:

- Client name
- Azure subscription ID(s)
- Resource group filters (if any)
- Azure DevOps org/project (if using)
- Assessment period
- Focus areas

### 4. Run the Assessment

1. Open VS Code with this project
2. Open GitHub Copilot Chat (Ctrl+Shift+I / Cmd+Shift+I)
3. Switch to **Agent mode** (@workspace)
4. Start with the preflight validation:

```
Read /prompts/00-preflight.md and execute Phase 0: Preflight Validation for client "acme-corp"
```

5. Continue through each prompt in sequence (01 through 09)

**Output**: Each client's results are stored in `/output/{client-name}/` (e.g., `/output/acme-corp/`).
Multiple assessments for the same client are preserved — files are timestamped.
You can run assessments for different clients without clearing output.

## Project Structure

```
azure-environment-analysis/
│
├── .vscode/
│   ├── mcp.json              # MCP server configurations
│   └── settings.json         # VS Code settings
│
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot context
│
├── CLAUDE.md                 # Agent instructions (Claude/Copilot)
├── README.md                 # This file
│
├── methodology/
│   ├── assessment-framework.md   # 10-phase methodology
│   ├── security-checklist.md     # Security checks
│   ├── best-practices.md         # Best practices reference (secondary)
│   └── report-template.md        # Final report structure
│
├── standards/                    # Evaluation standards
│   ├── contica-ssot/             # Contica Single Source of Truth
│   │   ├── baseline-levels.md    # Helium compliance levels
│   │   ├── authentication-matrix.md # Required auth methods
│   │   ├── network-security.md   # Security options
│   │   ├── required-tiers.md     # Minimum tiers
│   │   ├── naming-convention.md  # Naming patterns
│   │   ├── azure-policies.md     # Required policies
│   │   ├── known-exceptions.md   # Accepted exceptions
│   │   └── opportunity-categories.md # Sales opportunities
│   └── azure-apis/               # Azure API reference
│       ├── advisor-recommendations.md
│       ├── policy-compliance.md
│       ├── defender-recommendations.md
│       └── resource-health.md
│
├── prompts/
│   ├── 00-preflight.md           # Phase 0: Preflight
│   ├── 01-inventory.md           # Phase 1: Discovery
│   ├── 02-logic-apps-deep-dive.md # Phase 2: Logic Apps
│   ├── 03-failure-analysis.md    # Phase 3: Failures
│   ├── 04-security-audit.md      # Phase 4: Security
│   ├── 05-dead-flow-detection.md # Phase 5: Dead Flows
│   ├── 06-monitoring-gaps.md     # Phase 6: Monitoring
│   ├── 07-naming-tagging-compliance.md # Phase 7: Governance
│   ├── 08-generate-report.md     # Phase 8: Report
│   └── 09-sales-opportunities.md # Phase 9: Sales (internal)
│
├── scripts/
│   ├── interactive-setup.js      # Setup wizard (npm run setup)
│   ├── credential-helper.js      # Credential validation (npm run validate)
│   ├── check-mcp-config.js       # MCP config check (npm run check-mcp)
│   ├── show-mcp-status.js        # MCP status display (npm run test-mcp)
│   ├── ssot-instructions.js      # SSOT sync instructions (npm run sync-ssot)
│   ├── show-prompts.js           # Show assessment prompts (npm run prompts)
│   ├── generate-html-report.js   # HTML report generator (npm run report)
│   └── resource-graph-queries/
│       ├── all-integration-resources.kql
│       ├── networking-topology.kql
│       ├── tagging-compliance.kql
│       ├── security-posture.kql
│       └── monitoring-coverage.kql
│
├── output/                   # Assessment outputs (gitignored)
│   └── {client-name}/        # Client-scoped output (e.g., "wallenius-sol")
│       ├── inventory/        # Resource inventories (JSON)
│       ├── analysis/         # Phase analysis (Markdown)
│       │   └── logic-apps/   # Per-Logic-App analysis
│       └── reports/          # Final reports (Markdown + HTML)
│
└── clients/
    └── _template/            # Template for new clients
        ├── config.json       # Client configuration
        └── notes.md          # Client-specific notes
```

## MCP Servers

This project uses multiple MCP (Model Context Protocol) servers:

### Azure MCP Server (`@azure/mcp`)

- **Purpose**: Broad Azure resource discovery and management
- **Capabilities**: 40+ Azure services including Storage, Service Bus, Key Vault, Monitor, RBAC
- **Auth**: Uses `az login` credentials

### Logic Apps MCP Server (`logicapps-mcp`) — TRY FIRST, CLI FALLBACK

- **Status**: Try first — may have authentication issues in some environments
- **Approach**: Always attempt Logic Apps MCP first; if it fails, fall back to `az logic workflow show` and `az rest`

### Azure DevOps MCP Server (`@azure-devops/mcp`)

- **Purpose**: Cross-reference with work items and documentation
- **Capabilities**: Work items, repos, pipelines, wiki
- **Auth**: Browser-based Microsoft account login

### Microsoft Docs MCP (`microsoftdocs/mcp`)

- **Purpose**: Query Microsoft Learn for Azure CAF/WAF best practices
- **Capabilities**: Search Azure security baselines, naming conventions, production readiness

### Atlassian MCP (`com.atlassian/atlassian-mcp-server`)

- **Purpose**: Sync Contica SSOT standards from Confluence space "TSSOTAI"
- **Capabilities**: Search and fetch Confluence pages

## Assessment Methodology

| Phase | Name                 | Description              | Duration |
| ----- | -------------------- | ------------------------ | -------- |
| 0     | Preflight            | Environment validation   | 15 min   |
| 1     | Discovery            | Resource inventory       | 2-4 hrs  |
| 2     | Logic Apps Deep Dive | Workflow analysis        | 4-8 hrs  |
| 3     | Failure Analysis     | Error patterns           | 2-4 hrs  |
| 4     | Security Audit       | Security posture vs SSOT | 4-6 hrs  |
| 5     | Dead Flow Detection  | Unused resources         | 1-2 hrs  |
| 6     | Monitoring Gaps      | Observability            | 2-3 hrs  |
| 7     | Naming & Tagging     | Governance vs SSOT       | 1-2 hrs  |
| 8     | Report Generation    | Final deliverable        | 4-6 hrs  |
| 9     | Sales Opportunities  | Internal only            | 2-3 hrs  |

**Total**: 22-38 hours depending on environment size

## Output Files

All outputs are saved to `/output/{client-name}/{YYYY-MM-DD}/` under a date-based folder:

| Type      | Location                                        | Format   |
| --------- | ----------------------------------------------- | -------- |
| Inventory | `/output/{client-name}/{YYYY-MM-DD}/inventory/` | JSON     |
| Analysis  | `/output/{client-name}/{YYYY-MM-DD}/analysis/`  | Markdown |
| Reports   | `/output/{client-name}/{YYYY-MM-DD}/reports/`   | Markdown |

Example filenames:

- `resources.json`
- `security-audit.md`
- `current-state-assessment.md`

## Contica SSOT Standards

All assessments evaluate findings against Contica's Single Source of Truth (SSOT) standards:

| Standard              | File                                               | Purpose                                   |
| --------------------- | -------------------------------------------------- | ----------------------------------------- |
| Baseline Levels       | `standards/contica-ssot/baseline-levels.md`        | Helium compliance levels by resource type |
| Authentication Matrix | `standards/contica-ssot/authentication-matrix.md`  | Required MI/RBAC between resources        |
| Network Security      | `standards/contica-ssot/network-security.md`       | Standard vs Advanced security options     |
| Required Tiers        | `standards/contica-ssot/required-tiers.md`         | Minimum SKUs per security option          |
| Naming Convention     | `standards/contica-ssot/naming-convention.md`      | Naming patterns and required tags         |
| Azure Policies        | `standards/contica-ssot/azure-policies.md`         | Required policy assignments               |
| Known Exceptions      | `standards/contica-ssot/known-exceptions.md`       | Checks deliberately disabled              |
| Opportunities         | `standards/contica-ssot/opportunity-categories.md` | Sales opportunity categories              |

The SSOT is the **primary evaluation baseline**. The `methodology/best-practices.md` file provides supplementary guidance.

## Contributing (Contica Team)

### Adding New Checks

1. Add the check to `/methodology/security-checklist.md`
2. Update the relevant prompt in `/prompts/`
3. Test with a sample environment

### Updating Methodology

1. Edit files in `/methodology/`
2. Update corresponding prompts
3. Update `CLAUDE.md` and `.github/copilot-instructions.md`

### Creating New Prompts

1. Follow the existing prompt structure
2. Specify which MCP tools to use
3. Define exact output format and location
4. Include success criteria

## Troubleshooting

### MCP servers not appearing in VS Code

1. Ensure Node.js 20+ is installed
2. Check `.vscode/mcp.json` syntax
3. Restart VS Code
4. Check VS Code Output panel for MCP errors

### Azure authentication issues

```bash
# Re-authenticate
az login

# Check current subscription
az account show

# Change subscription
az account set --subscription "subscription-name-or-id"
```

### Logic Apps MCP not working

The Logic Apps MCP server may have authentication issues in some environments (requires Bearer token passthrough). All prompts are configured to try Logic Apps MCP first and fall back to Azure CLI:

```bash
# Fallback: Get a Logic App workflow definition
az logic workflow show -g {resource-group} -n {logic-app-name}

# Fallback: Query run history via REST API
az rest --method GET --url "https://management.azure.com/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Logic/workflows/{name}/runs?api-version=2016-06-01"
```

If Logic Apps MCP fails during preflight (Phase 0), it will be recorded and CLI fallback will be used for the remainder of the assessment.

## License

Internal use only - Contica proprietary methodology.

## Support

For issues or questions, contact the Contica Integration Practice team.
