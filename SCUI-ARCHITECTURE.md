# SCUI — Saba Cloud UI Architecture Overview (10-Minute Interview Guide)

## What is SCUI?

SCUI (Saba Cloud UI) is the **enterprise Angular application** that powers the Saba Cloud / Cornerstone OnDemand product suite. It's a monorepo on `code.saba.com` containing the full SPA — covering Learning, Performance, Compensation, Analytics, Recruiting, eCommerce, Content & Social, and Meeting modules — all built on top of the **Torque** component library.

**Tech Stack:** Angular (same version as Torque) · TypeScript · Angular CLI · Torque UI Platform · NgRx · RxJS · Karma/Jasmine

---

## Project & Repository Architecture

### Fork-Based Monorepo Model

SCUI uses a **centralized monorepo with domain-team forks** — a distinctive pattern for large enterprise teams:

```
SCUI Project (code.saba.com/projects/SCUI)
│
├── main          ← Central integration repo (develop + release/* branches)
│                    All PRs merge HERE from domain forks
│
├── learning      ← Fork: Learning team (courses, catalog, instructors desk, roster)
├── common        ← Fork: Shared/common code team
├── cert-search   ← Fork: Certification & Search team (eCommerce, assign learning)
├── compensation  ← Fork: Compensation module team
├── content-social← Fork: Content & Social module team
├── meeting       ← Fork: Meeting/virtual classroom team (Saba Meeting)
├── performance   ← Fork: Performance management team
├── platform      ← Fork: Platform/infrastructure team (advanced search, LOV)
├── recruiting    ← Fork: Recruiting module team (archived)
├── talent        ← Fork: Talent module team (archived)
├── analytics     ← Fork: Analytics/reporting team (archived)
├── di            ← Fork: DI module team (archived)
├── uxe           ← Fork: UX Engineering team (cross-cutting, Torque uptakes)
├── nova          ← Fork: Nova team (extended marketplace, newer features)
└── ecommerce-api ← Fork: eCommerce API team (archived)
```

**Key Insight:** Each domain team works in their own fork, creates feature branches there, and raises PRs against `main/develop`. This gives teams autonomy while keeping a single source of truth.

### Branching Strategy

```
main repo:
  ├── develop          ← Active development (all PRs target here)
  ├── release/u64      ← Release branch (e.g., Update 64)
  ├── release/u65      ← Next release branch
  └── master           ← Production

Domain fork (e.g., learning):
  ├── develop          ← Synced from main/develop
  ├── u65-inst-4       ← Feature branch (Update 65, Instructor feature #4)
  ├── fix/SBX-254025   ← Bug fix branch (Jira ticket)
  └── hc_main          ← Feature integration branch
```

Release naming follows `u{XX}` pattern (Update 64, Update 65, etc.) — quarterly release cadence.

---

## Directory Structure (Inside the Monorepo)

