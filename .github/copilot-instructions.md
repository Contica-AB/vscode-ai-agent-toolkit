# GitHub Copilot Instructions

This file provides context and guidelines for GitHub Copilot when working in this repository.
Source: [Contica Development Guidelines](https://contica.atlassian.net/wiki/spaces/TSSOTAI/pages/766181379)

---

## Coding Guidelines

### General Rules
- Follow naming conventions aligned with the Contica SSOT (Tools & Blueprints).
- Always parameterize environment-specific values (endpoints, secrets, connection strings).
- Use **Managed Identity** instead of hardcoded credentials — never commit secrets.
- Implement logging and error handling consistently across all integrations.
- Comment code/workflows where business logic is not obvious.
- Avoid duplication — extract reusable components (functions, shared workflows).

### Logic Apps
- Use scopes for error handling.
- Standardize retry policies.
- Tag each workflow with `Owner`, `Environment`, `System`.

### Azure Functions / APIs
- Follow clean code principles.
- Implement structured logging with correlation IDs.
- Handle exceptions gracefully with clear, descriptive error messages.

### Data Factory / Synapse Pipelines
- Parameterize all pipeline configs.
- Store mappings in external files where possible.
- Define a consistent failure/retry strategy.

---

## Repository Structure

```
/Deployment     → Deployment files (YAML / Bicep / Terraform)
/LogicApp       → Logic App contents (workflows)
/FunctionApp    → Function App contents (functions)
/WebApp         → Web app contents
```

- All commits must reference a work item (Jira ID).
- Sensitive files (secrets, keys) must never be committed.

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `develop` | Developer testing only |
| `feature/version/<integration-name>` | New feature work, branched from a release version |
| `hotfix/<id>` | Urgent production fixes |

### Rules
- Always create a PR — peer review is mandatory before merging to `release`, `preprod`, or `main`.
- CI pipeline must pass before merge.
- Enforce code owner approval for critical repos.

### Branch naming examples
```
feature/v1.0/servicebus-dead-letter-handler
feature/v0.01/deplox-macos-setup
hotfix/42
```

---

## Pre-Commit Checklist
- [ ] Code formatted and linted
- [ ] No secrets or hardcoded credentials
- [ ] Logging and error handling in place
- [ ] Unit tests written and passing

## Pre-Merge Checklist
- [ ] Pull request reviewed and approved
- [ ] CI build pipeline passed
- [ ] Documentation updated if needed
