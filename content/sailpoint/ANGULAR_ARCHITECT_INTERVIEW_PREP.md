# Angular Architect / UI Lead — Interview Preparation Guide
> Roles: Frontend Architect · UI Lead · Senior Staff UI Engineer · Lead UI Engineer · Angular Expert  
> Framework: Angular 20 (Signals stable, Zoneless, Standalone-by-default, resource API, linkedSignal)  
> Format: 20 most-asked topics with model answers using modern Angular patterns.

---

## 1. How Would You Design the Architecture for a Large-Scale Angular Application?

**Why they ask:** This is the #1 question for architect roles. They want to see if you think beyond components and consider scalability, team structure, and long-term maintainability in the Angular ecosystem.

**Model Answer:**

I design large-scale Angular apps using a layered, feature-based architecture with strict module boundaries.

**1. Project Structure — Feature-based with standalone components**
```
src/
  app/
    features/
      auth/
        components/
        services/
        guards/
        auth.routes.ts
      identity/
      dashboard/
    shared/
      components/     ← design system components
      directives/
      pipes/
      utils/
    core/
      interceptors/
      services/       ← singleton services (auth, config, logging)
      guards/
    app.routes.ts
    app.config.ts     ← provideRouter, provideHttpClient, etc.
    app.component.ts
```
In Angular 20, standalone is the default — no NgModules needed. Each feature is a folder with its own routes, lazy-loaded via `loadChildren` or `loadComponent`.

**2. Bootstrapping (Angular 20 style)**
```typescript
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    provideExperimentalZonelessChangeDetection(), // Zoneless mode
  ]
});
```

**3. State Management — Signal-first**
- **Server state**: `resource()` API or `rxResource()` for async data with built-in loading/error states.
- **Global UI state**: Signal-based services with `signal()`, `computed()`, `linkedSignal()`.
- **Local state**: Component-level `signal()` and `computed()`.
- **URL state**: Router query params with `withComponentInputBinding()`.

**4. Module Boundaries**
Enforce with `eslint-plugin-boundaries` or Nx workspace constraints. Features cannot import from other features directly — they communicate through shared services or the router.

**5. Scalability Levers**
- Lazy loading per feature route.
- Nx monorepo for multi-app/multi-lib setups.
- Shared design system as a publishable library.
- Micro-frontends via Module Federation when team count exceeds 3+.

**Talking points:**
- Angular 20's standalone-by-default eliminates NgModule boilerplate entirely.
- Zoneless change detection (developer preview in v20) removes Zone.js overhead.
- Signal-based reactivity replaces most RxJS patterns for synchronous state.

---

## 2. Explain Micro-Frontends in Angular — When to Use and How to Implement

**Why they ask:** Tests architectural thinking and awareness of organizational trade-offs specific to the Angular ecosystem.

**Model Answer:**

Micro-frontends let multiple teams independently develop, deploy, and own slices of an Angular application.

**When to use:**
- 3+ teams on the same product with different release cadences.
- Migrating from AngularJS/legacy to modern Angular incrementally (strangler fig pattern).
- Independent deployability is a hard requirement.

**When to avoid:**
- Small teams (< 10 devs) — overhead isn't worth it.
- Tightly coupled features sharing heavy state.
- Greenfield projects where a well-structured monolith suffices.

**Implementation with Module Federation (Angular 20):**

```typescript
// Shell app — webpack.config.js (or @angular-architects/native-federation)
const { withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  remotes: {
    identityApp: 'http://localhost:4201/remoteEntry.js',
    dashboardApp: 'http://localhost:4202/remoteEntry.js',
  },
  shared: {
    '@angular/core': { singleton: true, strictVersion: true },
    '@angular/common': { singleton: true, strictVersion: true },
    '@angular/router': { singleton: true, strictVersion: true },
  }
});

// Shell routing
const routes: Routes = [
  {
    path: 'identity',
    loadChildren: () => import('identityApp/Routes').then(m => m.routes)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('dashboardApp/Routes').then(m => m.routes)
  }
];
```

**Native Federation (newer approach):**
`@angular-architects/native-federation` uses ES Module imports instead of Webpack — works with Angular CLI's esbuild builder. Lighter, no Webpack dependency.

**Trade-offs:**
- **Pros:** Team autonomy, independent deployments, incremental migration.
- **Cons:** Shared state is harder, CSS conflicts, duplicate Angular runtime if not configured as singleton.
- **Mitigations:** Shared design system library, thin shell for routing/auth, strict API contracts.

---

## 3. Rendering Strategies in Angular: CSR vs SSR vs SSG vs Hydration

**Why they ask:** Architects must choose the right rendering strategy. Angular's SSR story has evolved significantly with Angular Universal → `@angular/ssr`.

**Model Answer:**

| Strategy | Angular Implementation | Use when |
|---|---|---|
| **CSR** | Default `ng serve` / `ng build` | Dashboards, admin panels, apps behind auth |
| **SSR** | `@angular/ssr` (replaces Universal) | SEO-critical, personalized content |
| **SSG (Prerendering)** | `ng build --prerender` | Marketing pages, blogs, docs |
| **Incremental Hydration** | `@defer (hydrate on ...)` (stable in v20) | Large SSR pages with selective interactivity |

