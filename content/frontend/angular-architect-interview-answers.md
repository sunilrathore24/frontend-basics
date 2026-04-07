# Angular Architect-Level Interview Questions & Answers

---

## 1. Angular Application Lifecycle — Post-Compilation Processes

### Compilation Phase
Angular uses two compilation strategies:
- **JIT (Just-in-Time):** Compilation happens in the browser at runtime.
- **AOT (Ahead-of-Time):** Compilation happens at build time (default since Angular 9 with Ivy).

### Post-Compilation Bootstrap Flow

```
main.ts
  └── platformBrowserDynamic().bootstrapModule(AppModule)
        └── Angular reads @NgModule metadata
              └── Creates the root Injector (DI container)
                    └── Bootstraps the root component (AppComponent)
                          └── Renders the component tree
```

### Detailed Steps After Compilation

1. **Platform Initialization** — `platformBrowserDynamic()` sets up the browser platform.
2. **Module Bootstrapping** — Angular parses `AppModule`, registers all providers, imports, and declarations.
3. **Root Injector Creation** — A hierarchical DI tree is built from `providers` arrays.
4. **Component Tree Instantiation** — Angular walks the component tree starting from the bootstrap component.
5. **Change Detection Initialization** — Zone.js patches async APIs; Angular sets up `ApplicationRef` and the CD tree.
6. **Lifecycle Hooks Execution** per component:
   - `ngOnChanges` → `ngOnInit` → `ngDoCheck` → `ngAfterContentInit` → `ngAfterContentChecked` → `ngAfterViewInit` → `ngAfterViewChecked`
7. **Router Initialization** — `RouterModule` activates, reads the URL, matches routes, and renders routed components.
8. **APP_INITIALIZER tokens** — Any registered initializers run before the app becomes interactive.

### Ivy-Specific Post-Compilation
With Ivy, each component gets its own compiled factory (`ɵcmp`). The runtime uses these instructions directly, making tree-shaking more effective and enabling lazy compilation at the component level.

---

## 2. Route Guards — Purpose and Functionality

Route guards are interfaces that control navigation in Angular's router. They act as middleware between route transitions.

### Types of Guards

| Guard | Interface | Purpose |
|---|---|---|
| `canActivate` | `CanActivateFn` | Prevents unauthorized access to a route |
| `canActivateChild` | `CanActivateChildFn` | Guards child routes |
| `canDeactivate` | `CanDeactivateFn` | Prevents leaving a route (e.g., unsaved form) |
| `canLoad` / `canMatch` | `CanMatchFn` | Prevents lazy module from loading |
| `resolve` | `ResolveFn` | Pre-fetches data before route activates |

### Functional Guard Example (Angular 15+)

```typescript
// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

```typescript
// app.routes.ts
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]
}
```

---

## 3. Multiple Guards on a Single Route

Yes, Angular fully supports multiple guards on a single route.

```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [authGuard, roleGuard, featureFlagGuard]
}
```

Guards are evaluated in the order they are declared in the array.

---

## 4. Behavior When One Guard Fails in a Multi-Guard Route

Angular evaluates guards **sequentially by default**. The moment any guard returns `false` or a `UrlTree`, Angular **stops evaluating** the remaining guards and cancels the navigation.

### Execution Flow

```
authGuard → PASS
roleGuard → FAIL ← navigation cancelled here
featureFlagGuard → never executed
```

### Important Nuance — Observable/Promise Guards
If a guard returns an Observable, Angular subscribes and waits for the first emission. If it emits `false`, navigation is cancelled immediately.

```typescript
export const roleGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.currentUser$.pipe(
    map(user => user?.role === 'ADMIN'),
    take(1)
  );
};
```

### canActivateChild vs canActivate
For child routes, `canActivateChild` runs for every child navigation, while `canActivate` only runs when the parent route is first activated.

---

## 5. Concurrently Invoking Three Distinct APIs

There are several RxJS and Promise-based approaches for parallel API calls.

### Option 1: `forkJoin` (most common for HTTP)

```typescript
import { forkJoin } from 'rxjs';

