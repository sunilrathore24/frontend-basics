# Frontend Architect — Interview Q&A (Torque Project)

> 20 real-world questions grounded in the Torque codebase, mapped to the Iris/Cornerstone JD.
> Each answer references actual code, patterns, and architectural decisions from the project.

---

## Q1. Walk us through the overall architecture of the front-end platform you've worked on.

**Answer:**

Torque is an NX-based Angular monorepo that serves as the UI platform for the Saba/Cornerstone HR and payroll product suite. The workspace is organised into clearly separated layers:

- **`libs/core/platform`** — Cross-cutting platform services: i18n, HTTP interceptors, caching, error handling, configuration, navigation, accessibility, logging, and feature toggles.
- **`libs/ui`** — 60+ reusable UI components (button, modal, datagrid, carousel, virtual-scroll, stepper, tree-view, etc.).
- **`libs/forms`** — 20+ form components (select, multiselect, datepicker, RTE, file upload, paging toolbar) with reactive forms integration.
- **`libs/framework`** — The application shell: header, sidenav, subnav, footer, breadcrumbs, and layout orchestration, backed by NgRx state.
- **`libs/foundations`** — Design tokens, CDK, icons, and web component elements (Galaxy, SBX variants).
- **`libs/patterns`** — Higher-order UX patterns composed from UI and form components.
- **`apps/`** — Playground, sandbox, and Storybook apps for development and documentation.

**How it wires together at app startup:**

The consuming app imports `TrqCoreModule.forRoot()` which composes all platform features using a provider-function pattern:

```typescript
TrqCoreModule.forRoot(navService, bundleService, bundles, titleService, manifest)
// internally spreads:
//   ...withI18n().providers
//   ...withA11y().providers
//   ...withNavigation().providers
//   ...withApplicationInitializer().providers
//   ...withCache().providers
//   ...withConfiguration().providers
//   ...withErrorHandler().providers
//   ...withHttpInterceptors().providers
//   ...withLogging().providers
//   ...withDynamicComponentLoader().providers
```

Each `with*()` function returns a `TrqCoreFeature` object with a `kind` enum and a `providers` array. This makes the platform composable — the standalone API (`provideTorqueCore()`) merges features by `kind`, so apps can override defaults by passing their own feature of the same kind.

The build publishes 15+ npm packages so consuming product teams depend on exactly what they need. NX's dependency graph and affected commands ensure only impacted libraries are rebuilt and tested.

A singleton guard in the constructor prevents double-importing:

```typescript
constructor(@Optional() @SkipSelf() parentModule: TrqCoreModule) {
  if (parentModule) {
    throw new Error('TrqCoreModule is already loaded. Import it in the AppModule only');
  }
}
```


---

## Q2. How did you approach building and evolving the design system?

**Answer:**

The design system in Torque is multi-layered:

**Layer 1 — Design Tokens** (`libs/foundations/design-tokens`):
JSON-based token files define colour, spacing, and typography primitives. Tokens use a reference syntax so semantic tokens resolve to brand primitives:

```json
"color.primary.default": { "type": "color", "value": "{torque.color.blue.default}" }
```

The hierarchy is consistent: `subtlest → subtle → default → bold → boldest` for every colour role (primary, neutral, success, info, warning, error). Each role also has an `on-*` counterpart for text/icon colours on that background.

**How tokens become CSS:** The JSON tokens are compiled into CSS custom properties (`--lego-color-primary`, `--lego-color-neutral-bold`, etc.) and also exported as TypeScript constants:

```typescript
export const LegoColorPrimary = 'var(--lego-color-primary)';
export const LegoAppShellColorHeader = 'var(--lego-app-shell-color-header)';
```

A Tailwind config (`tailwind.config.js`) also consumes these tokens, filtering by type to generate utility classes with a `lego-` prefix.

**Layer 2 — CDK** (`libs/foundations/cdk`): Low-level behaviours (focus trapping, overlay positioning, keyboard handling) that UI components build on.

**Layer 3 — Component Libraries** (`libs/ui`, `libs/forms`): Each component is standalone Angular with its own SCSS, published via ng-packagr. Components use the `trq-` prefix and `ChangeDetectionStrategy.OnPush`.

**Layer 4 — Storybook** (v8.6.14): Multiple instances document components with live examples, accessibility audits (a11y addon), and theme switching.

**Contribution Model:** NX generators enforce the `trq-` prefix, SCSS styling, and ESLint/Stylelint rules. The CI pipeline runs lint, unit tests, and accessibility checks before merge. Feature teams extend the system by adding components to the appropriate library — the tooling enforces conventions automatically.

