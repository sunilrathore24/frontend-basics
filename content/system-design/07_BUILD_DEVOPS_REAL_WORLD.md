# 07. Build, DevOps & Real-World Scenarios

## Principal/Architect-Level Frontend System Design — Questions 17–20

> This document covers four advanced system design questions that test a frontend architect's
> ability to design CI/CD pipelines, optimize production builds, build enterprise search features,
> and architect multi-tenant platforms. Each question includes real Angular code, architecture
> diagrams, configuration examples, and practical trade-offs.

---

## Table of Contents

1. [Q17: Monorepo Architecture & CI/CD Pipeline for 8 Teams + 5 MFEs](#q17-monorepo-architecture--cicd-pipeline)
2. [Q18: Angular Build Optimization for Lighthouse 90+](#q18-angular-build-optimization-for-lighthouse-90)
3. [Q19: Global Search for Enterprise LMS (1,500+ Customers)](#q19-global-search-for-enterprise-lms)
4. [Q20: Multi-Tenant Runtime Configuration Platform](#q20-multi-tenant-runtime-configuration-platform)

---

## Q17: Monorepo Architecture & CI/CD Pipeline

### Problem Statement

> Design the monorepo architecture and CI/CD pipeline for a large Angular platform with
> 8 product teams, a shared component library, and 5 Micro-Frontend (MFE) deployments.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Nx Monorepo Workspace                            │
│                                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │  MFE 1  │ │  MFE 2  │ │  MFE 3  │ │  MFE 4  │ │  MFE 5  │  apps/  │
│  │ (Shell) │ │(Catalog)│ │(Checkout│ │(Account)│ │ (Admin) │         │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘         │
│       │           │           │           │           │               │
│  ─────┴───────────┴───────────┴───────────┴───────────┴─────────      │
│                          │                                             │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    Shared Libraries (libs/)                   │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │      │
│  │  │  design- │ │ platform │ │ features │ │    shared/    │  │      │
│  │  │  system  │ │ (auth,   │ │ (domain  │ │  (models,     │  │      │
│  │  │          │ │  i18n,   │ │  logic)  │ │   utils,      │  │      │
│  │  │          │ │  config) │ │          │ │   data-access)│  │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  Nx Cloud: Remote Cache + Distributed Task Execution (DTE)   │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Nx Workspace Directory Layout

```
enterprise-platform/
├── apps/
│   ├── shell/                    # Host MFE — orchestrates routing + layout
│   │   ├── src/app/
│   │   │   ├── app.routes.ts     # Lazy-loads remote MFEs via Module Federation
│   │   │   └── layout/           # Global nav, sidebar, footer
│   │   ├── module-federation.config.ts
│   │   └── project.json
│   ├── catalog/                  # Remote MFE — product browsing
│   ├── checkout/                 # Remote MFE — cart + payment
│   ├── account/                  # Remote MFE — user profile + settings
│   ├── admin/                    # Remote MFE — internal admin tools
│   └── *-e2e/                    # Cypress/Playwright E2E per MFE
├── libs/
│   ├── shared/
│   │   ├── models/               # Interfaces, DTOs, enums
│   │   ├── util/                 # Pure functions, pipes, validators
│   │   ├── data-access/          # Base HTTP service, API client
│   │   └── testing/              # Mock factories, test harness
│   ├── design-system/
│   │   ├── components/           # Button, Modal, DataTable (secondary entry points)
│   │   ├── tokens/               # CSS custom properties, design tokens
│   │   └── themes/               # Light, dark, high-contrast
│   ├── platform/
│   │   ├── auth/                 # OAuth2/OIDC, guards, interceptors
│   │   ├── config/               # Runtime config loader
│   │   ├── i18n/                 # Translation service
│   │   ├── logging/              # Telemetry, error tracking
│   │   └── feature-flags/        # Feature toggle service
│   └── features/
│       ├── user-management/      # Team A owns this
│       ├── catalog-search/       # Team B owns this
│       ├── order-processing/     # Team C owns this
│       └── reporting/            # Team D owns this
├── tools/
│   ├── generators/               # Custom Nx generators
│   └── scripts/                  # Deploy, release, migration scripts
├── nx.json
├── tsconfig.base.json
└── package.json
```

### nx.json — Affected Builds + Caching Configuration

```jsonc
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    // Files that affect ALL projects when changed
    "sharedGlobals": [
      "{workspaceRoot}/tsconfig.base.json",
      "{workspaceRoot}/nx.json",
      "{workspaceRoot}/package.json"
    ],
    // Default inputs for determining cache validity
    "default": [
      "sharedGlobals",
      "{projectRoot}/**/*",           // All files in the project
      "!{projectRoot}/**/*.spec.ts",  // Exclude test files from build cache
      "!{projectRoot}/**/*.md"        // Exclude docs from build cache
    ],
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/jest.config.ts"
    ]
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],        // Build dependencies first (topological order)
      "inputs": ["production", "^production"],
      "cache": true                    // Enable local + remote caching for builds
    },
    "test": {
      "inputs": ["default", "^default"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "cache": true
    },
    "e2e": {
      "cache": false                   // E2E tests are non-deterministic, don't cache
    }
  },
  // Remote caching via Nx Cloud
  "nxCloudAccessToken": "YOUR_NX_CLOUD_TOKEN",
  "parallel": 5,                       // Run up to 5 tasks in parallel
  "defaultBase": "main"                // Base branch for affected calculations
}
```

### Module Federation Config (Shell Host)

```typescript
// apps/shell/module-federation.config.ts
import { ModuleFederationConfig } from '@nx/angular/mf';

const config: ModuleFederationConfig = {
  name: 'shell',
  remotes: [
    // Each remote MFE is independently deployed and loaded at runtime
    ['catalog', 'https://catalog.cdn.example.com/remoteEntry.js'],
    ['checkout', 'https://checkout.cdn.example.com/remoteEntry.js'],
    ['account', 'https://account.cdn.example.com/remoteEntry.js'],
    ['admin', 'https://admin.cdn.example.com/remoteEntry.js'],
  ],
  shared: (libraryName, sharedConfig) => {
    // Share Angular core + common libs as singletons to avoid duplication
    if (libraryName.startsWith('@angular/') || libraryName === 'rxjs') {
      return { ...sharedConfig, singleton: true, strictVersion: true };
    }
    return sharedConfig;
  },
};
export default config;
```

### Branch Strategy

```
main (protected)
  │
  ├── release/v2.4.0          ← Cut from main for release stabilization
  │     ├── hotfix/JIRA-999   ← Emergency fixes cherry-picked to release
  │     └── (merges to main after release)
  │
  ├── develop                  ← Integration branch (optional — some teams skip this)
  │     ├── feature/JIRA-123   ← Feature branches from develop or main
  │     ├── feature/JIRA-456
  │     └── feature/JIRA-789
  │
  └── Tags: v2.3.0, v2.3.1, v2.4.0  ← Semantic version tags trigger deployments
```

### CI Pipeline — PR Validation (GitHub Actions)

```yaml
# .github/workflows/pr-pipeline.yml
name: PR Validation
on:
  pull_request:
    branches: [main, develop]

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true            # Cancel stale runs when new commits push

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0               # Full history needed for affected calculation

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci --prefer-offline

      # Nx Cloud distributes tasks across CI agents automatically
      - name: Lint affected
        run: npx nx affected -t lint --base=origin/main --head=HEAD --parallel=5

      - name: Test affected
        run: npx nx affected -t test --base=origin/main --head=HEAD --parallel=5 --code-coverage

      - name: Build affected
        run: npx nx affected -t build --base=origin/main --head=HEAD --parallel=3 --configuration=production

      - name: Component test affected
        run: npx nx affected -t component-test --base=origin/main --head=HEAD --parallel=3

      # Bundle budget check — fail PR if any MFE exceeds size limits
      - name: Bundle size check
        run: |
          for app in shell catalog checkout account admin; do
            npx nx run $app:build:production --stats-json
            node tools/scripts/check-bundle-size.js dist/apps/$app/stats.json
          done

      - name: Enforce module boundaries
        run: npx nx lint --all --configuration=enforce-boundaries
```

### CI Pipeline — Merge to Main (Deploy)

```yaml
# .github/workflows/merge-pipeline.yml
name: Build & Deploy
on:
  push:
    branches: [main]

jobs:
  determine-affected:
    runs-on: ubuntu-latest
    outputs:
      affected-apps: ${{ steps.affected.outputs.apps }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: affected
        run: |
          APPS=$(npx nx print-affected --type=app --select=projects --base=HEAD~1)
          echo "apps=$APPS" >> $GITHUB_OUTPUT

  deploy:
    needs: determine-affected
    if: needs.determine-affected.outputs.affected-apps != ''
    strategy:
      matrix:
        app: ${{ fromJson(needs.determine-affected.outputs.affected-apps) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci

      - name: Build ${{ matrix.app }}
        run: npx nx build ${{ matrix.app }} --configuration=production

      # Independent deployment per MFE
      - name: Deploy to S3 + CloudFront
        run: |
          aws s3 sync dist/apps/${{ matrix.app }} \
            s3://mfe-${{ matrix.app }}-prod/ \
            --delete --cache-control "public, max-age=31536000, immutable"
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets[format('CF_DIST_{0}', matrix.app)] }} \
            --paths "/remoteEntry.js" "/index.html"

      - name: Notify Slack
        if: always()
        run: |
          node tools/scripts/notify-slack.js \
            --app=${{ matrix.app }} \
            --status=${{ job.status }} \
            --commit=${{ github.sha }}
```

### Environment Promotion Strategy

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   DEV    │────►│ STAGING  │────►│   PROD   │
│          │     │          │     │          │
│ Auto on  │     │ Auto on  │     │ Manual   │
│ PR merge │     │ main     │     │ approval │
│ to dev   │     │ merge    │     │ + tag    │
│          │     │          │     │          │
│ Feature  │     │ Full E2E │     │ Canary   │
│ flags ON │     │ + perf   │     │ → 10%    │
│          │     │ tests    │     │ → 50%    │
│          │     │          │     │ → 100%   │
└──────────┘     └──────────┘     └──────────┘
```

### Semantic Release with Conventional Commits

```jsonc
// .releaserc.json
{
  "branches": ["main", { "name": "release/*", "prerelease": "rc" }],
  "plugins": [
    ["@semantic-release/commit-analyzer", {
      "preset": "conventionalcommits",
      "releaseRules": [
        { "type": "feat", "release": "minor" },
        { "type": "fix", "release": "patch" },
        { "type": "perf", "release": "patch" },
        { "breaking": true, "release": "major" }
      ]
    }],
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/npm", { "npmPublish": false }],
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]"
    }],
    "@semantic-release/github"
  ]
}
```

### Trade-offs & Interview Talking Points

| Decision | Trade-off |
|----------|-----------|
| Monorepo vs polyrepo | Simpler dependency management vs larger repo size and Git performance |
| Nx Cloud remote cache | Dramatic CI speedup vs vendor dependency and cost |
| Independent MFE deploys | Team autonomy vs runtime integration complexity |
| Module Federation shared singletons | Smaller bundles vs tight version coupling across MFEs |
| Trunk-based vs GitFlow | Faster integration vs release branch stability |
| Canary deployments | Safer rollouts vs infrastructure complexity |

---

## Q18: Angular Build Optimization for Lighthouse 90+

### Problem Statement

> Design the Angular build optimization strategy for a production application targeting
> a Lighthouse Performance score above 90. Cover every layer — from compilation and bundling
> to asset delivery and runtime rendering — with real configuration and code examples.

### Why This Matters at the Architect Level

Lighthouse 90+ is not a single toggle. It requires coordinated optimization across the
entire delivery pipeline: compiler settings, bundle topology, asset strategy, rendering
path, and CDN configuration. An architect must understand how each layer contributes to
Core Web Vitals (LCP, FID/INP, CLS) and make informed trade-offs.

### High-Level Optimization Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Angular Build Optimization Pipeline                      │
│                                                                             │
│  Source Code                                                                │
│      │                                                                      │
│      ▼                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                    │
│  │  AOT Compile  │──►│  Tree Shake  │──►│ Code Split   │                    │
│  │  (ngc + esbuild) │  (dead code   │   │ (route-level │                    │
│  │              │   │  elimination) │   │  + @defer)   │                    │
│  └──────────────┘   └──────────────┘   └──────┬───────┘                    │
│                                                │                            │
│      ┌─────────────────────────────────────────┘                            │
│      ▼                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                    │
│  │  Minify +    │──►│  Compress    │──►│  CDN Deploy  │                    │
│  │  Mangle      │   │  (Brotli +   │   │  (immutable  │                    │
│  │  (Terser)    │   │   gzip)      │   │   hashing)   │                    │
│  └──────────────┘   └──────────────┘   └──────┬───────┘                    │
│                                                │                            │
│      ┌─────────────────────────────────────────┘                            │
│      ▼                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                    │
│  │  Critical    │──►│  Image Opt   │──►│  Font Load   │                    │
│  │  CSS Inline  │   │  (WebP/AVIF  │   │  (swap +     │                    │
│  │              │   │   + srcset)  │   │   preload)   │                    │
│  └──────────────┘   └──────────────┘   └──────────────┘                    │
│                                                                             │
│  Result: Lighthouse 90+ (LCP < 2.5s, INP < 200ms, CLS < 0.1)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. AOT Compilation & Differential Loading

Angular's Ahead-of-Time compiler eliminates the template compiler from the runtime bundle
and enables aggressive tree shaking. Since Angular 16+, the default builder uses esbuild
for dramatically faster builds.

```jsonc
// angular.json — production build configuration
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/my-app",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "aot": true,                          // AOT is default in production
            "optimization": true,                  // Enables minification + tree shaking
            "sourceMap": false,                    // Disable in prod (enable for debugging)
            "namedChunks": false,                  // Shorter filenames = smaller HTML
            "extractLicenses": true,
            "outputHashing": "all"                 // Cache-busting hashes on all files
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "250kb",       // Warn if initial bundle > 250KB
                  "maximumError": "500kb"           // Fail build if > 500KB
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kb",
                  "maximumError": "8kb"
                }
              ],
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### 2. Code Splitting — Route-Level + @defer Blocks

