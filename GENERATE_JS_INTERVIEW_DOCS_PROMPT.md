# LLM Prompt: Generate Comprehensive JavaScript Interview Preparation Documents

## Context
You are creating in-depth technical interview preparation materials for senior JavaScript developers targeting top-tier companies like Google, Microsoft, Atlassian, Amazon, Meta, and Netflix. These documents should go beyond surface-level explanations and dive into the nuances, edge cases, and real-world scenarios that distinguish exceptional candidates.

## Document Structure Requirements

Create **5 separate markdown files** covering the following topics:

### 1. `async-programming-deep-dive.md`
**Focus**: Asynchronous JavaScript patterns, promises, async/await, and advanced concurrency

**Required Sections**:
- **Promises Fundamentals**: Promise states, chaining, error propagation, Promise.all/race/allSettled/any with real scenarios
- **Async/Await Mastery**: Error handling patterns, parallel vs sequential execution, performance implications
- **Advanced Patterns**: Promise cancellation, timeout handling, retry logic, exponential backoff
- **Concurrency Control**: Implementing rate limiters, queue systems, parallel execution with limits
- **Real Interview Questions**: 
  - Implement Promise.all from scratch
  - Build a retry mechanism with exponential backoff
  - Create a task scheduler with concurrency limits
  - Handle race conditions in async operations
  - Implement request deduplication
- **Common Pitfalls**: Floating promises, unhandled rejections, memory leaks in async code
- **Code Examples**: Each concept must have 2-3 working code examples with explanations

### 2. `rxjs-reactive-programming.md`
**Focus**: RxJS fundamentals, operators, and reactive patterns for Angular/React applications

**Required Sections**:
- **Observable Fundamentals**: Hot vs Cold observables, creation operators, subscription lifecycle
- **Core Operators Deep Dive**: map, filter, switchMap, mergeMap, concatMap, exhaustMap - when to use each
- **Combination Operators**: combineLatest, forkJoin, zip, merge, concat - practical use cases
- **Error Handling**: catchError, retry, retryWhen strategies
- **Subjects**: BehaviorSubject, ReplaySubject, AsyncSubject - differences and use cases
- **Memory Management**: Unsubscription strategies, takeUntil pattern, avoiding memory leaks
- **Real Interview Questions**:
  - Implement autocomplete with debouncing and cancellation
  - Build a real-time search with switchMap
  - Create a polling mechanism with retry logic
  - Handle multiple API calls with proper cancellation
  - Implement state management with BehaviorSubject
- **Performance Optimization**: Backpressure handling, shareReplay usage, multicasting
- **Code Examples**: Practical scenarios with complete implementations

### 3. `event-loop-execution-model.md`
**Focus**: JavaScript runtime, event loop, microtasks, macrotasks, and execution context

**Required Sections**:
- **Call Stack Mechanics**: Execution context, scope chain, hoisting deep dive
- **Event Loop Architecture**: Phases, task queue, microtask queue, rendering pipeline
- **Microtasks vs Macrotasks**: 
  - What goes where: Promises, setTimeout, setImmediate, queueMicrotask
  - Execution order with complex examples
  - Priority and starvation scenarios
- **Browser vs Node.js**: Differences in event loop implementation
- **Real Interview Questions**:
  - Predict output of complex async code snippets
  - Explain execution order with mixed promises and timeouts
  - Debug infinite microtask loops
  - Optimize code based on event loop knowledge
- **Visual Diagrams**: ASCII diagrams showing event loop flow
- **Tricky Code Challenges**: 10+ code snippets with detailed explanations of execution order
- **Performance Implications**: How event loop knowledge affects app performance

### 4. `prototypes-inheritance-closures.md`
**Focus**: Prototype chain, inheritance patterns, closures, and object-oriented JavaScript

**Required Sections**:
- **Prototype Chain Deep Dive**: 
  - `__proto__` vs `prototype`
  - Object.create, Object.setPrototypeOf
  - Prototype pollution vulnerabilities
