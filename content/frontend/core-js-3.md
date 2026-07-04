# The JavaScript Masterbook — Core Concepts (Pages 401–600)

> Source: *The JavaScript Masterbook* by Upamanyu Deka

---

 
400
  @logged 
  add(a, b) { return a + b; } 
} 
 
const calc = new Calculator(); 
calc.add(2, 3); // logs arguments and result 
``` 
 
Decorators can also define accessors (`get`/`set`) or fields.  Field decorators can modify initial values 
or create reactive properties. 
 
## Extending class behaviour 
 
Decorators are powerful because they run at definition time, allowing you to: 
 
* **Wrap methods for cross-cutting concerns.** Logging, memoisation, validation and deprecation 
warnings can be applied uniformly. 
* **Register metadata.** Decorators can store metadata about classes and members, enabling 
frameworks to perform dependency injection or routing. 
* **Enforce invariants.** Class decorators can freeze or seal classes, preventing accidental 
modifications. 
* **Implement mixins.** A decorator can augment a class with additional methods or properties, 
similar to a mixin, without explicitly inheriting from another class. 
 
Because decorators modify definitions rather than runtime instances, they offer better ergonomics 
than manually wrapping each method.  However, they should be used judiciously; excessive 
metaprogramming can make code harder to understand. 
 
## Practice questions 
 
1. **Theory:** What is the difference between a class decorator and a method decorator?  When 
does each run, and what arguments do they receive? 
2. **Coding:** Implement a decorator `@readonly` that makes a method non-writable so that 
attempts to override it throw an error. 


---

 
401
3. **Theory:** How can decorators be used to implement dependency injection or routing in a web 
framework?  Describe the mechanism at a high level. 
4. **Coding:** Create a decorator `@memoize` that caches the result of a method based on its 
arguments.  Apply it to a method that performs an expensive calculation. 
5. **Theory:** What are some potential downsides of using decorators extensively?  How might 
they affect readability and debugging? 
 
 
 


---

 
402
Explain WeakMap-based private fields vs native private 
fields () in classes 
# WeakMap-based private fields vs native private fields in classes 
 
Before JavaScript introduced **private class fields**, developers used patterns like closures and 
**WeakMap** to emulate encapsulation. With the `#` syntax now available in modern JavaScript, 
it's worth comparing the two approaches. 
 
## WeakMap-based private fields 
 
A WeakMap is a collection that maps objects to values without preventing garbage collection. To 
emulate private data, you create a WeakMap outside the class and use the instance as the key and 
the private data as the value. Because only code that has access to the WeakMap can retrieve the 
data, it isn't directly exposed on the instance. 
 
Example: 
 
```js 
const _balance = new WeakMap(); 
 
class Account { 
  constructor(initial) { 
    _balance.set(this, initial); 
  } 
  deposit(amount) { 
    _balance.set(this, _balance.get(this) + amount); 
  } 
  getBalance() { 
    return _balance.get(this); 
  } 
} 
 


---

 
403
const acc = new Account(100); 
acc.deposit(50); 
console.log(acc.getBalance()); // 150 
``` 
 
Key characteristics: 
 
- Privacy is enforced by closure scope: only the module or function that holds the WeakMap can 
access the data. 
- WeakMap entries are removed when the object (key) is garbage-collected, avoiding memory leaks. 
- Accessing the private data requires a `WeakMap.get()` call, which adds some overhead. 
- The private data lives outside the instance; it cannot be inspected via reflection APIs like 
`Object.getOwnPropertyNames()`. 
 
## Native private fields (`#` syntax) 
 
ES2019 introduced **private class fields** using the `#` prefix. These fields are declared directly in 
the class body and are truly private: they are not properties on the object and cannot be accessed 
outside the class. 
 
```js 
class Account { 
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


---

 
404
} 
 
const acc = new Account(100); 
console.log(acc.#balance); // SyntaxError: Private field '#balance' must be declared 
``` 
 
Features of native private fields: 
 
- **Syntax level privacy:** Attempting to access a private field outside its class results in a syntax 
error. There is no way to circumvent this without modifying the class definition. 
- **Performance:** Access to `#balance` compiles down to fast property lookups. There is no need 
for map lookups, so it is faster than using a WeakMap. 
- **Encapsulation:** Private fields live on the instance itself (in an internal slot) rather than in an 
external structure. They are not enumerable, cannot be deleted and are not visible to reflection APIs. 
- **Interop with inheritance:** Private fields are not inherited by subclasses. Each class defines its 
own private fields. If you need to share private state with subclasses, use `protected` patterns with 
symbols or methods. 
 
## Comparison 
 
| Aspect                 | WeakMap-based privacy                       | Native private fields                   | 
| ---------------------- | ------------------------------------------- | --------------------------------------- | 
| Definition location    | Outside the class (closure or module)       | Inside the class using `#` 
syntax       | 
| Access syntax          | Methods call `weakMap.get(this)`            | Use `this.#field` directly              | 
| Garbage collection     | Entries automatically removed when key dies | Stored on instance internal 
slots       | 
| Inheritance            | Data not directly accessible to subclasses  | Private fields not inherited            | 
| Performance            | Slight overhead of map lookups              | Direct access; faster                   | 
| Encapsulation strength | Depends on closure and module scoping       | Enforced by the language 
(syntax error) | 
 
In modern code, prefer native private fields for clarity, performance and stronger encapsulation. 
WeakMap patterns remain useful when you need private data associated with objects you don't 


---

 
405
control (for example, augmenting DOM elements), or when targeting environments without private 
field support. 
 
## Practice questions 
 
1. **Theory:** How does using a WeakMap provide privacy for instance data? What happens to the 
WeakMap entry when the instance is garbage-collected? 
2. **Coding:** Rewrite the WeakMap example above using native private fields. Compare the syntax 
and readability. 
3. **Theory:** Why are private fields not inherited in subclasses? How could you share state 
between a superclass and subclass while keeping it encapsulated? 
4. **Coding:** Show how you might store additional data for a DOM element using a WeakMap. 
Explain why private fields cannot be used in that context. 
5. **Theory:** What are potential downsides to using WeakMap for privacy when compared to 
native private fields? Consider discoverability, performance and maintenance. 
 
 
 


---

 
406
What are import assertions and why are they used? 
# Import assertions and why they are used 
 
ES modules allow you to import code and data. In addition to JavaScript, runtimes like Node.js and 
browsers can import JSON, WebAssembly and other resources. Historically, support for these module 
types has varied and often required non-standard loaders or bundlers. **Import assertions** (also 
called **import attributes**) provide a standard way to convey metadata alongside the import 
specifier, ensuring that modules are interpreted correctly. 
 
## What are import assertions? 
 
An import assertion is a syntax that attaches an **attributes object** to an `import` statement. The 
attributes specify how the module should be treated. The most common use is to assert the module 
type for JSON imports. 
 
Syntax: 
 
```js 
import data from "./data.json" assert { type: "json" }; 
``` 
 
In this example, the `assert { type: 'json' }` clause informs the host that the imported file should be 
parsed as JSON. If the host does not support JSON modules or if the assertion doesn't match the 
file's actual type, it throws an error. 
 
Import assertions can also be used with dynamic imports: 
 
```js 
const module = await import("./strings.po", { assert: { type: "text" } }); 
``` 
 
The attributes are available as the second argument to `import()` in environments that implement 
import attributes. Note that the syntax is still evolving: Node.js 20 and browsers such as Chrome 91 


---

 
407
support import assertions, but some environments may require flags or may remove them in favour 
of the more general **import attributes** proposal. 
 
## Why use import assertions? 
 
1. **Unambiguous module formats:** Without assertions, importing a file like `data.json` might 
accidentally be interpreted as JavaScript or cause conflicts with packages that also export JSON. 
Import assertions let the developer specify the expected format explicitly. 
2. **Security and reliability:** By asserting the expected type, the runtime can reject mismatches 
early. For example, an attacker cannot trick your program into executing a script disguised as a `.json` 
file. 
3. **Extensibility:** As new module types emerge (translation files, configs, images), import 
assertions provide a uniform mechanism to attach metadata. Tools and bundlers can use the 
assertions to choose appropriate loaders. 
4. **Interoperability:** Node.js and browsers can unify behaviour around non-JavaScript modules. 
For example, Node's experimental JSON modules require `assert { type: 'json' }` to avoid breaking 
existing CommonJS `require('./data.json')` semantics. 
 
## Example: importing JSON in Node.js 
 
In Node.js 17 and later (with `type: 'module'` in `package.json`), you can import JSON modules if you 
provide a type assertion: 
 
```js 
// package.json contains { "type": "module" } 
// data.json => { "name": "Alice", "age": 30 } 
 
import person from "./data.json" assert { type: "json" }; 
console.log(person.name); // Alice 
 
// Without the assertion, Node throws an error: 
// ERR_UNSUPPORTED_ESM_URL_SCHEME: Only URLs relative to ... 
``` 
 


---

 
408
As of Node 22, import assertions have been replaced by **import attributes** with a slightly 
different syntax. The concept remains the same: attach metadata to imports to ensure correct 
loading. 
 
## Practice questions 
 
1. **Theory:** What problems do import assertions solve when importing non-JavaScript modules? 
Why is it not enough to rely on file extensions alone? 
2. **Theory:** Describe how import assertions improve security when loading JSON or other data 
files. What happens if the assertion does not match the actual module type? 
3. **Coding:** Create a JSON file and import it in a Node.js module using an import assertion. Log its 
contents and observe what happens if you omit the assertion. 
4. **Theory:** Compare import assertions in static `import` statements and dynamic `import()`. 
How is the syntax different? 
5. **Theory:** Discuss how the import attributes proposal generalises import assertions. What 
advantages does it have over the earlier syntax? 
 
 
 


---

 
409
What is structuredClone’s difference from deep copy via 
JSON? 
# `structuredClone()` vs deep copy via JSON 
 
Copying objects in JavaScript can be tricky. A **shallow copy** duplicates only the top level of an 
object, while nested objects are shared. A **deep copy** recursively duplicates all nested 
structures. Two common approaches are using `JSON.stringify()`/`JSON.parse()` and using the built-in 
`structuredClone()` function. Although they both produce independent copies, they differ 
significantly in what they support and how they handle data. 
 
## Deep copy via JSON 
 
The simplest way to create a deep copy is to serialise an object to JSON and then parse it back: 
 
```js 
const original = { a: 1, b: { c: 2 } }; 
const copy = JSON.parse(JSON.stringify(original)); 
``` 
 
This technique works for plain objects containing numbers, strings, booleans, `null` and arrays. 
However, it has major limitations: 
 
- **Unsupported types:** Functions, `undefined`, `Symbol` properties and objects containing 
circular references cannot be serialised. Dates become strings; Maps and Sets become empty 
objects; typed arrays and ArrayBuffers are not preserved. 
- **Loss of metadata:** Property descriptors, prototypes and non-enumerable properties are lost. 
Instances of classes become plain objects. 
- **Loss of type fidelity:** Special numeric values like `NaN` and `Infinity` are converted to `null`. 
BigInt values cause a `TypeError`. 
 
Because of these constraints, JSON cloning is suitable for simple data structures but not for complex 
objects. 
 
## `structuredClone()` 


---

 
410
 
The `structuredClone()` function is a standard API that deeply copies most built-in types using the 
structured clone algorithm (the same algorithm used for posting messages to Web Workers). It can 
clone many kinds of data that JSON cannot, including: 
 
- Dates, RegExps, Maps, Sets and other built-ins. 
- Typed arrays (`Uint8Array`, `Float64Array`) and ArrayBuffers. 
- Blobs, Files and ImageBitmaps in browser environments. 
- Objects with circular references. 
- Objects with custom prototypes (the prototype is preserved). 
 
Example: 
 
```js 
const original = { 
  date: new Date(), 
  map: new Map([["key", 42]]), 
  set: new Set([1, 2, 3]), 
  nested: {}, 
}; 
original.nested.self = original; // circular reference 
 
const clone = structuredClone(original); 
console.log(clone.date instanceof Date); // true 
console.log(clone.map.get("key")); // 42 
console.log(clone.set.has(2)); // true 
console.log(clone.nested.self === clone); // true 
``` 
 
`structuredClone()` performs a deep copy, preserving most built-in types. It throws a 
`DataCloneError` if you attempt to clone unsupported types, such as DOM nodes, functions or 
certain host objects. It can also transfer ownership of transferable objects (ArrayBuffers, 
MessagePorts) to the cloned object using a `transfer` option, removing them from the original. 


---

 
411
 
## When to use each 
 
- **Use JSON cloning** for simple, serialisable data where you don't care about dates, methods or 
prototypes. It's fast, widely supported and easy to understand. 
- **Use `structuredClone()`** for complex data structures, objects with circular references or built-in 
types beyond basic JSON. It preserves more fidelity and has explicit error handling for unsupported 
types. 
- **Avoid cloning functions and DOM nodes.** If you need to duplicate behaviour, explicitly copy or 
recreate the function. DOM nodes are tied to their document; create new nodes instead. 
 
## Practice questions 
 
1. **Theory:** What limitations does cloning via `JSON.stringify()`/`JSON.parse()` have? Give 
examples of data that cannot be cloned correctly using this method. 
2. **Theory:** Explain how `structuredClone()` handles circular references and built-in types like 
`Map` and `Set` compared to JSON cloning. 
3. **Coding:** Write a function `deepCloneJSON(value)` that clones an object via JSON. Test it on an 
object containing a `Date` and observe how the date is transformed. 
4. **Coding:** Use `structuredClone()` to clone an object with a Map and a circular reference. Verify 
that the clone retains the Map entries and that the circular reference points to the clone. 
5. **Theory:** When would you choose JSON cloning over `structuredClone()` even though the 
latter is more capable? Consider browser support and performance. 
 
 
 


---

 
412
Explain lazy vs eager evaluation in iterables 
# Lazy vs. eager evaluation in iterables 
 
Iterables are JavaScript objects you can loop over with `for...of`. Arrays, strings and Maps are 
examples of **eager** iterables: they compute their values immediately and hold them in memory. 
Generator functions and other iterator-based constructs are **lazy**: they produce values one at a 
time as they're requested. Understanding the difference between these strategies helps you choose 
the right tool for large datasets, infinite sequences or performance-sensitive tasks. 
 
## Eager evaluation 
 
- **Definition** - In an eager iterable all values are computed up front. For example, when you call 
`Array.from()` or the `map()` method, JavaScript creates a new array containing every transformed 
value immediately. 
- **Memory implications** - Because the entire result is realized at once, eager evaluation can 
consume significant memory if the collection is large. An array of a million numbers occupies 
memory for all million elements even if you only ever use the first few. 
- **When it shines** - Eager evaluation is straightforward and performant when you need the entire 
result and the dataset is reasonably small. Operations like sorting, reducing and random access 
(`arr[i]`) are trivial on an array because all values are available. 
 
### Example: eager pipeline 
 
```js 
// doubling then filtering an array eagerly 
const numbers = [1, 2, 3, 4, 5]; 
const doubled = numbers.map((n) => n * 2); // [2,4,6,8,10] 
const evens = doubled.filter((n) => n % 2 === 0); // [2,4,6,8,10] (all are even) 
console.log(evens); 
``` 
 
Here `map()` and `filter()` each produce a new array. Even if you ultimately only need the first few 
values, every intermediate result is computed. 
 


---

 
413
## Lazy evaluation 
 
- **Definition** - Lazy evaluation postpones computing a value until it's actually needed. In 
JavaScript, you implement laziness by returning an iterator: an object with a `next()` method that 
yields the next value and remembers its state between calls. Generators (`function*`) are the most 
common way to build lazy iterables. 
- **Benefits** - Because lazy iterables produce values on demand, they avoid creating large 
intermediate arrays. This can reduce memory usage and improve responsiveness when working with 
streams, infinite sequences or expensive calculations. Lazy evaluation also allows you to compose 
operations without paying the cost until you consume the result. 
- **Trade-offs** - Lazy iterables cannot be randomly indexed; they must be consumed sequentially. 
Each call to `next()` may involve computation, so repeated consumption of the same sequence 
requires either caching (memoization) or starting over. 
 
### Example: lazy infinite sequence 
 
```js 
// generator producing an infinite sequence of natural numbers lazily 
function* naturalNumbers() { 
  let n = 0; 
  while (true) { 
    yield n++; 
  } 
} 
 
const iterator = naturalNumbers(); 
console.log(iterator.next().value); // 0 
console.log(iterator.next().value); // 1 
console.log(iterator.next().value); // 2 
// the sequence can continue indefinitely 
``` 
 


---

 
414
The generator function `naturalNumbers` does not build an array of numbers. Each call to `next()` 
computes the next value and pauses until the next call. Because of this, you can represent potentially 
unbounded sequences without exhausting memory. 
 
### Chaining lazy transformations 
 
You can create helper functions that accept an iterable and return a new lazy iterable. Each helper 
yields values on demand, allowing you to build complex pipelines without intermediate arrays: 
 
```js 
// helper to map lazily 
function* mapLazy(iterable, fn) { 
  for (const value of iterable) { 
    yield fn(value); 
  } 
} 
 
// helper to filter lazily 
function* filterLazy(iterable, predicate) { 
  for (const value of iterable) { 
    if (predicate(value)) yield value; 
  } 
} 
 
// compose lazy operations 
const numbersLazy = naturalNumbers(); 
const doubledLazy = mapLazy(numbersLazy, (n) => n * 2); 
const evensLazy = filterLazy(doubledLazy, (n) => n % 4 === 0); 
 
// consume only the first five values 
for (let i = 0; i < 5; i++) { 
  console.log(evensLazy.next().value); 


---

 
415
} 
``` 
 
Here the mapping and filtering operations are lazy; they don't compute anything until `next()` is 
called. The loop stops after five values without computing the rest of the infinite sequence. 
 
### Real-world analogy 
 
Imagine a bakery that sells loaves of bread. An **eager** bakery bakes every loaf at 5 a.m. even if 
only a few customers will buy them, wasting ingredients and shelf space. A **lazy** bakery bakes a 
loaf only when a customer orders it. If nobody orders bread, no loaves are baked. Similarly, lazy 
evaluation produces values only when requested, saving resources when you don't need the whole 
batch. 
 
### Common misconceptions and pitfalls 
 
- **"Lazy is always better"** - Lazy evaluation can save memory, but it's not free. Each call to 
`next()` involves overhead and may trigger a complex calculation. If you need all results anyway, the 
overhead of laziness can outweigh the benefits. 
- **Single-use iterators** - Once you consume a lazy iterable with `for...of` or by calling `next()` 
repeatedly, it's exhausted. You must create a new iterator if you need to iterate again. 
- **Error handling** - Lazy iterables can throw errors during iteration, not at creation time. Make 
sure to handle errors where you consume the iterator. 
 
## Practice questions 
 
1. **Theory:** Explain the difference between eager and lazy evaluation in your own words. What 
kinds of operations in JavaScript are eager by default, and what constructs enable lazy evaluation? 
2. **Coding:** Write a generator function `primes()` that lazily yields prime numbers on demand. 
Then use it to print the first ten primes. 
3. **Theory:** Discuss situations where lazy evaluation might hurt performance compared to eager 
evaluation. Give an example of an operation where an eager array method is simpler and more 
efficient than using generators. 
4. **Coding:** Implement a lazy version of the `take(n, iterable)` function that returns an iterator 
yielding the first `n` values from any iterable without forcing the rest of the iterable to compute. 


---

 
416
5. **Theory:** What happens if you try to iterate over a generator twice? How could you design an 
iterable that supports multiple passes over the same lazy sequence? 
 
 
 


---

 
417
What is monkey-patching and why is it discouraged? 
# Monkey patching in JavaScript and why it's discouraged 
 
**Monkey patching** is the practice of dynamically modifying or extending existing code at run 
time. In JavaScript this usually means adding, overriding or deleting properties on built-in objects or 
modules after they have been loaded. While this flexibility can be powerful for shims, polyfills and 
test doubles, it also introduces hidden dependencies and fragile code. Understanding how monkey 
patching works will help you decide when (and when not) to use it. 
 
## What is monkey patching? 
 
At its core, JavaScript treats functions and objects as mutable. You can add methods to prototypes, 
replace existing functions or change modules on the fly: 
 
```js 
// adding a custom method to Array.prototype (monkey patch) 
Array.prototype.sum = function () { 
  return this.reduce((acc, val) => acc + val, 0); 
}; 
 
const nums = [1, 2, 3]; 
console.log(nums.sum()); // 6 
 
// overriding a built-in method 
const originalDateNow = Date.now; 
Date.now = () => 42; // pretend the current timestamp is always 42 
 
console.log(Date.now()); // 42 
 
// later restore the original implementation 
Date.now = originalDateNow; 
``` 


---

 
418
 
In testing frameworks like Jest or Sinon, monkey patching (also called **stubbing** or **spying**) is 
used to replace network calls or timers with deterministic mocks. Libraries like [core-js] provide 
polyfills by monkey patching global objects when native implementations are missing. 
 
## Why is it discouraged? 
 
Although monkey patching can solve short-term problems, it carries significant risks: 
 
- **Namespace pollution** - Adding methods to built-in prototypes affects all code in the 
environment. If different libraries define the same method with different semantics, they may 
conflict with each other. 
- **Fragile upgrades** - When the JavaScript engine or library authors update their 
implementations, your patched code may break. A patched method may rely on internal behavior 
that changes between versions, leading to subtle bugs. 
- **Debugging difficulty** - Monkey patches change behavior behind the scenes. Future maintainers 
may not realize that an object has been patched and will spend time chasing unexpected behaviour. 
- **Security concerns** - Malicious scripts can monkey patch critical functions (e.g., intercepting 
`fetch()`) to steal data. Browsers and Node.js treat such modifications as part of the page, so there is 
no sandboxing of patched code. 
- **Performance overhead** - Patching prototypes can de-optimize JavaScript engines. V8 and other 
engines optimize property lookups based on hidden classes and inline caches; adding unexpected 
properties invalidates these optimizations, causing slower property access. 
 
### Legitimate uses 
 
There are narrow cases where monkey patching is acceptable: 
 
- **Polyfills** - Before ECMAScript 2015, developers used shims to add missing methods like 
`Array.prototype.forEach` or `String.prototype.startsWith`. These patches detect native support and 
only modify the prototype when necessary. 
- **Testing and mocking** - During tests you may override functions like `fetch()`, timers or logging 
to provide predictable results. Frameworks that monkey patch do so within a controlled scope and 
restore original behaviour after tests. 
- **Metaprogramming** - Libraries like Ember.js historically relied on prototype extensions to 
provide convenience methods. Modern best practice is to avoid global changes and instead import 
utilities explicitly. 


---

 
419
 
## Best practices and safer alternatives 
 
If you need to extend functionality, consider safer patterns: 
 
- **Composition and wrappers** - Rather than modifying a function in place, write a wrapper that 
adds functionality and delegates to the original: 
 
  ```js 
  function sumArray(arr) { 
    return arr.reduce((acc, val) => acc + val, 0); 
  } 
 
  console.log(sumArray([1, 2, 3])); // 6 
  ``` 
 
- **Subclassing** - For custom collections, derive your own class from `Array` or compose with 
existing objects instead of changing global prototypes. 
- **Dependency injection** - Pass dependencies into functions so they can be replaced in tests 
without altering global state. 
- **Import modifications explicitly** - If you must alter a module's behavior, create a module that 
wraps and re-exports the modified version rather than patching the original. 
 
## Practice questions 
 
1. **Theory:** Define monkey patching in the context of JavaScript. What are some of the potential 
problems it introduces? 
2. **Coding:** Write a polyfill for `Array.prototype.includes` that adds the method only if it does not 
already exist. Explain why this pattern is safer than unconditionally overwriting the method. 
3. **Theory:** Describe a scenario in which monkey patching a native object could lead to a security 
vulnerability. 
4. **Coding:** In a testing environment, override `console.log()` so that it collects log messages into 
an array instead of printing them. After the test, restore the original implementation. Discuss why 
this approach is preferable to patching `console.log()` globally in production code. 


---

 
420
5. **Theory:** How can dependency injection or higher-order functions eliminate the need for 
monkey patching when writing unit tests? 
 
 
 


---

 
421
How do JavaScript engines optimize tail calls (TCO)? 
# How JavaScript engines optimize tail calls (TCO) 
 
Recursive functions are elegant but can blow up the call stack if they recurse deeply. **Tail call 
optimization** (TCO) is a technique used by compilers and interpreters to reuse stack frames when a 
function call occurs in a _tail position_—the last thing the function does before returning. When a 
call is tail-recursive, the caller doesn't need to do any further work after the callee returns, so the 
engine can replace the caller's frame rather than creating a new one. This effectively turns recursion 
into iteration and prevents stack overflow. 
 
## Tail positions 
 
A call is in **tail position** if its result is immediately returned by its caller, with no further 
computation. In JavaScript: 
 
```js 
function sum(n) { 
  if (n === 0) return 0; 
  return n + sum(n - 1); // not a tail call - the addition happens after the call 
} 
 
function sumTail(n, acc = 0) { 
  if (n === 0) return acc; 
  return sumTail(n - 1, acc + n); // tail call - no pending work after the call 
} 
``` 
 
In `sumTail()`, the recursive call is the last operation; there is no multiplication or addition after it. 
This makes it eligible for TCO. 
 
## The ES6 specification and proper tail calls 
 


---

 
422
ECMAScript 2015 introduced the concept of **proper tail calls** (PTC). The specification describes 
how compliant engines _may_ reuse the current call frame when a tail call occurs, thus limiting stack 
growth. However, the spec does not require tail call optimization, and most mainstream engines (V8 
in Chrome/Node, SpiderMonkey in Firefox) have not implemented PTC. Safari's JavaScriptCore briefly 
supported it but later removed support. As a result, relying on TCO in cross-platform JavaScript is 
unsafe. 
 
### Why hasn't TCO been widely implemented? 
 
Implementing tail call optimization in dynamic languages like JavaScript is challenging for several 
reasons: 
 
- **Debugging semantics** - Reusing call frames changes the observable call stack. Developers 
expect stack traces to show each function in a recursion chain; TCO would hide those frames, making 
debugging harder. 
- **Security and backwards compatibility** - Some existing code relies on detecting a call stack's 
depth or using `arguments.caller`/`Function.prototype.caller` to inspect callers. Removing frames 
could break such code. 
- **Engine complexity** - JavaScript engines perform many optimizations (inline caching, JIT 
compilation, de-optimisations). Supporting full TCO requires changes across interpreter and JIT 
pipelines. 
 
For these reasons, engines have prioritized other optimizations. The ES committee has since 
reclassified proper tail calls as optional. 
 
## Simulating TCO with trampolines or iteration 
 
To avoid stack overflow in recursive algorithms, you can refactor code to be iterative or use a 
_trampoline_ to repeatedly call functions without growing the stack: 
 
```js 
// Trampoline helper runs a function until it returns a non-function 
function trampoline(fn) { 
  let result = fn; 
  while (typeof result === "function") { 
    result = result(); 


---

 
423
  } 
  return result; 
} 
 
// Tail-recursive factorial using a thunk (function with no arguments) 
function factorialThunk(n, acc = 1) { 
  if (n === 0) return acc; 
  return () => factorialThunk(n - 1, acc * n); 
} 
 
console.log(trampoline(() => factorialThunk(5))); // 120 
``` 
 
The `factorialThunk` function returns another function instead of making a direct recursive call. The 
`trampoline` repeatedly invokes these thunks until it gets a number. This pattern keeps the call stack 
flat. 
 
## Practice questions 
 
1. **Theory:** What is a tail call? Give an example of a recursive function that is _not_ in tail form 
and explain why it cannot be optimized. 
2. **Coding:** Rewrite a recursive function to compute the nth Fibonacci number using an 
accumulator so that the recursive call is in tail position. 
3. **Theory:** Why do most JavaScript engines not implement proper tail calls? Describe at least 
two challenges. 
4. **Coding:** Implement a trampoline function that can take a self-recursive thunk and produce a 
result without growing the call stack. Use it to compute a large factorial (e.g., `factorial(1_000)` 
without a stack overflow). 
5. **Theory:** Aside from TCO, what other techniques can you use in JavaScript to avoid stack 
overflow in recursive algorithms? 
 
 
 


---

 
424
What is generator delegation (yield) and how does it 
work? 
# Generator Delegation (`yield*`): How It Works 
 
JavaScript's generator functions allow you to produce sequences of values on demand using the 
`yield` keyword. A generator is paused when it yields and resumes when the caller invokes its `next()` 
method. In complex scenarios you may want one generator to "hand off" iteration to another 
generator or iterable. The **delegating yield** (`yield*`) provides that capability: it lets a generator 
transparently pass through values from another iterable. 
 
## What is generator delegation? 
 
Normally, each `yield` in a generator returns a single value: 
 
```js 
function* numbers() { 
  yield 1; 
  yield 2; 
  yield 3; 
} 
 
const it = numbers(); 
console.log(it.next()); // { value: 1, done: false } 
console.log(it.next()); // { value: 2, done: false } 
``` 
 
If you need to yield all values from another generator or iterable without writing a loop, use the 
`yield*` expression. The syntax is similar to a normal yield, but the asterisk signals delegation: 
 
```js 
function* g1() { 
  yield 2; 


---

 
425
  yield 3; 
  yield 4; 
} 
 
function* g2() { 
  yield 1; 
  yield* g1(); // delegate to g1() 
  yield 5; 
} 
 
for (const x of g2()) { 
  console.log(x); 
} 
// 1 2 3 4 5 
``` 
 
`yield* g1()` iterates over `g1()` and yields each value as if `g2()` had yielded them directly. When the 
delegated generator finishes, control returns to `g2()` and it continues yielding its own values. The 
`yield*` expression itself evaluates to whatever value the delegated iterator's final `return` produced, 
which can be captured if needed. 
 
### Delegating to other iterables 
 
