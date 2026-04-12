# Micro Frontend & Application Architecture — System Design Interview Guide

## Principal / Architect-Level Frontend Engineering

> This document covers three interconnected system design questions that a Principal or Staff-level
> frontend engineer should be prepared to answer in depth. Each question builds on the previous one,
> forming a complete picture of enterprise micro frontend architecture.

> 🔑 **Interview Mindset:** At the Principal/Architect level, interviewers don't want a textbook
> answer. They want to see you lead with trade-offs, acknowledge constraints, and justify decisions
> with real-world experience. Every "it depends" should be followed by "and here's how I'd decide."

---

## Table of Contents

1. [Q1: Design a Micro Frontend Platform for Enterprise SaaS (6+ Teams)](#q1-design-a-micro-frontend-platform-for-enterprise-saas-6-teams)
2. [Q2: Migrate a Monolithic Angular App (300+ Components) to Micro Frontends](#q2-migrate-a-monolithic-angular-app-300-components-to-micro-frontends)
3. [Q3: Design the Shell Application for a Micro Frontend Ecosystem](#q3-design-the-shell-application-for-a-micro-frontend-ecosystem)
4. [BONUS: Cross-MFE State Sharing Without Tight Coupling](#bonus-cross-mfe-state-sharing-without-tight-coupling)

---

## Q1: Design a Micro Frontend Platform for Enterprise SaaS (6+ Teams)

### Opening Framework — How to Structure Your Answer

> 🎯 **Interview Tip:** Start by clarifying requirements before jumping into architecture.
> Ask: "How many teams? What's the deployment cadence? Is there a shared design system?
> Are teams using the same framework?" This signals architectural maturity.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CDN / Edge Layer                             │
│                   (CloudFront / Akamai / Fastly)                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                     Shell Application (Host)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ Auth Module  │  │ Router/Nav   │  │ Shared State (Lightweight)│  │
│  └─────────────┘  └──────────────┘  └───────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Module Federation Runtime (Webpack 5)           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────┬─────────┬──────────┬──────────┬──────────┬──────────┬───────┘
       │         │          │          │          │          │
  ┌────▼───┐ ┌──▼────┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼────┐
  │ MFE-A  │ │ MFE-B │ │ MFE-C │ │ MFE-D │ │ MFE-E │ │ MFE-F  │
  │Dashboard│ │Reports│ │Settings│ │Billing│ │Users  │ │Analytics│
  │ Team A │ │Team B │ │Team C │ │Team D │ │Team E │ │Team F  │
  └────────┘ └───────┘ └───────┘ └───────┘ └───────┘ └────────┘
       │         │          │          │          │          │
  ┌────▼─────────▼──────────▼──────────▼──────────▼──────────▼───────┐
  │              Shared Component Library (@corp/ui-kit)              │
  │              Published as npm package (versioned)                 │
  └──────────────────────────────────────────────────────────────────┘
```

### Module Federation Setup — Webpack Configuration

#### Host (Shell) — `webpack.config.js`

> **What this config does:** The host application declares itself as the orchestrator. It doesn't
> expose anything — it only consumes remotes. The `remotes` object maps logical names to runtime
> URLs where each MFE's `remoteEntry.js` lives. Shared dependencies use `singleton: true` to
> prevent multiple Angular instances from bootstrapping.

```javascript
// webpack.config.js — Host (Shell Application)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  output: {
    uniqueName: 'shell',
    publicPath: 'auto', // Critical: allows remotes to resolve assets correctly
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',

      // Dynamic remotes — loaded at runtime, not build time
      // This is the key to deployment independence
      remotes: {
        dashboard: 'dashboard@https://mfe-dashboard.corp.com/remoteEntry.js',
        reports:   'reports@https://mfe-reports.corp.com/remoteEntry.js',
        settings:  'settings@https://mfe-settings.corp.com/remoteEntry.js',
        billing:   'billing@https://mfe-billing.corp.com/remoteEntry.js',
        users:     'users@https://mfe-users.corp.com/remoteEntry.js',
        analytics: 'analytics@https://mfe-analytics.corp.com/remoteEntry.js',
      },

      shared: {
        '@angular/core': {
          singleton: true,       // Only ONE instance across all MFEs
          strictVersion: false,  // Allow minor version mismatches (14.1 + 14.2 = OK)
          requiredVersion: '^17.0.0',
        },
        '@angular/common': {
          singleton: true,
          strictVersion: false,
          requiredVersion: '^17.0.0',
        },
        '@angular/router': {
          singleton: true,       // Router MUST be singleton — multiple routers = chaos
          strictVersion: false,
          requiredVersion: '^17.0.0',
        },
        '@angular/common/http': {
          singleton: true,
          strictVersion: false,
          requiredVersion: '^17.0.0',
        },
        'rxjs': {
          singleton: true,       // Shared Observable streams require same RxJS instance
          strictVersion: false,
          requiredVersion: '^7.0.0',
        },
        '@corp/ui-kit': {
          singleton: true,       // Design system must be consistent
          strictVersion: true,   // Strict: all MFEs must use same major version
          requiredVersion: '^3.0.0',
        },
      },
    }),
  ],
};
```

#### Remote (MFE-A: Dashboard) — `webpack.config.js`

> **What this config does:** Each remote exposes specific Angular modules (or standalone components)
> that the host can lazy-load. The `exposes` map defines the public API contract — only what's
> listed here is accessible to the host. Everything else remains private to the MFE.

```javascript
// webpack.config.js — Remote (Dashboard MFE)
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  output: {
    uniqueName: 'dashboard',
    publicPath: 'auto',
    // Script type 'module' enables top-level await for async shared scope init
    scriptType: 'text/javascript',
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboard',

      // The manifest file — host fetches this to discover exposed modules
      filename: 'remoteEntry.js',

      // Public API contract: only these modules are accessible
      exposes: {
        './DashboardModule': './src/app/dashboard/dashboard.module.ts',
        './WidgetComponent': './src/app/widgets/widget.component.ts',
      },

      // Same shared config as host — this is the "contract"
      shared: {
        '@angular/core':        { singleton: true, strictVersion: false, requiredVersion: '^17.0.0' },
        '@angular/common':      { singleton: true, strictVersion: false, requiredVersion: '^17.0.0' },
        '@angular/router':      { singleton: true, strictVersion: false, requiredVersion: '^17.0.0' },
        '@angular/common/http': { singleton: true, strictVersion: false, requiredVersion: '^17.0.0' },
        'rxjs':                 { singleton: true, strictVersion: false, requiredVersion: '^7.0.0' },
        '@corp/ui-kit':         { singleton: true, strictVersion: true,  requiredVersion: '^3.0.0' },
      },
    }),
  ],
};
```

### Shared Dependency Strategy — Singleton vs. Isolated

> 🎯 **Interview Tip:** This is where most candidates give a surface-level answer. Go deeper.
> Explain *when* you'd break the singleton rule and why.

| Dependency | Strategy | Rationale |
|---|---|---|
| `@angular/core` | **Singleton** (mandatory) | Multiple Angular platforms = broken DI, broken zone.js, broken change detection. Non-negotiable. |
| `@angular/router` | **Singleton** (mandatory) | URL is a shared global resource. Two routers fighting over `window.location` = broken navigation. |
| `rxjs` | **Singleton** (recommended) | Shared Observables across MFE boundaries require the same RxJS instance. `instanceof` checks fail otherwise. |
| `@corp/ui-kit` | **Singleton + strict** | Visual consistency. Users shouldn't see two different button styles on the same page. |
| `lodash` | **Isolated** (OK) | Pure utility, no shared state. Duplicating 70KB is acceptable vs. version-lock pain across 6 teams. |
| `d3` / `chart.js` | **Isolated** (recommended) | Visualization libs are large but version-sensitive. Team A on D3 v6, Team B on v7 = both work fine isolated. |
| `moment` / `date-fns` | **Isolated** (OK) | Date formatting is self-contained. No cross-MFE date objects shared. |

**The Decision Rule:**
```
Does the library manage shared global state or DOM?
  YES → Singleton (Angular, Router, RxJS)
  NO  → Does duplicating it cause UX inconsistency?
    YES → Singleton + strict version (UI kit)
    NO  → Isolated (utilities, visualization libs)
