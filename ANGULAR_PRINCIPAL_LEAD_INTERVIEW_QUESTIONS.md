# Angular Principal/Lead Frontend Engineer Interview Questions & Answers

*Based on latest Angular 19+ features and industry best practices (2024-2026)*

## Question 1: What exactly makes a pure pipe performant in Angular?

**Answer:**

To truly understand pure pipe performance, we need to dive deep into Angular's change detection mechanism and how pipes integrate with it.

### The Foundation: Understanding Angular's Change Detection

Angular's change detection is the mechanism that synchronizes the application state with the UI. Every time something happens in your application (user clicks, HTTP responses, timers), Angular runs change detection to check if any data-bound values have changed and updates the DOM accordingly.

**The Change Detection Cycle:**
1. An event occurs (click, HTTP response, setTimeout, etc.)
2. Zone.js intercepts the event and notifies Angular
3. Angular starts change detection from the root component
4. Each component checks its bindings for changes
5. If changes are detected, Angular updates the DOM
6. The cycle completes

In a typical enterprise application, change detection can run **hundreds of times per second**. This is where pipe performance becomes critical.

### Pure Pipes: The Performance Optimization

**What is a Pure Pipe?**

A pure pipe is Angular's default pipe behavior (`pure: true` by default). The term "pure" comes from functional programming, meaning the pipe's output depends solely on its inputs and has no side effects.

```typescript
// Pure pipe (default behavior)
@Pipe({ 
  name: 'formatPrice',
  pure: true  // This is the default, can be omitted
})
export class FormatPricePipe implements PipeTransform {
  transform(value: number, currency: string = 'USD'): string {
    console.log('Pure pipe transform executed');
    // Expensive formatting operation
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  }
}
```

### The Core Performance Mechanism: Reference Checking

**How Pure Pipes Achieve Performance:**

Pure pipes use a **memoization strategy** based on **reference equality checks**. Here's the detailed process:

1. **First Execution:** When a pure pipe is first used, Angular executes the `transform` method and caches the result along with the input references.

2. **Subsequent Change Detection Cycles:** On every change detection cycle, Angular performs a **shallow reference check** using strict equality (`===`) on all pipe inputs.

3. **Cache Hit:** If all input references are identical to the cached references, Angular **skips** the `transform` method execution and returns the cached result.

4. **Cache Miss:** If any input reference has changed, Angular executes `transform` and updates the cache.

**The Technical Implementation (Simplified):**

```typescript
// This is conceptually how Angular handles pure pipes internally
class PurePipeCache {
  private lastInputs: any[] = [];
  private lastResult: any;
  
  transform(pipeInstance: PipeTransform, inputs: any[]): any {
    // Check if inputs have changed using reference equality
    if (this.inputsChanged(inputs)) {
      // Execute transform only if inputs changed
      this.lastResult = pipeInstance.transform(...inputs);
      this.lastInputs = inputs;
    }
    // Return cached result if inputs haven't changed
    return this.lastResult;
  }
  
  private inputsChanged(newInputs: any[]): boolean {
    if (this.lastInputs.length !== newInputs.length) {
      return true;
    }
    
    // Strict equality check (===) for each input
    for (let i = 0; i < newInputs.length; i++) {
      if (this.lastInputs[i] !== newInputs[i]) {
        return true;
      }
    }
    return false;
  }
}
```

### Real-World Performance Impact: The Numbers

Let's examine a concrete example with measurable performance differences:

**Scenario:** E-commerce product listing page
- 100 products displayed
- Each product uses 3 pipes (currency, date, custom filter)
- User scrolls, hovers, types in search box
- Change detection runs 20 times per second

**With Pure Pipes:**
```typescript
@Component({
  template: `
    <div *ngFor="let product of products">
      <h3>{{ product.name }}</h3>
      <p>{{ product.price | currency }}</p>
      <p>{{ product.date | date:'short' }}</p>
      <p>{{ product.description | truncate:50 }}</p>
    </div>
  `
})
export class ProductListComponent {
  products = [/* 100 products */];
}
```

**Execution count per second:**
- Change detection runs: 20 times/second
- Pipes per product: 3
- Total products: 100
- **Pure pipe executions:** ~60/second (only when product data actually changes)
- **Impure pipe executions:** 6,000/second (20 × 3 × 100)

**That's a 100x difference!**

### The Reference Check Caveat: Why Immutability Matters

This is where many developers encounter confusion. Pure pipes only detect **reference changes**, not **value changes**.

**The Problem:**

```typescript
@Component({
  template: `
    <div>{{ items | customFilter }}</div>
  `
})
export class ListComponent {
  items = [1, 2, 3, 4, 5];
  
  addItem() {
    // ❌ PROBLEM: Same array reference
    this.items.push(6);
    // Pure pipe won't detect this change!
    // The array reference is still the same
  }
}
```

**Why this happens:**

```typescript
const arr1 = [1, 2, 3];
const arr2 = arr1;
arr2.push(4);

console.log(arr1 === arr2);  // true - same reference!
// Pure pipe sees: "reference hasn't changed, use cached result"
```

**The Solution: Immutable Updates**

