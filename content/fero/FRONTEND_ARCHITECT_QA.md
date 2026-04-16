# Frontend Architect — Platform-Level Interview Q&A

These are 20 architect-level questions focused on platform concerns, design systems, and technical leadership for an enterprise HR/payroll SaaS product with a .NET backend.

---

## Q1: You're joining a product suite with multiple teams building UIs independently. How would you establish a unified front-end technical vision without slowing teams down?

**Answer:**

The key tension is consistency vs. autonomy. I'd approach it in phases:

**Phase 1 — Listen and audit (weeks 1–4):**
- Meet each team, understand their current stack, pain points, and delivery cadence.
- Audit the existing front-end landscape: how many frameworks, how much duplication, where are the inconsistencies.
- Identify the "golden path" — what most teams are already doing well.

**Phase 2 — Propose guardrails, not mandates (weeks 4–8):**
- Write an RFC (Request for Comments) with a proposed front-end strategy. Circulate it. Let teams poke holes.
- Define "must haves" (accessibility, i18n, design tokens) vs. "team choice" (state management library, CSS approach).
- The vision document should be 2 pages, not 20. If it's too long, nobody reads it.

**Phase 3 — Enable through tooling (ongoing):**
- Build a reference implementation that teams can clone — not a slide deck, working code.
- Create shared Nx generators or CLI scaffolding so new projects start with the right structure.
- Establish an inner-source contribution model for the design system.

The principle: **make the right thing the easy thing**. If following the standard is harder than going rogue, teams will go rogue.

---

## Q2: How do you evaluate and recommend a front-end framework for an enterprise product suite? What's your decision framework?

**Answer:**

I use a weighted scorecard across these dimensions:

**Non-negotiables:**
- Enterprise maturity — LTS support, security patches, corporate backing.
- Ecosystem depth — component libraries, tooling, IDE support.
- Hiring pool — can we actually find developers who know this?
- Backend integration — how well does it play with our .NET/C# APIs?

**Weighted criteria:**
- Performance characteristics (bundle size, SSR support, hydration strategy).
- Accessibility primitives (does the framework help or hinder WCAG compliance?).
- Testing story (unit, component, e2e — how mature is the tooling?).
- Mobile strategy alignment (does it have a companion mobile framework?).
- Migration path (can we incrementally adopt it, or is it a big bang?).

**For an HR/payroll .NET shop specifically:**
- Blazor deserves serious evaluation — it keeps the team in C#, but the component ecosystem is thinner.
- Angular is strong for enterprise (opinionated, TypeScript-first, good for large teams).
- React has the largest ecosystem but needs more architectural decisions upfront.
- The answer might be "different tools for different contexts" — Angular for the main product, React Native for mobile, web components for shared shell elements.

**Process matters as much as the choice:**
- Run a time-boxed spike (2–3 weeks) with 2–3 candidates building the same feature.
- Involve senior engineers from each team in the evaluation — they need to own the decision.
- Present a recommendation with trade-offs, not a decree.

---

## Q3: How would you design a design system that scales across multiple delivery teams? What's the contribution model?

**Answer:**

**Architecture — layered, not monolithic:**

```
Layer 1: Design Tokens (colors, spacing, typography, shadows)
    ↓ consumed by
Layer 2: Core Components (button, input, modal, alert — owned by platform team)
    ↓ extended by
Layer 3: Composite Patterns (data table with filters, form wizard — co-owned)
    ↓ composed into
Layer 4: Feature Components (payroll calculator, leave request form — team-owned)
```

Layers 1–2 are centrally governed. Layer 3 is collaborative. Layer 4 is team-autonomous.

**Contribution model — "open source internally":**

1. Feature team needs a new component or variant.
2. They open a proposal (lightweight RFC — problem, proposed API, design mockup).
3. Platform team reviews for consistency, accessibility, and API design.
4. Feature team builds it (with platform team pairing if needed).
5. PR goes through design system review checklist: a11y, i18n, theming, tests, Storybook story, docs.
6. Merged into the shared library, published as a new version.