```
scui/                                      # Angular CLI Monorepo
│
├── apps/
│   └── saba-cloud/                        # ── Main Application ──────────────
│       └── src/
│           ├── app/
│           │   ├── app-routing.module.ts   #   Master route config (lazy-loads all modules)
│           │   └── app.module.ts           #   Root module
│           └── tsconfig.app.json           #   App-specific TS config
│
├── libs/                                  # ── Feature Libraries ─────────────
│   │
│   ├── learning/                          # @scui/learning — Learning Domain
│   │   ├── event-detail/                  #   ├─ Event/Course Detail
│   │   │   └── course-detail/             #   │  ├─ Course detail views
│   │   │       ├── app/                   #   │  │  ├─ App module (routing, bootstrap)
│   │   │       │   └── src/               #   │  │  │  ├─ *-app-routing.module.ts
│   │   │       │       ├── pxp-course-detail-app/  │  │  ├─ PXP variant component
│   │   │       │       └── course-detail-app/      │  │  └─ Standard variant
│   │   │       ├── core/                  #   │  │  ├─ Core (labels, services, models)
│   │   │       │   └── src/               #   │  │  │  └─ course-detail.label.ts
│   │   │       └── ui/                    #   │  │  └─ UI (presentational components)
│   │   │           └── src/               #   │  │     ├─ pxp-header/
│   │   │               └── pxp-header/    #   │  │     └─ course-detail-ui.module.ts
│   │   │
│   │   ├── simplified-course/             #   ├─ Simplified Course Creation
│   │   │   └── simplified-course-creation/
│   │   │       ├── app/                   #   │  ├─ App layer
│   │   │       ├── core/                  #   │  ├─ Core layer
│   │   │       └── ui/                    #   │  └─ UI layer
│   │   │
│   │   ├── instructors-desk/              #   ├─ Instructor's Desk
│   │   │   ├── roster/                    #   │  ├─ Roster management
│   │   │   │   └── ui/src/lib/            #   │  │  ├─ bulk-add-csv/
│   │   │   │       ├── bulk-add-csv/      #   │  │  ├─ roster-grid-actions/
│   │   │   │       └── roster-grid-actions/
│   │   │   └── shared/                    #   │  └─ Shared across instructor features
│   │   │       ├── credit-mark-delivered/ #   │     ├─ Credit & attendance
│   │   │       │   └── src/lib/           #   │     │  └─ attendance-actions/
│   │   │       └── facade/               #   │     └─ Facade service
│   │   │           └── src/lib/services/  #   │        └─ instructors-desk.service.ts
│   │   │
│   │   ├── browse/                        #   ├─ Browse/Search catalog
│   │   ├── catalog/                       #   ├─ Learning catalog
│   │   └── ...                            #   └─ More learning sub-features
│   │
│   ├── analytics/                         # @scui/analytics — Reporting & Insights
│   │   ├── insight/                       #   ├─ Insight charts & dashboards
│   │   ├── report-filter/                 #   ├─ Report filtering
│   │   └── ...
│   │
│   ├── performance/                       # @scui/performance — Performance Mgmt
│   │   ├── evolve/                        #   ├─ Evolve configs & dashboard
│   │   └── ...
│   │
│   ├── compensation/                      # @scui/compensation
│   ├── content-social/                    # @scui/content-social
│   ├── meeting/                           # @scui/meeting (Saba Meeting / virtual classroom)
│   ├── ecommerce/                         # @scui/ecommerce (assign learning, catalog purchase)
│   ├── platform/                          # @scui/platform (advanced search, LOV, shared infra)
│   ├── extended-marketplace/              # @scui/extended-marketplace (Nova)
│   └── recruiting/                        # @scui/recruiting (archived)
│
├── .angular-cli.json / angular.json       # Angular CLI workspace config
├── tslint.json / .eslintrc                # Linting config
├── package.json                           # Root dependencies
└── tsconfig.json                          # Root TypeScript config
```

---

## The Three-Layer Architecture Pattern

Every feature in SCUI follows a strict **app / core / ui** layering:

```
┌─────────────────────────────────────────────────┐
│                    app/ layer                     │
│  Routing, lazy-loaded module, page composition   │
│  *-app-routing.module.ts, *-app.module.ts        │
│  *-app.component.ts (smart/container component)  │
├─────────────────────────────────────────────────┤
│                    core/ layer                    │
│  Business logic, services, models, labels        │
│  *-core.module.ts, *.service.ts, *.label.ts      │
│  Facade services, NgRx state (if needed)         │
├─────────────────────────────────────────────────┤
│                    ui/ layer                      │
│  Presentational components (dumb components)     │
│  *-ui.module.ts, *.component.ts/html/scss        │
│  No direct service injection, @Input/@Output     │
└─────────────────────────────────────────────────┘
```

