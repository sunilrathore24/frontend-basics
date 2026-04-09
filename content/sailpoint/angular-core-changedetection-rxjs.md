# Angular Core, Change Detection & RxJS
## Architect-Level Interview Guide

> Comprehensive interview preparation covering Angular core architecture, change detection strategies, RxJS mastery, performance optimization, and modern Angular features.

---

## Table of Contents - Part 1
1. [Angular Core Architecture](#1-angular-core-architecture)
2. [Change Detection](#2-change-detection)
3. [RxJS Mastery](#3-rxjs-mastery)
4. [Performance Optimization](#4-performance-optimization)
5. [Modern Angular Features](#5-modern-angular-features)

---

## 1. Angular Core Architecture

### Q1.1: Explain the Angular application architecture in detail

**Architect-Level Answer:**

Angular follows a component-based architecture built on several core concepts:

**1. Hierarchical Component Tree**
```typescript
// Root component bootstraps the entire application
@Component({
  selector: 'app-root',
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `
})
export class AppComponent {}
```

**2. Module System (Traditional)**
```typescript
@NgModule({
  declarations: [AppComponent, HeaderComponent],  // Components, Directives, Pipes
  imports: [BrowserModule, HttpClientModule],     // External modules
  providers: [AuthService],                       // Services (DI)
  bootstrap: [AppComponent]                       // Entry point
})
export class AppModule {}
```

**3. Dependency Injection Hierarchy**
- **Root Injector**: Singleton services (`providedIn: 'root'`)
- **Module Injector**: Feature module scoped services
- **Component Injector**: Component-level services

**4. Data Flow Architecture**
```
User Action → Component → Service → HTTP → Backend
                ↓           ↓
            Template ← Observable/Signal
```

**Key Architectural Principles:**
- **Separation of Concerns**: Components (UI), Services (Business Logic), Modules (Organization)
- **Unidirectional Data Flow**: Parent → Child via @Input, Child → Parent via @Output
- **Reactive Programming**: RxJS Observables for async operations
- **Lazy Loading**: Route-based code splitting for performance

**SailPoint Context**: In enterprise identity management UIs, this architecture supports complex workflows like access requests, certification campaigns, and role management with clear separation between presentation and business logic.

---

### Q1.2: What are the core building blocks of Angular?

**Architect-Level Answer:**

**1. Components** - UI Building Blocks
```typescript
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UserProfileService]  // Component-scoped service
})
export class UserProfileComponent implements OnInit, OnDestroy {
  @Input() userId: string;
  @Output() profileUpdated = new EventEmitter<User>();
  
  user$ = this.userService.getUser(this.userId);
  
  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}
}
```

**2. Directives** - DOM Manipulation
```typescript
// Structural Directive - Changes DOM structure
@Directive({ selector: '[appPermission]' })
export class PermissionDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}
  
  @Input() set appPermission(permission: string) {
    if (this.authService.hasPermission(permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

// Attribute Directive - Changes appearance/behavior
@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'background-color', 'yellow');
  }
}
```

**3. Services** - Business Logic & State
```typescript
@Injectable({ providedIn: 'root' })
export class IdentityService {
  private identitiesSubject = new BehaviorSubject<Identity[]>([]);
  identities$ = this.identitiesSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  loadIdentities(): Observable<Identity[]> {
    return this.http.get<Identity[]>('/api/identities').pipe(
      tap(identities => this.identitiesSubject.next(identities)),
      catchError(this.handleError)
    );
  }
}
```

**4. Pipes** - Data Transformation
```typescript
// Pure Pipe - Cached results
@Pipe({ name: 'userRole', pure: true })
export class UserRolePipe implements PipeTransform {
  transform(user: User, roleType: string): string {
    return user.roles.find(r => r.type === roleType)?.name || 'N/A';
  }
}

// Impure Pipe - Runs on every change detection
@Pipe({ name: 'filterActive', pure: false })
export class FilterActivePipe implements PipeTransform {
  transform(items: any[]): any[] {
    return items.filter(item => item.active);
  }
}
```

**5. Modules** - Code Organization
```typescript
@NgModule({
  declarations: [IdentityListComponent, IdentityDetailComponent],
  imports: [
    CommonModule,
    IdentityRoutingModule,
    SharedModule
  ],
  providers: [
    IdentityService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class IdentityModule {}
```

**6. Guards** - Route Protection
```typescript
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.auth.hasRole('ADMIN').pipe(
      tap(hasRole => {
        if (!hasRole) this.router.navigate(['/unauthorized']);
      })
    );
  }
}
```

**7. Interceptors** - HTTP Middleware
```typescript
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token');
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next.handle(authReq);
  }
}
```

---

### Q1.3: How does Dependency Injection work in Angular?

**Architect-Level Answer:**

Angular's DI system is a hierarchical injector tree that provides dependencies to components and services.

**1. Injector Hierarchy**
```
Root Injector (providedIn: 'root')
    ↓
