---
title: "Coding Principles, Patterns, and Practices"
---

A comprehensive reference of software engineering principles, design patterns, and architectural concepts with practical guidance for .NET/C#, JavaScript, TypeScript, HTML, and CSS codebases.

## SOLID Principles

The five foundational object-oriented design principles that produce maintainable, extensible software.

| Principle | Summary |
|-----------|---------|
| **Single Responsibility (SRP)** | A class should have one, and only one, reason to change. |
| **Open/Closed (OCP)** | Software entities should be open for extension but closed for modification. |
| **Liskov Substitution (LSP)** | Subtypes must be substitutable for their base types without altering correctness. |
| **Interface Segregation (ISP)** | Clients should not be forced to depend on interfaces they do not use. |
| **Dependency Inversion (DIP)** | High-level modules should depend on abstractions, not concrete implementations. |

### Single Responsibility Principle

Each class or module owns exactly one piece of functionality. When a change is needed, only one class should require modification.

**C# example — before:**

```csharp
public class OrderService
{
    public void CreateOrder(Order order) { /* persistence + validation + email */ }
}
```

**C# example — after:**

```csharp
public class OrderValidator { public bool Validate(Order order) { /* ... */ } }
public class OrderRepository { public void Save(Order order) { /* ... */ } }
public class OrderNotifier  { public void Notify(Order order) { /* ... */ } }
```

**TypeScript example:**

```typescript
// Each concern in its own module
export class OrderValidator {
  validate(order: Order): ValidationResult { /* ... */ }
}
export class OrderRepository {
  save(order: Order): Promise<void> { /* ... */ }
}
```

### Open/Closed Principle

Extend behavior through new code rather than modifying existing code. Common techniques include inheritance, composition, and strategy injection.

**C# example — strategy pattern for OCP:**

```csharp
public interface IDiscountStrategy
{
    decimal Calculate(Order order);
}

public class SeasonalDiscount : IDiscountStrategy
{
    public decimal Calculate(Order order) => order.Total * 0.1m;
}

public class OrderProcessor
{
    private readonly IDiscountStrategy _discount;
    public OrderProcessor(IDiscountStrategy discount) => _discount = discount;
    public decimal Process(Order order) => order.Total - _discount.Calculate(order);
}
```

**TypeScript example:**

```typescript
interface DiscountStrategy {
  calculate(order: Order): number;
}

class SeasonalDiscount implements DiscountStrategy {
  calculate(order: Order): number { return order.total * 0.1; }
}
```

### Liskov Substitution Principle

Derived classes must honor the contract of their base class. Violating LSP leads to fragile `if/else` type-checking code.

**C# violation:**

```csharp
public class ReadOnlyRepository : Repository
{
    public override void Save(Entity entity)
    {
        throw new NotSupportedException(); // Violates LSP
    }
}
```

**C# fix — separate interfaces:**

```csharp
public interface IReadRepository { Entity GetById(int id); }
public interface IWriteRepository { void Save(Entity entity); }
```

### Interface Segregation Principle

Split large interfaces into smaller, role-specific ones so implementers are not burdened with methods they do not need.

**C# example:**

```csharp
// Instead of one IWorker with Work(), Eat(), Sleep()
public interface IWorkable { void Work(); }
public interface IFeedable { void Eat(); }
```

**TypeScript example:**

```typescript
interface Readable { read(): Promise<Buffer>; }
interface Writable { write(data: Buffer): Promise<void>; }
// Compose as needed
interface ReadWritable extends Readable, Writable {}
```

### Dependency Inversion Principle

Depend on abstractions, not on concrete classes. In .NET, this is implemented through constructor injection and the built-in DI container.

**C# example with .NET DI:**

```csharp
// Registration
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();

// Usage — depends on abstraction
public class OrderService
{
    private readonly IOrderRepository _repo;
    public OrderService(IOrderRepository repo) => _repo = repo;
}
```

**TypeScript example with manual DI:**

```typescript
class OrderService {
  constructor(private readonly repo: OrderRepository) {}
}
// Compose at startup
const service = new OrderService(new SqlOrderRepository());
```

## General Coding Principles

