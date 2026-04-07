# Fero — Architecture Overview (10-Minute Interview Guide)

## What is Fero?

Fero is an **enterprise-grade Angular UI platform** built by the engineering team.
It's a monorepo housing **80+ reusable components**, a full application shell framework, platform services, design tokens, and a parallel **Web Components** layer — all serving multiple product lines with **10+ themes**, **RTL support**, and **deep accessibility** baked in.

**Tech Stack:** Angular 20 · TypeScript 5.9 · Nx 21 · NgRx · Lit (Web Components) · SCSS/SMACSS · Karma/Jasmine · Storybook 8

---

## Directory Structure

```
fero/                                    # Nx Monorepo Root
│
├── apps/                                  # ── Applications ──────────────────
│   ├── playground/                        # Full dev/demo app (port 4200)
│   ├── sandbox/                           # Lightweight single-component dev env
│   ├── play-framework/                    # Framework-specific playground
│   └── storybook/                         # Storybook documentation app
│
├── libs/                                  # ── Libraries (the core of Fero) ─
│   │
│   ├── core/                              # @fero/core
│   │   ├── cdk/                           #   └─ CDK: a11y, pipes, operators
│   │   │   └── src/lib/
│   │   │       ├── a11y/                  #       ├─ FocusKeyManager, TabTrap,
│   │   │       │   ├── hotkey/            #       │  Hotkey, AriaList, Tooltip,
│   │   │       │   ├── tab-trap/          #       │  FocusableItem, KeyboardSelect
│   │   │       │   └── ...                #       │
│   │   │       ├── pipes/                 #       ├─ cast, memoize, safe pipes
│   │   │       └── operators/             #       └─ skipRouterEvents
│   │   │
│   │   ├── platform/                      #   └─ Platform Services
│   │   │   └── src/lib/
│   │   │       ├── i18n/                  #       ├─ i18n (ngx-translate based)
│   │   │       ├── cache/                 #       ├─ Caching (local/session/memory)
│   │   │       ├── configuration/         #       ├─ Config providers + validators
│   │   │       ├── http/                  #       ├─ HTTP interceptors (base, cache, in-flight, logging)
│   │   │       ├── logging/               #       ├─ Logger with appenders
│   │   │       ├── feature-toggle/        #       ├─ Feature flags (directive + guard)
│   │   │       ├── error/                 #       ├─ Global error handler
│   │   │       ├── navigation/            #       ├─ Navigation service
│   │   │       ├── dynamic-component-loader/ #    ├─ Lazy component loading
│   │   │       ├── dynamic-page/          #       ├─ Dynamic page composition
│   │   │       ├── services/a11y/         #       ├─ AriaService, LiveAnnouncer
│   │   │       ├── services/scrolling/    #       ├─ ScrollingService, DragScroll
│   │   │       ├── mock-backend/          #       ├─ Mock interceptor for dev
│   │   │       └── title/                 #       └─ Page title service
│   │   │
│   │   └── utils/                         #   └─ Pure Utilities
│   │       └── src/lib/
│   │           ├── color/                 #       ├─ Color manipulation
│   │           ├── datetime/              #       ├─ Date builder, time units
│   │           ├── dom/                   #       ├─ DOM, event, selector utils
│   │           ├── data/                  #       ├─ Paging, sorting
│   │           ├── http/                  #       ├─ Headers, status codes
│   │           ├── search/                #       ├─ Search utilities
│   │           ├── responsive/            #       ├─ Grid utilities
│   │           └── format/                #       └─ Formatting helpers
│   │
│   ├── ui/                                # @fero/ui — 60+ UI Components
│   │   ├── accordion/                     #   Each folder = secondary entry point
│   │   ├── alert/                         #   e.g. import from '@fero/ui/alert'
│   │   ├── badge/
│   │   ├── breadcrumb/
│   │   ├── button/
│   │   ├── button-group/
│   │   ├── card/
│   │   ├── carousel/
│   │   ├── chip/
│   │   ├── datagrid/                      #   ★ Complex: virtual scroll, a11y,
│   │   │   └── src/lib/                   #     column picker, row selection,
│   │   │       ├── datagrid.component.ts  #     paging, sorting, refresh
│   │   │       ├── datagrid-virtual/
│   │   │       ├── directive/datagrid-a11y.directive.ts
│   │   │       └── partials/             #     column, footer, row-detail
│   │   ├── dropdown/
│   │   ├── flyout/
│   │   ├── modal/
│   │   ├── sidebar/
│   │   ├── stepper/
│   │   ├── tabs/
│   │   ├── toast/
│   │   ├── tree-view/
│   │   ├── virtual-scroll/
│   │   ├── visualization/                #   D3-based charts/maps
│   │   ├── services/                      #   Shared UI services
│   │   ├── shared/                        #   Shared UI utilities
│   │   └── ... (50+ more)
│   │
│   ├── forms/                             # @fero/forms — 20+ Form Components
│   │   ├── auto-complete/
│   │   ├── checkbox/
│   │   ├── datetimepicker/
│   │   ├── dynamic-forms/                 #   Formly-based dynamic forms
│   │   ├── editable-text/
│   │   ├── input/
│   │   ├── number-field/
│   │   ├── radio/
│   │   ├── rte/                           #   Rich Text Editor (TinyMCE)
│   │   ├── select/
│   │   ├── slider/
│   │   ├── toggle-switch/
│   │   └── ...
│   │
│   ├── framework/                         # @fero/framework — App Shell
│   │   └── src/lib/
│   │       ├── header/                    #   ├─ Header + nav levels + responsive
│   │       ├── footer/                    #   ├─ Footer
│   │       ├── sidenav/                   #   ├─ Side navigation + a11y directive
│   │       ├── subnav/                    #   ├─ Sub navigation
│   │       ├── body/                      #   ├─ Body layout orchestrator
│   │       ├── toc/                       #   ├─ Table of contents
│   │       ├── component-renderer/        #   ├─ Dynamic component rendering
│   │       ├── actions/                   #   ├─ NgRx actions (nav, setting)
│   │       ├── reducers/                  #   ├─ NgRx reducers (nav tree, settings)
│   │       ├── services/                  #   ├─ Facade + settings service
│   │       │   ├── framework.facade.ts    #   │  ★ Facade pattern over NgRx
│   │       │   └── framework-settings.*   #   │
│   │       ├── framework.module.ts        #   ├─ NgModule (forRoot pattern)
│   │       └── framework.provider.ts      #   └─ Standalone provider API
│   │
│   ├── patterns/                          # @fero/patterns — Design Patterns
│   │   ├── color-palette/
│   │   ├── typography/
│   │   └── iconography/
│   │
│   ├── assets/                            # @fero/assets — Global Styles
│   │   └── src/lib/smacss/scss/
│   │       ├── base/                      #   ├─ Resets, typography
│   │       ├── layout/                    #   ├─ Grid, page structure
│   │       ├── modules/                   #   ├─ Reusable SCSS modules
│   │       ├── states/                    #   ├─ State-based styles
│   │       ├── theme/                     #   ├─ Theme variables
│   │       ├── utilities/                 #   ├─ Mixins, functions, variables
│   │       ├── saba-theme.scss            #   ├─ ★ 10+ Theme files:
│   │       ├── dark-theme.scss            #   │  saba, dark, material-blue,
│   │       ├── csod-theme.scss            #   │  csod, pxp, lumesse, newco,
│   │       ├── pxp-theme.scss             #   │  tailwind-blue, cloudflare-blue
│   │       └── fero.scss                #   └─ Master stylesheet entry
│   │
│   ├── foundations/                        # Foundations (Web Components Layer)
│   │   ├── design-tokens/                 #   ├─ Design tokens (Figma → CSS vars)
│   │   │   └── src/lib/
│   │   │       ├── dictionary/            #   │  Style Dictionary config
│   │   │       ├── figma-variables.json   #   │  Figma variable export
│   │   │       ├── tailwind.config.js     #   │  Tailwind integration
│   │   │       └── variables.ts           #   │  TS token exports
│   │   ├── elements/
│   │   │   ├── galaxy/                    #   ├─ Galaxy Elements (Lit-based)
│   │   │   │   └── src/lib/
│   │   │   │       ├── header/            #   │  header, menu-bar, search,
│   │   │   │       ├── menu-bar/          #   │  popover, nested-menu, logo
│   │   │   │       ├── search/            #   │  → Framework-agnostic
│   │   │   │       └── popover/           #   │
│   │   │   └── sbx/                       #   ├─ SBX Elements
│   │   ├── cdk/                           #   ├─ Web Component CDK (base styles)
│   │   └── icons/                         #   └─ Icon system (Lucide-based)
│   │
│   ├── lego/                              # @fero/lego — Angular ↔ WC Bridge
│   │   ├── icon/
│   │   ├── shared/
│   │   └── sandbox/
│   │
│   ├── plugins/                           # Build & Dev Tooling
│   │   ├── nx/                            #   ├─ Custom Nx generators
│   │   │   └── src/generators/
│   │   │       ├── secondary-entry-point/ #   │  Component scaffolding
│   │   │       ├── standalone/            #   │  Standalone migration
│   │   │       └── consume-standalone-api/#   │  API consumption helper
│   │   ├── eslint/                        #   ├─ @fero/eslint-plugin
│   │   │   (template-a11y, template-recommended rules)
│   │   └── lego/                          #   └─ Lego Nx plugin
│   │
│   ├── vendor/                            # Forked Third-Party Libraries
│   │   ├── ng-sidebar/
│   │   ├── ngx-perfect-scrollbar/
│   │   └── ngx-popper/
│   │
│   └── tools/                             # Build scripts & utilities
│
├── .ci/                                   # CI/CD Scripts (TeamCity/Jenkins)
├── .husky/                                # Git hooks (commit-msg, pre-commit)
├── nx.json                                # Nx workspace config
├── tsconfig.base.json                     # Path aliases for all 80+ entry points
├── package.json                           # Root dependencies
└── angular.json / project.json            # Angular CLI / Nx project configs
```