```typescript
// app.routes.ts — Route-level code splitting
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(m => m.HomeComponent),
    data: { preload: true },  // Hint for custom preload strategy
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'reports',
    loadChildren: () =>
      import('./reports/reports.routes').then(m => m.REPORT_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canMatch: [() => inject(AuthService).hasRole('admin')],
  },
];
```

```typescript
// dashboard.component.ts — @defer blocks for below-the-fold content
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [KpiCardsComponent],
  template: `
    <!-- Critical above-the-fold content loads immediately -->
    <app-kpi-cards [data]="kpiData()" />

    <!-- Heavy chart library deferred until visible in viewport -->
    @defer (on viewport) {
      <app-analytics-charts [data]="chartData()" />
    } @placeholder {
      <div class="chart-skeleton" aria-busy="true">
        <div class="skeleton-bar"></div>
        <div class="skeleton-bar"></div>
      </div>
    } @loading (minimum 300ms) {
      <app-spinner label="Loading charts…" />
    }

    <!-- Data table deferred until user interacts -->
    @defer (on interaction) {
      <app-data-table [rows]="tableData()" />
    } @placeholder {
      <button class="btn-secondary">Click to load detailed data</button>
    }

    <!-- Admin panel deferred with condition -->
    @defer (when isAdmin()) {
      <app-admin-panel />
    }
  `,
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);

  kpiData = toSignal(this.dashboardService.getKpis());
  chartData = toSignal(this.dashboardService.getChartData());
  tableData = toSignal(this.dashboardService.getTableData());
  isAdmin = this.authService.isAdmin;
}
```

### 3. Tree Shaking with Secondary Entry Points

```
libs/design-system/
├── button/
│   ├── src/
│   │   ├── button.component.ts
│   │   └── index.ts
│   ├── ng-package.json          ← Secondary entry point
│   └── package.json
├── modal/
│   ├── src/
│   │   ├── modal.component.ts
│   │   └── index.ts
│   ├── ng-package.json
│   └── package.json
├── data-table/
│   ├── src/
│   │   ├── data-table.component.ts
│   │   └── index.ts
│   ├── ng-package.json
│   └── package.json
├── src/
│   └── public-api.ts            ← Primary entry point (re-exports all)
├── ng-package.json
└── package.json
```

```jsonc
// libs/design-system/button/ng-package.json
{
  "lib": {
    "entryFile": "src/index.ts"
  }
}
```

```typescript
// Consumer app — only the button chunk is included in the bundle
import { ButtonComponent } from '@myorg/design-system/button';
// ❌ AVOID: import { ButtonComponent } from '@myorg/design-system';
// This pulls the entire library into the bundle
```

### 4. Compression & CDN Asset Strategy

```nginx
# nginx.conf — Brotli + gzip with immutable caching
server {
    listen 443 ssl http2;
    root /var/www/my-app;

    # Serve pre-compressed Brotli files (built at compile time)
    brotli_static on;
    gzip_static on;

    # Hashed assets — cache forever (immutable)
    location ~* \.[0-9a-f]{16,}\.(js|css|woff2|svg|png|webp|avif)$ {
        expires max;
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header Vary "Accept-Encoding";
    }

    # index.html — never cache (always fetch latest)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }

    # Angular routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```jsonc
// package.json — build-time Brotli compression
{
  "scripts": {
    "build:prod": "ng build --configuration=production",
    "postbuild:prod": "node scripts/compress-assets.js"
  }
}
```

```typescript
// scripts/compress-assets.js
const { readdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { brotliCompressSync, constants } = require('zlib');

const DIST = join(__dirname, '../dist/my-app/browser');
const EXTENSIONS = ['.js', '.css', '.html', '.svg', '.json'];

function compressDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      compressDir(fullPath);
    } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      const content = readFileSync(fullPath);
      const compressed = brotliCompressSync(content, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },  // Max compression
      });
      writeFileSync(`${fullPath}.br`, compressed);
      const ratio = ((1 - compressed.length / content.length) * 100).toFixed(1);
      console.log(`${entry.name}: ${content.length} → ${compressed.length} (${ratio}% saved)`);
    }
  }
}

compressDir(DIST);
```

### 5. Critical CSS Inlining & Font Loading

```jsonc
// angular.json — enable critical CSS inlining
{
  "configurations": {
    "production": {
      "optimization": {
        "scripts": true,
        "styles": {
          "minify": true,
          "inlineCritical": true       // Inlines above-the-fold CSS into index.html
        },
        "fonts": {
          "inline": true               // Inlines small font files as data URIs
        }
      }
    }
  }
}
```

```html
<!-- index.html — optimized font loading -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>My App</title>

  <!-- Preconnect to font CDN -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

  <!-- Preload critical font (above-the-fold) -->
  <link rel="preload" href="/assets/fonts/inter-var-latin.woff2"
        as="font" type="font/woff2" crossorigin />

  <!-- Font-face with font-display: swap to prevent FOIT -->
  <style>
    @font-face {
      font-family: 'Inter';
      src: url('/assets/fonts/inter-var-latin.woff2') format('woff2');
      font-weight: 100 900;
      font-display: swap;              /* Show fallback immediately, swap when loaded */
      unicode-range: U+0000-00FF;      /* Latin subset only — reduces download size */
    }
  </style>
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

### 6. Image Optimization with NgOptimizedImage

```typescript
// hero-banner.component.ts
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <!-- LCP image — priority flag tells Angular to preload it -->
    <img ngSrc="hero-banner.webp"
         width="1200"
         height="600"
         priority
         placeholder
         alt="Platform dashboard overview"
         sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px" />

    <!-- Below-the-fold images — lazy loaded by default -->
    <div class="feature-grid">
      @for (feature of features(); track feature.id) {
        <img [ngSrc]="feature.image"
             width="400"
             height="300"
             [alt]="feature.title"
             placeholder />
      }
    </div>
  `,
})
export class HeroBannerComponent {
  features = input.required<Feature[]>();
}
```

```typescript
// app.config.ts — configure image loader for CDN
import { provideImageKitLoader } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideImageKitLoader('https://ik.imagekit.io/myorg/'),
    // Or for Cloudflare Images:
    // provideCloudflareLoader('https://images.myorg.com/'),
  ],
};
```

### 7. Bundle Analysis Workflow

```jsonc
// package.json — analysis scripts
{
  "scripts": {
    "analyze": "ng build --configuration=production --stats-json && npx webpack-bundle-analyzer dist/my-app/browser/stats.json",
    "analyze:sourcemap": "ng build --configuration=production --source-map && npx source-map-explorer dist/my-app/browser/main.*.js",
    "analyze:budget": "ng build --configuration=production 2>&1 | grep -E '(Warning|Error).*budget'"
  }
}
```

```
Bundle Analysis Output (source-map-explorer):
┌─────────────────────────────────────────────────────────┐
│ main.abc123.js (148 KB gzipped)                         │
│                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  @angular/core       │  │  Application code        │  │
│  │  42 KB (28%)         │  │  38 KB (26%)             │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  @angular/common     │  │  rxjs                    │  │
│  │  22 KB (15%)         │  │  18 KB (12%)             │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  @angular/router     │  │  Other                   │  │
│  │  16 KB (11%)         │  │  12 KB (8%)              │  │
│  └─────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 8. Performance Budgets in angular.json