| Principle | Summary |
|-----------|---------|
| **DRY** (Don't Repeat Yourself) | Every piece of knowledge should have a single, unambiguous representation. |
| **KISS** (Keep It Simple, Stupid) | Prefer the simplest solution that works correctly. |
| **YAGNI** (You Aren't Gonna Need It) | Do not build features or abstractions until they are actually needed. |
| **Composition over Inheritance** | Favor object composition over class inheritance for code reuse. |
| **Separation of Concerns** | Divide a program into distinct sections, each addressing a separate concern. |
| **Law of Demeter** | A method should only call methods on its immediate dependencies, not on objects returned by those dependencies. |
| **Principle of Least Astonishment** | Code should behave in ways that least surprise the reader. |
| **Fail Fast** | Detect and report errors as close to the source as possible. |
| **Tell, Don't Ask** | Command objects to perform work rather than querying their state and acting on it externally. |
| **Command-Query Separation** | Methods should either change state (command) or return data (query), not both. |

### DRY — Don't Repeat Yourself

Eliminate duplication of logic, not just code text. Extract shared behavior into functions, base classes, or shared modules.

**C# example — extract shared validation:**

```csharp
public static class ValidationRules
{
    public static bool IsValidEmail(string email) =>
        Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
}
```

**TypeScript example — shared utility:**

```typescript
export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
```

**CSS example — design tokens:**

```css
:root {
  --color-primary: #0066cc;
  --spacing-md: 1rem;
  --border-radius: 4px;
}

.card { border-radius: var(--border-radius); padding: var(--spacing-md); }
.button { border-radius: var(--border-radius); }
```

### Composition over Inheritance

Build complex behavior by combining simpler objects rather than extending deep class hierarchies. This keeps code flexible and testable.

**C# example:**

```csharp
public class NotificationService
{
    private readonly IEnumerable<INotificationChannel> _channels;
    public NotificationService(IEnumerable<INotificationChannel> channels) =>
        _channels = channels;
    public async Task NotifyAsync(Message msg)
    {
        foreach (var channel in _channels) await channel.SendAsync(msg);
    }
}
```

**TypeScript example — mixins:**

```typescript
type Constructor<T = {}> = new (...args: any[]) => T;

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
  };
}

function SoftDeletable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    deletedAt: Date | null = null;
    softDelete() { this.deletedAt = new Date(); }
  };
}

class Entity {}
class User extends Timestamped(SoftDeletable(Entity)) {}
```

## Domain-Driven Design

Domain-Driven Design (DDD) is a strategic and tactical approach to software development that places the core business domain at the center of all design decisions.

### Strategic DDD Concepts

| Concept | Definition |
|---------|------------|
| **Ubiquitous Language** | Shared vocabulary between developers and domain experts used consistently in code, conversation, and documentation. |
| **Bounded Context** | An explicit boundary within which a particular domain model applies. Each context has its own language and models. |
| **Context Map** | A visual or documented representation of how bounded contexts relate and integrate. |
| **Subdomain** | A segment of the overall business domain — core, supporting, or generic. |
| **Anti-Corruption Layer** | A translation layer that prevents one context's model from leaking into another. |

### Subdomain Types

| Type | Characteristics | Strategy |
|------|----------------|----------|
| **Core** | Competitive advantage, highest business value | Custom build, invest heavily |
| **Supporting** | Necessary but not differentiating | Build in-house with simpler design |
| **Generic** | Common across industries (auth, email) | Buy or use off-the-shelf solutions |

### Tactical DDD Building Blocks

| Building Block | Purpose |
|----------------|---------|
| **Entity** | Domain object with a unique identity that persists across state changes. |
| **Value Object** | Immutable object defined only by its attribute values, with no identity. |
| **Aggregate** | Cluster of entities and value objects treated as a single unit for data changes. Has a root entity. |
| **Aggregate Root** | The single entity through which all access to the aggregate is controlled. |
| **Repository** | Abstraction for persisting and retrieving aggregates. |
| **Domain Service** | Stateless operation that does not naturally belong to any entity or value object. |
| **Domain Event** | Record of something meaningful that happened in the domain. |
| **Factory** | Encapsulates complex object or aggregate creation. |
| **Specification** | Reusable business rule that can evaluate whether a domain object satisfies a condition. |

### Aggregate Design Rules

1. **Protect invariants within the aggregate boundary.** The aggregate root enforces all business rules for the cluster.
2. **Reference other aggregates by identity only.** Do not hold direct object references to other aggregate roots.
3. **Modify one aggregate per transaction.** Use domain events for cross-aggregate side effects.
4. **Design small aggregates.** Include only what is required to enforce invariants.

### C# DDD Example — Value Object

```csharp
public record Money(decimal Amount, string Currency)
{
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("Currency mismatch");
        return this with { Amount = Amount + other.Amount };
    }
}
```

### C# DDD Example — Entity and Aggregate Root

```csharp
public class Order
{
    public OrderId Id { get; private set; }
    private readonly List<OrderLine> _lines = new();
    public IReadOnlyCollection<OrderLine> Lines => _lines.AsReadOnly();

    public void AddLine(ProductId productId, int quantity, Money unitPrice)
    {
        if (quantity <= 0) throw new DomainException("Quantity must be positive");
        _lines.Add(new OrderLine(productId, quantity, unitPrice));
    }

    public Money CalculateTotal() =>
        _lines.Aggregate(
            new Money(0, "USD"),
            (sum, line) => sum.Add(line.LineTotal));
}
```

### C# DDD Example — Repository Interface

```csharp
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(OrderId id);
    Task SaveAsync(Order order);
}
```

### C# DDD Example — Domain Event

```csharp
public record OrderPlacedEvent(OrderId OrderId, DateTime OccurredAt) : IDomainEvent;
```

### TypeScript DDD Example — Value Object

```typescript
class Money {
  constructor(
    readonly amount: number,
    readonly currency: string
  ) {}

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error("Currency mismatch");
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

### Bounded Context Integration Patterns

| Pattern | When to Use |
|---------|-------------|
| **Shared Kernel** | Two teams agree to share a small, co-maintained model subset. |
| **Customer-Supplier** | Upstream team provides what downstream team needs. |
| **Conformist** | Downstream team accepts upstream model as-is. |
| **Anti-Corruption Layer** | Downstream team translates upstream model to protect its own model. |
| **Open Host Service** | Upstream exposes a well-defined protocol or API. |
| **Published Language** | A documented, shared data format (JSON schema, protobuf). |

## Design Patterns

### Creational Patterns

| Pattern | Intent | Common Use |
|---------|--------|------------|
| **Singleton** | Ensure a class has one instance and provide a global access point. | Configuration, logging, connection pools. |
| **Factory Method** | Define an interface for creating objects but let subclasses decide the concrete type. | Plugin systems, polymorphic creation. |
| **Abstract Factory** | Provide an interface for creating families of related objects. | UI toolkit themes, cross-platform factories. |
| **Builder** | Separate construction of a complex object from its representation. | Fluent API configuration, test data builders. |
| **Prototype** | Create new objects by cloning an existing instance. | Configuration templates, object pools. |

### C# Builder Pattern Example

```csharp
public class QueryBuilder
{
    private string _table = "";
    private readonly List<string> _conditions = new();

    public QueryBuilder From(string table) { _table = table; return this; }
    public QueryBuilder Where(string condition) { _conditions.Add(condition); return this; }
    public string Build() =>
        $"SELECT * FROM {_table}" +
        (_conditions.Count > 0 ? " WHERE " + string.Join(" AND ", _conditions) : "");
}

// Usage
var query = new QueryBuilder().From("Orders").Where("Status = 'Active'").Build();
```

### TypeScript Factory Pattern Example

```typescript
interface Logger { log(message: string): void; }
class ConsoleLogger implements Logger { log(msg: string) { console.log(msg); } }
class FileLogger implements Logger { log(msg: string) { /* write to file */ } }

function createLogger(type: "console" | "file"): Logger {
  switch (type) {
    case "console": return new ConsoleLogger();
    case "file": return new FileLogger();
  }
}
```

### Structural Patterns

| Pattern | Intent | Common Use |
|---------|--------|------------|
| **Adapter** | Convert one interface to another that the client expects. | Wrapping third-party libraries, legacy integration. |
| **Bridge** | Decouple an abstraction from its implementation so both can vary independently. | Cross-platform rendering, driver layers. |
| **Composite** | Compose objects into tree structures to represent part-whole hierarchies. | UI component trees, file systems. |
| **Decorator** | Attach additional responsibilities to an object dynamically. | Middleware, stream wrappers, logging. |
| **Facade** | Provide a simplified interface to a complex subsystem. | API gateways, service aggregation. |
| **Flyweight** | Share common state across many objects to reduce memory usage. | Text rendering, game sprites. |
| **Proxy** | Provide a surrogate or placeholder to control access to another object. | Lazy loading, access control, caching. |

### C# Decorator Pattern Example

```csharp
public interface IMessageSender { Task SendAsync(string message); }

public class EmailSender : IMessageSender
{
    public Task SendAsync(string message) { /* send email */ return Task.CompletedTask; }
}

public class LoggingMessageSender : IMessageSender
{
    private readonly IMessageSender _inner;
    private readonly ILogger _logger;

    public LoggingMessageSender(IMessageSender inner, ILogger logger)
    {
        _inner = inner;
        _logger = logger;
    }

    public async Task SendAsync(string message)
    {
        _logger.LogInformation("Sending message: {Message}", message);
        await _inner.SendAsync(message);
        _logger.LogInformation("Message sent successfully");
    }
}
```

### TypeScript Proxy Pattern Example

```typescript
class CachingRepository<T> implements Repository<T> {
  private cache = new Map<string, T>();

  constructor(private readonly inner: Repository<T>) {}

  async getById(id: string): Promise<T | undefined> {
    if (this.cache.has(id)) return this.cache.get(id);
    const result = await this.inner.getById(id);
    if (result) this.cache.set(id, result);
    return result;
  }
}
```

### Behavioral Patterns

| Pattern | Intent | Common Use |
|---------|--------|------------|
| **Strategy** | Define a family of algorithms and make them interchangeable. | Sorting, validation, pricing rules. |
| **Observer** | Define a one-to-many dependency so dependents are notified of state changes. | Event systems, reactive UI. |
| **Command** | Encapsulate a request as an object. | Undo/redo, task queues, CQRS. |
| **Mediator** | Define an object that coordinates interaction between colleagues. | MediatR in .NET, event buses. |
| **Chain of Responsibility** | Pass a request along a chain of handlers until one handles it. | ASP.NET middleware, validation pipelines. |
| **Template Method** | Define the skeleton of an algorithm, deferring steps to subclasses. | Framework hooks, lifecycle methods. |
| **State** | Allow an object to alter its behavior when its internal state changes. | Workflow engines, UI state machines. |
| **Iterator** | Provide sequential access to elements without exposing the underlying structure. | `IEnumerable<T>`, `for...of`. |
| **Visitor** | Represent an operation to be performed on elements of an object structure. | AST traversal, report generation. |
| **Memento** | Capture and externalize an object's state for later restoration. | Undo systems, snapshots. |

### C# Mediator Pattern Example (MediatR-Style)

```csharp
public record CreateOrderCommand(string CustomerId, List<OrderLineDto> Lines) : IRequest<OrderId>;

public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, OrderId>
{
    private readonly IOrderRepository _repo;
    public CreateOrderHandler(IOrderRepository repo) => _repo = repo;

    public async Task<OrderId> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Lines);
        await _repo.SaveAsync(order);
        return order.Id;
    }
}
```

### TypeScript Observer Pattern Example

```typescript
type Listener<T> = (event: T) => void;