```typescript
@Component({
  template: `
    <div>{{ items | customFilter }}</div>
  `
})
export class ListComponent {
  items = [1, 2, 3, 4, 5];
  
  addItem() {
    // ✅ CORRECT: New array reference
    this.items = [...this.items, 6];
    // Pure pipe detects: "reference changed, re-execute transform"
  }
  
  updateItem(index: number, value: number) {
    // ✅ CORRECT: Create new array with updated value
    this.items = this.items.map((item, i) => 
      i === index ? value : item
    );
  }
  
  removeItem(index: number) {
    // ✅ CORRECT: Create new array without the item
    this.items = this.items.filter((_, i) => i !== index);
  }
}
```

**For Objects:**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  template: `
    <div>{{ user | userDisplay }}</div>
  `
})
export class UserComponent {
  user: User = { id: 1, name: 'John', email: 'john@example.com' };
  
  updateName(newName: string) {
    // ❌ WRONG: Mutates existing object
    this.user.name = newName;
    
    // ✅ CORRECT: Create new object reference
    this.user = { ...this.user, name: newName };
  }
}
```

### Memory Efficiency and Caching Strategies

Pure pipes enable effective memoization patterns:

```typescript
@Pipe({ name: 'expensiveCalculation', pure: true })
export class ExpensiveCalculationPipe implements PipeTransform {
  private cache = new Map<string, any>();
  
  transform(data: any[], operation: string): any {
    // Create cache key from inputs
    const cacheKey = JSON.stringify({ data, operation });
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log('Cache hit!');
      return this.cache.get(cacheKey);
    }
    
    // Expensive operation
    console.log('Computing...');
    const result = this.performExpensiveOperation(data, operation);
    
    // Store in cache
    this.cache.set(cacheKey, result);
    
    // Limit cache size to prevent memory leaks
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    return result;
  }
  
  private performExpensiveOperation(data: any[], operation: string): any {
    // Simulate expensive computation
    return data.reduce((acc, item) => {
      // Complex calculations...
      return acc + item;
    }, 0);
  }
}
```

**Why this works with pure pipes:**
- Pure pipes only execute when inputs change by reference
- The internal cache is only consulted when the pipe actually runs
- This creates a two-level caching system:
  1. Angular's reference check (first level - extremely fast)
  2. Pipe's internal cache (second level - fast)

### When Pure Pipes Become a Problem

**Anti-pattern: Creating new references in templates**

```typescript
@Component({
  template: `
    <!-- ❌ BAD: Creates new array on EVERY change detection -->
    <div *ngFor="let item of items.slice(0, 10) | customPipe">
      {{ item }}
    </div>
    
    <!-- ❌ BAD: Creates new object on EVERY change detection -->
    <app-child [config]="{ theme: 'dark', size: 'large' } | configPipe">
    </app-child>
    
    <!-- ❌ BAD: Method call creates new array -->
    <div *ngFor="let item of getFilteredItems() | customPipe">
      {{ item }}
    </div>
  `
})
export class BadExampleComponent {
  items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  getFilteredItems() {
    // This creates a NEW array reference every time it's called
    return this.items.filter(item => item > 5);
  }
}
```

**Why this is problematic:**
- `items.slice(0, 10)` creates a new array on every change detection
- Even though it's a pure pipe, it executes every time because the input reference changes
- You lose all performance benefits

**The fix:**

```typescript
@Component({
  template: `
    <!-- ✅ GOOD: Stable reference -->
    <div *ngFor="let item of displayItems | customPipe">
      {{ item }}
    </div>
    
    <!-- ✅ GOOD: Stable object reference -->
    <app-child [config]="config | configPipe"></app-child>
  `
})
export class GoodExampleComponent {
  items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  displayItems = this.items.slice(0, 10); // Computed once
  config = { theme: 'dark', size: 'large' }; // Stable reference
  
  updateItems(newItems: number[]) {
    this.items = newItems;
    this.displayItems = newItems.slice(0, 10); // Update when needed
  }
}
```

### Comparison with Impure Pipes

**Impure Pipe:**

```typescript
@Pipe({ 
  name: 'impureFilter',
  pure: false  // Runs on EVERY change detection
})
export class ImpureFilterPipe implements PipeTransform {
  transform(items: any[], filter: string): any[] {
    console.log('Impure pipe executed');
    return items.filter(item => item.includes(filter));
  }
}
```

**When to use impure pipes:**
- When you need to detect changes inside objects/arrays
- When working with mutable data you can't refactor
- For real-time data that changes frequently
- When the performance cost is acceptable

**Example use case for impure pipe:**

```typescript
// Impure pipe for async data that mutates
@Pipe({ name: 'liveData', pure: false })
export class LiveDataPipe implements PipeTransform {
  transform(dataSource: DataSource): any[] {
    // DataSource internally updates its data
    // Pure pipe wouldn't detect these internal changes
    return dataSource.getCurrentData();
  }
}
```

### Real-World Performance Benchmarks

**Test Setup:**
- 1000 components on screen
- Each component has 5 pipes
- Change detection triggered 10 times/second
- Test duration: 60 seconds

**Results:**

| Metric | Pure Pipes | Impure Pipes |
|--------|-----------|--------------|
| Total pipe executions | ~3,000 | ~3,000,000 |
| CPU usage | 5-10% | 60-80% |
| Frame drops | 0 | 150+ |
| Memory usage | Stable | Growing |
| User experience | Smooth | Janky |

### Best Practices for Pure Pipe Performance

1. **Always use immutable data patterns**
```typescript
// Use spread operator for arrays
this.items = [...this.items, newItem];

