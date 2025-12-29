# Fun FP JS

A lightweight, dependency-free functional programming library for JavaScript.

**~800 lines** of pure functional goodness.

## Features

- 🎯 **Functional Core** - `pipe`, `compose`, `curry`, and more
- 🛡️ **Either Monad** - Safe error handling without try-catch
- ⏳ **Task Monad** - Lazy asynchronous operations (async Either)
- 🔢 **Monoid/Group** - Algebraic structures for composable operations
- 🔄 **Free Monad & Stack-Safe Engine** - Computation as data + re-entrancy protection
- 📝 **Template Engine** - Safe, nested object string interpolation
- 🏷️ **Type Protocol** - Symbol-based type class markers
- 📦 **Zero Dependencies** - Pure JavaScript
- 🪶 **Lightweight** - ~800 lines total

## Installation

```javascript
const lib = require('./index.js')();

// The library is organized into namespaces:
const { core, either, task, monoid, free, extra } = lib;

// Or with custom logger
const libWithLog = require('./index.js')({ log: myLogger });
```

## Quick Start

```javascript
const { core, either, free } = require('./index.js')();
const { pipe } = core;
const { right, left } = either;
const { done, suspend, trampoline } = free;

// Safe division with Either
const safeDivide = (a, b) => 
    b === 0 ? left('Division by zero') : right(a / b);

// Compose operations
const result = right(10)
    .flatMap(x => safeDivide(x, 2))
    .map(x => x * 3)
    .getOrElse(0);

console.log(result); // 15

// Trampoline (stack-safe recursion)
const factorial = trampoline((n, acc = 1) =>
    n <= 1 ? done(acc) : suspend(() => factorial(n - 1, n * acc))
);

factorial(10);      // 3628800
factorial(100000);  // No stack overflow!
```

---

## Modules

### 1. `core` - Functional Core (~170 lines)

#### Types Protocol

Symbol-based type class markers for Functor, Applicative, and Monad.

```javascript
const lib = require('./index.js')();
const { core, either } = lib;
const { Types, isFunctor, isApplicative, isMonad } = core;

// Check type classes
isFunctor(either.right(5));     // true - has map + Symbol
isApplicative(either.right(5)); // true - has map, ap + Symbols
isMonad(either.right(5));       // true - has map, flatMap + Symbols

// Custom type with protocol
class MyFunctor {
    [Types.Functor] = true;
    map(f) { /* ... */ }
}
```

#### Basic Functions

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { identity, constant, tuple, raise, typeOf } = core;

identity(5);           // 5
constant(10)();        // 10
tuple(1, 2, 3);        // [1, 2, 3]
raise(new Error('x')); // throws Error

// typeOf: enhanced typeof with constructor names
typeOf(undefined);     // 'undefined'
typeOf(null);          // 'null'
typeOf(42);            // 'number'
typeOf('hello');       // 'string'
typeOf(() => {});      // 'function'
typeOf([1, 2, 3]);     // 'Array'
typeOf({ a: 1 });      // 'Object'
typeOf(new Set());     // 'Set'
typeOf(new Map());     // 'Map'
typeOf(new Date());    // 'Date'
typeOf(/regex/);       // 'RegExp'
typeOf(new Error());   // 'Error'
typeOf(Promise.resolve()); // 'Promise'

// Custom classes work too
class MyClass {}
typeOf(new MyClass()); // 'MyClass'
```

#### Function Composition

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { pipe, compose } = core;

// pipe: left to right
const add1 = x => x + 1;
const double = x => x * 2;

pipe(add1, double)(5);     // 12 = (5 + 1) * 2
compose(add1, double)(5);  // 11 = (5 * 2) + 1
```

#### Argument Application (apply/unapply)

Transform how functions receive arguments.

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { apply, unapply, apply2, unapply2 } = core;

const add3 = (a, b, c) => a + b + c;
const addList = ([a, b, c]) => a + b + c;

// apply: list -> multiple args
apply(add3)([1, 2, 3]);    // 6

// unapply: multiple args -> list
unapply(addList)(1, 2, 3); // 6

