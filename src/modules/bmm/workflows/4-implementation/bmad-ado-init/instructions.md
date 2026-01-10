# BMAD-ADO Init - Azure DevOps Initialization & Reconciliation

## Purpose

Initialize and reconcile BMAD backlog with Azure DevOps (or GitHub Issues), establishing bi-directional sync infrastructure.

This workflow:
1. Assigns stable UUIDs (bmad_id) to all backlog items
2. Creates missing work items in Azure DevOps
3. Reconciles existing work items using bmad_id matching
4. Establishes field ownership and sync metadata
5. Configures service hooks (documentation only - no webhook receiver)

## When to Use

- **First-time setup**: Connect existing BMAD backlog to Azure DevOps
- **Re-initialization**: Rebuild sync mapping after data loss
- **Reconciliation**: Fix sync state after manual changes
- **Migration**: Switch from file-system to DevOps tracking

## Prerequisites

- Azure DevOps project created
- `az` CLI installed and authenticated (`az login`)
- For GitHub: `gh` CLI installed and authenticated (`gh auth login`)
- Epic files exist in BMAD repository
- Sprint-status.yaml configured with tracking_system

## Workflow Steps

### Step 1: Validate Configuration

<action>Load sprint-status.yaml and validate tracking_system configuration</action>

**Required fields for Azure DevOps:**
- `tracking_system: azure-devops`
- `org_url: https://dev.azure.com/your-org`
- `project: YourProjectName`
- `iteration: "Sprint: ProjectName - Epic 1"` (optional)

**Required fields for GitHub:**
- `tracking_system: github-issues`
- `repo: owner/repo-name`
- `milestone: "Sprint: ProjectName - Epic 1"` (optional)

<check if="tracking_system not in [azure-devops, github-issues]">
  <output>❌ Error: tracking_system must be 'azure-devops' or 'github-issues' for init workflow</output>
  <output>Current value: {{tracking_system}}</output>
  <halt/>
</check>

### Step 2: Assign UUIDs to Backlog Items

<action>Scan all epic files and story files</action>
<action>For each epic and story, check if bmad_id exists in metadata</action>

**For Epic files:**
```bash
# Check if epic file has bmad_id in frontmatter or header comments
grep -q "bmad_id:" epic-1.md
```

**For Story files:**
```bash
# Check if story file has bmad_id comment
grep -q "<!-- bmad_id:" stories/1-1-user-authentication.md
```

<check if="bmad_id missing">
  <action>Generate UUID: `uuidgen` or `python3 -c 'import uuid; print(uuid.uuid4())'`</action>
  <action>Add bmad_id to file metadata</action>
  
  **For story files** (add to header comments):
  ```markdown
  <!-- bmad_id: {{generated_uuid}} -->
  ```
  
  **For epic files** (add to frontmatter or header):
  ```markdown
  ---
  bmad_id: {{generated_uuid}}
  ---
  ```
</check>

<output>✅ UUIDs assigned to all backlog items</output>

### Step 3: Initialize Azure DevOps Custom Field (ADO Only)

<critical>Azure DevOps requires custom field BMAD.ID for stable mapping</critical>

**Manual Setup Required** (Azure DevOps Web UI):

1. Navigate to Organization Settings → Process
2. Select your process template (e.g., Agile, Scrum)
3. Customize "User Story" work item type
4. Add custom field:
   - Name: `BMAD.ID`
   - Type: `Text (single line)`
   - Description: `Stable UUID from BMAD repository`
   - Make searchable: ✓

<action>Verify custom field exists:</action>
```bash
az boards work-item show --id <any_work_item_id> --org {{org_url}} --query "fields.['BMAD.ID']" -o tsv
```

<check if="custom field not available">
  <output>⚠️ Warning: Custom field BMAD.ID not found</output>
  <output>Fallback: Will use tags for mapping (format: bmad:{{uuid}})</output>
  <action>Set {{use_tags_for_mapping}} = true</action>
</check>

### Step 4: Reconcile Existing Work Items

<action>For each story with bmad_id, check if matching work item exists</action>

