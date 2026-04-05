/**
 * ============================================================================
 * ASYNC PROGRAMMING DEEP DIVE - TypeScript Interview Guide
 * ============================================================================
 * 
 * This file contains comprehensive examples of asynchronous JavaScript/TypeScript
 * patterns, promises, async/await, and advanced concurrency control.
 * 
 * Topics Covered:
 * 1. Promises Fundamentals
 * 2. Async/Await Mastery
 * 3. Advanced Patterns (Cancellation, Timeout, Retry)
 * 4. Concurrency Control
 * 5. Real Interview Questions
 * 6. Common Pitfalls
 * 
 * Companies: Google, Microsoft, Amazon, Meta, Netflix, Atlassian
 * ============================================================================
 */

// ============================================================================
// SECTION 1: PROMISES FUNDAMENTALS
// ============================================================================

/**
 * Promise States and Lifecycle
 * 
 * A Promise exists in one of three states:
 * - PENDING: Initial state, neither fulfilled nor rejected
 * - FULFILLED: Operation completed successfully
 * - REJECTED: Operation failed
 * 
 * State transitions are IRREVERSIBLE (one-way only)
 */
function demonstratePromiseStates(): void {
  const promise = new Promise<string>((resolve, reject) => {
    // Currently in PENDING state
    
    setTimeout(() => {
      resolve('Success'); // Transitions to FULFILLED
      reject('Error');    // This is IGNORED - promise already settled
    }, 1000);
  });

  promise
    .then(result => console.log('Result:', result))
    .catch(error => console.error('Error:', error));
}

/**
 * Promise.all - Fails fast, all must succeed
 * 
 * BEHAVIOR:
 * - RESOLVES when ALL input promises resolve successfully
 * - REJECTS immediately when ANY single promise rejects (fail-fast)
 * - Returns array of results in SAME ORDER as input promises
 * 
 * USE CASE: Multiple independent API calls that all must succeed
 * Perfect for loading dashboard where you need profile, posts, AND comments
 * 
 * PERFORMANCE: All requests run in PARALLEL
 * Time = max(request1, request2, request3), NOT sum
 * 
 * @param userId - User ID to fetch data for
 * @returns Promise with all user data
 */
async function fetchUserDataWithPromiseAll(userId: number): Promise<{
  profile: any;
  posts: any[];
  comments: any[];
}> {
  // All three fetch calls start simultaneously (parallel execution)
  // If profile takes 100ms, posts 200ms, comments 150ms
  // Total time is ~200ms (the slowest), NOT 450ms (sum)
  const [profile, posts, comments] = await Promise.all([
    fetch(`/api/users/${userId}`).then(r => r.json()),        // Starts at 0ms
    fetch(`/api/users/${userId}/posts`).then(r => r.json()),  // Starts at 0ms
    fetch(`/api/users/${userId}/comments`).then(r => r.json()) // Starts at 0ms
  ]);
  
  // If ANY of the above requests fail, we never reach this line
  // The catch block would handle the error
  return { profile, posts, comments };
}

/**
 * Promise.race - First to settle wins (either resolve OR reject)
 * 
 * BEHAVIOR:
 * - SETTLES as soon as the FIRST promise settles
 * - Ignores all other promises once first one settles
 * - Result/error is from whichever promise finished first
 * 
 * USE CASE: Timeout implementation
 * Race the actual request against a timer
 * 
 * IMPORTANT: Other promises continue running in background
 * They just don't affect the result anymore
 * 
 * @param url - URL to fetch
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves with response or rejects with timeout
 */
