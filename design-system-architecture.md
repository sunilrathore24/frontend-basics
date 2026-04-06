# Design System â€” Architecture Overview (10-Minute Interview Guide)

## What is the Design System?

The Design System is an **enterprise-grade Angular UI platform** built by the engineering team.
It's a monorepo housing **80+ reusable components**, a full application shell framework, platform services, design tokens, and a parallel **Web Components** layer â€” all serving multiple product lines with **10+ themes**, **RTL support**, and **deep accessibility** baked in.

**Tech Stack:** Angular 20 Â· TypeScript 5.9 Â· Nx 21 Â· NgRx Â· Lit (Web Components) Â· SCSS/SMACSS Â· Karma/Jasmine Â· Storybook 8

---

## Directory Structure

```
Design System/                                    # Nx Monorepo Root
â”‚
â”œâ”€â”€ apps/                                  # â”€â”€ Applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”‚   â”œâ”€â”€ playground/                        # Full dev/demo app (port 4200)
â”‚   â”œâ”€â”€ sandbox/                           # Lightweight single-component dev env
â”‚   â”œâ”€â”€ play-framework/                    # Framework-specific playground
â”‚   â””â”€â”€ storybook/                         # Storybook documentation app
â”‚
â”œâ”€â”€ libs/                                  # â”€â”€ Libraries (the core of Design System) â”€
â”‚   â”‚
â”‚   â”œâ”€â”€ core/                              # @Design System/core
â”‚   â”‚   â”œâ”€â”€ cdk/                           #   â””â”€ CDK: a11y, pipes, operators
â”‚   â”‚   â”‚   â””â”€â”€ src/lib/
â”‚   â”‚   â”‚       â”œâ”€â”€ a11y/                  #       â”œâ”€ FocusKeyManager, TabTrap,
â”‚   â”‚   â”‚       â”‚   â”œâ”€â”€ hotkey/            #       â”‚  Hotkey, AriaList, Tooltip,
â”‚   â”‚   â”‚       â”‚   â”œâ”€â”€ tab-trap/          #       â”‚  FocusableItem, KeyboardSelect
â”‚   â”‚   â”‚       â”‚   â””â”€â”€ ...                #       â”‚
â”‚   â”‚   â”‚       â”œâ”€â”€ pipes/                 #       â”œâ”€ cast, memoize, safe pipes
â”‚   â”‚   â”‚       â””â”€â”€ operators/             #       â””â”€ skipRouterEvents
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ platform/                      #   â””â”€ Platform Services
â”‚   â”‚   â”‚   â””â”€â”€ src/lib/
â”‚   â”‚   â”‚       â”œâ”€â”€ i18n/                  #       â”œâ”€ i18n (ngx-translate based)
â”‚   â”‚   â”‚       â”œâ”€â”€ cache/                 #       â”œâ”€ Caching (local/session/memory)
â”‚   â”‚   â”‚       â”œâ”€â”€ configuration/         #       â”œâ”€ Config providers + validators
â”‚   â”‚   â”‚       â”œâ”€â”€ http/                  #       â”œâ”€ HTTP interceptors (base, cache, in-flight, logging)
â”‚   â”‚   â”‚       â”œâ”€â”€ logging/               #       â”œâ”€ Logger with appenders
â”‚   â”‚   â”‚       â”œâ”€â”€ feature-toggle/        #       â”œâ”€ Feature flags (directive + guard)
â”‚   â”‚   â”‚       â”œâ”€â”€ error/                 #       â”œâ”€ Global error handler
â”‚   â”‚   â”‚       â”œâ”€â”€ navigation/            #       â”œâ”€ Navigation service
â”‚   â”‚   â”‚       â”œâ”€â”€ dynamic-component-loader/ #    â”œâ”€ Lazy component loading
â”‚   â”‚   â”‚       â”œâ”€â”€ dynamic-page/          #       â”œâ”€ Dynamic page composition
â”‚   â”‚   â”‚       â”œâ”€â”€ services/a11y/         #       â”œâ”€ AriaService, LiveAnnouncer
â”‚   â”‚   â”‚       â”œâ”€â”€ services/scrolling/    #       â”œâ”€ ScrollingService, DragScroll
â”‚   â”‚   â”‚       â”œâ”€â”€ mock-backend/          #       â”œâ”€ Mock interceptor for dev
â”‚   â”‚   â”‚       â””â”€â”€ title/                 #       â””â”€ Page title service
â”‚   â”‚   â”‚
â”‚   â”‚   â””â”€â”€ utils/                         #   â””â”€ Pure Utilities
â”‚   â”‚       â””â”€â”€ src/lib/
â”‚   â”‚           â”œâ”€â”€ color/                 #       â”œâ”€ Color manipulation
â”‚   â”‚           â”œâ”€â”€ datetime/              #       â”œâ”€ Date builder, time units
â”‚   â”‚           â”œâ”€â”€ dom/                   #       â”œâ”€ DOM, event, selector utils
â”‚   â”‚           â”œâ”€â”€ data/                  #       â”œâ”€ Paging, sorting
â”‚   â”‚           â”œâ”€â”€ http/                  #       â”œâ”€ Headers, status codes
â”‚   â”‚           â”œâ”€â”€ search/                #       â”œâ”€ Search utilities
â”‚   â”‚           â”œâ”€â”€ responsive/            #       â”œâ”€ Grid utilities
â”‚   â”‚           â””â”€â”€ format/                #       â””â”€ Formatting helpers
â”‚   â”‚
â”‚   â”œâ”€â”€ ui/                                # @Design System/ui â€” 60+ UI Components
â”‚   â”‚   â”œâ”€â”€ accordion/                     #   Each folder = secondary entry point
â”‚   â”‚   â”œâ”€â”€ alert/                         #   e.g. import from '@Design System/ui/alert'
â”‚   â”‚   â”œâ”€â”€ badge/
â”‚   â”‚   â”œâ”€â”€ breadcrumb/
â”‚   â”‚   â”œâ”€â”€ button/
â”‚   â”‚   â”œâ”€â”€ button-group/
â”‚   â”‚   â”œâ”€â”€ card/
â”‚   â”‚   â”œâ”€â”€ carousel/
â”‚   â”‚   â”œâ”€â”€ chip/
â”‚   â”‚   â”œâ”€â”€ datagrid/                      #   â˜… Complex: virtual scroll, a11y,
â”‚   â”‚   â”‚   â””â”€â”€ src/lib/                   #     column picker, row selection,
â”‚   â”‚   â”‚       â”œâ”€â”€ datagrid.component.ts  #     paging, sorting, refresh
â”‚   â”‚   â”‚       â”œâ”€â”€ datagrid-virtual/
â”‚   â”‚   â”‚       â”œâ”€â”€ directive/datagrid-a11y.directive.ts
â”‚   â”‚   â”‚       â””â”€â”€ partials/             #     column, footer, row-detail
â”‚   â”‚   â”œâ”€â”€ dropdown/
â”‚   â”‚   â”œâ”€â”€ flyout/
â”‚   â”‚   â”œâ”€â”€ modal/
â”‚   â”‚   â”œâ”€â”€ sidebar/
â”‚   â”‚   â”œâ”€â”€ stepper/
â”‚   â”‚   â”œâ”€â”€ tabs/
â”‚   â”‚   â”œâ”€â”€ toast/
â”‚   â”‚   â”œâ”€â”€ tree-view/
â”‚   â”‚   â”œâ”€â”€ virtual-scroll/
â”‚   â”‚   â”œâ”€â”€ visualization/                #   D3-based charts/maps
â”‚   â”‚   â”œâ”€â”€ services/                      #   Shared UI services
â”‚   â”‚   â”œâ”€â”€ shared/                        #   Shared UI utilities
â”‚   â”‚   â””â”€â”€ ... (50+ more)
â”‚   â”‚
â”‚   â”œâ”€â”€ forms/                             # @Design System/forms â€” 20+ Form Components
â”‚   â”‚   â”œâ”€â”€ auto-complete/
â”‚   â”‚   â”œâ”€â”€ checkbox/
â”‚   â”‚   â”œâ”€â”€ datetimepicker/
â”‚   â”‚   â”œâ”€â”€ dynamic-forms/                 #   Formly-based dynamic forms
â”‚   â”‚   â”œâ”€â”€ editable-text/
â”‚   â”‚   â”œâ”€â”€ input/
â”‚   â”‚   â”œâ”€â”€ number-field/
â”‚   â”‚   â”œâ”€â”€ radio/
â”‚   â”‚   â”œâ”€â”€ rte/                           #   Rich Text Editor (TinyMCE)
â”‚   â”‚   â”œâ”€â”€ select/
â”‚   â”‚   â”œâ”€â”€ slider/
â”‚   â”‚   â”œâ”€â”€ toggle-switch/
â”‚   â”‚   â””â”€â”€ ...
â”‚   â”‚
â”‚   â”œâ”€â”€ framework/                         # @Design System/framework â€” App Shell
â”‚   â”‚   â””â”€â”€ src/lib/
â”‚   â”‚       â”œâ”€â”€ header/                    #   â”œâ”€ Header + nav levels + responsive
â”‚   â”‚       â”œâ”€â”€ footer/                    #   â”œâ”€ Footer
â”‚   â”‚       â”œâ”€â”€ sidenav/                   #   â”œâ”€ Side navigation + a11y directive
â”‚   â”‚       â”œâ”€â”€ subnav/                    #   â”œâ”€ Sub navigation
â”‚   â”‚       â”œâ”€â”€ body/                      #   â”œâ”€ Body layout orchestrator
â”‚   â”‚       â”œâ”€â”€ toc/                       #   â”œâ”€ Table of contents
â”‚   â”‚       â”œâ”€â”€ component-renderer/        #   â”œâ”€ Dynamic component rendering
â”‚   â”‚       â”œâ”€â”€ actions/                   #   â”œâ”€ NgRx actions (nav, setting)
â”‚   â”‚       â”œâ”€â”€ reducers/                  #   â”œâ”€ NgRx reducers (nav tree, settings)
â”‚   â”‚       â”œâ”€â”€ services/                  #   â”œâ”€ Facade + settings service
â”‚   â”‚       â”‚   â”œâ”€â”€ framework.facade.ts    #   â”‚  â˜… Facade pattern over NgRx
â”‚   â”‚       â”‚   â””â”€â”€ framework-settings.*   #   â”‚
â”‚   â”‚       â”œâ”€â”€ framework.module.ts        #   â”œâ”€ NgModule (forRoot pattern)
â”‚   â”‚       â””â”€â”€ framework.provider.ts      #   â””â”€ Standalone provider API
â”‚   â”‚
â”‚   â”œâ”€â”€ patterns/                          # @Design System/patterns â€” Design Patterns
â”‚   â”‚   â”œâ”€â”€ color-palette/
â”‚   â”‚   â”œâ”€â”€ typography/
â”‚   â”‚   â””â”€â”€ iconography/
â”‚   â”‚
â”‚   â”œâ”€â”€ assets/                            # @Design System/assets â€” Global Styles
â”‚   â”‚   â””â”€â”€ src/lib/smacss/scss/
â”‚   â”‚       â”œâ”€â”€ base/                      #   â”œâ”€ Resets, typography
â”‚   â”‚       â”œâ”€â”€ layout/                    #   â”œâ”€ Grid, page structure
â”‚   â”‚       â”œâ”€â”€ modules/                   #   â”œâ”€ Reusable SCSS modules
â”‚   â”‚       â”œâ”€â”€ states/                    #   â”œâ”€ State-based styles
â”‚   â”‚       â”œâ”€â”€ theme/                     #   â”œâ”€ Theme variables
â”‚   â”‚       â”œâ”€â”€ utilities/                 #   â”œâ”€ Mixins, functions, variables
â”‚   â”‚       â”œâ”€â”€ default-theme.scss            #   â”œâ”€ â˜… 10+ Theme files:
â”‚   â”‚       â”œâ”€â”€ dark-theme.scss            #   â”‚  Application, dark, material-blue,
â”‚   â”‚       â”œâ”€â”€ enterprise-theme.scss            #   â”‚  enterprise, variant, partner, newbrand,
â”‚   â”‚       â”œâ”€â”€ variant-theme.scss             #   â”‚  tailwind-blue, cloudflare-blue
â”‚   â”‚       â””â”€â”€ Design System.scss                #   â””â”€ Master stylesheet entry
â”‚   â”‚
â”‚   â”œâ”€â”€ foundations/                        # Foundations (Web Components Layer)
â”‚   â”‚   â”œâ”€â”€ design-tokens/                 #   â”œâ”€ Design tokens (Figma â†’ CSS vars)
â”‚   â”‚   â”‚   â””â”€â”€ src/lib/
â”‚   â”‚   â”‚       â”œâ”€â”€ dictionary/            #   â”‚  Style Dictionary config
â”‚   â”‚   â”‚       â”œâ”€â”€ figma-variables.json   #   â”‚  Figma variable export
â”‚   â”‚   â”‚       â”œâ”€â”€ tailwind.config.js     #   â”‚  Tailwind integration
â”‚   â”‚   â”‚       â””â”€â”€ variables.ts           #   â”‚  TS token exports
â”‚   â”‚   â”œâ”€â”€ elements/
â”‚   â”‚   â”‚   â”œâ”€â”€ galaxy/                    #   â”œâ”€ Galaxy Elements (Lit-based)
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ src/lib/
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ header/            #   â”‚  header, menu-bar, search,
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ menu-bar/          #   â”‚  popover, nested-menu, logo
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ search/            #   â”‚  â†’ Framework-agnostic
â”‚   â”‚   â”‚   â”‚       â””â”€â”€ popover/           #   â”‚
â”‚   â”‚   â”‚   â””â”€â”€ sbx/                       #   â”œâ”€ SBX Elements
â”‚   â”‚   â”œâ”€â”€ cdk/                           #   â”œâ”€ Web Component CDK (base styles)
â”‚   â”‚   â””â”€â”€ icons/                         #   â””â”€ Icon system (Lucide-based)
â”‚   â”‚
â”‚   â”œâ”€â”€ lego/                              # @Design System/lego â€” Angular â†” WC Bridge
â”‚   â”‚   â”œâ”€â”€ icon/
â”‚   â”‚   â”œâ”€â”€ shared/
â”‚   â”‚   â””â”€â”€ sandbox/
â”‚   â”‚
â”‚   â”œâ”€â”€ plugins/                           # Build & Dev Tooling
â”‚   â”‚   â”œâ”€â”€ nx/                            #   â”œâ”€ Custom Nx generators
â”‚   â”‚   â”‚   â””â”€â”€ src/generators/
â”‚   â”‚   â”‚       â”œâ”€â”€ secondary-entry-point/ #   â”‚  Component scaffolding
â”‚   â”‚   â”‚       â”œâ”€â”€ standalone/            #   â”‚  Standalone migration
â”‚   â”‚   â”‚       â””â”€â”€ consume-standalone-api/#   â”‚  API consumption helper
â”‚   â”‚   â”œâ”€â”€ eslint/                        #   â”œâ”€ @Design System/eslint-plugin
â”‚   â”‚   â”‚   (template-a11y, template-recommended rules)
â”‚   â”‚   â””â”€â”€ lego/                          #   â””â”€ Lego Nx plugin
â”‚   â”‚
â”‚   â”œâ”€â”€ vendor/                            # Forked Third-Party Libraries
â”‚   â”‚   â”œâ”€â”€ ng-sidebar/
â”‚   â”‚   â”œâ”€â”€ ngx-perfect-scrollbar/
â”‚   â”‚   â””â”€â”€ ngx-popper/
â”‚   â”‚
â”‚   â””â”€â”€ tools/                             # Build scripts & utilities
â”‚
â”œâ”€â”€ .ci/                                   # CI/CD Scripts (CI Server/Jenkins)
â”œâ”€â”€ .husky/                                # Git hooks (commit-msg, pre-commit)
â”œâ”€â”€ nx.json                                # Nx workspace config
â”œâ”€â”€ tsconfig.base.json                     # Path aliases for all 80+ entry points
â”œâ”€â”€ package.json                           # Root dependencies
â””â”€â”€ angular.json / project.json            # Angular CLI / Nx project configs
```