```

### Routing Ownership Model

```
┌─────────────────────────────────────────────────────────┐
│                    Shell Router (Level 1)                │
│                                                         │
│  /dashboard/**  → lazy load Dashboard MFE               │
│  /reports/**    → lazy load Reports MFE                 │
│  /settings/**   → lazy load Settings MFE                │
│  /billing/**    → lazy load Billing MFE                 │
│  /users/**      → lazy load Users MFE                   │
│  /analytics/**  → lazy load Analytics MFE               │
│                                                         │
│  Shell owns: top-level path segments                    │
│  Shell guards: AuthGuard, RoleGuard, FeatureFlagGuard   │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────▼──────────────┐
          │   MFE Internal Router (L2)  │
          │                             │
          │  /dashboard/overview        │
          │  /dashboard/widgets/:id     │
          │  /dashboard/settings        │
          │                             │
          │  MFE owns: child routes     │
          │  MFE guards: feature-level  │
          └─────────────────────────────┘
```

**Shell routing configuration (Angular):**

```typescript
// shell/src/app/app.routes.ts
import { loadRemoteModule } from '@angular-architects/module-federation';

export const APP_ROUTES: Routes = [
  {
    path: 'dashboard',
    canActivate: [AuthGuard, RoleGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: 'https://mfe-dashboard.corp.com/remoteEntry.js',
        exposedModule: './DashboardModule',
      }).then((m) => m.DashboardModule),
  },
  {
    path: 'reports',
    canActivate: [AuthGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: 'https://mfe-reports.corp.com/remoteEntry.js',
        exposedModule: './ReportsModule',
      }).then((m) => m.ReportsModule),
  },
  // ... other MFEs follow the same pattern
  {
    path: '**',
    component: NotFoundComponent, // Shell owns the 404
  },
];
```

### Cross-MFE Communication Patterns

> 🎯 **Interview Tip:** This is the #1 follow-up question. Interviewers want to see you weigh
> trade-offs, not just pick one pattern. Show you understand coupling implications.

#### Pattern Comparison Table

| Pattern | Coupling | Complexity | Use Case | Scalability |
|---|---|---|---|---|
| **CustomEvents** | Very Low | Low | Fire-and-forget notifications | ★★★★★ |
| **BroadcastChannel** | Very Low | Low | Cross-tab + cross-MFE sync | ★★★★☆ |
| **Shared State (Service)** | Medium | Medium | Shared user context, theme | ★★★☆☆ |
| **URL/Query Params** | Very Low | Very Low | Deep linking, filter state | ★★★★★ |
| **PostMessage** | Low | Medium | iframe-based MFEs only | ★★★☆☆ |

#### Pattern 1: CustomEvents (Recommended Default)

> **What this code does:** A lightweight event bus using native DOM CustomEvents. Each MFE can
> dispatch and listen without importing anything from another MFE. Zero coupling. The contract
> is the event name and payload shape — documented in a shared TypeScript interface package.

```typescript
// @corp/mfe-contracts/src/events.ts — Shared type package (npm published)
// This is the ONLY coupling point between MFEs — a shared interface package
export interface MfeEvent<T = unknown> {
  source: string;      // Which MFE dispatched this
  timestamp: number;
  payload: T;
}

export interface UserSelectedEvent extends MfeEvent<{ userId: string; role: string }> {
  source: 'users-mfe';
}

export interface ThemeChangedEvent extends MfeEvent<{ theme: 'light' | 'dark' }> {
  source: 'settings-mfe';
}

// Event name constants — prevents typos
export const MFE_EVENTS = {
  USER_SELECTED: 'mfe:user-selected',
  THEME_CHANGED: 'mfe:theme-changed',
  NOTIFICATION:  'mfe:notification',
  LOGOUT:        'mfe:logout',
} as const;
```

```typescript
// Dispatcher — Users MFE (any MFE can dispatch)
import { MFE_EVENTS, UserSelectedEvent } from '@corp/mfe-contracts';

@Injectable({ providedIn: 'root' })
export class MfeEventDispatcher {

  dispatch<T>(eventName: string, payload: T, source: string): void {
    const event = new CustomEvent(eventName, {
      detail: {
        source,
        timestamp: Date.now(),
        payload,
      } satisfies MfeEvent<T>,
      bubbles: true,    // Bubbles up to window — any MFE can catch it
      composed: true,   // Crosses shadow DOM boundaries (if using web components)
    });
    window.dispatchEvent(event);
  }

  // Convenience method for typed events
  userSelected(userId: string, role: string): void {
    this.dispatch(MFE_EVENTS.USER_SELECTED, { userId, role }, 'users-mfe');
  }
}
```

```typescript
// Listener — Dashboard MFE (any MFE can listen)
import { MFE_EVENTS, UserSelectedEvent } from '@corp/mfe-contracts';

@Injectable({ providedIn: 'root' })
export class MfeEventListener implements OnDestroy {
  private destroy$ = new Subject<void>();

  // Convert DOM events to RxJS Observable — Angular-friendly
  onUserSelected(): Observable<UserSelectedEvent> {
    return fromEvent<CustomEvent>(window, MFE_EVENTS.USER_SELECTED).pipe(
      map((event) => event.detail as UserSelectedEvent),
      takeUntil(this.destroy$),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Usage in a component
@Component({ /* ... */ })
export class DashboardComponent implements OnInit {
  constructor(private mfeEvents: MfeEventListener) {}

  ngOnInit(): void {
    this.mfeEvents.onUserSelected().subscribe((event) => {
      console.log(`User ${event.payload.userId} selected by ${event.source}`);
      this.loadUserDashboard(event.payload.userId);
    });
  }
}
```

#### Pattern 2: BroadcastChannel (Cross-Tab Sync)

```typescript
// Useful when the same user has multiple tabs open
// BroadcastChannel works across browser tabs AND across MFEs in the same tab

@Injectable({ providedIn: 'root' })
export class CrossTabSync implements OnDestroy {
  private channel = new BroadcastChannel('corp-mfe-sync');
  private messages$ = new Subject<MfeEvent>();

  constructor() {
    this.channel.onmessage = (event: MessageEvent) => {
      this.messages$.next(event.data);
    };
  }

  broadcast<T>(eventName: string, payload: T): void {
    this.channel.postMessage({ eventName, payload, timestamp: Date.now() });
  }

  on<T>(eventName: string): Observable<T> {
    return this.messages$.pipe(
      filter((msg) => msg.eventName === eventName),
      map((msg) => msg.payload as T),
    );
  }

  ngOnDestroy(): void {
    this.channel.close();
    this.messages$.complete();
  }
}
```

#### Pattern 3: Shared State Service (Use Sparingly)

```typescript
// Only for truly global state: auth token, user profile, theme
// WARNING: This creates coupling. Every MFE importing this service
// must use the same version. Keep the surface area minimal.

// @corp/shared-state/src/global-state.service.ts
@Injectable({ providedIn: 'root' })
export class GlobalStateService {
  private state = new BehaviorSubject<GlobalState>({
    user: null,
    theme: 'light',
    locale: 'en-US',
  });

  // Read-only observable — MFEs can subscribe but not directly mutate
  readonly state$ = this.state.asObservable();

  // Selective slices — MFEs only subscribe to what they need
  readonly user$ = this.state$.pipe(map(s => s.user), distinctUntilChanged());
  readonly theme$ = this.state$.pipe(map(s => s.theme), distinctUntilChanged());

  // Controlled mutations — only through explicit methods
  setUser(user: User | null): void {
    this.state.next({ ...this.state.value, user });
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.state.next({ ...this.state.value, theme });
  }
}
```

**When to use which pattern:**
```
Cross-MFE Communication Decision Tree:

Is it a fire-and-forget notification?
  YES → CustomEvents (lowest coupling)
  NO  ↓
Does it need to sync across browser tabs?
  YES → BroadcastChannel
  NO  ↓
Is it truly global state (auth, theme, locale)?
  YES → Shared State Service (singleton, minimal API)
  NO  ↓
Is it navigation/deep-link state?
  YES → URL query params (most resilient)
  NO  → Reconsider if you actually need cross-MFE communication.
        Often the answer is: you don't. Redesign the boundary.
```

### Deployment Independence

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deployment Pipeline (Per MFE)                │
│                                                                 │
│  Team A pushes to main                                          │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐  │
│  │  Build   │──▶│  Test    │──▶│ Contract │──▶│  Deploy    │  │
│  │ (ng build│   │ (unit +  │   │  Check   │   │ (S3 + CDN) │  │
│  │  --prod) │   │  e2e)    │   │ (schema  │   │            │  │
│  └──────────┘   └──────────┘   │  compat) │   └────────────┘  │
│                                └──────────┘                    │
│                                                                 │
│  Key: Each MFE has its OWN CI/CD pipeline.                     │
│  The shell does NOT need to redeploy when an MFE updates.      │
│  remoteEntry.js URL stays the same — contents change.          │
└─────────────────────────────────────────────────────────────────┘
```

### Versioning Contracts

> **The contract is the exposed module's public API shape.** If `DashboardModule` expects
> certain route params or inputs, that's the contract. Breaking it breaks the host.

```typescript
// @corp/mfe-contracts/src/dashboard.contract.ts
// Published as an npm package — both host and remote depend on it

export interface DashboardMfeContract {
  // Module name exposed in webpack config
  exposedModule: './DashboardModule';

  // Route params the shell must provide
  routeParams: {
    tenantId: string;
  };

  // Events this MFE emits
  emits: ['mfe:dashboard-loaded', 'mfe:widget-error'];

  // Events this MFE listens to
  listensTo: ['mfe:user-selected', 'mfe:theme-changed'];

  // Required shared deps (minimum versions)
  sharedDeps: {
    '@angular/core': '^17.0.0';
    '@corp/ui-kit': '^3.0.0';
  };
}
```

**Contract validation in CI:**
```bash
# Run in each MFE's CI pipeline before deployment
# Validates that the exposed module shape hasn't changed in a breaking way
npx mfe-contract-check \
  --contract @corp/mfe-contracts/dashboard \
  --remote-entry dist/remoteEntry.js \
  --fail-on-breaking
```

---

## Q2: Migrate a Monolithic Angular App (300+ Components) to Micro Frontends

### Opening Framework — How to Structure Your Answer

> 🎯 **Interview Tip:** This question tests your ability to manage risk, not just design systems.
> The interviewer wants to hear: "How do you migrate without a single day of downtime?" Lead with
> the Strangler Fig pattern, show phased execution, and emphasize rollback at every stage.
> Candidates who say "rewrite from scratch" immediately lose credibility.

### The Strangler Fig Pattern — Overview

> **What is it?** Named after strangler fig trees that grow around a host tree and eventually
> replace it. You build the new system around the old one, gradually routing traffic to new
> micro frontends until the monolith is empty and can be decommissioned.

```
Phase 1: Coexistence          Phase 2: Migration           Phase 3: Completion
┌──────────────────┐          ┌──────────────────┐         ┌──────────────────┐
│    Monolith      │          │    Monolith      │         │                  │
│ ┌──────────────┐ │          │ ┌──────────────┐ │         │   (Decomm'd)     │
│ │ Dashboard    │ │          │ │ ░░░░░░░░░░░░ │ │         │                  │
│ │ Reports      │ │          │ │ Settings     │ │         │                  │
│ │ Settings     │ │          │ │ ░░░░░░░░░░░░ │ │         └──────────────────┘
│ │ Billing      │ │          │ └──────────────┘ │
│ │ Users        │ │          └──────────────────┘
│ │ Analytics    │ │                 │
│ └──────────────┘ │          ┌──────▼───────────┐         ┌──────────────────┐
└──────────────────┘          │   Shell + MFEs   │         │   Shell + MFEs   │
        │                     │ ┌────┐ ┌────┐    │         │ ┌────┐ ┌────┐   │
        ▼                     │ │Dash│ │Rpts│    │         │ │Dash│ │Rpts│   │
┌──────────────────┐          │ ├────┤ ├────┤    │         │ ├────┤ ├────┤   │
│   Shell (new)    │          │ │Bill│ │User│    │         │ │Sett│ │Bill│   │
│ ┌────┐           │          │ ├────┤ ├────┤    │         │ ├────┤ ├────┤   │
│ │Dash│ (1st MFE) │          │ │Anly│ │    │    │         │ │User│ │Anly│   │
│ └────┘           │          │ └────┘ └────┘    │         │ └────┘ └────┘   │
└──────────────────┘          └──────────────────┘         └──────────────────┘

░░░ = Migrated out (routes now point to MFE)
```