Platform Injector (BrowserModule)
    ↓
Module Injector (Feature Modules)
    ↓
Component Injector (Component providers)
    ↓
Element Injector (Directive providers)
```

**2. Provider Configuration**

```typescript
// Method 1: Tree-shakable (Recommended)
@Injectable({ providedIn: 'root' })
export class GlobalService {
  // Singleton across entire app
  // Automatically removed if unused (tree-shaking)
}

// Method 2: Module-level
@NgModule({
  providers: [
    FeatureService,  // New instance per module
    { provide: API_URL, useValue: 'https://api.sailpoint.com' },
    { provide: LoggerService, useClass: ConsoleLoggerService },
    { provide: DataService, useFactory: dataServiceFactory, deps: [HttpClient] }
  ]
})
export class FeatureModule {}

// Method 3: Component-level
@Component({
  providers: [LocalService]  // New instance per component
})
export class MyComponent {}
```

**3. Resolution Modifiers**

```typescript
export class ComplexComponent {
  constructor(
    // Default: Look up the injector tree
    private defaultService: DefaultService,
    
    // @Optional: Don't throw error if not found
    @Optional() private optionalService?: OptionalService,
    
    // @Self: Only look in current injector
    @Self() private localService: LocalService,
    
    // @SkipSelf: Skip current injector, look in parent
    @SkipSelf() private parentService: ParentService,
    
    // @Host: Look up to host component only
    @Host() private hostService: HostService
  ) {}
}
```

**4. InjectionToken for Non-Class Dependencies**

```typescript
// Define token
export const API_CONFIG = new InjectionToken<ApiConfig>('api.config');

// Provide value
@NgModule({
  providers: [
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: 'https://api.sailpoint.com',
        timeout: 30000,
        retryAttempts: 3
      }
    }
  ]
})
export class AppModule {}

// Inject
export class ApiService {
  constructor(@Inject(API_CONFIG) private config: ApiConfig) {
    console.log(this.config.baseUrl);
  }
}
```

**5. Modern inject() Function (Angular 14+)**

```typescript
export class ModernComponent {
  // No constructor needed
  private http = inject(HttpClient);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  
  // Can be used in functions
  loadData = () => {
    const logger = inject(LoggerService);
    return this.http.get('/api/data').pipe(
      tap(data => logger.log('Data loaded', data))
    );
  };
}
```

**6. Multi-Providers**

```typescript
// Multiple interceptors
@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
})
```

**7. Lazy Loading Impact**

```typescript
// Eager module - shares root injector
@NgModule({
  providers: [SharedService]  // Singleton
})
export class EagerModule {}

// Lazy module - creates child injector
const routes: Routes = [{
  path: 'admin',
  loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
}];

@NgModule({
  providers: [AdminService]  // New instance per lazy load
})
export class AdminModule {}
```

**SailPoint Context**: In identity management systems, DI is crucial for:
- Injecting different authentication strategies (SAML, OAuth, LDAP)
- Providing environment-specific API endpoints
- Managing user session state across components
- Implementing role-based service access

---

### Q1.4: Difference between NgModule vs Standalone Components

**Architect-Level Answer:**

**Traditional NgModule Approach (Angular 2-13)**

```typescript
// Feature Module
@NgModule({
  declarations: [
    UserListComponent,
    UserDetailComponent,
    UserFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    UserRoutingModule
  ],
  providers: [UserService],
  exports: [UserListComponent]  // Make available to other modules
})
export class UserModule {}

// Usage requires importing entire module
@NgModule({
  imports: [UserModule]  // Imports all declarations
})
export class AppModule {}
```

**Standalone Components (Angular 14+)**

```typescript
// Standalone Component
@Component({
  selector: 'app-user-list',
  standalone: true,  // Key difference
  imports: [
    CommonModule,
    FormsModule,
    UserCardComponent,  // Import components directly
    UserFilterPipe
  ],
  template: `
    <div *ngFor="let user of users">
      <app-user-card [user]="user"></app-user-card>
    </div>
  `
})
export class UserListComponent {
  users = inject(UserService).getUsers();
}