---

## Q3. How do you handle theming and white-labelling for enterprise customers?

**Answer:**

Torque's theming is driven by design tokens compiled to CSS custom properties.

**How it works end-to-end:**

1. **Token Definition** — Two theme files exist: `torque.json` (primary brand) and `flare.json` (alternative brand). Both define the same semantic keys but map to different brand colours. For example, `color.primary.default` points to `{torque.color.blue.default}` in Torque but to a different hue in Flare.

2. **Token Compilation** — Tokens are compiled into CSS custom properties and TypeScript constants. The Tailwind config also consumes them for utility classes.

3. **Runtime Theming** — At runtime, swapping the CSS custom property values re-themes the entire UI without a rebuild. Components reference tokens via `var(--lego-color-primary)`, never hardcoded colours.

4. **App Shell Tokens** — The framework layer has dedicated tokens for header, navigation, and hamburger menu colours (`--lego-app-shell-color-header`, `--lego-app-shell-color-navigation-hamburger`, etc.), so the chrome around the application can be branded independently from the content area.

5. **White-Labelling** — For enterprise customers, a different token file maps the same semantic keys to their brand colours. The single-build, multi-theme approach means one deployment serves all tenants.

**Why this matters for HR/payroll SaaS:** Enterprise customers often require their own branding. The token-based approach means the product team doesn't maintain per-customer builds — they maintain per-customer token files, which are just JSON.


---

## Q4. Explain the internationalisation strategy and how it supports runtime locale switching.

**Answer:**

Torque uses a custom runtime i18n system built on `@ngx-translate/core`. The key design choice was runtime over build-time translations because translations may come from a backend API (not available at build time), and we serve one build for all locales.

**The full flow when a locale is activated:**

1. **`TrqLocaleInitializerService`** runs at app startup (via the Application Initializer pattern). It reads the default locale from config (`trq.i18n.locales.default`, defaults to `'en'`) and calls `localeService.use('en')`.

2. **`TrqLocaleService.use(locale)`** does several things:
   - Normalises the locale format — converts between IETF (`en-US`) and Java (`en_US`) based on the `trq.i18n.locales.ietf` config flag.
   - Sets a fallback locale if configured (`trq.i18n.locales.fallback`).
   - Updates the global `Accept-Language` HTTP header via `TrqGlobalHttpHeaderService` so all subsequent API calls carry the locale.
   - Delegates to ngx-translate's `TranslateService.use()`, which triggers the custom loader.

3. **`TrqTranslateResourceBundleLoader.getTranslation(locale)`** is called by ngx-translate. It calls `fetchResourceBundle()` for each registered bundle name using `forkJoin`, then merges all results into a single flat map. Keys are namespaced as `BUNDLE_resourceCode` (e.g., `COMMON_SAVE`).

4. **`TrqResourceBundleService`** is abstract — each consuming app implements it. The playground app's implementation fetches from `assets/resource-bundles/{name}/{name}.json` and flattens the nested structure:

```typescript
// Input JSON:  { resourceId: "SAVE", resourceValues: { "en": "Save", "fr": "Sauvegarder" } }
// Output map:  { "COMMON_SAVE": "Save" }
```

5. **RTL Detection** — `TrqLocaleDirectionService` subscribes to locale changes. When a locale like `ar` (Arabic) is activated, it sets `dir="rtl"` on the `<html>` element. RTL locales: `ar`, `fa`, `iw`, `he`, `yi`, `ur`.

**Three ways to consume translations:**

- **Directive** (preferred): `<span [trqTranslate]="'SAVE'" [trqTranslateBundle]="'COMMON'">`  — efficient, only re-evaluates on locale/translation change.
- **Pipe**: `{{ 'SAVE' | trqTranslate:'COMMON' }}` — impure pipe, deprecated because it runs every change detection cycle.
- **Service**: `translationService.translate('SAVE', 'COMMON', params)` — for TypeScript code.

Parameters use `{{paramName}}` interpolation: `"Hello {{name}}, you have {{count}} items"`.

---

## Q5. How is state management implemented? Walk through the data flow.

**Answer:**

Torque uses **NgRx** (v20.0.0) with a feature-module pattern. Here's the complete data flow:

**Store Registration:**

The framework registers its feature state:

```typescript
// Module approach:
StoreModule.forFeature('framework', reducers)

// Standalone approach:
provideState('framework', reducers)
```

The `reducers` map combines two child reducers:

```typescript
export const reducers: ActionReducerMap<FrameworkState> = {
  nav: navReducer,      // navigation tree, breadcrumbs, TOC
  setting: settingReducer  // UI configuration (tile nav, sticky header, branding, etc.)
};
```

**Actions → Reducers → State:**

When a component needs to change state, it dispatches an action through the facade:

```
Component calls facade.updateSetting({ smallScreen: true })
  → facade dispatches new UpdateSettingAction({ smallScreen: true })
    → settingReducer receives action, returns new state:
       { setting: Object.assign({}, state.setting, action.payload) }
      → store emits new state
        → selectors recompute
          → facade observables emit new values
            → components re-render
```

Navigation actions are richer — `RefreshNavAction` receives a nested nav tree, the reducer parses it into a `TreeModel` for efficient traversal. `UpdateBreadcrumbForRoute` walks the tree to find the active path and extracts breadcrumb nodes.

**Selectors — Two-Level Composition:**

Child reducers define local selectors:

```typescript
// setting.ts — local selector
export const isSmallScreen = settingFilterFactory('smallScreen');
```

The index file composes them with the feature selector:

```typescript
// reducers/index.ts — composed selector
export const selectSettingState = createSelector(selectFrameworkState, state => state.setting);
export const isSmallScreen = createSelector(selectSettingState, fromSetting.isSmallScreen);
```

This two-level composition means child reducers don't know about the global state tree — they're reusable and testable in isolation.

**Facade Pattern — How Components Consume State:**

The `TrqFrameworkFacade` is the single entry point for components. It exposes 40+ observables:

```typescript
@Injectable()
export class TrqFrameworkFacade {
  isSmallScreen$ = this._store.select(fromFramework.isSmallScreen)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  isTileNav$ = this._store.select(fromFramework.isTileNav)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  // ... 40+ more selectors

  constructor(private _store: Store<fromFramework.State>) {}

  updateSetting(setting: TrqFrameworkSetting): void {
    this._store.dispatch(new UpdateSettingAction(setting));
  }

  refreshNav(navData: TrqFrameworkSettingsNavItem): void {
    this._store.dispatch(new RefreshNavAction(navData));
  }
}
```

**Why `shareReplay({ bufferSize: 1, refCount: true })`?**
- `bufferSize: 1` — Late subscribers get the last emitted value immediately.
- `refCount: true` — The subscription is cleaned up when all subscribers unsubscribe, preventing memory leaks.

**Why the Facade pattern?**
- Components never import Store, actions, or selectors directly — they only depend on the facade.
- If the state shape changes, only the facade needs updating, not every component.
- It's easy to mock in tests — just provide a mock facade.


---

## Q6. What's your approach to front-end testing strategy?

**Answer:**

Torque has a layered testing strategy:

**Unit Tests** — Karma + Jasmine with ChromeHeadless. Every library has its own `karma.conf.js` and `tsconfig.spec.json`. The CI pipeline (`sanity-part-1.sh`) runs lint and unit tests as the first gate. Coverage reports are generated in HTML, LCOV, and JSON formats, integrated with TeamCity.

The Karma config includes a custom `ChromeHeadlessNoSandbox` launcher for containerised CI:

```javascript
ChromeHeadlessNoSandbox: {
  base: 'ChromeHeadless',
  flags: ['--headless', '--no-sandbox', '--window-size=1024,768',
          '--disable-gpu', '--remote-debugging-port=9222']
}
```

**Component Testing** — Storybook (v8.6.14) with the a11y addon provides interactive component testing. Each component has stories exercising different states, inputs, and edge cases.

**Accessibility Testing** — A dedicated CI step (`sanity-a11y.sh`) runs accessibility audits. The Storybook a11y addon catches WCAG violations during development.

**Linting** — ESLint for TypeScript and Stylelint for SCSS run in parallel across all libraries. Custom ESLint rules (via `libs/plugins/eslint`) enforce project-specific conventions.

**CI Pipeline Structure:**
```
sanity-part-1.sh → TypeScript lint + SCSS lint + unit tests with coverage
sanity-part-2.sh → Additional validation
sanity-part-3.sh → Final checks
sanity-a11y.sh   → Accessibility audits
```

**What I'd evolve:** Add Playwright for E2E testing, Chromatic/Percy for visual regression testing, and Testing Library for more user-centric component assertions. The current setup catches logic bugs well but doesn't catch visual regressions or cross-browser rendering issues.

---

## Q7. How do you ensure accessibility across the component library?

**Answer:**

Accessibility is embedded at multiple levels in Torque:

**1. Core A11y Module — `TrqAriaEventManager`:**

This is the most interesting piece. It extends Angular's `EventManager` and intercepts all `click` event registrations across the entire app. When a click handler is registered on an element, the AriaEventManager automatically:

- Adds `keyup` listener for Enter and Space keys, so keyboard users can activate the same handler.
- Adds `keydown` listener to prevent browser scrolling on Space key.
- Calls `ariaService.applyAriaClickAttributes(element)` to add appropriate ARIA attributes.
- Checks a blacklist to skip elements that already handle keyboard events natively (buttons, links, inputs).

```typescript
// Simplified flow:
addEventListener(element, 'click', handler) {
  super.addEventListener(element, 'click', handler);  // normal click
  if (ariaService.enabled && !ariaService.isEventBlacklisted(element)) {
    // Add keyboard equivalent
    addKeyupListener(element, (event) => {
      if (event.keyCode === ENTER || event.keyCode === SPACE) {
        handler(event);  // same handler as click
      }
    });
  }
}
```

This means every clickable element in the app automatically gets keyboard support without developers doing anything extra. It's registered as a replacement for Angular's default `EventManager`:

```typescript
{ provide: EventManager, useClass: TrqAriaEventManager }
```

**2. Component-Level:** Components implement ARIA attributes, keyboard navigation, focus management. The `TrqFormFieldComponent` manages `aria-labelledby`, `aria-describedby`, and error announcements.

**3. Storybook A11y Addon:** Every component story runs axe-core audits in real time.

**4. CI Pipeline:** `sanity-a11y.sh` runs automated accessibility checks before merge.

**5. RTL/i18n:** The i18n system automatically handles text direction, and PostCSS RTL plugin generates mirrored stylesheets.

**Important caveat:** Automated tools catch about 30-40% of WCAG issues. Full compliance requires manual testing with screen readers (NVDA, VoiceOver) and expert review.

---

## Q8. How does the platform handle HTTP communication and API integration?

**Answer:**

Torque has a layered HTTP system with a configurable interceptor chain.

**Interceptor Registration Order:**

```typescript
// http.provider.ts
{ provide: HTTP_INTERCEPTORS, useClass: TrqLoggingInterceptor, multi: true },
{ provide: HTTP_INTERCEPTORS, useClass: TrqCacheInterceptor, multi: true },
{ provide: HTTP_INTERCEPTORS, useClass: TrqInFlightInterceptor, multi: true },
```

**How the chain works — a GET request flows through:**

```
Component → HttpClient.get('/api/employees')
  → TrqLoggingInterceptor
      logs: "GET:/api/employees"
      passes to next
  → TrqCacheInterceptor
      extracts URL path, finds best-fit cache by regex matching
      generates cache key = URL + Accept-Language header
      if cached: returns cached HttpResponse immediately (short-circuits chain)
      if not cached: passes to next, caches response on success
  → TrqInFlightInterceptor
      checks if identical GET is already in-flight
      if yes: returns the existing shared Observable (deduplication)
      if no: passes to next, tracks the request, removes on complete/error
  → HttpClient sends actual request
```

**Configuration-Driven Enable/Disable:**

Every interceptor extends `TrqBaseInterceptor` which checks a config flag before executing:

```typescript
// TrqBaseInterceptor.intercept()
if (configService.getValue('trq.http.interceptors.cache.enable', true)) {
  return this.doIntercept(request, next);  // run interceptor logic
} else {
  return next.handle(request);  // skip, pass through
}
```

This means each interceptor can be toggled per environment or per tenant without code changes.

**Cache Interceptor Details:**

The cache key includes the `Accept-Language` header, so switching locale invalidates cached translations:

```typescript
generateRequestIdentifier(request) {
  let identifier = request.urlWithParams;
  const acceptLanguage = request.headers.get('Accept-Language');
  if (acceptLanguage) identifier += acceptLanguage;
  return identifier;
}
```

The `findBestFit()` method matches the request URL against configured cache patterns and picks the most specific match (longest pattern wins).

**In-Flight Interceptor Details:**

For GET requests, it uses `share()` to multicast the response Observable. If 5 components request the same URL simultaneously, only one HTTP call is made and all 5 get the same response:

```typescript
observable = next.handle(request).pipe(takeUntil(cancelSubject), share());
httpService.addInFlightRequest(url, observable, cancelSubject);
```


---

## Q9. How do you approach performance optimisation in a large Angular application?

**Answer:**

Several patterns are used in Torque:

**1. OnPush Change Detection** — Adopted across 40+ components (select, radio, datagrid, card, sidebar, stepper, virtual-scroll, header, sidenav, footer, form-field, etc.). With OnPush, Angular only checks a component when its `@Input` references change or an event fires within it — not on every change detection cycle. This is critical when you have complex pages with dozens of components.

**2. Lazy Loading & Code Splitting** — Route-based code splitting via `loadChildren`. The dynamic component loader also supports runtime lazy loading via manifests (explained in Q10). This means the initial bundle only contains the shell — feature modules load on demand.

**3. Virtual Scrolling** — `TrqVirtualScrollComponent` renders only visible items in long lists. For HR data grids with thousands of employee rows, this is the difference between a 3-second render and a 50ms render.

**4. Memoised Selectors** — All NgRx selectors use `createSelector()` which memoises results. The `settingFilterFactory` creates selectors dynamically by key, and each is memoised independently. A `TrqMemoizePipe` is also available for template-level memoisation.

**5. ShareReplay on Facade Observables** — Every facade observable uses `shareReplay({ bufferSize: 1, refCount: true })`. Without this, each `| async` pipe in a template would create a separate store subscription and selector computation. With it, 10 subscribers share one computation.

**6. HTTP Deduplication** — The in-flight interceptor prevents redundant API calls when multiple components request the same data simultaneously.

**7. Build Optimisation** — NX affected commands ensure only changed libraries are rebuilt. The build uses `--parallel` with high-memory allocation (`--max_old_space_size=8192`).

---

## Q10. How does the platform support micro-frontend or modular architecture?

**Answer:**

Torque supports modular composition at multiple levels:

**1. Dynamic Component Loader — Runtime Lazy Loading:**

This is the most interesting pattern. Components are registered via manifests:

```typescript
interface TrqDynamicComponentManifest {
  componentId: string;           // unique ID to reference the component
  path: string;                  // internal Angular path
  loadChildren: LoadChildrenCallback;  // lazy import function
}
```

When a component is needed, `TrqDynamicComponentLoader.getComponent(componentId)` does the following:

1. Finds the manifest by `componentId`.
2. Calls `manifest.loadChildren()` — this triggers the lazy import and downloads the chunk.
3. Creates an `NgModuleRef` from the loaded module.
4. Retrieves the component type from the module's `TRQ_DYNAMIC_COMPONENT` injection token.
5. **Registers translation bundles** — the loader gets the child module's `TranslateService` and registers its resource bundles with the parent's `TrqTranslateRegistryService`. This ensures translations are available before the component renders.
6. Returns `{ componentType, ngModuleRef }` to the caller.

The `TrqDynamicComponentLoaderComponent` then uses `ViewContainerRef.createComponent()` to instantiate it:

```html
<trq-dynamic-component-loader [componentId]="'employee-widget'">
</trq-dynamic-component-loader>
```

**Why this matters:** Feature teams can build and deploy components independently. The shell doesn't know about the component at build time — it only knows the manifest. This is a stepping stone toward full micro-frontends.

**2. Module Federation** — The styleguide uses Webpack Module Federation with `loadRemoteModule()` to compose remote entry modules from different builds.

**3. Feature Toggles** — `TrqFeatureToggleRouteGuard` controls which routes are available based on configuration, supporting gradual rollouts (explained in Q14).

---

## Q11. How do you handle error handling and resilience in the front-end?

**Answer:**

Torque has a centralised error handling strategy:

**Global Error Handler:**

`TrqGlobalErrorHandler` replaces Angular's default `ErrorHandler`. It catches every unhandled exception across the entire application:

```typescript
@Injectable()
export class TrqGlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    this.getLoggerService().error('Unhandled Angular Error\n{0}', this.formatAngularError(error));
  }

  protected formatAngularError(error: any): string {
    return isNil(error.stack) ? error.toString() : error.stack;
  }
}
```

It uses lazy injection for the logger (`this.injector.get(TrqLoggerService)`) to avoid circular dependency issues during bootstrap.

**HTTP Error Handling:**

The interceptor chain handles HTTP-specific errors:
- The logging interceptor logs error responses with status code and URL.
- The in-flight interceptor cleans up tracked requests on error, preventing stale entries.
- The cache interceptor only caches successful responses.
- Status codes are defined as constants (`401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`) for consistent handling.

**Application Initializer Resilience:**

`TrqApplicationInitializationService` collects all `TRQ_APPLICATION_INITIALIZER` implementations, runs them in parallel via `forkJoin`, and returns `true` only if all succeed. If any initializer fails, the error is logged but doesn't crash the app — the service catches errors gracefully:

```typescript
forkJoin(initObservables).subscribe({
  next: (results) => observer.next(this.isAllTrue(results)),
  error: (error) => this.logger.error(error)
});
```

It also implements `canActivate()`, so it can be used as a route guard to block navigation until initialization completes.


---

## Q12. How do you approach cross-browser and responsive design?

**Answer:**

**Responsive Framework:**

The framework layer tracks screen size via NgRx state. When the viewport crosses a breakpoint, `TrqFrameworkFacade` dispatches `UpdateSettingAction({ smallScreen: true })`. Components subscribe to `facade.isSmallScreen$` and adapt their rendering — for example, the datagrid has mobile-specific cell and header components, and the breadcrumb has a mobile variant.

The breakpoint threshold is configurable per app via `desktopBreakpoint` in the framework settings (defaults to `TrqBreakpoint.LG_UP`).

**SCSS Architecture:** SMACSS-organised SCSS (`libs/assets/src/lib/smacss/scss`) with a grid system built via a custom script (`build-grid.js`). Responsive mixins and breakpoint variables ensure consistent responsive behaviour.

**RTL Support:** PostCSS RTL plugin generates mirrored stylesheets (`build:rtl`), and the i18n system automatically sets the `dir` attribute on `<html>`. This is essential for Arabic and Hebrew users.

**CSS Custom Properties:** Design tokens compiled to CSS custom properties work across all modern browsers and enable runtime theming.

---

## Q13. How do you manage the CI/CD pipeline for front-end artefacts?

**Answer:**

The CI/CD pipeline is structured in the `.ci/` directory:

**Sanity Checks (4 stages):**
```
sanity-part-1.sh → TypeScript lint + SCSS lint + unit tests with coverage
sanity-part-2.sh → Additional validation
sanity-part-3.sh → Final checks
sanity-a11y.sh   → Accessibility audits
```

**Build:** `npm run build` runs NX parallel builds for all 11 publishable libraries. RTL stylesheets are generated via `build:rtl`. The build uses `--max_old_space_size=8192` for large compilation.

**Publishing (`publish-torque.sh`):**

The script publishes 15+ packages sequentially to the npm registry (Artifactory):
1. Installs dependencies with `yarn --prefer-offline --frozen-lockfile`
2. Runs production build with RTL
3. Runs `prepublishOnly` scripts
4. Publishes each package: Core → UI → Forms → Framework → Assets → Patterns → Plugins (NX, Lego, ESLint) → Foundations (Design Tokens, CDK, Icons, Elements) → Vendors

Each package has its `prepublishOnly` script stripped before publish to avoid circular builds.

**Storybook Deployment:** Separate build and push scripts for Torque Storybook and Lego Storybook, deployed as static sites.

**NX Affected:** Only impacted libraries are rebuilt and tested on PRs, keeping CI fast even as the monorepo grows.

---

## Q14. How do you handle configuration-driven UI for enterprise customers?

**Answer:**

Torque has a robust configuration system:

**`TrqConfigService`** — A centralised key-value store. All platform services read their behaviour from config keys. Configs can be static values or dynamic functions:

```typescript
enum TrqConfigType { FUNCTION, VALUE }
```

**Feature Toggle System — How it evaluates:**

`TrqFeatureToggleService.validate()` supports:

- **Single toggle:** `validate('feature.new-dashboard')` — checks if the config key is truthy.
- **Array with AND:** `validate(['feature.a', 'feature.b'], AND)` — all must be true.
- **Array with OR:** `validate(['feature.a', 'feature.b'], OR)` — any must be true.
- **Negation:** `validate('!feature.legacy-mode')` — true if the toggle is OFF.
- **Dynamic toggles:** If the config value is a function (`TrqConfigType.FUNCTION`), it's invoked at evaluation time. This supports runtime conditions like "enable if user has role X".

**Route Guard Integration:**

`TrqFeatureToggleRouteGuard` reads toggle names from route data:

```typescript
{
  path: 'new-dashboard',
  component: DashboardComponent,
  canActivate: [TrqFeatureToggleRouteGuard],
  data: {
    featureToggle: ['feature.new-dashboard', 'feature.analytics'],
    featureToggleOperator: TrqFeatureToggleOperator.AND,
    redirectTo: '/legacy-dashboard'
  }
}
```

If the toggles are off, the user is redirected to the fallback route. This enables progressive rollouts and A/B testing without code changes.

**HTTP Interceptor Configuration:** Each interceptor is individually toggleable via `trq.http.interceptors.{name}.enable`, so different tenants can have different HTTP behaviours.

