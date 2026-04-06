# Application â€” Angular Application Architecture Overview (10-Minute Interview Guide)

## What is Application?

The Application is the **enterprise Angular application** that powers the enterprise product suite. It's a monorepo on `git.example.com` containing the full SPA â€” covering Learning, Performance, Compensation, Analytics, Recruiting, eCommerce, Content & Social, and Meeting modules â€” all built on top of the **Design System** component library.

**Tech Stack:** Angular (same version as Design System) Â· TypeScript Â· Angular CLI Â· Design System UI Platform Â· NgRx Â· RxJS Â· Karma/Jasmine

---

## Project & Repository Architecture

### Fork-Based Monorepo Model

Application uses a **centralized monorepo with domain-team forks** â€” a distinctive pattern for large enterprise teams:

```
Application Project (git.example.com/projects/APP)
â”‚
â”œâ”€â”€ main          â† Central integration repo (develop + release/* branches)
â”‚                    All PRs merge HERE from domain forks
â”‚
â”œâ”€â”€ learning      â† Fork: Learning team (courses, catalog, instructors desk, roster)
â”œâ”€â”€ common        â† Fork: Shared/common code team
â”œâ”€â”€ cert-search   â† Fork: Certification & Search team (eCommerce, assign learning)
â”œâ”€â”€ compensation  â† Fork: Compensation module team
â”œâ”€â”€ content-socialâ† Fork: Content & Social module team
â”œâ”€â”€ meeting       â† Fork: Meeting/virtual classroom team (Application Meeting)
â”œâ”€â”€ performance   â† Fork: Performance management team
â”œâ”€â”€ platform      â† Fork: Platform/infrastructure team (advanced search, LOV)
â”œâ”€â”€ recruiting    â† Fork: Recruiting module team (archived)
â”œâ”€â”€ talent        â† Fork: Talent module team (archived)
â”œâ”€â”€ analytics     â† Fork: Analytics/reporting team (archived)
â”œâ”€â”€ di            â† Fork: DI module team (archived)
â”œâ”€â”€ uxe           â† Fork: UX Engineering team (cross-cutting, Design System uptakes)
â”œâ”€â”€ nova          â† Fork: Nova team (extended marketplace, newer features)
â””â”€â”€ ecommerce-api â† Fork: eCommerce API team (archived)
```

**Key Insight:** Each domain team works in their own fork, creates feature branches there, and raises PRs against `main/develop`. This gives teams autonomy while keeping a single source of truth.

### Branching Strategy

```
main repo:
  â”œâ”€â”€ develop          â† Active development (all PRs target here)
  â”œâ”€â”€ release/u64      â† Release branch (e.g., Update 64)
  â”œâ”€â”€ release/u65      â† Next release branch
  â””â”€â”€ master           â† Production

Domain fork (e.g., learning):
  â”œâ”€â”€ develop          â† Synced from main/develop
  â”œâ”€â”€ u65-inst-4       â† Feature branch (Update 65, Instructor feature #4)
  â”œâ”€â”€ fix/TICKET-254025   â† Bug fix branch (Jira ticket)
  â””â”€â”€ hc_main          â† Feature integration branch
```

Release naming follows `u{XX}` pattern (Update 64, Update 65, etc.) â€” quarterly release cadence.

---

## Directory Structure (Inside the Monorepo)

