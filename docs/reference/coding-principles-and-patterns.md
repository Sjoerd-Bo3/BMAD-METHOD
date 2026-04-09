---
title: "Coding Principles, Patterns, and Practices"
description: Comprehensive reference for software design principles, patterns, and practices for .NET, C#, JavaScript, TypeScript, HTML, and CSS
---

A deep-dive reference covering Domain-Driven Design, SOLID principles, design patterns, and coding best practices — focused on .NET/C#, JavaScript/TypeScript, and front-end technologies.

## SOLID Principles

The five foundational principles of object-oriented design that produce maintainable, flexible software.

| Principle | Summary |
|-----------|---------|
| **Single Responsibility (SRP)** | A class should have one, and only one, reason to change. |
| **Open/Closed (OCP)** | Software entities should be open for extension but closed for modification. |
| **Liskov Substitution (LSP)** | Subtypes must be substitutable for their base types without altering correctness. |
| **Interface Segregation (ISP)** | Clients should not be forced to depend on interfaces they do not use. |
| **Dependency Inversion (DIP)** | High-level modules should not depend on low-level modules; both should depend on abstractions. |

### Single Responsibility Principle

Each class or module encapsulates exactly one concern. In C#, a `UserService` should handle user logic — not email sending, logging, or file I/O. In TypeScript, a React component renders UI; data fetching belongs in a hook or service layer.

**Violation signals:** classes with "And" in the name, methods longer than 30 lines, files that change for unrelated reasons.

### Open/Closed Principle

Extend behavior through abstraction (interfaces, base classes, strategy pattern) rather than modifying existing code. In C#, use `INotificationSender` with implementations like `EmailSender` and `SmsSender`. In TypeScript, use discriminated unions or plugin registries.

**Violation signals:** switch statements that grow with every new type, editing working code to add features.

### Liskov Substitution Principle

Any subclass must honor the contract of its parent. A `ReadOnlyRepository` that throws `NotSupportedException` on `Save()` violates LSP. Design interfaces so every implementation can fulfill the entire contract.

**Violation signals:** `NotImplementedException` / `NotSupportedException` in subclass overrides, type-checking with `is` or `instanceof` before calling methods.

### Interface Segregation Principle

Prefer many small, focused interfaces over one large interface. In C#, split `IRepository<T>` into `IReadRepository<T>` and `IWriteRepository<T>`. In TypeScript, use Pick/Omit utility types or separate interface declarations.

**Violation signals:** interfaces with more than five methods, implementations that stub out half the methods.

### Dependency Inversion Principle

Depend on abstractions, not concretions. In .NET, register interfaces in the DI container (`builder.Services.AddScoped<IOrderService, OrderService>()`). In TypeScript/Angular, use providers; in React, use context or dependency injection libraries.

**Violation signals:** `new` keyword for services inside other services, direct static method calls to infrastructure code.

## Domain-Driven Design

DDD is a software design approach that models complex business logic by aligning code structure with the business domain.

### Strategic Design

Strategic DDD defines organizational boundaries and relationships between large areas of the system.

| Concept | Definition |
|---------|------------|
| **Bounded Context** | An explicit boundary within which a domain model is defined and applicable. Different contexts may use the same term with different meanings. |
| **Ubiquitous Language** | A shared vocabulary between developers and domain experts, used consistently in code, documentation, and conversation. |
| **Context Map** | A visual representation showing all bounded contexts and the relationships between them. |
| **Anti-Corruption Layer** | A translation layer that protects one bounded context from the model of another. |
| **Shared Kernel** | A small, explicitly shared subset of the domain model between two bounded contexts. |

### Tactical Design

Tactical DDD provides the building blocks for modeling within a single bounded context.

| Building Block | Purpose |
|----------------|---------|
| **Entity** | An object defined by its identity (e.g., `Order` identified by `OrderId`) rather than its attributes. Has a lifecycle. |
| **Value Object** | An immutable object defined by its attributes (e.g., `Money`, `Address`). Two value objects with the same properties are equal. |
| **Aggregate** | A cluster of entities and value objects treated as a single unit for data changes. Has a root entity that controls access. |
| **Aggregate Root** | The single entity through which all external access to the aggregate flows. Only aggregate roots are referenced from outside. |
| **Repository** | Provides collection-like access to aggregates. Abstracts persistence. One repository per aggregate root. |
| **Domain Service** | Encapsulates domain logic that does not naturally belong to any entity or value object. Stateless. |
| **Domain Event** | A record of something significant that happened in the domain. Used for decoupling bounded contexts. |
| **Factory** | Encapsulates complex aggregate creation logic. Returns fully valid aggregates. |
| **Specification** | Encapsulates query logic or business rules as composable, reusable objects. |