```jsonc
// angular.json — comprehensive budget configuration
{
  "budgets": [
    {
      "type": "initial",               // Main bundle + vendor + polyfills
      "maximumWarning": "250kb",
      "maximumError": "500kb"
    },
    {
      "type": "anyComponentStyle",      // Per-component CSS
      "maximumWarning": "4kb",
      "maximumError": "8kb"
    },
    {
      "type": "anyScript",             // Any individual JS chunk
      "maximumWarning": "150kb",
      "maximumError": "300kb"
    },
    {
      "type": "any",                   // Any single output file
      "maximumWarning": "200kb",
      "maximumError": "400kb"
    },
    {
      "type": "bundle",               // Named bundle (e.g., vendor)
      "name": "vendor",
      "maximumWarning": "300kb",
      "maximumError": "600kb"
    }
  ]
}
```

### 9. Custom Preloading Strategy

```typescript
// preload-strategy.ts — intelligent preloading based on route data
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdaptivePreloadStrategy implements PreloadingStrategy {
  private readonly connection = (navigator as any).connection;

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Don't preload on slow connections or data-saver mode
    if (this.connection?.saveData || this.connection?.effectiveType === '2g') {
      return of(null);
    }

    // Preload routes marked with data.preload = true immediately
    if (route.data?.['preload']) {
      return load();
    }

    // Preload other routes after 3 seconds of idle time
    if (route.data?.['preloadDelay']) {
      return timer(route.data['preloadDelay']).pipe(mergeMap(() => load()));
    }

    return of(null);
  }
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(AdaptivePreloadStrategy)),
  ],
};
```

### Before/After Metrics Table

| Metric | Before Optimization | After Optimization | Target |
|--------|--------------------|--------------------|--------|
| Lighthouse Performance | 52 | 94 | 90+ |
| LCP (Largest Contentful Paint) | 4.8s | 1.9s | < 2.5s |
| INP (Interaction to Next Paint) | 380ms | 120ms | < 200ms |
| CLS (Cumulative Layout Shift) | 0.28 | 0.04 | < 0.1 |
| FCP (First Contentful Paint) | 3.2s | 1.1s | < 1.8s |
| Initial Bundle Size (gzipped) | 680 KB | 148 KB | < 250 KB |
| Total Transfer Size | 2.4 MB | 420 KB | < 1 MB |
| Time to Interactive | 6.1s | 2.8s | < 3.5s |
| Number of Requests (initial) | 42 | 12 | < 20 |
| Compression Savings | 0% | 78% (Brotli) | > 70% |

### Trade-offs & Interview Talking Points

| Decision | Trade-off |
|----------|-----------|
| AOT + esbuild vs JIT | Faster builds + smaller bundles vs slower dev rebuild (negligible with esbuild) |
| Aggressive code splitting | Smaller initial load vs more HTTP requests and waterfall risk |
| @defer blocks | Reduced initial parse time vs added complexity and placeholder UX design |
| Secondary entry points | Perfect tree shaking vs more complex library structure |
| Brotli compression | 15-20% smaller than gzip vs higher CPU cost at max quality (pre-compress at build) |
| Critical CSS inlining | Faster FCP vs slightly larger HTML document |
| font-display: swap | No FOIT (flash of invisible text) vs FOUT (flash of unstyled text) |
| NgOptimizedImage priority | Faster LCP vs must manually identify LCP element |
| Strict performance budgets | Prevents regression vs can block deployments during rapid feature development |
| Adaptive preloading | Better UX on fast connections vs wasted bandwidth if user navigates away |

---


## Q19: Global Search for Enterprise LMS (1,500+ Customers)

### Problem Statement

> Design a Global Search feature for an enterprise Learning Management System (LMS) that
> serves 1,500+ enterprise customers with multi-language content, bookmarking, and sharing.
> The search must handle courses, modules, assessments, users, and certificates across
> tenants with role-based access control.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Global Search Architecture                              │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Angular Frontend                              │   │
│  │                                                                      │   │
│  │  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────────┐  │   │
│  │  │ Search Bar  │──►│ SearchService│──►│ Results Panel            │  │   │
│  │  │ (typeahead) │   │ (RxJS pipe)  │   │ (CDK Virtual Scroll)    │  │   │
│  │  └─────────────┘   └──────┬───────┘   └──────────────────────────┘  │   │
│  │                           │                                          │   │
│  │  ┌────────────────────────┼──────────────────────────────────────┐  │   │
│  │  │              Caching Layer                                     │  │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │  │   │
│  │  │  │ In-Memory    │  │ IndexedDB    │  │ Service Worker     │  │  │   │
│  │  │  │ LRU Cache    │  │ (recent      │  │ (offline index)    │  │  │   │
│  │  │  │ (50 queries) │  │  searches)   │  │                    │  │  │   │
│  │  │  └──────────────┘  └──────────────┘  └────────────────────┘  │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        API Gateway                                   │   │
│  │  • Rate limiting (100 req/min per user)                              │   │
│  │  • Tenant identification (X-Tenant-ID header)                        │   │
│  │  • RBAC token validation                                             │   │
│  └──────────────────────────────────┬───────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Search Microservice                              │   │
│  │                                                                      │   │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐    │   │
│  │  │ Query Parser │──►│ RBAC Filter  │──►│ Elasticsearch 8.x    │    │   │
│  │  │ (locale,     │   │ (tenant +    │   │ • Multi-tenant index │    │   │
│  │  │  synonyms,   │   │  role-based  │   │ • Locale analyzers   │    │   │
│  │  │  transliter.)│   │  filtering)  │   │ • Faceted search     │    │   │
│  │  └──────────────┘   └──────────────┘   └──────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Debounced Typeahead with RxJS

```typescript
// search.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Subject, Observable, of, EMPTY,
  switchMap, debounceTime, distinctUntilChanged,
  filter, catchError, tap, shareReplay, startWith, map,
} from 'rxjs';

export interface SearchRequest {
  query: string;
  locale: string;
  facets?: string[];
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  facets: FacetGroup[];
  total: number;
  page: number;
  pageSize: number;
  queryTimeMs: number;
  highlights: Record<string, string[]>;
}

export interface SearchResult {
  id: string;
  type: 'course' | 'module' | 'assessment' | 'user' | 'certificate';
  title: string;
  description: string;
  highlight?: string;           // HTML with <mark> tags from Elasticsearch
  thumbnail?: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface FacetGroup {
  field: string;
  label: string;
  buckets: { key: string; count: number; selected: boolean }[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(SearchCacheService);
  private readonly abortController = new AbortController();

  private readonly searchSubject = new Subject<SearchRequest>();

  /** The main search observable — consumed by the search results component */
  readonly results$: Observable<SearchResponse> = this.searchSubject.pipe(
    // 1. Ignore queries shorter than 2 characters
    filter(req => req.query.trim().length >= 2),

    // 2. Wait 300ms after user stops typing
    debounceTime(300),

    // 3. Don't re-search if query hasn't changed
    distinctUntilChanged((prev, curr) =>
      prev.query === curr.query &&
      prev.locale === curr.locale &&
      JSON.stringify(prev.facets) === JSON.stringify(curr.facets)
    ),

    // 4. Cancel previous in-flight request, issue new one
    switchMap(req => {
      // Check cache first
      const cached = this.cache.get(req);
      if (cached) return of(cached);

      return this.executeSearch(req).pipe(
        tap(response => this.cache.set(req, response)),
        catchError(err => {
          console.error('Search failed:', err);
          return of({
            results: [], facets: [], total: 0,
            page: 0, pageSize: 20, queryTimeMs: 0, highlights: {},
          } satisfies SearchResponse);
        }),
      );
    }),

    // 5. Share the result across multiple subscribers
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  search(request: SearchRequest): void {
    this.searchSubject.next(request);
  }

  private executeSearch(req: SearchRequest): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('q', req.query)
      .set('locale', req.locale)
      .set('page', (req.page ?? 0).toString())
      .set('pageSize', (req.pageSize ?? 20).toString())
      .set('facets', (req.facets ?? []).join(','));

    return this.http.get<SearchResponse>('/api/v2/search', {
      params,
      // AbortController integration for manual cancellation
      context: new HttpContext().set(ABORT_SIGNAL, this.abortController.signal),
    });
  }

  cancelPending(): void {
    this.abortController.abort();
  }
}
```

### 2. Search Bar Component

