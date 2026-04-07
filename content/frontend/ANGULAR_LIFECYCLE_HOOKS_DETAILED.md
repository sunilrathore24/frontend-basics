# Angular Lifecycle Hooks: Complete Deep Dive for Principal Engineers

## When Should You Actually Use Lifecycle Hooks in Real Projects?

This is one of the most practical questions for Angular developers. While there are 8 lifecycle hooks available, understanding when and why to use each one is crucial for building performant, maintainable applications.

### Understanding the Component Lifecycle

Before diving into individual hooks, let's understand what happens when Angular creates and destroys a component:

**Component Creation Flow:**
```
1. Constructor called (DI happens here)
2. Input properties set
3. ngOnChanges (if inputs exist)
4. ngOnInit
5. ngDoCheck
6. ngAfterContentInit
7. ngAfterContentChecked
8. ngAfterViewInit
9. ngAfterViewChecked
10. Component is now fully initialized
```

**During Updates:**
```
1. Input changes detected
2. ngOnChanges
3. ngDoCheck
4. ngAfterContentChecked
5. ngAfterViewChecked
```

**Component Destruction:**
```
1. ngOnDestroy
2. Component removed from DOM
3. Memory cleanup
```

---

## 1. ngOnInit - The Workhorse (Used in ~80% of Components)

### What It Is

`ngOnInit` is called **once** after Angular has initialized all data-bound properties and set up the component's inputs. It's the perfect place for component initialization logic.

### Why It Exists

The constructor is meant for dependency injection only. It runs before Angular has set up the component's inputs and bindings. `ngOnInit` guarantees that:
- All `@Input()` properties have their values
- The component is fully initialized
- You can safely access injected services
- Change detection has run at least once

### The Technical Details

```typescript
export interface OnInit {
  ngOnInit(): void;
}
```

**When it's called:**
- After the first `ngOnChanges` (if inputs exist)
- Before `ngDoCheck`
- Only once in the component's lifetime

**What's available:**
- All `@Input()` properties
- Injected services
- Component properties
- Template reference variables are NOT yet available (use `ngAfterViewInit` for those)

### Real-World Use Cases

**1. Data Fetching**

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    <div *ngIf="loading">Loading...</div>
    <div *ngIf="user">
      <h2>{{ user.name }}</h2>
      <p>{{ user.email }}</p>
    </div>
    <div *ngIf="error">{{ error }}</div>
  `
})
export class UserProfileComponent implements OnInit {
  @Input() userId!: string;
  
  user: User | null = null;
  loading = false;
  error: string | null = null;
  
  constructor(
    private userService: UserService,
    private logger: LoggerService
  ) {
    // ❌ DON'T fetch data here
    // userId input is not available yet!
    // this.loadUser(); // This would fail
  }
  
  ngOnInit() {
    // ✅ DO fetch data here
    // userId is now available
    this.loadUser();
  }
  
  private loadUser() {
    this.loading = true;
    this.error = null;
    
    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        this.logger.info('User loaded', { userId: this.userId });
      },
      error: (err) => {
        this.error = 'Failed to load user';
        this.loading = false;
        this.logger.error('User load failed', err);
      }
    });
  }
}
```

**2. Setting Up Subscriptions**

```typescript
@Component({
  selector: 'app-real-time-dashboard',
  template: `
    <div class="dashboard">
      <div *ngFor="let metric of metrics">
        {{ metric.name }}: {{ metric.value }}
      </div>
    </div>
  `
})
export class RealTimeDashboardComponent implements OnInit, OnDestroy {
  metrics: Metric[] = [];
  private destroy$ = new Subject<void>();
  
  constructor(private metricsService: MetricsService) {}
  
  ngOnInit() {
    // Set up real-time data stream
    this.metricsService.getMetricsStream()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Metrics stream error:', error);
          return EMPTY;
        })
      )
      .subscribe(metrics => {
        this.metrics = metrics;
      });
    
    // Set up periodic refresh
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.metricsService.refreshMetrics();
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**3. Complex Initialization Logic**

```typescript
@Component({
  selector: 'app-chart',
  template: `<canvas #chartCanvas></canvas>`
})
export class ChartComponent implements OnInit {
  @Input() data!: ChartData;
  @Input() options: ChartOptions = {};
  
  private defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true }
    }
  };
  
  constructor(
    private chartService: ChartService,
    private themeService: ThemeService
  ) {}
  
  ngOnInit() {
    // Merge options with defaults
    const mergedOptions = {
      ...this.defaultOptions,
      ...this.options,
      // Apply theme colors
      backgroundColor: this.themeService.getChartColors()
    };
    
    // Validate data
    if (!this.validateChartData(this.data)) {
      console.error('Invalid chart data provided');
      return;
    }
    
    // Register custom plugins
    this.chartService.registerPlugins();
    
    // Note: Chart initialization happens in ngAfterViewInit
    // because we need access to the canvas element
  }
  
  private validateChartData(data: ChartData): boolean {
    return data && data.datasets && data.datasets.length > 0;
  }
}
```

### Common Mistakes

```typescript
// ❌ MISTAKE 1: Heavy logic in constructor
constructor(private service: DataService) {
  // This runs before inputs are set!
  this.service.getData().subscribe(data => {
    this.processData(data); // Might fail if it depends on inputs
  });
}

// ✅ CORRECT: Move to ngOnInit
ngOnInit() {
  this.service.getData().subscribe(data => {
    this.processData(data);
  });
}

// ❌ MISTAKE 2: Accessing ViewChild in ngOnInit
@ViewChild('myElement') element!: ElementRef;

