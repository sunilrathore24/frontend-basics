# Frontend Architect Interview Q&A — Based on the Torque Repository

---

## Q1: Describe the overall architecture of the Torque design system. How is the monorepo structured and why?

**Answer:**

Torque is an Angular-based UI platform built as an Nx monorepo. The repository is structured into several key layers:

- **`libs/core/`** — Core utilities, CDK (Component Development Kit), platform services (i18n, HTTP, caching, error handling, feature toggles), and shared utilities.
- **`libs/ui/`** — 60+ presentational UI components (button, modal, datagrid, tabs, accordion, sidebar, stepper, tree-view, etc.).
- **`libs/forms/`** — 15+ form-specific components (input, select, checkbox, datepicker, RTE, file upload, dynamic forms via Formly).
- **`libs/framework/`** — Application shell components (header, sidenav, footer, body) with NgRx-based state management for navigation and settings.
- **`libs/patterns/`** — Design patterns documentation (typography, color palette, iconography).
- **`libs/foundations/`** — Design tokens (via Style Dictionary), a CDK for web components, Lit-based web components (Galaxy elements), and an icon library.
- **`libs/lego/`** — Angular wrappers around the Lit-based web components.
- **`libs/plugins/`** — Custom Nx plugins, Lego plugins, and a custom ESLint plugin (`@torque/eslint-plugin`).
- **`apps/`** — Playground, sandbox, and Storybook applications for development and documentation.
- **`styleguide/`** — A separate sub-monorepo hosting the full component showcase with E2E/Cypress testing and module federation remotes.

This layered architecture enforces separation of concerns: foundations feed into core, core feeds into UI/forms, and framework composes them into application shells. Nx enforces dependency boundaries and enables affected-based builds/tests for CI efficiency.

---

## Q2: How does Torque handle theming and white-labelling for enterprise customers?

**Answer:**

Torque supports 10+ themes (Saba, Newco, Lumesse, Dark, New Blue, Tailwind Blue, Material Blue, Cloudflare Blue, PXP, CSOD, Flare) through a multi-layered theming system:

1. **SMACSS-based SCSS architecture** — Theme files live in `libs/assets/src/lib/smacss/scss/`. Each theme has a dedicated file (e.g., `newco-theme.scss`, `dark-theme.scss`) plus a base `theme.scss`.
2. **Design tokens** — `libs/foundations/design-tokens/` uses Style Dictionary to generate tokens. Lego tokens integrate into SCSS via `_lego-tokens-theme.scss`.
3. **CSS custom properties** — Theme variables are exposed as CSS variables, enabling runtime switching.
4. **`SgThemeService`** — A service backed by `TrqCacheService` with `LOCAL_STORAGE` mode persists user theme preferences. It converts theme objects using `THEME_VARIABLES` mapping.
5. **Component-level theming** — Each component has a `_config.scss` for variables and a `_theme.scss` for themeable properties, following the DEVELOPER.md guidelines.
6. **No hard-coded colors** — The coding guidelines explicitly forbid hard-coded colors, font sizes, and weights. All must use existing mixins, functions, and variables with the `$trq-` prefix.

For white-labelling, the combination of design tokens, CSS variables, and dynamic stylesheet loading allows enterprise customers to apply their own branding without code changes.

---

## Q3: Explain the component architecture pattern used in Torque. How are components designed for reusability?

**Answer:**

Torque components follow several key patterns:

- **Attribute selectors for native element enhancement** — e.g., `button[trqButton]` instead of `<trq-button>`. This preserves native HTML semantics and accessibility while adding Torque behavior.
- **`ChangeDetectionStrategy.OnPush`** — Used extensively across 50+ components for performance. Components rely on immutable inputs and explicit `ChangeDetectorRef.markForCheck()` calls.
- **Standalone components** — Modern components use Angular's standalone API with explicit `imports` arrays (e.g., `NgClass`, `NgTemplateOutlet`).
- **Enum-driven configuration** — Components use TypeScript enums for variants (e.g., `TrqButtonType.PRIMARY`, `TrqButtonSize.LARGE`) rather than magic strings.
- **Observable-friendly inputs** — The button component accepts both `boolean` and `Observable<any>` for its `trqLoading` input, automatically subscribing and managing cleanup.
- **Prefix convention** — All components use the `trq` prefix (`TrqButtonComponent`, `trq-select`, etc.) enforced via Nx generator configuration.
- **Module + Standalone dual support** — Libraries export both NgModules and standalone components for backward compatibility.
- **Each component library** has its own `index.ts` barrel export, mapped via TypeScript path aliases in `tsconfig.base.json` (e.g., `@torque/ui/button`, `@torque/forms/select`).

