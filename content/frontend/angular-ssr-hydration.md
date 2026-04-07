# Angular SSR & Hydration — End-to-End Guide

---

## Angular Universal vs `@angular/ssr` — What's the Difference?

If you've searched for Angular SSR tutorials, you've likely seen **Angular Universal** (`@nguniversal/express-engine`). That was the original community-driven SSR solution. Starting with **Angular 17**, SSR was folded directly into the Angular CLI as `@angular/ssr` — Universal is now deprecated and archived.

```
Old way (Angular Universal — deprecated):
  npm install @nguniversal/express-engine
  ng add @nguniversal/express-engine
  → Required AppServerModule, manual wiring, separate build targets

New way (@angular/ssr — Angular 17+):
  ng add @angular/ssr
  → Works with standalone components, single build, built into CLI
  → CommonEngine replaces UniversalEngine
  → Hydration is a first-class feature
```

If you see `AppServerModule`, `ServerTransferStateModule`, or `BrowserTransferStateModule` in a tutorial — it's pre-Angular 17. Ignore it and use this guide instead.

---

## What is Server-Side Rendering (SSR)?

By default Angular is a **Client-Side Rendered (CSR)** framework — the browser downloads a mostly empty `index.html`, then downloads and executes JavaScript to build the DOM. With SSR, the server renders the full HTML for each request and sends it to the browser. The user sees content immediately, before any JS runs.

```
CSR flow:
  Browser → GET /  → Server returns empty <div id="root"></div>
                   → Browser downloads main.js (500kb+)
                   → JS executes, DOM is built
                   → User sees content  ← slow

SSR flow:
  Browser → GET /  → Server renders full HTML
                   → Browser displays HTML immediately  ← fast
                   → JS downloads & boots in background
                   → App becomes interactive
```

---

## What is Hydration?

Think of it like this: **SSR builds the house. Hydration wires the electricity.**

The server sends fully built HTML — the user sees the page instantly. But that HTML is just static markup. No event listeners, no Angular logic running. It's a "dead" page. Hydration is Angular "waking it up" in the browser.

```
Without hydration (old behavior):
  Server HTML renders → Browser shows it → Angular boots → Angular DESTROYS server DOM
  → Angular re-renders everything → Flash of content / layout shift

With hydration (Angular 17+):
  Server HTML renders → Browser shows it → Angular boots → Angular WALKS existing DOM
  → Attaches event listeners to existing elements → No re-render, no flash
```

**Concrete example:**

Server sends this HTML:
```html
<button>Add to Cart</button>
```

Without hydration — Angular destroys this and creates a new `<button>`. You might see a flicker.

With hydration — Angular finds this existing `<button>` and just attaches the `(click)` handler to it. Same DOM node, now interactive.

| | SSR | Hydration |
|---|---|---|
| What it does | Renders HTML on server | Wires Angular onto that HTML in browser |
| When it runs | Server, per request | Browser, once after JS boots |
| Without it | Blank page until JS loads | Page re-renders from scratch (flash) |

SSR and hydration are a pair — SSR without hydration wastes the server work, hydration without SSR has nothing to attach to.

---

## SSR is App-Wide, Not Per-Component

Once you set up `@angular/ssr` and add `provideClientHydration()` in `app.config.ts`, every route and component gets server-rendered automatically. You don't opt components in — you only opt them **out** (via `ngSkipHydration`).

```
Request hits server
  → Angular boots on Node using main.server.ts
  → Renders your entire component tree to HTML
  → Sends that HTML to browser
  → Browser shows it instantly
  → Angular JS boots in browser
  → Hydration attaches to existing DOM
```

`provideClientHydration()` is the one switch that turns it all on for the whole app. The only per-component decisions are:
- browser-only APIs (`window`, `localStorage`) — guard with `isPlatformBrowser`
- components that can't hydrate (canvas, WebGL) — add `ngSkipHydration`
- `@defer` blocks — only `@placeholder` renders on server

---

## When to Use SSR — The Two Questions

Ask yourself:
1. Does Google or social media need to crawl this page?
2. Does a real user land on this page without being logged in?