// apply2/unapply2: specialized for 2 arguments
apply2((a, b) => a + b)([1, 2]); // 3
unapply2(([a, b]) => a + b)(1, 2); // 3
```

#### Currying & Partial Application

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { curry, curry2, uncurry, uncurry2, partial } = core;

const add = (a, b, c) => a + b + c;
const addCurried = a => b => c => a + b + c;

// Curry
const curriedAdd = curry(add);
curriedAdd(1)(2)(3);     // 6

// Uncurry
uncurry(addCurried)(1, 2, 3); // 6

// Binary specialized (2-args)
curry2((a, b) => a + b)(1)(2);    // 3
uncurry2(a => b => a + b)(1, 2); // 3

// Partial
const add10 = partial(add, 10);
add10(5, 3);             // 18
```

#### Higher-Order Functions

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { flip, flip2, flipC, negate, once } = core;

// flip: reverse all arguments
const sub = (a, b, c) => a - b - c;
flip(sub)(1, 2, 10);     // 7 = 10 - 2 - 1

// flip2: swap first two arguments (binary)
const minus = (a, b) => a - b;
flip2(minus)(1, 10);     // 9 = 10 - 1

// flipC: swap first two arguments of a curried function
const curriedMinus = a => b => a - b;
flipC(curriedMinus)(1)(10); // 9 = 10 - 1

// negate: invert predicate
const isEven = x => x % 2 === 0;
const isOdd = negate(isEven);
isOdd(3);                // true

// once: execute only once (retries if the function throws an error)
const init = once(() => {
    if (Math.random() > 0.5) throw new Error('fail');
    console.log('initialized');
});
init(); // if successful, marks as called
init(); // will not run again if previous call succeeded
```

#### Error Handling

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { catch: runCatch, predicate } = core;

// catch: wrap function with try-catch
const safeJsonParse = runCatch(JSON.parse, err => ({}));
safeJsonParse('{"a":1}');  // { a: 1 }
safeJsonParse('invalid');  // {}

// predicate: safe boolean check (variadic, defensive against async)
const isPositive = predicate(x => x > 0);
isPositive(5);             // true
isPositive('not number');  // false (doesn't throw)

// protection: blocks async functions to prevent logic bugs
const p = predicate(async () => true, false);
p(); // false (returns fallback and logs warning instead of Boolean(Promise))

const isSumEven = predicate((a, b) => (a + b) % 2 === 0);
isSumEven(1, 3);           // true
```

#### Side Effects

```javascript
const lib = require('./index.js')();
const { core, either, monoid } = lib;
const { tap, also, into, capture, useOrLift, pipe, range } = core;

// tap: execute side effects, return original value
const result = pipe(
    x => x * 2,
    tap(console.log),  // logs 10
    x => x + 1
)(5);
// result: 11

// also: data-first tap (variadic) - execute effects, return original
const user = { id: 1, name: 'Test' }; // Example user object
also(user)(
    u => console.log('Saving:', u.id),
    u => console.log('Tracking analytics for:', u.name)
); // returns user

// into: data-first pipe (variadic) - transform value
const resultInto = into(5)(
    core.range,                   // [0, 1, 2, 3, 4]
    list => list.map(x => x * 2),
    x => monoid.fold(monoid.number.sum)(x).getOrElse(0)
);
// result: 20

// capture: bind arguments early
const logWithUser = capture('System', 'UserA')(console.log);
logWithUser('message');    // logs 'System', 'UserA', 'message'

// useOrLift: conditional transformation
const ensureArray = useOrLift(Array.isArray, Array.of);
ensureArray(1);            // [1]
ensureArray([1]);          // [1]
```

#### Utilities

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { converge, useArrayOrLift, range, rangeBy, runOrDefault } = core;

// converge: apply multiple functions, combine results
const avg = converge(
    (sum, count) => sum / count,
    arr => arr.reduce((a, b) => a + b, 0),
    arr => arr.length
);
avg([1, 2, 3, 4, 5]); // 3

// range: generate number array [0...n-1]
range(3);             // [0, 1, 2]

// rangeBy: start, end
rangeBy(2, 5);        // [2, 3, 4]

