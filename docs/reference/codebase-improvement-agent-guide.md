---
title: "Codebase Improvement Agent Guide"
---

A practical plan for using coding principles, design patterns, and AI-driven agents to systematically improve .NET/C#, JavaScript, TypeScript, HTML, and CSS codebases.

## Improvement Strategy Overview

Improving a codebase is not a single task — it is a continuous process organized into assessment, planning, execution, and verification phases.

| Phase | Goal | Key Activities |
|-------|------|----------------|
| 1. Assess | Understand the current state | Run static analysis, map architecture, identify pain points. |
| 2. Plan | Prioritize improvements | Score issues by impact and effort, group into themes, create a backlog. |
| 3. Execute | Apply improvements incrementally | Refactor, add tests, fix patterns, improve structure — one slice at a time. |
| 4. Verify | Confirm quality gains | Run tests, review metrics, validate that behavior is unchanged. |

## Phase 1 — Assess the Codebase

### Static Analysis Skills

Use automated tools to surface problems before any manual review.

| Skill | Tools (.NET/C#) | Tools (JS/TS) | What It Detects |
|-------|-----------------|---------------|-----------------|
| **Lint analysis** | Roslyn analyzers, StyleCop, SonarQube | ESLint, Biome | Code style, convention violations, potential bugs. |
| **Complexity analysis** | NDepend, CodeMaid | ESLint complexity rule, Plato | High cyclomatic complexity, deeply nested code. |
| **Dependency analysis** | NDepend, Visual Studio dependency diagrams | Madge, dependency-cruiser | Circular dependencies, tight coupling. |
| **Security scanning** | `dotnet security-scan`, Snyk | `npm audit`, Snyk, Socket | Known vulnerabilities in dependencies. |
| **Dead code detection** | Roslyn IDE analyzers, ReSharper | ts-prune, knip | Unused exports, unreachable code. |
| **Test coverage** | Coverlet, dotCover | c8, Istanbul/nyc | Uncovered code paths. |

### Architecture Assessment Checklist

- [ ] Identify all bounded contexts and module boundaries
- [ ] Map dependency directions — do all arrows point inward toward the domain?
- [ ] Locate shared mutable state or global singletons
- [ ] Find god classes (>300 lines, >5 dependencies)
- [ ] Identify anemic domain models (entities with only getters/setters, logic in services)
- [ ] Check for proper separation of concerns — is business logic mixed into controllers or views?
- [ ] Catalog external integrations and verify they are behind abstractions

### Code Smell Detection

| Smell | Indicator | Principle Violated |
|-------|-----------|-------------------|
| **God class** | Class over 300 lines with many responsibilities | SRP |
| **Feature envy** | Method uses more data from another class than its own | Tell, Don't Ask |
| **Long parameter list** | Method takes more than 4 parameters | Consider a parameter object |
| **Primitive obsession** | Using strings/ints for domain concepts like email, money | Use value objects (DDD) |
| **Shotgun surgery** | One logical change requires edits in many files | SRP, poor cohesion |
| **Divergent change** | One file changes for many different reasons | SRP |
| **Inappropriate intimacy** | Classes reach into each other's internals | Law of Demeter |
| **Dead code** | Unused methods, unreachable branches | YAGNI |
| **Duplicated logic** | Same algorithm implemented in multiple locations | DRY |

## Phase 2 — Plan Improvements

### Prioritization Matrix

Score each improvement on two axes and address high-impact, low-effort items first.

| Priority | Impact | Effort | Examples |
|----------|--------|--------|----------|
| **Do first** | High | Low | Add missing null checks, extract duplicate code, add basic tests. |
| **Schedule** | High | High | Introduce DDD aggregates, split monolith into modules, add CQRS. |
| **Quick wins** | Low | Low | Rename confusing variables, add XML-doc comments, fix linter warnings. |
| **Defer** | Low | High | Full UI rewrite, migrate to new framework. |

### Improvement Theme Backlog

Group improvements into themes for focused sprints:

| Theme | Principle Focus | Typical Tasks |
|-------|----------------|---------------|
| **Testability** | DIP, SRP | Inject dependencies, extract interfaces, add unit tests. |
| **Domain clarity** | DDD | Introduce value objects, aggregate roots, ubiquitous language. |
| **Reduce coupling** | ISP, DIP | Split fat interfaces, introduce mediator, add anti-corruption layers. |
| **Simplify complexity** | KISS, SRP | Extract methods, reduce nesting, break god classes apart. |
| **Frontend quality** | Semantic HTML, BEM, component design | Refactor to semantic elements, adopt BEM, extract reusable components. |
| **Error resilience** | Fail Fast, Result pattern | Replace exception-driven flow with result types, add validation layers. |
| **Security hardening** | Defense in depth | Add input validation, parameterize queries, review auth flows. |

## Phase 3 — Execute with Agents

Use specialized AI agents to apply improvements methodically. Each agent has a focused role, specific skills, and clear deliverables.

### Agent: Code Assessor

**Role:** Evaluate current codebase state and produce a findings report.

**Skills:**

- Run static analysis tools and aggregate results
- Identify violations of SOLID principles
- Map module boundaries and dependency directions
- Measure test coverage and complexity metrics

**Inputs:** Repository path, configuration for analysis tools.

**Outputs:** Assessment report with categorized findings, severity ratings, and suggested improvements.

**Workflow:**

1. Clone or access the repository
2. Run lint, complexity, and dependency analysis
3. Identify architectural patterns already in use
4. Catalog code smells grouped by violated principle
5. Produce a prioritized findings document

### Agent: Refactoring Implementer

**Role:** Apply targeted refactoring patterns to improve code quality without changing behavior.

**Skills:**

- Extract class, extract method, extract interface refactorings
- Introduce dependency injection where missing
- Replace primitive obsession with value objects
- Split god classes into focused, single-responsibility classes
- Apply the strategy, decorator, or mediator pattern to reduce complexity

**Inputs:** Specific refactoring task from the improvement backlog, relevant source files.

**Outputs:** Refactored code with all existing tests still passing.

**Workflow:**

1. Read the refactoring task and understand the target code
2. Verify existing tests pass before changes
3. Apply the refactoring in small, committed steps
4. Run tests after each step
5. Update or add tests to cover the refactored code
6. Document what changed and why in the commit messages

### Agent: Test Author

**Role:** Increase test coverage and quality for business-critical code paths.

**Skills:**

- Write unit tests following Arrange-Act-Assert
- Create integration tests for API endpoints and database access
- Apply test naming conventions (`MethodName_Scenario_ExpectedResult`)
- Build test data using the builder pattern
- Mock external dependencies using appropriate frameworks

**Inputs:** List of classes or modules needing tests, existing test patterns in the codebase.

**Outputs:** New test files with passing tests, updated coverage metrics.

**Workflow (.NET):**

1. Identify untested public methods and domain logic
2. Create test classes using xUnit or NUnit, matching project conventions
3. Write tests covering happy paths, edge cases, and error conditions
4. Use Moq or NSubstitute for dependency mocking
5. Run `dotnet test` and confirm all tests pass
6. Generate a coverage report with Coverlet

**Workflow (TypeScript):**

1. Identify untested exports and critical functions
2. Create test files using Vitest, Jest, or the project's existing framework
3. Write tests covering input variations and error handling
4. Run `npm test` and confirm all tests pass
5. Generate a coverage report with c8 or Istanbul

### Agent: DDD Restructurer

**Role:** Introduce or improve Domain-Driven Design patterns in the codebase.

**Skills:**

- Identify bounded contexts from existing code and business requirements
- Convert anemic models to rich domain entities with behavior
- Introduce value objects for domain concepts currently modeled as primitives
- Define aggregate boundaries and enforce aggregate rules
- Create domain events for cross-aggregate communication

**Inputs:** Existing domain models, business requirements document, bounded context map (if available).

**Outputs:** Restructured domain layer with entities, value objects, aggregates, and domain events.

**Workflow:**

1. Map the current domain model and identify entities, relationships, and rules
2. Identify value objects hiding as primitive types (email as string, money as decimal)
3. Define aggregate boundaries — group entities that must change together
4. Move business logic from services into the appropriate entities
5. Create domain events for side effects that cross aggregate boundaries
6. Update repositories to load and persist aggregates, not individual entities
7. Verify the domain model with domain experts using ubiquitous language

### Agent: Architecture Enforcer

**Role:** Ensure the codebase adheres to the chosen architectural pattern (Clean Architecture, Hexagonal, or Vertical Slices).

**Skills:**

- Validate dependency directions using architecture tests
- Detect layer violations (e.g., domain referencing infrastructure)
- Introduce or correct anti-corruption layers at integration boundaries
- Organize project structure to match the architectural style

**Inputs:** Target architecture pattern, current project structure, dependency analysis results.

**Outputs:** Architecture test suite, corrected project references, documented architecture decisions.

**Workflow (.NET):**

1. Define architecture rules using NetArchTest or ArchUnitNET
2. Write tests that assert dependency directions
3. Run architecture tests to find violations
4. Fix violations by introducing interfaces, moving classes, or adding adapter layers
5. Document the architecture decisions in an ADR (Architecture Decision Record)

**Workflow (TypeScript):**

1. Define module boundaries in dependency-cruiser configuration
2. Run dependency analysis to find circular or forbidden dependencies
3. Introduce barrel exports and module interfaces to enforce boundaries
4. Validate with CI-integrated dependency checks

### Agent: Frontend Improver

**Role:** Improve HTML semantics, CSS architecture, and component design in frontend code.

**Skills:**

- Refactor `<div>` soup to semantic HTML elements
- Introduce or enforce BEM naming conventions in CSS
- Extract reusable components from duplicated markup
- Add ARIA attributes and improve keyboard navigation
- Consolidate CSS custom properties (design tokens)
- Replace inline styles with structured CSS classes

**Inputs:** Frontend source files, accessibility audit results, design system documentation (if available).

**Outputs:** Refactored HTML/CSS with improved semantics, accessibility, and maintainability.

**Workflow:**

1. Audit HTML for semantic correctness — replace generic `<div>` with appropriate elements
2. Run an accessibility audit (axe-core, Lighthouse) and fix reported issues
3. Establish or enforce a CSS naming convention (BEM recommended)
4. Extract repeated CSS values into custom properties
5. Identify and extract repeated markup patterns into reusable components
6. Validate with automated accessibility tests

### Agent: Security Reviewer

**Role:** Identify and remediate security vulnerabilities in the codebase.

**Skills:**

- Review input validation and output encoding
- Check for SQL injection, XSS, CSRF, and insecure deserialization
- Audit authentication and authorization implementations
- Scan dependencies for known vulnerabilities
- Verify secrets management (no hardcoded credentials)

**Inputs:** Source code, dependency manifests, deployment configuration.

**Outputs:** Security findings report, remediated code, updated dependencies.

**Workflow:**

1. Run `dotnet security-scan` or `npm audit` for dependency vulnerabilities
2. Search for hardcoded secrets (connection strings, API keys, passwords)
3. Review all user input handling for proper validation and sanitization
4. Check all database queries use parameterized statements or an ORM
5. Verify authentication middleware configuration and token validation
6. Document findings and apply fixes with tests

## Phase 4 — Verify Improvements

### Verification Checklist

| Check | How to Verify |
|-------|---------------|
| **All tests pass** | `dotnet test` or `npm test` with zero failures. |
| **No regressions** | Compare test results before and after changes. |
| **Coverage improved** | Coverage percentage for changed files is equal or higher. |
| **Complexity reduced** | Cyclomatic complexity of refactored methods is lower. |
| **Lint clean** | Zero new warnings from static analysis tools. |
| **Architecture valid** | Architecture tests pass — no forbidden dependencies. |
| **Accessibility improved** | Lighthouse or axe-core accessibility score is equal or higher. |
| **Security scan clean** | No new vulnerabilities in dependency or code scans. |

### Continuous Improvement Integration

Embed quality checks into the development workflow to prevent regression:

| Practice | Implementation |
|----------|---------------|
| **Pre-commit hooks** | Run linters and formatters before every commit. |
| **CI pipeline gates** | Fail the build on test failures, lint errors, or coverage drops. |
| **Architecture tests in CI** | Run NetArchTest or dependency-cruiser on every PR. |
| **Automated security scanning** | Run `npm audit` or Snyk on every dependency change. |
| **Code review checklists** | Include SOLID, DDD, and pattern checks in review templates. |

## Agent Orchestration Workflow

Use the following workflow to coordinate agents across an improvement initiative:

```text
1. Code Assessor → produces findings report
2. Plan improvements → human reviews and prioritizes findings
3. For each improvement sprint:
   a. Refactoring Implementer → applies structural changes
   b. Test Author → adds/updates tests for changed code
   c. DDD Restructurer → (if applicable) improves domain model
   d. Frontend Improver → (if applicable) improves HTML/CSS/components
   e. Architecture Enforcer → validates structural compliance
   f. Security Reviewer → checks for new vulnerabilities
4. Verify phase → run full verification checklist
5. Repeat from step 1 with reduced scope each cycle
```

## Quick Reference — Principle to Agent Mapping

| Principle/Pattern | Primary Agent | Supporting Agent |
|-------------------|---------------|------------------|
| SOLID violations | Refactoring Implementer | Architecture Enforcer |
| DDD adoption | DDD Restructurer | Test Author |
| Test coverage gaps | Test Author | Code Assessor |
| Architectural drift | Architecture Enforcer | Code Assessor |
| Frontend quality | Frontend Improver | Security Reviewer |
| Security issues | Security Reviewer | Code Assessor |
| Code complexity | Refactoring Implementer | Test Author |
| Dependency issues | Architecture Enforcer | Security Reviewer |