**Azure DevOps reconciliation:**
```bash
# Search for work item by BMAD.ID custom field
az boards query --wiql "SELECT [System.Id] FROM workitems WHERE [BMAD.ID] = '{{bmad_id}}'" \
  --org {{org_url}} --project {{project}} --query "workItems[0].id" -o tsv
```

**GitHub reconciliation:**
```bash
# Search for issue by bmad:uuid tag
gh issue list --search "bmad:{{bmad_id}}" --json number,title --jq '.[0].number'
```

<check if="work_item found">
  <output>🔗 Found existing work item #{{work_item_id}} for story {{story_key}}</output>
  <action>Store mapping in sprint-status.yaml tracking_refs</action>
  <action>Update story file with ado_id or github_issue metadata</action>
  <action>Set sync metadata: last_synced_from=manual, last_synced_at={{now}}</action>
</check>

<check if="work_item NOT found">
  <output>➕ No existing work item for story {{story_key}} - will create</output>
</check>

### Step 5: Create Missing Work Items

For each story without a DevOps mapping:

**Azure DevOps creation:**
```bash
# Create work item with BMAD.ID field
az boards work-item create \
  --title "{{story_key}}: {{story_title}}" \
  --type "User Story" \
  --description "$(cat stories/{{story_key}}.md)" \
  --iteration "{{iteration_path}}" \
  --fields "BMAD.ID={{bmad_id}}" \
  --org {{org_url}} --project {{project}}
```

**Fallback (if custom field unavailable):**
```bash
# Create work item and add bmad tag
work_item_id=$(az boards work-item create \
  --title "{{story_key}}: {{story_title}}" \
  --type "User Story" \
  --description "$(cat stories/{{story_key}}.md)" \
  --org {{org_url}} --project {{project}} \
  --query "id" -o tsv)

az boards work-item update --id ${work_item_id} \
  --fields "System.Tags=bmad:{{bmad_id}}" \
  --org {{org_url}}
```

**GitHub creation:**
```bash
# Create issue with bmad tag in body
gh issue create \
  --title "{{story_key}}: {{story_title}}" \
  --body "<!-- bmad:{{bmad_id}} -->\n\n$(cat stories/{{story_key}}.md)" \
  --label "story,sprint" \
  --milestone "{{milestone}}"
```

<action>Capture created work_item_id or issue_number</action>
<action>Store in sprint-status.yaml tracking_refs</action>
<action>Update story file with ado_id or github_issue</action>

### Step 6: Initialize Sync Metadata

For each story:

<action>Add sync metadata to story file header</action>

```markdown
<!-- bmad_id: {{bmad_id}} -->
<!-- ado_id: {{work_item_id}} -->
<!-- sync:
  last_synced_from: repo
  last_synced_at: {{now_iso8601}}
  sync_hash: {{compute_hash}}
-->
```

**Compute sync_hash:**
```bash
# Hash relevant fields (title, description, status, acceptance criteria)
echo -n "{{title}}{{description}}{{status}}{{ac}}" | sha256sum | cut -d' ' -f1
```

### Step 7: Link Parent-Child Relations (Epics → Stories)

<action>For each epic, get or create epic work item</action>
<action>For each story in epic, link to parent</action>

**Azure DevOps linking:**
```bash
# Link story to epic
az boards work-item relation add \
  --id {{story_work_item_id}} \
  --relation-type "System.LinkTypes.Hierarchy-Reverse" \
  --target-id {{epic_work_item_id}} \
  --org {{org_url}}
```

**GitHub Note:**
GitHub does not support parent-child issue relationships. Use labels and milestone for grouping.

### Step 8: Configure Service Hooks (Documentation)

<critical>Service hooks enable ADO → BMAD sync (webhook receiver not included)</critical>

**Manual Setup Required** (Azure DevOps Web UI):

1. Navigate to Project Settings → Service Hooks
2. Create new webhook for "Work item updated"
3. Filters:
   - Work item type: User Story, Task, Epic
   - Area path: (your project area)
4. Action: POST to webhook receiver endpoint
   - URL: `https://your-domain/bmad-sync/ado-webhook`
   - Resource details to send: All
   - Messages to send: All