function fetchWithTimeout(url: string, timeout: number = 5000): Promise<Response> {
  return Promise.race([
    // Promise 1: The actual fetch request
    // This might take 1 second or 10 seconds, we don't know
    fetch(url),
    
    // Promise 2: A timer that rejects after timeout milliseconds
    // This creates a "deadline" for the fetch to complete
    new Promise<Response>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
  // Whichever promise settles first "wins" the race
  // If fetch completes in 3s and timeout is 5s → fetch wins (success)
  // If fetch takes 7s and timeout is 5s → timeout wins (error)
}

/**
 * Promise.allSettled - Wait for all, get all results (NEVER rejects)
 * 
 * BEHAVIOR:
 * - ALWAYS RESOLVES when all promises have settled
 * - Returns array of objects: { status: 'fulfilled'|'rejected', value|reason }
 * 
 * USE CASE: Multiple operations where you want all results regardless of failures
 * Perfect for batch operations like uploading multiple files
 * 
 * KEY DIFFERENCE from Promise.all: This NEVER rejects
 * 
 * @param files - Array of files to upload
 * @returns Object with successful and failed uploads
 */
async function processMultipleUploads(files: File[]): Promise<{
  successful: string[];
  failed: Error[];
}> {
  // Start all uploads in parallel
  // Even if some fail, we wait for ALL to complete
  const results = await Promise.allSettled(
    files.map(file => uploadFile(file))
  );
  
  // results array looks like:
  // [
  //   { status: 'fulfilled', value: 'file1.jpg uploaded' },
  //   { status: 'rejected', reason: Error('file2.jpg too large') },
  //   { status: 'fulfilled', value: 'file3.jpg uploaded' }
  // ]
  
  const successful = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value);
  
  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason);
  
  return { successful, failed };
}

/**
 * Promise.any - First to fulfill wins (ignores rejections)
 * 
 * BEHAVIOR:
 * - RESOLVES as soon as ANY promise fulfills
 * - IGNORES rejections as long as one might still succeed
 * - REJECTS only if ALL promises reject (AggregateError)
 * 
 * USE CASE: Multiple redundant sources, use fastest successful one
 * Perfect for fetching from multiple CDNs/mirrors
 * 
 * ANALOGY: Like asking 3 friends for a book
 * Take it from whoever brings it first
 * 
 * @param resource - Resource path to fetch
 * @returns Promise with response from fastest CDN
 */
function fetchFromMultipleCDNs(resource: string): Promise<Response> {
  return Promise.any([
    fetch(`https://cdn1.example.com/${resource}`),  // Might be slow
    fetch(`https://cdn2.example.com/${resource}`),  // Might be down
    fetch(`https://cdn3.example.com/${resource}`)   // Might be fast!
  ]);
  // Scenario 1: CDN3 responds in 50ms → resolves with CDN3's response
  // Scenario 2: CDN1 fails, CDN2 fails, CDN3 succeeds → resolves with CDN3
  // Scenario 3: ALL fail → rejects with AggregateError
}

// ============================================================================
// SECTION 2: ASYNC/AWAIT MASTERY
// ============================================================================

/**
 * Error Handling Pattern 1: Try-Catch for single operations
 * 
 * PURPOSE: Wrap async operations to handle errors gracefully
 * 
 * WHEN TO USE: Single async operation where you want to:
 * - Log the error for debugging
 * - Transform the error message
 * - Add context to the error
 * - Decide whether to re-throw or return default
 * 
 * @param id - User ID to fetch
 * @returns User object or throws error
 */
async function fetchUser(id: number): Promise<any> {
  try {
    // Attempt the async operation
    const response = await fetch(`/api/users/${id}`);
    
    // Check if HTTP request was successful (status 200-299)
    // fetch() doesn't throw on 404 or 500, so we check manually
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parse JSON response (can also throw if invalid JSON)
    return await response.json();
  } catch (error) {
    // This catches:
    // 1. Network errors (no internet, DNS failure)
    // 2. Our custom HTTP error thrown above
    // 3. JSON parsing errors
    // 4. Any other errors in try block
    
    console.error('Failed to fetch user:', error);
    
    // DECISION POINT: Re-throw or return default?
    throw error; // Re-throw: Let caller handle it
    // OR
    // return null; // Return default: Handle it here
  }
}

/**
 * SEQUENTIAL vs PARALLEL vs MIXED Execution
 * 
 * Understanding when to use each pattern is crucial for performance
 */

