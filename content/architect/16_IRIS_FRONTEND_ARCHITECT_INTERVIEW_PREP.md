# IRIS Software Group — Frontend Architect Interview Prep
> 50 curated questions with detailed answers
> Stack: Angular · React · NodeJS · AWS Lambda · IRIS Elements Platform

---

## Company Context

- **Platform**: IRIS Elements — migrating legacy VB6/.NET desktop apps to cloud (AWS + Azure)
- **Frontend stack**: Angular, React, .NET Core, NodeJS, AWS Lambda
- **Scale**: 100,000+ customers, 135 countries, accounting · payroll · HR · education SaaS
- **Interview format**: 3 rounds — coding round → technical round → managerial round
- **Difficulty**: Medium–High (debounce, throttle, useMemo/useCallback, Jest, Star Rating component confirmed in Glassdoor reviews)

---

## Top 5 Things to Emphasise in the Interview

1. **You understand the Strangler Fig migration** — IRIS is mid-migration from desktop to cloud; show you've done this before
2. **Micro-frontend architecture fluency** — Module Federation, shell/remote pattern, cross-framework Web Components
3. **Enterprise-scale thinking** — design systems, monorepos, RBAC, i18n, accessibility at architecture level
4. **Performance as a feature** — Core Web Vitals, virtual scrolling, bundle budgets, caching strategy
5. **Angular + React both, not just one** — IRIS uses both; frame your experience across frameworks

---

## Quick Reference: IRIS Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend frameworks | Angular, React |
| Cloud | AWS (Lambda, API Gateway, Cognito), Azure |
| Backend | .NET Core, NodeJS |
| Legacy (being migrated) | VB6, C, C++, .NET + SQL Server |
| CI/CD approach | Secure SDLC, architectural standards, blueprints |
| Design philosophy | Micro-frontends, cloud-native, modular |

---

# Category 1: Architecture (Questions 1–7)

---

## Q1. How would you architect a micro-frontend solution for IRIS Elements — where multiple legacy desktop modules need to become independent web apps?

### Key Talking Points
- Shell + remote pattern using **Webpack Module Federation**
- Each legacy module (payroll, HR, accounts) becomes an independently deployable remote
- Shell handles routing, authentication, and shared layout
- Discuss version-pinning of shared dependencies (React/Angular) to avoid runtime conflicts
- **single-spa** as an orchestrator alternative
- Custom Elements (Web Components) to bridge Angular and React remotes
- Contract testing between teams to prevent integration failures at runtime

### Detailed Answer

The ideal architecture for IRIS Elements is a **shell-and-remote micro-frontend model** powered by Webpack Module Federation. The shell application acts as the orchestrator — it owns the top-level routing, authentication flow, shared navigation chrome, and global layout. Each legacy desktop module (payroll, HR, accounts, education) is migrated into its own independently deployable **remote** application. These remotes expose specific entry-point components that the shell dynamically loads at runtime.

**Why Module Federation?** It allows each team to build, test, and deploy their remote independently. The shell's `remoteEntry.js` manifest tells it where to fetch each remote at runtime, so there's no build-time coupling. This is critical at IRIS scale where 10+ teams need to ship on their own cadence without coordinating monolithic releases.

**Shared dependency management** is the biggest risk. If the shell runs Angular 17 and a remote ships Angular 16, you get runtime conflicts. The solution is to declare shared dependencies in the Module Federation config with `singleton: true` and `requiredVersion` constraints. This ensures only one copy of Angular or React is loaded, and version mismatches are caught at build time rather than crashing in production.

For IRIS's mixed Angular + React portfolio, **Web Components** serve as the bridge layer. A React remote can expose its root component as a Custom Element (`<iris-payroll-dashboard>`), which the Angular shell renders as a native DOM element. This avoids framework coupling entirely — the shell doesn't need to know or care what framework the remote uses internally.

**single-spa** is a viable alternative orchestrator, especially if you need to run multiple frameworks simultaneously on the same page (e.g., an Angular sidebar alongside a React main content area). However, Module Federation is generally preferred because it handles code splitting and shared dependencies more elegantly without requiring a separate runtime orchestration layer.

**Contract testing** between shell and remotes is non-negotiable. Each remote publishes a contract (the props/events its exposed component accepts), and CI runs contract tests to verify the shell's expectations match the remote's actual interface. Tools like Pact or custom schema validation scripts prevent the classic micro-frontend failure mode: a remote deploys a breaking change and the shell discovers it only in production.

The migration itself follows the **Strangler Fig pattern** — route by route, the legacy desktop functionality is replaced by the new web remote. A reverse proxy or feature flag system directs users to either the legacy app or the new micro-frontend based on the route path and user cohort. This allows incremental migration without a risky big-bang cutover.

---

## Q2. IRIS uses both Angular and React across its portfolio. How do you enforce a consistent design system across both frameworks?

### Key Talking Points
- **Design tokens** (CSS custom properties / JSON tokens via Style Dictionary) as single source of truth
- Build framework-agnostic **Web Components** for shared primitives (buttons, inputs, modals)
- **Storybook** as a shared component documentation hub across both frameworks
- Version and publish via **private npm registry**
- Central governance model — a platform team owns tokens, product teams own composition
- Semantic versioning with breaking change policy for consuming teams

### Detailed Answer

Consistency across Angular and React starts with a **single source of truth for design decisions**, and that source is **design tokens**. Tokens are the atomic values — colours, spacing, typography scales, border radii, shadows — expressed as platform-agnostic JSON. A tool like **Style Dictionary** transforms these tokens into CSS custom properties, SCSS variables, TypeScript constants, and even iOS/Android values from one definition file. Every Angular and React app imports the same generated CSS custom properties, so `--iris-color-primary` resolves to the exact same hex value everywhere.

For shared UI primitives (buttons, inputs, modals, date pickers), the most robust approach is **Web Components**. A button built as a Custom Element with Shadow DOM works identically whether it's rendered inside an Angular template or a React JSX tree. The component library is built once using a lightweight framework like Lit or Stencil, published to a **private npm registry** (Artifactory, GitHub Packages, or AWS CodeArtifact), and consumed as a dependency by every product team. This eliminates the problem of maintaining parallel Angular and React versions of the same button.

**Storybook** serves as the living documentation hub. Every component in the design system has Storybook stories showing each visual state: default, hover, focus, disabled, error, loading, and responsive breakpoints. Both Angular and React teams reference the same Storybook instance to understand how components should look and behave. Storybook also integrates with **Chromatic** for automated visual regression testing — any PR that changes a component's appearance is flagged before merge.

