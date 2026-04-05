# State Management — Angular vs React: Architecture Deep Dive

---

## What is State?

State is any data that changes over time and affects what the UI renders. Understanding *where* that state lives determines your entire architecture.

```
Local state    — belongs to one component (form input, toggle, modal open/close)
Shared state   — needed by multiple components (current user, cart items)
Server state   — data fetched from an API (products, orders, user profile)
URL state      — what is in the address bar (filters, pagination, selected tab)
```

**Why state categorization matters:**
- Local state promoted to global creates unnecessary coupling
- Server state in a global store creates a stale cache you manually invalidate
- URL state ignored means the back button breaks and links cannot be shared
- The category determines the tool: using NgRx for a toggle is overkill

---

## The Mental Model: Where Should State Live?

Before picking a library, ask: what is the smallest scope this state needs?

```
Component only?          -> local state (useState / component property)
Sibling components?      -> lift to parent / shared service
Across feature module?   -> feature-level store / context
Whole app?               -> global store
From an API?             -> server state library (TanStack Query / NgRx Data)
```

State should live at the lowest possible level that satisfies all consumers.
Lifting too high causes unnecessary re-renders and tight coupling.
Lifting too low causes prop drilling and duplicated logic.

---

## PART 1 - REACT STATE MANAGEMENT

---

### 1. useState - Local Component State

**Theory:**
useState is a React Hook that lets a functional component hold and update its own private state.
Before hooks (pre React 16.8), only class components could have state.

**How it works internally:**
React maintains a linked list of hooks per component fiber. Each useState call corresponds to a slot
in that list. On re-render, React reads from the same slot in order. This is why hooks must never
be called conditionally - the order must be stable across renders.

**What it returns:**
A tuple [currentValue, setterFunction]. The setter triggers a re-render of the component (and its
children) with the new value.

**Functional update form:**
When new state depends on old state, always use setState(prev => prev + 1) instead of
setState(count + 1). This avoids stale closure bugs in async code where count may be captured
from an older render.

**Object state:**
React does NOT merge object state like this.setState() in class components. You must spread the
previous state manually: setUser(prev => ({ ...prev, name: newName }))

```tsx
import { useState } from 'react';

function Counter() {
  // useState(initialValue) - initialValue is only used on the FIRST render
  const [count, setCount] = useState(0);

  // Functional update - always gets the latest state, avoids stale closures
  const increment = () => setCount(prev => prev + 1);

  // Object state - must spread to avoid losing other fields
  const [user, setUser] = useState({ name: 'Alice', age: 30 });
  const updateName = (name: string) => setUser(prev => ({ ...prev, name }));

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <p>User: {user.name}, {user.age}</p>
      <button onClick={() => updateName('Bob')}>Change Name</button>
    </div>
  );
}
```

**When to use:** Any state that belongs to a single component - form fields, toggles, counters.
**When NOT to use:** When two sibling components need the same value - lift to parent or use context.

---

### 2. useReducer - Complex Local State

**Theory:**
useReducer is an alternative to useState for managing state that involves multiple sub-values or
complex update logic. It follows the Redux pattern: you dispatch an action, a pure reducer function
computes the next state.

**Why use it over useState:**
- When next state depends on previous state in non-trivial ways
- When multiple state transitions share logic
- When you want to co-locate state logic (the reducer) away from the component
- When state has multiple fields that update together atomically

**The reducer function:**
Must be a PURE function - no side effects, no mutations, always returns a new object.
Signature: (currentState, action) => newState
Pure functions are predictable, testable, and enable time-travel debugging.

**dispatch:**
Calling dispatch(action) schedules a re-render. React calls your reducer with the current state
and the action, then re-renders with the returned value.

**Discriminated union actions:**
Using a TypeScript discriminated union for actions means TypeScript narrows the payload type
in each switch case - you get full type safety without casting.

```tsx
import { useReducer } from 'react';

type CartState = {
  items: { id: string; qty: number }[];
  total: number;
};

// Discriminated union - TypeScript narrows payload type in each case
type CartAction =
  | { type: 'ADD_ITEM'; payload: { id: string; price: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'CLEAR' };

// Pure reducer - no side effects, returns new state object
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          // map returns new array, spread creates new item - immutable update
          items: state.items.map(i =>
            i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
          ),
          total: state.total + action.payload.price,
        };
      }
      return {
        ...state,
        items: [...state.items, { id: action.payload.id, qty: 1 }],
        total: state.total + action.payload.price,
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload.id),
      };
    case 'CLEAR':
      return { items: [], total: 0 };
    default:
      return state; // Always return state for unknown actions
  }
}

function Cart() {
  // useReducer(reducerFn, initialState) - returns [state, dispatch]
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  return (
    <div>
      <p>Items: {cart.items.length} | Total: ${cart.total}</p>
      <button onClick={() => dispatch({ type: 'ADD_ITEM', payload: { id: 'p1', price: 10 } })}>
        Add Item
      </button>
      <button onClick={() => dispatch({ type: 'CLEAR' })}>Clear</button>
    </div>
  );
}
```