// Use Object.assign or spread for objects
this.user = { ...this.user, name: newName };
```

2. **Avoid creating new references in templates**
```typescript
// ❌ Bad
<div>{{ items.slice(0, 10) | pipe }}</div>

// ✅ Good
<div>{{ displayItems | pipe }}</div>
```

3. **Use OnPush change detection with pure pipes**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>{{ data | purePipe }}</div>`
})
```

4. **Implement caching for expensive operations**
```typescript
@Pipe({ name: 'expensive', pure: true })
export class ExpensivePipe {
  private cache = new Map();
  // Implement caching logic
}
```

5. **Monitor pipe execution in development**
```typescript
@Pipe({ name: 'debug', pure: true })
export class DebugPipe implements PipeTransform {
  transform(value: any): any {
    if (!environment.production) {
      console.log('Pipe executed:', value);
    }
    return value;
  }
}
```

### The Bottom Line

Pure pipes are performant because they leverage **reference-based memoization** to skip unnecessary computations. By checking input references with strict equality (`===`), Angular can avoid re-executing pipe logic when data hasn't actually changed. This creates a massive performance advantage—often 50-100x faster than impure pipes—but requires you to work with immutable data patterns. The trade-off is worth it: immutability is a best practice that leads to more predictable, maintainable code while delivering exceptional performance.

---

## Question 2: What are Angular Signals and how do they compare to RxJS Observables? When would you choose one over the other?

**Answer:**

**Signals** (stable in Angular 17+, default in Angular 19+) are a reactive state management solution for synchronous reactivity with a simpler mental model than RxJS.

**Key differences:**

| Feature | Signals | RxJS Observables |
|---------|---------|------------------|
| Reactivity | Synchronous, fine-grained | Asynchronous, stream-based |
| Learning curve | Lower | Higher |
| Use case | Component state, derived values | Async operations, event streams |
| Memory | Automatic cleanup | Manual unsubscription needed |
| Change detection | Automatic with OnPush | Requires async pipe or manual |

**Signals example:**

```typescript
@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div>Count: {{ count() }}</div>
    <div>Double: {{ doubleCount() }}</div>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  // Writable signal
  count = signal(0);
  
  // Computed signal (automatically updates)
  doubleCount = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(value => value + 1);
  }
  
  // Effect (side effects when signals change)
  constructor() {
    effect(() => {
      console.log('Count changed:', this.count());
    });
  }
}
```

**RxJS example:**

```typescript
@Component({
  selector: 'app-search',
  template: `
    <input [formControl]="searchControl">
    <div *ngFor="let result of results$ | async">
      {{ result.name }}
    </div>
  `
})
export class SearchComponent implements OnDestroy {
  searchControl = new FormControl('');
  private destroy$ = new Subject<void>();
  
  results$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => this.api.search(query)),
    takeUntil(this.destroy$)
  );
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**When to use Signals:**
- Component local state
- Derived/computed values
- Simple reactive UI updates
- Form state management
- Replacing BehaviorSubject for simple cases

**When to use RxJS:**
- HTTP requests
- WebSocket streams
- Complex async workflows
- Event debouncing/throttling
- Combining multiple async sources
- Cancellation logic

**Modern approach (Angular 19+):**

```typescript
// Combine both!
@Component({
  selector: 'app-user-profile',
  standalone: true
})
export class UserProfileComponent {
  userId = signal('123');
  
  // Use toSignal to convert Observable to Signal
  user = toSignal(
    toObservable(this.userId).pipe(
      switchMap(id => this.userService.getUser(id))
    )
  );
  
  // Use toObservable to convert Signal to Observable
  userId$ = toObservable(this.userId);
}
```

---

## Question 3: Explain the difference between switchMap, mergeMap, concatMap, and exhaustMap. Provide real-world scenarios for each.

**Answer:**

These are RxJS higher-order mapping operators that handle inner Observables differently. Understanding them is critical for preventing race conditions and managing concurrent requests.

**Quick comparison:**

| Operator | Cancels previous? | Preserves order? | Runs in parallel? | Best for |
|----------|-------------------|------------------|-------------------|----------|
| switchMap | Yes | No | No | Search/type-ahead |
| mergeMap | No | No | Yes | Multiple parallel calls |
| concatMap | No | Yes | No | Sequential queue |
| exhaustMap | Yes (ignores new) | No | No | Form submit, login |

**1. switchMap - Cancels previous, switches to new**

```typescript
// Real-world: Search box
@Component({
  template: `<input [formControl]="searchControl">`
})
export class SearchComponent {
  searchControl = new FormControl('');
  
  results$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    switchMap(query => this.api.search(query))
    // If user types "ang" then "angular", 
    // the "ang" request is CANCELLED
  );
}
```

