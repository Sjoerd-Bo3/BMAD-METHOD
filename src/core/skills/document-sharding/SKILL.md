---
name: document-sharding
description: Split large markdown documents into smaller, organized files based on level 2 sections. Use when working with large PRDs, architecture docs, or any markdown files that need to be broken into manageable chunks for better navigation and maintainability. Uses npx @kayvan/markdown-tree-parser.
---

# Document Sharding Skill

Split large markdown documents into smaller, organized files based on level 2 (`##`) sections. This improves document maintainability, enables selective loading, and makes large docs easier to navigate.

## When to Use This Skill

- Large markdown documents (PRDs, architecture docs, specs) becoming unwieldy
- Need to break monolithic docs into maintainable chunks
- Want to enable selective loading of document sections
- Preparing documents for sharded workflows

## Prerequisites

- Node.js installed (for npx)
- Source document must be markdown (.md)

## Process

### Step 1: Identify the Source Document

Get the path to the markdown document to shard. Verify:
- File exists and is accessible
- File has `.md` extension

### Step 2: Determine Destination

Default destination: Same location as source, folder named after source file.

**Example:** `/docs/architecture.md` → `/docs/architecture/`

Ask user to confirm or provide custom path.

### Step 3: Execute Sharding

Run the sharding command:

```bash
npx @kayvan/markdown-tree-parser explode [source-document] [destination-folder]
```

This will:
- Create the destination folder
- Split document by level 2 headings
- Generate an `index.md` with table of contents
- Create individual files for each section

### Step 4: Verify Output

Check that:
- Destination folder contains sharded files
- `index.md` was created
- Section files are properly named

### Step 5: Handle Original Document

**Important:** Keeping both original and sharded versions causes confusion.

Present options:
- **[d] Delete** - Remove original (recommended - shards can be recombined)
- **[m] Move to archive** - Move to backup location
- **[k] Keep** - Leave in place (not recommended)

## Example

**Input:** A 500-line `architecture.md` with sections:
```markdown
# Architecture

## Overview
...

## Data Layer
...

## API Design
...

## Security
...
```

**Output:** `architecture/` folder containing:
```
architecture/
├── index.md          # TOC with links
├── overview.md
├── data-layer.md
├── api-design.md
└── security.md
```

## Reconstructing the Document

To reassemble sharded documents:
```bash
npx @kayvan/markdown-tree-parser implode [folder] [output-file]
```

## Guidelines

- Always verify the source file exists before sharding
- Create the destination directory if it doesn't exist
- Recommend deleting or archiving the original to avoid duplicate confusion
- The `index.md` serves as the entry point for the sharded document
