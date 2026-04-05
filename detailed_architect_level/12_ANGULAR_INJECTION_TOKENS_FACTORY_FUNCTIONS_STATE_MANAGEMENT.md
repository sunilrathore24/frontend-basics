# 12 — Angular InjectionToken, Factory Functions & State Management: Architect-Level Deep Dive

> From basic DI tokens to advanced factory patterns, abstract class strategies,
> and modern signal-based state management in enterprise Angular applications.

---

🔑 **Simple Explanation:**
Imagine you're building a large office building. The plumbing system (Dependency Injection) needs to deliver different things to different floors — hot water, cold water, gas, electricity. An `InjectionToken` is like a labeled pipe fitting — it tells the system exactly WHAT should flow through that pipe. A factory function is the machine that creates what flows through the pipe. And state management is how you coordinate all the water pressure, temperature, and flow across the entire building. This document teaches you how to design these systems at an architect level.

---

## Table of Contents

1.  [InjectionToken Fundamentals](#1-injectiontoken-fundamentals)
    - 1.1 What Is an InjectionToken and Why It Exists
    - 1.2 InjectionToken vs String Tokens vs Class Tokens
    - 1.3 InjectionToken with Factory Functions (Tree-Shakable)
    - 1.4 Type Safety Challenges and Solutions
2.  [Provider Strategies Deep Dive](#2-provider-strategies-deep-dive)
    - 2.1 useClass — Swapping Implementations
    - 2.2 useValue — Static Configuration
    - 2.3 useFactory — Runtime Construction
    - 2.4 useExisting — Aliasing Providers
    - 2.5 Multi Providers — Extensible Token Arrays
    - 2.6 Comparison Matrix: When to Use What
3.  [inject() Function vs Constructor Injection](#3-inject-function-vs-constructor-injection)
    - 3.1 Constructor Injection — The Classic Approach
    - 3.2 inject() Function — The Modern Approach
    - 3.3 When to Use Which
    - 3.4 Testing Implications
4.  [Abstract Classes vs InjectionToken for Dependency Inversion](#4-abstract-classes-vs-injectiontoken-for-dependency-inversion)
    - 4.1 Abstract Class as DI Token
    - 4.2 InjectionToken as DI Token
    - 4.3 Comparison and Decision Guide
5.  [InjectionToken as a Service — Functional Patterns](#5-injectiontoken-as-a-service--functional-patterns)
    - 5.1 Factory Function + InjectionToken Pattern
    - 5.2 Atomic Tokens — Single-Purpose Functions
    - 5.3 Lifecycle Management with DestroyRef
    - 5.4 createInjectionToken Utility (ngxtension)
6.  [Advanced Provider Patterns for Libraries](#6-advanced-provider-patterns-for-libraries)
    - 6.1 The `provide*` Function Pattern
    - 6.2 The `with*` Feature Composition Pattern
    - 6.3 Lightweight Injection Tokens for Tree-Shaking
7.  [State Management Best Practices](#7-state-management-best-practices)
    - 7.1 Angular Signals — The New Primitive
    - 7.2 Services + Signals — The Lightweight Store
    - 7.3 NgRx SignalState — Structured Lightweight State
    - 7.4 NgRx SignalStore — Enterprise-Grade State
    - 7.5 State Management Decision Matrix
    - 7.6 DI-Scoped State Management
8.  [Enterprise Architecture Patterns](#8-enterprise-architecture-patterns)
    - 8.1 Three-Layer Service Architecture with DI
    - 8.2 Feature Module Isolation with Route Providers
    - 8.3 Environment-Specific Configuration
    - 8.4 Testing Strategies for DI-Heavy Code

---

## 1. InjectionToken Fundamentals

🔑 **Simple Explanation:**
In Angular's DI system, every injectable thing needs a unique key so Angular knows what to deliver where. For classes, the class itself IS the key. But what about a plain string like an API URL? Or a configuration object? Or a function? These don't have a class to use as a key. That's where `InjectionToken` comes in — it creates a unique key for non-class values.

### 1.1 What Is an InjectionToken and Why It Exists

Angular's DI system works like a dictionary (hash map): you look up a **key** and get back a **value**. For class-based services, the class reference itself serves as the key:

```typescript
// The class UserService is BOTH the key and the value
providers: [UserService]
// Which is shorthand for:
providers: [{ provide: UserService, useClass: UserService }]
```

But what if you need to inject something that isn't a class?

```typescript
// ❌ You can't do this — a string has no class reference
providers: [{ provide: ???, useValue: 'https://api.example.com' }]

// ❌ TypeScript interfaces don't exist at runtime
interface AppConfig { apiUrl: string; }
providers: [{ provide: AppConfig, useValue: config }] // AppConfig is erased at compile time!
```

`InjectionToken` solves this by creating a unique runtime object that serves as the key:

```typescript
import { InjectionToken } from '@angular/core';

// ✅ Create a unique key for a string value
export const API_URL = new InjectionToken<string>('api.url');

// ✅ Create a unique key for a configuration object
export interface AppConfig {
  apiUrl: string;
  timeout: number;
}
export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

// ✅ Create a unique key for a function
export const LOGGER = new InjectionToken<(msg: string) => void>('logger.fn');
```

> **Key Insight:** The string parameter (`'api.url'`) is purely for debugging. Angular identifies tokens by their **object reference**, not this string. Two tokens with the same description string are still different tokens.

### 1.2 InjectionToken vs String Tokens vs Class Tokens

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     TOKEN TYPE COMPARISON                                    │
├──────────────────┬──────────────────┬──────────────────┬─────────────────────┤
│ Feature          │ String Token     │ Class Token      │ InjectionToken      │
├──────────────────┼──────────────────┼──────────────────┼─────────────────────┤
│ Uniqueness       │ ❌ Collision risk│ ✅ Unique ref    │ ✅ Unique ref       │
│ Type Safety      │ ❌ No generics  │ ✅ Class type    │ ✅ Generic type     │
│ Tree-Shakable    │ ❌ No           │ ✅ providedIn    │ ✅ factory option    │
│ Non-class values │ ✅ Any value    │ ❌ Classes only  │ ✅ Any value        │
│ Debugging        │ ⚠️ String only  │ ✅ Class name    │ ✅ Description str  │
│ Refactor-safe    │ ❌ Magic string │ ✅ Import ref    │ ✅ Import ref       │
│ Runtime exists   │ ✅ Yes          │ ✅ Yes           │ ✅ Yes              │
│ Interface support│ N/A             │ ❌ Erased at RT  │ ✅ Via generic <T>  │
└──────────────────┴──────────────────┴──────────────────┴─────────────────────┘
```

```typescript
// ❌ BAD: String tokens — collision risk, no type safety
providers: [{ provide: 'API_URL', useValue: 'https://api.example.com' }]
// What if another library also uses 'API_URL'? Collision!
// Also: inject('API_URL') returns `any` — no type checking

// ✅ GOOD: InjectionToken — unique, type-safe, tree-shakable
export const API_URL = new InjectionToken<string>('API_URL');
providers: [{ provide: API_URL, useValue: 'https://api.example.com' }]
// inject(API_URL) returns `string` — full type safety
```

### 1.3 InjectionToken with Factory Functions (Tree-Shakable)

When you provide a `factory` option to `InjectionToken`, it becomes **tree-shakable** and is automatically `providedIn: 'root'`:

```typescript
import { InjectionToken, inject } from '@angular/core';

// ── Tree-shakable token with factory ──────────────────────────────────
// If no component/service ever injects APP_CONFIG, the entire token
// and its factory are removed from the production bundle.
export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',  // This is the default when factory is provided
  factory: () => ({
    apiUrl: 'https://api.example.com',
    version: '2.0.0',
    features: {
      darkMode: true,
      analytics: false,
    },
  }),
});

// ── Factory that depends on other injectables ─────────────────────────
// The factory runs in an injection context, so inject() works here
export type LoggerFn = (level: string, message: string) => void;

export const LOGGER_FN = new InjectionToken<LoggerFn>('logger.fn', {
  providedIn: 'root',
  factory: () => {
    const config = inject(APP_CONFIG); // ← inject other tokens inside factory!
    return (level: string, message: string) => {
      if (config.features['logging'] !== false) {
        console[level as 'log' | 'warn' | 'error'](
          `[${new Date().toISOString()}] ${message}`
        );
      }
    };
  },
});

// ── Wrapping browser APIs as tokens (SSR-safe) ───────────────────────
export const LOCAL_STORAGE = new InjectionToken<Storage>('localStorage', {
  factory: () => window.localStorage,
});

export const SESSION_STORAGE = new InjectionToken<Storage>('sessionStorage', {
  factory: () => window.sessionStorage,
});

// ── Feature flags from URL params ─────────────────────────────────────
export const FEATURE_FLAGS = new InjectionToken<Map<string, boolean>>('feature.flags', {
  factory: () => {
    const flags = new Map<string, boolean>();
    const urlParams = new URLSearchParams(window.location.search);
    flags.set('betaFeatures', urlParams.get('beta') === 'true');
    flags.set('darkMode', true);
    return flags;
  },
});
```

> **When to use factory tokens:**
> - You need a global singleton of a non-class value
> - The value depends on other injectables (use `inject()` inside factory)
> - You want tree-shaking (unused tokens are removed from bundle)
> - You're wrapping browser APIs for testability/SSR compatibility

### 1.4 Type Safety Challenges and Solutions

One of the biggest DX issues with `InjectionToken` is that the `providers` array doesn't enforce type safety:

```typescript
const API_URL = new InjectionToken<string>('api.url');

// ❌ TypeScript does NOT catch this — useValue accepts `any`
providers: [{ provide: API_URL, useValue: 12345 }]  // Number instead of string!
providers: [{ provide: API_URL, useValue: ['a', 'b'] }]  // Array instead of string!

// The error only surfaces at runtime when you call string methods on a number
```

**Solution: Custom provide functions**

```typescript
export const API_URL = new InjectionToken<string>('api.url');

// Type-safe provider function
export function provideApiUrl(url: string) {
  return { provide: API_URL, useValue: url };
}

// Now TypeScript enforces the type:
providers: [
  provideApiUrl('https://api.example.com'),  // ✅ Works
  provideApiUrl(12345),                       // ❌ Compile error!
]
```

**Solution for factory providers:**

```typescript
export function provideApiUrl(urlOrFactory: string | (() => string)) {
  return {
    provide: API_URL,
    useFactory: typeof urlOrFactory === 'function' ? urlOrFactory : () => urlOrFactory,
  };
}

// Both work with full type safety:
provideApiUrl('https://api.example.com');
provideApiUrl(() => {
  const env = inject(ENVIRONMENT);
  return env.production ? 'https://api.prod.com' : 'https://api.dev.com';
});
```

---

## 2. Provider Strategies Deep Dive

🔑 **Simple Explanation:**
Angular gives you four ways to tell the DI system "when someone asks for X, give them Y." Think of it like a restaurant menu — `useClass` says "when they order chicken, cook chicken" (or "cook duck instead"). `useValue` says "when they order water, just hand them this bottle." `useFactory` says "when they order a cocktail, run this recipe to make it." `useExisting` says "when they order soda, give them the same Coke that table 5 got."

### 2.1 useClass — Swapping Implementations

`useClass` tells Angular to instantiate a specific class when a token is requested. This is the most common provider type and enables implementation swapping.

```typescript
// ── Basic: Class is both the token and the implementation ─────────────
providers: [DataService]
// Equivalent to:
providers: [{ provide: DataService, useClass: DataService }]

// ── Swapping implementations ──────────────────────────────────────────
// The consumer injects Logger, but gets EvenBetterLogger
@Injectable()
export class Logger {
  log(message: string) { console.log(message); }
}

@Injectable()
export class EvenBetterLogger extends Logger {
  private userService = inject(UserService);

  override log(message: string) {
    const name = this.userService.user.name;
    super.log(`[${name}] ${message}`);
  }
}

@Component({
  providers: [
    UserService,
    { provide: Logger, useClass: EvenBetterLogger },
  ],
})
export class DashboardComponent {
  private logger = inject(Logger); // Gets EvenBetterLogger instance
}

// ── Environment-based swapping ────────────────────────────────────────
providers: [
  {
    provide: StorageService,
    useClass: environment.production ? CloudStorageService : LocalStorageService,
  },
]
```

**Use cases for `useClass`:**
- Swapping a real service with a mock for testing
- Providing environment-specific implementations
- Extending a base service with enhanced functionality
- Implementing the Strategy pattern via DI

### 2.2 useValue — Static Configuration

`useValue` provides a pre-existing value (object, string, number, function, etc.) directly:

```typescript
// ── Application configuration ─────────────────────────────────────────
export interface AppConfig {
  apiUrl: string;
  appTitle: string;
  features: Record<string, boolean>;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');

const appConfig: AppConfig = {
  apiUrl: 'https://api.example.com',
  appTitle: 'My Enterprise App',
  features: { darkMode: true, analytics: false },
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: APP_CONFIG, useValue: appConfig },
  ],
});

// ── Simple values ─────────────────────────────────────────────────────
export const MAX_RETRIES = new InjectionToken<number>('max.retries');
export const API_BASE_URL = new InjectionToken<string>('api.base.url');

providers: [
  { provide: MAX_RETRIES, useValue: 3 },
  { provide: API_BASE_URL, useValue: 'https://api.example.com' },
]
```

**Use cases for `useValue`:**
- Configuration objects (API URLs, feature flags, timeouts)
- Constants and enums
- Pre-built objects that don't need DI themselves
- Mock data for testing

### 2.3 useFactory — Runtime Construction

`useFactory` provides a function that Angular calls to create the value. The factory can depend on other injectables.

```typescript
// ── Modern approach: inject() inside factory ──────────────────────────
// Since Angular 14+, you can use inject() directly in the factory
providers: [
  {
    provide: ApiClient,
    useFactory: () => {
      const http = inject(HttpClient);
      const config = inject(APP_CONFIG);
      const userService = inject(UserService);

      return new ApiClient(
        http,
        config.apiUrl,
        userService.getRateLimit(),
      );
    },
  },
]

// ── Legacy approach: deps array ───────────────────────────────────────
// Before inject() was available, you had to declare dependencies explicitly
providers: [
  {
    provide: ApiClient,
    useFactory: (http: HttpClient, config: AppConfig) => {
      return new ApiClient(http, config.apiUrl, 1000);
    },
    deps: [HttpClient, APP_CONFIG],  // Order must match factory params!
  },
]

// ── Conditional creation ──────────────────────────────────────────────
providers: [
  {
    provide: CacheService,
    useFactory: () => {
      const platform = inject(PLATFORM_ID);
      if (isPlatformBrowser(platform)) {
        return new BrowserCacheService(inject(LOCAL_STORAGE));
      }
      return new NoopCacheService(); // SSR: no caching
    },
  },
]

// ── Optional dependencies ─────────────────────────────────────────────
providers: [
  {
    provide: LoggerService,
    useFactory: () => {
      const config = inject(APP_CONFIG, { optional: true });
      return new LoggerService(config?.logLevel ?? 'warn');
    },
  },
]
```

**Use cases for `useFactory`:**
- When the value needs runtime logic to construct
- When construction depends on other injectables
- Platform-specific implementations (browser vs SSR)
- Conditional instantiation based on configuration
- When you need to call `new` with specific constructor arguments

### 2.4 useExisting — Aliasing Providers

`useExisting` creates an alias — both tokens resolve to the **same instance**:

```typescript
@Injectable({ providedIn: 'root' })
export class NewLogger {
  log(msg: string) { console.log(`[NEW] ${msg}`); }
}

providers: [
  NewLogger,
  { provide: OldLogger, useExisting: NewLogger },
  // Both OldLogger and NewLogger resolve to the SAME NewLogger instance
]

// ⚠️ CRITICAL: Don't confuse useExisting with useClass!
providers: [
  { provide: OldLogger, useClass: NewLogger },
  // This creates a SEPARATE NewLogger instance for OldLogger!
  // OldLogger and NewLogger are different instances.
]

providers: [
  { provide: OldLogger, useExisting: NewLogger },
  // This makes OldLogger an ALIAS for NewLogger.
  // Both tokens return the exact same singleton instance.
]
```

**Use cases for `useExisting`:**
- Migrating from an old service to a new one (backward compatibility)
- Providing the same service under multiple tokens
- Narrowing an interface (expose a subset of a service's API)

```typescript
// ── Interface narrowing example ───────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class FullUserService {
  getUser(id: string) { /* ... */ }
  updateUser(id: string, data: any) { /* ... */ }
  deleteUser(id: string) { /* ... */ }
}

// Read-only token that only exposes getUser
export abstract class ReadOnlyUserService {
  abstract getUser(id: string): Observable<User>;
}

providers: [
  FullUserService,
  { provide: ReadOnlyUserService, useExisting: FullUserService },
]
// Components that inject ReadOnlyUserService only see getUser()
// Components that inject FullUserService see everything
```

### 2.5 Multi Providers — Extensible Token Arrays

The `multi: true` flag allows multiple providers to contribute values to the same token. When injected, you get an **array** of all provided values:

```typescript
export const HTTP_INTERCEPTOR = new InjectionToken<HttpInterceptor[]>('http.interceptors');

providers: [
  { provide: HTTP_INTERCEPTOR, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTOR, useClass: LoggingInterceptor, multi: true },
  { provide: HTTP_INTERCEPTOR, useClass: RetryInterceptor, multi: true },
]

// inject(HTTP_INTERCEPTOR) returns [AuthInterceptor, LoggingInterceptor, RetryInterceptor]

// ── Real-world: Plugin system ─────────────────────────────────────────
export const WIDGET_REGISTRY = new InjectionToken<Widget[]>('widgets');

// Core module
providers: [
  { provide: WIDGET_REGISTRY, useClass: ClockWidget, multi: true },
  { provide: WIDGET_REGISTRY, useClass: WeatherWidget, multi: true },
]

// Feature module adds more widgets
providers: [
  { provide: WIDGET_REGISTRY, useClass: StockTickerWidget, multi: true },
]

// Dashboard component gets ALL widgets from all modules
@Component({ /* ... */ })
export class DashboardComponent {
  widgets = inject(WIDGET_REGISTRY); // [ClockWidget, WeatherWidget, StockTickerWidget]
}
```

**Use cases for `multi`:**
- Interceptor chains (HTTP, routing)
- Plugin/extension systems
- Validator collections
- Event handler registries
- APP_INITIALIZER (Angular's built-in multi token)

### 2.6 Comparison Matrix: When to Use What

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    PROVIDER STRATEGY DECISION GUIDE                              │
├──────────────┬───────────────────────────────────────────────────────────────────┤
│ Scenario     │ Strategy                                                         │
├──────────────┼───────────────────────────────────────────────────────────────────┤
│ Standard     │ useClass (shorthand: just list the class)                        │
│ service      │ providers: [MyService]                                           │
├──────────────┼───────────────────────────────────────────────────────────────────┤
│ Swap impl    │ useClass with different class                                    │
│ (mock/env)   │ { provide: RealService, useClass: MockService }                  │
├──────────────┼───────────────────────────────────────────────────────────────────┤
│ Static       │ useValue                                                         │
│ config       │ { provide: CONFIG_TOKEN, useValue: configObject }                │
├──────────────┼───────────────────────────────────────────────────────────────────┤
│ Runtime      │ useFactory                                                       │
│ logic needed │ { provide: Service, useFactory: () => { ... } }                  │
├──────────────┼───────────────────────────────────────────────────────────────────┤
│ Alias /      │ useExisting                                                      │
│ migration    │ { provide: OldService, useExisting: NewService }                 │
├──────────────┼───────────────────────────────────────────────────────────────────┤
│ Plugin /     │ multi: true                                                      │
│ extensible   │ { provide: TOKEN, useClass: Plugin, multi: true }                │
├──────────────┼───────────────────────────────────────────────────────────────────┤
│ Non-class    │ InjectionToken + useValue or factory                             │
│ global value │ new InjectionToken('x', { factory: () => value })                │
└──────────────┴───────────────────────────────────────────────────────────────────┘
```

---

## 3. inject() Function vs Constructor Injection

🔑 **Simple Explanation:**
Angular has two ways to ask for dependencies: the old way (listing them in the constructor) and the new way (calling `inject()` as a field initializer). Think of it like ordering food — the old way is telling the waiter your order when they come to your table (constructor). The new way is scanning a QR code and ordering from your phone before the waiter even arrives (inject). Both get you food, but the new way is more flexible.

### 3.1 Constructor Injection — The Classic Approach

```typescript
@Component({ /* ... */ })
export class UserComponent {
  // Dependencies are declared as constructor parameters
  constructor(
    private userService: UserService,
    private router: Router,
    @Inject(APP_CONFIG) private config: AppConfig,
    @Optional() private analytics?: AnalyticsService,
  ) {}
}
```

**Pros:**
- Explicit — all dependencies visible in one place
- Familiar to developers from other DI frameworks (Spring, .NET)
- Works with all Angular versions

**Cons:**
- Verbose with many dependencies (long constructor parameter lists)
- Requires `@Inject()` decorator for non-class tokens
- Requires `@Optional()`, `@Self()`, `@SkipSelf()` decorators for resolution modifiers
- Inheritance is painful — must call `super()` with all parent dependencies
- Cannot be used outside of classes (no functional guards/interceptors)

### 3.2 inject() Function — The Modern Approach (Angular 14+)

```typescript
@Component({ /* ... */ })
export class UserComponent {
  // Dependencies declared as class fields using inject()
  private userService = inject(UserService);
  private router = inject(Router);
  private config = inject(APP_CONFIG);  // No @Inject decorator needed!
  private analytics = inject(AnalyticsService, { optional: true });

  // Constructor is free for actual initialization logic
  constructor() {
    // Can use injected values here — they're already available
    console.log('Config:', this.config.apiUrl);
  }
}
```

**Pros:**
- Cleaner syntax, especially with many dependencies
- No decorators needed (`@Inject`, `@Optional`, `@Self`, `@SkipSelf` replaced by options object)
- Type inference works automatically (no need for explicit types)
- Works in functional contexts (guards, interceptors, resolvers)
- Simplifies inheritance — no `super()` dependency forwarding
- Enables composable utility functions (Custom Inject Functions)

**Cons:**
- Only works in "injection context" (constructor, field initializer, factory)
- Cannot be called in arbitrary methods or lifecycle hooks (without an Injector)
- Relatively new — some teams may not be familiar with it

### 3.3 When to Use Which

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  inject() vs CONSTRUCTOR — DECISION GUIDE                    │
├──────────────────────────────────┬───────────────────────────────────────────┤
│ Use inject() when...             │ Use constructor when...                   │
├──────────────────────────────────┼───────────────────────────────────────────┤
│ Starting a new project           │ Maintaining legacy codebase               │
│ Using functional APIs            │ Team prefers explicit constructor DI      │
│ Building composable utilities    │ Need constructor logic with DI params     │
│ Class has inheritance            │ Framework requires constructor (rare)     │
│ Many dependencies (5+)          │ Few dependencies (1-2)                    │
│ Using InjectionTokens often      │ Only injecting class-based services       │
└──────────────────────────────────┴───────────────────────────────────────────┘
```

**The inheritance advantage of inject():**

```typescript
// ❌ Constructor injection with inheritance — painful
@Component({ /* ... */ })
export class BaseComponent {
  constructor(protected router: Router, protected auth: AuthService) {}
}

@Component({ /* ... */ })
export class UserComponent extends BaseComponent {
  constructor(
    router: Router,
    auth: AuthService,
    private userService: UserService,  // Own dependency
  ) {
    super(router, auth);  // Must forward ALL parent dependencies
  }
}

// ✅ inject() with inheritance — clean
@Component({ /* ... */ })
export class BaseComponent {
  protected router = inject(Router);
  protected auth = inject(AuthService);
}

@Component({ /* ... */ })
export class UserComponent extends BaseComponent {
  private userService = inject(UserService);
  // No super() needed — parent dependencies are handled automatically
}
```

### 3.4 Testing Implications

```typescript
// ── Testing with inject() ─────────────────────────────────────────────
// You MUST use TestBed because inject() needs an injection context

describe('UserComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: APP_CONFIG, useValue: mockConfig },
      ],
    });
  });

  it('should load users', () => {
    const component = TestBed.createComponent(UserComponent).componentInstance;
    // inject() resolves from TestBed's injector
  });
});

