# SailPoint — Senior Staff UI Engineer Interview Prep Guide
## Role: R012532 | Pune, India | Identity Product Engineering

> Based on: JD analysis + public interview reports (Glassdoor, Indeed, Blind, interviewquery.com) + SailPoint Engineering blog + community data

---

## 1. Interview Process Overview

### What People Report (Difficulty: 7/10)

Based on aggregated data from Indeed, Glassdoor, and Blind for SailPoint engineering roles:

| Round | Format | Duration | Focus |
|-------|--------|----------|-------|
| R0 | HR Screening (Phone/Video) | 30 min | Background, salary, availability |
| R1 | Technical Phone Screen | 45–60 min | JS/Angular fundamentals, 1 coding problem |
| R2 | Deep Technical Round | 60–90 min | Angular architecture, RxJS, system design |
| R3 | Coding Round | 60 min | DSA / problem solving (medium difficulty) |
| R4 | Cross-functional / Behavioral | 45–60 min | Leadership, collaboration, L3 support scenarios |
| R5 | Hiring Manager / Bar Raiser | 45 min | Culture fit, vision, long-term thinking |

**Key data points from Indeed:**
- Process takes ~1 month end-to-end
- 54% of candidates got in via employee referral
- Rated "difficult" by most respondents
- 50% felt more excited to work there after interviewing

**SailPoint-specific context:**
- They are actively migrating from **ExtJS → AngularJS → Angular** (confirmed via SailPoint Engineering blog)
- Their internal component library is called **"Armada"** — built on Angular
- They use **Java/Groovy** on the backend — expect some Java questions
- The Pune team works with US engineers — expect questions about async collaboration

---

## 2. What the Interviewer Expects at "Senior Staff" Level

This is NOT a junior/mid-level role. The bar is high. Interviewers will probe for:

- **Depth over breadth** — don't just name things, explain trade-offs
- **Production experience** — "have you actually debugged this in a real app?"
- **Ownership mindset** — L3 support escalations, customer-facing debugging
- **Architecture thinking** — "how would you design this for 10x scale?"
- **Legacy code empathy** — they still have ExtJS code; they want someone who can work with it AND modernize it
- **Communication** — you'll work with US teams; clarity matters

---

## 3. Topic-by-Topic Prep Checklist

### ✅ TIER 1 — Must Know Cold (Highest Probability)

#### Angular (Core of the Role)
- [ ] Component lifecycle hooks — order, use cases, gotchas
- [ ] Change Detection: Default vs OnPush — when and why
- [ ] RxJS: switchMap vs mergeMap vs concatMap vs exhaustMap
- [ ] Memory leak prevention: async pipe, takeUntilDestroyed, takeUntil
- [ ] Angular DI: injector hierarchy, InjectionToken, inject()
- [ ] Reactive Forms: FormGroup, FormBuilder, custom validators, async validators
- [ ] Route Guards: CanActivate, CanDeactivate, Resolvers
- [ ] HTTP Interceptors: auth token injection, error handling, retry logic
- [ ] Standalone components vs NgModule — migration strategy
- [ ] Performance: virtual scrolling, trackBy, OnPush, lazy loading

#### JavaScript / TypeScript
- [ ] Event loop, microtasks vs macrotasks (output prediction questions)
- [ ] Closures, scope chain, var/let/const in loops
- [ ] Promises: all, allSettled, race, any — differences with examples
- [ ] async/await error handling patterns
- [ ] Debounce and throttle — implement from scratch
- [ ] Deep clone vs shallow clone — structuredClone, JSON pitfalls
- [ ] TypeScript generics with constraints
- [ ] TypeScript utility types: Partial, Pick, Omit, Record, Exclude, ReturnType

#### REST API & HTTP
- [ ] REST principles, HTTP methods, status codes
- [ ] Handling pagination (SailPoint V3 API uses offset/limit)
- [ ] Error handling strategies in Angular HttpClient
- [ ] CORS — what it is, how to handle in Angular

---

### ✅ TIER 2 — Very Likely (Prepare Well)

#### System Design (Frontend)
- [ ] Design a search-as-you-type component (debounce, cancel, loading states)
- [ ] Design a data table with 10,000+ rows (virtual scroll, pagination, sorting)
- [ ] Design a notification/toast system
- [ ] Design a role-based access control UI
- [ ] Design a multi-step wizard form (access request workflow)

#### Java (Mentioned in JD — Expect Basic Questions)
- [ ] OOP principles: encapsulation, inheritance, polymorphism, abstraction
- [ ] Abstract class vs Interface
- [ ] Collections: List, Map, Set — when to use which
- [ ] Exception handling: checked vs unchecked
- [ ] Basic REST with Spring Boot (annotations: @RestController, @GetMapping, etc.)
- [ ] Hibernate basics: ORM, lazy vs eager loading

#### Web Performance
- [ ] Core Web Vitals: LCP, FID/INP, CLS — what they measure
- [ ] Bundle size optimization: lazy loading, tree shaking, source-map-explorer
- [ ] Browser rendering pipeline: reflow vs repaint
- [ ] Caching strategies: HTTP cache headers, service workers

#### Security
- [ ] XSS — how Angular prevents it (DomSanitizer, template binding)
- [ ] CSRF — what it is, how to prevent
- [ ] Content Security Policy basics
- [ ] JWT — structure, storage (localStorage vs cookie), refresh token pattern

---

### ✅ TIER 3 — Good to Know (Differentiators)

- [ ] Angular Signals — signal(), computed(), effect(), toSignal()
- [ ] @defer blocks (Angular 17+) — deferred loading in templates
- [ ] Web Workers — offloading heavy computation
- [ ] LDAP / Active Directory basics (mentioned in JD)
- [ ] SQL basics: joins, indexes, query optimization
- [ ] Git workflows: branching strategies, rebase vs merge
- [ ] Unit testing: Jasmine/Jest, TestBed, mocking services
- [ ] SailPoint product knowledge: IdentityIQ vs IdentityNow, IGA concepts

---

## 4. High-Probability Interview Questions (With Detailed Answers)

### Angular Architecture

---

**Q: "Walk me through how you'd architect a large Angular enterprise app."**

**Detailed Answer:**

At the Senior Staff level, I'd structure the app around three core module categories and several cross-cutting concerns:

**1. Module Architecture (Core / Shared / Feature)**

```
src/
├── app/
│   ├── core/                  # Singleton services, guards, interceptors
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── auth.interceptor.ts
│   │   ├── api/
│   │   │   ├── api.service.ts
│   │   │   └── error-handler.interceptor.ts
│   │   └── core.module.ts     # imported ONCE in AppModule
│   ├── shared/                # Reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── data-table/
│   │   │   ├── search-bar/
│   │   │   └── toast/
│   │   ├── directives/
│   │   ├── pipes/
│   │   └── shared.module.ts   # imported in every feature module
│   ├── features/              # Lazy-loaded feature modules
│   │   ├── identity-list/
│   │   ├── access-request/
│   │   ├── certifications/
│   │   └── admin/
│   └── app-routing.module.ts
```

- **CoreModule**: Imported once in `AppModule`. Contains singleton services (AuthService, LoggingService), HTTP interceptors, route guards. Use `@Injectable({ providedIn: 'root' })` for tree-shakable singletons.
- **SharedModule**: Imported in every feature module. Contains reusable dumb/presentational components, pipes, directives. In SailPoint's case, this is essentially what **Armada** does — a shared component library across IdentityNow, IdentityAI, and File Access Manager.
- **Feature Modules**: Each feature is a lazy-loaded module with its own routing. This keeps the initial bundle small.

**2. Smart/Dumb Component Pattern**

```typescript
// SMART (Container) Component — knows about services, state
@Component({
  selector: 'app-identity-list-page',
  template: `
    <app-search-bar (search)="onSearch($event)"></app-search-bar>
    <app-identity-table
      [identities]="identities$ | async"
      [loading]="loading$ | async"
      (sort)="onSort($event)"
      (pageChange)="onPageChange($event)">
    </app-identity-table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentityListPageComponent {
  identities$ = this.store.select(selectIdentities);
  loading$ = this.store.select(selectLoading);

  constructor(private store: Store) {}

  onSearch(term: string) { this.store.dispatch(searchIdentities({ term })); }
  onSort(sort: SortEvent) { this.store.dispatch(sortIdentities({ sort })); }
  onPageChange(page: number) { this.store.dispatch(loadPage({ page })); }
}