**Use when:** User input that triggers API calls, navigation, real-time filters

**2. mergeMap - Runs all in parallel**

```typescript
// Real-world: Batch operations
@Component({})
export class BatchUploadComponent {
  uploadFiles(files: File[]) {
    from(files).pipe(
      mergeMap(file => this.api.upload(file), 3) // Max 3 concurrent
    ).subscribe();
    // All uploads run in parallel
  }
}
```

**Use when:** Independent parallel operations, batch processing, multiple simultaneous requests

**3. concatMap - Sequential queue, preserves order**

```typescript
// Real-world: Sequential API calls
@Component({})
export class OrderProcessingComponent {
  processOrders(orders: Order[]) {
    from(orders).pipe(
      concatMap(order => this.api.processOrder(order))
      // Waits for each order to complete before starting next
    ).subscribe();
  }
}
```

**Use when:** Order matters, dependent operations, rate-limited APIs

**4. exhaustMap - Ignores new emissions while busy**

```typescript
// Real-world: Prevent double-submit
@Component({
  template: `<button (click)="login()">Login</button>`
})
export class LoginComponent {
  private loginClick$ = new Subject<void>();
  
  constructor() {
    this.loginClick$.pipe(
      exhaustMap(() => this.auth.login(this.credentials))
      // Ignores additional clicks while login is in progress
    ).subscribe();
  }
  
  login() {
    this.loginClick$.next();
  }
}
```

**Use when:** Prevent duplicate submissions, button spam protection, one-at-a-time operations

**Common interview trap:**

```typescript
// ❌ Race condition - last response wins, not last request
this.searchControl.valueChanges.pipe(
  mergeMap(query => this.api.search(query))
).subscribe();

// ✅ Correct - cancels outdated requests
this.searchControl.valueChanges.pipe(
  switchMap(query => this.api.search(query))
).subscribe();
```

---

## Question 4: How does Angular's hierarchical dependency injection work? Explain resolution modifiers and provide examples.

**Answer:**

Angular uses a hierarchical injector system that parallels the component tree, allowing fine-grained control over service scope and lifetime.

**Injector hierarchy:**

```
Root Injector (providedIn: 'root')
    ↓
Environment Injector (ApplicationConfig providers)
    ↓
Module Injector (NgModule providers) [legacy]
    ↓
Element Injector (Component/Directive providers)
    ↓
Child Component Element Injector
```

**Resolution process:**
1. Starts at the requesting component's injector
2. Walks up the tree to parent injectors
3. Stops at first match or throws error

**Real-world example:**

```typescript
// Root level - singleton across app
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Single instance for entire app
}

// Component level - new instance per component
@Component({
  selector: 'app-user-form',
  providers: [FormService] // New instance for this component tree
})
export class UserFormComponent {
  constructor(private formService: FormService) {}
}

// Feature level - shared within feature
@NgModule({
  providers: [FeatureDataService] // Shared within this module
})
export class FeatureModule {}
```

**Resolution modifiers:**

**1. @Optional() - Don't throw if not found**

```typescript
@Component({})
export class ChildComponent {
  constructor(
    @Optional() private logger: LoggerService
  ) {
    // logger will be null if not provided, no error
    this.logger?.log('Component created');
  }
}
```

**2. @Self() - Only look in current injector**

```typescript
@Component({
  providers: [LocalService]
})
export class ParentComponent {
  constructor(
    @Self() private local: LocalService
    // Only finds LocalService in this component's providers
    // Throws error if not found here
  ) {}
}
```

**3. @SkipSelf() - Skip current injector, start from parent**

```typescript
@Component({
  providers: [ConfigService]
})
export class ChildComponent {
  constructor(
    @SkipSelf() private parentConfig: ConfigService
    // Gets ConfigService from parent, ignores local provider
  ) {}
}
```

**4. @Host() - Stop at host component**

```typescript
@Directive({
  selector: '[appValidator]'
})
export class ValidatorDirective {
  constructor(
    @Host() private form: NgForm
    // Only looks up to the host component, not beyond
  ) {}
}
```

**Real-world pattern - Multi-level configuration:**

```typescript
// App level config
@Injectable({ providedIn: 'root' })
export class AppConfig {
  apiUrl = 'https://api.example.com';
}

// Feature level override
@Component({
  selector: 'app-admin-panel',
  providers: [
    { provide: AppConfig, useValue: { apiUrl: 'https://admin-api.example.com' } }
  ]
})
export class AdminPanelComponent {
  constructor(
    private config: AppConfig, // Gets feature-level override
    @SkipSelf() private globalConfig: AppConfig // Gets root config
  ) {
    console.log(this.config.apiUrl); // admin-api
    console.log(this.globalConfig.apiUrl); // api
  }
}
```

**Common use cases:**
- Theme providers at different levels
- Feature-specific services
- Form validation contexts
- Multi-tenant configurations
- Testing with mock providers

---

## Question 5: Explain standalone components and how they change Angular architecture. What are the migration considerations?

**Answer:**

Standalone components (introduced Angular 14, default in Angular 19) eliminate the need for NgModules, simplifying Angular's architecture significantly.

**Traditional NgModule approach:**