/**
 * SEQUENTIAL - Slow (waits for each to complete)
 * 
 * EXECUTION FLOW:
 * 0ms:    Start user fetch
 * 1000ms: User completes, START posts fetch
 * 2000ms: Posts completes, START comments fetch
 * 3000ms: Comments completes
 * TOTAL: 3 seconds (1s + 1s + 1s)
 * 
 * PROBLEM: Each 'await' BLOCKS until promise resolves
 * WASTEFUL because these requests are independent!
 * 
 * WHEN TO USE: Only when requests have DEPENDENCIES
 */
async function sequentialFetch(): Promise<any> {
  const user = await fetch('/api/user').then(r => r.json());      // Wait 1s
  const posts = await fetch('/api/posts').then(r => r.json());    // Wait 1s
  const comments = await fetch('/api/comments').then(r => r.json()); // Wait 1s
  return { user, posts, comments };
  // Total: 3 seconds wasted
}

/**
 * PARALLEL - Fast (all requests start simultaneously)
 * 
 * EXECUTION FLOW:
 * 0ms:    Start ALL THREE fetches at same time
 * 1000ms: All complete (assuming each takes ~1s)
 * TOTAL: 1 second (max of all, NOT sum)
 * 
 * PERFORMANCE GAIN: 3x faster than sequential
 * 
 * WHEN TO USE: Requests are INDEPENDENT (no dependencies)
 * 
 * TRADE-OFF: If ANY fails, entire operation fails
 */
async function parallelFetch(): Promise<any> {
  // All three fetch calls execute immediately
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then(r => r.json()),     // Starts at 0ms
    fetch('/api/posts').then(r => r.json()),    // Starts at 0ms (parallel!)
    fetch('/api/comments').then(r => r.json())  // Starts at 0ms (parallel!)
  ]);
  return { user, posts, comments };
}

/**
 * MIXED - When there are dependencies (hybrid approach)
 * 
 * EXECUTION FLOW:
 * 0ms:    Start user fetch (MUST complete first)
 * 1000ms: User completes, extract user.id
 *         NOW start posts AND friends in parallel
 * 2000ms: Both complete
 * TOTAL: 2 seconds (1s sequential + 1s parallel)
 * 
 * OPTIMIZATION STRATEGY:
 * 1. Sequential for dependencies
 * 2. Parallel for independents
 * 
 * @param userId - User ID to fetch data for
 */
async function mixedFetch(userId: number): Promise<any> {
  // STEP 1: Sequential - Get user data first (dependency)
  const user = await fetch(`/api/users/${userId}`).then(r => r.json());
  
  // STEP 2: Parallel - Fetch related data simultaneously
  const [posts, friends] = await Promise.all([
    fetch(`/api/users/${user.id}/posts`).then(r => r.json()),
    fetch(`/api/users/${user.id}/friends`).then(r => r.json())
  ]);
  
  return { user, posts, friends };
}

// ============================================================================
// SECTION 3: ADVANCED PATTERNS
// ============================================================================

/**
 * Promise Cancellation using AbortController
 * 
 * PURPOSE: Cancel in-flight HTTP requests
 * Common use case: User types in search, cancel previous searches
 * 
 * HOW IT WORKS:
 * 1. Create AbortController - gives signal and abort() method
 * 2. Pass signal to fetch() - links request to controller
 * 3. Call abort() - triggers cancellation, fetch throws AbortError
 * 
 * BENEFITS:
 * - Saves bandwidth
 * - Prevents race conditions
 * - Improves performance
 */
class CancellableRequest {
  private controller: AbortController;
  
  constructor() {
    this.controller = new AbortController();
  }
  