// ── Testing factory functions directly (no TestBed needed!) ───────────
// This is a major advantage of the InjectionToken-as-service pattern
function githubUserServiceFactory(http: HttpClient) {
  return {
    searchUser: (query = '') =>
      http.get<GithubUser[]>(`/api/users?q=${query}`),
  };
}

describe('githubUserServiceFactory', () => {
  it('should search users', () => {
    const mockHttp = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    mockHttp.get.and.returnValue(of([{ login: 'test' }]));

    const service = githubUserServiceFactory(mockHttp);
    // No TestBed, no injection context — just a plain function call!

    service.searchUser('test').subscribe(users => {
      expect(users.length).toBe(1);
    });
    expect(mockHttp.get).toHaveBeenCalledWith('/api/users?q=test');
  });
});
```

---

## 4. Abstract Classes vs InjectionToken for Dependency Inversion

🔑 **Simple Explanation:**
When you want to program against an abstraction (so you can swap implementations), you have two choices in Angular: use an abstract class as your DI token, or use an InjectionToken. Think of it like a power outlet — the abstract class approach is like having a specific outlet shape (European vs American), while InjectionToken is like having a universal adapter. Both work, but they have different trade-offs.

### 4.1 Abstract Class as DI Token

Abstract classes exist at runtime (unlike interfaces), so they CAN serve as DI tokens:

```typescript
// ── Define the abstraction ────────────────────────────────────────────
@Injectable()
export abstract class DataService {
  abstract getData(): Observable<Data[]>;
  abstract getById(id: string): Observable<Data>;
  abstract save(data: Data): Observable<Data>;
}