**Example — Course Detail:**
```
libs/learning/event-detail/course-detail/
├── app/src/
│   ├── course-detail-app-routing.module.ts    ← Route definitions
│   ├── course-detail-app.module.ts            ← Imports core + ui modules
│   └── course-detail-app/
│       └── course-detail-app.component.ts     ← Container: orchestrates data
│
├── core/src/
│   ├── course-detail-core.module.ts           ← Services, guards, resolvers
│   └── course-detail.label.ts                 ← i18n label keys
│
└── ui/src/
    ├── course-detail-ui.module.ts             ← Declares all UI components
    └── pxp-header/
        ├── pxp-header.component.ts            ← Presentational only
        ├── pxp-header.component.html
        └── pxp-header.component.scss
```

---

## Key Architecture Decisions

### 1. Fork-Based Team Isolation

Unlike Torque (which uses a single repo with Nx), SCUI uses Bitbucket forks to give each domain team their own sandbox:

| Aspect | How It Works |
|---|---|
| **Autonomy** | Teams push freely to their fork without blocking others |
| **Integration** | PRs from forks → `main/develop` with mandatory code review |
| **Sync** | Teams periodically sync their fork from `main/develop` |
| **Release** | Release branches cut from `main/develop` → `release/u{XX}` |
| **Hotfix** | Cherry-pick PRs to release branches (e.g., `fix/MR/SBX-253181`) |

### 2. Torque as the UI Foundation

SCUI consumes Torque as an npm dependency. Torque uptakes are managed by the UXE team via automated PRs:

```
Torque v16.0.0-build.36  →  PR "Uptake latest Torque v16.0.0-build.36"
                              (from uxe fork → main/develop)
                              Updates package.json + lock file
```

This means SCUI components use `<trq-button>`, `<trq-datagrid>`, `<trq-modal>`, etc. from `@torque/ui/*` and platform services from `@torque/core/platform`.

### 3. PXP (People Experience Platform) Variants

Some features have dual implementations — a standard Saba view and a PXP variant:

```
course-detail/
├── app/src/course-detail-app/          ← Standard Saba experience
└── app/src/pxp-course-detail-app/      ← PXP (Cornerstone) experience
```

This supports the Saba → Cornerstone product convergence, where the same backend serves different UX experiences.

### 4. Facade Pattern for Complex Features

Complex features like Instructor's Desk use a shared facade service:

```
libs/learning/instructors-desk/
├── shared/facade/src/lib/services/
│   └── instructors-desk.service.ts     ← Facade: single API for roster,
│                                          attendance, credits, sessions
├── roster/ui/                          ← Roster UI consumes facade
└── shared/credit-mark-delivered/       ← Credit UI consumes facade
```

### 5. Lazy Loading via Route-Based Code Splitting

Each feature module is lazy-loaded through `app-routing.module.ts`:

```typescript
// apps/saba-cloud/src/app/app-routing.module.ts
const routes: Routes = [
  {
    path: 'learning/course-detail',
    loadChildren: () => import('@scui/learning/event-detail/course-detail/app')
      .then(m => m.CourseDetailAppModule)
  },
  {
    path: 'learning/simplified-course',
    loadChildren: () => import('@scui/learning/simplified-course/app')
      .then(m => m.SimplifiedCourseCreationAppModule)
  },
  // ... 50+ lazy-loaded routes
];
```

### 6. Automated Code Review Bot

PRs to `main` are automatically reviewed by `svc-autoreviewbot` — an automated review participant that checks code quality, conventions, and potential issues before human reviewers.

---

## Relationship: SCUI ↔ Torque ↔ Product