```typescript
// search-bar.component.ts
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AsyncPipe, HighlightPipe],
  template: `
    <div class="search-container" role="combobox"
         [attr.aria-expanded]="showResults()"
         aria-haspopup="listbox"
         aria-owns="search-results-list">

      <div class="search-input-wrapper">
        <svg class="search-icon" aria-hidden="true"><!-- magnifying glass --></svg>
        <input #searchInput
               type="search"
               [formControl]="searchControl"
               placeholder="Search courses, modules, users…"
               aria-label="Global search"
               aria-autocomplete="list"
               aria-controls="search-results-list"
               (keydown.escape)="clearSearch()"
               (keydown.arrowdown)="focusFirstResult()"
               (focus)="onFocus()" />
        @if (searchControl.value) {
          <button class="clear-btn" (click)="clearSearch()" aria-label="Clear search">
            ✕
          </button>
        }
      </div>

      @if (showResults()) {
        <div id="search-results-list" class="search-results-dropdown" role="listbox">
          @if (isLoading()) {
            <div class="search-loading" role="status">
              <app-spinner size="sm" />
              <span>Searching…</span>
            </div>
          }

          @for (result of results(); track result.id) {
            <a class="search-result-item" role="option"
               [routerLink]="getResultLink(result)"
               [queryParams]="getShareParams(result)"
               (click)="onResultClick(result)">
              <span class="result-type-badge" [class]="result.type">
                {{ result.type }}
              </span>
              <div class="result-content">
                <span class="result-title" [innerHTML]="result.highlight || result.title"></span>
                <span class="result-description">{{ result.description | slice:0:120 }}</span>
              </div>
              <button class="bookmark-btn"
                      (click)="toggleBookmark($event, result)"
                      [attr.aria-label]="'Bookmark ' + result.title">
                {{ isBookmarked(result) ? '★' : '☆' }}
              </button>
            </a>
          } @empty {
            @if (!isLoading()) {
              <div class="no-results">
                <p>No results found for "{{ searchControl.value }}"</p>
                <p class="suggestion">Try different keywords or check your spelling</p>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent implements OnInit, OnDestroy {
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly localeService = inject(LocaleService);
  private readonly bookmarkService = inject(BookmarkService);
  private readonly destroyRef = inject(DestroyRef);

  searchControl = new FormControl('', { nonNullable: true });
  results = signal<SearchResult[]>([]);
  isLoading = signal(false);
  showResults = signal(false);

  ngOnInit(): void {
    // Restore search from URL query params (deep-link support)
    const queryFromUrl = this.route.snapshot.queryParamMap.get('q');
    if (queryFromUrl) {
      this.searchControl.setValue(queryFromUrl);
    }

    // Wire form control → search service
    this.searchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(query => {
        this.isLoading.set(query.length >= 2);
        this.updateUrlState(query);
      }),
    ).subscribe(query => {
      this.searchService.search({
        query,
        locale: this.localeService.currentLocale(),
      });
    });

    // Wire search results → component state
    this.searchService.results$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(response => {
      this.results.set(response.results);
      this.isLoading.set(false);
      this.showResults.set(response.results.length > 0 || this.searchControl.value.length >= 2);
    });
  }

  /** Update URL without navigation for deep-link/share support */
  private updateUrlState(query: string): void {
    const url = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: query ? { q: query } : {},
      queryParamsHandling: 'merge',
    });
    this.router.navigateByUrl(url, { replaceUrl: true, skipLocationChange: false });
  }

  getResultLink(result: SearchResult): string[] {
    const typeRoutes: Record<string, string> = {
      course: '/courses',
      module: '/modules',
      assessment: '/assessments',
      user: '/users',
      certificate: '/certificates',
    };
    return [typeRoutes[result.type], result.id];
  }

  getShareParams(result: SearchResult): Record<string, string> {
    return { q: this.searchControl.value, ref: 'search', highlight: result.id };
  }

  toggleBookmark(event: Event, result: SearchResult): void {
    event.preventDefault();
    event.stopPropagation();
    this.bookmarkService.toggle(result);
  }

  isBookmarked(result: SearchResult): boolean {
    return this.bookmarkService.isBookmarked(result.id);
  }

  clearSearch(): void {
    this.searchControl.reset();
    this.results.set([]);
    this.showResults.set(false);
  }

  focusFirstResult(): void {
    document.querySelector<HTMLElement>('.search-result-item')?.focus();
  }

  onFocus(): void {
    if (this.results().length > 0) {
      this.showResults.set(true);
    }
  }

  ngOnDestroy(): void {
    this.searchService.cancelPending();
  }
}
```

### 3. Search Result Virtualization (CDK Virtual Scroll)

```typescript
// search-results-panel.component.ts
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-search-results-panel',
  standalone: true,
  imports: [CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf, SearchResultCardComponent],
  template: `
    <div class="results-header">
      <span>{{ total() | number }} results ({{ queryTimeMs() }}ms)</span>
      <app-facet-filters [facets]="facets()" (facetChange)="onFacetChange($event)" />
    </div>

    <!-- Virtual scroll for large result sets -->
    <cdk-virtual-scroll-viewport
      itemSize="80"
      minBufferPx="400"
      maxBufferPx="800"
      class="results-viewport"
      role="list"
      aria-label="Search results">

      <app-search-result-card
        *cdkVirtualFor="let result of results(); trackBy: trackById"
        [result]="result"
        role="listitem" />

    </cdk-virtual-scroll-viewport>

    <!-- Infinite scroll trigger -->
    @if (hasMore()) {
      <div class="load-more-sentinel"
           appIntersectionObserver
           (visible)="loadNextPage()">
        <app-spinner size="sm" />
      </div>
    }
  `,
  styles: [`
    .results-viewport {
      height: calc(100vh - 200px);
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsPanelComponent {
  results = input.required<SearchResult[]>();
  facets = input.required<FacetGroup[]>();
  total = input.required<number>();
  queryTimeMs = input.required<number>();
  hasMore = input.required<boolean>();

  facetChange = output<FacetGroup>();
  loadMore = output<void>();

  trackById = (_: number, item: SearchResult) => item.id;

  onFacetChange(facet: FacetGroup): void {
    this.facetChange.emit(facet);
  }

  loadNextPage(): void {
    this.loadMore.emit();
  }
}
```

### 4. Client-Side Caching Strategy

```typescript
// search-cache.service.ts
@Injectable({ providedIn: 'root' })
export class SearchCacheService {
  private readonly memoryCache = new LRUCache<string, SearchResponse>(50);
  private readonly DB_NAME = 'lms-search-cache';
  private readonly STORE_NAME = 'recent-searches';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /** Generate cache key from search request */
  private cacheKey(req: SearchRequest): string {
    return `${req.query}|${req.locale}|${(req.facets ?? []).sort().join(',')}|${req.page ?? 0}`;
  }

  /** Check in-memory LRU cache first, then IndexedDB */
  get(req: SearchRequest): SearchResponse | null {
    const key = this.cacheKey(req);
    return this.memoryCache.get(key) ?? null;
  }

  /** Store in both memory and IndexedDB */
  set(req: SearchRequest, response: SearchResponse): void {
    const key = this.cacheKey(req);
    this.memoryCache.set(key, response);
    this.persistToIndexedDB(key, req, response);
  }

  /** Get recent searches for suggestions dropdown */
  async getRecentSearches(limit = 10): Promise<SearchRequest[]> {
    if (!this.db) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      const results: SearchRequest[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value.request);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private initIndexedDB(): void {
    const request = indexedDB.open(this.DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
      store.createIndex('timestamp', 'timestamp', { unique: false });
    };
    request.onsuccess = () => { this.db = request.result; };
  }

  private persistToIndexedDB(key: string, req: SearchRequest, response: SearchResponse): void {
    if (!this.db) return;
    const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
    tx.objectStore(this.STORE_NAME).put({
      key,
      request: req,
      response,
      timestamp: Date.now(),
    });
  }
}

/** Simple LRU Cache implementation */
class LRUCache<K, V> {
  private readonly cache = new Map<K, V>();
  constructor(private readonly maxSize: number) {}

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key);
    if (this.cache.size >= this.maxSize) {
      // Delete oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey!);
    }
    this.cache.set(key, value);
  }
}
```

### 5. Deep-Link / Share URL Design

```
URL Structure:
  /search?q=angular+testing&type=course&locale=en-US&page=2&facets=level:advanced,format:video

Query Parameters:
  q        = search query (URL-encoded)
  type     = content type filter (course | module | assessment | user | certificate)
  locale   = search locale (en-US, de-DE, ja-JP, etc.)
  page     = pagination offset
  facets   = comma-separated facet filters (field:value pairs)
  sort     = relevance | date | title
  ref      = referral source (search, bookmark, share)

Share URL Example:
  https://lms.example.com/search?q=react+hooks&type=course&locale=en-US&ref=share

Bookmark URL Example:
  https://lms.example.com/courses/c-12345?ref=bookmark&q=react+hooks&highlight=c-12345
```

### 6. RBAC-Filtered Results

```typescript
// Backend API contract — search request includes tenant + role context
// The backend MUST filter results based on the authenticated user's permissions

// search-api.interceptor.ts — attach tenant and auth context to every search request
export const searchApiInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tenantService = inject(TenantService);

  if (req.url.includes('/api/v2/search')) {
    const enrichedReq = req.clone({
      setHeaders: {
        'X-Tenant-ID': tenantService.currentTenantId(),
        'Authorization': `Bearer ${authService.accessToken()}`,
        'Accept-Language': inject(LocaleService).currentLocale(),
      },
    });
    return next(enrichedReq);
  }
  return next(req);
};

// Frontend guard — hide results the user shouldn't see (defense in depth)
@Pipe({ name: 'rbacFilter', standalone: true })
export class RbacFilterPipe implements PipeTransform {
  private readonly authService = inject(AuthService);

  transform(results: SearchResult[]): SearchResult[] {
    const userRoles = this.authService.currentRoles();
    return results.filter(result => {
      // Admin content only visible to admins
      if (result.type === 'user' && !userRoles.includes('admin')) return false;
      // Certificate results require manager or admin role
      if (result.type === 'certificate' && !userRoles.some(r => ['admin', 'manager'].includes(r))) return false;
      return true;
    });
  }
}
```

### 7. Multi-Language Search

```jsonc
// Elasticsearch index settings — locale-aware analyzers
{
  "settings": {
    "analysis": {
      "analyzer": {
        "multilingual": {
          "type": "custom",
          "tokenizer": "icu_tokenizer",
          "filter": ["icu_folding", "icu_normalizer", "lowercase"]
        },
        "cjk_analyzer": {
          "type": "custom",
          "tokenizer": "icu_tokenizer",
          "filter": ["cjk_bigram", "icu_folding", "lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "fields": {
          "en": { "type": "text", "analyzer": "english" },
          "de": { "type": "text", "analyzer": "german" },
          "ja": { "type": "text", "analyzer": "cjk_analyzer" },
          "raw": { "type": "keyword" }
        }
      },
      "tenant_id": { "type": "keyword" },
      "access_roles": { "type": "keyword" },
      "content_type": { "type": "keyword" },
      "locale": { "type": "keyword" }
    }
  }
}
```

### 8. Backend API Contract

```typescript
// Elasticsearch query built by the search microservice
// GET /api/v2/search?q=angular&locale=en-US&page=0&pageSize=20&facets=type:course,level:advanced

// Backend builds this Elasticsearch query:
const esQuery = {
  query: {
    bool: {
      must: [
        {
          multi_match: {
            query: 'angular',
            fields: ['title.en^3', 'description.en^2', 'tags^1.5', 'content.en'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        },
      ],
      filter: [
        { term: { tenant_id: 'tenant-abc' } },           // Tenant isolation
        { terms: { access_roles: ['learner', 'admin'] } }, // RBAC filter
        { term: { content_type: 'course' } },              // Facet filter
        { term: { level: 'advanced' } },                   // Facet filter
      ],
    },
  },
  highlight: {
    fields: {
      'title.en': { number_of_fragments: 0 },
      'description.en': { fragment_size: 150, number_of_fragments: 1 },
    },
    pre_tags: ['<mark>'],
    post_tags: ['</mark>'],
  },
  aggs: {
    content_type: { terms: { field: 'content_type', size: 10 } },
    level: { terms: { field: 'level', size: 5 } },
    format: { terms: { field: 'format', size: 5 } },
    language: { terms: { field: 'locale', size: 20 } },
  },
  from: 0,
  size: 20,
  _source: ['title', 'description', 'content_type', 'thumbnail', 'metadata'],
};
```

### 9. Offline Search Capability

```typescript
// service-worker-search.ts — cache search index for offline use
// ngsw-config.json — cache search assets
const SW_CONFIG = {
  dataGroups: [
    {
      name: 'search-api',
      urls: ['/api/v2/search**'],
      cacheConfig: {
        strategy: 'freshness',          // Try network first, fall back to cache
        maxSize: 100,                    // Cache up to 100 search responses
        maxAge: '1h',                    // Cached results valid for 1 hour
        timeout: '3s',                   // Fall back to cache after 3s timeout
      },
    },
    {
      name: 'search-suggestions',
      urls: ['/api/v2/search/suggestions**'],
      cacheConfig: {
        strategy: 'performance',         // Cache first for instant suggestions
        maxSize: 50,
        maxAge: '6h',
      },
    },
  ],
};

// offline-search.service.ts — lightweight client-side search for offline mode
@Injectable({ providedIn: 'root' })
export class OfflineSearchService {
  private miniSearch: MiniSearch | null = null;

  async initialize(): Promise<void> {
    // Load pre-built search index from service worker cache
    const response = await caches.match('/api/v2/search/offline-index');
    if (!response) return;

    const indexData = await response.json();
    this.miniSearch = MiniSearch.loadJSON(JSON.stringify(indexData), {
      fields: ['title', 'description', 'tags'],
      storeFields: ['title', 'description', 'type', 'id', 'thumbnail'],
      searchOptions: {
        boost: { title: 3, tags: 1.5 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }

  search(query: string): SearchResult[] {
    if (!this.miniSearch) return [];
    return this.miniSearch.search(query, { limit: 20 }) as unknown as SearchResult[];
  }
}
```

### 10. Performance Considerations

```
Debounce Timing Decision Matrix:
┌──────────────┬──────────────┬──────────────────────────────────────┐
│ Timing       │ Use Case     │ Rationale                            │
├──────────────┼──────────────┼──────────────────────────────────────┤
│ 150ms        │ Autocomplete │ Fast feedback for short suggestions  │
│ 300ms        │ Full search  │ Balance between speed and API load   │
│ 500ms        │ Heavy queries│ Complex faceted search with many     │
│              │              │ filters — reduce backend pressure    │
└──────────────┴──────────────┴──────────────────────────────────────┘

Result Limits:
• Typeahead dropdown: 5-8 results (fast, minimal DOM)
• Full results page: 20 per page with virtual scroll
• API max page size: 100 (server-enforced)
• Total result cap: 10,000 (Elasticsearch default)

AbortController Pattern:
• Cancel in-flight HTTP requests when user types new character
• switchMap handles this automatically for the RxJS stream
• Manual AbortController for imperative cancellation (e.g., component destroy)
```

### Trade-offs & Interview Talking Points

| Decision | Trade-off |
|----------|-----------|
| 300ms debounce | Responsive feel vs unnecessary API calls; too low = server overload, too high = sluggish UX |
| switchMap vs exhaustMap | Cancel stale requests (switchMap) vs complete current request first (exhaustMap) |
| CDK Virtual Scroll | Handles 10K+ results smoothly vs added complexity and accessibility challenges |
| In-memory LRU + IndexedDB | Instant cache hits vs stale results; need TTL and invalidation strategy |
| Deep-link URL state | Shareable/bookmarkable searches vs URL length limits and complexity |
| Client-side RBAC filter pipe | Defense in depth vs false sense of security (backend MUST enforce) |
| Elasticsearch per-locale analyzers | Accurate multi-language search vs index size multiplication |
| Offline search (MiniSearch) | Works without network vs stale index and limited result quality |
| Faceted search | Rich filtering UX vs complex aggregation queries and slower response |
| Highlight via Elasticsearch | Server-side accuracy vs XSS risk (must sanitize `<mark>` tags) |

---

## Q20: Multi-Tenant Runtime Configuration Platform

### Problem Statement

> Design the frontend architecture for an Angular-based multi-tenant platform where each
> enterprise customer can configure their own theme, feature flags, and navigation — without
> code changes or redeployments. The platform serves 1,500+ tenants, each with unique branding,
> feature entitlements, and navigation structures.

### Why This Matters at the Architect Level

Multi-tenancy at the frontend is fundamentally different from backend multi-tenancy. You
cannot simply partition a database — you must dynamically alter the entire user experience
(colors, logos, fonts, available features, navigation topology) at runtime based on the
authenticated tenant. The architect must design a system that is zero-downtime configurable,
performant (no layout shifts during theme application), and resilient (graceful fallback
when a tenant config is missing or malformed).

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  Multi-Tenant Runtime Configuration Platform                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Angular Application                           │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │  │
│  │  │ APP_INITIALIZER │  │  TenantConfig    │  │  Feature Flag       │  │  │
│  │  │ (bootstrap gate)│─►│  Service         │─►│  Service            │  │  │
│  │  │                 │  │  (runtime loader)│  │  (LaunchDarkly /    │  │  │
│  │  │                 │  │                  │  │   in-house)         │  │  │
│  │  └─────────────────┘  └────────┬─────────┘  └──────────┬──────────┘  │  │
│  │                                │                        │             │  │
│  │           ┌────────────────────┼────────────────────────┘             │  │
│  │           ▼                    ▼                                      │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │  │
│  │  │ Dynamic Theme   │  │  Dynamic Nav     │  │  Lazy-Loaded        │  │  │
│  │  │ Engine          │  │  Builder         │  │  Tenant Modules     │  │  │
│  │  │ (CSS custom     │  │  (config-driven  │  │  (per-tenant        │  │  │
│  │  │  properties +   │  │   menu tree)     │  │   feature bundles)  │  │  │
│  │  │  design tokens) │  │                  │  │                     │  │  │
│  │  └─────────────────┘  └──────────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Configuration Backend                             │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │  │
│  │  │ Tenant Config   │  │  Feature Flag    │  │  Theme Asset        │  │  │
│  │  │ API             │  │  Provider        │  │  CDN                │  │  │
│  │  │ (JSON endpoint) │  │  (LaunchDarkly / │  │  (logos, fonts,     │  │  │
│  │  │                 │  │   Unleash / API) │  │   custom CSS)       │  │  │
│  │  └─────────────────┘  └──────────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tenant Identification Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Browser  │────►│ DNS / URL    │────►│ APP_INIT     │────►│ Render App   │
│ Request  │     │ Resolution   │     │ Config Load  │     │ with Tenant  │
│          │     │              │     │              │     │ Theme + Nav  │
│ acme.    │     │ Extract      │     │ GET /api/v1/ │     │              │
│ lms.com  │     │ tenant slug  │     │ tenants/acme │     │ CSS vars     │
│          │     │ from subdomain│    │ /config      │     │ applied      │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘

Tenant Resolution Strategies:
  1. Subdomain:   acme.platform.com      → tenantSlug = "acme"
  2. Path prefix: platform.com/t/acme    → tenantSlug = "acme"
  3. Custom domain: learning.acme.com    → DNS CNAME → reverse lookup
  4. Auth token:  JWT claim tenant_id    → tenantSlug from token
```

### 1. Runtime Configuration Loading (APP_INITIALIZER)

```typescript
// tenant-config.model.ts — configuration schema
export interface TenantConfig {
  tenantId: string;
  slug: string;
  displayName: string;
  theme: TenantTheme;
  features: FeatureFlags;
  navigation: NavConfig[];
  branding: BrandingConfig;
  locales: string[];                    // Supported locales for this tenant
  defaultLocale: string;
  customModules?: string[];             // Lazy-loaded tenant-specific module IDs
}

export interface TenantTheme {
  // Core palette
  colorPrimary: string;
  colorPrimaryLight: string;
  colorPrimaryDark: string;
  colorSecondary: string;
  colorAccent: string;

  // Semantic colors
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorInfo: string;

  // Surface & text
  colorBackground: string;
  colorSurface: string;
  colorTextPrimary: string;
  colorTextSecondary: string;

  // Typography
  fontFamilyHeading: string;
  fontFamilyBody: string;
  fontSizeBase: string;
  borderRadius: string;

  // Optional overrides
  customCssUrl?: string;                // CDN URL for tenant-specific CSS overrides
}

export interface FeatureFlags {
  enableGamification: boolean;
  enableSocialLearning: boolean;
  enableCertificates: boolean;
  enableAdvancedReporting: boolean;
  enableAiAssistant: boolean;
  enableCustomBranding: boolean;
  enableSso: boolean;
  enableScormSupport: boolean;
  maxUsersPerTenant: number;
  [key: string]: boolean | number | string;  // Extensible for custom flags
}

export interface NavConfig {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: NavConfig[];
  requiredFeature?: string;             // Only show if feature flag is enabled
  requiredRole?: string;                // Only show for specific roles
  badge?: { type: 'count' | 'dot'; source: string };
}

export interface BrandingConfig {
  logoUrl: string;
  faviconUrl: string;
  loginBackgroundUrl?: string;
  emailLogoUrl?: string;
  supportEmail: string;
  supportUrl?: string;
  copyrightText: string;
}
```

```typescript
// tenant-config.service.ts — loads config before app bootstraps
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TenantConfigService {
  private config: TenantConfig | null = null;
  private readonly http = inject(HttpClient);
  private readonly DEFAULT_CONFIG_URL = '/assets/config/default-tenant.json';

  /** Called by APP_INITIALIZER — blocks app bootstrap until config is loaded */
  async loadConfig(): Promise<TenantConfig> {
    const tenantSlug = this.resolveTenantSlug();

    try {
      // 1. Try loading tenant-specific config from API
      this.config = await firstValueFrom(
        this.http.get<TenantConfig>(`/api/v1/tenants/${tenantSlug}/config`)
      );
    } catch (error) {
      console.warn(`Failed to load config for tenant "${tenantSlug}", using defaults`, error);
      // 2. Fallback to default config bundled with the app
      this.config = await firstValueFrom(
        this.http.get<TenantConfig>(this.DEFAULT_CONFIG_URL)
      );
    }

    // 3. Validate and apply defaults for missing fields
    this.config = this.applyDefaults(this.config);

    return this.config;
  }

  /** Resolve tenant slug from subdomain, path, or fallback */
  private resolveTenantSlug(): string {
    // Strategy 1: Subdomain (acme.platform.com)
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0];
    }

    // Strategy 2: Path prefix (/t/acme/dashboard)
    const pathMatch = window.location.pathname.match(/^\/t\/([a-z0-9-]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    // Strategy 3: Query param (for development/testing)
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    if (tenantParam) {
      return tenantParam;
    }

    // Fallback: default tenant
    return 'default';
  }

  /** Apply safe defaults for any missing config fields */
  private applyDefaults(config: TenantConfig): TenantConfig {
    return {
      ...config,
      theme: {
        colorPrimary: '#1976d2',
        colorPrimaryLight: '#42a5f5',
        colorPrimaryDark: '#1565c0',
        colorSecondary: '#9c27b0',
        colorAccent: '#ff4081',
        colorSuccess: '#4caf50',
        colorWarning: '#ff9800',
        colorError: '#f44336',
        colorInfo: '#2196f3',
        colorBackground: '#fafafa',
        colorSurface: '#ffffff',
        colorTextPrimary: '#212121',
        colorTextSecondary: '#757575',
        fontFamilyHeading: '"Inter", sans-serif',
        fontFamilyBody: '"Inter", sans-serif',
        fontSizeBase: '16px',
        borderRadius: '8px',
        ...config.theme,               // Tenant overrides win
      },
      features: {
        enableGamification: false,
        enableSocialLearning: false,
        enableCertificates: true,
        enableAdvancedReporting: false,
        enableAiAssistant: false,
        enableCustomBranding: false,
        enableSso: false,
        enableScormSupport: false,
        maxUsersPerTenant: 500,
        ...config.features,
      },
    };
  }

  /** Getters — used throughout the app */
  get tenant(): TenantConfig {
    if (!this.config) throw new Error('TenantConfig not initialized. Was APP_INITIALIZER configured?');
    return this.config;
  }

  get theme(): TenantTheme { return this.tenant.theme; }
  get features(): FeatureFlags { return this.tenant.features; }
  get navigation(): NavConfig[] { return this.tenant.navigation; }
  get branding(): BrandingConfig { return this.tenant.branding; }

  isFeatureEnabled(flag: keyof FeatureFlags): boolean {
    return !!this.features[flag];
  }
}
```

```typescript
// app.config.ts — wire APP_INITIALIZER to block bootstrap
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([tenantHeaderInterceptor])),

    // Block app bootstrap until tenant config is loaded
    {
      provide: APP_INITIALIZER,
      useFactory: (configService: TenantConfigService, themeService: ThemeService) => {
        return async () => {
          const config = await configService.loadConfig();
          themeService.applyTheme(config.theme);        // Apply CSS vars before first paint
        };
      },
      deps: [TenantConfigService, ThemeService],
      multi: true,
    },
  ],
};