// Direct usage without NgModule
import { UserListComponent } from './user-list.component';

// In routes
const routes: Routes = [{
  path: 'users',
  loadComponent: () => import('./user-list.component').then(m => m.UserListComponent)
}];

// In another component
@Component({
  standalone: true,
  imports: [UserListComponent],  // Direct import
  template: '<app-user-list></app-user-list>'
})
export class DashboardComponent {}
```

**Key Differences:**

| Aspect | NgModule | Standalone |
|--------|----------|------------|
| **Declaration** | Required in NgModule | `standalone: true` |
| **Imports** | Module-level | Component-level |
| **Dependencies** | Implicit via module | Explicit in component |
| **Tree-shaking** | Module-level | Component-level (better) |
| **Lazy Loading** | `loadChildren` | `loadComponent` |
| **Boilerplate** | High (module files) | Low (self-contained) |
| **Migration** | All-or-nothing | Gradual |

**Hybrid Approach (Recommended for Large Apps)**

```typescript
// Standalone component using NgModule-based library
@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,  // Still import Angular Material modules
    MatIconModule
  ],
  template: `
    <button mat-raised-button>
      <mat-icon>save</mat-icon>
      Save
    </button>
  `
})
export class SaveButtonComponent {}

// Bootstrapping standalone app
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    { provide: API_URL, useValue: 'https://api.sailpoint.com' }
  ]
});
```

**Migration Strategy:**

```typescript
// Step 1: Create standalone components
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: '...'
})
export class NewComponent {}

// Step 2: Use in NgModule (backward compatible)
@NgModule({
  imports: [NewComponent],  // Import standalone component
  declarations: [OldComponent]
})
export class FeatureModule {}

