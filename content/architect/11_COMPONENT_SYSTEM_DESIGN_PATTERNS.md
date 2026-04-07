# 11 — Component System Design Patterns

## Architect-Level Guide: Search Bar with Autocomplete & Pagination

> **Scope**: Complete system design for two production-grade Angular components — a Search Bar
> with Autocomplete and a Pagination Component — covering architecture, RxJS pipelines,
> keyboard navigation, accessibility, performance, styling, and testing strategies.

🔑 **Simple Explanation:**
Imagine you're building two things every big website needs: (1) a search box that shows suggestions as you type (like Google's search bar), and (2) those little page number buttons at the bottom of a list (like "1 2 3 ... 20 Next"). This guide walks through how to build both of these from scratch, the *right* way — so they're fast, accessible to people with disabilities, and easy to maintain in a large codebase.

Think of this document as a blueprint for a house. We don't just show you the finished house — we explain *why* each wall is where it is, *why* we chose certain materials, and *what would go wrong* if we cut corners. By the end, you'll be able to whiteboard either component in an interview and explain every architectural decision.

---

## Table of Contents

1. [Part 1: Search Bar with Autocomplete](#part-1-search-bar-with-autocomplete)
   - [1. Architecture](#1-architecture) — Component hierarchy, smart/dumb split, data models
   - [2. RxJS Pipeline](#2-rxjs-pipeline--the-reactive-search-engine) — The reactive search engine with marble diagrams
   - [3. Keyboard Navigation](#3-keyboard-navigation) — Full keyboard support and state machine
   - [4. Click Outside Detection](#4-click-outside-detection) — Directive patterns and zone optimization
   - [5. Accessibility](#5-accessibility--aria-combobox-pattern) — ARIA combobox pattern, screen reader support
   - [6. Performance Optimizations](#6-performance-optimizations) — OnPush, trackBy, pure pipes, virtual scrolling
2. [Part 2: Pagination Component](#part-2-pagination-component)
   - [1. Architecture](#1-architecture-1) — Component hierarchy and API design
   - [2. Page Number Generation](#2-page-number-generation-algorithm) — Ellipsis logic algorithm
3. [Part 3: Shared Patterns](#part-3-shared-patterns)
4. [Quick Summary](#quick-summary--all-major-concepts-at-a-glance)

---

# PART 1: Search Bar with Autocomplete

🔑 **Simple Explanation:**
Think of a search bar with autocomplete like a helpful librarian. You start saying a book title, and before you finish, the librarian is already pulling books off the shelf that match what you've said so far. The tricky part? The librarian needs to:
- Wait until you pause speaking before searching (debouncing)
- Stop looking for the old book if you change your mind (cancellation)
- Handle the case where they can't find anything (error handling)
- Let you browse suggestions with your keyboard, not just your mouse (keyboard navigation)
- Describe what's happening to someone who can't see the screen (accessibility)

This is one of the most commonly asked system design questions in frontend interviews because it touches on so many concepts: reactive programming, component architecture, accessibility, performance, and user experience. Let's break it down piece by piece.

---

## 1. Architecture

### 1.1 Component Hierarchy

🔑 **Simple Explanation:**
Just like a company has an org chart (CEO → Managers → Employees), Angular components are organized in a tree. The "smart" component at the top is like the manager — it makes decisions and coordinates. The "dumb" components below are like employees — they just do what they're told and report back. This separation makes each piece easier to test and reuse.

**Real-world analogy:** Think of a restaurant. The head chef (smart component) decides the menu, coordinates orders, and manages the kitchen. The line cooks (dumb components) just prepare whatever dish they're told to make. A line cook doesn't decide what's on the menu — they just execute. This means you can move a line cook to a different restaurant (reuse the component) without any changes.

```
SearchBarComponent (Smart — Orchestrator)
│
├── SearchInputComponent (Dumb — Presentation)
│   ├── <input> with FormControl binding
│   ├── Search icon
│   ├── Clear button
│   └── Loading spinner
│
├── SuggestionsListComponent (Dumb — Presentation)
│   ├── SuggestionItemComponent (Dumb — Leaf)
│   │   ├── Icon
│   │   ├── Title (with highlight)
│   │   ├── Description
│   │   └── Category badge
│   ├── No-results message
│   └── Min-chars message
│
└── ClickOutsideDirective (Structural — Utility)
```

> **Key Takeaway:** The component tree mirrors the visual layout. Each box in the tree is a separate Angular component with its own template, styles, and logic. The "Smart" component at the top is the only one that knows about services and state management. Everything below it is a "Dumb" (presentational) component that receives data via `@Input()` and sends events via `@Output()`.

**Common Interview Follow-up:** *"Why not just put everything in one component?"* — Because a single monolithic component becomes untestable, unreusable, and unmaintainable as it grows. With the split, you can unit test `SuggestionItemComponent` by just passing in a mock item — no HTTP mocking, no service injection, no complex setup.

---

### 1.2 Smart vs Dumb Component Split

🔑 **Simple Explanation:**
"Smart" components are like the brain — they know about services, make API calls, and manage state. "Dumb" components are like the hands — they just display data they're given and report user actions back up. This split is crucial because dumb components are super easy to test (just pass in data, check what renders) and can be reused anywhere.

**Real-world analogy:** Think of a TV remote (smart) and a TV screen (dumb). The remote knows which channel to switch to, which streaming service to open, and how to adjust volume. The screen just displays whatever signal it receives. You can replace the screen with a projector (different dumb component) and the remote still works. You can also use the same screen with a different remote (different smart component).


**What this diagram shows:** The complete input/output contract between the smart parent and its dumb children. Every arrow going DOWN is an `@Input()` (data). Every arrow going UP is an `@Output()` (event). The smart component is the single source of truth — it owns all the state and passes slices of it to each child.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SearchBarComponent (SMART)                       │
│                                                                     │
│  Responsibilities:                                                  │
│  • Owns the FormControl and RxJS pipeline                          │
│  • Manages open/closed state of dropdown                           │
│  • Tracks selectedIndex for keyboard navigation                    │
│  • Calls SearchService.search() via switchMap                      │
│  • Coordinates child components via @Input/@Output                 │
│  • Handles click-outside dismissal                                 │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐    │
│  │  SearchInput (DUMB)  │  │  SuggestionsList (DUMB)          │    │
│  │                      │  │                                    │    │
│  │  @Input() value      │  │  @Input() items                   │    │
│  │  @Input() placeholder│  │  @Input() selectedIndex           │    │
│  │  @Input() isLoading  │  │  @Input() query (for highlight)   │    │
│  │  @Output() valueChg  │  │  @Input() isVisible               │    │
│  │  @Output() keydown   │  │  @Output() itemSelected           │    │
│  │  @Output() focus     │  │  @Output() itemHovered            │    │
│  │  @Output() clear     │  │                                    │    │
│  └──────────────────────┘  │  ┌────────────────────────────┐   │    │
│                             │  │  SuggestionItem (DUMB)     │   │    │
│                             │  │                            │   │    │
│                             │  │  @Input() item             │   │    │
│                             │  │  @Input() isSelected       │   │    │
│                             │  │  @Input() query            │   │    │
│                             │  │  @Output() selected        │   │    │
│                             │  └────────────────────────────┘   │    │
│                             └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

⚠️ **Common Mistake:** Beginners often put API calls and business logic inside every component. This makes components impossible to reuse. If your `SuggestionItem` knows how to call an API, you can't use it in a different context. Keep dumb components *truly* dumb.

> **Key Takeaway:** The smart/dumb split is the single most important architectural pattern for Angular components. Smart components handle "what to do" (logic, state, API calls). Dumb components handle "how to look" (templates, styles, animations). If you remember one thing from this section, remember this split.

**Common Interview Follow-up:** *"How do you decide what goes in the smart vs dumb component?"* — Ask yourself: "Does this component need to know about any Angular service?" If yes, it's smart. If it can work with just `@Input()` and `@Output()`, it's dumb. Most components should be dumb.

---

### 1.3 Data Model

🔑 **Simple Explanation:**
Before building anything, we define the "shape" of our data using TypeScript interfaces. Think of these like blueprints — they tell every part of the app exactly what a search result looks like, what the current state of the search bar is, and what the search function signature should be.

**Real-world analogy:** Before a construction crew builds a house, they agree on blueprints. The electrician, plumber, and carpenter all work from the same blueprint. Similarly, TypeScript interfaces are the "blueprints" that every component, service, and test agrees on. If you change the blueprint, TypeScript immediately tells you everywhere that needs to be updated.

**What this code does:** We define three TypeScript interfaces/types that serve as contracts between all parts of the search bar system. `SearchItem` describes a single search result. `SearchState` describes the entire state of the search bar at any moment. `SearchFn` is a type for the search function itself, making the component reusable with any backend API.

```typescript
// search.models.ts

// This describes what a single search result looks like.
// Every suggestion in the dropdown will have this shape.
export interface SearchItem {
  id: string;              // Unique identifier — needed for trackBy and selection
  title: string;           // The main text shown in the suggestion (e.g., "Angular Material")
  description?: string;    // Optional secondary text (e.g., "UI Component Library")
  category?: string;       // Optional category badge (e.g., "Framework", "Library")
  icon?: string;           // Optional icon identifier to show next to the suggestion
  metadata?: Record<string, unknown>;  // A flexible bag for any extra data you might need
}

// This describes the entire state of the search bar at any moment.
// Having all state in one place makes debugging much easier.
export interface SearchState {
  query: string;           // What the user has typed so far
  results: SearchItem[];   // The current list of suggestions from the API
  isLoading: boolean;      // Are we currently waiting for API results?
  isOpen: boolean;         // Is the suggestions dropdown visible?
  selectedIndex: number;   // Which suggestion is highlighted (-1 means none)
  error: string | null;    // If something went wrong, what was the error message?
}

// This is the "type" of the search function itself.
// It takes a query string and returns an Observable (a stream) of search results.
// By making this a type, the parent component can inject ANY search function —
// making the search bar reusable for different APIs.
export type SearchFn = (query: string) => Observable<SearchItem[]>;
```

> **Key Takeaway:** Always define your data models FIRST, before writing any component code. These interfaces act as contracts between components, services, and tests. The `SearchFn` type is especially powerful — it means the search bar doesn't care WHERE the results come from (REST API, GraphQL, local cache, mock data). This is the Dependency Inversion Principle in action.

💡 **Why This Matters:** Interviewers ask about data models to see if you think about contracts between components *before* writing code. They want to hear that you define clear interfaces, use optional properties wisely, and make components flexible through dependency injection (like the `SearchFn` type).

**Common Interview Follow-up:** *"Why use `Record<string, unknown>` for metadata instead of `any`?"* — `unknown` is type-safe: you must check the type before using it. `any` disables TypeScript's type checking entirely, which defeats the purpose of using TypeScript. `Record<string, unknown>` says "this is an object with string keys, but I don't know the value types yet — I'll check at runtime."

📝 **Quick Summary:**
- The search bar uses a Smart/Dumb component hierarchy — the smart parent orchestrates, dumb children just display
- Data models (`SearchItem`, `SearchState`, `SearchFn`) define clear contracts between components
- The `SearchFn` type makes the search bar reusable with any backend API

---

## 2. RxJS Pipeline — The Reactive Search Engine

🔑 **Simple Explanation:**
RxJS is like a conveyor belt in a factory. Raw materials (user keystrokes) go in one end, pass through a series of machines (operators like `debounceTime`, `switchMap`), and finished products (search results) come out the other end. Each machine does one specific job — one waits for a pause in typing, another cancels old requests, another handles errors. The beauty is that you can rearrange or add machines without rewriting the whole factory.

**Real-world analogy:** Imagine an assembly line at a car factory. Station 1 receives raw metal. Station 2 shapes it. Station 3 paints it. Station 4 does quality control. Each station does ONE thing and passes the result to the next. If you need to add a new step (like rust-proofing), you just insert a new station — you don't rebuild the whole factory. RxJS operators work the same way.

If you're coming from a Promise-based background, the key mental shift is: Promises handle ONE future value. Observables handle a STREAM of values over time. A search input produces a stream of queries — one for every keystroke. RxJS lets you transform that stream elegantly.

---

### 2.1 Complete Pipeline Architecture

**What this code does:** This is the complete search bar component with its RxJS pipeline. The pipeline listens to the input field's value changes and transforms them through a series of operators: debounce (wait for typing pause), deduplicate (skip if same query), filter (minimum characters), switchMap (cancel old requests, start new ones), and error handling. The end result is a smooth, efficient autocomplete experience.

```typescript
// search-bar.component.ts — Core RxJS pipeline

// These are Angular building blocks we need for the component
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter,
         ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
// FormControl lets us track the input field's value reactively (as a stream)
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
// RxJS core types — Subject is like a manual event emitter, Observable is a data stream
import { Subject, Observable, of, EMPTY } from 'rxjs';
// These are the "machines" on our conveyor belt — each transforms the data stream
import {
  debounceTime,          // Wait for a pause in typing before proceeding
  distinctUntilChanged,  // Skip if the value hasn't actually changed
  filter,                // Only let certain values through (like a gate)
  switchMap,             // Cancel the old API call, start a new one
  catchError,            // If something breaks, recover gracefully
  tap,                   // Peek at the data for side effects (like showing a spinner)
  takeUntil,             // Automatically stop listening when the component is destroyed
  finalize               // Run cleanup code no matter what (success or error)
} from 'rxjs/operators';
import { ClickOutsideDirective } from './click-outside.directive';
import { HighlightPipe } from './highlight.pipe';

@Component({
  selector: 'app-search-bar',       // The HTML tag name: <app-search-bar>
  standalone: true,                   // No NgModule needed (Angular 15+ feature)
  imports: [CommonModule, ReactiveFormsModule, ClickOutsideDirective, HighlightPipe],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush  // Performance optimization — explained in Section 6
})
export class SearchBarComponent implements OnInit, OnDestroy {
  // --- INPUTS: Data flowing IN from the parent component ---
  @Input() placeholder = 'Search...';     // Placeholder text shown in the empty input
  @Input() debounceMs = 300;              // How long to wait (ms) after typing stops before searching
  @Input() minChars = 2;                  // Minimum characters before we bother searching
  @Input() maxSuggestions = 10;           // Cap the number of suggestions shown
  @Input() searchFn!: SearchFn;           // The actual search function — injected by the parent!

  // --- OUTPUTS: Events flowing OUT to the parent component ---
  @Output() search = new EventEmitter<string>();      // Fired when user submits a search
  @Output() select = new EventEmitter<SearchItem>();  // Fired when user picks a suggestion

  // --- INTERNAL STATE ---
  searchControl = new FormControl('');  // Reactive form control bound to the <input> element
  suggestions: SearchItem[] = [];       // Current list of suggestions to display
  isOpen = false;                       // Is the dropdown currently visible?
  isLoading = false;                    // Are we waiting for API results?
  selectedIndex = -1;                   // Which suggestion is keyboard-highlighted (-1 = none)

  // This Subject acts as a "kill switch" — when it emits, all subscriptions stop.
  // This prevents memory leaks when the component is removed from the page.
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // This is the heart of the search bar — the RxJS pipeline.
    // Think of it as: "whenever the input value changes, do these steps in order"
    this.searchControl.valueChanges
      .pipe(
        // STEP ① — DEBOUNCE: Wait 300ms after the user stops typing.
        // Without this, we'd fire an API call on EVERY keystroke ("a", "an", "ang", "angu"...)
        // which would hammer the server and create a janky experience.
        // Analogy: Like an elevator door — it keeps resetting the "close" timer
        // every time someone walks in. It only closes after 300ms of nobody entering.
        debounceTime(this.debounceMs),

        // STEP ② — DEDUPLICATE: If the value is the same as last time, skip it.
        // Example: user types "ang", deletes the "g", then retypes "g" → still "ang".
        // No need to search again for the same query.
        // Analogy: Like a bouncer who says "you just came in, you can't enter again."
        distinctUntilChanged(),

        // STEP ③ — SIDE EFFECT: Reset the keyboard selection and close dropdown if query is too short.
        // `tap` lets us "peek" at the value and do something without changing the stream.
        // Think of `tap` as a security camera on the conveyor belt — it observes but doesn't modify.
        tap(query => {
          this.selectedIndex = -1;  // Reset keyboard highlight whenever query changes
          if (!query || query.length < this.minChars) {
            this.suggestions = [];  // Clear old suggestions
            this.isOpen = false;    // Close the dropdown
          }
        }),

        // STEP ④ — FILTER: Only proceed if the query is long enough.
        // If the user typed just "a", we don't want to search — too many results, too vague.
        // Analogy: Like a height requirement on a roller coaster — too short, you can't ride.
        filter(query =>
          !!query && query.length >= this.minChars
        ),

        // STEP ⑤ — SIDE EFFECT: Show the loading spinner before the API call starts.
        // This gives the user immediate visual feedback that something is happening.
        tap(() => this.isLoading = true),

        // STEP ⑥ — SWITCH MAP: This is the KEY operator. It does two things:
        //   a) Starts a new API call for the current query
        //   b) CANCELS any previous API call that hasn't finished yet
        // Why cancel? If the user typed "ang" and then "angular", we don't care about
        // the results for "ang" anymore. switchMap automatically unsubscribes from the
        // old Observable, which cancels the HTTP request.
        // Analogy: Like calling a waiter back: "Actually, cancel my first order,
        // I want something else." The kitchen stops making the first dish.
        switchMap(query =>
          this.searchFn(query!).pipe(
            // STEP ⑦ — ERROR HANDLING: If the API call fails, return an empty array
            // instead of crashing the entire stream. Without this, one failed request
            // would kill the search bar permanently.
            // Analogy: Like a safety net under a trapeze — if you fall, you bounce
            // back instead of crashing to the ground.
            catchError(err => {
              console.error('Search failed:', err);
              return of([]);  // Return empty results — the stream keeps working
            }),
            // STEP ⑧ — FINALIZE: Hide the spinner no matter what (success OR error).
            // `finalize` runs when the inner Observable completes or errors.
            // Analogy: Like a "finally" block in try/catch — cleanup code that always runs.
            finalize(() => this.isLoading = false)
          )
        ),

        // STEP ⑨ — AUTO-CLEANUP: Stop this entire pipeline when the component is destroyed.
        // Without this, the subscription would live on as a "zombie" — still listening
        // for input changes on a component that no longer exists. This is a memory leak.
        // Analogy: Like turning off the lights when you leave a room — if you don't,
        // the electricity bill keeps growing even though nobody's home.
        takeUntil(this.destroy$)
      )
      .subscribe(results => {
        // We made it through all the operators! Now we have fresh search results.
        this.suggestions = results.slice(0, this.maxSuggestions);  // Cap the list length
        this.isOpen = this.suggestions.length > 0;                 // Show dropdown if we have results
      });
  }

  ngOnDestroy(): void {
    // When Angular removes this component, emit on destroy$ to trigger takeUntil above.
    this.destroy$.next();      // Signal: "we're done!"
    this.destroy$.complete();  // Clean up the Subject itself
  }
}
```

> **Key Takeaway:** The RxJS pipeline is the heart of the search bar. Each operator has a specific job, and the ORDER matters. `debounceTime` must come before `switchMap` (otherwise you'd cancel requests before debouncing). `catchError` must be INSIDE `switchMap` (otherwise one error kills the whole stream). `takeUntil` should be the LAST operator (so it catches everything). Think of it as a recipe — the steps must be in the right order.

⚠️ **Common Mistake:** Forgetting `takeUntil(this.destroy$)` is the #1 cause of memory leaks in Angular apps. Every subscription that isn't cleaned up keeps running in the background, even after the component is gone. Always add this as the LAST operator in the pipe.

⚠️ **Common Mistake:** Putting `catchError` outside of `switchMap` instead of inside it. If you catch errors at the outer level, one failed API call will complete the entire stream and the search bar will stop working permanently. By putting `catchError` *inside* `switchMap`, only the individual request fails — the outer stream keeps listening for new queries.

**Common Interview Follow-up:** *"What happens if the user types faster than the debounce time?"* — Each keystroke resets the debounce timer. So if the user types "angular" in 200ms (faster than the 300ms debounce), only ONE API call fires — for the complete word "angular". The intermediate values ("a", "an", "ang", etc.) are all swallowed by the debounce.

---

### 2.2 ASCII Marble Diagram — Operator-by-Operator

🔑 **Simple Explanation:**
Marble diagrams are like timeline drawings that show what happens to data as it flows through each RxJS operator. Imagine a timeline going left to right — each letter or word on the line is a value being emitted at that point in time. The arrows show how one operator transforms the timeline into a new one. This is the standard way RxJS developers visualize and communicate about streams.

**Real-world analogy:** Think of a marble diagram like a train schedule. The top line shows when trains depart (raw events). Each operator is like a station that modifies the schedule — one delays trains, another removes duplicates, another reroutes them. The bottom line shows the final schedule that passengers (your UI) actually see.

If an interviewer asks you to "draw the RxJS pipeline," THIS is what they want to see. Practice drawing these on a whiteboard.

```
User keystrokes (raw input):
  ──a──n──g──────u──l──a──r──────────j──s──────────────────────|

① debounceTime(300ms):
  Waits 300ms of silence before emitting. Rapid typing is collapsed.
  Think of it like an elevator door — it keeps resetting the "close" timer
  every time someone walks in. It only closes after 300ms of nobody entering.

  ──a──n──g──────u──l──a──r──────────j──s──────────────────────|
                 ↓ (300ms gap)       ↓ (300ms gap)  ↓ (300ms gap)
  ─────────────"ang"───────────"angular"──────────"js"─────────|

② distinctUntilChanged():
  Drops value if identical to previous emission.
  Like a bouncer who says "you just came in, you can't enter again."

  ─────────────"ang"───────────"angular"──────────"js"─────────|
  ─────────────"ang"───────────"angular"──────────"js"─────────|
  (all unique here — no drops)

  Counter-example: user types "ang", deletes, retypes "ang":
  ─────────────"ang"──────────────────────────────"ang"────────|
  ─────────────"ang"───────────────────────────────────────────|
                                                   ↑ dropped (same)

③ filter(q => q.length >= 2):
  Gates emissions — only queries with 2+ characters pass through.
  Like a height requirement on a roller coaster — too short, you can't ride.

  ─────────────"ang"───────────"angular"──────────"js"─────────|
  ─────────────"ang"───────────"angular"──────────"js"─────────|
  (all pass — length ≥ 2)

  If minChars=3: "js" would be filtered out:
  ─────────────"ang"───────────"angular"───────────────────────|

④ switchMap(query => searchService.search(query)):
  Cancels in-flight HTTP request when new query arrives.
  Like calling a waiter back: "Actually, cancel my first order, I want something else."

  ─────────────"ang"───────────"angular"──────────"js"─────────|
                 │                  │                │
                 ▼                  ▼                ▼
          HTTP(ang)          HTTP(angular)       HTTP(js)
           200ms               150ms              100ms
                 │    ✗ cancelled  │                │
                 ▼                 ▼                ▼
  ──────────[results]────────[results]────────[results]────────|

  Key insight: If "angular" request arrives while "ang" is still
  in-flight, the "ang" Observable is unsubscribed → HTTP cancelled.

⑤ catchError:
  If HTTP fails, return empty array instead of killing the stream.
  Like a safety net under a trapeze — if you fall, you bounce back instead of crashing.

  ─────────────"ang"───────────"angular"──────────"js"─────────|
                 │                  │                │
          HTTP(ang)→ERROR    HTTP(angular)       HTTP(js)
                 │                  │                │
                 ▼                  ▼                ▼
  ──────────── [] ──────────[results]────────[results]─────────|
```

> **Key Takeaway:** Marble diagrams are the universal language of RxJS. If you can draw one on a whiteboard, you can explain any reactive pipeline. The key insight is that each operator transforms the TIMELINE, not just individual values. `debounceTime` changes WHEN values are emitted. `switchMap` changes WHICH inner Observables are active. `catchError` changes WHAT happens on failure.

**Common Interview Follow-up:** *"What happens in the marble diagram if the API for 'ang' returns AFTER the API for 'angular'?"* — With `switchMap`, this can't happen because the "ang" request was cancelled when "angular" arrived. But with `mergeMap`, both would run in parallel, and the "ang" results could overwrite the "angular" results — a classic race condition bug.

---

### 2.3 Why switchMap Over Other Flattening Operators

🔑 **Simple Explanation:**
RxJS has four operators that handle "an Observable inside an Observable" (like an API call triggered by a user action). Each one handles the situation differently. Picking the wrong one is a common source of bugs. Here's the cheat sheet:

**Real-world analogy for each operator:**
- **switchMap** = Changing TV channels. When you switch to a new channel, the old one stops immediately. You only watch one channel at a time.
- **mergeMap** = Opening browser tabs. Each new tab runs independently. All tabs are active simultaneously.
- **concatMap** = A printer queue. Jobs are processed one at a time, in order. The next job waits until the current one finishes.
- **exhaustMap** = An elevator. While it's moving, pressing the button does nothing. It only accepts new requests when it's idle.

| Operator     | Behavior                          | Real-World Analogy                          | Use Case                    |
|-------------|-----------------------------------|---------------------------------------------|-----------------------------|
| `switchMap` | Cancels previous inner Observable | Changing TV channels — old channel stops    | ✅ Autocomplete search       |
| `mergeMap`  | Runs all in parallel              | Opening multiple browser tabs at once       | Bulk operations, logging    |
| `concatMap` | Queues sequentially               | A printer queue — one job at a time         | Ordered writes, form saves  |
| `exhaustMap`| Ignores new until current done    | An elevator ignoring button presses while moving | Login button, submit forms  |

`switchMap` is the correct choice for autocomplete because:
- Only the latest search query matters — you don't care about results for "ang" if you've already typed "angular"
- Previous in-flight requests are wasted bandwidth — cancelling them saves server resources
- Prevents race conditions where stale results overwrite fresh ones (imagine "ang" results arriving AFTER "angular" results)

⚠️ **Common Mistake:** Using `mergeMap` for search. This would run ALL searches in parallel and display results in whatever order they arrive. If the "ang" request is slow and "angular" is fast, you'd briefly see "angular" results, then they'd get overwritten by the stale "ang" results. This is called a "race condition."

> **Key Takeaway:** The choice of flattening operator is one of the most important decisions in any RxJS pipeline. Use `switchMap` when only the latest matters (search, navigation). Use `mergeMap` when all results matter (bulk downloads). Use `concatMap` when order matters (sequential saves). Use `exhaustMap` when you want to ignore duplicates (login buttons).

💡 **Why This Matters:** This is one of the most commonly asked RxJS questions in Angular interviews. Interviewers want to hear that you understand the difference between these four operators and can pick the right one for each scenario. Bonus points for mentioning race conditions.

**Common Interview Follow-up:** *"When would you use `exhaustMap`?"* — For a login button. If the user clicks "Login" and the request is in-flight, you want to IGNORE additional clicks (not cancel the first request, not queue them up). `exhaustMap` does exactly this — it ignores new emissions until the current inner Observable completes.

📝 **Quick Summary:**
- The RxJS pipeline transforms raw keystrokes into search results through a chain of operators
- `debounceTime` prevents hammering the API on every keystroke; `switchMap` cancels stale requests
- `catchError` inside `switchMap` keeps the stream alive even when individual requests fail
- `takeUntil(destroy$)` prevents memory leaks when the component is destroyed

---

## 3. Keyboard Navigation

🔑 **Simple Explanation:**
Not everyone uses a mouse. Power users, people with motor disabilities, and anyone who prefers keyboard shortcuts need to navigate the suggestions list using arrow keys, Enter, Escape, etc. Think of it like navigating a TV menu with a remote control — Up/Down to move, Enter to select, Back to close.

**Real-world analogy:** Think of a vending machine with a digital display. You press Up/Down to scroll through items, Enter to select, and Cancel to go back. The machine highlights the current selection so you always know where you are. Our keyboard navigation works the same way — it maintains a `selectedIndex` that tracks which suggestion is currently highlighted.

Keyboard navigation is not just a nice-to-have — it's required for accessibility compliance (WCAG 2.1 Level AA). Many enterprise clients and government contracts require WCAG compliance, so this is a must-know for architect-level roles.

---

### 3.1 Keyboard Event Handler

**What this code does:** This method handles every keyboard event when the search input is focused. It implements a complete keyboard navigation system: ArrowDown/Up to move through suggestions, Enter to select or submit, Escape to close, Tab to move focus naturally, and Home/End to jump to the first/last suggestion. Each key has specific behavior and edge cases handled.

```typescript
// Keyboard navigation — full implementation
// This method is called every time the user presses a key while the search input is focused.
onKeyDown(event: KeyboardEvent): void {
  switch (event.key) {

    case 'ArrowDown':
      // preventDefault() stops the cursor from jumping to the end of the input text,
      // which is the browser's default behavior for ArrowDown in a text field.
      event.preventDefault();

      // If the dropdown is closed but we have suggestions, open it on first arrow press.
      // This lets users re-open the dropdown without retyping.
      if (!this.isOpen && this.suggestions.length) {
        this.isOpen = true;
      }

      // Move the highlight down by 1, but don't go past the last item.
      // Math.min ensures we never exceed the array bounds.
      this.selectedIndex = Math.min(
        this.selectedIndex + 1,
        this.suggestions.length - 1
      );

      // Make sure the highlighted item is visible (scroll if needed)
      this.scrollToSelected();
      break;

    case 'ArrowUp':
      event.preventDefault();  // Same reason as ArrowDown — prevent cursor jump

      // Move the highlight up by 1, but don't go below -1.
      // -1 means "no suggestion selected" — focus is back on the input field.
      this.selectedIndex = Math.max(this.selectedIndex - 1, -1);

      if (this.selectedIndex === -1) {
        // When we go above the first suggestion, focus returns to the input.
        // The user can continue typing from where they left off.
      }

      this.scrollToSelected();
      break;

    case 'Enter':
      event.preventDefault();  // Prevent form submission (if inside a <form>)

      if (this.isOpen && this.selectedIndex >= 0) {
        // If a suggestion is highlighted, select it
        this.selectSuggestion(this.suggestions[this.selectedIndex]);
      } else if (this.currentQuery.trim()) {
        // If no suggestion is highlighted but there's text, submit the search
        this.search.emit(this.currentQuery);
        this.isOpen = false;
      }
      break;

    case 'Escape':
      // Close the dropdown and reset selection — universal "cancel" key
      this.isOpen = false;
      this.selectedIndex = -1;
      break;

    case 'Tab':
      // Tab should move focus to the next element on the page (natural browser behavior).
      // We just need to clean up our dropdown state.
      // NOTE: We do NOT call preventDefault() here — we want the default Tab behavior.
      this.isOpen = false;
      this.selectedIndex = -1;
      break;

    case 'Home':
      // Jump to the first suggestion (like pressing Home in a text editor)
      if (this.isOpen) {
        event.preventDefault();  // Prevent cursor from jumping to start of input text
        this.selectedIndex = 0;
        this.scrollToSelected();
      }
      break;

    case 'End':
      // Jump to the last suggestion
      if (this.isOpen) {
        event.preventDefault();  // Prevent cursor from jumping to end of input text
        this.selectedIndex = this.suggestions.length - 1;
        this.scrollToSelected();
      }
      break;
  }
}

// This helper ensures the currently highlighted suggestion is visible in the dropdown.
// If the user arrows down past the visible area, we need to scroll the list.
private scrollToSelected(): void {
  // requestAnimationFrame waits for the browser to finish updating the DOM
  // before we try to measure element positions. Without this, we might
  // measure stale positions from before the highlight moved.
  requestAnimationFrame(() => {
    // Get references to the scrollable container and the highlighted item
    const container = this.suggestionsContainer?.nativeElement;
    const selected = container?.querySelector('.suggestion-item--selected');

    if (selected && container) {
      // getBoundingClientRect() gives us the element's position on screen
      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();

      // If the selected item is below the visible area, scroll down
      if (selectedRect.bottom > containerRect.bottom) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      // If the selected item is above the visible area, scroll up
      else if (selectedRect.top < containerRect.top) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  });
}
```

> **Key Takeaway:** Keyboard navigation requires handling at least 7 keys (ArrowDown, ArrowUp, Enter, Escape, Tab, Home, End). The most important detail is `event.preventDefault()` — without it, the browser's default behavior (cursor movement, form submission) interferes with your custom navigation. But be careful: DON'T prevent default on Tab, or users can't leave the component.

⚠️ **Common Mistake:** Forgetting `event.preventDefault()` on ArrowDown/ArrowUp. Without it, the cursor jumps around in the input field while you're trying to navigate suggestions, creating a confusing experience.

**Common Interview Follow-up:** *"Why use `requestAnimationFrame` in `scrollToSelected`?"* — Because the DOM hasn't been updated yet when the function is called. Angular's change detection runs asynchronously, so the new `.suggestion-item--selected` class might not be applied yet. `requestAnimationFrame` waits for the next paint cycle, ensuring the DOM is up-to-date before we measure positions.

---

### 3.2 Keyboard State Machine

🔑 **Simple Explanation:**
A "state machine" is just a fancy way of saying "the component can be in one of several states, and specific actions move it between states." Think of it like a traffic light — it can be Red, Yellow, or Green, and specific events (timers) cause transitions. Here, our search bar can be CLOSED, OPEN, NAVIGATING, or SELECTED.

**Real-world analogy:** Think of an ATM. It has states: IDLE → CARD_INSERTED → PIN_ENTERED → TRANSACTION_SELECTED → DISPENSING → DONE. Each state only allows certain actions. You can't select a transaction before inserting your card. Similarly, our search bar only allows arrow navigation when the dropdown is OPEN, and only allows selection when an item is NAVIGATING (highlighted).

Drawing a state machine diagram in an interview shows the interviewer that you think about ALL possible states and transitions, not just the happy path. It also helps you identify edge cases you might otherwise miss.

```
                    ┌──────────────┐
                    │   CLOSED     │
                    │ selectedIdx  │
                    │    = -1      │
                    └──────┬───────┘
                           │
              Type 2+ chars│ or ArrowDown
                           ▼
                    ┌──────────────┐
           ┌──────▶│    OPEN      │◀──────┐
           │       │ selectedIdx  │       │
           │       │    = -1      │       │
           │       └──────┬───────┘       │
           │              │               │
           │   ArrowDown  │  ArrowUp      │
           │              ▼  (from 0)     │
           │       ┌──────────────┐       │
           │       │  NAVIGATING  │───────┘
           │       │ selectedIdx  │  ArrowUp past 0
           │       │   = 0..N-1   │
           │       └──────┬───────┘
           │              │
           │  Enter       │  Escape / Tab
           │              ▼
           │       ┌──────────────┐
           └───────│   SELECTED   │
                   │   or CLOSED  │
                   └──────────────┘
```

> **Key Takeaway:** State machines make complex UI behavior predictable. Each state has a clear set of allowed transitions. If you find yourself writing lots of nested `if/else` statements for UI logic, consider modeling it as a state machine instead. Libraries like XState formalize this pattern, but even a simple diagram like this one clarifies your thinking.

💡 **Why This Matters:** Interviewers love state machines because they show you think about ALL possible states and transitions, not just the happy path. Drawing this diagram in an interview demonstrates architectural thinking.

📝 **Quick Summary:**
- Keyboard navigation uses ArrowDown/Up for movement, Enter for selection, Escape to close
- `event.preventDefault()` is essential to stop the browser's default key behaviors
- `scrollToSelected()` uses `requestAnimationFrame` to ensure smooth scrolling after DOM updates
- The component follows a clear state machine: CLOSED → OPEN → NAVIGATING → SELECTED

---

## 4. Click Outside Detection

🔑 **Simple Explanation:**
When you open a dropdown menu on any website and click somewhere else on the page, the dropdown closes. This seems simple, but implementing it correctly is tricky. We need to listen for clicks on the *entire document*, check if the click was inside or outside our component, and close the dropdown if it was outside. We do this with a custom Angular "directive" — a reusable behavior we can attach to any element.

**Real-world analogy:** Imagine you're in a meeting room with the door open. If someone knocks on the door (click inside), you respond. If you hear a noise from the hallway (click outside), you close the door. The directive is like a security guard who monitors all activity and tells you whether it's inside or outside your room.

This is a very common utility in Angular apps — almost every dropdown, popover, tooltip, and modal needs click-outside detection. Building it as a directive means you write it once and reuse it everywhere.

---

### 4.1 HostListener Directive Pattern

**What this code does:** This directive listens for click events on the entire document. When a click happens, it checks if the click target is inside or outside the host element. If outside, it emits an event so the parent component can close its dropdown. It uses `requestAnimationFrame` to delay listening, preventing the opening click from immediately triggering a close.

```typescript
// click-outside.directive.ts
import { Directive, ElementRef, EventEmitter, HostListener,
         Output, OnDestroy, NgZone } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',  // Use as an attribute: <div appClickOutside>
  standalone: true
})
export class ClickOutsideDirective implements OnDestroy {
  // This event fires whenever the user clicks outside the host element
  @Output() appClickOutside = new EventEmitter<void>();

  // Flag to prevent catching the click that OPENED the dropdown
  // (otherwise it would immediately close)
  private listening = false;

  constructor(
    private elementRef: ElementRef,  // Reference to the DOM element this directive is on
    private ngZone: NgZone           // Angular's zone — controls change detection
  ) {
    // Wait one animation frame before starting to listen.
    // This prevents the "open click" from being caught as an "outside click."
    // Example: User clicks a button to open a menu → that same click event
    // bubbles up to the document → without this delay, we'd catch it and close immediately.
    requestAnimationFrame(() => this.listening = true);
  }

  // @HostListener('document:click') means: "listen for click events on the entire document"
  // Angular will automatically add and remove this listener for us.
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.listening) return;  // Ignore clicks during the initial frame

    // Check if the click target is inside our element
    // .contains() returns true if event.target is the element itself or any child of it
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      // The click was outside! Tell the parent component.
      // ngZone.run() ensures Angular knows about this change and updates the view.
      this.ngZone.run(() => this.appClickOutside.emit());
    }
  }

  // Also close on Escape key — a common accessibility pattern
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.appClickOutside.emit();
  }

  ngOnDestroy(): void {
    this.listening = false;  // Stop listening when the directive is destroyed
  }
}
```

> **Key Takeaway:** The `requestAnimationFrame` delay is the critical detail that makes click-outside detection work correctly. Without it, the same click that opens the dropdown would immediately close it (because the click event bubbles up to the document). This is a subtle timing issue that trips up many developers.

⚠️ **Common Mistake:** Not delaying the listener attachment with `requestAnimationFrame`. Without it, if a button click opens the dropdown and the directive starts listening immediately, the same click event bubbles up to the document and triggers the "click outside" handler — closing the dropdown the instant it opens.

**Common Interview Follow-up:** *"Why use `@HostListener` instead of `addEventListener`?"* — `@HostListener` is Angular-managed: it automatically removes the listener when the directive is destroyed, preventing memory leaks. With raw `addEventListener`, you'd need to manually call `removeEventListener` in `ngOnDestroy`. However, `@HostListener` has a performance cost (see the Renderer2 approach below).

---

### 4.2 Advanced: Renderer2-Based Approach (Zone-Optimized)

🔑 **Simple Explanation:**
The `@HostListener` approach above works great, but it has a performance cost: every click *anywhere* on the page triggers Angular's change detection (the process where Angular checks if anything changed and needs to re-render). In a big app with lots of components, this can be slow. The Renderer2 approach below listens for clicks *outside* Angular's awareness, and only notifies Angular when an actual outside click happens.

**Real-world analogy:** Imagine a factory with a quality inspector (Angular's change detection). With `@HostListener`, the inspector checks EVERY product on the conveyor belt, even the ones that are fine. With the Renderer2 approach, the inspector only checks products that a sensor flagged as potentially defective. Much more efficient.

**What this code does:** This is an optimized version of the click-outside directive. Instead of using `@HostListener` (which runs inside Angular's zone and triggers change detection on every click), it uses `Renderer2` to listen for clicks OUTSIDE Angular's zone. Only when an actual outside click is detected does it re-enter the zone to notify Angular. This means 99% of clicks on the page don't trigger unnecessary change detection.

```typescript
// For high-frequency scenarios, avoid HostListener overhead
@Directive({ selector: '[appClickOutside]', standalone: true })
export class ClickOutsideDirective implements OnInit, OnDestroy {
  @Output() appClickOutside = new EventEmitter<void>();

  // Stores the cleanup function returned by renderer.listen()
  // We call this in ngOnDestroy to remove the event listener
  private unlisten!: () => void;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,  // Angular's safe way to interact with the DOM
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // runOutsideAngular means: "do this without telling Angular about it."
    // Every document click will NOT trigger change detection — huge performance win.
    this.ngZone.runOutsideAngular(() => {
      // renderer.listen() is like addEventListener but Angular-managed.
      // It returns a function that removes the listener when called.
      this.unlisten = this.renderer.listen('document', 'click', (event: MouseEvent) => {
        if (!this.el.nativeElement.contains(event.target)) {
          // Only NOW do we re-enter Angular's zone to emit the event.
          // This means change detection only runs when there's an actual outside click,
          // not on every single click on the page.
          this.ngZone.run(() => this.appClickOutside.emit());
        }
      });
    });
  }

  ngOnDestroy(): void {
    // Remove the event listener to prevent memory leaks
    this.unlisten?.();
  }
}
```

> **Key Takeaway:** The Renderer2 + NgZone approach is the architect-level optimization. It demonstrates deep understanding of Angular's change detection mechanism. Use `@HostListener` for simple cases and the Renderer2 approach when performance matters (e.g., in a complex dashboard with many components). The key insight is: `runOutsideAngular` prevents unnecessary change detection, and `ngZone.run()` re-enters the zone only when needed.

💡 **Why This Matters:** Interviewers ask about NgZone to test your understanding of Angular's change detection. Knowing when to run code outside the zone shows you understand performance at a deep level. This is an architect-level concern — junior devs rarely think about this.

**Common Interview Follow-up:** *"What is NgZone and why does it matter?"* — NgZone is Angular's wrapper around Zone.js, which monkey-patches all async APIs (setTimeout, addEventListener, Promise, etc.) to notify Angular when async operations complete. This is how Angular knows when to run change detection. Running code outside the zone (`runOutsideAngular`) means Angular won't be notified, so change detection won't run. This is useful for high-frequency events (mousemove, scroll, document clicks) that don't need to update the UI.

📝 **Quick Summary:**
- Click-outside detection listens for document-level clicks and checks if they're inside or outside the component
- `requestAnimationFrame` delay prevents the opening click from immediately closing the dropdown
- The Renderer2 approach runs outside NgZone for better performance — change detection only fires on actual outside clicks
- Always clean up event listeners in `ngOnDestroy` to prevent memory leaks

---

## 5. Accessibility — ARIA Combobox Pattern

🔑 **Simple Explanation:**
Accessibility (often abbreviated "a11y") means making your app usable by everyone, including people who use screen readers (software that reads the screen aloud), people who can only use a keyboard, and people with low vision. For a search bar with suggestions, we follow a specific pattern called the "ARIA Combobox Pattern" — it's like a recipe from the W3C (the organization that sets web standards) that tells screen readers exactly how to interpret our custom widget.

Think of ARIA attributes as invisible labels you stick on HTML elements. A sighted user can *see* that a dropdown is open, but a blind user needs their screen reader to *announce* it. ARIA attributes are those announcements.

**Real-world analogy:** Imagine you're giving a tour of a building to someone who is blindfolded. You need to verbally describe everything: "We're entering a room with 5 doors. Door 3 is currently highlighted. Press Enter to open it." ARIA attributes are those verbal descriptions — they tell screen readers what's on screen, what's selected, and what actions are available.

Accessibility is not optional — it's a legal requirement in many countries (ADA in the US, EN 301 549 in the EU, AODA in Canada). Enterprise clients and government contracts almost always require WCAG 2.1 Level AA compliance. As an architect, you're expected to design accessible components from the start, not bolt it on later.

---

### 5.1 WAI-ARIA Combobox Roles and Properties

The search bar implements the [WAI-ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
with a listbox popup.

**What this diagram shows:** Every ARIA attribute used in the search bar, what element it goes on, and what it tells the screen reader. The attributes work together to create a complete picture for assistive technology users. Without these attributes, a screen reader would just see a text input and an unordered list — it wouldn't know they're connected or how to navigate between them.

```
┌─────────────────────────────────────────────────────────────────┐
│  ARIA Attribute Map                                             │
│                                                                 │
│  <input>                                                        │
│    role="combobox"              ← Tells screen reader: "this    │
│                                    is a combo box, not just a   │
│                                    plain text input"            │
│    aria-expanded="true|false"   ← "The dropdown is open/closed" │
│    aria-autocomplete="list"     ← "Suggestions come from a list"│
│    aria-controls="suggestions"  ← "The dropdown's ID is         │
│                                    'suggestions'" (links them)  │
│    aria-activedescendant="s-3"  ← "Item s-3 is currently        │
│                                    highlighted" (virtual focus) │
│    aria-label="Search"          ← The accessible name (what     │
│                                    screen reader announces)     │
│                                                                 │
│  <ul id="suggestions">                                          │
│    role="listbox"               ← "This is a list of options"   │
│    aria-label="Search results"  ← Describes what the list is    │
│                                                                 │
│    <li id="s-0">                                                │
│      role="option"              ← "This is one selectable item" │
│      aria-selected="false"      ← "This item is NOT selected"  │
│                                                                 │
│    <li id="s-3">                                                │
│      role="option"                                              │
│      aria-selected="true"       ← "This item IS selected"      │
│                                                                 │
│  <div aria-live="polite">       ← "Announce changes to this     │
│    "5 results available"           area, but wait for a pause   │
│                                    in speech" (live region)     │
│  </div>                                                         │
└─────────────────────────────────────────────────────────────────┘
```

> **Key Takeaway:** The ARIA combobox pattern has three essential parts: (1) The `<input>` with `role="combobox"` and `aria-activedescendant` for virtual focus, (2) The `<ul>` with `role="listbox"` containing `<li>` elements with `role="option"`, and (3) A live region (`aria-live="polite"`) that announces result counts. The `aria-activedescendant` attribute is the key innovation — it lets the input keep real DOM focus (so the user can keep typing) while the screen reader follows the virtual focus through the list.

⚠️ **Common Mistake:** Using `aria-selected` and `aria-activedescendant` interchangeably. `aria-activedescendant` on the input tells the screen reader which option has "virtual focus" (the highlight). `aria-selected` on the option tells whether it's actually selected. In a combobox, the input keeps real DOM focus while `aria-activedescendant` moves the virtual focus through the list.

**Common Interview Follow-up:** *"What's the difference between `aria-live='polite'` and `aria-live='assertive'`?"* — `polite` waits for the screen reader to finish its current announcement before reading the new content. `assertive` interrupts immediately. Use `polite` for search results (not urgent) and `assertive` for error messages or critical alerts (needs immediate attention).

---

### 5.2 Accessible Template Implementation

🔑 **Simple Explanation:**
This is the actual HTML template for the search bar. Every ARIA attribute, every `role`, every `aria-label` is here for a reason. A sighted user sees a text box with a dropdown; a screen reader user hears "Search, combo box, collapsed" and then "5 suggestions available, use arrow keys to navigate" as they interact with it.

**What this code does:** This is the complete HTML template with full accessibility support. It includes: a visually-hidden live region for screen reader announcements, a properly labeled search input with all ARIA combobox attributes, a clear button with an accessible name, a loading spinner with status role, a suggestions listbox with proper option roles, and a no-results message. Every element is annotated with its accessibility purpose.

```html
<!-- search-bar.component.html — Full accessible template -->
<div class="search-bar"
     (appClickOutside)="closeSuggestions()">
  <!-- ↑ Our custom directive: close the dropdown when clicking outside this div -->

  <!-- LIVE REGION: This invisible div is read aloud by screen readers
       whenever its content changes. "polite" means it waits for the screen
       reader to finish its current announcement before reading this.
       "atomic" means it reads the ENTIRE content, not just what changed. -->
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {{ getAnnouncement() }}
  </div>

  <!-- SEARCH INPUT WRAPPER -->
  <div class="search-bar__input-wrapper">

    <!-- This label is visually hidden (sr-only class) but screen readers
         will announce "Search" when the input is focused. Every input MUST
         have a label for accessibility. -->
    <label for="search-input" class="sr-only">Search</label>

    <!-- The search icon is decorative (not meaningful), so we hide it
         from screen readers with aria-hidden="true" and focusable="false"
         prevents it from being tab-focusable in IE/Edge. -->
    <svg class="search-bar__icon" aria-hidden="true" focusable="false">
      <use href="#icon-search"></use>
    </svg>

    <input
      id="search-input"
      type="text"
      class="search-bar__input"
      [formControl]="searchControl"          <!-- Two-way binding to our RxJS pipeline -->
      [placeholder]="placeholder"
      role="combobox"                        <!-- "I'm a combobox, not a plain input" -->
      aria-autocomplete="list"               <!-- "My suggestions come from a list" -->
      [attr.aria-expanded]="isOpen"          <!-- "The dropdown is open/closed" -->
      [attr.aria-controls]="isOpen ? 'suggestions-listbox' : null"
      <!-- ↑ Only link to the listbox when it exists in the DOM (when open) -->
      [attr.aria-activedescendant]="
        isOpen && selectedIndex >= 0 ? 'suggestion-' + selectedIndex : null
      "
      <!-- ↑ Tell screen reader which suggestion is highlighted.
           null when nothing is highlighted (selectedIndex = -1) -->
      (keydown)="onKeyDown($event)"          <!-- Our keyboard handler from Section 3 -->
      (focus)="onFocus()"                    <!-- Maybe re-open suggestions on focus -->
      autocomplete="off"                     <!-- Disable browser's built-in autocomplete -->
      spellcheck="false"                     <!-- Disable red squiggly lines under search terms -->
    />

    <!-- CLEAR BUTTON: Only shown when there's text in the input.
         aria-label provides the accessible name since the button only has an icon. -->
    <button
      *ngIf="searchControl.value"
      class="search-bar__clear"
      type="button"
      aria-label="Clear search"
      (click)="clearSearch()">
      <svg aria-hidden="true"><use href="#icon-close"></use></svg>
    </button>

    <!-- LOADING SPINNER: role="status" makes screen readers announce "Searching"
         when this element appears. -->
    <span *ngIf="isLoading"
          class="search-bar__spinner"
          role="status"
          aria-label="Searching">
    </span>
  </div>

  <!-- SUGGESTIONS DROPDOWN -->
  <ul *ngIf="isOpen && suggestions.length > 0"
      id="suggestions-listbox"
      class="search-bar__suggestions"
      role="listbox"                         <!-- "I'm a list of selectable options" -->
      aria-label="Search suggestions">       <!-- Describes what this list contains -->

    <!-- Each suggestion item -->
    <li *ngFor="let item of suggestions; let i = index; trackBy: trackById"
        [id]="'suggestion-' + i"             <!-- Unique ID so aria-activedescendant can point here -->
        class="search-bar__suggestion"
        [class.search-bar__suggestion--selected]="i === selectedIndex"
        role="option"                        <!-- "I'm one selectable option in the list" -->
        [attr.aria-selected]="i === selectedIndex"  <!-- "Am I the highlighted one?" -->
        (click)="selectSuggestion(item)"     <!-- Click to select this suggestion -->
        (mouseenter)="selectedIndex = i">    <!-- Hovering highlights this item -->

      <!-- Icon (decorative — hidden from screen readers) -->
      <span *ngIf="item.icon" class="search-bar__suggestion-icon" aria-hidden="true">
        {{ item.icon }}
      </span>

      <div class="search-bar__suggestion-text">
        <!-- Title with the search term highlighted using our custom pipe.
             innerHTML is needed because the highlight pipe returns HTML with <mark> tags. -->
        <span class="search-bar__suggestion-title"
              [innerHTML]="item.title | highlight: currentQuery">
        </span>
        <!-- Optional description text -->
        <span *ngIf="item.description" class="search-bar__suggestion-desc">
          {{ item.description }}
        </span>
      </div>

      <!-- Optional category badge (e.g., "Framework", "Library") -->
      <span *ngIf="item.category" class="search-bar__suggestion-badge">
        {{ item.category }}
      </span>
    </li>
  </ul>

  <!-- NO RESULTS MESSAGE -->
  <div *ngIf="isOpen && suggestions.length === 0 && !isLoading"
       class="search-bar__no-results"
       role="status">    <!-- role="status" makes screen readers announce this -->
    No results found for "{{ currentQuery }}"
  </div>
</div>
```

> **Key Takeaway:** Accessible templates require attention to detail. Every interactive element needs an accessible name (`aria-label` or `<label>`). Decorative elements need `aria-hidden="true"`. Dynamic state needs ARIA attributes (`aria-expanded`, `aria-selected`, `aria-activedescendant`). And status changes need live regions (`aria-live`). If you can explain each ARIA attribute's purpose in an interview, you'll stand out from 90% of candidates.

---

### 5.3 Screen Reader Announcement Helper

🔑 **Simple Explanation:**
This function generates the text that screen readers will announce. It's connected to the `aria-live="polite"` region in the template. Whenever the search state changes, this function returns a new string, and the screen reader reads it aloud. It's like having a narrator describe what's happening on screen.

**Real-world analogy:** Think of a sports commentator. They don't describe every single thing happening on the field — they announce important events: "Goal scored!", "Player substitution", "5 minutes remaining." Similarly, this function only announces meaningful state changes: results loaded, no results found, or searching in progress.

**What this code does:** This function checks the current state of the search bar and returns an appropriate announcement string. The string is rendered inside an `aria-live="polite"` region, which causes screen readers to read it aloud. It handles three states: loading, results available, and no results found.

```typescript
// This function generates text for the aria-live region.
// Screen readers will announce this text whenever it changes.
getAnnouncement(): string {
  // While searching, announce that we're loading
  if (this.isLoading) {
    return 'Searching...';
  }
  // When results arrive, announce how many and how to navigate
  if (this.isOpen && this.suggestions.length > 0) {
    return `${this.suggestions.length} suggestion${
      this.suggestions.length === 1 ? '' : 's'  // "1 suggestion" vs "5 suggestions"
    } available. Use arrow keys to navigate.`;
  }
  // When no results found, announce that clearly
  if (this.isOpen && this.suggestions.length === 0 && this.currentQuery.length >= this.minChars) {
    return 'No results found.';
  }
  // Default: say nothing (empty string = no announcement)
  return '';
}
```

> **Key Takeaway:** Live regions are the bridge between visual UI changes and screen reader announcements. Without them, a screen reader user would have no idea that search results appeared or disappeared. The function should be concise and informative — announce what changed and what the user can do next ("Use arrow keys to navigate").

💡 **Why This Matters:** Accessibility is not optional — it's a legal requirement in many countries (ADA in the US, EN 301 549 in the EU). Interviewers ask about ARIA to see if you build inclusive products. Knowing the combobox pattern specifically shows deep expertise.

**Common Interview Follow-up:** *"How do you test accessibility?"* — Three levels: (1) Automated tools like axe-core or Lighthouse catch ~30% of issues (missing labels, color contrast, etc.). (2) Manual keyboard testing catches navigation issues. (3) Screen reader testing with NVDA (Windows), VoiceOver (Mac), or JAWS catches announcement and focus management issues. All three are needed — no single tool catches everything.

📝 **Quick Summary:**
- The search bar implements the WAI-ARIA Combobox Pattern with `role="combobox"`, `role="listbox"`, and `role="option"`
- `aria-activedescendant` creates "virtual focus" — the input keeps real focus while the highlight moves through suggestions
- A live region (`aria-live="polite"`) announces result counts and status changes to screen readers
- Every interactive element needs an accessible name (via `aria-label` or a `<label>` element)

---

## 6. Performance Optimizations

🔑 **Simple Explanation:**
Performance optimization is about making your components fast and efficient. Think of it like tuning a car engine — you want maximum speed with minimum fuel consumption. In Angular, the biggest performance costs are: (1) unnecessary re-renders (Angular checking components that haven't changed), (2) unnecessary DOM operations (creating/destroying HTML elements), and (3) unnecessary computations (recalculating things that haven't changed).

**Real-world analogy:** Think of a restaurant kitchen during dinner rush. An inefficient kitchen recooks every dish from scratch every time a new order comes in. An efficient kitchen only cooks what's new, reuses prep work, and doesn't waste time checking dishes that are already done. Angular performance optimization follows the same principles: don't redo work that's already done, don't check things that haven't changed, and don't create things you don't need.

This section covers four key optimization techniques that every Angular architect should know. Each one addresses a different type of waste.

---

### 6.1 OnPush Change Detection

🔑 **Simple Explanation:**
By default, every time *anything* happens in your app (a click, a timer, an HTTP response), Angular checks *every single component* to see if it needs to update. This is like a teacher checking every student's homework every 5 minutes, even if most students haven't changed anything. `OnPush` tells Angular: "Only check this component when its inputs change or an event fires inside it." This is like the teacher saying "Only show me your homework when you've actually changed something."

**What this code does:** By adding `changeDetection: ChangeDetectionStrategy.OnPush` to the component decorator, we tell Angular to skip this component during change detection unless one of four specific things happens. This can dramatically reduce the number of checks Angular performs, especially in large component trees.

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent {
  // With OnPush, Angular only checks this component when:
  //
  // 1. An @Input reference changes (parent passes new data)
  //    → The parent passes a new array/object reference (not just mutating the existing one)
  //
  // 2. An event handler fires within the component (user clicks, types, etc.)
  //    → Any (click), (keydown), (input) etc. bound in the template
  //
  // 3. An Observable bound via async pipe emits a new value
  //    → {{ someObservable$ | async }} in the template
  //
  // 4. You manually call markForCheck() or detectChanges()
  //    → For edge cases where Angular can't detect the change automatically
  //
  // Everything else is IGNORED — huge performance win in large apps.
  // In a dashboard with 50 components, only the 2-3 that actually changed get checked.
}
```

> **Key Takeaway:** `OnPush` is the single biggest performance win in Angular. It should be the DEFAULT for all components in a production app. The only gotcha is that you must use immutable data patterns — if you mutate an array instead of creating a new one, Angular won't detect the change. This is why `OnPush` pairs perfectly with NgRx/signals and immutable state management.

**Common Interview Follow-up:** *"What happens if you mutate an array with OnPush?"* — Nothing. Angular won't detect the change because the array REFERENCE is the same (even though the contents changed). You must create a new array: `this.items = [...this.items, newItem]` instead of `this.items.push(newItem)`. This is the most common OnPush pitfall.

---

### 6.2 trackBy for Suggestion List

🔑 **Simple Explanation:**
When Angular renders a list with `*ngFor`, it needs to know which items are "the same" between updates. Without `trackBy`, Angular assumes the entire list is new every time and destroys ALL the old `<li>` elements and creates new ones from scratch. With `trackBy`, Angular can match old items to new items by their ID and just update what changed. It's like a hotel — without trackBy, every guest checks out and new guests check in every day. With trackBy, returning guests keep their room.

**What this code does:** The `trackById` function tells Angular how to identify list items across re-renders. Instead of comparing object references (which change every time the API returns new data), Angular compares the `id` property. If an item with `id="1"` existed before and still exists after the update, Angular reuses its DOM node instead of destroying and recreating it.

```typescript
// This function tells Angular: "Two items are the same if they have the same id"
// So if the list updates but item with id="1" is still there, Angular reuses its DOM node.
trackById(index: number, item: SearchItem): string {
  return item.id;   // Stable identity — DOM nodes are reused instead of recreated
}
```

Without `trackBy`, Angular destroys and recreates every `<li>` on each new result set.
With `trackBy`, only changed items are updated — critical for 60fps scrolling.

> **Key Takeaway:** Always use `trackBy` with `*ngFor` when rendering lists of objects. The performance difference is negligible for 5 items but massive for 100+ items. The function should return a stable, unique identifier (like a database ID), NOT the array index (which changes when items are reordered).

**Common Interview Follow-up:** *"Why not use the array index as the trackBy value?"* — Because the index changes when items are added, removed, or reordered. If you insert an item at position 0, every other item's index shifts by 1, and Angular thinks they're all different items — defeating the purpose of trackBy. Always use a stable ID from your data model.

---

### 6.3 Pure Highlight Pipe

🔑 **Simple Explanation:**
A "pipe" in Angular transforms data for display (like formatting a date or highlighting text). A "pure" pipe is one that Angular caches — if you call it with the same inputs twice, it returns the cached result instead of recalculating. Since our highlight pipe takes a title string and a query string, and both are simple strings (primitives), Angular can easily check "are these the same as last time?" and skip the work.

**Real-world analogy:** Think of a calculator with a memory function. If you ask it "what's 15 × 23?" and it already calculated that answer, it just recalls it from memory instead of multiplying again. A pure pipe works the same way — same inputs, same output, no recalculation.

**What this code does:** This pipe takes a text string and a search query, and wraps every occurrence of the query within the text in `<mark>` tags for visual highlighting. Being `pure: true` means Angular caches the result — if the same title and query are passed again, the pipe returns the cached HTML without re-running the regex.

```typescript
// highlight.pipe.ts — Pure pipe for search term highlighting
@Pipe({
  name: 'highlight',
  standalone: true,
  pure: true          // ← KEY: Angular caches the result for the same inputs.
                      //   If item.title="Angular" and query="ang" haven't changed,
                      //   Angular reuses the previous result without re-running transform().
})
export class HighlightPipe implements PipeTransform {
  transform(text: string, query: string): string {
    // If there's no query or no text, return the text unchanged.
    // This is a guard clause — handle edge cases first, then do the real work.
    if (!query || !text) return text;

    // Escape special regex characters in the query.
    // Without this, a query like "c++" would break the regex because + is a special character.
    // The replace function finds any special regex character and puts a backslash before it.
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create a case-insensitive regex that matches the query anywhere in the text.
    // The 'gi' flags mean: g = find ALL matches (not just the first), i = case-insensitive.
    // The parentheses create a "capture group" so we can reference the matched text in the replacement.
    const regex = new RegExp(`(${escaped})`, 'gi');

    // Wrap each match in a <mark> tag for visual highlighting.
    // $1 refers to the first capture group (the matched text), preserving the original casing.
    // Example: text="Angular Material", query="ang" → "A<mark>ng</mark>ular Material"
    // Wait, actually: "ang" matches "Ang" (case-insensitive), so → "<mark>Ang</mark>ular Material"
    return text.replace(regex, '<mark>$1</mark>');
  }
}
```

A `pure: true` pipe only re-executes when its input reference changes.
Since `item.title` and `currentQuery` are primitives (strings), Angular's identity check
is sufficient — no unnecessary re-computation during change detection cycles.

> **Key Takeaway:** Pure pipes are Angular's built-in memoization. They're perfect for transformations that depend only on their inputs (no external state). The highlight pipe is a textbook example: same title + same query = same highlighted HTML. If you need a pipe that depends on external mutable state (like the current locale from a service), you'd need an impure pipe — but try to avoid them.

⚠️ **Common Mistake:** Making a pipe `pure: false` (impure) "just to be safe." Impure pipes run on *every* change detection cycle, which can be dozens of times per second. Only use impure pipes when you absolutely must (e.g., a pipe that depends on external mutable state).

---

### 6.4 Virtual Scrolling for Large Result Sets

🔑 **Simple Explanation:**
Imagine you have a phone book with 10,000 names. You wouldn't print all 10,000 on a single page — you'd only show the ones visible through a window, and swap them out as you scroll. That's exactly what virtual scrolling does. Instead of creating 10,000 DOM elements (which would freeze the browser), it only creates ~10 elements — the ones currently visible — and recycles them as you scroll. The Angular CDK (Component Dev Kit) provides this out of the box.

**Real-world analogy:** Think of a train with windows. As the train moves through a city, you see different buildings through the window. But the window itself doesn't change — only what's visible through it changes. Virtual scrolling works the same way: the "window" (viewport) stays the same size, but the content scrolling through it changes. The buildings you've passed aren't destroyed — they're just not rendered until you scroll back.

**What this code does:** Instead of using `*ngFor` to render ALL items (which creates one DOM node per item), we use `cdk-virtual-scroll-viewport` from Angular CDK. This component only renders the items currently visible in the viewport, plus a small buffer above and below. As the user scrolls, items entering the viewport are created and items leaving are recycled. The `itemSize` tells the viewport how tall each item is, so it can calculate which items are visible at any scroll position.

```typescript
// For suggestion lists exceeding ~100 items, use CDK virtual scroll
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [ScrollingModule],
  template: `
    <!-- cdk-virtual-scroll-viewport is the "window" that shows a slice of the list.
         itemSize="48" means each item is 48 pixels tall — needed to calculate
         which items are visible at any scroll position. -->
    <cdk-virtual-scroll-viewport
      itemSize="48"
      class="search-bar__suggestions"
      role="listbox">

      <!-- *cdkVirtualFor replaces *ngFor — it only renders visible items.
           trackBy works the same way as with regular *ngFor. -->
      <li *cdkVirtualFor="let item of suggestions; trackBy: trackById"
          role="option"
          class="search-bar__suggestion">
        {{ item.title }}
      </li>
    </cdk-virtual-scroll-viewport>
  `
})
```

Virtual scrolling renders only visible items (~10-15 DOM nodes) regardless of
list size. For a list of 10,000 items at 48px height, only ~8 items are in the
DOM at any time.

```
Without Virtual Scroll:          With Virtual Scroll:
┌──────────────────┐             ┌──────────────────┐
│ Item 1           │             │                  │ ← buffer (2 items)
│ Item 2           │             │ Item 45          │ ← visible
│ Item 3           │             │ Item 46          │ ← visible
│ ...              │             │ Item 47          │ ← visible
│ Item 9,998       │             │ Item 48          │ ← visible
│ Item 9,999       │             │ Item 49          │ ← visible
│ Item 10,000      │             │                  │ ← buffer (2 items)
└──────────────────┘             └──────────────────┘
  10,000 DOM nodes                  ~9 DOM nodes
  ~400ms render                     ~2ms render
```

> **Key Takeaway:** Virtual scrolling is the nuclear option for list performance. You don't need it for 10 items, but you absolutely need it for 1,000+. The key requirement is that all items must have a known, fixed height (`itemSize`). If items have variable heights, you'll need `autosize` virtual scrolling (more complex). For a search autocomplete, you typically don't need virtual scrolling (results are capped at 10-20), but it's essential for data tables and long lists.

💡 **Why This Matters:** Performance questions are a staple of architect interviews. Interviewers want to see that you know multiple optimization techniques (OnPush, trackBy, pure pipes, virtual scrolling) and understand *when* to apply each one. You don't need virtual scrolling for 10 items, but you absolutely need it for 10,000.

**Common Interview Follow-up:** *"What are the limitations of virtual scrolling?"* — (1) All items must have a known height (or you need autosize). (2) `scrollTo` by index is easy, but `scrollTo` by content requires knowing the item's position. (3) Accessibility can be tricky — screen readers may not announce items that aren't in the DOM. (4) It adds complexity — don't use it unless you actually have performance problems.

📝 **Quick Summary:**
- `OnPush` change detection skips unnecessary checks — only re-renders when inputs change or events fire
- `trackBy` prevents Angular from destroying and recreating DOM elements when list data updates
- Pure pipes cache their results — same inputs = same output, no recalculation
- Virtual scrolling renders only visible items, turning a 10,000-item list into ~10 DOM nodes

---

# PART 2: Pagination Component

🔑 **Simple Explanation:**
Pagination is those "1 2 3 ... 20 Next" buttons you see at the bottom of search results, product listings, or data tables. It seems simple, but there's a surprising amount of complexity: How do you decide which page numbers to show? What happens when there are 500 pages? How do you handle edge cases like page 0 or page 999? How do you make it accessible to screen readers? This section covers all of that.

**Real-world analogy:** Think of a book's table of contents. If the book has 500 chapters, you don't list all 500 in the table of contents — you show the first few, the last few, and "..." in between. Pagination works the same way. The algorithm that decides which page numbers to show and where to put the "..." is the most interesting part of this component.

---

## 1. Architecture

### 1.1 Component Hierarchy

**What this diagram shows:** The pagination component follows the same Smart/Dumb pattern as the search bar. The smart `PaginationComponent` at the top orchestrates everything, while dumb child components handle individual concerns: navigation buttons (First/Prev/Next/Last), page number buttons, ellipsis indicators, page info text, and an optional page size selector.

```
PaginationComponent (Smart — Orchestrator)
│
├── NavigationButton (Dumb — First / Prev / Next / Last)
│   └── <button> with icon + aria-label
│
├── PageNumberList (Dumb — Presentation)
│   ├── PageButton (Dumb — Leaf, repeated)
│   │   └── <button> with page number
│   └── EllipsisIndicator (Dumb — Static)
│       └── <span>...</span>
│
├── PageInfo (Dumb — "Showing 1-10 of 250")
│
└── PageSizeSelector (Dumb — Optional dropdown)
    └── <select> with options
```

> **Key Takeaway:** Even a "simple" pagination component benefits from the Smart/Dumb split. The `NavigationButton` can be reused for First, Prev, Next, and Last — it's the same component with different icons and labels. The `PageButton` is reused for every page number. This reduces code duplication and makes each piece independently testable.

---

### 1.2 Input/Output API Design

🔑 **Simple Explanation:**
The pagination component is designed to be "stateless" — it doesn't track which page you're on internally. Instead, the *parent* component tells it the current page via `@Input`, and when the user clicks a page button, the pagination component fires a `@Output` event saying "the user wants to go to page 5." The parent then updates its own state and passes the new page number back down. This is called "unidirectional data flow" and it makes the component predictable and easy to debug.

**Real-world analogy:** Think of a thermostat display (pagination) vs the actual heating system (parent component). The display shows the current temperature and lets you press Up/Down buttons. But the display doesn't control the heater directly — it sends a signal to the heating system, which decides what to do. The heating system then updates the display with the new temperature. This separation means you can replace the display without touching the heating system, and vice versa.

**What this code does:** This is the complete pagination component with a rich API. It accepts inputs for current page, total items, items per page, display options, and more. It emits events when the user wants to change pages or page size. All the computed state (total pages, visible page numbers, item ranges) is recalculated whenever any input changes via `ngOnChanges`. The component is stateless — the parent owns the truth.

```typescript
// pagination.component.ts
@Component({
  selector: 'app-pagination',       // Use as: <app-pagination>
  standalone: true,                  // No NgModule needed
  imports: [CommonModule],           // For *ngIf, *ngFor, etc.
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush  // Only re-render when inputs change
})
export class PaginationComponent implements OnChanges {

  // ── Inputs (data flowing IN from parent) ────────────────
  @Input({ required: true }) currentPage!: number;   // Which page are we on? (1-based, not 0-based)
  @Input({ required: true }) totalItems!: number;     // Total number of items across all pages
  @Input() itemsPerPage = 10;                         // How many items per page (default: 10)
  @Input() maxVisiblePages = 7;                       // Max page buttons to show (default: 7)
  @Input() showFirstLast = true;                      // Show « (first) and » (last) buttons?
  @Input() showPrevNext = true;                       // Show ‹ (prev) and › (next) buttons?
  @Input() showPageInfo = true;                       // Show "Showing 1-10 of 250" text?
  @Input() showPageSize = false;                      // Show "Items per page" dropdown?
  @Input() pageSizeOptions = [10, 25, 50, 100];      // Options for the page size dropdown
  @Input() size: 'sm' | 'md' | 'lg' = 'md';          // Visual size variant (small, medium, large)
  @Input() mode: 'full' | 'compact' | 'simple' = 'full';  // Display mode (all features, minimal, bare)
  @Input() disabled = false;                          // Disable all interactions? (e.g., while loading)

  // ── Outputs (events flowing OUT to parent) ──────────────
  @Output() pageChange = new EventEmitter<number>();      // "User wants to go to page X"
  @Output() pageSizeChange = new EventEmitter<number>();  // "User changed items per page to Y"

  // ── Computed State (calculated from inputs, not set directly) ─────────────
  totalPages = 0;                        // Total number of pages (calculated from totalItems / itemsPerPage)
  visiblePages: (number | '...')[] = []; // The page numbers and ellipses to display in the UI
  startItem = 0;                         // First item number on current page (for "Showing X-Y of Z")
  endItem = 0;                           // Last item number on current page

  // Convenience getters — cleaner than writing the condition everywhere in the template
  get isFirstPage(): boolean { return this.currentPage === 1; }
  get isLastPage(): boolean { return this.currentPage === this.totalPages; }

  // ngOnChanges runs whenever ANY @Input changes.
  // This is where we recalculate all computed state.
  // We use ngOnChanges instead of ngOnInit because inputs can change at any time
  // (e.g., when the parent fetches new data and the total item count changes).
  ngOnChanges(changes: SimpleChanges): void {
    this.recalculate();
  }

  private recalculate(): void {
    // Calculate total pages: ceil(95 items / 10 per page) = 10 pages
    // Math.ceil rounds UP because a partial page still needs a full page button
    // Math.max(1, ...) ensures we always have at least 1 page (even with 0 items)
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));

    // Clamp currentPage to valid range [1, totalPages]
    // This handles cases where the parent passes an invalid page number
    // (e.g., page 15 when there are only 10 pages, or page 0, or page -1)
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));

    // Calculate "Showing X-Y of Z" values
    // Page 1 → items 1-10, Page 2 → items 11-20, Page 3 → items 21-30
    this.startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    // Don't exceed totalItems (last page might have fewer items)
    // e.g., 95 items, page 10 → items 91-95 (not 91-100)
    this.endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);

    // Generate the array of page numbers and ellipses to display
    // This is the most complex part — see Section 2 below
    this.visiblePages = this.generatePageNumbers();
  }

  goToPage(page: number): void {
    // Guard clause: ignore invalid requests
    // - page < 1: can't go before the first page
    // - page > totalPages: can't go past the last page
    // - page === currentPage: already on this page, no-op
    // - disabled: component is disabled (e.g., data is loading)
    if (page < 1 || page > this.totalPages || page === this.currentPage || this.disabled) {
      return;
    }
    // Tell the parent: "the user wants to go to this page"
    // The parent will update its state and pass the new currentPage back to us
    // This is unidirectional data flow: child emits event → parent updates state → child receives new input
    this.pageChange.emit(page);
  }

  onPageSizeChange(newSize: number): void {
    // Tell the parent: "the user changed the page size"
    // The parent should also reset to page 1 (since page numbers change with different page sizes)
    this.pageSizeChange.emit(newSize);
  }

  // trackBy function for *ngFor — helps Angular reuse DOM elements
  trackByPage(index: number, page: number | '...'): string {
    // Ellipses need unique keys based on position (there can be two of them:
    // one after page 1 and one before the last page)
    // Page numbers use the page number itself as the key
    return page === '...' ? `ellipsis-${index}` : `page-${page}`;
  }
}
```

> **Key Takeaway:** The pagination component is a textbook example of unidirectional data flow. It NEVER modifies `currentPage` internally — it always asks the parent to do it via `pageChange.emit()`. This means there's only ONE source of truth (the parent's state), which eliminates an entire class of bugs where the component and parent disagree about the current page.

⚠️ **Common Mistake:** Making the pagination component manage its own `currentPage` state internally. This creates two sources of truth (the parent's state and the component's state) which inevitably get out of sync. Always let the parent own the state.

**Common Interview Follow-up:** *"Why use `ngOnChanges` instead of setters on each `@Input`?"* — With 12 inputs, having 12 setter functions would be verbose and each would need to call `recalculate()`. `ngOnChanges` is called once per change detection cycle, even if multiple inputs change simultaneously. It's cleaner and more efficient for components with many inputs.

---

## 2. Page Number Generation Algorithm

🔑 **Simple Explanation:**
When you have 20 pages, you can't show all 20 page buttons — that would be too wide. Instead, you show a "window" of pages around the current page, with "..." (ellipsis) to indicate skipped pages. The algorithm needs to handle three scenarios: near the start (show first few pages + ... + last), in the middle (first + ... + window + ... + last), and near the end (first + ... + last few pages). This is a classic algorithm question in interviews.

**Real-world analogy:** Think of a GPS showing your route. When you're near the start, it shows the first few turns in detail and summarizes the rest as "... then 15 more turns ... then arrive." When you're in the middle, it shows "Start ... current area in detail ... End." When you're near the end, it shows "Start ... then the last few turns in detail." The pagination ellipsis algorithm works the same way — it always shows detail around where you ARE and summarizes the rest.

---

### 2.1 Ellipsis Logic — Three Scenarios

**What this diagram shows:** The three possible layouts for page numbers depending on where the current page is. The algorithm must detect which scenario applies and generate the correct array of page numbers and ellipsis markers. This is the core logic that interviewers often ask candidates to implement on a whiteboard.

```
Given: totalPages = 20, maxVisible = 7

SCENARIO A — Near Start (currentPage = 3):
  ┌───┬───┬───┬───┬───┬─────┬────┐
  │ 1 │ 2 │ 3 │ 4 │ 5 │ ... │ 20 │
  └───┴───┴───┴───┴───┴─────┴────┘
  Show first (maxVisible - 2) pages + ellipsis + last page
  Why: We're close to the start, so show the start in detail.
  The "- 2" accounts for the ellipsis slot and the last page slot.

SCENARIO B — Middle (currentPage = 10):
  ┌───┬─────┬───┬────┬────┬─────┬────┐
  │ 1 │ ... │ 9 │ 10 │ 11 │ ... │ 20 │
  └───┴─────┴───┴────┴────┴─────┴────┘
  Show first + ellipsis + window around current + ellipsis + last
  Why: We're in the middle, so show context around the current page.
  The window size is (maxVisible - 4): subtract first, last, and two ellipses.

SCENARIO C — Near End (currentPage = 18):
  ┌───┬─────┬────┬────┬────┬────┬────┐
  │ 1 │ ... │ 16 │ 17 │ 18 │ 19 │ 20 │
  └───┴─────┴────┴────┴────┴────┴────┘
  Show first + ellipsis + last (maxVisible - 2) pages
  Why: We're close to the end, so show the end in detail.
  Mirror of Scenario A.
```

> **Key Takeaway:** The ellipsis algorithm has three cases based on the current page's position relative to the total pages. The boundary between "near start" and "middle" is roughly when `currentPage > maxVisible - 3`. The boundary between "middle" and "near end" is roughly when `currentPage > totalPages - (maxVisible - 3)`. In an interview, draw these three scenarios first, then write the code — it's much easier to implement when you can see the pattern.

**Common Interview Follow-up:** *"How would you implement the `generatePageNumbers()` function?"* — Start by handling the simple case: if `totalPages <= maxVisible`, return all pages (no ellipsis needed). Then check if we're in Scenario A (near start), B (middle), or C (near end) using the boundaries above. For each scenario, build the array by concatenating the appropriate page numbers and `'...'` strings. The key insight is that `maxVisible` determines how many slots you have, and you need to allocate them between page numbers and ellipsis markers.

---

# PART 3: Shared Patterns

🔑 **Simple Explanation:**
Both the search bar and pagination components share several architectural patterns that are worth calling out explicitly. These patterns aren't specific to either component — they're general best practices that apply to any Angular component you build.

**Patterns shared by both components:**

1. **Smart/Dumb Component Split** — Both use a smart orchestrator with dumb presentational children. This is the foundation of scalable Angular architecture.

2. **OnPush Change Detection** — Both use `ChangeDetectionStrategy.OnPush` for performance. This should be your default for all components.

3. **Unidirectional Data Flow** — Both receive data via `@Input()` and emit events via `@Output()`. Neither component modifies its own inputs — the parent is always the source of truth.

4. **trackBy for Lists** — Both use `trackBy` functions with `*ngFor` to prevent unnecessary DOM recreation.

5. **Accessibility First** — Both include ARIA attributes, keyboard navigation, and screen reader support from the start, not as an afterthought.

6. **Standalone Components** — Both use `standalone: true` (Angular 15+), eliminating the need for NgModules and simplifying imports.

7. **Defensive Programming** — Both validate inputs (clamping page numbers, checking minimum characters) and handle edge cases (empty results, disabled state, error recovery).

> **Key Takeaway:** These seven patterns form a checklist for building any production-grade Angular component. If your component follows all seven, it will be performant, accessible, testable, and maintainable. Use this as a mental checklist during code reviews and interviews.

---

# Quick Summary — All Major Concepts at a Glance

This section recaps every major concept covered in this document. Use it as a quick reference before an interview or code review.

**Part 1: Search Bar with Autocomplete**

- **Component Hierarchy:** Smart/Dumb pattern — `SearchBarComponent` (smart orchestrator) coordinates `SearchInputComponent`, `SuggestionsListComponent`, and `SuggestionItemComponent` (all dumb/presentational)
- **Data Models:** Define `SearchItem`, `SearchState`, and `SearchFn` interfaces BEFORE writing component code — these are contracts between all parts of the system
- **RxJS Pipeline:** User keystrokes flow through `debounceTime` → `distinctUntilChanged` → `filter` → `switchMap` → `catchError` → `finalize` → `takeUntil` to produce search results
- **debounceTime:** Waits for a pause in typing before firing an API call — prevents hammering the server on every keystroke
- **switchMap:** Cancels the previous API call when a new query arrives — prevents race conditions and wasted bandwidth
- **catchError inside switchMap:** Recovers from individual request failures without killing the entire stream
- **takeUntil(destroy$):** Automatically unsubscribes when the component is destroyed — prevents memory leaks
- **Flattening Operators:** `switchMap` (cancel previous), `mergeMap` (run all in parallel), `concatMap` (queue sequentially), `exhaustMap` (ignore new until done)
- **Keyboard Navigation:** ArrowDown/Up to move, Enter to select, Escape to close, Tab to leave, Home/End to jump — all with `event.preventDefault()` where needed
- **State Machine:** CLOSED → OPEN → NAVIGATING → SELECTED — each state has clear allowed transitions
- **Click Outside Detection:** Listen for document clicks, check `element.contains(event.target)`, use `requestAnimationFrame` to prevent the opening click from closing the dropdown
- **Zone Optimization:** Use `NgZone.runOutsideAngular()` for high-frequency event listeners, re-enter with `ngZone.run()` only when needed
- **ARIA Combobox Pattern:** `role="combobox"` on input, `role="listbox"` on dropdown, `role="option"` on items, `aria-activedescendant` for virtual focus, `aria-live="polite"` for announcements
- **Screen Reader Announcements:** Live region announces result counts, loading state, and no-results messages
- **OnPush Change Detection:** Only re-render when `@Input` references change, events fire, async pipe emits, or `markForCheck()` is called
- **trackBy:** Tell Angular how to identify list items across re-renders — use stable IDs, not array indices
- **Pure Pipes:** Cache transformation results — same inputs = same output, no recalculation
- **Virtual Scrolling:** Render only visible items using `cdk-virtual-scroll-viewport` — turns 10,000 DOM nodes into ~10

**Part 2: Pagination Component**

- **Stateless Design:** The component doesn't own `currentPage` — the parent does. Pagination emits `pageChange` events and the parent passes the new page back via `@Input`
- **Unidirectional Data Flow:** Data flows down via `@Input()`, events flow up via `@Output()` — single source of truth in the parent
- **Input Validation:** Clamp `currentPage` to `[1, totalPages]`, ensure at least 1 page even with 0 items
- **Ellipsis Algorithm:** Three scenarios based on current page position — near start (detail + ... + last), middle (first + ... + detail + ... + last), near end (first + ... + detail)
- **ngOnChanges:** Recalculate all computed state whenever any input changes — cleaner than individual setters for components with many inputs
- **Rich API:** Configurable via 12+ inputs (page size, visible pages, display mode, size variant, disabled state) while keeping sensible defaults

**Shared Patterns (Both Components)**

- Smart/Dumb component split for testability and reusability
- `OnPush` change detection as the default for all components
- Unidirectional data flow — parent owns state, children display and emit
- `trackBy` for all `*ngFor` loops
- Accessibility (ARIA attributes, keyboard navigation, screen reader support) built in from the start
- Standalone components (Angular 15+) — no NgModules needed
- Defensive programming — validate inputs, handle edge cases, recover from errors
