# Phase 2: Find Requirements

> **Purpose**: Locate the original requirements/specification for the reported behavior.
> **Input**: Issue summary from Phase 1.
> **Output**: Requirements documentation (or confirmation none exists).

---

## Instructions for Agent

### Step 1: Ask for Requirements Location Hints

```
Where might I find the requirements for this feature/integration?

Options:
1. Search Confluence (I'll search the space you specified)
2. Check linked documents in the issue
3. Search Azure DevOps work items
4. You tell me where to look
5. I don't know - please search broadly
```

### Step 2: Check Issue Links First

Before searching, check if the issue already links to requirements:

#### For Jira Issues:

```javascript
// Check issue links
getJiraIssueRemoteIssueLinks({ issueIdOrKey: "[key]" });

// Check parent epic/story
// (parent often contains requirements)
```

Look for:

- Links labeled "implements", "relates to", "specification"
- Parent epic with requirements
- Attachments that are spec documents

#### For ADO Work Items:

```javascript
// Check related links
get_work_item({ workItemId: [id], expand: "relations" });
```

Look for:

- Parent user story/PBI with acceptance criteria
- Links to wiki pages
- Links to SharePoint/Confluence

### Step 3: Search Confluence

If Atlassian is available:

```javascript
// Extract key terms from issue
const searchTerms = extractKeyTerms(issue.title, issue.description);

// Search Confluence
searchConfluenceUsingCql({
  cql: `text ~ "${searchTerms}" AND space = "${spaceKey}"`,
});
```

Search strategies:

1. Integration/feature name
2. System names mentioned
3. Keywords from issue description
4. Reporter's expected behavior

### Step 4: Search Azure DevOps Wiki/Repos

If ADO is available:

```javascript
// Search wiki
search_wiki({
  searchText: "[search terms]",
  project: "[project]",
});

// Search for related PBIs/User Stories
searchWorkItems({
  query:
    "SELECT [System.Id], [System.Title] FROM workitems WHERE [System.Title] CONTAINS '[search terms]'",
});
```

### Step 5: Evaluate Results

For each potential requirements document found:

```markdown
### Requirements Search Results

| #   | Source       | Title                     | Relevance | Status     |
| --- | ------------ | ------------------------- | --------- | ---------- |
| 1   | Confluence   | INT-OrderSync-Spec        | High      | ✓ Approved |
| 2   | ADO PBI-4567 | Order Sync Integration    | Medium    | Closed     |
| 3   | Confluence   | Order Processing Overview | Low       | Draft      |
```

### Step 6: Extract Relevant Requirements

For the most relevant document(s):

```javascript
// Fetch full content
getConfluencePage({ pageId: "[id]" });
```

Extract:

- Exact quotes relevant to the reported behavior
- Version/date of document
- Approval status
- Author/owner

```markdown
### Requirements Found

**Document**: [Title]
**Source**: [Confluence/ADO/etc.]
**Link**: [URL]
**Version**: [Date or version number]
**Status**: [Approved/Draft/Superseded]

#### Relevant Sections

> "[Exact quote from document describing expected behavior]"
> — Section: [Section name], Page: [Page number if applicable]

> "[Another relevant quote]"
> — Section: [Section name]
```

### Step 7: Confirm with User

```
I found these requirements that may apply:

1. **[Document title]** ([link])
   Quote: "[brief quote]"
   Relevance: [Why this seems relevant]

2. **[Second document]** ([link])
   Quote: "[brief quote]"
   Relevance: [Why this seems relevant]

Are these the correct requirements?
1. Yes, #1 is the main spec
2. Yes, both are relevant
3. No, let me point you to the right document
4. There are no requirements documented (proceed as UNCLEAR)
```

---

## If No Requirements Found

### After Exhaustive Search:

```markdown
### Requirements Search - No Results

I searched the following locations and found no relevant requirements:

| Location           | Search Terms               | Results                  |
| ------------------ | -------------------------- | ------------------------ |
| Confluence [SPACE] | "order sync"               | 0 relevant               |
| Confluence [SPACE] | "integration requirements" | 3 unrelated              |
| ADO Wiki           | "order processing"         | 0 results                |
| ADO Work Items     | "order sync"               | 2 closed items, no specs |

**Conclusion**: No documented requirements found for this behavior.
```

Present options to user:

```
I couldn't find documented requirements for this feature.

Options:
1. Mark as UNCLEAR (no spec to compare against)
2. Help me find the spec (provide link or more search hints)
3. Interview stakeholders to discover verbal requirements
4. Treat current behavior as de-facto specification
```

---

## Edge Cases

### Multiple Conflicting Specs

```
I found multiple documents that appear to conflict:

**Spec A** ([link]) says: "[quote]"
**Spec B** ([link]) says: "[different quote]"

Which should I use as the authoritative source?
1. Spec A (it's newer/approved/etc.)
2. Spec B
3. Mark as UNCLEAR due to conflicting specs
```

### Spec is Too Vague

```
I found a specification, but it's vague about this specific behavior:

**Document**: [link]
**Quote**: "The system should handle orders appropriately"

This doesn't specify [the exact behavior in question].

Options:
1. Mark as UNCLEAR (spec doesn't define expected behavior)
2. Infer meaning from context (lower confidence)
3. Check if there's a more detailed spec
```

### Spec is Outdated

```
The most recent spec I found is from [date].
The issue mentions changes that may have happened after that.

Should I:
1. Use this spec (it's still the official requirement)
2. Search for updated documentation
3. Mark requirement status as uncertain
```

---

## Output

Save to session state:

```json
{
  "requirements": {
    "found": true,
    "documents": [
      {
        "title": "...",
        "source": "confluence",
        "url": "...",
        "version": "...",
        "status": "approved",
        "relevantQuotes": [
          {
            "text": "...",
            "section": "..."
          }
        ]
      }
    ],
    "searchAttempts": [{ "location": "...", "terms": "...", "results": 0 }],
    "conflicts": false,
    "userConfirmed": true
  }
}
```

Proceed to Phase 3: Check Implementation.