If yes to either — use SSR. If no to both — skip it.

### Real-world route breakdown (e-commerce example)

```
/                        → SSR  (homepage, crawled, fast first paint)
/products/:id            → SSR  (SEO critical, og:image for sharing)
/search?q=shoes          → SSR  (crawlable, appears in Google)
/account/orders          → CSR  (behind auth, no SEO needed)
/checkout                → CSR  (personalized, behind auth)
/admin                   → CSR  (internal, no crawlers)
```

You can mix SSR and CSR per route in the same Angular app using `prerender` config in `angular.json`.

### Use SSR when:

| Scenario | Why |
|---|---|
| Public-facing marketing pages | SEO — Google crawls the rendered HTML |
| E-commerce product pages | SEO + fast first paint improves conversions |
| News / blog / content sites | Crawlability and social media link previews |
| Pages with slow JS bundles | Users see content before JS loads |
| Core Web Vitals matter (LCP, FCP) | SSR dramatically improves these scores |
| Social sharing (og:tags, Twitter cards) | Meta tags need to be in the initial HTML |

### Skip SSR when:

| Scenario | Why |
|---|---|
| Admin dashboards / internal tools | No SEO need, adds server complexity |
| Apps behind authentication (all pages) | Crawlers can't access them anyway |
| Heavy real-time apps (trading, live chat) | SSR adds latency, WebSocket state is complex |
| Apps with lots of browser-only APIs | Too many `isPlatformBrowser` guards = messy |
| Simple SPAs with no SEO requirements | CSR is simpler and sufficient |
| Highly personalized pages (per-user content) | Hard to cache, server load increases |

---

## SSR Drawbacks

SSR solves SEO and first-paint performance, but it trades client complexity for server complexity.

**1. You need a Node.js server**
CSR is just static files — deploy to S3, Netlify, any CDN. SSR needs a running Node process. That means server costs, uptime management, and scaling overhead.

**2. Server becomes a bottleneck**
Every request hits your Node server to render HTML. Under high traffic, that server gets hammered. CSR shifts all rendering work to the client's browser — free compute.

**3. TTFB can be slower**
The server has to fetch data, render full HTML, then respond. A CSR app responds instantly with a tiny HTML shell. SSR trades TTFB for faster visual paint — but if your data fetching is slow, TTFB suffers.

```
CSR:  TTFB fast → blank screen → JS loads → data fetches → content shows
SSR:  TTFB slow (server fetching data) → full content shows immediately
```

**4. Browser-only API headaches**
`window`, `localStorage`, `document`, third-party libs — all crash on the server. You end up sprinkling `isPlatformBrowser` guards everywhere. In a complex app this gets messy fast.

**5. Hydration mismatches are painful to debug**
If server HTML doesn't exactly match what Angular renders client-side, you get `NG0500` errors. Common causes: anything time-based, random values, reading from localStorage, browser extensions. These bugs are subtle and annoying.

**6. Caching is harder**
A CSR app is fully cacheable on a CDN — same files for everyone. SSR responses can vary per request (user state, query params, headers), so you can't just cache everything. You need a proper caching strategy or you lose the performance benefit.

**7. Increased complexity**
Two bootstrap configs, two entry points, guards everywhere, transfer state to manage — the mental overhead is real. For a small team or simple app, this complexity often isn't justified.

---

### 1. Create a new Angular app with SSR

```bash
ng new my-ssr-app --ssr
```

Or add SSR to an existing app:

```bash
ng add @angular/ssr
```

This generates:

```
my-ssr-app/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.config.ts          ← client bootstrap config
│   │   └── app.config.server.ts   ← server bootstrap config
│   ├── main.ts                    ← client entry
│   └── main.server.ts             ← server entry
├── server.ts                      ← Express server
└── angular.json
```

---

### 2. app.config.ts (client)

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(), // enables hydration
  ],
};
```

---

### 3. app.config.server.ts (server)

```typescript
// src/app/app.config.server.ts
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

---

### 4. main.server.ts

```typescript
// src/main.server.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
```