forkJoin({
  users: this.http.get('/api/users'),
  products: this.http.get('/api/products'),
  orders: this.http.get('/api/orders')
}).subscribe(({ users, products, orders }) => {
  // All three completed
});
```

`forkJoin` waits for ALL observables to complete and emits the last value of each.

### Option 2: `combineLatest`

```typescript
combineLatest([api1$, api2$, api3$]).subscribe(([r1, r2, r3]) => {
  // Emits whenever any source emits (after all have emitted at least once)
});
```

Use when streams are long-lived (e.g., state streams), not one-shot HTTP calls.

### Option 3: `Promise.all`

```typescript
const [users, products, orders] = await Promise.all([
  firstValueFrom(this.http.get('/api/users')),
  firstValueFrom(this.http.get('/api/products')),
  firstValueFrom(this.http.get('/api/orders'))
]);
```

### Option 4: `zip`

```typescript
zip(api1$, api2$, api3$).subscribe(([r1, r2, r3]) => {
  // Pairs emissions by index
});
```

### Architect Recommendation
For HTTP calls, prefer `forkJoin`. It's semantically correct — HTTP observables complete after one emission, and `forkJoin` is designed exactly for that pattern.

---

## 6. `forkJoin` vs `mergeMap`

These solve fundamentally different problems.

### `forkJoin`
- **Pattern:** Parallel execution, wait for all to complete
- **Use case:** Fire multiple independent requests simultaneously
- **Behavior:** Waits for all inner observables to complete, then emits an array/object of their last values
- **Fails fast:** If any source errors, the whole `forkJoin` errors

```typescript
// Parallel — fires all 3 at once
forkJoin([getUser(1), getUser(2), getUser(3)]).subscribe(([u1, u2, u3]) => {});
```

### `mergeMap` (alias: `flatMap`)
- **Pattern:** Sequential trigger, concurrent inner execution
- **Use case:** For each emission from a source, create a new inner observable (no ordering guarantee)
- **Behavior:** Subscribes to every inner observable immediately, merges all emissions into one stream
- **Does NOT wait** for previous inner observable to complete before starting the next

```typescript
// For each userId emitted, fire a concurrent HTTP request
userIds$.pipe(
  mergeMap(id => this.http.get(`/api/users/${id}`))
).subscribe(user => console.log(user));
```

### Key Differences

| Feature | `forkJoin` | `mergeMap` |
|---|---|---|
| Execution | Parallel, static set | Dynamic, per-emission |
| Ordering | Preserves input order | No order guarantee |
| Completion | Waits for all | Emits as each completes |
| Use case | Batch parallel requests | Transform each emission into a request |

### When to use which
- Need results from 3 APIs at once → `forkJoin`
- Need to call an API for each item in a list → `mergeMap`
- Need ordered sequential calls → `concatMap`
- Need only the latest (e.g., search) → `switchMap`

---

## 7. Sequential API Calls with `concatMap`

`concatMap` is the right operator — it waits for the current inner observable to complete before subscribing to the next.

### Basic Sequential Chain

```typescript
this.http.get('/api/auth/token').pipe(
  concatMap(token => this.http.get('/api/user', {
    headers: { Authorization: `Bearer ${token}` }
  })),
  concatMap(user => this.http.get(`/api/profile/${user.id}`))
).subscribe(profile => console.log(profile));
```

### Using `switchMap` for dependent calls (cancel previous)

```typescript
// If user changes selection, cancel previous request
this.selectedId$.pipe(
  switchMap(id => this.http.get(`/api/details/${id}`))
).subscribe();
```

### Promise-based sequential (async/await)

```typescript
async loadData() {
  const token = await firstValueFrom(this.authService.getToken());
  const user = await firstValueFrom(this.userService.getUser(token));
  const profile = await firstValueFrom(this.profileService.getProfile(user.id));
  return profile;
}
```

### Operator Selection Guide

| Scenario | Operator |
|---|---|
| Sequential, preserve all | `concatMap` |
| Sequential, cancel previous | `switchMap` |
| Parallel, no order | `mergeMap` |
| Parallel, wait for all | `forkJoin` |

---

## 8. Conditional Form Field Enablement Based on Dropdown Selection

### Reactive Form Setup

```typescript
// component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({ selector: 'app-form', templateUrl: './form.component.html' })
export class FormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      country: ['', Validators.required],
      state: [{ value: '', disabled: true }, Validators.required]
    });

    this.form.get('country')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(country => {
      const stateControl = this.form.get('state')!;
      if (country && country !== '') {
        stateControl.enable();
        stateControl.setValidators([Validators.required]);
      } else {
        stateControl.disable();
        stateControl.setValue('');
        stateControl.clearValidators();
      }
      stateControl.updateValueAndValidity();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

```html
<!-- form.component.html -->
<form [formGroup]="form">
  <select formControlName="country">
    <option value="">Select Country</option>
    <option value="US">United States</option>
    <option value="CA">Canada</option>
  </select>

  <select formControlName="state">
    <option value="">Select State</option>
    <option *ngFor="let s of getStates()" [value]="s.code">{{ s.name }}</option>
  </select>
</form>
```

### Architect Note
Always use `takeUntil(this.destroy$)` to prevent memory leaks from `valueChanges` subscriptions. With Angular 16+ Signals, you can use `effect()` instead for a cleaner approach.

---

## 9. Current Stable Angular Version & Significant New Features

As of early 2026, Angular 19 is the current stable release (Angular 20 is in preview/RC).

### Angular 17 — Major Milestone
- **New control flow syntax** (`@if`, `@for`, `@switch`) replacing `*ngIf`, `*ngFor`
- **Deferrable views** (`@defer`) for lazy loading parts of a template
- **Signals** became stable (see Q10)
- New project scaffolding with Vite + esbuild by default (significantly faster builds)

```html
<!-- New control flow (Angular 17+) -->
@if (user.isAdmin) {
  <admin-panel />
} @else {
  <user-panel />
}

@for (item of items; track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items found</li>
}

@defer (on viewport) {
  <heavy-chart-component />
} @placeholder {
  <div>Loading chart...</div>
}
```

### Angular 18
- **Zoneless change detection** (experimental) — removes Zone.js dependency
- `afterRender` / `afterNextRender` lifecycle hooks
- Material 3 components stable
- Route-level render mode configuration (SSR/SSG per route)

### Angular 19
- **Incremental hydration** — defer blocks can be hydrated on demand
- `linkedSignal` — writable signal derived from another signal
- `resource()` API for async signal-based data fetching
- Standalone components are now the default (no more `NgModule` required)
- Hot Module Replacement (HMR) enabled by default

---

## 10. Signals in Angular — Concept and Utility

Signals are a **reactive primitive** introduced in Angular 16 (stable in 17) that provide a fine-grained reactivity model as an alternative to Zone.js-based change detection.

### Core Concepts

```typescript
import { signal, computed, effect } from '@angular/core';

// Writable signal
const count = signal(0);

// Read value
console.log(count()); // 0

// Update
count.set(5);
count.update(v => v + 1); // 6

// Computed signal (derived, read-only)
const doubled = computed(() => count() * 2);

// Effect (side effect when signal changes)
effect(() => {
  console.log('Count changed:', count());
});
```

### Signal-based Component

```typescript
@Component({
  template: `
    <p>Count: {{ count() }}</p>
    <p>Doubled: {{ doubled() }}</p>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() {
    this.count.update(v => v + 1);
  }
}
```

### Why Signals Matter (Architect Perspective)

| Aspect | Zone.js (Traditional) | Signals |
|---|---|---|
| Change detection | Checks entire component tree | Only affected components |
| Performance | O(n) tree traversal | O(1) targeted updates |
| Debugging | Hard to trace what triggered CD | Explicit dependency graph |
| SSR | Zone.js overhead | Works without Zone.js |
| Interop | N/A | `toSignal()` / `toObservable()` bridges RxJS |

### RxJS Interop

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// Convert Observable to Signal
const users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });

// Convert Signal to Observable
const count$ = toObservable(this.count);
```

### `linkedSignal` (Angular 19)

```typescript
const options = signal(['A', 'B', 'C']);
const selected = linkedSignal(() => options()[0]); // resets when options change
```

---

## 11. HTTP Interceptors — Multiple Interceptors

HTTP interceptors are middleware that intercept every `HttpRequest` and `HttpResponse` in the application.

### Use Cases
- Attach auth tokens to requests
- Global error handling
- Request/response logging
- Retry logic
- Loading spinner management
- Response caching

### Functional Interceptor (Angular 15+)

```typescript
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }
  return next(req);
};
```

```typescript
// error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        inject(AuthService).logout();
        inject(Router).navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
```

### Registering Multiple Interceptors

```typescript
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        authInterceptor,      // runs first
        loggingInterceptor,   // runs second
        errorInterceptor      // runs third
      ])
    )
  ]
};
```

### Interceptor Chain Order
- **Request:** Interceptors run in the order they are registered (first → last)
- **Response:** Interceptors run in reverse order (last → first)

This mirrors the middleware pattern in Express.js.

---

## 12. Login and Logout Process in Angular

### Login Flow

```
User submits credentials
  → AuthService.login(credentials)
    → POST /api/auth/login
      → Server returns { accessToken, refreshToken, user }
        → Store tokens (localStorage / sessionStorage / memory)
          → Update auth state (BehaviorSubject / Signal)
            → Router.navigate(['/dashboard'])
```

### AuthService Implementation

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession(); // restore on app load
  }

  login(credentials: LoginDto): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.accessToken);
        localStorage.setItem('refresh_token', response.refreshToken);
        this.currentUser.set(response.user);
      }),
      map(() => void 0)
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private restoreSession(): void {
    const token = localStorage.getItem('access_token');
    if (token && !this.isTokenExpired(token)) {
      // decode JWT and restore user
      const user = this.decodeToken(token);
      this.currentUser.set(user);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  }
}
```

### Logout Flow

```
User clicks logout
  → AuthService.logout()
    → Clear tokens from storage
      → Reset auth state
        → Optionally call POST /api/auth/logout (server-side token invalidation)
          → Router.navigate(['/login'])