// Step 3: Gradually convert all components
// Step 4: Remove NgModule when all components are standalone
```

**When to Use Each:**

**Use NgModule when:**
- Working with legacy Angular applications
- Team is not familiar with standalone components
- Using third-party libraries that require NgModule

**Use Standalone when:**
- Starting new projects (Angular 15+)
- Want better tree-shaking and smaller bundles
- Prefer explicit dependencies
- Need component-level lazy loading

**SailPoint Context**: For large identity management platforms, standalone components offer:
- Better code splitting for admin vs user-facing features
- Clearer dependency graphs for complex workflows
- Easier testing of isolated components
- Gradual migration from legacy ExtJS to modern Angular

---

### Q1.5: What is the difference between Component, Directive, and Pipe?

**Architect-Level Answer:**

**1. Components - UI with Template**

```typescript
@Component({
  selector: 'app-identity-card',
  template: `
    <div class="card">
      <h3>{{ identity.name }}</h3>
      <p>{{ identity.email }}</p>
      <button (click)="onEdit()">Edit</button>
    </div>
  `,
  styles: [`
    .card { padding: 16px; border: 1px solid #ccc; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentityCardComponent {
  @Input() identity: Identity;
  @Output() edit = new EventEmitter<Identity>();
  
  onEdit() {
    this.edit.emit(this.identity);
  }
}
```

**Characteristics:**
- Has its own template and styles
- Creates a new element in DOM
- Can have lifecycle hooks
- Manages its own state
- One component per element

**2. Directives - Behavior without Template**

**A. Structural Directives** - Modify DOM structure

```typescript
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private hasView = false;
  
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}
  
  @Input() set appHasPermission(permission: string) {
    this.authService.hasPermission(permission).subscribe(hasPermission => {
      if (hasPermission && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasPermission && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}

// Usage
<button *appHasPermission="'admin:delete'">Delete User</button>
```

**B. Attribute Directives** - Modify element behavior/appearance

```typescript
@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input() appTooltip: string;
  @Input() tooltipPosition: 'top' | 'bottom' = 'top';
  
  private tooltipElement: HTMLElement;
  
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private viewContainerRef: ViewContainerRef
  ) {}
  
  @HostListener('mouseenter')
  onMouseEnter() {
    this.showTooltip();
  }
  
  @HostListener('mouseleave')
  onMouseLeave() {
    this.hideTooltip();
  }
  
  private showTooltip() {
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'tooltip');
    this.renderer.setProperty(this.tooltipElement, 'textContent', this.appTooltip);
    this.renderer.appendChild(document.body, this.tooltipElement);
  }
}

// Usage
<button appTooltip="Click to save changes" tooltipPosition="top">Save</button>
```

**Characteristics:**
- No template (uses host element)
- Can be applied to multiple elements
- Modifies behavior or appearance
- Uses @HostListener and @HostBinding

**3. Pipes - Data Transformation**

**A. Pure Pipes** (Default - Cached)

```typescript
@Pipe({
  name: 'userStatus',
  pure: true,  // Default
  standalone: true
})
export class UserStatusPipe implements PipeTransform {
  transform(user: User, showIcon: boolean = false): string {
    const status = user.active ? 'Active' : 'Inactive';
    const icon = showIcon ? (user.active ? '✓' : '✗') : '';
    return `${icon} ${status}`;
  }
}

// Usage
<p>{{ user | userStatus:true }}</p>
```

**B. Impure Pipes** (Runs every change detection)

```typescript
@Pipe({
  name: 'filterByRole',
  pure: false,  // Runs on every CD cycle
  standalone: true
})
export class FilterByRolePipe implements PipeTransform {
  transform(users: User[], role: string): User[] {
    if (!role) return users;
    return users.filter(user => user.roles.includes(role));
  }
}

// Usage - filters array on every change
<div *ngFor="let user of users | filterByRole:selectedRole">
  {{ user.name }}
</div>
```

**C. Async Pipe** (Built-in, handles subscriptions)

```typescript
export class UserListComponent {
  users$ = this.userService.getUsers();
  
  constructor(private userService: UserService) {}
}

// Template - auto subscribe/unsubscribe
<div *ngFor="let user of users$ | async">
  {{ user.name }}
</div>
```

**Characteristics:**
- Pure functions for data transformation
- Used in templates with | syntax
- Pure pipes are cached (performance)
- Impure pipes run on every change detection

**Comparison Table:**

| Feature | Component | Directive | Pipe |
|---------|-----------|-----------|------|
| **Template** | Yes (required) | No | No |
| **Selector** | Element | Attribute/Element | Name |
| **Purpose** | UI + Logic | Behavior | Transform data |
| **Lifecycle** | Full lifecycle | Full lifecycle | Transform only |
| **State** | Can manage state | Can manage state | Stateless (pure) |
| **Usage** | `<app-comp>` | `<div directive>` | `{{ data \| pipe }}` |

**Real-World SailPoint Example:**

```typescript
// Component - Identity Card UI
@Component({
  selector: 'app-identity-card',
  template: `
    <div class="card" 
         appHighlight 
         [appTooltip]="identity.description">
      <h3>{{ identity.name | titlecase }}</h3>
      <p>{{ identity.email | lowercase }}</p>
      <span>{{ identity.lastLogin | date:'short' }}</span>
      <div *appHasPermission="'identity:edit'">
        <button (click)="onEdit()">Edit</button>
      </div>
    </div>
  `
})
export class IdentityCardComponent {
  @Input() identity: Identity;
  @Output() edit = new EventEmitter<Identity>();
}

// Directive - Highlight on hover
@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  @HostListener('mouseenter') onEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'background', '#f0f0f0');
  }
}

// Pipe - Format identity status
@Pipe({ name: 'identityStatus' })
export class IdentityStatusPipe implements PipeTransform {
  transform(identity: Identity): string {
    return identity.active ? '✓ Active' : '✗ Inactive';
  }
}
```

---

## 2. Change Detection

### Q2.1: Explain Angular change detection in detail

**Architect-Level Answer:**

Angular's change detection is the mechanism that synchronizes the application state with the UI. It checks for changes in component properties and updates the DOM accordingly.

**1. Change Detection Flow**

```
User Event / Async Operation
    ↓
Zone.js intercepts
    ↓
Angular Change Detection triggered
    ↓
Component Tree traversal (top-down)
    ↓
Check bindings for changes
    ↓
Update DOM if changed
```

**2. When Change Detection Runs**

```typescript
// Triggers change detection:
// 1. User events
<button (click)="increment()">Click</button>

// 2. HTTP requests
this.http.get('/api/users').subscribe(users => {
  this.users = users;  // CD runs after subscription
});

// 3. Timers
setTimeout(() => {
  this.message = 'Updated';  // CD runs after timeout
}, 1000);

// 4. Manual trigger
this.cdr.detectChanges();
this.cdr.markForCheck();
```

**3. Change Detection Strategies**

**Default Strategy** - Checks entire component tree

```typescript
@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.Default,  // Default
  template: `
    <div *ngFor="let user of users">
      {{ user.name }} - {{ getStatus(user) }}
    </div>
  `
})
export class UserListComponent {
  users: User[] = [];
  
  // Called on EVERY change detection cycle
  getStatus(user: User): string {
    console.log('getStatus called');  // Logs many times!
    return user.active ? 'Active' : 'Inactive';
  }
  
  updateUser(user: User) {
    user.name = 'Updated';  // Mutation detected
  }
}
```

**OnPush Strategy** - Checks only when inputs change

```typescript
@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      {{ user.name }}
      <button (click)="update()">Update</button>
    </div>
  `
})
export class UserCardComponent {
  @Input() user: User;  // Only checks when this reference changes
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  update() {
    // ❌ Won't trigger CD (mutation)
    this.user.name = 'Updated';
    
    // ✅ Triggers CD (new reference)
    this.user = { ...this.user, name: 'Updated' };
    
    // ✅ Manual trigger
    this.cdr.markForCheck();
  }
}
```

**4. Change Detection Tree Traversal**

```typescript
@Component({
  selector: 'app-root',
  template: `
    <app-header></app-header>
    <app-content [data]="data"></app-content>
    <app-footer></app-footer>
  `
})
export class AppComponent {
  data = { count: 0 };
  
  increment() {
    // Default: Checks AppComponent + Header + Content + Footer
    this.data.count++;
    
    // OnPush: Only checks components with changed inputs
    this.data = { count: this.data.count + 1 };
  }
}
```

**5. ChangeDetectorRef API**

```typescript
export class OptimizedComponent implements OnInit, OnDestroy {
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit() {
    // Detach from change detection tree
    this.cdr.detach();
    
    // Manual updates
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateData();
      this.cdr.detectChanges();  // Run CD for this component only
    });
  }
  
  // Mark for check in next CD cycle
  onDataReceived() {
    this.cdr.markForCheck();
  }
  
  // Reattach to CD tree
  enableAutoDetection() {
    this.cdr.reattach();
  }
}
```

**6. Zone.js Role**

```typescript
// Zone.js patches async APIs
// Before Zone.js
const originalSetTimeout = window.setTimeout;
window.setTimeout = function(callback, delay) {
  return originalSetTimeout(() => {
    callback();
    // Angular doesn't know about this
  }, delay);
};