---

## Q15. How do you approach mentoring and upskilling front-end engineers?

**Answer:**

In the context of Torque, several mechanisms support team enablement:

**1. Comprehensive Documentation** — Every major module has detailed markdown docs. The `i18n.module.md` is a good example: it covers setup (root vs feature module), configuration keys, implementation patterns with code examples, runtime locale switching, translation consumption (directive vs pipe vs service), parameter handling, RTL support, and initialization sequence.

**2. Storybook as a Learning Tool** — Multiple Storybook instances serve as living documentation. Engineers see components in action, read the API, and copy code patterns. The a11y addon teaches accessibility by showing violations in real time.

**3. Reference Implementations** — The playground app (`apps/playground`) demonstrates how to wire up the core module, implement resource bundle services, configure routing, and use all platform features. It's the "golden path" for new teams.

**4. NX Generators and Plugins** — Custom NX plugins (`libs/plugins/nx`, `libs/plugins/lego`, `libs/plugins/eslint`) enforce conventions automatically. Engineers don't need to memorise naming rules — the tooling enforces them. This is "paved road" thinking: make the right thing the easy thing.

**5. Provider-Function Pattern** — The `with*()` pattern used throughout the codebase (`withI18n()`, `withCache()`, `withHttpInterceptors()`) is self-documenting. Each function clearly shows what it provides, and the `TrqCoreFeatureKind` enum makes the feature catalogue discoverable.

**6. Workshops** — I'd run workshops on OnPush change detection (why it matters, common pitfalls), NgRx patterns (when to use store vs local state), accessibility testing with screen readers, and design token contribution — all grounded in real Torque code.


---

## Q16. How would you evaluate and recommend a new front-end technology stack?

**Answer:**

I'd follow a structured evaluation process:

**1. Define Criteria** — Performance, developer experience, ecosystem maturity, .NET backend integration, mobile strategy, accessibility support, and team skill set.

**2. Assess Current State** — Torque is Angular 20 with NgRx, ngx-translate, Clarity, and a mature component library. Any migration must account for the 60+ UI components, 20+ form components, and the entire design token system.

**3. Evaluate Options** — For this JD's context (.NET backend, enterprise SaaS):
- **Angular** — Already in use, strong enterprise support, excellent TypeScript integration, built-in i18n and a11y.
- **React** — Larger ecosystem, but would require rebuilding the entire component library.
- **Blazor** — Native .NET integration, but less mature front-end ecosystem.

**4. Build Consensus** — Run proof-of-concept spikes with team members, not in isolation. Present findings with trade-off matrices to engineering leadership.

**5. Migration Strategy** — If migrating, use Module Federation to run old and new frameworks side by side during transition. Torque's design token system is framework-agnostic (CSS custom properties), so it transfers to any stack.

---

## Q17. How does the platform handle navigation and routing patterns?

**Answer:**

Torque has a layered navigation system, all backed by NgRx state:

**Navigation Data Flow:**

1. The consuming app implements `TrqNavigationService` to provide navigation data (typically from an API).
2. The app dispatches `RefreshNavAction(navData)` with a nested tree of `TrqFrameworkSettingsNavItem` objects.
3. The `navReducer` parses the tree using `TreeModel` for efficient traversal and stores both the raw data and the parsed tree.
4. When the route changes, `UpdateBreadcrumbForRoute(activeRoute)` is dispatched. The reducer walks the tree to find the active path and extracts breadcrumb nodes.

**Framework Shell Components:**

The framework library provides the full application chrome, all reading from the store via the facade:
- **Header** — with actions, branding (logo, title, icon), powered-by logo
- **Sidenav** — collapsible, with overlay mode, sorted/unsorted, icon support
- **Subnav** — secondary navigation within a section
- **Breadcrumbs** — auto-generated from the nav tree based on active route
- **Footer** — with version info and powered-by branding

**Dynamic Routing:** The dynamic component loader enables runtime route registration via manifests, supporting micro-frontend-style composition.

**Feature Toggle Guards:** Routes can be gated by feature toggles with AND/OR operators and redirect URLs.

**Page Titles:** `TrqPageTitleMapperService` maps routes to translated page titles, integrated with the i18n system.

---

## Q18. How do you handle caching in the front-end?

**Answer:**

Torque has a dedicated caching layer with three storage backends:

**Cache Configuration:**

