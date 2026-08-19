# Monad

> 한국어: [../Monad.md](../Monad.md)

**A type that supports chaining and sequencing**

## Concept

In functional programming, Monad is a **pattern for safely handling side effects**.

Its core operation is `chain` (also known as `flatMap` or `bind`):
- pull the value out of the container and pass it to a function
- return the new container that function produces

This solves the **nested-container problem**.

## Why is Monad needed?

### The problem: Functor alone is not enough

```javascript
const { Maybe, Functor } = FunFP;
const { map } = Functor.lookup('maybe');

const getUser = id => Maybe.of({ id, name: 'Alice', addressId: 1 });
const getAddress = addrId => Maybe.of({ id: addrId, city: 'Seoul' });

// using map alone nests it!
const result = map(user => getAddress(user.addressId), getUser(1));
// Maybe(Maybe({ city: 'Seoul' }))  ← doubly nested!
```

### The fix: flatten it with chain

```javascript
const getAddress = addrId => Maybe.of({ id: addrId, city: 'Seoul' });
const getUser = id => Maybe.of({ id, name: 'Alice', addressId: 1 });
const { Chain } = FunFP;
const { chain } = Chain.lookup('maybe');

const result = chain(user => getAddress(user.addressId), getUser(1));
// Maybe({ city: 'Seoul' })  ← clean!

// or use pipeK
const getUserAddress = Maybe.pipeK(getUser, user => getAddress(user.addressId));
getUserAddress(1);  // Maybe({ city: 'Seoul' })
```

## Laws

### 1. Left Identity
```javascript no-run algebraic law — free-variable notation
const { chain } = Chain.lookup('maybe');
chain(f, of(a)) === f(a)
```
Wrapping a value with `of` and chaining it equals just calling the function.

### 2. Right Identity
```javascript no-run algebraic law — free-variable notation
const { chain } = Chain.lookup('maybe');
chain(of, m) === m
```
Chaining `of` onto a monad equals the original monad.

### 3. Associativity
```javascript no-run algebraic law — free-variable notation
const { chain } = Chain.lookup('maybe');
chain(g, chain(f, m)) === chain(x => chain(g, f(x)), m)
```
Changing the grouping of `chain` calls does not change the result.

## Interface

```javascript no-run signature / pseudocode
Monad.lookup(a): Monad a              // puts a value into the monad (inherited from Applicative)
Monad.chain(f, m): Monad b        // applies the transform function, then flattens
                                  // f: a -> Monad b
```

## Usage examples

### Maybe — null-safe chaining

```javascript
import FunFP from 'fun-fp-js';
const { Maybe, Functor, Chain } = FunFP;
const { map } = Functor.lookup('maybe');
const { chain } = Chain.lookup('maybe');

const db = {
    users: { 1: { name: 'Alice', teamId: 10 } },
    teams: { 10: { name: 'Dev Team', leaderId: 1 } }
};

const getUser = id => db.users[id] ? Maybe.of(db.users[id]) : Maybe.Nothing();
const getTeam = id => db.teams[id] ? Maybe.of(db.teams[id]) : Maybe.Nothing();

// the Static Land way
const teamName = map(
    team => team.name,
    chain(user => getTeam(user.teamId), getUser(1))
);
// Just('Dev Team')

// or use pipeK (more readable)
const getTeamName = Maybe.pipeK(
    getUser,
    user => getTeam(user.teamId)
);
map(team => team.name, getTeamName(1));  // Just('Dev Team')
```

### Either — error-handling chain

```javascript
const { Either, Chain } = FunFP;
const { chain } = Chain.lookup('either');

const parseNumber = str => {
    const n = parseInt(str);
    return isNaN(n) ? Either.Left('Not a number') : Either.Right(n);
};

const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left('Must be positive');

const validateMax = max => n =>
    n <= max ? Either.Right(n) : Either.Left(`Must be ≤ ${max}`);

// a validation pipeline with pipeK
const validate = Either.pipeK(
    parseNumber,
    validatePositive,
    validateMax(100)
);

validate('50');    // Right(50)
validate('abc');   // Left('Not a number')
validate('-5');    // Left('Must be positive')
validate('200');   // Left('Must be ≤ 100')
```

### Task — asynchronous chain

```javascript
const { Task, Chain, Functor } = FunFP;
const { chain } = Chain.lookup('task');
const { map } = Functor.lookup('task');

const fetchUser = id => Task.fromPromise(() => 
    fetch(`/api/users/${id}`).then(r => r.json())
)();

const fetchPosts = userId => Task.fromPromise(() =>
    fetch(`/api/users/${userId}/posts`).then(r => r.json())
)();

// the Static Land way
const getUserPosts = userId =>
    chain(
        user => map(posts => ({ user, posts }), fetchPosts(user.id)),
        fetchUser(userId)
    );

getUserPosts(1).fork(
    err => console.error('Error:', err),
    data => console.log('Data:', data)
);
```

