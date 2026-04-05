# Prototypes, Inheritance & Closures - JavaScript Interview Guide

## Table of Contents
1. [Prototype Chain Deep Dive](#prototype-chain-deep-dive)
2. [Inheritance Patterns](#inheritance-patterns)
3. [Closures Mastery](#closures-mastery)
4. [This Binding](#this-binding)
5. [Real Interview Questions](#real-interview-questions)
6. [Advanced Topics](#advanced-topics)
7. [Quick Reference](#quick-reference)

---

## Prototype Chain Deep Dive

### `__proto__` vs `prototype`

```javascript
// UNDERSTANDING: prototype vs __proto__
//
// prototype: 
// - Property that EXISTS ONLY on CONSTRUCTOR FUNCTIONS
// - It's an object that becomes the __proto__ of instances
// - You ADD METHODS here that all instances will share
//
// __proto__:
// - Property that EXISTS on ALL OBJECTS (instances)
// - It's a REFERENCE/LINK to the prototype object
// - Used by JavaScript engine for property lookup
// - Deprecated in code, use Object.getPrototypeOf() instead

function Person(name) {
  // 'this' refers to the new instance being created
  this.name = name;  // Instance property (unique per instance)
}

// Add method to Person.prototype
// All Person instances will share this ONE function (memory efficient!)
Person.prototype.greet = function() {
  return `Hello, I'm ${this.name}`;
};

// Create instance using 'new' keyword
const alice = new Person('Alice');

// VERIFICATION: Understanding the relationships
console.log(alice.__proto__ === Person.prototype); // true
// alice's __proto__ points to Person.prototype
// This is how alice can access greet() method

console.log(Person.prototype.__proto__ === Object.prototype); // true
// Person.prototype's __proto__ points to Object.prototype
// This is why alice can use toString(), hasOwnProperty(), etc.

console.log(Object.prototype.__proto__); // null (end of chain)
// Object.prototype is the top of the chain
// Its __proto__ is null (nothing above it)

// PROTOTYPE CHAIN VISUALIZATION:
// alice (instance)
//   ↓ __proto__
// Person.prototype (has greet method)
//   ↓ __proto__
// Object.prototype (has toString, hasOwnProperty, etc.)
//   ↓ __proto__
// null (end)
//
// PROPERTY LOOKUP: When you call alice.greet()
// 1. Check alice object itself → not found
// 2. Check alice.__proto__ (Person.prototype) → FOUND! Execute it
// 3. If not found, check Person.prototype.__proto__ (Object.prototype)
// 4. If not found, check Object.prototype.__proto__ (null) → undefined
```

### Prototype Chain Lookup

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function() {
  return `${this.name} is eating`;
};

function Dog(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}

// Set up inheritance
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  return `${this.name} says woof!`;
};

const buddy = new Dog('Buddy', 'Golden Retriever');

// Property lookup order:
// 1. buddy object itself
// 2. Dog.prototype
// 3. Animal.prototype
// 4. Object.prototype
// 5. null (not found)

console.log(buddy.name);  // Found on buddy
console.log(buddy.bark()); // Found on Dog.prototype
console.log(buddy.eat());  // Found on Animal.prototype
console.log(buddy.toString()); // Found on Object.prototype
```

### Object.create, Object.setPrototypeOf

```javascript
// Object.create - Create object with specific prototype
const personPrototype = {
  greet() {
    return `Hello, I'm ${this.name}`;
  }
};

const alice = Object.create(personPrototype);
alice.name = 'Alice';
console.log(alice.greet()); // "Hello, I'm Alice"

// Object.setPrototypeOf - Change prototype (slow!)
const bob = { name: 'Bob' };
Object.setPrototypeOf(bob, personPrototype);
console.log(bob.greet()); // "Hello, I'm Bob"

// WARNING: setPrototypeOf is slow, avoid in production
// Better to use Object.create upfront
```

### Prototype Pollution Vulnerabilities

```javascript
// DANGEROUS: Prototype pollution attack
const maliciousInput = JSON.parse('{"__proto__": {"isAdmin": true}}');
Object.assign({}, maliciousInput);

// Now ALL objects have isAdmin property!
console.log({}.isAdmin); // true - SECURITY ISSUE!

// SAFE: Prevent prototype pollution
function safeAssign(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key) && key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
      target[key] = source[key];
    }
  }
  return target;
}

// Or use Object.create(null) for prototype-less objects
const safeObj = Object.create(null);
safeObj.__proto__ = { isAdmin: true };
console.log(safeObj.isAdmin); // undefined - safe!
```

---

## Inheritance Patterns

### Classical Inheritance (Constructor Functions)

```javascript
// Parent constructor
function Vehicle(type) {
  this.type = type;
  this.speed = 0;
}

Vehicle.prototype.accelerate = function(amount) {
  this.speed += amount;
  return `${this.type} accelerating to ${this.speed}mph`;
};

// Child constructor
function Car(brand, model) {
  Vehicle.call(this, 'Car'); // Call parent constructor
  this.brand = brand;
  this.model = model;
}

// Set up inheritance
Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;

// Add child methods
Car.prototype.honk = function() {
  return `${this.brand} ${this.model} says beep!`;
};

const tesla = new Car('Tesla', 'Model 3');
console.log(tesla.accelerate(60)); // "Car accelerating to 60mph"
console.log(tesla.honk()); // "Tesla Model 3 says beep!"
```

### Prototypal Inheritance

```javascript
// Object-based inheritance
const vehicle = {
  init(type) {
    this.type = type;
    this.speed = 0;
    return this;
  },
  accelerate(amount) {
    this.speed += amount;
    return `${this.type} at ${this.speed}mph`;
  }
};

const car = Object.create(vehicle);
car.honk = function() {
  return `${this.type} says beep!`;
};

const myCar = Object.create(car).init('Sedan');
console.log(myCar.accelerate(50)); // "Sedan at 50mph"
console.log(myCar.honk()); // "Sedan says beep!"
```

### Functional Inheritance

```javascript
function createVehicle(type) {
  let speed = 0; // Private variable
  
  return {
    getType() {
      return type;
    },
    getSpeed() {
      return speed;
    },
    accelerate(amount) {
      speed += amount;
      return `${type} at ${speed}mph`;
    }
  };
}

function createCar(brand, model) {
  const vehicle = createVehicle('Car');
  
  return {
    ...vehicle,
    getBrand() {
      return brand;
    },
    getModel() {
      return model;
    },
    honk() {
      return `${brand} ${model} says beep!`;
    }
  };
}

const honda = createCar('Honda', 'Civic');
console.log(honda.accelerate(40)); // "Car at 40mph"
console.log(honda.honk()); // "Honda Civic says beep!"
```

### ES6 Classes vs Constructor Functions

```javascript
// ES6 Class
class Animal {
  constructor(name) {
    this.name = name;
  }
  
  speak() {
    return `${this.name} makes a sound`;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  
  speak() {
    return `${this.name} barks`;
  }
}

// Equivalent Constructor Function
function AnimalConstructor(name) {
  this.name = name;
}

AnimalConstructor.prototype.speak = function() {
  return `${this.name} makes a sound`;
};

function DogConstructor(name, breed) {
  AnimalConstructor.call(this, name);
  this.breed = breed;
}

DogConstructor.prototype = Object.create(AnimalConstructor.prototype);
DogConstructor.prototype.constructor = DogConstructor;

DogConstructor.prototype.speak = function() {
  return `${this.name} barks`;
};

// Key Differences:
// 1. Classes have cleaner syntax
// 2. Classes are not hoisted
// 3. Classes always run in strict mode
// 4. Class methods are non-enumerable
// 5. Classes must be called with 'new'
```

---

## Closures Mastery

### Lexical Scope and Closure Creation

```javascript
// Closure: Function + its lexical environment
//
// DEFINITION: A closure is created when a function "remembers" variables
// from its outer scope, even after the outer function has finished executing
//
// KEY CONCEPT: Functions in JavaScript have access to:
// 1. Their own local variables
// 2. Variables from outer (parent) functions
// 3. Global variables
//
// CLOSURE MAGIC: Inner function keeps a reference to outer function's variables
// Even after outer function returns, those variables stay alive!

function outer(x) {
  // Lexical environment contains 'x'
  // This variable will be "remembered" by inner function
  
  function inner(y) {
    // inner() has access to:
    // - Its own parameter: y
    // - Outer function's parameter: x (CLOSURE!)
    // - Any global variables
    return x + y;
  }
  
  return inner;  // Return the function itself, not the result
}

// Create a closure
const add5 = outer(5);
// At this point:
// - outer(5) has finished executing
// - Normally, 'x' would be garbage collected
// - BUT inner() still references 'x', so it stays alive!
// - add5 is now a function that "remembers" x = 5

console.log(add5(3));  // 8 (5 + 3)
// How: add5 is inner() with x = 5 "baked in"
// Calling add5(3) executes: return 5 + 3

console.log(add5(10)); // 15 (5 + 10)
// Same closure, different y value: return 5 + 10

// Create another closure with different x
const add10 = outer(10);
console.log(add10(3));  // 13 (10 + 3)
console.log(add10(10)); // 20 (10 + 10)

// IMPORTANT: add5 and add10 are SEPARATE closures
// Each has its own copy of 'x' in memory
// add5 remembers x = 5
// add10 remembers x = 10

// REAL-WORLD ANALOGY:
// outer() is like a factory that creates customized calculators
// Each calculator (closure) remembers its own starting number
// add5 is a "add 5 to anything" calculator
// add10 is a "add 10 to anything" calculator
```

### Common Closure Patterns

```javascript
// 1. Module Pattern (Data Privacy)
const counter = (function() {
  let count = 0; // Private variable
  
  return {
    increment() {
      return ++count;
    },
    decrement() {
      return --count;
    },
    getCount() {
      return count;
    }
  };
})();

console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.count); // undefined (private!)

// 2. Function Factory
function createMultiplier(multiplier) {
  return function(number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15

// 3. Event Handlers with Closures
function setupButtons() {
  for (let i = 0; i < 3; i++) {
    const button = document.createElement('button');
    button.textContent = `Button ${i}`;
    
    // Closure captures 'i'
    button.addEventListener('click', function() {
      console.log(`Button ${i} clicked`);
    });
    
    document.body.appendChild(button);
  }
}

// 4. Memoization
function memoize(fn) {
  const cache = {};
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (key in cache) {
      console.log('Cache hit!');
      return cache[key];
    }
    
    console.log('Computing...');
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}

const expensiveOperation = memoize((n) => {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += i;
  }
  return sum;
});

console.log(expensiveOperation(1000000)); // Computing... 499999500000
console.log(expensiveOperation(1000000)); // Cache hit! 499999500000
```

### Memory Implications and Leaks

```javascript
// MEMORY LEAK: Closure holds reference to large object
function createHandler() {
  const largeData = new Array(1000000).fill('data');
  
  return function() {
    // Even though we don't use largeData,
    // it's kept in memory because of closure
    console.log('Handler called');
  };
}

// FIXED: Don't capture unnecessary variables
function createHandlerFixed() {
  const largeData = new Array(1000000).fill('data');
  const needed = largeData[0]; // Extract only what's needed
  
  return function() {
    console.log('Handler called', needed);
  };
  // largeData can be garbage collected
}

// LEAK: Event listener not removed
function setupLeakyListener() {
  const data = { large: 'object' };
  
  document.addEventListener('click', function() {
    console.log(data);
  });
  // Listener keeps 'data' in memory forever!
}

// FIXED: Remove listener when done
function setupProperListener() {
  const data = { large: 'object' };
  
  const handler = function() {
    console.log(data);
  };
  
  document.addEventListener('click', handler);
  
  // Cleanup
  return function cleanup() {
    document.removeEventListener('click', handler);
  };
}
```

### Practical Use Cases

```javascript
// 1. Currying
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...nextArgs) {
      return curried.apply(this, args.concat(nextArgs));
    };
  };
}