---

## Six Key Architecture Decisions

### 1. Secondary Entry Points for Tree-Shaking

Every component is a **separate ng-packagr secondary entry point**. Consumers import only what they need:

```typescript
// âœ… Only bundles button code
import { DsButtonModule } from '@Design System/ui/button';

// âŒ Would bundle ALL 60+ components
import { DsButtonModule } from '@Design System/ui';
```

`tsconfig.base.json` maps **80+ path aliases** (`@Design System/ui/datagrid`, `@Design System/forms/auto-complete`, etc.) to their source entry points. This is critical for enterprise apps where bundle size = load time.

### 2. NgRx + Facade Pattern for Framework State

The application shell (`@Design System/framework`) manages navigation, layout, and settings via NgRx:

```
Actions (nav.ts, setting.ts)
    â†“
Reducers (nav tree parsing, breadcrumb resolution)
    â†“
Selectors (30+ selectors for nav items, layout flags, branding)
    â†“
DsFrameworkFacade â† Components inject THIS, not Store directly
    â”œâ”€â”€ body$          (composed observable: 24 streams combined)
    â”œâ”€â”€ branding$      (composed observable: 8 streams combined)
    â”œâ”€â”€ primaryNavItems$, sideNavItems$, subNavItems$
    â”œâ”€â”€ isSmallScreen$, isTileNav$, isOverlayNav$
    â””â”€â”€ refreshNav(), toggleSideNav(), updateBreadcrumbForRoute()
```