```
┌──────────────────────────────────────────────────────────┐
│                    Saba Cloud Product                     │
│                  (deployed to customers)                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              SCUI (This Repo)                        │ │
│  │  apps/saba-cloud/  ← Main SPA entry point           │ │
│  │  libs/learning/    ← Learning domain features       │ │
│  │  libs/analytics/   ← Analytics domain features      │ │
│  │  libs/performance/ ← Performance domain features    │ │
│  │  libs/platform/    ← Shared platform features       │ │
│  │  libs/meeting/     ← Meeting domain features        │ │
│  │  libs/ecommerce/   ← eCommerce domain features      │ │
│  │  ... (10+ domain libraries)                          │ │
│  └──────────────┬──────────────────────────────────────┘ │
│                 │ consumes                                │
│  ┌──────────────▼──────────────────────────────────────┐ │
│  │              Torque (Separate Repo)                   │ │
│  │  @torque/ui/*       ← 60+ UI components              │ │
│  │  @torque/forms/*    ← 20+ form components             │ │
│  │  @torque/core/*     ← CDK, platform services          │ │
│  │  @torque/framework  ← App shell (header, nav, footer) │ │
│  │  @torque/assets     ← Themes, SCSS, icons             │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  Backend: Java/REST APIs (separate repos)                │
└──────────────────────────────────────────────────────────┘
```

---

## Development Workflow

```
Developer (e.g., on Learning team):
  1. Work in learning fork (code.saba.com/projects/SCUI/repos/learning)
  2. Create feature branch: u65-inst-4 or fix/SBX-254025
  3. Commit with conventional format: fix(learning): SBX-254025 description
  4. Raise PR from learning fork → main/develop
  5. Reviewers: domain lead + cross-team reviewers + svc-autoreviewbot
  6. After approval → merge to main/develop
  7. Release manager cuts release/u65 branch when ready

Torque Uptake:
  1. Torque team publishes new build (e.g., v16.0.0-build.36)
  2. BitBot (automated) creates PR from uxe fork → main/develop
  3. UXE team reviews + resolves any breaking changes
  4. Merge → all teams get new Torque on next sync
```

---

## Quick-Reference: Interview Talking Points

| Topic | Key Point |
|---|---|
| **Scale** | 10+ domain modules, 16 repos (forks), 50+ lazy-loaded routes |
| **Architecture** | Three-layer pattern: app (routing) / core (logic) / ui (presentation) |
| **Team Model** | Fork-per-team with centralized integration via PRs to main |
| **UI Foundation** | Torque component library consumed as npm dependency |
| **Code Splitting** | Route-based lazy loading — each feature is a separate chunk |
| **State** | Facade pattern for complex features, NgRx where needed |
| **PXP Strategy** | Dual UX variants (Saba + PXP) for product convergence |
| **Release** | Quarterly updates (u64, u65...) with release branches |
| **Automation** | Auto-review bot, automated Torque uptake PRs via BitBot |
| **Jira Integration** | Commit messages link to SBX-*/SPC-*/SM-* tickets |
| **Branching** | develop → release/u{XX} → master, with cherry-pick hotfixes |
| **Quality** | Mandatory PR reviews, conventional commits, automated checks |


---

## CI/CD Pipeline

### Build Infrastructure

Both Torque and SCUI use **TeamCity** as the CI server, with shell scripts orchestrating build steps via TeamCity service messages (`##teamcity[...]`).

### Torque CI Pipeline (Upstream — Feeds into SCUI)

```
Torque PR Merge → TeamCity Build Chain:

┌─────────────────────────────────────────────────────────────────┐
│  Sanity Part 1 — Quality Gates                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐ │
│  │ yarn     │→ │ lint:ts       │→ │ lint:scss│→ │ sandbox    │ │
│  │ install  │  │ (ESLint +    │  │ (Style-  │  │ setup      │ │
│  │ --frozen │  │  @torque/    │  │  lint)   │  │            │ │
│  │ lockfile │  │  eslint-     │  │          │  │            │ │
│  │          │  │  plugin)     │  │          │  │            │ │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────┘ │
│                                                    ↓            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Unit Tests (test:ci) — Karma/Jasmine                    │  │
│  │  Runs all affected component specs                       │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Sanity A11y — Accessibility Gate                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  test:ci --configuration=a11y                            │  │
│  │  Dedicated a11y test suite (separate from unit tests)    │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Sanity Part 2 — Build Verification                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ build:   │→ │ Styleguide   │→ │ Styleguide build:prod    │ │
│  │ prod     │  │ lint (TS +   │  │ (dry-run, last 1 Chrome) │ │
│  │ (Torque) │  │ SCSS)        │  │                          │ │
│  └──────────┘  └──────────────┘  └──────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Sanity Part 3 — E2E Tests                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Cypress E2E (suite1, suite2, or all)                    │  │
│  │  lite-server serves Styleguide → Cypress runs against it │  │
│  │  Uses cypress-parallel + cypress-multi-reporters          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```


