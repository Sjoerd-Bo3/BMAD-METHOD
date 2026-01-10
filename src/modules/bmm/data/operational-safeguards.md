# Operational Safeguards for Bi-Directional Sync

## Overview

This document defines validation rules, reconciliation processes, and operational safeguards to ensure reliable bi-directional synchronization between BMAD and DevOps systems.

## Validation Rules

### 1. YAML Schema Validation

**Story File Validation:**

```yaml
# Required fields
- bmad_id: Must be valid UUID v4 format
- status: Must be one of [backlog, ready-for-dev, in-progress, review, done]
- title: Non-empty string
- acceptance_criteria: Array with at least 1 item

# Sync metadata (if present)
sync:
  last_synced_from: Must be [repo, ado, github, manual]
  last_synced_at: Must be valid ISO 8601 timestamp
  sync_hash: Must be 64-character hex string (SHA256)

# Ownership metadata (if present)
owner:
  user: Non-empty string (email or username)
  acquired_at: Must be valid ISO 8601 timestamp
  lease_hours: Must be positive integer
  lease_expires_at: Must be > acquired_at

# DevOps references (if present)
ado_id: Must be positive integer
github_issue: Must be positive integer
```

**Validation Script:**

```bash
#!/bin/bash
# validate-story-schema.sh

story_file="$1"

# Check bmad_id format
bmad_id=$(grep -oP '<!-- bmad_id: \K[a-f0-9-]+' "$story_file")
if ! echo "$bmad_id" | grep -qE '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'; then
  echo "❌ Invalid bmad_id format: $bmad_id"
  exit 1
fi

# Check sync metadata if present
if grep -q "<!-- sync:" "$story_file"; then
  # Validate last_synced_from
  synced_from=$(grep -oP 'last_synced_from: \K\w+' "$story_file")
  if [[ ! "$synced_from" =~ ^(repo|ado|github|manual)$ ]]; then
    echo "❌ Invalid last_synced_from: $synced_from"
    exit 1
  fi
  
  # Validate last_synced_at timestamp
  synced_at=$(grep -oP 'last_synced_at: \K[^-]+' "$story_file")
  if ! date -d "$synced_at" &>/dev/null; then
    echo "❌ Invalid last_synced_at timestamp: $synced_at"
    exit 1
  fi
fi

echo "✅ Story schema valid: $story_file"
```

### 2. Sprint Status Validation

**Sprint-status.yaml validation:**

```bash
#!/bin/bash
# validate-sprint-status.sh

sprint_status="sprint-status.yaml"

# Check required fields
required_fields=("tracking_system" "project" "story_location")
for field in "${required_fields[@]}"; do
  if ! grep -q "^${field}:" "$sprint_status"; then
    echo "❌ Missing required field: $field"
    exit 1
  fi
done

# Validate tracking_system
tracking_system=$(grep -oP '^tracking_system: \K\S+' "$sprint_status")
if [[ ! "$tracking_system" =~ ^(file-system|github-issues|azure-devops)$ ]]; then
  echo "❌ Invalid tracking_system: $tracking_system"
  exit 1
fi

# Validate provider-specific fields
if [ "$tracking_system" = "azure-devops" ]; then
  if ! grep -q "^org_url:" "$sprint_status" || ! grep -q "^project:" "$sprint_status"; then
    echo "❌ Azure DevOps requires org_url and project fields"
    exit 1
  fi
fi

if [ "$tracking_system" = "github-issues" ]; then
  if ! grep -q "^repo:" "$sprint_status"; then
    echo "❌ GitHub Issues requires repo field"
    exit 1
  fi
fi

echo "✅ Sprint status valid"
```

### 3. CI/CD Validation (GitHub Actions)

**.github/workflows/validate-bmad.yml:**