// DUMB (Presentational) Component — pure inputs/outputs, no service injection
@Component({
  selector: 'app-identity-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class IdentityTableComponent {
  @Input() identities: Identity[] = [];
  @Input() loading = false;
  @Output() sort = new EventEmitter<SortEvent>();
  @Output() pageChange = new EventEmitter<number>();
}
```

**Why this matters**: Dumb components are easy to test (no TestBed needed for most cases), reusable, and work perfectly with OnPush change detection.

**3. State Management Strategy**

For a SailPoint-scale app, I'd evaluate based on complexity:

| Complexity | Solution | When |
|-----------|----------|------|
| Simple | BehaviorSubject services | Small feature, local state |
| Medium | Component Store (NgRx) | Feature-level state |
| Complex | NgRx Store + Effects | App-wide state, complex async flows |

```typescript
// Simple approach — BehaviorSubject service
@Injectable({ providedIn: 'root' })
export class IdentityStateService {
  private identitiesSubject = new BehaviorSubject<Identity[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  identities$ = this.identitiesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  loadIdentities(params: SearchParams): void {
    this.loadingSubject.next(true);
    this.api.getIdentities(params).pipe(
      finalize(() => this.loadingSubject.next(false))
    ).subscribe(result => this.identitiesSubject.next(result));
  }
}
```

**4. Cross-Cutting Concerns**

- **HTTP Interceptors**: Chain of responsibility — auth token injection → error handling → retry logic → logging
- **Route Guards**: `CanActivate` for auth, `CanDeactivate` for unsaved changes, `Resolve` for pre-fetching data
- **Error Handling**: Global `ErrorHandler` for uncaught errors, interceptor for HTTP errors, toast notifications for user-facing errors
- **Lazy Loading**: Every feature module loaded via `loadChildren` in routes

**SailPoint-specific angle**: Mention that Armada serves as the shared component library, and the architecture must support the ongoing ExtJS → Angular migration in IdentityIQ, meaning some features may need to coexist with legacy code via iframes or web components.

---

**Q: "How does change detection work and how do you optimize it?"**

**Detailed Answer:**

**How Change Detection Works — The Full Picture:**

Angular's change detection is powered by **Zone.js**, which monkey-patches all async browser APIs (setTimeout, addEventListener, XMLHttpRequest, Promise.then, etc.). Here's the flow:

```
User clicks button
  → Zone.js intercepts the event
    → Calls ApplicationRef.tick()
      → Starts from root component
        → Traverses ENTIRE component tree (top-down, depth-first)
          → For each component: checks all template bindings
            → If binding value changed → updates DOM
```

**Step-by-step internals:**

1. **Zone.js patches async APIs**: When Angular bootstraps, Zone.js wraps every async operation. This is how Angular "knows" something happened.

2. **NgZone triggers change detection**: When an async operation completes inside Angular's zone, `NgZone` emits an `onMicrotaskEmpty` event.

3. **ApplicationRef.tick()**: This is the entry point. It calls `detectChanges()` on the root component's `ChangeDetectorRef`.

4. **Tree traversal**: Angular walks the component tree top-down. For each component, it compares the current template expression values with the previous values (dirty checking).

5. **DOM update**: If a value changed, Angular updates the corresponding DOM node.

```typescript
// Simplified internal flow
class ApplicationRef {
  tick(): void {
    for (const view of this._views) {
      view.detectChanges();  // starts the tree walk
    }
  }
}
```

**Default vs OnPush — The Critical Difference:**

| Aspect | Default | OnPush |
|--------|---------|--------|
| When checked | Every CD cycle (any async event) | Only when: @Input ref changes, event from component/child, async pipe emits, manual trigger |
| Tree traversal | Checks this component + all children | Skips this subtree unless triggered |
| Performance | O(n) every time | O(1) for skipped subtrees |

```typescript
// Default — checked on EVERY change detection cycle
@Component({
  selector: 'app-user-card',
  template: `<p>{{ user.name }}</p>`
})
export class UserCardComponent {
  @Input() user: User;
}

// OnPush — only checked when input REFERENCE changes
@Component({
  selector: 'app-user-card',
  template: `<p>{{ user.name }}</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush  // ← KEY
})
export class UserCardComponent {
  @Input() user: User;
}
```

**Critical gotcha with OnPush**: Mutating an object won't trigger CD because the reference hasn't changed:

```typescript
// ❌ WON'T trigger OnPush — same reference
this.user.name = 'New Name';

// ✅ WILL trigger OnPush — new reference
this.user = { ...this.user, name: 'New Name' };
```

**Optimization Techniques (ordered by impact):**

**1. OnPush + Immutable Data**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngFor="let item of items; trackBy: trackById">
      {{ item.name }}
    </div>
  `
})
export class ListComponent {
  @Input() items: Item[];
  trackById(index: number, item: Item): string { return item.id; }
}
```

**2. Async Pipe (auto-subscribes, auto-unsubscribes, triggers CD)**
```typescript
// ❌ BAD — manual subscribe, must manage lifecycle
export class BadComponent implements OnInit, OnDestroy {
  users: User[];
  private sub: Subscription;

  ngOnInit() {
    this.sub = this.userService.users$.subscribe(u => this.users = u);
  }
  ngOnDestroy() { this.sub.unsubscribe(); }
}

// ✅ GOOD — async pipe handles everything
@Component({
  template: `<div *ngFor="let user of users$ | async">{{ user.name }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodComponent {
  users$ = this.userService.users$;
  constructor(private userService: UserService) {}
}
```

**3. Avoid Method Calls in Templates**
```html
<!-- ❌ BAD — getFullName() called on EVERY CD cycle -->
<p>{{ getFullName(user) }}</p>

<!-- ✅ GOOD — pure pipe, cached by Angular -->
<p>{{ user | fullName }}</p>
```

```typescript
@Pipe({ name: 'fullName', pure: true })
export class FullNamePipe implements PipeTransform {
  transform(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }
}
```

**4. trackBy for ngFor**
```typescript
// Without trackBy: Angular destroys and recreates ALL DOM nodes on change
// With trackBy: Angular only updates changed items

trackById(index: number, item: Identity): string {
  return item.id;  // stable unique identifier
}
```

**5. ChangeDetectorRef.detach() for Real-Time Widgets**
```typescript
// For components that receive high-frequency updates (WebSocket, live dashboard)
@Component({ ... })
export class LiveMetricsComponent implements OnInit {
  constructor(private cdr: ChangeDetectorRef) {
    this.cdr.detach();  // remove from CD tree entirely
  }

  ngOnInit() {
    this.metricsService.stream$.pipe(
      bufferTime(1000)  // batch updates every 1 second
    ).subscribe(batch => {
      this.metrics = batch[batch.length - 1];  // latest value
      this.cdr.detectChanges();  // manually trigger CD
    });
  }
}
```

**6. NgZone.runOutsideAngular() for Non-UI Work**
```typescript
constructor(private ngZone: NgZone) {}

startPolling() {
  this.ngZone.runOutsideAngular(() => {
    // This won't trigger change detection
    setInterval(() => {
      this.checkForUpdates().then(hasUpdates => {
        if (hasUpdates) {
          this.ngZone.run(() => {
            // Only trigger CD when there's actually something to update
            this.refreshData();
          });
        }
      });
    }, 5000);
  });
}
```

---

**Q: "You have a component that re-renders too often. How do you debug and fix it?"**

**Detailed Answer:**

**Step 1: Identify the Problem — Angular DevTools Profiler**

Open Angular DevTools → Profiler tab → click "Start recording" → interact with the app → stop recording. The profiler shows:
- Which components were checked in each CD cycle
- How long each component's CD took
- What triggered the CD cycle

```
// What you'll see in the profiler:
CD Cycle #1 (triggered by: click event)
  ├── AppComponent (0.2ms)
  ├── HeaderComponent (0.1ms)
  ├── IdentityListComponent (15ms) ← 🔴 SLOW
  │   ├── IdentityRowComponent x 500 (12ms) ← 🔴 RE-RENDERED ALL ROWS
  │   └── PaginationComponent (0.1ms)
  └── FooterComponent (0.1ms)
```

**Step 2: Systematic Diagnosis Checklist**

```
□ Is the component using OnPush?
  → If no: add ChangeDetectionStrategy.OnPush
  → If yes: check what's triggering it

□ Are there method calls in the template?
  → {{ getTotal() }} is called every CD cycle
  → Replace with pure pipe or pre-computed property

□ Is ngFor missing trackBy?
  → Without trackBy, entire list re-renders on any change
  → Add trackBy function returning stable ID

□ Are @Input objects being mutated instead of replaced?
  → Mutation doesn't trigger OnPush
  → Use spread operator or immutable patterns

□ Is there an impure pipe?
  → @Pipe({ pure: false }) runs on every CD cycle
  → Make it pure or move logic to component

□ Are there unnecessary subscriptions triggering CD?
  → Each emission inside NgZone triggers CD
  → Use runOutsideAngular for non-UI subscriptions

□ Is a parent component causing cascading re-renders?
  → Parent re-render checks all Default children
  → Make parent OnPush too
```

**Step 3: Fix — Real Example**

```typescript
// BEFORE — re-renders too often
@Component({
  selector: 'app-identity-list',
  template: `
    <input (input)="onSearch($event.target.value)">
    <div *ngFor="let identity of filteredIdentities()">
      <app-identity-card
        [identity]="identity"
        [permissions]="getPermissions(identity.id)">
      </app-identity-card>
    </div>
    <p>Total: {{ getTotal() }}</p>
  `
})
export class IdentityListComponent {
  identities: Identity[] = [];

  filteredIdentities() { /* called every CD cycle */ }
  getPermissions(id: string) { /* called every CD cycle per item */ }
  getTotal() { /* called every CD cycle */ }
}

// AFTER — optimized
@Component({
  selector: 'app-identity-list',
  template: `
    <input (input)="onSearch($event.target.value)">
    <div *ngFor="let identity of filteredIdentities$ | async; trackBy: trackById">
      <app-identity-card
        [identity]="identity"
        [permissions]="permissionsMap[identity.id]">
      </app-identity-card>
    </div>
    <p>Total: {{ total$ | async }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush  // ← Added
})
export class IdentityListComponent {
  private searchTerm$ = new BehaviorSubject<string>('');

  filteredIdentities$ = combineLatest([
    this.identityService.identities$,
    this.searchTerm$.pipe(debounceTime(300))
  ]).pipe(
    map(([identities, term]) => identities.filter(i =>
      i.name.toLowerCase().includes(term.toLowerCase())
    ))
  );

  total$ = this.filteredIdentities$.pipe(map(list => list.length));
  permissionsMap: Record<string, Permission[]> = {};  // pre-computed

  trackById(index: number, identity: Identity): string {
    return identity.id;
  }
}
```

---

**Q: "Explain ViewEncapsulation in Angular. What are the different modes and when would you use each?"**

**Detailed Answer:**

ViewEncapsulation controls how Angular scopes CSS styles to a component, preventing styles from leaking in or out.

**Three Modes:**

| Mode | How It Works | Use Case |
|------|-------------|----------|
| `Emulated` (default) | Angular adds unique attributes to elements and rewrites CSS selectors | 95% of components |
| `ShadowDom` | Uses native browser Shadow DOM | Web components, strict isolation |
| `None` | No encapsulation — styles are global | Global theme overrides, legacy integration |

**1. ViewEncapsulation.Emulated (Default)**

Angular adds a unique attribute like `_ngcontent-abc-123` to every element in the component and rewrites your CSS to include that attribute:

```typescript
@Component({
  selector: 'app-user-card',
  template: `<div class="card"><h2>{{ name }}</h2></div>`,
  styles: [`
    .card { border: 1px solid #ccc; padding: 16px; }
    h2 { color: navy; }
  `],
  encapsulation: ViewEncapsulation.Emulated  // this is the default
})
export class UserCardComponent {
  @Input() name: string;
}
```

**What Angular generates in the DOM:**
```html
<app-user-card _nghost-abc-123>
  <div _ngcontent-abc-123 class="card">
    <h2 _ngcontent-abc-123>John</h2>
  </div>
</app-user-card>
```

**What Angular generates for CSS:**
```css
.card[_ngcontent-abc-123] { border: 1px solid #ccc; padding: 16px; }
h2[_ngcontent-abc-123] { color: navy; }
```

The `h2` style only applies to `<h2>` tags inside THIS component — not any other `<h2>` in the app.

**2. ViewEncapsulation.ShadowDom**

Uses the browser's native Shadow DOM API. Styles are truly isolated — no leaking in or out.

```typescript
@Component({
  selector: 'app-isolated-widget',
  template: `<p>I'm in a shadow DOM</p>`,
  styles: [`p { color: red; font-size: 24px; }`],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class IsolatedWidgetComponent {}
```

**What the DOM looks like:**
```html
<app-isolated-widget>
  #shadow-root (open)
    <style>p { color: red; font-size: 24px; }</style>
    <p>I'm in a shadow DOM</p>
</app-isolated-widget>
```

**When to use**: Building Angular Elements (web components) that will be embedded in non-Angular apps. Global styles (like your CSS framework) won't penetrate the shadow boundary — you must explicitly use CSS custom properties (variables) for theming.

**Gotcha**: `::ng-deep` doesn't work with ShadowDom. Use CSS custom properties instead:

```css
/* Parent app sets the variable */
:root { --brand-color: #0066cc; }

/* Inside ShadowDom component — reads the variable */
p { color: var(--brand-color, navy); }
```

**3. ViewEncapsulation.None**

No encapsulation at all. Styles defined in this component become global — they affect the entire application.

```typescript
@Component({
  selector: 'app-global-theme',
  template: `<ng-content></ng-content>`,
  styles: [`
    body { font-family: 'Inter', sans-serif; }
    .btn-primary { background: #0066cc; color: white; }
  `],
  encapsulation: ViewEncapsulation.None
})
export class GlobalThemeComponent {}
```

**When to use**: Applying global theme overrides, styling third-party components that don't expose enough CSS hooks, or during legacy ExtJS → Angular migration where you need styles to cross component boundaries.

**⚠️ Danger**: Styles leak everywhere. Name your classes carefully or use BEM naming to avoid collisions.

**::ng-deep (Deprecated but Still Used)**

```css
/* Pierces child component encapsulation */
:host ::ng-deep .mat-form-field {
  width: 100%;
}
```

`::ng-deep` is deprecated but has no replacement yet. The Angular team recommends using CSS custom properties for theming. In practice, most enterprise apps still use `::ng-deep` for overriding library component styles.

**SailPoint context**: When migrating ExtJS components to Angular, `ViewEncapsulation.None` might be temporarily needed so that existing global CSS still applies to the new Angular components during the transition period.

---

### RxJS

---

**Q: "When would you use switchMap vs exhaustMap?"**

**Detailed Answer:**

These are the four flattening operators — they all take an inner Observable and flatten it, but differ in how they handle concurrency:

| Operator | Behavior | Real-World Use Case |
|----------|----------|-------------------|
| `switchMap` | Cancels previous inner Observable, subscribes to new one | Search typeahead, autocomplete |
| `mergeMap` | Runs all inner Observables concurrently (no cancellation) | Parallel file uploads, logging |
| `concatMap` | Queues inner Observables, runs one at a time in order | Sequential form saves, ordered API calls |
| `exhaustMap` | Ignores new emissions while inner Observable is active | Login button, submit button |

**switchMap — "Cancel and switch to latest"**

```typescript
// Search typeahead — cancel previous API call when user types new character
this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  filter(term => term.length >= 2),
  switchMap(term => this.identityService.search(term))
  // If user types "Joh" then "John" quickly:
  // - API call for "Joh" is CANCELLED
  // - Only API call for "John" completes
).subscribe(results => this.results = results);
```

**Why switchMap here**: You only care about the latest search term. Previous results are stale. Cancelling in-flight requests saves bandwidth and prevents race conditions (where "Joh" results arrive after "John" results).

**exhaustMap — "Ignore while busy"**

```typescript
// Login button — ignore rapid clicks while login request is in flight
this.loginClick$.pipe(
  exhaustMap(() => this.authService.login(this.credentials))
  // User clicks login 5 times rapidly:
  // - First click triggers API call
  // - Clicks 2-5 are IGNORED (not queued, not cancelled — just dropped)
  // - After first call completes, next click would work
).subscribe(response => this.router.navigate(['/dashboard']));
```

**Why exhaustMap here**: You don't want duplicate login requests. Unlike `switchMap` (which would cancel and restart), `exhaustMap` lets the first request finish undisturbed.

**mergeMap — "Run all in parallel"**

```typescript
// Upload multiple files simultaneously
this.filesToUpload$.pipe(
  mergeMap(file => this.uploadService.upload(file), 3)  // max 3 concurrent
  // All uploads run in parallel (up to concurrency limit)
  // No cancellation, no queuing
).subscribe(result => this.uploadedFiles.push(result));
```

**concatMap — "One at a time, in order"**

```typescript
// Save form steps sequentially — step 2 must wait for step 1
this.saveActions$.pipe(
  concatMap(action => this.api.save(action))
  // If 3 saves are triggered:
  // - Save 1 starts immediately
  // - Save 2 waits for Save 1 to complete
  // - Save 3 waits for Save 2 to complete
  // Order is guaranteed
).subscribe();
```

**Decision Matrix for Interviews:**

```
"Should I cancel the previous?" → YES → switchMap
"Should I ignore new while busy?" → YES → exhaustMap
"Should I run all in parallel?" → YES → mergeMap
"Must they run in order?" → YES → concatMap
```

---

**Q: "How do you prevent memory leaks in Angular?"**

**Detailed Answer:**

Memory leaks in Angular almost always come from unsubscribed Observables. Here are the strategies, ordered from best to worst:

**1. Async Pipe (Best — Zero Boilerplate)**

```typescript
@Component({
  template: `
    <div *ngFor="let user of users$ | async">{{ user.name }}</div>
    <p *ngIf="loading$ | async">Loading...</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  users$ = this.userService.getUsers();
  loading$ = this.userService.loading$;
  constructor(private userService: UserService) {}
  // No ngOnDestroy needed — async pipe auto-unsubscribes
}
```

**Why it's best**: Auto-subscribes on init, auto-unsubscribes on destroy, triggers OnPush change detection. Zero manual lifecycle management.

**2. takeUntilDestroyed() (Angular 16+ — Clean and Modern)**

```typescript
@Component({ ... })
export class DashboardComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.metricsService.realTimeUpdates$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => this.updateChart(data));
  }
}

// Even cleaner — in constructor or field initializer (injection context)
@Component({ ... })
export class DashboardComponent {
  constructor() {
    this.metricsService.realTimeUpdates$.pipe(
      takeUntilDestroyed()  // no argument needed in injection context
    ).subscribe(data => this.updateChart(data));
  }
}
```

**3. takeUntil with destroy$ Subject (Pre-Angular 16)**

```typescript
@Component({ ... })
export class LegacyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.dataService.stream$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => this.process(data));

    this.otherService.events$.pipe(
      takeUntil(this.destroy$)  // reuse same destroy$ for all subscriptions
    ).subscribe(event => this.handle(event));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**4. Manual Unsubscribe (Last Resort)**

```typescript
@Component({ ... })
export class ManualComponent implements OnDestroy {
  private subs: Subscription[] = [];

  ngOnInit() {
    this.subs.push(
      this.service.data$.subscribe(d => this.data = d),
      this.service.events$.subscribe(e => this.handle(e))
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
}
```

**Common Leak Sources to Watch For:**

```typescript
// ❌ LEAK — Router events never complete
this.router.events.subscribe(event => { ... });

// ❌ LEAK — FormControl valueChanges never complete
this.searchControl.valueChanges.subscribe(value => { ... });

// ❌ LEAK — interval never completes
interval(1000).subscribe(() => { ... });

// ✅ SAFE — HttpClient requests complete after one emission
this.http.get('/api/users').subscribe(users => { ... });
// (but still good practice to use takeUntil for consistency)

// ✅ SAFE — ActivatedRoute.params auto-cleaned by Angular
this.route.params.subscribe(params => { ... });
```

**How to Detect Leaks:**

1. Chrome DevTools → Memory tab → Take heap snapshot → Navigate away → Take another snapshot → Compare
2. Look for detached DOM nodes and growing subscription counts
3. Use `tap(() => console.log('still alive'))` to verify subscriptions are cleaned up

---

**Q: "Explain BehaviorSubject vs ReplaySubject vs Subject vs AsyncSubject."**

**Detailed Answer:**

| Subject Type | Initial Value | Late Subscribers Get | Completes |
|-------------|--------------|---------------------|-----------|
| `Subject` | None | Nothing (only future emissions) | When you call `.complete()` |
| `BehaviorSubject` | Required | Last emitted value | When you call `.complete()` |
| `ReplaySubject` | None | Last N values (configurable) | When you call `.complete()` |
| `AsyncSubject` | None | Only the LAST value, only after complete | Must complete to emit |

**Subject — Basic event bus**
```typescript
const subject = new Subject<string>();

subject.subscribe(v => console.log('A:', v));  // A subscribes
subject.next('hello');  // A: hello
subject.subscribe(v => console.log('B:', v));  // B subscribes (gets nothing)
subject.next('world');  // A: world, B: world
```
Use case: Event bus, component communication where you don't need history.

**BehaviorSubject — "Current value" pattern**
```typescript
const auth$ = new BehaviorSubject<User | null>(null);  // initial value required

auth$.subscribe(v => console.log('A:', v));  // A: null (gets initial value immediately)
auth$.next({ name: 'John' });  // A: { name: 'John' }
auth$.subscribe(v => console.log('B:', v));  // B: { name: 'John' } (gets current value)
auth$.getValue();  // { name: 'John' } — synchronous access to current value
```
Use case: Current auth state, current theme, current selected item — anything where "what's the current value?" matters.

**ReplaySubject — "History buffer" pattern**
```typescript
const chatHistory$ = new ReplaySubject<Message>(50);  // buffer last 50 messages

chatHistory$.next(msg1);
chatHistory$.next(msg2);
chatHistory$.next(msg3);

// Late subscriber gets all 3 messages replayed immediately
chatHistory$.subscribe(msg => console.log(msg));  // msg1, msg2, msg3
```
Use case: Chat history, audit log, replaying events for late-joining components.

**AsyncSubject — "Final value only"**
```typescript
const result$ = new AsyncSubject<number>();

result$.subscribe(v => console.log('A:', v));  // nothing yet
result$.next(1);   // nothing emitted
result$.next(2);   // nothing emitted
result$.next(3);   // nothing emitted
result$.complete(); // NOW: A: 3 (only the last value, only after complete)
```
Use case: Rarely used. Similar to a Promise — useful when you only care about the final result of a long computation.

---

### JavaScript

---

**Q: "What will this output?" (Event loop question)**

**Detailed Answer:**

```javascript
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```

**Output: A, D, C, B**

**Why — The Event Loop Execution Model:**

The JavaScript engine has one call stack and two task queues:

```
┌─────────────────────────────────────────────┐
│                 CALL STACK                   │
│  (synchronous code executes here)            │
└──────────────────┬──────────────────────────┘
                   │ When stack is empty,
                   │ check queues:
         ┌─────────▼──────────┐
         │  MICROTASK QUEUE   │  ← Priority 1 (drained completely)
         │  - Promise.then()  │
         │  - queueMicrotask()│
         │  - MutationObserver│
         └─────────┬──────────┘
                   │ Only when microtask queue is empty:
         ┌─────────▼──────────┐
         │  MACROTASK QUEUE   │  ← Priority 2 (one task per cycle)
         │  - setTimeout()    │
         │  - setInterval()   │
         │  - I/O callbacks   │
         │  - UI rendering    │
         └────────────────────┘
```

**Step-by-step execution:**

1. `console.log('A')` → sync → executes immediately → **prints A**
2. `setTimeout(cb, 0)` → schedules callback in macrotask queue → moves on
3. `Promise.resolve().then(cb)` → schedules callback in microtask queue → moves on
4. `console.log('D')` → sync → executes immediately → **prints D**
5. Call stack is now empty → check microtask queue first
6. Promise callback executes → **prints C**
7. Microtask queue empty → check macrotask queue
8. setTimeout callback executes → **prints B**

**Follow-up tricky variant they might ask:**

```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => {
  console.log('3');
  setTimeout(() => console.log('4'), 0);
  Promise.resolve().then(() => console.log('5'));
});
Promise.resolve().then(() => console.log('6'));
console.log('7');

// Output: 1, 7, 3, 6, 5, 2, 4
```

**Explanation:**
- Sync: 1, 7
- Microtask queue (drained completely): 3 (which schedules macrotask 4 and microtask 5), then 6, then 5 (microtask added during microtask processing)
- Macrotask queue: 2 (was scheduled first), then 4

**Key rule**: Microtask queue is drained completely (including microtasks added during microtask processing) before ANY macrotask runs.

---

**Q: "Implement debounce from scratch."**

**Detailed Answer:**

```javascript
// Basic debounce — trailing edge (fires after delay)
function debounce(fn, delay) {
  let timeoutId;

  return function (...args) {
    const context = this;  // preserve 'this' binding

    clearTimeout(timeoutId);  // cancel previous timer

    timeoutId = setTimeout(() => {
      fn.apply(context, args);  // call with correct context and args
    }, delay);
  };
}

// Usage
const searchInput = document.getElementById('search');
const handleSearch = debounce((event) => {
  console.log('API call with:', event.target.value);
}, 300);
searchInput.addEventListener('input', handleSearch);
```

**How it works:**
1. Every time the function is called, it clears the previous timer
2. Sets a new timer for `delay` ms
3. Only when the user stops calling for `delay` ms does the function actually execute
4. This means rapid calls (like typing) only trigger one execution after the user pauses

**Advanced version with leading + trailing edge + cancel:**

```javascript
function debounce(fn, delay, { leading = false, trailing = true } = {}) {
  let timeoutId;
  let lastArgs;
  let lastContext;

  function invokeFunc() {
    fn.apply(lastContext, lastArgs);
    lastArgs = lastContext = undefined;
  }

  function debounced(...args) {
    lastArgs = args;
    lastContext = this;
    const isFirstCall = timeoutId === undefined;

    clearTimeout(timeoutId);

    if (leading && isFirstCall) {
      invokeFunc();  // fire immediately on first call
    }

    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      if (trailing && lastArgs) {
        invokeFunc();  // fire after delay
      }
    }, delay);
  }

  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = lastArgs = lastContext = undefined;
  };

  return debounced;
}

// Leading edge: fires immediately, then ignores for 300ms
const onButtonClick = debounce(submitForm, 300, { leading: true, trailing: false });

// Trailing edge (default): fires 300ms after last call
const onSearchInput = debounce(search, 300);
```

**Throttle (bonus — they often ask both):**

```javascript
function throttle(fn, limit) {
  let inThrottle = false;

  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

// Difference:
// debounce: fires ONCE after user stops (e.g., search input)
// throttle: fires at most once per interval (e.g., scroll handler, resize)
```

---

**Q: "What's the difference between Promise.all and Promise.allSettled?"**

**Detailed Answer:**

```javascript
const p1 = Promise.resolve('User data');
const p2 = Promise.reject(new Error('API down'));
const p3 = Promise.resolve('Settings');
```

**Promise.all — Fails fast on first rejection**

```javascript
try {
  const results = await Promise.all([p1, p2, p3]);
  // NEVER REACHES HERE — p2 rejected
} catch (error) {
  console.log(error.message);  // "API down"
  // You don't know if p1 or p3 succeeded
}
```

Use when: All promises must succeed for the result to be useful (e.g., loading all required data for a page).

**Promise.allSettled — Waits for all, reports each result**

```javascript
const results = await Promise.allSettled([p1, p2, p3]);
console.log(results);
// [
//   { status: 'fulfilled', value: 'User data' },
//   { status: 'rejected', reason: Error('API down') },
//   { status: 'fulfilled', value: 'Settings' }
// ]

// You can process partial results
const succeeded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);
```

Use when: You want partial results even if some fail (e.g., dashboard widgets loading independently).

**Promise.race — First to settle wins**

```javascript
const result = await Promise.race([
  fetch('/api/data'),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
]);
// Whichever settles first (resolve OR reject) wins
```

Use when: Timeout patterns, fastest mirror selection.

**Promise.any — First to RESOLVE wins**

```javascript
try {
  const result = await Promise.any([
    fetch('https://cdn1.example.com/data'),
    fetch('https://cdn2.example.com/data'),
    fetch('https://cdn3.example.com/data')
  ]);
  // First successful response wins (rejections are ignored)
} catch (error) {
  // AggregateError — only thrown if ALL promises reject
  console.log(error.errors);  // array of all rejection reasons
}
```

Use when: Redundant sources, you just need one success.

**Comparison Table:**

| Method | Resolves When | Rejects When | Returns |
|--------|-------------|-------------|---------|
| `Promise.all` | All fulfill | Any rejects (fail-fast) | Array of values |
| `Promise.allSettled` | All settle | Never rejects | Array of {status, value/reason} |
| `Promise.race` | First settles | First settles (if rejection) | Single value |
| `Promise.any` | First fulfills | All reject | Single value / AggregateError |

**SailPoint context**: When loading a dashboard with identity stats, access request counts, and certification data — use `Promise.allSettled` so the dashboard still renders even if one API is down. Show the available widgets and an error state for the failed one.

---

**Q: "Explain closures and give a practical example."**

**Detailed Answer:**

A closure is a function that retains access to its lexical scope (the variables from its outer function) even after the outer function has returned.

```javascript
function createCounter(initialValue = 0) {
  let count = initialValue;  // this variable is "closed over"

  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = createCounter(10);
console.log(counter.getCount());  // 10
counter.increment();
counter.increment();
console.log(counter.getCount());  // 12

// 'count' is not accessible from outside — true encapsulation
// console.log(count);  // ReferenceError
```

**Classic Interview Trap — var in loops:**

```javascript
// ❌ BUG — all callbacks print 5
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 5, 5, 5, 5, 5
// Why: var is function-scoped, all closures share the same 'i'
// By the time setTimeout fires, the loop is done and i === 5

// ✅ FIX 1 — use let (block-scoped, creates new binding per iteration)
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2, 3, 4

// ✅ FIX 2 — IIFE creates a new scope per iteration
for (var i = 0; i < 5; i++) {
  ((j) => {
    setTimeout(() => console.log(j), 100);
  })(i);
}
// Output: 0, 1, 2, 3, 4
```

**Practical use cases:**
- Data privacy / encapsulation (module pattern)
- Function factories (createLogger, createValidator)
- Memoization / caching
- Partial application / currying
- Event handlers that need access to setup-time data

```javascript
// Memoization with closure
function memoize(fn) {
  const cache = new Map();  // closed over

  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((n) => {
  console.log('Computing...');
  return n * n;
});

expensiveCalc(5);  // Computing... 25
expensiveCalc(5);  // 25 (cached, no "Computing..." log)
```

---

### System Design (Frontend)

---

**Q: "Design a search bar that queries an API as the user types."**

**Detailed Answer:**

This is a classic SailPoint question — their identity search is core functionality.

**Architecture Overview:**

```
┌──────────────────────────────────────────────────────┐
│  SearchBarComponent (Smart)                          │
│  ┌────────────────────────────────────────────────┐  │
│  │  <input> with FormControl                      │  │
│  │  valueChanges                                  │  │
│  │    → debounceTime(300)                         │  │
│  │    → distinctUntilChanged()                    │  │
│  │    → filter(term => term.length >= 2)          │  │
│  │    → switchMap(term => api.search(term))       │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │  Results Dropdown                              │  │
│  │  - Loading spinner (while API in flight)       │  │
│  │  - Results list (keyboard navigable)           │  │
│  │  - Empty state ("No results for 'xyz'")        │  │
│  │  - Error state ("Search failed, try again")    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
@Component({
  selector: 'app-search-bar',
  template: `
    <div class="search-container" role="combobox"
         [attr.aria-expanded]="showDropdown"
         aria-haspopup="listbox">
      <input type="text"
             [formControl]="searchControl"
             placeholder="Search identities..."
             aria-label="Search identities"
             aria-autocomplete="list"
             [attr.aria-activedescendant]="activeDescendantId"
             (keydown)="onKeydown($event)">
      <span class="spinner" *ngIf="loading$ | async" aria-hidden="true"></span>
    </div>

    <ul *ngIf="showDropdown" role="listbox" class="results-dropdown"
        aria-live="polite">
      <li *ngFor="let result of results$ | async; let i = index; trackBy: trackById"
          role="option"
          [id]="'result-' + i"
          [class.active]="i === activeIndex"
          (click)="selectResult(result)"
          (mouseenter)="activeIndex = i">
        {{ result.name }} — {{ result.email }}
      </li>
      <li *ngIf="(results$ | async)?.length === 0 && !(loading$ | async)"
          class="empty-state">
        No results found
      </li>
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent implements OnInit {
  searchControl = new FormControl('');
  activeIndex = -1;
  showDropdown = false;

  private resultsSubject = new BehaviorSubject<Identity[]>([]);
  results$ = this.resultsSubject.asObservable();
  loading$ = new BehaviorSubject<boolean>(false);

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),              // wait 300ms after last keystroke
      distinctUntilChanged(),          // skip if same value
      tap(term => {
        this.showDropdown = term.length >= 2;
        if (term.length < 2) this.resultsSubject.next([]);
      }),
      filter(term => term.length >= 2),
      tap(() => this.loading$.next(true)),
      switchMap(term =>                // cancel previous request
        this.searchService.search(term).pipe(
          catchError(err => {
            console.error('Search failed:', err);
            return of([]);             // graceful degradation
          }),
          finalize(() => this.loading$.next(false))
        )
      ),
      takeUntilDestroyed()
    ).subscribe(results => this.resultsSubject.next(results));
  }

  onKeydown(event: KeyboardEvent) {
    const results = this.resultsSubject.getValue();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, results.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        break;
      case 'Enter':
        if (this.activeIndex >= 0) this.selectResult(results[this.activeIndex]);
        break;
      case 'Escape':
        this.showDropdown = false;
        break;
    }
  }

  trackById(index: number, item: Identity): string { return item.id; }
}
```

**Key Design Decisions to Discuss:**

1. **debounceTime(300)**: Don't hit API on every keystroke. 300ms is the sweet spot — fast enough to feel responsive, slow enough to avoid excessive API calls.

2. **switchMap**: Cancels in-flight requests when user types more. Prevents race conditions where stale results arrive after fresh ones.

3. **distinctUntilChanged**: If user types "John", deletes "n", types "n" again — don't re-fetch.

4. **Accessibility**: `role="combobox"`, `aria-live="polite"` for screen readers, keyboard navigation (arrow keys, Enter, Escape), `aria-activedescendant` for active item.

5. **Caching (bonus)**: Add a simple LRU cache for recent searches:

```typescript
// In the search service
private cache = new Map<string, { data: Identity[], timestamp: number }>();
private CACHE_TTL = 60000; // 1 minute

search(term: string): Observable<Identity[]> {
  const cached = this.cache.get(term);
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
    return of(cached.data);
  }
  return this.http.get<Identity[]>(`/api/identities?q=${term}`).pipe(
    tap(data => this.cache.set(term, { data, timestamp: Date.now() }))
  );
}
```

---

**Q: "How would you handle a table with 50,000 identity records?"**

**Detailed Answer:**

**The Problem**: Rendering 50,000 DOM nodes kills performance. The browser can handle ~1,000-2,000 DOM nodes smoothly. Beyond that, scrolling becomes janky, memory usage spikes, and initial render takes seconds.

**Solution Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│  Strategy 1: Server-Side Pagination (Preferred)         │
│  - API returns 25-50 records per page                   │
│  - Total count in response header/body                  │
│  - Client renders only current page                     │
│  - SailPoint V3 API uses offset/limit pattern           │
│                                                         │
│  Strategy 2: Virtual Scrolling (When all data is local) │
│  - CDK VirtualScrollViewport                            │
│  - Only renders visible rows (~20-30 in viewport)       │
│  - Recycles DOM nodes as user scrolls                   │
│  - 50,000 items but only ~30 DOM nodes at any time      │
└─────────────────────────────────────────────────────────┘
```

**Strategy 1: Server-Side Pagination (SailPoint Pattern)**

```typescript
// Service — matches SailPoint V3 API pattern
@Injectable({ providedIn: 'root' })
export class IdentityService {
  getIdentities(params: {
    offset: number;
    limit: number;
    sorters?: string;
    filters?: string;
  }): Observable<PaginatedResponse<Identity>> {
    return this.http.get<PaginatedResponse<Identity>>('/v3/identities', {
      params: {
        offset: params.offset.toString(),
        limit: params.limit.toString(),
        ...(params.sorters && { sorters: params.sorters }),
        ...(params.filters && { filters: params.filters })
      }
    });
  }
}

// Component
@Component({
  template: `
    <app-search-bar (search)="onSearch($event)"></app-search-bar>

    <table>
      <thead>
        <tr>
          <th (click)="onSort('name')" [class.sorted]="sortField === 'name'">
            Name {{ sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
          </th>
          <th (click)="onSort('email')">Email</th>
          <th (click)="onSort('status')">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let identity of identities$ | async; trackBy: trackById">
          <td>{{ identity.name }}</td>
          <td>{{ identity.email }}</td>
          <td>{{ identity.status }}</td>
        </tr>
      </tbody>
    </table>

    <app-pagination
      [totalCount]="totalCount$ | async"
      [pageSize]="pageSize"
      [currentPage]="currentPage"
      (pageChange)="onPageChange($event)">
    </app-pagination>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentityTableComponent {
  pageSize = 25;
  currentPage = 0;
  sortField = 'name';
  sortDir: 'asc' | 'desc' = 'asc';

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadData();
  }

  onSort(field: string) {
    this.sortDir = this.sortField === field && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortField = field;
    this.currentPage = 0;  // reset to first page on sort
    this.loadData();
  }

  private loadData() {
    this.identityService.getIdentities({
      offset: this.currentPage * this.pageSize,
      limit: this.pageSize,
      sorters: `${this.sortDir === 'desc' ? '-' : ''}${this.sortField}`
    }).subscribe(response => {
      this.identitiesSubject.next(response.items);
      this.totalCountSubject.next(response.count);
    });
  }
}
```

**Strategy 2: Virtual Scrolling (CDK)**

```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="48" class="viewport">
      <div *cdkVirtualFor="let identity of identities; trackBy: trackById"
           class="row">
        {{ identity.name }} — {{ identity.email }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport { height: 600px; }
    .row { height: 48px; }
  `]
})
export class VirtualTableComponent {
  identities: Identity[] = [];  // all 50,000 loaded
  trackById(i: number, item: Identity) { return item.id; }
}
```

**Performance Optimizations to Mention:**

| Technique | Impact | How |
|-----------|--------|-----|
| `trackBy` | Prevents DOM recreation | Return stable ID |
| `OnPush` | Skips unnecessary CD | Immutable data + async pipe |
| Debounced search/filter | Reduces API calls | `debounceTime(300)` |
| Web Worker for sorting | Unblocks main thread | `new Worker()` for client-side sort of large datasets |
| Skeleton loading | Better perceived performance | Show placeholder rows while loading |

---

**Q: "How would you implement role-based UI in Angular?"**

**Detailed Answer:**

This is directly relevant to SailPoint — their entire product is about identity governance and access control.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│  1. PermissionService (Source of truth)                  │
│     - Stores current user's roles/permissions            │
│     - BehaviorSubject for reactive updates               │
│                                                          │
│  2. *appHasPermission Directive (Template-level control) │
│     - Structural directive for showing/hiding UI         │
│                                                          │
│  3. AuthGuard (Route-level control)                      │
│     - Prevents navigation to unauthorized routes         │
│                                                          │
│  4. HTTP Interceptor (API-level control)                 │
│     - Handles 403 responses gracefully                   │
└─────────────────────────────────────────────────────────┘
```

**1. Permission Service:**

```typescript
export interface UserPermissions {
  roles: string[];           // ['admin', 'certifier', 'helpdesk']
  permissions: string[];     // ['identity.read', 'identity.write', 'cert.approve']
  isSuperAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<UserPermissions | null>(null);
  permissions$ = this.permissionsSubject.asObservable();

  loadPermissions(): Observable<UserPermissions> {
    return this.http.get<UserPermissions>('/api/me/permissions').pipe(
      tap(perms => this.permissionsSubject.next(perms))
    );
  }

  hasPermission(permission: string): boolean {
    const perms = this.permissionsSubject.getValue();
    if (!perms) return false;
    if (perms.isSuperAdmin) return true;
    return perms.permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    const perms = this.permissionsSubject.getValue();
    return perms?.roles.includes(role) ?? false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }
}
```

**2. Structural Directive:**

```typescript
@Directive({ selector: '[appHasPermission]' })
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input('appHasPermission') permission: string | string[];
  private destroy$ = new Subject<void>();
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.permissionService.permissions$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.updateView());
  }

  private updateView() {
    const permissions = Array.isArray(this.permission)
      ? this.permission : [this.permission];
    const hasAccess = this.permissionService.hasAnyPermission(permissions);

    if (hasAccess && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Usage in templates:**

```html
<!-- Single permission -->
<button *appHasPermission="'identity.write'" (click)="editIdentity()">
  Edit Identity
</button>

<!-- Multiple permissions (any) -->
<div *appHasPermission="['cert.approve', 'cert.revoke']">
  <app-certification-actions></app-certification-actions>
</div>

<!-- Admin-only section -->
<app-admin-panel *appHasPermission="'admin.access'"></app-admin-panel>
```

**3. Route Guard:**

```typescript
export const permissionGuard: CanActivateFn = (route) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const requiredPermission = route.data['permission'] as string;

  if (permissionService.hasPermission(requiredPermission)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

// Route config
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module'),
    canActivate: [permissionGuard],
    data: { permission: 'admin.access' }
  },
  {
    path: 'certifications',
    loadChildren: () => import('./certifications/cert.module'),
    canActivate: [permissionGuard],
    data: { permission: 'cert.view' }
  }
];
```

**4. HTTP Interceptor for 403:**

```typescript
export const forbiddenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError(error => {
      if (error.status === 403) {
        toast.error('You do not have permission to perform this action.');
        // Optionally redirect or just show error
      }
      return throwError(() => error);
    })
  );
};
```

**Security Note**: Never rely solely on client-side permission checks. The server must enforce permissions on every API call. Client-side RBAC is for UX (hiding buttons the user can't use), not security.

---

### Java (Expect 2–3 Questions)

---

**Q: "What's the difference between abstract class and interface in Java?"**

**Detailed Answer:**

| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Instantiation | Cannot be instantiated | Cannot be instantiated |
| Constructors | Yes — called via `super()` | No |
| State (fields) | Can have instance variables | Only `public static final` constants |
| Method types | Abstract + concrete methods | Abstract + `default` + `static` (Java 8+) |
| Access modifiers | Any (private, protected, public) | Methods are `public` by default |
| Inheritance | Single inheritance only | Multiple interfaces allowed |
| Purpose | "IS-A" relationship with shared behavior | "CAN-DO" capability contract |

```java
// Abstract Class — shared base behavior + state
public abstract class BaseIdentityProcessor {
    protected String tenantId;  // state
    protected Logger logger;    // state

    public BaseIdentityProcessor(String tenantId) {  // constructor
        this.tenantId = tenantId;
        this.logger = LoggerFactory.getLogger(getClass());
    }

    // Concrete method — shared behavior
    public void logProcessing(String identityId) {
        logger.info("Processing identity {} for tenant {}", identityId, tenantId);
    }

    // Abstract method — subclasses must implement
    public abstract void processIdentity(Identity identity);

    // Template method pattern
    public final void execute(Identity identity) {
        logProcessing(identity.getId());
        validate(identity);
        processIdentity(identity);  // subclass provides implementation
    }

    protected void validate(Identity identity) {
        if (identity == null) throw new IllegalArgumentException("Identity cannot be null");
    }
}

// Concrete subclass
public class ProvisioningProcessor extends BaseIdentityProcessor {
    public ProvisioningProcessor(String tenantId) {
        super(tenantId);
    }

    @Override
    public void processIdentity(Identity identity) {
        // Provisioning-specific logic
    }
}
```

```java
// Interface — capability contract
public interface Auditable {
    void audit(AuditEvent event);

    // Default method (Java 8+) — optional override
    default String getAuditSource() {
        return this.getClass().getSimpleName();
    }
}

public interface Cacheable {
    String getCacheKey();
    Duration getCacheTTL();
}

// A class can implement multiple interfaces
public class IdentityService extends BaseIdentityProcessor
    implements Auditable, Cacheable {

    @Override
    public void processIdentity(Identity identity) { /* ... */ }

    @Override
    public void audit(AuditEvent event) { /* ... */ }

    @Override
    public String getCacheKey() { return "identity-service"; }

    @Override
    public Duration getCacheTTL() { return Duration.ofMinutes(5); }
}
```

**When to use which:**
- Use **abstract class** when subclasses share common state and behavior (e.g., `BaseIdentityProcessor` with shared logging, validation)
- Use **interface** when defining a capability that unrelated classes can implement (e.g., `Auditable`, `Serializable`, `Comparable`)
- In modern Java (8+), interfaces with `default` methods blur the line — but abstract classes still win when you need constructors or mutable state

---

**Q: "Explain checked vs unchecked exceptions."**

**Detailed Answer:**

```
                    Throwable
                   /         \
              Error         Exception
           (unchecked)     /          \
           e.g.,     RuntimeException   Checked Exceptions
           OutOfMemoryError  (unchecked)    (checked)
           StackOverflowError  e.g.,        e.g.,
                            NullPointerException  IOException
                            IllegalArgumentException  SQLException
                            IndexOutOfBoundsException  FileNotFoundException
                            ClassCastException         InterruptedException
```

**Checked Exceptions — Compiler enforces handling:**

```java
// Must either catch or declare in throws clause
public String readIdentityFile(String path) throws IOException {
    // IOException is checked — compiler forces you to handle it
    BufferedReader reader = new BufferedReader(new FileReader(path));
    return reader.readLine();
}

// Caller must handle it
try {
    String data = readIdentityFile("/data/identities.csv");
} catch (IOException e) {
    logger.error("Failed to read identity file", e);
    throw new IdentityProcessingException("File read failed", e);  // wrap in domain exception
}
```

**Unchecked Exceptions — Runtime errors, no compiler enforcement:**

```java
// No throws clause needed — these are programming errors
public Identity getIdentity(List<Identity> identities, int index) {
    // IndexOutOfBoundsException — unchecked, no need to declare
    return identities.get(index);
}

public void processIdentity(Identity identity) {
    // NullPointerException — unchecked
    String name = identity.getName().toUpperCase();
}
```

**Best Practices:**
- Use checked exceptions for recoverable conditions (file not found, network timeout)
- Use unchecked exceptions for programming errors (null pointer, invalid argument)
- Wrap low-level checked exceptions in domain-specific exceptions
- Never catch `Error` (OutOfMemoryError, StackOverflowError) — these are JVM-level problems

---

**Q: "Explain Java Collections — List, Map, Set. When to use which?"**

**Detailed Answer:**

| Collection | Duplicates | Ordered | Key-Value | Use Case |
|-----------|-----------|---------|-----------|----------|
| `ArrayList` | Yes | Insertion order | No | Default list, random access by index |
| `LinkedList` | Yes | Insertion order | No | Frequent insert/delete at head/middle |
| `HashSet` | No | No order | No | Fast lookup, uniqueness check |
| `LinkedHashSet` | No | Insertion order | No | Unique + maintain order |
| `TreeSet` | No | Sorted | No | Sorted unique elements |
| `HashMap` | Keys: No | No order | Yes | Default key-value store |
| `LinkedHashMap` | Keys: No | Insertion order | Yes | LRU cache, ordered map |
| `TreeMap` | Keys: No | Sorted by key | Yes | Sorted key-value pairs |

```java
// ArrayList — most common, O(1) random access
List<Identity> identities = new ArrayList<>();
identities.add(new Identity("John"));
Identity first = identities.get(0);  // O(1)

// HashSet — O(1) lookup, no duplicates
Set<String> processedIds = new HashSet<>();
processedIds.add("id-001");
boolean alreadyProcessed = processedIds.contains("id-001");  // O(1)

// HashMap — O(1) key-value lookup
Map<String, Identity> identityMap = new HashMap<>();
identityMap.put("id-001", new Identity("John"));
Identity john = identityMap.get("id-001");  // O(1)

// LinkedHashMap as LRU Cache
Map<String, SearchResult> cache = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, SearchResult> eldest) {
        return size() > 100;  // evict when cache exceeds 100 entries
    }
};
```

---

**Q: "Basic Spring Boot REST — what annotations do you use?"**

**Detailed Answer:**

```java
@RestController                          // Combines @Controller + @ResponseBody
@RequestMapping("/api/v3/identities")    // Base path
public class IdentityController {

    @Autowired                           // Dependency injection
    private IdentityService identityService;

    @GetMapping                          // GET /api/v3/identities?offset=0&limit=25
    public ResponseEntity<PaginatedResponse<Identity>> getIdentities(
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "25") int limit,
            @RequestParam(required = false) String filters) {
        PaginatedResponse<Identity> response = identityService.search(offset, limit, filters);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")                 // GET /api/v3/identities/abc-123
    public ResponseEntity<Identity> getIdentity(@PathVariable String id) {
        return identityService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping                         // POST /api/v3/identities
    public ResponseEntity<Identity> createIdentity(@Valid @RequestBody CreateIdentityRequest request) {
        Identity created = identityService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}")               // PATCH /api/v3/identities/abc-123
    public ResponseEntity<Identity> updateIdentity(
            @PathVariable String id,
            @Valid @RequestBody UpdateIdentityRequest request) {
        Identity updated = identityService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")              // DELETE /api/v3/identities/abc-123
    public ResponseEntity<Void> deleteIdentity(@PathVariable String id) {
        identityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

**Key annotations to know:**
- `@RestController` = `@Controller` + `@ResponseBody` (auto-serializes to JSON)
- `@RequestMapping` — base URL path
- `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping` — HTTP method shortcuts
- `@PathVariable` — extracts from URL path (`/identities/{id}`)
- `@RequestParam` — extracts from query string (`?offset=0&limit=25`)
- `@RequestBody` — deserializes JSON request body
- `@Valid` — triggers bean validation
- `@Autowired` — dependency injection (constructor injection preferred in modern Spring)

---

### Behavioral (STAR Format)

---

**Q: "Tell me about a time you debugged a complex production issue."**

**How to Structure Your Answer (STAR):**

**Situation**: "We had a production issue in our identity management dashboard where users reported the page becoming unresponsive after 10-15 minutes of use. This was affecting enterprise customers with 50,000+ identities."

**Task**: "As the senior frontend engineer, I was the L3 escalation point. I needed to identify the root cause and fix it without disrupting the release cycle."

**Action**:
- "I started by reproducing the issue locally using Chrome DevTools Memory tab. I took heap snapshots at 0, 5, and 15 minutes."
- "The heap was growing by ~50MB every 5 minutes. I compared snapshots and found thousands of detached DOM nodes and growing arrays of subscription objects."
- "Root cause: A real-time notification component was subscribing to a WebSocket Observable inside `ngOnInit` but never unsubscribing. Every time the component was shown/hidden (via `*ngIf`), a new subscription was created without cleaning up the old one."
- "Fix: Added `takeUntil(this.destroy$)` to the subscription and switched to `async` pipe where possible. Also added a `bufferTime(1000)` to batch rapid WebSocket messages."
- "I then added a memory leak detection test to our CI pipeline using Puppeteer — it navigates through key flows and asserts heap growth stays under a threshold."

**Result**: "Memory usage stabilized. Page stayed responsive for 8+ hours of continuous use. The CI check caught two more potential leaks in the next sprint before they reached production."

**Tips for your own story:**
- Pick a real bug you've debugged — interviewers can tell when you're making it up
- Mention specific tools: Chrome DevTools, Angular DevTools, Profiler, Network tab
- Show the debugging process, not just the fix
- End with prevention (tests, monitoring, code review checklist)

---

**Q: "Describe a time you had to work with legacy code."**

**How to Structure Your Answer (STAR):**

**Situation**: "Our application had a significant module built in [older framework/jQuery/AngularJS] that was critical for [business function]. It was 5+ years old, had minimal tests, and the original developers had left."

**Task**: "We needed to add new features to this module while planning a migration to modern Angular. I had to balance feature delivery with modernization."

**Action**:
- "First, I spent a week understanding the legacy code — reading it, adding comments, drawing data flow diagrams. I didn't change anything yet."
- "I proposed a 'strangler fig' migration strategy: wrap the legacy module in an Angular component using an iframe/web component bridge, then incrementally replace pieces."
- "For new features, I built them in Angular and integrated them with the legacy code through a shared event bus / message passing."
- "I wrote integration tests around the legacy module's public API before touching anything — this gave us a safety net."
- "Over 3 sprints, we migrated the most-used screens to Angular while keeping the legacy code running for less-used features."

**Result**: "We delivered the new features on time while reducing the legacy codebase by 40%. The remaining legacy code was isolated and documented for future migration."

**SailPoint angle**: This maps directly to their ExtJS → Angular migration in IdentityIQ. Show that you understand incremental migration, not "rewrite everything."

---

**Q: "Tell me about a time you disagreed with a technical decision."**

**How to Structure Your Answer (STAR):**

**Situation**: "The team lead proposed using Redux/NgRx for state management across the entire application, including simple CRUD screens."

**Task**: "I believed this was over-engineering for most of our use cases and would slow down development significantly."

**Action**:
- "I prepared a comparison: I built the same feature (an identity list with search/filter/sort) using both NgRx and a simple BehaviorSubject service. I measured lines of code, development time, and testability."
- "NgRx version: 12 files (actions, reducers, effects, selectors, etc.), 400+ lines. BehaviorSubject version: 2 files, 80 lines. Both had the same functionality and test coverage."
- "I presented this to the team in a tech review meeting, proposing a tiered approach: BehaviorSubject for simple features, NgRx only for complex cross-cutting state (auth, notifications, shared filters)."
- "The team lead initially disagreed, citing consistency. I acknowledged that point and suggested we try both approaches for one sprint and compare developer velocity."

**Result**: "After the trial sprint, the team agreed on the tiered approach. Simple features shipped 2x faster. We used NgRx for 3 complex features and BehaviorSubject services for the other 15+. The team lead later thanked me for pushing back constructively."

**Key takeaway for the interviewer**: You can disagree respectfully, back your position with data, and accept the team's final decision.

---

**Q: "What does your expected tenure at SailPoint look like?"**

**How to Answer:**

This is a real question asked at SailPoint. They want to know you're not using them as a stepping stone.

"I'm looking for a place where I can grow long-term. What excites me about SailPoint is the depth of the technical challenges — the ExtJS to Angular migration, building a shared component library like Armada, and working on identity governance at enterprise scale. These aren't problems you solve in 6 months. I'd want at least 3-4 years to make a meaningful impact — help complete the migration, mentor the team, and contribute to the architecture decisions that shape the product for the next generation."

**Why this works**: It's specific to SailPoint (not generic), shows you've researched their challenges, and commits to a realistic timeline.

---

## 4B. Detailed Answers for Checklist Topics (Tier 1, 2, 3)

These cover every checklist item from Section 3 that isn't already answered in Section 4.

### Angular — Component Lifecycle Hooks

**Order of execution:**

```
constructor()           → DI happens here, no DOM yet
ngOnChanges()           → Called when @Input() values change (before ngOnInit on first run)
ngOnInit()              → Component initialized, @Input() values available
ngDoCheck()             → Custom change detection logic (runs every CD cycle)
ngAfterContentInit()    → After <ng-content> projected content is initialized
ngAfterContentChecked() → After projected content is checked (every CD cycle)
ngAfterViewInit()       → After component's view (and child views) are initialized
ngAfterViewChecked()    → After view is checked (every CD cycle)
ngOnDestroy()           → Cleanup: unsubscribe, detach event listeners
```

**Key gotchas:**

```typescript
@Component({
  selector: 'app-user-detail',
  template: `<p #nameEl>{{ user?.name }}</p>`
})
export class UserDetailComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() user: User;
  @ViewChild('nameEl') nameEl: ElementRef;

  // ❌ WRONG — @Input not available yet
  constructor() {
    console.log(this.user);  // undefined
  }

  // ✅ Called BEFORE ngOnInit when @Input changes
  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && !changes['user'].firstChange) {
      console.log('User changed from', changes['user'].previousValue,
                  'to', changes['user'].currentValue);
    }
  }

  // ✅ @Input available, but DOM not ready
  ngOnInit() {
    console.log(this.user);       // ✅ has value
    console.log(this.nameEl);     // ❌ undefined — DOM not ready
  }

  // ✅ DOM is ready
  ngAfterViewInit() {
    console.log(this.nameEl.nativeElement.textContent);  // ✅ works
    // ⚠️ Don't modify state here — causes ExpressionChangedAfterItHasBeenCheckedError
  }

  ngOnDestroy() {
    // Clean up subscriptions, timers, event listeners
  }
}
```

**When to use each:**

| Hook | Use Case |
|------|----------|
| `ngOnInit` | Fetch data, initialize subscriptions, setup logic |
| `ngOnChanges` | React to @Input changes (e.g., reload data when ID changes) |
| `ngAfterViewInit` | Access @ViewChild, initialize third-party libraries that need DOM |
| `ngOnDestroy` | Unsubscribe, clear timers, remove event listeners |
| `ngDoCheck` | Custom dirty checking (rare — use for deep object comparison) |

---

### Angular — Dependency Injection Deep Dive

**Injector Hierarchy:**

```
Platform Injector (singleton across apps)
  └── Root Injector (providedIn: 'root')
       └── Module Injector (providers in @NgModule)
            └── Element Injector (providers in @Component)
                 └── Child Element Injector
```

**Resolution order**: Angular looks UP the tree. If a service isn't found in the component's injector, it checks the parent, then the module, then root.

**InjectionToken — For non-class dependencies:**

```typescript
// Define token
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
export const FEATURE_FLAGS = new InjectionToken<FeatureFlags>('FEATURE_FLAGS');

// Provide value
@NgModule({
  providers: [
    { provide: API_BASE_URL, useValue: 'https://api.sailpoint.com/v3' },
    { provide: FEATURE_FLAGS, useFactory: () => loadFeatureFlags(), deps: [HttpClient] }
  ]
})
export class AppModule {}

// Inject
@Injectable({ providedIn: 'root' })
export class IdentityService {
  constructor(
    @Inject(API_BASE_URL) private apiUrl: string,
    @Inject(FEATURE_FLAGS) private flags: FeatureFlags
  ) {}
}

// Modern inject() function (Angular 14+)
@Injectable({ providedIn: 'root' })
export class IdentityService {
  private apiUrl = inject(API_BASE_URL);
  private flags = inject(FEATURE_FLAGS);
  private http = inject(HttpClient);
}
```

**Provider strategies:**

```typescript
// useClass — provide a different implementation
{ provide: LoggerService, useClass: environment.production ? ProdLogger : DevLogger }

// useExisting — alias one token to another
{ provide: AbstractLogger, useExisting: ConsoleLoggerService }

// useFactory — dynamic creation with dependencies
{
  provide: IdentityService,
  useFactory: (http: HttpClient, config: AppConfig) => {
    return config.useMock ? new MockIdentityService() : new RealIdentityService(http);
  },
  deps: [HttpClient, AppConfig]
}

// useValue — static value
{ provide: API_BASE_URL, useValue: '/api/v3' }
```

---

### Angular — Reactive Forms Deep Dive

```typescript
@Component({
  template: `
    <form [formGroup]="identityForm" (ngSubmit)="onSubmit()">
      <input formControlName="name" placeholder="Name">
      <div *ngIf="identityForm.get('name')?.errors?.['required'] &&
                  identityForm.get('name')?.touched">
        Name is required
      </div>
      <div *ngIf="identityForm.get('name')?.errors?.['minlength']">
        Name must be at least 2 characters
      </div>

      <input formControlName="email" placeholder="Email">
      <div *ngIf="identityForm.get('email')?.errors?.['emailTaken']">
        This email is already registered
      </div>
      <div *ngIf="identityForm.get('email')?.pending">
        Checking availability...
      </div>

      <button type="submit" [disabled]="identityForm.invalid || identityForm.pending">
        Save
      </button>
    </form>
  `
})
export class IdentityFormComponent implements OnInit {
  identityForm: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.identityForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
      role: ['viewer', Validators.required],
      attributes: this.fb.group({
        department: [''],
        location: ['']
      })
    });
  }

  // Custom sync validator
  static noWhitespace(control: AbstractControl): ValidationErrors | null {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  // Custom async validator — checks API
  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) return of(null);

      return this.identityService.checkEmailExists(control.value).pipe(
        debounceTime(300),
        map(exists => exists ? { emailTaken: true } : null),
        catchError(() => of(null))  // on error, don't block the form
      );
    };
  }

  onSubmit() {
    if (this.identityForm.valid) {
      const formValue = this.identityForm.getRawValue();
      this.identityService.create(formValue).subscribe();
    } else {
      this.identityForm.markAllAsTouched();  // show all validation errors
    }
  }
}
```

---

### Angular — Route Guards and Resolvers

```typescript
// Functional guard (modern Angular 15+)
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store attempted URL for redirect after login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// CanDeactivate — prevent leaving with unsaved changes
export const unsavedChangesGuard: CanDeactivateFn<{ hasUnsavedChanges: () => boolean }> =
  (component) => {
    if (component.hasUnsavedChanges()) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  };