---

## Q4: How does Torque implement accessibility (a11y)? What patterns and tooling are used?

**Answer:**

Accessibility is a first-class concern in Torque:

**Core A11y Module (`libs/core/cdk/src/lib/a11y/`):**
- `TrqA11yModule` — Central accessibility utilities module.
- `TrqAriaService` — Programmatic ARIA attribute management.
- `TrqKeyboardSelectDirective` — Keyboard navigation support for interactive lists.
- `TrqHotkeyDirective` — Hotkey binding support.
- `TrqTabTrapDirective` / `TrqTabTrapService` — Focus trapping for modals and overlays.
- `TrqAriaListItemDirective` — Active/inactive state management for list items with proper ARIA roles.

**Component-level patterns:**
- `@HostBinding('attr.aria-*')` decorators for ARIA attributes.
- `@HostListener('keydown')` for keyboard event handling.
- Dedicated a11y directives per complex component (e.g., `TrqDatagridA11yDirective` with cell-based keyboard navigation).
- Components track a11y status (DONE, PARTIAL, NA) in their metadata.

**Tooling:**
- `@storybook/addon-a11y` integrated into Storybook for automated axe-core checks.
- `chai-a11y-axe` for programmatic accessibility assertions in tests.
- DEVELOPER.md mandates: "Ensure your components are accessible."

**RTL support** is also part of accessibility — full bidirectional text support with `dir="ltr"` / `dir="rtl"` attributes and PostCSS RTL transformation.

---

## Q5: Describe the state management approach in Torque. Why was NgRx chosen and how is it scoped?

**Answer:**

Torque uses NgRx (`@ngrx/store` 20.0.0) but scopes it specifically to the **framework layer** rather than applying it globally:

- **`navReducer`** — Manages navigation state (menu items, active routes, navigation tree).
- **`settingReducer`** — Manages application settings state.
- **Actions** — Typed action classes like `RefreshNavAction`, `RefreshNavByIdAction`, `MergeNavChildrenAction`, `UpdateSettingAction` with typed payloads.
- **`TrqFrameworkFacade`** — A facade service that abstracts NgRx store interactions, providing a clean API to consuming applications without exposing store internals.

This is a deliberate architectural choice: NgRx is used for cross-cutting application shell concerns (navigation, settings) where multiple components need synchronized state, but individual UI components use simpler patterns (RxJS Subjects, `@Input`/`@Output`, services with BehaviorSubjects) to avoid over-engineering.

The framework module also uses `TrqConfigProvider` with typed configuration (`TrqConfigType` supporting BOOLEAN, STRING, FUNCTION types) and `TrqFeatureToggleService` for feature flag management — these are service-based, not NgRx-based, keeping the state management proportional to the problem.

---

## Q6: How does Torque handle internationalization (i18n)? Explain the architecture for a multi-locale enterprise application.

**Answer:**

Torque has a comprehensive i18n system in `libs/core/platform/src/lib/i18n/`:

**Architecture:**
- **`TrqI18nModule`** — Root module configured via `forRoot()` with base translation settings, and `forChild()` for feature-specific resource bundles.
- **`TrqI18nChildModule`** — Lightweight child module for lazy-loaded feature areas.
- **`TrqTranslationService`** — Wraps `@ngx-translate/core` (v16.0.4) for translation lookups.
- **`TrqLocaleService`** — Manages the active locale, locale switching, and locale persistence.
- **`TrqLocaleDirectionService`** — Determines RTL/LTR direction based on locale with a static `isRTL(locale)` method.
- **`TrqLocaleCacheScopeProviderService`** — Caches locale data per scope to avoid redundant loading.

**Standalone API:**
- `provideTorqueI18nFeature(resourceBundles)` — Modern standalone provider function for feature-based i18n.
- `withI18n()` and `withI8nFeature()` — Core feature providers for the new Angular standalone bootstrap pattern.

**Resource bundle strategy:**
- Feature-specific translation files loaded lazily per route.
- Resource bundles served as static assets from `/resource-bundles/`.
- Fallback language support for missing translations.
- `TrqTranslateDirective` for template-based translations.

