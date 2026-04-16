# State Management in Torque — Deep Dive

## Block Diagram — How Everything Connects

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ANGULAR COMPONENTS                               │
│                                                                         │
│   ┌──────────────────┐  ┌──────────────┐  ┌─────────────────────┐      │
│   │ FrameworkBody     │  │ Header       │  │ Sidenav             │      │
│   │ Component         │  │ Component    │  │ Component           │      │
│   └────────┬─────────┘  └──────┬───────┘  └──────────┬──────────┘      │
│            │ reads               │ reads               │ reads          │
│            │ bodyConfig          │ branding$            │ sideNavItems$  │
│            │                     │                      │                │
│            │ calls               │ calls                │ calls          │
│            │ toggleSideNav()     │ refreshNav()         │ toggleSideNav()│
│            └─────────┬───────────┴──────────┬───────────┘                │
│                      │                      │                            │
│                      ▼                      ▼                            │
└─────────────────────────────────────────────────────────────────────────┘
                       │                      │
                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FACADE (TrqFrameworkFacade)                          │
│                                                                         │
│   ┌─ READING STATE (Observables) ────────────────────────────────────┐  │
│   │                                                                   │  │
│   │  isSmallScreen$  ←── store.select(selector).pipe(shareReplay)    │  │
│   │  primaryNavItems$ ←── store.select(selector).pipe(shareReplay)   │  │
│   │  branding$  ←── combineLatest([8 observables]).pipe(map, share)  │  │
│   │  body$  ←── combineLatest([24 observables]).pipe(map, share)     │  │
│   │                                                                   │  │
│   └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─ WRITING STATE (Dispatch methods) ───────────────────────────────┐  │
│   │                                                                   │  │
│   │  refreshNav(data)  →  store.dispatch(new RefreshNavAction(data)) │  │
│   │  toggleSideNav(v)  →  store.dispatch(new ToggleSideNav(v))       │  │
│   │  updateSetting(s)  →  store.dispatch(new UpdateSettingAction(s)) │  │
│   │                                                                   │  │
│   └───────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        NgRx STORE                                       │
│                                                                         │
│   store.dispatch(action)          store.select(selector)                │
│          │                                 ▲                            │
│          ▼                                 │                            │
│   ┌─────────────┐                  ┌───────────────┐                   │
│   │   ACTIONS    │                  │   SELECTORS   │                   │
│   │              │                  │               │                   │
│   │ RefreshNav   │                  │ getNavData    │                   │
│   │ ToggleSideNav│                  │ isSmallScreen │                   │
│   │ UpdateSetting│                  │ getPrimaryNav │                   │
│   │ MergeChildren│                  │ getSideNav    │                   │
│   │ UpdateBread. │                  │ getBreadcrumb │                   │
│   └──────┬──────┘                  └───────▲───────┘                   │
│          │                                 │                            │
│          ▼                                 │ reads from                 │
│   ┌─────────────────────────────────────────────────┐                  │
│   │              REDUCERS                            │                  │
│   │                                                  │                  │
│   │  ┌─────────────────┐   ┌──────────────────┐    │                  │
│   │  │  navReducer      │   │  settingReducer   │    │                  │
│   │  │                  │   │                   │    │                  │
│   │  │  State:          │   │  State:           │    │                  │
│   │  │  - nav.data      │   │  - setting.tileNav│    │                  │
│   │  │  - nav.rootNode  │   │  - setting.lang   │    │                  │
│   │  │  - nav.breadcrumb│   │  - setting.sticky │    │                  │
│   │  │  - nav.activeRoute│  │  - setting.embedded│   │                  │
│   │  │  - nav.collapsed │   │  - setting.title  │    │                  │
│   │  │  - nav.toc       │   │  - ... 20+ more   │    │                  │
│   │  └─────────────────┘   └──────────────────┘    │                  │
│   │                                                  │                  │
│   │  Combined under feature key: "framework"         │                  │
│   └──────────────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## The Full Flow — Step by Step

