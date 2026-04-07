# Async Programming Deep Dive - JavaScript Interview Guide

## Table of Contents
1. [Promises Fundamentals](#promises-fundamentals)
2. [Async/Await Mastery](#asyncawait-mastery)
3. [Advanced Patterns](#advanced-patterns)
4. [Concurrency Control](#concurrency-control)
5. [Real Interview Questions](#real-interview-questions)
6. [Common Pitfalls](#common-pitfalls)
7. [Quick Reference](#quick-reference)

---

## Promises Fundamentals

### Promise States and Lifecycle

A Promise exists in one of three states:
- **Pending**: Initial state, neither fulfilled nor rejected
- **Fulfilled**: Operation completed successfully
- **Rejected**: Operation failed

```javascript
// Promise state transitions are irreversible
const promise = new Promise((resolve, reject) => {
  // Pending state
  setTimeout(() => {
    resolve('Success'); // Transitions to Fulfilled
    reject('Error');    // This is ignored - promise already settled
  }, 1000);
});
```

### Promise Chaining and Error Propagation

```javascript
// Example 1: Proper chaining with error handling
fetch('/api/user')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .then(user => {
    console.log('User:', user);
    return fetch(`/api/posts/${user.id}`);
  })
  .then(response => response.json())
  .then(posts => console.log('Posts:', posts))
  .catch(error => {
    // Catches errors from any step in the chain
    console.error('Pipeline failed:', error);
  });
```

```javascript
// Example 2: Error propagation nuances
Promise.resolve(1)
  .then(val => {
    console.log(val); // 1
    throw new Error('Oops');
  })
  .then(
    val => console.log('Success:', val),  // Skipped
    err => console.log('Caught:', err)     // Handles error
  )
  .then(val => console.log('Continues:', val)); // undefined - chain continues

// vs

Promise.resolve(1)
  .then(val => {
    console.log(val); // 1
    throw new Error('Oops');
  })
  .catch(err => {
    console.log('Caught:', err);
    return 'recovered'; // Returns a value
  })
  .then(val => console.log('Continues:', val)); // 'recovered'
```

### Promise.all, Promise.race, Promise.allSettled, Promise.any

```javascript
// Promise.all - Fails fast, all must succeed
// 
// BEHAVIOR: Promise.all takes an array of promises and returns a single promise that:
// - RESOLVES when ALL input promises resolve successfully
// - REJECTS immediately when ANY single promise rejects (fail-fast behavior)
// - Returns an array of results in the SAME ORDER as input promises
//
// USE CASE: Multiple independent API calls that all must succeed
// Perfect for loading a dashboard where you need profile, posts, AND comments
// If any one fails, the entire operation should fail (you can't show partial data)
//
// PERFORMANCE BENEFIT: All requests run in PARALLEL, not sequentially
// Time = max(request1, request2, request3), not sum of all requests
const fetchUserData = async (userId) => {
  // All three fetch calls start simultaneously (parallel execution)
  // If profile takes 100ms, posts 200ms, comments 150ms
  // Total time is ~200ms (the slowest), NOT 450ms (sum of all)
  const [profile, posts, comments] = await Promise.all([
    fetch(`/api/users/${userId}`),        // Request 1 starts immediately
    fetch(`/api/users/${userId}/posts`),  // Request 2 starts immediately
    fetch(`/api/users/${userId}/comments`) // Request 3 starts immediately
  ]);
  
  // If ANY of the above requests fail, we never reach this line
  // The catch block (if present) would handle the error
  return {
    profile: await profile.json(),   // Parse response 1
    posts: await posts.json(),       // Parse response 2
    comments: await comments.json()  // Parse response 3
  };
};

// Promise.race - First to settle wins (either resolve OR reject)
//
// BEHAVIOR: Promise.race takes an array of promises and returns a single promise that:
// - SETTLES (resolves or rejects) as soon as the FIRST promise settles
// - Ignores all other promises once the first one settles
// - The result/error is from whichever promise finished first
//
// USE CASE: Timeout implementation - race the actual request against a timer
// If the fetch completes first → success
// If the timeout completes first → failure with timeout error
//
// IMPORTANT: Other promises continue running in background (can't be cancelled)
// They just don't affect the result anymore
const fetchWithTimeout = (url, timeout = 5000) => {
  return Promise.race([
    // Promise 1: The actual fetch request
    // This might take 1 second or 10 seconds, we don't know
    fetch(url),
    
    // Promise 2: A timer that rejects after timeout milliseconds
    // This creates a "deadline" for the fetch to complete
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
  // Whichever promise settles first "wins" the race
  // If fetch completes in 3s and timeout is 5s → fetch wins (success)
  // If fetch takes 7s and timeout is 5s → timeout wins (error)
};

// Promise.allSettled - Wait for all, get all results (NEVER rejects)
//
// BEHAVIOR: Promise.allSettled takes an array of promises and returns a single promise that:
// - ALWAYS RESOLVES (never rejects) when all promises have settled
// - Returns an array of objects describing each promise's outcome
// - Each result object has: { status: 'fulfilled'|'rejected', value|reason: ... }
//
// USE CASE: Multiple operations where you want all results regardless of failures
// Perfect for batch operations like uploading multiple files where:
// - Some uploads might fail (network issues, file too large, etc.)
// - You still want to know which ones succeeded and which failed
// - You want to show user: "5 of 10 files uploaded successfully"
//
// KEY DIFFERENCE from Promise.all: This NEVER rejects, always gives you full report
const processMultipleUploads = async (files) => {
  // Start all uploads in parallel
  // Even if some fail, we wait for ALL to complete
  const results = await Promise.allSettled(
    files.map(file => uploadFile(file))
  );
  
  // results is an array like:
  // [
  //   { status: 'fulfilled', value: 'file1.jpg uploaded' },
  //   { status: 'rejected', reason: Error('file2.jpg too large') },
  //   { status: 'fulfilled', value: 'file3.jpg uploaded' }
  // ]
  
  // Filter successful uploads
  const successful = results.filter(r => r.status === 'fulfilled');
  // Filter failed uploads
  const failed = results.filter(r => r.status === 'rejected');
  
  return {
    successful: successful.map(r => r.value),  // Extract success values
    failed: failed.map(r => r.reason)          // Extract error reasons
  };
};

// Promise.any - First to fulfill wins (ignores rejections until all fail)
//
// BEHAVIOR: Promise.any takes an array of promises and returns a single promise that:
// - RESOLVES as soon as ANY promise fulfills (succeeds)
// - IGNORES rejections as long as at least one promise might still succeed
// - REJECTS only if ALL promises reject (with AggregateError containing all errors)
//
// USE CASE: Multiple redundant sources, use fastest successful one
// Perfect for fetching from multiple CDNs/mirrors where:
// - You have 3 CDN servers hosting the same file
// - You don't care which one responds, just want the fastest
// - If CDN1 is slow or down, CDN2 or CDN3 can still succeed
//
// REAL-WORLD ANALOGY: Like asking 3 friends for a book
// You'll take it from whoever brings it first, don't care who
// Only if ALL 3 friends fail to bring it, then you have a problem
const fetchFromMultipleCDNs = (resource) => {
  return Promise.any([
    fetch(`https://cdn1.example.com/${resource}`),  // CDN 1 - might be slow
    fetch(`https://cdn2.example.com/${resource}`),  // CDN 2 - might be down
    fetch(`https://cdn3.example.com/${resource}`)   // CDN 3 - might be fast!
  ]);
  // Scenario 1: CDN3 responds in 50ms → resolves with CDN3's response
  // Scenario 2: CDN1 fails, CDN2 fails, CDN3 succeeds → resolves with CDN3
  // Scenario 3: ALL fail → rejects with AggregateError([error1, error2, error3])
};
```

### Comparison Table

| Method | Resolves When | Rejects When | Use Case |
|--------|---------------|--------------|----------|
| `Promise.all` | All promises fulfill | Any promise rejects | All operations must succeed |
| `Promise.race` | First promise settles | First promise rejects | Timeout, fastest response |
| `Promise.allSettled` | All promises settle | Never rejects | Need all results, success or failure |
| `Promise.any` | First promise fulfills | All promises reject | First successful from multiple sources |

---

## Async/Await Mastery

### Error Handling Patterns

```javascript
// Pattern 1: Try-Catch for single operations
//
// PURPOSE: Wrap async operations in try-catch to handle errors gracefully
// This is the most common and straightforward error handling pattern
//
// WHEN TO USE: Single async operation where you want to:
// - Log the error for debugging
// - Transform the error message
// - Add context to the error
// - Decide whether to re-throw or return a default value
async function fetchUser(id) {
  try {
    // Attempt the async operation
    const response = await fetch(`/api/users/${id}`);
    
    // Check if HTTP request was successful (status 200-299)
    // fetch() doesn't throw on 404 or 500, so we check manually
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    // Parse JSON response (this can also throw if response isn't valid JSON)
    return await response.json();
  } catch (error) {
    // This catches:
    // 1. Network errors (no internet, DNS failure, etc.)
    // 2. Our custom HTTP error thrown above
    // 3. JSON parsing errors
    // 4. Any other errors in the try block
    
    console.error('Failed to fetch user:', error);
    
    // DECISION POINT: Re-throw or return default?
    throw error; // Re-throw: Let caller handle it
    // OR
    // return null; // Return default: Handle it here, caller gets null
  }
}

// Pattern 2: Try-Catch with multiple operations
async function getUserDashboard(userId) {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchUserPosts(userId);
    const stats = await fetchUserStats(userId);
    return { user, posts, stats };
  } catch (error) {
    // Handle any error in the sequence
    return { error: error.message };
  }
}

// Pattern 3: Granular error handling
async function robustFetch(userId) {
  let user, posts, stats;
  
  try {
    user = await fetchUser(userId);
  } catch (error) {
    user = { error: 'User fetch failed' };
  }
  
  try {
    posts = await fetchUserPosts(userId);
  } catch (error) {
    posts = []; // Default empty array
  }
  
  try {
    stats = await fetchUserStats(userId);
  } catch (error) {
    stats = { views: 0, likes: 0 }; // Default stats
  }
  
  return { user, posts, stats };
}

// Pattern 4: Promise-based error handling (no try-catch)
async function fetchWithFallback(url) {
  return fetch(url)
    .then(res => res.json())
    .catch(error => {
      console.error('Fetch failed:', error);
      return null; // Fallback value
    });
}
```

### Parallel vs Sequential Execution

```javascript
// SEQUENTIAL - Slow (waits for each to complete before starting next)
//
// EXECUTION FLOW:
// 0ms:    Start user fetch
// 1000ms: User fetch completes, START posts fetch
// 2000ms: Posts fetch completes, START comments fetch  
// 3000ms: Comments fetch completes, return results
// TOTAL TIME: 3 seconds (1s + 1s + 1s)
//
// PROBLEM: Each 'await' BLOCKS execution until that promise resolves
// The next fetch doesn't start until the previous one finishes
// This is WASTEFUL because these requests are independent!
//
// WHEN TO USE: Only when requests have DEPENDENCIES
// Example: Need user ID before fetching user's posts
async function sequentialFetch() {
  const user = await fetch('/api/user');      // Wait 1s (blocking)
  const posts = await fetch('/api/posts');    // Wait 1s (blocking)
  const comments = await fetch('/api/comments'); // Wait 1s (blocking)
  return { user, posts, comments };
  // Total: 3 seconds wasted waiting
}

// PARALLEL - Fast (all requests start simultaneously)
//
// EXECUTION FLOW:
// 0ms:    Start ALL THREE fetches at the same time
// 1000ms: All fetches complete (assuming each takes ~1s)
// TOTAL TIME: 1 second (max of all requests, NOT sum)
//
// HOW IT WORKS:
// 1. All fetch() calls execute immediately (they return promises)
// 2. Promise.all waits for ALL of them to complete
// 3. Requests run in parallel (browser/Node.js handles concurrency)
//
// PERFORMANCE GAIN: 3x faster than sequential (1s vs 3s)
//
// WHEN TO USE: When requests are INDEPENDENT (no dependencies)
// All three API endpoints don't need data from each other
//
// TRADE-OFF: If ANY request fails, entire operation fails
// Use Promise.allSettled if you want to handle partial failures
async function parallelFetch() {
  // All three fetch calls execute immediately, don't wait for each other
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user'),     // Starts at 0ms
    fetch('/api/posts'),    // Starts at 0ms (parallel!)
    fetch('/api/comments')  // Starts at 0ms (parallel!)
  ]);
  // await Promise.all waits for ALL to complete
  // Returns array in same order: [userResult, postsResult, commentsResult]
  return { user, posts, comments };
}

// MIXED - When there are dependencies (hybrid approach)
//
// EXECUTION FLOW:
// 0ms:    Start user fetch (MUST complete first - we need user.id)
// 1000ms: User fetch completes, extract user.id
//         NOW start posts AND friends fetches in parallel
// 2000ms: Both posts and friends complete
// TOTAL TIME: 2 seconds (1s sequential + 1s parallel)
//
// WHY THIS PATTERN:
// - User fetch MUST be sequential (we need the user.id for next requests)
// - Posts and friends CAN be parallel (they're independent of each other)
//
// OPTIMIZATION STRATEGY:
// 1. Identify dependencies: What data do I need before making other requests?
// 2. Sequential for dependencies: Fetch required data first
// 3. Parallel for independents: Fetch everything else simultaneously
//
// REAL-WORLD ANALOGY:
// - First, look up person's address (sequential - must have this)
// - Then, order pizza AND send flowers to that address (parallel - independent)
async function mixedFetch(userId) {
  // STEP 1: Sequential - Get user data first (dependency)
  // We NEED user.id before we can fetch their posts/friends
  const user = await fetch(`/api/users/${userId}`).then(r => r.json());
  
  // STEP 2: Parallel - Now that we have user.id, fetch related data simultaneously
  // These two requests don't depend on each other, so run them in parallel
  const [posts, friends] = await Promise.all([
    fetch(`/api/users/${user.id}/posts`).then(r => r.json()),    // Starts immediately
    fetch(`/api/users/${user.id}/friends`).then(r => r.json())   // Starts immediately
  ]);
  
  return { user, posts, friends };
  // Best of both worlds: Sequential where needed, parallel where possible
}
```

### Performance Implications

```javascript
// BAD: Sequential when parallel is possible
async function inefficientDataLoad() {
  const data1 = await loadData1(); // 100ms
  const data2 = await loadData2(); // 100ms
  const data3 = await loadData3(); // 100ms
  // Total: 300ms
}

// GOOD: Parallel execution
async function efficientDataLoad() {
  const [data1, data2, data3] = await Promise.all([
    loadData1(),
    loadData2(),
    loadData3()
  ]);
  // Total: 100ms (assuming all take same time)
}

// REAL-WORLD: Batching with limits
async function batchProcess(items, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

---

## Advanced Patterns

### Promise Cancellation

```javascript
// Pattern 1: AbortController (Modern approach - Browser & Node.js 15+)
//
// PURPOSE: Cancel in-flight HTTP requests to save bandwidth and processing
// Common use case: User types in search box, cancels previous searches
//
// HOW IT WORKS:
// 1. Create AbortController - gives you a signal and abort() method
// 2. Pass signal to fetch() - links the request to the controller
// 3. Call abort() - triggers cancellation, fetch throws AbortError
//
// BENEFITS:
// - Saves bandwidth (stops downloading response)
// - Prevents race conditions (old results don't overwrite new ones)
// - Improves performance (browser can free up resources)
class CancellableRequest {
  constructor() {
    // AbortController provides: signal (to pass to fetch) and abort() method
    this.controller = new AbortController();
  }
  
  async fetch(url) {
    try {
      // Pass the signal to fetch - this links the request to our controller
      // When abort() is called, this fetch will be cancelled
      const response = await fetch(url, {
        signal: this.controller.signal  // Key: Connect request to controller
      });
      return await response.json();
    } catch (error) {
      // When abort() is called, fetch throws an error with name 'AbortError'
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return null;  // Return null for cancelled requests (not an error)
      }
      throw error;  // Re-throw other errors (network issues, etc.)
    }
  }
  
  cancel() {
    // Calling abort() will:
    // 1. Stop the network request immediately
    // 2. Cause fetch() to throw an AbortError
    // 3. Trigger the catch block above
    this.controller.abort();
  }
}

// Usage Example: Search with cancellation
const request = new CancellableRequest();

// User types "hello" in search box
request.fetch('/api/search?q=hello').then(data => console.log(data));

// User quickly changes mind and types "world"
request.cancel(); // Cancel the "hello" search (saves bandwidth!)

// Start new search for "world"
const newRequest = new CancellableRequest();
newRequest.fetch('/api/search?q=world').then(data => console.log(data));

// Pattern 2: Custom cancellation token
class CancellationToken {
  constructor() {
    this.cancelled = false;
    this.listeners = [];
  }
  
  cancel() {
    this.cancelled = true;
    this.listeners.forEach(fn => fn());
  }
  
  onCancel(callback) {
    this.listeners.push(callback);
  }
  
  throwIfCancelled() {
    if (this.cancelled) {
      throw new Error('Operation cancelled');
    }
  }
}

async function longOperation(token) {
  for (let i = 0; i < 100; i++) {
    token.throwIfCancelled();
    await doWork(i);
  }
}

// Usage
const token = new CancellationToken();
longOperation(token).catch(err => console.log(err.message));
setTimeout(() => token.cancel(), 1000);
```

### Timeout Handling

```javascript
// Pattern 1: Simple timeout wrapper
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);
}

// Usage
await withTimeout(fetch('/api/slow'), 5000);

// Pattern 2: Timeout with cleanup
function withTimeoutAndCleanup(promise, ms, cleanup) {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      cleanup?.();
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
  });
  
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise
  ]);
}

// Pattern 3: Configurable timeout utility
class TimeoutManager {
  constructor(defaultTimeout = 5000) {
    this.defaultTimeout = defaultTimeout;
  }
  
  async execute(fn, timeout = this.defaultTimeout) {
    const controller = new AbortController();
    
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);
    
    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Operation timed out after ${timeout}ms`);
      }
      throw error;
    }
  }
}