```
Application/                                      # Angular CLI Monorepo
â”‚
â”œâ”€â”€ apps/
â”‚   â””â”€â”€ Application-cloud/                        # â”€â”€ Main Application â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”‚       â””â”€â”€ src/
â”‚           â”œâ”€â”€ app/
â”‚           â”‚   â”œâ”€â”€ app-routing.module.ts   #   Master route config (lazy-loads all modules)
â”‚           â”‚   â””â”€â”€ app.module.ts           #   Root module
â”‚           â””â”€â”€ tsconfig.app.json           #   App-specific TS config
â”‚
â”œâ”€â”€ libs/                                  # â”€â”€ Feature Libraries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
â”‚   â”‚
â”‚   â”œâ”€â”€ learning/                          # @Application/learning â€” Learning Domain
â”‚   â”‚   â”œâ”€â”€ event-detail/                  #   â”œâ”€ Event/Course Detail
â”‚   â”‚   â”‚   â””â”€â”€ course-detail/             #   â”‚  â”œâ”€ Course detail views
â”‚   â”‚   â”‚       â”œâ”€â”€ app/                   #   â”‚  â”‚  â”œâ”€ App module (routing, bootstrap)
â”‚   â”‚   â”‚       â”‚   â””â”€â”€ src/               #   â”‚  â”‚  â”‚  â”œâ”€ *-app-routing.module.ts
â”‚   â”‚   â”‚       â”‚       â”œâ”€â”€ variant-course-detail-app/  â”‚  â”‚  â”œâ”€ variant variant component
â”‚   â”‚   â”‚       â”‚       â””â”€â”€ course-detail-app/      â”‚  â”‚  â””â”€ Standard variant
â”‚   â”‚   â”‚       â”œâ”€â”€ core/                  #   â”‚  â”‚  â”œâ”€ Core (labels, services, models)
â”‚   â”‚   â”‚       â”‚   â””â”€â”€ src/               #   â”‚  â”‚  â”‚  â””â”€ course-detail.label.ts
â”‚   â”‚   â”‚       â””â”€â”€ ui/                    #   â”‚  â”‚  â””â”€ UI (presentational components)
â”‚   â”‚   â”‚           â””â”€â”€ src/               #   â”‚  â”‚     â”œâ”€ variant-header/
â”‚   â”‚   â”‚               â””â”€â”€ variant-header/    #   â”‚  â”‚     â””â”€ course-detail-ui.module.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ simplified-course/             #   â”œâ”€ Simplified Course Creation
â”‚   â”‚   â”‚   â””â”€â”€ simplified-course-creation/
â”‚   â”‚   â”‚       â”œâ”€â”€ app/                   #   â”‚  â”œâ”€ App layer
â”‚   â”‚   â”‚       â”œâ”€â”€ core/                  #   â”‚  â”œâ”€ Core layer
â”‚   â”‚   â”‚       â””â”€â”€ ui/                    #   â”‚  â””â”€ UI layer
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ instructors-desk/              #   â”œâ”€ Instructor's Desk
â”‚   â”‚   â”‚   â”œâ”€â”€ roster/                    #   â”‚  â”œâ”€ Roster management
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ ui/src/lib/            #   â”‚  â”‚  â”œâ”€ bulk-add-csv/
â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ bulk-add-csv/      #   â”‚  â”‚  â”œâ”€ roster-grid-actions/
â”‚   â”‚   â”‚   â”‚       â””â”€â”€ roster-grid-actions/
â”‚   â”‚   â”‚   â””â”€â”€ shared/                    #   â”‚  â””â”€ Shared across instructor features
â”‚   â”‚   â”‚       â”œâ”€â”€ credit-mark-delivered/ #   â”‚     â”œâ”€ Credit & attendance
â”‚   â”‚   â”‚       â”‚   â””â”€â”€ src/lib/           #   â”‚     â”‚  â””â”€ attendance-actions/
â”‚   â”‚   â”‚       â””â”€â”€ facade/               #   â”‚     â””â”€ Facade service
â”‚   â”‚   â”‚           â””â”€â”€ src/lib/services/  #   â”‚        â””â”€ instructors-desk.service.ts
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ browse/                        #   â”œâ”€ Browse/Search catalog
â”‚   â”‚   â”œâ”€â”€ catalog/                       #   â”œâ”€ Learning catalog
â”‚   â”‚   â””â”€â”€ ...                            #   â””â”€ More learning sub-features
â”‚   â”‚
â”‚   â”œâ”€â”€ analytics/                         # @Application/analytics â€” Reporting & Insights
â”‚   â”‚   â”œâ”€â”€ insight/                       #   â”œâ”€ Insight charts & dashboards
â”‚   â”‚   â”œâ”€â”€ report-filter/                 #   â”œâ”€ Report filtering
â”‚   â”‚   â””â”€â”€ ...
â”‚   â”‚
â”‚   â”œâ”€â”€ performance/                       # @Application/performance â€” Performance Mgmt
â”‚   â”‚   â”œâ”€â”€ evolve/                        #   â”œâ”€ Evolve configs & dashboard
â”‚   â”‚   â””â”€â”€ ...
â”‚   â”‚
â”‚   â”œâ”€â”€ compensation/                      # @Application/compensation
â”‚   â”œâ”€â”€ content-social/                    # @Application/content-social
â”‚   â”œâ”€â”€ meeting/                           # @Application/meeting (Application Meeting / virtual classroom)
â”‚   â”œâ”€â”€ ecommerce/                         # @Application/ecommerce (assign learning, catalog purchase)
â”‚   â”œâ”€â”€ platform/                          # @Application/platform (advanced search, LOV, shared infra)
â”‚   â”œâ”€â”€ extended-marketplace/              # @Application/extended-marketplace (Nova)
â”‚   â””â”€â”€ recruiting/                        # @Application/recruiting (archived)
â”‚
â”œâ”€â”€ .angular-cli.json / angular.json       # Angular CLI workspace config
â”œâ”€â”€ tslint.json / .eslintrc                # Linting config
â”œâ”€â”€ package.json                           # Root dependencies
â””â”€â”€ tsconfig.json                          # Root TypeScript config
```