`yield*` works with any iterable object, not just generators. Arrays, strings, Sets, Maps and even the 
`arguments` object can be delegated: 
 
```js 
function* g3() { 
  yield* [1, 2]; // yields 1, then 2 
  yield* "34"; // yields '3', then '4' 
  yield* arguments; // yields any extra arguments passed to g3() 
} 


---

 
426
 
const it = g3(5, 6); 
console.log([...it]); // [1, 2, '3', '4', 5, 6] 
``` 
 
### Capturing the return value 
 
A delegated generator can return a value using `return`. The `yield*` expression will evaluate to that 
returned value, allowing the delegating generator to capture it: 
 
```js 
function* inner() { 
  yield 1; 
  yield 2; 
  return "done"; 
} 
 
function* outer() { 
  const result = yield* inner(); 
  console.log("Inner returned:", result); 
} 
 
[...outer()]; 
// logs: Inner returned: done 
``` 
 
## Why use generator delegation? 
 
### Composition of generators 
 
`yield*` lets you build complex sequences by composing smaller generators. Instead of manually 
looping over a subgenerator and yielding each value, you can delegate and let the language handle 


---

 
427
iteration. This is particularly helpful when you need to flatten nested generators or forward values 
from helper functions. 
 
### Simplifying iteration logic 
 
Consider a tree traversal generator that needs to walk child nodes. Without delegation you would 
write an explicit loop inside the parent generator. With `yield*`, your generator reads more 
declaratively: 
 
```js 
function* traverse(node) { 
  yield node.value; 
  for (const child of node.children) { 
    yield* traverse(child); 
  } 
} 
 
// traverse the tree and print all values 
for (const value of traverse(root)) { 
  console.log(value); 
} 
``` 
 
### Real-world analogy 
 
Imagine you are telling a story but need to include a detailed anecdote told by your friend. Instead of 
retelling the anecdote yourself, you hand the microphone to your friend (delegate) so they can speak 
directly. When they finish, you take back the microphone and continue your story. That is what 
`yield*` does for generators: it hands control to another iterator and then resumes when it's finished. 
 
## Common pitfalls and misconceptions 
 


---

 
428
- **Using `yield` instead of `yield*`** - If you write `yield g1()` instead of `yield* g1()`, you will yield 
the generator object itself, not the values produced by it. Always use the asterisk when delegating. 
- **Delegating to non-iterables** - The operand to `yield*` must be iterable (it must have a 
`Symbol.iterator` method). Passing a plain object without an iterator will cause a runtime error. 
- **Ignoring the return value** - The value of a `yield*` expression is the return value of the 
delegated iterator. If the subgenerator returns a value you care about, store it; otherwise you can 
ignore it. 
 
## Practice questions 
 
1. **Theory:** In your own words, explain the difference between `yield` and `yield*`. When would 
you choose one over the other? 
2. **Coding:** Write a generator `flatten` that takes a nested array of numbers (e.g., `[1, [2, 3], 4, 
[5]]`) and yields the numbers in a flat sequence using generator delegation. 
3. **Theory:** What will the `yield*` expression evaluate to if the delegated generator does not 
explicitly return a value? How can you capture this value? 
4. **Coding:** Using `yield*`, implement a generator that yields the Fibonacci sequence up to a 
given count by delegating to a helper generator that yields successive values. 
 
 
 


---

 
429
What are async generators and how are they used with 
for-await-of? 
# Async Generators and `for await...of` 
 
Most asynchronous operations in JavaScript—such as network requests, file reads or timers—return 
promises that resolve sometime in the future. While `Promise.all()` and callbacks work for one-off 
operations, they become unwieldy when dealing with streams of asynchronous values. **Async 
generators** bridge this gap by combining generator syntax with asynchronous control flow, and 
**`for await...of`** provides a simple way to consume these asynchronous sequences. 
 
## What are async generators? 
 
An async generator is defined with `async function*`. It looks like a regular generator (`function*`), 
but it can contain `await` expressions and can yield promises. When you call an async generator, it 
returns an **async iterator**—an object with an asynchronous `next()` method that returns a 
promise resolving to `{ value, done }` objects. Each `yield` in the generator produces a value, and 
`await` pauses until the awaited promise settles. 
 
Here's a simple async generator that waits one second between numbers: 
 
```js 
async function* countWithDelay(n) { 
  for (let i = 1; i <= n; i++) { 
    // simulate an asynchronous delay 
    await new Promise((resolve) => setTimeout(resolve, 1000)); 
    yield i; 
  } 
} 
``` 
 
Calling `countWithDelay(3)` returns an object whose `next()` method returns promises. Each call to 
`next()` waits for the delay before resolving with the next number. Without dedicated syntax, 
consuming such an async iterator requires promise chaining: 
 


---

 
430
```js 
const it = countWithDelay(3); 
it.next() 
  .then(({ value }) => { 
    console.log(value); // 1 after 1 s 
    return it.next(); 
  }) 
  .then(({ value }) => { 
    console.log(value); // 2 after 2 s 
  }); 
``` 
 
## `for await...of` - consuming async iterables 
 
ES2018 introduced the `for await...of` loop to simplify consumption of **async iterable** objects. An 
object is async iterable if it has a `Symbol.asyncIterator` method that returns an async iterator. All 
async generators are async iterables by default. Inside an async function (or at top level of a module 
in some environments), you can iterate over them using `for await...of`: 
 
```js 
async function demo() { 
  for await (const value of countWithDelay(3)) { 
    console.log(value); 
  } 
  console.log("Done"); 
} 
 
demo(); 
// Logs 1, 2, 3 at one-second intervals, then 'Done' 
``` 
 


---

 
431
The loop pauses after each iteration until the promise returned by `next()` resolves. Unlike 
`Promise.all()`, which runs operations concurrently, `for await...of` processes values sequentially, 
making it ideal for streaming APIs or when order matters. 
 
### Async iterable sources 
 
Apart from async generators, many browser and Node.js APIs expose async iterables: 
 
- **Readable streams:** The Fetch API's `Response.body` is a `ReadableStream` whose reader is an 
async iterable. You can iterate over chunks of data as they arrive. 
- **File handles:** In Node.js, the `fs` module provides asynchronous iteration over directory entries 
(`fs.opendir()`) and file contents. 
- **Custom async iterables:** Any object implementing `Symbol.asyncIterator` and returning an 
object with an async `next()` method can be consumed via `for await...of`. 
 
### Combining async and sync iterables 
 
`for await...of` can also iterate over synchronous iterables. The specification says that if an object 
does not have a `Symbol.asyncIterator` method but has a `Symbol.iterator`, the loop will use the 
synchronous iterator. This means you can write loops that consume values regardless of whether the 
source is synchronous or asynchronous. 
 
## Use cases 
 
- **Streaming data** - reading lines from a network socket or file one by one without loading the 
entire content into memory. 
- **Paginated APIs** - iterating through pages of API results by awaiting each page's promise. 
- **Event streams** - yielding values from an event emitter as events occur. 
 
## Real-world analogy 
 
Imagine you are waiting for deliveries from an online store. Each package arrives at different times. 
Instead of standing by the door constantly checking for deliveries, you set up a system where you 
wait for the courier to ring and then take each package as it comes. `for await...of` behaves like that 
system: it waits for each promise to resolve (the courier rings) and then yields the value (the 
package) before moving to the next. 


---

 
432
 
## Common pitfalls and misconceptions 
 
- **Only inside async contexts** - You can use `for await...of` only inside an `async` function or at 
the top level of an ES module. Using it in a normal function causes a syntax error. 
- **Sequential execution** - The loop waits for each iteration to finish before proceeding. If you 
want concurrency, collect promises in an array and await them with `Promise.all()`. 
- **Error handling** - Wrap your `for await...of` loop in a `try...catch` to handle rejections. If the 
async iterator's `next()` method rejects, the rejection will propagate and exit the loop unless caught. 
 
## Practice questions 
 
1. **Theory:** What is the difference between a synchronous generator and an async generator? 
How do their `next()` methods behave? 
2. **Coding:** Write an async generator `readLines(url)` that fetches a text file via `fetch()`, splits it 
by newline, and yields each line after a short delay using `await`. 
3. **Theory:** Why must `for await...of` be used inside an async function? What happens if you try 
to use it in a regular function? 
4. **Coding:** Create a custom object with a `Symbol.asyncIterator` method that yields three values 
with different delays. Iterate over it with `for await...of` and log the order of completion. 
 
 
 


---

 
433
Explain top-level await in ES modules 
# Top-Level `await` in ES Modules 
 
`await` normally appears inside `async` functions. Until recently, if you needed to perform 
asynchronous initialization at the top of a module, you had to wrap your logic in an async function or 
chain promises. **Top-level `await`** changes that: it allows the `await` keyword at the top level of 
an ES module, turning the module into an implicitly asynchronous task. This capability simplifies 
module initialization and dynamic imports but comes with important semantics to understand. 
 
## What is top-level `await`? 
 
In a traditional script or CommonJS module, using `await` outside of an `async` function results in a 
syntax error. Top-level `await` is a feature of ES modules that relaxes this rule. When a module 
contains a bare `await`, the JavaScript engine treats the module's execution as if it were wrapped in 
an async function. The module will pause at the `await` expression until the operand settles, then 
resume execution. Modules that import the awaiting module will wait for its evaluation to complete 
before continuing. 
 
Consider a module `db.js` that establishes a database connection: 
 
```js 
// db.js — note the top-level await 
const connection = await connectToDatabase(); 
export default connection; 
``` 
 
When another module imports `db.js`, it must wait for `connectToDatabase()` to resolve before it can 
use the default export. The top-level await ensures that consumers see a fully initialized connection. 
 
## How top-level `await` affects module evaluation 
 
ES modules are evaluated in dependency order. Normally, a module's code runs synchronously once 
its dependencies are linked. When a module contains a top-level await, evaluation becomes 
asynchronous: 
 


---

 
434
- **Execution pauses at `await`.** The module's evaluation returns a promise that resolves when all 
awaited promises within the module have settled. 
- **Importing modules wait.** A module that imports a top-level-awaiting module must wait until 
that module's promise resolves before running its own module body. This ensures dependent 
modules see the awaited exports in their final state. 
- **Sibling modules continue.** If two modules import the awaiting module, they both pause at 
their import statements until the awaited module resolves. Once resolved, each module continues 
evaluation independently. 
 
This mechanism is similar to treating the entire module as an `async function`—all imports of the 
module implicitly `await` its promise. 
 
## Use cases 
 
Top-level await simplifies a few patterns that previously required workarounds: 
 
### Dynamic module loading based on runtime data 
 
```js 
// i18n.js 
const lang = navigator.language; 
const strings = await import(`./locale/${lang}.js`); 
export default strings.default; 
``` 
 
Without top-level await you'd need to wrap this in an async function and export a promise. Now the 
module can return the actual data. 
 
### One-time asynchronous initialization 
 
Modules often need to read configuration files, open database connections or prefetch data before 
exporting functions. Top-level await lets you perform those actions inline: 
 
```js 


---

 
435
// cache.js 
const cache = await fetch("/api/bootstrap.json").then((r) => r.json()); 
export function getItem(key) { 
  return cache[key]; 
} 
``` 
 
Consumers of `cache.js` know that `getItem()` will always read from an initialized cache. 
 
### Fallback imports 
 
You can attempt to import a preferred module and fall back gracefully if it fails: 
 
```js 
let parser; 
try { 
  parser = await import("./fast-parser.js"); 
} catch { 
  parser = await import("./slow-parser.js"); 
} 
export default parser; 
``` 
 
## Limitations and warnings 
 
- **Modules only.** Top-level await is allowed only in ES modules. It cannot be used in classic 
`<script>` tags without `type="module"`, and it's not allowed inside regular functions unless they are 
marked `async`. 
- **Potential deadlocks.** Combining top-level await with circular dependencies can cause 
deadlocks if modules await each other in a cycle. Design your modules to avoid cycles or perform 
awaits in functions instead of the top level. 


---

 
436
- **Unsupported environments.** Some older browsers and Node.js versions do not support 
top-level await. Node added support in v14.8.0 behind a flag and in v16 as a default; always check 
your runtime environment. 
 
## Real-world analogy 
 
Picture a cooking show where the host needs to marinate meat before continuing with the recipe. In 
earlier seasons, the show cut away to a pre-prepared dish while the meat marinated off camera. 
With top-level await, the host simply waits in real time, and the rest of the kitchen staff (importing 
modules) pauses until the marination finishes. Once done, everyone proceeds with fully prepared 
ingredients. 
 
## Practice questions 
 
1. **Theory:** Why can't you use `await` at the top level of a classic script? What must you do to 
enable it? 
2. **Coding:** Create an ES module that fetches JSON data at the top level using `await` and exports 
a function that returns a property from the fetched object. 
3. **Theory:** Describe how top-level await affects the evaluation order of modules that import a 
module containing it. What happens if multiple modules import it simultaneously? 
4. **Coding:** Write two ES modules, `A.js` and `B.js`, where `A.js` awaits a promise at the top level 
and `B.js` imports and uses `A.js`. Show how `B.js` waits for `A.js` to finish evaluation before 
executing. 
 
 
 


---

 
437
How does module caching work in ES modules and 
CommonJS? 
# How does module caching work in ES modules and CommonJS? 
 
JavaScript has two primary module systems: **CommonJS (CJS)** used historically in Node.js, and 
**ECMAScript modules (ESM)** which are part of the language spec and supported in modern 
browsers and Node. Both systems cache modules after they have been loaded, but the caching 
mechanisms and semantics differ. Understanding how caching works helps avoid subtle bugs when 
modules depend on each other or when you want to reload code dynamically. 
 
## Module execution and caching in CommonJS 
 
In Node.js, when you `require()` a module for the first time the runtime: 
 
1. **Resolves the specifier** to an absolute file path (e.g. `./utils.js` → `/full/path/utils.js`). File 
extensions like `.js`, `.json` and `.node` are tried automatically if none is provided. 
2. **Loads and executes** the module code in its own wrapper function. During execution the 
module can populate `module.exports` or `exports` with values to expose. 
3. **Caches the result** in `require.cache` keyed by the resolved filename. Subsequent `require()` 
calls for the same file return the same `module.exports` object without re-executing the module 
code. 
 
Because the module code runs only once, any side effects (like logging, reading files, connecting to a 
database) happen a single time. Mutating the exported object also changes the instance that other 
modules receive because everyone references the same cached object. You can manually clear the 
cache entry by deleting it from `require.cache`, but this is rarely done in production because it may 
lead to inconsistent state. 
 
The caching system also enables **cyclic dependencies**. When two modules require each other, 
Node will return a partially constructed `exports` object for the module still loading. This allows both 
modules to finish executing, but any values referenced before they are assigned will be `undefined`. 
See the circular dependencies section for details. 
 
## Module caching in ECMAScript modules 
 


---

 
438
ESM was designed with static structure and live bindings. When a module is imported the first time 
using `import` or `import()`: 
 
1. **Resolving and loading**: The module specifier is resolved using browser rules or Node's ESM 
resolution algorithm. ESM specifiers do not attempt file extensions unless you configure import maps 
or package exports; you must specify the full path (`./utils.js`) or rely on a package's `exports` field. 
2. **Instantiation**: The module code is parsed, declarations are created and live bindings are set 
up. Import statements create read-only references to exported values; if the exporting module later 
changes the value, all importers see the new value. 
3. **Evaluation**: The top-level code runs once. Unlike CJS, ESM does not wrap code in a function 
scope; variables declared at the top level belong to the module. After evaluation, the module is 
placed in the host's internal module cache. 
 
Like CommonJS, subsequent imports of the same ESM module return the same module namespace 
object; evaluation never repeats. However, ESM does not expose a public cache that you can modify. 
Module namespace objects are immutable and there is no standard way to clear or reload a module. 
Dynamic `import()` returns a promise that resolves to the module namespace; if the module has 
already been evaluated it resolves immediately. Re-loading code usually requires changing the 
module's URL (e.g. adding a query string or hash) or restarting the environment. 
 
## Key differences 
 


---

 
439
## Example: demonstrating CommonJS caching 
 
```js 
// logger.js (CommonJS) 
console.log("logger loaded"); 
module.exports = { time: Date.now() }; 
 
// app.js 
const logger1 = require("./logger"); 
setTimeout(() => { 
  const logger2 = require("./logger"); 
  console.log(logger1.time === logger2.time); // true 
}, 1000); 
``` 
 
When `logger.js` is first required, it logs "logger loaded" and exports the current timestamp. Even 
after one second the second `require()` returns the same object, so comparing the two times yields 
`true`. The module isn't re-executed because it is retrieved from the cache. 
 
## Example: demonstrating ESM caching 
 
```js 
// utils.js (ESM) 
export let counter = 0; 
export function increment() { 
  counter++; 
} 
 
// app.mjs 
import { counter, increment } from "./utils.js"; 
console.log(counter); // 0 
increment(); 


---

 
440
console.log(counter); // 1 (live binding updates) 
const ns = await import("./utils.js"); 
console.log(ns.counter); // 1 (same module instance) 
``` 
 
`utils.js` is executed only once. The `counter` variable is exported as a live binding. When 
`increment()` is called, the change is visible to all importers. Using dynamic `import()` later returns 
the same module namespace object; the module isn't re-run. 
 
## Best practices and pitfalls 
 
- **Don't mutate imported bindings** - In ESM, imported variables are read-only. To change shared 
state, export functions or objects that encapsulate state. 
- **Avoid relying on module side effects** - Because modules run once, any side effects occur only 
during initial load. Avoid modules that perform critical actions at import time; instead, provide 
explicit functions to call. 
- **Be mindful of cycles** - Cyclic dependencies can return incomplete exports or cause deadlocks 
(especially with top-level await). Refactor to remove cycles or defer access until after modules have 
finished initializing. 
- **Hot reloading** - There's no portable way to unload and reload ESM modules. Development 
tooling often works by spinning up new workers or altering import URLs with cache-busting query 
strings. 
 
## Practice questions 
 
1. **Theory:** What happens if you require the same CommonJS module multiple times in different 
files? Explain why the module's code is not executed again. 
2. **Theory:** How do live bindings in ES modules differ from the values exported by CommonJS 
modules? 
3. **Coding:** Create two CommonJS modules (`a.js` and `b.js`) that require each other. Show how 
partial exports are returned during loading and how you can safely use the values after both modules 
finish executing. 
4. **Coding:** Write a small ESM program where one module exports a counter and another 
imports it twice—once statically and once via dynamic `import()`. Demonstrate that both imports 
refer to the same counter value. 
5. **Theory:** Why is there no standard API to clear the ESM module cache, and what strategies 
exist for reloading code in an ESM environment? 


---

 
441
 
 
 
 


---

 
442
What happens in circular module dependencies in 
JavaScript? 
# What happens in circular module dependencies in JavaScript? 
 
A **circular dependency** occurs when two or more modules depend on each other, directly or 
indirectly. For example, `module A` imports something from `module B`, and `module B` imports 
something back from `module A`. Circular dependencies are legal in both CommonJS and ECMAScript 
modules, but they behave differently. Understanding these differences helps you avoid `undefined` 
values, deadlocks and other subtle bugs. 
 
## Circular dependencies in CommonJS 
 
In Node's CommonJS system, modules execute synchronously when first `require()`d. When a 
module encounters a `require()` call to another module, it pauses execution, resolves and loads the 
other module, and then resumes. If two modules require each other, Node breaks the cycle by 
providing a **partially filled `exports` object** to the dependent module while the first module 
continues loading. 
 
### Example 
 
```js 
// a.js 
console.log("a starting"); 
const b = require("./b"); 
module.exports = { 
  name: "module A", 
  bName: b.name, 
}; 
console.log("a loaded"); 
 
// b.js 
console.log("b starting"); 
const a = require("./a"); 


---

 
443
module.exports = { 
  name: "module B", 
  aName: a.name, 
}; 
console.log("b loaded"); 
 
// main.js 
const a = require("./a"); 
const b = require("./b"); 
console.log(a, b); 
``` 
 
When `a.js` requires `b.js`, Node starts evaluating `b.js`. In turn, `b.js` requires `a.js`, but `a.js` hasn't 
finished executing. Node returns the current incomplete `exports` object for `a.js` (which only 
contains `name: 'module A'`). Once both files finish executing, the exports are fully populated. 
Running `main.js` logs: 
 
```text 
a starting 
b starting 
b loaded 
a loaded 
{ name: 'module A', bName: 'module B' } { name: 'module B', aName: 'module A' } 
``` 
 
Notice that both modules eventually receive the correct names, but if you tried to access `b.bName` 
inside `b.js` before `b.js` finished executing, it would be `undefined`. To avoid issues, design modules 
so that any values imported from other modules are not needed during initial execution. Typically 
you should export functions or classes rather than direct values that need to exist immediately. 
 
## Circular dependencies in ES modules 
 


---

 
444
ES modules handle cycles differently. Import statements are hoisted and evaluated before any code 
runs; the module loader sets up **live bindings** for all imported and exported names. When a 
module imports another module that imports it back, both modules initialise their export bindings to 
`undefined` and then execute their top-level code. As exports are assigned, the imported bindings 
update automatically. Because of this design, most cycles resolve correctly as long as you don't use 
imported variables before they are initialised. 
 
### Example 
 
```js 
// a.mjs 
import { getName as getBName } from "./b.mjs"; 
export function getName() { 
  return "module A"; 
} 
export const bName = getBName(); 
 
// b.mjs 
import { getName as getAName } from "./a.mjs"; 
export function getName() { 
  return "module B"; 
} 
export const aName = getAName(); 
 
// main.mjs 
import { bName } from "./a.mjs"; 
import { aName } from "./b.mjs"; 
console.log({ aName, bName }); 
``` 
 
This example works because the imported functions are called after both modules assign their 
exports. Each module exports a function (`getName`) and uses the other module's function to define 
a constant. When `getName()` is called, the function refers to its own module's code, which has 
already been defined. The output is: 


---

 
445
 
```text 
{ aName: 'module A', bName: 'module B' } 
``` 
 
If you instead imported a variable that hasn't been assigned yet, you'd get `undefined`. So it's 
important to export functions or objects and defer calling them until after module initialisation. 
 
## Top-level await and cycles 
 
Starting with modern JavaScript, ES modules can use top-level `await`. This allows asynchronous 
code at the top level of a module but also introduces a new form of deadlock. When a module uses 
top-level `await`, importing modules must **wait** for it to resolve before continuing execution. If 
two modules with top-level `await` import each other and each awaits a promise that depends on 
the other module's completion, neither will ever resolve. The environment throws a `TypeError: 
Circular dependency detected while resolving promise` in these cases. 
 
To avoid deadlocks, avoid using top-level `await` in mutually dependent modules. Instead, move 
asynchronous operations into functions that the importer can call after initialisation or restructure 
the module dependencies to remove the cycle. 
 
## Best practices 
 
- **Minimise cycles** - Circular dependencies make code harder to reason about and can lead to 
undefined values or deadlocks. Refactor code into smaller modules or move shared code into a third 
module both depend on. 
- **Export functions and classes** - Avoid exporting computed values that depend on the other 
module's exports. Use functions to provide values when needed. 
- **Be cautious with top-level code** - In CommonJS, any code at the top level runs immediately; in 
ES modules it runs once at import time. Don't perform heavy work or rely on imported values before 
they exist. 
- **Prefer dynamic import in asynchronous cycles** - If you must load a module lazily to break a 
cycle, use `import()` within a function rather than a static `import`. This defers loading until runtime 
and avoids the static cycle. 
 
## Practice questions 


---

 
446
 
1. **Theory:** How does Node.js handle a circular dependency between two CommonJS modules? 
What will be returned when one module requires the other before it has finished executing? 
2. **Theory:** In ES modules, why does importing a function from a module involved in a cycle 
work, while importing a yet-to-be-initialised variable often results in `undefined`? 
3. **Coding:** Write two CommonJS modules that depend on each other and demonstrate a case 
where accessing a value too early results in `undefined`. Then refactor the code to avoid the issue. 
4. **Coding:** Create a pair of ES modules with top-level `await` that import each other and 
intentionally cause a deadlock. Observe the error and then modify the code to remove the deadlock 
by moving the awaits into a function. 
5. **Theory:** Explain how top-level `await` can lead to deadlocks in circular dependencies and list 
strategies to prevent such situations. 
 
 
 


---

 
447
Explain bare imports and import maps in browsers 
# Explain bare imports and import maps in browsers 
 
When writing modular JavaScript in browsers, you typically use **relative** or **absolute** URLs 
for your module specifiers: 
 
```js 
import helper from "./utils/helper.js"; 
import library from "https://cdn.example.com/lib.js"; 
``` 
 
These specifiers tell the browser exactly where to fetch a module. However, many Node.js or 
bundler-based codebases use **bare import specifiers** like `'react'` or `'lodash'` that do not 
contain `./`, `../`, or a URL. Historically, browsers could not resolve these names on their own because 
there was no mapping from the bare name to a network path. **Import maps** solve this problem 
by letting developers tell the browser how to resolve bare specifiers to actual URLs. 
 
## What are bare imports? 
 
A **bare import** is an import specifier that is not relative or absolute. Examples include: 
 
```js 
import React from "react"; 
import { useState } from "preact/hooks"; 
import theme from "app/theme"; 
``` 
 
Browsers don't know where to fetch `'react'`; they need a URL. Tools like webpack, Vite or Rollup 
handle this during bundling by resolving module names to files in `node_modules`. For 
browser-native modules, import maps provide a declarative way to achieve similar resolution. 
 
## What is an import map? 
 


---

 
448
An **import map** is a JSON object embedded in a `<script type="importmap">` tag. It defines one 
or more maps—`imports` and optionally `scopes`—that associate bare specifiers with URLs. At page 
load, the browser reads the import map and uses it whenever it resolves module specifiers in 
subsequent `import` statements or `import()` calls. 
 
### Basic example 
 
```html 
<!DOCTYPE html> 
<html> 
  <head> 
    <!-- Define the import map before any modules load --> 
    <script type="importmap"> 
      { 
        "imports": { 
          "react": "https://cdn.skypack.dev/react@18.2.0", 
          "react-dom": "https://cdn.skypack.dev/react-dom@18.2.0", 
          "app/": "/static/app/" 
        } 
      } 
    </script> 
    <script type="module" src="/static/app/main.js"></script> 
  </head> 
  <body></body> 
</html> 
``` 
 
In this example, any `import 'react'` in `main.js` or its dependencies will resolve to 
`https://cdn.skypack.dev/react@18.2.0`. Imports starting with `app/` are resolved relative to 
`/static/app/`. The import map must be declared **before** the module scripts that depend on it; 
otherwise the browser won't apply it. 
 
### Scoped import maps 


---

 
449
 
You can define different resolutions depending on which module imports the specifier using the 
optional `scopes` property. A scope is keyed by a parent module URL and contains its own `imports` 
mapping. This is useful when two parts of your application need different versions of the same 
dependency. 
 
```html 
<script type="importmap"> 
  { 
    "imports": { 
      "lit": "https://unpkg.com/lit@2/index.js" 
    }, 
    "scopes": { 
      "/admin/": { 
        "lit": "https://unpkg.com/lit@1/index.js" 
      } 
    } 
  } 
</script> 
``` 
 
Modules under `/admin/` will receive version 1 of Lit, while others receive version 2. 
 
## When to use import maps 
 
Import maps are useful when you want to: 
 
- **Use bare specifiers in the browser** without a bundler. 
- **Pin versions of external libraries** hosted on a CDN. 
- **Alias local paths** to shorter specifiers (e.g. map `'@components/'` to `/src/components/`). 
- **Experiment with CDNs** or new package versions without changing source code. 
 


---

 
450
They work well for small or medium projects, demos and quick prototypes. For large applications 
with hundreds of modules, bundlers still offer performance benefits (tree shaking, bundling multiple 
files into a single HTTP request). 
 
## Limitations and considerations 
 
- **Single import map:** Only the first import map is processed. Additional import maps are 
ignored. 
- **Must appear before modules:** The import map must be defined before any `<script 
type="module">` that uses bare specifiers; otherwise the specifiers won't resolve. 
- **Spec applies only to module imports:** Import maps affect `import` statements and dynamic 
`import()`. They do not apply to `<script src="...">`, worker `new Worker()`, or other non-module 
resource loads. 
- **Browser support:** As of 2025, major Chromium-based browsers support import maps. Firefox 
has partial support behind a flag, while Safari support is experimental. Use a feature detection or a 
polyfill for wider compatibility. 
 
## Practice questions 
 
1. **Theory:** What is a bare import specifier, and why can't browsers resolve it without help? 
2. **Theory:** Describe the purpose of an import map's `imports` and `scopes` sections. When 
might you use a scoped import map? 
3. **Coding:** Write a small HTML page that defines an import map mapping `'lodash'` to a CDN 
URL. Then write a module that imports `lodash` and uses it to merge two objects. 
4. **Coding:** Modify the previous example to use a scoped import map so that 
`/admin/dashboard.js` imports a different version of `lodash` than the rest of your site. 
5. **Theory:** List some limitations of import maps and explain why a bundler might still be 
preferred for large applications. 
 
 
 


---

 
451
What are custom error classes and how do you create 
them? 
# What are custom error classes and how do you create them? 
 
JavaScript's built-in error types—such as `Error`, `TypeError` and `RangeError`—represent common 
programming mistakes. In real-world applications you often need to distinguish different kinds of 
failure conditions: for example, an error when a user cannot be found is different from an error when 
a network request fails. **Custom error classes** let you define your own error types with 
meaningful names and additional information, making error handling more precise and expressive. 
 
## Why create custom errors? 
 
- **Clarity:** A specific error class conveys intent better than a generic `Error`. It's easier to catch 
and handle `ValidationError` or `PermissionError` separately from unrelated issues. 
- **Pattern matching:** You can use `instanceof` to check for a particular error type and recover 
accordingly. 
- **Additional context:** Custom errors can carry extra properties (like an error code or user ID) to 
help debugging or return more information to callers. 
 
