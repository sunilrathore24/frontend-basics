# 09 — Angular Unit Testing Strategies: Architect-Level Deep Dive

> A comprehensive guide to building a robust, maintainable, and scalable test suite for Angular applications. Covers testing philosophy, component/service/pipe/directive/guard testing, RxJS marble testing, mocking strategies, anti-patterns, and a testability checklist — all with extensive TypeScript + Jasmine/Jest examples.

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Component Testing](#2-component-testing)
3. [Service Testing](#3-service-testing)
4. [Pipe & Directive Testing](#4-pipe--directive-testing)
5. [Guard & Resolver Testing](#5-guard--resolver-testing)
6. [RxJS Testing](#6-rxjs-testing)
7. [Mocking Strategies](#7-mocking-strategies)
8. [Anti-Patterns That Kill Testability](#8-anti-patterns-that-kill-testability)
9. [Testing Checklist](#9-testing-checklist)

---

## 1. Testing Philosophy

### 1.1 Why Test?

Testing is not a tax on development — it is the **architectural backbone** that enables fearless refactoring, confident deployments, and living documentation. At the architect level, tests serve three critical purposes:

- **Regression Safety Net**: Every merged PR carries proof that existing behavior is preserved.
- **Design Feedback Loop**: Code that is hard to test is almost always poorly designed. Tests expose tight coupling, hidden dependencies, and SRP violations *before* they metastasize.
- **Executable Documentation**: A well-written test suite is the most accurate specification of what the system actually does — not what someone *intended* it to do.

### 1.2 The Testing Pyramid

```
         ╱  E2E Tests  ╲          ← Few, slow, brittle, high confidence
        ╱────────────────╲
       ╱ Integration Tests ╲      ← Moderate count, test module boundaries
      ╱──────────────────────╲
     ╱     Unit Tests          ╲  ← Many, fast, isolated, cheap to maintain
    ╱────────────────────────────╲
```

| Layer       | Angular Context                                  | Speed   | Count  |
|-------------|--------------------------------------------------|---------|--------|
| Unit        | Services, Pipes, Pure functions, Isolated classes | < 5ms   | 70-80% |
| Integration | Component + Template + Children (shallow/deep)   | < 50ms  | 15-25% |
| E2E         | Full app flows via Cypress/Playwright            | Seconds | 5-10%  |

### 1.3 Test-Friendly Architecture

Testable Angular code follows these structural principles:

```typescript
// ✅ TESTABLE: Logic extracted into injectable service
@Injectable({ providedIn: 'root' })
export class PricingCalculator {
  calculateDiscount(price: number, tier: 'gold' | 'silver' | 'bronze'): number {
    const rates = { gold: 0.2, silver: 0.1, bronze: 0.05 };
    return price * (1 - rates[tier]);
  }
}

// ✅ TESTABLE: Component delegates to service
@Component({
  selector: 'app-pricing',
  template: `<span>{{ finalPrice() }}</span>`
})
export class PricingComponent {
  private calculator = inject(PricingCalculator);
  price = input.required<number>();
  tier = input.required<'gold' | 'silver' | 'bronze'>();

  finalPrice = computed(() => this.calculator.calculateDiscount(this.price(), this.tier()));
}

// ❌ UNTESTABLE: Logic buried in component
@Component({
  selector: 'app-pricing-bad',
  template: `<span>{{ finalPrice }}</span>`
})
export class BadPricingComponent implements OnChanges {
  @Input() price!: number;
  @Input() tier!: string;
  finalPrice = 0;

  ngOnChanges() {
    // Business logic in component — impossible to test without TestBed
    const rates: Record<string, number> = { gold: 0.2, silver: 0.1, bronze: 0.05 };
    this.finalPrice = this.price * (1 - (rates[this.tier] || 0));
  }
}
```

**Architect's Rule**: If you need `TestBed` to test business logic, your architecture has a problem.

---

## 2. Component Testing

### 2.1 Smart vs Dumb Component Testing

**Dumb (Presentational) Components** — Pure input/output, no injected services:

```typescript
// ---- user-card.component.ts ----
@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    <div class="card" [class.active]="isActive()">
      <h3>{{ user().name }}</h3>
      <p>{{ user().email }}</p>
      <button (click)="onEdit.emit(user())">Edit</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardComponent {
  user = input.required<User>();
  isActive = input(false);
  onEdit = output<User>();
}

// ---- user-card.component.spec.ts ----
describe('UserCardComponent', () => {
  let fixture: ComponentFixture<UserCardComponent>;
  let component: UserCardComponent;
  let debugEl: DebugElement;

  const mockUser: User = { id: 1, name: 'Alice', email: 'alice@test.com' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
    debugEl = fixture.debugElement;

    // Set required signal inputs via ComponentRef
    fixture.componentRef.setInput('user', mockUser);
    fixture.componentRef.setInput('isActive', false);
    fixture.detectChanges();
  });

  it('should display user name and email', () => {
    const name = debugEl.query(By.css('h3')).nativeElement.textContent;
    const email = debugEl.query(By.css('p')).nativeElement.textContent;
    expect(name).toBe('Alice');
    expect(email).toBe('alice@test.com');
  });

  it('should apply active class when isActive is true', () => {
    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();

    const card = debugEl.query(By.css('.card'));
    expect(card.nativeElement.classList).toContain('active');
  });

  it('should emit user on edit click', () => {
    const editSpy = jasmine.createSpy('onEdit');
    component.onEdit.subscribe(editSpy);

    const button = debugEl.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(editSpy).toHaveBeenCalledWith(mockUser);
  });
});
```

**Smart (Container) Components** — Inject services, manage state:

```typescript
// ---- user-list.component.ts ----
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserCardComponent, AsyncPipe],
  template: `
    @for (user of users$ | async; track user.id) {
      <app-user-card [user]="user" (onEdit)="editUser($event)" />
    }
  `
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  users$ = this.userService.getUsers();

  editUser(user: User): void {
    this.router.navigate(['/users', user.id, 'edit']);
  }
}

// ---- user-list.component.spec.ts ----
describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUsers: User[] = [
    { id: 1, name: 'Alice', email: 'alice@test.com' },
    { id: 2, name: 'Bob', email: 'bob@test.com' }
  ];

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers']);
    userServiceSpy.getUsers.and.returnValue(of(mockUsers));

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    // Override child components for shallow testing
    .overrideComponent(UserListComponent, {
      remove: { imports: [UserCardComponent] },
      add: { imports: [MockUserCardComponent] }  // lightweight stub
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();
  });

  it('should fetch users on init', () => {
    expect(userServiceSpy.getUsers).toHaveBeenCalledTimes(1);
  });

  it('should render a card for each user', () => {
    const cards = fixture.debugElement.queryAll(By.directive(MockUserCardComponent));
    expect(cards.length).toBe(2);
  });

  it('should navigate to edit route on editUser', () => {
    fixture.componentInstance.editUser(mockUsers[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/users', 1, 'edit']);
  });
});
```

### 2.2 TestBed Configuration Patterns

```typescript
// Minimal TestBed for standalone components
await TestBed.configureTestingModule({
  imports: [ComponentUnderTest],
  providers: [
    { provide: SomeService, useValue: mockService }
  ]
}).compileComponents();

// TestBed with module-based components (legacy)
await TestBed.configureTestingModule({
  declarations: [ComponentUnderTest, ChildComponent],
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    { provide: SomeService, useClass: MockSomeService },
    { provide: ActivatedRoute, useValue: { params: of({ id: '42' }) } }
  ],
  schemas: [NO_ERRORS_SCHEMA]  // Use sparingly — hides template errors
}).compileComponents();
```

### 2.3 ComponentFixture & DebugElement Deep Dive

```typescript
describe('Fixture & DebugElement API', () => {
  let fixture: ComponentFixture<MyComponent>;
  let de: DebugElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyComponent);
    de = fixture.debugElement;
    fixture.detectChanges();
  });

  // Query by CSS selector
  it('should find element by CSS', () => {
    const el = de.query(By.css('.submit-btn'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent.trim()).toBe('Submit');
  });

  // Query by directive
  it('should find child component instances', () => {
    const childDe = de.query(By.directive(ChildComponent));
    const childInstance = childDe.componentInstance as ChildComponent;
    expect(childInstance.someInput).toBe('expected');
  });

  // Query all
  it('should find all list items', () => {
    const items = de.queryAll(By.css('li'));
    expect(items.length).toBe(5);
  });

  // Trigger events
  it('should handle click events', () => {
    const btn = de.query(By.css('button'));
    btn.triggerEventHandler('click', { stopPropagation: () => {} });
    fixture.detectChanges();
    // assert side effects
  });

  // Access component instance
  it('should access component properties', () => {
    const comp = fixture.componentInstance;
    expect(comp.isLoading).toBeFalse();
  });

  // Native element access
  it('should check native DOM attributes', () => {
    const input = de.query(By.css('input'));
    expect(input.nativeElement.getAttribute('aria-label')).toBe('Search');
  });
});
```

### 2.4 Async Testing Patterns

#### fakeAsync + tick

```typescript
describe('Debounced Search', () => {
  it('should debounce search input by 300ms', fakeAsync(() => {
    const searchSpy = spyOn(component, 'performSearch');

    component.searchControl.setValue('ang');
    tick(100);
    expect(searchSpy).not.toHaveBeenCalled();

    component.searchControl.setValue('angular');
    tick(300);  // Advance past debounce time
    fixture.detectChanges();

    expect(searchSpy).toHaveBeenCalledWith('angular');
  }));

  it('should handle setTimeout chains', fakeAsync(() => {
    component.startDelayedProcess();

    tick(1000);  // First timeout
    expect(component.step).toBe(1);

    tick(2000);  // Second timeout
    expect(component.step).toBe(2);

    flush();  // Drain all remaining async tasks
    expect(component.step).toBe(3);
  }));

  it('should handle setInterval', fakeAsync(() => {
    component.startPolling();

    tick(5000);  // 5 intervals at 1000ms each
    expect(component.pollCount).toBe(5);

    discardPeriodicTasks();  // Clean up intervals to avoid errors
  }));
});
```

#### waitForAsync

```typescript
describe('HTTP-dependent component', () => {
  it('should load data on init', waitForAsync(() => {
    // waitForAsync tracks real Promises and XHR — useful when fakeAsync cannot
    // intercept zone-unaware async (e.g., native fetch, some 3rd-party libs)
    fixture.detectChanges();  // triggers ngOnInit

    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('.item'));
      expect(items.length).toBeGreaterThan(0);
    });
  }));
});
```

#### When to use which?

| Scenario                          | Use              | Why                                      |
|-----------------------------------|------------------|------------------------------------------|
| `setTimeout`, `setInterval`       | `fakeAsync/tick` | Full control over virtual clock          |
| RxJS `delay`, `debounceTime`      | `fakeAsync/tick` | RxJS schedulers respect Zone.js clock    |
| Real HTTP via `HttpClient`        | `waitForAsync`   | Zone tracks XHR completion               |
| Native `fetch()` (zoneless)       | `waitForAsync`   | fakeAsync can't intercept native fetch   |
| Simple synchronous logic          | Neither          | Just call and assert                     |

### 2.5 Testing Components with Signals

```typescript
// ---- counter.component.ts ----
@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <span data-testid="count">{{ count() }}</span>
    <span data-testid="double">{{ doubleCount() }}</span>
    <button (click)="increment()">+</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment(): void {
    this.count.update(c => c + 1);
  }
}

// ---- counter.component.spec.ts ----
describe('CounterComponent (Signals)', () => {
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();
  });

  it('should display initial count of 0', () => {
    const countEl = fixture.debugElement.query(By.css('[data-testid="count"]'));
    expect(countEl.nativeElement.textContent).toBe('0');
  });

  it('should increment count and update computed', () => {
    const component = fixture.componentInstance;

    component.increment();
    fixture.detectChanges();  // Signal changes require detectChanges with OnPush

    const countEl = fixture.debugElement.query(By.css('[data-testid="count"]'));
    const doubleEl = fixture.debugElement.query(By.css('[data-testid="double"]'));

    expect(countEl.nativeElement.textContent).toBe('1');
    expect(doubleEl.nativeElement.textContent).toBe('2');
  });

  it('should test signal values directly (unit-level)', () => {
    const component = fixture.componentInstance;

    expect(component.count()).toBe(0);
    expect(component.doubleCount()).toBe(0);

    component.increment();

    // Signals update synchronously — no detectChanges needed for value checks
    expect(component.count()).toBe(1);
    expect(component.doubleCount()).toBe(2);
  });
});
```

### 2.6 Testing OnPush Components

OnPush components only re-render when: (a) an input reference changes, (b) an event fires from the template, (c) an async pipe emits, or (d) `markForCheck()` / signals change.

```typescript
describe('OnPush Component Gotchas', () => {
  // Problem: Mutating an object input does NOT trigger change detection
  it('should NOT update when input object is mutated', () => {
    const user = { name: 'Alice' };
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();

    // Mutate same reference — OnPush ignores this
    user.name = 'Bob';
    fixture.detectChanges();

    const nameEl = fixture.debugElement.query(By.css('.name'));
    expect(nameEl.nativeElement.textContent).toBe('Alice');  // Still Alice!
  });

  // Solution: Provide a new reference
  it('should update when input reference changes', () => {
    fixture.componentRef.setInput('user', { name: 'Alice' });
    fixture.detectChanges();

    fixture.componentRef.setInput('user', { name: 'Bob' });  // New reference
    fixture.detectChanges();

    const nameEl = fixture.debugElement.query(By.css('.name'));
    expect(nameEl.nativeElement.textContent).toBe('Bob');
  });

  // Force change detection when needed (escape hatch)
  it('should force render with ChangeDetectorRef', () => {
    const cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
    // ... modify internal state ...
    cdr.detectChanges();  // Bypasses OnPush check
  });
});
```

---

## 3. Service Testing

### 3.1 Testing HTTP Services with HttpClientTestingModule

```typescript
// ---- user.service.ts ----
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = '/api/users';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, changes: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, changes);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

// ---- user.service.spec.ts ----
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
    // Verify no unmatched requests remain — critical for catching stale calls
    httpMock.verify();
  });

  it('should GET all users', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'Alice', email: 'alice@test.com' },
      { id: 2, name: 'Bob', email: 'bob@test.com' }
    ];

    service.getUsers().subscribe(users => {
      expect(users.length).toBe(2);
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);  // Provide mock response
  });

  it('should GET user by id', () => {
    const mockUser: User = { id: 42, name: 'Charlie', email: 'charlie@test.com' };

    service.getUserById(42).subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne('/api/users/42');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should POST to create user', () => {
    const newUser = { name: 'Diana', email: 'diana@test.com' };
    const createdUser = { id: 3, ...newUser };

    service.createUser(newUser).subscribe(user => {
      expect(user.id).toBe(3);
      expect(user.name).toBe('Diana');
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(createdUser);
  });

  it('should handle HTTP errors gracefully', () => {
    service.getUserById(999).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne('/api/users/999');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  it('should handle network errors', () => {
    service.getUsers().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.error).toBeInstanceOf(ProgressEvent);
      }
    });

    const req = httpMock.expectOne('/api/users');
    req.error(new ProgressEvent('Network error'));
  });

  // Testing request headers
  it('should include authorization header if interceptor is configured', () => {
    service.getUsers().subscribe();

    const req = httpMock.expectOne('/api/users');
    // If using an interceptor, verify headers here
    // expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    req.flush([]);
  });
});
```

### 3.2 Testing BehaviorSubject-Based State Services

```typescript
// ---- auth-state.service.ts ----
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));
  loading$ = this.loadingSubject.asObservable();

  get currentUserSnapshot(): User | null {
    return this.currentUserSubject.getValue();
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    this.loadingSubject.next(true);
    return inject(HttpClient).post<User>('/api/auth/login', credentials).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.loadingSubject.next(false);
      }),
      catchError(err => {
        this.loadingSubject.next(false);
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
  }
}

// ---- auth-state.service.spec.ts ----
describe('AuthStateService', () => {
  let service: AuthStateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AuthStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should start with null user', () => {
    expect(service.currentUserSnapshot).toBeNull();
  });

  it('should emit false for isAuthenticated$ initially', (done) => {
    service.isAuthenticated$.pipe(take(1)).subscribe(isAuth => {
      expect(isAuth).toBeFalse();
      done();
    });
  });

  it('should set user after successful login', () => {
    const mockUser: User = { id: 1, name: 'Alice', email: 'alice@test.com' };
    const credentials = { email: 'alice@test.com', password: 'secret' };

    // Collect emissions
    const emissions: (User | null)[] = [];
    service.currentUser$.subscribe(user => emissions.push(user));

    service.login(credentials).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    req.flush(mockUser);

    expect(emissions).toEqual([null, mockUser]);  // Initial null + logged-in user
    expect(service.currentUserSnapshot).toEqual(mockUser);
  });

  it('should track loading state during login', () => {
    const loadingStates: boolean[] = [];
    service.loading$.subscribe(l => loadingStates.push(l));

    service.login({ email: 'a@b.com', password: 'x' }).subscribe();

    // Before flush: loading should be true
    expect(loadingStates).toEqual([false, true]);

    httpMock.expectOne('/api/auth/login').flush({ id: 1, name: 'A', email: 'a@b.com' });

    expect(loadingStates).toEqual([false, true, false]);
  });

  it('should reset user on logout', () => {
    // Manually set a user
    (service as any).currentUserSubject.next({ id: 1, name: 'A', email: 'a@b.com' });
    expect(service.currentUserSnapshot).toBeTruthy();

    service.logout();
    expect(service.currentUserSnapshot).toBeNull();
  });
});
```

### 3.3 Testing Services with Dependencies

```typescript
// ---- notification.service.ts ----
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private logger = inject(LoggerService);

  showSuccess(message: string): void {
    this.logger.info(`Success: ${message}`);
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: 'success' });
  }

  showError(message: string): void {
    this.logger.error(`Error: ${message}`);
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: 'error' });
  }
}

// ---- notification.service.spec.ts ----
describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(NotificationService);
  });

  it('should show success snackbar and log info', () => {
    service.showSuccess('Item saved');

    expect(loggerSpy.info).toHaveBeenCalledWith('Success: Item saved');
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Item saved', 'Close',
      jasmine.objectContaining({ duration: 3000, panelClass: 'success' })
    );
  });

  it('should show error snackbar and log error', () => {
    service.showError('Save failed');

    expect(loggerSpy.error).toHaveBeenCalledWith('Error: Save failed');
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Save failed', 'Close',
      jasmine.objectContaining({ duration: 5000, panelClass: 'error' })
    );
  });
});
```

---

## 4. Pipe & Directive Testing

### 4.1 Pure Pipe Testing (No TestBed Needed)

Pure pipes are the easiest things to test in Angular — they are pure functions wrapped in a class.

```typescript
// ---- truncate.pipe.ts ----
@Pipe({ name: 'truncate', standalone: true, pure: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, maxLength: number = 50, suffix: string = '...'): string {
    if (!value) return '';
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength).trimEnd() + suffix;
  }
}

// ---- truncate.pipe.spec.ts ----
describe('TruncatePipe', () => {
  // No TestBed — just instantiate directly
  const pipe = new TruncatePipe();

  it('should return empty string for null/undefined', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should not truncate short strings', () => {
    expect(pipe.transform('Hello', 10)).toBe('Hello');
  });

  it('should truncate long strings with default suffix', () => {
    const input = 'This is a very long string that exceeds the limit';
    const result = pipe.transform(input, 20);
    expect(result).toBe('This is a very long...');
    expect(result.length).toBeLessThanOrEqual(23);  // 20 + '...'
  });

  it('should use custom suffix', () => {
    expect(pipe.transform('Hello World', 5, ' →')).toBe('Hello →');
  });

  it('should use default maxLength of 50', () => {
    const longStr = 'a'.repeat(100);
    const result = pipe.transform(longStr);
    expect(result).toBe('a'.repeat(50) + '...');
  });
});
```

### 4.2 Impure Pipe Testing

Impure pipes may depend on services or external state — they need TestBed.

```typescript
// ---- relative-time.pipe.ts ----
@Pipe({ name: 'relativeTime', standalone: true, pure: false })
export class RelativeTimePipe implements PipeTransform {
  private locale = inject(LocaleService);

  transform(value: Date | string): string {
    const date = new Date(value);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return this.locale.translate('just_now');
    if (diffMins < 60) return `${diffMins} ${this.locale.translate('minutes_ago')}`;
    // ... more logic
    return date.toLocaleDateString();
  }
}

// ---- relative-time.pipe.spec.ts ----
describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;
  let localeSpy: jasmine.SpyObj<LocaleService>;

  beforeEach(() => {
    localeSpy = jasmine.createSpyObj('LocaleService', ['translate']);
    localeSpy.translate.and.callFake((key: string) => {
      const translations: Record<string, string> = {
        just_now: 'just now',
        minutes_ago: 'minutes ago'
      };
      return translations[key] || key;
    });

    TestBed.configureTestingModule({
      providers: [
        RelativeTimePipe,
        { provide: LocaleService, useValue: localeSpy }
      ]
    });

    pipe = TestBed.inject(RelativeTimePipe);
  });

  it('should return "just now" for recent dates', () => {
    const now = new Date();
    expect(pipe.transform(now)).toBe('just now');
  });

  it('should return minutes ago for dates within the hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000);
    expect(pipe.transform(fiveMinAgo)).toBe('5 minutes ago');
  });
});
```

### 4.3 Structural Directive Testing

```typescript
// ---- if-role.directive.ts ----
@Directive({ selector: '[appIfRole]', standalone: true })
export class IfRoleDirective implements OnInit, OnDestroy {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthStateService);
  private subscription?: Subscription;

  @Input('appIfRole') requiredRole!: string;

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(user => {
      if (user?.roles?.includes(this.requiredRole)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}

// ---- if-role.directive.spec.ts ----
@Component({
  standalone: true,
  imports: [IfRoleDirective],
  template: `<div *appIfRole="'admin'"><span class="secret">Admin Content</span></div>`
})
class TestHostComponent {}

describe('IfRoleDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let authSubject: BehaviorSubject<User | null>;

  beforeEach(async () => {
    authSubject = new BehaviorSubject<User | null>(null);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        {
          provide: AuthStateService,
          useValue: { currentUser$: authSubject.asObservable() }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should NOT render content when user is null', () => {
    const secret = fixture.debugElement.query(By.css('.secret'));
    expect(secret).toBeNull();
  });

  it('should NOT render content when user lacks required role', () => {
    authSubject.next({ id: 1, name: 'User', roles: ['viewer'] } as any);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.secret'))).toBeNull();
  });

  it('should render content when user has required role', () => {
    authSubject.next({ id: 1, name: 'Admin', roles: ['admin'] } as any);
    fixture.detectChanges();

    const secret = fixture.debugElement.query(By.css('.secret'));
    expect(secret).toBeTruthy();
    expect(secret.nativeElement.textContent).toBe('Admin Content');
  });

  it('should remove content when role is revoked', () => {
    authSubject.next({ id: 1, name: 'Admin', roles: ['admin'] } as any);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.secret'))).toBeTruthy();

    authSubject.next({ id: 1, name: 'Admin', roles: ['viewer'] } as any);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.secret'))).toBeNull();
  });
});
```

### 4.4 Attribute Directive Testing

```typescript
// ---- highlight.directive.ts ----
@Directive({ selector: '[appHighlight]', standalone: true })
export class HighlightDirective {
  private el = inject(ElementRef);

  @Input() appHighlight = 'yellow';
  @Input() highlightOnFocus = false;

  @HostListener('mouseenter') onMouseEnter() {
    this.setColor(this.appHighlight);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.setColor('');
  }

  private setColor(color: string): void {
    this.el.nativeElement.style.backgroundColor = color;
  }
}

// ---- highlight.directive.spec.ts ----
@Component({
  standalone: true,
  imports: [HighlightDirective],
  template: `
    <p appHighlight="cyan" class="test-el">Hover me</p>
    <p appHighlight class="default-el">Default color</p>
  `
})
class HighlightTestHost {}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<HighlightTestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HighlightTestHost]
    }).compileComponents();

    fixture = TestBed.createComponent(HighlightTestHost);
    fixture.detectChanges();
  });

  it('should highlight with cyan on mouseenter', () => {
    const el = fixture.debugElement.query(By.css('.test-el'));
    el.triggerEventHandler('mouseenter', null);

    expect(el.nativeElement.style.backgroundColor).toBe('cyan');
  });

  it('should remove highlight on mouseleave', () => {
    const el = fixture.debugElement.query(By.css('.test-el'));
    el.triggerEventHandler('mouseenter', null);
    el.triggerEventHandler('mouseleave', null);

    expect(el.nativeElement.style.backgroundColor).toBe('');
  });

  it('should use default yellow when no color specified', () => {
    const el = fixture.debugElement.query(By.css('.default-el'));
    el.triggerEventHandler('mouseenter', null);

    expect(el.nativeElement.style.backgroundColor).toBe('yellow');
  });
});
```

---

## 5. Guard & Resolver Testing

### 5.1 Testing Functional Guards

Angular v15+ favors functional guards over class-based guards.

```typescript
// ---- auth.guard.ts ----
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthStateService);
  const router = inject(Router);

  if (authService.currentUserSnapshot) {
    return true;
  }

  // Store attempted URL for redirect after login
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

// ---- role.guard.ts ----
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthStateService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[];

  const user = authService.currentUserSnapshot;
  if (user && requiredRoles.some(role => user.roles.includes(role))) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
};

// ---- auth.guard.spec.ts ----
describe('authGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthStateService>;
  let routerMock: jasmine.SpyObj<Router>;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthStateService', [], {
      currentUserSnapshot: null  // Default: not authenticated
    });
    routerMock = jasmine.createSpyObj('Router', ['createUrlTree']);
    routerMock.createUrlTree.and.returnValue('/login' as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStateService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access when user is authenticated', () => {
    // Override the property to return a user
    Object.defineProperty(authServiceMock, 'currentUserSnapshot', {
      get: () => ({ id: 1, name: 'Alice', roles: ['user'] })
    });

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBeTrue();
  });

  it('should redirect to login when user is not authenticated', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: '/dashboard' } }
    );
    expect(result).toBe('/login' as any);
  });
});

describe('roleGuard', () => {
  let authServiceMock: any;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerMock = jasmine.createSpyObj('Router', ['createUrlTree']);
    routerMock.createUrlTree.and.returnValue('/forbidden' as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  function runGuard(user: any, requiredRoles: string[]) {
    TestBed.overrideProvider(AuthStateService, {
      useValue: { currentUserSnapshot: user }
    });

    const route = { data: { roles: requiredRoles } } as any;
    return TestBed.runInInjectionContext(() => roleGuard(route));
  }

  it('should allow access when user has required role', () => {
    const result = runGuard({ id: 1, roles: ['admin', 'user'] }, ['admin']);
    expect(result).toBeTrue();
  });

  it('should deny access when user lacks required role', () => {
    const result = runGuard({ id: 1, roles: ['viewer'] }, ['admin']);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/forbidden']);
  });

  it('should deny access when user is null', () => {
    const result = runGuard(null, ['admin']);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/forbidden']);
  });
});
```

### 5.2 Testing Resolvers

```typescript
// ---- user.resolver.ts ----
export const userResolver: ResolveFn<User> = (route) => {
  const userService = inject(UserService);
  const router = inject(Router);
  const userId = Number(route.paramMap.get('id'));

  return userService.getUserById(userId).pipe(
    catchError(() => {
      router.navigate(['/not-found']);
      return EMPTY;
    })
  );
};

// ---- user.resolver.spec.ts ----
describe('userResolver', () => {
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUserById']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  function runResolver(paramId: string): Observable<User> {
    const route = {
      paramMap: convertToParamMap({ id: paramId })
    } as any;

    return TestBed.runInInjectionContext(
      () => userResolver(route, {} as any)
    ) as Observable<User>;
  }

  it('should resolve user by route param id', (done) => {
    const mockUser: User = { id: 42, name: 'Alice', email: 'alice@test.com' };
    userServiceSpy.getUserById.and.returnValue(of(mockUser));

    runResolver('42').subscribe(user => {
      expect(user).toEqual(mockUser);
      expect(userServiceSpy.getUserById).toHaveBeenCalledWith(42);
      done();
    });
  });

  it('should navigate to /not-found on error', (done) => {
    userServiceSpy.getUserById.and.returnValue(throwError(() => new Error('404')));

    runResolver('999').subscribe({
      complete: () => {
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/not-found']);
        done();
      }
    });
  });
});
```

### 5.3 Mocking ActivatedRoute

```typescript
// Reusable mock factory for ActivatedRoute
function createMockActivatedRoute(overrides: Partial<ActivatedRoute> = {}): ActivatedRoute {
  return {
    params: of({}),
    queryParams: of({}),
    paramMap: of(convertToParamMap({})),
    queryParamMap: of(convertToParamMap({})),
    data: of({}),
    fragment: of(null),
    url: of([]),
    outlet: 'primary',
    component: null,
    routeConfig: null,
    root: {} as any,
    parent: null,
    firstChild: null,
    children: [],
    pathFromRoot: [],
    snapshot: {
      paramMap: convertToParamMap({}),
      queryParamMap: convertToParamMap({}),
      data: {},
      params: {},
      queryParams: {},
      fragment: null,
      url: [],
      outlet: 'primary',
      component: null,
      routeConfig: null,
      root: {} as any,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: []
    } as any,
    ...overrides
  } as ActivatedRoute;
}

// Usage in tests
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: createMockActivatedRoute({
          params: of({ id: '42' }),
          queryParams: of({ tab: 'details' }),
          data: of({ roles: ['admin'] })
        })
      }
    ]
  });
});
```

---

## 6. RxJS Testing

### 6.1 Marble Testing with TestScheduler

Marble testing provides a visual, time-based DSL for testing observable streams.

```
Marble Syntax Reference:
  -     = 1 frame of virtual time (10ms by default)
  a-z   = emission values
  |     = complete
  #     = error
  ^     = subscription point
  !     = unsubscription point
  ()    = synchronous grouping
  space = ignored (for alignment)
```

```typescript
import { TestScheduler } from 'rxjs/testing';

describe('RxJS Marble Testing', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);  // Deep equality assertion
    });
  });

  // Basic map operator
  it('should double values', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ =   cold('--a--b--c--|', { a: 1, b: 2, c: 3 });
      const expected =       '--a--b--c--|';
      const values =         { a: 2, b: 4, c: 6 };

      const result$ = source$.pipe(map(x => x * 2));
      expectObservable(result$).toBe(expected, values);
    });
  });

  // Testing filter
  it('should filter even numbers', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ =   cold('--1--2--3--4--5--|', { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 });
      const expected =       '-----2-----4-----|';

      const result$ = source$.pipe(filter(x => x % 2 === 0));
      expectObservable(result$).toBe(expected, { 2: 2, 4: 4 });
    });
  });

  // Testing switchMap
  it('should cancel previous inner observable with switchMap', () => {
    scheduler.run(({ cold, hot, expectObservable }) => {
      const outer$ = hot('  --a------b------|');
      const inner1$ = cold('  ---x--y|');
      const inner2$ = cold('          ---x--y|');
      const expected =     '-----x----x--y--|';

      // When 'b' arrives, inner1$ is cancelled (y from inner1 never emits)
      const result$ = outer$.pipe(
        switchMap(() => cold('---x--y|'))
      );
      expectObservable(result$).toBe(expected);
    });
  });

  // Testing debounceTime
  it('should debounce rapid emissions', () => {
    scheduler.run(({ cold, expectObservable }) => {
      //                     Rapid emissions, then pause
      const source$ = cold('--a-b-c------d--|');
      const expected =     '---------c-------(d|)';
      //                     300ms debounce (30 frames at 10ms each = --- )

      const result$ = source$.pipe(debounceTime(30));
      expectObservable(result$).toBe(expected);
    });
  });

  // Testing mergeMap with concurrency
  it('should process with mergeMap concurrency limit', () => {
    scheduler.run(({ cold, hot, expectObservable }) => {
      const source$ = hot('--a--b--c--|');
      const expected =    '----A----B--(C|)';

      const result$ = source$.pipe(
        mergeMap(
          val => cold('--x|', { x: val.toUpperCase() }),
          2  // concurrency limit
        )
      );
      expectObservable(result$).toBe(expected, { A: 'A', B: 'B', C: 'C' });
    });
  });

  // Testing error handling
  it('should catch errors and provide fallback', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ =  cold('--a--b--#', { a: 1, b: 2 }, new Error('fail'));
      const expected =      '--a--b--(c|)';

      const result$ = source$.pipe(
        catchError(() => of(0))
      );
      expectObservable(result$).toBe(expected, { a: 1, b: 2, c: 0 });
    });
  });

  // Testing subscriptions (when does subscribe/unsubscribe happen?)
  it('should verify subscription timing with take', () => {
    scheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source$ = cold('--a--b--c--d--|');
      const expected =     '--a--b--(c|)';
      const sub =          '^-------!';  // Subscribes at 0, unsubs at frame 8

      const result$ = source$.pipe(take(3));
      expectObservable(result$).toBe(expected);
      expectSubscriptions(source$.subscriptions).toBe(sub);
    });
  });
});
```

### 6.2 Testing Real-World Search Pattern (switchMap + debounceTime)

```typescript
// ---- search.service.ts ----
@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);

  search(term$: Observable<string>): Observable<SearchResult[]> {
    return term$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => term.length >= 2),
      switchMap(term =>
        this.http.get<SearchResult[]>(`/api/search?q=${term}`).pipe(
          catchError(() => of([]))
        )
      )
    );
  }
}

// ---- search.service.spec.ts (marble approach) ----
describe('SearchService (marble testing)', () => {
  let scheduler: TestScheduler;
  let service: SearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should debounce, deduplicate, and switchMap search terms', () => {
    scheduler.run(({ cold, expectObservable }) => {
      // Simulate user typing: 'a' (too short), 'an', 'ang', 'ang' (duplicate)
      const terms$ = cold('--a---b----c----d---|', {
        a: 'a',     // filtered (< 2 chars)
        b: 'an',    // passes after debounce
        c: 'ang',   // passes after debounce, cancels 'an' request
        d: 'ang'    // filtered by distinctUntilChanged
      });

      // In marble tests with TestScheduler, HTTP calls need to be mocked
      // at the RxJS level, not with HttpTestingController
    });
  });
});

// ---- search.service.spec.ts (fakeAsync approach — more practical) ----
describe('SearchService (fakeAsync)', () => {
  let service: SearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should debounce and search after 300ms', fakeAsync(() => {
    const terms$ = new Subject<string>();
    const results: SearchResult[][] = [];

    service.search(terms$.asObservable()).subscribe(r => results.push(r));

    // Type 'an' — should not trigger immediately
    terms$.next('an');
    tick(100);
    httpMock.expectNone('/api/search?q=an');

    // Wait for debounce
    tick(200);  // Total: 300ms
    const req = httpMock.expectOne('/api/search?q=an');
    req.flush([{ id: 1, title: 'Angular' }]);

    expect(results.length).toBe(1);
    expect(results[0][0].title).toBe('Angular');

    // Type 'ang' — should cancel previous and start new
    terms$.next('ang');
    tick(300);
    const req2 = httpMock.expectOne('/api/search?q=ang');
    req2.flush([{ id: 1, title: 'Angular' }, { id: 2, title: 'AngularJS' }]);

    expect(results.length).toBe(2);
    expect(results[1].length).toBe(2);
  }));

  it('should ignore terms shorter than 2 characters', fakeAsync(() => {
    const terms$ = new Subject<string>();
    const results: SearchResult[][] = [];

    service.search(terms$.asObservable()).subscribe(r => results.push(r));

    terms$.next('a');
    tick(300);
    httpMock.expectNone('/api/search?q=a');

    expect(results.length).toBe(0);
  }));

  it('should return empty array on HTTP error', fakeAsync(() => {
    const terms$ = new Subject<string>();
    const results: SearchResult[][] = [];

    service.search(terms$.asObservable()).subscribe(r => results.push(r));

    terms$.next('error');
    tick(300);
    const req = httpMock.expectOne('/api/search?q=error');
    req.error(new ProgressEvent('Network error'));

    expect(results.length).toBe(1);
    expect(results[0]).toEqual([]);
  }));
});
```

---

## 7. Mocking Strategies

### 7.1 jasmine.createSpyObj

The most common and concise way to create mock objects.

```typescript
// Basic spy object with methods
const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers', 'getUserById', 'deleteUser']);
userServiceSpy.getUsers.and.returnValue(of(mockUsers));
userServiceSpy.getUserById.and.returnValue(of(mockUser));
userServiceSpy.deleteUser.and.returnValue(of(void 0));

// Spy object with methods AND properties
const authServiceSpy = jasmine.createSpyObj('AuthStateService',
  ['login', 'logout'],                          // methods
  { currentUser$: of(mockUser), isAuthenticated$: of(true) }  // properties
);

// Spy with conditional return values
userServiceSpy.getUserById.and.callFake((id: number) => {
  if (id === 1) return of({ id: 1, name: 'Alice' });
  if (id === 2) return of({ id: 2, name: 'Bob' });
  return throwError(() => new Error('Not found'));
});

// Verify call arguments
expect(userServiceSpy.getUserById).toHaveBeenCalledWith(42);
expect(userServiceSpy.getUserById).toHaveBeenCalledTimes(1);

// Jest equivalent
const userServiceMock = {
  getUsers: jest.fn().mockReturnValue(of(mockUsers)),
  getUserById: jest.fn().mockReturnValue(of(mockUser)),
  deleteUser: jest.fn().mockReturnValue(of(undefined))
};
```

### 7.2 Manual Mock Classes

For complex services where spy objects become unwieldy.

```typescript
// ---- mock-auth-state.service.ts ----
export class MockAuthStateService {
  private userSubject = new BehaviorSubject<User | null>(null);

  currentUser$ = this.userSubject.asObservable();
  isAuthenticated$ = this.currentUser$.pipe(map(u => !!u));

  get currentUserSnapshot(): User | null {
    return this.userSubject.getValue();
  }

  // Test helpers — not in real service
  setUser(user: User | null): void {
    this.userSubject.next(user);
  }

  login = jasmine.createSpy('login').and.callFake((creds: any) => {
    const user = { id: 1, name: 'Test User', email: creds.email, roles: ['user'] };
    this.userSubject.next(user);
    return of(user);
  });

  logout = jasmine.createSpy('logout').and.callFake(() => {
    this.userSubject.next(null);
  });
}

// Usage
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthStateService, useClass: MockAuthStateService }
    ]
  });
});
```

### 7.3 Provider Override Patterns

```typescript
// useValue — provide a literal object or spy
{ provide: UserService, useValue: userServiceSpy }

// useClass — provide a mock class
{ provide: AuthStateService, useClass: MockAuthStateService }

// useFactory — dynamic mock creation
{
  provide: ConfigService,
  useFactory: () => ({
    getFeatureFlag: (flag: string) => flag === 'darkMode' ? true : false,
    apiUrl: 'http://test-api.local'
  })
}

// useExisting — alias one token to another
{ provide: AbstractLogger, useExisting: ConsoleLoggerService }

// Multi-provider mocking (e.g., HTTP_INTERCEPTORS)
{
  provide: HTTP_INTERCEPTORS,
  useClass: MockAuthInterceptor,
  multi: true
}

// Overriding environment-specific tokens
{ provide: API_BASE_URL, useValue: 'http://localhost:3000' }
{ provide: LOCALE_ID, useValue: 'en-US' }
```

### 7.4 MockBuilder Pattern (ng-mocks Library)

For large-scale projects, `ng-mocks` dramatically reduces boilerplate.

```typescript
import { MockBuilder, MockRender, MockInstance, ngMocks } from 'ng-mocks';

describe('UserListComponent (ng-mocks)', () => {
  // MockBuilder auto-mocks all dependencies of UserListComponent
  beforeEach(() => MockBuilder(UserListComponent, AppModule));

  it('should render user cards', () => {
    // Pre-configure mock service behavior
    MockInstance(UserService, 'getUsers', () => of(mockUsers));

    const fixture = MockRender(UserListComponent);
    const cards = ngMocks.findAll('app-user-card');
    expect(cards.length).toBe(mockUsers.length);
  });

  it('should pass user to each card', () => {
    MockInstance(UserService, 'getUsers', () => of(mockUsers));

    const fixture = MockRender(UserListComponent);
    const firstCard = ngMocks.find('app-user-card');
    const cardInput = ngMocks.input(firstCard, 'user');
    expect(cardInput).toEqual(mockUsers[0]);
  });
});

// MockBuilder with keep/mock/exclude
beforeEach(() =>
  MockBuilder(TargetComponent, TargetModule)
    .keep(ReactiveFormsModule)     // Keep real module (forms need real impl)
    .mock(UserService, {           // Provide specific mock values
      getUsers: () => of([]),
    })
    .exclude(HeavyAnimationModule) // Completely remove
);
```

### 7.5 Mocking Router and ActivatedRoute

```typescript
// Router spy
const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl', 'createUrlTree']);
routerSpy.events = new Subject<any>();  // For components that subscribe to router events

// ActivatedRoute with dynamic params
const paramSubject = new BehaviorSubject(convertToParamMap({ id: '1' }));
const mockActivatedRoute = {
  paramMap: paramSubject.asObservable(),
  queryParamMap: of(convertToParamMap({})),
  snapshot: {
    paramMap: convertToParamMap({ id: '1' }),
    queryParamMap: convertToParamMap({})
  }
};

// Change route params during test
it('should react to route param changes', () => {
  paramSubject.next(convertToParamMap({ id: '2' }));
  fixture.detectChanges();
  expect(component.userId).toBe(2);
});

// RouterTestingModule for integration tests
TestBed.configureTestingModule({
  imports: [
    RouterTestingModule.withRoutes([
      { path: 'users/:id', component: UserDetailComponent },
      { path: 'login', component: LoginComponent }
    ])
  ]
});
```

---

## 8. Anti-Patterns That Kill Testability

### 8.1 HttpClient in Components

```typescript
// ❌ ANTI-PATTERN: HTTP calls directly in component
@Component({ /* ... */ })
export class BadDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  users: User[] = [];
  stats: DashboardStats | null = null;

  ngOnInit(): void {
    // Tightly coupled to HTTP — requires HttpClientTestingModule for every test
    this.http.get<User[]>('/api/users').subscribe(u => this.users = u);
    this.http.get<DashboardStats>('/api/stats').subscribe(s => this.stats = s);
  }
}

// ✅ CORRECT: Delegate to services
@Component({ /* ... */ })
export class GoodDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private statsService = inject(StatsService);

  users: User[] = [];
  stats: DashboardStats | null = null;

  ngOnInit(): void {
    this.userService.getUsers().subscribe(u => this.users = u);
    this.statsService.getDashboardStats().subscribe(s => this.stats = s);
  }
}
// Now tests only need to mock UserService and StatsService — no HTTP layer
```

### 8.2 Business Logic in Templates

```typescript
// ❌ ANTI-PATTERN: Complex logic in template — untestable without DOM
@Component({
  template: `
    <div *ngIf="items.length > 0 && !isLoading && currentUser?.role === 'admin'">
      <span>{{ items.filter(i => i.active).length }} active of {{ items.length }}</span>
      <span>{{ (totalPrice * (1 - discount / 100)) | currency }}</span>
    </div>
  `
})
export class BadComponent {
  items: Item[] = [];
  isLoading = false;
  currentUser: User | null = null;
  totalPrice = 0;
  discount = 0;
}

// ✅ CORRECT: Extract logic into testable computed properties / methods
@Component({
  template: `
    @if (shouldShowAdminPanel()) {
      <span>{{ activeItemSummary() }}</span>
      <span>{{ discountedPrice() | currency }}</span>
    }
  `
})
export class GoodComponent {
  items = input<Item[]>([]);
  isLoading = input(false);
  currentUser = input<User | null>(null);
  totalPrice = input(0);
  discount = input(0);

  shouldShowAdminPanel = computed(() =>
    this.items().length > 0 && !this.isLoading() && this.currentUser()?.role === 'admin'
  );

  activeItemSummary = computed(() => {
    const active = this.items().filter(i => i.active).length;
    return `${active} active of ${this.items().length}`;
  });

  discountedPrice = computed(() =>
    this.totalPrice() * (1 - this.discount() / 100)
  );
}
// Now shouldShowAdminPanel, activeItemSummary, discountedPrice are all
// testable as signal computations without touching the DOM
```

### 8.3 Tight Coupling Between Components

```typescript
// ❌ ANTI-PATTERN: Child directly accesses parent via ViewChild/injection
@Component({ /* ... */ })
export class ChildComponent {
  // Tightly coupled — can't test without parent
  private parent = inject(ParentComponent);

  doSomething(): void {
    this.parent.refreshData();
    this.parent.showNotification('Done');
  }
}

// ✅ CORRECT: Communicate via outputs or shared service
@Component({ /* ... */ })
export class ChildComponent {
  actionCompleted = output<string>();

  doSomething(): void {
    this.actionCompleted.emit('Done');
  }
}
// Parent listens: <app-child (actionCompleted)="onChildAction($event)" />
```

### 8.4 Global State Access

```typescript
// ❌ ANTI-PATTERN: Direct localStorage/sessionStorage access
@Component({ /* ... */ })
export class BadPreferencesComponent {
  get theme(): string {
    return localStorage.getItem('theme') || 'light';  // Untestable in Node/jsdom
  }

  setTheme(theme: string): void {
    localStorage.setItem('theme', theme);
  }
}

// ✅ CORRECT: Abstract behind injectable service
@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage: Storage;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.storage = isPlatformBrowser(platformId) ? localStorage : new InMemoryStorage();
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }
}

// In tests: provide a mock StorageService — no browser APIs needed
```

### 8.5 Subscribing in Constructors

```typescript
// ❌ ANTI-PATTERN: Side effects in constructor — runs before TestBed is ready
@Component({ /* ... */ })
export class BadComponent {
  constructor(private userService: UserService) {
    // This fires BEFORE you can set up spies in beforeEach
    this.userService.getUsers().subscribe(u => this.users = u);
  }
}

// ✅ CORRECT: Use ngOnInit or reactive declarations
@Component({ /* ... */ })
export class GoodComponent implements OnInit {
  private userService = inject(UserService);
  users: User[] = [];

  ngOnInit(): void {
    // Fires after TestBed setup, giving you control over timing
    this.userService.getUsers().subscribe(u => this.users = u);
  }
}
```

### 8.6 Massive God Components

```typescript
// ❌ ANTI-PATTERN: 500-line component with 10 injected services
@Component({ /* ... */ })
export class GodComponent {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private translate: TranslateService,
    private analytics: AnalyticsService,
    private featureFlags: FeatureFlagService,
    private logger: LoggerService
  ) {}
  // 400 lines of mixed concerns...
}

// ✅ CORRECT: Decompose into focused components + facade service
@Injectable()
export class DashboardFacade {
  // Orchestrates multiple services behind a single interface
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private analytics: AnalyticsService
  ) {}

  loadDashboard(): Observable<DashboardViewModel> { /* ... */ }
  trackAction(action: string): void { /* ... */ }
}

@Component({
  providers: [DashboardFacade]  // Component-scoped
})
export class DashboardComponent {
  private facade = inject(DashboardFacade);
  // Clean, focused, easy to test with one mock
}
```

---

## 9. Testing Checklist

### 9.1 Is My Component Test-Friendly?

Use this checklist before writing tests. If you answer "no" to any item, refactor first.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT TESTABILITY CHECKLIST                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  □  Does the component have ≤ 3 injected dependencies?                 │
│     → If more, consider a Facade service                               │
│                                                                         │
│  □  Is all business logic in services, not in the component?           │
│     → Components should only orchestrate, not calculate                 │
│                                                                         │
│  □  Are template expressions simple (single property/method call)?     │
│     → Complex expressions → extract to computed signals or methods      │
│                                                                         │
│  □  Does the component use OnPush change detection?                    │
│     → OnPush forces better data flow patterns                          │
│                                                                         │
│  □  Are all side effects in ngOnInit, not constructor?                 │
│     → Constructor side effects break test setup timing                  │
│                                                                         │
│  □  Does the component communicate via inputs/outputs (not ViewChild)? │
│     → Direct parent/child coupling prevents isolated testing           │
│                                                                         │
│  □  Is there no direct DOM manipulation (ElementRef.nativeElement)?    │
│     → Use Renderer2 or host bindings instead                           │
│                                                                         │
│  □  Are there no direct browser API calls (localStorage, fetch)?       │
│     → Wrap in injectable services for mockability                      │
│                                                                         │
│  □  Can the component be instantiated with TestBed in < 50ms?         │
│     → Slow setup = too many real dependencies leaking in               │
│                                                                         │
│  □  Is the component < 150 lines of TypeScript?                        │
│     → Large components = multiple responsibilities = hard to test      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Rules for Testable Code

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     GOLDEN RULES OF TESTABLE ANGULAR                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. SINGLE RESPONSIBILITY                                              │
│     One component = one reason to change.                              │
│     If you need "and" to describe it, split it.                        │
│                                                                         │
│  2. DEPENDENCY INJECTION EVERYWHERE                                    │
│     Never `new` a service. Never access globals directly.              │
│     If it's not injected, it's not mockable.                           │
│                                                                         │
│  3. PURE OVER IMPURE                                                   │
│     Pure pipes, pure functions, computed signals.                      │
│     Pure = deterministic = trivially testable.                         │
│                                                                         │
│  4. OBSERVABLES OVER IMPERATIVE STATE                                  │
│     Reactive streams are declarative and composable.                   │
│     Imperative state mutations hide dependencies.                      │
│                                                                         │
│  5. SMART/DUMB COMPONENT SPLIT                                         │
│     Dumb components: test inputs/outputs, no TestBed services.         │
│     Smart components: test orchestration, mock all services.           │
│                                                                         │
│  6. EXTRACT, DON'T INLINE                                              │
│     Template logic → computed signals.                                 │
│     HTTP calls → services.                                             │
│     Validation → validator functions.                                  │
│     Formatting → pipes.                                                │
│                                                                         │
│  7. PREFER FUNCTIONAL PATTERNS                                         │
│     Functional guards, resolvers, interceptors.                        │
│     Test with TestBed.runInInjectionContext().                          │
│                                                                         │
│  8. AVOID TEST COUPLING                                                │
│     Tests should not depend on each other.                             │
│     Tests should not depend on execution order.                        │
│     Each test sets up its own state from scratch.                      │
│                                                                         │
│  9. TEST BEHAVIOR, NOT IMPLEMENTATION                                  │
│     Don't test that a private method was called.                       │
│     Test that the observable output is correct.                        │
│     Test what the user sees, not how the code works.                   │
│                                                                         │
│  10. KEEP TESTS FAST                                                   │
│      Unit test suite should run in < 30 seconds.                       │
│      If TestBed is slow, you're testing too much together.             │
│      Use `ng test --no-watch --code-coverage` in CI.                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Test Organization Best Practices

```typescript
// ---- File naming convention ----
// component:  user-list.component.spec.ts
// service:    user.service.spec.ts
// pipe:       truncate.pipe.spec.ts
// directive:  highlight.directive.spec.ts
// guard:      auth.guard.spec.ts
// resolver:   user.resolver.spec.ts
// utility:    string-utils.spec.ts

// ---- Describe block structure ----
describe('UserListComponent', () => {
  // Setup
  beforeEach(async () => { /* TestBed config */ });

  // Group by feature/behavior
  describe('initialization', () => {
    it('should load users on init', () => {});
    it('should show loading spinner while fetching', () => {});
    it('should display error message on failure', () => {});
  });

  describe('user selection', () => {
    it('should highlight selected user', () => {});
    it('should emit selectedUser on click', () => {});
    it('should deselect when clicking same user', () => {});
  });

  describe('pagination', () => {
    it('should load next page on scroll', () => {});
    it('should disable next when on last page', () => {});
  });

  describe('edge cases', () => {
    it('should handle empty user list', () => {});
    it('should handle users with missing email', () => {});
  });
});
```

### 9.4 Coverage Strategy

```
Target Coverage by Layer:
─────────────────────────────────────────
  Services (business logic)     → 90%+
  Pipes (pure transforms)       → 100%
  Guards / Resolvers            → 95%+
  Dumb Components (template)    → 80%+
  Smart Components (wiring)     → 70%+
  E2E critical paths            → Key user journeys only
─────────────────────────────────────────

Coverage is a METRIC, not a GOAL.
100% coverage with bad assertions = false confidence.
80% coverage with meaningful assertions = real safety.
```

### 9.5 Quick Reference: Test Setup Patterns

```typescript
// ═══════════════════════════════════════════════════════════════
// PATTERN 1: Standalone component with mocked services
// ═══════════════════════════════════════════════════════════════
await TestBed.configureTestingModule({
  imports: [ComponentUnderTest],
  providers: [
    { provide: MyService, useValue: jasmine.createSpyObj('MyService', ['method']) }
  ]
}).compileComponents();

// ═══════════════════════════════════════════════════════════════
// PATTERN 2: Component with real reactive forms
// ═══════════════════════════════════════════════════════════════
await TestBed.configureTestingModule({
  imports: [ComponentUnderTest, ReactiveFormsModule]
}).compileComponents();

// ═══════════════════════════════════════════════════════════════
// PATTERN 3: Service with HTTP
// ═══════════════════════════════════════════════════════════════
TestBed.configureTestingModule({
  imports: [HttpClientTestingModule],
  providers: [ServiceUnderTest]
});
const service = TestBed.inject(ServiceUnderTest);
const httpMock = TestBed.inject(HttpTestingController);

// ═══════════════════════════════════════════════════════════════
// PATTERN 4: Functional guard/resolver
// ═══════════════════════════════════════════════════════════════
TestBed.configureTestingModule({
  providers: [{ provide: SomeDep, useValue: mockDep }]
});
const result = TestBed.runInInjectionContext(() => myGuard(route, state));

// ═══════════════════════════════════════════════════════════════
// PATTERN 5: Directive with host component
// ═══════════════════════════════════════════════════════════════
@Component({
  standalone: true,
  imports: [DirectiveUnderTest],
  template: `<div appMyDirective>Test</div>`
})
class TestHost {}

await TestBed.configureTestingModule({
  imports: [TestHost]
}).compileComponents();

// ═══════════════════════════════════════════════════════════════
// PATTERN 6: Testing with signals (Angular 17+)
// ═══════════════════════════════════════════════════════════════
const fixture = TestBed.createComponent(SignalComponent);
fixture.componentRef.setInput('myInput', 'value');  // Set signal inputs
fixture.detectChanges();
expect(fixture.componentInstance.computedValue()).toBe('expected');

// ═══════════════════════════════════════════════════════════════
// PATTERN 7: RxJS marble testing
// ═══════════════════════════════════════════════════════════════
const scheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});
scheduler.run(({ cold, hot, expectObservable, expectSubscriptions }) => {
  // ... marble assertions
});
```

---

## Summary: The Architect's Testing Mindset

```
                    ┌──────────────────────────────┐
                    │   "If it's hard to test,     │
                    │    the design is wrong."      │
                    │                              │
                    │   — Every senior engineer    │
                    │     who learned the hard way  │
                    └──────────────────────────────┘

  Tests are not an afterthought — they are a DESIGN TOOL.

  The act of writing a test BEFORE the implementation (TDD) or
  immediately after forces you to confront:

    • Is this class doing too much?
    • Are my dependencies explicit and injectable?
    • Can I describe the behavior without knowing the implementation?
    • Will this test still pass after a refactor?

  A well-tested Angular application is not one with 100% coverage.
  It is one where:

    ✓ Every service has isolated unit tests with mocked HTTP
    ✓ Every dumb component has input/output contract tests
    ✓ Every smart component has orchestration tests with mocked services
    ✓ Every pipe is tested as a pure function
    ✓ Every guard is tested for allow/deny/redirect scenarios
    ✓ Critical RxJS flows have marble or fakeAsync tests
    ✓ The test suite runs in under 60 seconds
    ✓ Developers trust the suite enough to deploy on green
```

---

*Document: 09 of the Architect-Level Angular Series*
*Covers: Angular 17+ with Signals, Standalone Components, Functional Guards/Resolvers*
*Testing Frameworks: Jasmine (primary), Jest (alternatives noted), ng-mocks (advanced)*