### Flow 1: Reading state (data flowing UP to components)

```
navReducer state
       │
       ▼
Selector: getPrimaryNavItemsFactory(sortedNav)
       │  (memoized — only recalculates when nav state changes)
       ▼
Root Selector: createSelector(selectFrameworkNavState, childSelector)
       │  (wraps child selector to work from global store root)
       ▼
Facade: primaryNavItems$ = store.select(rootSelector).pipe(shareReplay)
       │  (caches last value, shares across subscribers)
       ▼
Facade: body$ = combineLatest([primaryNavItems$, ...23 others]).pipe(map)
       │  (combines into one TrqFrameworkFacadeBodyConfig object)
       ▼
Component: facade.body$.pipe(takeUntil(destroy$)).subscribe(config => this.bodyConfig = config)
       │
       ▼
Template: bodyConfig.iaPrimarynavItems → renders the nav menu
```

### Flow 2: Writing state (user action flowing DOWN to store)

```
User clicks "collapse sidenav" button
       │
       ▼
Component: this.frameworkFacade.toggleSideNav(true)
       │
       ▼
Facade: this._store.dispatch(new ToggleSideNav(true))
       │
       ▼
NgRx Store receives action: { type: '[Framework] TOGGLE_SIDE_NAV', payload: true }
       │
       ▼
navReducer: case TOGGLE_SIDE_NAV → returns { nav: { ...state.nav, sideNavCollapsed: true } }
       │  (new state object created — immutable update)
       ▼
All selectors that depend on sideNavCollapsed re-evaluate:
  - isSideNavCollapsed selector recalculates
  - getSideNavItems selector stays the same (not affected)
       │
       ▼
Facade: isSideNavCollapsed$ emits new value
       │
       ▼
Facade: body$ re-emits (because one of its 24 inputs changed)
       │
       ▼
Component: bodyConfig updates → template re-renders sidenav as collapsed
```

### Flow 3: Navigation data loading (app startup)

```
App bootstraps → API returns navigation JSON:
  { id: "root", childItems: [
      { id: "payroll", displayName: "Payroll", childItems: [...] },
      { id: "learning", displayName: "Learning", childItems: [...] }
  ]}
       │
       ▼
Host app calls: facade.refreshNav(navJsonFromApi)
       │
       ▼
Facade dispatches: new RefreshNavAction(navJson)
       │
       ▼
navReducer: case REFRESH_NAV →
  1. Stores raw data: state.nav.data = navJson
  2. Parses into tree: state.nav.rootNode = TreeModel.parse(navJson)
     (TreeModel gives each node: .children, .first(), .all(), .getPath())
       │
       ▼
Selectors recalculate:
  - getPrimaryNodes → root's children → [payroll, learning]
  - getPrimaryNavItemsFactory → maps nodes, finds default selected child for each
  - getSearchableNavItems → flattens tree to leaf nodes (for search)
       │
       ▼
User navigates to /payroll/run-payroll
       │
       ▼
Router event triggers: facade.updateBreadcrumbForRoute('/payroll/run-payroll')
       │
       ▼
navReducer: case UPDATE_BREADCRUMB_FOR_ROUTE →
  1. Walks the tree to find node with href matching the route
  2. Gets the path from root to that node: [root, payroll, run-payroll]
  3. Stores as breadcrumbNodes
       │
       ▼
Selectors recalculate:
  - getBreadcrumbSubNavNode → payroll node (level 2) → its children become sub-nav
  - getBreadcrumbSideNavNode → run-payroll node (level 3) → its children become side-nav
  - getPrimaryNavItemActive → payroll (highlights in top nav)
  - getBreadcrumbNavItems → [root, payroll, run-payroll] (breadcrumb trail)
       │
       ▼
All facade observables emit → body$ recombines → component renders:
  - Header highlights "Payroll"
  - Sub-nav shows payroll sub-sections
  - Side-nav shows run-payroll children
  - Breadcrumb shows: Home > Payroll > Run Payroll
```