ngOnInit() {
  // This will be undefined!
  this.element.nativeElement.focus();
}

// ✅ CORRECT: Use ngAfterViewInit
ngAfterViewInit() {
  this.element.nativeElement.focus();
}

// ❌ MISTAKE 3: Not handling async errors
ngOnInit() {
  this.service.getData().subscribe(data => {
    this.data = data;
  });
  // No error handling!
}

// ✅ CORRECT: Always handle errors
ngOnInit() {
  this.service.getData().subscribe({
    next: (data) => this.data = data,
    error: (err) => this.handleError(err)
  });
}
```

---

## 2. ngOnDestroy - Critical for Memory Leaks (Used in ~60% of Components)

### What It Is

`ngOnDestroy` is called **once** just before Angular destroys the component. It's your last chance to clean up resources and prevent memory leaks.

### Why It's Critical

Every subscription, timer, event listener, or external resource that isn't cleaned up will continue to exist in memory even after the component is destroyed. In a single-page application where users navigate between routes, this leads to:
- Memory leaks that accumulate over time
- Multiple subscriptions firing for destroyed components
- Application slowdown and eventual crashes
- Wasted network requests

### The Technical Details

```typescript
export interface OnDestroy {
  ngOnDestroy(): void;
}
```

**When it's called:**
- Just before the component is removed from the DOM
- Before the component instance is destroyed
- Only once in the component's lifetime

**What you should clean up:**
- Observable subscriptions
- Event listeners
- Timers (setTimeout, setInterval)
- WebSocket connections
- IndexedDB connections
- Third-party library instances
- Manual DOM manipulations

### Real-World Use Cases

**1. Unsubscribing from Observables (The Most Common Use Case)**

```typescript
@Component({
  selector: 'app-data-stream',
  template: `
    <div *ngFor="let item of items">{{ item }}</div>
  `
})
export class DataStreamComponent implements OnInit, OnDestroy {
  items: any[] = [];
  
  // Pattern 1: Subject + takeUntil (Recommended)
  private destroy$ = new Subject<void>();
  
  constructor(private dataService: DataService) {}
  
