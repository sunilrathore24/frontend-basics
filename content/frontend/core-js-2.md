# The JavaScript Masterbook — Core Concepts (Pages 201–400)

> Source: *The JavaScript Masterbook* by Upamanyu Deka

---

 
200
} 
 
loadUser_Fetch(1) 
  .then((user) => console.log("Fetch user", user)) 
  .catch((err) => console.error(err)); 
``` 
 
In the fetch version, the intent is clear: we request the resource, check `response.ok`, parse JSON and 
return it. Error handling can be centralized with `try`/`catch`. The XHR version requires more 
boilerplate to set up handlers and parse the response. 
 
### Real-world analogy 
 
You can think of XHR as ordering food by calling a restaurant and waiting on hold while the operator 
writes down your order. You must stay on the line and listen for status updates, and if you hang up 
you have to start over. Fetch is like placing an order through a modern delivery app: you send your 
order (a promise) and receive a notification when it's ready. You can cancel the order with a tap 
(AbortController) and track its status in the app. Both achieve the same goal, but the user experience 
is smoother with the newer tool. 
 
### Practice questions 
 
1. **Theory:** Describe two advantages of the Fetch API over `XMLHttpRequest` and one feature 
that XHR still offers that Fetch does not. 
2. **Coding:** Write a function that retrieves a list of posts from an API using `fetch()`, parses the 
JSON and handles HTTP errors gracefully. Then rewrite the same functionality using 
`XMLHttpRequest` and compare the readability. 
3. **Exploration:** Research how to cancel fetch requests using `AbortController` and implement a 
button that aborts a pending request. Why is aborting important in single-page applications? 
 
 
 


---

 
201
What is JSON.parse and JSON.stringify and what are 
their pitfalls 
What is `JSON.parse` and `JSON.stringify`, and what are their pitfalls? 
 
Below is a beginner-friendly explanation of `JSON.parse()` and `JSON.stringify()`, with examples and 
common pitfalls. The goal is to demystify how JSON works in JavaScript so you can safely convert 
between JSON text and JavaScript values. 
 
--- 
 
## What is JSON? 
 
**JSON (JavaScript Object Notation)** is just text: a string that uses a strict format to represent data 
structures such as objects and arrays. Because it's just text, you can send it over the network or save 
it to disk. JavaScript can then parse this text back into real objects. 
 
A simple JSON string looks like this: 
 
```json 
{ "name": "Alice", "age": 30, "hobbies": ["reading", "hiking"] } 
``` 
 
Notice that keys and string values are **always wrapped in double quotes**, and trailing commas 
are not allowed. 
 
--- 
 
## `JSON.parse()` - turning JSON text into values 
 
The `JSON.parse(text, reviver?)` function takes a JSON string (`text`) and converts it into a JavaScript 
value. It also accepts an optional **reviver function** to transform values during parsing. 
 
### Basic usage 


---

 
202
 
```js 
const text = '{"name":"Alice","age":30}'; 
const obj = JSON.parse(text); 
console.log(obj.name); // "Alice" 
console.log(obj.age); // 30 
``` 
 
### Using a reviver 
 
A reviver lets you customize how values are constructed. It receives each key and value, from the 
deepest properties up to the root, and you return the final value to use. For example, to convert ISO 
date strings into `Date` objects: 
 
```js 
const json = '{"event":"meeting","time":"2025-11-07T12:00:00Z"}'; 
const event = JSON.parse(json, (key, value) => { 
  // if a string matches ISO date format, convert to a Date 
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) 
    ? new Date(value) 
    : value; 
}); 
console.log(event.time instanceof Date); // true 
``` 
 
### Pitfalls and caveats 
 
- **Numeric precision:** JavaScript stores numbers as 64-bit floats. Very large integers (beyond 2⁵³) 
can lose precision when parsed. MDN warns that numbers "may lose precision in the process". If you 
need to safely transport big integers, serialize them as strings and convert them back (e.g., to 
`BigInt`) after parsing. 


---

 
203
- **Type revival:** JSON supports only objects, arrays, strings, numbers, booleans and `null`. 
Complex types (`Date`, `Map`, custom classes) are parsed as plain objects. Use the reviver to 
reconstruct them. 
- **Invalid JSON throws:** `JSON.parse()` will throw a `SyntaxError` if the input string isn't valid 
JSON—single quotes, comments or trailing commas aren't allowed. Always wrap parsing in 
`try`/`catch` when dealing with user input. 
- **Security:** Never parse untrusted JSON that includes executable code. JSON is data only; it 
doesn't allow functions, so any function-like content indicates something is wrong. 
 
--- 
 
## `JSON.stringify()` - turning values into JSON text 
 
`JSON.stringify(value, replacer?, space?)` converts a JavaScript value to a JSON string. It can take an 
optional **replacer** (to filter or transform properties) and **space** (to pretty-print the output). 
 
### Basic usage 
 
```js 
const obj = { name: "Bob", age: 25 }; 
const text = JSON.stringify(obj); 
console.log(text); // {"name":"Bob","age":25} 
``` 
 
### Replacer 
 
A replacer lets you control which properties are included or how they are transformed. It can be an 
array of keys to include, or a function that processes each key/value. 
 
```js 
const person = { name: "Carol", password: "secret", age: 28 }; 
 
// Only include selected keys 


---

 
204
const publicData = JSON.stringify(person, ["name", "age"]); 
console.log(publicData); // {"name":"Carol","age":28} 
 
// Use a function to filter/transform values 
const sanitized = JSON.stringify(person, (key, value) => { 
  if (key === "password") return undefined; // omit passwords 
  return value; 
}); 
console.log(sanitized); // {"name":"Carol","age":28} 
``` 
 
### Pretty printing 
 
The `space` argument adds indentation for readability: 
 
```js 
const obj = { a: 1, b: { c: 2, d: 3 } }; 
const pretty = JSON.stringify(obj, null, 2); 
console.log(pretty); 
/* 
{ 
  "a": 1, 
  "b": { 
    "c": 2, 
    "d": 3 
  } 
} 
*/ 
``` 
 
Use `null` for the replacer if you don't need to filter anything. 


---

 
205
 
### Pitfalls and caveats 
 
- **Unsupported values:** JSON does not support `undefined`, functions or symbols. When 
encountered as property values, they are **omitted**; in arrays they become `null`. For example: 
 
  ```js 
  JSON.stringify({ a: undefined, b: 2 }); // "{"b":2}" 
  JSON.stringify([1, undefined, 3]); // "[1,null,3]" 
  JSON.stringify({ 
    say() { 
      return "hi"; 
    }, 
  }); // "{}" 
  ``` 
 
- **Special numbers:** `Infinity`, `-Infinity` and `NaN` are not valid JSON values; they are converted 
to `null`. 
 
- **Non-enumerable / symbol-keyed properties:** Only an object's own enumerable string-keyed 
properties are serialized. Symbol-keyed and non-enumerable properties are ignored. 
 
- **Custom serialization:** If an object has a `toJSON()` method, `JSON.stringify()` will call that 
method to get a serializable representation. This lets you define how your objects are stringified. 
 
- **Circular references:** If you attempt to stringify an object that references itself (directly or 
indirectly), `JSON.stringify()` will throw a `TypeError`. Use a custom replacer to handle circular 
structures or use a library like `flatted`. 
 
### Example: handling BigInt and dates 
 
```js 
const obj = { 


---

 
206
  big: BigInt("9007199254740993"), // > Number.MAX_SAFE_INTEGER 
  date: new Date(), 
}; 
 
const json = JSON.stringify(obj, (key, value) => { 
  // convert BigInt to string 
  if (typeof value === "bigint") return value.toString(); 
  // convert Date to ISO string 
  if (value instanceof Date) return value.toISOString(); 
  return value; 
}); 
 
console.log(json); 
// {"big":"9007199254740993","date":"2025-11-07T13:00:00.000Z"} 
 
const parsed = JSON.parse(json, (key, value) => { 
  if (key === "big") return BigInt(value); 
  if (key === "date") return new Date(value); 
  return value; 
}); 
``` 
 
--- 
 
## Summary 
 
| Function           | Purpose                                      | Gotchas to 
remember                                                                                                                                     | 
| ------------------ | -------------------------------------------- | ---------------------------------------------------------------
---------------------------------------------------------------------------------------- | 


---

 
207
| `JSON.parse()`     | Converts a JSON string to a JavaScript value | Large numbers lose precision; only 
supports basic types; invalid JSON throws; use reviver to handle dates and 
BigInts                                   | 
| `JSON.stringify()` | Converts a JavaScript value to a JSON string | Ignores `undefined`, functions and 
symbols; `Infinity`/`NaN` become `null`; circular references throw; use replacer/`toJSON()` for custom 
serialization | 
 
By understanding the basic usage and pitfalls of `JSON.parse()` and `JSON.stringify()`, you can 
confidently serialize and deserialize data without surprises—even as a beginner. 
 
### Example: pitfalls in practice 
 
```js 
const obj = { 
  name: "Alice", 
  big: 9007199254740993n, // larger than Number.MAX_SAFE_INTEGER 
  greet: () => "hi", 
  nested: {}, 
}; 
obj.nested.self = obj; // circular reference 
 
try { 
  console.log(JSON.stringify(obj)); 
} catch (err) { 
  console.error("Error during stringify:", err.message); 
} 
 
// Safely stringify by converting unsupported values 
const safe = JSON.stringify(obj, (key, value) => { 
  if (typeof value === "bigint") return value.toString(); 
  if (typeof value === "function" || value === undefined) return undefined; 
  return value; 
}); 


---

 
208
console.log(safe); 
 
// Parsing with reviver 
const parsed = JSON.parse(safe, (key, value) => { 
  if (key === "big") return BigInt(value); 
  return value; 
}); 
console.log(parsed.big === 9007199254740993n); // true 
``` 
 
The first attempt to stringify `obj` throws because of the circular reference. The custom replacer 
removes the function and `undefined` values and converts the bigint to a string, allowing the 
serialization to succeed. The reviver then restores the bigint when parsing. 
 
### Real-world analogy 
 
Think of JSON serialization as packing items into a standardized shipping box. Only certain item types 
(strings, numbers, booleans, `null`, arrays and plain objects) fit in the box. If you try to pack a live 
plant (function), a piece of paper with no label (`undefined`) or something infinitely large (`Infinity`), 
the packer will either throw the item away or mark its slot as empty. If an item contains a loop of 
rope that attaches back to itself (circular reference), the packer doesn't know how to untangle it and 
refuses to pack the box at all. You must convert unusual items into a supported form before shipping 
and mark them carefully so that the receiver can reconstruct them. 
 
### Practice questions 
 
1. **Theory:** Why does `JSON.stringify({x: undefined, y: NaN})` produce `{"y":null}`? What happens 
if you try to stringify a function? 
2. **Coding:** Write a custom replacer and reviver to serialize and deserialize a `Map` object. How 
can you preserve the key/value pairs? 
3. **Troubleshooting:** Describe how you would detect and handle circular references when 
stringifying a deep object graph. Compare using a replacer function versus using the built-in 
`structuredClone()` method. 
 
 
 


---

 
209
Explain module patterns in JS — ESM vs CommonJS 
Explain module patterns in JS: ESM vs CommonJS 
 
JavaScript uses modules to organize code into reusable pieces. Historically, Node.js adopted 
CommonJS (CJS), while browsers and the ECMAScript standard now support ES modules (ESM). Each 
pattern has its own syntax and characteristics. 
 
### CommonJS (CJS) 
 
CJS is the original module system for Node.js. Modules are loaded **synchronously** using 
`require()`, and they export values via `module.exports` or `exports`. Because `require()` is just a 
function, you can call it dynamically based on conditions. CJS modules run immediately when 
required and their exports are cached in `require.cache`. According to the Node documentation, CJS 
modules have access to variables like `__filename` and `__dirname` and can modify `module.exports` 
to expose functionality. 
 
Example: 
 
```js 
// math.js (CommonJS) 
function add(a, b) { 
  return a + b; 
} 
module.exports = { add }; 
 
// index.js 
const math = require("./math"); 
console.log(math.add(2, 3)); 
``` 
 
### ECMAScript modules (ESM) 
 


---

 
210
ES modules are the official standard for JavaScript modules. They use the `import` and `export` 
keywords and are loaded **asynchronously**. Because import statements are **static** (must be 
at the top level), bundlers can analyze dependencies ahead of time and eliminate unused exports 
(tree shaking). ESM does not expose CommonJS-specific features such as `require`, `module.exports`, 
`__filename` or `__dirname`. LogRocket notes that ES modules are more readable and are the 
standard moving forward, whereas CommonJS is primarily used for backward compatibility. 
 
Example: 
 
```js 
// math.mjs 
export function add(a, b) { 
  return a + b; 
} 
 
// index.mjs 
import { add } from "./math.mjs"; 
console.log(add(2, 3)); 
``` 
 
### Key differences 
 
- **Loading strategy** - CJS loads modules synchronously; code executes as soon as `require()` is 
called. This works well in Node because modules are on disk, but it blocks execution during network 
fetches in the browser. ESM loads modules asynchronously, returning a promise when using dynamic 
`import()`. Static imports are hoisted and executed before other code. 
- **Syntax and static analysis** - CJS uses `require()` and `module.exports`; ESM uses 
`import`/`export`. Because ESM uses static declarations, bundlers can perform tree shaking to 
remove unused exports. CJS allows imports anywhere, even conditionally, which makes static 
analysis harder. 
- **Interop** - Mixing CJS and ESM can be tricky. ESM default export maps to 
`module.exports.default` in CJS. Node requires the file extension `.mjs` or a `"type": "module"` field 
in `package.json` to enable ESM. 
- **Environment support** - CJS is built into Node and works in any version. ESM is supported in 
modern browsers and in Node 12+ behind certain flags; older tools may still rely on CJS. 


---

 
211
- **Tree shaking** - Bundlers like webpack can eliminate unused code in ESM because the structure 
is static. This is harder with CJS because functions can be required dynamically. 
 
### Choosing between CJS and ESM 
 
For new projects targeting modern environments, ES modules are recommended because they are 
the standard, allow static analysis and tree shaking, and work in both browser and Node with 
minimal configuration. However, you may need CommonJS when using legacy Node modules or 
building libraries that must support old tooling. Many projects provide dual builds (e.g., `index.cjs` 
and `index.mjs`) to support both systems. 
 
### Practice questions 
 
1. **Theory:** Describe two advantages of ES modules over CommonJS and one reason you might 
still use CommonJS. 
2. **Coding:** Convert a CommonJS module that exports multiple functions into an ES module using 
named exports, and adjust its import statements. 
3. **Exploration:** Research how to dynamically load modules using `import()` in ES modules and 
how that compares to conditional `require()` calls. When might dynamic loading be useful? 
 
 
 


---

 
212
What is tree shaking and dead code elimination 
What is tree shaking and dead code elimination 
 
Bundlers and compilers try to remove code that is never used. There are two related concepts: 
**dead code elimination (DCE)** and **tree shaking**. DCE is a compiler optimization that discards 
unreachable code; tree shaking is a technique applied specifically to JavaScript modules to include 
only the parts of a dependency graph you actually use. 
 
### Dead code elimination 
 
Dead code elimination removes unreachable or unused code after an entire file or bundle has been 
generated. Traditional optimizers mark functions and variables that are never referenced and delete 
them. However, because JavaScript allows dynamic behavior (e.g., using `eval` or property lookup by 
string), a bundler cannot always detect unused code. DCE is limited to obvious cases. 
 
### Tree shaking 
 
Tree shaking is a form of dead code elimination tailored for ES modules. Web.dev compares it to 
pruning a dependency tree: bundlers analyze static `import` statements and only include the 
exported members you actually import. Instead of starting with all code and removing dead pieces, 
tree shaking builds your bundle from the top down, adding only "live" code that is referenced. It 
works best when using ES modules because `import`/`export` syntax is static; CommonJS `require` is 
dynamic and hampers static analysis. Named imports help bundlers know exactly which exports you 
need. 
 
Example: 
 
```js 
// math.js 
export function add(a, b) { 
  return a + b; 
} 
export function subtract(a, b) { 
  return a - b; 
} 


---

 
213
 
// app.js 
import { add } from "./math.js"; 
console.log(add(2, 3)); 
``` 
 
When bundling `app.js`, a tree-shaking bundler includes only the `add` function and omits `subtract`, 
reducing bundle size. If you import the entire module (`import * as math`), the bundler may include 
both functions because it cannot know which properties will be used. 
 
### Tips for effective tree shaking 
 
- Use ES module syntax (`import`/`export`) rather than CommonJS. Avoid dynamic `require`. 
- Prefer named imports over namespace or default imports so bundlers know exactly what to 
include. 
- Avoid side effects (code that runs when the module is imported); mark pure modules with 
`"sideEffects": false` in your package.json so bundlers can safely remove unused files. 
- Understand that tree shaking does not remove code executed for side effects; functions like polyfills 
or global initialization will always be included. 
 
### Practice questions 
 
1. **Theory:** Explain how tree shaking differs from traditional dead code elimination and why 
static `import` statements are important. 
2. **Coding:** Refactor a module that exports multiple functions so that unused functions can be 
tree-shaken away when bundling. Test with a bundler like webpack or Rollup. 
3. **Exploration:** Research how the `"sideEffects"` flag in `package.json` affects tree shaking. Try 
enabling/disabling it in a simple project and observe the bundle size. 
 
 
 


---

 
214
What is a polyfill? 
What is a polyfill 
 
Web standards evolve, but not all browsers support new features immediately. A **polyfill** is a 
piece of code that implements a feature on browsers that do not natively support it. MDN defines a 
polyfill as a JavaScript implementation that provides modern functionality to older browsers. 
Developers write polyfills to mimic APIs like `Object.assign`, `Array.prototype.includes` or CSS 
features so that applications work across browsers. 
 
### How polyfills work 
 
Polyfills typically check whether a feature exists and, if not, define it. For example, to add 
`Array.prototype.includes` support in older browsers: 
 
```js 
if (!Array.prototype.includes) { 
  Array.prototype.includes = function (search, start = 0) { 
    for (let i = start; i < this.length; i++) { 
      if ( 
        this[i] === search || 
        (Number.isNaN(this[i]) && Number.isNaN(search)) 
      ) { 
        return true; 
      } 
    } 
    return false; 
  }; 
} 
``` 
 
When run in modern browsers, the `if` condition prevents overriding the native implementation. 
When run in older browsers, it adds the method so that code using `includes` will work. 
 


---

 
215
### Polyfills vs transpilers and shims 
 
- **Transpilers** (e.g., Babel) convert modern syntax to older syntax (e.g., arrow functions to 
traditional functions). They cannot add new APIs. Polyfills complement transpilers by providing 
missing methods. 
- **Shims** are similar to polyfills; some authors use the terms interchangeably, but "shim" often 
refers to code that wraps existing APIs to provide a consistent interface. 
- **Polyfills** mimic features with as close to spec-compliant behavior as possible but may have 
performance limitations compared to native implementations. 
 
### When to use polyfills 
 
Use polyfills when you need to support older browsers that lack specific features. Many libraries and 
frameworks include polyfills automatically based on browser targets (e.g., core-js). Be careful not to 
include unnecessary polyfills because they increase bundle size. Also, never polyfill features that 
change global behavior (like `Promise`) if you cannot guarantee spec compliance; some 
environments may already provide partial implementations. 
 
### Practice questions 
 
1. **Theory:** Define a polyfill and explain how it differs from a transpiler. 
2. **Coding:** Write a polyfill for the `String.prototype.startsWith()` method and test it on an array 
of strings. 
3. **Exploration:** Investigate how modern build tools like Babel and core-js work together to 
provide polyfills based on targeted browsers. How can you reduce the number of polyfills included in 
your bundle? 
 
 
 


---

 
216
Explain memoization 
Explain memoization 
 
In computing, **memoization** is an optimization technique that caches the results of expensive 
function calls and returns the cached result when the same inputs occur again. Memoization stores 
results in a cache to reduce processing time and memory, particularly when calls are expensive. 
 
### Why use memoization 
 
Many algorithms repeatedly compute the same subproblems (e.g., in recursion). Without 
memoization, each call recomputes results, wasting time. Memoization saves results in a lookup 
table so that repeated calls with the same arguments are instantaneous. This is especially useful for 
functions with deterministic outputs (pure functions) where the same input always yields the same 
output. 
 
### Implementing memoization in JavaScript 
 
A common pattern uses closures to create a cache: 
 
```js 
function memoize(fn) { 
  const cache = {}; 
  return function (...args) { 
    const key = JSON.stringify(args); 
    if (key in cache) { 
      return cache[key]; // return cached result 
    } 
    const result = fn.apply(this, args); 
    cache[key] = result; 
    return result; 
  }; 
} 
 


---

 
217
// Example: memoized Fibonacci 
function fib(n) { 
  if (n <= 1) return n; 
  return fib(n - 1) + fib(n - 2); 
} 
const memoizedFib = memoize(fib); 
console.log(memoizedFib(35)); // computed 
console.log(memoizedFib(35)); // cached 
``` 
 
The `memoize` helper returns a new function that checks the cache before invoking the original 
function. The key is derived from the arguments so each input set gets its own cached result. 
 
### Considerations 
 
- Memoization is most effective for pure functions with no side effects. Functions that depend on 
external state or cause side effects should not be memoized. 
- Caching consumes memory; use strategies like size limits (LRU caches) or TTL (time-to-live) to avoid 
excessive memory usage. 
- Functions with complex arguments may need custom key generators instead of simple JSON 
stringification. 
 
### Practice questions 
 
1. **Theory:** Explain why memoization improves performance in recursive algorithms like 
Fibonacci. 
2. **Coding:** Implement a memoized version of a function that computes factorials. Compare its 
performance to a naive recursive version for large inputs. 
3. **Exploration:** Research how libraries like Lodash's `_.memoize` implement memoization and 
how you might customize the cache behavior. 
 
 
 


---

 
218
What are generators and iterators 
What are generators and iterators 
 
Think of an **iterable** as something you can loop over, one item at a time. Arrays, strings, and 
Maps are all iterables in JavaScript. What makes them iterable is that they implement a special 
protocol: when you start iterating (for example, with `for...of`), JavaScript calls a method named 
`Symbol.iterator` on the object to get an **iterator**. 
 
An **iterator** is just an object with a `next()` method. Each call to `next()` returns an object with 
two properties: 
 
- `value`: the next item in the sequence. 
- `done`: a boolean that tells whether the sequence is finished. 
 
Here's a simple iterator for counting from 1 to 5: 
 
```js 
const counter = { 
  current: 1, 
  last: 5, 
  [Symbol.iterator]() { 
    return { 
      next: () => { 
        if (this.current <= this.last) { 
          return { value: this.current++, done: false }; 
        } 
        return { done: true }; 
      }, 
    }; 
  }, 
}; 
 


---

 
219
// You can iterate with for...of: 
for (const num of counter) { 
  console.log(num); // logs 1, 2, 3, 4, 5 
} 
``` 
 
When you call `for...of` on `counter`, JavaScript calls `counter[Symbol.iterator]()` to get the iterator. It 
then repeatedly calls `next()`, pulling values until `done` becomes `true`. Because each value is 
computed only when requested, iterators can represent very large or even infinite sequences 
without storing everything in memory. 
 
### Generator functions: a shortcut for writing iterators 
 
Writing custom iterator objects by hand can be verbose. **Generator functions**—declared with 
`function*`—make this easier. When you call a generator function, it doesn't run immediately; 
instead, it returns a **generator object**. This object is both iterable and an iterator. Inside the 
generator, you use `yield` to produce values one at a time. Execution "pauses" at each `yield` and 
resumes when `next()` is called again. 
 
Let's rewrite the counter using a generator: 
 
```js 
function* countUpTo(max) { 
  for (let i = 1; i <= max; i++) { 
    yield i; // pause here and return the value 
  } 
} 
 
const numbers = countUpTo(5); 
for (const n of numbers) { 
  console.log(n); // 1, 2, 3, 4, 5 
} 
``` 


---

 
220
 
Because `yield` pauses the function, generators naturally maintain state between iterations. They 
also let you: 
 
- **Send values back in**: When calling `next(value)`, the `value` becomes the result of the previous 
`yield` expression. This can be used to modify the generator's internal logic. 
- **Finish early**: Calling `return(value)` on a generator ends it early and returns `value` as the final 
result. 
- **Throw errors into the generator**: Calling `throw(error)` will cause the corresponding `yield` 
expression to throw, letting you handle errors inside the generator. 
 
Here's a more interesting example: an infinite Fibonacci sequence generator: 
 
```js 
function* fibonacci() { 
  let a = 0, 
    b = 1; 
  while (true) { 
    yield a; 
    [a, b] = [b, a + b]; 
  } 
} 
 
const fib = fibonacci(); 
console.log(fib.next().value); // 0 
console.log(fib.next().value); // 1 
console.log(fib.next().value); // 1 
console.log(fib.next().value); // 2 
// ...and so on, potentially forever 
``` 
 
Since the generator never finishes by itself, you must decide when to stop iterating—either by 
breaking a loop after a few values or by calling `return()`. 


---

 
221
 
### Summary for beginners 
 
- An **iterable** is anything you can loop over with `for...of`. It must implement `Symbol.iterator` 
and return an iterator. 
- An **iterator** is an object with a `next()` method that returns `{ value, done }`. You control how 
values are produced. 
- **Generator functions** (`function*`) are a convenient way to create iterators. Each `yield` 
produces a value and pauses the function until the next value is requested. 
- Generators simplify stateful or infinite sequences and let you write cleaner asynchronous code 
(when combined with `async` generators). 
 
By understanding these concepts, you can build custom sequences on demand and handle complex 
iteration patterns more cleanly. 
 
### Use cases 
 
- Producing sequences lazily, like infinite series or streams of events. 
- Implementing asynchronous flow control using async generators (`async function*`) and `for await 
... of`. 
- Flattening nested structures by yielding values recursively. 
 
### Practice questions 
 
1. **Theory:** Describe the difference between an iterable and an iterator. What methods must an 
iterator implement? 
2. **Coding:** Write a generator function that yields values from a nested array (e.g., `[1, [2, 3], 4]`) 
in a single sequence. 
3. **Exploration:** Research async generators and `for await...of`. How do they simplify working 
with streams or asynchronous data sources? 
 
 
 


---

 
222
Explain currying and partial application 
Explain currying and partial application 
 
Think of a multi-argument function like a machine with several input slots. **Currying** turns that 
machine into a series of single-slot machines chained together. Each call fills one slot and returns a 
new function that expects the next input. The original function only runs when all slots have been 
filled. 
 
In concrete terms, if you start with a function `f(a, b, c)`, a curried version would look like `f(a)(b)(c)`. 
The function doesn't execute until you've provided all three arguments. That might seem strange at 
first, but it allows you to create partially specialized versions of the function by "locking in" some of 
the inputs. 
 
Here's the earlier example, annotated: 
 
```js 
// A normal 3-argument function 
function sum(a, b, c) { 
  return a + b + c; 
} 
 
// A curried version 
function currySum(a) { 
  return function (b) { 
    return function (c) { 
      return a + b + c; 
    }; 
  }; 
} 
 
// Fill the arguments one by one 
const add1 = currySum(1); // returns a function waiting for b and c 
const add1and2 = add1(2); // returns a function waiting for c 


---

 
223
console.log(add1and2(3)); // prints 6 (1+2+3) 
``` 
 
A helper function can automate currying so you don't have to write nested functions by hand, but 
the idea is the same: you gradually supply arguments until the function has enough to run. 
 
--- 
 
### Partial application 
 
**Partial application** is a looser technique: it lets you pre-fill **some** arguments of a function to 
create a new function. Unlike curried functions, the partially applied function still expects all 
remaining arguments at once. In the example you provided: 
 
```js 
function multiply(a, b, c) { 
  return a * b * c; 
} 
 
function partial(fn, ...fixedArgs) { 
  return function (...restArgs) { 
    return fn(...fixedArgs, ...restArgs); 
  }; 
} 
 