The **governance model** matters as much as the tooling. A dedicated platform/design-system team owns the token definitions and primitive components. Product teams own the composition — how they combine primitives into feature-specific UIs. Changes to tokens or primitives go through a review process with semantic versioning. Breaking changes (removing a token, changing a component's API) require a major version bump and a migration guide, giving consuming teams time to adapt.

Publishing follows **semantic versioning** strictly. Patch releases for bug fixes, minor releases for new tokens or components, major releases for breaking changes. The private npm registry hosts the packages, and each product app pins to a specific major version. This prevents a design system update from unexpectedly breaking a payroll dashboard in production.

---

## Q3. Explain how you would migrate a VB6/WinForms desktop application to a modern cloud-based Angular SPA without disrupting live users.

### Key Talking Points
- **Strangler Fig pattern** — route specific URL paths to new Angular app while legacy handles the rest
- Incremental domain-by-domain migration (data entry → reporting → admin)
- **Feature flags** to toggle old vs new experience per user/cohort
- API versioning so both apps can coexist during transition
- Regression testing harness for parity checks between old and new
- Auth token sharing across apps via secure `httpOnly` cookies
- Communicate migration progress via internal RFC / ADR documentation

### Detailed Answer

Migrating a VB6/WinForms desktop application to a cloud-based Angular SPA is a multi-year effort at IRIS scale, and the cardinal rule is **never do a big-bang rewrite**. The proven approach is the **Strangler Fig pattern**: you build the new Angular application alongside the legacy system, incrementally routing users to the new experience domain by domain, until the legacy system has no remaining traffic and can be decommissioned.

**Phase 1: Establish the coexistence infrastructure.** Set up a reverse proxy (or API Gateway) that routes requests based on URL path. Initially, 100% of traffic goes to the legacy app. The Angular SPA is deployed behind the same domain but serves specific routes (e.g., `/reports/` goes to Angular, everything else stays on legacy). This means users experience a seamless transition — they don't know they've crossed from old to new.

**Phase 2: Migrate domain by domain, ordered by business value and risk.** Start with a low-risk, high-visibility domain like **reporting** — it's read-only, so there's no risk of data corruption, and it gives users an immediate visual upgrade. Next, tackle **data entry forms** (client onboarding, invoice creation), which are more complex but high-value. Save **admin and configuration** screens for last — they're used by fewer people and are often the most tangled with legacy business logic.

**Feature flags** (LaunchDarkly, AWS AppConfig, or a simple database-backed toggle) control which users see the new experience. Roll out to internal users first, then a 5% canary group, then gradually increase. If a critical bug surfaces, flip the flag and users are back on legacy instantly — no rollback deployment needed.

**API versioning** is essential during coexistence. The legacy app likely talks to stored procedures or a tightly coupled backend. The new Angular app needs clean REST or GraphQL APIs. Version the APIs (`/api/v1/` for legacy, `/api/v2/` for Angular) so both apps can coexist without one breaking the other. The v2 APIs can initially be thin wrappers around the same database, evolving independently over time.

**Authentication sharing** between legacy and new apps uses secure `httpOnly` cookies scoped to the shared domain. When a user logs in via the legacy app, the auth cookie is available to the Angular app on the same domain, and vice versa. This prevents users from having to log in twice as they navigate between old and new sections.

**Regression testing** ensures feature parity. Build a test harness that runs the same business scenarios against both the legacy and new implementations, comparing outputs. For a payroll calculation, the same inputs should produce the same payslip in both systems. Automated parity tests catch discrepancies before users do.

Document every migration decision in **Architecture Decision Records (ADRs)** committed to the repo. These explain *why* a domain was migrated in a particular order, what tradeoffs were made, and what the rollback plan is. This is critical institutional knowledge for a multi-year migration.

---

## Q4. Describe your approach to monorepo vs polyrepo for an enterprise frontend like IRIS with 10+ product teams.

### Key Talking Points
- **Monorepo (Nx or Turborepo)** is preferred at IRIS scale
- Shared libs, consistent tooling, atomic commits across app/lib boundaries
- Nx supports Angular + React in the same workspace
- **Affected-builds** ensure CI only rebuilds what changed — saves time at scale
- Nx module boundary lint rules enforce architectural constraints
- Polyrepo gives team autonomy but creates coordination overhead and version drift
- Recommended: monorepo for shared UI library + separate deployment pipelines per product vertical

### Detailed Answer

For an enterprise like IRIS with 10+ product teams, a **monorepo using Nx** is the stronger choice. The core advantage is **consistency at scale**: shared ESLint configs, shared TypeScript configs, shared design system libraries, and atomic commits that span application and library boundaries. When a design token changes, the PR updates the token definition *and* every consuming component in a single commit — no cross-repo coordination needed.

**Nx** is particularly well-suited to IRIS because it natively supports **Angular and React in the same workspace**. A single Nx monorepo can contain Angular apps (payroll dashboard), React apps (HR portal), shared TypeScript libraries (API clients, utility functions), and the design system — all with consistent build tooling.

The scalability concern with monorepos is CI time. Nx solves this with **affected builds**: when a PR changes a shared library, Nx's dependency graph determines which apps actually consume that library and only rebuilds/retests those. A change to the payroll-specific module doesn't trigger a rebuild of the HR app. This keeps CI times manageable even with hundreds of projects in the workspace.

**Module boundary lint rules** are Nx's architectural enforcement mechanism. You tag projects by scope (e.g., `scope:payroll`, `scope:shared`, `scope:hr`) and define rules like "payroll apps can import shared libs but never HR libs." These rules run as ESLint checks, so architectural violations are caught in the developer's editor and in CI — not discovered months later during a production incident.

The polyrepo alternative gives teams full autonomy — each team owns their repo, their CI pipeline, their dependency versions. But at IRIS scale, this creates **version drift** (team A uses Angular 16, team B uses Angular 17), **coordination overhead** (updating a shared library requires PRs across 10 repos), and **inconsistency** (each team configures ESLint differently). These costs compound over time.

The **recommended hybrid** for IRIS: a monorepo for the shared platform layer (design system, auth library, API clients, shared utilities) with Nx managing the workspace. Individual product verticals (payroll, HR, accounts) can have their own deployment pipelines within the monorepo, triggered only when their code or dependencies change. This gives teams deployment autonomy while maintaining shared infrastructure consistency.

---

## Q5. How would you implement a federated authentication system across multiple micro-frontends in the IRIS Elements platform?

### Key Talking Points
- Centralise auth in the **shell** — OAuth2 / OpenID Connect via AWS Cognito or equivalent
- Access tokens stored **in memory** (not localStorage) to prevent XSS attacks
- Refresh tokens in `httpOnly` cookies
- Shell propagates user context to remotes via a shared auth service (npm lib) or custom event bus
- Each remote only *consumes* tokens — never handles the login flow
- Token expiry handled in shell with **silent refresh**
- Critical: payroll/financial data means auth security is non-negotiable

### Detailed Answer

In a micro-frontend architecture, authentication **must be centralised in the shell application**. The shell owns the entire login/logout flow using **OAuth2 / OpenID Connect** with a provider like **AWS Cognito** (which IRIS already uses). No remote application should ever implement its own login screen or directly interact with the identity provider.

**Token storage is the most critical security decision.** Access tokens are stored **in memory** (a JavaScript variable in the shell's auth service) — never in `localStorage` or `sessionStorage`, which are vulnerable to XSS attacks. Since IRIS handles payroll and financial data, a stolen access token could expose salary information, tax records, and bank details. In-memory storage means the token is lost on page refresh, which is acceptable because refresh tokens handle session continuity.

**Refresh tokens** are stored in `httpOnly`, `Secure`, `SameSite=Strict` cookies. These cookies are inaccessible to JavaScript (preventing XSS theft) and are only sent to the auth server's token endpoint (preventing CSRF). When the in-memory access token expires, the shell makes a **silent refresh** call — an invisible iframe or background fetch to the token endpoint with the refresh cookie — and receives a new access token without interrupting the user.

**Propagating auth context to remotes** is done via a shared npm library (`@iris/auth`). This library exposes methods like `getAccessToken()`, `getCurrentUser()`, `hasPermission(scope)`, and `onTokenRefresh(callback)`. The shell initialises this library with the token, and remotes import it as a shared singleton (via Module Federation's `shared` config). Every remote calls `getAccessToken()` to attach the Bearer token to its API requests — it never knows or cares how the token was obtained.

An alternative propagation mechanism is a **custom event bus**. The shell dispatches a `CustomEvent` on the `window` object when the token refreshes, and remotes listen for it. This is framework-agnostic and works even if a remote can't share the npm library (e.g., a legacy iframe embed).

**Token expiry handling** is proactive. The shell sets a timer to refresh the token *before* it expires (e.g., at 75% of the token's TTL). This prevents the scenario where a remote makes an API call with an expired token and gets a 401. If the refresh fails (e.g., the refresh token itself has expired), the shell redirects to the login page.

**Logout** is coordinated: the shell clears the in-memory token, revokes the refresh token with the identity provider, clears the `httpOnly` cookie, and broadcasts a logout event to all remotes so they can clear any cached user-specific data.

---

## Q6. What is your strategy for state management across a large-scale Angular application that has grown to 50+ feature modules?

### Key Talking Points
- **NgRx** for global state (user session, permissions, shared filters)
- Feature stores scoped to **lazy-loaded modules** to reduce initial bundle
- **Facade pattern** to abstract store implementation from components
- Selector memoisation via `createSelector` for performance
- Avoid over-centralising — local component state for UI-only state (open/closed, form values)
- CQRS-style: commands update state, queries read via selectors
- Regular audits to prevent "state bloat" in long-lived enterprise apps

### Detailed Answer

At 50+ feature modules, state management needs a clear **layered strategy** — not everything belongs in a global store, and not everything should be local component state. The key is matching the state's scope to the right management layer.

**Layer 1: Global state with NgRx.** This is for data that multiple feature modules need simultaneously: the authenticated user session, permissions/roles, organisation-level settings, and shared filters (e.g., a date range selector that affects multiple dashboard widgets). NgRx provides a predictable, debuggable state container with time-travel debugging via Redux DevTools. Actions describe *what happened*, reducers describe *how state changes*, and effects handle side effects (API calls, WebSocket messages).

**Layer 2: Feature stores scoped to lazy-loaded modules.** Each feature module (payroll, HR, accounts) gets its own NgRx feature store, registered with `StoreModule.forFeature()`. This store is only loaded when the user navigates to that module, keeping the initial bundle lean. The payroll feature store manages payroll-specific state (current pay run, employee list, calculation results) that no other module needs. When the user navigates away, the feature state can optionally be cleared to free memory.

**Layer 3: Component-local state.** UI-only state — whether a dropdown is open, a form field's current value before submission, a loading spinner's visibility — stays in the component. Putting this in NgRx creates unnecessary boilerplate and makes the store noisy. Angular Signals (v16+) or simple class properties handle this cleanly.

The **Facade pattern** is essential at scale. Each feature module exposes a facade service (e.g., `PayrollFacade`) that encapsulates all store interactions. Components inject the facade and call methods like `facade.loadPayRun(id)` and read observables like `facade.currentPayRun$`. Components never directly dispatch actions or create selectors — this means the underlying state management implementation can change (e.g., migrating from NgRx to Angular Signals) without touching any component code.

**Selector memoisation** via `createSelector` is critical for performance. Selectors are pure functions that derive data from the store. NgRx memoises them — if the input state hasn't changed, the selector returns the cached result without recomputation. For a payroll dashboard that derives totals, averages, and filtered lists from raw employee data, memoised selectors prevent expensive recalculations on every change detection cycle.

The architecture follows a **CQRS-style separation**: commands (actions) flow in one direction to update state, and queries (selectors) flow in the other direction to read state. This makes data flow predictable and debuggable — you can trace any UI state back to the action that caused it.

**Regular state audits** prevent "state bloat" — the tendency for enterprise apps to accumulate stale state over years. Quarterly reviews check: Is this state still used? Could this feature state be local instead of global? Are there selectors that no component subscribes to? Pruning unused state keeps the store maintainable.

---

## Q7. How do you maintain consistent code quality and architectural standards across 10+ frontend teams at IRIS?

### Key Talking Points
- Shared **ESLint config** published as npm package consumed by all apps
- Nx module boundary rules — lint enforces that shared libs never import app code
- **Architecture Decision Records (ADRs)** committed to repo alongside code
- Inner-source model: product teams contribute to shared platform repo via reviewed PRs
- RFC process for significant architectural changes
- Automated: **bundle size budgets** fail CI if exceeded
- Architecture guild meetings for cross-team alignment

### Detailed Answer

Consistency across 10+ teams requires a combination of **automated enforcement** and **cultural practices**. Automation catches violations before they reach production; culture ensures teams understand and buy into the standards.

**Automated enforcement starts with a shared ESLint configuration** published as an npm package (`@iris/eslint-config`). Every app and library in the monorepo extends this config. It enforces coding standards (naming conventions, import ordering, no unused variables), Angular-specific rules (lifecycle hook ordering, OnPush enforcement for presentational components), and React-specific rules (hooks rules, exhaustive deps). Because it's a versioned npm package, updates are rolled out centrally and consumed by all teams on their next dependency update.

**Nx module boundary rules** enforce architectural constraints at the lint level. Projects are tagged by type (`type:app`, `type:feature-lib`, `type:shared-lib`, `type:util-lib`) and scope (`scope:payroll`, `scope:hr`, `scope:shared`). Rules like "apps can import feature-libs and shared-libs, but feature-libs cannot import apps" and "payroll-scoped libs cannot import hr-scoped libs" are defined in `.eslintrc.json` and enforced in every developer's editor and in CI. This prevents the architectural erosion that happens when teams take shortcuts.

**Bundle size budgets** are configured in `angular.json` (for Angular apps) or webpack config (for React apps). CI fails if the initial bundle exceeds the defined threshold (e.g., 200KB). This prevents teams from accidentally importing a heavy library or creating a barrel import that pulls in the entire shared library. The budget acts as an early warning system for performance regressions.

**Architecture Decision Records (ADRs)** are committed to the repository alongside the code they describe. When a team makes a significant architectural choice (choosing NgRx over Akita, adopting standalone components, switching from REST to GraphQL for a specific domain), they write an ADR explaining the context, the decision, the alternatives considered, and the consequences. Future developers (and future selves) can understand *why* the codebase looks the way it does.

The **RFC (Request for Comments) process** governs significant architectural changes that affect multiple teams. Before a team introduces a new shared library, changes the authentication flow, or adopts a new build tool, they write an RFC document, share it with the architecture guild, and incorporate feedback before implementation. This prevents teams from making isolated decisions that create inconsistencies.

An **inner-source model** governs the shared platform repository (design system, auth library, shared utilities). Any product team can contribute via pull request, but changes are reviewed by the platform team to ensure they meet quality and consistency standards. This balances team autonomy with platform integrity.

**Architecture guild meetings** (bi-weekly or monthly) bring together a representative from each team to discuss cross-cutting concerns, review RFCs, share learnings, and align on upcoming changes. These meetings are where cultural alignment happens — teams understand not just *what* the standards are, but *why* they exist.

---


# Category 2: React / Angular (Questions 8–12)

---

## Q8. IRIS Glassdoor interviews specifically mention useMemo and useCallback. When would you use each, and when is it premature optimisation?

### Key Talking Points
- `useMemo` — memoises a **computed value**; use when calculation is expensive (sorting/filtering large lists, e.g. a 500-client accounting list)
- `useCallback` — stabilises a **function reference**; use when passing a callback to a child wrapped in `React.memo`
- Anti-pattern: wrapping *every* function/value — the cost of memoisation itself can outweigh savings
- Profile with **React DevTools Profiler** before optimising
- In enterprise apps, premature memo is common tech debt that obscures real bottlenecks
- Rule of thumb: measure first, memo second

### Detailed Answer

`useMemo` and `useCallback` are both memoisation hooks, but they memoize different things and serve different purposes.

**`useMemo`** memoises a **computed value**. It takes a factory function and a dependency array, and only recomputes the value when a dependency changes. The classic use case is an expensive computation — sorting, filtering, or aggregating a large dataset. In an IRIS context, imagine a component that receives a list of 500 clients and needs to filter them by status and sort by name. Without `useMemo`, this filter-and-sort runs on every render, even if the client list and filter criteria haven't changed:

```jsx
// Good use of useMemo — expensive computation with stable inputs
const filteredClients = useMemo(() => {
  return clients
    .filter(c => c.status === activeFilter)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [clients, activeFilter]);
```

**`useCallback`** memoises a **function reference**. It returns the same function object between renders as long as its dependencies haven't changed. This matters when you pass a callback to a child component wrapped in `React.memo`. Without `useCallback`, the parent creates a new function object on every render, which breaks `React.memo`'s shallow comparison and causes the child to re-render unnecessarily:

```jsx
// Good use of useCallback — stabilises reference for memoised child
const handleSelect = useCallback((clientId) => {
  setSelectedClient(clientId);
}, []);

return <ClientList clients={filteredClients} onSelect={handleSelect} />;
// ClientList is wrapped in React.memo
```

**When it's premature optimisation:** Wrapping every value in `useMemo` and every function in `useCallback` is an anti-pattern. Memoisation itself has a cost — React must store the previous value, compare dependencies on every render, and manage the cache. For cheap computations (adding two numbers, concatenating a string) or components that aren't wrapped in `React.memo`, the memoisation overhead exceeds the savings.

The **rule of thumb** is: profile first, optimise second. Use the **React DevTools Profiler** to identify which components are re-rendering unnecessarily and which renders are actually slow. If a component renders in 0.5ms, memoising its props saves nothing perceptible. If a component renders in 50ms because it processes a large dataset, `useMemo` is justified.

In enterprise codebases, premature memoisation is common tech debt. Developers add `useMemo`/`useCallback` defensively "just in case," which makes the code harder to read and maintain without providing measurable performance benefit. A better default is to write clean, unmemoised code and add memoisation surgically where profiling reveals actual bottlenecks.

---

## Q9. Explain Angular Change Detection strategies and when you'd switch from Default to OnPush in a data-heavy payroll dashboard.

### Key Talking Points
- **Default**: CD runs for every event/async operation app-wide — safe but expensive
- **OnPush**: CD only runs when inputs change by reference, an event originates from the component, or an observable emits via `async` pipe
- For a payroll grid with thousands of rows, OnPush + immutable data updates drastically reduces render cycles
- Pair with `trackBy` in `*ngFor` to prevent DOM node recreation on list reorder
- Use `ChangeDetectorRef.markForCheck()` when manually triggering detection is needed
- Key win: significantly reduces CPU usage on complex IRIS dashboards with live data

### Detailed Answer

Angular's change detection (CD) is the mechanism that keeps the DOM in sync with component state. Understanding its two strategies is essential for building performant dashboards at IRIS scale.

**Default strategy** checks every component in the component tree from root to leaf on every browser event (click, keypress, timer, HTTP response, Promise resolution). Angular walks the entire tree, compares every template binding's current value to its previous value, and updates the DOM where differences are found. This is safe — it guarantees the UI is always in sync — but expensive. On a payroll dashboard with hundreds of components, a single button click triggers change detection across the entire tree, even for components whose data hasn't changed.

**OnPush strategy** tells Angular: "Only check this component when one of three things happens":
1. An `@Input()` property changes **by reference** (not by mutation)
2. An event originates **from this component or its children** (click, keypress, etc.)
3. An observable bound via the `async` pipe emits a new value

This dramatically reduces the number of components checked on each CD cycle. For a payroll grid displaying 1,000 employee rows, switching to OnPush means Angular skips checking all 1,000 row components unless their specific input data has changed.

**The key requirement for OnPush is immutable data updates.** Instead of mutating an array (`employees.push(newEmployee)`), you create a new array (`employees = [...employees, newEmployee]`). This changes the reference, which triggers OnPush detection. If you mutate in place, the reference stays the same and Angular won't detect the change — a common source of bugs when adopting OnPush.

**`trackBy` in `*ngFor`** complements OnPush for list rendering. Without `trackBy`, Angular destroys and recreates DOM nodes when the list reference changes, even if the items are the same. With `trackBy`, Angular matches items by a unique identifier (e.g., employee ID) and only updates DOM nodes for items that actually changed:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngFor="let emp of employees; trackBy: trackByEmployeeId">
      {{ emp.name }} — {{ emp.salary | currency }}
    </div>
  `
})
export class PayrollGridComponent {
  @Input() employees: Employee[] = [];

  trackByEmployeeId(index: number, emp: Employee): number {
    return emp.id;
  }
}
```

**`ChangeDetectorRef.markForCheck()`** is the escape hatch. If a component receives data through a mechanism that OnPush doesn't automatically detect (e.g., a WebSocket message handled in a service, not via `async` pipe), you inject `ChangeDetectorRef` and call `markForCheck()` to tell Angular to include this component in the next CD cycle.

For IRIS's payroll dashboards with live data feeds, the recommended pattern is: **OnPush everywhere, data flows through observables consumed via `async` pipe, immutable state updates from NgRx selectors.** This combination minimises CD cycles and keeps CPU usage low even on complex dashboards with real-time updates.

---

## Q10. IRIS interviews ask about Higher Order Components. Compare HOCs, Render Props, and Hooks — when would you pick each?

### Key Talking Points
- **HOCs**: wrap a component to inject props (auth guard, analytics, logging). Risk: prop naming collision, wrapper hell in DevTools
- **Render props**: pass render logic as a prop — more explicit but verbose JSX
- **Hooks**: composable, colocate logic, no JSX nesting overhead — **preferred in modern React**
- HOCs still valid for cross-cutting concerns like error boundaries and route guards
- In IRIS's codebase, HOCs likely persist in older React modules currently being migrated — be ready to reason about both
- Custom hooks follow the same composition principle as HOCs but are far more readable

### Detailed Answer

All three patterns solve the same fundamental problem: **sharing stateful logic between components without duplicating code.** They evolved chronologically (HOCs → Render Props → Hooks), and each has a sweet spot.

**Higher Order Components (HOCs)** are functions that take a component and return a new component with additional props injected. The classic example is an auth guard:

```jsx
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const user = useAuth();
    if (!user) return <Redirect to="/login" />;
    return <WrappedComponent {...props} user={user} />;
  };
}

const ProtectedDashboard = withAuth(Dashboard);
```

HOCs excel at **cross-cutting concerns** — authentication, analytics tracking, error boundaries, logging — where the same logic wraps many different components. However, they have drawbacks: **prop naming collisions** (two HOCs might both inject a `data` prop), **wrapper hell** in React DevTools (deeply nested `withAuth(withTheme(withAnalytics(Component)))`), and **static composition** (HOCs are applied at definition time, not render time).

**Render Props** pass a function as a prop (or children) that receives shared state and returns JSX. This makes the data flow explicit:

```jsx
<MouseTracker>
  {({ x, y }) => <Tooltip position={{ x, y }}>Hover info</Tooltip>}
</MouseTracker>
```

Render props are more explicit than HOCs — you can see exactly what data flows where. But they create **callback nesting** in JSX when composing multiple render prop components, making the code hard to read.

**Hooks** are the modern solution and the **preferred pattern for new React code**. Custom hooks extract stateful logic into reusable functions that compose naturally:

```jsx
function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => { /* fetch user */ }, []);
  return user;
}

function useMouse() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => { /* track mouse */ }, []);
  return position;
}

// Clean composition — no nesting, no prop collisions
function Dashboard() {
  const user = useAuth();
  const mouse = useMouse();
  // ...
}
```

Hooks colocate logic with the component that uses it, compose without nesting, and avoid prop naming collisions because you control the variable names. They follow the same composition principle as HOCs but are far more readable and debuggable.

**When to pick each:**
- **Hooks**: default choice for all new code. Stateful logic reuse, side effects, subscriptions.
- **HOCs**: still valid for wrapping entire component trees (error boundaries, route-level guards, analytics wrappers). Also necessary when you need to modify the component at definition time rather than render time.
- **Render Props**: rarely needed in new code, but useful when you need to pass render control to a library component (e.g., some headless UI libraries use this pattern).

In IRIS's codebase, older React modules likely use HOCs extensively. During migration, the pattern is to extract HOC logic into custom hooks and gradually replace `withAuth(Component)` with `useAuth()` inside the component. This is a low-risk refactor that improves readability without changing behaviour.

---

## Q11. Walk through how you'd build a Star Rating component (mentioned in IRIS Glassdoor reviews) that is accessible, reusable, and testable.

### Key Talking Points
- Controlled component with `value` + `onChange` props — no internal hidden state
- **Keyboard navigation**: arrow keys update rating, Tab moves focus between components
- **ARIA**: `role="radiogroup"` on the container, individual `<input type="radio">` for screen readers
- CSS-only star visuals using `:hover` sibling selectors, no JS needed for styling
- **Storybook** stories for each state: empty, half, full, disabled, read-only
- Jest unit tests: keyboard interaction, onChange firing, correct value passed
- Playwright/Cypress for visual regression

### Detailed Answer

A Star Rating component is deceptively simple visually but requires careful attention to accessibility, keyboard interaction, and API design to be production-ready.

**Component API design — controlled component pattern:**

```tsx
interface StarRatingProps {
  value: number;              // Current rating (0-5)
  onChange?: (value: number) => void;  // Callback when user selects
  max?: number;               // Maximum stars (default 5)
  disabled?: boolean;         // Prevent interaction
  readOnly?: boolean;         // Display only, no interaction
  size?: 'sm' | 'md' | 'lg'; // Visual size variant
  label: string;              // Accessible label (required)
}
```

The component is **controlled** — the parent owns the `value` and the component calls `onChange` when the user selects a rating. No internal hidden state means the component is predictable and testable.

**Accessibility is the core architectural decision.** The star rating is semantically a **radio group** — the user selects one value from a set of options. The implementation uses real `<input type="radio">` elements, visually hidden but accessible to screen readers:

```tsx
function StarRating({ value, onChange, max = 5, disabled, readOnly, label }: StarRatingProps) {
  return (
    <fieldset
      role="radiogroup"
      aria-label={label}
      className="star-rating"
      disabled={disabled}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <label key={star} className="star-rating__label">
          <input
            type="radio"
            name="rating"
            value={star}
            checked={value === star}
            onChange={() => onChange?.(star)}
            disabled={disabled || readOnly}
            className="sr-only" // visually hidden
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          />
          <StarIcon filled={star <= value} />
        </label>
      ))}
    </fieldset>
  );
}
```

**Keyboard navigation** comes free with native radio inputs. Arrow keys move between options, Space/Enter selects, and Tab moves focus to the next form element. No custom keyboard handling needed — the browser handles it because we used semantic HTML.

**CSS-only hover effects** use sibling selectors. When hovering over the third star, stars 1–3 highlight. This is achieved with CSS `:hover` and general sibling combinators, keeping the JS layer clean:

```scss
.star-rating__label:hover ~ .star-rating__label .star-icon {
  fill: var(--iris-color-neutral-300); // dim stars after hovered one
}
.star-rating__label:hover .star-icon,
.star-rating__label:hover ~ .star-rating__label:hover .star-icon {
  fill: var(--iris-color-warning-400); // highlight on hover
}
```

**Storybook stories** document every state: empty (0 stars), partial (3 of 5), full (5 of 5), disabled, read-only, hover interaction, keyboard focus, and different sizes. Each story is a visual test case and a living documentation entry.

**Testing strategy:**
- **Unit tests (Jest + Testing Library):** Click a star → verify `onChange` called with correct value. Keyboard arrow right → verify focus moves. Disabled state → verify `onChange` not called. Read-only state → verify no interaction.
- **Accessibility tests:** `jest-axe` to verify no ARIA violations. Verify screen reader announces "3 of 5 stars" correctly.
- **Visual regression (Playwright/Chromatic):** Screenshot each Storybook story, detect pixel-level changes on PRs.

---

## Q12. How does React's reconciliation algorithm (diffing) work, and what are its implications for rendering large lists in an accounting grid?

### Key Talking Points
- React diffs the virtual DOM tree by **element type + key** — type mismatch = full remount
- Without stable keys, list reorder triggers full DOM remount (expensive for 500-row grids)
- Use **stable IDs** (not array index) as keys in transaction/client grids
- For large datasets: **windowing** via `react-window` or `@tanstack/react-virtual` — renders only visible rows
- Optimistic updates for UX; React 18 **automatic batching** reduces renders for concurrent state updates
- Fibre architecture allows React to pause/resume render work — key for keeping IRIS dashboards responsive

### Detailed Answer

React's reconciliation algorithm is how React determines the minimum set of DOM operations needed to update the UI after a state change. Understanding it is critical for building performant data grids at IRIS scale.

**The diffing algorithm works in two phases:**

1. **Element type comparison:** React compares the old and new virtual DOM trees node by node. If the element type changes (e.g., `<div>` becomes `<span>`, or `<ClientRow>` becomes `<InvoiceRow>`), React **destroys the entire old subtree** and builds a new one from scratch. This is expensive — all child components unmount, lose their state, and remount. If the type is the same, React keeps the DOM node and only updates changed attributes/props.

2. **List reconciliation with keys:** When React encounters a list of children, it uses the `key` prop to match old and new items. Without keys (or with array index as keys), React can't tell if items were reordered, inserted, or removed — it falls back to updating each position sequentially, which causes unnecessary DOM mutations and state loss.

**The key problem with accounting grids:** An IRIS transaction grid might display 500 rows. If the user sorts by date and React uses array indices as keys, React sees that position 0 changed from "Transaction A" to "Transaction Z" and updates every single row's DOM — 500 DOM updates for a sort operation. With stable keys (transaction IDs), React recognises that the same items exist in a different order and simply moves DOM nodes — far cheaper.

```jsx
// Bad — array index as key, causes full re-render on sort/filter
{transactions.map((tx, index) => (
  <TransactionRow key={index} data={tx} />
))}

// Good — stable ID as key, enables efficient reorder
{transactions.map((tx) => (
  <TransactionRow key={tx.id} data={tx} />
))}
```

**Virtualisation for large datasets:** Even with optimal keys, rendering 500+ DOM nodes is expensive. The solution is **windowing** (also called virtualisation) — only render the rows currently visible in the viewport, plus a small buffer above and below. Libraries like `@tanstack/react-virtual` or `react-window` handle this:

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

function TransactionGrid({ transactions }) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // row height in px
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <TransactionRow
            key={transactions[virtualRow.index].id}
            data={transactions[virtualRow.index]}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          />
        ))}
      </div>
    </div>
  );
}
```

This renders only ~15–20 visible rows instead of 500, reducing DOM node count by 95%+ and keeping scroll performance smooth.

**React 18's Fiber architecture** adds another layer of optimisation. Fiber allows React to **pause and resume render work**, splitting a large render into chunks that yield to the browser between frames. Combined with `startTransition`, a sort operation on 500 rows can be marked as low-priority, keeping the UI responsive to user input while the re-render happens in the background. **Automatic batching** in React 18 also reduces renders — multiple `setState` calls in the same event handler are batched into a single render, which is particularly valuable for dashboard components that update multiple pieces of state simultaneously.

---


# Category 3: JavaScript (Questions 13–17)

---

## Q13. Implement debounce and throttle from scratch — both were asked in IRIS frontend interviews.

### Key Talking Points
- **Debounce** — delays execution until N ms after the *last* call. Use case: search input, form auto-save.
- **Throttle** — executes at most once per N ms. Use case: scroll handler, window resize.
- Mention leading/trailing edge variants if asked
- In React: wrap in `useCallback` to prevent recreating on every render

### Detailed Answer

Debounce and throttle are both rate-limiting techniques, but they behave differently and suit different use cases.

**Debounce** delays execution until the user *stops* performing an action for a specified duration. Every new call resets the timer. This is ideal for search inputs — you don't want to fire an API call on every keystroke, only after the user pauses typing.

```javascript
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Usage: search input
const searchInput = document.getElementById('search');
const handleSearch = debounce((event) => {
  fetchResults(event.target.value);
}, 300);
searchInput.addEventListener('input', handleSearch);
```

How it works step by step: User types "p" → timer starts (300ms). User types "a" at 100ms → previous timer cleared, new timer starts. User types "y" at 200ms → previous timer cleared, new timer starts. User stops typing → 300ms passes → `fetchResults("pay")` fires once.

**Throttle** ensures a function executes at most once per time interval, regardless of how many times it's called. This is ideal for scroll handlers and resize events where you want regular updates but not on every pixel of movement.

```javascript
function throttle(fn, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

// Usage: scroll handler
const handleScroll = throttle(() => {
  updateScrollPosition(window.scrollY);
}, 100);
window.addEventListener('scroll', handleScroll);
```

**Leading vs trailing edge variants:**

The basic debounce above is **trailing edge** — it fires after the delay. A **leading edge** debounce fires immediately on the first call, then ignores subsequent calls until the delay passes:

```javascript
function debounceLeading(fn, delay) {
  let timer;
  return function (...args) {
    if (!timer) {
      fn.apply(this, args); // fire immediately
    }
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; }, delay);
  };
}
```

The basic throttle above is **leading edge** — it fires on the first call. A **trailing edge** throttle ensures the last call within the interval also fires:

```javascript
function throttleWithTrailing(fn, limit) {
  let lastCall = 0;
  let trailingTimer;
  return function (...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);
    clearTimeout(trailingTimer);
    if (remaining <= 0) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      trailingTimer = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

**In React**, wrap debounced/throttled functions in `useCallback` (or `useMemo`) to prevent recreating them on every render:

```jsx
const debouncedSearch = useCallback(
  debounce((term) => fetchResults(term), 300),
  [] // stable reference across renders
);
```

**When to use which:**
- **Debounce**: search input, form auto-save, window resize (final size), API calls triggered by user input
- **Throttle**: scroll position tracking, drag-and-drop, mousemove handlers, real-time analytics events

---

## Q14. Explain JavaScript's event loop, microtask queue, and macrotask queue with a practical example from frontend rendering.

### Key Talking Points
- **Call stack**: executes synchronous code
- **Microtasks** (`Promise.then`, `queueMicrotask`, `MutationObserver`): run after *each task*, before the browser renders — highest priority async
- **Macrotasks** (`setTimeout`, `setInterval`, I/O callbacks): scheduled after current task completes
- Practical example: a Promise resolving inside a click handler runs *before* the next `setTimeout`
- In React 18: `startTransition` schedules state updates as **low-priority macrotasks**, keeping input and typing responsive
- IRIS relevance: understanding this explains why heavy data processing in a `then()` can block rendering — use `scheduler.yield()` or chunked processing

### Detailed Answer

The event loop is the mechanism that allows JavaScript to be single-threaded yet non-blocking. Understanding its execution order is essential for debugging async behaviour and preventing UI jank in data-heavy IRIS dashboards.

**The execution model has four key components:**

1. **Call Stack**: Where synchronous code executes. Functions are pushed onto the stack when called and popped when they return. JavaScript processes one stack frame at a time — it's single-threaded.

2. **Microtask Queue**: Holds callbacks from `Promise.then/catch/finally`, `queueMicrotask()`, and `MutationObserver`. Microtasks are processed **after the current task completes but before the browser renders or processes the next macrotask**. Critically, the engine drains the *entire* microtask queue before moving on — if a microtask enqueues another microtask, that runs too.

3. **Macrotask Queue**: Holds callbacks from `setTimeout`, `setInterval`, `setImmediate` (Node), I/O callbacks, and UI events (clicks, keypresses). One macrotask is processed per event loop iteration.

4. **Render Step**: Between macrotasks, the browser may run style calculations, layout, and paint — but only if the microtask queue is empty and the browser determines a repaint is needed (typically at 60fps / every ~16ms).

**The event loop cycle:**
```
1. Execute the current macrotask (or initial script)
2. Drain ALL microtasks
3. Browser may render (style → layout → paint)
4. Pick next macrotask from queue → go to step 1
```

**Practical example — predicting execution order:**

```javascript
console.log('1: sync');

setTimeout(() => console.log('2: macrotask'), 0);

Promise.resolve().then(() => console.log('3: microtask'));

queueMicrotask(() => console.log('4: microtask'));

console.log('5: sync');
```

Output:
```
1: sync
5: sync
3: microtask
4: microtask
2: macrotask
```

Synchronous code (1, 5) runs first on the call stack. Then the microtask queue drains (3, 4). Finally, the macrotask (2) runs in the next event loop iteration.

**Why this matters for IRIS dashboards:**

If you process a large payroll dataset inside a `.then()` callback, that microtask blocks the render step. The browser can't paint until the microtask queue is empty:

```javascript
// BAD — blocks rendering
fetchPayrollData().then(data => {
  // Processing 10,000 records in a microtask
  // Browser CANNOT render until this completes
  const processed = data.map(record => heavyCalculation(record));
  updateUI(processed);
});
```

The fix is to break heavy processing into chunks using macrotasks (`setTimeout`) or the newer `scheduler.yield()`, which yields control back to the browser between chunks:

```javascript
// GOOD — chunked processing yields to browser
async function processInChunks(data, chunkSize = 100) {
  const results = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    results.push(...chunk.map(record => heavyCalculation(record)));
    // Yield to browser — allows render between chunks
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return results;
}
```

**React 18's `startTransition`** leverages this understanding. It marks state updates as low-priority, allowing React to yield to the browser between render chunks. User input (typing, clicking) remains responsive because those events are processed as high-priority macrotasks that interrupt the low-priority transition render.

---

## Q15. What is the difference between JavaScript prototypal inheritance and class-based inheritance? How does this matter in large codebases?

### Key Talking Points
- JS `class` syntax is **syntactic sugar** over prototype chains — no true class-based OOP
- `class extends` correctly wires up `[[Prototype]]`
- Gotcha: methods defined **inside the constructor** are *not* on the prototype (each instance gets its own copy)
- Methods defined in the **class body** ARE on the prototype (shared across instances)
- In large codebases: **prefer composition over inheritance** (mixins, hooks, HOCs)
- Prototypal delegation means runtime lookups — understand this when debugging Angular/React framework internals
- TypeScript's structural typing works alongside this — `implements` is compile-time only

### Detailed Answer

JavaScript does not have classical inheritance like Java or C#. What it has is **prototypal delegation** — objects link to other objects via an internal `[[Prototype]]` chain, and property lookups walk this chain at runtime. The `class` keyword (ES2015+) is syntactic sugar that makes this look like classical inheritance, but the underlying mechanism is fundamentally different.

**How prototypal inheritance works:**

Every JavaScript object has an internal `[[Prototype]]` link (accessible via `Object.getPrototypeOf()` or the deprecated `__proto__`). When you access a property on an object, the engine first checks the object itself. If the property isn't found, it follows the `[[Prototype]]` link to the next object in the chain, and so on until it reaches `Object.prototype` (which has `[[Prototype]]` of `null`).

```javascript
const animal = {
  speak() { return `${this.name} makes a sound`; }
};

const dog = Object.create(animal); // dog's [[Prototype]] → animal
dog.name = 'Rex';
dog.speak(); // "Rex makes a sound" — found via prototype chain
```

**The `class` syntax is sugar over this:**

```javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a sound`; }
}

class Dog extends Animal {
  bark() { return `${this.name} barks`; }
}

const rex = new Dog('Rex');
// rex.[[Prototype]] → Dog.prototype
// Dog.prototype.[[Prototype]] → Animal.prototype
```

Under the hood, `Dog.prototype` is an object whose `[[Prototype]]` is `Animal.prototype`. The `extends` keyword wires this up correctly, including making `super()` work in the constructor.

**Critical gotcha — method placement:**

```javascript
class Service {
  constructor() {
    // This creates a NEW function on EACH instance — not on prototype
    this.handleClick = () => { console.log('clicked'); };
  }

  // This is on the prototype — shared across all instances
  handleSubmit() { console.log('submitted'); }
}