### Torque Publish Pipeline

After sanity passes, Torque publishes **15 packages** to Artifactory:

```
npm run build:rtl → npm run prepublishOnly → Publish sequence:

  @torque/core                    ← Platform services, CDK, utils
  @torque/ui                      ← 60+ UI components
  @torque/forms                   ← 20+ form components
  @torque/framework               ← App shell (header, nav, footer)
  @torque/assets                  ← Themes, SCSS, icons
  @torque/patterns                ← Design patterns
  @torque/eslint-plugin           ← Template a11y + recommended rules
  @torque/lego                    ← Angular ↔ Web Component bridge
  @torque/nx-plugin               ← Nx generators
  @torque/lego-plugin             ← Lego Nx plugin
  @lego/design-tokens             ← Figma → CSS custom properties
  @lego/cdk                       ← Web Component base styles
  @lego/icons                     ← Lucide-based icon system
  @lego/elements-galaxy           ← Lit Web Components (header, menu)
  @lego/elements-sbx              ← SBX Web Components
  + Vendor forks: ng-sidebar, ngx-perfect-scrollbar, ngx-popper

Registry: Artifactory (internal npm registry)
```

### SCUI CI Pipeline (Downstream — Consumes Torque)

```
SCUI PR → TeamCity/Jenkins Build:

  1. yarn install --frozen-lockfile
     └── Pulls @torque/* from Artifactory (pinned version in package.json)

  2. Lint (ESLint + @torque/eslint-plugin template-a11y rules)
     └── Enforces a11y rules on all Angular templates

  3. Unit Tests (Karma/Jasmine)
     └── Per-module test suites

  4. Build (Angular CLI production build)
     └── Lazy-loaded chunks per feature module

  5. svc-autoreviewbot automated review
     └── Code quality + convention checks
```


### Torque Uptake in SCUI

```
Torque v16.0.0-build.36 published to Artifactory
        ↓
BitBot (automated) OR UXE team (manual) creates PR:
  Source: uxe fork / chore/uptake-torque-16.0.0-build.36
  Target: main/develop
        ↓
PR updates:
  - package.json (@torque/* version bumps)
  - yarn.lock / package-lock.json
  - Any breaking change migrations
        ↓
UXE team reviews → Merge → All domain teams get new Torque on next sync
```

**Interview One-Liner:** "Torque publishes 15 packages to Artifactory via TeamCity. SCUI consumes them as npm dependencies, with automated uptake PRs from the UXE team ensuring controlled version upgrades across all domain teams."

---

## Release Process

### Release Cadence

SCUI follows a **quarterly release cadence** with `u{XX}` (Update) naming:

```
Timeline (observed from Bitbucket data):
  u42 → u43 → u45 → u46 → u48 → ... → u60 → u64 → u65
  (~2018)                                      (~2025)  (~2026)

Each "Update" = a quarterly product release to customers
```

### Release Branch Flow

```
                    Feature PRs
                        ↓
  develop ──────────────●──────────────●──────────── (active development)
       │                               │
       ├── release/u64 ────────────────┤──── (stabilization, bug fixes only)
       │                               │
       ├── release/u65 ────────────────┤──── (next release, cut from develop)
       │                               │
       └── master ─────────────────────┘──── (production, tagged releases)
```


### Release Steps