const doubleAndTriple = partial(multiply, 2, 3); // fixes a = 2, b = 3 
console.log(doubleAndTriple(4)); // 24 (2 * 3 * 4) 
``` 
 
Here, `doubleAndTriple` is a new function where two of the original three arguments are pre-set, and 
you only need to supply the last one. Partial application can also be done with built-in methods like 
`Function.prototype.bind()`, which fixes the `this` context and leading arguments. 
 


---

 
224
--- 
 
### When are these useful? 
 
- **Creating specialized functions**: Suppose you have a logging function `log(level, namespace, 
message)`. You can curry or partially apply it to make a `debugLog = log.bind(null, 'debug', 'MyApp')` 
so you only need to supply the message. 
- **Function composition**: In functional programming, you often build complex behavior by 
composing small functions. Curried functions make composition easier because they always return 
unary functions. 
- **Reusable configuration**: If a function accepts many configuration options, currying lets you 
create pre-configured versions for different situations (e.g., 
`makeApiCall(baseURL)(endpoint)(params)`). 
- **Readable callbacks**: Sometimes event handlers or array methods require a callback with a 
single parameter. Currying can wrap a multi-argument function into the expected signature while 
keeping the original logic intact. 
 
For beginners, it helps to see currying and partial application as ways to reuse and adapt functions 
without rewriting them. Currying breaks a function into a chain of one-argument steps, while partial 
application "locks in" some arguments and returns a function that expects the rest. Both are 
powerful techniques for writing flexible, declarative code once you get comfortable with passing 
functions around. 
 
### Differences between currying and partial application 
 
- **Arity** - Currying always returns unary functions; partial application may return functions that 
expect multiple arguments. 
- **Execution** - Curried functions wait until called with all arguments; partial application returns a 
new function that calls the original with a mix of fixed and new arguments. 
- **Implementation** - Currying typically uses nested functions and may provide a flexible wrapper 
that collects arguments until the original arity is met. Partial application uses `bind()` or a wrapper to 
pass preset arguments. 
 
### Use cases 
 
- Creating specialized functions such as logging functions with preset date or level. 
- Building composable functions in functional programming. 


---

 
225
- Simplifying event handlers by pre-filling context. 
 
### Practice questions 
 
1. **Theory:** Explain how currying transforms a two-argument function into a series of unary 
functions. How does partial application differ? 
2. **Coding:** Write a curry helper that converts any three-argument function into a curried 
version. Test it with a function that concatenates three strings. 
3. **Exploration:** Consider the `Function.prototype.bind()` method. How can it be used for partial 
application? What are the limitations compared to writing your own partial helper? 
 
 
 


---

 
226
What is the Intl API and how is it used for localization? 
What is the Intl API and how is it used for localization 
 
Internationalizing applications involves presenting dates, numbers, lists and messages in formats that 
users expect based on their locale. The **Intl** object is a namespace providing the ECMAScript 
Internationalization API. It exposes constructors such as `Intl.DateTimeFormat`, `Intl.NumberFormat`, 
`Intl.ListFormat` and others. According to MDN, the Intl API offers language-sensitive string 
comparison, number formatting and date/time formatting and provides standard ways to display 
data in a user's locale. 
 
### Locale identifiers 
 
Locales are strings like `'en-US'` (English, United States) or `'fr-FR'` (French, France). They may include 
language, country and optional numbering system or calendar (e.g., `'de-DE-u-ca-gregory'`). The Intl 
API uses the best available locale fallback when a specific locale is not fully supported. 
 
### Formatting dates and times 
 
`Intl.DateTimeFormat` formats dates and times according to locale. You can pass options to specify 
styles (e.g., `'long'` or `'short'`): 
 
```js 
const date = new Date("2025-11-06T08:30:00Z"); 
const fr = new Intl.DateTimeFormat("fr-FR", { 
  dateStyle: "long", 
  timeStyle: "short", 
}); 
console.log(fr.format(date)); // "6 novembre 2025 à 09:30" (example) 
``` 
 
### Formatting numbers and currencies 
 
`Intl.NumberFormat` formats numbers, currencies and percentages. Options allow specifying 
minimum decimals, currency display and grouping: 


---

 
227
 
```js 
const price = 1234.5; 
const usd = new Intl.NumberFormat("en-US", { 
  style: "currency", 
  currency: "USD", 
}); 
const de = new Intl.NumberFormat("de-DE", { 
  style: "currency", 
  currency: "EUR", 
}); 
console.log(usd.format(price)); // "$1,234.50" 
console.log(de.format(price)); // "1.234,50 €" 
``` 
 
MDN notes that `Intl.NumberFormat` is used to create language-sensitive number formatting. 
 
### Other Intl features 
 
- **RelativeTimeFormat** formats phrases like "in 3 minutes" or "5 days ago". 
- **ListFormat** formats lists using conjunctions appropriate to the locale (e.g., "A, B and C" vs "A, B 
y C"). 
- **Collator** compares and sorts strings according to language-specific rules, useful for ordering 
names or dictionary entries. 
- **PluralRules**, `DateTimeFormat`, `NumberFormat` and `UnitFormat` help handle pluralization, 
numeric units and measurement systems. 
 
### Practical use of Intl 
 
Using Intl helps avoid writing custom formatting logic and improves consistency across browsers. It is 
not a translation library; it formats data, not text. For full localization you still need to translate 
messages separately. Many frameworks integrate Intl, and Node.js includes Intl by default. 
 


---

 
228
### Practice questions 
 
1. **Theory:** What is the purpose of the Intl API? List three constructors provided by Intl and their 
roles. 
2. **Coding:** Format the number `12345.6789` as currency in Japanese yen and as a percentage in 
German locale using `Intl.NumberFormat`. 
3. **Exploration:** Research how `Intl.RelativeTimeFormat` can be used to display relative dates 
(e.g., "yesterday", "in 2 weeks"). Implement a helper that takes a number of days and returns a 
human-readable relative time string for different locales. 
 
 
 


---

 
229
Explain the repaint and reflow process in browsers 
# Explain the repaint and reflow process in browsers 
 
## Introduction 
 
When you build a web page, the browser has to calculate how every element should 
appear and then draw those pixels to the screen. **Reflow** and **repaint** are 
two distinct steps in this rendering pipeline. Understanding what triggers 
reflows versus repaints helps you write more efficient code and avoid janky 
interfaces. In simple terms, reflow changes the **layout** of elements 
(positions and sizes), while repaint changes only the **visual appearance** 
(colours, backgrounds, shadows) without moving anything. 
 
## Detailed explanation 
 
### What is a reflow? 
 
Reflow (also called **layout**) occurs when the browser recalculates the 
geometry and position of elements. Any change that affects an element's 
layout—such as adding or removing DOM nodes, changing the `display` or 
`position` CSS property, toggling a class that changes `margin` or `font-size`, 
or resizing the browser window—forces the browser to walk through the DOM 
tree, measure elements and determine their new positions. 
 
Reflows can be expensive because one element's layout often depends on its 
parents and children. Adjusting a single element can ripple up and down the 
DOM tree, causing the browser to recalculate many nodes. While 
modern engines optimize this process, large reflows can still block 
interactivity and cause "jank." 
 
### What is a repaint? 


---

 
230
 
Repaint (also called **render** or **redraw**) happens after the layout is 
calculated. It updates the visual styles of elements without affecting their 
geometry. Changing a colour, background image or visibility (`visibility: hidden`) 
triggers a repaint. Repaints are generally cheaper than reflows because the 
browser does not need to compute positions; it simply needs to fill new 
pixels. However, they still use resources and can be 
noticeable if triggered frequently. 
 
### Triggers and performance tips 
 
Common triggers for reflow include: 
 
- Adding, removing or moving DOM elements. 
- Changing display types (`display: none` ↔ `block`), fonts or sizes. 
- Resizing the window or an element. 
- Calculating sizes with properties like `offsetHeight` or `getComputedStyle`. 
 
Triggers for repaint include: 
 
- Changing colour, background, borders or shadows. 
- Adjusting `visibility` or `outline`. 
 
To minimize performance hits: 
 
1. **Batch DOM changes**: group multiple style or DOM changes together rather 
   than interleaving reads and writes. This reduces repeated reflows. 
2. **Use CSS classes** instead of repeatedly modifying inline styles. One 
   class change triggers a single reflow. 
3. **Avoid layout thrashing**: reading layout properties like 
   `offsetTop` or `clientHeight` immediately after writing styles forces the 


---

 
231
   browser to reflow synchronously. Cache values when possible. 
4. **Reduce deep nesting**: complex DOM hierarchies require more work during 
   reflow, so flatten your markup where practical. 
 
## Real-world analogy 
 
Imagine your browser is a moving company. A **reflow** is like rearranging 
furniture in a room—if you move a sofa, you might need to shuffle other pieces 
around to make everything fit again. A **repaint** is like repainting the 
walls or changing the curtains—nothing has moved, but the appearance has 
changed. Painting the walls is quicker than moving furniture, but doing either 
too often will tire the crew. 
 
## Example 
 
Here's a simple demonstration of how different changes affect the rendering 
process: 
 
```html 
<style> 
  .box { 
    width: 100px; 
    height: 100px; 
    background: skyblue; 
    margin: 10px; 
  } 
  .moved { 
    margin-top: 100px; 
  } /* triggers reflow */ 
  .recolored { 
    background: salmon; 


---

 
232
  } /* triggers repaint */ 
</style> 
 
<div id="box" class="box"></div> 
<button id="move">Move</button> 
<button id="color">Change colour</button> 
 
<script> 
  const box = document.getElementById("box"); 
  document.getElementById("move").onclick = () => box.classList.toggle("moved"); 
  document.getElementById("color").onclick = () => 
    box.classList.toggle("recolored"); 
</script> 
``` 
 
Clicking "Move" adds or removes a class that changes the box's margin, causing 
a reflow because the layout changes. Clicking "Change colour" only changes the 
background colour, causing a repaint. 
 
## Common misconceptions 
 
- **"Repaints are free."** While cheaper than reflows, repaints still require 
  the browser to redraw pixels and can hurt performance if triggered rapidly. 
- **"Only DOM changes trigger reflow."** Reading layout properties can also 
  force a reflow if the browser must flush pending changes to answer your 
  query. 
- **"Reflows always block the UI."** Modern browsers perform some reflows 
  asynchronously or off the main thread, but large reflows can still cause 
  noticeable delays. 
 
## Practice questions 


---

 
233
 
1. What is the difference between repaint and reflow? 
2. Name two actions that trigger a reflow and two that trigger only repaint. 
3. Why is it beneficial to batch multiple DOM changes together? 
4. How might reading `offsetHeight` immediately after changing a style affect 
   performance? 
 
 
 


---

 
234
What is garbage collection and how does mark-and-
sweep work? 
# What is garbage collection and how does mark-and-sweep work? 
 
## Introduction 
 
In languages like C or C++, developers must manually allocate and free memory. 
JavaScript is more forgiving: it automatically reclaims memory that's no longer 
needed through **garbage collection (GC)**. GC makes it easier to write code 
without worrying about leaks, but understanding how it works helps you write 
more efficient and leak-free programs. 
 
## Reachability and memory management 
 
JavaScript engines consider objects **reachable** if they can be accessed from 
the code. Roots of reachability include global variables, variables on the 
current call stack and variables captured in closures. As long as there is a 
chain of references from a root to an object, that object stays in memory. 
Once there is no way to reach an object, it becomes eligible for garbage 
collection. 
 
## The mark-and-sweep algorithm 
 
The classic algorithm used by JS engines is **mark-and-sweep**: 
 
1. **Mark phase**: Starting from root objects, the GC traverses references and 
   marks each object it encounters as live or reachable. It follows all 
   property references, array elements, closures, etc., marking anything 
   connected to a root. 
2. **Sweep phase**: After marking, the GC scans through memory and frees any 


---

 
235
   object that was not marked. Unmarked objects are unreachable and their 
   memory is returned to the system. 
 
This algorithm avoids freeing objects that are still in use. Modern 
implementations add optimizations like **generational collection** and 
**incremental collection**: 
 
- _Generational GC_ divides objects into "new" and "old" generations. Most 
  objects die young, so the collector scans the young generation frequently and 
  the old generation less often. This reduces overall work because short-lived 
  objects are collected quickly. 
- _Incremental and idle-time GC_ break the mark-and-sweep work into smaller 
  chunks that run during idle moments, preventing long pauses that would 
  freeze the main thread. 
 
## Memory leaks and patterns 
 
Despite automatic GC, you can still create memory leaks: 
 
- **Lingering references**: Storing objects in long-lived containers (global 
  arrays, Maps, caches) prevents them from being collected. Clear entries 
  when you no longer need them. 
- **Detached DOM nodes**: Removing an element from the DOM does not free it if 
  your code still references it. Always nullify references to elements you 
  remove. 
- **Closures capturing unnecessary variables**: Capturing large objects in 
  closures may keep them alive longer than necessary. Avoid capturing heavy 
  data if you only need a small part. 
 
## Real-world analogy 
 


---

 
236
Imagine your working desk as computer memory. You keep important documents 
within reach (roots). Occasionally you clean your desk: you go through each 
document, marking which ones you still need. Anything unmarked is thrown 
away. To save time, you might check recent documents more often (generational 
GC) and tidy up small areas during breaks (incremental GC). 
 
## Example: monitoring memory usage 
 
While you cannot manually force garbage collection in most environments, you 
can write code that simulates leaks: 
 
```js 
// Simulate a leak by storing lots of data in a global array 
const cache = []; 
 
function allocate() { 
  // allocate ~1 MB string 
  const data = new Array(1024 * 1024).join("x"); 
  cache.push(data); 
  console.log("Allocated", cache.length, "MB"); 
} 
 
setInterval(allocate, 1000); 
 
// To fix the leak, clear the cache periodically 
setInterval(() => { 
  cache.splice(0, cache.length); 
  console.log("Cache cleared"); 
}, 10000); 
``` 
 


---

 
237
This code continuously allocates memory; clearing the cache allows the GC to 
reclaim it. Tools like Chrome DevTools' Memory panel help identify leaks. 
 
## Common misconceptions 
 
- **"Garbage collection is deterministic."** GC runs at unspecified times when 
  the engine decides memory needs to be reclaimed. You cannot rely on exact 
  timing. 
- **"Objects are collected immediately after they become unreachable."** 
  There may be delays; incremental GC might wait until the next idle period. 
- **"GC frees everything."** If you maintain references to objects (in caches, 
  closures or global variables) they remain reachable and won't be collected. 
 
## Practice questions 
 
1. What does it mean for an object to be "reachable" in JavaScript? 
2. Describe the two phases of the mark-and-sweep algorithm. 
3. How does generational garbage collection improve performance? 
4. Give an example of a memory leak in JavaScript and how to fix it. 
 
 
 


---

 
238
Explain shadowing and variable masking 
# Explain shadowing and variable masking 
 
## Introduction 
 
JavaScript variables live in _scopes_-regions of code where a name is defined. 
When a variable is defined in an inner scope with the same name as a variable in 
an outer scope, the inner variable **shadows** the outer one. Within the 
inner scope, references to that name refer to the inner variable, effectively 
masking the outer variable from access. Shadowing is a 
normal part of lexical scoping, but accidental shadowing can lead to bugs. 
 
## Understanding scope and shadowing 
 
Consider this example: 
 
```js 
let greeting = "Hello"; 
 
function sayHi() { 
  let greeting = "Hi"; // shadows the outer variable 
  console.log(greeting); // prints 'Hi' 
} 
 
sayHi(); 
console.log(greeting); // prints 'Hello' 
``` 
 
Inside `sayHi`, the `greeting` declared with `let` hides the `greeting` in the 
outer scope; the outer variable is still there but cannot be accessed until the 
inner scope ends. Once `sayHi` finishes, the outer `greeting` is used again. 


---

 
239
 
### Illegal shadowing 
 
Not all shadowing is legal. Mixing `var` and `let`/`const` for the same 
identifier in overlapping scopes can cause errors. Because `var` is 
function-scoped, declaring a `var` variable inside a block (`if`, `for`) leaks 
it to the entire function. If an outer scope already has a `let` variable 
with the same name, trying to declare a `var` inside will throw a 
`SyntaxError`. To avoid illegal shadowing, use `let` and 
`const` consistently and avoid reusing names. 
 
### Best practices 
 
- Use clear, descriptive variable names to reduce the chance of collisions. 
- Limit the scope of variables—declare them where they are needed. 
- Consider using linting tools (like ESLint) to warn about accidental 
  shadowing. 
- Avoid using `var` in modern code; prefer `let` and `const` to get 
  block-scoped variables. 
 
## Real-world analogy 
 
Imagine you work at an office with two break rooms (scopes). Both rooms have 
a coffee machine labeled "Coffee." When you're in the inner break room, 
pressing the "Coffee" button gives you the coffee from that room—not the 
coffee from the outer break room. Once you leave the inner room, the outer 
machine is available again. Similarly, inner variables take precedence over 
outer ones while inside that scope. 
 
## Example: pitfalls of shadowing 
 


---

 
240
```js 
const count = 10; 
 
function updateCount() { 
  // This inner count shadows the outer one.  Did we mean to overwrite it? 
  let count = count + 1; // ReferenceError: Cannot access 'count' before initialization 
} 
 
updateCount(); 
``` 
 
In `updateCount`, `let count` declares a new `count` in the function scope, 
which masks the outer `count`. However, JavaScript cannot initialize `count` 
with its own value (`count + 1`), because at that point the inner `count` is 
still uninitialized—leading to a `ReferenceError`. The fix is to use a 
different variable name or remove the `let` keyword. 
 
## Common misconceptions 
 
- **"Shadowing always causes errors."** Shadowing is often intentional (e.g., 
  looping variables). It only becomes problematic when you unintentionally 
  reuse a name and operate on the wrong variable. 
- **"Variables declared with `var` are block-scoped."** `var` is 
  function-scoped, so it can leak outside of block constructs and shadow 
  variables unexpectedly. 
 
## Practice questions 
 
1. What is variable shadowing and how does it relate to lexical scoping? 
2. Why can declaring a `var` variable inside a block cause a `SyntaxError` if 
   there is an outer `let` variable with the same name? 


---

 
241
3. How can you avoid accidental shadowing in your code? 
4. What happens in the code example above, and how would you fix it? 
 
 
 


---

 
242
What is event propagation and stopPropagation? 
# What is event propagation and `stopPropagation`? 
 
## Introduction 
 
Web pages are interactive thanks to **events**—clicks, key presses, 
scrolls, etc. When an event happens on an element, it doesn't just stay 
there; it propagates through the DOM. Understanding this propagation helps you 
decide where to attach event listeners and how to control event flow. 
 
## Phases of event propagation 
 
When an event is dispatched, it travels through three phases: 
 
1. **Capturing (trickling)** - The event moves down from the root (`window` or 
   `document`) through ancestors to the target element. By default, listeners 
   do not run during this phase unless `capture: true` is specified when 
   registering the listener. 
2. **Target** - The event reaches the target element and runs handlers attached 
   directly to it. 
3. **Bubbling** - After the target is processed, the event bubbles back up 
   through ancestors, invoking handlers on each. This is the default phase for 
   most event listeners. 
 
### `event.target` vs. `event.currentTarget` 
 
Inside an event handler, `event.target` refers to the element where the event 
originated, while `event.currentTarget` refers to the element whose listener is 
currently executing. When using event delegation (attaching a handler to a 
parent element to handle events from its children), check `event.target` to 
determine which child was clicked. 


---

 
243
 
## Stopping propagation 
 
Sometimes you need to prevent an event from reaching other listeners. Two 
methods are available: 
 
- **`event.stopPropagation()`** - Prevents the event from bubbling further up 
  the DOM. Other handlers on the current element will still run. 
- **`event.stopImmediatePropagation()`** - Stops bubbling and prevents any 
  remaining handlers on the current element from running. 
 
Stopping propagation can be useful when you want to ensure a handler runs 
exclusively or to prevent default behavior on parent elements. However, 
overusing it can make your code harder to reason about. Prefer letting events 
bubble and using event delegation when possible. 
 
## Capturing listeners 
 
To listen during the capturing phase, pass `{ capture: true }` as the third 
argument to `addEventListener()`. This is useful when you want a parent to 
intercept an event before it reaches the target. For example: 
 
```js 
document.addEventListener( 
  "click", 
  (e) => { 
    console.log("capturing at document"); 
  }, 
  { capture: true } 
); 
 


---

 
244
document.body.addEventListener("click", () => { 
  console.log("bubbling at body"); 
}); 
 
// Click anywhere on the page to see the order: capturing runs first 
``` 
 
## Real-world analogy 
 
Imagine shouting a message in a multi-story building. If you stand on the 
ground floor and call out someone's name, the sound travels up and down the 
stairs. People on lower floors hear it first (capturing), then the person you 
want hears it (target), then people on higher floors hear echoes as the sound 
bubbles back up. If someone interrupts and stops the message (calls 
`stopPropagation`), it doesn't go further. 
 
## Common misconceptions 
 
- **"`stopPropagation()` stops default actions."** It only affects 
  propagation; to prevent default actions (like following a link), call 
  `event.preventDefault()`. 
- **"Listeners always run during bubbling."** You can register listeners 
  during capturing by passing `{ capture: true }`. 
- **"`event.target` is always the element with the listener."** It refers to 
  the element where the event originated; `event.currentTarget` may be 
  different if you attached the listener to an ancestor. 
 
## Practice questions 
 
1. What are the three phases of event propagation? 
2. When would you use `event.stopPropagation()` versus 


---

 
245
   `event.stopImmediatePropagation()`? 
3. How do `event.target` and `event.currentTarget` differ? 
4. How do you attach a handler to run during the capturing phase? 
 
 
 


---

 
246
What is Symbol in JavaScript? 
# What is a `Symbol` in JavaScript? 
 
## Introduction 
 
Symbols are a primitive data type introduced in ES6. They were added to 
provide unique, non-string keys for object properties. Each symbol value is 
guaranteed to be unique—even if two symbols are created with the same 
description—and cannot be automatically converted to a string. 
Because of these qualities, symbols are ideal for defining "hidden" or 
collision-free properties on objects. 
 
## Key characteristics 
 
- **Uniqueness** - Every call to `Symbol()` returns a distinct value. Even 
  symbols created with the same description are not equal. 
  ```js 
  const s1 = Symbol("id"); 
  const s2 = Symbol("id"); 
  console.log(s1 === s2); // false 
  ``` 
- **Immutability** - A symbol's value cannot be changed. 
- **Non-enumerability** - Properties keyed by symbols do not appear in 
  `for...in` loops or `Object.keys()` results. Use 
  `Object.getOwnPropertySymbols(obj)` to retrieve them. 
- **Global registry** - `Symbol.for(key)` checks a runtime-wide registry. If a 
  symbol with the given key exists, it returns it; otherwise, it creates one. 
  This allows sharing symbols across modules. 
- **Well-known symbols** - JavaScript defines built-in symbols that change 
  how objects behave. Examples include `Symbol.iterator` (makes an object 
  iterable), `Symbol.toStringTag` (defines the default string tag of an 


---

 
247
  object) and `Symbol.hasInstance` (customizes `instanceof`). 
 
## Creating and using symbols 
 
### Basic usage 
 
```js 
const secret = Symbol("secretId"); 
const user = { 
  name: "Alice", 
  [secret]: 12345, // Symbol as property key 
}; 
 
console.log(user.name); // "Alice" 
console.log(user[secret]); // 12345 
``` 
 
The `secret` property is not visible with typical enumeration methods. It can 
only be accessed by using the symbol variable itself. 
 
### Global registry 
 
```js 
const uid1 = Symbol.for("uid"); 
const uid2 = Symbol.for("uid"); 
console.log(uid1 === uid2); // true - retrieved the same symbol 
console.log(Symbol.keyFor(uid1)); // 'uid' 
``` 
 
Using `Symbol.for()` is useful for sharing a symbol across different parts of 
your code base; it stores the symbol in the global symbol registry. 


---

 
248
 
## Real-world analogy 
 
Think of symbols like secret identifiers. Imagine you're labeling files in 
office drawers. You can write any label (string) on a folder, but two people 
might choose the same label and accidentally put their files together. Symbols 
are like using a unique, secret sticker that only you know. Even if others 
describe the sticker the same way, their stickers will be different and 
won't collide with yours. 
 
## Common misconceptions 
 
- **"Symbols are private variables."** They can't be accessed accidentally 
  through normal property iteration, but any code that holds a reference to the 
  symbol can access the property. 
- **"Symbols replace strings for all keys."** Symbols are useful for 
  unique, hidden keys or when customizing built-in behavior. For normal 
  property keys, strings are perfectly fine. 
- **"Symbols are convertible to strings."** Symbols do not implicitly convert 
  to strings; trying to concatenate one throws a `TypeError`. Use 
  `String(sym)` or `sym.description` for debugging. 
 
## Practice questions 
 
1. What makes each `Symbol()` unique? 
2. How do symbol-keyed properties differ from string-keyed properties in 
   enumeration? 
3. What is the purpose of `Symbol.for()`? 
4. Name two well-known symbols and describe their use. 
 
 
 


---

 
249
What is WeakMap and WeakSet? 
# What is `WeakMap` and `WeakSet`? 
 
## Introduction 
 
ES6 introduced **WeakMap** and **WeakSet**—specialized collections that hold 
objects and allow them to be garbage-collected if there are no other references. 
Unlike regular `Map` and `Set`, they provide _weak references_ to their 
contents, which helps avoid memory leaks when associating data with objects. 
 
## WeakMap 
 
A **WeakMap** is a collection of key/value pairs where keys must be objects or 
non-registered symbols. The value can be any type. The 
important characteristic is that a key's presence in a WeakMap does **not** 
prevent the object from being garbage-collected. When the 
key object is collected, its entry in the WeakMap disappears automatically. 
 
Because keys may disappear unpredictably, WeakMaps do **not** support 
iteration methods (`forEach`, `keys`, `values`, etc.) or a `size` property—if 
they did, iterating over keys would reveal when garbage collection happens, 
making behavior non-deterministic. 
 
### Example usage 
 
```js 
const cache = new WeakMap(); 
 
function getData(obj) { 
  if (cache.has(obj)) return cache.get(obj); 
  const data = heavyComputation(obj); 


---

 
250
  cache.set(obj, data); 
  return data; 
} 
 
let key = {}; 
getData(key); // stores data in cache 
key = null; // drop the only reference to the key 
// at some point later, the key and its associated data will be collected 
``` 
 
WeakMap is useful for storing metadata or caching results associated with 
objects without preventing them from being freed. 
 
## WeakSet 
 
A **WeakSet** is a collection of objects or non-registered symbols. 
Each value may appear only once, and like WeakMap keys, values are held 
weakly. If an object stored in a WeakSet has no other references, it can be 
garbage-collected, and its entry vanishes. WeakSets also lack 
iteration methods and a `size` property for the same reason: values can 
disappear at any time. 
 
### Example usage 
 
```js 
const visited = new WeakSet(); 
 
function process(node) { 
  if (visited.has(node)) { 
    return; // avoid processing the same node twice 
  } 


---

 
251
  visited.add(node); 
  // ... process node ... 
} 
 
// When node is removed elsewhere and no longer referenced, 
// it will automatically disappear from visited 
``` 
 
## Real-world analogy 
 
Imagine renting lockers (objects) at a gym. You keep a notebook to track which 
locker holds which customer's clothes. If a customer leaves and clears out 
their locker (no other references), the locker and its entry in your notebook 
are freed automatically. You don't maintain a master list of all lockers in 
use because people leave at different times. WeakMap and WeakSet behave 
similarly: they store data associated with objects, but entries vanish when 
those objects are no longer needed. 
 
## Common misconceptions 
 
- **"WeakMap keeps objects alive."** The key's reference is weak; it does not 
  prevent garbage collection. 
- **"You can iterate over WeakMap/WeakSet."** They deliberately omit 
  iteration methods to hide garbage collection behavior. 
- **"WeakMap can have string keys."** Only objects and non-registered symbols 
  are allowed as keys. 
 
## Practice questions 
 
1. Why do WeakMaps and WeakSets not support iteration? 
2. What kinds of keys/values can be stored in a WeakMap and WeakSet? 


---

 
252
3. Describe a scenario where a WeakMap is preferable to a regular Map. 
4. What happens when the only reference to an object stored in a WeakSet is 
   removed? 
 
 
 


---

 
253
What are Map and Set and how do they differ from 
objects? 
# What are `Map` and `Set`, and how do they differ from objects? 
 
## Introduction 
 
ES6 introduced two new collection types—`Map` and `Set`—that complement 
traditional objects and arrays. They offer more flexible key and value 
handling, deterministic iteration order and convenient methods. Understanding 
how they differ from plain objects helps you choose the right data structure. 
 
## `Map` 
 
A `Map` is a collection of key/value pairs. The key can be **any type**— 
object, number, string, boolean, symbol, even `NaN`—and the value can also be 
any type. Maps preserve insertion order and provide built-in methods to 
manipulate and inspect entries. In contrast, plain objects only accept 
strings or symbols as keys (other types are coerced to strings). 
 
### Key features of `Map` 
 
- **Arbitrary key types**: keys retain their type and are compared using the 
  SameValueZero algorithm, meaning `NaN` is considered equal to itself. 
- **Insertion order**: when iterating, entries are returned in the order they 
  were inserted. 
- **Size property**: `map.size` returns the number of entries. 
- **Convenient methods**: `set(key, value)`, `get(key)`, `has(key)`, 
  `delete(key)`, `clear()`, and iteration methods like `map.keys()`, 
  `map.values()`, `map.entries()`. 
- **Object keys**: maps allow using objects as keys without converting them to 


---

 
254
  strings. 
 
### Example 
 
```js 
const m = new Map(); 
m.set("a", 1); 
m.set(42, "answer"); 
const objKey = { id: 1 }; 
m.set(objKey, "object value"); 
 
