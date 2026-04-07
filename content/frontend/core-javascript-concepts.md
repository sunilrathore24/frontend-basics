# Core JavaScript Concepts - Interview Guide

## Table of Contents
1. [Type Coercion & Equality](#type-coercion--equality)
2. [Scope & Hoisting](#scope--hoisting)
3. [Higher-Order Functions](#higher-order-functions)
4. [Currying & Partial Application](#currying--partial-application)
5. [Debouncing & Throttling](#debouncing--throttling)
6. [Deep vs Shallow Copy](#deep-vs-shallow-copy)
7. [Memory Management](#memory-management)
8. [Module Systems](#module-systems)
9. [Real Interview Questions](#real-interview-questions)
10. [Performance Patterns](#performance-patterns)
11. [Security Considerations](#security-considerations)
12. [Quick Reference](#quick-reference)

---

## Type Coercion & Equality

### == vs === Comparison

```javascript
// === (Strict equality) - No type coercion
// RULE: Both value AND type must be identical
// RECOMMENDED: Use === by default (predictable, no surprises)

5 === 5        // true (same value, same type: number)
5 === '5'      // false (same value, DIFFERENT types: number vs string)
null === undefined  // false (different types)
true === 1     // false (different types: boolean vs number)

// == (Loose equality) - Type coercion
// RULE: JavaScript converts (coerces) types to make them comparable
// DANGER: Can lead to unexpected results, hard-to-find bugs
// AVOID: Unless you specifically need type coercion

5 == '5'       // true 
// How: '5' (string) is coerced to 5 (number), then 5 == 5 → true

null == undefined  // true (special case: they're considered equal)
// This is the ONLY case where == might be useful: checking for null/undefined

0 == false     // true
// How: false is coerced to 0 (number), then 0 == 0 → true

'' == false    // true
// How: '' (empty string) is coerced to 0, false to 0, then 0 == 0 → true

[] == false    // true (SURPRISING!)
// How: [] is coerced to '' (empty string), then '' to 0, false to 0 → true

// BEST PRACTICE: Always use === unless you have a specific reason
// Only use == when checking for null/undefined: if (value == null)
```

### Implicit Coercion Rules

```javascript
// String coercion
'5' + 3        // '53' (number to string)
'5' - 3        // 2 (string to number)
'5' * '2'      // 10 (both to numbers)

// Boolean coercion
if ('hello') {} // true (non-empty string)
if ('') {}      // false (empty string)
if (0) {}       // false
if ([]) {}      // true (empty array is truthy!)
if ({}) {}      // true (empty object is truthy!)

// Falsy values: false, 0, '', null, undefined, NaN
// Everything else is truthy

// Object to primitive
const obj = {
  valueOf() { return 42; },
  toString() { return 'hello'; }
};

obj + 1        // 43 (valueOf called)
String(obj)    // 'hello' (toString called)
```

### Tricky Comparison Scenarios

```javascript
// Array comparisons
[] == []       // false (different references)
[] == ![]      // true (![] is false, [] coerces to '')

// NaN
NaN === NaN    // false (NaN is not equal to itself!)
Object.is(NaN, NaN)  // true

// null and undefined
null == undefined   // true
null === undefined  // false

// Object comparison
{} == {}       // false (different references)
{} === {}      // false

// Type coercion chain
'0' == false   // true
'0' === false  // false
0 == false     // true
0 === false    // false
```

### Type Conversion Algorithms

```javascript
// ToPrimitive algorithm
const obj = {
  valueOf() { return 10; },
  toString() { return '20'; }
};

// Numeric context - valueOf first
+obj           // 10
obj - 5        // 5

// String context - toString first
String(obj)    // '20'
`${obj}`       // '20'

// Default context - valueOf first (usually)
obj + ''       // '10'
```

---

## Scope & Hoisting

### var, let, const Differences

```javascript
// var - function scoped, hoisted
console.log(x); // undefined (hoisted)
var x = 5;

// let - block scoped, TDZ
console.log(y); // ReferenceError (TDZ)
let y = 10;

// const - block scoped, TDZ, immutable binding
const z = 15;
z = 20; // TypeError

// Block scope
if (true) {
  var a = 1;
  let b = 2;
  const c = 3;
}
console.log(a); // 1 (var leaks out)
console.log(b); // ReferenceError
console.log(c); // ReferenceError
```

### Temporal Dead Zone (TDZ)

```javascript
// TDZ for let/const
{
  // TDZ starts
  console.log(x); // ReferenceError
  let x = 5; // TDZ ends
  console.log(x); // 5
}

// typeof in TDZ
typeof undeclaredVar; // 'undefined'
typeof declaredLet;   // ReferenceError (TDZ)
let declaredLet;
```

### Function vs Block Scope

```javascript
// Function scope
function test() {
  if (true) {
    var x = 1;
  }
  console.log(x); // 1 (var is function-scoped)
}

// Block scope
function test2() {
  if (true) {
    let y = 2;
  }
  console.log(y); // ReferenceError (let is block-scoped)
}

// Loop scope issue with var
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (var is shared)

// Fixed with let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 (let creates new binding per iteration)
```

---

## Higher-Order Functions

### Implementing map from Scratch

```javascript
Array.prototype.myMap = function(callback, thisArg) {
  const result = [];
  
  for (let i = 0; i < this.length; i++) {
    if (i in this) { // Skip holes in sparse arrays
      result[i] = callback.call(thisArg, this[i], i, this);
    }
  }
  
  return result;
};

// Test
[1, 2, 3].myMap(x => x * 2); // [2, 4, 6]
```

### Implementing reduce from Scratch

```javascript
Array.prototype.myReduce = function(callback, initialValue) {
  let accumulator = initialValue;
  let startIndex = 0;
  
  // If no initial value, use first element
  if (accumulator === undefined) {
    accumulator = this[0];
    startIndex = 1;
  }
  
  for (let i = startIndex; i < this.length; i++) {
    if (i in this) {
      accumulator = callback(accumulator, this[i], i, this);
    }
  }
  
  return accumulator;
};

// Test
[1, 2, 3, 4].myReduce((acc, val) => acc + val, 0); // 10
```

### Implementing filter from Scratch

```javascript
Array.prototype.myFilter = function(callback, thisArg) {
  const result = [];
  
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback.call(thisArg, this[i], i, this)) {
      result.push(this[i]);
    }
  }
  
  return result;
};

// Test
[1, 2, 3, 4, 5].myFilter(x => x % 2 === 0); // [2, 4]
```

---

## Currying & Partial Application

### Currying Implementation

```javascript
// Basic curry implementation
//
// CURRYING: Transform a function that takes multiple arguments
// into a sequence of functions that each take a single argument
//
// EXAMPLE: add(1, 2, 3) becomes add(1)(2)(3)
//
// WHY CURRY?
// 1. Partial application: Create specialized functions
// 2. Function composition: Easier to combine functions
// 3. Reusability: Create variations of functions
// 4. Delayed execution: Collect arguments over time

function curry(fn) {
  // Return a curried version of the function
  return function curried(...args) {
    // Check if we have enough arguments
    // fn.length = number of parameters the original function expects
    if (args.length >= fn.length) {
      // We have all arguments → execute the original function
      return fn.apply(this, args);
    }
    
    // Not enough arguments → return a function that waits for more
    return function(...nextArgs) {
      // Combine previous args with new args and try again
      return curried.apply(this, [...args, ...nextArgs]);
    };
  };
}

// Usage Example
const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

// All these work the same way:
console.log(curriedAdd(1)(2)(3));     // 6 - One arg at a time
console.log(curriedAdd(1, 2)(3));     // 6 - Two args, then one
console.log(curriedAdd(1)(2, 3));     // 6 - One arg, then two
console.log(curriedAdd(1, 2, 3));     // 6 - All args at once

// PRACTICAL EXAMPLE: Creating specialized functions
const multiply = (a, b, c) => a * b * c;
const curriedMultiply = curry(multiply);

// Create a "double" function by fixing first argument to 2
const double = curriedMultiply(2);
console.log(double(5, 3));  // 30 (2 * 5 * 3)

// Create a "triple" function by fixing first argument to 3
const triple = curriedMultiply(3);
console.log(triple(4, 2));  // 24 (3 * 4 * 2)

// EXECUTION FLOW for curriedAdd(1)(2)(3):
// Step 1: curriedAdd(1)
//   - args = [1], fn.length = 3
//   - 1 < 3, so return function waiting for more args
// Step 2: (returned function)(2)
//   - args = [1, 2], fn.length = 3
//   - 2 < 3, so return function waiting for more args
// Step 3: (returned function)(3)
//   - args = [1, 2, 3], fn.length = 3
//   - 3 >= 3, execute: add(1, 2, 3) → 6
```

### Curry with Placeholder Support

```javascript
function curryWithPlaceholder(fn, placeholder = '_') {
  return function curried(...args) {
    // Replace placeholders with actual values
    const hasPlaceholder = args.some(arg => arg === placeholder);
    
    if (args.length >= fn.length && !hasPlaceholder) {
      return fn.apply(this, args);
    }
    
    return function(...nextArgs) {
      const newArgs = args.map(arg => 
        arg === placeholder && nextArgs.length ? nextArgs.shift() : arg
      );
      return curried.apply(this, [...newArgs, ...nextArgs]);
    };
  };
}

// Usage
const add3 = (a, b, c) => a + b + c;
const curriedAdd3 = curryWithPlaceholder(add3);

console.log(curriedAdd3('_', 2)('_')(1, 3)); // 6
```

### Partial Application

```javascript
function partial(fn, ...fixedArgs) {
  return function(...remainingArgs) {
    return fn.apply(this, [...fixedArgs, ...remainingArgs]);
  };
}

// Usage
const multiply = (a, b, c) => a * b * c;
const multiplyBy2 = partial(multiply, 2);

console.log(multiplyBy2(3, 4)); // 24
```

---

## Debouncing & Throttling

### Debounce Implementation

```javascript
function debounce(func, delay) {
  // Store timeout ID in closure (persists across calls)
  let timeoutId;
  
  // Return a new function that wraps the original
  return function debounced(...args) {
    // STEP 1: Cancel any pending execution
    // If user triggers again before delay expires, reset the timer
    clearTimeout(timeoutId);
    
    // STEP 2: Schedule new execution after delay
    // This creates a "waiting period" after each call
    timeoutId = setTimeout(() => {
      // After delay expires, execute the original function
      // Use apply to preserve 'this' context and pass arguments
      func.apply(this, args);
    }, delay);
  };
  
  // HOW IT WORKS:
  // Call 1 at 0ms:   Set timer for 300ms
  // Call 2 at 50ms:  Cancel previous timer, set new timer for 350ms
  // Call 3 at 100ms: Cancel previous timer, set new timer for 400ms
  // Call 4 at 150ms: Cancel previous timer, set new timer for 450ms
  // No more calls:   Timer expires at 450ms, function executes ONCE
}

// With immediate execution option
//
// IMMEDIATE MODE: Execute on the LEADING edge (first call)
// NORMAL MODE: Execute on the TRAILING edge (after delay)
function debounceImmediate(func, delay, immediate = false) {
  let timeoutId;
  
  return function debounced(...args) {
    // Determine if we should call immediately
    // callNow is true only if:
    // 1. immediate flag is true AND
    // 2. No timeout is currently pending (first call in a burst)
    const callNow = immediate && !timeoutId;
    
    // Clear any existing timeout
    clearTimeout(timeoutId);
    
    // Set new timeout
    timeoutId = setTimeout(() => {
      timeoutId = null;  // Clear timeout ID
      
      // If NOT immediate mode, execute now (trailing edge)
      if (!immediate) {
        func.apply(this, args);
      }
    }, delay);
    
    // If immediate mode and first call, execute now (leading edge)
    if (callNow) {
      func.apply(this, args);
    }
  };
}

// Usage Example: Search API
const searchAPI = debounce((query) => {
  console.log('Searching for:', query);
  // Make expensive API call here
}, 300);

// User types: "hello"
searchAPI('h');      // Schedules call for 300ms from now
searchAPI('he');     // Cancels previous, schedules for 300ms from now
searchAPI('hel');    // Cancels previous, schedules for 300ms from now
searchAPI('hell');   // Cancels previous, schedules for 300ms from now
searchAPI('hello');  // Cancels previous, schedules for 300ms from now
// After 300ms of no calls: Executes ONCE with 'hello'

// RESULT: 5 keystrokes → 1 API call (saves 4 unnecessary calls!)
//
// WITHOUT DEBOUNCE: 5 keystrokes → 5 API calls
// - Wastes bandwidth
// - Overloads server
// - Results arrive out of order (race condition)
//
// WITH DEBOUNCE: 5 keystrokes → 1 API call
// - Efficient bandwidth usage
// - Reduced server load
// - Only final result matters
```

### Throttle Implementation

```javascript
function throttle(func, limit) {
  // Track throttle state in closure
  let inThrottle;    // Boolean: Are we currently in throttle period?
  let lastFunc;      // Timeout ID for trailing call
  let lastRan;       // Timestamp of last execution
  
  return function throttled(...args) {
    if (!inThrottle) {
      // NOT in throttle period → Execute immediately (leading edge)
      func.apply(this, args);
      lastRan = Date.now();  // Record execution time
      inThrottle = true;     // Enter throttle period
      
      // Exit throttle period after limit milliseconds
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      // IN throttle period → Schedule trailing call
      // Clear any previously scheduled trailing call
      clearTimeout(lastFunc);
      
      // Schedule new trailing call
      lastFunc = setTimeout(() => {
        // Only execute if enough time has passed
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
  
  // HOW IT WORKS (with 1000ms limit):
  // Time 0ms:    Call 1 → Execute immediately, enter throttle
  // Time 100ms:  Call 2 → Ignored (in throttle), schedule trailing
  // Time 200ms:  Call 3 → Ignored (in throttle), reschedule trailing
  // Time 500ms:  Call 4 → Ignored (in throttle), reschedule trailing
  // Time 1000ms: Exit throttle, trailing call executes
  // Time 1100ms: Call 5 → Execute immediately, enter throttle again
}

// Usage Example: Scroll event handler
const handleScroll = throttle(() => {
  console.log('Scroll event processed');
  // Update UI, check scroll position, etc.
}, 1000);

window.addEventListener('scroll', handleScroll);

// SCENARIO: User scrolls continuously for 10 seconds
// WITHOUT THROTTLE: ~1000 events fired (every ~10ms)
// - Browser struggles to keep up
// - UI becomes janky/unresponsive
// - Wasted CPU cycles
//
// WITH THROTTLE (1000ms): ~10 events processed
// - First event: Executes immediately
// - Events 2-N: Ignored during throttle period
// - After 1s: Next event executes
// - Smooth, responsive UI
//
// RESULT: 1000 events → 10 processed (99% reduction!)

// DEBOUNCE vs THROTTLE:
//
// DEBOUNCE: "Wait for pause"
// - Executes AFTER user stops
// - Good for: search input, resize events
// - Example: Search after user stops typing
//
// THROTTLE: "Execute at regular intervals"
// - Executes DURING activity at fixed rate
// - Good for: scroll, mouse move, drag events
// - Example: Update scroll position every second while scrolling
```

### Debounce vs Throttle Comparison

| Feature | Debounce | Throttle |
|---------|----------|----------|
| Execution | After delay of inactivity | At regular intervals |
| Use Case | Search input, resize | Scroll, mouse move |
| Behavior | Waits for pause | Executes periodically |
| Example | Type "hello" → 1 call | Scroll 10s → 10 calls (1/sec) |

---

## Deep vs Shallow Copy

### Shallow Copy Methods

```javascript
// Object.assign
const original = { a: 1, b: { c: 2 } };
const copy1 = Object.assign({}, original);
copy1.b.c = 3;
console.log(original.b.c); // 3 (nested object shared!)

// Spread operator
const copy2 = { ...original };
copy2.b.c = 4;
console.log(original.b.c); // 4 (nested object shared!)

// Array shallow copy
const arr = [1, 2, [3, 4]];
const arrCopy = [...arr];
arrCopy[2][0] = 99;
console.log(arr[2][0]); // 99 (nested array shared!)
```

### Deep Clone Implementation

```javascript
function deepClone(obj, hash = new WeakMap()) {
  // Handle primitives and null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle circular references
  if (hash.has(obj)) {
    return hash.get(obj);
  }
  
  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  // Handle RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj);
  }
  
  // Handle Array
  if (Array.isArray(obj)) {
    const arrCopy = [];
    hash.set(obj, arrCopy);
    obj.forEach((item, index) => {
      arrCopy[index] = deepClone(item, hash);
    });
    return arrCopy;
  }
  
  // Handle Object
  const objCopy = {};
  hash.set(obj, objCopy);
  
  Object.keys(obj).forEach(key => {
    objCopy[key] = deepClone(obj[key], hash);
  });
  
  return objCopy;
}

// Test with circular reference
const obj = { a: 1 };
obj.self = obj;
const cloned = deepClone(obj);
console.log(cloned.self === cloned); // true
console.log(cloned === obj); // false
```

### structuredClone (Modern Approach)

```javascript
// Native deep clone (modern browsers/Node 17+)
const original = {
  date: new Date(),
  regex: /test/gi,
  nested: { a: 1 },
  arr: [1, 2, 3]
};

const cloned = structuredClone(original);
cloned.nested.a = 99;
console.log(original.nested.a); // 1 (truly deep cloned!)

// Limitations: Cannot clone functions, symbols, DOM nodes
```

---

## Memory Management

### Garbage Collection Basics

```javascript
// Reference counting (old approach)
let obj1 = { data: 'value' }; // Reference count: 1
let obj2 = obj1;              // Reference count: 2
obj1 = null;                  // Reference count: 1
obj2 = null;                  // Reference count: 0 → GC eligible

// Mark-and-sweep (modern approach)
// GC marks reachable objects from roots, sweeps unmarked
```

### Common Memory Leaks

```javascript
// 1. Global variables
function leak() {
  leakyVar = 'I am global!'; // Forgot 'var/let/const'
}

// 2. Forgotten timers
const data = loadHugeData();
setInterval(() => {
  console.log(data); // 'data' never released!
}, 1000);

// 3. Event listeners
element.addEventListener('click', handler);
// Forgot to removeEventListener!

// 4. Closures holding references
function createLeak() {
  const hugeArray = new Array(1000000);
  return function() {
    console.log('Closure keeps hugeArray in memory');
  };
}

// 5. Detached DOM nodes
let detached = document.getElementById('node');
document.body.removeChild(detached);
// 'detached' variable still references removed node!
```

### WeakMap and WeakSet

```javascript
// WeakMap - Keys are weakly held
const weakMap = new WeakMap();
let obj = { data: 'value' };

weakMap.set(obj, 'metadata');
console.log(weakMap.get(obj)); // 'metadata'

obj = null; // Object can be garbage collected
// WeakMap entry automatically removed

// Use case: Private data
const privateData = new WeakMap();

class User {
  constructor(name) {
    privateData.set(this, { password: 'secret' });
    this.name = name;
  }
  
  getPassword() {
    return privateData.get(this).password;
  }
}

// WeakSet - Values are weakly held
const weakSet = new WeakSet();
let obj2 = { id: 1 };

weakSet.add(obj2);
console.log(weakSet.has(obj2)); // true

obj2 = null; // Object can be garbage collected
```

---

## Module Systems

### CommonJS (Node.js)

```javascript
// math.js
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

module.exports = { add, subtract };

// Or
exports.add = add;
exports.subtract = subtract;

// app.js
const math = require('./math');
console.log(math.add(2, 3)); // 5

// Or destructure
const { add, subtract } = require('./math');
```

### ES6 Modules

```javascript
// math.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

// Or default export
export default function multiply(a, b) {
  return a * b;
}

// app.js
import multiply, { add, subtract } from './math.js';
console.log(add(2, 3)); // 5
console.log(multiply(2, 3)); // 6

// Import all
import * as math from './math.js';
console.log(math.add(2, 3)); // 5
```

### Dynamic Imports

```javascript
// Lazy loading
async function loadModule() {
  const module = await import('./heavy-module.js');
  module.doSomething();
}

// Conditional loading
if (condition) {
  import('./module-a.js').then(module => {
    module.init();
  });
} else {
  import('./module-b.js').then(module => {
    module.init();
  });
}
```

### Module Differences

| Feature | CommonJS | ES6 Modules |
|---------|----------|-------------|
| Syntax | `require()` / `module.exports` | `import` / `export` |
| Loading | Synchronous | Asynchronous |
| When | Runtime | Parse time |
| Tree Shaking | No | Yes |
| Top-level await | No | Yes (ES2022) |
| Environment | Node.js | Browser & Node.js |

---

## Real Interview Questions

### Q1: Implement Debounce from Scratch

**Difficulty**: Mid  
**Companies**: All major companies

```javascript
function debounce(func, delay) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
```

### Q2: Implement Throttle from Scratch

**Difficulty**: Mid  
**Companies**: All major companies

```javascript
function throttle(func, limit) {
  let lastRan;
  let timeout;
  
  return function(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}
```

### Q3: Deep Clone with Circular References

**Difficulty**: Senior  
**Companies**: Google, Meta, Amazon

See implementation in Deep vs Shallow Copy section above.

### Q4: Curry Function with Placeholder

**Difficulty**: Senior  
**Companies**: Google, Microsoft

See implementation in Currying section above.

### Q5: Implement Array.prototype.flat

**Difficulty**: Mid  
**Companies**: Amazon, Netflix

```javascript
Array.prototype.myFlat = function(depth = 1) {
  const result = [];
  
  function flatten(arr, currentDepth) {
    for (const item of arr) {
      if (Array.isArray(item) && currentDepth < depth) {
        flatten(item, currentDepth + 1);
      } else {
        result.push(item);
      }
    }
  }
  
  flatten(this, 0);
  return result;
};

// Test
[1, [2, [3, [4]]]].myFlat(2); // [1, 2, 3, [4]]
```

### Q6: Memoization Utility

**Difficulty**: Mid  
**Companies**: All major companies

```javascript
function memoize(fn) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Usage
const fibonacci = memoize(function(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(40)); // Fast!
```

### Q7: Event Emitter/Pub-Sub Pattern

**Difficulty**: Mid-Senior  
**Companies**: Netflix, Atlassian

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
  
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      callback(...args);
    });
  }
  
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

// Usage
const emitter = new EventEmitter();

const unsubscribe = emitter.on('data', (data) => {
  console.log('Received:', data);
});

emitter.emit('data', { value: 42 }); // Received: { value: 42 }
unsubscribe();
emitter.emit('data', { value: 99 }); // Nothing happens
```

### Q8: Simple Promise Implementation

**Difficulty**: Senior  
**Companies**: Google, Meta

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.handlers = [];
    
    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }
  
  resolve(value) {
    if (this.state !== 'pending') return;
    
    this.state = 'fulfilled';
    this.value = value;
    this.handlers.forEach(handler => handler.onFulfilled(value));
  }
  
  reject(reason) {
    if (this.state !== 'pending') return;
    
    this.state = 'rejected';
    this.value = reason;
    this.handlers.forEach(handler => handler.onRejected(reason));
  }
  
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handler = {
        onFulfilled: (value) => {
          if (!onFulfilled) {
            resolve(value);
            return;
          }
          try {
            resolve(onFulfilled(value));
          } catch (error) {
            reject(error);
          }
        },
        onRejected: (reason) => {
          if (!onRejected) {
            reject(reason);
            return;
          }
          try {
            resolve(onRejected(reason));
          } catch (error) {
            reject(error);
          }
        }
      };
      
      if (this.state === 'fulfilled') {
        handler.onFulfilled(this.value);
      } else if (this.state === 'rejected') {
        handler.onRejected(this.value);
      } else {
        this.handlers.push(handler);
      }
    });
  }
  
  catch(onRejected) {
    return this.then(null, onRejected);
  }
}
```

### Q9: Function Composition Utility

**Difficulty**: Mid  
**Companies**: All major companies

```javascript
// Left to right
function pipe(...fns) {
  return function(value) {
    return fns.reduce((acc, fn) => fn(acc), value);
  };
}

// Right to left
function compose(...fns) {
  return function(value) {
    return fns.reduceRight((acc, fn) => fn(acc), value);
  };
}

// Usage
const add1 = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const pipeline = pipe(add1, double, square);
console.log(pipeline(2)); // ((2 + 1) * 2)^2 = 36

const composition = compose(square, double, add1);
console.log(composition(2)); // (2 + 1)^2 * 2 = 18
```

---

## Performance Patterns

### Lazy Evaluation

```javascript
function* lazyRange(start, end) {
  for (let i = start; i <= end; i++) {
    yield i;
  }
}

// Only computes values as needed
const range = lazyRange(1, 1000000);
console.log(range.next().value); // 1
console.log(range.next().value); // 2
```

### Memoization for Optimization

```javascript
// Expensive recursive function
function fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

console.log(fibonacci(50)); // Fast!
```

---

## Security Considerations

### XSS Prevention

```javascript
// BAD: Direct HTML insertion
element.innerHTML = userInput; // XSS vulnerability!

// GOOD: Use textContent or sanitize
element.textContent = userInput;

// Or sanitize HTML
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### Safe JSON Parsing

```javascript
// BAD: eval (NEVER use!)
const data = eval('(' + jsonString + ')'); // Code injection!

// GOOD: JSON.parse
try {
  const data = JSON.parse(jsonString);
} catch (error) {
  console.error('Invalid JSON');
}
```

### Prototype Pollution Prevention

```javascript
// Prevent prototype pollution
function safeAssign(target, source) {
  const keys = Object.keys(source);
  for (const key of keys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    target[key] = source[key];
  }
  return target;
}
```

---

## Quick Reference

### Type Checking

```javascript
typeof value
Array.isArray(value)
value instanceof Constructor
Object.prototype.toString.call(value)
```

### Common Patterns

```javascript
// Debounce: Wait for pause
debounce(fn, 300)

// Throttle: Limit frequency
throttle(fn, 1000)

// Memoize: Cache results
memoize(fn)

// Curry: Partial application
curry(fn)(a)(b)(c)

// Compose: Function pipeline
compose(f, g, h)(x)
```

---

## Further Reading

- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [JavaScript.info](https://javascript.info/)
- [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS)
- [Eloquent JavaScript](https://eloquentjavascript.net/)

---

**Interview Preparation Checklist**:
- ✅ Master type coercion and equality
- ✅ Understand scope, hoisting, and TDZ
- ✅ Implement map, reduce, filter from scratch
- ✅ Build debounce and throttle utilities
- ✅ Create deep clone with circular reference handling
- ✅ Implement curry and compose functions
- ✅ Build event emitter pattern
- ✅ Understand memory leaks and prevention
- ✅ Know module system differences
- ✅ Apply security best practices

Good luck with your interviews! 🚀