---

### 3. useContext - Shared State Without Prop Drilling

**Theory:**
useContext lets any component in a tree read a value provided by a Context.Provider ancestor
without passing props through every intermediate component. This solves "prop drilling."

**How Context works step by step:**
1. createContext(defaultValue) - creates a context object. The default value is only used when
   a component has no matching Provider above it in the tree.
2. Context.Provider value={...} - wraps a subtree and provides a value. All consumers in that
   subtree re-render when the value changes.
3. useContext(Context) - subscribes the component to the context. Returns the current value.

**The re-render problem:**
Every consumer re-renders when the Provider value changes. If you pass an object literal
value={{ user, setUser }} directly, a new object is created every render, causing all consumers
to re-render even if user did not change. Fix: useMemo the value or split contexts.

**Context is NOT a state manager:**
Context is a dependency injection mechanism. It does not manage state - useState or useReducer
does. Context just makes that state accessible anywhere in the tree.

```tsx
import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

type User = { id: string; name: string; role: string };

// null default signals "must be inside provider" - caught at runtime with clear error
const UserContext = createContext<{
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
} | null>(null);

// Provider owns the state, exposes it via context
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // useMemo prevents new object reference on every render
  // Only recomputes when user changes - prevents unnecessary consumer re-renders
  const value = useMemo(() => ({
    user,
    login: (u: User) => setUser(u),
    logout: () => setUser(null),
  }), [user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook - encapsulates the null check, gives a clean API to consumers
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}

function Header() {
  const { user, logout } = useUser(); // No props needed
  return (
    <header>
      {user
        ? <><span>Hello, {user.name}</span><button onClick={logout}>Logout</button></>
        : <span>Guest</span>
      }
    </header>
  );
}
```

---

### 4. useMemo and useCallback - Memoization

**Theory:**
Both hooks cache values between renders. They exist because React re-renders components on every
state/prop change, and some computations or function references are expensive to recreate.

**useMemo:**
Caches the RESULT of a computation.
useMemo(() => expensiveCalc(a, b), [a, b]) - only recomputes when a or b change.
Returns the cached value otherwise.

**useCallback:**
Caches a FUNCTION REFERENCE.
useCallback(fn, deps) is equivalent to useMemo(() => fn, deps).
Used when passing callbacks to child components wrapped in React.memo, or as dependencies
in other hooks.

**The dependency array:**
Both hooks use Object.is (shallow equality) to compare deps. If any dep changed, the cache is
invalidated and the value/function is recomputed.

**When NOT to use them:**
Do not memoize everything - it has overhead (memory + comparison cost). Only use when:
- The computation is genuinely expensive (sorting large arrays, complex math)
- A function is passed to a memoized child component
- A value is used as a dependency in useEffect or useCallback

```tsx
import { useMemo, useCallback, useState, memo } from 'react';

type Product = { id: string; name: string; price: number; category: string };

function ProductList({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');

  // useMemo - expensive filter+sort only reruns when products, filter, or sortBy change
  // Without this, it would rerun on EVERY render including unrelated state changes
  const filtered = useMemo(() => {
    return products
      .filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => sortBy === 'name'
        ? a.name.localeCompare(b.name)
        : a.price - b.price
      );
  }, [products, filter, sortBy]);

  // useCallback - stable function reference for memoized child
  // Without this, ProductItem re-renders on every parent render even if props did not change
  const handleSelect = useCallback((id: string) => {
    console.log('Selected:', id);
  }, []); // Empty deps - function never needs to change

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter..." />
      {filtered.map(p => (
        <ProductItem key={p.id} product={p} onSelect={handleSelect} />
      ))}
    </div>
  );
}

// React.memo - only re-renders if props change (shallow comparison)
// Requires stable onSelect reference - hence useCallback above
const ProductItem = memo(({ product, onSelect }: {
  product: Product;
  onSelect: (id: string) => void
}) => (
  <div onClick={() => onSelect(product.id)}>
    {product.name} - ${product.price}
  </div>
));
```