---

### 5. server.ts (Express)

```typescript
// server.ts
import 'zone.js/node';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Serve static files
  server.get('*.*', express.static(browserDistFolder, { maxAge: '1y' }));

  // All routes handled by Angular SSR
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
```

---

## Real-World Example: Product Detail Page

This is a common SSR use case — a page that needs SEO and fast first paint.

### Route setup

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
];
```

---

### Product service using HttpClient

```typescript
// src/app/product.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`https://api.example.com/products/${id}`);
  }
}
```

---

### Product detail component

```typescript
// src/app/product-detail/product-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Observable, switchMap } from 'rxjs';
import { ProductService, Product } from '../product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe],
  template: `
    @if (product$ | async; as product) {
      <article>
        <img [src]="product.imageUrl" [alt]="product.name" />
        <h1>{{ product.name }}</h1>
        <p>{{ product.description }}</p>
        <strong>{{ product.price | currency }}</strong>
        <button (click)="addToCart(product)">Add to Cart</button>
      </article>
    } @else {
      <p>Loading...</p>
    }
  `,
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private meta = inject(Meta);
  private title = inject(Title);

  product$!: Observable<Product>;

  ngOnInit() {
    this.product$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id')!;
        return this.productService.getProduct(id);
      })
    );

    // Set meta tags for SEO — this runs on the server too
    this.product$.subscribe((product) => {
      this.title.setTitle(product.name);
      this.meta.updateTag({ name: 'description', content: product.description });
      this.meta.updateTag({ property: 'og:title', content: product.name });
      this.meta.updateTag({ property: 'og:image', content: product.imageUrl });
    });
  }

  addToCart(product: Product) {
    console.log('Adding to cart:', product);
  }
}
```

---

## Handling Browser-Only APIs (the #1 SSR gotcha)

The server has no `window`, `document`, `localStorage`, or `navigator`. Accessing them directly will crash SSR.

### Wrong — crashes on server

```typescript
@Component({ ... })
export class MyComponent implements OnInit {
  ngOnInit() {
    // CRASH: window is not defined on the server
    const width = window.innerWidth;
    localStorage.setItem('visited', 'true');
  }
}
```

### Right — use isPlatformBrowser

```typescript
import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({ ... })
export class MyComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // safe — only runs in browser
      const width = window.innerWidth;
      localStorage.setItem('visited', 'true');
    }
  }
}
```

### Right — use afterNextRender (Angular 17+)

```typescript
import { Component, afterNextRender } from '@angular/core';

@Component({ ... })
export class MyComponent {
  constructor() {
    // afterNextRender only runs in the browser, never on server
    afterNextRender(() => {
      const chart = new SomeChartLibrary('#chart');
      chart.render();
    });
  }
}
```

---

## HTTP Transfer State — Avoid Double Fetching

Without transfer state, the server fetches data, renders HTML, sends it to the browser — then Angular boots and fetches the same data again. Transfer state caches the server response and replays it in the browser.

Angular's `HttpClient` handles this automatically when you use `provideClientHydration()` with `withHttpTransferCache()`:

```typescript
// app.config.ts
import { provideClientHydration, withHttpTransferCache } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(withHttpTransferCache()), // auto transfer state for HttpClient
    provideHttpClient(withFetch()),
  ],
};
```

Now the HTTP response from the server is serialized into the HTML, and the browser reuses it — zero duplicate network requests.

---

## Hydration — Skipping Specific Components

Some components are inherently browser-only (canvas, WebGL, third-party widgets). You can opt them out of hydration:

```typescript
import { Component } from '@angular/core';
import { NgSkipHydration } from '@angular/platform-browser';

@Component({
  selector: 'app-chart',
  standalone: true,
  hostDirectives: [NgSkipHydration], // skip hydration for this component
  template: `<canvas #chartCanvas></canvas>`,
})
export class ChartComponent {
  // This component will be re-rendered client-side
}
```

Or in the template:

```html
<app-chart ngSkipHydration />
```

---

## Build & Run

```bash
# Build for SSR
ng build

