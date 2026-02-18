# SoW Infrastructure Generator - Implementation Changes

## Summary

The implementation agent has been updated to generate **three separate parameters files** (one per environment) instead of a single parameters.json file. The output structure now exactly matches the expected format required by the Bicep template [integrationInfrastructure.Blueprint.bicep](../contica-azure-utils/Bicep/Blueprints/IntegrationInfrastructure/integrationInfrastructure.Blueprint.bicep).

## Key Changes

### 1. Multi-File Output (Previously: Single File)

**Before:**
- Generated one `parameters.json` file with all environments

**After:**
- Generates three separate files:
  - `output/parameters-dev.json` (Dev environment only)
  - `output/parameters-test.json` (Test environment only)
  - `output/parameters-prod.json` (Prod environment only)

**Rationale:** Each environment has its own subscription ID, VNet configuration, and resource set. Separate files allow for environment-specific deployments without filtering at runtime.

### 2. Resource Filtering by Environment

**Before:**
- All resources included in single file, marked with environment property

**After:**
- Each parameters file only includes resources matching that specific environment
- `parameters-dev.json` contains only resources where `environment = "dev"`
- Resources are filtered during generation, not at deployment time

**Rationale:** Simplifies deployment pipeline - each stage uses its corresponding parameters file without additional filtering logic.

### 3. Corrected Parameter Structure

**Before (Incorrect):**
```json
{
  "parameters": {
    "projectMetadata": { "value": {...} },
    "environments": { "value": [...] },
    "logicApps": { "value": [...] }
  }
}
```

**After (Correct):**
```json
{
  "parameters": {
    "commonTags": { "value": {...} },
    "resourceGroupNames": { "value": [...] },
    "commonResources": { "value": {...} },
    "logicAppArray": { "value": [...] }
  }
}
```

**Rationale:** Must match the exact parameter names expected by the Bicep template.

### 4. Resource Array Naming Convention

**Before:**
- `logicApps`, `functionApps`, `storageAccounts`, etc.

**After:**
- `logicAppArray`, `functionAppArray`, `storageAccountArray`, etc.

**Rationale:** Bicep template expects the "Array" suffix on all resource collection parameters.

### 5. Service Plans Location

**Before:**
- Service plans as separate resource arrays

**After:**
- Service plans referenced in `commonResources` object as shared infrastructure
- Fields: `logicAppServicePlanName`, `functionAppServicePlanName`, `webAppServicePlanName` (and their ResourceGroupNames)

**Rationale:** Service plans are pre-existing shared infrastructure, not deployed by this infrastructure template.

### 6. Empty Array Handling

**Before:**
- Included empty arrays `[]` for resource types not present

**After:**
- **Omit parameters entirely** if no resources of that type exist for the environment
- Example: If no Logic Apps in Dev environment, `logicAppArray` parameter is not included in parameters-dev.json

**Rationale:** Reduces file size and makes it clear which resources are actually being deployed.

### 7. Resource Group Names Parameter

**Before:**
- Not clearly defined or missing

**After:**
- `resourceGroupNames` is an array of unique resource group names extracted from all resources in that environment
- Automatically populated by analyzing the `resourceGroupName` field of each resource

**Rationale:** Bicep template needs the list of RGs to create or validate before deploying resources.

### 8. trigger.yml Branch Conditions (CRITICAL FIX)

**Before (Incorrect):**
```yaml
- stage: test
  condition: startsWith(variables['Build.SourceBranch'], 'refs/heads/release/')
- stage: prod
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
```

**After (Correct):**
```yaml
- stage: test
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
- stage: prod
  condition: contains(variables['Build.SourceBranch'], 'refs/heads/release/')
```

**Deployment Flow:**
- **Dev** → `develop` branch
- **Test** → `main` branch
- **Prod** → `release/*` branches

**Rationale:** Standard GitFlow workflow where main is the test/staging branch and release branches trigger production deployments.

### 9. Role Assignment Grouping

**Before:**
- Flat list of role assignments

**After:**
- Grouped by resource group
- Nested structure with `principals` and `assignmentTargets`
- Supports `sharedAssignmentTargets` for resources accessed by multiple principals

**Example Structure:**
```json
{
  "name": "rg-intinfra-dev-assignments",
  "resourceGroupName": "rg-intinfra-dev",
  "principals": [
    {
      "appName": "app01-las",
      "assignmentTargets": [
        {
          "resourceType": "Microsoft.Storage/storageAccounts",
          "resourceName": "storageaccount01",
          "roleDefinitionIds": ["ba92f5b4-2d11-453d-a403-e96b0029c9fe"],
          "childResources": []
        }
      ]
    }
  ],
  "sharedAssignmentTargets": [...]
}
```

**Rationale:** Matches the expected structure in the reference implementation and allows for more efficient role assignment deployment.

### 10. Conditional Private Endpoint Generation

**Before:**
- Generated PEs for all sub-resources regardless of usage

**After:**
- **Storage Accounts:** Only generate PEs for sub-resource types that have items
  - No blob containers → no blob PE
  - No queues → no queue PE
  - No tables → no table PE
  - No file shares → no file share PE
