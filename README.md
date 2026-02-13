# VS Code AI Agent Toolkit

AI-powered tools for Azure consulting, built to run inside VS Code with GitHub Copilot.

## Projects

### [Azure Environment Analysis](azure-environment-analysis/)

Automated assessment of client Azure Integration Services environments. Runs a structured sequence of prompts through Copilot Chat to produce a full environment report — resource inventory, Logic Apps deep-dive, failure analysis, security audit, monitoring gaps, and sales opportunities.

**How it works:** Set up client credentials → paste prompts into Copilot Chat → get a complete assessment report.

### [Scope Guardian](Scope%20Guardian/)

Issue classification tool that determines whether a reported issue is a **bug**, **change request**, or **unclear**. Cross-references Jira/Azure DevOps issues against requirements docs, Azure implementations, and source code.

**How it works:** Load an issue → Copilot finds requirements & checks implementation → outputs a classification with evidence.

## Getting Started

Each project has its own `START-HERE.md` with step-by-step instructions. Open the respective `.code-workspace` file in VS Code to begin.

## Requirements

- VS Code with GitHub Copilot
- Azure MCP server (for Azure resource access)
- Node.js (for setup scripts)