// Interceptor — attach tenant ID to all API requests
export const tenantHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantConfig = inject(TenantConfigService);
  const enrichedReq = req.clone({
    setHeaders: { 'X-Tenant-ID': tenantConfig.tenant.tenantId },
  });
  return next(enrichedReq);
};
```


### 2. Dynamic Theming via CSS Custom Properties + Design Tokens

```typescript
// theme.service.ts — applies tenant theme as CSS custom properties
import { Injectable, inject, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly renderer = this.rendererFactory.createRenderer(null, null);

  /** Apply theme by setting CSS custom properties on :root */
  applyTheme(theme: TenantTheme): void {
    const root = this.document.documentElement;

    // Map theme config to CSS custom properties
    const tokenMap: Record<string, string> = {
      '--color-primary':        theme.colorPrimary,
      '--color-primary-light':  theme.colorPrimaryLight,
      '--color-primary-dark':   theme.colorPrimaryDark,
      '--color-secondary':      theme.colorSecondary,
      '--color-accent':         theme.colorAccent,
      '--color-success':        theme.colorSuccess,
      '--color-warning':        theme.colorWarning,
      '--color-error':          theme.colorError,
      '--color-info':           theme.colorInfo,
      '--color-background':     theme.colorBackground,
      '--color-surface':        theme.colorSurface,
      '--color-text-primary':   theme.colorTextPrimary,
      '--color-text-secondary': theme.colorTextSecondary,
      '--font-family-heading':  theme.fontFamilyHeading,
      '--font-family-body':     theme.fontFamilyBody,
      '--font-size-base':       theme.fontSizeBase,
      '--border-radius':        theme.borderRadius,
    };

    // Apply all tokens to :root
    Object.entries(tokenMap).forEach(([prop, value]) => {
      this.renderer.setStyle(root, prop, value);
    });

    // Generate derived tokens (auto-computed from base palette)
    this.applyDerivedTokens(root, theme);

    // Load tenant-specific CSS override file if provided
    if (theme.customCssUrl) {
      this.loadCustomStylesheet(theme.customCssUrl);
    }
  }

  /** Compute derived design tokens from base palette */
  private applyDerivedTokens(root: HTMLElement, theme: TenantTheme): void {
    // Generate hover/focus/active states from primary color
    root.style.setProperty('--color-primary-hover',
      this.adjustBrightness(theme.colorPrimary, -10));
    root.style.setProperty('--color-primary-focus',
      this.hexToRgba(theme.colorPrimary, 0.12));
    root.style.setProperty('--color-primary-ripple',
      this.hexToRgba(theme.colorPrimary, 0.08));

    // Elevation shadows using primary color tint
    root.style.setProperty('--shadow-sm',
      `0 1px 3px ${this.hexToRgba(theme.colorTextPrimary, 0.12)}`);
    root.style.setProperty('--shadow-md',
      `0 4px 12px ${this.hexToRgba(theme.colorTextPrimary, 0.15)}`);
    root.style.setProperty('--shadow-lg',
      `0 8px 24px ${this.hexToRgba(theme.colorTextPrimary, 0.2)}`);
  }

  /** Load tenant-specific CSS file from CDN */
  private loadCustomStylesheet(url: string): void {
    const existingLink = this.document.getElementById('tenant-custom-css');
    if (existingLink) existingLink.remove();

    const link = this.renderer.createElement('link');
    this.renderer.setAttribute(link, 'id', 'tenant-custom-css');
    this.renderer.setAttribute(link, 'rel', 'stylesheet');
    this.renderer.setAttribute(link, 'href', url);
    this.renderer.appendChild(this.document.head, link);
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}
```

```scss
// styles.scss — design token consumption (global styles)
:root {
  // Fallback values — overridden at runtime by ThemeService
  --color-primary: #1976d2;
  --color-primary-light: #42a5f5;
  --color-primary-dark: #1565c0;
  --color-secondary: #9c27b0;
  --color-accent: #ff4081;
  --color-background: #fafafa;
  --color-surface: #ffffff;
  --color-text-primary: #212121;
  --color-text-secondary: #757575;
  --font-family-heading: 'Inter', sans-serif;
  --font-family-body: 'Inter', sans-serif;
  --font-size-base: 16px;
  --border-radius: 8px;
}

// All components consume tokens — never hardcode colors
body {
  font-family: var(--font-family-body);
  font-size: var(--font-size-base);
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.btn-primary {
  background-color: var(--color-primary);
  color: #fff;
  border-radius: var(--border-radius);
  &:hover { background-color: var(--color-primary-hover); }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.card {
  background-color: var(--color-surface);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-family-heading);
  color: var(--color-text-primary);
}
```

### 3. Feature Flag Service (LaunchDarkly vs In-House)

```typescript
// feature-flag.service.ts — abstraction layer supporting multiple providers
import { Injectable, inject, signal, computed } from '@angular/core';

export abstract class FeatureFlagProvider {
  abstract initialize(tenantId: string, userId: string): Promise<void>;
  abstract isEnabled(flag: string): boolean;
  abstract getVariation<T>(flag: string, defaultValue: T): T;
  abstract onFlagChange(callback: (flags: Record<string, unknown>) => void): void;
  abstract destroy(): void;
}

// --- LaunchDarkly Implementation ---
@Injectable()
export class LaunchDarklyProvider extends FeatureFlagProvider {
  private client: LDClient | null = null;

  async initialize(tenantId: string, userId: string): Promise<void> {
    const { initialize } = await import('launchdarkly-js-client-sdk');
    this.client = initialize(
      environment.launchDarklyClientId,
      {
        kind: 'multi',
        user: { key: userId },
        tenant: { key: tenantId },
      },
      {
        streaming: true,                // Real-time flag updates via SSE
        bootstrap: 'localStorage',      // Use cached flags while fetching fresh ones
      }
    );
    await this.client.waitForInitialization(5000);  // 5s timeout
  }

  isEnabled(flag: string): boolean {
    return this.client?.variation(flag, false) ?? false;
  }

  getVariation<T>(flag: string, defaultValue: T): T {
    return this.client?.variation(flag, defaultValue) ?? defaultValue;
  }

  onFlagChange(callback: (flags: Record<string, unknown>) => void): void {
    this.client?.on('change', callback);
  }

  destroy(): void {
    this.client?.close();
  }
}

// --- In-House Implementation (API-based) ---
@Injectable()
export class InHouseFeatureFlagProvider extends FeatureFlagProvider {
  private readonly http = inject(HttpClient);
  private flags = signal<Record<string, unknown>>({});
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  async initialize(tenantId: string, userId: string): Promise<void> {
    // Load initial flags from API
    const response = await firstValueFrom(
      this.http.get<Record<string, unknown>>(
        `/api/v1/feature-flags?tenantId=${tenantId}&userId=${userId}`
      )
    );
    this.flags.set(response);

    // Poll for updates every 60 seconds
    this.pollInterval = setInterval(async () => {
      const updated = await firstValueFrom(
        this.http.get<Record<string, unknown>>(
          `/api/v1/feature-flags?tenantId=${tenantId}&userId=${userId}`
        )
      );
      this.flags.set(updated);
    }, 60_000);
  }

  isEnabled(flag: string): boolean {
    return !!this.flags()[flag];
  }

  getVariation<T>(flag: string, defaultValue: T): T {
    return (this.flags()[flag] as T) ?? defaultValue;
  }

  onFlagChange(callback: (flags: Record<string, unknown>) => void): void {
    // In-house: changes detected via polling, trigger callback on signal change
    // In production, use WebSocket or SSE for real-time updates
  }

  destroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
}

// --- Provider factory — choose implementation based on environment ---
export function provideFeatureFlags(): Provider[] {
  return [
    {
      provide: FeatureFlagProvider,
      useClass: environment.useExternalFeatureFlags
        ? LaunchDarklyProvider
        : InHouseFeatureFlagProvider,
    },
  ];
}
```

```typescript
// feature-flag.directive.ts — structural directive for template-level gating
@Directive({
  selector: '[appFeatureFlag]',
  standalone: true,
})
export class FeatureFlagDirective implements OnInit, OnDestroy {
  private readonly featureFlags = inject(FeatureFlagProvider);
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private hasView = false;

  @Input('appFeatureFlag') flagName!: string;
  @Input('appFeatureFlagElse') elseTemplate?: TemplateRef<any>;

  ngOnInit(): void {
    this.updateView();
    // Re-evaluate when flags change in real-time
    this.featureFlags.onFlagChange(() => this.updateView());
  }

  private updateView(): void {
    const isEnabled = this.featureFlags.isEnabled(this.flagName);

    if (isEnabled && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isEnabled) {
      this.viewContainer.clear();
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
      this.hasView = false;
    }
  }

  ngOnDestroy(): void {
    this.viewContainer.clear();
  }
}
```

```html
<!-- Usage in templates -->
<section *appFeatureFlag="'enableGamification'">
  <app-gamification-dashboard />
</section>

<div *appFeatureFlag="'enableAiAssistant'; else noAi">
  <app-ai-assistant-panel />
</div>
<ng-template #noAi>
  <app-upgrade-prompt feature="AI Assistant" />
</ng-template>
```


### 4. Dynamic Navigation Builder

```typescript
// dynamic-nav.service.ts — builds navigation tree from tenant config + RBAC
import { Injectable, inject, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DynamicNavService {
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly featureFlags = inject(FeatureFlagProvider);
  private readonly authService = inject(AuthService);

  /** Reactive navigation tree — recomputes when roles or flags change */
  readonly navItems = computed(() => {
    const rawNav = this.tenantConfig.navigation;
    const userRoles = this.authService.currentRoles();
    return this.filterNavItems(rawNav, userRoles);
  });

  /** Recursively filter nav items based on feature flags and user roles */
  private filterNavItems(items: NavConfig[], userRoles: string[]): NavConfig[] {
    return items
      .filter(item => {
        // Check feature flag requirement
        if (item.requiredFeature && !this.featureFlags.isEnabled(item.requiredFeature)) {
          return false;
        }
        // Check role requirement
        if (item.requiredRole && !userRoles.includes(item.requiredRole)) {
          return false;
        }
        return true;
      })
      .map(item => ({
        ...item,
        children: item.children
          ? this.filterNavItems(item.children, userRoles)
          : undefined,
      }));
  }
}
```

```typescript
// sidebar-nav.component.ts — renders config-driven navigation
@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FeatureFlagDirective],
  template: `
    <nav aria-label="Main navigation">
      <ul class="nav-list" role="menubar">
        @for (item of navService.navItems(); track item.id) {
          <li role="none">
            @if (item.children?.length) {
              <!-- Parent with children — expandable -->
              <button class="nav-item nav-parent"
                      role="menuitem"
                      aria-haspopup="true"
                      [attr.aria-expanded]="isExpanded(item.id)"
                      (click)="toggleExpand(item.id)">
                <span class="nav-icon" [innerHTML]="item.icon"></span>
                <span class="nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nav-badge" [class]="item.badge.type">
                    {{ getBadgeValue(item.badge) }}
                  </span>
                }
              </button>
              @if (isExpanded(item.id)) {
                <ul class="nav-children" role="menu">
                  @for (child of item.children; track child.id) {
                    <li role="none">
                      <a class="nav-item nav-child"
                         [routerLink]="child.route"
                         routerLinkActive="active"
                         role="menuitem">
                        {{ child.label }}
                      </a>
                    </li>
                  }
                </ul>
              }
            } @else {
              <!-- Leaf item — direct link -->
              <a class="nav-item"
                 [routerLink]="item.route"
                 routerLinkActive="active"
                 role="menuitem">
                <span class="nav-icon" [innerHTML]="item.icon"></span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            }
          </li>
        }
      </ul>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarNavComponent {
  readonly navService = inject(DynamicNavService);
  private expandedIds = signal<Set<string>>(new Set());

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  toggleExpand(id: string): void {
    this.expandedIds.update(ids => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  getBadgeValue(badge: { type: string; source: string }): string {
    // In production, this would be driven by a real-time notification service
    return badge.type === 'dot' ? '●' : '3';
  }
}
```

### 5. Lazy-Loaded Tenant-Specific Modules

```typescript
// tenant-module-loader.service.ts — dynamically load tenant-specific feature bundles
import { Injectable, inject, Injector, createNgModule, Type } from '@angular/core';

interface TenantModuleManifest {
  moduleId: string;
  loadFn: () => Promise<Type<any>>;
}

/** Registry of all available tenant modules — each is a separate chunk */
const TENANT_MODULE_REGISTRY: Record<string, TenantModuleManifest> = {
  'custom-reporting': {
    moduleId: 'custom-reporting',
    loadFn: () => import('./tenant-modules/custom-reporting/custom-reporting.module')
      .then(m => m.CustomReportingModule),
  },
  'gamification': {
    moduleId: 'gamification',
    loadFn: () => import('./tenant-modules/gamification/gamification.module')
      .then(m => m.GamificationModule),
  },
  'scorm-player': {
    moduleId: 'scorm-player',
    loadFn: () => import('./tenant-modules/scorm-player/scorm-player.module')
      .then(m => m.ScormPlayerModule),
  },
  'ai-assistant': {
    moduleId: 'ai-assistant',
    loadFn: () => import('./tenant-modules/ai-assistant/ai-assistant.module')
      .then(m => m.AiAssistantModule),
  },
  'social-learning': {
    moduleId: 'social-learning',
    loadFn: () => import('./tenant-modules/social-learning/social-learning.module')
      .then(m => m.SocialLearningModule),
  },
};

@Injectable({ providedIn: 'root' })
export class TenantModuleLoaderService {
  private readonly injector = inject(Injector);
  private readonly tenantConfig = inject(TenantConfigService);
  private readonly loadedModules = new Map<string, Type<any>>();

  /** Load all modules configured for the current tenant */
  async loadTenantModules(): Promise<void> {
    const moduleIds = this.tenantConfig.tenant.customModules ?? [];

    const loadPromises = moduleIds
      .filter(id => TENANT_MODULE_REGISTRY[id])       // Only load registered modules
      .filter(id => !this.loadedModules.has(id))       // Skip already loaded
      .map(async id => {
        try {
          const manifest = TENANT_MODULE_REGISTRY[id];
          const moduleType = await manifest.loadFn();
          this.loadedModules.set(id, moduleType);
          console.log(`Tenant module "${id}" loaded successfully`);
        } catch (error) {
          console.error(`Failed to load tenant module "${id}":`, error);
          // Non-fatal — app continues without this module
        }
      });

    await Promise.allSettled(loadPromises);
  }

  /** Check if a tenant module is available */
  isModuleLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }

  /** Get loaded module type for dynamic component creation */
  getModule(moduleId: string): Type<any> | null {
    return this.loadedModules.get(moduleId) ?? null;
  }
}
```

```typescript
// Dynamic route registration for tenant modules
// app.routes.ts
export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: 'courses', loadChildren: () => import('./courses/courses.routes').then(m => m.COURSE_ROUTES) },

  // Tenant-specific routes — only loaded if tenant config includes them
  {
    path: 'gamification',
    canMatch: [() => inject(TenantConfigService).isFeatureEnabled('enableGamification')],
    loadChildren: () => import('./tenant-modules/gamification/gamification.routes')
      .then(m => m.GAMIFICATION_ROUTES),
  },
  {
    path: 'ai-assistant',
    canMatch: [() => inject(TenantConfigService).isFeatureEnabled('enableAiAssistant')],
    loadChildren: () => import('./tenant-modules/ai-assistant/ai-assistant.routes')
      .then(m => m.AI_ASSISTANT_ROUTES),
  },
  {
    path: 'reporting',
    canMatch: [() => inject(TenantConfigService).isFeatureEnabled('enableAdvancedReporting')],
    loadChildren: () => import('./tenant-modules/custom-reporting/reporting.routes')
      .then(m => m.REPORTING_ROUTES),
  },

  // Wildcard — 404
  { path: '**', loadComponent: () => import('./not-found/not-found.component').then(m => m.NotFoundComponent) },
];
```

### 6. Fallback & Default Tenant Configuration

```typescript
// default-tenant.json — bundled with the app as a safety net
// Located at: src/assets/config/default-tenant.json
```

```jsonc
{
  "tenantId": "default",
  "slug": "default",
  "displayName": "Learning Platform",
  "theme": {
    "colorPrimary": "#1976d2",
    "colorPrimaryLight": "#42a5f5",
    "colorPrimaryDark": "#1565c0",
    "colorSecondary": "#9c27b0",
    "colorAccent": "#ff4081",
    "colorSuccess": "#4caf50",
    "colorWarning": "#ff9800",
    "colorError": "#f44336",
    "colorInfo": "#2196f3",
    "colorBackground": "#fafafa",
    "colorSurface": "#ffffff",
    "colorTextPrimary": "#212121",
    "colorTextSecondary": "#757575",
    "fontFamilyHeading": "'Inter', sans-serif",
    "fontFamilyBody": "'Inter', sans-serif",
    "fontSizeBase": "16px",
    "borderRadius": "8px"
  },
  "features": {
    "enableGamification": false,
    "enableSocialLearning": false,
    "enableCertificates": true,
    "enableAdvancedReporting": false,
    "enableAiAssistant": false,
    "enableCustomBranding": false,
    "enableSso": false,
    "enableScormSupport": false,
    "maxUsersPerTenant": 500
  },
  "navigation": [
    { "id": "home", "label": "Home", "icon": "🏠", "route": "/" },
    { "id": "courses", "label": "Courses", "icon": "📚", "route": "/courses" },
    { "id": "my-learning", "label": "My Learning", "icon": "🎓", "route": "/my-learning" },
    {
      "id": "admin", "label": "Admin", "icon": "⚙️", "requiredRole": "admin",
      "children": [
        { "id": "users", "label": "Users", "icon": "👥", "route": "/admin/users" },
        { "id": "settings", "label": "Settings", "icon": "🔧", "route": "/admin/settings" }
      ]
    }
  ],
  "branding": {
    "logoUrl": "/assets/images/default-logo.svg",
    "faviconUrl": "/assets/images/favicon.ico",
    "supportEmail": "support@platform.com",
    "copyrightText": "© 2025 Learning Platform Inc."
  },
  "locales": ["en-US"],
  "defaultLocale": "en-US"
}
```

### 7. Configuration Validation & Error Handling

```typescript
// tenant-config-validator.ts — runtime validation of tenant config
import { TenantConfig, TenantTheme } from './tenant-config.model';

export class TenantConfigValidator {
  private readonly errors: string[] = [];

  validate(config: unknown): { valid: boolean; errors: string[]; sanitized: TenantConfig } {
    this.errors.length = 0;

    if (!config || typeof config !== 'object') {
      this.errors.push('Config must be a non-null object');
      return { valid: false, errors: [...this.errors], sanitized: null! };
    }

    const c = config as Record<string, unknown>;

    // Required fields
    if (!c['tenantId'] || typeof c['tenantId'] !== 'string') {
      this.errors.push('Missing or invalid tenantId');
    }
    if (!c['slug'] || typeof c['slug'] !== 'string') {
      this.errors.push('Missing or invalid slug');
    }

    // Validate theme colors are valid hex
    if (c['theme'] && typeof c['theme'] === 'object') {
      const theme = c['theme'] as Record<string, string>;
      const colorFields = Object.keys(theme).filter(k => k.startsWith('color'));
      for (const field of colorFields) {
        if (theme[field] && !/^#[0-9a-fA-F]{6}$/.test(theme[field])) {
          this.errors.push(`Invalid hex color for theme.${field}: "${theme[field]}"`);
        }
      }
    }

    // Validate navigation structure
    if (c['navigation'] && !Array.isArray(c['navigation'])) {
      this.errors.push('navigation must be an array');
    }

    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      sanitized: config as TenantConfig,
    };
  }
}
```

### 8. Tenant Config Caching Strategy

```
┌──────────────────────────────────────────────────────────────────────┐
│                  Config Loading & Caching Flow                       │
│                                                                      │
│  APP_INITIALIZER                                                     │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────┐  miss   ┌──────────────┐  miss   ┌─────────────┐ │
│  │ SessionStorage│───────►│ LocalStorage  │───────►│ Config API  │ │
│  │ (tab-scoped)  │        │ (with TTL)    │        │ (source of  │ │
│  │ instant       │        │ 5 min TTL     │        │  truth)     │ │
│  └──────┬───────┘        └──────┬───────┘        └──────┬──────┘ │
│         │ hit                   │ hit                    │         │
│         ▼                       ▼                        ▼         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Apply Config → Theme → Nav → Flags              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Background refresh: After app boots, fetch fresh config from API    │
│  and update caches. If config changed, prompt user to reload.        │
└──────────────────────────────────────────────────────────────────────┘
```

```typescript
// tenant-config-cache.service.ts
@Injectable({ providedIn: 'root' })
export class TenantConfigCacheService {
  private readonly STORAGE_KEY = 'tenant-config';
  private readonly TTL_MS = 5 * 60 * 1000;  // 5 minutes

  /** Try to load config from cache layers */
  getCached(tenantSlug: string): TenantConfig | null {
    const key = `${this.STORAGE_KEY}-${tenantSlug}`;

    // Layer 1: SessionStorage (fastest, tab-scoped)
    const sessionData = sessionStorage.getItem(key);
    if (sessionData) {
      return JSON.parse(sessionData);
    }

    // Layer 2: LocalStorage with TTL
    const localData = localStorage.getItem(key);
    if (localData) {
      const { config, timestamp } = JSON.parse(localData);
      if (Date.now() - timestamp < this.TTL_MS) {
        // Promote to session storage for faster subsequent access
        sessionStorage.setItem(key, JSON.stringify(config));
        return config;
      }
      // Expired — remove stale entry
      localStorage.removeItem(key);
    }

    return null;
  }

  /** Store config in both cache layers */
  setCache(tenantSlug: string, config: TenantConfig): void {
    const key = `${this.STORAGE_KEY}-${tenantSlug}`;
    sessionStorage.setItem(key, JSON.stringify(config));
    localStorage.setItem(key, JSON.stringify({
      config,
      timestamp: Date.now(),
    }));
  }

  /** Invalidate all cached configs (e.g., after admin saves new config) */
  invalidateAll(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_KEY)) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  }
}
```

### 9. Example Tenant Config API Response

```jsonc
// GET /api/v1/tenants/acme-corp/config
// Response:
{
  "tenantId": "t-acme-001",
  "slug": "acme-corp",
  "displayName": "ACME Corporation Learning Hub",
  "theme": {
    "colorPrimary": "#e63946",
    "colorPrimaryLight": "#ff6b6b",
    "colorPrimaryDark": "#c1121f",
    "colorSecondary": "#457b9d",
    "colorAccent": "#f4a261",
    "colorSuccess": "#2a9d8f",
    "colorWarning": "#e9c46a",
    "colorError": "#e63946",
    "colorInfo": "#457b9d",
    "colorBackground": "#f1faee",
    "colorSurface": "#ffffff",
    "colorTextPrimary": "#1d3557",
    "colorTextSecondary": "#457b9d",
    "fontFamilyHeading": "'Poppins', sans-serif",
    "fontFamilyBody": "'Open Sans', sans-serif",
    "fontSizeBase": "15px",
    "borderRadius": "12px",
    "customCssUrl": "https://cdn.acme.com/lms/custom-overrides.css"
  },
  "features": {
    "enableGamification": true,
    "enableSocialLearning": true,
    "enableCertificates": true,
    "enableAdvancedReporting": true,
    "enableAiAssistant": false,
    "enableCustomBranding": true,
    "enableSso": true,
    "enableScormSupport": true,
    "maxUsersPerTenant": 10000
  },
  "navigation": [
    { "id": "home", "label": "Home", "icon": "🏠", "route": "/" },
    { "id": "courses", "label": "Training Catalog", "icon": "📚", "route": "/courses" },
    { "id": "my-learning", "label": "My Path", "icon": "🎓", "route": "/my-learning" },
    {
      "id": "gamification", "label": "Achievements", "icon": "🏆",
      "route": "/gamification", "requiredFeature": "enableGamification"
    },
    {
      "id": "social", "label": "Community", "icon": "💬",
      "route": "/social", "requiredFeature": "enableSocialLearning"
    },
    {
      "id": "reporting", "label": "Reports", "icon": "📊",
      "route": "/reporting", "requiredRole": "manager",
      "requiredFeature": "enableAdvancedReporting"
    },
    {
      "id": "admin", "label": "Admin", "icon": "⚙️", "requiredRole": "admin",
      "children": [
        { "id": "users", "label": "User Management", "icon": "👥", "route": "/admin/users" },
        { "id": "branding", "label": "Branding", "icon": "🎨", "route": "/admin/branding", "requiredFeature": "enableCustomBranding" },
        { "id": "settings", "label": "Settings", "icon": "🔧", "route": "/admin/settings" }
      ]
    }
  ],
  "branding": {
    "logoUrl": "https://cdn.acme.com/lms/acme-logo.svg",
    "faviconUrl": "https://cdn.acme.com/lms/acme-favicon.ico",
    "loginBackgroundUrl": "https://cdn.acme.com/lms/login-bg.webp",
    "supportEmail": "learning-support@acme.com",
    "supportUrl": "https://support.acme.com",
    "copyrightText": "© 2025 ACME Corporation"
  },
  "locales": ["en-US", "de-DE", "fr-FR", "ja-JP"],
  "defaultLocale": "en-US",
  "customModules": ["gamification", "social-learning", "scorm-player", "custom-reporting"]
}
```

### Trade-offs & Interview Talking Points

| Decision | Trade-off |
|----------|-----------|
| APP_INITIALIZER config load | Guarantees config before render vs adds to Time-to-First-Byte (mitigate with caching) |
| CSS custom properties vs CSS-in-JS | Zero runtime cost + native browser support vs limited to flat token values (no conditional logic) |
| LaunchDarkly vs in-house flags | Real-time streaming + targeting rules + audit trail vs vendor cost + data residency concerns |
| In-house polling (60s) | Simple implementation vs stale flags for up to 60s; use WebSocket/SSE for real-time |
| Subdomain tenant resolution | Clean URLs + cookie isolation vs wildcard SSL cert + DNS management complexity |
| Lazy-loaded tenant modules | Only download what tenant needs vs cold-start latency for first module load |
| canMatch route guards | Routes invisible to unauthorized tenants vs route config complexity |
| SessionStorage + LocalStorage cache | Instant config on reload vs stale config risk; TTL + background refresh mitigates |
| Default fallback config | App always renders something vs user may see wrong branding briefly |
| Runtime validation | Catches malformed configs early vs adds ~5ms to bootstrap (negligible) |
| Design token derivation (hover/shadow) | Consistent palette from minimal input vs computed colors may not match brand guidelines exactly |
| Custom CSS URL per tenant | Maximum flexibility for enterprise customers vs XSS/injection risk (must sanitize + CSP headers) |

---