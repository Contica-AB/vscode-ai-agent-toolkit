# Phase 0: Session Start

> **Purpose**: Set up credentials and tool access before any classification work.
> **Output**: Confirmed credentials for all required tools.

---

## Instructions for Agent

At the start of EVERY session, perform the following steps:

### Step 1: Ask for Client

```
Which client are you working with today?

Options:
- Type a client name (I'll create a folder if new)
- Or select from existing: [list existing client folders]
```

**Action**:

- If new client → Create folder under `/clients/{client-name}/`
- If existing → Load `/clients/{client-name}/config.json`

### Step 2: Ask Which Tools Are Needed

```
Which tools will you need for this classification?

☐ Atlassian (Jira/Confluence) - Read issues, find requirements
☐ Azure - Check deployed resources
☐ Azure DevOps - Work items, code repos
☐ GitHub - Code search
☐ Logic Apps - Deep workflow inspection
```

**Action**: Only configure tools the user selects.

### Step 3: For Each Selected Tool, Ask for Credentials

#### If Atlassian selected:

```
ATLASSIAN SETUP

Which Atlassian instance should I connect to?
> [User provides URL, e.g., "customer.atlassian.net"]

How should I authenticate?
1. Browser login (will prompt when first MCP call is made)
2. Use existing session (if already logged in)
```

**Action**: Store instance URL for session.

#### If Azure selected:

```
AZURE SETUP

Let me check your current Azure login...
[Run: az account show]

Current account: [show result]
Current subscription: [show result]

Use this account?
1. Yes, continue with current
2. Switch subscription (I'll show available ones)
3. Login to different tenant
```

**Action**:

- If switch subscription → Run `az account set -s [user choice]`
- If different tenant → Guide user through `az login --tenant`

#### If Azure DevOps selected:

```
AZURE DEVOPS SETUP

Which Azure DevOps organization?
> [User provides org name]

Which project?
> [User provides project name]
```

**Action**: Store org and project for session.

#### If GitHub selected:

```
GITHUB SETUP

Let me check your current GitHub login...
[Run: gh auth status]

Current account: [show result]

Use this account?
1. Yes, continue with current
2. Login to different account
```

**Action**: If switch needed → Guide user through `gh auth login`

#### If Logic Apps selected:

```
LOGIC APPS SETUP

Logic Apps MCP uses your Azure credentials.
[Use the Azure subscription confirmed above]

Confirmed subscription: [show subscription]
```

### Step 4: Validate All Connections

For each configured tool, make a simple test call:

| Tool         | Test Call                         | Success Criteria                 |
| ------------ | --------------------------------- | -------------------------------- |
| Atlassian    | `getAccessibleAtlassianResources` | Returns resources list           |
| Azure        | `subscription_list`               | Returns subscriptions            |
| Azure DevOps | `list_projects`                   | Returns projects                 |
| GitHub       | `gh repo list`                    | Returns repos                    |
| Logic Apps   | `list_logic_apps`                 | Returns Logic Apps or empty list |

### Step 5: Confirm and Proceed

```
✓ Session configured successfully!

Client: [client name]
Tools ready:
- Atlassian: [instance URL] ✓
- Azure: [subscription name] ✓
- Azure DevOps: [org/project] ✓ (or skipped)
- GitHub: [account] ✓ (or skipped)
- Logic Apps: [subscription] ✓ (or skipped)

Ready to classify issues. What would you like to do?

1. Classify an issue (paste link or key)
2. Review classification methodology
3. Check previous classifications for this client
```

---

## Fallback Handling

### If Atlassian MCP fails:

```
Atlassian MCP connection failed.

Options:
1. Try browser login again
2. Provide API token (I can guide you)
3. Skip Atlassian tools (limited classification)
```

### If Azure MCP fails:

```
Azure MCP connection failed.

Options:
1. Re-run `az login`
2. Check subscription access
3. Skip Azure tools (cannot verify implementation in Azure)
```

### If any tool is skipped:

Note the limitation in classification output:

```
⚠️ Limitation: [Tool] not available for this session.
   Impact: [What evidence cannot be gathered]
```

---

## Session State

After successful setup, maintain session state:

```json
{
  "client": "[user-provided]",
  "sessionStart": "[ISO timestamp]",
  "tools": {
    "atlassian": {
      "enabled": true,
      "instance": "[user-provided]"
    },
    "azure": {
      "enabled": true,
      "subscription": "[user-provided or current]"
    },
    "azureDevOps": {
      "enabled": false
    },
    "github": {
      "enabled": false
    },
    "logicApps": {
      "enabled": true,
      "subscription": "[same as azure]"
    }
  },
  "credentialsConfirmed": true
}
```

Do NOT ask for credentials again unless:

- User explicitly asks to switch
- A tool call fails with auth error
- Starting a new session
