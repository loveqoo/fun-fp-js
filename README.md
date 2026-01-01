# Fun FP JS

A lightweight, dependency-free functional programming library for JavaScript.

**~795 lines** of pure functional goodness.

## Features

- 🎯 **Functional Core** - `pipe`, `compose`, `curry`, and more
- 🛡️ **Either Monad** - Safe error handling without try-catch
- ⏳ **Task Monad** - Lazy asynchronous operations (async Either)
- 🔢 **Monoid/Group** - Algebraic structures for composable operations
- 🔄 **Free Monad & Trampoline** - Stack-safe recursion
- 🔀 **Transducers** - Efficient data processing pipelines
- 📝 **Template Engine** - Safe, nested object string interpolation
- 🏷️ **Type Protocol** - Symbol-based type class markers
- 📦 **Zero Dependencies** - Pure JavaScript

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

### 1. `core` - Functional Core (~242 lines)

#### Types Protocol

Symbol-based type class markers for Functor, Applicative, and Monad.

```javascript
const lib = require('./index.js')();
const { core, either } = lib;
const { Types, isFunctor, isApplicative, isMonad } = core;

// Check type classes
isFunctor(either.right(5));     // true
isApplicative(either.right(5)); // true
isMonad(either.right(5));       // true

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
typeOf([1, 2, 3]);     // 'Array'
typeOf(new Set());     // 'Set'
typeOf(new Date());    // 'Date'
```

#### Function Composition

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { pipe, compose } = core;

const add1 = x => x + 1;
const double = x => x * 2;

pipe(add1, double)(5);     // 12 = (5 + 1) * 2
compose(add1, double)(5);  // 11 = (5 * 2) + 1
```

#### Currying & Partial Application

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { curry, curry2, uncurry, uncurry2, partial } = core;

const add = (a, b, c) => a + b + c;
const addCurried = a => b => c => a + b + c;

curry(add)(1)(2)(3);          // 6
uncurry(addCurried)(1, 2, 3); // 6

curry2((a, b) => a + b)(1)(2);    // 3
uncurry2(a => b => a + b)(1, 2);  // 3

partial(add, 10)(5, 3);           // 18
```

#### Higher-Order Functions

```javascript
const lib = require('./index.js')();
const { core } = lib;
const { flip, flip2, flipC, flipCV, negate, once } = core;

// flip: reverse all arguments
const sub = (a, b, c) => a - b - c;
flip(sub)(1, 2, 10);     // 7 = 10 - 2 - 1

// flip2: swap first two arguments
const minus = (a, b) => a - b;
flip2(minus)(1, 10);     // 9 = 10 - 1

// negate: invert predicate
const isEven = x => x % 2 === 0;
const isOdd = negate(isEven);
isOdd(3);                // true

// once: execute only once
const init = once(() => console.log('initialized'));
init(); init(); // logs once
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

// predicate: safe boolean check
const isPositive = predicate(x => x > 0);
isPositive(5);             // true
isPositive('not number');  // false (doesn't throw)
```

#### Side Effects

```javascript
const lib = require('./index.js')();
const { core, monoid } = lib;
const { tap, also, into, pipe, range } = core;

// tap: execute side effects, return original
const result = pipe(
    x => x * 2,
    tap(console.log),  // logs 10
    x => x + 1
)(5);
// result: 11

// also: data-first tap
const user = { id: 1, name: 'Test' };
also(user)(
    u => console.log('Saving:', u.id),
    u => console.log('Tracking:', u.name)
); // returns user

// into: data-first pipe
into(5)(
    range,                   // [0, 1, 2, 3, 4]
    list => list.map(x => x * 2),
    x => monoid.fold(monoid.number.sum)(x).getOrElse(0)
); // 20
```

#### Transducers (Point-free)

Efficient data processing pipeline without intermediate arrays.