- **Inheritance Patterns**: 
  - Classical inheritance
  - Prototypal inheritance
  - Functional inheritance
  - ES6 classes vs constructor functions
- **Closures Mastery**:
  - Lexical scope and closure creation
  - Common closure patterns (module pattern, IIFE)
  - Memory implications and leaks
  - Practical use cases (data privacy, currying, memoization)
- **This Binding**: call, apply, bind, arrow functions, implicit vs explicit binding
- **Real Interview Questions**:
  - Implement inheritance without ES6 classes
  - Create a private variable system using closures
  - Fix common `this` binding issues
  - Implement Function.prototype.bind from scratch
  - Explain prototype chain lookup performance
- **Advanced Topics**: Mixins, composition over inheritance, Symbol usage
- **Code Examples**: Multiple inheritance patterns with pros/cons

### 5. `core-javascript-concepts.md`
**Focus**: Essential JavaScript concepts frequently tested in top company interviews

**Required Sections**:
- **Type Coercion & Equality**: 
  - == vs ===, implicit coercion rules
  - Tricky comparison scenarios
  - Type conversion algorithms
- **Scope & Hoisting**: var, let, const differences, temporal dead zone, function vs block scope
- **Higher-Order Functions**: map, reduce, filter implementations from scratch
- **Currying & Partial Application**: Practical implementations and use cases
- **Debouncing & Throttling**: Implement both with proper edge case handling
- **Deep vs Shallow Copy**: Object cloning strategies, structuredClone, handling circular references
- **Memory Management**: Garbage collection, memory leaks, WeakMap/WeakSet usage
- **Module Systems**: CommonJS vs ES6 modules, dynamic imports, tree shaking
- **Real Interview Questions**:
  - Implement debounce and throttle from scratch
  - Create a deep clone function handling all edge cases
  - Build a curry function with placeholder support
  - Implement Array.prototype.flat with depth
  - Create a memoization utility
  - Implement event emitter/pub-sub pattern
  - Build a simple Promise implementation
  - Create a function composition utility
- **Performance Patterns**: Lazy evaluation, memoization, optimization techniques
- **Security Considerations**: XSS prevention, safe JSON parsing, prototype pollution

## Writing Style Guidelines

1. **Depth Over Breadth**: Each topic should be explained at a level that demonstrates mastery, not just familiarity
2. **Real-World Context**: Connect concepts to actual interview scenarios and production code
3. **Progressive Complexity**: Start with fundamentals, build to advanced scenarios
4. **Code-Heavy**: Every concept needs working code examples with detailed comments
5. **Interview-Focused**: Include actual questions asked at FAANG companies
6. **Edge Cases**: Highlight tricky scenarios and common mistakes
7. **Performance Awareness**: Discuss time/space complexity where relevant
8. **Modern Standards**: Use ES6+ syntax, but explain legacy patterns where relevant

## Code Example Requirements

- All code must be **runnable and tested**
- Include **input/output examples**
- Add **inline comments** explaining non-obvious logic
- Show **multiple approaches** when applicable (e.g., iterative vs recursive)
- Highlight **time and space complexity**
- Include **edge cases and error handling**

## Question Format

For each interview question, provide:
1. **Question Statement**: Clear problem description
2. **Difficulty Level**: Junior/Mid/Senior
3. **Companies Known to Ask**: List specific companies
4. **Solution Approach**: Step-by-step thinking process
5. **Complete Implementation**: Working code with comments
6. **Follow-up Questions**: What interviewers might ask next
7. **Optimization Discussion**: How to improve the solution

## Additional Requirements

- Include **at least 15-20 interview questions per file**
- Add **"Quick Reference" sections** with key takeaways
- Create **comparison tables** for related concepts
- Include **debugging tips** for common issues
- Add **further reading** links to MDN, TC39 proposals, and authoritative sources
- Use **consistent formatting**: code blocks with language tags, proper headings, bullet points

## Output Format

Generate each file as a complete, standalone markdown document that a developer can use for interview preparation. Each file should be 3000-5000 words with substantial code examples.

---

**Start generating the documents now, beginning with `async-programming-deep-dive.md`**