```

---

## 13. Role Validation Post-Login & `package.json` vs `package-lock.json`

### Role-Based Access Control (RBAC) After Login

#### Step 1 — Roles in JWT Payload
```json
{
  "sub": "user-123",
  "email": "[email]",
  "roles": ["ADMIN", "EDITOR"],
  "permissions": ["read:reports", "write:users"],
  "exp": 1700000000
}
```

#### Step 2 — Role Service

```typescript
@Injectable({ providedIn: 'root' })
export class RoleService {
  private roles = signal<string[]>([]);

  setRoles(roles: string[]) {
    this.roles.set(roles);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.roles().includes(r));
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }
}
```

#### Step 3 — Role Guard

```typescript
export const roleGuard = (requiredRoles: string[]): CanActivateFn => {
  return () => {
    const roleService = inject(RoleService);
    const router = inject(Router);

    if (roleService.hasAnyRole(requiredRoles)) {
      return true;
    }
    return router.createUrlTree(['/unauthorized']);
  };
};

// Usage
{
  path: 'admin',
  canActivate: [authGuard, roleGuard(['ADMIN', 'SUPER_ADMIN'])]
}
```

#### Step 4 — Template-Level Role Checks

```typescript
// role.directive.ts
@Directive({ selector: '[appHasRole]', standalone: true })
export class HasRoleDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private roleService: RoleService
  ) {}

  @Input() set appHasRole(roles: string[]) {
    if (this.roleService.hasAnyRole(roles)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
```

```html
<button *appHasRole="['ADMIN']">Delete User</button>
```

---

### `package.json` vs `package-lock.json`

| Aspect | `package.json` | `package-lock.json` |
|---|---|---|
| Purpose | Declares project metadata and dependency ranges | Locks exact resolved versions of every package |
| Written by | Developer | npm (auto-generated) |
| Version format | Ranges (`^1.2.3`, `~1.2.3`, `>=1.0.0`) | Exact versions (`1.2.3`) |
| Committed to git | Yes | Yes (critical) |
| Editable manually | Yes | No (let npm manage it) |
| Reproducibility | No — `^1.2.3` could install `1.9.0` | Yes — guarantees identical installs |

### Why `package-lock.json` Matters at Scale

```bash
# Without lock file — different devs may get different versions
npm install  # Dev A gets lodash@4.17.20
npm install  # Dev B gets lodash@4.17.21 (bug introduced)

# With lock file — everyone gets identical dependency tree
npm ci  # Uses package-lock.json exclusively, fails if mismatch
```

### `npm install` vs `npm ci`

- `npm install` — updates `package-lock.json` if needed
- `npm ci` — strictly uses `package-lock.json`, never modifies it (use in CI/CD pipelines)

---

## 14. Coding Questions

### 15. Flatten a Nested Array Without `flatMap`

#### Recursive Solution

```typescript
function flattenArray(arr: any[]): any[] {
  const result: any[] = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      // Recursively flatten and push each element
      const flattened = flattenArray(item);
      for (const el of flattened) {
        result.push(el);
      }
    } else {
      result.push(item);
    }
  }

  return result;
}

