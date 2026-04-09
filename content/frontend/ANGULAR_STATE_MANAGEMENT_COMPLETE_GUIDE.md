# Angular State Management — Complete Guide

## BehaviorSubject, shareReplay, Signals, NgRx Store & Redux Pattern Explained

---

## Table of Contents

1. [What is State and Why Does It Matter?](#1-what-is-state)
2. [State Categories in Angular](#2-state-categories)
3. [BehaviorSubject — The Foundation](#3-behaviorsubject)
4. [shareReplay — Multicasting and Caching](#4-sharereplay)
5. [Angular Signals — The Modern Primitive](#5-angular-signals)
6. [NgRx Store — Enterprise Redux for Angular](#6-ngrx-store)
7. [Redux Pattern Explained from Scratch](#7-redux-pattern)
8. [When to Use What — Decision Guide](#8-decision-guide)
9. [Real-World Architecture Example](#9-real-world-example)

---

## 1. What is State and Why Does It Matter?

State is any data that changes over time and affects what the UI renders. A user's login status, a list of products fetched from an API, whether a modal is open — all state.

Poor state management leads to:
- Stale data shown to users
- Components out of sync with each other
- Memory leaks from unmanaged subscriptions
- Unpredictable bugs that are hard to reproduce

Good state management means: predictable data flow, single source of truth, and clear ownership of who can read and write state.

---

## 2. State Categories in Angular

Before picking a tool, categorize your state:

```
┌─────────────────────┬──────────────────────────────────────────────────────┐
│ Category            │ Examples                                             │
├─────────────────────┼──────────────────────────────────────────────────────┤
│ Local / UI State    │ Form input value, toggle, accordion open/close       │
│ Shared State        │ Current user, shopping cart, selected theme           │
│ Server / Async State│ API responses — products, orders, user profiles       │
│ URL State           │ Route params, query params, pagination, filters       │
│ Form State          │ Reactive form values, validation, dirty/touched       │
└─────────────────────┴──────────────────────────────────────────────────────┘
```

**Rule of thumb:** State should live at the lowest possible scope that satisfies all consumers. Don't put a modal's open/close flag in a global store — that's overkill.

---

## 3. BehaviorSubject — The Foundation

### What is BehaviorSubject?

`BehaviorSubject` is an RxJS class that acts as both an Observable (you can subscribe to it) and an Observer (you can push values into it). It is the most common building block for state management in Angular services.

### Key Characteristics

| Feature | BehaviorSubject | Subject | ReplaySubject |
|---------|----------------|---------|---------------|
| Requires initial value | Yes | No | No |
| New subscriber gets latest value | Yes (immediately) | No (only future) | Yes (last N values) |
| Access current value synchronously | `.getValue()` | No | No |
| Use case | State containers | Event buses | Audit logs, late subscribers |

### Why BehaviorSubject for State?

1. **Initial value** — State always has a starting point (empty array, null user, false loading flag)
2. **Immediate emission** — When a component subscribes, it gets the current state right away, not just future changes
3. **Synchronous read** — `.getValue()` lets you read state without subscribing (useful inside service methods)

### The Private/Public Pattern

This is the standard pattern every Angular developer should know:

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // PRIVATE — only this service can call .next()
  // This is encapsulation: the service owns the state mutations
  private userSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // PUBLIC — components subscribe to these read-only Observables
  // .asObservable() strips the .next() method
  user$: Observable<User | null> = this.userSubject.asObservable();
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  // Derived state using RxJS operators
  isLoggedIn$: Observable<boolean> = this.user$.pipe(
    map(user => user !== null)
  );

  isAdmin$: Observable<boolean> = this.user$.pipe(
    map(user => user?.role === 'admin')
  );

  async login(email: string, password: string): Promise<void> {
    this.loadingSubject.next(true);  // Push new state
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const user: User = await response.json();
      this.userSubject.next(user);   // Push authenticated user
    } catch (error) {
      this.userSubject.next(null);   // Reset on failure
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  logout(): void {
    this.userSubject.next(null);
  }

  // Synchronous read — useful inside service methods
  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }
}
```

### Using in Components

```typescript
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (auth.user$ | async; as user) {
      <span>Welcome, {{ user.name }}</span>
      <button (click)="auth.logout()">Logout</button>
    } @else {
      <a routerLink="/login">Sign In</a>
    }
  `
})
export class HeaderComponent {
  auth = inject(AuthService);
}
```

### Common Mistakes with BehaviorSubject

```typescript
// ❌ BAD — Exposing the Subject directly lets anyone call .next()
public user$ = new BehaviorSubject<User | null>(null);

// ✅ GOOD — Private subject, public observable
private userSubject = new BehaviorSubject<User | null>(null);
user$ = this.userSubject.asObservable();

// ❌ BAD — Mutating the current value instead of emitting new one
const current = this.cartSubject.getValue();
current.push(newItem);  // Mutating the array reference!
this.cartSubject.next(current);  // Same reference — OnPush won't detect change

// ✅ GOOD — Immutable update, new array reference
const current = this.cartSubject.getValue();
this.cartSubject.next([...current, newItem]);  // New reference

// ❌ BAD — Forgetting to unsubscribe (memory leak)
ngOnInit() {
  this.authService.user$.subscribe(user => this.user = user);
}

// ✅ GOOD — Use async pipe (auto-unsubscribes) or takeUntilDestroyed
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.authService.user$.pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(user => this.user = user);
}
```

### Use Cases for BehaviorSubject

- Authentication state (current user, token)
- Shopping cart
- Theme / language preferences
- Any shared state between components that doesn't need time-travel debugging
- Feature-level state in lazy-loaded modules

---

## 4. shareReplay — Multicasting and Caching

### The Problem shareReplay Solves

By default, RxJS Observables are **cold** — each subscriber triggers a separate execution. For HTTP calls, this means multiple subscribers = multiple network requests for the same data.

```typescript
// ❌ PROBLEM — Each subscriber triggers a separate HTTP call
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);

  // Every component that subscribes to this gets its OWN HTTP request
  config$ = this.http.get<AppConfig>('/api/config');
}

// Component A subscribes → HTTP call #1
// Component B subscribes → HTTP call #2
// Component C subscribes → HTTP call #3
// Same data, three network requests!
```

### How shareReplay Works

`shareReplay` converts a cold Observable into a **hot** (multicasted) one. It:

1. **Shares** a single subscription among all subscribers (multicast)
2. **Replays** the last N emissions to late subscribers (cache)
3. Optionally keeps the source alive even when all subscribers disconnect (`refCount`)

```
Without shareReplay:
  Subscriber A ──subscribe──> HTTP GET /api/config  (call #1)
  Subscriber B ──subscribe──> HTTP GET /api/config  (call #2)
  Subscriber C ──subscribe──> HTTP GET /api/config  (call #3)

With shareReplay(1):
  Subscriber A ──subscribe──> HTTP GET /api/config  (call #1, result cached)
  Subscriber B ──subscribe──> (gets cached result immediately, no HTTP call)
  Subscriber C ──subscribe──> (gets cached result immediately, no HTTP call)
```

### shareReplay Syntax and Options

```typescript
import { shareReplay } from 'rxjs';

// Simple form — replay last 1 emission, keep source alive forever
source$.pipe(shareReplay(1));

// Config form — more control
source$.pipe(
  shareReplay({
    bufferSize: 1,       // How many past emissions to replay
    refCount: true,       // Unsubscribe from source when all subscribers leave
    windowTime: 30000     // Optional: cached value expires after 30 seconds
  })
);
```

### refCount: true vs false

| `refCount` | Behavior | Use When |
|------------|----------|----------|
| `false` (default) | Source stays subscribed forever, even with 0 subscribers | App-wide config that never changes |
| `true` | Source unsubscribes when last subscriber leaves, resubscribes on next | Data that should refresh when re-accessed |

### Real-World Patterns

#### Pattern 1: Cached API Call (Most Common)

```typescript
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);

  // One HTTP call, result shared across all subscribers
  // refCount: true — if all components unmount, cache is cleared
  // Next subscriber triggers a fresh fetch
  config$ = this.http.get<AppConfig>('/api/config').pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  // Derived observables — also shared automatically
  featureFlags$ = this.config$.pipe(
    map(config => config.featureFlags)
  );
}
```

#### Pattern 2: Polling with Cache

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);

  // Poll every 30 seconds, share result across all subscribers
  // switchMap cancels previous HTTP call if still pending
  notifications$ = timer(0, 30_000).pipe(
    switchMap(() => this.http.get<Notification[]>('/api/notifications')),
    shareReplay(1)
  );

  unreadCount$ = this.notifications$.pipe(
    map(list => list.filter(n => !n.read).length)
  );
}
```

#### Pattern 3: BehaviorSubject + shareReplay Combined

```typescript
@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private refreshSubject = new BehaviorSubject<void>(undefined);

  // switchMap to the HTTP call whenever refresh is triggered
  // shareReplay caches the latest result for late subscribers
  products$ = this.refreshSubject.pipe(
    switchMap(() => this.http.get<Product[]>('/api/products')),
    shareReplay(1)
  );

  refresh(): void {
    this.refreshSubject.next();  // Triggers a new HTTP call
  }
}
```

### shareReplay vs BehaviorSubject — When to Use Which

| Scenario | Use | Why |
|----------|-----|-----|
| Cache an HTTP response | `shareReplay(1)` | No manual state management needed |
| State that components can modify | `BehaviorSubject` | Need `.next()` to push new values |
| Derived/computed data from API | `shareReplay(1)` | Just transform and cache |
| State with complex mutations | `BehaviorSubject` | Need synchronous read + write |
| Polling data shared across views | `shareReplay(1)` | Auto-shares the polling stream |

---

## 5. Angular Signals — The Modern Primitive (Angular 16+)

### What Are Signals?

Signals are Angular's built-in reactive primitive introduced in Angular 16. They are synchronous, fine-grained, and track dependencies automatically — no subscription management needed.

Think of a signal as a **reactive variable**: when its value changes, anything that reads it automatically updates.

### Why Signals Over BehaviorSubject?

| Feature | BehaviorSubject | Signal |
|---------|----------------|--------|
| Subscription management | Manual (async pipe or takeUntil) | Automatic (no subscriptions) |
| Template syntax | `{{ value$ \| async }}` | `{{ value() }}` |
| Synchronous read | `.getValue()` (code smell) | `value()` (natural) |
| Derived values | `combineLatest + map` (verbose) | `computed()` (clean) |
| Memory leaks | Possible if not unsubscribed | Not possible |
| Change detection | Needs Zone.js or `markForCheck()` | Fine-grained, zoneless-ready |
| Learning curve | Must understand RxJS | Minimal |

### Core Signal APIs

```typescript
import { signal, computed, effect, untracked } from '@angular/core';

// ── signal() — Writable reactive value ──
const count = signal(0);          // Create with initial value
console.log(count());             // Read: call as function → 0
count.set(5);                     // Write: replace value → 5
count.update(prev => prev + 1);   // Write: functional update → 6

// ── computed() — Derived read-only signal ──
// Automatically tracks which signals are read inside the function
// Memoized: only recomputes when dependencies change
const doubled = computed(() => count() * 2);       // → 12
const label = computed(() => `Count is ${count()}`); // → "Count is 6"

// ── effect() — Side effect on signal change ──
// Runs whenever any signal read inside it changes
// No dependency array needed — Angular tracks automatically
effect(() => {
  console.log('Count changed:', count());
  // This logs every time count changes
});

// ── untracked() — Read a signal without creating a dependency ──
effect(() => {
  console.log('Count:', count());           // Tracked — triggers re-run
  console.log('Other:', untracked(other));  // NOT tracked — does not trigger re-run
});
```

### Signal-Based Service (Replacing BehaviorSubject)

```typescript
import { Injectable, signal, computed } from '@angular/core';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  // Private writable signals — equivalent to private BehaviorSubject
  private todos = signal<TodoItem[]>([]);
  private filter = signal<'all' | 'active' | 'completed'>('all');

  // Public read-only access — equivalent to .asObservable()
  readonly allTodos = this.todos.asReadonly();
  readonly currentFilter = this.filter.asReadonly();

  // Computed — equivalent to derived observables with combineLatest + map
  // But MUCH cleaner: no pipe, no operators, no subscription
  readonly filteredTodos = computed(() => {
    const items = this.todos();
    const f = this.filter();
    switch (f) {
      case 'active': return items.filter(t => !t.completed);
      case 'completed': return items.filter(t => t.completed);
      default: return items;
    }
  });

  readonly activeCount = computed(() =>
    this.todos().filter(t => !t.completed).length
  );

  readonly completedCount = computed(() =>
    this.todos().filter(t => t.completed).length
  );

  readonly allCompleted = computed(() =>
    this.todos().length > 0 && this.todos().every(t => t.completed)
  );

  // Mutations — equivalent to service methods that call .next()
  addTodo(text: string): void {
    this.todos.update(current => [
      ...current,
      { id: crypto.randomUUID(), text, completed: false }
    ]);
  }

  toggleTodo(id: string): void {
    this.todos.update(current =>
      current.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }

  removeTodo(id: string): void {
    this.todos.update(current => current.filter(t => t.id !== id));
  }

  setFilter(filter: 'all' | 'active' | 'completed'): void {
    this.filter.set(filter);
  }

  clearCompleted(): void {
    this.todos.update(current => current.filter(t => !t.completed));
  }
}
```

### Using Signals in Components

```typescript
@Component({
  selector: 'app-todo-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters">
      <button (click)="todoService.setFilter('all')"
              [class.active]="todoService.currentFilter() === 'all'">
        All
      </button>
      <button (click)="todoService.setFilter('active')">
        Active ({{ todoService.activeCount() }})
      </button>
      <button (click)="todoService.setFilter('completed')">
        Completed ({{ todoService.completedCount() }})
      </button>
    </div>

    <!-- No async pipe needed! Just call the signal as a function -->
    @for (todo of todoService.filteredTodos(); track todo.id) {
      <div class="todo-item" [class.completed]="todo.completed">
        <input type="checkbox"
               [checked]="todo.completed"
               (change)="todoService.toggleTodo(todo.id)" />
        <span>{{ todo.text }}</span>
        <button (click)="todoService.removeTodo(todo.id)">×</button>
      </div>
    } @empty {
      <p>No todos found</p>
    }

    @if (todoService.completedCount() > 0) {
      <button (click)="todoService.clearCompleted()">
        Clear completed
      </button>
    }
  `
})
export class TodoListComponent {
  todoService = inject(TodoService);
}
```

### Signals + RxJS Interop

Signals and RxJS are not mutually exclusive. Angular provides interop functions:

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

@Component({ /* ... */ })
export class SearchComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  // Observable → Signal
  // toSignal subscribes and unwraps automatically
  // initialValue prevents undefined (the signal always has a value)
  routeId = toSignal(this.route.params.pipe(map(p => p['id'])), {
    initialValue: ''
  });

  // Signal → Observable
  // Useful when you need RxJS operators (debounce, switchMap, etc.)
  searchTerm = signal('');
  searchTerm$ = toObservable(this.searchTerm);

  results = toSignal(
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => term.length > 2
        ? this.http.get<Result[]>(`/api/search?q=${term}`)
        : of([])
      )
    ),
    { initialValue: [] }
  );
}
```

---

## 6. NgRx Store — Enterprise Redux for Angular

### What is NgRx?

NgRx is the official Redux-inspired state management library for Angular. It uses RxJS under the hood and enforces a strict unidirectional data flow pattern.

### When Do You Need NgRx?

You probably need NgRx when:
- Multiple unrelated components share complex state
- You need time-travel debugging (stepping through state changes)
- State transitions are complex with many side effects
- You want a strict, auditable log of every state change
- Team is large and you need enforced patterns to prevent chaos

You probably DON'T need NgRx when:
- State is local to a component or a small feature
- A BehaviorSubject service handles it fine
- You're building a small/medium app
- The overhead of actions/reducers/effects/selectors feels like boilerplate for your use case

### NgRx Architecture — The Full Picture

```
┌──────────────┐     dispatch()     ┌──────────────┐
│  Component   │ ──────────────────>│   Actions     │
│  (UI Layer)  │                    │  (Events)     │
└──────┬───────┘                    └──────┬────────┘
       │                                   │
       │ select()                          │
       │                                   ▼
┌──────┴───────┐                    ┌──────────────┐
│  Selectors   │<───────────────────│   Reducer     │
│  (Queries)   │                    │  (Pure Fn)    │
└──────────────┘                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │    Store      │
                                    │ (State Tree)  │
                                    └──────┬────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │   Effects     │
                                    │ (Side Effects)│
                                    └──────────────┘
```

**Flow:**
1. Component dispatches an **Action** (an event describing what happened)
2. **Reducer** receives the action + current state, returns new state (pure function)
3. **Store** holds the new state
4. **Selectors** derive/query slices of state for components
5. **Effects** listen for actions and perform side effects (HTTP calls, navigation, etc.), then dispatch new actions

### Step-by-Step NgRx Implementation

#### Step 1: Define State and Actions

```typescript
// products.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';

// createActionGroup — groups related actions under a source name
// Each action gets a unique type string: "[Products Page] Load Products"
export const ProductsPageActions = createActionGroup({
  source: 'Products Page',
  events: {
    'Load Products': emptyProps(),                          // No payload
    'Set Filter': props<{ category: string }>(),            // With payload
    'Set Sort': props<{ sortBy: string; order: 'asc' | 'desc' }>(),
  },
});

export const ProductsApiActions = createActionGroup({
  source: 'Products API',
  events: {
    'Load Products Success': props<{ products: Product[] }>(),
    'Load Products Failure': props<{ error: string }>(),
  },
});
```

#### Step 2: Create the Reducer

```typescript
// products.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { ProductsPageActions, ProductsApiActions } from './products.actions';

export interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  filter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Initial state — the starting point before any actions are dispatched
export const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
  filter: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};

// createReducer — defines how state changes in response to actions
// Each on() handler is a PURE FUNCTION: (state, action) => newState
// NEVER mutate state directly — always return a new object with spread
export const productsReducer = createReducer(
  initialState,

  // When "Load Products" is dispatched, set loading to true
  on(ProductsPageActions.loadProducts, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  // When API responds with success, store the products
  on(ProductsApiActions.loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
  })),

  // When API responds with failure, store the error
  on(ProductsApiActions.loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(ProductsPageActions.setFilter, (state, { category }) => ({
    ...state,
    filter: category,
  })),

  on(ProductsPageActions.setSort, (state, { sortBy, order }) => ({
    ...state,
    sortBy,
    sortOrder: order,
  })),
);
```

#### Step 3: Create Selectors

```typescript
// products.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductsState } from './products.reducer';

// Feature selector — selects the 'products' slice from the global store
const selectProductsState = createFeatureSelector<ProductsState>('products');

// Memoized selectors — only recompute when input changes
// This is like computed() for NgRx
export const selectAllProducts = createSelector(
  selectProductsState,
  (state) => state.products
);

export const selectLoading = createSelector(
  selectProductsState,
  (state) => state.loading
);

export const selectError = createSelector(
  selectProductsState,
  (state) => state.error
);

export const selectFilter = createSelector(
  selectProductsState,
  (state) => state.filter
);

// Composed selector — combines multiple selectors
// Only recomputes when products or filter changes
export const selectFilteredProducts = createSelector(
  selectAllProducts,
  selectFilter,
  (products, filter) => {
    if (filter === 'all') return products;
    return products.filter(p => p.category === filter);
  }
);

// Selector with sorting
export const selectSortedFilteredProducts = createSelector(
  selectFilteredProducts,
  selectProductsState,
  (products, state) => {
    return [...products].sort((a, b) => {
      const modifier = state.sortOrder === 'asc' ? 1 : -1;
      if (state.sortBy === 'price') return (a.price - b.price) * modifier;
      return a.name.localeCompare(b.name) * modifier;
    });
  }
);

// ViewModel selector — combines everything a component needs into one object
// Component subscribes to ONE selector instead of many
export const selectProductsViewModel = createSelector(
  selectSortedFilteredProducts,
  selectLoading,
  selectError,
  selectFilter,
  (products, loading, error, filter) => ({
    products,
    loading,
    error,
    filter,
    isEmpty: products.length === 0 && !loading,
  })
);
```

#### Step 4: Create Effects (Side Effects)

```typescript
// products.effects.ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, of } from 'rxjs';
import { ProductsPageActions, ProductsApiActions } from './products.actions';
import { ProductApiService } from './product-api.service';

@Injectable()
export class ProductsEffects {
  private actions$ = inject(Actions);
  private api = inject(ProductApiService);

  // Effect listens for a specific action, performs a side effect,
  // and dispatches a new action with the result
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      // Only react to "Load Products" actions
      ofType(ProductsPageActions.loadProducts),

      // switchMap cancels previous in-flight request if a new one comes
      switchMap(() =>
        this.api.getProducts().pipe(
          // On success → dispatch success action with data
          map(products => ProductsApiActions.loadProductsSuccess({ products })),

          // On failure → dispatch failure action with error message
          catchError(error =>
            of(ProductsApiActions.loadProductsFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
```

#### Step 5: Register in App Config

```typescript
// app.config.ts
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { productsReducer } from './products/products.reducer';
import { ProductsEffects } from './products/products.effects';

export const appConfig = {
  providers: [
    provideStore({
      products: productsReducer,
      // Add more feature reducers here
    }),
    provideEffects(ProductsEffects),
    provideStoreDevtools({
      maxAge: 25,           // Retain last 25 states for time-travel
      logOnly: false,       // Set to true in production
    }),
  ],
};
```

#### Step 6: Use in Component

```typescript
// products.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ProductsPageActions } from './products.actions';
import { selectProductsViewModel } from './products.selectors';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (vm$ | async; as vm) {
      @if (vm.loading) {
        <div class="spinner">Loading products...</div>
      }

      @if (vm.error) {
        <div class="error">{{ vm.error }}</div>
        <button (click)="retry()">Retry</button>
      }

      <div class="filters">
        <button (click)="setFilter('all')" [class.active]="vm.filter === 'all'">All</button>
        <button (click)="setFilter('electronics')">Electronics</button>
        <button (click)="setFilter('clothing')">Clothing</button>
      </div>

      @for (product of vm.products; track product.id) {
        <div class="product-card">
          <h3>{{ product.name }}</h3>
          <p>{{ product.price | currency }}</p>
        </div>
      }

      @if (vm.isEmpty) {
        <p>No products found.</p>
      }
    }
  `,
})
export class ProductsComponent implements OnInit {
  private store = inject(Store);

  // ONE selector for the entire view model
  vm$ = this.store.select(selectProductsViewModel);

  ngOnInit(): void {
    // Dispatch action — the component doesn't know HOW data is fetched
    this.store.dispatch(ProductsPageActions.loadProducts());
  }

  setFilter(category: string): void {
    this.store.dispatch(ProductsPageActions.setFilter({ category }));
  }

  retry(): void {
    this.store.dispatch(ProductsPageActions.loadProducts());
  }
}
```

### NgRx SignalStore (Angular 17+)

NgRx also offers a signal-based store that's lighter than the full Redux pattern:

```typescript
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

type CounterState = {
  count: number;
  loading: boolean;
};

export const CounterStore = signalStore(
  { providedIn: 'root' },
  withState<CounterState>({ count: 0, loading: false }),
  withComputed((store) => ({
    doubled: computed(() => store.count() * 2),
    isPositive: computed(() => store.count() > 0),
  })),
  withMethods((store) => ({
    increment() {
      patchState(store, { count: store.count() + 1 });
    },
    decrement() {
      patchState(store, { count: store.count() - 1 });
    },
    reset() {
      patchState(store, { count: 0 });
    },
  }))
);

// Usage in component — no async pipe, no subscriptions
@Component({
  template: `
    <p>Count: {{ store.count() }}</p>
    <p>Doubled: {{ store.doubled() }}</p>
    <button (click)="store.increment()">+</button>
    <button (click)="store.decrement()">-</button>
  `,
  providers: [CounterStore], // or use providedIn: 'root'
})
export class CounterComponent {
  store = inject(CounterStore);
}
```

---

## 7. Redux Pattern Explained from Scratch

### What is Redux?

Redux is a **predictable state container** pattern (not Angular-specific). It was created by Dan Abramov in 2015 for React, but the pattern applies to any framework. NgRx is Angular's implementation of Redux.

### The Three Principles of Redux

**1. Single Source of Truth**
The entire application state lives in ONE object tree inside a single store. No scattered state across random services or components.

```
// The entire app state is one object
{
  auth: { user: { id: '1', name: 'Alice' }, token: 'abc123' },
  products: { items: [...], loading: false, error: null },
  cart: { items: [...], total: 149.99 },
  ui: { sidebarOpen: true, theme: 'dark' }
}
```

**2. State is Read-Only**
The only way to change state is to dispatch an **action** — a plain object describing what happened. You never mutate state directly.

```typescript
// Actions are plain objects with a type and optional payload
{ type: '[Cart] Add Item', payload: { id: 'p1', name: 'Laptop', price: 999 } }
{ type: '[Auth] Login Success', payload: { user: {...}, token: 'abc' } }
{ type: '[Products] Load Products' }  // No payload needed
```

**3. Changes are Made with Pure Functions (Reducers)**
A reducer takes the current state + an action and returns a NEW state object. No side effects, no mutations, no API calls inside a reducer.

```typescript
// Reducer signature: (currentState, action) => newState
function cartReducer(state = initialState, action): CartState {
  switch (action.type) {
    case '[Cart] Add Item':
      return { ...state, items: [...state.items, action.payload] };
    case '[Cart] Clear':
      return { ...state, items: [], total: 0 };
    default:
      return state;  // Unknown action — return state unchanged
  }
}
```

### Redux Data Flow — Step by Step

```
User clicks "Add to Cart"
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. DISPATCH — Component sends an action                         │
│    store.dispatch({ type: '[Cart] Add Item', payload: item })   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. REDUCER — Pure function computes new state                   │
│    (oldState, action) => newState                               │
│    { items: [...oldItems, newItem], total: oldTotal + price }   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. STORE — Holds the new state, notifies subscribers            │
│    { cart: { items: [item1, item2], total: 1299 } }             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. SELECTOR — Derives data for the UI                           │
│    selectCartTotal → 1299                                       │
│    selectCartItemCount → 2                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. UI UPDATES — Component re-renders with new data              │
│    Cart badge shows "2" | Total shows "$1,299"                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Redux? What Problems Does It Solve?

**Without Redux (Spaghetti State):**
```
Component A modifies user state directly
Component B reads user state from a different service
Component C has its own copy of user state
→ State is scattered, inconsistent, impossible to debug
→ "Where did this value come from?" — nobody knows
```

**With Redux (Predictable State):**
```
Every state change goes through an action → reducer → store pipeline
Every change is logged and traceable
Time-travel debugging: step forward/backward through state history
State is ALWAYS consistent because there's only ONE copy
```

### Redux Concepts Mapped to NgRx

| Redux Concept | NgRx Equivalent | Purpose |
|---------------|-----------------|---------|
| Store | `Store` (from `@ngrx/store`) | Holds the state tree |
| Action | `createActionGroup` / `createAction` | Describes what happened |
| Reducer | `createReducer` + `on()` | Pure function: (state, action) → newState |
| Selector | `createSelector` | Memoized query to derive data from store |
| Middleware | `Effects` (`@ngrx/effects`) | Side effects (API calls, navigation) |
| combineReducers | `provideStore({ feature: reducer })` | Combines feature reducers into root |
| DevTools | `provideStoreDevtools()` | Time-travel debugging in browser |

### Redux vs Flux vs MVC — Quick Comparison

```
MVC (Traditional):
  Model ←→ View ←→ Controller (bidirectional, hard to trace data flow)

Flux (Facebook's fix):
  Action → Dispatcher → Store → View (unidirectional, multiple stores)

Redux (Dan Abramov's simplification of Flux):
  Action → Reducer → Single Store → View (unidirectional, ONE store, pure reducers)
```

Redux simplified Flux by:
1. Replacing the Dispatcher with pure reducer functions
2. Using a single store instead of multiple
3. Making state immutable (new object on every change)

### Side Effects in Redux (Effects / Middleware)

Reducers must be pure — no API calls, no localStorage, no navigation. So where do side effects go?

In NgRx, **Effects** handle side effects. They listen for actions, perform async work, and dispatch new actions with the results.

```
Component dispatches: [Products] Load Products
        │
        ▼
Effect catches the action
        │
        ▼
Effect calls HTTP API: GET /api/products
        │
        ├── Success → dispatches: [Products API] Load Success { products: [...] }
        │                              │
        │                              ▼
        │                         Reducer updates state with products
        │
        └── Failure → dispatches: [Products API] Load Failure { error: '...' }
                                       │
                                       ▼
                                  Reducer updates state with error
```

This separation means:
- Reducers stay pure and testable (no mocking HTTP)
- Effects are isolated and testable (mock the API service)
- Components are dumb — they dispatch actions and render state

---

## 8. When to Use What — Decision Guide

### The Decision Tree

```
Is the state local to ONE component?
  └── YES → Use component property or signal()
  └── NO ↓

Is it shared between a parent and a few children?
  └── YES → Use @Input/@Output or signal-based input()
  └── NO ↓

Is it shared across a feature (e.g., a lazy-loaded route)?
  └── YES → Use a service with BehaviorSubject or signal-based service
  └── NO ↓

Is it an API response that needs caching?
  └── YES → Use shareReplay(1) or a caching service
  └── NO ↓

Is it complex global state with many actions and side effects?
  └── YES → Use NgRx Store (full Redux) or NgRx SignalStore
  └── NO ↓

Default → Service with signals (Angular 17+) or BehaviorSubject
```

### Comparison Matrix

| Criteria | Component Property / Signal | BehaviorSubject Service | shareReplay | NgRx Store | NgRx SignalStore |
|----------|---------------------------|------------------------|-------------|------------|-----------------|
| Complexity | Minimal | Low | Low | High | Medium |
| Boilerplate | None | Low | None | High (actions, reducers, effects, selectors) | Medium |
| Scope | Single component | Feature or app-wide | Per-stream | App-wide | Feature or app-wide |
| Debugging | Browser DevTools | Console logging | Console logging | Redux DevTools (time-travel) | Redux DevTools |
| Testability | Easy | Easy | Easy | Excellent (pure functions) | Good |
| Side effects | In component | In service | In service | Isolated in Effects | In methods or rxMethod |
| Best for | UI toggles, form state | Auth, cart, preferences | Cached API responses | Enterprise apps, complex flows | Medium apps wanting signals + store |
| Team size | Any | Small-medium | Any | Large teams | Medium teams |

### Real-World Recommendations

**Startup / Small App (1-3 devs):**
- Signals for local state
- Signal-based services for shared state
- shareReplay for API caching
- Skip NgRx entirely

**Medium App (3-8 devs):**
- Signals + signal-based services for most state
- NgRx SignalStore for complex features
- shareReplay for API caching
- Full NgRx only if you have genuinely complex state flows

**Enterprise App (8+ devs, multiple teams):**
- NgRx Store for global/cross-team state
- NgRx Effects for all side effects
- Selectors for all derived data
- Signal-based services for feature-local state
- Strict action naming conventions and code review on store changes

---

## 9. Real-World Architecture Example

### E-Commerce App — State Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        App State Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOCAL STATE (Signals)                                           │
│  ├── Form inputs, validation state                               │
│  ├── Modal open/close, accordion state                           │
│  ├── Component-specific loading spinners                         │
│  └── Temporary UI state (hover, focus)                           │
│                                                                  │
│  FEATURE STATE (Signal-based Services)                           │
│  ├── ProductSearchService — search term, filters, sort           │
│  ├── ProductDetailService — selected product, reviews            │
│  └── CheckoutService — checkout steps, form data                 │
│                                                                  │
│  CACHED SERVER STATE (shareReplay)                               │
│  ├── ConfigService.config$ — app configuration                   │
│  ├── CategoryService.categories$ — product categories            │
│  └── FeatureFlagService.flags$ — feature toggles                 │
│                                                                  │
│  GLOBAL STATE (NgRx Store)                                       │
│  ├── auth: { user, token, permissions }                          │
│  ├── cart: { items, total, appliedCoupons }                      │
│  └── notifications: { items, unreadCount }                       │
│                                                                  │
│  URL STATE (Router)                                              │
│  ├── /products?category=electronics&sort=price&page=2            │
│  ├── /product/:id                                                │
│  └── /checkout/step/:stepId                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Takeaway

Don't pick one tool for everything. The best Angular apps use a **mix** of state management approaches, each at the right scope:

- **Signals** for anything local and simple
- **BehaviorSubject services** for shared reactive state
- **shareReplay** for caching API responses
- **NgRx** for complex global state that benefits from strict patterns and debugging tools
- **Router** for URL-driven state (filters, pagination, tabs)

Match the tool to the problem. The simplest solution that works is the right one.

---

*Last updated: April 2026 — Covers Angular 17+ with Signals, NgRx 17+, and NgRx SignalStore*
