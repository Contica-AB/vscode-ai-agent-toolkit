# Phase 3: Check Implementation

> **Purpose**: Verify the current implementation behavior against requirements.
> **Input**: Requirements from Phase 2.
> **Output**: Implementation evidence showing what the system actually does.

---

## Instructions for Agent

### Step 1: Identify Resources to Check

Based on the issue and requirements, determine which Azure resources to inspect:

```
Based on the issue, I should check these resources:

From issue/requirements mentions:
- [Resource name if mentioned]
- [Integration name if mentioned]

Would you like me to:
1. Search for resources by name pattern
2. Check specific resources you provide
3. Search within a specific resource group
```

### Step 2: Discover Relevant Resources

If searching by pattern:

```javascript
// Using Azure MCP - query resources
query_azure_resource_graph({
  query: `
    Resources
    | where type in~ ('microsoft.logic/workflows', 'microsoft.web/sites', 'microsoft.servicebus/namespaces')
    | where name contains '[search term]'
    | project name, type, resourceGroup, location
  `,
});
```

Present findings:

```
I found these potentially relevant resources:

| # | Resource | Type | Resource Group |
|---|----------|------|----------------|
| 1 | la-order-sync-prod | Logic App | rg-integration-prod |
| 2 | func-order-processor | Function App | rg-integration-prod |
| 3 | sb-orders | Service Bus | rg-integration-prod |

Which should I inspect?
1. All of them
2. Select specific ones: [user picks]
3. None of these - let me specify
```

### Step 3: Inspect Each Resource

#### For Logic Apps:

```javascript
// Get workflow definition
get_workflow_definition({
  logicAppName: "[name]",
  resourceGroup: "[rg]",
});

// Get recent run history
list_run_history({
  logicAppName: "[name]",
  resourceGroup: "[rg]",
  filter: "status eq 'Failed' or status eq 'Succeeded'",
  top: 20,
});
```

Document:

- Trigger type and configuration
- Key actions and their configuration
- Error handling patterns
- Recent run status (success/failure rate)

#### For Function Apps:

```javascript
// Get function app details
// Use Azure MCP to check configuration
```

Document:

- App settings relevant to the behavior
- Scaling configuration
- Recent invocation logs (if Application Insights connected)

#### For Service Bus:

```javascript
// Get queue/topic configuration
// Check dead-letter queue counts
```

Document:

- Queue/topic configuration
- Message count and DLQ status
- Subscription filters (if topic)

### Step 4: Check Run History for Issues

If the reported issue mentions specific failures:

```javascript
// Search for failed runs around the time mentioned in the issue
list_run_history({
  filter: "startTime ge [date] and status eq 'Failed'",
});

// Get details of specific run
get_run_details({ runId: "[id]" });

// Get action-level details
get_action_io({ runId: "[id]", actionName: "[action]" });
```

### Step 5: Compare Implementation to Requirements

For each requirement, document the implementation:

```markdown
### Implementation Verification

#### Requirement 1: "[Quote from spec]"

**Resource checked**: la-order-sync-prod
**Verification method**: Workflow definition review
**Implementation**:

- Trigger: Recurrence, every 15 minutes
- Action: HTTP GET to /api/orders
- Transform: Maps OrderId → order_number

**Matches spec?**: ✓ Yes / ✗ No

**Evidence**:

- Definition shows: [screenshot/quote from definition]
- Run history shows: [X successful runs in last 24h]

#### Requirement 2: "[Quote from spec]"

**Resource checked**: [resource]
**Implementation**: [what it does]
**Matches spec?**: [Yes/No]
```

### Step 6: Document Current Behavior

Create a clear summary of what the system actually does:

```markdown
### Current Implementation Summary

**Integration**: [Name]
**Primary Resource**: [Resource name with link]
**Last Verified**: [Timestamp]

#### Behavior Flow

1. **Trigger**: [How/when it starts]
2. **Input**: [What data it receives]
3. **Processing**: [What transformations/logic it applies]
4. **Output**: [What it produces/where it sends data]
5. **Error Handling**: [How errors are handled]

#### Recent Execution Status

| Metric        | Value                |
| ------------- | -------------------- |
| Last 24h runs | [count]              |
| Success rate  | [%]                  |
| Last failure  | [timestamp or "N/A"] |
| Avg duration  | [time]               |
```

### Step 7: Identify Discrepancies

If implementation differs from spec:

```markdown
### Discrepancies Found

| Aspect      | Spec Says       | Implementation Does | Gap                |
| ----------- | --------------- | ------------------- | ------------------ |
| Retry count | 3 retries       | 1 retry             | BUG candidate      |
| Timeout     | 30 seconds      | 60 seconds          | May be intentional |
| Error email | Send on failure | No email action     | BUG candidate      |
```

---

## If Cannot Verify Implementation

### Resource Not Found

```
I couldn't find resources matching "[search terms]".

Possible reasons:
- Different subscription needed
- Resource has been deleted
- Different naming convention

Options:
1. Search in different subscription
2. Provide exact resource name
3. Mark as "cannot verify implementation"
```

### No Access to Resource

```
I found the resource but cannot access its details.

Error: [error message]

Options:
1. Request access and try again
2. Use alternative verification (code review?)
3. Mark as "cannot verify implementation"
```

### Resource Exists But No Recent Activity

```
Resource [name] exists but has no recent runs.

Last run: [date] or Never

This integration may be:
- Disabled
- Triggered by external events (waiting for trigger)
- Deprecated

Options:
1. Check trigger configuration
2. Manually trigger a test run
3. Proceed with definition review only (no runtime evidence)
```

---

## Edge Cases

### Implementation Changed Recently

```
I noticed the workflow was modified on [date], after the issue was reported.

The current implementation may not reflect what was running when the issue occurred.

Should I:
1. Check version history for previous definition
2. Compare current vs. previous implementation
3. Use current implementation (it's what matters now)
```

### Multiple Environments

```
I found similar resources in multiple environments:

| Environment | Resource | Last Modified |
|-------------|----------|---------------|
| prod | la-order-sync-prod | 2026-01-15 |
| test | la-order-sync-test | 2026-02-10 |
| dev | la-order-sync-dev | 2026-02-11 |

Which environment is relevant to this issue?
```

---

## Output

Save to session state:

```json
{
  "implementation": {
    "verified": true,
    "resources": [
      {
        "name": "la-order-sync-prod",
        "type": "Logic App",
        "resourceGroup": "rg-integration-prod",
        "verificationMethod": "workflow definition + run history",
        "currentBehavior": "...",
        "matchesSpec": true,
        "evidence": {
          "definitionReviewed": true,
          "runHistoryChecked": true,
          "lastRun": "2026-02-12T10:00:00Z",
          "successRate": 98.5
        }
      }
    ],
    "discrepancies": [],
    "limitations": []
  }
}
```

Proceed to Phase 4: Check Code (optional) or Phase 5: Classify.
