# Classification Rules

## Decision Framework

### The Core Question

> **Does the current implementation match the documented requirements?**

| Implementation    | Requirements    | Reporter Expectation | Classification     |
| ----------------- | --------------- | -------------------- | ------------------ |
| Matches spec      | Clear           | Different from spec  | **CHANGE REQUEST** |
| Differs from spec | Clear           | Matches spec         | **BUG**            |
| Matches spec      | Clear           | Matches spec         | **NOT AN ISSUE**   |
| Any               | Missing/Unclear | Any                  | **UNCLEAR**        |

---

## Classification Definitions

### BUG

**Definition**: The system behaves differently than documented in approved requirements.

**Criteria** (ALL must be true):

1. A requirement document exists that specifies expected behavior
2. The current implementation demonstrably differs from that specification
3. The reporter's expected behavior aligns with the documented requirement

**Evidence Required**:

- Link to requirement document with specific quote
- Proof of current behavior (logs, screenshots, test results)
- Comparison showing the discrepancy

**Examples**:

- Spec says "retry 3 times" → Code retries 1 time → BUG
- Spec says "transform field X to Y" → Field X is dropped → BUG
- Spec says "send email on failure" → No email sent on failure → BUG

---

### CHANGE REQUEST (CR)

**Definition**: The system behaves exactly as documented, but the user wants different behavior.

**Criteria** (ALL must be true):

1. A requirement document exists that specifies expected behavior
2. The current implementation matches that specification
3. The reporter wants behavior different from the documented requirement

**Evidence Required**:

- Link to requirement document showing current expected behavior
- Proof that implementation matches the spec
- Clear statement of what the reporter wants instead

**Examples**:

- Spec says "process daily at 8:00" → Runs at 8:00 → User wants 6:00 → CR
- Spec says "retry 3 times" → Code retries 3 times → User wants 5 times → CR
- Spec says "ignore null values" → Nulls ignored → User wants nulls processed → CR

---

### UNCLEAR

**Definition**: Cannot determine classification due to missing, ambiguous, or contradictory information.

**Criteria** (ANY is true):

1. No requirement document can be found
2. Requirement document is ambiguous about this specific behavior
3. Multiple requirement documents contradict each other
4. Cannot verify current implementation behavior
5. Reporter's description is too vague to understand

**Evidence Required**:

- Documentation of search attempts (what was searched, where)
- Quotes showing ambiguity or contradiction (if applicable)
- Specific questions that need answers to proceed

**Examples**:

- No spec found for this integration → UNCLEAR
- Spec says "handle errors appropriately" (too vague) → UNCLEAR
- Spec v1 says X, Spec v2 says Y, no clear supersession → UNCLEAR

---

## Decision Tree

```
START: Receive issue to classify
│
├─1─► Can you find requirements documentation?
│     │
│     ├─ NO ──────────────────────────────────► UNCLEAR
│     │                                         "No requirements found"
│     │
│     └─ YES ─► Does the spec clearly define expected behavior?
│               │
│               ├─ NO (vague/ambiguous) ──────► UNCLEAR
│               │                               "Requirements ambiguous"
│               │
│               └─ YES ─► Can you verify current implementation?
│                         │
│                         ├─ NO ──────────────► UNCLEAR
│                         │                     "Cannot verify implementation"
│                         │
│                         └─ YES ─► Does implementation match spec?
│                                   │
│                                   ├─ NO ────► BUG
│                                   │           "Implementation differs from spec"
│                                   │
│                                   └─ YES ──► Does reporter want spec behavior?
│                                              │
│                                              ├─ YES ─► NOT AN ISSUE
│                                              │         "Working as designed"
│                                              │
│                                              └─ NO ──► CHANGE REQUEST
│                                                        "User wants different behavior"
```

---

## Confidence Scoring

### Point System

| Evidence Type                    | Points | Description                   |
| -------------------------------- | ------ | ----------------------------- |
| Requirements doc found           | +30    | Clear spec document located   |
| Spec clearly defines behavior    | +10    | Behavior explicitly stated    |
| Implementation verified in Azure | +25    | Checked deployed resources    |
| Code reviewed                    | +25    | Verified source code behavior |
| Related issues found             | +5     | Context from similar issues   |
| Error logs available             | +5     | Runtime evidence              |

### Confidence Levels

| Score   | Level  | Recommendation                                   |
| ------- | ------ | ------------------------------------------------ |
| 80-100% | High   | Classification reliable, proceed with confidence |
| 50-79%  | Medium | Some evidence missing, note limitations          |
| <50%    | Low    | Recommend manual review before acting            |

---

## Edge Cases

### Multiple Requirements Documents

- Use the most recent approved version
- If versioning unclear → UNCLEAR with note about contradiction

### Spec Changed After Implementation

- Compare against spec that was active when feature was implemented
- Note if spec has since changed (may indicate legitimate CR was not tracked)

### Verbal/Informal Requirements

- Do not count verbal agreements as "documented requirements"
- If only verbal exists → UNCLEAR (recommend documenting requirements)

### Third-Party Changes

- If issue caused by external system change → Check if our spec assumed specific external behavior
- If spec assumed wrong external behavior → BUG in our spec (still technically BUG)
- If external change is new → CR to adapt

---

## Anti-Patterns

### Do NOT classify as BUG when:

- ❌ User simply doesn't like the behavior
- ❌ User's expectation is undocumented
- ❌ Implementation matches spec but user wants more
- ❌ Competitor does it differently

### Do NOT classify as CR when:

- ❌ Implementation clearly violates documented spec
- ❌ There's an actual error/exception
- ❌ Data is being corrupted or lost

### Do NOT classify as UNCLEAR when:

- ❌ You just haven't searched hard enough
- ❌ Classification is merely difficult
- ❌ You want to avoid controversy