| Step | Action | Example |
|------|--------|---------|
| 1. Feature Freeze | Cut `release/u65` branch from `develop` | `git checkout -b release/u65 develop` |
| 2. Stabilization | Only bug fix PRs allowed to release branch | `fix/SBX-254025` → `release/u65` |
| 3. Torque Pin | Pin Torque to a stable build for the release | `@torque/ui@16.0.0-build.36` |
| 4. QA Cycle | Full regression + 508 accessibility testing | Manual + automated |
| 5. Release Tag | Tag and deploy from release branch | `v65.0.0` |
| 6. Merge Back | Merge release branch → master → develop | Ensures fixes flow back |

### Torque Version Alignment

SCUI CI prints the consumed Torque version for traceability:

```bash
# From teamcity-helpers.sh
printTorqueVersionInNodeModules() {
  packageVersion=$(node -pe "require('./node_modules/@torque/core/package.json').version")
  logMessage "Torque Version in node_modules is ${packageVersion}"
}
```

**Interview One-Liner:** "We follow quarterly releases (u64, u65...) with a develop → release branch → master flow. Release branches are stabilization-only — no new features, just bug fixes and cherry-picks."

---

## Hotfix Process

### Standard Hotfix (Direct to Release Branch)

For critical production issues that need to go into an active release:

```
Scenario: Critical bug found in production (running u64)

  1. Developer creates hotfix branch from release:
     hotfix/SPC-140158  (from release/u43)

  2. PR raised directly to release branch:
     hotfix/SPC-140158 → release/u43

  3. After merge, release branch is re-deployed

  4. Fix is cherry-picked back to develop
```

**Observed PR patterns from Bitbucket:**
- `hotfix/SPC-140158` → `release/u43`
- `hotfix/SBX-*` → `release/u{XX}`


### Cherry-Pick / Maintenance Release (MR) Hotfix

For fixes that need to go into older, already-shipped releases:

```
Scenario: Bug found in u60 (customer still on older version)

  1. Fix is developed on develop (or already merged)

  2. Cherry-pick branch created:
     fix/MR/SBX-253181  (from release/u64)

  3. PR raised to the target release branch:
     fix/MR/SBX-253181 → release/u64

  4. Naming convention: fix/MR/* = Maintenance Release cherry-pick
```

**Observed PR patterns from Bitbucket:**
- `fix/MR/SBX-253181` → `release/u64`
- `fix/MR/SBX-*` → `release/u{XX}`

### Hotfix Decision Matrix

| Scenario | Branch Pattern | Target | Flow |
|----------|---------------|--------|------|
| Critical prod bug | `hotfix/SPC-*` | `release/u{current}` | Direct fix → release → cherry-pick to develop |
| Bug in older release | `fix/MR/SBX-*` | `release/u{older}` | Cherry-pick from develop → older release |
| Normal bug fix | `fix/SBX-*` | `develop` | Standard PR flow from domain fork |
| Feature work | `u65-feature-name` | `develop` | Standard PR flow from domain fork |

**Interview One-Liner:** "We have two hotfix paths — `hotfix/*` goes directly to the active release branch for critical issues, while `fix/MR/*` cherry-picks fixes into older maintenance releases for customers not yet on the latest update."

---

## Performance Optimization