**Angular 20 SSR setup:**
```typescript
// app.config.server.ts
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRoutesConfig } from '@angular/ssr';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRoutesConfig([
      { path: 'dashboard/**', renderMode: RenderMode.Client },  // CSR
      { path: 'products/:id', renderMode: RenderMode.Server },  // SSR
      { path: 'about', renderMode: RenderMode.Prerender },      // SSG
      { path: '**', renderMode: RenderMode.Server }
    ])
  ]
};
```

**Incremental Hydration (Angular 20 stable):**
```html
<!-- Only hydrate this section when it becomes visible -->
@defer (hydrate on viewport) {
  <app-comments [postId]="postId" />
}

<!-- Hydrate on user interaction -->
@defer (hydrate on interaction) {
  <app-rich-editor />
}

<!-- Never hydrate (static content) -->
@defer (hydrate never) {
  <app-footer />
}
```

This is Angular's answer to React's Islands Architecture — ship less JS by only hydrating interactive parts.

**Decision framework:**
- SEO needed? → SSR or prerender.
- Behind auth? → CSR.
- Content-heavy with interactive pockets? → SSR + incremental hydration.
- Static content? → Prerender at build time.

---

## 4. How Do You Build and Govern a Design System in Angular?

**Why they ask:** Architect roles own cross-team UI consistency. They want to see how you'd build, version, and govern shared components.

**Model Answer:**

A design system is a product, not a project. In Angular, I build it as a publishable library in an Nx monorepo.

**Layers:**
1. **Design Tokens** — CSS custom properties for colors, spacing, typography. Framework-agnostic, consumed by any app.
2. **Core Components** — standalone Angular components (Button, Input, Modal, DataTable) published as an npm package.
3. **Pattern Library** — composed patterns (FormField, PageHeader, FilterBar).
4. **Documentation** — Storybook with `@storybook/angular` for interactive examples.

**Angular-specific architecture:**
```typescript
// Standalone component with OnPush + Signals
@Component({
  selector: 'ds-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [class]="'ds-btn ds-btn--' + variant()"
      [disabled]="disabled()"
      [attr.aria-busy]="loading()"
    >
      @if (loading()) {
        <ds-spinner size="sm" />
      }
      <ng-content />
    </button>
  `
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'danger'>('primary');
  disabled = input(false);
  loading = input(false);
}
```

**Key decisions:**
- All components are standalone (Angular 20 default).
- Signal inputs (`input()`) instead of `@Input()` decorators.
- `OnPush` change detection on every component.
- Accessibility baked in — ARIA attributes, keyboard navigation, focus management.
- Theming via CSS custom properties — apps override tokens, not component internals.

**Governance:**
- Semantic versioning + Changesets for releases.
- RFC process for new components or breaking changes.
- Visual regression testing with Chromatic.
- Rule of three — abstract only after a pattern appears in 3+ places.

---

## 5. How Do You Optimize Performance in Angular Applications?

**Why they ask:** Performance is a core architect responsibility. Angular has specific optimization levers that differ from other frameworks.

**Model Answer:**

**Phase 1: Load performance**
- Lazy loading routes with `loadComponent` / `loadChildren`:
```typescript
const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.routes').then(m => m.routes)
  }
];
```
- `@defer` blocks for below-fold content:
```html
@defer (on viewport) {
  <app-heavy-chart [data]="chartData()" />
} @placeholder {
  <div class="chart-skeleton"></div>
}
```
- Tree shaking — standalone components enable component-level tree shaking (better than NgModule-level).
- Preload strategies: `PreloadAllModules` or custom preloading based on user behavior.
- Image optimization with `NgOptimizedImage`:
```html
<img ngSrc="hero.jpg" width="1200" height="600" priority />
```

**Phase 2: Runtime performance**
- **Signals over RxJS for synchronous state** — Signals enable fine-grained reactivity. Only the specific DOM nodes bound to a changed signal update.
- **OnPush everywhere** — with Signals, OnPush is almost free since signals notify the framework precisely.
- **Zoneless mode (Angular 20):**
```typescript
provideExperimentalZonelessChangeDetection()
```
Removes Zone.js entirely (~15KB savings). Change detection only runs when signals change or events fire. No more unnecessary CD cycles from `setTimeout` or `setInterval`.
- **`trackBy` in `@for`:**
```html
@for (user of users(); track user.id) {
  <app-user-card [user]="user" />
}
```
- **Virtual scrolling** with `@angular/cdk/scrolling`:
```html
<cdk-virtual-scroll-viewport itemSize="48">
  <div *cdkVirtualFor="let item of items">{{ item.name }}</div>
