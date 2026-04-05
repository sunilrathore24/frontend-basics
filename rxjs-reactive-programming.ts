/**
 * ============================================================================
 * RXJS REACTIVE PROGRAMMING - TypeScript Interview Guide
 * ============================================================================
 * 
 * This file contains comprehensive examples of RxJS patterns, operators,
 * and reactive programming concepts for Angular/React applications.
 * 
 * Topics Covered:
 * 1. Observable Fundamentals (Hot vs Cold)
 * 2. Core Operators (switchMap, mergeMap, concatMap, exhaustMap)
 * 3. Combination Operators (combineLatest, forkJoin, zip, merge)
 * 4. Error Handling (catchError, retry, retryWhen)
 * 5. Subjects (BehaviorSubject, ReplaySubject, AsyncSubject)
 * 6. Memory Management (Unsubscription strategies)
 * 7. Real Interview Questions
 * 8. Performance Optimization
 * 
 * Companies: Google, Microsoft, Amazon, Meta, Netflix, Atlassian
 * ============================================================================
 */

import { 
  Observable, Subject, BehaviorSubject, ReplaySubject, AsyncSubject,
  of, from, interval, fromEvent, timer, defer,
  map, filter, tap, debounceTime, distinctUntilChanged,
  switchMap, mergeMap, concatMap, exhaustMap,
  combineLatest, forkJoin, zip, merge, concat,
  catchError, retry, retryWhen, delay, take, takeUntil,
  share, shareReplay, first
} from 'rxjs';

// ============================================================================
// SECTION 1: OBSERVABLE FUNDAMENTALS
// ============================================================================

/**
 * COLD Observable - Creates new execution for each subscriber
 * 
 * CHARACTERISTICS:
 * - Each subscriber gets its own independent execution
 * - Data producer is created inside the Observable
 * - Like a movie on Netflix: Each viewer starts from beginning
 * - Unicast: One producer per subscriber
 * 
 * WHEN TO USE: HTTP requests, file reads, computed values
 */
function demonstrateColdObservable(): void {
  const cold$ = new Observable<number>(subscriber => {
    console.log('Cold: Creating new execution');
    // This code runs SEPARATELY for each subscriber
    // Each subscriber gets a different random number
    const value = Math.random();
    subscriber.next(value);
    subscriber.complete();
  });

  // First subscriber
  cold$.subscribe(val => console.log('Subscriber 1:', val));
  // Output: Cold: Creating new execution
  //         Subscriber 1: 0.123

  // Second subscriber (separate execution!)
  cold$.subscribe(val => console.log('Subscriber 2:', val));
  // Output: Cold: Creating new execution
  //         Subscriber 2: 0.456

  // Different values - separate executions
}

/**
 * HOT Observable - Shares single execution among subscribers
 * 
 * CHARACTERISTICS:
 * - All subscribers share the same execution
 * - Data producer exists outside the Observable
 * - Like live TV broadcast: All viewers see same thing
 * - Multicast: One producer for all subscribers
 * 
 * WHEN TO USE: DOM events, WebSocket connections, shared state
 */
function demonstrateHotObservable(): void {
  const hot$ = new Subject<number>();

  // Both subscribers share same execution
  hot$.subscribe(val => console.log('Subscriber 1:', val));
  hot$.subscribe(val => console.log('Subscriber 2:', val));

  hot$.next(Math.random());
  // Output: Subscriber 1: 0.789
  //         Subscriber 2: 0.789
  // Same value - shared execution
}

/**
 * Making Cold Observable Hot
 * 
 * Use share() or shareReplay() to convert cold to hot
 */
function makeColdObservableHot(): void {
  // Cold by default
  const cold$ = interval(1000);

  // Make it hot with share()
  const hot$ = cold$.pipe(share());

  // Make it hot with replay (caches last N values)
  const hotWithReplay$ = cold$.pipe(shareReplay(1));

  // Subscribers share the same execution
  hot$.subscribe(val => console.log('Sub 1:', val));
  setTimeout(() => {
    hot$.subscribe(val => console.log('Sub 2:', val));
  }, 2500);
}

/**
 * Creation Operators - Different ways to create Observables
 */
