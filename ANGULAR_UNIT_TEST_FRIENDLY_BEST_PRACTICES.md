# Angular Best Practices — Unit-Test-Friendly Component Code

> A comprehensive guide covering component architecture, API integration, data flow, and testing patterns that make Angular code easy to test, maintain, and scale.

---

## Table of Contents

1. [Component Architecture Rules](#1-component-architecture-rules)
2. [API Calling Best Practices](#2-api-calling-best-practices)
3. [Data Flow — Service to Component](#3-data-flow--service-to-component)
4. [State Management in Components](#4-state-management-in-components)
5. [RxJS Patterns for Testability](#5-rxjs-patterns-for-testability)
6. [Dependency Injection for Testability](#6-dependency-injection-for-testability)
7. [Unit Testing Patterns — Components](#7-unit-testing-patterns--components)
8. [Unit Testing Patterns — Services](#8-unit-testing-patterns--services)
9. [Unit Testing Patterns — Pipes, Directives, Guards](#9-unit-testing-patterns--pipes-directives-guards)
10. [Anti-Patterns That Kill Testability](#10-anti-patterns-that-kill-testability)
11. [Checklist — Is My Component Test-Friendly?](#11-checklist--is-my-component-test-friendly)

---

## 1. Component Architecture Rules

### Rule 1.1 — Smart vs Dumb Component Separation

The single most impactful pattern for testability. Split every feature into:

- **Smart (Container) Component** — orchestrates data, injects services, handles side effects
- **Dumb (Presentational) Component** — receives data via `@Input()`, emits events via `@Output()`, zero service injection

```typescript
// ❌ BAD — Component does everything (hard to test)
@Component({ selector: 'app-user-list' })
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loading = true;
    this.http.get<User[]>('/api/users').subscribe({
      next: users => { this.users = users; this.loading = false; },
      error: err => { this.error = err.message; this.loading = false; }
    });
  }

  deleteUser(id: string) {
    this.http.delete(`/api/users/${id}`).subscribe(() => {
      this.users = this.users.filter(u => u.id !== id);
    });
  }
}

```

```typescript
// ✅ GOOD — Smart container component (thin, delegates to service)
@Component({
  selector: 'app-user-list-container',
  template: `
    <app-user-list
      [users]="users()"
      [loading]="loading()"
      [error]="error()"
      (delete)="onDelete($event)"
    />
  `
})
export class UserListContainerComponent {
  private userService = inject(UserService);

  users = this.userService.users;         // signal from service
  loading = this.userService.loading;
  error = this.userService.error;

  constructor() {
    this.userService.loadUsers();
  }

  onDelete(id: string) {
    this.userService.deleteUser(id);
  }
}
```

```typescript
// ✅ GOOD — Dumb presentational component (trivial to test)
@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading) {
      <app-spinner />
    } @else if (error) {
      <app-error-message [message]="error" />
    } @else {
      @for (user of users; track user.id) {
        <app-user-card [user]="user" (delete)="delete.emit(user.id)" />
      }
    }
  `
})
export class UserListComponent {
  @Input({ required: true }) users: User[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() delete = new EventEmitter<string>();
}
```

**Why this matters for testing:**
- Dumb component tests: set inputs, check DOM, verify output emissions — no mocking needed
- Smart component tests: mock the service, verify it calls the right methods — no DOM needed
- Each piece is independently testable with minimal setup

---

### Rule 1.2 — Always Use OnPush Change Detection

```typescript
// ✅ Every component should declare this
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

**Why:** OnPush forces you to use immutable data patterns and explicit reactivity (signals or async pipe), which are inherently more testable. If your component breaks with OnPush, it has a hidden mutation bug.

---

### Rule 1.3 — Keep Components Small and Focused

```
// ❌ BAD — God component
UserDashboardComponent
  → fetches users, orders, analytics
  → handles search, filter, sort, pagination
  → manages modals, toasts, navigation
  → 500+ lines

// ✅ GOOD — Composed from focused components
UserDashboardContainer
  ├── UserSearchBar          (input/output only)
  ├── UserFilterPanel        (input/output only)
  ├── UserTable              (input/output only)
  │   └── UserRow            (input/output only)
  ├── PaginationControls     (input/output only)
  └── UserDetailModal        (input/output only)
```

**Rule of thumb:** If a component file exceeds 150 lines, it's doing too much.

---

### Rule 1.4 — No Business Logic in Templates

```html
<!-- ❌ BAD — Logic in template (untestable without DOM) -->
<div *ngIf="users.filter(u => u.role === 'admin' && u.active).length > 0">
  {{ users.filter(u => u.role === 'admin' && u.active).length }} active admins
</div>

<!-- ✅ GOOD — Logic in component (testable as plain function) -->
<div *ngIf="activeAdminCount() > 0">
  {{ activeAdminCount() }} active admins
</div>
```

```typescript
// Component class
activeAdminCount = computed(() =>
  this.users().filter(u => u.role === 'admin' && u.active).length
);
```

---

### Rule 1.5 — Use `inject()` Over Constructor Injection

```typescript
// ❌ OLD — Constructor injection (verbose, harder to refactor)
export class UserComponent {
  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}
}

// ✅ MODERN — inject() function (Angular 14+)
export class UserComponent {
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
}
```

**Testing benefit:** `inject()` works identically with `TestBed` — no difference in test setup. But it allows extracting logic into plain functions that call `inject()` internally, which are easier to test.

---

## 2. API Calling Best Practices

### Rule 2.1 — Never Call HttpClient Directly in Components

```typescript
// ❌ BAD — HttpClient in component
@Component({...})
export class ProductComponent {
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Product[]>('/api/products').subscribe(data => {
      this.products = data;
    });
  }
}

// ✅ GOOD — Dedicated API service layer
@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/products';

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(product: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  update(id: string, product: UpdateProductDto): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

**Why:** Testing a component that uses `HttpClient` directly requires `HttpClientTestingModule` in every component test. With a service layer, component tests just mock the service.

---

### Rule 2.2 — Three-Layer Service Architecture

```
┌─────────────────────────────────────────────────┐
│  Component Layer (Smart Components)              │
│  Calls Facade service methods                    │
│  Reads state from signals/observables            │
├─────────────────────────────────────────────────┤
│  Facade Service (Business Logic)                 │
│  Orchestrates API calls + state updates          │
│  Handles error mapping, caching, transformations │
├─────────────────────────────────────────────────┤
│  API Service (HTTP Layer)                        │
│  Pure HTTP calls, no business logic              │
│  Returns Observable<T> directly                  │
└─────────────────────────────────────────────────┘
```
