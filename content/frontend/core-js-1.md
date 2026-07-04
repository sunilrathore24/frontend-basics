# The JavaScript Masterbook — Core Concepts (Pages 1–200)

> Source: *The JavaScript Masterbook* by Upamanyu Deka

---

 
1
Introduction 
JavaScript interviews are unpredictable — but your preparation doesn’t have to be. 
This book is designed as a complete, structured, and practical resource for anyone aiming to master 
JavaScript for real-world technical interviews. With 180+ carefully curated questions, it covers the 
full spectrum of JavaScript concepts: from fundamentals like scope and closures to advanced topics 
such as event loops, Web APIs, memory optimization, async patterns, and modern ES features. 
But this is not just another list of definitions. 
Every question is answered in a deep, explanatory, interview-style format. You’ll find clarity for 
beginners, depth for experienced developers, and insights that help you understand why JavaScript 
behaves the way it does — not just what it does. 
Inside, you’ll discover: 
In-depth explanations written to teach, not confuse 
Examples that show exactly how a concept works 
Real-life analogies that help difficult ideas stick 
Practice questions (both theory and coding) to sharpen your understanding 
A structure that mirrors how top companies evaluate candidates 
Whether you're preparing for your first JavaScript interview or aiming to crack a senior-level role, 
this book gives you the complete foundation and clarity you need. Read it sequentially or jump 
between topics — each question stands strong on its own, yet contributes to a cohesive 
understanding of the language. 
Think of this book as your personal preparation partner: 
Comprehensive. Practical. Interview-focused. 
Let’s begin your journey toward mastering JavaScript with confidence. 
 
 
 
 
 
 
 
 


---

 
2
Table of Contents -1 
001. Difference between var, let, and const 
002. What is hoisting in JavaScript? 
003. Difference between == and === 
004. What is scope (global, function, block)? 
005. What are closures? 
006. What is the event loop? 
007. Explain call stack and execution context 
008. What are data types in JavaScript? 
009. Difference between primitive and reference types 
010. What is type coercion? 
011. Explain truthy and falsy values 
012. What is NaN and how do you check for it? 
013. Explain ‘this’ keyword in JavaScript 
014. Difference between implicit, explicit, default, and new binding 
015. What is lexical scope? 
016. Explain function declarations vs function expressions 
017. What is an IIFE (Immediately Invoked Function Expression)? 
018. Explain pure functions and side effects 
019. What is immutability and why does it matter? 
020. Difference between undefined, null, and NaN 
021. What is strict mode? 
022. What is the Temporal Dead Zone (TDZ)? 
023. What are arrow functions and how are they different from normal functions? 
024. Explain default parameters, rest operator, and spread operator 
025. What are template literals? 
026. Difference between for, for-in, for-of, and forEach 
027. What are objects and how are they stored in memory? 
028. Explain pass-by-value vs pass-by-reference 
029. What is object destructuring and array destructuring? 
030. Explain Object.freeze, Object.seal, and Object.preventExtensions 
031. What is prototypal inheritance? 
032. How does the prototype chain work? 
033. What are constructor functions? 
034. Explain class syntax in ES6 and how it’s sugar over prototypes 


---

 
3
Table of Contents -2 
 
035. What is Object.create used for? 
036. Explain call, apply, bind — and differences between them 
037. What are higher-order functions? 
038. What is callback hell and how to avoid it? 
039. Explain promises and how they work 
040. What is async/await and how is it different from promises? 
041. What are microtasks and macrotasks? 
042. Explain setTimeout, setInterval, and clearTimeout 
043. What is debouncing and throttling? 
044. What is event bubbling and capturing? 
045. How does event delegation work? 
046. Difference between document, window, and this in different contexts 
047. Explain DOM vs BOM 
048. What are Web APIs? 
049. What is localStorage, sessionStorage, and cookies? 
050. What is CORS and how does it work? 
051. Difference between synchronous and asynchronous code 
052. What is the Fetch API and how is it different from XMLHttpRequest? 
053. What is JSON.parse and JSON.stringify and what are their pitfalls? 
054. Explain module patterns in JS — ESM vs CommonJS 
055. What is tree shaking and dead code elimination? 
056. What is a polyfill? 
057. Explain memoization 
058. What are generators and iterators? 
059. Explain currying and partial application 
060. What is the Intl API and how is it used for localization? 
061. Explain the repaint and reflow process in browsers 
062. What is garbage collection and how does mark-and-sweep work? 
063. Explain shadowing and variable masking 
064. What is event propagation and stopPropagation? 
065. What is Symbol in JavaScript? 
066. What is WeakMap and WeakSet? 
067. What are Map and Set and how do they differ from objects? 
068. Explain shallow copy vs deep copy 
069. What is structuredClone? 


---

 
4
Table of Contents -3 
 
070. What are Web Workers and when should you use them? 
071. What are Service Workers and PWA concepts? 
072. Explain Promises.all, Promise.race, and Promise.allSettled 
073. What is BigInt in JavaScript? 
074. Explain dynamic imports and code splitting 
075. What are optional chaining and nullish coalescing operators? 
076. Explain Proxy and Reflect API 
077. What is destructuring / aliasing and how is it useful? 
078. What is module federation in modern JS apps? 
079. Explain Virtual DOM and reconciliation in React conceptually (JS related) 
080. What is event-loop starvation? 
081. Explain call stack overflow and recursion depth limits 
082. What are tagged template literals? 
083. What is lazy evaluation in JS? 
084. How does JavaScript handle memory leaks? 
085. Explain hoisting with function expressions vs arrow functions 
086. What is the Temporal API (upcoming JS proposal)? 
087. What is requestAnimationFrame and when to use it? 
088. Explain IntersectionObserver and MutationObserver APIs 
089. What is the difference between innerHTML and textContent? 
090. What are custom events and how do you dispatch them? 
091. Explain microtask queue vs nextTick in Node.js 
092. What is the difference between V8 engine internals and standard JavaScript? 
093. How does just-in-time (JIT) compilation work in JavaScript engines? 
094. Explain hidden classes and inline caching in V8 
095. What are WeakRefs and FinalizationRegistry? 
096. How does debounce–throttle combo optimize performance? 
097. What are ArrayBuffer and TypedArray? 
098. Explain SharedArrayBuffer and Atomics API 
099. What is structured concurrency (upcoming spec)? 
100. How does the ECMAScript spec define execution order? 
101. Explain Function.prototype.toString and environment internal slots 
102. What is the Realms API and why might it matter for sandboxing? 
103. How does the module resolution algorithm work in ESM? 
104. What are decorators and how do they extend class behavior? 


---

 
5
Table of Contents -4 
 
105. Explain WeakMap-based private fields vs native private fields () in classes 
106. What are import assertions and why are they used? 
107. What is structuredClone’s difference from deep copy via JSON? 
108. Explain lazy vs eager evaluation in iterables 
109. What is monkey-patching and why is it discouraged? 
110. How do JavaScript engines optimize tail calls (TCO)? 
111. What is generator delegation (yield) and how does it work? 
112. What are async generators and how are they used with for-await-of? 
113. Explain top-level await in ES modules 
114. How does module caching work in ES modules and CommonJS? 
115. What happens in circular module dependencies in JavaScript? 
116. Explain bare imports and import maps in browsers 
117. What are custom error classes and how do you create them? 
118. How do try–catch–finally blocks behave with async/await? 
119. What is unhandledrejection and how can it crash your app? 
120. What are tagged template literals used for in libraries like styled-components? 
121. Explain the difference between lazy evaluation and eager evaluation in iterables 
122. How does tail-call optimization (TCO) work, and is it supported in JavaScript engines? 
123. What are Record and Tuple proposals, and how do they differ from Objects and Arrays? 
124. What is pattern matching in JavaScript (proposal stage)? 
125. How does the pipeline operator improve function chaining? 
126. What is Array.prototype.groupBy and how is it used? 
127. What is the purpose of Symbol.dispose and the using statement proposal? 
128. What is Error.cause — new error message cause — and when is it useful? 
129. What are the phases of the event loop (timers, poll, check, close)? 
130. What is event-loop starvation and how can you prevent it? 
131. What is requestIdleCallback and when should you use it? 
132. How do garbage collection triggers and mark-and-sweep impact performance? 
133. What causes detached DOM node memory leaks and how to avoid them? 
134. What is the difference between microtasks, macrotasks, and animation frames? 
135. How do Performance.now and PerformanceObserver help in profiling? 
136. What is the difference between queueMicrotask, setTimeout, and requestAnimationFrame? 
137. How do hidden classes and inline caching affect JS performance internally? 
138. What is ResizeObserver and how is it different from MutationObserver? 
139. How does the Clipboard API work for copying and pasting programmatically? 


---

 
6
Table of Contents -5 
 
140. What is the Notification API and how can you request user permission? 
141. Explain the Battery Status and Network Information APIs 
142. What is the Fetch streaming API and how can you consume a streamed response? 
143. What is the Web Share API and when is it useful? 
144. How does the Web Crypto API provide secure randomness and hashing? 
145. What is crypto.getRandomValues and why is it safer than Math.random? 
146. Explain WebRTC basics — data channels and peer connections 
147. What is AbortController and how do you use it to cancel fetch requests? 
148. What is Content Security Policy (CSP) and why is it important? 
149. What is cross-site scripting (XSS) and how can JavaScript prevent it? 
150. What is cross-site request forgery (CSRF) and how can JS help mitigate it? 
151. Explain sandboxed iframes and the same-origin policy in browsers 
152. What is the Trusted Types API and how does it defend against XSS? 
153. What is the Cache Storage API and how does it relate to Service Workers? 
154. How do Progressive Web Apps (PWAs) leverage Service Workers for offline access? 
155. What is the difference between deep clone and structuredClone for complex objects? 
156. How do custom iterators work and how can you build your own iterable object? 
157. What are ArrayBuffer and TypedArray, and how are they different from Arrays? 
158. What are SharedArrayBuffer and Atomics, and how do they enable thread safety? 
159. How do WeakRefs and FinalizationRegistry help manage memory? 
160. What are transferable objects and how do they improve performance in Workers? 
161. What is structured concurrency (upcoming spec) and how might it change async patterns? 
162. Explain monkey patching, why it’s discouraged, and alternatives 
163. What is the Realms API and why might it matter for sandboxing? 
164. How does the ECMAScript spec define execution order at the spec level? 
165. What are the pitfalls of floating-point arithmetic (0.1 + 0.2 ≠ 0.3)? 
166. How can you achieve precise decimal arithmetic in JavaScript? 
167. How do Intl.DateTimeFormat and Intl.NumberFormat support localization? 
168. What are pluralRules and segmenter in the Intl API? 
169. How does Temporal API improve date–time management compared to Date? 
170. What are the limitations of Math.random and how to get cryptographically secure 
randomness? 
171. What triggers a reflow vs a repaint and how to minimize them? 
172. How does compositing work in modern browsers? 
173. What are layout thrashing and forced synchronous layouts? 


---

 
7
Table of Contents-6 
 
174. What is IntersectionObserver and how can it be used for lazy loading? 
175. How do custom events improve component communication? 
176. What is the difference between innerHTML, outerHTML, and textContent? 
177. What is the difference between CORS preflight and simple requests? 
178. How does sandbox attribute in iframes affect script execution? 
179. What are cross-origin resource policies (CORP, COEP, COOP) and why do they matter? 
180. What is a content-type sniffing attack and how can JS prevent it? 
181. What is the Observer pattern and how is it implemented in JavaScript? 
182. What is the Publish–Subscribe pattern and how does it differ from Observer? 
183. Explain functional composition in JavaScript 
184. What are Higher-Order Components (HOC) and render-props patterns conceptually? 
185. What is dependency injection and can it be achieved in JavaScript? 
186. What are singletons and their drawbacks in JavaScript? 
187. What is event-driven architecture and how can it be implemented in JavaScript? 
188. Explain memoization strategies and cache invalidation techniques 
189. What is reactive programming and how does it differ from imperative programming? 
190. How does decorator syntax enhance class behavior? 
191. What are import assertions and how do they ensure module type safety? 
192. What is module federation and how does it enable micro-frontend architectures? 
193. What are WeakMap-based private fields and how do they differ from native private fields ()? 
194. How does lazy vs eager evaluation affect performance in iterables? 
195. What are WeakKeys and WeakRefs — new memory-safe references? 
196. How do structuredClone, postMessage, and transferable objects relate? 
 
 
 


---

 
8
Difference between var, let, and const 
 
 One-line answer: `var` is function-scoped and hoisted to `undefined`; `let`/`const` are block-scoped, 
hoisted but uninitialized (TDZ). `let` can be reassigned, `const` cannot (reference only). 
 
 Why this matters (beginner-friendly) 
 
Choosing the right declaration prevents scope leaks, redeclaration bugs, and subtle hoisting issues—
especially in loops and async callbacks. 
 
 The concept in depth 
 
- Scope: `var` → function scope; `let`/`const` → block scope (`{}`). 
- Hoisting: All three are hoisted; only `var` is initialized to `undefined`. `let`/`const` live in the 
Temporal Dead Zone until their declaration line executes. 
- Redeclaration: `var` allows redeclaration in the same scope; `let`/`const` do not. 
- Reassignment: `var` and `let` allow reassignment; `const` does not. For objects/arrays, the binding 
is constant but properties/elements may change. 
 
 Code examples 
 
```js 
// Hoisting difference 
console.log(a); // undefined (var hoisted and initialized) 
var a = 5; 
 
console.log(b); // ReferenceError (TDZ) 
let b = 5; 
 
console.log(c); // ReferenceError (TDZ) 
const c = 5; 
``` 
 
```js 
// Block scope vs function scope 
for (var i = 0; i < 3; i++) { 
  { 
    setTimeout(() => console.log("var i:", i), 0); 


---

 
9
  } 
} 
// var i: 3,3,3 
 
for (let j = 0; j < 3; j++) { 
  { 
    setTimeout(() => console.log("let j:", j), 0); 
  } 
} 
// let j: 0,1,2 
``` 
 
```js 
// const: immutable binding, mutable object 
const user = {{ name: "Alice" }}; 
user.name = "Bob";   // ✅ allowed 
// user = {{}}         // ❌ TypeError: Assignment to constant 
variable 
``` 
 
 Common pitfalls & misconceptions 
 
- Thinking `const` makes the object immutable (it only freezes the binding). 
- Using `var` in loops with async callbacks causes late binding bugs. 
- Assuming `let`/`const` aren't hoisted—they are, but remain uninitialized (TDZ). 
 
 Internal mechanics (how JS engines/spec handle this) 
 
- Declarations form bindings in the current Lexical Environment. 
- `var` creates a property on the Variable Environment and is set to `undefined` at environment 
creation. 
- `let`/`const` bindings exist but remain uninitialized until the declaration executes; access before 
that throws ReferenceError. 
 
 When to use / avoid 
 
- Prefer `const` by default; use `let` when you know the value will change. 
- Avoid `var` in modern code unless maintaining legacy code. 


---

 
10 
 
 Related topics 
 
- Hoisting, TDZ, Scope & Closures, Binding of `this`, Function vs Block scope. 
 
 Practice questions 
 
1. What happens when you access a `let` variable before its declaration? 
2. Why can you modify a `const` object's properties but not reassign it? 
3. Rewrite the loop below to log 0, 1, 2: 
 
```js 
for (var i = 0; i < 3; i++) { 
  { 
    setTimeout(() => console.log(i), 100); 
  } 
} 
``` 
 
 
 


---

 
11 
What is hoisting in JavaScript? 
Hoisting in JavaScript 
 
When JavaScript executes your code, it first performs a setup step where it registers all the variables 
and functions it can find. This behavior is known as hoisting. Because of hoisting, some variables and 
functions seem to exist even before the line where they are defined. However, different declarations 
are hoisted in different ways. 
 
Function declarations are available early and can be used anywhere in their scope. Variables declared 
using var are also hoisted but start with a value of undefined. Variables declared with let, const, or 
class are hoisted too, but they are left uninitialized. If you try to access them before their declaration 
line, JavaScript throws a ReferenceError. This situation is known as the Temporal Dead Zone (TDZ). 
 
Think of JavaScript running your file in two passes inside an execution context. In the first pass, called 
the creation phase, JavaScript scans your code and sets up memory for all variables and functions. It 
does not execute any statements yet; it only prepares the environment. In the second pass, called 
the execution phase, JavaScript runs the code line by line and assigns actual values to the variables or 
executes functions. 
 
During the creation phase, JavaScript performs the following steps. 
 
1. Function declarations 
 
```js 
function greet() { 
  console.log("hi"); 
} 
``` 
 
The entire function is stored in memory during setup, which means you can call greet anywhere in 
the same scope, even before its line in the code. 
 
2. var variables 
 
```js 
var a = 10; 
``` 
 


---

 
12 
The name a is created and initialized with undefined during the setup phase. The actual assignment 
(= 10) happens later in the execution phase. 
 
3. let, const, and class 
 
```js 
let x = 1; 
const y = 2; 
class Person {} 
``` 
 
These names are created but left uninitialized. Any attempt to read them before their declaration 
line results in a ReferenceError. This waiting period is known as the Temporal Dead Zone. 
 
When the execution phase begins, JavaScript runs your code from top to bottom. When it reaches 
var a = 10, it assigns 10 to the already existing a. When it reaches let x = 1 or const y = 2, it initializes 
them for the first time, exiting the TDZ. Function declarations were already ready to use, so they can 
be called before their declaration lines. 
 
The TDZ exists to prevent you from using variables before they are properly defined. Without it, 
many confusing bugs would occur where variables show undefined values unexpectedly. 
 
Here are some examples that show how hoisting works in different scenarios. 
 
Example 1: var vs let and const 
 
```js 
console.log(a); // undefined (hoisted name + default value) 
var a = 5; 
 
console.log(b); // ReferenceError (TDZ) 
let b = 5; 
 
console.log(c); // ReferenceError (TDZ) 
const c = 5; 
``` 
 
Example 2: Function declaration vs function expression vs arrow function 
 


---

 
13 
```js 
sayHi(); // works (function declaration is hoisted fully) 
function sayHi() { 
  console.log("Hi!"); 
} 
 
try { 
  sayHello(); 
} catch (e) { 
  console.log(e.name); 
} // TypeError or ReferenceError 
var sayHello = function () { 
  console.log("Hello!"); 
}; 
 
try { 
  wave(); 
} catch (e) { 
  console.log(e.name); 
} // ReferenceError (TDZ) 
let wave = () => console.log("Wave!"); 
``` 
 
With var, the variable sayHello exists during setup and has the value undefined until its assignment 
line. Function expressions and arrow functions behave like variable assignments and are not ready 
until the line is executed. With let or const, the variable exists but is uninitialized until that line is 
reached. 
 
Example 3: class behaves like let and const (TDZ) 
 
```js 
try { 
  new Person(); 
} catch (e) { 
  console.log(e.name); 
} // ReferenceError (TDZ) 
class Person {} 
``` 


---

 
14 
 
To visualize how hoisting works, imagine time flowing from top to bottom in your code. 
 
``` 
CREATION PHASE (Setup, before running your lines) 
- function greet -> ready (you can call it) 
- var a -> exists with value undefined 
- let b -> exists but uninitialized (TDZ) 
- const c -> exists but uninitialized (TDZ) 
 
EXECUTION PHASE (Run your lines) 
1) console.log(a)    -> prints undefined 
2) var a = 10        -> assigns 10 to a 
3) console.log(b)    -> ReferenceError (still in TDZ) 
4) let b = 20        -> initializes b to 20 (TDZ ends) 
5) greet()           -> works (declaration was ready) 
6) const c = 30      -> initializes c to 30 (TDZ ends) 
``` 
 
There are several common misconceptions about hoisting. Some people think let and const are not 
hoisted. In reality, they are hoisted, but they remain uninitialized until their declaration line. Others 
think hoisting moves code to the top. That is not true; the JavaScript engine only creates memory 
bindings for variables and functions during setup. Another misconception is that function 
expressions are hoisted like function declarations. Only function declarations are hoisted with their 
body ready. Function expressions or arrow functions depend on whether the variable is declared 
using var, let, or const. Finally, var is sometimes used in loops with asynchronous code, which often 
causes bugs because all iterations share the same variable. It is better to use let in such cases. 
 
There are also some subtle edge cases you may encounter. 
 
Redeclaring with var 
 
```js 
var x = 1; 
var x = 2; // allowed 
console.log(x); // 2 
``` 
 
var allows redeclaration in the same scope, which can lead to unexpected results. 


---

 
15 
 
TDZ with default parameters referencing later bindings 
 
```js 
let y = 1; 
function f(a = y) { 
  return a; 
} 
console.log(f()); // 1 
 
function g(a = z) { 
  return a; 
} 
let z = 2; 
``` 
 
In this case, you cannot read z in the default parameter of g until z has been initialized. 
 
Modules and hoisting behave slightly differently. ES modules always run in strict mode and have their 
own rules. Imports are hoisted and must appear at the top level of the file. They are ready before the 
module code runs. If you use top-level await, it pauses the module's execution until the awaited 
promise is resolved. 
 
In practice, it is best to use const by default and let only when you need to change a variable's value. 
Avoid using var in modern JavaScript because it can lead to confusing behavior. Use function 
declarations when you need to call functions from anywhere in the scope, and use function 
expressions or arrow functions when you want them to be created at a specific time in execution. 
 
Here is a quick reference summary. 
 
 
Finally, here are some practice questions to test your understanding. 


---

 
16 
1. Why does console.log(a) show undefined but console.log(b) throws a ReferenceError before their 
declarations if a is declared with var and b is declared with let? 
2. Predict the output of the following code. 
 
```js 
say(); 
var say = function () { 
  console.log("hi"); 
}; 
``` 
 
3. Fix the loop below so that it prints 0, 1, 2. 
 
```js 
for (var i = 0; i < 3; i++) { 
  setTimeout(() => console.log(i), 0); 
} 
``` 
 
You can fix it using let: 
 
```js 
for (let i = 0; i < 3; i++) { 
  setTimeout(() => console.log(i), 0); 
} 
``` 
 
Or by capturing i: 
 
```js 
for (var i = 0; i < 3; i++) { 
  ((iCopy) => setTimeout(() => console.log(iCopy), 0))(i); 
} 
``` 
 
 
 
 
 


---

 
17 
 
Difference between == and === 
Difference between == and === in JavaScript 
In JavaScript, both the double equals (==) and triple equals (===) are comparison operators used to 
check if two values are equal, but they work differently. The difference lies in whether they perform 
type conversion before comparing. 
The double equals operator (==) checks for equality after converting both values to a common type. 
This process is called type coercion. JavaScript tries to make both sides the same type before 
comparing, which can sometimes produce unexpected results. The triple equals operator (===) 
checks for equality without converting types. It compares both value and data type exactly as they 
are. 
 
Because of this, == is called the loose equality operator, and === is called the strict equality operator. 
 
When you use ==, JavaScript may convert strings, numbers, booleans, or even null and undefined to 
make the comparison possible. This can make your code unpredictable if you are not aware of how 
coercion works. 
 
For example: 
 
```js 
console.log(5 == "5"); // true, because "5" is converted to a number 
console.log(0 == false); // true, because false is converted to 0 
console.log(null == undefined); // true, special rule in JS 
console.log("0" == false); // true, because both sides are converted to 0 
``` 
 
All these return true even though the data types are different. This happens because the == operator 
tries to make the values the same type before comparing. 
 
Now, let's look at the === operator. 
 
```js 
console.log(5 === "5"); // false, number vs string 
console.log(0 === false); // false, number vs boolean 
console.log(null === undefined); // false, different types 
console.log("0" === false); // false, string vs boolean 
``` 


---

 
18 
 
With ===, no type conversion happens. JavaScript checks both the type and the actual value. If either 
differs, the result is false. 
 
To understand this better, you can think of === as a stricter form of comparison. It is like asking, "Are 
these two values exactly the same, including their type?" On the other hand, == is like asking, "Can 
these two values be considered the same after some conversion?" 
 
When comparing objects or arrays, both operators behave the same way. They only check if both 
sides refer to the exact same object in memory. 
 
```js 
let a = [1, 2]; 
let b = [1, 2]; 
console.log(a == b); // false 
console.log(a === b); // false 
 
let c = a; 
console.log(a === c); // true, because both point to the same object 
``` 
 
Common misconceptions 
 
1. Some developers believe == and === are interchangeable. They are not. Using == can cause 
unexpected true or false results because of type coercion. 
2. null and undefined are equal with == but not with ===. This can lead to subtle bugs if you are 
checking for missing values. 
3. Comparing objects with == or === never compares their contents, only their references. 
4. Using == for numeric comparisons with strings or booleans can create unpredictable results, 
especially when data comes from user input or APIs. 
 
Practical examples 
 
```js 
console.log(1 == true); // true, true becomes 1 
console.log(1 === true); // false, number vs boolean 
 
console.log("10" == 10); // true, "10" becomes 10 
console.log("10" === 10); // false, string vs number 


---

 
19 
 
console.log("" == false); // true, both convert to 0 
console.log("" === false); // false, string vs boolean 
``` 
 
As you can see, == tries to help by converting types, but this often causes confusion. That is why 
most developers use === by default. 
 
Best practices 
 
Always use === unless you specifically want type coercion. The strict equality operator makes your 
code more predictable and easier to debug. If you really need to compare values with different types, 
convert them manually using functions like Number(), String(), or Boolean() before comparing. 
 
```js 
console.log(Number("5") === 5); // true, both are numbers now 
``` 
 
Quick reference summary 
 
 
 
Practice questions 
 
1. What is the key difference between == and === in JavaScript? 
2. Predict the output of: 
 
```js 
console.log("" == 0); 
console.log("" === 0); 


---

 
20 
``` 
 
3. Why does null == undefined return true but null === undefined return false? 
4. How would you safely compare a string number like "10" with an actual number without 
unexpected results? 
 
 
 


---

 
21 
What is scope (global, function, block)? 
What is scope in JavaScript (global, function, block) 
 
Scope is the area of a program where a variable or function name is visible and can be accessed. 
Understanding scope helps you predict where a value can be read or changed and prevents 
accidental name collisions. In JavaScript there are three primary kinds of scope you will use every 
day: global scope, function scope, and block scope. There is also module scope in ES modules, which 
behaves like file level scope, but this note focuses on the everyday three. 
 
Global scope means a name is available everywhere in your program after it is defined. In a browser, 
global variables become properties of the window object. In Node.js, the global object is different, 
and variables declared with let or const at the top level of a module are not added to the global 
object. Global scope is convenient but dangerous because any part of the program can read or 
change that value. Prefer limiting scope where possible. 
 
Function scope is created each time a function is called. Variables declared with var inside a function 
are visible anywhere inside that function but not outside it. Because var is function scoped, using it 
inside if or for blocks does not limit its visibility to those blocks; it remains available everywhere in 
the function. 
 
Block scope is created by a pair of braces. The most common blocks are those from if, for, while, try, 
and just plain braces. Variables declared with let or const are block scoped. They exist only inside 
that block and are not accessible outside. This prevents accidental leaks and makes code easier to 
reason about. Classes declared with class also follow block scoping rules. Variables in block scope 
have a temporal dead zone before the declaration line, which means you cannot access them before 
their declaration executes. 
 
Shadowing happens when an inner scope declares a name that already exists in an outer scope. 
Inside the inner scope, the new declaration hides the outer one. Shadowing can be useful for clarity 
when parameter names repeat, but overusing it can reduce readability. 
 
Lexical scope means that JavaScript decides which variables are visible based on where functions and 
blocks are written in the code, not based on where they are called at runtime. A function can access 
variables from the scope where it was defined. This idea is the foundation for closures. 
 
