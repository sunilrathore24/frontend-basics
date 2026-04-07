# Angular Advanced Interview Questions - Part 2
## 20 Additional Principal/Lead Engineer Questions

*Covering the complete Angular ecosystem with latest features from Angular 19+ (2024-2026)*

---

## Question 1: Explain Angular's Server-Side Rendering (SSR) and Hydration. How does non-destructive hydration work and what are the performance benefits?

**Answer:**

Server-Side Rendering (SSR) and hydration are critical for building performant, SEO-friendly Angular applications. Understanding how they work together is essential for modern web development.

### What is Server-Side Rendering?

SSR is the process of rendering your Angular application on the server (Node.js) and sending fully-rendered HTML to the client, rather than sending a blank page with JavaScript that renders the content client-side.

**The Traditional Client-Side Rendering (CSR) Flow:**
```
1. Browser requests page
2. Server sends minimal HTML + JavaScript bundles
3. Browser downloads JavaScript (2-5 seconds)
4. JavaScript executes and renders the page
5. User sees content (3-7 seconds total)
```

**The SSR Flow:**
```
1. Browser requests page
2. Server runs Angular app and generates HTML
3. Server sends fully-rendered HTML
4. Browser displays content immediately (0.5-1 second)
5. JavaScript downloads in background
6. Hydration makes page interactive
```

### The Core Problem SSR Solves

**Problem 1: Slow First Contentful Paint (FCP)**
```typescript
// Without SSR - User sees blank screen
<body>
  <app-root></app-root>  <!-- Empty until JS loads -->
  <script src="main.js"></script>  <!-- 500KB+ -->
</body>

// With SSR - User sees content immediately
<body>
  <app-root>
    <header>...</header>
    <main>
      <h1>Welcome</h1>
      <p>Content is already here!</p>
    </main>
  </app-root>
  <script src="main.js"></script>  <!-- Loads in background -->
</body>
```

**Problem 2: SEO Issues**
Search engine crawlers often don't execute JavaScript or wait for it to complete. SSR provides fully-rendered HTML that crawlers can index immediately.

**Problem 3: Social Media Previews**
When sharing links on social media, preview cards need immediate HTML content. SSR ensures proper Open Graph tags are present.

### Setting Up SSR in Angular 19

**Modern approach with @angular/ssr:**

```typescript
// Install SSR
ng add @angular/ssr

// This creates:
// - server.ts (Express server)
// - app.config.server.ts (Server configuration)
// - Updates angular.json with SSR build config
```

**The generated server.ts:**

```typescript
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
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
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

### Understanding Hydration

Hydration is the process of making server-rendered HTML interactive by attaching event listeners and Angular's change detection.

**The Evolution of Hydration:**

**1. Destructive Hydration (Angular < 16):**
```typescript
// Old approach - DESTROYS and RECREATES DOM
1. Server renders HTML
2. Browser displays HTML (user sees content)
3. Angular JavaScript loads
4. Angular DESTROYS server-rendered DOM
5. Angular RECREATES entire DOM from scratch
6. Event listeners attached
7. Page becomes interactive

// Problems:
// - Visible flicker as DOM is destroyed/recreated
// - Wasted work (rendering twice)
// - Poor user experience
// - Layout shift (CLS issues)
```

**2. Non-Destructive Hydration (Angular 16+, default in 17+):**
```typescript
// New approach - REUSES existing DOM
1. Server renders HTML
2. Browser displays HTML (user sees content)
3. Angular JavaScript loads
4. Angular MATCHES existing DOM nodes
5. Angular ATTACHES event listeners to existing nodes
6. Angular BINDS state to existing nodes
7. Page becomes interactive (no flicker!)

// Benefits:
// - No DOM destruction/recreation
// - Faster Time to Interactive (TTI)
// - Better Core Web Vitals
// - Smooth user experience
```

### Enabling Non-Destructive Hydration

```typescript
// app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration()  // Enable non-destructive hydration
  ]
};
```

### How Non-Destructive Hydration Works Internally

**The Matching Process:**

```typescript
// Angular creates a "hydration map" during SSR
interface HydrationInfo {
  ngh: string;  // Hydration ID
  nodes: {
    [key: string]: {
      element: string;
      index: number;
      children?: HydrationInfo[];
    }
  };
}

// Server-rendered HTML includes hydration markers
<div ngh="0">
  <h1 ngh="0-0">Title</h1>
  <p ngh="0-1">Content</p>
</div>

// Client-side Angular:
1. Reads hydration markers
2. Matches component tree to DOM nodes
3. Attaches event listeners without re-rendering
4. Removes hydration markers
5. Application is now interactive
```

**Real implementation example:**

```typescript
@Component({
  selector: 'app-product-list',
  standalone: true,
  template: `
    <div class="products">
      @for (product of products(); track product.id) {
        <div class="product-card" (click)="selectProduct(product)">
          <img [src]="product.image" [alt]="product.name">
          <h3>{{ product.name }}</h3>
          <p>{{ product.price | currency }}</p>
        </div>
      }
    </div>
  `
})
export class ProductListComponent {
  products = signal<Product[]>([]);
  
  constructor(private productService: ProductService) {}
  
  ngOnInit() {
    // This runs on both server and client
    this.productService.getProducts().subscribe(products => {
      this.products.set(products);
    });
  }
  
  selectProduct(product: Product) {
    // This only runs on client (after hydration)
    console.log('Product selected:', product);
  }
}
```

**What happens:**

**On Server:**
```typescript
1. ngOnInit runs, fetches products
2. Template renders with product data
3. HTML generated with hydration markers:
   <div class="products" ngh="0">
     <div class="product-card" ngh="0-0">
       <img src="..." ngh="0-0-0">
       <h3 ngh="0-0-1">Product 1</h3>
       <p ngh="0-0-2">$99.99</p>
     </div>
     <!-- More products... -->
   </div>
4. HTML sent to browser
```

**On Client:**
```typescript
1. Browser displays HTML immediately (user sees products)
2. Angular JavaScript loads
3. Angular reads hydration markers
4. Angular matches DOM nodes to component tree
5. Angular attaches click handler to product cards
6. Angular removes hydration markers
7. User can now click products (interactive!)
```

### Incremental Hydration (Angular 18+)

Incremental hydration allows you to defer hydration of certain components until they're needed, further improving performance.

```typescript
// Using @defer for incremental hydration
@Component({
  template: `
    <header>
      <!-- Critical content - hydrate immediately -->
      <nav>...</nav>
    </header>
    
    <main>
      <!-- Above the fold - hydrate immediately -->
      <app-hero-section />
      
      <!-- Below the fold - defer hydration -->
      @defer (on viewport) {
        <app-product-grid />
      } @placeholder {
        <div class="skeleton-loader"></div>
      }
      
      <!-- Heavy component - defer until interaction -->
      @defer (on interaction) {
        <app-comments-section />
      } @placeholder {
        <button>Load Comments</button>
      }
    </main>
  `
})
export class HomeComponent {}
```

**How it works:**

```typescript
// Product grid won't hydrate until it enters viewport
1. Server renders <app-product-grid> HTML
2. Browser displays the HTML
3. Angular JavaScript loads
4. Angular hydrates header and hero (above fold)
5. Product grid HTML is visible but NOT interactive yet
6. User scrolls down
7. Product grid enters viewport
8. Angular hydrates product grid
9. Product grid becomes interactive
```

### SSR-Specific Considerations

**1. Platform Detection:**

```typescript
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

@Component({})
export class MyComponent {
  private platformId = inject(PLATFORM_ID);
  
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Only runs in browser
      console.log('Window width:', window.innerWidth);
      localStorage.setItem('visited', 'true');
    }
    
    if (isPlatformServer(this.platformId)) {
      // Only runs on server
      console.log('Rendering on server');
    }
  }
}
```

**2. Avoiding Browser-Only APIs:**

```typescript
@Component({})
export class ProblematicComponent implements OnInit {
  ngOnInit() {
    // ❌ WRONG: Crashes on server (window is undefined)
    const width = window.innerWidth;
    
    // ❌ WRONG: localStorage doesn't exist on server
    const token = localStorage.getItem('token');
    
    // ❌ WRONG: document is undefined on server
    document.querySelector('.element');
  }
}

// ✅ CORRECT: Platform detection
@Component({})
export class CorrectComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const width = window.innerWidth;
      const token = localStorage.getItem('token');
      const element = document.querySelector('.element');
    }
  }
}
```

**3. Transfer State (Avoid Duplicate HTTP Requests):**

```typescript
// Problem: Without transfer state, HTTP requests run twice
// 1. On server (for SSR)
// 2. On client (after hydration)

// Solution: Transfer state from server to client
import { TransferState, makeStateKey } from '@angular/core';

const PRODUCTS_KEY = makeStateKey<Product[]>('products');

@Injectable({ providedIn: 'root' })
export class ProductService {
  private transferState = inject(TransferState);
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  getProducts(): Observable<Product[]> {
    // Check if data exists in transfer state
    const cachedProducts = this.transferState.get(PRODUCTS_KEY, null);
    
    if (cachedProducts) {
      // Data transferred from server, use it
      this.transferState.remove(PRODUCTS_KEY);
      return of(cachedProducts);
    }
    
    // Fetch from API
    return this.http.get<Product[]>('/api/products').pipe(
      tap(products => {
        // On server, store in transfer state
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(PRODUCTS_KEY, products);
        }
      })
    );
  }
}
```

**How transfer state works:**

```typescript
// Server renders:
<html>
  <body>
    <app-root>
      <!-- Rendered content -->
    </app-root>
    
    <!-- Transfer state injected by Angular -->
    <script id="serverApp-state" type="application/json">
      {
        "products": [
          {"id": 1, "name": "Product 1"},
          {"id": 2, "name": "Product 2"}
        ]
      }
    </script>
    
    <script src="main.js"></script>
  </body>
</html>

// Client:
1. Angular reads transfer state from script tag
2. Service returns cached data instead of making HTTP request
3. No duplicate API calls!
```

### Performance Benefits: Real Numbers

**Metrics from a typical e-commerce site:**

| Metric | CSR Only | SSR (Destructive) | SSR (Non-Destructive) |
|--------|----------|-------------------|----------------------|
| First Contentful Paint (FCP) | 3.2s | 0.8s | 0.8s |
| Largest Contentful Paint (LCP) | 4.5s | 2.1s | 1.8s |
| Time to Interactive (TTI) | 5.2s | 3.8s | 2.9s |
| Cumulative Layout Shift (CLS) | 0.15 | 0.25 | 0.05 |
| Total Blocking Time (TBT) | 850ms | 620ms | 420ms |

**Why non-destructive hydration is faster:**
- No DOM destruction/recreation (saves 200-400ms)
- No layout recalculation (improves CLS)
- Smoother user experience (no flicker)
- Better Core Web Vitals scores

### Best Practices for SSR

**1. Optimize Server Response Time:**

```typescript
// Use caching for frequently accessed pages
import { LRUCache } from 'lru-cache';

const pageCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 5  // 5 minutes
});

server.get('*', async (req, res) => {
  const url = req.url;
  
  // Check cache
  const cached = pageCache.get(url);
  if (cached) {
    return res.send(cached);
  }
  
  // Render and cache
  const html = await commonEngine.render({...});
  pageCache.set(url, html);
  res.send(html);
});
```

**2. Handle Errors Gracefully:**

```typescript
server.get('*', async (req, res, next) => {
  try {
    const html = await commonEngine.render({...});
    res.send(html);
  } catch (error) {
    console.error('SSR Error:', error);
    
    // Fall back to client-side rendering
    res.sendFile(join(browserDistFolder, 'index.html'));
  }
});
```

**3. Preload Critical Data:**

```typescript
// Resolve data before rendering
@Injectable()
export class ProductResolver {
  constructor(private productService: ProductService) {}
  
  resolve(): Observable<Product[]> {
    return this.productService.getProducts();
  }
}

// Route configuration
const routes: Routes = [
  {
    path: 'products',
    component: ProductListComponent,
    resolve: { products: ProductResolver }
  }
];
```

### When to Use SSR

**Use SSR when:**
- SEO is critical (public-facing content)
- Fast FCP is important (e-commerce, news sites)
- Social media sharing is common
- Users are on slow networks
- Content is mostly static or changes infrequently

**Skip SSR when:**
- Building admin dashboards (behind authentication)
- Real-time applications (chat, trading platforms)
- Content is highly dynamic and personalized
- Server costs are a concern
- Team lacks Node.js expertise

### The Bottom Line

Non-destructive hydration represents a major leap forward in Angular's SSR capabilities. By reusing server-rendered DOM instead of destroying and recreating it, Angular delivers faster, smoother experiences with better Core Web Vitals scores. Combined with incremental hydration and transfer state, modern Angular SSR provides enterprise-grade performance for public-facing applications.

---

## Question 2: How do you implement comprehensive error handling and HTTP interceptors in Angular? Explain retry logic, token refresh, and error recovery patterns.

**Answer:**

HTTP interceptors are middleware that sit between your application and the backend API, allowing you to intercept, modify, and handle HTTP requests and responses globally. Proper error handling and interceptor patterns are crucial for building resilient enterprise applications.

### Understanding HTTP Interceptors

**The Interceptor Chain:**

```typescript
// Request flow:
Component → Interceptor 1 → Interceptor 2 → Interceptor N → Backend API
                                                                    ↓
Component ← Interceptor 1 ← Interceptor 2 ← Interceptor N ← Response
```

Each interceptor can:
- Modify outgoing requests (add headers, transform data)
- Modify incoming responses (transform data, cache)
- Handle errors (retry, redirect, show notifications)
- Log requests/responses
- Measure performance

### Basic Interceptor Structure

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

// Modern functional interceptor (Angular 15+)
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Request:', req.url);
  
  return next(req).pipe(
    tap(event => {
      if (event.type === HttpEventType.Response) {
        console.log('Response:', event.status);
      }
    })
  );
};

// Register in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([loggingInterceptor])
    )
  ]
};
```

