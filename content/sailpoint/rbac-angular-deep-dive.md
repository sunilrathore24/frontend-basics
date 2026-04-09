# Role-Based UI in Angular — Complete Implementation Guide
## Deep Dive with Full Code

> **Interview Question:** "How would you implement role-based UI in Angular?"
>
> **Complete Answer Covers:**
> 1. Permission Service (BehaviorSubject — source of truth)
> 2. Custom Structural Directive (`*appHasPermission`)
> 3. Route Guard (`CanActivate`)
> 4. HTTP Interceptor (403 handling)
> 5. How all 4 pieces wire together
> 6. SailPoint context

---

## The Big Picture — Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RBAC Architecture                        │
│                                                             │
│  Login → PermissionService (BehaviorSubject<string[]>)      │
│               │                                             │
│               ├──► AuthGuard (CanActivate)                  │
│               │         └── blocks route if no permission   │
│               │                                             │
│               ├──► *appHasPermission directive              │
│               │         └── shows/hides DOM elements        │
│               │                                             │
│               └──► AuthInterceptor (HTTP 403 handler)       │
│                         └── catches backend permission      │
│                             denials, redirects/notifies     │
└─────────────────────────────────────────────────────────────┘
```

**Why 4 layers?**
- Directive alone = UI-only protection (user can still navigate to route)
- Guard alone = route protection (but no fine-grained element hiding)
- Interceptor alone = reactive to backend (but too late — request already made)
- All 4 together = defense in depth

---

## Step 1: Define the Permission Model

```typescript
// models/permission.model.ts

// Permissions are strings — easy to extend, compare, and store
export type Permission =
  | 'identity:read'
  | 'identity:write'
  | 'identity:delete'
  | 'role:read'
  | 'role:write'
  | 'certification:read'
  | 'certification:approve'
  | 'admin:access'
  | 'report:view';

export interface UserRole {
  id: string;
  name: string;           // e.g. "Admin", "Reviewer", "Auditor"
  permissions: Permission[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
}
```

**Why string-based permissions (not enum)?**
- Easier to receive from backend API as-is
- No mapping layer needed
- Can be stored in JWT claims directly

---

## Step 2: Permission Service — The Single Source of Truth

```typescript
// services/permission.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, distinctUntilChanged } from 'rxjs';
import { AuthUser, Permission } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {

  // BehaviorSubject: always has a current value, new subscribers
  // immediately get the latest user state (even if they subscribe late)
  private currentUser$ = new BehaviorSubject<AuthUser | null>(null);

  // Expose as Observable (not Subject) — consumers can read, not write
  readonly user$ = this.currentUser$.asObservable();

  // Derived observable: flat list of all permissions across all roles
  readonly permissions$: Observable<Permission[]> = this.currentUser$.pipe(
    map(user => {
      if (!user) return [];
      // Flatten all roles → all permissions, deduplicate
      const all = user.roles.flatMap(role => role.permissions);
      return [...new Set(all)];
    }),
    distinctUntilChanged(
      (prev, curr) =>
        prev.length === curr.length &&
        prev.every(p => curr.includes(p))
    )
  );

  /** Called after login — sets the authenticated user */
  setUser(user: AuthUser): void {
    this.currentUser$.next(user);
  }

  /** Called on logout — clears all permissions */
  clearUser(): void {
    this.currentUser$.next(null);
  }

  /**
   * Synchronous check — use in guards and interceptors
   * BehaviorSubject.getValue() gives current value without subscribing
   */
  hasPermission(permission: Permission): boolean {
    const user = this.currentUser$.getValue();
    if (!user) return false;
    return user.roles.some(role => role.permissions.includes(permission));
  }

  /**
   * Check multiple permissions
   * mode 'any' = OR logic (at least one)
   * mode 'all' = AND logic (every one)
   */
  hasPermissions(permissions: Permission[], mode: 'any' | 'all' = 'any'): boolean {
    if (mode === 'all') return permissions.every(p => this.hasPermission(p));
    return permissions.some(p => this.hasPermission(p));
  }

  /** Observable version — use in components that react to permission changes */
  hasPermission$(permission: Permission): Observable<boolean> {
    return this.permissions$.pipe(
      map(perms => perms.includes(permission)),
      distinctUntilChanged()
    );
  }

  hasRole(roleName: string): boolean {
    const user = this.currentUser$.getValue();
    if (!user) return false;
    return user.roles.some(role => role.name === roleName);
  }
}
```

**Why `BehaviorSubject` specifically?**

| Need | Why BehaviorSubject fits |
|------|--------------------------|
| Always know current user | Has initial value, `.getValue()` works synchronously |
| Guards need sync check | `.getValue()` returns current value without subscribing |
| Components react to changes | `.asObservable()` for reactive subscriptions |
| Late subscribers (lazy routes) | New subscriber immediately gets current user state |

---

## Step 3: Custom Structural Directive — `*appHasPermission`

```typescript
// directives/has-permission.directive.ts
import {
  Directive, Input, OnInit, OnDestroy,
  TemplateRef, ViewContainerRef, inject
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PermissionService } from '../services/permission.service';
import { Permission } from '../models/permission.model';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {

  @Input('appHasPermission') permission!: Permission | Permission[];
  @Input('appHasPermissionMode') mode: 'any' | 'all' = 'any';
  @Input('appHasPermissionElse') elseTemplate?: TemplateRef<unknown>;

  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);
  private destroy$ = new Subject<void>();
  private hasView = false;