**Note:** Webhook receiver implementation is excluded from this workflow. Service hook configuration is documented for future implementation.

### Step 9: Update Sprint Status

<action>Update sprint-status.yaml with reconciliation summary</action>

```yaml
# Sync initialization metadata
sync_init:
  initialized_at: {{now_iso8601}}
  initialized_by: bmad-ado-init
  tracking_system: {{tracking_system}}
  stories_reconciled: {{reconciled_count}}
  stories_created: {{created_count}}
  bmad_ids_assigned: {{uuid_assigned_count}}
```

### Step 10: Validation & Report

<action>Run validation checks</action>

**Checks:**
- All stories have bmad_id
- All stories have tracking_ref in sprint-status.yaml
- All stories have sync metadata
- All work items have BMAD.ID field (or tag)
- Parent-child relations established

<output>📊 Initialization Summary:</output>
<output>  ✅ Stories with UUID: {{stories_with_uuid}}</output>
<output>  ✅ Existing work items reconciled: {{reconciled_count}}</output>
<output>  ✅ New work items created: {{created_count}}</output>
<output>  ✅ Parent-child links established: {{links_count}}</output>
<output>  ⚠️ Stories needing manual review: {{manual_review_count}}</output>

<check if="manual_review_count > 0">
  <output>📋 Manual Review Required:</output>
  <action>List stories needing attention</action>
</check>

## Idempotency Rules

This workflow is safe to run multiple times:

1. **UUID Assignment**: If bmad_id exists, skip generation
2. **Work Item Creation**: 
   - Search by BMAD.ID before creating
   - If found → LINK (update tracking_refs)
   - If not found → CREATE
   - Never create duplicates
3. **Sync Metadata**: Update last_synced_at each run
4. **Parent Links**: Check if relation exists before adding

## Field Ownership Reference

See: `src/modules/bmm/data/field-ownership-matrix.yaml`

**Key principles:**
- BMAD owns: status, acceptance_criteria, tasks, dev_notes
- DevOps owns: assigned_to, iteration_path, priority, tags
- Merge fields: title, description (require manual review if both changed)

## Error Handling

<check if="az CLI not authenticated">
  <output>❌ Error: Azure CLI not authenticated</output>
  <output>Run: az login</output>
  <halt/>
</check>

<check if="gh CLI not authenticated">
  <output>❌ Error: GitHub CLI not authenticated</output>
  <output>Run: gh auth login</output>
  <halt/>
</check>

<check if="custom field creation failed">
  <output>⚠️ Warning: Could not create BMAD.ID custom field</output>
  <output>Falling back to tag-based mapping</output>
  <action>Continue with tags</action>
</check>

## Post-Initialization

After successful initialization:

1. **Manual Sync (ADO → BMAD)**: Use `bmad-ado-sync` workflow (when available)
2. **Service Hook Testing**: Trigger test work item update in ADO
3. **Ownership Assignment**: Assign stories to users in DevOps system
4. **Iteration Planning**: Move stories to appropriate iterations in ADO

## Security Best Practices

**Bot Identity Setup:**

1. Create dedicated service account: `bmad-sync-bot@company.com`
2. Generate Personal Access Token (PAT) with minimal scope:
   - Azure DevOps: Work Items (Read, Write)
   - GitHub: Issues (Read, Write)
3. Store PAT securely (Azure Key Vault, GitHub Secrets)
4. Configure CLI to use bot PAT:
   ```bash
   export AZURE_DEVOPS_EXT_PAT={{bot_pat}}
   ```

**Change Tagging:**

All bot-initiated changes should be tagged:
- Azure DevOps: Add "[bmad-sync-bot]" prefix to discussion
- GitHub: Add comment signature "<!-- synced by bmad-sync-bot -->"

## See Also

- Field Ownership Matrix: `src/modules/bmm/data/field-ownership-matrix.yaml`
- DevOps Providers: `src/modules/bmm/data/devops-providers.yaml`
- Sprint Planning: `src/modules/bmm/workflows/4-implementation/sprint-planning/`
- Create Story: `src/modules/bmm/workflows/4-implementation/create-story/`
