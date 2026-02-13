# Phase 1: Load Issue

> **Purpose**: Fetch the reported issue and extract key information.
> **Input**: Issue link or key from user.
> **Output**: Structured summary of the reported problem.

---

## Instructions for Agent

### Step 1: Get Issue Reference

Ask the user:

```
What issue should I classify?

Provide:
- Jira issue key (e.g., PROJ-123)
- Jira issue URL
- Azure DevOps work item ID
- Azure DevOps work item URL
```

### Step 2: Detect Issue Source

Parse the input to determine source:

| Input Pattern                          | Source          | Action                                  |
| -------------------------------------- | --------------- | --------------------------------------- |
| `https://*.atlassian.net/browse/*`     | Jira            | Use Atlassian MCP                       |
| `[A-Z]+-[0-9]+`                        | Jira (key only) | Use Atlassian MCP with session instance |
| `https://dev.azure.com/*/_workitems/*` | Azure DevOps    | Use ADO MCP                             |
| `#[0-9]+` or just number               | Azure DevOps    | Use ADO MCP with session project        |

### Step 3: Fetch Issue Details

#### For Jira Issues:

```javascript
// Use Atlassian MCP
getJiraIssue({
  issueIdOrKey: "[key]",
});
```

Extract:

- Issue key
- Summary
- Description
- Issue type
- Status
- Reporter
- Created date
- Comments (especially recent ones)
- Linked issues
- Attachments (list, don't download)

#### For Azure DevOps Work Items:

```javascript
// Use ADO MCP
get_work_item({
  workItemId: [id],
});
```

Extract:

- Work item ID
- Title
- Description (System.Description)
- Work item type
- State
- Created by
- Created date
- Discussion/comments
- Related links

### Step 4: Parse the Problem

Analyze the issue content to extract:

```markdown
### Issue Summary

**Source**: [Jira/ADO]
**ID**: [key or ID]
**Link**: [URL]
**Type**: [Bug/Task/Story/etc. as reported]
**Status**: [Current status]
**Reporter**: [Name]
**Created**: [Date]

### Reported Problem

[Summarize what the reporter says is wrong]

### Expected Behavior (per reporter)

[What the reporter says should happen instead]

### Reproduction Steps (if provided)

1. [Step 1]
2. [Step 2]
   ...

### Attachments/Evidence Provided

- [List any attachments or screenshots mentioned]

### Related Issues

- [List any linked issues]
```

### Step 5: Identify Key Claims

Extract the testable claims from the issue:

```markdown
### Claims to Verify

1. **Claim**: [What the reporter asserts]
   **Testable?**: Yes/No
   **How to test**: [Brief description]

2. **Claim**: [Second assertion]
   ...
```

### Step 6: Confirm Understanding

Present summary to user:

```
I've loaded the issue. Here's my understanding:

**Issue**: [KEY] - [Title]
**Reporter claims**: [1-2 sentence summary]
**Reporter expects**: [1-2 sentence summary]

Is this correct?
1. Yes, proceed to find requirements
2. No, let me clarify
3. Add more context
```

---

## Edge Cases

### Issue Not Found

```
I couldn't find issue [key/id].

Possible reasons:
- Issue doesn't exist
- You don't have access
- Wrong instance/project

Would you like to:
1. Try a different issue key
2. Check permissions
3. Switch to different instance/project
```

### Issue Has No Description

```
This issue has minimal information:
- Title only: "[title]"
- No description
- No reproduction steps

Classification will be limited. Options:
1. Proceed with limited info (likely UNCLEAR result)
2. Ask reporter for more details first
3. Skip this issue
```

### Issue Is Not a Bug/Problem Report

```
This issue appears to be a [Feature Request / Task / Epic], not a bug report.

Scope Guardian classifies reported problems against requirements.
Should I:
1. Proceed anyway (will compare against existing requirements)
2. Skip - this doesn't need bug vs CR classification
```

---

## Output

Save to session state:

```json
{
  "issue": {
    "source": "jira",
    "key": "PROJ-123",
    "url": "https://...",
    "title": "...",
    "reportedProblem": "...",
    "expectedBehavior": "...",
    "claims": [...]
  }
}
```

Proceed to Phase 2: Find Requirements.