---

### 5. useEffect - Side Effects and Lifecycle

**Theory:**
useEffect lets you synchronize a component with an external system - fetching data, subscribing
to events, updating the DOM, setting timers. It runs AFTER the render is committed to the screen.

**The three forms:**
- useEffect(fn)          - runs after every render
- useEffect(fn, [])      - runs once after mount (like componentDidMount)
- useEffect(fn, [deps])  - runs when deps change

**The cleanup function:**
Return a function from the effect to clean up - unsubscribe, clear timers, cancel requests.
React calls cleanup before running the effect again and before unmounting.

**The stale closure problem:**
Effects capture variables from the render they were created in. If you read count inside an
effect with [] deps, you will always see the initial value. Fix: add count to deps, or use a ref.

**Why effects run twice in development:**
React 18 Strict Mode intentionally mounts, unmounts, then remounts components to help you find
missing cleanup functions. This only happens in development.

**Race condition problem:**
If userId changes quickly, multiple fetches can be in-flight simultaneously. The last one to
resolve wins, which may not be the most recent request. Fix: AbortController.

```tsx
import { useEffect, useState } from 'react';

function DataFetcher({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // AbortController - cancels the fetch if userId changes before response arrives
    // Prevents race conditions and "setState on unmounted component" warnings
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/users/${userId}`, {
          signal: controller.signal // Attach abort signal to fetch
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        // AbortError is expected when cleanup runs - do not treat as real error
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Cleanup - runs when userId changes or component unmounts
    // Cancels any in-flight request from this effect instance
    return () => controller.abort();
  }, [userId]); // Re-run when userId changes

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

---

### 6. Zustand - Lightweight Global State

**Theory:**
Zustand is a minimal state management library built on React useSyncExternalStore. It stores state
outside the React tree in a plain JavaScript object (the store), and components subscribe to slices.

**Why Zustand over Redux:**
- No boilerplate - no actions, reducers, action creators, or dispatch
- No Provider needed - the store is a module-level singleton
- Selective subscriptions - components only re-render when their selected slice changes
- Works outside React - you can read/write store state from anywhere

**How create works:**
create(fn) takes a function that receives set and get and returns the initial state + actions.
set merges partial state (like setState in class components).
get reads current state synchronously - useful inside actions.

**Selector pattern:**
useStore(state => state.count) - the component only re-renders when count changes, not when
other parts of the store change. This is the key performance feature of Zustand.

**Middleware:**
- devtools - connects to Redux DevTools browser extension for debugging
- persist - saves/restores state from localStorage automatically
- immer - allows mutating state directly (Immer handles immutability under the hood)

```tsx
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type AuthState = {
  user: { id: string; name: string; role: string } | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  devtools(       // Connects to Redux DevTools for time-travel debugging
    persist(      // Persists state to localStorage automatically
      (set, get) => ({
        user: null,
        token: null,
        isLoading: false,

        login: async ({ email, password }) => {
          // set() merges partial state, triggers re-renders in subscribed components
          set({ isLoading: true });
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              body: JSON.stringify({ email, password }),
              headers: { 'Content-Type': 'application/json' },
            });
            const { user, token } = await res.json();
            // Atomic update - one re-render for multiple field changes
            set({ user, token, isLoading: false });
          } catch {
            set({ isLoading: false });
          }
        },

        logout: () => {
          // get() reads current state synchronously inside an action
          const { token } = get();
          if (token) fetch('/api/auth/logout', { method: 'POST' });
          set({ user: null, token: null });
        },
      }),
      { name: 'auth-storage' } // localStorage key
    )
  )
);

// Selector - only re-renders when user changes, not isLoading or token
function UserBadge() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  if (!user) return null;
  return (
    <div>
      <span>{user.name} ({user.role})</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

### 7. TanStack Query - Server State Management

**Theory:**
TanStack Query treats server data as a separate category of state with its own lifecycle:
fetching, caching, background refetching, and invalidation. It removes the need to manually
manage loading/error/data state for API calls.

**Core concepts:**

**QueryClient:** The central cache. Stores all query results keyed by query keys.
Shared via QueryClientProvider at the app root.

**useQuery:** Fetches and caches data. Automatically handles loading/error states, deduplicates
concurrent requests for the same key, and refetches in the background when the window regains focus.

**Query keys:** Arrays that uniquely identify a query. ['users', userId] - when userId changes,
a new query runs. Keys are also used for cache invalidation.

**staleTime vs cacheTime (gcTime in v5):**
- staleTime: how long data is considered fresh. During this window, no refetch happens. Default: 0.
- gcTime: how long unused data stays in memory before garbage collection. Default: 5 minutes.

**useMutation:** For write operations (POST/PUT/DELETE). Provides mutate/mutateAsync, loading
state, and onSuccess/onError callbacks. invalidateQueries after mutation triggers a background
refetch of affected queries.

**select option:**
The select option in useQuery transforms/filters data before it reaches the component.
The component only re-renders when the SELECTED value changes, not the raw cache data.
This is a powerful optimization for large datasets.

```tsx
import {
  useQuery, useMutation, useQueryClient,
  QueryClient, QueryClientProvider
} from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min - data considered fresh, no background refetch
      retry: 2,                  // Retry failed requests twice before showing error
    },
  },
});