const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
console.log(curriedAdd(1)(2, 3)); // 6

// 2. Partial Application
function partial(fn, ...fixedArgs) {
  return function(...remainingArgs) {
    return fn(...fixedArgs, ...remainingArgs);
  };
}

const add3Numbers = (a, b, c) => a + b + c;
const add5And = partial(add3Numbers, 5);

console.log(add5And(3, 2)); // 10

// 3. Once Function
function once(fn) {
  let called = false;
  let result;
  
  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

const initialize = once(() => {
  console.log('Initializing...');
  return { initialized: true };
});

initialize(); // Logs: "Initializing..."
initialize(); // Does nothing
initialize(); // Does nothing
```

---

## This Binding

### Implicit Binding

```javascript
const person = {
  name: 'Alice',
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

person.greet(); // "Hello, I'm Alice"

// Lost binding
const greet = person.greet;
greet(); // "Hello, I'm undefined" (this is window/global)
```

### Explicit Binding (call, apply, bind)

```javascript
function introduce(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`;
}

const person = { name: 'Bob' };

// call - arguments individually
console.log(introduce.call(person, 'Hi', '!')); // "Hi, I'm Bob!"

// apply - arguments as array
console.log(introduce.apply(person, ['Hello', '.'])); // "Hello, I'm Bob."

// bind - returns new function with bound 'this'
const boundIntroduce = introduce.bind(person, 'Hey');
console.log(boundIntroduce('!')); // "Hey, I'm Bob!"
```

### Arrow Functions and 'this'

```javascript
const obj = {
  name: 'Alice',
  
  // Regular function - 'this' is obj
  regularMethod() {
    console.log(this.name); // 'Alice'
    
    setTimeout(function() {
      console.log(this.name); // undefined (this is window)
    }, 100);
  },
  
  // Arrow function - 'this' is lexically bound
  arrowMethod() {
    console.log(this.name); // 'Alice'
    
    setTimeout(() => {
      console.log(this.name); // 'Alice' (inherits from arrowMethod)
    }, 100);
  }
};

// Arrow functions don't have their own 'this'
const arrowFunc = () => {
  console.log(this); // Lexical 'this' from enclosing scope
};

// Can't bind 'this' to arrow functions
const obj2 = { name: 'Bob' };
const boundArrow = arrowFunc.bind(obj2);
boundArrow(); // Still uses lexical 'this', not obj2
```

### Constructor Binding

```javascript
function Person(name) {
  this.name = name;
  
  // Regular method
  this.greet = function() {
    console.log(`Hi, I'm ${this.name}`);
  };
  
  // Arrow function
  this.greetArrow = () => {
    console.log(`Hi, I'm ${this.name}`);
  };
}

const alice = new Person('Alice');
alice.greet(); // "Hi, I'm Alice"

// Lost binding with regular function
const greet = alice.greet;
greet(); // "Hi, I'm undefined"

// Arrow function maintains binding
const greetArrow = alice.greetArrow;
greetArrow(); // "Hi, I'm Alice"
```

### Binding Priority

```javascript
// Priority (highest to lowest):
// 1. new binding
// 2. Explicit binding (call, apply, bind)
// 3. Implicit binding (obj.method())
// 4. Default binding (window/global)

function test() {
  console.log(this.value);
}

const obj1 = { value: 1, test };
const obj2 = { value: 2 };

// Implicit binding
obj1.test(); // 1

// Explicit binding wins over implicit
obj1.test.call(obj2); // 2

// Bound function
const boundTest = test.bind(obj1);
boundTest.call(obj2); // 1 (bind wins over call)

// new binding wins over bind
function Constructor() {
  this.value = 3;
}
const BoundConstructor = Constructor.bind(obj1);
const instance = new BoundConstructor();
console.log(instance.value); // 3 (new wins)
```

---

## Real Interview Questions

### Question 1: Implement Inheritance Without ES6 Classes

**Difficulty**: Mid  
**Companies**: Google, Amazon

```javascript
// Implement inheritance: Dog extends Animal
function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function() {
  return `${this.name} is eating`;
};

function Dog(name, breed) {
  // Call parent constructor
  Animal.call(this, name);
  this.breed = breed;
}

// Set up prototype chain
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

// Add Dog-specific method
Dog.prototype.bark = function() {
  return `${this.name} barks`;
};

// Test
const buddy = new Dog('Buddy', 'Golden Retriever');
console.log(buddy.eat()); // "Buddy is eating"
console.log(buddy.bark()); // "Buddy barks"
console.log(buddy instanceof Dog); // true
console.log(buddy instanceof Animal); // true
```

### Question 2: Create Private Variables Using Closures

**Difficulty**: Mid  
**Companies**: Microsoft, Meta

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance; // Private variable
  const transactions = []; // Private array
  
  return {
    deposit(amount) {
      if (amount > 0) {
        balance += amount;
        transactions.push({ type: 'deposit', amount, balance });
        return balance;
      }
      throw new Error('Amount must be positive');
    },
    
    withdraw(amount) {
      if (amount > 0 && amount <= balance) {
        balance -= amount;
        transactions.push({ type: 'withdraw', amount, balance });
        return balance;
      }
      throw new Error('Invalid withdrawal amount');
    },
    
    getBalance() {
      return balance;
    },
    
    getTransactions() {
      // Return copy to prevent mutation
      return [...transactions];
    }
  };
}

const account = createBankAccount(1000);
console.log(account.deposit(500)); // 1500
console.log(account.withdraw(200)); // 1300
console.log(account.getBalance()); // 1300
console.log(account.balance); // undefined (private!)
```

### Question 3: Fix Common 'this' Binding Issues

**Difficulty**: Mid  
**Companies**: All major companies

```javascript
// Problem: Lost 'this' binding
const user = {
  name: 'Alice',
  friends: ['Bob', 'Charlie'],
  
  printFriends() {
    this.friends.forEach(function(friend) {
      // 'this' is undefined here!
      console.log(`${this.name} is friends with ${friend}`);
    });
  }
};

// Solution 1: Arrow function
const user1 = {
  name: 'Alice',
  friends: ['Bob', 'Charlie'],
  
  printFriends() {
    this.friends.forEach(friend => {
      console.log(`${this.name} is friends with ${friend}`);
    });
  }
};

// Solution 2: bind
const user2 = {
  name: 'Alice',
  friends: ['Bob', 'Charlie'],
  
  printFriends() {
    this.friends.forEach(function(friend) {
      console.log(`${this.name} is friends with ${friend}`);
    }.bind(this));
  }
};

// Solution 3: thisArg parameter
const user3 = {
  name: 'Alice',
  friends: ['Bob', 'Charlie'],
  
  printFriends() {
    this.friends.forEach(function(friend) {
      console.log(`${this.name} is friends with ${friend}`);
    }, this); // Pass 'this' as second argument
  }
};

// Solution 4: Store 'this' in variable
const user4 = {
  name: 'Alice',
  friends: ['Bob', 'Charlie'],
  
  printFriends() {
    const self = this;
    this.friends.forEach(function(friend) {
      console.log(`${self.name} is friends with ${friend}`);
    });
  }
};
```

### Question 4: Implement Function.prototype.bind from Scratch

**Difficulty**: Senior  
**Companies**: Google, Meta, Amazon

```javascript
Function.prototype.myBind = function(context, ...fixedArgs) {
  const fn = this;
  
  return function(...callArgs) {
    // Combine fixed args with call-time args
    return fn.apply(context, [...fixedArgs, ...callArgs]);
  };
};

// Test
function greet(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`;
}