---

## The Big Picture

Torque's framework layer uses NgRx for managing the application shell state (navigation, settings). The pattern is:

```
Component → Facade (service) → NgRx Store → Reducers → Selectors → back to Facade → Component
```

Components never talk to the NgRx store directly. They go through a **Facade** service that hides all the NgRx complexity.

---

## Layer 1: The State Shape

Two reducers, combined under a `framework` feature key:

```typescript
// reducers/index.ts
interface FrameworkState {
  nav: NavState;
  setting: SettingState;
}
```

### Setting State — flat key-value config

```typescript
// reducers/setting.ts
interface State {
  setting: {
    tileNav: true,
    stickyHeader: true,
    newHeader: true,
    title: 'Torque',
    iconKey: 'torque',
    lang: 'en',
    sortedNav: true,
    embedded: false,
    fullscreen: false,
    smallScreen: false,
    overlayNav: false,
    primaryNavEnabled: true,
    inverseSidenavHierarchy: true,
    // ... 20+ more settings
  }
}
```

This is basically a config bag. One action (`UPDATE_SETTING`) merges new values in:

```typescript
function settingReducer(state, action) {
  case UPDATE_SETTING:
    return { setting: Object.assign({}, state.setting, action.payload) };
}
```

Simple. No complex logic. Just a merge.

### Nav State — tree-based navigation

This is the complex one:

```typescript
// reducers/nav.ts
interface State {
  nav: {
    data: TrqFrameworkSettingsNavItem;   // raw nested JSON from API
    rootNode?: NavNode;                   // parsed tree (via TreeModel library)
    breadcrumbNodes?: NavNode[];          // path from root to active node
    activeRoute?: string;                 // current URL
    subNavEnabled?: boolean;
    sideNavCollapsed?: boolean | null;
    toc?: TrqTOCState;                   // table of contents
  }
}
```

The nav data comes in as a nested JSON structure (menu items with `childItems`). The reducer parses it into a tree using the `TreeModel` library, which gives you methods like `node.first()`, `node.all()`, `node.getPath()`.

Seven actions handle nav state:

| Action | What it does |
|---|---|
| `REFRESH_NAV` | Replaces entire nav tree |
| `REFRESH_NAV_BY_ID` | Updates a specific top-level nav node |
| `MERGE_NAV_CHILDREN` | Merges children into an existing nav node |
| `UPDATE_BREADCRUMB_FOR_ROUTE` | Recalculates breadcrumb path for current URL |
| `TOGGLE_SUB_NAV` | Shows/hides sub-navigation |
| `TOGGLE_SIDE_NAV` | Collapses/expands side navigation |
| `TOGGLE_TOC` | Updates table of contents |

---

## Layer 2: Selectors — Deriving UI State from Raw State

This is where the real complexity lives. The nav reducer has 30+ selectors that derive UI-ready data from the tree:

```typescript
// "Give me the primary nav items (top-level menu)"
getPrimaryNavItemsFactory(sortedNav) = createSelector(
  getPrimaryNodes,    // children of root node
  nodes => nodes.map(node => {
    // For each primary item, find its default selected child
    if (hasChildren(node)) {
      node.model.defaultSelectedHref = getDefaultSelectedForNode(node, sortedNav).href;
    }
    return node.model;
  })
);

// "Give me the side nav items (based on where I am in the tree)"
getSideNavItems = createSelector(
  getBreadcrumbSideNavNode,   // figure out which node's children are the sidenav
  getVisibleChildrenData      // get visible children
);

// "Is the sidenav collapsed?"
isSideNavCollapsed = createSelector(
  state => state.nav.sideNavCollapsed,
  hasSideNavItems,
  isOverlayNavNode,
  (collapsed, hasItems, overlay) => hasItems ? !!(overlay || collapsed) : null
);
```