class EventEmitter<T> {
  private listeners: Listener<T>[] = [];

  subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(event: T): void {
    for (const listener of this.listeners) listener(event);
  }
}
```

## Architectural Patterns

| Pattern | Description |
|---------|-------------|
| **Clean Architecture** | Concentric layers where dependencies point inward. Domain at the center, infrastructure at the edge. |
| **Hexagonal (Ports and Adapters)** | Core domain exposes ports (interfaces); adapters plug in for database, UI, messaging. |
| **Onion Architecture** | Similar to clean architecture with domain model at the core, surrounded by domain services, application services, and infrastructure. |
| **CQRS** | Separate read models from write models. Commands mutate state; queries return data. |
| **Event Sourcing** | Persist state as a sequence of domain events rather than current state snapshots. |
| **Vertical Slice Architecture** | Organize code by feature slice rather than technical layer. Each slice is self-contained. |
| **Microservices** | Decompose an application into small, independently deployable services. |
| **Modular Monolith** | A single deployable unit organized into well-defined, loosely coupled modules. |

### Clean Architecture Layer Responsibilities

| Layer | Contains | Depends On |
|-------|----------|------------|
| **Domain** | Entities, value objects, domain services, interfaces | Nothing |
| **Application** | Use cases, DTOs, application services, interface definitions | Domain |
| **Infrastructure** | Database access, file I/O, external APIs, frameworks | Application, Domain |
| **Presentation** | Controllers, views, API endpoints | Application |

### C# Clean Architecture Project Structure

```text
src/
├── MyApp.Domain/           # Entities, value objects, domain events
├── MyApp.Application/      # Use cases, DTOs, interfaces
├── MyApp.Infrastructure/   # EF Core, external services
└── MyApp.Api/              # ASP.NET controllers, middleware
```

### CQRS with MediatR in .NET

```csharp
// Command (write side)
public record PlaceOrderCommand(string CustomerId) : IRequest<Guid>;