// useArrayOrLift: ensure value is array
useArrayOrLift(5);      // [5]

// runOrDefault: run function or return fallback
runOrDefault('N/A')(() => { throw Error(); }); // 'N/A'
```

---

### 2. `either` - Error Handling Monad (~120 lines)

Either represents a value that can be one of two types:
- `Right(value)` - Success
- `Left(errors)` - Failure (normalized to Error objects in an array)

#### Creating Either

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { left, right, catch: eitherCatch, from, fromNullable } = either;

// Direct creation
right(10);           // Right(10)
left('error');       // Left([Error: error])

// From function (catches errors)
eitherCatch(JSON.parse)('{"a":1}');    // Right({ a: 1 })
eitherCatch(JSON.parse)('invalid');    // Left([SyntaxError])

// From value
from(5);             // Right(5)
fromNullable(5);     // Right(5)
fromNullable(null);  // Left([Error])
```

#### Functor: map & mapLeft

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

right(5)
    .map(x => x * 2)     // Right(10)
    .map(x => x + 1);    // Right(11)

left('error')
    .map(x => x * 2)     // Left([Error: error]) - ignored
    .mapLeft(errs => errs.map(e => e.message.toUpperCase()));  // Left(['ERROR'])
```

#### Monad: flatMap

Chain operations that might fail — just like Scala's for-comprehension:

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

// Define safe operations
const safeDivide = (a, b) => 
    b === 0 ? left('Division by zero') : right(a / b);

const safeDouble = x => 
    right(x * 2);

const safeToString = x => 
    right(`Result: ${x}`);

// Chain them beautifully
either.right(10)
    .flatMap(x => safeDivide(x, 2))    // Right(5)
    .flatMap(x => safeDouble(x))        // Right(10)
    .flatMap(x => safeToString(x));     // Right('Result: 10')

// If any step fails, the chain short-circuits
either.right(10)
    .flatMap(x => safeDivide(x, 0))    // Left([Error: Division by zero])
    .flatMap(x => safeDouble(x))        // skipped
    .flatMap(x => safeToString(x));     // skipped
```

#### Applicative: ap (Validation Pattern)

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

// Accumulate ALL errors instead of failing fast
const validateName = name =>
    name?.length > 0 ? right(name) : left('Name required');

const validateAge = age =>
    age > 0 ? right(age) : left('Age must be positive');

const createUser = name => age => ({ name, age });

right(createUser)
    .ap(validateName(''))      // Left(['Name required'])
    .ap(validateAge(-1));      // Left(['Name required', 'Age must be positive'])

// All valid
right(createUser)
    .ap(validateName('John'))
    .ap(validateAge(25));      // Right({ name: 'John', age: 25 })
```

#### fold & getOrElse

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

// fold: extract value with handlers
right(10).fold(
    errors => `Error: ${errors.join(', ')}`,
    value => `Success: ${value}`
);  // 'Success: 10'

// getOrElse: provide default
right(10).getOrElse(0);    // 10
left('err').getOrElse(0);  // 0
```

#### pipeK: Kleisli Composition

Compose Either-returning functions — Scala for-comprehension style!

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { pipeK, catch: eitherCatch, right, left } = either;

// Define your safe operations
const safeParse = eitherCatch(JSON.parse);

const getUser = obj => 
    obj.user ? right(obj.user) : left('No user');

const getProfile = user => 
    user.profile ? right(user.profile) : left('No profile');

const getAvatar = profile => 
    profile.avatar ? right(profile.avatar) : left('No avatar');

// Compose them elegantly
const getAvatarUrl = pipeK(
    safeParse,
    getUser,
    getProfile,
    getAvatar
);

// Use it
getAvatarUrl('{"user":{"profile":{"avatar":"pic.jpg"}}}');
// Right('pic.jpg')

getAvatarUrl('{"user":{}}');
// Left(['No profile'])
```

**Compare with Scala:**

```scala
// Scala for-comprehension
for {
  json    <- safeParse(input)
  user    <- getUser(json)
  profile <- getProfile(user)
  avatar  <- getAvatar(profile)
} yield avatar

