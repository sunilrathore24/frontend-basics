# The JavaScript Masterbook — Core Concepts (Pages 601–765)

> Source: *The JavaScript Masterbook* by Upamanyu Deka

---

 
600
- **Storage limits** - Offline storage quotas vary by browser and may be cleared if the user's device 
runs low on space. Use caching judiciously and provide mechanisms to clear old caches. 
- **Update lifecycle** - Service workers are versioned. Updating a service worker requires careful 
handling of the `install` and `activate` events to avoid serving stale assets. Use `skipWaiting()` and 
`clients.claim()` appropriately to control when the new worker takes over. 
- **Testing offline** - Simulate offline conditions using browser dev tools. Ensure that your PWA 
behaves gracefully when network requests fail. 
 
## Practice questions 
 
1. **Theory:** Compare and contrast the cache-first and network-first caching strategies. When 
would you choose each? 
2. **Coding:** Write a service worker that serves a cached image gallery from the cache if available, 
fetches from the network otherwise, and updates the cache in the background. 
3. **Theory:** Why is an `offline.html` fallback page important in a PWA? How would you cache and 
serve it? 
4. **Coding:** Describe how you would implement background sync using the service worker to 
ensure a form submission succeeds even when the user goes offline after submitting. 
 
 
 


---

 
601
What is the difference between deep clone and 
structuredClone for complex objects? 
# What Is the Difference Between Deep Clone and `structuredClone()` for Complex Objects? 
 
Copying objects in JavaScript seems straightforward, but under the hood it can be tricky. Shallow 
copies (e.g. using spread syntax `{...obj}`) duplicate only the top level, leaving nested objects shared 
between the original and the copy. **Deep cloning** aims to create a complete, independent copy 
of the entire data structure. Historically, developers wrote custom deep copy functions or used 
`JSON.parse(JSON.stringify(obj))` with all its limitations. The `structuredClone()` method, introduced 
in modern browsers and Node.js, offers a built-in alternative for duplicating complex objects. This 
article compares these approaches and highlights their differences. 
 
## Custom deep cloning 
 
Deep cloning is usually implemented by recursively copying properties. The simplest approach 
serializes to JSON and parses back: 
 
```js 
const original = { name: "Alice", nested: { arr: [1, 2] } }; 
const copy = JSON.parse(JSON.stringify(original)); 
copy.nested.arr.push(3); 
 
console.log(original.nested.arr); // [1, 2] - unaffected 
``` 
 
However, this method has significant drawbacks: 
 
- **Loss of non-JSON types** - `undefined`, functions, symbols, dates, regexes, `Map`, `Set`, `Error` 
objects, and custom prototypes are lost or converted to plain objects. For example, dates become 
strings and cannot be converted back automatically. 
- **Circular references** - If an object references itself or contains cycles, `JSON.stringify()` throws a 
`TypeError`. You must write custom logic to track references and rebuild cycles. 
- **Prototypes and descriptors** - JSON serialization ignores property descriptors, getters/setters, 
and prototype chains. The copied object becomes a simple object literal. 


---

 
602
- **Performance** - Large objects are serialized into strings, which can be slow and 
memory-intensive. 
 
To overcome these limitations, developers often write or use deep-clone utilities that handle special 
cases, but these can be error-prone and heavy. 
 
## `structuredClone()` 
 
The global `structuredClone()` method implements the **structured clone algorithm**, which is the 
same algorithm used by `postMessage()` to copy data between windows or workers. It supports a 
wide range of built-in types, including: 
 
- Objects, arrays and nested primitives 
- Dates, RegExps, `Map`, `Set` 
- Typed arrays, ArrayBuffers, DataViews 
- Errors, Blob/File objects, ImageBitmaps 
- Circular references and cyclic graphs 
 
It does _not_ support functions, DOM nodes, WeakMaps/Sets, or objects with private properties. 
The cloned object has the same prototype as the original (except where prototypes are not 
cloneable). 
 
Example: 
 
```js 
const original = { 
  date: new Date(), 
  regex: /hello/gi, 
  map: new Map([[1, "one"]]), 
  set: new Set([1, 2, 3]), 
  buffer: new Uint8Array([1, 2, 3]).buffer, 
}; 
 


---

 
603
const clone = structuredClone(original); 
console.log(clone.date instanceof Date); // true 
console.log(clone.regex instanceof RegExp); // true 
console.log(clone.map instanceof Map); // true 
console.log(clone.set instanceof Set); // true 
console.log(clone.buffer instanceof ArrayBuffer); // true 
``` 
 
Notice that the cloned values retain their constructors and behave like the originals. Circular 
references are also handled gracefully: 
 
```js 
const obj = {}; 
obj.self = obj; 
const clone = structuredClone(obj); 
console.log(clone.self === clone); // true 
``` 
 
### Transferable objects 
 
`structuredClone()` also supports transferring ownership of certain objects—such as `ArrayBuffer`, 
`MessagePort`, `OffscreenCanvas`—rather than cloning them. To transfer an object, pass it via the 
second argument: 
 
```js 
const buffer = new ArrayBuffer(8); 
const clone = structuredClone(buffer, { transfer: [buffer] }); 
// After transfer, `buffer` is detached and cannot be used 
console.log(buffer.byteLength); // 0 
console.log(clone.byteLength); // 8 
``` 
 


---

 
604
This is useful when moving large buffers between workers to avoid expensive copying. 
 
## Choosing the right approach 
 
- **Use `structuredClone()` whenever available** - It handles many built-in types, supports cycles, 
and preserves prototypes. It is now supported in modern browsers and Node.js. 
- **Avoid JSON cloning for complex data** - Only use `JSON.stringify()`/`parse()` when the data 
consists of simple, JSON-safe values and performance is not critical. 
- **Custom deep cloning when necessary** - If you need to clone functions, classes with custom 
prototypes, or special objects not supported by `structuredClone()`, you may need a bespoke 
solution. 
 
## Practice questions 
 
1. **Theory:** What limitations does `JSON.stringify()` have when used for deep cloning? Provide at 
least three examples of data types that are not preserved. 
2. **Coding:** Write a function that uses `structuredClone()` to clone an object containing a `Map` 
and a `Set`. Verify that the cloned object's values are of the correct types. 
3. **Theory:** Explain what happens when you attempt to structured-clone an object containing a 
function property. How would you handle cloning such objects? 
4. **Coding:** Demonstrate how to use the `transfer` option of `structuredClone()` to move an 
`ArrayBuffer` to a web worker. Show that the original buffer becomes detached. 
 
 
 


---

 
605
How do custom iterators work and how can you build 
your own iterable object? 
# How Do Custom Iterators Work and How Can You Build Your Own Iterable Object? 
 
JavaScript's iteration protocols allow objects to define their own iteration behaviour so that they can 
be used in `for...of` loops, spread syntax, destructuring and other iterable contexts. Understanding 
how these protocols work enables you to create custom iterable data structures such as ranges, 
linked lists or streams. 
 
## The Iterable and Iterator protocols 
 
Two related protocols govern iteration: 
 
1. **Iterable** - An object is iterable if it has a method keyed by `Symbol.iterator` that returns an 
_iterator_. 
2. **Iterator** - An iterator is an object with a `next()` method that returns an object of the form `{ 
value, done }`. Each call to `next()` returns the next value in the sequence and sets `done` to `true` 
when iteration is complete. 
 
The `for...of` loop calls the iterable's `[Symbol.iterator]()` method to get an iterator and then 
repeatedly calls `next()` until `done` is `true`. 
 
## Building a custom iterable 
 
Consider creating a simple range object that yields numbers from `start` (inclusive) to `end` 
(exclusive) in steps of 1: 
 
```js 
// Range constructor 
function Range(start, end) { 
  this.start = start; 
  this.end = end; 
} 


---

 
606
 
// Define the iterator on the prototype 
Range.prototype[Symbol.iterator] = function () { 
  let current = this.start; 
  const end = this.end; 
  return { 
    next() { 
      if (current < end) { 
        return { value: current++, done: false }; 
      } 
      return { done: true }; 
    }, 
  }; 
}; 
 
const range = new Range(3, 7); 
for (const n of range) { 
  console.log(n); // 3, 4, 5, 6 
} 
``` 
 
### Explanation 
 
- The `Range` constructor stores the start and end values. 
- `Range.prototype[Symbol.iterator]` returns an iterator object with a `next()` method. 
- Inside `next()`, we keep track of the current value. Each call returns an object with the next value 
and `done: false`, then increments the value. When we reach the end, `done` becomes `true` and the 
value property can be omitted or set to `undefined`. 
 
This pattern allows `range` to be used with any construct that consumes iterables: 
 
```js 


---

 
607
console.log([...range]); // [3, 4, 5, 6] 
const [first, ...rest] = range; 
console.log(first, rest); // 3 [4, 5, 6] 
``` 
 
## Using generator functions 
 
Writing iterators by hand can be verbose. **Generator functions** (`function*`) simplify the process 
by managing the internal state for you. If a generator function includes a `yield` expression, it 
implicitly implements the iterator protocol: 
 
```js 
function* rangeGenerator(start, end) { 
  for (let i = start; i < end; i++) { 
    yield i; 
  } 
} 
 
const genRange = rangeGenerator(3, 7); 
for (const n of genRange) { 
  console.log(n); // 3, 4, 5, 6 
} 
 
// Generators can be called again to start over 
console.log([...rangeGenerator(1, 4)]); // [1, 2, 3] 
``` 
 
The `yield` keyword suspends the generator, preserving its state. Each call to `next()` resumes 
execution until the next `yield` and returns the yielded value. When the function completes, the 
iterator indicates `done: true`. 
 
## Designing your own iterable objects 


---

 
608
 
When designing custom iterables, consider: 
 
- **State management** - Decide how you will track progress (e.g. an index, a pointer to a node, 
etc.). Avoid modifying the iterable object itself if you want to allow multiple simultaneous iterators. 
- **Reusability** - Objects with a `[Symbol.iterator]` method that returns a _new iterator_ each time 
allow multiple independent iterations. If you return the same iterator instance, repeated iterations 
will pick up where the previous one left off. 
- **Infinite sequences** - You can model potentially infinite sequences (e.g. Fibonacci numbers, 
random values) with iterators. Consumers decide when to stop iterating (e.g. using `break` in a loop). 
- **Error handling and cleanup** - Iterators can implement `return()` and `throw()` methods that 
are called when iteration terminates early or encounters an error. These methods let you release 
resources or propagate errors properly. 
 
## Practice questions 
 
1. **Theory:** Explain the roles of `Symbol.iterator` and `next()` in enabling iteration over an object. 
Why does the iterator return an object with `value` and `done` properties? 
2. **Coding:** Implement an iterable that yields only the even numbers within a given inclusive 
range. Provide both a hand-written iterator and a generator implementation. 
3. **Theory:** Discuss the trade-offs between implementing an iterator manually and using a 
generator function. When might you choose one approach over the other? 
4. **Coding:** Design a custom iterable that walks a binary tree in in-order traversal. Use either an 
explicit stack or a generator to implement the traversal. 
 
 
 


---

 
609
What are ArrayBuffer and TypedArray, and how are they 
different from Arrays? 
# What Are `ArrayBuffer` and Typed Arrays and How Are They Different from Arrays? 
 
Working with raw binary data in JavaScript is common in applications such as audio/video 
processing, cryptography, file parsing and WebGL. Standard JavaScript arrays are designed for 
general-purpose use and store references to any type of value. **`ArrayBuffer`** and **typed 
array** views provide a way to handle fixed-length binary data efficiently and interoperably with 
native APIs. 
 
## `ArrayBuffer` — a raw block of memory 
 
An `ArrayBuffer` represents a generic, fixed-length block of memory. It contains bytes of data but has 
no knowledge of how to interpret them. You cannot read or write bytes directly on the `ArrayBuffer`; 
instead, you use one of the typed array classes or a `DataView` to access the bytes: 
 
```js 
const buffer = new ArrayBuffer(8); // 8 bytes (64 bits) 
console.log(buffer.byteLength); // 8 
 
// Create a view to interpret the buffer as 32-bit integers 
const int32View = new Int32Array(buffer); 
int32View[0] = 42; 
int32View[1] = -1; 
console.log(int32View); // Int32Array [ 42, -1 ] 
 
// Underlying memory is shared across views 
const uint8View = new Uint8Array(buffer); 
console.log(uint8View); // Uint8Array [ 42, 0, 255, 255, 0, 0, 0, 0 ] 
``` 
 


---

 
610
In this example, writing to the `Int32Array` view affects the underlying buffer, and the `Uint8Array` 
view reveals the same data as bytes. This shared memory model makes typed arrays efficient for 
processing binary data. 
 
## Typed arrays — strongly typed views on buffers 
 
Typed arrays are array-like objects that view an `ArrayBuffer` through a specific numeric type. There 
are multiple typed array classes, each corresponding to a C-style numeric type: 
 
- `Int8Array`, `Uint8Array`, `Uint8ClampedArray` 
- `Int16Array`, `Uint16Array` 
- `Int32Array`, `Uint32Array` 
- `Float32Array`, `Float64Array` 
 
When you create a typed array, you specify either an existing `ArrayBuffer` and an optional byte 
offset/length, or a length in elements (in which case a new buffer is created). Typed arrays: 
 
- Have a fixed length; you cannot change their size after creation. 
- Store numbers in a compact binary representation (1, 2, 4 or 8 bytes per element), offering 
performance and memory advantages over regular arrays. 
- Provide a subset of array methods (`map`, `forEach`, `reduce`, etc.) but do not support methods 
that add or remove elements (`push`, `pop`, `shift`, `unshift`, `splice`). 
- Are not real arrays: `Array.isArray(typedArray)` returns `false` and they do not inherit from 
`Array.prototype`. 
 
Example of creating and using a typed array: 
 
```js 
const floats = new Float32Array(3); // Creates a buffer of 12 bytes (3 × 4 bytes) 
floats[0] = Math.PI; 
floats[1] = Math.E; 
floats[2] = 1 / 3; 
floats.forEach((f) => console.log(f.toFixed(3))); // 3.142, 2.718, 0.333 


---

 
611
 
// Create a subarray that views part of the original buffer 
const sub = new Float32Array(floats.buffer, 4, 2); 
console.log(sub); // Float32Array [ 2.718, 0.333 ] 
``` 
 
Because typed arrays interpret binary data as numbers, they are useful for interacting with Web APIs 
that require specific binary formats, such as WebGL textures or audio buffers. 
 
## Differences from normal arrays 
 
1. **Type enforcement and byte length** - Regular arrays can store any type of value, and each 
element is a reference. Typed arrays store only numbers of a specific size and type, which allows for 
contiguous memory allocation and faster processing by the JS engine. 
2. **Fixed size** - Typed arrays have a fixed length and cannot be resized. Arrays can grow and 
shrink. 
3. **Methods** - Typed arrays support only a subset of array methods and do not allow structural 
changes like `push`/`pop`. Many methods return _new_ typed arrays of the same type, not generic 
arrays. 
4. **Sharing memory** - Multiple typed array views can point to the same `ArrayBuffer`, enabling 
you to interpret the same bytes in different ways. Regular arrays do not share underlying storage. 
5. **Use cases** - Typed arrays are ideal for binary data, whereas arrays are general-purpose 
collections. 
 
## Using `DataView` for arbitrary layouts 
 
If you need to read or write data types not covered by typed arrays (e.g. 64-bit integers, non-aligned 
values, or bitfields), use the `DataView` interface. It provides methods like `getUint32()`, 
`getFloat64()`, `setUint8()`, etc., with explicit byte offsets and endianness control. 
 
```js 
const buffer = new ArrayBuffer(10); 
const view = new DataView(buffer); 
view.setUint8(0, 0xff); 


---

 
612
view.setInt16(1, -32768, true); // little-endian 
console.log(view.getInt16(1, true)); // -32768 
``` 
 
## Practice questions 
 
1. **Theory:** Explain why typed arrays cannot change size after creation. How does this property 
benefit performance? 
2. **Coding:** Create a 16-bit PCM audio buffer of length 44100 (1 second at 44.1 kHz) using 
`Int16Array`. Fill it with a sine wave at 440 Hz. 
3. **Theory:** Why would you use a `DataView` instead of a typed array? Give an example scenario. 
4. **Coding:** Write a function that takes a buffer containing little-endian 32-bit floats and returns 
an array of the corresponding JavaScript numbers using `DataView`. 
 
 
 


---

 
613
What are SharedArrayBuffer and Atomics, and how do 
they enable thread safety? 
# What Are `SharedArrayBuffer` and `Atomics` and How Do They Enable Thread Safety? 
 
JavaScript was historically single-threaded, meaning that web developers didn't need to think about 
data races. With the introduction of **Web Workers**, the language gained multi-threading. 
However, without shared memory each worker could only communicate via message passing. 
**`SharedArrayBuffer`** and the **`Atomics`** API introduce a new model: multiple threads 
(workers and the main thread) can share a common block of memory, and atomic operations ensure 
safe concurrent access. This enables new patterns, such as shared memory buffers for 
high-performance computing, but also requires careful programming to avoid race conditions. 
 
## SharedArrayBuffer — shared memory 
 
`SharedArrayBuffer` is similar to `ArrayBuffer` but its contents are shared between workers. When 
you post a `SharedArrayBuffer` to another thread (e.g. via `postMessage()`), both threads hold a 
reference to the same underlying memory; modifying it in one thread immediately reflects in the 
other. Unlike ordinary buffers, transferring a `SharedArrayBuffer` does not detach it. 
 
```js 
// Main thread 
const shared = new SharedArrayBuffer(4); // 4 bytes 
const int32 = new Int32Array(shared); 
const worker = new Worker("worker.js"); 
worker.postMessage(shared); 
int32[0] = 42; 
 
// worker.js 
self.onmessage = (e) => { 
  const shared = e.data; 
  const int32 = new Int32Array(shared); 
  console.log("Received value:", int32[0]); // 42 
}; 
``` 


---

 
614
 
Because memory is shared, two threads can modify the same index concurrently. Without 
coordination, this leads to race conditions (lost updates, inconsistent state). To safely synchronise 
reads and writes, you must use the `Atomics` API. 
 
## Atomics — atomic operations and memory fencing 
 
The `Atomics` namespace provides low-level functions that perform **atomic** operations on 
shared typed arrays. Atomic operations complete as a single, indivisible step: no other thread can 
observe an intermediate state. Additionally, these functions perform **memory fencing**, which 
ensures that reads and writes occur in the intended order across threads. 
 
### Common operations 
 
- `Atomics.load(typedArray, index)` - Reads a value from a shared typed array with a memory fence. 
- `Atomics.store(typedArray, index, value)` - Writes a value atomically. 
- `Atomics.exchange(typedArray, index, value)` - Atomically replaces a value and returns the old 
value. 
- `Atomics.add(typedArray, index, value)` / `sub()` / `and()` / `or()` - Performs read-modify-write 
atomically. 
- `Atomics.compareExchange(typedArray, index, expected, replacement)` - Compares the current 
value to `expected`; if equal, writes `replacement` and returns the old value. Otherwise, returns the 
current value. 
- `Atomics.wait(typedArray, index, value[, timeout])` and `Atomics.notify(typedArray, index, count)` - 
Provide blocking/wake mechanisms, allowing threads to sleep until a value changes. 
 
These operations only work on integer typed arrays (`Int8Array`, `Uint8Array`, `Int16Array`, 
`Uint16Array`, `Int32Array`, `Uint32Array`) backed by a `SharedArrayBuffer`. They do not work on 
floating-point arrays. 
 
### Example: Shared counter 
 
Consider two workers incrementing a shared counter. Without atomic operations, increments might 
be lost if both read the old value simultaneously. With `Atomics.add()`, each increment is 
thread-safe: 
 


---

 
615
```js 
// main.js 
const shared = new SharedArrayBuffer(4); 
const counter = new Int32Array(shared); 
const workers = [new Worker("incr.js"), new Worker("incr.js")]; 
workers.forEach((w) => w.postMessage(shared)); 
 
// incr.js 
self.onmessage = (e) => { 
  const counter = new Int32Array(e.data); 
  for (let i = 0; i < 1_000_000; i++) { 
    Atomics.add(counter, 0, 1); 
  } 
  // Notify main thread 
  postMessage("done"); 
}; 
 
// Back in main.js: wait for workers to finish 
let finished = 0; 
workers.forEach((w) => { 
  w.onmessage = () => { 
    finished++; 
    if (finished === workers.length) { 
      console.log("Final count:", counter[0]); // 2,000,000 
    } 
  }; 
}); 
``` 
 
Here, `Atomics.add(counter, 0, 1)` ensures each worker's increment is applied atomically and no 
updates are lost. Without `Atomics`, you might see a value less than two million. 


---

 
616
 
### Blocking with `wait` and `notify` 
 
In addition to arithmetic operations, `Atomics.wait()` allows a thread to block until a specific memory 
location changes. This is analogous to condition variables or futexes in other languages. Only web 
workers can block; the main thread cannot call `Atomics.wait()` because it would freeze the UI. 
 
```js 
// waitingWorker.js 
self.onmessage = (e) => { 
  const arr = new Int32Array(e.data); 
  // Wait until arr[0] becomes non-zero 
  Atomics.wait(arr, 0, 0); 
  console.log("Value changed:", Atomics.load(arr, 0)); 
}; 
 
// notifyingWorker.js 
self.onmessage = (e) => { 
  const arr = new Int32Array(e.data); 
  Atomics.store(arr, 0, 123); 
  Atomics.notify(arr, 0, 1); 
}; 
``` 
 
## Security and cross-origin isolation 
 
Due to vulnerabilities like Spectre, browsers restrict the usage of `SharedArrayBuffer` and Atomics. To 
use them, your site must be served over HTTPS and set the response headers: 
 
``` 
Cross-Origin-Embedder-Policy: require-corp 
Cross-Origin-Opener-Policy: same-origin 


---

 
617
``` 
 
These headers enable a _cross-origin isolated_ environment, preventing certain side-channel attacks. 
Without them, `SharedArrayBuffer` will be unavailable. 
 
## Practice questions 
 
1. **Theory:** Why can race conditions occur when multiple workers modify the same 
`SharedArrayBuffer` without atomics? Provide an example scenario. 
2. **Coding:** Implement a simple producer/consumer queue using a `SharedArrayBuffer` and 
`Atomics.wait()`/`Atomics.notify()`. The producer writes numbers to the buffer, and the consumer 
waits for new data. 
3. **Theory:** What are the security requirements for using `SharedArrayBuffer` on the web? Why 
are they necessary? 
4. **Coding:** Demonstrate using `Atomics.compareExchange()` to implement a lock mechanism 
that allows only one worker at a time to enter a critical section. 
 
 
 


---

 
618
How do WeakRefs and FinalizationRegistry help manage 
memory? 
# How Do `WeakRef` and `FinalizationRegistry` Help Manage Memory? 
 
JavaScript's garbage collector automatically reclaims memory occupied by objects that are no longer 
reachable. However, certain patterns—such as caches, memoization and object graphs with cycles—
can lead to unintended memory retention. The ECMAScript **`WeakRef`** and 
**`FinalizationRegistry`** APIs provide a way to hold "weak" references to objects so that they don't 
prevent garbage collection, and to run cleanup code when objects are reclaimed. These features are 
advanced and should be used sparingly, but they can help manage memory in long-running 
applications. 
 
## Strong vs weak references 
 
A **strong reference** is the default—if an object is referenced by a variable, property, array 
element or any reachable data structure, it cannot be garbage collected. Memory leaks occur when 
you store objects in global caches or maps and never remove them. 
 