### DDD in C# / .NET

In .NET projects, DDD maps naturally to the project structure:

- **Domain layer** — entities, value objects, aggregates, domain events, repository interfaces. No dependencies on infrastructure.
- **Application layer** — use cases/commands/queries (CQRS), DTOs, application services. References domain.
- **Infrastructure layer** — EF Core DbContext, repository implementations, external service clients. References domain and application.
- **API/Presentation layer** — controllers, minimal API endpoints, middleware. References application.

:::note[Example]
A typical .NET DDD project structure:

```text
src/
├── MyApp.Domain/            # Entities, ValueObjects, Interfaces
├── MyApp.Application/       # Commands, Queries, Handlers, DTOs
├── MyApp.Infrastructure/    # EF Core, Repositories, Email, etc.
└── MyApp.Api/               # Controllers, Middleware, Program.cs
```

:::

### DDD in TypeScript

In TypeScript, DDD principles map to module boundaries:

- Use classes or branded types for value objects.
- Use folder-based bounded contexts (e.g., `src/ordering/`, `src/catalog/`).
- Use barrel exports (`index.ts`) to enforce module boundaries.
- Use the Repository pattern with interfaces for data access abstraction.

## Design Patterns

### Creational Patterns

Patterns that deal with object creation mechanisms.

| Pattern | Intent | When to Use |
|---------|--------|-------------|
| **Factory Method** | Define an interface for creating objects; let subclasses decide which class to instantiate. | When the exact type to create is determined at runtime. |
| **Abstract Factory** | Create families of related objects without specifying concrete classes. | When the system must be independent of how its products are created. |
| **Builder** | Separate construction of a complex object from its representation. | When construction involves many steps or optional parameters. C# example: `FluentValidation`, `IHostBuilder`. |
| **Singleton** | Ensure a class has only one instance and provide global access. | When exactly one instance is needed (logging, configuration). In .NET, use DI with `AddSingleton` instead of static singletons. |
| **Prototype** | Create objects by cloning an existing instance. | When object creation is expensive and a similar object already exists. |

### Structural Patterns

Patterns that compose classes and objects into larger structures.

| Pattern | Intent | When to Use |
|---------|--------|-------------|
| **Adapter** | Convert one interface to another that clients expect. | Integrating third-party libraries or legacy code. C# example: wrapping a third-party HTTP client behind your own `IHttpService`. |
| **Bridge** | Decouple an abstraction from its implementation. | When both the abstraction and implementation may vary independently. |
| **Composite** | Compose objects into tree structures. | UI component trees, file system hierarchies, menu structures. |
| **Decorator** | Add responsibilities to objects dynamically. | Cross-cutting concerns. C# example: `HttpClient` message handlers. TS example: class decorators in Angular. |
| **Facade** | Provide a simplified interface to a subsystem. | When a complex subsystem has many moving parts. C# example: a `PaymentFacade` coordinating validation, authorization, and processing. |
| **Proxy** | Control access to an object. | Lazy loading, access control, logging. C# example: `Lazy<T>`, EF Core lazy-loading proxies. |

### Behavioral Patterns

Patterns that define communication between objects.