// Usage
const tm = new TimeoutManager(3000);
await tm.execute(async (signal) => {
  return fetch('/api/data', { signal });
});
```

### Retry Logic with Exponential Backoff

```javascript
// Basic retry implementation
async function retry(fn, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Exponential backoff with jitter
async function retryWithBackoff(
  fn,
  maxAttempts = 5,
  baseDelay = 1000,
  maxDelay = 30000
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Failed after ${maxAttempts} attempts: ${error.message}`);
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, attempt - 1),
        maxDelay
      );
      
      // Add jitter (randomness) to prevent thundering herd
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = exponentialDelay + jitter;
      
      console.log(`Attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Advanced retry with conditional logic
class RetryStrategy {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.retryableErrors = options.retryableErrors || [];
    this.onRetry = options.onRetry || (() => {});
  }
  
  isRetryable(error) {
    // Retry on network errors or specific HTTP status codes
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }
    
    if (error.status && [408, 429, 500, 502, 503, 504].includes(error.status)) {
      return true;
    }
    
    return this.retryableErrors.some(pattern => 
      error.message.includes(pattern)
    );
  }
  
  async execute(fn) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryable(error) || attempt === this.maxAttempts) {
          throw error;
        }
        
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt - 1),
          this.maxDelay
        );
        
        this.onRetry({ attempt, error, delay });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Usage