## Extending the `Error` class 
 
To define a custom error, create a class that extends the built-in `Error` and call `super(message)` in 
the constructor. Set the `name` property to the class name so that stack traces show the correct 
type. You can also define additional properties. 
 
```js 
class ValidationError extends Error { 
  constructor(message, code) { 
    super(message); // call the parent constructor with the message 
    this.name = "ValidationError"; 
    this.code = code; // custom property 
  } 
} 
 


---

 
452
function processUser(user) { 
  if (!user.email) { 
    throw new ValidationError("Email is required", "MISSING_EMAIL"); 
  } 
  // process user... 
} 
 
try { 
  processUser({ name: "Bob" }); 
} catch (err) { 
  if (err instanceof ValidationError) { 
    console.error(`Invalid input: ${err.message} (code ${err.code})`); 
  } else { 
    throw err; // rethrow unexpected errors 
  } 
} 
``` 
 
In the example above, throwing a `ValidationError` allows the caller to distinguish input validation 
problems from other errors. The custom property `code` holds a machine-readable error code. 
 
## Using the `cause` property 
 
ES2022 introduced an optional `cause` property on errors. You can provide another error as the 
cause when constructing your custom error: 
 
```js 
class DatabaseError extends Error { 
  constructor(message, options) { 
    super(message, options); 
    this.name = "DatabaseError"; 
  } 


---

 
453
} 
 
async function saveRecord(record) { 
  try { 
    await db.insert(record); 
  } catch (err) { 
    throw new DatabaseError("Failed to save record", { cause: err }); 
  } 
} 
``` 
 
Now, `DatabaseError` instances include a `cause` property referencing the original error, preserving 
the error chain for debugging. 
 
## Best practices for custom errors 
 
- **Always extend `Error`:** This ensures your custom error has a proper stack trace and can be 
caught using `instanceof Error`. 
- **Set the `name` property:** By default the `Error` constructor sets `name` to `'Error'`. Overwrite 
it with your class name for clearer stack traces. 
- **Add context carefully:** Include only relevant information (like HTTP status codes or identifiers). 
Don't put large objects on errors because they may be logged or sent over the wire. 
- **Document expected errors:** Make it clear which error types a function can throw so callers 
know what to handle. 
 
## Practice questions 
 
1. **Theory:** Why might you prefer throwing a `NotFoundError` instead of a generic `Error` when a 
database record is missing? 
2. **Theory:** What is the purpose of the `cause` property on an error, and how can it help 
debugging? 
3. **Coding:** Create a `PermissionError` class that extends `Error`. Have it take a `userId` and 
required `role` in its constructor and include them on the instance. Demonstrate how you would 
catch and log this error differently from other errors. 


---

 
454
4. **Coding:** Rewrite a function that throws generic errors to instead use specific custom error 
classes (`ValidationError`, `NetworkError`, etc.). Show how the caller can distinguish between them 
using `instanceof`. 
5. **Theory:** When defining a custom error class, why is it important to call `super(message)` and 
set the `name` property? 
 
 
 


---

 
455
How do try–catch–finally blocks behave with 
async/await? 
# How do try-catch-finally blocks behave with async/await? 
 
`async/await` lets you write asynchronous code that looks synchronous. But asynchronous 
operations can still fail, and errors must be handled carefully. The familiar `try...catch...finally` 
construct works with `await` just like it does with synchronous code, but there are some nuances to 
be aware of. 
 
## Basic use with `await` 
 
`await` pauses the execution of an async function until the awaited promise settles (fulfills or 
rejects). If the promise fulfills, the value becomes the result of the `await` expression. If it rejects, the 
`await` expression throws the rejection reason as an exception. This means you can wrap an `await` 
in a `try...catch` block to handle promise rejections: 
 
```js 
async function fetchData() { 
  try { 
    const response = await fetch("/api/data"); 
    if (!response.ok) { 
      throw new Error("HTTP error: " + response.status); 
    } 
    return await response.json(); 
  } catch (err) { 
    console.error("Failed to fetch data:", err); 
    // Optionally rethrow or return a fallback value 
    throw err; 
  } 
} 
``` 
 


---

 
456
In this example, any error thrown by `fetch()` or by manual checks inside the `try` block is caught in 
the `catch` block. If the error is rethrown, callers can catch it further up the chain. 
 
## The `finally` clause 
 
The `finally` block executes **after** the `try` and `catch`, regardless of whether an exception 
occurred. This is useful for cleanup operations that must run no matter what (closing files, releasing 
locks, showing or hiding loaders). If the function returns or throws inside the `try` or `catch`, the 
`finally` block still executes before control leaves the function: 
 
```js 
async function withLock(lock, work) { 
  await lock.acquire(); 
  try { 
    return await work(); 
  } catch (err) { 
    // handle error or rethrow 
    throw err; 
  } finally { 
    lock.release(); // always release lock 
  } 
} 
``` 
 
Even if `work()` throws an error or returns a value, `lock.release()` is guaranteed to run. 
 
## Catching multiple awaits 
 
A single `try` block can contain multiple `await` statements. If any awaited promise rejects, control 
jumps to the nearest enclosing `catch` block. To handle errors from individual awaits separately, 
place each in its own `try...catch` or use `Promise.allSettled()` to collect results without throwing: 
 
```js 


---

 
457
async function fetchMany(urls) { 
  const results = []; 
  for (const url of urls) { 
    try { 
      const res = await fetch(url); 
      results.push(await res.json()); 
    } catch (err) { 
      console.warn("Error fetching", url, err); 
      results.push(null); 
    } 
  } 
  return results; 
} 
 
// Or using Promise.allSettled to handle all rejections at once 
async function fetchManyParallel(urls) { 
  const promises = urls.map((u) => fetch(u).then((r) => r.json())); 
  const settled = await Promise.allSettled(promises); 
  return settled.map((res) => (res.status === "fulfilled" ? res.value : null)); 
} 
``` 
 
## Beware of unhandled rejections 
 
If an awaited promise rejects outside of any `try...catch`, the error will propagate to the next 
enclosing async function or to the global environment. In Node.js, an unhandled rejection triggers 
the `unhandledRejection` event and may terminate the process. In browsers, it triggers an 
`unhandledrejection` event on `window`. Always either catch or return errors. 
 
## Finally and returned values 
 


---

 
458
If you return a value from inside `try` or `catch`, the `finally` block still runs **before** the return. If 
you return a value in `finally`, that value overrides any earlier return or thrown error. Overwriting 
return values in `finally` is discouraged because it makes control flow hard to understand. 
 
```js 
async function tricky() { 
  try { 
    return 1; 
  } finally { 
    return 2; // overrides the 1 
  } 
} 
// tricky().then(console.log); // logs 2 
``` 
 
## Practice questions 
 
1. **Theory:** How does `await` interact with `try...catch` when a promise rejects? What happens if 
the rejection is not caught? 
2. **Theory:** Why is the `finally` block useful in asynchronous code? Give two scenarios where 
you'd put code in a `finally` clause. 
3. **Coding:** Write an async function that reads from two APIs sequentially using `await`. Use one 
`try...catch` to handle errors from both calls, and then modify the code to handle errors from each 
call separately. 
4. **Coding:** Demonstrate what happens when a `finally` block returns a value different from the 
one returned in the `try` block. Explain why doing this can be confusing. 
5. **Theory:** In Node.js, what global event is emitted when a promise rejection has no handler, 
and how can you listen for it? 
 
 
 


---

 
459
What is unhandledrejection and how can it crash your 
app? 
# What is `unhandledrejection` and how can it crash your app? 
 
Promises allow you to chain asynchronous operations and handle errors with `.catch()` or `try...catch` 
and `await`. If a promise is rejected and **no rejection handler** is attached, it is considered 
**unhandled**. Different environments react to unhandled rejections in different ways, and failing 
to handle them can cause your application to behave unpredictably or even crash. 
 
## Unhandled rejections in browsers 
 
In browsers, when a promise rejection is not handled at the time it occurs, the JavaScript engine 
dispatches a global `unhandledrejection` event on the `window` object. You can listen for this event 
to log or handle unexpected rejections: 
 
```js 
window.addEventListener("unhandledrejection", (event) => { 
  console.error("Unhandled rejection:", event.reason); 
  event.preventDefault(); // prevents the default logging to console 
}); 
 
// Example of an unhandled rejection 
Promise.reject(new Error("Something went wrong")); 
``` 
 
If you don't listen for `unhandledrejection`, the browser typically logs the error to the console. 
Unhandled rejections do not crash the page by default, but they can leave your application in an 
inconsistent state. 
 
If a rejection is later handled (e.g. by attaching a `.catch()`), some browsers also emit a 
`rejectionhandled` event. However, relying on late handlers is discouraged; always attach `.catch()` on 
promises or wrap `await` in `try...catch`. 
 
## Unhandled rejections in Node.js 


---

 
460
 
Node.js emits an `unhandledRejection` event on the `process` object when a promise rejection is not 
handled during the current turn of the event loop. By default, Node prints a stack trace and, 
depending on the `--unhandled-rejections` flag, may terminate the process. Unhandled rejections 
can therefore crash your application if left unchecked. 
 
You can handle these events globally: 
 
```js 
process.on("unhandledRejection", (reason, promise) => { 
  console.error("Unhandled rejection at:", promise, "reason:", reason); 
  // Application specific: decide whether to exit 
  process.exit(1); 
}); 
 
// Example of an unhandled rejection 
async function run() { 
  throw new Error("Database unavailable"); 
} 
run(); 
``` 
 
In recent versions of Node, the default behaviour is configurable. You can set `--unhandled-
rejections=strict` to make any unhandled rejection terminate the process, `warn` to log a warning but 
keep running, or `none` to ignore. The default is `warn`. 
 
## Why unhandled rejections are dangerous 
 
- **Silent failures:** If errors are not caught, parts of your app may silently fail and leave 
inconsistent state. For example, a failed API call might leave UI in a loading state forever. 
- **Crashes in Node:** Leaving a promise rejection unhandled in Node can crash your server 
process, resulting in downtime. 
- **Debugging difficulty:** Without catching errors near where they occur, stack traces may be 
harder to follow. 


---

 
461
 
## Best practices 
 
- **Always handle promise rejections:** Use `.catch()` when chaining promises or wrap `await` calls 
in `try...catch`. 
- **Use `Promise.allSettled()` for multiple operations:** When running many asynchronous tasks 
concurrently, `Promise.all()` fails fast on the first rejection. If you want to handle all rejections 
gracefully, use `Promise.allSettled()` or handle errors individually. 
- **Global handlers for fallback logging:** Set up a `window.unhandledrejection` listener in 
browsers and a `process.on('unhandledRejection')` handler in Node to log unexpected rejections and 
prevent the process from crashing. 
- **Fail fast in critical services:** In backend services it is often preferable to exit on unhandled 
rejections so that a process manager can restart the service in a clean state. 
 
## Practice questions 
 
1. **Theory:** What is an "unhandled promise rejection," and how do browsers and Node.js differ 
in their default handling? 
2. **Theory:** Describe the dangers of leaving promise rejections unhandled in a Node.js server 
application. 
3. **Coding:** Write a piece of code in the browser that rejects a promise without a `.catch()`. Add 
an `unhandledrejection` listener to log the error message and prevent the default behaviour. 
4. **Coding:** In Node.js, demonstrate how to configure unhandled rejection behaviour to `strict`, 
then show how to handle unhandled rejections globally to avoid process termination. 
5. **Theory:** Why is it good practice to attach `.catch()` to every promise or handle errors with 
`try...catch` when using `await`? 
 
 
 


---

 
462
What are tagged template literals used for in libraries 
like styled-components? 
# What are tagged template literals used for in libraries like styled-components? 
 
JavaScript's **tagged template literals** combine template strings with a function. When you place 
a function name immediately before a template literal—`` tag`...`  ``—JavaScript doesn't create a 
string directly. Instead, it calls the tag function with the literal's text fragments and substitution 
values. The function can return any value. Tagged templates provide powerful metaprogramming 
capabilities for parsing, transforming and contextualising string data. 
 
Libraries like **styled-components** use tagged template literals to implement CSS-in-JS. 
Styled-components lets you write actual CSS inside JavaScript and produces React components with 
encapsulated styles. Here's how it works and why tagged templates are essential. 
 
## Basics of tagged templates 
 
A tag function is called with two parameters: an array of **string segments** and a list of 
**interpolated values**. The first argument is an array of the literal portions of the template, and 
subsequent arguments correspond to the embedded expressions. For example: 
 
```js 
function myTag(strings, ...values) { 
  console.log(strings); // ['Hello ', ', you are ', '!'] 
  console.log(values); // ['Alice', 30] 
  return strings[0] + values[0] + strings[1] + values[1] + strings[2]; 
} 
 
const result = myTag`Hello ${"Alice"}, you are ${30}!`; 
console.log(result); // 'Hello Alice, you are 30!' 
``` 
 
The tag function can transform or even ignore the template parts. Because tags receive raw strings, 
they can perform advanced processing like syntax highlighting, sanitisation, or constructing data 
structures. 


---

 
463
 
## How styled-components uses tags 
 
Styled-components is a popular library for styling React components. You create a styled component 
by calling `styled.tagName` followed by a template literal containing CSS. The `styled` object is a 
function that returns another function (the tag). When you write: 
 
```js 
import styled from "styled-components"; 
 
const Title = styled.h1` 
  color: ${(props) => (props.primary ? "hotpink" : "black")}; 
  font-size: 2rem; 
`; 
 
function App() { 
  return <Title primary>Hello world</Title>; 
} 
``` 
 
several things happen: 
 
1. **The tag function processes the template:** The styled-components tag function receives the 
static CSS strings and the interpolation functions (here `(props) => (props.primary ? 'hotpink' : 
'black')`). 
2. **Dynamic interpolation:** At runtime, when the `Title` component is rendered, 
styled-components calls the interpolation functions with the component's props to compute 
dynamic values. In the example above, the color becomes `'hotpink'` when the `primary` prop is true. 
3. **Generates a unique class name:** Styled-components compiles the resulting CSS and injects it 
into a `<style>` tag. It generates a unique class name (e.g. `sc-a1234`) and applies it to the rendered 
component so that styles are encapsulated. 
4. **Returns a React component:** The result of the tagged template call is a React component 
(`Title`) that accepts props. You can use it like any other component in your JSX. 
 


---

 
464
Because tagged template literals allow styled-components to capture both static CSS and dynamic 
JavaScript expressions in a single construct, they are ideal for CSS-in-JS libraries. Without tags, you'd 
have to build CSS strings manually and apply them to elements, losing readability and syntax 
highlighting. 
 
## Other uses of tagged templates 
 
Tagged template literals are used beyond styling libraries: 
 
- **Translation (i18n):** Tags can implement string interpolation for translations, handling 
pluralisation and locale-specific formatting. 
- **Safe HTML escaping:** A tag function can escape user input to prevent XSS attacks when 
constructing HTML. 
- **Domain-specific languages:** Tags can parse custom mini-languages embedded in template 
literals (e.g. GraphQL queries). 
 
## Best practices and cautions 
 
- **Keep tag functions pure:** A tag should be a pure function of its arguments; avoid side effects 
like DOM manipulation within the tag. 
- **Performance considerations:** Tags are executed each time the template literal is evaluated. In 
performance-critical code paths, avoid complex computation in tag functions. 
- **Beware of injection:** When using tagged templates to generate CSS or HTML, make sure to 
sanitise interpolated values to avoid injecting malicious content. 
 
## Practice questions 
 
1. **Theory:** How do tagged template literals differ from normal template literals, and what are 
their parameters? 
2. **Theory:** Describe the steps styled-components performs when it encounters a tagged 
template literal. 
3. **Coding:** Write a simple tag function named `sanitizeHtml` that escapes `<`, `>`, `&` and `"` in 
interpolated values. Use it to safely insert user input into an HTML string. 
4. **Coding:** Create a basic React component using styled-components that sets the background 
color based on a `danger` prop. Explain how the interpolation function uses props. 


---

 
465
5. **Theory:** Besides styling, name two other domains where tagged template literals are useful 
and explain how they help. 
 
 
 


---

 
466
Explain the difference between lazy evaluation and 
eager evaluation in iterables 
# Explain the difference between lazy evaluation and eager evaluation in iterables 
 
In programming, **evaluation strategy** describes when expressions are executed. Two common 
strategies are **eager (strict) evaluation** and **lazy (deferred) evaluation**. Although JavaScript 
is an eagerly evaluated language by default, it provides constructs—like generator functions—that 
allow lazy evaluation. Understanding the difference helps you write more efficient code, especially 
when dealing with large data sets or infinite sequences. 
 
## Eager evaluation 
 
With eager evaluation, expressions are evaluated as soon as they are bound to a variable or passed 
as arguments. Arrays in JavaScript are **eager collections**. When you map, filter or reduce an 
array, the entire array is traversed and a new array is created immediately, even if you ultimately only 
need a few values. 
 
Example of eager evaluation: 
 
```js 
const numbers = [1, 2, 3, 4, 5]; 
const doubled = numbers.map((n) => n * 2); // [2, 4, 6, 8, 10] 
// All values are computed up front 
``` 
 
Eager evaluation is simple and predictable. However, it can be wasteful when operating on huge 
collections or when chaining many operations, because intermediate arrays are created and every 
element is processed regardless of whether you use them. 
 
## Lazy evaluation 
 
Lazy evaluation (also called deferred or call-by-need) delays computing a value until it is actually 
needed. In JavaScript, **generator functions** and **iterators** enable lazy evaluation. A 
generator is defined with `function*` and yields values one at a time. Values are produced on 
demand when you iterate over the generator with `for...of` or call `.next()`. 


---

 
467
 
```js 
function* countUpTo(n) { 
  for (let i = 1; i <= n; i++) { 
    console.log("generating", i); 
    yield i; 
  } 
} 
 
const seq = countUpTo(3); 
for (const num of seq) { 
  console.log(num); 
} 
// Logs "generating 1" then 1, "generating 2" then 2, etc. 
``` 
 
The generator produces each value only when requested by the loop. If you break out of the loop 
early, unused values are never generated. This makes lazy evaluation efficient for potentially large or 
infinite sequences, and for pipelines where intermediate results might be filtered out. 
 
## Comparing lazy and eager evaluation 
 
 
### Example: chaining operations 
 
Suppose you want to take the first 3 even numbers greater than 10 from a list of numbers. Using 
eager arrays: 
 
```js 
const result = numbers 


---

 
468
  .filter((n) => n > 10) 
  .filter((n) => n % 2 === 0) 
  .slice(0, 3); 
``` 
 
All filters run on the entire array before slicing the first three results, even if the list is huge. With a 
lazy pipeline using generators you can short-circuit: 
 
```js 
function* filter(iterable, predicate) { 
  for (const item of iterable) { 
    if (predicate(item)) yield item; 
  } 
} 
 
function* take(iterable, n) { 
  let count = 0; 
  for (const item of iterable) { 
    if (count++ < n) yield item; 
    else return; 
  } 
} 
 
const lazyResult = take( 
  filter( 
    filter(numbers, (n) => n > 10), 
    (n) => n % 2 === 0 
  ), 
  3 
); 
// Values are produced only until the third match is found 


---

 
469
``` 
 
## Benefits and trade-offs 
 
- **Performance:** Lazy sequences can reduce CPU and memory usage because they avoid creating 
intermediate collections and stop generating values once you have enough. However, for small data 
sets or when you need all values, the overhead of generator functions can make eager evaluation 
faster. 
- **Composability:** You can build pipelines of generator functions (`map`, `filter`, etc.) that mirror 
functional programming libraries. Libraries like [Iterables](https://developer.mozilla.org/en-
US/docs/Web/JavaScript/Reference/Iteration_protocols) or third-party packages provide helper 
functions. 
- **Infinite sequences:** Lazy evaluation makes it trivial to represent infinite sequences (e.g. the 
Fibonacci sequence) since values are generated on demand. 
- **Statefulness:** Generators maintain internal state between iterations. If you need random 
access or multiple passes over data, you must recreate the generator or collect its output into an 
array. 
 
## Practice questions 
 
1. **Theory:** Define lazy evaluation in your own words. How does it differ from eager evaluation? 
2. **Theory:** What advantages does a generator offer when processing large data sets compared 
to using array methods like `map` and `filter`? 
3. **Coding:** Write a generator function `range(start, end)` that lazily yields all integers from `start` 
(inclusive) up to `end` (exclusive). Use it to sum the first ten positive integers without creating an 
array. 
4. **Coding:** Refactor a chain of `Array` methods (`filter`, `map`, `reduce`) into a lazy pipeline using 
generator functions. Measure performance differences with a large array. 
5. **Theory:** When might eager evaluation be preferable to lazy evaluation? Give an example 
where laziness does not provide a benefit. 
 
 
 


---

 
470
How does tail-call optimization (TCO) work, and is it 
supported in JavaScript engines? 
# How does tail-call optimization (TCO) work and is it supported in JavaScript engines? 
 
**Tail-call optimization (TCO)** is a compiler or interpreter feature that allows certain kinds of 
recursive functions to execute without growing the call stack. In languages that implement TCO, a call 
to a function in **tail position**—meaning the call is the final action in the function—can reuse the 
current stack frame instead of allocating a new one. This enables deep recursion without causing 
stack overflows and can improve performance. 
 
## What is a tail call? 
 
A **tail call** is a function call that happens as the last operation of another function. There is no 
additional work to do after the call returns. For example, in this function the recursive call to 
`factorial` is in tail position: 
 
```js 
function factorialTail(n, acc = 1) { 
  if (n === 0) return acc; 
  return factorialTail(n - 1, acc * n); // tail call 
} 
 
factorialTail(5); // 120 
``` 
 
Because nothing happens after `factorialTail(n - 1, ...)` returns, the function could, in theory, replace 
its stack frame with that of the new call. In contrast, this naive implementation has work to do after 
the recursive call (multiplying by `n`), so it is **not** in tail position: 
 
```js 
function factorial(n) { 
  if (n === 0) return 1; 
  return n * factorial(n - 1); // not a tail call 


---

 
471
} 
``` 
 
## How TCO works 
 
When TCO is implemented, the runtime recognises that the last action of a function is calling another 
function (possibly itself). Instead of pushing a new stack frame, it reuses the current one by updating 
parameters and jumping to the start of the called function. This eliminates stack growth for 
tail-recursive functions and allows them to run as efficiently as loops. 
 
Languages like Scheme, some implementations of Python, and functional languages like Haskell 
support TCO. In JavaScript, proper tail calls (PTC) were specified in ECMAScript 2015, but support has 
been spotty. 
 
## TCO support in JavaScript engines 
 
- **Safari / WebKit:** Safari's JavaScriptCore engine implements proper tail calls in strict mode. If 
you write a tail-recursive function and run it in Safari with `'use strict'`, deep recursion won't 
overflow the stack. This makes Safari the only major browser with native TCO support as of 2025. 
- **V8 (Chrome, Node.js), SpiderMonkey (Firefox) and JSC (other modes):** V8 and SpiderMonkey 
removed their experimental TCO implementations due to debugging complexity and compatibility 
concerns. As a result, tail-recursive functions still consume stack frames and may overflow on deep 
recursion. Developers must convert recursive algorithms to loops or manually maintain their own 
stacks. 
- **Embedded engines:** Smaller engines like Kinoma XS6 and Duktape support TCO. These engines 
are used in embedded contexts and emphasise memory efficiency. 
 
Because TCO is not universally supported, it's best to avoid relying on it in production code. Use 
iterative constructs or self-managed stacks when writing algorithms that could recurse deeply. 
 
## Simulating TCO with trampolines 
 
If you need recursion without stack growth in environments that lack TCO, you can employ the 
**trampoline** pattern. A trampoline repeatedly calls a function that returns either a value or 
another function to call. This turns recursion into iteration: 
 


---

 
472
```js 
function sumRange(n, acc = 0) { 
  if (n === 0) return acc; 
  return () => sumRange(n - 1, acc + n); 
} 
 
function trampoline(fn) { 
  let result = fn; 
  while (typeof result === "function") { 
    result = result(); 
  } 
  return result; 
} 
 
const result = trampoline(() => sumRange(100000)); 
console.log(result); // 5000050000 without stack overflow 
``` 
 
The `sumRange` function returns a new function instead of making a direct recursive call. The 
trampoline repeatedly invokes functions until a final value is returned, effectively turning recursion 
into a loop. 
 
## Practice questions 
 
1. **Theory:** Explain what a tail call is and why it allows tail-call optimization. Contrast a tail call 
with a non-tail call in the context of recursion. 
2. **Theory:** Describe why proper tail call support has not been widely implemented in JavaScript 
engines despite being part of the ECMAScript specification. 
3. **Coding:** Write a tail-recursive function to compute the nth Fibonacci number. Test it in a 
browser that supports TCO (if available) and in Node.js. Observe whether stack overflow occurs. 
4. **Coding:** Implement the trampoline pattern to compute the factorial of a large number (e.g. 
50 000) without causing a stack overflow. Explain how the trampoline avoids stack growth. 


---

 
473
5. **Theory:** In which environments might you safely rely on native TCO? How would you handle 
deep recursion in environments without TCO? 
 
 
 


---

 
474
What are Record and Tuple proposals, and how do they 
differ from Objects and Arrays? 
# What are record and tuple proposals and how do they differ from objects and arrays? 
 
The ECMAScript **Record & Tuple** proposal introduces two new compound primitive types to 
JavaScript: **records** and **tuples**. These types aim to provide deeply immutable, value-based 
data structures as alternatives to mutable objects and arrays. As of 2025 the proposal sits at Stage 2 
of the TC39 process, meaning it is still experimental. Even though the proposal may change, its core 
ideas are worth understanding. 
 
## Motivation 
 
JavaScript objects and arrays are mutable and compared by reference. To manage state immutably, 
developers often use libraries (like Immutable.js or Immer) that create read-only proxies or wrapper 
objects. These libraries add overhead and do not integrate seamlessly with the language. Records 
and tuples would provide **built-in immutable data structures** with predictable behaviour: 
 
- **Deep immutability:** Once created, records and tuples cannot be changed. Nested data is also 
immutable. 
- **Value equality:** Two records or tuples are considered equal (`===`) if their contents are 
identical, unlike objects and arrays which compare by reference. 
- **Contain only primitives:** Records and tuples may only contain primitives (including other 
records and tuples). They cannot contain objects, functions or mutable arrays. 
 
## Syntax 
 
Although syntax is still under discussion, the proposal uses a `#` prefix to distinguish records and 
tuples from objects and arrays. For example: 
 
```js 
// Record: similar to an object but immutable 
const point = #{ x: 10, y: 20 }; 
 
// Tuple: similar to an array but immutable 


---

 
475
const coords = #[1, 2, 3]; 
 
// Nested record with a tuple property 
const shape = #{ 
  name: "triangle", 
  vertices: #[ 
    [0, 0], 
    [1, 0], 
    [0, 1], 
  ], 
}; 
 
// Equality by value 
#{ x: 1, y: 2 } === #{ x: 1, y: 2 }; // true 
#[] === #[]; // true 
``` 
 
In these examples, the `#` prefix signals that the structure is a record or tuple. Because they are 
deeply immutable, trying to modify a record or tuple would throw or have no effect. 
 
## Differences from objects and arrays 
 


---

 
476
 
## Interoperability 
 
Records and tuples are designed to interoperate smoothly with existing language features: 
 
- They support destructuring and property access just like objects and arrays: 
  ```js 
  const #{ x, y } = point;  // destructure a record 
  const [first, second] = coords; // destructure a tuple 
  ``` 
- Records and tuples are intended to be serialisable and interoperable with JSON and structured 
cloning. Because they are immutable, transferring them across workers would not require copying 
internal state. 
- Since they are primitives, records and tuples do not have prototypes. They are not affected by 
changes to `Object.prototype` or `Array.prototype`. 
 
## Current status and future 
 
The Record & Tuple proposal is still evolving. At Stage 2, the details of syntax, semantics, and 
interoperability may change. There was an earlier proposal that used `{| ... |}` and `[||]` syntax; the 


---

 
477
current version uses a `#` prefix but this is not final. Some concerns include complexity of value 
equality, limitations of only allowing primitives, and interaction with existing APIs. 
 
If the proposal advances, records and tuples could reduce reliance on external immutability libraries 
and make it easier to reason about state. Until then, libraries like Immer remain the best way to work 
with immutable data in JavaScript. 
 
## Practice questions 
 
1. **Theory:** Describe the key differences between records/tuples and objects/arrays in JavaScript. 
Why are records and tuples compared by value instead of by reference? 
2. **Theory:** Why can't records and tuples contain non-primitive values? What benefits does this 
restriction provide? 
3. **Coding:** Declare a record representing a user with `name` and `age` properties, and a tuple 
representing the user's favorite colors. Show how you might destructure these structures. 
4. **Coding:** Create two records with the same contents and demonstrate that they are `===` 
equal. Then create two plain objects with the same properties and demonstrate that they are not 
strictly equal. 
5. **Theory:** What challenges might arise when adding records and tuples to JavaScript? Consider 
syntax, backward compatibility and performance. 
 
 
 


---

 
478
What is pattern matching in JavaScript (proposal stage)? 
# What is pattern matching in JavaScript (proposal stage)? 
 
**Pattern matching** is a proposal to add a powerful conditional construct to JavaScript, inspired by 
languages like Haskell, Rust and Swift. The proposal introduces a `match` expression that can test a 
value against multiple patterns—such as literal values, destructured objects, arrays, and even guard 
conditions—and execute code based on the first matching case. As of 2025 the pattern matching 
proposal is at Stage 3, meaning its design is complete but it is not yet part of the language. 
 
## Motivation 
 
JavaScript developers often rely on nested `if...else` statements or verbose `switch` statements to 
handle different shapes of data. Pattern matching aims to make such logic concise and expressive. It 
builds on existing destructuring patterns, enabling you to match and extract values in one expression 
while avoiding fall-through behaviour and improving readability. 
 