| Pattern | Intent | When to Use |
|---------|--------|-------------|
| **Strategy** | Define a family of algorithms and make them interchangeable. | When behavior needs to vary at runtime. C# example: `IComparer<T>`, pricing strategies. TS example: validation strategies. |
| **Observer** | One-to-many dependency: when one object changes, all dependents are notified. | Event systems. C# example: events and delegates. TS example: RxJS `Subject`, EventEmitter. |
| **Command** | Encapsulate a request as an object. | Undo/redo, task queuing, CQRS. C# example: MediatR `IRequest<T>`. |
| **Mediator** | Reduce direct dependencies between objects by routing communication through a central object. | Complex UI component interactions, CQRS with MediatR. |
| **Chain of Responsibility** | Pass requests along a chain of handlers. | Middleware pipelines. C# example: ASP.NET Core middleware. TS example: Express middleware. |
| **Template Method** | Define the skeleton of an algorithm; let subclasses override specific steps. | Frameworks where the overall flow is fixed but details vary. |
| **State** | Allow an object to alter its behavior when its internal state changes. | Workflow engines, order status management, UI state machines. |
| **Iterator** | Sequentially access elements of a collection without exposing the underlying representation. | Custom collections. C# example: `IEnumerable<T>` / `IAsyncEnumerable<T>`. TS example: `Symbol.iterator`. |
| **Visitor** | Add operations to objects without modifying them. | Processing AST nodes, applying operations across polymorphic hierarchies. |

## Architectural Patterns

| Pattern | Summary | When to Use |
|---------|---------|-------------|
| **Clean Architecture** | Concentric layers with the domain at the center. Dependencies point inward. | Projects that need long-term maintainability and testability. |
| **Hexagonal Architecture (Ports & Adapters)** | Application core communicates through ports (interfaces); adapters plug in infrastructure. | When you want to easily swap infrastructure (database, messaging, UI). |
| **CQRS** | Separate read models from write models. | When read and write workloads have different performance or modeling requirements. |
| **Event Sourcing** | Persist domain events instead of current state. Rebuild state by replaying events. | Audit trails, complex workflows, financial systems. |
| **Microservices** | Decompose a system into independently deployable services aligned with bounded contexts. | Large teams, independent deployment, polyglot tech stacks. |
| **Modular Monolith** | A single deployable unit with strong internal module boundaries. | When you need bounded contexts but microservices are premature. |
| **MVC / MVVM / MVP** | Separate presentation from domain logic. MVC for server-side, MVVM for WPF/Blazor/Angular, MVP for testable UIs. | Any application with a user interface. |
| **Repository Pattern** | Abstract data access behind a collection-like interface. | When you want to decouple domain logic from data access technology. |
| **Unit of Work** | Track changes across multiple repositories and commit them as a single transaction. | When multiple aggregates must be persisted atomically. C# example: EF Core `DbContext`. |

## Additional Coding Principles

### DRY, KISS, and YAGNI