console.log(m.get("a")); // 1 
console.log(m.get(42)); // 'answer' 
console.log(m.get(objKey)); // 'object value' 
console.log(m.size); // 3 
 
for (const [key, value] of m) { 
  console.log(key, value); 
} 
``` 
 
## `Set` 
 
A `Set` is a collection of **unique values**. Like `Map`, it 
preserves insertion order and provides methods to manipulate its contents. The 
main idea is that a value can appear only once; repeated calls to `set.add(value)` 
have no effect. 
 
### Key features of `Set` 
 
- **Uniqueness**: values are stored once; duplicates are ignored. 


---

 
255
- **Any value type**: numbers, strings, objects, etc., can be added. 
- **Methods**: `add(value)`, `has(value)`, `delete(value)`, `clear()`, 
  `size`, and iteration via `for...of`, `set.keys()`, `set.values()`, and 
  `set.entries()` (entries return `[value, value]` for compatibility). 
- **Efficient lookups**: checking membership with `set.has(value)` is typically 
  O(1), while checking `array.includes(value)` is O(n). 
 
### Example 
 
```js 
const s = new Set(); 
s.add("apple"); 
s.add("banana"); 
s.add("apple"); // duplicate ignored 
 
console.log(s.size); // 2 
console.log(s.has("banana")); // true 
 
for (const item of s) { 
  console.log(item); // 'apple', then 'banana' 
} 
``` 
 
## Differences from plain objects 
 
 
## When to use each 
 
- Use **`Map`** when you need keys of any type, want predictable iteration order, 


---

 
256
  or need a large dictionary with frequent insertions/deletions. 
- Use **`Set`** when you need a collection of unique values, such as tracking 
  unique visitors or removing duplicates from an array. 
- Use **plain objects** for simple key/value pairs where keys are known and 
  string/symbol keys are sufficient—objects have less overhead and simpler 
  syntax. 
 
## Practice questions 
 
1. What key types can a `Map` accept compared to a plain object? 
2. How does a `Set` ensure that each value is stored only once? 
3. Name two advantages of using a `Map` over an object. 
4. When might a plain object be more appropriate than a `Map` or `Set`? 
 
 
 


---

 
257
Explain shallow copy vs deep copy 
# Explain shallow copy vs deep copy 
 
## Introduction 
 
When you copy objects or arrays in JavaScript, you can do so **shallowly** or 
**deeply**. Understanding the difference is critical when working with 
complex data structures. A **shallow copy** duplicates only the top-level 
properties; nested objects or arrays are shared between the source and the copy. 
A **deep copy** duplicates every level of the 
structure so that the copy is entirely independent. 
 
## Shallow copy 
 
A shallow copy produces a new object whose properties point to the same values 
as the original. If those values are primitives (numbers, strings, booleans), 
the copy has its own copy of the primitive. If they are objects or arrays, 
both objects reference the same nested object. Mutating nested data affects 
both the original and the copy. 
 
### Example 
 
```js 
const original = { 
  name: "Alice", 
  address: { city: "Miami" }, 
  scores: [10, 20], 
}; 
 
const shallow = { ...original }; // spread syntax creates a shallow copy 
 


---

 
258
shallow.name = "Bob"; // affects only the copy 
shallow.address.city = "Tampa"; // affects both shallow and original 
shallow.scores.push(30); // affects both arrays 
 
console.log(original.address.city); // 'Tampa' 
console.log(original.scores); // [10, 20, 30] 
``` 
 
All standard built-in copy operations—spread syntax (`{...obj}`), 
`Array.prototype.concat()`, `Array.prototype.slice()`, `Object.assign()`—create 
**shallow copies**. 
 
### When to use shallow copies 
 
Shallow copies are efficient for flat objects (no nested references) or when 
you intentionally want the copy to share nested structures with the original. 
For instance, copying a configuration object that contains immutable nested 
objects is safe. 
 
## Deep copy 
 
A deep copy duplicates everything recursively, so that the new object shares no 
references with the original. Modifying the copy does not affect the 
original and vice versa. Deep copies are necessary 
when working with mutable nested data that should be independent. 
 
### Ways to deep copy 
 
1. **Recursive copying**: write a function that iterates through properties and 
   recursively copies objects and arrays. 
2. **JSON serialization**: for JSON-friendly data, you can use 


---

 
259
   `JSON.parse(JSON.stringify(obj))`. This method fails for functions, 
   `Date`, `Map`, `Set`, `undefined`, and cyclic structures. 
3. **`structuredClone()`**: a built-in method that deep clones objects and 
   supports many types and cyclic references; see the next topic for more details. 
 
### Example using `structuredClone()` 
 
```js 
const original = { date: new Date(), list: [1, 2, 3] }; 
const deep = structuredClone(original); 
 
deep.list.push(4); 
console.log(original.list); // [1, 2, 3] - unchanged 
 
// Changing the date in the original doesn't affect the copy 
original.date.setFullYear(2030); 
console.log(deep.date.getFullYear()); // original change has no effect 
``` 
 
## Real-world analogy 
 
Think of photocopying a document. A **shallow copy** is like making a copy 
where all attachments (post-it notes) remain stuck on the original. Both the 
original and copy share the same attachments, so moving or modifying an 
attachment affects both. A **deep copy** is like making a copy and reprinting 
all attachments separately; the new document has its own independent notes. 
 
## Common misconceptions 
 
- **"Spread syntax always makes a deep copy."** It only copies the first 
  level; nested objects remain shared. 


---

 
260
- **"Deep copies are always better."** They are more expensive to create and 
  may not be needed for flat structures. Use shallow copies when you don't 
  need full independence. 
- **"`JSON.parse(JSON.stringify())` can clone anything."** It cannot clone 
  functions, `Date`, `Map`, `Set`, undefined values, or cyclic references. 
 
## Practice questions 
 
1. What is the key difference between a shallow and deep copy? 
2. Name two methods to perform a deep copy. What are their limitations? 
3. Why might you choose a shallow copy over a deep copy in certain situations? 
4. What happens when you modify a nested object in a shallow copy? 
 
 
 


---

 
261
What is structuredClone? 
# What is `structuredClone`? 
 
## Introduction 
 
Deep copying complex objects in JavaScript can be tricky. Many popular 
techniques (spread syntax, `Object.assign`, `JSON.parse(JSON.stringify())`) fail 
for functions, dates, maps, sets, typed arrays, or cyclic structures. The 
`structuredClone()` method provides a built-in way to **deep clone** most 
JavaScript values safely. 
 
## What does `structuredClone()` do? 
 
`structuredClone()` creates a deep copy of a given value using the 
**structured clone algorithm**. It can clone primitives, 
plain objects, arrays, typed arrays, Maps, Sets, Dates, RegExps and more. 
The resulting clone is completely independent; changes to the clone do not 
affect the original. 
 
### Syntax 
 
```js 
const clone = structuredClone(value, options?); 
``` 
 
- **value**: any structured-cloneable type—primitives, objects, arrays, 
  typed arrays, Maps, Sets, Dates, etc. 
- **options** (optional): an object with a `transfer` property. You can 
  transfer **transferable objects** (ArrayBuffer, MessagePort) to the clone 
  instead of copying them. When an object is transferred, it is detached 
  from the original and attached to the new object. 


---

 
262
 
### Return value and exceptions 
 
The function returns a deep copy of the input. 
If any part of the input contains unserializable data (like DOM nodes, 
functions or WeakMaps), `structuredClone()` throws a `DataCloneError`. 
 
## Examples 
 
### Cloning basic objects and arrays 
 
```js 
const original = { a: 1, b: { c: 2 }, d: [3, 4] }; 
const copy = structuredClone(original); 
 
copy.b.c = 42; 
copy.d.push(5); 
console.log(original.b.c); // 2 - original unchanged 
console.log(original.d); // [3, 4] - original unchanged 
``` 
 
### Cloning and transferring an ArrayBuffer 
 
```js 
const buffer = new ArrayBuffer(8); 
const clone = structuredClone(buffer, { transfer: [buffer] }); 
 
// The original buffer is now detached and unusable 
console.log(buffer.byteLength); // 0 
console.log(clone.byteLength); // 8 
``` 


---

 
263
 
## Real-world analogy 
 
Imagine duplicating a file on your computer. A typical copy duplicates the 
file's contents, while leaving the original intact. `structuredClone()` is 
like using a special copying tool that not only handles simple documents but 
also copies entire folders, compressed files and even broken links—everything 
is duplicated accurately. If you choose to transfer a large folder instead 
of copying it, the original folder disappears and only the new one remains. 
 
## Common misconceptions 
 
- **"`structuredClone()` is the same as JSON serialization."** JSON serialization 
  cannot clone functions, dates, maps, sets or typed arrays, and it fails on 
  cyclic objects. `structuredClone()` handles many of these cases and 
  preserves special types. 
- **"It can clone any JavaScript value."** Some types (DOM nodes, functions, 
  WeakMap/WeakSet) are not structured-cloneable and will throw 
  `DataCloneError`. 
 
## Practice questions 
 
1. What does `structuredClone()` do that `JSON.parse(JSON.stringify())` cannot? 
2. What types can be transferred rather than cloned using the `transfer` option? 
3. What happens to the original object when you transfer a transferable 
   resource? 
4. Name two values that cannot be cloned with `structuredClone()`. 
 
 
 


---

 
264
What are Web Workers and when should you use 
them? 
# What are web workers and when should you use them? 
 
## Introduction 
 
JavaScript in the browser normally runs on a **single main thread** that 
handles user input, renders the page and executes your code. If your code 
performs a heavy computation, the browser cannot respond to user input until 
that computation finishes, leading to a frozen interface. **Web workers** 
provide a simple way to run scripts in background threads so long-running tasks 
don't block the UI. 
 
## What is a web worker? 
 
A web worker is created by calling `new Worker('worker.js')`, which spawns a 
new thread running the specified script. Workers have their own global 
context (similar to a separate window), cannot directly access the DOM and 
communicate with the main thread via message passing. Workers run scripts in background threads 
and can perform tasks without 
interfering with the user interface. Once created, a worker can 
send messages to the main thread and receive messages back using 
`postMessage()` and the `onmessage` event handler. 
 
### Basic structure 
 
**Main thread (page)** 
 
```js 
// main.js 
const worker = new Worker("worker.js"); 


---

 
265
 
worker.onmessage = (e) => { 
  console.log("Received from worker:", e.data); 
}; 
 
worker.postMessage({ type: "start", value: 40 }); 
 
// later, terminate the worker 
// worker.terminate(); 
``` 
 
**Worker script** 
 
```js 
// worker.js 
self.onmessage = (e) => { 
  const { type, value } = e.data; 
  if (type === "start") { 
    const result = fib(value); 
    self.postMessage(result); 
  } 
}; 
 
function fib(n) { 
  return n <= 1 ? n : fib(n - 1) + fib(n - 2); 
} 
``` 
 
Let's walk through the interaction step by step to see what each line does and when each handler is 
invoked. 
 


---

 
266
### 1. Creating the worker 
 
```js 
const worker = new Worker("worker.js"); 
``` 
 
On the main thread (the page), this line spawns a new background thread and instructs it to run the 
code contained in `worker.js`. A worker has its own global scope—separate from the main thread—
and cannot access the DOM or use most of the `window` object. The `Worker` constructor returns a 
`Worker` instance that the main thread can use to communicate with this background thread. 
 
### 2. Setting up a message handler on the main thread 
 
```js 
worker.onmessage = (e) => { 
  console.log("Received from worker:", e.data); 
}; 
``` 
 
The `onmessage` property of the `Worker` instance is an event handler for the `"message"` event. It 
is called whenever the worker thread sends a message back to the main thread. The handler receives 
an event object (`e`), whose `data` property contains whatever data the worker posted. At this point, 
nothing is called yet; you're just registering a callback so you can handle responses in the future. 
 
### 3. Posting a message to the worker 
 
```js 
worker.postMessage({ type: "start", value: 40 }); 
``` 
 
Here, the main thread sends a message to the worker. It uses `postMessage()`, which serializes the 
given data and delivers it to the worker thread. Because workers communicate via message passing, 
data is copied rather than shared. In this example, the main thread sends an object with a `type` of 
`"start"` and a `value` of `40`, instructing the worker to begin a computation. 


---

 
267
 
### 4. Handling the message in the worker 
 
In `worker.js`, the worker registers its own `onmessage` handler: 
 
```js 
self.onmessage = (e) => { 
  const { type, value } = e.data; 
  if (type === "start") { 
    const result = fib(value); 
    self.postMessage(result); 
  } 
}; 
``` 
 
The `self` keyword inside the worker refers to the worker's global scope. When the main thread calls 
`postMessage()`, the worker's `onmessage` handler fires, receiving the data in `e.data`. The worker 
checks the message type; if it is `"start"`, it calls the `fib()` function to compute the 40th Fibonacci 
number. After finishing, it calls `self.postMessage(result)` to send the result back to the main thread. 
 
### 5. Completing the round trip 
 
Once the worker posts the result, the browser delivers it to the main thread and triggers the handler 
you assigned earlier: 
 
```js 
worker.onmessage = (e) => { 
  console.log("Received from worker:", e.data); 
}; 
``` 
 
At this point, `e.data` contains the Fibonacci number computed in the worker. The callback logs the 
value. Any subsequent messages from the worker will also trigger this handler. 


---

 
268
 
### 6. Cleaning up 
 
If you no longer need the worker, you can terminate it: 
 
```js 
// worker.terminate(); 
``` 
 
Calling `terminate()` immediately stops the worker's thread and frees its resources. 
 
Putting it all together: the main thread creates a worker, sets up a response handler (`onmessage`), 
and sends a message using `postMessage()`. The worker receives that message in its own 
`onmessage` handler, performs the computation, and sends the result back using `postMessage()`. 
The main thread then receives the result via its `onmessage` callback. Because the heavy 
computation runs in a separate thread, the user interface remains responsive throughout. 
 
## Types of workers 
 
- **Dedicated workers**: The most common type. A dedicated worker is tied 
  to a single script. Only the thread that created it can communicate with it. 
- **Shared workers**: A shared worker can be accessed from multiple scripts 
  running in different windows or tabs, provided they are from the same origin. 
- **Service workers**: A special worker that intercepts network requests, 
  enabling offline caching and background sync. Service workers are not 
  directly used for computational tasks, but they share some worker 
  characteristics. 
 
## When to use web workers 
 
Use web workers when you need to perform CPU-intensive or blocking operations 
that would otherwise freeze the UI. Examples include: 


---

 
269
 
- **Data processing**: Sorting large arrays, parsing big JSON files, doing 
  cryptographic operations or image manipulation. 
- **Network requests**: Although fetch runs asynchronously, combining requests 
  with heavy processing (like decompressing large files) benefits from a worker. 
- **Real-time calculations**: Physics simulations or game logic. 
 
Avoid using a worker for simple tasks or frequent updates that would incur 
unnecessary message passing overhead. Also remember that workers cannot 
directly access DOM elements or most of the `window` object. 
 
## Real-world analogy 
 
Think of a web worker as a personal assistant. While you (the main thread) 
interact with users and handle immediate tasks, your assistant can work on a 
complex report in another room. You occasionally exchange notes (messages), 
but you don't look over each other's shoulders. If you want the report to 
stop, you tell your assistant to stop working (terminate the worker). 
 
## Common misconceptions 
 
- **"Web workers can access the DOM."** They cannot. Only the main thread can 
  manipulate the DOM. 
- **"Workers share memory with the main thread."** They communicate by copying 
  or transferring data via messages; data is not shared. 
- **"Workers always improve performance."** Spawning a worker has overhead. For 
  small tasks, it's cheaper to run them on the main thread. 
 
## Practice questions 
 
1. What problem do web workers solve? 


---

 
270
2. How do the main thread and a worker communicate? 
3. Why can't a worker access the DOM? 
4. When might using a worker be unnecessary or counterproductive? 
 
 
 


---

 
271
What are Service Workers and PWA concepts? 
# What Are Service Workers and PWA Concepts? 
 
Progressive Web Apps (PWAs) bridge the gap between traditional web pages and native applications. 
They use modern browser APIs to deliver reliable, installable, offline-capable experiences. At the 
heart of a PWA is the **service worker**, a script that runs separately from the main page and 
controls how the app interacts with the network. 
 
## What is a service worker? 
 
A service worker is a background script registered by your application. Once installed and activated, 
it sits between your app and the network, intercepting network requests and deciding how to 
respond. Because it runs independently of any web page, it can respond to events even when your 
site is not open. Service workers can: 
 
- **Cache assets and data** so your app can work offline or with poor connectivity. 
- **Serve cached responses** immediately while fetching updated data in the background. 
- **Manage background tasks** like push notifications or background sync. 
- **Act as a proxy** to modify or log requests and responses. 
 
Service workers have no direct access to the DOM. They communicate with pages via the 
`postMessage` API and must be served over HTTPS for security. 
 
### Lifecycle 
 
Service workers follow a predictable lifecycle: 
 
1. **Registration** - Your page calls `navigator.serviceWorker.register('/sw.js')` to start installing a 
worker. Registration happens on page load and must succeed before the service worker can control 
pages. 
2. **Installation** - The service worker downloads and runs the installation code. You typically 
pre-cache core assets in the `install` event so they are available offline. 
3. **Activation** - After installation, the service worker activates. It clears old caches and takes 
control of pages within its scope. New versions wait to activate until all pages using the old version 
are closed, so updates don't disrupt the current users. 


---

 
272
4. **Idle/Fetch** - Once active, the worker listens for events such as `fetch`, `push` and `sync`. It 
decides how to respond to network requests—either from the cache, network or a combination. 
 
Only one service worker can control a given scope (directory path) at a time. When you update your 
worker script, the browser downloads the new version, installs it in the background and waits to 
activate until the old version has no more clients. 
 
### Registering and using a service worker 
 
Here's a minimal example that installs a service worker and caches an asset: 
 
```js 
// main.js - register the service worker 
if ("serviceWorker" in navigator) { 
  window.addEventListener("load", () => { 
    navigator.serviceWorker.register("/sw.js").catch((err) => { 
      console.error("Service worker registration failed:", err); 
    }); 
  }); 
} 
 
// sw.js - service worker 
const CACHE_NAME = "pwa-cache-v1"; 
const ASSETS = ["/", "/styles.css", "/index.html", "/logo.png"]; 
 
self.addEventListener("install", (event) => { 
  // Pre-cache core assets 
  event.waitUntil( 
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)) 
  ); 
}); 
 


---

 
273
self.addEventListener("activate", (event) => { 
  // Remove old caches 
  event.waitUntil( 
    caches 
      .keys() 
      .then((keys) => 
        Promise.all( 
          keys 
            .filter((key) => key !== CACHE_NAME) 
            .map((key) => caches.delete(key)) 
        ) 
      ) 
  ); 
}); 
 
self.addEventListener("fetch", (event) => { 
  // Respond with cache first, then network 
  event.respondWith( 
    caches.match(event.request).then((cached) => { 
      return ( 
        cached || 
        fetch(event.request).then((response) => { 
          // Update the cache for next time 
          return caches.open(CACHE_NAME).then((cache) => { 
            cache.put(event.request, response.clone()); 
            return response; 
          }); 
        }) 
      ); 
    }) 
  ); 


---

 
274
}); 
``` 
 
In the example, the service worker caches static assets during installation and serves them from the 
cache when offline. It also updates the cache whenever a fresh version is downloaded. 
 
### PWA concepts beyond service workers 
 
1. **Web App Manifest** - A JSON file (`manifest.webmanifest`) describing your app's name, icons, 
theme colors and how it should appear when installed on a user's home screen. It allows users to 
add your PWA to their device. 
2. **HTTPS** - PWAs require secure contexts. Browsers block service worker registration on insecure 
origins to prevent man-in-the-middle attacks. 
3. **Responsive design** - PWAs should adapt to different screen sizes and device capabilities. 
4. **Installability** - When a PWA meets criteria (served over HTTPS, has a manifest, registered 
service worker and user engagement), the browser prompts users to install the app. 
5. **Offline and connectivity independence** - Caching and local data storage enable the app to 
function even when the network is unavailable. 
 
### Real-world analogy 
 
Imagine a restaurant that uses a **waiter** to handle orders. Instead of every customer shouting 
orders to the kitchen (the network), the waiter (the service worker) intercepts orders, writes them 
down, and checks if some meals are already prepared (cached). If the meal is ready, the waiter 
serves it immediately. Otherwise, the waiter sends the order to the kitchen and serves it when it's 
done. If the restaurant closes (the user goes offline), the waiter can still serve meals that were 
prepared earlier. 
 
### Common pitfalls and best practices 
 
- **Scope placement**: Place your service worker file at the top of the directory you want it to 
control. A worker registered at `/sw.js` controls the entire site, while `/blog/sw.js` only controls files 
under `/blog`. 
- **Updates not activating**: New versions wait until all pages using the old worker are closed. Use 
`self.skipWaiting()` in the `install` event and `clients.claim()` in the `activate` event to take control 
immediately, but beware that this can refresh pages unexpectedly. 


---

 
275
- **Caching too much**: Cache only assets that are necessary for offline use. Uncontrolled caching 
can fill storage or serve stale content. 
- **Offline fallbacks**: Provide fallback pages or messages when resources cannot be fetched. 
 
## Practice questions 
 
**Conceptual questions** 
 
1. What is a service worker and how does it differ from a regular web worker? 
2. Describe the lifecycle of a service worker. Why doesn't a new service worker take control 
immediately after installation? 
3. How does a Progressive Web App benefit from a service worker? List at least three capabilities. 
4. Why must service workers be served over HTTPS? 
5. Explain how caching strategies (cache-first, network-first, stale-while-revalidate) work. When 
would you use each? 
 
**Coding exercises** 
 
1. Write a script to register a service worker and log whether registration succeeded or failed. 
2. Modify the example service worker so that it serves a fallback HTML page (`offline.html`) when the 
requested page is not available offline and the network is down. 
3. Implement a caching strategy where the service worker always fetches resources from the 
network first and falls back to the cache if the network request fails. 
4. Add code to your service worker to display a push notification when receiving a `push` event. How 
would you handle the user clicking on the notification? 
 
 
 


---

 
276
Explain Promises.all, Promise.race, and 
Promise.allSettled 
# Explaining `Promise.all()`, `Promise.race()`, and `Promise.allSettled()` 
 
Modern JavaScript uses promises to represent asynchronous operations such as network requests, 
timers or file reads. When you have **multiple promises** that should run in parallel, the language 
provides helper methods to orchestrate them. The three most common helpers—`Promise.all()`, 
`Promise.race()`, and `Promise.allSettled()`—behave differently when resolving or rejecting a group 
of promises. Understanding these differences helps you choose the right tool for your scenario. 
 
## `Promise.all()` 
 
`Promise.all()` accepts an iterable (usually an array) of promises and returns a **new promise**. 
This returned promise fulfills when **every** input promise fulfills. If **any** input promise 
rejects, the returned promise rejects immediately with that reason. The order of results corresponds 
to the order of the input promises, not the order in which they resolved. 
 
Use `Promise.all()` when you need all results to continue—for example, fetching user details, 
preferences and settings before rendering a dashboard. It runs all promises concurrently and 
aggregates their results. 
 
```js 
// Fetch three resources concurrently 
const userPromise = fetch("/api/user"); 
const prefsPromise = fetch("/api/preferences"); 
const settingsPromise = fetch("/api/settings"); 
 
Promise.all([userPromise, prefsPromise, settingsPromise]) 
  .then(async ([userRes, prefsRes, settingsRes]) => { 
    // Parse JSON responses 
    const [user, prefs, settings] = await Promise.all([ 
      userRes.json(), 
      prefsRes.json(), 
      settingsRes.json(), 


---

 
277
    ]); 
    // Now we have all the data and can render 
    renderDashboard(user, prefs, settings); 
  }) 
  .catch((err) => { 
    // If any request failed, handle it here 
    console.error("At least one request failed:", err); 
  }); 
``` 
 
### Key points 
 
- The returned promise resolves to an **array of results** in the same order as the input promises. 
- If any promise rejects, the entire operation fails immediately. This is useful when you cannot 
proceed without all results. 
- The original promises continue running even if one rejects—you cannot cancel them with 
`Promise.all()` alone. 
 
## `Promise.race()` 
 
`Promise.race()` takes an iterable of promises and returns a promise that settles (fulfills or rejects) as 
soon as **the first input promise settles**. The returned promise adopts the value or reason of the 
first settled promise. 
 
Use `Promise.race()` when you want to proceed with whichever promise finishes first, regardless of 
success or failure. Common patterns include implementing timeouts or selecting the fastest source. 
 
```js 
// Timeout helper: rejects if a promise takes too long 
function withTimeout(promise, ms) { 
  return Promise.race([ 
    promise, 
    new Promise((_, reject) => 


---

 
278
      setTimeout(() => reject(new Error("Operation timed out")), ms) 
    ), 
  ]); 
} 
 
withTimeout(fetch("/api/data"), 3000) 
  .then((res) => res.json()) 
  .then((data) => console.log("Data loaded within 3s", data)) 
  .catch((err) => console.error(err.message)); 
``` 
 
### Key points 
 
- Whichever promise settles first (resolve or reject) decides the result. 
- Other promises keep running in the background; use cancellation mechanisms like 
`AbortController` to abort network requests if needed. 
- Suitable for implementing **fallbacks**, such as requesting data from multiple mirrors and using 
the first response. 
 
## `Promise.allSettled()` 
 
`Promise.allSettled()` returns a promise that fulfills **after all input promises have settled**, 
regardless of whether they fulfilled or rejected. The result is an array of objects describing the 
outcome of each promise. Each object has a `status` property (`'fulfilled'` or `'rejected'`) and either a 
`value` or a `reason` property. 
 
Use `Promise.allSettled()` when you want to wait for **all promises to finish** but don't want one 
failure to short-circuit the rest. For example, you might want to display partial results while noting 
which requests failed. 
 
```js 
const urls = ["/api/user", "/api/preferences", "/api/broken"]; 
const fetchPromises = urls.map((url) => fetch(url)); 


---

 
279
 
Promise.allSettled(fetchPromises).then((results) => { 
  results.forEach((result, index) => { 
    if (result.status === "fulfilled") { 
      console.log(`Request ${index} succeeded`); 
    } else { 
      console.warn(`Request ${index} failed:`, result.reason); 
    } 
  }); 
}); 
``` 
 
### Key points 
 
- Always resolves, never rejects. You handle successes and failures separately by inspecting each 
result. 
- The order of the results matches the order of the input promises. 
- Useful for parallel operations where failures are acceptable or expected (e.g., loading optional 
resources). 
 
## Choosing the right helper 
 
| Scenario                            | Use                    | 
| ----------------------------------- | ---------------------- | 
| Need all results or fail fast       | `Promise.all()`        | 
| Use the earliest result             | `Promise.race()`       | 
| Wait for all, regardless of outcome | `Promise.allSettled()` | 
 
### Real-world analogy 
 
Imagine ordering parts from several suppliers: 
 


---

 
280
- **`Promise.all()`** is like waiting for all your suppliers to deliver before you can start assembling. If 
any supplier fails to deliver, your project stalls. 
- **`Promise.race()`** is like taking the first quote that arrives. You proceed with whichever supplier 
responds first. 
- **`Promise.allSettled()`** is like checking in at the end of the day to see which suppliers delivered 
and which didn't. You then decide what to do with the partial orders. 
 
## Practice questions 
 
**Conceptual questions** 
 
1. Explain the difference between `Promise.all()` and `Promise.allSettled()`. When would you choose 
one over the other? 
2. In `Promise.race()`, what happens if the first promise rejects? How can you handle this case 
gracefully? 
3. Why does `Promise.all()` reject as soon as any promise rejects? How could you modify your code 
to collect all errors instead of failing fast? 
4. Describe a real use case for each of the three methods discussed. 
 
**Coding exercises** 
 
1. Write a function `loadAll(urls)` that takes an array of URLs, fetches them concurrently and returns 
an array of response bodies using `Promise.all()`. It should reject if any fetch fails. 
2. Implement a helper `firstResolved(promises)` that returns the value of the first fulfilled promise 
and ignores any rejections. Use `Promise.race()` along with additional logic to skip rejected promises. 
3. Write a function that fetches multiple resources and logs which succeeded and which failed using 
`Promise.allSettled()`. Then modify it to retry failed requests once. 
 
 
 


---

 
281
What is BigInt in JavaScript? 
# What Is `BigInt` in JavaScript? 
 
JavaScript's `number` type is a 64-bit double-precision floating-point value. This format can exactly 
represent integers up to 2⁵³ - 1 (9,007,199,254,740,991). Beyond this range, integer arithmetic loses 
precision, resulting in rounding errors. To solve this problem, ECMAScript introduced the **BigInt** 
type. 
 
## Introducing BigInt 
 
`BigInt` is a built-in primitive for representing **whole numbers of arbitrary size**. Unlike regular 
numbers, BigInt values can grow as large as memory allows without losing precision. You create a 
BigInt by either appending an `n` to an integer literal or by calling the `BigInt()` constructor. 
 
```js 
const huge1 = 9007199254740993n; // note the n suffix 
const huge2 = BigInt("123456789012345678901234567890"); 
 
