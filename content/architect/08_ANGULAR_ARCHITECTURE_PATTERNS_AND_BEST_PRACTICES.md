# 08 — Angular Architecture Patterns & Best Practices

## Comprehensive Architect-Level Guide

> **Scope**: Standalone Components, Dependency Injection Deep Dive, HTTP Interceptors,
> Error Handling Architecture, Enterprise Patterns, and Modern Angular Features (Signals, Control Flow, inject()).

> **Who is this for?** If you know basic JavaScript/TypeScript and have used Angular a little, this guide will take you from "I've built a few components" to "I understand how large Angular apps are designed." Every concept is explained in plain English first, then backed up with code. If you have 2-3 years of experience and are preparing for a senior or architect-level Angular interview, this document is written specifically for you.

> **How to use this guide:** Each section starts with a plain-English explanation, followed by diagrams, then code with line-by-line comments. Look for 🔑 for key concepts, ⚠️ for common mistakes, 💡 for interview tips, and 📝 for summaries. "Key Takeaway" blockquotes highlight the most important ideas. "Common Interview Follow-up" notes tell you what interviewers typically ask next.

---

## Table of Contents

1. [Standalone Components](#1-standalone-components)
2. [Dependency Injection Deep Dive](#2-dependency-injection-deep-dive)
3. [HTTP Interceptors](#3-http-interceptors)
4. [Error Handling Architecture](#4-error-handling-architecture)
5. [Enterprise Architecture Patterns](#5-enterprise-architecture-patterns)
6. [Modern Angular Features](#6-modern-angular-features)
7. [Quick Summary](#7-quick-summary)

---

## 1. Standalone Components

🔑 **Simple Explanation:**
Think of the old Angular like a school where every student (component) MUST belong to a classroom (NgModule). Even if a student only needed a pencil, they had to join a classroom that owned that pencil. Standalone components are like giving each student their own backpack — they carry exactly what they need, no classroom required. This makes things lighter, simpler, and you don't drag around stuff you don't use.

In practical terms, before Angular 14, if you wanted to use `*ngIf` in a component, that component had to be declared inside an NgModule that imported `CommonModule`. If you had 50 components, they all lived in one or more modules, and those modules pulled in everything they declared — even if half the components were never used on a given page. Standalone components flip this: each component says "here's exactly what I need" and nothing more.

### 1.1 How Standalone Components Change Architecture

Before Angular 14, every component had to belong to an `NgModule`. Standalone components
remove that requirement entirely — a component declares its own dependencies inline.

**What is an NgModule?** It's a container that groups related components, pipes, and directives together. Think of it like a shipping box — you had to put your components in a box before Angular could use them. The box (module) had to declare what was inside it, import other boxes it depended on, and export things other boxes might need.

**What is a standalone component?** A component that says "I don't need a box. I'll list my own dependencies right here." It's self-contained. It can still use everything a module-based component can — services, pipes, directives, other components — but it declares those dependencies directly in its own `@Component` decorator.

**What this diagram shows:** The diagram below compares the old NgModule architecture (top) with the new standalone architecture (bottom). Notice how in the NgModule world, components are grouped into modules with shared dependencies, while in the standalone world, each component is independent and imports only what it needs.

```
┌─────────────────────────────────────────────────────────┐
│                  NgModule World (Legacy)                 │
│                                                         │
│  AppModule ──declares──▶ [CompA, CompB, CompC]          │
│           ──imports───▶ [SharedModule, HttpModule]       │
│           ──providers─▶ [ServiceA, ServiceB]            │
│                                                         │
│  SharedModule ──declares──▶ [PipeX, DirectiveY]         │
│              ──exports───▶ [PipeX, DirectiveY]          │
│                                                         │
│  Problem: Tight coupling, barrel-file bloat,            │
│           hard to tree-shake unused declarations         │
└─────────────────────────────────────────────────────────┘

                        ▼ Migration ▼

┌─────────────────────────────────────────────────────────┐
│              Standalone World (Angular 14+)              │
│                                                         │
│  CompA (standalone: true)                               │
│    imports: [CommonModule, CompB, PipeX]                 │
│                                                         │
│  CompB (standalone: true)                               │
│    imports: [RouterModule]                               │
│                                                         │
│  Benefit: Each component is self-contained,             │
│           fine-grained tree-shaking, no NgModule tax     │
└─────────────────────────────────────────────────────────┘
```

**What is tree-shaking?** When you build your app for production, the bundler (like Webpack or esbuild) removes code that nobody uses. With NgModules, if you imported a SharedModule with 20 components but only used 2, all 20 got bundled because the module declared all of them. With standalone, only the 2 you actually import get included. The bundler can see exactly which components are referenced and drop the rest.

**Real-world analogy:** NgModules are like buying a cable TV package — you get 200 channels but only watch 10. Standalone components are like streaming — you only download the show you're watching right now.

⚠️ **Common Mistake:** People think standalone components can't use services or modules. They absolutely can — you just list what you need in the `imports` array directly on the component instead of on a module. Standalone components can import other standalone components, standalone pipes, standalone directives, and even traditional NgModules.

> **Key Takeaway:** Standalone components are the future of Angular. They reduce boilerplate, improve tree-shaking, and make lazy loading more granular. New Angular projects (Angular 17+) use standalone by default. If you're in an interview, always mention standalone as the modern approach.

**Common Interview Follow-up:** "Can standalone components and NgModule-based components coexist?" Yes! Angular supports incremental migration. A standalone component can be imported into an NgModule, and an NgModule can be imported into a standalone component. You don't have to migrate everything at once.

### 1.2 Anatomy of a Standalone Component

**What this code does:** This is a complete standalone component that displays a user profile card. It imports everything it needs directly — Angular Material for the card UI, RouterLink for navigation, CommonModule for built-in directives, and a custom pipe for date formatting. The key line is `standalone: true`, which tells Angular this component manages its own dependencies. The `imports` array replaces what used to be the NgModule's `imports` and `declarations` arrays combined.

```typescript
// user-profile.component.ts

// Step 1: Import Angular building blocks we need.
// Component is the decorator that turns a class into an Angular component.
// Input is a decorator that marks a property as receivable from a parent component.
import { Component, Input } from '@angular/core';

// CommonModule gives us built-in directives like *ngIf, *ngFor,
// and built-in pipes like 'date', 'uppercase', 'currency', etc.
// Without importing this, you can't use *ngIf in your template.
import { CommonModule } from '@angular/common';

// RouterLink is a directive that lets us create clickable links
// that navigate within the Angular app WITHOUT a full page reload.
// It uses the Angular Router under the hood.
import { RouterLink } from '@angular/router';

// Angular Material UI components — these provide pre-built, styled UI elements.
// MatCardModule gives us <mat-card>, <mat-card-title>, etc.
import { MatCardModule } from '@angular/material/card';
// MatButtonModule gives us the mat-button directive for styled buttons.
import { MatButtonModule } from '@angular/material/button';

// A custom pipe we wrote that converts a Date object to a human-readable
// relative time string like "3 hours ago" or "2 days ago".
import { TimeAgoPipe } from '../pipes/time-ago.pipe';

@Component({
  // selector: the HTML tag name other components use to render this component.
  // Usage in a parent template: <app-user-profile [user]="someUser" />
  selector: 'app-user-profile',

  // standalone: true — THIS is the magic flag that makes this a standalone component.
  // It tells Angular: "Don't look for an NgModule that declares this component.
  // This component is self-sufficient and manages its own dependencies."
  standalone: true,

  // imports: the component lists its OWN dependencies here.
  // This replaces the NgModule's declarations + imports arrays.
  // Only list what THIS component's template actually uses.
  imports: [
    CommonModule,    // For built-in directives like *ngIf, *ngFor, and pipes like 'date'
    RouterLink,      // For [routerLink] directive in the template
    MatCardModule,   // For <mat-card>, <mat-card-title>, <mat-card-content>, <mat-card-actions>
    MatButtonModule, // For the mat-button directive on the <a> tag
    TimeAgoPipe,     // Our custom "time ago" pipe (this pipe is also standalone)
  ],

  // template: the HTML that this component renders.
  // Angular compiles this template and connects it to the component class below.
  template: `
    <!-- mat-card creates a Material Design card UI with elevation and padding -->
    <mat-card>
      <!-- Display the user's name as the card title (large, bold text) -->
      <mat-card-title>{{ user.name }}</mat-card-title>

      <mat-card-content>
        <!-- The | (pipe) operator transforms data before displaying it.
             Here, timeAgo converts a Date like "2024-01-15T10:30:00Z"
             into a human-readable string like "3 hours ago". -->
        <p>Joined {{ user.createdAt | timeAgo }}</p>
      </mat-card-content>

      <mat-card-actions>
        <!-- [routerLink] creates a client-side navigation link.
             ['/users', user.id] builds a URL like "/users/abc123".
             mat-button applies Material Design button styling.
             This navigates WITHOUT a full page reload (SPA behavior). -->
        <a mat-button [routerLink]="['/users', user.id]">View Profile</a>
      </mat-card-actions>
    </mat-card>
  `,
})
export class UserProfileComponent {
  // @Input() marks this property as an input binding.
  // The PARENT component passes data into this component like:
  //   <app-user-profile [user]="selectedUser" />
  //
  // { required: true } (Angular 16+) means Angular will throw a compile-time error
  // if the parent forgets to pass this input. Without it, the input would silently be undefined.
  //
  // The ! (definite assignment assertion) tells TypeScript: "Trust me, this will be set
  // before it's used" — because Angular guarantees required inputs are provided.
  @Input({ required: true }) user!: {
    id: string;        // Unique identifier for the user (e.g., UUID)
    name: string;      // Display name shown in the card title
    createdAt: Date;   // When the user signed up — fed to the timeAgo pipe
  };
}
```

💡 **Why This Matters:** Interviewers ask about standalone components to see if you understand modern Angular. They want to hear that standalone components reduce boilerplate (no NgModule needed), improve tree-shaking (only imported dependencies are bundled), and make lazy loading more granular (you can lazy-load a single component instead of an entire module). Mention that `standalone: true` + `imports` replaces the old NgModule `declarations` + `imports` pattern.

> **Key Takeaway:** The `standalone: true` flag plus the `imports` array is the complete replacement for NgModules at the component level. Each component becomes a self-contained unit that explicitly declares what it needs. This is the default in Angular 17+ projects.

**Common Interview Follow-up:** "What happens if you forget to add CommonModule to the imports?" Angular will throw a template compilation error saying it doesn't recognize `*ngIf` or `*ngFor`. The error message is usually clear about which directive or pipe is missing.

### 1.3 Bootstrapping Without NgModules

🔑 **Simple Explanation:**
"Bootstrapping" means starting up your Angular app. It's like turning the ignition key in a car — it's the very first thing that happens when your app loads in the browser. In the old world, you needed an `AppModule` class decorated with `@NgModule` to start. Now, with standalone components, you just point Angular at your root component and a configuration object. It's a simpler ignition — fewer moving parts, same result.

The two files below (`main.ts` and `app.config.ts`) are the only files you need to bootstrap a modern Angular app. `main.ts` is the entry point (the file the bundler starts with), and `app.config.ts` holds all your app-wide settings like routing, HTTP configuration, and interceptors.

**What this code does:** `main.ts` calls `bootstrapApplication()` which initializes Angular, creates the root component, and renders it in the browser. The `appConfig` object passed as the second argument provides all the app-wide services and configuration that used to live in `AppModule`.

```typescript
// main.ts — This is the ENTRY POINT of your Angular app (the ignition key).
// The bundler (Webpack/esbuild) starts here and follows all imports to build the app.

// bootstrapApplication is the standalone replacement for platformBrowserDynamic().bootstrapModule().
// It takes a component (not a module) as the first argument.
import { bootstrapApplication } from '@angular/platform-browser';

// AppComponent is your root (top-level) component — the one that contains <router-outlet>
// and serves as the shell for your entire application.
import { AppComponent } from './app/app.component';

// appConfig contains all your app-wide providers (services, interceptors, router config, etc.).
// This replaces the providers/imports arrays that used to live in @NgModule({ ... }).
import { appConfig } from './app/app.config';

// bootstrapApplication() starts Angular with:
//   1. The root component to render (AppComponent)
//   2. A config object with all providers (services, interceptors, router, etc.)
// It returns a Promise that resolves when the app is ready.
// The .catch() handles any startup errors (e.g., missing providers, template errors).
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));  // If startup fails, log the error to the console
```

**What this code does:** `app.config.ts` is the centralized configuration file for your entire application. It replaces the `@NgModule` decorator's `imports` and `providers` arrays. Every app-wide service, interceptor, and feature is registered here using `provide*()` functions. These functions are tree-shakable — if you remove one, the associated code is excluded from the bundle.

```typescript
// app.config.ts — This is where ALL app-wide configuration lives.
// Think of it as the "settings panel" for your entire application.
// Everything that used to go in AppModule's @NgModule({ providers: [...] }) goes here.

// ApplicationConfig is the TypeScript interface for the config object.
// provideZoneChangeDetection configures how Angular detects changes (Zone.js-based).
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

// provideRouter sets up the Angular Router.
// withComponentInputBinding is a feature that auto-binds route params to @Input() properties.
import { provideRouter, withComponentInputBinding } from '@angular/router';

// provideHttpClient sets up Angular's HttpClient for making API calls.
// withInterceptors registers functional interceptors (middleware for HTTP requests).
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// provideAnimationsAsync enables Angular animations but loads the animation code lazily
// (async), which reduces the initial bundle size.
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Your route definitions — an array of { path, component/loadComponent } objects.
import { routes } from './app.routes';

// Custom interceptor functions that run on every HTTP request/response.
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

// ApplicationConfig is just an object with a `providers` array.
// Each provider is registered using a provide*() function.
export const appConfig: ApplicationConfig = {
  providers: [
    // provideZoneChangeDetection: Tells Angular to use Zone.js for change detection.
    // eventCoalescing: true — batches multiple browser events (e.g., rapid clicks)
    // into a single change detection cycle. This improves performance because
    // Angular doesn't re-render the UI for every single event.
    provideZoneChangeDetection({ eventCoalescing: true }),

    // provideRouter: Sets up the Angular Router with your route definitions.
    // withComponentInputBinding() is a powerful feature (Angular 16+) that automatically
    // binds route parameters, query parameters, and route data to @Input() properties
    // on the routed component. Without it, you'd need to inject ActivatedRoute manually.
    provideRouter(routes, withComponentInputBinding()),

    // provideHttpClient: Sets up Angular's HttpClient service for making API calls.
    // Without this, injecting HttpClient anywhere will throw a "No provider" error.
    // withInterceptors() registers functional interceptors — they run in ORDER on every
    // HTTP request (auth first, then error handling).
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),

    // provideAnimationsAsync: Enables Angular animations (for things like route transitions,
    // dialog open/close, etc.) but loads the animation engine lazily. This means the
    // animation code isn't included in the initial bundle — it's loaded on demand.
    provideAnimationsAsync(),
  ],
};
```

⚠️ **Common Mistake:** Forgetting to add `provideHttpClient()` in the config. Without it, injecting `HttpClient` anywhere in your app will throw a runtime "NullInjectorError: No provider for HttpClient!" error. In the old NgModule world, you'd import `HttpClientModule` — now you use `provideHttpClient()`. Similarly, forgetting `provideRouter()` means `<router-outlet>` won't work.

> **Key Takeaway:** The `bootstrapApplication()` + `ApplicationConfig` pattern is the modern replacement for `@NgModule`. All app-wide configuration lives in one clean config object. The `provide*()` functions are tree-shakable, meaning unused features don't bloat your bundle.

**Common Interview Follow-up:** "What's the difference between `provideAnimations()` and `provideAnimationsAsync()`?" The async version lazy-loads the animation engine, reducing the initial bundle size. Use `provideAnimationsAsync()` unless you need animations to be available immediately on first render (rare).

### 1.4 Lazy Loading with loadComponent / loadChildren

🔑 **Simple Explanation:**
Imagine a restaurant menu with 100 pages. You don't print all 100 pages when someone walks in — you hand them the page they need. Lazy loading works the same way: instead of loading your entire app upfront (which could be megabytes of JavaScript), Angular only loads the code for the page the user navigates to. The rest is downloaded on demand.

There are two lazy loading functions:
- `loadComponent`: loads a **single component** lazily. Used when a route maps to one component.
- `loadChildren`: loads a **group of child routes** lazily. Used when a route has sub-routes (like an admin section with users, settings, etc.).

Both use JavaScript's dynamic `import()` syntax, which tells the bundler to create a separate file (called a "chunk") for that code. The chunk is only downloaded when the user navigates to that route.

**Real-world analogy:** Think of a large office building. The lobby (your main bundle) is always available. But each floor (feature module) has its own elevator that only activates when someone presses that floor's button. You don't power all 50 floors when the building opens — you power each floor on demand.

**What this code does:** The route configuration below defines which URL maps to which component, and uses `loadComponent` and `loadChildren` to lazy-load them. Route guards (`canActivate`) protect certain routes, and route-scoped `providers` create services that only exist within a specific route's subtree.

```typescript
// app.routes.ts — Defines which URL shows which component.
// This is the "routing table" of your application.
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',                                          // The home page (root URL "/")
    // loadComponent uses a dynamic import() to lazy-load the HomeComponent.
    // The bundler sees this import() and creates a separate JS file for HomeComponent.
    // That file is only downloaded when the user visits "/".
    loadComponent: () =>
      import('./home/home.component')                  // Dynamic import — creates a separate chunk
        .then(m => m.HomeComponent),                   // .then() extracts the component class from the module
  },
  {
    path: 'dashboard',                                 // URL: "/dashboard"
    // Another lazy-loaded component — its code is in a separate chunk.
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),

    // canActivate is a route guard — it runs BEFORE the component loads.
    // If it returns false (or a UrlTree for redirect), the navigation is blocked.
    // Here we use a functional guard with inject() to check authentication.
    // inject(AuthService) grabs the AuthService from DI.
    // .isAuthenticated() returns true if the user is logged in, false otherwise.
    canActivate: [() => inject(AuthService).isAuthenticated()],
  },
  {
    path: 'admin',                                     // URL: "/admin"
    // loadChildren loads a GROUP of child routes from a separate file.
    // This is used when a feature has multiple sub-pages (users, settings, etc.).
    // The entire admin section (all its routes and components) is in one lazy chunk.
    loadChildren: () =>
      import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'reports',                                   // URL: "/reports"
    // Another loadChildren — the reports feature has its own route file.
    loadChildren: () =>
      import('./reports/reports.routes').then(m => m.REPORT_ROUTES),

    // providers: ROUTE-SCOPED providers.
    // These services are ONLY available to components within this route and its children.
    // They create a "mini injector" for this route subtree.
    // When the user navigates away from /reports, these service instances can be
    // garbage collected (freed from memory).
    // This is great for feature-specific services that shouldn't pollute the global scope.
    providers: [
      ReportService,                                   // A service specific to the reports feature
      { provide: REPORT_CONFIG, useValue: { pageSize: 50 } },  // Configuration for reports
    ],
  },
];
```

**What this code does:** This is the child route file for the admin section. It's only loaded when someone navigates to "/admin". It defines a layout component with nested child routes, each of which is also lazy-loaded. This creates a multi-level lazy loading strategy where the admin shell loads first, then individual admin pages load on demand.

```typescript
// admin/admin.routes.ts — Child route file for the admin section.
// This entire file is lazy-loaded only when someone navigates to "/admin".
// It won't be in the initial bundle at all.
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',                                          // "/admin" (the base admin page)
    // Lazy load the admin layout shell — this is the "frame" that contains
    // a sidebar, header, and a <router-outlet> for child pages.
    loadComponent: () =>
      import('./admin-layout.component').then(m => m.AdminLayoutComponent),

    // children: nested routes that render INSIDE the AdminLayoutComponent's <router-outlet>.
    // Each child is ALSO lazy loaded, so navigating from /admin/users to /admin/settings
    // only downloads the settings component code at that point.
    children: [
      {
        path: 'users',                                 // "/admin/users"
        loadComponent: () =>                           // Lazy load the user list page
          import('./users/user-list.component').then(m => m.UserListComponent),
      },
      {
        path: 'settings',                              // "/admin/settings"
        loadComponent: () =>                           // Lazy load the settings page
          import('./settings/settings.component').then(m => m.SettingsComponent),
      },
    ],
  },
];
```

💡 **Why This Matters:** Interviewers love lazy loading questions because it directly impacts user experience. They want to hear you explain that lazy loading reduces the initial bundle size (faster first load), and that standalone components enable component-level lazy loading (more granular than the old module-level chunks). In the NgModule world, the smallest lazy-loadable unit was an entire module. With standalone, it's a single component.

> **Key Takeaway:** Use `loadComponent` for single-component routes and `loadChildren` for feature areas with multiple sub-routes. Route-scoped `providers` create isolated service instances that are garbage-collected when the user navigates away. This is a powerful memory management and encapsulation tool.

**Common Interview Follow-up:** "How do you preload lazy routes?" Angular provides `PreloadAllModules` strategy (loads all lazy routes in the background after the initial load) and you can write custom preloading strategies that preload based on user behavior or route priority.

### 1.5 Tree-Shaking Benefits — NgModule vs Standalone

**What is tree-shaking?** It's the build tool's ability to remove unused code from your production bundle. Think of shaking a tree — only the dead leaves fall off, and the living branches stay. The bundler (Webpack, esbuild, Rollup) "shakes" your code and drops anything that's not actually referenced by any import chain. The result is a smaller JavaScript file that downloads faster.

**Why does this matter for architecture?** In the NgModule world, declaring a component in a module meant it was always included in the bundle — even if no template ever used it. With standalone components, the bundler can trace exactly which components are imported where, and drop anything unused. This can reduce bundle sizes by 15-30% in large applications.

| Aspect                  | NgModule Approach              | Standalone Approach              |
|-------------------------|--------------------------------|----------------------------------|
| Unused component        | Bundled if declared in module  | Tree-shaken if not imported      |
| Shared module overhead  | Entire module pulled in        | Only used exports included       |
| Lazy loading granularity| Module-level chunks            | Component-level chunks           |
| Provider scope          | Module injector                | Route-level or component-level   |
| Bundle size (typical)   | 15-30% larger                  | Baseline                         |
| Build time              | Slower (module compilation)    | Faster (fewer compilation units) |

> **Key Takeaway:** Standalone components are inherently more tree-shakable because the bundler can see exactly which components are used where. NgModules create "opaque bundles" where the bundler can't easily determine which declarations are actually needed.

### 1.6 Migration Strategy from NgModules

🔑 **Simple Explanation:**
You don't have to rewrite your entire app to use standalone components. Angular supports incremental migration — you can convert one component at a time. The key insight is that standalone components and NgModule-based components can coexist in the same application. A standalone component can be imported into an NgModule, and an NgModule can be imported into a standalone component.

**What this code does:** This shows the three-step migration process. First, you add `standalone: true` to a component and give it its own `imports`. Then, in the NgModule that used to declare it, you move it from `declarations` to `imports`. Finally, once all consumers are standalone, you remove the NgModule entirely.

```typescript
// Step 1: Mark component as standalone, keep it declared in module temporarily.
// This lets you migrate gradually — the component works in BOTH worlds.
// It can be used by other standalone components (via their imports array)
// AND by NgModule-based components (via the module's imports array).
@Component({
  standalone: true,                          // ← Now it's standalone
  imports: [CommonModule, FormsModule],      // ← It declares its own dependencies
  // ... selector, template, etc.
})
export class MyComponent {}

// Step 2: In the NgModule, move from declarations to imports.
// Standalone components are "importable" just like modules.
// This is the key compatibility bridge — the NgModule treats the standalone
// component as if it were a mini-module.
@NgModule({
  // declarations: [MyComponent],   // ← REMOVE from declarations (it's standalone now)
  imports: [MyComponent],           // ← ADD to imports (standalone components go here)
  exports: [MyComponent],           // ← Keep exporting so other modules can still use it
})
export class SharedModule {}

// Step 3: Eventually remove the NgModule wrapper entirely.
// Once ALL consumers of MyComponent are themselves standalone,
// you don't need SharedModule at all.
// Other standalone components just import MyComponent directly:
//   @Component({ imports: [MyComponent], ... })
```

> **CLI Automation**: `ng generate @angular/core:standalone` automates the migration.
> It scans your project, identifies components that can be converted, and updates
> both the component decorators and the NgModules that reference them.

⚠️ **Common Mistake:** Trying to migrate everything at once. The beauty of standalone is that it's backward-compatible. You can migrate one component at a time. A standalone component can live inside an NgModule, and an NgModule component can import a standalone component. Start with leaf components (those that don't have children) and work your way up.

📝 **Section 1 Summary:**
- Standalone components are self-contained — they list their own dependencies via `imports` instead of relying on NgModules
- They enable component-level lazy loading and better tree-shaking, resulting in smaller bundles
- `bootstrapApplication()` + `ApplicationConfig` replaces `AppModule` for app startup
- Migration is incremental: you can convert one component at a time without breaking anything
- `loadComponent` lazy-loads single components; `loadChildren` lazy-loads route groups

---

## 2. Dependency Injection Deep Dive

🔑 **Simple Explanation:**
Imagine you're building a house. Instead of each room manufacturing its own lightbulbs, plumbing, and wiring, there's a central supply system that delivers what each room needs. That's Dependency Injection (DI). Your components don't create their own services — they just say "I need an AuthService" and Angular's DI system delivers one.

Why is this better than just doing `new AuthService()` inside your component? Three reasons:
1. **Testability:** In tests, you can swap in a fake (mock) AuthService that doesn't make real API calls.
2. **Flexibility:** You can swap implementations without touching the component. Want to switch from REST to GraphQL? Change the service, not the 50 components that use it.
3. **Singleton management:** DI ensures there's only one instance of a service when you want a singleton (like auth state), and separate instances when you want isolation (like form state per wizard).

**Real-world analogy:** DI is like a restaurant kitchen. The waiter (component) doesn't cook the food — they just place an order (declare a dependency). The kitchen (injector) prepares and delivers the dish (service instance). If you want to change the recipe, you change the kitchen, not every waiter.

### 2.1 Hierarchical Injector Tree

Angular's DI system is a tree of injectors that mirrors the component tree, with
additional platform and environment-level injectors above it. Understanding this tree is critical for controlling where services live and how many instances exist.

**What is an injector?** It's a container that knows how to create and deliver service instances. Think of it like a vending machine — you ask for something by name (the token), and it gives you the right instance. Each injector has a set of "recipes" (providers) that tell it how to create services.

**Why is it hierarchical (tree-shaped)?** Because Angular has injectors at different levels — app-wide, route-level, and component-level. When a component asks for a service, Angular looks in the nearest injector first, then walks up the tree until it finds a provider. It's like asking your local store first, then the city warehouse, then the national distributor. The first one that has what you need wins.

**What this diagram shows:** The diagram below shows the four levels of Angular's injector hierarchy, from the outermost (Platform) to the innermost (Child Element). The resolution order at the bottom shows how Angular searches for a provider — starting at the component level and walking up. If no injector has the provider, Angular reaches the NULL_INJECTOR and throws an error.

```
┌──────────────────────────────────────────────────────────────────┐
│                     PLATFORM INJECTOR                            │
│  Created by: platformBrowserDynamic()                            │
│  Scope: Shared across multiple Angular apps on the same page     │
│  Providers: Platform-level services (DOCUMENT, etc.)             │
│  (Think: the building's main utility connection)                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    ROOT INJECTOR                           │  │
│  │  Created by: bootstrapApplication() or AppModule           │  │
│  │  Scope: Singleton for the entire application               │  │
│  │  Providers: providedIn: 'root', app-level providers        │  │
│  │  (Think: the building's shared services — one per building)│  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │              MODULE INJECTOR (Legacy)                │  │  │
│  │  │  Created by: Lazy-loaded NgModules                   │  │  │
│  │  │  Scope: All components within that module            │  │  │
│  │  │  Note: Route providers replace this in standalone    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │           ELEMENT INJECTOR (per Component)           │  │  │
│  │  │  Created by: Component's `providers` array           │  │  │
│  │  │  Scope: Component + its children (unless viewProv.)  │  │  │
│  │  │  (Think: each apartment's own fuse box)              │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌────────────────────────────────────────────────┐  │  │  │
│  │  │  │        CHILD ELEMENT INJECTOR                  │  │  │  │
│  │  │  │  Inherits from parent element injector         │  │  │  │
│  │  │  │  Can override parent providers                 │  │  │  │
│  │  │  └────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

Resolution Order (bottom → up):
  Element Injector → Parent Element → ... → Root → Platform → NULL_INJECTOR (throws)
```

⚠️ **Common Mistake:** Assuming every service is a singleton. A service is only a singleton if it's `providedIn: 'root'` (registered at the root injector level). If you put a service in a component's `providers` array, each instance of that component gets its OWN copy of the service. This is by design — it's how you create per-component state.

> **Key Takeaway:** Angular's DI is hierarchical. Services are resolved by walking UP the injector tree from the requesting component to the root. The level where you register a service determines its scope (singleton vs. per-component vs. per-route). Understanding this hierarchy is essential for managing service lifetimes and avoiding unintended shared state.

**Common Interview Follow-up:** "What happens if two lazy-loaded routes both provide the same service?" Each route gets its own instance. The services are isolated because each lazy route creates its own injector. This is actually a feature — it prevents state leakage between features.

### 2.2 Resolution Modifiers

**What are resolution modifiers?** They're decorators that tell Angular WHERE and HOW to look when searching for a service. By default, Angular searches from the current component's injector upward through the tree until it finds a match. Resolution modifiers let you change that default behavior — you can restrict the search, skip levels, or make it optional.

Think of it like searching for a book in a library system. By default, you check your local branch, then the city library, then the state library. But modifiers let you say things like "only check my local branch" (`@Self`), "skip my local branch and start at the city level" (`@SkipSelf`), "if nobody has it, that's fine" (`@Optional`), or "don't look beyond this building" (`@Host`).

**What this diagram shows:** A quick reference table of the four DI resolution modifiers and what each one does.

```
┌─────────────────────────────────────────────────────────────┐
│                  DI Resolution Modifiers                     │
├──────────────┬──────────────────────────────────────────────┤
│ @Optional()  │ Returns null instead of throwing if not found│
│ @Self()      │ Only look in the current element injector    │
│ @SkipSelf()  │ Skip current injector, start from parent    │
│ @Host()      │ Stop at the host component's injector        │
└──────────────┴──────────────────────────────────────────────┘
```

**What this code does:** The code below demonstrates each resolution modifier with a real-world use case. Each example shows when and why you'd use that modifier, with analogies to help you remember. The final example shows how to combine modifiers for precise control.

```typescript
// Import the decorators we need from Angular core.
// Component and Directive are for creating components/directives.
// The rest are DI resolution modifiers.
import {
  Component, Inject, Optional, Self, SkipSelf, Host
} from '@angular/core';

// ─── @Optional: Graceful fallback when provider is missing ───
// Real-world analogy: "I'd like analytics tracking, but if it's not available, that's fine."
// Use case: Optional features like analytics, logging, or A/B testing that shouldn't
// crash the app if they're not configured.
@Component({ /* ... */ })
export class NotificationComponent {
  constructor(
    // @Optional() tells Angular: "If AnalyticsService isn't registered anywhere
    // in the injector tree, just give me null instead of crashing with a
    // NullInjectorError."
    // The ? after the parameter name makes it optional in TypeScript too,
    // so the type is AnalyticsService | undefined.
    @Optional() private analytics?: AnalyticsService
  ) {}

  notify(message: string): void {
    // The ?. (optional chaining operator) safely calls track() only if analytics exists.
    // If analytics is null/undefined (because no provider was registered),
    // this line does nothing instead of throwing a TypeError.
    this.analytics?.track('notification', message);
  }
}

// ─── @Self: Enforce local provider only ───
// Real-world analogy: "I MUST use my own copy, not one inherited from a parent."
// Use case: When a component needs to guarantee it's using its OWN instance of a service,
// not one that was accidentally inherited from a parent component.
@Component({
  // This component creates its OWN LoggerService instance in its element injector.
  providers: [LoggerService],
})
export class AuditComponent {
  constructor(
    // @Self() tells Angular: "Only look in THIS component's element injector.
    // Don't walk up the tree to parent components or the root injector.
    // If LoggerService isn't provided RIGHT HERE, throw an error."
    // This guarantees we're using our local instance, not a parent's.
    // This is important for audit logging where you need a dedicated logger
    // that's isolated from the rest of the app.
    @Self() private logger: LoggerService
  ) {}
}

// ─── @SkipSelf: Use parent's instance, not own ───
// Real-world analogy: "I have my own counter, but I want to read my PARENT's counter."
// Use case: A component that provides a service for its children but needs to access
// the PARENT's version of that same service for itself. Common in nested tree structures.
@Component({
  // This component creates a NEW CounterService for its children to use.
  providers: [CounterService],
})
export class ParentComponent {
  constructor(
    // @SkipSelf() tells Angular: "Skip MY element injector and start looking
    // from my PARENT's injector upward."
    // Why? Because this component provides CounterService for its children,
    // but it wants to use the PARENT's CounterService for itself.
    // Without @SkipSelf(), it would get its own newly created instance,
    // which defeats the purpose of reading the parent's state.
    @SkipSelf() private parentCounter: CounterService
  ) {}
}

// ─── @Host: Stop resolution at host boundary ───
// Real-world analogy: "Only look within the component that hosts me, don't go higher."
// Use case: Directives that need to find their host component but shouldn't accidentally
// find a matching provider from a grandparent component.
@Directive({ selector: '[appTooltip]' })
export class TooltipDirective {
  constructor(
    // @Host() tells Angular: "Look for PanelComponent only up to the HOST component
    // (the component whose template this directive is used in).
    // Don't search beyond that boundary."
    // This is mainly used in directives that need to find their immediate parent
    // component but shouldn't accidentally match a distant ancestor.
    @Host() private panel: PanelComponent
  ) {}
}

// ─── Combined modifiers — Stack multiple for precise control ───
// You can combine modifiers to create very specific resolution rules.
@Component({ /* ... */ })
export class FlexibleComponent {
  constructor(
    // @Optional() + @SkipSelf() together means:
    // "Look for ConfigService starting from my PARENT (skip myself),
    //  and if nobody in the entire ancestor chain has it,
    //  just give me null (don't crash)."
    // This is a common pattern for components that can optionally inherit
    // configuration from a parent but also work independently.
    @Optional() @SkipSelf() private parentConfig?: ConfigService
  ) {}
}
```

💡 **Why This Matters:** Interviewers ask about DI modifiers to test your understanding of Angular's injector hierarchy. They want to hear that you know how to control service resolution — especially `@Optional()` for graceful degradation and `@SkipSelf()` for parent-child service patterns. This comes up in real-world scenarios like Angular's own `ControlValueAccessor` where form controls use `@Self()` to find their own `NgControl`, and `@SkipSelf()` to find the parent `FormGroup`.

> **Key Takeaway:** Resolution modifiers give you fine-grained control over WHERE Angular looks for a service. `@Optional()` prevents crashes when a service might not exist. `@Self()` enforces local-only resolution. `@SkipSelf()` skips the current injector. `@Host()` limits the search to the host component boundary. You can combine them for precise control.

**Common Interview Follow-up:** "Give a real-world example of `@SkipSelf()`." Angular's own `NgForm` directive uses `@Optional() @SkipSelf()` to find a parent `FormGroupDirective`. This allows nested forms to find their parent form group while gracefully handling the case where there is no parent.

### 2.3 providedIn Strategies

🔑 **Simple Explanation:**
`providedIn` tells Angular WHERE a service should live and how many copies should exist. Think of it like choosing between a city library (one copy for everyone), a neighborhood library (one per neighborhood), or a personal bookshelf (one per person). The choice depends on whether you want shared state (singleton) or isolated state (per-component).

The most common options are:
- `providedIn: 'root'` — one instance for the entire app (singleton). Best for auth, HTTP wrappers, global state.
- `providedIn: 'platform'` — shared across multiple Angular apps on the same page. Rare, used in micro-frontends.
- Component `providers: [...]` — one instance per component. Best for per-component state like form wizards.
- Component `viewProviders: [...]` — like `providers` but invisible to projected content (`<ng-content>`).

**What this code does:** The code below demonstrates each `providedIn` strategy with real-world examples. Each example explains when to use that strategy and what happens if you choose the wrong one.

```typescript
// ─── providedIn: 'root' — Application singleton (tree-shakable) ───
// Like a city library: ONE instance shared by the entire app.
// "tree-shakable" means if nobody injects this service anywhere in the app,
// the bundler will completely remove it from the production build.
// This is the most common and recommended strategy for most services.
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Because this is 'root', there's only ONE AuthService in the entire app.
  // Every component that injects AuthService gets the SAME instance.
  // This is perfect for auth because you want ONE source of truth for "who is logged in."
  // If two components both inject AuthService, they see the same currentUser.
  private currentUser = signal<User | null>(null);  // signal holds reactive state

  // When login() is called, it updates the shared currentUser signal.
  // Every component reading this signal will automatically re-render.
  login(credentials: Credentials): Observable<User> {
    return this.http.post<User>('/api/auth/login', credentials).pipe(
      tap(user => this.currentUser.set(user))  // Update the shared user state
    );
  }
}

// ─── providedIn: 'platform' — Shared across multiple Angular apps ───
// Like a national library: shared between MULTIPLE Angular apps on the same page.
// This is rare — only used in micro-frontend architectures where multiple
// Angular apps run on the same HTML page and need to share state.
// Example: a header app and a content app that share analytics tracking.
@Injectable({ providedIn: 'platform' })
export class SharedAnalyticsService {
  // If you have two Angular apps on one page (e.g., micro-frontends),
  // they both share this SAME instance. This ensures analytics events
  // from both apps go through the same pipeline.
}

// ─── Component-level providers — New instance per component ───
// Like a personal bookshelf: each component gets its OWN copy.
// Use this when each component instance needs its own isolated state.
@Component({
  selector: 'app-form-wizard',
  // Each <app-form-wizard> on the page gets its OWN FormStateService instance.
  // This is critical because each wizard tracks its own form state independently.
  // If this were providedIn: 'root', all wizards would share the same state — a bug!
  providers: [FormStateService],
  template: `...`,
})
export class FormWizardComponent {
  // If you have 3 form wizards on screen, there are 3 separate FormStateService instances.
  // Wizard A's state is completely isolated from Wizard B's state.
  constructor(private formState: FormStateService) {}
}

// ─── viewProviders — Visible to component but NOT to content children ───
// Like a private bookshelf: your own template can see it, but stuff projected
// into your component via <ng-content> CANNOT.
// This is an encapsulation tool for component library authors.
@Component({
  selector: 'app-tabs',
  // viewProviders makes TabGroupService available to this component's OWN template
  // (the view), but NOT to any content projected via <ng-content>.
  // This prevents external components from accidentally depending on internal services.
  viewProviders: [TabGroupService],
  template: `
    <div class="tab-header">...</div>
    <!-- Content projected here via ng-content CANNOT inject TabGroupService.
         This is intentional — TabGroupService is an internal implementation detail
         of the tabs component, not a public API. -->
    <ng-content></ng-content>
  `,
})
export class TabsComponent {}
```

⚠️ **Common Mistake:** Using `providedIn: 'root'` for everything. If a service holds state that should be unique per feature (like form state for a wizard), making it root-level means all wizards share the same state — which is a bug. Use component-level `providers` for per-instance state. Conversely, don't use component-level `providers` for stateless utility services — you'd create unnecessary duplicate instances.

> **Key Takeaway:** Choose your `providedIn` strategy based on the service's lifecycle needs. `'root'` for app-wide singletons, component `providers` for per-instance state, route `providers` for feature-scoped services. Getting this wrong leads to either shared-state bugs (too broad) or unnecessary memory usage (too narrow).

### 2.4 providers vs viewProviders

**What's the difference?** Both make a service available to a component. The difference is about WHO can see it:
- `providers`: visible to the component's own template AND to any content projected via `<ng-content>`
- `viewProviders`: visible ONLY to the component's own template (the "view"), NOT to projected content

**Why does this matter?** It's an encapsulation tool. If you're building a reusable component library (like Angular Material), `viewProviders` lets you keep internal services truly private. External consumers who project content into your component can't accidentally depend on your internal services.

**Real-world analogy:** `providers` is like a company cafeteria that's open to employees AND visitors. `viewProviders` is like an employee-only break room — visitors (projected content) can't access it.

**What this diagram shows:** The diagram below illustrates which services are visible to view children (components in the template) vs. content children (components projected via `<ng-content>`).

```
┌─────────────────────────────────────────────────────────┐
│  <app-parent>                                           │
│    providers: [ServiceA]       ← public service         │
│    viewProviders: [ServiceB]   ← private/internal       │
│                                                         │
│    ┌─────────────────────────────────────────────────┐  │
│    │  View Children (defined in the template)        │  │
│    │  Can inject: ServiceA ✅  ServiceB ✅            │  │
│    │  (These are "employees" — full access)          │  │
│    └─────────────────────────────────────────────────┘  │
│                                                         │
│    ┌─────────────────────────────────────────────────┐  │
│    │  Content Children (projected via <ng-content>)  │  │
│    │  Can inject: ServiceA ✅  ServiceB ❌            │  │
│    │  (These are "visitors" — limited access)        │  │
│    └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Common Interview Follow-up:** "When would you use `viewProviders` in practice?" When building a component library. For example, Angular Material's `MatSelect` uses `viewProviders` to provide internal services that its dropdown options need, without exposing those services to content projected into the select.

### 2.5 Multi-Providers and InjectionToken

🔑 **Simple Explanation:**
Normal DI gives you ONE thing per token (like one value per key in a dictionary). But sometimes you want to collect MULTIPLE things under one key — like a plugin system where multiple validators all register under the same token. That's what `multi: true` does. When you inject that token, you get an array of ALL registered values instead of just one.

And `InjectionToken` solves a different problem: DI normally uses class names as keys. But what if you want to inject a plain object (like a configuration), a string, or a number? You can't use a string as a class. `InjectionToken` creates a unique key for non-class values.

**Real-world analogy for multi-providers:** Think of a suggestion box at work. Multiple people can drop suggestions in (each provider adds to the collection), and when you open the box, you get ALL of them as a list. Without `multi: true`, each new suggestion would replace the previous one — you'd only see the last one.

**Real-world analogy for InjectionToken:** Think of a locker system. Classes are like people — they have names and can identify themselves. But a configuration object is like a package — it needs a locker number (token) to be stored and retrieved. `InjectionToken` creates that locker number.

**What this code does:** The code below demonstrates three patterns: (1) creating an `InjectionToken` for a configuration object with default values, (2) using `multi: true` to collect multiple validators under one token, and (3) using a factory function to create a service with complex initialization logic.

```typescript
import { InjectionToken, Provider } from '@angular/core';

// ─── InjectionToken for non-class values ───
// Problem: DI normally uses class names as keys (tokens). But what if you want to inject
// a plain object (like config) or a string? You can't use a string as a class.
// Solution: InjectionToken creates a unique, typed key for non-class values.

// First, define the TypeScript interface for your configuration.
// This gives you type safety when accessing config properties.
export interface AppConfig {
  apiUrl: string;                              // Base URL for API calls (e.g., "https://api.example.com")
  featureFlags: Record<string, boolean>;       // Feature toggles — key-value pairs like { "darkMode": true }
  maxRetries: number;                          // How many times to retry failed HTTP requests
}

// Create a unique token named 'app.config' that holds an AppConfig object.
// The generic <AppConfig> ensures type safety — when you inject this token,
// TypeScript knows the value is of type AppConfig.
export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',                          // Available app-wide as a singleton
  // factory: provides default values if nobody overrides this token.
  // This is called lazily — only when someone first injects APP_CONFIG.
  factory: () => ({
    apiUrl: 'https://api.example.com',         // Default API URL
    featureFlags: {},                           // No feature flags by default
    maxRetries: 3,                             // Retry failed requests 3 times by default
  }),
});

// Usage — inject the config just like any service, but using the token instead of a class.
@Component({ /* ... */ })
export class ApiComponent {
  // inject(APP_CONFIG) retrieves the config object from DI.
  // TypeScript knows this is AppConfig because of the generic on InjectionToken<AppConfig>.
  private config = inject(APP_CONFIG);

  getBaseUrl(): string {
    return this.config.apiUrl;                 // Access config properties with full type safety
  }
}

// ─── Multi-providers — Collect multiple values under one token ───
// Think of it like a suggestion box: multiple people can drop suggestions in,
// and when you open the box, you get ALL of them as an array.

// Create tokens for collections. The generic type is an array because
// multi-providers always resolve to an array.
export const HTTP_INTERCEPTORS_TOKEN =
  new InjectionToken<HttpInterceptorFn[]>('http-interceptors');

export const VALIDATORS =
  new InjectionToken<Validator[]>('form-validators');

// Each provider with multi: true ADDS to the array instead of replacing.
// Without multi: true, each new provider would OVERWRITE the previous one.
export const validatorProviders: Provider[] = [
  { provide: VALIDATORS, useClass: RequiredValidator, multi: true },  // Adds RequiredValidator to the array
  { provide: VALIDATORS, useClass: EmailValidator, multi: true },     // Adds EmailValidator to the array
  { provide: VALIDATORS, useClass: MinLengthValidator, multi: true }, // Adds MinLengthValidator to the array
  // Result: injecting VALIDATORS gives you [RequiredValidator, EmailValidator, MinLengthValidator]
];

// When you inject VALIDATORS, you get an array of ALL three validators.
@Component({
  providers: [validatorProviders],  // Register all three validators in this component's injector
})
export class FormComponent {
  // This is Validator[] — an array containing instances of all three validator classes.
  private validators = inject(VALIDATORS);

  validate(value: string): ValidationError[] {
    // Run ALL validators against the value and collect any errors.
    return this.validators
      .map(v => v.validate(value))                                    // Run each validator, get result
      .filter((err): err is ValidationError => err !== null);         // Keep only non-null errors
    // The type guard (err): err is ValidationError narrows the type from
    // (ValidationError | null)[] to ValidationError[]
  }
}

// ─── Factory providers with dependencies ───
// Sometimes creating a service requires complex logic or multiple dependencies.
// A factory function lets you write that initialization logic explicitly.
// This is useful when a service needs configuration from multiple sources.
export const API_CLIENT = new InjectionToken<ApiClient>('api-client', {
  providedIn: 'root',
  factory: () => {
    // inject() inside a factory function grabs other services from DI.
    // This is the modern way to declare dependencies (instead of constructor injection).
    const http = inject(HttpClient);       // For making HTTP calls
    const config = inject(APP_CONFIG);     // For the API base URL and other config
    const auth = inject(AuthService);      // For authentication tokens

    // Create and return the ApiClient with all its dependencies wired up.
    // The factory pattern gives you full control over how the service is constructed.
    return new ApiClient(http, config.apiUrl, auth);
  },
});
```

⚠️ **Common Mistake:** Forgetting `multi: true` when you want to collect multiple providers. Without it, each new provider REPLACES the previous one instead of adding to the array. You'll end up with only the last validator (MinLengthValidator) instead of all three. This is a subtle bug that's hard to debug because there's no error — you just silently lose providers.

> **Key Takeaway:** `InjectionToken` is how you inject non-class values (configs, feature flags, primitive values) into Angular's DI system. `multi: true` turns a single-value token into a collection, enabling plugin architectures where multiple providers contribute to the same token. Factory providers give you full control over complex service initialization.

**Common Interview Follow-up:** "How does Angular's own HTTP_INTERCEPTORS token work?" It uses `multi: true` internally. Each interceptor you register adds to the array, and Angular's HttpClient iterates through all of them in order. This is the same pattern shown above with validators.

### 2.6 DI Resolution Comparison Table

This table is a quick reference for choosing the right DI strategy. The "Tree-Shakable" column is important for bundle size — tree-shakable services are removed from the bundle if nobody uses them.

| Strategy               | Scope              | Tree-Shakable | Use Case                              |
|------------------------|--------------------|---------------|---------------------------------------|
| `providedIn: 'root'`  | App singleton      | ✅ Yes        | Stateful services, auth, HTTP wrappers|
| `providedIn: 'platform'`| Cross-app shared | ✅ Yes        | Micro-frontend shared services        |
| `providers: []`        | Component instance | ❌ No         | Per-component state, form services    |
| `viewProviders: []`    | View only          | ❌ No         | Internal component services           |
| Route `providers`      | Route subtree      | ❌ No         | Feature-scoped services               |
| `useFactory`           | Depends on scope   | ❌ No         | Complex initialization logic          |
| `multi: true`          | Depends on scope   | ❌ No         | Plugin systems, validators, hooks     |

**Why is tree-shakable important?** If a service is tree-shakable and nobody injects it, it's completely removed from your production bundle — zero bytes. `providedIn: 'root'` services are tree-shakable because Angular can statically analyze at build time whether they're used. Services in `providers` arrays are always included because Angular can't determine at build time whether they'll be needed (they might be injected dynamically).

**How to choose:** Start with `providedIn: 'root'` for most services. Use component `providers` when you need per-instance state. Use route `providers` when you need feature-scoped services that are cleaned up when the user navigates away. Use `viewProviders` when building reusable component libraries that need to hide internal services.

📝 **Section 2 Summary:**
- Angular's DI is hierarchical — services are resolved by walking up the injector tree from component to root
- Use `providedIn: 'root'` for app-wide singletons, component `providers` for per-instance state, and route `providers` for feature-scoped services
- Resolution modifiers (`@Optional`, `@Self`, `@SkipSelf`, `@Host`) control where Angular looks for providers
- `InjectionToken` lets you inject non-class values (configs, flags), and `multi: true` collects multiple providers into an array
- `viewProviders` hides services from projected content — useful for component library encapsulation

---

## 3. HTTP Interceptors

🔑 **Simple Explanation:**
Interceptors are like security checkpoints at an airport. Every HTTP request your app makes passes through a chain of interceptors on the way out (like going through security before boarding), and every response passes through them on the way back (like going through customs when you land). Each interceptor can inspect, modify, or even block the request/response.

**Why do we need interceptors?** Without them, you'd have to add authentication headers, error handling, loading spinners, and retry logic to EVERY single HTTP call in your app. That's hundreds of duplicated lines. Interceptors let you write that logic ONCE and apply it to ALL requests automatically.

**Common uses for interceptors:**
- **Auth interceptor:** Adds the JWT token to every request's `Authorization` header
- **Loading interceptor:** Shows/hides a loading spinner when requests are in flight
- **Retry interceptor:** Automatically retries failed requests with exponential backoff
- **Cache interceptor:** Returns cached responses for repeated GET requests
- **Error interceptor:** Catches HTTP errors and shows user-friendly error messages
- **Logging interceptor:** Logs request/response details for debugging

### 3.1 Interceptor Chain Architecture

**What this diagram shows:** HTTP requests flow through interceptors top-to-bottom (like a pipeline), and responses flow back bottom-to-top. The ORDER of interceptors matters — auth should be first (so the token is added before anything else), and error handling should be last in the array (so it's the outermost wrapper and catches errors from all other interceptors).

```
┌──────────────────────────────────────────────────────────────────────┐
│                    HTTP INTERCEPTOR CHAIN                             │
│                                                                      │
│  Component                                                           │
│     │                                                                │
│     ▼                                                                │
│  HttpClient.get('/api/data')                                         │
│     │                                                                │
│     ▼                                                                │
│  ┌──────────────────┐   Outgoing Request (top → bottom)              │
│  │ Auth Interceptor  │──▶ Adds Authorization header                  │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│  ┌──────────────────┐                                                │
│  │ Cache Interceptor │──▶ Returns cached response or passes through  │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│  ┌──────────────────┐                                                │
│  │ Loading Indicator │──▶ Shows spinner, increments counter          │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│  ┌──────────────────┐                                                │
│  │ Retry Interceptor │──▶ Retries on transient failures              │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│  ┌──────────────────┐                                                │
│  │ Error Interceptor │──▶ Classifies and handles errors              │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│       HTTP Backend (XHR / Fetch)                                     │
│           │                                                          │
│           ▼                                                          │
│       Server Response                                                │
│           │                                                          │
│  ┌──────────────────┐   Incoming Response (bottom → top)             │
│  │ Error Interceptor │──▶ Catches HttpErrorResponse                  │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│  ┌──────────────────┐                                                │
│  │ Retry Interceptor │──▶ Retries if needed                          │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│  ┌──────────────────┐                                                │
│  │ Loading Indicator │──▶ Hides spinner, decrements counter          │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│  ┌──────────────────┐                                                │
│  │ Cache Interceptor │──▶ Stores response in cache                   │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│  ┌──────────────────┐                                                │
│  │ Auth Interceptor  │──▶ (pass-through on response)                 │
│  └────────┬─────────┘                                                │
│           ▼                                                          │
│       Component receives data                                        │
└──────────────────────────────────────────────────────────────────────┘

⚠️  ORDER MATTERS: Interceptors execute top-to-bottom for requests,
    bottom-to-top for responses. Auth should be first, Error last.
```

⚠️ **Common Mistake:** Getting the interceptor order wrong. Auth should be FIRST (so the token is added before anything else sees the request). Error handling should be LAST in the array (so it's the outermost wrapper and catches errors from all other interceptors). If you put error handling before retry, the error handler will catch errors before the retry interceptor gets a chance to retry them.

> **Key Takeaway:** Interceptors form a pipeline (chain of responsibility pattern). Request flows forward through the chain, response flows backward. The order you register them in `withInterceptors([...])` determines the execution order. Think of it like layers of an onion — the first interceptor is the outermost layer.

**Common Interview Follow-up:** "Can you skip an interceptor for a specific request?" Yes! You can use `HttpContext` to pass metadata with a request, and interceptors can check that metadata to decide whether to run. For example, you might set a `SKIP_AUTH` context token on public API calls.

### 3.2 Functional Interceptors (Angular 15+)

Functional interceptors replace class-based `HttpInterceptor` implementations.
They are simpler (just a function instead of a class), tree-shakable, and work natively with standalone apps.

**What does "functional" mean here?** Instead of writing a class that implements the `HttpInterceptor` interface with an `intercept()` method, you write a plain function. It's less boilerplate, easier to test, and aligns with Angular's move toward functional APIs (like functional guards and resolvers).

**Old way (class-based):** You had to create a class, implement an interface, and register it with a multi-provider. That's 3 steps.
**New way (functional):** You write a function and pass it to `withInterceptors()`. That's 1 step.

**What this code does:** This shows how to register functional interceptors in your app config. The order in the array determines the execution order for requests (top to bottom) and responses (bottom to top).

```typescript
// Registration in app.config.ts
// This is where you tell Angular which interceptors to use and in what ORDER.
// The array order is the request execution order (first to last).
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      // withInterceptors() takes an array of interceptor functions.
      // They execute in this order for OUTGOING requests:
      withInterceptors([
        authInterceptor,        // 1st — adds auth token to every request
        cachingInterceptor,     // 2nd — checks if we have a cached response
        loadingInterceptor,     // 3rd — shows/hides loading spinner
        retryInterceptor,       // 4th — retries failed requests
        errorInterceptor,       // 5th — catches and classifies errors
      ])
      // For INCOMING responses, the order is REVERSED:
      // errorInterceptor → retryInterceptor → loadingInterceptor → cachingInterceptor → authInterceptor
    ),
  ],
};
```

> **Key Takeaway:** Functional interceptors are the modern standard in Angular 15+. They're simpler, more composable, and tree-shakable. Always use `withInterceptors()` in standalone apps instead of the legacy `HTTP_INTERCEPTORS` multi-provider pattern.

### 3.3 Auth Interceptor with Token Refresh & Request Queuing

🔑 **Simple Explanation:**
This interceptor automatically adds your login token (JWT) to every API request — like showing your ID badge at every door in an office building. But the tricky part is: what happens when your token expires mid-session?

Here's the scenario: You're logged in, browsing the app. Your access token expires (they typically last 15-60 minutes). The next API call returns a 401 (Unauthorized). Instead of kicking the user to the login page, this interceptor:
1. Detects the 401 error
2. Calls the refresh endpoint to get a new token (using the refresh token)
3. Replays the original failed request with the new token
4. The user never notices anything happened

The extra complexity: what if 5 requests fail at the same time because the token expired? You don't want to call the refresh endpoint 5 times simultaneously. This interceptor uses a **queuing mechanism** — the first failed request triggers the refresh, and the other 4 wait in a queue. Once the new token arrives, all 5 requests are replayed.

**Real-world analogy:** Imagine your office key card expires. You go to the security desk to get a new one. While you're waiting, 4 colleagues also try to enter and get rejected. Instead of all 5 of you going to the security desk separately, you go once, get the new card, and then everyone uses the updated access. That's request queuing.

**What this code does:** A functional interceptor that (1) adds the Bearer token to every request, (2) catches 401 errors, (3) refreshes the token, (4) queues concurrent requests during refresh, and (5) replays all failed requests with the new token.

```typescript
// interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, filter, take, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

// ─── Module-level state (shared across all interceptor invocations) ───
// These variables live OUTSIDE the function so they persist across all HTTP calls.
// They coordinate the token refresh process across multiple simultaneous requests.

// isRefreshing: a boolean flag that says "we're currently refreshing the token."
// When true, other requests know to WAIT instead of starting another refresh.
let isRefreshing = false;

// refreshTokenSubject: a BehaviorSubject that acts as a "mailbox" for the new token.
// BehaviorSubject remembers its last value and immediately gives it to new subscribers.
// - null means "no token yet, keep waiting"
// - a string means "here's the new token, go ahead and retry your request"
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

// This is the interceptor function. Angular calls it for EVERY HTTP request.
// req: the outgoing HTTP request object
// next: a function that passes the request to the next interceptor (or to the server)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() retrieves the AuthService from Angular's DI system.
  // This works inside interceptor functions because Angular sets up an injection context.
  const authService = inject(AuthService);

  // Get the current access token from the auth service.
  // This might be stored in memory, localStorage, or a cookie.
  const token = authService.getAccessToken();

  // IMPORTANT: Don't add auth headers to login or refresh endpoints.
  // Login doesn't need a token (you're trying to GET a token).
  // Refresh uses the refresh token, not the access token.
  // Adding an expired access token to the refresh endpoint would cause an infinite loop:
  //   refresh fails with 401 → tries to refresh again → fails again → infinite loop
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);  // Pass through without modification
  }

  // Clone the request and add the Authorization header with the Bearer token.
  // We must CLONE because HttpRequest objects are immutable (frozen).
  const authReq = addTokenToRequest(req, token);

  // Send the modified request through the chain and handle the response.
  return next(authReq).pipe(
    // catchError runs only if the request fails (HTTP error).
    catchError((error: HttpErrorResponse) => {
      // 401 means "Unauthorized" — the token is expired or invalid.
      if (error.status === 401) {
        // Try to refresh the token and replay the request.
        return handleUnauthorized(req, next, authService);
      }
      // For any other error (400, 403, 500, etc.), just pass it along.
      // Other interceptors (like the error interceptor) will handle it.
      return throwError(() => error);
    })
  );
};