Examples 
 
```js 
// global scope example 
let siteName = "Docs"; 
function show() { 


---

 
22 
  console.log(siteName); // can read global 
} 
show(); 
``` 
 
```js 
// function scope with var 
function demo() { 
  var x = 1; 
  if (true) { 
    var x = 2; // same function-scoped variable 
  } 
  console.log(x); // 2 
} 
demo(); 
``` 
 
```js 
// block scope with let and const 
function demo2() { 
  let a = 1; 
  if (true) { 
    let a = 2; // different, block-scoped variable 
    const b = 3; 
    console.log(a, b); // 2 3 
  } 
  console.log(a); // 1 
  // console.log(b); // ReferenceError 
} 
demo2(); 
``` 
 
```js 
// shadowing and lexical scope 
const value = "outer"; 
function make() { 
  const value = "inner"; 
  return function () { 


---

 
23 
    console.log(value); // reads "inner" because of lexical scope 
  }; 
} 
make()(); 
``` 
 
Common misconceptions 
 
1. Variables declared with var in a block are block scoped. In reality, var is function scoped and leaks 
out of the block. 
2. Global variables declared with let or const become properties on window. In browsers only var at 
the top level does that; let and const at top level of a script create global bindings but not window 
properties, and in modules they are module scoped. 
3. A variable defined inside a function can be accessed after the function returns. This is only possible 
through closures, not by direct access. 
 
Practice questions 
 
1. Explain the difference between function scope and block scope using a short code example. 
2. Why is global scope considered risky, and how can you reduce reliance on it in a large application. 
3. What is shadowing, and when could it reduce readability. 
 
 
 
 


---

 
24 
What are closures? 
What are closures 
 
A closure is one of the most important - and often misunderstood - ideas in JavaScript. 
In simple words, a closure is a function that carries a memory of the environment in which it was 
created. It remembers the variables that were around it at the time it was defined, even after that 
outer code has finished executing. 
 
To understand why this happens, you first need to recall that JavaScript uses lexical scope - meaning 
variable visibility is determined by where a function is written in the code, not by where it is called 
later. 
Because of lexical scope, an inner function automatically "knows" about the variables defined in its 
outer function. 
 
1. The backpack analogy - how to imagine a closure 
 
Imagine every function in JavaScript carries an invisible backpack with it. 
When the function is created, JavaScript puts into this backpack all the variables that were in scope 
at that time - the things the function can "see" from where it was written. 
When the outer function finishes running, most of its local variables normally disappear from 
memory. But if an inner function still references them, those variables stay alive - kept safely inside 
the backpack. 
Whenever the inner function is called later (even long after the outer function is gone), it can still 
open that backpack and find the variables it remembers. 
 
This is a closure in action: the combination of the function and the preserved environment around it. 
 
2. A simple example 
 
```js 
function makeCounter() { 
  let count = 0; // this variable lives in makeCounter's scope 
 
  return function () { 
    count++; // inner function can still access count 
    return count; 
  }; 
} 
 


---

 
25 
const counter = makeCounter(); 
console.log(counter()); // 1 
console.log(counter()); // 2 
console.log(counter()); // 3 
``` 
 
What happens here: 
 
makeCounter finishes running after the first call. 
Normally, its local variable count would disappear. 
But the inner function still "remembers" count through its closure - it keeps it alive inside its 
backpack. 
Every time you call counter(), it finds count in that backpack, updates it, and returns the new value. 
 
Even though makeCounter no longer exists in memory as a running function, the variable count 
remains because the closure is still holding onto it. 
 
3. Closures keep references, not copies 
 
It's very important to understand that closures don't store copies of variables - they store references. 
That means if a variable's value changes after the closure is created, the closure will see the updated 
value. 
 
```js 
function outer() { 
  let message = "Hello"; 
  return function inner() { 
    console.log(message); 
  }; 
} 
 
const greet = outer(); 
message = "Hi"; // changing outer variable (if accessible) 
greet(); // prints "Hello" only if outer scope variable remains unchanged, otherwise references 
update dynamically 
``` 
 
Closures are "live links" to variables, not frozen snapshots. 


---

 
26 
That's why they're so powerful - they can reflect changes over time. 
 
4. Closures allow data privacy 
 
Before ES6 introduced classes with private fields, closures were the main way to create private data 
in JavaScript - variables that can't be accessed from outside but are still remembered internally. 
 
```js 
function createAccount() { 
  let balance = 0; 
 
  return { 
    deposit(amount) { 
      balance += amount; 
      console.log("Deposited:", amount); 
    }, 
    getBalance() { 
      return balance; 
    }, 
  }; 
} 
 
const account = createAccount(); 
account.deposit(100); 
console.log(account.getBalance()); // 100 
console.log(account.balance); // undefined - cannot access directly 
``` 
 
Here, balance acts like a private variable. 
It lives in the closure of the functions returned by createAccount, and can't be read or modified 
except through those inner functions. 
 
5. Closures in asynchronous code 
 
Closures often appear naturally in asynchronous operations like setTimeout, Promise, or event 
listeners. 
The inner function runs later, but still remembers the variables from when it was defined. 
 


---

 
27 
```js 
function greet(name) { 
  setTimeout(function () { 
    console.log("Hello, " + name); 
  }, 1000); 
} 
 
greet("Alice"); 
``` 
 
Even though greet finishes before one second passes, the callback inside setTimeout still knows what 
name was - because it carries a closure around it. 
 
6. Real-world uses of closures 
 
Closures aren't just theoretical - they power many common programming patterns: 
Data encapsulation: hiding internal state, like private variables. 
Function factories: creating multiple customized versions of a function. 
Memoization: remembering results for faster future calculations. 
Event handlers and callbacks: retaining access to state across time. 
Modules: grouping related code with private internal data. 
 
Example - function factory: 
 
```js 
function multiplier(factor) { 
  return function (n) { 
    return n * factor; 
  }; 
} 
 
const double = multiplier(2); 
const triple = multiplier(3); 
 
console.log(double(5)); // 10 
console.log(triple(5)); // 15 
``` 
 


---

 
28 
Each inner function remembers its own factor - carried in its own backpack from when it was 
created. 
 
7. Memory and performance considerations 
 
Closures keep their referenced variables alive in memory as long as they are reachable. 
If you store many closures or forget to release them when no longer needed, those variables won't 
be garbage-collected. 
That's not a bug - it's just how JavaScript ensures your closures keep working. 
In most normal cases, the runtime cleans up automatically once closures are no longer used. 
 
8. Summary 
 
A closure is the combination of: 
a function, andthe lexical environment where that function was created. 
 
Or in simpler words: 
A closure is a function plus its backpack of remembered variables. 
 
Closures make JavaScript functions powerful and flexible, letting you preserve state, hide data, and 
control behavior across time - all thanks to lexical scoping and how JavaScript keeps those 
"backpacks" alive even after the original context is gone. 
 
Examples 
 
```js 
// private state counter 
function makeCounter() { 
  let count = 0; 
  return function () { 
    count += 1; 
    return count; 
  }; 
} 
const c1 = makeCounter(); 
console.log(c1()); // 1 
console.log(c1()); // 2 
``` 


---

 
29 
 
```js 
// function factory 
function greeter(greeting) { 
  return function (name) { 
    return greeting + ", " + name; 
  }; 
} 
const hello = greeter("Hello"); 
console.log(hello("Sam")); // Hello, Sam 
``` 
 
```js 
// async with closure 
function delayedLog(msg) { 
  for (let i = 1; i <= 3; i++) { 
    setTimeout(() => console.log(msg, i), i * 100); 
  } 
} 
delayedLog("Step"); // Step 1, Step 2, Step 3 
``` 
 
Common misconceptions 
 
1. Closures copy values. They actually keep references to variables, so you observe updated values, 
not frozen snapshots. 
2. Closures always cause memory leaks. They only keep what is referenced. If nothing references the 
inner function, the closure can be collected. 
3. Using var in loops with callbacks works the same as let. With var, each iteration shares the same 
variable, which surprises many developers. 
 
Practice questions 
 
1. Implement a once utility so a function runs at most one time and returns the same result on later 
calls. 
2. Write a memoize function that caches results by argument for a pure function. 
3. Explain why var often behaves unexpectedly in loops with asynchronous callbacks and show a fix. 
 


---

 
30 
 
 
 
 


---

 
31 
What is the event loop? 
What is the event loop 
 
The event loop is the coordination system that allows JavaScript to appear concurrent, even though 
it runs on a single thread. It manages what code runs now, what runs next, and when the browser 
can repaint the screen. Every JavaScript environment, like a browser or Node.js, includes an event 
loop, though their specific queues and priorities may differ slightly. 
 
When JavaScript first starts running a script, it executes all synchronous code line by line on the call 
stack. This is the main thread of execution. When asynchronous operations like timers, fetch calls, or 
user interactions occur, they register callbacks to be executed later, once their operation finishes. 
Those callbacks are stored in different types of queues. 
 
The event loop constantly checks two key conditions: 
 
Is the call stack empty? 
 
Are there any tasks waiting in the queues? 
 
If the stack is empty, the event loop picks the next appropriate task and pushes it onto the stack to 
execute. 
 
There are two main kinds of tasks the event loop manages — macrotasks and microtasks — and 
understanding their order is crucial. 
 
Macrotasks (often just called tasks) include things like setTimeout, setInterval, setImmediate (in 
Node.js), I/O callbacks, and events such as clicks or network responses. Microtasks include promise 
.then() callbacks, async/await continuations, and functions queued using queueMicrotask. 
Microtasks always run before the event loop moves to the next macrotask. 
 
Here's the exact sequence: 
 
The event loop takes one macrotask from the macrotask queue (for example, the initial script or a 
setTimeout callback) and executes it fully, top to bottom. 
 
When that macrotask completes, the event loop checks the microtask queue. 
 
All microtasks in the queue are executed, one after another, until the microtask queue is completely 
empty. 
 


---

 
32 
Once the microtasks finish, the browser gets a chance to perform rendering or painting if needed. 
 
Then, the loop picks the next macrotask and repeats the same steps. 
 
Because microtasks are processed right after each macrotask and before rendering, promise .then() 
callbacks can run sooner than you might expect. For example, if you schedule both a promise and a 
setTimeout with zero delay, the promise handler will always run first because it is a microtask, and 
microtasks are drained before the next macrotask starts. 
 
Consider this example: 
 
```js 
console.log("Start"); 
 
setTimeout(() => console.log("Timeout callback"), 0); 
 
Promise.resolve().then(() => console.log("Promise microtask")); 
 
console.log("End"); 
``` 
 
The output order is: 
Start 
End 
Promise microtask 
Timeout callback 
 
This happens because the main script itself is a macrotask. After it finishes, the event loop looks at 
the microtask queue. The promise .then() is there, so it runs before the next macrotask (the 
setTimeout callback). 
 
If you add more microtasks while executing microtasks, those newly added ones are also run before 
the event loop returns to macrotasks. This is why microtasks can "chain" indefinitely if they keep 
scheduling more microtasks. 
 
Another important detail is rendering. The browser does not repaint the screen in the middle of 
microtasks. Rendering occurs only after the microtask queue is empty and before starting the next 
macrotask. That's why promise-heavy operations can block the visual update even though they seem 
asynchronous. 
 


---

 
33 
In Node.js, the terminology differs slightly, but the logic is similar. Node has phases like timers, 
pending callbacks, I/O polling, and a microtask queue that behaves like the browser's. 
 
To summarize the correct order clearly: 
 
Run one macrotask (e.g., a piece of code, setTimeout callback, I/O event). 
 
When that macrotask finishes, run all queued microtasks. 
 
If more microtasks appear during this step, keep running them until none remain. 
 
Let the browser render updates. 
 
Move to the next macrotask. 
 
Repeat indefinitely. 
 
This precise sequence ensures that JavaScript remains non-blocking, responsive, and predictable 
despite running in a single thread. 
 
Examples 
 
```js 
console.log("A"); 
setTimeout(() => console.log("B"), 0); 
Promise.resolve().then(() => console.log("C")); 
console.log("D"); 
// Order: A, D, C, B 
``` 
 
```js 
// microtasks drain before the next macrotask 
setTimeout(() => console.log("timeout"), 0); 
Promise.resolve().then(() => console.log("then-1")); 
Promise.resolve().then(() => console.log("then-2")); 
// then-1, then-2, timeout 
``` 
 


---

 
34 
```js 
// queueMicrotask behaves like a promise microtask 
queueMicrotask(() => console.log("microtask")); 
console.log("sync"); 
// sync, microtask 
``` 
 
Common misconceptions 
 
1. setTimeout with zero delay runs immediately. It schedules a task that runs only after the current 
call stack is empty and microtasks have run. 
2. Promises are faster by themselves. It is not about speed but about queue priority. Promise 
callbacks run in the microtask queue which is processed before the next task. 
3. The event loop belongs to JavaScript the language. The event loop is provided by the host 
environment (browsers, Node.js) which integrates timers, I/O, and rendering. 
 
Practice questions 
 
1. Predict the output order of logs when both setTimeout and Promise.then are used together. 
2. Explain why a long running while loop blocks click handlers from running. 
3. Show how to yield back to the event loop to keep the UI responsive during heavy computation. 
 
 
 
 
 


---

 
35 
Explain call stack and execution context 
Explain call stack and execution context 
The call stack is a structure that tracks what function is currently running and which function to 
return to when it finishes. Each time a function is called, the runtime creates a new frame and 
pushes it onto the stack. When the function returns, its frame is popped. If the stack grows too deep 
through unbounded recursion, a stack overflow error occurs. 
An execution context is the environment in which a piece of JavaScript runs. It includes the scope 
chain, the bindings for variables and functions, the value of this, and references to outer 
environments. There is a global execution context created when the script starts. Each function call 
creates a new function execution context. During function creation, JavaScript also records the lexical 
environment that will be used later when the function runs; this makes closures possible. 
Creation and execution happen in two phases for each context. In the creation phase, the engine 
allocates memory for declarations and sets up the scope and this binding. In the execution phase, the 
code runs line by line, reading and writing variables and calling other functions. When a function 
calls another function, a new context is created and pushed onto the call stack above the current 
one. 
 
Examples 
 
```js 
function a() { 
  console.log("in a"); 
  b(); 
  console.log("back to a"); 
} 
function b() { 
  console.log("in b"); 
} 
a(); 
// Stack behavior: enter a, enter b, exit b, back to a, exit a 
``` 
 
```js 
// two-phase model inside a function 
function sum(x, y) { 
  // creation phase sets up x, y, and the environment 
  return x + y; // execution phase reads values and returns 
} 
console.log(sum(2, 3)); 


---

 
36 
``` 
 
```js 
// overflow example (do not run in production) 
function recur() { 
  return recur(); 
} 
// recur(); // RangeError: Maximum call stack size exceeded 
``` 
 
Common misconceptions 
 
1. The call stack shows asynchronous callbacks waiting. Only running frames are on the stack. 
Asynchronous callbacks wait in queues until picked up. 
2. The value of this is the same in every function. It depends on how the function is called, not just 
where it is defined. 
3. Execution context and scope are the same thing. Scope is part of the execution context, which 
includes additional details like this and the outer environment. 
 
Practice questions 
 
1. Describe what happens on the call stack when a function calls another function that then throws 
an error. 
2. Explain how execution context creation and execution phases relate to hoisting. 
3. Why does unbounded recursion cause a stack overflow, and how can you avoid it. 
 
 


---

 
37 
What are data types in JavaScript 
What are data types in JavaScript 
 
JavaScript has a small set of built in types. These types define how values behave, how they compare 
to each other, and what operations are valid. There are primitive types and reference types. Primitive 
types are immutable and compared by value. Reference types are objects and compared by 
reference. 
The primitive types are number, string, boolean, null, undefined, symbol, and bigint. Number 
represents both integers and floating point values including special values like NaN and Infinity. 
String is a sequence of characters. Boolean represents true or false. Null represents an intentional 
empty value. Undefined means a variable has been declared but not assigned a value. Symbol 
creates unique identifiers useful for object keys that should not collide. Bigint represents integers of 
arbitrary size beyond the safe range of number. 
Objects are collections of key value pairs and include plain objects, arrays, functions, dates, and 
many other built in structures. Functions are callable objects. Arrays are ordered collections with a 
length property and numeric indices. Most values you create with curly braces or constructors are 
objects and are passed by reference. 
Type inspection can be done with typeof, Array.isArray, and other utilities. typeof works reliably for 
primitives except that typeof null historically returns object for legacy reasons. Arrays report typeof 
object, so use Array.isArray to detect them. For class instances, you can use instanceof to check 
prototype relationships. 
 
Examples 
 
```js 
console.log(typeof 42);           // "number" 
console.log(typeof "hi");         // "string" 
console.log(typeof true);         // "boolean" 
console.log(typeof undefined);    // "undefined" 
console.log(typeof Symbol("s"));  // "symbol" 
console.log(typeof 10n);          // "bigint" 
console.log(typeof null);         // "object" (legacy quirk) 
console.log(typeof {});           // "object" 
console.log(Array.isArray([]));   // true 
``` 
 
```js 
// objects by reference 
const a = { x: 1 }; 
const b = a; 


---

 
38 
b.x = 2; 
console.log(a.x); // 2 
``` 
 
```js 
// numbers and string conversions 
console.log(Number("10")); // 10 
console.log(String(99));   // "99" 
``` 
 
Common misconceptions 
 
1. Null and undefined mean the same thing. Null is an intentional empty value; undefined means not 
assigned yet. 
2. Arrays are a separate typeof result. Arrays are objects; use Array.isArray to detect them. 
3. Bigint and number can be mixed freely. You cannot mix them directly in arithmetic without explicit 
conversion. 
 
Practice questions 
 
1. List all primitive types and describe a use case for symbol and bigint. 
2. Why does typeof null return object, and how do you reliably test for null. 
3. When would you prefer an array over an object and why. 
 
 
 
 


---

 
39 
Difference between primitive and reference types 
Difference between primitive and reference types 
Primitive types are number, string, boolean, null, undefined, symbol, and bigint. These values are 
immutable and compared by value. When you assign a primitive to a new variable or pass it to a 
function, a copy of the value is made. Changing the new variable does not affect the original. 
Reference types are objects, including arrays and functions. These values are stored by reference. 
When you assign an object to another variable, both variables refer to the same underlying object. 
Changing a property through one reference is visible through the other. Equality comparisons for 
objects check whether two references point to the same object, not whether their contents are 
equal. 
Stack and heap are common mental models. Engines are free to implement however they like, but 
the model is useful: primitives are often small fixed size values and can be copied easily, while 
objects may live in managed memory with garbage collection and are accessed by references. 
 
Examples 
 
```js 
// primitives copy by value 
let a = 5; 
let b = a; 
b = 7; 
console.log(a, b); // 5 7 
``` 
 
```js 
// objects copy by reference 
const p = { n: 1 }; 
const q = p; 
q.n = 2; 
console.log(p.n); // 2 
``` 
 
```js 
// equality 
console.log({} === {}); // false, different objects 
const r = {}; 
const s = r; 
console.log(r === s); // true, same reference 
``` 


---

 
40 
 
```js 
// shallow copy vs deep copy 
const user = { name: "A", meta: { views: 1 } }; 
const shallow = { ...user }; // shallow copy 
shallow.meta.views = 5; 
console.log(user.meta.views); // 5 
``` 
 
Common misconceptions 
 
1. Objects are passed by reference. JavaScript passes arguments by value; the value for objects is a 
reference. Reassigning the parameter does not change the caller's variable, but mutating the object 
does. 
2. Spreading or Object.assign always creates a deep copy. They only copy one level by default. 
3. Two objects with the same properties are equal with ===. They are equal only if they are the same 
reference. 
 
Practice questions 
 
1. Show how to deep clone a nested object without mutating the original using structuredClone or a 
library. 
2. Explain why a function cannot reassign an object parameter to replace the caller's variable but can 
mutate its properties. 
3. Give an example where a shallow copy causes an unexpected mutation in the original object. 
 
 


---

 
41 
What is type coercion 
What is type coercion 
Type coercion is when JavaScript converts a value from one type to another so that an operation can 
proceed. Coercion happens in two main ways: implicit and explicit. Implicit coercion occurs when 
operators or comparisons convert values automatically. Explicit coercion is when you convert values 
directly using Number, String, Boolean, or other APIs. 
The language defines conversion rules for many operations. For arithmetic with the plus operator, if 
either operand is a string and the other is not an object with a special behavior, JavaScript converts 
the other operand to a string and concatenates. For subtraction, multiplication, and division, 
JavaScript converts operands to numbers. For comparisons with double equals, the runtime attempts 
to convert both sides to a common type, which can lead to results that surprise people who are not 
aware of the rules. 
Objects convert to primitives by trying valueOf and toString in a specific order depending on the 
operation. Symbols do not coerce to strings implicitly to avoid accidental leaks. Bigints do not mix 
with numbers without explicit conversion. 
 
Examples 
 
```js 
// string concatenation vs numeric addition 
console.log("10" + 5);    // "15" 
console.log(10 + "5");    // "15" 
console.log(10 - "5");    // 5 
console.log("10" * "2");  // 20 
``` 
 
```js 
// explicit coercion 
console.log(Number("12"));     // 12 
console.log(String(7));        // "7" 
console.log(Boolean(""));      // false 
console.log(Boolean("hi"));    // true 
``` 
 
```js 
// equality coercion 
console.log(0 == false);  // true 
console.log("" == 0);     // true 
console.log(null == undefined); // true 


---

 
42 
console.log("0" == false); // true 
``` 
 
```js 
// object to primitive 
const price = { 
  value: 1000, 
  valueOf() { return this.value; } 
}; 
console.log(price + 50); // 1050 (valueOf used) 
``` 
 
Common misconceptions 
 
1. Coercion is always bad. Coercion is a tool; confusion comes from not knowing the rules. Use strict 
equality to avoid surprises where needed. 
2. The plus operator always adds numbers. If either side is a string, plus concatenates. 
3. Boolean conversion treats any non empty string as true but the string "0" is also true. Only the 
empty string is false. 
 
Practice questions 
 
1. Show how different operators trigger coercion with examples for +, -, ==, and Boolean conversion. 
2. Explain how an object with a custom valueOf can influence arithmetic results. 
3. Why does 0 == false evaluate to true but 0 === false is false, and how would you make such 
comparisons safer. 
 
Explain truthy and falsy values 
Explain truthy and falsy values 
In JavaScript, every value becomes either true or false when used in a boolean context. Truthy means 
a value is treated as true; falsy means it is treated as false. This conversion happens with if, while, for 
conditions, the ternary operator, logical operators like &&, ||, and !, and in APIs that expect a 
boolean. 
There are exactly seven falsy values: false, 0, -0, 0n (BigInt zero), "" (empty string), null, undefined, 
and NaN. All other values are truthy, including objects, arrays, functions, non-zero numbers, 
non-empty strings, and symbols. Even unusual values like "0" (a string containing zero), "false" (a 
non-empty string), [] (empty array), and {} (empty object) are truthy. 


---

 
43 
JavaScript does not permanently convert the value; it only interprets it as true or false for that 
operation using an internal ToBoolean step. This is part of type coercion. 
Examples 
 
```js 
if ("hello") console.log("truthy"); // non-empty string is truthy 
if (0) console.log("never runs");   // 0 is falsy 
if ([]) console.log("runs");        // empty array is truthy 
if ({}) console.log("runs");        // empty object is truthy 
if (null) console.log("no");        // null is falsy 
``` 
 
```js 
console.log(Boolean(""));    // false 
console.log(Boolean(" "));   // true (string with a space) 
console.log(Boolean(123));   // true 
console.log(Boolean(0));     // false 
console.log(Boolean([]));    // true 
console.log(Boolean({}));    // true 
``` 
 
Common misconceptions 
 
1. Empty arrays and empty objects are falsy. All objects are truthy, even empty ones. 
2. The string "false" is falsy. Any non-empty string is truthy. 
3. NaN behaves like 0 in truthiness. NaN is falsy. 
 
Practice questions 
 
1. List all falsy values in JavaScript and explain why "0" is truthy but 0 is falsy. 
2. Explain why [] && {} returns {} but [] || {} returns []. 
3. Predict the behavior of if ("0") and if (0) and explain the difference. 
 
 
 
 


---

 
44 
What is NaN and how do you check for it 
What is NaN and how do you check for it 
 
NaN stands for Not-a-Number. It is a special numeric value that represents the result of an invalid or 
undefined numeric operation. NaN has typeof "number" because it lives in the number type domain, 
but it signals that a meaningful numeric value could not be produced. 
 
You get NaN from operations like 0 / 0, parsing non-numeric strings as numbers, square roots of 
negative numbers (in real arithmetic), or any arithmetic expression that already contains NaN. Once 
NaN is produced, it contaminates further arithmetic: any operation involving NaN typically yields 
NaN again. 
 
Examples 
 
```js 
console.log(typeof NaN); // "number" 
console.log(0 / 0); // NaN 
console.log(Math.sqrt(-1)); // NaN 
console.log(parseInt("abc")); // NaN 
console.log(Number("12x")); // NaN 
``` 
 
A unique property of NaN is that it is not equal to anything, including itself. Therefore NaN === NaN 
is false. This design preserves the idea that different invalid results should not compare equal. 
 
To check for NaN, prefer Number.isNaN(value). It returns true only when the value is actually the 
special NaN value. The older global isNaN(value) first coerces the argument to a number, so it can 
report true for non-numeric strings, which is often not what you want. 
 
```js 
console.log(NaN === NaN); // false 
console.log(Number.isNaN(NaN)); // true 
console.log(Number.isNaN("hello")); // false 
console.log(isNaN("hello")); // true (coerces to number → NaN) 
``` 
 
Common misconceptions 
 
1. NaN means "not a numeric type". It is a number type value meaning "invalid numeric result". 


---

 
45 
2. isNaN and Number.isNaN are interchangeable. isNaN coerces; Number.isNaN is strict and safer. 
3. You can detect NaN using equality or inequality operators. NaN never equals anything, not even 
itself. 
 
Practice questions 
 
1. Name three operations that can produce NaN and explain why. 
2. Why does NaN !== NaN evaluate to true, and how do you correctly test for NaN? 
3. Write a function isNumeric(val) that returns true only for finite numbers (hint: use typeof, 
Number.isFinite). 
 
 
 
 


---

 
46 
Explain ‘this’ keyword in JavaScript 
Explain this keyword in JavaScript 
In JavaScript, the this keyword is one of the most confusing topics for beginners because it behaves 
differently from how people expect in other languages. But once you understand what decides the 
value of this (the call site, not the definition site), it becomes consistent and logical. 
Think of this as a reference to the current "owner" of the function call - the object that the function 
is being executed "on." 
But JavaScript does not decide this when you write the function - it decides it each time the function 
is called, depending on how the function is called. 
 
1. Global context 
When you use this in the global scope (outside of any function), the value depends on the 
environment and mode. 
In a browser, outside of strict mode, this refers to the global object - that's window. 
In Node.js, it refers to an empty object in modules, not the global object. 
In strict mode, this is undefined in global functions. 
```js 
console.log(this === window); // true (in browsers, non-strict mode) 
``` 
If you add "use strict"; at the top, then inside a normal function that isn't attached to an object: 
```js 
"use strict"; 
function show() { 
  console.log(this); 
} 
show(); // undefined 
``` 
 
So the first rule is: 
 
In normal (non-strict) mode, this defaults to the global object. 
In strict mode, it becomes undefined. 
 
2. Inside methods (object functions) 
 
If a function is called as a property of an object, this points to that object. 
 