- **Data Factory:** Always generates both `dataFactory` and `portal` PEs when PE is enabled

**Rationale:** Reduces unnecessary infrastructure and deployment complexity.

### 11. Environment-Specific VNet Configuration

**Before:**
- Single VNet configuration for all environments

**After:**
- VNet configuration resolved per environment from `environmentMapping`
- Each environment can have its own VNet resource group and VNet name
- Falls back to `networking` section if environmentMapping doesn't specify

**Rationale:** Environments often have different networking configurations (Dev vs Prod VNets).

### 12. Networking Rules Application

**For Apps (Logic/Function/Web Apps):**
- `Networking = "None"` → `"vnetIntegration": {}`
- `Networking = "Outbound"` → VNet integration only (outbound traffic)
- `Networking = "Secured"` → VNet integration + Private Endpoint (inbound + outbound)

**For Data Resources (Service Bus, Storage, Key Vault):**
- `Private Endpoint = "No"` → `"vnetIntegration": {}`
- `Private Endpoint = "Yes"` → Full private endpoint configuration

**Rationale:** Matches the SoW specification for networking requirements.

## Updated Workflow

### Implementation Agent Execution Steps

1. **Parse Plan** - Read JSON plan from planning agent
2. **Build Common Sections** - Create commonTags and commonResources (same for all environments)
3. **For Each Environment (Dev, Test, Prod)**:
   - Filter resources by environment
   - Extract unique resource group names
   - Transform resource arrays to Bicep format
   - Apply networking rules (None/Outbound/Secured or PE Yes/No)
   - Apply conditional inclusion (omit empty arrays)
   - Transform role assignments (group by RG)
   - Assemble parameters-{env}.json
   - Validate structure against expected output
   - Save file to `output/parameters-{env}.json`
4. **Generate trigger.yml**:
   - Extract pipeline configuration
   - Map environment subscription IDs
   - Apply hardcoded branch rules
   - Save to `output/trigger.yml`
5. **Report to User** - List all 4 generated files

## File Outputs

| File | Purpose | Content |
|------|---------|---------|
| `output/parameters-dev.json` | Dev environment deployment | Dev resources only, Dev subscriptionId, Dev VNet config |
| `output/parameters-test.json` | Test environment deployment | Test resources only, Test subscriptionId, Test VNet config |
| `output/parameters-prod.json` | Prod environment deployment | Prod resources only, Prod subscriptionId, Prod VNet config |
| `output/trigger.yml` | Azure DevOps pipeline | 3 stages (dev/test/prod) with correct branch conditions |

## Validation

A comprehensive validation checklist has been created: [VALIDATION-CHECKLIST.md](./VALIDATION-CHECKLIST.md)

Use this checklist to verify that generated files match the expected structure before deployment.

## Expected vs Actual Output Comparison

### Reference Files
- Expected parameters structure: `output/expected output/parameters.json`
- Expected trigger.yml: `output/expected output/trigger.yml`

### Structural Changes
The generated files should now **exactly match** the structure shown in the expected output folder, with these key differences:
- Three separate parameters files instead of one
- Each parameters file filtered to a single environment
- Resource array naming with "Array" suffix
- Service plans in commonResources
- Correct trigger.yml branch conditions

## Testing Recommendations

1. **Generate from test SoW** - Use a sample SoW to generate files
2. **Compare structures** - Use the validation checklist
3. **Validate JSON** - Ensure all files are syntactically valid
4. **Deploy to Dev** - Test deployment with parameters-dev.json
5. **Check Azure resources** - Verify expected resources are created

## Breaking Changes

⚠️ **These changes are breaking if any downstream processes expect the old format:**

1. Single `parameters.json` no longer generated → now three separate files
2. Parameter names changed (e.g., `logicApps` → `logicAppArray`)
3. `projectMetadata` and `environments` parameters removed
4. trigger.yml branch conditions changed (test→main instead of test→release/*)

**Migration Path:** Update any scripts or processes that reference `parameters.json` to use the environment-specific files instead.

## References

- Bicep Template: [contica-azure-utils/Bicep/Blueprints/IntegrationInfrastructure/integrationInfrastructure.Blueprint.bicep](../contica-azure-utils/Bicep/Blueprints/IntegrationInfrastructure/integrationInfrastructure.Blueprint.bicep)
- Pipeline Template: [contica-azure-utils/Yaml/integrationInfrastructure.Blueprint.yml](../contica-azure-utils/Yaml/integrationInfrastructure.Blueprint.yml)
- Reference Implementation: [general-sandbox-integration-infrastructure/Parameters/Dev/integrationInfrastructure.Blueprint.bicep.parameters.json](../general-sandbox-integration-infrastructure/Parameters/Dev/integrationInfrastructure.Blueprint.bicep.parameters.json)
- Generation Rules: [reference/integration-setup-prompt.md](./reference/integration-setup-prompt.md)

## Next Steps

1. Review the updated [sow-implementation.agent.md](.github/agents/sow-implementation.agent.md)
2. Test with a sample SoW
3. Use [VALIDATION-CHECKLIST.md](./VALIDATION-CHECKLIST.md) to verify output
4. Deploy to a test environment to validate end-to-end workflow
