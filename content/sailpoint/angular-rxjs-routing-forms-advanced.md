# Angular RxJS, Routing, Forms & Advanced Patterns
## Architect-Level Interview Guide

> Covers: RxJS deep dive, Performance, Modern Angular, Routing & Forms, Advanced Concepts, Real-world Scenarios

---

## Section 1: RxJS Mastery

### Q1: Observable vs Promise

| Feature | Promise | Observable |
|---------|---------|------------|
| Values | Single | Multiple over time |
| Execution | Eager (runs immediately) | Lazy (runs on subscribe) |
| Cancellation | Not cancellable | `unsubscribe()` |
| Operators | `.then()`, `.catch()` | `pipe()` with 100+ operators |
| Retry | Manual | `retry()`, `retryWhen()` |

```typescript
// PROMISE - eager, single value
const promise = fetch('/api/user').then(r => r.json());

// OBSERVABLE - lazy, cancellable, multiple values
const user$ = this.http.get<User>('/api/user');
const sub = user$.subscribe(user => console.log(user));
sub.unsubscribe(); // cancel anytime
```

---

### Q2: mergeMap vs switchMap vs concatMap vs exhaustMap

These are flattening operators that map to inner Observables:

```typescript
// switchMap - CANCELS previous, uses latest only
// Use for: search typeahead, route params
this.searchInput.valueChanges.pipe(
  debounceTime(300),
  switchMap(term => this.api.search(term))
  // If user types "abc", cancels search for "ab"
).subscribe(results => this.results = results);
```


```typescript
// mergeMap - runs ALL in parallel, no cancellation
// Use for: bulk operations, fire-and-forget
this.userIds$.pipe(
  mergeMap(id => this.api.getUser(id))
  // All requests run simultaneously
).subscribe(user => this.users.push(user));

// concatMap - runs ONE at a time, in order, waits for completion
// Use for: sequential operations, ordered saves
this.saveQueue$.pipe(
  concatMap(item => this.api.save(item))
  // Saves item1, waits, then item2, waits, then item3
).subscribe();

// exhaustMap - IGNORES new emissions while current is running
// Use for: login button, prevent duplicate submissions
this.loginButton$.pipe(
  exhaustMap(() => this.auth.login(credentials))
  // Clicking login 5 times = only 1 API call
).subscribe();
```

**Visual Comparison:**
```
Input:    --A----B----C--->

switchMap:  --a]--b]--c--->  (cancels previous)
mergeMap:   --a---b---c--->  (all run parallel)
concatMap:  --a------b------c--->  (sequential, waits)
exhaustMap: --a-----------c--->  (ignores B while A runs)
```

**SailPoint Context:**
- `switchMap` → Identity search autocomplete
- `mergeMap` → Bulk role assignment
- `concatMap` → Sequential access request approvals
- `exhaustMap` → Submit certification review button

---

### Q3: Subject, BehaviorSubject, ReplaySubject

```typescript
// Subject - no initial value, only emits to current subscribers
const subject = new Subject<string>();
subject.subscribe(v => console.log('A:', v)); // subscribes
subject.next('hello'); // A: hello
subject.subscribe(v => console.log('B:', v)); // late subscriber
subject.next('world'); // A: world, B: world
// B missed "hello"

// BehaviorSubject - has initial value, new subscribers get LAST value
const behavior = new BehaviorSubject<string>('initial');
behavior.subscribe(v => console.log('A:', v)); // A: initial
behavior.next('updated'); // A: updated
behavior.subscribe(v => console.log('B:', v)); // B: updated (gets last)
behavior.getValue(); // 'updated' - synchronous access

// ReplaySubject - replays N previous values to new subscribers
const replay = new ReplaySubject<string>(2); // buffer size 2
replay.next('a');
replay.next('b');
replay.next('c');
replay.subscribe(v => console.log(v)); // logs: b, c (last 2)
```


| Type | Initial Value | Late Subscribers Get | Use Case |
|------|--------------|---------------------|----------|
| Subject | None | Nothing | Event bus |
| BehaviorSubject | Required | Last emitted value | Current state (logged-in user) |
| ReplaySubject | None | Last N values | Chat history, audit log |
| AsyncSubject | None | Only final value | HTTP-like single result |

**SailPoint Example:**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  // BehaviorSubject - always know current auth state
  private currentUser$ = new BehaviorSubject<User | null>(null);
  
  // ReplaySubject - replay last 10 audit events for new subscribers
  private auditLog$ = new ReplaySubject<AuditEvent>(10);
  
  // Subject - one-time notifications
  private sessionExpired$ = new Subject<void>();
}
```

---

### Q4: Hot vs Cold Observables

```typescript
// COLD Observable - creates new producer per subscriber
// Each subscriber gets its own independent execution
const cold$ = new Observable(subscriber => {
  console.log('New HTTP call made');
  subscriber.next(Math.random());
});
cold$.subscribe(v => console.log('A:', v)); // A: 0.123
cold$.subscribe(v => console.log('B:', v)); // B: 0.789 (different!)

