# 03 — Performance & Core Web Vitals: Angular System Design

> 🔑 **Interview Context:** These three questions test your ability to diagnose real-world performance problems, architect high-throughput real-time systems, and make rendering strategy decisions at scale. A Principal/Architect-level candidate must demonstrate deep knowledge of browser internals, Angular-specific optimizations, and infrastructure-level caching — not just surface-level "use lazy loading" answers.

## Table of Contents

1. [Q7: Enterprise Dashboard LCP & CLS Remediation](#q7-enterprise-dashboard-lcp--cls-remediation)
2. [Q8: Real-Time Dashboard — 10K Data Points/Second](#q8-real-time-dashboard--10k-data-pointssecond)
3. [Q9: Angular SSR Architecture for SaaS](#q9-angular-ssr-architecture-for-saas)

---

## Q7: Enterprise Dashboard LCP & CLS Remediation

### Problem Statement

> An enterprise Angular dashboard has an LCP of 6s and a CLS score of 0.3. Walk through your full diagnosis and remediation architecture.

**Target Metrics:**
| Metric | Current | Good | Needs Improvement | Poor |
|--------|---------|------|-------------------|------|
| LCP | 6.0s | ≤2.5s | 2.5s–4.0s | >4.0s |
| CLS | 0.30 | ≤0.1 | 0.1–0.25 | >0.25 |

We need to cut LCP by ~60% and CLS by ~70%. This requires a systematic, layered approach.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE REMEDIATION PIPELINE                  │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────────┐ │
│  │ DIAGNOSE │──▶│ OPTIMIZE │──▶│ VALIDATE │──▶│ MONITOR (RUM)    │ │
│  │          │   │          │   │          │   │                  │ │
│  │ DevTools │   │ SSR      │   │ Lab Data │   │ web-vitals lib   │ │
│  │ Lighthse │   │ Images   │   │ Lighthse │   │ CrUX Dashboard   │ │
│  │ Coverage │   │ Fonts    │   │ WebPgTst │   │ Custom Analytics  │ │
│  │ Network  │   │ Bundles  │   │ CrUX API │   │ Alerting         │ │
│  └──────────┘   │ @defer   │   └──────────┘   └──────────────────┘ │
│                 │ OnPush   │                                        │
│                 │ Signals  │                                        │
│                 └──────────┘                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Step 1: Diagnosis — Chrome DevTools + Lighthouse Audit Workflow

Before writing a single line of code, you must identify *what* is slow and *why*. Here's the exact workflow:

#### 1.1 Lighthouse Audit (Lab Data)

```bash
# Run Lighthouse from CLI for reproducible results
npx lighthouse https://dashboard.example.com \
  --output=json \
  --output-path=./lighthouse-report.json \
  --chrome-flags="--headless --no-sandbox" \
  --preset=desktop
```

In Chrome DevTools:
1. Open **Lighthouse** tab → Select "Performance" → Run audit
2. Check the **LCP Element** — Lighthouse tells you exactly which DOM element is the LCP
3. Check **CLS Sources** — Shows which elements shifted and by how much
4. Note the **Treemap** — Shows JavaScript bundle sizes per module

#### 1.2 Performance Tab (Runtime Data)

```
1. Open DevTools → Performance tab
2. Check "Screenshots" and "Web Vitals" checkboxes
3. Click Record → Reload page → Stop recording
4. Look for:
   - Long Tasks (red bars > 50ms) blocking the main thread
   - Layout Shifts (pink markers in the "Experience" row)
   - LCP marker (green diamond) — what triggered it?
```

```
┌─────────────────────────────────────────────────────────────────┐
│ Performance Timeline                                             │
├─────────────────────────────────────────────────────────────────┤
│ Network:  ████ index.html  ████████████ main.js (1.8MB)         │
│           ░░░░░░░░░░░░░░░░ ████ chunk-dashboard.js              │
│                                                                  │
│ Main:     ██ Parse HTML  ████████ Evaluate Script                │
│           ░░░░░░░░░░░░░░ ████ Angular Bootstrap                 │
│           ░░░░░░░░░░░░░░░░░░░░ ██████ Chart Library Init        │
│                                       ▲ Long Task (320ms)       │
│                                                                  │
│ Frames:   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ████ First Paint    │
│                                                                  │
│ Web       FCP                    LCP                             │
│ Vitals:   ◆ (3.2s)              ◆ (6.0s)                        │
│                                                                  │
│ Layout    ▼ (0.12)  ▼ (0.08)  ▼ (0.06)  ▼ (0.04)              │
│ Shifts:   img load   ad inject  font swap  widget push           │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.3 Coverage Tab (Dead Code)

```
1. Open DevTools → Cmd+Shift+P → "Show Coverage"
2. Click Record → Reload page
3. Sort by "Unused Bytes" descending
4. Red bars = code loaded but never executed on this page
```

#### 1.4 Network Tab Analysis

```
1. Filter by "JS" — check bundle sizes and load order
2. Filter by "Img" — check image sizes, formats, dimensions
3. Filter by "Font" — check if fonts block rendering
4. Look for waterfall chains (sequential requests that should be parallel)
```

#### Diagnosis Summary Template

```markdown
## Diagnosis Report
- **LCP Element:** <app-dashboard-chart> (large SVG chart, 2.3MB)
- **LCP Bottleneck:** Main bundle 1.8MB (uncompressed), blocks rendering
- **CLS Sources:**
  - Hero image without dimensions (shift: 0.12)
  - Dynamic ad banner injection (shift: 0.08)
  - Font swap causing text reflow (shift: 0.06)
  - Lazy-loaded widget pushing content down (shift: 0.04)
- **Main Thread:** 3 Long Tasks > 200ms (Angular bootstrap, chart library init, data parsing)
```

---

### Step 2: LCP Remediation Architecture

#### 2.1 SSR with Angular Universal for LCP

The single biggest LCP win for content-heavy dashboards. Instead of waiting for JS to download, parse, execute, and render — the server sends pre-rendered HTML.

```
BEFORE (CSR Only — LCP 6.0s):
┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌──────────┐
│ Browser  │────▶│ CDN     │────▶│ Empty Shell  │────▶│ Download │
│ Request  │     │ index   │     │ <app-root>   │     │ main.js  │
└─────────┘     │ .html   │     │ Loading...   │     │ (1.8MB)  │
                └─────────┘     └─────────────┘     └────┬─────┘
                                                         │
                ┌──────────┐     ┌─────────────┐     ┌───▼──────┐
                │ LCP 6.0s │◀────│ Render DOM  │◀────│ Fetch    │
                │ ◆        │     │ Dashboard   │     │ API Data │
                └──────────┘     └─────────────┘     └──────────┘

AFTER (SSR — LCP 1.2s):
┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌──────────┐
│ Browser  │────▶│ Node.js │────▶│ Full HTML   │────▶│ LCP 1.2s │
│ Request  │     │ Server  │     │ + Data      │     │ ◆        │
└─────────┘     │ Renders │     │ Painted!    │     └──────────┘
                └─────────┘     └──────┬──────┘
                                       │ Background:
                                ┌──────▼──────┐     ┌──────────┐
                                │ Download JS │────▶│ Hydrate  │
                                │ (parallel)  │     │ → TTI    │
                                └─────────────┘     └──────────┘
```

**Angular SSR Setup (Angular 17+):**

```typescript
// angular.json — enable SSR
{
  "projects": {
    "dashboard": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/dashboard",
            "server": "src/main.server.ts",
            "prerender": false,
            "ssr": {
              "entry": "server.ts"
            }
          }
        }
      }
    }
  }
}
```

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import {
  provideClientHydration,
  withIncrementalHydration,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(withIncrementalHydration()),
  ],
};
```

