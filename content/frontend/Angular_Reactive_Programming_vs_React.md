# Angular moving toward reactive programming — 10 features that echo React

> A deep-dive comparison of Angular's modern API evolution, its alignment with React patterns, and the reactive programming paradigm shift behind it all.

---

## What is reactive programming?

Reactive programming is a paradigm where your code **declares relationships between values** — instead of imperatively telling the computer "go fetch X, store it, then update Y", you say *"Y is always derived from X"* and the system handles propagation automatically.

```
Source (event / data)  →  Operators (map, filter, debounce)  →  Subscriber (UI updates)
```

Think of it like a spreadsheet: cell `C1 = A1 + B1`. You never manually update C1 — it reacts to changes in A1 or B1 automatically. That's reactive.

### Core concepts

| Concept | Description |
|---|---|
| Observables (RxJS) | Streams of values over time — subscribe to react to each emission |
| Signals (Angular 17+) | Fine-grained reactive primitives — reading them creates tracked dependencies |
| useState / useEffect | React's way of declaring reactive state and side effects |
| Derived state | Values computed from other state — updates automatically |
| Change propagation | The system pushes updates to dependents, not manual re-assignment |
| Declarative data flow | Describe *what* the UI should look like, not *how* to update it |

### Imperative vs reactive — side by side

```js
// IMPERATIVE (old Angular style)
let count = 0;
function increment() {
  count++;
  updateDOM(count);         // manually tell the DOM
  recalculateTotal(count);  // manually cascade side effects
}

// REACTIVE (Signals / React style)
const count = signal(0);
const total = computed(() => count() * price()); // auto-derived

count.update(v => v + 1);
// UI and total update automatically — nothing manual
```

---

## The big picture: why is Angular converging with React?

Traditional Angular was **imperative + Zone.js** — Zone.js monkey-patched every async API (setTimeout, Promise, XHR) to know when something *might* have changed, then ran change detection on the entire component tree. This was safe but expensive.

React was always **declarative** — you describe what the UI should look like given some state, and React's reconciler figures out the minimal DOM update. No zones, no patching, fine-grained updates.

Angular is methodically closing that gap. The end goal is **zoneless Angular with Signals** — no Zone.js, no dirty-checking the whole tree, just fine-grained reactive updates propagating only to components that depend on changed signals. Same update model React has always used.

---

## 10 Angular features that echo React

---

### 1. Signals — Angular's answer to useState

> Angular 17+ · `@angular/core`

**Angular (Signals)**
```typescript
const count = signal(0);
const double = computed(() => count() * 2);

// In template
{{ count() }}  {{ double() }}

// Update
count.set(5);
count.update(v => v + 1);
```

**React (useState)**
```jsx
const [count, setCount] = useState(0);
const double = useMemo(() => count * 2, [count]);

// In JSX
{count}  {double}

// Update
setCount(5);
setCount(v => v + 1);
```

**The insight:** Signals are Angular's direct equivalent of React's `useState`. They are reactive primitives — reading a signal inside a `computed()` or template creates a dependency. No zones, no dirty checking. Angular finally has fine-grained reactivity like React.

---

### 2. Standalone components — no NgModule required

> Angular 14+ · `standalone: true`

**Angular (Standalone)**
```typescript
@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `<p>Hello</p>`
})
export class HelloComponent {}
```

**React (function component)**
```jsx
import { useState } from 'react';

function HelloComponent() {
  return <p>Hello</p>;
}

export default HelloComponent;
```

**The insight:** Before Angular 14, every component needed to belong to an NgModule. Standalone components are self-contained, declare their own imports, and ship independently — just like React function components, which never had modules at all.

---

### 3. Control flow syntax — @if, @for instead of *ngIf, *ngFor

> Angular 17+ · built-in control flow

**Angular (@if / @for)**
```html
@if (user) {
  <p>{{ user.name }}</p>
} @else {
  <p>Loading...</p>
}

@for (item of items; track item.id) {
  <li>{{ item.name }}</li>
}
```