const a = new Service();
const b = new Service();
a.handleClick === b.handleClick; // false — different function objects
a.handleSubmit === b.handleSubmit; // true — same prototype method
```

Arrow functions in the constructor are per-instance (useful for binding `this` in React class components, but memory-expensive if you create thousands of instances). Methods in the class body are on the prototype (shared, memory-efficient).

**Why this matters in large codebases:**

1. **Composition over inheritance.** Deep inheritance hierarchies (`BaseComponent → AuthenticatedComponent → DashboardComponent → PayrollDashboard`) create tight coupling and fragile base class problems. In modern frontend development, **composition** (hooks, mixins, HOCs, dependency injection) is preferred. React moved from class components to hooks precisely because composition scales better than inheritance.

2. **Debugging framework internals.** Angular's dependency injection, React's component lifecycle, and RxJS's operator chains all use prototypal delegation internally. When debugging why a method isn't available or why `this` is undefined, understanding the prototype chain helps you trace the issue.

3. **TypeScript's `implements` is compile-time only.** `class PayrollService implements IPayrollService` enforces the interface at compile time, but at runtime there's no `IPayrollService` — TypeScript interfaces are erased. The runtime behaviour is pure prototypal delegation. This means you can't use `instanceof` to check interface implementation — only class inheritance.

4. **Performance consideration.** Prototype chain lookups are fast (engines optimise them with hidden classes / inline caches), but deeply nested chains add lookup overhead. In hot paths (rendering loops, data processing), accessing a method 5 levels up the prototype chain is measurably slower than a direct property access. This rarely matters in practice, but it's worth knowing when profiling performance-critical code.

---

## Q16. How does TypeScript's type system help at the architecture level in a large Angular + React enterprise product like IRIS?

### Key Talking Points
- **Strict null checks** eliminate entire categories of runtime errors (NullPointerException equivalents)
- **Discriminated unions** model API response states cleanly: `{ status: 'loading' } | { status: 'success', data: T } | { status: 'error', error: string }`
- Interface contracts between micro-frontends enforce integration points at compile time
- **Mapped and conditional types** reduce boilerplate in design system prop definitions
- Module augmentation for extending third-party types
- **Generate types from OpenAPI specs** (`openapi-typescript`) to keep FE/BE in sync — critical for IRIS's accounting and payroll APIs
- Generic components avoid `any` while staying reusable (e.g. `DataGrid<T>`)

### Detailed Answer

TypeScript's type system is not just about catching typos — at the architecture level, it serves as **executable documentation** and **compile-time contract enforcement** across teams, micro-frontends, and the frontend-backend boundary.

**Strict null checks eliminate the most common runtime error category.** With `strictNullChecks: true`, TypeScript forces you to handle `null` and `undefined` explicitly. In a payroll application, accessing `employee.salary.amount` when `salary` might be `null` is a compile-time error, not a production crash. This single compiler flag eliminates the JavaScript equivalent of NullPointerException — the most common error in production JavaScript applications.

**Discriminated unions model complex state cleanly.** Instead of a bag of optional properties (`{ data?: T, error?: string, loading?: boolean }`) where invalid combinations are possible (`{ data: someData, error: "failed", loading: true }`), discriminated unions make illegal states unrepresentable:

```typescript
type ApiState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function renderPayroll(state: ApiState<PayrollRun>) {
  switch (state.status) {
    case 'loading': return <Spinner />;
    case 'success': return <PayrollGrid data={state.data} />; // TS knows data exists
    case 'error':   return <ErrorBanner message={state.error} />; // TS knows error exists
    case 'idle':    return <EmptyState />;
  }
  // TypeScript ensures exhaustive handling — adding a new status
  // without handling it here is a compile error
}
```

**Interface contracts between micro-frontends.** When the shell application loads a remote micro-frontend, the contract (what props the remote's root component accepts, what events it emits) is defined as a TypeScript interface in a shared types package:

```typescript
// @iris/shared-types
export interface PayrollRemoteProps {
  employeeId: string;
  authToken: string;
  onNavigate: (path: string) => void;
  theme: 'light' | 'dark';
}
```

Both the shell and the remote import this interface. If the remote changes its props without updating the shared type, the shell's build fails. This catches integration errors at compile time rather than in production.

**Generated types from OpenAPI specs** keep the frontend and backend in sync. IRIS's payroll and accounting APIs have complex data models (tax calculations, pay components, deduction rules). Using `openapi-typescript`, the API's OpenAPI spec is transformed into TypeScript types automatically:

```bash
npx openapi-typescript https://api.iris.co.uk/payroll/openapi.json -o src/types/payroll-api.ts
```

This generates types like `PayrollRun`, `TaxCalculation`, `Employee` directly from the backend's schema. When the backend adds a required field, the generated types update, and any frontend code that doesn't handle the new field fails to compile. This is critical for IRIS where payroll calculation accuracy is a regulatory requirement.

**Generic components avoid `any` while staying reusable.** A data grid component that works with any entity type uses generics:

```typescript
interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
}

function DataGrid<T>({ data, columns, onRowClick }: DataGridProps<T>) {
  // T is inferred from usage — no `any` needed
}

// Usage — TypeScript infers T as Employee
<DataGrid
  data={employees}
  columns={employeeColumns}
  onRowClick={(emp) => navigate(`/employee/${emp.id}`)} // emp is typed as Employee
/>
```

**Mapped and conditional types** reduce boilerplate in design system definitions. Instead of manually defining `ButtonProps`, `InputProps`, `SelectProps` with overlapping properties, mapped types derive them from a base:

```typescript
type SizeVariant = 'sm' | 'md' | 'lg';
type ColorVariant = 'primary' | 'secondary' | 'danger';

type WithVariants<T> = T & {
  size?: SizeVariant;
  color?: ColorVariant;
  disabled?: boolean;
};

type ButtonProps = WithVariants<{ onClick: () => void; label: string }>;
type InputProps = WithVariants<{ value: string; onChange: (v: string) => void }>;
```

---

## Q17. Explain closures and how they can cause memory leaks in long-lived SPA applications like IRIS Elements.

### Key Talking Points
- A closure **retains a reference to its outer scope** even after the outer function returns
- Memory leak pattern: event listeners registered in `useEffect` / `ngOnInit` without cleanup hold references to component state, preventing garbage collection
- Fix in React: **always return a cleanup function** from `useEffect`
- Fix in Angular: **unsubscribe in `ngOnDestroy`** or use `takeUntilDestroyed()` / `takeUntil(destroy$)`
- RxJS subscriptions not unsubscribed are a classic leak pattern — especially relevant when migrating from IRIS's legacy event-driven desktop code
- Dev tools: Chrome Memory tab → Heap Snapshot to identify detached DOM nodes and retained closures

### Detailed Answer

A **closure** is a function that retains access to variables from its enclosing scope, even after that scope has finished executing. This is one of JavaScript's most powerful features — and one of its most common sources of memory leaks in long-lived SPAs.

**How closures work:**

```javascript
function createCounter() {
  let count = 0; // This variable lives on after createCounter returns
  return {
    increment: () => ++count,  // Closure — retains reference to count
    getCount: () => count       // Closure — retains reference to count
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.getCount();  // 2
// The `count` variable is not garbage collected because
// the returned functions still reference it
```

This is intentional and useful. The problem arises when closures **unintentionally** retain references to large objects, preventing garbage collection in long-lived applications.

**Memory leak pattern 1: Event listeners without cleanup (React)**

```jsx
// LEAKY — no cleanup function
useEffect(() => {
  const handleResize = () => {
    // This closure captures `dashboardData` from component scope
    recalculateLayout(dashboardData);
  };
  window.addEventListener('resize', handleResize);
  // Missing: return () => window.removeEventListener('resize', handleResize);
}, [dashboardData]);
```

When this component unmounts (user navigates away from the payroll dashboard), the event listener remains on `window`. The `handleResize` closure retains a reference to `dashboardData` — potentially megabytes of payroll records. Every time the user navigates to and from this page, another listener accumulates, each holding its own copy of the data.

**Fix:**
```jsx
useEffect(() => {
  const handleResize = () => recalculateLayout(dashboardData);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize); // Cleanup
}, [dashboardData]);
```

**Memory leak pattern 2: RxJS subscriptions without unsubscribe (Angular)**

```typescript
// LEAKY — subscription never cleaned up
@Component({ /* ... */ })
export class PayrollDashboardComponent implements OnInit {
  ngOnInit() {
    this.payrollService.getPayRuns$().subscribe(data => {
      // This closure captures `this` (the component instance)
      this.payRuns = data;
    });
    // When component is destroyed, the subscription persists
    // The closure holds a reference to the destroyed component
    // The component (and its data) cannot be garbage collected
  }
}
```

**Fix — multiple approaches:**

```typescript
// Approach 1: takeUntilDestroyed() (Angular 16+, simplest)
export class PayrollDashboardComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.payrollService.getPayRuns$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.payRuns = data);
  }
}

// Approach 2: async pipe (best — no manual subscription at all)
@Component({
  template: `
    <div *ngFor="let run of payRuns$ | async">{{ run.name }}</div>
  `
})
export class PayrollDashboardComponent {
  payRuns$ = this.payrollService.getPayRuns$();
}

// Approach 3: takeUntil with destroy subject (pre-Angular 16)
export class PayrollDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.payrollService.getPayRuns$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.payRuns = data);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Memory leak pattern 3: Closures in timers**

```javascript
// LEAKY — setInterval closure retains component reference
ngOnInit() {
  this.intervalId = setInterval(() => {
    this.refreshDashboard(); // `this` is the component
  }, 30000);
}
// If ngOnDestroy doesn't call clearInterval(this.intervalId),
// the interval runs forever, holding the component in memory
```

**Detecting memory leaks in IRIS dashboards:**

1. Open Chrome DevTools → Memory tab
2. Take a heap snapshot before navigating to the payroll dashboard
3. Navigate to the dashboard, interact with it, then navigate away
4. Take another heap snapshot
5. Compare snapshots — look for "Detached DOM nodes" and objects that should have been garbage collected
6. Filter by "Objects allocated between snapshots" to find the leak
7. Expand retained references to trace back to the closure causing the leak

For IRIS's migration from legacy desktop code, this is especially relevant. Desktop applications don't have the concept of component lifecycle — code runs until the application closes. When migrating to an SPA, every event listener, timer, and subscription must have a corresponding cleanup path, or the application's memory usage grows unboundedly over a workday.

---


# Category 4: Performance (Questions 18–20)

---

## Q18. How do you measure and improve Core Web Vitals (LCP, CLS, INP) for a complex SaaS dashboard?

### Key Talking Points
- **LCP (Largest Contentful Paint)**: SSR or pre-render shell, preload hero data, avoid render-blocking resources
- **CLS (Cumulative Layout Shift)**: reserve space for async-loaded charts/tables with **skeleton loaders** — critical for IRIS dashboards loading live payroll data
- **INP (Interaction to Next Paint)** — replaces FID: break long JS tasks with `scheduler.yield()` or `setTimeout` chunking, defer non-critical third-party scripts
- Tools: **Lighthouse CI** in pipeline, Chrome User Experience Report (CrUX), `web-vitals` library
- For IRIS payroll dashboards: heavy table renders must use **virtual scrolling** to avoid long tasks
- Target: LCP < 2.5s, CLS < 0.1, INP < 200ms

### Detailed Answer

Core Web Vitals are Google's standardised metrics for user experience, and they directly impact both SEO ranking and user satisfaction. For a complex SaaS dashboard like IRIS's payroll interface, each metric requires a targeted optimisation strategy.

**LCP (Largest Contentful Paint) — Target: < 2.5 seconds**

LCP measures when the largest visible content element finishes rendering. On an IRIS dashboard, this is typically the main data table or a summary card. Optimisation strategies:

- **Server-Side Rendering (SSR) or pre-rendered shell**: Serve the initial HTML with the dashboard layout already rendered. Angular Universal or Next.js (for React) can pre-render the shell so the browser paints meaningful content before JavaScript loads. For IRIS, even a static shell with skeleton placeholders counts as LCP content.
- **Preload critical data**: Use `<link rel="preload">` for the API call that populates the main dashboard content. Better yet, inline the initial data payload in the SSR response to eliminate the round-trip.
- **Eliminate render-blocking resources**: Move non-critical CSS to `media="print"` with an `onload` swap, defer third-party scripts (analytics, chat widgets), and inline critical CSS for above-the-fold content.
- **Image optimisation**: If the dashboard has charts rendered as images, use `<img loading="eager">` for the hero chart and `loading="lazy"` for below-fold content. Serve WebP/AVIF formats with `<picture>` fallbacks.

**CLS (Cumulative Layout Shift) — Target: < 0.1**

CLS measures unexpected layout shifts — elements moving after the page has started rendering. This is the most common issue on data dashboards where content loads asynchronously.

- **Skeleton loaders with fixed dimensions**: Every async-loaded widget (charts, tables, summary cards) must have a skeleton placeholder with the exact same dimensions as the final content. When the data arrives, the skeleton is replaced without shifting surrounding elements.
- **Reserve space for dynamic content**: Set explicit `width` and `height` on containers, images, and iframes. Use CSS `aspect-ratio` for responsive elements.
- **Font loading strategy**: Use `font-display: swap` with a fallback font that has similar metrics. Better: use `size-adjust` in `@font-face` to match the fallback font's dimensions to the web font, eliminating the layout shift when fonts swap.
- **Avoid injecting content above existing content**: Banners, notifications, and alerts should push content down from a reserved space, not insert themselves above the fold.

**INP (Interaction to Next Paint) — Target: < 200ms**

INP measures the latency between a user interaction (click, tap, keypress) and the next visual update. It replaced FID (First Input Delay) and is harder to optimise because it measures *all* interactions throughout the page lifecycle, not just the first one.

- **Break long tasks**: Any JavaScript task longer than 50ms blocks the main thread and delays the next paint. Use `scheduler.yield()` (Scheduler API) or `setTimeout(0)` to break heavy processing into chunks that yield to the browser between iterations.
- **Defer non-critical work**: Third-party scripts (analytics, error tracking, A/B testing) should load with `defer` or `async` and initialise after the main content is interactive.
- **Virtual scrolling for large tables**: Rendering 500 payroll rows in a single task creates a long task. Virtual scrolling renders only visible rows, keeping interaction handlers fast.
- **Web Workers for heavy computation**: Payroll calculations, data transformations, and CSV exports should run in a Web Worker to keep the main thread free for user interactions.

**Measurement and monitoring pipeline:**

```
Development:  Lighthouse CI in PR checks (synthetic)
Staging:      Lighthouse CI + manual testing on representative data
Production:   web-vitals library → send to analytics (real user monitoring)
              CrUX dashboard for 28-day rolling field data
```

The `web-vitals` library captures real user metrics and sends them to your analytics platform:

```javascript
import { onLCP, onCLS, onINP } from 'web-vitals';

onLCP(metric => sendToAnalytics('LCP', metric));
onCLS(metric => sendToAnalytics('CLS', metric));
onINP(metric => sendToAnalytics('INP', metric));
```

This gives you field data from actual IRIS users — far more valuable than synthetic Lighthouse scores, because it reflects real network conditions, device capabilities, and data volumes.

---

## Q19. What webpack/Vite optimisation strategies do you apply to reduce bundle size for an enterprise Angular app?

### Key Talking Points
- **Code splitting**: lazy-load routes and Angular feature modules — only load what's needed
- **Tree-shaking**: ensure ES module imports, avoid side-effect-heavy barrel imports (`index.ts` re-exporting everything)
- **Differential loading**: modern (ES2015+) and legacy bundles served based on browser capability
- Angular: use **standalone components** — reduces overhead vs NgModules
- Analyse with `webpack-bundle-analyzer` or `vite-plugin-visualizer` to find bloat
- Replace heavy libs: `moment.js` → `date-fns`, `lodash` → tree-shaken imports
- Bundle size budgets in `angular.json` — fail CI if exceeded
- Target: < 200KB initial JS for IRIS dashboard entry point

### Detailed Answer

Bundle size directly impacts load time, and for an enterprise Angular app with dozens of feature modules, it's easy to ship megabytes of JavaScript without realising it. The optimisation strategy works at multiple levels.

**Level 1: Code splitting via lazy-loaded routes**

The single biggest win is ensuring feature modules load only when the user navigates to them. Angular's router supports lazy loading natively:

```typescript
const routes: Routes = [
  { path: 'payroll', loadChildren: () => import('./payroll/payroll.module').then(m => m.PayrollModule) },
  { path: 'hr',      loadChildren: () => import('./hr/hr.module').then(m => m.HrModule) },
  { path: 'accounts', loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountsModule) },
];
```

With standalone components (Angular 14+), this becomes even leaner — no NgModule overhead:

```typescript
{ path: 'payroll', loadComponent: () => import('./payroll/payroll.component').then(c => c.PayrollComponent) }
```

The initial bundle contains only the shell (navigation, auth, layout). Each feature loads on demand, typically reducing the initial bundle by 60–80%.

**Level 2: Tree-shaking and import hygiene**

Tree-shaking removes unused exports from the bundle, but it only works with ES module syntax (`import`/`export`). Common pitfalls:

- **Barrel imports kill tree-shaking**: `import { something } from '@iris/shared'` where `@iris/shared/index.ts` re-exports 200 utilities pulls in *everything*, because the bundler can't prove the other exports are side-effect-free. Fix: import directly from the specific file (`import { something } from '@iris/shared/utils/something'`) or mark the package as `"sideEffects": false` in `package.json`.
- **Replace heavy libraries**: `moment.js` (300KB, not tree-shakeable) → `date-fns` (tree-shakeable, import only what you use) or native `Intl.DateTimeFormat`. `lodash` → `lodash-es` (tree-shakeable) or individual imports (`import debounce from 'lodash/debounce'`).

**Level 3: Bundle analysis and budgets**

Use `webpack-bundle-analyzer` (or `source-map-explorer` for Angular CLI) to visualise what's in the bundle:

```bash
ng build --source-map
npx source-map-explorer dist/main.*.js
```

This reveals surprises — a 150KB charting library imported for a single pie chart, or a polyfill that's no longer needed. Set budgets in `angular.json` to prevent regressions:

```json
"budgets": [
  { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
  { "type": "anyComponentStyle", "maximumWarning": "4kb", "maximumError": "8kb" }
]
```

CI fails if the budget is exceeded, catching bundle bloat before it reaches production.

**Level 4: Differential loading and modern syntax**

Angular CLI's differential loading generates two bundles: a modern ES2015+ bundle (smaller, uses native async/await, arrow functions) and a legacy ES5 bundle (larger, includes polyfills). Modern browsers get the smaller bundle via `<script type="module">`, legacy browsers get the ES5 bundle via `<script nomodule>`. For IRIS's enterprise customers (mostly modern Chrome/Edge), the modern bundle is what 95%+ of users receive.

**Level 5: Compression and delivery**

- Enable **Brotli compression** on the CDN/server — typically 15–20% smaller than gzip for JavaScript.
- Use **HTTP/2** for parallel asset loading — eliminates the need for manual bundle concatenation.
- Set long `Cache-Control` headers with content-hashed filenames — returning users load from cache.

**Target for IRIS**: < 200KB initial JavaScript (gzipped) for the dashboard entry point. Feature modules load on demand, each under 100KB gzipped.

---

## Q20. How would you design a caching strategy for a data-heavy accounting SaaS where data freshness matters?

### Key Talking Points
- **HTTP cache headers** (`ETag` / `Cache-Control: max-age`) for reference data (tax codes, currency lists, company config)
- **React Query / SWR** for client-side cache with `stale-while-revalidate` — perfect for IRIS where showing slightly stale data beats a loading spinner
- **Service Worker cache** for app shell (offline capability)
- **Optimistic updates** for form submissions — update UI immediately, rollback on error
- Cache invalidation triggers: **WebSocket push** from server when another user modifies shared data (multi-user payroll scenario)
- Separate cache TTLs by data type: client list (long), live payroll run (no cache), tax rates (medium)

### Detailed Answer

Caching in an accounting SaaS is a balancing act: users need fast load times, but stale financial data can cause real business harm (incorrect tax calculations, duplicate payments). The strategy must be **data-type-aware** — different data has different freshness requirements.

**Tier 1: Long-lived reference data (cache aggressively)**

Tax codes, currency lists, country codes, company configuration, and chart of accounts change rarely (monthly or quarterly). These are ideal for aggressive caching:

- **HTTP headers**: `Cache-Control: max-age=86400` (24 hours) with `ETag` for conditional revalidation. The browser serves from cache for 24 hours, then sends a conditional request — if the data hasn't changed, the server responds with `304 Not Modified` (no body), saving bandwidth.
- **Client-side**: React Query / TanStack Query with `staleTime: 24 * 60 * 60 * 1000` (24 hours). The data is considered fresh for a full day, eliminating redundant API calls.

**Tier 2: Moderately dynamic data (stale-while-revalidate)**

Client lists, employee directories, and historical reports change periodically but don't need real-time accuracy. The **stale-while-revalidate** pattern is perfect:

```typescript
// React Query example
const { data: clients } = useQuery({
  queryKey: ['clients'],
  queryFn: fetchClients,
  staleTime: 5 * 60 * 1000,    // Fresh for 5 minutes
  gcTime: 30 * 60 * 1000,       // Keep in cache for 30 minutes
});
```

The user sees cached data immediately (no loading spinner), while React Query revalidates in the background. If the data has changed, the UI updates seamlessly. This is the sweet spot for IRIS — accountants see their client list instantly on page load, and it quietly refreshes if someone else added a new client.

**Tier 3: Real-time data (no cache or very short TTL)**

Live payroll runs, pending approvals, and real-time financial calculations must never be stale. These bypass the cache entirely:

```typescript
const { data: payrollRun } = useQuery({
  queryKey: ['payroll-run', runId],
  queryFn: () => fetchPayrollRun(runId),
  staleTime: 0,           // Always considered stale
  refetchInterval: 10000, // Poll every 10 seconds during active run
});
```

For truly real-time data, **WebSocket push** is better than polling. The server pushes updates when the payroll calculation progresses, and the client updates the cache:

```typescript
useEffect(() => {
  const ws = new WebSocket(`wss://api.iris.co.uk/payroll/${runId}/live`);
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    queryClient.setQueryData(['payroll-run', runId], update);
  };
  return () => ws.close();
}, [runId]);
```

**Optimistic updates for form submissions:**

When an accountant submits a journal entry, update the UI immediately without waiting for the server response. If the server rejects the submission, roll back:

```typescript
const mutation = useMutation({
  mutationFn: submitJournalEntry,
  onMutate: async (newEntry) => {
    await queryClient.cancelQueries({ queryKey: ['journal-entries'] });
    const previous = queryClient.getQueryData(['journal-entries']);
    queryClient.setQueryData(['journal-entries'], old => [...old, newEntry]);
    return { previous }; // Context for rollback
  },
  onError: (err, newEntry, context) => {
    queryClient.setQueryData(['journal-entries'], context.previous); // Rollback
    toast.error('Failed to save entry. Please try again.');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['journal-entries'] }); // Refetch
  },
});
```

**Service Worker cache for the app shell:**

The application shell (HTML, CSS, JavaScript, fonts, icons) is cached by a Service Worker using a **cache-first** strategy. Returning users load the app instantly from the Service Worker cache, even on slow connections. The Service Worker checks for updates in the background and prompts the user to refresh when a new version is available.

**Cache invalidation via WebSocket push:**

In multi-user scenarios (two accountants working on the same client), the server pushes invalidation events via WebSocket when shared data changes. The client receives the event and invalidates the relevant cache key, triggering a background refetch:

```typescript
ws.onmessage = (event) => {
  const { type, entityId } = JSON.parse(event.data);
  if (type === 'CLIENT_UPDATED') {
    queryClient.invalidateQueries({ queryKey: ['client', entityId] });
  }
};
```

---


# Category 5: Testing (Questions 21–23)

---

## Q21. IRIS interviews mention Jest, useMemo/useCallback, and component tests. Describe your frontend testing strategy for an enterprise product.

### Key Talking Points
- **Testing pyramid**: many unit tests (pure functions, hooks), fewer integration tests (components with real state), few E2E tests (critical user journeys only)
- Tools: **Jest + React Testing Library** (test behaviour, not implementation), Vitest for Vite projects, Playwright for E2E
- Angular: **TestBed** for component tests, Spectator for cleaner syntax
- Mock API layer with **MSW (Mock Service Worker)** — intercepts fetch at network level, more realistic than mocking modules
- Target: 80%+ coverage on **business logic** (calculations, transformations, validations) — not 80% on UI templates
- Avoid testing implementation details (internal state, DOM structure) — test what users experience

### Detailed Answer

An enterprise frontend testing strategy must balance **confidence** (catching real bugs) with **maintainability** (tests that don't break on every refactor). The testing pyramid provides the structure, but the key insight is *what* to test at each level.

**The testing pyramid for IRIS:**

```
        /  E2E  \          ~5% of tests — critical user journeys
       /----------\
      / Integration \       ~25% of tests — components with real state
     /----------------\
    /    Unit Tests     \   ~70% of tests — pure functions, hooks, services
   /____________________\