  ngOnInit() {
    // All subscriptions use takeUntil
    this.dataService.getDataStream()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.items = data;
      });
    
    this.dataService.getUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        this.handleUpdate(update);
      });
    
    // Even HTTP requests benefit from takeUntil
    // (cancels pending requests on navigation)
    this.dataService.fetchInitialData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.items = data;
      });
  }
  
  ngOnDestroy() {
    // Unsubscribe from all observables at once
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Why takeUntil is better than manual unsubscribe:**

```typescript
// ❌ Manual unsubscribe (verbose, error-prone)
export class ManualUnsubscribeComponent implements OnInit, OnDestroy {
  private subscription1: Subscription;
  private subscription2: Subscription;
  private subscription3: Subscription;
  
  ngOnInit() {
    this.subscription1 = this.service1.getData().subscribe(/*...*/);
    this.subscription2 = this.service2.getData().subscribe(/*...*/);
    this.subscription3 = this.service3.getData().subscribe(/*...*/);
  }
  
  ngOnDestroy() {
    // Easy to forget one!
    this.subscription1?.unsubscribe();
    this.subscription2?.unsubscribe();
    this.subscription3?.unsubscribe();
  }
}

// ✅ takeUntil pattern (clean, scalable)
export class TakeUntilComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    this.service1.getData().pipe(takeUntil(this.destroy$)).subscribe(/*...*/);
    this.service2.getData().pipe(takeUntil(this.destroy$)).subscribe(/*...*/);
    this.service3.getData().pipe(takeUntil(this.destroy$)).subscribe(/*...*/);
    // Add as many as needed, all cleaned up automatically
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**2. Cleaning Up Timers and Intervals**

```typescript
@Component({
  selector: 'app-countdown-timer',
  template: `
    <div class="timer">{{ timeRemaining }}</div>
  `
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  timeRemaining = 60;
  private intervalId: any;
  private timeoutId: any;
  
  ngOnInit() {
    // Countdown every second
    this.intervalId = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.onTimerComplete();
      }
    }, 1000);
    
    // Auto-refresh data every 30 seconds
    this.timeoutId = setTimeout(() => {
      this.refreshData();
    }, 30000);
  }
  
  ngOnDestroy() {
    // CRITICAL: Clear timers to prevent memory leaks
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
  
  private onTimerComplete() {
    clearInterval(this.intervalId);
    // Handle completion
  }
  
  private refreshData() {
    // Refresh logic
  }
}
```

**3. Removing Event Listeners**

```typescript
@Component({
  selector: 'app-keyboard-shortcuts',
  template: `<div>Press Ctrl+S to save</div>`
})
export class KeyboardShortcutsComponent implements OnInit, OnDestroy {
  private handleKeyPress = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      this.save();
    }
  };
  
  private handleResize = () => {
    this.adjustLayout();
  };
  
  ngOnInit() {
    // Add global event listeners
    document.addEventListener('keydown', this.handleKeyPress);
    window.addEventListener('resize', this.handleResize);
  }
  
  ngOnDestroy() {
    // CRITICAL: Remove event listeners
    document.removeEventListener('keydown', this.handleKeyPress);
    window.removeEventListener('resize', this.handleResize);
  }
  
  private save() {
    console.log('Saving...');
  }
  
  private adjustLayout() {
    console.log('Adjusting layout...');
  }
}
```

**4. Cleaning Up Third-Party Libraries**

```typescript
@Component({
  selector: 'app-map',
  template: `<div #mapContainer class="map"></div>`
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  
  ngAfterViewInit() {
    // Initialize Google Maps
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: { lat: 0, lng: 0 },
      zoom: 8
    });
    
    // Add markers
    this.addMarkers();
  }
  
  ngOnDestroy() {
    // Clean up map resources
    if (this.map) {
      // Remove all event listeners
      google.maps.event.clearInstanceListeners(this.map);
      
      // Remove markers
      this.markers.forEach(marker => {
        marker.setMap(null);
      });
      this.markers = [];
      
      // Clear map reference
      this.map = null;
    }
  }
  
  private addMarkers() {
    // Add markers logic
  }
}
```

**5. WebSocket Cleanup**

```typescript
@Component({
  selector: 'app-live-chat',
  template: `
    <div *ngFor="let message of messages">
      {{ message.text }}
    </div>
  `
})
export class LiveChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private ws: WebSocket | null = null;
  
  ngOnInit() {
    this.connectWebSocket();
  }
  
  private connectWebSocket() {
    this.ws = new WebSocket('wss://api.example.com/chat');
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messages.push(message);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  ngOnDestroy() {
    // CRITICAL: Close WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### The Real Cost of Forgetting ngOnDestroy

**Scenario:** User navigates between routes 50 times in a session

**Without ngOnDestroy:**
- 50 active subscriptions (all still running)
- 50 interval timers (all still ticking)
- 50 event listeners (all still attached)
- Memory usage: 500MB+
- Application becomes sluggish after 10 minutes

**With ngOnDestroy:**
- 1 active subscription (current route only)
- 1 interval timer (current route only)
- 1 event listener (current route only)
- Memory usage: 50MB
- Application stays fast indefinitely

### Common Mistakes

```typescript
// ❌ MISTAKE 1: Forgetting to unsubscribe
ngOnInit() {
  this.service.getData().subscribe(data => {
    this.data = data;
  });
  // Memory leak! Subscription never cleaned up
}

// ✅ CORRECT
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// ❌ MISTAKE 2: Not clearing timers
ngOnInit() {
  setInterval(() => {
    this.updateData();
  }, 1000);
  // Timer keeps running after component is destroyed!
}

// ✅ CORRECT
private intervalId: any;

ngOnInit() {
  this.intervalId = setInterval(() => {
    this.updateData();
  }, 1000);
}

ngOnDestroy() {
  clearInterval(this.intervalId);
}

// ❌ MISTAKE 3: Async pipe doesn't need unsubscribe
// (This is actually correct - async pipe handles it)
template: `<div>{{ data$ | async }}</div>`
// No ngOnDestroy needed for async pipe!
```

---

## 3. ngOnChanges - For Reactive @Input() Logic (Used in ~30% of Components)

### What It Is

`ngOnChanges` is called whenever an `@Input()` property changes. It receives a `SimpleChanges` object containing the previous and current values of all changed inputs.

### Why It Exists

Sometimes you need to react to input changes and perform logic based on:
- What specific input changed
- The previous value vs. current value
- Multiple inputs changing together
- Validation or transformation of inputs

### The Technical Details

```typescript
export interface OnChanges {
  ngOnChanges(changes: SimpleChanges): void;
}

interface SimpleChanges {
  [propName: string]: SimpleChange;
}

interface SimpleChange {
  previousValue: any;
  currentValue: any;
  firstChange: boolean;
}
```

**When it's called:**
- Before `ngOnInit` (if inputs exist)
- Whenever any `@Input()` property changes
- Multiple times during component lifetime

**What's available:**
- Previous and current values of all changed inputs
- `firstChange` flag to detect initial binding

### Real-World Use Cases

**1. Reacting to Specific Input Changes**

```typescript
@Component({
  selector: 'app-user-card',
  template: `
    <div class="card">
      <img [src]="avatarUrl">
      <h3>{{ user?.name }}</h3>
      <p>{{ user?.email }}</p>
    </div>
  `
})
export class UserCardComponent implements OnChanges {
  @Input() userId!: string;
  @Input() showDetails = false;
  
  user: User | null = null;
  avatarUrl = '';
  
  constructor(private userService: UserService) {}
  
  ngOnChanges(changes: SimpleChanges) {
    // React to userId changes
    if (changes['userId']) {
      const currentId = changes['userId'].currentValue;
      const previousId = changes['userId'].previousValue;
      
      console.log(`User ID changed from ${previousId} to ${currentId}`);
      
      // Don't fetch on first change if ID is empty
      if (currentId && !changes['userId'].firstChange) {
        this.loadUser(currentId);
      }
    }
    
    // React to showDetails changes
    if (changes['showDetails'] && !changes['showDetails'].firstChange) {
      if (changes['showDetails'].currentValue) {
        this.loadAdditionalDetails();
      }
    }
  }
  
  private loadUser(userId: string) {
    this.userService.getUser(userId).subscribe(user => {
      this.user = user;
      this.avatarUrl = user.avatarUrl;
    });
  }
  
  private loadAdditionalDetails() {
    // Load extra data when details are shown
  }
}
```

**2. Deriving State from Multiple Inputs**

```typescript
@Component({
  selector: 'app-chart',
  template: `<canvas #chart></canvas>`
})
export class ChartComponent implements OnChanges, AfterViewInit {
  @Input() data: ChartData[] = [];
  @Input() chartType: 'line' | 'bar' | 'pie' = 'line';
  @Input() options: ChartOptions = {};
  @Input() theme: 'light' | 'dark' = 'light';
  
  @ViewChild('chart') chartElement!: ElementRef;
  private chartInstance: Chart | null = null;
  private needsRebuild = false;
  