// JavaScript pipeK equivalent
pipeK(
  safeParse,
  getUser,
  getProfile,
  getAvatar
)(input)
```

#### Traversable: traverse & traverseAll

```javascript
const lib = require('./index.js')();
const { either } = lib;

// Define a validation function
const validatePositive = x => 
    x > 0 ? either.right(x) : either.left(`${x} is not positive`);

// traverse: fail-fast (stops at first error)
either.traverse(validatePositive)([1, 2, 3]);
// Right([1, 2, 3])

// traverseAll: collect ALL errors
either.traverseAll(validatePositive)([1, -2, -3]);
// Left(['-2 is not positive', '-3 is not positive'])
```

#### 🛡️ Error Handling Philosophy

This library distinguishes between **Operational Errors** and **Developer Errors**:

1.  **Operational Errors** (e.g., invalid user input, API failure): Handled via `Either` (`Left`). These represent expected failure states and do not interrupt the program flow.
2.  **Developer Errors** (e.g., incorrect library setup, type mismatches in composition): Handled via **Exceptions** (`TypeError`). We throw immediately to help you catch bugs during development.

> **Note on `ap`**: If you call `.ap()` on a `Right(x)` where `x` is not a function, the library will throw a `TypeError`. This is because Applicative Functor pattern (`ap`) strictly requires a function to be wrapped in the first `Right`.

---

### 3. `monoid` - Algebraic Structures (~90 lines)

Monoid: A type with a binary operation (`concat`) and identity element (`empty`).

```
concat(a, empty) === a
concat(empty, a) === a
concat(a, concat(b, c)) === concat(concat(a, b), c)
```

#### Built-in Monoids (by type)

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

// Number
M.fold(M.number.sum)([1, 2, 3, 4]);      // Right(10)
M.fold(M.number.product)([1, 2, 3, 4]);  // Right(24)
M.fold(M.number.max)([1, 5, 3]);         // Right(5)
M.fold(M.number.min)([1, 5, 3]);         // Right(1)

// String
M.fold(M.string.concat)(['a', 'b', 'c']); // Right('abc')

// Boolean
M.fold(M.boolean.all)([true, true]);      // Right(true)
M.fold(M.boolean.any)([false, true]);     // Right(true)
M.fold(M.boolean.xor)([true, false]);     // Right(true)

// Array
M.fold(M.array.concat)([[1], [2], [3]]);  // Right([1, 2, 3])

// Object
M.fold(M.object.merge)([{a:1}, {b:2}]);   // Right({a:1, b:2})

// First/Last (any type)
M.fold(M.any.first)([1, 2, 3]);  // Right(1)
M.fold(M.any.last)([1, 2, 3]);   // Right(3)

// Function (endomorphism)
const pipeline = M.fold(M.function.endo)([
    x => x + 1,
    x => x * 2
]);
pipeline.map(f => f(5));  // Right(12)
```

#### foldMap: map + fold

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

// Sum lengths of strings
M.fold(M.number.sum, s => s.length)(['hello', 'world']);
// Right(10)

// All positive?
M.fold(M.boolean.all, x => x > 0)([1, 2, 3]);
// Right(true)
```

#### Groups (Monoid + invert)

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

// sum, product, xor have inverse operations
M.invert(M.number.sum)(5);      // Right(-5)
M.invert(M.number.product)(5);  // Right(0.2)
M.invert(M.boolean.xor)(true);  // Right(true) - self-inverse!

// max and min don't have inverses
M.invert(M.number.max)(5);      // Left(TypeError)
```

#### power: Repeat n times

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

M.power(M.number.sum)(3, 4);      // Right(12) = 3+3+3+3
M.power(M.string.concat)('a', 3); // Right('aaa')
```

---

### 4. `free` - Free Monad & Trampoline (~90 lines)

Free Monad represents computation as data, enabling:
- **Trampolining** - Stack-safe recursion
- **Interpreter pattern** - Separate definition from execution

#### Structure

```javascript
Pure(value)     // Computation finished with value
Impure(functor) // More computation to do
```

#### Trampoline: Stack-Safe Recursion

```javascript
const lib = require('./index.js')();
const { free } = lib;
const { done, suspend, trampoline } = free;