console.log(huge1 + 2n); // 9007199254740995n 
console.log(huge2 * 10n); // 1234567890123456789012345678900n 
``` 
 
A BigInt literal cannot contain a decimal point or exponent; BigInt values always represent integer 
quantities. Internally, BigInts use an arbitrary-precision representation separate from the IEEE-754 
format used by `number`. 
 
### Operations on BigInts 
 
Most arithmetic operations (`+`, `-`, `*`, `/`, `%`, `**`) work with BigInts, but **you cannot mix BigInt 
and `number` in a single operation**. Doing so throws a `TypeError` to prevent implicit coercion and 
precision loss. Always convert between types explicitly: 
 
```js 
const n = 42; 


---

 
282
const big = 10n; 
 
// Invalid: TypeError 
// console.log(n + big); 
 
// Convert number to BigInt 
const result1 = BigInt(n) + big; // 52n 
 
// Convert BigInt to number (may lose precision if big is huge) 
const result2 = Number(big) + n; // 52 
``` 
 
Division with `/` returns a truncated result (any fractional part is discarded), because BigInt 
represents only whole numbers. Bitwise operators except `>>>` (unsigned right shift) work as well. 
 
### Limitations and caveats 
 
- **No mixing with regular numbers**: BigInts and numbers don't implicitly convert. Always cast 
explicitly. 
- **Math library is unsupported**: `Math` methods (`Math.sqrt`, `Math.sin`, etc.) do not accept 
BigInts. Use third-party libraries for advanced operations. 
- **JSON serialization**: `JSON.stringify()` throws when encountering a BigInt because JSON doesn't 
have a BigInt type. Convert BigInts to strings before serialization. 
- **Inconsistent API support**: Some browser APIs accept only numbers. Check whether BigInt is 
supported before using it. 
 
### When to use BigInt 
 
BigInt is useful when working with: 
 
- **Cryptography** and **large hashes** that require precise integer math. 
- **Financial and scientific calculations** where integer precision is critical. 


---

 
283
- **Counters** or **IDs** that can exceed the range of 64-bit numbers (e.g., blockchain block 
numbers). 
 
However, BigInts cannot represent decimal fractions. For currency calculations involving cents, 
consider using a decimal library or storing amounts as integers of the smallest unit (e.g., cents) with 
BigInt. 
 
### Real-world analogy 
 
Think of `number` as a **typical calculator**—it has a limited number of digits it can display. Once 
you exceed those digits, it starts rounding. BigInt is like a **scientific calculator** with expandable 
memory. It may be slower, but it allows you to keep adding digits without losing any. 
 
### Practice questions 
 
**Conceptual questions** 
 
1. What problem does BigInt solve that the regular `number` type cannot? Give an example where a 
`number` loses precision. 
2. How do you create a BigInt literal? Why can't BigInt values have decimals? 
3. Why does JavaScript throw a `TypeError` when you try to add a `number` to a BigInt? How can you 
perform such an addition correctly? 
4. List at least three use cases where BigInt is a better choice than `number`. 
5. What happens when you divide one BigInt by another? Explain why fractional results are handled 
the way they are. 
 
**Coding exercises** 
 
1. Implement a function `factorialBig(n)` that returns the factorial of a non-negative integer `n` using 
BigInt. For example, `factorialBig(20)` should return `2432902008176640000n`. 
2. Write a function that sums a list of numbers and BigInt values. It should return a BigInt and handle 
type conversions appropriately. 
3. Create a function `compareBig(a, b)` that accepts two numbers or BigInts (or a mix) and returns `-
1`, `0` or `1` depending on whether `a` is less than, equal to, or greater than `b`. 


---

 
284
4. Modify `JSON.stringify()` to serialize objects containing BigInts by converting them to strings. Write 
a helper `stringifyWithBigInt()` that replaces BigInts with their string representation before 
serialization. 
 
 
 


---

 
285
Explain dynamic imports and code splitting 
# Dynamic Imports and Code Splitting in JavaScript 
 
As applications grow, bundling all of your code into one large file slows down initial page loads. To 
improve performance, modern tools let you **split code into smaller chunks** that load only when 
needed. JavaScript's dynamic `import()` function plays a central role in this strategy. 
 
## Static vs. dynamic imports 
 
Traditionally, modules are loaded using static `import` statements: 
 
```js 
import { add } from "./math.js"; 
``` 
 
Static imports must appear at the top level of your file and are resolved during compilation. All 
dependencies get bundled into the initial script. In contrast, **dynamic imports** are functions that 
return a promise and can be called at runtime: 
 
```js 
// Load the math module only when needed 
async function onCalculate() { 
  const math = await import("./math.js"); 
  console.log(math.add(2, 3)); 
} 
 
button.addEventListener("click", onCalculate); 
``` 
 
With dynamic imports, you can load modules on demand, such as when a user clicks a button or 
navigates to a new route. This reduces the upfront cost of downloading code that might never be 
used. 
 


---

 
286
## Code splitting 
 
**Code splitting** is the practice of dividing your application code into separate bundles that can be 
loaded independently. When using bundlers like webpack, Rollup or Parcel, dynamic `import()` calls 
signal to the bundler that a new chunk should be created. Each chunk contains only the code 
necessary for that part of the application. 
 
Benefits of code splitting include: 
 
- **Faster initial load** - Users download only the core functionality needed to render the first 
screen. 
- **Lazy loading** - Additional features (e.g., an admin panel or charting library) load only when the 
user triggers them. 
- **Parallel downloads** - Browsers can download multiple chunks concurrently. 
 
### Naming and controlling chunks 
 
Many bundlers let you assign custom names to chunks for easier debugging and caching. In webpack, 
you can specify a `webpackChunkName` comment: 
 
```js 
import( 
  /* webpackChunkName: "chart" */ 
  "./components/Chart.js" 
).then((module) => { 
  const Chart = module.default; 
  new Chart(); 
}); 
``` 
 
The bundler generates a file like `chart.js` that is loaded only when the import is executed. 
 
## Real-world example: Route-based splitting 


---

 
287
 
In single-page applications (SPAs), it's common to split code by route. Each route's component and its 
dependencies are put into a separate chunk. When the user navigates to a route, the framework 
dynamically imports the component and displays it. For example, in React with React.lazy: 
 
```jsx 
import React, { Suspense } from "react"; 
const AdminPage = React.lazy(() => import("./pages/AdminPage")); 
 
function App() { 
  return ( 
    <Router> 
      <Route path="/" element={<Home />} /> 
      <Route 
        path="/admin" 
        element={ 
          <Suspense fallback={<Spinner />}> 
            <AdminPage /> 
          </Suspense> 
        } 
      /> 
    </Router> 
  ); 
} 
``` 
 
Here the `AdminPage` component is bundled separately. It is fetched when the user navigates to 
`/admin` and rendered inside a fallback UI while loading. 
 
## Common pitfalls 
 


---

 
288
- **Dynamic imports return a promise** - Always handle them asynchronously. If you forget to 
await or use `.then()`, your code may try to access undefined exports. 
- **CORS restrictions** - When loading modules from other domains, ensure the server sets the 
appropriate CORS headers. Browsers enforce same-origin policies for module scripts. 
- **Multiple imports** - Calling dynamic `import()` multiple times for the same module may return 
cached copies, but bundlers can generate duplicate chunks if configured incorrectly. 
- **Not prefetching** - For anticipated interactions (like the next page), use `<link rel="prefetch">` 
or bundler features to prefetch chunks during idle time. 
 
## Analogy 
 
Imagine your application as a toolkit. **Static imports** pack all tools into a single heavy toolbox. 
You might carry tools you never use. **Dynamic imports** let you keep seldom-used tools on a shelf 
and grab them only when needed, making the initial load lighter and more efficient. 
 
## Practice questions 
 
**Conceptual questions** 
 
1. What is the difference between static `import` and dynamic `import()`? Why can dynamic imports 
be placed inside functions or conditional blocks? 
2. How does code splitting improve page performance? Describe scenarios where splitting code by 
route or component makes sense. 
3. Explain how bundlers like webpack use dynamic imports to create separate chunks. What happens 
when multiple dynamic imports refer to the same module? 
4. What are potential downsides of relying heavily on dynamic imports? 
 
**Coding exercises** 
 
1. Rewrite a simple module `greet.js` that exports a function. Then write code that uses dynamic 
`import()` to load and execute `greet()` only after the user clicks a button. 
2. Using webpack (or another bundler of your choice), configure a project to split code into separate 
bundles when certain routes are visited. Verify that the generated chunks are loaded on demand. 
3. Write a helper `lazyLoad(path)` that wraps dynamic `import()` and caches the loaded module, 
ensuring that subsequent calls don't fetch it again. 


---

 
289
4. Implement a fallback UI that displays a spinner while a dynamically imported component is 
loading. Once loaded, render the component. 
 
 
 


---

 
290
What are optional chaining and nullish coalescing 
operators? 
# Optional Chaining (`?.`) and Nullish Coalescing (`??`) Operators 
 
JavaScript applications often work with deeply nested objects. Accessing a property somewhere 
down the chain can throw an error if an intermediate property is undefined. To simplify safe access 
and default values, the language introduced two operators: **optional chaining** and **nullish 
coalescing**. 
 
## Optional chaining (`?.`) 
 
The optional chaining operator (`?.`) allows you to safely access properties, call functions or index 
arrays on a value that might be `null` or `undefined`. If any part of the chain is `null` or `undefined`, 
the entire expression short-circuits and returns `undefined` instead of throwing a `TypeError`. 
 
### Accessing nested properties 
 
Without optional chaining: 
 
```js 
const city = user && user.address && user.address.city; 
``` 
 
With optional chaining: 
 
```js 
const city = user?.address?.city; 
``` 
 
Both expressions return the same result—`undefined` if `user` or `user.address` is missing—but the 
latter is cleaner and less error-prone. Optional chaining can be used for: 
 
- **Property access**: `obj?.prop` 


---

 
291
- **Array/Map access**: `arr?.[index]` 
- **Method calls**: `obj.method?.()` 
 
Each `?.` checks the part before it. If that part is `null` or `undefined`, the entire expression returns 
`undefined` and stops evaluating. Optional chaining does not catch other falsy values (such as `0` or 
`''`). 
 
### Calling functions and optional methods 
 
When calling a function that might not exist, optional chaining prevents errors: 
 
```js 
button.onclick = null; 
// Later ... 
button.onclick?.(event); // Does nothing instead of throwing 
``` 
 
In this case, if `onclick` is `null`, the call is skipped. Optional chaining only short-circuits the 
immediate member access; side effects on the left side (e.g., increment operators) still happen 
before the check. 
 
### Not a substitute for validation 
 
Optional chaining tells you something is missing but doesn't fill the gap. If a value is required, you 
must still validate it and handle the missing case appropriately. 
 
## Nullish coalescing (`??`) 
 
The nullish coalescing operator (`??`) returns its right-hand operand when the left-hand operand is 
`null` or `undefined`; otherwise it returns the left-hand operand. It's useful for providing default 
values only when a value is truly absent, not when it is another falsy value. 
 
```js 


---

 
292
const name = user.name ?? "Anonymous"; 
``` 
 
If `user.name` is `null` or `undefined`, `name` becomes `'Anonymous'`. If `user.name` is an empty 
string or zero, those values are preserved. This differs from the logical OR operator (`||`), which 
treats any falsy value—`0`, `NaN`, `''`, `false`—as a signal to use the fallback. 
 
### Combining optional chaining and nullish coalescing 
 
Together, these operators allow concise, safe access with defaults: 
 
```js 
const zip = user?.address?.zip ?? "00000"; 
``` 
 
If `user` or `user.address` is undefined, or if `zip` itself is `undefined` or `null`, `zip` defaults to 
`'00000'`. 
 
## Analogy 
 
Imagine navigating through a series of doors in a building. Optional chaining is like checking whether 
each door exists before you walk through it. If a door is missing, you stop instead of walking into an 
error. Nullish coalescing is like saying "If there is no room here (null or undefined), use this backup 
room; otherwise, use the room you found." 
 
## Practice questions 
 
**Conceptual questions** 
 
1. What problem does the optional chaining operator solve? Give an example where it prevents a 
run-time error. 
2. How does `obj?.prop` differ from `obj.prop` in terms of short-circuiting behaviour? What happens 
if `obj` is `null` or `undefined`? 


---

 
293
3. Compare the nullish coalescing operator (`??`) with the logical OR operator (`||`). What values 
cause each to use the default? 
4. Can you use optional chaining with function calls and array indexing? Provide syntax examples. 
 
**Coding exercises** 
 
1. Given a nested object describing a product (`product.specs.dimensions.height`), write a function 
that safely retrieves the height using optional chaining. If any part is missing, return `0` as the 
default. 
2. Implement a function `getUserName(user)` that returns `user.name` if present; otherwise returns 
`'Guest'`. Use both optional chaining and nullish coalescing. 
3. Write a function that takes an array of user objects and returns the first defined `email` property 
using optional chaining and nullish coalescing, or returns `'no email'` if none exist. 
4. Demonstrate how misuse of `||` instead of `??` could accidentally treat an empty string as missing. 
Rewrite the example correctly. 
 
 
 
 


---

 
294
Explain Proxy and Reflect API 
# Proxy and Reflect APIs in JavaScript 
 
JavaScript objects expose certain behaviours—reading a property, assigning a value, calling a 
function, checking membership—with built-in semantics. The **Proxy** API allows you to customize 
these fundamental operations by wrapping an object in an intermediary. The **Reflect** API 
complements Proxy by providing methods that perform the default behaviour of those operations in 
a uniform way. 
 
## Proxy: intercepting object operations 
 
A **proxy** is created with `new Proxy(target, handler)`. The `target` is the object being wrapped, 
and the `handler` is an object whose properties are functions (called _traps_) that intercept 
operations on the target. When an operation occurs, the corresponding trap executes; you can run 
custom logic, block the operation, or forward it to the original target using Reflect. 
 
### Basic usage 
 
```js 
const person = { name: "Alice", age: 30 }; 
 
const handler = { 
  get(target, prop, receiver) { 
    console.log(`Reading property ${prop}`); 
    return Reflect.get(target, prop, receiver); 
  }, 
  set(target, prop, value, receiver) { 
    if (prop === "age" && value < 0) { 
      throw new Error("Age cannot be negative"); 
    } 
    console.log(`Setting ${prop} to ${value}`); 
    return Reflect.set(target, prop, value, receiver); 
  }, 


---

 
295
}; 
 
const proxyPerson = new Proxy(person, handler); 
 
console.log(proxyPerson.name); // logs: Reading property name, then 'Alice' 
proxyPerson.age = 35; // logs: Setting age to 35 
proxyPerson.age = -5; // throws Error 
``` 
 
In this example, the `get` trap logs property reads and then uses `Reflect.get()` to perform the default 
behaviour. The `set` trap validates the age property before assigning it. 
 
### Common traps 
 
- `get(target, prop, receiver)` - intercepts property reads. 
- `set(target, prop, value, receiver)` - intercepts property writes; return `true` if successful. 
- `has(target, prop)` - traps the `in` operator. 
- `deleteProperty(target, prop)` - traps `delete obj[prop]`. 
- `apply(target, thisArg, argumentsList)` - traps function calls on callable targets. 
- `construct(target, args, newTarget)` - traps object instantiation when the proxy is used with `new`. 
 
Each trap can modify behaviour or delegate to the original using `Reflect` methods. 
 
### Use cases for proxies 
 
- **Validation and sanitization** - Check or normalize values before storing them. 
- **Logging and debugging** - Track when and how properties are accessed or modified. 
- **Virtualized collections** - Represent large or remote datasets and fetch data lazily when 
properties are accessed. 
- **Reactive frameworks** - Libraries like Vue use proxies to detect changes and trigger UI updates. 
- **Default values** - Return fallback values when a property doesn't exist. 
 


---

 
296
## Reflect: default behaviour as functions 
 
`Reflect` is a namespace object that provides methods corresponding to fundamental object 
operations. Each method takes arguments explicit rather than relying on special syntax. Reflect 
methods always perform the default operation without custom side effects. 
 
Some commonly used methods include: 
 
- `Reflect.get(target, prop, receiver)` - Default property access. 
- `Reflect.set(target, prop, value, receiver)` - Default assignment; returns a boolean indicating 
success. 
- `Reflect.has(target, prop)` - Equivalent to `prop in target`. 
- `Reflect.deleteProperty(target, prop)` - Equivalent to `delete target[prop]`. 
- `Reflect.apply(target, thisArg, argsArray)` - Calls a function with a specified `this` value and 
argument list. 
- `Reflect.construct(target, args, newTarget)` - Creates an instance of a constructor function. 
 
When writing proxy traps, using Reflect ensures your proxy behaves consistently with the language's 
default semantics. 
 
## Analogy 
 
Think of a proxy as a **security guard** standing in front of a building. Every time someone tries to 
go inside (access a property), the guard checks their credentials, logs their entry or perhaps stops 
them. The building itself is the target object. The Reflect API is like the building's default operation 
manual—when the guard decides to allow someone in, they follow the manual to open the door and 
let them proceed normally. 
 
## Practice questions 
 
**Conceptual questions** 
 
1. What is the purpose of the handler object in a Proxy? List at least four traps and explain when they 
are invoked. 


---

 
297
2. How does a proxy differ from a normal object when performing operations like property access, 
assignment or function invocation? 
3. Why is the Reflect API useful inside proxy traps? What advantages does it provide over directly 
interacting with the target? 
4. Give an example of how proxies can be used to implement data validation or default values. 
5. Describe how reactive frameworks use proxies to detect changes in objects. 
 
**Coding exercises** 
 
1. Create a proxy for an object that logs any attempt to read or write its properties and prevents the 
deletion of any property. 
2. Write a proxy that enforces that only string keys starting with an underscore (`_`) can be set. All 
others should throw an error. 
3. Implement a proxy for an array that returns `0` whenever an out-of-bounds index is read. Use 
Reflect to delegate all other operations. 
4. Build a proxy that records the time of every method call on an object and stores it in an array 
called `calls` on the target. 
 
 
 


---

 
298
What is destructuring / aliasing and how is it useful? 
# Destructuring, Aliasing and Their Usefulness in JavaScript 
 
Modern JavaScript includes syntax for **destructuring**—extracting values from arrays and objects 
into distinct variables. It helps unpack complex data structures into convenient local variables with 
concise syntax. **Aliasing** within destructuring lets you rename properties to avoid naming 
conflicts or to choose clearer variable names. 
 
## Array destructuring 
 
Array destructuring assigns variables based on the position of elements: 
 
```js 
const rgb = [255, 200, 100]; 
const [red, green, blue] = rgb; 
 
console.log(red); // 255 
console.log(green); // 200 
console.log(blue); // 100 
``` 
 
You can skip elements by leaving a blank space (`, ,`) and provide default values if the array is shorter 
than expected: 
 
```js 
const coords = [10]; 
const [x = 0, y = 0, z = 0] = coords; 
// x = 10, y = 0, z = 0 
``` 
 
The rest operator (`...`) gathers the remaining elements: 
 


---

 
299
```js 
const numbers = [1, 2, 3, 4, 5]; 
const [first, ...rest] = numbers; 
// first = 1, rest = [2, 3, 4, 5] 
``` 
 
## Object destructuring 
 
Object destructuring matches properties by name rather than position: 
 
```js 
const user = { id: 123, name: "Alice", age: 25 }; 
const { id, name } = user; 
// id = 123, name = 'Alice' 
``` 
 
Properties that don't exist produce `undefined`, but you can assign defaults: 
 
```js 
const { nickname = "Anon" } = user; 
// nickname = 'Anon' 
``` 
 
### Aliasing (renaming properties) 
 
Sometimes a property name is not a valid identifier or conflicts with another variable in scope. You 
can assign it to a new variable with a different name: 
 
```js 
const person = { firstName: "Bob", "last-name": "Smith" }; 
const { firstName: first, "last-name": last } = person; 


---

 
300
// first = 'Bob', last = 'Smith' 
``` 
 
Aliasing is also useful when destructuring within a function parameter: 
 
```js 
function printUser({ name: fullName, age }) { 
  console.log(`${fullName} is ${age} years old.`); 
} 
 
printUser({ name: "Carol", age: 31 }); 
// prints: Carol is 31 years old. 
``` 
 
Here the parameter destructures the `name` property into a local variable `fullName` and extracts 
`age` directly. 
 
## Nested and mixed patterns 
 
Destructuring can dig into nested objects and arrays: 
 
```js 
const data = { 
  user: { 
    id: 42, 
    preferences: { 
      theme: "dark", 
      languages: ["en", "es", "fr"], 
    }, 
  }, 
}; 


---

 
301
 
const { 
  user: { 
    id: userId, 
    preferences: { 
      theme, 
      languages: [primaryLang, ...otherLangs], 
    }, 
  }, 
} = data; 
 
// userId = 42 
// theme = 'dark' 
// primaryLang = 'en' 
// otherLangs = ['es', 'fr'] 
``` 
 
## Use cases and benefits 
 
- **Cleaner code** - Assign multiple variables in a single statement instead of writing repetitive 
property accesses. 
- **Convenient defaults** - Specify fallback values when data might be incomplete. 
- **Readable function signatures** - Destructure parameters to name only the needed properties 
and ignore the rest. 
- **Aliasing** - Rename properties to avoid name conflicts, clarify meaning or match naming 
conventions. 
- **Easier pattern matching** - Combine destructuring with loops or pattern matching to process 
data structures succinctly. 
 
## Analogy 
 
Think of destructuring as unpacking a gift basket. Instead of grabbing the whole basket and pulling 
out items one by one, you list what you need on the table: apples here, oranges there, and leftover 


---

 
302
treats in a pile. Aliasing is like labeling the apples as "fruit" and the oranges as "citrus" to make their 
purpose clearer. 
 
## Practice questions 
 
**Conceptual questions** 
 
1. How does array destructuring determine which variable receives which value? What happens if 
the array has fewer elements than variables? 
2. Describe how object destructuring matches properties. What happens when a property is not 
present in the source object? 
3. Why would you rename a destructured property? Give an example where aliasing improves clarity 
or avoids a conflict. 
4. Explain how the rest operator (`...`) works in array and object destructuring. 
5. Can you use destructuring in function parameters? How does this improve function readability? 
 
**Coding exercises** 
 
1. Given `const point = [3, 4, 5]`, use destructuring to assign `x`, `y` and `z` variables. Provide a default 
of `0` for any missing coordinate. 
2. Write a function `swapFirstTwo(arr)` that takes an array and returns a new array where the first 
two elements are swapped. Use array destructuring. 
3. Create a function `describeBook(book)` that takes an object with properties `{ title, author, year }` 
and logs a sentence. Use destructuring in the parameter list and rename `year` to `published`. 
4. Destructure the following nested object to extract `theme`, the first language, and assign the rest 
of the languages to a variable called `others`: `{ settings: { theme: 'light', languages: ['en', 'de', 'jp'] } 
}`. 
 
 
 


---

 
303
What is module federation in modern JS apps? 
# Module Federation in Modern JavaScript Applications 
 
As web applications become larger and teams more distributed, breaking your app into 
independently deployable pieces—often called **micro-frontends**—helps manage complexity. 
Sharing code between these pieces can be challenging. **Module Federation**, introduced in 
webpack 5, allows multiple builds to share code and load modules from each other at runtime. 
 
## Core concepts 
 
At its heart, module federation enables one application (the **host**) to consume modules exposed 
by another application (the **remote**). Both host and remote are separate builds with their own 
dependency graphs. Instead of bundling shared code into the host, the host dynamically loads 
modules from the remote when needed. 
 
### Host application 
 
The host defines which remote applications it depends on via the `ModuleFederationPlugin` in its 
webpack configuration: 
 
```js 
// webpack.config.js in host 
const { ModuleFederationPlugin } = require("webpack").container; 
 
module.exports = { 
  plugins: [ 
    new ModuleFederationPlugin({ 
      name: "host", 
      remotes: { 
        app2: "app2@http://localhost:3002/remoteEntry.js", 
      }, 
      shared: { react: { singleton: true }, "react-dom": { singleton: true } }, 
    }), 


---

 
304
  ], 
}; 
``` 
 
Here `app2` is a remote application available at the given URL. The `shared` section ensures both 
host and remote use the same instance of shared libraries like React. 
 
### Remote application 
 
The remote app exposes modules via its own `ModuleFederationPlugin` configuration: 
 
```js 
// webpack.config.js in remote 
module.exports = { 
  plugins: [ 
    new ModuleFederationPlugin({ 
      name: "app2", 
      filename: "remoteEntry.js", 
      exposes: { 
        "./Button": "./src/components/Button.js", 
      }, 
      shared: { react: { singleton: true }, "react-dom": { singleton: true } }, 
    }), 
  ], 
}; 
``` 
 
This configuration exposes a `Button` component located at `./src/components/Button.js`. The 
`filename` option (`remoteEntry.js`) is the file the host will load to discover the exposed modules. 
 
### Consuming a remote module 
 


---

 
305
In the host application, import the remote module using a special syntax understood by webpack: 
 
```js 
// In a React component inside the host 
import React, { Suspense } from "react"; 
 
const RemoteButton = React.lazy(() => import("app2/Button")); 
 
export default function Home() { 
  return ( 
    <div> 
      <h1>Welcome to the host app!</h1> 
      <Suspense fallback={<div>Loading button...</div>}> 
        <RemoteButton /> 
      </Suspense> 
    </div> 
  ); 
} 
``` 
 
When the `RemoteButton` component is rendered, webpack fetches `remoteEntry.js` from the 
remote and loads the `Button` module on demand. Because both apps share React as a singleton, 
there are no version conflicts. 
 
## Advantages of module federation 
 
- **Independent deployment** - Remotes can be updated or deployed without redeploying the 
host. Apps can evolve at their own pace. 
- **Code sharing** - Common libraries and components are shared rather than duplicated, reducing 
bundle sizes and improving consistency. 
- **Runtime integration** - Modules are loaded when needed, enabling dynamic features or 
experiments without full rebuilds. 


---

 
306
- **Micro-frontend architecture** - Teams can build and own separate parts of a larger application, 
coordinating via well-defined interfaces. 
 
## Considerations and challenges 
 
- **Version compatibility** - Shared dependencies must be compatible across host and remotes. 
Singleton configuration helps ensure only one version is used. 
- **Complex setup** - Correctly configuring hosts, remotes and shared libraries requires careful 
planning. Tools like `@module-federation/nextjs-mf` or `@module-federation/vite` simplify 
integration with popular frameworks. 
- **Network latency** - Loading remote modules introduces network requests. Use caching and 
prefetching to mitigate latency. 
- **Security** - Loading code from another domain means you must trust the remote application. 
Implement proper content security policies and version controls. 
 
## Analogy 
 
Imagine your application as a city. Some districts are built by different teams (remote apps). Instead 
of duplicating common resources like power plants (libraries) in every district, the city builds shared 
infrastructure. When a district needs a new service (a module), it requests it from the central 
provider and plugs it in without reconstructing the whole district. 
 
## Practice questions 
 
**Conceptual questions** 
 
1. What problem does module federation solve in large applications? Describe the roles of the host 
and the remote. 
2. In the webpack configuration for the host, what does the `remotes` property specify? What is the 
purpose of the `shared` property? 
3. How does a remote application expose a module? What is the `filename` option used for? 
4. Explain the advantages and potential challenges of using module federation. 
5. How could module federation support a micro-frontend architecture? 
 
**Coding exercises** 


---

 
307
 
1. Set up a minimal host and remote using webpack 5. Expose a component from the remote and 
import it in the host. Ensure that both share React as a singleton. 
2. Modify the host so that it loads the remote component lazily using React.lazy and displays a 
fallback while loading. 
3. Experiment with sharing a utility library (e.g., Lodash) between the host and remote. Observe how 
changing the version in one app affects the other. 
4. Design a simple micro-frontend dashboard where each widget (e.g., weather, news, stock) is built 
as a separate remote. Use module federation to assemble the widgets in the host at runtime. 
 
 
 


---

 
308
Explain Virtual DOM and reconciliation in React 
conceptually (JS related) 
# Understanding the Virtual DOM and Reconciliation in React 
 
React revolutionized UI development by abstracting direct DOM manipulation. Its secret weapon is 
the **Virtual DOM**—an in-memory representation of the real DOM—and an efficient 
**reconciliation** algorithm that updates the real DOM only when necessary. 
 
## Why the Virtual DOM? 
 
Manipulating the DOM is relatively slow. Every change triggers layout and paint operations, which 
can degrade performance when updates are frequent. React solves this by building a lightweight tree 
of elements (the virtual DOM) that mirrors the structure of the real DOM. When state or props 
change, React creates a **new virtual DOM** and compares it to the previous one. This diffing 
process determines the minimal set of changes needed to update the real DOM. 
 
### How the virtual DOM works 
 
1. **Initial render** - React constructs a tree of JavaScript objects representing the DOM structure 
and renders it to the real DOM. 
2. **State/prop updates** - When application data changes, React builds a new virtual DOM tree 
reflecting those changes. 
3. **Diffing (reconciliation)** - React compares the new tree with the previous tree. For each node, 
it determines whether to update an existing element, replace it, or leave it unchanged. 
4. **Real DOM updates** - React batches the changes and applies them efficiently to the actual 
DOM. Only the nodes that changed are updated; unchanged parts are left alone. 
 
By minimizing direct DOM operations and batching updates, React achieves significant performance 
gains, especially in complex interfaces. 
 
## The reconciliation algorithm 
 
React's reconciliation algorithm uses a set of heuristics to perform the diff efficiently in O(n) time: 
 


---

 
309
- **Different element types lead to full replacement** - If the previous element is a `<div>` and the 
new element is a `<span>`, React discards the old subtree and mounts a new one. 
- **Same type updates** - If the types match, React updates only the changed attributes (e.g., 
updating a `className` prop) and leaves the DOM node in place. Component state persists across 
renders when the component type stays the same. 
- **Keys and lists** - When rendering lists of elements, assigning a `key` prop to each element helps 
React identify which items have changed, been added or removed. Using stable, unique keys 
prevents expensive reordering and preserves state. 
 
### Example of list reconciliation 
 
```jsx 
function TodoList({ items }) { 
  return ( 
    <ul> 
      {items.map((item) => ( 
        <li key={item.id}>{item.text}</li> 
      ))} 
    </ul> 
  ); 
} 
 
