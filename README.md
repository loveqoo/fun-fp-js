# Fun FP JS

A lightweight, dependency-free functional programming library for JavaScript.

**~360 lines** of pure functional goodness.

## Features

- 🎯 **Functional Core** - `pipe`, `compose`, `curry`, and more
- 🛡️ **Either Monad** - Safe error handling without try-catch
- 🔢 **Monoid/Group** - Algebraic structures for composable operations
- 🔄 **Free Monad & Stack-Safe Engine** - Computation as data + re-entrancy protection
- 📝 **Template Engine** - Safe, nested object string interpolation
- 🏷️ **Type Protocol** - Symbol-based type class markers
- 📦 **Zero Dependencies** - Pure JavaScript
- 🪶 **Lightweight** - ~360 lines total

## Installation

```javascript
const fp = require('./index.js')();

// Or with custom logger
const fp = require('./index.js')({ log: myLogger });
```

## Quick Start

```javascript
const fp = require('./index.js')();
const { pipe, right, left, done, suspend, trampoline } = fp;

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

### 1. `func` - Functional Core (124 lines)

#### Types Protocol

Symbol-based type class markers for Functor, Applicative, and Monad.

```javascript
const { Types, isFunctor, isApplicative, isMonad } = fp;

// Check type classes
isFunctor(right(5));     // true - has map + Symbol
isApplicative(right(5)); // true - has map, ap + Symbols
isMonad(right(5));       // true - has map, flatMap + Symbols

// Custom type with protocol
class MyFunctor {
    [Types.Functor] = true;
    map(f) { /* ... */ }
}
```

#### Basic Functions

```javascript
const { identity, constant, tuple, raise } = fp;

identity(5);           // 5
constant(10)();        // 10
tuple(1, 2, 3);        // [1, 2, 3]
raise(new Error('x')); // throws Error
```

#### Function Composition

```javascript
const { pipe, compose } = fp;

// pipe: left to right
const add1 = x => x + 1;
const double = x => x * 2;

pipe(add1, double)(5);     // 12 = (5 + 1) * 2
compose(add1, double)(5);  // 11 = (5 * 2) + 1
```

#### Argument Application (apply/unapply)

Transform how functions receive arguments.

```javascript
const { apply, unapply, apply2, unapply2 } = fp;

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
const { curry, curry2, uncurry, uncurry2, partial } = fp;

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
const { flip, flip2, flipC, negate, once } = fp;

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

// once: execute only once
const init = once(() => console.log('initialized'));
init(); // logs 'initialized'
init(); // nothing
```

#### Error Handling

```javascript
const { runCatch, predicate } = fp;

// runCatch: wrap function with try-catch
const safeJsonParse = runCatch(JSON.parse, err => ({}));
safeJsonParse('{"a":1}');  // { a: 1 }
safeJsonParse('invalid');  // {}

// predicate: safe boolean check (supports multiple args)
const isPositive = predicate(x => x > 0);
isPositive(5);             // true
isPositive('not number');  // false (doesn't throw)

const isSumEven = predicate((a, b) => (a + b) % 2 === 0);
isSumEven(1, 3);           // true
```

#### Side Effects

```javascript
const { tap, also, capture, useOrLift } = fp;

// tap: execute side effects, return original value
const result = pipe(
    x => x * 2,
    tap(console.log),  // logs 10
    x => x + 1
)(5);
// result: 11

// also: flipC(tap) - value first, then functions (short for tap)
also(5)(
    x => console.log('value:', x),
    x => saveToDb(x)
); // returns 5

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
const { converge, useArrayOrLift, range, rangeBy, runOrDefault } = fp;

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
useArrayOrLift([1, 2]); // [1, 2]
useArrayOrLift(5);      // [5]

// runOrDefault: run function or return fallback
runOrDefault('N/A')(() => { throw Error(); }); // 'N/A'
runOrDefault('N/A')(() => 'Success');         // 'Success'
```

---

### 2. `either` - Error Handling Monad (124 lines)

Either represents a value that can be one of two types:
- `Right(value)` - Success
- `Left(errors)` - Failure (normalized to Error objects in an array)

#### Creating Either

```javascript
const { left, right, attempt, from, fromNullable } = fp;