### Step-by-Step Migration Strategy

#### Phase 0: Preparation (Weeks 1–4)

> **Goal:** Establish the foundation without touching production behavior.

```
Step 0.1: Audit the Monolith
─────────────────────────────
├── Map all 300+ components to feature domains
├── Identify shared services (auth, http interceptors, state)
├── Document all route definitions and guards
├── Catalog third-party dependencies per feature area
└── Output: Component Dependency Graph + Domain Boundary Map
```

```typescript
// Tool: Generate a dependency graph of your monolith
// Run this script to map component → module → route relationships

// scripts/audit-monolith.ts
import * as ts from 'typescript';
import * as fs from 'fs';

interface ComponentAudit {
  name: string;
  module: string;
  route: string | null;
  dependencies: string[];       // Services injected
  sharedServices: string[];     // Services used by 2+ feature areas
  estimatedComplexity: 'low' | 'medium' | 'high';
}

// Example output after running the audit:
const auditResult: Record<string, ComponentAudit[]> = {
  'dashboard-domain': [
    {
      name: 'DashboardOverviewComponent',
      module: 'DashboardModule',
      route: '/dashboard',
      dependencies: ['DashboardService', 'AuthService', 'NotificationService'],
      sharedServices: ['AuthService', 'NotificationService'],
      estimatedComplexity: 'medium',
    },
    {
      name: 'WidgetGridComponent',
      module: 'DashboardModule',
      route: '/dashboard/widgets',
      dependencies: ['WidgetService', 'DragDropService'],
      sharedServices: [],
      estimatedComplexity: 'high',
    },
    // ... 15 more components in this domain
  ],
  'reports-domain': [ /* ... 40 components */ ],
  'settings-domain': [ /* ... 25 components */ ],
  'billing-domain': [ /* ... 35 components */ ],
  'users-domain': [ /* ... 50 components */ ],
  'analytics-domain': [ /* ... 45 components */ ],
  'shared': [ /* ... 90 components used across domains */ ],
};
```

```
Step 0.2: Extract Shared Component Library
───────────────────────────────────────────
├── Identify components used across 2+ feature domains
├── Create @corp/ui-kit package (Nx library or standalone npm)
├── Move shared components: buttons, modals, tables, forms
├── Move shared services: AuthService, HttpInterceptors, LoggingService
├── Publish v1.0.0 — monolith consumes it as a dependency
└── Output: Monolith now imports from @corp/ui-kit instead of relative paths
```

```typescript
// Before: Shared components scattered across monolith
// src/app/shared/components/data-table/data-table.component.ts
// src/app/shared/components/modal/modal.component.ts
// src/app/core/services/auth.service.ts

// After: Extracted to publishable library
// libs/ui-kit/src/lib/data-table/data-table.component.ts
// libs/ui-kit/src/lib/modal/modal.component.ts
// libs/shared-services/src/lib/auth.service.ts

// Monolith's imports change from:
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';

// To:
import { DataTableComponent } from '@corp/ui-kit';
import { AuthService } from '@corp/shared-services';
```

#### Phase 1: Shell + First MFE (Weeks 5–10)

> **Goal:** Prove the architecture works with one low-risk feature domain.
> Pick the domain with the fewest shared dependencies and lowest traffic.

```
Step 1.1: Choose the Pilot MFE
───────────────────────────────
Selection Criteria:
├── Fewest cross-domain dependencies (Settings is often ideal)
├── Lowest traffic / lowest business risk
├── Self-contained routes (no deep links from other features)
├── Team willing to be the guinea pig
└── Winner: Settings MFE (25 components, 3 routes, minimal shared state)
```

```typescript
// Step 1.2: Create the Shell Application
// The shell initially just wraps the monolith and adds Module Federation

// shell/src/app/app.routes.ts
export const APP_ROUTES: Routes = [
  // NEW: Settings routes now point to the MFE
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: environment.mfeUrls.settings,
        exposedModule: './SettingsModule',
      }).then((m) => m.SettingsModule),
    data: { mfe: true }, // Flag for analytics/monitoring
  },

  // LEGACY: Everything else still routes to the monolith
  // The monolith runs as a "mega-MFE" inside the shell
  {
    path: '**',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: environment.mfeUrls.monolith,
        exposedModule: './LegacyAppModule',
      }).then((m) => m.LegacyAppModule),
  },
];
```

```typescript
// Step 1.3: Feature Flag Integration
// CRITICAL: Every MFE route must be feature-flagged for instant rollback

@Injectable({ providedIn: 'root' })
export class MfeFeatureFlagGuard implements CanActivate {
  constructor(
    private featureFlags: FeatureFlagService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const mfeName = route.data['mfeName']; // e.g., 'settings-mfe'
    const flagKey = `mfe.${mfeName}.enabled`;

    if (this.featureFlags.isEnabled(flagKey)) {
      // Route to the new MFE
      return true;
    }

    // Fallback: redirect to the monolith version of the same route
    const fallbackPath = `/legacy${route.url.map(s => '/' + s.path).join('')}`;
    console.warn(`MFE ${mfeName} disabled by feature flag. Falling back to: ${fallbackPath}`);
    return this.router.parseUrl(fallbackPath);
  }
}

// Route configuration with feature flag
{
  path: 'settings',
  canActivate: [AuthGuard, MfeFeatureFlagGuard],
  data: { mfeName: 'settings-mfe' },
  loadChildren: () => loadRemoteModule({ /* ... */ }),
}
```

```
Feature Flag Rollback Flow:
───────────────────────────

User navigates to /settings
        │
        ▼
┌─────────────────────┐
│ MfeFeatureFlagGuard  │
│                     │
│ Is 'mfe.settings    │
│ .enabled' = true?   │
└────────┬────────────┘
    YES  │        NO
    │    │         │
    ▼    │         ▼
┌────────┐    ┌──────────────┐
│Settings│    │ /legacy/     │
│  MFE   │    │  settings    │
│ (new)  │    │ (monolith)   │
└────────┘    └──────────────┘

Rollback = flip one flag in LaunchDarkly/Split.io
Zero deployment needed. Instant. Safe.
```

#### Phase 2: Parallel Migration (Weeks 11–30)

> **Goal:** Migrate remaining domains in priority order while maintaining production stability.

```
Migration Priority Matrix:
──────────────────────────

Domain      │ Components │ Shared Deps │ Traffic │ Risk  │ Priority │ Sprint
────────────┼────────────┼─────────────┼─────────┼───────┼──────────┼────────
Settings    │    25      │    Low      │  Low    │  Low  │    1     │  5-10
Users       │    50      │    Medium   │  Medium │  Med  │    2     │ 11-16
Reports     │    40      │    Medium   │  High   │  Med  │    3     │ 17-22
Analytics   │    45      │    High     │  Medium │  High │    4     │ 23-28
Billing     │    35      │    High     │  High   │  High │    5     │ 29-34
Dashboard   │    55      │    Highest  │  Highest│  High │    6     │ 35-42
Shared/Core │    90      │    N/A      │  N/A    │  N/A  │  Ongoing │  1-42
```

```typescript
// Step 2.1: Route-Based MFE Splitting Pattern
// Each domain gets extracted following this template:

// 1. Create new Angular application for the MFE
// ng new mfe-users --routing --style=scss

// 2. Add Module Federation
// ng add @angular-architects/module-federation --project mfe-users --type remote

// 3. Copy components from monolith to MFE
// Move src/app/users/** → mfe-users/src/app/

// 4. Update imports to use @corp/ui-kit and @corp/shared-services
// Replace relative imports with package imports

// 5. Configure webpack to expose the module
// mfe-users/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'users',
      filename: 'remoteEntry.js',
      exposes: {
        './UsersModule': './src/app/users/users.module.ts',
      },
      shared: { /* standard shared config */ },
    }),
  ],
};

// 6. Add route in shell with feature flag
// 7. Deploy MFE independently
// 8. Enable feature flag for canary (10% traffic)
// 9. Monitor error rates, performance metrics
// 10. Gradually roll out to 100%
// 11. Remove legacy route from monolith
```

```typescript
// Step 2.2: Shared Service Extraction Strategy
// The trickiest part: services that multiple MFEs depend on

// BEFORE: AuthService lives in the monolith
// PROBLEM: When we extract Users MFE, it still needs AuthService

// SOLUTION: Three-layer service architecture

// Layer 1: Contract (npm package — @corp/mfe-contracts)
export interface IAuthService {
  readonly currentUser$: Observable<User | null>;
  readonly isAuthenticated$: Observable<boolean>;
  getToken(): string | null;
  logout(): void;
}

// Layer 2: Implementation (provided by Shell)
@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.userSubject.asObservable();
  readonly isAuthenticated$ = this.currentUser$.pipe(map(u => u !== null));

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.userSubject.next(null);
    window.dispatchEvent(new CustomEvent('mfe:logout'));
  }
}

// Layer 3: Injection Token (MFEs inject via token, not concrete class)
// @corp/shared-services/src/tokens.ts
export const AUTH_SERVICE = new InjectionToken<IAuthService>('AuthService');

// Shell provides the implementation
// shell/src/app/app.module.ts
@NgModule({
  providers: [
    { provide: AUTH_SERVICE, useClass: AuthService },
  ],
})
export class AppModule {}

// MFE consumes via token — no direct dependency on Shell's AuthService
// mfe-users/src/app/user-profile.component.ts
@Component({ /* ... */ })
export class UserProfileComponent {
  constructor(@Inject(AUTH_SERVICE) private auth: IAuthService) {
    this.auth.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}
```

#### Phase 3: Monolith Decommission (Weeks 31–42)

