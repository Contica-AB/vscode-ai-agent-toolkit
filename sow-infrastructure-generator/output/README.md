# Expected Output Reference

This folder contains reference output files that demonstrate the expected structure for generated infrastructure deployment files.

## Reference Files

- **parameters.json** - Example structure for per-environment parameter files
- **trigger.yml** - Example Azure DevOps pipeline structure

## Actual Output Location

When the SoW Infrastructure Agent runs, it generates files in the **target workspace** (not this folder):

```
<target-workspace-root>/
└── Deployment/
    ├── parameters-dev.json      # Dev environment parameters
    ├── parameters-test.json     # Test environment parameters
    ├── parameters-prod.json     # Prod environment parameters
    └── trigger.yml              # Azure DevOps pipeline
```

Each parameters file is filtered to only contain resources for that specific environment.

## Using These References

- Use `parameters.json` to understand the expected structure and required fields
- Use `trigger.yml` to verify pipeline stages, branch conditions, and template references
- Compare generated files against these references for validation
