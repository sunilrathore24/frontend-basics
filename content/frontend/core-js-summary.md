# Core JavaScript — Interview Revision Summary

> A high-level, deduplicated recap of every topic covered across core-js-1 to core-js-4. Each concept is boiled down to 2–3 lines for a fast revision. Read top-to-bottom in ~30 minutes.

---

## 1. Language Fundamentals & Types

**Data types**
Primitives (string, number, boolean, null, undefined, symbol, bigint) hold a value directly; objects hold a reference. Primitives are copied by value; objects share the same underlying reference.

**Pass-by-value vs pass-by-reference**
Passing a primitive copies its value, so the original is untouched. Passing an object copies the *reference*, so mutating properties inside a function affects the caller's object.

**var vs let vs const & TDZ**
`var` is function-scoped and hoisted as `undefined`; `let`/`const` are block-scoped and sit in a "temporal dead zone" until declared (accessing early throws). `const` prevents reassignment, not mutation of the object it points to.

**Closures**
A function "remembers" the variables of the scope where it was created, even after that outer function returns. Powers data privacy, function factories, memoization, and callbacks/event handlers keeping state.

**`this` & call / apply / bind**
`this` is decided by *how* a function is called: the object before the dot, `window`/`undefined` for plain calls, or the new instance with `new`. `call`/`apply` invoke with an explicit `this` (apply takes an args array); `bind` returns a new function permanently bound to a `this`.

**Prototypes & prototypal inheritance**
Every object has a hidden `[[Prototype]]` link; property lookups walk this chain until found or `null`. Objects inherit shared methods from their constructor's `prototype`, which is how inheritance works in JS.

**Classes & `new`**
`class` is syntactic sugar over prototypes with `constructor`, `extends`, `super`, and `static`. `new` creates an object, links its prototype, binds `this`, runs the constructor, and returns the object.

**Equality: `==` vs `===` & coercion**
`===` compares value and type with no conversion; `==` coerces types first (source of bugs), so prefer `===`. Know the truthy/falsy set — falsy values are `false, 0, '', null, undefined, NaN`; everything else is truthy.

**Spread & rest**
Spread (`...`) expands an iterable/object into elements or props (copying, merging, passing args); rest (`...`) collects remaining items into an array or object. Both are shallow.

**Hoisting & function types**
`function` declarations are fully hoisted (callable before defined); function expressions and arrow functions only hoist their variable (TDZ for `let`/`const`). Arrow functions have no own `this`, `arguments`, or `prototype`.

**Scope shadowing**
An inner variable with the same name hides (masks) an outer one within its scope. Re-declaring a `let` as `var` in a nested block is "illegal shadowing" and throws.

**Symbol**
A unique, immutable primitive used as a non-colliding object key, often for metadata or well-known behaviours. `Symbol.for()` uses a global registry so the same key returns the same symbol.

**BigInt**
Represents integers beyond `Number.MAX_SAFE_INTEGER` using the `n` suffix. Can't mix with regular numbers in math and can't be used with `Math`; use only when you need huge integer precision.

**Floating-point pitfalls**
Numbers are IEEE-754 doubles, so `0.1 + 0.2 !== 0.3`. Compare with an epsilon tolerance, and for money use integer cents, BigInt scaling, or a decimal library.

**Optional chaining & nullish coalescing**
`?.` safely reads/calls through possibly-null paths, returning `undefined` instead of throwing. `??` supplies a fallback only for `null`/`undefined` (unlike `||`, which also triggers on `0`/`''`/`false`).

**Destructuring & aliasing**
Unpack arrays/objects into variables in one line, with defaults and renaming (`{a: b}`). Great for pulling props/params cleanly and swapping values.

**Tagged template literals**
A function placed before a template string receives the string parts and interpolated values, letting you transform output. Powers libraries like styled-components and safe HTML/SQL escaping.

**Lazy evaluation**
JavaScript defers work via short-circuiting (`&&`/`||`), getters, and generators — values are computed only when needed. Enables infinite sequences and avoids wasted computation.

---

## 2. Objects, Collections & Memory

**Map & Set vs objects**
`Map` keeps insertion order, allows any key type, and has a `.size`; `Set` stores unique values. Prefer them over plain objects for frequent add/remove or non-string keys.

**WeakMap & WeakSet**
Hold keys weakly so entries vanish when the key is garbage-collected — ideal for private data and caches without leaks. Not iterable and have no `.size`.

**WeakRef & FinalizationRegistry**
`WeakRef` holds an object without preventing its collection (`.deref()` may return `undefined`). `FinalizationRegistry` runs a cleanup callback after collection — both are best-effort, non-deterministic, and rarely needed.