// HOT Observable - shares single producer among all subscribers
const hot$ = cold$.pipe(
  shareReplay({ bufferSize: 1, refCount: true })
);
hot$.subscribe(v => console.log('A:', v)); // A: 0.456
hot$.subscribe(v => console.log('B:', v)); // B: 0.456 (same!)
```

**When to make hot:**
```typescript
// Cache API response - don't re-fetch for each subscriber
@Injectable({ providedIn: 'root' })
export class IdentityService {
  // ❌ Cold - each component subscription = new HTTP call
  getIdentities() {
    return this.http.get<Identity[]>('/api/identities');
  }
  
  // ✅ Hot - shared, cached, auto-cleanup
  identities$ = this.http.get<Identity[]>('/api/identities').pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
```

---

### Q5: Avoiding Memory Leaks in Angular Observables

```typescript
// Method 1: async pipe (BEST - auto unsubscribe)
@Component({
  template: `<div *ngFor="let user of users$ | async">{{ user.name }}</div>`
})
export class UserListComponent {
  users$ = this.userService.getUsers();
}

// Method 2: takeUntilDestroyed (Angular 16+)
export class ModernComponent {
  private destroyRef = inject(DestroyRef);
  
  ngOnInit() {
    this.dataService.getData().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => this.data = data);
  }
}

// Method 3: takeUntil with destroy subject (pre-Angular 16)
export class ClassicComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    this.dataService.getData().pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => this.data = data);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Method 4: Subscription management
export class ManualComponent implements OnDestroy {
  private subs = new Subscription();
  
  ngOnInit() {
    this.subs.add(
      this.service1.getData().subscribe(d => this.data1 = d)
    );
    this.subs.add(
      this.service2.getData().subscribe(d => this.data2 = d)
    );
  }
  
  ngOnDestroy() {
    this.subs.unsubscribe(); // Cleans up all
  }
}
```

**Priority:** async pipe > takeUntilDestroyed > takeUntil > manual unsubscribe

---

## Section 2: Performance Optimization

### Q6: How would you optimize a slow Angular application?

**Systematic Approach:**

**Step 1: Profile and Identify**
```
Chrome DevTools → Performance tab → Record → Interact → Stop
Look for:
  - Long tasks (>50ms)
  - Excessive change detection cycles
  - Large layout shifts
  - Heavy scripting time

Angular DevTools → Profiler tab
  - See which components re-render and how often
  - Identify unnecessary change detection runs
```


**Step 2: Change Detection Optimization**
```typescript
// Use OnPush everywhere possible
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Use async pipe instead of subscribe -->
    <div *ngFor="let item of items$ | async; trackBy: trackById">
      {{ item.name }}
    </div>
    
    <!-- Use pure pipes instead of method calls -->
    <p>{{ rawData | formatData }}</p>
    
    <!-- AVOID method calls in templates -->
    <!-- ❌ <p>{{ formatData(rawData) }}</p> -->
  `
})
export class OptimizedComponent {
  items$ = this.service.getItems();
  trackById = (i: number, item: Item) => item.id;
}
```

**Step 3: Lazy Loading**
```typescript
const routes: Routes = [
  { path: 'dashboard', loadComponent: () => 
    import('./dashboard.component').then(c => c.DashboardComponent) },
  { path: 'admin', loadChildren: () => 
    import('./admin/admin.routes').then(r => r.ADMIN_ROUTES) }
];
```

**Step 4: Virtual Scrolling for Large Lists**
```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let user of users; trackBy: trackById">
        {{ user.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`.viewport { height: 400px; }`]
})
export class UserListComponent {
  users: User[]; // Can handle 100,000+ items
}
```

**Step 5: Bundle Size Reduction**
```
1. Analyze: npx source-map-explorer dist/**/*.js
2. Lazy load routes and heavy components
3. Use tree-shakable providers (providedIn: 'root')
4. Replace heavy libs (moment → date-fns, lodash → lodash-es)
5. Set budgets in angular.json:
   "budgets": [
     { "type": "initial", "maximumWarning": "500kb", "maximumError": "1.5mb" }
   ]
```

---

### Q7: trackBy in ngFor - Why it matters