// done: computation finished
// suspend: more computation (uses Thunk internally)

// Define recursive function
const factorial = trampoline((n, acc = 1) =>
    n <= 1 
        ? done(acc)                              // finished
        : suspend(() => factorial(n - 1, n * acc))  // continue
);

// Use it safely
factorial(5);       // 120
factorial(10);      // 3628800
factorial(100000);  // Works! No stack overflow!
```

#### Fibonacci (Tail Recursive)

```javascript
const lib = require('./index.js')();
const { free } = lib;
const { done, suspend, trampoline } = free;

const fib = trampoline((n, a = 0, b = 1) =>
    n <= 0
        ? done(a)
        : suspend(() => fib(n - 1, b, a + b))
);

fib(10);   // 55
fib(50);   // 12586269025
fib(1000); // Works!
```

---

### 5. `task` - Lazy Async Monad (~120 lines)

Task represents a lazy asynchronous computation - like a Promise, but:
- **Lazy**: Nothing runs until `.run()` is called
- **Error Accumulation**: Like Either, errors are arrays for validation patterns
- **Pure**: Same input always produces same output (referential transparency)

#### Creating Tasks

```javascript
const lib = require('./index.js')();
const { task } = lib;

// Direct creation
task.resolved(42);              // Task that resolves to 42
task.rejected('error');         // Task that rejects with error

// From existing value
task.of(100);                   // Same as resolved

// From Promise-returning function
const fetchUser = task.fromPromise(id => fetch(`/api/users/${id}`).then(r => r.json()));
fetchUser(1).run(console.error, console.log);

// From Either
task.fromEither(either.right(10)); // Task resolving to 10
```

#### Running Tasks

```javascript
const lib = require('./index.js')();
const { task } = lib;

// Tasks are lazy - must call run() to execute
task.resolved(42).run(
    errors => console.error('Failed:', errors),
    value => console.log('Success:', value)
);
// Logs: "Success: 42"

// Convert to Promise
const result = await task.resolved(42).toPromise();
// result: 42

// Convert to Either (via callback)
task.resolved(42).toEither(e => console.log(e));
// Logs: Right(42)
```

#### Functor: map

```javascript
const lib = require('./index.js')();
const { task } = lib;

task.resolved(5)
    .map(x => x * 2)
    .map(x => x + 1)
    .run(console.error, console.log);
// Logs: 11
```

#### Monad: flatMap

```javascript
const lib = require('./index.js')();
const { task } = lib;

const fetchUser = id => task.resolved({ id, name: 'John' });
const fetchPosts = user => task.resolved([{ title: 'Hello', author: user.name }]);

task.resolved(1)
    .flatMap(fetchUser)
    .flatMap(fetchPosts)
    .run(console.error, console.log);
// Logs: [{ title: 'Hello', author: 'John' }]
```

#### Applicative: ap (Parallel with Error Accumulation)

```javascript
const lib = require('./index.js')();
const { task } = lib;

const validateName = name => 
    name?.length > 0 ? task.resolved(name) : task.rejected('Name required');

const validateAge = age => 
    age > 0 ? task.resolved(age) : task.rejected('Age must be positive');

const createUser = name => age => ({ name, age });

task.resolved(createUser)
    .ap(validateName(''))
    .ap(validateAge(-1))
    .run(
        errors => console.log('Errors:', errors.length), // 2 errors
        user => console.log('User:', user)
    );
```

#### fold: Transform Both Paths

```javascript
const lib = require('./index.js')();
const { task } = lib;

task.rejected('oops')
    .fold(
        errors => 'Recovered: ' + errors[0].message,
        value => 'Success: ' + value
    )
    .run(console.error, console.log);
// Logs: "Recovered: oops"
```

#### Combinators: all, race, sequence, traverse

```javascript
const lib = require('./index.js')();
const { task } = lib;

// all: Run in parallel, collect all results (or accumulate errors)
task.all([
    task.resolved(1),
    task.resolved(2),
    task.resolved(3)
]).run(console.error, console.log);
// Logs: [1, 2, 3]

// race: First to complete wins
task.race([
    task.resolved('fast'),
    task.resolved('slow')
]).run(console.error, console.log);
// Logs: "fast"