</cdk-virtual-scroll-viewport>
```

**Phase 3: Perceived performance**
- Skeleton screens via `@defer` `@placeholder` blocks.
- `@loading` blocks for minimum display time:
```html
@defer (on viewport) {
  <app-feed />
} @loading (minimum 300ms) {
  <app-skeleton-feed />
} @placeholder {
  <div class="feed-placeholder"></div>
}
```

**Measurement:** Lighthouse CI in pipeline, Chrome DevTools Performance tab, Angular DevTools profiler for change detection analysis.

---

## 6. How Do You Manage State in a Complex Angular Application?

**Why they ask:** State management is where Angular apps get messy. Architects must define the strategy, not just pick a library.

**Model Answer:**

Angular 20's signal-first model changes the state management landscape significantly.

**State taxonomy:**

| Type | Tool in Angular 20 |
|---|---|
| **Server/async state** | `resource()` / `rxResource()` API |
| **Global UI state** | Signal-based services with `signal()`, `computed()`, `linkedSignal()` |
| **URL state** | Router params with `withComponentInputBinding()` |
| **Local UI state** | Component-level `signal()` |
| **Form state** | Reactive Forms (`FormGroup`, `FormControl`) |
| **Complex global state** | NgRx SignalStore (for large apps) |

**Signal-based service (replaces BehaviorSubject pattern):**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthStore {
  // State
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);

  // Public selectors (read-only)
  user = this._user.asReadonly();
  isAuthenticated = computed(() => this._user() !== null);
  displayName = computed(() => this._user()?.name ?? 'Guest');

  // Actions
  login(credentials: Credentials) {
    return this.http.post<AuthResponse>('/api/login', credentials).pipe(
      tap(res => {
        this._user.set(res.user);
        this._token.set(res.token);
      })
    );
  }

  logout() {
    this._user.set(null);
    this._token.set(null);
  }
}
```

**resource() API for server state (Angular 20):**
```typescript
@Component({ ... })
export class UserProfileComponent {
  userId = input.required<string>();

  userResource = resource({
    request: () => ({ id: this.userId() }),
    loader: async ({ request }) => {
      const res = await fetch(`/api/users/${request.id}`);
      return res.json() as Promise<User>;
    }
  });

  // Usage in template:
  // userResource.value()   → the data
  // userResource.isLoading() → boolean
  // userResource.error()   → error if any
  // userResource.reload()  → refetch
}
```

**linkedSignal for derived mutable state:**
```typescript
selectedTab = signal<'profile' | 'settings'>('profile');
// Resets to first item when tab changes, but can be manually overridden
selectedItem = linkedSignal(() => this.getDefaultItem(this.selectedTab()));
```

**When to use NgRx SignalStore:**
- 5+ developers on the same feature area.
- Complex state with many derived values and side effects.
- Need for Redux DevTools debugging and time-travel.

```typescript
export const UsersStore = signalStore(
  withState({ users: [] as User[], loading: false }),
  withComputed(({ users }) => ({
    activeUsers: computed(() => users().filter(u => u.active)),
    userCount: computed(() => users().length),
  })),
  withMethods((store, http = inject(HttpClient)) => ({
    loadUsers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() => http.get<User[]>('/api/users')),
        tap(users => patchState(store, { users, loading: false }))
      )
    ),
  }))
);
```

---

## 7. How Do You Approach Accessibility (a11y) in Angular Architecture?

**Why they ask:** Senior roles must champion accessibility. Angular has specific tools and patterns for a11y.

**Model Answer:**

I treat accessibility as a non-functional requirement with the same priority as performance. Retrofitting is 3-5x more expensive.

**Angular-specific approach:**

1. **Design system as the a11y enforcement layer** — every shared component ships with ARIA, keyboard nav, and focus management built in.

2. **Angular CDK A11y module:**
```typescript
import { A11yModule, LiveAnnouncer, FocusTrapFactory } from '@angular/cdk/a11y';

@Component({
  standalone: true,
  imports: [A11yModule],
  template: `
    <div cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
      <h2>Edit Profile</h2>
      <input cdkFocusInitial placeholder="Name" />
      <button (click)="save()">Save</button>
      <button (click)="close()">Cancel</button>
    </div>
  `
})
export class EditDialogComponent {
  private announcer = inject(LiveAnnouncer);

  save() {
    // Announce to screen readers
    this.announcer.announce('Profile saved successfully', 'polite');
  }
}
```

3. **Semantic HTML first** — `<button>` not `<div (click)>`, `<nav>`, `<main>`, `<dialog>`.

4. **ARIA only when HTML semantics aren't enough.** Misused ARIA is worse than no ARIA.

5. **Keyboard navigation** — every interactive element reachable via keyboard. Use `cdkTrapFocus` for modals, `cdkFocusInitial` for auto-focus.

6. **Route change announcements:**
```typescript
// In app.component.ts
export class AppComponent {
  private router = inject(Router);
  private announcer = inject(LiveAnnouncer);

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.announcer.announce('Page loaded', 'assertive');
    });
  }
}
```

**Testing:**
- `axe-core` in unit tests via `jest-axe`.
- `axe-playwright` in E2E tests.
- CI gate: fail builds on new violations.
- Manual testing with NVDA/VoiceOver.