The selectors are **memoized** — they only recompute when their inputs change. This is critical for performance because the body component subscribes to 24 observables simultaneously.

### The Root Reducer Index (`reducers/index.ts`)

This file does two things:
1. Combines nav + setting reducers under the `framework` feature key
2. Re-exports all selectors, wrapping child selectors with `createSelector(selectFrameworkState, childSelector)` so they work from the root state

```typescript
// Child selector only knows about its own state slice
fromNav.getNavData = (state: NavState) => state.nav.data;

// Root selector wraps it to work from the global store
export const getNavData = createSelector(
  selectFrameworkNavState,    // first, select the nav slice
  fromNav.getNavData          // then, apply the child selector
);
```

---

## Layer 3: The Facade — Hiding NgRx from Components

`TrqFrameworkFacade` is the only thing components interact with. It wraps the store completely.

### Reading state — Observable properties with shareReplay

```typescript
@Injectable()
class TrqFrameworkFacade {
  // Simple selectors → Observable properties
  isSmallScreen$ = this._store.select(fromFramework.isSmallScreen)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  isTileNav$ = this._store.select(fromFramework.isTileNav)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  primaryNavItems$ = this._store.select(fromFramework.getPrimaryNavItemsFactory(false))
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));
```

Every selector is wrapped with `shareReplay({ bufferSize: 1, refCount: true })`. This means:
- `bufferSize: 1` — cache the last emitted value so late subscribers get it immediately
- `refCount: true` — unsubscribe from the source when all subscribers leave (prevents memory leaks)

### Composed selectors — combining multiple streams

The facade also creates composed observables that combine multiple selectors:

```typescript
  // Combines 8 observables into one branding config object
  branding$ = combineLatest([
    this.brandingIconKey$,
    this.brandingTitle$,
    this.brandingLogoUrl$,
    this.brandingLogoDescription$,
    this.poweredByLogo$,
    this.poweredByLogoSize$,
    this.poweredByLogoDescription$,
    this.showPoweredByAndVersionInFooter$
  ]).pipe(
    map(([...values]) => ({ /* map to TrqFrameworkFacadeBrandingConfig */ })),
    shareReplay(SHARE_REPLAY_CONFIG)
  );

  // The big one — combines 24 observables into the full body config
  body$ = combineLatest([
    this.isTileNav$,
    this.isSmallScreen$,
    this.isStickyHeader$,
    this.isNewHeader$,
    this.subNavItems$,
    this.isEmbedded$,
    this.sideNavItems$,
    this.isFullScreen$,
    this.branding$,
    this.primaryNavItems$,
    this.primaryNavItemActive$,
    this.isOverlayNav$,
    this.visibleHeaderHeight$,
    this.visibleFooterHeight$,
    this.isSideNavCollapsed$,
    this.isSortedNav$,
    this.sortedSideNavItems$,
    this.navIcons$,
    this.TOC$,
    this.breadcrumbTriggerNavLength$,
    this.sortedPrimaryNavItems$,
    this.sortedSubNavItems$,
    this.primaryNavEnabled$,
    this.inverseSidenavHierarchy$
  ]).pipe(
    map(([...values]) => {
      // Derives computed properties like:
      // iaTile = isTileNav || isSmallScreen
      // iaHeaderSticky = isStickyHeader && !isSmallScreen
      // iaSubnavActive = subNavItems.length && !isSmallScreen && !isEmbedded
      return { /* TrqFrameworkFacadeBodyConfig */ };
    }),
    shareReplay(SHARE_REPLAY_CONFIG)
  );
```

This `body$` observable is the single stream that the body component subscribes to. It gets one object with everything it needs.

### Writing state — dispatch methods