// ── Concrete implementation ───────────────────────────────────────────
@Injectable()
export class HttpDataService extends DataService {
  private http = inject(HttpClient);

  getData(): Observable<Data[]> {
    return this.http.get<Data[]>('/api/data');
  }

  getById(id: string): Observable<Data> {
    return this.http.get<Data>(`/api/data/${id}`);
  }

  save(data: Data): Observable<Data> {
    return this.http.post<Data>('/api/data', data);
  }
}

// ── Mock implementation for testing ───────────────────────────────────
@Injectable()
export class MockDataService extends DataService {
  private data: Data[] = [/* mock data */];

  getData(): Observable<Data[]> {
    return of(this.data);
  }

  getById(id: string): Observable<Data> {
    return of(this.data.find(d => d.id === id)!);
  }

  save(data: Data): Observable<Data> {
    this.data.push(data);
    return of(data);
  }
}

// ── Provide the concrete implementation ───────────────────────────────
providers: [
  { provide: DataService, useClass: HttpDataService },
]

// ── Consumer doesn't know which implementation it gets ────────────────
@Component({ /* ... */ })
export class DataListComponent {
  private dataService = inject(DataService); // Could be Http or Mock!
  data$ = this.dataService.getData();
}
```

**Pros of abstract class as token:**
- Familiar OOP pattern
- IDE autocomplete works naturally
- Can include default method implementations
- Can use `providedIn: 'root'` on the abstract class itself (Angular 9.1+)

**Cons:**
- Creates a class hierarchy (tight coupling to base class)
- Cannot represent non-class values (functions, primitives, config objects)
- Adds to bundle size even if tree-shaken (class definition remains)
- Single inheritance limitation in TypeScript

### 4.2 InjectionToken as DI Token

```typescript
// ── Define the contract as an interface ────────────────────────────────
export interface DataService {
  getData(): Observable<Data[]>;
  getById(id: string): Observable<Data>;
  save(data: Data): Observable<Data>;
}