const person = { name: 'Alice' };
const boundGreet = greet.myBind(person, 'Hello');

console.log(boundGreet('!')); // "Hello, I'm Alice!"
console.log(boundGreet('.')); // "Hello, I'm Alice."
```

### Question 5: Explain Prototype Chain Lookup Performance

**Difficulty**: Senior  
**Companies**: Netflix, Google

```javascript
// Performance test: Own property vs prototype property
function TestClass() {
  this.ownProperty = 'own';
}

TestClass.prototype.prototypeProperty = 'prototype';

const instance = new TestClass();

// Benchmark
console.time('Own property');
for (let i = 0; i < 1000000; i++) {
  instance.ownProperty;
}
console.timeEnd('Own property'); // Faster

console.time('Prototype property');
for (let i = 0; i < 1000000; i++) {
  instance.prototypeProperty;
}
console.timeEnd('Prototype property'); // Slower (chain lookup)

// Optimization: Cache prototype lookups
const cached = TestClass.prototype.prototypeProperty;
console.time('Cached');
for (let i = 0; i < 1000000; i++) {
  cached;
}
console.timeEnd('Cached'); // Fastest

// Key Points:
// 1. Own properties are faster to access
// 2. Longer prototype chains = slower lookups
// 3. Cache frequently accessed prototype properties
// 4. Use hasOwnProperty() to check own properties
```

---

## Advanced Topics

### Mixins

```javascript
// Mixin pattern - add functionality to objects
const canEat = {
  eat(food) {
    return `${this.name} is eating ${food}`;
  }
};