**Shallow vs deep copy**
Shallow copy (`spread`, `Object.assign`) duplicates only the top level; nested objects stay shared. Deep copy fully clones nested structures.

**structuredClone**
Built-in deep clone that handles Dates, Maps, Sets, and cyclic references — unlike `JSON.parse(JSON.stringify())`, which drops functions, `undefined`, and breaks on cycles. Can't clone functions or DOM nodes.

**Garbage collection (mark-and-sweep)**
The engine marks everything reachable from roots, then sweeps away the unmarked. You don't free memory manually; you just avoid keeping unwanted references.

**Memory leaks & detached DOM nodes**
Leaks come from lingering references: forgotten timers, unremoved listeners, growing caches, and closures. A "detached node" is a removed DOM element still referenced in JS — clear references and listeners to release it.

**ArrayBuffer, TypedArray & DataView**
`ArrayBuffer` is a fixed raw block of bytes; typed arrays (`Uint8Array`, etc.) are typed views over it. `DataView` reads/writes mixed types at any offset with explicit endianness.

**SharedArrayBuffer & Atomics**
`SharedArrayBuffer` shares memory across threads/workers; `Atomics` provides lock-free, race-free reads/writes plus `wait`/`notify`. Requires cross-origin isolation (COOP/COEP) for security.

**Transferable objects**
Instead of copying, `postMessage` can *transfer* ownership of buffers to a worker (zero-copy), leaving the sender's version detached. Much faster than structured cloning for large binary data.

---

## 3. Functions & Functional Programming

**Pure functions & side effects**
A pure function returns the same output for the same input and mutates nothing outside itself. Predictable and easy to test; side effects (DOM, network, globals) should be pushed to the edges.

**Higher-order functions & key array methods**
Functions that take or return other functions (`map`, `filter`, `reduce`, callbacks). `map` transforms, `filter` selects, `reduce` folds to a single value, `find`/`some`/`every` query — favour these over manual loops for clear, immutable data flow.

**Currying & partial application**
Currying turns `f(a,b,c)` into `f(a)(b)(c)`, one argument at a time. Partial application pre-fills *some* arguments now and the rest later — both aid reuse and composition.

**Memoization & cache invalidation**
Cache a function's result keyed by its arguments to skip repeat work. Manage growth with LRU eviction, TTL expiry, and parameter normalization for correct keys.

**Functional composition**
Combine small functions so one's output feeds the next (`compose`/`pipe`). Produces readable, testable data pipelines without intermediate variables.

**Higher-order components & render props**
Both are React reuse patterns: an HOC wraps a component to inject props/behaviour; render props pass a function as a child to share logic. Hooks have largely replaced both.

**Pipeline operator (proposal)**
`|>` chains function calls left-to-right (`x |> f |> g`) instead of nesting `g(f(x))`. Improves readability for data transformations; still a proposal.

---

## 4. Async & the Event Loop

**Synchronous vs asynchronous**
Sync code blocks the single thread until done; async code schedules work (timers, I/O, promises) to run later without blocking. Keeps the UI responsive.

**Event loop: micro vs macro tasks**
After each macrotask (timer, I/O, event), the loop drains the *entire* microtask queue (promises, `queueMicrotask`) before the next macrotask. Microtasks always run before the next timer, and `requestAnimationFrame` runs just before paint.

**Event loop phases (Node.js)**
Node cycles through timers → pending callbacks → poll → check (`setImmediate`) → close. `process.nextTick` and microtasks run between every phase, ahead of other queues.

**Event loop starvation**
Endlessly queuing microtasks or running long synchronous work blocks rendering and other tasks. Prevent it by chunking work with `setTimeout`/`requestIdleCallback` or offloading to workers.

**Promises & chaining**
A promise represents a future value in one of three states: pending, fulfilled, or rejected (settled once, immutably). `.then` handles success and returns a new promise for chaining; `.catch` handles errors; `.finally` always runs. Chaining flattens nested async steps and avoids "callback hell."

**Callbacks & callback hell**
The original async pattern: pass a function to run on completion. Deeply nested callbacks become unreadable ("pyramid of doom") and hard to error-handle — promises and async/await solve this.

**Promise combinators**
`Promise.all` waits for all (rejects on first failure); `race` settles on the first to finish; `allSettled` waits for all and reports each outcome; `any` resolves on first success.

**async/await & try-catch-finally**
`await` pauses the async function until the promise settles, letting you write async code like sync. Wrap awaits in `try/catch` for errors; `finally` always runs (but a `return` inside it overrides earlier returns).