## Visualizing Monad

```
chain flattens the nesting:

┌─────────────────┐              ┌─────────┐
│ ┌─────────────┐ │   chain(f)   │         │
│ │    value    │ │   ───────>   │  value  │
│ └─────────────┘ │              │         │
└─────────────────┘              └─────────┘
  Maybe(Maybe(x))                  Maybe(x)
```

## Monad vs Functor

| | Functor (map) | Monad (chain) |
|---|---|---|
| function type | `a -> b` | `a -> M b` |
| result | can nest | always one layer |
| use | simple transformation | conditional / sequential execution |

```javascript
const maybe = Maybe.of(42);
const { map } = Functor.lookup('maybe');
const { chain } = Chain.lookup('maybe');

// map: a simple transform that always succeeds
map(x => x + 1, maybe);

// chain: an operation that may fail
chain(x => x > 0 ? Maybe.of(x) : Maybe.Nothing(), maybe);
```

## pipeK vs composeK — Kleisli composition

Kleisli composition is a way of composing functions of the shape `a -> M b`.

### pipeK — left-to-right composition

```javascript
const { Maybe } = FunFP;

const parse = str => {
    const n = parseInt(str);
    return isNaN(n) ? Maybe.Nothing() : Maybe.of(n);
};
const double = n => Maybe.of(n * 2);
const asString = n => Maybe.of(`Result: ${n}`);

// pipeK: left → right (read left to right)
const pipeline = Maybe.pipeK(parse, double, asString);

pipeline('5');     // Just('Result: 10')
pipeline('abc');   // Nothing
```

### composeK — right-to-left composition (mathematical composition)

```javascript
const parse = str => {
    const n = parseInt(str);
    return isNaN(n) ? Maybe.Nothing() : Maybe.of(n);
};
const double = n => Maybe.of(n * 2);
const asString = n => Maybe.of(`Result: ${n}`);
const { Maybe } = FunFP;

// composeK: right → left (mathematical composition order)
const pipeline = Maybe.composeK(asString, double, parse);

pipeline('5');     // Just('Result: 10')
pipeline('abc');   // Nothing
```

**Same result, opposite direction:**
- `pipeK(f, g, h)` = f → g → h (read in sequence)
- `composeK(h, g, f)` = f → g → h (mathematical notation)

### Comparison table

| | pipeK | composeK |
|---|---|---|
| direction | left → right | right → left |
| reading | sequential (execution order) | mathematical (same as ∘ composition) |
| first argument | runs first | runs last |
| tends to be used for | pipelines, workflows | function-math style |

### Example: a validation pipeline with Either

```javascript
const { Either } = FunFP;

const parseNumber = str => {
    const n = parseInt(str);
    return isNaN(n) ? Either.Left('Not a number') : Either.Right(n);
};

const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left('Must be positive');

const double = n => Either.Right(n * 2);

// pipeK: an easy-to-read order
const validateAndDouble = Either.pipeK(
    parseNumber,
    validatePositive,
    double
);

// composeK: mathematical order (written in reverse)
const validateAndDouble2 = Either.composeK(
    double,
    validatePositive,
    parseNumber
);

validateAndDouble('5');    // Right(10)
validateAndDouble2('5');   // Right(10) - the same result
```

### Supported types

Every Monad type supports both `pipeK` and `composeK`:
- **Maybe**: a null-safe pipeline
- **Either**: an error-handling pipeline
- **Task**: an async workflow
- **Reader**: composition sharing an environment
- **Writer**: composition accumulating output (the registered instance is Array-Monoid-only — for any other Monoid use the `Monad.Writer(m)` factory, see [Writer](./Writer.md))
- **State**: composition threading state
- **Free**: DSL composition

```javascript
// Task example
const { Task } = FunFP;

const fetchUser = id => Task.fromPromise(() =>
    fetch(`/api/users/${id}`).then(r => r.json())
)();

const fetchPosts = user => Task.fromPromise(() =>
    fetch(`/api/users/${user.id}/posts`).then(r => r.json())
)();

const formatData = posts => Task.of({ count: posts.length, posts });

// an async pipeline with pipeK
const getUserData = Task.pipeK(fetchUser, fetchPosts, formatData);

getUserData(1).fork(console.error, console.log);
```

## Related type classes

- **Functor**: provides only `map`
- **Apply**: applies a function to several values
- **Applicative**: provides `of` (putting a value in)
- **Chain**: provides only `chain` (Monad minus `of` is Chain)