```typescript
// Old way - requires NgModule
@NgModule({
  declarations: [UserComponent, UserListComponent],
  imports: [CommonModule, FormsModule],
  exports: [UserComponent]
})
export class UserModule {}
```

**Standalone approach:**

```typescript
// New way - no NgModule needed
@Component({
  selector: 'app-user',
  standalone: true, // Angular 19: this is now default
  imports: [CommonModule, FormsModule, UserListComponent],
  template: `...`
})
export class UserComponent {}
```

**Key differences:**

| Aspect | NgModule | Standalone |
|--------|----------|------------|
| Boilerplate | High | Minimal |
| Dependencies | Module-level | Component-level |
| Tree-shaking | Module boundaries | Component-level |
| Mental model | Complex | Simpler |
| Lazy loading | Module-based | Component-based |

**Modern application structure:**

```typescript
// main.ts - Bootstrap without NgModule
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    // All providers here
  ]
});

// app.component.ts
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header />
    <router-outlet />
    <app-footer />
  `
})
export class AppComponent {}

// routes.ts - Component-based lazy loading
export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/user-list.component')
      .then(m => m.UserListComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  }
];
```

**Migration strategy for enterprise apps:**

**Phase 1: Incremental adoption**
```typescript
// Mix standalone with NgModules
@NgModule({
  imports: [
    CommonModule,
    StandaloneUserComponent // Import standalone into module
  ],
  declarations: [LegacyComponent]
})
export class FeatureModule {}
```

**Phase 2: Convert leaf components first**
```typescript
// Start with components that don't have children
@Component({
  selector: 'app-button',
  standalone: true,
  template: `<button><ng-content /></button>`
})
export class ButtonComponent {}
```

**Phase 3: Use Angular CLI migration**
```bash
ng generate @angular/core:standalone
```

**Phase 4: Convert routing**
```typescript
// Before
const routes: Routes = [
  {
    path: 'feature',
    loadChildren: () => import('./feature/feature.module')
      .then(m => m.FeatureModule)
  }
];

// After
const routes: Routes = [
  {
    path: 'feature',
    loadComponent: () => import('./feature/feature.component')
      .then(m => m.FeatureComponent)
  }
];
```

**Benefits in real projects:**
- Smaller bundle sizes (better tree-shaking)
- Faster compilation
- Easier testing (no TestBed.configureTestingModule complexity)
- Clearer dependencies
- Better IDE support

**Considerations:**
- Third-party libraries may still use NgModules
- Team training needed
- Existing module-based architecture needs gradual migration
- Some patterns (like feature modules) need rethinking

---


## Question 6: How would you architect a large-scale Angular application? Discuss module organization, state management, and scalability patterns.

**Answer:**

**Architecture layers:**

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (Smart/Container Components)       │
├─────────────────────────────────────┤
│         Feature Modules             │
│  (Feature-specific logic)           │
├─────────────────────────────────────┤
│         Domain/Core Layer           │
│  (Business logic, State)            │
├─────────────────────────────────────┤
│         Data Access Layer           │
│  (API services, Repositories)       │
├─────────────────────────────────────┤
│         Shared/Common Layer         │
│  (Utilities, Pipes, Directives)     │
└─────────────────────────────────────┘
```

**Folder structure for enterprise apps:**

```
src/
├── app/
│   ├── core/                    # Singleton services, guards, interceptors
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── auth.interceptor.ts
│   │   ├── services/
│   │   └── models/
│   │
│   ├── features/                # Feature modules (lazy-loaded)
│   │   ├── users/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── store/          # Feature-specific state
│   │   │   ├── users.routes.ts
│   │   │   └── index.ts
│   │   ├── products/
│   │   └── orders/
│   │
│   ├── shared/                  # Reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── button/
│   │   │   ├── modal/
│   │   │   └── data-table/
│   │   ├── pipes/
│   │   ├── directives/
│   │   └── utils/
│   │
│   ├── layout/                  # Layout components
│   │   ├── header/
│   │   ├── sidebar/
│   │   └── footer/
│   │
│   └── app.component.ts
│
├── assets/
├── environments/
└── styles/
```

**State management decision tree:**

```typescript
// Small to medium apps (< 50 components)
// Use Services + Signals

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private usersSignal = signal<User[]>([]);
  users = this.usersSignal.asReadonly();
  
  selectedUser = signal<User | null>(null);
  
  // Computed values
  activeUsers = computed(() => 
    this.users().filter(u => u.active)
  );
  
  async loadUsers() {
    const users = await this.api.getUsers();
    this.usersSignal.set(users);
  }
  
  selectUser(id: string) {
    const user = this.users().find(u => u.id === id);
    this.selectedUser.set(user ?? null);
  }
}

// Large apps (> 50 components, complex state)
// Use NgRx Signal Store or traditional NgRx

import { signalStore, withState, withMethods } from '@ngrx/signals';

export const UserStore = signalStore(
  { providedIn: 'root' },
  withState({
    users: [] as User[],
    loading: false,
    error: null as string | null
  }),
  withMethods((store, userService = inject(UserService)) => ({
    async loadUsers() {
      patchState(store, { loading: true });
      try {
        const users = await userService.getUsers();
        patchState(store, { users, loading: false });
      } catch (error) {
        patchState(store, { error: error.message, loading: false });
      }
    }
  }))
);
```