**RTL integration:**
- PostCSS RTL transformation (`@mjhenkes/postcss-rtl`) generates mirrored stylesheets.
- Separate RTL build pipeline: `npm run build:rtl`.
- `dir` attribute management at the HTML root level.

---

## Q7: Explain the micro-frontend architecture in the Torque ecosystem. How is Module Federation configured?

**Answer:**

The styleguide application uses Webpack Module Federation via `@nx/angular/module-federation`:

**Host/Remote pattern:**
- The styleguide acts as the **host** application.
- **Remotes**: `ui-remote`, `core-remote`, `forms-remote` — each exposes component documentation and examples.
- Remote entry modules expose specific Angular modules for dynamic loading.

**Shared dependency management** (`base-module-federation.config.js`):
- Core Angular packages (`@angular/core`, `@angular/common`, `@angular/router`, `@angular/forms`, etc.) are shared as singletons.
- `rxjs` and `ngx-markdown` are shared.
- Torque packages (`@torque/core`, `@torque/core/platform`, `@torque/ui/services`) are shared with `singleton: true, strictVersion: true`.
- Torque package versions are dynamically resolved via `process.env.trqPackageVersion`.

**Custom webpack configuration:**
- Raw file loading for `.md`, `.html`, `.ts`, `.scss` files (for documentation rendering).
- Merged via `webpack-merge` with the Module Federation config.

This architecture allows independent deployment of component documentation while sharing the Angular runtime and Torque libraries, avoiding version conflicts and duplicate bundles.

---

## Q8: How does Torque approach testing? Describe the testing pyramid and tooling.

**Answer:**

Torque implements a multi-layered testing strategy:

**Unit Testing:**
- **Framework:** Jasmine 5.12.0 + Karma 6.4.4.
- **Coverage:** HTML, text-summary, JSON, LCOV reporters.
- **CI mode:** `ChromeHeadlessNoSandbox` with custom launcher flags.
- **Parallel execution:** `npm run test:libs:*` scripts split tests across CI agents.
- **TeamCity integration:** `karma-teamcity-reporter` for CI build reporting.
- Every component has a `.spec.ts` file with test helpers and mock classes.

**E2E Testing:**
- **Framework:** Cypress (in the styleguide sub-monorepo).
- **Visual regression:** Pixelmatch-based CSS regression testing.
- **Cross-browser:** BrowserStack integration for cross-browser/device testing.
- DEVELOPER.md requires: "Add Cypress Suite in styleguide" and "Test/Update specific Cypress suite" before promoting code.

**Accessibility Testing:**
- `@storybook/addon-a11y` for automated axe-core checks in Storybook.
- `chai-a11y-axe` for programmatic a11y assertions.
- Component-level a11y status tracking.

**Linting:**
- `npm run lint:ts` — ESLint across all libraries.
- `npm run lint:scss` — Stylelint for SCSS files.
- Custom `@torque/eslint-plugin` with rules like `button-has-type` enforcing accessibility patterns.

**CI Pipeline (`.ci/` scripts):**
- `sanity-part-1.sh` — Lint TS/SCSS + unit tests.
- `sanity-part-2.sh` / `sanity-part-3.sh` — Additional validation stages.
- `sanity-a11y.sh` — Dedicated accessibility sanity checks.

---

## Q9: How does Torque implement a feature toggle system? How would this support RBAC-driven UI?

**Answer:**

The feature toggle system lives in `libs/core/platform/src/lib/feature-toggle/`:

**Components:**
- **`TrqFeatureToggleService`** — Core service that validates feature codes against `TrqConfigService`. Supports compound validation with operators: `AND`, `OR`, `NOT`.
- **`TrqFeatureToggleDirective`** — Structural directive (`*trqFeatureToggle`) for conditionally rendering template blocks based on feature flags.
- **`TrqFeatureToggleRouteGuard`** — Implements `canLoad`, `canActivate`, and `canActivateChild` to protect routes based on feature availability.

**How it works:**
```typescript
// Service validates a single feature code
featureToggleService.validateCode('PAYROLL_ADVANCED');

// Compound validation with operators
featureToggleService.validate(['PAYROLL_ADVANCED', 'ENTERPRISE_TIER'], TrqFeatureToggleOperator.AND);
```

**Template usage:**
```html
<div *trqFeatureToggle="'PAYROLL_ADVANCED'">
  <!-- Only rendered if feature is enabled -->
</div>
```

