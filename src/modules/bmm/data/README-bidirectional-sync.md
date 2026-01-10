# Bi-Directional DevOps Integration for BMAD

## Overview

This directory contains the complete infrastructure for bi-directional synchronization between BMAD backlog files and external DevOps systems (Azure DevOps and GitHub Issues).

**Key Capabilities:**
- UUID-based stable identity for all backlog items
- Field-level ownership matrix (BMAD owns execution, DevOps owns coordination)
- Reconciliation workflow for initialization and ongoing sync
- Bot identity setup for secure automated sync
- Operational safeguards (validation, loop prevention, monitoring)

**⚠️ Note:** Webhook receiver is NOT included. Sync from DevOps → BMAD must be triggered manually or via scheduled jobs.

---

## Architecture

```
BMAD YAML Files                          DevOps Systems
(stories/*.md, epics/*.md)              (Azure DevOps / GitHub)
        │                                        │
        │ ← Field Ownership Matrix →            │
        │    (who owns which field)              │
        │                                        │
        ├─── BMAD → DevOps ──────────────────→  │
        │    (status, AC, tasks)                 │
        │                                        │
        │  ← DevOps → BMAD (manual/scheduled) ── │
        │    (assigned_to, iteration, priority)  │
        │                                        │
        └── Reconciliation Layer ────────────────┘
            - UUID matching (bmad_id)
            - Conflict detection
            - Loop prevention
```

---

## Quick Start

### 1. Configure Sprint Status

Edit `sprint-status.yaml`:

```yaml
tracking_system: azure-devops
org_url: https://dev.azure.com/your-org
project: YourProjectName
iteration: "Sprint: ProjectName - Epic 1"
```

### 2. Run Initialization

```bash
# Navigate to BMAD repository
cd /path/to/bmad-repo

# Run bmad-ado-init workflow (via Cursor agent or manually)
# This will:
# - Assign UUIDs to all stories
# - Create/reconcile work items in Azure DevOps
# - Establish sync metadata
```

### 3. Setup Bot Identity (Optional but Recommended)

Follow: `bot-identity-security.md`

Create dedicated sync bot accounts and PATs for:
- Azure DevOps sync bot
- GitHub sync bot
- Git commit bot

### 4. Enable Validation (CI/CD)

Copy validation scripts from `operational-safeguards.md` to your CI pipeline.

---

## File Guide

### Core Configuration

| File | Purpose |
|------|---------|
| `field-ownership-matrix.yaml` | Defines which system owns each field (BMAD vs DevOps) |
| `devops-providers.yaml` | CLI command reference for GitHub and Azure DevOps, including sync commands |

### Documentation

| File | Purpose |
|------|---------|
| `bot-identity-security.md` | Setup guide for bot accounts, PATs, and security |
| `operational-safeguards.md` | Validation rules, reconciliation, monitoring, disaster recovery |

### Workflows

| Directory | Purpose |
|-----------|---------|
| `bmad-ado-init/` | Initialization and reconciliation workflow |

### Templates

| File | Purpose |
|------|---------|
| `create-story/template.md` | Story template with bmad_id, sync metadata, ownership fields |
| `sprint-planning/sprint-status-template.yaml` | Sprint status with sync metadata documentation |

---

## Key Concepts

### 1. Stable Identity (bmad_id)

Every story and epic has a UUID that never changes:

```markdown
<!-- bmad_id: 550e8400-e29b-41d4-a716-446655440000 -->
```

This UUID is stored in Azure DevOps (custom field `BMAD.ID`) or GitHub (tag `bmad:uuid`) for deterministic matching during reconciliation.

### 2. Sync Metadata

Tracks sync state and prevents loops:

```markdown
<!-- sync:
  last_synced_from: ado
  last_synced_at: 2025-01-10T09:30:00Z
  sync_hash: a1b2c3d4e5f6...
-->
```

### 3. Ownership & Leasing

Multi-user coordination via ownership tracking:

```markdown
<!-- owner:
  user: john.doe@company.com
  acquired_at: 2025-01-10T08:00:00Z
  lease_hours: 8
  lease_expires_at: 2025-01-10T16:00:00Z
-->
```

Agents verify ownership before executing tasks.

### 4. Field Ownership

Clear authority per field prevents conflicts:

- **BMAD owns:** status, acceptance_criteria, tasks, dev_notes
- **DevOps owns:** assigned_to, iteration_path, priority, tags
- **Merge fields:** title, description (manual review if both changed)

### 5. Loop Prevention

Three mechanisms prevent sync loops:

1. **Correlation tokens:** UUID markers in DevOps updates
2. **Content hashing:** Skip sync if content unchanged
3. **Timestamp comparison:** Determine which system is newer

---

## Workflows

### Initialization (First Time)

```bash
# 1. Configure tracking_system in sprint-status.yaml
# 2. Run bmad-ado-init workflow
# 3. Verify all stories have bmad_id
# 4. Verify tracking_refs populated in sprint-status.yaml
```

### Ongoing Sync: BMAD → DevOps

```bash
# Automatic during BMAD workflows:
# - sprint-planning creates epics
# - create-story creates work items
# - dev-story links PRs
# - code-review closes items
```

### Ongoing Sync: DevOps → BMAD