---

## The Three-Layer Architecture Pattern

Every feature in Application follows a strict **app / core / ui** layering:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    app/ layer                     â”‚
â”‚  Routing, lazy-loaded module, page composition   â”‚
â”‚  *-app-routing.module.ts, *-app.module.ts        â”‚
â”‚  *-app.component.ts (smart/container component)  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                    core/ layer                    â”‚
â”‚  Business logic, services, models, labels        â”‚
â”‚  *-core.module.ts, *.service.ts, *.label.ts      â”‚
â”‚  Facade services, NgRx state (if needed)         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                    ui/ layer                      â”‚
â”‚  Presentational components (dumb components)     â”‚
â”‚  *-ui.module.ts, *.component.ts/html/scss        â”‚
â”‚  No direct service injection, @Input/@Output     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Example â€” Course Detail:**
```
libs/learning/event-detail/course-detail/
â”œâ”€â”€ app/src/
â”‚   â”œâ”€â”€ course-detail-app-routing.module.ts    â† Route definitions
â”‚   â”œâ”€â”€ course-detail-app.module.ts            â† Imports core + ui modules
â”‚   â””â”€â”€ course-detail-app/
â”‚       â””â”€â”€ course-detail-app.component.ts     â† Container: orchestrates data
â”‚
â”œâ”€â”€ core/src/
â”‚   â”œâ”€â”€ course-detail-core.module.ts           â† Services, guards, resolvers
â”‚   â””â”€â”€ course-detail.label.ts                 â† i18n label keys
â”‚
â””â”€â”€ ui/src/
    â”œâ”€â”€ course-detail-ui.module.ts             â† Declares all UI components
    â””â”€â”€ variant-header/
        â”œâ”€â”€ variant-header.component.ts            â† Presentational only
        â”œâ”€â”€ variant-header.component.html
        â””â”€â”€ variant-header.component.scss
```

---

## Key Architecture Decisions

### 1. Fork-Based Team Isolation

Unlike Design System (which uses a single repo with Nx), Application uses Git forks to give each domain team their own sandbox:

| Aspect | How It Works |
|---|---|
| **Autonomy** | Teams push freely to their fork without blocking others |
| **Integration** | PRs from forks â†’ `main/develop` with mandatory code review |
| **Sync** | Teams periodically sync their fork from `main/develop` |
| **Release** | Release branches cut from `main/develop` â†’ `release/u{XX}` |
| **Hotfix** | Cherry-pick PRs to release branches (e.g., `fix/MR/TICKET-253181`) |

### 2. Design System as the UI Foundation

Application consumes Design System as an npm dependency. Design System uptakes are managed by the UXE team via automated PRs:

```
Design System v16.0.0-build.36  â†’  PR "Uptake latest Design System v16.0.0-build.36"
                              (from uxe fork â†’ main/develop)
                              Updates package.json + lock file
```

This means Application components use `<ds-button>`, `<ds-datagrid>`, `<ds-modal>`, etc. from `@Design System/ui/*` and platform services from `@Design System/core/platform`.

### 3. variant (People Experience Platform) Variants

Some features have dual implementations â€” a standard Application view and a variant variant:

```
course-detail/
â”œâ”€â”€ app/src/course-detail-app/          â† Standard Application experience
â””â”€â”€ app/src/variant-course-detail-app/      â† variant (Cornerstone) experience
```

This supports the Application â†’ Cornerstone product convergence, where the same backend serves different UX experiences.

### 4. Facade Pattern for Complex Features

Complex features like Instructor's Desk use a shared facade service:

```
libs/learning/instructors-desk/
â”œâ”€â”€ shared/facade/src/lib/services/
â”‚   â””â”€â”€ instructors-desk.service.ts     â† Facade: single API for roster,
â”‚                                          attendance, credits, sessions
â”œâ”€â”€ roster/ui/                          â† Roster UI consumes facade
â””â”€â”€ shared/credit-mark-delivered/       â† Credit UI consumes facade
```

### 5. Lazy Loading via Route-Based Code Splitting

Each feature module is lazy-loaded through `app-routing.module.ts`:

```typescript
// apps/Application-cloud/src/app/app-routing.module.ts
const routes: Routes = [
  {
    path: 'learning/course-detail',
    loadChildren: () => import('@Application/learning/event-detail/course-detail/app')
      .then(m => m.CourseDetailAppModule)
  },
  {
    path: 'learning/simplified-course',
    loadChildren: () => import('@Application/learning/simplified-course/app')
      .then(m => m.SimplifiedCourseCreationAppModule)
  },
  // ... 50+ lazy-loaded routes
];
```

### 6. Automated Code Review Bot

PRs to `main` are automatically reviewed by `automated-review-bot` â€” an automated review participant that checks code quality, conventions, and potential issues before human reviewers.

---

## Relationship: Application â†” Design System â†” Product

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    Application Product                     â”‚
â”‚                  (deployed to customers)                  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                           â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚              Application (This Repo)                        â”‚ â”‚
â”‚  â”‚  apps/Application-cloud/  â† Main SPA entry point           â”‚ â”‚
â”‚  â”‚  libs/learning/    â† Learning domain features       â”‚ â”‚
â”‚  â”‚  libs/analytics/   â† Analytics domain features      â”‚ â”‚
â”‚  â”‚  libs/performance/ â† Performance domain features    â”‚ â”‚
â”‚  â”‚  libs/platform/    â† Shared platform features       â”‚ â”‚
â”‚  â”‚  libs/meeting/     â† Meeting domain features        â”‚ â”‚
â”‚  â”‚  libs/ecommerce/   â† eCommerce domain features      â”‚ â”‚
â”‚  â”‚  ... (10+ domain libraries)                          â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                 â”‚ consumes                                â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚              Design System (Separate Repo)                   â”‚ â”‚
â”‚  â”‚  @Design System/ui/*       â† 60+ UI components              â”‚ â”‚
â”‚  â”‚  @Design System/forms/*    â† 20+ form components             â”‚ â”‚
â”‚  â”‚  @Design System/core/*     â† CDK, platform services          â”‚ â”‚
â”‚  â”‚  @Design System/framework  â† App shell (header, nav, footer) â”‚ â”‚
â”‚  â”‚  @Design System/assets     â† Themes, SCSS, icons             â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                           â”‚
â”‚  Backend: Java/REST APIs (separate repos)                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Development Workflow

```
Developer (e.g., on Learning team):
  1. Work in learning fork (git.example.com/projects/APP/repos/learning)
  2. Create feature branch: u65-inst-4 or fix/TICKET-254025
  3. Commit with conventional format: fix(learning): TICKET-254025 description
  4. Raise PR from learning fork â†’ main/develop
  5. Reviewers: domain lead + cross-team reviewers + automated-review-bot
  6. After approval â†’ merge to main/develop
  7. Release manager cuts release/u65 branch when ready

Design System Uptake:
  1. Design System team publishes new build (e.g., v16.0.0-build.36)
  2. AutoBot (automated) creates PR from uxe fork â†’ main/develop
  3. UXE team reviews + resolves any breaking changes
  4. Merge â†’ all teams get new Design System on next sync
```

---

## Quick-Reference: Interview Talking Points

| Topic | Key Point |
|---|---|
| **Scale** | 10+ domain modules, 16 repos (forks), 50+ lazy-loaded routes |
| **Architecture** | Three-layer pattern: app (routing) / core (logic) / ui (presentation) |
| **Team Model** | Fork-per-team with centralized integration via PRs to main |
| **UI Foundation** | Design System component library consumed as npm dependency |
| **Code Splitting** | Route-based lazy loading â€” each feature is a separate chunk |
| **State** | Facade pattern for complex features, NgRx where needed |
| **variant Strategy** | Dual UX variants (Application + variant) for product convergence |
| **Release** | Quarterly updates (u64, u65...) with release branches |
| **Automation** | Auto-review bot, automated Design System uptake PRs via AutoBot |
| **Jira Integration** | Commit messages link to TICKET-*/TICKET-*/TICKET-* tickets |
| **Branching** | develop â†’ release/u{XX} â†’ master, with cherry-pick hotfixes |
| **Quality** | Mandatory PR reviews, conventional commits, automated checks |


---

## CI/CD Pipeline

### Build Infrastructure

Both Design System and Application use **CI Server** as the CI server, with shell scripts orchestrating build steps via CI Server service messages (`##CI Server[...]`).

### Design System CI Pipeline (Upstream â€” Feeds into Application)