```javascript
const { core } = require('./index.js')();
const { compose, transducer: { map, filter, take, transduce } } = core;

// transducer 정의 (compose로 Left→Right 데이터 흐름)
const transducer = compose(
    map(x => x + 1),         // Step 1: Add 1
    filter(x => x % 2 === 0), // Step 2: Keep evens
    take(2)                  // Step 3: Take first 2
);

// 실행: transduce(transducer)(reducer)(initialValue)(collection)
const reducer = (accumulator, value) => (accumulator.push(value), accumulator);
const initialValue = [];
const collection = [1, 2, 3, 4, 5];

const result = transduce(transducer)(reducer)(initialValue)(collection);
// [2, 4] — (1+1)=2✓, (2+1)=3✗, (3+1)=4✓, stops after 2
```

---

### 2. `either` - Error Handling Monad (~132 lines)

Either represents a value that can be one of two types:
- `Right(value)` - Success
- `Left(errors)` - Failure (normalized to Error objects in an array)

#### Creating Either

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { left, right, catch: eitherCatch, from, fromNullable } = either;

right(10);           // Right(10)
left('error');       // Left([Error: error])

eitherCatch(JSON.parse)('{"a":1}');    // Right({ a: 1 })
eitherCatch(JSON.parse)('invalid');    // Left([SyntaxError])

fromNullable(5);     // Right(5)
fromNullable(null);  // Left([Error])
```

#### Functor & Monad

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

// map
right(5).map(x => x * 2);     // Right(10)

// flatMap (chain operations that might fail)
const safeDivide = (a, b) => 
    b === 0 ? left('Division by zero') : right(a / b);

right(10)
    .flatMap(x => safeDivide(x, 2))  // Right(5)
    .flatMap(x => safeDivide(x, 0))  // Left([Error])
    .map(x => x * 2);                // skipped
```

#### Applicative (Validation Pattern)

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

const validateName = name =>
    name?.length > 0 ? right(name) : left('Name required');

const validateAge = age =>
    age > 0 ? right(age) : left('Age must be positive');

const createUser = name => age => ({ name, age });

// Accumulate ALL errors
right(createUser)
    .ap(validateName(''))
    .ap(validateAge(-1));
// Left(['Name required', 'Age must be positive'])
```

#### pipeK: Kleisli Composition

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { pipeK, catch: eitherCatch, right, left } = either;

const safeParse = eitherCatch(JSON.parse);
const getUser = obj => obj.user ? right(obj.user) : left('No user');
const getProfile = user => user.profile ? right(user.profile) : left('No profile');

const getProfileFromJson = pipeK(safeParse, getUser, getProfile);

getProfileFromJson('{"user":{"profile":{"name":"A"}}}');
// Right({ name: 'A' })

getProfileFromJson('{"user":{}}');
// Left(['No profile'])
```

#### traverse & traverseAll

```javascript
const lib = require('./index.js')();
const { either } = lib;

const validatePositive = x => 
    x > 0 ? either.right(x) : either.left(`${x} is not positive`);

// traverse: fail-fast
either.traverse(validatePositive)([1, -2, 3]);
// Left(['-2 is not positive'])

// traverseAll: collect ALL errors
either.traverseAll(validatePositive)([1, -2, -3]);
// Left(['-2 is not positive', '-3 is not positive'])
```

---

### 3. `monoid` - Algebraic Structures (~120 lines)

Monoid: A type with a binary operation (`concat`) and identity element (`empty`).

#### Built-in Monoids

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

// Number
M.fold(M.number.sum)([1, 2, 3, 4]);      // Right(10)
M.fold(M.number.product)([1, 2, 3, 4]);  // Right(24)
M.fold(M.number.max)([1, 5, 3]);         // Right(5)

// String, Boolean, Array, Object
M.fold(M.string.concat)(['a', 'b', 'c']); // Right('abc')
M.fold(M.boolean.all)([true, true]);      // Right(true)
M.fold(M.array.concat)([[1], [2], [3]]);  // Right([1, 2, 3])
M.fold(M.object.merge)([{a:1}, {b:2}]);   // Right({a:1, b:2})