**React (JSX conditional / map)**
```jsx
{user
  ? <p>{user.name}</p>
  : <p>Loading...</p>
}

{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

**The insight:** Angular's new `@if / @for / @switch` syntax (v17) is block-level, colocated in the template, and no longer needs structural directive imports. The mental model now closely mirrors React's inline JSX expressions — less magic, more readable.

---

### 4. inject() function — hooks-like dependency injection

> Angular 14+ · `inject()` from `@angular/core`

**Angular (inject function)**
```typescript
// Works in constructor context — composable like a hook
function useUserService() {
  const http = inject(HttpClient);
  const users = signal<User[]>([]);

  const load = () =>
    http.get<User[]>('/users').subscribe(
      data => users.set(data)
    );

  return { users, load };
}
```

**React (custom hook)**
```jsx
function useUsers() {
  const [users, setUsers] = useState([]);

  const load = useCallback(() =>
    fetch('/users')
      .then(r => r.json())
      .then(setUsers)
  , []);

  return { users, load };
}
```

**The insight:** The `inject()` function enables Angular to compose logic outside of class constructors — just like React custom hooks. You can now write reusable, composable service logic in plain functions, not just in class decorators.

---

### 5. takeUntilDestroyed — automatic subscription cleanup like useEffect

> Angular 16+ · `@angular/core/rxjs-interop`

**Angular (takeUntilDestroyed)**
```typescript
@Component({...})
export class MyComponent {
  constructor() {
    interval(1000).pipe(
      takeUntilDestroyed()  // auto-completes on component destroy
    ).subscribe(v => {
      console.log(v);
    });
  }
}
```

**React (useEffect cleanup)**
```jsx
useEffect(() => {
  const id = setInterval(() => {
    console.log('tick');
  }, 1000);

  // cleanup on unmount
  return () => clearInterval(id);
}, []);
```

**The insight:** `takeUntilDestroyed()` automatically completes an RxJS observable when the component is destroyed — exactly mirroring the cleanup function you return from `useEffect`. Both frameworks converge on the same idea: side effects need explicit teardown.

---

### 6. input() and output() functions — replacing @Input / @Output decorators

> Angular 17.1+ · Signal-based inputs

**Angular (input / output functions)**
```typescript
// Signal-based inputs — no decorators
export class ButtonComponent {
  label = input<string>('Click me');
  disabled = input(false);
  clicked = output<void>();

  handleClick() {
    this.clicked.emit();
  }
}
```

**React (props)**
```tsx
function Button({
  label = 'Click me',
  disabled = false,
  onClick
}: ButtonProps) {
  return (
    <button disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}
```

**The insight:** Angular's new `input()` and `output()` are functions, not decorators. Inputs are now Signals with default values and types — reading them feels exactly like reading React props. This is a deliberate alignment with the declarative props model.

---

### 7. effect() — like useEffect for signal side effects

> Angular 17+ · `effect()` from `@angular/core`

**Angular (effect)**
```typescript
const query = signal('');

// Runs whenever query signal changes — auto-tracks dependencies
effect(() => {
  console.log('Search changed:', query());
  fetchResults(query());
});
```

**React (useEffect with deps)**
```jsx
const [query, setQuery] = useState('');

// Runs whenever query changes
useEffect(() => {
  console.log('Search changed:', query);
  fetchResults(query);
}, [query]);  // dependency array — manual
```

**The insight:** `effect()` in Angular runs a side effect whenever any signal it reads changes. React's `useEffect` with a dependency array does the same thing. The key difference: Angular's effect **automatically tracks** signal dependencies — no dependency array to maintain or forget.

---

### 8. OnPush + async pipe — reactive rendering without zones

> Angular · `ChangeDetectionStrategy.OnPush`

**Angular (OnPush + async pipe)**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user$ | async; as user) {
      <p>{{ user.name }}</p>
    }
  `
})
export class UserComponent {
  user$ = this.store.select(selectUser);
}
```

**React (React.memo + useSelector)**
```jsx
const UserComponent = memo(function UserComponent() {
  const user = useSelector(selectUser);
  return user ? <p>{user.name}</p> : null;
});