**Standards:** WCAG 2.2 AA. ARIA Authoring Practices Guide (APG) for widget patterns.

---

## 8. How Do You Handle Security in Angular Applications?

**Why they ask:** Angular has built-in security features. Architects should know the threat model and how Angular mitigates it.

**Model Answer:**

**XSS — Angular's built-in protection:**
- Angular sanitizes all values bound to the DOM by default. Interpolation (`{{ }}`), property binding (`[innerHTML]`), and style/URL bindings are all sanitized.
- `bypassSecurityTrustHtml()` is a red flag in code reviews — requires explicit justification.
- Implement Content Security Policy (CSP) headers. Angular 20 supports nonce-based CSP for inline styles:
```typescript
// angular.json
"security": {
  "autoCsp": true  // Angular 20 auto-generates CSP nonces
}
```

**CSRF protection:**
```typescript
// Angular's HttpClient automatically reads XSRF-TOKEN cookie
// and sends it as X-XSRF-TOKEN header
provideHttpClient(
  withXsrfConfiguration({
    cookieName: 'XSRF-TOKEN',
    headerName: 'X-XSRF-TOKEN'
  })
)
```

**Auth token storage:**
- Never store JWTs in `localStorage` — XSS vulnerable.
- Use `HttpOnly` + `Secure` + `SameSite=Strict` cookies.
- Angular's `HttpInterceptorFn` handles token attachment:
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Cookies are sent automatically — no manual token handling needed
  // Only add custom headers if using bearer tokens in memory
  const token = inject(AuthStore).token();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

**Dependency security:**
- `npm audit` in CI.
- Dependabot/Renovate for automated updates.
- Pin versions, review before upgrading.

**Other:**
- Never hardcode API keys in client code.
- Use `environment.ts` for public config only.
- Subresource Integrity (SRI) for CDN scripts.
- Angular's `DomSanitizer` for any dynamic HTML rendering.

---

## 9. How Would You Set Up a CI/CD Pipeline for an Angular Application?

**Why they ask:** Architects define engineering infrastructure. Angular has specific build/test tooling.

**Model Answer:**

**CI Pipeline (on every PR):**
```
1. Install → cache node_modules (by package-lock.json hash)
2. Type check (ng build --configuration=production --no-emit)
3. Lint (ng lint — ESLint via @angular-eslint)
4. Unit tests (ng test --watch=false --code-coverage) — Jest or Karma
5. Component tests (Angular Testing Library)
6. Accessibility scan (axe-playwright)
7. Build (ng build --configuration=production)
8. Bundle size check (fail if main.js exceeds budget)
9. Lighthouse CI — performance budget checks
10. Visual regression tests (Chromatic for Storybook)
11. Preview deployment (Vercel/Netlify preview URL)
```

**Angular-specific budget enforcement:**
```json
// angular.json
"budgets": [
  { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle", "maximumWarning": "4kB", "maximumError": "8kB" }
]
```
The build fails if bundles exceed these thresholds — built into Angular CLI.

**CD Pipeline (on merge to main):**
```
1. All CI steps pass
2. Build production artifacts (ng build --configuration=production)
3. Deploy to staging → run Playwright E2E suite
4. Smoke tests on staging
5. Deploy to production (blue/green or canary)
6. Feature flags for gradual rollout
7. Automated rollback if error rate spikes
```

**Key practices:**
- Angular CLI's esbuild builder (default in v20) — builds are 2-4x faster than webpack.
- Nx affected commands — only build/test what changed.
- Preview deployments for every PR.
- Trunk-based development with feature flags.

---

## 10. How Do You Approach Testing in Angular Architecture?

**Why they ask:** Architect-level candidates define the testing strategy, not just write tests.

**Model Answer:**

**Testing Trophy for Angular:**
```
        [E2E — Playwright]       — critical user journeys
      [Integration — Testing Library]  ← focus here
    [Unit — Jest/Vitest]         — services, pipes, utils
  [Static — TypeScript + ESLint]  — always on
```

**Testing strategy by layer:**

| Layer | Tool | What to test |
|---|---|---|
| Static | TypeScript strict + @angular-eslint | Type errors, code style |
| Unit | Jest or Vitest | Services, pipes, guards, interceptors, pure functions |
| Component | Angular Testing Library | User interactions, template rendering, signal state |
| Integration | Angular Testing Library + HttpClientTestingModule | Feature flows with mocked APIs |
| E2E | Playwright | Login, checkout, critical business flows |
| Visual | Chromatic | Design system component consistency |
| a11y | jest-axe + axe-playwright | Accessibility violations |

**Testing a Signal-based component (Angular 20):**
```typescript
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

it('should increment counter on click', async () => {
  await render(CounterComponent);

  expect(screen.getByText('Count: 0')).toBeTruthy();

  await userEvent.click(screen.getByRole('button', { name: /increment/i }));

  expect(screen.getByText('Count: 1')).toBeTruthy();
});
```