```
Step 3.1: Verify All Routes Migrated
─────────────────────────────────────
├── Run route audit: compare monolith routes vs shell routes
├── Verify all feature flags are at 100% (MFE enabled for all users)
├── Monitor: zero traffic to /legacy/** routes for 2+ weeks
├── Run full E2E suite against MFE-only configuration
└── Sign-off from all 6 team leads

Step 3.2: Remove Monolith
──────────────────────────
├── Remove monolith remote entry from shell config
├── Remove /legacy/** fallback routes
├── Archive monolith repository (don't delete — you'll need it for git blame)
├── Update CI/CD to remove monolith build pipeline
└── Celebrate 🎉 (seriously, this is a multi-quarter effort)
```

### Rollback Strategy — Multi-Level Safety Net

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rollback Levels                               │
│                                                                 │
│  Level 1: Feature Flag (instant, per-MFE)                      │
│  ├── Flip flag → traffic routes to monolith version             │
│  ├── Zero deployment needed                                     │
│  └── Recovery time: < 1 minute                                  │
│                                                                 │
│  Level 2: CDN Rollback (fast, per-MFE)                         │
│  ├── Point remoteEntry.js URL to previous build artifact        │
│  ├── CDN cache invalidation: 1-5 minutes                       │
│  └── Recovery time: < 10 minutes                                │
│                                                                 │
│  Level 3: Shell Rollback (medium, affects all MFEs)             │
│  ├── Redeploy previous shell version                            │
│  ├── All MFE remote URLs revert to known-good versions          │
│  └── Recovery time: < 30 minutes                                │
│                                                                 │
│  Level 4: Full Monolith Fallback (nuclear option)               │
│  ├── DNS switch: app.corp.com → monolith deployment             │
│  ├── Only used if shell itself is broken                        │
│  └── Recovery time: < 1 hour (DNS propagation)                  │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// Automated rollback trigger — integrated with monitoring
// shell/src/app/services/mfe-health-monitor.service.ts

@Injectable({ providedIn: 'root' })
export class MfeHealthMonitor {
  private errorCounts = new Map<string, number>();
  private readonly ERROR_THRESHOLD = 10;  // errors per minute
  private readonly CHECK_INTERVAL = 60_000; // 1 minute

  constructor(
    private featureFlags: FeatureFlagService,
    private alerting: AlertingService,
  ) {
    this.startMonitoring();
  }

  reportError(mfeName: string, error: Error): void {
    const count = (this.errorCounts.get(mfeName) || 0) + 1;
    this.errorCounts.set(mfeName, count);

    if (count >= this.ERROR_THRESHOLD) {
      this.triggerAutoRollback(mfeName, count);
    }
  }

  private triggerAutoRollback(mfeName: string, errorCount: number): void {
    console.error(
      `[MFE Health] Auto-rollback triggered for ${mfeName}. ` +
      `${errorCount} errors in last minute. Disabling MFE feature flag.`
    );

    // Level 1 rollback: disable the MFE via feature flag
    this.featureFlags.disable(`mfe.${mfeName}.enabled`);

    // Alert the team
    this.alerting.critical({
      title: `MFE Auto-Rollback: ${mfeName}`,
      message: `${errorCount} errors/min exceeded threshold of ${this.ERROR_THRESHOLD}. ` +
               `Feature flag disabled. Traffic routed to monolith fallback.`,
      team: this.getTeamForMfe(mfeName),
    });
  }

  private startMonitoring(): void {
    interval(this.CHECK_INTERVAL).subscribe(() => {
      this.errorCounts.clear(); // Reset counts each interval
    });
  }

  private getTeamForMfe(mfeName: string): string {
    const teamMap: Record<string, string> = {
      'dashboard-mfe': 'team-alpha',
      'reports-mfe': 'team-beta',
      'settings-mfe': 'team-gamma',
      'billing-mfe': 'team-delta',
      'users-mfe': 'team-epsilon',
      'analytics-mfe': 'team-zeta',
    };
    return teamMap[mfeName] || 'platform-team';
  }
}
```

### Timeline Estimation — Realistic Enterprise Schedule

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Migration Timeline (42 Weeks)                        │
│                                                                         │
│  Phase 0: Preparation                                                   │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Weeks 1-4             │
│  │ Audit, dependency graph, shared lib extraction                       │
│                                                                         │
│  Phase 1: Shell + Pilot MFE (Settings)                                  │
│  ░░░░████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Weeks 5-10            │
│  │ Shell app, Module Federation, first MFE, feature flags               │
│                                                                         │
│  Phase 2: Parallel Migration                                            │
│  ░░░░░░░░░░░░░░░████████████████████████████░░░  Weeks 11-34           │
│  │ Users → Reports → Analytics → Billing → Dashboard                    │
│  │ Each domain: 4-6 weeks (extract, test, canary, rollout)              │
│                                                                         │
│  Phase 3: Monolith Decommission                                         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████  Weeks 35-42         │
│  │ Remove legacy routes, archive monolith, cleanup                      │
│                                                                         │
│  Total: ~10 months with 6 teams working in parallel                     │
│  Buffer: Add 20% for unknowns → ~12 months realistic                    │
└─────────────────────────────────────────────────────────────────────────┘
```

> 🎯 **Interview Tip:** When asked "How long would this take?", never give a single number.
> Give a range with assumptions: "10-12 months assuming 6 dedicated teams, an existing CI/CD
> pipeline, and management buy-in for the shared library extraction. The biggest risk factor
> is hidden coupling in shared services — that's where the 20% buffer goes."

### Key Trade-offs to Discuss in Interview

| Decision | Trade-off | Your Recommendation |
|---|---|---|
| Big bang rewrite vs. Strangler Fig | Speed vs. Safety | Strangler Fig — always. Big bang rewrites fail 70%+ of the time in enterprise. |
| Nx monorepo vs. polyrepo | Consistency vs. Independence | Nx monorepo during migration (shared tooling), polyrepo after stabilization. |
| Feature flags per route vs. per component | Granularity vs. Complexity | Per route — component-level flags add too much conditional logic. |
| Shared lib as npm vs. Module Federation shared | Version control vs. Runtime flexibility | npm for stable libs (ui-kit), MF shared for framework deps (Angular, RxJS). |
| Canary rollout vs. blue-green | Gradual risk vs. Simple rollback | Canary (10% → 50% → 100%) for MFEs. Blue-green for the shell. |

---

## Q3: Design the Shell Application for a Micro Frontend Ecosystem

### Opening Framework — How to Structure Your Answer

> 🎯 **Interview Tip:** The Shell (App Shell) is the single most critical piece of a Micro Frontend
> architecture. It's the one thing every user loads, every MFE depends on, and every team curses
> when it breaks. Lead with: "The shell should be as thin as possible — its job is orchestration,
> not business logic." Then walk through the five responsibilities: routing, auth, error handling,
> shared state, and remote module loading.

### Shell Application Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Shell Application                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    1. BOOTSTRAP SEQUENCE                        │   │
│  │  Load config → Init auth → Fetch remote manifest → Init router  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ 2. ROUTING   │  │ 3. AUTH      │  │ 4. ERROR     │  │ 5. SHARED │  │
│  │              │  │              │  │   BOUNDARIES  │  │   STATE   │  │
│  │ Top-level    │  │ Token mgmt   │  │              │  │           │  │
│  │ route map    │  │ SSO/OAuth    │  │ Fallback UI  │  │ User ctx  │  │
│  │ Lazy loading │  │ Interceptors │  │ Per-MFE      │  │ Theme     │  │
│  │ Guards       │  │ Session mgmt │  │ isolation    │  │ Locale    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    6. GLOBAL CHROME                              │   │
│  │  Top nav │ Side nav │ Breadcrumbs │ Notifications │ Footer      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Lines of code target: < 5,000 (excluding tests)                       │
│  Bundle size target: < 150KB gzipped                                    │
│  Deploy frequency: Low (monthly or less)                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Single-SPA vs. Module Federation — Trade-offs Table

> 🎯 **Interview Tip:** Interviewers love this comparison. Don't just pick one — show you
> understand when each shines. The answer is almost always "Module Federation for same-framework
> shops, Single-SPA for polyglot environments."

| Dimension | Single-SPA | Module Federation (Webpack 5) |
|---|---|---|
| **Framework support** | Any framework (React, Angular, Vue, Svelte) | Same framework preferred (can mix, but painful) |
| **Shared dependencies** | Manual — you manage shared bundles via import maps or SystemJS | Built-in — `shared` config handles dedup, version negotiation |
| **Routing** | Single-SPA manages top-level routing via `registerApplication()` | Host Angular Router manages routing natively |
| **Build tooling** | Framework-agnostic, works with any bundler | Webpack 5 required (or Vite with federation plugin) |
| **Learning curve** | Steeper — new mental model (parcels, lifecycles, SystemJS) | Lower for Angular teams — feels like lazy loading |
| **Runtime overhead** | Higher — Single-SPA runtime + SystemJS + import maps | Lower — Webpack handles module resolution natively |
| **Deployment** | Each app is a standalone JS bundle at a URL | Each remote exposes `remoteEntry.js` at a URL |
| **Shared state** | No built-in solution — use CustomEvents or shared libs | Can share singleton services via `shared` config |
| **Error isolation** | Built-in — each app has its own error boundary lifecycle | Manual — you must implement error boundaries yourself |
| **TypeScript support** | Weak — type safety across app boundaries is manual | Better — shared types via npm packages, same build pipeline |
| **Maturity** | Battle-tested (2018+), large community | Newer (2020+), rapidly maturing, Webpack-native |
| **Best for** | Polyglot orgs (React + Angular + Vue coexisting) | Single-framework shops (all Angular or all React) |

### Architect's Verdict — Single-SPA vs. Module Federation

> **For an all-Angular enterprise:** Module Federation wins. It integrates natively with Angular's
> lazy loading, the `@angular-architects/module-federation` library handles the boilerplate, and
> shared dependency management is built into webpack config. You don't need the overhead of
> Single-SPA's lifecycle management when every MFE speaks the same language.
>
> **For a polyglot org (React + Angular + Vue):** Single-SPA is the only viable option. Module
> Federation can technically load cross-framework remotes, but shared dependency management becomes
> a nightmare — you can't singleton-share `@angular/core` and `react` in the same scope.
>
> **Hybrid approach:** Use Module Federation for same-framework MFEs and wrap legacy/different-
> framework apps as Single-SPA parcels. This is the pragmatic enterprise answer.