**Unhandled rejections**
A rejected promise with no `.catch` fires `unhandledrejection`; in Node it can crash the process. Always attach handlers or a global listener.

**Async generators & `for await...of`**
`async function*` yields values over time; `for await...of` consumes them sequentially. Perfect for streaming paginated data or reading chunks.

**Top-level await**
ES modules can `await` at the top level without an async wrapper; the module's importers wait for it to finish. Useful for async init, but can delay the dependency graph.

**Schedulers: queueMicrotask vs setTimeout vs rAF**
`queueMicrotask` runs ASAP after current code; `setTimeout(0)` runs as a later macrotask; `requestAnimationFrame` runs right before the next paint (best for animations); `requestIdleCallback` runs during idle time (best for low-priority work).

**AbortController**
Create a `signal` and pass it to `fetch` (or listeners) to cancel in-flight requests via `controller.abort()`. Commonly combined with a timeout to abort slow calls.

**Web workers**
Run scripts on a background thread, communicating via `postMessage`; keeps heavy computation off the main thread. No DOM access; data is copied (or transferred).

**Structured concurrency (proposal)**
Groups related async tasks so they start and cancel together, and errors propagate predictably. Aims to fix scattered, hard-to-cancel promise chains.

---

## 5. Iterators & Generators

**Iteration protocols**
An *iterable* has `Symbol.iterator`; an *iterator* returns `{value, done}` from `.next()`. Implementing them makes an object usable in `for...of` and spread.

**Generators**
`function*` with `yield` produces a lazy, pausable sequence, remembering state between calls. A concise way to build iterators and model streams.

**Generator delegation (`yield*`)**
`yield*` forwards iteration to another generator/iterable, composing them cleanly. It also captures the inner generator's return value.

**Lazy vs eager evaluation in iterables**
Eager methods (array `map`/`filter`) compute everything up front; generator-based lazy pipelines compute per item on demand. Lazy saves memory/time for large or infinite sequences but adds per-step overhead.

---

## 6. Timers & Rate Limiting

**setTimeout / setInterval**
`setTimeout` runs a callback once after a delay; `setInterval` repeats it. Cancel with `clearTimeout`/`clearInterval`; delays are minimums, not guarantees.

**Debounce vs throttle**
Debounce waits until activity stops before firing (good for search input); throttle fires at most once per interval (good for scroll/resize). A combo caps wait time while still limiting frequency.

---

## 7. DOM & Events

**Event propagation**
Events travel down (capture) then up (bubble) the DOM. `stopPropagation` halts travel; `event.target` is where it started, `currentTarget` is the handler's element.

**Event delegation**
Attach one listener on a parent and use `event.target` to handle many children, thanks to bubbling. Fewer listeners, and it works for dynamically added elements.

**Custom events**
Create with `new CustomEvent('name', {detail})` and `dispatchEvent` to broadcast app-specific signals. Enables decoupled component communication.

**document, window & this**
`window` is the global browser/tab object; `document` is the page's DOM entry point. In non-strict global code `this` is `window`; inside methods it's the calling object.

**DOM vs BOM**
DOM models the page content (elements, nodes) for manipulation. BOM exposes the browser itself (`window`, `location`, `history`, `navigator`).

**innerHTML vs outerHTML vs textContent**
`innerHTML` reads/writes inner markup (XSS risk); `outerHTML` replaces the element itself too; `textContent` handles plain text safely and faster. Prefer `textContent` for untrusted data.

**Observers (Intersection / Mutation / Resize)**
`IntersectionObserver` watches element visibility (lazy-load, infinite scroll); `MutationObserver` watches DOM structure changes; `ResizeObserver` watches element size changes. All are async and cheaper than polling.

**Reflow, repaint & compositing**
Reflow recalculates layout (expensive); repaint redraws pixels without layout (cheaper); compositing combines GPU layers (cheapest, e.g. `transform`/`opacity`). Batch DOM reads then writes to avoid layout thrashing.

---

## 8. Modules

**CommonJS vs ESM**
CJS uses synchronous `require`/`module.exports` (Node legacy); ESM uses static `import`/`export`, is async, tree-shakeable, and has top-level await. ESM is the standard for browsers and modern Node.

**Tree shaking & dead-code elimination**
Bundlers drop unused exports by statically analyzing ESM imports. Write side-effect-free modules and mark them so bundlers can prune aggressively.

**Dynamic imports & code splitting**
`import()` loads a module on demand, returning a promise, so bundlers split it into a separate chunk. Enables route-based/lazy loading to shrink initial bundles.