## Basic syntax 
 
Here's an example of a proposed pattern matching syntax: 
 
```js 
const response = { status: 200, data: { message: 'OK' } }; 
 
match (response) { 
  { status: 200, data } => console.log('Success:', data.message), 
  { status: 404 }     => console.log('Not found'), 
  { status: 500 }     => console.log('Server error'), 
  _                  => console.log('Unknown status'), 
} 
``` 
 
Key features: 
 


---

 
479
- **Patterns** can be object patterns (`{ status: 200, data }`), array patterns (`[x, y]`), literal values 
(`42`, `'hello'`), or identifier patterns (`_` for a wildcard). Patterns can use nested destructuring, 
default values and computed keys. 
- **Arrow syntax** (`pattern => expression`) associates each pattern with an expression or block to 
evaluate when the match succeeds. Only the first matching branch executes—there is no fall-through 
like in `switch`. 
- **Exhaustiveness** is encouraged but not enforced. A wildcard `_` at the end acts as a catch-all 
case. 
 
## Guards and fallthrough 
 
Patterns can include **guard conditions** using `if` to add additional checks: 
 
```js 
match (value) { 
  [x, y] if x === y => console.log('a symmetric pair'), 
  [x, y]            => console.log('a pair of numbers'), 
  _                 => console.log('something else'), 
} 
``` 
 
In this example, the first branch matches arrays with two elements and then checks the guard `x === 
y`. If the guard fails, execution continues to the next branch. 
 
## Advantages over `switch` and `if...else` 
 
- **Concise destructuring and matching:** You can match against nested shapes and extract values 
without separate destructuring statements. 
- **No accidental fall-through:** Each branch is independent; there is no need for `break` 
statements as in `switch`. 
- **Safer defaults:** A wildcard case encourages handling unknown values explicitly. 
- **Readability:** For complex conditionals with different data shapes (e.g. discriminated unions, 
tagged responses), `match` can be easier to follow than nested `if` statements. 
 


---

 
480
## Current status and tooling 
 
The pattern matching proposal is still experimental. Tooling like Babel plugins and TypeScript 
transforms allow you to experiment with pattern matching today. Because the feature is not yet 
standard, syntax and semantics may change. You should avoid using it in production without 
transpilation. 
 
## Practice questions 
 
1. **Theory:** How does the proposed `match` expression improve upon existing `switch` 
statements? Discuss fall-through and destructuring. 
2. **Theory:** What are guard conditions in pattern matching? Provide an example. 
3. **Coding:** Write a `match` expression that takes a variable which may be a string, number, array 
of two numbers or any other value, and logs different messages for each case. 
4. **Coding:** Convert a nested `if...else` chain that checks `response.status` and `response.data` 
into a pattern matching expression. 
5. **Theory:** Why is the pattern matching proposal still at Stage 3, and what considerations should 
developers keep in mind before using experimental syntax? 
 
 
 


---

 
481
How does the pipeline operator improve function 
chaining? 
# How does the pipeline operator improve function chaining? 
 
Modern JavaScript encourages composition: building complex behaviour by combining small, pure 
functions. When you compose functions using nested calls, however, the code often reads 
**inside-out**. Consider calculating a result by doubling a number, adding three and then negating 
it: 
 
```js 
const result = negate(add(3, double(5))); 
``` 
 
To understand this expression you have to start in the middle (`double(5)`), then move to the left 
(`add(3, ...)`), and finally apply `negate`. The proposed **pipeline operator** (`|>`) flips this around. 
It takes the value on its left and feeds it as an argument into the function on its right, allowing the 
chain to be read **left-to-right**: 
 
```js 
const result = 5 |> double |> ((n) => add(3, n)) |> negate; 
``` 
 
Each pipeline stage receives the output of the previous stage. The above code is easier to scan 
because the order of operations matches the order of the lines. 
 
## Syntax and semantics 
 
At the time of writing the pipeline operator is an ECMAScript proposal (still under development), so 
its exact syntax may change. The most widely discussed variant, sometimes called the "smart 
pipeline", allows two forms: 
 
1. **Bare function form** - When the right-hand side is an identifier, it must refer to a function. The 
pipeline operator calls that function with the value on the left as its only argument: 
 


---

 
482
   ```js 
   const triple = (x) => x * 3; 
   const value = 2 |> triple; // same as triple(2) 
   ``` 
 
2. **Topic reference form** - For more complex expressions, a special placeholder (often `#`) 
represents the value being piped. This lets you call functions that take more than one argument or 
access methods: 
 
   ```js 
   const result = 10 
     |> # + 1          // increment 
     |> Math.pow(#, 2) // square 
     |> (n) => n.toString(); 
   // result === "121" 
   ``` 
 
Each pipeline stage is evaluated one after the other. Unlike Unix pipes, the JavaScript pipeline 
operator does not automatically read from or write to streams; it simply passes values between 
functions. 
 
## Benefits of pipelines 
 