**Route protection:**
```typescript
{ path: 'payroll', canActivate: [TrqFeatureToggleRouteGuard], data: { featureCode: 'PAYROLL_ADVANCED' } }
```

For RBAC-driven UI, this system can be extended by having the backend populate feature flags based on user roles/permissions. The `TrqConfigService` acts as the central configuration store — it can be hydrated with role-based feature sets at login, and the toggle directive/guard automatically reflects the user's permissions across the entire UI.

---

## Q10: How does Torque handle performance optimization in its Angular components?

**Answer:**

Several performance strategies are employed:

1. **`ChangeDetectionStrategy.OnPush`** — Used in 50+ components. This skips change detection unless inputs change by reference or events fire within the component. Components use `ChangeDetectorRef.markForCheck()` for manual updates when needed.

2. **Virtual scrolling** — `TrqVirtualScrollComponent` wraps Angular CDK's `ScrollDispatcher` for rendering only visible items in large lists. The datagrid has `TrqDatagridVirtualDirective` for virtualised row rendering.

3. **Deferred loading** — `TrqDeferLoadDirective` enables lazy component rendering, loading content only when it enters the viewport.

4. **Lazy-loaded routes** — Feature modules use `loadChildren` for code splitting. Module Federation further splits the styleguide into independently loaded remotes.

5. **Tree-shaking** — Rollup-based builds with AOT compilation. Each library is independently buildable with its own `package.json`.

6. **Build optimization** — `node --max_old_space_size=8192` for large builds. Nx caching (`nx affected`) ensures only changed libraries are rebuilt.