### Bundle Size Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Bundle Optimization                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Route-Based Lazy Loading (50+ lazy chunks)               │
│     loadChildren: () => import('@scui/learning/...')          │
│     → Each feature = separate JS chunk, loaded on demand     │
│                                                               │
│  2. Torque Secondary Entry Points (tree-shaking)             │
│     import { TrqButtonModule } from '@torque/ui/button'      │
│     → Only imported components are bundled                    │
│     → 80+ independently importable entry points              │
│                                                               │
│  3. Three-Layer Architecture (natural code splitting)        │
│     app/ → routing chunk                                      │
│     core/ → business logic chunk                              │
│     ui/ → presentational chunk                                │
│     → Layers can be shared across features                    │
│                                                               │
│  4. Angular Production Build Optimizations                    │
│     → AOT compilation (Ahead-of-Time)                        │
│     → Dead code elimination                                   │
│     → Minification + compression                              │
│     → Differential loading (ES2015+ / ES5)                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```


### Runtime Performance Patterns

| Pattern | Where Used | Impact |
|---------|-----------|--------|
| **OnPush Change Detection** | All Torque components + SCUI presentational components | Reduces CD cycles by 60-80% — only checks on @Input reference change or async pipe |
| **Virtual Scrolling** | `@torque/ui/virtual-scroll`, Datagrid | Renders only visible rows — handles 10K+ row datasets |
| **shareReplay({ bufferSize: 1, refCount: true })** | All Facade observables | Single execution for multiple subscribers, auto-cleanup |
| **trackBy** | All `*ngFor` in Torque components | Prevents DOM re-creation on list updates |
| **Lazy Loading** | 50+ route modules | Initial bundle only loads shell + first route |
| **Memoize Pipe** | `@torque/core/cdk` | Caches pure function results in templates |
| **HTTP Interceptors** | In-flight dedup, response caching | Prevents duplicate API calls, caches GET responses |

### Performance Monitoring (Observed from PR Data)

From PR #17235 (analytics fix): SCUI integrates analytics tracking that monitors:
- Page load times per module
- Route transition performance
- API response times
- Error rates per feature

**Interview One-Liner:** "Performance is addressed at every layer — Torque provides tree-shakeable components with OnPush and virtual scrolling, SCUI adds route-based lazy loading for 50+ features, and the Facade pattern with shareReplay prevents redundant API calls and change detection cycles."

---

## Accessibility Testing

### Multi-Layer Accessibility Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              Accessibility Testing Pyramid                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Static Analysis (CI — Every PR)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  @torque/eslint-plugin — template-a11y config            ││
│  │  ├── alt-text: error           (images need alt)         ││
│  │  ├── valid-aria: error         (valid ARIA attributes)   ││
│  │  ├── elements-content: error   (non-empty elements)      ││
│  │  ├── table-scope: error        (table scope attribute)   ││
│  │  ├── label-has-associated-control: error                 ││
│  │  ├── role-has-required-aria: error                       ││
│  │  ├── mouse-events-have-key-events: error                 ││
│  │  ├── no-positive-tabindex: error                         ││
│  │  ├── no-autofocus: error                                 ││
│  │  ├── no-duplicate-attributes: error                      ││
│  │  └── button-has-type: error    (custom Torque rule)      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Layer 2: Component-Level A11y Tests (CI — Dedicated Suite)  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  npm run test:ci --configuration=a11y                    ││
│  │  Separate Karma test configuration for a11y specs        ││
│  │  Runs as dedicated CI step (sanity-a11y.sh)              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Layer 3: Storybook A11y Audits (Visual Review)              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  @storybook/addon-a11y (axe-core integration)            ││
│  │  Every component story has a11y panel                    ││
│  │  Checks: color contrast, ARIA roles, keyboard nav        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Layer 4: Manual 508 Testing (QA — Release Cycle)            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Screen reader testing (JAWS, NVDA, VoiceOver)           ││
│  │  Keyboard-only navigation testing                        ││
│  │  Section 508 compliance checklist                        ││
│  │  (Referenced in PR descriptions: "508 testing")          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```


### Torque CDK A11y Services (Used by SCUI)

| Service / Directive | Purpose | Example |
|---|---|---|
| **FocusKeyManager** | Arrow-key navigation within lists/menus | Datagrid rows, dropdown options |
| **TabTrap** | Traps Tab focus within modals/dialogs | Modal, flyout, sidebar |
| **AriaList** | Manages `aria-activedescendant` for lists | Select, autocomplete |
| **HotkeyService** | Global keyboard shortcut registration | Ctrl+S save, Esc close |
| **AriaService** | Adds keyboard event handlers to interactive elements | Click → Enter/Space support |
| **LiveAnnouncer** | Screen reader announcements via `aria-live` | Form errors, toast messages |
| **FocusableItem** | Marks items as focusable in a managed list | Tab navigation sequences |
| **KeyboardSelect** | Keyboard selection in complex widgets | Multi-select, tree-view |