**Module caching**
Both CJS and ESM execute a module once and cache the result; later imports reuse it. CJS caches the `exports` object; ESM caches live bindings.

**Circular dependencies**
When modules import each other, one may see the other partially initialized. ESM handles cycles via live bindings better than CJS; best avoided by restructuring.

**Bare imports & import maps**
Bare specifiers (`import x from 'lib'`) need a resolver; browsers use an `<script type="importmap">` to map names to URLs. Lets browsers run bare imports without a bundler.

**Import assertions/attributes**
`import data from './x.json' with { type: 'json' }` declares a non-JS module's type. Ensures the runtime treats/validates the module correctly and safely.

**Module federation**
Webpack feature letting separately built/deployed apps share and load each other's modules at runtime. Foundation for micro-frontends with shared dependencies.

---

## 9. Browser APIs, Networking & Storage

**Web APIs overview**
Browser-provided interfaces (DOM, Fetch, storage, geolocation, etc.) that extend JS beyond the language spec. Distinct from third-party APIs you call over HTTP.

**Cookies vs localStorage vs sessionStorage**
Cookies (~4KB) are sent with every request and can expire; `localStorage` persists until cleared; `sessionStorage` lasts only for the tab session. Web Storage stays client-side and holds more data.

**Fetch vs XMLHttpRequest**
`fetch` is a modern promise-based API for HTTP requests; XHR is the older callback/event-based one. `fetch` doesn't reject on HTTP errors — check `response.ok`.

**Fetch streaming**
`response.body` is a `ReadableStream` you can read chunk-by-chunk (via a reader or async iteration). Lets you process large responses progressively instead of waiting for the whole payload.

**JSON.parse / JSON.stringify**
`parse` turns JSON text into JS values; `stringify` does the reverse. A `reviver`/`replacer` transforms values, and `stringify` drops `undefined`/functions and can pretty-print.

**Utility browser APIs**
Clipboard API copies/reads programmatically (needs permission/secure context); Notification API shows OS notifications after permission; Web Share invokes the native share sheet; Battery/Network Info expose device state (privacy-limited).

**Web Crypto & secure randomness**
`crypto.getRandomValues()` / `crypto.randomUUID()` give cryptographically secure randomness — unlike predictable `Math.random()`. `crypto.subtle` handles hashing and encryption.

**Service workers, PWA & Cache Storage**
A service worker is a background proxy that intercepts requests to enable offline use and push. With Cache Storage it applies strategies (cache-first, network-first, stale-while-revalidate) for a PWA installable via a manifest.

**WebRTC**
Enables real-time peer-to-peer audio, video, and data via `RTCPeerConnection` and `RTCDataChannel`. Needs signaling plus STUN/TURN to establish the connection.

---

## 10. Security

**Same-origin policy & CORS**
The browser blocks cross-origin reads by default; CORS lets a server opt in via `Access-Control-Allow-*` headers. Non-simple requests trigger a preflight `OPTIONS` check first.

**XSS (Cross-Site Scripting)**
Attackers inject scripts that run in a victim's page. Prevent with output encoding, avoiding `innerHTML`/`eval`, input sanitization, and a strong CSP.

**CSRF (Cross-Site Request Forgery)**
A malicious site tricks a logged-in user's browser into sending authenticated requests. Defend with anti-CSRF tokens, `SameSite` cookies, and custom headers.

**Content Security Policy (CSP)**
An HTTP header whitelisting allowed script/style/resource sources, blocking injected/inline code. Nonces or hashes permit specific inline scripts.

**Trusted Types**
Forces dangerous DOM sinks (like `innerHTML`) to accept only typed, policy-sanitized values, killing DOM-XSS at the sink. Enabled via a CSP directive.

**Sandboxed iframes**
The `sandbox` attribute strips an iframe's capabilities (scripts, forms, same-origin) unless explicitly re-enabled with tokens. Safely embeds untrusted third-party content.

**CORP / COEP / COOP**
Cross-origin policies that control who can embed/reference your resources and isolate your browsing context. Together they enable cross-origin isolation, required for `SharedArrayBuffer`.

**Content-type sniffing**
Browsers guessing a response's type can execute a file as script. Prevent with correct `Content-Type` and `X-Content-Type-Options: nosniff`.

---

## 11. Engine Internals & Advanced

**V8 internals & JIT compilation**
JS engines interpret code, then a JIT compiler optimizes hot paths into machine code (with a baseline and optimizing tier). If assumptions break, it deoptimizes back to slower code.

**Hidden classes & inline caching**
V8 assigns "hidden classes" (shapes) to objects with the same property structure/order, and caches property lookups inline for speed. Keep object shapes consistent (initialize props in the same order) to stay fast.