### 1. Authentication Interceptor

**Adding JWT tokens to requests:**

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  // Skip authentication for certain URLs
  const skipAuth = req.url.includes('/public') || 
                   req.url.includes('/login');
  
  if (skipAuth || !token) {
    return next(req);
  }
  
  // Clone request and add authorization header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return next(authReq);
};
```

### 2. Error Handling Interceptor

**Comprehensive error handling with user notifications:**

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { LoggerService } from './logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notification = inject(NotificationService);
  const logger = inject(LoggerService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';
      let shouldNotifyUser = true;
      
      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network Error: ${error.error.message}`;
        logger.error('Client-side error', {
          message: error.error.message,
          url: req.url
        });
      } else {
        // Backend error
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Bad Request';
            logger.warn('Bad request', {
              url: req.url,
              body: req.body,
              error: error.error
            });
            break;
            
          case 401:
            errorMessage = 'Session expired. Please login again.';
            logger.info('Unauthorized access', { url: req.url });
            router.navigate(['/login'], {
              queryParams: { returnUrl: router.url }
            });
            break;
            
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            logger.warn('Forbidden access', {
              url: req.url,
              user: 'current-user-id'
            });
            break;
            
          case 404:
            errorMessage = 'The requested resource was not found.';
            shouldNotifyUser = false; // Handle in component
            logger.warn('Resource not found', { url: req.url });
            break;
            
          case 409:
            errorMessage = error.error?.message || 'Conflict occurred';
            logger.warn('Conflict', {
              url: req.url,
              error: error.error
            });
            break;
            
          case 422:
            errorMessage = 'Validation failed';
            // Don't show notification, let component handle validation errors
            shouldNotifyUser = false;
            logger.info('Validation error', {
              url: req.url,
              errors: error.error
            });
            break;
            
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            logger.warn('Rate limit exceeded', { url: req.url });
            break;
            
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            logger.error('Server error', {
              url: req.url,
              status: error.status,
              error: error.error
            });
            break;
            
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            logger.error('Service unavailable', { url: req.url });
            break;
            
          default:
            errorMessage = `Error ${error.status}: ${error.message}`;
            logger.error('Unexpected error', {
              url: req.url,
              status: error.status,
              error: error.error
            });
        }
      }
      
      // Show notification to user
      if (shouldNotifyUser) {
        notification.showError(errorMessage);
      }
      
      // Re-throw error for component to handle
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error
      }));
    })
  );
};
```

### 3. Retry Logic Interceptor

**Automatic retry with exponential backoff:**

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry, timer, mergeMap, throwError } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // Don't retry mutations (POST, PUT, DELETE, PATCH)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next(req);
  }
  
  // Don't retry if explicitly disabled
  if (req.headers.has('X-No-Retry')) {
    return next(req);
  }
  
  const maxRetries = 3;
  const initialDelay = 1000; // 1 second
  
  return next(req).pipe(
    retry({
      count: maxRetries,
      delay: (error: HttpErrorResponse, retryCount) => {
        // Only retry on specific errors
        const shouldRetry = 
          error.status === 0 ||  // Network error
          error.status === 408 || // Request timeout
          error.status === 429 || // Too many requests
          error.status >= 500;    // Server errors
        
        if (!shouldRetry) {
          return throwError(() => error);
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, retryCount - 1);
        
        console.log(
          `Retry attempt ${retryCount}/${maxRetries} for ${req.url} ` +
          `after ${delay}ms`
        );
        
        return timer(delay);
      }
    })
  );
};
```

**Advanced retry with jitter (prevents thundering herd):**

```typescript
export const retryWithJitterInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  
  return next(req).pipe(
    retry({
      count: 3,
      delay: (error, retryCount) => {
        if (error.status < 500 && error.status !== 0) {
          return throwError(() => error);
        }
        
        // Exponential backoff with jitter
        const baseDelay = 1000 * Math.pow(2, retryCount - 1);
        const jitter = Math.random() * 1000; // 0-1000ms random
        const delay = baseDelay + jitter;
        
        return timer(delay);
      }
    })
  );
};
```

### 4. Token Refresh Interceptor

**Automatic token refresh on 401 errors:**

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from './auth.service';

// Shared state for token refresh
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 errors
      if (error.status !== 401) {
        return throwError(() => error);
      }
      
      // Don't refresh token for login/refresh endpoints
      if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
        return throwError(() => error);
      }
      
      // If not already refreshing, start refresh
      if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);
        
        return authService.refreshToken().pipe(
          switchMap((newToken: string) => {
            isRefreshing = false;
            refreshTokenSubject.next(newToken);
            
            // Retry original request with new token
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            
            return next(clonedReq);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            refreshTokenSubject.next(null);
            
            // Refresh failed, logout user
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      } else {
        // Wait for token refresh to complete
        return refreshTokenSubject.pipe(
          filter(token => token !== null),
          take(1),
          switchMap(token => {
            // Retry original request with new token
            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            });
            
            return next(clonedReq);
          })
        );
      }
    })
  );
};
```

**How the token refresh pattern works:**

```typescript
// Scenario: Multiple requests fail with 401 simultaneously

Request 1 (401) ──┐
Request 2 (401) ──┼──> First request starts token refresh
Request 3 (401) ──┘     Other requests wait for refresh
                        
                        ↓
                        
                   Token refresh completes
                        
                        ↓
                        
Request 1 retried ──┐
Request 2 retried ──┼──> All requests retry with new token
Request 3 retried ──┘
```

### 5. Caching Interceptor

**Cache GET requests to reduce server load:**

```typescript
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap, shareReplay } from 'rxjs';

// Simple in-memory cache
const cache = new Map<string, {
  response: HttpResponse<any>;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }
  
  // Skip caching if explicitly disabled
  if (req.headers.has('X-No-Cache')) {
    return next(req);
  }
  
  const cacheKey = req.urlWithParams;
  const cached = cache.get(cacheKey);
  
  // Return cached response if valid
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_TTL) {
      console.log('Cache hit:', cacheKey);
      return of(cached.response.clone());
    } else {
      // Expired, remove from cache
      cache.delete(cacheKey);
    }
  }
  
  // Make request and cache response
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(cacheKey, {
          response: event.clone(),
          timestamp: Date.now()
        });
        
        // Limit cache size
        if (cache.size > 100) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      }
    })
  );
};
```

### 6. Loading Indicator Interceptor

**Show global loading spinner:**

```typescript
import { HttpInterceptorFn, HttpEventType } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { LoadingService } from './loading.service';

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Skip loading indicator for certain requests
  if (req.headers.has('X-No-Loading')) {
    return next(req);
  }
  
  // Increment active requests
  if (activeRequests === 0) {
    loadingService.show();
  }
  activeRequests++;
  
  return next(req).pipe(
    finalize(() => {
      // Decrement active requests
      activeRequests--;
      if (activeRequests === 0) {
        loadingService.hide();
      }
    })
  );
};

// LoadingService
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loading = signal(false);
  isLoading = this.loading.asReadonly();
  
  show() {
    this.loading.set(true);
  }
  
  hide() {
    this.loading.set(false);
  }
}
```

### 7. Request/Response Logging Interceptor

**Detailed logging for debugging:**

```typescript
import { HttpInterceptorFn, HttpEventType } from '@angular/common/http';
import { tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = Date.now();
  
  console.group(`HTTP ${req.method} ${req.url}`);
  console.log('Request:', {
    url: req.url,
    method: req.method,
    headers: req.headers.keys().reduce((acc, key) => {
      acc[key] = req.headers.get(key);
      return acc;
    }, {} as Record<string, string | null>),
    body: req.body
  });
  
  return next(req).pipe(
    tap(event => {
      if (event.type === HttpEventType.Response) {
        const elapsed = Date.now() - started;
        console.log('Response:', {
          status: event.status,
          statusText: event.statusText,
          body: event.body,
          elapsed: `${elapsed}ms`
        });
        console.groupEnd();
      }
    })
  );
};
```

### 8. Request Timeout Interceptor

**Prevent hanging requests:**

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { timeout, catchError, throwError } from 'rxjs';

const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  // Get custom timeout from headers or use default
  const timeoutValue = req.headers.has('X-Timeout')
    ? parseInt(req.headers.get('X-Timeout')!, 10)
    : DEFAULT_TIMEOUT;
  
  return next(req).pipe(
    timeout(timeoutValue),
    catchError(error => {
      if (error.name === 'TimeoutError') {
        console.error(`Request timeout after ${timeoutValue}ms:`, req.url);
        return throwError(() => ({
          status: 408,
          message: 'Request timeout',
          url: req.url
        }));
      }
      return throwError(() => error);
    })
  );
};
```

### Combining Multiple Interceptors

**Order matters! Interceptors run in the order they're provided:**

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        // 1. Add auth token first
        authInterceptor,
        
        // 2. Handle token refresh
        tokenRefreshInterceptor,
        
        // 3. Add timeout
        timeoutInterceptor,
        
        // 4. Retry failed requests
        retryInterceptor,
        
        // 5. Cache responses
        cacheInterceptor,
        
        // 6. Show loading indicator
        loadingInterceptor,
        
        // 7. Log requests (last, so it logs everything)
        loggingInterceptor,
        
        // 8. Handle errors (last, catches all errors)
        errorInterceptor
      ])
    )
  ]
};
```

### Real-World Complete Example

**Enterprise-grade HTTP service with interceptors:**

```typescript
// api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  
  // GET with caching
  get<T>(endpoint: string, options?: {
    cache?: boolean;
    retry?: boolean;
  }): Observable<T> {
    let headers = new HttpHeaders();
    
    if (options?.cache === false) {
      headers = headers.set('X-No-Cache', 'true');
    }
    
    if (options?.retry === false) {
      headers = headers.set('X-No-Retry', 'true');
    }
    
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { headers });
  }
  
  // POST without loading indicator
  postSilent<T>(endpoint: string, body: any): Observable<T> {
    const headers = new HttpHeaders().set('X-No-Loading', 'true');
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, { headers });
  }
  
  // PUT with custom timeout
  putWithTimeout<T>(
    endpoint: string,
    body: any,
    timeoutMs: number
  ): Observable<T> {
    const headers = new HttpHeaders().set('X-Timeout', timeoutMs.toString());
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, { headers });
  }
}

// Usage in component
@Component({})
export class ProductComponent {
  private api = inject(ApiService);
  
  loadProducts() {
    // Cached, retried GET request
    this.api.get<Product[]>('products', { cache: true, retry: true })
      .subscribe({
        next: (products) => {
          this.products.set(products);
        },
        error: (error) => {
          // Error already handled by interceptor
          console.error('Failed to load products:', error);
        }
      });
  }
  
  saveProduct(product: Product) {
    // POST with 10 second timeout
    this.api.putWithTimeout('products', product, 10000)
      .subscribe({
        next: () => {
          console.log('Product saved');
        },
        error: (error) => {
          if (error.status === 408) {
            console.error('Save timeout');
          }
        }
      });
  }
}
```

### Best Practices

1. **Keep interceptors focused** - Each interceptor should have a single responsibility
2. **Order matters** - Think carefully about interceptor order
3. **Use headers for configuration** - Custom headers to control interceptor behavior
4. **Handle errors gracefully** - Always provide fallbacks
5. **Log appropriately** - Detailed logs in development, minimal in production
6. **Test interceptors** - Unit test each interceptor independently
7. **Monitor performance** - Track retry rates, cache hit rates, error rates

### The Bottom Line

HTTP interceptors are powerful middleware that enable cross-cutting concerns like authentication, error handling, retry logic, and caching to be implemented once and applied globally. By combining multiple focused interceptors in the right order, you can build resilient, maintainable Angular applications that handle network issues gracefully and provide excellent user experiences.

---

## Question 3: Explain Angular's Reactive Forms in depth. How do you implement complex validation patterns, dynamic forms, and form arrays?

**Answer:**

Reactive Forms provide a model-driven approach to handling form inputs whose values change over time. Unlike template-driven forms, reactive forms provide synchronous access to the data model, immutability with observable operators, and easier testing.

### Core Concepts of Reactive Forms

**The Form Model Hierarchy:**

```typescript
FormControl    // Single input field
    ↓
FormGroup      // Collection of FormControls
    ↓
FormArray      // Dynamic array of FormControls or FormGroups
    ↓
FormRecord     // Dynamic object of FormControls (Angular 14+)
```

### Basic Reactive Form Setup

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <div>
        <label>Name:</label>
        <input formControlName="name" />
        @if (userForm.get('name')?.invalid && userForm.get('name')?.touched) {
          <span class="error">Name is required</span>
        }
      </div>
      
      <div>
        <label>Email:</label>
        <input formControlName="email" type="email" />
        @if (userForm.get('email')?.hasError('required')) {
          <span class="error">Email is required</span>
        }
        @if (userForm.get('email')?.hasError('email')) {
          <span class="error">Invalid email format</span>
        }
      </div>
      
      <button type="submit" [disabled]="userForm.invalid">Submit</button>
    </form>
  `
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  
  // Method 1: Using FormBuilder (recommended)
  userForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]]
  });
  
  // Method 2: Manual construction
  userFormManual = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email])
  });
  
  onSubmit() {
    if (this.userForm.valid) {
      console.log('Form value:', this.userForm.value);
      console.log('Form raw value:', this.userForm.getRawValue());
    }
  }
}
```

### Understanding Form States

**Every form control has multiple states:**

```typescript
const control = new FormControl('initial value');

// Value states
control.value          // Current value
control.valueChanges   // Observable of value changes

// Validation states
control.valid          // true if all validators pass
control.invalid        // true if any validator fails
control.errors         // Object containing validation errors
control.hasError('required')  // Check specific error

// Interaction states
control.pristine       // true if user hasn't changed value
control.dirty          // true if user has changed value
control.touched        // true if user has focused and blurred
control.untouched      // true if user hasn't focused

