# Phase 4: Check Code (Optional)

> **Purpose**: Review source code for additional implementation evidence.
> **Input**: Implementation findings from Phase 3.
> **Output**: Code-level evidence supporting or contradicting spec compliance.
> **Note**: This phase is optional. Skip if code review not needed or repo not available.

---

## Instructions for Agent

### Step 1: Determine If Code Review Is Needed

```
Do you want me to review source code for this issue?

This can help when:
- Azure resources are generated from code (IaC, Functions, etc.)
- Logic is in Function Apps or custom connectors
- You want to verify the "source of truth"

Options:
1. Yes, check code
2. No, skip to classification (enough evidence from Azure)
3. Review code only for specific aspects
```

### Step 2: Get Repository Location

If user wants code review:

```
Where is the source code?

Provide:
- Azure DevOps repo URL or name
- GitHub repo URL
- Local path (if you want me to search files)
```

### Step 3: Search for Relevant Code

#### For Azure DevOps Repos:

```javascript
// Search code in repo
search_code({
  searchText: "[integration name or key terms]",
  project: "[project]",
});
```

#### For GitHub Repos:

```bash
# Search using GitHub CLI
gh search code "[search terms]" --repo [org/repo]
```

#### Search Strategies:

1. Search for integration/feature name
2. Search for resource names mentioned
3. Search for error messages from the issue
4. Search for key field names or API endpoints

### Step 4: Review Relevant Files

For each relevant file found:

```javascript
// Get file content
// ADO: get file via repo API
// GitHub: gh api or read directly
```

Document:

- File path
- Relevant lines
- What the code does
- How it relates to the requirement

````markdown
### Code Review

#### File: src/Integrations/OrderSync/OrderProcessor.cs

**Lines 45-60**:

```csharp
// Code snippet here
public async Task ProcessOrder(Order order)
{
    // Retry logic
    var retryPolicy = Policy
        .Handle<HttpRequestException>()
        .RetryAsync(3); // <-- Matches spec: 3 retries

    await retryPolicy.ExecuteAsync(() => SendOrder(order));
}
```
````

**Finding**: Code implements 3 retries as specified.

````

### Step 5: Compare Code to Azure Implementation

If reviewing IaC (Bicep, ARM, Terraform):

```markdown
### Infrastructure Code vs. Deployed

| Aspect | Code (IaC) | Deployed | Match? |
|--------|------------|----------|--------|
| Retry policy | 3 retries | 3 retries | ✓ |
| Timeout | 30s | 30s | ✓ |
| SKU | Standard | Standard | ✓ |
````

If reviewing application code:

```markdown
### Application Code vs. Expected Behavior

| Behavior      | Code Shows             | Spec Says              | Match? |
| ------------- | ---------------------- | ---------------------- | ------ |
| Field mapping | OrderId → order_number | OrderId → order_number | ✓      |
| Null handling | Skip nulls             | Skip nulls             | ✓      |
| Error format  | JSON                   | Not specified          | -      |
```

### Step 6: Check for Recent Changes

```javascript
// Get commit history for relevant files
// ADO: list commits with path filter
// GitHub: gh api commits
```

```markdown
### Recent Code Changes

| Date       | Author            | Commit            | Relevant? |
| ---------- | ----------------- | ----------------- | --------- |
| 2026-02-10 | dev@company.com   | "Fix retry logic" | ✓ Yes     |
| 2026-01-05 | other@company.com | "Add logging"     | ✗ No      |
```

If relevant recent changes:

```
I found a recent commit that may relate to this issue:

**Commit**: [hash]
**Date**: [date]
**Author**: [author]
**Message**: "[message]"
**Files changed**: [list]

Should I:
1. Show the diff for this commit
2. Compare before/after this change
3. Continue without diving deeper
```

### Step 7: Summarize Code Findings

```markdown
### Code Review Summary

**Repository**: [repo link]
**Files Reviewed**: [count]
**Relevant Code Found**: Yes/No

#### Key Findings

1. **[Filename]** implements [behavior] → Matches/Differs from spec
2. **[Filename]** handles errors by [method] → Matches/Differs from spec

#### Evidence for Classification

| Evidence Type               | Found | Supports             |
| --------------------------- | ----- | -------------------- |
| Implementation matches spec | ✓     | CR (not a bug)       |
| Implementation differs      | -     | -                    |
| Code changed recently       | ✓     | Potential recent fix |

#### Relevant Code Snippets

[Include 2-3 most relevant snippets with file paths]
```

---

## If Code Not Found

```
I couldn't find code related to this integration.

Possible reasons:
- Integration is low-code (Logic Apps without source control)
- Different repo than expected
- Code uses different naming

Options:
1. Try different search terms
2. Provide exact file path
3. Skip code review (use Azure-only evidence)
```

---

## Edge Cases

### Multiple Versions of Code

```
I found multiple branches with different implementations:

| Branch | Last Update | Difference |
|--------|-------------|------------|
| main | 2026-02-01 | Has 1 retry |
| develop | 2026-02-10 | Has 3 retries |
| feature/fix-retry | 2026-02-11 | Has 3 retries |

Which represents the production code?
```

### Code and Azure Don't Match

```
⚠️ Discrepancy between code and deployed:

- **Code** (main branch): 1 retry
- **Azure** (la-order-sync-prod): 3 retries

This may indicate:
- Code not deployed yet
- Manual Azure changes
- Different deployment pipeline

Should I:
1. Note this discrepancy in classification
2. Trust Azure (it's what's running)
3. Trust code (it's the intended behavior)
```

---

## Output

Save to session state:

```json
{
  "codeReview": {
    "performed": true,
    "repository": "https://dev.azure.com/org/project/_git/repo",
    "filesReviewed": [
      {
        "path": "src/OrderProcessor.cs",
        "relevantLines": "45-60",
        "finding": "Implements 3 retries as specified"
      }
    ],
    "recentChanges": [
      {
        "date": "2026-02-10",
        "commit": "abc123",
        "message": "Fix retry logic",
        "relevant": true
      }
    ],
    "codeMatchesAzure": true,
    "codeMatchesSpec": true
  }
}
```

Proceed to Phase 5: Classify.