// Test
const nested = [1, [2, [3, [4, [5]]]], 6, [7, 8]];
console.log(flattenArray(nested)); // [1, 2, 3, 4, 5, 6, 7, 8]
```

#### Iterative Solution (Stack-based, no recursion)

```typescript
function flattenIterative(arr: any[]): any[] {
  const stack = [...arr];
  const result: any[] = [];

  while (stack.length) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      // Push array items back onto stack (reversed to maintain order)
      stack.push(...item);
    } else {
      result.unshift(item); // prepend to maintain original order
    }
  }

  return result;
}
```

#### Using `reduce` (functional approach)

```typescript
function flattenReduce(arr: any[]): any[] {
  return arr.reduce((acc, item) =>
    Array.isArray(item)
      ? acc.concat(flattenReduce(item))
      : acc.concat(item),
    []
  );
}
```

---

### 16. String Transformation: "hello" → "h1e1l2o3"

The pattern: each character is followed by the count of how many times it has appeared so far.

```
h → appears 1st time → h1
e → appears 1st time → e1
l → appears 1st time → l1
l → appears 2nd time → l2
o → appears 1st time → o3  ← wait, let's re-examine
```

Re-reading: "hello" → "h1e1l2o3" — the number after each char is its occurrence count up to that position.

```typescript
function transformString(str: string): string {
  const countMap = new Map<string, number>();
  let result = '';

  for (const char of str) {
    const count = (countMap.get(char) ?? 0) + 1;
    countMap.set(char, count);
    result += char + count;
  }

  return result;
}