| Principle | Summary |
|-----------|---------|
| **DRY (Don't Repeat Yourself)** | Every piece of knowledge should have a single, unambiguous representation. Eliminate duplication of logic — but avoid premature abstraction. |
| **KISS (Keep It Simple, Stupid)** | Prefer the simplest solution that works. Complexity is the primary enemy of maintainability. |
| **YAGNI (You Aren't Gonna Need It)** | Do not build features or abstractions until they are actually needed. Speculative generality leads to waste. |

### Law of Demeter (Principle of Least Knowledge)

An object should only talk to its immediate collaborators. Avoid chaining calls like `order.Customer.Address.City`. Instead, provide a method on `Order` that encapsulates the needed behavior.

### Composition Over Inheritance

Favor composing behavior through interfaces and delegation over deep inheritance hierarchies. In C#, use interface implementations and DI. In TypeScript, use mixins, higher-order functions, or composition of hooks.

### Separation of Concerns

Each module, layer, or component should address a distinct concern. HTML for structure, CSS for presentation, TypeScript for behavior. On the server: controllers handle HTTP, services handle business logic, repositories handle data.

### Tell, Don't Ask

Instead of querying an object's state and making decisions externally, tell the object what to do and let it use its own state to decide how.

### Fail Fast

Detect and report errors as close to their origin as possible. Use guard clauses, input validation, and strong typing to surface issues early.

### Immutability

Prefer immutable data structures and `readonly` properties. In C#, use `record` types and `init`-only setters. In TypeScript, use `Readonly<T>`, `as const`, and avoid mutation. Immutability eliminates entire classes of bugs related to shared state.

## Front-End Principles (HTML, CSS, TypeScript)

### HTML Best Practices

| Practice | Description |
|----------|-------------|
| **Semantic HTML** | Use `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`, `<main>` instead of generic `<div>` elements. Improves accessibility and SEO. |
| **Accessibility (a11y)** | Always include `alt` attributes, use ARIA roles and labels where semantic HTML is insufficient, ensure keyboard navigation works. |
| **Progressive Enhancement** | Build core functionality with HTML, enhance with CSS, add interactivity with JavaScript. |
| **Form Validation** | Use native HTML5 validation attributes (`required`, `pattern`, `min`, `max`) as the first layer. Add JavaScript validation as a second layer. |

### CSS Best Practices

| Practice | Description |
|----------|-------------|
| **BEM (Block Element Modifier)** | Naming convention (`.block__element--modifier`) that creates clear, flat, predictable class hierarchies. |
| **CSS Custom Properties** | Use CSS variables (`--color-primary`) for theming and consistency. More flexible than preprocessor variables at runtime. |
| **Mobile-First Design** | Write base styles for mobile, then use `min-width` media queries to progressively enhance for larger screens. |
| **Avoid !important** | Use specificity management and cascade layers (`@layer`) instead. `!important` makes styles hard to override and debug. |
| **Logical Properties** | Use `margin-inline`, `padding-block` instead of `margin-left`, `padding-top` for better internationalization support. |
| **Container Queries** | Use `@container` for component-level responsive design instead of relying solely on viewport-based media queries. |

### TypeScript Best Practices

| Practice | Description |
|----------|-------------|
| **Strict Mode** | Enable `strict: true` in `tsconfig.json`. Catches null errors, implicit `any`, and other common mistakes at compile time. |
| **Discriminated Unions** | Model state variants explicitly (`type Result = Success | Failure`). Safer than string/boolean flags. |
| **Branded Types** | Create nominal types for primitive values (`type UserId = string & { __brand: 'UserId' }`) to prevent accidental misuse. |
| **Exhaustive Checks** | Use `never` type in switch defaults to ensure all union variants are handled. |
| **Prefer `unknown` over `any`** | `unknown` is the type-safe counterpart to `any`. Forces explicit type narrowing before use. |
| **Readonly by Default** | Use `readonly` modifier on properties, `Readonly<T>` for objects, and `ReadonlyArray<T>` for arrays. |

## Testing Principles

| Principle | Description |
|-----------|-------------|
| **Arrange-Act-Assert (AAA)** | Structure every test in three clear phases: set up inputs, execute the action, verify the outcome. |
| **Test Behavior, Not Implementation** | Tests should validate what code does, not how it does it. Avoids brittle tests that break on refactoring. |
| **Test Pyramid** | Many unit tests (fast, isolated), fewer integration tests (verify component interactions), minimal end-to-end tests (expensive, slow). |
| **Given-When-Then (BDD)** | Express tests in business language: Given a precondition, When an action occurs, Then an outcome is expected. |
| **Mutation Testing** | Introduce small changes (mutations) into production code and verify that tests catch them. Measures test quality beyond code coverage. |
| **Test Isolation** | Each test should be independent. No shared mutable state between tests. Each test sets up and tears down its own context. |
| **Deterministic Tests** | Tests should produce the same result every time. Avoid dependencies on system time, network, or random values — use fakes/stubs. |

### Testing in C# / .NET

Use xUnit or NUnit as the test framework, FluentAssertions for readable assertions, NSubstitute or Moq for mocking, and Bogus or AutoFixture for test data generation. Structure test projects to mirror the source project (e.g., `MyApp.Domain.Tests`).

### Testing in TypeScript

Use Vitest or Jest as the test runner, Testing Library for component tests, Playwright or Cypress for E2E tests. Co-locate tests with source files (`*.test.ts` or `*.spec.ts`) or use a parallel `__tests__` directory.

## Code Quality and Refactoring

### Code Smells

Common indicators that code needs improvement:

| Smell | Description | Typical Fix |
|-------|-------------|-------------|
| **Long Method** | Method exceeds 20-30 lines and does too many things. | Extract Method. |
| **Large Class** | Class has too many responsibilities. | Extract Class, apply SRP. |
| **Feature Envy** | A method uses another class's data more than its own. | Move Method to the class that owns the data. |
| **Primitive Obsession** | Using primitives (string, int) where a value object would be clearer. | Replace with Value Object. |
| **Shotgun Surgery** | A single change requires edits in many classes. | Move related logic together, consolidate responsibility. |
| **Divergent Change** | One class is changed for many different reasons. | Split into classes with single responsibilities. |
| **Data Clumps** | Groups of data that always appear together. | Extract a class or value object. |
| **Switch Statements** | Repeated switch/case or if/else chains on the same type. | Replace with polymorphism or Strategy pattern. |
| **Speculative Generality** | Unused abstractions built "just in case." | Remove unused code. Apply YAGNI. |
| **Dead Code** | Code that is never executed. | Remove it. Version control preserves history. |

### Refactoring Strategies

| Strategy | Description |
|----------|-------------|
| **Extract Method** | Pull a block of code into a named method. Improves readability and enables reuse. |
| **Extract Class / Interface** | Split a class that has multiple responsibilities. |
| **Inline Method / Variable** | Remove unnecessary indirection when a method or variable adds no clarity. |
| **Rename** | Use clear, descriptive names. Naming is the most impactful refactoring. |
| **Replace Conditional with Polymorphism** | Convert type-checking conditionals into a class hierarchy or strategy. |
| **Introduce Parameter Object** | Group related parameters into a single object. |
| **Replace Magic Numbers/Strings** | Use named constants or enums. |
| **Strangler Fig** | Incrementally replace legacy code by routing traffic to new implementations behind an interface. |

## Concurrency and Async Patterns

| Pattern | Description |
|---------|-------------|
| **async/await** | In C#, use `async Task` / `async Task<T>` for I/O-bound operations. In TypeScript, use `async`/`await` with Promises. Avoid blocking calls (`.Result`, `.Wait()` in C#). |
| **Cancellation Tokens** | In .NET, pass `CancellationToken` through async call chains to support cooperative cancellation. |
| **Immutable Shared State** | Use immutable objects or thread-safe collections when data is shared across threads. |
| **Channel / Producer-Consumer** | Use `System.Threading.Channels` in .NET or async iterables in TypeScript for producer-consumer workflows. |
| **Retry with Backoff** | Use Polly (C#) or similar libraries (TypeScript) for transient fault handling with exponential backoff and circuit breaker patterns. |

## Security Principles

| Principle | Description |
|-----------|-------------|
| **Input Validation** | Validate all inputs at the boundary. Never trust client data. Use allow-lists over deny-lists. |
| **Output Encoding** | Encode output for the appropriate context (HTML, URL, JavaScript, SQL) to prevent injection attacks. |
| **Principle of Least Privilege** | Grant only the minimum permissions required. Apply to database accounts, API keys, file system access, and user roles. |
| **Defense in Depth** | Layer multiple security controls. Do not rely on a single mechanism (e.g., firewall alone). |
| **Secrets Management** | Never store secrets in source code. Use environment variables, Azure Key Vault, AWS Secrets Manager, or similar. |
| **HTTPS Everywhere** | Enforce TLS for all communications. In ASP.NET Core, use `UseHttpsRedirection()`. |
| **CORS Configuration** | Explicitly configure allowed origins instead of using wildcard (`*`). |
| **Authentication and Authorization** | Use established frameworks (ASP.NET Identity, OAuth 2.0 / OIDC). Never roll your own crypto. |

## .NET / C# Specific Practices

| Practice | Description |
|----------|-------------|
| **Nullable Reference Types** | Enable `<Nullable>enable</Nullable>` to catch null reference errors at compile time. |
| **Records** | Use `record` types for immutable DTOs and value objects. Provides value equality, deconstruction, and `with` expressions. |
| **Minimal APIs** | For simple HTTP services, use minimal APIs instead of full controller hierarchies. |
| **Options Pattern** | Use `IOptions<T>` / `IOptionsSnapshot<T>` for strongly typed configuration instead of reading raw strings. |
| **Health Checks** | Implement `IHealthCheck` for monitoring database connectivity, external service availability, and application readiness. |
| **Global Error Handling** | Use middleware (or `IExceptionHandler` in .NET 8+) for centralized error handling. Return problem details (RFC 9457). |
| **Source Generators** | Use compile-time source generators for boilerplate (JSON serialization, mapping, logging) instead of runtime reflection. |
| **EF Core Best Practices** | Use `AsNoTracking()` for read-only queries. Avoid lazy loading in web APIs. Use migrations for schema management. |
