# Phase Selection (Interactive)

## Objective

Present the user with assessment phase options and record their selection. This step runs after Phase 0 (Preflight) passes and before Phase 1 (Discovery) begins.

---

## Phase Reference

| Phase | Key | Label | Selectable? |
|-------|-----|-------|-------------|
| 0 | `preflight` | Preflight Validation | No (always runs) |
| 1 | `inventory` | Resource Discovery | No (always runs) |
| 2 | `integration-services-deep-dive` | Integration Services Deep Dive | Yes |
| 3 | `failure-patterns` | Failure Analysis | Yes |
| 4 | `security` | Security Audit | Yes |
| 5 | `dead-flows` | Unused Resource Detection | Yes |
| 6 | `monitoring-gaps` | Monitoring & Observability Gaps | Yes |
| 7 | `naming-tagging` | Naming & Tagging Compliance | Yes |
| 8 | `report` | Report Generation | Auto (if any 2-7 selected) |
| 9 | `sales-opportunities` | Sales Opportunities | Auto (if Phase 8 + config flag) |

---

## Presets

| Preset | Code | Phases Included | Description |
|--------|------|----------------|-------------|
| Full Assessment | A | 2, 3, 4, 5, 6, 7 | Complete assessment. Best for first-time clients. |
| Security Focus | B | 4 | Security audit only. Quick turnaround. |
| Quick Health Check | C | 3, 5, 6 | Failure analysis, dead flows, monitoring gaps. |
| Compliance Review | D | 4, 6, 7 | Security + monitoring + naming/tagging. |
| Custom | E | User picks | Individual phase selection. |

All presets automatically include Phase 0, 1, and 8. Phase 9 is included if `salesOpportunities.includeInReport` is true in client config.

---

## Validation Rules

1. **Phase 0 and Phase 1 are mandatory** -- always run, not presented as choices.
2. **At least one analysis phase (2-7) must be selected** -- the agent cannot proceed with zero analysis phases.
3. **Phase 8 (Report) is auto-included** when any analysis phase is selected.
4. **Phase 9 (Sales Opportunities)** is auto-included only when:
   - Phase 8 is included (always true if any analysis phase is selected), AND
   - `salesOpportunities.includeInReport` is `true` in client config.
   - If both conditions are met, ask the user to confirm: "Sales opportunities are enabled in your config. Include them in this run?"
5. **Cannot select only Phase 8 or 9** without at least one analysis phase.

---

## Prompt

```
Preflight validation passed. Before starting the assessment, I need to know which phases you want to run.

### Step 1: Read Client Config

Read the client config to check:
- `salesOpportunities.includeInReport` (determines Phase 9 availability)
- `focusAreas` (existing defaults, if any)

### Step 2: Present Phase Selection

Display this to the user:

---

Phases 0 (Preflight) and 1 (Discovery) always run automatically.

Choose a preset or select individual phases:

**Presets:**

| Option | Preset | Phases | Description |
|--------|--------|--------|-------------|
| A | Full Assessment | 2-7 | All analysis phases. Best for first-time clients. |
| B | Security Focus | 4 | Security audit only. Quick turnaround. |
| C | Quick Health Check | 3, 5, 6 | Failures, dead flows, monitoring. |
| D | Compliance Review | 4, 6, 7 | Security, monitoring, naming/tagging. |
| E | Custom | You pick | Select individual phases below. |

Which option? (A / B / C / D / E)

---

### Step 3: Handle Custom Selection

If the user picks **E (Custom)**, present the individual phases:

---

Select which analysis phases to include (at least one required):

| # | Phase | Description |
|---|-------|-------------|
| 2 | Integration Services Deep Dive | Workflow definitions, connectors, patterns for all resource types |
| 3 | Failure Analysis | Error patterns, DLQ analysis, root causes across all resources |
| 4 | Security Audit | Authentication, network, secrets, RBAC compliance |
| 5 | Unused Resource Detection | Dead flows, inactive resources, decommission candidates |
| 6 | Monitoring & Observability | Diagnostic settings, alerts, dashboards, log coverage |
| 7 | Naming & Tagging Compliance | Convention adherence, tag coverage, consistency |

Enter phase numbers separated by commas (e.g., 3, 4, 6):

---

### Step 4: Validate Selection

- If the user enters no phases or invalid numbers: "You must select at least one analysis phase (2-7). Please try again."
- If all numbers are valid and at least one is present: proceed to Step 5.

### Step 5: Handle Phase 9

Check `salesOpportunities.includeInReport` in the client config:

- If `true`: Ask the user: "Sales opportunities are enabled in your config. Include Phase 9 (Sales Opportunities) in this run? (Y/N)"
- If `false`: Phase 9 is not included. Do not ask.

### Step 6: Confirm Selection

Display the full assessment plan to the user:

---

**Assessment Plan:**

ALWAYS RUN:
- Phase 0: Preflight Validation -- DONE
- Phase 1: Resource Discovery -- NEXT

SELECTED ANALYSIS:
- Phase {N}: {Name} -- QUEUED
- ...

SKIPPED:
- Phase {N}: {Name} -- SKIPPED
- ...

AUTO-INCLUDED:
- Phase 8: Report Generation -- QUEUED
- Phase 9: Sales Opportunities -- QUEUED / SKIPPED

Proceed with this plan? (Y/N)

---

If the user says **N**: Go back to Step 2 and let them re-select.
If the user says **Y**: Proceed to Step 7.

### Step 7: Save Selection to Client Config

Update the client config file (`/clients/{client}/config.json`) with:

```json
"selectedPhases": {
  "preset": "{preset-name}",
  "phases": [0, 1, {selected}, 8, 9],
  "skipped": [{not-selected}],
  "selectedAt": "{ISO-8601 timestamp}"
}
```

Also update the `focusAreas` array to match the selection:
- Include only the focus area keys for selected phases
- Always include `preflight` and `inventory`
- Include `report` if Phase 8 is included
- Include `sales-opportunities` if Phase 9 is included

### Step 8: Transition to Phase 1

Say: "Phase selection saved. Starting Phase 1: Resource Discovery."

Proceed to execute Phase 1, then continue with only the selected phases in order.
```

---

## Output

The agent saves the selection to the client config's `selectedPhases` field and updates `focusAreas`.

No separate output file is generated. The selection is recorded in:
1. The client config (`selectedPhases` object)
2. The preflight validation report (appended as "Assessment Scope" section)

---

## Next Step

After phase selection completes, proceed to **Phase 1: Resource Discovery** (`/prompts/01-inventory.md`).

Then execute only the selected phases in numerical order, skipping any phase not in `selectedPhases.phases`.