```js 


---

 
47 
const user = { 
  name: "Alice", 
  greet() { 
    console.log("Hi, I'm " + this.name); 
  }, 
}; 
user.greet(); // "Hi, I'm Alice" 
``` 
 
Here, this refers to user because the call was user.greet(). 
The function doesn't care where it was defined — it only cares about how it was called. 
 
If you separate the function from the object, the connection is lost: 
 
const greetFn = user.greet; 
greetFn(); // undefined or global object, depending on strict mode 
Now this is no longer user, because it's just a normal function call. 
 
3. Arrow functions and lexical this 
   Arrow functions are special — they do not have their own this. 
   Instead, they capture the this from the surrounding scope where they were defined. 
 
That means whatever this was outside the arrow function will also be the value inside it. 
 
This makes arrow functions perfect for callbacks and event handlers where you want to preserve the 
outer context. 
 
```js 
const team = { 
  title: "Developers", 
  listMembers() { 
    setTimeout(() => { 
      console.log("Team: " + this.title); // uses team's this 
    }, 100); 
  }, 
}; 
team.listMembers(); // "Team: Developers" 
``` 


---

 
48 
 
If we used a normal function instead of an arrow here, this inside the setTimeout callback would not 
refer to team. 
 
4. call, apply, and bind — setting this manually 
 
JavaScript lets you manually decide what this should be when you call a function. 
call executes the function immediately, with this set to the first argument. 
apply does the same, but arguments are passed as an array. 
bind creates a new function with a permanently fixed this. 
 
```js 
function sayHi() { 
  console.log(this.name); 
} 
 
const user = { name: "John" }; 
const admin = { name: "Admin" }; 
 
sayHi.call(user); // "John" 
sayHi.apply(admin); // "Admin" 
 
const boundFn = sayHi.bind(user); 
boundFn(); // "John" (always uses user) 
``` 
 
This is useful when you need to control context explicitly, especially when passing functions as 
callbacks. 
 
5. Constructor calls (new binding) 
 
When you call a function with the new keyword, JavaScript automatically: 
Creates a new empty object. 
Sets this inside the function to point to that object. 
Runs the function body. 
Returns the new object (unless the function returns a different object). 
 
```js 


---

 
49 
function Person(name) { 
  this.name = name; 
} 
const p = new Person("Alice"); 
console.log(p.name); // "Alice" 
``` 
 
Here, this inside Person refers to the new instance being created. 
If you forget new, this won't refer to the new object — it will follow the default rule instead, often 
causing bugs. 
 
6. Event handlers 
 
In browser event handlers (like onclick), this automatically refers to the element that received the 
event — unless you're using arrow functions, which do not have their own this. 
 
```js 
document.querySelector("button").onclick = function () { 
  console.log(this); // the button element 
}; 
 
document.querySelector("button").onclick = () => { 
  console.log(this); // probably window, not the button 
}; 
``` 
 
7. Binding priority 
 
If multiple rules could apply, JavaScript uses this priority order: 
new binding (constructor) 
 
Explicit binding (call, apply, bind) 
Implicit binding (object method call) 
Default binding (global or undefined) 
 
Example: 
 
```js 


---

 
50 
function show() { 
  console.log(this.value); 
} 
const obj = { value: "obj", show }; 
 
const bound = show.bind({ value: "bound" }); 
const instance = new bound(); // uses new binding, not bound one 
``` 
 
Here, even though we bound the function, new takes precedence and creates a new this. 
 
8. How to think about this 
 
Don't memorize every case. Instead, ask: 
"How is the function being called?" 
That single question reveals what this will be. 
 
If it's called with new, this is the new object. 
If it's called with obj.method(), this is obj. 
If it's called with call or apply, this is whatever you pass in. 
Otherwise (plain function), it's undefined in strict mode or global in non-strict. 
If it's an arrow function, this is inherited from its surrounding scope. 
 
Examples 
 
```js 
function show() { 
  console.log(this); 
} 
show(); // undefined in strict mode; window in sloppy mode 
``` 
 
```js 
const user = { 
  name: "Sam", 
  greet() { 
    console.log(this.name); 
  }, 


---

 
51 
}; 
user.greet(); // "Sam" 
 
const fn = user.greet; 
fn(); // undefined or window depending on mode 
``` 
 
```js 
const obj = { 
  name: "A", 
  printLater: function () { 
    setTimeout(() => console.log(this.name), 50); // arrow keeps outer this 
  }, 
}; 
obj.printLater(); // "A" 
``` 
 
```js 
function hi() { 
  console.log(this.msg); 
} 
hi.call({ msg: "Hello" }); // "Hello" 
``` 
 
Common misconceptions 
 
1. this points to the function itself. It points to the call-time receiver object, not the function. 
2. Arrow functions take this from the caller. They capture this from where they are defined. 
3. Binding once changes this forever. bind returns a new function with a fixed this; the original is 
unchanged. 
 
Practice questions 
 
1. Explain the difference in this between arrow functions and regular functions with an example. 
2. How would you preserve a method's this when passing it as a callback to an event listener? 
3. What does new do to this inside a constructor function? 
 
 


---

 
52 
 
 


---

 
53 
Difference between implicit, explicit, default, and new 
binding 
Difference between implicit, explicit, default, and new binding 
 
JavaScript resolves "this" using four main rules. Default binding applies when a function is called 
without a receiver object. In non-strict mode, this becomes the global object; in strict mode, this is 
undefined. Implicit binding applies when you call a function as a property of an object; the object to 
the left of the dot becomes this. Explicit binding uses call, apply, or bind to set this to a specific 
object regardless of how the function is invoked. New binding applies when you use new; it creates a 
fresh object, sets it as this inside the constructor, and returns it unless the constructor returns an 
object explicitly. 
 
When multiple rules could apply, the priority is: new binding first, then explicit binding, then implicit 
binding, then default binding. 
 
Examples 
 
```js 
function show() { 
  console.log(this.name); 
} 
 
// default 
show(); // undefined (strict) or global name (non-strict) 
 
// implicit 
const user = { name: "Sam", show }; 
user.show(); // "Sam" 
 
// explicit 
show.call({ name: "Alex" }); // "Alex" 
 
// new 
function Person(name) { 
  this.name = name; 
} 
const p = new Person("Ravi"); 
console.log(p.name); // "Ravi" 


---

 
54 
``` 
 
Common misconceptions 
 
1. Arrow functions follow these rules. Arrow functions ignore all four and capture this lexically. 
2. bind mutates the original function. It returns a new function with fixed this. 
3. call or apply can override new. If new is used, new binding wins. 
 
Practice questions 
 
1. Describe each binding rule and give a one-line example. 
2. What happens if you call a bound function with new? 
3. In which order are the rules considered when more than one might apply? 
 
 
 
 


---

 
55 
What is lexical scope 
What is lexical scope 
 
Lexical scope means variable visibility is determined by where code is written, not by where it is 
called. Functions and blocks create scopes. Inner scopes can access names from their outer scopes, 
but not the reverse. This structure is fixed at parse time and provides a predictable chain for name 
lookup at runtime. 
 
When code runs, the engine looks for a variable starting in the current scope and then walks outward 
through enclosing scopes until it finds a match or reaches the global scope. This model enables 
closures, because a function keeps access to the scope where it was defined even after that outer 
function returns. 
 
Examples 
 
```js 
const outer = "outside"; 
 
function a() { 
  const inner = "inside"; 
  console.log(outer); // accesses outer 
} 
a(); 
// console.log(inner); // ReferenceError 
``` 
 
```js 
function makeAdder(x) { 
  return function (y) { 
    return x + y; // x comes from lexical scope 
  }; 
} 
const add5 = makeAdder(5); 
console.log(add5(2)); // 7 
``` 
 
Common misconceptions 
 


---

 
56 
1. Lexical scope changes based on the caller. It is determined at definition time. 
2. Only functions create scope. Blocks with let/const also create scope. 
3. Closures create new scopes out of thin air. They capture existing lexical environments. 
 
Practice questions 
 
1. Explain lexical scope versus dynamic scope. 
2. Why does a function still access outer variables after the outer function returns? 
3. Show how lexical scope enables private state. 
 
 
 
 


---

 
57 
Explain function declarations vs function expressions 
Explain function declarations vs expressions 
 
Function declarations and function expressions define functions but differ in when they become 
available and how they are used. A function declaration appears as a statement beginning with the 
function keyword. It is hoisted, which means the entire function is available before its line in the 
code. A function expression defines a function inside an expression, for example by assigning it to a 
variable. Expressions are not hoisted as callable functions; only the variable's binding is created early 
(undefined for var, temporal dead zone for let/const), and the function value is set at runtime when 
that line executes. 
 
Function expressions may be anonymous or named. Named expressions can aid debugging and allow 
self-reference for recursion. 
 
Examples 
 
```js 
// declaration 
greet(); 
function greet() { 
  console.log("Hi"); 
} 
``` 
 
```js 
// expression 
const sayHi = function () { 
  console.log("Hello"); 
}; 
sayHi(); 
``` 
 
```js 
// named expression for recursion 
const factorial = function fact(n) { 
  return n <= 1 ? 1 : n * fact(n - 1); 
}; 
console.log(factorial(5)); // 120 


---

 
58 
``` 
 
Common misconceptions 
 
1. All functions are hoisted the same way. Only declarations are fully hoisted. 
2. A named function expression leaks its name to the outer scope. The name is only visible inside the 
function body. 
3. Declarations inside blocks behave uniformly across modes. Block scoping rules and strict mode can 
affect visibility. 
 
Practice questions 
 
1. What happens if you call a function expression before it is defined? 
2. When would you prefer a function expression over a declaration? 
3. Why might you give a function expression a name even when assigning it to a variable? 
 
 
 
 


---

 
59 
What is an IIFE (Immediately Invoked Function 
Expression)? 
What is IIFE (Immediately Invoked Function Expression) 
 
An IIFE is a function expression that is executed immediately after it is created. It is written by 
wrapping a function in parentheses to force it to be an expression, then adding another pair of 
parentheses to call it. The pattern creates a private scope for variables and avoids leaking names into 
the global scope. Before block scope with let and const was available, IIFEs were a primary way to 
create isolated scopes. 
 
IIFEs are useful for one-time setup, initializing modules, and keeping temporary variables private. 
Arrow functions can be used as IIFEs too. 
 
Examples 
 
```js 
(function () { 
  const message = "Runs now"; 
  console.log(message); 
})(); 
``` 
 
```js 
(function (name) { 
  console.log("Hello " + name); 
})("Sam"); 
``` 
 
```js 
const result = (() => { 
  const x = 2, 
    y = 3; 
  return x * y; 
})(); 
console.log(result); // 6 
``` 
 
Common misconceptions 


---

 
60 
 
1. IIFEs are obsolete after ES6. They still help with one-off initialization and encapsulation. 
2. Only function keyword works. Arrow IIFEs work as well. 
3. IIFEs create globals. They prevent globals by scoping variables locally. 
 
Practice questions 
 
1. Write an IIFE that returns today's ISO date string. 
2. Why were IIFEs common before let and const? 
3. How does an IIFE differ from calling a named function declared elsewhere? 
 
 
 
 


---

 
61 
018. Explain pure functions and side effects 
Explain pure functions and side effects 
 
A pure function always produces the same output for the same input and does not cause any 
observable changes outside itself. It does not read or write global state, mutate its parameters, 
perform I/O, or rely on time or randomness unless those are passed in as inputs. Pure functions are 
predictable, easy to test, and simple to reason about. 
 
A side effect in programming refers to any action a function performs that affects something outside 
itself, or depends on something that can change outside its control. It's called a "side" effect because 
it happens alongside the main purpose of the function — instead of just returning a value, the 
function is also changing the world around it. 
 
Let's break that down clearly. 
 
1. The idea of "outside world or shared state" 
 
Every function has its own scope — the variables and values defined inside it. 
If a function reads or modifies something beyond its scope, that's considered interacting with the 
outside world or shared state. 
Examples of shared state: 
Global variables 
Data stored in files, databases, or APIs 
The browser DOM (elements on a web page) 
External services (network requests) 
Console logs (which affect the program's visible output) 
Any variable or object that was created outside the function and then modified inside it 
So, whenever a function touches these — by reading, writing, or depending on them — it is 
performing a side effect. 
 
2. Why side effects happen 
 
Most real-world programs exist to cause side effects. 
If you write to a database, send an email, or update the screen — you're changing the world outside 
the function. That's useful and necessary. 
However, side effects make code less predictable because the same function call might produce 
different results depending on what's happening elsewhere in the system. For example: 
A function that reads the current time or a random number will give different outputs each call. 


---

 
62 
A function that modifies a shared variable affects other parts of the program in ways that may not be 
obvious. 
This means that side effects create coupling — parts of the program become dependent on each 
other's hidden behaviors. 
 
3. Why minimizing side effects matters 
 
When a function has side effects, it becomes harder to test, debug, or reason about: 
You can't easily predict the result without knowing the full program state. 
You can't safely reuse it in different contexts. 
Bugs may appear when multiple functions modify the same data in unexpected orders. 
That's why in good program design, side effects are not eliminated (since they're needed for 
interaction) but isolated — kept at the boundaries of the system. 
This approach makes your core logic pure (depending only on inputs and producing outputs) and 
pushes unavoidable side effects to specific, controlled areas (like one module handling I/O or DOM 
updates). 
 
4. Example to think about 
 
Imagine a web application that calculates total price and then updates the page: 
The calculation part (subtotal + tax) is pure — it always gives the same result for the same inputs. 
The DOM update (document.querySelector("#total").textContent = total) is a side effect — it changes 
something visible outside the function. 
If you separate these concerns — one function that purely computes, and another that updates the 
DOM — you can easily test the computation logic without worrying about browser behavior. 
Later, if the display code changes (say, switching to a different UI framework), your pure logic remains 
safe and reusable. 
 
5. Side effects are not evil — they just need boundaries 
 
Every useful program must eventually perform side effects, because that's how it communicates with 
the world (displaying output, saving data, sending requests). 
The key is controlling them: 
Keep pure logic functions independent and predictable. 
Let a small part of the code handle side effects explicitly (for example, one function responsible for 
logging or rendering). 
This approach keeps your codebase more modular, easier to test, and less prone to bugs that come 
from unpredictable changes in shared state. 
 
Examples 


---

 
63 
 
```js 
// pure 
function add(a, b) { 
  return a + b; 
} 
``` 
 
```js 
// impure: reads and writes external state 
let total = 0; 
function addToTotal(x) { 
  total += x; 
  return total; 
} 
``` 
 
```js 
// impure: mutates input 
function pushItem(arr, v) { 
  arr.push(v); 
  return arr; 
} 
``` 
 
```js 
// pure alternative: returns a new array 
function append(arr, v) { 
  return arr.concat(v); 
} 
``` 
 
Common misconceptions 
 
1. Pure functions cannot use variables. They can use parameters and constants; they just cannot rely 
on or mutate external changing state. 
2. Logging is harmless. Logging is a side effect. 


---

 
64 
3. A function that happens to return the same value today is pure. Purity requires guarantees for all 
time with identical inputs and no external changes. 
 
Practice questions 
 
1. Give three benefits of keeping your core logic pure. 
2. Convert an impure function that pushes into an array into a pure version. 
3. List five examples of side effects in typical web applications. 
 
 
 
 


---

 
65 
What is immutability and why does it matter? 
What is immutability and why does it matter 
 
Immutability means that once a value is created, it is not changed. Instead of modifying data in 
place, you create new values that reflect the change. JavaScript primitives (string, number, boolean, 
null, undefined, symbol, bigint) are immutable. Objects and arrays are mutable by default, but you 
can adopt immutable patterns to avoid accidental shared mutations. 
 
Immutability reduces hidden coupling, makes reasoning and debugging easier, and helps avoid bugs 
where two parts of a program unintentionally affect each other through shared references. It also 
enables simple change detection strategies and time-travel debugging in state management libraries. 
 
To work immutably with objects and arrays, prefer methods that return new structures such as array 
map, filter, slice, spread syntax for objects and arrays, and Object.assign. Use structuredClone for 
deep copies when needed. Object.freeze can prevent modification of an object's properties, but it is 
shallow and does not freeze nested objects. 
 
Examples 
 
```js 
// primitive example 
let a = "hi"; 
let b = a; 
b += "!"; 
console.log(a, b); // "hi", "hi!" 
``` 
 
```js 
// immutable update for object 
const user = { name: "Sam", meta: { visits: 1 } }; 
const updated = { 
  ...user, 
  meta: { ...user.meta, visits: user.meta.visits + 1 }, 
}; 
console.log(user.meta.visits, updated.meta.visits); // 1, 2 
``` 
 
```js 
// immutable array operations 


---

 
66 
const arr = [1, 2, 3]; 
const doubled = arr.map((x) => x * 2); 
const appended = [...arr, 4]; 
console.log(arr, doubled, appended); 
``` 
 
Common misconceptions 
 
1. const makes an object immutable. const prevents reassignment of the binding, not mutation of 
the object's contents. 
2. Immutability is always slower. For typical app-level data, the clarity and safety outweigh minor 
copying costs; libraries optimize structural sharing. 
3. JSON.stringify or Object.freeze makes deep immutability. Object.freeze is shallow; deep 
immutability needs recursive freezing or libraries. 
 
Practice questions 
 
1. Why does immutability make state management and debugging easier? 
2. Show how to increment a deeply nested counter without mutating the original object. 
3. What tools does JavaScript provide to help you work immutably? 
 
 
 
 
 
 
Difference between undefined, null, and NaN 
Difference between undefined, null, and NaN 
 
In JavaScript, all three - undefined, null, and NaN - represent "absence" in some form. 
But they describe different kinds of absence, and mixing them up often causes confusion. 
 
Think of them like this: 
 
undefined -> "The variable exists, but no one has given it a value yet." 
 
null -> "I deliberately set this to nothing." 


---

 
67 
 
NaN -> "I tried to get a number, but the result is nonsense." 
 
Let's explore these one by one. 
 
1. undefined - value not assigned 
 
undefined is the default state of things that exist but haven't been assigned any value. 
You don't have to explicitly write undefined; JavaScript gives it automatically in several cases: 
Declared but not initialized variable 
Missing function return value 
Accessing a non-existent object property 
Function parameter not passed during a call 
 
Examples: 
 
```js 
let x; 
console.log(x); // undefined (declared but no value) 
 
function doSomething() {} 
console.log(doSomething()); // undefined (no return statement) 
 
const user = { name: "Alice" }; 
console.log(user.age); // undefined (property doesn't exist) 
 
function greet(name) { 
  console.log("Hello " + name); 
} 
greet(); // name is undefined 
``` 
 
So undefined is JavaScript's way of saying: 
"This thing is real, but it doesn't currently hold a value." 
undefined often happens unintentionally - when something is missing or not yet set. 
 
2. null - intentional absence 
 


---

 
68 
null represents a value that's intentionally empty. 
Developers assign null themselves to mean, "This should have no value." 
 
```js 
Example: 
 
let selectedUser = null; // means: no user selected yet 
``` 
 
Unlike undefined, which JavaScript assigns automatically, null is assigned by you when you want to 
signal "nothing here on purpose." 
 
 
Some real use cases: 
Resetting a variable: 
user = null; // clear previous user 
 
Placeholder for future object values: 
let result = null; 
if (dataFound) result = process(data); 
Indicating "not applicable" or "no result." 
Even though null means "nothing," it's still a valid JavaScript value and must be assigned explicitly. 
The typeof null oddity 
typeof null; // "object" 
This is a bug in JavaScript's design that dates back to the earliest versions. 
It was never fixed for backward compatibility. 
But it doesn't mean that null is an object - it's just an old quirk. 
To correctly check for null, always use: 
value === null; 
 
3. NaN - invalid number result 
NaN stands for Not-a-Number, but it actually is a number type - just a special one that means "this 
number operation failed." 
You usually get NaN when: 
You try to convert a non-numeric value to a number and it doesn't make sense. 
You perform a mathematical operation that has no valid result. 
 
```js 


---

 
69 
Examples: 
 
Number("abc");     // NaN 
parseInt("hello"); // NaN 
0 / 0;             // NaN 
Math.sqrt(-1);     // NaN 
 
NaN is contagious - once a calculation involves NaN, the whole result becomes NaN. 
 
NaN + 5; // NaN 
NaN * 2; // NaN 
``` 
 
The tricky part is that: 
NaN === NaN; // false 
 
This happens because JavaScript treats NaN as a special "unreliable" value that never equals 
anything - even itself. 
 
To check for it, use: 
 
Number.isNaN(value); // modern reliable way 
 
 
5. Practical mental model 
Use undefined for uninitialized or system-generated missing values. 
You rarely need to assign it yourself. 
Use null when you deliberately clear or empty a variable. 
It's your way of saying: "I know this variable exists, but it should have no value right now." 
Treat NaN as a special numeric error - it only shows up when math or conversions go wrong. 
 
6. A simple story to remember 
Imagine three boxes on a desk: 
One box is empty because nobody ever put anything in it -> undefined 
Another box has a note that says "intentionally left empty" -> null 
A third box has nonsense written on it that doesn't make sense as a number -> NaN 
All three are "empty" in some way, but each tells a different story about why they're empty. 


---

 
70 
 
Examples 
 
```js 
let x; 
console.log(x); // undefined 
const obj = {}; 
console.log(obj.missing); // undefined 
 
let y = null; 
console.log(y === null); // true 
 
console.log(typeof null); // "object" (legacy quirk) 
 
console.log(Number("abc")); // NaN 
console.log(NaN === NaN); // false 
console.log(Number.isNaN(NaN)); // true 
``` 
 
Common misconceptions 
 
1. undefined and null are interchangeable. undefined implies "not assigned yet"; null is an explicit, 
intentional empty value. 
2. typeof null === "null". It returns "object" due to a long-standing quirk. 
3. NaN compares equal to NaN. NaN never equals anything; use Number.isNaN to test it. 
 
Practice questions 
 
1. When would you deliberately use null instead of leaving a variable undefined? 
2. How do you distinguish between a missing property and a property explicitly set to null? 
3. Why does NaN === NaN return false and how do you correctly test for NaN? 
 
 
 
 


---

 
71 
What is strict mode 
What is strict mode 
Strict mode is an optional mode in JavaScript that makes the language behave in a safer, more 
predictable way by turning silent errors into visible ones and by disallowing some problematic 
features. You enable it by placing "use strict"; at the top of a script file or at the beginning of a 
function body. In ES modules, strict mode is enabled by default. 
Strict mode helps catch mistakes early. Assigning to an undeclared variable throws a ReferenceError 
instead of creating an accidental global. Certain syntax that often leads to bugs is disallowed. The this 
value in plain functions becomes undefined instead of implicitly pointing to the global object, which 
prevents hidden global access. Duplicate parameter names are banned, octal escape sequences are 
disallowed, attempts to delete plain variable bindings throw, and writes to non-writable properties 
throw in strict mode rather than failing silently in some engines. 
 
Examples 
 
```js 
"use strict"; 
x = 10; // ReferenceError: x is not defined 
``` 
 
```js 
function demo() { 
  "use strict"; 
  y = 5; // ReferenceError 
} 
``` 
 
```js 
function show() { 
  console.log(this); 
} 
show(); // non-strict: global object; strict: undefined 
``` 
 
Common misconceptions 
1. Strict mode always makes code faster. It mainly improves safety; performance is engine-
dependent. 
2. Strict mode is only for modules. Modules are strict by default, but scripts and functions can opt in 
with "use strict". 


---

 
72 
3. Strict mode breaks working code for no reason. It surfaces real mistakes like accidental globals and 
unsafe patterns. 
 
Practice questions 
1. List three runtime differences you get in strict mode versus non-strict. 
2. How does strict mode change the default this in plain functions. 
3. Why do writes to read-only properties throw in strict mode. 
 
What is the Temporal Dead Zone (TDZ)? 
What is the Temporal Dead Zone (TDZ) 
 
The Temporal Dead Zone (TDZ) is a short period during your program's execution when a variable has 
been declared in memory but is not yet ready to use. It exists only for variables declared using let, 
const, or class. 
 
When JavaScript starts running a block of code - like inside a function or { } braces - it sets aside 
memory space for all variables it finds inside that block. This happens before the actual lines of code 
start executing. However, for let, const, and class, JavaScript does not assign them any initial value at 
this stage. The variables are marked as "uninitialized." They are known to exist, but you cannot 
access them yet. 
 
The time between when the block begins and when JavaScript reaches the actual line where you 
declare the variable is called the Temporal Dead Zone. The word "temporal" refers to time, and 
"dead zone" means you cannot use that variable during that time. If you try to access it before the 
declaration line runs, JavaScript immediately throws a ReferenceError instead of silently giving 
undefined. 
 
Once the interpreter reaches the variable's declaration line and runs it, the variable becomes fully 
initialized. From that moment onward, you can safely read or write its value. 
 
The TDZ exists to prevent confusing bugs. In older JavaScript (before ES6), variables declared with var 
were automatically set to undefined when the program started running. This led to situations where 
developers accidentally used variables before they were truly ready, without realizing it. With the 
TDZ, JavaScript makes it clear: you cannot use a variable before it's actually declared. 
 
This rule makes code more predictable. It ensures that every variable is used only after it has been 
properly defined and initialized, which avoids subtle errors and improves readability. 
 
So, the TDZ is not an error itself - it's a protective mechanism that enforces good timing and 
discipline in how you use your variables. 


---

 
73 
 
Examples 
 
```js 
{ 
  // console.log(x); // ReferenceError (TDZ) 
  let x = 10; // TDZ ends here 
  console.log(x); // 10 
} 
``` 
 
```js 
{ 
  // console.log(y); // ReferenceError 
  const y = 3; 
} 
``` 
 
Default parameters can also hit TDZ if they reference variables declared later. 
 
```js 
let a = 1; 
function f(b = a) { 
  return b; 
} // ok 
function g(b = c) { 
  return b; 
} // ReferenceError when called 
let c = 2; 
``` 
 
Common misconceptions 
 
1. let and const are not hoisted. They are hoisted but left uninitialized until the declaration runs; the 
gap is the TDZ. 
2. TDZ is a special exception type. It is behavior that results in ReferenceError. 
3. Only blocks have TDZ. Functions and class bodies also create TDZ for their let/const/class bindings. 
 


---

 
74 
Practice questions 
 
1. Explain why TDZ improves code safety with a short example. 
2. Show a default-parameter case that triggers TDZ and explain why. 
3. How does TDZ relate to the creation and execution phases of an execution context. 
 
 
 
 
 
 


---

 
75 
What are arrow functions and how are they different 
from normal functions? 
What are arrow functions and their differences from normal functions 
 
Arrow functions are a compact way to write function expressions introduced in ES6. They change 
syntax (shorter) and semantics (important differences from "normal" functions created with the 
function keyword). The biggest semantic change is lexical this: an arrow function does not create its 
own this; instead, it captures the this from the surrounding (enclosing) scope at the moment the 
arrow is created. 
 
WHAT "LEXICAL THIS" REALLY MEANS 
In a normal function, this is decided by how the function is called (method call, call/apply/bind, new, 
etc.). In an arrow function, this is decided by where the function was written. The arrow looks 
outward to the nearest non-arrow function (or top-level/module scope) and uses that this. 
 
- Consequence: call, apply, and bind cannot change an arrow function's this-they still pass 
arguments, but the this stays whatever was captured. 
- Practical upside: perfect for callbacks where you want to keep using the outer object's this (e.g., 
inside setTimeout, array methods, or promise handlers). 
- Practical gotcha: arrows are a poor choice for object methods if you want this to be the receiver 
object; use a normal method syntax instead. 
 