// Using indices as keys can lead to incorrect updates when the list changes order. 
``` 
 
By using `item.id` as the key, React can match each `<li>` across renders and update only the text for 
modified items. 
 
## Benefits of the virtual DOM 
 
- **Performance** - Updates are computed in memory and only applied to the DOM when 
necessary, reducing costly reflows and repaints. 
- **Declarative style** - Developers describe what the UI should look like for a given state. React 
handles updating the DOM to match that state, freeing you from manual DOM manipulation. 


---

 
310
- **Predictable updates** - React batches updates and applies them deterministically, which helps 
avoid inconsistent UI states. 
 
## Analogy 
 
Think of the virtual DOM as an architect's **blueprint** of a building. Before renovating, the 
architect revises the blueprint (new virtual DOM) and compares it to the current blueprint (previous 
virtual DOM). They then instruct the builders to modify only the walls or rooms that changed (real 
DOM updates). Without the blueprint, builders would wander the building, making unnecessary 
changes and causing chaos. 
 
## Common pitfalls 
 
- **Using indices as keys** - When rendering lists, using the array index as a key can cause incorrect 
component reuse and visual glitches when items are reordered or removed. Always use a stable 
identifier if possible. 
- **Unnecessary wrapper elements** - Extra divs in the JSX tree create additional nodes in the 
virtual DOM. Use React fragments (`<> ... </>`) to avoid wrapping elements unnecessarily. 
- **Large component trees** - Deeply nested structures can still result in many diff operations. 
Consider splitting components and memoizing where appropriate. 
 
## Practice questions 
 
**Conceptual questions** 
 
1. Explain the purpose of the virtual DOM. How does it improve performance compared to direct 
DOM manipulation? 
2. Describe the steps React takes during reconciliation. What happens when two elements have 
different types? 
3. Why are keys important when rendering lists? What problems arise when keys are not used or are 
non-unique? 
4. How does React batch updates to the DOM? Why is batching beneficial? 
5. Give an example where using the array index as a key causes an issue when updating a list. 
 
**Coding exercises** 


---

 
311
 
1. Write a React component that renders a list of users. Demonstrate how adding and removing users 
affects the DOM when using proper keys vs. using the index. 
2. Build a simple counter component and log each phase: initial render, state update, virtual DOM 
creation, diff and DOM update (use `useEffect` and console logs to illustrate the lifecycle). 
3. Create a component that intentionally reorders items without keys and observe how React 
updates the DOM. Then fix it by adding unique keys. 
4. Implement a small custom hook that memoizes a list component to avoid re-rendering when the 
list items haven't changed. Explain how memoization interacts with reconciliation. 
 
 
 


---

 
312
What is event-loop starvation? 
# What Is Event Loop Starvation? 
 
JavaScript executes on a single thread. It uses an **event loop** to schedule and run different kinds 
of tasks: macro-tasks (e.g., `setTimeout`, I/O callbacks) and micro-tasks (e.g., `Promise` callbacks, 
MutationObservers). The event loop repeatedly takes a task from the macro-task queue, executes it 
until completion, then runs all micro-tasks queued during that execution before moving on. 
**Starvation** occurs when some tasks never get a chance to run because the event loop is 
perpetually busy with other tasks. 
 
## How starvation happens 
 
Starvation usually stems from one of two issues: 
 
1. **Long-running synchronous code** - Since JavaScript is single-threaded, synchronous functions 
block the event loop. If a function performs heavy computation without yielding control back to the 
loop, it prevents any pending tasks from executing. 
 
2. **Flooding the micro-task queue** - Micro-tasks have higher priority than macro-tasks. After a 
macro-task finishes, the engine runs all micro-tasks before taking the next macro-task. If your code 
continually queues micro-tasks (for example, repeatedly calling `Promise.resolve().then(...)` in a 
loop), the engine may run micro-tasks indefinitely, causing macrotasks like `setTimeout` callbacks to 
be delayed or never run at all. 
 
### Example: micro-task starvation 
 
```js 
function scheduleMacrotask() { 
  setTimeout(() => { 
    console.log("Macrotask executed"); 
  }, 0); 
} 
 
function floodMicrotasks() { 


---

 
313
  for (let i = 0; i < 1e5; i++) { 
    Promise.resolve().then(() => { 
      // Simulate quick microtasks 
    }); 
  } 
} 
 
scheduleMacrotask(); 
floodMicrotasks(); 
 
// You might expect 'Macrotask executed' to log immediately, 
// but the macrotask is delayed until all microtasks finish. 
``` 
 
In this example, a single `setTimeout` callback (a macro-task) is scheduled, but a loop adds 100,000 
micro-tasks. Because micro-tasks run before the next macro-task, the event loop spends a long time 
clearing the micro-task queue. The timeout callback doesn't run until all those micro-tasks complete. 
 
### Example: synchronous blocking 
 
```js 
function longComputation() { 
  // CPU-intensive loop that blocks the event loop 
  const start = Date.now(); 
  while (Date.now() - start < 5000) { 
    // Simulate work 
  } 
} 
 
console.log("Start"); 
setTimeout(() => console.log("Timeout fired"), 0); 
longComputation(); 


---

 
314
console.log("End"); 
 
// 'Timeout fired' logs only after longComputation completes (~5 seconds later). 
``` 
 
Because `longComputation()` runs synchronously for 5 seconds, the event loop cannot process the 
`setTimeout` callback until it finishes. Any user interaction or UI updates also pause during this time, 
making the page appear frozen. 
 
## Avoiding starvation 
 
- **Break up long tasks** - Split heavy computations into smaller chunks and schedule the next 
chunk with `setTimeout` or `setImmediate` (in Node.js). This yields control back to the event loop, 
allowing other tasks to run. 
- **Use micro-tasks responsibly** - Avoid rapidly queuing micro-tasks in a tight loop. Instead, batch 
work or schedule some tasks as macro-tasks using `setTimeout` with a delay of 0. 
- **Use `requestIdleCallback`** - For non-urgent work (analytics, logging), schedule tasks during idle 
periods. The browser calls `requestIdleCallback` when it's safe to run low-priority tasks without 
blocking critical rendering or input. 
- **Web workers** - Offload CPU-intensive tasks to a Web Worker, which runs in its own thread and 
doesn't block the event loop. 
 
## Analogy 
 
Imagine a single checkout lane at a grocery store. People in line (tasks) are served one at a time. 
Micro-tasks are like VIP customers that always cut to the front. If too many VIPs arrive, regular 
customers may never reach the counter. Likewise, if one customer brings a cart full of items and the 
cashier never pauses, everyone behind them waits. To keep the line moving, the cashier occasionally 
pauses long customers to serve others, or opens a new lane (web worker) for large orders. 
 
## Practice questions 
 
**Conceptual questions** 
 
1. Explain the difference between micro-tasks and macro-tasks in the event loop. Why can flooding 
the micro-task queue lead to starvation of macro-tasks? 


---

 
315
2. Provide two examples of long-running synchronous code that could cause event loop starvation. 
How do they affect the user experience? 
3. How does breaking a computation into smaller pieces and scheduling them with `setTimeout` or 
`requestIdleCallback` help prevent starvation? 
4. Describe scenarios where using a Web Worker is preferable to running code on the main thread. 
 
**Coding exercises** 
 
1. Write a function that processes an array of 1 million items without blocking the UI. Break the work 
into chunks and use `setTimeout` to schedule each chunk. 
2. Modify the `floodMicrotasks()` example so that it only queues micro-tasks in batches of 100, 
allowing `setTimeout` callbacks to run between batches. 
3. Implement a progress bar that updates in real time while computing a large Fibonacci number. Use 
`requestIdleCallback` to schedule the computation and ensure the UI remains responsive. 
4. Write a simple Web Worker that performs heavy computation (e.g., prime number generation) 
and communicates results back to the main thread. Demonstrate that the main UI does not freeze 
during the computation. 
 
 
 


---

 
316
Explain call stack overflow and recursion depth limits 
# Understanding the Call Stack, Recursion Depth Limits and Stack Overflow in JavaScript 
 
JavaScript executes code in a **single thread** using a call stack, which is essentially a stack data 
structure used to track function calls. Each time a function is invoked, an **execution context**—
containing its parameters, local variables and the location where the function should return—is 
pushed onto this stack. When the function finishes, its context is popped off and execution returns to 
the caller. This push-and-pop sequence continues as your program runs. 
 
## The call stack and recursion 
 
Recursion is a technique where a function calls itself (directly or indirectly) to solve a problem by 
breaking it down into smaller pieces. Each recursive call pushes another execution context onto the 
call stack. As long as there is a **base case**—a condition that stops the recursion—the stack will 
eventually unwind and return control back down the chain of calls. 
 
If a recursive function either lacks a proper base case or calls itself too deeply, the call stack grows 
until the JavaScript engine cannot allocate any more stack frames. At that point, a **stack overflow 
error** occurs (for example, `RangeError: Maximum call stack size exceeded`). Different browsers 
and environments have different stack size limits; in many engines the maximum safe recursion 
depth is in the range of a few thousand calls, so relying on very deep recursion can be fragile. 
 
### Example: factorial with safe recursion 
 
```js 
// A safe recursive implementation using a clear base case 
function factorial(n) { 
  if (n < 0) throw new Error("Negative values are not allowed"); 
  if (n === 0 || n === 1) return 1; // base case 
  return n * factorial(n - 1); // recursive case 
} 
 
console.log(factorial(5)); // 120 
``` 


---

 
317
 
This `factorial` function stops when `n` reaches 0 or 1, preventing unbounded growth of the call 
stack. If you omit the base case or inadvertently call the function with a negative value, the recursion 
never ends and a stack overflow occurs. 
 
### Demonstrating stack overflow 
 
```js 
function endless(n) { 
  return endless(n + 1); // no base case - runs until the stack overflows 
} 
 
try { 
  endless(0); 
} catch (e) { 
  console.error("Stack overflow:", e.message); 
} 
``` 
 
Depending on your environment, this code will throw a `RangeError` after several thousand recursive 
calls. It shows how unbounded recursion can exhaust the call stack. 
 
## Why recursion depth is limited 
 
JavaScript engines implement the call stack with a fixed amount of memory. Each new call pushes an 
execution context, so a deep recursive algorithm can exhaust this memory quickly. Some languages 
support **tail call optimization**, a technique that reuses stack frames for certain recursive 
patterns. JavaScript's specification allows tail call optimization in strict mode, but most engines don't 
implement it yet, so you shouldn't assume it will save stack space. 
 
For algorithms that require many iterations, consider converting recursive logic to an **iterative 
approach** using loops or explicit stacks. Iterative solutions often avoid the risk of stack overflow 
and can be easier to reason about when working with large datasets. 
 


---

 
318
## Real-world analogy 
 
Imagine a stack of plates at a buffet: you can take a plate off the top or add one on top, but you 
never remove or insert plates in the middle. Each function call is like placing a new plate on the stack. 
If you keep adding plates without ever removing them, eventually the stack becomes unstable and 
collapses—that's the stack overflow. To prevent it, you must stop placing plates once you reach a 
certain height (the base case) or remove plates as you go (using iteration). 
 
## Common pitfalls and misconceptions 
 
- **Infinite recursion is not the only cause of stack overflow.** A finite recursion that simply goes 
too deep will also overflow the stack. Always design your recursion to stop early when possible. 
- **Tail recursion isn't automatically optimized in JavaScript.** Even in strict mode, most engines 
do not implement tail call optimization, so writing a tail-recursive function will not necessarily 
prevent stack overflow. 
- **Using global variables for recursion counters can hide problems.** It's better to pass state 
through function parameters or use local variables so you don't inadvertently depend on external 
mutable state. 
- **Stack overflow is not just about recursion.** A long chain of synchronous function calls (even 
without recursion) can also exceed the stack limit if it nests too deeply. 
 
## Practice questions 
 
1. **Theory:** Explain the call stack in your own words. What happens to the stack when a function 
calls another function? How does it differ when a function returns? 
2. **Theory:** Why does a `RangeError: Maximum call stack size exceeded` occur? Describe two 
ways to prevent it when using recursion. 
3. **Coding:** Write a recursive function that sums the elements of a nested array (arrays can 
contain numbers or other arrays) but uses an explicit stack (an array) internally instead of relying on 
the call stack. This prevents stack overflow on very deeply nested arrays. 
4. **Coding:** Convert the following recursive Fibonacci function into an iterative version that uses 
a loop and avoids recursion: 
 
   ```js 
   function fibonacci(n) { 
     if (n <= 1) return n; 


---

 
319
     return fibonacci(n - 1) + fibonacci(n - 2); 
   } 
   ``` 
 
5. **Theory:** What is tail call optimization? Why isn't it currently relied upon in production 
JavaScript code? 
 
These questions and examples will help you deepen your understanding of how the call stack works, 
why recursion must be designed carefully, and how to avoid stack overflow errors in real projects. 
 
 
 


---

 
320
What are tagged template literals? 
# Tagged Template Literals in JavaScript 
 
Template literals, enclosed by backticks (\``), allow embedded expressions (`${...}`) and multi-line 
strings. **Tagged template literals** build upon this by passing the literal's parts to a **tag 
function**. This tag can interpret the string in any way it likes—formatting, escaping, localization, or 
even generating custom data structures. 
 
## How tagged templates work 
 
When you write a tagged template literal like `tag\`Hello, ${name}!\``, JavaScript translates it into a 
call to `tag()`. The tag function receives: 
 
1. **An array of strings** containing the literal text segments (everything outside `${...}` 
placeholders). This array is frozen and reused for repeated calls with the same literal, so you can 
cache results for performance. 
2. **Substitution values**—one argument for each `${...}` expression in order of appearance. 
 
You are free to return any value from the tag function, not just a string. This makes tagged templates 
very flexible. 
 
### Example: simple formatting 
 
```js 
function highlight(strings, ...values) { 
  // `strings` is an array of literal segments 
  // `values` holds the results of each expression 
  return strings.reduce((result, str, i) => { 
    const value = 
      values[i] !== undefined ? `<strong>${values[i]}</strong>` : ""; 
    return result + str + value; 
  }, ""); 
} 


---

 
321
 
const user = "Alice"; 
const age = 30; 
const html = highlight`Name: ${user}, Age: ${age}`; 
console.log(html); // Name: <strong>Alice</strong>, Age: <strong>30</strong> 
``` 
 
Here, the `highlight` function wraps each interpolated value in `<strong>` tags. The tag gets the literal 
pieces (`"Name: ", ", Age: "`) in the `strings` array and the values (`user`, `age`) in the `values` array. 
By interleaving them, it produces a formatted string. 
 
### Accessing raw strings 
 
By default, escape sequences like `\n` are interpreted in template literals. If you need the raw text, 
the `strings` array has a `raw` property containing the unprocessed versions. This is useful for writing 
custom parsers that need to interpret backslashes or special characters exactly as written. 
 
```js 
function showRaw(strings) { 
  console.log(strings.raw[0]); 
} 
 
showRaw`Line one\nLine two`; // logs "Line one\nLine two" 
``` 
 
## Practical uses 
 
- **Custom DSLs and domain-specific parsing:** Tagged templates are often used to implement 
mini-languages within JavaScript. Libraries like GraphQL or styled-components use tags to parse 
structured strings and generate queries or CSS at build time. 
- **Localization and internationalization:** A tag function can look up translation keys for strings 
and substitute variables based on locale settings. 
- **Escaping untrusted input:** You can create a safe HTML tag that escapes user input to prevent 
cross-site scripting attacks: 


---

 
322
 
  ```js 
  function escapeHTML(strings, ...values) { 
    const escape = (str) => 
      String(str) 
        .replace(/&/g, "&amp;") 
        .replace(/</g, "&lt;") 
        .replace(/>/g, "&gt;") 
        .replace(/"/g, "&quot;") 
        .replace(/'/g, "&#39;"); 
    return strings.reduce( 
      (result, str, i) => result + str + escape(values[i] ?? ""), 
      "" 
    ); 
  } 
 
  const userInput = '<script>alert("hi");</script>'; 
  const safeHtml = escapeHTML`User says: ${userInput}`; 
  console.log(safeHtml); 
  // Output: User says: &lt;script&gt;alert(&quot;hi&quot;);&lt;/script&gt; 
  ``` 
 
- **Currying and performance optimizations:** Since the strings array is immutable and reused, tag 
functions can cache results for identical literal patterns, improving performance when parsing 
complex templates repeatedly. 
 
## Common misconceptions 
 
- **Not only for strings.** A tag function can return any JavaScript value—an object, array, DOM 
element, or even a promise. Some libraries use tags to build complex queries or React components. 
- **Template parts are not concatenated automatically.** The tag must handle the `strings` and 
`values` arrays explicitly. Forgetting to join them will result in unexpected output. 


---

 
323
- **Tags don't modify the template literal syntax.** The syntax inside `${...}` expressions is normal 
JavaScript. The tag only sees the evaluated values, not the expressions themselves. 
 
## Real-world analogy 
 
Think of a mail merge program that uses templates with placeholders like `Dear {{name}}`. The 
program reads the template, pulls out the fixed text ("Dear ") and the variable parts (e.g., the 
recipient's name), then combines them to produce a personalised letter. A tagged template literal 
works similarly: the tag function is the mail merge program, and the literal is the template. 
 
## Practice questions 
 
1. **Theory:** What arguments are passed to a tag function when evaluating a tagged template 
literal? How is the `raw` property used? 
2. **Theory:** Explain how tagged templates can help prevent cross-site scripting when inserting 
user-supplied content into HTML. 
3. **Coding:** Write a tag function called `formatCurrency` that takes a template like 
``formatCurrency`Total: ${amount}```and returns a string that formats the`amount`as US dollars 
using`Intl.NumberFormat`. 
4. **Coding:** Create a tag function that builds an array of objects from a comma-separated list: `` 
toPairs`a=1,b=2,c=3`  `` should return `[{ key: 'a', value: '1' }, ...]`. 
5. **Theory:** How does a tagged template differ from simply calling a function with a string 
argument? What advantages does the tagged template syntax provide? 
 
These questions encourage you to explore both the mechanics and creative uses of tagged template 
literals. 
 
 
 


---

 
324
What is lazy evaluation in JS? 
# Understanding Lazy Evaluation in JavaScript 
 
**Lazy evaluation** (or call-by-need) is an evaluation strategy in which expressions are not 
computed until their values are actually required. This contrasts with JavaScript's default **eager 
evaluation**, where expressions are evaluated as soon as they're encountered. Lazy evaluation can 
improve performance by avoiding unnecessary work and supports patterns like infinite data 
structures. 
 
While JavaScript does not implement general lazy evaluation for all expressions, it provides 
mechanisms that behave lazily in specific contexts. You can also build your own lazy constructs using 
functions, generators and proxies. 
 
## Built-in lazy behaviour in JavaScript 
 
JavaScript already employs lazy evaluation in a few operators and features: 
 
### Short-circuiting logical operators 
 
The logical AND (`&&`) and OR (`||`) operators evaluate operands from left to right and stop as soon 
as the result is determined. For example, in `a && b`, `b` is evaluated only if `a` is truthy. Similarly, in 
`a || b`, `b` is evaluated only if `a` is falsy. This allows you to use these operators to conditionally 
execute code: 
 
```js 
function doExpensiveWork() { 
  console.log("Doing expensive work"); 
  return true; 
} 
 
let flag = false; 
// doExpensiveWork() runs because flag is false 
flag || doExpensiveWork(); 
// doExpensiveWork() does not run because flag is truthy 


---

 
325
flag = true; 
flag || doExpensiveWork(); 
``` 
 
### Property getters 
 
ES5 introduced getters, which are functions associated with object properties. A getter is executed 
lazily—the computation happens only when the property is accessed, not when the object is created: 
 
```js 
const user = { 
  firstName: "Alice", 
  lastName: "Smith", 
  get fullName() { 
    console.log("fullName computed"); 
    return `${this.firstName} ${this.lastName}`; 
  }, 
}; 
 
// fullName is not computed here 
console.log("User created"); 
// fullName is computed only when accessed 
console.log(user.fullName); 
``` 
 
### Generators and iterators 
 
Generator functions (`function*`) produce values on demand. When you call a generator, it returns 
an iterator. Each call to `next()` resumes execution until the next `yield` statement, returning a new 
value. This allows you to represent large or even infinite sequences without precomputing them. 
 
```js 


---

 
326
function* naturalNumbers() { 
  let i = 1; 
  while (true) { 
    yield i++; 
  } 
} 
 
const numbers = naturalNumbers(); 
console.log(numbers.next().value); // 1 
console.log(numbers.next().value); // 2 
// numbers.next() can be called indefinitely 
``` 
 
Generators enable lazily building pipelines of operations with the `for...of` loop or the spread 
operator. Since values are produced one at a time, memory usage stays low even when iterating over 
large sequences. 
 
## Creating custom lazy evaluations 
 
You can simulate laziness using higher-order functions. A common pattern is to wrap a computation 
in a function and call it only when needed: 
 
```js 
function lazy(fn) { 
  let evaluated = false; 
  let result; 
  return () => { 
    if (!evaluated) { 
      result = fn(); 
      evaluated = true; 
    } 
    return result; 


---

 
327
  }; 
} 
 
const lazyValue = lazy(() => { 
  console.log("Computing..."); 
  return Math.random(); 
}); 
 
// Nothing logged yet 
const value1 = lazyValue(); // logs 'Computing...' 
const value2 = lazyValue(); // returns cached result without logging again 
``` 
 
This pattern, known as **memoization**, caches the result after the first computation. Combined 
with closures, it defers the expensive work until the value is requested. 
 
Another approach is to use `Proxy` to intercept property access and compute values lazily. However, 
proxies add complexity and should be used judiciously. 
 
## Benefits and trade-offs 
 
- **Performance:** By delaying computations until needed, lazy evaluation can avoid unnecessary 
work, which is helpful when dealing with large data structures or expensive operations. 
- **Infinite data structures:** Generators allow you to model potentially infinite sequences (like the 
Fibonacci numbers) without running out of memory. 
- **Control flow:** Lazy evaluation makes it easy to implement custom control flow constructs, such 
as conditional evaluation in template engines or domain-specific languages. 
 
However, laziness also has costs: 
 
- **Debugging complexity:** Deferred computations can make it harder to trace when and where 
values are computed. 


---

 
328
- **Memory retention:** If cached values capture large objects, they may remain in memory longer 
than expected. WeakMaps or manual cache invalidation can help mitigate this. 
- **Non-uniform language support:** JavaScript is eager by default. Lazy patterns are implemented 
manually and require discipline to maintain. 
 
## Real-world analogy 
 
Consider ordering a made-to-order sandwich: the ingredients aren't assembled until you place the 
order. If you never order, the sandwich is never prepared, saving time and ingredients. Lazy 
evaluation works the same way—computation happens only when you need the result. 
 
## Practice questions 
 
1. **Theory:** Explain the difference between eager and lazy evaluation. Provide examples of each 
in JavaScript. 
2. **Theory:** How do the logical operators `&&` and `||` demonstrate lazy behaviour? What would 
happen if JavaScript evaluated both operands eagerly? 
3. **Coding:** Implement a generator function that yields the squares of natural numbers (1, 4, 9, 
...) indefinitely. Then write a loop that prints the first 10 squares. 
4. **Coding:** Create a function `lazySum(...nums)` that returns a thunk (a parameterless function). 
When the thunk is called, it calculates and returns the sum of `nums`, logging "Calculating" only the 
first time it runs. 
5. **Theory:** Discuss the pros and cons of using lazy evaluation in a web application. When might 
laziness introduce problems instead of solving them? 
 
These exercises will help you understand how to implement and reason about laziness in a language 
that is eager by default. 
 
 
 


---

 
329
How does JavaScript handle memory leaks? 
# How JavaScript Handles Memory and Avoids Memory Leaks 
 
JavaScript is a garbage-collected language. You don't explicitly free memory; instead, the engine 
automatically reclaims memory that is no longer needed. Understanding how garbage collection 
works and how leaks can occur will help you write more efficient, leak-free code. 
 
## Memory management basics 
 
A JavaScript program allocates memory in several phases: 
 
1. **Allocation:** When variables and objects are created, the engine reserves space in memory. 
2. **Use:** The program reads and writes to these objects as needed. 
3. **Release (garbage collection):** When objects become unreachable—there is no way for 
running code to access them—the garbage collector frees the memory so it can be reused. 
 
Modern engines use the **mark-and-sweep** algorithm. Starting from "roots" such as global 
variables, the call stack, and closure scopes, the collector marks all reachable objects. Anything not 
marked is considered unreachable and is collected. Cyclic references (objects referencing each other) 
are not a problem because an unreachable cycle is still unmarked and will be reclaimed. 
 
## What is a memory leak? 
 
A **memory leak** occurs when the program retains references to objects that are no longer 
needed, preventing the garbage collector from reclaiming their memory. Over time, these unused 
objects accumulate, increasing memory consumption and potentially degrading performance. 
 
### Common sources of memory leaks 
 
- **Global variables:** Accidentally creating global variables (by omitting `let`, `const` or `var`) or 
attaching data to the `window` object keeps them alive for the life of the page. Avoid polluting the 
global scope. 
 


---

 
330
- **Closures holding onto data:** Functions that capture variables from outer scopes can keep 
those variables alive even when they're no longer needed. For example, storing a large object in a 
closure used by an event handler may leak memory if the handler remains attached after the object 
is irrelevant. 
 
- **Uncleared timers and intervals:** Functions passed to `setInterval()` or `setTimeout()` maintain 
references to their environments. If you never call `clearInterval()` or `clearTimeout()`, the callback 
(and everything it references) remains in memory. 
 
- **Detached DOM nodes:** Removing DOM elements from the document tree doesn't 
automatically free associated memory if you still hold references to them in JavaScript. Keeping old 
elements in arrays or caches without releasing them prevents garbage collection. 
 
- **Accidental caches:** Libraries or your own code may cache data (e.g., API responses, computed 
values) but never remove stale entries. Unbounded caches grow over time. Use size limits or 
time-to-live policies. 
 
- **Closures in loops:** Creating functions inside loops that capture loop variables can 
unintentionally hold onto large structures if the closures persist longer than necessary. 
 
## Techniques to avoid leaks 
 
- **Limit scope and use `const`/`let`:** Declare variables with block scope so they don't leak into 
the global object. Minimise the lifetime of variables. 
 
- **Remove event listeners:** If you attach an event listener to an element or the window, detach it 
when it's no longer needed. Many modern frameworks automatically handle this for you, but vanilla 
JavaScript requires manual cleanup. 
 
- **Clear timers:** Always pair `setInterval()` with `clearInterval()` and `setTimeout()` with 
`clearTimeout()` when the task is complete or when the component is destroyed. 
 
- **Null out references:** When you're done with an object (especially large arrays or DOM 
elements), set variables referencing it to `null` or remove them from arrays. This makes it easier for 
the garbage collector to determine that the object is unreachable. 
 


---

 
331
- **Use weak collections:** `WeakMap` and `WeakSet` hold **weak references** to their keys. If 
no other references exist, the garbage collector can reclaim the key object and its associated value 
automatically. Weak collections are ideal for memoizing data keyed by DOM elements or other 
objects without preventing garbage collection. 
 