**What makes this work:**
- A clear "definition of done" for components (tests, stories, docs, a11y audit).
- Semantic versioning with changelogs so teams know what changed.
- A Storybook instance as the living catalogue — if it's not in Storybook, it doesn't exist.
- Office hours or a Slack channel where teams can get quick feedback before investing time.

**What kills it:**
- Making the contribution process so heavy that teams just copy-paste instead.
- Platform team becoming a bottleneck by insisting on doing everything themselves.

---

## Q4: How do you approach multi-tenancy and white-labelling in a front-end architecture?

**Answer:**

Multi-tenancy in the UI has three levels of complexity:

**Level 1 — Theming (visual customisation):**
- Design tokens as CSS custom properties on `:root`.
- Tenant config provides token overrides (brand colors, logo, fonts).
- At runtime, inject tenant-specific CSS variables. Every component picks them up automatically.
- Store tenant theme in a config API, load it at app bootstrap.

**Level 2 — Feature toggling (functional customisation):**
- Not every tenant gets every feature. Use a feature flag system.
- Structural directives in templates: `*featureToggle="'ADVANCED_PAYROLL'"`.
- Route guards to prevent navigation to disabled features.
- Flags come from the backend based on tenant license/subscription.

**Level 3 — Configuration-driven UI (structural customisation):**
- Enterprise customers want custom fields, custom workflows, custom form layouts.
- This requires a schema-driven rendering approach — JSON schema defines the form, a dynamic form engine renders it.
- Libraries like Formly (Angular) or React JSON Schema Form handle this.
- The schema lives in the backend, per-tenant. The front-end is a generic renderer.

**Architecture decisions:**
- Theme loading must happen before first paint — otherwise you get a flash of default theme. Use a lightweight bootstrap script or SSR.
- Tenant identification: subdomain (`acme.app.com`), path (`app.com/acme`), or login-based. Subdomain is cleanest.
- Cache tenant config aggressively (localStorage + service worker) but invalidate on config changes.
- Never hard-code tenant-specific logic in components. If you find yourself writing `if (tenant === 'acme')`, the architecture is wrong.

---

## Q5: How would you design the front-end testing strategy for an enterprise platform? What does the testing pyramid look like?

**Answer:**

**The pyramid, adapted for a component-driven architecture:**

```
                    /\
                   /  \     E2E (Cypress/Playwright)
                  /    \    — Critical user journeys only
                 /------\   — 20-30 tests max
                /        \
               / Visual   \  Visual Regression (Chromatic/Percy/Pixelmatch)
              / Regression \  — Every component, every theme
             /--------------\
            /   Component    \  Component Tests (Storybook Interaction Tests)
           /    Tests         \  — Isolated, fast, cover variants & states
          /--------------------\
         /    Unit Tests        \  Unit Tests (Jest/Jasmine)
        /                        \  — Services, utilities, pure logic
       /__________________________\
```

**Layer by layer:**

1. **Unit tests** — Services, pipes, utilities, state management logic. Fast, no DOM. Jest or Jasmine.

2. **Component tests** — Render a component in isolation, assert DOM output, simulate interactions. Storybook interaction tests or Testing Library. This is where most coverage should live.

3. **Visual regression** — Screenshot every component in every state (default, hover, disabled, error, RTL, each theme). Catch unintended visual changes. Tools: Chromatic, Percy, or Pixelmatch.

4. **Accessibility tests** — axe-core integrated into component tests AND visual regression. Every component gets an automated a11y scan. Fail the build on violations.

5. **E2E tests** — Only for critical user journeys (login → create payroll → submit → approve). Expensive to maintain, so keep the count low. Cypress or Playwright.

**What I'd standardise:**
- One test runner per layer (not Jest in some projects, Jasmine in others).
- Coverage thresholds enforced in CI (e.g., 80% statements, 70% branches).
- Visual regression runs on every PR, not just nightly.
- a11y checks are not optional — they're part of the component "definition of done".

---

## Q6: How do you ensure accessibility (WCAG compliance) is embedded in the development process, not bolted on?

**Answer:**

Accessibility fails when it's treated as a checklist at the end. It needs to be in three places:

**1. Design phase:**
- Designers use a11y-aware Figma plugins (Stark, Contrast Checker).
- Design reviews include: color contrast ratios, focus order, touch target sizes, text alternatives.
- Design system components are accessible by default — teams shouldn't have to think about ARIA roles for a dropdown.

**2. Development phase:**
- Component library handles the hard a11y work: focus trapping in modals, keyboard navigation in menus, ARIA live regions for dynamic content.
- ESLint rules catch common mistakes: `jsx-a11y` plugin (React) or custom rules like Torque's `button-has-type`.
- Storybook a11y addon gives instant feedback during development.
- PR review checklist includes: keyboard navigable? Screen reader tested? Focus visible?

**3. CI/CD phase:**
- axe-core runs on every component in CI. Violations = build failure.
- Lighthouse a11y score tracked per release.
- Periodic manual audits with screen readers (NVDA, VoiceOver) — automation catches ~30-40% of issues, humans catch the rest.

**What I'd establish as standards:**
- WCAG 2.1 AA as the minimum bar.
- Every new component must pass axe-core with zero violations before merge.
- Quarterly manual a11y audit of critical user journeys.
- An a11y champion in each team (not an expert, just someone who cares and keeps the team honest).

**The hard truth:** You can't fully automate WCAG compliance. Automated tools catch contrast, missing alt text, missing labels. They can't catch "is this flow actually usable with a screen reader?" That requires human testing.

---

## Q7: How would you architect a micro-frontend strategy for a large enterprise product?

**Answer:**

First question: **do you actually need micro-frontends?** They solve organisational problems (independent team deployment), not technical ones. If you have 2-3 teams, a well-structured monorepo is simpler.

**When micro-frontends make sense:**
- 5+ teams building different product areas.
- Teams need to deploy independently on different cadences.
- You're migrating from a legacy app and need to run old and new side by side.

**Architecture options (ranked by complexity):**

1. **Route-based composition** — simplest. Each team owns a set of routes. A shell app handles navigation and auth. Module Federation or import maps for loading.

2. **Component-based composition** — more complex. Teams expose components that are composed into shared pages. Needs a clear contract for inputs/outputs.

3. **iframe-based** — last resort. Full isolation but terrible UX (no shared state, no deep linking, accessibility nightmares).

**What I'd recommend for an HR/payroll suite:**

Route-based with Module Federation:
- Shell app: handles auth, navigation, theming, i18n setup.
- Remote apps: Payroll, Leave Management, Performance, Learning — each owned by a team.
- Shared dependencies (Angular, RxJS, design system) loaded once via singleton configuration.
- Design tokens and CSS variables cascade from shell to remotes — theming is automatic.

**Critical decisions:**
- Shared state: keep it minimal. Auth token and user context in the shell. Everything else is per-remote.
- Routing: shell owns top-level routes, remotes own sub-routes.
- Versioning: shared libraries must be version-locked. A design system version mismatch between shell and remote = visual inconsistency.
- Error boundaries: a remote crashing shouldn't take down the shell.

---

## Q8: How do you approach API design from a front-end architect's perspective? When would you advocate for a BFF layer?

**Answer:**

**The front-end's API wishlist:**
- One request per view (not 5 REST calls to assemble a page).
- Only the fields I need (not a 200-field entity when I need 3).
- Consistent error format across all endpoints.
- Real-time updates where the UX demands it (notifications, live dashboards).
- Pagination that works for infinite scroll AND traditional paging.

**When REST is fine:**
- CRUD operations on well-defined entities.
- Simple data fetching where one endpoint = one view.
- Teams are comfortable with REST and the backend is already REST-based.

**When to push for GraphQL:**
- Multiple front-end clients (web, mobile, third-party) need different shapes of the same data.
- Pages aggregate data from multiple backend services.
- Over-fetching is a real performance problem (e.g., a payroll summary page pulling full employee records).

**When to advocate for a BFF (Backend-for-Frontend):**
- The backend APIs are designed for backend consumers (microservice-to-microservice) and are painful for the front-end.
- You need to aggregate multiple microservice calls into one front-end-friendly response.
- You want to handle auth token exchange, response shaping, and caching closer to the front-end.
- In a .NET shop, an ASP.NET Core BFF is natural — the backend team can own it, but the front-end team defines the contract.

