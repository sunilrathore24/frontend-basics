/**
 * ============================================================================
 * EVENT LOOP & EXECUTION MODEL - TypeScript Interview Guide
 * ============================================================================
 * 
 * This file contains comprehensive examples of JavaScript event loop,
 * execution context, microtasks, macrotasks, and execution order.
 * 
 * Topics Covered:
 * 1. Call Stack Mechanics
 * 2. Event Loop Architecture
 * 3. Microtasks vs Macrotasks
 * 4. Browser vs Node.js differences
 * 5. Real Interview Questions
 * 6. Tricky Code Challenges
 * 7. Performance Implications
 * 
 * Companies: Google, Microsoft, Amazon, Meta, Netflix, Atlassian
 * ============================================================================
 */

// ============================================================================
// SECTION 1: CALL STACK MECHANICS
// ============================================================================

/**
 * Execution Context
 * 
 * Every function execution creates an execution context containing:
 * - Variable Environment: var, let, const declarations
 * - Lexical Environment: Scope chain
 * - this binding: Context object
 * 
 * CALL STACK: Stack of execution contexts
 * - Global context at bottom (always present)
 * - Function contexts pushed/popped as functions execute
 */
function demonstrateExecutionContext(): void {
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
}

/**
 * Hoisting Deep Dive
 * 
 * HOISTING: Variable and function declarations are "moved" to top of scope
 * 
 * var: Hoisted with undefined initialization
 * let/const: Hoisted but in Temporal Dead Zone (TDZ)
 * functions: Fully hoisted (declaration + definition)
 */
function demonstrateHoisting(): void {
  // var hoisting
  console.log(x); // undefined (not ReferenceError!)
  var x = 5;
  
  // Equivalent to:
  // var x;
  // console.log(x); // undefined
  // x = 5;

  // let/const - Temporal Dead Zone (TDZ)
  try {
    console.log(y); // ReferenceError: Cannot access 'y' before initialization
  } catch (e) {
    console.error('TDZ error:', e);
  }
  let y = 10;

  // Function hoisting
  sayHello(); // Works! "Hello"
  function sayHello() {
    console.log('Hello');
  }

  // Function expression - NOT hoisted
  try {
    sayGoodbye(); // TypeError: sayGoodbye is not a function
  } catch (e) {
    console.error('Function expression error:', e);
  }
  var sayGoodbye = function() {
    console.log('Goodbye');
  };
}

/**
 * Scope Chain
 * 
 * SCOPE CHAIN: Linked list of variable environments
 * When looking up a variable, JavaScript searches:
 * 1. Current scope
 * 2. Outer scope
 * 3. Outer's outer scope
 * 4. ... until global scope
 * 5. If not found: ReferenceError
 */