```typescript
interface TrqCacheConfiguration {
  name: string;              // regex pattern to match URLs
  storageMode: TrqCacheStorageMode;  // MEMORY | SESSION | LOCAL_STORAGE
  expirationInSecs?: number;
  scopeName?: string;        // for scoped invalidation
}
```

**How caching works end-to-end:**

1. **Cache Registration** — Apps register cache configurations with URL patterns (e.g., `/api/reference-data/.*`).

2. **Request Interception** — The `TrqCacheInterceptor` extracts the URL path, finds the best-fit cache by regex matching (longest pattern wins), and checks for a cached response.

3. **Scoped Cache Keys** — The `TrqCache` class supports scope providers. The `TrqLocaleCacheScopeProviderService` scopes caches by locale. Cache keys are prefixed with the scope value:

```typescript
toScopedKey(key) {
  const scopeValue = this.scopeProvider?.getCurrentScopeValue();
  return isNil(scopeValue) ? key : `s:${scopeValue}.${key}`;
}
```

4. **Locale-Aware Invalidation** — When the locale changes, the scope value changes, so cached entries for the old locale are effectively invisible. The `removeByScopeValue()` method can explicitly purge entries for a specific scope.

5. **Storage Backends** — Memory (fastest, lost on refresh), SessionStorage (survives navigation, lost on tab close), LocalStorage (persists across sessions).

**Why this matters for HR/payroll:** Reference data (job titles, departments, org structures, dropdown options) changes rarely but is requested constantly. Caching these with appropriate expiration saves hundreds of API calls per session.

---

## Q19. How would you approach building a design-to-code workflow?

**Answer:**

Based on Torque's existing foundation:

**1. Design Tokens as the Bridge** — Torque already has JSON-based design tokens. I'd integrate with Figma's token plugin so designers update tokens in Figma, which syncs to the `libs/foundations/design-tokens` JSON files. The existing compilation pipeline transforms them to CSS custom properties, TypeScript constants, and Tailwind utilities.

**2. Storybook as the Contract** — Storybook already documents every component. I'd add Chromatic for visual regression testing, so any design change that affects component rendering is caught automatically.

**3. Component API Documentation** — Storybook's autodocs generate API documentation from component `@Input`/`@Output` decorators. Designers reference this to understand what's configurable.

**4. Figma Component Mapping** — Each Figma component maps 1:1 to a Torque component. The Storybook instance becomes the shared reference point.

**5. Visual Regression in CI** — Add Chromatic or Percy to the CI pipeline so every PR shows visual diffs. Designers can review and approve visual changes before merge.

---

## Q20. What would be your 90-day plan as Frontend Architect for this platform?

**Answer:**

**Days 1–30: Assess and Align**
- Deep-dive into the Torque codebase — understand the library boundaries, build pipeline, and pain points.
- Meet with each feature team to understand their front-end challenges, skill gaps, and wish list.
- Audit current testing coverage, accessibility compliance, and performance baselines (Core Web Vitals).
- Review the design token system and identify gaps in the Figma-to-code workflow.

**Days 31–60: Strategy and Quick Wins**
- Publish a front-end technical vision document covering: testing strategy, accessibility standards, performance budgets, and design system contribution model.
- Introduce Playwright for E2E testing and Chromatic for visual regression — these are the biggest gaps.
- Establish performance budgets and Core Web Vitals monitoring.
- Run the first workshop on OnPush change detection and NgRx best practices.

**Days 61–90: Scale and Enable**
- Roll out the updated testing strategy to at least two feature teams with hands-on pairing.
- Establish the design-to-code workflow with Figma token sync and Storybook as the shared reference.
- Create reference implementations for common patterns (data grid page, form wizard, dashboard) that teams can clone.
- Set up a front-end architecture decision record (ADR) process.
- Begin evaluating mobile strategy options (PWA vs React Native vs .NET MAUI) with proof-of-concept spikes.

---

## Bonus: Key Numbers to Remember

| Metric | Value |
|---|---|
| UI Components | 60+ |
| Form Components | 20+ |
| Published Packages | 15+ |
| Angular Version | 20.x |
| NgRx Version | 20.x |
| Storybook Version | 8.6.x |
| Design Token Themes | 2 (Torque, Flare) |
| RTL Locales Supported | 6 (ar, fa, iw, he, yi, ur) |
| OnPush Components | 40+ |
| CI Sanity Steps | 4 (lint, test, validation, a11y) |
| HTTP Interceptors | 3 (logging, cache, in-flight) |
| NgRx Feature Reducers | 2 (nav, setting) |
| Facade Observables | 40+ |
| Cache Storage Modes | 3 (memory, session, local) |