const strategy = new RetryStrategy({
  maxAttempts: 5,
  baseDelay: 1000,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT'],
  onRetry: ({ attempt, error, delay }) => {
    console.log(`Retry ${attempt}: ${error.message} (waiting ${delay}ms)`);
  }
});

await strategy.execute(() => fetch('/api/unstable-endpoint'));
```

---

## Concurrency Control

### Rate Limiter Implementation

```javascript
// Token bucket rate limiter
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow; // in milliseconds
    this.queue = [];
    this.activeRequests = 0;
  }
  
  async execute(fn) {
    // Wait if we're at capacity
    while (this.activeRequests >= this.maxRequests) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.activeRequests++;
    
    try {
      const result = await fn();
      return result;
    } finally {
      // Release after time window
      setTimeout(() => {
        this.activeRequests--;
        if (this.queue.length > 0) {
          const resolve = this.queue.shift();
          resolve();
        }
      }, this.timeWindow);
    }
  }
}

// Usage: Max 5 requests per second
const limiter = new RateLimiter(5, 1000);

const urls = Array.from({ length: 20 }, (_, i) => `/api/data/${i}`);
const results = await Promise.all(
  urls.map(url => limiter.execute(() => fetch(url)))
);
```

### Task Queue with Concurrency Limits

```javascript
// Parallel execution with concurrency limit
class TaskQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }
  
  async add(task) {
    // Wait if at capacity
    while (this.running >= this.concurrency) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    
    this.running++;
    
    try {
      return await task();
    } finally {
      this.running--;
      
      // Process next task in queue
      const next = this.queue.shift();
      if (next) next();
    }
  }
  
  async addAll(tasks) {
    return Promise.all(tasks.map(task => this.add(task)));
  }
}