// Status
control.status         // 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED'
control.statusChanges  // Observable of status changes

// Disabled state
control.disabled       // true if control is disabled
control.enabled        // true if control is enabled
```

### Complex Nested Forms

**Building forms with nested groups:**

```typescript
@Component({
  template: `
    <form [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
      <!-- Personal Info Group -->
      <div formGroupName="personalInfo">
        <h3>Personal Information</h3>
        <input formControlName="firstName" placeholder="First Name" />
        <input formControlName="lastName" placeholder="Last Name" />
        <input formControlName="dateOfBirth" type="date" />
      </div>
      
      <!-- Address Group -->
      <div formGroupName="address">
        <h3>Address</h3>
        <input formControlName="street" placeholder="Street" />
        <input formControlName="city" placeholder="City" />
        <input formControlName="state" placeholder="State" />
        <input formControlName="zipCode" placeholder="ZIP Code" />
      </div>
      
      <!-- Contact Group -->
      <div formGroupName="contact">
        <h3>Contact Information</h3>
        <input formControlName="email" type="email" placeholder="Email" />
        <input formControlName="phone" placeholder="Phone" />
      </div>
      
      <button type="submit" [disabled]="registrationForm.invalid">
        Register
      </button>
    </form>
  `
})
export class RegistrationFormComponent {
  private fb = inject(FormBuilder);
  
  registrationForm = this.fb.group({
    personalInfo: this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', [Validators.required, this.ageValidator(18)]]
    }),
    address: this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
    }),
    contact: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, this.phoneValidator()]]
    })
  });
  
  // Custom age validator
  ageValidator(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const birthDate = new Date(control.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      const actualAge = monthDiff < 0 || 
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age;
      
      return actualAge >= minAge ? null : {
        minAge: {
          requiredAge: minAge,
          actualAge: actualAge
        }
      };
    };
  }
  
  // Custom phone validator
  phoneValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      // US phone format: (123) 456-7890 or 123-456-7890
      const phoneRegex = /^(\(\d{3}\)\s?|\d{3}[-.]?)\d{3}[-.]?\d{4}$/;
      
      return phoneRegex.test(control.value) ? null : {
        invalidPhone: { value: control.value }
      };
    };
  }
  
  onSubmit() {
    if (this.registrationForm.valid) {
      const formData = this.registrationForm.value;
      console.log('Registration data:', formData);
      
      // Access nested values
      const firstName = this.registrationForm.get('personalInfo.firstName')?.value;
      const email = this.registrationForm.get('contact.email')?.value;
    }
  }
}
```

### Dynamic Forms with FormArray

**Managing dynamic lists of form controls:**

```typescript
@Component({
  template: `
    <form [formGroup]="orderForm" (ngSubmit)="onSubmit()">
      <h3>Order Form</h3>
      
      <div formArrayName="items">
        @for (item of items.controls; track $index) {
          <div [formGroupName]="$index" class="item-row">
            <input formControlName="product" placeholder="Product" />
            <input formControlName="quantity" type="number" placeholder="Qty" />
            <input formControlName="price" type="number" placeholder="Price" />
            <span>Total: {{ calculateItemTotal($index) | currency }}</span>
            <button type="button" (click)="removeItem($index)">Remove</button>
          </div>
        }
      </div>
      
      <button type="button" (click)="addItem()">Add Item</button>
      
      <div class="summary">
        <p>Subtotal: {{ calculateSubtotal() | currency }}</p>
        <p>Tax (8%): {{ calculateTax() | currency }}</p>
        <p>Total: {{ calculateTotal() | currency }}</p>
      </div>
      
      <button type="submit" [disabled]="orderForm.invalid">
        Place Order
      </button>
    </form>
  `
})
export class OrderFormComponent {
  private fb = inject(FormBuilder);
  
  orderForm = this.fb.group({
    items: this.fb.array([
      this.createItem()
    ])
  });
  
  get items(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }
  
  createItem(): FormGroup {
    return this.fb.group({
      product: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]]
    });
  }
  
  addItem(): void {
    this.items.push(this.createItem());
  }
  
  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }
  
  calculateItemTotal(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const price = item.get('price')?.value || 0;
    return quantity * price;
  }
  
  calculateSubtotal(): number {
    return this.items.controls.reduce((sum, item) => {
      const quantity = item.get('quantity')?.value || 0;
      const price = item.get('price')?.value || 0;
      return sum + (quantity * price);
    }, 0);
  }
  
  calculateTax(): number {
    return this.calculateSubtotal() * 0.08;
  }
  
  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateTax();
  }
  
  onSubmit(): void {
    if (this.orderForm.valid) {
      console.log('Order:', this.orderForm.value);
    }
  }
}
```

### Advanced Custom Validators

**1. Cross-field validation:**

```typescript
// Password confirmation validator
function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value 
      ? null 
      : { passwordMismatch: true };
  };
}

// Usage
passwordForm = this.fb.group({
  password: ['', [Validators.required, Validators.minLength(8)]],
  confirmPassword: ['', Validators.required]
}, { validators: passwordMatchValidator() });
```

**2. Async validators (API validation):**

```typescript
@Injectable({ providedIn: 'root' })
export class UsernameValidator {
  private http = inject(HttpClient);
  
  validate(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }
      
      return this.http.get<{ available: boolean }>(
        `/api/check-username/${control.value}`
      ).pipe(
        map(response => response.available ? null : { usernameTaken: true }),
        catchError(() => of(null)),
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged()
      );
    };
  }
}

// Usage
@Component({})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private usernameValidator = inject(UsernameValidator);
  
  signupForm = this.fb.group({
    username: ['', 
      [Validators.required, Validators.minLength(3)],
      [this.usernameValidator.validate()]  // Async validator
    ],
    email: ['', [Validators.required, Validators.email]]
  });
}
```

**3. Complex business logic validators:**

```typescript
// Credit card validator
function creditCardValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    // Remove spaces and dashes
    const cardNumber = control.value.replace(/[\s-]/g, '');
    
    // Check if only digits
    if (!/^\d+$/.test(cardNumber)) {
      return { invalidCard: true };
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0 ? null : { invalidCard: true };
  };
}

// Date range validator
function dateRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;
    
    if (!startDate || !endDate) {
      return null;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return { invalidDateRange: true };
    }
    
    // Check if range is too long (e.g., max 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYear) {
      return { dateRangeTooLong: true };
    }
    
    return null;
  };
}
```

### Dynamic Form Generation

**Building forms from configuration:**

```typescript
interface FieldConfig {
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox';
  name: string;
  label: string;
  value?: any;
  required?: boolean;
  validators?: ValidatorFn[];
  options?: { label: string; value: any }[];
}

@Component({
  template: `
    <form [formGroup]="dynamicForm" (ngSubmit)="onSubmit()">
      @for (field of fields; track field.name) {
        <div class="form-field">
          <label>{{ field.label }}</label>
          
          @switch (field.type) {
            @case ('text') {
              <input [formControlName]="field.name" type="text" />
            }
            @case ('email') {
              <input [formControlName]="field.name" type="email" />
            }
            @case ('number') {
              <input [formControlName]="field.name" type="number" />
            }
            @case ('select') {
              <select [formControlName]="field.name">
                @for (option of field.options; track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            }
            @case ('checkbox') {
              <input [formControlName]="field.name" type="checkbox" />
            }
          }
          
          @if (dynamicForm.get(field.name)?.invalid && 
               dynamicForm.get(field.name)?.touched) {
            <span class="error">{{ getErrorMessage(field.name) }}</span>
          }
        </div>
      }
      
      <button type="submit" [disabled]="dynamicForm.invalid">Submit</button>
    </form>
  `
})
export class DynamicFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  @Input() fields: FieldConfig[] = [];
  dynamicForm!: FormGroup;
  
  ngOnInit() {
    this.dynamicForm = this.createForm();
  }
  
  createForm(): FormGroup {
    const group: { [key: string]: FormControl } = {};
    
    this.fields.forEach(field => {
      const validators: ValidatorFn[] = field.validators || [];
      
      if (field.required) {
        validators.push(Validators.required);
      }
      
      if (field.type === 'email') {
        validators.push(Validators.email);
      }
      
      group[field.name] = new FormControl(
        field.value || '',
        validators
      );
    });
    
    return this.fb.group(group);
  }
  
  getErrorMessage(fieldName: string): string {
    const control = this.dynamicForm.get(fieldName);
    if (!control) return '';
    
    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('email')) {
      return 'Invalid email format';
    }
    if (control.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control.hasError('max')) {
      return `Maximum value is ${control.errors?.['max'].max}`;
    }
    
    return 'Invalid value';
  }
  
  onSubmit() {
    if (this.dynamicForm.valid) {
      console.log('Form data:', this.dynamicForm.value);
    }
  }
}

// Usage
@Component({
  template: `
    <app-dynamic-form [fields]="formFields" />
  `
})
export class ParentComponent {
  formFields: FieldConfig[] = [
    {
      type: 'text',
      name: 'firstName',
      label: 'First Name',
      required: true,
      validators: [Validators.minLength(2)]
    },
    {
      type: 'email',
      name: 'email',
      label: 'Email Address',
      required: true
    },
    {
      type: 'select',
      name: 'country',
      label: 'Country',
      required: true,
      options: [
        { label: 'United States', value: 'US' },
        { label: 'Canada', value: 'CA' },
        { label: 'United Kingdom', value: 'UK' }
      ]
    },
    {
      type: 'checkbox',
      name: 'subscribe',
      label: 'Subscribe to newsletter',
      value: false
    }
  ];
}
```

### Form Value Changes and Reactive Updates

**Listening to form changes:**

```typescript
@Component({})
export class ReactiveFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  form = this.fb.group({
    country: [''],
    state: [''],
    city: ['']
  });
  
  states: string[] = [];
  cities: string[] = [];
  
  ngOnInit() {
    // Listen to country changes
    this.form.get('country')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(country => this.loadStates(country))
    ).subscribe(states => {
      this.states = states;
      this.form.patchValue({ state: '', city: '' });
    });
    
    // Listen to state changes
    this.form.get('state')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(state => this.loadCities(state))
    ).subscribe(cities => {
      this.cities = cities;
      this.form.patchValue({ city: '' });
    });
    
    // Listen to entire form changes
    this.form.valueChanges.pipe(
      debounceTime(500)
    ).subscribe(value => {
      console.log('Form changed:', value);
      this.saveToLocalStorage(value);
    });
  }
  
  loadStates(country: string): Observable<string[]> {
    return this.http.get<string[]>(`/api/states/${country}`);
  }
  
  loadCities(state: string): Observable<string[]> {
    return this.http.get<string[]>(`/api/cities/${state}`);
  }
  
  saveToLocalStorage(value: any): void {
    localStorage.setItem('formDraft', JSON.stringify(value));
  }
}
```

### Form Performance Optimization

**1. Using OnPush change detection:**

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <!-- Form fields -->
    </form>
  `
})
export class OptimizedFormComponent {
  // Reactive forms work perfectly with OnPush
  // because they use observables
}
```

**2. Disabling controls to prevent unnecessary validation:**

```typescript
// Disable fields conditionally
if (userType === 'guest') {
  this.form.get('companyName')?.disable();
  this.form.get('taxId')?.disable();
} else {
  this.form.get('companyName')?.enable();
  this.form.get('taxId')?.enable();
}

// Disabled controls are excluded from form.value
// Use getRawValue() to include disabled controls
const allValues = this.form.getRawValue();
```

### Testing Reactive Forms

```typescript
describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserFormComponent, ReactiveFormsModule]
    });
    
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
  });
  
  it('should create form with default values', () => {
    expect(component.userForm.get('name')?.value).toBe('');
    expect(component.userForm.get('email')?.value).toBe('');
  });
  
  it('should validate required fields', () => {
    const nameControl = component.userForm.get('name');
    
    expect(nameControl?.valid).toBeFalsy();
    expect(nameControl?.hasError('required')).toBeTruthy();
    
    nameControl?.setValue('John');
    expect(nameControl?.valid).toBeTruthy();
  });
  
  it('should validate email format', () => {
    const emailControl = component.userForm.get('email');
    
    emailControl?.setValue('invalid');
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.valid).toBeTruthy();
  });
  
  it('should submit valid form', () => {
    spyOn(component, 'onSubmit');
    
    component.userForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com'
    });
    
    expect(component.userForm.valid).toBeTruthy();
    
    const form = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    
    expect(component.onSubmit).toHaveBeenCalled();
  });
});
```

### Best Practices

1. **Use FormBuilder** - Cleaner syntax than manual construction
2. **Type your forms** - Use typed forms for better type safety
3. **Centralize validation** - Create reusable validator functions
4. **Handle async validation carefully** - Use debounce and distinctUntilChanged
5. **Clean up subscriptions** - Use takeUntilDestroyed() or async pipe
6. **Disable submit button** - Prevent invalid form submission
7. **Show validation errors** - Only after user interaction (touched)
8. **Use patchValue vs setValue** - patchValue for partial updates
9. **Consider form state** - pristine, dirty, touched for UX
10. **Test thoroughly** - Unit test validators and form logic

### The Bottom Line

Reactive Forms provide powerful, testable, and scalable form handling in Angular. By understanding FormControl, FormGroup, and FormArray, along with custom validators and reactive patterns, you can build complex, dynamic forms that provide excellent user experiences while maintaining clean, maintainable code.

---

## Question 4: Explain Angular Security in depth. How do you prevent XSS, CSRF attacks, and implement proper sanitization?

**Answer:**

Security is paramount in modern web applications. Angular provides built-in security features, but understanding how they work and when to use them is critical for building secure applications.

### Understanding Cross-Site Scripting (XSS)

XSS attacks occur when malicious scripts are injected into trusted websites. Angular's template system provides automatic protection against most XSS attacks.

**Types of XSS Attacks:**

**1. Reflected XSS:**
```typescript
// Vulnerable code (without Angular's protection)
// URL: https://example.com?search=<script>alert('XSS')</script>
const searchTerm = getQueryParam('search');
document.innerHTML = `<h1>Results for: ${searchTerm}</h1>`;
// This would execute the script!

