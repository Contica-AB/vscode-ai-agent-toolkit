# Phase 5: Classify

> **Purpose**: Compare all evidence and determine classification.
> **Input**: Evidence from Phases 1-4.
> **Output**: Classification with confidence score and full report.

---

## Instructions for Agent

### Step 1: Gather All Evidence

Compile findings from all phases:

```markdown
### Evidence Summary

#### From Phase 1: Issue

- Issue: [KEY] - [Title]
- Reported problem: [summary]
- Expected behavior: [per reporter]

#### From Phase 2: Requirements

- Requirements found: Yes/No
- Document: [link]
- Key quote: "[quote]"

#### From Phase 3: Implementation

- Resources checked: [list]
- Current behavior: [summary]
- Matches spec: Yes/No/Partially

#### From Phase 4: Code (if performed)

- Code reviewed: Yes/No
- Findings: [summary]
```

### Step 2: Apply Decision Tree

Follow the classification rules from `/methodology/classification-rules.md`:

```
┌─ Requirements found?
│
├─ NO → UNCLEAR ("No documented requirements")
│
└─ YES → Spec clearly defines behavior?
         │
         ├─ NO → UNCLEAR ("Requirements ambiguous")
         │
         └─ YES → Implementation verified?
                  │
                  ├─ NO → UNCLEAR ("Cannot verify implementation")
                  │
                  └─ YES → Implementation matches spec?
                           │
                           ├─ NO → BUG ("Implementation differs from spec")
                           │
                           └─ YES → Reporter wants spec behavior?
                                    │
                                    ├─ YES → NOT AN ISSUE ("Working as designed")
                                    │
                                    └─ NO → CHANGE REQUEST ("User wants different behavior")
```

### Step 3: Calculate Confidence Score

| Evidence                         | Points | This Case          |
| -------------------------------- | ------ | ------------------ |
| Requirements doc found           | +30    | [Yes: +30 / No: 0] |
| Spec clearly defines behavior    | +10    | [Yes: +10 / No: 0] |
| Implementation verified in Azure | +25    | [Yes: +25 / No: 0] |
| Code reviewed                    | +25    | [Yes: +25 / No: 0] |
| Related issues found             | +5     | [Yes: +5 / No: 0]  |
| Error logs available             | +5     | [Yes: +5 / No: 0]  |
| **Total**                        |        | **[X]%**           |

### Step 4: Document Reasoning

Write explicit reasoning for the classification:

```markdown
### Classification Reasoning

**Classification**: [BUG / CHANGE REQUEST / UNCLEAR]
**Confidence**: [X]%

#### Step-by-step reasoning:

1. **Requirements check**:
   - Found specification in [document] dated [date]
   - Spec says: "[quote]"
   - Spec is [clear/ambiguous] about [specific behavior]

2. **Implementation check**:
   - Verified [resource] in Azure
   - Current behavior: [description]
   - This [matches/differs from] the specification

3. **Comparison**:
   - Spec says: [A]
   - Implementation does: [B]
   - Reporter expected: [C]
   - [A equals B but not C] → CHANGE REQUEST

4. **Conclusion**:
   [1-2 sentence summary of why this classification]
```

### Step 5: Generate Full Report

Create the classification report:

```markdown
## Classification Report

---

### Classification: [BUG | CHANGE REQUEST | UNCLEAR]

**Confidence**: [X]%
**Issue**: [KEY] ([link])
**Classified by**: Scope Guardian Agent
**Date**: [ISO date]

---

### Summary

[2-3 sentence summary of the classification and why]

---

### Reported Issue

**Reporter claims**: [What the reporter says is wrong]

**Reporter expects**: [What behavior the reporter wants]

---

### Evidence

#### Requirements

| Document | Link  | Status           |
| -------- | ----- | ---------------- |
| [Title]  | [URL] | [Approved/Draft] |

**Relevant specification**:

> "[Exact quote from requirements document]"

#### Implementation

| Resource | Type   | Behavior       | Matches Spec |
| -------- | ------ | -------------- | ------------ |
| [name]   | [type] | [what it does] | [Yes/No]     |

**Verification details**:

- Checked via: [MCP tool used]
- Last run: [timestamp]
- Success rate: [%]

#### Code (if reviewed)

| File   | Finding          |
| ------ | ---------------- |
| [path] | [what code does] |

---

### Reasoning

1. [First reasoning step]
2. [Second reasoning step]
3. [Conclusion]

---

### Limitations

[Note any gaps in evidence or confidence limitations]

- [ ] [Limitation 1]
- [ ] [Limitation 2]

---

### Accounts Used (Audit Trail)

| Tool   | Instance/Account | Timestamp |
| ------ | ---------------- | --------- |
| [Tool] | [instance]       | [time]    |

---

### Recommended Actions

- [ ] Add label: `[classification-label]`
- [ ] Add comment with findings to issue
- [ ] Link to related issues: [list if any]
- [ ] [Other recommendations]
```

### Step 6: Present to User

```
## Classification Complete

**[KEY]**: **[CHANGE REQUEST / BUG / UNCLEAR]**
Confidence: [X]%

**Summary**: [1-2 sentence explanation]

**Key evidence**:
- Spec: "[brief quote]"
- Implementation: [matches/differs]
- Conclusion: [brief reasoning]

Would you like to:
1. See full report
2. Proceed to update the issue
3. Challenge this classification (provide more info)
4. Save report and finish
```

---

## Edge Cases

### Low Confidence Classification

If confidence < 50%:

```
⚠️ Low confidence classification: [X]%

I'm classifying this as [CLASSIFICATION], but with significant uncertainty.

Missing evidence:
- [What's missing]

Recommendation: Manual review before acting on this classification.

Options:
1. Accept with noted limitations
2. Gather more evidence
3. Mark as UNCLEAR instead
```

### Classification Could Go Either Way

```
This is a borderline case. Evidence supports both interpretations:

**As BUG**:
- [Reasoning]

**As CHANGE REQUEST**:
- [Reasoning]

My recommendation: [CLASSIFICATION] based on [key deciding factor]

Do you agree, or should I classify differently?
```

### NOT AN ISSUE Result

```
Based on the evidence, this doesn't appear to be an issue:

- Spec says: [X]
- Implementation does: [X]
- Reporter expected: [X too]

The system is working as designed AND as the reporter expected.

Possible explanations:
1. Issue was already fixed
2. Misunderstanding that was clarified
3. Cannot reproduce

Options:
1. Classify as "NOT AN ISSUE" / "Cannot Reproduce"
2. Request more info from reporter
3. Re-check with different evidence
```

---

## Output

Save to session state and file:

```json
{
  "classification": {
    "result": "CHANGE_REQUEST",
    "confidence": 85,
    "reasoning": "...",
    "evidenceSummary": {
      "requirementsFound": true,
      "implementationVerified": true,
      "codeReviewed": true,
      "matchesSpec": true,
      "reporterWantsDifferent": true
    },
    "reportPath": "/output/[client]/[date]/[issue-key]-classification.md"
  }
}
```

Save report to `/output/{client}/{YYYY-MM-DD}/{issue-key}-classification.md`

Proceed to Phase 6: Update Issue.