// Usage: Process 100 items with max 5 concurrent operations
const queue = new TaskQueue(5);
const items = Array.from({ length: 100 }, (_, i) => i);

const results = await queue.addAll(
  items.map(item => () => processItem(item))
);

// Advanced: Priority queue
class PriorityTaskQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = []; // Array of { task, priority, resolve, reject }
  }
  
  async add(task, priority = 0) {
    return new Promise((resolve, reject) => {
      const item = { task, priority, resolve, reject };
      
      // Insert based on priority (higher priority first)
      const index = this.queue.findIndex(q => q.priority < priority);
      if (index === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(index, 0, item);
      }
      
      this.processNext();
    });
  }
  
  async processNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const { task, resolve, reject } = this.queue.shift();
    
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.processNext();
    }
  }
}

// Usage
const pQueue = new PriorityTaskQueue(3);

// High priority tasks execute first
pQueue.add(() => fetch('/api/critical'), 10);
pQueue.add(() => fetch('/api/normal'), 5);
pQueue.add(() => fetch('/api/low'), 1);
```

### Parallel Execution with Limits

```javascript
// Process array in batches with concurrency control
async function parallelLimit(items, limit, fn) {
  const results = [];
  const executing = [];
  
  for (const [index, item] of items.entries()) {
    const promise = Promise.resolve().then(() => fn(item, index));
    results.push(promise);
    
    if (limit <= items.length) {
      const e = promise.then(() => 
        executing.splice(executing.indexOf(e), 1)
      );
      executing.push(e);
      
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  
  return Promise.all(results);
}

// Usage
const urls = Array.from({ length: 50 }, (_, i) => `/api/item/${i}`);
const results = await parallelLimit(urls, 5, async (url) => {
  const response = await fetch(url);
  return response.json();
});

// Alternative: Using async pool pattern
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);
    
    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  
  return Promise.all(ret);
}
```

---

## Real Interview Questions

### Question 1: Implement Promise.all from Scratch

**Difficulty**: Mid  
**Companies**: Google, Microsoft, Amazon, Meta

**Question**: Implement your own version of `Promise.all` that takes an array of promises and returns a single promise that resolves when all input promises resolve, or rejects when any input promise rejects.

**Solution Approach**:
1. Return a new Promise
2. Track resolved count and results array
3. Handle each promise resolution
4. Reject immediately on any failure
5. Resolve when all complete

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    // Handle empty array
    if (promises.length === 0) {
      resolve([]);
      return;
    }
    
    const results = new Array(promises.length);
    let completedCount = 0;
    
    promises.forEach((promise, index) => {
      // Wrap in Promise.resolve to handle non-promise values
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completedCount++;
          
          // All promises resolved
          if (completedCount === promises.length) {
            resolve(results);
          }
        })
        .catch(error => {
          // Reject immediately on first error
          reject(error);
        });
    });
  });
}

// Test cases
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

promiseAll([p1, p2, p3]).then(console.log); // [1, 2, 3]

const p4 = Promise.reject('Error');
promiseAll([p1, p4, p3]).catch(console.log); // 'Error'

// Edge case: non-promise values
promiseAll([1, 2, Promise.resolve(3)]).then(console.log); // [1, 2, 3]
```