  ngOnInit(): void {
    // Subscribe to permission changes — directive reacts dynamically
    // If admin revokes a role mid-session, UI updates immediately
    this.permissionService.permissions$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.updateView());
  }

  private updateView(): void {
    const permissions = Array.isArray(this.permission)
      ? this.permission : [this.permission];

    const hasAccess = this.permissionService.hasPermissions(permissions, this.mode);

    if (hasAccess && !this.hasView) {
      // Permission granted — render the template into the DOM
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;

    } else if (!hasAccess && this.hasView) {
      // Permission revoked — REMOVE from DOM entirely
      this.viewContainer.clear();
      this.hasView = false;
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }

    } else if (!hasAccess && !this.hasView && this.elseTemplate) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplate);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### How to Use the Directive

```html
<!-- Basic: show only if user has this permission -->
<button *appHasPermission="'identity:delete'">Delete Identity</button>

<!-- OR logic (default): show if user has identity:write OR admin:access -->
<div *appHasPermission="['identity:write', 'admin:access']">
  Edit Panel
</div>

<!-- AND logic: show only if user has BOTH permissions -->
<div *appHasPermission="['certification:read', 'certification:approve']"
     appHasPermissionMode="all">
  Approve Certification
</div>

<!-- With else template: show fallback when no permission -->
<section *appHasPermission="'admin:access'; else noAccess">
  <app-admin-panel />
</section>

<ng-template #noAccess>
  <p>You don't have access to this section.</p>
</ng-template>
```

**Why structural directive over alternatives?**

```html
<!-- ❌ ngIf — leaks permission logic into every component -->
<button *ngIf="user?.roles?.includes('admin')">Delete</button>

<!-- ❌ CSS hide — element still EXISTS in DOM, visible in DevTools -->
<button [style.display]="canDelete ? 'block' : 'none'">Delete</button>

<!-- ✅ Structural directive — REMOVES from DOM, logic centralized -->
<button *appHasPermission="'identity:delete'">Delete</button>
```

The structural directive uses `ViewContainerRef` to physically add/remove the element from the DOM. The element does not exist at all for unauthorized users — not just hidden.

---

## Step 4: Route Guard — `CanActivate`

```typescript
// guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { Permission } from '../models/permission.model';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  // Check if user is logged in at all
  const user = permissionService['currentUser$'].getValue();
  if (!user) {
    // Preserve intended URL as returnUrl query param
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: route.url.join('/') }
    });
  }

  // Check route-specific permission (defined in route data)
  const requiredPermission = route.data?.['permission'] as Permission | undefined;
  if (requiredPermission && !permissionService.hasPermission(requiredPermission)) {
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const requiredRole = route.data?.['role'] as string | undefined;
  if (requiredRole && !permissionService.hasRole(requiredRole)) {
    return router.createUrlTree(['/unauthorized']);
  }

  return true;
};
```