// ── Create the token ──────────────────────────────────────────────────
export const DATA_SERVICE = new InjectionToken<DataService>('DataService');

// ── Concrete implementation (no extends needed) ───────────────────────
@Injectable()
export class HttpDataService implements DataService {
  private http = inject(HttpClient);

  getData(): Observable<Data[]> {
    return this.http.get<Data[]>('/api/data');
  }

  getById(id: string): Observable<Data> {
    return this.http.get<Data>(`/api/data/${id}`);
  }

  save(data: Data): Observable<Data> {
    return this.http.post<Data>('/api/data', data);
  }
}

// ── Provide ───────────────────────────────────────────────────────────
providers: [
  { provide: DATA_SERVICE, useClass: HttpDataService },
]

// ── Consumer ──────────────────────────────────────────────────────────
@Component({ /* ... */ })
export class DataListComponent {
  private dataService = inject(DATA_SERVICE);
  data$ = this.dataService.getData();
}
```

**Pros of InjectionToken:**
- No class hierarchy — implementations are independent
- Can represent ANY type (functions, primitives, objects, classes)
- Better tree-shaking (no base class in bundle)
- Multiple interfaces can be implemented (no single-inheritance limit)
- Aligns with composition over inheritance

**Cons:**
- Slightly more boilerplate (token + interface + implementation)
- Less familiar to OOP-heavy developers
- IDE may not auto-import the token as naturally

### 4.3 Comparison and Decision Guide

```
┌──────────────────────────────────────────────────────────────────────────────┐
│          ABSTRACT CLASS vs INJECTIONTOKEN — DECISION GUIDE                   │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ Use Abstract Class when...   │ Use InjectionToken when...                    │
├──────────────────────────────┼───────────────────────────────────────────────┤
│ Implementations share common │ Implementations are independent              │
│ base logic (template method) │ (no shared code)                             │
│                              │                                               │
│ You want default method      │ You need to inject non-class values          │
│ implementations              │ (functions, config, primitives)              │
│                              │                                               │
│ Team is OOP-oriented         │ Team prefers composition over inheritance    │
│                              │                                               │
│ Few implementations (2-3)    │ Many implementations or plugin system        │
│                              │                                               │
│ Internal application code    │ Library code (better tree-shaking)           │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

> **Architect's Recommendation:** For new Angular projects (v14+), prefer `InjectionToken` + interfaces. It's more flexible, tree-shakable, and aligns with Angular's direction toward functional patterns. Use abstract classes only when you genuinely need shared base implementation logic.

---

## 5. InjectionToken as a Service — Functional Patterns

🔑 **Simple Explanation:**
Traditionally, Angular services are always classes. But since Angular 14 introduced functional guards, interceptors, and resolvers, the framework has been moving toward functional patterns. This section explores using `InjectionToken` with factory functions as a complete replacement for class-based services — a pattern gaining traction in the Angular community, especially for library authors.

### 5.1 Factory Function + InjectionToken Pattern

Instead of a class-based service, you write a plain factory function and expose it through an InjectionToken:

```typescript
// ── github-user.factory.ts ────────────────────────────────────────────
// The implementation is a plain function — easy to test, easy to reason about
export function githubUserServiceFactory(http: HttpClient) {
  return {
    searchUser: (query = '') =>
      http.get<GithubUser[]>(`https://api.github.com/search/users?q=${query}`),
    getUser: (username: string) =>
      http.get<GithubUser>(`https://api.github.com/users/${username}`),
  };
}

// Derive the type from the factory's return value
export type GithubUserServiceApi = ReturnType<typeof githubUserServiceFactory>;

// ── github-user.token.ts ──────────────────────────────────────────────
// The token is the public API — consumers import this, not the factory
export const GITHUB_USER_SERVICE = new InjectionToken<GithubUserServiceApi>(
  'GithubUserService',
  {
    factory: () => githubUserServiceFactory(inject(HttpClient)),
  },
);

// ── Usage in component ────────────────────────────────────────────────
@Component({ /* ... */ })
export class UserSearchComponent {
  private userService = inject(GITHUB_USER_SERVICE);

  search(query: string) {
    this.userService.searchUser(query).subscribe(users => {
      // handle users
    });
  }
}
```

**Why this pattern matters:**
- **Separation of concerns:** The factory is pure logic, the token is DI wiring
- **Testability:** Test the factory directly with `new` — no TestBed needed
- **Encapsulation:** In a monorepo, expose the token as public API, keep the factory private
- **Type inference:** `ReturnType<typeof factory>` automatically derives the API type

### 5.2 Atomic Tokens — Single-Purpose Functions

Instead of a service object with multiple methods, you can create tokens that provide a single function:

```typescript
// ── Instead of a service with multiple methods... ─────────────────────
// Traditional: inject a service, call service.searchUser()
// Atomic: inject the search function directly