All observables use `shareReplay({ bufferSize: 1, refCount: true })` â€” multicasts to multiple subscribers, auto-cleans when all unsubscribe.

### 3. Standalone Provider API (Modern Angular Pattern)

Both `@Design System/core` and `@Design System/framework` expose composable provider functions:

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

Features are enum-keyed and merged â€” consumers can override defaults. Same pattern Angular Router uses with `provideRouter(withPreloading(...))`.

### 4. Multi-Framework Strategy (Angular + Lit Web Components)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              Design Tokens (@lego/design-tokens) â”‚  â† Single source of truth
â”‚              Figma Variables â†’ CSS Custom Props   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                   â”‚
â”‚  Angular Components        Lit Web Components     â”‚
â”‚  (@Design System/ui, /forms)      (@lego/elements-galaxy)â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”‚
â”‚  â”‚ DsButton    â”‚          â”‚ galaxy-headerâ”‚       â”‚
â”‚  â”‚ DsDatagrid  â”‚          â”‚ galaxy-menu  â”‚       â”‚
â”‚  â”‚ DsModal     â”‚          â”‚ galaxy-searchâ”‚       â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â”‚
â”‚        â†‘                          â†‘               â”‚
â”‚   Angular CDK              Lego CDK (base styles) â”‚
â”‚  (@Design System/core/cdk)        (@lego/cdk)            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Galaxy elements are framework-agnostic â€” usable in Angular, React, or vanilla JS. This enables micro-frontend scenarios and progressive migration.