// Resolver — pre-fetch data before route activates
export const identityResolver: ResolveFn<Identity> = (route) => {
  const identityService = inject(IdentityService);
  const r

- **Armada** = SailPoint's internal Angular component library (shared across IdentityNow, IdentityAI, File Access Manager)
- **Migration story**: AngularJS → Angular 7+ (completed). ExtJS still exists in IdentityIQ
- **Products**: IdentityNow (SaaS, cloud) vs IdentityIQ (on-prem, Java-heavy)
- **V3 API**: REST-based, paginated (offset/limit), JSON responses
- **IGA concepts**: Identity Governance & Administration — access certifications, lifecycle management, role mining, provisioning
- **L3 Support**: You'll occasionally talk directly to enterprise customers — communication skills matter
- **US collaboration**: Pune team overlaps with US timezone — async communication, clear documentation

---

## 6. Coding Round Prep

Based on SailPoint's difficulty profile (avg 5–7/10 on algodaily):

### Focus Areas
- Arrays and strings (most common)
- HashMap/HashSet patterns
- Two pointers
- Sliding window
- Tree traversal (BFS/DFS)
- Basic dynamic programming

### Practice Problems (Medium difficulty)
1. Two Sum / Three Sum
2. Longest Substring Without Repeating Characters
3. Valid Parentheses
4. Merge Intervals
5. LRU Cache (very relevant for frontend caching questions)
6. Binary Tree Level Order Traversal
7. Find All Anagrams in a String
8. Group Anagrams

### Tips
- They may ask you to code in Java (JD mentions Java fluency) — brush up on Java syntax
- Explain your thought process out loud
- Discuss time/space complexity
- Ask clarifying questions before coding

---

## 7. Questions to Ask the Interviewer

These show strategic thinking and genuine interest:

1. "How far along is the ExtJS to Angular migration in IdentityIQ? What's the current strategy?"
2. "How does the Pune team collaborate with the US engineering team day-to-day?"
3. "What does the Armada component library look like today — is it still actively evolving?"
4. "What does a typical L3 support escalation look like for the UI team?"
5. "What are the team's OKRs for this quarter?"
6. "What does the onboarding process look like for the first 30/60/90 days?"

---

## 8. Prep Timeline (2-Week Plan)

### Week 1
| Day | Focus |
|-----|-------|
| 1–2 | Angular deep dive: CD, DI, lifecycle, standalone |
| 3–4 | RxJS: all operators, subjects, memory leaks |
| 5 | TypeScript: generics, utility types, advanced patterns |
| 6–7 | JavaScript: event loop, closures, promises, debounce/throttle |

### Week 2
| Day | Focus |
|-----|-------|
| 8–9 | System design: search bar, data table, RBAC UI |
| 10 | Java basics: OOP, collections, exceptions, Spring REST |
| 11 | Coding practice: 2–3 medium LeetCode problems/day |
| 12 | Web performance + security |
| 13 | Behavioral stories (STAR format — prepare 5–6 stories) |
| 14 | Mock interview + review weak areas |

---

## 9. Existing Prep Material in This Workspace

You already have detailed guides — use them:

| File | Covers |
|------|--------|
| `sailpoint/sailpoint-angular-interview-part1.md` | Angular core, CD, DI, lifecycle, standalone |
| `sailpoint/sailpoint-angular-interview-part2.md` | RxJS, performance, modern Angular, routing, forms |
| `sailpoint/sailpoint-frontend-interview-part3.md` | JS advanced, TypeScript, performance, security, system design |
| `ANGULAR_LIFECYCLE_HOOKS_DETAILED.md` | Lifecycle hooks deep dive |
| `rxjs-reactive-programming.md` | RxJS concepts |
| `async-programming-deep-dive.md` | Async patterns |
| `event-loop-execution-model.md` | Event loop |
| `prototypes-inheritance-closures.md` | JS fundamentals |

---

## 10. Red Flags to Avoid

- Saying "I've never worked with Java" — even basic OOP knowledge is expected
- Memorizing answers without understanding trade-offs
- Not asking clarifying questions before system design
- Ignoring accessibility in UI design questions
- Not knowing SailPoint's products at a high level
- Saying you'd "rewrite everything" when asked about legacy code

---

*Sources: SailPoint JD R012532, Glassdoor/Indeed interview reports, SailPoint Engineering Blog (medium.com/sailpointengineering), interviewquery.com, interviewpal.com, algodaily.com/companies/sailpoint*