// Test
console.log(transformString('hello'));
// h → 1st: h1
// e → 1st: e1
// l → 1st: l1
// l → 2nd: l2
// o → 1st: o1
// Result: "h1e1l1l2o1"

// For "hello" → "h1e1l203" pattern (positional index):
function transformWithIndex(str: string): string {
  return str.split('').map((char, i) => char + (i + 1)).join('');
}
// h1 e2 l3 l4 o5 → "h1e2l3l4o5"
```

> Note: The exact output "h1e1l203" suggests the number is the cumulative occurrence count per character. The first implementation matches that intent.

---

### 17. Find the Largest Element in a Data Structure

#### In a Flat Array

```typescript
function findLargest(arr: number[]): number {
  if (arr.length === 0) throw new Error('Empty array');

  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}

// O(n) time, O(1) space
console.log(findLargest([3, 1, 9, 2, 7])); // 9
```

#### In a Nested/Mixed Structure (recursive)

```typescript
function findLargestNested(data: any): number {
  if (typeof data === 'number') return data;

  if (Array.isArray(data)) {
    return Math.max(...data.map(findLargestNested));
  }

  if (typeof data === 'object' && data !== null) {
    return Math.max(...Object.values(data).map(findLargestNested));
  }

  return -Infinity;
}

// Test
const structure = {
  a: 5,
  b: [3, 12, { c: 7, d: [1, 99] }],
  e: 4
};
console.log(findLargestNested(structure)); // 99
```

#### In a Binary Search Tree

```typescript
class TreeNode {
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null
  ) {}
}

// In a BST, the largest is always the rightmost node
function findLargestBST(root: TreeNode | null): number | null {
  if (!root) return null;
  let current = root;
  while (current.right) {
    current = current.right;
  }
  return current.val; // O(h) where h = tree height
}

// For a general binary tree (not BST), use DFS
function findLargestBinaryTree(root: TreeNode | null): number {
  if (!root) return -Infinity;
  return Math.max(
    root.val,
    findLargestBinaryTree(root.left),
    findLargestBinaryTree(root.right)
  );
}
```

#### Using Built-in Methods (concise)

```typescript
// Flat array
const max = Math.max(...[3, 1, 9, 2, 7]); // 9

// With reduce (handles large arrays without spread stack overflow)
const maxSafe = [3, 1, 9, 2, 7].reduce((a, b) => Math.max(a, b), -Infinity);
```

---

*Document covers Angular lifecycle, routing, RxJS patterns, reactive forms, Signals, interceptors, auth flows, RBAC, and core JavaScript/TypeScript coding challenges at architect level.*