- **Readability:** Pipelines allow code to read from top to bottom, matching the order in which 
data flows through the functions. This reduces the cognitive overhead of nested parentheses. 
- **Composability:** Small functions become building blocks that can be chained together. This style 
is common in functional programming languages (F#, Elm) and libraries like Ramda or RxJS. 
- **Reduced boilerplate:** Without pipelines, you often create temporary variables to break up 
complex expressions. Piping reduces the need for temporary names and clarifies the transformation 
steps. 
- **Consistency with other features:** Pipelines pair well with arrow functions, optional chaining 
and pattern matching proposals, promoting a declarative style. 
 
## Practical examples 


---

 
483
 
### Transforming values 
 
Suppose you need to normalise a string by trimming whitespace, converting it to lowercase and 
replacing spaces with hyphens. Without pipelines, you might write: 
 
```js 
const normalise = (str) => replaceSpaces(toLowerCase(str.trim())); 
``` 
 
With the pipeline operator, each step becomes its own line: 
 
```js 
const normalise = (str) => 
  str 
    |> String.prototype.trim.call(#) 
    |> ((s) => s.toLowerCase()) 
    |> ((s) => s.replace(/\s+/g, '-')); 
``` 
 
This makes it clear that the input flows through trimming, lower-casing and replacing spaces. The 
`call` method is necessary because `trim` is a method, not a standalone function. Future versions of 
the proposal may allow a more ergonomic syntax for method calls. 
 
### Avoiding nested parentheses 
 
Pipelines particularly shine when composing many functions: 
 
```js 
// Without pipeline 
const result = decodeURIComponent(atob(data)).split(',').map(Number).reduce((a, b) => a + b, 0); 
 


---

 
484
// With pipeline 
const result = data 
  |> atob 
  |> decodeURIComponent 
  |> (#.split(',')) 
  |> (#.map(Number)) 
  |> ((arr) => arr.reduce((a, b) => a + b, 0)); 
``` 
 
Each step is isolated, and you can easily add `console.log()` calls between stages for debugging. 
 
## Status and considerations 
 
The pipeline operator is still in the proposal stage and not yet part of the ECMAScript standard. 
Different variations are under discussion, so the syntax may change before it is finalised. When using 
experimental language features, transpilers like Babel and TypeScript can compile pipelines down to 
supported JavaScript. 
 
Be mindful that pipeline operators are **not** magic performance boosters; they simply provide 
syntactic sugar. Each stage still creates a function call, so deeply chained pipelines could have a small 
overhead compared to a single dedicated function. 
 
## Real-world analogy 
 
Think of a pipeline like an assembly line in a factory. An unfinished product moves along a conveyor 
belt and stops at each station. At each stop, a worker performs a specific transformation (paints the 
part, attaches a piece, tests functionality) before sending it to the next station. Similarly, the pipeline 
operator sends a value through a series of functions, each of which transforms it slightly. 
 
## Practice questions 
 
1. **Theory:** What problem does the pipeline operator aim to solve when composing functions? 
How does the code read differently when using pipelines compared to nested function calls? 


---

 
485
2. **Theory:** Describe the two forms of the proposed pipeline operator. When do you need to use 
a topic reference placeholder? 
3. **Coding:** Rewrite the following expression using the pipeline operator (assume the operator 
and topic reference are supported): 
 
   ```js 
   const result = toTitleCase(removeStopWords(cleanText(rawString))); 
   ``` 
 
   where `cleanText`, `removeStopWords` and `toTitleCase` are functions. 
 
4. **Coding:** Use the pipeline operator to compute the mean of an array of numbers by chaining 
`Array.prototype.reduce()` and a function that divides by the array length. Compare the pipeline 
version to a traditional implementation. 
5. **Theory:** The pipeline operator proposal is still evolving. What are some considerations you 
should have before using it in production code? 
 
 
 


---

 
486
What is Array.prototype.groupBy and how is it used? 
# What is `groupBy` and how is it used? 
 
Grouping items is a common task: you might need to organise products by category, group students 
by grade, or partition events by month. Traditionally, you would reach for `Array.prototype.reduce()` 
or an external library like Lodash. The **grouping proposal** introduces built-in methods that make 
grouping more convenient and expressive. 
 
Although early drafts suggested adding a `groupBy` method directly on arrays, the current design 
provides two **static methods**: 
 
- `Object.groupBy(iterable, callback)` - Returns a plain object with string or symbol keys. 
- `Map.groupBy(iterable, callback)` - Returns a `Map` keyed by arbitrary values. 
 
Both methods take an iterable (such as an array) and a callback that returns a key for each element. 
Elements that return the same key are placed into the same group. 
 
## How `Object.groupBy()` works 
 
`Object.groupBy()` accepts two arguments: the iterable of values to group and a callback function. 
The callback is called once per element and should return a value that can be coerced into a property 
key (a string or a symbol). The returned object has one property for each unique key, mapping to an 
array of the corresponding elements. 
 
```js 
const inventory = [ 
  { name: "asparagus", type: "vegetables", quantity: 9 }, 
  { name: "bananas", type: "fruit", quantity: 5 }, 
  { name: "goat", type: "meat", quantity: 23 }, 
  { name: "cherries", type: "fruit", quantity: 12 }, 
  { name: "fish", type: "meat", quantity: 22 }, 
]; 
 


---

 
487
const byType = Object.groupBy(inventory, (item) => item.type); 
/* byType is: 
{ 
  vegetables: [ { name: 'asparagus', type: 'vegetables', quantity: 9 } ], 
  fruit:      [ { name: 'bananas', type: 'fruit', quantity: 5 }, 
                { name: 'cherries', type: 'fruit', quantity: 12 } ], 
  meat:       [ { name: 'goat', type: 'meat', quantity: 23 }, 
                { name: 'fish', type: 'meat', quantity: 22 } ] 
} 
*/ 
``` 
 
Because the returned object has a `null` prototype, it does not inherit methods like `toString()`—
reducing the risk of name collisions. Note that the grouped elements are the **same objects** as 
the ones in the original array; modifying a grouped element also modifies the original. 
 
If the callback returns values that are not strings or symbols (for example, numbers or booleans), 
they are coerced to strings when used as property keys. If you need to use arbitrary objects or values 
(like dates or complex objects) as keys, use `Map.groupBy()` instead. 
 
## How `Map.groupBy()` works 
 
`Map.groupBy()` works like `Object.groupBy()`, but instead of an object, it returns a `Map` where 
keys can be **any value**. This is useful when grouping by values that should not be coerced to 
strings. For example, you can group by a boolean or even a reference: 
 
```js 
const numbers = [5, 7, 8, 12, 15, 20]; 
const parity = Map.groupBy(numbers, (n) => n % 2 === 0); 
/* parity is a Map: 
  key: false → [5, 7, 15] 
  key: true  → [8, 12, 20] 
*/ 


---

 
488
 
const mapKey1 = {}; 
const mapKey2 = {}; 
const objects = [ 
  { key: mapKey1, value: 1 }, 
  { key: mapKey2, value: 2 }, 
  { key: mapKey1, value: 3 }, 
]; 
const grouped = Map.groupBy(objects, (obj) => obj.key); 
// grouped.get(mapKey1) → [ { key: mapKey1, value: 1 }, { key: mapKey1, value: 3 } ] 
// grouped.get(mapKey2) → [ { key: mapKey2, value: 2 } ] 
``` 
 
The keys in a `Map` preserve identity: two objects with the same content but different references will 
be treated as different keys. 
 
## Use cases and benefits 
 
- **Simpler grouping:** Grouping values used to involve writing a `reduce()` loop or using external 
libraries. `Object.groupBy()` and `Map.groupBy()` make the intent explicit and reduce boilerplate. 
- **Better type safety:** Group names are determined by the callback; you avoid accidental 
collisions with inherited object properties (because the returned object has a null prototype). 
- **Flexible keys:** `Map.groupBy()` lets you use any JavaScript value as a key, which is useful when 
grouping by booleans, dates or other non-string values. 
- **Readable code:** Grouping logic can now be expressed declaratively at the top level of your 
code instead of being buried in loops. 
 
## Comparison with a manual reducer 
 
Before these methods existed, you might have grouped values like this: 
 
```js 
function groupByManual(arr, getKey) { 


---

 
489
  return arr.reduce((groups, item) => { 
    const key = getKey(item); 
    (groups[key] = groups[key] || []).push(item); 
    return groups; 
  }, {}); 
} 
 
const byType = groupByManual(inventory, (item) => item.type); 
``` 
 
The built-in `Object.groupBy()` does the same job but improves readability and avoids mutating a 
pre-initialised accumulator. 
 
## Practice questions 
 
1. **Theory:** What is the difference between `Object.groupBy()` and `Map.groupBy()`? When 
would you choose one over the other? 
2. **Theory:** How does the grouping proposal handle property keys? Why does the object 
returned by `Object.groupBy()` have a `null` prototype? 
3. **Coding:** Use `Object.groupBy()` to group an array of words by their first letter. Show the 
resulting object. 
4. **Coding:** Given an array of transactions with a `date` property, use `Map.groupBy()` to group 
them by month (hint: use `new Date(tx.date).getMonth()` as the key). How could you achieve the 
same result without `Map.groupBy()`? 
5. **Theory:** What precautions should you take when grouping objects that may later be 
mutated? How do the grouping methods handle deep copies? 
 
 
 


---

 
490
What is the purpose of Symbol.dispose and the using 
statement proposal? 
# What is the purpose of `Symbol.dispose` and the `using` statement proposal? 
 
Resource management—opening and closing files, connecting to databases, acquiring locks—is a 
common source of bugs. In languages like C++ and Python, deterministic destruction (`RAII` / `with` 
statements) ensures resources are released when they go out of scope. JavaScript has historically 
lacked a built-in mechanism to automatically dispose of resources. The **explicit resource 
management** proposal introduces two new features to fill this gap: the **well-known symbol** 
`Symbol.dispose` (along with its asynchronous counterpart `Symbol.asyncDispose`) and the `using` 
statement. 
 
## Disposable objects 
 
An object is considered _disposable_ if it defines a method keyed by `Symbol.dispose`: 
 
```js 
class FileHandle { 
  constructor(name) { 
    this.name = name; 
    this.open = true; 
  } 
  read() { 
    if (!this.open) throw new Error("File is closed"); 
    /* ...read from file... */ 
  } 
  [Symbol.dispose]() { 
    // clean up resources here 
    console.log(`Closing ${this.name}`); 
    this.open = false; 
  } 
} 
``` 


---

 
491
 
The method must be synchronous and should perform any necessary cleanup. Calling it multiple 
times should not throw. For asynchronous resources (e.g. network sockets), define 
`[Symbol.asyncDispose]()` returning a promise. 
 
## The `using` declaration 
 
The `using` statement automatically calls an object's disposal method when the surrounding block is 
exited. It ensures that cleanup happens regardless of whether the block completes normally or due 
to an exception. Here is the previous `FileHandle` class used inside a `using` block: 
 
```js 
{ 
  using fh = new FileHandle('log.txt'); 
  fh.read(); 
  // leaving the block calls fh[Symbol.dispose]() 
} 
// logs "Closing log.txt" 
``` 
 
Because `Symbol.dispose` is looked up on the initializer of the `using` variable, any object that 
implements this symbol can participate. If the object also defines `[Symbol.asyncDispose]()`, you can 
use `await using` to wait for asynchronous cleanup: 
 
```js 
class Socket { 
  /* ... */ 
  async [Symbol.asyncDispose]() { 
    await this.closeConnection(); 
  } 
} 
 
async function sendRequest() { 


---

 
492
  await using sock = new Socket(); 
  await sock.send('hello'); 
} 
``` 
 
`await using` guarantees that disposal of asynchronous resources is awaited before control leaves the 
scope. 
 
## Why explicit resource management matters 
 
- **Reliability:** Without automatic disposal, it's easy to forget to close a file or release a lock—
leading to memory leaks, file descriptor exhaustion, or inconsistent state. 
- **Composability:** When functions encapsulate resource acquisition inside themselves, they 
obscure the cost and lifetimes of resources. `using` makes resource lifetimes explicit at the call site. 
- **Error safety:** By tying disposal to scope, even exceptions cannot bypass cleanup. The `using` 
syntax ensures deterministic finalisation, similar to `try...finally` but with less boilerplate. 
 
## Comparisons and pitfalls 
 
- **`try...finally`:** You can always manage resources with `try...finally`. The `using` statement is 
syntactic sugar that calls the appropriate disposal method for you. It reduces the risk of missing 
cleanup in error paths. 
- **One-time use:** `Symbol.dispose` should only be called by the runtime. Calling it manually will 
not prevent it from being called again at the end of the scope. 
- **Not widely supported:** As of 2025, explicit resource management is still a proposal. It is 
implemented in some environments (e.g. TypeScript has experimental support). Don't use it in 
production without a transpiler/polyfill. 
- **Cannot await synchronous dispose:** The `Symbol.dispose` method must be synchronous. Use 
`[Symbol.asyncDispose]()` and `await using` for asynchronous cleanup. 
 
## Real-world analogy 
 
Imagine borrowing a library book. When you finish reading, you should return it to avoid late fees 
and free the book for others. If you forget, the library eventually contacts you—similar to how 
garbage collection eventually frees memory but without releasing the library's copy. The `using` 
statement is like a policy that automatically returns the book when you leave the library. 


---

 
493
 
## Practice questions 
 
1. **Theory:** What methods must an object implement to participate in the `using` mechanism? 
How does `Symbol.dispose` differ from `Symbol.asyncDispose`? 
2. **Theory:** Explain how the `using` statement improves reliability compared to managing 
resources with `try...finally` or manually calling cleanup methods. 
3. **Coding:** Create a `Timer` class that starts measuring time in its constructor and prints the 
elapsed time in its `[Symbol.dispose]()` method. Use `using` to measure the duration of a code block. 
4. **Coding:** Implement an asynchronous database connection class with 
`[Symbol.asyncDispose]()` that closes the connection. Use `await using` inside an `async` function to 
ensure the connection is closed even if an error occurs. 
5. **Theory:** What potential issues might arise if you forget to declare `await using` for an object 
with an `[Symbol.asyncDispose]()` method? 
 
 
 


---

 
494
What is Error.cause — new error message cause — and 
when is it useful? 
# What is the `cause` property on errors and when is it useful? 
 
When something goes wrong deep inside your code, the error that bubbles up often lacks context. 
You might catch an error from a low-level function, wrap it with a higher-level message, and then 
lose the original exception. The `cause` property introduced in ES2022 solves this problem by letting 
you **chain errors together**. 
 
## Creating an error with a cause 
 
All built-in error constructors (like `Error`, `TypeError`, `RangeError`) accept an optional second 
argument: an options object with a `cause` property. You can pass the original error (or any other 
value) to this property. The new error stores the cause on its `.cause` property but otherwise 
behaves like a normal error. 
 
```js 
function parseSettings(json) { 
  try { 
    return JSON.parse(json); 
  } catch (err) { 
    // Add context and preserve the original error 
    throw new SyntaxError("Invalid configuration file", { cause: err }); 
  } 
} 
 
try { 
  parseSettings("not valid JSON"); 
} catch (err) { 
  console.error(err.message); // "Invalid configuration file" 
  console.error(err.cause.message); // "Unexpected token n in JSON at position 0" 
} 
``` 


---

 
495
 
In this example, the `cause` property holds the original `SyntaxError` thrown by `JSON.parse()`. When 
debugging, you can inspect `err.cause` to see what went wrong at the deeper level. 
 
## Error chaining across layers 
 
Suppose you have a function that reads a file and parses its contents. If reading fails, you want to 
know whether the error came from the file system or from parsing: 
 
```js 
const fs = require("fs/promises"); 
 
async function readConfig(path) { 
  try { 
    const data = await fs.readFile(path, "utf8"); 
    return JSON.parse(data); 
  } catch (err) { 
    throw new Error(`Failed to load configuration: ${path}`, { cause: err }); 
  } 
} 
 
readConfig("config.json").catch((err) => { 
  console.error(err.message); 
  // Walk the chain of causes 
  let current = err.cause; 
  while (current) { 
    console.error("caused by:", current); 
    current = current.cause; 
  } 
}); 
``` 
 


---

 
496
The `cause` property lets you build an error chain. Each error in the chain can store its own message 
and metadata while pointing to the lower-level error that triggered it. In Node.js, some APIs (such as 
`fs/promises`) already include useful causes when they throw. 
 
## When and why to use `cause` 
 
- **Add context:** When rethrowing an error, wrap it with a message describing what the 
higher-level operation was doing. The original error remains available via `.cause`. 
- **Preserve stack information:** Although the top-level error has its own stack trace, the cause 
retains its own stack trace and properties. This makes debugging easier than logging plain strings. 
- **Structured error handling:** Frameworks and logging libraries can inspect the error chain and 
present a hierarchical view of failures. 
- **Flexibility:** The `cause` property can hold any value—another error, a string, or a structured 
object. This allows creative uses such as attaching additional metadata. 
 
Be mindful that the `cause` property is not automatically printed when calling `console.error(err)`. 
You need to log it explicitly or use utilities that traverse causes. When creating custom error classes, 
pass the `cause` option to `super()` so that the base error stores it: 
 
```js 
class ValidationError extends Error { 
  constructor(message, options) { 
    super(message, options); 
    this.name = "ValidationError"; 
  } 
} 
 
try { 
  // Simulate a lower-level error 
  throw new Error("Field length exceeded"); 
} catch (e) { 
  throw new ValidationError("Invalid user input", { cause: e }); 
} 
``` 


---

 
497
 
## Real-world analogy 
 
Imagine a chain of customer service escalations. The frontline agent documents the issue and 
escalates it to a supervisor. The supervisor adds context ("customer attempted to reset password") 
and escalates further. Each step attaches additional information but references the previous record. 
When the issue is resolved, you can trace back through all notes to understand the root cause. The 
`cause` property plays a similar role: each layer adds context while preserving the underlying error. 
 
## Practice questions 
 
1. **Theory:** Why is it beneficial to include the original error as the `cause` when rethrowing an 
error? How does this improve debugging? 
2. **Theory:** What types of values can the `cause` property hold? What happens if you set `cause` 
to a non-error value? 
3. **Coding:** Write a function `fetchJson(url)` that fetches data from a URL and parses the 
response as JSON. If the fetch fails or the JSON is invalid, throw a new error with an appropriate 
message and set the original error as the `cause`. 
4. **Coding:** Create a custom error class `DatabaseError` that takes a `cause` option. Demonstrate 
catching a low-level error (e.g. connection timeout) and wrapping it in a `DatabaseError`. How would 
you traverse the chain of causes to log each error? 
5. **Theory:** Why doesn't logging an error automatically display its cause? How can you design a 
logging utility that prints the entire error chain? 
 
 
 


---

 
498
What are the phases of the event loop (timers, poll, 
check, close)? 
# What are the phases of the event loop (timers, poll, check, close)? 
 
JavaScript environments like browsers and Node.js are **single-threaded** at the language level, 
yet they can perform non-blocking I/O. This is achieved through an **event loop**: a mechanism 
that schedules and runs callbacks in a predictable order. While browsers and Node share the same 
high-level idea, Node's event loop exposes more phases. Understanding these phases helps you 
reason about callback ordering and avoid surprises when mixing timers, I/O and microtasks. 
 
## High-level overview 
 
The event loop continuously cycles through a set of **queues** and **phases**. In each cycle 
(often called a _tick_), it performs work in the following order: 
 
1. **Timers phase** - Executes callbacks scheduled by `setTimeout()` and `setInterval()` whose time 
has expired. 
2. **Pending callbacks** - Executes I/O callbacks deferred to the next loop iteration. 
3. **Idle, prepare** - Internal phases used by Node.js (not exposed to user code). 
4. **Poll phase** - Retrieves new I/O events (such as network or file events) and executes their 
callbacks. If there are no timers due and the poll queue is empty, this phase can block until I/O 
arrives. 
5. **Check phase** - Executes callbacks scheduled by `setImmediate()`. 
6. **Close callbacks** - Executes callbacks for closed resources, such as sockets whose `'close'` event 
is emitted. 
 
After the close callbacks phase completes, the event loop checks the **microtask queue**, runs all 
queued microtasks (e.g. promise callbacks via `.then()`, `queueMicrotask()`, `process.nextTick()` in 
Node) until it is empty, and then begins the next tick. 
 
### Timers phase 
 
The timers phase handles functions scheduled by `setTimeout()` and `setInterval()`. A timer is 
executed **once** when its delay has elapsed. If multiple timers expire at the same tick, they are 
executed in order of scheduling. Intervals (`setInterval()`) re-queue themselves after each execution. 


---

 
499
 
### Pending callbacks 
 
Some operating system operations, such as certain types of TCP errors, run their callbacks here. This 
phase is rarely used directly by JavaScript developers. 
 
### Poll phase 
 
The poll phase is responsible for retrieving new I/O events (e.g. data arriving on a network socket, 
file system events) and executing their callbacks. If the poll queue is empty, Node.js will either: 
 
- Block and wait for incoming I/O if there are no timers scheduled, or 
- Immediately proceed to the check phase if timers are due or the poll has been idle for a maximum 
timeout. 
 
This behaviour prevents the poll phase from **starving** the rest of the loop. Under the hood, the 
libuv library imposes a maximum blocking time so that other phases still get a chance to run. 
 
### Check phase 
 
Callbacks passed to `setImmediate()` execute in the check phase, **after** the poll phase and 
before closed resources are handled. Because `setImmediate()` always runs after the poll phase, it 
can be used to schedule work to happen after I/O events in the same tick. This distinguishes it from 
`setTimeout(fn, 0)`, which runs in the timers phase and may occur earlier. 
 
### Close callbacks phase 
 
When a stream or socket closes, Node emits a `'close'` event. Listeners attached to `'close'` fire in this 
phase. For example, closing a TCP socket triggers its `'close'` callback here. 
 
### Microtasks and next ticks 
 
Within each phase, after a callback runs, the runtime processes the microtask queue. Microtasks 
include: 


---

 
500
 
- **Promise callbacks:** `.then()`, `.catch()` and `.finally()` handlers. 
- **`queueMicrotask()` callbacks:** A way to enqueue microtasks manually. 
- **`process.nextTick()` callbacks (Node only):** Executed even before other microtasks and can 
starve the loop if misused. 
 
After all microtasks are processed, the event loop either continues with the current phase (if there 
are more callbacks) or moves on to the next phase. This guarantees that microtasks run _before_ the 
next macrotask (e.g. timer or I/O callback). 
 
## Illustrative example 
 
Consider the following Node.js code: 
 
```js 
setTimeout(() => { 
  console.log("timeout"); 
}, 0); 
 
setImmediate(() => { 
  console.log("immediate"); 
}); 
 
fs.readFile(__filename, () => { 
  console.log("file read"); 
}); 
 
Promise.resolve().then(() => { 
  console.log("promise"); 
}); 
 
process.nextTick(() => { 


---

 
501
  console.log("nextTick"); 
}); 
``` 
 
When this script runs: 
 
1. `process.nextTick()` executes immediately after the current operation finishes (`nextTick`). 
2. The resolved promise adds a microtask, which runs next (`promise`). 
3. I/O callbacks run in the poll phase (`file read`). 
4. `setImmediate()` callbacks run in the check phase (`immediate`). 
5. `setTimeout()` with 0 delay runs in the timers phase of the **next** tick (`timeout`). 
 
Actual ordering can vary if the file read finishes before the timer is ready, but microtasks (`nextTick` 
and `promise`) always run before any of the macrotasks. 
 
## Practice questions 
 
1. **Theory:** List the main phases of the Node.js event loop and briefly describe what happens in 
each phase. 
2. **Theory:** How does `setImmediate(fn)` differ from `setTimeout(fn, 0)` in terms of when their 
callbacks are executed? 
3. **Coding:** Write a Node.js script that uses `setTimeout`, `setImmediate`, 
`Promise.resolve().then`, and `fs.readFile()` to illustrate the order in which their callbacks run. 
Compare your output to the explanation in this section. 
4. **Theory:** What is the purpose of the poll phase's ability to block? How does libuv avoid 
starving the event loop when waiting for I/O? 
5. **Theory:** Explain the difference between microtasks (e.g. promise handlers, 
`queueMicrotask()`, `process.nextTick()`) and macrotasks (e.g. timer callbacks, I/O events). Why is it 
important that microtasks run after each macrotask? 
 
 
 


---

 
502
What is event-loop starvation and how can you prevent 
it? 
# What is event loop starvation and how can you prevent it? 
 
JavaScript's event loop allows your code to perform I/O and other asynchronous operations without 
blocking execution. However, it's possible for a program to hog the event loop so badly that other 
tasks never get a chance to run. This situation is called **event loop starvation** or **starving the 
event loop**. Understanding what causes starvation and how to prevent it will help you write 
responsive, non-blocking applications. 
 
## What is event loop starvation? 
 
The event loop cycles through macrotask queues (timers, I/O events, setImmediate, etc.) and the 
microtask queue (promise callbacks, `queueMicrotask()`, `process.nextTick()`). Event loop starvation 
occurs when code keeps the loop busy for too long, preventing other queued tasks from executing. 
Symptoms include: 
 
- User interfaces freezing because long-running JavaScript blocks re-rendering. 
- Network or file I/O callbacks delayed indefinitely. 
- High CPU usage with little progress on other tasks. 
 
There are two common causes of starvation: 
 
1. **Synchronous blocking loops:** A while loop that runs for seconds will block the event loop. 
During this time the browser cannot respond to user input, and Node.js cannot process incoming 
requests. 
 
   ```js 
   // Bad: blocks the event loop 
   function crunchNumbers() { 
     let sum = 0; 
     for (let i = 0; i < 1e10; i++) { 
       sum += i; 
     } 


---

 
503
     return sum; 
   } 
   crunchNumbers(); 
   // Nothing else runs until the loop finishes 
   ``` 
 
2. **Unbounded microtask queues:** Promise callbacks and `process.nextTick()` run after the 
current macrotask but before the next one. If you schedule more microtasks in each microtask, the 
loop can get stuck processing microtasks forever and never return to macrotasks or I/O. 
 
   ```js 
   function spinMicrotasks() { 
     Promise.resolve().then(spinMicrotasks); 
   } 
   spinMicrotasks(); 
   // The above code continually queues microtasks; timers and I/O starve 
   ``` 
 
In both cases, the CPU is busy executing JavaScript while other callbacks starve waiting for a chance 
to run. 
 
## How to prevent starvation 
 
1. **Break up long tasks:** Instead of doing all the work in one synchronous chunk, divide it into 
smaller pieces and schedule each piece with `setTimeout()` or `setImmediate()`. This yields control 
back to the event loop, allowing other tasks to run. 
 
   ```js 
   function crunchInChunks(start, end, chunkSize, callback) { 
     let sum = 0; 
     function processChunk(i) { 
       const max = Math.min(i + chunkSize, end); 
       for (; i < max; i++) { 


---

 
504
         sum += i; 
       } 
       if (max < end) { 
         setTimeout(() => processChunk(max), 0); // yield to event loop 
       } else { 
         callback(sum); 
       } 
     } 
     processChunk(start); 
   } 
   crunchInChunks(0, 1e7, 1e5, (result) => { 
     console.log("Sum:", result); 
   }); 
   ``` 
 
   By using `setTimeout(..., 0)`, the loop continues processing timers, I/O and microtasks between 
chunks. For Node.js-specific code, you can use `setImmediate()` to schedule the next chunk after the 
poll phase. 
 
2. **Limit microtask recursion:** Avoid recursive chains of promises that queue additional promises 
inside `.then()` callbacks or `queueMicrotask()`. If you need to process a large number of items with 
promises, batch them or use asynchronous loops that yield: 
 
   ```js 
   async function processItems(items) { 
     for (const item of items) { 
       await doAsyncWork(item); 
       // microtask queues drain between iterations 
     } 
   } 
   ``` 
 


---

 
505
   `await` yields control back to the event loop after each iteration, preventing microtask starvation. 
 
3. **Use workers for CPU-heavy tasks:** Modern browsers support Web Workers, and Node.js 
supports worker threads. Offload CPU-intensive computation to a worker so that the main event loop 
remains responsive. 
 
4. **Monitor and test:** Use performance profiling tools to detect long tasks and microtask churn. 
When debugging, sprinkle `console.log()` statements or timers to observe if certain callbacks aren't 
firing when expected. 
 
## Real-world analogy 
 
Imagine a single-lane bridge controlled by a traffic light. Cars (tasks) can cross only when the light is 
green. If one driver parks their car on the bridge and refuses to move, they block everyone behind 
them—this is like a blocking loop. Alternatively, if a stream of endless motorcycles (microtasks) keeps 
the light green for themselves, cars waiting at the other side can never cross. Preventing event loop 
starvation means ensuring everyone gets a fair turn. 
 
## Practice questions 
 
1. **Theory:** What is event loop starvation? Describe two common scenarios that can lead to it. 
2. **Theory:** Why does scheduling microtasks recursively cause starvation? How are microtasks 
prioritised relative to macrotasks? 
3. **Coding:** Modify the `crunchNumbers()` function to compute the sum of 1..1e8 without 
blocking the event loop. Use either `setTimeout()` or `setImmediate()` to yield between chunks and 
measure how it affects responsiveness. 
4. **Coding:** Write code that creates an unbounded microtask chain using promises. Run it and 
observe how it affects the execution of a `setTimeout(() => console.log('timeout'), 0)` call. Then fix 
the program by batching work with an asynchronous loop. 
5. **Theory:** Explain how Web Workers (in browsers) or worker threads (in Node.js) help prevent 
event loop starvation when performing heavy computations. 
 
 
 


---

 
506
What is requestIdleCallback and when should you use 
it? 
# What is `requestIdleCallback()` and when should you use it? 
 
Web applications often need to perform work that isn't critical to the next frame: analytics, 
preloading data, cleaning caches, or other housekeeping tasks. Running these tasks on the main 
thread at the wrong time can cause visible **jank**, resulting in dropped frames or delayed input. 
The **`requestIdleCallback()`** API allows you to schedule non-urgent work to run during periods 
when the browser is idle. 
 
## How it works 
 
`requestIdleCallback(callback, options?)` tells the browser, "call this function when you have spare 
time." The browser schedules the callback at a point when it's not busy handling user input, layout, 
or rendering. When the callback runs, it receives an **`IdleDeadline`** object that provides two 
methods: 
 
- `timeRemaining()` - Returns the estimated number of milliseconds remaining before the browser 
needs to yield to high-priority work. You can check this inside your callback and split your work into 
chunks if it runs long. 
- `didTimeout` - Indicates whether the callback is running because a timeout specified in 
`options.timeout` expired. If you provide a timeout, the browser guarantees that the callback will run 
within that many milliseconds, even if the tab isn't idle. 
 
For example: 
 
```js 
function heavyTask(deadline) { 
  while (deadline.timeRemaining() > 0 && tasks.length > 0) { 
    const task = tasks.shift(); 
    // perform a small piece of work 
    process(task); 
  } 
  if (tasks.length > 0) { 


---

 
507
    requestIdleCallback(heavyTask); // schedule next chunk 
  } 
} 
requestIdleCallback(heavyTask); 
``` 
 
In this pattern, you repeatedly process items until the deadline runs out. If work remains, you 
schedule another idle callback. This keeps the main thread responsive while eventually finishing all 
tasks. 
 
## When to use it 
 
Use `requestIdleCallback()` for tasks that: 
 
- **Are low priority:** analytics, reporting, warm caches, or non-critical UI updates. 
- **Can be broken into small chunks:** if your work needs more time than a single idle period, split 
it across multiple calls. 
- **Don't need to run on every frame:** animation and layout should use 
`requestAnimationFrame()` instead. 
 
Avoid using `requestIdleCallback()` for tasks that must run at specific times (e.g. right before paint) or 
require deterministic timing. Because idle time is unpredictable, your callback might run sooner or 
later depending on user interactions and system load. 
 
## Browser support and fallbacks 
 
`requestIdleCallback()` is available in Chromium-based browsers and some versions of Firefox, but 
not universally supported. To use it safely, provide a fallback to `setTimeout()` so that your code still 
runs after a reasonable delay: 
 
```js 
const scheduleIdleTask = 
  window.requestIdleCallback || 
  function (cb) { 


---

 
508
    // Run the callback after 200 ms if requestIdleCallback isn't available 
    return setTimeout( 
      () => cb({ timeRemaining: () => 0, didTimeout: true }), 
      200 
    ); 
  }; 
 
const cancelIdleTask = window.cancelIdleCallback || clearTimeout; 
``` 
 
With this fallback, older browsers will execute your idle tasks after a small delay instead of waiting for 
a true idle period. 
 
## Real-world analogy 
 
Imagine an office worker who needs to file some paperwork but also answers the phone and greets 
visitors. Filing is important but not urgent. The worker does it during lulls between phone calls and 
walk-ins, stopping whenever someone needs attention. Likewise, `requestIdleCallback()` lets the 
browser handle non-urgent tasks without disrupting critical user interactions. 
 
## Practice questions 
 
1. **Theory:** What kinds of tasks are good candidates for `requestIdleCallback()`? Why shouldn't 
you use it for animation or layout work? 
2. **Theory:** Describe the purpose of the `IdleDeadline` object. How can you use 
`timeRemaining()` and `didTimeout` to split work into chunks? 
3. **Coding:** Implement a polyfill for `requestIdleCallback()` using `setTimeout()`. Then write a 
function that processes an array of 100,000 items during idle periods without freezing the UI. 
4. **Coding:** Use `requestIdleCallback()` to prefetch a list of images when the page is idle. Include 
a timeout so the prefetching still occurs if the browser never goes idle. 
5. **Theory:** What happens if you schedule an idle callback with no timeout and the tab remains 
busy? How might you mitigate that situation? 
 
 
 


---

 
509
How do garbage collection triggers and mark-and-
sweep impact performance? 
# How do garbage collection triggers and mark-and-sweep impact performance? 
 
JavaScript frees memory automatically through **garbage collection** (GC). While automatic 
memory management saves developers from calling `free()`, it isn't free of cost. Understanding what 
triggers GC and how the **mark-and-sweep** algorithm works can help you write code that 
performs better and avoids unexpected pauses. 
 
## What triggers garbage collection? 
 
In most JavaScript engines, you cannot explicitly invoke garbage collection (though some hosts 
provide debugging APIs). Instead, the runtime decides when to run GC based on heuristics: 
 
- **Allocation thresholds:** When a certain number of objects have been allocated or a memory 
threshold is reached, the engine schedules a GC cycle to reclaim space. 
- **Memory pressure:** If there isn't enough free memory to satisfy new allocations, the engine 
immediately runs GC. This often happens on devices with limited RAM. 
- **Idle periods:** Modern engines run incremental collection during idle times to reduce pauses. 
For example, a browser might perform some marking work between frames. 
- **Generational heuristics:** Many engines divide objects into "young" and "old" generations. 
Short-lived objects (like those inside a function) are collected more frequently (minor GC), while 
long-lived objects trigger less frequent but more expensive major collections. 
 
You cannot predict exactly when GC will run, but you can influence how often it runs by controlling 
how many objects you create and how long you retain them. 
 
## The mark-and-sweep algorithm 
 
The classic GC algorithm used in JavaScript engines is **mark-and-sweep**. It runs in two phases: 
 
1. **Mark phase:** Starting from a set of _roots_ (global variables, the call stack, closures), the 
collector recursively **marks** all objects reachable through references. Reachable objects are 
considered "live". 


---

 
510
2. **Sweep phase:** The collector then scans the heap and **sweeps away** any objects that 
weren't marked. These unreachable objects are reclaimed and their memory becomes available for 
future allocations. 
 
Modern collectors add variations such as **generational** (separate young and old generations), 
**incremental** (break GC into small chunks), and **concurrent** (perform work on a background 
thread) collection. These techniques reduce the duration of "stop-the-world" pauses where the 
entire JavaScript thread is halted. 
 
## Impact on performance 
 
Garbage collection can impact your program in two ways: 
 
1. **Pause times (jank):** During a GC cycle, the engine may stop executing JavaScript to safely 
traverse and modify memory. Long GC pauses can cause animations to stutter or block user input. 
Minor collections are usually fast, but major collections can cause noticeable pauses. 
2. **CPU usage:** Marking and sweeping take CPU time. If your code creates many short-lived 
objects (for example, allocating new arrays inside a tight loop), the GC may run frequently, 
consuming cycles that could be used for application logic. 
 
### Example: allocation patterns 
 
Creating a large number of objects in a loop can trigger frequent minor collections: 
 
```js 
function allocateMany() { 
  const arr = []; 
  for (let i = 0; i < 100000; i++) { 
    arr.push({ index: i }); 
  } 
  return arr; 
} 
// Each object becomes a candidate for GC once arr goes out of scope 
``` 


---

 
511
 
If `allocateMany()` is called repeatedly, the engine may interleave your code with GC cycles, slowing 
down the overall throughput. 
 
## Mitigating GC overhead 
 
While you cannot stop GC, you can write code that makes it less intrusive: 
 
- **Reuse objects:** Instead of creating new objects inside loops, reuse existing ones where 
possible. This reduces allocation pressure. 
- **Avoid retaining unnecessary references:** Let references go out of scope when you're done. 
Storing objects in global variables or long-lived closures prevents them from being collected. 
- **Be careful with large data structures:** Holding onto large arrays or Maps can delay GC. Clear 
them (`array.length = 0` or `map.clear()`) when you're finished. 
- **Prefer primitives and typed arrays:** Plain numbers, strings and typed arrays are simpler for the 
engine to manage than nested object graphs. 
- **Use `WeakMap` and `WeakSet` for caches:** Weak collections hold references that do not 
prevent objects from being collected, which is useful for memoisation caches. 
- **Measure memory usage:** Browser developer tools and Node's `--inspect` flag provide memory 
profiling to identify leaks and high allocation sites. Use them to verify that your changes reduce GC 
overhead. 
 
## Real-world analogy 
 
Imagine your house's cleaning service. The cleaners show up when the place is cluttered, stop 
everything, and tidy up. If you accumulate clutter quickly by buying things and never throwing 
anything away, the cleaners have to come more often, interrupting your routine. By buying less and 
discarding what you don't need, you reduce the frequency and duration of cleanings. Similarly, 
controlling allocations and releasing references reduces GC interruptions. 
 
## Practice questions 
 
1. **Theory:** Explain the two phases of the mark-and-sweep algorithm. Why does the collector 
need to stop executing JavaScript code during certain parts of the process? 
2. **Theory:** What are generational garbage collectors, and how do they improve performance 
compared to a single heap? 


---

 
512
3. **Coding:** Write a function that allocates a large number of objects inside a loop. Use 
performance tools to observe how GC frequency changes when you reuse a single object instead. 
4. **Theory:** Name three things you can do in your code to reduce the frequency of garbage 
collection cycles. 
5. **Coding:** Implement a simple cache using `WeakMap` to store the results of an expensive 
function. Explain how using `WeakMap` helps with memory management. 
 
 
 


---

 
513
What causes detached DOM node memory leaks and 
how to avoid them? 
# What causes detached DOM node memory leaks and how to avoid them? 
 
Memory leaks occur when your application stores references to objects longer than necessary, 
preventing the garbage collector from reclaiming them. In web applications, a common source of 
leaks is **detached DOM nodes**: elements that have been removed from the page but are still 
referenced by JavaScript. 
 
## What are detached DOM nodes? 
 
A **detached node** is an element that exists in memory but is no longer part of the document's 
active tree. This can happen if you remove an element from the DOM (for example, calling 
`element.remove()` or `parent.innerHTML = ''`) but keep a reference to it in a variable, array or 
closure. Because the garbage collector sees the reference, it considers the node reachable and 
doesn't free the memory associated with it. 
 
Over time, detached nodes accumulate and consume memory, leading to degraded performance, 
especially on long-running pages like single-page applications. 
 
## Common causes 
 
1. **Storing DOM references globally:** Assigning elements to global variables, object properties, 
or arrays and never clearing them can keep nodes alive after they are removed from the DOM. 
 
   ```js 
   // Bad: storing removed nodes in an array 
   const cachedItems = []; 
   function addItem() { 
     const item = document.createElement("li"); 
     item.textContent = "Item"; 
     document.body.appendChild(item); 
     cachedItems.push(item); 
     // Later, remove the item from the DOM 


---

 
514
     item.remove(); 
     // item remains in cachedItems and cannot be collected 
   } 
   ``` 
 
2. **Unremoved event listeners:** Adding an event listener to an element creates a reference from 
the event loop to that element via the closure that contains the callback. If you remove the element 
but never call `element.removeEventListener()`, the reference chain may keep it alive. 
 
3. **Closures capturing DOM nodes:** Functions that enclose DOM variables can keep them alive 
even after removal. If you store such functions or pass them around, the enclosed nodes persist. 
 
4. **Framework bugs:** Complex UI libraries may sometimes retain references to removed 
components due to internal caches or subscriptions. 
 
## Strategies to avoid detached node leaks 
 
- **Remove references:** Set your references to `null` or `undefined` when the node is no longer 
needed. For collections, call `.splice()` or `.clear()`. 
- **Use event delegation:** Attach listeners to a common ancestor instead of individual elements. 
This reduces the number of listeners and avoids attaching callbacks directly to soon-to-be-removed 
elements. 
- **Detach event listeners:** Always call `element.removeEventListener()` before removing an 
element. For class-based components, clean up listeners in a `destroy` or `unmount` method. 
- **Weak references:** Use `WeakMap` or `WeakRef` to store metadata or caches keyed by 
elements. Weak references do not prevent the target from being collected. 
- **Avoid storing DOM nodes globally:** If you need to cache values, store only data (like IDs or 
attributes) rather than element references. 
- **Monitor memory:** Use browser developer tools (Performance or Memory panels) to identify 
detached nodes. Many tools highlight detached DOM trees and allow you to track their references. 
 
### Example: fixing a leak 
 
```js 
const items = []; 


---

 
515
function addAndRemove() { 
  const el = document.createElement("div"); 
  el.textContent = "Hello"; 
  document.body.appendChild(el); 
  // simulate some work 
  setTimeout(() => { 
    el.remove(); 
    // fix: remove references 
    const idx = items.indexOf(el); 
    if (idx !== -1) items.splice(idx, 1); 
  }, 1000); 
  items.push(el); 
} 
``` 
 
Alternatively, use a `WeakSet` so that removed elements don't prevent collection: 
 
```js 
const items = new WeakSet(); 
function addAndRemove() { 
  const el = document.createElement("div"); 
  document.body.appendChild(el); 
  items.add(el); 
  setTimeout(() => { 
    el.remove(); 
    // no need to delete from WeakSet 
  }, 1000); 
} 
``` 
 
## Real-world analogy 


---

 
516
 
Imagine removing an old piece of furniture from your living room but leaving a note in your home 
inventory that it's still there. Every time you move or clean, you think the furniture exists and allocate 
space for it. The physical item is gone, but because your records say otherwise, you never free the 
space. Clearing or updating your inventory is like clearing references to detached DOM nodes. 
 
## Practice questions 
 
1. **Theory:** What is a detached DOM node? How do references in your JavaScript code prevent it 
from being garbage-collected? 
2. **Theory:** Why are unremoved event listeners a common source of memory leaks? How does 
event delegation help? 
3. **Coding:** Write a function that creates a list of 1,000 `<li>` elements and then removes them. 
Use browser dev tools to verify whether any detached nodes remain. Modify the function to ensure 
that no leaks occur. 
4. **Coding:** Refactor a component that caches DOM nodes in an array to instead use a 
`WeakMap` keyed by the node's ID. Explain why this prevents memory leaks. 
5. **Theory:** Besides detached nodes, what other patterns can cause memory leaks in web 
applications? How would you identify them? 
 
 
 


---

 
517
What is the difference between microtasks, macrotasks, 
and animation frames? 
# What is the difference between microtasks, macrotasks and animation frames? 
 
JavaScript executes code through an **event loop** that processes different kinds of tasks. 
Understanding the distinction between **microtasks**, **macrotasks** and **animation frames** 
helps you choose the right scheduling API and predict execution order. 
 
## Macrotasks (tasks) 
 
Macrotasks are the basic units of work in the event loop. They include: 
 
- Callbacks scheduled with `setTimeout()` and `setInterval()`. 
- I/O events (network, file system). 
- `setImmediate()` (Node.js). 
- User interactions (clicks, keypresses, etc.). 
 
When the event loop dequeues a macrotask, it executes it from start to finish. After the macrotask 
completes, the browser drains the microtask queue (see below) and then may paint a frame. Each 
macrotask is also called a **tick**. 
 
## Microtasks 
 
Microtasks are higher-priority callbacks that run **after the current macrotask but before the next 
one**. They allow fine-grained scheduling so that state updates can occur before the browser 
performs any rendering or the next event is handled. Examples include: 
 
- **Promise** callbacks attached via `.then()`, `.catch()` or `.finally()`. 
- **`queueMicrotask(callback)`:** a way to enqueue a microtask manually. 
- **MutationObserver** callbacks (in browsers). 
- **`process.nextTick()`** (in Node.js), which runs even before other microtasks. 
 


---

 
518
Microtasks are executed in order until the queue is empty. If a microtask schedules more microtasks, 
they run immediately after, which can starve the event loop if not used carefully. 
 
## Animation frames 
 
`requestAnimationFrame(callback)` schedules a function to run **right before the next repaint**. 
Browsers typically aim for 60 frames per second, so animation frame callbacks run about every 
16 ms. The callback receives a timestamp and is executed after the microtask queue is empty but 
before painting. Use animation frames for smooth animations and layout reads/writes that should 
occur once per frame. 
 
`requestAnimationFrame()` is neither a microtask nor a regular macrotask; it's part of the browser's 
rendering pipeline. If the page is in the background or hidden, the browser may throttle or stop 
calling animation frame callbacks to save resources. 
 
## Execution order 
 
During each tick of the event loop: 
 
1. A macrotask is taken from the queue and executed. 
2. Once the macrotask finishes, **all microtasks** are processed in order. 
3. The browser may perform layout and paint. 
4. If there's a pending animation frame and it's time to render, the browser calls the 
`requestAnimationFrame()` callbacks. 
5. The loop proceeds to the next macrotask. 
 
### Example 
 
```js 
console.log("start"); 
 
setTimeout(() => console.log("timeout"), 0); 
 
Promise.resolve().then(() => { 


---

 
519
  console.log("promise"); 
  queueMicrotask(() => console.log("microtask")); 
}); 
 
requestAnimationFrame(() => console.log("animation frame")); 
 
console.log("end"); 
``` 
 
Possible output (exact order can vary slightly across environments, but the sequence of categories is 
consistent): 
 
``` 
start 
end 
promise 
microtask 
animation frame 
timeout 
``` 
 
Explanation: 
 
1. The synchronous code (`start`, `end`) runs immediately. 
2. The promise callback is a microtask and runs after the current macrotask. 
3. Within the promise, another microtask is queued and runs right away. 
4. Next, before rendering, `requestAnimationFrame()` runs. 
5. Finally, `setTimeout(..., 0)` runs on the next macrotask. 
 
## Choosing the right scheduler 
 


---

 
520
- **Microtasks (`queueMicrotask`, promises):** Use for short, high-priority work that must run 
before the browser paints, such as updating component state after a DOM event handler. Don't 
schedule long loops here or you might block rendering. 
- **Macrotasks (`setTimeout`, `setInterval`, I/O callbacks):** Use for tasks that can wait until after 
rendering, such as logging, analytics, or deferring heavy computations. 
- **Animation frames (`requestAnimationFrame`):** Use for work that coordinates with the next 
frame—reading layout, updating CSS transforms, performing animations. The callback runs only 
when the browser is ready to paint, ensuring smooth motion. 
 
## Practice questions 
 
1. **Theory:** Explain the difference between a microtask and a macrotask. Why do microtasks run 
before the next event loop tick? 
2. **Theory:** Where does `requestAnimationFrame()` fit in the event loop relative to microtasks 
and macrotasks? What happens if the page is hidden? 
3. **Coding:** Write code that schedules a `setTimeout()`, a resolved promise, and a 
`requestAnimationFrame()` call. Use `console.log()` statements to observe the order of execution. 
4. **Coding:** Refactor an animation that uses `setTimeout()` into one that uses 
`requestAnimationFrame()`. Why does the latter produce smoother motion? 
5. **Theory:** What problems can occur if you queue too many microtasks? How can you prevent 
microtask starvation? 
 
 
 


---

 
521
How do Performance.now and PerformanceObserver 
help in profiling? 
# How do `performance.now()` and `PerformanceObserver` help in profiling? 
 
Measuring the performance of your JavaScript code often requires more precision than `Date.now()` 
can provide. The **Performance API** exposes high-resolution timestamps and tools for collecting 
timing data, enabling developers to profile code and identify bottlenecks. Two key pieces of this API 
are `performance.now()` and the `PerformanceObserver` interface. 
 
## `performance.now()` - high-resolution timing 
 
`performance.now()` returns a **DOMHighResTimeStamp**, a floating-point number representing 
the number of milliseconds elapsed since a performance "time origin" (typically when the page was 
created). Unlike `Date.now()`, which has millisecond resolution and can be affected by system clock 
changes, `performance.now()` provides sub-millisecond resolution and monotonically increasing 
values. 
 
Example: measuring the duration of a function call: 
 
```js 
const t0 = performance.now(); 
doHeavyComputation(); 
const t1 = performance.now(); 
console.log(`Heavy computation took ${t1 - t0} ms`); 
``` 
 
You can use `performance.now()` multiple times to measure different parts of your code. The high 
resolution helps detect even small performance regressions. 
 
## User marks and measures 
 
The Performance API also allows you to create **marks** and **measures**: 
 


---

 
522
- `performance.mark(name)`: records a timestamp with a given name. 
- `performance.measure(name, startMark, endMark)`: records the duration between two marks. 
 
For example, to measure how long it takes to fetch data: 
 
```js 
performance.mark("fetch-start"); 
const response = await fetch("/api/data"); 
performance.mark("fetch-end"); 
performance.measure("fetch", "fetch-start", "fetch-end"); 
 
const entries = performance.getEntriesByType("measure"); 
const fetchEntry = entries.find((e) => e.name === "fetch"); 
console.log(`Fetch took ${fetchEntry.duration} ms`); 
``` 
 
You can view these entries in the browser's performance tooling or access them programmatically. 
 
## Observing performance entries with `PerformanceObserver` 
 
`PerformanceObserver` lets you subscribe to performance entry events as they happen. You create 
an observer with a callback that receives a list of new entries. The callback runs asynchronously, but 
you can specify `buffered: true` to receive past entries as well. 
 
```js 
const obs = new PerformanceObserver((list) => { 
  for (const entry of list.getEntries()) { 
    console.log(entry.name, entry.entryType, entry.duration); 
  } 
}); 
 
obs.observe({ type: "measure", buffered: true }); 


---

 
523
// Now whenever performance.measure() is called, the observer callback logs the entry 
``` 
 
You can observe different types of entries: 
 
- **`resource`**: network requests (images, scripts, stylesheets). 
- **`paint`**: first paint and first contentful paint. 
- **`longtask`**: tasks that block the event loop for more than 50 ms, recorded by the Long Tasks 
API. 
- **`measure`**, **`mark`**, **`navigation`**, etc. 
 
This makes `PerformanceObserver` a powerful tool for monitoring your application in real time and 
integrating performance metrics into your logging or analytics systems. 
 
## Practical use cases 
 
1. **Profiling code sections:** Use `performance.now()` or marks/measures to time how long 
certain functions or operations take. This helps identify slow code paths. 
2. **Monitoring page load:** Observe `navigation` and `paint` entries to see when the page started 
loading and when it rendered meaningful content (First Contentful Paint). 
3. **Detecting long tasks:** Observe `longtask` entries to find parts of your code that block the 
event loop. Breaking long tasks into smaller chunks can improve responsiveness. 
4. **Custom metrics:** Define your own marks and measures around user interactions or API calls. 
Send these metrics to your analytics endpoint to monitor performance in production. 
 
## Real-world analogy 
 
`performance.now()` is like using a stopwatch with microsecond precision instead of a wall clock. The 
`PerformanceObserver` is like having a reporter who notes every milestone during a race—start, 
halfway, finish—and hands you a detailed timeline at the end. With these tools, you can confidently 
optimise your application. 
 
## Practice questions 
 


---

 
524
1. **Theory:** Why is `performance.now()` preferred over `Date.now()` for measuring short time 
intervals? What characteristics make it more suitable? 
2. **Theory:** Explain the difference between `performance.mark()` and `performance.measure()`. 
How are they used together? 
3. **Coding:** Use marks and measures to time how long it takes to sort a large array of random 
numbers. Log the duration using a `PerformanceObserver`. 
4. **Coding:** Observe `longtask` entries with `PerformanceObserver` and write code that 
intentionally blocks the event loop for 200 ms. Verify that a long task entry is recorded. 
5. **Theory:** How can you integrate performance metrics collected via `PerformanceObserver` 
into your application's analytics or monitoring dashboard? 
 
 
 


---

 
525
What is the difference between queueMicrotask, 
setTimeout, and requestAnimationFrame? 
# What is the difference between `queueMicrotask`, `setTimeout` and `requestAnimationFrame`? 
 
JavaScript offers several ways to schedule callbacks. Choosing the right one requires understanding 
how they interact with the event loop and rendering pipeline. Here's how `queueMicrotask()`, 
`setTimeout()` and `requestAnimationFrame()` differ. 
 
## `queueMicrotask(callback)` 
 
`queueMicrotask()` schedules a function to run **at the end of the current macrotask**, after the 
current call stack unwinds but before the browser or Node processes the next event. It adds the 
callback to the **microtask queue**, alongside resolved promise callbacks and `MutationObserver` 
notifications. 
 
Microtasks run in **FIFO** order and are executed continuously until the queue is empty. Because 
they run before the next render, microtasks are ideal for small, immediate updates (e.g. updating 
component state) that should happen before the user sees the result. However, you must not queue 
heavy loops here or you risk starving the event loop. 
 
Example: 
 
```js 
console.log("start"); 
queueMicrotask(() => console.log("microtask")); 
console.log("end"); 
// Output: start, end, microtask 
``` 
 
## `setTimeout(callback, delay)` 
 
`setTimeout()` schedules a **macrotask**. The callback runs after at least the specified delay (in 
milliseconds) has elapsed. Even `0` doesn't guarantee immediate execution; the callback will run on 
the next tick after all current microtasks and rendering are done. 


---

 
526
 
Use `setTimeout()` to defer work until after the browser repaints or to break large tasks into smaller 
pieces. Timers have a minimum clamping delay (usually 1-4 ms) in modern browsers and may be 
throttled in background tabs. 
 
```js 
setTimeout(() => console.log("timeout"), 0); 
Promise.resolve().then(() => console.log("promise")); 
// Output: promise, timeout 
``` 
 
## `requestAnimationFrame(callback)` 
 
`requestAnimationFrame()` schedules a callback to run **just before the next repaint**. The 
browser passes a timestamp to the callback, which you can use to synchronise animations. The 
callback is executed after the microtask queue is empty but before painting. If the page is hidden, 
many browsers throttle or suspend rAF callbacks to conserve resources. 
 
Use rAF for any code that updates animations, reads layout, or writes styles. Scheduling animation 
code here ensures it runs at the right time for smooth visuals. 
 
```js 
requestAnimationFrame((timestamp) => { 
  // Update position based on timestamp 
  box.style.transform = `translateX(${timestamp / 10}px)`; 
}); 
``` 
 
## Putting it all together 
 
Consider the following: 
 
```js 


---

 
527
queueMicrotask(() => console.log("microtask")); 
setTimeout(() => console.log("timeout"), 0); 
requestAnimationFrame(() => console.log("raf")); 
``` 
 
Possible output: 
 
``` 
microtask 
raf 
timeout 
``` 
 
Explanation: 
 
1. The microtask runs first because it is scheduled at the end of the current task. 
2. On the next tick, before painting, the browser invokes the rAF callback. 
3. Finally, the timer callback runs. Since its delay is 0, it fires on the next event loop iteration after 
microtasks and rAF. 
 
## Choosing between them 
 
| Method                    | When it runs                                    | Typical use 
cases                                                 | 
| ------------------------- | ----------------------------------------------- | -----------------------------------------------------
------------ | 
| `queueMicrotask()`        | After the current call stack, before rendering  | Updating state that must 
occur immediately, chaining promises     | 
| `setTimeout()`            | In a future macrotask, after a delay            | Deferring work, throttling or 
debouncing, breaking up heavy tasks | 
| `requestAnimationFrame()` | Before the next repaint, synced with frame rate | Animations, 
reading/writing layout, smooth UI updates             | 
 


---

 
528
Remember that microtasks should be short and non-blocking. If you need to schedule heavy 
computation, split it with `setTimeout()` or `setImmediate()`. Use rAF to coordinate with the 
browser's rendering loop. 
 
## Practice questions 
 
1. **Theory:** How does `queueMicrotask()` differ from `setTimeout(fn, 0)` in terms of when the 
callback runs? 
2. **Theory:** Why is `requestAnimationFrame()` better suited for animations than `setTimeout()` 
or `setInterval()`? 
3. **Coding:** Write code that logs messages scheduled with `queueMicrotask()`, a resolved 
promise, `setTimeout(fn, 0)`, and `requestAnimationFrame()`. Observe the order of execution in your 
browser. 
4. **Coding:** Use `requestAnimationFrame()` to animate an element smoothly across the screen. 
Then modify the code to use `setTimeout()` instead and compare the smoothness. 
5. **Theory:** What precautions should you take when scheduling microtasks to avoid starving the 
event loop? How can you break large microtasks into smaller chunks? 
 
 
 


---

 
529
How do hidden classes and inline caching affect JS 
performance internally? 
# How do hidden classes and inline caching affect JavaScript performance internally? 
 
JavaScript is a dynamic language: objects can have properties added and removed at any time, and 
property names are strings. Yet modern engines like V8 execute property access at speeds 
comparable to statically typed languages. Two key techniques make this possible: **hidden 
classes** and **inline caching**. 
 
## Hidden classes 
 
When you create an object, the engine internally assigns it a **hidden class** (also called a _shape_ 
or _map_). A hidden class describes the layout of the object's properties—what properties it has and 
in what order they were added. This allows the engine to determine the memory offsets of 
properties and access them quickly. 
 
Consider the following constructor: 
 
```js 
function Person(name, age) { 
  this.name = name; 
  this.age = age; 
} 
const alice = new Person("Alice", 30); 
const bob = new Person("Bob", 25); 
``` 
 
Both `alice` and `bob` share the same hidden class because the same properties are added in the 
same order. The engine can treat them like instances of a "class" with known offsets for `name` and 
`age`. Accessing `alice.age` becomes a simple offset lookup instead of a hash table search. 
 
However, if you add a new property after creation, the engine creates a new hidden class: 
 


---

 
530
```js 
alice.location = "NYC"; 
``` 
 
Now `alice` has a different hidden class from `bob`, and property access on one cannot use the 
assumptions made for the other. Similarly, adding properties in different orders (`obj.a = 1; obj.b = 2` 
vs `obj.b = 2; obj.a = 1`) yields different shapes. Frequent shape changes inhibit optimisation. 
 
**Best practices for shape stability:** 
 
- Initialise all properties in the constructor or object literal to keep objects sharing the same shape. 
- Avoid adding or deleting properties after creation. Instead, set unused properties to `null` to 
preserve the shape. 
- Use classes or factory functions consistently so that similar objects follow the same property order. 
 
## Inline caching 
 
Even with hidden classes, property lookup still requires checking the object's class and then 
calculating the offset. **Inline caching (IC)** speeds up repeated property accesses by caching the 
location of a property for a given hidden class directly in the machine code. 
 
When the engine first executes `obj.foo`, it doesn't know the hidden class of `obj`. It generates a 
**monomorphic inline cache** that records the hidden class encountered and the offset of `foo`. 
The next time it sees `obj.foo` with an object of the same class, it skips lookup and reads the 
property directly. If it later encounters an object with a different class, the inline cache becomes 
**polymorphic** and stores multiple class-offset pairs. Too many shapes can degrade performance 
and cause the engine to fall back to slower generic lookup. 
 
Inline caches are also used for method calls (`obj.method()`), array indexing, and binary operators. 
They allow the engine to optimise dynamic code by specialising for the most common types it sees. 
 
## Impact on performance 
 
Hidden classes and inline caching turn dynamic property access into predictable, fast operations. 
When your code uses consistent object shapes and avoids shape changes, the engine can generate 
optimised machine code that performs at near-native speed. In contrast, code that adds properties 


---

 
531
dynamically or stores heterogeneous objects in arrays may force the engine into megamorphic inline 
caches, reducing optimisation opportunities. 
 
### Example of consistent shapes 
 
```js 
// Good: consistent shape 
class Point { 
  constructor(x, y) { 
    this.x = x; 
    this.y = y; 
  } 
} 
 
const points = []; 
for (let i = 0; i < 10000; i++) { 
  points.push(new Point(i, i)); 
} 
// Accessing points[i].x and points[i].y is fast due to stable shapes 
 
// Bad: inconsistent shapes 
const objects = []; 
for (let i = 0; i < 10000; i++) { 
  const obj = {}; 
  if (i % 2 === 0) { 
    obj.a = i; 
    obj.b = i; 
  } else { 
    obj.b = i; 
    obj.a = i; 
  } 


---

 
532
  objects.push(obj); 
} 
// Accessing objects[i].a forces the engine to handle multiple shapes 
``` 
 
## Real-world analogy 
 
Hidden classes are like blueprints for houses in a new subdivision. If every house follows the same 
blueprint, you know where each room is located. Inline caching is like keeping a floor plan in your 
pocket so you can walk straight to the kitchen without looking around. If each house is rearranged 
differently, the floor plan becomes useless, and you have to explore each time you visit. 
 
## Practice questions 
 
1. **Theory:** What is a hidden class (or shape) in a JavaScript engine? How does property order 
affect hidden classes? 
2. **Theory:** Describe the difference between monomorphic and polymorphic inline caches. What 
causes an inline cache to become megamorphic? 
3. **Coding:** Write two constructor functions that add properties in different orders. Create many 
objects from each constructor and measure the time it takes to access a common property. Compare 
the performance. 
4. **Coding:** Refactor code that adds properties to an object after creation so that all properties 
are initialised in the constructor. How does this change affect hidden classes and potential 
optimisation? 
5. **Theory:** Besides property access, what other operations in JavaScript engines use inline 
caching? Why do engines cache these operations? 
 
 
 


---

 
533
What is ResizeObserver and how is it different from 
MutationObserver? 
# What is `ResizeObserver` and how is it different from `MutationObserver`? 
 
Modern web layouts often need to respond to changes in element size. Responsive components, 
grids, and charts should adjust when their containers resize, even if the window itself doesn't 
change. The **`ResizeObserver`** API solves this problem by notifying you when an element's size 
changes. It complements the existing **`MutationObserver`**, which watches for changes in the 
DOM tree but not for size changes. Understanding the difference helps you choose the right observer 
for your task. 
 
## `ResizeObserver` - observing element size 
 
`ResizeObserver` lets you watch the dimensions of one or more elements. You create an observer 
with a callback that receives a list of `ResizeObserverEntry` objects whenever the observed element's 
**border box** (including padding and border) or **content box** (excluding padding and border) 
changes size. The callback runs asynchronously—after layout but before paint—so repeated changes 
are batched. 
 
Example: 
 
```js 
const box = document.querySelector(".container"); 
const ro = new ResizeObserver((entries) => { 
  for (const entry of entries) { 
    const { width, height } = entry.contentRect; 
    console.log(`Size changed: ${width} × ${height}`); 
    // Update layout or perform calculations here 
  } 
}); 
ro.observe(box); 
``` 
 


---

 
534
When the `.container` element grows or shrinks, your callback will run with the new dimensions. You 
can call `ro.unobserve(element)` to stop watching or `ro.disconnect()` to remove all observations. 
 
Important notes: 
 
- The callback may fire multiple times as the element changes (for example, when animating width). 
Use throttling or logic inside the callback to avoid expensive recalculations on every pixel change. 
- `ResizeObserver` runs before paint, so you should read sizes and apply layout adjustments but avoid 
heavy DOM mutations that might trigger additional reflows. 
 
## `MutationObserver` - observing DOM changes 
 
`MutationObserver` watches for **structural changes** in the DOM, such as: 
 
- Adding or removing child nodes. 
- Changing attributes or text content. 
- Moving nodes within the tree. 
 
It does **not** fire when an element's size changes due to CSS, flexbox, or grid adjustments. To use 
it, you create a `MutationObserver` with a callback and call `observe()` on a target node, specifying 
which mutations to watch: 
 
```js 
const observer = new MutationObserver((mutationList) => { 
  mutationList.forEach((mutation) => { 
    console.log(mutation.type); 
  }); 
}); 
 
observer.observe(document.body, { childList: true, subtree: true }); 
``` 
 


---

 
535
This callback will run whenever nodes are added or removed anywhere in the document body, but it 
won't run if a node's size changes due to CSS. 
 
## Key differences 
 
| Feature               | `ResizeObserver`                      | `MutationObserver`                                           | 
| --------------------- | ------------------------------------- | ------------------------------------------------------------ | 
| Watches size changes  | ✔️ Yes                                | ❌ No                                                        | 
| Watches DOM structure | ❌ No                                 | ✔️ Yes (additions, removals, attribute 
changes)              | 
| Callback timing       | After layout, before paint            | Microtask queue (after the current 
macrotask)                | 
| Typical use cases     | Responsive components, chart resizing | Updating UI when nodes are 
added/removed, syncing attributes | 
 
## Choosing the right observer 
 
- Use **`ResizeObserver`** when you need to react to changes in element dimensions, such as 
adjusting a canvas when its container resizes, or repositioning tooltips when their target grows. 
- Use **`MutationObserver`** when you need to track changes to the DOM tree or attributes, like 
updating a counter when items are added to a list, or running logic when an attribute is toggled. 
- You can use both observers together: a mutation could add a new element, which you then observe 
with a `ResizeObserver` to watch its size. 
 
## Practice questions 
 
1. **Theory:** What events trigger a `ResizeObserver` callback? Why won't a `MutationObserver` 
fire when an element's width changes due to flexbox or CSS transitions? 
2. **Theory:** Compare the timing of `ResizeObserver` callbacks with `MutationObserver` callbacks. 
When in the render cycle do each run? 
3. **Coding:** Create a resizable panel and use a `ResizeObserver` to update a label showing its 
current dimensions. Resize the panel using CSS and verify that the observer fires. 
4. **Coding:** Use a `MutationObserver` to log whenever items are added to or removed from a 
`<ul>` element. Then add a `ResizeObserver` to each `<li>` to log when a list item's size changes. 


---

 
536
5. **Theory:** In what scenarios might you combine a `MutationObserver` and a `ResizeObserver`? 
Give an example where reacting to both structure and size changes is necessary. 
 
 
 


---

 
537
How does the Clipboard API work for copying and 
pasting programmatically? 
# How does the Clipboard API work for copying and pasting programmatically? 
 
Copying and pasting data is an essential part of user interaction. Modern browsers expose the 
**Clipboard API** to allow web pages to read from and write to the system clipboard 
asynchronously, in a secure and user-friendly way. Using the Clipboard API, you can implement 
features such as "Copy to clipboard" buttons, rich text editors and custom paste handlers. 
 
## Basic operations 
 
The Clipboard API lives on the `navigator.clipboard` object. It provides four primary methods: 
 
- **`writeText(text)`** - Copies the given string to the clipboard. Returns a promise that resolves 
when the text has been written. 
- **`readText()`** - Reads plain text from the clipboard. Returns a promise that resolves with a 
string. 
- **`write(data)`** - Copies arbitrary data (like images or rich text) represented as an array of 
`ClipboardItem` objects. 
- **`read()`** - Reads arbitrary clipboard data and returns an array of `ClipboardItem` objects. 
 
### Example: copying text 
 
```js 
async function copyEmail() { 
  try { 
    await navigator.clipboard.writeText("user@example.com"); 
    console.log("Email copied!"); 
  } catch (err) { 
    console.error("Failed to copy:", err); 
  } 
} 
 


---

 
538
document.querySelector("#copy-btn").addEventListener("click", copyEmail); 
``` 
 
### Example: reading text 
 
```js 
async function pasteText() { 
  try { 
    const text = await navigator.clipboard.readText(); 
    console.log("Pasted:", text); 
  } catch (err) { 
    console.error("Failed to read clipboard:", err); 
  } 
} 
 
document.querySelector("#paste-btn").addEventListener("click", pasteText); 
``` 
 
### Copying images and rich content 
 
To copy rich data, create `ClipboardItem` objects with MIME types and associated `Blob` data: 
 
```js 
async function copyImage(imgBlob) { 
  const item = new ClipboardItem({ "image/png": imgBlob }); 
  await navigator.clipboard.write([item]); 
} 
``` 
 
When reading, iterate over the returned items and call `getType(mime)` to retrieve the blob. Note 
that reading arbitrary clipboard data requires additional permissions (see below). 


---

 
539
 
## Permissions and security considerations 
 
Because the clipboard can contain sensitive data, browsers restrict access to it: 
 
- **Secure context:** Clipboard API methods are only available on HTTPS pages (or `localhost`). 
- **User gesture:** Writing to the clipboard generally requires a user gesture, such as clicking a 
button. Reading from the clipboard often prompts the user to grant permission. 
- **Permissions API:** You can check and request clipboard permissions: 
 
  ```js 
  const status = await navigator.permissions.query({ name: "clipboard-read" }); 
  console.log(status.state); // 'granted', 'prompt' or 'denied' 
  ``` 
 
In many browsers, reading from the clipboard will trigger a permission prompt the first time. Writing 
text usually succeeds silently if called in response to a user action. 
 
## Fallbacks for older browsers 
 
Some browsers don't support the asynchronous Clipboard API. A common fallback is to create a 
temporary `<textarea>`, set its value, select it and use the now-deprecated 
`document.execCommand('copy')` to perform the copy. However, this method doesn't support 
images or rich content and is blocked in many contexts. When writing production code, detect 
support for `navigator.clipboard` and provide a fallback only for text copying when necessary. 
 
## Real-world analogy 
 
The Clipboard API is like having a virtual clipboard in your app. You can politely ask the user to hand 
you a note (read), or you can hand them a note to keep (write), but only when they're paying 
attention (user gesture) and only if you're in the right room (secure context). 
 
## Practice questions 
 


---

 
540
1. **Theory:** What restrictions do browsers impose on clipboard access? Why are these 
restrictions necessary? 
2. **Theory:** Explain the difference between `writeText()` and `write()`. When would you use 
each? 
3. **Coding:** Implement a "Copy code" button that writes the contents of a `<pre>` element to the 
clipboard and provides visual feedback when the operation succeeds or fails. 
4. **Coding:** Write code that reads text from the clipboard and displays it in an input field. Handle 
any errors or permission prompts gracefully. 
5. **Theory:** How would you handle clipboard copying in a browser that does not support 
`navigator.clipboard`? Discuss the limitations of your approach. 
 
 
 


---

 
541
What is the Notification API and how can you request 
user permission? 
# What is the Notification API and how can you request user permission? 
 
The **Notification API** allows websites to display system-level notifications to the user, even when 
the page is not in focus. These notifications can inform users about chat messages, reminders, 
updates or other events. Because they can be intrusive, the browser requires explicit user permission 
before a site can show notifications. 
 
## Requesting permission 
 
Before creating a notification, check whether permission has been granted. The permission status 
can be `'default'`, `'granted'` or `'denied'`. 
 
```js 
if (Notification.permission === "granted") { 
  showNotification(); 
} else if (Notification.permission !== "denied") { 
  Notification.requestPermission().then((permission) => { 
    if (permission === "granted") { 
      showNotification(); 
    } 
  }); 
} 
 
function showNotification() { 
  const notification = new Notification("Hello!", { 
    body: "You have a new message.", 
    icon: "/images/icon.png", 
  }); 
  notification.onclick = () => { 
    window.focus(); 


---

 
542
    notification.close(); 
  }; 
} 
``` 
 
`requestPermission()` returns a promise that resolves with the user's decision. You should call it in 
response to a user gesture (like clicking a button) rather than immediately on page load, as browsers 
may block unprompted permission requests. 
 
## Notification options 
 
When constructing a notification, you can specify various options: 
 
- `body`: The main text of the notification. 
- `icon`: A small icon displayed with the notification. 
- `badge`: A monochrome symbol for small contexts (like Android status bars). 
- `image`: A large image displayed below the text. 
- `actions`: An array of action buttons, each with a title and an action identifier. 
- `tag`: A string that groups notifications. Notifications with the same tag replace each other instead 
of stacking. 
- `requireInteraction`: If `true`, the notification stays visible until the user dismisses it. 
 
Different platforms support different subsets of options, so test on your target devices. 
 
## Notifications from service workers 
 
In Progressive Web Apps, you can show notifications from a **service worker**. This is essential for 
push notifications received when the site isn't open. Inside the service worker, use 
`self.registration.showNotification(title, options)` instead of creating a `Notification` object directly. A 
push event might look like this: 
 
```js 
self.addEventListener("push", (event) => { 


---

 
543
  const data = event.data?.json() ?? {}; 
  const { title, message } = data; 
  event.waitUntil( 
    self.registration.showNotification(title, { 
      body: message, 
      icon: "/images/icon.png", 
    }) 
  ); 
}); 
``` 
 
Service worker notifications behave similarly, but you don't need to request permission inside the 
worker; permission is granted or denied globally for your origin. 
 
## Best practices 
 
- **Ask at the right time:** Request permission after the user performs an action that justifies 
notifications. Asking on page load often leads to denial. 
- **Be respectful:** Don't spam users. Send notifications only when they're useful. Provide clear 
ways to manage preferences. 
- **Handle denied and default states:** Some users will deny permission or ignore prompts. 
Gracefully degrade by updating the UI without notifications. 
- **Use tags:** Group notifications with the same tag to avoid cluttering the notification tray. 
 
## Real-world analogy 
 
Requesting notification permission is like asking someone if it's okay to send them text messages. If 
they agree, you can send messages when something important happens. If they decline, you respect 
their choice and find other ways to communicate. 
 
## Practice questions 
 


---

 
544
1. **Theory:** What are the possible values of `Notification.permission`, and what do they mean? 
When is it appropriate to call `Notification.requestPermission()`? 
2. **Theory:** Describe some of the options you can specify when creating a new notification. 
Which ones might not be supported on all platforms? 
3. **Coding:** Implement a button that asks the user for notification permission and, upon 
approval, displays a custom notification with an action button. Handle the action by opening a 
specific page. 
4. **Coding:** Write service worker code that listens for a push event and shows a notification using 
`self.registration.showNotification()`. Include a `tag` so new notifications replace older ones. 
5. **Theory:** Why should you avoid requesting notification permission immediately when the page 
loads? Suggest a user flow that leads to higher opt-in rates. 
 
 
 


---

 
545
Explain the Battery Status and Network Information APIs 
# Explain the Battery Status and Network Information APIs 
 
Web applications are becoming more aware of their host environment. Two browser APIs—the 
**Battery Status API** and the **Network Information API**—allow your app to adapt its 
behaviour based on device battery level and network conditions. While both APIs are subject to 
privacy and support limitations, understanding them can help you design more responsive, 
energy-efficient applications. 
 
## Battery Status API 
 
### Overview 
 
The Battery Status API exposes information about the system's battery through the 
`navigator.getBattery()` method. This method returns a promise that resolves to a `BatteryManager` 
object with the following properties: 
 
- **`charging`** - `true` if the battery is currently charging. 
- **`level`** - Battery charge level as a number between 0 and 1 (e.g. `0.5` for 50%). 
- **`chargingTime`** - Approximate time (in seconds) until the battery is fully charged (0 when 
already full). 
- **`dischargingTime`** - Approximate time (in seconds) until the battery is empty (Infinity if 
charging). 
 
The `BatteryManager` object also emits events when these values change: `chargingchange`, 
`levelchange`, `chargingtimechange`, and `dischargingtimechange`. Example usage: 
 
```js 
async function monitorBattery() { 
  const battery = await navigator.getBattery(); 
  function update() { 
    console.log(`Battery level: ${Math.round(battery.level * 100)}%`); 
    console.log(`Charging: ${battery.charging}`); 
  } 


---

 
546
  update(); 
  battery.addEventListener("levelchange", update); 
  battery.addEventListener("chargingchange", update); 
} 
monitorBattery(); 
``` 
 
With battery information, you can postpone non-essential tasks when power is low, reduce network 
usage, or warn the user before a long download. 
 
### Privacy and support 
 
Due to fingerprinting concerns (battery state could uniquely identify a device), many browsers have 
removed or restricted access to this API. Chrome and Edge dropped support, while some mobile 
browsers still implement it. Always check browser compatibility and provide fallbacks. If 
`navigator.getBattery` isn't available, avoid gating core functionality on it. 
 
## Network Information API 
 
### Overview 
 
The Network Information API exposes network quality and connection type via 
`navigator.connection` (also known as `navigator.networkInformation`). The `connection` object 
includes properties such as: 
 
- **`effectiveType`** - An estimate of the current connection quality (e.g. `'slow-2g'`, `'2g'`, `'3g'`, 
`'4g'`). 
- **`downlink`** - Estimated effective bandwidth in megabits per second. 
- **`rtt`** - Estimated round-trip time in milliseconds. 
- **`saveData`** - `true` if the user has enabled a "reduce data usage" setting. 
 
The API also emits a `change` event when the connection changes. Example: 
 


---

 
547
```js 
function handleConnectionChange() { 
  const conn = navigator.connection; 
  console.log( 
    `Network type: ${conn.effectiveType}, downlink: ${conn.downlink} Mb/s` 
  ); 
  if (conn.saveData) { 
    console.log("User prefers reduced data usage."); 
    // Perhaps fetch lower-resolution assets 
  } 
} 
 
if ("connection" in navigator) { 
  handleConnectionChange(); 
  navigator.connection.addEventListener("change", handleConnectionChange); 
} 
``` 
 
You can use this information to adjust media quality, defer updates, or choose between offline and 
online modes. For example, a video player might automatically lower resolution when the 
connection is poor. 
 
### Limitations and privacy 
 
Like the Battery API, the Network Information API is not universally supported (mainly available in 
Chrome and some Android browsers). Some browsers deliberately provide coarse or randomised 
values to prevent fingerprinting. Always check for feature presence and use reasonable defaults 
when it's missing. 
 
## Real-world analogy 
 
Think of your application as a restaurant. The Battery Status API is like knowing how much fuel is left 
in your delivery truck; you might postpone long deliveries if the tank is nearly empty. The Network 


---

 
548
Information API is like checking road conditions; you might choose a slower route or defer deliveries 
when traffic is heavy. By adapting to energy and network conditions, you provide a better service 
without wasting resources. 
 
## Practice questions 
 
1. **Theory:** What information does the `BatteryManager` object provide? Why might a browser 
choose to restrict access to this API? 
2. **Theory:** What does the `effectiveType` property of `navigator.connection` represent? How 
could a video streaming application use this information? 
3. **Coding:** Write a function that uses the Battery API (if available) to postpone a large file 
download when the battery level is below 20% and the device isn't charging. 
4. **Coding:** Use the Network Information API to adjust the quality of images loaded on a page. If 
the connection type is `'slow-2g'` or `'2g'`, load low-resolution images; otherwise, load 
high-resolution images. 
5. **Theory:** What are some potential privacy risks of exposing battery and network information 
to websites? How can developers design applications that respect user privacy while still benefiting 
from these APIs? 
 
 
 


---

 
549
What is the Fetch streaming API and how can you 
consume a streamed response? 
# What is the Fetch Streaming API and how can you consume a streamed response? 
 
The **Fetch API** is the modern way to make network requests in JavaScript. By default, high-level 
methods like `response.json()` or `response.text()` buffer the entire response into memory before 
returning it. For large downloads or real-time data, this can be inefficient or cause jank. The **Fetch 
Streaming API** exposes the response body as a **ReadableStream**, allowing you to consume 
the data chunk by chunk as it arrives. 
 
## When streaming is useful 
 
- **Large files:** Streaming prevents large responses from blocking memory and allows you to 
process parts of the file immediately (e.g. show progress while downloading a video). 
- **Progressive rendering:** You can progressively display content (like streaming HTML or logs) 
instead of waiting for the full response. 
- **Real-time feeds:** Server-sent events or chat messages can be delivered over long-lived HTTP 
requests that stream updates. 
 
## Accessing the stream 
 
When you call `fetch()`, the returned `Response` object has a `body` property—an instance of 
`ReadableStream`—if the response supports streaming. There are two main ways to consume it: 
using a reader or using async iteration. 
 
### Consuming with a reader 
 
```js 
async function streamText(url) { 
  const response = await fetch(url); 
  const reader = response.body.getReader(); 
  const decoder = new TextDecoder(); 
  let received = ""; 
  while (true) { 


---

 
550
    const { value, done } = await reader.read(); 
    if (done) break; 
    received += decoder.decode(value, { stream: true }); 
    console.log("Received chunk:", value.length); 
  } 
  console.log("Full text:", received); 
} 
streamText("/large-file.txt"); 
``` 
 
`reader.read()` returns a promise that resolves with an object containing a `Uint8Array` of bytes and 
a `done` flag. Use a `TextDecoder` to convert bytes into strings. By processing each chunk, you can 
update progress indicators or parse partial content. 
 
### Consuming with async iteration 
 
Some environments support iterating over a `ReadableStream` directly: 
 
```js 
async function streamJSONLines(url) { 
  const response = await fetch(url); 
  const reader = response.body; 
  const decoder = new TextDecoder(); 
  let buffer = ""; 
  for await (const chunk of reader) { 
    buffer += decoder.decode(chunk, { stream: true }); 
    let lines = buffer.split("\n"); 
    buffer = lines.pop(); 
    for (const line of lines) { 
      if (line) { 
        const data = JSON.parse(line); 
        console.log("Received item:", data); 


---

 
551
      } 
    } 
  } 
  if (buffer) { 
    console.log("Remaining:", buffer); 
  } 
} 
``` 
 
This example reads a newline-delimited JSON feed. Using `for await...of` yields each `Uint8Array` 
chunk. You accumulate partial lines until a newline and then parse JSON objects as they arrive. 
 
### Streaming to other APIs 
 
Because a response body is a `ReadableStream`, you can pipe it to other streams or build new 
`Response` objects from it. For example, you can stream a large file directly into a `WritableStream` 
provided by the [File System Access API] or into a custom transform stream that compresses data. 
 
## Handling errors and cancellation 
 
Streaming requests can be cancelled using `AbortController`. If the network connection drops, an 
exception will be thrown when reading from the stream. Surround your streaming logic with 
`try...catch` and handle partial data accordingly. Always close or cancel the reader if you stop 
consuming early. 
 
## Real-world analogy 
 
Imagine downloading a long podcast. Instead of waiting for the entire file to download before you 
start listening, streaming lets you begin listening while the rest of the file arrives. Similarly, the Fetch 
Streaming API allows you to process data progressively rather than waiting for the entire response. 
 
## Practice questions 
 


---

 
552
1. **Theory:** Why is streaming a response more memory-efficient than using `response.text()` or 
`response.json()` on large files? 
2. **Theory:** What are the advantages of processing a streamed response as it arrives? Give two 
real-world scenarios where this approach is beneficial. 
3. **Coding:** Write a function that downloads a large binary file using `fetch()` and streams it into 
a `WritableStream` that writes to the browser's IndexedDB or File System Access API. Show how to 
display progress. 
4. **Coding:** Implement a function that consumes a newline-delimited JSON response using 
`ReadableStreamDefaultReader` and logs each parsed object as it arrives. 
5. **Theory:** How can you cancel an ongoing fetch streaming operation? What happens to the 
`ReadableStream` when you call `abort()` on the `AbortController`? 
 
 
 


---

 
553
What is the Web Share API and when is it useful? 
# What is the Web Share API and when is it useful? 
 
Sharing content—links, text, images—is a common action on mobile devices. The **Web Share 
API** allows websites to trigger the native sharing interface of the operating system, letting users 
seamlessly share data to social apps, messaging apps or other targets installed on their device. This 
API bridges the gap between web and native apps by providing a simple JavaScript interface for 
invoking the system share sheet. 
 
## Basic usage 
 
The API is exposed on `navigator.share()`. It accepts an object with up to three properties: `title`, 
`text` and `url`. 
 
```js 
async function shareArticle() { 
  if (navigator.share) { 
    try { 
      await navigator.share({ 
        title: "Interesting article", 
        text: "Check out this blog post on Web APIs!", 
        url: "https://example.com/blog/web-share-api", 
      }); 
      console.log("Content shared successfully"); 
    } catch (err) { 
      console.error("Share failed:", err); 
    } 
  } else { 
    alert("Web Share API not supported on this browser."); 
  } 
} 
document.querySelector("#share-button").addEventListener("click", shareArticle); 


---

 
554
``` 
 
Calling `navigator.share()` returns a promise that resolves when the user completes or cancels the 
share action. The method must be invoked in response to a user gesture (like a button click) and only 
works in **secure contexts** (`https` or localhost). 
 
## Sharing files 
 
An extension to the API (Level 2) allows sharing files using the `files` property. This lets you share 
images, videos or arbitrary blobs. You create `File` objects and pass them in an array: 
 
```js 
async function shareScreenshot(canvas) { 
  const blob = await new Promise((resolve) => 
    canvas.toBlob(resolve, "image/png") 
  ); 
  const file = new File([blob], "screenshot.png", { type: "image/png" }); 
  await navigator.share({ files: [file], title: "Screenshot" }); 
} 
``` 
 
File sharing is supported only on certain platforms (primarily Android and Chrome OS) and may 
require user gestures. 
 
## Use cases and benefits 
 
- **User convenience:** Users are familiar with the system share sheet. Integrating it provides a 
native feel and reduces friction compared to copying a link manually. 
- **Consistency:** You don't need to implement your own share UI or integrate with each social 
platform's SDK. The OS handles the user's preferred apps. 
- **Deep linking:** The `url` property encourages sharing canonical links, improving SEO and 
discoverability. 
- **Progressive enhancement:** You can detect support for `navigator.share` and fall back to 
copying to clipboard or showing a share modal when unsupported. 


---

 
555
 
## Limitations and considerations 
 
- **Platform support:** The Web Share API is primarily supported on mobile browsers (Chrome, 
Edge, Samsung Internet). Desktop support is limited and may require experimental flags. 
- **User gesture required:** Browsers restrict `navigator.share()` to user-initiated events. You can't 
auto-trigger sharing on page load. 
- **No preview control:** Unlike custom share widgets, you can't customise the appearance of the 
share sheet. The OS decides how to present options. 
- **Privacy:** The API doesn't provide feedback about which app the user chose or the content of 
the share. You only know whether it succeeded or failed. 
 
## Real-world analogy 
 
Imagine you're at a party and want to pass along a photo. You could either ask each friend what 
messaging app they use or hand them your phone and let them choose the app themselves. The 
Web Share API is like handing over your phone—it uses the person's preferred channel without you 
needing to know anything about it. 
 
## Practice questions 
 
1. **Theory:** What security and user interaction requirements must be met for `navigator.share()` 
to work? Why are these restrictions in place? 
2. **Theory:** Describe the differences between Web Share API Levels 1 and 2. When would you 
use the `files` property? 
3. **Coding:** Implement a share button that attempts to use `navigator.share()`. If unsupported, 
fall back to copying the current page's URL to the clipboard and informing the user. 
4. **Coding:** Create a function that captures a screenshot of a canvas element and shares it via the 
Web Share API (if supported). Handle errors gracefully. 
5. **Theory:** What are some scenarios where using the Web Share API enhances user experience 
compared to a custom in-app share modal? 
 
 
 


---

 
556
How does the Web Crypto API provide secure 
randomness and hashing? 
# How Does the Web Crypto API Provide Secure Randomness and Hashing? 
 
The **Web Crypto API** is a set of low-level cryptographic primitives built into modern browsers. Its 
goal is to provide secure, performant operations—such as key generation, encryption/decryption, 
signing and hashing—without exposing the raw implementation details. Two of the most commonly 
used features are _secure random number generation_ and _cryptographic hashing_. This article 
explains how the Web Crypto API implements these features and how you can use them safely. 
 
## Secure randomness 
 
In JavaScript there are two primary ways to generate random values: 
 
- **`Math.random()`** - returns a floating-point number between `0` and `1`. It is _not_ suitable for 
security-sensitive applications because the underlying algorithm is designed for speed, not 
unpredictability. Attackers can sometimes predict outputs or reconstruct seeds. 
- **`crypto.getRandomValues()`** - part of the Web Crypto API. This function fills a typed array (e.g. 
`Uint8Array`, `Uint32Array`) with values drawn from the operating system's cryptographically secure 
pseudo-random number generator (CSPRNG). These values are unpredictable and suitable for 
generating keys, nonces, tokens or identifiers. 
 
Using `crypto.getRandomValues()` is straightforward: 
 
```js 
// Generate 16 cryptographically secure random bytes 
const bytes = new Uint8Array(16); 
crypto.getRandomValues(bytes); 
console.log(bytes); 
 
// Convert bytes to a hexadecimal string (e.g. for a token) 
const token = Array.from(bytes) 
  .map((b) => b.toString(16).padStart(2, "0")) 
  .join(""); 


---

 
557
console.log(token); 
``` 
 
The API guarantees that every call returns new random values. You must provide your own typed 
array; the method does not allocate memory for you. Because it relies on the operating system's 
CSPRNG, it is unsuitable for use in a deterministic environment such as seeded pseudo-random 
simulations. 
 
### Generating UUIDs 
 
The Web Crypto API makes it easy to generate [UUID version 4](https://www.rfc-
editor.org/rfc/rfc4122) values. A UUID is a 128-bit identifier with specific bits set according to the 
standard. Here's a helper function: 
 
```js 
function generateUUIDv4() { 
  const bytes = crypto.getRandomValues(new Uint8Array(16)); 
  // Set version (byte 6) to `0100` and variant (byte 8) to `10xx` 
  bytes[6] = (bytes[6] & 0x0f) | 0x40; 
  bytes[8] = (bytes[8] & 0x3f) | 0x80; 
  const parts = [ 
    bytes.slice(0, 4), 
    bytes.slice(4, 6), 
    bytes.slice(6, 8), 
    bytes.slice(8, 10), 
    bytes.slice(10, 16), 
  ].map((arr) => 
    Array.from(arr) 
      .map((b) => b.toString(16).padStart(2, "0")) 
      .join("") 
  ); 
  return parts.join("-"); 
} 


---

 
558
 
console.log(generateUUIDv4()); 
``` 
 
This example shows how to manipulate the random bytes to comply with the UUID format and then 
convert them into a human-readable string. Because the randomness comes from 
`crypto.getRandomValues()`, the resulting UUIDs are safe to use as identifiers in security-sensitive 
contexts (e.g. session IDs). 
 
## Cryptographic hashing 
 
Hash functions map arbitrary data to fixed-length digests. A secure hash function must be 
deterministic, fast to compute, and computationally infeasible to invert or find collisions for. The 
Web Crypto API exposes hash functions via the asynchronous `SubtleCrypto` interface: 
 
```js 
const data = new TextEncoder().encode("Hello, world!"); 
const digestBuffer = await crypto.subtle.digest("SHA-256", data); 
const digestArray = Array.from(new Uint8Array(digestBuffer)); 
const digestHex = digestArray 
  .map((b) => b.toString(16).padStart(2, "0")) 
  .join(""); 
console.log(digestHex); 
// Output: a591a6d40bf420404a011733cfb7b190... 
``` 
 
The `digest` method takes an algorithm name (e.g. `'SHA-256'`, `'SHA-1'`, `'SHA-384'`, `'SHA-512'`) 
and an `ArrayBuffer` or typed array. It returns a `Promise` that resolves with an `ArrayBuffer` 
containing the digest. Converting this buffer into a hex or base64 string requires manual processing 
as shown above. 
 
### Hashing files 
 


---

 
559
You can compute a hash of a large file without reading it all at once by streaming it through the 
`ReadableStream` API and updating a hash incrementally. However, `SubtleCrypto` does not currently 
support incremental hashing. To hash large files efficiently you can read chunks into memory, append 
them to a `Uint8Array`, and hash the entire buffer when done. For truly incremental hashing you 
need a third-party library. 
 
## Important considerations 
 
- **Asynchrony** - Many `SubtleCrypto` methods return Promises because cryptographic operations 
may offload work to dedicated hardware or separate threads. Always `await` the returned values. 
- **Algorithm support** - Browsers may support different sets of algorithms. Common hashes 
(SHA-1/2) and random value generation are widely available, while more advanced algorithms like 
Argon2 or BLAKE3 are not supported. Check `window.crypto.subtle` for available methods. 
- **No direct encryption API for randomness** - The Web Crypto API exposes low-level building 
blocks. You still need to design protocols correctly (e.g. choose unique nonces, manage keys securely) 
when performing encryption or hashing operations. 
- **Security of random values** - Always use `crypto.getRandomValues()` rather than 
`Math.random()` for security-critical randomness. Do not attempt to seed or re-seed the CSPRNG. 
 
## Practice questions 
 
1. **Theory:** Why is `Math.random()` unsuitable for generating session tokens or cryptographic 
keys? What properties does a cryptographically secure random number generator provide? 
2. **Coding:** Write a function that generates a 32-byte cryptographically secure random token and 
returns it as a base64 string. 
3. **Theory:** Describe how the `crypto.subtle.digest()` method works. Why does it return a 
Promise? What steps do you need to perform to convert the digest into a hexadecimal string? 
4. **Coding:** Implement a function that takes a user-provided password string, salts it with a 
random 16-byte salt, hashes it using SHA-256, and returns both the salt and the hash in hex format. 
 
 
 


---

 
560
What is crypto.getRandomValues and why is it safer 
than Math.random? 
# What Is `crypto.getRandomValues()` and Why Is It Safer Than `Math.random()`? 
 
When writing client-side JavaScript, you often need random values—for example to generate session 
tokens, unique IDs, salts, or keys. JavaScript provides two different randomness sources: the built-in 
`Math.random()` function and the `crypto.getRandomValues()` method from the Web Crypto API. 
They differ in design, purpose and security. Understanding those differences is essential when 
building secure applications. 
 
## `Math.random()` — fast but not secure 
 
The `Math.random()` function returns a pseudo-random floating-point number between `0` 
(inclusive) and `1` (exclusive). Its implementation is deliberately simple and fast, which makes it 
appropriate for simulation, games and general-purpose randomness. However, because it is not 
designed for cryptographic use, the values it produces can be predicted given knowledge of the 
underlying algorithm and state. This predictability is the reason `Math.random()` **should never** 
be used for security-critical purposes such as generating passwords, authentication tokens or 
encryption keys. 
 
For example, consider generating a six-digit code using `Math.random()`: 
 
```js 
// A simple but insecure code generator 
function generateCode() { 
  return Math.floor(Math.random() * 1_000_000) 
    .toString() 
    .padStart(6, "0"); 
} 
 
console.log(generateCode()); 
``` 
 


---

 
561
While this code might appear to work, someone with access to the underlying pseudo-random 
sequence could predict or reproduce the same codes. Attackers have exploited predictable 
randomness in the past to break authentication schemes. 
 
## `crypto.getRandomValues()` — cryptographically secure 
 
`crypto.getRandomValues()` is part of the Web Crypto API and uses the browser's operating system 
to generate cryptographically secure random values. It fills a supplied typed array (e.g. `Uint8Array`, 
`Uint32Array`) with random bytes. These values are drawn from a secure source and are 
unpredictable by design. 
 
Here is how you might use it to generate a token: 
 
```js 
// Generate a 20-byte random token encoded in base64 
function generateSecureToken() { 
  const array = new Uint8Array(20); 
  crypto.getRandomValues(array); 
  // Convert bytes to base64 
  const binary = String.fromCharCode(...array); 
  return btoa(binary); 
} 
 
console.log(generateSecureToken()); 
``` 
 
### Why it's safer 
 
1. **Unpredictability:** The output cannot be feasibly predicted or reproduced without access to 
the underlying OS entropy source. Cryptographically secure random number generators (CSPRNGs) 
are designed so that even with partial knowledge of the internal state, an attacker cannot predict 
future outputs. 


---

 
562
2. **Uniform distribution:** Values returned by `crypto.getRandomValues()` are uniformly 
distributed across the available range of the typed array. This avoids biases that can occur when 
manually mapping random floats to integers. 
3. **System entropy:** Browsers delegate randomness to the operating system (e.g. 
`/dev/urandom` on Unix, `CryptGenRandom` on Windows), which collects entropy from hardware 
events. These sources are continually re-seeded. 
4. **Independent instances:** Calling `crypto.getRandomValues()` in one tab does not affect the 
internal state for other calls or other tabs. By contrast, some implementations of `Math.random()` 
maintain a single global state that persists across calls. 
 
## Best practices 
 
- **Always prefer `crypto.getRandomValues()` for any sensitive random data.** Use it when 
generating CSRF tokens, password reset codes, salts, encryption keys or unique identifiers. 
- **Do not attempt to re-seed or seed the CSPRNG yourself.** The system manages its own entropy 
pool; manual seeding can weaken security. 
- **Use typed arrays appropriate for your needs.** For example, use a `Uint32Array` to generate 
random 32-bit integers, or a `Uint8Array` for byte sequences. Convert to other formats (hex, base64) 
as needed. 
- **Combine with a cryptographic hash or HMAC when necessary.** Sometimes you'll use 
`crypto.getRandomValues()` to create a secret, then derive keys using `crypto.subtle.importKey()` 
and `crypto.subtle.deriveKey()` for stronger key derivation and management. 
 
## Practice questions 
 
1. **Theory:** Explain why values generated by `Math.random()` can sometimes be predicted. What 
kind of problems might this cause? 
2. **Coding:** Write a function that generates an 8-character hexadecimal string using 
`crypto.getRandomValues()`. Why is this method safer than one based on `Math.random()`? 
3. **Theory:** What types of arrays can be passed to `crypto.getRandomValues()`? What happens if 
you pass an unsupported typed array? 
4. **Coding:** Modify the secure token generator to return a URL-safe base64 string (replace `+` 
with `-` and `/` with `_` and remove padding). 
 
 
 


---

 
563
Explain WebRTC basics — data channels and peer 
connections 
# WebRTC Basics: Data Channels and Peer Connections 
 
**WebRTC (Web Real-Time Communication)** is a set of browser APIs that enables peer-to-peer 
audio, video and data communication without requiring plugins. It allows two (or more) devices to 
exchange streams directly, making features like video conferencing, file sharing and collaborative 
editing possible in the browser. This article focuses on the core pieces—**`RTCPeerConnection`** 
and **`RTCDataChannel`**—and walks through an example of establishing a simple data channel. 
 
## RTCPeerConnection 
 
The `RTCPeerConnection` interface represents a connection between two peers. It handles: 
 
- **Signaling and negotiation** - exchanging session descriptions (SDP) and network information 
(ICE candidates) through an external signalling channel of your choice (WebSocket, HTTP, WebSocket 
server). WebRTC does not define signaling; you must implement your own mechanism to transfer 
negotiation messages between peers. 
- **Network traversal** - using STUN and optionally TURN servers to determine public endpoints 
and traverse NAT/firewalls. 
- **Media and data streams** - creating and managing media tracks (audio/video) and data 
channels over the connection. 
 
Creating a peer connection is simple: 
 
```js 
const pc = new RTCPeerConnection({ 
  iceServers: [ 
    { urls: "stun:stun.l.google.com:19302" }, 
    // Optional: TURN servers for relaying if direct connection fails 
  ], 
}); 
 
// When the browser gathers a new ICE candidate (network info), send it to the other peer 


---

 
564
pc.onicecandidate = (event) => { 
  if (event.candidate) { 
    sendToSignalingServer({ type: "candidate", candidate: event.candidate }); 
  } 
}; 
 
// Handle negotiation needed event 
pc.onnegotiationneeded = async () => { 
  const offer = await pc.createOffer(); 
  await pc.setLocalDescription(offer); 
  sendToSignalingServer({ type: "offer", sdp: pc.localDescription }); 
}; 
``` 
 
## RTCDataChannel 
 
While WebRTC is often associated with video and audio, it also includes **data channels**—
bidirectional communication channels for arbitrary data. Data channels use the same underlying 
transport as media streams (SRTP over UDP) and can be configured for reliability 
(`ordered`/`maxRetransmits`) and congestion control. They are ideal for sending small messages or 
file chunks in real time. 
 
To create a data channel, call `pc.createDataChannel(name, options)` **before** negotiation begins 
on the initiating peer. On the remote peer you listen to the `ondatachannel` event to receive the 
channel: 
 
```js 
// Caller (creates the channel) 
const channel = pc.createDataChannel("chat"); 
channel.onopen = () => console.log("Data channel open"); 
channel.onmessage = (e) => console.log("Received:", e.data); 
 
// Callee (receives the channel) 


---

 
565
pc.ondatachannel = (event) => { 
  const channel = event.channel; 
  channel.onopen = () => console.log("Data channel open"); 
  channel.onmessage = (e) => console.log("Received:", e.data); 
}; 
``` 
 
Once the channel is open, you can send and receive strings or binary data: 
 
```js 
// Sending from the caller 
channel.send("Hello from caller"); 
 
// Sending an ArrayBuffer 
const buffer = new Uint8Array([1, 2, 3]).buffer; 
channel.send(buffer); 
``` 
 
### Establishing a connection: full flow 
 
To establish a connection between two peers you need a signalling mechanism to exchange offers, 
answers and ICE candidates. A simplified flow: 
 
1. **Create peer connections** on both peers and set up event handlers for `icecandidate`, 
`onnegotiationneeded` and `ondatachannel`. 
2. **Create a data channel** on one peer before negotiation. This triggers an 
`onnegotiationneeded` event. 
3. **Caller creates offer**: call `createOffer()`, set it locally with `setLocalDescription()`, then send 
the offer to the other peer through your signalling server. 
4. **Callee receives offer**: call `setRemoteDescription()`, then call `createAnswer()`, set it locally, 
and send the answer back. 


---

 
566
5. **Exchange ICE candidates**: as each peer generates candidates, send them to the other peer 
and call `addIceCandidate()` to add them. Once enough candidates are gathered, a direct or relay 
connection is established. 
6. **Use the data channel**: when the channel's `onopen` event fires on both peers, you can call 
`send()` and handle `onmessage` events. 
 
### Use cases for WebRTC data channels 
 
- **Peer-to-peer chat or file sharing** - Users can send messages or transfer files directly without 
routing data through a server, reducing latency and bandwidth costs. 
- **Collaborative editing** - Real-time collaborative applications can synchronize state by 
exchanging JSON patches or operational transforms. 
- **Game networking** - Fast, low-latency peer communication for multiplayer games. 
 
### Limitations and considerations 
 
- **Signalling is not included** - You must implement or use an external signalling server to 
exchange negotiation messages. Without signalling, peers cannot discover each other. 
- **Firewall/NAT traversal** - WebRTC attempts a direct connection, but may fall back to relaying 
via TURN servers. This can affect latency and requires additional server infrastructure. 
- **Security** - Data channels are encrypted. However, you still need to handle authentication and 
access control at the application level. 
- **Browser support** - All major browsers support WebRTC, but some features differ. Mobile 
browsers can have additional limitations. Always feature-detect and provide fallbacks. 
 
## Practice questions 
 
1. **Theory:** What purpose do STUN and TURN servers serve in WebRTC? Why are they 
necessary? 
2. **Coding:** Implement a simple signalling mechanism using WebSockets that exchanges offers, 
answers and ICE candidates between two peers. 
3. **Theory:** Explain the difference between a data channel created with `ordered: true` and one 
with `ordered: false`. When might you use an unordered channel? 
4. **Coding:** Write a function that sends a file over a data channel by splitting it into chunks and 
reassembling it on the receiving peer. 
 


---

 
567
 
 


---

 
568
What is AbortController and how do you use it to cancel 
fetch requests? 
# What Is `AbortController` and How Do You Use It to Cancel Fetch Requests? 
 
Long-running network requests can become unnecessary if the user navigates away, changes input or 
performs a different action. Canceling these requests frees up resources and improves 
responsiveness. The **AbortController API** provides a standardized way to cancel asynchronous 
operations, including `fetch()` calls, by signalling an abort event. 
 
## The AbortController API 
 
`AbortController` is a built-in interface that creates an **abort signal** (`AbortSignal`). The signal 
can be passed to APIs that support abortable operations—most notably `fetch()`, `ReadableStream`, 
and Web Crypto methods. When the controller's `abort()` method is called, it triggers an `abort` 
event on the signal, allowing the consuming API to cancel the operation. 
 
Here's how to create and use an `AbortController`: 
 
```js 
// 1. Create a controller and obtain its signal 
const controller = new AbortController(); 
const signal = controller.signal; 
 
// 2. Pass the signal to fetch 
fetch("https://jsonplaceholder.typicode.com/posts/1", { signal }) 
  .then((response) => response.json()) 
  .then((data) => console.log("Received:", data)) 
  .catch((err) => { 
    if (err.name === "AbortError") { 
      console.log("Fetch aborted"); 
    } else { 
      console.error("Fetch error:", err); 
    } 


---

 
569
  }); 
 
// 3. Later, abort the request (e.g. user cancels) 
setTimeout(() => { 
  controller.abort(); 
}, 200); 
``` 
 
When `controller.abort()` is called, the fetch operation rejects with an `AbortError`. Catching this 
error allows your application to distinguish an intentional abort from a network failure or other 
exception. 
 
## Integrating AbortController in UI interactions 
 
Abort controllers are often tied to user actions. For example, cancel a search request when the user 
types a new query: 
 
```js 
let searchController; 
 
async function search(query) { 
  // Abort previous search if one exists 
  if (searchController) searchController.abort(); 
  searchController = new AbortController(); 
 
  try { 
    const response = await fetch(`/search?q=${encodeURIComponent(query)}`, { 
      signal: searchController.signal, 
    }); 
    const results = await response.json(); 
    displayResults(results); 
  } catch (err) { 


---

 
570
    if (err.name !== "AbortError") { 
      showError(err); 
    } 
  } 
} 
 
// Bind search function to input event 
document.querySelector("#search").addEventListener("input", (e) => { 
  search(e.target.value); 
}); 
``` 
 
In this example, each time the user modifies the search box, the previous request is cancelled. Only 
the latest request continues, preventing outdated results from racing with newer ones. 
 
## Combining with timeouts 
 
You can implement request timeouts using `AbortController` without `setTimeout()` race conditions. 
Here's a helper function that wraps `fetch()` with a timeout: 
 
```js 
async function fetchWithTimeout(url, options = {}, timeout = 5000) { 
  const controller = new AbortController(); 
  const id = setTimeout(() => controller.abort(), timeout); 
  try { 
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal, 
    }); 
    clearTimeout(id); 
    return response; 
  } catch (err) { 


---

 
571
    clearTimeout(id); 
    throw err; 
  } 
} 
 
// Usage 
fetchWithTimeout("https://example.com/data", {}, 2000) 
  .then((response) => response.json()) 
  .then((data) => console.log(data)) 
  .catch((err) => { 
    if (err.name === "AbortError") { 
      console.log("Request timed out"); 
    } 
  }); 
``` 
 
This pattern ensures that the fetch is aborted if it takes longer than the specified timeout. You can 
also pass an external `AbortSignal` via `AbortSignal.timeout()` (in environments that support it) to 
simplify this logic. 
 
## Limitations and notes 
 
- **API support** - Only certain web APIs support abort signals. Many modern ones do (fetch, some 
streams, some crypto operations), but older APIs do not. Always refer to documentation. 
- **One-time use** - An `AbortController` can only be aborted once. After calling `abort()`, the signal 
stays aborted and cannot be reused. Create a new controller for each new operation. 
- **Propagation** - Abort signals can be combined using `AbortSignal.any()` or 
`AbortSignal.timeout()` (where available) to handle multiple cancellation conditions. 
- **Server cooperation** - Canceling a fetch aborts the client-side processing, but the server may 
still process the request. For long-running server operations, implement server-side cancellation 
mechanisms (e.g. using websockets or custom abort signals). 
 
## Practice questions 


---

 
572
 
1. **Theory:** What happens when a `fetch()` with an associated `AbortSignal` is aborted? How can 
your code distinguish between an abort and another type of error? 
2. **Coding:** Modify the search example so that it shows a spinner while the request is in progress 
and hides it when the request finishes or is aborted. 
3. **Theory:** Why can a single `AbortController` only cancel once? Describe a situation where you 
would use `AbortSignal.any()`. 
4. **Coding:** Write a wrapper around `fetch()` that accepts an optional `AbortSignal`. It should 
return a promise that rejects with a custom error if the fetch is aborted or times out. 
 
 
 


---

 
573
What is Content Security Policy (CSP) and why is it 
important? 
# What Is Content Security Policy (CSP) and Why Is It Important? 
 
**Content Security Policy (CSP)** is a security standard that helps prevent a broad class of injection 
attacks—such as cross-site scripting (XSS), clickjacking and data injection—by controlling which 
resources the browser is allowed to load and execute. CSP is delivered via HTTP headers or `<meta>` 
tags and instructs the browser to enforce restrictions on scripts, styles, images, fonts, frames and 
other assets. By defining a strict policy, you significantly reduce the attack surface of your application. 
 
## Why CSP matters 
 
Injection attacks occur when an attacker can inject arbitrary HTML or JavaScript into a page. The 
browser executes this code with the same privileges as trusted code, allowing attackers to steal 
cookies, deface pages or perform actions on behalf of the user. Even with input validation and output 
encoding, mistakes can happen. CSP acts as a _second line of defense_ by preventing the browser 
from executing untrusted code even if it makes its way into the DOM. 
 
Without CSP, a single unescaped user comment containing `<script>alert('xss')</script>` could trigger 
an alert or worse. With a properly configured CSP that disallows inline scripts and only allows scripts 
from trusted domains, the browser will block the injection. 
 
## Basic syntax 
 
A CSP is defined using the `Content-Security-Policy` header or the `<meta http-equiv="Content-
Security-Policy">` tag. A policy consists of **directives**, each specifying allowed sources for a type 
of resource. Some common directives include: 
 
- `default-src` - fallback for resources not covered by other directives. 
- `script-src` - allowed sources for JavaScript. Accepts URLs, `'self'`, `'none'`, `'unsafe-inline'`, `'unsafe-
eval'`, hashes, and nonces. 
- `style-src` - allowed sources for CSS. 
- `img-src`, `font-src`, `frame-src`, etc. - allowed sources for images, fonts, frames. 
- `object-src`, `base-uri`, `form-action`, `connect-src` - restrict other behaviours. 
 


---

 
574
A simple CSP might look like this: 
 
```http 
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 
'unsafe-inline'; object-src 'none' 
``` 
 
This policy allows content to be loaded from the site's own origin (`'self'`). Scripts are permitted from 
the same origin and a trusted CDN. Inline styles are allowed (though this weakens protection) and all 
plugins (`<object>`, `<embed>`) are disallowed. 
 
### Nonces and hashes 
 
To allow specific inline scripts or styles while blocking arbitrary inline code, CSP supports **nonces** 
and **hashes**: 
 
- **Nonces** - A nonce is a random string generated on each request and included as a `nonce` 
attribute on `<script>` or `<style>` tags. The policy specifies `script-src 'nonce-<value>'`. Only scripts 
with the matching nonce are executed; all others are blocked. 
- **Hashes** - You can include a hash of the exact script contents in the policy (`script-src 'sha256-
<hash>'`). The browser computes hashes of inline scripts and executes them only if they match an 
allowed hash. This prevents script tampering. 
 
Nonces and hashes allow inline scripts without opening up vulnerabilities to arbitrary injection. They 
are preferable to `'unsafe-inline'`, which disables inline script protections entirely. 
 
### Reporting 
 
CSP can be configured to report violations via the `report-uri` or `report-to` directives. When a 
violation occurs, the browser sends a JSON report to the specified endpoint containing details like 
the blocked URI and violated directive. You can enable **report-only mode** by using the `Content-
Security-Policy-Report-Only` header. This is useful for testing a policy before enforcing it. 
 
## Best practices for implementing CSP 
 


---

 
575
1. **Start in report-only mode.** Apply a strict policy with the `-Report-Only` header to capture 
violations in production without blocking users. Review and adjust the policy based on reports, then 
switch to enforcement mode. 
2. **Avoid broad sources.** Using `*` or allowing entire external domains (e.g. 
`https://example.com/*`) increases risk if those domains are compromised. Permit only trusted, 
specific hostnames. 
3. **Disable inline execution.** Remove `'unsafe-inline'` and `'unsafe-eval'` from your `script-src` 
directive. Use external scripts or nonces/hashes for inline code. 
4. **Use per-request nonces.** Generate a new random nonce on each request to prevent reuse 
and make it difficult for attackers to guess. 
5. **Combine with other defenses.** CSP complements but does not replace input validation, 
output encoding and proper authentication/authorization. Use CSP as part of a layered security 
strategy. 
 
## Practice questions 
 
1. **Theory:** Describe how CSP can prevent XSS even when an attacker manages to inject a 
`<script>` tag into your page. 
2. **Coding:** Write an Express.js middleware that sets a CSP header blocking inline scripts but 
allowing scripts from `cdnjs.cloudflare.com`. Add a report endpoint that logs violations. 
3. **Theory:** What is the difference between `Content-Security-Policy` and `Content-Security-
Policy-Report-Only`? Why might you use the latter during deployment? 
4. **Coding:** Explain how you would use a random nonce to permit a single inline script to run 
while still blocking other inline scripts. 
 
 
 


---

 
576
What is cross-site scripting (XSS) and how can JavaScript 
prevent it? 
# What Is Cross-Site Scripting (XSS) and How Can JavaScript Prevent It? 
 
**Cross-Site Scripting (XSS)** is a security vulnerability that allows attackers to inject malicious 
scripts into web pages viewed by other users. When a vulnerable page displays unsanitised user 
input as HTML, an attacker can inject a `<script>` tag, event handler or other code that runs in the 
victim's browser. This malicious code can steal cookies, read sensitive data, or perform actions on 
behalf of the user. XSS is one of the most common web vulnerabilities and comes in three main 
forms: stored, reflected and DOM-based. 
 
## Types of XSS 
 
1. **Stored XSS (persistent)** - The attacker stores malicious code on the server (e.g. in a comment 
field). Each time a user loads the page, the stored script runs. 
2. **Reflected XSS** - Malicious code is included in a URL or form parameter and immediately 
reflected back in the response. Users who click the link trigger the script. 
3. **DOM-based XSS** - The client-side JavaScript manipulates the DOM using untrusted input (e.g. 
`location.hash`) and inserts it into the page using `innerHTML`, causing the injection to run without a 
new HTTP response. 
 
Regardless of type, XSS occurs because **untrusted data is treated as code**. Preventing XSS 
requires ensuring that data is safely encoded or sanitised before it reaches the DOM. 
 
## Prevention techniques 
 
### 1. Output encoding and escaping 
 
When inserting user content into the DOM, avoid APIs that interpret input as HTML. For example, 
instead of using `innerHTML`, use `textContent` or `innerText` to insert untrusted strings. These 
methods treat the input as plain text and do not parse markup: 
 
```js 
// Unsafe: This will parse HTML and execute any embedded scripts 
element.innerHTML = `<p>${comment}</p>`; 


---

 
577
 
// Safe: Inserts text without interpreting it as markup 
element.textContent = comment; 
 
// If you must insert HTML, sanitise it using a library 
import DOMPurify from "dompurify"; 
element.innerHTML = DOMPurify.sanitize(userHtml); 
``` 
 
When generating HTML on the server, ensure you properly escape special characters (`<`, `>`, `&`, `'`, 
`"`) before inserting user content. Most templating engines have built-in mechanisms to do this 
automatically when using safe interpolation. 
 
### 2. Use Content Security Policy (CSP) 
 
CSP can mitigate XSS by blocking inline scripts and restricting the domains from which scripts can be 
loaded. Even if an attacker manages to inject markup, the browser will refuse to run it if it violates 
the policy. Use nonces or hashes to allow only known inline scripts and disallow `'unsafe-inline'`. 
 
### 3. Validate and sanitise input 
 
Never trust user input. Validate data on both the client and server for type, length and format. Reject 
or sanitise unexpected values. For rich text editors or user-generated HTML, use a robust sanitiser 
like [DOMPurify](https://github.com/cure53/DOMPurify) to remove dangerous tags and attributes. 
 
### 4. Avoid dangerous JavaScript APIs 
 
Using `eval()`, `Function()`, `setTimeout()`/`setInterval()` with string arguments, or dynamically 
generating HTML via string concatenation increases risk. Instead, work with data structures and 
functions directly. Where dynamic evaluation is unavoidable (e.g. configuration), strictly control the 
input and environment. 
 
### 5. Escaping within JavaScript templates 
 


---

 
578
If you're using client-side templating libraries (e.g. React, Vue, Handlebars), avoid dangerously setting 
HTML. React automatically escapes content when using JSX. Only use `dangerouslySetInnerHTML` 
when you have sanitised input. 
 
### 6. HTTP-only and secure cookies 
 
Mark session cookies as `HttpOnly` and `Secure` so that they cannot be accessed via JavaScript and 
are transmitted only over HTTPS. This reduces what an attacker can do even if they manage to inject 
a script. 
 
## Practice questions 
 
1. **Theory:** Explain the difference between stored and reflected XSS. Give an example of each. 
2. **Coding:** Refactor the following vulnerable code to prevent XSS: 
 
   ```js 
   // Vulnerable: inserts user input directly into the DOM 
   const name = location.search.slice(1); 
   document.getElementById("welcome").innerHTML = `<h2>Hello ${name}!</h2>`; 
   ``` 
 
3. **Theory:** How does using a CSP header complement other XSS prevention techniques? Can 
CSP alone eliminate all XSS vulnerabilities? 
4. **Coding:** Implement a function that safely displays user comments, escaping any HTML tags 
and attributes before inserting them into the page. 
 
 
 


---

 
579
What is cross-site request forgery (CSRF) and how can JS 
help mitigate it? 
# What Is Cross-Site Request Forgery (CSRF) and How Can JavaScript Help Mitigate It? 
 
**Cross-Site Request Forgery (CSRF)** is an attack that tricks a user's browser into making 
unwanted requests to a different site where the user is authenticated. Since browsers automatically 
include cookies (and sometimes HTTP authentication headers) with each request, an attacker can 
cause the victim's browser to perform actions—like changing account settings or transferring 
money—without their knowledge. Unlike XSS, CSRF exploits the trust a site has in the user's browser 
rather than the trust the user has in the site. 
 
For instance, suppose you're logged into your bank at `bank.example.com`. If you visit a malicious 
page that contains `<img src="https://bank.example.com/transfer?amount=1000&to=attacker">`, 
your browser will send this request with your session cookie included. If the bank's server lacks 
proper CSRF protection, it may process the transaction. 
 
## Defenses against CSRF 
 
### 1. Synchronizer tokens (anti-CSRF tokens) 
 
The most common defense is to include a **unique, unpredictable token** in each state-changing 
request. The server generates this token and associates it with the user's session. The token is 
embedded in the page (e.g. in a hidden form field) and must be submitted with the request. Because 
an attacker cannot read the token (due to same-origin policy), they cannot construct a valid request. 
 
When using `fetch()` or AJAX requests, your JavaScript can read the token from a meta tag or cookie 
and include it in the `X-CSRF-Token` header: 
 
```html 
<meta name="csrf-token" content="abc123" /> 
``` 
 
```js 
async function postData(url, data) { 
  const token = document.querySelector('meta[name="csrf-token"]').content; 


---

 
580
  const response = await fetch(url, { 
    method: "POST", 
    headers: { 
      "Content-Type": "application/json", 
      "X-CSRF-Token": token, 
    }, 
    credentials: "include", 
    body: JSON.stringify(data), 
  }); 
  return response.json(); 
} 
``` 
 
The server validates the `X-CSRF-Token` against the session. If missing or incorrect, the request is 
rejected. 
 
### 2. SameSite cookie attribute 
 
Modern browsers support the `SameSite` cookie attribute which controls whether cookies are sent 
on cross-site requests. Setting `SameSite=Lax` or `SameSite=Strict` on session cookies restricts the 
circumstances in which browsers include cookies for cross-site requests, mitigating CSRF. For 
example: 
 
```http 
Set-Cookie: sessionId=...; Path=/; Secure; HttpOnly; SameSite=Lax 
``` 
 
With `SameSite=Lax`, cookies are sent for top-level navigations but not for third-party requests like 
hidden images or iframes. `SameSite=Strict` prevents cookies from being sent for any cross-site 
request. Combined with `Secure` and `HttpOnly`, this greatly reduces CSRF risk. 
 
### 3. Double submit cookies 
 


---

 
581
Another technique is the **double submit cookie** pattern: the server sets a CSRF token cookie 
(accessible to JavaScript) and requires the same value in a request header or form field. Since 
JavaScript must explicitly read the cookie and include its value, an attacker cannot supply it from a 
different site. 
 
### 4. Custom headers and CORS preflight 
 
If your API requires clients to include a custom header (e.g. `X-Requested-With: XMLHttpRequest` or 
`Authorization: Bearer <token>`), browsers will automatically trigger a CORS preflight for cross-site 
requests. The preflight uses an `OPTIONS` request that does **not** include cookies. The server can 
reject such requests based on the `Origin` header. This technique is often used for JSON APIs where 
the client uses `fetch()` with `credentials: 'include'` only on same-origin interactions. 
 
### 5. Frame busting and UI considerations 
 
Clickjacking attacks can pair with CSRF to trick users into clicking hidden buttons inside iframes. Use 
frame busting (`X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'`) to 
prevent your site from being embedded in iframes. Provide clear UI feedback and confirm critical 
actions with additional credentials (e.g. reenter password). 
 
## Role of JavaScript 
 
While CSRF protections are primarily implemented on the server, **JavaScript plays a supporting 
role**: 
 
- **Including tokens in requests** - Client-side code can read the CSRF token from a meta tag or 
cookie and attach it to every `fetch()` or AJAX request. Without this, SPA frameworks may 
inadvertently omit the token. 
- **Using `credentials: 'same-origin'`** - When using `fetch()`, set `credentials` appropriately 
(`'same-origin'` or `'include'`). This ensures cookies are sent only when permitted by the server and 
respects `SameSite` restrictions. It also prevents unintended credential leakage to third-party origins. 
- **Avoiding cross-site requests from untrusted pages** - Do not fetch cross-origin resources with 
credentials in contexts you cannot control, such as dynamic scripts or untrusted iframes. 
 
## Practice questions 
 


---

 
582
1. **Theory:** Explain how a CSRF attack might work against a user who is logged in to a banking 
site. What conditions are necessary for the attack to succeed? 
2. **Coding:** Write a helper function that reads a CSRF token from a `meta` tag and includes it in a 
JSON POST request using `fetch()`. 
3. **Theory:** Describe how the `SameSite` cookie attribute helps mitigate CSRF. Compare 
`SameSite=Lax` with `SameSite=Strict` in terms of user experience. 
4. **Coding:** Implement a server-side anti-CSRF middleware (in Express.js or similar) that verifies 
an incoming `X-CSRF-Token` against the value stored in the session. Ensure that the token cannot be 
guessed. 
 
 
 


---

 
583
Explain sandboxed iframes and the same-origin policy in 
browsers 
# Sandboxed `<iframe>`s and the Same-Origin Policy in Browsers 
 
Embedding content from other sites has always been a core part of the web. `<iframe>` elements 
allow you to display another webpage inside your page, but doing so raises security concerns. 
Browsers enforce a **Same-Origin Policy (SOP)** that restricts how documents or scripts loaded 
from one origin can interact with resources from another origin. Additionally, `<iframe>`s support a 
`sandbox` attribute that can further restrict the capabilities of the embedded content. Understanding 
these mechanisms helps you embed third-party content safely. 
 
## The Same-Origin Policy 
 
The same-origin policy is a critical security feature implemented by browsers to prevent malicious 
sites from interacting with the sensitive data of other sites. Two URLs share the same origin if they 
have the **same protocol**, **host** and **port**. Under the SOP: 
 
- A page loaded from `https://example.com` cannot read or modify the DOM of a page from 
`https://another.com`. It also cannot access cookies, localStorage or IndexedDB from another origin. 
- Scripts are allowed to send requests to any domain, but they cannot read responses from 
cross-origin requests unless the server explicitly allows it via [Cross-Origin Resource Sharing 
(CORS)](../050-what-is-cors-and-how-does-it-work.md). 
- Forms and image tags are not restricted and can submit cross-origin requests, but they cannot read 
responses. 
 
This policy prevents a malicious site from reading a user's email or banking details by embedding or 
loading the site and accessing its content via JavaScript. 
 
### Cross-origin communication 
 
Sometimes you need to communicate with an iframe loaded from a different origin (e.g. a payment 
widget). You cannot call its functions directly due to SOP, but you can use the **`postMessage` 
API**. Both the parent and iframe can send messages using `window.postMessage(message, 
targetOrigin)`, and listen for `message` events with `window.addEventListener('message', handler)`. 
Ensure you verify `event.origin` to make sure messages come from a trusted domain. 
 


---

 
584
## Sandboxed `<iframe>`s 
 
The `<iframe>` element includes a boolean `sandbox` attribute that places the embedded document 
in a **unique, restricted browsing context**, regardless of its origin. The restrictions remove many 
of the iframe's capabilities, and you can selectively re-enable some via **sandbox flags**. 
 
By default, `sandbox` does the following: 
 
- Disallows form submission. 
- Disables scripts from running. 
- Prevents the iframe from opening new windows (`window.open`). 
- Blocks `alert()`, `prompt()` and other dialogs. 
- Forces the iframe to be treated as cross-origin—even if it has the same origin as the parent—
meaning it cannot access the parent's DOM or cookies. 
 
You can relax these restrictions by adding a space-separated list of tokens: 
 
- `allow-scripts` - permits JavaScript execution. 
- `allow-same-origin` - treats the document as same origin with respect to SOP, enabling DOM access 
if the origin matches. 
- `allow-forms` - permits form submission. 
- `allow-popups` - allows `window.open()` and target-blank links. 
- `allow-modals`, `allow-pointer-lock`, `allow-top-navigation`, etc. - enable specific capabilities. 
 
Example: 
 
```html 
<!-- Completely sandboxed: no scripts, no forms --> 
<iframe src="https://thirdparty.example.com" sandbox></iframe> 
 
<!-- Allows scripts but still treats the iframe as cross-origin --> 
<iframe src="https://thirdparty.example.com" sandbox="allow-scripts"></iframe> 


---

 
585
 
<!-- Allows scripts and same-origin if the iframe is from the same domain --> 
<iframe src="/widget.html" sandbox="allow-scripts allow-same-origin"></iframe> 
``` 
 
The `sandbox` attribute is useful when embedding potentially untrusted content, such as 
user-generated HTML or third-party widgets. It prevents the embedded page from manipulating your 
page or stealing data, even if it comes from the same domain. 
 
## Practical example: Embedding a third-party widget 
 
Suppose you integrate a third-party comments widget. You want the widget to run its own scripts but 
not interfere with your site. You can embed it with a sandbox: 
 
```html 
<iframe 
  src="https://comments.example.com/embed" 
  sandbox="allow-scripts allow-forms" 
  title="Comments Widget" 
></iframe> 
``` 
 
This allows the widget to execute its scripts and submit forms (e.g. comment submissions) but still 
isolates it from your origin. Even if the widget is compromised, it cannot access your DOM or cookies. 
If you need to receive events from the widget, use `postMessage()` with an explicit `targetOrigin` 
check: 
 
```js 
window.addEventListener("message", (event) => { 
  if (event.origin === "https://comments.example.com") { 
    console.log("Received message:", event.data); 
  } 
}); 


---

 
586
 
// Send a message to the iframe when ready 
const iframe = document.querySelector("iframe"); 
iframe.contentWindow.postMessage("init", "https://comments.example.com"); 
``` 
 
## Summary 
 
Sandboxed iframes and the same-origin policy are powerful tools for isolating untrusted content. The 
SOP prevents scripts from one origin accessing resources from another, while the `sandbox` attribute 
can restrict even same-origin content to a safe environment. Use them to protect your users and 
your site when embedding external content. 
 
## Practice questions 
 
1. **Theory:** Describe the difference between the same-origin policy and the `<iframe sandbox>` 
attribute. How do they complement each other? 
2. **Coding:** Create a page with an embedded iframe that loads a trusted same-origin page. Use 
`sandbox` to disable forms and prevent the iframe from navigating the top window but allow scripts. 
Demonstrate sending a message from the iframe to the parent using `postMessage()`. 
3. **Theory:** What risks could arise if you include `allow-same-origin` in a sandboxed iframe 
pointing to an untrusted third-party domain? 
4. **Coding:** Write a helper function that listens for `message` events and verifies the origin before 
processing the data. Explain why origin checks are important. 
 
 
 


---

 
587
What is the Trusted Types API and how does it defend 
against XSS? 
# What Is the Trusted Types API and How Does It Defend Against XSS? 
 
Browser vendors continually evolve security features to mitigate cross-site scripting (XSS). **Trusted 
Types** is a new API designed to eliminate a whole class of DOM-based XSS vulnerabilities by forcing 
developers to explicitly create and approve HTML, script URLs and other critical DOM values. When 
enabled, the browser rejects assignments of raw strings to dangerous sinks (e.g. 
`element.innerHTML` or `eval()`) unless the value is a _Trusted Type_ object created through a 
registered policy. This approach ensures that only sanitised or vetted content can reach these sinks. 
 
## Why traditional measures fall short 
 
Developers often mitigate XSS using input validation, output encoding and a Content Security Policy 
(CSP) that blocks inline scripts. However, client-side code can still inadvertently create DOM-based 
XSS vulnerabilities by concatenating untrusted strings and assigning them to properties like 
`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `setAttribute('src', ...)`, or by calling `eval()` on 
untrusted input. Attackers can exploit these to inject scripts even if the server sanitises input. As 
projects grow and involve multiple contributors or dependencies, it becomes hard to audit every 
string assignment. 
 
## How Trusted Types works 
 
Trusted Types introduces three object types: **TrustedHTML**, **TrustedScript**, and 
**TrustedScriptURL**. The browser refuses to use regular strings in critical DOM sinks when Trusted 
Types is enforced. Instead, you must provide a Trusted Type object. These objects can only be 
created through **policies** that you define. A policy is a function that processes input and returns 
a Trusted Type if it is safe. If it cannot guarantee safety, it should throw an error. 
 
### Enabling Trusted Types 
 
Trusted Types is activated via CSP by adding the directive `require-trusted-types-for 'script'`. You can 
also use `trusted-types <policy-names>` to whitelist policies by name. Without a policy, assignments 
to dangerous sinks throw a TypeError. 
 
Example header: 


---

 
588
 
```http 
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types default; report-uri /csp-
report 
``` 
 
This tells the browser to require Trusted Types for all script-related sinks and defines a single policy 
called `default`. 
 
### Defining a policy 
 
You define a policy using `trustedTypes.createPolicy(name, handlers)`. The handlers are functions 
that take a string and return a Trusted Type. For HTML, a common approach is to sanitise or escape 
dangerous markup. 
 
```js 
// Register a default policy that sanitises HTML using DOMPurify 
import DOMPurify from "dompurify"; 
 
const policy = trustedTypes.createPolicy("default", { 
  createHTML: (input) => DOMPurify.sanitize(input), 
  createScriptURL: (url) => { 
    const allowed = url.startsWith("https://trusted.cdn.example.com/"); 
    if (!allowed) throw new TypeError("Untrusted script URL"); 
    return url; 
  }, 
}); 
 
// Later: set HTML using the TrustedHTML object 
element.innerHTML = policy.createHTML(userComment); 
 
// Set a script element's src using TrustedScriptURL 


---

 
589
scriptElement.src = policy.createScriptURL( 
  "https://trusted.cdn.example.com/lib.js" 
); 
``` 
 
The `createHTML` handler sanitises or transforms untrusted user input into a safe HTML string, then 
wraps it as a `TrustedHTML` object. If the string contains disallowed content, it may remove or 
encode it. Similarly, `createScriptURL` ensures that script sources come only from approved domains. 
 
### Violations and reporting 
 
When Trusted Types is enabled and a script attempts to assign a string to a restricted sink without 
converting it into a Trusted Type, the browser throws a TypeError. You can capture such violations 
using CSP report endpoints and adjust your code accordingly. 
 
## Advantages of Trusted Types 
 
- **Enforced sanitisation** - You cannot accidentally introduce DOM XSS via string concatenation. 
All assignments to sensitive sinks must go through your policy, centralising sanitisation logic. 
- **Integrates with CSP** - Policies are configured via CSP, so they work in tandem with `script-src` 
restrictions and other headers. 
- **Library support** - Frameworks and libraries can create their own policies to generate Trusted 
Types, making it easy to adopt. 
- **Fine-grained control** - You can create multiple policies with different behaviours for different 
parts of your application. 
 
## Migration considerations 
 
Because Trusted Types is opt-in and can break legacy code, migrate incrementally: 
 
1. Add `Content-Security-Policy: require-trusted-types-for 'script'` in report-only mode. Inspect 
violation reports to find code paths that need fixing. 
2. Create a default policy that sanitises or escapes user input. Replace assignments to `innerHTML`, 
`outerHTML`, `src` attributes and other sinks with calls to `policy.createHTML()` or similar methods. 


---

 
590
3. Gradually tighten your policy or split it into multiple policies as needed. 
4. Switch to enforcement mode once all violations are resolved. 
 
## Practice questions 
 
1. **Theory:** Explain why using `innerHTML` with untrusted data can introduce DOM-based XSS. 
How does Trusted Types help prevent this? 
2. **Coding:** Write a Trusted Types policy that allows only images hosted on `example.com` to be 
assigned to `img.src`. Show how to apply it when creating an `<img>` element. 
3. **Theory:** How do `require-trusted-types-for` and `trusted-types` directives in CSP differ? Why 
is a report-only mode useful when adopting Trusted Types? 
4. **Coding:** Suppose your application uses a rich text editor that outputs HTML. Show how to 
sanitise the HTML using your policy before inserting it into the DOM. 
 
 
 


---

 
591
What is the Cache Storage API and how does it relate to 
Service Workers? 
# What Is the Cache Storage API and How Does It Relate to Service Workers? 
 
Modern web applications often need to operate reliably under poor network conditions or offline. 
The **Cache Storage API** provides a way to store and retrieve network request/response pairs in 
named caches. It is most commonly used in combination with **service workers** to intercept 
network requests and serve cached resources. Understanding how this API works empowers you to 
implement robust caching strategies and improve the performance and resilience of your site. 
 
## The Cache Storage API 
 
The Cache Storage API is exposed globally through the `caches` object (in window and workers) and 
allows you to create and manage separate caches, each identified by a name. Each cache holds 
entries mapping requests to responses. A cache is like a persistent key-value store for HTTP requests 
and responses: 
 
```js 
// Open or create a cache named 'static-assets' 
const cache = await caches.open("static-assets"); 
 
// Add individual entries 
await cache.put( 
  "/styles/main.css", 
  new Response("body { color: red; }", { 
    headers: { "Content-Type": "text/css" }, 
  }) 
); 
 
// Retrieve an entry 
const response = await cache.match("/styles/main.css"); 
if (response) { 
  const text = await response.text(); 


---

 
592
  console.log(text); // 'body { color: red; }' 
} 
 
// Delete an entry 
await cache.delete("/styles/main.css"); 
 
// Iterate over cached requests 
for (const request of await cache.keys()) { 
  console.log(request.url); 
} 
``` 
 
The `caches` object itself has methods such as `caches.keys()` (list cache names), 
`caches.delete(name)` (remove a cache), and `caches.match(request)` (search all caches). 
 
### Important points 
 
- **Entries are opaque** - Responses are stored exactly as returned from the network. If you store a 
response for a `GET` request, the response must be _basic_ or _CORS-allowed_; opaque responses 
cannot be read due to cross-origin restrictions but can still be cached. 
- **Order matters** - `caches.match()` searches caches in reverse order of creation; the first 
matching response is returned. Consider the order when layering caches. 
- **Storage limits** - Browsers impose storage quotas for caches (often a percentage of available 
storage). Manage your caches by removing outdated entries during service worker activation. 
 
## Integrating with service workers 
 
A **service worker** is a background script that intercepts network requests via the `fetch` event. 
By listening to `fetch`, you can respond with cached resources or fall back to the network. The Cache 
Storage API is the primary mechanism for storing those cached responses. 
 
Here's a basic service worker that caches assets during installation and serves them from the cache 
on subsequent visits: 
 


---

 
593
```js 
// sw.js 
const PRECACHE = "precache-v1"; 
const PRECACHE_ASSETS = ["/", "/index.html", "/styles.css", "/app.js"]; 
 
// Install event: populate the cache 
self.addEventListener("install", (event) => { 
  event.waitUntil( 
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)) 
  ); 
}); 
 