### 5. Theming via SMACSS + PostCSS RTL

```
Design System.scss (master entry)
â”œâ”€â”€ utilities/   â†’ Variables, mixins, functions
â”œâ”€â”€ base/        â†’ Resets, typography defaults
â”œâ”€â”€ layout/      â†’ Grid system, page structure
â”œâ”€â”€ modules/     â†’ Reusable SCSS patterns
â”œâ”€â”€ states/      â†’ Responsive, active, hidden states
â””â”€â”€ theme/       â†’ Color tokens, visual overrides

Per-component:
â”œâ”€â”€ _button-config.scss    â†’ Structural variables ($ds-btn-padding, etc.)
â””â”€â”€ _button-theme.scss     â†’ Themeable overrides (colors, shadows)

PostCSS pipeline:
  pre:css â†’ build â†’ post:css (RTL generation via postcss-rtl)
  .foo { margin-left: 8px }
  â†’ [dir="ltr"] .foo { margin-left: 8px }
  â†’ [dir="rtl"] .foo { margin-right: 8px }
```

10+ themes override only the visual layer. Structure stays constant.

### 6. Platform Services as Pluggable Features

`@Design System/core/platform` provides enterprise infrastructure that's independent of UI:

| Service | What It Does |
|---|---|
| **i18n** | ngx-translate + resource bundles + locale direction + translate guard |
| **Cache** | Local/session/memory storage with scope providers |
| **HTTP** | Base, cache, in-flight, logging interceptors |
| **Configuration** | Multi-provider config (defaults â†’ context â†’ a11y) with validators |
| **Feature Toggle** | Directive + route guard + service for feature flags |
| **Logging** | Logger with pluggable appenders (console, custom) |
| **Error** | Global error handler |
| **Dynamic Loading** | Runtime component resolution + dynamic pages |
| **A11y** | AriaService, LiveAnnouncer, event handlers |