### Bootstrap Sequence — Shell Initialization

> **What this diagram shows:** The exact order of operations when a user hits your app URL.
> Every step is a potential failure point — the shell must handle failures at each stage gracefully.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Shell Bootstrap Sequence                              │
│                                                                         │
│  Browser loads index.html                                               │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────┐                                │
│  │ Step 1: Load Shell Bundle           │  (~50KB gzipped)               │
│  │ main.js + polyfills.js              │                                │
│  └──────────────────┬──────────────────┘                                │
│                     │                                                   │
│                     ▼                                                   │
│  ┌─────────────────────────────────────┐                                │
│  │ Step 2: Fetch Runtime Config        │  GET /assets/config.json       │
│  │ (MFE URLs, feature flags, env)      │  or environment-specific CDN   │
│  │                                     │                                │
│  │ ON FAILURE: Show "Service           │                                │
│  │ Unavailable" page with retry btn    │                                │
│  └──────────────────┬──────────────────┘                                │
│                     │                                                   │
│                     ▼                                                   │
│  ┌─────────────────────────────────────┐                                │
│  │ Step 3: Initialize Authentication   │  Check existing session/token  │
│  │ - Validate stored token             │  OAuth2/OIDC silent refresh    │
│  │ - If expired → redirect to IdP      │                                │
│  │ - If valid → extract user context   │                                │
│  │                                     │                                │
│  │ ON FAILURE: Redirect to /login      │                                │
│  └──────────────────┬──────────────────┘                                │
│                     │                                                   │
│                     ▼                                                   │
│  ┌─────────────────────────────────────┐                                │
│  │ Step 4: Fetch Remote Manifest       │  GET /assets/mfe-manifest.json │
│  │ - List of MFEs + their URLs         │                                │
│  │ - Health status of each remote      │                                │
│  │ - Feature flag overrides            │                                │
│  │                                     │                                │
│  │ ON FAILURE: Use cached manifest     │                                │
│  │ from localStorage (stale but works) │                                │
│  └──────────────────┬──────────────────┘                                │
│                     │                                                   │
│                     ▼                                                   │
│  ┌─────────────────────────────────────┐                                │
│  │ Step 5: Initialize Angular Router   │  Register routes from manifest │
│  │ - Map manifest entries to routes    │                                │
│  │ - Attach guards (auth, role, flag)  │                                │
│  │ - Set up error boundaries per route │                                │
│  └──────────────────┬──────────────────┘                                │
│                     │                                                   │
│                     ▼                                                   │
│  ┌─────────────────────────────────────┐                                │
│  │ Step 6: Render Shell Chrome         │  Nav bar, sidebar, footer      │
│  │ - Display loading skeleton          │                                │
│  │ - Navigate to initial route         │                                │
│  │ - Lazy-load target MFE              │                                │
│  └──────────────────┬──────────────────┘                                │
│                     │                                                   │
│                     ▼                                                   │
│  ┌─────────────────────────────────────┐                                │
│  │ Step 7: Load Target MFE             │  Fetch remoteEntry.js          │
│  │ - Download remote entry             │  + shared scope negotiation    │
│  │ - Negotiate shared dependencies     │                                │
│  │ - Bootstrap MFE Angular module      │                                │
│  │                                     │                                │
│  │ ON FAILURE: Show MFE error          │                                │
│  │ boundary with retry + fallback      │                                │
│  └─────────────────────────────────────┘                                │
│                                                                         │
│  Total time budget: < 2 seconds to interactive (on 4G)                  │
└─────────────────────────────────────────────────────────────────────────┘
```


### Shell Bootstrap Implementation

```typescript
// shell/src/main.ts — Bootstrap with runtime config
// This is the entry point. Everything starts here.

async function bootstrapShell(): Promise<void> {
  try {
    // Step 2: Fetch runtime config BEFORE Angular bootstraps
    const config = await fetchRuntimeConfig();

    // Step 3: Validate authentication
    const authResult = await validateAuthentication(config);
    if (!authResult.isAuthenticated) {
      window.location.href = config.loginUrl;
      return;
    }

    // Step 4: Fetch and cache remote manifest
    const manifest = await fetchRemoteManifest(config);

    // Step 5-7: Bootstrap Angular with dynamic routes
    const appModule = await import('./app/app.module');
    await platformBrowserDynamic([
      { provide: APP_CONFIG, useValue: config },
      { provide: AUTH_CONTEXT, useValue: authResult },
      { provide: MFE_MANIFEST, useValue: manifest },
    ]).bootstrapModule(appModule.AppModule);

  } catch (error) {
    // Critical failure — show static error page
    document.getElementById('app-root')!.innerHTML = `
      <div class="shell-error">
        <h1>Unable to load application</h1>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
        <button onclick="window.location.reload()">Retry</button>
      </div>
    `;
    console.error('[Shell Bootstrap] Critical failure:', error);
  }
}

async function fetchRuntimeConfig(): Promise<AppConfig> {
  const response = await fetch('/assets/config.json');
  if (!response.ok) throw new Error(`Config fetch failed: ${response.status}`);
  return response.json();
}

async function validateAuthentication(config: AppConfig): Promise<AuthResult> {
  const token = localStorage.getItem('auth_token');
  if (!token) return { isAuthenticated: false };

  // Validate token with auth server (lightweight check)
  const response = await fetch(`${config.authUrl}/validate`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    localStorage.removeItem('auth_token');
    return { isAuthenticated: false };
  }

  const user = await response.json();
  return { isAuthenticated: true, user, token };
}

async function fetchRemoteManifest(config: AppConfig): Promise<MfeManifest> {
  try {
    const response = await fetch(`${config.manifestUrl}/mfe-manifest.json`);
    if (!response.ok) throw new Error(`Manifest fetch failed: ${response.status}`);
    const manifest = await response.json();

    // Cache for offline/fallback use
    localStorage.setItem('mfe-manifest-cache', JSON.stringify(manifest));
    return manifest;
  } catch (error) {
    // Fallback to cached manifest
    const cached = localStorage.getItem('mfe-manifest-cache');
    if (cached) {
      console.warn('[Shell] Using cached manifest due to fetch failure');
      return JSON.parse(cached);
    }
    throw error; // No cache available — critical failure
  }
}

bootstrapShell();
```

### Lazy Loading Remote Manifests — Dynamic Route Registration

> **What this code does:** Instead of hardcoding MFE URLs in webpack config, the shell fetches
> a manifest at runtime. This means you can add/remove/update MFEs without redeploying the shell.
> The manifest is the single source of truth for what MFEs exist and where they live.

```typescript
// shell/src/app/types/mfe-manifest.ts
export interface MfeManifest {
  version: string;
  lastUpdated: string;
  remotes: MfeRemoteEntry[];
}

export interface MfeRemoteEntry {
  name: string;                    // Unique MFE identifier
  displayName: string;             // Human-readable name for nav
  remoteEntryUrl: string;          // URL to remoteEntry.js
  exposedModule: string;           // e.g., './DashboardModule'
  routePath: string;               // e.g., 'dashboard'
  requiredRoles: string[];         // RBAC roles needed
  icon: string;                    // Nav icon identifier
  enabled: boolean;                // Kill switch
  healthCheckUrl: string;          // Endpoint to verify MFE is alive
  fallbackUrl?: string;            // Static fallback page URL
  metadata: {
    team: string;
    version: string;
    lastDeployed: string;
  };
}

// Example manifest — served from CDN, updated by each MFE's CI/CD
// GET https://cdn.corp.com/mfe-manifest.json
const exampleManifest: MfeManifest = {
  version: '2.4.0',
  lastUpdated: '2024-12-15T10:30:00Z',
  remotes: [
    {
      name: 'dashboard',
      displayName: 'Dashboard',
      remoteEntryUrl: 'https://mfe-dashboard.corp.com/remoteEntry.js',
      exposedModule: './DashboardModule',
      routePath: 'dashboard',
      requiredRoles: ['user', 'admin'],
      icon: 'dashboard',
      enabled: true,
      healthCheckUrl: 'https://mfe-dashboard.corp.com/health',
      metadata: { team: 'team-alpha', version: '3.2.1', lastDeployed: '2024-12-14' },
    },
    {
      name: 'reports',
      displayName: 'Reports',
      remoteEntryUrl: 'https://mfe-reports.corp.com/remoteEntry.js',
      exposedModule: './ReportsModule',
      routePath: 'reports',
      requiredRoles: ['user', 'admin', 'analyst'],
      icon: 'bar_chart',
      enabled: true,
      healthCheckUrl: 'https://mfe-reports.corp.com/health',
      metadata: { team: 'team-beta', version: '2.8.0', lastDeployed: '2024-12-13' },
    },
    // ... other MFEs
  ],
};
```

```typescript
// shell/src/app/services/dynamic-route.service.ts
// Converts manifest entries into Angular routes at runtime

import { loadRemoteModule } from '@angular-architects/module-federation';

@Injectable({ providedIn: 'root' })
export class DynamicRouteService {
  constructor(
    private router: Router,
    @Inject(MFE_MANIFEST) private manifest: MfeManifest,
    @Inject(AUTH_CONTEXT) private authContext: AuthResult,
  ) {}

  registerRoutesFromManifest(): void {
    const mfeRoutes: Routes = this.manifest.remotes
      .filter((remote) => remote.enabled)
      .map((remote) => this.createRouteForRemote(remote));

    // Append MFE routes to existing shell routes
    const existingRoutes = this.router.config;
    const wildcardRoute = existingRoutes.find((r) => r.path === '**');

    // Insert MFE routes BEFORE the wildcard catch-all
    const newRoutes = [
      ...existingRoutes.filter((r) => r.path !== '**'),
      ...mfeRoutes,
      ...(wildcardRoute ? [wildcardRoute] : []),
    ];

    this.router.resetConfig(newRoutes);
    console.log(`[Shell] Registered ${mfeRoutes.length} MFE routes from manifest`);
  }