```

**Unit tests (70%) — fast, focused, high coverage on business logic:**

These test pure functions, custom hooks, Angular services, and data transformations in isolation. For IRIS, this means payroll calculations, tax computations, data validation rules, and state transformations. These are the highest-value tests because business logic bugs have the most severe consequences (incorrect payslips, wrong tax filings).

```typescript
// Testing a payroll calculation — pure function, no UI
describe('calculateNetPay', () => {
  it('deducts tax and NI from gross pay', () => {
    const result = calculateNetPay({
      grossPay: 5000,
      taxCode: '1257L',
      niCategory: 'A',
    });
    expect(result.incomeTax).toBe(690);
    expect(result.nationalInsurance).toBe(398.52);
    expect(result.netPay).toBe(3911.48);
  });
});
```

For React hooks, use `@testing-library/react-hooks` (or `renderHook` from React Testing Library):

```typescript
describe('useDebounce', () => {
  it('debounces value updates', () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );
    expect(result.current).toBe('a');
    rerender({ value: 'ab' });
    expect(result.current).toBe('a'); // Not updated yet
    jest.advanceTimersByTime(300);
    expect(result.current).toBe('ab'); // Updated after delay
  });
});
```

**Integration tests (25%) — components with real state and interactions:**

These test components as users experience them — rendering, clicking, typing, and verifying visible output. **React Testing Library** enforces this by providing queries based on accessibility roles (`getByRole`, `getByLabelText`) rather than implementation details (`getByTestId`, DOM structure).

```typescript
describe('PayrollDashboard', () => {
  it('displays employee list and filters by department', async () => {
    // MSW intercepts the API call at network level
    server.use(
      rest.get('/api/employees', (req, res, ctx) => {
        return res(ctx.json(mockEmployees));
      })
    );

    render(<PayrollDashboard />);

    // Wait for data to load
    expect(await screen.findByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();

    // Filter by department
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: /department/i }),
      'Engineering'
    );

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });
});
```

**MSW (Mock Service Worker)** is the preferred API mocking approach. It intercepts requests at the network level, so the component's fetch/HTTP code runs exactly as it does in production. This is more realistic than mocking `axios` or `HttpClient` at the module level.

**E2E tests (5%) — critical user journeys only:**

E2E tests are slow, flaky, and expensive to maintain. Reserve them for the most critical paths that, if broken, would cause immediate business impact:

- Login → navigate to payroll → run payroll → verify payslip generated
- Create new employee → assign to department → verify appears in directory
- Submit expense claim → manager approves → verify status updated

Use **Playwright** for E2E — it's faster and more reliable than Cypress for enterprise applications, with native multi-browser support and better handling of authentication flows.

**Angular-specific testing:**

Angular uses **TestBed** for component tests, which configures a testing module with the component's dependencies. **Spectator** (from ngneat) provides a cleaner API:

```typescript
describe('PayrollGridComponent', () => {
  let spectator: Spectator<PayrollGridComponent>;
  const createComponent = createComponentFactory({
    component: PayrollGridComponent,
    imports: [PayrollModule],
    providers: [mockProvider(PayrollService, { getPayRuns: () => of(mockPayRuns) })],
  });

  it('renders pay runs in the grid', () => {
    spectator = createComponent();
    expect(spectator.queryAll('.pay-run-row')).toHaveLength(3);
  });
});
```

**Coverage targets:** 80%+ on business logic (calculations, validations, state transformations). Don't chase 80% on UI templates — testing that a `<div>` renders with the right class name adds maintenance cost without catching real bugs.

---

## Q22. How would you implement visual regression testing for IRIS's design system components shared across Angular and React?

### Key Talking Points
- **Storybook + Chromatic**: auto-detects pixel-diff changes on each PR before merge
- Percy as an alternative with broader CI integration
- Storybook stories become the **test harness** — each state of a component (default, error, disabled, hover, loading) is a separate story
- Snapshot tests in Jest for DOM structure parity checks
- Key architectural decision: stories live in the **component library repo** — visual regressions caught before any consuming app is affected
- Run visual tests on **cross-browser matrix** (Chrome, Firefox, Safari) for enterprise compliance

### Detailed Answer

Visual regression testing ensures that design system components look correct across updates, browsers, and states. For IRIS's shared component library used by both Angular and React apps, catching visual regressions *before* they propagate to consuming applications is critical.

**Architecture: Storybook as the test harness**

Every component in the design system has comprehensive Storybook stories covering all visual states:

```typescript
// Button.stories.tsx
export default { title: 'Primitives/Button', component: Button };

export const Primary = { args: { variant: 'primary', label: 'Submit' } };
export const Secondary = { args: { variant: 'secondary', label: 'Cancel' } };
export const Disabled = { args: { variant: 'primary', label: 'Submit', disabled: true } };
export const Loading = { args: { variant: 'primary', label: 'Submit', loading: true } };
export const WithIcon = { args: { variant: 'primary', label: 'Download', icon: 'download' } };
export const Small = { args: { variant: 'primary', label: 'Submit', size: 'sm' } };
export const Large = { args: { variant: 'primary', label: 'Submit', size: 'lg' } };
export const Error = { args: { variant: 'danger', label: 'Delete' } };
```

Each story is a visual test case. The more states you cover, the more regressions you catch.

**Chromatic for automated visual diffing:**

**Chromatic** (built by the Storybook team) captures a screenshot of every story on every PR. When a PR changes a component's appearance, Chromatic highlights the pixel-level differences and requires a team member to approve or reject the change before the PR can merge.

The CI pipeline:
```yaml
# .github/workflows/visual-regression.yml
- name: Publish to Chromatic
  uses: chromaui/action@v1
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
    buildScriptName: build-storybook
```

When a developer changes a button's padding, Chromatic shows the before/after diff. If the change is intentional (design update), the reviewer approves it and the new screenshot becomes the baseline. If it's unintentional (a CSS change in one component affected another), the reviewer rejects it and the developer fixes the regression before merging.

**Cross-browser testing:**

Enterprise customers use Chrome, Firefox, Safari, and Edge. Chromatic captures screenshots across multiple browsers, catching browser-specific rendering differences (e.g., a flexbox gap that works in Chrome but not Safari). This is configured in the Chromatic project settings — no code changes needed.

**Percy as an alternative:**

Percy (by BrowserStack) offers similar functionality with broader CI integration. It supports Storybook, Playwright, and Cypress as screenshot sources. The choice between Chromatic and Percy often comes down to existing tooling — if the team already uses BrowserStack for cross-browser testing, Percy integrates naturally.

**Key architectural decision: stories live in the component library repo.** Visual regression tests run on the design system repository, not on consuming applications. This means a visual regression is caught when the component library PR is opened — before the change is published to npm and consumed by payroll, HR, or accounts apps. By the time a consuming app updates the design system dependency, the visual change has already been reviewed and approved.

**Complementary: DOM snapshot tests in Jest:**

For structural parity checks (ensuring the Angular and React versions of a component produce equivalent DOM), Jest snapshot tests compare the rendered HTML:

```typescript
it('renders the same DOM structure', () => {
  const { container } = render(<Button variant="primary" label="Submit" />);
  expect(container.firstChild).toMatchSnapshot();
});
```

These catch structural changes (added/removed elements, changed attributes) but not visual changes (colour, spacing, font). They complement visual regression tests, not replace them.

---

## Q23. Explain how you'd write a test for a debounced search component — handling async state and timers.

### Key Talking Points
- Use Jest's **fake timers**: `jest.useFakeTimers()`
- Fire input event, assert API **not** called yet
- Advance timers: `jest.advanceTimersByTime(300)` to simulate debounce delay
- Assert API called exactly **once** with correct search term
- Use `act()` wrapper in React Testing Library for state updates triggered by timer
- For React Query / SWR: wrap with `QueryClientProvider` in test setup
- Angular equivalent: `fakeAsync()` + `tick(300)` + `flush()` for HTTP assertions

### Detailed Answer

Testing debounced components is tricky because they involve timers, async state updates, and API calls. The key is controlling time with fake timers and asserting at the right moments.

**React example with Jest + React Testing Library + MSW:**

```typescript
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { SearchBar } from './SearchBar';

const server = setupServer(
  rest.get('/api/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    return res(ctx.json({ results: [`Result for ${query}`] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SearchBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces API calls — only fires after user stops typing', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar debounceMs={300} />);

    const input = screen.getByRole('searchbox');

    // Type "pay" character by character
    await user.type(input, 'p');
    await user.type(input, 'a');
    await user.type(input, 'y');

    // API should NOT have been called yet — debounce hasn't elapsed
    expect(screen.queryByText(/Result for/)).not.toBeInTheDocument();

    // Advance time past the debounce delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Now the API call fires and results appear
    expect(await screen.findByText('Result for pay')).toBeInTheDocument();
  });

  it('cancels previous debounce when user continues typing', async () => {
    const fetchSpy = jest.fn();
    server.use(
      rest.get('/api/search', (req, res, ctx) => {
        fetchSpy(req.url.searchParams.get('q'));
        return res(ctx.json({ results: [] }));
      })
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar debounceMs={300} />);

    const input = screen.getByRole('searchbox');

    // Type "pa", wait 200ms (less than debounce), then type "y"
    await user.type(input, 'pa');
    act(() => jest.advanceTimersByTime(200)); // Not enough time
    await user.type(input, 'y');
    act(() => jest.advanceTimersByTime(300)); // Full debounce after last keystroke

    // API called only ONCE with the final value, not with "pa"
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('pay');
  });

  it('shows loading state during API call', async () => {
    server.use(
      rest.get('/api/search', (req, res, ctx) => {
        return res(ctx.delay(500), ctx.json({ results: ['Payroll'] }));
      })
    );

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar debounceMs={300} />);

    await user.type(screen.getByRole('searchbox'), 'pay');
    act(() => jest.advanceTimersByTime(300));

    // Loading indicator should appear while API call is in flight
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for API response
    expect(await screen.findByText('Payroll')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
```

**Angular equivalent with `fakeAsync` + `tick`:**

```typescript
describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchBarComponent, HttpClientTestingModule],
    });
    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('debounces search input by 300ms', fakeAsync(() => {
    const input = fixture.nativeElement.querySelector('input');

    // Type "pay"
    input.value = 'pay';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // No HTTP request yet — debounce hasn't elapsed
    httpMock.expectNone('/api/search');

    // Advance past debounce delay
    tick(300);
    fixture.detectChanges();

    // Now the HTTP request fires
    const req = httpMock.expectOne('/api/search?q=pay');
    req.flush({ results: ['Payroll Run'] });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Payroll Run');
  }));

  it('cancels previous request when user types again', fakeAsync(() => {
    const input = fixture.nativeElement.querySelector('input');

    input.value = 'pa';
    input.dispatchEvent(new Event('input'));
    tick(200); // Less than debounce

    input.value = 'pay';
    input.dispatchEvent(new Event('input'));
    tick(300); // Full debounce after last input

    // Only one request — for "pay", not "pa"
    const req = httpMock.expectOne('/api/search?q=pay');
    req.flush({ results: ['Payroll'] });

    httpMock.verify(); // Confirms no other requests were made
  }));
});
```

**Key testing principles for debounced components:**

1. **Always use fake timers** — real timers make tests slow and flaky.
2. **Assert the negative first** — verify the API was NOT called before the debounce delay.
3. **Advance time precisely** — use `jest.advanceTimersByTime(300)` or `tick(300)`, not `jest.runAllTimers()` which can trigger unrelated timers.
4. **Wrap timer advances in `act()`** — React needs to process state updates triggered by the timer within an `act()` boundary.
5. **Test the cancellation behaviour** — the most important debounce behaviour is that intermediate calls are cancelled. Verify the API is called only once with the final value.

---

# Category 6: System Design (Questions 24–30)

---

## Q24. Design a real-time payroll notification system on the frontend — employees see their payslip the moment payroll runs.

### Key Talking Points
- **WebSocket connection** (AWS API Gateway WebSocket or Socket.io) — persistent connection to push event when payroll batch completes
- Fallback: **Server-Sent Events** (SSE) — simpler, one-way, auto-reconnect built-in
- Client subscribes to **employee-specific channel** on login — scoped by employeeId
- Notification badge updates via React context / NgRx action on incoming event
- Toast notification with deep-link to the new payslip
- Offline: **Service Worker** queues missed notifications and surfaces them on reconnect
- Security: **JWT auth on WebSocket handshake** — non-negotiable for sensitive payroll data

### Detailed Answer

A real-time payroll notification system requires a **push-based architecture** — the server tells the client when something happens, rather than the client polling repeatedly. For IRIS, where payroll data is sensitive and timely delivery matters, the design must balance real-time responsiveness with security and reliability.

**Transport layer: WebSocket with SSE fallback**

The primary transport is a **WebSocket connection** via AWS API Gateway WebSocket API. WebSockets provide full-duplex communication — the server can push messages to the client at any time without the client requesting them. When the payroll batch completes, the backend publishes an event to the WebSocket API, which routes it to the connected employee.

**Server-Sent Events (SSE)** serve as a fallback for environments where WebSockets are blocked (some corporate proxies). SSE is simpler — it's a one-way HTTP stream from server to client with built-in auto-reconnect. The client opens a connection with `new EventSource('/api/notifications')`, and the server pushes events as they occur. SSE is sufficient for notifications because the client only needs to *receive* events, not send them.

**Connection architecture:**

```typescript
// Frontend notification service
class NotificationService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(employeeId: string, authToken: string) {
    // JWT passed as query param for WebSocket auth (no custom headers in WS)
    this.ws = new WebSocket(
      `wss://ws.iris.co.uk/notifications?token=${authToken}`
    );

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      // Subscribe to employee-specific channel
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        channel: `employee:${employeeId}`
      }));
    };

    this.ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      this.handleNotification(notification);
    };

    this.ws.onclose = () => {
      this.scheduleReconnect(employeeId, authToken);
    };
  }

  private handleNotification(notification: PayrollNotification) {
    // Update notification badge count (NgRx action or React context)
    store.dispatch(notificationReceived(notification));

    // Show toast with deep-link
    showToast({
      title: 'Payslip Ready',
      message: `Your payslip for ${notification.period} is now available.`,
      action: { label: 'View', url: `/payslips/${notification.payslipId}` }
    });
  }

  private scheduleReconnect(employeeId: string, authToken: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(employeeId, authToken);
      }, delay);
    }
  }
}
```

**Security considerations:**

- **JWT authentication on WebSocket handshake**: The token is validated server-side before the connection is established. Expired or invalid tokens reject the connection immediately.
- **Channel scoping**: An employee can only subscribe to their own channel (`employee:{their-id}`). The server validates the channel against the JWT claims — an employee cannot subscribe to another employee's payslip notifications.
- **Token refresh**: When the access token expires, the WebSocket connection is closed and re-established with a fresh token from the shell's silent refresh mechanism.

**Offline handling with Service Worker:**

If the employee's browser is closed or offline when payroll runs, the notification is missed. A **Service Worker** with push notification support (Web Push API) handles this:

1. The backend sends a push notification via the Web Push protocol
2. The Service Worker receives it even if the browser tab is closed
3. The Service Worker shows a native OS notification
4. Clicking the notification opens the app and navigates to the payslip

For employees who haven't granted push notification permission, the app shows a notification badge and a "You have new payslips" banner on their next visit, populated from a `/api/notifications/unread` endpoint.

---

## Q25. How would you architect an offline-capable version of IRIS Elements for accountants working on-the-go without reliable internet?

### Key Talking Points
- **Progressive Web App**: Service Worker caches app shell + critical reference data
- **IndexedDB** for local data store (draft tax returns, client notes, work-in-progress)
- **Background Sync API** queues mutations when offline, replays on reconnect
- Conflict resolution strategy: **last-write-wins** vs operational transform — important for multi-user accounting scenarios
- Cache-first strategy for reference data (tax codes), network-first for live payroll runs
- Clear **offline indicator** in UI — never silently fail; accountants need to know data may not be live
- Sync status visible in UI: "3 changes pending sync"

### Detailed Answer

An offline-capable IRIS Elements app allows accountants to continue working during train journeys, client site visits, or in areas with poor connectivity. The architecture has three layers: **app shell caching**, **local data storage**, and **sync management**.

**Layer 1: App shell caching with Service Worker**

The Service Worker caches all static assets (HTML, CSS, JavaScript, fonts, icons) using a **cache-first** strategy. Once the app is loaded once, it opens instantly from cache on subsequent visits, regardless of network status.

```javascript
// service-worker.js — Workbox configuration
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

// Precache app shell (HTML, CSS, JS, fonts)
precacheAndRoute(self.__WB_MANIFEST);

// Reference data: cache-first (tax codes, currencies — rarely change)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/reference/'),
  new CacheFirst({ cacheName: 'reference-data', plugins: [/* expiration */] })
);

// Client data: network-first (show latest if online, cached if offline)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/clients/'),
  new NetworkFirst({ cacheName: 'client-data', networkTimeoutSeconds: 3 })
);

// Live payroll: network-only (never serve stale payroll calculations)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/payroll/run/'),
  new NetworkOnly()
);
```

**Layer 2: Local data storage with IndexedDB**

For work-in-progress data (draft tax returns, client notes, expense entries), **IndexedDB** provides a structured local database that persists across sessions. Libraries like **Dexie.js** provide a clean API over IndexedDB:

```typescript
const db = new Dexie('IRISOfflineDB');
db.version(1).stores({
  drafts: '++id, clientId, type, lastModified, syncStatus',
  clientNotes: '++id, clientId, createdAt, syncStatus',
  pendingMutations: '++id, endpoint, method, body, createdAt'
});

// Save a draft tax return locally
async function saveDraft(draft: TaxReturnDraft) {
  await db.drafts.put({
    ...draft,
    lastModified: new Date(),
    syncStatus: navigator.onLine ? 'synced' : 'pending'
  });
}
```

**Layer 3: Sync management**

When the user makes changes offline, mutations are queued in IndexedDB and replayed when connectivity returns.

The **Background Sync API** handles this automatically:

```javascript
// Register a sync event when a mutation is queued
async function queueMutation(mutation) {
  await db.pendingMutations.add(mutation);
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-mutations');
  }
}

// In the Service Worker — replay mutations when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(replayPendingMutations());
  }
});