  ngOnChanges(changes: SimpleChanges) {
    // Determine if we need to rebuild or just update
    const structuralChanges = changes['chartType'] || changes['theme'];
    const dataChanges = changes['data'] || changes['options'];
    
    if (structuralChanges) {
      // Chart type or theme changed - need full rebuild
      this.needsRebuild = true;
    } else if (dataChanges && this.chartInstance) {
      // Only data changed - can update existing chart
      this.updateChartData();
    }
    
    // Log changes for debugging
    if (!changes['data']?.firstChange) {
      const prevLength = changes['data']?.previousValue?.length || 0;
      const currLength = changes['data']?.currentValue?.length || 0;
      console.log(`Data points changed: ${prevLength} → ${currLength}`);
    }
  }
  
  ngAfterViewInit() {
    this.buildChart();
  }
  
  private buildChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
    
    this.chartInstance = new Chart(this.chartElement.nativeElement, {
      type: this.chartType,
      data: this.data,
      options: this.getOptionsForTheme()
    });
    
    this.needsRebuild = false;
  }
  
  private updateChartData() {
    if (this.chartInstance) {
      this.chartInstance.data = this.data;
      this.chartInstance.update();
    }
  }
  
  private getOptionsForTheme(): ChartOptions {
    return {
      ...this.options,
      backgroundColor: this.theme === 'dark' ? '#333' : '#fff',
      color: this.theme === 'dark' ? '#fff' : '#000'
    };
  }
}
```

**3. Input Validation and Transformation**

```typescript
@Component({
  selector: 'app-pagination',
  template: `
    <div class="pagination">
      <button (click)="previousPage()" [disabled]="currentPage === 1">
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button (click)="nextPage()" [disabled]="currentPage === totalPages">
        Next
      </button>
    </div>
  `
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems = 0;
  @Input() itemsPerPage = 10;
  @Input() currentPage = 1;
  
  @Output() pageChange = new EventEmitter<number>();
  
  totalPages = 0;
  
  ngOnChanges(changes: SimpleChanges) {
    // Validate and transform inputs
    if (changes['totalItems'] || changes['itemsPerPage']) {
      // Ensure itemsPerPage is positive
      if (this.itemsPerPage <= 0) {
        console.warn('itemsPerPage must be positive, defaulting to 10');
        this.itemsPerPage = 10;
      }
      
      // Calculate total pages
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
      
      // Ensure current page is valid
      if (this.currentPage > this.totalPages) {
        this.currentPage = Math.max(1, this.totalPages);
        this.pageChange.emit(this.currentPage);
      }
    }
    
    // Validate currentPage
    if (changes['currentPage']) {
      const page = changes['currentPage'].currentValue;
      if (page < 1 || page > this.totalPages) {
        console.warn(`Invalid page ${page}, must be between 1 and ${this.totalPages}`);
        this.currentPage = Math.max(1, Math.min(page, this.totalPages));
      }
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageChange.emit(this.currentPage);
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pageChange.emit(this.currentPage);
    }
  }
}
```

**4. Comparing Previous and Current Values**

```typescript
@Component({
  selector: 'app-search-results',
  template: `
    <div *ngIf="isNewSearch" class="new-search-indicator">
      New search performed
    </div>
    <div *ngFor="let result of results">
      {{ result.title }}
    </div>
  `
})
export class SearchResultsComponent implements OnChanges {
  @Input() searchQuery = '';
  @Input() filters: SearchFilters = {};
  
  results: SearchResult[] = [];
  isNewSearch = false;
  
  constructor(private searchService: SearchService) {}
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchQuery']) {
      const prev = changes['searchQuery'].previousValue;
      const curr = changes['searchQuery'].currentValue;
      
      // Detect if this is a completely new search vs. refinement
      this.isNewSearch = prev && curr && 
        !curr.toLowerCase().includes(prev.toLowerCase());
      
      if (!changes['searchQuery'].firstChange) {
        this.performSearch();
      }
    }
    
    if (changes['filters'] && !changes['filters'].firstChange) {
      // Filters changed - refine existing search
      this.refineSearch();
    }
  }
  
  private performSearch() {
    this.searchService.search(this.searchQuery, this.filters)
      .subscribe(results => {
        this.results = results;
      });
  }
  
  private refineSearch() {
    // Apply filters to existing results
    this.results = this.results.filter(result => 
      this.matchesFilters(result, this.filters)
    );
  }
  
  private matchesFilters(result: SearchResult, filters: SearchFilters): boolean {
    // Filter logic
    return true;
  }
}
```

### When NOT to Use ngOnChanges

```typescript
// ❌ DON'T use ngOnChanges for simple display
@Component({
  template: `<div>{{ name }}</div>`
})
export class SimpleComponent implements OnChanges {
  @Input() name = '';
  
  ngOnChanges(changes: SimpleChanges) {
    // Unnecessary! Template binding handles this
    if (changes['name']) {
      // No logic needed
    }
  }
}

// ✅ Just use the input directly
@Component({
  template: `<div>{{ name }}</div>`
})
export class SimpleComponent {
  @Input() name = '';
  // No ngOnChanges needed!
}

// ❌ DON'T use ngOnChanges for every change detection
@Component({})
export class BadComponent implements OnChanges {
  @Input() data: any;
  
  ngOnChanges(changes: SimpleChanges) {
    // This is what ngDoCheck is for (but you probably don't need that either)
    console.log('Change detected');
  }
}
```

### Common Mistakes

```typescript
// ❌ MISTAKE 1: Not checking firstChange
ngOnChanges(changes: SimpleChanges) {
  if (changes['userId']) {
    this.loadUser(changes['userId'].currentValue);
    // This runs on initial binding too!
    // Might cause double-loading if ngOnInit also loads
  }
}