// Only re-renders when user changes
```

**The insight:** `OnPush + async pipe` is Angular's equivalent of `React.memo + useSelector`. Both opt out of unnecessary re-renders by declaring "only update this component when its data changes". Angular is moving further in this direction with Signals, which will eventually make zones unnecessary entirely.

---

### 9. Router lazy loading — code splitting like React.lazy

> Angular · `loadComponent` in routes

**Angular (lazy route)**
```typescript
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard.component')
        .then(m => m.DashboardComponent)
  }
];
```

**React (lazy + Suspense)**
```jsx
const Dashboard = lazy(
  () => import('./Dashboard')
);

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Dashboard />
    </Suspense>
  );
}
```

**The insight:** Both frameworks now use dynamic `import()` for lazy-loading components by route. Angular 14+ supports `loadComponent` directly — no NgModule needed. The mental model and even the syntax are nearly identical to `React.lazy()`.

---

### 10. RxJS toSignal — bridging streams and signals

> Angular 16+ · `@angular/core/rxjs-interop`

**Angular (toSignal)**
```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

@Component({...})
export class SearchComponent {
  query = signal('');

  // Observable → Signal bridge
  results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(300),
      switchMap(q => this.api.search(q))
    ),
    { initialValue: [] }
  );
}
```

**React (useEffect + state)**
```jsx
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);

useEffect(() => {
  const timer = setTimeout(() => {
    api.search(query).then(setResults);
  }, 300);
  return () => clearTimeout(timer);
}, [query]);
```

**The insight:** `toSignal()` converts an RxJS Observable into a Signal — Angular's bridge between its powerful stream-based past (RxJS) and its reactive future (Signals). This is Angular's most elegant convergence point: RxJS operators for complex async logic, Signals for simple reactive state in templates.

---

## Summary: the convergence map

| Angular (old) | Angular (new) | React equivalent |
|---|---|---|
| `@Input() value` | `value = input<T>()` | `function Comp({ value })` |
| `@Output() click` | `click = output<void>()` | `onClick` prop |
| `*ngIf` / `*ngFor` | `@if` / `@for` | `{cond ? ... : ...}` / `.map()` |
| `ngOnInit` + subscription | `effect()` | `useEffect()` |
| Manual unsubscribe | `takeUntilDestroyed()` | `useEffect` cleanup return |
| NgModule + providers | `standalone: true` + `inject()` | Function components + custom hooks |
| Zone.js change detection | Signals + zoneless | Fine-grained `useState` updates |
| `BehaviorSubject` in service | `signal()` in service | `useState` / `useReducer` |
| `async` pipe + Observable | `toSignal()` | `useSyncExternalStore` |
| `ChangeDetectionStrategy.OnPush` | Signals (implicit OnPush) | `React.memo` |

---

## Key takeaway

Angular is not just borrowing React's syntax — it is adopting React's **fundamental update model**: fine-grained, pull-based reactivity where only the components that depend on changed state re-render. Signals are the vehicle for this. Zoneless Angular (currently in developer preview) is the destination.

The developer experience is converging:
- Both have **reactive primitives** (signal vs useState)
- Both have **derived state** (computed vs useMemo)
- Both have **side effects** (effect vs useEffect)
- Both have **composable logic** (inject functions vs custom hooks)
- Both support **lazy loading** via dynamic import
- Both are moving toward **standalone, function-first** component authoring

The biggest difference that remains: Angular still brings a full opinionated framework (router, forms, HTTP, DI) out of the box. React is a library — you compose the rest yourself.

---

*Angular version reference: Signals (v17), Standalone (v14), inject() (v14), @if/@for (v17), input()/output() (v17.1), takeUntilDestroyed (v16), toSignal (v16)*