**Testing a service with resource():**
```typescript
it('should load users', async () => {
  const { fixture } = await render(UserListComponent, {
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
    ]
  });

  const httpTesting = TestBed.inject(HttpTestingController);
  httpTesting.expectOne('/api/users').flush([{ id: 1, name: 'Alice' }]);

  fixture.detectChanges();
  expect(screen.getByText('Alice')).toBeTruthy();
});
```

**Key principle:** Test behavior, not implementation. Don't test that a signal changed — test that the UI updated.

---

## 11. How Do You Structure and Enforce Code Quality at Scale in Angular?

**Why they ask:** Architects set the standards. Angular's opinionated nature helps, but enforcement still needs tooling.

**Model Answer:**

**Quality stack:**
- **TypeScript strict mode** — `strict: true` in tsconfig. Non-negotiable.
- **@angular-eslint** — Angular-specific lint rules (no deprecated APIs, proper lifecycle hooks, template accessibility).
- **Prettier** — formatting is never a code review discussion.
- **Husky + lint-staged** — pre-commit linting.
- **Conventional Commits** — automated changelogs and semantic versioning.

**Angular-specific rules I enforce:**
```json
// .eslintrc.json
{
  "@angular-eslint/prefer-standalone": "error",
  "@angular-eslint/prefer-signals": "warn",
  "@angular-eslint/no-input-rename": "error",
  "@angular-eslint/use-lifecycle-interface": "error",
  "@angular-eslint/prefer-on-push-component-change-detection": "error"
}
```

**Architecture enforcement:**
- `eslint-plugin-boundaries` to prevent cross-feature imports.
- Nx module boundary rules in `project.json` tags.
- ADRs (Architecture Decision Records) for every significant decision.

**Code review culture:**
- PRs < 400 lines. Big PRs get rubber-stamped.
- Review for correctness and architecture, not style (Prettier handles that).
- Automated checks catch 80% of issues before human review.

---

## 12. What Patterns Do You Use for Component Design in Angular?

**Why they ask:** Tests knowledge of advanced Angular patterns beyond basic components.

**Model Answer:**

**1. Signal Inputs + Model Inputs (Angular 20)**
```typescript
@Component({
  selector: 'app-toggle',
  template: `
    <button (click)="checked.set(!checked())">
      {{ checked() ? 'ON' : 'OFF' }}
    </button>
  `
})
export class ToggleComponent {
  // Signal input — read-only from parent
  label = input<string>('Toggle');

  // Model input — two-way binding with parent
  checked = model(false);
}

// Parent usage: <app-toggle [(checked)]="isEnabled" />
```

**2. Content Projection (Angular's compound component pattern)**
```typescript
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <div class="card-header">
        <ng-content select="[card-title]" />
      </div>
      <div class="card-body">
        <ng-content />
      </div>
      <div class="card-footer">
        <ng-content select="[card-actions]" />
      </div>
    </div>
  `
})
export class CardComponent {}

// Usage:
// <app-card>
//   <h3 card-title>User Profile</h3>
//   <p>Card body content here</p>
//   <button card-actions>Save</button>
// </app-card>
```

**3. Directive Composition API (Angular 15+)**
```typescript
@Directive({ selector: '[appTooltip]', standalone: true })
export class TooltipDirective { /* tooltip logic */ }

@Directive({ selector: '[appRipple]', standalone: true })
export class RippleDirective { /* ripple logic */ }

@Component({
  selector: 'app-button',
  hostDirectives: [
    { directive: TooltipDirective, inputs: ['appTooltip'] },
    { directive: RippleDirective }
  ],
  template: `<ng-content />`
})
export class ButtonComponent {}
// Button automatically gets tooltip + ripple behavior
```

**4. Smart/Dumb (Container/Presenter)**
- Smart components: inject services, manage state, handle side effects.
- Dumb components: receive data via `input()`, emit events via `output()`. Pure UI, easy to test in Storybook.

**5. Control Flow (Angular 20 — built-in)**
```html
@if (user(); as user) {
  <app-user-card [user]="user" />
} @else {
  <app-skeleton />
}

@for (item of items(); track item.id) {
  <app-list-item [item]="item" />
} @empty {
  <p>No items found</p>
}

@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <app-error [message]="error()" /> }
  @case ('success') { <app-content [data]="data()" /> }
}
```

**Anti-patterns:**
- Prop drilling beyond 2 levels → use a signal-based service or injection token.
- God components → split by responsibility.
- Using `ngOnChanges` when `computed()` signals would suffice.

---

## 13. How Do You Handle Internationalization (i18n) in Angular?

**Why they ask:** For global products, i18n is architectural. Angular has a unique build-time i18n approach.

**Model Answer:**

Angular offers two approaches — I choose based on the project:

**1. Built-in Angular i18n (build-time — recommended for production)**
```html
<!-- Mark strings for extraction -->
<h1 i18n="@@pageTitle">Welcome to the Dashboard</h1>
<p i18n="@@itemCount">{count, plural,
  =0 {No items}
  =1 {One item}
  other {{{count}} items}
}</p>
```

```bash
# Extract translation file
ng extract-i18n --output-path src/locale

