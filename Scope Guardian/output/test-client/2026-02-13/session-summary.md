# Session Summary

**Client**: Test Client  
**Date**: 2026-02-13  
**Agent**: Scope Guardian  
**Duration**: ~15 minutes

---

## Session Configuration

### Tools Used

| Tool         | Instance/Account      | Status      |
| ------------ | --------------------- | ----------- |
| Atlassian    | example.atlassian.net | ✓ Connected |
| Azure        | contoso-prod          | ✓ Connected |
| Azure DevOps | (skipped)             | -           |
| GitHub       | (skipped)             | -           |
| Logic Apps   | contoso-prod          | ✓ Connected |

---

## Issues Classified

| Issue    | Type (reported) | Classification     | Confidence |
| -------- | --------------- | ------------------ | ---------- |
| PROJ-123 | Bug             | **CHANGE REQUEST** | 85%        |

---

## Key Findings

1. **PROJ-123**: Reporter expected real-time order sync, but specification clearly defines 15-minute polling interval

---

## Actions Taken

- [x] Loaded issue from Jira
- [x] Found requirements in Confluence
- [x] Verified implementation in Azure
- [x] Generated classification report
- [ ] Updated issue with classification (user skipped)

---

## Files Generated

- `PROJ-123-classification.md` - Full classification report
- `PROJ-123-evidence.md` - Evidence collection details
- `session-summary.md` - This file