```yaml
name: Validate BMAD Schema

on:
  push:
    paths:
      - 'stories/**/*.md'
      - 'sprint-status.yaml'
      - 'epics/**/*.md'
  pull_request:
    paths:
      - 'stories/**/*.md'
      - 'sprint-status.yaml'
      - 'epics/**/*.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate story files
        run: |
          for story in stories/*.md; do
            bash .bmad/scripts/validate-story-schema.sh "$story" || exit 1
          done
      
      - name: Validate sprint status
        run: |
          bash .bmad/scripts/validate-sprint-status.sh || exit 1
      
      - name: Check for sync metadata conflicts
        run: |
          # Prevent manual edits of sync metadata
          if git diff HEAD~1 -- stories/ | grep -E '^\+.*sync_hash:'; then
            echo "❌ Manual edit of sync_hash detected - use sync workflow"
            exit 1
          fi
      
      - name: Validate bmad_id uniqueness
        run: |
          # Extract all bmad_ids and check for duplicates
          bmad_ids=$(grep -rh 'bmad_id:' stories/ epics/ | sort)
          duplicates=$(echo "$bmad_ids" | uniq -d)
          if [ -n "$duplicates" ]; then
            echo "❌ Duplicate bmad_id found:"
            echo "$duplicates"
            exit 1
          fi
```

---

## Loop Prevention Mechanisms

### 1. Correlation Tokens

**Purpose**: Prevent sync loops when both systems trigger updates

**Implementation:**

```bash
# Generate correlation token
correlation_token=$(uuidgen)

# BMAD → ADO sync
az boards work-item update --id {{work_item_id}} \
  --discussion "[bmad-sync-${correlation_token}]" \
  --org {{org_url}}

# ADO → BMAD sync (check for recent token)
recent_marker=$(az boards work-item show --id {{work_item_id}} \
  --org {{org_url}} \
  --query "fields.['System.History']" -o tsv | \
  grep -oP 'bmad-sync-\K[a-f0-9-]+' | tail -1)

if [ "$recent_marker" = "$last_bmad_sync_token" ]; then
  echo "Loop detected - skipping update"
  exit 0
fi
```

**Token Expiry:**
- Correlation tokens stored for 1 hour
- After expiry, token ignored (allows genuine updates)
- Tokens stored in sprint-status.yaml:

```yaml
sync_tokens:
  last_sent: "uuid-from-last-sync"
  sent_at: "2025-01-10T10:00:00Z"
  ttl_minutes: 60
```

### 2. Content Hashing

**Purpose**: Skip updates when content hasn't actually changed

**Hash Computation:**

```bash
#!/bin/bash
# compute-sync-hash.sh

story_file="$1"

# Extract fields that trigger sync
title=$(grep -oP '^# Story \d+\.\d+: \K.+' "$story_file")
status=$(grep -oP '^Status: \K\w+' "$story_file")
ac=$(sed -n '/## Acceptance Criteria/,/## Tasks/p' "$story_file" | grep -v '^##')

# Compute SHA256 hash
echo -n "${title}${status}${ac}" | sha256sum | cut -d' ' -f1
```

**Usage in sync:**

```bash
# Before syncing BMAD → ADO
current_hash=$(bash compute-sync-hash.sh "stories/1-1-auth.md")
last_hash=$(grep -oP 'sync_hash: \K\S+' "stories/1-1-auth.md")

if [ "$current_hash" = "$last_hash" ]; then
  echo "No content changes - skipping sync"
  exit 0
fi

# Perform sync...
# Update sync_hash after successful sync
```

### 3. Timestamp Comparison

**Purpose**: Detect which system has most recent change

```bash
# Get last modified times
bmad_modified=$(git log -1 --format=%aI -- stories/1-1-auth.md)
ado_modified=$(az boards work-item show --id 123 --org {{org_url}} \
  --query "fields.['System.ChangedDate']" -o tsv)

# Compare timestamps
if [[ "$ado_modified" > "$bmad_modified" ]]; then
  echo "ADO is newer - sync ADO → BMAD"
else
  echo "BMAD is newer - sync BMAD → ADO"
fi
```

---

## Reconciliation Workflows

### 1. On-Demand Reconciliation

**Manual reconciliation command:**