**For an HR/payroll platform specifically:**
- Payroll calculation pages often need data from employee, tax, benefits, and time-tracking services. A BFF that aggregates these is a huge DX win.
- Real-time: SignalR for notifications (payroll run complete, leave request approved). The .NET ecosystem has first-class SignalR support.
- Consider CQRS on the API side — read models optimised for front-end views, write models for business logic.

---

## Q9: How do you handle internationalisation (i18n) and localisation (l10n) at an architectural level?

**Answer:**

**Architecture decisions upfront:**

1. **String externalisation** — zero hard-coded strings in components. Every user-visible string comes from a translation file. Enforce this with a lint rule.

2. **Translation file format** — JSON or ICU MessageFormat. ICU handles plurals, gender, and complex grammar that simple key-value doesn't:
   ```
   "{count, plural, =0 {No leave requests} one {1 leave request} other {{count} leave requests}}"
   ```

3. **Loading strategy** — don't load all translations upfront. Lazy-load per route/feature. A payroll module loads payroll translations, not learning translations.

4. **RTL support** — CSS logical properties (`margin-inline-start` instead of `margin-left`). PostCSS RTL plugin as a fallback for legacy CSS. Test with actual RTL content, not just flipped English.

5. **Date, number, currency formatting** — use `Intl` API, not custom formatters. `Intl.DateTimeFormat`, `Intl.NumberFormat`. Payroll is especially sensitive — currency formatting varies wildly (1,234.56 vs 1.234,56 vs 1 234,56).

6. **Locale detection** — user preference (stored in profile) > browser locale > default. Let users override.

**Common mistakes to avoid:**
- Concatenating translated strings: `"Hello " + name + ", welcome"` breaks in languages where word order differs.
- Assuming text length: German is ~30% longer than English. UI must handle text expansion.
- Forgetting about locale-specific sorting and search (e.g., Turkish dotless i).
- Hard-coding date formats: "MM/DD/YYYY" is US-only. Use locale-aware formatting.

**For HR/payroll:**
- Payslips, tax forms, and compliance documents often have legal requirements for specific languages.
- Multi-language support within a single tenant (e.g., a global company with employees in 20 countries).
- Currency and tax calculations are locale-sensitive — this is a backend concern, but the front-end must display them correctly.

---

## Q10: How do you approach performance optimisation for a large enterprise SPA?

**Answer:**

**Measure first, optimise second.** Set up Core Web Vitals monitoring (LCP, FID/INP, CLS) before changing anything.

**The big wins (in order of impact):**

1. **Code splitting and lazy loading** — don't load the payroll module when the user is on the dashboard. Route-based splitting is the minimum. Component-level lazy loading for heavy widgets (charts, rich text editors).

2. **Bundle analysis** — run `webpack-bundle-analyzer` or `source-map-explorer`. You'll find surprises: a date library that's 200KB, lodash imported in full instead of per-function, duplicate dependencies.

3. **Change detection strategy** — in Angular, `OnPush` everywhere. In React, `React.memo` and proper key usage. This is the single biggest runtime performance lever in component-heavy apps.

4. **Virtual scrolling** — any list over 100 items should be virtualised. Datagrids, employee lists, transaction logs. Don't render 10,000 DOM nodes.

5. **Image optimisation** — lazy load below-fold images, use modern formats (WebP/AVIF), serve responsive sizes. For an enterprise app, this is often profile photos and document thumbnails.

6. **Caching strategy** — HTTP cache headers for static assets (immutable hashes). Service worker for offline capability and API response caching. IndexedDB for large datasets (employee directory).

7. **SSR/SSG consideration** — for an enterprise SPA behind a login, SSR is less critical than for a public site. But it can help with initial load time. Consider SSR for the login page and dashboard, CSR for everything else.

**Performance budgets:**
- LCP < 2.5s on 4G connection.
- Total JS bundle < 300KB gzipped for initial load.
- Time to Interactive < 3.5s.
- Track these in CI — fail the build if a PR increases bundle size by more than 5%.

---

## Q11: How do you bridge the gap between UX designers and engineering teams?

**Answer:**

