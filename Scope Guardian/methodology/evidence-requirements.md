# Evidence Requirements

## Principle

> **No classification without evidence. No evidence without links.**

Every classification must include verifiable links to:

1. The source of requirements (or proof none exists)
2. The source of implementation behavior (or proof it cannot be verified)
3. The reported issue itself

---

## Evidence Types

### 1. Requirements Evidence

**What counts as valid requirements documentation:**

| Source                                  | Validity  | Notes                              |
| --------------------------------------- | --------- | ---------------------------------- |
| Confluence page (approved spec)         | ✓ Strong  | Best evidence                      |
| Azure DevOps work item (User Story/PBI) | ✓ Strong  | If acceptance criteria clear       |
| SharePoint document (signed off)        | ✓ Strong  | Check for approval                 |
| Email (with stakeholder sign-off)       | ○ Medium  | Weaker, but acceptable if explicit |
| Jira description (approved)             | ○ Medium  | If marked as approved requirement  |
| Verbal agreement                        | ✗ Weak    | Don't rely on this                 |
| "Everyone knows"                        | ✗ Invalid | Not evidence                       |

**Required for requirements evidence:**

- Direct link to document/page
- Exact quote of relevant requirement
- Version/date of document
- Who approved (if visible)

### 2. Implementation Evidence

**What counts as valid implementation verification:**

| Source                    | Validity | Notes                       |
| ------------------------- | -------- | --------------------------- |
| Azure resource inspection | ✓ Strong | Check actual config/code    |
| Logic App run history     | ✓ Strong | Actual execution data       |
| Application Insights logs | ✓ Strong | Runtime behavior            |
| Source code review        | ✓ Strong | Direct implementation check |
| Test execution results    | ✓ Strong | Repeatable verification     |
| Screenshot of behavior    | ○ Medium | Acceptable but static       |
| User report               | ✗ Weak   | Starting point, not proof   |

**Required for implementation evidence:**

- Resource name and location
- How you verified (query run, code reviewed, etc.)
- What the current behavior is
- Timestamp of verification

### 3. Issue Evidence

**The reported issue itself:**

| Element                 | Required?    | Purpose             |
| ----------------------- | ------------ | ------------------- |
| Issue link              | ✓ Required   | Source of truth     |
| Reporter's description  | ✓ Required   | What they claim     |
| Reporter's expectation  | ✓ Required   | What they expected  |
| Steps to reproduce      | Preferred    | For verification    |
| Attachments/screenshots | If available | Supporting evidence |

---

## Evidence Collection Process

### Step 1: Document the Issue

Before searching for evidence, clearly document:

```markdown
### Issue Summary

- **Issue ID**: [JIRA-123 or link]
- **Reporter**: [Name if available]
- **Date Reported**: [ISO date]

### Reported Problem

[What the reporter says is wrong]

### Expected Behavior (per reporter)

[What the reporter expected to happen]

### Claimed Severity

[How urgent they say it is]
```

### Step 2: Search for Requirements

Search order:

1. Check if issue links to any requirements
2. Search Confluence for integration/feature name
3. Search ADO for related user stories
4. Check if there's a design document
5. Ask user for help locating specs

Document search attempts:

```markdown
### Requirements Search

- Searched Confluence space [SPACE] for "[search term]" → [Found/Not found]
- Checked linked issues in Jira → [Results]
- Searched ADO work items → [Results]
- Asked user for requirements location → [Response]
```

### Step 3: Verify Implementation

Verification approach:

1. Identify the Azure resources involved
2. Check Logic App/Function definitions
3. Review recent run history
4. Check code if repo available

Document verification:

```markdown
### Implementation Verification

- Resource: [resource name]
- Type: [Logic App / Function / etc.]
- Verified via: [MCP query / Portal / Code review]
- Current behavior: [What it actually does]
- Timestamp: [When checked]
```

---

## Evidence Insufficiency

### When Evidence is Insufficient

If you cannot gather sufficient evidence, do NOT guess. Instead:

1. **Mark as UNCLEAR** with specific reason
2. **Document what's missing**
3. **Specify what would resolve it**

Example:

```markdown
## Classification: UNCLEAR

**Reason**: Requirements documentation not found

### Search Attempts

- Searched Confluence space "INT" for "order sync" → 0 results
- Searched ADO for PBI related to order sync → Found PBI-4567, but no acceptance criteria
- Asked user → User doesn't know where spec is

### To Resolve

- [ ] Locate original requirements document for order sync integration
- [ ] Or: Interview stakeholders who approved original design
- [ ] Or: Treat as new feature requiring documentation
```

---

## Evidence Quality Checklist

Before finalizing classification, verify:

### Requirements Evidence

- [ ] Link included and accessible
- [ ] Exact quote cited
- [ ] Document version/date noted
- [ ] Approval status clear

### Implementation Evidence

- [ ] Resource name specified
- [ ] Verification method described
- [ ] Current behavior documented
- [ ] Verification timestamp included

### Comparison

- [ ] Side-by-side comparison of spec vs. implementation
- [ ] Discrepancy (if any) clearly stated
- [ ] Reporter expectation compared to both

### Confidence

- [ ] Confidence score calculated
- [ ] Missing evidence noted
- [ ] Limitations acknowledged

---

## Evidence Presentation

### In Classification Report

```markdown
### Evidence

#### Requirements Found

| Source             | Link              | Relevant Quote                                |
| ------------------ | ----------------- | --------------------------------------------- |
| INT-OrderSync-Spec | [Confluence link] | "Orders shall be synced every 15 minutes"     |
| PBI-4567           | [ADO link]        | "AC: System syncs orders at 15-min intervals" |

#### Implementation Verified

| Resource               | Verification         | Current Behavior                     |
| ---------------------- | -------------------- | ------------------------------------ |
| la-order-sync-prod     | Logic App definition | Trigger: Recurrence every 15 minutes |
| Run history (last 24h) | 96 runs              | All successful at ~15 min intervals  |

#### Comparison

| Aspect         | Spec Says     | Implementation Does | Match? |
| -------------- | ------------- | ------------------- | ------ |
| Sync frequency | 15 minutes    | 15 minutes          | ✓ Yes  |
| Error handling | Retry 3 times | Retries 3 times     | ✓ Yes  |

**Conclusion**: Implementation matches specification.
```

---

## Audit Trail

Every classification report must include which accounts/instances were used:

```markdown
### Audit Trail

| Tool           | Instance/Account       | Access Time      |
| -------------- | ---------------------- | ---------------- |
| Atlassian MCP  | customer.atlassian.net | 2026-02-12 10:30 |
| Azure MCP      | subscription-xyz       | 2026-02-12 10:32 |
| Logic Apps MCP | subscription-xyz       | 2026-02-12 10:33 |

**Agent**: Scope Guardian
**Session ID**: [if applicable]
**Classification Date**: 2026-02-12
```
