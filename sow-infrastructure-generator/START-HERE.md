# SoW Infrastructure Generator

Automated Azure infrastructure deployment file generation from Confluence Statement of Work documents.

## Installation (One-Time Setup)

To make the agents available in **any workspace**, install them to your VS Code user prompts folder:

### macOS / Linux
```bash
# Clone the toolkit (if you haven't already)
git clone https://github.com/Contica-AB/vscode-ai-agent-toolkit.git

# Install agents globally
cp vscode-ai-agent-toolkit/sow-infrastructure-generator/.github/agents/*.agent.md \
   ~/Library/Application\ Support/Code/User/prompts/
```

### Windows
```powershell
# Clone the toolkit (if you haven't already)
git clone https://github.com/Contica-AB/vscode-ai-agent-toolkit.git

# Install agents globally
Copy-Item "vscode-ai-agent-toolkit\sow-infrastructure-generator\.github\agents\*.agent.md" `
   "$env:APPDATA\Code\User\prompts\"
```

After installation, the agents (`@sow-infra-orchestrator`, `@sow-planning`, etc.) are available in Copilot Chat from any workspace.

---

## What This Does

This agent chain reads your Statement of Work from Confluence and generates:

- **parameters-dev.json** - Azure Bicep deployment parameters (Dev environment)
- **parameters-test.json** - Azure Bicep deployment parameters (Test environment)
- **parameters-prod.json** - Azure Bicep deployment parameters (Prod environment)
- **trigger.yml** - Azure DevOps multi-stage pipeline (Dev → Test → Prod)

All files are written to a `Deployment/` subfolder in the target workspace.

## Agent Chain

| Agent | Model | Purpose |
|-------|-------|---------|
| **Orchestrator** | - | Coordinates the workflow |
| **Planning** | Claude Sonnet 4 | Reads SoW, extracts requirements, creates JSON plan |
| **Implementation** | Claude Opus 4.5 | Generates parameters.json and trigger.yml |
| **Pipeline** | GPT-4o | Validates, commits, triggers Azure DevOps |

## Quick Start

### Step 1: Open in VS Code

Open the workspace file:

```
sow-infrastructure-generator.code-workspace
```

### Step 2: Open Copilot Chat

Press `Ctrl+Shift+I` (or `Cmd+Shift+I` on Mac) to open Copilot Chat in agent mode.

### Step 3: Generate Infrastructure

Invoke the orchestrator with your SoW URL:

```
@sow-infra-orchestrator https://contica.atlassian.net/wiki/spaces/CLIENT/pages/12345/Your-SoW-Page
```

### Step 4: Follow the Workflow

1. **Planning Phase** - Agent reads SoW from Confluence and extracts all infrastructure requirements into a structured JSON plan
2. **Review Plan** - You review the resource inventory, placeholders, and environment mappings
3. **Implementation Phase** - Agent generates per-environment parameter files and pipeline YAML
4. **File Output** - Files are written to `Deployment/` in the workspace root
5. **Deploy (Optional)** - Trigger Azure DevOps pipeline via the pipeline agent

## What You'll Need

- **VS Code** with GitHub Copilot extension
- **Atlassian MCP** configured (for Confluence access)
- **GitHub access** to `contica-azure-utils` repository
- **Azure DevOps** access (optional, for deployment)

## Project Structure

```
sow-infrastructure-generator/
├── .github/
│   └── agents/
│       ├── sow-infra-orchestrator.agent.md   # Orchestrator (coordinates workflow)
│       ├── sow-planning.agent.md             # Planning agent (Claude Sonnet 4)
│       ├── sow-implementation.agent.md       # Implementation agent (Claude Opus 4.5)
│       └── sow-pipeline.agent.md             # Pipeline agent (GPT-4o)
├── output/
│   └── expected output/                      # Reference output for validation
│       ├── parameters.json                   # Example parameters structure
│       └── trigger.yml                       # Example pipeline structure
├── reference/
│   └── integration-setup-prompt.md           # Detailed generation rules
├── VALIDATION-CHECKLIST.md                   # Output validation checklist
└── START-HERE.md                             # This file
```

### Generated Output Structure

When the workflow runs, files are created in the target workspace:

```
<workspace-root>/
└── Deployment/
    ├── parameters-dev.json
    ├── parameters-test.json
    ├── parameters-prod.json
    └── trigger.yml
```

## SoW Requirements

Your Statement of Work must follow the [SoW MCP Template](https://contica.atlassian.net/wiki/spaces/TSSOTAI/pages/1091207169) with sections:

- **9.1** Environment & Identity
- **9.2** Networking Requirements
- **9.3** Shared Infrastructure References
- **9.4** Resource Definitions (tables for each resource type)
- **9.5** Role Assignments
- **9.6** Pipeline Configuration
- **9.7** Environment Mapping

## Supported Resource Types

The generator supports the following Azure resource types from SoW section 9.4:

| Resource Type | Parameter Array Name |
|---------------|---------------------|
| Service Bus | `serviceBusArray` |
| Storage Accounts | `storageAccountArray` |
| Logic Apps | `logicAppArray` |
| Function Apps | `functionAppArray` |
| Web Apps | `webAppArray` |
| Key Vaults | `keyVaultArray` |
| Data Factories | `dataFactoryArray` |
| Role Assignments | `roleAssignments` |

Unused resource types are omitted from the output (no empty arrays).

## Networking Modes

| Mode | Apps (Logic/Function/Web) | Data Resources (SB/Storage/KV) |
|------|---------------------------|--------------------------------|
| **None** | `"vnetIntegration": {}` | `"vnetIntegration": {}` |
| **Outbound** | VNet integration (outbound subnet) | N/A |
| **Secured** | VNet + Private Endpoint | Private Endpoint |

## Documentation

- [Full Documentation (Confluence)](https://contica.atlassian.net/wiki/spaces/AGI/pages/1091633162)
- [SoW Template](https://contica.atlassian.net/wiki/spaces/TSSOTAI/pages/1091207169)
- [Bicep Templates (GitHub)](https://github.com/Contica-AB/contica-azure-utils)