// API layer - plain async functions, no React dependency
const api = {
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  createUser: async (data: Partial<User>): Promise<User> => {
    const res = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },
};

function UserList() {
  const qc = useQueryClient();

  // useQuery manages the full fetch lifecycle automatically
  // queryKey: cache key and invalidation target
  // queryFn: async function that returns data or throws
  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
    // select: transform data before component receives it
    // Component only re-renders when filtered result changes
    select: (data) => data.filter(u => u.active),
  });

  // useMutation for write operations
  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      // invalidateQueries marks cache as stale, triggers background refetch
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {(error as Error).message}</div>;

  return (
    <div>
      {users?.map(u => <div key={u.id}>{u.name}</div>)}
      <button
        onClick={() => createMutation.mutate({ name: 'New User' })}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Add User'}
      </button>
    </div>
  );
}
```

---

## PART 2 - ANGULAR STATE MANAGEMENT

---

### 1. Component Properties and Signals - Local State

**Theory:**
In Angular, a component class properties ARE its local state. There is no special API like useState.
You declare a property and Angular change detection picks up changes automatically.

**Change Detection (Zone.js):**
Angular uses Zone.js to monkey-patch async APIs (setTimeout, fetch, event listeners). When any
async operation completes, Zone.js notifies Angular, which runs change detection - walking the
component tree and updating the DOM where bindings changed.

**OnPush Change Detection:**
By default, Angular checks every component on every change detection cycle. With OnPush, Angular
only checks a component when:
1. An @Input() reference changes
2. An event originates from the component or its children
3. An Observable bound with async pipe emits
4. You manually call markForCheck()
This is a major performance optimization for large apps.

**Signals (Angular 17+):**
Angular new reactive primitive. A signal is a wrapper around a value that tracks who reads it
and notifies them when it changes. Unlike Zone.js, signals enable fine-grained reactivity -
only the exact DOM nodes that depend on a signal update, not the whole component tree.

**signal() vs computed() vs effect():**
- signal(value): writable reactive value. Read: count(). Write: count.set(n) or count.update(fn)
- computed(() => ...): derived read-only signal. Memoized. Auto-tracks dependencies.
- effect(() => ...): side effect that runs when its signal dependencies change. Like useEffect
  but without a dependency array - Angular tracks dependencies automatically.

```typescript
import {
  Component, signal, computed, effect,
  ChangeDetectionStrategy, OnInit
} from '@angular/core';

@Component({
  selector: 'app-counter',
  // OnPush - component only checks when inputs change or signals emit
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ doubled() }}</p>
    <p>Status: {{ status() }}</p>
    <button (click)="increment()">+</button>
    <button (click)="decrement()">-</button>
    <button (click)="reset()">Reset</button>
  `,
})
export class CounterComponent implements OnInit {
  // signal(initialValue) - creates a reactive value
  // Read by calling as function: count()
  // Write with: count.set(n) or count.update(prev => prev + 1)
  count = signal(0);

  // computed(() => ...) - derived signal, memoized, read-only
  // Only recomputes when its signal dependencies change
  doubled = computed(() => this.count() * 2);

  // computed can depend on multiple signals
  status = computed(() => {
    const c = this.count();
    if (c < 0) return 'negative';
    if (c === 0) return 'zero';
    return 'positive';
  });

  ngOnInit() {
    // effect(() => ...) - runs when signal dependencies change
    // No dependency array needed - Angular tracks automatically
    // Use for: logging, analytics, syncing to localStorage
    effect(() => {
      console.log('Count changed to:', this.count());
    });
  }

  increment() {
    // update(fn) - functional update, receives current value
    this.count.update(c => c + 1);
  }

  decrement() {
    this.count.update(c => c - 1);
  }

  reset() {
    // set(value) - directly set a new value
    this.count.set(0);
  }
}
```

