# Phase 6: Update Issue

> **Purpose**: Offer to update the original issue with classification findings.
> **Input**: Classification report from Phase 5.
> **Output**: Updated issue (if user confirms) or record of skip.
> **Rule**: ALWAYS ask user before making any changes.

---

## Instructions for Agent

### Step 1: Confirm Classification

```
The classification is complete:

**Issue**: [KEY]
**Classification**: [BUG / CHANGE REQUEST / UNCLEAR]
**Confidence**: [X]%

Ready to update the issue?
```

### Step 2: Present Update Options

```
How would you like to update the issue?

☐ Add label/tag: "[classification-label]"
☐ Add comment with classification summary
☐ Add comment with full report
☐ Link to related issues
☐ Change issue type (if applicable)
☐ Custom update
☐ Skip - don't update the issue
```

### Step 3: Preview Changes

Before making any changes, show exactly what will be done:

#### If Adding Label:

```
I'll add this label to [KEY]:

Label: `scope-guardian:change-request`

Or would you prefer a different label name?
```

#### If Adding Comment:

```
I'll add this comment to [KEY]:

---
**Scope Guardian Classification**

**Result**: CHANGE REQUEST
**Confidence**: 85%
**Date**: 2026-02-12

**Summary**: Implementation matches documented requirements. The system correctly [behavior]. The reporter requests different behavior than specified.

**Evidence**:
- Requirements: [link to spec]
- Implementation: [resource name]

**Recommendation**: Create change request with updated requirements if desired behavior is approved.

---

Add this comment?
1. Yes, add as-is
2. Edit first (I'll show editable version)
3. Cancel
```

#### If Full Report Comment:

```
I'll add the full classification report as a comment.

Note: This is [X] lines long. Consider:
1. Add full report (may be long for a comment)
2. Add summary only (shorter)
3. Add summary with link to full report
4. Cancel
```

### Step 4: Execute Updates (Only After Confirmation)

#### For Jira:

```javascript
// Add label
editJiraIssue({
  issueIdOrKey: "[key]",
  fields: {
    labels: { add: ["scope-guardian:change-request"] },
  },
});

// Add comment
addCommentToJiraIssue({
  issueIdOrKey: "[key]",
  body: "[comment text]",
});
```

#### For Azure DevOps:

```javascript
// Update work item
update_work_item({
  workItemId: [id],
  operations: [
    {
      op: "add",
      path: "/fields/System.Tags",
      value: "scope-guardian:change-request",
    },
  ],
});

// Add comment
add_work_item_comment({
  workItemId: [id],
  text: "[comment text]",
});
```

### Step 5: Confirm Success

```
✓ Issue updated successfully!

Changes made to [KEY]:
- Added label: `scope-guardian:change-request`
- Added comment with classification summary

View issue: [link]

What's next?
1. Classify another issue
2. Review classification history
3. End session
```

---

## If User Skips Updates

```
Okay, I won't update the issue.

The classification report has been saved to:
/output/[client]/[date]/[issue-key]-classification.md

You can:
1. Update the issue manually later
2. Share the report with stakeholders
3. Re-run this phase to update later

What's next?
1. Classify another issue
2. Review saved reports
3. End session
```

---

## Additional Actions

### Link Related Issues

If related issues were found during classification:

```
I found these potentially related issues during classification:

| Issue | Title | Relationship |
|-------|-------|--------------|
| [KEY-2] | [title] | Similar problem |
| [KEY-3] | [title] | May be duplicate |

Would you like to:
1. Link [KEY] to these issues
2. View these issues first
3. Skip linking
```

### Change Issue Type

For Jira, if classification suggests different issue type:

```
This issue is currently typed as "Bug" but classified as CHANGE REQUEST.

Would you like to change the issue type?
1. Change to "Story" or "Change Request" (if available)
2. Leave as Bug with classification label
3. Skip
```

### Notify Stakeholders

```
Would you like to notify anyone about this classification?

Options:
1. Tag reporter in comment (user is notified)
2. Tag additional watchers
3. Send to specific person: [enter name]
4. No notification needed
```

---

## Error Handling

### Permission Error

```
❌ Cannot update issue: Permission denied

You may not have permission to:
- Add labels to [KEY]
- Comment on [KEY]

Options:
1. Try a different update (maybe just comment?)
2. Save report and update manually
3. Check with project admin
```

### Issue Changed Since Classification

```
⚠️ Issue [KEY] has been modified since classification started.

Changes detected:
- Status changed from [A] to [B]
- New comment added

Should I:
1. Proceed with update anyway
2. Review changes first
3. Cancel update
```

### MCP Error

```
❌ Error updating issue via MCP

Error: [error message]

Fallback options:
1. Copy update text to clipboard (you paste manually)
2. Try again
3. Save report only
```

---

## Audit Trail

Record all actions taken:

```markdown
### Update Log

| Time  | Action        | Result    |
| ----- | ------------- | --------- |
| 10:45 | Add label     | ✓ Success |
| 10:45 | Add comment   | ✓ Success |
| 10:46 | Link to KEY-2 | ✓ Success |

**Account used**: [atlassian instance / ADO org]
**User confirmed**: Yes
```

Add to classification report:

```json
{
  "updates": {
    "performed": true,
    "actions": [
      {
        "type": "label",
        "value": "scope-guardian:change-request",
        "timestamp": "2026-02-12T10:45:00Z",
        "result": "success"
      },
      {
        "type": "comment",
        "timestamp": "2026-02-12T10:45:30Z",
        "result": "success"
      }
    ],
    "userConfirmed": true,
    "issueLink": "https://..."
  }
}
```

---

## Session End

After updates (or skip):

```
## Session Summary

**Client**: [client name]
**Issues Classified**: 1 (this session)

| Issue | Classification | Confidence | Updated |
|-------|----------------|------------|---------|
| [KEY] | CHANGE REQUEST | 85% | ✓ Yes |

**Reports saved to**: /output/[client]/[date]/

Next time you run Scope Guardian, you can:
- Continue with same credentials
- Start fresh with new client
- Review previous classifications

Thank you for using Scope Guardian!
```