### Real-World A11y Pattern (From PR #11695)

```
PR: "fix: TRQ-4114 - error announce in password validator"

Problem: Screen readers not announcing form validation errors

Solution:
  1. Added role="alert" to error message container
     → Screen reader announces immediately when error appears

  2. Used TrqLiveAnnouncerService.announce() method
     → Programmatic announcement for dynamic error messages

  3. Added trqErrorDelay configuration
     → Prevents rapid-fire announcements during typing
     → Debounces error announcements for better UX

Pattern:
  <div role="alert" *ngIf="hasError">
    {{ errorMessage }}
  </div>

  // In component:
  this.liveAnnouncer.announce(errorMessage, 'assertive');
```

### ESLint A11y Rules Detail

The `@torque/eslint-plugin` `template-a11y` config enforces these rules at lint time:

```typescript
// From libs/plugins/eslint/src/configs/template-a11y.ts
{
  '@angular-eslint/template/alt-text': 'error',
  '@angular-eslint/template/valid-aria': 'error',
  '@angular-eslint/template/elements-content': ['error', {
    allowList: ['trqTranslate']  // Torque i18n directive exemption
  }],
  '@angular-eslint/template/table-scope': 'error',
  '@angular-eslint/template/label-has-associated-control': 'error',
  '@angular-eslint/template/role-has-required-aria': 'error',
  '@angular-eslint/template/mouse-events-have-key-events': 'error',
  '@angular-eslint/template/no-positive-tabindex': 'error',
  '@angular-eslint/template/no-autofocus': 'error',
  '@angular-eslint/template/no-duplicate-attributes': 'error'
}

// Note: These are intentionally commented out because Torque's
// AriaService handles them at runtime:
// - interactive-supports-focus  → AriaService adds keyboard handlers
// - click-events-have-key-events → AriaService adds Enter/Space
```

**Key Insight:** Torque's `AriaService` handles keyboard interaction at runtime (adding Enter/Space handlers to clickable elements), so the corresponding ESLint rules are disabled to avoid false positives. This is a deliberate architectural decision — runtime a11y service + static lint rules complement each other.

**Interview One-Liner:** "We have a four-layer a11y strategy — static ESLint rules catch template issues at PR time, dedicated a11y test suites run in CI, Storybook axe-core audits catch visual/ARIA issues, and manual 508 testing with screen readers validates the full user experience before each release."

---

## Updated Interview Talking Points

| Topic | Key Point |
|---|---|
| **CI/CD** | TeamCity pipeline: lint → unit test → a11y test → build → E2E (Cypress) → publish to Artifactory |
| **Torque Publish** | 15 packages published per release (core, ui, forms, framework, assets, lego, eslint-plugin, etc.) |
| **Torque Uptake** | Automated (BitBot) + manual (UXE team) PRs to update @torque/* versions in SCUI |
| **Release** | Quarterly `u{XX}` updates — develop → release/u{XX} → master, with feature freeze + stabilization |
| **Hotfix** | Two paths: `hotfix/*` direct to release branch, `fix/MR/*` cherry-pick to older maintenance releases |
| **Performance** | Route-based lazy loading (50+ chunks), Torque tree-shaking (80+ entry points), OnPush CD, virtual scroll, shareReplay |
| **A11y Static** | @torque/eslint-plugin template-a11y: 10+ rules enforced as errors (alt-text, valid-aria, label-control, etc.) |
| **A11y Runtime** | Torque CDK: FocusKeyManager, TabTrap, AriaService (keyboard handlers), LiveAnnouncer (screen reader) |
| **A11y CI** | Dedicated `sanity-a11y.sh` pipeline step — separate a11y test configuration |
| **A11y Manual** | Section 508 compliance testing with JAWS/NVDA/VoiceOver before each release |
| **Artifactory** | Internal npm registry for all @torque/* and @lego/* packages |
| **E2E** | Cypress with parallel execution (cypress-parallel) + multi-reporters for CI integration |