// Angular's automatic protection
@Component({
  template: `
    <h1>Results for: {{ searchTerm }}</h1>
  `
})
export class SearchComponent {
  searchTerm = '<script>alert("XSS")</script>';
  // Angular automatically escapes this to:
  // &lt;script&gt;alert("XSS")&lt;/script&gt;
  // The script won't execute!
}
```

**2. Stored XSS:**
```typescript
// Malicious user stores script in database
const comment = '<img src=x onerror="alert(\'XSS\')">';

// Angular protects when rendering
@Component({
  template: `
    @for (comment of comments; track comment.id) {
      <div>{{ comment.text }}</div>
    }
  `
})
export class CommentsComponent {
  comments = [
    { id: 1, text: '<img src=x onerror="alert(\'XSS\')">' }
  ];
  // Angular escapes the HTML, preventing execution
}
```

**3. DOM-based XSS:**
```typescript
// Vulnerable: Direct DOM manipulation
ngAfterViewInit() {
  const userInput = this.getUserInput();
  document.getElementById('output')!.innerHTML = userInput;
  // DANGEROUS! Can execute scripts
}

// Safe: Use Angular's data binding
@Component({
  template: `<div>{{ userInput }}</div>`
})
export class SafeComponent {
  userInput = this.getUserInput();
  // Angular automatically sanitizes
}
```

### Angular's Built-in XSS Protection

**Automatic Sanitization:**

```typescript
import { Component } from '@angular/core';

@Component({
  template: `
    <!-- ✅ SAFE: Interpolation is automatically sanitized -->
    <div>{{ userContent }}</div>
    
    <!-- ✅ SAFE: Property binding is sanitized -->
    <div [innerHTML]="userContent"></div>
    
    <!-- ✅ SAFE: Attribute binding is sanitized -->
    <img [src]="imageUrl" />
    
    <!-- ❌ UNSAFE: Direct DOM manipulation bypasses Angular -->
    <div #container></div>
  `
})
export class ContentComponent {
  userContent = '<script>alert("XSS")</script><b>Bold text</b>';
  imageUrl = 'javascript:alert("XSS")';
  
  // Angular sanitizes userContent to:
  // <b>Bold text</b>
  // The script tag is removed!
  
  // Angular sanitizes imageUrl to:
  // unsafe:javascript:alert("XSS")
  // The javascript: protocol is blocked!
}
```

### DomSanitizer: When You Need to Bypass Sanitization

**Use cases for bypassing sanitization:**

```typescript
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  template: `
    <!-- Trusted HTML content -->
    <div [innerHTML]="trustedHtml"></div>
    
    <!-- Trusted URL -->
    <a [href]="trustedUrl">Download</a>
    
    <!-- Trusted resource URL (iframe, embed) -->
    <iframe [src]="trustedVideoUrl"></iframe>
    
    <!-- Trusted style -->
    <div [style.background-image]="trustedStyle"></div>
  `
})
export class TrustedContentComponent {
  private sanitizer = inject(DomSanitizer);
  
  // ⚠️ Only use when you TRUST the source!
  trustedHtml: SafeHtml;
  trustedUrl: SafeUrl;
  trustedVideoUrl: SafeResourceUrl;
  trustedStyle: any;
  
  constructor() {
    // Scenario 1: Rich text from trusted CMS
    const richText = '<p>This is <strong>trusted</strong> HTML from our CMS</p>';
    this.trustedHtml = this.sanitizer.bypassSecurityTrustHtml(richText);
    
    // Scenario 2: Download link with blob URL
    const blob = new Blob(['file content'], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    this.trustedUrl = this.sanitizer.bypassSecurityTrustUrl(blobUrl);
    
    // Scenario 3: Embed YouTube video
    const videoId = 'dQw4w9WgXcQ';
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    this.trustedVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    
    // Scenario 4: Dynamic background image
    const imageUrl = 'https://trusted-cdn.com/image.jpg';
    this.trustedStyle = this.sanitizer.bypassSecurityTrustStyle(
      `url(${imageUrl})`
    );
  }
}
```

**Creating a safe HTML pipe:**

```typescript
import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  
  transform(value: string): SafeHtml {
    // Only use this pipe for content you trust!
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

// Usage
@Component({
  template: `
    <div [innerHTML]="richContent | safeHtml"></div>
  `,
  imports: [SafeHtmlPipe]
})
export class ArticleComponent {
  richContent = '<p>Trusted <em>rich</em> content</p>';
}
```

### Sanitizing User Input

**Best practices for handling user input:**

```typescript
@Injectable({ providedIn: 'root' })
export class InputSanitizerService {
  private sanitizer = inject(DomSanitizer);
  
  // Remove all HTML tags
  stripHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
  
  // Allow only specific HTML tags
  sanitizeHtml(input: string, allowedTags: string[] = ['b', 'i', 'u', 'p']): string {
    const div = document.createElement('div');
    div.innerHTML = input;
    
    // Remove all elements except allowed tags
    const elements = div.querySelectorAll('*');
    elements.forEach(el => {
      if (!allowedTags.includes(el.tagName.toLowerCase())) {
        el.replaceWith(...Array.from(el.childNodes));
      }
    });
    
    return div.innerHTML;
  }
  
  // Sanitize URL
  sanitizeUrl(url: string): string {
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    const lowerUrl = url.toLowerCase().trim();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return 'about:blank';
      }
    }
    
    return url;
  }
  
  // Validate and sanitize email
  sanitizeEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmed = email.trim().toLowerCase();
    
    return emailRegex.test(trimmed) ? trimmed : null;
  }
}
```

### Cross-Site Request Forgery (CSRF) Protection

**Understanding CSRF:**

```typescript
// CSRF Attack Scenario:
// 1. User logs into bank.com
// 2. User visits malicious.com (without logging out)
// 3. malicious.com contains:
<form action="https://bank.com/transfer" method="POST">
  <input name="to" value="attacker-account" />
  <input name="amount" value="10000" />
</form>
<script>document.forms[0].submit();</script>
// 4. Browser automatically sends bank.com cookies
// 5. Money transferred without user's knowledge!
```

**Angular's CSRF Protection:**

```typescript
// Angular automatically includes CSRF token in HTTP requests
// when using HttpClient

// 1. Server sets CSRF token in cookie
// Set-Cookie: XSRF-TOKEN=abc123; Path=/

// 2. Angular reads cookie and adds header automatically
// X-XSRF-TOKEN: abc123

// 3. Server validates token matches

// Configuration (if needed)
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',  // Cookie name to read
        headerName: 'X-XSRF-TOKEN'  // Header name to send
      })
    )
  ]
};
```

**Custom CSRF interceptor:**

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next(req);
  }
  
  // Skip CSRF for external APIs
  if (!req.url.startsWith('/api')) {
    return next(req);
  }
  
  // Get CSRF token from cookie
  const csrfToken = getCookie('XSRF-TOKEN');
  
  if (csrfToken) {
    // Add CSRF token to header
    const clonedReq = req.clone({
      setHeaders: {
        'X-XSRF-TOKEN': csrfToken
      }
    });
    return next(clonedReq);
  }
  
  return next(req);
};

function getCookie(name: string): string | null {
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}
```

### Content Security Policy (CSP)

**Implementing CSP headers:**

```typescript
// Server-side (Express example)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://trusted-cdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );
  next();
});
```

**CSP-compatible Angular code:**

```typescript
// ❌ BAD: Inline event handlers (blocked by CSP)
@Component({
  template: `
    <button onclick="handleClick()">Click</button>
  `
})

// ✅ GOOD: Angular event binding
@Component({
  template: `
    <button (click)="handleClick()">Click</button>
  `
})
export class ButtonComponent {
  handleClick() {
    console.log('Clicked');
  }
}

// ❌ BAD: eval() and Function() (blocked by CSP)
const code = 'alert("XSS")';
eval(code);
new Function(code)();

// ✅ GOOD: Use proper Angular patterns
// No need for dynamic code execution
```

### Secure Authentication Patterns

**1. JWT Token Storage:**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  // ❌ BAD: Storing in localStorage (vulnerable to XSS)
  saveTokenInsecure(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  // ✅ BETTER: Use httpOnly cookies (set by server)
  // Server sets: Set-Cookie: token=abc123; HttpOnly; Secure; SameSite=Strict
  // JavaScript cannot access httpOnly cookies
  // Protects against XSS
  
  // ✅ GOOD: If you must use localStorage, implement additional security
  saveToken(token: string) {
    // Encrypt token before storing
    const encrypted = this.encrypt(token);
    localStorage.setItem(this.TOKEN_KEY, encrypted);
    
    // Set expiration
    const expiration = Date.now() + (60 * 60 * 1000); // 1 hour
    localStorage.setItem(`${this.TOKEN_KEY}_exp`, expiration.toString());
  }
  
  getToken(): string | null {
    const encrypted = localStorage.getItem(this.TOKEN_KEY);
    if (!encrypted) return null;
    
    // Check expiration
    const expiration = localStorage.getItem(`${this.TOKEN_KEY}_exp`);
    if (expiration && Date.now() > parseInt(expiration)) {
      this.clearToken();
      return null;
    }
    
    // Decrypt token
    return this.decrypt(encrypted);
  }
  
  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(`${this.TOKEN_KEY}_exp`);
  }
  
  private encrypt(value: string): string {
    // Use Web Crypto API for encryption
    // This is a simplified example
    return btoa(value);
  }
  
  private decrypt(value: string): string {
    return atob(value);
  }
}
```

**2. Secure password handling:**

```typescript
@Component({
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <!-- ✅ GOOD: Use type="password" -->
      <input formControlName="password" type="password" autocomplete="current-password" />
      
      <!-- ❌ BAD: Never log passwords -->
      <!-- console.log(password) -->
      
      <button type="submit">Login</button>
    </form>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  
  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      // ✅ GOOD: Send over HTTPS only
      // ✅ GOOD: Server hashes password (bcrypt, argon2)
      this.authService.login(email!, password!).subscribe({
        next: () => {
          // Clear password from memory
          this.loginForm.patchValue({ password: '' });
        },
        error: (error) => {
          // ✅ GOOD: Generic error message
          console.error('Login failed');
          
          // ❌ BAD: Specific error messages
          // "Invalid password" - reveals email exists
          // "User not found" - reveals email doesn't exist
        }
      });
    }
  }
}
```

### Preventing Clickjacking

```typescript
// Server-side: Set X-Frame-Options header
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  // or 'SAMEORIGIN' to allow same-origin framing
  next();
});

// Alternative: Use CSP frame-ancestors
res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
```

### Secure API Communication

```typescript
@Injectable({ providedIn: 'root' })
export class SecureApiService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;
  
  // ✅ GOOD: Always use HTTPS
  getData<T>(endpoint: string): Observable<T> {
    // Ensure HTTPS
    if (!this.API_URL.startsWith('https://')) {
      throw new Error('API must use HTTPS');
    }
    
    return this.http.get<T>(`${this.API_URL}/${endpoint}`).pipe(
      // Add timeout
      timeout(30000),
      
      // Retry on network errors
      retry({
        count: 3,
        delay: (error) => {
          if (error.status >= 400 && error.status < 500) {
            // Don't retry client errors
            return throwError(() => error);
          }
          return timer(1000);
        }
      }),
      
      // Handle errors
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => error);
      })
    );
  }
  
  // ✅ GOOD: Validate response data
  getUser(id: string): Observable<User> {
    return this.getData<any>(`users/${id}`).pipe(
      map(data => this.validateUser(data))
    );
  }
  
  private validateUser(data: any): User {
    // Validate required fields
    if (!data.id || !data.email) {
      throw new Error('Invalid user data');
    }
    
    // Sanitize data
    return {
      id: data.id,
      email: this.sanitizeEmail(data.email),
      name: this.sanitizeString(data.name),
      role: this.validateRole(data.role)
    };
  }
  
  private sanitizeString(value: any): string {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, 255); // Limit length
  }
  
  private sanitizeEmail(value: any): string {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  }
  
  private validateRole(value: any): UserRole {
    const validRoles: UserRole[] = ['admin', 'user', 'guest'];
    return validRoles.includes(value) ? value : 'guest';
  }
}
```

### Security Checklist

**1. Input Validation:**
- ✅ Validate all user input on both client and server
- ✅ Use Angular's built-in validators
- ✅ Implement custom validators for business logic
- ✅ Sanitize input before displaying
- ✅ Limit input length

**2. Output Encoding:**
- ✅ Use Angular's automatic escaping ({{ }})
- ✅ Be cautious with [innerHTML]
- ✅ Use DomSanitizer only for trusted content
- ✅ Implement CSP headers

**3. Authentication:**
- ✅ Use HTTPS only
- ✅ Implement proper session management
- ✅ Use httpOnly cookies for tokens
- ✅ Implement token refresh
- ✅ Clear sensitive data on logout

**4. Authorization:**
- ✅ Implement route guards
- ✅ Validate permissions on server
- ✅ Hide UI elements based on permissions
- ✅ Never trust client-side checks alone

**5. CSRF Protection:**
- ✅ Use Angular's built-in CSRF protection
- ✅ Validate CSRF tokens on server
- ✅ Use SameSite cookie attribute

**6. Dependencies:**
- ✅ Keep Angular and dependencies updated
- ✅ Run `npm audit` regularly
- ✅ Use `npm audit fix` to patch vulnerabilities
- ✅ Review third-party libraries

### The Bottom Line

Security in Angular requires a multi-layered approach. While Angular provides excellent built-in protection against XSS and CSRF attacks, developers must understand these mechanisms and follow best practices. Always validate and sanitize user input, use HTTPS, implement proper authentication, and keep dependencies updated. Security is not a feature you add at the end—it must be built into every layer of your application.

---

## Question 5: Explain Angular Route Guards in depth. How do you implement authentication, authorization, and navigation control?

**Answer:**

Route guards are interfaces that allow you to control navigation in Angular applications. They act as gatekeepers, determining whether a route can be activated, deactivated, or loaded.

### Types of Route Guards

**1. CanActivate - Prevent route activation:**

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Redirect to login with return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

// Route configuration
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  }
];
```