async function replayPendingMutations() {
  const mutations = await db.pendingMutations.toArray();
  for (const mutation of mutations) {
    try {
      await fetch(mutation.endpoint, {
        method: mutation.method,
        body: JSON.stringify(mutation.body),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.pendingMutations.delete(mutation.id);
    } catch (error) {
      break; // Stop replaying — still offline or server error
    }
  }
}
```

**Conflict resolution:**

When two accountants edit the same client record offline and both sync later, conflicts arise. The strategy depends on the data type:

- **Last-write-wins** for simple fields (client phone number, address) — the most recent change overwrites. Simple and predictable.
- **Merge strategy** for additive data (notes, comments) — both additions are kept.
- **Manual resolution** for financial data (tax return figures) — the app detects the conflict, shows both versions, and asks the accountant to choose. Financial accuracy is non-negotiable.

**UI indicators are critical:**

- A persistent **offline banner** at the top of the app: "You're offline. Changes will sync when you reconnect."
- A **sync status indicator**: "3 changes pending sync" with a manual "Sync now" button.
- Each draft shows its sync status: synced (green check), pending (yellow clock), conflict (red warning).
- Never silently fail — accountants must know whether the data they're viewing is live or cached.

---

## Q26. How do you approach internationalisation (i18n) and localisation (l10n) at the architecture level for a product used in 135 countries like IRIS?

### Key Talking Points
- Angular: built-in i18n or `ngx-translate`; React: `react-i18next`
- Extract all strings to **JSON resource files** at build time — never hardcode UI copy
- **ICU message format** for pluralisation and gender agreement across languages
- Currency: `Intl.NumberFormat` with locale — handles symbol placement, decimal separators
- Dates: `Intl.DateTimeFormat` — never moment.js for l10n
- **RTL support**: CSS logical properties (`margin-inline-start` instead of `margin-left`)
- Locale loaded **lazily** on route entry to avoid bloating initial bundle
- Testing: **pseudo-locale** (extended strings) to find truncation and layout issues early

### Detailed Answer

Internationalisation at IRIS's scale (135 countries, multiple languages, diverse currency and date formats) must be an **architectural concern**, not an afterthought. Retrofitting i18n into an existing app is orders of magnitude harder than building it in from the start.

**String extraction and management:**

Every user-facing string lives in a **JSON resource file**, never hardcoded in templates or components. Each locale has its own file:

```
/locales/en-GB.json    — English (UK) — default
/locales/en-US.json    — English (US)
/locales/de-DE.json    — German
/locales/fr-FR.json    — French
/locales/ar-SA.json    — Arabic (RTL)
```

```json
// en-GB.json
{
  "payroll.dashboard.title": "Payroll Dashboard",
  "payroll.employees.count": "{count, plural, one {# employee} other {# employees}}",
  "payroll.run.status": "Pay run {status, select, draft {is in draft} processing {is processing} complete {is complete} other {has unknown status}}"
}
```

The **ICU message format** handles pluralisation and selection natively. Different languages have different plural rules (English has 2 forms, Arabic has 6, Japanese has 1). ICU handles this without custom logic per language.

**Framework integration:**

- **Angular**: `ngx-translate` for runtime translation switching, or Angular's built-in i18n for compile-time translation (generates a separate bundle per locale — better performance, but no runtime switching).
- **React**: `react-i18next` with the `useTranslation` hook:

```tsx
function PayrollDashboard() {
  const { t } = useTranslation();
  return (
    <h1>{t('payroll.dashboard.title')}</h1>
    <p>{t('payroll.employees.count', { count: employees.length })}</p>
  );
}
```

**Number and currency formatting:**

Never format numbers or currencies manually. Use the browser's built-in `Intl.NumberFormat`:

```typescript
// UK: £5,000.00 | Germany: 5.000,00 € | Japan: ¥5,000
function formatCurrency(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

formatCurrency(5000, 'en-GB', 'GBP'); // "£5,000.00"
formatCurrency(5000, 'de-DE', 'EUR'); // "5.000,00 €"
formatCurrency(5000, 'ja-JP', 'JPY'); // "¥5,000"
```

This handles symbol placement (before vs after), decimal separators (dot vs comma), and grouping separators automatically.

**Date formatting:**

Use `Intl.DateTimeFormat` — never `moment.js` for localisation:

```typescript
// UK: 18/04/2026 | US: 04/18/2026 | Germany: 18.04.2026
new Intl.DateTimeFormat('en-GB').format(date); // "18/04/2026"
new Intl.DateTimeFormat('en-US').format(date); // "04/18/2026"
new Intl.DateTimeFormat('de-DE').format(date); // "18.04.2026"
```

**RTL (Right-to-Left) support:**

For Arabic, Hebrew, and other RTL languages, the entire layout must mirror. Use **CSS logical properties** instead of physical ones:

```css
/* Bad — breaks in RTL */
.sidebar { margin-left: 16px; padding-right: 8px; text-align: left; }

/* Good — works in both LTR and RTL */
.sidebar { margin-inline-start: 16px; padding-inline-end: 8px; text-align: start; }
```

Set `dir="rtl"` on the `<html>` element based on the active locale. CSS logical properties automatically flip the layout.

**Lazy loading locale data:**

Loading all 135 locale files upfront would bloat the initial bundle. Instead, load the locale file dynamically based on the user's preference:

```typescript
async function loadLocale(locale: string) {
  const messages = await import(`./locales/${locale}.json`);
  i18n.addResourceBundle(locale, 'translation', messages);
  i18n.changeLanguage(locale);
}
```

This adds only the active locale's strings to the bundle — typically 10–50KB per locale.

**Testing with pseudo-locales:**

A pseudo-locale transforms English strings into accented versions that are 30–40% longer: "Payroll Dashboard" becomes "[Pàýröll Dàshböàrd !!!]". This reveals:
- **Truncation**: UI elements that can't accommodate longer translated strings
- **Hardcoded strings**: Any English text that doesn't transform was missed during extraction
- **Layout issues**: Containers that break with longer content

Run pseudo-locale tests in CI to catch i18n issues before translators are involved.

---

## Q27. How would you implement role-based access control (RBAC) on the frontend for IRIS — where a senior accountant sees different features than a junior?

### Key Talking Points
- **Never trust frontend RBAC for security** — backend enforces all access control; frontend RBAC is UX only
- Permissions stored in **JWT claims** or fetched at login and stored in global state (NgRx / React context)
- Angular: **Route guards** (`canActivate`) + structural directive `*ngIf="hasPermission('payroll:approve')"`
- React: `<PermissionGate permission="payroll:approve">` wrapper component
- Avoid fetching permissions per-component — causes waterfalls; load once at login
- **Audit logging**: log permission-denied events to analytics/monitoring for security review
- Graceful degradation: hide features, never crash — show "Contact your admin" messaging

### Detailed Answer

Frontend RBAC controls what users **see**, not what they can **do**. The backend must enforce every permission — the frontend is a UX convenience layer that hides features the user doesn't have access to, preventing confusion and reducing support tickets.

**Permission loading — once at login, stored globally:**

When the user authenticates, their permissions are either embedded in the **JWT claims** or fetched from a dedicated `/api/me/permissions` endpoint. These permissions are stored in global state (NgRx store, React context, or Zustand) and never fetched again until the session refreshes.

```typescript
// Permission structure
interface UserPermissions {
  roles: string[];           // ['senior-accountant', 'payroll-admin']
  permissions: string[];     // ['payroll:view', 'payroll:approve', 'reports:export']
  restrictions: string[];    // ['payroll:delete'] — explicitly denied
}
```

Loading permissions once at login avoids the waterfall problem where each component independently fetches its permissions, creating dozens of parallel API calls on page load.

**Angular implementation:**

Route guards prevent navigation to unauthorised routes:

```typescript
// permission.guard.ts
export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    if (authService.hasPermission(requiredPermission)) {
      return true;
    }
    // Redirect to "access denied" page, not login
    return inject(Router).createUrlTree(['/access-denied']);
  };
};

// routes
{ path: 'payroll/approve', component: PayrollApprovalComponent,
  canActivate: [permissionGuard('payroll:approve')] }
```

A structural directive hides UI elements:

```typescript
// has-permission.directive.ts
@Directive({ selector: '[hasPermission]' })
export class HasPermissionDirective {
  @Input() set hasPermission(permission: string) {
    if (this.authService.hasPermission(permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

// Usage in template
<button *hasPermission="'payroll:approve'" (click)="approvePayRun()">
  Approve Pay Run
</button>
```

**React implementation:**

A `PermissionGate` component wraps protected UI elements:

```tsx
function PermissionGate({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : fallback;
}

// Usage
<PermissionGate permission="payroll:approve">
  <button onClick={approvePayRun}>Approve Pay Run</button>
</PermissionGate>

// With fallback message
<PermissionGate
  permission="reports:export"
  fallback={<p>Contact your admin to enable report exports.</p>}
>
  <ExportButton />
</PermissionGate>
```

A custom hook for programmatic checks:

```tsx
function PayrollDashboard() {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('payroll:approve');
  const canExport = hasPermission('reports:export');

  return (
    <Dashboard>
      {canApprove && <ApprovalWidget />}
      <PayrollGrid showExport={canExport} />
    </Dashboard>
  );
}
```

**Graceful degradation principles:**

- **Hide, don't crash**: If a user doesn't have permission, the feature is invisible — not broken. Never show a button that throws an error when clicked.
- **"Contact your admin" messaging**: When a user navigates to a restricted route (via direct URL or bookmark), show a friendly "You don't have access to this feature. Contact your administrator." page — not a generic 403.
- **Disable, don't remove** (sometimes): For features the user can see but not act on (e.g., a junior accountant can view payroll but not approve it), show the data in read-only mode with the action button disabled and a tooltip explaining why.

**Audit logging:**

Log every permission-denied event to the analytics/monitoring platform:

```typescript
function checkPermission(permission: string): boolean {
  const hasAccess = userPermissions.includes(permission);
  if (!hasAccess) {
    analytics.track('permission_denied', {
      userId: currentUser.id,
      permission,
      route: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }
  return hasAccess;
}
```

This data reveals patterns: if many users are hitting permission denials for the same feature, it might indicate a misconfigured role or a UX issue where the feature is too visible to unauthorised users.

**Critical reminder: backend enforcement is the real security layer.** Every API endpoint must validate permissions server-side. The frontend can be bypassed by anyone with browser DevTools. Frontend RBAC is purely a UX optimisation — it makes the interface cleaner for each role, but it provides zero security guarantees.

---

## Q28. Walk through how you'd conduct a frontend architecture review for a legacy IRIS module before recommending a migration path.

### Key Talking Points
- **Audit checklist**: bundle size, test coverage, Lighthouse/accessibility score, dependency versions (outdated/vulnerable), code duplication
- Identify coupling: how many components directly call APIs vs going through a service layer
- Map **domain boundaries** — these become micro-frontend split points in the new architecture
- Identify shared state that needs extraction to a platform service
- Assess team ownership: modules with single owners migrate faster
- Prioritise by **business value x risk matrix**: high-value + low-risk first
- Recommend **Strangler Fig** for large modules; big-bang rewrite only for small, isolated utilities
- Output: ADR with migration phases, estimated effort, and rollback strategy

### Detailed Answer

A frontend architecture review is a structured assessment that produces an actionable migration plan. For IRIS's legacy modules, the review follows a systematic process that evaluates technical health, identifies migration boundaries, and prioritises work by business impact.

**Phase 1: Quantitative audit**

Start with measurable metrics that give an objective picture of the module's health:

- **Bundle size**: Run `webpack-bundle-analyzer` or `source-map-explorer`. A 2MB initial bundle signals heavy dependencies, poor code splitting, or dead code. Document the top 10 largest dependencies.
- **Test coverage**: Run the existing test suite with coverage reporting. Below 30% means migration carries high regression risk — you'll need to write characterisation tests before touching anything.
- **Lighthouse score**: Run Lighthouse on the module's key pages. Performance below 50, accessibility below 70, or SEO below 80 are red flags that the migration should address.
- **Dependency audit**: Run `npm audit` and check for outdated packages. Dependencies 3+ major versions behind (e.g., Angular 12 when current is 17) indicate significant upgrade effort.
- **Code duplication**: Run `jscpd` to identify copy-pasted code. High duplication suggests opportunities for shared libraries in the new architecture.

**Phase 2: Architectural analysis**

Examine the code structure to understand coupling, cohesion, and domain boundaries:

- **API coupling**: How many components directly call HTTP endpoints vs going through a service layer? Direct API calls in components make migration harder because the data-fetching logic is scattered. A service layer means you can swap the implementation behind the service without touching components.
- **State management**: Is state managed centrally (NgRx, Redux) or scattered across components? Central state is easier to migrate — you extract the store and selectors. Scattered state requires component-by-component analysis.
- **Domain boundaries**: Map which components, services, and routes belong to which business domain (payroll, HR, accounts). These boundaries become the micro-frontend split points. If domains are tangled (a payroll component imports an HR service), document the coupling that needs to be resolved.
- **Shared dependencies**: Identify code that multiple domains depend on (auth, logging, API clients, UI components). These become shared libraries in the new architecture.

**Phase 3: Team and organisational assessment**

- **Team ownership**: Modules owned by a single team migrate faster because there's no cross-team coordination. Modules with shared ownership need a clear migration lead.
- **Domain expertise**: Is there someone who understands the legacy business logic? If the original developers have left and there's no documentation, the migration risk increases significantly.
- **Deployment pipeline**: Does the module have its own CI/CD pipeline, or is it part of a monolithic deployment? Independent pipelines enable incremental migration.

**Phase 4: Prioritisation matrix**

Plot each module on a 2x2 matrix:

```
                    High Business Value
                          |
    Quick Wins            |    Strategic Priorities
    (migrate first)       |    (migrate with care)
                          |
  ----Low Risk -----------+----------- High Risk----
                          |
    Deprioritise          |    Manage Risk
    (migrate last)        |    (invest in tests first)
                          |
                    Low Business Value
```

- **Quick wins** (high value, low risk): Small modules with good test coverage and clear boundaries. Migrate first to build team confidence and demonstrate value.
- **Strategic priorities** (high value, high risk): Large, complex modules with poor test coverage. Invest in characterisation tests and documentation before migrating.
- **Manage risk** (low value, high risk): Legacy modules that are complex but rarely used. Consider whether migration is worth the effort — sometimes "leave it alone" is the right answer.
- **Deprioritise** (low value, low risk): Simple modules that work fine. Migrate last or only when forced by a dependency upgrade.

**Phase 5: Migration plan output**

The deliverable is an **Architecture Decision Record (ADR)** containing:

1. **Current state assessment**: metrics, architecture diagram, identified risks
2. **Target architecture**: micro-frontend boundaries, shared libraries, state management approach
3. **Migration phases**: ordered list of modules to migrate, with estimated effort per phase
4. **Migration strategy per module**: Strangler Fig for large modules, big-bang rewrite for small isolated utilities
5. **Rollback plan**: how to revert to legacy if a migration phase fails
6. **Success criteria**: measurable targets (bundle size reduction, Lighthouse score improvement, test coverage increase)

---

## Q29. You notice the IRIS Elements dashboard takes 8 seconds to load for a UK accountant with 500 clients. Walk through your debugging and optimisation process.

### Key Talking Points
- Step 1: **Waterfall analysis** in DevTools Network tab — identify blocking requests and TTFB
- Step 2: Check if all 500 clients fetched on initial load (**N+1 problem** — fetching details for each client separately)
- Step 3: **Lighthouse audit** for render-blocking resources, unused JS/CSS
- Fix 1: **Pagination / virtual scroll** for client list — don't load 500 records upfront
- Fix 2: **Skeleton loaders** for perceived performance during data fetch
- Fix 3: Defer non-critical dashboard widgets (charts, activity feed) — load core data first
- Fix 4: CDN for static assets + HTTP/2 multiplexing for parallel requests
- Fix 5: API **sparse fieldsets** — request only the fields needed for the list view
- Target: < 2s LCP with lazy-loaded secondary widgets

### Detailed Answer

An 8-second load time is unacceptable for a daily-use dashboard. The debugging process follows a systematic approach: **measure, identify bottlenecks, fix in order of impact, verify**.

**Step 1: Network waterfall analysis**

Open Chrome DevTools → Network tab → Hard refresh (Ctrl+Shift+R). The waterfall chart reveals:

- **TTFB (Time to First Byte)**: If the HTML document takes 2+ seconds to arrive, the problem is server-side (slow SSR, cold Lambda start, database query). This needs backend investigation.
- **Blocking chain**: Are resources loading sequentially when they could load in parallel? A common pattern: HTML → CSS → JS → API call → render. Each step blocks the next.
- **Large payloads**: Sort by size. A 5MB JavaScript bundle or a 2MB API response is an immediate red flag.
- **Too many requests**: Count the total requests. If there are 50+ API calls on initial load, there's likely an N+1 problem.

**Step 2: Identify the N+1 problem**

A common pattern in client dashboards: the page fetches a list of 500 client IDs, then makes a separate API call for each client's details. That's 501 HTTP requests — each with its own round-trip latency.

```
GET /api/clients              → returns 500 IDs (fast)
GET /api/clients/1/details    → 1 request per client
GET /api/clients/2/details    → ...
... (498 more requests)       → 8 seconds of sequential fetching
```

**Fix**: A single API call that returns all needed data: `GET /api/clients?fields=name,status,balance&limit=50&offset=0`

**Step 3: Lighthouse audit**

Run Lighthouse in DevTools → identify:
- **Render-blocking resources**: CSS and JS files in `<head>` without `async` or `defer`
- **Unused JavaScript**: Lighthouse reports how much JS is downloaded but never executed. This is dead code or eagerly-loaded feature modules.
- **Unoptimised images**: Dashboard logos, avatars, or chart images without compression or modern formats.

**Fix 1: Pagination + virtual scrolling**

Don't load 500 clients upfront. Implement **cursor-based pagination** with the API returning 50 clients per page:

```typescript
// API: GET /api/clients?cursor=abc123&limit=50
// Response: { clients: [...50 items], nextCursor: "def456" }

// Frontend: infinite scroll with virtual rendering
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['clients'],
  queryFn: ({ pageParam }) => fetchClients({ cursor: pageParam, limit: 50 }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

Combined with virtual scrolling (`@tanstack/react-virtual`), only the visible 15–20 rows are rendered in the DOM, regardless of how many are loaded.

**Fix 2: Skeleton loaders for perceived performance**

Show the dashboard layout immediately with skeleton placeholders where data will appear. This makes the perceived load time feel like 1–2 seconds even if the data takes 3 seconds to arrive:

```tsx
function ClientList({ isLoading, clients }) {
  if (isLoading) {
    return Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="skeleton-row" aria-hidden="true">
        <div className="skeleton-avatar" />
        <div className="skeleton-text" />
        <div className="skeleton-text short" />
      </div>
    ));
  }
  return clients.map(client => <ClientRow key={client.id} client={client} />);
}
```

**Fix 3: Prioritised loading — core data first**

The dashboard likely has multiple widgets: client list, revenue chart, activity feed, notifications, quick actions. Load them in priority order:

1. **Critical** (blocks LCP): Client list header + first 50 rows — load immediately
2. **Important** (above fold): Summary cards (total clients, revenue) — load in parallel with client list
3. **Deferred** (below fold or secondary): Charts, activity feed, notifications — load after critical content renders, or on scroll into view

```typescript
// Load critical data immediately
const clients = useQuery({ queryKey: ['clients'], queryFn: fetchClients });

// Defer non-critical data
const charts = useQuery({
  queryKey: ['revenue-chart'],
  queryFn: fetchRevenueData,
  enabled: clients.isSuccess, // Only fetch after critical data loads
});
```

**Fix 4: API sparse fieldsets**

The client list view only needs name, status, and balance — not the full client record with address, tax history, and 50 other fields. Request only what's needed:

```
GET /api/clients?fields=id,name,status,balance&limit=50
```

This reduces the API response size from potentially 2MB (full records) to 50KB (list fields only). The full record is fetched on-demand when the user clicks into a client detail view.

**Fix 5: Static asset optimisation**

- Serve static assets (JS, CSS, fonts, images) from a **CDN** (CloudFront) with long cache headers and content-hashed filenames.
- Enable **HTTP/2** for parallel multiplexing — multiple assets download simultaneously over a single connection.
- Enable **Brotli compression** on the CDN — 15–20% smaller than gzip for JavaScript.

**Verification:**

After applying fixes, measure again:
- Network waterfall: fewer requests, smaller payloads, parallel loading
- Lighthouse: LCP < 2.5s, no render-blocking resources
- Real user monitoring: `web-vitals` library reports field data from actual UK accountants

Target: **LCP < 2 seconds** with the first 50 clients visible, secondary widgets lazy-loaded.

---

## Q30. Design a real-time collaborative tax return tool where two accountants can work on the same return simultaneously without overwriting each other's changes.

### Key Talking Points
- **Operational Transformation (OT)** or **CRDTs** (Conflict-free Replicated Data Types) for concurrent edits — same approach as Google Docs
- Each field change broadcast via **WebSocket** to collaborating users
- **Presence indicators**: show which field the other accountant is currently editing (coloured cursor/highlight)
- **Optimistic UI**: apply local changes immediately, reconcile with server response
- **Lock strategy** for section-level conflicts: soft lock (warn user) vs hard lock (block edit) — discuss tradeoffs for compliance-sensitive tax data
- Version history: every save creates a versioned snapshot in the backend for audit trail (regulatory requirement for IRIS)
- Fallback: if WebSocket drops, revert to last-known-good server state + merge prompt

### Detailed Answer

Real-time collaboration on a tax return is architecturally similar to Google Docs, but with additional constraints: **financial accuracy is non-negotiable**, **audit trails are regulatory requirements**, and **field-level conflicts have real-world consequences** (incorrect tax filings).

**Architecture overview:**

```
Accountant A's Browser ←→ WebSocket Server ←→ Accountant B's Browser
                              ↕
                        Collaboration Service
                              ↕
                        Database (versioned)
```

**Conflict resolution strategy: CRDTs for structured form data**

A tax return is a structured document with discrete fields (income, deductions, tax credits), not free-form text. This makes **CRDTs (Conflict-free Replicated Data Types)** a better fit than Operational Transformation (which is optimised for text editing).

Each field is modelled as a **Last-Writer-Wins Register (LWW-Register)** — a CRDT where the most recent write wins, using a logical timestamp (Lamport clock) to determine ordering:

```typescript
interface FieldUpdate {
  fieldPath: string;        // "income.employment.gross"
  value: number | string;
  timestamp: number;        // Lamport clock — monotonically increasing
  userId: string;           // Who made the change
  version: number;          // Document version at time of edit
}
```

When two accountants edit different fields simultaneously, there's no conflict — both updates are applied. When they edit the *same* field, the update with the higher timestamp wins. The "losing" accountant sees their value replaced and receives a notification: "Jane updated Gross Employment Income to £52,000."

**Real-time sync via WebSocket:**

```typescript
// Client-side collaboration service
class CollaborationService {
  private ws: WebSocket;
  private localClock = 0;

  connect(documentId: string) {
    this.ws = new WebSocket(`wss://collab.iris.co.uk/tax-return/${documentId}`);

    this.ws.onmessage = (event) => {
      const update: FieldUpdate = JSON.parse(event.data);

      if (update.type === 'field_update') {
        this.applyRemoteUpdate(update);
      } else if (update.type === 'presence') {
        this.updatePresence(update);
      }
    };
  }

  updateField(fieldPath: string, value: any) {
    this.localClock++;
    const update: FieldUpdate = {
      fieldPath,
      value,
      timestamp: this.localClock,
      userId: currentUser.id,
      version: this.documentVersion
    };

    // Optimistic: apply locally immediately
    this.applyLocalUpdate(update);

    // Broadcast to other collaborators
    this.ws.send(JSON.stringify(update));
  }

  private applyRemoteUpdate(update: FieldUpdate) {
    // Update Lamport clock
    this.localClock = Math.max(this.localClock, update.timestamp) + 1;

    // Apply to local state — LWW: higher timestamp wins
    const currentField = this.getField(update.fieldPath);
    if (update.timestamp > currentField.timestamp) {
      this.setField(update.fieldPath, update.value, update.timestamp);
      this.showNotification(
        `${update.userId} updated ${update.fieldPath} to ${update.value}`
      );
    }
  }
}
```

**Presence indicators:**

Each collaborator's cursor position and active field are broadcast via the WebSocket. The UI shows:

- A **coloured highlight** on the field another accountant is currently editing (e.g., blue border with "Jane is editing" tooltip)
- A **collaborator avatar** in the top-right corner showing who's currently viewing the document
- A **typing indicator** when the other accountant is actively entering data in a field

```typescript
// Broadcast presence every 2 seconds and on field focus
function broadcastPresence(activeField: string | null) {
  ws.send(JSON.stringify({
    type: 'presence',
    userId: currentUser.id,
    activeField,
    cursor: { section: 'income', field: 'employment.gross' }
  }));
}
```

**Section-level locking for compliance-sensitive fields:**

For critical tax calculation fields where concurrent edits could cause incorrect filings, implement **soft locks**:

- When Accountant A starts editing the "Tax Credits" section, a soft lock is acquired
- Accountant B sees the section highlighted with "Jane is editing Tax Credits" and a warning: "Editing simultaneously may cause conflicts"
- Accountant B *can* still edit (soft lock, not hard lock) — but both are warned
- For the most critical fields (final tax liability, submission fields), a **hard lock** prevents concurrent edits entirely: "This field is locked while Jane is editing. It will unlock when she saves or after 5 minutes of inactivity."

**Version history and audit trail:**

Every save creates a versioned snapshot in the database. This is a **regulatory requirement** for tax returns — HMRC (UK tax authority) may require proof of who changed what and when.

```typescript
interface DocumentVersion {
  versionId: string;
  documentId: string;
  timestamp: Date;
  userId: string;
  changes: FieldUpdate[];     // What changed in this version
  snapshot: TaxReturnData;    // Full document state at this version
  reason?: string;            // Optional: "Corrected employment income per client P60"
}
```

The UI provides a **version history panel** showing all changes with timestamps and authors. Any version can be restored, and a diff view shows what changed between versions.

**Fallback when WebSocket disconnects:**

If the WebSocket connection drops (network issue, server restart):

1. The client detects the disconnection and shows a warning banner: "Connection lost. Your changes are saved locally."
2. Local changes are queued in memory (or IndexedDB for persistence)
3. On reconnect, the client fetches the latest server state
4. If no conflicts: queued changes are replayed and broadcast
5. If conflicts detected: the client shows a merge dialog: "Jane made changes while you were offline. Review and merge."

The merge dialog shows a side-by-side diff of the user's local changes vs the server state, allowing the accountant to choose which values to keep — field by field. This is the safest approach for financial data where automatic merging could produce incorrect results.

---


# Category 7: Mobile Strategy & Cross-Platform (Questions 31-32)

---

## Q31. How would you define a mobile strategy for an enterprise HR/payroll product like IRIS that serves 100,000+ customers across 135 countries?

### Key Talking Points
- **PWA first** for employee self-service (view payslip, request leave, check schedule) — same codebase as web, installable, offline-capable
- **Cross-platform (React Native / .NET MAUI / Flutter)** only if native features are required (biometrics, background sync, push notifications beyond Web Push)
- **.NET MAUI** deserves serious evaluation in a .NET shop — keeps the team in C#, but ecosystem is thinner than React Native
- **Responsive design from day one** in the design system — touch targets (44x44px minimum), mobile breakpoints, gesture support
- Admin tasks (run payroll, configure benefits) stay desktop-primary; manager approvals and employee self-service are mobile-priority
- **Capacitor/Cordova** as a thin native wrapper around PWA for app store presence without a separate codebase

### Detailed Answer

Mobile strategy for an enterprise HR/payroll product must start with **user segmentation** — different user roles have fundamentally different mobile needs.

**User role analysis:**

| Role | Primary Device | Key Mobile Actions | Mobile Priority |
|---|---|---|---|
| Employee | Mobile (60%+) | View payslip, request leave, check schedule, update personal details | High |
| Manager | Both (50/50) | Approve leave, review timesheets, quick performance check-ins | Medium-High |
| HR Admin | Desktop (90%+) | Run payroll, configure benefits, manage org structure, compliance reports | Low |
| Accountant | Desktop (85%+) | Tax calculations, journal entries, financial reporting | Low |

**Recommended tiered approach:**

**Tier 1: Progressive Web App (PWA) — covers 80% of mobile use cases**

The existing Angular/React web application, built with responsive design, becomes installable on mobile devices via a Service Worker. This is the highest-ROI approach because it requires no separate codebase:

```typescript
// Service Worker registration in the shell
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

// manifest.json for installability
{
  "name": "IRIS Elements",
  "short_name": "IRIS",
  "start_url": "/dashboard",
  "display": "standalone",
  "theme_color": "#005BF0",
  "icons": [{ "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" }]
}
```

PWA capabilities cover: offline access to cached payslips, push notifications (Web Push API) for leave approvals, home screen installation, and full-screen experience. The design system must enforce mobile-first responsive breakpoints and touch-friendly interactions from day one.

In my experience building the Fero design system (80+ Angular components serving 10+ themes across enterprise products), we embedded responsive behaviour at the component level — every component had mobile breakpoints, touch targets, and gesture support built in. The `@fero/assets` SCSS layer defined breakpoints in the theme, and components consumed them via mixins. The same approach applies here.

**Tier 2: Thin native wrapper (Capacitor) — for app store presence**

If the business requires app store distribution (common in enterprise for MDM/MAM compliance), wrap the PWA in Capacitor:

```bash
npx cap init "IRIS Elements" com.iris.elements
npx cap add ios
npx cap add android
```

Capacitor provides access to native APIs (biometrics, camera for document scanning, native push notifications) while keeping 95% of the code as the existing web app. The native shell is thin — it's essentially a WebView with native bridge plugins.

**Tier 3: Cross-platform native (React Native / .NET MAUI) — only if justified**

A dedicated native app is warranted only if:
- Offline-first with complex local data sync is required (e.g., field workers logging time without connectivity for days)
- Heavy native hardware integration (NFC for time clock, Bluetooth for badge readers)
- Performance requirements exceed what a WebView can deliver (real-time video for virtual meetings)

For a .NET shop like IRIS, **.NET MAUI** is worth evaluating — it keeps the team in C# and shares business logic with the backend. However, the component ecosystem is significantly thinner than React Native's, and hiring MAUI developers is harder. **React Native** has the largest ecosystem and the most mature component libraries, making it the safer choice if native is required.

**Design system implications:**

The design system must support mobile from the foundation:

```scss
// Design tokens for touch targets
$touch-target-minimum: 44px;  // WCAG 2.5.5 Target Size
$touch-target-comfortable: 48px;  // Material Design recommendation

// Responsive breakpoints in the theme
$breakpoints: (
  xs: 0,      // Mobile portrait
  sm: 576px,  // Mobile landscape
  md: 768px,  // Tablet
  lg: 1024px, // Desktop
  xl: 1280px, // Large desktop
);
```

In the Flare design system (React, 15 packages, Cornerstone OnDemand), we handled this through the `ThemeProvider` — `enableTouchTarget` added a CSS class that increased all interactive element hit areas to 44x44px minimum. The same token-driven approach works for IRIS.

---

## Q32. How do you ensure cross-browser, cross-device, and cross-platform testing for an enterprise product used by 100,000+ customers?

### Key Talking Points
- **Define the support matrix first** — Chrome, Edge, Firefox, Safari (latest 2 versions); desktop primary, tablet secondary, mobile tertiary
- **Automated (CI)**: component tests + critical E2E in Chrome headless (catches 90%)
- **Cross-browser (CI)**: BrowserStack/Sauce Labs for critical journeys across browsers
- **Visual regression**: Chromatic/Percy screenshots across Chrome + Safari (most rendering differences)
- **Manual (quarterly)**: real device testing for touch interactions, responsive layouts, mobile Safari quirks
- Enterprise gotchas: corporate proxies breaking WebSockets, locked-down browsers, high-DPI displays, slow networks

### Detailed Answer

Cross-browser testing for an enterprise product requires a **risk-based approach** — you can't test everything everywhere, so you prioritise based on user data and business impact.

**Step 1: Define the support matrix from analytics data**

```
Browser Support Matrix (based on IRIS user analytics):
┌──────────────┬────────────┬──────────────────────────────┐
│ Browser      │ % of Users │ Support Level                │
├──────────────┼────────────┼──────────────────────────────┤
│ Chrome       │ 65%        │ Full (latest 2 versions)     │
│ Edge         │ 20%        │ Full (latest 2 versions)     │
│ Firefox      │ 8%         │ Full (latest 2 versions)     │
│ Safari       │ 5%         │ Full (latest 2 versions)     │
│ IE 11        │ 2%         │ Graceful degradation only    │
└──────────────┴────────────┴──────────────────────────────┘

Device Matrix:
┌──────────────┬────────────┬──────────────────────────────┐
│ Device       │ % of Users │ Testing Approach             │
├──────────────┼────────────┼──────────────────────────────┤
│ Desktop      │ 75%        │ Full automated + manual      │
│ Tablet       │ 15%        │ Responsive + touch testing   │
│ Mobile       │ 10%        │ PWA + critical journeys      │
└──────────────┴────────────┴──────────────────────────────┘
```

**Step 2: Multi-layer testing strategy**

**Layer 1 — Automated in CI (every PR):**
- Component tests (Jest + Testing Library) in JSDOM — catches logic and interaction bugs.
- E2E tests (Playwright) in Chrome headless — catches integration bugs.
- This catches 90% of issues and runs in under 5 minutes.

**Layer 2 — Cross-browser in CI (nightly or per-release):**
- Run critical E2E journeys across Chrome, Firefox, Safari, Edge using BrowserStack Automate or Playwright's multi-browser support.
- Focus on the 5-10 most critical user journeys (login → payroll → payslip, leave request → approval).

```yaml
# Playwright config for cross-browser
projects:
  - name: chromium
    use: { browserName: 'chromium' }
  - name: firefox
    use: { browserName: 'firefox' }
  - name: webkit
    use: { browserName: 'webkit' }
```

**Layer 3 — Visual regression (every PR):**
- Chromatic/Percy captures screenshots of every Storybook story across Chrome and Safari.
- Catches CSS rendering differences: flexbox gap support, font rendering, shadow rendering, scrollbar styling.

In the Fero CI pipeline, we ran a dedicated accessibility test suite (`test:ci --configuration=a11y`) as a separate CI step, plus Storybook addon-a11y for visual review. The same multi-layer approach applies to cross-browser testing.

**Layer 4 — Manual testing (quarterly release cycle):**
- Real device testing on physical iOS and Android devices.
- Screen reader testing: NVDA (Windows), VoiceOver (macOS/iOS), TalkBack (Android).
- Keyboard-only navigation testing across all browsers.
- Network throttling testing (3G simulation) for users on slow corporate networks.

**Enterprise-specific gotchas to test for:**
- Corporate proxies blocking WebSocket connections (SignalR fallback to long-polling).
- Content Security Policy (CSP) headers breaking inline styles or eval.
- High-DPI displays (2x, 3x) — test icon rendering and image sharpness.
- Browser extensions (ad blockers, password managers) interfering with form inputs.
- Locked-down browsers with disabled features (some government clients disable Web Workers).

---


# Category 8: Design System Leadership & Design-to-Code (Questions 33-36)

---

## Q33. How would you architect a design system contribution model where feature teams can extend the system while maintaining consistency and quality?

### Key Talking Points
- **Layered ownership**: platform team owns tokens + primitives, feature teams own composite patterns, all teams own feature components
- **Inner-source model**: feature teams contribute via reviewed PRs with a clear "definition of done"
- **Contribution checklist**: a11y audit, i18n support, theming support, unit tests, Storybook story, documentation
- **Nx generators** for scaffolding — `yarn add:component` creates the boilerplate so teams start with the right structure
- **Office hours** and a Slack channel for quick feedback before teams invest time
- **Semantic versioning** with changelogs so consuming teams know what changed

### Detailed Answer

A design system that only the platform team can contribute to becomes a bottleneck. A design system that anyone can change without review becomes inconsistent. The solution is a **governed inner-source model** with clear ownership tiers.

**Ownership tiers:**

```
Tier 1: Design Tokens (colors, spacing, typography, shadows)
    → Owned by: Platform/Design System team
    → Change process: RFC + design review + platform team approval
    → Rationale: tokens affect EVERY component — changes cascade everywhere

Tier 2: Core Components (button, input, modal, alert, datagrid)
    → Owned by: Platform team, contributions welcome via PR
    → Change process: Proposal → platform review → build → PR review checklist
    → Rationale: core components are used by every team — API stability matters

Tier 3: Composite Patterns (data table with filters, form wizard, search bar)
    → Co-owned: Feature teams build, platform team reviews
    → Change process: Lightweight RFC → build → PR review
    → Rationale: patterns combine primitives — need consistency but allow innovation

Tier 4: Feature Components (payroll calculator, leave request form)
    → Owned by: Feature teams autonomously
    → Change process: Standard team PR process
    → Rationale: domain-specific, only used by one team
```

In the Fero design system, we had exactly this model. `@fero/ui` (60+ components) and `@fero/core` were platform-owned. Feature teams in FeroUI consumed them via npm and contributed back through the UXE (UX Engineering) team's fork. Automated uptake PRs via BitBot ensured controlled version upgrades across all 10+ domain teams.

**The contribution workflow:**

```
1. Feature team identifies a need (new component or variant)
       ↓
2. Opens a lightweight proposal (problem, proposed API, design mockup)
       ↓
3. Platform team reviews for consistency, a11y, and API design
   (async review — 48-hour SLA, not a meeting)
       ↓
4. Feature team builds it (platform team pairs if needed)
       ↓
5. PR goes through the Definition of Done checklist:
   ☐ Accessibility: axe-core zero violations, keyboard navigable, screen reader tested
   ☐ Internationalisation: all strings externalised, RTL tested
   ☐ Theming: uses design tokens, works across all themes
   ☐ Tests: unit tests (Jest/Jasmine), interaction tests
   ☐ Storybook: stories for every state (default, hover, disabled, error, loading, RTL)
   ☐ Documentation: props table, usage examples, do's and don'ts
   ☐ Bundle impact: no new dependencies without justification
       ↓
6. Platform team reviews and merges
       ↓
7. Published as a new version, changelog generated automatically
```

**Tooling that makes contribution easy:**

Custom Nx generators (like Fero's `@fero/nx-plugin` and Flare's `@flare/tools`) scaffold the boilerplate:

```bash
# Generates component file, types, tests, stories, barrel export
yarn add:component --name=PayrollSummaryCard --package=ui
```

This ensures every contributed component starts with the right file structure, test setup, and Storybook configuration. The generator enforces the architecture — teams can't accidentally skip the test file or forget the barrel export.

**What kills contribution models:**
- Making the process so heavy that teams copy-paste instead of contributing.
- Platform team becoming a bottleneck by insisting on doing everything themselves.
- No feedback loop — teams contribute but never hear back.
- No recognition — contributions should be celebrated, not just accepted.

---

## Q34. How would you establish design-to-code workflows and tooling standards (Figma-to-code pipelines, Storybook, visual regression)?

### Key Talking Points
- **Design tokens as the contract** between design and engineering — Figma Variables → Style Dictionary → CSS custom properties
- **Token taxonomy**: global (primitives) → semantic (alias) → component (specific)
- **Storybook as the living catalogue** — if it's not in Storybook, it doesn't exist
- **Chromatic/Percy** for visual regression — every PR gets pixel-diff review
- **Figma plugin integration** — Tokens Studio for token management, Figma Variables for native support
- The pipeline must be **automated** — manual token sync is a recipe for drift

### Detailed Answer

The design-to-code pipeline ensures that design decisions flow into code without manual translation, reducing drift and miscommunication between designers and engineers.

**The pipeline architecture:**

```
Figma (Design)
  │
  ├── Figma Variables / Tokens Studio plugin
  │   → Exports tokens as JSON (W3C Design Tokens format)
  │
  ▼
Style Dictionary (Transform)
  │
  ├── CSS custom properties (web)
  ├── SCSS variables (legacy CSS)
  ├── TypeScript constants (programmatic access)
  └── Swift/Kotlin values (mobile, if needed)
  │
  ▼
npm package (@iris/design-tokens)
  │
  ├── Published to private registry (Artifactory/CodeArtifact)
  │
  ▼
Component Library (@iris/ui)
  │
  ├── Components consume tokens: var(--iris-color-primary)
  │
  ▼
Storybook (Documentation + Visual Testing)
  │
  ├── Every component, every state, every theme
  ├── Chromatic captures screenshots on every PR
  └── Designers review in Storybook, not in code
```

**Token taxonomy — three levels:**

```json
// Level 1: Global tokens (primitives) — raw values
{
  "color": {
    "blue": {
      "500": { "value": "#005BF0" },
      "400": { "value": "#3380F4" },
      "300": { "value": "#66A0F7" }
    }
  }
}

// Level 2: Semantic tokens (aliases) — intent-based
{
  "color": {
    "primary": { "value": "{color.blue.500}" },
    "primary-hover": { "value": "{color.blue.400}" },
    "primary-light": { "value": "{color.blue.300}" }
  }
}

// Level 3: Component tokens (specific) — component-scoped
{
  "button": {
    "background-primary": { "value": "{color.primary}" },
    "background-primary-hover": { "value": "{color.primary-hover}" }
  }
}
```

In the Fero design system, we used a similar layered approach. The `@lego/design-tokens` package transformed Figma variable exports (`figma-variables.json`) through Style Dictionary into CSS custom properties, with a Tailwind config generated alongside for utility-class consumption. The Flare design system took a different approach — tokens were defined directly in TypeScript with typed helper functions (`th.color('primary')`, `th.space('medium')`), giving compile-time safety at the cost of Figma sync automation.

**Storybook as the single source of truth:**

Every component must have Storybook stories covering:
- Default state, hover, focus, active, disabled
- Error state, loading state, empty state
- All size variants (sm, md, lg)
- RTL layout
- Each theme (if multi-theme)
- Responsive breakpoints (mobile, tablet, desktop)

```typescript
// Comprehensive story coverage
export default { title: 'Components/Button', component: Button };
export const Primary = { args: { variant: 'primary', label: 'Submit' } };
export const Disabled = { args: { variant: 'primary', label: 'Submit', disabled: true } };
export const Loading = { args: { variant: 'primary', label: 'Submit', loading: true } };
export const RTL = { args: { variant: 'primary', label: 'إرسال' }, decorators: [withRTL] };
export const DarkTheme = { args: { variant: 'primary', label: 'Submit' }, decorators: [withDarkTheme] };
```

**Visual regression with Chromatic:**

Every PR triggers Chromatic to capture screenshots of all stories. Changes are highlighted with pixel-level diffs. The workflow:

1. Developer changes a component's CSS
2. Chromatic captures before/after screenshots
3. If visual changes detected → PR is blocked until a reviewer approves the visual diff
4. Approved changes become the new baseline

This catches unintended visual regressions (a padding change in one component affecting another) before they reach production.

---

## Q35. How would you implement multi-tenancy, white-labelling, and theming in a frontend architecture for enterprise customers?

### Key Talking Points
- **Design tokens as CSS custom properties** on `:root` — tenant config overrides them at runtime
- **Three levels of customisation**: theming (visual), feature toggling (functional), configuration-driven UI (structural)
- Tenant identification: subdomain (`acme.iris.co.uk`) is cleanest
- Theme loading **before first paint** to avoid flash of default theme
- **Never hard-code tenant-specific logic** — if you write `if (tenant === 'acme')`, the architecture is wrong
- Cache tenant config aggressively (localStorage + service worker) but invalidate on changes

### Detailed Answer

Multi-tenancy in the frontend has three levels of complexity, and enterprise customers typically need all three.

**Level 1 — Theming (visual customisation):**

Design tokens as CSS custom properties are the foundation. The default theme defines all tokens on `:root`. Tenant-specific overrides replace only the tokens that differ:

```css
/* Default theme */
:root {
  --iris-color-primary: #005BF0;
  --iris-color-primary-hover: #0047C2;
  --iris-font-family: 'Inter', sans-serif;
  --iris-border-radius: 4px;
  --iris-logo-url: url('/assets/iris-logo.svg');
}

/* Tenant override — loaded at runtime */
:root[data-tenant="acme"] {
  --iris-color-primary: #FF6B00;
  --iris-color-primary-hover: #E05500;
  --iris-font-family: 'Roboto', sans-serif;
  --iris-logo-url: url('/assets/acme-logo.svg');
}
```

The tenant theme is fetched from a config API at app bootstrap and injected before the first render:

```typescript
// Bootstrap script — runs before Angular/React initialises
async function loadTenantTheme() {
  const tenantId = getTenantFromSubdomain(); // acme.iris.co.uk → "acme"
  const cached = localStorage.getItem(`theme-${tenantId}`);

  if (cached) {
    applyTheme(JSON.parse(cached)); // Apply cached theme immediately
  }

  // Fetch latest in background
  const theme = await fetch(`/api/tenants/${tenantId}/theme`).then(r => r.json());
  applyTheme(theme);
  localStorage.setItem(`theme-${tenantId}`, JSON.stringify(theme));
}

function applyTheme(theme: TenantTheme) {
  document.documentElement.setAttribute('data-tenant', theme.tenantId);
  Object.entries(theme.tokens).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--iris-${key}`, value);
  });
}
```

In the Fero design system, we supported 10+ themes (Saba, dark, material-blue, CSOD, PXP, Lumesse, etc.) using SMACSS architecture with per-component config/theme SCSS files. Each theme overrode only the visual layer — structure stayed constant. PostCSS RTL generation automatically created RTL variants. The Flare design system handled white-labelling through the `ThemeProvider`'s `baseColor` prop — setting a brand colour automatically adjusted the entire primary scale.

**Level 2 — Feature toggling (functional customisation):**

Not every tenant gets every feature. A feature flag system controls visibility:

```typescript
// Angular structural directive
@Directive({ selector: '[featureToggle]' })
export class FeatureToggleDirective {
  @Input() set featureToggle(feature: string) {
    if (this.featureService.isEnabled(feature)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

// Usage
<div *featureToggle="'ADVANCED_PAYROLL'">
  <advanced-payroll-dashboard />
</div>
```

In Fero, `@fero/core/platform` provided a feature toggle service with both a directive and a route guard — the same pattern IRIS should adopt.

**Level 3 — Configuration-driven UI (structural customisation):**

Enterprise customers want custom fields, custom workflows, and custom form layouts. This requires a **schema-driven rendering approach**:

```typescript
// JSON schema from backend (per-tenant)
{
  "formId": "employee-onboarding",
  "sections": [
    {
      "title": "Personal Details",
      "fields": [
        { "key": "firstName", "type": "text", "required": true },
        { "key": "lastName", "type": "text", "required": true },
        { "key": "employeeId", "type": "text", "required": true },
        { "key": "customField_costCentre", "type": "dropdown", "options": "api:/lookups/cost-centres" }
      ]
    }
  ]
}

// Dynamic form engine renders it
<dynamic-form [schema]="formSchema" (submit)="onSubmit($event)" />
```

Libraries like **Formly** (Angular) or **React JSON Schema Form** handle the rendering. The schema lives in the backend, per-tenant. The frontend is a generic renderer — no tenant-specific code.

---

## Q36. How do you build and maintain a CI/CD pipeline for frontend artefacts, including versioning and publishing of shared component packages?

### Key Talking Points
- **Monorepo CI with affected builds** — Nx only rebuilds/retests what changed
- **Semantic versioning** with conventional commits — automated changelog generation
- **Private npm registry** (Artifactory/CodeArtifact) for internal packages
- **Multi-stage pipeline**: lint → unit test → a11y test → build → visual regression → publish
- **Bundle size budgets** enforced in CI — fail if exceeded
- **Automated uptake PRs** — when the design system publishes, consuming apps get automated PRs

### Detailed Answer

A CI/CD pipeline for frontend artefacts must handle both **application deployment** and **library publishing** — they have different lifecycles and different consumers.

**Pipeline architecture:**

```
PR Opened → CI Pipeline:
┌─────────────────────────────────────────────────────────┐
│  Stage 1: Quality Gates (parallel)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Lint     │  │ Type     │  │ Unit     │  │ A11y   │ │
│  │ (ESLint  │  │ Check    │  │ Tests    │  │ Tests  │ │
│  │ +Style-  │  │ (tsc)    │  │ (Jest/   │  │ (axe-  │ │
│  │  lint)   │  │          │  │ Jasmine) │  │ core)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
├─────────────────────────────────────────────────────────┤
│  Stage 2: Build                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ nx affected:build --prod                          │   │
│  │ Bundle size check (fail if budget exceeded)       │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Stage 3: Visual Regression                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Storybook build → Chromatic upload                │   │
│  │ Pixel-diff review required before merge           │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Stage 4: E2E (critical paths only)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Playwright: login → payroll → payslip             │   │
│  │ Cross-browser: Chrome + Firefox + Safari          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

Merge to main → Publish Pipeline:
┌─────────────────────────────────────────────────────────┐
│  1. Version bump (lerna version --conventional-commits)  │
│  2. Changelog generation (from conventional commits)     │
│  3. Build all packages (CJS + ESM + type declarations)   │
│  4. Publish to Artifactory (lerna publish)                │
│  5. Tag git commit with version                          │
│  6. Trigger automated uptake PRs in consuming apps       │
└─────────────────────────────────────────────────────────┘
```

In the Fero ecosystem, the CI pipeline published **15 packages** to Artifactory after passing sanity checks (lint, unit tests, a11y tests, build, Storybook build, Cypress E2E). FeroUI consumed these via automated uptake PRs — BitBot created PRs from the UXE fork to `main/develop` whenever a new Fero build was published. This ensured controlled version upgrades across all 10+ domain teams.

The Flare design system used Lerna + Nx with independent versioning — each of the 15 packages had its own version, so a primitives patch could ship without bumping the learning package. Nx caching meant a clean CI build took 8 minutes, but a cached build (no changes to a package) took 30 seconds.

**Key practices:**

1. **Conventional commits** enforce structured commit messages (`feat:`, `fix:`, `BREAKING CHANGE:`). Lerna uses these to automatically determine version bumps and generate changelogs.

2. **Bundle size budgets** in CI prevent regressions:
```json
// angular.json
"budgets": [
  { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" },
  { "type": "anyComponentStyle", "maximumWarning": "4kb" }
]
```

3. **Affected builds** via Nx — only rebuild and retest packages that changed or depend on changed packages. This keeps CI fast even in a large monorepo.

4. **Dual module output** (CJS + ESM) ensures compatibility with both legacy build tools (Jest, older Webpack) and modern bundlers (Vite, Webpack 5) that benefit from tree-shaking.

---


# Category 9: Accessibility Deep Dive (Questions 37-38)

---

## Q37. How do you embed accessibility (WCAG compliance) as a core consideration across all front-end work, not bolt it on at the end?

### Key Talking Points
- Accessibility fails when treated as a checklist at the end — it must be in **design, development, and CI/CD**
- **Design phase**: a11y-aware Figma plugins, contrast ratios in design reviews, focus order in wireframes
- **Development phase**: component library handles the hard a11y work (focus trapping, keyboard nav, ARIA live regions)
- **CI/CD phase**: axe-core in every component test, Lighthouse a11y score tracked per release, custom ESLint rules
- **Manual testing**: quarterly audits with screen readers (NVDA, VoiceOver) — automation catches 30-40%, humans catch the rest
- WCAG 2.1 AA as minimum bar, with AAA targets for critical user journeys (payslip viewing, leave requests)

### Detailed Answer

Accessibility must be embedded at three levels: design, development, and verification. If any level is missing, a11y becomes an afterthought that's expensive to retrofit.

**Level 1 — Design phase (prevent issues before code is written):**

- Designers use a11y-aware Figma plugins (Stark, Contrast Checker) to verify colour contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text).
- Design reviews include: focus order documentation, touch target sizes (44x44px minimum per WCAG 2.5.5), text alternatives for images, and error state designs.
- The design system components are accessible by default — teams shouldn't have to think about ARIA roles for a dropdown. The platform team handles focus trapping in modals, keyboard navigation in menus, and ARIA live regions for dynamic content.

**Level 2 — Development phase (catch issues during coding):**

In the Fero design system, we built a multi-layer a11y infrastructure:

```
@fero/core/cdk/a11y/
├── FocusKeyManager      — manages focus within lists (arrow key navigation)
├── TabTrap              — traps focus inside modals/dialogs
├── Hotkey               — keyboard shortcut registration
├── AriaList             — ARIA listbox pattern implementation
├── FocusableItem        — marks elements as focusable in a managed list
└── KeyboardSelect       — keyboard selection in dropdowns/menus

@fero/core/platform/services/a11y/
├── AriaService          — programmatic ARIA attribute management
└── LiveAnnouncer        — screen reader announcements for dynamic content
```

The Flare design system (React) used `LiveAnnouncerProvider` for screen reader announcements and Radix UI primitives for accessible dropdown, dialog, and tooltip patterns.

**Custom ESLint rules** catch common mistakes at development time:

```javascript
// @fero/eslint-plugin — template-a11y config
{
  "alt-text": "error",                    // images need alt
  "valid-aria": "error",                  // valid ARIA attributes
  "elements-content": "error",            // non-empty elements
  "label-has-associated-control": "error", // form labels
  "role-has-required-aria": "error",       // ARIA roles have required attributes
  "mouse-events-have-key-events": "error", // mouse handlers need keyboard equivalents
  "no-positive-tabindex": "error",         // never use tabindex > 0
  "no-autofocus": "error",                // autofocus breaks screen reader flow
  "button-has-type": "error"              // buttons must have explicit type
}
```

**Level 3 — CI/CD phase (enforce standards automatically):**

```
CI Pipeline — Accessibility Gates:
┌─────────────────────────────────────────────────────────┐
│  Gate 1: Static Analysis (every PR)                      │
│  ESLint template-a11y rules — fail build on violations   │
├─────────────────────────────────────────────────────────┤
│  Gate 2: Component-Level a11y Tests (every PR)           │
│  Dedicated a11y test suite (axe-core per component)      │
│  jest-axe: expect(container).toHaveNoViolations()        │
├─────────────────────────────────────────────────────────┤
│  Gate 3: Storybook a11y Audits (visual review)           │
│  @storybook/addon-a11y (axe-core integration)            │
│  Every story has an a11y panel with violation details     │
├─────────────────────────────────────────────────────────┤
│  Gate 4: Manual 508 Testing (release cycle)              │
│  Screen reader testing (JAWS, NVDA, VoiceOver)           │
│  Keyboard-only navigation testing                        │
│  Section 508 compliance checklist                        │
└─────────────────────────────────────────────────────────┘
```

In the Fero CI pipeline, a11y testing was a **dedicated CI step** (`sanity-a11y.sh`) that ran separately from unit tests. This ensured a11y failures were visible and couldn't be hidden among other test results.

**The hard truth:** Automated tools catch ~30-40% of WCAG issues (contrast, missing alt text, missing labels, invalid ARIA). They cannot catch "is this flow actually usable with a screen reader?" or "does the focus order make logical sense?" That requires human testing with assistive technologies. Budget for quarterly manual audits of critical user journeys.

**Standards I'd establish:**
- WCAG 2.1 AA as the minimum bar for all components.
- Every new component must pass axe-core with zero violations before merge.
- An a11y champion in each team — not an expert, just someone who keeps the team honest.
- Quarterly manual a11y audit of the 10 most critical user journeys.

---

## Q38. How would you architect shared cross-cutting UI concerns — authentication flows, navigation patterns, error handling, and loading states — across a platform with multiple product teams?

### Key Talking Points
- These are **platform services** owned by the platform team — feature teams consume them, never re-implement
- **Auth**: centralised in the shell, HTTP interceptor chain attaches tokens, route guards check permissions
- **Error handling**: global error handler + HTTP interceptor for API errors + component-level error boundaries
- **Loading states**: shared loading service, consistent pattern (skeleton screens for initial load, inline spinners for actions)
- **Navigation**: framework-level navigation service with NgRx state, breadcrumb resolution, responsive adaptation
- Feature teams get these **for free** by using the platform — no configuration needed

### Detailed Answer

Cross-cutting concerns are the infrastructure that every feature team needs but nobody wants to build. The platform team owns them, and they're provided transparently through the framework layer.

**Architecture — the platform service layer:**

```
┌─────────────────────────────────────────────────────────┐
│                    Feature Teams                         │
│  Payroll Module  │  HR Module  │  Accounts Module       │
│  (uses platform  │  (uses      │  (uses platform        │
│   services       │   platform  │   services              │
│   transparently) │   services) │   transparently)        │
├─────────────────────────────────────────────────────────┤
│                Platform Service Layer                    │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ Auth     │ │ Error    │ │ Loading  │ │ Navigation│ │
│  │ Service  │ │ Handler  │ │ Service  │ │ Service   │ │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ i18n     │ │ Feature  │ │ Cache    │ │ Logging   │ │
│  │ Service  │ │ Toggles  │ │ Service  │ │ Service   │ │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘ │
├─────────────────────────────────────────────────────────┤
│                    Shell Application                     │
│  (registers all platform services at bootstrap)          │
└─────────────────────────────────────────────────────────┘
```

In the Fero architecture, `@fero/core/platform` provided exactly this layer — i18n, cache, HTTP interceptors, configuration, feature toggles, logging, error handling, dynamic component loading, and a11y services. Feature teams in FeroUI consumed these transparently by importing `@fero/core/platform`.

**Authentication — centralised in the shell:**

The shell owns the entire auth lifecycle. In the FeroUI architecture, the shell decided what to load based on auth state:

```typescript
// Shell bootstrap — decides login vs main app
const TRQ_APP = SCUrlUtils.getBaseTrqApp();
RouterModule.forRoot(ROUTES_MAPPING[TRQ_APP] || LOGIN_ROUTES);
```

An HTTP interceptor chain (11 interceptors in FeroUI) handled CSRF tokens, auth errors, session timeouts, and audit headers transparently. Remotes shared the same `HttpClient` instance via Module Federation singleton sharing, so every API call from any remote automatically got auth handling.

**Error handling — three layers:**

```typescript
// Layer 1: Global error handler (catches unhandled exceptions)
@Injectable()
class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error): void {
    this.logger.error('Unhandled error', error);
    this.analytics.track('unhandled_error', { message: error.message, stack: error.stack });
    // Show user-friendly error boundary, not a white screen
  }
}

// Layer 2: HTTP interceptor (catches API errors)
@Injectable()
class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {
          case 401: this.auth.redirectToLogin(); break;
          case 403: this.toast.error('You do not have access to this resource.'); break;
          case 404: this.router.navigate(['/not-found']); break;
          case 500: this.toast.error('Something went wrong. Please try again.'); break;
        }
        return throwError(() => error);
      })
    );
  }
}

// Layer 3: Component-level error boundaries (prevents cascade)
// React: ErrorBoundary component
// Angular: ngIf with error state in the facade
```

**Loading states — consistent patterns:**

```typescript
// Shared loading service tracks in-flight HTTP requests
@Injectable({ providedIn: 'root' })
class LoadingService {
  private activeRequests = 0;
  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  start(): void {
    this.activeRequests++;
    this.isLoading$.next(true);
  }

  stop(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) this.isLoading$.next(false);
  }
}
```

Standards for loading patterns:
- **Skeleton screens** for initial page load — show the layout immediately with placeholder content.
- **Inline spinners** for user-initiated actions (save, submit) — localised to the action area.
- **Never full-page loading masks** — they block the entire UI and feel slow.
- **Optimistic updates** for fast actions — update the UI immediately, rollback on error.

**Navigation — framework-level service:**

In Fero, the `TrqFrameworkFacade` managed navigation state via NgRx — a tree-based navigation model with 30+ selectors deriving primary nav, sub-nav, side-nav, and breadcrumbs from a single navigation JSON structure. The facade combined 24 observables into a single `body$` stream that the shell component consumed. Feature teams never touched navigation — they just registered their routes, and the framework handled the rest.

---


# Category 10: API Design, SSR & .NET Integration (Questions 39-42)

---

## Q39. How do you approach API design from a frontend architect's perspective? When would you advocate for GraphQL, a BFF layer, or SignalR?

### Key Talking Points
- **REST** is fine for CRUD operations on well-defined entities — most HR/payroll APIs start here
- **GraphQL** when multiple clients need different shapes of the same data, or pages aggregate data from multiple services
- **BFF (Backend-for-Frontend)** when backend APIs are designed for microservice-to-microservice communication and are painful for the frontend
- **SignalR** for real-time push (payroll run progress, leave approval notifications) — first-class .NET ecosystem support
- In a .NET shop, an **ASP.NET Core BFF** is natural — backend team owns it, frontend team defines the contract
- **CQRS on the API side** — read models optimised for frontend views, write models for business logic

### Detailed Answer

The frontend architect's role in API design is to **represent the frontend team's needs** — ensuring APIs are optimised for UI consumption, not just backend convenience.

**The frontend's API wishlist:**
- One request per view (not 5 REST calls to assemble a dashboard)
- Only the fields needed (not a 200-field entity when the list view needs 3)
- Consistent error format across all endpoints
- Real-time updates where the UX demands it
- Pagination that works for both infinite scroll and traditional paging

**Decision framework:**

| Scenario | Recommendation | Rationale |
|---|---|---|
| Simple CRUD (employee profile, leave request) | REST | Well-understood, .NET has excellent REST support |
| Dashboard aggregating 5 services | GraphQL or BFF | One request instead of 5, frontend controls the shape |
| Multiple clients (web, mobile, third-party) | GraphQL | Each client queries exactly what it needs |
| Real-time updates (payroll progress, notifications) | SignalR | Full-duplex, .NET native, auto-fallback to long-polling |
| Backend APIs designed for microservices | BFF | Translate microservice APIs into frontend-friendly responses |

**GraphQL for data-heavy views:**

A payroll dashboard might need data from employee, tax, benefits, and time-tracking services. With REST, that's 4+ API calls with over-fetching. With GraphQL:

```graphql
query PayrollDashboard($employeeId: ID!) {
  employee(id: $employeeId) {
    name
    department
    salary { gross net taxCode }
    benefits { type value }
    timesheet(period: CURRENT) { hoursWorked overtime }
    leaveBalance { annual sick }
  }
}
```

One request, exactly the fields needed, no over-fetching. The GraphQL server (Apollo Server on Node.js, or Hot Chocolate on .NET) resolves each field from the appropriate backend service.

**BFF for .NET integration:**

When the backend APIs are designed for microservice-to-microservice communication (verbose, deeply nested, requiring multiple calls for one view), a BFF layer translates them into frontend-friendly responses:

```
Frontend → BFF (ASP.NET Core) → Backend Microservices
                │
                ├── GET /bff/payroll-dashboard
                │   → Calls: Employee API + Tax API + Benefits API + Time API
                │   → Returns: Single aggregated response shaped for the dashboard
                │
                ├── GET /bff/employee-list?fields=name,department,status&page=1&size=50
                │   → Calls: Employee API with full entity
                │   → Returns: Sparse fieldset with only requested fields
```

In a .NET shop, the BFF is an ASP.NET Core API that the backend team can own, but the frontend team defines the contract. This is a natural collaboration point.

**SignalR for real-time:**

SignalR is the .NET ecosystem's first-class real-time communication library. It uses WebSockets by default and automatically falls back to Server-Sent Events or long-polling when WebSockets are blocked (common in corporate environments):

```typescript
// Frontend — SignalR client
import { HubConnectionBuilder } from '@microsoft/signalr';

const connection = new HubConnectionBuilder()
  .withUrl('/hubs/payroll', { accessTokenFactory: () => getAccessToken() })
  .withAutomaticReconnect()
  .build();

connection.on('PayrollRunProgress', (progress: PayrollProgress) => {
  store.dispatch(updatePayrollProgress(progress));
});

connection.on('PayslipReady', (notification: PayslipNotification) => {
  showToast({ title: 'Payslip Ready', message: `Your ${notification.period} payslip is available.` });
});

await connection.start();
```

SignalR handles reconnection automatically, which is critical for enterprise environments where network interruptions are common.

---

## Q40. How would you implement SSR/SSG and hydration for an enterprise SPA to improve initial load performance?

### Key Talking Points
- For an enterprise SPA **behind a login**, SSR is less critical than for a public site — but it helps with initial load
- **SSR for the login page and dashboard shell** — these are the first things users see
- **CSR for everything else** — feature modules load on demand after the shell renders
- Angular Universal / Next.js (React) for SSR implementation
- **Hydration** must be seamless — no flash of unstyled content, no layout shift
- **SSG (Static Site Generation)** for marketing pages, help docs, changelog — content that doesn't change per user
- CDN caching of SSR output for the login page (same for all users)

### Detailed Answer

SSR/SSG strategy for an enterprise SPA must be pragmatic — not every page benefits from server rendering, and the complexity cost is real.

**Where SSR adds value:**

| Page | SSR Benefit | Recommendation |
|---|---|---|
| Login page | Fastest possible first paint, SEO for public login | SSR + CDN cache |
| Dashboard shell | Meaningful content before JS loads | SSR with streaming |
| Feature modules (payroll, HR) | Behind auth, data-dependent | CSR (lazy-loaded) |
| Help docs, changelog | Static content, SEO matters | SSG |
| Marketing pages | SEO critical, rarely changes | SSG + CDN |

**Angular Universal implementation:**

```typescript
// server.ts — Angular Universal server
import { ngExpressEngine } from '@nguniversal/express-engine';
import { AppServerModule } from './src/main.server';

app.engine('html', ngExpressEngine({ bootstrap: AppServerModule }));

app.get('/login', (req, res) => {
  res.render('index', {
    req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }]
  });
});

// Dashboard — SSR with transfer state to avoid duplicate API calls
app.get('/dashboard', (req, res) => {
  res.render('index', {
    req,
    providers: [
      { provide: APP_BASE_HREF, useValue: req.baseUrl },
      { provide: 'AUTH_TOKEN', useValue: req.cookies.authToken }
    ]
  });
});
```

**Hydration — the critical detail:**

Angular 16+ introduced **non-destructive hydration** — the server-rendered HTML is preserved and Angular attaches event listeners to existing DOM nodes instead of destroying and recreating them. This eliminates the flash of content that older SSR implementations suffered from:

```typescript
// app.config.ts
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    // withHttpTransferCacheInterceptor() — caches SSR API responses
    // so the client doesn't re-fetch them during hydration
  ]
};
```

**Transfer State** prevents duplicate API calls. During SSR, API responses are serialised into the HTML as a `<script>` tag. During hydration, the client reads from this cache instead of making the same API calls again:

```typescript
// Service that uses TransferState
@Injectable()
class DashboardService {
  constructor(
    private http: HttpClient,
    private transferState: TransferState
  ) {}

  getDashboardData(): Observable<DashboardData> {
    const key = makeStateKey<DashboardData>('dashboard');
    const cached = this.transferState.get(key, null);

    if (cached) {
      this.transferState.remove(key);
      return of(cached);
    }

    return this.http.get<DashboardData>('/api/dashboard').pipe(
      tap(data => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(key, data);
        }
      })
    );
  }
}
```

**CDN strategy:**

- Login page SSR output is cached at the CDN (CloudFront) — it's the same for all users.
- Dashboard SSR output is **not** CDN-cached (it's user-specific), but static assets (JS, CSS, fonts) are cached with long TTLs and content-hashed filenames.
- SSG pages (help docs, changelog) are pre-built at deploy time and served directly from the CDN.

---

## Q41. How do you ensure frontend solutions integrate effectively with a .NET/C# backend ecosystem?

### Key Talking Points
- **OpenAPI spec as the contract** — generate TypeScript types from the .NET API's Swagger/OpenAPI spec
- **SignalR** for real-time communication — .NET native, TypeScript client available
- **ASP.NET Core BFF** as the frontend-backend bridge when microservice APIs are too granular
- **Shared validation** — define validation rules in the API spec, generate frontend validators
- **CORS and auth** — configure .NET middleware for SPA consumption (CORS headers, cookie auth, CSRF tokens)
- **API versioning** — .NET supports URL-based (`/api/v1/`) and header-based versioning

### Detailed Answer

Working alongside a .NET backend requires establishing clear contracts and leveraging the .NET ecosystem's strengths.

**Contract-first development with OpenAPI:**

The .NET backend publishes an OpenAPI (Swagger) specification. The frontend generates TypeScript types from it, ensuring type safety across the boundary:

```bash
# Generate TypeScript types from .NET API's OpenAPI spec
npx openapi-typescript https://api.iris.co.uk/swagger/v1/swagger.json \
  -o src/types/api.generated.ts
```

This generates interfaces like `Employee`, `PayrollRun`, `TaxCalculation` directly from the backend's C# models. When the backend adds a required field, the generated types update, and any frontend code that doesn't handle the new field fails to compile.

**In the FeroUI architecture**, the backend was Java/REST APIs, and the frontend consumed them through a facade pattern with typed service interfaces. The same principle applies to .NET — the facade abstracts the API shape, and generated types ensure the contract is honoured.

**SignalR integration:**

The `@microsoft/signalr` npm package provides a TypeScript client that integrates naturally with Angular and React:

```typescript
// Angular service wrapping SignalR
@Injectable({ providedIn: 'root' })
class PayrollHubService {
  private connection: HubConnection;

  constructor(private auth: AuthService) {
    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/payroll', {
        accessTokenFactory: () => this.auth.getAccessToken()
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();
  }

  readonly payrollProgress$ = new Observable<PayrollProgress>(subscriber => {
    this.connection.on('PayrollRunProgress', (data) => subscriber.next(data));
  });

  async start(): Promise<void> {
    await this.connection.start();
  }
}
```

**CSRF protection with .NET:**

In the FeroUI auth architecture, CSRF was handled via a nonce pattern — the server injected a CSRF token into the page HTML, and a `CsrfInterceptor` attached it to every outgoing request. The same pattern works with ASP.NET Core's anti-forgery tokens:

```typescript
// HTTP interceptor attaches CSRF token from cookie
@Injectable()
class CsrfInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const csrfToken = this.cookieService.get('XSRF-TOKEN');
    if (csrfToken && !req.method.match(/^(GET|HEAD|OPTIONS)$/)) {
      req = req.clone({ headers: req.headers.set('X-XSRF-TOKEN', csrfToken) });
    }
    return next.handle(req);
  }
}
```

---

## Q42. How would you approach SSR/hydration specifically for Angular, and what are the key architectural decisions?

### Key Talking Points
- Angular 17+ **non-destructive hydration** preserves server-rendered DOM — no flash of content
- **Deferrable views** (`@defer`) for lazy-loading heavy components without SSR overhead
- **Transfer State** prevents duplicate API calls during hydration
- **Platform checks** (`isPlatformBrowser`/`isPlatformServer`) for code that can't run on the server (DOM access, localStorage)
- **Streaming SSR** sends the shell immediately, streams data-dependent content as it resolves
- Key decision: which routes get SSR vs CSR — not everything benefits from server rendering

### Detailed Answer

Angular's SSR story has matured significantly since Angular 16. The key architectural decisions determine whether SSR adds value or just adds complexity.

**Non-destructive hydration (Angular 16+):**

Traditional SSR destroyed the server-rendered DOM and rebuilt it from scratch during hydration — causing a visible flash. Angular's non-destructive hydration preserves the existing DOM and attaches event listeners to it:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withEventReplay(),           // Replays user events that happened before hydration
      withHttpTransferCacheInterceptor()  // Caches SSR API responses for client
    )
  ]
};
```

`withEventReplay()` is critical for enterprise apps — if a user clicks a button before hydration completes, the event is captured and replayed after hydration. Without this, early interactions are silently lost.

**Deferrable views for performance:**

Angular 17's `@defer` blocks allow lazy-loading heavy components without including them in the SSR output:

```html
<!-- Dashboard template -->
<iris-summary-cards [data]="summaryData" />  <!-- SSR'd — critical content -->

@defer (on viewport) {
  <iris-revenue-chart [data]="chartData" />  <!-- Lazy-loaded when scrolled into view -->
} @placeholder {
  <iris-skeleton-chart />  <!-- Shown during SSR and until chart loads -->
}

@defer (on interaction) {
  <iris-advanced-filters />  <!-- Loaded when user clicks "Filters" -->
} @placeholder {
  <button>Show Filters</button>
}
```

This keeps the SSR payload small (only critical above-fold content) while deferring heavy components (charts, complex forms) until they're needed.

**Platform-aware code:**

Code that accesses browser APIs (DOM, localStorage, window) must be guarded:

```typescript
import { isPlatformBrowser } from '@angular/common';

@Injectable()
class StorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  get(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key);
    }
    return null; // Server-side — no localStorage
  }
}
```

In the Fero architecture, `@fero/core/platform/cache` provided a caching service with local/session/memory storage backends. The memory backend worked on both server and client, while local/session backends were browser-only. The same abstraction pattern applies to SSR-compatible services.

---


# Category 11: Team Enablement & Technical Leadership (Questions 43-46)

---

## Q43. How would you upskill and support Senior Engineers and Engineering Leads in front-end best practices across multiple teams?

### Key Talking Points
- **Reference implementations** over slide decks — working code that teams can clone and learn from
- **Pairing sessions** with senior engineers on real feature work — not abstract workshops
- **Architecture guild** (bi-weekly) for cross-team alignment and knowledge sharing
- **ADRs (Architecture Decision Records)** committed to the repo — institutional knowledge that outlives individuals
- **Tech talks** (monthly) where teams present their solutions — peer learning scales better than top-down teaching
- **PR reviews** as teaching moments — not just "approve/reject" but "here's why and here's a better pattern"

### Detailed Answer

Upskilling across multiple teams requires a mix of **structured learning** and **embedded coaching**. The goal is to build self-sufficient teams, not create a dependency on the architect.

**Structured learning (scalable, asynchronous):**

1. **Reference implementations** — the single most effective enablement tool. Instead of a 50-page best practices document, create a working application that demonstrates every pattern: component structure, state management, API integration, testing, accessibility, i18n. Teams clone it for new projects and learn by reading real code.

```
iris-reference-app/
├── src/
│   ├── app/
│   │   ├── shell/              ← Auth, navigation, layout
│   │   ├── features/
│   │   │   ├── employee-list/  ← List view pattern (pagination, filtering, virtual scroll)
│   │   │   ├── employee-detail/← Detail view pattern (form, validation, save)
│   │   │   └── dashboard/      ← Dashboard pattern (widgets, lazy loading, skeleton)
│   │   ├── shared/
│   │   │   ├── ui/             ← Shared presentational components
│   │   │   ├── data-access/    ← API services, state management
│   │   │   └── utils/          ← Pure utility functions
│   │   └── core/               ← Auth, guards, interceptors
│   └── tests/                  ← Testing patterns for each layer
├── docs/
│   ├── architecture.md         ← Architecture overview
│   ├── patterns/               ← Pattern documentation with code examples
│   └── adrs/                   ← Architecture Decision Records
└── .storybook/                 ← Storybook with all component stories
```

2. **Architecture Decision Records (ADRs)** — every significant decision is documented with context, alternatives considered, and consequences. Future developers understand *why* the codebase looks the way it does.

3. **Monthly tech talks** — each team presents a technical challenge they solved. This creates peer learning at scale — 10 teams means 10 different perspectives on frontend problems.

**Embedded coaching (high-impact, synchronous):**

1. **Pairing sessions** — the architect pairs with senior engineers on real feature work, not contrived exercises. "Let's build this payroll dashboard together using the patterns from the reference app." This transfers knowledge through practice.

2. **Design reviews** — before a team starts building a significant feature, the architect reviews the proposed approach. This catches architectural issues early, before code is written. Keep it lightweight — 30 minutes, whiteboard or Miro, not a formal presentation.

3. **PR reviews as teaching** — when reviewing PRs, explain the *why* behind suggestions. Not "use OnPush here" but "OnPush here would reduce change detection cycles by ~80% because this component only needs to update when its inputs change. Here's how to refactor it..."

4. **Office hours** — a weekly 1-hour slot where any engineer can drop in with questions. Low-friction access to architectural guidance without scheduling meetings.

**Measuring enablement success:**
- Are teams following the reference implementation patterns without being told?
- Are teams contributing to the design system (not just consuming)?
- Are architectural violations decreasing in PR reviews over time?
- Can teams make sound architectural decisions independently?

---

## Q44. How would you lead the evaluation and recommendation process for a web and mobile UI technology stack, building team consensus?

### Key Talking Points
- **Weighted scorecard** across non-negotiables (enterprise maturity, hiring pool, .NET integration) and weighted criteria (performance, a11y, testing, mobile strategy)
- **Time-boxed spike** (2-3 weeks) with 2-3 candidates building the same feature — real code, not slide decks
- **Involve senior engineers from each team** in the evaluation — they need to own the decision
- Present a **recommendation with trade-offs**, not a decree
- Consider "different tools for different contexts" — Angular for main product, React Native for mobile, Web Components for shared shell
- **Migration path** matters as much as the destination — can we incrementally adopt, or is it big-bang?

### Detailed Answer

Technology selection for an enterprise product suite is a **high-stakes, low-reversibility decision**. The process must be rigorous, inclusive, and transparent.

**Phase 1: Define evaluation criteria (week 1)**

Assemble a cross-team evaluation committee (1 senior engineer per team + architect + engineering lead). Define criteria together:

**Non-negotiables (must-have):**
- Enterprise maturity — LTS support, security patches, corporate backing
- Ecosystem depth — component libraries, tooling, IDE support
- Hiring pool — can we actually find developers who know this?
- .NET backend integration — how well does it work with ASP.NET Core APIs, SignalR?

**Weighted criteria (scored 1-5):**

| Criterion | Weight | Angular | React | Blazor |
|---|---|---|---|---|
| Performance (bundle size, SSR, hydration) | 15% | 4 | 5 | 3 |
| Accessibility primitives | 10% | 5 | 4 | 3 |
| Testing story (unit, component, e2e) | 10% | 5 | 5 | 3 |
| Mobile strategy alignment | 10% | 3 | 5 | 4 |
| State management maturity | 10% | 5 | 5 | 3 |
| Design system ecosystem | 10% | 4 | 5 | 2 |
| Learning curve for existing team | 15% | 4 | 4 | 5 |
| Migration path from legacy | 10% | 4 | 4 | 3 |
| Long-term viability | 10% | 5 | 5 | 4 |

**Phase 2: Time-boxed spike (weeks 2-4)**

Each candidate framework builds the **same feature** — a representative slice of the product (e.g., an employee list with filtering, sorting, pagination, and a detail view with a form). This reveals real-world ergonomics that documentation can't show.

The spike deliverables:
- Working feature with tests
- Bundle size analysis
- Developer experience notes (tooling, debugging, error messages)
- Accessibility audit (axe-core)
- Integration with .NET API (REST + SignalR)

**Phase 3: Recommendation (week 5)**

Present findings to engineering leadership with:
- Scorecard results
- Spike learnings (what was easy, what was painful)
- Total cost of ownership (migration effort, training, hiring)
- Recommended approach with trade-offs clearly stated
- Dissenting opinions documented (not suppressed)

**The answer might be "different tools for different contexts":**
- Angular for the main product (opinionated, TypeScript-first, good for large teams with .NET backend)
- React for specific modules or acquisitions that already use it
- Web Components for shared shell elements that need to work across frameworks
- React Native or .NET MAUI for mobile (if PWA isn't sufficient)

---

## Q45. How would you lead hiring initiatives and technical assessment for front-end engineering skills?

### Key Talking Points
- **Structured interview process**: coding round → technical deep-dive → system design → behavioural/leadership
- **Coding round**: practical component building (Star Rating, search bar with debounce) — not algorithm puzzles
- **System design round**: architecture discussion (design a design system, architect a micro-frontend) — tests thinking, not memorisation
- **Take-home alternative**: small project (4-hour time-box) for candidates who perform better without live pressure
- **Rubric-based scoring** to reduce bias — every interviewer scores against the same criteria
- **Hire for growth potential**, not just current skill — a strong engineer who hasn't used Angular can learn it in weeks

### Detailed Answer

Hiring frontend architects and senior engineers requires assessing both **technical depth** and **leadership capability**. The process must be rigorous but respectful of candidates' time.

**Interview structure (4 rounds, 3-4 hours total):**

**Round 1: Coding (60 min) — practical component building**

Build a real component, not solve an algorithm puzzle. Examples:
- Star Rating component (accessibility, keyboard navigation, controlled component pattern)
- Search bar with debounce (async handling, API integration, loading states)
- Data table with sorting and pagination (state management, performance)

Evaluate: code quality, accessibility awareness, testing instinct, component API design.

**Round 2: Technical Deep-Dive (60 min) — framework and architecture knowledge**

Discussion-based, not whiteboard coding. Topics:
- Change detection strategies (Angular) or reconciliation (React) — when and why
- State management philosophy — what goes where and why
- Performance optimisation — how would you debug a slow dashboard?
- TypeScript at the architecture level — discriminated unions, generics, generated types

Evaluate: depth of understanding, ability to explain trade-offs, real-world experience.

**Round 3: System Design (60 min) — architecture and strategic thinking**

Open-ended design discussion:
- "Design a design system for a product suite with 10 teams"
- "Architect a micro-frontend migration for a legacy desktop app"
- "Design a real-time collaborative editing feature"

Evaluate: systems thinking, trade-off analysis, communication clarity, awareness of enterprise concerns (multi-tenancy, i18n, a11y).

**Round 4: Behavioural/Leadership (45 min) — for senior/lead roles**

- "Tell me about a time you influenced a technical decision across multiple teams"
- "How do you handle disagreement with a team that wants to use a different approach?"
- "Describe how you've mentored a junior engineer"

Evaluate: communication, influence without authority, mentorship capability, conflict resolution.

**Rubric-based scoring:**

Every interviewer scores against predefined criteria (1-5 scale):
- Technical depth (framework knowledge, JS fundamentals, TypeScript)
- Architecture thinking (system design, trade-off analysis, scalability)
- Code quality (readability, testing, accessibility)
- Communication (explains clearly, listens, asks good questions)
- Leadership potential (mentorship, influence, strategic thinking)

This reduces bias and ensures consistent evaluation across candidates.

---

## Q46. Describe your approach to facilitating alignment between product design intent and engineering implementation.

### Key Talking Points
- **Design system as the shared language** — when designers say "primary button, large" and engineers have `<Button variant="primary" size="lg">`, there's no ambiguity
- **Design tokens as the contract** — if the token exists, it's supported; if it doesn't, it needs to be added
- **Storybook as the handoff tool** — designers review in Storybook, not in static Figma specs
- **Design reviews with engineers present** — engineers flag technical constraints early
- **Engineering reviews with designers present** — designers verify the built component matches intent
- **Weekly design-engineering sync** (30 min) — lightweight, regular alignment

### Detailed Answer

The gap between design and engineering shows up as: designers hand off pixel-perfect mockups, engineers build something that looks close but behaves differently, designers are frustrated, engineers feel micromanaged. The fix is structural, not cultural.

**The design system IS the shared language:**

When designers and engineers both reference the same design system, ambiguity disappears. A designer says "primary button, large, with leading icon" and the engineer writes:

```tsx
<Button variant="primary" size="lg" icon={<DownloadIcon />}>
  Download Report
</Button>
```

There's no interpretation gap because the component's visual output is defined by the design system, not by the engineer's reading of a Figma mockup.

**Design tokens as the contract:**

Designers define tokens in Figma (using Figma Variables or Tokens Studio). Engineers consume them in code. The rule is simple: if the token exists in the design system, it's supported. If a designer uses a colour that isn't a token, it needs to be added through the contribution process — no one-off hex values in code.

In the Fero design system, the `@lego/design-tokens` package was the single source of truth — Figma variable exports were transformed through Style Dictionary into CSS custom properties. In the Flare design system, tokens were TypeScript objects accessed through typed helpers (`th.color('primary')`). Both approaches enforce the contract — the mechanism differs, the principle is the same.

**Storybook as the handoff and review tool:**

Instead of designers reviewing static screenshots, they review components in Storybook where they can:
- See real interactions (hover, focus, click)
- Test responsive behaviour (resize the viewport)
- Check accessibility (a11y addon panel)
- Verify all states (default, error, disabled, loading)

"Does this match the design?" becomes a Storybook review, not a screenshot comparison.

**Collaborative workflow:**

```
1. Designer creates mockup in Figma
       ↓
2. Design review WITH engineers present (30 min)
   Engineers flag: "this animation will be janky on low-end devices"
   Engineers flag: "this layout breaks with RTL text"
   Engineers flag: "this data isn't available in one API call"
       ↓
3. Engineer builds the component
       ↓
4. Engineering review WITH designer present (15 min in Storybook)
   Designer verifies: spacing, colours, interactions match intent
   Designer flags: "the hover state is missing", "the loading skeleton is too fast"
       ↓
5. Component merged into design system
       ↓
6. Both designer and engineer sign off
```

This two-way review process catches issues from both directions — technical constraints that designers miss, and design nuances that engineers miss.

---


# Category 12: First 12 Months & Strategic Outcomes (Questions 47-50)

---

## Q47. Walk through your plan for the first 12 months as Frontend Architect — how would you deliver the key outcomes listed in the JD?

### Key Talking Points
- **Months 1-3**: Listen, audit, build relationships — understand the current landscape before proposing changes
- **Months 3-6**: Technology recommendation + design system foundation — the two highest-impact deliverables
- **Months 6-9**: Reference implementation + testing strategy rollout — enable teams to follow the new standards
- **Months 9-12**: Measure, iterate, scale — prove the value through metrics and expand adoption
- **Throughout**: Team enablement via pairing, reviews, workshops — the architect's impact is multiplied through others

### Detailed Answer

The first 12 months follow a **listen → propose → enable → measure** cadence. Rushing to solutions without understanding the current state is the most common architect failure mode.

**Months 1-3: Discovery & Relationship Building**

| Week | Activity | Deliverable |
|---|---|---|
| 1-2 | Meet every team lead and senior engineer. Understand their stack, pain points, delivery cadence. | Stakeholder map + pain point inventory |
| 3-4 | Audit the existing frontend landscape. How many frameworks? How much duplication? Where are the inconsistencies? | Current state assessment document |
| 5-8 | Identify the "golden path" — what most teams are already doing well. Map the gap between current state and desired state. | Gap analysis + opportunity map |
| 9-12 | Write an RFC with proposed frontend strategy. Circulate it. Let teams poke holes. Incorporate feedback. | Frontend Strategy RFC (2 pages, not 20) |

**Key principle:** The strategy document should be 2 pages, not 20. If it's too long, nobody reads it. Focus on: technology direction, design system vision, testing standards, and team enablement approach.

**Months 3-6: Technology Recommendation + Design System Foundation**

**Outcome 1 — Technology & Framework Recommendation:**
- Run the evaluation process (scorecard + time-boxed spike with 2-3 candidates).
- Involve senior engineers from each team — they need to own the decision.
- Present recommendation with trade-offs to engineering leadership.
- Secure approval and communicate the decision with an ADR.

**Outcome 2 — Design System Foundation:**
- Establish the token layer (design tokens from Figma → CSS custom properties).
- Build 10-15 core components (button, input, modal, alert, card, table, form controls).
- Set up Storybook as the living catalogue.
- Define the contribution model (inner-source with review checklist).
- Get at least 2 delivery teams actively using the design system.

**Months 6-9: Reference Implementation + Testing Strategy**

**Outcome 3 — Frontend Reference Implementation:**
- Build a reference app that demonstrates every pattern: component structure, state management, API integration, testing, a11y, i18n.
- Teams clone it for new projects — it's the "golden path" in working code.
- Document patterns in ADRs committed alongside the code.

**Outcome 4 — Testing Strategy Rollout:**
- Define the testing pyramid: unit (70%) → component (25%) → E2E (5%).
- Standardise tooling: Jest/Vitest for unit, Testing Library for component, Playwright for E2E.
- Set up visual regression (Chromatic/Percy) for the design system.
- Establish coverage thresholds and bundle size budgets in CI.
- Roll out to 2 teams first, iterate based on feedback, then expand.

**Months 9-12: Measure, Iterate, Scale**

**Outcome 5 — Team Enablement:**
- Monthly tech talks where teams present their solutions.
- Pairing sessions with senior engineers on real feature work.
- Architecture guild meetings (bi-weekly) for cross-team alignment.
- Measure: Are teams following patterns independently? Are they contributing to the design system? Are architectural violations decreasing?

**Metrics to track:**
- Design system adoption: % of new features using design system components
- Bundle size trend: are bundles getting smaller or larger?
- Test coverage trend: is coverage increasing?
- Lighthouse scores: LCP, CLS, INP trends across products
- a11y violations: are axe-core violations decreasing?
- Developer satisfaction: quarterly survey on tooling and standards

---

## Q48. How would you handle a situation where different teams want to use different frontend frameworks (e.g., one team wants React, another wants Angular)?

### Key Talking Points
- **Don't mandate — facilitate a decision** with data, not authority
- Run the evaluation process (scorecard + spike) with representatives from both teams
- Consider whether "both" is actually viable — Web Components as the bridge layer
- The cost of "both" is real: duplicate tooling, duplicate training, duplicate hiring pipelines
- If "both" is the answer, establish clear boundaries: which framework for which context, shared design tokens as the unifying layer
- **The worst outcome is a silent split** where teams go rogue without a conscious decision

### Detailed Answer

Framework disagreements are common in large organisations, and the architect's role is to **facilitate a decision, not impose one**.

**Step 1: Understand the motivations**

Meet with both teams separately. Understand *why* they prefer their framework:
- Is it familiarity? (They know React, they don't know Angular)
- Is it technical? (React's ecosystem is better for their specific use case)
- Is it cultural? (They've always used React and don't want to change)

Often, the preference is familiarity-based, not technically justified. That's valid — developer productivity matters — but it needs to be weighed against the cost of maintaining two ecosystems.

**Step 2: Quantify the cost of "both"**

| Cost | Single Framework | Two Frameworks |
|---|---|---|
| Design system | One component library | Two libraries OR Web Components bridge |
| Tooling | One ESLint config, one test setup | Two of everything |
| Hiring | One job description | Two hiring pipelines |
| Training | One onboarding path | Two onboarding paths |
| Knowledge sharing | Easy — everyone speaks the same language | Harder — React patterns don't transfer to Angular |
| Shared libraries | Direct imports | Must be framework-agnostic (Web Components or vanilla JS) |

**Step 3: Evaluate whether "both" is justified**

Sometimes it is:
- An acquisition brought a React codebase that's too large to rewrite
- A specific product area (mobile, data visualisation) genuinely benefits from a different framework
- The organisation is large enough to sustain two ecosystems (50+ frontend engineers)

In the Fero/FeroUI ecosystem, the team chose a **multi-framework strategy** deliberately: Angular components (`@fero/ui`) for the main product, Lit Web Components (`@lego/elements-galaxy`) for framework-agnostic shell elements. Design tokens (`@lego/design-tokens`) were the unifying layer — both Angular and Lit components consumed the same CSS custom properties. This worked because the boundary was clear: Angular for product features, Web Components for cross-framework shell elements.

**Step 4: If "both" is the answer, establish clear boundaries**

- Define which framework is used for which context (documented in an ADR)
- Design tokens as the shared visual language (CSS custom properties consumed by both)
- Web Components for any UI that must work in both frameworks
- Shared TypeScript libraries for non-UI code (API clients, utilities, types)
- Separate but consistent CI pipelines for each framework

**Step 5: If "one" is the answer, manage the transition**

- Acknowledge the losing team's preference — they need to feel heard
- Provide training and pairing to help them ramp up on the chosen framework
- Set a migration timeline for existing code (Strangler Fig pattern, not big-bang rewrite)
- Celebrate early wins to build momentum

---

## Q49. How would you define and measure success for the frontend architecture across the product suite?

### Key Talking Points
- **Quantitative metrics**: bundle size, Lighthouse scores (LCP, CLS, INP), test coverage, a11y violations, build times
- **Adoption metrics**: % of teams using design system, % of new features following reference patterns
- **Quality metrics**: production bug rate (frontend-specific), customer-reported UI issues
- **Developer experience metrics**: build time, CI pipeline duration, developer satisfaction survey
- **Business metrics**: time-to-market for new features, onboarding time for new engineers

### Detailed Answer

Success metrics must cover **technical quality**, **team adoption**, **developer experience**, and **business impact**. Tracking only technical metrics misses the point — the architecture exists to enable teams to deliver value faster.

**Technical quality dashboard:**

| Metric | Target | Measurement |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s (p75) | `web-vitals` library → analytics |
| CLS (Cumulative Layout Shift) | < 0.1 (p75) | `web-vitals` library → analytics |
| INP (Interaction to Next Paint) | < 200ms (p75) | `web-vitals` library → analytics |
| Initial bundle size | < 200KB gzipped | CI budget check |
| Lighthouse a11y score | > 95 | Lighthouse CI per release |
| axe-core violations | 0 critical, 0 serious | CI gate |
| Test coverage (business logic) | > 80% | CI coverage report |

**Adoption metrics:**

| Metric | Target (12 months) | Measurement |
|---|---|---|
| Teams using design system | 100% of active teams | Package download stats from Artifactory |
| New features following reference patterns | > 80% | Architecture review sampling |
| Design system contributions from feature teams | > 5 per quarter | PR count to design system repo |
| ADRs written for significant decisions | 100% | Repo audit |

**Developer experience metrics:**

| Metric | Target | Measurement |
|---|---|---|
| CI pipeline duration | < 10 min for affected builds | CI analytics |
| Local build time | < 30s for incremental | Developer survey |
| New engineer onboarding time | < 2 weeks to first PR | Onboarding tracking |
| Developer satisfaction | > 4/5 | Quarterly survey |

**Business impact metrics:**

| Metric | Target | Measurement |
|---|---|---|
| Time-to-market for new features | 20% reduction | Sprint velocity tracking |
| Frontend production bugs | 30% reduction | Jira bug tracking |
| Customer-reported UI issues | 25% reduction | Support ticket analysis |

---

## Q50. What questions would you ask the hiring team to evaluate whether this role is the right fit?

### Key Talking Points
- **Current state**: What's the existing frontend landscape? How many frameworks, how much tech debt?
- **Authority**: Does the architect have decision-making authority, or is it purely advisory?
- **Team structure**: How many frontend engineers? How are teams organised? Is there a platform team?
- **Design maturity**: Is there a design team? How do they work with engineering today?
- **Budget**: Is there budget for tooling (Chromatic, BrowserStack, Storybook Enterprise)?
- **Migration appetite**: Is leadership committed to a multi-year migration, or expecting quick wins?
- **Success criteria**: How will my success be measured in 6 and 12 months?

### Detailed Answer

These questions help you assess whether the organisation is ready for a Frontend Architect and whether you'll have the support to succeed.

**Understanding the current state:**
1. "What frontend frameworks are currently in use across the product suite? How many are there?"
2. "What's the current state of the design system? Is there one, or are teams building UI independently?"
3. "What's the biggest frontend pain point that teams face today?"
4. "How much technical debt exists in the frontend codebase? Is there appetite to address it?"

**Understanding the role's authority:**
5. "Does this role have decision-making authority on technology choices, or is it advisory?"
6. "Who are the key stakeholders I'd need to align with for architectural decisions?"
7. "How are architectural decisions made today? Is there an RFC process?"

**Understanding the team:**
8. "How many frontend engineers are there across all teams? What's the seniority distribution?"
9. "Is there an existing platform/infrastructure team, or would I be building one?"
10. "How do teams currently share code and patterns? Is there a monorepo or polyrepo setup?"

**Understanding design collaboration:**
11. "Is there an internal design team, or is design outsourced?"
12. "How do designers and engineers collaborate today? Is there a handoff process?"
13. "Are there existing design tokens or a Figma component library?"

**Understanding expectations:**
14. "What does success look like at 6 months and 12 months?"
15. "Is the expectation to build consensus and influence, or to make top-down decisions?"
16. "What's the budget for frontend tooling and infrastructure?"
17. "Is leadership committed to a multi-year frontend modernisation effort, or expecting quick wins?"

These questions also demonstrate to the hiring team that you think strategically about organisational context, not just technology.

---

*Prepared for IRIS Software Group UK — Frontend Architect Role*
*Covers: Architecture, React/Angular, JavaScript, Performance, Testing, System Design, Mobile Strategy, Design System Leadership, Accessibility, API Design, SSR/Hydration, .NET Integration, Team Enablement, and Strategic Planning*
*References: Fero Design System (Angular, 80+ components, Nx monorepo), Flare Design System (React, 15 packages, Lerna+Nx), FeroUI (Enterprise Angular SPA, fork-based monorepo)*