**Smart vs Presentational components pattern:**

```typescript
// Smart/Container component - handles logic and state
@Component({
  selector: 'app-user-list-container',
  standalone: true,
  imports: [UserListComponent],
  template: `
    <app-user-list
      [users]="users()"
      [loading]="loading()"
      (userSelected)="onUserSelected($event)"
      (deleteUser)="onDeleteUser($event)"
    />
  `
})
export class UserListContainerComponent {
  private store = inject(UserStore);
  
  users = this.store.users;
  loading = this.store.loading;
  
  ngOnInit() {
    this.store.loadUsers();
  }
  
  onUserSelected(user: User) {
    this.router.navigate(['/users', user.id]);
  }
  
  onDeleteUser(user: User) {
    this.store.deleteUser(user.id);
  }
}

// Presentational component - pure, reusable
@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="loading">Loading...</div>
    <div *ngFor="let user of users">
      <span (click)="userSelected.emit(user)">{{ user.name }}</span>
      <button (click)="deleteUser.emit(user)">Delete</button>
    </div>
  `
})
export class UserListComponent {
  @Input() users: User[] = [];
  @Input() loading = false;
  @Output() userSelected = new EventEmitter<User>();
  @Output() deleteUser = new EventEmitter<User>();
}
```

**Lazy loading strategy:**

```typescript
// routes.ts
export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'users',
        loadComponent: () => import('./features/users/user-list.component')
          .then(m => m.UserListComponent),
        data: { preload: true } // Custom preload flag
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes')
          .then(m => m.ADMIN_ROUTES),
        canActivate: [AdminGuard]
      }
    ]
  }
];

// Custom preload strategy
export class CustomPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return route.data?.['preload'] ? load() : of(null);
  }
}

// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, 
      withPreloading(CustomPreloadStrategy)
    )
  ]
});
```

**Performance patterns:**

```typescript
// 1. Virtual scrolling for large lists
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items">{{ item }}</div>
    </cdk-virtual-scroll-viewport>
  `
})

// 2. TrackBy for ngFor
@Component({
  template: `
    <div *ngFor="let item of items; trackBy: trackById">
      {{ item.name }}
    </div>
  `
})
export class ListComponent {
  trackById(index: number, item: any) {
    return item.id; // Prevents unnecessary re-renders
  }
}

// 3. Memoization for expensive computations
export class DataComponent {
  private cache = new Map<string, any>();
  
  expensiveComputation(input: string): any {
    if (this.cache.has(input)) {
      return this.cache.get(input);
    }
    const result = /* expensive operation */;
    this.cache.set(input, result);
    return result;
  }
}
```

**Scalability considerations:**
- Micro-frontend architecture for very large teams
- Module federation for independent deployments
- Monorepo with Nx for multi-app workspaces
- Feature flags for gradual rollouts
- CDN strategy for static assets
- Service workers for offline capability

---

## Question 7: How do you handle error handling and logging in Angular applications at scale?

**Answer:**

**Multi-layer error handling strategy:**

**1. Global error handler:**

```typescript
// core/error-handler.service.ts
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private logger: LoggerService,
    private notification: NotificationService,
    private router: Router
  ) {}
  
  handleError(error: Error | HttpErrorResponse): void {
    let errorMessage: string;
    let errorType: 'client' | 'server' | 'network';
    
    if (error instanceof HttpErrorResponse) {
      // Server or network error
      if (!navigator.onLine) {
        errorType = 'network';
        errorMessage = 'No internet connection';
      } else {
        errorType = 'server';
        errorMessage = this.getServerErrorMessage(error);
      }
    } else {
      // Client-side error
      errorType = 'client';
      errorMessage = this.getClientErrorMessage(error);
    }
    
    // Log to monitoring service
    this.logger.logError({
      type: errorType,
      message: errorMessage,
      stack: error.stack,
      timestamp: new Date(),
      url: this.router.url,
      userAgent: navigator.userAgent
    });
    
    // Show user-friendly message
    this.notification.showError(errorMessage);
    
    // Log to console in development
    if (!environment.production) {
      console.error('Error:', error);
    }
  }
  
  private getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 401:
        this.router.navigate(['/login']);
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Internal server error. Please try again later.';
      default:
        return error.error?.message || 'An unexpected error occurred.';
    }
  }
  
  private getClientErrorMessage(error: Error): string {
    return error.message || 'An unexpected error occurred.';
  }
}

// Register in main.ts
bootstrapApplication(AppComponent, {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
});
```

**2. HTTP interceptor for API errors:**

```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private logger: LoggerService
  ) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          // Retry on network errors or 5xx
          if (error.status >= 500 || error.status === 0) {
            return timer(retryCount * 1000); // Exponential backoff
          }
          throw error;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Log API errors
        this.logger.logApiError({
          url: req.url,
          method: req.method,
          status: error.status,
          message: error.message,
          body: req.body
        });
        
        // Handle specific errors
        if (error.status === 401) {
          this.auth.logout();
          return throwError(() => new Error('Unauthorized'));
        }
        
        return throwError(() => error);
      })
    );
  }
}
```

