# Frontend Architect — Interview Q&A (Flare React Design System)

> 20 real-world questions grounded in the Flare codebase, mapped to enterprise front-end architect roles.
> Each answer references actual code, patterns, and architectural decisions from the project.

---

## Q1. Walk us through the overall architecture of the front-end platform you've worked on.

**Answer:**

Flare is a Lerna + Nx monorepo with Yarn workspaces that serves as the shared React design system and component library for the Cornerstone OnDemand (CSOD) HR/Learning product suite. The workspace is organised into clearly separated package layers:

- **`@flare/primitives`** — 80+ base UI components (Button, DataGrid, Modal, Tabs, Accordion, Carousel, DatePicker, RichTextEditor, TreeView, etc.) built with React and styled-components.
- **`@flare/core-utils`** — Cross-cutting platform services: HTTP/GraphQL clients, session management, JWT handling, logging (Splunk + console), bootstrap, MFE utilities, and testing fixtures.
- **`@flare/globalization`** — Culture-aware date/number/time formatting with CDN-loaded locale data files.
- **`@flare/patterns`** — Higher-order UX patterns: Global Navigation, Object Picker, AI Assist (FlareGPT), Conversation View.
- **`@flare/charts`** — Data visualisation components built on Recharts.
- **Domain packages** — `@flare/learning`, `@flare/core-hr`, `@flare/performance`, `@flare/recruiting`, `@flare/pxp`, `@flare/grovo`, `@flare/ai`.
- **`@flare/tools`** — Nx generators for scaffolding components, icons, libraries, and packages.

**How it wires together at app startup:**

Consuming applications call `bootstrap()` from `@flare/core-utils`, which hooks into the CSOD page-layer lifecycle:

```typescript
// bootstrap.ts
export const bootstrap = (renderFn: () => void): void => {
  if (!window?.csod) { window.csod = {}; }
  window.csod = {
    ...window.csod,
    player: {
      ...window.csod.player,
      initialize: () => {
        renderFn();
        setupSessionRenewal();
      },
    },
  };
};
```

The app then wraps its component tree with `CoreProvider`, which composes all required providers in a single wrapper:

```typescript
export const CoreProvider = ({ config, children }) => {
  const { context, hostElement, localization, theming, direction, amplitude, liveAnnouncer } = config;
  return (
    <GlobalContextProvider context={context}>
      <HostElementProvider hostElement={hostElement}>
        <ThemeProvider {...theming}>
          <LocalizationProvider {...localization}>
            <DirectionProvider {...direction}>
              <AmplitudeProvider {...amplitude}>
                <LiveAnnouncerProvider {...liveAnnouncer}>
                  {children}
                </LiveAnnouncerProvider>
              </AmplitudeProvider>
            </DirectionProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </HostElementProvider>
    </GlobalContextProvider>
  );
};
```

Each package is independently versioned (Lerna independent mode), published to CSOD's Artifactory npm registry, and consumed by product teams as needed. Nx's dependency graph and affected commands ensure only impacted packages are rebuilt and tested.

---

## Q2. How did you approach building and evolving the design system?

**Answer:**

The Flare design system is multi-layered:

**Layer 1 — Theme Object (Design Tokens):**

The `getTheme()` utility in `@flare/primitives/core-ui` generates a comprehensive theme object containing colours, spacing, typography, elevation, shadows, radii, z-indices, and breakpoints. The theme supports dynamic base colour injection for white-labelling:

```typescript
export function getTheme(t?: string | Options): Theme {
  const primary = baseColor || primary50;  // '#005BF0' default
  // ... generates full colour palette: primary20-60, success20-60, warning20-60, critical20-60
  // ... plus semantic aliases: darkText, lightText, disabled, dividerLine, focus, etc.
  return { colors, space, fonts, fontSizes, fontWeights, lineHeights, radii, elevation, shadows, zIndices, breakpoints };
}
```

**Layer 2 — CSS-in-JS with xstyled:**

Components use `@xstyled/styled-components` which extends styled-components with theme-aware utility props. A typed `th()` helper provides type-safe theme access:

```typescript
export const th = (path: string) => _th(path);
th.color = (value: ColorsType) => _th.color(value);
th.space = (value: SpaceType) => _th.space(value);
th.elevation = (value: ElevationType) => _th(`elevation.${value}`);
th.zIndex = (value: ZIndicesType) => _th.zIndex(value);
```

**Layer 3 — Component Libraries:**

Each component follows a consistent structure: `ComponentName.tsx`, `ComponentName.types.ts`, `ComponentName.test.tsx`, `ComponentName.stories.tsx`, and `index.ts`. Components are functional with hooks, use `React.memo` where appropriate, and expose typed props interfaces.

**Layer 4 — Storybook (v10.2):**

Storybook serves as living documentation with addons for a11y audits, Figma design linking, visual regression testing, coverage tracking, and AI-assisted development. Stories are organised by domain: Primitives, Patterns, Charts, Core HR, Learning, etc.

**Contribution Model:**

Nx generators (`yarn add:component`, `yarn add:library`, `yarn add:package`) enforce naming conventions and file structure. ESLint with custom rules, Prettier formatting, and husky pre-commit hooks ensure consistency. The CI pipeline runs lint, typecheck, unit tests, and accessibility checks before merge.

---

## Q3. How do you handle theming and white-labelling for enterprise customers?

**Answer:**

Flare's theming is driven by a JavaScript theme object passed through styled-components' `ThemeProvider`.

**How it works end-to-end:**

1. **Theme Generation** — `getTheme({ baseColor })` accepts an optional base colour. When a customer's brand colour is provided, the entire primary palette adjusts. The theme defines a complete colour system: `primary20` through `primary60`, plus semantic aliases (`darkText`, `lightText`, `disabled`, `dividerLine`, `focus`).

2. **ThemeProvider** — Wraps the app with xstyled's `ThemeProvider`, injecting the theme into all styled-components:

```typescript
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  baseColor, customTheme, children, font, globalStyle, enableTouchTarget, enableUniversalFocusMode
}) => {
  const theme: Theme = customTheme ? customTheme() : getTheme({ baseColor, font });
  // ... applies touch target mode, universal focus mode via body class toggles
  return (
    <Provider theme={theme}>
      {globalStyle}
      {children}
    </Provider>
  );
};
```

3. **Component Consumption** — Components access tokens via the typed `th()` helper or xstyled utility props, never hardcoded values:

```typescript
const StyledButton = styled.button`
  background-color: ${th.color('primary')};
  padding: ${th.space('small')}px ${th.space('medium')}px;
  border-radius: ${th.radius('medium')}px;
  box-shadow: ${th.elevation('small')};
`;
```

4. **Custom Theme Override** — The `customTheme` prop on `ThemeProvider` allows complete theme replacement. Enterprise customers can provide a function that returns their own `Theme` object, overriding any or all tokens.

5. **Font Customisation** — The `useFontLoader` hook detects Hebrew culture and loads appropriate fonts. The `font` prop on `ThemeProvider` allows overriding body, heading, and monospace font families.

**Why this matters for HR SaaS:** Enterprise customers require their own branding. The base-colour-driven approach means one build serves all tenants — only the colour seed changes per customer.


---

## Q4. Explain the internationalisation strategy and how it supports runtime locale switching.

**Answer:**

Flare has a two-tier i18n system: **UI string localisation** via `LocalizationProvider` and **culture-aware formatting** via `@flare/globalization`.

**Tier 1 — UI String Localisation (LocalizationProvider):**

The `LocalizationProvider` in `@flare/primitives/core-ui` fetches translated strings from CSOD's core-localization API at runtime:

```typescript
const fetchLocalizationValues = async (groups: string[]) => {
  const { csod } = window;
  const httpClient = new CsodHttpClient();
  const endpoint = `${csod.context.serviceBase}services/x/localization/v1/localizations/ui`;
  const queryString = `groups=${groups.join(",")}&culture=${csod.context.cultureName}`;
  const response = await httpClient.get(`${endpoint}?${queryString}`);
  return response?.data && Object.keys(response.data).length > 0 ? response.data : { data: {} };
};
```

Translations are stored in React Context and consumed via hooks:

- **`useLocalizations(defaultValue, localizationKey)`** — Returns the translated string for a key, falling back to the default value. In development mode, missing keys are prefixed with `*` for visual debugging.
- **`useLocalizationsDefaults(localizationKey)`** — Similar but also checks `defaultValues` from the provider, useful for component-level fallback translations.
- **`useLocalizedText()`** — A convenience hook exported from core-ui.

Translation keys are standardised via `standardizeLocalesKey()` which normalises casing, and `standardizeTranslations()` which renames all keys in a translation bundle to their standardised form.

**Tier 2 — Culture-Aware Formatting (@flare/globalization):**

The `GlobalizationProvider` wraps the app and loads culture data from a CDN:

```typescript
export const loadCulture = async (locale: string, options?: LoadingOptions) => {
  const module = `${cdnPrefix}/${locale}.js`;
  const cultureInfo = await loader(module);  // dynamic import from CDN
  return initializeCulture(cultureInfo);      // returns CultureInfo with format methods
};
```

The `useCulture` hook loads culture data with caching and fallback support:

```typescript
const cachedLocales: { [culture: string]: CultureInfo } = {};

export const useCulture = (locale: string | LocaleWithFallback, options?) => {
  // Checks cache first, then loads from CDN
  // Falls back to secondary locale if primary fails
  // Returns CultureInfo with methods: formatDate, formatNumber, parseDate, parseNumber,
  //   toShortDate, toLongDate, toFullDateTime, toNumber, toPercentNumber, etc.
};
```

The `CultureInfo` object provides culture-specific formatting: `formatDate(date, format)`, `formatNumber(number, format, type)`, `parseDate(value)`, `parseNumber(value)`, plus convenience methods like `toShortDate()`, `toLongDateTime()`, `toPercentNumber()`.

**RTL Support:**

The `DirectionProvider` sets text direction (`ltr` or `rtl`) via React Context. In Storybook, Hebrew locale (`he-IL`) automatically switches to RTL:

```typescript
const directionToUse = locale === "he-IL" ? "rtl" : direction || "ltr";
```

Components consume direction via `useDirection()` hook and adapt their layout accordingly.

---

## Q5. How is state management implemented? Walk through the data flow.

**Answer:**

Flare uses **React Context API** as its primary state management approach — there is no Redux, Zustand, or other external state library. This is a deliberate choice for a design system library: components should be stateless or locally stateful, leaving global state management to consuming applications.

**Context-Based State Architecture:**

The `CoreProvider` composes six context providers in a specific order:

```
GlobalContextProvider → HostElementProvider → ThemeProvider → LocalizationProvider
  → DirectionProvider → AmplitudeProvider → LiveAnnouncerProvider → {children}
```

Each provider manages a specific concern:

1. **`GlobalContextProvider`** — Holds the CSOD platform context (`WindowCSOD | CSODContext | PXPContext`), including user info, tokens, endpoints, culture, and corp settings. Components access it via `useCSODContext()`.

2. **`ThemeProvider`** — Manages the design token theme object. Components access tokens via xstyled's `th()` helper or `useTheme()`.

3. **`LocalizationProvider`** — Manages translated UI strings. Fetches translations on mount, stores them in state, and exposes via `useLocalizations()` and `useLocalizationsDefaults()`.

4. **`DirectionProvider`** — Manages text direction (`ltr`/`rtl`). Components access via `useDirection()`.

5. **`AmplitudeProvider`** — Manages the Amplitude analytics client. Initialises on mount with user properties (corp, culture, timezone). Components access via `useAmplitude()`.

6. **`LiveAnnouncerProvider`** — Manages screen reader announcements with a queue-based system. Supports `polite` and `assertive` politeness levels.

**Component-Level State:**

Individual components manage their own state with `useState` and `useReducer`. For example, the `DataGrid` uses `@tanstack/react-table` internally, which manages sorting, filtering, pagination, and selection state. The `useDataGrid` hook composes `useTableOptions` and `useTableInstance`:

```typescript
export const useDataGrid = <TData>(tableOptions: DataGridProps<TData>) => {
  const parsedTableOptions = useTableOptions(tableOptions);
  const tableInstance = useTableInstance(parsedTableOptions);
  return tableInstance;
};
```

**Session State:**

Session state lives on `window.csod.context` — a global object managed by the bootstrap system. The session module tracks `lastEventDate` for activity detection and `token` for JWT refresh. This is intentionally outside React's state system because it must be accessible from non-React code (interceptors, service clients).

**Form State:**