```typescript
// ❌ Without trackBy - Angular destroys and recreates ALL DOM elements
<div *ngFor="let user of users">{{ user.name }}</div>
// When users array changes: destroy 5000 divs → create 5000 new divs

// ✅ With trackBy - Angular reuses existing DOM elements
<div *ngFor="let user of users; trackBy: trackByUserId">
  {{ user.name }}
</div>

trackByUserId(index: number, user: User): string {
  return user.id; // Angular matches by ID, only updates changed items
}
// When users array changes: update only the 3 items that actually changed
```

**How it works internally:**
```
Without trackBy:
  Old: [User1, User2, User3]
  New: [User1, User2, User4]  ← User3 replaced by User4
  Angular: "Arrays are different references, rebuild everything"
  DOM ops: Remove 3 elements + Create 3 elements = 6 operations

With trackBy:
  Old: [id:1, id:2, id:3]
  New: [id:1, id:2, id:4]
  Angular: "id:1 same, id:2 same, id:3 gone, id:4 new"
  DOM ops: Remove 1 element + Create 1 element = 2 operations
```

---

### Q8: Pure vs Impure Pipes

```typescript
// PURE PIPE (default) - only runs when input REFERENCE changes
@Pipe({ name: 'filterActive', pure: true })
export class FilterActivePipe implements PipeTransform {
  transform(users: User[]): User[] {
    console.log('Pure pipe called'); // Called rarely
    return users.filter(u => u.active);
  }
}
// users.push(newUser) → pipe does NOT run (same reference)
// users = [...users, newUser] → pipe RUNS (new reference)

// IMPURE PIPE - runs on EVERY change detection cycle
@Pipe({ name: 'filterActive', pure: false })
export class FilterActiveImpurePipe implements PipeTransform {
  transform(users: User[]): User[] {
    console.log('Impure pipe called'); // Called 100s of times!
    return users.filter(u => u.active);
  }
}
```

**Rule:** Always use pure pipes. If you need impure behavior, rethink your approach - usually a computed property or signal is better.

---

### Q9: Angular Virtual Scrolling

```typescript
// Renders only visible items in viewport (e.g., 20 out of 50,000)
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="72" class="list">
      <app-identity-card
        *cdkVirtualFor="let identity of identities; trackBy: trackById"
        [identity]="identity">
      </app-identity-card>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`.list { height: 600px; }`]
})
export class IdentityListComponent {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  identities: Identity[] = []; // 50,000 items
  
  trackById = (_: number, item: Identity) => item.id;
  
  scrollToIndex(index: number) {
    this.viewport.scrollToIndex(index, 'smooth');
  }
}
```

**Without virtual scroll:** 50,000 DOM nodes → browser crashes
**With virtual scroll:** ~20 DOM nodes → smooth 60fps scrolling

---

### Q10: Reducing Bundle Size

```
Technique                          Savings
─────────────────────────────────────────────
Lazy loading routes                30-60%
Tree-shaking (providedIn: 'root')  5-15%
AOT compilation (default in prod)  ~45%
Replace moment.js with date-fns    ~70KB
Import only needed lodash funcs    ~50KB
Remove unused Angular modules      10-20%
Enable compression (gzip/brotli)   60-80%
Use standalone components          5-10%
```

```typescript
// ❌ Import entire lodash
import _ from 'lodash'; // 70KB

// ✅ Import only what you need
import { debounce } from 'lodash-es'; // 1KB
```

---

## Section 3: Modern Angular (16-17+)

### Q11: What are Angular Signals?

```typescript
import { signal, computed, effect } from '@angular/core';

// signal - reactive primitive (like a reactive variable)
const count = signal(0);
console.log(count()); // 0 - read with ()

count.set(5);         // set new value
count.update(v => v + 1); // update based on current

// computed - derived reactive value (auto-updates)
const doubled = computed(() => count() * 2);
console.log(doubled()); // 12

// effect - side effect that runs when signals change
effect(() => {
  console.log(`Count is now: ${count()}`);
  // Runs automatically whenever count changes
});
```


**Real Component Example:**
```typescript
@Component({
  selector: 'app-cart',
  template: `
    <p>Items: {{ itemCount() }}</p>
    <p>Total: {{ total() | currency }}</p>
    <button (click)="addItem()">Add</button>
  `
})
export class CartComponent {
  items = signal<CartItem[]>([]);
  itemCount = computed(() => this.items().length);
  total = computed(() => 
    this.items().reduce((sum, item) => sum + item.price, 0)
  );
  
  addItem() {
    this.items.update(items => [...items, newItem]);
    // itemCount and total auto-update, template auto-refreshes
  }
}
```

---

### Q12: Signals vs RxJS - When to use each

| Aspect | Signals | RxJS Observables |
|--------|---------|-----------------|
| Purpose | Synchronous reactive state | Async data streams |
| Values | Always has current value | May not have value yet |
| Read | `signal()` - synchronous | `.subscribe()` - async |
| Operators | `computed()`, `effect()` | 100+ operators (map, filter...) |
| Cancellation | N/A | `unsubscribe()` |
| Best for | UI state, form values | HTTP, WebSocket, events |
| Change Detection | Fine-grained (no Zone.js needed) | Needs async pipe or markForCheck |