A **weak reference** does not prevent an object from being collected. If the object is no longer 
strongly reachable elsewhere, the garbage collector may reclaim it and the weak reference becomes 
invalid. This is where `WeakRef` and `FinalizationRegistry` come into play. 
 
## `WeakRef` 
 
`WeakRef` wraps an object to create a weak reference. You can call `.deref()` to obtain the original 
object if it hasn't been collected. If the object has been collected, `.deref()` returns `undefined`. 
 
```js 
class Cache { 
  constructor() { 
    this.map = new Map(); 
  } 
  get(key) { 
    const ref = this.map.get(key); 


---

 
619
    return ref && ref.deref(); 
  } 
  set(key, value) { 
    this.map.set(key, new WeakRef(value)); 
  } 
} 
 
const cache = new Cache(); 
let obj = { data: "expensive" }; 
cache.set("exp", obj); 
console.log(cache.get("exp")); // { data: 'expensive' } 
obj = null; // Remove strong reference 
// At some point later, obj may be garbage collected 
``` 
 
In this cache example, the map holds only weak references. If the original strong reference (`obj`) is 
dropped, the value may be reclaimed, freeing memory. 
 
### Caveats 
 
- **Timing is unpredictable** - There is no guarantee _when_ or _if_ the garbage collector will run. 
You cannot rely on weak references to release resources at a specific time. 
- **Use for caches only** - `WeakRef` is intended for caches or memoization, where you can 
recompute values if they disappear. Do not use weak references to manage critical resources (e.g. 
files or sockets). 
- **Check `deref()`** - Always check the return value of `.deref()` for `undefined` to avoid errors. 
 
## `FinalizationRegistry` 
 
`FinalizationRegistry` lets you register a callback to be called **after** an object has been garbage 
collected. This allows you to clean up associated resources (e.g. remove entries from a Map) without 
preventing the object from being reclaimed. 
 


---

 
620
```js 
const registry = new FinalizationRegistry((token) => { 
  console.log("Object with token", token, "was collected"); 
}); 
 
function createResource(id) { 
  const resource = { id }; 
  registry.register(resource, id); // Register for finalization 
  return resource; 
} 
 
let res = createResource("ABC"); 
res = null; // Release strong reference 
// Later, GC collects res and calls the finalizer with 'ABC' 
``` 
 
### Important notes 
 
- **No deterministic finalization** - The callback may run long after the object is unreachable, or 
not at all before the program ends. Never rely on it for critical logic or resource release that must 
happen promptly. 
- **Potential memory leak** - If you register an object but forget to unregister it, the registry holds 
a reference to the cleanup callback and token, which can itself be a source of leaks. 
- **Use with WeakRefs** - Pair `WeakRef` and `FinalizationRegistry` to create caches that 
automatically purge entries when objects are collected. 
 
## Example: Automatic cache eviction 
 
```js 
class AutoCache { 
  constructor() { 
    this.cache = new Map(); 


---

 
621
    this.registry = new FinalizationRegistry((key) => { 
      this.cache.delete(key); 
    }); 
  } 
  set(key, value) { 
    this.cache.set(key, new WeakRef(value)); 
    this.registry.register(value, key, this.cache); 
  } 
  get(key) { 
    const ref = this.cache.get(key); 
    return ref && ref.deref(); 
  } 
} 
 
let data = { content: "heavy" }; 
const autoCache = new AutoCache(); 
autoCache.set("item", data); 
data = null; // Release strong reference 
// When GC runs, the entry is automatically removed from autoCache.cache 
``` 
 
This pattern avoids unbounded cache growth. When `data` is collected, the finalization callback 
deletes its entry from the map. 
 
## Practice questions 
 
1. **Theory:** What is the difference between a strong reference and a weak reference? How does 
this affect garbage collection? 
2. **Coding:** Implement a memoization function that uses `WeakMap` internally. What advantages 
does it provide over a normal `Map`? 
3. **Theory:** Explain why `FinalizationRegistry` callbacks should not contain critical logic or depend 
on timely execution. 


---

 
622
4. **Coding:** Write a small class that holds objects weakly and automatically cleans up its internal 
map when objects are collected. Demonstrate its use with a test object. 
 
 
 


---

 
623
What are transferable objects and how do they improve 
performance in Workers? 
# What Are Transferable Objects and How Do They Improve Performance in Workers? 
 
When you use Web Workers or the `postMessage()` API to communicate across threads or windows, 
data is **structured-cloned**: the browser creates a deep copy of the object and sends it to the 
other context. Copying large amounts of data (e.g. huge arrays, images, files) can be slow and 
memory-intensive. **Transferable objects** provide a way to _transfer ownership_ of certain data 
types between contexts without copying, enabling efficient high-performance applications. 
 
## Structured cloning versus transferring 
 
By default, when you call `worker.postMessage(data)`, the `data` is cloned using the structured clone 
algorithm. This supports most built-in types (objects, arrays, typed arrays, maps, sets, Blobs, etc.), 
but the entire contents are copied. For small objects this is fine, but for large buffers copying can 
dominate runtime. 
 
Transferable objects avoid this overhead by _moving_ the underlying memory from one context to 
another. After a transfer, the sender's reference becomes **detached**—attempting to access its 
contents throws an error or yields zero length—while the receiver gains ownership. 
 
### Types of transferable objects 
 
The set of transferable objects includes: 
 
- `ArrayBuffer` and the underlying buffers of typed arrays 
- `MessagePort` objects 
- `OffscreenCanvas` 
- `ImageBitmap` 
- `AudioData`, `VideoFrame` and other media objects (in browsers that support them) 
- `ReadableStream` and `WritableStream` instances (in some environments) 
 
### Transferring data to a worker 
 


---

 
624
To transfer, you pass the object in the second argument of `postMessage()`: 
 
```js 
// main.js 
const worker = new Worker("worker.js"); 
const buffer = new ArrayBuffer(8); 
const uint8 = new Uint8Array(buffer); 
uint8.set([1, 2, 3, 4, 5, 6, 7, 8]); 
 
// Transfer the buffer to the worker 
worker.postMessage(buffer, [buffer]); 
// At this point, `buffer.byteLength` is 0; it has been detached 
console.log(buffer.byteLength); // 0 
 
// worker.js 
self.onmessage = (e) => { 
  const received = e.data; // ArrayBuffer of length 8 
  const view = new Uint8Array(received); 
  console.log(view); // Uint8Array [1,2,3,4,5,6,7,8] 
}; 
``` 
 
Because the memory is moved rather than copied, transferring a large array buffer is nearly 
instantaneous and does not duplicate data. 
 
### Using `structuredClone()` with transfer 
 
The global `structuredClone()` function also accepts a `transfer` option that works similarly: 
 
```js 
const buf = new Uint8Array([10, 20, 30]).buffer; 


---

 
625
const clone = structuredClone(buf, { transfer: [buf] }); 
console.log(buf.byteLength); // 0 (detached) 
console.log(clone.byteLength); // 3 
``` 
 
### Transfer versus SharedArrayBuffer 
 
Transferable objects **move** the data from sender to receiver. After transfer, the sender cannot 
access it. In contrast, `SharedArrayBuffer` lets multiple contexts share the same memory 
simultaneously. Choose transfer when you need to hand off ownership to a worker and avoid 
copying, and choose shared memory when multiple threads need concurrent access with 
synchronisation via `Atomics`. 
 
## Performance benefits and use cases 
 
- **Large array processing** - Offload heavy computations (e.g. image processing, cryptography) to 
a worker by transferring the underlying `ArrayBuffer` of a typed array. The worker modifies the buffer 
and optionally transfers it back. 
- **Streaming media** - Transfer `ReadableStream` or `AudioData` objects to dedicated workers for 
decoding or playback without duplicating the data. 
- **Message ports** - Transfer `MessagePort` objects to set up complex messaging topologies (e.g. 
one worker communicates with another via a transferred port). 
 
When using transferables, always ensure that the sender does not expect to read the object after 
transfer. Trying to access a detached buffer will result in errors or zero lengths. 
 
## Practice questions 
 
1. **Theory:** Compare the effects of posting an `ArrayBuffer` to a worker with and without listing it 
in the transfer array. How does this affect `byteLength` on the sender's side? 
2. **Coding:** Write a program that creates a large `Float64Array` on the main thread, transfers it to 
a worker that multiplies every element by 2 and then transfers it back. Confirm that the main thread 
sees the updated values. 
3. **Theory:** Describe a scenario where using a `SharedArrayBuffer` would be more appropriate 
than transferring an `ArrayBuffer`. 


---

 
626
4. **Coding:** Demonstrate how to transfer a `MessagePort` from the main thread to a worker and 
use it to send messages back and forth. 
 
 
 


---

 
627
What is structured concurrency (upcoming spec) and 
how might it change async patterns? 
# What Is Structured Concurrency (Upcoming Spec) and How Might It Change Async Patterns? 
 
JavaScript has embraced asynchronous programming through callbacks, promises and 
`async`/`await`. However, these patterns don't enforce any relationship between a parent task and 
the asynchronous work it spawns—promises can outlive the function that created them, leading to 
"dangling" operations that continue running after they're no longer needed. **Structured 
concurrency** is a paradigm that aims to address this by ensuring that asynchronous operations are 
_nested_ within a well-defined scope, so that they start and finish together. The ECMAScript proposal 
for structured concurrency (still at an early stage) introduces new APIs to formalise these 
relationships and improve cancellation and error handling. 
 
## Motivation for structured concurrency 
 
Current asynchronous patterns allow you to launch operations and forget about them. For example: 
 
```js 
async function fetchUser() { 
  // Fire off two requests concurrently 
  const userPromise = fetch("/user.json"); 
  const postsPromise = fetch("/posts.json"); 
  // Return the user data and ignore posts 
  const user = await userPromise; 
  return user; 
} 
 
// If fetchUser() returns early, the posts request continues running 
``` 
 
The second fetch continues even though its result is never used. This wastes resources and 
complicates error handling—if the posts request fails, where should the error go? Structured 
concurrency frameworks in other languages (like Kotlin's coroutines or Swift's tasks) solve this by 


---

 
628
automatically canceling child tasks when the parent task ends and propagating errors in a controlled 
manner. 
 
## Proposed API: Task groups and cancellation tokens 
 
The JavaScript proposal (often referred to as **"Structured Tasks"** or **"Cancellation API"**) 
introduces concepts such as **TaskGroup**, **CancellationController** and 
**CancellationToken**. Though the exact names and semantics may change, the core ideas include: 
 
- **Task groups** - A task group represents a set of asynchronous operations that are tied to a 
parent function. You create a task group and then start tasks within it. The group waits for all tasks to 
complete before it resolves. 
- **Cancellation tokens** - A token signals cancellation to any operation that observes it. When a 
parent task is canceled, all child tasks receive the cancellation signal and should abort their work. 
- **Automatic propagation** - If a child task throws an error, the error is propagated to the parent 
group. Other tasks are canceled automatically, so no work continues silently after a failure. 
 
Here's a conceptual example of how a task group might look: 
 
```js 
async function loadUserData() { 
  const controller = new CancellationController(); 
  const token = controller.token; 
 
  const group = new TaskGroup(); 
  group.run(() => fetchWithAbort("/user.json", token)); 
  group.run(() => fetchWithAbort("/posts.json", token)); 
 
  try { 
    const [user, posts] = await group.join(); 
    return { user, posts }; 
  } catch (err) { 
    // If either fetch fails, the other is canceled automatically 


---

 
629
    throw err; 
  } 
} 
 
async function fetchWithAbort(url, token) { 
  const controller = new AbortController(); 
  token.addEventListener("cancel", () => controller.abort()); 
  const response = await fetch(url, { signal: controller.signal }); 
  return response.json(); 
} 
``` 
 
In this pseudo-API: 
 
- `TaskGroup.run()` starts a task and registers it with the group. 
- `group.join()` waits for all tasks to complete. If one task rejects, the group cancels other tasks and 
throws the error. 
- A `CancellationToken` orchestrates cancellation requests. 
 
Actual API details may differ, but structured concurrency ensures that all tasks launched within a 
scope are either completed or canceled when the scope ends. This avoids orphaned asynchronous 
work and centralises error handling. 
 
## How it might change async patterns 
 
Structured concurrency would streamline patterns that currently require manual tracking and 
cleanup: 
 
- **Error propagation** - When using `Promise.all()`, if one promise rejects, others continue 
executing. With a task group, the remaining tasks would be canceled. 
- **Cancellation** - Developers often attach `AbortController` manually to fetch calls. Structured 
concurrency could provide integrated cancellation signals for any async operation (fetch, timers, 
custom tasks) without bespoke boilerplate. 


---

 
630
- **Resource management** - You can ensure that all spawned tasks finish before returning from an 
async function, reducing leaks. This is especially important for operations like file handles, database 
connections or sensors. 
- **Readability** - Code reflects the logical structure of tasks: tasks are children of their scope, 
rather than floating promises that may outlive their parent. 
 
It's important to note that the structured concurrency proposal is still evolving. Adoption will require 
changes to browser and Node.js APIs to accept cancellation tokens, and developers will need to learn 
new patterns. But the end result promises more predictable, maintainable asynchronous code. 
 
## Practice questions 
 
1. **Theory:** Describe the problem structured concurrency aims to solve. How do current patterns 
like `Promise.all()` fall short? 
2. **Coding:** Given two asynchronous operations (e.g. fetching user and comments), write a 
function using existing tools (e.g. `AbortController`, `Promise.race`) that cancels the second request if 
the first one fails. How might structured concurrency simplify this? 
3. **Theory:** What are the benefits of propagating cancellation and errors from child tasks to their 
parent? Can you think of situations where you might _not_ want automatic cancellation? 
4. **Coding:** Sketch a custom "task group" class in today's JavaScript that runs multiple async 
functions concurrently, cancels all on error, and returns their results. Discuss how your 
implementation differs from the proposal. 
 
 
 


---

 
631
Explain monkey patching, why it’s discouraged, and 
alternatives 
# Explain Monkey Patching, Why It's Discouraged and Alternatives 
 
**Monkey patching** refers to the practice of modifying or extending code at runtime—especially 
the behaviour of existing classes, functions or modules—without changing the original source. In 
JavaScript, monkey patching often means overriding a method on a built-in prototype (like 
`Array.prototype`) or third-party library object to change how it works. While sometimes convenient, 
monkey patching is generally discouraged due to the potential for unexpected side effects and 
maintenance issues. 
 
## What is monkey patching? 
 
Monkey patching stems from dynamic languages allowing you to replace methods on objects or 
prototypes. For example, you might patch `Array.prototype.sort()` to log how many times it's called: 
 
```js 
// Monkey patching Array.prototype.sort 
const originalSort = Array.prototype.sort; 
let callCount = 0; 
 
Array.prototype.sort = function (...args) { 
  callCount++; 
  console.log("sort called", callCount, "times"); 
  return originalSort.apply(this, args); 
}; 
 
[3, 1, 2].sort(); 
[10, 5].sort(); 
// Output: sort called 1 times, sort called 2 times 
``` 
 


---

 
632
Another common example is polyfilling methods missing in older environments by defining them on 
prototypes. For instance, adding `Array.prototype.flat()` in browsers that don't support it. 
 
## Why monkey patching is discouraged 
 
1. **Unpredictable behaviour** - Modifying built-in objects changes behaviour for _all_ code 
running in the same environment. Libraries and frameworks that assume standard semantics may 
break if you alter prototypes. 
2. **Conflicts** - If multiple modules monkey patch the same method in different ways, they may 
conflict. The last one to patch wins, potentially breaking the others. 
3. **Maintenance burden** - Overriding functions makes it harder to upgrade libraries or the 
runtime because the patch might not work with new versions. Debugging becomes difficult when 
behaviour differs from the documented standard. 
4. **Global side effects** - Even local patches (e.g. temporarily changing `Date.now`) can leak into 
other parts of your app if not restored properly. 
5. **Security and stability** - Patching might introduce vulnerabilities or degrade performance if not 
done carefully. 
 
## Legitimate use cases 
 
There are scenarios where monkey patching is acceptable or even necessary: 
 
- **Polyfills/shims** - Adding missing methods according to the ECMAScript specification for older 
environments (e.g. `String.prototype.startsWith`). Polyfills should check for the method's existence 
before defining it and follow the spec precisely. 
- **Instrumentation** - Temporarily wrapping functions to log usage or performance metrics during 
development or testing. Such patches should be removed in production. 
- **Bug fixes in dependencies** - If a library has a bug and you cannot modify its source or wait for 
an update, a targeted patch may be required. Document the patch clearly and remove it once the 
bug is fixed upstream. 
 
## Alternatives to monkey patching 
 
1. **Composition and wrappers** - Instead of modifying a method, wrap it in another function or 
create a helper function. For example, rather than patching `Array.prototype.sort()` to count calls, 
write a `countedSort()` function that calls `sort()` internally and maintains its own counter. 


---

 
633
 
```js 
function countedSort(arr) { 
  countedSort.calls = (countedSort.calls || 0) + 1; 
  return arr.sort(); 
} 
 
const numbers = [3, 1, 2]; 
countedSort(numbers); 
``` 
 
2. **Subclassing or extending** - In class-based code, derive a subclass that overrides specific 
methods instead of patching the base class. For built-ins, consider using composition (e.g. wrap an 
array) rather than extending `Array` directly. 
3. **Dependency injection** - Instead of monkey patching global objects, pass dependencies 
(functions, modules) into your code. This makes behaviour explicit and testable. 
4. **Decorators and higher-order functions** - Wrap functions in higher-order functions that add 
behaviour (e.g. logging) without changing the original function or its prototype. 
 
## Practice questions 
 
1. **Theory:** Explain how monkey patching could cause two independently developed libraries to 
interfere with each other. Provide a hypothetical example. 
2. **Coding:** Write a wrapper function that logs calls to `Array.prototype.map()` without modifying 
the prototype itself. Use your wrapper on an array and verify that other code using `map()` is 
unaffected. 
3. **Theory:** In what situations is polyfilling a built-in method acceptable? What precautions 
should you take when writing a polyfill? 
4. **Coding:** Suppose a third-party library uses `Date.now()` internally, and you need to test 
time-based behaviour. Show how you can replace `Date.now()` with a fake implementation during a 
test and restore it afterward without affecting other tests. 
 
 
 


---

 
634
What is the Realms API and why might it matter for 
sandboxing? 
# What Is the Realms API and Why Might It Matter for Sandboxing? 
 
Executing untrusted code safely in JavaScript is challenging. Existing techniques include `<iframe>` 
sandboxes, `vm` contexts in Node.js, or third-party libraries like SES. These solutions each have 
limitations and complexities. The **Realms API** is a proposed ECMAScript feature that aims to 
provide a built-in mechanism for creating **isolated execution contexts**—called _realms_—that 
allow code to run without affecting or being affected by the surrounding environment. This could 
make sandboxing more robust, secure and ergonomic. 
 
## What is a realm? 
 
A **realm** is essentially a separate global environment with its own **global object**, **global 
scope** and **intrinsic objects** (`Object`, `Array`, etc.). In browsers today, each top-level window 
or `<iframe>` has its own realm. When you evaluate code in an iframe, it gets its own global 
environment and prototypes distinct from the parent page. However, using iframes for sandboxing 
has drawbacks: they require DOM elements, they may be blocked by Content Security Policy (CSP), 
and they load an entire browsing context including document and network access. 
 
## The Realms API (and `ShadowRealm`) 
 
The proposed Realms API aims to allow developers to create new realms without a visual browsing 
context and to control how values are shared across realms. At the time of writing, the API being 
championed in TC39 is `ShadowRealm`: 
 
```js 
const realm = new ShadowRealm(); 
realm.evaluate("globalThis.foo = 'bar';"); 
// The new realm's globalThis has foo, but the current realm's does not 
console.log(globalThis.foo); // undefined 
 
// To import a function from the current realm into the shadow realm 
function add(a, b) { 
  return a + b; 


---

 
635
} 
const wrappedAdd = realm.importValue(() => add, "add"); 
// Now call the function inside the shadow realm 
realm.evaluate("add(1, 2)"); // 3 
``` 
 
`ShadowRealm` provides: 
 
- **Code evaluation** via `realm.evaluate(code)`, which runs code in the new realm's global scope. 
It cannot access DOM APIs or other host-specific objects by default. 
- **Importing functions/values** using `importValue()`. This creates a callable function in the 
shadow realm that proxies back to the original function. Data passed between realms is 
structured-cloned to prevent object graph sharing unless wrapped explicitly. 
 
Because each realm has its own intrinsics, built-in prototypes cannot be tampered with from the 
outside. This isolation prevents prototype pollution (modifying `Object.prototype`) in one realm from 
affecting code in another. 
 
## Why realms matter for sandboxing 
 
1. **Isolation of intrinsics** - If third-party code mutates `Array.prototype` or `Object.prototype`, 
those changes are confined to its own realm. The host realm's built-ins remain pristine. 
2. **No DOM or network access** - Unlike iframes, a `ShadowRealm` does not automatically 
include the DOM or fetch APIs. Unless you explicitly import functions, the sandboxed code has no 
capabilities. This reduces the attack surface and makes it easier to audit what is exposed. 
3. **Controlled interoperability** - You decide which functions or values to share with the sandbox 
via `importValue()`. Passing objects across realms uses structured cloning, so there is no shared 
memory by default. 
4. **Lightweight** - Creating a new realm does not require constructing a full iframe or Node VM. It 
runs in the same process and thread, making it efficient for short-lived computations. 
 
## Considerations and limitations 
 
- **Not yet standardized** - As of today, `ShadowRealm` is at Stage 3 in TC39 and subject to change. 
Browser and Node support is limited, so experiments must include feature detection. 