// Direct creation
right(10);           // Right(10)
left('error');       // Left([Error: error])

// From function (catches errors)
attempt(JSON.parse)('{"a":1}');    // Right({ a: 1 })
attempt(JSON.parse)('invalid');    // Left([SyntaxError])

// From value
from(5);             // Right(5)
fromNullable(5);     // Right(5)
fromNullable(null);  // Left([Error])
```

#### Functor: map & mapLeft

```javascript
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
// Define safe operations
const safeDivide = (a, b) => 
    b === 0 ? left('Division by zero') : right(a / b);

const safeDouble = x => 
    right(x * 2);

const safeToString = x => 
    right(`Result: ${x}`);

// Chain them beautifully
right(10)
    .flatMap(x => safeDivide(x, 2))    // Right(5)
    .flatMap(x => safeDouble(x))        // Right(10)
    .flatMap(x => safeToString(x));     // Right('Result: 10')

// If any step fails, the chain short-circuits
right(10)
    .flatMap(x => safeDivide(x, 0))    // Left([Error: Division by zero])
    .flatMap(x => safeDouble(x))        // skipped
    .flatMap(x => safeToString(x));     // skipped
```

#### Applicative: ap (Validation Pattern)

```javascript
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
const { pipeK, attempt } = fp;

// Define your safe operations
const safeParse = attempt(JSON.parse);

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
const { traverse, traverseAll } = fp;

// Define a validation function
const validatePositive = x => 
    x > 0 ? right(x) : left(`${x} is not positive`);

// traverse: fail-fast (stops at first error)
traverse(validatePositive)([1, 2, 3]);
// Right([1, 2, 3])

traverse(validatePositive)([1, -2, 3]);
// Left(['-2 is not positive'])

// traverseAll: collect ALL errors
traverseAll(validatePositive)([1, -2, -3]);
// Left(['-2 is not positive', '-3 is not positive'])
```

#### 🛡️ Error Handling Philosophy

This library distinguishes between **Operational Errors** and **Developer Errors**:

1.  **Operational Errors** (e.g., invalid user input, API failure): Handled via `Either` (`Left`). These represent expected failure states and do not interrupt the program flow.
2.  **Developer Errors** (e.g., incorrect library setup, type mismatches in composition): Handled via **Exceptions** (`TypeError`). We throw immediately to help you catch bugs during development.

> **Note on `ap`**: If you call `.ap()` on a `Right(x)` where `x` is not a function, the library will throw a `TypeError`. This is because Applicative Functor pattern (`ap`) strictly requires a function to be wrapped in the first `Right`.

---

### 3. `monoid` - Algebraic Structures (91 lines)

Monoid: A type with a binary operation (`concat`) and identity element (`empty`).

```
concat(a, empty) === a
concat(empty, a) === a
concat(a, concat(b, c)) === concat(concat(a, b), c)
```

#### Built-in Monoids (by type)

```javascript
const M = fp.monoid;

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
// Sum lengths of strings
M.fold(M.number.sum, s => s.length)(['hello', 'world']);
// Right(10)

// All positive?
M.fold(M.boolean.all, x => x > 0)([1, 2, 3]);
// Right(true)
```

#### Groups (Monoid + invert)

```javascript
// sum, product, xor have inverse operations
M.invert(M.number.sum)(5);      // Right(-5)
M.invert(M.number.product)(5);  // Right(0.2)
M.invert(M.boolean.xor)(true);  // Right(true) - self-inverse!

// max and min don't have inverses
M.invert(M.number.max)(5);      // Left(TypeError)
```

#### power: Repeat n times

```javascript
M.power(M.number.sum)(3, 4);      // Right(12) = 3+3+3+3
M.power(M.string.concat)('a', 3); // Right('aaa')
```

---

### 4. `free` - Free Monad & Trampoline (73 lines)

Free Monad represents computation as data, enabling:
- **Trampolining** - Stack-safe recursion
- **Interpreter pattern** - Separate definition from execution

#### Structure

```javascript
Pure(value)     // Computation finished with value
Impure(functor) // More computation to do
```

#### Basic Usage

```javascript
const { pure, liftF, runSync } = fp;

