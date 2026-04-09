---
title: "Improve a Codebase with Coding Principles"
description: How to systematically apply coding principles, patterns, and practices to improve an existing codebase using BMad Method agents and workflows
---

Use BMad Method agents and structured improvement plans to systematically apply SOLID principles, DDD, design patterns, and best practices to an existing .NET/C#, TypeScript, or front-end codebase.

## When to Use This

- Your codebase has accumulated technical debt and needs structured improvement.
- You want to apply SOLID, DDD, or design patterns but need a plan.
- You are onboarding a legacy project and want to raise code quality incrementally.
- You want AI agents to help identify and fix code smells.

## When to Skip This

- The codebase is brand-new (use greenfield patterns from the start instead).
- You need a quick bug fix (use the [Quick Fix in Brownfield](/docs/how-to/brownfield/quick-fix-in-brownfield.md) guide).

:::note[Prerequisites]

- BMad Method installed (`npx bmad-method install`)
- An existing codebase with a working build and test suite
- Familiarity with the principles in [Coding Principles, Patterns, and Practices](/docs/reference/coding-principles-and-patterns.md)
:::

## Step 1: Document the Current State

Before improving anything, create an accurate picture of what exists. Use the `document-project` workflow with the Analyst agent.

Ask the Analyst to:

1. Scan the codebase for project structure, dependencies, and architecture.
2. Identify the current architectural style (layered, modular monolith, microservices, or unstructured).
3. Document existing patterns already in use (repository pattern, DI, MVC, etc.).
4. Note deviations from standard practices.

**Output:** a project context document and architecture overview that represents the current state.

## Step 2: Assess Code Quality

Use the Dev agent's **Code Review** workflow (`CR`) to perform a structured quality assessment. Focus the review on the following areas:

### SOLID Compliance

| Check | What to Look For |
|-------|-----------------|
| SRP violations | Classes with multiple responsibilities, services that do I/O and business logic |
| OCP violations | Switch statements or if-chains that grow with every new type |
| LSP violations | Subclasses that throw `NotImplementedException` |
| ISP violations | Large interfaces where implementations stub out methods |
| DIP violations | Direct `new` instantiation of services, missing DI registration |

### DDD Alignment

| Check | What to Look For |
|-------|-----------------|
| Anemic domain models | Entity classes with only getters/setters and no behavior |
| Missing bounded contexts | Tightly coupled modules sharing database tables directly |
| Missing value objects | Repeated primitive fields (`string street, string city, string zip`) |
| Aggregate boundary issues | External code reaching into aggregate internals |

### Code Smells

| Check | What to Look For |
|-------|-----------------|
| Long methods | Methods exceeding 20-30 lines |
| Large classes | Classes exceeding 300-500 lines |
| Feature envy | Methods that use other classes' data more than their own |
| Primitive obsession | Strings and integers used where domain types are needed |
| Duplicated logic | Copy-pasted blocks with minor variations |

### Front-End Quality (HTML/CSS/TypeScript)

| Check | What to Look For |
|-------|-----------------|
| Semantic HTML | Divs used where semantic elements should be |
| CSS organization | Inconsistent naming, excessive `!important`, missing custom properties |
| TypeScript strictness | `any` types, missing null checks, disabled strict mode |
| Component structure | Components with mixed concerns (data fetching + rendering + business logic) |

## Step 3: Prioritize Improvements

Use the Architect agent to create a prioritized improvement plan. Ask the Architect to rank findings by impact and effort:

| Priority | Criteria | Examples |
|----------|----------|---------|
| **High impact, low effort** | Quick wins that improve readability and safety immediately | Enable nullable reference types, replace magic strings with constants, add guard clauses |
| **High impact, high effort** | Structural improvements that prevent future debt | Introduce DI container, separate domain from infrastructure, establish bounded contexts |
| **Low impact, low effort** | Housekeeping tasks | Rename variables, remove dead code, fix formatting |
| **Low impact, high effort** | Defer or skip these | Full rewrite of working modules, speculative abstractions |

### Structuring the Plan as Epics and Stories

Ask the PM agent to convert the prioritized list into epics and stories. A proven structure:

**Epic 1: Foundation** — enable strict compiler options, configure DI, set up test infrastructure.

**Epic 2: SOLID Cleanup** — fix the highest-priority SRP and DIP violations. Introduce interfaces for key services.

**Epic 3: Domain Modeling** — introduce value objects for primitive-obsessed areas, define aggregate boundaries, move business logic into domain entities.