---

### 2. Services with BehaviorSubject - Shared State

**Theory:**
Angular services are singletons (when provided in root) - one instance shared across the entire app.
This makes them natural state containers. Combining a service with RxJS BehaviorSubject gives you
a reactive shared state pattern.

**BehaviorSubject:**
A special type of RxJS Subject that:
1. Requires an initial value
2. Emits the current value immediately to new subscribers
3. Stores the latest value (accessible via .value or .getValue())

This is critical for state - when a new component subscribes, it immediately gets the current
state, not just future updates.

**Subject vs BehaviorSubject vs ReplaySubject:**
- Subject: no initial value, new subscribers miss past emissions
- BehaviorSubject(init): has initial value, new subscribers get latest value immediately
- ReplaySubject(n): replays last n emissions to new subscribers

**The private/public pattern:**
Expose BehaviorSubject as private and expose a public Observable via .asObservable().
This prevents external code from calling .next() directly - only the service controls mutations.
This is encapsulation - the service is the single source of truth for state changes.

**async pipe:**
In templates, {{ state$ | async }} subscribes to the Observable, unwraps the value, and
automatically unsubscribes when the component is destroyed. No manual subscription management.

**combineLatest:**
Emits when ANY of the source observables emit, combining latest values from all sources.
Useful for combining multiple streams into one object for a template.

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' }) // Singleton - one instance for the whole app
export class CartService {
  // Private BehaviorSubject - only this service can call .next()
  // Initial value: empty array
  private cartSubject = new BehaviorSubject<CartItem[]>([]);

  // Public Observable - components subscribe to this, cannot push values
  // asObservable() strips the .next() method, enforcing read-only access
  cart$: Observable<CartItem[]> = this.cartSubject.asObservable();

  // Derived observables using RxJS operators
  // map transforms each emission - like Array.map but for streams
  // These automatically update whenever cart$ emits
  itemCount$: Observable<number> = this.cart$.pipe(
    map(items => items.reduce((sum, item) => sum + item.quantity, 0))
  );

  total$: Observable<number> = this.cart$.pipe(
    map(items => items.reduce((sum, item) => sum + item.price * item.quantity, 0))
  );

  // combineLatest - emits when ANY source emits, with latest values from all
  cartSummary$ = combineLatest([this.cart$, this.itemCount$, this.total$]).pipe(
    map(([items, count, total]) => ({ items, count, total }))
  );

  addItem(item: Omit<CartItem, 'quantity'>): void {
    // getValue() - synchronously read current state
    const current = this.cartSubject.getValue();
    const existing = current.find(i => i.id === item.id);

    if (existing) {
      // Immutable update - map returns new array, spread creates new item object
      const updated = current.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
      // next() - push new state, triggers all subscribers
      this.cartSubject.next(updated);
    } else {
      this.cartSubject.next([...current, { ...item, quantity: 1 }]);
    }
  }

  removeItem(id: string): void {
    const updated = this.cartSubject.getValue().filter(i => i.id !== id);
    this.cartSubject.next(updated);
  }

  clear(): void {
    this.cartSubject.next([]); // Reset to initial state
  }
}
```

```typescript
import { Component } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { CartService } from './cart.service';

@Component({
  selector: 'app-cart',
  imports: [AsyncPipe, DecimalPipe],
  template: `
    @if (summary = (cartService.cartSummary$ | async)) {
      <div>
        <p>{{ summary.count }} items - ${{ summary.total | number:'1.2-2' }}</p>
        @for (item of summary.items; track item.id) {
          <div>{{ item.name }} x{{ item.quantity }}</div>
        }
        <button (click)="cartService.clear()">Clear Cart</button>
      </div>
    }
  `,
})
export class CartComponent {
  constructor(public cartService: CartService) {}
}
```

---

### 3. NgRx Store - Redux Pattern for Angular

**Theory:**
NgRx is Angular implementation of the Redux pattern using RxJS. It enforces strict unidirectional
data flow: components dispatch actions, reducers compute new state, selectors derive data,
effects handle side effects.

**Core principles:**
1. Single source of truth - one immutable state tree for the whole app
2. State is read-only - only actions can trigger state changes
3. Pure reducers - state transitions are predictable and testable

**The NgRx data flow:**
```
Component -> dispatch(Action) -> Reducer -> new State -> Selector -> Component
                                      |
                                   Effect -> API call -> dispatch(Success/Failure)