```typescript
// server.ts — Express SSR server
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './src/main.server';

const serverDir = dirname(fileURLToPath(import.meta.url));
const browserDir = resolve(serverDir, '../browser');
const indexHtml = join(serverDir, 'index.server.html');

const app = express();
const engine = new CommonEngine();

// Serve static assets with long cache
app.use(
  express.static(browserDir, {
    maxAge: '1y',
    index: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

app.get('*', (req, res, next) => {
  engine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${req.protocol}://${req.headers.host}${req.originalUrl}`,
      publicPath: browserDir,
      providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

app.listen(4000, () => console.log('SSR server listening on port 4000'));
```

#### 2.2 Image Optimization

Images are often the LCP element. Angular's `NgOptimizedImage` directive handles most optimizations automatically.

```html
<!-- ❌ Bad: No dimensions, no lazy loading, no srcset, raw PNG -->
<img src="/assets/dashboard-hero.png" alt="Dashboard">

<!-- ✅ Good: NgOptimizedImage handles everything -->
<img
  ngSrc="dashboard-hero"
  width="1200"
  height="600"
  priority
  placeholder
  alt="Enterprise Dashboard Overview"
/>

<!-- For below-the-fold images -->
<img
  ngSrc="chart-preview"
  width="800"
  height="400"
  loading="lazy"
  alt="Chart Preview"
/>
```

```typescript
// app.config.ts — configure image loader
import { provideImgixLoader } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideImgixLoader('https://cdn.example.com/images/'),
    // Automatically generates srcset with multiple resolutions
    // Serves WebP/AVIF based on browser support
  ],
};
```

**Custom Image Loader for enterprise CDN:**
```typescript
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

export const CUSTOM_IMAGE_LOADER = {
  provide: IMAGE_LOADER,
  useValue: (config: ImageLoaderConfig) => {
    const width = config.width ? `?w=${config.width}&auto=format` : '?auto=format';
    return `https://cdn.example.com/images/${config.src}${width}`;
  },
};
```

#### 2.3 Font Loading Strategy

Fonts are a silent LCP/CLS killer. Unoptimized fonts block rendering or cause layout shifts.

```html
<!-- ❌ Bad: Blocks rendering until font downloads -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700"
      rel="stylesheet">

<!-- ✅ Good: Optimized font loading -->
<!-- index.html -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="/assets/fonts/inter-400.woff2"
      as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-600.woff2"
      as="font" type="font/woff2" crossorigin>