```typescript
// Use SIGNALS for: local component state
@Component({...})
export class CounterComponent {
  count = signal(0);
  isEven = computed(() => this.count() % 2 === 0);
  
  increment() { this.count.update(c => c + 1); }
}

// Use RXJS for: async operations, complex streams
@Component({...})
export class SearchComponent {
  results$ = this.searchInput.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.api.search(term)),
    catchError(() => of([]))
  );
}

// COMBINE both
@Component({...})
export class DashboardComponent {
  private http = inject(HttpClient);
  
  // RxJS for HTTP
  private users$ = this.http.get<User[]>('/api/users');
  
  // Convert to Signal for template
  users = toSignal(this.users$, { initialValue: [] });
  
  // Computed from signal
  activeCount = computed(() => 
    this.users().filter(u => u.active).length
  );
}
```

---

### Q13: Angular Hydration

**What:** Hydration reuses server-rendered HTML instead of destroying and re-creating it on the client.

```
WITHOUT Hydration (traditional SSR):
  Server renders HTML → Browser shows HTML → Angular destroys it → Re-renders from scratch
  Result: Flash of content, slow TTI

WITH Hydration:
  Server renders HTML → Browser shows HTML → Angular attaches to existing DOM
  Result: No flash, fast TTI, smooth transition
```

```typescript
// Enable hydration
import { provideClientHydration } from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration() // That's it!
  ]
});
```

**Partial Hydration (Angular 17+):**
```html
<!-- Only hydrate when user scrolls to this section -->
@defer (on viewport) {
  <app-heavy-dashboard />
} @placeholder {
  <div class="skeleton-loader"></div>
}
```

---

### Q14: Deferred Loading vs Lazy Loading

```typescript
// LAZY LOADING - route-based, loads when user navigates
const routes: Routes = [{
  path: 'admin',
  loadComponent: () => import('./admin.component').then(c => c.AdminComponent)
}];
// Loads admin chunk when user clicks /admin link

// DEFERRED LOADING (@defer) - template-based, loads on trigger
@Component({
  template: `
    <!-- Load when element enters viewport -->
    @defer (on viewport) {
      <app-heavy-chart [data]="chartData" />
    } @placeholder {
      <div class="chart-skeleton">Loading chart...</div>
    } @loading (minimum 500ms) {
      <app-spinner />
    } @error {
      <p>Failed to load chart</p>
    }
    
    <!-- Load on user interaction -->
    @defer (on interaction) {
      <app-comments [postId]="postId" />
    } @placeholder {
      <button>Show Comments</button>
    }
    
    <!-- Load after delay -->
    @defer (after 2s) {
      <app-recommendations />
    }
    
    <!-- Load when condition is true -->
    @defer (when isAdmin) {
      <app-admin-panel />
    }
  `
})
export class PageComponent {}
```

| Feature | Lazy Loading | @defer |
|---------|-------------|--------|
| Scope | Route level | Template level |
| Trigger | Navigation | viewport, interaction, timer, condition |
| Granularity | Entire route/module | Individual component |
| Placeholder | None (shows blank) | Built-in @placeholder, @loading, @error |
| Available since | Angular 2 | Angular 17 |

---

## Section 4: Routing and Forms

### Q15: Reactive Forms vs Template-driven Forms

```typescript
// TEMPLATE-DRIVEN - simple, uses ngModel, two-way binding
@Component({
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f.value)">
      <input name="email" ngModel required email>
      <input name="password" ngModel required minlength="8">
      <button [disabled]="f.invalid">Submit</button>
    </form>
  `
})
export class LoginComponent {
  onSubmit(value: any) { console.log(value); }
}