export function githubUserSearchFactory(http: HttpClient) {
  return (query = '') =>
    http.get<GithubUser[]>(`https://api.github.com/search/users?q=${query}`);
}

export type SearchGithubUserFn = ReturnType<typeof githubUserSearchFactory>;

export const SEARCH_GITHUB_USER = new InjectionToken<SearchGithubUserFn>(
  'searchGithubUser',
  {
    factory: () => githubUserSearchFactory(inject(HttpClient)),
  },
);

// ── Usage — feels like calling a function, not a service method ───────
@Component({ /* ... */ })
export class UserSearchComponent {
  private searchGithubUser = inject(SEARCH_GITHUB_USER);

  users$ = this.query$.pipe(
    switchMap(query => this.searchGithubUser(query)),
  );
}
```

**When to use atomic tokens:**
- The "service" only has one responsibility
- You want maximum composability (mix and match individual functions)
- Building a library where consumers may only need specific capabilities

### 5.3 Lifecycle Management with DestroyRef

Class-based services can implement `ngOnDestroy`. For token-based services, use `DestroyRef`:

```typescript
export function githubUserStoreFactory(
  http: HttpClient,
  destroyRef: DestroyRef,
) {
  const query$ = new BehaviorSubject('');

  // Clean up when the injector is destroyed
  destroyRef.onDestroy(() => {
    query$.complete();
  });

  return {
    setQuery: (query: string) => query$.next(query),
    users$: query$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => http.get<GithubUser[]>(`/api/users?q=${q}`)),
      shareReplay(1),
    ),
  };
}

export type GithubUserStoreApi = ReturnType<typeof githubUserStoreFactory>;

// ── Non-root token (component-scoped) ─────────────────────────────────
export const GITHUB_USER_STORE = new InjectionToken<GithubUserStoreApi>(
  'GithubUserStore',
);

export function provideGithubUserStore() {
  return {
    provide: GITHUB_USER_STORE,
    useFactory: githubUserStoreFactory,
    deps: [HttpClient, DestroyRef],
  };
}

// ── Usage: each component gets its own store instance ─────────────────
@Component({
  providers: [provideGithubUserStore()],
  template: `
    <input (input)="store.setQuery($event.target.value)" />
    <ul>
      <li *ngFor="let user of store.users$ | async">{{ user.login }}</li>
    </ul>
  `,
})
export class UserSearchComponent {
  store = inject(GITHUB_USER_STORE);
}
```

### 5.4 createInjectionToken Utility (ngxtension)

The `ngxtension` library provides a `createInjectionToken` utility that eliminates the boilerplate:

```typescript
import { createInjectionToken } from 'ngxtension/create-injection-token';

// ── Root token (singleton) ────────────────────────────────────────────
export const [injectGithubUserService, provideGithubUserService, GITHUB_USER_SERVICE] =
  createInjectionToken(() => {
    const http = inject(HttpClient);
    return {
      searchUser: (query = '') =>
        http.get<GithubUser[]>(`/api/users?q=${query}`),
    };
  });

// Usage:
@Component({ /* ... */ })
export class UserComponent {
  private service = injectGithubUserService(); // Type-safe, no token import needed
}

// ── Non-root token ────────────────────────────────────────────────────
export const [injectUserStore, provideUserStore] =
  createInjectionToken(
    () => {
      const http = inject(HttpClient);
      const destroyRef = inject(DestroyRef);
      // ... store logic
      return { /* store API */ };
    },
    { isRoot: false },
  );

// Must provide before injecting:
@Component({
  providers: [provideUserStore()],
})
export class UserComponent {
  store = injectUserStore();
}

// ── Multi token ───────────────────────────────────────────────────────
export const [injectLocales, provideLocale] =
  createInjectionToken(() => 'en', { multi: true });

@Component({
  providers: [
    provideLocale(),        // 'en' (from factory)
    provideLocale('es'),    // 'es' (override value)
    provideLocale(() => 'fr'), // 'fr' (factory override)
  ],
})
export class I18nComponent {
  locales = injectLocales(); // ['en', 'es', 'fr']
}
```

**Benefits of createInjectionToken:**
- Returns a tuple `[injectFn, provideFn, TOKEN]` — all you need
- `injectFn` is a Custom Inject Function (CIF) with full type safety
- `provideFn` enforces correct value types at compile time
- Supports `multi`, `isRoot`, and `deps` options
- Eliminates the boilerplate of manually creating tokens + provide functions

---

## 6. Advanced Provider Patterns for Libraries

🔑 **Simple Explanation:**
When you're building a shared library (not just an app), you need to think about how consumers will configure your services. Angular's own libraries (`provideRouter`, `provideHttpClient`) demonstrate elegant patterns for this. This section teaches you those patterns so you can build libraries that are a joy to configure.

### 6.1 The `provide*` Function Pattern

Instead of exposing raw tokens and making consumers wire up providers manually, export a function that returns the correct provider configuration:

```typescript
// ── Library code ──────────────────────────────────────────────────────
// Internal token — NOT exported
const ANALYTICS_CONFIG = new InjectionToken<AnalyticsConfig>('analytics.config');

@Injectable()
export class AnalyticsService {
  private config = inject(ANALYTICS_CONFIG);

  track(event: string, properties?: Record<string, unknown>) {
    // Implementation using config.trackingId, config.enableDebugMode, etc.
  }
}

// Public API — this is what consumers import
export function provideAnalytics(config: AnalyticsConfig): Provider[] {
  return [
    { provide: ANALYTICS_CONFIG, useValue: config },
    AnalyticsService,
  ];
}

// ── Consumer code ─────────────────────────────────────────────────────
bootstrapApplication(AppComponent, {
  providers: [
    provideAnalytics({
      trackingId: 'GA-12345',
      enableDebugMode: !environment.production,
    }),
  ],
});
```

**Why this pattern is superior:**
- Internal tokens stay private (encapsulation)
- Type safety is enforced by the function signature
- Implementation can change without breaking consumers
- Consistent with Angular's own patterns (`provideRouter`, `provideHttpClient`)

### 6.2 The `with*` Feature Composition Pattern

For complex libraries with optional features, combine `provide*` with `with*` functions:

```typescript
// ── Feature interface ─────────────────────────────────────────────────
export interface HttpFeature {
  kind: string;
  providers: Provider[];
}

// ── Core provider function ────────────────────────────────────────────
export function provideAppHttpClient(
  config?: HttpConfig,
  ...features: HttpFeature[]
): Provider[] {
  const providers: Provider[] = [
    { provide: HTTP_CONFIG, useValue: config ?? {} },
    AppHttpClientService,
  ];

  features.forEach(f => providers.push(...f.providers));
  return providers;
}

// ── Feature functions ─────────────────────────────────────────────────
export function withRetry(config: RetryConfig): HttpFeature {
  return {
    kind: 'retry',
    providers: [
      { provide: RETRY_CONFIG, useValue: config },
      RetryInterceptor,
    ],
  };
}

export function withCaching(config?: CacheConfig): HttpFeature {
  return {
    kind: 'caching',
    providers: [
      { provide: CACHE_CONFIG, useValue: config ?? { ttl: 60000 } },
      CacheInterceptor,
    ],
  };
}

export function withAuth(tokenProvider: () => string): HttpFeature {
  return {
    kind: 'auth',
    providers: [
      { provide: AUTH_TOKEN_PROVIDER, useFactory: () => tokenProvider },
      AuthInterceptor,
    ],
  };
}

// ── Consumer: compose features declaratively ──────────────────────────
bootstrapApplication(AppComponent, {
  providers: [
    provideAppHttpClient(
      { baseUrl: 'https://api.example.com', timeout: 30000 },
      withAuth(() => localStorage.getItem('token') ?? ''),
      withRetry({ maxAttempts: 3, delayMs: 1000 }),
      withCaching({ ttl: 60000 }),
    ),
  ],
});
```

This pattern is exactly how Angular's own `provideHttpClient(withInterceptors(...), withFetch())` works.

### 6.3 Lightweight Injection Tokens for Tree-Shaking

When building libraries, use lightweight tokens to ensure unused features are tree-shaken:

```typescript
// ── BAD: Heavy token that pulls in the entire implementation ──────────
// If a consumer never uses OptionalFeatureService, it's still in the bundle
// because the token's factory imports it
export const OPTIONAL_FEATURE = new InjectionToken<OptionalFeatureService>(
  'optional.feature',
  {
    factory: () => new OptionalFeatureService(inject(HttpClient)),
    // ^ This import prevents tree-shaking of OptionalFeatureService
  },
);