// pure: wrap a value
pure(5);  // Pure(5)

// liftF: lift a Functor into Free
liftF(someFunctor);  // Impure(Functor<Pure>)
```

#### Trampoline: Stack-Safe Recursion

```javascript
const { done, suspend, trampoline } = fp;

// done: computation finished (= pure)
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
const fib = trampoline((n, a = 0, b = 1) =>
    n <= 0
        ? done(a)
        : suspend(() => fib(n - 1, b, a + b))
);

fib(10);   // 55
fib(50);   // 12586269025
fib(1000); // Works!
```

#### Custom Runner (Interpreter Pattern)

```javascript
const { runSync, runAsync, isImpure } = fp;

// runSync: synchronous execution with custom runner
const myRunner = functor => functor.run();
runSync(myRunner)(program);

// stackSafe: Re-entrancy guard for infinite recursion
const safeFn = stackSafe(myRunner, originalFn);
```

#### Trampoline & StackSafe

The `trampoline` function uses a `stackSafe` guard internally to prevent stack overflow even when recursive functions are wrapped in decorators.

```javascript
const { stackSafe, runSync, trampoline } = fp;

// Manual stack safety guard
const safeRecursive = stackSafe(
    runSync(thunk => thunk.run()), // runner
    program                        // original function
)(program);
```

---

### 5. `extra` - Practical Utilities (13 lines)

Practical tools built using the base functional modules.

#### template: Safe String Interpolation

Uses `Either` internally to safely navigate nested objects and provide fallbacks.

```javascript
const { template } = fp;

const data = {
    user: {
        name: 'Anthony',
        settings: { theme: 'dark' }
    },
    items: ['apple']
};

// 1. Simple & Nested keys
template('Hello, {{user.name}}!', data); 
// 'Hello, Anthony!'

template('Mode: {{user.settings.theme}}', data);
// 'Mode: dark'

// 2. Falsy value support (0, false, "")
template('Value: {{val}}', { val: 0 }); 
// 'Value: 0'

// 3. Safe fallback (returns original tag if path is broken)
template('Missing: {{user.profile.age}}', data);
// 'Missing: {{user.profile.age}}'
```

---

## Real-World Examples

### Safe API Call

```javascript
const { attempt, right, left } = fp;

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
const { right, validate } = fp;

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
const { pipe, attempt, right, left } = fp;