// With Zone.js
window.setTimeout = function(callback, delay) {
  return originalSetTimeout(() => {
    callback();
    Zone.current.run(() => {
      // Angular triggers change detection here
      ApplicationRef.tick();
    });
  }, delay);
};
```

**7. Performance Optimization Patterns**

```typescript
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ✅ Async pipe - auto unsubscribe -->
    <div *ngFor="let user of users$ | async; trackBy: trackById">
      {{ user.name }}
    </div>
    
    <!-- ✅ Pure pipe - cached -->
    <p>{{ data | expensiveTransform }}</p>
    
    <!-- ❌ Method call - runs every CD -->
    <p>{{ calculateTotal() }}</p>
    
    <!-- ✅ Property - calculated once -->
    <p>{{ total }}</p>
  `
})
export class DashboardComponent {
  users$ = this.userService.getUsers();
  
  private _data: Data[];
  private _total: number;
  
  @Input() set data(value: Data[]) {
    this._data = value;
    this._total = this.calculateTotal();  // Calculate once
  }
  
  get total() {
    return this._total;
  }
  
  trackById(index: number, user: User) {
    return user.id;  // Prevents unnecessary re-renders
  }
}
```

**8. Debugging Change Detection**

```typescript
import { ApplicationRef } from '@angular/core';

export class DebugComponent {
  constructor(private appRef: ApplicationRef) {
    // Log every CD cycle
    this.appRef.isStable.subscribe(stable => {
      console.log('Change detection stable:', stable);
    });
  }
  
  // Enable Angular DevTools profiler
  ngAfterViewInit() {
    if (typeof ng !== 'undefined') {
      ng.profiler.timeChangeDetection();
    }
  }
}
```

**SailPoint Context**: In identity management dashboards with thousands of users:
- Use OnPush for user cards to prevent unnecessary checks
- Implement trackBy for large lists of identities
- Detach CD for real-time widgets that update frequently
- Use async pipe for observable streams from backend

---

