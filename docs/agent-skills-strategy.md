# Agent Skills Strategy for BMAD-METHOD

This document outlines which BMAD components should be converted to Agent Skills vs. kept in the current system.

## What Are Agent Skills?

Agent Skills are an **open standard** ([agentskills.io](https://agentskills.io/)) that work across:
- **Claude** (Claude Code, Claude.ai, Claude API)
- **VS Code Copilot** (chat, agent mode)
- **GitHub Copilot CLI**
- **GitHub Copilot coding agent**

Skills are folders with a `SKILL.md` file containing YAML frontmatter and instructions. They're auto-discovered and loaded on-demand based on prompt relevance.

## Locations

### Source (BMAD Build System)
Skills are authored in the BMAD source tree and installed via the CLI:

| Source Location | Description |
|-----------------|-------------|
| `src/core/skills/` | Core skills available to all installations |
| `src/modules/{module}/skills/` | Module-specific skills |

### Installation Targets
The BMAD installer copies skills to standard locations:

| Target Location | Platform |
|-----------------|----------|
| `.github/skills/` | VS Code Copilot, GitHub coding agent |
| `.claude/skills/` | Claude Code (legacy, also supported) |

## Key Differences: BMAD vs Agent Skills

| Aspect | BMAD System | Agent Skills |
|--------|-------------|--------------|
| **Orchestration** | Full workflow engine with steps, templates, validation | Simple instruction-based |
| **State/Memory** | Sidecar files, session persistence | Stateless (no memory between invocations) |
| **Format** | YAML agents + XML/MD workflows | Single SKILL.md per capability |
| **Loading** | Manual via agent menu triggers | Auto-discovered by AI based on prompt |
| **Resources** | Config files, templates, CSV data | Can include scripts/files in skill folder |
| **Complexity** | Multi-step with user interaction | Single-purpose, fire-and-forget |
| **Portability** | BMAD ecosystem (any IDE) | Cross-platform (Claude + VS Code + CLI) |

---

## Conversion Candidates

### ✅ Good Fits for Agent Skills

**Single-purpose tasks with clear triggers:**

| Current BMAD Component | Proposed Skill Name | Why Convert? |
|------------------------|---------------------|--------------|
| `shard-doc.xml` | `document-sharding` | Self-contained utility, clear trigger ("shard this doc") |
| `review-adversarial-general.xml` | `code-review-adversarial` | Auto-activates during reviews, portable |
| `validate-workflow.xml` | `workflow-validation` | Useful in CLI and coding agent contexts |
| `index-docs.xml` | `document-indexing` | Clear purpose, works standalone |
| `brainstorming/workflow.md` | `brainstorming-session` | Creative facilitation, no state needed |
| Simple agents (commit poet style) | Various skill names | Single capability, personality-driven |

**Benefits of converting these:**
- Auto-activate when relevant (no menu needed)
- Work in CLI/terminal workflows
- GitHub coding agent can use them
- Community sharing via `.github/skills/`

### ⚠️ Partial Fits (Consider Extracting Components)

| BMAD Component | Extractable Parts | Keep in BMAD |
|----------------|-------------------|--------------|
| `create-product-brief/` | Research techniques, brief outline | Full template workflow |
| `create-architecture/` | Architecture patterns, ADR format | Step-by-step generation |
| `create-epics-and-stories/` | Story estimation heuristics | Full epic creation flow |
| Expert agents with sidecars | Quick-reference prompts | Memory, learning, persistence |

**Strategy:** Extract reusable knowledge/patterns as skills, keep orchestration in BMAD.

### ❌ Keep in BMAD (Do Not Convert)

| Component | Reason |
|-----------|--------|
| **Complex multi-step workflows** | Need `workflow.xml` engine for step tracking, templates, validation |
| **Template-based document generation** | BMAD's template system with `{{variables}}` and `template-output` tags |
| **Agent sidecar memory** | Skills are stateless; expert agents need persistence |
| **Module configuration system** | `config.yaml`, manifests, module resolution |
| **Workflow orchestration** | `discover_inputs` protocol, step dependencies, conditional execution |
| **Party Mode / Advanced Elicitation** | Interactive multi-agent coordination |

---

## Implementation Strategy

### Phase 1: Utility Tasks (Low Risk)
Convert standalone tasks that don't depend on BMAD's workflow engine:
1. ✅ `document-sharding` (done)
2. `code-review-adversarial`
3. `document-indexing`
4. `workflow-validation`

### Phase 2: Simple Workflows
Convert simpler workflows where the SKILL.md can contain all needed instructions:
1. `brainstorming-session`
2. `research-techniques` (extract from research workflow)

### Phase 3: Pattern Libraries
Extract domain knowledge as reference skills (not replacements):
1. `architecture-patterns` - ADR formats, component patterns
2. `user-story-writing` - Story templates, acceptance criteria patterns
3. `api-design-guidelines` - REST/GraphQL conventions

### Phase 4: Evaluate Agent Simplification
Consider if any simple agents could become skills:
- Commit message helpers
- Documentation generators
- Code style guides

---

## Coexistence Model

```
BMAD Source (src/)
├── core/
│   ├── agents/
│   ├── tasks/
│   ├── workflows/
│   └── skills/                    # Core skills (source)
│       └── document-sharding/
│           └── SKILL.md
└── modules/
    ├── bmm/
    │   └── skills/                # Module skills (source)
    └── bmgd/
        └── skills/

↓ BMAD CLI Install ↓

Project Root (installed)
├── .github/
│   └── skills/                    # Agent Skills (installed - portable, auto-discovered)
│       ├── document-sharding/
│       ├── code-review/
│       └── brainstorming/
│
└── _bmad/                         # BMAD System (installed - orchestration, state)
    ├── core/
    │   ├── agents/
    │   ├── tasks/
    │   └── workflows/
    └── modules/
```

**How they interact:**
- Skills handle quick, auto-triggered capabilities
- BMAD handles complex, multi-step, stateful workflows
- BMAD workflows can reference skills for subtasks
- Skills can suggest "use BMAD workflow X for full process"

---

## File Structure for Skills

### Source Structure (in BMAD repo)
```
src/core/skills/
└── {skill-name}/
    ├── SKILL.md           # Required: Instructions + YAML frontmatter
    ├── templates/         # Optional: Template files
    ├── examples/          # Optional: Example inputs/outputs
    └── scripts/           # Optional: Helper scripts
```

### Installed Structure (in user project)
```
.github/skills/
└── {skill-name}/
    ├── SKILL.md
    └── [resources...]
```

**SKILL.md format:**
```markdown
---
name: skill-name-lowercase
description: Clear description of what this skill does and when to use it (max 1024 chars)
---

# Skill Title

[Detailed instructions, guidelines, examples]
```

---

## Decision Framework

When deciding whether to create a skill or BMAD component:

```
Is it a single, focused capability?
├── YES → Does it need state/memory between sessions?
│         ├── YES → BMAD Expert Agent
│         └── NO → Does it need multi-step user interaction?
│                  ├── YES → Could be simplified?
│                  │         ├── YES → Agent Skill
│                  │         └── NO → BMAD Workflow
│                  └── NO → Agent Skill ✅
│
└── NO → Is it a complex, template-driven process?
         ├── YES → BMAD Workflow
         └── NO → Break into smaller pieces and re-evaluate
```

---

## Next Steps

1. ~~**Build the skill installer**~~ ✅ - Added to CLI (GitHub Copilot + Claude Code)
2. **Test the sample skill** - Verify `document-sharding` works in VS Code and Claude Code after install
3. **Gather feedback** - Which capabilities would users want portable?
4. **Create Phase 1 skills** - Convert remaining utility tasks
5. **Document integration** - How BMAD workflows can leverage skills
6. **Community contribution** - Consider publishing useful skills to awesome-copilot