// Helper function: creates a new request with the Authorization header added.
function addTokenToRequest(
  req: HttpRequest<unknown>,  // The original request
  token: string | null        // The JWT access token (or null if not logged in)
): HttpRequest<unknown> {
  // If there's no token (user not logged in), send the request as-is.
  if (!token) return req;

  // clone() creates a COPY of the request with modifications.
  // We MUST clone because HttpRequest objects are immutable — you can't modify them directly.
  // This is by design: immutability prevents accidental side effects in the interceptor chain.
  return req.clone({
    // setHeaders merges these headers into the existing headers.
    // "Bearer" is the standard prefix for JWT tokens in the Authorization header.
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

// Handles 401 errors by refreshing the token and retrying the original request.
// This is the most complex part — it coordinates multiple simultaneous failed requests.
function handleUnauthorized(
  req: HttpRequest<unknown>,                                              // The original failed request
  next: (req: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>,    // The next handler in the chain
  authService: AuthService                                                 // For refreshing the token
) {
  // CASE 1: We're NOT already refreshing → start a refresh.
  if (!isRefreshing) {
    isRefreshing = true;                       // Set the flag so other requests know to wait
    refreshTokenSubject.next(null);            // Reset the mailbox to null ("no token yet")

    // Call the auth service to refresh the token.
    // This typically sends the refresh token to the server and gets a new access token.
    return authService.refreshToken().pipe(
      // switchMap: when the refresh succeeds, switch to retrying the original request.
      switchMap((tokens) => {
        // Refresh succeeded! We have a new access token.
        isRefreshing = false;                                  // Clear the "refreshing" flag
        refreshTokenSubject.next(tokens.accessToken);          // Put the new token in the mailbox
        // All waiting requests (in CASE 2 below) will now receive this token.

        // Retry the original failed request with the new token.
        return next(addTokenToRequest(req, tokens.accessToken));
      }),
      // catchError: if the refresh itself fails (e.g., refresh token also expired).
      catchError((err) => {
        // Refresh failed — the user's session is truly expired.
        isRefreshing = false;                  // Clear the flag
        authService.logout();                  // Clear all tokens and redirect to login page
        return throwError(() => err);          // Propagate the error
      })
    );
  }

  // CASE 2: We ARE already refreshing → wait for the new token.
  // This is the "queuing" part. Multiple requests that failed with 401 all land here.
  // Instead of each one triggering its own refresh, they all wait on the same BehaviorSubject.
  return refreshTokenSubject.pipe(
    // filter: ignore null values (null means "still refreshing, no token yet").
    // Only proceed when a real token string arrives.
    filter((token): token is string => token !== null),

    // take(1): only take the FIRST non-null value, then unsubscribe.
    // Without this, the subscription would stay open and replay on future refreshes.
    take(1),

    // switchMap: once we have the new token, retry the original request with it.
    switchMap((token) => next(addTokenToRequest(req, token)))
  );
}
```

💡 **Why This Matters:** Token refresh with request queuing is one of the most commonly asked interceptor questions in senior/architect interviews. Interviewers want to see that you understand:
1. Why you need to queue requests during refresh (to avoid multiple simultaneous refresh calls)
2. How `BehaviorSubject` coordinates multiple waiting requests (it's a shared "mailbox")
3. How to avoid infinite refresh loops by skipping auth endpoints
4. Why `HttpRequest` objects are immutable (to prevent side effects in the interceptor chain)

> **Key Takeaway:** The auth interceptor pattern has three critical parts: (1) add token to requests, (2) detect 401 and trigger refresh, (3) queue concurrent requests during refresh using BehaviorSubject. The `isRefreshing` flag prevents multiple simultaneous refresh calls, and `refreshTokenSubject` broadcasts the new token to all waiting requests.

**Common Interview Follow-up:** "What if the refresh token is also expired?" The `catchError` in the refresh flow handles this — it calls `authService.logout()` which clears all tokens and redirects to the login page. The user has to log in again.

### 3.4 Retry Interceptor with Exponential Backoff

🔑 **Simple Explanation:**
Sometimes API calls fail temporarily — the server is busy, the network hiccupped, a load balancer timed out. Instead of immediately showing an error to the user, this interceptor automatically retries the request. But it doesn't retry immediately — it waits longer between each attempt. This is called "exponential backoff":

- 1st retry: wait ~1 second
- 2nd retry: wait ~2 seconds
- 3rd retry: wait ~4 seconds

Why wait longer each time? Because if the server is overloaded, hammering it with immediate retries makes things worse. Giving it progressively more time to recover is the polite (and effective) approach.

The "jitter" (random variation) is an additional optimization. Without jitter, if 1000 users all get a timeout at the same moment, they'd all retry at exactly the same time — creating another spike. Jitter adds random variation so retries are spread out over time.

**Real-world analogy:** Imagine a restaurant is full. You don't stand at the door asking "table ready?" every second. You wait 5 minutes, then 10 minutes, then 20 minutes. And you don't synchronize your check-ins with every other waiting customer — you each check at slightly different times.

**What this code does:** A functional interceptor that retries failed HTTP requests with exponential backoff and jitter. It only retries idempotent methods (GET, PUT, DELETE) and only for specific error codes (server errors, timeouts). It never retries POST requests because that could cause duplicate side effects.

```typescript
// interceptors/retry.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { retry, timer } from 'rxjs';

// Configuration interface for retry behavior.
// Having this as a separate interface makes it easy to customize per-environment.
interface RetryConfig {
  maxRetries: number;          // Maximum number of retry attempts (e.g., 3)
  initialDelay: number;        // Delay before the first retry in milliseconds (e.g., 1000 = 1 second)
  maxDelay: number;            // Maximum delay cap so we don't wait forever (e.g., 30000 = 30 seconds)
  retryableStatuses: number[]; // Which HTTP status codes should trigger a retry
}

// Default configuration — sensible defaults for most applications.
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,               // Try up to 3 times before giving up
  initialDelay: 1000,          // First retry after 1 second
  maxDelay: 30000,             // Never wait more than 30 seconds between retries
  retryableStatuses: [
    408,  // Request Timeout — the server didn't respond in time
    429,  // Too Many Requests — rate limited, try again later
    500,  // Internal Server Error — generic server crash
    502,  // Bad Gateway — proxy/load balancer couldn't reach the server
    503,  // Service Unavailable — server is temporarily overloaded
    504,  // Gateway Timeout — proxy/load balancer timed out waiting for server
  ],
};

// The interceptor function — called for every HTTP request.
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // CRITICAL SAFETY CHECK: Only retry "safe" (idempotent) HTTP methods.
  // Idempotent means "repeating the operation has the same effect as doing it once."
  //
  // GET: Reading data — safe to repeat (you just get the same data again).
  // PUT: Replacing data — safe to repeat (you overwrite with the same value).
  // DELETE: Removing data — safe to repeat (deleting something already deleted is a no-op).
  // HEAD/OPTIONS: Metadata requests — safe to repeat.
  //
  // POST is NOT safe — it typically CREATES a new resource.
  // Retrying a POST could create duplicate records (e.g., double-charging a payment).
  // PATCH is also risky — it applies a partial update that might not be idempotent.
  if (!['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(req.method)) {
    return next(req);  // Don't retry POST/PATCH requests — pass through immediately
  }

  const config = DEFAULT_RETRY_CONFIG;

  // Send the request and apply retry logic to the response.
  return next(req).pipe(
    // retry() is an RxJS operator that re-subscribes to the source Observable on error.
    // Re-subscribing means the HTTP request is sent again.
    retry({
      count: config.maxRetries,  // Maximum 3 retry attempts

      // delay: a function called on each error to determine the retry delay.
      // error: the HttpErrorResponse that caused the failure
      // retryCount: which retry attempt this is (1, 2, 3, ...)
      delay: (error, retryCount) => {
        // Only retry on specific status codes that indicate TRANSIENT failures.
        // Don't retry 400 (Bad Request) — the request itself is wrong, retrying won't help.
        // Don't retry 401 (Unauthorized) — the auth interceptor handles that.
        // Don't retry 403 (Forbidden) — the user doesn't have permission, retrying won't help.
        // Don't retry 404 (Not Found) — the resource doesn't exist, retrying won't help.
        if (!config.retryableStatuses.includes(error.status)) {
          throw error;  // Don't retry — propagate the error immediately to the caller
        }

        // Calculate the delay using exponential backoff.
        // Formula: initialDelay * 2^(retryCount - 1)
        // Attempt 1: 1000 * 2^0 = 1000ms (1 second)
        // Attempt 2: 1000 * 2^1 = 2000ms (2 seconds)
        // Attempt 3: 1000 * 2^2 = 4000ms (4 seconds)
        // Math.min caps the delay at maxDelay so it doesn't grow unbounded.
        const delay = Math.min(
          config.initialDelay * Math.pow(2, retryCount - 1),  // Exponential growth
          config.maxDelay                                       // But never more than 30 seconds
        );

        // Add jitter: random variation of ±30% to prevent the "thundering herd" problem.
        // Without jitter, if 1000 clients all fail at the same time, they'd all retry
        // at exactly the same time — creating another spike that crashes the server again.
        // Jitter spreads the retries out over a time window.
        const jitter = delay * 0.3 * Math.random();  // Random value between 0 and 30% of delay

        // Log the retry attempt for debugging (visible in browser DevTools console).
        console.warn(
          `[Retry] ${req.method} ${req.url} — attempt ${retryCount}/${config.maxRetries} ` +
          `in ${Math.round(delay + jitter)}ms (status: ${error.status})`
        );

        // timer() creates an Observable that emits a single value after the specified delay.
        // This effectively "pauses" the retry for the calculated duration.
        // When the timer fires, RxJS re-subscribes to the HTTP request (sends it again).
        return timer(delay + jitter);
      },
    })
  );
};
```

⚠️ **Common Mistake:** Retrying POST requests. If a user submits a payment and the request times out (but actually succeeded on the server), retrying the POST could charge them twice. Only retry idempotent methods (GET, PUT, DELETE) where repeating the operation is safe. If you must retry POST requests, implement idempotency keys on the server side.

> **Key Takeaway:** Exponential backoff with jitter is the industry-standard retry strategy. It gives the server time to recover (exponential delays) and prevents thundering herd problems (jitter). Always check that the HTTP method is idempotent before retrying, and only retry on transient error codes (5xx, 408, 429).

**Common Interview Follow-up:** "What's the thundering herd problem?" When many clients fail simultaneously and all retry at the same time, they create a spike that's even worse than the original failure. Jitter (random delay variation) spreads retries over time, preventing this cascade. This is a distributed systems concept that applies to any retry mechanism.

📝 **Section 3 Summary:**
- Interceptors are middleware for HTTP requests — they form a chain (pipeline) that every request/response passes through
- Functional interceptors (Angular 15+) are simpler than class-based ones — just a function instead of a class
- Auth interceptors add tokens, detect 401s, refresh tokens, and queue concurrent requests during refresh
- Retry interceptors use exponential backoff with jitter for transient failures, but only for idempotent methods
- Interceptor ORDER matters: auth first, error handling last

---

## 4. Error Handling Architecture

🔑 **Simple Explanation:**
Every app encounters errors — network failures, server crashes, invalid user input, unexpected null values. The question isn't whether errors will happen, but how your app handles them. A well-designed error handling architecture catches errors at the right level, shows meaningful messages to users, logs details for developers, and prevents the app from crashing.

Think of error handling like a hospital's triage system. Not every patient goes to the ER — some go to urgent care, some get a bandaid, and some are sent home with advice. Similarly, not every error needs the same treatment. A 404 (not found) just needs a friendly message. A 500 (server error) might need a retry. A network failure might need an offline indicator.

**Real-world analogy:** Error handling is like a building's fire safety system. You have smoke detectors (error detection), sprinklers (automatic recovery like retries), fire alarms (user notifications), and fire escape routes (graceful degradation). You don't want one small fire to burn down the whole building.

### 4.1 Global Error Handler

Angular provides a built-in `ErrorHandler` class that catches all unhandled errors in the application. By default, it just logs errors to the console. In production, you want to override it to send errors to a monitoring service (like Sentry, Datadog, or LogRocket) and show user-friendly messages.

**What this code does:** A custom global error handler that catches ALL unhandled errors in the app, classifies them (HTTP vs. client-side), logs them to a monitoring service, and shows a user-friendly notification. This is the "catch-all safety net" — if an error slips past all other error handling, this catches it.

```typescript
// error-handling/global-error-handler.ts
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // inject() is the modern way to get dependencies (instead of constructor injection).
  // NotificationService shows toast/snackbar messages to the user.
  private notificationService = inject(NotificationService);
  // LoggingService sends error details to a monitoring service (Sentry, Datadog, etc.).
  private loggingService = inject(LoggingService);

  // handleError() is called by Angular whenever an unhandled error occurs ANYWHERE in the app.
  // This includes errors in components, services, pipes, directives, and even template expressions.
  handleError(error: unknown): void {
    // Unwrap the error — Angular sometimes wraps errors in its own Error objects.
    // The real error might be nested inside error.rejection (for unhandled Promise rejections)
    // or error.error (for wrapped errors).
    const unwrappedError = this.unwrapError(error);

    if (unwrappedError instanceof HttpErrorResponse) {
      // HTTP errors (4xx, 5xx) — these come from failed API calls.
      // The error interceptor usually handles these, but if one slips through,
      // we catch it here as a safety net.
      this.handleHttpError(unwrappedError);
    } else if (unwrappedError instanceof Error) {
      // Client-side JavaScript errors — null reference, type errors, etc.
      // These are bugs in our code that need to be fixed.
      this.handleClientError(unwrappedError);
    } else {
      // Unknown error type — could be a thrown string, number, or object.
      // Log it as-is for investigation.
      this.loggingService.logError('Unknown error', { error: unwrappedError });
    }
  }

  // Unwrap nested error objects to get the real error.
  private unwrapError(error: unknown): unknown {
    // Check if the error is wrapped (Angular sometimes does this for async errors).
    if (error && typeof error === 'object') {
      // 'rejection' property exists on unhandled Promise rejection errors.
      if ('rejection' in error) return (error as any).rejection;
      // 'error' property exists on some Angular-wrapped errors.
      if ('error' in error && (error as any).error instanceof Error) return (error as any).error;
    }
    return error;  // Return as-is if not wrapped
  }

  // Handle HTTP errors — show appropriate user messages based on status code.
  private handleHttpError(error: HttpErrorResponse): void {
    let userMessage: string;

    // Classify the error by status code and choose an appropriate user message.
    switch (true) {
      case error.status === 0:
        // Status 0 means the request never reached the server.
        // This is usually a network connectivity issue.
        userMessage = 'Unable to connect to the server. Please check your internet connection.';
        break;
      case error.status === 403:
        // 403 Forbidden — the user is authenticated but doesn't have permission.
        userMessage = 'You do not have permission to perform this action.';
        break;
      case error.status === 404:
        // 404 Not Found — the requested resource doesn't exist.
        userMessage = 'The requested resource was not found.';
        break;
      case error.status >= 500:
        // 5xx Server Error — something went wrong on the server side.
        userMessage = 'A server error occurred. Please try again later.';
        break;
      default:
        userMessage = 'An unexpected error occurred.';
    }

    // Show the user-friendly message as a toast/snackbar notification.
    this.notificationService.showError(userMessage);
    // Log the full error details to the monitoring service for debugging.
    this.loggingService.logError('HTTP Error', {
      status: error.status,
      url: error.url,
      message: error.message,
    });
  }

  // Handle client-side JavaScript errors — these are bugs in our code.
  private handleClientError(error: Error): void {
    // Show a generic message to the user (don't expose technical details).
    this.notificationService.showError('Something went wrong. Our team has been notified.');
    // Log the full error with stack trace to the monitoring service.
    this.loggingService.logError('Client Error', {
      name: error.name,       // e.g., "TypeError", "ReferenceError"
      message: error.message, // e.g., "Cannot read property 'name' of undefined"
      stack: error.stack,     // Full stack trace for debugging
    });
  }
}
```

**What this code does:** Register the custom error handler in your app config so Angular uses it instead of the default one.

```typescript
// app.config.ts — Register the global error handler
export const appConfig: ApplicationConfig = {
  providers: [
    // Override Angular's default ErrorHandler with our custom one.
    // { provide: X, useClass: Y } tells DI: "When someone asks for X, give them Y."
    // So when Angular internally asks for ErrorHandler, it gets GlobalErrorHandler.
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // ... other providers
  ],
};
```

> **Key Takeaway:** The global error handler is your last line of defense. It catches everything that slips past component-level and interceptor-level error handling. Always classify errors (HTTP vs. client-side), show user-friendly messages (never expose stack traces to users), and log full details to a monitoring service.

**Common Interview Follow-up:** "How do you handle errors in RxJS streams?" Use the `catchError` operator to handle errors within Observable pipelines. For component-level error handling, catch errors in the service or component and update the UI state accordingly. The global error handler is the safety net for anything that falls through.

### 4.2 Error Classification Pattern

🔑 **Simple Explanation:**
Not all errors are equal. A network timeout is different from a validation error, which is different from a server crash. Classifying errors into categories lets you handle each type appropriately — retry transient errors, show validation messages for user errors, and escalate server errors to monitoring.

**What this code does:** An error classification service that categorizes errors into types (network, server, client, validation, auth) and determines the appropriate response for each type.

```typescript
// error-handling/error-classifier.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

// Enum defining the categories of errors we handle.
// Each category has a different handling strategy.
export enum ErrorCategory {
  NETWORK = 'network',         // Can't reach the server (offline, DNS failure, CORS)
  SERVER = 'server',           // Server returned 5xx (server-side bug or overload)
  CLIENT = 'client',           // Client-side JS error (our bug — null reference, type error)
  VALIDATION = 'validation',   // Server returned 400/422 (user input is invalid)
  AUTH = 'auth',               // Server returned 401/403 (not logged in or no permission)
  UNKNOWN = 'unknown',         // Anything else we can't classify
}

// The result of classifying an error — includes the category and whether to retry.
export interface ClassifiedError {
  category: ErrorCategory;     // What type of error is this?
  message: string;             // User-friendly message to display
  retryable: boolean;          // Should we offer a "Retry" button?
  originalError: unknown;      // The original error object for logging
}

@Injectable({ providedIn: 'root' })
export class ErrorClassifier {

  // classify() takes any error and returns a structured ClassifiedError object.
  // This is the single entry point for error classification in the entire app.
  classify(error: unknown): ClassifiedError {
    // Check if it's an HTTP error (from Angular's HttpClient).
    if (error instanceof HttpErrorResponse) {
      return this.classifyHttpError(error);
    }

    // Check if it's a standard JavaScript Error.
    if (error instanceof Error) {
      return {
        category: ErrorCategory.CLIENT,
        message: 'An unexpected error occurred.',
        retryable: false,        // Client errors are bugs — retrying won't help
        originalError: error,
      };
    }

    // Fallback for anything else (thrown strings, numbers, etc.).
    return {
      category: ErrorCategory.UNKNOWN,
      message: 'An unknown error occurred.',
      retryable: false,
      originalError: error,
    };
  }

  // Classify HTTP errors based on status code.
  private classifyHttpError(error: HttpErrorResponse): ClassifiedError {
    // status === 0 means the request never reached the server.
    // This happens when the user is offline, there's a DNS failure,
    // or CORS blocks the request.
    if (error.status === 0) {
      return {
        category: ErrorCategory.NETWORK,
        message: 'Network error. Please check your connection.',
        retryable: true,         // Network issues are often transient — retry makes sense
        originalError: error,
      };
    }

    // 401 Unauthorized or 403 Forbidden — authentication/authorization issue.
    if (error.status === 401 || error.status === 403) {
      return {
        category: ErrorCategory.AUTH,
        message: error.status === 401
          ? 'Your session has expired. Please log in again.'
          : 'You do not have permission for this action.',
        retryable: false,        // Auth errors need user action, not retries
        originalError: error,
      };
    }

    // 400 Bad Request or 422 Unprocessable Entity — validation error.
    // The server is telling us the request data is invalid.
    if (error.status === 400 || error.status === 422) {
      return {
        category: ErrorCategory.VALIDATION,
        // Try to extract the server's error message, fall back to generic.
        message: error.error?.message || 'Please check your input and try again.',
        retryable: false,        // Validation errors need the user to fix their input
        originalError: error,
      };
    }

    // 5xx Server Error — something went wrong on the server side.
    if (error.status >= 500) {
      return {
        category: ErrorCategory.SERVER,
        message: 'A server error occurred. Please try again later.',
        retryable: true,         // Server errors are often transient — retry might work
        originalError: error,
      };
    }

    // Any other status code we haven't explicitly handled.
    return {
      category: ErrorCategory.UNKNOWN,
      message: 'An unexpected error occurred.',
      retryable: false,
      originalError: error,
    };
  }
}
```

> **Key Takeaway:** Error classification is the foundation of good error handling. By categorizing errors, you can apply the right strategy to each type: retry transient errors, show validation messages, redirect on auth errors, and log server errors. This pattern keeps error handling consistent across the entire application.

**Common Interview Follow-up:** "How do you handle errors in forms?" For form validation errors (400/422), extract the field-level errors from the server response and map them to Angular form controls using `setErrors()`. This gives users specific feedback like "Email is already taken" instead of a generic error message.

📝 **Section 4 Summary:**
- Override Angular's `ErrorHandler` to create a global safety net for unhandled errors
- Classify errors into categories (network, server, client, validation, auth) for appropriate handling
- Show user-friendly messages (never expose stack traces), log full details to monitoring services
- Network and server errors are retryable; validation and auth errors need user action

---

## 5. Enterprise Architecture Patterns

🔑 **Simple Explanation:**
When an Angular app grows from a small project to an enterprise application with dozens of developers and hundreds of components, you need architectural patterns to keep things organized, maintainable, and scalable. These patterns aren't Angular-specific — they're software engineering principles applied to the Angular context.

Think of it like city planning. A small town doesn't need zoning laws, traffic systems, or public transit. But a city with millions of people needs all of those to function. Enterprise architecture patterns are the "zoning laws" for large Angular applications.

### 5.1 Smart vs. Presentational Components

This is the most fundamental architectural pattern in Angular (and React). It separates components into two categories:

- **Smart (Container) Components:** Know about services, state management, and business logic. They fetch data, handle events, and coordinate child components. Think of them as "managers."
- **Presentational (Dumb) Components:** Only know about their `@Input()` data and `@Output()` events. They render UI and emit events. They have NO idea where the data comes from. Think of them as "workers."

**Why separate them?** Testability (presentational components are trivial to test), reusability (presentational components can be used anywhere), and maintainability (business logic is concentrated in smart components, not scattered across the UI).

**Real-world analogy:** A restaurant has a manager (smart component) who decides what to cook, handles customer complaints, and manages inventory. The chef (presentational component) just receives orders and produces dishes. The chef doesn't know about inventory or customer complaints — they just cook what they're told. This separation makes it easy to replace the chef without changing the management process.

**What this code does:** A smart component that fetches user data from a service and passes it to a presentational component for rendering. The smart component handles all the business logic (loading, error handling, pagination), while the presentational component just displays the data.

```typescript
// ─── Smart (Container) Component ───
// This component KNOWS about services and state.
// It fetches data, handles errors, and coordinates child components.
@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [CommonModule, UserCardComponent, LoadingSpinnerComponent],
  template: `
    <!-- Show loading spinner while data is being fetched -->
    @if (loading()) {
      <app-loading-spinner />
    }

    <!-- Show error message if the fetch failed -->
    @if (error()) {
      <div class="error-banner">
        {{ error() }}
        <!-- Retry button calls loadUsers() again -->
        <button (click)="loadUsers()">Retry</button>
      </div>
    }

    <!-- Render a UserCardComponent for each user in the list.
         [user] passes data DOWN (input).
         (edit) listens for events UP (output). -->
    @for (user of users(); track user.id) {
      <app-user-card
        [user]="user"
        (edit)="onEditUser($event)"
        (delete)="onDeleteUser($event)"
      />
    }
  `,
})
export class UserListPageComponent implements OnInit {
  // inject() gets the UserService from DI — this is the modern alternative to constructor injection.
  private userService = inject(UserService);
  private router = inject(Router);