function demonstrateCreationOperators(): void {
  // of - Emit values in sequence, then complete
  of(1, 2, 3).subscribe(console.log); // 1, 2, 3

  // from - Convert array/promise/iterable to Observable
  from([1, 2, 3]).subscribe(console.log);
  from(fetch('/api/data')).subscribe(console.log);

  // interval - Emit sequential numbers at interval
  interval(1000).subscribe(console.log); // 0, 1, 2, 3...

  // fromEvent - Convert DOM events to Observable
  const clicks$ = fromEvent(document, 'click');
  clicks$.subscribe(event => console.log('Clicked!', event));

  // timer - Emit after delay, then at intervals
  timer(2000, 1000).subscribe(console.log); // Wait 2s, then emit every 1s

  // defer - Create Observable lazily (on subscription)
  const deferred$ = defer(() => of(Math.random()));
  deferred$.subscribe(console.log); // New random each subscription
}

// ============================================================================
// SECTION 2: CORE OPERATORS DEEP DIVE
// ============================================================================

/**
 * switchMap - Cancel previous, switch to new Observable
 * 
 * BEHAVIOR:
 * - Subscribes to inner Observable
 * - When new value arrives, UNSUBSCRIBES from previous
 * - Subscribes to new inner Observable
 * - Only LATEST inner Observable's values are emitted
 * 
 * WHY "SWITCH": Like switching TV channels
 * You can only watch one at a time
 * 
 * USE WHEN: Cancel previous operations (search autocomplete)
 * 
 * MEMORY SAFETY: Auto-unsubscribes from old Observables
 */
function demonstrateSwitchMap(): void {
  const searchBox = document.getElementById('search') as HTMLInputElement;
  
  if (searchBox) {
    const search$ = fromEvent(searchBox, 'input').pipe(
      // STEP 1: Wait 300ms after user stops typing
      // Prevents API call on every keystroke
      debounceTime(300),
      
      // STEP 2: Extract input value
      map((event: Event) => (event.target as HTMLInputElement).value),
      
      // STEP 3: Only search if query >= 3 characters
      filter(query => query.length > 2),
      
      // STEP 4: switchMap - THE KEY OPERATOR
      // For each query, make HTTP request
      // If new query arrives, CANCEL previous request
      switchMap(query => 
        fetch(`/api/search?q=${query}`).then(r => r.json())
      )
    );

    search$.subscribe(results => console.log('Results:', results));
  }
  
  // EXECUTION FLOW:
  // Time 0ms:   User types "h"
  // Time 50ms:  User types "e" → "he"
  // Time 100ms: User types "l" → "hel"
  // Time 150ms: User types "l" → "hell"
  // Time 200ms: User types "o" → "hello"
  // Time 500ms: debounceTime triggers (300ms after last keystroke)
  //             filter passes (length > 2)
  //             switchMap starts request for "hello"
  // Time 700ms: Response arrives, displayed
  //
  // WITHOUT switchMap: Multiple requests in-flight
  // WITH switchMap: Only latest request matters
}

/**
 * mergeMap - Run all Observables concurrently
 * 
 * BEHAVIOR:
 * - Subscribes to ALL inner Observables simultaneously
 * - Does NOT cancel any Observables
 * - Emits values from ALL as they arrive
 * - Completes when source AND all inner Observables complete
 * 
 * WHY "MERGE": Merges multiple streams into one
 * Like merging highway lanes - all cars flow through
 * 
 * USE WHEN: All operations must complete (file uploads)
 * 
 * CONCURRENCY CONTROL: Can limit with second parameter
 * Example: mergeMap(fn, 3) = max 3 concurrent
 */
function demonstrateMergeMap(): void {
  // Process all items concurrently
  of(1, 2, 3).pipe(
    mergeMap(x => 
      of(x * 10).pipe(delay(1000))
    )
  ).subscribe(console.log);
  // After 1s: 10, 20, 30 (all at once)

  // Real-world: Upload multiple files
  const files$ = of(new File([], 'file1'), new File([], 'file2'));
  files$.pipe(
    mergeMap(file => uploadFile(file), 3) // Max 3 concurrent uploads
  ).subscribe(
    result => console.log('Uploaded:', result),
    error => console.error('Upload failed:', error)
  );
}