---

## Six Key Architecture Decisions

### 1. Secondary Entry Points for Tree-Shaking

Every component is a **separate ng-packagr secondary entry point**. Consumers import only what they need:

```typescript
// ✅ Only bundles button code
import { FroButtonModule } from '@fero/ui/button';

// ❌ Would bundle ALL 60+ components
import { FroButtonModule } from '@fero/ui';
```

`tsconfig.base.json` maps **80+ path aliases** (`@fero/ui/datagrid`, `@fero/forms/auto-complete`, etc.) to their source entry points. This is critical for enterprise apps where bundle size = load time.

### 2. NgRx + Facade Pattern for Framework State

The application shell (`@fero/framework`) manages navigation, layout, and settings via NgRx:

```
Actions (nav.ts, setting.ts)
    ↓
Reducers (nav tree parsing, breadcrumb resolution)
    ↓
Selectors (30+ selectors for nav items, layout flags, branding)
    ↓
FroFrameworkFacade ← Components inject THIS, not Store directly
    ├── body$          (composed observable: 24 streams combined)
    ├── branding$      (composed observable: 8 streams combined)
    ├── primaryNavItems$, sideNavItems$, subNavItems$
    ├── isSmallScreen$, isTileNav$, isOverlayNav$
    └── refreshNav(), toggleSideNav(), updateBreadcrumbForRoute()
```