```bash
# bmad-reconcile.sh
#!/bin/bash

echo "🔄 Starting BMAD ↔ DevOps reconciliation..."

# Step 1: Load configuration
source sprint-status.yaml
tracking_system=$(grep -oP '^tracking_system: \K\S+' sprint-status.yaml)

# Step 2: Reconcile each story
for story in stories/*.md; do
  story_key=$(basename "$story" .md)
  bmad_id=$(grep -oP 'bmad_id: \K[a-f0-9-]+' "$story")
  
  # Search for work item by bmad_id
  if [ "$tracking_system" = "azure-devops" ]; then
    work_item_id=$(az boards query --wiql \
      "SELECT [System.Id] FROM workitems WHERE [BMAD.ID] = '$bmad_id'" \
      --org "$org_url" --project "$project" \
      --query "workItems[0].id" -o tsv)
  fi
  
  # If found, update tracking_ref
  if [ -n "$work_item_id" ]; then
    echo "✅ Reconciled: $story_key → Work Item #$work_item_id"
    # Update sprint-status.yaml tracking_refs
  else
    echo "⚠️ No match found for $story_key (bmad_id: $bmad_id)"
  fi
done

echo "✅ Reconciliation complete"
```

### 2. Scheduled Reconciliation

**Cron job (daily at 2 AM):**

```bash
# /etc/cron.d/bmad-reconcile
0 2 * * * cd /path/to/bmad-repo && bash .bmad/scripts/bmad-reconcile.sh >> /var/log/bmad-sync.log 2>&1
```

**GitHub Actions (daily):**

```yaml
# .github/workflows/scheduled-reconcile.yml
name: Daily Reconciliation

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  reconcile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run reconciliation
        env:
          AZURE_DEVOPS_EXT_PAT: ${{ secrets.AZURE_DEVOPS_PAT }}
        run: |
          bash .bmad/scripts/bmad-reconcile.sh
      
      - name: Commit changes if any
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            git config user.name "BMAD Sync Bot"
            git config user.email "bmad-sync-bot@company.com"
            git add sprint-status.yaml stories/
            git commit -m "chore: Daily reconciliation"
            git push
          fi
```

### 3. Conflict Detection & Resolution

**Detect conflicts:**

```bash
#!/bin/bash
# detect-sync-conflicts.sh

for story in stories/*.md; do
  # Get last sync info
  last_synced_from=$(grep -oP 'last_synced_from: \K\w+' "$story")
  last_synced_at=$(grep -oP 'last_synced_at: \K[^-]+' "$story")
  
  # Check if both BMAD and DevOps modified since last sync
  bmad_modified=$(git log -1 --format=%aI -- "$story")
  
  if [ "$last_synced_from" = "ado" ]; then
    # Last sync was from ADO, check if BMAD modified after
    if [[ "$bmad_modified" > "$last_synced_at" ]]; then
      # Also check if ADO modified
      # ... (query ADO)
      echo "⚠️ Conflict detected: $story"
    fi
  fi
done
```

**Flag conflict in file:**

```markdown
<!-- SYNC CONFLICT DETECTED
  field: title
  bmad_value: "User Authentication System"
  devops_value: "User Auth & Authorization"
  last_synced_at: 2025-01-10T08:00:00Z
  conflict_detected_at: 2025-01-10T10:00:00Z
  resolution: manual_review_required
-->
```

**Resolution workflow:**

1. Agent/user reviews conflict marker
2. Decides which value to keep
3. Manually edits file to remove conflict marker
4. Updates sync_hash to force next sync
5. Commits resolution with message: `fix: Resolve sync conflict for story X`

---

## Monitoring & Alerting

### 1. Sync Health Dashboard

**Metrics to track:**

```yaml
sync_metrics:
  last_successful_sync: "2025-01-10T10:00:00Z"
  consecutive_failures: 0
  stories_in_sync: 42
  stories_out_of_sync: 2
  conflicts_detected: 1
  last_reconciliation: "2025-01-10T02:00:00Z"
```

**Health check script:**

```bash
#!/bin/bash
# check-sync-health.sh

# Check for old sync timestamps (>24h)
stale_stories=0
for story in stories/*.md; do
  last_synced=$(grep -oP 'last_synced_at: \K[^-]+' "$story")
  if [ -n "$last_synced" ]; then
    age_hours=$(( ($(date +%s) - $(date -d "$last_synced" +%s)) / 3600 ))
    if [ $age_hours -gt 24 ]; then
      ((stale_stories++))
    fi
  fi
done

if [ $stale_stories -gt 0 ]; then
  echo "⚠️ Warning: $stale_stories stories not synced in 24h"
  exit 1
fi

echo "✅ Sync health: OK"
```