```

```css
/* styles.css — Self-hosted fonts with font-display: swap */
@font-face {
  font-family: 'Inter';
  font-weight: 400;
  font-style: normal;
  font-display: swap; /* Shows fallback immediately, swaps when loaded */
  src: url('/assets/fonts/inter-400.woff2') format('woff2');
  unicode-range: U+0000-00FF; /* Only Latin characters — reduces file size */
}

@font-face {
  font-family: 'Inter';
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  src: url('/assets/fonts/inter-600.woff2') format('woff2');
  unicode-range: U+0000-00FF;
}

/* Fallback font metrics matching to reduce CLS from font swap */
@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  ascent-override: 90.49%;
  descent-override: 22.56%;
  line-gap-override: 0%;
  size-adjust: 107.64%;
}

body {
  font-family: 'Inter', 'Inter-fallback', system-ui, sans-serif;
}
```

---

### Step 3: CLS Remediation

#### 3.1 Reserve Space for Dynamic Content

```typescript
@Component({
  selector: 'app-widget-container',
  template: `
    <!-- Reserve exact space with aspect-ratio to prevent CLS -->
    <div class="widget-slot" [style.aspect-ratio]="widgetAspectRatio">
      @if (widgetLoaded) {
        <ng-content></ng-content>
      } @else {
        <app-skeleton-loader [width]="'100%'" [height]="'100%'" />
      }
    </div>
  `,
  styles: [`
    .widget-slot {
      width: 100%;
      contain: layout style; /* CSS containment prevents layout thrashing */
      content-visibility: auto; /* Skip rendering off-screen widgets */
    }
  `],
})
export class WidgetContainerComponent {
  @Input() widgetAspectRatio = '16/9';
  widgetLoaded = false;
}
```

#### 3.2 Skeleton Loaders with Exact Dimensions

```typescript
@Component({
  selector: 'app-skeleton-loader',
  template: `
    <div class="skeleton"
         [style.width]="width"
         [style.height]="height"
         role="progressbar"
         aria-label="Loading content">
    </div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SkeletonLoaderComponent {
  @Input() width = '100%';
  @Input() height = '20px';
}
```

---

### Step 4: Bundle Optimization & Lazy Loading

#### 4.1 Webpack Bundle Analyzer

```bash
# Generate stats.json
ng build --stats-json

# Analyze bundle
npx webpack-bundle-analyzer dist/dashboard/browser/stats.json
```

**What to look for:**
- Large third-party libraries (moment.js → day.js, lodash → lodash-es with tree-shaking)
- Duplicate dependencies across lazy chunks
- Modules loaded eagerly that should be lazy

```
┌─────────────────────────────────────────────────────────────┐
│ Bundle Analyzer — BEFORE Optimization                        │
├─────────────────────────────────────────────────────────────┤
│ main.js (1.8MB)                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ @angular/core (180KB) │ @angular/common (95KB)          │ │
│ │ chart.js (450KB)      │ moment.js (320KB) ← REMOVE     │ │
│ │ lodash (72KB) ← REPLACE with lodash-es                  │ │
│ │ dashboard module (280KB) │ reports module (200KB)        │ │
│ │ settings module (150KB)  │ shared (53KB)                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Bundle Analyzer — AFTER Optimization                         │
├─────────────────────────────────────────────────────────────┤
│ main.js (420KB)                                              │
│ ┌───────────────────────────────────────┐                   │
│ │ @angular/core (180KB)                 │                   │
│ │ @angular/common (95KB)                │                   │
│ │ shared (53KB) │ app shell (92KB)      │                   │
│ └───────────────────────────────────────┘                   │
│ chunk-dashboard.js (310KB) ← lazy loaded                    │
│ chunk-reports.js (200KB)   ← lazy loaded                    │
│ chunk-settings.js (150KB)  ← lazy loaded                    │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2 Route-Level Lazy Loading

```typescript
// ❌ Before: everything loaded eagerly
import { DashboardComponent } from './dashboard/dashboard.component';
import { ReportsComponent } from './reports/reports.component';
import { SettingsComponent } from './settings/settings.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'settings', component: SettingsComponent },
];

// ✅ After: lazy loaded routes
export const routes: Routes = [
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
    path: 'settings',
    loadChildren: () =>
      import('./settings/settings.routes').then(m => m.SETTINGS_ROUTES),
  },
];
```

#### 4.3 @defer Blocks (Angular 17+)

```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <!-- Critical above-the-fold content loads immediately -->
    <app-dashboard-header [user]="user" />
    <app-kpi-cards [metrics]="metrics" />

    <!-- Heavy chart library deferred until visible in viewport -->
    @defer (on viewport) {
      <app-analytics-chart [data]="chartData" />
    } @placeholder {
      <app-skeleton-loader width="100%" height="400px" />
    } @loading (minimum 300ms) {
      <app-spinner />
    } @error {
      <app-error-card message="Failed to load chart" />
    }

    <!-- Settings panel deferred until user interacts -->
    @defer (on interaction) {
      <app-dashboard-settings />
    } @placeholder {
      <button>⚙️ Settings</button>
    }

    <!-- Prefetch reports module when browser is idle -->
    @defer (on idle; prefetch on idle) {
      <app-recent-reports />
    } @placeholder {
      <app-skeleton-loader width="100%" height="200px" />
    }
  `,
})
export class DashboardComponent {}
```

