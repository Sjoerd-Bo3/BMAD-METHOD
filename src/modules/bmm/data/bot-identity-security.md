# Bot Identity & Security Configuration

## Overview

For production bi-directional sync, use dedicated bot identities instead of personal credentials. This ensures:
- Clear separation between human and automated changes
- Minimal permission scope (security)
- Audit trail for all sync operations
- No disruption when team members leave

## Bot Identity Setup

### 1. Azure DevOps Sync Bot

**Create Service Account:**

1. Create new user in Azure AD (or invite external user):
   - Email: `bmad-sync-bot@yourcompany.com`
   - Display name: `BMAD Sync Bot`
   - Ensure user has license for Azure DevOps

2. Add to Azure DevOps organization:
   - Navigate to Organization Settings → Users
   - Add user with **Basic** access level
   - Assign to projects that need sync

**Generate Personal Access Token (PAT):**

1. Sign in as sync bot user
2. Navigate to User Settings → Personal Access Tokens
3. Create new token:
   - Name: `BMAD Bi-Directional Sync`
   - Organization: Your org
   - Expiration: 1 year (with renewal reminder)
   - Scopes (minimal required):
     - ✓ Work Items (Read, Write)
     - ✓ Code (Read) - for PR linking only
     - ❌ Do NOT grant: Build, Release, Admin, etc.

4. Copy token immediately (shown only once)

**Store Token Securely:**

**Option A: Azure Key Vault**
```bash
az keyvault secret set \
  --vault-name your-key-vault \
  --name bmad-sync-bot-pat \
  --value "your_pat_here"
```

**Option B: GitHub Secrets** (if BMAD repo is on GitHub)
```bash
# Via GitHub UI: Settings → Secrets → Actions
# Name: AZURE_DEVOPS_PAT
# Value: your_pat_here
```

**Configure Azure CLI:**
```bash
# Set PAT for az boards commands
export AZURE_DEVOPS_EXT_PAT=$(az keyvault secret show \
  --vault-name your-key-vault \
  --name bmad-sync-bot-pat \
  --query value -o tsv)

# Test authentication
az boards work-item show --id 1 --org https://dev.azure.com/yourorg
```

---

### 2. GitHub Sync Bot

**Create Bot Account:**

1. Create new GitHub account:
   - Username: `bmad-sync-bot` or `yourorg-bmad-bot`
   - Email: `bmad-sync-bot@yourcompany.com`
   - Profile: Add description "Automated sync bot for BMAD methodology"

2. Invite bot to repository:
   - Add as collaborator with **Write** access
   - Bot must accept invitation

**Generate Personal Access Token (Classic):**

1. Sign in as bot user
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Generate new token:
   - Name: `BMAD Bi-Directional Sync`
   - Expiration: 1 year
   - Scopes (minimal required):
     - ✓ `repo` (full control of repositories)
       - Or minimal: `public_repo` if public only
     - ❌ Do NOT grant: admin, delete, workflow, etc.

**Store Token Securely:**

**Option A: Azure Key Vault**
```bash
az keyvault secret set \
  --vault-name your-key-vault \
  --name github-sync-bot-pat \
  --value "ghp_xxxxxxxxxxxxx"
```

**Option B: GitHub Secrets** (in BMAD repo)
```bash
# Via GitHub UI: Settings → Secrets → Actions
# Name: GITHUB_BOT_PAT
# Value: ghp_xxxxxxxxxxxxx
```

**Configure GitHub CLI:**
```bash
# Authenticate gh CLI with bot PAT
echo "ghp_xxxxxxxxxxxxx" | gh auth login --with-token

# Test authentication
gh auth status
gh issue list
```

---

### 3. Git Bot Identity

**Configure Git commits by bot:**

```bash
# Set bot identity for commits (local machine or CI)
git config user.name "BMAD Sync Bot"
git config user.email "bmad-sync-bot@yourcompany.com"
```

**For CI/CD pipelines:**

**GitHub Actions:**
```yaml
# .github/workflows/bmad-sync.yml
jobs:
  sync:
    steps:
      - uses: actions/checkout@v3
      - name: Configure Git
        run: |
          git config user.name "BMAD Sync Bot"
          git config user.email "bmad-sync-bot@yourcompany.com"
      
      - name: Sync from Azure DevOps
        env:
          AZURE_DEVOPS_EXT_PAT: ${{ secrets.AZURE_DEVOPS_PAT }}
        run: |
          # Run sync commands here
```

**Azure Pipelines:**
```yaml
# azure-pipelines.yml
pool:
  vmImage: 'ubuntu-latest'

steps:
- script: |
    git config user.name "BMAD Sync Bot"
    git config user.email "bmad-sync-bot@yourcompany.com"
  displayName: 'Configure Git'

- script: |
    # Run sync commands
  displayName: 'Sync to BMAD'
  env:
    AZURE_DEVOPS_EXT_PAT: $(AZURE_DEVOPS_PAT)
```

---

## Change Tagging & Audit Trail

### Azure DevOps Change Tagging

**Every bot update should include identifier:**

```bash
# Add sync marker to work item discussion
az boards work-item update --id {{work_item_id}} \
  --discussion "[bmad-sync-bot] Synced from BMAD repository" \
  --org {{org_url}}

# Add correlation token for loop prevention
az boards work-item update --id {{work_item_id}} \
  --discussion "[bmad-sync-{{correlation_token}}]" \
  --org {{org_url}}
```

**Query bot changes:**
```bash
# Find all work items updated by bot
az boards query --wiql "SELECT [System.Id], [System.Title] FROM workitems WHERE [System.ChangedBy] = 'bmad-sync-bot@yourcompany.com' AND [System.ChangedDate] >= @Today - 7" \
  --org {{org_url}}
```