const processData = pipe(
    attempt(JSON.parse),
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
const M = fp.monoid;

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
const { done, suspend, trampoline } = fp;

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

### func.js (120 lines)

| Function | Description |
|----------|-------------|
| `Types` | Symbol-based type markers (Functor, Applicative, Monad) |
| `isFunctor(x)` | Check if x is a Functor |
| `isApplicative(x)` | Check if x is an Applicative |
| `isMonad(x)` | Check if x is a Monad |
| `identity(x)` | Returns x |
| `constant(x)` | Returns () => x |
| `tuple(...args)` | Returns arguments as an array |
| `raise(e)` | Throws e |
| `pipe(...fs)` | Left-to-right composition |
| `compose(...fs)` | Right-to-left composition |
| `apply(f)` | multiple args -> array input |
| `apply2(f)` | binary multiple args -> array input |
| `unapply(f)` | array input -> multiple args |
| `unapply2(f)` | binary array input -> multiple args |
| `curry(f, arity?)` | Curry a function |
| `curry2(f)` | specialized binary curry |
| `uncurry(f)` | uncurry a curried function |
| `uncurry2(f)` | specialized binary uncurry |
| `partial(f, ...args)` | Partial application |
| `flip(f)` | Reverse all arguments |
| `flip2(f)` | Swap first two arguments |
| `flipC(f)` | Swap first two curried arguments |
| `negate(f)` | Invert predicate |
| `once(f)` | Execute only once |
| `runCatch(f, onError?)` | Wrap with try-catch |
| `runOrDefault(fallback)(f)`| Run f or return fallback |
| `predicate(f, fallback?)` | Safe boolean check (variadic) |
| `tap(...fs)` | Side effects, return original |
| `also(x)(...fs)` | Side effects (x first), return x |
| `capture(...args)(f)` | bind arguments early |
| `useOrLift(check, lift)` | conditional lift |
| `useArrayOrLift(x)` | Ensure x is array |
| `range(n)` | [0, 1, ..., n-1] |
| `rangeBy(s, e)` | [s, ..., e-1] |

### either.js (124 lines)

| Function/Method | Description |
|-----------------|-------------|
| `left(e)` | Create Left (normalized Error array) |
| `right(x)` | Create Right (success) |
| `attempt(f)` | Wrap function → Either |
| `from(x)` | Value → Either |
| `fromNullable(x)` | null/undefined → Left |
| `validate(cond, err)` | Create validator |
| `validateAll(list)` | Accumulate errors |
| `sequence(list)` | Fail-fast sequence |
| `pipeK(...fs)` | Kleisli composition |
| `traverse(f)(list)` | Apply f to each, fail-fast |
| `traverseAll(f)(list)` | Apply f to each, collect errors |
| `.map(f)` | Transform Right value |
| `.mapLeft(f)` | Transform Left value |
| `.flatMap(f)` | Chain Either-returning function |
| `.filter(pred)` | Filter with predicate |
| `.fold(onLeft, onRight)` | Extract with handlers |
| `.ap(either)` | Apply with error accumulation |
| `.getOrElse(default)` | Get value or default |

### monoid.js (91 lines)

| Function | Description |
|----------|-------------|
| `monoid(check, concat, empty)` | Create Monoid |
| `group(check, concat, empty, invert)` | Create Group |
| `isMonoid(obj)` | Check if Monoid |
| `fold(M, mapFn?)(list)` | Fold list with Monoid |
| `concat(M)(a, b)` | Combine two values |
| `invert(M)(value)` | Get inverse (Group only) |
| `power(M)(value, n)` | Repeat n times |
| `number.{sum,product,max,min}` | Number monoids/groups |
| `string.concat` | String monoid |
| `boolean.{all,any,xor}` | Boolean monoids/groups |
| `array.concat` | Array monoid |
| `object.merge` | Object monoid |
| `function.endo` | Function composition monoid |
| `any.{first,last}` | First/last value monoids |

### free.js (73 lines)

| Function | Description |
|----------|-------------|
| `pure(value)` | Wrap value in Pure |
| `impure(functor)` | Wrap functor in Impure |
| `isPure(x)` | Check if Pure |
| `isImpure(x)` | Check if Impure |
| `liftF(functor)` | Lift Functor into Free |
| `runSync(runner)(program)` | Run synchronously (with smart unboxing) |
| `runAsync(runner)(program)` | Run asynchronously (with smart unboxing) |
| `stackSafe(runner, f, onReentry?)` | Re-entrancy guard for stack safety |
| `done(value)` | Trampoline: finished (= pure) |
| `suspend(fn)` | Trampoline: continue (uses liftF + Thunk) |
| `trampoline(program)` | Compile to stack-safe executable function |

### extra.js (13 lines)

| Function | Description |
|----------|-------------|
| `template(msg, data)` | Safe nested interpolation using Either |

---

## Architecture

```
                    func.js (Types Protocol)
                           │
   ┌──────────────┬────────┴────────┬──────────────┐
   │              │                 │              │
either.js     monoid.js          free.js        extra.js
 (Error)      (Algebra)          (Free)        (Utils)
   │              │                 │              │
   └──────────────┴────────┬────────┴──────────────┘
                           │
                      index.js
                    (Entry Point)
```

## Type Class Support

| Type | Functor | Applicative | Monad |
|------|---------|-------------|-------|
| Left/Right | ✅ | ✅ | ✅ |
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