#### 4.4 Virtual Scrolling with CDK

For dashboards with long data tables (hundreds/thousands of rows):

```typescript
import { CdkVirtualScrollViewport, CdkVirtualForOf } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CdkVirtualScrollViewport, CdkVirtualForOf],
  template: `
    <cdk-virtual-scroll-viewport itemSize="48" class="viewport">
      <table>
        <tr *cdkVirtualFor="let row of data; trackBy: trackById">
          <td>{{ row.name }}</td>
          <td>{{ row.value }}</td>
          <td>{{ row.timestamp | date:'short' }}</td>
        </tr>
      </table>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport { height: 600px; width: 100%; }
    tr { height: 48px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent {
  @Input() data: DataRow[] = [];
  trackById = (_: number, item: DataRow) => item.id;
}
// 5000 rows → only ~15 DOM nodes rendered at any time
// Memory: ~50KB vs ~12MB for full DOM rendering
```

#### 4.5 OnPush Change Detection + Signals

```typescript
// ❌ Before: Default change detection — checks on EVERY cycle
@Component({
  selector: 'app-kpi-card',
  template: `
    <div class="kpi">
      <h3>{{ title }}</h3>
      <span class="value">{{ value | number:'1.0-2' }}</span>
      <span class="trend" [class.up]="trend > 0">{{ trend }}%</span>
    </div>
  `,
  // changeDetection: ChangeDetectionStrategy.Default ← implicit
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() value = 0;
  @Input() trend = 0;
}
```

```typescript
// ✅ After: Signals-based — granular reactivity, no zone.js overhead
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  template: `
    <div class="kpi">
      <h3>{{ title() }}</h3>
      <span class="value">{{ formattedValue() }}</span>
      <span class="trend" [class.up]="trend() > 0">
        {{ trend() }}%
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent {
  // Signal-based inputs — Angular 17.1+
  title = input.required<string>();
  value = input.required<number>();
  trend = input.required<number>();

  // Computed signal — only recalculates when value() changes
  formattedValue = computed(() =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(this.value())
  );
}
```

```typescript
// Signals in a service — reactive state without RxJS overhead
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  // Writable signals
  private readonly _metrics = signal<KpiMetric[]>([]);
  private readonly _filter = signal<string>('all');
  private readonly _isLoading = signal(false);

  // Read-only public API
  readonly metrics = this._metrics.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Computed — automatically tracks dependencies
  readonly filteredMetrics = computed(() => {
    const filter = this._filter();
    const metrics = this._metrics();
    return filter === 'all'
      ? metrics
      : metrics.filter(m => m.category === filter);
  });

  readonly summary = computed(() => {
    const metrics = this.filteredMetrics();
    return {
      total: metrics.length,
      avgValue: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
      trending: metrics.filter(m => m.trend > 0).length,
    };
  });

  updateMetrics(metrics: KpiMetric[]): void {
    this._metrics.set(metrics);
  }

  setFilter(filter: string): void {
    this._filter.set(filter);
  }
}
```

---

### Remediation Priority Matrix

| Priority | Optimization | LCP Impact | CLS Impact | Effort | ROI |
|----------|-------------|------------|------------|--------|-----|
| 🔴 P0 | SSR with Angular Universal | -2.0s to -3.0s | None | High | ★★★★★ |
| 🔴 P0 | Image optimization (NgOptimizedImage) | -0.5s to -1.5s | -0.10 | Low | ★★★★★ |
| 🔴 P0 | Set explicit dimensions on all media | None | -0.12 | Low | ★★★★★ |
| 🟠 P1 | Route-level lazy loading | -0.5s to -1.0s | None | Medium | ★★★★ |
| 🟠 P1 | @defer blocks for heavy components | -0.3s to -0.8s | None | Low | ★★★★ |
| 🟠 P1 | Font loading (swap + preload) | -0.2s to -0.5s | -0.06 | Low | ★★★★ |
| 🟡 P2 | OnPush + Signals | -0.1s to -0.3s | None | Medium | ★★★ |
| 🟡 P2 | Virtual scrolling for tables | -0.2s to -0.5s | None | Medium | ★★★ |
| 🟡 P2 | Bundle analysis + tree-shaking | -0.3s to -0.7s | None | Medium | ★★★ |
| 🟢 P3 | CSS containment + content-visibility | -0.1s to -0.2s | -0.02 | Low | ★★ |
| 🟢 P3 | Skeleton loaders | None | -0.04 | Low | ★★ |

### Before/After Metrics Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LCP | 6.0s | ~1.8s | -70% ✅ |
| CLS | 0.30 | ~0.05 | -83% ✅ |
| FCP | 4.2s | ~0.9s | -79% |
| TTI | 8.5s | ~3.2s | -62% |
| Main Bundle | 1.8MB | 420KB | -77% |
| Total JS | 1.8MB | 1.1MB (lazy) | -39% initial |

### Key Interview Trade-offs to Mention

1. **SSR adds server cost** — You need Node.js servers, but the LCP improvement is massive. Use CDN caching to reduce server load.
2. **OnPush requires immutable patterns** — You can't mutate objects in place. Use `signal.update()` or spread operators.
3. **Virtual scrolling breaks Ctrl+F** — Users can't search all rows. Provide a search/filter input as an alternative.
4. **@defer adds loading states** — More template complexity, but the bundle savings are worth it for heavy components.
5. **font-display: swap causes FOUT** — Flash of Unstyled Text is visible but brief. Use fallback font metrics matching to minimize the visual shift.

---

## Q8: Real-Time Dashboard — 10K Data Points/Second

### Problem Statement

> Design a real-time data dashboard in Angular that handles 10,000 live data points updating every second without degrading performance.

This is a classic "can you think about performance at scale" question. The naive approach (bind 10K items to the DOM, update every second) will destroy the browser. You need a layered architecture that processes data off the main thread, batches DOM updates, and minimizes change detection.

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME DASHBOARD ARCHITECTURE                    │
│                                                                       │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────┐ │
│  │WebSocket │───▶│ Web Worker   │───▶│ RxJS Pipeline│───▶│ Virtual│ │
│  │ Server   │    │              │    │              │    │ Scroll │ │
│  │          │    │ • Parse JSON │    │ • bufferTime │    │ + rAF  │ │
│  │ 10K/sec  │    │ • Aggregate  │    │ • throttle   │    │        │ │
│  │          │    │ • Filter     │    │ • switchMap   │    │ ~30    │ │
│  │          │    │ • Sort       │    │ • shareReplay │    │ DOM    │ │
│  │          │    │              │    │              │    │ nodes  │ │
│  └──────────┘    └──────────────┘    └──────────────┘    └────────┘ │
│       ↕               ↕                    ↕                  ↕      │
│  Reconnection    Off Main Thread      Back-pressure       OnPush    │
│  Strategy        Processing           Control             + Signals │
│                                                           Zoneless  │
└──────────────────────────────────────────────────────────────────────┘
```

### Why the Naive Approach Fails

```typescript
// ❌ NEVER DO THIS — kills the browser
@Component({
  template: `
    <div *ngFor="let point of dataPoints">
      {{ point.value }} — {{ point.timestamp | date:'medium' }}
    </div>
  `,
})
export class NaiveDashboardComponent implements OnInit {
  dataPoints: DataPoint[] = [];

  ngOnInit() {
    this.websocket.onmessage = (event) => {
      // 10,000 new items every second
      this.dataPoints = JSON.parse(event.data);
      // Angular runs change detection on ALL 10K items
      // DOM updates 10K nodes → 60fps impossible → UI freezes
    };
  }
}
```

**Why it fails:**
- 10K DOM nodes × 60fps = 600K DOM operations/second
- Default change detection checks every binding on every cycle
- JSON.parse on main thread blocks rendering
- No back-pressure — if processing takes >1s, messages queue up

---

### Layer 1: WebSocket Connection Management with Reconnection

```typescript
import { Injectable, inject } from '@angular/core';
import {
  Observable, Subject, timer, EMPTY,
  retry, switchMap, shareReplay, takeUntil, tap,
} from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export interface DataPoint {
  id: string;
  sensorId: string;
  value: number;
  timestamp: number;
  category: string;
}

export interface WebSocketMessage {
  type: 'batch' | 'snapshot' | 'heartbeat';
  data: DataPoint[];
  sequenceId: number;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket$: WebSocketSubject<WebSocketMessage> | null = null;
  private destroy$ = new Subject<void>();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;

  // Connection state as a signal for UI binding
  readonly connectionState = signal<'connected' | 'disconnected' | 'reconnecting'>(
    'disconnected'
  );

  connect(url: string): Observable<WebSocketMessage> {
    if (this.socket$) {
      return this.socket$.asObservable();
    }

    this.socket$ = webSocket<WebSocketMessage>({
      url,
      openObserver: {
        next: () => {
          this.connectionState.set('connected');
          this.reconnectAttempts = 0;
          console.log('[WS] Connected');
        },
      },
      closeObserver: {
        next: (event) => {
          this.connectionState.set('disconnected');
          console.log('[WS] Closed', event.code, event.reason);
          this.socket$ = null;
        },
      },
    });

    return this.socket$.pipe(
      // Exponential backoff reconnection
      retry({
        count: this.MAX_RECONNECT_ATTEMPTS,
        delay: (error, retryCount) => {
          this.connectionState.set('reconnecting');
          this.reconnectAttempts = retryCount;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${retryCount})`);
          return timer(delay);
        },
        resetOnSuccess: true,
      }),
      takeUntil(this.destroy$),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  send(message: unknown): void {
    this.socket$?.next(message as WebSocketMessage);
  }

  disconnect(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socket$?.complete();
    this.socket$ = null;
  }
}
```

---

### Layer 2: Web Worker for Heavy Computation

Move JSON parsing, aggregation, sorting, and filtering OFF the main thread.

```typescript
// data-processor.worker.ts — runs in a separate thread
/// <reference lib="webworker" />

interface DataPoint {
  id: string;
  sensorId: string;
  value: number;
  timestamp: number;
  category: string;
}

interface WorkerInput {
  type: 'process' | 'aggregate' | 'filter';
  rawData?: string;        // Raw JSON string from WebSocket
  data?: DataPoint[];
  filterCategory?: string;
  aggregationWindow?: number; // ms
}

interface AggregatedResult {
  points: DataPoint[];
  stats: {
    min: number;
    max: number;
    avg: number;
    count: number;
    p95: number;
  };
  byCategory: Record<string, { count: number; avg: number }>;
}

addEventListener('message', ({ data }: MessageEvent<WorkerInput>) => {
  switch (data.type) {
    case 'process': {
      // Parse JSON off main thread — this alone saves ~50ms for 10K items
      const points: DataPoint[] = JSON.parse(data.rawData!);

      // Sort by timestamp (most recent first)
      points.sort((a, b) => b.timestamp - a.timestamp);

      // Calculate statistics
      const values = points.map(p => p.value);
      values.sort((a, b) => a - b);

      const stats = {
        min: values[0],
        max: values[values.length - 1],
        avg: values.reduce((sum, v) => sum + v, 0) / values.length,
        count: values.length,
        p95: values[Math.floor(values.length * 0.95)],
      };

      // Group by category
      const byCategory: Record<string, { count: number; avg: number }> = {};
      for (const point of points) {
        if (!byCategory[point.category]) {
          byCategory[point.category] = { count: 0, avg: 0 };
        }
        const cat = byCategory[point.category];
        cat.avg = (cat.avg * cat.count + point.value) / (cat.count + 1);
        cat.count++;
      }

      const result: AggregatedResult = { points, stats, byCategory };
      postMessage(result);
      break;
    }

    case 'filter': {
      const filtered = data.data!.filter(
        p => p.category === data.filterCategory
      );
      postMessage({ points: filtered });
      break;
    }
  }
});
```

```typescript
// worker-bridge.service.ts — Angular service wrapping the Web Worker
import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataWorkerService {
  private worker: Worker | null = null;
  private results$ = new Subject<AggregatedResult>();

  constructor(private ngZone: NgZone) {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./data-processor.worker', import.meta.url),
        { type: 'module' }
      );

      // Run outside Angular zone — prevents unnecessary change detection
      this.ngZone.runOutsideAngular(() => {
        this.worker!.onmessage = ({ data }) => {
          this.results$.next(data);
        };

        this.worker!.onerror = (error) => {
          console.error('[Worker] Error:', error);
        };
      });
    } else {
      console.warn('Web Workers not supported — falling back to main thread');
    }
  }

  processData(rawJson: string): Observable<AggregatedResult> {
    this.worker?.postMessage({ type: 'process', rawData: rawJson });
    return this.results$.asObservable();
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
```

---

### Layer 3: RxJS Pipeline — Back-Pressure & Batching

This is the critical layer. Raw WebSocket messages arrive at 10K/sec. We need to:
1. Buffer messages into batches
2. Throttle DOM updates to ~16ms frames
3. Drop stale data if processing can't keep up

```typescript
import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  bufferTime, switchMap, throttleTime, map,
  distinctUntilChanged, tap, filter, share,
  animationFrameScheduler, observeOn,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RealTimeDashboardService {
  private readonly ws = inject(WebSocketService);
  private readonly worker = inject(DataWorkerService);
  private readonly destroyRef = inject(DestroyRef);

  // Signals for reactive state
  readonly dataPoints = signal<DataPoint[]>([]);
  readonly stats = signal<Stats | null>(null);
  readonly categoryBreakdown = signal<Record<string, { count: number; avg: number }>>({});
  readonly lastUpdateTime = signal<number>(0);
  readonly messagesPerSecond = signal<number>(0);

  // Computed derived state
  readonly topSensors = computed(() =>
    this.dataPoints()
      .slice(0, 100)
      .sort((a, b) => b.value - a.value)
  );

  readonly isHealthy = computed(() => {
    const mps = this.messagesPerSecond();
    return mps > 0 && mps < 15000; // Alert if too many or zero
  });

  startStream(wsUrl: string): void {
    this.ws
      .connect(wsUrl)
      .pipe(
        // ① BUFFER: Collect messages for 100ms batches
        // Instead of processing 10K individual messages,
        // process 1 batch of ~1000 items every 100ms
        bufferTime(100),

        // ② FILTER: Skip empty buffers (no messages in 100ms window)
        filter(batch => batch.length > 0),

        // ③ FLATTEN: Merge all batched messages into single array
        map(batch => {
          const allPoints = batch.flatMap(msg => msg.data);
          return JSON.stringify(allPoints); // Serialize for worker
        }),

        // ④ OFFLOAD: Send to Web Worker for heavy processing
        // switchMap cancels previous worker task if new batch arrives
        // before processing completes — prevents queue buildup
        switchMap(rawJson => this.worker.processData(rawJson)),

        // ⑤ THROTTLE: Limit signal updates to animation frames (~60fps)
        // Even if worker returns faster, we only update UI at 60fps
        throttleTime(16, animationFrameScheduler, {
          leading: true,
          trailing: true,
        }),

        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => {
        // ⑥ UPDATE: Write to signals (triggers only affected components)
        this.dataPoints.set(result.points);
        this.stats.set(result.stats);
        this.categoryBreakdown.set(result.byCategory);
        this.lastUpdateTime.set(Date.now());
      });

    // Separate stream for throughput monitoring
    this.ws
      .connect(wsUrl)
      .pipe(
        bufferTime(1000),
        map(batch => batch.reduce((sum, msg) => sum + msg.data.length, 0)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(count => this.messagesPerSecond.set(count));
  }
}
```

```
RxJS Pipeline Flow:

WebSocket (10K msg/sec)
    │
    ▼
bufferTime(100ms) ──── Collects ~1000 messages per batch
    │
    ▼
filter(non-empty) ──── Skips idle periods
    │
    ▼
map(flatten + serialize)
    │
    ▼
switchMap(worker) ───── Offloads to Web Worker thread
    │                   Cancels stale processing (back-pressure)
    ▼
throttleTime(16ms) ─── Aligns with requestAnimationFrame
    │                   Max 60 updates/sec to DOM
    ▼
signal.set() ────────── Granular reactivity, no zone.js needed
    │
    ▼
OnPush Components ───── Only re-render what changed
    │
    ▼
Virtual Scroll ──────── Only ~20 DOM nodes regardless of data size
```

---

### Layer 4: Zone.js Opt-Out with Signals (Zoneless Angular)

For maximum performance, remove Zone.js entirely. Signals handle reactivity without zone-based change detection.

```typescript
// main.ts — Zoneless bootstrap (Angular 18+)
import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    // Remove Zone.js entirely — Signals drive change detection
    provideExperimentalZonelessChangeDetection(),
  ],
});
```

```typescript
// angular.json — remove zone.js polyfill
{
  "build": {
    "options": {
      "polyfills": [
        // "zone.js"  ← REMOVE THIS
      ]
    }
  }
}
```

**Impact of removing Zone.js:**
| Metric | With Zone.js | Without Zone.js | Improvement |
|--------|-------------|-----------------|-------------|
| Bundle size | +45KB | 0KB | -45KB |
| CD cycles/sec | ~300 (patched async) | ~60 (signal-driven) | -80% |
| Idle CPU | 8-12% | 1-2% | -85% |
| Memory (10K points) | ~45MB | ~28MB | -38% |

---

### Layer 5: Virtual Scrolling + requestAnimationFrame

```typescript
import {
  Component, ChangeDetectionStrategy, inject,
  signal, computed, effect, NgZone,
} from '@angular/core';
import { CdkVirtualScrollViewport, CdkVirtualForOf } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-realtime-dashboard',
  standalone: true,
  imports: [CdkVirtualScrollViewport, CdkVirtualForOf],
  template: `
    <div class="dashboard-header">
      <div class="connection-status"
           [class]="dashboardService.connectionState()">
        {{ dashboardService.connectionState() | titlecase }}
      </div>
      <div class="throughput">
        {{ dashboardService.messagesPerSecond() | number }} msg/sec
      </div>
    </div>

    <!-- Stats cards — only re-render when stats signal changes -->
    @if (dashboardService.stats(); as stats) {
      <div class="stats-grid">
        <app-stat-card label="Count" [value]="stats.count" />
        <app-stat-card label="Average" [value]="stats.avg" />
        <app-stat-card label="P95" [value]="stats.p95" />
        <app-stat-card label="Max" [value]="stats.max" />
      </div>
    }

    <!-- Virtual scroll — only renders visible rows (~20 of 10K) -->
    <cdk-virtual-scroll-viewport itemSize="40" class="data-viewport">
      <div
        *cdkVirtualFor="let point of dashboardService.dataPoints();
                         trackBy: trackById"
        class="data-row"
        [class.alert]="point.value > threshold"
      >
        <span class="sensor">{{ point.sensorId }}</span>
        <span class="value">{{ point.value | number:'1.2-2' }}</span>
        <span class="category">{{ point.category }}</span>
        <span class="time">{{ point.timestamp | date:'HH:mm:ss.SSS' }}</span>
      </div>
    </cdk-virtual-scroll-viewport>

    <!-- Chart updated via requestAnimationFrame -->
    <canvas #chartCanvas class="realtime-chart"></canvas>
  `,
  styles: [`
    .data-viewport { height: 500px; width: 100%; }
    .data-row { height: 40px; display: flex; align-items: center; gap: 16px; }
    .data-row.alert { background: #fff3cd; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .connection-status.connected { color: #28a745; }
    .connection-status.reconnecting { color: #ffc107; }
    .connection-status.disconnected { color: #dc3545; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealtimeDashboardComponent {
  readonly dashboardService = inject(RealTimeDashboardService);
  readonly threshold = 95;

  trackById = (_: number, item: DataPoint) => item.id;

  constructor() {
    // Start the WebSocket stream
    this.dashboardService.startStream('wss://api.example.com/realtime');

    // Use effect + rAF for canvas chart updates
    effect(() => {
      const stats = this.dashboardService.stats();
      if (stats) {
        requestAnimationFrame(() => this.updateChart(stats));
      }
    });
  }

  private updateChart(stats: Stats): void {
    // Canvas rendering is faster than DOM for real-time charts
    // Use Canvas 2D or WebGL for 10K+ data points
    const canvas = document.querySelector('.realtime-chart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sparkline, heatmap, or scatter plot
    // Canvas handles 10K points easily — DOM cannot
  }
}
```

---

### Layer 6: requestAnimationFrame for DOM Updates

When you need to update DOM outside of Angular's cycle (e.g., canvas, custom animations):

```typescript
import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnimationFrameService {
  private rafId: number | null = null;
  private callbacks: Map<string, (timestamp: number) => void> = new Map();

  constructor(private ngZone: NgZone) {}

  /**
   * Register a callback to run on every animation frame.
   * Runs OUTSIDE Angular zone to prevent change detection.
   */
  register(key: string, callback: (timestamp: number) => void): void {
    this.callbacks.set(key, callback);

    if (!this.rafId) {
      this.ngZone.runOutsideAngular(() => this.tick());
    }
  }

  unregister(key: string): void {
    this.callbacks.delete(key);
    if (this.callbacks.size === 0 && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (timestamp: number = 0): void => {
    for (const callback of this.callbacks.values()) {
      callback(timestamp);
    }
    this.rafId = requestAnimationFrame(this.tick);
  };
}
```

```typescript
// Usage in a component for smooth chart animation
@Component({ /* ... */ })
export class LiveChartComponent implements OnInit, OnDestroy {
  private readonly raf = inject(AnimationFrameService);
  private readonly dashboard = inject(RealTimeDashboardService);

  ngOnInit(): void {
    this.raf.register('live-chart', (timestamp) => {
      const points = this.dashboard.dataPoints();
      this.renderFrame(points, timestamp);
    });
  }

  ngOnDestroy(): void {
    this.raf.unregister('live-chart');
  }

  private renderFrame(points: DataPoint[], timestamp: number): void {
    // Smooth 60fps canvas rendering
    // Only called when browser is ready to paint
  }
}
```

---

### Performance Budget & Monitoring

```typescript
// performance-monitor.service.ts
import { Injectable, signal } from '@angular/core';

interface PerformanceMetrics {
  fps: number;
  heapUsedMB: number;
  domNodes: number;
  longTasks: number;
  droppedFrames: number;
}

@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService {
  readonly metrics = signal<PerformanceMetrics>({
    fps: 60, heapUsedMB: 0, domNodes: 0, longTasks: 0, droppedFrames: 0,
  });

  private frames = 0;
  private lastTime = performance.now();

  start(): void {
    // FPS counter
    const measureFps = () => {
      this.frames++;
      const now = performance.now();
      if (now - this.lastTime >= 1000) {
        const fps = Math.round(this.frames * 1000 / (now - this.lastTime));
        this.frames = 0;
        this.lastTime = now;

        this.metrics.update(m => ({
          ...m,
          fps,
          heapUsedMB: Math.round(
            (performance as any).memory?.usedJSHeapSize / 1048576 ?? 0
          ),
          domNodes: document.querySelectorAll('*').length,
        }));
      }
      requestAnimationFrame(measureFps);
    };
    requestAnimationFrame(measureFps);

    // Long Task observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const longTasks = list.getEntries().filter(e => e.duration > 50);
        if (longTasks.length > 0) {
          this.metrics.update(m => ({
            ...m,
            longTasks: m.longTasks + longTasks.length,
          }));
          console.warn('[Perf] Long tasks detected:', longTasks);
        }
      });
      observer.observe({ type: 'longtask', buffered: true });
    }
  }
}
```

### Performance Targets

| Metric | Target | Red Flag | Measurement |
|--------|--------|----------|-------------|
| FPS | ≥55 fps | <30 fps | requestAnimationFrame counter |
| Heap Memory | <100MB | >200MB | performance.memory |
| DOM Nodes | <500 | >2000 | document.querySelectorAll('*') |
| Long Tasks | 0/min | >5/min | PerformanceObserver |
| Input Latency | <100ms | >300ms | Event Timing API |
| WS Reconnect | <5s | >30s | Custom timer |

### Key Interview Trade-offs to Mention

| Decision | Trade-off | When to Choose |
|----------|-----------|----------------|
| `bufferTime(100)` vs `bufferTime(500)` | Latency vs CPU usage | 100ms for real-time feel, 500ms for analytics |
| `switchMap` vs `mergeMap` | Drop stale vs process all | switchMap for display, mergeMap for logging |
| Web Worker | Serialization overhead | Worth it when processing >1000 items |
| Zoneless | No automatic CD | Best for high-frequency updates |
| Canvas vs DOM | No accessibility | Canvas for >1K points, DOM for <100 |
| Virtual Scroll | Can't Ctrl+F all data | Always use for >100 rows |
| `throttleTime` vs `debounceTime` | Immediate vs delayed | throttle for live data, debounce for search |

```
Decision Tree: Which RxJS Operator?

                    ┌─ Need first value immediately?
                    │
              ┌─ YES ──▶ throttleTime(ms, { leading: true })
              │          "Show first update, skip rapid repeats"
              │
  Live Data ──┤
              │
              ├─ Need to batch updates?
              │   └─ YES ──▶ bufferTime(ms)
              │              "Collect N items, emit as array"
              │
              ├─ Need to wait for pause?
              │   └─ YES ──▶ debounceTime(ms)
              │              "Wait until user stops typing"
              │
              └─ Need to cancel previous?
                  └─ YES ──▶ switchMap(fn)
                             "Cancel stale HTTP request"
```

---