OTHER LEXICALLY CAPTURED META-BINDINGS 
Arrow functions also do not have their own arguments, super, or new.target. They close over the 
nearest outer ones (if any). 
 
- No arguments: if you need a parameter list, use rest parameters ((...args)), which give you a real 
array. 
- In classes, super used inside an arrow function refers to the super of the containing method-useful, 
but subtle. 
- new.target is likewise taken from the outer scope (and arrows themselves cannot be constructors 
anyway). 
 
NOT CONSTRUCTIBLE; NO PROTOTYPE 
You cannot use new with an arrow function. They're not constructors and have no prototype 
property. If you need instances via new, use a normal function or a class. 
 
SYNTAX OPTIONS (AND LITTLE PITFALLS) 
 
- Parameters 


---

 
76 
 
  - Zero parameters: () => 42 
  - One parameter (no default/destructuring): x => x \* 2 (parentheses optional) 
  - Multiple/default/destructured: (x, y = 1) => x + y, ({id}) => id 
 
- Bodies 
 
  - Expression body (concise): x => x \* 2 implicitly returns the expression result. 
  - Block body: (x) => { const y = x \* 2; return y; } requires return to send a value back. 
 
- Returning object literals 
 
  - Use parentheses: () => ({ a: 1 }) (without them the braces are parsed as a block). 
 
- Automatic semicolon insertion 
 
  - With concise bodies there's no return keyword; with block bodies you must return explicitly. 
 
- Names 
  - Arrow functions are syntactically anonymous, but engines infer a name from the assignment 
target: const add = (a,b)=>a+b; add.name is often "add". 
 
ASYNC ARROWS 
You can write async arrow functions: const fetchIt = async url => { const r = await fetch(url); return 
r.json(); }; 
They still capture this lexically; await works the same as in async function. 
 
WHEN ARROWS SHINE 
 
- Callbacks that need the outer this 
 
  - In methods: setTimeout(() => this.doSomething(), 0) keeps the instance this without .bind(this). 
 
- Functional style array methods 
 
  - items.map(x => x.id) is concise and clear. 
 
- Short utilities 


---

 
77 
  - One-liners (predicates, transforms) become very readable. 
 
WHEN TO AVOID ARROWS 
 
- Prototype methods or object methods that rely on dynamic this 
 
  - If you write obj = { total: 0, add: () => { this.total++ } }, this won't be obj; it'll be whatever was outer 
when the arrow was defined. Use add() { this.total++ } instead. 
 
- Event listeners that expect this to be the element (legacy/non-addEventListener patterns) 
 
  - Arrows will not give you the element as this. Prefer a normal function if you need this bound to 
the element. 
 
- Constructors / generator functions / places where you need arguments, new.target, or your own 
this 
  - Arrows simply cannot do those. 
 
ABOUT PERFORMANCE AND MEMORY 
 
- Performance is generally comparable; choose arrows for semantics/readability, not speed. 
 
- In classes, defining arrow properties like handler = () => { ... } binds this per instance (great for 
callbacks) but creates a separate function per instance (slightly more memory) vs sharing a method 
on the prototype. Use this pattern when convenient, but be aware of the trade-off. 
 
INTEROP WITH BIND/CALL/APPLY 
 
- fn.call(obj, x) will pass x, but the arrow's this won't become obj. If you need to rebind this, use a 
normal function. 
- You can still use call/apply for arguments only with an arrow; this won't change. 
 
STRICT MODE AND PARAMETER RULES 
 
- Arrows behave like strict functions for disallowed patterns (e.g., no duplicate parameter names 
when defaults/rest are present). 
- They inherit strictness from their environment (modules are strict by default). 
 
COMMON MISCONCEPTIONS (CLEAR UP FAST) 


---

 
78 
 
- "Arrow functions are just shorter syntax." 
  Shorter, yes-but also different semantics for this, arguments, super, new.target, and constructibility. 
 
- "I can use arrow functions anywhere I can use a function." 
  Not as constructors; not when you need your own dynamic this; not as generators. 
 
- "I can fix an arrow's this with .bind." 
  No-you can't change this of an arrow after creation. .bind returns a new function, but the arrow's 
this is already lexically locked. 
 
MENTAL CHECKLIST WHEN CHOOSING ARROW VS NORMAL FUNCTION 
 
1. Do I need my own this (dynamic receiver, event element, prototype method)? -> Use normal 
function. 
2. Do I want to preserve outer this in a callback or tiny helper? -> Use arrow. 
3. Do I need arguments, new, prototype, or yield? -> Use normal function. 
4. Am I inside a class and want an instance-bound handler for convenience? -> Arrow property can 
be great. 
 
Examples 
 
```js 
const double = (x) => x * 2; // implicit return 
const add = (a, b) => { 
  return a + b; 
}; // block body 
``` 
 
```js 
const obj = { 
  n: 0, 
  incLater() { 
    setTimeout(() => { 
      this.n++; 
    }, 0); // arrow keeps outer this 
  }, 
}; 


---

 
79 
``` 
 
```js 
const sum = (...nums) => nums.reduce((a, b) => a + b, 0); 
``` 
 
Common misconceptions 
 
1. Arrow functions are just shorter syntax. They also change this and arguments behavior. 
2. You can use new with an arrow function. Arrow functions are not constructors. 
3. Arrow functions are always better. Prefer normal functions when you need your own this, 
arguments, or when defining methods on prototypes. 
 
Practice questions 
 
1. Explain lexical this with a small example using setTimeout. 
2. When should you avoid arrow functions and use a normal function instead. 
3. How do you handle variable arguments in an arrow function. 
 
 
 
 


---

 
80 
Explain default parameters, rest operator, and spread 
operator 
Explain default parameters, rest, and spread operators 
 
Understanding Default Parameters, Rest, and Spread 
 
These three features were added in modern JavaScript (ES6) to make working with function 
arguments and arrays easier and more natural. They all look similar because they use three dots (...), 
but they serve different purposes depending on where they appear. 
 
1. Default Parameters - "Give me a fallback value" 
 
When you write a function, sometimes the caller doesn't pass a value for one of the parameters. 
Before default parameters existed, that would make the value undefined, and you had to handle it 
manually. 
Default parameters let you specify a value that will automatically be used if no argument is provided, 
or if undefined is passed. 
Think of it as giving your function a safety net. 
Example idea: 
If you have a function that greets a user, and no name is given, you can tell JavaScript to use "Guest" 
by default. 
So instead of checking manually if the value exists, the function always works - it greets either the 
given name or the default one. 
This makes functions more reliable and self-explanatory. 
 
2. Rest Parameters - "Collect all the leftovers" 
 
The rest parameter lets a function accept any number of arguments. 
Normally, functions can only work with a fixed number of parameters (for example, one or two). 
But sometimes you don't know how many values the caller will pass - maybe one, maybe ten. 
By adding ... before the parameter name, JavaScript automatically gathers all the "extra" arguments 
into a real array. 
That's why it's called "rest" - it collects the rest of the arguments that were not assigned to other 
parameters. 
 
In plain English: 
If you say, "give me the rest of them," that's what this feature does - it takes everything that remains 
and packs it together so you can use it easily inside the function. 


---

 
81 
This is very useful when building flexible functions - for example, when summing a list of numbers, 
processing all given inputs, or combining variable-length data. 
 
3. Spread Operator - "Unpack things out again" 
 
The spread operator also uses three dots (...), but instead of collecting values, it does the opposite - 
it unpacks them. 
If you have an array (a list of values) and want to pass each value separately, the spread operator lets 
you do that easily. 
You can think of it as pouring out the contents of a container. 
 
For example: 
If you have a list of numbers and want to pass them into a function that expects individual numbers, 
the spread operator breaks that array into separate pieces so the function can see them individually. 
 
It's like saying: 
 
"Here, take each of these items, not the box they're in." 
 
The same idea works for objects: the spread operator can copy all key-value pairs from one object 
into another, which makes merging or cloning objects very simple. 
 
The relationship between them 
 
Even though rest and spread both use three dots, they do opposite things: 
 
- Rest collects multiple values into one bundle (when used in a function definition). 
- Spread unpacks one bundle into multiple values (when used in a function call or an array/object 
literal). 
 
You can remember it like this: 
Rest gathers, Spread scatters. 
 
Why these features matter 
 
Before these were added to JavaScript, you had to write extra code to: 
 
- Handle missing arguments manually. 
- Loop over the mysterious arguments object (which wasn't even a real array). 


---

 
82 
- Merge arrays or objects with clumsy methods. 
 
Now, with default, rest, and spread, your code becomes cleaner, more expressive, and easier to 
understand. 
They help you write functions that are more flexible and less error-prone, especially when working 
with variable data. 
 
Default parameters 
 
```js 
function greet(name = "there") { 
  return "Hi " + name; 
} 
greet(); // "Hi there" 
greet("Sam"); // "Hi Sam" 
``` 
 
Rest parameters 
 
```js 
function sum(...nums) { 
  return nums.reduce((a, b) => a + b, 0); 
} 
``` 
 
Spread with arrays and iterables 
 
```js 
const a = [1, 2]; 
const b = [3, 4]; 
const combined = [...a, ...b]; // [1,2,3,4] 
console.log([..."hi"]); // ['h','i'] 
``` 
 
Spread with objects (shallow copy/merge) 
 
```js 
const user = { name: "A", meta: { v: 1 } }; 


---

 
83 
const copy = { ...user, role: "admin" }; // shallow copy 
``` 
 
Common misconceptions 
 
1. Default expressions are evaluated at function definition time. They run at call time only if the 
argument is undefined. 
2. Rest gives an arguments-like object. Rest gives a true array; arguments is array-like and not in 
arrow functions. 
3. Object spread does a deep clone. It copies only one level; nested objects remain shared. 
 
Practice questions 
 
1. Combine default parameters with destructuring in a function signature. 
2. Refactor a function using arguments into one using rest. 
3. Explain why spreading an object with nested objects is not a deep copy. 
 
 
 
 


---

 
84 
What are template literals? 
What are template literals 
 
Template literals are strings written with backticks that support embedded expressions, multi-line 
text, and tagged processing. They simplify string building compared to concatenation and preserve 
line breaks as written. 
 
Embedded expressions use ${ ... } to inject values. The expression can be any JavaScript expression. 
Tagged templates call a function with the literal's parts before construction, enabling custom 
escaping, i18n, or formatting logic. 
 
Examples 
 
```js 
const name = "Sam", 
  score = 42; 
console.log(`Hello ${name}, score: ${score}`); 
``` 
 
```js 
const multi = `Line 1 
Line 2`; 
``` 
 
```js 
function join(strings, ...vals) { 
  return strings.map((s, i) => s + (vals[i] ?? "")).join(""); 
} 
const user = "<admin>"; 
console.log(join`Hello ${user}`); 
``` 
 
Common misconceptions 
 
1. Template literals auto-sanitize output. They do not; security depends on your tag function or 
escaping. 
2. Only variables can be inside ${}. Any expression can. 


---

 
85 
3. Backticks are slower. They compile to efficient string operations; performance differences are 
negligible in normal code. 
 
Practice questions 
 
1. Rewrite a concatenated string using a template literal. 
2. Create a tag that uppercases all interpolated values. 
3. Explain how multi-line handling differs from normal quotes. 
 
 
 
 


---

 
86 
Difference between for, for-in, for-of, and forEach 
Difference between for, for-in, for-of, and forEach 
 
What each one is for 
 
1. for (classic index loop) 
 
- Best when you need full control over the index and step (e.g., count by 2s, go backwards, stop early 
based on a condition). 
- Works with anything that has a numeric length and index access (like arrays and strings). 
- You can use break and continue. 
- Works fine with await inside an async function (each iteration can await). 
 
Example 
 
```js 
const arr = [10, 20, 30]; 
for (let i = 0; i < arr.length; i++) { 
  console.log(i, arr[i]); 
} 
``` 
 
2. for...in (keys of an object) 
 
- Iterates over enumerable property keys (names) of an object. 
- Includes inherited keys unless you filter with hasOwnProperty. 
- Not recommended for arrays (order can be surprising; it visits non-index properties too). 
- You can use break and continue. 
- Works fine with await inside an async function (each iteration can await). 
 
Example with an object 


---

 
87 
 
```js 
const user = { name: "A", age: 30 }; 
for (const key in user) { 
  if (Object.prototype.hasOwnProperty.call(user, key)) { 
    console.log(key, user[key]); 
  } 
} 
``` 
 
3. for...of (values from an iterable) 
 
- Iterates the values produced by any iterable: arrays, strings, Maps, Sets, typed arrays, generator 
results, etc. 
- Ideal for arrays when you want the values directly (no index math). 
- You can use break and continue. 
- Works well with await inside an async function (each loop can await before moving to the next 
item). 
- For Maps/Sets, you get entries or values in insertion order. 
 
Examples 
 
```js 
// Array values 
for (const value of [10, 20, 30]) { 
  console.log(value); 
} 
 
// String characters 
for (const ch of "hi") { 
  console.log(ch); 
} 


---

 
88 
 
// Map entries (each is [key, value]) 
const m = new Map([ 
  ["x", 1], 
  ["y", 2], 
]); 
for (const [k, v] of m) { 
  console.log(k, v); 
} 
``` 
 
4. forEach (array method that runs a callback per item) 
 
- Calls your function for each element of the array. 
- You cannot use break or continue to stop early; it always runs to the end. 
- Returning from inside the callback only returns from the callback, not the outer function. 
- About async/await: if you put await inside the forEach callback, the loop does not "pause" between 
items. All callbacks are scheduled and your awaits run inside them, but the outer code keeps going. If 
you need to process items one-by-one in order, prefer for...of or for. 
 
Example 
 
```js 
[10, 20, 30].forEach((value, index) => { 
  console.log(index, value); 
}); 
``` 
 
"Await-aware" explained simply 
 
- "Await-aware" just means: if you use await inside the loop, the loop actually waits for the 
asynchronous work to finish before moving to the next item. 


---

 
89 
- classic for and for...of: yes, they wait (when used inside an async function). 
- forEach: no, it does not wait between items; it fires the callbacks and moves on. 
- for...in: behaves like for (you can await inside and it will wait in an async function). 
 
Example of processing items one by one with pauses 
 
```js 
// Good: processes in sequence, waiting each time 
async function processSequentially(items) { 
  for (const item of items) { 
    await doAsyncWork(item); // waits before moving on 
  } 
} 
``` 
 
If you tried the same with forEach, the outer flow wouldn't wait for each `doAsyncWork` to finish 
before starting the next one. 
 
When to use which 
 
- Use for when you need index control, custom step sizes, or want to break/continue at specific 
counts. 
- Use for...in for enumerating object keys (and guard with hasOwnProperty). Avoid it for arrays. 
- Use for...of for clean iteration over values (arrays, strings, Maps, Sets, etc.). It's the go-to loop for 
arrays when you don't need the index. 
- Use forEach for quick, no-break, no-await list processing where order/pausing doesn't matter and 
readability is your priority. 
 
Access patterns and ordering 
 
- Arrays: for and for...of preserve natural order; forEach also follows array order; for...in can produce 
unexpected key order and include non-index keys—avoid it for arrays. 


---

 
90 
- Objects: plain objects are not iterable, so for...of will not work directly; use for...in (with 
hasOwnProperty) or Object.keys/Object.values/Object.entries with for...of. 
- Maps/Sets: for...of gives items in insertion order (with Map entries as [key, value]). 
- Strings: for...of yields characters (including correct handling for many Unicode cases). 
 
Common pitfalls (and fixes) 
 
1. "for...in on arrays is fine, right?" 
   It can include non-index keys and odd ordering. Prefer for, for...of, or forEach for arrays. 
 
2. "I can break out of forEach when I'm done." 
   You can't break or continue from forEach. If you need to stop early, use for or for...of. 
 
3. "I used await in forEach but it still ran everything at once." 
   forEach doesn't pause between items. If you need to wait per item, switch to for...of (inside an 
async function). 
 
4. "for...of works on objects too." 
   Not by default; plain objects aren't iterable. Use for...in (with hasOwnProperty) or: 
 
```js 
for (const [k, v] of Object.entries(obj)) { 
  /* ... */ 
} 
``` 
 
5. "I need the index with for...of." 
   Use entries: 
 
```js 
for (const [index, value] of arr.entries()) { 
  /* ... */ 


---

 
91 
} 
``` 
 
A few handy patterns 
 
Object entries with for...of 
 
```js 
const obj = { a: 1, b: 2 }; 
for (const [k, v] of Object.entries(obj)) { 
  console.log(k, v); 
} 
``` 
 
Array with index using entries 
 
```js 
const arr = ["x", "y", "z"]; 
for (const [i, v] of arr.entries()) { 
  console.log(i, v); 
} 
``` 
 
Sequential async processing 
 
```js 
async function run(items) { 
  for (const item of items) { 
    await doAsyncWork(item); 
  } 
} 


---

 
92 
``` 
 
Early exit 
 
```js 
for (const value of arr) { 
  if (value === target) break; 
} 
``` 
 
Common misconceptions 
 
1. for...in and for...of are interchangeable. They are not: for...in gives property names (keys); for...of 
gives iterable values. 
2. forEach is the same as a loop. It cannot break/continue, and it doesn't pause with await. 
3. Plain objects work with for...of. They don't; use Object.keys/values/entries or for...in (with a 
hasOwnProperty check). 
4. You can always replace for with forEach. If you need index math, early exit, or await per item, 
prefer for or for...of. 
 
Practice questions 
 
1. You have to process a list of tasks one by one, waiting for each network call to finish before 
starting the next. Which loop do you choose and why? 
2. Show how to iterate key/value pairs of a plain object in insertion-like order without using for...in. 
3. Explain why `break` does not work inside forEach and provide an alternative that supports early 
exit. 
 
 
 


---

 
93 
What are objects and how are they stored in memory? 
What are objects and how are they stored in memory 
 
An object is a container of key-value pairs. Keys are strings or symbols; values can be anything 
(numbers, strings, arrays, functions, other objects). Objects are dynamic: you can add, change, or 
remove properties at runtime. 
 
How objects live in memory (the mental model) 
 
Primitives (number, string, boolean, bigint, symbol, null, undefined) are stored directly as values. 
Objects live on the heap; variables hold a reference (a pointer) to them. If two variables point to the 
same object, changing it through one is visible through the other. When an object becomes 
unreachable from any live reference (including from other reachable objects), the garbage collector 
reclaims it. Cycles don't prevent collection as long as the whole cycle becomes unreachable. 
 
Ways to create objects 
 
1. Object literal (most common) 
 
```js 
const user = { name: "Ava", age: 30 }; 
``` 
 
Shorthand properties and methods: 
 
```js 
const name = "Ava"; 
const age = 30; 
const user = { 
  name, // same as name: name 
  age, 
  greet() { 
    // method shorthand 


---

 
94 
    return `Hi, I'm ${this.name}`; 
  }, 
}; 
``` 
 
Computed property names: 
 
```js 
const key = "score"; 
const obj = { [key]: 42 }; // { score: 42 } 
``` 
 
2. Constructor function (older pattern) 
 
```js 
function Person(name) { 
  this.name = name; 
} 
Person.prototype.sayHi = function () { 
  return "Hi " + this.name; 
}; 
const p = new Person("Leo"); 
``` 
 
Properties set inside the constructor are per-instance; methods placed on the prototype are shared 
by all instances (memory-efficient). 
 
3. class (modern, friendlier syntax around prototypes) 
 
```js 
class Person { 


---

 
95 
  constructor(name) { 
    this.name = name; 
  } 
  sayHi() { 
    return `Hi ${this.name}`; 
  } 
  static species() { 
    // class (static) method 
    return "Homo sapiens"; 
  } 
} 
const p = new Person("Mia"); 
``` 
 
Under the hood, classes still use prototypes. Instance methods are on `Person.prototype`. Static 
methods are on `Person` itself. 
 
4. Object.create (build with a specific prototype) 
 
```js 
const base = { kind: "base" }; 
const child = Object.create(base); // prototype = base 
child.x = 1; 
``` 
 
Great for building objects with a chosen prototype without invoking constructors. 
 
5. From existing entries 
 
```js 
const entries = [ 


---

 
96 
  ["a", 1], 
  ["b", 2], 
]; 
const obj = Object.fromEntries(entries); // { a: 1, b: 2 } 
``` 
 
Own vs inherited properties and the prototype chain 
 
Each object has an internal link to a prototype (another object or null). When you access `obj.prop`, 
the engine: 
 
1. Looks for an "own" property on `obj`. 
2. If missing, looks on `obj`'s prototype. 
3. Continues up the chain until it finds it or reaches `null`. 
 
No copying happens; lookup is dynamic. This is why methods placed on `Constructor.prototype` are 
shared across instances. 
 
Defining, reading, enumerating properties 
 
Property names can be strings or symbols. String keys that look like integers (e.g., "0", "1") may get 
special ordering during enumeration, but for most cases assume insertion order for own string keys, 
with symbol keys not included in typical enumeration. 
 
Useful patterns for iteration: 
 
```js 
const user = { name: "Ava", age: 30 }; 
 
// keys only 
for (const k of Object.keys(user)) { 
  console.log(k, user[k]); 


---

 
97 
} 
 
// values only 
for (const v of Object.values(user)) { 
  console.log(v); 
} 
 