**Follow-up Questions**:
- How would you implement `Promise.allSettled`?
- What's the time complexity? (O(n) where n is number of promises)
- How do you handle non-promise values in the array?
- What happens if the array is empty?

**Optimization**: The implementation already handles the main edge cases. For production, consider adding input validation.

---

### Question 2: Build Retry Mechanism with Exponential Backoff

**Difficulty**: Senior  
**Companies**: Amazon, Netflix, Atlassian

**Question**: Create a retry function that attempts an async operation multiple times with exponential backoff. Include jitter to prevent thundering herd problem.

```javascript
async function retryWithExponentialBackoff(
  operation,
  maxRetries = 5,
  baseDelay = 1000,
  maxDelay = 32000,
  shouldRetry = () => true
) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // Don't delay after last attempt
      if (attempt === maxRetries - 1) {
        break;
      }
      
      // Calculate delay: 2^attempt * baseDelay
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );
      
      // Add jitter: random value between 0 and 30% of delay
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const totalDelay = exponentialDelay + jitter;
      
      console.log(
        `Attempt ${attempt + 1} failed. Retrying in ${Math.round(totalDelay)}ms...`
      );
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw new Error(
    `Operation failed after ${maxRetries} attempts: ${lastError.message}`
  );
}

// Usage with custom retry logic
const fetchWithRetry = () => retryWithExponentialBackoff(
  () => fetch('/api/unstable'),
  5,
  1000,
  32000,
  (error) => {
    // Only retry on network errors or 5xx status codes
    return error.name === 'TypeError' || 
           (error.status >= 500 && error.status < 600);
  }
);

// Test: Delays will be approximately 1s, 2s, 4s, 8s, 16s (with jitter)
```