/**
 * concatMap - Run Observables sequentially
 * 
 * BEHAVIOR:
 * - Subscribes to inner Observables ONE AT A TIME
 * - Waits for each to complete before starting next
 * - Maintains ORDER of operations
 * 
 * WHY "CONCAT": Concatenates (chains) Observables
 * Like a queue - first in, first out
 * 
 * USE WHEN: Order matters (sequential API calls)
 */
function demonstrateConcatMap(): void {
  of(1, 2, 3).pipe(
    concatMap(x => 
      of(x * 10).pipe(delay(1000))
    )
  ).subscribe(console.log);
  // After 1s: 10
  // After 2s: 20
  // After 3s: 30 (one at a time)

  // Real-world: Sequential database operations
  const operations$ = of(
    () => createUser({ name: 'Alice' }),
    () => createProfile({ userId: 1 }),
    () => sendWelcomeEmail('alice@example.com')
  );

  operations$.pipe(
    concatMap(operation => operation())
  ).subscribe(
    result => console.log('Step completed:', result),
    error => console.error('Operation failed:', error)
  );
}

/**
 * exhaustMap - Ignore new values while current Observable is active
 * 
 * BEHAVIOR:
 * - Subscribes to first inner Observable
 * - IGNORES new values until current completes
 * - Then accepts next value
 * 
 * WHY "EXHAUST": Exhausts (completes) current before accepting new
 * Like a busy phone line - can't take new calls
 * 
 * USE WHEN: Prevent duplicate operations (form submission)
 */
function demonstrateExhaustMap(): void {
  const submitButton = document.getElementById('submit') as HTMLButtonElement;
  
  if (submitButton) {
    const submit$ = fromEvent(submitButton, 'click').pipe(
      exhaustMap(() => 
        fetch('/api/submit', { method: 'POST' }).then(r => r.json())
      )
    );

    submit$.subscribe(
      response => console.log('Submitted:', response),
      error => console.error('Submission failed:', error)
    );
  }

  // Key point: Clicks during submission are IGNORED
  // User clicks 3 times rapidly → only first click triggers submission
}

/**
 * Operator Comparison Table
 * 
 * | Operator    | Behavior                      | Use Case                    | Cancels Previous |
 * |-------------|-------------------------------|-----------------------------|------------------|
 * | switchMap   | Cancel previous, switch to new| Search, autocomplete        | Yes              |
 * | mergeMap    | Run all concurrently          | Multiple uploads, parallel  | No               |
 * | concatMap   | Run sequentially in order     | Sequential operations       | No               |
 * | exhaustMap  | Ignore new until current done | Form submission, prevent dup| N/A              |
 */

// ============================================================================
// SECTION 3: COMBINATION OPERATORS
// ============================================================================

/**
 * combineLatest - Emit when any Observable emits
 * 
 * BEHAVIOR:
 * - Waits for ALL Observables to emit at least once
 * - Then emits whenever ANY Observable emits
 * - Emits array with LATEST value from each
 * 
 * USE CASE: Form validation (combine multiple form fields)
 */
function demonstrateCombineLatest(): void {
  const age$ = of(25, 26, 27);
  const name$ = of('Alice', 'Bob');

  combineLatest([age$, name$]).subscribe(console.log);
  // [27, 'Alice']
  // [27, 'Bob']

  // Real-world: Form validation
  const username$ = of('alice');
  const password$ = of('password123');
  const terms$ = of(true);

  combineLatest([username$, password$, terms$]).pipe(
    map(([username, password, terms]) => ({
      valid: username.length >= 3 && password.length >= 8 && terms,
      username,
      password,
      terms
    }))
  ).subscribe(formState => {
    console.log('Form valid:', formState.valid);
  });
}

/**
 * forkJoin - Wait for all Observables to complete
 * 
 * BEHAVIOR:
 * - Like Promise.all for Observables
 * - Waits for ALL to complete
 * - Emits LAST value from each
 * - Completes immediately after
 * 
 * USE CASE: Multiple API calls that all must complete
 * 
 * IMPORTANT: Only emits when ALL complete
 * If any never completes, forkJoin never emits
 */
function demonstrateForkJoin(): void {
  forkJoin({
    user: fetch('/api/user').then(r => r.json()),
    posts: fetch('/api/posts').then(r => r.json()),
    comments: fetch('/api/comments').then(r => r.json())
  }).subscribe(({ user, posts, comments }) => {
    console.log('All loaded:', { user, posts, comments });
  });
}