```

**Actions:**
Plain objects with a type string. createAction creates a typed action factory.
props<T>() defines the payload type. Name actions as past-tense events:
userLoaded, loginFailed - not loadUser, setError. Actions are events, not commands.

**Reducers:**
Pure functions: (state, action) => newState. createReducer + on() replaces switch statements.
on(action, (state, action) => newState) handles one action type. Must return new state objects
(immutable) - never mutate the state parameter directly.

**Selectors:**
Pure functions that derive data from the store. createSelector memoizes them - only recomputes
when input selectors change. Components subscribe to selectors, not raw state. Composable:
selectors can depend on other selectors.

**Effects:**
Handle side effects (API calls, routing, localStorage). Listen for actions, perform async work,
dispatch new actions. Keeps reducers pure. switchMap cancels previous requests when a new
action arrives - perfect for search and load operations.

```typescript
// actions/user.actions.ts
import { createAction, props } from '@ngrx/store';

export interface User { id: string; name: string; email: string; role: string; }

// createAction(type) - creates an action factory function
// props<T>() - defines the payload shape with full TypeScript support
// Convention: '[Source] Event Description'
export const loadUsers = createAction('[User List] Load Users');
export const loadUsersSuccess = createAction(
  '[User List] Load Users Success',
  props<{ users: User[] }>()
);
export const loadUsersFailure = createAction(
  '[User List] Load Users Failure',
  props<{ error: string }>()
);
export const deleteUser = createAction(
  '[User List] Delete User',
  props<{ id: string }>()
);
```

```typescript
// reducers/user.reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as UserActions from '../actions/user.actions';

export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = { users: [], loading: false, error: null };

// createReducer replaces switch statement
// on(action, handler) handles one action type
// handler receives (currentState, action) - must return new state (immutable)
export const userReducer = createReducer(
  initialState,
  on(UserActions.loadUsers, state => ({
    ...state,       // spread existing state - only override what changes
    loading: true,
    error: null,
  })),
  on(UserActions.loadUsersSuccess, (state, { users }) => ({
    ...state,
    users,          // replace users array with new data
    loading: false,
  })),
  on(UserActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UserActions.deleteUser, (state, { id }) => ({
    ...state,
    // filter returns new array - immutable update
    users: state.users.filter(u => u.id !== id),
  }))
);
```

```typescript
// selectors/user.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';

// createFeatureSelector - selects a top-level slice of the store by key
const selectUserState = createFeatureSelector<UserState>('users');

// createSelector - memoized derived selector
// Takes input selectors + projector function
// Only recomputes when input selector results change (referential equality check)
export const selectAllUsers = createSelector(
  selectUserState,
  state => state.users
);

export const selectUsersLoading = createSelector(
  selectUserState,
  state => state.loading
);

// Composing selectors - selectActiveUsers depends on selectAllUsers
// Memoization chains: only recomputes when selectAllUsers result changes
export const selectActiveUsers = createSelector(
  selectAllUsers,
  users => users.filter(u => u.role !== 'disabled')
);
```

```typescript
// effects/user.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class UserEffects {
  constructor(private actions$: Actions, private userService: UserService) {}

  // createEffect - registers an effect with NgRx, must return Observable of actions
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      // ofType - filters the actions stream to only the specified action type
      ofType(UserActions.loadUsers),
      // switchMap - cancels previous inner observable when new action arrives
      // Perfect for load operations: if triggered twice, first request is cancelled
      switchMap(() =>
        this.userService.getAll().pipe(
          // map - transform API response to success action
          map(users => UserActions.loadUsersSuccess({ users })),
          // catchError must be inside switchMap to keep the outer stream alive
          // of() wraps the failure action in an Observable
          catchError(err => of(UserActions.loadUsersFailure({ error: err.message })))
        )
      )
    )
  );
}
```

```typescript
// Component using NgRx
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-user-list',
  imports: [AsyncPipe],
  template: `
    @if (loading$ | async) { <div>Loading...</div> }
    @for (user of users$ | async; track user.id) {
      <div>
        {{ user.name }}
        <button (click)="delete(user.id)">Delete</button>
      </div>
    }
  `,
})
export class UserListComponent implements OnInit {
  // store.select(selector) - returns Observable that emits when selector result changes
  users$ = this.store.select(selectActiveUsers);
  loading$ = this.store.select(selectUsersLoading);

  constructor(private store: Store) {}

  ngOnInit() {
    // dispatch - sends action into the NgRx pipeline
    // Effect picks it up, calls API, dispatches success/failure
    this.store.dispatch(UserActions.loadUsers());
  }