// REACTIVE FORMS - complex, programmatic, testable
@Component({
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email">
      <div *ngIf="form.get('email')?.errors?.['email']">
        Invalid email
      </div>
      <input formControlName="password">
      <button [disabled]="form.invalid">Submit</button>
    </form>
  `
})
export class LoginComponent implements OnInit {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });
  
  constructor(private fb: FormBuilder) {}
  
  // Dynamic validation
  ngOnInit() {
    this.form.get('email')?.valueChanges.pipe(
      debounceTime(300),
      switchMap(email => this.authService.checkEmailExists(email))
    ).subscribe(exists => {
      if (exists) this.form.get('email')?.setErrors({ taken: true });
    });
  }
  
  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```


| Feature | Template-driven | Reactive |
|---------|----------------|----------|
| Setup | FormsModule | ReactiveFormsModule |
| Model | Implicit (ngModel) | Explicit (FormGroup) |
| Validation | Directives in template | Functions in component |
| Testing | Needs DOM | Pure unit tests |
| Dynamic forms | Difficult | Easy |
| Async validation | Complex | Built-in |
| Best for | Simple login/contact | Complex enterprise forms |

**Staff-level answer:** Always use Reactive Forms for enterprise apps. They're testable, composable, and support dynamic form generation.

---

### Q16: setValue vs patchValue

```typescript
this.form = this.fb.group({
  name: [''],
  email: [''],
  address: this.fb.group({
    street: [''],
    city: ['']
  })
});

// setValue - MUST provide ALL fields, throws error if any missing
this.form.setValue({
  name: 'John',
  email: 'john@example.com',
  address: { street: '123 Main', city: 'Austin' }
});
// ❌ this.form.setValue({ name: 'John' }); // ERROR! Missing fields

// patchValue - update SOME fields, ignores missing ones
this.form.patchValue({
  name: 'John'
  // email, address not provided = no error, keeps current values
});
// ✅ Partial updates work fine
```

**When to use:**
- `setValue` → Loading complete entity from API (ensures all fields populated)
- `patchValue` → Partial updates, user edits, merging data

---

### Q17: Route Guards and Resolvers

```typescript
// CanActivate - Block access to route
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

// CanDeactivate - Prevent leaving (unsaved changes)
export const unsavedChangesGuard: CanDeactivateFn<FormComponent> = (component) => {
  if (component.hasUnsavedChanges()) {
    return confirm('You have unsaved changes. Leave anyway?');
  }
  return true;
};

// Resolver - Pre-fetch data before route loads
export const userResolver: ResolveFn<User> = (route) => {
  const userService = inject(UserService);
  return userService.getUser(route.paramMap.get('id')!);
};

// Route config
const routes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: 'user/:id',
        component: UserDetailComponent,
        resolve: { user: userResolver },
        canDeactivate: [unsavedChangesGuard]
      }
    ]
  }
];

// Access resolved data in component
export class UserDetailComponent {
  private route = inject(ActivatedRoute);
  user = this.route.snapshot.data['user']; // Pre-loaded!
}
```

---

## Section 5: Advanced Concepts

### Q18: ViewEncapsulation Modes

```typescript
// Emulated (DEFAULT) - scoped styles via attribute selectors
@Component({
  encapsulation: ViewEncapsulation.Emulated,
  styles: [`h1 { color: red; }`]
  // Compiles to: h1[_ngcontent-abc] { color: red; }
  // Only affects THIS component's h1 tags
})

// None - global styles, no scoping
@Component({
  encapsulation: ViewEncapsulation.None,
  styles: [`h1 { color: red; }`]
  // Applies to ALL h1 tags in the entire app!
  // Use carefully - for global theme overrides
})

// ShadowDom - native browser Shadow DOM
@Component({
  encapsulation: ViewEncapsulation.ShadowDom,
  styles: [`h1 { color: red; }`]
  // Uses real Shadow DOM - true isolation
  // External styles cannot penetrate
  // Not all browsers support equally
})
```

| Mode | Scoping | Global CSS leaks in? | Performance |
|------|---------|---------------------|-------------|
| Emulated | Attribute-based | Yes (partially) | Good |
| None | No scoping | Yes (fully) | Best |
| ShadowDom | Native isolation | No | Varies |

---

### Q19: Dynamic Component Loading

```typescript
// Modern approach (Angular 13+) - ViewContainerRef
@Component({
  template: `<ng-container #container></ng-container>`
})
export class DynamicHostComponent {
  @ViewChild('container', { read: ViewContainerRef }) container: ViewContainerRef;
  
  async loadComponent(type: string) {
    this.container.clear();
    
    let component: Type<any>;
    switch (type) {
      case 'chart':
        const { ChartComponent } = await import('./chart.component');
        component = ChartComponent;
        break;
      case 'table':
        const { TableComponent } = await import('./table.component');
        component = TableComponent;
        break;
    }
    
    const ref = this.container.createComponent(component);
    ref.instance.data = this.data; // Pass inputs
    ref.instance.action.subscribe(e => this.handleAction(e)); // Listen to outputs
  }
}
```

**SailPoint Context:** Dynamic loading for identity governance widgets - different dashboard widgets based on user role (admin sees certification widget, user sees access request widget).

---

### Q20: Scalable Angular Project Structure

```
src/
├── app/
│   ├── core/                    # Singleton services, guards, interceptors
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── auth.interceptor.ts
│   │   ├── http/
│   │   │   └── error.interceptor.ts
│   │   └── core.module.ts       # Imported ONCE in AppModule
│   │
│   ├── shared/                  # Reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── data-table/
│   │   │   ├── modal/
│   │   │   └── search-bar/
│   │   ├── directives/
│   │   ├── pipes/
│   │   └── shared.module.ts     # Imported in feature modules
│   │
│   ├── features/                # Feature modules (lazy loaded)
│   │   ├── identities/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── identities.routes.ts
│   │   │   └── identities.component.ts
│   │   ├── certifications/
│   │   ├── access-requests/
│   │   └── admin/
│   │
│   ├── layout/                  # Shell components
│   │   ├── header/
│   │   ├── sidebar/
│   │   └── footer/
│   │
│   └── app.routes.ts
│
├── assets/
├── environments/
└── styles/
    ├── _variables.scss
    ├── _mixins.scss
    └── global.scss