/**
 * zip - Combine values by index
 * 
 * BEHAVIOR:
 * - Pairs values by their emission index
 * - First from each, second from each, etc.
 * - Completes when ANY Observable completes
 * 
 * USE CASE: Pair requests with responses
 */
function demonstrateZip(): void {
  const letters$ = of('A', 'B', 'C');
  const numbers$ = of(1, 2, 3);

  zip(letters$, numbers$).subscribe(console.log);
  // ['A', 1]
  // ['B', 2]
  // ['C', 3]
}

/**
 * merge - Emit from all Observables as they emit
 * 
 * BEHAVIOR:
 * - Subscribes to ALL Observables
 * - Emits values as they arrive (interleaved)
 * - Completes when ALL complete
 * 
 * USE CASE: Multiple event sources
 */
function demonstrateMerge(): void {
  const fast$ = interval(1000).pipe(map(x => `Fast: ${x}`));
  const slow$ = interval(2000).pipe(map(x => `Slow: ${x}`));

  merge(fast$, slow$).subscribe(console.log);
  // Fast: 0
  // Slow: 0
  // Fast: 1
  // Fast: 2
  // Slow: 1
  // ...
}

// ============================================================================
// SECTION 4: ERROR HANDLING
// ============================================================================

/**
 * catchError - Handle errors and continue
 * 
 * BEHAVIOR:
 * - Catches errors from source Observable
 * - Returns new Observable (fallback or re-throw)
 * - Allows stream to continue
 * 
 * USE CASE: Provide fallback values, retry logic
 */
function demonstrateCatchError(): void {
  // Basic error handling with fallback
  fetch('/api/data').pipe(
    catchError(error => {
      console.error('Error occurred:', error);
      return of({ default: 'data' }); // Return fallback
    })
  ).subscribe(data => console.log(data));

  // Return different Observable on error
  fetch('/api/primary').pipe(
    catchError(() => fetch('/api/fallback'))
  ).subscribe(data => console.log(data));
}

/**
 * retry - Retry on error
 * 
 * BEHAVIOR:
 * - Resubscribes to source on error
 * - Retries specified number of times
 * - Throws error if all retries fail
 * 
 * USE CASE: Transient network errors
 */
function demonstrateRetry(): void {
  // Simple retry - retry 3 times
  fetch('/api/unstable').pipe(
    retry(3)
  ).subscribe({
    next: data => console.log(data),
    error: err => console.error('Failed after 3 retries:', err)
  });
}

/**
 * retryWhen - Retry with custom logic
 * 
 * BEHAVIOR:
 * - Provides stream of errors
 * - You control when to retry
 * - Can add delays, conditions, etc.
 * 
 * USE CASE: Exponential backoff retry
 */
function demonstrateRetryWhen(): void {
  fetch('/api/unstable').pipe(
    retryWhen(errors => 
      errors.pipe(
        delay(1000),
        take(3)
      )
    )
  ).subscribe({
    next: data => console.log(data),
    error: err => console.error('Failed after retries:', err)
  });
}

// ============================================================================
// SECTION 5: SUBJECTS
// ============================================================================

/**
 * Subject - Basic multicast
 * 
 * CHARACTERISTICS:
 * - Both Observable and Observer
 * - Multicasts to multiple subscribers
 * - No initial value
 * - No replay
 * 
 * USE CASE: Event bus, multicasting
 */
function demonstrateSubject(): void {
  const subject = new Subject<number>();

  // Multiple subscribers
  subject.subscribe(val => console.log('Observer 1:', val));
  subject.subscribe(val => console.log('Observer 2:', val));

  subject.next(1); // Both receive 1
  subject.next(2); // Both receive 2
}

/**
 * BehaviorSubject - Stores current value
 * 
 * CHARACTERISTICS:
 * - Requires initial value
 * - New subscribers immediately receive current value
 * - Can get current value synchronously with .value
 * 
 * USE CASE: State management, current form values
 */
class UserStore {
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();
  
  setUser(user: any): void {
    this.userSubject.next(user);
  }
  
  getUser(): any {
    return this.userSubject.value;
  }
}

