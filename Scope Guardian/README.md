# Scope Guardian

Issue classification tool powered by GitHub Copilot and MCP.

## Overview

Scope Guardian classifies reported issues by cross-referencing:

- **Issue details** from Jira or Azure DevOps
- **Requirements** from Confluence or documentation
- **Implementation** in Azure (Logic Apps, Functions, etc.)
- **Source code** (optional)

### Classifications

| Classification     | Meaning                                                    |
| ------------------ | ---------------------------------------------------------- |
| **BUG**            | Implementation doesn't match documented specification      |
| **CHANGE REQUEST** | Implementation matches spec; user wants different behavior |
| **UNCLEAR**        | Cannot determine due to missing requirements or evidence   |

## Installation

1. **Clone or copy** this folder to your workspace
2. **Open** `Scope Guardian.code-workspace` in VS Code
3. **Configure MCP servers** (see below)
4. **Start classifying** in Copilot Chat

## Prerequisites

- VS Code with GitHub Copilot extension
- MCP servers configured:
  - **Atlassian** (required) - Jira/Confluence access
  - **Azure** (recommended) - Resource verification
  - **Azure DevOps** (optional) - ADO work items
  - **Logic Apps** (optional) - Deep workflow inspection

### Validate Setup

```bash
npm run validate
```

## Usage

### Start a Session

Open Copilot Chat (`Ctrl+Shift+I`) and type:

```
Start a classification session
```

The agent will guide you through:

1. Selecting a client
2. Configuring tool access
3. Loading an issue
4. Finding requirements
5. Checking implementation
6. Making a classification
7. Updating the issue (optional)

### Key Principles

- **Never hardcoded**: Credentials and URLs are always asked from user
- **MCP-first**: Uses MCP servers before falling back to CLI
- **Evidence-based**: Every classification includes cited evidence
- **User confirms**: Never updates issues without explicit approval

## Project Structure

```
├── .github/copilot-instructions.md  # Agent rules and behavior
├── clients/                          # Per-client configuration
├── methodology/                      # Classification rules
├── prompts/                          # Phase-by-phase guides
├── scripts/                          # Utility scripts
└── output/                           # Classification reports
```

## Methodology

### Decision Tree

```
Requirements found?
├─ NO → UNCLEAR
└─ YES → Spec clear?
         ├─ NO → UNCLEAR
         └─ YES → Implementation matches spec?
                  ├─ NO → BUG
                  └─ YES → User wants spec behavior?
                           ├─ YES → NOT AN ISSUE
                           └─ NO → CHANGE REQUEST
```

### Confidence Scoring

| Evidence                         | Points |
| -------------------------------- | ------ |
| Requirements document found      | +30    |
| Spec clearly defines behavior    | +10    |
| Implementation verified in Azure | +25    |
| Code reviewed                    | +25    |
| Related issues found             | +5     |
| Error logs available             | +5     |

## Creating Clients

```bash
npm run setup
```

This creates a client folder with:

- `config.json` - Credential preferences and defaults
- `notes.md` - Client-specific context

## Output

Classification reports are saved to:

```
output/{client-name}/{YYYY-MM-DD}/{issue-key}-classification.md
```

### Generate HTML Report

After classifying issues, generate an interactive HTML report:

```bash
npm run report -- client-name 2026-02-13
```

This creates a single self-contained HTML file with:

- Tabbed navigation for all documents
- Offline-capable (no external dependencies)
- Print-friendly styling
- Keyboard navigation (arrow keys)

**Output:** `output/{client-name}/{YYYY-MM-DD}/classification-report.html`

## License

MIT

---

Built for Contica's integration consultancy practice.