This is one of the most underrated parts of the architect role. The gap usually shows up as: designers hand off pixel-perfect mockups, engineers build something that looks close but behaves differently, designers are frustrated, engineers feel micromanaged.

**Structural fixes:**

1. **Shared language through the design system** — when designers say "primary button, large" and engineers have a `<button trqButton="PRIMARY" trqButtonSize="LARGE">`, there's no ambiguity. The design system IS the shared language.

2. **Design tokens as the contract** — designers define tokens in Figma, engineers consume them in code. If the token exists, it's supported. If it doesn't, it needs to be added through the contribution process. No one-off hex values.

3. **Storybook as the handoff tool** — instead of static Figma specs, designers review components in Storybook where they can see real interactions, responsive behaviour, and accessibility. "Does this match the design?" becomes a Storybook review, not a screenshot comparison.

4. **Design reviews with engineers present** — engineers should see designs before they're "final". They can flag technical constraints early ("this animation will be janky on low-end devices", "this layout breaks with RTL text").

5. **Engineering reviews with designers present** — designers should see the built component before it ships. Quick 15-minute review in Storybook or a staging environment.

**Process:**
- Weekly design-engineering sync (30 min, not more).
- Shared Figma-to-code pipeline: Figma tokens plugin → Style Dictionary → CSS variables.
- Component API design happens collaboratively — the prop interface IS the design spec.

---

## Q12: How would you handle state management in a large enterprise application? What's your philosophy?

**Answer:**

**My philosophy: use the least powerful tool that solves the problem.**

Most enterprise apps are over-engineered on state management. Not everything needs to be in a global store.

**State categories and where they belong:**

| State Type | Example | Where It Lives |
|---|---|---|
| Server state | Employee list, payroll data | React Query / TanStack Query / HTTP service + caching |
| UI state | Modal open/closed, tab selection | Component-local state |
| Form state | Input values, validation | Form library (Reactive Forms, React Hook Form) |
| App-wide state | Current user, theme, locale | Global store (NgRx, Redux, Zustand) or Context |
| URL state | Filters, pagination, search | Router query params |

**Rules I'd establish:**
1. Server state is NOT application state. Use a data-fetching library that handles caching, invalidation, and loading states. Don't put API responses in Redux/NgRx.
2. If state is only used by one component, it's local state. Don't globalise it.
3. URL is state too. Filters, sort order, pagination — put them in query params so users can share links and use the back button.
4. Global store is for truly cross-cutting state: auth, user preferences, feature flags, navigation. That's it.

**For an HR/payroll platform:**
- Payroll calculation state is complex but transient — it lives in the payroll module, not globally.
- Employee context (who am I viewing?) might need to be global if multiple modules reference it.
- Notification state (unread count, toast messages) is global.
- Form state for multi-step wizards (onboarding, leave requests) should use a form library with step persistence, not a global store.

---

## Q13: How do you approach cross-browser and cross-device testing for an enterprise product?

**Answer:**

**Define the support matrix first:**