7. **RxJS patterns** — Components use `finalize()`, proper `Subscription` management, and `ngOnDestroy` cleanup to prevent memory leaks (visible in the button component's Observable-based loading pattern).

8. **Performance profiling** — `ng.profiler.timeChangeDetection()` available for development-time profiling.

---

## Q11: How does Torque bridge the gap between design and development? Describe the design-to-code workflow.

**Answer:**

Torque has a structured design-to-code pipeline:

**Design Tokens:**
- `libs/foundations/design-tokens/` uses Style Dictionary (v3.8.0) to transform design tokens into platform-specific outputs (SCSS variables, CSS custom properties).
- `LegoColorUtils` provides color manipulation utilities (`parseColor`, `toHslString`, `darkenColor`, `lightenColor`) using tinycolor for programmatic token derivation.
- Tokens cover colors, typography, shadows, borders, and spacing.

**Storybook as the bridge:**
- Three Storybook instances: main UI (port 4400), forms, and Lego (port 4500).
- `storybook-design-token` addon (v3.1.0) renders token documentation directly in Storybook.
- Stories are co-located with components (`*.stories.ts` + `*.mdx` docs).
- Static assets include resource bundles and design assets.
- Production Storybooks deployed to `torque.saba.com/`.

**Component documentation standards (from DEVELOPER.md):**
- Every component requires Sassdoc and Compodoc documentation.
- Play examples (interactive demos) are mandatory.
- Styleguide examples with Cypress suites.
- Config files define all variables; theme files contain themeable properties.

**BEM naming convention** — CSS follows BEM-like naming (`http://getbem.com/naming/`), providing a predictable mapping from design specs to CSS class names.

**Multi-Storybook references** — The main Storybook references Lego and UI Storybooks, creating a unified documentation portal that designers and developers share.

---

## Q12: How does Torque handle forms and complex form scenarios in an enterprise HR/payroll context?

**Answer:**

Torque has a rich forms layer in `libs/forms/`:

**Standard form components:**
- `trq-select` / `trq-multiselect` — Dropdown with search, multi-select, keyboard navigation.
- `trq-datetimepicker` — Date/time selection with locale-aware formatting, tab trapping.
- `trq-number-field` — Numeric input with formatting pipes.
- `trq-form-field` — Wrapper component providing labels, validation messages, and consistent layout.
- `trq-rte` — Rich text editor with configurable toolbar (`TrqRTEDefaultConfig`).
- `trq-file` — File upload with validation (`NG_VALIDATORS`).
- `trq-star-rating` — Rating input.
- `trq-editable-text` — Inline editing.
- `trq-auto-complete` — Typeahead search.
- `trq-dataview` — Data display with filtering.
- `trq-paging-toolbar` — Pagination controls.

**Dynamic Forms (`libs/forms/dynamic-forms/`):**
- Built on `@ngx-formly/core` for schema-driven form generation.
- Dynamic wrappers for each Torque form component (`TrqDynamicAutocompleteComponent`, `TrqDynamicCheckboxComponent`, etc.).
- Enables configuration-driven forms — critical for HR/payroll where form structures vary by tenant, locale, and regulatory requirements.

**Form integration patterns:**
- All form components implement `ControlValueAccessor` via `NG_VALUE_ACCESSOR`.
- Validation via `NG_VALIDATORS` for custom validators.
- `@angular/forms` integration (both template-driven and reactive).

---

## Q13: How does Torque's CI/CD pipeline work? How are shared component packages versioned and published?

**Answer:**

**CI Pipeline (TeamCity/Jenkins):**

The `.ci/` directory contains the full pipeline:

1. **`sanity-part-1.sh`** — Runs `lint:ts`, `lint:scss`, and unit tests with coverage.
2. **`sanity-part-2.sh`** / **`sanity-part-3.sh`** — Additional validation stages.
3. **`sanity-a11y.sh`** — Dedicated accessibility checks.
4. **`teamcity-helpers.sh`** — Provides `blockOpen`/`blockClosed`, `compilationStart`/`compilationFinish`, `logStatusSuccess`/`logStatusFailure`, `publishArtifacts` helpers for structured CI output.

**Build process:**
- `yarn --prefer-offline --frozen-lockfile` — Deterministic installs.
- `npm run build:rtl` — Full production build with RTL support.
- `npm run prepublishOnly` — Pre-publish validation.

**Publishing (`publish-torque.sh`):**
Publishes 15+ packages independently:
- `@torque/core`, `@torque/ui`, `@torque/forms`, `@torque/framework`, `@torque/assets`, `@torque/patterns`, `@torque/eslint-plugin`, `@torque/lego`, and more.
- Each package has `prepublishOnly` stripped before `npm publish`.
- Published to an internal Artifactory registry.

**Storybook deployment:**
- `build-lego-storybook.sh` / `build-trq-storybook.sh` — Build Storybook artifacts.
- `push-lego-storybook.sh` / `push-trq-storybook.sh` — Deploy to hosting.

**Versioning:**
- `package.json` version: `16.0.0-build`.
- `conventional-changelog` for automated changelog generation.
- Husky for git hooks (commit linting, pre-push checks).

---

## Q14: How does Torque support RTL (Right-to-Left) languages? Why is this important for an HR platform?

**Answer:**

RTL support is critical for global HR platforms serving employees in Arabic, Hebrew, Farsi, and other RTL languages.

**Implementation:**
1. **HTML `dir` attribute** — DEVELOPER.md mandates `dir="ltr"` or `dir="rtl"` on the HTML tag. `TrqLocaleDirectionService` determines direction based on the active locale.
2. **PostCSS RTL transformation** — `@mjhenkes/postcss-rtl` automatically generates mirrored CSS. The build pipeline (`npm run build:rtl`) produces RTL-compatible stylesheets.
3. **Dedicated build step** — `npm run build:prod` includes RTL as part of the production build chain.
4. **Component-level awareness** — Components that need directional logic (e.g., sidebars, navigation, data grids) respect the `dir` attribute.
5. **Theme-specific RTL** — Each theme's styles are RTL-transformed, ensuring white-labelled deployments also support bidirectional text.

**Why it matters for HR/payroll:**
- Global enterprises have employees across RTL and LTR regions.
- Payroll slips, leave requests, org charts, and performance reviews must render correctly in the user's language direction.
- Regulatory compliance in some regions requires native language support.

---

## Q15: Describe the web components strategy in Torque. How do Lit-based Galaxy elements integrate with Angular?

**Answer:**

Torque has a dual rendering strategy:

**Lit-based web components (`libs/foundations/elements/galaxy/`):**
- Built with Lit (the lightweight web component library from Google).
- `GalaxyHeaderElement` extends `LitElement` with lifecycle hooks (`connectedCallback`, `updated`, `render`).
- Custom elements registered via `register.ts` with `HTMLElementTagNameMap` augmentation for TypeScript support.
- Support branding customization via `BrandingColors` interface.
- SPA navigation support with link interception.
- Custom elements manifest generation for documentation.

**Angular wrappers (`libs/lego/`):**
- Angular components that wrap Galaxy web components, providing Angular-native APIs (inputs, outputs, dependency injection).
- Enables Angular applications to consume web components with full type safety and change detection integration.

**CDK for web components (`libs/foundations/cdk/`):**
- Shared utilities for building web components.
- Abstraction layer between the web component platform and Angular.

**Why this dual approach?**
- Web components are framework-agnostic — they can be used in non-Angular contexts (e.g., if parts of the product suite use React or vanilla JS).
- Angular wrappers provide first-class Angular DX for the primary consumer.
- The Galaxy elements focus on foundational UI (header, navigation) that might be shared across different frontend technologies in the enterprise.

---

## Q16: How would you approach migrating Torque's component library to support a new frontend framework (e.g., React) alongside Angular?

**Answer:**

Based on Torque's existing architecture, the migration path is already partially laid:

1. **Leverage the web components layer** — Galaxy elements (Lit-based) are already framework-agnostic. Expanding this layer to cover more components creates a universal base.

2. **Design tokens as the bridge** — The Style Dictionary-based token system already generates platform-agnostic outputs. Adding React-specific token formats (CSS-in-JS, styled-components themes) is straightforward.

3. **Storybook as the unified documentation** — Storybook supports both Angular and React. The existing multi-Storybook setup (with references) can incorporate React stories alongside Angular ones.

4. **API contract preservation** — Torque components follow consistent patterns (enum-based types, Observable-friendly inputs). React wrappers should mirror these APIs using props and hooks.

5. **Incremental adoption via Module Federation** — The existing Module Federation setup allows mixing Angular and React micro-frontends. New features could be built in React while existing Angular components continue to serve.

6. **Shared concerns remain shared** — `@torque/core/platform` services (i18n, HTTP, caching, feature toggles) would need framework-agnostic equivalents or thin React adapters.

7. **Testing strategy carries over** — Storybook interaction tests, visual regression, and a11y testing are framework-agnostic.

---

## Q17: How does Torque handle cross-cutting concerns like error handling, HTTP management, and caching?

**Answer:**

These are centralized in `libs/core/platform/`:

**Error Handling (`error/`):**
- `TrqGlobalErrorHandler` extends Angular's `ErrorHandler`.
- Catches all unhandled errors, formats Angular-specific errors via `formatAngularError()`.
- Delegates to `TrqLoggerService` (lazy-loaded via `Injector` to avoid circular dependencies).
- Configured via `TrqErrorModule.forRoot()` or `withErrorHandler()` standalone provider.

**HTTP Management (`http/`):**
- `TrqHttpService` — Tracks in-flight requests with `addInFlightRequest()`, supports bulk abort via `abortInFlightRequests()` and snapshot-based abort via `abortInFlightRequestsSnapshot()`.
- `TrqGlobalHttpHeaderService` — Manages global HTTP headers (auth tokens, tenant IDs, locale headers) applied to all outgoing requests.
- `TrqGlobalHttpHeader` — Value object for header key-value pairs with DI-based registration.
- HTTP interceptors configured via `withHttpInterceptors()` provider.

**Caching (`cache/`):**
- `TrqCacheService` — Factory for named caches.
- `TrqCache` — Individual cache instance with get/set/remove operations.
- **Storage modes:** `CacheLocalStorage` (persistent) and `CacheMemoryStorage` (session-only).
- `TrqCacheConfiguration` — Typed config with `name` and `TrqCacheStorageMode`.
- `TrqLocaleCacheScopeProviderService` — Scoped caching for locale data to avoid redundant API calls.

These services follow the provider pattern — `forRoot()` for module-based apps, standalone `with*()` functions for modern Angular apps.

---

## Q18: How does Torque's datagrid component handle complex enterprise requirements like virtual scrolling, accessibility, and keyboard navigation?

**Answer:**

The datagrid (`libs/ui/datagrid/`) is one of Torque's most complex components:

**Architecture:**
- `TrqDatagridComponent` — Main component with `ChangeDetectionStrategy.OnPush`.
- `TrqDatagridStateInterface` — Typed state interface for grid configuration.
- `TrqDatagridSelection` enum — Supports different selection modes.
- `TrqDatagridColumn` / `TrqDatagridRow` / `TrqRowAction` interfaces — Typed data contracts.
- `TrqDatagridColumnState` — Column-level state tracking (sort, visibility, width).

**Virtual scrolling:**
- `TrqDatagridVirtualDirective` — Directive that enables virtual rendering for large datasets.
- Integrates with `TrqResizeDetectorService` for responsive column sizing.
- Manages expandable rows within the virtual scroll context.

**Accessibility:**
- `TrqDatagridA11yDirective` — Dedicated a11y directive with:
  - Cell-based keyboard navigation (arrow keys, tab).
  - `Cell` interface for tracking focusable cells.
  - `MutationObserver`-based DOM change detection for dynamic content.
  - Proper ARIA roles and attributes for grid semantics.

**Sorting:**
- `TrqSortOrder` enum — Ascending, descending, none.
- Column-level sort state management.

**Partials:**
- `TrqDatagridColumnComponent` — Individual column definition with header, cell template, and sort configuration.

---

## Q19: How does Torque enforce coding standards and architectural consistency across teams?

**Answer:**

Multiple enforcement layers:

1. **DEVELOPER.md guidelines** — Comprehensive coding standards covering:
   - No hard-coded text (use enums/interfaces/classes).
   - No direct DOM manipulation.
   - Accessibility mandatory.
   - No HTTP requests in components (callback functions only).
   - Angular style guide conventions.
   - BEM-like CSS naming.
   - REM units preferred.
   - RTL support required.
   - Unit tests, play examples, styleguide examples, and Cypress suites required.

2. **Custom ESLint plugin (`@torque/eslint-plugin`):**
   - `button-has-type` rule — Enforces that all `<button>` elements have explicit `type` attributes (accessibility and form submission safety).
   - Extensible rule framework using `ESLintUtils.RuleCreator`.

3. **Nx workspace constraints:**
   - Generator defaults enforce `trq` prefix, SCSS styling, ESLint linting.
   - Dependency graph (`nx dep-graph`) visualizes and enforces library boundaries.
   - `nx affected` ensures only impacted libraries are tested/built.

4. **Stylelint** — SCSS linting via `npm run lint:scss` across all libraries.

5. **Husky git hooks** — Pre-commit and pre-push validation.

6. **CI gates** — Three-part sanity pipeline must pass before code promotion.

7. **Storybook as living documentation** — Components must have stories and docs, creating a self-documenting system.

---

## Q20: If you were to define a front-end technology evaluation framework for this organization, what criteria would you use and how does Torque's current stack measure up?

**Answer:**

**Evaluation criteria for an HR/payroll enterprise platform:**

| Criteria | Torque's Current State |
|---|---|
| **Enterprise maturity** | Angular 20 — mature, LTS-backed, strong enterprise adoption. Excellent. |
| **Component ecosystem** | 75+ components across UI, forms, framework. Comprehensive for HR/payroll workflows. |
| **Design system support** | Multi-layered: design tokens, SCSS themes, Storybook, web components. Strong foundation. |
| **Accessibility** | Dedicated a11y module, ARIA services, keyboard navigation, axe-core testing. Solid but could expand automated coverage. |
| **i18n / RTL** | Full i18n with ngx-translate, RTL via PostCSS, locale-aware services. Production-ready for global deployment. |
| **Performance** | OnPush detection, virtual scrolling, lazy loading, code splitting. Well-optimized. |
| **Testing** | Jasmine/Karma unit tests, Cypress E2E, visual regression, a11y testing. Comprehensive pyramid. |
| **Multi-tenancy** | Theme system with 10+ themes, feature toggles, config-driven UI. Supports white-labelling. |
| **Team scalability** | Nx monorepo with affected builds, module federation, independent library publishing. Scales well across teams. |
| **Backend integration** | REST-based with HTTP service layer, global headers, interceptors. Could benefit from GraphQL/BFF for complex payroll data. |
| **Mobile strategy** | Responsive SCSS utilities, but no dedicated mobile framework (React Native, Flutter, MAUI). Gap area. |
| **Developer experience** | Playground, sandbox, Storybook, hot reload, Nx generators. Strong DX. |

**Recommendations for the role's first 12 months:**
1. Evaluate mobile strategy — Progressive Web App vs. cross-platform framework.
2. Consider GraphQL/BFF layer for complex payroll data aggregation.
3. Expand automated a11y testing coverage (e.g., Playwright with axe integration).
4. Formalize the design token pipeline with Figma integration (Figma Tokens plugin to Style Dictionary).
5. Establish contribution model documentation for the design system so feature teams can extend it consistently.