# Build per locale
ng build --localize
```

Produces separate optimized bundles per locale — no runtime overhead. Angular CLI handles it natively.

**2. ngx-translate / Transloco (runtime — for dynamic locale switching)**
```typescript
// Using Transloco (modern alternative to ngx-translate)
@Component({
  template: `
    <h1>{{ t('dashboard.title') }}</h1>
    <p>{{ t('dashboard.itemCount', { count: items().length }) }}</p>
  `,
  providers: [provideTranslocoScope('dashboard')]
})
export class DashboardComponent {
  t = inject(TranslocoService).translate;
}
```

**Key decisions:**
- **Build-time** (Angular i18n): best performance, separate bundles per locale, but requires rebuild per language.
- **Runtime** (Transloco): dynamic switching, single build, but adds bundle size.
- **Lazy load translations** — only load active locale's strings.
- **Namespace by feature** to prevent merge conflicts.

**Beyond strings:**
- **RTL support**: CSS Logical Properties (`margin-inline-start`), `dir="rtl"` on `<html>`.
- **Date/number/currency**: Angular's built-in pipes (`DatePipe`, `CurrencyPipe`, `DecimalPipe`) use `Intl` API and respect locale.
- **Pseudolocalization** in dev to catch hardcoded strings.
- **TMS integration** (Crowdin, Lokalise, Phrase) with CI sync.

---

## 14. How Do You Manage Technical Debt and Architectural Evolution in Angular?

**Why they ask:** Angular's rapid release cycle (every 6 months) means constant evolution. Architects must manage upgrades and debt.

**Model Answer:**

**Angular-specific debt patterns:**
- Legacy NgModules that should be standalone components.
- RxJS-heavy code that could be simplified with Signals.
- Zone.js dependency that should migrate to zoneless.
- Old `@Input()` / `@Output()` decorators → signal inputs/outputs.
- Karma test runner → Jest or Vitest.

**My framework:**

**1. Angular Update Guide**
Use `ng update` and the official [Angular Update Guide](https://angular.dev/update-guide) for every major version. Angular's schematics automate most breaking changes.

```bash
ng update @angular/core @angular/cli
# Schematics automatically migrate deprecated APIs
```

**2. Incremental migration — the Boy Scout Rule**
Every PR that touches a legacy file should include small improvements:
- Convert one NgModule to standalone.
- Replace one `BehaviorSubject` with `signal()`.
- Replace one `*ngIf` with `@if`.

**3. Strangler Fig for major migrations**
- AngularJS → Angular: use `@angular/upgrade` module.
- NgModules → Standalone: gradual, file-by-file.
- Zone.js → Zoneless: enable `provideExperimentalZonelessChangeDetection()`, fix components that rely on Zone.js triggers.

**4. ADRs for every significant decision.**

**5. Measure health:**
- Bundle size trends (Angular CLI budgets).
- Build time trends (esbuild vs webpack migration).
- `ng update` compatibility score.
- Percentage of standalone components vs NgModule-based.

---

## 15. How Do You Think About Frontend Observability and Monitoring in Angular?

**Why they ask:** Architects own production quality. Angular has specific hooks for observability.

**Model Answer:**

**Three pillars:**

**1. Error Monitoring**
- Global error handler:
```typescript
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorService = inject(ErrorReportingService);

  handleError(error: unknown) {
    // Send to Sentry/Datadog
    this.errorService.report(error);
    console.error('Unhandled error:', error);
  }
}

// Register in app.config.ts
{ provide: ErrorHandler, useClass: GlobalErrorHandler }
```
- HTTP error interceptor for API errors:
```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    retry({ count: 2, delay: 1000 }),
    catchError(error => {
      if (error.status === 401) inject(Router).navigate(['/login']);
      if (error.status >= 500) inject(ErrorReportingService).report(error);
      return throwError(() => error);
    })
  );
};
```

**2. Performance Monitoring (RUM)**
- Core Web Vitals from real users via `web-vitals` library.
- Angular-specific: use `afterNextRender` to measure component render time:
```typescript
export class DashboardComponent {
  constructor() {
    const start = performance.now();
    afterNextRender(() => {
      const duration = performance.now() - start;
      analytics.track('dashboard-render', { duration });
    });
  }
}
```

**3. Custom Performance Marks**
```typescript
performance.mark('search-started');
// ... search logic
performance.mark('search-completed');
performance.measure('search-duration', 'search-started', 'search-completed');
```

**Alerting:** Error rate spikes → Slack alert. Core Web Vitals regression → auto-created ticket.

---

## 16. How Do You Approach API Design and Integration in Angular?

**Why they ask:** Architects define the data layer. Angular's `HttpClient` and new `resource()` API are central.

**Model Answer:**

**Architecture:**
```
Components → Signal Store/Service → API Service → HttpClient
```
Components never call `HttpClient` directly.

**API service layer:**
```typescript
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL);

  getUsers(params?: UserQueryParams): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, {
      params: params as any
    });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, data);
  }
}
```

**resource() for declarative data fetching (Angular 20):**
```typescript
@Component({ ... })
export class UserListComponent {
  private api = inject(UserApiService);
  searchQuery = signal('');