**Epic 4: Pattern Adoption** — introduce repository pattern, CQRS for complex read/write scenarios, or strategy pattern for polymorphic logic.

**Epic 5: Front-End Quality** — semantic HTML audit, CSS refactoring to BEM or utility classes, TypeScript strict mode enforcement.

## Step 4: Implement Incrementally

Use the Dev agent's **Dev Story** workflow (`DS`) to implement each story. Follow these rules to keep improvements safe:

### The Strangler Fig Approach

Do not rewrite working code in one shot. Instead:

1. Create the new abstraction (interface, service, value object) alongside existing code.
2. Route new code paths through the new abstraction.
3. Gradually migrate existing code to use the new abstraction.
4. Remove the old code once all consumers have migrated.

### Refactoring Safety Checklist

- [ ] Existing tests pass before starting.
- [ ] Each refactoring is a single commit.
- [ ] No behavior changes are mixed with structural changes.
- [ ] New tests are added for any newly extracted classes or interfaces.
- [ ] Existing tests still pass after each change.

### C# / .NET Specific Steps

| Improvement | How to Apply |
|-------------|-------------|
| Introduce DI | Register services in `Program.cs` using `builder.Services`. Replace `new` calls with constructor injection. |
| Enable nullable types | Add `<Nullable>enable</Nullable>` to `.csproj`. Fix warnings one project at a time. |
| Extract value objects | Identify primitive clumps. Create `record` types. Update entity properties and database mappings. |
| Add repository interfaces | Create `IRepository<T>` in the domain project. Implement with EF Core in the infrastructure project. |
| Introduce CQRS | Split complex services into `ICommand` / `IQuery` handlers. Use MediatR or a simple dispatcher. |

### TypeScript Specific Steps

| Improvement | How to Apply |
|-------------|-------------|
| Enable strict mode | Set `strict: true` in `tsconfig.json`. Fix errors file-by-file starting from leaf modules. |
| Replace `any` | Use `unknown` and type guards. Fix the strictest files first to build momentum. |
| Extract services | Move data fetching and business logic out of components into service classes or custom hooks. |
| Introduce discriminated unions | Replace boolean flags and string status fields with explicit union types. |
| Add barrel exports | Create `index.ts` files to enforce module boundaries and prevent deep imports. |

### HTML/CSS Specific Steps

| Improvement | How to Apply |
|-------------|-------------|
| Semantic HTML audit | Replace generic `<div>` wrappers with `<section>`, `<article>`, `<nav>`, `<main>`, etc. |
| Adopt BEM naming | Rename CSS classes following `.block__element--modifier` convention. Migrate one component at a time. |
| Introduce CSS custom properties | Extract repeated colors, spacing, and font sizes into `--custom-property` variables on `:root`. |
| Remove `!important` | Increase specificity through cascade layers (`@layer`) or more specific selectors. |

## Step 5: Validate and Review

After each epic, run a full Code Review (`CR`) with the Dev agent. Compare findings against the initial assessment from Step 2. Track improvements:

| Metric | How to Measure |
|--------|---------------|
| Test coverage | Use `dotnet test --collect:"XPlat Code Coverage"` or `c8`/`istanbul` for TypeScript. |
| Cyclomatic complexity | Use tools like NDepend (.NET) or eslint-plugin-complexity (TypeScript). |
| SOLID violations | Count remaining violations from code review. |
| Build warnings | Track compiler warning count — it should decrease over time. |
| Code smells | Re-run code review and compare counts against the baseline. |

## Agent Roles in Codebase Improvement

| Agent | Role in Improvement |
|-------|-------------------|
| **Analyst** | Documents current state, identifies gaps, researches alternative patterns. |
| **Architect** | Designs target architecture, prioritizes improvements, defines bounded contexts and module boundaries. |
| **PM** | Structures improvements into epics and stories, manages scope, prevents gold-plating. |
| **Dev** | Implements refactorings, writes tests, performs code reviews. |
| **SM (Scrum Master)** | Tracks progress, facilitates course corrections, ensures incremental delivery. |

## Tips

- Start with the compiler. Enabling strict options (nullable types in C#, strict mode in TypeScript) catches a large class of bugs with no runtime cost.
- Make refactoring commits separate from feature commits. This keeps the git history clean and makes code review easier.
- Do not refactor code that has no tests. Write characterization tests first, then refactor.
- Use feature flags or the Strangler Fig pattern for large changes. Never do a big-bang rewrite.
- Track code quality metrics over time. Improvement should be visible in numbers, not just feelings.