// ✅ CORRECT: Check firstChange
ngOnChanges(changes: SimpleChanges) {
  if (changes['userId'] && !changes['userId'].firstChange) {
    this.loadUser(changes['userId'].currentValue);
  }
}

// ❌ MISTAKE 2: Mutating input objects
@Input() config: Config;

ngOnChanges(changes: SimpleChanges) {
  if (changes['config']) {
    // DON'T mutate the input!
    this.config.theme = 'dark';
  }
}

// ✅ CORRECT: Create new object
ngOnChanges(changes: SimpleChanges) {
  if (changes['config']) {
    this.config = { ...this.config, theme: 'dark' };
  }
}

// ❌ MISTAKE 3: Expensive operations without guards
ngOnChanges(changes: SimpleChanges) {
  // Runs for ANY input change!
  this.expensiveOperation();
}

// ✅ CORRECT: Check specific inputs
ngOnChanges(changes: SimpleChanges) {
  if (changes['criticalInput']) {
    this.expensiveOperation();
  }
}
```

---

## 4. ngAfterViewInit - For DOM/Child Component Access (Used in ~20% of Components)

### What It Is

`ngAfterViewInit` is called **once** after Angular has fully initialized the component's view and all child views. This is when `@ViewChild` and `@ViewChildren` queries are guaranteed to be available.

### Why It Exists

The component's template and child components aren't ready until after the initial change detection cycle completes. `ngAfterViewInit` guarantees:
- All `@ViewChild` and `@ViewChildren` queries are resolved
- Child components are fully initialized
- The DOM is ready for manipulation
- Third-party libraries can safely access DOM elements

### The Technical Details

```typescript
export interface AfterViewInit {
  ngAfterViewInit(): void;
}
```

**When it's called:**
- After `ngAfterContentChecked`
- After the first `ngAfterViewChecked`
- Only once in the component's lifetime
- After all child component views are initialized

**What's available:**
- `@ViewChild` and `@ViewChildren` queries
- Native DOM elements via `ElementRef`
- Child component instances
- Template reference variables

### Real-World Use Cases

**1. Focusing Input Elements**

```typescript
@Component({
  selector: 'app-login-form',
  template: `
    <form>
      <input #emailInput type="email" placeholder="Email">
      <input type="password" placeholder="Password">
      <button type="submit">Login</button>
    </form>
  `
})
export class LoginFormComponent implements AfterViewInit {
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;
  
  ngAfterViewInit() {
    // ✅ ViewChild is now available
    // Auto-focus the email input for better UX
    this.emailInput.nativeElement.focus();
    
    // Can also set other properties
    this.emailInput.nativeElement.setAttribute('autocomplete', 'email');
  }
}
```

**2. Initializing Third-Party Libraries**

```typescript
@Component({
  selector: 'app-code-editor',
  template: `
    <div #editorContainer class="editor-container"></div>
  `
})
export class CodeEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer') editorContainer!: ElementRef;
  @Input() initialCode = '';
  @Input() language = 'javascript';
  
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  
  ngAfterViewInit() {
    // Initialize Monaco Editor
    // Must wait for DOM to be ready
    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: this.initialCode,
      language: this.language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false }
    });
    
    // Set up event listeners
    this.editor.onDidChangeModelContent(() => {
      const code = this.editor?.getValue() || '';
      this.onCodeChange(code);
    });
  }
  
  ngOnDestroy() {
    // Clean up editor instance
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  }
  
  private onCodeChange(code: string) {
    // Handle code changes
    console.log('Code changed:', code);
  }
}
```

**3. Measuring DOM Elements**

```typescript
@Component({
  selector: 'app-responsive-grid',
  template: `
    <div #gridContainer class="grid-container">
      <div *ngFor="let item of items" class="grid-item">
        {{ item.title }}
      </div>
    </div>
  `
})
export class ResponsiveGridComponent implements AfterViewInit {
  @ViewChild('gridContainer') gridContainer!: ElementRef;
  @Input() items: GridItem[] = [];
  
  columnCount = 3;
  itemWidth = 0;
  
  ngAfterViewInit() {
    // Measure container width
    const containerWidth = this.gridContainer.nativeElement.offsetWidth;
    
    // Calculate optimal column count based on container width
    if (containerWidth < 600) {
      this.columnCount = 1;
    } else if (containerWidth < 900) {
      this.columnCount = 2;
    } else {
      this.columnCount = 3;
    }
    
    // Calculate item width
    this.itemWidth = containerWidth / this.columnCount;
    
    // Apply calculated styles
    this.applyGridLayout();
  }
  
  private applyGridLayout() {
    const container = this.gridContainer.nativeElement;
    container.style.gridTemplateColumns = `repeat(${this.columnCount}, 1fr)`;
  }
}
```

**4. Accessing Child Components**

```typescript
// Child component
@Component({
  selector: 'app-data-table',
  template: `<table>...</table>`
})
export class DataTableComponent {
  sortColumn(column: string) {
    console.log('Sorting by:', column);
  }
  
  exportData() {
    console.log('Exporting data...');
  }
  
  refresh() {
    console.log('Refreshing data...');
  }
}

