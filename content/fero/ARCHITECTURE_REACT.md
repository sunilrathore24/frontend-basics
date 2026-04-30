# Flare Design System — Architecture & Interview Prep Guide

> This document is structured as an interview preparation reference. Each section is written to help you confidently answer questions like "Tell me about your project", "How is your codebase organized?", "What design patterns do you use?", etc.

---

## Table of Contents

1. [Project Overview — "Tell me about your project"](#1-project-overview)
2. [Monorepo Architecture — "How is the codebase organized?"](#2-monorepo-architecture)
3. [Package Ecosystem — "What packages does the design system have?"](#3-package-ecosystem)
4. [Build System & Tooling — "How do you build and ship packages?"](#4-build-system--tooling)
5. [Theming & Design Tokens — "How does theming work?"](#5-theming--design-tokens)
6. [Styled Components & CSS-in-JS — "How do you handle styling?"](#6-styled-components--css-in-js)
7. [State Management — "How do you manage state?"](#7-state-management)
8. [Component Architecture — "How are components structured?"](#8-component-architecture)
9. [Testing Strategy — "How do you test components?"](#9-testing-strategy)
10. [Storybook & Documentation — "How do you document components?"](#10-storybook--documentation)
11. [CI/CD Pipeline — "What does your CI/CD look like?"](#11-cicd-pipeline)
12. [Code Quality & Git Workflow — "What processes ensure code quality?"](#12-code-quality--git-workflow)
13. [Accessibility — "How do you handle accessibility?"](#13-accessibility)
14. [Internationalization — "How do you support multiple languages?"](#14-internationalization)
15. [Key Dependencies — "What are the major libraries you use?"](#15-key-dependencies)
16. [Common Interview Q&A](#16-common-interview-qa)

---

## 1. Project Overview

**Interview Answer:** "I work on the Flare Design System, which is Cornerstone OnDemand's enterprise-grade React component library. It's a monorepo that houses 15 packages — from primitive UI controls like buttons and inputs, to domain-specific components for HR, Learning, Performance, and Recruiting modules. The system serves as the single source of truth for UI across all CSOD products."

### Key Facts

| Aspect | Detail |
|---|---|
| **Repository** | `rcl2-design-system` (Bitbucket, ENT-NPM project) |
| **Organization** | Lerna + Nx monorepo with Yarn workspaces |
| **Runtime** | React 19.2.5, TypeScript 5.4.5 |
| **Styling** | styled-components 5.3.6 + xstyled 1.19.1 |
| **Node** | 24.13.0+ (enforced via `engines` in package.json) |
| **Package Manager** | Yarn 1.x (enforced — npm is blocked) |
| **Registry** | Artifactory (`primary.repo.csod.com`) |
| **Documentation** | Storybook 10.2.17 (Vite-based) |
| **Versioning** | Independent (each package has its own version) |

### Why a Monorepo?

> **Interview Tip:** This is a common follow-up. Explain the trade-offs.

- **Shared tooling**: One ESLint config, one Jest config, one TypeScript base config — all packages inherit from root.
- **Atomic cross-package changes**: If a primitives change breaks learning components, you catch it in the same PR.
- **Dependency graph awareness**: Nx understands which packages depend on which, so CI only builds/tests what changed (`affected` commands).
- **Single Storybook**: All 15 packages render their stories in one Storybook instance, giving designers and consumers a unified catalog.

---

## 2. Monorepo Architecture

**Interview Answer:** "We use Lerna for package orchestration and publishing, Nx for intelligent caching and task dependency graphs, and Yarn workspaces for dependency hoisting. Lerna handles versioning and changelog generation with conventional commits, while Nx ensures we only rebuild what's affected."

### Root Directory Layout

```
rcl2-design-system/
├── src/packages/           # 15 publishable packages
├── docs/                   # MDX documentation (rendered in Storybook)
├── .storybook/             # Storybook config (Vite-based)
├── e2e/                    # End-to-end Playwright tests
├── scripts/                # Build automation, analytics, codemods
├── automation/             # CI/CD pipeline config (PipelineKit)
├── tests/                  # Shared test utilities and mocks
├── recipes/                # Design token extraction configs
└── temp/                   # Temporary build artifacts
```

### How Lerna, Nx, and Yarn Work Together

```
┌─────────────────────────────────────────────────┐
│                  yarn install                    │
│         (hoists shared deps to root)             │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              lerna run build                      │
│   (orchestrates build across all packages)       │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│                 Nx Task Runner                    │
│  - Reads dependency graph                        │
│  - Caches build/test/lint outputs                │
│  - Runs only affected tasks in CI                │
└─────────────────────────────────────────────────┘
```

### Configuration Files at Root

| File | Purpose | Interview Relevance |
|---|---|---|
| `lerna.json` | Independent versioning, conventional commits changelog, Nx integration | "We use independent versioning so primitives can ship a patch without bumping learning" |
| `nx.json` | Cache targets (build, test, lint, format), dependency ordering (`^build`) | "Nx caches outputs — a clean CI build takes 8 min, a cached one takes 30 sec" |
| `tsconfig.base.json` | Path aliases (`@flare/primitives/*`), ES2015 target, bundler module resolution | "All packages share a base tsconfig with path aliases for cross-package imports" |
| `package.json` | Yarn workspaces config, 50+ root scripts, dependency resolutions | "Root package.json defines workspace globs and shared dev dependencies" |
| `.npmrc` | Artifactory registry, `save-exact=true`, `engine-strict=true` | "We pin exact versions and enforce Node version to prevent drift" |

---

## 3. Package Ecosystem

**Interview Answer:** "The design system has 15 packages organized into three tiers: core packages that every app needs, domain-specific packages for product areas like HR and Learning, and developer tooling for code generation."

### Package Map

```
                    ┌──────────────┐
                    │  @flare/tools │  (Code generators, Nx plugins)
                    └──────────────┘

    ┌───────────────────────────────────────────────┐
    │              Domain Packages                   │
    │                                               │
    │  core-hr  learning  performance  recruiting   │
    │  charts   patterns  grovo  pxp  ai            │
    │  core-cards  primitive-controls               │
    └───────────────────┬───────────────────────────┘
                        │ depends on
    ┌───────────────────▼───────────────────────────┐
    │              Core Packages                     │
    │                                               │
    │  @flare/primitives    (UI components)          │
    │  @flare/core-utils    (shared utilities)       │
    │  @flare/globalization (i18n)                   │
    └───────────────────────────────────────────────┘
```

### Package Details

| Package | Version | Key Dependencies | What It Does |
|---|---|---|---|
| **@flare/primitives** | 3.0.90 | xstyled, Radix UI, TanStack Table, TinyMCE, DnD Kit | Base UI components — buttons, inputs, modals, tables, rich text editor, drag-and-drop |
| **@flare/core-utils** | 3.0.3 | (none) | Shared utilities — HTTP helpers, formatters, validators |
| **@flare/globalization** | 3.0.6 | (none) | Date/time formatting, locale data fetching, culture-aware formatting |
| **@flare/patterns** | 3.0.40 | date-fns, DOMPurify, A2UI SDK | Higher-level organisms — complex layouts, AI chat patterns, form patterns |
| **@flare/charts** | 3.0.6 | Recharts | Data visualization — bar, line, pie, area charts |
| **@flare/learning** | 3.0.79 | react-hook-form | Learning management — training flyouts, course cards, assignment UIs |
| **@flare/performance** | 3.0.28 | Apollo Client, GraphQL, react-vis, @xyflow/react | Performance management — goal trees, review flows, org charts |
| **@flare/core-hr** | 3.0.11 | D3 | HR components — org charts, employee cards, D3 visualizations |
| **@flare/recruiting** | 3.0.6 | DOMPurify, html-react-parser, react-tooltip | Recruiting — resume viewers, job posting UIs, candidate cards |
| **@flare/grovo** | 3.0.5 | (none) | Grovo learning platform components |
| **@flare/ai** | — | — | AI-powered UI components (chat, suggestions) |
| **@flare/pxp** | — | — | People Experience Platform widgets |
| **@flare/tools** | 0.1.0 | ts-morph, Nx plugin API | Nx generators for scaffolding components, icons, packages |

### Peer Dependency Contract

> **Interview Tip:** "Why peer dependencies?" — Because consuming apps should control the React and styled-components version. We don't bundle React; we expect the host app to provide it.

Every domain package declares these as peer dependencies:
```json
{
  "peerDependencies": {
    "react": "19.2.5",
    "react-dom": "19.2.5",
    "styled-components": "5.3.6",
    "@flare/primitives": "*",
    "@flare/core-utils": "*"
  }
}
```

### Dual Module Output

All packages ship both CommonJS and ESM:
```json
{
  "main": "cjs/index.js",    // CommonJS for Node/Jest
  "module": "esm/index.js",  // ESM for bundlers (tree-shaking)
  "types": "esm/index.d.ts"  // TypeScript declarations
}
```

> **Interview Tip:** "Why dual output?" — CJS for backward compatibility with older build tools and Jest. ESM for tree-shaking in modern bundlers like Webpack 5 and Vite.

---

## 4. Build System & Tooling

**Interview Answer:** "Each package builds through `csod-lib-scripts`, our internal CLI wrapper that handles TypeScript compilation, bundling to CJS and ESM, and declaration file generation. Lerna orchestrates builds across packages, and Nx provides caching so unchanged packages skip rebuilding entirely."

### Build Pipeline

```
Source (TypeScript/TSX)
        │
        ▼
  csod-lib-scripts build
        │
        ├──► CJS output  (dist/cjs/)   — CommonJS modules
        ├──► ESM output  (dist/esm/)   — ES Modules (tree-shakeable)
        └──► Type defs   (dist/esm/*.d.ts)
        │
        ▼
  prepublishOnly: copies package.json into dist/
        │
        ▼
  lerna publish → Artifactory registry
```

### Key Build Scripts

| Script | What It Does | When It Runs |
|---|---|---|
| `yarn build` | Full build of all packages (respects dependency order) | Local development |
| `yarn build:ci:parallel` | Parallel build, skips Nx cache | CI pipeline |
| `yarn build:sanity:ci:parallel` | Fast build (no type checking) for sanity checks | CI — quick validation |
| `yarn affected:test:ci` | Typecheck + test only changed packages | CI — PR builds |
| `yarn affected:lint:ci` | Lint only changed packages | CI — PR builds |

### Nx Caching Strategy

```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],  // Build dependencies first
      "outputs": ["{workspaceRoot}/dist"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^default"],
      "outputs": ["{workspaceRoot}/coverage"],
      "cache": true
    }
  }
}
```

> **Interview Tip:** `"dependsOn": ["^build"]` means "before building package X, build all packages that X depends on." The `^` prefix means "upstream dependencies." This ensures primitives builds before learning, since learning imports from primitives.

### Code Generators (@flare/tools)

The `@flare/tools` package provides Nx generators for scaffolding:

```bash
yarn add:component    # Scaffold a new component with tests, stories, types
yarn add:icon         # Add a new icon to the icon library
yarn add:library      # Create a new sub-library within a package
yarn add:package      # Create an entirely new @flare package
```

These generators use `ts-morph` for AST manipulation — they update barrel exports, create boilerplate files, and wire up the component into the package's index.

---

## 5. Theming & Design Tokens

**Interview Answer:** "We have a custom theming system built on top of xstyled and styled-components. The theme is a JavaScript object that follows the Styled System Theme Specification. It defines colors, spacing, typography, elevation, z-index layers, and breakpoints. We don't use Style Dictionary — our tokens are defined directly in TypeScript and accessed through typed helper functions like `th.color('primary')` and `th.space('medium')`."

### Theme Architecture

```
┌─────────────────────────────────────────────┐
│              ThemeProvider                    │
│  (wraps xstyled's Provider)                  │
│                                             │
│  Props:                                      │
│  - baseColor?: string (override primary)     │
│  - customTheme?: () => Theme                 │
│  - enableTouchTarget?: boolean               │
│  - enableUniversalFocusMode?: boolean        │
│  - font?: FontsOptions                       │
│                                             │
│  Injects:                                    │
│  - Theme object into styled-components ctx   │
│  - CSODGlobalPageStyle (global CSS reset)    │
└──────────────────────┬──────────────────────┘
                       │
         Components access via th helpers
                       │
         th.color("primary") → "#005BF0"
         th.space("medium")  → 16
         th.fontSize(3)      → 16
```

### The `getTheme()` Function

Located at `src/packages/primitives/src/core-ui/src/utils/index.tsx`, this is the heart of the token system:

```typescript
export function getTheme(t?: string | Options): Theme {
  // Accepts optional baseColor override and font options
  // Returns a fully typed Theme object
}
```

> **Interview Tip:** "Why not Style Dictionary?" — Style Dictionary is great for multi-platform token distribution (web, iOS, Android). Our design system is React-only, so we keep tokens in TypeScript for full type safety. The `th` helpers are typed — `th.color("invalid")` is a compile-time error.

### Complete Token Reference

#### Colors (44 tokens)

```
Primary Scale:    primary (#005BF0), primary60, primary50, primary40, primary30, primary20
Success Scale:    success (#14B872), success60, success50, success40, success30, success20
Warning Scale:    warning (#FFAB00), warning60, warning50, warning40, warning30, warning20
Critical Scale:   critical (#DE350B), critical60, critical50, critical40, critical30, critical20
Neutral Scale:    black, grey70, grey60, grey50, grey40, grey30, grey20, grey10, white
Semantic:         darkText (#383838), text (#555555), lightText (#707070),
                  disabled (#BBBBBB), dividerLine (#E6E6E6), dividerArea (#F5F5F5)
Special:          accent (#9551EC), focus (#005FCC), corange (#FA4616)
```

> **Interview Tip:** "Why numbered color scales (primary60, primary40)?" — The number roughly maps to luminance. 60 is darker (hover/active states), 40 is lighter (backgrounds), 20 is the lightest tint. This gives designers a predictable palette without naming colors "primaryDark" or "primaryLight."

#### Spacing (10 tokens)

```
none: 0    xxxSmall: 2    xxSmall: 4    xSmall: 8     small: 12
medium: 16    large: 24    xLarge: 32    xxLarge: 48    xxxLarge: 56
```

All values are in pixels. Accessed via `th.space("medium")` which returns `16`.

#### Typography

```
Fonts:        body: "Lato, sans-serif"
              heading: "Lato, sans-serif"
              monospace: "Consolas, Menlo, Monaco, Courier, monospace"

Font Sizes:   [0, 12, 14, 16, 20, 24, 32, 48, 64, 72]  (index-based)
              th.fontSize(1) → 12, th.fontSize(3) → 16

Font Weights: thin(100), extraLight(200), light(300), normal(400),
              medium(500), semiBold(600), bold(700), extraBold(800), black(900)

Line Heights: text: 1.5, heading: 1.333, reset: 1
```

#### Elevation & Shadows

```
Elevation (Material Design style):
  xsmall → subtle lift (cards)
  small  → default card shadow
  medium → raised elements
  large  → modals, dialogs
  xlarge → popovers
  xxlarge → highest elevation
  Special: inset, footer, header

Legacy Shadows:
  small, medium, large, xlarge, flyout, footer, header
```

> **Interview Tip:** "Why both elevation and shadows?" — Elevation uses the Material Design multi-layer shadow approach (3 shadow layers per level). Legacy shadows are simpler 2-layer shadows kept for backward compatibility. New components should use elevation.

#### Z-Index Layering

```
default: 1       docked: 4        sticky: 100
fullScreen: 2000  popup: 5000      dialog: 6000
overlay: 8000     reminder: 8500   modal: 9000
dropdown: 9000    spinner: 9050    toast: 10000
```

> **Interview Tip:** "How do you prevent z-index wars?" — We define a strict z-index scale in the theme. Components use `th.zIndex("modal")` instead of hardcoded numbers. The scale ensures toasts always appear above modals, modals above overlays, etc.

#### Breakpoints

```
xs: 0      sm: 768     md: 1024
lg: 1280   xl: 1600    xxl: 1920
```

#### Border Radius

```
small: 2    medium: 4    large: 8    xlarge: 16    circle: "50%"
```

### Theme Customization

The `ThemeProvider` supports runtime customization:

```tsx
// Default theme
<ThemeProvider>
  <App />
</ThemeProvider>

// Custom primary color (white-labeling)
<ThemeProvider baseColor="#FF6B00">
  <App />
</ThemeProvider>

// Full custom theme
<ThemeProvider customTheme={() => myCustomTheme}>
  <App />
</ThemeProvider>

// Accessibility modes
<ThemeProvider enableTouchTarget enableUniversalFocusMode>
  <App />
</ThemeProvider>
```

> **Interview Tip:** `baseColor` is how we support white-labeling. A client can set their brand color, and the entire primary scale adjusts. `enableTouchTarget` adds a CSS class that increases hit areas to 44x44px for touch devices. `enableUniversalFocusMode` adds visible focus outlines on every focusable element.

---

## 6. Styled Components & CSS-in-JS

**Interview Answer:** "We use styled-components with xstyled, which adds a utility-props layer on top. Components are styled using tagged template literals with theme helpers. The `th` object provides typed access to all design tokens — `th.color('primary')`, `th.space('medium')`, etc. We also use `createGlobalStyle` for global resets and component-specific global styles."

### Styling Pattern

```tsx
import { styled, th } from "@flare/primitives/core-ui";

// Basic styled component with theme tokens
export const Button = styled.button`
  color: ${th.color("white")};
  background: ${th.color("primary")};
  padding: ${th.space("small")} ${th.space("medium")};
  border-radius: ${th.radius("medium")};
  font-weight: ${th.fontWeight("semiBold")};
  font-family: ${th.font("body")};
  box-shadow: ${th.elevation("small")};
  
  &:hover {
    background: ${th.color("primary60")};
  }
  
  &:disabled {
    background: ${th.color("disabled")};
  }
`;
```

### The `th` Helper API

The `th` object is a typed wrapper around xstyled's theme getters:

```typescript
th.color(value: ColorsType)           // → CSS color value
th.space(value: SpaceType)            // → pixel number
th.font(value: FontsType)             // → font-family string
th.fontSize(index: number)            // → pixel number
th.fontWeight(value: FontWeightsType) // → numeric weight
th.lineHeight(value: LineHeightsType) // → unitless ratio
th.radius(value: RadiiType)           // → pixel number or "50%"
th.shadow(value: ShadowsType)         // → box-shadow string
th.elevation(value: ElevationType)    // → multi-layer box-shadow
th.zIndex(value: ZIndicesType)        // → z-index number
th.space(value: SpaceType)            // → pixel number
th.breakpoint(value: BreakpointsType) // → pixel number
```

> **Interview Tip:** "Why xstyled over plain styled-components?" — xstyled adds the `th` helper system and responsive utility props. Instead of writing media queries manually, you can do `<Box p={{ xs: 2, md: 4 }} />`. It also provides the typed theme getter functions that prevent typos at compile time.

### Global Styles

```tsx
// CSODGlobalPageStyle — injected by ThemeProvider
export const CSODGlobalPageStyle = createGlobalStyle`
  :root {
    --flr-focus-outline: none;
    --flr-focus-outline-offset: 0px;
    --flr-focus-box-shadow: none;
  }
  
  .flr-universal-focus {
    // Overrides CSS custom properties for visible focus
  }
  
  body {
    font-variant-ligatures: no-common-ligatures;
    height: 100vh;
  }
  
  #cs-root * {
    font-family: 'Lato', sans-serif;
  }
`;
```

---

## 7. State Management

**Interview Answer:** "We don't use Redux, MobX, or Zustand. Since this is a component library — not an application — we use React Context API exclusively. Each complex component or feature area has its own context provider. We follow the compound component pattern where a parent provider manages state and child components consume it via context. This keeps the library framework-agnostic regarding state management — consuming apps can use whatever state manager they want."

### Why Context API Over Redux?

> **Interview Tip:** This is a critical distinction. A design system is NOT an application.

1. **Component library, not app**: We don't have global app state. Each component manages its own UI state.
2. **Encapsulation**: A `<Modal>` manages its own open/close state. A `<DataGrid>` manages its own sort/filter state. These don't need a global store.
3. **No opinion on consumer's state**: If we bundled Redux, every consuming app would need Redux. Context has zero external dependencies.
4. **Tree-shaking**: Context providers are co-located with their components. Unused components = unused contexts = tree-shaken away.

### Context Patterns Used

#### Pattern 1: Component-Level Context (Compound Components)

```tsx
// ToastsProvider — manages toast notification state
<ToastsProvider dismissButtonTitle="dismiss" timeout={3000}>
  <App />
</ToastsProvider>

// Any child can trigger toasts
const { addToast } = useToasts();
addToast({ message: "Saved!", type: "success" });
```

#### Pattern 2: Feature-Level Context

```tsx
// LocalizationProvider — provides locale data to all Flare components
<LocalizationProvider getLocalizations={() => fetchLocaleData(locale)}>
  <DirectionProvider dir="ltr">
    <App />
  </DirectionProvider>
</LocalizationProvider>
```

#### Pattern 3: Domain-Specific Context

```tsx
// Performance package — OrgChart context
<OrgChartProvider data={orgData}>
  <OrgChartCanvas />
  <OrgChartSidebar />
</OrgChartProvider>
```

### Key Contexts in the System

| Context | Package | Purpose |
|---|---|---|
| `ThemeProvider` | primitives/core-ui | Injects theme tokens into styled-components |
| `LocalizationProvider` | primitives/core-ui | Provides locale-aware string resolution |
| `DirectionProvider` | primitives/core-ui | RTL/LTR text direction |
| `ToastsProvider` | primitives/toasts | Toast notification queue management |
| `LiveAnnouncerProvider` | primitives | Screen reader live region announcements |
| `ModalStandardContext` | primitives | Modal open/close state, stacking |
| `DatePickerI18nContext` | primitives | Date picker localization |
| `DataGridDndContext` | primitives | Drag-and-drop state for data grids |
| `OrgChartContext` | performance | Org chart node/edge state |
| `SkillsDataContext` | performance | Skills assessment data |

### Provider Composition (Storybook Example)

This shows how providers are composed in the Storybook preview — the same pattern consuming apps follow:

```tsx
<ThemeProvider baseColor={theme} enableTouchTarget enableUniversalFocusMode>
  <LocalizationProvider getLocalizations={() => getStaticLocalizations(locale)}>
    <DirectionProvider dir={direction}>
      <ToastsProvider dismissButtonTitle="dismiss" timeout={3000}>
        <LiveAnnouncerProvider mode="global">
          <App />
        </LiveAnnouncerProvider>
      </ToastsProvider>
    </DirectionProvider>
  </LocalizationProvider>
</ThemeProvider>
```

> **Interview Tip:** "Isn't this provider hell?" — Yes, it's a known trade-off. But each provider is optional. An app that doesn't need toasts skips `ToastsProvider`. An app that doesn't need RTL skips `DirectionProvider`. This is more flexible than a monolithic provider that bundles everything.

---

## 8. Component Architecture

**Interview Answer:** "Each component follows a strict file structure — the component itself, its types, tests, stories, and an index barrel export. We use the compound component pattern for complex components, forward refs for DOM access, and TypeScript interfaces for all props. Components are organized by atomic design principles — primitives are atoms/molecules, patterns are organisms."

### File Structure Per Component

```
src/packages/primitives/src/
├── button/
│   ├── src/
│   │   ├── Button.tsx              # Main component implementation
│   │   ├── Button.types.ts         # Props interface, variant types
│   │   ├── Button.styled.tsx       # Styled components
│   │   └── index.ts                # Barrel export
│   ├── tests/
│   │   └── Button.test.tsx         # Unit tests (Jest + RTL)
│   ├── stories/
│   │   └── Button.stories.tsx      # Storybook stories
│   ├── index.ts                    # Package-level export
│   └── typedocs.md                 # Auto-generated API docs
```

### Component Patterns

#### Compound Components

```tsx
// Usage
<DataGrid data={rows} columns={cols}>
  <DataGrid.Header />
  <DataGrid.Body />
  <DataGrid.Pagination />
</DataGrid>

// Implementation — parent provides context, children consume it
const DataGridContext = React.createContext<DataGridState>(null);

export const DataGrid = ({ children, data, columns }) => {
  const [sortState, setSortState] = useState(null);
  return (
    <DataGridContext.Provider value={{ data, columns, sortState, setSortState }}>
      {children}
    </DataGridContext.Provider>
  );
};

DataGrid.Header = () => {
  const { columns, setSortState } = useContext(DataGridContext);
  // render sortable headers
};
```

#### Forwarded Refs

```tsx
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <InputWrapper>
        <Label>{label}</Label>
        <StyledInput ref={ref} aria-invalid={!!error} {...props} />
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </InputWrapper>
    );
  }
);
```

### Path Aliases

TypeScript path mapping enables clean cross-package imports:

```typescript
// tsconfig.base.json
{
  "paths": {
    "@flare/primitives/*": ["./src/packages/primitives/src/*"],
    "@flare/core-hr/*":    ["./src/packages/core-hr/src/*"],
    "@flare/learning/*":   ["./src/packages/learning/src/*"],
    "@flare/patterns/*":   ["./src/packages/patterns/src/*"],
    // ... all 15 packages
  }
}

// Usage in code
import { Button } from "@flare/primitives/button";
import { styled, th } from "@flare/primitives/core-ui";
```

---

## 9. Testing Strategy

**Interview Answer:** "We have four layers of testing. Unit tests with Jest and React Testing Library for component logic. Storybook interaction tests with Vitest for user flow scenarios. Visual regression tests with storybook-addon-vis for pixel-level screenshot comparison. And accessibility tests with jest-axe that run axe-core against every component. In CI, all four run on affected packages only."

### Testing Pyramid

```
                    ┌─────────┐
                    │   E2E   │  Playwright (e2e/ folder)
                    │ (fewer) │
                ┌───┴─────────┴───┐
                │  Visual Regress  │  storybook-addon-vis (SSIM comparison)
                │  A11y Tests      │  jest-axe (axe-core)
            ┌───┴─────────────────┴───┐
            │   Interaction Tests      │  Vitest + Storybook play functions
        ┌───┴─────────────────────────┴───┐
        │         Unit Tests               │  Jest 30 + React Testing Library
        │         (most tests)             │
        └─────────────────────────────────┘
```

### Layer 1: Unit Tests (Jest)

```bash
yarn test                    # Run all package tests
yarn primitives test         # Run primitives tests only
yarn affected:test:ci        # CI — only changed packages
```

**Configuration highlights:**
- Jest 30.2.0 with ts-jest (isolated modules for speed)
- `jest-environment-jsdom` for DOM simulation
- 5-minute timeout per test
- Mocks for `matchMedia`, `IntersectionObserver`, `ResizeObserver`, `MutationObserver`
- Path mapping mirrors tsconfig aliases

### Layer 2: Storybook Interaction Tests (Vitest)

```bash
yarn test:storybook:interaction   # Run play function tests
```

These use Storybook's `play` functions — they simulate real user interactions within stories:

```tsx
export const SubmitForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Name"), "John");
    await userEvent.click(canvas.getByRole("button", { name: "Submit" }));
    await expect(canvas.getByText("Success")).toBeInTheDocument();
  },
};
```

### Layer 3: Visual Regression Tests

```bash
yarn test:storybook:visual          # Compare against baselines
yarn test:storybook:visual:update   # Update baseline snapshots
```

Uses `storybook-addon-vis` with SSIM (Structural Similarity Index) comparison:
- 1% failure threshold
- Playwright browser rendering for consistency
- Baseline images stored in repo

### Layer 4: Accessibility Tests

```bash
yarn test:storybook:a11y    # Run axe-core against all stories
```

Runs `jest-axe` against rendered stories, checking WCAG 2.1 AA compliance.

### CI Test Commands

```bash
# Run everything together
yarn test:storybook:ci
# Equivalent to: ENABLE_INTERACTION=true ENABLE_VISUAL=true ENABLE_A11Y=true vitest

# Generate JSON report
yarn test:storybook:report
```

> **Interview Tip:** "How do you keep tests fast in CI?" — Three strategies: (1) Nx caching — unchanged packages skip tests entirely. (2) `affected` commands — only test packages touched by the PR. (3) Parallel execution — Vitest runs with 2 workers for Storybook tests, Jest runs per-package in parallel via Lerna.

---

## 10. Storybook & Documentation

**Interview Answer:** "Storybook is our single source of truth for component documentation. It's Vite-based (Storybook 10), serves all 15 packages in one instance, and includes interactive docs, design specs via Figma embeds, accessibility badges, and component status tags (stable, alpha, beta, deprecated). We also generate TypeDoc API docs and MDX guides for theming, migration, and contribution."

### Storybook Setup

| Aspect | Detail |
|---|---|
| **Version** | 10.2.17 |
| **Framework** | `@storybook/react-vite` |
| **Port** | 9001 (`yarn start`) |
| **Stories glob** | `src/packages/**/*.stories.@(ts|tsx)` + `docs/**/*.mdx` |

### Addons

| Addon | Purpose |
|---|---|
| `@storybook/addon-docs` | MDX documentation with remark-gfm |
| `@storybook/addon-a11y` | Accessibility panel (axe-core) |
| `@storybook/addon-designs` | Figma embed integration |
| `@storybook/addon-coverage` | Istanbul coverage overlay |
| `@storybook/addon-vitest` | In-browser test runner |
| `storybook-addon-vis` | Visual regression testing |
| `storybook-addon-tag-badges` | Status badges (stable, alpha, beta, deprecated, a11y) |
| `storybook-addon-test-codegen` | Generate test code from interactions |

### Component Status Badges

Stories are tagged to show maturity:

| Badge | Color | Meaning |
|---|---|---|
| **Stable** | Green | Production-ready, API frozen |
| **Beta** | Blue | API may change, usable in production |
| **Alpha** | Red | Experimental, expect breaking changes |
| **Deprecated** | Brown | Will be removed, migrate away |
| **A11Y** | Blue | Fully accessibility compliant |
| **A11Y Beta** | Blue | Accessibility work in progress |

### Global Decorators

Every story is wrapped with the full provider stack:

```tsx
// .storybook/provider.tsx
export const withGlobalProvider = (storyFn, context) => {
  const { locale, direction, theme, touchTarget, universalFocus } = context.globals;
  return (
    <ThemeProvider baseColor={theme} enableTouchTarget={touchTarget}>
      <LocalizationProvider getLocalizations={() => getStaticLocalizations(locale)}>
        <DirectionProvider dir={direction}>
          <ToastsProvider>
            <LiveAnnouncerProvider mode="global">
              {storyFn()}
            </LiveAnnouncerProvider>
          </ToastsProvider>
        </DirectionProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};
```

### Documentation Structure

```
docs/
├── flare/                    # Core docs
│   ├── 01-introduction.mdx
│   ├── 03-usage.mdx
│   ├── 04-guidelines.mdx
│   ├── 05-csod-theme.mdx     # Complete token reference
│   ├── 06-xssattack.mdx      # XSS prevention guide
│   └── 08-accessibility-issue-reporting-process.mdx
├── getting-started/          # Setup guides
├── accessibility/            # A11y guidelines
├── contribution/             # How to contribute
├── migration-guides/         # Version upgrade guides
├── analytics/                # Usage analytics
└── whats-new/                # Changelog
```

---

## 11. CI/CD Pipeline

**Interview Answer:** "We use PipelineKit (an internal Jenkins-based CI system) with Docker. The pipeline runs in a Node 24 Alpine container for builds and a Playwright container for visual/e2e tests. It runs affected tests, lints, builds, and generates Storybook docs. We use conventional commits for automated changelog generation and Lerna for publishing to our Artifactory registry."

### Pipeline Configuration

```yaml
# automation/config.yaml
WorkflowConfigs:
  rcl2-design-system:
    Language: nodejs
    DockerBaseImage: lerna-worker:9.0.6-node24.13.0-alpine3.23
    PlaywrightDockerBaseImage: playwright:1.58.0-noble
    FailBuildOnLint: true
    Scripts:
      Test: affected:test:ci
      Build: build:ci:parallel
      Lint: affected:lint:ci
      Analytics: analytics
      BuildStorybook: build-docs
      BuildSanity: build:sanity:ci:parallel
```

### CI Pipeline Flow

```
PR Created
    │
    ▼
┌─────────────────┐
│  Verify Yarn     │  (scripts/verify-yarn.ts)
│  Verify Versions │  (scripts/verify-version-bump.ts)
└────────┬────────┘
         │
    ▼────┴────▼
┌─────────┐ ┌─────────┐
│  Lint   │ │Typecheck │  (affected packages only)
└────┬────┘ └────┬────┘
     └─────┬─────┘
           │
     ▼─────┴─────▼
┌──────────┐ ┌──────────┐
│  Test    │ │  Build   │  (affected + parallel)
└────┬─────┘ └────┬─────┘
     └──────┬─────┘
            │
     ┌──────▼──────┐
     │  Analytics   │  (component validation)
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │ Build Docs   │  (Storybook static build)
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │   Publish    │  (Lerna → Artifactory)
     └─────────────┘
```

### Notifications

- **Teams**: `plk-flare-builds` channel
- **Email**: `DL-TECH-ENG-FlareUIKit@csod.com`

---

## 12. Code Quality & Git Workflow

**Interview Answer:** "We enforce quality at multiple gates. Pre-commit hooks run lint-staged which formats code, runs related tests, and updates snapshots. Commit messages follow conventional commits with Jira ticket IDs auto-prepended. ESLint extends our internal config with TypeScript sort-keys and React-specific rules. Prettier handles formatting. And we block direct version bumps in package.json — only CI can publish."

### Pre-Commit Pipeline (Husky + lint-staged)

```
git commit
    │
    ▼
.husky/pre-commit
    │
    ├── verify-yarn.ts        (ensure yarn is used, not npm)
    ├── verify-version-bump.ts (block manual version changes)
    └── lint-staged
         │
         ├── *.{ts,tsx}  →  Run related tests + update snapshots
         ├── *.{js,jsx,ts,tsx,json,md,mdx}  →  Prettier format
         └── src/packages/**/package.json  →  Prevent version bumps
```

### Commit Message Convention

```
.husky/prepare-commit-msg → jira-prepare-commit-msg
```

Format: `[JIRA-123] feat: add new button variant`

The `jira-prepare-commit-msg` hook auto-extracts the Jira ticket from the branch name and prepends it.

### ESLint Configuration

```javascript
// .eslintrc.js
{
  parser: "@typescript-eslint/parser",
  extends: "@uikit/csod-lib-scripts/eslintrc",  // Internal base config
  plugins: ["typescript-sort-keys", "sort-keys"],
  rules: {
    // Enforced
    "typescript-sort-keys/interface": "error",
    "sort-keys/sort-keys-fix": "error",
    "react/prop-types": "off",  // TypeScript handles this
    
    // Disabled (TODO: enable later)
    "@typescript-eslint/ban-ts-comment": "off",
    "prettier/prettier": "off",
  }
}
```

> **Interview Tip:** "Why sort-keys?" — With 15 packages and many contributors, sorted keys in interfaces and objects make diffs cleaner and reduce merge conflicts. Two people adding props to the same interface won't conflict if props are alphabetically sorted.

---

## 13. Accessibility

**Interview Answer:** "Accessibility is built into our development workflow at four levels. First, components use semantic HTML and ARIA attributes by default. Second, we have a `LiveAnnouncerProvider` that manages screen reader announcements via aria-live regions. Third, every story runs axe-core checks in Storybook. Fourth, we have a universal focus mode that adds visible focus indicators to every focusable element — toggled via `enableUniversalFocusMode` on the ThemeProvider."

### A11y Features

| Feature | Implementation |
|---|---|
| **Screen reader announcements** | `LiveAnnouncerProvider` with `mode="global"` — manages a single aria-live region |
| **Focus management** | Universal focus mode via CSS custom properties (`--flr-focus-outline`) |
| **Touch targets** | `enableTouchTarget` adds `.flr-touch-target` class — increases hit areas to 44x44px |
| **Automated testing** | jest-axe in unit tests + @storybook/addon-a11y in Storybook |
| **Status tracking** | `a11y` and `a11y-beta` story tags with visual badges |
| **Reporting** | `docs/flare/08-accessibility-issue-reporting-process.mdx` |

### Universal Focus Mode

```css
.flr-universal-focus {
  --flr-focus-outline: 2px solid #000000;
  --flr-focus-outline-offset: -2px;
  --flr-focus-box-shadow: 0 0 0 2px #FFFFFF, inset 0 0 0 4px #FFFFFF;
  
  * {
    &:focus-visible {
      outline: var(--flr-focus-outline) !important;
      outline-offset: var(--flr-focus-outline-offset) !important;
      box-shadow: var(--flr-focus-box-shadow) !important;
    }
  }
}
```

---

## 14. Internationalization

**Interview Answer:** "We support internationalization through the `@flare/globalization` package for date/time formatting and the `LocalizationProvider` in primitives for UI string localization. We currently ship locale data for English, French, and Hebrew. Hebrew is significant because it's RTL — we have a `DirectionProvider` that flips the entire layout direction, and our styled components use logical properties where possible."

### i18n Architecture

```
┌─────────────────────────────────────────┐
│           LocalizationProvider           │
│  getLocalizations={() => fetch(locale)}  │
│                                         │
│  Provides: localized strings to all     │
│  Flare components via context            │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           DirectionProvider              │
│  dir="ltr" | "rtl"                       │
│                                         │
│  Auto-detects: Hebrew → RTL             │
│  Wraps content in <div dir="rtl">       │
└─────────────────────────────────────────┘
```

### Supported Locales

| Locale | Language | Direction |
|---|---|---|
| `en-US` | English (US) | LTR |
| `fr-FR` | French | LTR |
| `he-IL` | Hebrew | RTL |

### Globalization Package

`@flare/globalization` handles culture-aware formatting:
- Date formatting based on user's culture
- Time formatting (12h vs 24h)
- Number formatting (decimal separators, grouping)
- Locale data fetched from a deployed service

---

## 15. Key Dependencies

**Interview Answer:** "Our major dependencies are React 19, styled-components 5 with xstyled for theming, TanStack Table for data grids, Radix UI for accessible primitives like dropdowns and collapsibles, Apollo Client for GraphQL in the performance package, Recharts for data visualization, TinyMCE for rich text editing, and DnD Kit for drag-and-drop. For testing we use Jest 30, Vitest, React Testing Library, and Playwright."

### Runtime Dependencies

| Library | Version | Used For | Package |
|---|---|---|---|
| React | 19.2.5 | UI framework | All |
| styled-components | 5.3.6 | CSS-in-JS | All |
| @xstyled/styled-components | 1.19.1 | Theme utilities, `th` helpers | primitives |
| @tanstack/react-table | 8.21.3 | Data grid / table | primitives |
| @tanstack/react-virtual | 3.13.12 | Virtualized lists | primitives |
| @radix-ui/react-dropdown-menu | 2.1.16 | Accessible dropdown | primitives |
| @radix-ui/react-collapsible | 1.1.12 | Accessible collapsible | primitives |
| @dnd-kit/core | 6.3.1 | Drag and drop | primitives |
| @tinymce/tinymce-react | 4.3.2 | Rich text editor | primitives |
| @tippyjs/react | 4.2.6 | Tooltips / popovers | primitives |
| Recharts | 2.12.7 | Charts | charts |
| D3 | 6.7.0 | Data visualization | core-hr |
| Apollo Client | 3.8.10 | GraphQL client | performance |
| @xyflow/react | 12.9.2 | Node-based flow diagrams | performance |
| react-vis | 1.12.1 | Visualization | performance |
| date-fns | 4.1.0 | Date utilities | patterns |
| DOMPurify | 3.4.0 | XSS sanitization | patterns, recruiting |
| downshift | 6.1.7 | Accessible combobox | performance |
| react-hook-form | 7.56.0 | Form management | learning |
| moment | 2.30.1 | Date handling (legacy) | primitives |

### Dev Dependencies

| Library | Version | Used For |
|---|---|---|
| TypeScript | 5.4.5 | Type checking |
| Jest | 30.2.0 | Unit testing |
| Vitest | 4.1.1 | Storybook testing |
| Playwright | 1.58.0 | Browser testing / E2E |
| @testing-library/react | 16.3.0 | Component testing |
| jest-axe | 10.0.0 | Accessibility testing |
| Storybook | 10.2.17 | Component documentation |
| Lerna | 9.0.6 | Monorepo management |
| Nx | 22.4.0 | Build caching / task runner |
| ts-morph | 27.0.2 | AST manipulation (code gen) |
| Vite | 7.2.7 | Storybook bundler |
| Husky | 9.1.7 | Git hooks |
| Prettier | 2.6.2 | Code formatting |

---

## 16. Common Interview Q&A

### Q: "Tell me about your project."

> "I work on the Flare Design System at Cornerstone OnDemand. It's an enterprise React component library organized as a monorepo with 15 packages. It serves as the single source of truth for UI across all CSOD products — HR, Learning, Performance, and Recruiting. I work on building and maintaining reusable components, ensuring accessibility compliance, and managing the design token system that powers our theming."

### Q: "Why a monorepo instead of separate repos?"

> "Three reasons. First, atomic changes — if I update a primitive component, I can update all downstream packages in the same PR and catch breakages immediately. Second, shared tooling — one ESLint config, one Jest setup, one TypeScript base config. Third, Nx gives us intelligent caching and affected commands, so CI only builds and tests what changed."

### Q: "How do you handle versioning?"

> "We use Lerna with independent versioning and conventional commits. Each package has its own version — primitives might be at 3.0.90 while charts is at 3.0.6. Lerna reads commit messages to determine version bumps: `fix:` → patch, `feat:` → minor, `BREAKING CHANGE:` → major. Changelogs are auto-generated."

### Q: "How does your theming system work?"

> "We have a `getTheme()` function that returns a typed JavaScript object with all design tokens — colors, spacing, typography, elevation, z-index, breakpoints. This object is injected via a `ThemeProvider` (wrapping styled-components' ThemeProvider). Components access tokens through typed helpers like `th.color('primary')` which resolves to `#005BF0`. The system supports white-labeling via a `baseColor` prop that overrides the primary color."

### Q: "Why styled-components over CSS Modules or Tailwind?"

> "styled-components gives us runtime theming — we can swap the entire color palette at runtime for white-labeling. It also co-locates styles with components, which is important for a publishable library. CSS Modules would require consumers to configure their bundler. Tailwind would impose utility classes on consumers. styled-components outputs scoped class names with zero configuration needed by the consumer."

### Q: "How do you ensure accessibility?"

> "Four layers. Semantic HTML and ARIA attributes in component code. A `LiveAnnouncerProvider` for screen reader announcements. Automated axe-core testing in both Jest and Storybook. And a universal focus mode that adds visible focus indicators to every focusable element. We also tag stories with a11y status badges so the team can track compliance progress."

### Q: "How do you handle breaking changes across 15 packages?"

> "Independent versioning means a breaking change in primitives doesn't force a major bump in learning. We use peer dependencies — consuming apps control which version of primitives they use. For coordinated breaking changes, we publish migration guides in our docs/ folder and use Lerna's `--force-publish` to bump all affected packages together."

### Q: "What's your testing strategy?"

> "Four layers: Jest unit tests for component logic, Storybook interaction tests for user flows, visual regression tests with SSIM comparison for pixel-level accuracy, and axe-core accessibility tests. In CI, we only run tests on affected packages using Nx's dependency graph. A full test suite takes about 8 minutes; a cached run with no changes takes 30 seconds."

### Q: "How do you handle performance in a large component library?"

> "Tree-shaking is the big one — we ship ESM modules so bundlers can eliminate unused components. Each package has `sideEffects: false` in package.json. We use `@tanstack/react-virtual` for virtualizing large lists and tables. And Nx caching keeps our build times manageable — unchanged packages are served from cache."

### Q: "How do new components get added?"

> "We have Nx generators via `@flare/tools`. Running `yarn add:component` scaffolds the component file, types file, test file, stories file, and updates the barrel export. The generator uses ts-morph for AST manipulation. After scaffolding, the developer implements the component, writes tests, creates stories, and tags the story with a maturity badge (alpha → beta → stable)."

### Q: "How do you handle GraphQL?"

> "Only the `@flare/performance` package uses GraphQL, via Apollo Client 3.8.10. It has its own `codegen.ts` config that uses `@graphql-codegen/client-preset` to generate typed hooks and operations from `.graphql` files. The GraphQL layer is isolated to that package — other packages use REST or are purely presentational."

### Q: "What would you improve about the architecture?"

> "A few things: (1) We still have `moment.js` in primitives — I'd migrate to date-fns which is already used in patterns. (2) styled-components 5 is in maintenance mode — evaluating a migration path to v6 or a zero-runtime solution. (3) Some packages have inconsistent peer dependency versions for `@types/react`. (4) The design tokens are hardcoded in TypeScript — adopting a tool like Style Dictionary would let us generate tokens for multiple platforms if needed."

---

*Generated from codebase audit of `rcl2-design-system`. Last updated: April 2026.*