```


**Key Principles:**
- **Core module** → imported once, contains singletons
- **Shared module** → imported by feature modules, contains reusable UI
- **Feature modules** → lazy loaded, self-contained, own routing
- **Barrel exports** → `index.ts` files for clean imports
- **Smart/Dumb pattern** → Container components (smart) + Presentational components (dumb)

---

## Section 6: Scenario-Based Questions

### Q21: "Your Angular page has 5000 rows and is slow. What will you do?"

**Step-by-step answer:**

```
1. MEASURE FIRST
   → Chrome DevTools Performance tab
   → Angular DevTools Profiler
   → Identify: Is it rendering? Change detection? Memory?

2. VIRTUAL SCROLLING (biggest win)
   → cdk-virtual-scroll-viewport
   → Renders only ~20 visible rows instead of 5000
   → Immediate 95%+ improvement

3. OnPush CHANGE DETECTION
   → Each row component uses ChangeDetectionStrategy.OnPush
   → Only re-checks rows whose @Input reference changed

4. trackBy
   → Prevents DOM destruction/recreation on data refresh
   → trackBy: trackById

5. PAGINATION or INFINITE SCROLL
   → Server-side pagination: load 50 at a time
   → Infinite scroll: load more on scroll

6. DEBOUNCE FILTERS/SEARCH
   → Don't filter on every keystroke
   → debounceTime(300) + distinctUntilChanged()

7. WEB WORKERS for heavy computation
   → Sort/filter 5000 rows in background thread
   → Keep UI responsive