  // Signals hold reactive state. When their value changes, the template re-renders.
  users = signal<User[]>([]);          // The list of users to display
  loading = signal(false);              // Whether we're currently fetching data
  error = signal<string | null>(null);  // Error message, or null if no error

  // ngOnInit runs once when the component is initialized.
  // This is where we trigger the initial data fetch.
  ngOnInit(): void {
    this.loadUsers();
  }

  // Fetch users from the API. This method handles loading state and errors.
  loadUsers(): void {
    this.loading.set(true);              // Show the loading spinner
    this.error.set(null);                // Clear any previous error

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);           // Store the fetched users
        this.loading.set(false);         // Hide the loading spinner
      },
      error: (err) => {
        this.error.set('Failed to load users. Please try again.');  // Show error message
        this.loading.set(false);         // Hide the loading spinner
      },
    });
  }

  // Handle the "edit" event from a child UserCardComponent.
  // Navigate to the edit page for that user.
  onEditUser(user: User): void {
    this.router.navigate(['/users', user.id, 'edit']);
  }

  // Handle the "delete" event from a child UserCardComponent.
  onDeleteUser(user: User): void {
    this.userService.deleteUser(user.id).subscribe(() => {
      // After successful deletion, remove the user from the local list.
      this.users.update(current => current.filter(u => u.id !== user.id));
    });
  }
}
```

```typescript
// ─── Presentational (Dumb) Component ───
// This component ONLY knows about its inputs and outputs.
// It has NO idea where the data comes from or what happens when buttons are clicked.
// It just renders UI and emits events.
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  // changeDetection: OnPush means this component only re-renders when its @Input() values change.
  // This is a performance optimization — the component doesn't check for changes on every cycle.
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="user-card">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <!-- When the Edit button is clicked, emit the user object to the parent -->
      <button (click)="edit.emit(user)">Edit</button>
      <!-- When the Delete button is clicked, emit the user object to the parent -->
      <button (click)="delete.emit(user)">Delete</button>
    </div>
  `,
})
export class UserCardComponent {
  // @Input: data flows IN from the parent component.
  // This component receives a User object and displays it.
  @Input({ required: true }) user!: User;

  // @Output: events flow OUT to the parent component.
  // EventEmitter is like a custom event — the parent listens with (edit)="handler($event)".
  @Output() edit = new EventEmitter<User>();    // Emitted when the Edit button is clicked
  @Output() delete = new EventEmitter<User>();  // Emitted when the Delete button is clicked

  // Notice: NO services injected, NO business logic, NO HTTP calls.
  // This component is pure UI — it takes data in and emits events out.
  // This makes it trivially easy to test and reuse in different contexts.
}
```