/**
 * ReplaySubject - Replay last N values
 * 
 * CHARACTERISTICS:
 * - Buffers specified number of values
 * - New subscribers receive buffered values
 * - Optional time window
 * 
 * USE CASE: Recent history, caching
 */
function demonstrateReplaySubject(): void {
  // Replay last 3 values
  const replay$ = new ReplaySubject<number>(3);

  replay$.next(1);
  replay$.next(2);
  replay$.next(3);
  replay$.next(4);

  // New subscriber receives last 3 values
  replay$.subscribe(val => console.log('Received:', val));
  // Received: 2
  // Received: 3
  // Received: 4
}

/**
 * AsyncSubject - Emits only last value on complete
 * 
 * CHARACTERISTICS:
 * - Buffers all values
 * - Emits ONLY last value when complete
 * - Like a Promise (single value)
 * 
 * USE CASE: Single async result
 */
function demonstrateAsyncSubject(): void {
  const async$ = new AsyncSubject<number>();

  async$.subscribe(val => console.log('Received:', val));

  async$.next(1);
  async$.next(2);
  async$.next(3);
  async$.complete();
  // Received: 3 (only last value)
}

// ============================================================================
// SECTION 6: MEMORY MANAGEMENT
// ============================================================================

/**
 * Unsubscription Strategy 1: Manual unsubscribe
 */
function manualUnsubscribe(): void {
  const subscription = interval(1000).subscribe(console.log);
  setTimeout(() => subscription.unsubscribe(), 5000);
}

/**
 * Unsubscription Strategy 2: takeUntil pattern (RECOMMENDED)
 * 
 * BENEFITS:
 * - Declarative
 * - Handles multiple subscriptions
 * - Clean and readable
 */
class Component {
  private destroy$ = new Subject<void>();
  
  ngOnInit(): void {
    // All subscriptions automatically unsubscribe on destroy
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(console.log);
    
    fromEvent(document, 'click').pipe(
      takeUntil(this.destroy$)
    ).subscribe(console.log);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

/**
 * Unsubscription Strategy 3: take(n) - Auto-complete
 */
function autoComplete(): void {
  interval(1000).pipe(
    take(5)
  ).subscribe(console.log); // Auto-unsubscribes after 5 emissions
}

/**
 * Unsubscription Strategy 4: first() - Complete after first
 */
function firstOnly(): void {
  fromEvent(document, 'click').pipe(
    first()
  ).subscribe(() => console.log('First click'));
}

// ============================================================================
// SECTION 7: REAL INTERVIEW QUESTIONS
// ============================================================================

/**
 * INTERVIEW QUESTION 1: Implement Autocomplete with Debouncing
 * 
 * Difficulty: Mid
 * Companies: Google, Microsoft, Atlassian
 * 
 * Requirements:
 * - Debounce user input (300ms)
 * - Only search if length >= 3
 * - Cancel previous requests
 * - Handle errors gracefully
 */
function createAutocomplete(inputElement: HTMLInputElement, apiUrl: string): Observable<any> {
  return fromEvent(inputElement, 'input').pipe(
    // Get input value
    map((event: Event) => (event.target as HTMLInputElement).value),
    
    // Wait 300ms after user stops typing
    debounceTime(300),
    
    // Only emit if value changed
    distinctUntilChanged(),
    
    // Only search if length >= 3
    filter(query => query.length >= 3),
    
    // Cancel previous request, make new one
    switchMap(query => 
      fetch(`${apiUrl}?q=${query}`)
        .then(r => r.json())
        .catch(error => {
          console.error('Search failed:', error);
          return [];
        })
    )
  );
}

/**
 * INTERVIEW QUESTION 2: State Management with BehaviorSubject
 * 
 * Difficulty: Mid
 * Companies: All major companies
 * 
 * Requirements:
 * - Store todos in BehaviorSubject
 * - Provide derived observables (completed, active)
 * - Methods to add, toggle, remove todos
 */
class TodoStore {
  private todosSubject = new BehaviorSubject<Todo[]>([]);
  
  public todos$ = this.todosSubject.asObservable();
  public completedTodos$ = this.todos$.pipe(
    map(todos => todos.filter(t => t.completed))
  );
  public activeTodos$ = this.todos$.pipe(
    map(todos => todos.filter(t => !t.completed))
  );
  
  addTodo(text: string): void {
    const currentTodos = this.todosSubject.value;
    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false
    };
    this.todosSubject.next([...currentTodos, newTodo]);
  }
  
  toggleTodo(id: number): void {
    const currentTodos = this.todosSubject.value;
    const updatedTodos = currentTodos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.todosSubject.next(updatedTodos);
  }
  
  removeTodo(id: number): void {
    const currentTodos = this.todosSubject.value;
    this.todosSubject.next(currentTodos.filter(t => t.id !== id));
  }
  
  getTodos(): Todo[] {
    return this.todosSubject.value;
  }
}

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// ============================================================================
// SECTION 8: PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * shareReplay - Cache and share results
 * 
 * BENEFITS:
 * - Single HTTP request for multiple subscribers
 * - Caches result
 * - Replays to late subscribers
 * 
 * USE CASE: Expensive operations, API calls
 */
function demonstrateShareReplay(): void {
  // Without shareReplay - multiple HTTP requests
  const data$ = fetch('/api/expensive').then(r => r.json());

  data$.then(console.log); // Request 1
  data$.then(console.log); // Request 2
  data$.then(console.log); // Request 3

  // With shareReplay - single HTTP request
  const cachedData$ = from(fetch('/api/expensive').then(r => r.json())).pipe(
    shareReplay(1) // Cache last 1 emission
  );

  cachedData$.subscribe(console.log); // Request 1
  cachedData$.subscribe(console.log); // Uses cache
  cachedData$.subscribe(console.log); // Uses cache
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function uploadFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`${file.name} uploaded`), 1000);
  });
}