// Query (read side)
public record GetOrderQuery(Guid OrderId) : IRequest<OrderDto>;

// Separate handlers — can use different data stores
public class PlaceOrderHandler : IRequestHandler<PlaceOrderCommand, Guid> { /* ... */ }
public class GetOrderHandler : IRequestHandler<GetOrderQuery, OrderDto> { /* ... */ }
```

## Frontend Patterns and Principles

### HTML Semantic Structure

Write semantic HTML to improve accessibility, SEO, and maintainability.

| Element | Purpose |
|---------|---------|
| `<header>` | Introductory content or navigation links. |
| `<nav>` | Section containing navigation links. |
| `<main>` | Dominant content of the document body. |
| `<article>` | Self-contained composition — blog post, comment, widget. |
| `<section>` | Thematic grouping of content. |
| `<aside>` | Tangentially related content — sidebars, callouts. |
| `<footer>` | Footer for the nearest sectioning content or root. |

### CSS Architecture Methodologies

| Methodology | Key Concept |
|-------------|-------------|
| **BEM** (Block, Element, Modifier) | `.block__element--modifier` naming convention for predictable, modular CSS. |
| **ITCSS** (Inverted Triangle CSS) | Layer-based organization from generic to specific: settings, tools, generic, elements, objects, components, utilities. |
| **Utility-First** (Tailwind CSS) | Compose UIs from small, single-purpose utility classes. |
| **CSS Modules** | Locally scoped CSS class names generated at build time. |
| **CSS-in-JS** | Co-locate styles with components using JavaScript (styled-components, Emotion). |

### BEM Example

```html
<div class="card card--featured">
  <h2 class="card__title">Title</h2>
  <p class="card__body">Content here</p>
  <button class="card__action card__action--primary">Click</button>