**2. CanActivateChild - Protect child routes:**

```typescript
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.getCurrentUser();
  
  if (user && user.role === 'admin') {
    return true;
  }
  
  return router.createUrlTree(['/unauthorized']);
};

const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivateChild: [adminGuard],
    children: [
      { path: 'users', component: UsersComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  }
];
```

**3. CanDeactivate - Prevent leaving a route:**

```typescript
export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = 
  (component) => {
    return component.canDeactivate ? component.canDeactivate() : true;
  };


// Component implementation
@Component({
  template: `
    <form [formGroup]="form">
      <input formControlName="title" />
      <textarea formControlName="content"></textarea>
      <button (click)="save()">Save</button>
    </form>
  `
})
export class ArticleEditorComponent implements CanComponentDeactivate {
  form = inject(FormBuilder).group({
    title: [''],
    content: ['']
  });
  
  private saved = false;
  
  canDeactivate(): boolean | Observable<boolean> {
    if (!this.form.dirty || this.saved) {
      return true;
    }
    
    return confirm('You have unsaved changes. Do you really want to leave?');
  }
  
  save() {
    // Save logic
    this.saved = true;
  }
}

const routes: Routes = [
  {
    path: 'edit/:id',
    component: ArticleEditorComponent,
    canDeactivate: [unsavedChangesGuard]
  }
];
```


**4. CanMatch - Prevent route matching:**

```typescript
export const featureFlagGuard: CanMatchFn = (route, segments) => {
  const featureService = inject(FeatureService);
  const featureName = route.data?.['feature'];
  
  return featureService.isEnabled(featureName);
};

const routes: Routes = [
  {
    path: 'beta-feature',
    component: BetaFeatureComponent,
    canMatch: [featureFlagGuard],
    data: { feature: 'beta-feature' }
  },
  {
    path: 'beta-feature',
    component: ComingSoonComponent
  }
];
```

**5. Resolve - Pre-fetch data before activation:**

```typescript
export const userResolver: ResolveFn<User> = (route, state) => {
  const userService = inject(UserService);
  const userId = route.paramMap.get('id')!;
  
  return userService.getUser(userId).pipe(
    catchError(() => {
      const router = inject(Router);
      router.navigate(['/not-found']);
      return EMPTY;
    })
  );
};


const routes: Routes = [
  {
    path: 'user/:id',
    component: UserProfileComponent,
    resolve: { user: userResolver }
  }
];

@Component({})
export class UserProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  user!: User;
  
  ngOnInit() {
    // Data is already resolved
    this.user = this.route.snapshot.data['user'];
  }
}
```

### Advanced Guard Patterns

**1. Role-based authorization:**

```typescript
export function hasRoleGuard(...allowedRoles: string[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    const user = authService.getCurrentUser();
    
    if (!user) {
      return router.createUrlTree(['/login']);
    }
    
    if (allowedRoles.includes(user.role)) {
      return true;
    }
    
    return router.createUrlTree(['/unauthorized']);
  };
}


// Usage
const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [hasRoleGuard('admin', 'superadmin')]
  },
  {
    path: 'moderator',
    component: ModeratorComponent,
    canActivate: [hasRoleGuard('moderator', 'admin')]
  }
];
```

**2. Permission-based authorization:**

```typescript
export function hasPermissionGuard(permission: string): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    return authService.hasPermission(permission).pipe(
      map(hasPermission => {
        if (hasPermission) {
          return true;
        }
        return router.createUrlTree(['/unauthorized']);
      }),
      catchError(() => of(router.createUrlTree(['/error'])))
    );
  };
}

const routes: Routes = [
  {
    path: 'users/delete',
    component: DeleteUserComponent,
    canActivate: [hasPermissionGuard('users.delete')]
  }
];
```


**3. Combining multiple guards:**

```typescript
const routes: Routes = [
  {
    path: 'secure-admin',
    component: SecureAdminComponent,
    canActivate: [
      authGuard,                    // Must be authenticated
      hasRoleGuard('admin'),        // Must be admin
      hasPermissionGuard('admin.access')  // Must have permission
    ]
  }
];
// Guards run in order, first failure stops execution
```

**4. Async guard with loading state:**

```typescript
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private http = inject(HttpClient);
  private cache = new Map<string, boolean>();
  
  checkPermission(permission: string): Observable<boolean> {
    if (this.cache.has(permission)) {
      return of(this.cache.get(permission)!);
    }
    
    return this.http.get<{ allowed: boolean }>(
      `/api/permissions/${permission}`
    ).pipe(
      map(response => response.allowed),
      tap(allowed => this.cache.set(permission, allowed)),
      timeout(5000),
      catchError(() => of(false))
    );
  }
}

export const asyncPermissionGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const permission = route.data?.['permission'];
  
  return permissionService.checkPermission(permission).pipe(
    map(allowed => allowed || router.createUrlTree(['/unauthorized']))
  );
};
```

### Best Practices

1. **Keep guards focused** - Single responsibility
2. **Use functional guards** - Simpler than class-based
3. **Handle errors gracefully** - Always provide fallback
4. **Cache permission checks** - Avoid redundant API calls
5. **Provide user feedback** - Show loading states
6. **Test thoroughly** - Unit test guard logic

### The Bottom Line

Route guards provide powerful navigation control in Angular applications. By combining authentication, authorization, and data resolution guards, you can build secure, user-friendly applications that protect sensitive routes and provide smooth navigation experiences.

---

## Question 6: Explain State Management in Angular. Compare NgRx, Signals, ComponentStore, and when to use each approach.

**Answer:**

State management is one of the most critical architectural decisions in Angular applications. The right approach depends on application complexity, team size, and specific requirements.

### Understanding Application State

**Types of state:**

```typescript
// 1. Local Component State
@Component({})
export class CounterComponent {
  count = signal(0);  // Only this component needs it
}

// 2. Shared State (Multiple components)
@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>([]);
  readonly items$ = this.items.asReadonly();
}

// 3. Global Application State
// User session, theme, language, etc.
// Needed across entire application

// 4. Server State (Cached API data)
// Products, users, orders from backend
```


### Approach 1: Angular Signals (Angular 16+)

**Modern reactive primitive built into Angular:**

```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <p>Double: {{ doubled() }}</p>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
      <button (click)="reset()">Reset</button>
    </div>
  `
})
export class SignalsComponent {
  // Writable signal
  count = signal(0);
  
  // Computed signal (derived state)
  doubled = computed(() => this.count() * 2);
  
  // Effect (side effects)
  constructor() {
    effect(() => {
      console.log(`Count changed to: ${this.count()}`);
      localStorage.setItem('count', this.count().toString());
    });
  }
  
  increment() {
    this.count.update(value => value + 1);
  }
  
  decrement() {
    this.count.update(value => value - 1);
  }
  
  reset() {
    this.count.set(0);
  }
}
```


**Signal-based service for shared state:**

```typescript
@Injectable({ providedIn: 'root' })
export class TodoService {
  private todos = signal<Todo[]>([]);
  private filter = signal<'all' | 'active' | 'completed'>('all');
  
  // Read-only signals
  readonly allTodos = this.todos.asReadonly();
  
  // Computed signals
  readonly filteredTodos = computed(() => {
    const todos = this.todos();
    const filter = this.filter();
    
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  });
  
  readonly activeCount = computed(() => 
    this.todos().filter(t => !t.completed).length
  );
  
  readonly completedCount = computed(() =>
    this.todos().filter(t => t.completed).length
  );
  
  // Actions
  addTodo(title: string) {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false
    };
    this.todos.update(todos => [...todos, newTodo]);
  }
  
  toggleTodo(id: string) {
    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }
  
  deleteTodo(id: string) {
    this.todos.update(todos => todos.filter(t => t.id !== id));
  }
  
  setFilter(filter: 'all' | 'active' | 'completed') {
    this.filter.set(filter);
  }
}
```


### Approach 2: NgRx (Redux Pattern)

**Enterprise-grade state management with Redux architecture:**

```typescript
// 1. Define State
export interface AppState {
  products: ProductState;
  cart: CartState;
  user: UserState;
}

export interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedProduct: Product | null;
}

// 2. Create Actions
import { createAction, props } from '@ngrx/store';

export const loadProducts = createAction('[Product List] Load Products');

export const loadProductsSuccess = createAction(
  '[Product API] Load Products Success',
  props<{ products: Product[] }>()
);

export const loadProductsFailure = createAction(
  '[Product API] Load Products Failure',
  props<{ error: string }>()
);

export const selectProduct = createAction(
  '[Product Detail] Select Product',
  props<{ productId: string }>()
);

// 3. Create Reducer
import { createReducer, on } from '@ngrx/store';

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  selectedProduct: null
};

export const productReducer = createReducer(
  initialState,
  on(loadProducts, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false
  })),
  on(loadProductsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  on(selectProduct, (state, { productId }) => ({
    ...state,
    selectedProduct: state.products.find(p => p.id === productId) || null
  }))
);
```


// 4. Create Effects (Side Effects)
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class ProductEffects {
  private actions$ = inject(Actions);
  private productService = inject(ProductService);
  
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadProducts),
      switchMap(() =>
        this.productService.getProducts().pipe(
          map(products => loadProductsSuccess({ products })),
          catchError(error => of(loadProductsFailure({ 
            error: error.message 
          })))
        )
      )
    )
  );
}

// 5. Create Selectors
import { createFeatureSelector, createSelector } from '@ngrx/store';

export const selectProductState = createFeatureSelector<ProductState>('products');

export const selectAllProducts = createSelector(
  selectProductState,
  state => state.products
);

export const selectProductsLoading = createSelector(
  selectProductState,
  state => state.loading
);

export const selectProductsError = createSelector(
  selectProductState,
  state => state.error
);

export const selectSelectedProduct = createSelector(
  selectProductState,
  state => state.selectedProduct
);

export const selectProductById = (productId: string) => createSelector(
  selectAllProducts,
  products => products.find(p => p.id === productId)
);
```


// 6. Use in Component
@Component({
  template: `
    @if (loading()) {
      <div>Loading...</div>
    }
    @if (error()) {
      <div class="error">{{ error() }}</div>
    }
    @for (product of products(); track product.id) {
      <div (click)="selectProduct(product.id)">
        {{ product.name }} - {{ product.price | currency }}
      </div>
    }
  `
})
export class ProductListComponent implements OnInit {
  private store = inject(Store);
  
  products = toSignal(this.store.select(selectAllProducts), { initialValue: [] });
  loading = toSignal(this.store.select(selectProductsLoading), { initialValue: false });
  error = toSignal(this.store.select(selectProductsError), { initialValue: null });
  
  ngOnInit() {
    this.store.dispatch(loadProducts());
  }
  
  selectProduct(productId: string) {
    this.store.dispatch(selectProduct({ productId }));
  }
}
```

### Approach 3: ComponentStore (NgRx)

**Local component state management:**

```typescript
import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tap, switchMap } from 'rxjs/operators';

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  loading: boolean;
}

@Injectable()
export class TodoStore extends ComponentStore<TodoState> {
  private todoService = inject(TodoService);
  
  constructor() {
    super({
      todos: [],
      filter: 'all',
      loading: false
    });
  }
  
  // Selectors
  readonly todos$ = this.select(state => state.todos);
  readonly filter$ = this.select(state => state.filter);
  readonly loading$ = this.select(state => state.loading);
  
  readonly filteredTodos$ = this.select(
    this.todos$,
    this.filter$,
    (todos, filter) => {
      switch (filter) {
        case 'active':
          return todos.filter(t => !t.completed);
        case 'completed':
          return todos.filter(t => t.completed);
        default:
          return todos;
      }
    }
  );
  
  // Updaters
  readonly setTodos = this.updater((state, todos: Todo[]) => ({
    ...state,
    todos
  }));
  
  readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading
  }));
  
  readonly setFilter = this.updater(
    (state, filter: 'all' | 'active' | 'completed') => ({
      ...state,
      filter
    })
  );
  
  readonly addTodo = this.updater((state, todo: Todo) => ({
    ...state,
    todos: [...state.todos, todo]
  }));
  
  // Effects
  readonly loadTodos = this.effect<void>(trigger$ =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      switchMap(() =>
        this.todoService.getTodos().pipe(
          tap({
            next: todos => {
              this.setTodos(todos);
              this.setLoading(false);
            },
            error: () => this.setLoading(false)
          })
        )
      )
    )
  );
}
```


// Usage in Component
@Component({
  template: `
    @if (loading()) {
      <div>Loading...</div>
    }
    @for (todo of filteredTodos(); track todo.id) {
      <div>{{ todo.title }}</div>
    }
  `,
  providers: [TodoStore]  // Component-level provider
})
export class TodoListComponent implements OnInit {
  private todoStore = inject(TodoStore);
  
  filteredTodos = toSignal(this.todoStore.filteredTodos$, { initialValue: [] });
  loading = toSignal(this.todoStore.loading$, { initialValue: false });
  
  ngOnInit() {
    this.todoStore.loadTodos();
  }
}
```

### Comparison: When to Use Each Approach

| Approach | Best For | Complexity | Learning Curve | Boilerplate |
|----------|----------|------------|----------------|-------------|
| Signals | Simple to medium apps, shared services | Low | Easy | Minimal |
| NgRx | Large enterprise apps, complex state | High | Steep | Significant |
| ComponentStore | Feature-specific state, isolated components | Medium | Moderate | Low |
| RxJS Services | Medium apps, reactive patterns | Medium | Moderate | Low |

**Use Signals when:**
- Building new Angular 16+ applications
- State is simple to moderate complexity
- Want minimal boilerplate
- Need fine-grained reactivity
- Team prefers simpler patterns

