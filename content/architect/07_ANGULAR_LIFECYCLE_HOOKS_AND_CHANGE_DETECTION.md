# Angular Lifecycle Hooks & Change Detection — Architect-Level Deep Dive

> **Scope**: Complete component lifecycle flow, every lifecycle hook with real-world patterns,
> change detection internals (Default vs OnPush), Zone.js mechanics, Angular Signals,
> and production performance optimization strategies.
> Written for principal/staff-level Angular engineers who architect large-scale applications.

> **How to read this document**: Every section starts with a plain-English explanation using
> everyday analogies before diving into technical details. Look for 🔑, 💡, ⚠️, and 📝 icons
> to quickly find key explanations, interview tips, common pitfalls, and summaries.

---

## Table of Contents

1.  [Component Lifecycle Flow](#1-component-lifecycle-flow)
    - 1.1 [Creation Phase](#11-creation-phase)
    - 1.2 [Update Phase (Change Detection Cycle)](#12-update-phase-change-detection-cycle)
    - 1.3 [Destruction Phase](#13-destruction-phase)
    - 1.4 [Complete Lifecycle ASCII Diagram](#14-complete-lifecycle-ascii-diagram)
2.  [ngOnInit — Initialization Done Right](#2-ngoninit--initialization-done-right)
    - 2.1 [When to Use & What's Available](#21-when-to-use--whats-available)
    - 2.2 [Data Fetching Patterns](#22-data-fetching-patterns)
    - 2.3 [Subscription Setup](#23-subscription-setup)
    - 2.4 [Constructor vs ngOnInit — The Real Difference](#24-constructor-vs-ngoninit--the-real-difference)
    - 2.5 [Common Mistakes: ViewChild Access in ngOnInit](#25-common-mistakes-viewchild-access-in-ngoninit)
3.  [ngOnDestroy — Memory Leak Prevention](#3-ngondestroy--memory-leak-prevention)
    - 3.1 [The takeUntil Pattern](#31-the-takeuntil-pattern)
    - 3.2 [DestroyRef & takeUntilDestroyed (Modern Angular)](#32-destroyref--takeuntildestroyed-modern-angular)
    - 3.3 [Cleaning Up Timers, Intervals & Event Listeners](#33-cleaning-up-timers-intervals--event-listeners)
    - 3.4 [WebSocket & Third-Party Library Cleanup](#34-websocket--third-party-library-cleanup)
    - 3.5 [The Real Cost of Forgetting Cleanup](#35-the-real-cost-of-forgetting-cleanup)
4.  [ngOnChanges — Reacting to Input Mutations](#4-ngonchanges--reacting-to-input-mutations)
    - 4.1 [SimpleChanges Object Deep Dive](#41-simplechanges-object-deep-dive)
    - 4.2 [firstChange Flag](#42-firstchange-flag)
    - 4.3 [Reacting to Specific Inputs](#43-reacting-to-specific-inputs)
    - 4.4 [Deriving State from Multiple Inputs](#44-deriving-state-from-multiple-inputs)
    - 4.5 [Input Validation Pattern](#45-input-validation-pattern)
5.  [ngAfterViewInit — DOM Access & Third-Party Integration](#5-ngafterviewinit--dom-access--third-party-integration)
    - 5.1 [ViewChild / ViewChildren Access](#51-viewchild--viewchildren-access)
    - 5.2 [DOM Manipulation & Measurement](#52-dom-manipulation--measurement)
    - 5.3 [Third-Party Library Initialization](#53-third-party-library-initialization)
6.  [ngAfterContentInit / ngAfterContentChecked](#6-ngaftercontentinit--ngaftercontentchecked)
    - 6.1 [Content Projection Lifecycle](#61-content-projection-lifecycle)
    - 6.2 [ContentChild / ContentChildren Queries](#62-contentchild--contentchildren-queries)
7.  [ngDoCheck — Custom Change Detection](#7-ngdocheck--custom-change-detection)
    - 7.1 [When to Use (Rarely)](#71-when-to-use-rarely)
    - 7.2 [Performance Implications](#72-performance-implications)
8.  [Change Detection Deep Dive](#8-change-detection-deep-dive)
    - 8.1 [Default Strategy — How Angular Detects Changes](#81-default-strategy--how-angular-detects-changes)
    - 8.2 [OnPush Strategy — Reference-Based Detection](#82-onpush-strategy--reference-based-detection)
    - 8.3 [Zone.js — The Engine Behind Automatic Detection](#83-zonejs--the-engine-behind-automatic-detection)
    - 8.4 [Change Detection Tree Traversal](#84-change-detection-tree-traversal)
    - 8.5 [markForCheck() vs detectChanges()](#85-markforcheck-vs-detectchanges)
9.  [Angular Signals & Change Detection](#9-angular-signals--change-detection)
    - 9.1 [signal() — Reactive Primitives](#91-signal--reactive-primitives)
    - 9.2 [computed() — Derived State](#92-computed--derived-state)
    - 9.3 [effect() — Side Effects](#93-effect--side-effects)
    - 9.4 [How Signals Bypass Zone.js](#94-how-signals-bypass-zonejs)
    - 9.5 [Signals vs RxJS — When to Use What](#95-signals-vs-rxjs--when-to-use-what)
10. [Performance Patterns & Benchmarks](#10-performance-patterns--benchmarks)
    - 10.1 [OnPush + Immutable Data Pattern](#101-onpush--immutable-data-pattern)
    - 10.2 [Async Pipe — The Unsubscribe Hero](#102-async-pipe--the-unsubscribe-hero)
    - 10.3 [trackBy — List Rendering Optimization](#103-trackby--list-rendering-optimization)
    - 10.4 [Pure Pipes vs Impure Pipes — Performance Benchmarks](#104-pure-pipes-vs-impure-pipes--performance-benchmarks)
    - 10.5 [Performance Comparison Table](#105-performance-comparison-table)

---

## 1. Component Lifecycle Flow


🔑 **Simple Explanation:**
Think of a component's lifecycle like the life of an employee at a company:
- **Creation Phase** = Onboarding day. They get their badge (constructor/DI), receive their assignment details (inputs), set up their desk (ngOnInit), and meet their team (content/view init).
- **Update Phase** = Regular work days. Every day (every change detection cycle), they check if their assignment changed, do their work, and report status.
- **Destruction Phase** = Last day at the company. They return their badge, cancel subscriptions, hand off work, and clean their desk (ngOnDestroy).

Angular calls these "lifecycle hooks" in a very specific, predictable order. Understanding this order is critical because doing something at the wrong time (like trying to access a DOM element before it exists) will cause bugs.

### 1.1 Creation Phase

When Angular instantiates a component, it follows a strict, deterministic sequence:

1. **Constructor** — Class instantiation, DI resolution (no inputs yet)
2. **ngOnChanges()** — First call with initial `@Input()` values
3. **ngOnInit()** — One-time initialization (inputs are available)
4. **ngDoCheck()** — First custom change detection run
5. **ngAfterContentInit()** — Projected content (`<ng-content>`) is initialized
6. **ngAfterContentChecked()** — Projected content checked
7. **ngAfterViewInit()** — Component's view (and child views) fully initialized
8. **ngAfterViewChecked()** — View checked

⚠️ **Common Mistake:** Many developers try to access `@ViewChild` in `ngOnInit`. It won't work because the view hasn't been created yet at that point. You need to wait until `ngAfterViewInit`.

### 1.2 Update Phase (Change Detection Cycle)

On every subsequent change detection cycle:

1. **ngOnChanges()** — Only if `@Input()` bindings changed
2. **ngDoCheck()** — Every cycle, regardless of changes
3. **ngAfterContentChecked()** — After projected content re-checked
4. **ngAfterViewChecked()** — After view re-checked

🔑 **Simple Explanation:**
A "change detection cycle" is Angular's way of asking: "Did anything change? Do I need to update the screen?" It's like a security guard doing rounds — checking every room (component) to see if anything is different. This happens every time a user clicks, types, or when data arrives from a server.

### 1.3 Destruction Phase

1. **ngOnDestroy()** — Component is about to be removed from the DOM

🔑 **Simple Explanation:**
When a user navigates away from a page, Angular removes the old component. Before it does, it calls `ngOnDestroy` — your last chance to clean up. If you don't clean up (cancel timers, close connections), those things keep running in the background, eating memory like a faucet left running.

### 1.4 Complete Lifecycle ASCII Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT LIFECYCLE FLOW                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                    CREATION PHASE                             ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                               ║  │
│  ║   constructor()                                               ║  │
│  ║       │  ← DI injection happens here                         ║  │
│  ║       │  ← @Input() values NOT yet available                 ║  │
│  ║       ▼                                                       ║  │
│  ║   ngOnChanges(changes: SimpleChanges)                        ║  │
│  ║       │  ← First call: all @Input() values as changes        ║  │
│  ║       │  ← changes['inputName'].firstChange === true         ║  │
│  ║       ▼                                                       ║  │
│  ║   ngOnInit()                                                  ║  │
│  ║       │  ← Called ONCE — @Input() values available            ║  │
│  ║       │  ← Safe for HTTP calls, subscription setup            ║  │
│  ║       ▼                                                       ║  │
│  ║   ngDoCheck()                                                 ║  │
│  ║       │  ← Custom change detection logic                     ║  │
│  ║       ▼                                                       ║  │
│  ║   ngAfterContentInit()                                        ║  │
│  ║       │  ← <ng-content> projected content ready               ║  │
│  ║       │  ← @ContentChild queries resolved                    ║  │
│  ║       ▼                                                       ║  │
│  ║   ngAfterContentChecked()                                     ║  │
│  ║       │  ← Projected content change detection done            ║  │
│  ║       ▼                                                       ║  │
│  ║   ngAfterViewInit()                                           ║  │
│  ║       │  ← Component view + child views initialized           ║  │
│  ║       │  ← @ViewChild queries resolved                       ║  │
│  ║       │  ← Safe for DOM measurement / 3rd-party init          ║  │
│  ║       ▼                                                       ║  │
│  ║   ngAfterViewChecked()                                        ║  │
│  ║       │  ← View change detection complete                    ║  │
│  ║       ▼                                                       ║  │
│  ║   ── Component is LIVE ──                                     ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                          │                                          │
│                          ▼                                          │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║              UPDATE PHASE (repeats per CD cycle)              ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                               ║  │
│  ║   ngOnChanges()  ← Only if @Input() refs changed             ║  │
│  ║       │                                                       ║  │
│  ║       ▼                                                       ║  │
│  ║   ngDoCheck()    ← Every cycle                                ║  │
│  ║       │                                                       ║  │
│  ║       ▼                                                       ║  │
│  ║   ngAfterContentChecked()                                     ║  │
│  ║       │                                                       ║  │
│  ║       ▼                                                       ║  │
│  ║   ngAfterViewChecked()                                        ║  │
│  ║       │                                                       ║  │
│  ║       ▼                                                       ║  │
│  ║   ── Wait for next CD trigger ──                              ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                          │                                          │
│                          ▼                                          │
│  ╔═══════════════════════════════════════════════════════════════╗  │
│  ║                   DESTRUCTION PHASE                           ║  │
│  ╠═══════════════════════════════════════════════════════════════╣  │
│  ║                                                               ║  │
│  ║   ngOnDestroy()                                               ║  │
│  ║       │  ← Unsubscribe observables                           ║  │
│  ║       │  ← Clear timers/intervals                            ║  │
│  ║       │  ← Remove event listeners                            ║  │
│  ║       │  ← Disconnect WebSockets                             ║  │
│  ║       │  ← Destroy 3rd-party widget instances                ║  │
│  ║       ▼                                                       ║  │
│  ║   ── Component REMOVED from DOM ──                            ║  │
│  ╚═══════════════════════════════════════════════════════════════╝  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

💡 **Why This Matters:** Interviewers ask about lifecycle order to see if you understand *when* things are safe to do. If you say "I fetch data in the constructor," that's a red flag. If you say "I access ViewChild in ngOnInit," that shows you don't understand the order. They want to hear that you know the exact sequence and *why* each hook exists.

📝 **Quick Summary:**
- The lifecycle goes: Constructor → ngOnChanges → ngOnInit → ngDoCheck → Content hooks → View hooks → ngOnDestroy
- Creation hooks run once; update hooks (ngOnChanges, ngDoCheck, Checked hooks) run on every change detection cycle
- `ngOnDestroy` is your last chance to clean up — missing it causes memory leaks

---

## 2. ngOnInit — Initialization Done Right

🔑 **Simple Explanation:**
`ngOnInit` is like the "ready" signal for your component. Imagine you ordered a pizza (the component). The constructor is when the order is placed. `ngOnChanges` is when the toppings (inputs) are confirmed. `ngOnInit` is when the pizza is assembled and ready to go in the oven. At this point, you know what toppings you have, but the pizza isn't baked yet (the view/DOM isn't ready).

This is THE place to put your startup logic — fetching data, setting up subscriptions, reading route parameters. It's called exactly once, and all your `@Input()` values are available.

### 2.1 When to Use & What's Available

`ngOnInit` is the **primary initialization hook**. At this point:

| Available                        | NOT Available                    |
|----------------------------------|----------------------------------|
| `@Input()` bound values          | `@ViewChild` references          |
| Injected services                | `@ContentChild` references       |
| Route params (via ActivatedRoute)| Rendered DOM elements            |
| Component instance properties    | Child component instances        |

⚠️ **Common Mistake:** Developers often assume everything is available in `ngOnInit`. The DOM and child components are NOT ready yet. If you need to measure a div's width or initialize a chart library on a canvas element, you must wait for `ngAfterViewInit`.

### 2.2 Data Fetching Patterns

```typescript
@Component({
  selector: 'app-user-dashboard',
  template: `
    <!-- Show a loading skeleton while data is being fetched -->
    <div *ngIf="loading" class="skeleton-loader">Loading...</div>
    <!-- Show an error message if the fetch failed -->
    <div *ngIf="error" class="error-banner">{{ error }}</div>
    <!-- Only render the profile once we have user data -->
    <app-user-profile *ngIf="user" [user]="user" />
    <!-- Only render the feed once we have activities -->
    <app-activity-feed *ngIf="activities.length" [activities]="activities" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush // OnPush = only update when we say so
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  // Component state — starts with safe defaults
  user: User | null = null;           // No user loaded yet
  activities: Activity[] = [];         // Empty activities list
  loading = true;                      // Show loading state initially
  error: string | null = null;         // No error initially

  // This Subject is used to cancel all subscriptions when the component is destroyed.
  // Think of it as a "kill switch" — when we emit on this, all subscriptions stop.
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,         // Service to fetch user data from API
    private activityService: ActivityService,  // Service to fetch activity data from API
    private route: ActivatedRoute,            // Gives us access to URL parameters (like /user/123)
    private cdr: ChangeDetectorRef            // Lets us manually tell Angular "hey, I changed data, update the view"
  ) {
    // ✅ Constructor: ONLY dependency injection — Angular gives us our services here
    // ❌ Do NOT fetch data here — @Input() values aren't available yet,
    //    and it makes the component harder to test
  }

  ngOnInit(): void {
    // ✅ This is where we set up our data fetching pipeline.
    // We watch the URL for changes to the userId parameter.

    this.route.params.pipe(
      // Extract just the userId from the route params object
      // e.g., { userId: '123' } → '123'
      map(params => params['userId']),

      // Only proceed if the userId actually changed
      // (prevents duplicate fetches if other params change)
      distinctUntilChanged(),

      // Before fetching, reset the UI to loading state
      tap(() => {
        this.loading = true;   // Show the loading spinner
        this.error = null;     // Clear any previous error
      }),

      // switchMap cancels the previous HTTP request if a new userId arrives
      // before the old request finishes. This prevents race conditions.
      // forkJoin runs both requests in parallel and waits for both to complete.
      switchMap(userId => forkJoin({
        user: this.userService.getUser(userId),
        activities: this.activityService.getActivities(userId)
      }).pipe(
        // If either request fails, catch the error and show it to the user
        catchError(err => {
          this.error = `Failed to load user: ${err.message}`;
          // Because we use OnPush, Angular won't notice this change automatically.
          // markForCheck tells Angular: "I changed something, please update the view."
          this.cdr.markForCheck();
          return EMPTY; // Return an empty observable so the pipeline doesn't break
        })
      )),

      // takeUntil is the "kill switch" — when destroy$ emits (in ngOnDestroy),
      // this entire pipeline unsubscribes automatically. No memory leaks!
      takeUntil(this.destroy$)
    ).subscribe(({ user, activities }) => {
      // Both requests succeeded — update the component state
      this.user = user;
      this.activities = activities;
      this.loading = false;
      // Tell Angular to update the view with the new data
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    // Emit on the kill switch — this triggers takeUntil to unsubscribe everything
    this.destroy$.next();
    // Complete the Subject itself so it can be garbage collected
    this.destroy$.complete();
  }
}
```

💡 **Why This Matters:** Interviewers love this pattern because it shows you understand: (1) where to put initialization logic, (2) how to handle loading/error states, (3) how to prevent race conditions with `switchMap`, (4) how to clean up subscriptions, and (5) how to work with OnPush change detection. This is a "senior engineer" answer.

⚠️ **Common Mistake:** Forgetting to handle the error case in `forkJoin`. If one of the inner observables errors and you don't have `catchError`, the entire pipeline dies silently. Always add `catchError` inside the `switchMap` to handle partial failures gracefully.

### 2.3 Subscription Setup

🔑 **Simple Explanation:**
Think of subscription setup like setting up multiple radio receivers in a control room. Each receiver listens to a different channel (data source). One listens to the initial data load, another to real-time WebSocket updates, and a third to browser events. They all run independently, but when the control room shuts down (component destroyed), ALL receivers must be turned off at once.

```typescript
@Component({
  selector: 'app-notification-center',
  template: `
    <!-- Badge showing unread count, with a CSS class when there are unread items -->
    <div class="notification-badge" [class.has-unread]="unreadCount > 0">
      {{ unreadCount }}
    </div>
    <div class="notification-list">
      <!-- Render each notification, using trackBy for performance -->
      <app-notification-item
        *ngFor="let n of notifications; trackBy: trackById"
        [notification]="n"
        (dismiss)="onDismiss($event)" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];  // All notifications
  unreadCount = 0;                     // How many are unread

  private destroy$ = new Subject<void>(); // Kill switch for subscriptions

  constructor(
    private notificationService: NotificationService,  // REST API service
    private webSocketService: WebSocketService,         // Real-time updates
    private cdr: ChangeDetectorRef                     // Manual change detection trigger
  ) {}

  ngOnInit(): void {
    // ✅ Pattern: Setting up multiple subscriptions in ngOnInit
    // Each one watches a different data source, but all are cleaned up together.

    // 1. Initial load — fetch all existing notifications from the server
    this.notificationService.getAll().pipe(
      takeUntil(this.destroy$) // Auto-unsubscribe when component is destroyed
    ).subscribe(notifications => {
      this.notifications = notifications;  // Store the notifications
      this.updateUnreadCount();            // Recalculate the badge number
      this.cdr.markForCheck();             // Tell Angular to update the view
    });

    // 2. Real-time updates — listen for new notifications via WebSocket
    //    This stays open and pushes new notifications as they arrive
    this.webSocketService.on<Notification>('notification:new').pipe(
      takeUntil(this.destroy$)
    ).subscribe(notification => {
      // Add the new notification to the FRONT of the list (newest first)
      this.notifications = [notification, ...this.notifications];
      this.updateUnreadCount();
      this.cdr.markForCheck();
    });

    // 3. Window visibility change — when the user switches back to this tab,
    //    refresh the notifications (they might have been read on another device)
    fromEvent(document, 'visibilitychange').pipe(
      // Only proceed when the tab becomes visible (not when it's hidden)
      filter(() => document.visibilityState === 'visible'),
      // Wait 1 second after tab focus to avoid hammering the server
      debounceTime(1000),
      // Fetch fresh data, canceling any in-flight request
      switchMap(() => this.notificationService.getAll()),
      takeUntil(this.destroy$)
    ).subscribe(notifications => {
      this.notifications = notifications;
      this.updateUnreadCount();
      this.cdr.markForCheck();
    });
  }

  // Helper to count unread notifications
  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  // trackBy function for *ngFor — tells Angular how to identify each item
  // so it can reuse DOM elements instead of recreating them
  trackById = (_: number, item: Notification) => item.id;

  ngOnDestroy(): void {
    this.destroy$.next();     // Trigger the kill switch
    this.destroy$.complete(); // Clean up the Subject itself
  }
}
```

⚠️ **Common Mistake:** Setting up multiple subscriptions without a consistent cleanup strategy. If you use `takeUntil` for some subscriptions but forget it on others, those forgotten ones become memory leaks. Always audit every `.subscribe()` call in your component — each one needs a cleanup mechanism (takeUntil, async pipe, or takeUntilDestroyed).

💡 **Why This Matters:** Interviewers look for how you manage multiple concurrent data sources. A junior developer creates separate subscriptions with no cleanup plan. A senior developer uses a consistent pattern (takeUntil or takeUntilDestroyed) across ALL subscriptions and understands when to use `switchMap` (cancel previous) vs `mergeMap` (run in parallel) vs `concatMap` (queue sequentially).

### 2.4 Constructor vs ngOnInit — The Real Difference

🔑 **Simple Explanation:**
Think of it like moving into a new apartment:
- **Constructor** = You sign the lease and get the keys (dependency injection). But the apartment is empty — no furniture (inputs) has been delivered yet.
- **ngOnChanges** = The moving truck arrives with your furniture (input values).
- **ngOnInit** = You're unpacked and ready to live there. You can set up your internet (fetch data), arrange furniture (use inputs), and start your daily routine (subscriptions).

The key rule: **Constructor is for getting your tools (services). ngOnInit is for using them.**

```
┌──────────────────────────────────────────────────────────────────┐
│              CONSTRUCTOR vs ngOnInit TIMELINE                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  constructor()          ngOnChanges()         ngOnInit()          │
│       │                      │                     │             │
│       ▼                      ▼                     ▼             │
│  ┌─────────┐          ┌───────────┐         ┌───────────┐       │
│  │ DI only │          │ @Input()  │         │ Full init │       │
│  │ No data │──────────│ values    │─────────│ Data fetch│       │
│  │ No DOM  │          │ arrive    │         │ Subscribe │       │
│  └─────────┘          └───────────┘         └───────────┘       │
│                                                                  │
│  @Input() = undefined   @Input() = value     @Input() = value   │
│  @ViewChild = undefined @ViewChild = undef   @ViewChild = undef │
│  Services = ✅          Services = ✅         Services = ✅       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

| Aspect                  | Constructor                          | ngOnInit                              |
|-------------------------|--------------------------------------|---------------------------------------|
| **Purpose**             | DI resolution, simple assignments    | Component initialization logic        |
| **@Input() available?** | ❌ No — always `undefined`           | ✅ Yes — bound values resolved        |
| **Called by**           | JavaScript engine (class instantiation) | Angular framework                  |
| **Testability**         | Hard to mock inputs                  | Easy — set inputs before calling      |
| **Inheritance**         | Must call `super()`                  | Automatically called by Angular       |
| **Frequency**           | Once per instantiation               | Once per component lifecycle          |

```typescript
// ❌ ANTI-PATTERN: Logic in constructor
@Component({ selector: 'app-bad' })
export class BadComponent {
  data: any;

  constructor(private service: DataService) {
    // ❌ @Input() not available yet — if this component needs an input
    //    to fetch data, it will be undefined here
    // ❌ Hard to test — this code runs the moment the class is created,
    //    before you can set up test conditions
    this.service.getData().subscribe(d => this.data = d);
  }
}

// ✅ CORRECT: Constructor for DI, ngOnInit for logic
@Component({ selector: 'app-good' })
export class GoodComponent implements OnInit {
  @Input() userId!: string; // This will be set by the parent component
  data: any;

  constructor(private service: DataService) {
    // ✅ Only DI — just store the service reference, nothing else
  }

  ngOnInit(): void {
    // ✅ @Input() is available now — userId has a value
    // ✅ Easy to test — in a test, you can set userId before calling ngOnInit
    this.service.getData(this.userId).subscribe(d => this.data = d);
  }
}
```

### 2.5 Common Mistakes: ViewChild Access in ngOnInit

```typescript
@Component({
  selector: 'app-chart',
  template: `<canvas #chartCanvas></canvas>` // #chartCanvas is a "template reference variable"
})
export class ChartComponent implements OnInit, AfterViewInit {
  // @ViewChild finds the canvas element in the template and gives us a reference to it.
  // The "!" means "I promise this will be set before I use it" (TypeScript non-null assertion).
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor() {}

  ngOnInit(): void {
    // ❌ CRASH: canvasRef is undefined here!
    // console.log(this.canvasRef.nativeElement); // TypeError: Cannot read property 'nativeElement' of undefined
    //
    // WHY? Because the view (the HTML template) hasn't been created yet.
    // ngOnInit runs BEFORE the template is rendered to the DOM.
    // @ViewChild references are only available AFTER the view is initialized.
  }

  ngAfterViewInit(): void {
    // ✅ CORRECT: canvasRef is available here because the view has been created
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    // Now we can safely initialize a chart library with the canvas context
  }
}
```

⚠️ **Common Mistake:** This is one of the most frequent Angular bugs. Remember the lifecycle order: `ngOnInit` → `ngAfterContentInit` → `ngAfterViewInit`. `@ViewChild` queries are resolved between `ngAfterContentChecked` and `ngAfterViewInit`. If you need a DOM element, always use `ngAfterViewInit`.

💡 **Why This Matters:** Interviewers ask "constructor vs ngOnInit" to test if you understand Angular's initialization sequence. The best answer explains that the constructor is a JavaScript/TypeScript feature for DI, while ngOnInit is an Angular feature that runs after inputs are bound. Mention testability as a bonus — it shows you think about code quality.

📝 **Quick Summary:**
- Use `ngOnInit` for data fetching, subscription setup, and any logic that needs `@Input()` values
- Never put business logic in the constructor — it's only for dependency injection
- `@ViewChild` is NOT available in `ngOnInit` — use `ngAfterViewInit` for DOM access

---

## 3. ngOnDestroy — Memory Leak Prevention

🔑 **Simple Explanation:**
Imagine you're renting a hotel room. When you check out (component destroyed), you need to:
- Turn off the TV (cancel subscriptions)
- Turn off the faucet (clear timers/intervals)
- Return the room key (remove event listeners)
- Hang up the phone (close WebSocket connections)

If you don't do these things, the hotel (your app) keeps paying for electricity, water, and phone lines for a room nobody is using. Over time, this adds up and the hotel runs out of resources. That's exactly what memory leaks do to your Angular app.


### 3.1 The takeUntil Pattern

🔑 **Simple Explanation:**
`takeUntil` is like a "dead man's switch." You create a special signal (`destroy$`). Every subscription listens for that signal. When the component is destroyed, you fire the signal, and ALL subscriptions stop at once. It's the most common pattern for bulk cleanup in Angular.

The classic RxJS pattern for bulk unsubscription:

```typescript
@Component({
  selector: 'app-live-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiveDashboardComponent implements OnInit, OnDestroy {
  // ✅ Convention: always name it destroy$ and place at top of the class.
  // The $ suffix means "this is an Observable/Subject" — a common RxJS naming convention.
  // Subject<void> means it doesn't carry any data — it's just a signal.
  private destroy$ = new Subject<void>();

  metrics$!: Observable<DashboardMetrics>;
  alerts: Alert[] = [];

  constructor(
    private metricsService: MetricsService,  // Service that streams real-time metrics
    private alertService: AlertService,       // Service that pushes alerts
    private cdr: ChangeDetectorRef           // For manual change detection with OnPush
  ) {}

  ngOnInit(): void {
    // Every subscription uses takeUntil(this.destroy$) as the LAST operator.
    // This ensures that when destroy$ emits, the subscription is cancelled.

    this.metricsService.streamMetrics().pipe(
      takeUntil(this.destroy$) // ← "Stop listening when the component is destroyed"
    ).subscribe(/* ... */);

    this.alertService.onAlert().pipe(
      takeUntil(this.destroy$) // ← Same kill switch for this subscription too
    ).subscribe(alert => {
      // Create a NEW array (immutable pattern) so OnPush detects the change
      this.alerts = [...this.alerts, alert];
      this.cdr.markForCheck(); // Tell Angular to re-render
    });

    // ⚠️ IMPORTANT: takeUntil must be the LAST operator before subscribe.
    // If you put operators AFTER takeUntil, they might not get cleaned up properly.
    // ❌ BAD:  .pipe(takeUntil(this.destroy$), map(...))  ← map runs after takeUntil
    // ✅ GOOD: .pipe(map(...), takeUntil(this.destroy$))  ← takeUntil is last
  }

  ngOnDestroy(): void {
    this.destroy$.next();     // Fire the signal — all takeUntil operators react to this
    this.destroy$.complete(); // Complete the Subject so it can be garbage collected
  }
}
```

### 3.2 DestroyRef & takeUntilDestroyed (Modern Angular)

🔑 **Simple Explanation:**
Angular 16+ said: "The takeUntil pattern is so common, let's build it into the framework." Now instead of creating a `Subject`, managing `ngOnDestroy`, and remembering to call `.next()` and `.complete()`, you just use `takeUntilDestroyed()` and Angular handles everything automatically. It's like upgrading from a manual car to an automatic.

Angular 16+ introduced `DestroyRef` and `takeUntilDestroyed` — eliminating boilerplate:

```typescript
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-modern-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModernDashboardComponent implements OnInit {
  // inject(DestroyRef) gives us a reference to the component's destruction lifecycle.
  // Angular will automatically trigger cleanup when this component is destroyed.
  private destroyRef = inject(DestroyRef);

  // ✅ No more Subject<void>, no more ngOnDestroy boilerplate!

  ngOnInit(): void {
    this.metricsService.streamMetrics().pipe(
      // Pass destroyRef so Angular knows which component's lifecycle to tie this to
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(/* ... */);
  }

  // ✅ Can also be used in constructor/field initializer context:
  // When used at the class field level (during construction), you don't need to pass
  // destroyRef — Angular figures it out from the "injection context" (the constructor).
  private data$ = inject(DataService).getData().pipe(
    takeUntilDestroyed() // No argument needed — Angular knows we're in a constructor context
  );

  constructor(
    private metricsService: MetricsService
  ) {
    // ✅ takeUntilDestroyed() also works without argument inside the constructor
    this.metricsService.streamMetrics().pipe(
      takeUntilDestroyed() // Angular automatically ties this to the component's lifecycle
    ).subscribe(/* ... */);
  }

  // ✅ You can also register arbitrary cleanup callbacks — like ngOnDestroy but injectable
  private cleanup = inject(DestroyRef).onDestroy(() => {
    // This function runs when the component is destroyed
    // Useful for non-RxJS cleanup (closing connections, saving state, etc.)
    console.log('Component destroyed');
  });
}
```

⚠️ **Common Mistake:** `takeUntilDestroyed()` without arguments ONLY works in an "injection context" — meaning inside a constructor or a field initializer. If you try to use it inside `ngOnInit` without passing `destroyRef`, you'll get a runtime error. Always pass `this.destroyRef` when using it outside the constructor.


### 3.3 Cleaning Up Timers, Intervals & Event Listeners

🔑 **Simple Explanation:**
JavaScript has several ways to schedule recurring or delayed work: `setInterval` (do something every X seconds), `setTimeout` (do something after X seconds), and `addEventListener` (do something when the user does something). None of these are managed by Angular — they're raw browser APIs. If you set them up and don't tear them down, they keep running forever, even after your component is gone. It's like setting an alarm clock in a hotel room and leaving without turning it off.

```typescript
@Component({
  selector: 'app-auto-save-editor',
  template: `<textarea (input)="onInput($event)">{{ content }}</textarea>`
})
export class AutoSaveEditorComponent implements OnInit, OnDestroy {
  content = '';

  // ✅ Track all cleanup targets explicitly — store references so we can cancel them later.
  // ReturnType<typeof setInterval> gives us the correct type for the interval ID.
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeHandler: (() => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private destroy$ = new Subject<void>(); // Kill switch for RxJS subscriptions

  constructor(
    private editorService: EditorService,
    private ngZone: NgZone,       // Lets us run code outside Angular's change detection
    private elementRef: ElementRef // Reference to this component's DOM element
  ) {}

  ngOnInit(): void {
    // 1. Interval — auto-save every 30 seconds
    // ✅ Run outside Angular zone to avoid unnecessary change detection cycles.
    // Without runOutsideAngular, every 30 seconds Angular would check the ENTIRE
    // component tree for changes, even though we only want to save data.
    this.ngZone.runOutsideAngular(() => {
      this.autoSaveInterval = setInterval(() => {
        // When we actually need to update the UI, we step BACK into Angular's zone
        this.ngZone.run(() => this.save());
      }, 30_000); // 30_000 milliseconds = 30 seconds
    });

    // 2. Native event listener — keyboard shortcuts (Ctrl+S to save)
    // We store the handler function so we can remove the EXACT same function later.
    // If you use an anonymous function, you can't remove it!
    this.keydownHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { // Ctrl+S or Cmd+S
        e.preventDefault(); // Prevent the browser's default "Save Page" dialog
        this.ngZone.run(() => this.save()); // Save inside Angular's zone
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    // 3. Window resize — using RxJS for cleaner cleanup (takeUntil handles it)
    fromEvent(window, 'resize').pipe(
      debounceTime(250), // Wait 250ms after the last resize event before reacting
      takeUntil(this.destroy$) // Auto-cleanup when component is destroyed
    ).subscribe(() => this.recalculateLayout());
  }

  onInput(event: Event): void {
    // Debounced content update — wait 300ms after the user stops typing
    // before updating the content. This prevents updating on every keystroke.
    if (this.debounceTimer) clearTimeout(this.debounceTimer); // Cancel previous timer
    this.debounceTimer = setTimeout(() => {
      this.content = (event.target as HTMLTextAreaElement).value;
    }, 300);
  }

  private save(): void {
    this.editorService.save(this.content);
  }

  private recalculateLayout(): void { /* ... */ }

  ngOnDestroy(): void {
    // ✅ Clean up EVERYTHING — this is the checklist:

    // 1. Clear the auto-save interval (stops the recurring 30-second save)
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null; // Set to null so we know it's been cleaned up
    }

    // 2. Clear the debounce timeout (cancels any pending content update)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // 3. Remove native event listeners (stops listening for Ctrl+S)
    // IMPORTANT: You must pass the EXACT same function reference you used in addEventListener
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    // 4. Complete RxJS subject (handles the fromEvent resize subscription)
    this.destroy$.next();
    this.destroy$.complete();

    // 5. Final save before destruction — save any unsaved work
    this.save();
  }
}
```

### 3.4 WebSocket & Third-Party Library Cleanup

🔑 **Simple Explanation:**
WebSockets are like phone calls — they stay connected until someone hangs up. Third-party libraries (like chart libraries, map libraries) create their own internal objects and DOM elements. If you don't explicitly tell them to shut down, they keep running in the background. This section shows how to properly "hang up the phone" and "shut down the machines."

```typescript
@Component({
  selector: 'app-trading-terminal',
  template: `
    <!-- Container for the third-party chart library to render into -->
    <div #chartContainer class="chart-container"></div>
    <div class="order-book">
      <!-- List of orders, using trackBy for efficient DOM updates -->
      <app-order-row *ngFor="let order of orders; trackBy: trackById"
                     [order]="order" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradingTerminalComponent implements OnInit, AfterViewInit, OnDestroy {
  // @ViewChild gives us a reference to the div where we'll render the chart
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  orders: Order[] = [];

  // Track all resources that need cleanup
  private ws: WebSocket | null = null;                    // WebSocket connection
  private chart: TradingViewChart | null = null;          // Third-party chart library instance
  private resizeObserver: ResizeObserver | null = null;   // Browser API for watching element size changes
  private destroy$ = new Subject<void>();                 // RxJS kill switch

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // WebSocket connection — run outside Angular's zone for performance.
    // WebSocket messages arrive very frequently (multiple times per second).
    // If we ran inside the zone, each message would trigger a full change detection cycle.
    this.ngZone.runOutsideAngular(() => {
      this.ws = new WebSocket('wss://api.exchange.com/stream');

      // Handle incoming messages
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Only step back into Angular's zone when we need to update the UI
        this.ngZone.run(() => {
          if (data.type === 'order_update') {
            this.orders = this.processOrders(data.orders);
            this.cdr.markForCheck(); // Tell Angular to re-render the order list
          }
          if (data.type === 'price_update') {
            // Chart updates don't need Angular — the chart library handles its own rendering
            this.chart?.updatePrice(data.price);
          }
        });
      };

      // Handle connection errors
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.ngZone.run(() => this.reconnect()); // Reconnect inside Angular's zone
      };
    });
  }

  ngAfterViewInit(): void {
    // Third-party chart library initialization — needs a real DOM element,
    // so we do this in ngAfterViewInit (not ngOnInit)
    this.chart = new TradingViewChart(
      this.chartContainer.nativeElement, // The actual <div> DOM element
      { theme: 'dark', interval: '1m' }  // Chart configuration
    );

    // ResizeObserver watches the chart container for size changes
    // (e.g., when the user resizes the browser window)
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        // Tell the chart to resize itself to match the container
        this.chart?.resize(
          entry.contentRect.width,
          entry.contentRect.height
        );
      }
    });
    // Start observing the chart container element
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  ngOnDestroy(): void {
    // ✅ 1. Close WebSocket connection
    if (this.ws) {
      this.ws.onmessage = null;  // Remove handlers FIRST to prevent callbacks during close
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN) {
        // Close with code 1000 (normal closure) and a reason message
        this.ws.close(1000, 'Component destroyed');
      }
      this.ws = null;
    }

    // ✅ 2. Destroy third-party chart library
    if (this.chart) {
      this.chart.destroy();  // Most libraries have a destroy/dispose method — always call it!
      this.chart = null;
    }

    // ✅ 3. Disconnect ResizeObserver (stops watching for size changes)
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // ✅ 4. Complete RxJS subjects
    this.destroy$.next();
    this.destroy$.complete();
  }

  private processOrders(raw: any[]): Order[] { /* ... */ return []; }
  private reconnect(): void { /* exponential backoff logic */ }
  trackById = (_: number, order: Order) => order.id;
}
```


### 3.5 The Real Cost of Forgetting Cleanup

🔑 **Simple Explanation:**
Imagine every time a user navigates to a page in your app, a new water faucet turns on. If you never turn faucets off when the user leaves, after 50 page navigations you have 50 faucets running. Your water bill (memory usage) keeps climbing until the system crashes. This diagram shows exactly that — the difference between a "leaky" app and a properly cleaned-up one.

```
┌─────────────────────────────────────────────────────────────────┐
│              MEMORY LEAK ACCUMULATION OVER TIME                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Memory                                                          │
│  Usage    ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱   │
│  (MB)   ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  │
│  500 ─ ─╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  │
│        ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  │
│  400 ─╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  │
│       ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  │
│  300 ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  │
│      ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  │
│  200 ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  │
│      ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  │
│  100 ──────────────────────────────────────────────── (healthy)  │
│      ──────────────────────                                      │
│      Nav1   Nav2   Nav3   Nav4   Nav5   Nav6   Nav7   Nav8      │
│                                                                  │
│  ╱╱╱ = Leaked subscriptions accumulating per route navigation    │
│  ─── = Properly cleaned up component                             │
└─────────────────────────────────────────────────────────────────┘
```

**What leaks and what doesn't — a complete reference:**

| Source                          | Auto-cleanup? | Manual cleanup needed? |
|---------------------------------|:-------------:|:----------------------:|
| `HttpClient` (finite)           | ✅ Yes        | ❌ No (completes after response) |
| `ActivatedRoute.params`         | ✅ Yes        | ❌ No (Angular manages it) |
| `Router.events`                 | ❌ No         | ✅ Yes                 |
| `FormControl.valueChanges`      | ❌ No         | ✅ Yes                 |
| `interval()` / `timer()`        | ❌ No         | ✅ Yes                 |
| `fromEvent()`                   | ❌ No         | ✅ Yes                 |
| `Subject` / `BehaviorSubject`   | ❌ No         | ✅ Yes                 |
| `WebSocket`                     | ❌ No         | ✅ Yes                 |
| `setInterval()` / `setTimeout()`| ❌ No         | ✅ Yes                 |
| `addEventListener()`            | ❌ No         | ✅ Yes                 |
| `ResizeObserver`                | ❌ No         | ✅ Yes                 |
| `MutationObserver`              | ❌ No         | ✅ Yes                 |
| `async` pipe subscriptions      | ✅ Yes        | ❌ No (pipe manages it) |

⚠️ **Common Mistake:** Many developers think `HttpClient` subscriptions need cleanup. They don't — HTTP requests complete naturally after the response arrives. But `Router.events` and `FormControl.valueChanges` are infinite streams that NEVER complete on their own. These are the sneaky ones that cause leaks.

💡 **Why This Matters:** Memory leak questions are a favorite in senior/architect interviews. Interviewers want to hear that you know: (1) which observables need cleanup and which don't, (2) the takeUntil pattern or takeUntilDestroyed, (3) that you clean up non-RxJS resources too (timers, event listeners, WebSockets). Bonus points for mentioning the modern `DestroyRef` approach.

📝 **Quick Summary:**
- Always clean up infinite observables (Router.events, WebSocket, interval, fromEvent, Subject)
- HttpClient and ActivatedRoute.params auto-complete — no cleanup needed
- Use `takeUntil(destroy$)` pattern or modern `takeUntilDestroyed()` for RxJS cleanup
- Don't forget non-RxJS cleanup: timers, event listeners, ResizeObserver, third-party libraries

---

## 4. ngOnChanges — Reacting to Input Mutations

🔑 **Simple Explanation:**
`ngOnChanges` is like a mail notification system. Every time a parent component sends new data to your component via `@Input()`, Angular calls `ngOnChanges` and hands you a package (the `SimpleChanges` object) that tells you: "Here's what changed, here's the old value, here's the new value, and whether this is the first delivery."

Think of it like getting a delivery notification: "Package for 'userName' — previous: 'Alice', current: 'Bob', first delivery: no."

This hook is essential when your component needs to DO something in response to input changes — like re-fetching data, recalculating derived values, or reinitializing a third-party library.

### 4.1 SimpleChanges Object Deep Dive

```typescript
// SimpleChange is the structure for ONE changed input.
// Angular creates one of these for each @Input() that changed.
interface SimpleChange {
  previousValue: any;       // What the input was BEFORE this change
  currentValue: any;        // What the input is NOW
  firstChange: boolean;     // true if this is the very first time the input was set
  isFirstChange(): boolean; // Method version of firstChange (same result)
}

// SimpleChanges is a dictionary (object) where:
// - The KEY is the name of the @Input() property (as a string)
// - The VALUE is a SimpleChange object with the old/new values
type SimpleChanges = {
  [propName: string]: SimpleChange;
};

// Example: If your component has @Input() name and @Input() age,
// and both change at the same time, you'd get:
// {
//   name: { previousValue: 'Alice', currentValue: 'Bob', firstChange: false },
//   age: { previousValue: 25, currentValue: 26, firstChange: false }
// }
```