// entries (key/value pairs) 
for (const [k, v] of Object.entries(user)) { 
  console.log(k, v); 
} 
``` 
 
`for...in` walks enumerable keys including inherited ones; guard with `hasOwnProperty` when 
needed. 
 
Property attributes (descriptors) 
 
Every property has attributes: `value`, `writable`, `enumerable`, `configurable` (for data properties) 
or `get`/`set` (for accessor properties). 
 
```js 
const user = {}; 
Object.defineProperty(user, "id", { 
  value: 123, 
  writable: false, // cannot change value 
  enumerable: false, // won't show in Object.keys 
  configurable: false, // cannot delete or reconfigure 
}); 
``` 
 
Accessors (computed values, side effects): 


---

 
98 
 
```js 
const meter = { 
  _value: 0, 
  get value() { 
    return this._value; 
  }, 
  set value(v) { 
    if (v >= 0) this._value = v; 
  }, 
}; 
``` 
 
Symbols as keys (non-colliding, non-string) 
 
```js 
const ID = Symbol("id"); 
const o = { [ID]: 99 }; 
``` 
 
Symbol keys are not found by `Object.keys`/`for...in`. Use `Object.getOwnPropertySymbols(o)` or 
`Reflect.ownKeys(o)` to see them. 
 
Common built-in object utilities (the greatest hits) 
 
Creation and prototypes 
 
- `Object.create(proto, descriptors?)` Create with a given prototype. 
- `Object.getPrototypeOf(obj)` / `Object.setPrototypeOf(obj, proto)` Read/change prototype 
(changing later can be slow; prefer setting at creation). 
- `obj.__proto__` Legacy getter/setter for prototype (avoid in production). 
 


---

 
99 
Introspection 
 
- `Object.keys(obj)` enumerable own string keys. 
- `Object.values(obj)` enumerable own string values. 
- `Object.entries(obj)` pairs of `[key, value]`. 
- `Object.getOwnPropertyNames(obj)` own string keys including non-enumerable. 
- `Object.getOwnPropertySymbols(obj)` own symbol keys. 
- `Reflect.ownKeys(obj)` all own keys (strings + symbols). 
- `Object.getOwnPropertyDescriptor(obj, key)` read attributes. 
 
Copying / merging (shallow) 
 
- `Object.assign(target, ...sources)` copies own enumerable string + symbol properties (shallow). 
- Spread syntax `{ ...obj }` also shallowly copies enumerable own properties. 
- Deep copy: `structuredClone(obj)` (modern) deep-clones many structured values; falls back to 
libraries for older environments or special cases. 
 
Equality and identity 
 
- `Object.is(a, b)` like `===` but treats `NaN` equal to `NaN` and distinguishes `+0` vs `-0`. 
 
Mutability control (top-level only) 
 
- `Object.preventExtensions(obj)` block adding new props. 
- `Object.seal(obj)` prevent add/delete; keep writing if writable. 
- `Object.freeze(obj)` prevent add/delete/reconfigure and writing. 
- Use recursively for deep effects or write a `deepFreeze` helper. 
 
Converting to data 
 
- `JSON.stringify(obj)` to JSON string (ignores functions and symbols, throws on cycles). 


---

 
100
- `JSON.parse(str)` back to an object. 
 
Boxing and primitives 
Objects can have `toString`, `valueOf`, or `Symbol.toPrimitive` to control how they convert to strings 
or numbers. 
 
```js 
const money = { 
  amount: 1000, 
  [Symbol.toPrimitive](hint) { 
    return hint === "number" ? this.amount : `$${this.amount}`; 
  }, 
}; 
String(money); // "$1000" 
+money; // 1000 
``` 
 
Methods on the object vs prototype methods 
 
Instance methods exist on each object, prototype methods are shared. In classes: 
 
```js 
class Counter { 
  count = 0; // public field per instance (each gets its own) 
  inc() { 
    this.count++; 
  } // shared function on prototype 
} 
``` 
 
Arrow methods as fields (`handler = () => {}`) capture `this` per instance (great for callbacks), but 
consume more memory than a single shared prototype method. 


---

 
101
 
Objects vs Map/Set 
 
Use a plain object when keys are known strings/symbols and you want prototype features, JSON, and 
simple literals. Use `Map` when keys can be anything (including objects), when you need guaranteed 
insertion order + efficient size, and methods like `map.get`, `map.set`, `map.has`. Use `Set` for unique 
value collections. WeakMap/WeakSet hold weak references to object keys/values and don't prevent 
garbage collection (useful for caches without leaks). 
 
Cloning and immutability 
 
Shallow copies copy only one level; nested objects remain shared. 
 
```js 
const user = { name: "Ava", meta: { visits: 1 } }; 
const copy = { ...user }; // shallow 
copy.meta.visits++; // also changes user.meta.visits 
``` 
 
Deep copy options: 
 
- `structuredClone(user)` (modern, handles many types). 
- Libraries or custom recursive clone for legacy/edge cases. 
 
If you want immutable patterns, avoid mutating original objects; create new copies with changed 
fields: 
 
```js 
const updated = { 
  ...user, 
  meta: { ...user.meta, visits: user.meta.visits + 1 }, 
}; 
``` 


---

 
102
 
Performance notes (pragmatic) 
 
Engines optimize objects using hidden classes/shapes; consistent property creation order and shape 
(define all fields in the constructor, avoid adding/removing fields later) can help performance. 
`Object.setPrototypeOf` and changing shapes at runtime can deoptimize; prefer stable layouts. 
 
Memory, reachability, and leaks 
 
Objects stay alive as long as something reachable references them. Accidental retention (e.g., a 
global cache never cleared, long-lived event listeners, closures holding large data) can cause leaks. 
Use: 
 
- Remove event listeners when no longer needed. 
- Null out references when appropriate. 
- Prefer WeakMap/WeakSet for caches keyed by objects. 
 
Putting it all together: typical patterns 
 
Factory function (no `new`) 
 
```js 
function createUser(name) { 
  return { 
    name, 
    greet() { 
      return `Hi ${this.name}`; 
    }, 
  }; 
} 
``` 
 


---

 
103
Class 
 
```js 
class User { 
  constructor(name) { 
    this.name = name; 
  } 
  greet() { 
    return `Hi ${this.name}`; 
  } 
} 
``` 
 
Prototype + Object.create 
 
```js 
const proto = { 
  greet() { 
    return `Hi ${this.name}`; 
  }, 
}; 
const u = Object.create(proto); 
u.name = "Ava"; 
``` 
 
Defining non-enumerable or read-only properties 
 
```js 
const obj = {}; 
Object.defineProperty(obj, "id", { 
  value: 1, 


---

 
104
  writable: false, 
  enumerable: false, 
}); 
``` 
 
Common misconceptions 
 
1. Assigning an object to another variable copies it. It copies the reference; both variables point to 
the same object. 
2. Prototype properties are copied into the object. They are not; they're looked up dynamically 
through the chain. 
3. `Object.freeze` makes everything inside immutable. It's shallow; nested objects are still mutable 
unless you freeze them too. 
4. `for...of` works on plain objects. Plain objects are not iterable; use `Object.keys/values/entries` or 
`for...in` with `hasOwnProperty`. 
5. JSON is a reliable clone for all objects. It drops functions/symbols and fails on cycles or special 
types; prefer `structuredClone` when available. 
 
Practice questions 
 
1. Show four different ways to create an object that has a `greet()` method, and explain which 
method is shared vs per-instance in each case. 
2. Explain what happens in memory when you execute `const a = { x: 1 }; const b = a; b.x = 2;`. 
3. How would you create a non-enumerable, read-only property `id` on an object? How would you 
verify its descriptor? 
4. What's the difference between `{ ...obj }`, `Object.assign({}, obj)`, and `structuredClone(obj)`? 
5. When would you choose a `Map` over a plain object? Give two concrete reasons. 
 
 
 
 


---

 
105
Explain pass-by-value vs pass-by-reference 
Explain pass-by-value vs pass-by-reference 
 
When you pass something to a function in JavaScript, the language always passes it **by value** — 
but _what that value represents_ depends on whether the thing you're passing is a **primitive** or 
an **object**. 
To understand the difference, let's first see what each category really is. 
 
### 1. Two categories of data types 
 
- **Primitives:** numbers, strings, booleans, null, undefined, BigInt, and symbols. 
  These hold _actual values_ directly (like `42` or `"hello"`). 
 
- **Objects:** arrays, functions, objects, maps, sets, etc. 
  These do not store the value itself in the variable. 
  Instead, the variable stores a **reference** — a kind of "address" or pointer to where the real data 
lives in memory (on the heap). 
 
So, in JavaScript: 
 
- Primitives → simple direct values. 
- Objects → references to memory locations that hold the data. 
 
### 2. Pass-by-value (primitives) 
 
When you pass a **primitive** to a function, JavaScript copies its actual value into the parameter. 
That means changes inside the function don't affect the original variable, because the function is 
working on its own copy. 
 
Think of it like photocopying a document — the function gets the copy, not the original. 
If it writes on that paper, your original stays untouched. 
 


---

 
106
So when we say "pass-by-value," it literally means: 
 
> "The function received a new copy of the value." 
 
### 3. Pass-by-reference (objects — conceptually) 
 
Now, when you pass an **object**, what gets copied is **not the whole object**, but the 
**reference** (the address pointing to it). 
 
That means both the original variable and the function parameter now point to the **same object** 
in memory. 
If the function changes something _inside_ that object, both will see that change — because they're 
both looking at the same underlying data. 
 
But there's a subtle twist: 
Even though this behavior _looks like_ pass-by-reference, JavaScript is technically still **passing by 
value** — the value just happens to be a _reference_. 
In other words, the function gets a _copy of the reference_, not the object itself. 
But because the reference points to the same memory location, changing the contents inside that 
object affects both. 
 
However, if you make the parameter point to a new object inside the function, that new reference 
doesn't affect the original one. 
They'll then point to different places. 
 
### 4. The mental model — "pointer vs value" 
 
You can think of it like this: 
 
- A primitive variable holds a **value** directly. 
- An object variable holds an **address tag** pointing to where the object lives. 
 
When you call a function: 


---

 
107
 
- For a primitive: the value (like `10` or `"hi"`) is copied. 
- For an object: the reference (the tag pointing to the heap) is copied. 
  Now both the original and the parameter hold tags that point to the same place. 
 
This explains why modifying the object's inside properties affects the outside variable too — both are 
looking at the same location. 
 
--- 
 
### 5. Practical implications 
 
1. **Immutable vs mutable:** 
 
   - Primitives are immutable (you can replace them, but not modify them directly). 
   - Objects are mutable (their contents can change). 
 
2. **Function design:** 
 
   - When you pass a primitive, you can be sure the original won't be affected. 
   - When you pass an object, if you don't want to mutate the original, you should clone or copy it 
first. 
 
3. **Common beginner confusion:** 
 
   - "I thought JavaScript passes by reference because my array changed!" 
     → No — the reference itself was passed _by value_, but both refer to the same object. 
   - "If I reassign the parameter inside the function, shouldn't it change outside too?" 
     → No — that's a new reference; the outer one still points to the old object. 
 
--- 
 


---

 
108
### 6. How memory fits into this 
 
In memory: 
 
- Primitives live directly on the stack. 
- Objects live on the heap. 
- Variables hold stack entries that either contain a direct value (for primitives) or a pointer to a heap 
object (for objects). 
 
When a function runs: 
 
- New local variables and parameters are placed on its stack frame. 
- When the function exits, those local stack variables are discarded. 
- But the heap objects they pointed to may continue to exist if something outside the function still 
references them. 
 
That's why objects persist beyond function calls — they're not copied around; only their references 
are. 
 
--- 
 
### 7. The key takeaway 
 
- JavaScript always passes arguments **by value**. 
- For primitives, that value is the actual data. 
- For objects, that value is a _reference_ to where the data lives. 
- So modifications to object properties affect the same object, but reassignment inside the function 
doesn't affect the original variable. 
 
Or in simpler terms: 
 
> You copy the value of the box — 


---

 
109
> but for objects, that value is the **key to a shared box**, not the box itself. 
 
Examples 
 
```js 
function inc(n) { 
  n = n + 1; 
} 
let a = 5; 
inc(a); 
console.log(a); // 5 
``` 
 
```js 
function setName(obj) { 
  obj.name = "Alex"; 
} 
const user = { name: "Sam" }; 
setName(user); 
console.log(user.name); // "Alex" 
``` 
 
```js 
function replace(obj) { 
  obj = { name: "New" }; 
} 
replace(user); 
console.log(user.name); // still "Alex" 
``` 
 
Common misconceptions 


---

 
110
 
1. JavaScript is pass-by-reference. The reference is passed by value. 
2. Reassigning a parameter changes the caller's variable. Only mutations to the object's contents are 
observed by the caller. 
3. Passing objects is unsafe. Avoid mutation or copy when needed; passing references itself is fine. 
 
Practice questions 
 
1. Why does reassigning a parameter not affect the caller? 
2. Show how to avoid accidental mutation when passing objects into functions. 
3. Implement a deep clone and explain when you would use it. 
 
 
 
 


---

 
111
What is object destructuring and array destructuring? 
What is object destructuring and array destructuring 
 
Destructuring lets you extract values from arrays and properties from objects into variables using a 
compact pattern. Arrays destructure by position; objects destructure by property name. You can 
rename, set defaults, skip elements, and destructure nested structures. 
 
Examples 
 
```js 
const arr = [10, 20, 30]; 
const [a, b] = arr;        // a=10, b=20 
const [, , c] = arr;       // c=30 
const [x = 1, y = 2] = []; // defaults 
``` 
 
```js 
const user = { name: "Sam", age: 30 }; 
const { name, age } = user; 
const { name: fullName } = user;      // rename 
const { role = "guest" } = user;      // default 
``` 
 
```js 
const data = { meta: { count: 5 }, items: [1, 2] }; 
const { meta: { count }, items: [first] } = data; 
``` 
 
```js 
function draw({ x = 0, y = 0, color = "black" } = {}) {} 
``` 


---

 
112
 
Common misconceptions 
 
1. Destructuring mutates the source. It only reads. 
2. Object destructuring depends on order. It matches by key name. 
3. Missing properties cause errors. Provide defaults to handle undefined. 
 
Practice questions 
 
1. Extract the second and fourth items of an array into a and b. 
2. Destructure user.profile.name with a default of "Anonymous". 
3. Write a function that destructures options with defaults in its parameter list. 
 
 
 
 
 
 
 
 
 
 
 
 
 
 


---

 
113
Explain Object.freeze, Object.seal, and 
Object.preventExtensions 
Explain Object.freeze, Object.seal, and Object.preventExtensions 
 
Object.preventExtensions stops adding new properties to an object. Existing properties can still be 
changed or deleted depending on their descriptors. Object.isExtensible checks whether new 
properties can be added. 
 
Object.seal prevents adding or deleting properties and marks all existing properties as non-
configurable. Values of writable properties can still be changed. Object.isSealed checks the sealed 
state. 
 
Object.freeze prevents adding, deleting, or reconfiguring properties and makes all existing properties 
non-writable and non-configurable. Values cannot be changed. Object.isFrozen checks the frozen 
state. All three methods are shallow: nested objects are unaffected unless also processed. 
 
Examples 
 
```js 
const a = { x: 1 }; 
Object.preventExtensions(a); 
a.y = 2;            // ignored or throws in strict mode 
delete a.x;         // allowed if configurable 
``` 
 
```js 
const b = { x: 1 }; 
Object.seal(b); 
delete b.x;         // false 
b.x = 2;            // ok if writable 
``` 
 
```js 


---

 
114
const c = { x: 1 }; 
Object.freeze(c); 
c.x = 2;            // ignored or throws in strict mode 
``` 
 
Common misconceptions 
 
1. freeze is deep immutability. It only freezes the top level. 
2. seal prevents value changes. It prevents deletion and reconfiguration but not writing (if writable). 
3. preventExtensions is equivalent to seal. It only blocks adding new properties; deletion and 
configuration still depend on descriptors. 
 
Practice questions 
 
1. Summarize the differences among preventExtensions, seal, and freeze. 
2. Write a deepFreeze utility and explain when you would use it. 
3. What happens when you assign to a frozen property in strict vs non-strict mode? 
 
 
 


---

 
115
What is prototypal inheritance? 
What is prototypal inheritance 
 
Prototypal inheritance is the way JavaScript lets objects share behavior without copying it. Every 
object can have an internal link to another object called its prototype. When you read a property 
from an object and the engine doesn't find an "own" property, it automatically walks this prototype 
link to look for the property on the prototype, then that prototype's prototype, and so on until it 
reaches null. This chain is consulted at read time for every lookup; nothing is copied automatically. 
Because of this, a single shared method defined on one prototype can serve many instances at once, 
saving memory and keeping behavior consistent. If you later change the shared method on the 
prototype, all instances immediately observe the change on their next property read (unless they 
have their own property with the same name, which "shadows" the prototype's property). 
 
In day-to-day code, you usually encounter prototypal inheritance through constructor functions and 
classes. A constructor's prototype object holds the shared methods; instances created with new link 
to that prototype. With class, the instance methods you write are placed on the class's prototype 
under the hood, and instances created with new Class() link to it. You can also build prototype chains 
directly with Object.create(parent), which makes an object whose prototype is parent without 
involving constructors. This flexibility allows both classical, class-like hierarchies and ad-hoc 
delegation where objects share only what they need. 
 
Understanding prototypal inheritance clarifies several behaviors: method dispatch uses the receiver 
object as this even if the method was found higher in the chain; assignment creates or updates own 
properties by default (it does not climb the chain to overwrite a prototype property); and property 
enumeration can include or exclude inherited properties depending on the mechanism you use. The 
model is dynamic and late-bound, so you should avoid mutating prototypes at runtime in 
widely-shared libraries to reduce surprises; prefer establishing shapes once and treating prototypes 
as stable interfaces. 
 
Examples 
 
```js 
// Sharing a method via a prototype (constructor style) 
function Person(name) { 
  this.name = name; 
} 
Person.prototype.sayHi = function () { 
  return "Hi " + this.name; 


---

 
116
}; 
const a = new Person("Ava"); 
const b = new Person("Ben"); 
a.sayHi(); // "Hi Ava" 
b.sayHi(); // "Hi Ben" 
console.log(a.sayHi === b.sayHi); // true (shared function) 
``` 
 
```js 
// Direct delegation with Object.create 
const mover = { 
  move() { 
    return this.label + " moves"; 
  }, 
}; 
const robot = Object.create(mover); 
robot.label = "R2"; 
robot.move(); // "R2 moves" 
``` 
 
```js 
// Shadowing a prototype property 
const base = { kind: "base" }; 
const child = Object.create(base); 
child.kind = "child"; // own property shadows base.kind 
``` 
 
Common misconceptions 
 
1. Prototypal inheritance copies methods into children. Nothing is copied; reads consult the chain on 
demand. 


---

 
117
2. Methods run with this bound to the prototype. this is the receiver object (the thing before the 
dot), not the prototype where the method lives. 
3. Assigning obj.x updates the prototype's x. Assignment creates/updates an own property unless an 
accessor or descriptor intercepts it. 
4. Classes remove prototypes. class is syntax over prototypes; the mechanism is unchanged. 
 
Practice questions 
 
1. Theory: In your own words, describe how a property read travels along the prototype chain and 
how shadowing works. 
2. Coding: Implement a Shape constructor with an area method on Shape.prototype. Make Rectangle 
inherit from Shape's prototype and override area on Rectangle.prototype. Show both in action. 
3. Coding: Create a base object with Object.create and prove that adding a method to the base later 
becomes visible on already-created children. 
 
 
 


---

 
118
How does the prototype chain work? 
How does the prototype chain work 
 
The prototype chain is the ordered sequence of objects the engine searches to resolve a property 
read. When you evaluate obj.prop, the engine checks for an own property prop on obj. If it does not 
exist, it follows obj's internal [[Prototype]] link to another object (often the constructor's prototype) 
and repeats the check. This continues until the property is found or the end of the chain (null) is 
reached. If nothing defines prop, the result is undefined. Because lookup is dynamic, changing any 
object along the chain affects future reads; because own properties take precedence, adding an own 
property with the same name "shadows" the one found higher in the chain. 
 
Method calls use the same lookup. When you call obj.method(), the engine finds method using the 
chain, but during the call it binds this to obj (the receiver). That allows a single shared function living 
on a prototype to behave as if it belonged to each instance. Writes behave differently: a plain 
assignment obj.prop = v creates or updates an own property on obj; it does not climb the chain to 
modify a prototype property. Accessors (get/set) and property descriptors can change this behavior 
by intercepting reads/writes. Enumeration tools differ too: for...in traverses enumerable keys 
including inherited ones; Object.keys shows only enumerable own string keys; 
Object.getOwnPropertyNames includes non-enumerable own string keys; Reflect.ownKeys includes 
all own keys (strings and symbols). 
 
The global chain for typical objects ends at Object.prototype, which provides methods like toString 
and hasOwnProperty. Arrays and functions have their own prototype objects that themselves link to 
Object.prototype. Null-prototype objects (Object.create(null)) deliberately have no inherited 
properties, which is useful for "dictionary" maps without prototype interference. Understanding the 
chain helps you reason about performance (engines optimize common shapes), avoids accidental 
leaks of shared mutable state on prototypes, and clarifies why late changes to a prototype surface 
everywhere. 
 
Examples 
 
```js 
// Three-level chain: A <- B <- C 
const A = { 
  tag: "A", 
  greet() { 
    return "from A"; 
  }, 


---

 
119
}; 
const B = Object.create(A); 
const C = Object.create(B); 
C.greet(); // "from A" 
C.greet = function () { 
  return "from C"; 
}; 
C.greet(); // "from C" (shadowing) 
``` 
 
```js 
// Assignment creates own property; prototype remains unchanged 
const base = { x: 1 }; 
const child = Object.create(base); 
child.x = 2; 
console.log(child.x, base.x); // 2, 1 
``` 
 
```js 
// Prototype accessors can intercept writes 
const P = { 
  _v: 0, 
  get v() { 
    return this._v; 
  }, 
  set v(n) { 
    this._v = n < 0 ? 0 : n; 
  }, 
}; 
const o = Object.create(P); 
o.v = -5; // setter on prototype runs with this = o 


---

 
120
o.v; // 0 
``` 
 
Common misconceptions 
 
1. If a property exists on the prototype, assignment updates that one. Default assignment 
creates/updates an own property instead. 
2. Methods run with this equal to the prototype. this is the receiver. 
3. Changing a prototype only affects future instances. Reads always consult the current prototype, so 
existing instances observe changes immediately (unless shadowed). 
4. for...in shows only own properties. It walks inherited enumerable keys too. 
 
Practice questions 
 
1. Theory: Explain why child.prop = value does not update parent.prop and how accessors can alter 
this behavior. 
2. Coding: Build A -> B -> C where A supplies a method. Prove that shadowing on C hides A's method, 
then delete from C and show the lookup falls back to A again. 
3. Coding: Use a prototype setter to validate assignments on child instances; show that the setter's 
this refers to the instance. 
 
 
 


---

 
121
What are constructor functions? 
What are constructor functions 
 
Constructor functions are the pre-class way to initialize similar objects that share behavior. A 
constructor is just a normal function intended to be invoked with new. The new operator performs 
four coordinated steps: (1) it allocates a fresh empty object, (2) it sets that object's internal 
[[Prototype]] to the constructor's prototype property, (3) it binds this inside the constructor to that 
fresh object so you can assign per-instance fields, and (4) it returns the new object automatically 
unless you explicitly return a non-primitive value. By placing methods on 
ConstructorName.prototype instead of inside the constructor, all instances share one function, which 
is memory-efficient and keeps behavior consistent. 
 
Constructor functions compose into hierarchies by linking prototypes. To emulate "subclassing," you 
create the child's prototype from the parent's prototype (Object.create) and call the parent 
constructor within the child constructor to initialize shared fields. You also repair the child's 
prototype.constructor property if you care about reflection. While ES6 class offers cleaner syntax, 
understanding constructor functions explains what class does under the hood and clarifies why 
instances see prototype methods, how this is bound during construction, and why returning an 
object from a constructor changes the returned value regardless of prototype setup. 
 
Examples 
 
```js 
function Person(name) { 
  this.name = name; 
} 
Person.prototype.sayHi = function () { 
  return "Hi " + this.name; 
}; 
const a = new Person("Ava"), 
  b = new Person("Ben"); 
a.sayHi(); 
b.sayHi(); 
``` 
 


---

 
122
```js 
function Parent(x) { 
  this.x = x; 
} 
function Child(x, y) { 
  Parent.call(this, x); // initialize Parent fields 
  this.y = y; 
} 
Child.prototype = Object.create(Parent.prototype); 
Child.prototype.constructor = Child; 
``` 
 
```js 
// Returning a non-primitive overrides the default return 
function Odd() { 
  this.tag = "Odd"; 
  return { note: "I ignore the prototype link" }; 
} 
const o = new Odd(); 
// o has no link to Odd.prototype 
``` 
 
Common misconceptions 
 
1. new copies methods into instances. It links instances to the prototype; methods remain on the 
prototype. 
2. Returning an object from a constructor is harmless. It replaces the instance entirely, possibly 
breaking the intended prototype link. 
3. The constructor property is always meaningful. After replacing a prototype, restore constructor 
manually if you rely on it. 
 
Practice questions 


---

 
123
 
1. Theory: List the four steps performed by new and explain why placing methods on the prototype 
saves memory. 
2. Coding: Implement a Point(x, y) with a distance method on Point.prototype. Create two points and 
verify the method is shared. 
3. Coding: Implement Parent/Child inheritance using Object.create + Parent.call, and verify Child 
instances access Parent's prototype methods. 
 
 
 


---

 
124
Explain class syntax in ES6 and how it’s sugar over 
prototypes 
Explain class syntax in ES6 and how it's sugar over prototypes 
 
Classes in JavaScript are a more readable way to write what the language has always done with 
functions and prototypes. They do not introduce a new inheritance system like in Java or C++; they 
just make the old prototype-based pattern easier to write and understand. When you define a class, 
JavaScript actually creates a special kind of function under the hood - the constructor. Every method 
you write inside the class body is automatically added to that class's prototype, not copied into each 
object. So when you create an object from a class using the new keyword, that object gets linked to 
the class's prototype, just like it would if you used a constructor function. That's why calling a 
method on one instance doesn't duplicate the code - all instances share the same method from the 
prototype. 
 
When you extend one class from another using extends, JavaScript connects the new class's 
prototype to the parent class's prototype. This means if a method isn't found on the child, it looks 
upward in the chain to find it on the parent. Inside the child's constructor, you can call super() to run 
the parent's constructor, ensuring the base setup happens before adding the child's specific logic. 
You can also call super.someMethod() to reuse parent methods from inside overrides. 
 
Classes also provide a few new conveniences that make object-oriented programming easier. For 
example, you can define fields (variables) directly inside the class body instead of only inside the 
constructor. Fields declared with the # prefix are private, meaning they can only be accessed inside 
that class. This gives real data privacy - something older JavaScript patterns couldn't enforce. There 
are also static methods and fields, which belong to the class itself instead of instances. Static 
methods are used for utility operations or factory functions related to the class, while static fields can 
store constants or configuration shared across all instances. 
 
Despite these modern features, classes in JavaScript are still built on the same prototype mechanism. 
Each class creates a constructor function and a prototype object that stores shared methods. 
Instances link to that prototype, and method calls use that link to find and execute the right code. 
Nothing is copied; the language simply hides the prototype wiring behind a cleaner syntax. That's 
why classes are often said to be "syntactic sugar" - they sweeten the old prototype system but don't 
change it. Understanding this helps you realize that features like inheritance, method overriding, and 
shared behavior in JavaScript are all just prototype relationships under the hood. 
 
Examples 
 
```js 


---

 
125
class Shape { 
  area() { 
    return 0; 
  } 
} 
class Rectangle extends Shape { 
  constructor(w, h) { 
    super(); 
    this.w = w; 
    this.h = h; 
  } 
  area() { 
    return this.w * this.h; 
  } // override 
  static kind() { 
    return "rect"; 
  } 
} 
const r = new Rectangle(3, 4); 
r.area(); // 12 
Rectangle.kind(); // "rect" 
``` 
 
```js 
class Counter { 
  #count = 0; // private 
  inc() { 
    this.#count++; 
  } 
  value() { 
    return this.#count; 


---

 
126
  } 
} 
const c = new Counter(); 
c.inc(); 
c.value(); // 1 
``` 
 
```js 
// Field initializers 
class Task { 
  status = "new"; // per-instance field 
  run() { 
    this.status = "done"; 
  } 
} 
``` 
 
Common misconceptions 
 
1. class changes inheritance to classical copying. It still uses prototypes and delegation. 
2. Methods are per-instance with class. Methods live on the prototype; fields are per-instance. 
3. Private fields are just naming tricks. They are enforced; accessing #private outside the class is a 
syntax error. 
 
Practice questions 
 
1. Theory: Explain where instance methods and static methods are stored at runtime and how 
extends links prototypes. 
2. Coding: Implement a Base class with a greet method, extend it with Admin that overrides greet 
and calls super.greet(). 
3. Coding: Create a class with a #private counter and public inc/value methods; prove that external 
code cannot access #counter. 


---

 
127
What is Object.create used for? 
What is Object.create used for 
 
Object.create(proto, descriptors?) constructs a new object whose internal [[Prototype]] is proto and 
whose own properties can be defined via an optional descriptors map. This is the most direct way to 
express "make an object that delegates to this other object" without invoking constructors. Because 
the prototype is set at creation time, you avoid the performance and complexity costs of altering the 
prototype later. Passing null creates a "dictionary" object with no inherited properties (no toString, 
no hasOwnProperty), which is ideal when you want a clean key space for arbitrary keys. 
 
The descriptors parameter lets you define properties with precise control over writability, 
enumerability, configurability, and getters/setters in one call. Using Object.create makes delegation 
explicit and encourages composition: you can assemble objects that share only what they need by 
choosing suitable prototypes. It is also convenient for building test doubles or simple hierarchies, 
where you can add methods to the parent after children exist and they will see the new methods on 
subsequent reads. 
 
Examples 
 
```js 
const base = { 
  greet() { 
    return "hi"; 
  }, 
}; 
const child = Object.create(base, { 
  id: { value: 1, writable: true, enumerable: true, configurable: true }, 
}); 
child.greet(); // "hi" 
``` 
 
```js 
// Null-prototype "dictionary" 
const dict = Object.create(null); 


---

 
128
dict["__proto__"] = "ok"; // safe: not an inherited key 
Object.hasOwn(dict, "__proto__"); // true 
``` 
 
```js 
// Add to the base later 
const a = Object.create(base); 
a.name = "A"; 
base.who = function () { 
  return this.name; 
}; 
a.who(); // "A" 
``` 
 
Common misconceptions 
 
1. Object.create clones the prototype. It links; nothing is copied. 
2. You need constructors to set up inheritance. Object.create directly sets the prototype relationship. 
3. Null-prototype objects behave like normal objects. They lack Object.prototype utilities; use 
Object.hasOwn and Reflect helpers. 
 
Practice questions 
 
1. Theory: When would you prefer Object.create over class or constructors? 
2. Coding: Create a null-prototype dictionary and demonstrate safe key storage and lookup without 
collisions. 
3. Coding: Build a base -> child chain with Object.create, add a method to the base afterwards, and 
show the child can call it. 
 
 
 


---

 
129
Explain call, apply, bind — and differences between 
them 
Explain call, apply, bind and differences between them 
 
In JavaScript, functions are special objects that can be called in many different ways. By default, 
when you call a regular function, the value of `this` inside it depends on _how_ you call it — not 
where it was written. Sometimes you need to control what `this` points to, or you might need to pass 
arguments flexibly from another source. That's where **call**, **apply**, and **bind** come in. 
These three methods belong to every function in JavaScript, and they let you explicitly decide what 
`this` should refer to when the function runs. 
 
The **call** method runs a function immediately, but allows you to specify what `this` should be 
and pass arguments one by one. For example, `sayHello.call(user, "Hi")` calls `sayHello` right away 
with `this` bound to `user`. It's just like calling `user.sayHello("Hi")`, but gives you manual control 
over the context. The **apply** method works almost the same way — it also invokes the function 
immediately — but instead of taking arguments individually, it expects them as a single array (or 
array-like structure). For instance, `sayHello.apply(user, ["Hi"])` does the same as `sayHello.call(user, 
"Hi")`. The main difference is only in how you pass the arguments. This was particularly useful before 
the spread operator (`...`) was introduced, since you could easily forward arrays of arguments to a 
function. 
 
The **bind** method is slightly different. It doesn't call the function right away. Instead, it creates 
and returns a _new function_ that remembers the `this` value you provided and optionally some of 
the arguments you passed. When you later call that returned function, it will automatically use the 
bound `this` and pre-filled arguments. For example, if you write `const greetJohn = greet.bind(user, 
"John")`, you now have a new function that always greets using that same `user` context and name, 
no matter how or where you call it. This is extremely useful when you need to pass functions as 
callbacks — like event listeners or setTimeout handlers — and want them to remember which object 
they belong to. 
 
Here's a simple way to visualize it: 
 
```js 
function say(greeting) { 
  console.log(greeting + ", I am " + this.name); 
} 
const person = { name: "Alice" }; 
 


---

 
130
// call - runs immediately 
say.call(person, "Hello"); // "Hello, I am Alice" 
 
// apply - runs immediately, arguments as array 
say.apply(person, ["Hi"]); // "Hi, I am Alice" 
 