**3. Component-level error handling:**

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    <div *ngIf="error$ | async as error" class="error">
      {{ error }}
      <button (click)="retry()">Retry</button>
    </div>
    <div *ngIf="user$ | async as user">
      {{ user.name }}
    </div>
  `
})
export class UserProfileComponent {
  private userId = input.required<string>();
  private retrySubject = new Subject<void>();
  
  error$ = new Subject<string>();
  
  user$ = merge(
    of(null),
    this.retrySubject
  ).pipe(
    switchMap(() => this.userService.getUser(this.userId())),
    catchError(error => {
      this.error$.next('Failed to load user profile');
      return EMPTY;
    })
  );
  
  retry() {
    this.retrySubject.next();
  }
}
```

**4. Structured logging service:**

```typescript
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warning = 2,
  Error = 3,
  Critical = 4
}

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private logLevel = environment.production ? LogLevel.Warning : LogLevel.Debug;
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  debug(message: string, data?: any) {
    this.log(LogLevel.Debug, message, data);
  }
  
  info(message: string, data?: any) {
    this.log(LogLevel.Info, message, data);
  }
  
  warning(message: string, data?: any) {
    this.log(LogLevel.Warning, message, data);
  }
  
  error(message: string, error?: any) {
    this.log(LogLevel.Error, message, error);
  }
  
  critical(message: string, error?: any) {
    this.log(LogLevel.Critical, message, error);
    // Send to monitoring service immediately
    this.sendToMonitoring({ level: 'critical', message, error });
  }
  
  private log(level: LogLevel, message: string, data?: any) {
    if (level < this.logLevel) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      data,
      url: isPlatformBrowser(this.platformId) ? window.location.href : 'SSR',
      userAgent: isPlatformBrowser(this.platformId) ? navigator.userAgent : 'SSR'
    };
    
    // Console output
    this.logToConsole(level, logEntry);
    
    // Send to backend (batch for performance)
    if (level >= LogLevel.Error) {
      this.sendToMonitoring(logEntry);
    }
  }
  
  private logToConsole(level: LogLevel, entry: any) {
    const style = this.getConsoleStyle(level);
    console.log(`%c[${entry.level}] ${entry.message}`, style, entry);
  }
  
  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.Debug: return 'color: gray';
      case LogLevel.Info: return 'color: blue';
      case LogLevel.Warning: return 'color: orange';
      case LogLevel.Error: return 'color: red';
      case LogLevel.Critical: return 'color: white; background: red; font-weight: bold';
      default: return '';
    }
  }
  
  private sendToMonitoring(entry: any) {
    // Send to services like Sentry, LogRocket, DataDog, etc.
    this.http.post('/api/logs', entry).subscribe();
  }
}
```

**5. Integration with monitoring services:**

```typescript
// Sentry integration
import * as Sentry from '@sentry/angular';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
        logErrors: true
      })
    },
    {
      provide: Sentry.TraceService,
      deps: [Router]
    }
  ]
});

// Initialize Sentry
Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.name,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.routingInstrumentation
    })
  ],
  tracesSampleRate: 1.0
});
```

**Best practices:**
- Never expose sensitive data in logs
- Use correlation IDs for request tracking
- Implement log levels for different environments
- Batch log submissions for performance
- Include context (user ID, session, route)
- Set up alerts for critical errors
- Regular log analysis and monitoring

---

## Question 8: Explain lazy loading, preloading strategies, and module federation. How do they impact application performance?

**Answer:**

**1. Lazy Loading - Load on demand**

Lazy loading defers loading of feature modules until they're needed, reducing initial bundle size.

```typescript
// Traditional approach
const routes: Routes = [
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.module')
      .then(m => m.UsersModule)
  }
];

// Modern standalone approach
const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./features/users/user-list.component')
      .then(m => m.UserListComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  }
];
```

**Performance impact:**
- Initial bundle: 500KB → 200KB (60% reduction)
- Time to Interactive: 3s → 1.2s
- First Contentful Paint: Improved by 40%

**2. Preloading Strategies - Load in background**

Preloading loads lazy modules in the background after the initial app loads.

**Built-in strategies:**

```typescript
import { PreloadAllModules, NoPreloading } from '@angular/router';

// Strategy 1: Preload all lazy modules
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
});

// Strategy 2: No preloading (default)
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withPreloading(NoPreloading))
  ]
});
```

**Custom preloading strategy:**

```typescript
// Preload based on custom flag
@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Check custom data property
    if (route.data?.['preload']) {
      console.log('Preloading:', route.path);
      return load();
    }
    return of(null);
  }
}

// Network-aware preloading
@Injectable({ providedIn: 'root' })
export class NetworkAwarePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const connection = (navigator as any).connection;
    
    // Only preload on fast connections
    if (connection) {
      if (connection.effectiveType === '4g' && !connection.saveData) {
        return load();
      }
    }
    return of(null);
  }
}

// Usage in routes
const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    data: { preload: true } // Will be preloaded
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports.component')
      .then(m => m.ReportsComponent),
    data: { preload: false } // Won't be preloaded
  }
];
```