**Follow-up Questions**:
- Why add jitter? (Prevents multiple clients retrying simultaneously)
- How would you add a circuit breaker pattern?
- What metrics would you track?

---

### Question 3: Task Scheduler with Concurrency Limits

**Difficulty**: Senior  
**Companies**: Google, Microsoft, Meta

**Question**: Implement a task scheduler that can execute async tasks with a maximum concurrency limit. Tasks should be queued and executed as slots become available.

```javascript
class TaskScheduler {
  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
    this.currentlyRunning = 0;
    this.queue = [];
    this.results = new Map();
  }
  
  async schedule(taskId, taskFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        taskId,
        taskFn,
        resolve,
        reject
      });
      
      this.processQueue();
    });
  }
  
  async processQueue() {
    // Check if we can process more tasks
    if (this.currentlyRunning >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }
    
    const { taskId, taskFn, resolve, reject } = this.queue.shift();
    this.currentlyRunning++;
    
    try {
      const result = await taskFn();
      this.results.set(taskId, { status: 'success', result });
      resolve(result);
    } catch (error) {
      this.results.set(taskId, { status: 'error', error });
      reject(error);
    } finally {
      this.currentlyRunning--;
      // Process next task
      this.processQueue();
    }
  }
  
  async scheduleAll(tasks) {
    return Promise.all(
      tasks.map(({ id, fn }) => this.schedule(id, fn))
    );
  }
  
  getResult(taskId) {
    return this.results.get(taskId);
  }
  
  getStats() {
    return {
      running: this.currentlyRunning,
      queued: this.queue.length,
      completed: this.results.size
    };
  }
}

// Usage
const scheduler = new TaskScheduler(3);

// Schedule 10 tasks, only 3 run concurrently
const tasks = Array.from({ length: 10 }, (_, i) => ({
  id: `task-${i}`,
  fn: async () => {
    console.log(`Starting task ${i}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Completed task ${i}`);
    return `Result ${i}`;
  }
}));

const results = await scheduler.scheduleAll(tasks);
console.log('All tasks completed:', results);
console.log('Stats:', scheduler.getStats());
```

**Follow-up Questions**:
- How would you add priority to tasks?
- How would you implement task cancellation?
- How would you handle task dependencies?

---

### Question 4: Handle Race Conditions in Async Operations

**Difficulty**: Mid-Senior  
**Companies**: Atlassian, Microsoft, Google

**Question**: You have a search input that triggers API calls. Prevent race conditions where older requests return after newer ones.

```javascript
class SearchManager {
  constructor() {
    this.latestRequestId = 0;
    this.latestCompletedId = 0;
  }
  
  async search(query) {
    // Assign unique ID to this request
    const requestId = ++this.latestRequestId;
    
    try {
      const results = await this.fetchResults(query);
      
      // Only use results if this is still the latest request
      if (requestId >= this.latestCompletedId) {
        this.latestCompletedId = requestId;
        return results;
      }
      
      // Discard stale results
      return null;
    } catch (error) {
      // Only throw if this was the latest request
      if (requestId === this.latestRequestId) {
        throw error;
      }
      return null;
    }
  }
  
  async fetchResults(query) {
    const response = await fetch(`/api/search?q=${query}`);
    return response.json();
  }
}

// Alternative: Using AbortController
class SearchManagerWithAbort {
  constructor() {
    this.currentController = null;
  }
  
  async search(query) {
    // Cancel previous request
    if (this.currentController) {
      this.currentController.abort();
    }
    
    // Create new controller for this request
    this.currentController = new AbortController();
    const signal = this.currentController.signal;
    
    try {
      const response = await fetch(`/api/search?q=${query}`, { signal });
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return null;
      }
      throw error;
    }
  }
}

// Usage with debouncing
function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    return new Promise((resolve) => {
      timeoutId = setTimeout(() => resolve(fn.apply(this, args)), delay);
    });
  };
}

const searchManager = new SearchManagerWithAbort();
const debouncedSearch = debounce((query) => searchManager.search(query), 300);

// User types: "hello"
// Only the last call's results are used
debouncedSearch('h');
debouncedSearch('he');
debouncedSearch('hel');
debouncedSearch('hell');
debouncedSearch('hello'); // Only this completes
```

**Follow-up Questions**:
- What's the difference between the two approaches?
- How would you add caching?
- How do you test race conditions?

---

### Question 5: Implement Request Deduplication

**Difficulty**: Senior  
**Companies**: Netflix, Amazon, Google

**Question**: Multiple components request the same data simultaneously. Ensure only one actual request is made and all callers receive the same result.