// sequence: Run in order
task.sequence([
    task.resolved(1),
    task.resolved(2)
]).run(console.error, console.log);
// Logs: [1, 2]

// traverse: Map then sequence
task.traverse(x => task.resolved(x * 2))([1, 2, 3])
    .run(console.error, console.log);
// Logs: [2, 4, 6]
```

#### pipeK: Kleisli Composition

Compose Task-returning functions — same pattern as `Either.pipeK`.

```javascript
const lib = require('./index.js')();
const { task } = lib;

const fetchUser = id => task.resolved({ id, name: 'John', profile: { avatar: 'pic.jpg' } });
const getProfile = user => task.resolved(user.profile);
const getAvatar = profile => task.resolved(profile.avatar);

// Compose them elegantly
const getAvatarById = task.pipeK(fetchUser, getProfile, getAvatar);

getAvatarById(1).run(
    errors => console.error('Failed:', errors),
    avatar => console.log('Avatar:', avatar)
);
// Logs: "Avatar: pic.jpg"

// Short-circuits on first failure
const getAvatarSafe = task.pipeK(
    id => id > 0 ? task.resolved({ id }) : task.rejected('Invalid ID'),
    user => task.resolved(user.profile || null),
    profile => profile?.avatar ? task.resolved(profile.avatar) : task.rejected('No avatar')
);

getAvatarSafe(-1).run(
    errors => console.log('Errors:', errors.length), // 1
    avatar => console.log(avatar)
);
```

---

### 6. `extra` - Practical Utilities (~20 lines)

Practical tools built using the base functional modules.

#### path: Safe Object Property Access

Navigate nested objects safely, returning `Either` for error handling.

```javascript
const lib = require('./index.js')();
const { extra } = lib;
const { path } = extra;

const data = {
    user: {
        name: 'Anthony',
        address: { city: 'Seoul' }
    }
};

// Single key
path('name')({ name: 'Bob' });
// Right('Bob')

// Nested access with dot notation
path('user.address.city')(data);
// Right('Seoul')

// Missing key returns Left
path('user.phone')(data);
// Left([Error])

// Null-safe
path('name')(null);
// Left([Error])

// Falsy values (0, false, '') are preserved
path('count')({ count: 0 });
// Right(0)

// Whitespace around dots is trimmed
path(' user . name ')(data);
// Right('Anthony')

// Chain with Either operations
path('user.age')(data)
    .filter(age => age >= 18, () => 'Too young')
    .map(age => `Adult: ${age}`)
    .fold(console.error, console.log);
```

#### template: Safe String Interpolation

Uses `path` internally to safely navigate nested objects.

```javascript
const lib = require('./index.js')();
const { extra } = lib;
const { template } = extra;

const data = {
    user: {
        name: 'Anthony',
        settings: { theme: 'dark' }
    }
};

// Simple & Nested keys
template('Hello, {{user.name}}!', data); 
// 'Hello, Anthony!'

// Whitespace resilience
template('Hello, {{  user.name  }}!', data); // 'Hello, Anthony!'
```

---

## Real-World Examples

### Safe API Call

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { catch: eitherCatch, right, left } = either;

const fetchUser = async (id) => {
    try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) return left('Not found');
        return right(await response.json());
    } catch (e) {
        return left(e.message);
    }
};

const result = await fetchUser(1);
result
    .map(user => user.name)
    .getOrElse('Unknown');
```

### Form Validation

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, validate } = either;

const validateEmail = validate(
    email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    () => 'Invalid email'
);

const validatePassword = validate(
    pwd => pwd.length >= 8,
    () => 'Password must be 8+ characters'
);

const validateForm = form =>
    right(data => ({ ...data, valid: true }))
        .ap(validateEmail(form.email).map(email => ({ email })))
        .ap(validatePassword(form.password).map(() => ({})));

validateForm({ email: 'bad', password: '123' });
// Left(['Invalid email', 'Password must be 8+ characters'])
```

### Data Pipeline

```javascript
const lib = require('./index.js')();
const { core, either } = lib;
const { pipe } = core;
const { catch: eitherCatch, right, left } = either;