  delete(id: string) {
    this.store.dispatch(UserActions.deleteUser({ id }));
  }
}
```

---

### 4. Angular Signals with Services - Modern Pattern (Angular 17+)

**Theory:**
Angular Signals provide a simpler alternative to BehaviorSubject for shared state. Instead of
RxJS Observables, you use signals directly in services. Components read signals in templates -
Angular signal-based change detection updates only the affected DOM nodes.

**toSignal() and toObservable():**
Angular provides interop utilities to bridge signals and RxJS:
- toSignal(observable$): converts an Observable to a signal. Subscribes automatically,
  unsubscribes on destroy. Must be called in an injection context.
- toObservable(signal): converts a signal to an Observable for use with RxJS operators.

**Why signals over BehaviorSubject for simple state:**
- No need to call .asObservable() for encapsulation - computed() is already read-only
- No async pipe needed in templates - just call the signal as a function
- Fine-grained updates - only components that read the signal re-render
- Simpler mental model - no Observable subscription lifecycle to manage

**When to still use RxJS:**
- Complex async operations (debounce, retry, combineLatest, switchMap)
- HttpClient returns Observables - use toSignal() to bridge into signal world
- When you need operators like distinctUntilChanged, throttleTime, etc.

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

export interface Product { id: string; name: string; price: number; stock: number; }

@Injectable({ providedIn: 'root' })
export class ProductStore {
  // Private writable signals - only this service mutates them
  private _products = signal<Product[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _selectedId = signal<string | null>(null);

  // Public computed signals - read-only derived state
  // computed() creates a derived signal that auto-updates when dependencies change
  readonly products = computed(() => this._products());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  // Derived state - computed from multiple signals
  // Only recomputes when _products or _selectedId changes
  readonly selectedProduct = computed(() => {
    const id = this._selectedId();
    return id ? this._products().find(p => p.id === id) ?? null : null;
  });

  readonly totalValue = computed(() =>
    this._products().reduce((sum, p) => sum + p.price * p.stock, 0)
  );

  readonly inStockProducts = computed(() =>
    this._products().filter(p => p.stock > 0)
  );

  constructor(private http: HttpClient) {}

  async loadProducts(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const products = await this.http.get<Product[]>('/api/products').toPromise();
      this._products.set(products ?? []);
    } catch (err: any) {
      this._error.set(err.message);
    } finally {
      this._loading.set(false);
    }
  }

  selectProduct(id: string): void {
    this._selectedId.set(id);
  }

  updateStock(id: string, delta: number): void {
    // update() - functional update, receives current value
    this._products.update(products =>
      products.map(p =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      )
    );
  }
}
```

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { ProductStore } from './product.store';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-products',
  imports: [DecimalPipe],
  template: `
    @if (store.loading()) {
      <div>Loading...</div>
    } @else if (store.error()) {
      <div>Error: {{ store.error() }}</div>
    } @else {
      <p>Total inventory value: ${{ store.totalValue() | number:'1.2-2' }}</p>
      @for (product of store.inStockProducts(); track product.id) {
        <div [class.selected]="store.selectedProduct()?.id === product.id">
          <span>{{ product.name }} - ${{ product.price }} ({{ product.stock }} in stock)</span>
          <button (click)="store.selectProduct(product.id)">Select</button>
          <button (click)="store.updateStock(product.id, -1)">-</button>
          <button (click)="store.updateStock(product.id, 1)">+</button>
        </div>
      }
    }
  `,
})
export class ProductsComponent implements OnInit {
  // inject() - modern alternative to constructor injection
  store = inject(ProductStore);