- **Monitor memory usage:** Modern browsers provide memory profiling tools (e.g., Chrome 
DevTools' Memory panel) that help detect leaks by showing detached nodes and snapshots of heap 
usage over time. 
 
## Real-world analogy 
 
Imagine your program is like a house with rooms (scopes) holding objects. When you no longer need 
an item, you should remove it from all rooms; otherwise, it will clutter the house forever. The 
garbage collector is like a cleaning service that checks which objects are reachable (in rooms that 
someone can enter) and removes objects left in inaccessible spaces. If you forget to take objects out 
of accessible rooms, the cleaning service won't touch them—leading to clutter (memory leaks). 
 
## Practice questions 
 
1. **Theory:** Describe the mark-and-sweep algorithm in your own words. Why are cyclic 
references not inherently problematic in modern JavaScript engines? 
2. **Theory:** List three common sources of memory leaks in JavaScript applications and explain 
how to prevent each. 
3. **Coding:** Write a function that attaches an event listener to a button and updates a counter. 
Modify your function to remove the listener when the button is removed from the DOM, ensuring no 
leak occurs. 
4. **Coding:** Create a cache using `Map` that stores results of an expensive computation. Add a 
method to clear the cache after 10 entries to avoid unbounded memory growth. 
5. **Theory:** Explain the difference between `Map` and `WeakMap` in the context of garbage 
collection. When would you choose one over the other? 
 
By understanding how the garbage collector works and being mindful about references, you can 
avoid memory leaks and keep your applications fast and efficient. 
 
 
 


---

 
332
Explain hoisting with function expressions vs arrow 
functions 
# Hoisting and Function Types: Declarations vs. Expressions vs. Arrow Functions 
 
JavaScript's **hoisting** behaviour can be confusing. It refers to the way variable and function 
declarations are moved to the top of their containing scope during compilation. Understanding how 
hoisting applies to different kinds of functions—function declarations, function expressions and 
arrow functions—will help you avoid unexpected `TypeError` or `ReferenceError` messages. 
 
## Function declarations are hoisted 
 
A **function declaration** looks like this: 
 
```js 
console.log(square(5)); // Works because `square` is hoisted 
 
function square(n) { 
  return n * n; 
} 
``` 
 
Function declarations are fully hoisted. Both the function's name and its body are moved to the top 
of the current scope. You can call the function before its declaration appears in the code. 
 
## Function expressions are not hoisted in the same way 
 
A **function expression** assigns a function to a variable: 
 
```js 
console.log(cube); // logs undefined 
// console.log(cube(2)); // would throw TypeError: cube is not a function 
 


---

 
333
var cube = function (n) { 
  return n * n * n; 
}; 
 
console.log(cube(2)); // 8 
``` 
 
Variables declared with `var` are hoisted but initialised with `undefined` until their assignment is 
reached. Therefore, calling `cube(2)` before assignment fails: the variable exists, but holds 
`undefined`, which is not callable. 
 
Using `let` or `const` for function expressions tightens the rules further. Variables declared with 
`let`/`const` are placed in a **temporal dead zone**—a period between entering the scope and the 
declaration line where they exist but cannot be accessed. Accessing them early throws a 
`ReferenceError`: 
 
```js 
// console.log(area(3)); // ReferenceError: Cannot access 'area' before initialization 
 
const area = function (r) { 
  return Math.PI * r * r; 
}; 
 
console.log(area(3)); // Works after initialization 
``` 
 
## Arrow functions behave like function expressions 
 
An **arrow function** is always an expression; there is no such thing as an "arrow function 
declaration." Arrow functions are assigned to variables, which means they follow the same hoisting 
rules as other variable assignments. You cannot invoke an arrow function before its definition: 
 
```js 


---

 
334
// greet(); // ReferenceError or TypeError depending on declaration 
 
const greet = (name) => { 
  console.log(`Hello, ${name}!`); 
}; 
 
greet("Alice"); // Works 
``` 
 
If you use `var` instead of `const`, `greet` is hoisted as `undefined`. Calling it before assignment will 
throw a `TypeError` because you're trying to call `undefined` as a function. With `let` or `const`, 
accessing `greet` before the declaration triggers a `ReferenceError` due to the temporal dead zone. 
 
## Additional differences beyond hoisting 
 
While hoisting is about when a function becomes available, function expressions and arrow functions 
also differ in behaviour: 
 
- **`this` binding:** Arrow functions do not have their own `this`. They capture `this` from the 
surrounding lexical context. Function declarations and expressions get their own `this` depending on 
how they're called. This difference makes arrow functions unsuitable as methods on objects that rely 
on dynamic `this`. 
- **`arguments` object:** Arrow functions do not have an `arguments` object; you must use rest 
parameters (`...args`) to access arguments. Regular functions have their own `arguments` object. 
- **Constructors:** Arrow functions cannot be used as constructors. Calling them with `new` throws 
a `TypeError`. Traditional function declarations and expressions can be invoked as constructors if 
designed for that purpose. 
 
## Real-world analogy 
 
Think of hoisting like a stage play. Script lines (declarations) are pinned to the top of the script before 
the actors begin. The actors can deliver lines (call functions) right away if the lines were pinned 
(function declarations). However, if a line is written on a cue card handed out later (function 
expression), the actor doesn't know what to say until the cue card arrives. Arrow functions are 
always on cue cards; the actor can't read them until they're handed over. 
 


---

 
335
## Common pitfalls 
 
- **Assuming all functions are hoisted.** Only declarations are. Expressions and arrow functions 
need to be defined before use. 
- **Mixing `var`, `let` and `const`.** Understand that `var` declarations hoist and initialise to 
`undefined`, while `let` and `const` create a temporal dead zone. 
- **Using arrow functions as methods.** Arrow functions capture `this` lexically; using them as 
object methods can lead to unexpected `this` values. 
 
## Practice questions 
 
1. **Theory:** Explain the difference between hoisting of function declarations and variables. How 
does the temporal dead zone apply to functions assigned to `let` or `const` variables? 
2. **Coding:** Predict the output of the following code and explain why: 
 
   ```js 
   show(); 
   var show = () => console.log("arrow"); 
   function show() { 
     console.log("declaration"); 
   } 
   show(); 
   ``` 
 
3. **Coding:** Rewrite the following function declaration as an arrow function. How would you call 
it to avoid hoisting pitfalls? 
 
   ```js 
   function multiply(a, b) { 
     return a * b; 
   } 
   ``` 
 


---

 
336
4. **Theory:** Describe the differences in `this` and `arguments` handling between arrow functions 
and traditional functions. Give examples where choosing one over the other makes a difference. 
5. **Coding:** Write a function that uses an arrow function inside a method. Demonstrate how the 
arrow captures `this` from its enclosing scope. 
 
These exercises will solidify your understanding of hoisting and function types, helping you avoid 
common runtime errors. 
 
 
 


---

 
337
What is the Temporal API (upcoming JS proposal)? 
# The Temporal API - A Modern Date and Time API for JavaScript 
 
Dates and times are notoriously tricky. JavaScript's built-in `Date` object has long been criticised for 
confusing behaviour, limited time-zone support and awkward APIs. To address these shortcomings, 
TC39 (the committee that evolves JavaScript) has proposed a new **Temporal** API. Though still 
experimental in many environments, Temporal aims to provide a robust, modern way to work with 
dates, times, durations and time zones. 
 
## Why Temporal was created 
 
The original `Date` object was modelled on Java's `java.util.Date`, which was later superseded in Java 
because of its design flaws. `Date` combines a timestamp and calendar fields into a single mutable 
object, uses local time by default, lacks full time-zone support, and has inconsistent parsing and 
arithmetic methods. Temporal's design addresses these issues by: 
 
- **Separating concepts**: Temporal introduces distinct classes for instants (`Temporal.Instant`), 
time-zone-aware date-times (`Temporal.ZonedDateTime`), plain date-times without a time zone 
(`Temporal.PlainDateTime`), dates, times, years/months, durations and more. Separating these 
concepts reduces confusion and makes APIs more explicit. 
- **Immutability:** Temporal objects are immutable. Operations like `add()` or `with()` return new 
objects instead of modifying the original, avoiding side effects. 
- **Built-in time-zone and calendar support:** Temporal can represent dates in any IANA time zone 
and supports different calendar systems. It handles daylight saving transitions and leap seconds 
correctly. 
- **Consistent parsing and arithmetic:** Temporal provides methods like `from()`, `toString()`, 
`add()` and `subtract()` that behave predictably, allowing easy conversion between types and reliable 
date arithmetic. 
 
## Overview of key Temporal classes 
 
- **`Temporal.Now`** provides static methods that return current date and time values in different 
forms. For example, `Temporal.Now.plainDateISO()` gives today's ISO date in the local time zone, and 
`Temporal.Now.zonedDateTimeISO()` returns a zoned date-time with the device's time zone. 
 
- **`Temporal.Instant`** represents a single point on the timeline (like a UNIX timestamp) with 
nanosecond precision. It is time-zone agnostic and can be converted to other Temporal types. 


---

 
338
 
- **`Temporal.ZonedDateTime`** pairs a calendar date-time with a specific time zone. It's useful 
when you need an exact moment plus a zone—for example, scheduling meetings across time zones 
or converting times for travel itineraries. 
 
- **`Temporal.PlainDate`**, **`Temporal.PlainTime`** and **`Temporal.PlainDateTime`** 
represent dates and times without a time zone. They model concepts like "Christmas Day" or "8:00 
AM" without reference to a particular offset from UTC, which is essential for recurring events. 
 
- **`Temporal.Duration`** represents the difference between two temporal values in terms of years, 
months, days, hours, minutes, seconds and smaller units. Duration arithmetic is precise and respects 
calendar rules. 
 
Other classes handle specific combinations (like `Temporal.PlainYearMonth` or 
`Temporal.PlainMonthDay`) and there are conversion helpers like 
`Temporal.Instant.fromEpochMilliseconds()`. 
 
## Basic usage examples 
 
```js 
// Getting the current date in ISO format 
const today = Temporal.Now.plainDateISO(); 
console.log(today.toString()); // e.g., '2025-11-06' 
 
// Creating and manipulating a ZonedDateTime 
const meeting = Temporal.ZonedDateTime.from({ 
  year: 2025, 
  month: 12, 
  day: 15, 
  hour: 9, 
  minute: 30, 
  timeZone: "America/New_York", 
}); 
const newTime = meeting.add({ hours: 2 }); 


---

 
339
console.log(newTime.toString()); // adds two hours without modifying `meeting` 
 
// Converting between types 
const instant = Temporal.Instant.fromEpochMilliseconds(Date.now()); 
const zoned = instant.toZonedDateTimeISO("Europe/Paris"); 
console.log(zoned.toString()); 
 
// Working with durations 
const duration = Temporal.Duration.from({ days: 2, hours: 5 }); 
const later = today.add(duration); 
console.log(later.toString()); 
``` 
 
These examples illustrate Temporal's clarity: you explicitly specify time zones and units, and methods 
return new immutable objects. 
 
## How Temporal differs from Date 
 
- **Immutability vs. mutability:** `Date` objects are mutable (methods like `setHours()` modify the 
original). Temporal objects are immutable; methods like `add()` return new values. 
- **Time-zone awareness:** `Date` stores a timestamp but defaults to the local time zone when 
converting to strings. Temporal separates zone-aware and zone-agnostic types, making conversions 
explicit. 
- **Precision:** Temporal offers nanosecond precision and robust arithmetic. `Date` is limited to 
milliseconds and has quirks like months being zero-indexed. 
- **Parsing:** Temporal's `from()` methods accept object literals with named fields, removing 
ambiguities of date string parsing. 
- **Calendar systems:** Temporal supports non-Gregorian calendars, accommodating 
internationalisation needs. 
 
## Availability and status 
 
As of 2025, the Temporal API is still experimental. It is implemented in some environments but not 
available in all browsers. You can test Temporal in supported engines or via polyfills, but check 


---

 
340
compatibility before using it in production. When the API is widely supported, it is likely to become 
the recommended way to handle date and time in JavaScript. 
 
## Real-world analogy 
 
Consider scheduling flights. The original Date API is like using a single clock that only shows your local 
time. When you travel across time zones, you constantly need to recalculate departure and arrival 
times. The Temporal API is like having a world clock and a calendar: you can specify the departure 
time, time zone and calendar clearly, perform accurate arithmetic and convert to local time zones 
without confusion. 
 
## Practice questions 
 
1. **Theory:** What problems with the existing `Date` object motivated the creation of the 
Temporal API? List at least three issues. 
2. **Theory:** Describe the differences between `Temporal.Instant`, `Temporal.ZonedDateTime` and 
`Temporal.PlainDateTime`. When would you use each? 
3. **Coding:** Create a `Temporal.ZonedDateTime` for July 1, 2025 at 15:00 in the `Asia/Tokyo` time 
zone. Convert it to New York time (`America/New_York`) and output the resulting date-time. 
4. **Coding:** Write a function that takes two `Temporal.PlainDate` objects and returns the number 
of days between them using a `Temporal.Duration`. 
5. **Theory:** Explain how immutability in Temporal objects helps prevent bugs. Give an example 
where using a mutable `Date` object could lead to unexpected behaviour. 
 
These questions encourage you to explore the Temporal API and understand how it addresses the 
shortcomings of the old `Date` API. 
 
 
 


---

 
341
What is requestAnimationFrame and when to use it? 
# `requestAnimationFrame`: Scheduling Efficient Animations in the Browser 
 
Modern web applications often require smooth animations—moving elements, scrolling lists, or 
game loops. Using `setTimeout()` or `setInterval()` to drive animations can cause janky motion and 
wasted CPU cycles because they run independently of the browser's rendering schedule. The 
`requestAnimationFrame()` API provides a better way to schedule visual updates. 
 
## What does `requestAnimationFrame()` do? 
 
`requestAnimationFrame(callback)` tells the browser that you want to perform an animation. The 
browser calls your `callback` just **before** the next repaint. The callback receives a 
**high-resolution timestamp** indicating when the repaint is scheduled. After executing your 
callback, the browser paints the updated frame. Because `requestAnimationFrame()` is aligned with 
the display's refresh rate (often 60 frames per second), it produces smoother animations and reduces 
unnecessary work. 
 
Key characteristics: 
 
- **Runs before repaint:** The callback is invoked just before the browser paints a new frame, so 
any DOM changes are drawn immediately. This reduces the risk of layout thrashing and ensures your 
updates are visible on the next screen refresh. 
- **Automatic throttling:** When the page is in a background tab or the browser is minimised, 
`requestAnimationFrame()` callbacks are paused, conserving CPU and battery. Using `setInterval()` 
continues to run timers even when the page is hidden. 
- **Self-rescheduling:** `requestAnimationFrame()` calls are one-shot. If you want continuous 
animation, you must call `requestAnimationFrame()` again from within your callback. 
- **Provides timing information:** The callback receives a timestamp parameter (similar to 
`performance.now()`) that you can use to calculate elapsed time and animate at consistent speed. 
 
## Basic example: animating a moving box 
 
```html 
<style> 
  #box { 
    position: relative; 


---

 
342
    width: 50px; 
    height: 50px; 
    background: coral; 
  } 
</style> 
<div id="box"></div> 
<script> 
  const box = document.getElementById("box"); 
  let startTime; 
  function move(timestamp) { 
    if (!startTime) startTime = timestamp; 
    const elapsed = timestamp - startTime; 
    // move 100 pixels per second 
    const distance = Math.min(elapsed * 0.1, 500); 
    box.style.transform = `translateX(${distance}px)`; 
    if (distance < 500) { 
      requestAnimationFrame(move); 
    } 
  } 
  requestAnimationFrame(move); 
</script> 
``` 
 
In this example, a box moves smoothly to the right by 500 px at 100 px per second. Each frame 
calculates how much time has passed and moves the box accordingly. When the box reaches 500 px, 
the animation stops by not scheduling another frame. 
 
## When should you use `requestAnimationFrame()`? 
 
- **Animations and game loops:** Whenever you are updating visual properties (position, opacity, 
scale) or drawing to a `<canvas>`, `requestAnimationFrame()` ensures your updates sync with the 
display. 


---

 
343
- **Smooth scroll or parallax effects:** Use it to update scroll positions or CSS transforms during 
user interactions for the smoothest performance. 
- **Throttling expensive tasks:** You can wrap layout-intensive code inside 
`requestAnimationFrame()` to ensure it runs at most once per frame, preventing layout thrashing 
from multiple DOM reads/writes in quick succession. 
 
## Canceling scheduled frames 
 
`requestAnimationFrame()` returns an integer ID. If you need to stop a scheduled callback (for 
example, when a component unmounts), call `cancelAnimationFrame(id)`. Cancelling prevents the 
callback from running if it hasn't been executed yet. 
 
```js 
const id = requestAnimationFrame(myCallback); 
// later ... 
cancelAnimationFrame(id); 
``` 
 
## Real-world analogy 
 
Imagine painting a flipbook: rather than drawing arbitrarily at random times, you wait for the 
moment right before turning to the next page to draw the next frame. This coordination ensures 
each frame appears exactly when the viewer flips the page. `requestAnimationFrame()` provides 
similar coordination with the browser's rendering loop. 
 
## Common misconceptions 
 
- **It doesn't guarantee 60 fps on its own.** `requestAnimationFrame()` only schedules callbacks 
before repaints. If your callback performs expensive work, it can still cause janky frames. Keep your 
callback work lightweight or offload heavy tasks to Web Workers. 
- **It doesn't run in Node.js environments.** `requestAnimationFrame()` is part of the browser 
APIs, though environments like Electron and Deno may provide polyfills. 
- **You still need to call it repeatedly for continuous animations.** Unlike `setInterval()`, 
`requestAnimationFrame()` doesn't loop automatically. Always invoke it again inside your callback if 
you want the next frame. 
 


---

 
344
## Practice questions 
 
1. **Theory:** What advantages does `requestAnimationFrame()` have over `setInterval()` for 
animations? Discuss throttling and timing alignment. 
2. **Coding:** Write a function that smoothly fades out an element over two seconds using 
`requestAnimationFrame()`. The element's opacity should decrease linearly from 1 to 0. 
3. **Coding:** Create a basic game loop using `requestAnimationFrame()` that updates a character's 
position and redraws a canvas. How would you pause and resume the loop? 
4. **Theory:** Why is it important to cancel scheduled animation frames when a component is 
removed from the DOM or a page is hidden? What problems might arise if you forget to do so? 
5. **Theory:** Explain how the timestamp parameter passed to a `requestAnimationFrame()` 
callback can be used to create frame-rate independent animations. 
 
Use these questions to explore efficient animation patterns and to practice writing smooth, efficient 
browser animations. 
 
 
 


---

 
345
Explain IntersectionObserver and MutationObserver 
APIs 
# Observing the DOM: IntersectionObserver and MutationObserver 
 
Modern web pages are highly dynamic. Elements appear and disappear, and you may need to react 
when an element enters the viewport or when the DOM structure changes. Polling the DOM on 
every scroll or mutation is inefficient. The **IntersectionObserver** and **MutationObserver** 
APIs provide efficient, event-driven ways to observe these changes. 
 
## IntersectionObserver: watching visibility changes 
 
The `IntersectionObserver` API lets you asynchronously detect when a **target element** enters or 
leaves a specified **root**'s viewport or crosses visibility thresholds. This is useful for lazy loading 
images, implementing infinite scrolling, triggering animations when content appears, and reporting 
viewability for ads. 
 
### How it works 
 
An `IntersectionObserver` is created with a callback and an optional configuration object: 
 
```js 
const options = { 
  root: null, // defaults to the browser viewport 
  rootMargin: "0px", // margins around the root 
  threshold: [0, 0.5, 1], // percentages of visibility that trigger the callback 
}; 
 
const observer = new IntersectionObserver((entries) => { 
  entries.forEach((entry) => { 
    if (entry.isIntersecting) { 
      console.log("Element is visible:", entry.target); 
    } 
  }); 


---

 
346
}, options); 
 
// Observe one or more elements 
const target = document.querySelector(".lazy-image"); 
observer.observe(target); 
``` 
 
The `callback` receives an array of `IntersectionObserverEntry` objects. Each entry contains details 
about a target element's intersection: `isIntersecting` (whether it is visible), `intersectionRatio` (the 
percentage of the element in view) and bounding rectangles. You can observe multiple elements 
with a single observer instance. 
 
`IntersectionObserver` does not continuously poll. The browser schedules callbacks when visibility 
thresholds are crossed, making it efficient compared to listening to scroll events. Configuration 
options include: 
 
- **`root`**: The element or viewport used as the boundary for testing visibility. If omitted or `null`, 
the browser viewport is used. 
- **`rootMargin`**: Offsets applied to the root's bounding box, specified like CSS margins (e.g., `'0px 
0px -50% 0px'` to trigger sooner). 
- **`threshold`**: A number or array of numbers between 0 and 1 indicating the intersection ratios 
that trigger the callback. 
 
## MutationObserver: watching structural changes 
 
The `MutationObserver` API allows you to observe changes to the DOM tree itself: additions or 
removals of nodes, changes to attributes, and text mutations. It replaces the deprecated Mutation 
Events and runs asynchronously to avoid blocking the main thread. 
 
### How it works 
 
To use a `MutationObserver`, create it with a callback and call `observe()` on a target node with 
options describing what you want to watch: 
 
```js 


---

 
347
const list = document.getElementById("myList"); 
 
const observer = new MutationObserver((mutationRecords) => { 
  mutationRecords.forEach((record) => { 
    if (record.type === "childList") { 
      record.addedNodes.forEach((node) => console.log("Node added:", node)); 
      record.removedNodes.forEach((node) => console.log("Node removed:", node)); 
    } else if (record.type === "attributes") { 
      console.log( 
        `Attribute ${record.attributeName} changed on`, 
        record.target 
      ); 
    } 
  }); 
}); 
 
observer.observe(list, { 
  childList: true, 
  attributes: true, 
  subtree: true, // include child nodes 
}); 
 
// Later, stop observing 
// observer.disconnect(); 
``` 
 
The options allow you to specify what to watch: 
 
- **`childList`**: Observe additions or removals of child nodes. 
- **`attributes`**: Observe attribute changes on the target node. 
- **`subtree`**: Extend observation to descendants of the target. 


---

 
348
- **`characterData`**: Observe changes to text nodes. 
- **`attributeFilter`** and **`attributeOldValue`**: Fine-tune which attributes trigger records and 
whether to record previous values. 
 
The callback is called with an array of `MutationRecord` objects detailing the changes. Use 
`disconnect()` to stop observation when it's no longer needed. 
 
## Choosing the right observer 
 
Use **IntersectionObserver** when you care about an element's visibility relative to the viewport 
or a scroll container. It's especially useful for: 
 
- Lazy loading images and resources when they come into view. 
- Triggering animations or counters when elements become visible. 
- Implementing infinite scrolling: detecting when the user reaches the bottom of a list and loading 
more content. 
- Collecting analytics on which sections of a page are seen by the user. 
 
Use **MutationObserver** when you need to react to changes in the DOM structure or attributes. 
Typical use cases include: 
 
- Implementing custom components that react to children being added or removed. 
- Observing attribute changes to synchronize state (e.g., watching `data-*` attributes). 
- Detecting text changes in content editable areas. 
- Building debugging tools that log when the page changes unexpectedly. 
 
## Real-world analogy 
 
Imagine you're managing a museum. You have one guard (IntersectionObserver) watching whether a 
visitor enters a specific room, and another guard (MutationObserver) watching whether an artwork 
is moved, swapped out or labelled differently. The first guard reports when something becomes 
visible; the second reports when something changes its existence or attributes. 
 
## Practice questions 


---

 
349
 
1. **Theory:** Describe how `IntersectionObserver` differs from listening to the `scroll` event for 
detecting when an element enters the viewport. What performance benefits does it offer? 
2. **Theory:** What types of mutations can `MutationObserver` detect? How do the options you 
pass to `observe()` control which mutations are reported? 
3. **Coding:** Implement lazy loading of images: write a script that uses `IntersectionObserver` to 
replace `data-src` with `src` when images scroll into view. 
4. **Coding:** Write a `MutationObserver` that logs a message whenever a `<ul>` gains or loses 
`<li>` items. Then write code to add and remove list items to test it. 
5. **Theory:** Why is it important to call `disconnect()` on a `MutationObserver` or stop observing 
with `unobserve()` on an `IntersectionObserver` when they're no longer needed? 
 
These questions and examples will help you use observers effectively to build performant and 
reactive user interfaces. 
 
 
 


---

 
350
What is the difference between innerHTML and 
textContent? 
# `innerHTML` vs. `textContent`: Reading and Writing DOM Content Safely 
 
When manipulating HTML elements, two commonly used properties are `innerHTML` and 
`textContent`. Both allow you to inspect or update the contents of an element, but they behave 
differently and should be used for different purposes. 
 
## `innerHTML`: working with markup 
 
The `innerHTML` property gets or sets the **HTML markup** contained within an element. Reading 
`innerHTML` returns a string with the serialized HTML of the element's descendants. Writing to 
`innerHTML` parses the provided string as HTML and replaces all existing children with the result. 
 
```html 
<div id="container"><strong>Hello</strong>, world!</div> 
<script> 
  const container = document.getElementById("container"); 
  console.log(container.innerHTML); // "<strong>Hello</strong>, world!" 
  // Insert new markup 
  container.innerHTML = "<em>Hi</em> there!"; 
  // The content now becomes: <em>Hi</em> there! 
</script> 
``` 
 