// Fetch event: respond from cache or network 
self.addEventListener("fetch", (event) => { 
  event.respondWith( 
    caches.match(event.request).then((cachedResponse) => { 
      if (cachedResponse) { 
        return cachedResponse; 
      } 
      // Otherwise fetch from network and optionally cache the result 
      return fetch(event.request).then((networkResponse) => { 
        return caches.open(PRECACHE).then((cache) => { 
          // Cache a clone of the response; streams can be read once 
          cache.put(event.request, networkResponse.clone()); 
          return networkResponse; 
        }); 
      }); 
    }) 
  ); 
}); 
 


---

 
594
// Activate event: clean up old caches 
self.addEventListener("activate", (event) => { 
  const currentCaches = [PRECACHE]; 
  event.waitUntil( 
    caches.keys().then((cacheNames) => { 
      return Promise.all( 
        cacheNames.map((name) => { 
          if (!currentCaches.includes(name)) { 
            return caches.delete(name); 
          } 
        }) 
      ); 
    }) 
  ); 
}); 
``` 
 
This code caches essential assets on install, serves them from the cache if available on fetch, and 
removes old caches during activation. You can implement more sophisticated strategies, such as 
**network-first** (try the network, fallback to cache), **stale-while-revalidate** (serve from cache 
and update in background), or **cache-first** depending on the resource type. 
 
### Cache vs HTTP cache 
 
The browser's built-in HTTP cache stores responses based on headers like `Cache-Control` and `ETag`. 
You cannot directly control or inspect it from JavaScript. The Cache Storage API is separate; you 
decide what to store and how to respond. When using the service worker cache, you should set 
appropriate headers on responses you generate (e.g. `Cache-Control: no-store`) to prevent duplicate 
caching in the HTTP cache. You can also use both: rely on the HTTP cache for short-term caching and 
the service worker cache for offline fallbacks. 
 
## Practice questions 
 


---

 
595
1. **Theory:** Explain the difference between the browser's HTTP cache and the Cache Storage API. 
Why would you choose to use the latter in a service worker? 
2. **Coding:** Write a service worker handler that implements a network-first strategy for API 
requests while caching static assets with a cache-first strategy. 
3. **Theory:** What happens if you call `cache.put()` with a response whose body has already been 
read? How do you avoid this issue? 
4. **Coding:** Implement a function that iterates over all stored caches, deletes those whose names 
do not start with a given prefix, and logs the number of deleted entries. 
 
 
 


---

 
596
How do Progressive Web Apps (PWAs) leverage Service 
Workers for offline access? 
# How Do Progressive Web Apps (PWAs) Leverage Service Workers for Offline Access? 
 
**Progressive Web Apps (PWAs)** are web applications that behave like native apps: they load fast, 
work offline, and can be installed on a user's device. A key technology enabling these capabilities is 
the **service worker**, a background script that intercepts network requests and can return cached 
responses when the network is unavailable or slow. This article explores how service workers 
empower PWAs to provide offline access and improved performance. 
 
## Service worker basics 
 
A service worker is a JavaScript file that runs separately from the main page and is registered by the 
application. Once registered and activated, it can: 
 
- **Intercept network requests** through the `fetch` event. 
- **Cache resources** using the Cache Storage API. 
- **Receive push notifications** and display them. 
- **Synchronise data in the background** via the Background Sync API. 
 
Because service workers run outside the page context, they do not have direct access to the DOM, 
but they can communicate with the page via the `postMessage` API. 
 
## Caching strategies for offline access 
 
To enable offline access, PWAs use service workers to pre-cache resources and serve them when the 
network is unavailable. There are several common caching strategies: 
 
### 1. Cache-first 
 
When an asset is requested, the service worker first looks in the cache. If found, it returns the cached 
response. If not, it fetches from the network, caches the response and returns it. This strategy 
ensures quick loads for static assets like CSS and JavaScript bundles. 
 


---

 
597
```js 
self.addEventListener("fetch", (event) => { 
  event.respondWith( 
    caches.match(event.request).then((cached) => { 
      return ( 
        cached || 
        fetch(event.request).then((response) => { 
          return caches.open("dynamic").then((cache) => { 
            cache.put(event.request, response.clone()); 
            return response; 
          }); 
        }) 
      ); 
    }) 
  ); 
}); 
``` 
 
### 2. Network-first 
 
For dynamic content (e.g. API responses), you may prefer the freshest data. The service worker 
fetches from the network first and falls back to the cache if the network fails. Optionally it caches the 
response for future offline use. 
 
```js 
self.addEventListener("fetch", (event) => { 
  if (event.request.url.startsWith("/api/")) { 
    event.respondWith( 
      fetch(event.request) 
        .then((response) => { 
          const cloned = response.clone(); 
          caches.open("api").then((cache) => cache.put(event.request, cloned)); 


---

 
598
          return response; 
        }) 
        .catch(() => caches.match(event.request)) 
    ); 
  } 
}); 
``` 
 
### 3. Stale-while-revalidate 
 
This hybrid strategy returns the cached response immediately (stale) while simultaneously fetching 
an updated version from the network. When the network response arrives, the cache is updated for 
next time. Users get instant responses but still see fresh content on subsequent visits. 
 
```js 
self.addEventListener("fetch", (event) => { 
  event.respondWith( 
    caches.match(event.request).then((cached) => { 
      const networkFetch = fetch(event.request).then((response) => { 
        caches 
          .open("dynamic") 
          .then((cache) => cache.put(event.request, response.clone())); 
        return response; 
      }); 
      return cached || networkFetch; 
    }) 
  ); 
}); 
``` 
 
### 4. Offline fallback 
 


---

 
599
You can provide an offline HTML page as a fallback when the network is unavailable. During 
installation, cache an `offline.html` file. In the fetch handler, if both network and cache miss, return 
the offline page: 
 
```js 
self.addEventListener("fetch", (event) => { 
  event.respondWith( 
    fetch(event.request) 
      .catch(() => caches.match(event.request)) 
      .then((response) => { 
        return response || caches.match("/offline.html"); 
      }) 
  ); 
}); 
``` 
 
## Web App Manifest and installation 
 
Besides service workers, PWAs use a **Web App Manifest** (`manifest.json`) to provide metadata—
name, icons, start URL and theme colors—allowing browsers to install the app on the home screen. 
When combined with an active service worker, the browser will prompt users to install the PWA. 
Installed PWAs launch in a standalone window and use cached assets even when offline. 
 
## Additional capabilities 
 
- **Background sync** - Service workers can queue failed network requests and retry them later 
when connectivity returns. This is useful for sending form data or API calls while offline. 
- **Push notifications** - Service workers handle push events to display notifications even when the 
site isn't open. 
- **Periodic sync and triggers** - Emerging APIs allow service workers to periodically update cached 
data or react to triggers (e.g. network status changes). 
 
## Considerations and challenges 
 


---