async function createUser(data: any): Promise<any> {
  return { id: 1, ...data };
}

async function createProfile(data: any): Promise<any> {
  return { profileId: 1, ...data };
}

async function sendWelcomeEmail(email: string): Promise<void> {
  console.log(`Email sent to ${email}`);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Fundamentals
  demonstrateColdObservable,
  demonstrateHotObservable,
  makeColdObservableHot,
  demonstrateCreationOperators,
  
  // Operators
  demonstrateSwitchMap,
  demonstrateMergeMap,
  demonstrateConcatMap,
  demonstrateExhaustMap,
  
  // Combination
  demonstrateCombineLatest,
  demonstrateForkJoin,
  demonstrateZip,
  demonstrateMerge,
  
  // Error Handling
  demonstrateCatchError,
  demonstrateRetry,
  demonstrateRetryWhen,
  
  // Subjects
  demonstrateSubject,
  UserStore,
  demonstrateReplaySubject,
  demonstrateAsyncSubject,
  
  // Memory Management
  manualUnsubscribe,
  Component,
  autoComplete,
  firstOnly,
  
  // Interview Questions
  createAutocomplete,
  TodoStore,
  
  // Performance
  demonstrateShareReplay
};

/**
 * ============================================================================
 * QUICK REFERENCE GUIDE
 * ============================================================================
 * 
 * Flattening Operators:
 * - switchMap: Cancel previous (search, autocomplete)
 * - mergeMap:  Run all concurrently (uploads, parallel tasks)
 * - concatMap: Run sequentially (ordered operations)
 * - exhaustMap: Ignore new until done (form submit, prevent duplicates)
 * 
 * Combination Operators:
 * - combineLatest: Emit when any emits (form validation)
 * - forkJoin:      Wait for all to complete (parallel API calls)
 * - zip:           Combine by index (pair requests/responses)
 * - merge:         Emit from all as they emit (multiple event sources)
 * 
 * Subjects:
 * - Subject:        Basic multicast, no replay
 * - BehaviorSubject: Stores current value, replays last
 * - ReplaySubject:  Replays last N values
 * - AsyncSubject:   Emits only last value on complete
 * 
 * Memory Management:
 * - takeUntil(destroy$): Recommended pattern
 * - take(n):            Auto-complete after n emissions
 * - first():            Complete after first emission
 * - Subscription.unsubscribe(): Manual cleanup
 * 
 * Performance:
 * - share():       Share execution, no replay
 * - shareReplay(): Share execution, replay last N
 * - debounceTime(): Wait for pause
 * - throttleTime(): Limit frequency
 * 
 * ============================================================================
 */
