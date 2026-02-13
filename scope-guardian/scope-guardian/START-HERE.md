# Start Here

Welcome to **Scope Guardian** - the issue classification assistant.

## What This Does

Scope Guardian helps you classify reported issues as:

- **BUG**: Implementation doesn't match specification
- **CHANGE REQUEST**: Implementation matches spec, but user wants different behavior
- **UNCLEAR**: Not enough evidence to classify

## Quick Start

### Step 1: Open in VS Code

Open the workspace file:

```
Scope Guardian.code-workspace
```

### Step 2: Open Copilot Chat

Press `Ctrl+Shift+I` (or `Cmd+Shift+I` on Mac) to open Copilot Chat in agent mode.

### Step 3: Start Classification

Type:

```
Let's classify an issue. Start with session setup.
```

### Step 4: Follow the Prompts

The agent will ask you for:

1. Which client you're working with
2. What tools you need (Jira, Azure, ADO, etc.)
3. Login credentials for each tool
4. The issue to classify

## What You'll Need

- **VS Code** with GitHub Copilot extension
- **MCP servers** configured (run `npm run validate` to check)
- **Access** to your issue tracker (Jira or Azure DevOps)
- **Access** to Confluence/docs (where requirements are stored)
- **Access** to Azure (optional, to verify implementation)

## Project Structure

```
Scope Guardian/
├── .github/
│   └── copilot-instructions.md   # Agent behavior rules
├── clients/
│   └── _template/                # Template for new clients
├── methodology/
│   ├── classification-rules.md   # Decision framework
│   └── evidence-requirements.md  # What counts as evidence
├── prompts/
│   ├── 00-session-start.md       # Credential setup
│   ├── 01-load-issue.md          # Get issue details
│   ├── 02-find-requirements.md   # Search for spec
│   ├── 03-check-implementation.md # Verify in Azure
│   ├── 04-check-code.md          # Optional code review
│   ├── 05-classify.md            # Make classification
│   └── 06-update-issue.md        # Tag/comment issue
├── scripts/
│   ├── validate-mcp.js           # Check MCP setup
│   ├── setup-client.js           # Create client folder
│   └── generate-report.js        # Build HTML report
└── output/
    └── {client}/                 # Classification reports
```

## Creating a New Client

Run:

```bash
npm run setup
```

Or manually create a folder under `clients/` with `config.json` and `notes.md`.

## Generate HTML Report

After classifying issues, create an interactive HTML report:

```bash
npm run report -- client-name 2026-02-13
```

This produces a single offline HTML file with:

- 🗂️ Tabbed navigation for all documents
- 🎨 Contica color scheme (Plum, Salmon, Forest, Beige, Pink, Tomato)
- ⌨️ Keyboard navigation (← → arrow keys)
- 🖨️ Print-friendly layout

## Troubleshooting

### "MCP not available"

Run `npm run validate` to check your MCP configuration.

### "Cannot access Jira"

The agent will ask you to authenticate. Follow the prompts.

### "No requirements found"

You may need to point the agent to where your specs are stored.

---

**Ready?** Open VS Code and start classifying!