const canWalk = {
  walk() {
    return `${this.name} is walking`;
  }
};

const canSwim = {
  swim() {
    return `${this.name} is swimming`;
  }
};

// Combine mixins
function mixin(target, ...sources) {
  Object.assign(target, ...sources);
}

class Animal {
  constructor(name) {
    this.name = name;
  }
}

class Duck extends Animal {
  constructor(name) {
    super(name);
    mixin(this, canEat, canWalk, canSwim);
  }
}

const donald = new Duck('Donald');
console.log(donald.eat('bread')); // "Donald is eating bread"
console.log(donald.walk()); // "Donald is walking"
console.log(donald.swim()); // "Donald is swimming"
```

### Composition Over Inheritance

```javascript
// Prefer composition over inheritance
const canEat = (state) => ({
  eat(food) {
    console.log(`${state.name} eats ${food}`);
  }
});

const canWalk = (state) => ({
  walk() {
    console.log(`${state.name} walks`);
  }
});

const canSwim = (state) => ({
  swim() {
    console.log(`${state.name} swims`);
  }
});

// Compose behaviors
const createDuck = (name) => {
  const state = { name };
  
  return Object.assign(
    {},
    canEat(state),
    canWalk(state),
    canSwim(state)
  );
};

const duck = createDuck('Donald');
duck.eat('bread');
duck.walk();
duck.swim();
```

### Symbol Usage

```javascript
// Symbols for private properties
const _balance = Symbol('balance');
const _transactions = Symbol('transactions');