  usersResource = rxResource({
    request: () => ({ query: this.searchQuery() }),
    loader: ({ request }) => this.api.getUsers({ search: request.query })
  });

  // Template:
  // @if (usersResource.isLoading()) { <spinner /> }
  // @if (usersResource.error()) { <error /> }
  // @for (user of usersResource.value() ?? []; track user.id) { ... }
}
```

**Interceptors (functional style in Angular 20):**
```typescript
// Auth interceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStore).token();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};

// Logging interceptor
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = Date.now();
  return next(req).pipe(
    tap(() => console.log(`${req.method} ${req.url} — ${Date.now() - start}ms`))
  );
};

// Register
provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]))
```

**Caching:** Use `rxResource` with `shareReplay` or implement stale-while-revalidate in the service layer. For complex caching, consider `@ngneat/cashew` or a custom interceptor cache.

**Contract management:** OpenAPI specs → auto-generate TypeScript types and Angular services with `ng-openapi-gen`.

---

## 17. How Do You Approach Angular Security for Auth Flows?

**Why they ask:** Auth architecture decisions in Angular have specific patterns around guards, interceptors, and token management.

**Model Answer:**

**Recommended auth architecture in Angular 20:**

```typescript
// Functional guard (Angular 20 style)
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  // Store intended URL for redirect after login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// Permission guard
export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthStore);
    return auth.hasPermission(requiredPermission);
  };
};

// Route configuration
const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login.component') },
  {
    path: 'admin',
    canActivate: [authGuard, permissionGuard('admin')],
    loadChildren: () => import('./admin/admin.routes')
  }
];
```

**Token storage:**

| Storage | XSS Risk | CSRF Risk | Recommendation |
|---|---|---|---|
| `localStorage` | HIGH | None | ❌ Avoid |
| `HttpOnly Cookie` | None | Medium | ✅ Preferred |
| Memory (signal) | LOW | None | ✅ Acceptable |

**Silent refresh pattern:**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private refreshTimer?: ReturnType<typeof setTimeout>;

  scheduleRefresh(expiresIn: number) {
    // Refresh 60 seconds before expiry
    const refreshIn = (expiresIn - 60) * 1000;
    this.refreshTimer = setTimeout(() => {
      this.http.post<AuthResponse>('/api/refresh', {}).subscribe({
        next: (res) => {
          this.authStore.setToken(res.token);
          this.scheduleRefresh(res.expiresIn);
        },
        error: () => this.authStore.logout()
      });
    }, refreshIn);
  }
}
```

**OAuth 2.0 with PKCE:** Use `angular-oauth2-oidc` library for OpenID Connect flows. Always Authorization Code + PKCE, never implicit flow.

---

## 18. How Do You Lead and Mentor an Angular Team as an Architect?

**Why they ask:** Architect roles require leadership, influence without authority, and raising team capability.

**Model Answer:**

**1. Technical Vision**
- Define the Angular upgrade roadmap (e.g., "migrate to standalone by Q2, zoneless by Q4").
- Communicate in business terms: "zoneless removes 15KB from our bundle and eliminates unnecessary change detection cycles."

**2. ADRs and RFCs**
- Major decisions (state management approach, SSR strategy, design system tech) go through written RFC → async feedback → decision.

**3. Angular-specific mentoring:**
- Pair programming on complex patterns (custom directives, advanced DI, signal-based architecture).
- Internal workshops: "Migrating from RxJS to Signals", "Zoneless Angular", "Angular 20 New Features".
- Code review as teaching — explain why `OnPush` matters, why `trackBy` prevents re-renders.

**4. Paved roads:**
- Nx generators for scaffolding new features with the right structure:
```bash
nx generate @nx/angular:component --name=user-card --standalone --changeDetection=OnPush
```
- Shared ESLint config enforcing architectural rules.
- Starter templates with auth, routing, error handling pre-configured.

**5. Scaling knowledge:**
- Angular guild for cross-team knowledge sharing.
- Document tribal knowledge — runbooks, architecture diagrams.
- Track DORA metrics: deployment frequency, lead time, change failure rate.

**What makes a great Angular architect:**
- You write code. Architects who don't code lose credibility.
- You make the team faster, not dependent on you.
- You stay current with Angular's 6-month release cycle.

---

## 19. How Do You Handle Browser Compatibility and Cross-Platform in Angular?

**Why they ask:** Tests pragmatic decision-making around polyfills, progressive enhancement, and Angular-specific concerns.

**Model Answer:**

**Angular 20 browser support:**
Angular 20 supports modern evergreen browsers only (Chrome, Firefox, Edge, Safari). IE11 support was dropped in Angular 13.