```typescript
  // Simple wrappers around store.dispatch
  refreshNav(payload: TrqFrameworkSettingsNavItem): void {
    this._store.dispatch(new RefreshNavAction(payload));
  }

  toggleSideNav(collapsed: boolean | null): void {
    this._store.dispatch(new ToggleSideNav(collapsed));
  }

  updateSettingAction(payload: TrqFrameworkSetting): void {
    this._store.dispatch(new UpdateSettingAction(payload));
  }
```

Components call `facade.toggleSideNav(true)` — they never know about actions, reducers, or the store.

---

## Layer 4: Component Consumption

The body component (`TrqFrameworkBodyComponent`) consumes the facade:

```typescript
class TrqFrameworkBodyComponent implements OnInit, OnDestroy {
  bodyConfig: TrqFrameworkFacadeBodyConfig;
  private _destroy$ = new Subject<void>();

  constructor(public frameworkFacade: TrqFrameworkFacade) {}

  setState(): void {
    // Subscribe to the composed body$ observable
    this.frameworkFacade.body$
      .pipe(takeUntil(this._destroy$))
      .subscribe(config => {
        this.bodyConfig = config;
      });

    // Subscribe to breadcrumb items separately (with debounce)
    this.frameworkFacade.getBreadcrumbNavItems$
      .pipe(debounceTime(100), takeUntil(this._destroy$))
      .subscribe(navItems => {
        this.breadcrumbNavItems = navItems;
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
```

Key patterns:
- `takeUntil(this._destroy$)` — automatic unsubscription on component destroy
- `debounceTime(100)` on breadcrumbs — prevents rapid re-renders during navigation
- `bodyConfig` is a plain object, not an Observable — the template reads `bodyConfig.isSmallScreen` directly

---

## The Problems with This Approach

### 1. Boilerplate explosion
To add one new setting (say `darkMode`):
- Add it to `TrqFrameworkSetting` interface
- Add it to `initialState` in setting reducer
- Add a selector in `setting.ts`: `export const isDarkMode = settingFilterFactory('darkMode')`
- Re-export in `reducers/index.ts`: `export const isDarkMode = createSelector(selectSettingState, fromSetting.isDarkMode)`
- Add an Observable in the facade: `isDarkMode$ = this._store.select(fromFramework.isDarkMode).pipe(shareReplay(...))`
- Add it to the `body$` combineLatest (now 25 observables)
- Add it to the `TrqFrameworkFacadeBodyConfig` interface

That's 7 files touched for one boolean.

### 2. The 24-observable combineLatest
`body$` combines 24 streams. If ANY of them emits, the entire `body$` re-emits. This means the body component re-evaluates its template on every single state change, even if only one property changed.

### 3. Class-based actions (old NgRx pattern)
Torque uses the old class-based action pattern:
```typescript
class RefreshNavAction implements Action {
  readonly type = REFRESH_NAV;
  constructor(public payload: TrqFrameworkSettingsNavItem) {}
}
```
Modern NgRx uses `createAction()`:
```typescript
const refreshNav = createAction('[Framework] Refresh Nav', props<{ payload: TrqFrameworkSettingsNavItem }>());
```

### 4. Manual subscription management
Every component needs `_destroy$` + `takeUntil` + `ngOnDestroy`. Easy to forget, causes memory leaks.

---

## How Angular Signals Would Simplify This

Angular Signals (available since Angular 16, stable in 17+) could dramatically reduce this complexity.

### Replace the setting reducer with a signal-based service

```typescript
// Before: NgRx setting reducer + selectors + facade properties
// 3 files, ~150 lines

// After: Signal-based service
// 1 file, ~30 lines
@Injectable({ providedIn: 'root' })
class FrameworkSettingsService {
  // Writable signals for each setting
  readonly tileNav = signal(true);
  readonly stickyHeader = signal(true);
  readonly smallScreen = signal(false);
  readonly embedded = signal(false);
  readonly lang = signal('en');
  readonly sortedNav = signal(true);
  readonly primaryNavEnabled = signal(true);

  // Computed signals (replace NgRx selectors)
  readonly iaTile = computed(() => this.tileNav() || this.smallScreen());
  readonly iaHeaderSticky = computed(() => this.stickyHeader() && !this.smallScreen());

  // Bulk update (replaces UPDATE_SETTING action)
  updateSettings(settings: Partial<FrameworkSettings>): void {
    Object.entries(settings).forEach(([key, value]) => {
      if (this[key] && typeof this[key] === 'function') {
        this[key].set(value);
      }
    });
  }
}
```