```
Design System PR Merge â†’ CI Server Build Chain:

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Sanity Part 1 â€” Quality Gates                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚ yarn     â”‚â†’ â”‚ lint:ts       â”‚â†’ â”‚ lint:scssâ”‚â†’ â”‚ sandbox    â”‚ â”‚
â”‚  â”‚ install  â”‚  â”‚ (ESLint +    â”‚  â”‚ (Style-  â”‚  â”‚ setup      â”‚ â”‚
â”‚  â”‚ --frozen â”‚  â”‚  @Design System/    â”‚  â”‚  lint)   â”‚  â”‚            â”‚ â”‚
â”‚  â”‚ lockfile â”‚  â”‚  eslint-     â”‚  â”‚          â”‚  â”‚            â”‚ â”‚
â”‚  â”‚          â”‚  â”‚  plugin)     â”‚  â”‚          â”‚  â”‚            â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                    â†“            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  Unit Tests (test:ci) â€” Karma/Jasmine                    â”‚  â”‚
â”‚  â”‚  Runs all affected component specs                       â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Sanity A11y â€” Accessibility Gate                               â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  test:ci --configuration=a11y                            â”‚  â”‚
â”‚  â”‚  Dedicated a11y test suite (separate from unit tests)    â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Sanity Part 2 â€” Build Verification                             â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚ build:   â”‚â†’ â”‚ Styleguide   â”‚â†’ â”‚ Styleguide build:prod    â”‚ â”‚
â”‚  â”‚ prod     â”‚  â”‚ lint (TS +   â”‚  â”‚ (dry-run, last 1 Chrome) â”‚ â”‚
â”‚  â”‚ (Design System) â”‚  â”‚ SCSS)        â”‚  â”‚                          â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Sanity Part 3 â€” E2E Tests                                      â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  Cypress E2E (suite1, suite2, or all)                    â”‚  â”‚
â”‚  â”‚  lite-server serves Styleguide â†’ Cypress runs against it â”‚  â”‚
â”‚  â”‚  Uses cypress-parallel + cypress-multi-reporters          â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```


### Design System Publish Pipeline

After sanity passes, Design System publishes **15 packages** to npm registry:

```
npm run build:rtl â†’ npm run prepublishOnly â†’ Publish sequence:

  @Design System/core                    â† Platform services, CDK, utils
  @Design System/ui                      â† 60+ UI components
  @Design System/forms                   â† 20+ form components
  @Design System/framework               â† App shell (header, nav, footer)
  @Design System/assets                  â† Themes, SCSS, icons
  @Design System/patterns                â† Design patterns
  @Design System/eslint-plugin           â† Template a11y + recommended rules
  @Design System/lego                    â† Angular â†” Web Component bridge
  @Design System/nx-plugin               â† Nx generators
  @Design System/lego-plugin             â† Lego Nx plugin
  @lego/design-tokens             â† Figma â†’ CSS custom properties
  @lego/cdk                       â† Web Component base styles
  @lego/icons                     â† Lucide-based icon system
  @lego/elements-galaxy           â† Lit Web Components (header, menu)
  @lego/elements-sbx              â† SBX Web Components
  + Vendor forks: ng-sidebar, ngx-perfect-scrollbar, ngx-popper

Registry: npm registry (internal npm registry)
```

### Application CI Pipeline (Downstream â€” Consumes Design System)

```
Application PR â†’ CI Server/Jenkins Build:

  1. yarn install --frozen-lockfile
     â””â”€â”€ Pulls @Design System/* from npm registry (pinned version in package.json)

  2. Lint (ESLint + @Design System/eslint-plugin template-a11y rules)
     â””â”€â”€ Enforces a11y rules on all Angular templates

  3. Unit Tests (Karma/Jasmine)
     â””â”€â”€ Per-module test suites

  4. Build (Angular CLI production build)
     â””â”€â”€ Lazy-loaded chunks per feature module

  5. automated-review-bot automated review
     â””â”€â”€ Code quality + convention checks
```


### Design System Uptake in Application

```
Design System v16.0.0-build.36 published to npm registry
        â†“
AutoBot (automated) OR UXE team (manual) creates PR:
  Source: uxe fork / chore/uptake-Design System-16.0.0-build.36
  Target: main/develop
        â†“
PR updates:
  - package.json (@Design System/* version bumps)
  - yarn.lock / package-lock.json
  - Any breaking change migrations
        â†“
UXE team reviews â†’ Merge â†’ All domain teams get new Design System on next sync
```

**Interview One-Liner:** "Design System publishes 15 packages to npm registry via CI Server. Application consumes them as npm dependencies, with automated uptake PRs from the UXE team ensuring controlled version upgrades across all domain teams."

---

## Release Process

### Release Cadence

Application follows a **quarterly release cadence** with `u{XX}` (Update) naming:

```
Timeline (observed from Git data):
  u42 â†’ u43 â†’ u45 â†’ u46 â†’ u48 â†’ ... â†’ u60 â†’ u64 â†’ u65
  (~2018)                                      (~2025)  (~2026)

Each "Update" = a quarterly product release to customers
```