// bind - doesn't run yet 
const boundSay = say.bind(person, "Hey"); 
boundSay(); // "Hey, I am Alice" 
``` 
 
Another common use case is **borrowing methods**. For example, 
`Array.prototype.slice.call(arguments)` converts the special `arguments` object (which is array-like 
but not a real array) into a true array. You can do this because call allows you to use a method from 
one object (Array.prototype) on another object (`arguments`) by setting what `this` should be. 
Similarly, you can use `Math.max.apply(null, numbers)` to find the maximum value in an array, since 
`Math.max` expects individual numbers, not an array. 
 
It's also worth noting how **arrow functions** differ here. Arrow functions do not have their own 
`this` — they inherit it from the surrounding scope where they were defined. Because of that, using 
call, apply, or bind on arrow functions has no effect on `this`; they simply ignore those changes. 
That's one of the main differences between arrow functions and regular ones when it comes to 
controlling context. 
 
Finally, there's a special rule when combining **bind** and **new**. If you create a bound function 
and later use it as a constructor (with the `new` keyword), the newly created object becomes `this`, 
overriding the bound value. This ensures that bound functions still behave correctly when used to 
create objects. So, binding only fixes `this` for normal function calls, not for object construction. 
 
In short: 
 
- **call** -> runs the function immediately, takes `this` and individual arguments. 
- **apply** -> runs immediately, takes `this` and arguments as an array. 
- **bind** -> returns a new function that remembers its `this` and optional pre-filled arguments for 
later. 
 


---

 
131
These tools make JavaScript more flexible by letting you borrow functions, stabilize the meaning of 
`this`, and reuse logic in different contexts without rewriting it. 
 
Examples 
 
```js 
function show(prefix) { 
  return prefix + this.name; 
} 
const user = { name: "Ava" }; 
show.call(user, ">> "); // ">> Ava" 
show.apply(user, ["** "]); // "** Ava" 
const bound = show.bind(user, ":: "); 
bound(); // ":: Ava" 
``` 
 
```js 
// Borrowing array methods 
function firstArg() { 
  return arguments[0]; 
} 
Array.prototype.slice.call(arguments); // turn arguments into a real array 
``` 
 
```js 
// Partial application with bind 
function add(a, b, c) { 
  return a + b + c; 
} 
const add5 = add.bind(null, 5); 
add5(10, 20); // 35 


---

 
132
``` 
 
Common misconceptions 
 
1. bind mutates the original function. It returns a new function; the original remains unchanged. 
2. You can rebind an arrow's this with call/apply/bind. Arrow functions' this is fixed lexically. 
3. bind prevents new from changing this. Constructing a bound function with new binds this to the 
newly created instance. 
 
Practice questions 
 
1. Theory: In one paragraph, contrast call, apply, and bind and describe when each is most 
convenient. 
2. Coding: Write a logger that prints this.tag; demonstrate changing receivers with call/apply and 
permanently with bind. 
3. Coding: Create a multiply(a, b) function and a double(x) by partially applying multiply with bind. 
 
 
 
 


---

 
133
What are higher-order functions? 
What are higher-order functions 
 
A higher-order function (HOF) is a function that takes one or more functions as inputs, returns a 
function as output, or both. This idea lets you separate "what to do" (the callback) from "how to do 
it" (the control flow). In practice, Array.prototype.map, filter, and reduce are classic HOFs: you 
provide small functions that describe how to transform, select, or combine items, and the HOF 
handles iteration, indexing, and collection building. HOFs are central to functional programming 
patterns, enabling composition, reuse, and testable logic where side effects are limited and easy to 
locate. 
 
Beyond arrays, HOFs underpin event systems (registering handlers), async flows (then handlers, 
executor functions), and middleware/decorators (wrapping behavior to add cross-cutting concerns 
like logging, caching, and retry). Two related techniques often used with HOFs are partial application 
(pre-filling some arguments) and currying (turning a multi-argument function into a chain of 
one-argument functions). Used thoughtfully, HOFs reduce boilerplate and make data pipelines clear; 
used excessively, they can obscure simple logic behind many tiny layers. The balance is to 
encapsulate common patterns while keeping core steps explicit. 
 
Examples 
 
```js 
// map, filter, reduce 
const nums = [1, 2, 3, 4]; 
const squares = nums.map((n) => n * n); 
const evens = nums.filter((n) => n % 2 === 0); 
const sum = nums.reduce((acc, n) => acc + n, 0); 
``` 
 
```js 
// once: call a function only the first time 
function once(fn) { 
  let called = false, 
    value; 
  return function (...args) { 


---

 
134
    if (!called) { 
      called = true; 
      value = fn.apply(this, args); 
    } 
    return value; 
  }; 
} 
``` 
 
```js 
// curry for two-argument function 
function curry2(fn) { 
  return (a) => (b) => fn(a, b); 
} 
const add = (x, y) => x + y; 
const add2 = curry2(add); 
add2(3)(4); // 7 
``` 
 
Common misconceptions 
 
1. HOFs are only for arrays. They appear anywhere you pass or return functions (events, promises, 
middleware). 
2. Currying and partial application are identical. Currying makes N unary functions; partial application 
fixes some arguments in place. 
3. HOFs are always slower. In real apps, clarity and maintainability outweigh micro-overheads; 
measure before optimizing. 
 
Practice questions 
 
1. Theory: Explain why separating iteration mechanics (map/filter/reduce) from per-item logic 
improves testability. 


---

 
135
2. Coding: Implement a compose(...fns) utility that composes functions right-to-left; test with simple 
math functions. 
3. Coding: Implement a memoize(fn) that caches results based on arguments for pure functions. 
 
 
 


---

 
136
What is callback hell and how to avoid it? 
What is callback hell and how to avoid it 
 
Callback hell is the tangled control flow that emerges when you nest many asynchronous callbacks 
inside one another. Each step depends on the previous step's result, so you place the next callback 
inside the prior one's success handler, creating a pyramid shape. This structure makes code hard to 
read, error paths easy to forget, and sequencing brittle (e.g., double invocations or missed errors). 
The problem is not callbacks themselves; it's unstructured composition that interleaves business 
logic with control flow and error handling. 
 
The escape is to use composable abstractions. Promises represent future values and let you chain 
steps with then and catch in a flat structure; errors propagate by default, so you don't have to thread 
error callbacks manually. async/await builds on promises and lets you write sequential async steps 
top-to-bottom with try/catch for errors while still returning promises. Additional techniques include 
extracting named functions instead of inline anonymous ones, using Promise.all to run independent 
tasks in parallel, wrapping callback-style APIs with Promise constructors (promisify), and centralizing 
error handling so you have one place to log and recover. 
 
Examples 
 
```js 
// From nested callbacks to promise chaining 
fetch(url1) 
  .then((r1) => r1.json()) 
  .then((d1) => fetch(url2 + d1.id)) 
  .then((r2) => r2.json()) 
  .then((d2) => console.log(d2)) 
  .catch((err) => console.error(err)); 
``` 
 
```js 
// The same flow with async/await 
async function run() { 
  try { 


---

 
137
    const r1 = await fetch(url1); 
    const d1 = await r1.json(); 
    const r2 = await fetch(url2 + d1.id); 
    const d2 = await r2.json(); 
    console.log(d2); 
  } catch (e) { 
    console.error(e); 
  } 
} 
``` 
 
```js 
// Promisify a callback API 
function delay(ms) { 
  return new Promise((res) => setTimeout(res, ms)); 
} 
``` 
 
Common misconceptions 
 
1. async/await eliminates promises. It is syntax on top of promises; they remain fundamental. 
2. Promises are always sequential. Promise.all, allSettled, and any provide parallel coordination. 
3. Callbacks are obsolete. They are still used in many APIs; promisify or wrap them for composition. 
 
Practice questions 
 
1. Theory: Describe three concrete problems with deeply nested callbacks and how promises 
mitigate each. 
2. Coding: Convert a "pyramid" of setTimeout calls into a promise chain with a delay(ms) helper. 
3. Coding: Rewrite a two-step dependent async flow using async/await with proper try/catch and a 
finally clean-up. 
 


---

 
138
Explain promises and how they work 
Explain promises and how they work 
 
In JavaScript, a Promise is a special object that represents the result of an operation that hasn't 
finished yet but will finish in the future — either successfully or with an error. It acts as a placeholder 
for a value that will be available later. Think of it as a box that starts empty but is guaranteed to 
eventually contain either a result or a reason why it failed. This idea lets JavaScript handle long-
running tasks (like fetching data from a server) without freezing the browser or blocking other code 
from running. 
 
A promise has three states: 
 
1. Pending — it's still working on the task and hasn't produced a result yet. 
2. Fulfilled (resolved) — the task completed successfully and produced a value. 
3. Rejected — the task failed and produced an error or reason. 
 
Once a promise moves from pending to either fulfilled or rejected, it stays settled — it never changes 
again. You can attach handlers to a promise to know when that happens. The `then()` method lets 
you specify what should happen when the promise fulfills, and `catch()` specifies what to do if it 
rejects. The `finally()` method runs no matter what, useful for cleanup (like hiding a loading spinner). 
 
Under the hood, JavaScript schedules these `then` and `catch` callbacks to run as microtasks, 
meaning they execute right after the current synchronous code finishes but before other queued 
tasks like timers. This guarantees consistent ordering: your promise handlers always run after the 
code that created them, even if the promise resolves instantly. 
 
Here's a simple example: 
 
```js 
const promise = new Promise((resolve, reject) => { 
  setTimeout(() => resolve("Data loaded"), 1000); 
}); 
 
promise 


---

 
139
  .then((result) => console.log(result)) // runs after 1s: "Data loaded" 
  .catch((error) => console.error(error)) 
  .finally(() => console.log("Done")); 
``` 
 
When this code runs, the `Promise` constructor starts an asynchronous operation (simulated by 
`setTimeout`). After 1 second, it calls `resolve`, marking the promise as fulfilled. JavaScript then calls 
the function you provided to `then`, passing in the result. Even though the work started earlier, the 
callback runs later, once the main thread is free. 
 
The key strength of promises is chaining. The `then` method itself returns a new promise, allowing 
you to connect multiple asynchronous steps linearly. If a `then` handler returns a plain value, the 
next promise in the chain automatically resolves with that value. If it returns another promise, 
JavaScript waits for that promise to finish before moving on. If a handler throws an error, the next 
promise becomes rejected automatically. This consistent rule is what flattens complex asynchronous 
flows into simple, readable sequences. 
 
Example: 
 
```js 
fetch("/user") 
  .then((response) => response.json()) 
  .then((user) => fetch(`/posts?user=${user.id}`)) 
  .then((response) => response.json()) 
  .then((posts) => console.log(posts)) 
  .catch((err) => console.error("Something went wrong:", err)); 
``` 
 
Each `then` waits for the previous promise to settle before running. Errors in any step skip the rest 
and jump straight to `catch`, simplifying error handling that would otherwise require multiple nested 
callbacks. 
 
Promises also provide combinator methods for working with multiple async tasks: 
 


---

 
140
- `Promise.all([a, b, c])` runs all at once and fulfills when _all_ succeed (or rejects on the first failure). 
- `Promise.allSettled([a, b, c])` waits for all to finish, whether successful or not, returning their 
outcomes. 
- `Promise.race([a, b, c])` settles as soon as _any_ one promise settles (either fulfillment or rejection). 
- `Promise.any([a, b, c])` fulfills on the first success and rejects only if _all_ fail. 
 
For instance: 
 
```js 
const api1 = fetch("/data1"); 
const api2 = fetch("/data2"); 
 
Promise.all([api1, api2]) 
  .then(([r1, r2]) => Promise.all([r1.json(), r2.json()])) 
  .then(([d1, d2]) => console.log("Both done", d1, d2)) 
  .catch((err) => console.error("At least one failed", err)); 
``` 
 
Here, both API requests start together. `Promise.all` waits until both complete, then continues. This is 
efficient because it doesn't run them sequentially — they happen in parallel. 
 
Now, let's understand all this through a real-world analogy. 
Imagine ordering food at a restaurant. You place your order (start an async task), and the waiter gives 
you a token number — that's your promise. The token doesn't contain the food yet; it just represents 
a guarantee that your meal will eventually be ready or the restaurant will tell you it can't be served 
(error). While waiting, you're free to chat or browse your phone — your program isn't blocked. Later, 
when your meal is ready, the kitchen signals fulfillment, and your waiter delivers the result. If they 
run out of ingredients, the promise is rejected and you're informed of the error. The token (promise) 
itself never changes; it only moves from "pending" to "fulfilled" or "rejected." You can even attach 
multiple handlers — maybe one person is waiting for the food (then) and another for the bill (finally). 
 
This analogy helps illustrate that promises aren't about doing tasks faster — they're about managing 
time and coordination. They let your code keep running other tasks while waiting for asynchronous 
operations, without getting tangled in callback pyramids. 
 


---

 
141
In summary: 
 
- A promise starts pending and settles once — either fulfilled or rejected. 
- `then`, `catch`, and `finally` let you handle those outcomes cleanly. 
- Promise chaining turns asynchronous flows into readable sequences. 
- Combinators coordinate multiple async operations in parallel. 
- Promises make asynchronous code predictable, composable, and far easier to reason about. 
 
Examples 
 
```js 
// Basic chaining 
fetch("/data.json") 
  .then((r) => r.json()) 
  .then((data) => data.items) 
  .catch((err) => console.error("failed", err)) 
  .finally(() => console.log("done")); 
``` 
 
```js 
// Combinators 
const a = fetch("/a"); 
const b = fetch("/b"); 
Promise.all([a, b]) 
  .then(([ra, rb]) => Promise.all([ra.json(), rb.json()])) 
  .then(([ja, jb]) => { 
    /* use both */ 
  }) 
  .catch(console.error); 
``` 
 


---

 
142
```js 
// Creating a promise 
function delay(ms) { 
  return new Promise((res) => setTimeout(res, ms)); 
} 
delay(200).then(() => console.log("after 200ms")); 
``` 
 
Common misconceptions 
 
1. A promise can resolve twice. Settle happens once; further resolve/reject calls are ignored. 
2. then runs immediately. Handlers run in the microtask queue after current synchronous work. 
3. Promise.all ignores rejections. It rejects fast on the first rejection; use allSettled to observe all 
outcomes. 
 
Practice questions 
 
1. Theory: Explain how returning a value, returning a promise, and throwing inside then affect the 
next link in the chain. 
2. Coding: Implement a timeout wrapper that rejects if a promise doesn't settle within ms; test it 
with fetch. 
3. Coding: Fetch three URLs in parallel, parse all JSON results, and handle partial failures gracefully 
using allSettled. 
 
 
 


---

 
143
What is async/await and how is it different from 
promises? 
What is async/await and how is it different from promises 
 
async/await is syntax that builds on promises to make asynchronous code read like synchronous 
code. Declaring a function async means it always returns a promise. Inside an async function, await 
pauses that function until the awaited promise settles: if it fulfills, await yields its value; if it rejects, 
await throws that reason. This pause is cooperative—JavaScript's single thread is not blocked; the 
runtime schedules the rest of the async function as a microtask continuation. Errors are handled with 
ordinary try/catch around awaits, and finally works as expected, which makes control flow clearer 
than long then chains for sequential steps. 
 
Despite the different look, the semantics are still promise-based. Awaiting a non-promise converts it 
to an already-fulfilled promise; returning a value from an async function resolves the returned 
promise with that value; throwing creates a rejected promise. For parallel work, start multiple 
promises first and then await them together (e.g., Promise.all). If you write await inside a plain for 
loop with a slow async operation, you serialize the work one-by-one; that's correct when order 
matters but wasteful when tasks are independent. The right pattern is to kick off all tasks, then await 
their combined completion. Understanding these patterns yields readable, efficient async code that 
behaves predictably under error conditions. 
 
Examples 
 
```js 
// Sequential with try/catch 
async function load() { 
  try { 
    const r1 = await fetch("/a"); 
    const a = await r1.json(); 
    const r2 = await fetch("/b?id=" + a.id); 
    const b = await r2.json(); 
    return { a, b }; 
  } catch (e) { 
    console.error(e); 
    throw e; 


---

 
144
  } finally { 
    console.log("done"); 
  } 
} 
``` 
 
```js 
// Parallel start, then await together 
async function loadBoth() { 
  const pa = fetch("/a"); 
  const pb = fetch("/b"); 
  const [ra, rb] = await Promise.all([pa, pb]); 
  const [a, b] = await Promise.all([ra.json(), rb.json()]); 
  return { a, b }; 
} 
``` 
 
```js 
// Convert a .then chain to async/await 
async function getItem() { 
  const r = await fetch("/item"); 
  return r.json(); 
} 
``` 
 
Common misconceptions 
 
1. await blocks the thread. It suspends the async function only; the event loop continues running 
other work. 
2. async functions return plain values. They return promises; use await or then to get the result. 
3. await is a replacement for Promise.all. It is not; use Promise.all for true parallelism when tasks are 
independent. 


---

 
145
 
Practice questions 
 
1. Theory: Describe how await interacts with the microtask queue and why try/catch maps cleanly to 
promise rejection handling. 
2. Coding: Convert a 3-step then chain into an async function with proper error handling and a finally 
block. 
3. Coding: Given an array of URLs, implement (a) sequential fetch with await in a loop and (b) parallel 
fetch with Promise.all—compare behavior and performance. 
 
 
 


---

 
146
What are microtasks and macrotasks? 
Explain microtasks and macrotasks 
 
Modern JavaScript runs on a **single-threaded** event loop. It executes code, handles events and 
renders the UI by processing a queue of tasks one after the other. To keep the browser responsive, 
the runtime splits work into **macrotasks** (also called "tasks") and **microtasks**. 
Understanding the difference helps you predict when your code will run and how it interacts with the 
rest of the page. 
 
### What is a macrotask? 
 
Macrotasks represent the "big" units of work handled by the browser. Each macrotask comes from a 
different source: an entire script block, a callback from an event (click, scroll, etc.), timers like 
`setTimeout()` and `setInterval()`, or I/O such as network responses. The event loop picks one 
macrotask from the queue, runs it to completion (including any synchronous code), then moves on 
to the next one. Because the browser only processes one macrotask at a time, long-running tasks can 
block rendering and make the page feel sluggish. 
 
### What is a microtask? 
 
Microtasks are tiny jobs that must run _after_ the current macrotask finishes but _before_ the 
browser does anything else. They're created by promises (`.then`, `.catch` and `.finally` callbacks) and 
the `queueMicrotask()` API When a macrotask ends, the event loop empties the microtask queue — 
executing each microtask in order — **before** it renders the page or processes the next 
macrotask. This guarantees that promise handlers always run after the code that scheduled them, 
but before other asynchronous events. 
 
### How the event loop orders them 
 
The simplified event loop behaves like this: 
 
1. Run a macrotask (e.g., an event handler or `setTimeout` callback). 
2. When that macrotask finishes, execute **all** pending microtasks. If a microtask queues more 
microtasks, they run before the loop continues 
3. Render updates and handle UI painting. 
4. Repeat with the next macrotask 


---

 
147
 
Because microtasks run **before** rendering and before the next macrotask, they have higher 
priority. This ensures that promise chains update data consistently and avoids race conditions. 
However, a microtask that continually re-queues itself can starve rendering and freeze the UI. 
 
### Example: promises vs timers 
 
Consider the following code: 
 
```js 
console.log("start"); 
setTimeout(() => console.log("timer"), 0); 
Promise.resolve().then(() => console.log("promise")); 
console.log("end"); 
``` 
 
The output is: 
 
``` 
start 
end 
promise 
timer 
``` 
 
`setTimeout` schedules a **macrotask** with a minimum delay of 0 ms. Even though the delay is 
zero, it won't run until after the current macrotask and all microtasks finish. 
`Promise.resolve().then(...)` schedules a **microtask**, so its callback runs immediately after the 
current macrotask completes, and before the `setTimeout` callback.. As a result, "promise" appears 
before "timer". 
 
### Real-world analogy 
 


---

 
148
Imagine a restaurant kitchen. The head chef (the event loop) works on one **order** at a time (a 
macrotask). Between orders he must finish some **quick chores** (microtasks) like wiping the 
counter or plating dishes from finished orders. Even if a new order arrives (`setTimeout`), the chef 
won't start it until he has completed both the current order and all the small chores. Microtasks keep 
the kitchen tidy and ensure the next order starts with a clean slate. 
 
### Summary 
 
- **Macrotasks** include running scripts, event callbacks, timers (`setTimeout`/`setInterval`), and 
I/O. The event loop processes them one by one. 
- **Microtasks** come from promises and `queueMicrotask()`. They run after the current 
macrotask, but before the browser renders and before the next macrotask. 
- The microtask queue is emptied completely before moving on, even if microtasks add more 
microtasks. 
- Using microtasks lets you schedule code to run as soon as possible without blocking user events; 
however, an infinite microtask loop can freeze the page. 
 
### Common misconceptions 
 
1. **"Promises run immediately."** The executor function inside a `new Promise(...)` runs 
synchronously, but the `.then()` and `.catch()` callbacks run as microtasks after the current macrotask 
finishes. 
2. **"`setTimeout(fn, 0)` is synchronous."** Even with a delay of 0ms, `setTimeout` schedules a 
macrotask that runs after microtasks and the current macrotask. 
3. **"Microtasks can be ignored."** Because microtasks run before rendering, forgetting to empty 
the microtask queue (for example, by chaining lots of promises) can delay UI updates and cause 
performance issues. 
 
### Practice questions 
 
1. **Theory:** Describe the order of logs in the following snippet and explain why: 
 
   ```js 
   console.log(1); 
   Promise.resolve().then(() => console.log(2)); 
   queueMicrotask(() => console.log(3)); 


---

 
149
   setTimeout(() => console.log(4), 0); 
   console.log(5); 
   ``` 
 
2. **Coding:** Implement a function `nextTick(fn)` that schedules a callback as a microtask when 
available or falls back to `setTimeout(fn, 0)`. 
 
3. **Coding:** Create a timer that uses `setTimeout` recursively instead of `setInterval`. Why might 
this be preferable when the task takes longer than the interval? 
 
 
 


---

 
150
Explain setTimeout, setInterval, and clearTimeout 
Explain `setTimeout`, `setInterval` and cancellation functions 
 
JavaScript timers let you schedule code to run later or repeatedly. They're essential for tasks like 
animations, polling a server or debouncing user input. The language provides four related functions: 
`setTimeout()`, `setInterval()`, `clearTimeout()` and `clearInterval()`. Understanding how they work 
and when to use each will help you write responsive programs. 
 
### `setTimeout(fn, delay[, ...args])` 
 
`setTimeout()` sets a one-off timer. It takes a callback function, a delay in milliseconds and optional 
arguments to pass to the callback. After at least `delay` milliseconds have elapsed and the current 
call stack is empty, the callback runs. The call returns a numeric **timer ID** which you can pass to 
`clearTimeout()` to cancel the timer. If `delay` is omitted or coerced to `0`, the callback is scheduled 
as soon as possible but still runs after all pending microtasks and the current macrotask. 
 
```js 
const id = setTimeout(() => { 
  console.log("Hello after 1s"); 
}, 1000); 
 
// Cancel the timeout before it runs: 
clearTimeout(id); 
``` 
 
Notes: 
 
- JavaScript runs tasks one at a time using something called the "event loop." When you use 
`setTimeout()` to schedule a function, you're asking the browser to run that function after a certain 
number of milliseconds. However, this waiting time isn't an exact guarantee. If other code is already 
running or if the browser is busy handling things like user events or rendering the page, your timer's 
callback will wait its turn and may fire later than you requested. 
 
Browsers also set a lower limit on how frequently timers can fire when they're nested deeply. After 
you schedule a few timers inside one another (beyond about five levels of nesting), most browsers 


---

 
151
won't let them run faster than roughly every 4 milliseconds. This "clamping" prevents runaway loops 
from bogging down the tab. In practice, it means that when you repeatedly schedule one 
`setTimeout()` from inside another, the callbacks might not run back-to-back; the browser will slow 
them down slightly to keep the page responsive. 
 
- The callback runs asynchronously and does not block subsequent code execution. 
 
### `setInterval(fn, delay[, ...args])` 
 
`setInterval()` repeatedly calls a function with a fixed delay between calls. It returns an **interval 
ID**. The callback continues to run until you call `clearInterval(id)`. Interval IDs share the same pool 
as timeout IDs; you can technically clear an interval with `clearTimeout()`, but it's better practice to 
match functions. 
 
```js 
let count = 0; 
const intervalId = setInterval(() => { 
  console.log("Tick", ++count); 
  if (count === 5) { 
    clearInterval(intervalId); // stop after 5 ticks 
  } 
}, 1000); 
``` 
 
Important considerations: 
 
When you use setInterval() to run a function repeatedly, the browser tries to call that function every 
X milliseconds regardless of how long the function itself takes to finish. If your function takes longer 
to run than the interval you've set, the browser can end up stacking multiple calls on top of each 
other, it might start the next call before the previous one has finished. This can slow your page or 
create unexpected overlaps. A common workaround is to use setTimeout() inside your function to 
schedule the next run only after it has completed. That way, each run waits for the previous one to 
finish before starting the timer again, so nothing overlaps. 
 
Browsers also have built-in limits to prevent timers from running too rapidly. If you have a chain of 
timers (or intervals) nested more than a few levels deep, most browsers will automatically slow them 


---

 
152
down so they don't fire more often than about once every four milliseconds. This "throttling" helps 
keep the page responsive by avoiding a flood of very fast, back-to-back timer events. 
 
### Cancelling timers: `clearTimeout()` and `clearInterval()` 
 
`clearTimeout()` and `clearInterval()` stop scheduled timers. Both functions accept the numeric ID 
returned by `setTimeout` or `setInterval` and cancel any pending execution. If the ID is invalid, 
nothing happens. Timer IDs are stored on the global `window` object, so clearing an interval with 
`clearTimeout()` technically works, but for readability you should use the matching clear function. 
 
```js 
// Schedule and then cancel a one-off timer 
const timeoutId = setTimeout(doSomething, 5000); 
clearTimeout(timeoutId); 
 
// Schedule and then cancel a repeating timer 
const intervalId = setInterval(doSomethingElse, 1000); 
clearInterval(intervalId); 
``` 
 
### Real-world analogy 
 
Think of `setTimeout` as setting a single **alarm clock**: you set it for the future, go about your day, 
and when it rings you perform the task. `setInterval` is like a **repeating alarm** that keeps ringing 
every morning until you switch it off. The IDs returned are like the alarm handles; calling 
`clearTimeout` or `clearInterval` is pressing the off button. 
 
### Summary 
 
- **`setTimeout`** schedules a callback to run once after a delay. It returns an ID used to cancel the 
timer. 
- **`setInterval`** schedules a callback to run repeatedly with a fixed delay between executions and 
returns an ID. Use `clearInterval` to stop it. 


---

 
153
- For better control over periodic tasks (especially when the task itself takes time), prefer a recursive 
`setTimeout` over `setInterval`. 
- **`clearTimeout`** and **`clearInterval`** cancel timers. Passing an invalid ID does nothing. 
- Timers execute asynchronously; even a delay of 0 ms doesn't make the callback synchronous. 
 
### Common misconceptions 
 
1. **"`setTimeout(fn, 0)` runs immediately."** A zero delay still defers execution until after the 
current call stack and microtasks are finished. 
2. **"`setInterval` is always precise."** Intervals don't compensate for execution time; if the 
callback takes longer than the interval, calls can overlap or drift. Use recursive timeouts when 
accuracy matters. 
3. **"You can only cancel a timeout with `clearTimeout`."** While timeouts and intervals share an 
internal ID pool, mixing clear functions works but is bad practice. 
 
### Practice questions 
 
1. **Theory:** Why might repeated calls with `setInterval` drift over time? How does recursive 
`setTimeout` alleviate this? 
2. **Coding:** Write a function `delay(ms)` that returns a promise and resolves after `ms` 
milliseconds using `setTimeout`. 
3. **Coding:** Implement a countdown from 10 to 0 that prints a number every second and then 
prints "go!" using a timer. Include a button to cancel the countdown with `clearInterval`. 
 
 
 


---

 
154
What is debouncing and throttling? 
Explain debouncing and throttling 
 
Web pages often listen to frequent events such as `resize`, `scroll` and `keyup` also multiple user 
initiateed events like clicks. Without control, handlers for these events can fire dozens of times per 
second, causing performance issues or unnecessary network requests. **Debouncing** and 
**throttling** are two patterns for rate-limiting function calls. They serve similar goals but behave 
differently. 
 
### Debouncing 
 
Debouncing delays a function call until a certain amount of time has passed since the last invocation. 
When an event triggers repeatedly, the debounce wrapper resets its timer each time; only when no 
new events occur during the wait period does it finally call the function. This technique reduces the 
number of calls by ensuring the function executes **once** after a burst of activity【
52406376895244†L118-L128】. Common use-cases include auto-saving form data or making API 
requests after a user stops typing. 
 
Example debounce implementation: 
 
```js 
function debounce(fn, delay) { 
  let timerId; 
  return (...args) => { 
    clearTimeout(timerId); 
    timerId = setTimeout(() => fn.apply(this, args), delay); 
  }; 
} 
 