const processData = pipe(
    eitherCatch(JSON.parse),
    either => either.flatMap(data => 
        data.items ? right(data.items) : left('No items')
    ),
    either => either.map(items => items.filter(x => x.active)),
    either => either.map(items => items.map(x => x.name)),
    either => either.getOrElse([])
);

processData('{"items":[{"name":"A","active":true}]}');
// ['A']
```

### Aggregating Results

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

const orders = [
    { product: 'A', qty: 2, price: 10 },
    { product: 'B', qty: 1, price: 25 },
    { product: 'C', qty: 3, price: 5 },
];

// Total quantity
M.fold(M.number.sum, o => o.qty)(orders);       // Right(6)

// Total revenue
M.fold(M.number.sum, o => o.qty * o.price)(orders);  // Right(60)

// All in stock?
M.fold(M.boolean.all, o => o.qty > 0)(orders);  // Right(true)
```

### Stack-Safe Tree Traversal

```javascript
const lib = require('./index.js')();
const { free } = lib;
const { done, suspend, trampoline } = free;

const sumTree = trampoline(function sum(node, acc = 0) {
    if (!node) return done(acc);
    return suspend(() => 
        sum(node.left, acc + node.value)
    ).flatMap(leftSum =>
        suspend(() => sum(node.right, leftSum))
    );
});

// Works on deeply nested trees!
```

---

## API Reference

### core.js (~170 lines)

| Function | Description |
|----------|-------------|
| `core.Types` | Symbol-based type markers (Functor, Applicative, Monad) |
| `core.isFunctor(x)` | Check if x is a Functor |
| `core.isApplicative(x)` | Check if x is an Applicative |
| `core.isMonad(x)` | Check if x is a Monad |
| `core.identity(x)` | Returns x |
| `core.constant(x)` | Returns () => x |
| `core.tuple(...args)` | Returns arguments as an array |
| `core.raise(e)` | Throws e |
| `core.pipe(...fs)` | Left-to-right composition |
| `core.compose(...fs)` | Right-to-left composition |
| `core.apply(f)` | multiple args -> array input |
| `core.apply2(f)` | binary multiple args -> array input |
| `core.unapply(f)` | array input -> multiple args |
| `core.unapply2(f)` | binary array input -> multiple args |
| `core.curry(f, arity?)` | Curry a function |
| `core.curry2(f)` | specialized binary curry |
| `core.uncurry(f)` | uncurry a curried function |
| `core.uncurry2(f)` | specialized binary uncurry |
| `core.partial(f, ...args)` | Partial application |
| `core.flip(f)` | Reverse all arguments |
| `core.flip2(f)` | Swap first two arguments |
| `core.flipC(f)` | Swap first two curried arguments |
| `core.negate(f)` | Invert predicate |
| `core.once(f)` | Execute only once (retries on error) |
| `core.catch(f, onError?)` | Wrap with try-catch |
| `core.runOrDefault(fallback)(f)`| Run f or return fallback |
| `core.predicate(f, fallback?)` | Safe boolean check (async protected) |
| `core.tap(...fs)` | Side effects, return original |
| `core.also(x)(...fs)` | Variadic side effects (x first) |
| `core.into(x)(...fs)` | Variadic transformation (x first) |
| `core.capture(...args)(f)` | bind arguments early |
| `core.useOrLift(check, lift)` | conditional lift |
| `core.useArrayOrLift(x)` | Ensure x is array |
| `core.range(n)` | [0, 1, ..., n-1] |
| `core.rangeBy(s, e)` | [s, ..., e-1] |

### either.js (~120 lines)