**Use NgRx when:**
- Building large enterprise applications
- Need time-travel debugging
- Want strict unidirectional data flow
- Have complex state interactions
- Need DevTools integration
- Team is experienced with Redux

**Use ComponentStore when:**
- State is scoped to a feature/component
- Don't need global state management
- Want NgRx patterns without full setup
- Building reusable components with state

### The Bottom Line

Modern Angular offers multiple state management approaches. Signals provide the simplest solution for most applications, NgRx excels in large enterprise scenarios, and ComponentStore bridges the gap for feature-specific state. Choose based on your application's complexity, team expertise, and specific requirements.

---

## Question 7: Explain Angular Testing strategies. How do you write effective unit tests, integration tests, and E2E tests?

**Answer:**

Testing is crucial for maintaining code quality and preventing regressions. Angular provides excellent testing tools and patterns for comprehensive test coverage.

### Testing Pyramid

```
        /\
       /E2E\      <- Few, slow, expensive (10%)
      /------\
     /Integration\ <- Some, moderate speed (20%)
    /------------\
   /  Unit Tests  \ <- Many, fast, cheap (70%)
  /----------------\
```

### Unit Testing with Jasmine and Karma

**Basic component test:**

```typescript
describe('CounterComponent', () => {
  let component: CounterComponent;
  let fixture: ComponentFixture<CounterComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should initialize count to 0', () => {
    expect(component.count()).toBe(0);
  });
  
  it('should increment count', () => {
    component.increment();
    expect(component.count()).toBe(1);
  });
  
  it('should display count in template', () => {
    component.count.set(5);
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.count')?.textContent).toContain('5');
  });
});
```


**Testing services with HTTP:**

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
  });
  
  it('should fetch users', () => {
    const mockUsers: User[] = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' }
    ];
    
    service.getUsers().subscribe(users => {
      expect(users.length).toBe(2);
      expect(users).toEqual(mockUsers);
    });
    
    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
  
  it('should handle errors', () => {
    service.getUsers().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });
    
    const req = httpMock.expectOne('/api/users');
    req.flush('Server error', { status: 500, statusText: 'Server Error' });
  });
});
```

**Testing with signals:**

```typescript
describe('TodoService with Signals', () => {
  let service: TodoService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TodoService]
    });
    service = TestBed.inject(TodoService);
  });
  
  it('should add todo', () => {
    service.addTodo('Test todo');
    
    expect(service.allTodos().length).toBe(1);
    expect(service.allTodos()[0].title).toBe('Test todo');
  });
  
  it('should compute filtered todos', () => {
    service.addTodo('Todo 1');
    service.addTodo('Todo 2');
    service.toggleTodo(service.allTodos()[0].id);
    
    service.setFilter('active');
    expect(service.filteredTodos().length).toBe(1);
    
    service.setFilter('completed');
    expect(service.filteredTodos().length).toBe(1);
  });
});
```

### Integration Testing

**Testing component interactions:**

```typescript
describe('ProductList Integration', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productService: jasmine.SpyObj<ProductService>;
  
  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ProductService', ['getProducts']);
    
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductService, useValue: spy }
      ]
    }).compileComponents();
    
    productService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });
  
  it('should load and display products', fakeAsync(() => {
    const mockProducts: Product[] = [
      { id: '1', name: 'Product 1', price: 100 },
      { id: '2', name: 'Product 2', price: 200 }
    ];
    
    productService.getProducts.and.returnValue(of(mockProducts));
    
    fixture.detectChanges();
    tick();
    
    const compiled = fixture.nativeElement;
    const productElements = compiled.querySelectorAll('.product');
    
    expect(productElements.length).toBe(2);
    expect(productElements[0].textContent).toContain('Product 1');
  }));
});
```

### Best Practices

1. **Test behavior, not implementation**
2. **Use meaningful test descriptions**
3. **Keep tests isolated and independent**
4. **Mock external dependencies**
5. **Test edge cases and error scenarios**
6. **Maintain high code coverage (>80%)**
7. **Run tests in CI/CD pipeline**

### The Bottom Line

Comprehensive testing ensures code quality and prevents regressions. Focus on unit tests for business logic, integration tests for component interactions, and E2E tests for critical user flows. Use Angular's testing utilities effectively and maintain high test coverage.

---

## Question 8: Explain Change Detection strategies in Angular. When should you use OnPush vs Default?

**Answer:**

Change detection is Angular's mechanism for synchronizing the component tree with the data model. Understanding it is crucial for building performant applications.

### Default Change Detection

**How it works:**

```typescript
@Component({
  selector: 'app-user',
  template: `
    <div>{{ user.name }}</div>
    <button (click)="updateName()">Update</button>
  `
})
export class UserComponent {
  user = { name: 'John', age: 30 };
  
  updateName() {
    this.user.name = 'Jane';  // Mutation
    // Angular detects change and updates view
  }
}
```

**When Angular runs change detection:**
- User events (click, input, etc.)
- HTTP requests complete
- Timers (setTimeout, setInterval)
- Any async operation

**Problem with Default:**
```typescript
// Every event triggers change detection on ENTIRE tree
Component Tree:
    App
   /   \
  A     B
 / \   / \
C   D E   F

// User clicks button in component F
// Angular checks: App → A → C → D → B → E → F
// Even though only F changed!
```


### OnPush Change Detection

**Optimized strategy:**

```typescript
@Component({
  selector: 'app-product',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>{{ product().name }}</div>
    <div>{{ product().price | currency }}</div>
  `
})
export class ProductComponent {
  product = input.required<Product>();
  
  // OnPush only checks when:
  // 1. Input reference changes
  // 2. Event originates from this component
  // 3. Async pipe emits new value
  // 4. Manually triggered (ChangeDetectorRef)
}
```

**Key rules for OnPush:**

```typescript
// ❌ BAD: Mutation doesn't trigger change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadComponent {
  items = [1, 2, 3];
  
  addItem() {
    this.items.push(4);  // Mutation - OnPush won't detect!
  }
}

// ✅ GOOD: Create new reference
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodComponent {
  items = signal([1, 2, 3]);
  
  addItem() {
    this.items.update(current => [...current, 4]);  // New array
  }
}
```

**Performance comparison:**

```typescript
// Default: 1000 components, 50ms per check
// Total: 50,000ms per user interaction

// OnPush: Only changed components checked
// Total: 50-500ms per user interaction
// 100x faster!
```

### Using Signals with OnPush

**Perfect combination:**

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>Count: {{ count() }}</div>
    <div>Double: {{ doubled() }}</div>
    <button (click)="increment()">+</button>
  `
})
export class OptimizedComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(v => v + 1);
    // Signals automatically trigger change detection
  }
}
```

### Manual Change Detection

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualComponent {
  private cdr = inject(ChangeDetectorRef);
  data: any;
  
  loadData() {
    // External data source (WebSocket, etc.)
    this.externalService.getData().subscribe(data => {
      this.data = data;
      this.cdr.markForCheck();  // Manually trigger check
    });
  }
  
  ngOnDestroy() {
    this.cdr.detach();  // Stop change detection
  }
}
```

### Best Practices

1. **Use OnPush by default** - Better performance
2. **Use signals** - Automatic change detection
3. **Avoid mutations** - Create new references
4. **Use async pipe** - Automatic subscription management
5. **Profile performance** - Use Angular DevTools

### The Bottom Line

OnPush change detection dramatically improves performance by reducing unnecessary checks. Combined with signals, it provides optimal reactivity with minimal overhead. Use OnPush by default and only fall back to Default when absolutely necessary.

---

## Question 9: Explain Content Projection and ng-content in Angular. How do you build reusable component APIs?

**Answer:**

Content projection allows you to create flexible, reusable components by passing content from parent to child components.

### Basic Content Projection

```typescript
// Child component
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {}

// Parent usage
@Component({
  template: `
    <app-card>
      <h2>Title</h2>
      <p>Content goes here</p>
    </app-card>
  `
})
export class ParentComponent {}
```

### Multi-slot Projection

```typescript
@Component({
  selector: 'app-dialog',
  template: `
    <div class="dialog">
      <div class="header">
        <ng-content select="[header]"></ng-content>
      </div>
      <div class="body">
        <ng-content select="[body]"></ng-content>
      </div>
      <div class="footer">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `
})
export class DialogComponent {}

// Usage
@Component({
  template: `
    <app-dialog>
      <div header>
        <h2>Confirm Action</h2>
      </div>
      <div body>
        <p>Are you sure?</p>
      </div>
      <div footer>
        <button>Cancel</button>
        <button>Confirm</button>
      </div>
    </app-dialog>
  `
})
```

### Conditional Projection

```typescript
@Component({
  selector: 'app-panel',
  template: `
    <div class="panel">
      @if (hasHeader) {
        <div class="header">
          <ng-content select="[header]"></ng-content>
        </div>
      }
      <div class="body">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class PanelComponent {
  @ContentChild('header') headerContent?: ElementRef;
  
  get hasHeader() {
    return !!this.headerContent;
  }
}
```

### Best Practices

1. **Use select attribute** - For multi-slot projection
2. **Provide default content** - Fallback when no content projected
3. **Document projection slots** - Clear API for consumers
4. **Use ContentChild/ContentChildren** - Access projected content
5. **Consider ng-template** - For advanced scenarios

### The Bottom Line

Content projection enables building flexible, reusable components. Use single-slot for simple cases, multi-slot for complex layouts, and ContentChild for accessing projected content programmatically.

---

## Question 10: Explain Custom Directives in Angular. How do you create attribute and structural directives?

**Answer:**

Directives extend HTML with custom behavior. Angular has three types: components, attribute directives, and structural directives.

### Attribute Directives

**Basic attribute directive:**

```typescript
@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective {
  private el = inject(ElementRef);
  
  @Input() appHighlight = 'yellow';
  
  @HostListener('mouseenter')
  onMouseEnter() {
    this.highlight(this.appHighlight);
  }
  
  @HostListener('mouseleave')
  onMouseLeave() {
    this.highlight('');
  }
  
  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }
}

// Usage
<p appHighlight="lightblue">Hover me!</p>
```


### Structural Directives

**Custom *ngIf alternative:**

```typescript
@Directive({
  selector: '[appUnless]',
  standalone: true
})
export class UnlessDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private hasView = false;
  
  @Input() set appUnless(condition: boolean) {
    if (!condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

// Usage
<div *appUnless="isLoggedIn">
  Please log in
</div>
```

**Advanced: Repeat directive:**

```typescript
@Directive({
  selector: '[appRepeat]',
  standalone: true
})
export class RepeatDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  
  @Input() set appRepeat(count: number) {
    this.viewContainer.clear();
    for (let i = 0; i < count; i++) {
      this.viewContainer.createEmbeddedView(this.templateRef, {
        $implicit: i,
        index: i
      });
    }
  }
}

// Usage
<div *appRepeat="3; let i = index">
  Item {{ i }}
</div>
```

### Best Practices

1. **Use HostListener/HostBinding** - Clean event handling
2. **Inject dependencies** - Use inject() function
3. **Make standalone** - Better tree-shaking
4. **Document inputs** - Clear API
5. **Handle cleanup** - Implement OnDestroy

### The Bottom Line

Custom directives extend HTML with reusable behavior. Attribute directives modify element appearance/behavior, while structural directives control DOM structure. Use them to encapsulate common patterns and keep templates clean.

---

## Question 11: Explain Angular Animations. How do you create smooth transitions and complex animation sequences?

**Answer:**

Angular's animation system provides powerful tools for creating smooth, performant animations using the Web Animations API.

### Basic Animation

```typescript
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-toggle',
  template: `
    <div [@openClose]="isOpen ? 'open' : 'closed'" class="box">
      Content
    </div>
    <button (click)="toggle()">Toggle</button>
  `,
  animations: [
    trigger('openClose', [
      state('open', style({
        height: '200px',
        opacity: 1,
        backgroundColor: 'yellow'
      })),
      state('closed', style({
        height: '100px',
        opacity: 0.8,
        backgroundColor: 'blue'
      })),
      transition('open => closed', [
        animate('0.5s')
      ]),
      transition('closed => open', [
        animate('0.3s')
      ])
    ])
  ]
})
export class ToggleComponent {
  isOpen = true;
  
  toggle() {
    this.isOpen = !this.isOpen;
  }
}
```

### Enter/Leave Animations

```typescript
@Component({
  template: `
    @for (item of items; track item.id) {
      <div @fadeIn>{{ item.name }}</div>
    }
  `,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
```

### Complex Sequences

```typescript
@Component({
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
```

### Best Practices

1. **Use transform and opacity** - GPU accelerated
2. **Avoid animating layout properties** - Causes reflow
3. **Keep animations short** - 200-400ms
4. **Provide reduced motion** - Accessibility
5. **Test performance** - Use Chrome DevTools

### The Bottom Line

Angular animations provide declarative, powerful animation capabilities. Use them for smooth transitions, enter/leave effects, and complex sequences while maintaining good performance and accessibility.

---

## Question 12: Explain Dynamic Components and ViewContainerRef. How do you create components programmatically?

**Answer:**

Dynamic components allow you to create and insert components at runtime, enabling flexible, dynamic UIs.

### Creating Dynamic Components

```typescript
@Component({
  selector: 'app-dynamic-host',
  template: `
    <div>
      <button (click)="loadComponent('alert')">Load Alert</button>
      <button (click)="loadComponent('confirm')">Load Confirm</button>
      <ng-container #dynamicContainer></ng-container>
    </div>
  `
})
export class DynamicHostComponent {
  @ViewChild('dynamicContainer', { read: ViewContainerRef }) 
  container!: ViewContainerRef;
  
  loadComponent(type: string) {
    this.container.clear();
    
    const componentRef = type === 'alert'
      ? this.container.createComponent(AlertComponent)
      : this.container.createComponent(ConfirmComponent);
    
    // Set inputs
    componentRef.setInput('message', 'Dynamic message');
    
    // Subscribe to outputs
    componentRef.instance.closed.subscribe(() => {
      componentRef.destroy();
    });
  }
}
```

### Modal Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class ModalService {
  private appRef = inject(ApplicationRef);
  private injector = inject(Injector);
  
  open<T>(component: Type<T>, config?: any): ComponentRef<T> {
    // Create component
    const componentRef = createComponent(component, {
      environmentInjector: this.appRef.injector,
      elementInjector: this.injector
    });
    
    // Attach to application
    this.appRef.attachView(componentRef.hostView);
    
    // Add to DOM
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);
    
    return componentRef;
  }
  
  close(componentRef: ComponentRef<any>) {
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }
}
```

### Best Practices

1. **Clean up components** - Call destroy()
2. **Manage memory** - Unsubscribe from outputs
3. **Use dependency injection** - Pass services
4. **Consider lazy loading** - For large components
5. **Test thoroughly** - Dynamic components are complex

### The Bottom Line

Dynamic components enable runtime component creation for modals, tooltips, and dynamic UIs. Use ViewContainerRef for template-based insertion and createComponent for programmatic creation.

---

## Question 13: Explain Angular CDK (Component Dev Kit). How do you use it for building custom components?

**Answer:**

Angular CDK provides behavior primitives for building UI components without prescribing visual design.

### Key CDK Modules

**1. Overlay - Floating panels:**

```typescript
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Injectable({ providedIn: 'root' })
export class TooltipService {
  private overlay = inject(Overlay);
  
  show(origin: HTMLElement, component: Type<any>): OverlayRef {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions([{
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top'
      }]);
    
    const overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });
    
    const portal = new ComponentPortal(component);
    overlayRef.attach(portal);
    
    return overlayRef;
  }
}
```

**2. Drag and Drop:**

```typescript
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  template: `
    <div cdkDropList (cdkDropListDropped)="drop($event)">
      @for (item of items; track item) {
        <div cdkDrag>{{ item }}</div>
      }
    </div>
  `
})
export class DragDropComponent {
  items = ['Item 1', 'Item 2', 'Item 3'];
  
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  }
}
```

**3. Virtual Scrolling:**

```typescript
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      @for (item of items; track item.id) {
        <div class="item">{{ item.name }}</div>
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 400px;
      width: 100%;
    }
    .item {
      height: 50px;
    }
  `]
})
export class VirtualScrollComponent {
  items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));
}
```