All observables use `shareReplay({ bufferSize: 1, refCount: true })` — multicasts to multiple subscribers, auto-cleans when all unsubscribe.

### 3. Standalone Provider API (Modern Angular Pattern)

Both `@fero/core` and `@fero/framework` expose composable provider functions:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideTorqueCore(
      withI18n([...bundles], MyResourceBundleService),
      withCache(),
      withHttp(),
      withFeatureToggle()
    ),
    provideTorqueFramework(
      withHeader(),
      withNavGuard()
    )
  ]
};
```

Features are enum-keyed and merged — consumers can override defaults. Same pattern Angular Router uses with `provideRouter(withPreloading(...))`.

### 4. Multi-Framework Strategy (Angular + Lit Web Components)

```
┌─────────────────────────────────────────────────┐
│              Design Tokens (@lego/design-tokens) │  ← Single source of truth
│              Figma Variables → CSS Custom Props   │
├─────────────────────────────────────────────────┤
│                                                   │
│  Angular Components        Lit Web Components     │
│  (@fero/ui, /forms)      (@lego/elements-galaxy)│
│  ┌──────────────┐          ┌──────────────┐       │
│  │ FroButton    │          │ galaxy-header│       │
│  │ FroDatagrid  │          │ galaxy-menu  │       │
│  │ FroModal     │          │ galaxy-search│       │
│  └──────────────┘          └──────────────┘       │
│        ↑                          ↑               │
│   Angular CDK              Lego CDK (base styles) │
│  (@fero/core/cdk)        (@lego/cdk)            │
└─────────────────────────────────────────────────┘
```

Galaxy elements are framework-agnostic — usable in Angular, React, or vanilla JS. This enables micro-frontend scenarios and progressive migration.

### 5. Theming via SMACSS + PostCSS RTL

```
fero.scss (master entry)
├── utilities/   → Variables, mixins, functions
├── base/        → Resets, typography defaults
├── layout/      → Grid system, page structure
├── modules/     → Reusable SCSS patterns
├── states/      → Responsive, active, hidden states
└── theme/       → Color tokens, visual overrides