Because `innerHTML` parses and inserts HTML, it is considered an **injection sink**—a potential 
source of **cross-site scripting (XSS)** vulnerabilities. Never insert untrusted user input via 
`innerHTML`. Browsers treat the input as HTML, so any `<script>` tags or event handlers will run. 
Mitigate this risk by sanitizing input or using the [Trusted Types 
API](https://developer.mozilla.org/en-US/docs/Web/API/TrustedHTML) in modern browsers. 
 
`innerHTML` has other drawbacks: 
 


---

 
351
- **Performance:** Setting `innerHTML` replaces all child nodes, causing the browser to tear down 
and rebuild the subtree. For small strings this is fine, but for large or frequent updates it can be 
costly. 
- **Security:** As noted, raw HTML insertion can lead to XSS if not sanitized. 
 
Despite these caveats, `innerHTML` is useful when you intentionally want to insert or extract 
markup—such as templating frameworks, building elements from strings, or copying fragments of 
HTML. 
 
## `textContent`: working with plain text 
 
The `textContent` property returns the **text** content of an element and all its descendants. It 
ignores HTML tags and scripts, and returns all text including that within `<script>` or `<style>` 
elements. Setting `textContent` on a node removes all existing children and inserts a single text node 
with the provided string. 
 
```html 
<div id="msg"><span>Hi</span> <strong>there</strong>!</div> 
<script> 
  const msg = document.getElementById("msg"); 
  console.log(msg.textContent); // "Hi there!" 
  msg.textContent = "<b>Safe?</b>"; // sets literal text, not HTML 
  // The div now literally contains: &lt;b&gt;Safe?&lt;/b&gt; 
</script> 
``` 
 
Key points about `textContent`: 
 
- It **does not parse HTML**. Characters like `<` and `>` are treated as plain text. 
- It includes text from `<script>` and `<style>` elements when reading. If you want only 
human-readable text, consider using `innerText` (which is aware of styling and excludes hidden text), 
although `innerText` triggers layout reflows and should be used sparingly. 
- It is generally **faster and safer** for inserting or retrieving plain text because the browser doesn't 
have to run the HTML parser or manage potential scripts. 


---

 
352
 
## Which one should you use? 
 
Use `innerHTML` when you need to work with HTML fragments—adding or retrieving markup. 
Always sanitize or trust the input. Use `textContent` when you only need to handle text, especially if 
the text may include characters that look like HTML. It prevents injection attacks and avoids 
triggering a reflow when reading. 
 
### Summary of differences 
 
| Aspect                   | `innerHTML`                                    | `textContent`                              | 
| ------------------------ | ---------------------------------------------- | ------------------------------------------ | 
| Returns                  | HTML markup as a string                        | Only textual content                       | 
| Parses input as HTML     | Yes                                            | No; treats input as plain text             | 
| Includes `<script>` text | Not included when reading                      | Included when 
reading                      | 
| Performance when writing | Replaces all children and reparses HTML        | Replaces children with a 
single text node  | 
| XSS risk                 | High if input is not sanitized                 | Low, since markup is escaped               | 
| Common use cases         | Rendering templates, copying HTML, complex UIs | Setting or reading 
user-visible plain text | 
 
## Real-world analogy 
 
Think of `innerHTML` as giving someone a bowl of ingredients and a recipe—the browser must cook 
(parse) the recipe into a finished dish. If you hand over spoiled or dangerous ingredients (unsanitized 
user input), you risk poisoning the dish. `textContent` is like handing over a sealed, pre-cooked 
meal—no interpretation is needed and there's no risk of hidden hazards. 
 
## Practice questions 
 
1. **Theory:** Explain the security implications of using `innerHTML` with user-provided input. How 
can you mitigate these risks? 
2. **Coding:** Write a function `setSafeText(element, str)` that sets the text of `element` using the 
safest property for displaying plain text. Test it by passing strings containing HTML tags. 


---

 
353
3. **Coding:** Create a script that reads the text of every `<p>` element on a page using 
`textContent` and appends the lengths of these texts after each paragraph. 
4. **Theory:** Compare `textContent` with `innerText`. In what scenarios would you prefer one over 
the other? 
5. **Theory:** Why might setting `innerHTML` cause performance issues if used repeatedly in a 
loop? Suggest a more efficient alternative for appending many elements. 
 
These exercises will help you choose the right property and write secure, efficient DOM manipulation 
code. 
 
 
 


---

 
354
What are custom events and how do you dispatch 
them? 
# Custom events and how to dispatch them 
 
Web pages are built around **events**. A click, keypress or network response triggers an event that 
bubbles through the DOM. While browsers provide many built-in events, you can also define your 
own to signal that something application-specific has happened. These are called **custom 
events**. 
 
## Why custom events? 
 
Imagine you have a complex widget composed of smaller components. When one component 
finishes a task (say, a form validates successfully), it needs to tell its parent about it without tightly 
coupling the two. A custom event provides this channel: the child dispatches a named event on itself; 
the parent listens for that name and reacts accordingly. 
 
## Creating a custom event 
 
You create a custom event with the `CustomEvent` constructor. The first argument is the event type 
(a string) and the second is an optional object where you can attach data: 
 
```js 
const todoAdded = new CustomEvent("todoAdded", { 
  detail: { id: 42, text: "Learn custom events" }, 
  bubbles: true, // allow the event to bubble up the DOM 
  cancelable: false, // whether the event's default action can be prevented 
}); 
``` 
 
The `detail` property can contain any serialisable data. The `bubbles` flag determines whether the 
event propagates up through ancestor elements. If you omit `bubbles`, the event will fire only on the 
target element. 
 
### Dispatching a custom event 


---

 
355
 
Custom events are dispatched using `dispatchEvent()` on any `EventTarget` (elements, `window`, 
`document`, etc.): 
 
```js 
const form = document.querySelector("#todo-form"); 
// After creating the event 
form.dispatchEvent(todoAdded); 
``` 
 
When the event is dispatched, any listeners for `'todoAdded'` on the target or its ancestors (if 
`bubbles` is `true`) will run. You add listeners with `addEventListener()` just like for native events: 
 
```js 
document.addEventListener("todoAdded", (event) => { 
  console.log("New todo:", event.detail); 
}); 
``` 
 
The event object passed to the handler has the usual properties (`type`, `target`, `currentTarget`, 
`bubbles`) plus your data on `detail`. You can call `stopPropagation()` to prevent the event from 
bubbling further or `preventDefault()` only if `cancelable` is `true` and you've defined a default 
action. 
 
### Example: notifying when data loads 
 
Suppose you fetch data in a component and want to notify consumers that loading has finished. 
Here's an example using a custom event: 
 
```js 
// data-loader.js 
export default class DataLoader extends HTMLElement { 
  async connectedCallback() { 


---

 
356
    const res = await fetch("/api/users"); 
    this.users = await res.json(); 
    // inform listeners that data is ready 
    this.dispatchEvent( 
      new CustomEvent("data-loaded", { 
        detail: { users: this.users }, 
        bubbles: true, 
      }) 
    ); 
  } 
} 
 
// parent component 
document.body.addEventListener("data-loaded", (event) => { 
  console.log("Users:", event.detail.users); 
}); 
``` 
 
By using a custom event, the `DataLoader` component doesn't need to know who is interested in the 
data; it simply broadcasts that the data is ready. 
 
## Best practices and pitfalls 
 
- **Name events clearly.** Event names are case-sensitive, so `taskDone` and `taskdone` are 
different events. Use a naming scheme (like kebab-case) to avoid collisions. 
- **Use the `detail` property** to transmit data; avoid attaching arbitrary properties to the event 
object. 
- **Consider bubbling** when the event should be handled by ancestors, but avoid unnecessary 
bubbling on large DOM subtrees to reduce overhead. 
- **Don't overuse custom events.** For tightly coupled components, direct method calls or callback 
functions are simpler. Custom events shine when decoupling components or implementing plugin 
systems. 
 


---

 
357
## Practice questions 
 
1. **Theory:** Explain the difference between a built-in DOM event (such as `click`) and a custom 
event created with `CustomEvent`. 
2. **Theory:** What happens if you dispatch a custom event without setting the `bubbles` option? 
How does it affect event propagation? 
3. **Coding:** Write a function `createStatusEvent(name, status)` that returns a custom event 
named `name` with a `status` property in its detail. Include the option for the event to bubble. 
4. **Coding:** Given a component that validates user input, dispatch a `formValid` event with a 
boolean indicating success. Demonstrate how a parent element listens for this event. 
5. **Theory:** When would you choose to prevent the default action of a custom event? How do 
`cancelable` and `preventDefault()` work together in the context of custom events? 
 
 
 


---

 
358
Explain microtask queue vs nextTick in Node.js 
# Microtask queue vs `process.nextTick()` in Node.js 
 
JavaScript runtimes use an **event loop** to interleave work so the main thread can handle user 
interactions, I/O and timers without blocking. Within each loop iteration there are two important 
queues of callbacks: **macrotasks** (also called tasks) and **microtasks**. 
 
Understanding the distinction between the microtask queue and Node's special `process.nextTick()` 
queue helps you write efficient asynchronous code without starving I/O. 
 
## The microtask queue 
 
Microtasks are scheduled by features such as `Promise` resolutions, `queueMicrotask()` and (in 
browsers) `MutationObserver`. After the currently executing script finishes and the call stack 
unwinds, the event loop processes **all** microtasks in FIFO order before moving on to the next 
macrotask. This guarantees that promise callbacks run as soon as possible, keeping program state 
consistent: 
 
```js 
Promise.resolve().then(() => console.log("microtask 1")); 
console.log("script end"); 
// logs: 
// script end 
// microtask 1 
``` 
 
Because the microtask queue is drained completely before the next task, adding more microtasks 
within a microtask will delay the event loop until the queue is empty. Overusing microtasks 
(especially in loops) can delay timers and I/O. 
 
## `process.nextTick()` 
 


---

 
359
Node.js provides its own queue processed even **earlier** than the microtask queue. Calling 
`process.nextTick()` schedules a callback to run **immediately after the current operation 
completes**, before any pending microtasks or I/O events: 
 
```js 
console.log("start"); 
process.nextTick(() => console.log("nextTick")); 
Promise.resolve().then(() => console.log("microtask")); 
console.log("end"); 
// output: 
// start 
// end 
// nextTick 
// microtask 
``` 
 
Here, the `nextTick` callback runs before the promise's `.then()` handler. Node uses `nextTick()` 
internally for its own housekeeping (such as emitting the `'exit'` event). Because callbacks scheduled 
with `process.nextTick()` run before I/O, it's possible to starve the event loop. If a nextTick callback 
recursively schedules itself, it can block the processing of timers or network events. 
 
### When to use `process.nextTick()` 
 
You might use `nextTick()` when you need to run code **immediately** after the current function 
finishes but before any promise handlers or I/O. Common use cases include: 
 
- **Error handling:** Ensure error listeners are attached before emitting an error event. 
- **Breaking up synchronous work:** Large synchronous operations can block the event loop. 
Splitting work across multiple `nextTick()` calls yields control back to Node between chunks. 
 
However, prefer `setImmediate()` or promises when you simply need to schedule code on the next 
iteration of the event loop. They run after I/O callbacks, avoiding starvation. 
 
## Summary of differences 


---

 
360
 
 
## Practice questions 
 
1. **Theory:** What is the order of execution between `process.nextTick()`, promise microtasks and 
timer callbacks? Explain with a simple example. 
2. **Coding:** Write a Node.js script that logs messages in the following order: `script`, `nextTick`, 
`microtask`, `timer`. Use `process.nextTick()`, `Promise.resolve().then()` and `setTimeout()`. 
3. **Theory:** Why can overusing `process.nextTick()` lead to starvation of I/O? How can you 
mitigate this risk? 
4. **Coding:** Convert a synchronous loop that blocks the event loop for 100 ms into a non-blocking 
loop using `process.nextTick()` or `setImmediate()`. Observe the differences. 
5. **Theory:** When would you prefer `queueMicrotask()` over `process.nextTick()` in Node.js? 
Discuss advantages and trade-offs. 
 
 
 


---

 
361
What is the difference between V8 engine internals and 
standard JavaScript? 
# Difference between V8 engine internals and standard JavaScript 
 
JavaScript is defined by the **ECMAScript specification**, which describes the syntax and behaviour 
of the language. A JavaScript engine is an implementation of that specification. **V8** is one of 
those engines. It powers Google Chrome, Node.js, Deno and many other environments. 
Understanding the difference between the two helps explain why some features exist in one 
environment but not another. 
 
## Standard JavaScript 
 
The ECMAScript specification (often shortened to **ECMA-262**) defines how the language 
behaves: how variables are scoped, how functions are called, how promises work and so on. It 
deliberately leaves out details about performance, memory layout or integration with operating 
systems. When you write `const x = 5`, you're using standard JavaScript syntax and semantics that 
any conforming engine should implement. 
 
The spec also defines _built-in_ objects like `Array`, `Promise` and `Map`. It does **not** define 
host-specific APIs such as `document`, `console`, `require()` or file system access. Those are provided 
by the host environment (browser, Node.js) on top of the core language. 
 
## V8 engine internals 
 
V8 is written in C++ and implements the ECMAScript spec. It also implements Web APIs (when 
embedded in Chrome) or Node APIs (when embedded in Node.js) by exposing additional objects. 
Internally, V8 performs many optimisations to execute JavaScript quickly: 
 
- **Just-in-time (JIT) compilation.** V8 first interprets JavaScript with a baseline interpreter 
(Ignition). Hot functions are then compiled to machine code by the TurboFan optimizing compiler. V8 
collects type feedback at runtime and speculates about types to generate fast code. If speculation 
fails, it "deoptimises" back to the interpreter. 
- **Hidden classes and inline caching.** Unlike statically typed languages, JavaScript objects can 
change shape at runtime. V8 groups objects with the same property layout into hidden classes. 
When properties are accessed, V8 can look up their offset quickly using the hidden class and caches 
the location for subsequent accesses. This avoids expensive dictionary lookups on every property 
access. 


---

 
362
- **Generational garbage collection.** V8 allocates objects in a young generation and assumes most 
die young. The young generation is collected frequently, and surviving objects are promoted to an 
old generation. This reduces pause times compared to scanning the entire heap. 
 
These internal features are not visible in standard JavaScript code—there is no API to control hidden 
classes or trigger JIT compilation—but understanding them can inform best practices: define all 
properties in your constructor to avoid creating multiple hidden classes, avoid adding new properties 
to objects on the fly and refrain from mixing types in arrays. 
 
## Differences in environment features 
 
Because V8 is embedded in different hosts, it exposes different global objects depending on where it 
runs: 
 
 
These APIs are not part of the ECMAScript spec; they are provided by the host to interact with the 
environment (DOM, file system, network). This explains why code that uses 
`document.getElementById()` fails in Node.js and why Node's `require()` is unavailable in browsers. 
 
## Practice questions 
 
1. **Theory:** What aspects of JavaScript are defined by ECMAScript, and what aspects are left to 
host environments? Give examples of each. 
2. **Theory:** Explain how V8's hidden classes and inline caching improve property access 
performance. How can code structure influence hidden class generation? 
3. **Theory:** Why is there no standard API to control the JIT compiler or garbage collector in 
JavaScript? What would be potential issues if such control existed? 
4. **Coding:** Write a constructor function that sets all properties on the instance in the same 
order each time. Explain why this approach benefits V8's hidden class optimisation. 
5. **Theory:** Compare the global objects available in the browser and Node.js. Why are some APIs 
like `fetch()` available in both, while others like `require()` are environment-specific? 
 
 
 


---

 
363
How does just-in-time (JIT) compilation work in 
JavaScript engines? 
# How just-in-time (JIT) compilation works in JavaScript engines 
 
JavaScript began life as an interpreted scripting language. Early engines read source code and 
executed it directly. To improve performance, modern engines use **just-in-time (JIT) 
compilation**: they compile frequently executed code to machine instructions at runtime. JIT 
compilers combine the flexibility of dynamic languages with the speed of compiled languages. 
 
## Interpreter, baseline JIT and optimising compiler 
 
Most engines employ a multi-tier pipeline. Taking V8 as an example: 
 
1. **Parser and interpreter:** Source code is parsed and compiled into bytecode for a lightweight 
interpreter (Ignition). This allows quick start-up and supports dynamic features like `eval()`. 
2. **Profiler:** As code runs, the engine records how often functions are called, what types 
arguments and return values have and which branches are taken. This data is called _type feedback_. 
3. **Optimising compiler:** When a function becomes "hot" (executed many times), the engine 
compiles it with an optimising compiler (TurboFan in V8, IonMonkey in SpiderMonkey). The compiler 
uses type feedback to specialise the code: it may assume that a variable is always a number and 
generate faster machine code for that case. 
 
The optimising compiler performs aggressive transformations: inlining small functions, eliminating 
bounds checks, constant folding and removing dead code. If the assumptions prove true, the code 
runs much faster than interpreted code. 
 
## Deoptimisation 
 
JavaScript is dynamic. A variable that was always a number may suddenly become a string. If that 
happens, the assumptions in the compiled code no longer hold. Engines handle this by 
**deoptimising**: they bail back to the interpreter, patching up the program state, and collect new 
feedback. The function may be recompiled with updated assumptions or continue in the interpreter. 
 
Deoptimisation makes JIT compilation invisible to developers. You don't need to think about types 
ahead of time, but writing code with consistent types helps the compiler stay in optimized code 
paths. 


---

 
364
 
## Benefits and trade-offs 
 
- **Speed:** JIT-compiled code can be as fast as native code when the compiler's assumptions hold. 
Hot loops and heavy calculations benefit the most. 
- **Startup cost:** Compiling code takes time. That's why engines interpret code first and only 
compile hot functions. Very short scripts may not get JIT-compiled at all. 
- **Memory:** JIT compilers store multiple versions of compiled code (baseline and optimized) and 
metadata. On devices with limited memory, engines may limit JIT usage. 
- **Security:** Generating executable memory at runtime has security implications (spectre 
mitigations, write-execute permissions). Browsers implement safeguards like memory page 
protection and pointer authentication. 
 
## JIT compilation in other engines 
 
While the details differ, major engines follow a similar strategy: 
 
- **V8 (Chrome, Node.js):** Ignition interpreter, TurboFan optimising compiler. 
- **SpiderMonkey (Firefox):** Baseline Interpreter, Baseline JIT, IonMonkey optimising JIT. 
- **JavaScriptCore (Safari):** LLInt (low-level interpreter), Baseline JIT (DFG), and the C Loop 
interpreter. 
 
Some environments, such as older mobile browsers or embedded systems, may disable JIT for 
security or resource reasons. In such cases, code runs entirely in the interpreter. 
 
## Practice questions 
 
1. **Theory:** Describe the roles of the interpreter, profiler and optimising compiler in a modern JS 
engine's pipeline. Why is a two-tier strategy used instead of immediately compiling everything? 
2. **Theory:** Explain how type feedback enables faster machine code. What happens when an 
assumption is violated? 
3. **Theory:** List some optimisations that an optimising JIT compiler might perform on JavaScript 
code. How do they improve performance? 


---

 
365
4. **Coding:** Write a function that performs a numeric calculation in a tight loop. Run it multiple 
times and observe the difference in performance with and without type changes (e.g., switching a 
number to a string midway). Explain why the engine might deoptimise and reoptimise your function. 
5. **Theory:** Discuss the security considerations of JIT compilation. What measures do browser 
vendors take to mitigate risks associated with generating executable code at runtime? 
 
 
 


---

 
366
Explain hidden classes and inline caching in V8 
# Hidden classes and inline caching in V8 
 
JavaScript is a dynamic language: you can add or remove properties from objects at any time. While 
this flexibility is powerful, it presents challenges for performance. The V8 engine uses two key 
techniques—**hidden classes** and **inline caching**—to make property access fast without 
sacrificing dynamism. 
 
## Hidden classes (also called shapes) 
 
In languages like C++ each class has a fixed layout that tells the runtime where to find fields. 
JavaScript objects do not have classes in the same way; each object's properties could be different. 
V8 bridges this gap by creating an internal _hidden class_ for each distinct object shape. A hidden 
class records the names and order of an object's properties and maps them to fixed offsets in 
memory. 
 
When you create an object, V8 assigns it a hidden class based on the properties you define. Adding a 
new property transitions the object to a new hidden class. If two objects add the same properties in 
the same order, V8 reuses the same hidden class, enabling them to share inline caches and compiled 
code. 
 
### Why order matters 
 
Because hidden classes track the order in which properties are added, defining properties 
consistently yields fewer class transitions: 
 
```js 
// Constructor function creates a predictable shape 
function Point(x, y) { 
  this.x = x; 
  this.y = y; 
} 
 
const p1 = new Point(1, 2); 


---

 
367
const p2 = new Point(3, 4); 
// p1 and p2 share the same hidden class 
 
// Avoid adding properties later, which would create a new hidden class: 
p1.z = 5; // now p1 uses a different hidden class than p2 
``` 
 
By declaring all properties in the constructor, you help V8 reuse hidden classes, enabling better 
optimisation and inline caching. Adding properties outside the constructor or in different orders 
causes V8 to create new hidden classes, preventing code sharing. 
 
## Inline caching 
 
When V8 executes a property access like `obj.x`, it must find where `x` lives in memory. Without 
optimisation, it would perform a dynamic lookup every time. Inline caching (IC) speeds this up by 
remembering the hidden class of the object and the offset of the requested property. 
 
- The first time `obj.x` is executed, V8 does the full lookup and stores the resulting hidden class and 
offset in a tiny cache attached to the instruction. 
- The next time the same instruction runs and the object has the same hidden class, V8 can skip the 
lookup and jump straight to the stored offset. 
- If the object has a different hidden class, V8 falls back to a slower path and may update the inline 
cache to reflect the new shape (polymorphic inline caching). 
 
Inline caches dramatically speed up property reads and writes when objects are consistently shaped. 
They also collect type feedback for the JIT compiler; if the cache sees many different shapes, the 
compiler may treat the operation as polymorphic and generate a more general (slower) code path. 
 
## Best practices to help hidden classes and caches 
 
- **Initialise all instance properties in the constructor**. Avoid adding properties later. 
- **Add properties in the same order** for all instances of a given "class". 
- **Avoid mixing unrelated types** in arrays and object fields. Homogeneous arrays enable better 
optimised code. 


---

 
368
- **Delete properties sparingly**, as deletion also changes the hidden class and can deoptimise 
code. 
 
## Practice questions 
 
1. **Theory:** What is a hidden class in V8 and how does it differ from a traditional class in 
languages like Java or C++? 
2. **Theory:** Describe how adding properties in different orders affects hidden classes. Why is it 
beneficial to initialise all properties in the constructor? 
3. **Theory:** Explain the concept of inline caching. How does it speed up repeated property 
accesses? 
4. **Coding:** Create a constructor that defines three properties. Instantiate two objects and 
demonstrate how adding a property to one instance can lead to different hidden classes and 
potentially slower code. 
5. **Theory:** What are the potential downsides of relying on inline caching? Under what 
circumstances might an inline cache become polymorphic or megamorphic, and how does that affect 
performance? 
 
 
 


---

 
369
What are WeakRefs and FinalizationRegistry? 
# Weak references and the `FinalizationRegistry` 
 
Modern JavaScript engines use garbage collection to free memory when objects are no longer 
reachable. Most of the time you can ignore memory management, but some patterns—such as 
caches—require you to hold references to objects without preventing their collection. **Weak 
references (WeakRef)** and **`FinalizationRegistry`** provide mechanisms for that. 
 
## Weak references 
 
A normal (strong) reference prevents an object from being garbage-collected. A _weak reference_ 
allows you to refer to an object without affecting its liveness. If the object becomes unreachable 
from the rest of your code, the garbage collector can reclaim it even though a `WeakRef` still exists. 
 
You create a weak reference with `new WeakRef(target)`. The only operation on a `WeakRef` is 
`.deref()`, which returns the original object if it's still alive or `undefined` if it has been collected: 
 
```js 
const cache = new Map(); 
function getUser(id) { 
  const ref = cache.get(id); 
  let user = ref && ref.deref(); 
  if (!user) { 
    user = loadUserFromDB(id); 
    cache.set(id, new WeakRef(user)); 
  } 
  return user; 
} 
``` 
 
Here, the cache doesn't prevent `user` objects from being freed if nothing else refers to them. When 
you call `ref.deref()`, you either get a live object or `undefined`, in which case you reload it. 
 


---

 
370
Weak references are primarily useful for caches, memoisation and other data structures where stale 
values can be recomputed. You should not use them to manage critical resources; rely on strong 
references and proper cleanup instead. 
 
## The `FinalizationRegistry` 
 
`FinalizationRegistry` lets you register a callback that the engine will call after a particular object is 
garbage-collected. The constructor takes a cleanup function; you then call `.register(target, 
heldValue)` to associate a target object with a "held" value (often a resource identifier). When 
`target` is collected, the registry queues the held value for cleanup: 
 
```js 
const registry = new FinalizationRegistry((held) => { 
  console.log("Cleaning up resource", held); 
}); 
 
function trackResource(obj, id) { 
  // obj is the user-facing object; id identifies an external resource 
  registry.register(obj, id); 
} 
 
// later 
const resource = { 
  /* ... */ 
}; 
trackResource(resource, "socket:1234"); 
// when resource becomes unreachable, the cleanup callback runs 
``` 
 
The callback runs at some time _after_ the object has been reclaimed. The specification makes no 
guarantee about when or even if the callback will execute. The callback is invoked in a separate task, 
so you cannot depend on it for essential finalisation (e.g. closing files or releasing locks). Use it 
instead to clean up ancillary caches or to log when objects are collected. 
 


---

 
371
## Caveats and warnings 
 
- Weak references and finalisation can expose details of the garbage collector. Overusing them may 
make code unpredictable or brittle. 
- There is no guarantee that a finalizer will run in a timely manner; it may never run if the process 
exits before collection. Always provide explicit cleanup methods when working with critical 
resources. 
- Only use `FinalizationRegistry` when you have no other way to detect object lifecycle events. For 
example, a `Map` of objects keyed by ID should use explicit `delete()` instead of relying on 
finalisation. 
 
## Practice questions 
 
1. **Theory:** Why might you use a `WeakRef` rather than a normal reference in a cache? What 
happens when the object referenced by a `WeakRef` is garbage-collected? 
2. **Theory:** Describe the lifecycle of a finalizer registered via `FinalizationRegistry`. Why is it not 
safe to put critical cleanup in a finalizer callback? 
3. **Coding:** Implement a memoisation function that caches results using `WeakRef` so that 
entries can be reclaimed when their keys are no longer used. 
4. **Theory:** List potential pitfalls of using `WeakRef` and `FinalizationRegistry`. How would you 
design your code to avoid these pitfalls? 
5. **Coding:** Demonstrate how you can register an object with `FinalizationRegistry` and observe 
when the cleanup callback runs by creating and discarding objects inside a loop. (Hint: You may need 
to force garbage collection in a controlled environment for testing.) 
 
 
 


---

 
372
How does debounce–throttle combo optimize 
performance? 
# How a debounce-throttle combination optimises performance 
 
Many user interactions fire events rapidly: resize, scroll, keyup or window resize can trigger dozens or 
hundreds of callbacks per second. If each event performs expensive work (rendering, network 
requests), performance suffers. **Debouncing** and **throttling** are two techniques for limiting 
how often a function runs. Combining them allows you to tailor responsiveness and resource use. 
 
## Quick recap 
 
- **Debouncing** delays execution of a function until a certain time has passed without another 
trigger. Each new call resets the timer. Debounce is useful when you only care about the final event 
in a burst—such as submitting a search after the user stops typing. 
- **Throttling** allows a function to run at most once every `N` milliseconds. Additional calls within 
the interval are ignored. Throttle is ideal when you want periodic updates, like repositioning 
elements while the user scrolls. 
 
## Combining debounce and throttle 
 
Sometimes you need the best of both worlds: provide an immediate response, update periodically 
during a burst and ensure a final update after activity stops. A **debounce-throttle combo** does 
exactly that. A common implementation runs the function at the beginning and end of a burst, but 
throttles intermediate calls. 
 
Here is a simple implementation with options for leading (immediate) and trailing (final) calls: 
 
```js 
function debounceThrottle(fn, delay) { 
  let lastCall = 0; 
  let timerId; 
  return function (...args) { 
    const now = Date.now(); 
    const remaining = delay - (now - lastCall); 


---

 
373
    clearTimeout(timerId); 
    if (remaining <= 0) { 
      // Leading: run immediately and update lastCall 
      lastCall = now; 
      fn.apply(this, args); 
    } else { 
      // Trailing: schedule for after remaining time 
      timerId = setTimeout(() => { 
        lastCall = Date.now(); 
        fn.apply(this, args); 
      }, remaining); 
    } 
  }; 
} 
 
// Usage: execute immediately and at most every 200ms thereafter 
const handleResize = debounceThrottle(() => { 
  console.log("Resized at", new Date()); 
}, 200); 
window.addEventListener("resize", handleResize); 
``` 
 
In this example, the function runs immediately on the first resize event and then at most once every 
`delay` milliseconds. If events stop, a final trailing call ensures the latest state is processed. This 
pattern keeps the UI responsive while avoiding unnecessary work. 
 
## When to use a combo 
 
- **Responsive UI updates.** For scroll or mousemove handlers, you may want to update layout on 
the first event and periodically thereafter, but still handle the final state. 
- **Search suggestions.** Provide an instant suggestion as the user types but avoid hitting the API 
on every keystroke; throttle intermediate calls and debounce the final call. 


---

 
374
- **Window resize recalculations.** Immediately adjust layout, then throttle continuous updates 
and finally apply finishing touches when resizing stops. 
 
## Practice questions 
 
1. **Theory:** Explain the difference between debouncing and throttling. Give an example use case 
for each. 
2. **Theory:** Why might you combine debouncing and throttling rather than use only one? 
Describe a scenario where a combo is beneficial. 
3. **Coding:** Implement a `debounceThrottle` function that accepts options `{ delay, leading, 
trailing }` to control whether the wrapped function runs at the start of the burst, end of the burst or 
both. 
4. **Coding:** Attach a scroll event listener to an element using your `debounceThrottle` 
implementation. Log the scroll position immediately and then no more frequently than every 
100 ms, with a final log after scrolling stops. 
5. **Theory:** What risks arise if you debounce a function that handles essential state updates (e.g. 
resizing a canvas)? How can a throttle or combo alleviate those risks? 
 
 
 


---

 
375
What are ArrayBuffer and TypedArray? 
# ArrayBuffer and TypedArray 
 
JavaScript strings and objects are convenient for text and structured data, but they are not suitable 
for handling raw binary data such as images, audio streams or network packets. The **ArrayBuffer** 
and **TypedArray** APIs provide a way to work with binary data in memory, enabling you to read 
and write bytes directly. 
 
## ArrayBuffer 
 
An **ArrayBuffer** is a fixed-length block of raw memory. It represents a contiguous sequence of 
bytes but offers no way to interpret those bytes. Think of it as an empty canvas: you need a brush (a 
_view_) to draw on it. You create an ArrayBuffer with `new ArrayBuffer(length)`, where `length` is the 
number of bytes: 
 
```js 
const buffer = new ArrayBuffer(16); // allocate 16 bytes (128 bits) 
console.log(buffer.byteLength); // 16 
``` 
 
You cannot read or write individual bytes directly through the ArrayBuffer. Instead, you create a 
view—either a typed array or a `DataView`—that provides typed access to its contents. 
 
## Typed arrays 
 
Typed arrays are array-like objects that view and manipulate binary data in an ArrayBuffer. Each 
typed array type corresponds to a specific numeric format (e.g., `Uint8Array` for 8-bit unsigned 
integers, `Int32Array` for 32-bit signed integers, `Float64Array` for double-precision floats). Creating a 
typed array allocates or attaches to a buffer: 
 
```js 
// Create a new buffer and view it as 8-bit unsigned integers 
const bytes = new Uint8Array(4); // allocates a buffer of length 4 
bytes[0] = 255; 


---

 
376
bytes.set([1, 2, 3], 1); 
console.log(bytes); // Uint8Array [255, 1, 2, 3] 
 
// Create a buffer separately and attach a view 
const buf = new ArrayBuffer(8); 
const ints = new Int16Array(buf); // 16-bit signed integers (2 bytes each) 
ints[0] = 42; 
ints[1] = -1; 
console.log(ints); // Int16Array [42, -1, 0, 0] 
``` 
 
Typed arrays share many methods with normal arrays (`map`, `forEach`, `filter`) but lack some (like 
`push`, because their length is fixed). They are not true `Array` objects; `Array.isArray()` returns `false` 
for typed arrays. All typed arrays have a `buffer` property referencing their underlying ArrayBuffer, 
and they view data starting at an **offset** for a **length**. Multiple views can reference the same 
buffer with different offsets and element types, allowing you to interpret the same bytes in various 
ways. 
 
## DataView 
 
While typed arrays interpret data in fixed element sizes, `DataView` lets you read and write arbitrary 
numbers of bytes with specific endianness. It is useful when the data format doesn't align neatly with 
typed array element sizes or when working with network protocols that require big-endian order: 
 
```js 
const buf = new ArrayBuffer(4); 
const view = new DataView(buf); 
view.setUint16(0, 0x1234, false); // big-endian 
view.setUint16(2, 0xabcd, false); 
console.log(view.getUint32(0, false).toString(16)); // '1234abcd' 
``` 
 
## Use cases 


---

 
377
 
- **Binary network protocols:** WebSockets and WebRTC can send ArrayBuffers directly, allowing 
efficient binary transmission. 
- **Multimedia:** Audio and video APIs use typed arrays for PCM data and pixel buffers. 
- **Cryptography:** Cryptographic algorithms operate on byte arrays rather than strings. 
- **WebGL:** Vertex buffers and textures are supplied as typed arrays to WebGL for rendering. 
 
## Practice questions 
 
1. **Theory:** What is the relationship between an ArrayBuffer and a typed array? Why can't you 
read or write bytes directly on an ArrayBuffer? 
2. **Theory:** Describe how typed arrays differ from regular JavaScript arrays. What methods do 
they share and which do they lack? 
3. **Coding:** Create an `ArrayBuffer` of length 12 bytes. View it as both `Uint8Array` and 
`Float32Array` and demonstrate how changing one view affects the other. 
4. **Coding:** Use a `DataView` to write a 32-bit big-endian integer at offset 0 and then read it back 
as two 16-bit unsigned integers. Explain what happens. 
5. **Theory:** Why might you choose a typed array over a regular array when working with WebGL 
or other low-level APIs? 
 
 
 


---

 
378
Explain SharedArrayBuffer and Atomics API 
# SharedArrayBuffer and the `Atomics` API 
 
Web workers allow JavaScript to run in parallel threads, but normally each worker has its own 
heap.  Data is copied between threads via structured cloning.  For high-performance scenarios like 
games, scientific simulations or shared caches, copying large amounts of data becomes a 
bottleneck.  **SharedArrayBuffer** and the **`Atomics`** API solve this by enabling shared 
memory and synchronised access. 
 
## SharedArrayBuffer 
 
A **SharedArrayBuffer** is like an `ArrayBuffer` but its memory can be shared between multiple 
execution contexts (the main thread and workers).  Any view (typed array or `DataView`) created 
from the same SharedArrayBuffer sees the same underlying bytes.  Changing a byte in one view 
immediately affects all views. 
 
Example of creating a shared buffer and sharing it with a worker: 
 
```js 
// main.js 
const sab = new SharedArrayBuffer(1024); // 1KB shared memory 
const sharedInts = new Uint32Array(sab); 
sharedInts[0] = 42; 
 
const worker = new Worker('worker.js'); 
// Transfer a reference to the shared buffer 
worker.postMessage(sab); 
 
// worker.js 
self.onmessage = (e) => { 
  const shared = new Uint32Array(e.data); 
  console.log('Initial value:', shared[0]); 
  shared[0] = shared[0] + 1; 


---

 
379
  // The main thread sees this change instantly 
}; 
``` 
 
Because `SharedArrayBuffer` allows threads to modify the same memory, it introduces race 
conditions.  Without coordination, updates can interleave unpredictably.  To coordinate reads and 
writes, you must use **atomic operations**. 
 
## The `Atomics` API 
 
The `Atomics` object provides atomic operations on shared typed arrays.  Atomic operations are 
indivisible: no other thread can observe a partial update.  `Atomics` includes functions for reading 
and writing (`load`, `store`), arithmetic (`add`, `sub`, `and`, `or`, `xor`), compare-and-swap 
(`compareExchange`) and waiting/notification (`wait`, `notify`).  These functions operate on integer 
typed arrays (`Int8Array`, `Uint16Array`, `Uint32Array`, etc.) backed by a SharedArrayBuffer. 
 
### Synchronisation and locks 
 
`Atomics.wait()` causes the calling thread to block until another thread calls `Atomics.notify()` on the 
same location or a timeout expires.  This provides a simple building block for implementing mutexes, 
semaphores and other synchronisation primitives.  For example, a shared ring buffer can coordinate 
producer and consumer threads: 
 
```js 
// main thread: producer 
const queue = new Int32Array(sab); 
const writeIndex = 0; // index 0 holds write pointer 
const readIndex  = 1; // index 1 holds read pointer 
 
function produce(value) { 
  const i = Atomics.load(queue, writeIndex); 
  // write value at position i+2 
  Atomics.store(queue, i + 2, value); 
  Atomics.store(queue, writeIndex, (i + 1) % 10); 


---

 
380
  Atomics.notify(queue, readIndex); 
} 
 
// worker thread: consumer 
function consume() { 
  while (true) { 
    let r = Atomics.load(queue, readIndex); 
    if (r === Atomics.load(queue, writeIndex)) { 
      // nothing to read; wait 
      Atomics.wait(queue, readIndex, r); 
    } else { 
      const value = Atomics.load(queue, r + 2); 
      // process value 
      Atomics.store(queue, readIndex, (r + 1) % 10); 
    } 
  } 
} 
``` 
 
This example shows how `Atomics` can implement a circular buffer without busy waiting. 
 
## Security considerations 
 
Because SharedArrayBuffers expose new side-channel attacks (Spectre), browsers require pages to 
opt in to **cross-origin isolation** and run in a secure context (HTTPS) before allowing 
SharedArrayBuffer usage.  You must set the `Cross-Origin-Opener-Policy: same-origin` and `Cross-
Origin-Embedder-Policy: require-corp` headers.  Without these headers, `SharedArrayBuffer` will 
throw a `SecurityError`. 
 
## Practice questions 
 
1. **Theory:** Explain why copying data between workers can be inefficient.  How does a 
SharedArrayBuffer solve this problem? 


---

 
381
2. **Theory:** Why are atomic operations necessary when using SharedArrayBuffer across 
threads?  What could go wrong if you access the buffer without `Atomics`? 
3. **Coding:** Create a main thread and a worker that share a `SharedArrayBuffer` of four 32-bit 
integers.  Have the worker increment the first value using `Atomics.add()` and notify the main thread 
using `Atomics.notify()`.  The main thread should wait for the update with `Atomics.wait()` and then 
log the new value. 
4. **Theory:** Describe the difference between `Atomics.compareExchange()` and 
`Atomics.exchange()`.  When would you use each? 
5. **Theory:** What security headers are required to use SharedArrayBuffer in modern 
browsers?  Why are they necessary? 
 
 
 


---

 
382
What is structured concurrency (upcoming spec)? 
# Structured concurrency: an upcoming JavaScript proposal 
 
Asynchronous programming allows a program to perform multiple tasks seemingly at once, but 
unstructured concurrency can lead to "zombie" tasks that continue running after the function that 
spawned them has returned. **Structured concurrency** is a design principle and proposed 
specification that aims to tame asynchronous code by ensuring that tasks have a well-defined 
lifetime and that errors propagate predictably. 
 
## The problem with unstructured concurrency 
 
In JavaScript today you can fire off a promise or `setTimeout()` without awaiting it. For example: 
 
```js 
async function fetchAndLog(url) { 
  fetch(url).then((response) => console.log("Fetched", response.status)); 
  return "returned immediately"; 
} 
 
const result = fetchAndLog("/api/data"); 
console.log(result); // logs 'returned immediately' while fetch continues in background 
``` 
 
The `fetchAndLog()` function returns immediately, and the caller has no control over or awareness of 
the ongoing fetch. If an error occurs, it may go unhandled. If the caller is cancelled or times out, the 
fetch keeps running. In larger systems, these orphaned tasks can accumulate and cause resource 
leaks. 
 
## What structured concurrency offers 
 
Structured concurrency proposes that asynchronous operations should be scoped to their parent 
function or block. When the parent completes, any child tasks should automatically be awaited or 
cancelled. The key ideas are: 
 


---

 
383
- **Task scoping:** Spawned tasks are tied to a context. They cannot outlive it. 
- **Failure propagation:** If a child task errors, the error bubbles up to the parent, allowing a single 
place to catch exceptions. 
- **Cancellation:** Cancelling the parent cancels all children. 
 
Other languages implement structured concurrency through constructs like Go's `context.Context`, 
Python's `asyncio` task groups or Kotlin's coroutines. The JavaScript proposal aims to provide similar 
capabilities via native APIs. 
 
## Proposed API sketch 
 
As of this writing, structured concurrency is an early-stage proposal. One experimental API uses 
**task functions** and **cancellation tokens**. A simplified sketch might look like this: 
 
```js 
// hypothetical API 
async function parent() { 
  const token = new CancellationToken(); 
  // start child tasks within this scope 
  const child1 = startTask(token, async () => doSomething()); 
  const child2 = startTask(token, async () => doSomethingElse()); 
 
  // wait for all children or throw on first error 
  try { 
    await Promise.all([child1, child2]); 
  } finally { 
    token.cancel(); // ensure cancellation on exit 
  } 
} 
``` 
 
In this sketch, `startTask()` spawns a task tied to a token. If one child throws, the token is cancelled 
and all tasks clean up. The parent waits on children before returning, ensuring no task leaks. 


---

 
384
 
## Current alternatives 
 
Until the proposal is standardised, you can achieve similar structure by manually tracking promises 
and cancellations: 
 
- **`AbortController`** and **`AbortSignal`**: Many web APIs support abort signals for 
cancellation. Pass the same signal to all concurrent operations and call `abort()` in a `finally` block. 
- **Helper libraries**: Libraries like `p-limit` and `taskgroup` implement structured concurrency 
patterns for Node.js. 
- **Error handling wrappers**: Wrap asynchronous functions so that thrown errors or rejections 
propagate to a common error handler instead of being lost. 
 
## Practice questions 
 
1. **Theory:** What problems arise when asynchronous tasks outlive their spawning function? Why 
is this problematic in long-running applications? 
2. **Theory:** Explain the main principles of structured concurrency. How do they differ from 
ad-hoc spawning of promises? 
3. **Coding:** Using `AbortController`, write an `async` function that starts two fetches in parallel 
and cancels both if either rejects or if the parent function returns early. 
4. **Theory:** How do other languages (e.g. Go, Python, Kotlin) implement structured concurrency? 
Identify similarities and differences with the proposed JavaScript approach. 
5. **Theory:** Discuss potential challenges in adding structured concurrency to the existing event 
loop and promise model. How might backward compatibility and cancellation semantics be handled? 
 
 
 


---

 
385
How does the ECMAScript spec define execution order? 
# How the ECMAScript specification defines execution order 
 
JavaScript's behaviour isn't arbitrary; it's governed by the **ECMAScript specification**. 
Understanding how the spec defines execution order helps demystify why code runs in a particular 
sequence and how asynchronous tasks are scheduled. 
 
## Synchronous execution order 
 
Within a single script, ECMAScript defines evaluation rules that determine the order in which 
expressions are executed. Key points include: 
 
- **Left-to-right evaluation**: In most binary expressions (`a + b`, `f(x, y)`), the left operand is 
evaluated before the right. Function arguments are evaluated from left to right. This means side 
effects occur in a predictable order: 
 
  ```js 
  function log(val) { 
    console.log(val); 
    return val; 
  } 
  const result = log("first") + log("second"); 
  // logs: first, then second 
  ``` 
 
- **Execution context stack**: Each time a function is called, a new execution context is pushed onto 
the call stack. The context holds local variables, the value of `this` and the point to return to. When a 
function returns, its context is popped and control resumes at the previous context. 
 
- **Hoisting**: Declarations of variables and functions are processed before code execution begins. 
Function declarations are hoisted with their body; `var` declarations are hoisted but initialised with 
`undefined`; `let` and `const` declarations are hoisted but remain in the "temporal dead zone" until 
initialised. 
 


---

 
386
These rules ensure that synchronous code executes deterministically. 
 
## Asynchronous execution: the event loop 
 
JavaScript environments are single-threaded, but they handle asynchronous operations by deferring 
work to the environment (e.g. the browser or Node's libuv) and then queueing callbacks. The 
ECMAScript spec doesn't define the event loop itself but references it for tasks like promises and 
modules. Hosts specify the details, but common behaviour is: 
 
1. **Run-to-completion**: A script or callback runs until it finishes without interruption. 
2. **Task queue**: When asynchronous operations (timers, I/O, user events) complete, their 
callbacks are queued as **tasks** (macrotasks). Examples include `setTimeout`, `setInterval`, DOM 
events and `requestAnimationFrame`. 
3. **Microtask queue**: Promise reaction jobs and `queueMicrotask()` callbacks are queued as 
**microtasks**. At the end of each task, the environment processes the microtask queue until it is 
empty. 
4. **Rendering**: In browsers, after microtasks, the rendering engine may update the UI. Then the 
event loop proceeds to the next task. 
 
This order explains why `Promise.then()` runs before `setTimeout()` callbacks, and why microtasks 
added within microtasks run before the next macrotask. 
 
## Property enumeration order 
 
The specification also defines the order in which object properties are iterated. `Object.keys()`, 
`for...in` and `Object.getOwnPropertyNames()` list: 
 
1. Integer index properties in ascending numeric order. 
2. String-keyed properties in insertion order. 
3. Symbol-keyed properties in insertion order. 
 
This guarantees predictability when iterating over object keys. 
 
## Module evaluation 


---

 
387
 
ECMAScript modules are loaded and executed in dependency order. The spec describes how module 
records are created, linked and evaluated. The host ensures that modules are fetched and parsed; 
the spec ensures that imported bindings are initialised before executing module code. Modules 
execute in top-level scope with their own module context; evaluation is asynchronous when using 
dynamic `import()`. 
 
## Practice questions 
 
1. **Theory:** In what order are function arguments evaluated in JavaScript? Give an example 
where the evaluation order affects the result. 
2. **Theory:** Describe what happens when a function calls itself recursively. How does the 
execution context stack handle nested calls? 
3. **Coding:** Write a script that logs numbers using `setTimeout()`, promises and synchronous logs 
to demonstrate the order in which tasks and microtasks run. Explain the observed output. 
4. **Theory:** Explain the property enumeration order for `for...in` loops. How does it differ for 
numeric keys versus string keys? 
5. **Theory:** How does the event loop ensure that the UI remains responsive while JavaScript 
code executes? What happens if you queue too many microtasks without yielding control? 
 
 
 


---

 
388
Explain Function.prototype.toString and environment 
internal slots 
# `Function.prototype.toString()` and internal slots 
 
JavaScript functions are objects with special behaviour defined by the ECMAScript specification. They 
provide useful methods and internal state. Two important aspects are the 
`Function.prototype.toString()` method—used to obtain a function's source code—and the 
**internal slots** that hold information like the environment where the function was created. 
 
## What does `Function.prototype.toString()` do? 
 
Every function instance inherits a `toString()` method that returns a string representation of its 
source code. For user-defined functions, this is the exact source text used to define the function, 
including whitespace and comments. If the function was created via the `Function` constructor, the 
returned string synthesises a function declaration named `anonymous`. For built-in functions (those 
implemented by the host), it returns a generic `[native code]` string. 
 
Examples: 
 
```js 
function add(a, b) { 
  return a + b; 
} 
console.log(add.toString()); 
// "function add(a, b) { return a + b; }" 
 
const anon = function (x) { 
  /* empty */ 
}; 
console.log(`${anon}`); // coercion calls toString 
// "function (x) { /* empty */ }" 
 
const sum = new Function("a", "b", "return a + b"); 


---

 
389
console.log(sum.toString()); 
// "function anonymous(a,b) {\nreturn a + b\n}" 
 
console.log(Math.max.toString()); 
// "function max() { [native code] }" 
``` 
 
The revision to `Function.prototype.toString()` in ES2018 requires engines to return the _exact_ 
source text for user code, ensuring predictable serialisation for tools like formatters and transpilers. 
Using `eval()` on the returned string of a built-in function is always a syntax error—its body cannot be 
reconstructed. 
 
## Internal slots and environments 
 
The ECMAScript specification defines objects using **internal slots**—hidden properties that 
cannot be accessed from user code. Function objects have several internal slots, including: 
 
- **[[Environment]]** - the lexical environment (scope) where the function was created. This slot 
enables closures: the function remembers variables from its defining scope. 
- **[[ECMAScriptCode]]** - the parsed bytecode for the function body. 
- **[[Realm]]** - the realm (global object and intrinsics) where the function was created. Different 
realms have different copies of built-in constructors and methods. 
- **[[Prototype]]** - the object's prototype, used for inheritance. 
 
These slots are conceptual, not properties you can read or write. They explain how the language 
works under the hood. When you call a function, the engine creates a new execution context and 
binds the function's `[[Environment]]` as its outer scope. This allows inner functions to access 
variables defined outside their body. 
 
### Realms and globals 
 
A **realm** is an execution context containing a global object and a set of intrinsic objects (`Array`, 
`Object`, etc.). When you evaluate code in a different realm (for example, in an iframe), functions 
created there have their `[[Realm]]` pointing to that realm. Their prototypes and constructors come 
from that realm's intrinsics. This explains why `instanceof` checks can fail across frames: each realm 
has distinct constructor functions. 


---

 
390
 
## Practice questions 
 
1. **Theory:** What does `Function.prototype.toString()` return for user-defined functions, 
functions created with the `Function` constructor and built-in functions? Give an example of each. 
2. **Theory:** Why does calling `eval()` on the result of `Math.max.toString()` throw a syntax error? 
3. **Theory:** Describe the purpose of the `[[Environment]]` internal slot. How does it enable 
closures? 
4. **Coding:** Write a function that captures a variable from its outer scope and use `toString()` to 
show the function's source. Explain why the function still has access to the captured variable when 
invoked later. 
5. **Theory:** Explain what a realm is in JavaScript and how the `[[Realm]]` internal slot affects 
things like `instanceof` across iframes. 
 
 
 


---

 
391
What is the Realms API and why might it matter for 
sandboxing? 
# The Realms API and sandboxing 
 
JavaScript code normally runs in a single **realm**—an environment consisting of a global object, a 
global scope and a set of intrinsic constructors like `Array` and `Object`. In the browser, the default 
realm is the top-level `window`. If you import code into this realm, it shares your globals and 
intrinsics. For some applications, this sharing is undesirable: you might want to run third-party scripts 
in isolation, without giving them access to your global state. That's where the **Realms API** comes 
in. 
 
## What is a realm? 
 
A realm is a separate instance of the JavaScript execution environment. Each realm has its own global 
object and its own copies of built-ins. Two objects from different realms have different constructors; 
for example, `Array.prototype` in one realm is not the same object as `Array.prototype` in another. 
Realms already exist implicitly: every browser iframe or Web Worker is a distinct realm. However, you 
can't easily create a new realm from code today; you must rely on iframes or workers. 
 
## The Realms (ShadowRealm) proposal 
 
The **ShadowRealm** API is a TC39 proposal that allows you to create a new realm 
programmatically. Its purpose is to enable sandboxing and to execute code with a fresh set of 
intrinsics. A `ShadowRealm` instance exposes a method `evaluate(code)`, which runs the given string 
of JavaScript in that realm and returns the result. Functions and values can be passed into and 
returned from a `ShadowRealm`, but the objects themselves remain in their originating realm. This 
prevents code in the shadow realm from mutating the host's global object or prototypes. 
 
Example usage: 
 
```js 
// Create a new shadow realm 
const sr = new ShadowRealm(); 
 
// Evaluate code in the isolated realm 


---

 
392
const result = sr.evaluate("1 + 2"); 
console.log(result); // 3 
 
// Define a function in the current realm 
function greet(name) { 
  return `Hello, ${name}!`; 
} 
 
// Wrap it for the shadow realm 
const wrappedGreet = sr.wrap(greet); 
 
// Call it from within the shadow realm 
const message = sr.evaluate("(" + wrappedGreet + ')("World")'); 
console.log(message); // "Hello, World!" 
``` 
 
In this example, the code executed in the shadow realm cannot access the main global object or 
modify built-ins. `sr.wrap()` produces a callable proxy that marshals arguments and return values 
between realms. 
 
## Why realms matter for sandboxing 
 
Sandboxing refers to running untrusted or user-supplied code in a controlled environment where it 
cannot interfere with or access sensitive data. Without a Realms API, developers resort to 
workarounds like `iframe` sandboxes, `vm` modules in Node.js or library-provided sandboxes (SES, 
Caja). These solutions add complexity and have performance or compatibility limitations. 
 
The Realms API promises: 
 
- **Isolation:** Code executed in a new realm gets its own global scope and intrinsic constructors, 
preventing prototype pollution of the host environment. 
- **Controlled communication:** Only values explicitly passed in or returned by the realm boundary 
are shared. Objects remain in their original realm unless explicitly wrapped. 


---

 
393
- **No DOM access:** In the browser, a shadow realm has no access to the DOM or Web APIs unless 
you pass in proxies. This makes it suitable for running untrusted scripts safely. 
- **Portability:** Unlike `iframe` tricks, realms work consistently in any JavaScript host (browsers, 
Node.js). They require no markup or cross-origin restrictions. 
 
As of this writing, the Realms API (specifically the `ShadowRealm` proposal) is still under 
development. It may evolve before standardisation, but the core idea—creating and isolating 
execution contexts programmatically—remains the same. When supported, realms could simplify 
sandbox implementations, plugin systems and testing environments. 
 
## Practice questions 
 
1. **Theory:** What is a realm in JavaScript? How do realms in different iframes differ from each 
other? 
2. **Theory:** Explain how the Realms API enables sandboxing. Why is separate global state 
important when running untrusted code? 
3. **Coding:** Use an iframe or Web Worker to create a separate realm in a browser today. 
Demonstrate how objects created in one realm fail `instanceof` checks against constructors from 
another realm. 
4. **Theory:** What limitations remain even when using a ShadowRealm for sandboxing? Consider 
things like network requests or CPU usage. 
5. **Coding:** Sketch a function `runInShadowRealm(sourceCode)` that evaluates a string of code in 
a new realm and returns its result. Discuss how you would handle passing functions into and out of 
the realm safely. 
 
 
 


---

 
394
How does the module resolution algorithm work in 
ESM? 
# How module resolution works in ECMAScript modules 
 
When you write an `import` statement in JavaScript, the runtime must locate the referenced module. 
This process is called **module resolution**. The ECMAScript module (ESM) specification defines 
how module specifiers map to module files, but leaves room for host environments to implement 
details. Let's explore how browsers and Node.js resolve modules. 
 
## Specifier types 
 
Module specifiers come in several flavours: 
 
- **Relative specifiers** start with `./` or `../` and resolve relative to the importing module's 
location. For example, `import util from './utils.js';` loads a file named `utils.js` in the same folder as 
the current module. 
- **Absolute specifiers** begin with `/` and resolve from the origin (in browsers) or file system root 
(in Node.js). For example, `import x from '/lib/module.js';` refers to `/lib/module.js` on your server. 
- **Bare specifiers** are bare names like `react` or `lodash`. They reference packages installed in 
`node_modules` or provided by the host. Browsers do not natively resolve bare specifiers; bundlers 
or import maps are required. 
- **Package import specifiers** start with `#` and resolve according to the package's `imports` field 
in its `package.json`. They are used for internal package modules. 
 
## Resolution in browsers 
 
In browsers, relative and absolute specifiers are resolved straightforwardly using URLs. The imported 
path must include an explicit filename and extension (e.g., `.js`, `.mjs`, `.json`). If you omit the 
extension, the browser doesn't guess—it will throw an error. To use packages from npm in the 
browser, you need an **import map** or a bundler that rewrites bare specifiers to full URLs. 
 
Example: 
 
```html 
<!-- index.html --> 


---

 
395
<script type="module"> 
  import { sum } from "./math.js"; 
  console.log(sum(2, 3)); 
  // Without an import map, the following fails in the browser: 
  // import React from 'react'; 
</script> 
``` 
 
An **import map** lets you specify how bare specifiers should be resolved: 
 
```html 
<script type="importmap"> 
  { 
    "imports": { 
      "react": "https://cdn.skypack.dev/react@18" 
    } 
  } 
</script> 
<script type="module"> 
  import React from "react"; 
  console.log(React.version); 
</script> 
``` 
 
## Resolution in Node.js 
 
Node.js implements a more complex resolution algorithm for ES modules because it must support 
local files, packages and package exports. At a high level: 
 
1. If the specifier is a file URL or a relative specifier, Node resolves it to a file on disk relative to the 
importing module's URL. If the file lacks an extension, Node searches for `.js`, `.json` and `.node` 
(native addon) in that order. 


---

 
396
2. If the specifier starts with `#`, Node looks at the importing package's `imports` field in its 
`package.json` to find a matching entry. These package import specifiers allow defining internal 
module names that point to specific files. 
3. Otherwise, the specifier is considered a bare specifier. Node resolves it as a package name in 
`node_modules`. It finds the package directory, reads its `package.json` and checks the `exports` field 
to determine which file to load. If no `exports` field exists, Node falls back to CommonJS resolution 
rules: looking for the `main` field, `index.js` and so on. Node also honours `type: "module"` in 
`package.json` to know whether to treat `.js` files as ESM or CommonJS. 
 
If none of these rules resolve the specifier, Node throws a "Module not found" error. Additionally, 
Node does not allow implicit directory imports: `import x from './dir';` fails unless `./dir/index.js` is 
specified or exported via `package.json`. 
 
## Resolution errors 
 
Common resolution errors include: 
 
- **Invalid module specifier:** The specifier doesn't conform to valid URL or package name syntax. 
- **Module not found:** The file or package does not exist at the resolved location. 
- **Unsupported directory import:** Attempting to import a directory without an explicit file. 
- **Package path not exported:** When using package exports, the requested subpath isn't defined 
in the `exports` field. 
 
Understanding the resolution algorithm helps avoid surprises—especially when publishing packages. 
Always specify your package's exports and imports fields, and avoid relying on implicit resolution 
rules that may change. 
 
## Practice questions 
 
1. **Theory:** Explain the difference between relative, absolute and bare module specifiers. Give 
examples of each and describe how they are resolved in the browser. 
2. **Theory:** Why do browsers require file extensions on import specifiers while Node.js can 
search for `.js` and `.json`? How do import maps help with bare specifiers in browsers? 
3. **Coding:** Create a simple Node.js project with an `index.mjs` file and a `math.js` module. 
Import functions using relative and bare specifiers and observe how Node resolves them. 


---

 
397
4. **Theory:** What purpose do the `exports` and `imports` fields in `package.json` serve? How do 
they influence module resolution? 
5. **Coding:** Define an import map that maps `'@utils'` to `/scripts/utils/`. Use it in an HTML file to 
import a module with a bare specifier. 
 
 
 


---

 
398
What are decorators and how do they extend class 
behavior? 
# Decorators and extending class behaviour 
 
**Decorators** are a proposed JavaScript feature that allows you to modify classes and their 
members (methods, fields, accessors) declaratively.  A decorator is a function that runs at definition 
time and can observe, replace or extend the thing it decorates.  Decorators are widely used in 
TypeScript and other languages (like Python) for metaprogramming.  The ECMAScript decorators 
proposal is currently at stage 3 and may change before final standardisation. 
 
## Basic idea 
 
A decorator is applied using the `@` syntax preceding a class or class member.  For example: 
 
```js 
@sealed 
class Person { 
  @logged 
  greet(name) { 
    return `Hello, ${name}!`; 
  } 
} 
``` 
 
Here, `sealed` and `logged` are decorator functions.  They are invoked when the class definition is 
evaluated, **before** any instances are created.  The decorators receive metadata about the target 
(the class or method) and can modify its behaviour. 
 
## Class decorators 
 
A **class decorator** is a function that takes the class constructor and context metadata.  It can 
replace or extend the class by returning a new constructor or adding static properties. 
 


---

 
399
```js 
function sealed(target, context) { 
  Object.seal(target.prototype); 
  Object.seal(target); 
} 
 
@sealed 
class Library {} // instances cannot add new properties 
``` 
 
The decorator seals both the class and its prototype, preventing new properties from being added.  If 
a decorator returns a new class, that class replaces the original in the scope where it was declared. 
 
## Method decorators 
 
Decorators on methods can wrap or modify the method.  A method decorator receives the method 
(as a function), its kind (e.g. `'method'`), the name, and a context object with utilities.  It can return a 
replacement function or access the original via `context.access`. 
 
```js 
function logged(value, context) { 
  if (context.kind === 'method') { 
    return function (...args) { 
      console.log(`Calling ${context.name} with`, args); 
      const result = value.call(this, ...args); 
      console.log(`Result of ${context.name}:`, result); 
      return result; 
    }; 
  } 
} 
 
class Calculator { 


---