  /**
   * Fetch with cancellation support
   * @param url - URL to fetch
   * @returns Promise with response or null if cancelled
   */
  async fetch(url: string): Promise<any | null> {
    try {
      // Pass signal to fetch - links request to controller
      const response = await fetch(url, {
        signal: this.controller.signal
      });
      return await response.json();
    } catch (error: any) {
      // When abort() is called, fetch throws AbortError
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
        return null;
      }
      throw error;
    }
  }
  
  /**
   * Cancel the request
   * Calling abort() will:
   * 1. Stop network request immediately
   * 2. Cause fetch() to throw AbortError
   * 3. Trigger catch block
   */
  cancel(): void {
    this.controller.abort();
  }
}

/**
 * Timeout Handling - Simple wrapper
 * 
 * @param promise - Promise to add timeout to
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects if timeout exceeded
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);
}

/**
 * Retry Logic with Exponential Backoff
 * 
 * EXPONENTIAL BACKOFF: Delays increase exponentially
 * Attempt 1: 1s, Attempt 2: 2s, Attempt 3: 4s, Attempt 4: 8s
 * 
 * JITTER: Add randomness to prevent thundering herd
 * Multiple clients don't retry at exact same time
 * 
 * @param fn - Function to retry
 * @param maxAttempts - Maximum retry attempts
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay cap
 * @returns Promise with result or throws after max attempts
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 5,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
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
  
  throw new Error('Should never reach here');
}

// ============================================================================
// SECTION 4: CONCURRENCY CONTROL
// ============================================================================

/**
 * Rate Limiter - Token Bucket Algorithm
 * 
 * PURPOSE: Limit number of concurrent operations
 * Prevents overwhelming server or hitting rate limits
 * 
 * EXAMPLE: Max 5 requests per second
 */
class RateLimiter {
  private maxRequests: number;
  private timeWindow: number;
  private queue: Array<() => void> = [];
  private activeRequests: number = 0;
  
  /**
   * @param maxRequests - Maximum concurrent requests
   * @param timeWindow - Time window in milliseconds
   */
  constructor(maxRequests: number, timeWindow: number) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }
  
  /**
   * Execute function with rate limiting
   * @param fn - Function to execute
   * @returns Promise with function result
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait if at capacity
    while (this.activeRequests >= this.maxRequests) {
      await new Promise<void>(resolve => this.queue.push(resolve));
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
          resolve?.();
        }
      }, this.timeWindow);
    }
  }
}

/**
 * Task Queue with Concurrency Limits
 * 
 * PURPOSE: Process many tasks with limited concurrency
 * Example: Process 100 items with max 5 concurrent operations
 */
class TaskQueue {
  private concurrency: number;
  private running: number = 0;
  private queue: Array<() => void> = [];
  
  constructor(concurrency: number = 3) {
    this.concurrency = concurrency;
  }
  