// ── GOOD: Lightweight token with no factory ───────────────────────────
// The token itself is tiny — the implementation is only bundled if provided
export abstract class OptionalFeature {
  abstract doSomething(): void;
}

// Only consumers who actually need it will provide it:
providers: [
  { provide: OptionalFeature, useClass: OptionalFeatureService },
]

// Components check if it's available:
@Component({ /* ... */ })
export class MyComponent {
  private feature = inject(OptionalFeature, { optional: true });

  doSomething() {
    this.feature?.doSomething(); // Only called if provided
  }
}
```

---

## 7. State Management Best Practices

🔑 **Simple Explanation:**
State management in Angular has evolved dramatically. In 2020, the answer was often "just use NgRx." In 2025, Angular Signals have changed the game. Now you have a spectrum from simple signals to full NgRx SignalStore. The key is picking the right tool for the right job — not reaching for the heaviest solution by default.

### 7.1 Angular Signals — The New Primitive

Signals (Angular 16+) are the foundation of modern Angular state management:

```typescript
import { signal, computed, effect } from '@angular/core';

@Component({
  template: `
    <p>Hello, {{ name() }}</p>
    <p>Uppercase: {{ upperName() }}</p>
    <button (click)="updateName('Angular')">Update</button>
  `,
})
export class GreetingComponent {
  // Writable signal — the basic state primitive
  name = signal('World');

  // Computed signal — derived state, automatically tracks dependencies
  upperName = computed(() => this.name().toUpperCase());

  constructor() {
    // Effect — side effect that runs when tracked signals change
    effect(() => {
      console.log('Name changed to:', this.name());
      // Automatically re-runs when this.name() changes
    });
  }

  updateName(newName: string) {
    this.name.set(newName);        // Replace the value
    // or
    this.name.update(n => n + '!'); // Transform based on current value
  }
}
```

**When to use raw signals:**
- Component-local state (form values, UI toggles, counters)
- Simple derived state (`computed`)
- Side effects tied to state changes (`effect`)
- Small to medium apps where you don't need a formal store

### 7.2 Services + Signals — The Lightweight Store

Combine signals with Angular services to create a shared state layer without any library:

```typescript
@Injectable({ providedIn: 'root' })
export class TodoStore {
  // Private writable signals
  private readonly _todos = signal<Todo[]>([]);
  private readonly _filter = signal<'all' | 'active' | 'completed'>('all');
  private readonly _loading = signal(false);

  // Public read-only signals
  readonly todos = this._todos.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed derived state
  readonly filteredTodos = computed(() => {
    const todos = this._todos();
    const filter = this._filter();
    switch (filter) {
      case 'active': return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default: return todos;
    }
  });

  readonly activeCount = computed(() =>
    this._todos().filter(t => !t.completed).length
  );

  // Actions
  addTodo(text: string) {
    this._todos.update(todos => [
      ...todos,
      { id: crypto.randomUUID(), text, completed: false },
    ]);
  }