**User behavior-based preloading:**

```typescript
@Injectable({ providedIn: 'root' })
export class PredictivePreloadStrategy implements PreloadingStrategy {
  private routeUsage = new Map<string, number>();
  
  constructor(private analytics: AnalyticsService) {
    // Load usage data from analytics
    this.analytics.getRouteUsage().subscribe(data => {
      this.routeUsage = new Map(Object.entries(data));
    });
  }
  
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const usage = this.routeUsage.get(route.path || '') || 0;
    
    // Preload if route is accessed frequently
    if (usage > 100) {
      return load();
    }
    return of(null);
  }
}
```

**3. Module Federation - Micro-frontends**

Module Federation allows loading modules from different applications at runtime, enabling true micro-frontend architecture.

**Setup with Webpack Module Federation:**

```typescript
// Host app - webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        userApp: 'userApp@http://localhost:4201/remoteEntry.js',
        productApp: 'productApp@http://localhost:4202/remoteEntry.js'
      },
      shared: {
        '@angular/core': { singleton: true, strictVersion: true },
        '@angular/common': { singleton: true, strictVersion: true },
        '@angular/router': { singleton: true, strictVersion: true }
      }
    })
  ]
};

// Remote app - webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'userApp',
      filename: 'remoteEntry.js',
      exposes: {
        './UserModule': './src/app/users/users.module.ts'
      },
      shared: {
        '@angular/core': { singleton: true, strictVersion: true },
        '@angular/common': { singleton: true, strictVersion: true }
      }
    })
  ]
};
```

**Dynamic remote loading:**

```typescript
// routes.ts in host app
const routes: Routes = [
  {
    path: 'users',
    loadChildren: () => loadRemoteModule({
      type: 'module',
      remoteEntry: 'http://localhost:4201/remoteEntry.js',
      exposedModule: './UserModule'
    }).then(m => m.UserModule)
  }
];

// Dynamic remote configuration
@Injectable({ providedIn: 'root' })
export class RemoteConfigService {
  private remotes = {
    userApp: 'http://localhost:4201/remoteEntry.js',
    productApp: 'http://localhost:4202/remoteEntry.js'
  };
  
  loadRemote(appName: string, moduleName: string) {
    return loadRemoteModule({
      type: 'module',
      remoteEntry: this.remotes[appName],
      exposedModule: moduleName
    });
  }
}
```

**Performance comparison:**

| Strategy | Initial Load | Subsequent Navigation | Use Case |
|----------|--------------|----------------------|----------|
| No lazy loading | Slow (large bundle) | Fast | Small apps |
| Lazy loading | Fast | Medium (load on demand) | Medium apps |
| Preload all | Medium | Fast | Good network |
| Selective preload | Fast | Fast (for preloaded) | Most apps |
| Module federation | Fast | Fast | Micro-frontends |

**Real-world example:**

```typescript
// E-commerce app structure
const routes: Routes = [
  {
    path: '',
    component: HomeComponent // Eager loaded
  },
  {
    path: 'products',
    loadComponent: () => import('./products/product-list.component')
      .then(m => m.ProductListComponent),
    data: { preload: true } // High traffic, preload
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.component')
      .then(m => m.CartComponent),
    data: { preload: true } // Likely next step, preload
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES),
    canActivate: [AdminGuard],
    data: { preload: false } // Rare access, don't preload
  }
];
```

**Best practices:**
- Lazy load features not needed on initial load
- Preload high-traffic routes
- Use network-aware strategies for mobile
- Monitor bundle sizes with webpack-bundle-analyzer
- Implement route-based code splitting
- Consider module federation for large teams

---


## Question 9: How do you optimize Angular application performance? Discuss bundle size, runtime performance, and rendering optimization.

**Answer:**

**1. Bundle Size Optimization**

**Analyze current bundle:**
```bash
# Build with stats
ng build --stats-json

# Analyze with webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/stats.json
```

**Techniques:**

```typescript
// A. Tree-shaking - Remove unused code
// ❌ Bad: Imports entire library
import * as _ from 'lodash';

// ✅ Good: Import only what you need
import { debounce } from 'lodash-es';

// B. Lazy load heavy libraries
const routes: Routes = [
  {
    path: 'editor',
    loadComponent: () => import('./editor/editor.component')
      .then(m => m.EditorComponent)
    // Monaco editor only loads when needed
  }
];

// C. Use lighter alternatives
// ❌ Moment.js (67KB)
import * as moment from 'moment';

// ✅ date-fns (13KB with tree-shaking)
import { format, parseISO } from 'date-fns';

// D. Dynamic imports for conditional features
async loadChartLibrary() {
  if (this.needsCharts) {
    const { Chart } = await import('chart.js');
    this.initChart(Chart);
  }
}
```

**Production build optimizations:**

```typescript
// angular.json
{
  "configurations": {
    "production": {
      "optimization": true,
      "outputHashing": "all",
      "sourceMap": false,
      "namedChunks": false,
      "aot": true,
      "extractLicenses": true,
      "buildOptimizer": true,
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "500kb",
          "maximumError": "1mb"
        },
        {
          "