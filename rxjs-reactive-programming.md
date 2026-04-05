# RxJS Reactive Programming - JavaScript Interview Guide

## Table of Contents
1. [Observable Fundamentals](#observable-fundamentals)
2. [Core Operators Deep Dive](#core-operators-deep-dive)
3. [Combination Operators](#combination-operators)
4. [Error Handling](#error-handling)
5. [Subjects](#subjects)
6. [Memory Management](#memory-management)
7. [Real Interview Questions](#real-interview-questions)
8. [Performance Optimization](#performance-optimization)
9. [Quick Reference](#quick-reference)

---

## Observable Fundamentals

### What is an Observable?

An Observable is a lazy Push collection of multiple values. It's like a Promise that can emit multiple values over time.

```javascript
import { Observable } from 'rxjs';

// Creating a basic Observable
const observable = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});

// Subscribing to the Observable
const subscription = observable.subscribe({
  next: value => console.log('Received:', value),
  error: err => console.error('Error:', err),
  complete: () => console.log('Complete!')
});

// Output:
// Received: 1
// Received: 2
// Received: 3
// (after 1 second)
// Received: 4
// Complete!
```

### Hot vs Cold Observables

```javascript
import { Observable, Subject } from 'rxjs';

// COLD Observable - Creates new execution for each subscriber
const cold$ = new Observable(subscriber => {
  console.log('Cold: Creating new execution');
  const value = Math.random();
  subscriber.next(value);
});

cold$.subscribe(val => console.log('Subscriber 1:', val));
cold$.subscribe(val => console.log('Subscriber 2:', val));
// Output:
// Cold: Creating new execution
// Subscriber 1: 0.123
// Cold: Creating new execution
// Subscriber 2: 0.456
// Different values - separate executions

// HOT Observable - Shares single execution among subscribers
const hot$ = new Subject();

hot$.subscribe(val => console.log('Subscriber 1:', val));
hot$.subscribe(val => console.log('Subscriber 2:', val));

hot$.next(Math.random());
// Output:
// Subscriber 1: 0.789
// Subscriber 2: 0.789
// Same value - shared execution
```

### Making Cold Observable Hot

```javascript
import { interval, share, shareReplay } from 'rxjs';

// Cold by default
const cold$ = interval(1000);

// Make it hot with share()
const hot$ = cold$.pipe(share());

// Make it hot with replay
const hotWithReplay$ = cold$.pipe(shareReplay(1));

// Subscribers share the same execution
hot$.subscribe(val => console.log('Sub 1:', val));
setTimeout(() => {
  hot$.subscribe(val => console.log('Sub 2:', val));
}, 2500);
```

### Creation Operators

```javascript
import { of, from, interval, fromEvent, timer, defer } from 'rxjs';

// of - Emit values in sequence
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

// defer - Create Observable lazily
const deferred$ = defer(() => of(Math.random()));
deferred$.subscribe(console.log); // New random each subscription
```

### Subscription Lifecycle

```javascript
import { interval } from 'rxjs';

const observable$ = interval(1000);

// Subscribe
const subscription = observable$.subscribe({
  next: value => console.log(value),
  error: err => console.error(err),
  complete: () => console.log('Done')
});

// Unsubscribe after 5 seconds
setTimeout(() => {
  subscription.unsubscribe();
  console.log('Unsubscribed');
}, 5000);

// Multiple subscriptions can be grouped
const sub1 = observable$.subscribe(console.log);
const sub2 = observable$.subscribe(console.log);

const combined = sub1.add(sub2);
combined.unsubscribe(); // Unsubscribes both
```

---

## Core Operators Deep Dive

### map - Transform emitted values

```javascript
import { of, map } from 'rxjs';

// Basic transformation
of(1, 2, 3).pipe(
  map(x => x * 10)
).subscribe(console.log); // 10, 20, 30

// Real-world: Transform API response
fetch('/api/users').pipe(
  map(response => response.json()),
  map(users => users.map(u => ({ id: u.id, name: u.name })))
).subscribe(console.log);
```

### filter - Emit only values that pass condition

```javascript
import { of, filter } from 'rxjs';

of(1, 2, 3, 4, 5).pipe(
  filter(x => x % 2 === 0)
).subscribe(console.log); // 2, 4

// Real-world: Filter valid form inputs
inputChanges$.pipe(
  filter(value => value.length >= 3),
  filter(value => /^[a-zA-Z]+$/.test(value))
).subscribe(validInput => console.log(validInput));
```

### switchMap - Cancel previous, switch to new Observable

**Use when**: You want to cancel previous operations (e.g., search autocomplete)

**BEHAVIOR**: 
- Subscribes to inner Observable
- When new value arrives, UNSUBSCRIBES from previous inner Observable
- Subscribes to new inner Observable
- Only the LATEST inner Observable's values are emitted

**WHY IT'S CALLED "SWITCH"**: 
It "switches" from one Observable to another, like switching TV channels
You can only watch one channel at a time - switching cancels the previous

**MEMORY SAFETY**: Automatically unsubscribes from old Observables (prevents leaks)

```javascript
import { fromEvent, switchMap, debounceTime, map, filter } from 'rxjs';
import { ajax } from 'rxjs/ajax';

// Autocomplete search with automatic cancellation
const searchBox = document.getElementById('search');

const search$ = fromEvent(searchBox, 'input').pipe(
  // STEP 1: Wait 300ms after user stops typing (debounce)
  // Prevents making API call on every keystroke
  // User types "hello" → only triggers after they pause
  debounceTime(300),
  
  // STEP 2: Extract the input value from the event
  map(event => event.target.value),
  
  // STEP 3: Only search if query is at least 3 characters
  // Prevents searching for "h" or "he" (too many results)
  filter(query => query.length > 2),
  
  // STEP 4: switchMap - THE KEY OPERATOR
  // For each query, make an HTTP request
  // If new query arrives, CANCEL previous request automatically
  switchMap(query => 
    ajax.getJSON(`/api/search?q=${query}`)
  )
  // switchMap ensures only the LATEST search results are displayed
  // Old results are discarded even if they arrive late
);

search$.subscribe(results => displayResults(results));

// EXECUTION FLOW EXAMPLE:
// Time 0ms:   User types "h"
// Time 50ms:  User types "e" → "he"
// Time 100ms: User types "l" → "hel"
// Time 150ms: User types "l" → "hell"
// Time 200ms: User types "o" → "hello"
// Time 500ms: debounceTime triggers (300ms after last keystroke)
//             filter passes (length > 2)
//             switchMap starts request for "hello"
// Time 700ms: Response arrives, displayed to user
//
// WITHOUT switchMap: If user types fast, multiple requests would be in-flight
// WITH switchMap: Only the latest request matters, old ones are cancelled
```

### mergeMap - Run all Observables concurrently

**Use when**: You want all operations to complete (e.g., multiple file uploads)

**BEHAVIOR**:
- Subscribes to ALL inner Observables simultaneously
- Does NOT cancel any Observables
- Emits values from ALL inner Observables as they arrive
- Completes when source AND all inner Observables complete

**WHY IT'S CALLED "MERGE"**:
It "merges" multiple Observable streams into one output stream
Like merging multiple highway lanes into one - all cars (values) flow through

**CONCURRENCY CONTROL**: 
Can limit concurrent inner Observables with second parameter
Example: `mergeMap(fn, 3)` = max 3 concurrent operations

```javascript
import { of, mergeMap, delay } from 'rxjs';

// Process all items concurrently
of(1, 2, 3).pipe(
  mergeMap(x => 
    of(x * 10).pipe(delay(1000))
  )
).subscribe(console.log);
// After 1s: 10, 20, 30 (all at once)

// Real-world: Upload multiple files
const files$ = of(file1, file2, file3);
files$.pipe(
  mergeMap(file => uploadFile(file), 3) // Max 3 concurrent uploads
).subscribe(
  result => console.log('Uploaded:', result),
  error => console.error('Upload failed:', error)
);
```

### concatMap - Run Observables sequentially

**Use when**: Order matters (e.g., sequential API calls)

```javascript
import { of, concatMap, delay } from 'rxjs';

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
  () => createUser(userData),
  () => createProfile(profileData),
  () => sendWelcomeEmail(email)
);

operations$.pipe(
  concatMap(operation => operation())
).subscribe(
  result => console.log('Step completed:', result),
  error => console.error('Operation failed:', error)
);
```

### exhaustMap - Ignore new values while current Observable is active

**Use when**: Prevent duplicate operations (e.g., form submission)

```javascript
import { fromEvent, exhaustMap } from 'rxjs';
import { ajax } from 'rxjs/ajax';

// Prevent double-click form submission
const submitButton = document.getElementById('submit');
const submit$ = fromEvent(submitButton, 'click').pipe(
  exhaustMap(() => 
    ajax.post('/api/submit', formData)
  )
);

submit$.subscribe(
  response => console.log('Submitted:', response),
  error => console.error('Submission failed:', error)
);

// Key point: Clicks during submission are ignored
// User clicks 3 times rapidly -> only first click triggers submission
```

### Operator Comparison Table

| Operator | Behavior | Use Case | Cancels Previous |
|----------|----------|----------|------------------|
| `switchMap` | Cancel previous, switch to new | Search, autocomplete | Yes |
| `mergeMap` | Run all concurrently | Multiple uploads, parallel tasks | No |
| `concatMap` | Run sequentially in order | Sequential operations | No |
| `exhaustMap` | Ignore new until current completes | Form submission, prevent duplicates | N/A |

---

## Combination Operators

### combineLatest - Emit when any Observable emits

```javascript
import { combineLatest, of, interval } from 'rxjs';

const age$ = of(25, 26, 27);
const name$ = of('Alice', 'Bob');

combineLatest([age$, name$]).subscribe(console.log);
// [27, 'Alice']
// [27, 'Bob']
// Emits latest from each

// Real-world: Form validation
const username$ = usernameInput.valueChanges;
const password$ = passwordInput.valueChanges;
const terms$ = termsCheckbox.valueChanges;

combineLatest([username$, password$, terms$]).pipe(
  map(([username, password, terms]) => ({
    valid: username.length >= 3 && password.length >= 8 && terms,
    username,
    password,
    terms
  }))
).subscribe(formState => {
  submitButton.disabled = !formState.valid;
});
```

### forkJoin - Wait for all Observables to complete

```javascript
import { forkJoin } from 'rxjs';
import { ajax } from 'rxjs/ajax';

// Like Promise.all for Observables
forkJoin({
  user: ajax.getJSON('/api/user'),
  posts: ajax.getJSON('/api/posts'),
  comments: ajax.getJSON('/api/comments')
}).subscribe(({ user, posts, comments }) => {
  console.log('All loaded:', { user, posts, comments });
});

// Important: forkJoin only emits when ALL complete
// If any Observable never completes, forkJoin never emits
```

### zip - Combine values by index

```javascript
import { zip, of, interval } from 'rxjs';

const letters$ = of('A', 'B', 'C');
const numbers$ = of(1, 2, 3);

zip(letters$, numbers$).subscribe(console.log);
// ['A', 1]
// ['B', 2]
// ['C', 3]

// Real-world: Pair requests with responses
const requests$ = of(req1, req2, req3);
const responses$ = ajax.post('/api/batch', requests);

zip(requests$, responses$).subscribe(([request, response]) => {
  console.log(`Request ${request.id} -> Response:`, response);
});
```

### merge - Emit from all Observables as they emit

```javascript
import { merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';

const fast$ = interval(1000).pipe(map(x => `Fast: ${x}`));
const slow$ = interval(2000).pipe(map(x => `Slow: ${x}`));

merge(fast$, slow$).subscribe(console.log);
// Fast: 0
// Slow: 0
// Fast: 1
// Fast: 2
// Slow: 1
// ...

// Real-world: Multiple event sources
const clicks$ = fromEvent(document, 'click').pipe(map(() => 'click'));
const keys$ = fromEvent(document, 'keypress').pipe(map(() => 'keypress'));

merge(clicks$, keys$).subscribe(event => {
  console.log('User interaction:', event);
});
```

### concat - Subscribe to Observables sequentially

```javascript
import { concat, of, delay } from 'rxjs';

const first$ = of(1, 2, 3);
const second$ = of(4, 5, 6).pipe(delay(1000));

concat(first$, second$).subscribe(console.log);
// 1, 2, 3 (immediately)
// 4, 5, 6 (after 1 second)

// Real-world: Sequential data loading
concat(
  loadCachedData(),
  loadFreshData()
).subscribe(data => updateUI(data));
```

---

## Error Handling

### catchError - Handle errors and continue

```javascript
import { of, throwError, catchError } from 'rxjs';
import { ajax } from 'rxjs/ajax';

// Basic error handling
ajax.getJSON('/api/data').pipe(
  catchError(error => {
    console.error('Error occurred:', error);
    return of({ default: 'data' }); // Return fallback
  })
).subscribe(data => console.log(data));

// Return different Observable on error
ajax.getJSON('/api/primary').pipe(
  catchError(() => ajax.getJSON('/api/fallback'))
).subscribe(data => console.log(data));

// Re-throw error after logging
ajax.getJSON('/api/data').pipe(
  catchError(error => {
    logError(error);
    return throwError(() => error); // Re-throw
  })
).subscribe({
  next: data => console.log(data),
  error: err => console.error('Final error:', err)
});
```

### retry - Retry on error

```javascript
import { ajax } from 'rxjs/ajax';
import { retry, retryWhen, delay, take } from 'rxjs';

// Simple retry - retry 3 times
ajax.getJSON('/api/unstable').pipe(
  retry(3)
).subscribe({
  next: data => console.log(data),
  error: err => console.error('Failed after 3 retries:', err)
});

// Retry with delay
ajax.getJSON('/api/unstable').pipe(
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

// Exponential backoff retry
ajax.getJSON('/api/unstable').pipe(
  retryWhen(errors => 
    errors.pipe(
      mergeMap((error, index) => {
        if (index >= 3) {
          return throwError(() => error);
        }
        const delayTime = Math.pow(2, index) * 1000;
        console.log(`Retry ${index + 1} after ${delayTime}ms`);
        return of(error).pipe(delay(delayTime));
      })
    )
  )
).subscribe({
  next: data => console.log(data),
  error: err => console.error('All retries failed:', err)
});
```

---

## Subjects

### Subject - Multicast to multiple observers

```javascript
import { Subject } from 'rxjs';

const subject = new Subject();

// Multiple subscribers
subject.subscribe(val => console.log('Observer 1:', val));
subject.subscribe(val => console.log('Observer 2:', val));

subject.next(1); // Both receive 1
subject.next(2); // Both receive 2

// Subject is both Observable and Observer
const observable$ = interval(1000);
observable$.subscribe(subject); // Subject subscribes to observable
```

### BehaviorSubject - Stores current value

```javascript
import { BehaviorSubject } from 'rxjs';

// Requires initial value
const currentUser$ = new BehaviorSubject({ name: 'Guest' });

// New subscribers immediately receive current value
currentUser$.subscribe(user => console.log('Sub 1:', user));
// Sub 1: { name: 'Guest' }

currentUser$.next({ name: 'Alice' });
// Sub 1: { name: 'Alice' }

// Late subscriber gets current value
currentUser$.subscribe(user => console.log('Sub 2:', user));
// Sub 2: { name: 'Alice' }

// Get current value synchronously
console.log(currentUser$.value); // { name: 'Alice' }

// Real-world: State management
class UserStore {
  private userSubject = new BehaviorSubject(null);
  public user$ = this.userSubject.asObservable();
  
  setUser(user) {
    this.userSubject.next(user);
  }
  
  getUser() {
    return this.userSubject.value;
  }
}
```

### ReplaySubject - Replay last N values

```javascript
import { ReplaySubject } from 'rxjs';

// Replay last 3 values
const replay$ = new ReplaySubject(3);

replay$.next(1);
replay$.next(2);
replay$.next(3);
replay$.next(4);

// New subscriber receives last 3 values
replay$.subscribe(val => console.log('Received:', val));
// Received: 2
// Received: 3
// Received: 4

// With time window: replay values from last 500ms
const timedReplay$ = new ReplaySubject(100, 500);
```

### AsyncSubject - Emits only last value on complete

```javascript
import { AsyncSubject } from 'rxjs';

const async$ = new AsyncSubject();

async$.subscribe(val => console.log('Received:', val));

async$.next(1);
async$.next(2);
async$.next(3);
async$.complete();
// Received: 3 (only last value before complete)
```

### Subject Comparison Table

| Subject Type | Initial Value | Replay | Use Case |
|--------------|---------------|--------|----------|
| `Subject` | No | No | Event bus, multicasting |
| `BehaviorSubject` | Yes (required) | Last 1 | Current state, form values |
| `ReplaySubject` | No | Last N | Recent history, caching |
| `AsyncSubject` | No | Last on complete | Single async result |

---

## Memory Management

### Unsubscription Strategies

```javascript
import { interval, Subscription } from 'rxjs';

// Strategy 1: Manual unsubscribe
const subscription = interval(1000).subscribe(console.log);
setTimeout(() => subscription.unsubscribe(), 5000);

// Strategy 2: takeUntil pattern (RECOMMENDED)
import { takeUntil, Subject } from 'rxjs';

class Component {
  private destroy$ = new Subject();
  
  ngOnInit() {
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(console.log);
    
    // Multiple subscriptions
    observable1$.pipe(takeUntil(this.destroy$)).subscribe();
    observable2$.pipe(takeUntil(this.destroy$)).subscribe();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Strategy 3: take(n) - Auto-complete after n emissions
import { take } from 'rxjs';

interval(1000).pipe(
  take(5)
).subscribe(console.log); // Auto-unsubscribes after 5 emissions

// Strategy 4: first() - Complete after first emission
import { first } from 'rxjs';

clicks$.pipe(
  first()
).subscribe(() => console.log('First click'));
```

### Avoiding Memory Leaks

```javascript
// BAD: Memory leak - subscription never cleaned up
class BadComponent {
  ngOnInit() {
    interval(1000).subscribe(console.log); // ❌ Leaks!
  }
}

// GOOD: Proper cleanup
class GoodComponent {
  private subscriptions = new Subscription();
  
  ngOnInit() {
    this.subscriptions.add(
      interval(1000).subscribe(console.log)
    );
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe(); // ✅ Cleaned up
  }
}

// BETTER: takeUntil pattern
class BetterComponent {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(console.log);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## Real Interview Questions

### Question 1: Implement Autocomplete with Debouncing

**Difficulty**: Mid  
**Companies**: Google, Microsoft, Atlassian

```javascript
import { fromEvent, debounceTime, distinctUntilChanged, switchMap, filter, catchError } from 'rxjs';
import { ajax } from 'rxjs/ajax';

function createAutocomplete(inputElement, apiUrl) {
  return fromEvent(inputElement, 'input').pipe(
    // Get input value
    map(event => event.target.value),
    
    // Wait 300ms after user stops typing
    debounceTime(300),
    
    // Only emit if value changed
    distinctUntilChanged(),
    
    // Only search if length >= 3
    filter(query => query.length >= 3),
    
    // Cancel previous request, make new one
    switchMap(query => 
      ajax.getJSON(`${apiUrl}?q=${query}`).pipe(
        catchError(error => {
          console.error('Search failed:', error);
          return of([]);
        })
      )
    )
  );
}

// Usage
const searchInput = document.getElementById('search');
const autocomplete$ = createAutocomplete(searchInput, '/api/search');

autocomplete$.subscribe(results => {
  displayResults(results);
});
```

### Question 2: Real-time Search with Cancellation

**Difficulty**: Mid-Senior  
**Companies**: Netflix, Amazon

```javascript
import { Subject, switchMap, debounceTime, distinctUntilChanged, tap } from 'rxjs';

class SearchService {
  private searchSubject = new Subject();
  private loadingSubject = new BehaviorSubject(false);
  
  public loading$ = this.loadingSubject.asObservable();
  public results$ = this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(() => this.loadingSubject.next(true)),
    switchMap(query => 
      this.performSearch(query).pipe(
        tap(() => this.loadingSubject.next(false)),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Search error:', error);
          return of([]);
        })
      )
    )
  );
  
  search(query) {
    this.searchSubject.next(query);
  }
  
  private performSearch(query) {
    return ajax.getJSON(`/api/search?q=${query}`);
  }
}

// Usage
const searchService = new SearchService();

searchService.results$.subscribe(results => {
  console.log('Results:', results);
});

searchService.loading$.subscribe(loading => {
  console.log('Loading:', loading);
});

searchService.search('javascript');
```

### Question 3: Polling with Retry Logic

**Difficulty**: Senior  
**Companies**: Google, Meta

```javascript
import { timer, switchMap, retry, catchError, takeWhile } from 'rxjs';

function createPolling(apiCall, interval = 5000, maxRetries = 3) {
  return timer(0, interval).pipe(
    switchMap(() => 
      apiCall().pipe(
        retry(maxRetries),
        catchError(error => {
          console.error('Polling error:', error);
          return of(null);
        })
      )
    ),
    // Stop polling if we get null (error)
    takeWhile(result => result !== null, true)
  );
}

// Usage: Poll every 5 seconds
const polling$ = createPolling(
  () => ajax.getJSON('/api/status'),
  5000,
  3
);

const subscription = polling$.subscribe(status => {
  console.log('Status:', status);
  
  // Stop polling when complete
  if (status?.complete) {
    subscription.unsubscribe();
  }
});
```

### Question 4: Handle Multiple API Calls with Cancellation

**Difficulty**: Senior  
**Companies**: Atlassian, Microsoft

```javascript
import { forkJoin, Subject, switchMap, catchError } from 'rxjs';

class DataLoader {
  private loadTrigger$ = new Subject();
  
  public data$ = this.loadTrigger$.pipe(
    switchMap(userId => 
      forkJoin({
        user: this.fetchUser(userId),
        posts: this.fetchPosts(userId),
        comments: this.fetchComments(userId)
      }).pipe(
        catchError(error => {
          console.error('Data loading failed:', error);
          return of({
            user: null,
            posts: [],
            comments: []
          });
        })
      )
    )
  );
  
  loadData(userId) {
    this.loadTrigger$.next(userId);
  }
  
  private fetchUser(userId) {
    return ajax.getJSON(`/api/users/${userId}`);
  }
  
  private fetchPosts(userId) {
    return ajax.getJSON(`/api/users/${userId}/posts`);
  }
  
  private fetchComments(userId) {
    return ajax.getJSON(`/api/users/${userId}/comments`);
  }
}

// Usage
const loader = new DataLoader();

loader.data$.subscribe(({ user, posts, comments }) => {
  console.log('Loaded:', { user, posts, comments });
});

// Rapid calls - previous requests are cancelled
loader.loadData(1);
loader.loadData(2);
loader.loadData(3); // Only this completes
```

### Question 5: State Management with BehaviorSubject

**Difficulty**: Mid  
**Companies**: All major companies

```javascript
import { BehaviorSubject, map } from 'rxjs';

class TodoStore {
  private todosSubject = new BehaviorSubject([]);
  
  public todos$ = this.todosSubject.asObservable();
  public completedTodos$ = this.todos$.pipe(
    map(todos => todos.filter(t => t.completed))
  );
  public activeTodos$ = this.todos$.pipe(
    map(todos => todos.filter(t => !t.completed))
  );
  
  addTodo(text) {
    const currentTodos = this.todosSubject.value;
    const newTodo = {
      id: Date.now(),
      text,
      completed: false
    };
    this.todosSubject.next([...currentTodos, newTodo]);
  }
  
  toggleTodo(id) {
    const currentTodos = this.todosSubject.value;
    const updatedTodos = currentTodos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.todosSubject.next(updatedTodos);
  }
  
  removeTodo(id) {
    const currentTodos = this.todosSubject.value;
    this.todosSubject.next(currentTodos.filter(t => t.id !== id));
  }
  
  getTodos() {
    return this.todosSubject.value;
  }
}

// Usage
const store = new TodoStore();

store.todos$.subscribe(todos => {
  console.log('All todos:', todos);
});

store.completedTodos$.subscribe(todos => {
  console.log('Completed:', todos);
});

store.addTodo('Learn RxJS');
store.addTodo('Build app');
store.toggleTodo(1);
```

---

## Performance Optimization

### shareReplay - Cache and Share Results

```javascript
import { shareReplay } from 'rxjs';

// Without shareReplay - multiple HTTP requests
const data$ = ajax.getJSON('/api/expensive');

data$.subscribe(console.log); // Request 1
data$.subscribe(console.log); // Request 2
data$.subscribe(console.log); // Request 3

// With shareReplay - single HTTP request
const cachedData$ = ajax.getJSON('/api/expensive').pipe(
  shareReplay(1) // Cache last 1 emission
);

cachedData$.subscribe(console.log); // Request 1
cachedData$.subscribe(console.log); // Uses cache
cachedData$.subscribe(console.log); // Uses cache

// With time-based cache
const timedCache$ = ajax.getJSON('/api/data').pipe(
  shareReplay({
    bufferSize: 1,
    refCount: true,
    windowTime: 5000 // Cache for 5 seconds
  })
);
```

### Backpressure Handling

```javascript
import { interval, bufferTime, throttleTime, auditTime, sampleTime } from 'rxjs';

// Problem: Too many events
const fastEvents$ = interval(10); // Emits every 10ms

// Solution 1: Buffer events
fastEvents$.pipe(
  bufferTime(1000) // Collect events for 1 second
).subscribe(events => {
  console.log(`Received ${events.length} events`);
  processInBatch(events);
});

// Solution 2: Throttle - emit first, ignore rest for duration
fastEvents$.pipe(
  throttleTime(1000) // Emit first, then ignore for 1s
).subscribe(console.log);

// Solution 3: Audit - emit last after duration
fastEvents$.pipe(
  auditTime(1000) // Emit last value after 1s
).subscribe(console.log);

// Solution 4: Sample - emit latest at intervals
fastEvents$.pipe(
  sampleTime(1000) // Emit latest value every 1s
).subscribe(console.log);
```

### Multicasting

```javascript
import { Subject, multicast, refCount } from 'rxjs';

// Cold observable - separate execution per subscriber
const cold$ = ajax.getJSON('/api/data');

// Make it hot with multicast
const hot$ = cold$.pipe(
  multicast(() => new Subject()),
  refCount() // Auto-connect/disconnect
);

// Or use share() (shorthand)
const shared$ = cold$.pipe(share());

// All subscribers share single execution
shared$.subscribe(data => console.log('Sub 1:', data));
shared$.subscribe(data => console.log('Sub 2:', data));
// Only one HTTP request made
```

---

## Quick Reference

### Common Operators Cheat Sheet

```javascript
// Creation
of(1, 2, 3)
from([1, 2, 3])
interval(1000)
fromEvent(element, 'click')

// Transformation
map(x => x * 2)
pluck('property')
scan((acc, val) => acc + val, 0)

// Filtering
filter(x => x > 5)
take(5)
takeUntil(notifier$)
takeWhile(x => x < 10)
skip(3)
distinct()
distinctUntilChanged()

// Combination
combineLatest([obs1$, obs2$])
forkJoin([obs1$, obs2$])
merge(obs1$, obs2$)
concat(obs1$, obs2$)
zip(obs1$, obs2$)

// Flattening
switchMap(x => innerObs$)
mergeMap(x => innerObs$)
concatMap(x => innerObs$)
exhaustMap(x => innerObs$)

// Error Handling
catchError(err => of(default))
retry(3)
retryWhen(errors$ => errors$.pipe(delay(1000)))

// Utility
tap(x => console.log(x))
delay(1000)
debounceTime(300)
throttleTime(1000)
share()
shareReplay(1)
```

### When to Use Which Operator

| Scenario | Operator |
|----------|----------|
| Transform values | `map` |
| Filter values | `filter` |
| Cancel previous (search) | `switchMap` |
| Run all (uploads) | `mergeMap` |
| Sequential order | `concatMap` |
| Prevent duplicates (submit) | `exhaustMap` |
| Wait for user to stop typing | `debounceTime` |
| Limit event frequency | `throttleTime` |
| Multiple API calls (all must succeed) | `forkJoin` |
| Combine latest from multiple | `combineLatest` |
| Share single execution | `share` / `shareReplay` |
| Auto-unsubscribe | `takeUntil` |
| Handle errors | `catchError` |
| Retry on failure | `retry` / `retryWhen` |

### Best Practices

1. **Always unsubscribe** - Use `takeUntil` pattern or `async` pipe
2. **Use shareReplay for expensive operations** - Cache HTTP requests
3. **Prefer switchMap for user input** - Cancel outdated requests
4. **Use exhaustMap for submissions** - Prevent duplicate operations
5. **Handle errors with catchError** - Prevent stream termination
6. **Avoid nested subscriptions** - Use flattening operators instead
7. **Use BehaviorSubject for state** - Store current value
8. **Debounce user input** - Reduce unnecessary API calls
9. **Use async pipe in templates** - Auto-unsubscribe in Angular
10. **Test with marble diagrams** - Visualize observable behavior

---

## Further Reading

- [RxJS Official Documentation](https://rxjs.dev/)
- [Learn RxJS](https://www.learnrxjs.io/)
- [RxJS Marbles - Interactive Diagrams](https://rxmarbles.com/)
- [RxJS Operator Decision Tree](https://rxjs.dev/operator-decision-tree)
- [Reactive Programming with RxJS](https://pragprog.com/titles/smreactjs5/reactive-programming-with-rxjs/)

---

**Interview Preparation Checklist**:
- ✅ Understand hot vs cold observables
- ✅ Know when to use each flattening operator
- ✅ Master the takeUntil unsubscription pattern
- ✅ Implement autocomplete with proper cancellation
- ✅ Use BehaviorSubject for state management
- ✅ Handle errors without terminating streams
- ✅ Optimize with shareReplay and multicasting
- ✅ Understand backpressure and throttling
- ✅ Know combination operators (combineLatest, forkJoin, etc.)
- ✅ Avoid memory leaks with proper cleanup

Good luck with your RxJS interviews! 🚀