> **Key Takeaway:** Smart components handle business logic (data fetching, state management, navigation). Presentational components handle UI rendering (displaying data, emitting events). This separation makes your code more testable, reusable, and maintainable. Presentational components should use `OnPush` change detection for better performance.

**Common Interview Follow-up:** "How do you decide if a component should be smart or presentational?" If it needs to inject services or manage state, it's smart. If it only needs `@Input()` and `@Output()`, it's presentational. A good rule of thumb: pages/routes are smart, reusable UI elements are presentational.

### 5.2 Facade Pattern for State Management

🔑 **Simple Explanation:**
A facade is a simplified interface to a complex system. Instead of components directly interacting with multiple services, stores, and APIs, they interact with a single facade that hides all the complexity.

**Real-world analogy:** When you check into a hotel, you talk to the front desk (facade). The front desk coordinates with housekeeping, room service, maintenance, and billing behind the scenes. You don't need to know about any of those departments — you just talk to one person.

**What this code does:** A facade service that provides a clean, simple API for managing users. Internally, it coordinates between an API service, a state store, and a notification service. Components only interact with the facade — they never touch the underlying services directly.

```typescript
// facades/user.facade.ts
import { Injectable, inject, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserFacade {
  // Private dependencies — components never see these directly.
  private api = inject(UserApiService);           // Handles HTTP calls to the user API
  private notificationService = inject(NotificationService);  // Shows toast messages

  // ─── State (private signals) ───
  // These signals hold the internal state. They're private so components
  // can't modify them directly — they must go through the facade's methods.
  private _users = signal<User[]>([]);             // The list of users
  private _loading = signal(false);                 // Whether a request is in progress
  private _error = signal<string | null>(null);     // Current error message, if any
  private _selectedUser = signal<User | null>(null); // The currently selected user

  // ─── Public read-only API (computed signals) ───
  // Components can READ these but can't WRITE to them.
  // computed() creates a derived signal that updates automatically when its dependencies change.
  // .asReadonly() prevents components from calling .set() on the signal.
  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedUser = this._selectedUser.asReadonly();

  // Derived state: count of active users, computed from the users list.
  // This automatically updates whenever _users changes.
  readonly activeUserCount = computed(
    () => this._users().filter(u => u.isActive).length
  );

  // ─── Public actions (methods components can call) ───
  // These are the ONLY way components can trigger state changes.

  // Load all users from the API.
  loadUsers(): void {
    this._loading.set(true);                       // Show loading state
    this._error.set(null);                         // Clear previous errors

    this.api.getUsers().subscribe({
      next: (users) => {
        this._users.set(users);                    // Update the users list
        this._loading.set(false);                  // Hide loading state
      },
      error: (err) => {
        this._error.set('Failed to load users');   // Set error message
        this._loading.set(false);                  // Hide loading state
      },
    });
  }

  // Create a new user.
  createUser(userData: CreateUserDto): void {
    this.api.createUser(userData).subscribe({
      next: (newUser) => {
        // Add the new user to the existing list (immutable update).
        // The spread operator [...] creates a new array instead of mutating the existing one.
        this._users.update(current => [...current, newUser]);
        this.notificationService.showSuccess('User created successfully');
      },
      error: () => {
        this.notificationService.showError('Failed to create user');
      },
    });
  }

  // Select a user (e.g., when clicking on a row in a table).
  selectUser(user: User): void {
    this._selectedUser.set(user);
  }
}
```