**4. Accessibility (A11y):**

```typescript
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

@Component({})
export class ModalComponent implements AfterViewInit, OnDestroy {
  private focusTrapFactory = inject(FocusTrapFactory);
  private focusTrap?: FocusTrap;
  
  @ViewChild('modalContent') modalContent!: ElementRef;
  
  ngAfterViewInit() {
    this.focusTrap = this.focusTrapFactory.create(
      this.modalContent.nativeElement
    );
    this.focusTrap.focusInitialElement();
  }
  
  ngOnDestroy() {
    this.focusTrap?.destroy();
  }
}
```

### Best Practices

1. **Use CDK for behavior** - Not styling
2. **Combine with custom styles** - Full control
3. **Leverage accessibility features** - Built-in a11y
4. **Test with real data** - Virtual scroll performance
5. **Follow CDK patterns** - Consistent APIs

### The Bottom Line

Angular CDK provides powerful behavior primitives for building custom components. Use it for overlays, drag-drop, virtual scrolling, and accessibility without being tied to specific visual designs.

---

## Question 14: Explain Internationalization (i18n) in Angular. How do you build multi-language applications?

**Answer:**

Internationalization (i18n) enables your application to support multiple languages and locales.

### Angular i18n Setup

**1. Mark translatable text:**

```typescript
@Component({
  template: `
    <h1 i18n="@@welcomeMessage">Welcome to our app</h1>
    <p i18n="User greeting|Greeting message@@userGreeting">
      Hello, {{ userName }}!
    </p>
    <button i18n>Submit</button>
  `
})
```

**2. Extract translations:**

```bash
ng extract-i18n --output-path src/locale
```

**3. Translate messages.xlf:**

```xml
<trans-unit id="welcomeMessage">
  <source>Welcome to our app</source>
  <target>Bienvenue dans notre application</target>
</trans-unit>
```

**4. Build for locale:**

```json
{
  "projects": {
    "app": {
      "i18n": {
        "sourceLocale": "en-US",
        "locales": {
          "fr": "src/locale/messages.fr.xlf",
          "es": "src/locale/messages.es.xlf"
        }
      }
    }
  }
}
```

### Runtime i18n with @angular/localize

```typescript
import { LOCALE_ID } from '@angular/core';

@Component({
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ]
})
```

### Third-party: Transloco

```typescript
// More flexible runtime solution
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  template: `
    <h1>{{ 'welcome' | transloco }}</h1>
    <p>{{ 'greeting' | transloco:{ name: userName } }}</p>
    <button (click)="changeLang('es')">Español</button>
  `,
  imports: [TranslocoModule]
})
export class AppComponent {
  private transloco = inject(TranslocoService);
  userName = 'John';
  
  changeLang(lang: string) {
    this.transloco.setActiveLang(lang);
  }
}
```

### Best Practices

1. **Use i18n attributes** - Clear translation context
2. **Provide descriptions** - Help translators
3. **Handle pluralization** - ICU message format
4. **Test all locales** - Verify translations
5. **Consider RTL languages** - Right-to-left support

### The Bottom Line

Angular provides built-in i18n support for compile-time translations and third-party libraries for runtime flexibility. Choose based on your requirements: compile-time for performance, runtime for flexibility.

---

## Question 15: Explain Progressive Web Apps (PWA) with Angular. How do you implement offline support and push notifications?

**Answer:**

PWAs combine the best of web and native apps, providing offline support, push notifications, and installability.

### Adding PWA Support

```bash
ng add @angular/pwa
```

**This creates:**
- `ngsw-config.json` - Service worker configuration
- `manifest.webmanifest` - App manifest
- Service worker registration

### Service Worker Configuration

```json
{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|gif|webp)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api",
      "urls": ["/api/**"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1h",
        "timeout": "10s",
        "strategy": "freshness"
      }
    }
  ]
}
```

### Offline Support

```typescript
import { SwUpdate } from '@angular/service-worker';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private swUpdate = inject(SwUpdate);
  
  constructor() {
    if (this.swUpdate.isEnabled) {
      // Check for updates every 6 hours
      interval(6 * 60 * 60 * 1000).subscribe(() => {
        this.swUpdate.checkForUpdate();
      });
      
      // Listen for available updates
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          if (confirm('New version available. Load it?')) {
            window.location.reload();
          }
        }
      });
    }
  }
}
```

### Push Notifications

```typescript
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private swPush = inject(SwPush);
  
  subscribeToNotifications() {
    if (!this.swPush.isEnabled) {
      console.log('Push notifications not available');
      return;
    }
    
    this.swPush.requestSubscription({
      serverPublicKey: environment.vapidPublicKey
    }).then(subscription => {
      // Send subscription to server
      this.sendToServer(subscription);
    }).catch(err => {
      console.error('Could not subscribe', err);
    });
  }
  
  listenForNotifications() {
    this.swPush.messages.subscribe(message => {
      console.log('Received push message', message);
    });
  }
  
  private sendToServer(subscription: PushSubscription) {
    // Send to your backend
  }
}
```

### App Manifest

```json
{
  "name": "My Angular PWA",
  "short_name": "PWA",
  "theme_color": "#1976d2",
  "background_color": "#fafafa",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Best Practices

1. **Test offline** - Use Chrome DevTools
2. **Handle updates gracefully** - Prompt users
3. **Cache strategically** - Balance freshness vs offline
4. **Provide install prompt** - Guide users
5. **Monitor service worker** - Track errors

### The Bottom Line

Angular PWA support enables offline functionality, push notifications, and app-like experiences. Use service workers for caching, SwUpdate for version management, and SwPush for notifications.

---

## Question 16: Explain Web Workers in Angular. How do you offload heavy computations to background threads?

**Answer:**

Web Workers enable running JavaScript in background threads, preventing UI blocking during heavy computations.

### Creating a Web Worker

```bash
ng generate web-worker app/workers/data-processor
```

**Worker file (data-processor.worker.ts):**

```typescript
/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const result = processData(data);
  postMessage(result);
});

function processData(data: any[]) {
  // Heavy computation
  return data.map(item => {
    // Complex calculations
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(item.value * i);
    }
    return { ...item, processed: result };
  });
}
```

**Using the worker:**

```typescript
@Component({})
export class DataComponent {
  processData(data: any[]) {
    if (typeof Worker !== 'undefined') {
      const worker = new Worker(
        new URL('./workers/data-processor.worker', import.meta.url)
      );
      
      worker.onmessage = ({ data }) => {
        console.log('Processed data:', data);
        this.displayResults(data);
        worker.terminate();
      };
      
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        worker.terminate();
      };
      
      worker.postMessage(data);
    } else {
      // Fallback for browsers without worker support
      const result = this.processDataSync(data);
      this.displayResults(result);
    }
  }
}
```

### Worker Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class WorkerService {
  private worker?: Worker;
  
  processInBackground<T, R>(
    workerUrl: string,
    data: T
  ): Observable<R> {
    return new Observable(observer => {
      this.worker = new Worker(new URL(workerUrl, import.meta.url));
      
      this.worker.onmessage = ({ data }) => {
        observer.next(data);
        observer.complete();
      };
      
      this.worker.onerror = (error) => {
        observer.error(error);
      };
      
      this.worker.postMessage(data);
      
      return () => {
        this.worker?.terminate();
      };
    });
  }
}
```

### Best Practices

1. **Use for CPU-intensive tasks** - Image processing, data parsing
2. **Don't access DOM** - Workers have no DOM access
3. **Terminate workers** - Free up resources
4. **Handle errors** - Workers can fail
5. **Provide fallbacks** - Not all browsers support workers

### The Bottom Line

Web Workers enable offloading heavy computations to background threads, keeping the UI responsive. Use them for CPU-intensive tasks while being mindful of their limitations and browser support.

---

## Question 17: Explain Angular Universal and SEO optimization. How do you ensure your Angular app is search engine friendly?

**Answer:**

Angular Universal enables server-side rendering, crucial for SEO and social media sharing.

### SEO Challenges with CSR

```typescript
// Client-side rendered app
// Search engine crawler sees:
<html>
  <body>
    <app-root></app-root>  <!-- Empty! -->
  </body>
</html>

// With SSR, crawler sees:
<html>
  <body>
    <app-root>
      <h1>Welcome to My Site</h1>
      <p>Fully rendered content...</p>
    </app-root>
  </body>
</html>
```

### Meta Tags Service

```typescript
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  
  updateMetaTags(config: {
    title: string;
    description: string;
    image?: string;
    url?: string;
  }) {
    // Update title
    this.title.setTitle(config.title);
    
    // Update meta tags
    this.meta.updateTag({ name: 'description', content: config.description });
    
    // Open Graph tags (Facebook, LinkedIn)
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    if (config.image) {
      this.meta.updateTag({ property: 'og:image', content: config.image });
    }
    if (config.url) {
      this.meta.updateTag({ property: 'og:url', content: config.url });
    }
    
    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    if (config.image) {
      this.meta.updateTag({ name: 'twitter:image', content: config.image });
    }
  }
}

// Usage in component
@Component({})
export class ProductDetailComponent implements OnInit {
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);
  
  ngOnInit() {
    const product = this.route.snapshot.data['product'];
    
    this.seo.updateMetaTags({
      title: `${product.name} - My Store`,
      description: product.description,
      image: product.imageUrl,
      url: `https://mystore.com/products/${product.id}`
    });
  }
}
```

### Structured Data (JSON-LD)

```typescript
@Injectable({ providedIn: 'root' })
export class StructuredDataService {
  private document = inject(DOCUMENT);
  
  addProductSchema(product: Product) {
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': product.name,
      'description': product.description,
      'image': product.imageUrl,
      'offers': {
        '@type': 'Offer',
        'price': product.price,
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock'
      }
    });
    
    this.document.head.appendChild(script);
  }
  
  addBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': crumb.name,
        'item': crumb.url
      }))
    });
    
    this.document.head.appendChild(script);
  }
}
```

### Sitemap Generation

```typescript
// sitemap.xml generation script
import { writeFileSync } from 'fs';

const routes = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/products', priority: 0.8, changefreq: 'daily' },
  { path: '/about', priority: 0.5, changefreq: 'monthly' }
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes.map(route => `
    <url>
      <loc>https://mysite.com${route.path}</loc>
      <priority>${route.priority}</priority>
      <changefreq>${route.changefreq}</changefreq>
    </url>
  `).join('')}
</urlset>`;

writeFileSync('dist/sitemap.xml', sitemap);
```

### robots.txt

```
User-agent: *
Allow: /
Sitemap: https://mysite.com/sitemap.xml

# Block admin routes
Disallow: /admin/
Disallow: /api/
```

### Best Practices

1. **Use SSR for public pages** - Critical for SEO
2. **Update meta tags per route** - Unique titles/descriptions
3. **Add structured data** - Help search engines understand content
4. **Generate sitemap** - Help crawlers discover pages
5. **Optimize images** - Use alt tags, lazy loading
6. **Monitor Core Web Vitals** - Performance affects SEO
7. **Test with tools** - Google Search Console, Lighthouse

### The Bottom Line

SEO in Angular requires SSR, proper meta tags, structured data, and performance optimization. Use Angular Universal for SSR, Meta service for tags, and structured data for rich search results.

---

## Question 18: Explain RxJS Advanced Patterns in Angular. How do you handle complex async scenarios?

**Answer:**

RxJS provides powerful operators for handling complex asynchronous scenarios in Angular applications.

### Advanced Operators

**1. switchMap - Cancel previous, switch to new:**