// Parent component
@Component({
  selector: 'app-dashboard',
  template: `
    <div>
      <button (click)="sortTable()">Sort</button>
      <button (click)="exportTable()">Export</button>
      <app-data-table></app-data-table>
    </div>
  `
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild(DataTableComponent) dataTable!: DataTableComponent;
  
  ngAfterViewInit() {
    // ✅ Child component is now available
    // Can call child component methods
    console.log('Data table initialized');
    
    // Auto-refresh on init
    this.dataTable.refresh();
  }
  
  sortTable() {
    this.dataTable.sortColumn('name');
  }
  
  exportTable() {
    this.dataTable.exportData();
  }
}
```

**5. Working with Multiple ViewChildren**

```typescript
@Component({
  selector: 'app-form-validator',
  template: `
    <form>
      <input #input1 type="text" required>
      <input #input2 type="email" required>
      <input #input3 type="tel" required>
    </form>
  `
})
export class FormValidatorComponent implements AfterViewInit {
  @ViewChildren('input1, input2, input3') 
  inputs!: QueryList<ElementRef<HTMLInputElement>>;
  
  ngAfterViewInit() {
    // Access all inputs
    console.log('Total inputs:', this.inputs.length);
    
    // Add validation to each input
    this.inputs.forEach((inputRef, index) => {
      const input = inputRef.nativeElement;
      
      input.addEventListener('blur', () => {
        this.validateInput(input, index);
      });
    });
    
    // Listen for changes in the query list
    this.inputs.changes.subscribe(() => {
      console.log('Input list changed');
    });
  }
  
  private validateInput(input: HTMLInputElement, index: number) {
    if (!input.value) {
      input.classList.add('error');
      console.log(`Input ${index + 1} is required`);
    } else {
      input.classList.remove('error');
    }
  }
}
```

### The ExpressionChangedAfterItHasBeenCheckedError Trap

This is the most common error when using `ngAfterViewInit`:

```typescript
@Component({
  template: `
    <div>{{ message }}</div>
    <div #content>Content</div>
  `
})
export class ProblematicComponent implements AfterViewInit {
  @ViewChild('content') content!: ElementRef;
  message = 'Initial';
  
  ngAfterViewInit() {
    // ❌ ERROR: ExpressionChangedAfterItHasBeenCheckedError
    // Change detection has already run, but we're changing a bound property
    this.message = 'Changed in AfterViewInit';
  }
}
```

**Why this happens:**
1. Change detection runs and checks all bindings
2. `ngAfterViewInit` is called
3. You modify a bound property (`message`)
4. In development mode, Angular runs a second check
5. It detects the value changed after checking
6. Error is thrown to warn you of potential issues

**Solutions:**

```typescript
// Solution 1: Use setTimeout (microtask)
ngAfterViewInit() {
  setTimeout(() => {
    this.message = 'Changed safely';
  });
}

// Solution 2: Use ChangeDetectorRef
constructor(private cdr: ChangeDetectorRef) {}

ngAfterViewInit() {
  this.message = 'Changed';
  this.cdr.detectChanges(); // Manually trigger change detection
}

// Solution 3: Use Promise (microtask)
ngAfterViewInit() {
  Promise.resolve().then(() => {
    this.message = 'Changed safely';
  });
}

// Solution 4: Move logic to ngOnInit (if possible)
ngOnInit() {
  // If you don't actually need ViewChild, do it here
  this.message = 'Changed';
}
```

### Common Mistakes

```typescript
// ❌ MISTAKE 1: Accessing ViewChild in ngOnInit
@ViewChild('element') element!: ElementRef;

ngOnInit() {
  // undefined! ViewChild not ready yet
  this.element.nativeElement.focus();
}

// ✅ CORRECT: Use ngAfterViewInit
ngAfterViewInit() {
  this.element.nativeElement.focus();
}

// ❌ MISTAKE 2: Not handling dynamic ViewChildren
@ViewChild('dynamic') dynamic!: ElementRef;

ngAfterViewInit() {
  // Might be undefined if *ngIf is false
  this.dynamic.nativeElement.focus();
}

// ✅ CORRECT: Check if it exists
ngAfterViewInit() {
  if (this.dynamic) {
    this.dynamic.nativeElement.focus();
  }
}

// ❌ MISTAKE 3: Modifying bound properties without protection
ngAfterViewInit() {
  this.boundProperty = 'new value';
  // ExpressionChangedAfterItHasBeenCheckedError
}

// ✅ CORRECT: Use setTimeout or ChangeDetectorRef
ngAfterViewInit() {
  setTimeout(() => {
    this.boundProperty = 'new value';
  });
}
```

---

## 5. ngAfterContentInit - For <ng-content> Projection (Used in ~5% of Components)

### What It Is

`ngAfterContentInit` is called **once** after Angular projects external content into the component's view via `<ng-content>`. This is when `@ContentChild` and `@ContentChildren` queries are available.

### Why It Exists

When building reusable wrapper components that accept projected content, you need to know when that content is ready. `ngAfterContentInit` guarantees:
- All `@ContentChild` and `@ContentChildren` queries are resolved
- Projected content is initialized
- You can interact with projected components

### The Technical Details

```typescript
export interface AfterContentInit {
  ngAfterContentInit(): void;
}
```

**When it's called:**
- After `ngDoCheck`
- After the first `ngAfterContentChecked`
- Before `ngAfterViewInit`
- Only once in the component's lifetime

**What's available:**
- `@ContentChild` and `@ContentChildren` queries
- Projected component instances
- Projected DOM elements

### Real-World Use Cases

**1. Building a Card Component with Projected Content**

```typescript
// Card component
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <div class="card-header" *ngIf="hasHeader">
        <ng-content select="[card-header]"></ng-content>
      </div>
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      <div class="card-footer" *ngIf="hasFooter">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .card { border: 1px solid #ddd; border-radius: 4px; }
    .card-header { background: #f5f5f5; padding: 1rem; }
    .card-body { padding: 1rem; }
    .card-footer { background: #f5f5f5; padding: 1rem; }
  `]
})
export class CardComponent implements AfterContentInit {
  @ContentChild('[card-header]') header!: ElementRef;
  @ContentChild('[card-footer]') footer!: ElementRef;
  
  hasHeader = false;
  hasFooter = false;
  
  ngAfterContentInit() {
    // Check if header and footer were projected
    this.hasHeader = !!this.header;
    this.hasFooter = !!this.footer;
    
    console.log('Card initialized with:', {
      hasHeader: this.hasHeader,
      hasFooter: this.hasFooter
    });
  }
}

// Usage
@Component({
  template: `
    <app-card>
      <div card-header>
        <h3>Card Title</h3>
      </div>
      <p>Card content goes here</p>
      <div card-footer>
        <button>Action</button>
      </div>
    </app-card>
  `
})
export class ParentComponent {}
```

**2. Tab Container with Projected Tab Components**

```typescript
// Tab component
@Component({
  selector: 'app-tab',
  template: `
    <div *ngIf="active">
      <ng-content></ng-content>
    </div>
  `
})
export class TabComponent {
  @Input() title = '';
  active = false;
}

// Tab container
@Component({
  selector: 'app-tabs',
  template: `
    <div class="tab-headers">
      <button *ngFor="let tab of tabs; let i = index"
              (click)="selectTab(i)"
              [class.active]="tab.active">
        {{ tab.title }}
      </button>
    </div>
    <div class="tab-content">
      <ng-content></ng-content>
    </div>
  `
})
export class TabsComponent implements AfterContentInit {
  @ContentChildren(TabComponent) tabs!: QueryList<TabComponent>;
  
  ngAfterContentInit() {
    // Activate first tab by default
    if (this.tabs.length > 0) {
      this.tabs.first.active = true;
    }
    
    // Listen for changes in tabs
    this.tabs.changes.subscribe(() => {
      console.log('Tabs changed:', this.tabs.length);
    });
  }
  
  selectTab(index: number) {
    // Deactivate all tabs
    this.tabs.forEach(tab => tab.active = false);
    
    // Activate selected tab
    this.tabs.toArray()[index].active = true;
  }
}

// Usage
@Component({
  template: `
    <app-tabs>
      <app-tab title="Tab 1">Content 1</app-tab>
      <app-tab title="Tab 2">Content 2</app-tab>
      <app-tab title="Tab 3">Content 3</app-tab>
    </app-tabs>
  `
})
export class ParentComponent {}
```

**3. Accordion with Projected Panels**

```typescript
// Accordion panel
@Component({
  selector: 'app-accordion-panel',
  template: `
    <div class="panel">
      <div class="panel-header" (click)="toggle()">
        <h4>{{ title }}</h4>
        <span>{{ expanded ? '−' : '+' }}</span>
      </div>
      <div class="panel-content" *ngIf="expanded">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class AccordionPanelComponent {
  @Input() title = '';
  expanded = false;
  
  toggle() {
    this.expanded = !this.expanded;
  }
  
  collapse() {
    this.expanded = false;
  }
}

// Accordion container
@Component({
  selector: 'app-accordion',
  template: `
    <div class="accordion">
      <ng-content></ng-content>
    </div>
  `
})
export class AccordionComponent implements AfterContentInit {
  @ContentChildren(AccordionPanelComponent) 
  panels!: QueryList<AccordionPanelComponent>;
  
  @Input() allowMultiple = false;
  
  ngAfterContentInit() {
    // Set up panel interactions
    this.panels.forEach(panel => {
      const originalToggle = panel.toggle.bind(panel);
      
      panel.toggle = () => {
        if (!this.allowMultiple && !panel.expanded) {
          // Collapse all other panels
          this.panels.forEach(p => {
            if (p !== panel) {
              p.collapse();
            }
          });
        }
        originalToggle();
      };
    });
    
    console.log('Accordion initialized with', this.panels.length, 'panels');
  }
}

// Usage
@Component({
  template: `
    <app-accordion [allowMultiple]="false">
      <app-accordion-panel title="Section 1">
        Content for section 1
      </app-accordion-panel>
      <app-accordion-panel title="Section 2">
        Content for section 2
      </app-accordion-panel>
      <app-accordion-panel title="Section 3">
        Content for section 3
      </app-accordion-panel>
    </app-accordion>
  `
})
export class ParentComponent {}
```

### Common Mistakes

```typescript
// ❌ MISTAKE: Confusing ContentChild with ViewChild
@Component({
  template: `
    <div #localElement>Local</div>
    <ng-content></ng-content>
  `
})
export class WrapperComponent {
  // ❌ Wrong: Use @ViewChild for template elements
  @ContentChild('localElement') element!: ElementRef;
  
  // ✅ Correct: Use @ViewChild for template elements
  @ViewChild('localElement') element!: ElementRef;
  
  // ✅ Correct: Use @ContentChild for projected content
  @ContentChild(ProjectedComponent) projected!: ProjectedComponent;
}
```

---

## 6. ngDoCheck - Custom Change Detection (Used in ~2% of Components)

### What It Is

`ngDoCheck` is called during **every** change detection cycle, allowing you to implement custom change detection logic.

### Why It Exists (and Why You Probably Don't Need It)

Angular's default change detection checks primitive values and object references. Sometimes you need to detect changes inside objects or arrays that Angular wouldn't normally catch. However, this comes at a significant performance cost.

### The Technical Details

```typescript
export interface DoCheck {
  ngDoCheck(): void;
}
```

**When it's called:**
- After `ngOnChanges`
- Before `ngAfterContentInit`
- On **every** change detection cycle
- Hundreds of times per second in active applications

**⚠️ Performance Warning:**
This hook runs constantly. Use it only when absolutely necessary and keep the logic extremely lightweight.

### Real-World Use Cases (Rare)

**1. Deep Object Comparison**

```typescript
@Component({
  selector: 'app-complex-config',
  template: `
    <div>Config hash: {{ configHash }}</div>
  `
})
export class ComplexConfigComponent implements DoCheck {
  @Input() config: ComplexConfig = {};
  
  private previousConfigHash = '';
  configHash = '';
  
  ngDoCheck() {
    // Create hash of config object
    const currentHash = JSON.stringify(this.config);
    
    // Only process if actually changed
    if (currentHash !== this.previousConfigHash) {
      console.log('Config changed deeply');
      this.configHash = this.hashCode(currentHash);
      this.previousConfigHash = currentHash;
      this.processConfigChange();
    }
  }
  
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
  
  private processConfigChange() {
    // Handle config change
  }
}
```

**2. Detecting Array Mutations**

```typescript
@Component({
  selector: 'app-list-monitor',
  template: `
    <div>Items: {{ items.length }}</div>
    <div>Checksum: {{ checksum }}</div>
  `
})
export class ListMonitorComponent implements DoCheck {
  @Input() items: any[] = [];
  
  private previousLength = 0;
  private previousChecksum = '';
  checksum = '';
  
  ngDoCheck() {
    // Check if array length changed
    if (this.items.length !== this.previousLength) {
      console.log('Array length changed');
      this.previousLength = this.items.length;
      this.onItemsChanged();
    }
    
    // Check if array contents changed
    const currentChecksum = this.calculateChecksum(this.items);
    if (currentChecksum !== this.previousChecksum) {
      console.log('Array contents changed');
      this.checksum = currentChecksum;
      this.previousChecksum = currentChecksum;
      this.onItemsChanged();
    }
  }
  
  private calculateChecksum(items: any[]): string {
    return items.map(item => item.id).join(',');
  }
  
  private onItemsChanged() {
    // Handle items change
  }
}
```

### Why You Should Avoid ngDoCheck

**Performance Impact:**

```typescript
// This runs on EVERY change detection cycle
ngDoCheck() {
  console.log('ngDoCheck called');
  // In a typical app: 100+ times per second
  // In an active app: 500+ times per second
}
```

**Better Alternatives:**

```typescript
// ❌ Using ngDoCheck for input changes
ngDoCheck() {
  if (this.data !== this.previousData) {
    this.update();
  }
}

// ✅ Use ngOnChanges instead
ngOnChanges(changes: SimpleChanges) {
  if (changes['data']) {
    this.update();
  }
}

// ❌ Using ngDoCheck for deep object comparison
ngDoCheck() {
  const currentHash = JSON.stringify(this.config);
  if (currentHash !== this.previousHash) {
    this.processConfig();
  }
}

// ✅ Use immutable data patterns + ngOnChanges
// Parent component
updateConfig() {
  this.config = { ...this.config, newProp: 'value' };
}

// Child component
ngOnChanges(changes: SimpleChanges) {
  if (changes['config']) {
    this.processConfig();
  }
}
```

---

## 7. ngAfterViewChecked & ngAfterContentChecked - Almost Never Used

### What They Are

These hooks are called after **every** change detection cycle, after Angular has checked the view/content.

### Why They Exist

They allow you to respond after Angular has finished checking all bindings in the view or content. However, they're rarely needed in practice.

### When They're Called

- `ngAfterContentChecked`: After every check of projected content
- `ngAfterViewChecked`: After every check of component's view
- Both run hundreds of times per second

### The Only Real Use Case: Debugging

```typescript
@Component({})
export class DebugComponent implements AfterViewChecked {
  private checkCount = 0;
  
  ngAfterViewChecked() {
    this.checkCount++;
    if (!environment.production) {
      console.log('View checked:', this.checkCount);
    }
  }
}
```

**⚠️ Warning:** Almost always a code smell if you need these hooks.

---

## Summary: The 80/20 Rule for Lifecycle Hooks

### Use These 80% of the Time

**1. ngOnInit (80% of components)**
- Data fetching
- Setting up subscriptions
- Component initialization

**2. ngOnDestroy (60% of components)**
- Unsubscribing from observables
- Clearing timers
- Removing event listeners

**3. ngOnChanges (30% of components)**
- Reacting to input changes
- Input validation
- Deriving state from inputs

### Use These 20% of the Time

**4. ngAfterViewInit (20% of components)**
- Accessing ViewChild/ViewChildren
- Third-party library initialization
- DOM measurements

**5. ngAfterContentInit (5% of components)**
- Working with projected content
- Building wrapper components

### Almost Never Use These

**6. ngDoCheck (<2% of components)**
- Custom change detection
- Deep object comparison
- (Usually there's a better way)

**7. ngAfterViewChecked (<1% of components)**
- Debugging only

**8. ngAfterContentChecked (<1% of components)**
- Debugging only

### The Standard Component Pattern

```typescript
@Component({
  selector: 'app-standard',
  template: `...`
})
export class StandardComponent implements OnInit, OnDestroy {
  // Inputs
  @Input() data: any;
  
  // ViewChildren (if needed)
  @ViewChild('element') element?: ElementRef;
  
  // Cleanup subject
  private destroy$ = new Subject<void>();
  
  constructor(private service: DataService) {}
  
  ngOnInit() {
    // Initialize and subscribe
    this.service.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.data = data;
      });
  }
  
  ngOnDestroy() {
    // Clean up
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

This pattern covers 90% of real-world scenarios. Master these three hooks, and you'll handle the vast majority of Angular development needs.