```typescript
// Usage in a component — notice how clean and simple this is.
// The component doesn't know about APIs, HTTP, or state management internals.
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (facade.loading()) {
      <app-loading-spinner />
    }
    @for (user of facade.users(); track user.id) {
      <app-user-card [user]="user" (click)="facade.selectUser(user)" />
    }
    <p>Active users: {{ facade.activeUserCount() }}</p>
  `,
})
export class UserManagementComponent implements OnInit {
  // The component only interacts with the facade — one clean API.
  // It doesn't inject UserApiService, NotificationService, or any state store.
  protected facade = inject(UserFacade);

  ngOnInit(): void {
    this.facade.loadUsers();  // One method call to load all data
  }
}
```

> **Key Takeaway:** The facade pattern simplifies component code by providing a single, clean API that hides the complexity of multiple underlying services. Components interact with one facade instead of juggling multiple services. This makes components thinner, easier to test, and easier to refactor (you can change the internals of the facade without touching any component).

**Common Interview Follow-up:** "How is a facade different from a regular service?" A regular service typically handles one concern (API calls, or state, or notifications). A facade COORDINATES multiple services and exposes a unified API. It's a higher-level abstraction that sits between components and the service layer.

### 5.3 Feature Module Organization

Even with standalone components, organizing your code into feature folders is essential for large applications. Each feature is a self-contained folder with its own components, services, routes, and models.

```
src/
├── app/
│   ├── core/                          # App-wide singletons (auth, error handling, guards)
│   │   ├── interceptors/              # HTTP interceptors
│   │   ├── guards/                    # Route guards
│   │   ├── services/                  # Global services (auth, logging, notification)
│   │   └── error-handling/            # Global error handler
│   │
│   ├── shared/                        # Reusable UI components, pipes, directives
│   │   ├── components/                # Presentational components (buttons, cards, modals)
│   │   ├── pipes/                     # Custom pipes (timeAgo, currency, etc.)
│   │   └── directives/               # Custom directives (click-outside, tooltip, etc.)
│   │
│   ├── features/                      # Feature areas (each is self-contained)
│   │   ├── users/                     # User management feature
│   │   │   ├── components/            # Smart + presentational components for users
│   │   │   ├── services/              # User-specific services and facades
│   │   │   ├── models/                # User interfaces and types
│   │   │   └── users.routes.ts        # User feature routes (lazy-loaded)
│   │   │
│   │   ├── dashboard/                 # Dashboard feature
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── dashboard.routes.ts
│   │   │
│   │   └── admin/                     # Admin feature
│   │       ├── components/
│   │       ├── services/
│   │       └── admin.routes.ts
│   │
│   ├── app.component.ts               # Root component (shell with router-outlet)
│   ├── app.config.ts                  # App-wide configuration
│   └── app.routes.ts                  # Top-level routes (lazy-loads features)
│
├── main.ts                            # Entry point (bootstrapApplication)
└── index.html                         # HTML shell
```

**The three-layer rule:**
1. **Core:** Services and utilities used app-wide. Imported once at the app level. Never imported by features directly.
2. **Shared:** Reusable UI components, pipes, and directives. Can be imported by any feature.
3. **Features:** Self-contained feature areas. Features should NOT import from other features — they communicate through shared services or the router.

> **Key Takeaway:** Organize code by feature, not by type. Don't put all components in a `components/` folder and all services in a `services/` folder. Instead, group everything related to a feature together. This makes it easy to find code, lazy-load features, and assign ownership to teams.

📝 **Section 5 Summary:**
- Smart components handle business logic; presentational components handle UI rendering
- The facade pattern provides a clean API that hides the complexity of multiple services
- Organize code by feature (users/, dashboard/, admin/) not by type (components/, services/)
- The core/shared/features three-layer architecture keeps large apps maintainable

---

## 6. Modern Angular Features

🔑 **Simple Explanation:**
Angular has evolved significantly in recent versions (16-18). Three major features have changed how we write Angular code: **Signals** (a new reactive primitive), **the new control flow syntax** (`@if`, `@for`, `@switch`), and **the `inject()` function** (a modern alternative to constructor injection). These features make Angular code simpler, more performant, and more aligned with modern JavaScript patterns.

### 6.1 Signals

**What are Signals?** Signals are Angular's new reactive primitive — a way to hold and track state that automatically notifies the framework when it changes. Think of a signal as a "smart variable" that Angular watches. When you change a signal's value, Angular knows exactly which parts of the UI need to update, without checking everything.

**Why were Signals introduced?** Before Signals, Angular relied on Zone.js for change detection. Zone.js patches every async operation (setTimeout, Promise, HTTP calls, DOM events) and triggers change detection after each one. This works but is inefficient — Angular checks the ENTIRE component tree even if only one value changed. Signals enable fine-grained reactivity: Angular only updates the specific DOM elements that depend on the changed signal.

**Real-world analogy:** Zone.js is like a fire alarm that goes off for the entire building whenever someone burns toast in one apartment. Signals are like individual smoke detectors — only the affected apartment's alarm goes off.

**What this code does:** Demonstrates the three types of signals: `signal()` for writable state, `computed()` for derived state, and `effect()` for side effects. Also shows how to use signals in a component template.

```typescript
// signals-demo.component.ts
import { Component, signal, computed, effect, inject } from '@angular/core';