```typescript
@Component({})
export class SearchComponent {
  private searchService = inject(SearchService);
  
  searchControl = new FormControl('');
  
  results$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => 
      query ? this.searchService.search(query) : of([])
    )
  );
  // Previous search cancelled when new query arrives
}
```

**2. mergeMap - Run in parallel:**

```typescript
@Injectable({ providedIn: 'root' })
export class BatchService {
  private http = inject(HttpClient);
  
  processItems(items: string[]): Observable<Result[]> {
    return from(items).pipe(
      mergeMap(item => this.http.get<Result>(`/api/items/${item}`), 5),
      // Process 5 items concurrently
      toArray()
    );
  }
}
```

**3. concatMap - Sequential processing:**

```typescript
@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  
  processOrders(orders: Order[]): Observable<OrderResult[]> {
    return from(orders).pipe(
      concatMap(order => this.http.post<OrderResult>('/api/orders', order)),
      // Process one at a time, in order
      toArray()
    );
  }
}
```

**4. exhaustMap - Ignore new until current completes:**

```typescript
@Component({})
export class SaveComponent {
  private saveService = inject(SaveService);
  
  save$ = new Subject<void>();
  
  constructor() {
    this.save$.pipe(
      exhaustMap(() => this.saveService.save())
    ).subscribe();
    // Ignore save clicks while saving
  }
}
```

**5. combineLatest - Wait for all:**

```typescript
@Component({})
export class DashboardComponent {
  private userService = inject(UserService);
  private statsService = inject(StatsService);
  
  data$ = combineLatest([
    this.userService.getUser(),
    this.statsService.getStats()
  ]).pipe(
    map(([user, stats]) => ({ user, stats }))
  );
}
```

**6. forkJoin - Parallel requests, wait for all:**

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  
  loadAllData(): Observable<{
    users: User[];
    products: Product[];
    orders: Order[];
  }> {
    return forkJoin({
      users: this.http.get<User[]>('/api/users'),
      products: this.http.get<Product[]>('/api/products'),
      orders: this.http.get<Order[]>('/api/orders')
    });
  }
}
```

### Error Handling Patterns

**1. catchError with retry:**

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  
  getData<T>(url: string): Observable<T> {
    return this.http.get<T>(url).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          if (error.status >= 500) {
            return timer(1000 * retryCount);
          }
          return throwError(() => error);
        }
      }),
      catchError(error => {
        console.error('API Error:', error);
        return of(null as T);
      })
    );
  }
}
```

**2. Error recovery with fallback:**

```typescript
@Component({})
export class ProductComponent {
  private productService = inject(ProductService);
  
  product$ = this.productService.getProduct(this.productId).pipe(
    catchError(() => this.productService.getProductFromCache(this.productId)),
    catchError(() => of(this.getDefaultProduct()))
  );
}
```

### Memory Management

**1. takeUntilDestroyed:**

```typescript
@Component({})
export class AutoUnsubscribeComponent {
  private destroyRef = inject(DestroyRef);
  private dataService = inject(DataService);
  
  constructor() {
    this.dataService.getData().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => {
      console.log(data);
    });
    // Automatically unsubscribes on component destroy
  }
}
```

**2. shareReplay - Share and cache:**

```typescript
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);
  
  config$ = this.http.get<Config>('/api/config').pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  // Single HTTP request, shared among all subscribers
}
```

### Best Practices

1. **Choose right operator** - switchMap vs mergeMap vs concatMap
2. **Handle errors** - Always use catchError
3. **Unsubscribe** - Use takeUntilDestroyed or async pipe
4. **Share subscriptions** - Use shareReplay for expensive operations
5. **Avoid nested subscriptions** - Use higher-order operators
6. **Test observables** - Use marble testing

### The Bottom Line

RxJS provides powerful operators for complex async scenarios. Master switchMap, mergeMap, concatMap, and error handling patterns. Always manage subscriptions properly to prevent memory leaks.

---

## Question 19: Explain Memory Leaks and Performance Profiling in Angular. How do you identify and fix performance issues?

**Answer:**

Memory leaks and performance issues can severely impact user experience. Understanding how to identify and fix them is crucial.

### Common Memory Leak Sources

**1. Unsubscribed Observables:**

```typescript
// ❌ BAD: Memory leak
@Component({})
export class LeakyComponent implements OnInit {
  ngOnInit() {
    interval(1000).subscribe(val => {
      console.log(val);
    });
    // Subscription never cleaned up!
  }
}

// ✅ GOOD: Proper cleanup
@Component({})
export class CleanComponent {
  private destroyRef = inject(DestroyRef);
  
  ngOnInit() {
    interval(1000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(val => {
      console.log(val);
    });
  }
}
```

**2. Event Listeners:**

```typescript
// ❌ BAD: Listener not removed
@Component({})
export class LeakyListenerComponent implements OnInit {
  ngOnInit() {
    window.addEventListener('resize', this.onResize);
  }
  
  onResize() {
    console.log('Resized');
  }
}

// ✅ GOOD: Cleanup in ngOnDestroy
@Component({})
export class CleanListenerComponent implements OnInit, OnDestroy {
  private boundResize = this.onResize.bind(this);
  
  ngOnInit() {
    window.addEventListener('resize', this.boundResize);
  }
  
  ngOnDestroy() {
    window.removeEventListener('resize', this.boundResize);
  }
  
  onResize() {
    console.log('Resized');
  }
}
```

**3. Timers:**

```typescript
// ❌ BAD: Timer not cleared
@Component({})
export class LeakyTimerComponent implements OnInit {
  ngOnInit() {
    setInterval(() => {
      console.log('Tick');
    }, 1000);
  }
}

// ✅ GOOD: Clear timer
@Component({})
export class CleanTimerComponent implements OnInit, OnDestroy {
  private intervalId?: number;
  
  ngOnInit() {
    this.intervalId = window.setInterval(() => {
      console.log('Tick');
    }, 1000);
  }
  
  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
```

### Performance Profiling

**1. Chrome DevTools:**

```typescript
// Enable performance profiling
@Component({})
export class ProfiledComponent {
  @HostListener('click')
  onClick() {
    performance.mark('operation-start');
    
    // Heavy operation
    this.processData();
    
    performance.mark('operation-end');
    performance.measure(
      'operation',
      'operation-start',
      'operation-end'
    );
    
    const measure = performance.getEntriesByName('operation')[0];
    console.log(`Operation took ${measure.duration}ms`);
  }
}
```

**2. Angular DevTools:**

```typescript
// Use Angular DevTools to:
// - Profile component tree
// - Inspect change detection cycles
// - View component state
// - Analyze performance bottlenecks
```

**3. Lighthouse:**

```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse https://your-app.com --view
```

### Performance Optimization Techniques

**1. Virtual Scrolling:**

```typescript
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      @for (item of items; track item.id) {
        <div class="item">{{ item.name }}</div>
      }
    </cdk-virtual-scroll-viewport>
  `
})
export class OptimizedListComponent {
  items = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));
  // Only renders visible items!
}
```

**2. TrackBy Function:**

```typescript
@Component({
  template: `
    @for (item of items; track trackById($index, item)) {
      <div>{{ item.name }}</div>
    }
  `
})
export class TrackByComponent {
  items: Item[] = [];
  
  trackById(index: number, item: Item): number {
    return item.id;
  }
  // Prevents unnecessary re-renders
}
```

**3. Lazy Loading:**

```typescript
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module')
      .then(m => m.AdminModule)
  }
];
// Module loaded only when needed
```

**4. Image Optimization:**

```typescript
@Component({
  template: `
    <img 
      [ngSrc]="imageUrl"
      width="400"
      height="300"
      priority
      loading="lazy"
    />
  `
})
// Use NgOptimizedImage directive
```

### Monitoring Tools

**1. Custom Performance Service:**

```typescript
@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService {
  private metrics = new Map<string, number[]>();
  
  measure(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    console.log(`${name}: ${duration.toFixed(2)}ms`);
  }
  
  getAverageTime(name: string): number {
    const times = this.metrics.get(name) || [];
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}
```

**2. Memory Monitoring:**

```typescript
@Injectable({ providedIn: 'root' })
export class MemoryMonitorService {
  checkMemory() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log({
        usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      });
    }
  }
}
```

### Best Practices

1. **Always unsubscribe** - Use takeUntilDestroyed or async pipe
2. **Use OnPush** - Reduce change detection cycles
3. **Implement trackBy** - For large lists
4. **Lazy load modules** - Reduce initial bundle size
5. **Profile regularly** - Use Chrome DevTools and Angular DevTools
6. **Monitor in production** - Use real user monitoring (RUM)
7. **Optimize images** - Use NgOptimizedImage
8. **Virtual scroll** - For large lists

### The Bottom Line

Memory leaks and performance issues require proactive monitoring and optimization. Use proper cleanup patterns, profile regularly, and implement performance best practices. Tools like Chrome DevTools and Angular DevTools are essential for identifying and fixing issues.

---

## Question 20: Explain Angular CLI and Build Optimization. How do you optimize bundle size and build performance?

**Answer:**

Angular CLI provides powerful build optimization features crucial for production applications.

### Build Configurations

**angular.json optimization settings:**

```json
{
  "projects": {
    "app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "optimization": true,
              "outputHashing": "all",
              "sourceMap": false,
              "namedChunks": false,
              "aot": true,
              "extractLicenses": true,
              "buildOptimizer": true,
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
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

### Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev webpack-bundle-analyzer

# Build with stats
ng build --stats-json

# Analyze bundle
npx webpack-bundle-analyzer dist/stats.json
```

### Code Splitting Strategies

**1. Lazy Loading:**

```typescript
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes')
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  }
];
```

**2. Preloading Strategy:**

```typescript
import { PreloadAllModules, RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules
    })
  ]
})
export class AppModule {}

// Custom preloading strategy
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return route.data?.['preload'] ? load() : of(null);
  }
}

const routes: Routes = [
  {
    path: 'important',
    loadChildren: () => import('./important/important.routes'),
    data: { preload: true }
  }
];
```

### Tree Shaking

```typescript
// ❌ BAD: Imports entire library
import * as _ from 'lodash';
_.debounce(fn, 300);

// ✅ GOOD: Import only what you need
import { debounce } from 'lodash-es';
debounce(fn, 300);

// ✅ BETTER: Use native alternatives
const debounce = (fn: Function, delay: number) => {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
};
```

### Differential Loading

```json
{
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Firefox versions",
    "last 2 Safari versions",
    "last 2 Edge versions"
  ]
}
```

**Generates two bundles:**
- Modern (ES2020+) - Smaller, for modern browsers
- Legacy (ES5) - Larger, for older browsers

### Build Performance

**1. Incremental Builds:**

```bash
# Development with incremental compilation
ng serve --hmr

# Production build with caching
ng build --configuration production
```

**2. Parallel Builds:**

```json
{
  "cli": {
    "cache": {
      "enabled": true,
      "path": ".angular/cache"
    }
  }
}
```

### Runtime Optimization

**1. Service Worker Caching:**

```json
{
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/*.css",
          "/*.js"
        ]
      }
    }
  ]
}
```

**2. CDN Configuration:**

```typescript
// Use CDN for static assets
export const environment = {
  production: true,
  cdnUrl: 'https://cdn.example.com',
  apiUrl: 'https://api.example.com'
};

// In component
@Component({
  template: `
    <img [src]="cdnUrl + '/images/logo.png'" />
  `
})
export class AppComponent {
  cdnUrl = environment.cdnUrl;
}
```

### Monitoring Bundle Size

**Budget enforcement:**

```json
{
  "budgets": [
    {
      "type": "bundle",
      "name": "main",
      "baseline": "500kb",
      "maximumWarning": "1mb",
      "maximumError": "2mb"
    },
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    }
  ]
}
```

### Production Checklist

1. ✅ Enable AOT compilation
2. ✅ Enable build optimizer
3. ✅ Enable tree shaking
4. ✅ Lazy load routes
5. ✅ Use OnPush change detection
6. ✅ Optimize images
7. ✅ Enable service worker
8. ✅ Configure budgets
9. ✅ Analyze bundle size
10. ✅ Test on real devices

### Build Commands

```bash
# Development build
ng build

# Production build
ng build --configuration production

# Production build with stats
ng build --configuration production --stats-json

# Serve production build locally
npx http-server dist/app/browser -p 8080

# Analyze bundle
npx webpack-bundle-analyzer dist/app/stats.json
```

### Best Practices

1. **Monitor bundle size** - Set and enforce budgets
2. **Lazy load everything possible** - Reduce initial load
3. **Use standalone components** - Better tree shaking
4. **Optimize dependencies** - Remove unused packages
5. **Enable caching** - Service workers and HTTP caching
6. **Use CDN** - For static assets
7. **Compress assets** - Gzip/Brotli compression
8. **Profile regularly** - Lighthouse and bundle analyzer

### The Bottom Line

Angular CLI provides comprehensive build optimization tools. Use lazy loading, tree shaking, differential loading, and bundle analysis to minimize bundle size. Monitor with budgets and optimize continuously for best performance.

---

## Summary

This document covers 20 advanced Angular interview questions for principal/lead engineer positions:

1. Server-Side Rendering (SSR) and Hydration
2. HTTP Interceptors and Error Handling
3. Reactive Forms and Validation
4. Security (XSS, CSRF, Sanitization)
5. Route Guards and Navigation
6. State Management (NgRx, Signals, ComponentStore)
7. Testing Strategies
8. Change Detection (OnPush vs Default)
9. Content Projection and ng-content
10. Custom Directives
11. Angular Animations
12. Dynamic Components and ViewContainerRef
13. Angular CDK
14. Internationalization (i18n)
15. Progressive Web Apps (PWA)
16. Web Workers
17. Angular Universal and SEO
18. RxJS Advanced Patterns
19. Memory Leaks and Performance Profiling
20. Angular CLI and Build Optimization

Each question provides comprehensive coverage with real-world examples, best practices, and practical implementations suitable for experienced Angular developers.