  toggleTodo(id: string) {
    this._todos.update(todos =>
      todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }

  setFilter(filter: 'all' | 'active' | 'completed') {
    this._filter.set(filter);
  }

  async loadTodos() {
    this._loading.set(true);
    try {
      const http = inject(HttpClient);
      const todos = await firstValueFrom(http.get<Todo[]>('/api/todos'));
      this._todos.set(todos);
    } finally {
      this._loading.set(false);
    }
  }
}
```

**When to use Services + Signals:**
- Shared state across multiple components
- You want reactivity without RxJS complexity
- Small to medium apps
- Teams that want to avoid third-party state libraries
- Prototyping and MVPs

### 7.3 NgRx SignalState — Structured Lightweight State

`signalState` from `@ngrx/signals` adds structure and immutability guarantees on top of raw signals:

```typescript
import { signalState, patchState } from '@ngrx/signals';

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class TodoStore {
  // signalState creates a deeply reactive signal object
  readonly state = signalState<TodoState>({
    todos: [],
    filter: 'all',
    loading: false,
  });

  // Access individual properties as signals
  // this.state.todos() — returns Todo[]
  // this.state.filter() — returns string
  // this.state.loading() — returns boolean

  addTodo(text: string) {
    patchState(this.state, (s) => ({
      todos: [...s.todos, { id: crypto.randomUUID(), text, completed: false }],
    }));
  }

  toggleTodo(id: string) {
    patchState(this.state, (s) => ({
      todos: s.todos.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
  }

  setFilter(filter: 'all' | 'active' | 'completed') {
    patchState(this.state, { filter });
  }
}
```

**Key differences from raw signals:**
- `signalState` only accepts objects (not arrays or primitives)
- `patchState` enforces immutable updates
- Individual properties are automatically exposed as signals
- Full TypeScript type checking on state shape

**When to use SignalState:**
- Component-level or service-level state that needs structure
- When you want immutability guarantees without full NgRx
- Medium complexity state with multiple related properties
- Teams transitioning from raw signals to more structured patterns

### 7.4 NgRx SignalStore — Enterprise-Grade State

`signalStore` is the full-featured solution for complex, scalable state management:

```typescript
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  loading: boolean;
  error: string | null;
}

export const TodoStore = signalStore(
  // ── State ───────────────────────────────────────────────────────────
  withState<TodoState>({
    todos: [],
    filter: 'all',
    loading: false,
    error: null,
  }),

  // ── Computed (derived state) ────────────────────────────────────────
  withComputed((state) => ({
    filteredTodos: computed(() => {
      const todos = state.todos();
      const filter = state.filter();
      switch (filter) {
        case 'active': return todos.filter(t => !t.completed);
        case 'completed': return todos.filter(t => t.completed);
        default: return todos;
      }
    }),
    activeCount: computed(() =>
      state.todos().filter(t => !t.completed).length
    ),
    completedCount: computed(() =>
      state.todos().filter(t => t.completed).length
    ),
  })),

  // ── Methods (actions) ───────────────────────────────────────────────
  withMethods((store) => {
    const http = inject(HttpClient);

    return {
      addTodo(text: string) {
        patchState(store, (s) => ({
          todos: [...s.todos, { id: crypto.randomUUID(), text, completed: false }],
        }));
      },

      toggleTodo(id: string) {
        patchState(store, (s) => ({
          todos: s.todos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
      },

      setFilter(filter: 'all' | 'active' | 'completed') {
        patchState(store, { filter });
      },

      // rxMethod bridges RxJS and Signals for async operations
      loadTodos: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            http.get<Todo[]>('/api/todos').pipe(
              tapResponse({
                next: (todos) => patchState(store, { todos, loading: false }),
                error: (err: Error) =>
                  patchState(store, { error: err.message, loading: false }),
              }),
            ),
          ),
        ),
      ),
    };
  }),

  // ── Lifecycle hooks ─────────────────────────────────────────────────
  withHooks({
    onInit(store) {
      store.loadTodos(); // Auto-load on initialization
    },
    onDestroy() {
      console.log('TodoStore destroyed');
    },
  }),
);

// ── Usage in component ────────────────────────────────────────────────
@Component({
  providers: [TodoStore], // Component-scoped, or provide at route/root level
  template: `
    @if (store.loading()) {
      <spinner />
    }
    @for (todo of store.filteredTodos(); track todo.id) {
      <todo-item [todo]="todo" (toggle)="store.toggleTodo(todo.id)" />
    }
    <p>{{ store.activeCount() }} items left</p>
  `,
})
export class TodoPageComponent {
  readonly store = inject(TodoStore);
}
```

**When to use SignalStore:**
- Large enterprise applications with complex state
- Teams that want structured, opinionated state management
- When you need computed state, methods, and lifecycle hooks in one place
- Applications with significant async operations (API calls, WebSockets)
- When you want the benefits of Redux patterns without the boilerplate

### 7.5 State Management Decision Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                 ANGULAR STATE MANAGEMENT DECISION MATRIX                         │
├──────────────────┬──────────┬──────────┬──────────────┬─────────────────────────┤
│ Criteria         │ Raw      │ Service +│ NgRx         │ NgRx                    │
│                  │ Signals  │ Signals  │ SignalState   │ SignalStore              │
├──────────────────┼──────────┼──────────┼──────────────┼─────────────────────────┤
│ Complexity       │ Low      │ Low-Med  │ Medium       │ High                    │
│ Boilerplate      │ Minimal  │ Low      │ Low          │ Medium                  │
│ Scope            │ Component│ Any      │ Any          │ Any                     │
│ Derived state    │ computed │ computed │ computed     │ withComputed            │
│ Side effects     │ effect   │ Manual   │ Manual       │ rxMethod / withHooks    │
│ Immutability     │ Manual   │ Manual   │ patchState   │ patchState              │
│ DevTools         │ ❌       │ ❌       │ ❌           │ ✅ (with plugin)        │
│ Type safety      │ ✅       │ ✅       │ ✅✅         │ ✅✅✅                  │
│ Testing          │ Easy     │ Easy     │ Easy         │ Structured              │
│ Learning curve   │ Low      │ Low      │ Low          │ Medium                  │
│ Bundle size      │ 0 KB     │ 0 KB     │ ~2 KB        │ ~5 KB                   │
│ Best for         │ Local UI │ Shared   │ Structured   │ Enterprise / complex    │
│                  │ state    │ state    │ local state  │ global state            │
├──────────────────┴──────────┴──────────┴──────────────┴─────────────────────────┤
│                                                                                  │
│  DECISION FLOW:                                                                  │
│                                                                                  │
│  Is the state local to ONE component?                                            │
│    YES → Use raw signals (signal, computed, effect)                              │
│    NO  ↓                                                                         │
│                                                                                  │
│  Is the state shared but simple (< 5 properties)?                                │
│    YES → Use Service + Signals                                                   │
│    NO  ↓                                                                         │
│                                                                                  │
│  Do you need structured state with immutability guarantees?                       │
│    YES, but lightweight → NgRx SignalState                                       │
│    YES, full-featured   → NgRx SignalStore                                       │
│                                                                                  │
│  ⚠️ START SIMPLE. Upgrade only when complexity demands it.                       │
│  Most apps do NOT need NgRx. Services + Signals cover 80% of use cases.          │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 7.6 DI-Scoped State Management

One of Angular's superpowers is combining DI scoping with state management. You can provide the same store at different levels of the injector hierarchy to get different instances:

```typescript
// ── The store ─────────────────────────────────────────────────────────
@Injectable() // Note: NO providedIn — must be explicitly provided
export class PanelStore {
  private readonly _items = signal<Item[]>([]);
  private readonly _selectedId = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();
  readonly selectedItem = computed(() => {
    const id = this._selectedId();
    return id ? this._items().find(i => i.id === id) ?? null : null;
  });

  setItems(items: Item[]) { this._items.set(items); }
  select(id: string) { this._selectedId.set(id); }
}

// ── Root level: global singleton ──────────────────────────────────────
bootstrapApplication(AppComponent, {
  providers: [PanelStore], // One instance for the entire app
});

// ── Route level: per-feature instance ─────────────────────────────────
const routes: Routes = [
  {
    path: 'admin',
    providers: [PanelStore], // New instance for admin feature
    children: [/* ... */],
  },
  {
    path: 'dashboard',
    providers: [PanelStore], // Different instance for dashboard
    children: [/* ... */],
  },
];

// ── Component level: per-component instance ───────────────────────────
@Component({
  selector: 'app-panel',
  providers: [PanelStore], // Each <app-panel> gets its own store
  template: `
    @for (item of store.items(); track item.id) {
      <div
        [class.selected]="item.id === store.selectedId()"
        (click)="store.select(item.id)"
      >
        {{ item.name }}
      </div>
    }
  `,
})
export class PanelComponent {
  store = inject(PanelStore);
}
```

**This is incredibly powerful because:**
- The same store class works at any scope
- Component-level stores are automatically destroyed with the component
- Route-level stores are destroyed when navigating away (lazy-loaded)
- No global state pollution — each feature is isolated

---

## 8. Enterprise Architecture Patterns

### 8.1 Three-Layer Service Architecture with DI

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    THREE-LAYER SERVICE ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PRESENTATION LAYER (Components)                                    │    │
│  │  - Injects Facade services only                                     │    │
│  │  - No direct HTTP calls                                             │    │
│  │  - No business logic                                                │    │
│  │  - Template binding + user event handling                           │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │ inject(UserFacade)                         │
│  ┌──────────────────────────────▼──────────────────────────────────────┐    │
│  │  FACADE LAYER (State + Orchestration)                               │    │
│  │  - Manages state (signals / SignalStore)                            │    │
│  │  - Orchestrates API calls                                           │    │
│  │  - Exposes read-only state to components                            │    │
│  │  - Handles loading/error states                                     │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │ inject(UserApiService)                     │
│  ┌──────────────────────────────▼──────────────────────────────────────┐    │
│  │  DATA ACCESS LAYER (API Services)                                   │    │
│  │  - Pure HTTP calls (no state, no business logic)                    │    │
│  │  - Maps API responses to domain models                              │    │
│  │  - Handles serialization/deserialization                            │    │
│  │  - Easily mockable for testing                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

```typescript
// ── Layer 3: Data Access ──────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  getUsers(): Observable<User[]> {
    return this.http.get<UserDto[]>(`${this.config.apiUrl}/users`).pipe(
      map(dtos => dtos.map(mapUserDtoToUser)),
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<UserDto>(`${this.config.apiUrl}/users/${id}`).pipe(
      map(mapUserDtoToUser),
    );
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.patch<UserDto>(`${this.config.apiUrl}/users/${id}`, data).pipe(
      map(mapUserDtoToUser),
    );
  }
}

// ── Layer 2: Facade (State + Orchestration) ───────────────────────────
@Injectable({ providedIn: 'root' })
export class UserFacade {
  private api = inject(UserApiService);

  // State
  private readonly _users = signal<User[]>([]);
  private readonly _selectedUser = signal<User | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public read-only state
  readonly users = this._users.asReadonly();
  readonly selectedUser = this._selectedUser.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Derived state
  readonly activeUsers = computed(() =>
    this._users().filter(u => u.isActive)
  );

  // Actions
  loadUsers() {
    this._loading.set(true);
    this._error.set(null);
    this.api.getUsers().subscribe({
      next: (users) => {
        this._users.set(users);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.message);
        this._loading.set(false);
      },
    });
  }

  selectUser(id: string) {
    this._loading.set(true);
    this.api.getUserById(id).subscribe({
      next: (user) => {
        this._selectedUser.set(user);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.message);
        this._loading.set(false);
      },
    });
  }
}

// ── Layer 1: Component ────────────────────────────────────────────────
@Component({
  template: `
    @if (facade.loading()) {
      <app-spinner />
    }
    @if (facade.error(); as error) {
      <app-error-banner [message]="error" />
    }
    <app-user-list
      [users]="facade.activeUsers()"
      (selectUser)="facade.selectUser($event)"
    />
  `,
})
export class UserPageComponent implements OnInit {
  facade = inject(UserFacade);

  ngOnInit() {
    this.facade.loadUsers();
  }
}
```

### 8.2 Feature Module Isolation with Route Providers

```typescript
// ── Feature-specific configuration via route providers ────────────────
export const adminRoutes: Routes = [
  {
    path: '',
    providers: [
      // Feature-specific services
      AdminService,
      AdminGuard,

      // Feature-specific configuration
      { provide: APP_CONFIG, useValue: { ...baseConfig, adminMode: true } },

      // Feature-specific store (isolated from other features)
      AdminStore,

      // Feature-specific API client with different base URL
      {
        provide: ApiClient,
        useFactory: () => {
          const http = inject(HttpClient);
          return new ApiClient(http, 'https://admin-api.example.com');
        },
      },
    ],
    children: [
      { path: 'users', component: AdminUsersComponent },
      { path: 'settings', component: AdminSettingsComponent },
    ],
  },
];