For an enterprise HR/payroll product:
- Browsers: Chrome (latest 2), Edge (latest 2), Firefox (latest 2), Safari (latest 2). IE11 is dead — push back if anyone asks.
- Devices: Desktop (primary), tablet (secondary), mobile (tertiary — unless there's a mobile app).
- OS: Windows (most enterprise users), macOS, iOS, Android.

**Testing strategy by layer:**

1. **Automated (CI):** Run component tests and e2e tests in Chrome headless. This catches 90% of issues.

2. **Cross-browser (CI):** Run a subset of critical e2e tests across browsers using BrowserStack/Sauce Labs. Not every test — just the critical journeys.

3. **Visual regression:** Screenshot tests catch CSS rendering differences across browsers. Run against Chrome and Safari at minimum — they have the most rendering differences.

4. **Manual (periodic):** Quarterly manual testing on real devices. Focus on touch interactions, responsive layouts, and form inputs (date pickers behave very differently on mobile Safari).

**Common enterprise gotchas:**
- Corporate proxies and firewalls can break WebSocket connections (SignalR). Always have an HTTP fallback.
- Locked-down browsers with disabled JavaScript features (some government clients).
- High-DPI displays vs. standard displays — test both.
- Slow corporate networks — test on throttled connections.

**What I'd automate:**
- Lighthouse CI for performance and a11y scores per browser.
- Percy/Chromatic for visual diffs across browsers.
- BrowserStack Automate for critical path e2e tests.

---

## Q14: How do you handle shared cross-cutting concerns (auth, error handling, loading states, notifications) in a front-end platform?

**Answer:**

These are the things every feature team needs but nobody wants to build. The platform team owns them.

**Authentication & Authorization:**
- Auth is handled once in the shell/framework layer. Feature teams never touch tokens.
- HTTP interceptor attaches auth headers to every request.
- Token refresh is transparent — the interceptor queues requests during refresh.
- Route guards check permissions before navigation.
- A structural directive (`*hasPermission="'PAYROLL_ADMIN'"`) hides UI elements the user can't access.
- Important: hide the UI, but ALWAYS enforce on the backend too. Front-end auth is UX, not security.

**Error Handling:**
- Global error handler catches unhandled exceptions, logs them, shows a user-friendly message.
- HTTP interceptor catches API errors, maps status codes to user messages (401 → redirect to login, 403 → "you don't have access", 500 → "something went wrong").
- Component-level error boundaries prevent one broken widget from crashing the whole page.
- Structured error logging to a service (Sentry, Application Insights) with context: user ID, tenant, route, action.

**Loading States:**
- A shared loading service tracks in-flight HTTP requests.
- Components use a consistent loading pattern: skeleton screens for initial load, inline spinners for actions.
- Avoid full-page loading masks — they block the entire UI. Use localised loading indicators.

**Notifications:**
- Toast service for transient messages (success, info).
- Notification centre for persistent messages (payroll run complete, leave approved).
- Real-time via WebSocket/SignalR for push notifications.
- Notification preferences per user (email, in-app, both, none).

**The pattern:** each of these is a platform service with a clean API. Feature teams consume them, never re-implement them.

---

## Q15: How would you approach mobile strategy for an enterprise HR/payroll product?

**Answer:**

**First, clarify what "mobile" means for this product:**

- Employee self-service (view payslip, request leave, check schedule) → high mobile usage.
- HR admin tasks (run payroll, configure benefits, manage org structure) → primarily desktop.
- Manager approvals (approve leave, review performance) → both.

**Options, ranked by my recommendation for this context:**

1. **Progressive Web App (PWA)** — my first recommendation.
   - Same codebase as web. Responsive design handles the layout.
   - Installable on home screen, works offline (service worker caches critical data).
   - Push notifications via Web Push API.
   - No app store approval process.
   - Limitation: no access to some native APIs (biometrics on older devices, background processing).

2. **Cross-platform framework (React Native / Flutter / .NET MAUI)** — if native features are required.
   - React Native: largest ecosystem, good if the web team knows React.
   - Flutter: great performance, but Dart is a new language for the team.
   - .NET MAUI: natural fit for a .NET shop, but the ecosystem is smaller.
   - Shared business logic with the web app via a shared TypeScript/C# layer.

3. **Native (Swift/Kotlin)** — only if there's a strong business case.
   - Best performance and native feel.
   - But: separate codebase, separate team, separate release cycle. Expensive.

**For HR/payroll specifically:**
- PWA covers 80% of the mobile use cases (view payslip, request leave, check schedule).
- If the business insists on app store presence, consider a thin native wrapper (Capacitor/Cordova) around the PWA.
- The design system must support responsive breakpoints and touch-friendly interactions from day one.

---

## Q16: How do you establish and enforce front-end coding standards across multiple teams?

**Answer:**

**Automate everything you can. Document the rest. Enforce through culture, not policing.**

**Automated enforcement (non-negotiable):**
- ESLint with a shared config package (`@company/eslint-config-frontend`). Teams can't disable rules without a documented exception.
- Stylelint for CSS/SCSS standards.
- Prettier for formatting — zero debates about tabs vs. spaces.
- TypeScript strict mode — `noImplicitAny`, `strictNullChecks`. Catches bugs at compile time.
- Custom lint rules for project-specific patterns (e.g., "no direct DOM manipulation", "no hard-coded strings").
- Husky + lint-staged for pre-commit checks. If it doesn't pass lint, it doesn't get committed.

**CI enforcement:**
- All of the above runs in CI. PR can't merge if lint fails.
- Bundle size check — fail if a PR increases the bundle by more than X%.
- Test coverage thresholds — fail if coverage drops below the threshold.
- a11y checks — fail if axe-core finds violations.

**Human enforcement (culture):**
- Architecture Decision Records (ADRs) for significant decisions. "Why did we choose X over Y?"
- PR review guidelines — not just "does it work?" but "does it follow our patterns?"
- A lightweight style guide (not 100 pages — 5-10 pages of the most important patterns with code examples).
- Tech talks and pairing sessions to spread knowledge.

**What NOT to do:**
- Don't create a 50-page coding standards document that nobody reads.
- Don't make the platform team the PR review bottleneck for every team.
- Don't enforce standards retroactively on existing code — apply them to new code and refactor incrementally.

---

## Q17: How do you approach design tokens and the Figma-to-code pipeline?

**Answer:**

**Design tokens are the contract between design and engineering.** They're the single source of truth for visual decisions.

**Token taxonomy:**

```
Global tokens (primitives):     blue-500: #005bf0
    ↓ referenced by
Semantic tokens (alias):        color-primary: {blue-500}
    ↓ referenced by
Component tokens (specific):    button-background-primary: {color-primary}
```

**The pipeline:**

1. **Figma** — designers define tokens using Figma Variables or the Tokens Studio plugin.
2. **Export** — tokens exported as JSON (W3C Design Tokens format or Style Dictionary format).
3. **Transform** — Style Dictionary transforms JSON into platform outputs:
   - CSS custom properties for web.
   - SCSS variables for legacy CSS.
   - TypeScript constants for programmatic access.
   - Swift/Kotlin values for native mobile (if needed).
4. **Publish** — token package published to npm registry. Components depend on it.
5. **Consume** — components use `var(--color-primary)`, never `#005bf0`.

**Multi-brand support:**
- Same semantic token names, different primitive values per brand.
- `brand-a/primitives.json` → `color-primary` resolves to blue.
- `brand-b/primitives.json` → `color-primary` resolves to green.
- Components don't change. Only the token values change.

**Runtime theming:**
- CSS custom properties can be overridden at runtime.
- Tenant config API returns token overrides → JavaScript sets them on `:root` → entire UI updates instantly.

**What makes this work:**
- Designers and engineers agree on the token names. This is the hardest part.
- Tokens are versioned and published like any other package.
- Breaking changes (renaming a token, removing a token) go through a deprecation cycle.

---

## Q18: How do you handle technical debt in a front-end platform? How do you prioritise it?

**Answer:**

**Acknowledge it exists. Quantify it. Pay it down incrementally.**

**Categorisation:**

1. **Deliberate debt** — "we know this isn't ideal, but we're shipping now and will fix it later." Document it. Create a ticket. Set a deadline.

2. **Accidental debt** — "we didn't know better at the time." Discovered during code reviews or audits. Address when you touch that code next.

3. **Environmental debt** — "the framework released a new version and our patterns are now outdated." Plan a migration. Don't rush it.

**How I prioritise:**

| Priority | Criteria | Example |
|---|---|---|
| P1 — Fix now | Security risk or data loss | XSS vulnerability, auth token leak |
| P2 — Next sprint | Blocks other teams or causes production issues | Shared component bug, broken build |
| P3 — Quarterly | Slows development velocity | Outdated test framework, missing types |
| P4 — Opportunistic | Nice to have, fix when touching that code | Code style inconsistencies, old patterns |

**Strategies that work:**
- **20% rule** — every sprint, 20% of capacity goes to tech debt. Non-negotiable. Product managers will always fill 100% with features if you let them.
- **Boy Scout rule** — leave the code better than you found it. Touching a file? Fix the lint warnings. Update the deprecated API call.
- **Strangler fig pattern** — for large migrations (e.g., AngularJS to Angular), wrap the old code, build new features in the new stack, gradually replace.
- **Dependency update cadence** — monthly minor updates, quarterly major updates. Don't let dependencies get 3 years behind.

**How to sell it to leadership:**
- Frame it as velocity investment, not cleanup. "If we spend 2 sprints on this, we'll ship features 30% faster for the next 6 months."
- Track metrics: build time, test execution time, time-to-first-PR for new developers. These quantify the cost of debt.

---

## Q19: How do you approach CI/CD for front-end artefacts, especially shared component libraries?

**Answer:**

**The pipeline for a shared component library:**

```
PR opened
  → Lint (ESLint + Stylelint + Prettier check)
  → Type check (tsc --noEmit)
  → Unit tests (affected libraries only)
  → Component tests
  → Visual regression (screenshot diff)
  → a11y scan (axe-core)
  → Bundle size check
  → Storybook build (verify it compiles)
  → Deploy Storybook preview (PR-specific URL for review)

PR merged to main
  → All of the above (full suite, not just affected)
  → Semantic version bump (based on conventional commits)
  → Publish to npm registry
  → Deploy Storybook to production URL
  → Notify consuming teams of new version

Release
  → Changelog generation
  → Git tag
  → Publish with dist-tag (latest, next, beta)
```

**Key decisions:**

1. **Versioning** — semantic versioning with conventional commits. `feat:` = minor bump, `fix:` = patch, `BREAKING CHANGE:` = major. Automate with semantic-release or changesets.

2. **Affected-based testing** — in a monorepo, only test what changed. Nx `affected` command is great for this. Don't run 10,000 tests for a README change.

3. **Visual regression** — run on every PR. Reviewers see a visual diff alongside the code diff. Approve visual changes explicitly.

4. **Storybook preview deploys** — every PR gets a deployed Storybook URL. Designers and PMs can review without pulling the branch locally.

5. **Canary releases** — before publishing a major version, publish a canary (`16.0.0-canary.1`). Consuming teams can test against it before it becomes `latest`.

6. **Breaking change communication** — major versions get a migration guide. Ideally, provide a codemod (automated code transformation) so teams don't have to manually update every import.

**For a monorepo with multiple publishable packages:**
- Each package (core, ui, forms, framework) has its own version and changelog.
- Publish all packages together to avoid version matrix hell.
- Lock shared dependencies to the same version across packages.

---

## Q20: You're starting this role on day one. What's your 90-day plan?

**Answer:**

**Days 1–30: Listen, learn, build relationships.**

- Meet every engineering lead and senior engineer. Understand their pain points, what's working, what's not.
- Audit the current front-end landscape: frameworks, patterns, inconsistencies, tech debt.
- Review the existing design system (if any). Understand adoption, gaps, and team sentiment.
- Understand the product roadmap — what's coming in the next 6-12 months that will impact front-end architecture.
- Ship one small, visible improvement. Fix a pain point that everyone complains about. Build credibility through action, not slides.

**Days 30–60: Propose and align.**

- Draft the front-end technical vision (2-page RFC, not a 50-page document).
- Propose the technology evaluation criteria and process for framework selection.
- Identify the top 3 architectural improvements that would have the biggest impact.
- Start the design system audit — what exists, what's missing, what's the contribution model.
- Run a workshop with senior engineers: "What does great front-end look like here?"
- Begin defining the testing strategy with team input.

**Days 60–90: Execute and demonstrate.**

- Kick off the framework evaluation spike (2-3 candidates, same feature, time-boxed).
- Build the first reference implementation — a real feature built "the right way".
- Establish the design token pipeline (Figma → Style Dictionary → CSS variables).
- Set up the CI pipeline improvements (visual regression, a11y checks, bundle size tracking).
- Publish the first version of the front-end standards guide.
- Present findings and recommendations to engineering leadership.

**What I'd avoid in the first 90 days:**
- Rewriting anything. Earn trust first.
- Mandating a framework switch without team buy-in.
- Creating governance processes before understanding the culture.
- Trying to fix everything at once. Pick 3 things. Do them well.

**The meta-goal:** by day 90, every engineer should know who I am, what I'm trying to achieve, and feel like they had input into the direction. Technical strategy without team buy-in is just a document nobody follows.