```javascript
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }
  
  async fetch(key, fetchFn) {
    // Check if request is already in flight
    if (this.pendingRequests.has(key)) {
      console.log(`Reusing pending request for: ${key}`);
      return this.pendingRequests.get(key);
    }
    
    // Create new request
    const promise = fetchFn()
      .then(result => {
        // Clean up after completion
        this.pendingRequests.delete(key);
        return result;
      })
      .catch(error => {
        // Clean up after error
        this.pendingRequests.delete(key);
        throw error;
      });
    
    // Store pending request
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  clear(key) {
    this.pendingRequests.delete(key);
  }
  
  clearAll() {
    this.pendingRequests.clear();
  }
}

// Usage
const deduplicator = new RequestDeduplicator();

async function fetchUser(userId) {
  return deduplicator.fetch(
    `user-${userId}`,
    () => fetch(`/api/users/${userId}`).then(r => r.json())
  );
}

// Multiple simultaneous calls - only one actual fetch
const [user1, user2, user3] = await Promise.all([
  fetchUser(123),
  fetchUser(123),
  fetchUser(123)
]);
// All three get the same result, only one network request made

console.log(user1 === user2 === user3); // true (same object reference)
```

**Advanced Version with TTL Cache**:

```javascript
class CachedDeduplicator {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.pending = new Map();
    this.ttl = ttl;
  }
  
  async fetch(key, fetchFn) {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`Cache hit: ${key}`);
      return cached.data;
    }
    
    // Check if request is pending
    if (this.pending.has(key)) {
      console.log(`Deduplicating: ${key}`);
      return this.pending.get(key);
    }
    
    // Make new request
    const promise = fetchFn()
      .then(data => {
        // Store in cache
        this.cache.set(key, {
          data,
          timestamp: Date.now()
        });
        this.pending.delete(key);
        return data;
      })
      .catch(error => {
        this.pending.delete(key);
        throw error;
      });
    
    this.pending.set(key, promise);
    return promise;
  }
  
  invalidate(key) {
    this.cache.delete(key);
    this.pending.delete(key);
  }
}
```

**Follow-up Questions**:
- How would you handle cache invalidation?
- What if the request fails - should you cache the error?
- How would you implement cache size limits?

---

## Common Pitfalls

### 1. Floating Promises (Unhandled Promises)

```javascript
// BAD: Promise created but not awaited or handled
async function processData() {
  fetchData(); // ❌ Floating promise - errors won't be caught
  return 'done';
}

// GOOD: Properly await or handle
async function processData() {
  await fetchData(); // ✅ Awaited
  return 'done';
}

// GOOD: Fire and forget with error handling
async function processData() {
  fetchData().catch(err => console.error('Background task failed:', err)); // ✅
  return 'done';
}

// BAD: forEach with async
async function processItems(items) {
  items.forEach(async (item) => {
    await processItem(item); // ❌ Not actually awaited by forEach
  });
  console.log('Done'); // Logs before items are processed!
}

// GOOD: Use for...of or Promise.all
async function processItems(items) {
  for (const item of items) {
    await processItem(item); // ✅ Sequential
  }
  
  // Or parallel:
  await Promise.all(items.map(item => processItem(item))); // ✅
}
```

### 2. Unhandled Promise Rejections

```javascript
// BAD: No error handling
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json(); // ❌ What if response is not ok?
}

// GOOD: Proper error handling
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error; // Re-throw or return default
  }
}

// BAD: Mixing patterns
function mixedPatterns() {
  return fetch('/api/data')
    .then(r => r.json())
    .then(async data => {
      await processData(data); // ❌ Mixing then/catch with async/await
      return data;
    });
}

// GOOD: Consistent pattern
async function consistentPattern() {
  const response = await fetch('/api/data');
  const data = await response.json();
  await processData(data);
  return data;
}
```

### 3. Memory Leaks in Async Code

```javascript
// BAD: Event listeners not cleaned up
class DataFetcher {
  constructor() {
    this.controller = new AbortController();
  }
  
  async fetchData() {
    const response = await fetch('/api/data', {
      signal: this.controller.signal
    });
    return response.json();
  }
  
  // ❌ No cleanup method
}

// GOOD: Proper cleanup
class DataFetcher {
  constructor() {
    this.controller = new AbortController();
  }
  
  async fetchData() {
    const response = await fetch('/api/data', {
      signal: this.controller.signal
    });
    return response.json();
  }
  
  cleanup() {
    this.controller.abort(); // ✅ Cancel pending requests
  }
}

// BAD: Closures holding references
function createFetcher() {
  const cache = new Map(); // ❌ Never cleared
  
  return async function fetch(url) {
    if (cache.has(url)) return cache.get(url);
    const data = await fetchData(url);
    cache.set(url, data);
    return data;
  };
}

// GOOD: Bounded cache with cleanup
function createFetcher(maxSize = 100) {
  const cache = new Map();
  
  return {
    async fetch(url) {
      if (cache.has(url)) return cache.get(url);
      
      const data = await fetchData(url);
      
      // Limit cache size
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(url, data);
      return data;
    },
    clear() {
      cache.clear(); // ✅ Cleanup method
    }
  };
}
```

### 4. Incorrect Error Handling in Promise Chains