### Replace the nav facade observables with computed signals

```typescript
// Before: 24-observable combineLatest in facade
// After: computed signal that auto-tracks dependencies

class FrameworkFacade {
  readonly bodyConfig = computed(() => ({
    iaTile: this.settings.iaTile(),
    iaHeaderSticky: this.settings.iaHeaderSticky(),
    iaSubnavActive: this.navService.subNavItems().length > 0
                    && !this.settings.smallScreen()
                    && !this.settings.embedded(),
    iaSidenavActive: this.navService.sideNavItems().length > 0
                     && !this.settings.smallScreen()
                     && !this.settings.embedded(),
    // ... rest of config
  }));
}
```

### Replace subscriptions in components with signal reads

```typescript
// Before: manual subscription + takeUntil + ngOnDestroy
class BodyComponent implements OnInit, OnDestroy {
  bodyConfig: BodyConfig;
  private _destroy$ = new Subject<void>();

  ngOnInit() {
    this.facade.body$.pipe(takeUntil(this._destroy$)).subscribe(c => this.bodyConfig = c);
  }
  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}

// After: just read the signal in the template
@Component({
  template: `
    @if (facade.bodyConfig().iaTile) {
      <tile-nav />
    }
    @if (facade.bodyConfig().iaSubnavActive) {
      <sub-nav />
    }
  `
})
class BodyComponent {
  constructor(public facade: FrameworkFacade) {}
  // No subscriptions. No destroy. No takeUntil. No memory leaks.
}
```

### Key benefits of signals for this codebase:

| Problem | NgRx + Facade (current) | Signals |
|---|---|---|
| Adding a new setting | 7 files touched | 1 line: `readonly darkMode = signal(false)` |
| Derived state | `createSelector` + re-export chain | `computed(() => ...)` — auto-tracks deps |
| Subscription management | Manual `takeUntil` + `ngOnDestroy` | None — signals are synchronous reads |
| 24-stream combineLatest | Re-emits on ANY change | `computed` only re-evaluates when accessed deps change |
| Template binding | `{{ bodyConfig.isSmallScreen }}` (after subscribe) | `{{ facade.bodyConfig().isSmallScreen }}` (direct) |
| Debugging | Redux DevTools, action log | Simple `console.log(signal())` |
| Bundle size | `@ngrx/store` + `@ngrx/effects` + `@ngrx/store-devtools` | Zero extra dependencies — signals are built into Angular |

### Where NgRx still makes sense:

Signals don't replace NgRx for everything. NgRx is still valuable when you need:
- **Action logging / time-travel debugging** — Redux DevTools
- **Side effects** — NgRx Effects for complex async workflows (API calls triggered by state changes)
- **Undo/redo** — action history makes this trivial
- **Cross-module communication** — actions as a pub/sub mechanism between lazy-loaded modules

For Torque's framework layer specifically, the state is mostly synchronous config + a navigation tree. There are no effects, no async workflows, no undo/redo. Signals would be a cleaner fit.

### Migration path:

You wouldn't rewrite everything at once. The facade pattern actually makes migration easier:

1. Keep the facade interface unchanged.
2. Replace the internal implementation from NgRx selectors to signals.
3. Expose signals alongside observables: `isSmallScreen = toSignal(this._store.select(...))`.
4. Gradually move components from `| async` pipe to direct signal reads.
5. Once all consumers use signals, remove the NgRx store.

The facade is the abstraction boundary — components don't care what's behind it.