@Component({
  selector: 'app-signals-demo',
  standalone: true,
  template: `
    <!-- Reading a signal in a template: call it like a function with () -->
    <h2>{{ title() }}</h2>

    <!-- count() reads the current value of the count signal -->
    <p>Count: {{ count() }}</p>

    <!-- doubleCount() reads the computed signal — it auto-updates when count changes -->
    <p>Double: {{ doubleCount() }}</p>

    <!-- isEven() is another computed signal derived from count -->
    <p>Is Even: {{ isEven() }}</p>

    <!-- Click handlers call methods that update the signal -->
    <button (click)="increment()">+1</button>
    <button (click)="decrement()">-1</button>
    <button (click)="reset()">Reset</button>
  `,
})
export class SignalsDemoComponent {
  // ─── signal() — Writable reactive state ───
  // signal(0) creates a signal with initial value 0.
  // It's like a variable, but Angular tracks when it changes.
  // To READ: call it as a function → count() returns 0
  // To WRITE: use .set(newValue) or .update(fn)
  count = signal(0);

  // signal() works with any type — strings, objects, arrays, etc.
  title = signal('Signal Demo');

  // ─── computed() — Derived (read-only) reactive state ───
  // computed() creates a signal whose value is derived from other signals.
  // It automatically recalculates when any signal it reads changes.
  // You CANNOT set a computed signal — it's read-only.
  //
  // When count changes from 3 to 4:
  //   - doubleCount automatically becomes 8
  //   - isEven automatically becomes true
  // Angular only recalculates if the source signals actually changed.
  doubleCount = computed(() => this.count() * 2);
  isEven = computed(() => this.count() % 2 === 0);