```javascript
// BAD: Error handler returns undefined
fetch('/api/data')
  .then(r => r.json())
  .catch(err => {
    console.error(err); // ❌ Returns undefined
  })
  .then(data => {
    console.log(data.value); // TypeError: Cannot read property 'value' of undefined
  });

// GOOD: Return a default value or re-throw
fetch('/api/data')
  .then(r => r.json())
  .catch(err => {
    console.error(err);
    return { value: 'default' }; // ✅ Return default
  })
  .then(data => {
    console.log(data.value); // 'default'
  });

// BAD: Swallowing errors
async function processData() {
  try {
    await riskyOperation();
  } catch (error) {
    // ❌ Error swallowed - caller doesn't know it failed
  }
  return 'success';
}

// GOOD: Propagate or handle appropriately
async function processData() {
  try {
    await riskyOperation();
    return 'success';
  } catch (error) {
    console.error('Operation failed:', error);
    throw error; // ✅ Propagate to caller
  }
}
```

### 5. Async Constructor Anti-pattern

```javascript
// BAD: Async work in constructor
class DataManager {
  constructor(url) {
    this.data = null;
    this.fetch(url); // ❌ Can't await in constructor
  }
  
  async fetch(url) {
    this.data = await fetchData(url);
  }
}

// GOOD: Static factory method
class DataManager {
  constructor(data) {
    this.data = data;
  }
  
  static async create(url) {
    const data = await fetchData(url);
    return new DataManager(data);
  }
}

// Usage
const manager = await DataManager.create('/api/data');

// ALTERNATIVE: Lazy initialization
class DataManager {
  constructor(url) {
    this.url = url;
    this.dataPromise = null;
  }
  
  async getData() {
    if (!this.dataPromise) {
      this.dataPromise = fetchData(this.url);
    }
    return this.dataPromise;
  }
}
```

---

## Quick Reference

### Promise States
- **Pending**: Initial state
- **Fulfilled**: Operation completed successfully
- **Rejected**: Operation failed
- **Settled**: Either fulfilled or rejected (final state)

### Promise Combinators Cheat Sheet

```javascript
// All must succeed, fail fast
Promise.all([p1, p2, p3])

// First to settle (fulfill or reject)
Promise.race([p1, p2, p3])

// Wait for all, get all results
Promise.allSettled([p1, p2, p3])

// First to fulfill (ignores rejections)
Promise.any([p1, p2, p3])
```

### Async/Await Best Practices

```javascript
// ✅ DO: Use try-catch for error handling
try {
  const result = await asyncOperation();
} catch (error) {
  handleError(error);
}

// ✅ DO: Parallel when possible
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);

// ❌ DON'T: Sequential when parallel is possible
const a = await fetchA();
const b = await fetchB(); // Could run in parallel
const c = await fetchC(); // Could run in parallel

// ✅ DO: Handle promise rejections
asyncOperation().catch(handleError);

// ❌ DON'T: Create floating promises
asyncOperation(); // Unhandled promise

// ✅ DO: Use AbortController for cancellation
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort();
```

### Common Patterns

```javascript
// Timeout
Promise.race([
  operation(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 5000)
  )
])

// Retry with delay
async function retry(fn, attempts = 3, delay = 1000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Debounce
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    return new Promise(resolve => {
      timeoutId = setTimeout(() => resolve(fn(...args)), delay);
    });
  };
}

// Throttle
function throttle(fn, limit) {
  let inThrottle;
  return async (...args) => {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      return fn(...args);
    }
  };
}
```

### Performance Tips

1. **Parallel > Sequential**: Use `Promise.all` when operations are independent
2. **Batch Operations**: Process large arrays in chunks to avoid overwhelming resources
3. **Cache Results**: Deduplicate identical requests
4. **Cancel Unnecessary Work**: Use AbortController to cancel outdated requests
5. **Limit Concurrency**: Use task queues to prevent resource exhaustion

### Debugging Tips

```javascript
// Add request IDs for tracking
let requestId = 0;
async function trackedFetch(url) {
  const id = ++requestId;
  console.log(`[${id}] Starting: ${url}`);
  try {
    const result = await fetch(url);
    console.log(`[${id}] Success: ${url}`);
    return result;
  } catch (error) {
    console.log(`[${id}] Failed: ${url}`, error);
    throw error;
  }
}

// Measure async operation time
async function timed(fn, label) {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    console.log(`${label}: ${(performance.now() - start).toFixed(2)}ms`);
  }
}
```

---

## Further Reading

- [MDN: Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [TC39 Proposal: Promise.allSettled](https://github.com/tc39/proposal-promise-allSettled)
- [TC39 Proposal: Promise.any](https://github.com/tc39/proposal-promise-any)
- [JavaScript.info: Promises](https://javascript.info/promise-basics)
- [You Don't Know JS: Async & Performance](https://github.com/getify/You-Dont-Know-JS/tree/1st-ed/async%20%26%20performance)

---

**Interview Preparation Checklist**:
- ✅ Understand all three promise states
- ✅ Know when to use each Promise combinator
- ✅ Master async/await error handling patterns
- ✅ Implement retry logic with exponential backoff
- ✅ Build concurrency control mechanisms
- ✅ Handle race conditions properly
- ✅ Avoid common pitfalls (floating promises, memory leaks)
- ✅ Practice implementing Promise.all, Promise.race from scratch
- ✅ Understand event loop interaction with promises
- ✅ Know how to cancel async operations

Good luck with your interviews! 🚀