---

 
636
- **Limited host API access** - A shadow realm cannot access the DOM, timers or fetch unless you 
provide those functions explicitly. This is by design, but may limit use cases. 
- **Security still requires care** - Although realms isolate intrinsics, you must carefully vet what you 
import or execute. Code can still run infinite loops or exhaust CPU resources unless you add timeouts 
or worker isolation. 
- **Alternative approaches** - Projects like [Ses](https://github.com/endojs/endo) and 
[vm2](https://github.com/patriksimek/vm2) implement secure sandboxes today by rewriting code or 
using Node's `vm` module. Realms may eventually provide a browser-native alternative. 
 
## Practice questions 
 
1. **Theory:** Describe how a `ShadowRealm` differs from an `<iframe>` sandbox. What advantages 
does it offer for sandboxing untrusted code? 
2. **Coding:** Write code that creates a `ShadowRealm`, defines a global variable inside it, and 
demonstrates that the variable is not visible in the parent realm. Then, use `importValue()` to call a 
function defined in the parent realm from the shadow realm. 
3. **Theory:** Why do each realm's intrinsics need to be separate? What attacks can occur if two 
realms share the same `Object.prototype`? 
4. **Coding:** Imagine you're building a plugin system where plugins run in their own realms. Show 
how you would expose only a specific API to the plugin while keeping the rest of your application's 
functions inaccessible. 
 
 
 


---

 
637
How does the ECMAScript spec define execution order 
at the spec level? 
# How Does ECMAScript Specify Execution Order at the Spec Level? 
 
JavaScript's behaviour is defined by the **ECMAScript specification**, a precise document 
describing syntax, types, control flow and semantics. When you write an expression like `a() + b() * 
c()`, the specification dictates _exactly_ how and in what order each part is evaluated. Understanding 
how the spec formalises execution order helps demystify language quirks and clarify why certain 
code behaves the way it does. 
 
## Evaluation order in expressions 
 
In ECMAScript, most operators evaluate their operands **left to right**. The specification expresses 
this via abstract operations such as `Evaluate` that return **completion records** (containing result, 
normal/abrupt completion and value). For example, the grammar for an addition expression is 
described as evaluating the left operand, then the right operand, then applying the `+` operator: 
 
```js 
function left() { 
  console.log("left"); 
  return 1; 
} 
function right() { 
  console.log("right"); 
  return 2; 
} 
console.log(left() + right()); 
// Output order: 'left', 'right', 3 
``` 
 
Even though `+` has the same precedence for both operands, the left function runs before the right. 
Similarly, for `a() && b() && c()`, evaluation stops as soon as one operand yields falsy. The spec 
defines this via short-circuit evaluation for logical operators. 
 


---

 
638
### Argument evaluation 
 
Function call argument expressions are evaluated from left to right. Consider: 
 
```js 
function f(x, y) { 
  return x + y; 
} 
function a() { 
  console.log("a"); 
  return 1; 
} 
function b() { 
  console.log("b"); 
  return 2; 
} 
f(a(), b()); // logs 'a', then 'b' 
``` 
 
Even if the function uses only one argument, the other argument expression is still evaluated before 
the call. This matters when expressions have side effects. 
 
### Property access and assignments 
 
Order also applies to property access and assignments. When evaluating `obj[prop] = value`, the spec 
evaluates `obj` first, then `prop`, then `value`. If evaluating `prop` or `value` has side effects (e.g. 
calling a getter), those occur in that sequence. Example: 
 
```js 
const obj = { 
  get key() { 
    console.log("getter called"); 


---

 
639
    return "k"; 
  }, 
}; 
function value() { 
  console.log("value"); 
  return 42; 
} 
obj[obj.key] = value(); 
// Output: 'getter called', 'value' 
``` 
 
## Execution order between synchronous and asynchronous code 
 
Beyond expression evaluation, the ECMAScript specification describes the event loop and **job 
queues** for asynchronous execution. There are two main task types: 
 
- **Macro tasks (tasks)** - Scheduled by events such as timers, I/O, `setTimeout`, `setInterval`, user 
interactions and script execution. 
- **Microtasks** - Scheduled by promise resolution and `queueMicrotask()`. The spec mandates that 
after executing a task, the runtime must empty the microtask queue before running the next task. 
 
Example: 
 
```js 
console.log("script start"); 
setTimeout(() => console.log("timeout"), 0); 
Promise.resolve().then(() => console.log("promise")); 
console.log("script end"); 
// Output: script start, script end, promise, timeout 
``` 
 


---

 
640
The specification ensures that the microtask (the promise callback) runs after the current task (the 
script) but before the timer callback. This deterministic ordering enables developers to reason about 
asynchronous code. 
 
## Completion records and abrupt completion 
 
The spec introduces the concept of **completion records** to track how evaluation proceeds. A 
completion record can be _normal_ (returning a value), _throw_ (throwing an exception) or _return_ 
(exiting from a function). The `try...catch...finally` construct uses completion records to determine 
how control flow interacts with cleanup code. For example, `finally` clauses always run regardless of 
whether an exception was thrown or a return occurred. 
 
```js 
function test() { 
  try { 
    return "value"; 
  } finally { 
    console.log("finally runs"); 
  } 
} 
console.log(test()); // logs 'finally runs', then 'value' 
``` 
 
## Practice questions 
 
1. **Theory:** In the expression `foo() || bar() && baz()`, which functions are called and in what 
order? Explain using the specification's short-circuit rules. 
2. **Coding:** Write code demonstrating the evaluation order of the operands in `obj[prop] = value` 
when `prop` and `value` are functions with side effects. Explain the output order. 
3. **Theory:** How do microtasks differ from macro tasks in the ECMAScript event loop? Why does 
the specification require clearing the microtask queue before moving on to the next macro task? 
4. **Coding:** Show that `finally` clauses run even when a `return` statement is executed in the `try` 
block. Provide an example with side effects in the `finally` block and explain what happens. 
 


---

 
641
 
 


---

 
642
What are the pitfalls of floating-point arithmetic (0.1 + 
0.2 ≠ 0.3)? 
# What Are the Pitfalls of Floating-Point Arithmetic (0.1 + 0.2 + 0.3)? 
 
Many developers have encountered surprising results when performing arithmetic with decimal 
fractions in JavaScript: 
 
```js 
console.log(0.1 + 0.2); // 0.30000000000000004 
console.log(0.1 + 0.2 + 0.3); // 0.6000000000000001 
console.log(0.1 * 0.2); // 0.020000000000000004 
``` 
 
Why doesn't `0.1 + 0.2` equal exactly `0.3`? The answer lies in the binary representation of 
floating-point numbers. Understanding these pitfalls is essential when dealing with currencies, 
measurements or any calculations that require precision. 
 
## IEEE-754 double precision 
 
JavaScript's `Number` type follows the **IEEE-754 double-precision binary format**, which uses 64 
bits: 1 for the sign, 11 for the exponent and 52 for the mantissa. Unlike decimal fractions, many 
simple decimal values cannot be represented exactly in binary. For example: 
 
- `0.5` (1/2) has an exact binary representation: `0.1₂`. 
- `0.25` (1/4) has an exact binary representation: `0.01₂`. 
- `0.1` (1/10) does **not** have a finite binary representation. Its binary expansion is infinite: 
`0.000110011001100...₂`. 
 
When storing `0.1` as a double, the binary representation is truncated to fit into 52 bits of mantissa. 
This introduces a **rounding error**. Adding two numbers with rounding errors compounds the 
error, which is why `0.1 + 0.2` is slightly more than 0.3. 
 
### Accumulating error 


---

 
643
 
Errors accumulate with repeated operations: 
 
```js 
let sum = 0; 
for (let i = 0; i < 10; i++) { 
  sum += 0.1; 
} 
console.log(sum); // 0.9999999999999999, not 1 
``` 
 
Each addition introduces a tiny error; ten times that error produces a noticeable difference. 
 
## Comparison pitfalls 
 
Due to rounding errors, direct comparisons can yield unexpected results: 
 
```js 
const a = 0.1 + 0.2; 
console.log(a === 0.3); // false 
// Instead use a tolerance 
function nearlyEqual(x, y, epsilon = Number.EPSILON) { 
  return Math.abs(x - y) < epsilon; 
} 
console.log(nearlyEqual(a, 0.3)); // true 
``` 
 
`Number.EPSILON` is the difference between 1 and the smallest floating-point number greater than 
1. Using an epsilon allows you to compare numbers within an acceptable margin of error. 
 
## Other quirks and pitfalls 


---

 
644
 
- **Large and small numbers** - Representable numbers range from approximately ±1.8×10³⁰⁸ 
down to ±5×10⁻³²⁴. Numbers beyond this range underflow to `0` or overflow to `Infinity`. 
- **NaN propagation** - Operations like `0 / 0` produce `NaN` (Not a Number) and propagate 
through calculations. 
- **Rounding modes** - JavaScript rounds ties to the nearest even value (banker's rounding) in 
some operations. 
- **String conversions** - Converting a number to a string (`number.toString()`) may produce a long 
decimal, but `Number.parseFloat()` can sometimes produce a slightly different binary representation. 
Use caution when converting back and forth. 
 
## Practice questions 
 
1. **Theory:** Explain why `0.1` cannot be represented exactly in binary floating-point format. 
Illustrate the binary expansion of 1/10. 
2. **Coding:** Write a function that sums an array of decimal numbers while minimising 
floating-point errors. One approach is to sort the numbers before adding them. 
3. **Theory:** What is `Number.EPSILON`, and how can it help when comparing floating-point 
numbers? Why might a custom epsilon be required in some situations? 
4. **Coding:** Demonstrate how repeated subtraction can lead to floating-point drift. Subtract `0.1` 
from `1` ten times, print each intermediate value, and discuss why the final result is not exactly `0`. 
 
 
 


---

 
645
How can you achieve precise decimal arithmetic in 
JavaScript? 
# How Can You Achieve Precise Decimal Arithmetic in JavaScript? 
 
Due to the limitations of floating-point representation, performing precise decimal arithmetic in 
JavaScript can be tricky. This is especially relevant for financial calculations (e.g. currency, taxes), 
scientific measurements, and any domain where rounding errors are unacceptable. Fortunately, 
there are techniques and tools to achieve higher precision. 
 
## Use integers to represent fixed-point values 
 
One common approach is to **scale** decimal values into integers by multiplying by a power of ten. 
Perform arithmetic on the integers and then scale back. For currency, working in cents avoids 
fractional cents: 
 
```js 
// Represent dollars as integer cents 
function addMoney(a, b) { 
  const centsA = Math.round(a * 100); 
  const centsB = Math.round(b * 100); 
  return (centsA + centsB) / 100; 
} 
 
console.log(addMoney(0.1, 0.2)); // 0.3 
console.log(addMoney(0.1, 0.2) === 0.3); // true 
``` 
 
This method eliminates rounding errors as long as the scaled values are integers. However, you must 
choose a scale factor large enough to capture the maximum number of decimal places you expect. 
 
## BigInt with scaling 
 


---

 
646
For even larger ranges or more precise fractions, you can use **`BigInt`**. `BigInt` can represent 
arbitrarily large integers but cannot represent decimals. By storing amounts as _scaled_ integers, you 
can perform exact arithmetic without overflow. For example: 
 
```js 
const scale = 10_000n; // support four decimal places 
 
function addScaled(a, b) { 
  return (a + b) / scale; 
} 
 
const amount1 = 123_45n; // 1.2345 
const amount2 = 50_00n; // 0.5000 
console.log(addScaled(amount1 * scale, amount2 * scale)); // 1.7345n 
``` 
 
You can encapsulate this logic in a class that stores amounts as scaled `BigInt` and implements 
addition, subtraction, multiplication and division with appropriate rounding modes. 
 
## Decimal libraries 
 
Several libraries implement arbitrary-precision decimal arithmetic. They represent numbers in a 
decimal base and handle rounding precisely: 
 
- **decimal.js** and **decimal.js-light** - Provide a `Decimal` type with configurable precision and 
rounding modes. You can perform arithmetic using methods like `plus`, `minus`, `times` and `div`. 
Example: 
 
  ```js 
  import { Decimal } from "decimal.js"; 
  const x = new Decimal("0.1"); 
  const y = new Decimal("0.2"); 
  console.log(x.plus(y).toString()); // '0.3' 


---

 
647
  ``` 
 
- **big.js** - Similar to decimal.js but with a smaller footprint. You create `Big` objects and call 
methods to perform arithmetic. 
 
These libraries track decimal places internally and avoid binary rounding errors. They can be slower 
than native numbers, but for finance or scientific work the correctness often outweighs performance 
concerns. 
 
## ECMAScript Decimal proposal 
 
TC39 has a Stage 1 [Decimal proposal](https://github.com/tc39/proposal-decimal) that introduces a 
new primitive type `decimal64`. It aims to integrate decimal arithmetic into the language with similar 
semantics to `Number` but using a decimal representation. Once finalised and implemented, you will 
be able to write: 
 
```js 
const a = 0.1m; // decimal literal 
const b = 0.2m; 
console.log(a + b); // 0.3m exactly 
``` 
 
Until then, rely on other methods described here. 
 
## Practice questions 
 
1. **Theory:** Explain why multiplying by 100 and rounding helps when adding two decimal 
numbers like 0.1 and 0.2. What limitations does this technique have? 
2. **Coding:** Implement a `Money` class that stores amounts as integer cents using `BigInt`. 
Provide methods for addition, subtraction and multiplication by a scalar. 
3. **Theory:** What advantages do arbitrary-precision decimal libraries offer compared to using 
scaled integers? When might you choose one over the other? 
4. **Coding:** Use a decimal library (e.g. decimal.js or big.js) to compute `(0.1 + 0.2) * 0.3` exactly. 
Compare the result with the native `Number` computation. 


---

 
648
 
 
 


---

 
649
How do Intl.DateTimeFormat and Intl.NumberFormat 
support localization? 
# How Do `Intl.DateTimeFormat` and `Intl.NumberFormat` Support Localization? 
 
Web applications often need to display dates, times and numbers in a way that matches the user's 
locale—formats vary widely across cultures. The **`Intl` API** provides built-in internationalisation 
services for these tasks. In particular, **`Intl.DateTimeFormat`** and **`Intl.NumberFormat`** 
allow you to format dates, times and numbers according to locale conventions and user preferences. 
 
## `Intl.DateTimeFormat` 
 
`Intl.DateTimeFormat` formats `Date` objects or timestamps into human-readable strings. You 
specify a locale and options describing which parts of the date/time to include and how. For 
example: 
 
```js 
const date = new Date("2025-12-31T18:30:00Z"); 
 
// US English uses month/day/year order and 12-hour time 
const usFormatter = new Intl.DateTimeFormat("en-US", { 
  year: "numeric", 
  month: "long", 
  day: "numeric", 
  hour: "numeric", 
  minute: "2-digit", 
  timeZoneName: "short", 
}); 
 
// French uses day/month/year order and 24-hour time 
const frFormatter = new Intl.DateTimeFormat("fr-FR", { 
  year: "numeric", 
  month: "long", 


---

 
650
  day: "numeric", 
  hour: "numeric", 
  minute: "2-digit", 
  timeZoneName: "short", 
}); 
 
console.log(usFormatter.format(date)); // December 31, 2025 at 1:30 PM GMT 
console.log(frFormatter.format(date)); // 31 décembre 2025 à 18:30 UTC 
``` 
 
Key aspects: 
 
- **Locale:** A BCP 47 language tag (e.g. `'en-US'`, `'de-DE'`) influences language and ordering. You 
can specify an array of locales; the browser picks the best match. 
- **Options:** Select which date/time components to include (`year`, `month`, `day`, `hour`, 
`minute`, `second`) and their styles (`numeric`, `2-digit`, `short`, `long`). Additional options include 
`timeZone`, `timeZoneName`, `hourCycle` and `calendar`. 
- **Time zones:** If you don't specify `timeZone`, the user's local time zone is used. You can set 
`timeZone` to convert UTC times into specific zones. 
 
`Intl.RelativeTimeFormat` complements `DateTimeFormat` by formatting relative times (e.g. "in 2 
hours", "3 days ago"). 
 
## `Intl.NumberFormat` 
 
`Intl.NumberFormat` formats numbers, currencies and percentages according to locale conventions. 
It handles different decimal separators (comma vs dot), thousands separators, currency symbols and 
placement, and percentage signs. 
 
### Basic usage 
 
```js 
const num = 1234567.89; 


---

 
651
 
// Format number in German (comma as decimal separator) 
const deFormat = new Intl.NumberFormat("de-DE"); 
console.log(deFormat.format(num)); // 1.234.567,89 
 
// Format currency in Japanese Yen (no fractional digits) 
const yenFormat = new Intl.NumberFormat("ja-JP", { 
  style: "currency", 
  currency: "JPY", 
}); 
console.log(yenFormat.format(1234)); // ￥1,234 
 
// Format percentage with minimum fraction digits 
const percentFormat = new Intl.NumberFormat("en-US", { 
  style: "percent", 
  minimumFractionDigits: 2, 
}); 
console.log(percentFormat.format(0.1234)); // 12.34% 
``` 
 
Important options: 
 
- `style` - `'decimal'` (default), `'currency'`, `'percent'`, `'unit'`. 
- `currency` - ISO 4217 code required when `style: 'currency'`. 
- `currencyDisplay` - `'symbol'`, `'code'`, `'name'`, `'narrowSymbol'`. 
- `minimumFractionDigits` and `maximumFractionDigits` - control the number of decimal places. 
- `notation` - `'standard'`, `'scientific'`, `'engineering'` and `'compact'` (for 1K, 1M, etc.). 
- `unit` and `unitDisplay` - format measurements like degrees, litres and metres using 
[`Intl.NumberFormat`](https://developer.mozilla.org/en-
US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat). 
 
### Custom grouping and formatting 


---

 
652
 
You can also use locale-sensitive formatting for other purposes. For example, to format file sizes in a 
human-friendly way using the compact notation: 
 
```js 
const sizeFormatter = new Intl.NumberFormat("en-US", { 
  notation: "compact", 
  style: "unit", 
  unit: "byte", 
  unitDisplay: "narrow", 
}); 
console.log(sizeFormatter.format(1500)); // 1.5 KB 
``` 
 
## Best practices 
 
1. **Always specify a locale** - Avoid relying on the browser's default locale, as it may vary between 
users. You can detect the user's locale via `navigator.language` or allow user choice. 
2. **Use options appropriately** - Choose the right style and fraction digits based on the data 
you're formatting. Avoid manual string concatenation for currencies and percentages; let the API 
handle it. 
3. **Consider international variations** - Be aware that some locales have unusual conventions 
(e.g. using non-Western numerals or right-to-left scripts). Test formatting in your target markets. 
 
## Practice questions 
 
1. **Theory:** Describe how `Intl.DateTimeFormat` handles time zones and how you can format a 
UTC timestamp in another time zone. 
2. **Coding:** Write a function that formats a given number into a currency string for the user's 
locale. It should accept an ISO currency code and use `navigator.language` as the locale. 
3. **Theory:** What are the differences between formatting a number in `'scientific'` notation 
versus `'compact'` notation using `Intl.NumberFormat`? Give examples. 
4. **Coding:** Format the current date and time in Japanese using the Japanese calendar 
(`calendar: 'japanese'`) and include the era name and day of the week. Explain each option you use. 


---

 
653
 
 
 


---

 
654
What are pluralRules and segmenter in the Intl API? 
# What Are `Intl.PluralRules` and `Intl.Segmenter` in the `Intl` API? 
 
The **`Intl` API** in JavaScript provides tools for locale-aware formatting. Two lesser-known but 
powerful features are **`Intl.PluralRules`**, which helps decide plural categories for numbers in 
different languages, and **`Intl.Segmenter`**, which breaks text into meaningful units like 
graphemes, words or sentences. These APIs enable applications to handle pluralisation and text 
segmentation correctly across languages. 
 
## `Intl.PluralRules` 
 
Pluralisation varies dramatically across languages. English has two plural categories (singular and 
plural), but some languages have one, three or more categories, and the rules can be complex. 
`Intl.PluralRules` determines which plural category a given number belongs to for a specific locale 
and plural type. 
 
### Usage 
 
```js 
// English plural rules for cardinal numbers 
const prEn = new Intl.PluralRules("en-US", { type: "cardinal" }); 
console.log(prEn.select(1)); // 'one' 
console.log(prEn.select(2)); // 'other' 
 
// Arabic plural rules (cardinal) 
const prAr = new Intl.PluralRules("ar", { type: "cardinal" }); 
console.log(prAr.select(0)); // 'zero' 
console.log(prAr.select(1)); // 'one' 
console.log(prAr.select(2)); // 'two' 
console.log(prAr.select(3)); // 'few' 
console.log(prAr.select(11)); // 'many' 
``` 
 


---

 
655
The `select()` method returns a category string such as `'one'`, `'few'`, `'many'`, `'other'` (categories 
vary by locale). Using this, you can choose the appropriate translation for the number: 
 
```js 
const messages = { 
  en: { 
    one: "There is one item", 
    other: "There are {n} items", 
  }, 
  ru: { 
    one: "Есть {n} элемент", 
    few: "Есть {n} элемента", 
    many: "Есть {n} элементов", 
    other: "Есть {n} элемента", 
  }, 
}; 
 
function formatCount(n, locale) { 
  const pr = new Intl.PluralRules(locale); 
  const key = pr.select(n); 
  return messages[locale][key].replace("{n}", n); 
} 
 
console.log(formatCount(1, "en")); // There is one item 
console.log(formatCount(3, "ru")); // Есть 3 элемента 
``` 
 
You can also specify `type: 'ordinal'` to handle ordinal numbers (1st, 2nd, 3rd) since the plural 
categories differ. 
 
### Resolved options 
 


---

 
656
You can query `pr.resolvedOptions()` to see which locale and plural categories are actually in use. 
This is useful when fallback locales are applied. 
 
## `Intl.Segmenter` 
 
Different languages use different rules for dividing text into characters, words and sentences. Simply 
splitting on spaces or letters is insufficient for scripts with complex grapheme clusters (like emoji or 
combining characters), or languages like Thai and Japanese where words are not separated by 
spaces. `Intl.Segmenter` provides locale-aware text segmentation. 
 
### Usage 
 
```js 
// Segmenter for words in Japanese 
const segJa = new Intl.Segmenter("ja", { granularity: "word" }); 
const textJa = "庭には二羽鶏がいる"; 
for (const { segment, isWordLike } of segJa.segment(textJa)) { 
  if (isWordLike) console.log(segment); 
} 
// Output: 庭, には, 二羽, 鶏, が, いる 
 
// Segmenter for grapheme clusters (user-perceived characters) in English emoji 
const segGrapheme = new Intl.Segmenter("en", { granularity: "grapheme" }); 
const emojis = "👩🏽🚀❤️"; 
console.log([...segGrapheme.segment(emojis)].map((s) => s.segment)); 
// Output: ['👩🏽🚀', '❤️'] 
 
// Segmenter for sentences in German 
const segSentence = new Intl.Segmenter("de", { granularity: "sentence" }); 
const textDe = "Hallo Welt! Wie geht es dir? Gut."; 
console.log([...segSentence.segment(textDe)].map((s) => s.segment)); 
// Output: ['Hallo Welt!', ' Wie geht es dir?', ' Gut.'] 


---

 
657
``` 
 
The `segment()` method returns an iterable of objects with properties: 
 
- `segment` - the extracted substring 
- `index` - starting index in the original string 
- `input` - the original string 
- `isWordLike` - boolean indicating if the segment behaves like a word (for `granularity: 'word'`) 
 
Using `Intl.Segmenter` ensures that text is split according to the conventions of the specified locale, 
which is vital for cursor movement, word counting, text wrapping and search indexing. 
 
## When to use these APIs 
 
- **Localising messages** - Use `Intl.PluralRules` to select the right plural form for quantities in user 
interfaces. 
- **Internationalising text input** - Use `Intl.Segmenter` to count characters or words properly, 
highlight selections, or implement text-wrapping algorithms. 
- **Searching and indexing** - Segment text into words or sentences before indexing for search to 
improve accuracy across languages. 
 
## Practice questions 
 
1. **Theory:** Why is splitting text on spaces insufficient for languages like Thai or Japanese? How 
does `Intl.Segmenter` address this problem? 
2. **Coding:** Implement a function that pluralises a message like "You have {n} new messages" in 
both English and Russian using `Intl.PluralRules`. 
3. **Theory:** What differences exist between cardinal and ordinal plural rules? Give examples of 
locales where they differ. 
4. **Coding:** Use `Intl.Segmenter` to count the number of user-perceived characters (graphemes) 
in a string containing emojis and combining characters. Explain how this differs from `string.length`. 
 
 
 


---

 
658
How does Temporal API improve date–time 
management compared to Date? 
# How Does the Temporal API Improve Date/Time Management Compared to `Date`? 
 
The built-in `Date` object has been part of JavaScript since the beginning, but it comes with 
numerous flaws: it is mutable, combines absolute time with local time zones, lacks support for 
non-Gregorian calendars and time zones, and has confusing methods for parsing and formatting. The 
**Temporal API** is a modern proposal (at Stage 3 as of this writing) that aims to replace `Date` 
with a set of explicit, immutable date and time types. By separating concepts like absolute time, civil 
time, and time zones, Temporal avoids many pitfalls of `Date` and makes date-time manipulation 
easier and less error-prone. 
 
## Problems with `Date` 
 
- **Mutability** - `Date` instances are mutable. Methods like `setFullYear()` and `setHours()` modify 
the existing object, which can lead to unintended side effects if a reference is shared. 
- **Implicit time zone** - A `Date` stores a timestamp in milliseconds since the Unix epoch 
internally, but its getter and setter methods interpret that timestamp in the _system's local time 
zone_. Converting between time zones requires manual calculations. 
- **Limited calendar support** - `Date` supports only the proleptic Gregorian calendar. There's no 
way to use other calendars like the Japanese or Islamic calendars. 
- **Parsing and formatting** - `Date.parse()` accepts many formats, but they are inconsistent across 
implementations. `Date` also lacks built-in formatting; you must use libraries or 
`Intl.DateTimeFormat`. 
- **Daylight saving time (DST) traps** - Adding 24 hours to a `Date` around a DST transition may 
produce a local time off by an hour due to a 23- or 25-hour day. 
 
## Temporal's approach 
 
Temporal introduces several new types, each representing a different concept: 
 
- **`Temporal.Instant`** - Represents an exact point in time on the timeline (like a `Date`'s internal 
representation) but immutable. 
- **`Temporal.PlainDate`** - Represents a calendar date (year, month, day) without a time or time 
zone. 
- **`Temporal.PlainTime`** - Represents a time of day without a date or time zone. 


---

 
659
- **`Temporal.PlainDateTime`** - Combines a `PlainDate` and a `PlainTime` without a time zone. 
- **`Temporal.ZonedDateTime`** - Combines an `Instant` with a time zone and calendar; 
automatically handles DST and conversions. 
- **`Temporal.Duration`** - Represents spans of time (e.g. 3 days, 2 hours) and supports arithmetic 
like addition and subtraction. 
- **`Temporal.Now`** - Provides access to the current time in different forms (`now.instant()`, 
`now.zonedDateTime()`), respecting calendars and time zones. 
 
### Immutability and explicitness 
 
Temporal objects are immutable—every method returns a new instance rather than mutating the 
original. This prevents accidental changes and makes reasoning about time values easier. Moreover, 
Temporal forces you to be explicit about calendars and time zones, avoiding hidden assumptions. 
 
Example: adding one day across a DST transition with `Temporal.ZonedDateTime`: 
 
```js 
// Create a ZonedDateTime for March 13, 2022 1:30 AM in America/New_York 
const zdt = Temporal.ZonedDateTime.from({ 
  year: 2022, 
  month: 3, 
  day: 13, 
  hour: 1, 
  minute: 30, 
  timeZone: "America/New_York", 
}); 
// Add one day 
const nextDay = zdt.add({ days: 1 }); 
console.log(zdt.toString()); // 2022-03-13T01:30-05:00[America/New_York] 
console.log(nextDay.toString()); // 2022-03-14T01:30-04:00[America/New_York] 
// Notice the offset changed (-05:00 vs -04:00) due to DST 
``` 
 


---

 
660
The Temporal API automatically adjusts for DST and time zones when adding or subtracting 
durations. With `Date`, you would need to manually account for DST boundaries or use a library like 
Moment.js. 
 
### Conversions and formatting 
 
Temporal objects provide straightforward conversion methods: 
 
```js 
const plainDate = Temporal.PlainDate.from("2025-12-31"); 
const plainTime = Temporal.PlainTime.from("18:45:00"); 
const dateTime = plainDate.toPlainDateTime(plainTime); 
console.log(dateTime.toString()); // 2025-12-31T18:45:00 
 
// Convert from ZonedDateTime to Instant and back 
const nowZoned = Temporal.Now.zonedDateTimeISO(); 
const instant = nowZoned.toInstant(); 
console.log(instant.toString()); // e.g. 2025-11-07T13:00:00.123456789Z 
const sameZoned = instant.toZonedDateTime({ timeZone: "America/New_York" }); 
console.log(sameZoned.toString()); 
``` 
 
Formatting Temporal objects is still done via `Intl.DateTimeFormat` by passing `Temporal` objects 
directly (or by converting to `Date` if necessary). Temporal focuses on data representation and 
arithmetic; for display, you still use `Intl`. 
 
## Migration and adoption 
 
The Temporal API is available in some environments behind flags or polyfills. Eventually it is expected 
to be natively supported in browsers and Node.js. Until then, you can experiment with the 
[proposal-polyfill](https://github.com/tc39/proposal-temporal). Once adopted, Temporal could 
simplify date/time handling and reduce reliance on heavy third-party libraries. 
 


---

 
661
## Practice questions 
 
1. **Theory:** Why does adding 24 hours to a `Date` object around a DST transition sometimes give 
unexpected local times? How does Temporal avoid this issue? 
2. **Coding:** Use `Temporal.ZonedDateTime` to compute the difference in hours between two 
time zones (e.g. New York and Tokyo) on a given date. Compare with doing the same using `Date` 
and manual calculations. 
3. **Theory:** What is the difference between `Temporal.PlainDateTime` and 
`Temporal.ZonedDateTime`? When would you use each? 
4. **Coding:** Write a function that, given a `Temporal.PlainDate` and a number of business days to 
add, returns the resulting date, skipping weekends. How would you implement the same with 
`Date`? 
 
 
 


---

 
662
What are the limitations of Math.random and how to 
get cryptographically secure randomness? 
# What Are the Limitations of `Math.random()` and How to Get Cryptographically Secure 
Randomness? 
 
Generating random numbers is a common requirement—from games and simulations to IDs and 
cryptography. JavaScript offers the `Math.random()` function as a simple source of randomness, but 
it has limitations that make it unsuitable for security-sensitive contexts. This article explores these 
limitations and shows how to obtain cryptographically secure random numbers in both browser and 
Node.js environments. 
 
## Limitations of `Math.random()` 
 
`Math.random()` returns a pseudorandom floating-point number between 0 (inclusive) and 1 
(exclusive). Its drawbacks include: 
 
1. **Lack of cryptographic security** - `Math.random()` is designed for simulations and casual 
randomness. Its internal algorithm is not intended to withstand prediction. Attackers with knowledge 
of its implementation or initial seed may predict future values. For example, earlier versions of some 
engines used linear congruential generators that could be reverse-engineered. 
2. **No seed control** - The API does not allow you to provide or retrieve the generator's seed. This 
makes it unsuitable for repeatable random sequences (e.g. in unit tests) and also prevents you from 
reseeding the generator after a compromise. 
3. **Floating-point output** - `Math.random()` outputs a float in [0, 1), which you often have to 
scale and round to obtain integers or bytes. Converting floats to integers can introduce biases if not 
done carefully. For example, `Math.floor(Math.random() * 10)` does not uniformly distribute 
numbers because of floating-point rounding. 
4. **Engine differences** - Implementations differ slightly between engines, though ECMAScript 
specifies statistical requirements. Still, for cryptography you need stronger guarantees. 
 
## Obtaining cryptographically secure randomness 
 
### Browser: `crypto.getRandomValues()` and `crypto.randomUUID()` 
 
The Web Crypto API exposes `crypto.getRandomValues()` to fill a typed array with cryptographically 
secure random bytes. It uses the underlying operating system's entropy sources. See 


---

 
663
[file 145](../145-what-is-crypto-getrandomvalues-and-why-is-it-safer-than-math-random.md) for 
details. 
 
Example: 
 
```js 
// Generate a 32-bit random integer between 0 and 2^32 - 1 
const array = new Uint32Array(1); 
crypto.getRandomValues(array); 
const randomInt = array[0]; 
// Map to range [0, 999] 
const result = randomInt % 1000; 
console.log(result); 
 
// Generate a UUID v4 (browser support) 
const uuid = crypto.randomUUID(); 
console.log(uuid); // e.g. '3dfd9c15-8e8a-4f89-ae37-a4d7a8f0d9bb' 
``` 
 
The `randomUUID()` method generates RFC 4122 version 4 UUIDs using secure random values. It is 
widely supported in modern browsers. 
 
### Node.js: `crypto.randomBytes()` and `crypto.randomUUID()` 
 
In Node.js, the `crypto` module provides similar functionality. Use `crypto.randomBytes(size)` to 
generate a buffer of secure random bytes. Node 14.17+ also offers `crypto.randomUUID()`. 
 
```js 
const { randomBytes, randomUUID } = require("crypto"); 
 
// Generate 16 random bytes 
const buf = randomBytes(16); 


---

 
664
console.log(buf.toString("hex")); 
 
// Create a random number between 0 and 9 inclusive 
function randomInt10() { 
  // Rejection sampling to avoid modulo bias 
  while (true) { 
    const byte = randomBytes(1)[0]; 
    if (byte < 250) return byte % 10; 
  } 
} 
console.log(randomInt10()); 
 
// Generate a UUID v4 
console.log(randomUUID()); 
``` 
 
### Rejection sampling to avoid modulo bias 
 
When mapping random bytes to a smaller range, naive modulus operations can introduce bias 
because the range of the random generator may not divide evenly. To avoid this, use **rejection 
sampling**: discard values that would skew the distribution. 
 
```js 
function randomInRange(max) { 
  const { randomBytes } = require("crypto"); 
  const range = 256 % max; // values >= 256 - range would skew the result 
  let val; 
  do { 
    val = randomBytes(1)[0]; 
  } while (val >= 256 - range); 
  return val % max; 
} 


---

 
665
console.log(randomInRange(10)); 
``` 
 
## Best practices 
 
- **Use CSPRNGs** - For anything security-sensitive (tokens, keys, salts, nonces), always use 
`crypto.getRandomValues()` in the browser or `crypto.randomBytes()` in Node.js. Never fall back to 
`Math.random()`. 
- **Beware of predictability** - Do not seed your own pseudorandom generator unless you fully 
understand cryptography. Rely on the system's entropy. 
- **Use `randomUUID()` when available** - It simplifies generating UUIDs and ensures correct 
version and variant bits. 
- **Be cautious about modulo bias** - Use rejection sampling or specialized functions like 
`crypto.randomInt()` in Node.js 14.10+ to generate integers uniformly. 
 
## Practice questions 
 
1. **Theory:** Explain why `Math.random()` is unsuitable for cryptographic purposes. What 
properties must a cryptographically secure random number generator have? 
2. **Coding:** Write a browser function that returns a random 6-digit numeric code using 
`crypto.getRandomValues()`. Ensure that each digit is uniformly random between 0 and 9. 
3. **Theory:** What is modulo bias? Why can mapping a byte to a smaller range using `%` introduce 
bias? Describe how rejection sampling avoids this problem. 
4. **Coding:** In Node.js, implement a function that generates a secure random password of length 
12 consisting of uppercase letters, lowercase letters and digits. Use `crypto.randomBytes()` and 
rejection sampling. 
 
 
 


---

 
666
What triggers a reflow vs a repaint and how to minimize 
them? 
# What triggers a reflow vs a repaint and how to minimize them 
 
Modern browsers break rendering into multiple phases. Two of the most expensive phases are 
**reflow** (sometimes called layout) and **repaint**. Understanding what triggers each phase and 
how to avoid unnecessary work is key to writing smooth web applications. 
 
## Repaint vs reflow 
 
- **Repaint** happens when an element's _appearance_ changes in a way that does not affect its 
size or position. Examples include changing `color`, `background-color`, `visibility` or `opacity`. The 
browser does not need to recalculate layout; it simply redraws the affected pixels. 
- **Reflow** (layout) occurs when an element's **geometry** changes or when the browser needs 
to recalculate positions. Actions such as adding or removing DOM nodes, changing element 
`display`/`position`/`float`, modifying dimensions (`width`, `height`, `padding`, `margin`, `border`) or 
resizing the window trigger reflow. Reflow can cascade—changing one element's size may require 
recalculating its ancestors and descendants. 
 
Reflow is typically much more expensive than repaint because the browser must recompute the 
layout tree and recalculate positions before repainting. 
 
## Common triggers 
 
### Repaint triggers 
 
- Changing CSS properties that affect only the look: `color`, `background-image`, `background-color`, 
`text-shadow`, `visibility`, etc. 
- Adding or removing classes that change only visual styles (e.g. toggling a dark mode class). 
- Changing element attributes such as `class`, `id` or `style` if the resulting styles do not affect layout. 
 
### Reflow triggers 
 
- Inserting or removing DOM elements, or changing their order. 


---

 
667
- Changing styles that influence layout: `display`, `position`, `top/left/right/bottom`, `margin`, 
`padding`, `height`, `width`, `font-size`, `line-height`, etc. 
- Changing the content of an element (e.g. adding text) which affects its size. 
- Querying layout information after a change. Reading properties like `offsetWidth`, `offsetHeight`, 
`scrollTop`, `getComputedStyle()` or `clientWidth` after modifying styles forces the browser to flush 
pending changes and perform a synchronous reflow so that it can return up-to-date values. 
 
## Minimizing reflow and repaint 
 
1. **Batch DOM mutations.** Instead of making multiple DOM changes one by one, group them 
together. For example, use a document fragment to build a set of elements and append it once, or 
toggle a class that encapsulates multiple style changes instead of changing each property separately. 
 
2. **Avoid layout thrashing.** Layout thrashing occurs when your code alternates between reading 
layout properties and writing them. Each read forces a reflow, and each write invalidates the layout. 
To avoid this, perform all reads first, then all writes. For complex animations, consider 
`requestAnimationFrame()` and CSS transitions. 
 
3. **Use transform and opacity.** CSS `transform` and `opacity` properties can animate without 
triggering reflow because they operate on a layer composited by the GPU. For example, use 
`transform: translateX()` instead of changing `left`/`top`. 
 
4. **Simplify the DOM structure.** Deeply nested elements can make reflow more expensive 
because changes propagate through many ancestors. Keep the DOM shallow where possible. 
 
5. **Debounce or throttle resizing.** Window resize events can trigger continuous reflows. Use a 
debounce or throttle function to limit the frequency of layout recalculations. 
 
6. **Use `will-change` sparingly.** The `will-change` property hints to the browser that an element 
is likely to change. It can promote the element to its own layer, reducing repaint costs during 
animations. Use it only when necessary because it increases memory usage. 
 
## Example: layout thrashing 
 
```js 
// Poor practice: repeatedly forces reflow 


---

 
668
const items = document.querySelectorAll(".item"); 
items.forEach((item) => { 
  // Writing: changes layout 
  item.style.width = item.offsetWidth + 10 + "px"; 
  // Reading: forces a reflow because the browser must compute offsetWidth 
  console.log(item.offsetHeight); 
}); 
 
// Better: separate reads and writes 
const heights = []; 
items.forEach((item) => { 
  heights.push(item.offsetHeight); // read first 
}); 
items.forEach((item, i) => { 
  item.style.width = item.offsetWidth + 10 + "px"; // write after 
}); 
``` 
 
In the poor example, each call to `offsetWidth` after a write forces a synchronous reflow. In the 
improved version, all reads happen before writes, eliminating unnecessary reflows. 
 
## Practice questions 
 
1. **Theory:** What is the difference between a repaint and a reflow? Provide examples of CSS 
properties that trigger each. 
2. **Theory:** Why does reading `offsetHeight` immediately after changing `style.top` cause a 
performance hit? 
3. **Coding:** Write a function that appends 100 list items to a `<ul>` and minimizes reflow. Explain 
why your approach is efficient. 
4. **Coding:** Use `requestAnimationFrame()` to animate an element horizontally without 
triggering reflows. Explain how `transform: translateX()` differs from changing `left`. 
 
 
 


---

 
669
172. How does compositing work in modern browsers? 
# How does compositing work in modern browsers 
 
Rendering a web page involves multiple stages: style calculation, layout, paint and **compositing**. 
While layout determines where elements go and paint draws them into bitmaps, compositing is the 
process of assembling these painted pieces into the final on-screen image. Understanding 
compositing helps explain why certain CSS properties trigger GPU acceleration and how to optimize 
animations. 
 
## The rendering pipeline overview 
 
1. **Style calculation.** The browser converts CSS rules into computed styles for each element. 
2. **Layout (reflow).** The browser calculates the geometry of each element—its size and 
position—based on the computed styles and the DOM tree. 
3. **Paint.** The browser paints each element into a bitmap. Many small paint operations may be 
combined into larger ones. 
4. **Compositing.** The browser merges these bitmaps (often called **layers**) into the final 
image displayed on the screen. 
 
## Layers and the compositor 
 
Not all elements are painted into the same layer. Some elements—due to CSS properties like 
`position: fixed`, `transform`, `filter`, `opacity`, `clip-path` or `will-change`—are promoted to separate 
compositor layers. The reasons for layer promotion include: 
 
- **Isolation:** Elements with effects like 3D transforms or filters cannot be easily merged with 
other layers during painting. Placing them in their own layer avoids redrawing their neighbors. 
- **Performance:** When an element moves or fades, only its layer needs to be repainted and 
composited, not the entire page. GPU compositing can combine layers efficiently. 
 
The compositor runs on a separate thread from the main rendering thread in many modern 
browsers. This separation allows smooth animations even when JavaScript on the main thread is 
busy, provided the animation uses properties that only affect compositing (e.g., `transform`, 
`opacity`). 
 
## Compositing steps 


---

 
670
 
1. **Layer creation.** During painting, the browser decides which elements should be on their own 
layer. Each layer is essentially a texture. 
2. **Blending order.** Layers are stacked based on z-index and stacking contexts. The compositor 
orders the layers and determines how they overlap. 
3. **Effects and clipping.** The compositor applies CSS effects such as `transform`, `opacity` or 
`filter` to each layer. Because these operations are GPU-accelerated, they are very fast compared to 
reflow or repaint. 
4. **Composition.** Finally, the compositor blends all the layers into a single image using the GPU. 
This step is usually synchronized with the display's refresh rate. 
 
## Example: GPU-accelerated animation 
 
```html 
<style> 
  .box { 
    width: 100px; 
    height: 100px; 
    background: crimson; 
    transition: transform 1s; 
  } 
  .move { 
    transform: translateX(300px); 
  } 
</style> 
<div class="box"></div> 
<button id="toggle">Animate</button> 
<script> 
  const box = document.querySelector(".box"); 
  document.getElementById("toggle").addEventListener("click", () => { 
    box.classList.toggle("move"); 
  }); 
</script> 


---

 
671
``` 
 
In this example, clicking the button toggles a class that changes `transform`. Because `transform` 
creates a separate compositor layer, the main thread does not need to recalculate layout or repaint 
the box for each frame. The GPU composites the box's layer at its new position smoothly, leading to a 
fluid animation. 
 
## Best practices 
 
- **Leverage compositor-friendly properties.** Animate `transform` and `opacity` instead of `top`, 
`left`, `width` or `height` when possible. This avoids triggering layout and paint. 
- **Avoid unnecessary layer promotion.** Adding `will-change: transform` or other properties 
indiscriminately can increase memory consumption. Use layer promotion only on elements that will 
animate or change frequently. 
- **Monitor layers.** Browser dev tools (Chrome's "Layers" panel, Firefox's "Paint" options) allow 
you to inspect which elements are on their own layers. Use these tools to diagnose performance 
issues. 
- **Minimize paint area.** Even with GPU compositing, large paint areas can cause jank. Keep 
moving elements isolated and avoid overdraw by using `contain: paint` where appropriate. 
 
## Practice questions 
 
1. **Theory:** Describe the difference between painting and compositing. Why does the compositor 
run on a separate thread? 
2. **Theory:** Name three CSS properties that usually cause an element to be promoted to its own 
layer. Why might this be beneficial? 
3. **Coding:** Create a card stack where each card lifts above others on hover using `transform: 
translateZ()`. Explain how layer promotion prevents jank. 
4. **Coding:** Using browser developer tools, inspect a page with multiple animations and identify 
which elements are on their own layers. Summarize what you observe. 
 
 
 


---

 
672
What are layout thrashing and forced synchronous 
layouts? 
# What are layout thrashing and forced synchronous layouts 
 
Writing performant JavaScript often requires an understanding of how browser layout works. Two 
common performance pitfalls are **layout thrashing** and **forced synchronous layouts**. Both 
arise when code interleaves reads and writes to the DOM in a way that triggers excessive reflows. 
 
## Forced synchronous layout 
 
When you modify styles, the browser may defer layout recalculation until the next animation frame. 
However, if your code subsequently reads a layout property—such as `offsetWidth`, `offsetHeight`, 
`scrollTop`, `clientTop`, `getBoundingClientRect()`, or `getComputedStyle()`—the browser is forced to 
flush its queued changes and perform a synchronous reflow to return an up-to-date value. This flush 
halts the main thread and can lead to jank, especially in loops. 
 
Example: 
 
```js 
const element = document.querySelector("#box"); 
element.style.width = "200px"; 
// Reading layout right after writing forces a synchronous reflow 
const currentHeight = element.offsetHeight; 
console.log(currentHeight); 
``` 
 
Here, reading `offsetHeight` forces the browser to synchronously recalculate the layout before 
returning the value. Doing this repeatedly inside a loop can degrade performance. 
 
## Layout thrashing 
 
Layout thrashing occurs when code repeatedly alternates between reading layout information and 
modifying it. Each read triggers a reflow, and each write invalidates the layout, causing the next read 


---

 
673
to trigger another reflow. This "ping-pong" effect can result in dozens or hundreds of reflows per 
frame. 
 
Example of layout thrashing: 
 
```js 
const items = document.querySelectorAll(".item"); 
// Increase the width of each item by its current height 
items.forEach((item) => { 
  item.style.width = item.offsetHeight + 10 + "px"; // write + read repeatedly 
}); 
``` 
 
For each item, this loop writes to `style.width` (invalidating layout) and then immediately reads 
`offsetHeight` for the next iteration. On a large list, this can produce many reflows. 
 
## Avoiding these pitfalls 
 
1. **Separate reads and writes.** Read all required layout values first, store them in variables, then 
perform all writes. This batches reflows and reduces thrashing. 
 
2. **Use `requestAnimationFrame()`.** When animating, schedule DOM updates within the same 
animation frame. The browser will perform at most one reflow per frame. Avoid reading layout 
properties in between writes during the same frame. 
 
3. **Cache layout values.** If possible, compute values once and reuse them instead of repeatedly 
querying the DOM. 
 
4. **Use CSS for complex animations.** CSS transitions and animations keep layout calculations on 
the browser side and reduce the need for JavaScript layout reads. 
 
5. **Avoid synchronous API calls.** Some APIs like `getComputedStyle()` can trigger reflow. Use 
them sparingly and outside loops. 
 


---

 
674
## Example: batching reads and writes 
 
```js 
const items = document.querySelectorAll(".item"); 
const heights = []; 
// Read phase 
items.forEach((item) => { 
  heights.push(item.offsetHeight); 
}); 
// Write phase 
items.forEach((item, i) => { 
  item.style.width = heights[i] + 10 + "px"; 
}); 
``` 
 
By separating the read and write phases, this code triggers only a single reflow rather than one per 
item. 
 
## Practice questions 
 
1. **Theory:** Explain what causes a forced synchronous layout and give three methods that can 
trigger it. 
2. **Theory:** Define layout thrashing and describe why it can harm performance. 
3. **Coding:** Rewrite the following loop to avoid layout thrashing: 
 
```js 
const cards = document.querySelectorAll(".card"); 
cards.forEach((card) => { 
  const h = card.offsetHeight; 
  card.style.height = h + 20 + "px"; 
}); 
``` 


---

 
675
 
4. **Coding:** Use `requestAnimationFrame()` to smoothly animate a progress bar's width without 
causing layout thrashing. Explain how you schedule reads and writes. 
 


---

 
676
 
 


---

 
677
What is IntersectionObserver and how can it be used for 
lazy loading? 
# What is IntersectionObserver and how can it be used for lazy loading 
 
`IntersectionObserver` is a browser API that lets you asynchronously observe changes in the 
intersection of a target element with an ancestor element or the viewport. It allows you to run code 
when an element enters or leaves the viewport without polling on scroll events. This makes it a 
perfect tool for **lazy loading** images, infinite scrolling, or triggering animations when content 
becomes visible. 
 
## Key concepts 
 
- **Thresholds:** You can specify an array of intersection ratios (0 to 1) at which to trigger callbacks. 
For example, a threshold of `0.1` means the callback is invoked when 10 % of the target's area 
becomes visible. 
- **Root:** By default, intersections are relative to the viewport. You can pass a different root 
element to observe intersections within a scrollable container. 
- **Entries:** The callback receives a list of `IntersectionObserverEntry` objects. Each entry provides 
properties like `isIntersecting`, `intersectionRatio`, `boundingClientRect` and `target`. 
 
## Basic usage 
 
```js 
// Create an observer with a callback 
const observer = new IntersectionObserver( 
  (entries, obs) => { 
    entries.forEach((entry) => { 
      if (entry.isIntersecting) { 
        // Element is visible; perform an action 
        console.log("Visible:", entry.target); 
        // If we don't need to observe further, unobserve 
        obs.unobserve(entry.target); 
      } 


---

 
678
    }); 
  }, 
  { 
    root: null, // relative to viewport 
    threshold: 0.1, // trigger when 10 % visible 
  } 
); 
 
// Observe elements 
document.querySelectorAll(".observe").forEach((el) => observer.observe(el)); 
``` 
 
When any `.observe` element is at least 10 % visible, the callback runs. Using `obs.unobserve()` stops 
observing that element. 
 
## Lazy loading images 
 
One popular use case is loading images only when they are about to enter the viewport. This saves 
bandwidth and improves page load time. 
 
### HTML 
 
```html 
<img 
  data-src="/images/photo.jpg" 
  alt="A beautiful view" 
  class="lazy-load" 
  src="placeholder.jpg" 
/> 
``` 
 
Here, `src` is a placeholder image (tiny or blank) and `data-src` contains the real image URL. 


---

 
679
 
### JavaScript 
 
```js 
const lazyImages = document.querySelectorAll(".lazy-load"); 
const imgObserver = new IntersectionObserver( 
  (entries, observer) => { 
    entries.forEach((entry) => { 
      if (entry.isIntersecting) { 
        const img = entry.target; 
        img.src = img.dataset.src; 
        observer.unobserve(img); 
      } 
    }); 
  }, 
  { threshold: 0.25 } 
); 
 
lazyImages.forEach((img) => imgObserver.observe(img)); 
``` 
 
This code observes each `.lazy-load` image. When an image is at least 25 % visible, its actual `src` is 
assigned, triggering the download. Once loaded, the observer stops observing it. This technique 
drastically reduces the number of images loaded initially. 
 
## Infinite scrolling 
 
IntersectionObserver can also implement endless scrolling. You place a sentinel element at the 
bottom of the content. When it becomes visible, you fetch more data and append it to the list. 
 
```js 
const list = document.querySelector("#list"); 


---

 
680
const sentinel = document.querySelector("#sentinel"); 
 
const infiniteObserver = new IntersectionObserver( 
  async (entries) => { 
    if (entries[0].isIntersecting) { 
      // Fetch next page of data 
      const data = await fetchNextPage(); 
      data.forEach((item) => list.append(createListItem(item))); 
    } 
  }, 
  { rootMargin: "200px" } 
); 
 
infiniteObserver.observe(sentinel); 
``` 
 
Setting `rootMargin` to 200 px ensures the next page is fetched slightly before the user reaches the 
end, avoiding perceived delays. 
 
## Benefits of IntersectionObserver 
 
- **Efficiency:** It operates asynchronously and is optimized by the browser. Unlike scroll event 
listeners, it avoids calling JavaScript on every pixel of scroll. 
- **Flexibility:** Can observe multiple elements with varying thresholds and root containers. 
- **Non-invasive:** You can easily stop observing or add new elements on the fly. 
 
## Practice questions 
 
1. **Theory:** What properties can you access from an `IntersectionObserverEntry`? How do 
`threshold` and `rootMargin` influence when callbacks fire? 
2. **Theory:** Explain how lazy loading images using IntersectionObserver improves performance 
and user experience. 


---

 
681
3. **Coding:** Implement lazy loading for background images using `data-bg` attributes and 
IntersectionObserver. 
4. **Coding:** Create an infinite scrolling list that loads more items when the sentinel becomes 50 % 
visible. Ensure each new batch attaches its own sentinel for continued loading. 
 
 
 


---

 
682
How do custom events improve component 
communication? 
# How do custom events improve component communication 
 
In modern web development, applications are often built from reusable components. Components 
should ideally be self-contained and loosely coupled. **Custom events** provide a way for 
components to communicate without tight coupling, leading to cleaner architectures. 
 
## Native events vs custom events 
 
The browser dispatches many built-in events such as `click`, `input`, `scroll` and `submit`. Sometimes 
you need to signal something that doesn't fit any built-in event, such as "todo item completed" or 
"user logged in". That's where custom events come in. You can create and dispatch your own events 
using the `CustomEvent` constructor: 
 
```js 
const event = new CustomEvent("todo-completed", { 
  detail: { id: 123, title: "Buy milk" }, 
  bubbles: true, // allow the event to bubble up the DOM 
  composed: true, // allow it to cross Shadow DOM boundaries 
}); 
someElement.dispatchEvent(event); 
``` 
 
The `detail` property carries any data you want to pass along. The `bubbles` option specifies whether 
the event should bubble up through ancestor elements, and `composed` allows crossing shadow 
DOM boundaries so that events can propagate out of Web Components. 
 
## Decoupling components 
 
Consider a to-do app built from separate components: a `TodoItem` and a `TodoList`. Instead of the 
parent directly calling a method on the child or vice versa, the child can dispatch an event when 
something interesting happens. The parent listens and responds. 
 


---

 
683
```html 
<!-- parent component --> 
<ul id="todo-list"></ul> 
<script type="module"> 
  // Create a custom element for TodoItem 
  class TodoItem extends HTMLElement { 
    connectedCallback() { 
      this.innerHTML = `<label><input type="checkbox"> <slot></slot></label>`; 
      this.querySelector("input").addEventListener("change", (e) => { 
        if (e.target.checked) { 
          // dispatch a custom event upward 
          this.dispatchEvent( 
            new CustomEvent("complete", { 
              detail: { text: this.textContent.trim() }, 
              bubbles: true, 
            }) 
          ); 
        } 
      }); 
    } 
  } 
  customElements.define("todo-item", TodoItem); 
 
  const list = document.getElementById("todo-list"); 
  list.addEventListener("complete", (e) => { 
    console.log("Todo completed:", e.detail.text); 
    // Remove the item or mark it done 
    e.target.classList.add("done"); 
  }); 
  // Add items 
  list.innerHTML = `<todo-item>Buy milk</todo-item><todo-item>Walk dog</todo-item>`; 


---

 
684
</script> 
``` 
 
Here, each `<todo-item>` dispatches a `complete` event when its checkbox is checked. The `todo-list` 
listens for the event and reacts. The child doesn't need to know about the parent, and the parent 
doesn't need a reference to each child. This loose coupling improves maintainability and testability. 
 
## Event bubbling and delegation 
 
Because custom events can bubble, you can attach a listener on a high-level container and respond 
to events from many descendants. This is known as **event delegation**. It reduces the number of 
listeners and makes it easy to handle dynamically added elements. 
 
If you dispatch an event from within a Shadow DOM and want it to cross the boundary, set 
`composed: true`. Without this, the event stops at the shadow root. 
 
## Benefits of custom events 
 
- **Loose coupling:** Components communicate via events instead of direct method calls. 
- **Scalability:** Event delegation scales to many child components with minimal listeners. 
- **Reusability:** A component can be used in different contexts. It simply emits events; consumers 
decide how to handle them. 
- **Lifecycle awareness:** Events can signal component lifecycle milestones (mounted, destroyed, 
updated) for instrumentation or cleanup. 
 
## Practice questions 
 
1. **Theory:** How does setting the `bubbles` and `composed` options affect a custom event's 
propagation? When would you set them to `false`? 
2. **Theory:** Explain why custom events promote loose coupling in component architecture. 
3. **Coding:** Create a `counter-button` custom element that dispatches `increment` and 
`decrement` events when clicked. Show how a parent component listens to update a total. 
4. **Coding:** Build a modal component that dispatches a `close` custom event when the user clicks 
outside or presses the escape key. Use event bubbling so the parent can remove the modal. 


---

 
685
 
 
 


---

 
686
What is the difference between innerHTML, 
outerHTML, and textContent? 
# What's the difference between `innerHTML`, `outerHTML` and `textContent` 
 
JavaScript provides several properties for reading and modifying the content of DOM elements: 
`innerHTML`, `outerHTML` and `textContent`. Although they seem similar, each serves a different 
purpose and has different performance and security implications. 
 
## `innerHTML` 
 
`innerHTML` returns or sets the **HTML markup inside** an element. When you read it, you get a 
string containing the serialized contents of the element. When you assign to it, the browser parses 
the string as HTML and replaces the element's children. 
 
```js 
const div = document.querySelector("#container"); 
console.log(div.innerHTML); // "<p>Hello <strong>world</strong></p>" 
div.innerHTML = "<span>New content</span>"; 
``` 
 
Because `innerHTML` parses HTML, it can be expensive on large fragments. It also poses a security 
risk: setting `innerHTML` from untrusted data can introduce cross-site scripting (XSS) vulnerabilities. 
Always sanitize untrusted input before assigning to `innerHTML`. 
 
## `outerHTML` 
 
`outerHTML` returns or sets the **HTML markup of the element itself and its contents**. Reading it 
serializes the entire element, including its opening and closing tags. Assigning to `outerHTML` parses 
the string and replaces the element itself with new content. 
 
```js 
const heading = document.querySelector("h1"); 
console.log(heading.outerHTML); // "<h1>Title</h1>" 


---

 
687
heading.outerHTML = "<h2>New Title</h2>"; // replaces <h1> entirely 
``` 
 
Use `outerHTML` when you need to replace an element altogether. Like `innerHTML`, it should not 
be used with untrusted content. 
 
## `textContent` 
 
`textContent` returns or sets the **raw text** contained within an element and its descendants. It 
strips any HTML tags. Assigning to it escapes any HTML characters, inserting text exactly as provided. 
 
```js 
const div = document.querySelector("#message"); 
div.textContent = "<em>Not parsed</em>"; // inserts literal characters, not HTML 
``` 
 
Since `textContent` does not parse HTML, it is much faster than `innerHTML` and safe to use with 
untrusted input. It is the preferred way to set plain text. 
 
## Summary and performance 
 
 
Because `innerHTML` and `outerHTML` involve parsing and serializing HTML, they are slower than 
`textContent`. `innerHTML` may trigger a reflow if the new markup affects layout. `textContent` 
simply updates text nodes and is more efficient. 
 
## Practice questions 
 
1. **Theory:** Explain why assigning user input directly to `innerHTML` can be dangerous. How can 
you mitigate this risk? 


---

 
688
2. **Theory:** What happens when you set `textContent = "<strong>hi</strong>"`? Why is this 
useful? 
3. **Coding:** Write a function `setSanitizedHTML(element, html)` that safely inserts HTML by 
stripping `<script>` tags and event attributes before setting `innerHTML`. 
4. **Coding:** Given an element `<div id="comments"></div>`, demonstrate how to append a new 
comment as plain text using `textContent` without replacing existing comments. 
 
 
 


---

 
689
What is the difference between CORS preflight and 
simple requests? 
# What's the difference between CORS preflight and simple requests 
 
**Cross-Origin Resource Sharing (CORS)** allows a web application on one origin to request 
resources from a different origin. Because cross-origin requests can pose security risks, the browser 
follows strict rules before sending them. Requests fall into two categories: **simple requests** and 
**preflighted requests**. 
 
## Simple requests 
 
A request is considered _simple_ if it meets all of the following criteria: 
 
1. **Method** is one of `GET`, `HEAD` or `POST`. 
2. **Headers** are only simple request headers (e.g. `Accept`, `Accept-Language`, `Content-
Language`, `Content-Type` with a value of `text/plain`, `application/x-www-form-urlencoded` or 
`multipart/form-data`). 
3. **No custom headers**: It does not include authorization headers like `Authorization` or `X-
Custom-Header`. 
4. **No `content-type` other than the three permitted values** for POST. 
 
For simple requests, the browser directly sends the HTTP request with the requested method and 
headers. If the server's response includes appropriate CORS headers (e.g. `Access-Control-Allow-
Origin`), the browser makes the response available to the JavaScript code. There is **no extra 
network round trip** before the actual request. 
 
## Preflighted requests 
 
If a request uses methods other than `GET`, `HEAD` or `POST`, or it includes custom headers or uses a 
disallowed `Content-Type`, the browser must perform a **preflight**. A preflight is an HTTP 
`OPTIONS` request sent to the target server with the following headers: 
 
- `Access-Control-Request-Method`: The actual HTTP method to be used. 
- `Access-Control-Request-Headers`: A comma-separated list of non-simple headers the request will 
include. 


---

 
690
- `Origin`: The origin of the calling page. 
 
The server must respond to the preflight with `Access-Control-Allow-Methods` and, if necessary, 
`Access-Control-Allow-Headers` and `Access-Control-Allow-Origin`. Only if the server allows the 
requested method and headers will the browser proceed to send the actual request. If the preflight 
fails (e.g. the method is not allowed), the browser aborts the request and your JavaScript code 
receives an error. 
 
## Why preflights exist 
 
Preflights protect users and servers by requiring explicit permission before potentially dangerous or 
unexpected requests. For example, a malicious site might try to send a `PUT` request with a custom 
`Authorization` header to an API. Without preflight, the browser would allow the request, potentially 
leaking sensitive information. With preflight, the API must explicitly opt in, preventing unauthorized 
access. 
 
## When to avoid preflights 
 
Preflights add an extra round trip and latency. To avoid them: 
 
- Stick to simple methods (`GET` and `POST`) with permitted content types. 
- Avoid custom headers unless absolutely necessary. Use standard headers or encode data in the URL 
or request body. 
- Configure the server to respond with the right CORS headers. If you control the server, you can 
allow specific methods and headers so preflight responses succeed. 
 
## Example 
 
Imagine a frontend at `https://app.example` calling an API at `https://api.example` with a `PUT` 
request containing JSON and a custom header: 
 
```js 
fetch("https://api.example/users/123", { 
  method: "PUT", 
  headers: { 


---

 
691
    "Content-Type": "application/json", 
    "X-Auth-Token": "abc123", 
  }, 
  body: JSON.stringify({ name: "Alice" }), 
}); 
``` 
 
Because the method is `PUT` and includes a custom header, the browser will: 
 
1. Send a preflight `OPTIONS` request to `https://api.example/users/123` with `Access-Control-
Request-Method: PUT` and `Access-Control-Request-Headers: X-Auth-Token, Content-Type`. 
2. If the server responds with `Access-Control-Allow-Methods: PUT` and `Access-Control-Allow-
Headers: X-Auth-Token, Content-Type`, the browser will send the actual `PUT` request. 
3. The server must also include `Access-Control-Allow-Origin: https://app.example` or `*` in both 
responses. 
 
## Practice questions 
 
1. **Theory:** What are the conditions for a request to be considered simple? Why do these 
requests skip the preflight? 
2. **Theory:** Explain how preflighted requests prevent some types of attacks. 
3. **Coding:** Write a fetch request that triggers a CORS preflight and describe the sequence of 
network requests. 
4. **Coding:** Modify the request to avoid a preflight if possible. Explain what changes you made. 
 
 
 


---

 
692
How does sandbox attribute in iframes affect script 
execution? 
# How does the `sandbox` attribute in iframes affect script execution 
 
The `<iframe>` element allows you to embed another page inside your site. Without restrictions, the 
embedded page can run scripts, submit forms or navigate the parent. The `sandbox` attribute 
provides a way to constrain what an embedded page can do. By default, applying `sandbox` creates a 
_locked-down_ environment; you then selectively enable capabilities via the `allow-*` tokens. 
 
## Default sandbox restrictions 
 
When you add the `sandbox` attribute with no value (or with an empty string), the iframe loses many 
privileges: 
 
- **No script execution:** JavaScript and other scripts are disabled. The page cannot run inline 
scripts or load external scripts. 
- **No forms:** The page cannot submit forms. 
- **No popups or new windows:** The page cannot open new windows via `window.open()`. 
- **No same-origin privileges:** Even if the iframe's content is from the same origin, it is treated as 
if it were cross-origin. The parent cannot access the iframe's DOM via `contentWindow` and vice 
versa. 
- **No modal dialogs:** The page cannot call `alert`, `confirm` or `prompt`. 
- **No pointer lock, geolocation, or top-level navigation.** 
 
These restrictions make sandboxed iframes ideal for isolating untrusted content. 
 
## Relaxing restrictions with sandbox tokens 
 
You can gradually restore specific capabilities by adding allow tokens in the `sandbox` attribute. Some 
common tokens: 
 
- `allow-scripts`: Allows executing JavaScript. If you include this token but not `allow-same-origin`, the 
script runs in a unique origin and cannot access cookies or localStorage. 


---

 
693
- `allow-same-origin`: Treats the iframe as same origin. Use with caution—if you also allow scripts, 
the iframe could break out of confinement. 
- `allow-forms`: Allows form submission. 
- `allow-popups`: Allows opening new windows or tabs. 
- `allow-popups-to-escape-sandbox`: Allows popups opened by the sandboxed document to not 
inherit the sandbox restrictions. 
- `allow-modals`, `allow-top-navigation`, `allow-pointer-lock`: Enable dialogs, navigating top-level 
browsing context, or pointer locking. 
 
Example: 
 
```html 
<iframe 
  src="https://untrusted.example" 
  sandbox="allow-scripts allow-forms" 
></iframe> 
``` 
 
Here, the iframe can run scripts and submit forms but cannot navigate its top-level frame or access 
cookies because `allow-same-origin` is absent. 
 
## Interaction with Content Security Policy (CSP) 
 
Even if you allow scripts via `sandbox`, CSP rules on the parent or the embedded document still 
apply. For example, if the embedded page's own CSP forbids inline scripts, they will still be blocked. 
Likewise, if the parent page uses a CSP with `frame-ancestors` directive, it can prevent other sites 
from embedding it at all. 
 
## Shadow DOM and sandbox 
 
Sandboxing isolates the iframe from the parent DOM but is separate from the Shadow DOM concept. 
The `sandbox` attribute controls privileges at the browsing context level, whereas Shadow DOM 
encapsulates styles and markup within a component. You can nest sandboxed iframes inside Shadow 
DOM, but they remain independent mechanisms. 


---

 
694
 
## Practice questions 
 
1. **Theory:** What happens when you add `sandbox` with no tokens to an iframe? List at least 
three restrictions it imposes. 
2. **Theory:** Why is combining `allow-scripts` and `allow-same-origin` potentially dangerous? Give 
an example scenario. 
3. **Coding:** Create an iframe that embeds a third-party comments widget. Allow scripts to run 
but prevent access to cookies and localStorage. Explain which tokens you use and why. 
4. **Coding:** Demonstrate how a parent page can use postMessage to communicate with a 
sandboxed iframe. Highlight security considerations. 
 
 
 


---

 
695
What are cross-origin resource policies (CORP, COEP, 
COOP) and why do they matter? 
# What are cross-origin resource policies (CORP, COEP, COOP) and why do they matter 
 
Web security has evolved to protect against cross-origin data leaks and to enable powerful features 
like SharedArrayBuffer. Three complementary HTTP headers—**Cross-Origin Resource Policy 
(CORP)**, **Cross-Origin Embedder Policy (COEP)** and **Cross-Origin Opener Policy (COOP)**—
allow sites to opt in to stricter isolation. Together, COOP and COEP provide **cross-origin 
isolation**, which unlocks high-resolution timers and shared memory in browsers. 
 
## Cross-Origin Resource Policy (CORP) 
 
`Cross-Origin-Resource-Policy` instructs the browser whether a resource can be loaded by other 
origins. It has three possible values: 
 
- `same-origin`: Only the same origin can load the resource. Requests from other origins will be 
blocked. 
- `same-site`: Only the same site (including subdomains) can load the resource. 
- `cross-origin`: Any origin may load the resource (default). Use this for public assets. 
 
CORP helps prevent _side-channel attacks_ where a malicious page attempts to fetch a resource and 
infer its content based on response timing or error messages. For example, an image served with 
`same-origin` cannot be embedded by another origin. 
 
## Cross-Origin Embedder Policy (COEP) 
 
`Cross-Origin-Embedder-Policy` controls which cross-origin resources (scripts, images, etc.) your page 
is allowed to load. It has two primary values: 
 
- `unsafe-none`: The default; allows embedding cross-origin resources without restrictions. 
- `require-corp`: Your page may only load cross-origin resources that either explicitly allow being 
embedded with `Cross-Origin-Resource-Policy: cross-origin` or come from the same origin. Resources 
without CORP or CORS headers will be blocked. 
 


---

 
696
COEP effectively protects you from accidentally including third-party resources that might leak data, 
and is one half of achieving cross-origin isolation. 
 
## Cross-Origin Opener Policy (COOP) 
 
`Cross-Origin-Opener-Policy` defines the relationship between your page and any opened windows 
or tabs. It also determines whether your page shares the same browsing context group with pages 
from other origins. Important values: 
 
- `unsafe-none`: Default; your page shares a browsing context group with any opener, meaning 
`window.opener` is available and resources like `document.cookie` can be leaked via side channels. 
- `same-origin`: The opener of your window must be the same origin; otherwise the browsing 
contexts are isolated. `window.opener` becomes `null` for cross-origin openers. 
- `same-origin-allow-popups`: Similar to `same-origin`, but allows popups to share a browsing context 
group with each other if they are same-origin. 
 
By isolating browsing contexts, COOP prevents cross-origin pages from using `window.opener` to 
manipulate or peek into each other's state. 
 
## Cross-origin isolation 
 
To enable features like SharedArrayBuffer and performance.now() with nanosecond resolution, a 
document must be **cross-origin isolated**. This requires both COEP and COOP: 
 
```http 
Cross-Origin-Embedder-Policy: require-corp 
Cross-Origin-Opener-Policy: same-origin 
``` 
 
With these headers in place, the browser ensures that the page does not share its memory or 
performance timing information with any non-isolated cross-origin contexts. In return, you can safely 
use SharedArrayBuffer, Atomics and high-precision timers. 
 
## Why they matter 


---

 
697
 
- **Security:** They mitigate side-channel attacks and cross-site leaks by limiting who can load your 
resources and preventing untrusted pages from interacting with yours. 
- **Performance features:** Cross-origin isolation is required for SharedArrayBuffer, which enables 
true multithreading via Web Workers with shared memory. It also restores `performance.now()` 
precision beyond the default reduced resolution. 
- **Future web APIs:** Many upcoming APIs (like WebAssembly threads) rely on cross-origin 
isolation. Using CORP, COEP and COOP prepares your site for these features. 
 
## Practice questions 
 
1. **Theory:** Explain the difference between `Cross-Origin-Resource-Policy: same-site` and `Cross-
Origin-Embedder-Policy: require-corp`. How do they complement each other? 
2. **Theory:** What must be set on a document to achieve cross-origin isolation and why is it 
required for SharedArrayBuffer? 
3. **Coding:** Configure an Express.js server to serve images with `Cross-Origin-Resource-Policy: 
same-origin` and a script with `Cross-Origin-Resource-Policy: cross-origin`. Test loading them from 
another origin and observe the results. 
4. **Coding:** Use the `fetch()` API to load a resource from a server that does not send CORP or 
CORS headers. Then update the server to include `Cross-Origin-Resource-Policy: cross-origin` and 
observe the difference when COEP is enabled on your page. 
 
 
 


---

 
698
What is a content-type sniffing attack and how can JS 
prevent it? 
# What is a content-type sniffing attack and how can JS prevent it 
 
Browsers need to know how to interpret a resource—whether it is a script, an image, a PDF or plain 
text. They generally trust the `Content-Type` header sent by the server. However, to be user-friendly, 
browsers sometimes perform **content sniffing**: they attempt to infer the type of a resource if 
the `Content-Type` is ambiguous or missing. While helpful in some cases, this behavior opens the 
door to **content-type sniffing attacks**. 
 
## The attack 
 
A content-type sniffing attack occurs when a browser interprets a resource as executable (e.g. HTML 
or JavaScript) even though the server intended to serve it as something else (e.g. an image or text 
file). A malicious actor can exploit this by storing an HTML/JS payload on a server that expects only 
images. If the browser guesses incorrectly and executes the content, it may run attacker-supplied 
scripts in the context of your site. 
 
Consider a file upload endpoint that stores user uploads in a public `/uploads` folder and serves 
them with a generic `Content-Type: application/octet-stream`. An attacker uploads a file containing 
`<script>alert(1)</script>`. When a victim views the uploaded file, the browser might sniff it as HTML 
and execute the script, leading to cross-site scripting (XSS). 
 
## Defending against sniffing 
 
### Use correct `Content-Type` 
 
Always set accurate `Content-Type` headers for responses. For user-uploaded files, determine the 
MIME type server-side and send it accordingly. Avoid serving untrusted content with ambiguous 
types. 
 
### Send `X-Content-Type-Options: nosniff` 
 
This HTTP header tells the browser **not** to perform content sniffing. When set, the browser must 
respect the provided `Content-Type`. If the type doesn't match the expected resource, the browser 
will block the resource instead of guessing and running it. 


---

 
699
 
For example: 
 
```http 
X-Content-Type-Options: nosniff 
Content-Type: image/png 
 
...binary PNG data... 
``` 
 
If a script is served as `image/png` with `nosniff`, the browser will refuse to execute it. 
 
### Validate and sanitize uploads 
 
On the server, validate uploaded files: check their content matches the claimed MIME type, restrict 
allowed types, and sanitize filenames. Store uploads outside of publicly accessible paths or serve 
them from a different domain to isolate them from your main site. 
 
### Use JavaScript safely 
 
When fetching data with `fetch()` or XHR, examine the `Content-Type` header and avoid using 
potentially executable responses in dangerous ways. For example, do not insert untrusted text into 
`innerHTML`. Use `textContent` for plain text and parse JSON with `response.json()`. 
 
Example of safe image loading in JavaScript: 
 
```js 
async function loadImage(url) { 
  const res = await fetch(url, { mode: "cors" }); 
  const type = res.headers.get("Content-Type") || ""; 
  if (!type.startsWith("image/")) { 
    throw new Error("Not an image"); 


---

 
700
  } 
  const blob = await res.blob(); 
  const imgUrl = URL.createObjectURL(blob); 
  const img = new Image(); 
  img.src = imgUrl; 
  document.body.appendChild(img); 
} 
``` 
 
This function ensures the server returns an image before creating an `<img>` element. It avoids 
content sniffing by verifying the header. 
 
## Practice questions 
 
1. **Theory:** Why do browsers perform content sniffing? What risks does it introduce? 
2. **Theory:** How does the `X-Content-Type-Options: nosniff` header help mitigate content-type 
sniffing attacks? What happens if the header is missing? 
3. **Coding:** Write server code (in Express or another framework) that serves files with proper 
`Content-Type` headers and includes `X-Content-Type-Options: nosniff`. 
4. **Coding:** Implement a fetch wrapper that verifies the MIME type before creating DOM 
elements. How would you extend it to handle JSON, images and text safely? 
 
 
 


---

 
701
What is the Observer pattern and how is it 
implemented in JavaScript? 
# What is the observer pattern and how is it implemented in JavaScript 
 
The **observer pattern** is a design pattern in which an object (called the _subject_ or 
_observable_) maintains a list of dependent objects (called _observers_) and notifies them 
automatically when its state changes. This allows the subject to publish state changes without 
knowing anything about the observers' internal details, promoting a loose coupling. 
 
## Key components 
 
- **Subject (observable):** Holds the state being observed and a collection of observers. Provides 
methods to subscribe or unsubscribe observers and a method to notify them of changes. 
- **Observers:** Objects that want to be notified when the subject changes. They implement an 
`update()` or similar method called by the subject. 
 
## Why use the observer pattern 
 
- **Decoupling:** The subject does not need to know how many observers there are or what they 
do; it simply notifies them. Observers can be added or removed at runtime. 
- **Reactivity:** Changes propagate automatically. This pattern underpins many reactive 
frameworks (e.g. RxJS, Vue's reactivity system) and event-driven architectures. 
- **Maintainability:** The pattern centralizes state changes and reduces the number of direct 
method calls between components. 
 
## Implementing a simple observer pattern in JavaScript 
 
Below is an implementation of a subject that manages a list of observers. Observers are objects that 
define an `update()` method. 
 
```js 
class Observable { 
  constructor(value) { 
    this._value = value; 


---

 
702
    this._observers = new Set(); 
  } 
  get value() { 
    return this._value; 
  } 
  set value(newValue) { 
    if (newValue !== this._value) { 
      this._value = newValue; 
      this.notify(newValue); 
    } 
  } 
  subscribe(observer) { 
    this._observers.add(observer); 
    // Immediately send current value to new observer 
    observer.update(this._value); 
    return () => this._observers.delete(observer); 
  } 
  notify(val) { 
    this._observers.forEach((obs) => obs.update(val)); 
  } 
} 
 
// Usage 
const state = new Observable(0); 
 
const logger = { 
  update(value) { 
    console.log("State changed to", value); 
  }, 
}; 
 


---

 
703
const unsubscribe = state.subscribe(logger); 
state.value = 42; // logs "State changed to 42" 
unsubscribe(); 
state.value = 100; // no log, observer unsubscribed 
``` 
 
The `Observable` class encapsulates a value and notifies subscribed observers whenever it changes. 
Observers can unsubscribe by calling the returned function. 
 
## Observer pattern vs event emitters 
 
JavaScript environments like Node.js provide an `EventEmitter` which implements a similar pattern. 
You can subscribe to named events and emit them when appropriate: 
 
```js 
const EventEmitter = require("events"); 
const emitter = new EventEmitter(); 
 
emitter.on("data", (payload) => { 
  console.log("Received:", payload); 
}); 
 
emitter.emit("data", { id: 1, value: 10 }); 
``` 
 
Here, `emitter` acts as a subject and handlers act as observers. The principle remains the same: 
decoupled notification of state changes or events. 
 
## When to use the observer pattern 
 
- Building reactive UI components that should update when underlying data changes. 
- Implementing pub-sub systems, event emitters or state management libraries. 


---

 
704
- Coordinating asynchronous processes (e.g. network events, WebSocket messages). 
 
## Practice questions 
 
1. **Theory:** Describe the roles of the subject and observer in the observer pattern. How does the 
pattern promote loose coupling? 
2. **Theory:** What are some real-world examples of the observer pattern in browser APIs or 
JavaScript libraries? 
3. **Coding:** Extend the `Observable` class above to support multiple values (e.g. an observable 
object with multiple keys). Write a test observer that listens to changes on a specific key. 
4. **Coding:** Use Node.js `EventEmitter` to implement a chat room where users can subscribe to 
receive messages. Explain how this illustrates the observer pattern. 
 
 
 


---

 
705
What is the Publish–Subscribe pattern and how does it 
differ from Observer? 
# What is the publish-subscribe pattern and how does it differ from observer 
 
The **publish-subscribe (pub-sub) pattern** is a messaging pattern where senders (_publishers_) 
emit events to a central broker, and receivers (_subscribers_) express interest in certain event types. 
Publishers and subscribers do not know about each other; the broker routes messages based on 
topic or event name. This decoupling makes the pattern useful for systems where components must 
communicate without tight coupling. 
 
## How pub-sub works 
 
1. **Subscribers** register interest in one or more topics. They provide a callback to be executed 
when a message on that topic is published. 
2. **Publishers** emit messages to the broker, tagging each message with a topic. 
3. The **broker** looks up subscribers for that topic and invokes their callbacks with the message 
payload. Subscribers can subscribe or unsubscribe at runtime. 
 
### Example: a simple message bus in JavaScript 
 
```js 
class PubSub { 
  constructor() { 
    this.topics = new Map(); 
  } 
  subscribe(topic, handler) { 
    if (!this.topics.has(topic)) { 
      this.topics.set(topic, new Set()); 
    } 
    this.topics.get(topic).add(handler); 
    return () => this.topics.get(topic).delete(handler); 
  } 
  publish(topic, data) { 


---

 
706
    const handlers = this.topics.get(topic); 
    if (!handlers) return; 
    handlers.forEach((handler) => handler(data)); 
  } 
} 
 
const bus = new PubSub(); 
const unsubscribe = bus.subscribe("news", (article) => { 
  console.log("Breaking news:", article.headline); 
}); 
 
bus.publish("news", { headline: "New JavaScript release" }); 
unsubscribe(); 
bus.publish("news", { headline: "Second article" }); 
``` 
 
In this implementation, subscribers listen for the `'news'` topic. When a publisher publishes a 
message with that topic, the message is delivered to all subscribed handlers. 
 
When you call `bus.subscribe('news', handler)`, you are telling the message bus: "Please call my 
`handler` function whenever someone publishes a `'news'` message." Internally, the `subscribe()` 
method adds your handler to a list of listeners for that topic. To give you an easy way to stop listening 
later, `subscribe()` returns another function. 
 
Think of it like signing up for a newsletter: you give the publisher your email address, and they start 
sending you updates. Along with your subscription, they include a special "unsubscribe" link. If you 
click that link, they remove your email address from their mailing list so you stop receiving messages. 
 
In the code, we store that "unsubscribe link" in a variable: 
 
```js 
const unsubscribe = bus.subscribe("news", (article) => { 
  console.log("Breaking news:", article.headline); 


---

 
707
}); 
``` 
 
The `unsubscribe` variable now holds a function. Whenever you no longer want to receive `'news'` 
messages, you call it: 
 
```js 
unsubscribe(); // stop receiving news updates 
``` 
 
After calling `unsubscribe()`, any future calls to `bus.publish('news', ...)` won't trigger your handler. 
Saving the returned function in a variable like `unsubscribe` is just a convenient way to keep a 
reference to it so you can clean up your listener later. 
 
## Differences between pub-sub and observer 
 
Although the pub-sub and observer patterns both involve one-to-many communication, there are 
key differences: 
 
- **Direct vs. mediated:** In the observer pattern, observers subscribe directly to a specific subject 
and the subject notifies them. In pub-sub, publishers and subscribers are decoupled via a broker. The 
subject (topic) does not directly know its subscribers. 
- **Topics/queues:** Pub-sub uses a named channel (topic) or queue. Observers typically register 
with a specific object, not a global topic. 
- **Unknown publishers:** Observers know which subject they observe; subscribers to a pub-sub 
system may not know who publishes messages. 
- **Scalability:** Pub-sub scales to distributed systems and message queues (e.g. RabbitMQ, Kafka) 
where publishers and subscribers may run on different machines. Observer is often used within a 
single process or object graph. 
 
## When to use pub-sub 
 
- Decoupling modules in a large application. For example, a logging service can subscribe to `'error'` 
events without the application knowing about it. 
- Implementing event buses or global event systems in browser or Node.js apps. 


---

 
708
- Distributing events across processes or servers using message brokers or WebSockets. 
 
## Practice questions 
 
1. **Theory:** Explain how the publish-subscribe pattern decouples publishers and subscribers. 
What are the benefits of this decoupling? 
2. **Theory:** List two differences between the pub-sub and observer patterns. 
3. **Coding:** Implement a basic pub-sub system that supports wildcard subscriptions (e.g. 
subscribing to `'user.*'` to receive both `'user.login'` and `'user.logout'`). 
4. **Coding:** Use the pub-sub pattern to implement a notification system where different modules 
can publish success or error notifications. Demonstrate subscribing and unsubscribing to a topic. 
 
 
 


---

 
709
Explain functional composition in JavaScript 
# Explain functional composition in JavaScript 
 
Functional composition is the process of combining multiple functions so that the output of one 
becomes the input of the next. Rather than calling functions one after the other manually, 
composition creates a new function that represents the pipeline of operations. This leads to code 
that is declarative, reusable and easy to test. 
 
## What is composition 
 
Given two functions `f` and `g`, the composition `f ∘ g` is a function such that `(f ∘ g)(x) = f(g(x))`. In 
JavaScript, you can compose functions manually: 
 
```js 
const toUpper = (str) => str.toUpperCase(); 
const exclaim = (str) => `${str}!`; 
 
const shout = (str) => exclaim(toUpper(str)); 
 
console.log(shout("hello")); // "HELLO!" 
``` 
 
The `shout` function composes `toUpper` and `exclaim`. Composition becomes more powerful when 
you compose many functions and reuse the resulting pipeline. 
 
## Building a generic `compose` function 
 
We can write a higher-order function that takes an arbitrary number of functions and returns their 
composition. A common implementation composes functions from right to left: 
 
```js 
function compose(...fns) { 
  return (initial) => { 


---

 
710
    return fns.reduceRight((value, fn) => fn(value), initial); 
  }; 
} 
 
const trim = (s) => s.trim(); 
const lower = (s) => s.toLowerCase(); 
const addPeriod = (s) => s + "."; 
 
const tidy = compose(addPeriod, lower, trim); 
console.log(tidy("  Hello World  ")); // "hello world." 
``` 
 
Here, `compose(addPeriod, lower, trim)` returns a function that first applies `trim`, then `lower`, then 
`addPeriod` to the input. You can swap the order of functions or replace one function without 
affecting others. 
 
Alternatively, you can implement `pipe()` which composes functions left to right: 
 
```js 
const pipe = 
  (...fns) => 
  (initial) => 
    fns.reduce((value, fn) => fn(value), initial); 
 
const shoutPipe = pipe(trim, toUpper, exclaim); 
console.log(shoutPipe(" hello ")); // "HELLO!" 
``` 
 
## Advantages of composition 
 
- **Reusability:** You write small, single-purpose functions and compose them into more complex 
operations. 


---

 
711
- **Testability:** Each function can be tested in isolation. The composed function has no hidden 
state. 
- **Readability:** A composed pipeline reads like a data flow: the value passes through a sequence 
of transforms. 
- **Immutability:** Composed functions are pure if the individual functions are pure; they don't 
mutate shared state. 
 
## Composition in libraries 
 
Libraries like Lodash and Ramda provide helpers (`_.flow`, `R.pipe`, `R.compose`) to make 
composition easy. React's hooks and higher-order components also encourage composing 
functionality. 
 
## Practice questions 
 
1. **Theory:** In your own words, explain what function composition is and why it is useful. 
2. **Theory:** Contrast composition with chaining methods on an object (e.g. 
`array.map().filter().reduce()`). When might one be preferred? 
3. **Coding:** Write a `composeAsync()` function that handles functions returning promises. 
Compose three asynchronous functions (e.g. fetch data, parse JSON, extract a field). 
4. **Coding:** Use function composition to build a data processing pipeline that normalizes an array 
of names (trim, capitalize first letter, append an index). Show how to swap out one step without 
modifying others. 
 
 
 


---

 
712
What are Higher-Order Components (HOC) and render-
props patterns conceptually? 
# What are higher-order components (HOC) and render props patterns conceptually 
 
React encourages code reuse by allowing you to encapsulate behavior and share it between 
components.  Two common patterns for sharing logic are **higher-order components** (HOCs) and 
**render props**.  Both allow you to abstract stateful logic away from the components that use it. 
 
## Higher-order components (HOC) 
 
A higher-order component is a function that takes a component and returns a new component with 
enhanced functionality.  HOCs wrap the original component, injecting additional props or 
behavior.  They are similar to higher-order functions in functional programming. 
 
Example: a HOC to inject the current window width into any component. 
 
```jsx 
function withWindowWidth(WrappedComponent) { 
  return class extends React.Component { 
    state = { width: window.innerWidth }; 
    handleResize = () => this.setState({ width: window.innerWidth }); 
    componentDidMount() { 
      window.addEventListener('resize', this.handleResize); 
    } 
    componentWillUnmount() { 
      window.removeEventListener('resize', this.handleResize); 
    } 
    render() { 
      return <WrappedComponent width={this.state.width} {...this.props} />; 
    } 
  }; 
} 


---

 
713
 
// Usage 
const DisplayWidth = ({ width }) => <p>Window width: {width}</p>; 
const ResponsiveDisplay = withWindowWidth(DisplayWidth); 
``` 
 
`withWindowWidth` adds resize listeners and passes the width as a prop.  Any component can 
become responsive by being wrapped with this HOC.  HOCs are commonly used for cross-cutting 
concerns such as authentication, routing or theming. 
 
## Render props 
 
The render props pattern involves a component that takes a function as its `children` or `render` 
prop.  Instead of returning JSX directly, the component calls this function with relevant data or 
callbacks.  The caller decides how to render the UI. 
 
Example: a `<MouseTracker>` component that tracks mouse position and uses a render prop to 
display it. 
 
```jsx 
class MouseTracker extends React.Component { 
  state = { x: 0, y: 0 }; 
  handleMouseMove = e => { 
    this.setState({ x: e.clientX, y: e.clientY }); 
  }; 
  render() { 
    return ( 
      <div style={{ height: '100vh' }} onMouseMove={this.handleMouseMove}> 
        {this.props.render(this.state)} 
      </div> 
    ); 
  } 
} 


---

 
714
 
const App = () => ( 
  <MouseTracker render={({ x, y }) => ( 
    <p>The mouse position is ({x}, {y})</p> 
  )} /> 
); 
``` 
 
`MouseTracker` manages state internally but leaves presentation up to the caller.  Render props are 
flexible and work well for composing multiple behaviors.  They avoid component names that wrap 
the original component and are easier to type-check compared to HOCs. 
 
## Comparing the two patterns 
 
* **Composition style:** HOCs wrap components and return new components, while render props 
involve a component that invokes a function passed as a prop. 
* **Name collisions:** HOCs can cause prop name collisions if not careful. Render props avoid this 
by explicitly passing arguments to the render function. 
* **Ease of testing:** Both are testable; HOCs can be more opaque if many wrappers are stacked. 
Render props sometimes result in deeply nested JSX. 
* **Hooks era:** Since React 16.8, custom hooks have become the primary way to share logic. 
Hooks can replace many HOC or render prop patterns with simpler syntax. 
 
## Practice questions 
 
1. **Theory:** Explain the main difference between a higher-order component and a render prop. 
When would you choose one over the other? 
2. **Theory:** What problems might occur if you wrap a component with multiple HOCs? How can 
you avoid them? 
3. **Coding:** Write a HOC that injects network status (`online`/`offline`) into a component using 
the `navigator.onLine` API and `online`/`offline` events. 
4. **Coding:** Implement a render prop component `Toggle` that manages a boolean `on` state and 
provides a function to toggle it. Show how to use it to build a custom switch UI. 
 


---

 
715
 
 


---

 
716
What is dependency injection and can it be achieved in 
JavaScript? 
# What is dependency injection and can it be achieved in JavaScript 
 
**Dependency injection (DI)** is a design pattern in which an object's dependencies are provided 
from the outside rather than being created internally. Instead of hard-coding the creation of services 
or collaborators, you inject them through constructors, functions or setters. This approach promotes 
loose coupling, easier testing and flexibility. 
 
## Why dependency injection matters 
 
- **Decoupling:** Components do not need to know how to instantiate their collaborators. They can 
work with any implementation of a given interface. 
- **Testability:** During unit tests, you can inject mocks or stubs instead of real services. 
- **Flexibility:** You can switch implementations (e.g. swap a local storage service for an in-memory 
cache) without modifying the consumer. 
 
## DI in JavaScript 
 
JavaScript does not have built-in dependency injection containers like some server-side frameworks, 
but the pattern can still be applied through techniques such as: 
 
### Constructor injection 
 
Pass dependencies to a class or function at construction time. 
 
```js 
class UserService { 
  constructor(api) { 
    this.api = api; 
  } 
  async getUser(id) { 
    return await this.api.fetch(`/users/${id}`); 


---

 
717
  } 
} 
 
class ApiClient { 
  async fetch(url) { 
    const res = await fetch(url); 
    return res.json(); 
  } 
} 
 
// Dependency injection 
const apiClient = new ApiClient(); 
const userService = new UserService(apiClient); 
 
userService.getUser(1).then((user) => console.log(user)); 
``` 
 
In tests, you can inject a fake `ApiClient`: 
 
```js 
class FakeApi { 
  async fetch(url) { 
    return { id: 1, name: "Test User" }; 
  } 
} 
const testService = new UserService(new FakeApi()); 
``` 
 
### Factory functions 
 
Instead of using `new`, create objects via factory functions that accept dependencies. 


---

 
718
 
```js 
function createLogger(prefix) { 
  return (msg) => console.log(`[${prefix}]`, msg); 
} 
function createUserController(userService, logger) { 
  return { 
    async showUser(id) { 
      const user = await userService.getUser(id); 
      logger(`User loaded: ${user.name}`); 
      return user; 
    }, 
  }; 
} 
 
const logger = createLogger("App"); 
const controller = createUserController(userService, logger); 
``` 
 
### Dependency injection containers 
 
For larger applications, you can build or use a DI container. A container registers providers for 
different tokens and resolves dependencies recursively. Libraries like InversifyJS offer decorators and 
metadata to declare dependencies. 
 
Example of a simple container: 
 
```js 
class Container { 
  constructor() { 
    this.registry = new Map(); 
  } 


---

 
719
  register(token, provider) { 
    this.registry.set(token, provider); 
  } 
  resolve(token) { 
    const provider = this.registry.get(token); 
    if (typeof provider === "function") { 
      return provider(this); 
    } 
    return provider; 
  } 
} 
 
const container = new Container(); 
container.register("api", () => new ApiClient()); 
container.register("userService", (c) => new UserService(c.resolve("api"))); 
 
const svc = container.resolve("userService"); 
svc.getUser(1); 
``` 
 
## Caveats and best practices 
 
- **Avoid hidden dependencies:** Explicitly list all dependencies in constructors or factory 
functions. Hidden dependencies via module imports make testing harder. 
- **Don't over-engineer:** Small scripts don't need a full DI container. Use simple functions or 
parameters. 
- **Use interfaces or types:** In TypeScript, define interfaces for dependencies so that 
implementations can vary. 
 
## Practice questions 
 
1. **Theory:** Why is dependency injection beneficial for testing? Give an example scenario. 


---

 
720
2. **Theory:** What is the difference between constructor injection and setter injection? Which is 
preferred in JavaScript and why? 
3. **Coding:** Refactor a class that directly calls `fetch()` to instead accept an HTTP client 
dependency. Show how to inject a mock client for testing. 
4. **Coding:** Implement a simple DI container in JavaScript that supports singleton providers and 
demonstrates resolving nested dependencies. 
 
 
 


---

 
721
What are singletons and their drawbacks in JavaScript? 
# What are singletons and their drawbacks in JavaScript 
A **singleton** is a design pattern that restricts the instantiation of a class to a single instance. 
Whenever you request the singleton, the same object is returned. Singletons provide a global point 
of access to resources such as configuration, logging or database connections. 
## Implementing a singleton in JavaScript 
JavaScript's module system naturally lends itself to singleton-like behavior: modules are cached after 
the first import, so subsequent imports return the same instance. However, you can also implement 
a singleton class manually: 
 
```js 
class Logger { 
  constructor() { 
    if (Logger.instance) { 
      return Logger.instance; 
    } 
    this.logs = []; 
    Logger.instance = this; 
  } 
  log(message) { 
    this.logs.push(message); 
    console.log("[LOG]", message); 
  } 
  get count() { 
    return this.logs.length; 
  } 
} 
 
const logger1 = new Logger(); 
const logger2 = new Logger(); 
console.log(logger1 === logger2); // true 
logger1.log("Hello"); 


---

 
722
console.log(logger2.count); // 1 
``` 
 
The constructor checks if an instance already exists and returns it if so. This ensures only one 
instance is created. 
 
Alternatively, you can use an IIFE (Immediately Invoked Function Expression) to encapsulate the 
instance: 
 
```js 
const Counter = (() => { 
  let instance; 
  function create() { 
    let value = 0; 
    return { 
      increment() { 
        value++; 
      }, 
      getValue() { 
        return value; 
      }, 
    }; 
  } 
  return { 
    getInstance() { 
      if (!instance) instance = create(); 
      return instance; 
    }, 
  }; 
})(); 
 
const counterA = Counter.getInstance(); 


---

 
723
const counterB = Counter.getInstance(); 
counterA.increment(); 
console.log(counterB.getValue()); // 1 
``` 
 
## Drawbacks of singletons 
 
While singletons can simplify access to shared resources, they come with significant downsides: 
 
- **Global mutable state:** A singleton introduces global state. Any part of your application can 
mutate it, making behavior unpredictable and complicating debugging. 
- **Hidden dependencies:** Components that rely on singletons implicitly depend on them. Testing 
such components becomes harder because you must reset the singleton's state between tests. 
- **Tight coupling:** Consumers become tightly coupled to the singleton implementation. Swapping 
implementations or running multiple instances (e.g. multiple databases) becomes difficult. 
- **Concurrency issues:** In asynchronous environments, singletons may create contention or race 
conditions if not managed carefully. 
 
## Alternatives 
 
- **Dependency injection:** Inject dependencies instead of accessing singletons directly. This makes 
dependencies explicit and testable. 
- **Factory functions:** Use functions to create instances as needed. Pass them down the call chain 
rather than storing them globally. 
- **Module exports:** Use ES modules to encapsulate state and functions. If you need multiple 
instances, export a factory function instead of exporting a single shared object. 
 
## Practice questions 
 
1. **Theory:** Why do singletons make unit testing more complicated? Provide an example of test 
pollution caused by a singleton. 
2. **Theory:** Describe scenarios where a singleton might be appropriate and scenarios where it 
should be avoided. 


---

 
724
3. **Coding:** Implement a singleton pattern using ES module caching. Then show how you would 
refactor the code to avoid the singleton by injecting dependencies. 
4. **Coding:** Create a logging module that stores logs in memory but allows multiple independent 
loggers. How would you structure the module to avoid a singleton? 
 
 
 


---

 
725
What is event-driven architecture and how can it be 
implemented in JavaScript? 
# What is event-driven architecture and how can it be implemented in JavaScript 
 
**Event-driven architecture (EDA)** is a style of building software systems in which components 
communicate by emitting and responding to events rather than invoking each other directly. The 
system reacts to events as they occur, leading to loosely coupled components, better scalability and 
improved responsiveness. 
 
## Characteristics of EDA 
 
- **Producers and consumers:** Components produce events when something happens (e.g. user 
input, a message arrives). Other components consume these events and perform actions. 
- **Asynchronous communication:** Events are handled asynchronously, allowing the system to 
process multiple events concurrently without blocking. 
- **Decoupling:** Producers and consumers do not call each other directly. They interact through an 
event broker or message bus. 
- **Event flow:** Events can trigger other events, forming a reactive chain. 
 
## Event-driven JavaScript 
 
JavaScript is well suited for EDA because of its event loop and asynchronous APIs. You already use 
event-driven programming when handling DOM events (click, keydown) or Node.js events. 
 
### Browser example: custom event bus 
 
You can implement an event bus using the `EventTarget` API: 
 
```js 
// Create a global event bus 
const bus = new EventTarget(); 
 
// Listen for a custom event 


---

 
726
bus.addEventListener("user:login", (e) => { 
  console.log("User logged in:", e.detail); 
}); 
 
// Dispatch the event somewhere else in your app 
function loginUser(user) { 
  // ... authentication logic ... 
  bus.dispatchEvent(new CustomEvent("user:login", { detail: user })); 
} 
 
loginUser({ id: 1, name: "Alice" }); 
``` 
 
Here, components fire events on the bus and others listen for them. The bus decouples producers 
from consumers. You can also use libraries like mitt or build more sophisticated buses that support 
namespaces or wildcard topics. 
 
### Node.js example: EventEmitter 
 
Node.js has a built-in `EventEmitter` class used throughout the standard library: 
 
```js 
const { EventEmitter } = require("events"); 
const emitter = new EventEmitter(); 
 
// Consumer 
emitter.on("order:created", (order) => { 
  console.log("Processing order", order.id); 
}); 
 
// Producer 
function createOrder(items) { 


---

 
727
  const order = { id: Date.now(), items }; 
  emitter.emit("order:created", order); 
} 
 
createOrder(["apple", "banana"]); 
``` 
 
`EventEmitter` queues listeners and executes them asynchronously after the current call stack, 
making it ideal for I/O completion events, timers, etc. 
 
### Scaling beyond a single process 
 
In distributed systems, EDA is implemented using message brokers (e.g. RabbitMQ, Kafka, Redis 
Pub/Sub). Components publish events to a broker; other services subscribe to event streams. This 
approach decouples services, improves reliability (thanks to queues and persistence) and allows 
independent scaling. Libraries like `amqplib` (RabbitMQ) or `kafkajs` can be used in Node.js to 
integrate with such brokers. 
 
## Benefits and challenges 
 
**Benefits:** 
 
- Improved scalability and fault tolerance—components can be scaled independently. 
- Loose coupling—producers and consumers do not depend on each other's implementation. 
- Flexibility—new consumers can be added without modifying existing producers. 
 
**Challenges:** 
 
- Harder to trace flow—events may pass through many handlers, making debugging more complex. 
- Ordering guarantees—events might arrive out of order unless sequencing is enforced. 
- Error handling—in distributed EDA, ensure failed event processing is retried or logged 
appropriately. 
 


---

 
728
## Practice questions 
 
1. **Theory:** What are the main benefits of event-driven architecture compared to a traditional 
request-response model? 
2. **Theory:** Explain how the EventEmitter API in Node.js enables EDA. How do you handle errors 
thrown inside event handlers? 
3. **Coding:** Implement an event bus in the browser that supports namespaced events (e.g. 
`'chat:message'`). Show how producers and consumers interact through the bus. 
4. **Coding:** Set up a simple Node.js service that publishes messages to Redis Pub/Sub and 
another service that subscribes and processes them. Explain how this demonstrates EDA in a 
distributed system. 
 
 
 


---

 
729
Explain memoization strategies and cache invalidation 
techniques 
# Explain memoization strategies and cache invalidation techniques 
 
**Memoization** is an optimization technique that stores the results of expensive function calls and 
returns the cached result when the same inputs occur again.  When used properly, it can 
dramatically improve performance for pure functions that are called repeatedly with the same 
arguments.  However, effective memoization requires choosing appropriate caching strategies and 
knowing when to invalidate stale entries. 
 
## Basic memoization 
 
A simple memoization function wraps another function and caches its results based on the input 
arguments.  For functions with a single primitive argument, a plain object or `Map` suffices: 
 
```js 
function memoize(fn) { 
  const cache = new Map(); 
  return function(arg) { 
    if (cache.has(arg)) { 
      return cache.get(arg); 
    } 
    const result = fn(arg); 
    cache.set(arg, result); 
    return result; 
  }; 
} 
 
const slowSquare = n => { 
  console.log('Computing', n); 
  return n * n; 
}; 


---

 
730
 
const fastSquare = memoize(slowSquare); 
fastSquare(4); // logs "Computing 4", returns 16 
fastSquare(4); // returns 16 instantly, no log 
``` 
 
This approach works for deterministic functions with primitive arguments.  If the function takes 
multiple parameters or objects, you need a more robust key—e.g. serializing arguments with JSON or 
using a `WeakMap` keyed by object. 
 
## Advanced strategies 
 
### LRU (Least Recently Used) cache 
 
An LRU cache discards the least recently accessed items when it reaches a maximum size.  This 
prevents memory from growing unbounded.  You can implement an LRU cache by combining a map 
with a doubly linked list to track usage order.  Libraries such as `lru-cache` handle this for you. 
 
### TTL (Time to Live) 
 
You might want to invalidate cache entries after a certain period.  A TTL cache associates each entry 
with an expiration timestamp.  When retrieving a value, the cache checks whether it has 
expired.  This is useful when underlying data changes over time. 
 
### Parameter normalization 
 
Functions that accept many arguments or objects can benefit from normalizing parameters to a 
unique key.  For example, you can create a composite key by joining arguments or by using a 
WeakMap that maps argument objects to results. 
 
### Selective memoization 
 


---

 
731
Not all functions should be memoized.  Functions with side effects, non-deterministic results (e.g. 
random or time based) or huge argument spaces may not benefit.  Memoization works best with 
pure functions that return the same output for the same input. 
 
## Cache invalidation techniques 
 
Memoization caches can become stale.  You need strategies to invalidate or refresh entries: 
 
* **Manual invalidation:** Expose a method to clear the cache or remove specific keys when 
underlying data changes. 
* **Max size eviction:** In an LRU cache, old items are removed automatically when new items 
push the cache over its size limit. 
* **Time-based expiration:** Entries expire after a timeout (TTL).  When retrieving, check if the 
entry is still valid. 
* **Event-driven invalidation:** In more complex systems, listen for events (e.g. database updates) 
and invalidate related cache entries. 
 
## Example: memoizing a recursive function 
 
The classic example is the Fibonacci sequence.  A naive recursive implementation has exponential 
complexity.  Memoization turns it linear: 
 
```js 
function memoizeFib() { 
  const cache = {}; 
  function fib(n) { 
    if (n < 2) return n; 
    if (cache[n] !== undefined) return cache[n]; 
    const result = fib(n - 1) + fib(n - 2); 
    cache[n] = result; 
    return result; 
  } 
  return fib; 


---

 
732
} 
 
const fib = memoizeFib(); 
console.log(fib(40)); // computes quickly 
``` 
 
Here, the inner `fib` function uses a closure over the cache.  Without memoization, computing 
`fib(40)` would take millions of recursive calls. 
 
## Practice questions 
 
1. **Theory:** Why is memoization effective only for pure functions? Give an example where 
memoization would not help. 
2. **Theory:** Compare LRU and TTL caches. When would you choose one over the other? 
3. **Coding:** Implement a memoized version of a function that sorts arrays of numbers. How 
would you ensure the cache key uniquely identifies the input array regardless of reference? 
4. **Coding:** Write a memoization helper that supports a maximum cache size and automatically 
evicts the least recently used entry. Test it with a computationally expensive function. 
 
 
 


---

 
733
What is reactive programming and how does it differ 
from imperative programming? 
# What is reactive programming and how does it differ from imperative programming 
 
**Reactive programming** is an approach to software development focused on working with 
asynchronous data streams and the propagation of change.  Instead of writing step-by-step 
instructions (imperative code) that pull data, you declare relationships and let the system react 
automatically when data arrives or changes.  Reactive programming is particularly useful for dealing 
with user interactions, I/O events and real-time data. 
 
## Imperative vs reactive 
 
### Imperative programming 
 
Imperative code describes *how* to achieve a result by giving explicit commands.  You manage state 
and control flow manually.  For example, consider updating the UI when a user types: 
 
```js 
const input = document.getElementById('search'); 
const resultsDiv = document.getElementById('results'); 
input.addEventListener('input', async (e) => { 
  const query = e.target.value; 
  const res = await fetch(`/search?q=${encodeURIComponent(query)}`); 
  resultsDiv.textContent = await res.text(); 
}); 
``` 
 
Here you explicitly attach a listener, fetch results and update the DOM in response. 
 
### Reactive programming 
 


---

 
734
Reactive programming treats values as streams that you can transform, filter, combine and 
observe.  When a stream emits a new value, any dependent computations automatically 
update.  Libraries like RxJS provide observables for this. 
 
Example using RxJS (conceptual): 
 
```js 
import { fromEvent, of } from 'rxjs'; 
import { debounceTime, switchMap, map, catchError } from 'rxjs/operators'; 
 
const input = document.getElementById('search'); 
const resultsDiv = document.getElementById('results'); 
 
fromEvent(input, 'input').pipe( 
  debounceTime(300), 
  map(e => e.target.value), 
  switchMap(query => fetch(`/search?q=${encodeURIComponent(query)}`) 
    .then(res => res.text()) 
    .catch(() => 'Error')), // convert promise to observable 
).subscribe(text => { 
  resultsDiv.textContent = text; 
}); 
``` 
 
This code creates an observable stream of input events, debounces them, maps to query strings, 
switches to a new network request whenever the query changes and updates the UI whenever new 
results come back.  The code describes *what* should happen rather than *how* to manage control 
flow.  The RxJS library handles the timing and cancellation of requests. 
 
## Benefits of reactive programming 
 
* **Declarative:** You express transformations on data streams, leaving orchestration to the 
framework. 


---

 
735
* **Composability:** Operators like `map`, `filter`, `debounceTime`, `combineLatest` allow you to 
build complex data pipelines from simple pieces. 
* **Error handling and cancellation:** Streams can propagate errors and support cancellation 
semantics (e.g. using `switchMap` to cancel previous requests). 
* **Consistency:** Reactive code often looks similar on the client and server (e.g. RxJS in the 
browser and RxJava on the backend). 
 
## Differences from imperative programming 
 
* **Control flow:** In imperative code, you control when and how operations run.  In reactive code, 
you declare relationships and let the runtime schedule operations. 
* **State management:** Reactive systems maintain state through streams and reactive 
variables.  Imperative code stores state in variables you update manually. 
* **Concurrency:** Reactive systems are inherently asynchronous and often use non-blocking 
I/O.  Imperative code may block or require manual callback handling. 
 
## When to use reactive programming 
 
* Real-time applications (chat, live data feeds). 
* Complex user interfaces with many interdependent events and asynchronous operations. 
* Systems that need to react to multiple sources of events and combine them elegantly. 
 
## Practice questions 
 
1. **Theory:** In your own words, define reactive programming and contrast it with imperative 
programming. 
2. **Theory:** What are the advantages of using a reactive approach when dealing with user input 
and network requests? 
3. **Coding:** Using RxJS (or a similar library), create a reactive autocomplete input that fetches 
suggestions as the user types, debouncing requests and cancelling previous ones. 
4. **Coding:** Implement a simple reactive data flow without external libraries by creating a `Signal` 
class that notifies observers when its value changes. Use it to link two input fields so that changing 
one updates the other. 
 
 
 


---

 
736
How does decorator syntax enhance class behavior? 
# How does decorator syntax enhance class behavior 
 
Decorators are a proposed language feature (currently at Stage 3 of the TC39 process) that allow you 
to attach behaviors or metadata to classes, methods, fields and accessors using a concise 
`@decorator` syntax.  Decorators enable modular composition of cross-cutting concerns—such as 
logging, memoization, access control or dependency injection—without modifying the core business 
logic.  Several frameworks (e.g. Angular, NestJS) and libraries use decorators extensively. 
 
## What are decorators 
 
A **decorator** is a function applied to a class, method, field or accessor declaration.  It receives 
metadata about the target and can alter its definition or attach additional behavior.  Decorators run 
during class definition, not at runtime when methods are invoked. 
 
For example, a class decorator might modify the class constructor or static fields; a method decorator 
can wrap a method to add logging; a property decorator can enforce validation. 
 
## Examples of decorators 
 
### Method decorator: logging 
 
Suppose you want to log every call to a method.  You could write a decorator that wraps the original 
function and logs arguments and return values. 
 
```js 
function log(target, context) { 
  const { kind, name } = context; 
  if (kind === 'method') { 
    return function (...args) { 
      console.log(`Calling ${name} with`, args); 
      const result = target.apply(this, args); 
      console.log(`${name} returned`, result); 


---

 
737
      return result; 
    }; 
  } 
} 
 
class Calculator { 
  @log 
  add(a, b) { 
    return a + b; 
  } 
} 
 
const calc = new Calculator(); 
calc.add(2, 3); // logs inputs and result 
``` 
 
The `log` decorator receives the original method (`target`) and a `context` object describing the 
method.  It returns a new function that wraps the original method with logging.  When `calc.add()` is 
called, the wrapper logs the call and delegates to the original implementation. 
 
### Field decorator: memoization 
 
Decorators can also wrap getters to cache expensive computations: 
 
```js 
function memoizeAccessor(target, context) { 
  const { kind, name } = context; 
  if (kind === 'getter') { 
    const cacheKey = Symbol(name); 
    return function () { 
      if (!(cacheKey in this)) { 
        this[cacheKey] = target.call(this); 


---

 
738
      } 
      return this[cacheKey]; 
    }; 
  } 
} 
 
class Expensive { 
  @memoizeAccessor 
  get largeArray() { 
    console.log('Computing large array'); 
    return new Array(1000000).fill(0).map((_, i) => i); 
  } 
} 
 
const e = new Expensive(); 
e.largeArray; // computes and caches 
e.largeArray; // returns cached value, no log 
``` 
 
Here, the `memoizeAccessor` decorator wraps the getter so that it only executes once.  Subsequent 
accesses return the cached result. 
 
### Class decorator: registering metadata 
 
A class decorator can attach metadata for frameworks: 
 
```js 
const registry = new Map(); 
 
function controller(path) { 
  return function (target, context) { 


---

 
739
    registry.set(path, target); 
  }; 
} 
 
@controller('/users') 
class UserController { 
  // ...methods... 
} 
 
console.log(registry.get('/users') === UserController); // true 
``` 
 
The `@controller('/users')` decorator stores the class in a registry keyed by path.  Later, a framework 
could read this registry to configure routes. 
 
## Comparison with higher-order functions and classes 
 
Decorators are syntactic sugar over higher-order functions applied at declaration time.  You could 
achieve similar results by manually wrapping methods or classes, but decorators make the intent 
clear and reduce boilerplate.  Unlike higher-order components in React, which wrap components at 
runtime, class decorators run once when the class is defined. 
 
## Current status and limitations 
 
The decorator proposal is still experimental and may evolve.  Not all environments support 
decorators yet.  Transpilers like Babel or TypeScript support older decorator syntax, but it differs from 
the current proposal shown here.  When using decorators today, check your tooling and be aware 
that the API may change. 
 
## Practice questions 
 
1. **Theory:** What kinds of elements (class, method, field) can be decorated, and what does a 
decorator function receive as arguments? 


---

 
740
2. **Theory:** How does a decorator differ from a higher-order function? When would you prefer 
one over the other? 
3. **Coding:** Implement a method decorator `time` that measures and logs the execution time of a 
method. Apply it to a function that performs a heavy computation. 
4. **Coding:** Create a class decorator `sealed` that prevents further modification of the class 
prototype (e.g. using `Object.seal()`). Demonstrate its effect. 
 
 
 


---

 
741
What are import assertions and how do they ensure 
module type safety? 
# What is import assertions and how do they ensure module type safety 
 
When using JavaScript modules, the default behavior is to treat imported files as JavaScript. 
However, modern applications often import other types of resources, such as JSON or CSS modules. 
**Import assertions** provide a standardized way to explicitly declare the expected type of a 
module when importing it. By asserting the type, you help the JavaScript engine validate that the 
imported content matches your expectation and prevent silent failures or security issues. 
 
## Why import assertions were introduced 
 
Historically, browsers and bundlers allowed syntax like `import data from './data.json';` to import 
JSON as if it were a JavaScript module. This was convenient but ambiguous: what if a `.js` file is 
accidentally served as JSON? To remove this ambiguity and improve security, the ECMAScript spec 
introduced **import assertions**—an extra clause in the import statement that declares the 
module's type. 
 
## Syntax of import assertions 
 
Import assertions use the `assert` keyword followed by an object literal after the module specifier: 
 
```js 
import userData from "./user.json" assert { type: "json" }; 
 
// or with dynamic import 
const strings = await import(`/i18n/${lang}.json`, { 
  assert: { type: "json" }, 
}); 
``` 
 
In the static form, the `assert { type: 'json' }` tells the loader to treat the imported resource as JSON. 
If the resource is not of the asserted type, the import will fail with a syntax error. In the dynamic 
form, the second argument is an options object with an `assert` property. 


---

 
742
 
### Supported types 
 
At the time of writing, the `type` assertion is defined for JSON (`'json'`) in browsers and Node.js. 
Future proposals may define assertions for other module formats (e.g. `css`, `wasm`). Tools and 
loaders can extend this mechanism to support custom file types. 
 
## Detailed example: importing JSON with assertions 
 
Imagine you have a `config.json` file: 
 
```json 
{ 
  "apiUrl": "https://api.example.com", 
  "timeout": 5000 
} 
``` 
 
You can import it safely in your module: 
 
```js 
// config.js 
import config from "./config.json" assert { type: "json" }; 
 
export function getApiUrl() { 
  return config.apiUrl; 
} 
``` 
 
**What happens under the hood?** 
 


---

 
743
1. The loader sees the `assert { type: 'json' }` clause and knows to parse the file as JSON, not 
JavaScript. 
2. If the server returns a MIME type that is not JSON (`application/json`), or the file contains invalid 
JSON, the import fails at parsing time rather than silently returning an unexpected value. 
3. The imported value is the parsed JSON object (`config`), which you can use immediately. You don't 
need to call `fetch()` and `JSON.parse()` yourself. 
 
If you omit the assertion and try to import a JSON file, many environments will throw an error 
because unasserted JSON imports are not allowed. Assertions explicitly opt into this behavior. 
 
## Benefits of import assertions 
 
- **Type safety:** Assertions ensure that a module is only loaded if it matches the expected format. 
They prevent accidentally interpreting a JSON file as JavaScript or vice versa. 
- **Security:** They help mitigate attacks where a malicious server returns a different file type (e.g. 
serving JavaScript when JSON was expected). The import will fail instead of executing unexpected 
code. 
- **Clarity:** The import statement documents the developer's intent. Other developers reading the 
code know that a non-JavaScript resource is being imported. 
- **Extensibility:** In the future, assertions may allow fine-grained control over module loading, 
such as specifying integrity hashes or custom loaders. 
 
## Practice questions 
 
1. **Theory:** What problem do import assertions solve, and how do they improve module type 
safety? 
2. **Theory:** How do import assertions differ between static and dynamic imports? Provide the 
correct syntax for each. 
3. **Coding:** Create a module that imports a JSON configuration file with an import assertion and 
exports a function that reads a property from it. Then write a test showing that the import fails if the 
file contains invalid JSON. 
4. **Coding:** Suppose browsers support CSS modules with `type: 'css'`. Demonstrate how you 
would import a stylesheet using an import assertion and apply it to a component. 
 
 
 


---

 
744
What is module federation and how does it enable 
micro-frontend architectures? 
# What is module federation and how does it enable micro-frontend architectures 
 
**Module Federation** is a feature introduced in webpack 5 that allows multiple separate builds to 
dynamically share and load modules at runtime. Traditionally, JavaScript bundles are isolated—code 
in one bundle cannot import code from another unless they're built together. Module Federation 
breaks this barrier by enabling applications to **expose** modules and **consume** modules from 
remote builds on demand, without needing to publish them to a package registry or rebuild the 
consuming application. 
 
Micro-frontend architecture divides a frontend application into smaller, independently developed 
and deployed fragments. Each micro-frontend may be built by a different team and has its own build 
process. Module Federation provides the tooling needed for these fragments to interoperate 
seamlessly. 
 
## How module federation works 
 
Module Federation uses two key roles: 
 
- **Host (or shell) application:** The main application that will load remote modules at runtime. 
- **Remote application:** A separate build that exposes some of its modules for consumption by 
others. 
 
Each build configures the webpack `ModuleFederationPlugin` with information about what it 
exposes and what it consumes. 
 
### Remote configuration 
 
In the remote application's webpack config: 
 
```js 
// webpack.config.js in remote app 
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin"); 


---

 
745
 
module.exports = { 
  // ... other settings ... 
  plugins: [ 
    new ModuleFederationPlugin({ 
      name: "remoteApp", 
      filename: "remoteEntry.js", 
      exposes: { 
        "./Button": "./src/components/Button.js", 
        "./utils": "./src/utils/index.js", 
      }, 
      shared: { 
        react: { singleton: true }, 
        "react-dom": { singleton: true }, 
      }, 
    }), 
  ], 
}; 
``` 
 
- `name`: Identifies this remote. 
- `filename`: The compiled file that contains the exposed modules. It is served via HTTP. 
- `exposes`: Maps internal modules to public names. These paths will be available to hosts. 
- `shared`: Declares shared dependencies so that only one copy is loaded (singleton). 
 
### Host configuration 
 
In the host application's webpack config: 
 
```js 
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin"); 


---

 
746
 
module.exports = { 
  plugins: [ 
    new ModuleFederationPlugin({ 
      remotes: { 
        remoteApp: "remoteApp@https://remote.example.com/remoteEntry.js", 
      }, 
      shared: { 
        react: { singleton: true }, 
        "react-dom": { singleton: true }, 
      }, 
    }), 
  ], 
}; 
``` 
 
Here, the host declares a `remotes` object mapping the remote's name to a URL where 
`remoteEntry.js` is served. At runtime, webpack fetches this file, resolves the exposed modules and 
makes them available via `import()`. 
 
### Loading remote modules 
 
Once configured, the host can import remote modules just like local ones: 
 
```js 
// In host application code 
import("remoteApp/Button").then(({ default: Button }) => { 
  // Use the remote Button component as if it were local 
  ReactDOM.render(<Button label="Click me" />, document.getElementById("app")); 
}); 
 
import("remoteApp/utils").then(({ formatDate }) => { 


---

 
747
  console.log(formatDate(new Date())); 
}); 
``` 
 
Webpack loads `remoteEntry.js` asynchronously, resolves the module, ensures shared dependencies 
(like React) are not duplicated, and returns the exported value. This happens at runtime, not build 
time. 
 
## Enabling micro-frontends 
 
In a micro-frontend architecture, each team can build its part of the UI as a separate project with its 
own repository and deployment pipeline. Module Federation enables these fragments to be 
integrated into a host at runtime without central coordination. 
 
For example, a dashboard might consist of several panels built by different teams. Each panel is a 
remote exposing a React component. The shell application dynamically loads the panels based on 
configuration and composes them together. When a panel team releases a new version, the host 
automatically picks it up without a rebuild. This independence accelerates deployment and reduces 
coupling between teams. 
 
### Sharing dependencies 
 
Shared dependencies (such as React) should be marked as singletons so that only one instance is 
loaded. Otherwise, multiple versions of the library might be imported, leading to inconsistent state 
or duplicate React copies. 
 
### Limitations and considerations 
 
- **Version compatibility:** All consuming apps must use compatible versions of shared libraries. 
- **Runtime failures:** If a remote is unavailable or misconfigured, the host must handle errors 
gracefully. 
- **Complexity:** Module Federation introduces additional build and deployment considerations 
(e.g. serving remoteEntry.js over HTTP). Proper versioning and contract testing are essential. 
 
## Practice questions 


---

 
748
 
1. **Theory:** Explain how the `ModuleFederationPlugin` enables a host application to load 
modules from a remote at runtime. 
2. **Theory:** What is the purpose of the `shared` section in the module federation configuration? 
Why are singletons important? 
3. **Coding:** Set up a minimal host and remote application using webpack. Expose a component 
from the remote and consume it in the host. Describe how you would handle errors if the remote 
fails to load. 
4. **Coding:** Suppose you have two remotes that both depend on the same version of a UI library. 
Show how to configure module federation so that only one copy of the library is loaded. 
 
 
 


---

 
749
What are WeakMap-based private fields and how do 
they differ from native private fields ()? 
# What are WeakMap-based private fields and how do they differ from native private fields 
 
Before the introduction of native private fields (`#field`) in JavaScript classes, developers often used 
`WeakMap`s to simulate private data. Understanding how these patterns work helps you appreciate 
the benefits and trade-offs of the new syntax. 
 
## WeakMap-based privacy pattern 
 
A `WeakMap` is a collection where keys must be objects and values can be arbitrary data. The keys 
are weakly referenced: if no other references to the key object exist, it can be garbage-collected and 
the corresponding entry in the `WeakMap` is removed. 
 
Using a `WeakMap`, you can associate private data with each instance of a class: 
 
```js 
const _privateData = new WeakMap(); 
 
class Person { 
  constructor(name, age) { 
    // Store private fields in the WeakMap 
    _privateData.set(this, { name, age }); 
  } 
  getName() { 
    return _privateData.get(this).name; 
  } 
  celebrateBirthday() { 
    const data = _privateData.get(this); 
    data.age++; 
    console.log(`${data.name} is now ${data.age}`); 
  } 


---

 
750
} 
 
const alice = new Person("Alice", 30); 
console.log(alice.getName()); // Alice 
alice.celebrateBirthday(); // logs "Alice is now 31" 
// Direct access is not possible: 
console.log(alice.name); // undefined 
``` 
 
**How it works:** 
 
1. `_privateData` is a module-level `WeakMap` keyed by instances of `Person`. 
2. In the constructor, the private values are stored in the map with `this` as the key. 
3. Methods access the private data by calling `_privateData.get(this)`. 
4. There is no public way to access the private data because it's scoped outside the class. 
5. When the instance (`alice`) is no longer referenced, the entry in the `WeakMap` disappears 
automatically. 
 
### Pros and cons of the WeakMap pattern 
 
- **Pros:** Works in older environments; private data is not exposed on the object; memory cleans 
up automatically. You can have truly private properties with dynamic names. 
- **Cons:** Slightly verbose and error-prone (you must remember to use the map in every method); 
still accessible to privileged code that closes over the WeakMap; cannot define private methods this 
way; slower access due to the map lookup. 
 
## Native private fields 
 
ECMAScript now supports **private class fields** and methods with a `#` prefix. Private fields are 
defined inside the class body and are only accessible from within the class declaration. 
 
```js 
class BankAccount { 


---

 
751
  #balance; 
  constructor(initial) { 
    this.#balance = initial; 
  } 
  deposit(amount) { 
    this.#balance += amount; 
  } 
  getBalance() { 
    return this.#balance; 
  } 
} 
 
const acct = new BankAccount(100); 
acct.deposit(50); 
console.log(acct.getBalance()); // 150 
// console.log(acct.#balance); // SyntaxError: Private field '#balance' must be declared in an 
enclosing class 
``` 
 
**Key features:** 
 
- **Lexical privacy:** The `#balance` field is only accessible from within the class body. Attempting 
to access it outside results in a syntax error. No property with that name exists on the instance; it is 
stored in an internal slot. 
- **Performance:** Native private fields have optimized access and don't require a map lookup. 
- **Private methods and accessors:** You can declare `#method()` and private getters/setters: `get 
#secret() { ... }`. These are not possible with the WeakMap pattern without additional complexity. 
- **Static private fields:** You can declare `static #counter = 0` to have per-class private state. 
 


---

 
752
## Differences at a glance
 
## When to use which 
 
Native private fields are the preferred way to declare private data in modern JavaScript. They provide 
language-level enforcement, better ergonomics and performance. However, if you need to attach 
private data to objects that are not class instances (e.g. DOM elements), or you need dynamic private 
keys, the WeakMap pattern remains useful. 
 
## Practice questions 
 
1. **Theory:** Describe how private data is stored and accessed in the WeakMap pattern versus 
native private fields. 
2. **Theory:** What happens if you try to access a native private field from outside the class? 
Contrast this with the WeakMap pattern. 
3. **Coding:** Rewrite the `Person` class using native private fields instead of a WeakMap. Include a 
private method that returns a greeting. 
4. **Coding:** Show how you might attach private data to DOM elements using a WeakMap. Explain 
why native private fields wouldn't work for this use case. 
 
 
 


---

 
753
How does lazy vs eager evaluation affect performance in 
iterables? 
# How does lazy vs eager evaluation affect performance in iterables 
 
**Lazy evaluation** delays computing values until they are needed, while **eager evaluation** 
computes values immediately when an operation is invoked. In the context of iterables, lazy 
evaluation allows you to process sequences element by element on demand, often through 
generators or iterators. Eager evaluation typically produces a fully realized array or collection up 
front. 
 
Understanding the performance implications of these strategies helps you choose the right approach 
for your use case. 
 
## Eager iterables 
 
Eager methods (such as `Array.prototype.map()`, `filter()` and `reduce()`) create intermediate arrays 
for each step. Consider this chain: 
 
```js 
const numbers = [1, 2, 3, 4, 5]; 
const result = numbers 
  .map((n) => n * 2) // [2, 4, 6, 8, 10] 
  .filter((n) => n > 5) // [6, 8, 10] 
  .reduce((sum, n) => sum + n, 0); // 24 
``` 
 
Each call to `map` and `filter` creates a new array. For small collections, the overhead is negligible. 
For large datasets, however, repeatedly allocating intermediate arrays consumes memory and time. 
 
## Lazy iterables with generators 
 
Lazy evaluation uses generators to produce values on the fly. You define a generator that yields 
values one at a time, and consumers iterate through them as needed. You can build your own lazy 
counterparts to `map` and `filter`: 


---

 
754
 
```js 
function* map(iterable, fn) { 
  for (const item of iterable) { 
    yield fn(item); 
  } 
} 
 
function* filter(iterable, predicate) { 
  for (const item of iterable) { 
    if (predicate(item)) yield item; 
  } 
} 
 
function* range(start, end) { 
  for (let i = start; i < end; i++) yield i; 
} 
 
const pipeline = filter( 
  map(range(1, 1000000), (x) => x * 2), 
  (x) => x % 3 === 0 
); 
// The result is a generator; nothing has been computed yet. 
let total = 0; 
for (const val of pipeline) { 
  total += val; 
  if (total > 1000) break; // early exit 
} 
console.log(total); 
``` 
 


---

 
755
**What's happening?** 
 
1. `range(1, 1000000)` yields numbers from 1 to 999,999 lazily. 
2. `map(range..., x => x * 2)` wraps that generator and yields each value multiplied by 2. 
3. `filter(..., x => x % 3 === 0)` yields only the values divisible by 3. 
4. The `for...of` loop requests values from this pipeline one at a time. As soon as `total` exceeds 1000, 
the loop breaks and the generator pipeline stops producing more values. Most of the million values 
are never computed at all. 
 
This example illustrates two advantages: 
 
- **Memory efficiency:** No intermediate arrays are created. Only one value at a time exists in 
memory. 
- **Short-circuiting:** You can stop iteration early, saving time. 
 
## Benchmarks and trade-offs 
 
- **Large collections:** Lazy iteration shines when processing large or potentially infinite sequences. 
Eager methods may allocate large arrays and block the event loop, whereas generators yield values 
lazily. 
- **Single pass vs multiple passes:** If you need to iterate over the data multiple times, a generator 
may recompute values each time. A fully realized array may be faster on subsequent passes. 
- **Complex transformations:** For small arrays or simple operations, the overhead of generator 
functions may outweigh the benefits. 
- **Debugging:** Lazy pipelines can be harder to debug because computations happen at iteration 
time. Eager arrays are easier to inspect. 
 
## Choosing between lazy and eager 
 
Use lazy evaluation when: 
 
- The dataset is large, infinite or expensive to compute. 
- You might stop early (e.g. search or sampling tasks). 
- You want to minimize memory footprint. 


---

 
756
 
Use eager evaluation when: 
 
- The dataset is small or fits comfortably in memory. 
- You need random access or multiple passes over the data. 
- Simplicity and ease of debugging are more important than raw efficiency. 
 
## Practice questions 
 
1. **Theory:** Explain why lazy evaluation can reduce memory usage compared to eager evaluation. 
Give an example where this matters. 
2. **Theory:** What are some potential downsides of using lazy evaluation for small arrays? 
Describe scenarios where eager evaluation might be better. 
3. **Coding:** Implement a lazy version of `take(n, iterable)` that yields the first `n` values of an 
iterable. Then use it to sum the first 100 even numbers from an infinite generator. 
4. **Coding:** Compare the performance of summing all numbers from 1 to 1 million using eager 
array methods vs. a lazy generator pipeline. Measure memory usage and execution time, and discuss 
the results. 
 
 
 


---

 
757
What are WeakKeys and WeakRefs — new memory-safe 
references? 
# What are WeakKeys and WeakRefs: new memory-safe references 
 
JavaScript memory management is automatic: the garbage collector frees objects that are no longer 
reachable. However, certain data structures (like `Map` and `Set`) hold strong references to their keys 
and values. As long as a key is present in a `Map`, the object cannot be reclaimed even if there are no 
other references. This can lead to memory leaks in caches or listeners. 
 
To address these cases, ECMAScript introduced **weak references**—data structures that 
reference objects without preventing them from being garbage-collected. The new proposals include 
**WeakRefs** and **WeakKey maps/collections** that offer more granular control over memory 
without sacrificing safety. 
 
## WeakRef 
 
`WeakRef` is a class that lets you hold a weak reference to an object. A weak reference does not 
prevent the object from being garbage-collected. You can attempt to access the object via `.deref()`, 
which returns the object if it is still alive or `undefined` if it has been collected. 
 
```js 
class Cache { 
  constructor() { 
    this.store = new Map(); 
  } 
  set(key, value) { 
    // store a weak reference to the value 
    this.store.set(key, new WeakRef(value)); 
  } 
  get(key) { 
    const ref = this.store.get(key); 
    if (!ref) return undefined; 
    const value = ref.deref(); 


---

 
758
    if (value === undefined) { 
      // value was collected; remove from cache 
      this.store.delete(key); 
    } 
    return value; 
  } 
} 
 
let obj = { data: "important" }; 
const cache = new Cache(); 
cache.set("foo", obj); 
obj = null; // only weak reference remains 
// Later, obj may be garbage-collected. cache.get('foo') will return undefined once collected. 
``` 
 
**When to use WeakRef:** WeakRefs are useful for caches or look-aside maps where you can 
recreate a value if it's been collected. They should not be used to reference critical data because 
derefing a collected object returns `undefined`. You should always check for undefined. 
 
## FinalizationRegistry 
 
`FinalizationRegistry` lets you register a finalization callback that the engine calls when an object is 
garbage-collected. This is helpful for cleaning up resources associated with an object, such as 
removing it from other data structures. 
 
```js 
const registry = new FinalizationRegistry((heldValue) => { 
  console.log(`Cleaning up for`, heldValue); 
}); 
 
function trackResource(resource) { 
  const obj = { resource }; 


---

 
759
  registry.register(obj, resource.id); 
  return obj; 
} 
 
let tracked = trackResource({ id: 1, file: "tmp.txt" }); 
tracked = null; // when obj is collected, the callback logs "Cleaning up for 1" 
``` 
 
Finalization callbacks run at an arbitrary time after the object becomes unreachable. You should not 
rely on them for timely cleanup or critical logic. 
 
## WeakKey maps and sets 
 
The traditional `WeakMap` and `WeakSet` require that the keys are objects and hold weak references 
to those keys. However, the values of a `WeakMap` are strongly referenced. New proposals (often 
called **WeakKey** collections) aim to extend this concept by allowing keys to be weak and values 
to be strong or weak, providing more flexibility for caches. As of now, these proposals are still being 
developed. 
 
### Why are WeakKeys and WeakRefs memory-safe 
 
- **No memory leaks:** If the only references to an object are weak, it is eligible for garbage 
collection. This avoids leaks in caches or observer lists. 
- **No access after collection:** If you dereference a WeakRef after the object has been collected, 
you get `undefined`. There is no chance of accessing stale memory. 
- **Controlled cleanup:** FinalizationRegistry gives you a hook to remove entries or free associated 
resources. 
 
### Caveats 
 
- **Unpredictable timing:** Garbage collection is nondeterministic. WeakRef values may disappear 
at any time, and finalization callbacks may run much later. 
- **No strong references:** Do not store critical data solely via WeakRefs; always keep at least one 
strong reference if the data must persist. 


---

 
760
- **Potential misuse:** Overusing WeakRefs can make code hard to reason about. Use them for 
cache layers or to break cycles, not for general data storage. 
 
## Practice questions 
 
1. **Theory:** Explain how a weak reference differs from a strong reference. Why can weak 
references help prevent memory leaks? 
2. **Theory:** What does `FinalizationRegistry` do, and why should you not rely on it for critical 
cleanup logic? 
3. **Coding:** Implement a memoization cache that uses WeakRefs to store results keyed by 
objects. Demonstrate how results may disappear from the cache when the keys are no longer 
referenced elsewhere. 
4. **Coding:** Write a simple wrapper around WeakRef that attempts to get the value and, if it has 
been collected, computes a new value and stores a new WeakRef. Explain how this pattern can be 
used in caches. 
 
 
 


---

 
761
How do structuredClone, postMessage, and 
transferable objects relate? 
# How do `structuredClone`, `postMessage` and transferable objects relate 
 
JavaScript environments often need to copy or send data between contexts—such as between the 
main thread and Web Workers, or between different windows or iframes. Copying complex objects 
safely and efficiently is non-trivial. Three related mechanisms address this: the **structured clone 
algorithm**, the `postMessage()` API, and **transferable objects**. 
 
## Structured clone algorithm 
 
The **structured clone algorithm** is a specification that defines how to deeply copy a broad range 
of JavaScript values. It supports primitives, plain objects, arrays, dates, typed arrays, Map, Set, 
RegExp, ArrayBuffer, and more. Crucially, it can handle circular references and shared references, 
preserving object graphs. 
 
Historically, browsers implemented the structured clone algorithm internally, but there was no way 
for developers to invoke it directly. This changed with `structuredClone()`, a global function that 
allows you to deep-clone structured clone-serializable values: 
 
```js 
const original = { name: "Alice", list: [1, 2, 3] }; 
const copy = structuredClone(original); 
copy.list.push(4); 
console.log(original.list); // [1, 2, 3] 
``` 
 
`structuredClone()` creates a new object graph. It is more powerful than 
`JSON.parse(JSON.stringify(obj))` because it can clone functions' absence (functions are not 
cloneable), Dates, Maps, Sets and typed arrays, and it preserves reference identity. 
 
## `postMessage()` and structured cloning 
 
`postMessage()` is an API used to send data between different execution contexts: 


---

 
762
 
- **Window messaging:** `window.postMessage()` sends data to another window or iframe. 
- **Web workers:** `worker.postMessage()` sends data to a worker thread. 
- **Message ports:** `port.postMessage()` communicates over a `MessageChannel`. 
 
When you pass an object to `postMessage()`, the environment uses the structured clone algorithm 
to copy the data from one context to another. The receiving context gets a deep clone of the original 
object. This ensures that the sender and receiver do not share mutable objects, preventing 
accidental sharing of memory and data races. 
 
Example: 
 
```js 
// main thread 
const worker = new Worker("worker.js"); 
const obj = { values: [1, 2, 3], time: new Date() }; 
worker.postMessage(obj); 
 
// worker.js 
self.onmessage = (event) => { 
  const data = event.data; 
  console.log(data.values); // [1, 2, 3] 
  console.log(data.time instanceof Date); // true 
  data.values.push(4); 
}; 
// Mutating data inside the worker does not affect the original in the main thread 
``` 
 
Because the clone is deep, modifying `data.values` in the worker does not affect the original `obj`. 
 
## Transferable objects 
 


---

 
763
Some objects hold underlying binary data, such as `ArrayBuffer`, `MessagePort`, `OffscreenCanvas` 
and `ImageBitmap`. Copying these objects can be expensive. **Transferable objects** allow you to 
transfer ownership of the underlying resource from one context to another instead of copying it. 
After transfer, the sender's object becomes unusable (it's "detached") and the receiver gains sole 
control. 
 
To transfer objects with `postMessage()`, pass them in an array as the second argument: 
 
```js 
const sab = new SharedArrayBuffer(1024); 
const worker = new Worker("worker.js"); 
// Transfer the buffer 
worker.postMessage({ buffer: sab }, [sab]); 
// sab is now detached in the main thread; accessing it throws an error 
 
// worker.js 
self.onmessage = (e) => { 
  const { buffer } = e.data; 
  // buffer refers to the transferred ArrayBuffer 
  console.log(buffer.byteLength); // 1024 
}; 
``` 
 
In this example, the `ArrayBuffer` moves to the worker without copying its bytes. Attempting to use 
the buffer in the main thread after transfer will throw a `TypeError: DetachedBuffer`. Transferables 
are essential for high-performance applications such as streaming media, image processing and 
parallel computations. 
 
## Relationship between the three 
 
- **Structured clone algorithm** defines how data is copied in both `structuredClone()` and 
`postMessage()`. It ensures deep cloning of complex objects and prevents sharing references across 
threads. 


---

 
764
- **`structuredClone()`** exposes the clone algorithm directly for your own deep copy needs within 
a single context. 
- **`postMessage()`** uses the clone algorithm to send data across execution contexts. It can 
optionally transfer ownership of transferable objects to avoid copying. 
- **Transferable objects** are a special case handled by both `structuredClone()` and 
`postMessage()`; they let you move a resource instead of copying it. Passing them in the transfer list 
ensures efficient transfer. 
 
## Practice questions 
 
1. **Theory:** Describe how the structured clone algorithm differs from using 
`JSON.stringify()`/`JSON.parse()` for deep copying. What kinds of values can it handle that JSON 
cannot? 
2. **Theory:** Why do browsers detach a transferable object from the sender after it is transferred 
via `postMessage()`? What would happen if they didn't? 
3. **Coding:** Use `structuredClone()` to create a deep copy of an object containing a Map and a 
Date. Demonstrate that modifications to the copy do not affect the original. 
4. **Coding:** Send an `ArrayBuffer` to a worker using `postMessage()` with and without specifying 
it as transferable. Measure the time taken and observe the behavior of the original buffer. Discuss 
when you should use transferables. 
 
 


---