### 2. Alert Conditions

**Critical Alerts:**
- Consecutive sync failures > 3
- Any story with sync conflict > 24 hours old
- Missing bmad_id in any story file
- Duplicate bmad_id detected

**Warning Alerts:**
- Stories not synced in 24 hours
- DevOps PAT expiring in < 14 days
- Unusual sync volume (>100 updates/hour)

**Alert Script:**

```bash
#!/bin/bash
# alert-sync-issues.sh

# Check consecutive failures
failures=$(grep -c 'sync_failed' /var/log/bmad-sync.log | tail -5)
if [ $failures -ge 3 ]; then
  # Send alert (email, Slack, PagerDuty, etc.)
  echo "CRITICAL: 3+ consecutive sync failures" | mail -s "BMAD Sync Alert" team@company.com
fi
```

---

## Disaster Recovery

### 1. Backup Strategy

**What to backup:**
- All story files with sync metadata
- sprint-status.yaml with tracking_refs
- Sync tokens and correlation data

**Backup schedule:**
- Before each sync operation
- Daily snapshot at 1 AM
- Retain 30 days of backups

**Backup script:**

```bash
#!/bin/bash
# backup-bmad-state.sh

backup_dir=".bmad/backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$backup_dir"

# Backup story files
cp -r stories/ "$backup_dir/"

# Backup sprint status
cp sprint-status.yaml "$backup_dir/"

# Create manifest
echo "Backup created: $(date)" > "$backup_dir/manifest.txt"
echo "Stories: $(ls stories/ | wc -l)" >> "$backup_dir/manifest.txt"

echo "✅ Backup saved to: $backup_dir"
```

### 2. Recovery Procedures

**Scenario 1: Lost tracking_refs**

```bash
# Run bmad-ado-init workflow to rebuild mappings
bash .bmad/workflows/bmad-ado-init/init.sh
```

**Scenario 2: Corrupted sync metadata**

```bash
# Restore from backup
latest_backup=$(ls -t .bmad/backups/ | head -1)
cp ".bmad/backups/$latest_backup/sprint-status.yaml" ./

# Re-run reconciliation
bash .bmad/scripts/bmad-reconcile.sh
```

**Scenario 3: Sync loop detected**

```bash
# Clear correlation tokens
sed -i '/last_sent:/d' sprint-status.yaml
sed -i '/sent_at:/d' sprint-status.yaml

# Wait 1 hour for token expiry
# Resume sync operations
```

---

## Performance Optimization

### 1. Batch Updates

Instead of syncing each story individually:

```bash
# Batch sync - collect all changes first
changed_stories=()
for story in stories/*.md; do
  if needs_sync "$story"; then
    changed_stories+=("$story")
  fi
done

# Sync all at once
if [ ${#changed_stories[@]} -gt 0 ]; then
  echo "Syncing ${#changed_stories[@]} stories..."
  for story in "${changed_stories[@]}"; do
    sync_story "$story"
  done
fi
```

### 2. Incremental Sync

Only sync stories modified since last sync:

```bash
# Get timestamp of last sync
last_sync=$(grep -oP '^  last_successful_sync: \K.*' sprint-status.yaml)

# Find stories modified since then
git diff --name-only "$last_sync" HEAD -- stories/ | while read story; do
  sync_story "$story"
done
```

### 3. Parallel Sync

For large backlogs:

```bash
# Sync multiple stories in parallel (limit concurrency)
export -f sync_story
find stories/ -name "*.md" | xargs -P 4 -I {} bash -c 'sync_story "{}"'
```

---

## See Also

- Field Ownership Matrix: `src/modules/bmm/data/field-ownership-matrix.yaml`
- Bot Identity Setup: `src/modules/bmm/data/bot-identity-security.md`
- BMAD-ADO Init: `src/modules/bmm/workflows/4-implementation/bmad-ado-init/`
- DevOps Providers: `src/modules/bmm/data/devops-providers.yaml`