**Browserslist configuration:**
```
# .browserslistrc
last 2 Chrome versions
last 2 Firefox versions
last 2 Safari versions
last 2 Edge versions
```
Angular CLI uses this to determine polyfills and transpilation targets.

**Polyfills (Angular 20):**
```typescript
// polyfills.ts is minimal now — most APIs are natively supported
// Only add polyfills for specific needs:
import 'zone.js'; // Remove this when going zoneless!
```

**Angular-specific cross-platform:**
- **Angular CDK Platform module** for feature detection:
```typescript
import { Platform } from '@angular/cdk/platform';

export class MyComponent {
  private platform = inject(Platform);

  ngOnInit() {
    if (this.platform.IOS) {
      // iOS-specific handling
    }
  }
}
```

- **SSR compatibility** — use `isPlatformBrowser()` / `isPlatformServer()`:
```typescript
import { PLATFORM_ID, isPlatformBrowser } from '@angular/common';

export class ChartComponent {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit() {
    if (this.isBrowser) {
      // Only run in browser, not during SSR
      this.initChart();
    }
  }
}
```

- **`afterNextRender` / `afterRender`** (Angular 16+) — SSR-safe alternative:
```typescript
export class MapComponent {
  constructor() {
    afterNextRender(() => {
      // Guaranteed to run only in the browser, after DOM is ready
      this.initMap();
    });
  }
}
```

**Testing:** Playwright with Chromium, Firefox, and WebKit engines in CI.

**Mobile concerns:**
- `100vh` issue → use `dvh` CSS units.
- iOS input zoom → `font-size: 16px` minimum on inputs.
- `touch-action: manipulation` to remove 300ms tap delay.

---

## 20. How Do You Make Architectural Decisions and Manage Trade-offs in Angular?

**Why they ask:** Leadership and maturity question. How you decide under uncertainty matters as much as what you decide.

**Model Answer:**

**My decision-making framework:**

**1. Define constraints first**
Team size, Angular version, existing codebase, timeline, performance requirements. The "right" architecture changes based on these.

**2. Angular-specific trade-off examples:**

| Decision | Option A | Option B | How I decide |
|---|---|---|---|
| State management | Signal services | NgRx SignalStore | < 5 devs on feature → signals. Complex state with DevTools need → NgRx. |
| Change detection | OnPush + Signals | Zoneless | Greenfield → zoneless. Existing app → OnPush first, zoneless later. |
| SSR | Full SSR | Prerender + CSR | SEO-critical → SSR. Internal app → CSR. Mixed → incremental hydration. |
| Styling | Component styles | Tailwind | Design system → component styles. Rapid prototyping → Tailwind. |
| Testing | Karma | Jest/Vitest | New project → Jest. Existing Karma → migrate incrementally. |

**3. Reversibility**
- **One-way doors** (framework choice, state management architecture) → prototype first, gather input.
- **Two-way doors** (folder structure, naming conventions) → decide and move.

**4. Prototype critical decisions**
A 2-day spike saves months of regret. Before committing to zoneless, build one feature with it and measure.

**5. Document with ADRs**
```markdown
# ADR-007: Migrate to Zoneless Change Detection

## Status: Accepted

## Context
Our app has 200+ components. Zone.js adds 15KB to bundle and triggers
unnecessary change detection on every setTimeout/setInterval.

## Decision
Migrate to zoneless incrementally. Enable provideExperimentalZonelessChangeDetection()
in app.config.ts. Fix components that rely on Zone.js triggers.

## Consequences
- Smaller bundle size
- Explicit change detection (signals trigger updates)
- Must audit all setTimeout/setInterval usage
- Third-party libraries using Zone.js may need wrappers
```

**6. Communicate and get buy-in**
Present to the team with data. Engineers who understand the "why" become advocates.

**Common Angular trade-offs to be fluent in:**
- Signals vs RxJS (signals for sync state, RxJS for async streams/complex operators).
- Standalone vs NgModules (standalone for new code, NgModules for legacy compatibility).
- Build-time i18n vs runtime i18n (performance vs flexibility).
- esbuild vs webpack (esbuild is default in v20, webpack only for Module Federation).

---

## Quick Reference — Topics by Category

| Category | Questions |
|---|---|
| **Architecture & Design** | 1, 2, 3, 12, 20 |
| **Performance & Signals** | 5, 6 |
| **State Management** | 6 |
| **Design System** | 4 |
| **Testing & Quality** | 10, 11 |
| **Security & Auth** | 8, 17 |
| **DevOps / CI-CD** | 9 |
| **Accessibility** | 7 |
| **Internationalization** | 13 |
| **API / Integration** | 16 |
| **Technical Debt & Upgrades** | 14 |
| **Leadership & Mentoring** | 18 |
| **Cross-browser / Platform** | 19 |
| **Observability** | 15 |

---

*All answers use Angular 20 patterns: standalone-by-default, signal inputs/outputs, `resource()` API, `@defer` blocks, built-in control flow (`@if`, `@for`, `@switch`), functional guards/interceptors, and zoneless change detection. Good luck!*