**Call stack, recursion & stack overflow**
Each function call pushes a frame; too-deep recursion exceeds the limit and throws "Maximum call stack size exceeded." Convert to iteration or use trampolines for deep recursion.

**Tail-call optimization (TCO)**
A call in tail position could reuse the current stack frame, allowing unbounded recursion. Specified in ES6 but implemented almost nowhere, so simulate with loops/trampolines.

**Proxy & Reflect**
`Proxy` wraps an object to intercept operations (get, set, has…) via traps for validation, logging, or reactivity. `Reflect` provides the default operations as functions, used inside traps.

**Realms / ShadowRealm (proposal)**
A realm is an isolated global environment with its own intrinsics. `ShadowRealm` runs code in a fresh, separate global for sandboxing (no shared prototypes).

**ECMAScript execution order**
The spec defines strict left-to-right evaluation, synchronous run-to-completion, then microtasks, then macrotasks. Property enumeration follows integer-key-then-insertion order.

**Polyfills, transpilers & shims**
A polyfill implements a missing modern API in older environments; a transpiler (Babel) rewrites new syntax to older syntax; a shim adjusts existing behaviour. Use polyfills for missing runtime features.

---

## 12. Design Patterns & Architecture

**Observer pattern**
A subject maintains a list of observers and notifies them directly on state change. Tight-ish coupling since the subject knows its observers.

**Publish–subscribe**
Publishers and subscribers communicate through a central broker/event bus and never know each other. Looser coupling than observer, better for cross-module messaging.

**Dependency injection**
Provide a component's dependencies from outside (constructor, factory, or container) instead of hard-coding them. Improves testability and swappability.

**Singletons & drawbacks**
Guarantee a single shared instance globally. Convenient but act as hidden global state, complicating testing and creating tight coupling — often better replaced with DI.

**Event-driven architecture**
Components emit and react to events instead of calling each other directly (browser `CustomEvent`, Node `EventEmitter`). Scales to decoupled, asynchronous systems.

**Reactive vs imperative programming**
Imperative code describes step-by-step *how*; reactive code declares *what* and auto-updates as data streams change. Reactive shines for real-time, event-heavy UIs.

**Decorators**
`@decorator` syntax wraps/annotates classes, methods, or fields to add behaviour (logging, memoization, metadata) declaratively. A cleaner alternative to manual higher-order wrapping.

**Monkey patching**
Modifying built-in or third-party objects at runtime. Discouraged because it causes hidden conflicts and breaks on upgrades — prefer wrappers, subclasses, or composition.

---

## 13. Modern Language Features & Proposals

**Record & Tuple (proposal)**
Deeply immutable, compared-by-value versions of objects (`#{}`) and arrays (`#[]`). Enable reliable value equality and safe sharing.

**Pattern matching (proposal)**
A `match` expression that destructures and branches on data shape, with guards — more powerful and expressive than `switch`. Still early-stage.

**`Symbol.dispose` & `using`**
The `using` declaration auto-calls an object's `[Symbol.dispose]()` when it leaves scope, like RAII. Standardizes deterministic cleanup of files, locks, and connections.

**`Object.groupBy` / `Map.groupBy`**
Group an array's items into buckets keyed by a callback's return value. Replaces manual `reduce`-based grouping.

**Temporal API**
A modern, immutable date/time API fixing the flawed `Date` (mutability, poor timezone/parsing support). Provides explicit types like `PlainDate`, `ZonedDateTime`, and `Instant`.

**Intl (internationalization)**
`Intl.DateTimeFormat`/`NumberFormat` format dates, numbers, and currency per locale; `PluralRules` picks plural forms; `Segmenter` splits text into words/sentences. Built-in, locale-aware formatting without libraries.

**Precise decimal arithmetic**
Avoid float errors with integer/fixed-point math, BigInt scaling, or decimal libraries. A `Decimal` proposal aims to add native support.

**Native vs WeakMap private fields**
`#field` gives true, engine-enforced privacy scoped to the class. The older WeakMap pattern simulated privacy externally but was verbose and leak-prone.

**Custom error classes & `cause`**
Extend `Error` for typed, meaningful errors you can branch on. The `cause` option chains the original error, preserving context across layers.

---

## 14. React (Framework Concept)

**Virtual DOM & reconciliation**
React keeps a lightweight in-memory tree, diffs it against the previous one, and applies only the minimal real-DOM changes. Stable `key`s help it match list items and avoid needless re-renders.

---

*End of summary — 4 docs condensed, duplicates merged. Good luck!*