```bash
# Manual trigger (webhook receiver not included):
# 1. Run reconciliation script (see operational-safeguards.md)
# 2. Script queries DevOps for updates
# 3. Updates BMAD files based on field ownership
# 4. Commits changes with bot identity

# Can be scheduled (cron, GitHub Actions, Azure Pipelines)
```

### Reconciliation (Fix Drift)

```bash
# Run anytime to rebuild sync state:
bash .bmad/scripts/bmad-reconcile.sh

# Safe to run multiple times (idempotent)
```

---

## Common Scenarios

### Scenario 1: Add New Story Mid-Sprint

**BMAD Side:**
1. Create story file with bmad_id
2. Run create-story workflow
3. Work item auto-created in DevOps
4. tracking_ref stored in sprint-status.yaml

**DevOps Side:**
1. PM creates work item in Azure DevOps UI
2. Run reconciliation script
3. Script creates story file in BMAD
4. bmad_id added to work item

### Scenario 2: User Assigned in DevOps

**DevOps Action:**
- PM assigns story to `john.doe@company.com`

**BMAD Sync (manual trigger):**
```bash
# Reconciliation detects assignment change
# Updates story file owner metadata
# John's agent verifies ownership before executing
```

### Scenario 3: Conflict Detection

**Both systems modified title:**
- BMAD: "User Authentication System"
- DevOps: "User Auth & Authorization"

**Resolution:**
```markdown
<!-- SYNC CONFLICT DETECTED
  field: title
  bmad_value: "User Authentication System"
  devops_value: "User Auth & Authorization"
  resolution: manual_review_required
-->
```

User manually resolves, commits fix.

---

## Security Best Practices

1. **Use bot identities** (not personal accounts)
2. **Minimal PAT scopes** (Work Items Read/Write only)
3. **Rotate PATs every 6 months**
4. **Tag all bot changes** for audit trail
5. **Store PATs in Key Vault/Secrets** (never commit)

See: `bot-identity-security.md`

---

## Validation & Monitoring

### Pre-Commit Validation

```bash
# Validate story schema
bash .bmad/scripts/validate-story-schema.sh stories/1-1-auth.md

# Check sprint status
bash .bmad/scripts/validate-sprint-status.sh
```

### CI/CD Validation

- Block commits with invalid bmad_id format
- Prevent manual edits of sync_hash
- Check for duplicate bmad_ids
- Validate timestamp formats

### Monitoring

```bash
# Check sync health
bash .bmad/scripts/check-sync-health.sh

# Alert on:
# - Stories not synced in 24h
# - Consecutive sync failures
# - Conflicts pending >24h
```

See: `operational-safeguards.md`

---

## Disaster Recovery

### Backup

```bash
# Daily backup of sync state
bash .bmad/scripts/backup-bmad-state.sh
```

### Recovery

```bash
# Lost tracking_refs? Re-run init
bash bmad-ado-init/init.sh

# Corrupted metadata? Restore from backup
cp .bmad/backups/latest/sprint-status.yaml ./
```

---

## Limitations

### What's NOT Included

1. **Webhook Receiver:** No automated DevOps → BMAD sync
   - Must trigger manually or via scheduled job
   - Service hook configuration documented but not implemented

2. **Real-time Sync:** Not continuous synchronization
   - BMAD → DevOps happens during workflows
   - DevOps → BMAD requires manual trigger

3. **Multi-Tenant:** Single BMAD repo ↔ single DevOps project
   - No support for multiple projects/repos in one BMAD instance

### Known Trade-offs

1. **More ceremony:** Requires bmad_id, sync metadata
2. **Manual resolution:** Conflicts need human intervention
3. **Setup complexity:** Bot accounts, PATs, custom fields

---

## Troubleshooting

### Issue: Duplicate work items created

**Cause:** tracking_ref lost or bmad_id not set

**Fix:**
```bash
# Run reconciliation to rebuild mappings
bash .bmad/scripts/bmad-reconcile.sh
```

### Issue: Sync loop detected

**Cause:** Correlation token system failed

**Fix:**
```bash
# Clear correlation tokens
sed -i '/last_sent:/d' sprint-status.yaml

# Wait 1 hour for token expiry
# Resume sync
```

### Issue: Conflict not auto-resolving

**Cause:** Both systems modified same merge field

**Fix:**
```bash
# Manually edit story file
# Choose correct value
# Remove conflict marker
# Commit with: git commit -m "fix: Resolve sync conflict"
```

---

## Next Steps

### Immediate

1. Run bmad-ado-init to establish sync
2. Setup bot identities for automated sync
3. Add CI validation to prevent schema violations

### Short-term

1. Schedule daily reconciliation job
2. Monitor sync health metrics
3. Train team on conflict resolution

### Future Enhancements

1. **Webhook Receiver:** Implement ADO → BMAD real-time sync
2. **Merge Strategies:** Auto-resolve common conflicts
3. **Bulk Operations:** Sync 100+ stories efficiently
4. **Multi-Project:** Support multiple DevOps projects

---

## References

- External Vision: https://github.com/ArthurRedex/BMAD_AD-integration-
- Gap Analysis: See PR #4 description
- Field Ownership: `field-ownership-matrix.yaml`
- Security Guide: `bot-identity-security.md`
- Operations Guide: `operational-safeguards.md`

---

## Support

For questions or issues:
1. Check `operational-safeguards.md` troubleshooting section
2. Review field ownership matrix for conflict resolution
3. Consult bot security guide for authentication issues
4. Open issue in BMAD repository with `devops-sync` label