### Release Branch Flow

```
                    Feature PRs
                        â†“
  develop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â—â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â—â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ (active development)
       â”‚                               â”‚
       â”œâ”€â”€ release/u64 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤â”€â”€â”€â”€ (stabilization, bug fixes only)
       â”‚                               â”‚
       â”œâ”€â”€ release/u65 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤â”€â”€â”€â”€ (next release, cut from develop)
       â”‚                               â”‚
       â””â”€â”€ master â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”€â”€â”€â”€ (production, tagged releases)
```


### Release Steps

| Step | Action | Example |
|------|--------|---------|
| 1. Feature Freeze | Cut `release/u65` branch from `develop` | `git checkout -b release/u65 develop` |
| 2. Stabilization | Only bug fix PRs allowed to release branch | `fix/TICKET-254025` â†’ `release/u65` |
| 3. Design System Pin | Pin Design System to a stable build for the release | `@Design System/ui@16.0.0-build.36` |
| 4. QA Cycle | Full regression + 508 accessibility testing | Manual + automated |
| 5. Release Tag | Tag and deploy from release branch | `v65.0.0` |
| 6. Merge Back | Merge release branch â†’ master â†’ develop | Ensures fixes flow back |

### Design System Version Alignment

Application CI prints the consumed Design System version for traceability:

```bash
# From CI Server-helpers.sh
printTorqueVersionInNodeModules() {
  packageVersion=$(node -pe "require('./node_modules/@Design System/core/package.json').version")
  logMessage "Design System Version in node_modules is ${packageVersion}"
}
```

**Interview One-Liner:** "We follow quarterly releases (u64, u65...) with a develop â†’ release branch â†’ master flow. Release branches are stabilization-only â€” no new features, just bug fixes and cherry-picks."

---

## Hotfix Process

### Standard Hotfix (Direct to Release Branch)

For critical production issues that need to go into an active release:

```
Scenario: Critical bug found in production (running u64)

  1. Developer creates hotfix branch from release:
     hotfix/TICKET-140158  (from release/u43)

  2. PR raised directly to release branch:
     hotfix/TICKET-140158 â†’ release/u43

  3. After merge, release branch is re-deployed

  4. Fix is cherry-picked back to develop
```

**Observed PR patterns from Git:**
- `hotfix/TICKET-140158` â†’ `release/u43`
- `hotfix/TICKET-*` â†’ `release/u{XX}`


### Cherry-Pick / Maintenance Release (MR) Hotfix

For fixes that need to go into older, already-shipped releases:

```
Scenario: Bug found in u60 (customer still on older version)

  1. Fix is developed on develop (or already merged)

  2. Cherry-pick branch created:
     fix/MR/TICKET-253181  (from release/u64)

  3. PR raised to the target release branch:
     fix/MR/TICKET-253181 â†’ release/u64

  4. Naming convention: fix/MR/* = Maintenance Release cherry-pick
```

**Observed PR patterns from Git:**
- `fix/MR/TICKET-253181` â†’ `release/u64`
- `fix/MR/TICKET-*` â†’ `release/u{XX}`

### Hotfix Decision Matrix

| Scenario | Branch Pattern | Target | Flow |
|----------|---------------|--------|------|
| Critical prod bug | `hotfix/TICKET-*` | `release/u{current}` | Direct fix â†’ release â†’ cherry-pick to develop |
| Bug in older release | `fix/MR/TICKET-*` | `release/u{older}` | Cherry-pick from develop â†’ older release |
| Normal bug fix | `fix/TICKET-*` | `develop` | Standard PR flow from domain fork |
| Feature work | `u65-feature-name` | `develop` | Standard PR flow from domain fork |

**Interview One-Liner:** "We have two hotfix paths â€” `hotfix/*` goes directly to the active release branch for critical issues, while `fix/MR/*` cherry-picks fixes into older maintenance releases for customers not yet on the latest update."

---

## Performance Optimization