const searchInput = document.getElementById("search"); 
searchInput.addEventListener( 
  "input", 
  debounce(() => { 
    // This runs only after the user stops typing for 300 ms 


---

 
155
    performSearch(searchInput.value); 
  }, 300) 
); 
``` 
 
**Advantages:** Debouncing reduces resource consumption by preventing unnecessary calls. 
**Disadvantages:** It introduces a delay before the action runs; the function won't execute until the 
user stops triggering events. 
 
### Throttling 
 
Throttling ensures that a function runs at most once per specified interval. When events occur more 
frequently than the limit, extra calls are ignored or delayed. Unlike debouncing, throttling does not 
wait for the activity to stop — it guarantees regular execution (e.g., every 100 ms) regardless of how 
many events fire. Throttling is useful for events like `scroll` or `mousemove` where you need periodic 
updates (such as updating a progress bar or showing scroll position). 
 
A basic throttle implementation can use a flag and timestamps: 
 
```js 
function throttle(fn, limit) { 
  let lastCall = 0; 
  return (...args) => { 
    const now = Date.now(); 
    if (now - lastCall >= limit) { 
      lastCall = now; 
      fn.apply(this, args); 
    } 
  }; 
} 
 
window.addEventListener( 
  "scroll", 


---

 
156
  throttle(() => { 
    console.log("Scroll position:", window.scrollY); 
  }, 100) 
); 
``` 
 
This version executes the callback immediately and then prevents further calls until the time window 
has passed. A more advanced implementation might schedule the final call after the event burst 
ends. 
 
**Advantages:** Throttling enforces a consistent rate of execution. It can keep UI updates smooth 
under heavy event load. **Disadvantages:** It may skip intermediate events; if the interval is too 
long, the handler might miss important changes. 
 
### Choosing between them 
 
Both techniques limit how often a function runs: 
 
- Use **debounce** when you want to wait for a "pause" in activity — for example, delaying an API 
call until the user stops typing. 
- Use **throttle** when you want periodic updates regardless of continuous activity — for example, 
updating the scroll position every 100 ms during a scroll. 
 
### Real-world analogies 
 
- **Debouncing** is like waiting until a friend finishes speaking before responding. If they keep 
talking, you hold off; you only reply once they pause. 
- **Throttling** is like setting a timer to check your phone every minute. Even if you get dozens of 
notifications in between, you only look when the minute timer goes off. 
 
### Summary 
 
Debouncing waits for a quiet period before running a function. Each time the button is clicked, a 
timer is started (or restarted). If no additional clicks happen during that timer window (say 3 


---

 
157
seconds), the API call executes. If another click occurs before the delay elapses, the timer resets and 
the countdown starts over. This ensures that the API is called only once after the user has stopped 
clicking. 
 
Throttling allows the action to happen immediately, but then suppresses additional triggers for a set 
period. On the first click, the API call runs right away. For the next few seconds (again, say 3 seconds), 
any further clicks are ignored. Only after that interval has passed will a new click result in another API 
call. This guarantees that the function is called at most once per interval, regardless of how often the 
user clicks. 
 
Debounce: Imagine clicking a button that triggers an API call. When the function is debounced, a 
delay is introduced between the moment the user interacts and the moment the call actually fires. 
For example, if you set a delay of three seconds, the API call will execute only after three seconds 
have passed without any further clicks. If the user clicks again before those three seconds are up, the 
delay resets, and the function waits for another full three seconds from the most recent click before 
firing. 
 
Throttle: With throttling, the first click triggers the API call immediately, just as it normally would. 
However, subsequent clicks are ignored until a set period has elapsed. Continuing the three-second 
example, after the initial call runs, no additional calls will occur until three seconds have passed. Only 
then will another click trigger a new API call. 
 
- Debouncing reduces call count but adds delay. Throttling provides regular updates but may drop 
events. 
- Both patterns are typically implemented using `setTimeout` and timestamps. 
 
### Common misconceptions 
 
1. **"Debounce and throttle are the same."** They both rate-limit calls, but debounce waits for 
inactivity while throttle guarantees periodic execution. 
2. **"Debounce functions always improve UX."** Over-debouncing can make an interface feel 
unresponsive, because the action waits until the user stops for long enough. 
3. **"Throttle always catches every event."** Throttling discards events between intervals; if the 
interval is too long, important changes may be skipped. 
 
### Practice questions 
 


---

 
158
1. **Coding:** Write your own `debounce` function that accepts a callback and a delay, and 
demonstrate it with a `keyup` handler that sends an API request only when the user stops typing. 
2. **Coding:** Implement a `throttle` function that ensures a callback fires once every 200 ms, and 
test it on a `scroll` event. 
3. **Theory:** Describe a scenario where debouncing would be inappropriate but throttling would 
work well, and vice versa. 
 
 
 


---

 
159
What is event bubbling and capturing? 
Explain event bubbling and capturing 
 
When you click, type or otherwise interact with elements on a page, the browser fires an "event" 
that moves through the document tree. How and where you respond to that event depends on 
understanding the two propagation phases: 
 
Capturing (also called trickling) - The event is dispatched from the top of the DOM hierarchy (window 
or document) and moves downward through each ancestor element until it reaches the actual 
target. Listeners registered with addEventListener() using {capture: true} fire in this phase, starting 
from the outermost ancestor and ending with the target. Capturing is disabled by default because 
most code relies on bubbling, but it's available when you need to intercept an event before it hits its 
destination. 
 
Target phase - Once the event reaches the element that originally triggered it (for example, the 
button you clicked), any event listeners attached directly to that element run, regardless of whether 
they were registered for capturing or bubbling. 
 
Bubbling - After the target has processed the event, it bubbles back up the DOM tree. The event 
moves from the target's parent up to the root, invoking listeners along the way. This is the default 
behavior for most event types. When you call addEventListener() without options, you're registering 
a listener that will fire during this bubbling phase. 
 
Understanding these phases allows you to decide where to attach your handlers: 
 
Normal use case (bubbling): Attach a listener on a parent element to handle events from many 
children (a technique known as event delegation). For example, a click on a list item bubbles up to 
the <ul>, and a click handler on the <ul> can inspect event.target to determine which <li> was 
clicked. 
 
Capturing use case: Attach a listener with {capture: true} when you need to act before the event 
reaches the target. This can be useful for intercepting keyboard shortcuts or gestures at the 
document level or for implementing custom UI controls that need to block events from hitting 
certain elements. 
 
Several other points are important for both beginners and experienced developers: 
 


---

 
160
You can stop an event from continuing along its propagation path by calling event.stopPropagation(). 
To prevent other handlers on the same element from running as well, call 
event.stopImmediatePropagation(). 
 
The properties event.target and event.currentTarget differ: event.target is the element where the 
event originated, while event.currentTarget is the element whose listener is currently executing. 
 
Not all events bubble (e.g. focus and blur do not), and some behave inconsistently across older 
browsers, so always test your code in the environments you support. 
 
By controlling where in the capture/bubble phases your handlers run and understanding how the 
event travels, you can build more efficient and responsive UIs, whether you're just starting out or 
writing complex component systems. 
 
### Bubbling in action 
 
Consider nested elements: 
 
```html 
<div id="outer"> 
  <button id="inner">Click me</button> 
</div> 
``` 
 
If you add click handlers on both elements: 
 
```js 
document 
  .getElementById("outer") 
  .addEventListener("click", () => console.log("outer")); 
document 
  .getElementById("inner") 
  .addEventListener("click", () => console.log("inner")); 


---

 
161
``` 
 
Clicking the button logs: 
 
``` 
inner 
outer 
``` 
 
The click originates at `#inner`, triggers its handler, then bubbles up to `#outer` and runs the outer 
handler. 
 
### Capturing 
 
Capturing is the mirror image of bubbling. The event starts at the top of the tree and flows down to 
the target, invoking handlers registered for the capture phase. To attach a listener during capture, 
provide `{ capture: true }`: 
 
```js 
document 
  .getElementById("outer") 
  .addEventListener("click", () => console.log("outer capture"), { 
    capture: true, 
  }); 
document 
  .getElementById("inner") 
  .addEventListener("click", () => console.log("inner")); 
``` 
 
Now clicking the button logs: 
 
``` 


---

 
162
outer capture 
inner 
``` 
 
The capturing handler runs before the target and bubbling handlers because the event travels down 
the tree first. 
 
### Controlling propagation 
 
Inside an event handler you can stop the event from continuing along the propagation path: 
 
- `event.stopPropagation()` halts further propagation through both capturing and bubbling phases. 
- `event.stopImmediatePropagation()` additionally prevents other handlers on the same element 
from running. 
 
Stopping propagation is useful when you don't want parent elements to receive the event (for 
example, clicking inside a modal dialog should not close the underlying page). 
 
### Real-world analogy 
 
Imagine dropping a stone into a pond. The initial splash is the **target phase**. Ripples that travel 
outward to the shore resemble **bubbling**: the disturbance spreads from the point of impact to 
the edges. Now imagine someone at the shore sending a vibration back toward the point where the 
stone hit — that's **capturing**: energy travels from the outside in. 
 
### Summary 
 
- DOM events have three phases: capturing (from root down), target, and bubbling (from target up). 
- Most event listeners fire during bubbling by default. Pass `{ capture: true }` to listen during the 
capturing phase. 
- `stopPropagation()` and `stopImmediatePropagation()` let you prevent an event from continuing 
along its path. 
- Understanding propagation helps with advanced patterns like **event delegation** and preventing 
unwanted side effects. 


---

 
163
 
### Common misconceptions 
 
1. **"Events only bubble."** Many events bubble by default, but capturing exists and is enabled by 
passing `{ capture: true }`. 
2. **"`event.target` equals `event.currentTarget`."** `event.target` is the element where the event 
originated; `event.currentTarget` is the element whose listener is currently executing. They differ 
when handling bubbling events on ancestors. 
3. **"Bubbling can't be stopped."** Calling `event.stopPropagation()` halts the event's travel up 
(and down) the DOM tree. 
 
### Practice questions 
 
1. **Theory:** In what order do the following handlers fire when capturing and bubbling are both 
used? Explain why: 
 
   ```html 
   <div id="parent"> 
     <button id="child">Click</button> 
   </div> 
 
   <script> 
     parent.addEventListener("click", () => console.log("parent capture"), { 
       capture: true, 
     }); 
     parent.addEventListener("click", () => console.log("parent bubble")); 
     child.addEventListener("click", () => console.log("child")); 
   </script> 
   ``` 
 
2. **Coding:** Build a modal dialog component. Clicking outside the dialog should close it; clicking 
inside should stop propagation so the backdrop doesn't close. 


---

 
164
3. **Coding:** Create a custom event and dispatch it on a child element. Add listeners at different 
phases and log `event.target` and `event.currentTarget` to see how they differ. 
 
 
 


---

 
165
How does event delegation work? 
Explain how event delegation works 
 
Attaching event listeners to every element in a list can be inefficient, especially when the list is long 
or dynamic. **Event delegation** solves this problem by taking advantage of event bubbling: 
instead of listening on each child element, you attach a single listener on a common ancestor. When 
an event bubbles up, you check which child triggered it and handle it appropriately. This approach 
reduces the number of handlers and works for elements added later. 
 
### Why delegation works 
 
When a user interacts with an element, the event travels up through its ancestors during the 
bubbling phase. Because of this, a handler on a parent element can "see" events from its children. In 
a delegated handler you inspect `event.target` (the original element that fired the event) and decide 
whether to respond. You often use `element.closest()` to ensure the target matches the selector you 
care about. 
 
### Basic example: highlighting table cells 
 
Suppose you have a table with many cells: 
 
```html 
<table id="data-table"> 
  <tr> 
    <td>Cell A</td> 
    <td>Cell B</td> 
  </tr> 
  <tr> 
    <td>Cell C</td> 
    <td>Cell D</td> 
  </tr> 
  <!-- More rows... --> 
</table> 


---

 
166
``` 
 
Instead of adding a click listener on each `td`, you can delegate: 
 
```js 
const table = document.getElementById("data-table"); 
 
table.addEventListener("click", (event) => { 
  // Find the nearest td; ignore clicks outside cells 
  const cell = event.target.closest("td"); 
  if (!cell || !table.contains(cell)) return; 
 
  // Remove existing highlight 
  table 
    .querySelectorAll(".selected") 
    .forEach((td) => td.classList.remove("selected")); 
  cell.classList.add("selected"); 
}); 
``` 
 
Because the listener is on the `<table>`, it handles clicks on any existing or future `<td>` elements. 
Calling `closest('td')` ensures that a click on a nested element inside the cell still resolves to the cell 
itself. 
 
### Delegation with data attributes 
 
Event delegation also makes it easy to build component APIs. For example, a menu might contain 
buttons with `data-action` attributes indicating what to do: 
 
```html 
<ul id="menu"> 
  <li><button data-action="save">Save</button></li> 


---

 
167
  <li><button data-action="load">Load</button></li> 
  <li><button data-action="delete">Delete</button></li> 
</ul> 
``` 
 
```js 
document.getElementById("menu").addEventListener("click", (event) => { 
  const button = event.target.closest("button"); 
  if (!button) return; 
  const action = button.dataset.action; 
  switch (action) { 
    case "save": 
      saveFile(); 
      break; 
    case "load": 
      loadFile(); 
      break; 
    case "delete": 
      deleteFile(); 
      break; 
  } 
}); 
``` 
 
Adding new actions later requires only new HTML. The single listener on `<ul>` handles all current 
and future buttons. 
 
### Benefits of event delegation 
 
- **Performance:** Fewer listeners reduce memory usage and avoid attaching thousands of 
handlers to similar elements. 


---

 
168
- **Dynamic content:** Elements created after the page loads are still handled, because the parent 
listener continues to receive events. 
- **Simpler management:** One handler centralizes logic; you don't need to add or remove 
listeners when elements appear or disappear. 
 
### Real-world analogy 
 
Imagine a party where guests bring their own cups. Instead of stationing a waiter at every table to 
collect empty cups, you place a single bin near the exit. As guests leave (events bubble up), they drop 
their cups into the bin (the delegated handler). There's no need to monitor each seat. 
 
### Summary 
 
- **Event delegation** uses event bubbling to handle events from multiple children with one parent 
listener. 
- Inside the delegated handler, inspect `event.target` or use `closest()` to identify the relevant child. 
- Delegation is great for lists, tables, menus and any dynamic content that may change after initial 
rendering. 
 
### Common misconceptions 
 
1. **"Delegation only works for click events."** Delegation works for any event that bubbles (e.g. 
`input`, `mouseover`). 
2. **"You must use capturing to delegate."** Delegation relies on bubbling; capture phase isn't 
needed. 
3. **"Delegation is slower."** On the contrary, delegating reduces overhead by attaching fewer 
listeners. 
 
### Practice questions 
 
1. **Coding:** Create a list with "Delete" buttons next to each item. Use event delegation on the list 
`<ul>` to handle clicks and remove the corresponding `<li>`. 
2. **Coding:** Build a tab component where clicking a tab activates its panel. Use delegation so new 
tabs added later still work. 


---

 
169
3. **Theory:** Explain why delegation fails on events that do not bubble (e.g., `focus`). How can you 
handle those events on many elements? 
 
 
 


---

 
170
Difference between document, window, and this in 
different contexts 
Difference between `document`, `window` and `this` in different contexts 
 
JavaScript in the browser exposes several objects representing different parts of the environment. 
Two of the most important are the **`window`** and **`document`** objects, and the keyword 
**`this`** behaves differently depending on how a function is called. Mixing them up can lead to 
subtle bugs. Let's clarify their roles. 
 
### `document`: the page itself 
 
The `document` object represents the web page loaded in the browser. It is part of the DOM 
(Document Object Model) and provides methods and properties to access and manipulate HTML 
elements. You can select elements by ID, class, tag name or CSS selector and modify them at 
runtime. For example, `document.getElementById('title')` returns an element with the given ID, and 
`document.querySelectorAll('.card')` returns a list of elements with the class `card`. Internally, 
`document` is accessible via `window.document`, but you rarely prefix it. The DOM defines a logical 
structure for documents, allowing us to create, manipulate or delete elements and attributes. 
 
### `window`: the browser or tab 
 
The `window` object represents the browser window or frame itself. It sits at the top of the Browser 
Object Model (BOM) and exposes features like screen size, history and location. Properties such as 
`window.innerWidth`, `window.location`, `window.history` and methods like `alert()`, `setTimeout()`, 
`open()` or `close()` belong to the `window` object. In a browser, all global variables and functions 
become properties of `window`. For instance, declaring `var x = 5;` makes `window.x === 5` true. This 
is why you can often omit `window.` when calling `alert()` or `setTimeout()`. Note that the BOM isn't 
standardized, so some properties may vary between browsers. 
 
### The value of `this` 
 
`this` is a special keyword whose value is determined by how a function is invoked. It does **not** 
point to the function itself, but to the object on which the function was called. 
 
- **Global context:** Outside any function, `this` refers to the global object (`window` in browsers) 
in non-strict mode. In strict mode, `this` in the global scope is `undefined`. 


---

 
171
- **Simple function call:** When a function is called without an explicit receiver, `this` is the global 
object in non-strict mode, or `undefined` in strict mode. 
- **Object method:** When a function is invoked as a method of an object (`obj.method()`), `this` is 
bound to that object. 
- **DOM event handler:** In an event handler added via `element.addEventListener`, `this` is set to 
the element on which the event fired. In inline event handlers (e.g., `onclick="..."`), `this` also refers 
to the element. 
- **Arrow functions:** Arrow functions do not have their own `this`; instead they capture the `this` 
value from the surrounding lexical scope. This makes them unsuitable for event handlers if you rely 
on `this` pointing to the element. 
 
### Examples 
 
```js 
// Global context 
console.log(this === window); // true in non-strict mode 
 
function show() { 
  console.log(this); 
} 
show(); // logs 'window' (or 'undefined' in strict mode) 
 
const person = { 
  name: "Ada", 
  greet() { 
    console.log(this.name); 
  }, 
}; 
person.greet(); // 'Ada'; 'this' refers to the object 
 
document.getElementById("btn").addEventListener("click", function () { 
  console.log(this === document.getElementById("btn")); // true; 'this' is the element 
}); 


---

 
172
 
document.getElementById("btn").addEventListener("click", () => { 
  console.log(this === window); // true; arrow functions inherit 'this' from the outer scope 
}); 
``` 
 
### Real-world analogy 
 
Think of `document` as the **blueprint** for a house and its contents. It lists every room and piece 
of furniture and allows you to remodel the house on the fly. The `window` is the **actual house** 
— the physical container that holds the blueprint and provides features like doors (navigation) and 
windows (screen properties). The keyword `this` is like a pronoun whose meaning depends on who is 
speaking — it refers to the current "actor" at the moment the code runs. 
 
### Summary 
 
- `document` represents the loaded web page and provides methods to access and modify its 
elements. 
- `window` represents the browser window and exposes global functions, timer APIs and 
browser-specific features. 
- `this` is bound at call time and varies depending on whether the function is called globally, as a 
method, as a constructor, or as an event handler. 
- Arrow functions capture `this` from their lexical scope instead of creating a new binding. 
 
### Common misconceptions 
 
1. **"`document` and `window` are the same."** While `document` is a property of `window`, it 
specifically refers to the DOM of the page, whereas `window` includes the DOM plus browser APIs 
like `alert()` and `location`. 
2. **"`this` always refers to the object where a function is defined."** `this` depends on how a 
function is called, not where it's defined. 
3. **"Arrow functions make `this` predictable everywhere."** Arrow functions inherit `this` from 
their outer scope; using them in event listeners or object methods may not give you the element or 
object you expect. 
 


---

 
173
### Practice questions 
 
1. **Coding:** Write a function that logs `this` and call it: (a) globally; (b) as a method of an object; 
(c) as an event handler. Observe how `this` changes. 
2. **Coding:** Create a custom object with a method that references `this`. Bind that method to 
another object using `.call()` or `.apply()` and observe the output. 
3. **Theory:** Why is it generally unnecessary to write `window.alert()` instead of `alert()` in 
browser code? What happens to `this` if you enable strict mode? 
 
 
 


---

 
174
Explain DOM vs BOM 
Explain DOM vs BOM 
 
JavaScript runs in the context of a web browser, which provides two related but distinct models: the 
**Document Object Model (DOM)** and the **Browser Object Model (BOM)**. Both expose 
objects and methods to your scripts, but they serve different purposes. 
 
### DOM (Document Object Model) 
 
The DOM is a **standardized programming interface** that represents an HTML or XML document 
as a tree of nodes. When an HTML document is loaded, the browser parses it and creates a DOM 
tree. JavaScript can traverse this tree, create new elements, remove existing ones, and update 
attributes and styles. Functions like `getElementById()`, `querySelector()`, `appendChild()` and 
properties like `document.body` or `document.title` allow you to manipulate the structure and 
content of the page. As GeeksforGeeks notes, the DOM defines the logical structure of documents 
and provides methods to access and modify tags, IDs, classes and attributes. 
 
### BOM (Browser Object Model) 
 