  // ─── effect() — Side effects that run when signals change ───
  // effect() runs a callback whenever any signal it reads changes.
  // It's like a "watcher" — useful for logging, analytics, localStorage sync, etc.
  // IMPORTANT: effects run in an injection context, so they must be created
  // in the constructor or a field initializer (not in ngOnInit).
  private logEffect = effect(() => {
    // This callback runs whenever count() changes.
    // Angular tracks which signals are read inside the callback
    // and re-runs it when any of them change.
    console.log(`Count changed to: ${this.count()}`);
    // You could also sync to localStorage here:
    // localStorage.setItem('count', this.count().toString());
  });

  // ─── Methods that modify the signal ───

  increment(): void {
    // .update() takes a function that receives the current value and returns the new value.
    // This is the preferred way to update based on the current value (avoids race conditions).
    this.count.update(current => current + 1);
  }

  decrement(): void {
    this.count.update(current => current - 1);
  }

  reset(): void {
    // .set() directly sets a new value, ignoring the current value.
    this.count.set(0);
  }
}
```

> **Key Takeaway:** Signals are Angular's future for state management. `signal()` holds writable state, `computed()` derives read-only state, and `effect()` runs side effects. Signals enable fine-grained change detection — Angular only updates the DOM elements that depend on changed signals, instead of checking the entire component tree.

**Common Interview Follow-up:** "How do Signals compare to RxJS Observables?" Signals are synchronous and always have a current value (no need to subscribe). Observables are asynchronous and represent streams of values over time. Use Signals for synchronous UI state (counters, form values, toggles). Use Observables for async operations (HTTP calls, WebSocket streams, complex event processing). Angular provides `toSignal()` and `toObservable()` to convert between them.

### 6.2 New Control Flow Syntax (@if, @for, @switch)

**What is the new control flow?** Angular 17 introduced a new template syntax for conditional rendering and loops. Instead of structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`), you use built-in block syntax (`@if`, `@for`, `@switch`). The new syntax is more readable, more powerful, and better optimized by the compiler.