// First/Last
M.fold(M.any.first)([1, 2, 3]);  // Right(1)
M.fold(M.any.last)([1, 2, 3]);   // Right(3)
```

#### foldMap & Groups

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

// foldMap: map + fold
M.fold(M.number.sum, s => s.length)(['hello', 'world']);
// Right(10)

// Groups have inverse
M.invert(M.number.sum)(5);      // Right(-5)
M.invert(M.number.product)(5);  // Right(0.2)

// power: repeat n times
M.power(M.number.sum)(3, 4);      // Right(12) = 3+3+3+3
M.power(M.string.concat)('a', 3); // Right('aaa')
```

---

### 4. `free` - Free Monad & Trampoline (~90 lines)

Free Monad represents computation as data, enabling stack-safe recursion.

#### Trampoline: Stack-Safe Recursion

```javascript
const lib = require('./index.js')();
const { free } = lib;
const { done, suspend, trampoline } = free;

const factorial = trampoline((n, acc = 1) =>
    n <= 1 
        ? done(acc)
        : suspend(() => factorial(n - 1, n * acc))
);

factorial(5);       // 120
factorial(100000);  // Works! No stack overflow!

// Fibonacci
const fib = trampoline((n, a = 0, b = 1) =>
    n <= 0
        ? done(a)
        : suspend(() => fib(n - 1, b, a + b))
);

fib(50);   // 12586269025
fib(1000); // Works!
```

---

### 5. `task` - Lazy Async Monad (~170 lines)

Task represents a lazy asynchronous computation - like a Promise, but:
- **Lazy**: Nothing runs until `.run()` is called
- **Error Accumulation**: Like Either, errors are arrays
- **Pure**: Same input always produces same output

#### Creating & Running Tasks

```javascript
const lib = require('./index.js')();
const { task, either } = lib;

task.resolved(42);              // Task that resolves to 42
task.rejected('error');         // Task that rejects
task.fromEither(either.right(10)); // From Either

// Must call run() to execute
task.resolved(42).run(
    errors => console.error('Failed:', errors),
    value => console.log('Success:', value)
);

// Convert to Promise
const result = await task.resolved(42).toPromise();
```

#### Functor & Monad

```javascript
const lib = require('./index.js')();
const { task } = lib;

task.resolved(5)
    .map(x => x * 2)
    .flatMap(x => task.resolved(x + 1))
    .run(console.error, console.log);
// Logs: 11
```

#### Combinators

```javascript
const lib = require('./index.js')();
const { task } = lib;

// all: parallel execution
task.all([task.resolved(1), task.resolved(2), task.resolved(3)])
    .run(console.error, console.log);
// Logs: [1, 2, 3]

// race: first to complete
task.race([task.resolved('fast'), task.resolved('slow')])
    .run(console.error, console.log);
// Logs: 'fast'

// pipeK: Kleisli composition
const fetchUser = id => task.resolved({ id, name: 'John' });
const getProfile = user => task.resolved({ avatar: 'pic.jpg' });

const getAvatar = task.pipeK(fetchUser, getProfile);
getAvatar(1).run(console.error, console.log);
// Logs: { avatar: 'pic.jpg' }
```

---

### 6. `extra` - Practical Utilities (~15 lines)

#### path: Safe Object Property Access

```javascript
const lib = require('./index.js')();
const { extra } = lib;
const { path } = extra;

const data = { user: { name: 'Anthony', address: { city: 'Seoul' } } };

path('user.name')(data);           // Right('Anthony')
path('user.address.city')(data);   // Right('Seoul')
path('user.phone')(data);          // Left([Error])
path('name')(null);                // Left([Error])
```

#### template: Safe String Interpolation

```javascript
const lib = require('./index.js')();
const { extra } = lib;
const { template } = extra;

const data = { user: { name: 'Anthony' } };

template('Hello, {{user.name}}!', data); 
// 'Hello, Anthony!'

template('Hello, {{ user.name }}!', data); // whitespace tolerant
// 'Hello, Anthony!'
```

---

## Real World Examples

### Safe API Call

```javascript
const lib = require('./index.js')();
const { either } = lib;
const { right, left } = either;

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
result.map(user => user.name).getOrElse('Unknown');
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
    e => e.flatMap(data => data.items ? right(data.items) : left('No items')),
    e => e.map(items => items.filter(x => x.active)),
    e => e.map(items => items.map(x => x.name)),
    e => e.getOrElse([])
);

processData('{"items":[{"name":"A","active":true}]}');
// ['A']
```