The BOM refers to the **collection of objects provided by the browser** that let JavaScript interact 
with the browser itself rather than the document. Unlike the DOM, there is no formal standard for 
the BOM, so implementations vary slightly among browsers. The root of the BOM is the `window` 
object. It exposes properties like `navigator` (information about the browser), `location` (current 
URL), `history` (the user's navigation history), `screen` (screen size and color depth), and `document`. 
The BOM also includes methods for controlling windows such as `open()`, `close()`, `moveTo()` and 
`resizeTo()`. For example: 
 
```js 
// Using the BOM 
console.log(window.location.href); // current URL 
console.log(window.navigator.userAgent); // browser user agent string 
const newWin = window.open( 
  "https://example.com", 
  "_blank", 
  "width=400,height=300" 
); 


---

 
175
// ... later 
newWin.close(); 
``` 
 
### Key differences 
 
 
### Real-world analogy 
 
Think of a website as a **book** in a library. The DOM is the table of contents and the pages of the 
book; it represents the structure of the content and lets you read or edit chapters. The BOM is the 
**building** that houses the library — it includes the doors, windows and elevators. It lets you open 
a new room (tab), check the building's address (URL) or find out the size of the reading rooms 
(screen). 
 
### Summary 
 
- The **DOM** is a standardized API for representing and interacting with documents. It lets you 
create, access and modify HTML elements and their attributes. 
- The **BOM** is a browser-specific collection of objects that let you interact with the environment: 
windows, frames, navigation history and screen information. 
- They complement each other: `document` (DOM) is a property of `window` (BOM), but the DOM 
focuses on the page content while the BOM focuses on the container. 
 
### Common misconceptions 
 
1. **"The BOM is part of the DOM."** The BOM includes `window` and related objects which exist 
outside the document. The DOM deals only with the document's content and structure. 
2. **"The BOM follows a standard API."** There is no formal specification for the BOM; browser 
vendors implement it differently, so not all methods behave identically across browsers. 


---

 
176
3. **"You can manipulate the page through the BOM alone."** While the BOM provides access to 
high-level browser features, it does not provide methods to access or change specific HTML 
elements. 
 
### Practice questions 
 
1. **Coding:** Use the DOM to create a new `<div>` element, set its text content, append it to the 
body and then use the BOM to open a new tab displaying its inner text. 
2. **Theory:** List three properties or methods available on `window` but not on `document`. What 
are their purposes? 
3. **Theory:** Why can't you rely on the BOM for consistent behavior across browsers? What 
precautions should you take when using methods like `window.open()`? 
 
 
 


---

 
177
What are Web APIs? 
Explain Web APIs 
 
At its core, JavaScript is a programming language that manipulates numbers, strings, objects and 
arrays. But when you run JavaScript in a web browser you get access to a rich set of **Web APIs** — 
additional objects and functions built into the browser that let you do things like manipulate the 
DOM, fetch data over the network, store data locally and interact with device hardware. These APIs 
are not part of the JavaScript language itself; they are provided by the host environment. 
 
### What are APIs? 
 
An **Application Programming Interface (API)** is a set of constructs made available in a 
programming environment to perform complex tasks more easily. APIs abstract away underlying 
implementation details and expose a convenient interface. For example, instead of writing low-level 
code to process audio, you can call the Web Audio API which wraps that complexity. 
 
### Browser APIs vs third-party APIs 
 
Web APIs fall into two broad categories: 
 
- **Browser (built-in) APIs** are integrated into the browser. They let you access data from the 
browser and the computer (e.g., geolocation, camera, file system) and perform tasks like drawing 
graphics or storing data offline. The Web Audio API, for instance, provides constructs to manipulate 
audio in the browser. 
- **Third-party APIs** are delivered by external services such as Google Maps or Facebook and 
allow you to integrate their functionality into your app. Unlike browser APIs, you need to load these 
via external scripts or modules. 
 
### Relationship between JavaScript, APIs and other tools 
 
MDN explains that client-side programming typically involves several layers: **JavaScript** (the core 
language), **browser APIs** on top of it, **third-party APIs**, and optionally libraries or 
frameworks. JavaScript by itself can't, for example, fetch a resource over the network; it needs the 
Fetch API. Libraries like React and frameworks like Angular build on these APIs to provide higher-level 
abstractions. 
 


---

 
178
### Common categories of browser APIs 
 
Modern browsers provide a huge number of APIs. Here are some of the most common categories: 
 
Here is the table reformatted for consistent alignment: 
 
 
### Example: Fetching data with the Fetch API 
 
```js 
// Fetch JSON data from a server 
fetch("https://api.example.com/data") 
  .then((response) => response.json()) 
  .then((data) => { 
    console.log("Received data:", data); 
  }) 
  .catch((err) => console.error("Request failed:", err)); 
``` 
 
The `fetch()` function is part of the Fetch API. It returns a promise that resolves to a `Response` 
object; calling `response.json()` parses the JSON body. Behind the scenes, the browser handles 
networking and security. Without this API you'd need to rely on older, less consistent interfaces. 
 
### Real-world analogy 
 
Web APIs are like **power outlets** in a house. The JavaScript language itself is the wiring and 
switches; the outlets (APIs) let you plug in powerful appliances like vacuum cleaners (audio/video), 
ovens (file access) or televisions (graphics) without worrying about how electricity is generated. 
Different rooms (categories) offer different outlets tailored to specific devices. 
 
### Summary 


---

 
179
 
- Web APIs are sets of functionality provided by the browser or third parties that extend what 
JavaScript can do. 
- **Browser APIs** expose features like DOM manipulation, network requests, graphics, media, 
device access and storage. 
- **Third-party APIs** offer services from external providers such as maps, payments or social 
features. 
- APIs sit on top of JavaScript; libraries and frameworks build on top of APIs to create higher-level 
abstractions. 
 
### Common misconceptions 
 
1. **"Web APIs are part of JavaScript."** APIs are provided by the browser or external services; 
they are not defined by the ECMAScript language specification. 
2. **"All APIs require a network."** Many browser APIs (DOM, Canvas, Web Audio) operate entirely 
locally and don't involve network requests. 
3. **"Using a library replaces Web APIs."** Libraries and frameworks build on Web APIs. Even when 
using React or jQuery, under the hood they still call DOM methods or Fetch. 
 
### Practice questions 
 
1. **Coding:** Use the Geolocation API to get the user's current latitude and longitude and display it 
on the page. Handle errors if the user denies permission. 
2. **Coding:** Build a simple drawing app using the Canvas API that lets the user draw lines with the 
mouse. 
3. **Theory:** Explain the difference between a browser API like `localStorage` and a third-party API 
like the Google Maps API. What extra steps are needed to use the latter? 
 
 
 


---

 
180
What is localStorage, sessionStorage, and cookies? 
Explain `localStorage`, `sessionStorage` and cookies 
 
Web applications often need to remember information between page loads. Browsers provide 
several mechanisms to store data on the client side: **cookies**, **sessionStorage** and 
**localStorage**. Each has different characteristics regarding scope, lifetime, size and how data 
travels. 
 
### Cookies 
 
Cookies are small pieces of data (name/value pairs) that a server sends to the browser. The browser 
stores cookies and sends them back to the same server with subsequent requests. Cookies allow 
web applications to remember state across HTTP requests, which are otherwise stateless. A typical 
use case is session management: after a user signs in, the server sets a cookie containing a session 
ID; on later requests the browser includes that cookie so the server knows the user is authenticated. 
Cookies are also used for personalization and tracking. 
 
Key properties of cookies: 
 
- **Size and number limits:** Browsers restrict the number of cookies per domain and limit each 
cookie to around 4KB. 
- **Automatic transmission:** Cookies are sent with every HTTP request to their associated domain, 
which can impact performance on slow connections. 
- **Expiration:** Cookies can be set with an `Expires` or `Max-Age` attribute to persist for a given 
time. Without those attributes they are **session cookies** and are deleted when the browser 
session ends. 
- **Access:** In JavaScript you can read and write cookies using `document.cookie`, but they are not 
as straightforward to manage compared to Web Storage. 
 
### Web Storage API: `sessionStorage` and `localStorage` 
 
The Web Storage API provides a simpler key/value storage mechanism than cookies. Data stored via 
Web Storage never travels to the server; it stays entirely on the client. Two separate storage areas 
exist per origin: 
 


---

 
181
- **`sessionStorage`** is scoped to the **browser tab** and **origin**. Each tab (and its iframes) 
gets its own session storage. Closing the tab clears the data. Data is not shared across tabs or 
browser windows. You access it via `window.sessionStorage`. 
- **`localStorage`** is scoped to the **origin** only. All pages from the same origin share the same 
storage, and the data persists even when the browser is closed and reopened. You access it via 
`window.localStorage`. 
 
Both return a `Storage` object with methods: 
 
```js 
localStorage.setItem("name", "Ada"); // store 
const value = localStorage.getItem("name"); // retrieve 
localStorage.removeItem("name"); // delete one item 
localStorage.clear(); // delete all items 
 
// sessionStorage works similarly 
sessionStorage.setItem("counter", "1"); 
``` 
 
PLEASE NOTE IMPORTANT: 
Choosing among cookies, `sessionStorage` and `localStorage` depends on what you need to store and 
who needs to read it. 
 
**When to use cookies** 
 
- **Server-side needs**: Cookies are automatically included in HTTP requests to their associated 
domain. This makes them suitable for storing session identifiers, authentication tokens or user 
preferences that the server needs to see on each request. 
- **Cross-page or cross-tab persistence**: Cookies persist across tabs and sessions if you set an 
expiration date, so they can maintain login state or language preferences. 
- **Small data**: Because cookies are limited to a few kilobytes each and contribute to the size of 
every request, they should only hold small pieces of information. 
 


---

 
182
Although cookies are often set by the server via the `Set-Cookie` header, client-side scripts can read 
and write them using `document.cookie`. Keep in mind that cookies marked as `HttpOnly` by the 
server cannot be accessed from JavaScript, and sensitive cookies should always be set with the 
`Secure` and `SameSite` attributes to mitigate security risks. 
 
**When to use `sessionStorage`** 
 
- **Per-tab or per-window data**: If you need to store temporary state that is specific to a single 
browser tab—for example, progress through a multi-step form or data that should reset when the 
user closes the tab—`sessionStorage` is ideal. Each tab gets its own storage area, and the data is 
cleared when that tab is closed. 
- **Client-only data**: Use `sessionStorage` for data that the server doesn't need, since it never 
leaves the browser. 
 
**When to use `localStorage`** 
 
- **Persistent client-side data**: `localStorage` retains data across browser sessions. It's well suited 
for things like theme preferences, "remember me" flags, or other settings that should survive a page 
refresh or browser restart. 
- **Larger storage needs**: Browsers typically allow several megabytes of storage via `localStorage`, 
so it can hold more data than cookies. However, it's still best to avoid storing highly sensitive 
information, as any script running on the page can read it. 
 
**Summary of selection criteria** 
 
1. **Does the server need to read it?** Use cookies for data that must accompany every request 
(e.g., session IDs). Use Web Storage for data the server never needs. 
2. **How long should it last?** Use `sessionStorage` for temporary, per-tab data; `localStorage` for 
data that persists until explicitly cleared; cookies for short-term or long-term server-visible data 
depending on their expiration. 
3. **How big is the data?** Cookies are limited to a few kilobytes and should stay small. 
`sessionStorage` and `localStorage` can hold significantly more. 
4. **Security considerations:** Cookies can be protected with `HttpOnly` and `Secure` flags and sent 
over HTTPS, making them suitable for credentials. Data in Web Storage is accessible to any script 
running in that origin, so don't store secrets there. 
 


---

 
183
In practice, it's common to see both client-side and server-side code setting and reading cookies. For 
example, a front-end app might set a cookie to track a non-essential preference or to trigger 
analytics, while the server uses its own cookies for authentication. 
 
Important characteristics: 
 
- **Persistent vs temporary:** `localStorage` persists across sessions; `sessionStorage` lasts until the 
tab or window is closed. 
- **Per-origin isolation:** Storage is partitioned by origin; pages from different domains cannot read 
each other's storage. 
- **Synchronous operations:** Reading and writing to Web Storage are synchronous; large or 
frequent writes can block the main thread. 
- **Capacity:** Browsers typically allow several megabytes of storage, far more than the few 
kilobytes allowed for cookies. 
 
### Comparing cookies, `sessionStorage` and `localStorage` 
 
 
### Real-world analogy 
 
Imagine a hotel. A **cookie** is like a hotel key card that you must present every time you enter 
your room; the hotel (server) issues and recognizes the card to know which room you should access. 
**`sessionStorage`** is like a personal note pad you carry during your stay; it exists only as long as 
you're in the hotel and doesn't leave the building. **`localStorage`** is a storage locker you rent in 
town; it remains yours even when you leave the hotel and come back later. 
 
### Summary 
 
- **Cookies** are small name/value pairs sent to and from the server. They enable sessions, 
personalization and tracking but are limited in size and number. 
- **`sessionStorage`** stores data per tab and origin. It's cleared when the tab closes and isn't 
shared across tabs. 
- **`localStorage`** stores data per origin and persists across browser sessions until explicitly 
cleared. 


---

 
184
- Unlike cookies, data in Web Storage (both session and local) is not sent to the server and can hold 
much more data. 
 
### Common misconceptions 
 
1. **"`localStorage` is secure storage."** Data in Web Storage is accessible to any script on the 
page. Do not store sensitive information (like passwords) there. 
2. **"`sessionStorage` persists across tabs."** Each tab has its own session storage; closing the tab 
deletes its data. 
3. **"Cookies can hold large amounts of data."** Each cookie is limited to a few kilobytes and 
browsers limit the number of cookies per domain. 
 
### Practice questions 
 
1. **Coding:** Store a user's preferred theme ("dark" or "light") in `localStorage` and apply it when 
the page loads. 
2. **Coding:** Create a page counter using `sessionStorage` that increments every time the user 
reloads the tab but resets when the tab is closed. 
3. **Theory:** Describe scenarios where cookies are necessary instead of Web Storage. What 
security attributes (e.g., `HttpOnly`, `Secure`) should be set on cookies used for authentication? 
 
 
 


---

 
185
What is CORS and how does it work? 
Explain CORS and how it works 
 
Modern web applications often need to request resources from different domains — for example, a 
single-page app hosted on `example.com` may fetch data from an API at `api.example.net`. **Cross-
Origin Resource Sharing (CORS)** is a mechanism that allows (or disallows) such cross-origin 
requests in a secure way. To appreciate why CORS exists, you first need to understand the **same-
origin policy**. 
 
### Same-origin policy 
 
Browsers enforce a security model called the **same-origin policy**: a script running on a web page 
can only read data from the same protocol, domain and port that served it. This prevents malicious 
pages from accessing sensitive information on another site via `fetch()` or `XMLHttpRequest`. For 
example, a page loaded from `https://bank.com` cannot make a request to `https://mail.com` and 
read the response. 
 
### What is CORS? 
 
Cross-Origin Resource Sharing (CORS) is an HTTP-header based protocol that relaxes the same-origin 
policy for approved requests. It allows a server to specify which origins are permitted to read its 
resources. When a page makes a cross-origin request, the browser adds special CORS headers and 
may send a **preflight** request to check whether the server will accept the actual request. 
 
### How CORS works 
 
1. **Simple requests:** If the request uses a safe HTTP method (`GET`, `HEAD` or sometimes `POST` 
with simple headers) and does not include custom headers, the browser automatically adds an 
`Origin` header specifying the requesting domain. The server's response must include `Access-
Control-Allow-Origin` with either the requesting origin or `*` to permit the read. 
2. **Preflight requests:** For requests that could modify server data (e.g. `PUT`, `DELETE`, or `POST` 
with non-simple headers) the browser first sends an `OPTIONS` request to the server containing 
`Access-Control-Request-Method` and `Access-Control-Request-Headers`. The server responds with 
`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` 
to indicate whether the actual request is allowed. If approved, the browser proceeds with the actual 
request; otherwise it aborts. 
3. **Credentials:** By default, cross-origin requests do **not** include cookies or HTTP 
authentication. To send credentials, the client must set `fetch(url, { credentials: 'include' })` and the 


---

 
186
server must respond with `Access-Control-Allow-Credentials: true` along with a specific `Access-
Control-Allow-Origin` (not `*`), otherwise the browser will reject the response. 
4. **Errors:** When a CORS request fails, JavaScript code cannot see the details. The browser simply 
reports a generic error to prevent information leaks. 
 
### Example 
 
```js 
// From https://domain-a.com 
fetch("https://api.domain-b.com/data.json") 
  .then((resp) => resp.json()) 
  .then((data) => console.log("Data:", data)) 
  .catch((err) => console.error("CORS error:", err)); 
``` 
 
If `api.domain-b.com` includes `Access-Control-Allow-Origin: https://domain-a.com` in its response, 
the browser allows the script to read the data. If the header is missing or the origin is not allowed, 
the request still reaches the server, but the browser blocks the response and triggers a CORS error. 
 
### Real-world analogy 
 
Think of visiting a secure building. Normally, only employees (same origin) can enter any office. CORS 
is like a guest policy: an employee (server) can put a list on the door (CORS headers) of which visitors 
from other companies (origins) are allowed to enter and what rooms (methods/headers) they can 
access. Before allowing a visitor into restricted rooms, security might call ahead (the preflight 
request) to confirm it's okay. 
 
### Summary 
 
- The **same-origin policy** restricts scripts to resources from the same scheme, domain and port. 
- **CORS** relaxes this policy by letting servers indicate which origins may access their resources via 
HTTP headers. 
- **Simple requests** require only an `Origin` header and a matching `Access-Control-Allow-Origin` 
response; **preflight requests** use the `OPTIONS` method to negotiate allowed methods and 
headers for non-simple requests. 


---

 
187
- Browsers handle CORS enforcement; failure results in a generic error visible in the console but not 
to JavaScript. 
 
### Common misconceptions 
 
1. **"CORS is a client-side fix."** CORS is enforced by browsers and configured on servers. 
Client-side code cannot override CORS restrictions; the server must send the appropriate headers. 
2. **"CORS allows any cross-origin request."** Only the origins explicitly allowed by the server are 
permitted. Omitting the `Access-Control-Allow-Origin` header will still cause the browser to block 
access. 
3. **"CORS is a security vulnerability."** CORS is a security feature that _prevents_ unauthorized 
cross-origin reads. When misconfigured (e.g. using `Access-Control-Allow-Origin: *` with credentials), 
it can open vulnerabilities, but properly configured CORS improves security. 
 
### Practice questions 
 
1. **Theory:** Describe the difference between the same-origin policy and CORS. What problem 
does CORS solve? 
2. **Coding:** Write a simple Express or Node server that responds to `GET /api/data` with JSON 
and sets `Access-Control-Allow-Origin: *`. Test fetching this endpoint from a different domain. 
3. **Theory:** Why are preflight requests necessary? What headers does the browser send during a 
preflight, and how should the server respond? 
 
 
 


---

 
188
Difference between synchronous and asynchronous 
code 
Difference between synchronous and asynchronous code 
 
JavaScript traditionally executes code **synchronously**: it runs one statement after another in the 
order you wrote them, and each statement must finish before the next begins. MDN describes 
synchronous programs as those where the browser "steps through the program one line at a time ... 
waiting for the line to finish its work before going on to the next". This is straightforward to reason 
about, but it has a drawback—long-running functions block the single JavaScript thread. For 
example, an inefficient prime-number generator can freeze the user interface for seconds because 
nothing else can happen until it returns. 
 
**Asynchronous programming** solves this problem by allowing long-running operations (such as 
network requests or file access) to start and then return immediately. The program remains 
responsive, and when the task finishes it provides the result via a callback, promise or event. MDN 
notes that asynchronous programming lets your program "start a potentially long-running task and 
still be able to be responsive to other events". Events like HTTP requests, camera access or file 
pickers are handled asynchronously, so your code isn't blocked while waiting for a response. 
 
### How synchronous and asynchronous code differ 
 
- **Execution order** - In synchronous code, statements execute sequentially; the call stack must be 
empty before the browser can do anything else. In asynchronous code, long-running tasks start and 
then yield control back to the browser. When the task completes, its callback or promise handler 
runs later via the event loop. This makes the application appear to "do two things at once" even 
though JavaScript is single-threaded. 
- **Blocking vs. non-blocking** - A synchronous function blocks the main thread: user interactions 
and rendering wait until it finishes. The MDN asynchronous requests guide warns that synchronous 
requests "block the execution of code" and cause the UI to freeze. Asynchronous functions, on the 
other hand, don't block; the browser continues handling user input while awaiting the result. 
- **Handling results** - Synchronous calls return their result immediately. Asynchronous calls return 
a promise or accept a callback that will be invoked when the result is ready. Using promises 
(`.then()`/`catch()`) or `async`/`await` makes asynchronous flows easier to read than nested callbacks. 
 
### Example: long synchronous vs. asynchronous tasks 
 
```js 
// Synchronous example: blocks the UI 


---

 
189
function generateLargePrimes(count) { 
  const primes = []; 
  let num = 2; 
  function isPrime(n) { 
    for (let i = 2; i <= Math.sqrt(n); i++) { 
      if (n % i === 0) return false; 
    } 
    return true; 
  } 
  while (primes.length < count) { 
    if (isPrime(num)) primes.push(num); 
    num++; 
  } 
  return primes; 
} 
 
// Calling this will freeze the UI until it finishes 
const primes = generateLargePrimes(100000); 
 
// Asynchronous example using setTimeout 
function generatePrimesAsync(count) { 
  return new Promise((resolve) => { 
    setTimeout(() => { 
      resolve(generateLargePrimes(count)); 
    }, 0); // schedule on the event loop 
  }); 
} 
 
generatePrimesAsync(100000).then((primes) => { 
  console.log("Generated primes asynchronously"); 
}); 


---

 
190
console.log("UI stays responsive while primes are computed"); 
``` 
 
In the synchronous version the browser must finish generating primes before doing anything else. In 
the asynchronous version we wrap the computation in a `Promise` that resolves after a timeout. The 
promise allows the event loop to process other events (like user input) before running the heavy 
computation in a later tick. 
 
### Real-world analogy 
 
Imagine standing in line at a coffee shop. A **synchronous** process would require you to wait at 
the counter until your drink is made before the next customer can order; the barista can serve only 
one person at a time. An **asynchronous** process is like taking a numbered ticket: you place your 
order, receive a token and then sit down. While you chat with friends, the barista prepares multiple 
orders. When your number is called, you pick up your drink. You were free to do other things while 
waiting, and the barista could work on many orders without people blocking the counter. 
 
### Common misconceptions 
 
1. **Asynchronous code runs on multiple threads.** In browsers, JavaScript still runs on a single 
thread; asynchronous functions simply defer execution until the call stack is free. Web APIs or worker 
threads perform the heavy work in the background, but your callbacks run on the main thread. 
2. **Asynchronous code is always faster.** It doesn't make a task execute sooner; it just prevents 
the UI from freezing. A network request still takes the same time to complete; asynchronous 
handling lets your program respond to other events during that time. 
3. **`async` functions run in parallel.** Declaring a function `async` means it returns a promise and 
allows you to use `await`. It does not make the function concurrent by itself. 
 
### Practice questions 
 
1. **Theory:** Explain why long-running synchronous functions cause the browser to become 
unresponsive, and how asynchronous functions avoid that problem. 
2. **Coding:** Convert a synchronous function that fetches data from an API using 
`XMLHttpRequest` into an asynchronous version using the Fetch API and promises. Ensure that the UI 
remains responsive while the data is loading. 


---

 
191
3. **Coding:** Write an `async` function that performs three network requests in parallel using 
`Promise.all()` and returns the combined results. How would you handle errors if one of the requests 
fails? 
 
 
 


---

 
192
What is the Fetch API and how is it different from 
XMLHttpRequest? 
What is the Fetch API and how is it different from XMLHttpRequest? 
 
Modern web applications need to communicate with servers without reloading the page. Two main 
browser APIs provide this capability: **`XMLHttpRequest`** (XHR) and the newer **Fetch API**. 
Both allow you to make HTTP requests from JavaScript, but they differ significantly in syntax, features 
and design. 
 
### Fetch API overview 
 
`fetch()` is a modern, promise-based interface for making HTTP requests in JavaScript. It replaces the 
older `XMLHttpRequest` (XHR) with a cleaner syntax and integrates well with features like CORS and 
service workers. A basic `fetch()` call looks like this: 
 
```js 
fetch("https://api.example.com/data") 
  .then((response) => { 
    if (!response.ok) { 
      throw new Error(`HTTP error! status: ${response.status}`); 
    } 
    return response.json(); // parse JSON body 
  }) 
  .then((data) => console.log(data)) 
  .catch((err) => console.error(err)); 
``` 
 
`fetch()` takes two arguments: 
 
1. **Resource** - a URL or a `Request` object representing the resource to fetch. 
2. **Options object** - an optional `RequestInit` object where you configure the request. 
 


---

 
193
It returns a **Promise** that resolves to a `Response` object once the server responds with headers. 
If a network error occurs (e.g., DNS failure), the promise rejects. However, HTTP error status codes 
(4xx/5xx) do **not** cause rejection; you must check `response.ok` yourself. 
 
--- 
 
### Configuring requests via the options object 
 
The optional `init` object passed to `fetch()` lets you specify details such as the HTTP method, 
headers, body, credentials, caching, and more. Key properties include: 
 
                                     | 
 
--- 
 
### Making a POST request and sending data 
 
To send data to the server, change the `method` and supply a suitable `body`. When sending JSON, 
set the `Content-Type` header and `body` to a stringified object: 
 
```js 
async function createUser(user) { 
  const response = await fetch("https://api.example.com/users", { 
    method: "POST", 
    headers: { 
      "Content-Type": "application/json", 
      // you can add other headers like Authorization here 
    }, 


---

 
194
    body: JSON.stringify(user), 
  }); 
 
  if (!response.ok) { 
    throw new Error("Failed to create user: " + response.status); 
  } 
 
  return response.json(); 
} 
 
// Usage: 
createUser({ name: "Alice", age: 30 }) 
  .then((data) => console.log("User created:", data)) 
  .catch((err) => console.error(err)); 
``` 
 
Alternatively, for form submissions you can send `FormData`: 
 
```js 
const formData = new FormData(); 
formData.append("title", "Hello"); 
formData.append("image", fileInput.files[0]); 
 
fetch("/upload", { 
  method: "POST", 
  body: formData, 
}); 
``` 
 
Here, you should **not** set a `Content-Type` header; the browser will set the correct multipart 
boundary. 


---

 
195
 
--- 
 
### Working with responses 
 
A `Response` object provides properties and methods to inspect and consume the reply: 
 
- `response.ok`: boolean indicating status in the range 200-299. 
- `response.status`: numeric status code. 
- `response.headers`: a `Headers` object to read response headers. 
- `response.text()`: returns a promise that resolves to the body as a string. 
- `response.json()`: parses JSON and resolves to the JS object. 
- `response.blob()`: resolves to a `Blob`, suitable for binary data (e.g., images). 
- `response.arrayBuffer()`: resolves to an `ArrayBuffer`. 
- `response.body`: a `ReadableStream` you can read incrementally. 
 
Example of downloading a file as a blob and converting it into an object URL: 
 
```js 
fetch("https://example.com/logo.png") 
  .then((res) => res.blob()) 
  .then((blob) => { 
    const url = URL.createObjectURL(blob); 
    const img = document.createElement("img"); 
    img.src = url; 
    document.body.appendChild(img); 
  }); 
``` 
 
--- 
 


---

 
196
### Error handling 
 
Network errors (no response, DNS failure) reject the fetch promise. HTTP errors do not, so always 
check `response.ok` or `response.status` and throw accordingly. Errors thrown in `.then()` handlers or 
within `async` functions propagate to the nearest `.catch()` or `try...catch` block. 
 
You can cancel requests using `AbortController`: 
 
```js 
const controller = new AbortController(); 
const { signal } = controller; 
 
fetch('/long-request', { signal }) 
  .then(res => /* handle response */) 
  .catch(err => { 
    if (err.name === 'AbortError') { 
      console.log('Request was cancelled'); 
    } 
  }); 
 
// Cancel after 2 seconds 
setTimeout(() => controller.abort(), 2000); 
``` 
 
--- 
 
### Using custom `Request` and `Headers` objects 
 
You can prebuild requests and headers: 
 
```js 
const headers = new Headers({ 


---

 
197
  "Content-Type": "application/json", 
  Authorization: "Bearer token", 
}); 
 
const request = new Request("/data", { 
  method: "POST", 
  headers, 
  body: JSON.stringify({ foo: "bar" }), 
  credentials: "include", // send cookies 
}); 
 
fetch(request).then(/* ... */); 
``` 
 
--- 
 
### Caching and service workers 
 
The `cache` option influences how the browser interacts with its HTTP cache. Using `'no-store'` 
ensures a fresh request; `'force-cache'` retrieves from cache even if expired. Service workers can 
intercept and respond to fetch events, enabling offline support and advanced caching. You can also 
use the [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) to 
programmatically cache responses. 
 
--- 
 
### Summary 
 
- **Promises & async/await:** Fetch uses promises, making asynchronous code more readable than 
XHR callbacks. 
- **Flexible options:** You can set HTTP method, headers, body content, CORS mode, credentials, 
cache behavior, redirects and abort signals via the options object. 


---

 
198
- **Response handling:** Check `response.ok`/`response.status`, then use `.json()`, `.text()`, 
`.blob()`, `.arrayBuffer()`, or the streaming `response.body` to consume the body. 
- **Cancellation:** Use `AbortController` to cancel long-running requests. 
- **Integration:** Fetch works in browsers and in modern Node.js, and plays nicely with service 
workers and CORS. 
 
With this knowledge you should be able to perform most network interactions—GET, POST, file 
uploads, streaming downloads, and more—without needing to refer to external resources. 
 
### XMLHttpRequest overview 
 
`XMLHttpRequest` is the original API for AJAX (Asynchronous JavaScript and XML). It allows you to 
send HTTP requests, track their progress and handle responses via event listeners. XHR can operate 
in both synchronous and asynchronous modes, but synchronous requests block the main thread and 
are deprecated because they freeze the UI. A typical XHR usage involves creating a new 
`XMLHttpRequest`, calling `.open()`, attaching `onload`/`onerror` handlers and then calling `.send()`. 
 
### Key differences between Fetch and XHR 
 
- **Syntax and promises** - `fetch()` returns a promise that resolves with a `Response` object. You 
can chain `.then()` handlers or use `await` to process the response. XHR uses event callbacks (`load`, 
`error`, `progress`) and does not return a promise. Promise-based code tends to be cleaner and 
avoids "callback hell". 
- **Error handling** - With `fetch`, network errors reject the promise, but HTTP errors (status codes 
4xx/5xx) do **not**—you must check the `response.ok` property. XHR surfaces HTTP errors in its 
`status` property; you manually check `xhr.status` inside the `onload` handler. 
- **Headers and bodies** - The Fetch API accepts an options object where you can set method, 
headers, body and other settings. It supports Request/Response streams and easily handles JSON or 
binary data. XHR also supports setting headers via `.setRequestHeader()`, but its API is less flexible 
and does not handle streams. 
- **Cancellation** - To abort a fetch request you create an `AbortController` and pass its signal to 
`fetch()`. With XHR you call `.abort()` directly on the XHR instance. Fetch does not yet support 
progress events (though they are proposed), while XHR emits `progress` events useful for displaying 
upload/download progress. 
- **Caching and service workers** - Fetch integrates with service workers and allows controlling 
caching via the `cache` option. XHR has no built-in cache control; caching must be handled manually 
or via browser heuristics. 


---

 
199
- **Environment support** - XHR is built into browsers and has long been supported. It is not 
natively available in older Node.js versions. Fetch is part of modern JavaScript; it works in browsers, 
recent Node.js and Deno. Many existing Node.js libraries still use XHR for historical reasons, and 
some features like progress events are still exclusive to XHR. 
 
### Example: XHR vs. fetch 
 
```js 
// XMLHttpRequest example 
function loadUser_XHR(id) { 
  return new Promise((resolve, reject) => { 
    const xhr = new XMLHttpRequest(); 
    xhr.open("GET", `https://jsonplaceholder.typicode.com/users/${id}`, true); 
    xhr.responseType = "json"; 
    xhr.onload = () => { 
      if (xhr.status === 200) resolve(xhr.response); 
      else reject(new Error("Request failed: " + xhr.status)); 
    }; 
    xhr.onerror = () => reject(new Error("Network error")); 
    xhr.send(); 
  }); 
} 
 
loadUser_XHR(1).then((user) => console.log("XHR user", user)); 
 
// Fetch example 
async function loadUser_Fetch(id) { 
  const response = await fetch( 
    `https://jsonplaceholder.typicode.com/users/${id}` 
  ); 
  if (!response.ok) throw new Error("HTTP error: " + response.status); 
  return response.json(); 


---