**Why change?** The old `*ngIf` and `*ngFor` directives had limitations:
- `*ngIf` with an `else` clause was awkward (`*ngIf="condition; else elseBlock"` with a separate `<ng-template>`)
- `*ngFor` required `trackBy` as a separate function reference
- `*ngSwitch` required three directives (`ngSwitch`, `ngSwitchCase`, `ngSwitchDefault`)
- They required importing `CommonModule`

The new syntax fixes all of these issues and doesn't require any imports.

**What this code does:** Side-by-side comparison of old and new syntax, followed by practical examples of each control flow block.

```typescript
// ─── @if — Conditional rendering (replaces *ngIf) ───
@Component({
  selector: 'app-control-flow-demo',
  standalone: true,
  // NOTE: No need to import CommonModule for @if, @for, @switch!
  // They're built into the template compiler.
  template: `
    <!-- OLD WAY (still works but deprecated in new projects): -->
    <!-- <div *ngIf="isLoggedIn; else loginTemplate">Welcome!</div> -->
    <!-- <ng-template #loginTemplate><div>Please log in</div></ng-template> -->

    <!-- NEW WAY — much cleaner: -->
    <!-- @if checks a condition. @else if and @else handle alternatives. -->
    <!-- No need for <ng-template> — it's all inline. -->
    @if (user()) {
      <!-- This block renders when user() is truthy (not null/undefined) -->
      <h1>Welcome, {{ user()!.name }}</h1>

      @if (user()!.isAdmin) {
        <!-- Nested @if — renders only for admin users -->
        <admin-panel />
      }
    } @else if (loading()) {
      <!-- This block renders when user() is falsy AND loading() is true -->
      <app-loading-spinner />
    } @else {
      <!-- This block renders when both conditions above are false -->
      <login-form />
    }

    <!-- ─── @for — Loop rendering (replaces *ngFor) ─── -->
    <!-- @for iterates over a collection and renders a block for each item. -->
    <!-- 'track' is REQUIRED — it tells Angular how to identify each item -->
    <!-- for efficient DOM updates (like trackBy in *ngFor, but mandatory). -->
    @for (item of items(); track item.id) {
      <!-- 'item' is the current element, available inside this block -->
      <app-item-card
        [item]="item"
        [index]="$index"
      />
      <!-- Built-in context variables (no need to declare them): -->
      <!-- $index: the current index (0, 1, 2, ...) -->
      <!-- $first: true if this is the first item -->
      <!-- $last: true if this is the last item -->
      <!-- $even: true if the index is even -->
      <!-- $odd: true if the index is odd -->
      <!-- $count: total number of items in the collection -->
    } @empty {
      <!-- @empty renders when the collection is empty (items().length === 0) -->
      <!-- This replaces the awkward *ngIf="items.length === 0" pattern -->
      <p>No items found.</p>
    }

    <!-- ─── @switch — Multi-case rendering (replaces ngSwitch) ─── -->
    <!-- @switch evaluates an expression and renders the matching @case block. -->
    @switch (status()) {
      @case ('loading') {
        <app-loading-spinner />
      }
      @case ('error') {
        <app-error-message [message]="errorMessage()" />
      }
      @case ('success') {
        <app-success-view [data]="data()" />
      }
      @default {
        <!-- @default renders when no @case matches -->
        <p>Unknown status</p>
      }
    }
  `,
})
export class ControlFlowDemoComponent {
  // Signals used in the template above.
  user = signal<User | null>(null);
  loading = signal(false);
  items = signal<Item[]>([]);
  status = signal<'loading' | 'error' | 'success'>('loading');
  errorMessage = signal('');
  data = signal<any>(null);
}
```

> **Key Takeaway:** The new `@if`, `@for`, `@switch` syntax is cleaner, more powerful, and doesn't require importing `CommonModule`. `@for` requires a `track` expression (mandatory, unlike the optional `trackBy` in `*ngFor`). `@empty` handles empty collections elegantly. Use the new syntax in all new code — it's the future of Angular templates.

**Common Interview Follow-up:** "Why is `track` mandatory in `@for`?" Because tracking is essential for performance. When the list changes, Angular uses the track expression to identify which items were added, removed, or moved. Without tracking, Angular would destroy and recreate ALL DOM elements on every change. Making it mandatory prevents developers from accidentally creating performance problems.

### 6.3 The inject() Function

**What is `inject()`?** It's a function that retrieves a dependency from Angular's DI system. It's the modern alternative to constructor injection. Instead of declaring dependencies as constructor parameters, you call `inject()` in field initializers or the constructor body.

**Why use `inject()` over constructor injection?** Several reasons:
1. **Less boilerplate:** No need for `private` parameter declarations in the constructor
2. **Works in functions:** You can use `inject()` in functional interceptors, guards, and resolvers (which don't have constructors)
3. **Easier inheritance:** Subclasses don't need to pass dependencies to `super()`
4. **Better type inference:** TypeScript infers the type automatically

**What this code does:** Comparison of constructor injection vs. `inject()`, showing how the modern approach reduces boilerplate.

```typescript
// ─── OLD WAY: Constructor injection ───
// Every dependency is a constructor parameter with access modifiers.
// If you have 5 dependencies, the constructor signature gets very long.
@Component({ /* ... */ })
export class OldStyleComponent {
  constructor(
    private authService: AuthService,          // Dependency 1
    private userService: UserService,          // Dependency 2
    private router: Router,                    // Dependency 3
    private route: ActivatedRoute,             // Dependency 4
    private notificationService: NotificationService,  // Dependency 5
  ) {}
  // Problem: constructor is cluttered with dependency declarations.
  // Problem: subclasses must call super() with all parent dependencies.
}

// ─── NEW WAY: inject() function ───
// Dependencies are declared as class fields using inject().
// The constructor is free for actual initialization logic (or can be omitted entirely).
@Component({ /* ... */ })
export class ModernComponent {
  // Each dependency is a clean one-liner.
  // TypeScript automatically infers the type from inject().
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  // Constructor is clean — only used for actual initialization logic, if needed.
  // No dependency parameters cluttering the signature.
}

// ─── inject() in functional contexts ───
// inject() is the ONLY way to get dependencies in functions (no constructor available).

// Functional route guard — protects routes based on authentication.
export const authGuard: CanActivateFn = () => {
  // inject() works here because Angular creates an injection context for guards.
  const authService = inject(AuthService);
  const router = inject(Router);

  // If the user is authenticated, allow navigation (return true).
  // If not, redirect to the login page (return a UrlTree).
  if (authService.isAuthenticated()) {
    return true;
  }
  // router.createUrlTree() creates a redirect instruction.
  return router.createUrlTree(['/login']);
};

// Functional resolver — fetches data before a route activates.
export const userResolver: ResolveFn<User> = (route) => {
  const userService = inject(UserService);
  // route.paramMap.get('id') extracts the :id parameter from the URL.
  // e.g., for "/users/123", this returns "123".
  return userService.getUser(route.paramMap.get('id')!);
};
```

> **Key Takeaway:** `inject()` is the modern way to declare dependencies in Angular. It works in components, services, directives, pipes, interceptors, guards, and resolvers. It reduces boilerplate, simplifies inheritance, and is the ONLY option in functional contexts (where there's no constructor). Use `inject()` in all new code.

**Common Interview Follow-up:** "Can you use `inject()` anywhere?" No — it must be called in an "injection context." This means: during class construction (field initializers or constructor body), inside factory functions (`useFactory`, `InjectionToken` factories), or inside Angular-provided functional contexts (guards, resolvers, interceptors). You CANNOT call `inject()` inside `ngOnInit()`, event handlers, or setTimeout callbacks.

📝 **Section 6 Summary:**
- Signals (`signal`, `computed`, `effect`) are Angular's new reactive primitive for fine-grained change detection
- New control flow (`@if`, `@for`, `@switch`) replaces structural directives with cleaner, more powerful syntax
- `inject()` is the modern alternative to constructor injection — less boilerplate, works in functional contexts
- These features represent Angular's direction: simpler APIs, better performance, less boilerplate

---

## 7. Quick Summary

This section recaps every major concept covered in this guide. Use it as a quick review before an interview or as a checklist to make sure you understand each topic.

### Standalone Components (Section 1)
- Standalone components use `standalone: true` and declare their own dependencies via `imports` — no NgModule required
- They enable **component-level lazy loading** (more granular than module-level) and **better tree-shaking** (unused components are excluded from the bundle)
- `bootstrapApplication()` + `ApplicationConfig` replaces `AppModule` for app startup
- `loadComponent` lazy-loads a single component; `loadChildren` lazy-loads a group of routes
- Route-scoped `providers` create isolated service instances that are garbage-collected when the user navigates away
- Migration from NgModules is incremental — standalone and NgModule components can coexist
- `ng generate @angular/core:standalone` automates the migration

### Dependency Injection (Section 2)
- Angular's DI is **hierarchical** — injectors exist at platform, root, module, and component levels
- Service resolution walks UP the tree: component → parent → root → platform → error
- `providedIn: 'root'` creates a tree-shakable app-wide singleton
- Component `providers` create per-instance services; `viewProviders` hide services from projected content
- Resolution modifiers control WHERE Angular looks: `@Optional()` (null if missing), `@Self()` (local only), `@SkipSelf()` (parent only), `@Host()` (stop at host boundary)
- `InjectionToken` creates DI keys for non-class values (configs, feature flags)
- `multi: true` collects multiple providers into an array (plugin pattern)
- Factory providers (`useFactory`) handle complex service initialization

### HTTP Interceptors (Section 3)
- Interceptors are **middleware** for HTTP requests — they form a chain (pipeline)
- Request flows forward through the chain (top → bottom); response flows backward (bottom → top)
- **Order matters:** auth first, error handling last
- Functional interceptors (Angular 15+) are simpler than class-based ones
- Auth interceptor pattern: add token → detect 401 → refresh token → queue concurrent requests → replay
- `BehaviorSubject` coordinates multiple requests waiting for a token refresh
- Retry interceptor uses **exponential backoff with jitter** for transient failures
- Only retry **idempotent** methods (GET, PUT, DELETE) — never retry POST

### Error Handling (Section 4)
- Override Angular's `ErrorHandler` for a global safety net that catches all unhandled errors
- **Classify errors** into categories: network, server, client, validation, auth
- Show **user-friendly messages** (never expose stack traces); log full details to monitoring services
- Network and server errors are retryable; validation and auth errors need user action

### Enterprise Patterns (Section 5)
- **Smart components** handle business logic (data fetching, state, navigation)
- **Presentational components** handle UI (inputs, outputs, rendering) — use `OnPush` change detection
- The **facade pattern** provides a single clean API that hides the complexity of multiple services
- Organize code by **feature** (users/, dashboard/, admin/), not by type (components/, services/)
- Follow the **core/shared/features** three-layer architecture

### Modern Angular Features (Section 6)
- **Signals:** `signal()` for writable state, `computed()` for derived state, `effect()` for side effects
- Signals enable **fine-grained change detection** — only affected DOM elements update
- **New control flow:** `@if`, `@for` (with mandatory `track`), `@switch` replace `*ngIf`, `*ngFor`, `ngSwitch`
- `@empty` block in `@for` handles empty collections elegantly
- **`inject()` function** is the modern alternative to constructor injection — less boilerplate, works in functional contexts
- `inject()` must be called in an injection context (field initializers, constructors, factory functions, functional guards/interceptors)
- Use `toSignal()` and `toObservable()` to convert between Signals and RxJS Observables

---

> **Final Note:** This guide covers the core architectural patterns and best practices for modern Angular applications. In an architect-level interview, focus on explaining the WHY behind each pattern, not just the HOW. Interviewers want to see that you understand the trade-offs, can make informed decisions, and can communicate complex concepts clearly. Good luck! 🚀