</div>
```

```css
.card { border: 1px solid #ddd; padding: 1rem; }
.card--featured { border-color: var(--color-primary); }
.card__title { font-size: 1.25rem; margin: 0 0 0.5rem; }
.card__action--primary { background: var(--color-primary); color: #fff; }
```

### TypeScript/JavaScript Frontend Principles

| Principle | Guidance |
|-----------|----------|
| **Component-based architecture** | Build UIs from small, reusable, self-contained components. |
| **Unidirectional data flow** | Data flows down through props; events flow up through callbacks. |
| **Immutable state updates** | Never mutate state directly; create new state objects. |
| **Type safety** | Use TypeScript interfaces and strict mode to catch errors at compile time. |
| **Separation of concerns** | Keep presentation, logic, and data-fetching in separate layers. |

### TypeScript Strict Mode Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Testing Principles

| Principle | Description |
|-----------|-------------|
| **Arrange-Act-Assert (AAA)** | Structure every test into setup, execution, and verification phases. |
| **One assertion per test** | Each test verifies a single behavior to make failures easy to diagnose. |
| **Test behavior, not implementation** | Assert on outcomes, not on how the code achieves them. |
| **Test pyramid** | Many unit tests, fewer integration tests, fewest end-to-end tests. |
| **Deterministic tests** | Tests produce the same result every run — no flaky dependencies. |
| **Fast feedback** | Unit tests should run in milliseconds, not seconds. |

### Test Naming Convention

```csharp
// C# — MethodName_Scenario_ExpectedResult
[Fact]
public void CalculateTotal_WithTwoItems_ReturnsSumOfLineTotals() { /* ... */ }
```

```typescript
// TypeScript — describe/it pattern
describe("calculateTotal", () => {
  it("returns the sum of line totals when given two items", () => { /* ... */ });
});
```

### C# Test Example with xUnit

```csharp
public class OrderTests
{
    [Fact]
    public void AddLine_WithPositiveQuantity_AddsLineToOrder()
    {
        // Arrange
        var order = new Order();
        var productId = new ProductId(Guid.NewGuid());
        var price = new Money(10m, "USD");

        // Act
        order.AddLine(productId, quantity: 2, price);

        // Assert
        Assert.Single(order.Lines);
        Assert.Equal(2, order.Lines.First().Quantity);
    }
}
```

### TypeScript Test Example with Vitest

```typescript
import { describe, it, expect } from "vitest";

describe("OrderService", () => {
  it("calculates total for multiple line items", () => {
    const order = createOrder([
      { productId: "A", quantity: 2, unitPrice: 10 },
      { productId: "B", quantity: 1, unitPrice: 25 },
    ]);

    expect(order.calculateTotal()).toBe(45);
  });
});
```

## Error Handling Patterns

### C# Error Handling

| Pattern | When to Use |
|---------|-------------|
| **Result pattern** | Return success/failure from domain operations instead of throwing exceptions. |
| **Exception middleware** | Catch unhandled exceptions at the ASP.NET pipeline level. |
| **Domain exceptions** | Throw specific exception types for domain rule violations. |
| **Validation with FluentValidation** | Validate DTOs and commands before they reach the domain. |

**Result pattern example:**

```csharp
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(T value) { IsSuccess = true; Value = value; }
    private Result(string error) { IsSuccess = false; Error = error; }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error) => new(error);
}
```

### TypeScript Error Handling

| Pattern | When to Use |
|---------|-------------|
| **Discriminated unions** | Type-safe success/failure returns. |
| **Custom error classes** | Typed, catchable errors with additional context. |
| **Error boundaries** | Catch rendering errors in component trees (React). |
| **Zod/Yup validation** | Schema-based validation at application boundaries. |

**Discriminated union example:**

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function parseAge(input: string): Result<number, string> {
  const age = parseInt(input, 10);
  if (isNaN(age)) return { success: false, error: "Not a number" };
  if (age < 0) return { success: false, error: "Age cannot be negative" };
  return { success: true, data: age };
}
```