Per-component:
├── _button-config.scss    → Structural variables ($fro-btn-padding, etc.)
└── _button-theme.scss     → Themeable overrides (colors, shadows)

PostCSS pipeline:
  pre:css → build → post:css (RTL generation via postcss-rtl)
  .foo { margin-left: 8px }
  → [dir="ltr"] .foo { margin-left: 8px }
  → [dir="rtl"] .foo { margin-right: 8px }
```

10+ themes override only the visual layer. Structure stays constant.

### 6. Platform Services as Pluggable Features

`@fero/core/platform` provides enterprise infrastructure that's independent of UI:

| Service | What It Does |
|---|---|
| **i18n** | ngx-translate + resource bundles + locale direction + translate guard |
| **Cache** | Local/session/memory storage with scope providers |
| **HTTP** | Base, cache, in-flight, logging interceptors |
| **Configuration** | Multi-provider config (defaults → context → a11y) with validators |
| **Feature Toggle** | Directive + route guard + service for feature flags |
| **Logging** | Logger with pluggable appenders (console, custom) |
| **Error** | Global error handler |
| **Dynamic Loading** | Runtime component resolution + dynamic pages |
| **A11y** | AriaService, LiveAnnouncer, event handlers |

---

## Build & Quality Pipeline

```
Developer Workflow:
  git commit → Husky hooks → commitlint (conventional commits)
                            → lint-staged (ESLint + Stylelint + Prettier)

CI Pipeline (TeamCity/Jenkins):
  nx affected:lint    → ESLint (TS) + @fero/eslint-plugin (templates)
  nx affected:stylelint → Stylelint (SCSS) with strict-value + idiomatic-order
  nx affected:test    → Karma/Jasmine (Angular) + Web Test Runner (Lit)
  nx affected:build   → ng-packagr (APF) + Rollup (Web Components)
  PostCSS pipeline    → RTL generation
  Storybook build     → Visual documentation + addon-a11y audits

Nx Caching:
  ✓ Build, test, lint, stylelint targets all cached
  ✓ affected commands = only rebuild what changed
  ✓ High-memory mode (8GB) for large parallel builds
```

---

## Quick-Reference: Interview Talking Points

| Topic | Key Point |
|---|---|
| **Scale** | 80+ components, 11 library packages, 10+ themes, 4 apps |
| **Tree-Shaking** | Secondary entry points — each component is independently importable |
| **State** | NgRx with Facade pattern — components never touch Store directly |
| **Modern Angular** | `provideTorqueCore()` / `provideTorqueFramework()` with composable features |
| **Multi-Framework** | Angular components + Lit Web Components sharing design tokens |
| **Theming** | SMACSS + per-component config/theme files + automatic RTL via PostCSS |
| **a11y** | Custom ESLint rules, CDK (focus management, tab trap, hotkeys, ARIA), LiveAnnouncer |
| **i18n** | Full RTL, locale-aware caching, translate guards, resource bundles |
| **Tooling** | Custom Nx generators, ESLint plugin, Verdaccio for local publishing |
| **Vendor Control** | Forked Clarity, TinyMCE, date-picker for patch independence |
| **Build** | ng-packagr (APF) + Rollup + PostCSS pipeline, all Nx-cached |
| **Quality** | Commitlint + lint-staged + Storybook a11y audits + Karma/Jasmine |