```

```typescript
// Complete optimized solution
@Component({
  selector: 'app-identity-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input (input)="onSearch($event)" placeholder="Search...">
    
    <cdk-virtual-scroll-viewport itemSize="48" class="table-viewport">
      <app-identity-row
        *cdkVirtualFor="let identity of filteredIdentities$ | async; 
                         trackBy: trackById"
        [identity]="identity"
        (click)="onSelect(identity)">
      </app-identity-row>
    </cdk-virtual-scroll-viewport>
  `
})
export class IdentityTableComponent {
  private searchTerm$ = new BehaviorSubject<string>('');
  
  filteredIdentities$ = combineLatest([
    this.identityService.identities$,
    this.searchTerm$.pipe(debounceTime(300), distinctUntilChanged())
  ]).pipe(
    map(([identities, term]) => 
      identities.filter(i => i.name.toLowerCase().includes(term))
    )
  );
  
  trackById = (_: number, item: Identity) => item.id;
  
  onSearch(event: Event) {
    this.searchTerm$.next((event.target as HTMLInputElement).value);
  }
}
```

---

### Q22: "How would you debug a change detection loop?"

**Symptoms:** "ExpressionChangedAfterItHasBeenChecked" error or infinite re-renders.

**Debugging Steps:**

```typescript
// Step 1: Enable Angular DevTools profiler
// Check which component triggers excessive CD cycles

// Step 2: Look for these common causes:

// ❌ CAUSE 1: Modifying state in ngAfterViewInit
ngAfterViewInit() {
  this.title = 'Updated'; // Changes after CD ran → ERROR
}
// ✅ FIX: Use setTimeout or markForCheck
ngAfterViewInit() {
  setTimeout(() => this.title = 'Updated');
}

// ❌ CAUSE 2: Getter that returns new object every time
get config() {
  return { theme: 'dark', lang: 'en' }; // New reference every CD!
}
// ✅ FIX: Cache the value
private _config = { theme: 'dark', lang: 'en' };
get config() { return this._config; }

// ❌ CAUSE 3: Method in template returning new array
getUsers() { return this.users.filter(u => u.active); } // New array every CD!
// ✅ FIX: Use pure pipe or computed signal
activeUsers = computed(() => this.users().filter(u => u.active));

// ❌ CAUSE 4: Two-way binding loop between parent and child
// Parent changes child input → child emits output → parent changes input → loop
// ✅ FIX: Use distinctUntilChanged() or break the cycle

// Step 3: Add logging to identify the loop
constructor(private cdr: ChangeDetectorRef) {
  const original = this.cdr.detectChanges.bind(this.cdr);
  this.cdr.detectChanges = () => {
    console.trace('detectChanges called from:');
    original();
  };
}
```

---

### Q23: "Design a large enterprise Angular architecture"

**SailPoint Identity Governance Platform Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                    Shell Application                  │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │ Header  │  │ Sidebar  │  │   <router-outlet>   │ │
│  │ (Auth)  │  │ (Nav)    │  │                     │ │
│  └─────────┘  └──────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────┘
         │              │              │
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │Identity │   │ Access  │   │  Cert   │   ← Lazy loaded
    │ Module  │   │ Request │   │ Module  │     feature modules
    │         │   │ Module  │   │         │
    └─────────┘   └─────────┘   └─────────┘
         │              │              │
    ┌────────────────────────────────────┐
    │         Shared Module              │
    │  DataTable, Modal, SearchBar,      │
    │  Pipes, Directives                 │
    └────────────────────────────────────┘
         │
    ┌────────────────────────────────────┐
    │          Core Module               │
    │  AuthService, HttpInterceptors,    │
    │  Guards, ErrorHandler, State       │
    └────────────────────────────────────┘
```

**Key Architectural Decisions:**

```typescript
// 1. State Management - NgRx for complex shared state
// Store structure
interface AppState {
  auth: AuthState;
  identities: IdentityState;
  certifications: CertificationState;
  notifications: NotificationState;
}

// 2. API Layer - Centralized with interceptors
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${this.auth.getToken()}`,
          'X-Tenant-Id': this.tenant.getId()
        }
      })
    ).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError(err => {
        if (err.status === 401) this.auth.refreshToken();
        if (err.status === 403) this.router.navigate(['/forbidden']);
        return throwError(() => err);
      })
    );
  }
}

// 3. Micro-frontend ready - Module Federation
// Each team owns a feature module that can be deployed independently

// 4. Design System - Shared component library
// @sailpoint/ui-components package with:
// - Atomic design (atoms → molecules → organisms)
// - Storybook documentation
// - Accessibility built-in
```

---

## Section 7: SailPoint-Specific & Behavioral

### SailPoint Technical Context

SailPoint builds identity security platforms. Their Angular frontend handles:
- **Identity Governance** - Managing who has access to what
- **Access Requests** - Users requesting access to applications/roles
- **Certifications** - Managers reviewing and certifying access
- **Role Management** - Creating and managing roles
- **Provisioning** - Automating account creation/modification
- **Audit & Compliance** - Tracking all access changes

**Tech Stack at SailPoint Pune:**
- Angular (migrating from ExtJS)
- TypeScript
- RxJS
- NgRx (state management)
- Java/Groovy backend
- REST APIs
- Microservices architecture

---

### Behavioral Questions for Staff Level

**Q24: How do you mentor junior developers?**


**Sample Answer:**
- Pair programming sessions on complex features
- Code review with detailed explanations, not just approvals
- Create internal tech talks on Angular patterns (OnPush, RxJS operators)
- Establish coding standards and document architectural decisions (ADRs)
- Assign progressively complex tasks with guidance
- Create reusable component templates and generators

**Q25: Describe a critical architectural decision you made**

**Sample Answer:**
"In my previous role, our Angular app had grown to 4MB bundle with 200+ components in a single module. I led the migration to lazy-loaded feature modules with standalone components. We:
1. Audited all routes and identified 8 feature boundaries
2. Created a shared component library
3. Implemented lazy loading per feature
4. Added bundle budgets in CI to prevent regression
Result: Initial load dropped from 4MB to 800KB, TTI improved by 60%."

**Q26: How do you balance technical debt with feature delivery?**

**Sample Answer:**
- Maintain a tech debt backlog with severity ratings
- Allocate 20% of each sprint to tech debt
- Tie tech debt to business impact (e.g., "slow page = user churn")
- Refactor incrementally alongside feature work
- Use feature flags to ship refactors safely

**Q27: How do you handle disagreements with product/design teams?**

**Sample Answer:**
- Start with data: performance metrics, user analytics, accessibility scores
- Propose alternatives rather than just saying "no"
- Create quick prototypes to demonstrate technical constraints
- Find compromise that meets business goals within technical reality
- Document decisions for future reference

---

### Additional SailPoint Interview Questions

**Q28: How would you implement role-based UI rendering?**

```typescript
// Directive approach
@Directive({ selector: '[appRequiresRole]', standalone: true })
export class RequiresRoleDirective {
  private authService = inject(AuthService);
  
  @Input() set appRequiresRole(roles: string[]) {
    const userRoles = this.authService.getCurrentUserRoles();
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
  
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}
}

// Usage
<button *appRequiresRole="['ADMIN', 'CERT_MANAGER']">
  Start Certification Campaign
</button>

<app-admin-panel *appRequiresRole="['ADMIN']"></app-admin-panel>
```

**Q29: How would you handle real-time notifications in Angular?**

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private socket$ = webSocket<Notification>('wss://api.sailpoint.com/ws');
  private destroyRef = inject(DestroyRef);
  
  notifications$ = this.socket$.pipe(
    retry({ delay: 3000 }),  // Auto-reconnect
    scan((acc, notification) => [notification, ...acc].slice(0, 50), [] as Notification[]),
    shareReplay(1),
    takeUntilDestroyed(this.destroyRef)
  );
  
  unreadCount$ = this.notifications$.pipe(
    map(notifications => notifications.filter(n => !n.read).length)
  );
}

// Component
@Component({
  template: `
    <span class="badge">{{ unreadCount$ | async }}</span>
    <div *ngFor="let n of notifications$ | async">
      {{ n.message }} - {{ n.timestamp | date:'short' }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent {
  private notifService = inject(NotificationService);
  notifications$ = this.notifService.notifications$;
  unreadCount$ = this.notifService.unreadCount$;
}
```

**Q30: How would you implement a multi-step access request wizard?**

```typescript
// State management for wizard
interface WizardState {
  currentStep: number;
  steps: StepConfig[];
  formData: Partial<AccessRequest>;
  isValid: boolean;
}

@Injectable()
export class AccessRequestWizardService {
  private state = signal<WizardState>({
    currentStep: 0,
    steps: [
      { title: 'Select Application', component: SelectAppStep },
      { title: 'Choose Entitlements', component: EntitlementsStep },
      { title: 'Justification', component: JustificationStep },
      { title: 'Review & Submit', component: ReviewStep }
    ],
    formData: {},
    isValid: false
  });
  
  currentStep = computed(() => this.state().currentStep);
  currentStepConfig = computed(() => this.state().steps[this.state().currentStep]);
  isFirstStep = computed(() => this.state().currentStep === 0);
  isLastStep = computed(() => 
    this.state().currentStep === this.state().steps.length - 1
  );
  progress = computed(() => 
    ((this.state().currentStep + 1) / this.state().steps.length) * 100
  );
  
  next(stepData: Partial<AccessRequest>) {
    this.state.update(s => ({
      ...s,
      currentStep: Math.min(s.currentStep + 1, s.steps.length - 1),
      formData: { ...s.formData, ...stepData }
    }));
  }
  
  back() {
    this.state.update(s => ({
      ...s,
      currentStep: Math.max(s.currentStep - 1, 0)
    }));
  }
  
  submit(): Observable<AccessRequest> {
    return this.http.post<AccessRequest>(
      '/api/access-requests', 
      this.state().formData
    );
  }
}
```

---

## Quick Reference: Top 10 Things to Know for SailPoint Interview

```
1. OnPush Change Detection + Immutable data patterns
2. RxJS operators: switchMap, mergeMap, concatMap, exhaustMap
3. Memory leak prevention: async pipe, takeUntilDestroyed
4. Lazy loading: loadChildren, loadComponent, @defer
5. Signals vs RxJS: when to use each
6. Reactive Forms with dynamic validation
7. Route Guards (functional style, Angular 15+)
8. Virtual Scrolling for large datasets
9. NgRx or service-based state management
10. Enterprise architecture: Core/Shared/Feature module pattern
```

---

## Interview Process at SailPoint Pune (Reported)

```
Round 1: Online Assessment / Coding Round
  → Angular-specific coding problems
  → Data structures & algorithms

Round 2: Technical Interview 1
  → Angular deep dive (change detection, RxJS, DI)
  → TypeScript advanced concepts
  → Live coding / whiteboard

Round 3: Technical Interview 2 (Staff level)
  → System design / Architecture
  → Performance optimization scenarios
  → Code review exercise

Round 4: Hiring Manager / Behavioral
  → Leadership, mentoring, conflict resolution
  → Past project deep dive
  → Culture fit

Difficulty: Rated "Difficult" by most candidates on Glassdoor
```

---

*Sources: [GreatFrontEnd](https://www.greatfrontend.com/blog/angular-experienced-interview-questions), [Talent500](https://talent500.com/blog/top-angular-interview-questions-experienced/), [Glassdoor SailPoint Reviews](https://www.glassdoor.com/Interview/SailPoint-Technologies-Interview-Questions-E449696.htm), [BuiltIn SailPoint Jobs](https://builtin.com/job/senior-staff-ui-engineer/8660257). Content was rephrased for compliance with licensing restrictions.*