### GitHub Change Tagging

**Every bot update should include identifier:**

```bash
# Add sync marker comment
gh issue comment {{issue_number}} \
  --body "<!-- bmad-sync-bot -->\n🔄 Synced from BMAD repository"

# Add correlation token
gh issue comment {{issue_number}} \
  --body "<!-- bmad-sync-{{correlation_token}} -->"
```

**Query bot changes:**
```bash
# Find issues updated by bot
gh issue list --author bmad-sync-bot --state all
```

---

## Permission Model

### Minimal Scope Principle

**Azure DevOps PAT Scopes:**
- ✅ Work Items (Read, Write) - Required
- ✅ Code (Read) - Optional, for PR context only
- ❌ Build - Not needed
- ❌ Release - Not needed
- ❌ Project & Team (Read, Write) - Not needed
- ❌ Analytics - Not needed

**GitHub PAT Scopes:**
- ✅ `repo` → `public_repo` if all repos are public
- ✅ `repo` → `Contents`, `Issues`, `Pull requests` (fine-grained token)
- ❌ `admin:org` - Not needed
- ❌ `delete_repo` - Not needed
- ❌ `workflow` - Not needed unless sync runs in Actions

### Team Access Control

**Azure DevOps:**
- Bot should NOT be Project Administrator
- Bot should be in custom "Sync Bots" security group
- Grant group: Work Items (Read, Write), nothing else

**GitHub:**
- Bot should have **Write** role (not Admin/Maintain)
- Consider creating "Bots" team with specific permissions
- Use branch protection to prevent bot from pushing to main directly

---

## Token Rotation & Expiry

### Token Lifecycle

**Renewal Schedule:**
- PATs expire after max 1 year
- Set calendar reminder 2 weeks before expiry
- Rotate tokens every 6 months for security

**Rotation Process:**

1. Generate new PAT (same scopes)
2. Update secret in Key Vault / GitHub Secrets
3. Test sync with new token
4. Revoke old token only after verification
5. Update documentation with rotation date

**Emergency Revocation:**

If token compromised:
```bash
# Azure DevOps: Revoke via UI
# User Settings → Personal Access Tokens → Revoke

# GitHub: Revoke via UI
# Settings → Developer settings → Personal access tokens → Delete

# Immediately rotate to new token
```

---

## Monitoring & Alerts

### Azure DevOps Audit

**Query sync bot activity:**
```bash
# Recent updates by bot
az boards query --wiql "SELECT [System.Id], [System.Title], [System.ChangedDate] FROM workitems WHERE [System.ChangedBy] = 'bmad-sync-bot@yourcompany.com' ORDER BY [System.ChangedDate] DESC" \
  --org {{org_url}}
```

### GitHub Audit

**Query sync bot activity:**
```bash
# Issues created/updated by bot
gh issue list --author bmad-sync-bot --json number,title,updatedAt

# Comments by bot
gh api repos/{owner}/{repo}/issues/comments --jq '.[] | select(.user.login=="bmad-sync-bot") | {issue: .issue_url, created_at: .created_at}'
```

### Alerting

**Set up alerts for:**
- Token expiry (2 weeks before)
- Sync failures (consecutive errors)
- Unauthorized bot access attempts
- Excessive bot activity (possible loop)

**Azure DevOps:**
- Use Azure Monitor alerts on activity logs

**GitHub:**
- Use GitHub Actions failure notifications
- Monitor via webhook events

---

## Compliance & Security

### Data Protection

- **Token storage**: Never commit PATs to repository
- **Token transmission**: Use HTTPS/TLS only
- **Token rotation**: Every 6 months minimum
- **Access logs**: Retain for compliance (90 days+)

### Principle of Least Privilege

- Bot has minimum permissions required
- Bot cannot delete work items/issues
- Bot cannot modify team/project settings
- Bot cannot approve PRs or merge without review

### Incident Response

**If bot token leaked:**

1. Immediately revoke token (both Azure DevOps and GitHub)
2. Audit all bot activity in last 24 hours
3. Generate new token with different scope if needed
4. Update secrets in all locations
5. Document incident and remediation

---

## Testing Bot Setup

### Azure DevOps Test

```bash
# Test 1: Read work item
az boards work-item show --id 1 --org {{org_url}}

# Test 2: Update work item (safe test field)
az boards work-item update --id 1 --discussion "[Test] Bot connectivity check" --org {{org_url}}

# Test 3: Query work items
az boards query --wiql "SELECT [System.Id] FROM workitems WHERE [System.WorkItemType] = 'User Story'" --org {{org_url}}
```

### GitHub Test

```bash
# Test 1: List issues
gh issue list

# Test 2: Create test comment
gh issue comment 1 --body "<!-- test -->\n🤖 Bot connectivity check"

# Test 3: Search issues
gh issue list --search "label:test"
```

### Integration Test

```bash
# End-to-end test: Create story in BMAD, sync to ADO, verify
1. Create test story file with bmad_id
2. Run bmad-ado-init workflow
3. Verify work item created in ADO with BMAD.ID field
4. Check bot identity in ADO history
5. Verify sync metadata in story file
```

---

## See Also

- Field Ownership Matrix: `src/modules/bmm/data/field-ownership-matrix.yaml`
- DevOps Providers: `src/modules/bmm/data/devops-providers.yaml`
- BMAD-ADO Init Workflow: `src/modules/bmm/workflows/4-implementation/bmad-ado-init/`
- Azure DevOps PAT Documentation: https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate
- GitHub PAT Documentation: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