### Bundle Size Strategy

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    Bundle Optimization                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                               â”‚
â”‚  1. Route-Based Lazy Loading (50+ lazy chunks)               â”‚
â”‚     loadChildren: () => import('@Application/learning/...')          â”‚
â”‚     â†’ Each feature = separate JS chunk, loaded on demand     â”‚
â”‚                                                               â”‚
â”‚  2. Design System Secondary Entry Points (tree-shaking)             â”‚
â”‚     import { DsButtonModule } from '@Design System/ui/button'      â”‚
â”‚     â†’ Only imported components are bundled                    â”‚
â”‚     â†’ 80+ independently importable entry points              â”‚
â”‚                                                               â”‚
â”‚  3. Three-Layer Architecture (natural code splitting)        â”‚
â”‚     app/ â†’ routing chunk                                      â”‚
â”‚     core/ â†’ business logic chunk                              â”‚
â”‚     ui/ â†’ presentational chunk                                â”‚
â”‚     â†’ Layers can be shared across features                    â”‚
â”‚                                                               â”‚
â”‚  4. Angular Production Build Optimizations                    â”‚
â”‚     â†’ AOT compilation (Ahead-of-Time)                        â”‚
â”‚     â†’ Dead code elimination                                   â”‚
â”‚     â†’ Minification + compression                              â”‚
â”‚     â†’ Differential loading (ES2015+ / ES5)                   â”‚
â”‚                                                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```


### Runtime Performance Patterns

| Pattern | Where Used | Impact |
|---------|-----------|--------|
| **OnPush Change Detection** | All Design System components + Application presentational components | Reduces CD cycles by 60-80% â€” only checks on @Input reference change or async pipe |
| **Virtual Scrolling** | `@Design System/ui/virtual-scroll`, Datagrid | Renders only visible rows â€” handles 10K+ row datasets |
| **shareReplay({ bufferSize: 1, refCount: true })** | All Facade observables | Single execution for multiple subscribers, auto-cleanup |
| **trackBy** | All `*ngFor` in Design System components | Prevents DOM re-creation on list updates |
| **Lazy Loading** | 50+ route modules | Initial bundle only loads shell + first route |
| **Memoize Pipe** | `@Design System/core/cdk` | Caches pure function results in templates |
| **HTTP Interceptors** | In-flight dedup, response caching | Prevents duplicate API calls, caches GET responses |

### Performance Monitoring (Observed from PR Data)

From PR #17235 (analytics fix): Application integrates analytics tracking that monitors:
- Page load times per module
- Route transition performance
- API response times
- Error rates per feature

**Interview One-Liner:** "Performance is addressed at every layer â€” Design System provides tree-shakeable components with OnPush and virtual scrolling, Application adds route-based lazy loading for 50+ features, and the Facade pattern with shareReplay prevents redundant API calls and change detection cycles."

---

## Accessibility Testing

### Multi-Layer Accessibility Strategy

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              Accessibility Testing Pyramid                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                               â”‚
â”‚  Layer 1: Static Analysis (CI â€” Every PR)                    â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚  @Design System/eslint-plugin â€” template-a11y config            â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ alt-text: error           (images need alt)         â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ valid-aria: error         (valid ARIA attributes)   â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ elements-content: error   (non-empty elements)      â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ table-scope: error        (table scope attribute)   â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ label-has-associated-control: error                 â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ role-has-required-aria: error                       â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ mouse-events-have-key-events: error                 â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ no-positive-tabindex: error                         â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ no-autofocus: error                                 â”‚â”‚
â”‚  â”‚  â”œâ”€â”€ no-duplicate-attributes: error                      â”‚â”‚
â”‚  â”‚  â””â”€â”€ button-has-type: error    (custom Design System rule)      â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                               â”‚
â”‚  Layer 2: Component-Level A11y Tests (CI â€” Dedicated Suite)  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚  npm run test:ci --configuration=a11y                    â”‚â”‚
â”‚  â”‚  Separate Karma test configuration for a11y specs        â”‚â”‚
â”‚  â”‚  Runs as dedicated CI step (sanity-a11y.sh)              â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                               â”‚
â”‚  Layer 3: Storybook A11y Audits (Visual Review)              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚  @storybook/addon-a11y (axe-core integration)            â”‚â”‚
â”‚  â”‚  Every component story has a11y panel                    â”‚â”‚
â”‚  â”‚  Checks: color contrast, ARIA roles, keyboard nav        â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                               â”‚
â”‚  Layer 4: Manual 508 Testing (QA â€” Release Cycle)            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚  Screen reader testing (JAWS, NVDA, VoiceOver)           â”‚â”‚
â”‚  â”‚  Keyboard-only navigation testing                        â”‚â”‚
â”‚  â”‚  Section 508 compliance checklist                        â”‚â”‚
â”‚  â”‚  (Referenced in PR descriptions: "508 testing")          â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â”‚                                                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```


### Design System CDK A11y Services (Used by Application)