Complex forms in domain packages (e.g., `@flare/learning`'s Question Builder) use `react-hook-form` with `FormProvider`, `useFormContext()`, `useController()`, `useFieldArray()`, and `useWatch()` for reactive validation and dynamic field management.

---

## Q6. What's your approach to front-end testing strategy?

**Answer:**

Flare has a comprehensive, multi-layered testing strategy:

**Unit Tests — Jest + Testing Library:**

Every package has its own Jest configuration extending the root `jest.config.js`. Tests use `@testing-library/react` for user-centric assertions and `jest-styled-components` for styled-components snapshot testing:

```javascript
// Root jest.config.js
module.exports = {
  ...createJestPreset(false, true),
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>../../../" }),
  transformIgnorePatterns: [`/node_modules/(?!(.*\\.mjs$|${esModules})/)`],
  testTimeout: 1000 * 60 * 5,
  coverageReporters: ["lcov"],
};
```

Testing fixtures in `@flare/core-utils/testing` provide reusable mocks: `mockCsodContext()`, `mockCsodGlobal()`, `mockFetchResponse()`, `mockResponse()`, and `handleError()` for async error testing.

**Storybook Tests — Vitest + Playwright Browser:**

Storybook stories double as test cases via `@storybook/addon-vitest`. Tests run in a real Chromium browser via Playwright:

```typescript
// vitest.config.ts
test: {
  browser: {
    enabled: true,
    headless: true,
    instances: [{ browser: "chromium" }],
    provider: playwright({ contextOptions: { viewport: { width: 2200, height: 2200 } } }),
  },
}
```

Three test types are independently toggleable via environment variables:
- **Interaction tests** (`ENABLE_INTERACTION=true`) — Verify component behaviour via play functions.
- **Visual regression tests** (`ENABLE_VISUAL=true`) — SSIM-based image comparison with 1% failure threshold via `storybook-addon-vis`.
- **Accessibility tests** (`ENABLE_A11Y=true`) — Automated axe-core audits via `@storybook/addon-a11y`.

**Accessibility Testing — jest-axe:**

Unit tests use `jest-axe` for programmatic WCAG checks. Storybook's a11y addon provides real-time violation reporting during development.

**CI Pipeline:**

```
affected:lint:ci   → ESLint across affected packages
affected:test:ci   → Jest unit tests with typecheck
test:storybook:ci  → Vitest: interaction + visual + a11y in Playwright
```

Scheduled jobs run full Storybook test suites nightly on weekdays (10:30pm PDT).

**Visual Regression Setup:**

The `vitest.setup.ts` disables all CSS animations during visual tests and implements a `waitForStoryRender()` function that polls until styled-components CSS has landed before capturing snapshots. Stories use tags (`snapshot`, `snapshot-fullheight`, `snapshot-width-1800`) to control viewport sizing.


---

## Q7. How do you ensure accessibility across the component library?

**Answer:**

Accessibility is embedded at multiple levels in Flare:

**1. LiveAnnouncer System — Screen Reader Announcements:**

The `LiveAnnouncerProvider` implements a queue-based announcement system for screen readers. It supports two modes:

- **Global mode** — A single hidden `aria-live` region at the provider level. All announcements route through the queue.
- **Local mode** — Each `LiveAnnouncer` instance renders its own `aria-live` region.

The queue handles announcement ordering — `assertive` announcements jump to the front:

```typescript
const announce = useCallback((text: string, politeness = "polite") => {
  const newAnnouncement = { id: `${Date.now()}-${Math.random()}`, politeness, text: text.trim() };
  setAnnouncementQueue((currentQueue) => {
    if (politeness === "assertive") {
      return [newAnnouncement, ...currentQueue];  // front of queue
    }
    return [...currentQueue, newAnnouncement];     // back of queue
  });
}, []);
```

Duplicate announcements are handled by appending a non-breaking space (`\u00A0`) to force screen readers to re-announce identical text. Processing uses configurable `clearTime` and `processingTime` delays to ensure screen readers pick up each announcement.

**2. ScreenReaderOnlyText Component:**

A utility component that renders visually hidden text accessible to screen readers:

```typescript
const ReaderOnlyText = styled.span`${visuallyHiddenElementCSS}`;

export const ScreenReaderOnlyText = ({ text, role }) => (
  <ReaderOnlyText aria-live="polite" role={role}>{text}</ReaderOnlyText>
);
```

**3. Component-Level ARIA:**

Components implement ARIA attributes, keyboard navigation, and focus management. The `DataGrid` includes a `useDataGridAnnouncer` hook that announces sorting, filtering, and row selection changes to screen readers.

**4. Touch Target Mode:**

`ThemeProvider` supports `enableTouchTarget` which adds a `flr-touch-target` class to `document.body`, increasing interactive element sizes for touch devices and motor-impaired users.

**5. Universal Focus Mode:**

`enableUniversalFocusMode` on `ThemeProvider` enhances focus indicators across all components for keyboard navigation.

**6. Shared Hooks:**

- `useCallbackOnEsc()` — Standardised Escape key handling for modals and flyouts.
- `useDisableBodyScroll()` — Prevents background scrolling when modals are open.
- `useDetectTouchScreen()` — Adapts interaction patterns for touch devices.

**7. Automated Testing:**

- `@storybook/addon-a11y` — Real-time axe-core audits in Storybook with configurable severity levels (`off`, `todo`, `error`).
- `jest-axe` — Programmatic WCAG checks in unit tests.
- `test:storybook:a11y` — Dedicated CI command for accessibility-only test runs.

**Important caveat:** Automated tools catch about 30-40% of WCAG issues. Full compliance requires manual testing with screen readers (NVDA, VoiceOver, JAWS) and expert accessibility review.

---

## Q8. How does the platform handle HTTP communication and API integration?

**Answer:**

Flare has a layered HTTP system with multiple client types, retry logic, and domain-specific header injection.

**Client Hierarchy:**

```
BaseServiceClient (abstract)
  ├── BaseHttpClient
  │     ├── CsodHttpClient  — CSOD monolith APIs (Bearer token + CSOD-Accept-Language)
  │     └── PxpHttpClient   — PXP/Galaxy APIs (different auth context)
  └── BaseGraphQLClient
        ├── CsodGraphQLClient — CSOD GraphQL endpoint
        └── PxpGraphQLClient  — PXP GraphQL endpoint
```

Plus a raw `httpClient` singleton and `graphQLClient` for direct usage without class instantiation.

**BaseServiceClient — Config Merging:**

The base class manages URL resolution and request config merging. Headers from the base config and per-request config are deep-merged:

```typescript
protected getRequestConfig(config?: FetchRequestConfig): FetchRequestConfig {
  return {
    ...this.baseRequestConfig,
    ...config,
    headers: {
      ...(this.baseRequestConfig.headers as Record<string, string>),
      ...config?.headers,
    },
  };
}
```

**CsodHttpClient — Automatic Auth Headers:**

The CSOD client reads the JWT token from `window.csod.context` and injects `Authorization: Bearer {token}` and `CSOD-Accept-Language` headers. It detects token changes between requests:

```typescript
protected getRequestConfig(config?: FetchRequestConfig): FetchRequestConfig {
  if (this.token !== this.context?.token) {
    this.token = this.context?.token;
    this.baseRequestConfig = this.getBaseRequestConfig();  // rebuild headers with new token
  }
  return super.getRequestConfig(config);
}
```

**Retry Logic — Configurable Retry Strategy:**

Every request goes through `retryableRequest()` which wraps the base `request()` function with configurable retry behaviour:

```typescript
export const retryableRequest = async (url, {
  retries = 0,
  httpMethodsToRetry = ["GET", "PUT", "HEAD", "OPTIONS", "DELETE"],
  statusCodesToRetry = [[100, 199], [429, 429], [500, 599]],
  shouldRetry = () => true,
  retryDelay = () => 0,
  ...config
}) => {
  const wrappedFetch = async (attempt = 0) => {
    try {
      return await request(url, config);
    } catch (error) {
      if (shouldRetryRequest({ httpMethodsToRetry, retries, shouldRetry, statusCodesToRetry }, attempt, error)) {
        await sleep(retryDelay(attempt));
        return wrappedFetch(attempt + 1);
      }
      throw error;
    }
  };
  return wrappedFetch();
};
```

Key design decisions:
- POST is excluded from default retry methods (non-idempotent).
- 429 (Too Many Requests) is retried — essential for rate-limited APIs.
- `retryDelay` callback enables exponential backoff strategies.
- `shouldRetry` callback gives consumers full control over retry decisions.

**Error Handling — FetchError:**

Failed requests throw `FetchError` which wraps the full response (status, headers, data, config) for rich error handling:

```typescript
export class FetchError<TResponse> extends Error {
  public response: FetchResponse<TResponse>;
  constructor(message: string, response: FetchResponse<TResponse>) {
    super(message);
    this.response = response;
    this.name = "FetchError";
  }
}
```

**GraphQL Support:**

`BaseGraphQLClient` wraps HTTP POST requests with GraphQL query/variables serialisation. Domain-specific clients (`CsodGraphQLClient`, `PxpGraphQLClient`) inject appropriate auth headers.

---

## Q9. How do you approach performance optimisation in a large React application?

**Answer:**

Several patterns are used across Flare:

**1. Virtual Scrolling — @tanstack/react-virtual:**

The `DataGrid` component uses `@tanstack/react-virtual` (v3.13.12) for virtualised row rendering. For HR data grids with thousands of employee rows, only visible rows are rendered in the DOM. This is the difference between a multi-second render and sub-100ms.

**2. Memoisation — React.memo, useMemo, useCallback:**

Components and computed values are memoised throughout the codebase. The `LocalizationProvider` memoises its context value to prevent unnecessary re-renders:

```typescript
const providerValue = React.useMemo(
  () => ({ defaultValues, translations }),
  [translations, defaultValues]
);
```

The `LiveAnnouncerProvider` memoises its context value with four dependencies:

```typescript
const contextValue = React.useMemo(
  () => ({ announce, clear, mode, state }),
  [state, announce, clear, mode]
);
```

**3. Debouncing and Throttling:**

Custom hooks prevent excessive re-renders and API calls:

- `useDebounce(fn, durationInMs)` — Debounces function calls with proper cleanup and SyntheticEvent persistence.
- `useDebouncedValue(value, delay)` — Debounces a value change.
- `throttle(fn, limit)` — Used in session management to throttle user activity tracking to once per 5 seconds across 9 event types.

**4. Code Splitting — Dynamic Imports:**

The globalization system uses dynamic imports to load culture data on demand from CDN:

```typescript
const module = `${cdnPrefix}/${locale}.js`;
const cultureInfo = await loader(module);  // import(/* webpackIgnore: true */ /* @vite-ignore */ url)
```

This means only the active locale's formatting rules are downloaded, not all 63 supported locales.

**5. Culture Data Caching:**

The `useCulture` hook caches loaded culture data in a module-level object to avoid redundant CDN fetches:

```typescript
const cachedLocales: { [culture: string]: CultureInfo } = {};
// On load: cachedLocales[primary] = culture;
// On subsequent calls: if (primary in cachedLocales) setCultureInfo(cachedLocales[primary]);
```

**6. Build Optimisation:**

- Nx caching for build, test, lint, and format targets.
- `--max-old-space-size=6144` for memory-intensive Storybook builds.
- Affected commands (`affected:test:ci`, `affected:lint:ci`) ensure only changed packages are processed.
- Parallel builds via `lerna run build --parallel --stream`.

**7. Efficient Drag & Drop:**

`@dnd-kit` (v6.3.1) is used for drag-and-drop in the DataGrid, providing performant sortable rows without the overhead of HTML5 drag-and-drop API.


---

## Q10. How does the platform support micro-frontend (MFE) architecture?

**Answer:**

Flare provides first-class MFE support through `@flare/core-utils/mfe` and the session management system.

**1. Context Transformation — LXP to CSOD:**

MFEs running inside the LXP (Learning Experience Platform) shell receive an `LXPContext` object. The `lxpToCsod()` transformer normalises it into the standard `CSODContext` that all Flare components expect:

```typescript
export const lxpToCsod = (lxpContext: LXPContext, meta: Meta, defaultCsodContext?: Partial<CSODContext>) => {
  const csodContext = {
    ...(lxpContext.infra?.correlationId && { correlation: lxpContext.infra.correlationId }),
    ...(lxpContext.infra?.tenant && { corp: lxpContext.infra.tenant }),
    ...(lxpContext.theme?.primary && { theming: { primary: lxpContext.theme.primary } }),
    ...(lxpContext.user?.token && { token: lxpContext.user?.token }),
    ...(lxpContext.user?.language && { cultureName: lxpContext.user?.language }),
    // ... endpoints, user, applicationBase, etc.
  };
  return defaultCsodContext ? mergeDeep(defaultCsodContext, csodContext) : csodContext;
};
```

This means MFEs don't need to know whether they're running in the monolith shell or the LXP shell — the context is normalised before reaching components.

**2. MFE Session Renewal with Reference Counting:**

Multiple MFEs can coexist on the same page. The `setupMFESessionRenewal()` function uses reference counting to coordinate session renewal:

```typescript
export const setupMFESessionRenewal = (eventBus: IEventBus): (() => void) => {
  if (!eventBus.session) eventBus.session = { mfeCount: 0 };
  eventBus.session.mfeCount += 1;

  // First MFE initialises session renewal
  if (eventBus.session.mfeCount === 1) {
    subscribeToTokenEvents(eventBus);
    startPromptRenewSessionConfirmationTimeout(eventBus);
    startRefreshUserTokenInterval(eventBus);
    applyActiveUserTracking();
  }

  // Returns cleanup function for React useEffect
  return () => {
    eventBus.session.mfeCount = Math.max(0, eventBus.session.mfeCount - 1);
    if (eventBus.session.mfeCount === 0) {
      cleanupSessionRenewal(eventBus);
    }
  };
};
```

**3. Event Bus Communication:**

MFEs communicate with the host shell via an event bus for token refresh:

- `appshell:refreshAccessToken` — MFE requests a new token from the host.
- `appshell:retrievedAccessToken:success` — Host responds with the new token.
- `appshell:retrievedAccessToken:error` — Host signals a refresh failure.

The token refresh has a 20-second timeout to prevent hanging if the host is unresponsive.

**4. Kill-Switch:**

`window.__disableSessionRenewal` allows the host shell to disable MFE session renewal logic while still allowing token subscription. This is useful when the host manages its own session lifecycle.

**5. Deep Merge Utility:**

`mergeDeep()` recursively merges context objects, ensuring MFE-specific overrides don't clobber shared configuration.

---

## Q11. How do you handle error handling and resilience in the front-end?

**Answer:**

Flare has error handling at multiple layers:

**1. HTTP Layer — FetchError:**

All HTTP errors are wrapped in `FetchError` which preserves the full response context:

```typescript
if (!response.ok) {
  throw new FetchError(
    `Request ${method} ${url} failed with status code ${response.status}.`,
    payload  // includes status, statusText, headers, data, config
  );
}
```

Unhandled errors (network failures, CORS issues) are caught and re-thrown as generic `Error` with context. `AbortError` is passed through for request cancellation support.

**2. Retry Resilience:**

The `retryableRequest()` function provides automatic retry for transient failures. The retry decision considers HTTP method (POST excluded by default), status code ranges (1xx, 429, 5xx), attempt count, and a custom `shouldRetry` callback. The `retryDelay` callback enables exponential backoff.

**3. Logging — Multi-Adapter System:**

The `logger` from `@flare/core-utils/logging` sends logs to both Splunk (via `CsodServiceAdapter`) and the browser console (via `ConsoleAdapter`) simultaneously:

```typescript
const log = async (value, logLevel, config, adapters = [new CsodServiceAdapter(), new ConsoleAdapter()]) => {
  const request: LogRequest = { message, error, logLevel, data: config?.data, monitor: config?.monitor };
  await Promise.all(adapters.map(async (adapter) => adapter.log(request)));
};

export const logger = { debug, error, fatal, info, warn };
```

The `monitor` field enables alerting on specific errors in Splunk dashboards.

**4. Localisation Fallbacks:**

The `LocalizationProvider` gracefully handles API failures by returning an empty object:

```typescript
try {
  const response = await httpClient.get(`${endpoint}?${queryString}`);
  return response?.data && Object.keys(response.data).length > 0 ? response.data : defaultResponse;
} catch (error) {
  return defaultResponse;  // { data: {} } — app continues with default values
}
```

The `useLocalizations` hook falls back to the `defaultValue` prop when translations are missing, and in development mode marks untranslated strings with `*asterisks*` for visual debugging.

**5. Culture Loading Fallbacks:**

The `useCulture` hook supports a fallback locale. If loading `fr-CA` fails, it automatically tries `en-US`:

```typescript
let error = await tryGetCulture(primary);
if (error && fallback) {
  error = await tryGetCulture(fallback);
}
```

**6. Session Error Recovery:**

Session refresh failures are logged but don't crash the app. The session module prompts users to extend their session before expiry and redirects to the login page only after the grace period expires.

**7. Analytics Resilience:**

The `AmplitudeProvider` wraps initialisation in a try-finally block to ensure the app renders even if analytics fails:

```typescript
try {
  initializeAmplitude(enableLocalhostTracking);
} finally {
  setAmplitudeHasInitialized(true);  // app renders regardless
}
```

---

## Q12. How do you approach cross-browser and responsive design?

**Answer:**

**Responsive Framework — Breakpoint System:**

Flare uses xstyled's breakpoint system with standard breakpoints defined in the theme. The `useBreakpoint()` hook detects the current breakpoint:

```typescript
export function useBreakpoint(breakpoints = standardBreakpoints) {
  // Detects current viewport breakpoint
  // Returns breakpoint name for conditional rendering
}
```

The `useIsMobileBreakpointActive()` hook provides a boolean for mobile-specific rendering. Components like `DataGrid` adapt their layout — mobile-specific cell renderers, simplified headers, and touch-optimised interactions.

**CSS-in-JS Responsive Patterns:**

xstyled provides responsive utility props that map to breakpoints:

```typescript
// Responsive props via xstyled
<Box display={{ xs: 'block', md: 'flex' }} p={{ xs: 'small', lg: 'large' }} />
```

**RTL Support:**

The `DirectionProvider` sets text direction via React Context. Components consume `useDirection()` and adapt their layout. The Storybook preview automatically switches to RTL for Hebrew locale.

**Touch and Mobile Detection:**

- `useDetectTouchScreen()` — Detects touch capability via `maxTouchPoints` and `ontouchstart`.
- `useDetectMobileDevice()` — User-agent based mobile detection.
- `useBrowserDetection()` — Identifies browser type (Chrome, Firefox, Safari, Edge, IE, Opera).

**Touch Target Mode:**

`ThemeProvider`'s `enableTouchTarget` prop adds a body class that increases interactive element sizes to meet WCAG 2.5.5 (Target Size) requirements.

**Font Loading:**

The `useFontLoader` hook detects Hebrew culture and loads appropriate fonts, ensuring correct rendering for RTL scripts:

```typescript
const isHebrewCulture = (cultureName?: string): boolean => {
  // Detects he-IL culture for Hebrew font loading
};
```


---

## Q13. How do you manage the CI/CD pipeline for front-end artefacts?

**Answer:**

The CI/CD pipeline is managed via PipelineKit (Jenkins-based) with configuration in the `automation/` directory.

**Pipeline Structure:**

```yaml
# automation/config.yaml
WorkflowConfigs:
  rcl2-design-system:
    Language: nodejs
    DockerBaseImage: lerna-worker:9.0.6-node24.13.0-alpine3.23
    PlaywrightDockerBaseImage: playwright:1.58.0-noble
    Scripts:
      Test: affected:test:ci        # Jest unit tests for affected packages
      Build: build:ci:parallel       # Parallel Lerna builds
      Lint: affected:lint:ci         # ESLint for affected packages
      Analytics: analytics           # Coverage and usage analytics
      BuildStorybook: build-docs     # Storybook static site
      BuildSanity: build:sanity:ci:parallel  # Fast sanity builds
```

**Workflow Triggers:**

```yaml
AutoTrigger:
  - Branch: master              # Standard releases
  - BranchPattern: ^release/.+$ # Hotfix releases (PUBLISH_HOTFIX: true)
```

**Scheduled Jobs:**

- **Analytics** — Runs every Monday, publishes coverage and usage reports.
- **Storybook Tests** — Runs weekdays at 10:30pm PDT with all test types enabled (visual, interaction, a11y).
- **S3 Cleanup** — Weekly cleanup of old Storybook releases, keeping latest 5 per major version.
- **S3 Lifecycle Policy** — Automatic cleanup of experimental and premajor builds.

**Build Process:**

1. `yarn install` with frozen lockfile in Docker container.
2. `yarn typecheck:ci` — TypeScript type checking across all packages.
3. `affected:lint:ci` — ESLint only on affected packages (Nx dependency graph).
4. `affected:test:ci` — Jest tests only on affected packages with coverage.
5. `build:ci:parallel` — Parallel Lerna builds for all publishable packages.
6. `build-docs` — Storybook static site generation.

**Publishing:**

Lerna independent versioning means each package has its own semver. Packages are published to CSOD's Artifactory npm registry. Conventional commits with Commitizen drive version bumps.

**Pre-Commit Hooks (Husky + lint-staged):**

```javascript
// .lintstagedrc.js
// Runs on staged files:
// - Prettier formatting for *.{js,jsx,ts,tsx,json,md,mdx}
// - ESLint fix for *.{js,jsx,ts,tsx}
// - Snapshot updates for affected packages
// - Version bump prevention in package.json files
```

**Additional Files Auto-Committed:**

The CI pipeline auto-commits generated files: `typedocs.md` per package, `Guidelines.md`, and `llms.txt`.

---

## Q14. How do you handle session management and security?

**Answer:**

Flare's session management handles two concurrent session types in the CSOD platform:

**Dual Session Architecture:**

1. **Monolith session cookie** — Configurable TTL per corp/portal (e.g., 240 minutes for Galaxy).
2. **JWT for service calls** — Configurable TTL, capped at 60 minutes.

Some portals have significantly lower TTLs based on security requirements.

**Session Renewal Flow:**

```
bootstrap() → setupSessionRenewal()
  → startPromptRenewSessionConfirmationTimeout()  // based on JWT TTL
  → startRefreshUserTokenInterval()                // every 5 minutes
  → applyActiveUserTracking()                      // 9 event types, throttled to 5s
```

**Active User Tracking:**

Nine DOM events are monitored to detect user activity: `keypress`, `keydown`, `click`, `contextmenu`, `dblclick`, `mousemove`, `scroll`, `touchmove`, `touchstart`. The handler is throttled to once per 5 seconds to avoid performance impact:

```typescript
const eventHandler = throttle(() => {
  if (window.csod) { window.csod.lastEventDate = new Date(); }
}, 5000);
```

**Token Refresh:**

Every 5 minutes, if user activity is detected (`lastEventDate > lastSessionRenewal`), the session is refreshed via POST to `services/x/session/v1/session/refresh`. The response token updates `window.csod.context.token`.

**JWT TTL Extraction:**

The system decodes the JWT to extract the actual expiry time, rather than relying on a fixed constant:

```typescript
const getTokenTTL = (token?: string): number => {
  const decoded = decodeJWT(token);
  // Supports both standard 'exp' claim and custom timestamp formats (YYYYMMDDHHMMSSfff)
  // Returns TTL in milliseconds minus grace period
};
```

**Session Expiry Prompt:**

When the token is about to expire, users see a confirmation dialog. If they confirm within the grace period (5 minutes), the session is refreshed. If they decline or the grace period expires, they're redirected to the logout or timeout URL.

**XSS Protection:**

`dompurify` (v3.4.0) is a dependency for sanitising user-generated HTML content, particularly in the Rich Text Editor component.

**Auth Header Management:**

The `CsodHttpClient` automatically detects token changes between requests and rebuilds its base headers, ensuring stale tokens aren't used after a refresh.

---

## Q15. How do you approach component design patterns in React?

**Answer:**

Flare uses several React patterns consistently:

**1. Compound Components:**

Complex components like `Tabs`, `Accordion`, and `DataGrid` use the compound component pattern. The `DataGrid` accepts either a pre-configured `table` instance or raw `DataGridProps`:

```typescript
export type DataGridOrTableInstanceProps<TData> = Xor<
  { table: DataGridTableInstance<TData> },  // pre-configured
  DataGridProps<TData>                       // raw props
>;

export const DataGrid = <TData extends DataGridRowData>(props: DataGridOrTableInstanceProps<TData>) => {
  let table: DataGridTableInstance<TData>;
  if (isTableInstanceProp(props)) {
    table = props.table;
  } else {
    table = useDataGrid(props);  // create instance from props
  }
  // ... render with DndProvider, TablePaper, LiveAnnouncer
};
```

**2. Provider + Hook Pattern:**

Every cross-cutting concern follows the Provider + Hook pattern:
- `ThemeProvider` → `useTheme()`
- `LocalizationProvider` → `useLocalizations()`, `useLocalizationsDefaults()`
- `DirectionProvider` → `useDirection()`
- `AmplitudeProvider` → `useAmplitude()`
- `GlobalContextProvider` → `useCSODContext()`
- `LiveAnnouncerProvider` → `LiveAnnouncerContext`
- `GlobalizationProvider` → `useCulture()`

**3. Headless Hook Pattern:**

The `useDataGrid` hook encapsulates all table logic (sorting, filtering, pagination, selection, virtualisation) and returns a `DataGridTableInstance`. The `DataGrid` component is just a thin rendering layer over this hook. Consumers can use the hook directly for custom table UIs.

**4. Singleton Pattern:**

The `AIAssistGlobal` class uses a classic singleton for triggering AI assist from outside React:

```typescript
export class AIAssistGlobal {
  private static instance: AIAssistGlobal;
  public static getInstance(): AIAssistGlobal {
    if (!AIAssistGlobal.instance) { AIAssistGlobal.instance = new AIAssistGlobal(); }
    return AIAssistGlobal.instance;
  }
  // Exposes: triggerAssist(), closeAssist(), toggleAssist(), triggerWithPrompt()
}
// Mounted on window for external access:
(window as any).FlareAIAssist = aiAssistGlobal;
```

**5. Controlled/Uncontrolled Pattern:**

Form components support both controlled (value + onChange) and uncontrolled (defaultValue + ref) modes. The `react-hook-form` integration in `@flare/learning` uses `useController()` to bridge Flare primitives with form state.

**6. Generic Components:**

The `DataGrid` and service clients use TypeScript generics for type-safe data handling:

```typescript
export const DataGrid = <TData extends DataGridRowData>(props: DataGridOrTableInstanceProps<TData>) => { ... };
export class CsodHttpClient { get<TResponse>(url: string, config?): Promise<FetchResponse<TResponse>> { ... } }
```

**7. Composition over Inheritance:**

The `CoreProvider` composes six providers rather than using a single monolithic provider. Each provider is independently usable and testable.


---

## Q16. How do you handle analytics and observability in the front-end?

**Answer:**

Flare has a dual analytics system: **Amplitude** for product analytics and **Splunk** for operational logging.

**Amplitude Integration:**

The `AmplitudeProvider` initialises the Amplitude SDK with user properties derived from the CSOD context:

```typescript
function initializeAmplitude(enableLocalhostTracking: boolean) {
  const userId = sha256(`${context.corp.toLowerCase()}${context.user}`).toString().toUpperCase();
  amplitude.getInstance().init(apiKey, userId, amplitudeConfig, (client) => {
    client.setVersionName(context.version);
    client.setOptOut(isDevelopment && !enableLocalhostTracking);
    client.setUserProperties({
      "Local Language": context.cultureName,
      corp: context.trackerSettings.anonymizePortalName
        ? sha256(context.corp.toLowerCase()).toString().toUpperCase()
        : context.corp.toLowerCase(),
      correlation: context.correlation,
      cultureID: context.cultureID,
      cultureName: context.cultureName,
      timezone: context.timezone,
    });
  });
}
```

Key design decisions:
- **User ID hashing** — SHA-256 hash of `corp + userId` for privacy.
- **Portal name anonymisation** — Configurable per corp via `trackerSettings.anonymizePortalName`.
- **Development opt-out** — Analytics disabled in dev unless explicitly enabled.
- **Tracker Proxy** — A `TrackerProxyApi` routes analytics data through CSOD's proxy to avoid ad-blocker interference. The `isTrackerProxyEnabled` setting is fetched from corp configuration.

Components access the Amplitude client via `useAmplitude()` hook and track events throughout the component lifecycle.

**Operational Logging:**

The `logger` from `@flare/core-utils/logging` provides five severity levels (`debug`, `info`, `warn`, `error`, `fatal`) and sends to both Splunk and console simultaneously via adapter pattern. The `monitor` field on log config enables Splunk alerting for critical errors.

**Coverage Analytics:**

The CI pipeline generates coverage reports via `coverage:overview` and `coverage:merge` scripts. A coverage overview dashboard is available in Storybook. Scheduled analytics jobs run weekly to track coverage trends.

---

## Q17. How does the platform handle navigation and routing patterns?

**Answer:**

As a design system library, Flare doesn't impose a routing solution — consuming applications choose their own (React Router, Next.js, etc.). Instead, Flare provides navigation **components** that integrate with any routing approach.

**Global Navigation:**

The `GlobalNavigation` component from `@flare/patterns` provides the application shell chrome:

```typescript
export const GlobalNavigation = ({
  logo, actions, profileMenu, tabs, mobileProfileHeader, ...
}) => { ... };
```

It includes:
- **NavLogo** — Branding with click handler for SPA navigation.
- **NavMenuBar** — Top-level navigation tabs.
- **NavDrillMenu** — Mobile drill-down navigation.
- **NavProfileMenu** — User profile dropdown with initials derivation.
- **NavActionButton** — Action buttons with popover support.

**Breadcrumbs:**

The `Breadcrumbs` component renders a navigation trail. It's data-driven — consuming apps provide the breadcrumb items based on their routing state.

**Column Navigation Bar:**

`ColumnNavigationBar` provides a sidebar navigation pattern for hierarchical content.

**Navigation Menu:**

`NavigationMenu` provides a flexible menu component that supports nested items, icons, and keyboard navigation.

**Integration Pattern:**

Navigation components expose `onClick` handlers rather than `href` attributes, allowing SPA frameworks to handle navigation without full page reloads:

```typescript
<NavLogo onClick={() => router.push('/')} />
<NavMenuBar items={menuItems.map(item => ({ ...item, onClick: () => router.push(item.path) }))} />
```

---

## Q18. How do you handle form management and validation?

**Answer:**

Flare provides form **primitives** in `@flare/primitives` and form **integration** patterns in domain packages.

**Primitive Form Components:**

80+ components include form-specific primitives: `TextField`, `TextArea`, `Checkbox`, `RadioButton`, `ToggleSwitch`, `NativeSelector`, `Dropdown`, `Autocomplete`, `DatePicker`, `TimeInput`, `NumberInput`, `RangeSlider`, `StarRating`, `FileUploader`, `RichTextEditor`, `TagsInput`, and `SearchFilter`.

Each component supports:
- Controlled and uncontrolled modes.
- Error state with inline messages.
- Disabled and read-only states.
- ARIA attributes for accessibility.
- Localised labels via `useLocalizations()`.

**react-hook-form Integration:**

Domain packages like `@flare/learning` demonstrate the form integration pattern. The Question Builder uses `react-hook-form` (v7.56) with typed form controls that wrap Flare primitives:

```typescript
// FormInput — wraps TextField with useController
type FormInputProps<T extends FieldValues> = Omit<TextFieldProps, 'value' | 'onChange'> & UseControllerProps<T>;

// FormSelect — wraps Dropdown with useController
// FormCheckbox — wraps Checkbox with useController
// FormRadioGroup — wraps RadioButton group with useController
// FormToggleSwitch — wraps ToggleSwitch with useController
// FormRichTextEditor — wraps RichTextEditor with useController
// FormTextArea — wraps TextArea with useController
// FormSelectableDropdown — wraps SelectableDropdown with useController
// FormNumberInput — wraps NumberInput with useController
```

**Form Architecture:**

```typescript
// Top-level form with FormProvider
const CreateQuestion = () => {
  const methods = useForm({ defaultValues, mode: 'onChange' });
  return (
    <FormProvider {...methods}>
      <QuestionSection />      {/* uses useFormContext() */}
      <AnswerRenderer />       {/* uses useFieldArray() for dynamic answers */}
      <AdvancedSettings />     {/* uses useWatch() for reactive fields */}
    </FormProvider>
  );
};
```

**Validation:**

- Declarative rules via react-hook-form's `register()` and `useController()`.
- Custom validation functions for complex business rules.
- Error flattening utility that walks nested `FieldErrors` into a flat `ValidationError[]` array.
- Real-time validation feedback via `mode: 'onChange'`.

---

## Q19. How does the platform integrate AI capabilities?

**Answer:**

Flare has a comprehensive AI integration layer via `@flare/patterns/ai-assist`:

**Architecture:**

The AI Assist system has three layers:
- **`ai-core`** — Core AI service integration (Flowise streaming, prompt handling).
- **`ai-blocks`** — Reusable AI UI building blocks (chat messages, input, feedback).
- **`ai-surfaces`** — Surface-level components (contextual panel, FAB, overlay).
- **`ai-assist`** — Orchestration layer combining blocks and surfaces.

**Global Singleton — AIAssistGlobal:**

A singleton class allows triggering AI assist from anywhere, including non-React code:

```typescript
export class AIAssistGlobal {
  private static instance: AIAssistGlobal;
  private handlers: { openAssist?, closeAssist?, setInputValue?, submitPrompt?, getIsOpen? } = {};

  public static getInstance(): AIAssistGlobal { ... }

  public initialize(handlers): void {
    this.handlers = handlers;
    this.isInitialized = true;
  }

  public triggerAssist(options?: { context?, variant?: "overlay" | "in-page" }): void { ... }
  public closeAssist(): void { ... }
  public toggleAssist(options?): void { ... }
  public triggerWithPrompt(prompt: string, options?): void {
    this.handlers.openAssist?.(options);
    this.handlers.setInputValue?.(prompt);
    setTimeout(() => { this.handlers.submitPrompt?.(prompt); }, 0);
  }
}

// Exposed globally for external access
(window as any).FlareAIAssist = aiAssistGlobal;
```

**Key Design Decisions:**

- **Singleton + React bridge** — The singleton is initialised by the React provider with handler functions, bridging imperative (window-level) and declarative (React) worlds.
- **setTimeout for prompt submission** — Ensures the panel is open before submitting, avoiding race conditions.
- **Multiple surface types** — `overlay` (floating panel) and `in-page` (embedded) variants.
- **Storybook Integration** — `GlobalAIAssistDecorator` wraps all stories, enabling AI assist during component development.
- **Multiple agent types** — Engineering, Design, JIRA, and General agents for different use cases.
- **Feedback collection** — Built-in feedback system for improving AI responses.
- **Error boundary** — `FlareGPTErrorBoundary` prevents AI failures from crashing the host application.

---

## Q20. What would be your 90-day plan as Frontend Architect for this platform?

**Answer:**

**Days 1–30: Assess and Align**

- Deep-dive into the Flare codebase — understand package boundaries, build pipeline, and pain points across consuming teams.
- Audit current testing coverage: unit test coverage per package, visual regression baseline completeness, and a11y test coverage.
- Profile bundle sizes per package and identify tree-shaking opportunities.
- Review the `window.csod.context` global dependency — assess migration path toward a more React-idiomatic approach.
- Meet with each product team (Learning, Core HR, Performance, Recruiting, PXP) to understand their Flare adoption challenges.

**Days 31–60: Strategy and Quick Wins**

- Publish a front-end technical vision document covering: React 19 migration strategy, testing standards, accessibility compliance targets, and design token evolution.
- Introduce React Server Components evaluation for applicable patterns (the codebase is already on React 19.2).
- Establish performance budgets per package with automated bundle size tracking in CI.
- Migrate the theme system from JavaScript objects to CSS custom properties for runtime theming without re-renders — the current `getTheme()` approach requires a React re-render to change themes.
- Run workshops on: React 19 features (use(), Actions), testing with Testing Library best practices, and accessibility testing with screen readers.

**Days 61–90: Scale and Enable**

- Roll out a shared `@flare/data-fetching` package with React Query or SWR to replace ad-hoc `useEffect` + `useState` data fetching patterns, adding caching, deduplication, and optimistic updates.
- Establish a design-to-code workflow with Figma token sync (the `@figma/code-connect` dependency is already present).
- Create reference implementations for common patterns (CRUD page, form wizard, dashboard) that product teams can clone.
- Set up a front-end architecture decision record (ADR) process.
- Evaluate replacing styled-components with a zero-runtime CSS solution (Vanilla Extract, Panda CSS) for better performance — styled-components v5 has known runtime overhead.

---

## Bonus: Key Numbers to Remember

| Metric | Value |
|---|---|
| UI Components (Primitives) | 80+ |
| Published Packages | 12+ |
| React Version | 19.2.x |
| Storybook Version | 10.2.x |
| Node Version | 24.13.0+ |
| Supported Locales (Globalization) | 63 |
| HTTP Client Types | 4 (CsodHttp, PxpHttp, CsodGraphQL, PxpGraphQL) |
| Context Providers in CoreProvider | 7 |
| Session Refresh Interval | 5 minutes |
| Activity Tracking Events | 9 DOM events, throttled to 5s |
| Default Retry Status Codes | 1xx, 429, 5xx |
| Visual Regression Threshold | 1% SSIM |
| Test Runners | 2 (Jest for unit, Vitest+Playwright for Storybook) |
| CI Scheduled Jobs | 4 (analytics, storybook tests, S3 cleanup, S3 lifecycle) |
| Accessibility Hooks | 6+ (LiveAnnouncer, ScreenReaderOnly, callbackOnEsc, etc.) |
| Form Control Wrappers | 10 (Input, Select, Checkbox, Radio, Toggle, RTE, TextArea, etc.) |
| AI Agent Types | 4 (Engineering, Design, JIRA, General) |
| Logging Adapters | 2 (Splunk, Console) |
| MFE Communication Events | 3 (Refresh, Success, Error) |