### Wiring Guards into Routes

```typescript
// app.routes.ts
export const APP_ROUTES: Routes = [
  {
    path: 'identities',
    canActivate: [authGuard],
    data: { permission: 'identity:read' },
    loadComponent: () => import('./pages/identities/identities.component')
      .then(c => c.IdentitiesComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],   // Both guards run in sequence
    data: { permission: 'admin:access', role: 'Admin' },
    loadChildren: () => import('./pages/admin/admin.routes')
      .then(r => r.ADMIN_ROUTES)
  },
  {
    path: 'certifications',
    canActivate: [authGuard],
    data: { permission: 'certification:read' },
    loadComponent: () => import('./pages/certifications/certifications.component')
      .then(c => c.CertificationsComponent),
    children: [
      {
        path: ':id/approve',
        canActivate: [authGuard],
        data: { permission: 'certification:approve' }  // Nested permission
      }
    ]
  }
];
```

**Guard execution flow:**

```
User navigates to /admin
        │
        ▼
  authGuard runs
  ├── No user?  → redirect /login?returnUrl=/admin
  └── Has user? → check data.permission
        ├── No 'admin:access'? → redirect /unauthorized
        └── Has permission?
              │
              ▼
          roleGuard runs
          ├── No 'Admin' role? → redirect /unauthorized
          └── Has role? → ✅ Route activates
```

---

## Step 5: HTTP Interceptor — 403 Handler

```typescript
// interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private permissionService: PermissionService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    // 1. Attach auth token to every outgoing request
    const token = localStorage.getItem('auth_token');
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    // 2. Handle response errors
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {

          case 401: // Token expired or invalid
            this.permissionService.clearUser();
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: this.router.url }
            });
            break;

          case 403: // Logged in but lacks permission
            // Option A: Redirect
            this.router.navigate(['/unauthorized']);
            // Option B: Toast notification (better UX for partial page actions)
            // this.notificationService.error('Access Denied', 'You lack permission.');
            break;
        }

        // Always re-throw — components can still handle locally if needed
        return throwError(() => error);
      })
    );
  }
}
```

### Register the Interceptor

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true  // multi: true allows multiple interceptors to coexist
    }
  ]
};
```

**Why the interceptor is necessary even with guards and directives:**

```
Scenario: User has 'identity:read' but NOT 'identity:delete'

Without interceptor:
  1. Guard lets user into /identities ✅
  2. Directive hides Delete button ✅
  3. User opens DevTools → calls DELETE /api/identities/123 manually
  4. Backend returns 403
  5. Angular app shows raw error or crashes ❌

With interceptor:
  1–3. Same ✅
  4. Backend returns 403
  5. Interceptor catches → shows "Access Denied" toast ✅
  6. App stays stable, user gets clear feedback ✅