class BankAccount {
  constructor(initialBalance) {
    this[_balance] = initialBalance;
    this[_transactions] = [];
  }
  
  deposit(amount) {
    this[_balance] += amount;
    this[_transactions].push({ type: 'deposit', amount });
  }
  
  getBalance() {
    return this[_balance];
  }
}

const account = new BankAccount(1000);
account.deposit(500);
console.log(account.getBalance()); // 1500
console.log(account[_balance]); // undefined (symbol not accessible)

// Well-known symbols
class MyArray {
  constructor(...items) {
    this.items = items;
  }
  
  // Custom iterator
  [Symbol.iterator]() {
    let index = 0;
    const items = this.items;
    
    return {
      next() {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { done: true };
      }
    };
  }
}

const arr = new MyArray(1, 2, 3);
for (const item of arr) {
  console.log(item); // 1, 2, 3
}
```

---

## Quick Reference

### Prototype Chain

```javascript
// Check prototype
Object.getPrototypeOf(obj)
obj.__proto__ // Deprecated, use getPrototypeOf

// Set prototype
Object.create(proto)
Object.setPrototypeOf(obj, proto) // Slow!

// Check property location
obj.hasOwnProperty('prop')
'prop' in obj // Checks entire chain
```

### Inheritance Patterns

```javascript
// Constructor inheritance
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;

// ES6 class inheritance
class Child extends Parent {
  constructor() {
    super();
  }
}
```

### Closures

```javascript
// Module pattern
const module = (function() {
  const private = 'private';
  return {
    public: 'public'
  };
})();

// Memoization
const memoized = (function() {
  const cache = {};
  return function(arg) {
    return cache[arg] || (cache[arg] = compute(arg));
  };
})();
```

### This Binding

```javascript
// Explicit binding
fn.call(context, arg1, arg2)
fn.apply(context, [arg1, arg2])
fn.bind(context, arg1, arg2)

// Arrow functions
const arrow = () => this; // Lexical 'this'
```

---

## Further Reading

- [MDN: Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/tree/1st-ed/this%20%26%20object%20prototypes)

---

**Interview Preparation Checklist**:
- ✅ Understand `__proto__` vs `prototype`
- ✅ Implement inheritance without ES6 classes
- ✅ Master closure patterns and use cases
- ✅ Fix common `this` binding issues
- ✅ Implement `Function.prototype.bind`
- ✅ Know prototype pollution risks
- ✅ Understand composition vs inheritance
- ✅ Use Symbols for privacy
- ✅ Optimize prototype chain lookups
- ✅ Avoid memory leaks with closures

Good luck with your interviews! 🚀
