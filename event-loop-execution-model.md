# Event Loop & Execution Model - JavaScript Interview Guide

## Table of Contents
1. [Call Stack Mechanics](#call-stack-mechanics)
2. [Event Loop Architecture](#event-loop-architecture)
3. [Microtasks vs Macrotasks](#microtasks-vs-macrotasks)
4. [Browser vs Node.js](#browser-vs-nodejs)
5. [Real Interview Questions](#real-interview-questions)
6. [Tricky Code Challenges](#tricky-code-challenges)
7. [Performance Implications](#performance-implications)
8. [Quick Reference](#quick-reference)

---

## Call Stack Mechanics

### Execution Context

Every function execution creates an execution context containing:
- **Variable Environment**: var, let, const declarations
- **Lexical Environment**: Scope chain
- **this binding**: Context object

```javascript
// Global Execution Context
let globalVar = 'global';

function outer() {
  // Outer Function Execution Context
  let outerVar = 'outer';
  
  function inner() {
    // Inner Function Execution Context
    let innerVar = 'inner';
    console.log(innerVar);  // 'inner'
    console.log(outerVar);  // 'outer' (scope chain)
    console.log(globalVar); // 'global' (scope chain)
  }
  
  inner();
}

outer();

// Call Stack visualization:
// 1. Global Context (bottom)
// 2. outer() pushed
// 3. inner() pushed
// 4. inner() popped
// 5. outer() popped
// 6. Global Context remains
```

### Hoisting Deep Dive

```javascript
// Variable hoisting with var
console.log(x); // undefined (not ReferenceError)
var x = 5;

// Equivalent to:
var x;
console.log(x); // undefined
x = 5;

// let/const - Temporal Dead Zone (TDZ)
console.log(y); // ReferenceError: Cannot access 'y' before initialization
let y = 10;

// Function hoisting
sayHello(); // Works! "Hello"
function sayHello() {
  console.log('Hello');
}

// Function expression - NOT hoisted
sayGoodbye(); // TypeError: sayGoodbye is not a function
var sayGoodbye = function() {
  console.log('Goodbye');
};

// Class hoisting - TDZ applies
const instance = new MyClass(); // ReferenceError
class MyClass {}
```

### Scope Chain

```javascript
const global = 'global';

function level1() {
  const l1 = 'level1';
  
  function level2() {
    const l2 = 'level2';
    
    function level3() {
      const l3 = 'level3';
      
      // Scope chain lookup:
      // 1. level3 scope
      // 2. level2 scope
      // 3. level1 scope
      // 4. global scope
      console.log(l3);     // Found in level3
      console.log(l2);     // Found in level2
      console.log(l1);     // Found in level1
      console.log(global); // Found in global
    }
    
    level3();
  }
  
  level2();
}

level1();
```

---

## Event Loop Architecture

### The Event Loop Phases

```
┌───────────────────────────┐
┌─>│        Call Stack         │
│  └───────────────────────────┘
│  ┌───────────────────────────┐
│  │     Microtask Queue       │
│  │  - Promise callbacks      │
│  │  - queueMicrotask         │
│  │  - MutationObserver       │
│  └───────────────────────────┘
│  ┌───────────────────────────┐
│  │     Macrotask Queue       │
│  │  - setTimeout             │
│  │  - setInterval            │
│  │  - setImmediate (Node)    │
│  │  - I/O operations         │
│  │  - UI rendering           │
│  └───────────────────────────┘
└──────────────────────────────
```

### Event Loop Flow

```javascript
// EXECUTION ORDER DEMONSTRATION
// This example shows the priority: Sync → Microtasks → Macrotasks

// STEP 1: Execute synchronous code (call stack) - HIGHEST PRIORITY
// Runs immediately, no waiting
console.log('1: Sync');

// STEP 2: Schedule macrotask (setTimeout)
// Goes to Macrotask Queue (low priority)
// Will run AFTER all microtasks complete
setTimeout(() => console.log('2: Macro'), 0);
// Note: 0ms delay doesn't mean "run immediately"
// It means "add to macrotask queue as soon as possible"

// STEP 3: Schedule microtask (Promise)
// Goes to Microtask Queue (high priority)
// Will run BEFORE any macrotasks
Promise.resolve().then(() => console.log('3: Micro'));
// Promise.resolve() creates an already-resolved promise
// .then() callback goes to microtask queue

// STEP 4: More synchronous code
// Still part of current execution, runs immediately
console.log('4: Sync');

// EXECUTION FLOW:
// 1. Call stack executes: '1: Sync', then '4: Sync'
// 2. Call stack empty → Check microtask queue
// 3. Execute microtask: '3: Micro'
// 4. Microtask queue empty → Check macrotask queue
// 5. Execute macrotask: '2: Macro'
//
// Output:
// 1: Sync
// 4: Sync
// 3: Micro (microtasks run before macrotasks)
// 2: Macro
//
// KEY INSIGHT: Even though setTimeout was scheduled first,
// the Promise callback runs first because microtasks have higher priority
```

### Rendering Pipeline

```javascript
// Browser event loop includes rendering
console.log('Start');

// Macrotask
setTimeout(() => {
  console.log('Timeout');
  document.body.style.background = 'red';
}, 0);

// Microtask
Promise.resolve().then(() => {
  console.log('Promise');
  document.body.style.background = 'blue';
});

console.log('End');

// Execution order:
// 1. Start (sync)
// 2. End (sync)
// 3. Promise (microtask) - background turns blue
// 4. [Rendering happens here]
// 5. Timeout (macrotask) - background turns red
// 6. [Rendering happens here]
```

---

## Microtasks vs Macrotasks

### What Goes Where

**Microtasks** (Higher Priority):
- Promise callbacks (`.then`, `.catch`, `.finally`)
- `queueMicrotask()`
- `MutationObserver` callbacks
- `process.nextTick()` (Node.js - even higher priority)

**Macrotasks** (Lower Priority):
- `setTimeout` / `setInterval`
- `setImmediate` (Node.js)
- I/O operations
- UI rendering
- `requestAnimationFrame`

```javascript
// Comprehensive example
console.log('1: Script start');

setTimeout(() => console.log('2: setTimeout'), 0);

Promise.resolve()
  .then(() => console.log('3: Promise 1'))
  .then(() => console.log('4: Promise 2'));

queueMicrotask(() => console.log('5: queueMicrotask'));

setTimeout(() => console.log('6: setTimeout 2'), 0);

console.log('7: Script end');

// Output:
// 1: Script start
// 7: Script end
// 3: Promise 1
// 5: queueMicrotask
// 4: Promise 2
// 2: setTimeout
// 6: setTimeout 2
```

### Execution Order with Complex Examples

```javascript
console.log('Start');

setTimeout(() => {
  console.log('Timeout 1');
  Promise.resolve().then(() => console.log('Promise in Timeout 1'));
}, 0);

Promise.resolve()
  .then(() => {
    console.log('Promise 1');
    setTimeout(() => console.log('Timeout in Promise 1'), 0);
  })
  .then(() => console.log('Promise 2'));

setTimeout(() => console.log('Timeout 2'), 0);

console.log('End');

// Output:
// Start
// End
// Promise 1
// Promise 2
// Timeout 1
// Promise in Timeout 1
// Timeout in Promise 1
// Timeout 2
```

### Priority and Starvation

```javascript
// Microtask starvation - infinite microtasks block macrotasks
function recursiveMicrotask() {
  Promise.resolve().then(() => {
    console.log('Microtask');
    recursiveMicrotask(); // Creates another microtask
  });
}

setTimeout(() => console.log('This will never run!'), 0);
recursiveMicrotask();

// Microtasks keep running, setTimeout never executes
// This is microtask starvation!

// Solution: Use setTimeout to yield to macrotasks
function recursiveWithYield() {
  setTimeout(() => {
    console.log('Macrotask');
    recursiveWithYield();
  }, 0);
}
```

---

## Browser vs Node.js

### Browser Event Loop

```javascript
// Browser-specific
console.log('1');

setTimeout(() => console.log('2: setTimeout'), 0);

requestAnimationFrame(() => console.log('3: rAF'));

Promise.resolve().then(() => console.log('4: Promise'));

console.log('5');

// Output:
// 1
// 5
// 4: Promise (microtask)
// 2: setTimeout (macrotask)
// 3: rAF (before next paint)
```

### Node.js Event Loop Phases

```javascript
// Node.js has specific phases:
// 1. Timers (setTimeout, setInterval)
// 2. Pending callbacks (I/O)
// 3. Idle, prepare
// 4. Poll (retrieve new I/O events)
// 5. Check (setImmediate)
// 6. Close callbacks

// Node.js specific
console.log('1');

setImmediate(() => console.log('2: setImmediate'));

setTimeout(() => console.log('3: setTimeout'), 0);

Promise.resolve().then(() => console.log('4: Promise'));

process.nextTick(() => console.log('5: nextTick'));

console.log('6');

// Output:
// 1
// 6
// 5: nextTick (highest priority)
// 4: Promise (microtask)
// 3: setTimeout (timer phase)
// 2: setImmediate (check phase)
```

### Key Differences

| Feature | Browser | Node.js |
|---------|---------|---------|
| `setImmediate` | ❌ Not available | ✅ Available |
| `process.nextTick` | ❌ Not available | ✅ Available (highest priority) |
| `requestAnimationFrame` | ✅ Available | ❌ Not available |
| Event loop phases | Simpler | More complex (6 phases) |
| Microtask timing | After each macrotask | After each phase |

---

## Real Interview Questions

### Question 1: Predict Output - Mixed Async Code

**Difficulty**: Mid  
**Companies**: Google, Microsoft, Amazon

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve()
  .then(() => console.log('3'))
  .then(() => console.log('4'));

console.log('5');

// What is the output?
// Answer: 1, 5, 3, 4, 2
// Explanation:
// - Sync code runs first: 1, 5
// - Microtasks (Promises) run next: 3, 4
// - Macrotasks (setTimeout) run last: 2
```

### Question 2: Complex Execution Order

**Difficulty**: Senior  
**Companies**: Meta, Netflix

```javascript
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => console.log('setTimeout'), 0);

async1();

new Promise(resolve => {
  console.log('promise1');
  resolve();
}).then(() => console.log('promise2'));

console.log('script end');

// Output:
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout

// Explanation:
// 1. Sync: script start, async1 start, async2, promise1, script end
// 2. Microtasks: async1 end (await), promise2
// 3. Macrotasks: setTimeout
```

### Question 3: Debug Infinite Microtask Loop

**Difficulty**: Senior  
**Companies**: Google, Atlassian

```javascript
// Problem: This blocks the event loop
function buggyCode() {
  Promise.resolve().then(() => {
    console.log('Processing...');
    buggyCode(); // Infinite microtasks!
  });
}

setTimeout(() => console.log('Never runs'), 0);
buggyCode();

// Solution 1: Use setTimeout to yield
function fixedCode() {
  setTimeout(() => {
    console.log('Processing...');
    fixedCode();
  }, 0);
}

// Solution 2: Add termination condition
function fixedCodeWithLimit(count = 0) {
  if (count >= 100) return;
  
  Promise.resolve().then(() => {
    console.log('Processing...', count);
    fixedCodeWithLimit(count + 1);
  });
}

// Solution 3: Batch processing
async function batchProcess(items) {
  for (let i = 0; i < items.length; i += 10) {
    const batch = items.slice(i, i + 10);
    await Promise.all(batch.map(process));
    // Yield to event loop between batches
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### Question 4: Optimize Based on Event Loop Knowledge

**Difficulty**: Senior  
**Companies**: Netflix, Amazon

```javascript
// Inefficient: Blocks rendering
function inefficientRender(items) {
  items.forEach(item => {
    const element = document.createElement('div');
    element.textContent = item;
    document.body.appendChild(element);
  });
  // All DOM updates happen at once, may freeze UI
}

// Efficient: Batch and yield
async function efficientRender(items, batchSize = 100) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    batch.forEach(item => {
      const element = document.createElement('div');
      element.textContent = item;
      document.body.appendChild(element);
    });
    
    // Yield to event loop for rendering
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// Even better: Use requestAnimationFrame
function renderWithRAF(items) {
  let index = 0;
  
  function renderBatch() {
    const batchEnd = Math.min(index + 100, items.length);
    
    while (index < batchEnd) {
      const element = document.createElement('div');
      element.textContent = items[index];
      document.body.appendChild(element);
      index++;
    }
    
    if (index < items.length) {
      requestAnimationFrame(renderBatch);
    }
  }
  
  requestAnimationFrame(renderBatch);
}
```

---

## Tricky Code Challenges

### Challenge 1: Promise vs setTimeout Order

```javascript
setTimeout(() => console.log('1'), 0);
Promise.resolve().then(() => console.log('2'));
setTimeout(() => console.log('3'), 0);
Promise.resolve().then(() => console.log('4'));

// Output: 2, 4, 1, 3
// Microtasks (2, 4) before macrotasks (1, 3)
```

### Challenge 2: Nested Promises and Timeouts

```javascript
setTimeout(() => {
  console.log('1');
  Promise.resolve().then(() => console.log('2'));
}, 0);

Promise.resolve().then(() => {
  console.log('3');
  setTimeout(() => console.log('4'), 0);
});

// Output: 3, 1, 2, 4
// Explanation:
// - Microtask queue: Promise (3)
// - After 3: setTimeout (4) scheduled
// - Macrotask queue: setTimeout (1)
// - After 1: Promise (2) runs (microtask)
// - Then: setTimeout (4)
```

### Challenge 3: Async/Await Execution

```javascript
async function test() {
  console.log('1');
  await Promise.resolve();
  console.log('2');
}

console.log('3');
test();
console.log('4');

// Output: 3, 1, 4, 2
// Explanation:
// - Sync: 3, 1 (before await), 4
// - Microtask: 2 (after await)
```

### Challenge 4: Multiple Awaits

```javascript
async function foo() {
  console.log('1');
  await Promise.resolve();
  console.log('2');
  await Promise.resolve();
  console.log('3');
}

async function bar() {
  console.log('4');
  await Promise.resolve();
  console.log('5');
}

foo();
bar();
console.log('6');

// Output: 1, 4, 6, 2, 5, 3
// Explanation:
// - Sync: 1, 4, 6
// - Microtask round 1: 2, 5
// - Microtask round 2: 3
```

### Challenge 5: Promise Constructor Execution

```javascript
new Promise((resolve) => {
  console.log('1');
  resolve();
}).then(() => console.log('2'));

console.log('3');

// Output: 1, 3, 2
// Promise constructor runs synchronously!
// Only .then() is async
```

### Challenge 6: SetTimeout with Same Delay

```javascript
setTimeout(() => console.log('1'), 0);
setTimeout(() => console.log('2'), 0);
setTimeout(() => console.log('3'), 0);

// Output: 1, 2, 3
// Scheduled in order, executed in order
```

### Challenge 7: Microtask in Microtask

```javascript
Promise.resolve().then(() => {
  console.log('1');
  Promise.resolve().then(() => console.log('2'));
});

Promise.resolve().then(() => console.log('3'));

// Output: 1, 3, 2
// Explanation:
// - Microtask queue: [Promise1, Promise3]
// - Execute Promise1: logs '1', schedules Promise2
// - Execute Promise3: logs '3'
// - Execute Promise2: logs '2'
```

### Challenge 8: Complex Nesting

```javascript
console.log('start');

setTimeout(() => {
  console.log('timeout1');
  Promise.resolve().then(() => {
    console.log('promise1');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('promise2');
  setTimeout(() => {
    console.log('timeout2');
  }, 0);
});

console.log('end');

// Output: start, end, promise2, timeout1, promise1, timeout2
```

### Challenge 9: Async Function Return

```javascript
async function test() {
  return 'value';
}

test().then(console.log);
console.log('sync');

// Output: sync, value
// async function always returns a Promise
```

### Challenge 10: QueueMicrotask

```javascript
console.log('1');

queueMicrotask(() => console.log('2'));

Promise.resolve().then(() => console.log('3'));

queueMicrotask(() => console.log('4'));

console.log('5');

// Output: 1, 5, 2, 3, 4
// queueMicrotask and Promise.then are both microtasks
// Executed in order they were queued
```

---

## Performance Implications

### Long Tasks Block UI

```javascript
// BAD: Blocks UI for 5 seconds
function blockingOperation() {
  const start = Date.now();
  while (Date.now() - start < 5000) {
    // Busy wait - blocks everything!
  }
  console.log('Done');
}

// GOOD: Break into chunks
async function nonBlockingOperation() {
  for (let i = 0; i < 50; i++) {
    // Do 100ms of work
    const start = Date.now();
    while (Date.now() - start < 100) {
      // Work
    }
    
    // Yield to event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  console.log('Done');
}
```

### Optimizing Heavy Computations

```javascript
// Process large dataset without blocking
async function processLargeDataset(data) {
  const results = [];
  const chunkSize = 1000;
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    // Process chunk
    const chunkResults = chunk.map(item => expensiveOperation(item));
    results.push(...chunkResults);
    
    // Yield to event loop every chunk
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Update progress
    const progress = ((i + chunkSize) / data.length * 100).toFixed(0);
    console.log(`Progress: ${progress}%`);
  }
  
  return results;
}
```

### Measuring Event Loop Lag

```javascript
// Detect event loop blocking
class EventLoopMonitor {
  constructor(threshold = 100) {
    this.threshold = threshold;
    this.lastCheck = Date.now();
    this.start();
  }
  
  start() {
    setInterval(() => {
      const now = Date.now();
      const lag = now - this.lastCheck - 100; // Expected 100ms
      
      if (lag > this.threshold) {
        console.warn(`Event loop lag detected: ${lag}ms`);
      }
      
      this.lastCheck = now;
    }, 100);
  }
}

const monitor = new EventLoopMonitor(50);
```

---

## Quick Reference

### Event Loop Priority (High to Low)

1. **Synchronous code** (call stack)
2. **Microtasks**
   - `process.nextTick()` (Node.js only - highest)
   - Promise callbacks
   - `queueMicrotask()`
   - `MutationObserver`
3. **Macrotasks**
   - `setTimeout` / `setInterval`
   - `setImmediate` (Node.js)
   - I/O operations
   - UI rendering

### Common Patterns

```javascript
// Defer to next microtask
Promise.resolve().then(() => {
  // Runs after current sync code
});

// Defer to next macrotask
setTimeout(() => {
  // Runs after microtasks
}, 0);

// Defer to next animation frame
requestAnimationFrame(() => {
  // Runs before next paint
});

// Yield to event loop
await new Promise(resolve => setTimeout(resolve, 0));
```

### Debugging Tips

```javascript
// Add labels to track execution
console.log('[SYNC] Start');
setTimeout(() => console.log('[MACRO] Timeout'), 0);
Promise.resolve().then(() => console.log('[MICRO] Promise'));
console.log('[SYNC] End');

// Measure timing
console.time('operation');
// ... code ...
console.timeEnd('operation');

// Track call stack
console.trace('Current call stack');
```

---

## Further Reading

- [MDN: Event Loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
- [Jake Archibald: In The Loop](https://www.youtube.com/watch?v=cCOL7MC4Pl0)
- [Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [HTML Spec: Event Loop Processing Model](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)

---

**Interview Preparation Checklist**:
- ✅ Understand call stack and execution context
- ✅ Know microtask vs macrotask differences
- ✅ Predict execution order of mixed async code
- ✅ Understand hoisting and TDZ
- ✅ Know browser vs Node.js event loop differences
- ✅ Identify and fix microtask starvation
- ✅ Optimize long-running tasks
- ✅ Understand rendering pipeline
- ✅ Debug event loop issues
- ✅ Know when to yield to event loop

Good luck with your interviews! 🚀