| Function/Method | Description |
|-----------------|-------------|
| `either.left(e)` | Create Left (normalized Error array) |
| `either.right(x)` | Create Right (success) |
| `either.catch(f)` | Wrap function → Either |
| `either.from(x)` | Value → Either |
| `either.fromNullable(x)` | null/undefined → Left |
| `either.validate(cond, err)` | Create validator |
| `either.validateAll(list)` | Accumulate errors |
| `either.sequence(list)` | Fail-fast sequence |
| `either.pipeK(...fs)` | Kleisli composition |
| `either.traverse(f)(list)` | Apply f to each, fail-fast |
| `either.traverseAll(f)(list)` | Apply f to each, collect errors |
| `.map(f)` | Transform Right value |
| `.mapLeft(f)` | Transform Left value |
| `.flatMap(f)` | Chain Either-returning function |
| `.filter(pred)` | Filter with predicate |
| `.fold(onLeft, onRight)` | Extract with handlers |
| `.ap(either)` | Apply with error accumulation |
| `.getOrElse(default)` | Get value or default |

### monoid.js (~90 lines)

| Function | Description |
|----------|-------------|
| `monoid.fold(M, mapFn?)(list)` | Fold list with Monoid |
| `monoid.concat(M)(a, b)` | Combine two values |
| `monoid.invert(M)(value)` | Get inverse (Group only) |
| `monoid.power(M)(value, n)` | Repeat n times |
| `monoid.number.{sum,product,max,min}` | Number monoids/groups |
| `monoid.string.concat` | String monoid |
| `monoid.boolean.{all,any,xor}` | Boolean monoids/groups |
| `monoid.array.concat` | Array monoid |
| `monoid.object.merge` | Object monoid |
| `monoid.function.endo` | Function composition monoid |
| `monoid.any.{first,last}` | First/last value monoids |

### free.js (~90 lines)

| Function | Description |
|----------|-------------|
| `free.pure(value)` | Wrap value in Pure |
| `free.impure(functor)` | Wrap functor in Impure |
| `free.liftF(functor)` | Lift Functor into Free |
| `free.runSync(runner)(program)` | Run synchronously |
| `free.runAsync(runner)(program)` | Run asynchronously |
| `free.done(value)` | Trampoline: finished (= pure) |
| `free.suspend(fn)` | Trampoline: continue |
| `free.trampoline(p)` | Create stack-safe function |

### task.js (~120 lines)

| Function/Method | Description |
|-----------------|-------------|
| `task.resolved(x)` | Create resolved Task |
| `task.rejected(e)` | Create rejected Task (Error array) |
| `task.of(x)` | Same as resolved |
| `task.fromPromise(fn)` | Wrap Promise-returning function |
| `task.fromEither(e)` | Convert Either to Task |
| `task.all(tasks)` | Run in parallel, collect results |
| `task.race(tasks)` | First to complete wins |
| `task.sequence(tasks)` | Run in order |
| `task.traverse(f)(list)` | Map then sequence |
| `task.pipeK(...fs)` | Kleisli composition |
| `.map(f)` | Transform resolved value |
| `.mapRejected(f)` | Transform rejected errors |
| `.flatMap(f)` | Chain Task-returning function |
| `.ap(task)` | Apply with error accumulation |
| `.fold(onRejected, onResolved)` | Transform both paths |
| `.run(onRejected, onResolved)` | Execute the Task |
| `.toPromise()` | Convert to Promise |
| `.toEither(callback)` | Convert to Either via callback |

### extra.js (~15 lines)

| Function | Description |
|----------|-------------|
| `extra.template(msg, data)` | Safe nested interpolation |

---

## Architecture

```
                    core.js (Types Protocol)
                           │
   ┌──────────────┬────────┴────────┬──────────────┐
   │              │                 │              │
either.js     monoid.js          free.js        task.js
 (Error)      (Algebra)          (Free)         (Async)
   │              │                 │              │
   └──────────────┴────────┬────────┴──────────────┘
                           │
                      extra.js
                       (Utils)
                           │
                      index.js
                    (Entry Point)
```

## Type Class Support

| Type | Functor | Applicative | Monad |
|------|---------|-------------|-------|
| Left/Right | ✅ | ✅ | ✅ |
| Task | ✅ | ✅ | ✅ |
| Pure/Impure | ✅ | - | ✅ |
| Thunk | ✅ | - | - |

---

## Philosophy

1. **Simplicity** - Small, focused functions
2. **Safety** - Errors as values, not exceptions
3. **Composition** - Build complex from simple
4. **Immutability** - No mutation, always new values
5. **Protocol** - Symbol-based type class markers

---

## License

MIT