# Run the SSR server
node dist/my-ssr-app/server/server.mjs
```

The server starts on `http://localhost:4000`. View source in the browser — you'll see fully rendered HTML, not an empty shell.

---

## SSR vs Static Site Generation (SSG) vs CSR

```
CSR  — rendered in browser, bad SEO, great for apps behind auth
SSR  — rendered per-request on server, great SEO, needs a Node server
SSG  — pre-rendered at build time, best performance, only for static content
```

Angular supports all three. You can mix them per route:

```typescript
// angular.json — prerender specific routes (SSG)
"prerender": {
  "routesFile": "routes.txt"
}

// routes.txt
/
/about
/products/1
/products/2
```

---

## `@defer` — Lazy Loading in Templates

`@defer` is a **separate feature from SSR** — it works with or without SSR. Its purpose is bundle splitting and lazy loading: keep the initial JS bundle small, load heavy components only when needed.

```
Without @defer:  main.js = 800kb  (everything bundled together)
With @defer:     main.js = 300kb  + reviews.chunk.js loaded on demand
```

### Basic syntax

```html
@defer (trigger) {
  <!-- loaded lazily — separate JS chunk downloaded on demand -->
  <app-heavy-component />
} @placeholder {
  <!-- shown immediately, zero JS cost -->
  <div class="skeleton"></div>
} @loading {
  <!-- shown while the chunk is downloading -->
  <app-spinner />
} @error {
  <!-- shown if the chunk fails to load -->
  <p>Failed to load</p>
}
```

### Real use cases

**Below the fold — load when user scrolls to it**
```html
<app-hero />

@defer (on viewport) {
  <app-reviews />
} @placeholder {
  <div class="reviews-skeleton" style="height: 400px"></div>
}
```

**Tab / accordion — load on interaction**
```html
@defer (on interaction) {
  <app-product-details />
} @placeholder {
  <p>Click to see details</p>
}
```

**Heavy third-party libs — charts, maps, editors**
```html
@defer (on viewport) {
  <app-analytics-chart />   <!-- Chart.js, D3 — huge bundles -->
} @placeholder {
  <div class="chart-placeholder"></div>
}
```

**Non-critical UI — load when browser is idle**
```html
@defer (on idle) {
  <app-chat-widget />
  <app-cookie-banner />
}
```

**Conditional — load only when a condition is true**
```html
@defer (when isLoggedIn) {
  <app-user-dashboard />
} @placeholder {
  <app-login-prompt />
}
```

### All triggers

| Trigger | When it loads |
|---|---|
| `on viewport` | element enters the viewport |
| `on interaction` | user clicks or focuses the element |
| `on idle` | browser is idle (`requestIdleCallback`) |
| `on hover` | user hovers over the placeholder |
| `on timer(2s)` | after a fixed delay |
| `when condition` | when a boolean expression turns true |
| `on immediate` | as soon as possible (but still a lazy chunk) |

### What NOT to defer
- Above-the-fold content — hurts LCP score
- Content needed for SEO (server only renders `@placeholder`)
- Small/lightweight components — overhead isn't worth it
- Anything the user sees on first load

---

## `@defer` and SSR — A Critical Interaction

`@defer` (Angular 17+) lets you lazy-load parts of a template. Its behavior on the server is different from the browser, and getting this wrong breaks SEO.

### How `@defer` behaves on the server

By default, the server renders the `@placeholder` block — not the main deferred content. The deferred block only loads in the browser after hydration.

```typescript
@Component({
  template: `
    @defer (on viewport) {
      <app-product-reviews />   <!-- NOT rendered on server -->
    } @placeholder {
      <p>Loading reviews...</p>  <!-- THIS is what the server sends -->
    }
  `
})
export class ProductDetailComponent {}
```

This is fine for non-SEO content (reviews, recommendations, ads). But if the deferred content needs to be crawled, you have a problem.

---

### Controlling SSR behavior with `@defer` — `prefetch` and `hydrate`

Angular 19 introduced `@defer (hydrate ...)` triggers to give you control over when deferred blocks hydrate after SSR:

```typescript
@Component({
  template: `
    <!-- Hydrate when the block enters the viewport -->
    @defer (hydrate on viewport) {
      <app-comments />
    }

    <!-- Hydrate immediately on client boot -->
    @defer (hydrate on idle) {
      <app-sidebar-widget />
    }

    <!-- Never hydrate — stays as static server HTML -->
    @defer (hydrate never) {
      <app-static-footer />
    }
  `
})
```

---

### When deferred content IS needed for SEO

If the content inside `@defer` must be in the server HTML (e.g., product description, article body), don't defer it. Use `@defer` only for content that doesn't need to be crawled.

```typescript
@Component({
  template: `
    <!-- Good — main content is always server-rendered -->
    <h1>{{ product.name }}</h1>
    <p>{{ product.description }}</p>

    <!-- Good — reviews are deferred, not needed for SEO -->
    @defer (on viewport) {
      <app-reviews [productId]="product.id" />
    } @placeholder {
      <div class="reviews-skeleton"></div>
    }
  `
})
```

---

### `@defer` + `@loading` + `@error` on the server

Only `@placeholder` renders on the server. `@loading` and `@error` are browser-only states.

```typescript
@defer (on interaction) {
  <app-heavy-chart />       <!-- server: skipped -->
} @loading {
  <app-spinner />           <!-- server: skipped -->
} @error {
  <p>Failed to load</p>     <!-- server: skipped -->
} @placeholder {
  <p>Click to load chart</p> <!-- server: THIS renders -->
}
```

---

### Summary table

| Block | Rendered on server? | Rendered in browser? |
|---|---|---|
| Main `@defer` block | No (by default) | Yes, after trigger fires |
| `@placeholder` | Yes | Yes, until trigger fires |
| `@loading` | No | Yes, while loading |
| `@error` | No | Yes, if load fails |
| `@defer (hydrate never)` | Yes | No (stays static) |

---

## Common Pitfalls

**1. setTimeout / setInterval in constructors**
These run on the server and can hang the render. Move them inside `afterNextRender` or guard with `isPlatformBrowser`.

**2. Direct DOM manipulation**
`document.querySelector(...)` crashes on server. Use Angular's `Renderer2` or `ElementRef` carefully, always guarded.

**3. Third-party libraries that assume browser**
Libraries like Google Maps, Chart.js, or Leaflet access `window` on import. Lazy-load them inside `afterNextRender`.

**4. Hydration mismatch errors**
If server HTML doesn't match what Angular expects to render client-side, you'll see `NG0500` errors in the console. Common causes:
- Conditional rendering based on `Date.now()` or random values
- Direct DOM manipulation before hydration
- Browser extensions modifying the DOM

```typescript
// Bad — different output on server vs browser
@Component({
  template: `<p>{{ isLoggedIn ? 'Welcome' : 'Login' }}</p>`
})
export class HeaderComponent {
  // If isLoggedIn reads from localStorage, server always gets false
  // but browser might get true → hydration mismatch
  isLoggedIn = isPlatformBrowser(inject(PLATFORM_ID))
    ? !!localStorage.getItem('token')
    : false;
}
```

---

## Quick Reference

```typescript
// Enable SSR + hydration
provideClientHydration()

// Enable HTTP transfer cache (no double fetching)
provideClientHydration(withHttpTransferCache())

// Skip hydration for a component
<app-widget ngSkipHydration />

// Guard browser-only code
if (isPlatformBrowser(this.platformId)) { ... }

// Run code only in browser (Angular 17+)
afterNextRender(() => { ... })

// Set SEO meta tags (works on server)
inject(Title).setTitle('Page Title')
inject(Meta).updateTag({ name: 'description', content: '...' })

// @defer — server only renders @placeholder by default
@defer (on viewport) { <app-heavy /> } @placeholder { <p>Loading...</p> }

// @defer — hydrate on viewport after SSR (Angular 19+)
@defer (hydrate on viewport) { <app-comments /> }

// @defer — keep as static server HTML, never hydrate
@defer (hydrate never) { <app-footer /> }
```