// Lazy-loaded in main routes
export const appRoutes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
  },
];
```

### 8.3 Environment-Specific Configuration

```typescript
// ── environment.ts ────────────────────────────────────────────────────
export interface Environment {
  production: boolean;
  apiUrl: string;
  features: Record<string, boolean>;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const ENV = new InjectionToken<Environment>('environment');

// ── environment.dev.ts ────────────────────────────────────────────────
export const devEnvironment: Environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  features: { darkMode: true, betaFeatures: true },
  logLevel: 'debug',
};

// ── environment.prod.ts ───────────────────────────────────────────────
export const prodEnvironment: Environment = {
  production: true,
  apiUrl: 'https://api.example.com',
  features: { darkMode: true, betaFeatures: false },
  logLevel: 'error',
};

// ── main.ts ───────────────────────────────────────────────────────────
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: ENV, useValue: environment },

    // Environment-driven service selection
    {
      provide: LoggerService,
      useFactory: () => {
        const env = inject(ENV);
        return env.production
          ? new ProductionLogger(env.logLevel)
          : new ConsoleLogger(env.logLevel);
      },
    },

    // Environment-driven feature flags
    {
      provide: FEATURE_FLAGS,
      useFactory: () => {
        const env = inject(ENV);
        return new Map(Object.entries(env.features));
      },
    },
  ],
});
```

### 8.4 Testing Strategies for DI-Heavy Code

```typescript
// ── Strategy 1: TestBed for integration tests ─────────────────────────
describe('UserFacade (integration)', () => {
  let facade: UserFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserFacade,
        UserApiService,
        { provide: APP_CONFIG, useValue: { apiUrl: 'http://test' } },
      ],
    });

    facade = TestBed.inject(UserFacade);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should load users', () => {
    facade.loadUsers();

    const req = httpMock.expectOne('http://test/users');
    req.flush([{ id: '1', name: 'Test User', isActive: true }]);

    expect(facade.users().length).toBe(1);
    expect(facade.loading()).toBe(false);
  });
});

// ── Strategy 2: Direct factory testing (no TestBed) ───────────────────
describe('githubUserServiceFactory', () => {
  it('should search users', (done) => {
    const mockHttp = {
      get: jasmine.createSpy('get').and.returnValue(
        of([{ login: 'testuser' }])
      ),
    } as unknown as HttpClient;

    const service = githubUserServiceFactory(mockHttp);

    service.searchUser('test').subscribe(users => {
      expect(users.length).toBe(1);
      expect(users[0].login).toBe('testuser');
      expect(mockHttp.get).toHaveBeenCalledWith(
        jasmine.stringContaining('q=test')
      );
      done();
    });
  });
});

// ── Strategy 3: Override providers for component tests ────────────────
describe('UserPageComponent', () => {
  let mockFacade: Partial<UserFacade>;

  beforeEach(() => {
    mockFacade = {
      users: signal([{ id: '1', name: 'Test', isActive: true }]).asReadonly(),
      activeUsers: computed(() => [{ id: '1', name: 'Test', isActive: true }]),
      loading: signal(false).asReadonly(),
      error: signal(null).asReadonly(),
      loadUsers: jasmine.createSpy('loadUsers'),
      selectUser: jasmine.createSpy('selectUser'),
    };

    TestBed.configureTestingModule({
      imports: [UserPageComponent],
      providers: [
        { provide: UserFacade, useValue: mockFacade },
      ],
    });
  });

  it('should display active users', () => {
    const fixture = TestBed.createComponent(UserPageComponent);
    fixture.detectChanges();
    // Assert rendered output...
  });
});

// ── Strategy 4: Token override for environment testing ────────────────
describe('Feature with environment config', () => {
  it('should use production API in prod mode', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ENV,
          useValue: { production: true, apiUrl: 'https://prod.api.com' },
        },
      ],
    });

    const env = TestBed.inject(ENV);
    expect(env.apiUrl).toBe('https://prod.api.com');
  });
});
```

---

## Quick Reference: Complete Pattern Catalog

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    ANGULAR DI & STATE MANAGEMENT CHEAT SHEET                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INJECTION TOKENS                                                                │
│  ────────────────                                                                │
│  • Use InjectionToken for non-class values (config, functions, primitives)        │
│  • Add factory option for tree-shakable root-level tokens                        │
│  • Create provide* functions for type-safe provider configuration                │
│  • Use multi: true for extensible plugin/interceptor systems                     │
│                                                                                  │
│  PROVIDER STRATEGIES                                                             │
│  ────────────────────                                                            │
│  • useClass  → Swap implementations (mock, env-specific, strategy pattern)       │
│  • useValue  → Static config objects, constants, feature flags                   │
│  • useFactory → Runtime construction, conditional logic, platform checks         │
│  • useExisting → Aliases, migrations, interface narrowing                        │
│                                                                                  │
│  inject() vs CONSTRUCTOR                                                         │
│  ────────────────────────                                                        │
│  • Prefer inject() for new code — cleaner, works with inheritance                │
│  • Constructor injection for legacy code or team preference                      │
│  • inject() enables functional patterns (guards, interceptors, CIFs)             │
│                                                                                  │
│  DEPENDENCY INVERSION                                                            │
│  ────────────────────                                                            │
│  • InjectionToken + interface → flexible, tree-shakable, no class hierarchy      │
│  • Abstract class → when you need shared base implementation                     │
│                                                                                  │
│  STATE MANAGEMENT LADDER                                                         │
│  ────────────────────────                                                        │
│  signal()           → Component-local UI state                                   │
│  Service + Signals  → Shared state, small-medium apps                            │
│  NgRx SignalState   → Structured state with immutability                         │
│  NgRx SignalStore   → Enterprise-grade, full-featured state management           │
│                                                                                  │
│  SCOPING                                                                         │
│  ────────                                                                        │
│  • providedIn: 'root'  → Global singleton (most services)                        │
│  • Route providers     → Feature-scoped (lazy-loaded features)                   │
│  • Component providers → Instance per component (isolated state)                 │
│                                                                                  │
│  LIBRARY PATTERNS                                                                │
│  ────────────────                                                                │
│  • provide*() functions → Encapsulate internal tokens                            │
│  • with*() features    → Composable optional capabilities                        │
│  • Lightweight tokens  → Better tree-shaking for optional features               │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Sources & Further Reading

Content was rephrased for compliance with licensing restrictions.

- [Angular Official Docs: Defining Dependency Providers](https://v20.angular.dev/guide/di/defining-dependency-providers) — Comprehensive guide on useClass, useValue, useFactory, useExisting, and InjectionToken
- [Angular Official Docs: Optimizing Injection Tokens](https://v18.angular.dev/guide/di/lightweight-injection-tokens) — Lightweight tokens for library tree-shaking
- [Chau Tran: InjectionToken as a Service](https://nartc.me/blog/injection-token-service) — Pioneering exploration of functional service patterns with InjectionToken
- [Chau Tran: ngxtension createInjectionToken](https://nartc.me/blog/create-injection-token) — Utility for simplifying InjectionToken creation
- [Omid.dev: Advanced DI Techniques](https://omid.dev/2024/06/17/advanced-dependency-injection-techniques-in-angular-tree-shakable-providers-and-injection-tokens/) — Tree-shakable providers and injection tokens
- [Nx Blog: Angular State Management for 2025](https://nx.dev/blog/angular-state-management-2025) — Modern state management with Signals, SignalState, and SignalStore
- [dev.to: Always Use inject()](https://dev.to/this-is-angular/always-use-inject-2do4) — Arguments for the inject() function over constructor injection
- [dev.to: Stop Being Scared of InjectionTokens](https://dev.to/this-is-angular/stop-being-scared-of-injectiontokens-2406) — Demystifying InjectionToken usage
- [Medium: Abstract Classes and Injection Tokens](https://medium.com/@saranipeiris17/overview-of-abstract-classes-and-injection-tokens-68c230000961) — Comparison of abstraction strategies
- [Telerik: State Management with Angular SignalStore](https://www.telerik.com/blogs/state-management-angular-applications-using-ngrx-signals-store) — Practical guide to NgRx SignalStore