```

---

## Step 6: Login Flow — Wiring It All Together

```typescript
// services/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(
    private http: HttpClient,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: AuthUser }>(
      '/api/auth/login', { email, password }
    ).pipe(
      tap(response => {
        // 1. Store token (interceptor will attach it to all future requests)
        localStorage.setItem('auth_token', response.token);

        // 2. Hydrate PermissionService — this single call:
        //    - Updates BehaviorSubject
        //    - Triggers all *appHasPermission directives to re-evaluate
        //    - Makes guards work for subsequent navigation
        this.permissionService.setUser(response.user);

        // 3. Navigate to intended page or default
        const returnUrl = new URLSearchParams(window.location.search)
          .get('returnUrl') || '/identities';
        this.router.navigateByUrl(returnUrl);
      })
    );
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.permissionService.clearUser(); // BehaviorSubject → null → directives react
    this.router.navigate(['/login']);
  }
}
```

---

## Step 7: Real Component — Everything Together

```typescript
// pages/identities/identities.component.ts
@Component({
  selector: 'app-identities',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div class="page-header">
      <h1>Identities</h1>

      <button *appHasPermission="'identity:write'" (click)="createIdentity()">
        + New Identity
      </button>
    </div>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th *appHasPermission="['identity:write', 'identity:delete']">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let identity of identities; trackBy: trackById">
          <td>{{ identity.name }}</td>
          <td>{{ identity.email }}</td>
          <td *appHasPermission="['identity:write', 'identity:delete']">

            <button *appHasPermission="'identity:write'"
                    (click)="editIdentity(identity)">Edit</button>

            <button *appHasPermission="'identity:delete'"
                    (click)="deleteIdentity(identity)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <section *appHasPermission="'admin:access'; else noAdminAccess">
      <h2>Admin Controls</h2>
      <app-admin-panel />
    </section>

    <ng-template #noAdminAccess>
      <p>Admin controls are not available for your role.</p>
    </ng-template>
  `
})
export class IdentitiesComponent {
  identities: any[] = [];
  trackById = (_: number, item: any) => item.id;
  createIdentity() {}
  editIdentity(identity: any) {}
  deleteIdentity(identity: any) {}
}
```

---

## Step 8: Dynamic Permission Changes (Mid-Session)

A key advantage of BehaviorSubject — if permissions change mid-session, the UI updates automatically without a page reload.

```typescript
// Poll for role changes every 5 minutes
@Injectable({ providedIn: 'root' })
export class RoleUpdateService {
  constructor(
    private permissionService: PermissionService,
    private http: HttpClient
  ) {}

  startPolling() {
    interval(5 * 60 * 1000).pipe(
      switchMap(() => this.http.get<AuthUser>('/api/auth/me'))
    ).subscribe(updatedUser => {
      // This single line updates ALL directives and guards simultaneously
      this.permissionService.setUser(updatedUser);
      // BehaviorSubject emits → permissions$ emits → every directive re-evaluates
      // Elements appear/disappear based on new permissions — no page reload needed
    });
  }
}
```

---

## Complete File Structure

```
src/app/
├── models/
│   └── permission.model.ts          ← Permission types, UserRole, AuthUser
├── services/
│   ├── permission.service.ts        ← BehaviorSubject, hasPermission()
│   └── auth.service.ts              ← login(), logout(), token management
├── directives/
│   └── has-permission.directive.ts  ← *appHasPermission structural directive
├── guards/
│   └── auth.guard.ts                ← authGuard, roleGuard (CanActivateFn)
├── interceptors/
│   └── auth.interceptor.ts          ← 401/403 handling, token injection
└── app.routes.ts                    ← Routes with canActivate + data.permission
```

---

## Interview Answer Summary (Say This Out Loud)

> "I'd implement RBAC in Angular using 4 layers that work together:
>
> **First**, a `PermissionService` using a `BehaviorSubject` to hold the current user's roles and permissions. I use `BehaviorSubject` specifically because it always has a current value — guards can read it synchronously with `.getValue()`, and components can subscribe reactively. It's the single source of truth.
>
> **Second**, a custom structural directive `*appHasPermission` that subscribes to the permission service and uses `ViewContainerRef` to add or remove elements from the DOM entirely — not just hide them with CSS. This means sensitive UI never exists in the DOM for unauthorized users.
>
> **Third**, route guards using Angular's `CanActivateFn` that check permissions before a route activates. I put the required permission in the route's `data` object so the guard is generic and reusable across all routes.
>
> **Fourth**, an HTTP interceptor that catches 403 responses from the backend. This is the safety net — even if someone bypasses the UI, the backend will deny the request and the interceptor handles it gracefully.
>
> The key insight is that these 4 layers serve different purposes: the directive handles UI visibility, the guard handles navigation, and the interceptor handles API-level denials. You need all three for proper defense in depth."

---

## Key Trade-offs to Mention

| Decision | Why |
|----------|-----|
| BehaviorSubject over plain Observable | Sync `.getValue()` needed in guards; late subscribers get current state immediately |
| Structural directive over CSS hide | Removes from DOM entirely — no security through obscurity |
| Functional guards over class guards | Less boilerplate, easier to compose, Angular 15+ recommended |
| String permissions over enum | Matches backend API format directly, no mapping layer needed |
| `multi: true` on interceptor | Allows multiple interceptors to coexist (auth + logging + error handling) |
| Re-throw error in interceptor | Components can still handle errors locally if needed |