| Service / Directive | Purpose | Example |
|---|---|---|
| **FocusKeyManager** | Arrow-key navigation within lists/menus | Datagrid rows, dropdown options |
| **TabTrap** | Traps Tab focus within modals/dialogs | Modal, flyout, sidebar |
| **AriaList** | Manages `aria-activedescendant` for lists | Select, autocomplete |
| **HotkeyService** | Global keyboard shortcut registration | Ctrl+S save, Esc close |
| **AriaService** | Adds keyboard event handlers to interactive elements | Click â†’ Enter/Space support |
| **LiveAnnouncer** | Screen reader announcements via `aria-live` | Form errors, toast messages |
| **FocusableItem** | Marks items as focusable in a managed list | Tab navigation sequences |
| **KeyboardSelect** | Keyboard selection in complex widgets | Multi-select, tree-view |

### Real-World A11y Pattern (From PR #11695)

```
PR: "fix: ds-4114 - error announce in password validator"

Problem: Screen readers not announcing form validation errors

Solution:
  1. Added role="alert" to error message container
     â†’ Screen reader announces immediately when error appears

  2. Used DsLiveAnnouncerService.announce() method
     â†’ Programmatic announcement for dynamic error messages

  3. Added DsErrorDelay configuration
     â†’ Prevents rapid-fire announcements during typing
     â†’ Debounces error announcements for better UX

Pattern:
  <div role="alert" *ngIf="hasError">
    {{ errorMessage }}
  </div>

  // In component:
  this.liveAnnouncer.announce(errorMessage, 'assertive');
```

### ESLint A11y Rules Detail

The `@Design System/eslint-plugin` `template-a11y` config enforces these rules at lint time:

```typescript
// From libs/plugins/eslint/src/configs/template-a11y.ts
{
  '@angular-eslint/template/alt-text': 'error',
  '@angular-eslint/template/valid-aria': 'error',
  '@angular-eslint/template/elements-content': ['error', {
    allowList: ['DsTranslate']  // Design System i18n directive exemption
  }],
  '@angular-eslint/template/table-scope': 'error',
  '@angular-eslint/template/label-has-associated-control': 'error',
  '@angular-eslint/template/role-has-required-aria': 'error',
  '@angular-eslint/template/mouse-events-have-key-events': 'error',
  '@angular-eslint/template/no-positive-tabindex': 'error',
  '@angular-eslint/template/no-autofocus': 'error',
  '@angular-eslint/template/no-duplicate-attributes': 'error'
}

// Note: These are intentionally commented out because Design System's
// AriaService handles them at runtime:
// - interactive-supports-focus  â†’ AriaService adds keyboard handlers
// - click-events-have-key-events â†’ AriaService adds Enter/Space
```

**Key Insight:** Design System's `AriaService` handles keyboard interaction at runtime (adding Enter/Space handlers to clickable elements), so the corresponding ESLint rules are disabled to avoid false positives. This is a deliberate architectural decision â€” runtime a11y service + static lint rules complement each other.

**Interview One-Liner:** "We have a four-layer a11y strategy â€” static ESLint rules catch template issues at PR time, dedicated a11y test suites run in CI, Storybook axe-core audits catch visual/ARIA issues, and manual 508 testing with screen readers validates the full user experience before each release."

---

## Updated Interview Talking Points

| Topic | Key Point |
|---|---|
| **CI/CD** | CI Server pipeline: lint â†’ unit test â†’ a11y test â†’ build â†’ E2E (Cypress) â†’ publish to npm registry |
| **Design System Publish** | 15 packages published per release (core, ui, forms, framework, assets, lego, eslint-plugin, etc.) |
| **Design System Uptake** | Automated (AutoBot) + manual (UXE team) PRs to update @Design System/* versions in Application |
| **Release** | Quarterly `u{XX}` updates â€” develop â†’ release/u{XX} â†’ master, with feature freeze + stabilization |
| **Hotfix** | Two paths: `hotfix/*` direct to release branch, `fix/MR/*` cherry-pick to older maintenance releases |
| **Performance** | Route-based lazy loading (50+ chunks), Design System tree-shaking (80+ entry points), OnPush CD, virtual scroll, shareReplay |
| **A11y Static** | @Design System/eslint-plugin template-a11y: 10+ rules enforced as errors (alt-text, valid-aria, label-control, etc.) |
| **A11y Runtime** | Design System CDK: FocusKeyManager, TabTrap, AriaService (keyboard handlers), LiveAnnouncer (screen reader) |
| **A11y CI** | Dedicated `sanity-a11y.sh` pipeline step â€” separate a11y test configuration |
| **A11y Manual** | Section 508 compliance testing with JAWS/NVDA/VoiceOver before each release |
| **npm registry** | Internal npm registry for all @Design System/* and @lego/* packages |
| **E2E** | Cypress with parallel execution (cypress-parallel) + multi-reporters for CI integration |