function demonstrateScopeChain(): void {
  const global = 'global';

  function level1() {
    const l1 = 'level1';
    
    function level2() {
      const l2 = 'level2';
      
      function level3() {
        const l3 = 'level3';
        
        // Scope chain lookup:
        // 1. level3 scope → l3 found
        // 2. level2 scope → l2 found
        // 3. level1 scope → l1 found
        // 4. global scope → global found
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
}

// ============================================================================
// SECTION 2: EVENT LOOP ARCHITECTURE
// ============================================================================

/**
 * Event Loop Flow
 * 
 * PRIORITY ORDER (High to Low):
 * 1. Synchronous code (call stack)
 * 2. Microtasks (Promise callbacks, queueMicrotask)
 * 3. Macrotasks (setTimeout, setInterval, I/O)
 * 4. Rendering (browser only)
 * 
 * RULE: Microtask queue must be EMPTY before processing next macrotask
 */
function demonstrateEventLoopFlow(): void {
  // STEP 1: Execute synchronous code (call stack) - HIGHEST PRIORITY
  console.log('1: Sync');

  // STEP 2: Schedule macrotask (setTimeout)
  // Goes to Macrotask Queue (low priority)
  setTimeout(() => console.log('2: Macro'), 0);
  // Note: 0ms doesn't mean "run immediately"
  // It means "add to macrotask queue ASAP"

  // STEP 3: Schedule microtask (Promise)
  // Goes to Microtask Queue (high priority)
  Promise.resolve().then(() => console.log('3: Micro'));
  // Promise.resolve() creates already-resolved promise
  // .then() callback goes to microtask queue

  // STEP 4: More synchronous code
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
}

/**
 * Rendering Pipeline (Browser Only)
 * 
 * BROWSER EVENT LOOP includes rendering:
 * 1. Execute script (synchronous code)
 * 2. Process microtasks
 * 3. Render (if needed)
 * 4. Process one macrotask
 * 5. Repeat from step 2
 */
function demonstrateRenderingPipeline(): void {
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
}

// ============================================================================
// SECTION 3: MICROTASKS VS MACROTASKS
// ============================================================================

/**
 * What Goes Where
 * 
 * MICROTASKS (Higher Priority):
 * - Promise callbacks (.then, .catch, .finally)
 * - queueMicrotask()
 * - MutationObserver callbacks
 * - process.nextTick() (Node.js - even higher priority)
 * 
 * MACROTASKS (Lower Priority):
 * - setTimeout / setInterval
 * - setImmediate (Node.js)
 * - I/O operations
 * - UI rendering
 * - requestAnimationFrame
 */
function demonstrateMicrotasksVsMacrotasks(): void {
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
}

/**
 * Complex Execution Order
 * 
 * This demonstrates nested microtasks and macrotasks
 */
function demonstrateComplexExecutionOrder(): void {
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
}

/**
 * Microtask Starvation
 * 
 * PROBLEM: Infinite microtasks block macrotasks
 * Microtask queue must be empty before processing macrotasks
 * If microtasks keep creating more microtasks, macrotasks never run
 */
function demonstrateMicrotaskStarvation(): void {
  // WARNING: This will block the event loop!
  // Uncomment to see the effect (not recommended)
  
  /*
  function recursiveMicrotask() {
    Promise.resolve().then(() => {
      console.log('Microtask');
      recursiveMicrotask(); // Creates another microtask
    });
  }

  setTimeout(() => console.log('This will never run!'), 0);
  recursiveMicrotask();
  */

  // SOLUTION: Use setTimeout to yield to macrotasks
  function recursiveWithYield() {
    setTimeout(() => {
      console.log('Macrotask');
      // recursiveWithYield(); // Uncomment for continuous execution
    }, 0);
  }
  
  recursiveWithYield();
}

// ============================================================================
// SECTION 4: BROWSER VS NODE.JS
// ============================================================================

/**
 * Browser Event Loop
 * 
 * PHASES:
 * 1. Execute script
 * 2. Process microtasks
 * 3. Render (if needed)
 * 4. Process one macrotask
 * 5. Repeat
 */
function demonstrateBrowserEventLoop(): void {
  console.log('1');

  setTimeout(() => console.log('2: setTimeout'), 0);

  // requestAnimationFrame is browser-specific
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => console.log('3: rAF'));
  }

  Promise.resolve().then(() => console.log('4: Promise'));

  console.log('5');

  // Output:
  // 1
  // 5
  // 4: Promise (microtask)
  // 2: setTimeout (macrotask)
  // 3: rAF (before next paint)
}

/**
 * Node.js Event Loop Phases
 * 
 * NODE.JS HAS 6 PHASES:
 * 1. Timers (setTimeout, setInterval)
 * 2. Pending callbacks (I/O)
 * 3. Idle, prepare (internal)
 * 4. Poll (retrieve new I/O events)
 * 5. Check (setImmediate)
 * 6. Close callbacks
 * 
 * Microtasks run AFTER EACH PHASE
 */
function demonstrateNodeEventLoop(): void {
  console.log('1');

  // setImmediate is Node.js-specific
  if (typeof setImmediate !== 'undefined') {
    setImmediate(() => console.log('2: setImmediate'));
  }

  setTimeout(() => console.log('3: setTimeout'), 0);

  Promise.resolve().then(() => console.log('4: Promise'));

  // process.nextTick is Node.js-specific (highest priority)
  if (typeof process !== 'undefined' && process.nextTick) {
    process.nextTick(() => console.log('5: nextTick'));
  }

  console.log('6');

  // Output (Node.js):
  // 1
  // 6
  // 5: nextTick (highest priority)
  // 4: Promise (microtask)
  // 3: setTimeout (timer phase)
  // 2: setImmediate (check phase)
}

// ============================================================================
// SECTION 5: REAL INTERVIEW QUESTIONS
// ============================================================================

/**
 * INTERVIEW QUESTION 1: Predict Output - Mixed Async Code
 * 
 * Difficulty: Mid
 * Companies: Google, Microsoft, Amazon
 */
function interviewQuestion1(): void {
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
}

/**
 * INTERVIEW QUESTION 2: Complex Execution Order
 * 
 * Difficulty: Senior
 * Companies: Meta, Netflix
 */
async function interviewQuestion2(): Promise<void> {
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
    resolve(undefined);
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
}

/**
 * INTERVIEW QUESTION 3: Debug Infinite Microtask Loop
 * 
 * Difficulty: Senior
 * Companies: Google, Atlassian
 */
function interviewQuestion3(): void {
  // PROBLEM: This blocks the event loop
  /*
  function buggyCode() {
    Promise.resolve().then(() => {
      console.log('Processing...');
      buggyCode(); // Infinite microtasks!
    });
  }

  setTimeout(() => console.log('Never runs'), 0);
  buggyCode();
  */

  // SOLUTION 1: Use setTimeout to yield
  function fixedCode() {
    setTimeout(() => {
      console.log('Processing...');
      // fixedCode(); // Uncomment for continuous execution
    }, 0);
  }
  
  fixedCode();

  // SOLUTION 2: Add termination condition
  function fixedCodeWithLimit(count: number = 0): void {
    if (count >= 100) return;
    
    Promise.resolve().then(() => {
      console.log('Processing...', count);
      fixedCodeWithLimit(count + 1);
    });
  }
  
  fixedCodeWithLimit();
}

// ============================================================================
// SECTION 6: TRICKY CODE CHALLENGES
// ============================================================================

/**
 * Challenge 1: Promise vs setTimeout Order
 */
function challenge1(): void {
  setTimeout(() => console.log('1'), 0);
  Promise.resolve().then(() => console.log('2'));
  setTimeout(() => console.log('3'), 0);
  Promise.resolve().then(() => console.log('4'));

  // Output: 2, 4, 1, 3
  // Microtasks (2, 4) before macrotasks (1, 3)
}

/**
 * Challenge 2: Nested Promises and Timeouts
 */
function challenge2(): void {
  setTimeout(() => {
    console.log('1');
    Promise.resolve().then(() => console.log('2'));
  }, 0);

  Promise.resolve().then(() => {
    console.log('3');
    setTimeout(() => console.log('4'), 0);
  });

  // Output: 3, 1, 2, 4
}

/**
 * Challenge 3: Async/Await Execution
 */
async function challenge3(): Promise<void> {
  async function test() {
    console.log('1');
    await Promise.resolve();
    console.log('2');
  }

  console.log('3');
  test();
  console.log('4');

  // Output: 3, 1, 4, 2
}

/**
 * Challenge 4: Multiple Awaits
 */
async function challenge4(): Promise<void> {
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
}

/**
 * Challenge 5: Promise Constructor Execution
 */
function challenge5(): void {
  new Promise((resolve) => {
    console.log('1');
    resolve(undefined);
  }).then(() => console.log('2'));

  console.log('3');

  // Output: 1, 3, 2
  // Promise constructor runs synchronously!
  // Only .then() is async
}

// ============================================================================
// SECTION 7: PERFORMANCE IMPLICATIONS
// ============================================================================

/**
 * Long Tasks Block UI
 * 
 * PROBLEM: Synchronous code blocks event loop
 * UI becomes unresponsive during long operations
 */
function demonstrateLongTaskProblem(): void {
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
  
  // nonBlockingOperation(); // Uncomment to test
}

/**
 * Optimizing Heavy Computations
 * 
 * STRATEGY: Break work into chunks, yield between chunks
 */
async function processLargeDataset(data: any[]): Promise<any[]> {
  const results: any[] = [];
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

function expensiveOperation(item: any): any {
  // Simulate expensive operation
  return item * 2;
}

/**
 * Measuring Event Loop Lag
 * 
 * PURPOSE: Detect when event loop is blocked
 */
class EventLoopMonitor {
  private threshold: number;
  private lastCheck: number;
  private intervalId?: NodeJS.Timeout;
  
  constructor(threshold: number = 100) {
    this.threshold = threshold;
    this.lastCheck = Date.now();
  }
  
  start(): void {
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const lag = now - this.lastCheck - 100; // Expected 100ms
      
      if (lag > this.threshold) {
        console.warn(`Event loop lag detected: ${lag}ms`);
      }
      
      this.lastCheck = now;
    }, 100);
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Call Stack
  demonstrateExecutionContext,
  demonstrateHoisting,
  demonstrateScopeChain,
  
  // Event Loop
  demonstrateEventLoopFlow,
  demonstrateRenderingPipeline,
  
  // Microtasks vs Macrotasks
  demonstrateMicrotasksVsMacrotasks,
  demonstrateComplexExecutionOrder,
  demonstrateMicrotaskStarvation,
  
  // Browser vs Node.js
  demonstrateBrowserEventLoop,
  demonstrateNodeEventLoop,
  
  // Interview Questions
  interviewQuestion1,
  interviewQuestion2,
  interviewQuestion3,
  
  // Challenges
  challenge1,
  challenge2,
  challenge3,
  challenge4,
  challenge5,
  
  // Performance
  demonstrateLongTaskProblem,
  processLargeDataset,
  EventLoopMonitor
};

/**
 * ============================================================================
 * QUICK REFERENCE GUIDE
 * ============================================================================
 * 
 * Event Loop Priority (High to Low):
 * 1. Synchronous code (call stack)
 * 2. Microtasks
 *    - process.nextTick() (Node.js - highest)
 *    - Promise callbacks
 *    - queueMicrotask()
 *    - MutationObserver
 * 3. Macrotasks
 *    - setTimeout / setInterval
 *    - setImmediate (Node.js)
 *    - I/O operations
 *    - UI rendering
 * 
 * Common Patterns:
 * - Defer to next microtask: Promise.resolve().then(...)
 * - Defer to next macrotask: setTimeout(..., 0)
 * - Defer to next frame: requestAnimationFrame(...)
 * - Yield to event loop: await new Promise(r => setTimeout(r, 0))
 * 
 * Key Insights:
 * - Microtasks run before macrotasks
 * - Microtask queue must be empty before next macrotask
 * - Infinite microtasks cause starvation
 * - Promise constructor runs synchronously
 * - await creates microtask for continuation
 * 
 * ============================================================================
 */