  private createRouteForRemote(remote: MfeRemoteEntry): Route {
    return {
      path: remote.routePath,
      canActivate: [AuthGuard, RoleGuard, MfeHealthGuard],
      data: {
        mfeName: remote.name,
        requiredRoles: remote.requiredRoles,
        healthCheckUrl: remote.healthCheckUrl,
        fallbackUrl: remote.fallbackUrl,
      },
      loadChildren: () =>
        loadRemoteModule({
          type: 'module',
          remoteEntry: remote.remoteEntryUrl,
          exposedModule: remote.exposedModule,
        })
          .then((m) => m[this.getModuleName(remote.exposedModule)])
          .catch((err) => {
            console.error(`[Shell] Failed to load MFE: ${remote.name}`, err);
            // Return a fallback error module instead of crashing
            return import('./fallback/mfe-error.module').then((m) => m.MfeErrorModule);
          }),
    };
  }

  private getModuleName(exposedModule: string): string {
    // './DashboardModule' → 'DashboardModule'
    return exposedModule.replace('./', '');
  }
}
```

### Fallback & Error UI Strategy — Error Boundaries Per MFE

> 🎯 **Interview Tip:** This is where you differentiate yourself. Most candidates forget error
> handling entirely. In production, MFEs WILL fail — network issues, deployment mismatches,
> JavaScript errors. The shell must isolate failures so one broken MFE doesn't take down the
> entire application.

```
Error Boundary Architecture:
────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                         Shell                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Global Error Boundary                         │  │
│  │  Catches: Shell-level errors (routing, auth, config)       │  │
│  │  Action: Full-page error with "Contact Support"            │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│  │  │ MFE Error   │  │ MFE Error   │  │ MFE Error   │       │  │
│  │  │ Boundary A  │  │ Boundary B  │  │ Boundary C  │       │  │
│  │  │             │  │             │  │             │       │  │
│  │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │       │  │
│  │  │ │Dashboard│ │  │ │ Reports │ │  │ │Settings │ │       │  │
│  │  │ │  MFE    │ │  │ │  MFE    │ │  │ │  MFE    │ │       │  │
│  │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │       │  │
│  │  │             │  │             │  │             │       │  │
│  │  │ On Error:   │  │ On Error:   │  │ On Error:   │       │  │
│  │  │ Show local  │  │ Show local  │  │ Show local  │       │  │
│  │  │ fallback UI │  │ fallback UI │  │ fallback UI │       │  │
│  │  │ + retry btn │  │ + retry btn │  │ + retry btn │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Key: MFE failure is ISOLATED. Dashboard crashing does NOT       │
│  affect Reports or Settings. User can navigate away and          │
│  continue working.                                               │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// shell/src/app/components/mfe-error-boundary.component.ts
// Wraps each MFE outlet with error catching and fallback UI

@Component({
  selector: 'shell-mfe-error-boundary',
  template: `
    <!-- Normal state: render the MFE via router outlet -->
    <ng-container *ngIf="!hasError; else errorTemplate">
      <router-outlet></router-outlet>
    </ng-container>

    <!-- Error state: show fallback UI -->
    <ng-template #errorTemplate>
      <div class="mfe-error-boundary" role="alert">
        <div class="mfe-error-content">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h2>This section is temporarily unavailable</h2>
          <p>
            The {{ mfeName }} module encountered an error.
            Your other tools are still working normally.
          </p>
          <div class="error-actions">
            <button mat-raised-button color="primary" (click)="retry()">
              Try Again
            </button>
            <button mat-stroked-button (click)="navigateHome()">
              Go to Dashboard
            </button>
          </div>
          <p class="error-meta" *ngIf="showDetails">
            Error ID: {{ errorId }} | {{ timestamp | date:'medium' }}
          </p>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .mfe-error-boundary {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
      padding: 2rem;
    }
    .mfe-error-content { text-align: center; max-width: 500px; }
    .error-icon { font-size: 64px; height: 64px; width: 64px; color: #f44336; }
    .error-actions { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; }
    .error-meta { margin-top: 2rem; font-size: 0.75rem; color: #999; }
  `],
})
export class MfeErrorBoundaryComponent implements OnInit, OnDestroy {
  hasError = false;
  mfeName = '';
  errorId = '';
  timestamp = new Date();
  showDetails = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private errorReporter: ErrorReportingService,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.mfeName = this.route.snapshot.data['mfeName'] || 'Unknown';