  ngOnInit() {
    this.store.loadProducts();
  }
}
```

---

## PART 3 - SIDE-BY-SIDE COMPARISON

---

### Concept Mapping: React vs Angular

| Concept | React | Angular |
|---|---|---|
| Local state | useState | Class property / signal() |
| Derived state | useMemo | computed() |
| Side effects | useEffect | effect() / lifecycle hooks |
| Shared state (simple) | Context + useReducer | Service + BehaviorSubject / signals |
| Shared state (complex) | Redux / Zustand | NgRx Store |
| Server state | TanStack Query | NgRx Data / custom service |
| Reactive streams | - | RxJS Observables |
| Template subscription | - | async pipe / signal read |
| Memoized selector | useMemo | createSelector (NgRx) / computed() |
| Action dispatch | dispatch(action) | store.dispatch(action) |
| Side effect handler | Redux Thunk / Saga | NgRx Effects |
| Dependency injection | Context / props | Angular DI / inject() |

---

### When to Use What

**React:**
```
Simple local state          -> useState
Complex local state         -> useReducer
Cross-component (small app) -> Context + useReducer
Global UI state             -> Zustand
Server/API data             -> TanStack Query
Large enterprise app        -> Redux Toolkit + TanStack Query
```

**Angular:**
```
Simple local state          -> class property / signal()
Derived state               -> computed()
Cross-component (small app) -> Service + BehaviorSubject / signals
Global UI state             -> Service + signals (Angular 17+)
Server/API data             -> Service + HttpClient + TanStack Query
Large enterprise app        -> NgRx Store + Effects
```

---

### The Key Architectural Difference

**React** is a library - you compose your own state architecture from primitives (useState,
useReducer, useContext) and third-party libraries (Zustand, TanStack Query, Redux).
More flexibility, more decisions to make.

**Angular** is a framework - it provides opinions and built-in tools (services, DI, RxJS, NgRx).
Less flexibility, fewer decisions, more consistency across large teams.

**Reactivity model comparison:**
- React: pull-based. Components re-render, then React diffs the virtual DOM.
- Angular (Zone.js): push-based via monkey-patching. Any async op triggers a check cycle.
- Angular (Signals): fine-grained push-based. Only signal consumers update.

**The trend:** Both ecosystems are converging on fine-grained reactivity. React is exploring
compiler-based memoization (React Compiler). Angular has shipped Signals. The days of
"re-render everything and diff" are numbered.

---

### Common Interview Questions

**Q: When would you choose Zustand over Redux Toolkit?**
A: Zustand for small-to-medium apps where you want minimal boilerplate and do not need the full
Redux DevTools/middleware ecosystem. Redux Toolkit when you need strict action logging,
time-travel debugging, complex middleware chains, or a large team that benefits from enforced
patterns.

**Q: What is the difference between BehaviorSubject and Subject in Angular?**
A: BehaviorSubject requires an initial value and replays the latest value to new subscribers.
Subject has no initial value and new subscribers only get future emissions. For state management,
always use BehaviorSubject - components that subscribe after initialization need the current
state immediately.

**Q: Why are NgRx reducers required to be pure functions?**
A: Pure functions (no side effects, same input always produces same output) make state transitions
predictable and testable. They enable time-travel debugging (replay actions to reconstruct state),
and allow NgRx to use reference equality checks for change detection - if the reducer returns the
same object reference, nothing changed.

**Q: What problem does TanStack Query solve that Redux does not?**
A: Redux treats server data like local state - you manually manage loading/error flags, cache
invalidation, and background refetching. TanStack Query understands that server data has a
different lifecycle: it goes stale, needs periodic refetching, and multiple components may request
the same data. It handles deduplication, caching, background updates, and optimistic updates
out of the box.

**Q: When would you use Angular Signals vs RxJS BehaviorSubject?**
A: Signals for simple shared state that does not need complex stream operators (filter, debounce,
combineLatest, etc.). BehaviorSubject when you need RxJS operators - e.g., debouncing a search
input, combining multiple streams, or integrating with HttpClient. In practice, use both: signals
for state, RxJS for async data flows, and toSignal()/toObservable() to bridge them.

**Q: What is the stale closure problem in React hooks?**
A: When a useEffect or useCallback captures a variable from its render scope, it holds a reference
to that specific render value. If the variable changes in a later render but the effect dependency
array does not include it, the effect still sees the old value. Fix: include the variable in the
dependency array, or use a ref (useRef) to always access the latest value without triggering
re-runs.

**Q: What is the difference between switchMap, mergeMap, and concatMap in NgRx Effects?**
A: All three flatten inner Observables but handle concurrency differently:
- switchMap: cancels the previous inner Observable when a new action arrives. Use for search/load
  where only the latest result matters.
- mergeMap: runs all inner Observables concurrently. Use when all requests must complete
  (e.g., parallel uploads).
- concatMap: queues inner Observables, runs them one at a time in order. Use when order matters
  (e.g., sequential form submissions).

**Q: How do you prevent memory leaks with RxJS subscriptions in Angular?**
A: Several patterns:
1. async pipe in templates - auto-unsubscribes on component destroy
2. takeUntilDestroyed() operator (Angular 16+) - completes when component is destroyed
3. DestroyRef + takeUntil pattern for manual subscriptions
4. Store subscriptions in a Subscription object and call .unsubscribe() in ngOnDestroy

---