  /**
   * Add task to queue
   * @param task - Async task to execute
   * @returns Promise with task result
   */
  async add<T>(task: () => Promise<T>): Promise<T> {
    // Wait if at capacity
    while (this.running >= this.concurrency) {
      await new Promise<void>(resolve => this.queue.push(resolve));
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
  
  /**
   * Add multiple tasks
   * @param tasks - Array of tasks
   * @returns Promise with all results
   */
  async addAll<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(tasks.map(task => this.add(task)));
  }
}

// ============================================================================
// SECTION 5: REAL INTERVIEW QUESTIONS
// ============================================================================

/**
 * INTERVIEW QUESTION 1: Implement Promise.all from Scratch
 * 
 * Difficulty: Mid
 * Companies: Google, Microsoft, Amazon, Meta
 * 
 * Requirements:
 * - Return new Promise
 * - Resolve when all promises resolve
 * - Reject immediately on any failure
 * - Maintain order of results
 * 
 * @param promises - Array of promises
 * @returns Promise that resolves with array of results
 */
function promiseAll<T>(promises: Array<Promise<T>>): Promise<T[]> {
  return new Promise((resolve, reject) => {
    // Handle empty array
    if (promises.length === 0) {
      resolve([]);
      return;
    }
    
    const results: T[] = new Array(promises.length);
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

/**
 * INTERVIEW QUESTION 2: Request Deduplication
 * 
 * Difficulty: Senior
 * Companies: Netflix, Amazon, Google
 * 
 * PURPOSE: Multiple components request same data simultaneously
 * Ensure only ONE actual request is made
 * All callers receive same result
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  
  /**
   * Fetch with deduplication
   * @param key - Unique key for request
   * @param fetchFn - Function that performs fetch
   * @returns Promise with result
   */
  async fetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // Check if request already in flight
    if (this.pendingRequests.has(key)) {
      console.log(`Reusing pending request for: ${key}`);
      return this.pendingRequests.get(key)!;
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
}

// ============================================================================
// SECTION 6: COMMON PITFALLS
// ============================================================================

/**
 * PITFALL 1: Floating Promises (Unhandled Promises)
 * 
 * BAD: Promise created but not awaited or handled
 */
async function badFloatingPromise(): Promise<string> {
  fetchData(); // ❌ Floating promise - errors won't be caught
  return 'done';
}

/**
 * GOOD: Properly await or handle
 */
async function goodHandledPromise(): Promise<string> {
  await fetchData(); // ✅ Awaited
  return 'done';
}

/**
 * PITFALL 2: forEach with async
 * 
 * BAD: forEach doesn't wait for async operations
 */
async function badForEach(items: any[]): Promise<void> {
  items.forEach(async (item) => {
    await processItem(item); // ❌ Not actually awaited by forEach
  });
  console.log('Done'); // Logs before items are processed!
}

/**
 * GOOD: Use for...of or Promise.all
 */
async function goodForLoop(items: any[]): Promise<void> {
  // Sequential
  for (const item of items) {
    await processItem(item); // ✅ Properly awaited
  }
  
  // Or parallel
  await Promise.all(items.map(item => processItem(item))); // ✅
}

// ============================================================================
// HELPER FUNCTIONS (for examples above)
// ============================================================================

async function uploadFile(file: File): Promise<string> {
  // Simulate file upload
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.3) {
        resolve(`${file.name} uploaded`);
      } else {
        reject(new Error(`${file.name} failed`));
      }
    }, 1000);
  });
}

async function fetchData(): Promise<any> {
  return fetch('/api/data').then(r => r.json());
}

async function processItem(item: any): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Processed:', item);
}

// ============================================================================
// EXPORT FOR USE IN OTHER FILES
// ============================================================================

export {
  // Promise Fundamentals
  demonstratePromiseStates,
  fetchUserDataWithPromiseAll,
  fetchWithTimeout,
  processMultipleUploads,
  fetchFromMultipleCDNs,
  
  // Async/Await
  fetchUser,
  sequentialFetch,
  parallelFetch,
  mixedFetch,
  
  // Advanced Patterns
  CancellableRequest,
  withTimeout,
  retryWithBackoff,
  
  // Concurrency Control
  RateLimiter,
  TaskQueue,
  
  // Interview Questions
  promiseAll,
  RequestDeduplicator
};

/**
 * ============================================================================
 * QUICK REFERENCE GUIDE
 * ============================================================================
 * 
 * Promise Combinators:
 * - Promise.all([p1, p2])     → All must succeed, fail fast
 * - Promise.race([p1, p2])    → First to settle wins
 * - Promise.allSettled([...]) → Wait for all, never rejects
 * - Promise.any([p1, p2])     → First to fulfill wins
 * 
 * Execution Patterns:
 * - Sequential: await p1; await p2; await p3;  (slow)
 * - Parallel:   await Promise.all([p1, p2, p3]) (fast)
 * - Mixed:      await p1; await Promise.all([p2, p3]) (optimal)
 * 
 * Error Handling:
 * - try/catch with async/await
 * - .catch() with promises
 * - Promise.allSettled() for partial failures
 * 
 * Performance Tips:
 * - Use parallel when possible
 * - Batch operations with limits
 * - Cache results (deduplication)
 * - Cancel unnecessary work (AbortController)
 * 
 * ============================================================================
 */