    // Listen for errors from the MFE loaded in this outlet
    this.zone.onError
      .pipe(takeUntil(this.destroy$))
      .subscribe((error: Error) => {
        this.handleMfeError(error);
      });
  }

  handleMfeError(error: Error): void {
    this.hasError = true;
    this.errorId = this.generateErrorId();
    this.timestamp = new Date();

    // Report to monitoring (Sentry, DataDog, etc.)
    this.errorReporter.report({
      errorId: this.errorId,
      mfeName: this.mfeName,
      error: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: this.timestamp,
    });

    console.error(`[MFE Error Boundary] ${this.mfeName} failed:`, error);
  }

  retry(): void {
    this.hasError = false;
    // Force re-navigation to trigger MFE reload
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);
    });
  }

  navigateHome(): void {
    this.router.navigate(['/dashboard']);
  }

  private generateErrorId(): string {
    return `ERR-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```


### Auth Token Propagation Across MFEs

> **The core challenge:** The shell owns authentication, but every MFE needs to make authenticated
> API calls. How do you propagate the auth token without every MFE implementing its own auth logic?

```
Auth Token Flow:
────────────────

┌──────────┐     ┌──────────────────────────────────────────────┐
│   IdP    │     │                  Shell                        │
│ (Okta/   │◄───►│  ┌────────────────────────────────────────┐  │
│  Auth0/  │     │  │ AuthService (singleton, provided root)  │  │
│  Azure   │     │  │                                         │  │
│  AD)     │     │  │ - Manages OAuth2/OIDC flow              │  │
│          │     │  │ - Stores token in memory (NOT localStorage│ │
│          │     │  │   for XSS protection)                   │  │
│          │     │  │ - Handles silent refresh                │  │
│          │     │  │ - Exposes token via InjectionToken      │  │
│          │     │  └──────────────┬─────────────────────────┘  │
└──────────┘     │                 │                             │
                 │    Token flows via:                           │
                 │    1. Shared HttpInterceptor (recommended)    │
                 │    2. InjectionToken (for direct access)      │
                 │    3. CustomEvent (for non-Angular MFEs)      │
                 │                 │                             │
                 │  ┌──────────────▼─────────────────────────┐  │
                 │  │     AuthInterceptor (singleton)         │  │
                 │  │     Automatically attaches Bearer token  │  │
                 │  │     to ALL outgoing HTTP requests        │  │
                 │  └──────────────┬─────────────────────────┘  │
                 │                 │                             │
                 └─────────────────┼─────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  MFE HTTP requests go out    │
                    │  with Authorization header   │
                    │  automatically — MFEs don't  │
                    │  need to know about tokens   │
                    └──────────────────────────────┘
```

```typescript
// shell/src/app/services/auth.service.ts
// The shell owns the ONLY AuthService instance in the entire app

@Injectable({ providedIn: 'root' })
export class ShellAuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  readonly token$ = this.tokenSubject.asObservable();
  readonly user$ = this.userSubject.asObservable();
  readonly isAuthenticated$ = this.token$.pipe(map((t) => t !== null));

  constructor(private http: HttpClient, private config: AppConfig) {}

  // Called during shell bootstrap (Step 3)
  async initialize(existingToken?: string): Promise<AuthResult> {
    if (existingToken && !this.isTokenExpired(existingToken)) {
      this.setToken(existingToken);
      return { isAuthenticated: true, user: this.decodeToken(existingToken) };
    }

    // Try silent refresh
    try {
      const newToken = await this.silentRefresh();
      this.setToken(newToken);
      return { isAuthenticated: true, user: this.decodeToken(newToken) };
    } catch {
      return { isAuthenticated: false };
    }
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  private setToken(token: string): void {
    this.tokenSubject.next(token);
    this.userSubject.next(this.decodeToken(token));
    this.scheduleRefresh(token);

    // Notify non-Angular MFEs via CustomEvent
    window.dispatchEvent(
      new CustomEvent('mfe:auth-token-updated', {
        detail: { token, user: this.decodeToken(token) },
      })
    );
  }

  private scheduleRefresh(token: string): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);

    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = payload.exp * 1000 - Date.now();
    const refreshAt = expiresIn - 60_000; // Refresh 1 minute before expiry

    this.refreshTimer = setTimeout(() => {
      this.silentRefresh()
        .then((newToken) => this.setToken(newToken))
        .catch(() => {
          // Token refresh failed — force re-login
          window.dispatchEvent(new CustomEvent('mfe:session-expired'));
          window.location.href = this.config.loginUrl;
        });
    }, Math.max(refreshAt, 0));
  }

  private async silentRefresh(): Promise<string> {
    const response = await fetch(`${this.config.authUrl}/refresh`, {
      method: 'POST',
      credentials: 'include', // Send refresh token cookie
    });
    if (!response.ok) throw new Error('Silent refresh failed');
    const data = await response.json();
    return data.access_token;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private decodeToken(token: string): AuthUser {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles || [],
      tenantId: payload.tenant_id,
    };
  }
}
```

```typescript
// shell/src/app/interceptors/auth.interceptor.ts
// This interceptor is provided at the ROOT level — all MFEs inherit it
// because HttpClient is a shared singleton

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: ShellAuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    if (token && this.shouldAttachToken(req.url)) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            // Token rejected by API — trigger re-auth
            window.dispatchEvent(new CustomEvent('mfe:session-expired'));
          }
          return throwError(() => error);
        }),
      );
    }

    return next.handle(req);
  }

  // Only attach token to our own API domains — never to third-party URLs
  private shouldAttachToken(url: string): boolean {
    const trustedDomains = [
      'api.corp.com',
      'api-staging.corp.com',
      'localhost:3000',
    ];
    return trustedDomains.some((domain) => url.includes(domain));
  }
}

// Provided in shell's root module — MFEs get this automatically
// shell/src/app/app.module.ts
@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
})
export class AppModule {}
```

### Shared State Patterns in the Shell

> **The golden rule:** The shell should manage the absolute minimum shared state. If state
> doesn't need to be shared, it shouldn't be. Each MFE owns its own domain state.

```
Shared State Ownership:
───────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                    Shell Owns (Global State)                     │
│                                                                  │
│  ✅ Authenticated user (id, name, roles, tenant)                │
│  ✅ Auth token (access + refresh lifecycle)                     │
│  ✅ Theme preference (light/dark)                               │
│  ✅ Locale / i18n language                                      │
│  ✅ Feature flags (global toggles)                              │
│  ✅ Navigation state (active route, breadcrumbs)                │
│  ✅ Global notifications / toasts                               │
│                                                                  │
│  Total: ~7 state slices. That's it. No more.                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MFE Owns (Domain State)                       │
│                                                                  │
│  ❌ Dashboard widget layout → Dashboard MFE                     │
│  ❌ Report filters/sorting → Reports MFE                        │
│  ❌ User management CRUD → Users MFE                            │
│  ❌ Billing plan selection → Billing MFE                        │
│  ❌ Analytics date ranges → Analytics MFE                       │
│                                                                  │
│  Rule: If only one MFE cares about it, that MFE owns it.       │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// shell/src/app/services/shell-state.service.ts
// Minimal shared state — exposed to MFEs via Module Federation shared singleton

export interface ShellState {
  user: AuthUser | null;
  theme: 'light' | 'dark';
  locale: string;
  featureFlags: Record<string, boolean>;
  notifications: Notification[];
}

@Injectable({ providedIn: 'root' })
export class ShellStateService {
  private state = new BehaviorSubject<ShellState>({
    user: null,
    theme: 'light',
    locale: 'en-US',
    featureFlags: {},
    notifications: [],
  });

  // Expose read-only slices — MFEs subscribe to what they need
  readonly user$ = this.state.pipe(map((s) => s.user), distinctUntilChanged());
  readonly theme$ = this.state.pipe(map((s) => s.theme), distinctUntilChanged());
  readonly locale$ = this.state.pipe(map((s) => s.locale), distinctUntilChanged());
  readonly featureFlags$ = this.state.pipe(map((s) => s.featureFlags), distinctUntilChanged());

  // Controlled mutations — only the shell should call these
  setUser(user: AuthUser | null): void {
    this.updateState({ user });
    // Also broadcast via CustomEvent for non-Angular consumers
    window.dispatchEvent(new CustomEvent('mfe:user-changed', { detail: { user } }));
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.updateState({ theme });
    document.documentElement.setAttribute('data-theme', theme);
    window.dispatchEvent(new CustomEvent('mfe:theme-changed', { detail: { theme } }));
  }

  setLocale(locale: string): void {
    this.updateState({ locale });
    window.dispatchEvent(new CustomEvent('mfe:locale-changed', { detail: { locale } }));
  }

  // Feature flag check — MFEs use this to conditionally render features
  isFeatureEnabled(flagKey: string): boolean {
    return this.state.value.featureFlags[flagKey] ?? false;
  }

  addNotification(notification: Notification): void {
    const current = this.state.value.notifications;
    this.updateState({ notifications: [...current, notification] });
  }

  private updateState(partial: Partial<ShellState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }
}
```

### Architect's Verdict — Shell Application Design

> **The shell is a liability, not an asset.** Every line of code in the shell is a line that
> blocks every team. Keep it thin:
>
> - **< 5,000 lines of code** (excluding tests)
> - **< 150KB gzipped** bundle size
> - **Monthly deploy cadence** (or less)
> - **Zero business logic** — only orchestration
>
> The shell's job is to be boring. If your shell is exciting, you're doing it wrong.
>
> **Three rules for shell development:**
> 1. If a feature belongs to one team, it goes in their MFE — not the shell.
> 2. If you're debating whether something goes in the shell, it probably doesn't.
> 3. The shell team should be the smallest team (2-3 engineers), not the largest.

---


## BONUS: Cross-MFE State Sharing Without Tight Coupling

> 🎯 **Interview Tip:** This is the follow-up question that separates Senior from Principal
> candidates. The interviewer wants to see you navigate the tension between "MFEs should be
> independent" and "but they need to share user context, cart state, and theme." The answer
> is: share the minimum, use the loosest coupling mechanism that works, and document the contract.

### The Problem Statement

```
The Paradox of Micro Frontends:
───────────────────────────────

  "MFEs should be independently deployable"
                    vs.
  "The user sees ONE application — state must be consistent"

  User logs in → Shell knows. But does Dashboard MFE know?
  User switches to dark mode → Settings MFE knows. But does Reports MFE know?
  User adds item to cart → Cart MFE knows. But does Checkout MFE know?

  The answer depends on HOW you share — not WHETHER you share.
```

### Pattern 1: Shared Singleton Service via Module Federation

> **How it works:** A service is published as a shared singleton in webpack config. Module
> Federation ensures only ONE instance exists at runtime, even though multiple MFEs import it.
> All MFEs get the same BehaviorSubject, so state changes propagate automatically via RxJS.

```typescript
// @corp/shared-state/src/user-state.service.ts
// Published as npm package, configured as singleton in Module Federation

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private userSubject = new BehaviorSubject<SharedUser | null>(null);
  private themeSubject = new BehaviorSubject<'light' | 'dark'>('light');
  private cartSubject = new BehaviorSubject<CartSummary>({ items: [], total: 0 });

  // Read-only observables — any MFE can subscribe
  readonly user$ = this.userSubject.asObservable();
  readonly theme$ = this.themeSubject.asObservable();
  readonly cart$ = this.cartSubject.asObservable();

  // Write methods — controlled mutations
  setUser(user: SharedUser | null): void {
    this.userSubject.next(user);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.themeSubject.next(theme);
  }

  updateCart(cart: CartSummary): void {
    this.cartSubject.next(cart);
  }
}

// Webpack shared config ensures singleton:
// shared: {
//   '@corp/shared-state': { singleton: true, strictVersion: true, requiredVersion: '^1.0.0' }
// }
```

```typescript
// MFE-A (Dashboard) — consumes shared state
@Component({
  selector: 'dashboard-header',
  template: `
    <div [class]="(theme$ | async) === 'dark' ? 'dark-header' : 'light-header'">
      <span>Welcome, {{ (user$ | async)?.name }}</span>
      <span class="cart-badge">{{ (cart$ | async)?.items?.length }} items</span>
    </div>
  `,
})
export class DashboardHeaderComponent {
  user$ = this.userState.user$;
  theme$ = this.userState.theme$;
  cart$ = this.userState.cart$;

  constructor(private userState: UserStateService) {}
}
```

**Pros:**
- Type-safe — full TypeScript support, IDE autocomplete
- Reactive — RxJS observables, Angular change detection works natively
- Familiar — Angular developers already know BehaviorSubject patterns

**Cons:**
- Version coupling — all MFEs must use compatible versions of `@corp/shared-state`
- Deployment risk — updating the shared service requires coordinated testing
- Framework lock-in — only works if all MFEs are Angular (or at least RxJS-based)

### Pattern 2: CustomEvent-Based Pub/Sub

> **How it works:** MFEs communicate via native DOM CustomEvents dispatched on `window`.
> Zero shared code required — the only contract is the event name and payload shape,
> documented in a shared TypeScript types package.

```typescript
// @corp/mfe-contracts/src/events.ts — Shared TYPES only (no runtime code)
export const STATE_EVENTS = {
  USER_CHANGED: 'mfe:state:user-changed',
  THEME_CHANGED: 'mfe:state:theme-changed',
  CART_UPDATED: 'mfe:state:cart-updated',
  LOCALE_CHANGED: 'mfe:state:locale-changed',
} as const;

export interface StateEventMap {
  [STATE_EVENTS.USER_CHANGED]: { user: SharedUser | null };
  [STATE_EVENTS.THEME_CHANGED]: { theme: 'light' | 'dark' };
  [STATE_EVENTS.CART_UPDATED]: { cart: CartSummary };
  [STATE_EVENTS.LOCALE_CHANGED]: { locale: string };
}

// Type-safe event dispatcher utility
export function dispatchStateEvent<K extends keyof StateEventMap>(
  eventName: K,
  payload: StateEventMap[K],
): void {
  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail: { ...payload, timestamp: Date.now() },
      bubbles: false,
    }),
  );
}

// Type-safe event listener utility
export function onStateEvent<K extends keyof StateEventMap>(
  eventName: K,
  callback: (payload: StateEventMap[K]) => void,
): () => void {
  const handler = (event: Event) => {
    callback((event as CustomEvent).detail);
  };
  window.addEventListener(eventName, handler);
  // Return cleanup function
  return () => window.removeEventListener(eventName, handler);
}
```

```typescript
// Settings MFE — dispatches theme change
@Component({ /* ... */ })
export class ThemeToggleComponent {
  toggleTheme(newTheme: 'light' | 'dark'): void {
    // Update local state
    this.currentTheme = newTheme;

    // Broadcast to all MFEs via CustomEvent
    dispatchStateEvent(STATE_EVENTS.THEME_CHANGED, { theme: newTheme });
  }
}

// Dashboard MFE — listens for theme change
@Component({ /* ... */ })
export class DashboardComponent implements OnInit, OnDestroy {
  private cleanupThemeListener!: () => void;
  currentTheme: 'light' | 'dark' = 'light';

  ngOnInit(): void {
    this.cleanupThemeListener = onStateEvent(
      STATE_EVENTS.THEME_CHANGED,
      ({ theme }) => {
        this.currentTheme = theme;
        // Trigger Angular change detection since this comes from outside Angular
        this.cdr.markForCheck();
      },
    );
  }

  ngOnDestroy(): void {
    this.cleanupThemeListener();
  }
}
```

**Pros:**
- Zero coupling — no shared runtime dependencies between MFEs
- Framework agnostic — works with Angular, React, Vue, vanilla JS
- Simple — native browser API, no library needed
- Resilient — if a listener MFE is not loaded, events are simply ignored

**Cons:**
- No replay — late subscribers miss events (unlike BehaviorSubject)
- No type safety at runtime — TypeScript types are compile-time only
- Debugging harder — events don't show in Angular DevTools, need browser DevTools
- Manual change detection — must call `markForCheck()` or `NgZone.run()` in Angular

### Pattern 3: BroadcastChannel API

> **How it works:** Similar to CustomEvents but works across browser tabs. If a user has your
> app open in 3 tabs and changes theme in one, all tabs update. Also works across MFEs in the
> same tab since they share the same browsing context.

```typescript
// @corp/shared-state/src/cross-tab-state.service.ts

@Injectable({ providedIn: 'root' })
export class CrossTabStateService implements OnDestroy {
  private channel = new BroadcastChannel('corp-app-state');
  private messages$ = new Subject<{ type: string; payload: unknown }>();

  // Local state cache — survives tab focus changes
  private stateCache = new Map<string, unknown>();

  constructor(private zone: NgZone) {
    this.channel.onmessage = (event: MessageEvent) => {
      // Run inside Angular zone to trigger change detection
      this.zone.run(() => {
        const { type, payload } = event.data;
        this.stateCache.set(type, payload);
        this.messages$.next({ type, payload });
      });
    };
  }

  // Broadcast state change to all tabs + all MFEs
  broadcast<T>(type: string, payload: T): void {
    this.stateCache.set(type, payload);
    this.channel.postMessage({ type, payload, timestamp: Date.now() });
    // Also emit locally (BroadcastChannel doesn't fire on the sender tab)
    this.messages$.next({ type, payload });
  }

  // Subscribe to state changes — returns cached value immediately if available
  on<T>(type: string): Observable<T> {
    const cached = this.stateCache.get(type) as T | undefined;
    const live$ = this.messages$.pipe(
      filter((msg) => msg.type === type),
      map((msg) => msg.payload as T),
    );
    return cached !== undefined
      ? live$.pipe(startWith(cached))
      : live$;
  }

  // Get current cached value synchronously
  getCached<T>(type: string): T | undefined {
    return this.stateCache.get(type) as T | undefined;
  }

  ngOnDestroy(): void {
    this.channel.close();
    this.messages$.complete();
  }
}

// Usage — Theme sync across tabs
// Tab 1 (Settings MFE):
this.crossTab.broadcast('theme', 'dark');

// Tab 2 (Dashboard MFE) — automatically receives the update:
this.crossTab.on<string>('theme').subscribe((theme) => {
  document.documentElement.setAttribute('data-theme', theme);
});
```

**Pros:**
- Cross-tab sync — unique capability, no other pattern does this natively
- Simple API — similar to CustomEvents but with tab awareness
- No server needed — purely client-side, no WebSocket or SSE required
- Built-in serialization — `postMessage` handles structured clone

**Cons:**
- Browser support — available in all modern browsers, but no IE11 (irrelevant in 2024+)
- No persistence — state lost on page refresh (combine with localStorage for persistence)
- Serialization limits — can't send functions, DOM nodes, or class instances
- Same-origin only — won't work across different domains

### Pattern 4: URL-as-State

> **How it works:** Encode shared state in URL query parameters or path segments. The URL
> becomes the single source of truth. Any MFE can read it, any MFE can update it, and it
> survives page refreshes, bookmarks, and link sharing.

```typescript
// shell/src/app/services/url-state.service.ts

@Injectable({ providedIn: 'root' })
export class UrlStateService {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  // Read state from URL query params
  getParam<T>(key: string, defaultValue: T): T {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(key);
    if (value === null) return defaultValue;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  // Update URL query params without navigation (preserves MFE state)
  setParam(key: string, value: unknown): void {
    const params = new URLSearchParams(window.location.search);

    if (value === null || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }

  // Observable of a specific query param — reacts to URL changes
  watchParam<T>(key: string): Observable<T | null> {
    return this.route.queryParamMap.pipe(
      map((params) => {
        const value = params.get(key);
        if (value === null) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as unknown as T;
        }
      }),
      distinctUntilChanged(),
    );
  }
}

// Usage examples:
// URL: /dashboard?theme=dark&locale=en-US&tenant=acme-corp

// Settings MFE sets theme:
this.urlState.setParam('theme', 'dark');

// Dashboard MFE reads theme:
const theme = this.urlState.getParam('theme', 'light');

// Reports MFE watches for tenant changes:
this.urlState.watchParam<string>('tenant').subscribe((tenant) => {
  this.loadReportsForTenant(tenant);
});
```

**Pros:**
- Survives everything — refresh, bookmark, link sharing, back/forward navigation
- Zero coupling — no shared services, no events, just the URL
- Debuggable — state is visible in the address bar
- SEO-friendly — search engines can index different states
- Free deep linking — users can share exact application state

**Cons:**
- Limited capacity — URLs have practical limits (~2,000 chars)
- Not suitable for sensitive data — tokens, PII should never be in URLs
- Noisy URLs — too many params make URLs ugly and confusing
- Serialization overhead — complex objects need JSON encoding/decoding

### Comprehensive Trade-offs Comparison

| Dimension | Singleton Service | CustomEvents | BroadcastChannel | URL-as-State |
|---|---|---|---|---|
| **Coupling** | Medium (shared npm pkg) | Very Low (event name only) | Very Low (channel name only) | None |
| **Type Safety** | ✅ Full TypeScript | ⚠️ Compile-time only | ⚠️ Compile-time only | ❌ Manual parsing |
| **Late Subscriber** | ✅ BehaviorSubject replays | ❌ Missed events | ⚠️ With cache workaround | ✅ Always available |
| **Cross-Tab** | ❌ No | ❌ No | ✅ Yes | ✅ Yes (if same URL) |
| **Survives Refresh** | ❌ No (unless persisted) | ❌ No | ❌ No | ✅ Yes |
| **Framework Agnostic** | ❌ Angular/RxJS only | ✅ Yes | ✅ Yes | ✅ Yes |
| **Debugging** | ✅ Angular DevTools | ⚠️ Browser DevTools | ⚠️ Browser DevTools | ✅ Visible in URL |
| **Performance** | ✅ In-memory, instant | ✅ DOM event, fast | ✅ PostMessage, fast | ⚠️ URL parsing overhead |
| **Scalability** | ⚠️ Service grows over time | ✅ Decentralized | ✅ Decentralized | ❌ URL length limits |
| **Best For** | Auth, user context, theme | Notifications, actions | Multi-tab sync, logout | Filters, search, deep links |

### Recommended Hybrid Strategy

> **In practice, you use ALL of these patterns — each for what it does best.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│              Recommended State Sharing Strategy                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Layer 1: Singleton Service (Module Federation shared)           │   │
│  │ For: Auth user, theme, locale                                   │   │
│  │ Why: Needs replay (BehaviorSubject), type-safe, reactive        │   │
│  │ Scope: Same-tab, same-framework MFEs                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Layer 2: CustomEvents (window.dispatchEvent)                    │   │
│  │ For: Notifications, navigation requests, action triggers        │   │
│  │ Why: Fire-and-forget, zero coupling, framework agnostic         │   │
│  │ Scope: Same-tab, any framework                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Layer 3: BroadcastChannel                                       │   │
│  │ For: Logout sync, theme sync across tabs, real-time updates     │   │
│  │ Why: Cross-tab capability, no server needed                     │   │
│  │ Scope: All tabs, same origin                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Layer 4: URL-as-State                                           │   │
│  │ For: Search filters, pagination, selected entity IDs            │   │
│  │ Why: Survives refresh, shareable, bookmarkable                  │   │
│  │ Scope: Universal — works everywhere, always                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Decision Flow:                                                         │
│  "Does it need to survive refresh?" → URL                               │
│  "Does it need cross-tab sync?" → BroadcastChannel                     │
│  "Is it fire-and-forget?" → CustomEvent                                │
│  "Is it persistent shared context?" → Singleton Service                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architect's Verdict — Cross-MFE State Sharing

> **The biggest mistake architects make is over-sharing.** Before adding any cross-MFE state,
> ask: "Can this MFE function without this state?" If yes, don't share it. Fetch it independently.
>
> **The second biggest mistake is under-abstracting.** If you're going to share state, wrap it
> in a clean abstraction layer. Don't let MFEs directly access `localStorage`, `window.postMessage`,
> or raw CustomEvents. Build a thin SDK (`@corp/mfe-state-sdk`) that encapsulates the mechanism.
> This way, you can swap BroadcastChannel for WebSocket or CustomEvents for a message bus without
> touching any MFE code.
>
> **The pragmatic answer for interviews:**
> "I'd use a shared singleton service for auth/user/theme because it needs replay semantics and
> type safety. CustomEvents for cross-MFE notifications because they're fire-and-forget with zero
> coupling. BroadcastChannel for logout sync across tabs. And URL params for anything the user
> should be able to bookmark or share. Each pattern has a specific job — using the wrong one
> creates either too much coupling or too much complexity."

---

## Final Interview Preparation Checklist

```
Before the interview, make sure you can:

□ Draw the full MFE architecture diagram from memory (Q1)
□ Explain singleton vs. isolated dependency strategy with examples
□ Walk through Module Federation webpack config line by line
□ Describe 3 cross-MFE communication patterns with trade-offs
□ Explain the Strangler Fig pattern with concrete phases (Q2)
□ Justify feature flag rollback strategy at each migration phase
□ Estimate migration timeline with assumptions and buffers
□ Design the shell bootstrap sequence with failure handling (Q3)
□ Compare Single-SPA vs. Module Federation with a trade-offs table
□ Implement error boundaries that isolate MFE failures
□ Explain auth token propagation without MFEs knowing about auth
□ Describe 4 state sharing patterns and when to use each (Bonus)
□ Articulate the "thin shell" principle and why it matters

Remember: At the Principal/Architect level, the interviewer cares more about
your REASONING than your ANSWER. Every decision should come with:
  1. What alternatives you considered
  2. Why you chose this approach
  3. What trade-offs you're accepting
  4. When you'd revisit this decision
```