## Concurrency and Async Patterns

### C# Async Patterns

| Pattern | Description |
|---------|-------------|
| **async/await** | Non-blocking asynchronous operations using `Task<T>`. |
| **Channel** | Producer-consumer queues for async pipelines. |
| **SemaphoreSlim** | Limit concurrent access to a resource. |
| **Polly** | Resilience library for retry, circuit-breaker, and timeout policies. |

### TypeScript Async Patterns

| Pattern | Description |
|---------|-------------|
| **Promises and async/await** | Standard non-blocking asynchronous execution. |
| **AbortController** | Cancel in-flight operations like fetch requests. |
| **Debounce/Throttle** | Limit the rate of function execution for user input handling. |
| **Promise.allSettled** | Wait for all promises to resolve or reject without short-circuiting. |

## Security Principles

| Principle | Implementation |
|-----------|---------------|
| **Input validation** | Validate all input at system boundaries. Never trust client data. |
| **Output encoding** | Encode output to prevent XSS. Use framework-provided encoding. |
| **Parameterized queries** | Use parameterized queries or ORMs to prevent SQL injection. |
| **Least privilege** | Grant minimum permissions required for each operation. |
| **Defense in depth** | Layer multiple security controls — do not rely on a single mechanism. |
| **Secure defaults** | Default to the most restrictive configuration and explicitly open as needed. |
| **Authentication and authorization** | Use established protocols (OAuth 2.0, OpenID Connect). Never roll custom crypto. |
| **Secrets management** | Store secrets in vaults or environment variables, never in source code. |

## Code Quality Metrics

| Metric | Target |
|--------|--------|
| **Cyclomatic complexity** | Below 10 per method. Refactor when above 15. |
| **Class size** | Under 200 lines. Extract when approaching 300. |
| **Method size** | Under 20 lines. Extract helper methods for longer logic. |
| **Test coverage** | Aim for 80% line coverage on business logic. 100% on domain models. |
| **Dependency count** | A class should have fewer than 5 constructor dependencies. |
| **Coupling** | Minimize afferent and efferent coupling between modules. |