---

## Build & Quality Pipeline

```
Developer Workflow:
  git commit â†’ Husky hooks â†’ commitlint (conventional commits)
                            â†’ lint-staged (ESLint + Stylelint + Prettier)

CI Pipeline (CI Server/Jenkins):
  nx affected:lint    â†’ ESLint (TS) + @Design System/eslint-plugin (templates)
  nx affected:stylelint â†’ Stylelint (SCSS) with strict-value + idiomatic-order
  nx affected:test    â†’ Karma/Jasmine (Angular) + Web Test Runner (Lit)
  nx affected:build   â†’ ng-packagr (APF) + Rollup (Web Components)
  PostCSS pipeline    â†’ RTL generation
  Storybook build     â†’ Visual documentation + addon-a11y audits

Nx Caching:
  âœ“ Build, test, lint, stylelint targets all cached
  âœ“ affected commands = only rebuild what changed
  âœ“ High-memory mode (8GB) for large parallel builds
```

---

## Quick-Reference: Interview Talking Points

| Topic | Key Point |
|---|---|
| **Scale** | 80+ components, 11 library packages, 10+ themes, 4 apps |
| **Tree-Shaking** | Secondary entry points â€” each component is independently importable |
| **State** | NgRx with Facade pattern â€” components never touch Store directly |
| **Modern Angular** | `provideTorqueCore()` / `provideTorqueFramework()` with composable features |
| **Multi-Framework** | Angular components + Lit Web Components sharing design tokens |
| **Theming** | SMACSS + per-component config/theme files + automatic RTL via PostCSS |
| **a11y** | Custom ESLint rules, CDK (focus management, tab trap, hotkeys, ARIA), LiveAnnouncer |
| **i18n** | Full RTL, locale-aware caching, translate guards, resource bundles |
| **Tooling** | Custom Nx generators, ESLint plugin, local npm registry for local publishing |
| **Vendor Control** | Forked Clarity, TinyMCE, date-picker for patch independence |
| **Build** | ng-packagr (APF) + Rollup + PostCSS pipeline, all Nx-cached |
| **Quality** | Commitlint + lint-staged + Storybook a11y audits + Karma/Jasmine |