### Aggregating Results with Monoid

```javascript
const lib = require('./index.js')();
const { monoid: M } = lib;

const orders = [
    { product: 'A', qty: 2, price: 10 },
    { product: 'B', qty: 1, price: 25 },
    { product: 'C', qty: 3, price: 5 },
];

M.fold(M.number.sum, o => o.qty)(orders);           // Right(6)
M.fold(M.number.sum, o => o.qty * o.price)(orders); // Right(60)
M.fold(M.boolean.all, o => o.qty > 0)(orders);      // Right(true)
```

---

## API Reference

### core (~270 lines)

| Function | Description |
|----------|-------------|
| `Types` | Symbol-based type markers |
| `isFunctor(x)`, `isApplicative(x)`, `isMonad(x)` | Type checks |
| `identity(x)`, `constant(x)`, `tuple(...args)`, `raise(e)` | Basic utilities |
| `pipe(...fs)`, `compose(...fs)` | Function composition |
| `curry(f)`, `uncurry(f)`, `partial(f, ...args)` | Currying |
| `flip(f)`, `flip2(f)`, `flipC(f)`, `negate(f)` | Function transformers |
| `once(f)`, `catch(f, onError)`, `predicate(f)` | Safety utilities |
| `tap(...fs)`, `also(x)(...fs)`, `into(x)(...fs)` | Side effects |
| `transducer.{map, filter, take, transduce}` | Point-free transducers |

### either (~120 lines)

| Function/Method | Description |
|-----------------|-------------|
| `left(e)`, `right(x)` | Create Either |
| `catch(f)`, `from(x)`, `fromNullable(x)` | Safe creation |
| `validate(cond, err)`, `validateAll(list)` | Validation |
| `pipeK(...fs)` | Kleisli composition |
| `traverse(f)(list)`, `traverseAll(f)(list)` | Traversable |
| `.map(f)`, `.flatMap(f)`, `.ap(e)` | Transformations |
| `.fold(onLeft, onRight)`, `.getOrElse(default)` | Extraction |

### monoid (~90 lines)

| Function | Description |
|----------|-------------|
| `fold(M, f?)(list)` | Fold with Monoid |
| `concat(M)(a, b)` | Combine two values |
| `invert(M)(value)` | Get inverse (Groups only) |
| `power(M)(value, n)` | Repeat n times |
| `number.{sum,product,max,min}` | Number monoids |
| `string.concat`, `boolean.{all,any,xor}` | Other monoids |
| `array.concat`, `object.merge` | Collection monoids |

### free (~90 lines)

| Function | Description |
|----------|-------------|
| `pure(value)`, `impure(functor)` | Create Free |
| `done(value)`, `suspend(fn)` | Trampoline helpers |
| `trampoline(f)` | Create stack-safe function |
| `runSync(runner)(program)` | Run synchronously |

### task (~120 lines)

| Function/Method | Description |
|-----------------|-------------|
| `resolved(x)`, `rejected(e)`, `of(x)` | Create Task |
| `fromPromise(fn)`, `fromEither(e)` | Conversions |
| `all(tasks)`, `race(tasks)`, `sequence(tasks)` | Combinators |
| `pipeK(...fs)` | Kleisli composition |
| `.map(f)`, `.flatMap(f)`, `.ap(t)` | Transformations |
| `.run(onRejected, onResolved)` | Execute Task |
| `.toPromise()`, `.toEither(callback)` | Conversions |

### extra (~20 lines)

| Function | Description |
|----------|-------------|
| `path(keyStr)(data)` | Safe nested property access |
| `template(msg, data)` | Safe string interpolation |

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
```

## Type Class Support

| Type | Functor | Applicative | Monad |
|------|---------|-------------|-------|
| Either | ✅ | ✅ | ✅ |
| Task | ✅ | ✅ | ✅ |
| Free | ✅ | - | ✅ |

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
