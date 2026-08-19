# Fun-FP-JS Guide

> 한국어: [../README.md](../README.md)

A documentation set for the functional-programming type classes.

## Start here — `lookup` and `of` {#lookup-of}

This library starts from two functions, `lookup` and `of`, and they play different roles. Which
one you should reach for splits right here.


| Call             | What it does                            | Where it lives                       | Example                  |
| ---------------- | ---------------------------------------- | ------------------------------------- | ------------------------ |
| `lookup(key)`     | **pulls a tool (an instance) from a registry** | Type classes (`Monoid`, `Functor`, …) | `Monoid.lookup('array')` |
| `of(value)`       | **puts a value into a box**               | Data types (`Maybe`, `Task`, …)        | `Maybe.of(1)`             |


Type classes have no `of`. But the **instance you pull out** with `lookup` sometimes carries an
`of` of its own (the `Applicative` family). Even then, the order is "pull it out first, then use
that tool to put something in."

```javascript
const { Monoid, Maybe, Applicative } = FunFP;

// lookup: pulls a tool out of the registry — an operation bundle, not a value
const arrayMonoid = Monoid.lookup('array');
console.log(arrayMonoid.concat([1], [2]));   // [1, 2]

// of: puts a value into a box
console.log(Maybe.of(1).isJust());           // true

// the instance you pull out sometimes carries its own of — pull it out first, then use it to put something in
console.log(Applicative.lookup('maybe').of(1).isJust());   // true

// calling it the other way throws — lookup does not accept a value
let thrown = '';
try { Monoid.lookup([1, 2]); } catch (e) { thrown = e.constructor.name; }
console.log(thrown);   // 'TypeError'
```

## Recommended learning order

### Stage 1: basic algebraic structures

- [Setoid](./Setoid.md) - equality comparison
- [Ord](./Ord.md) - order comparison
- [Semigroup](./Semigroup.md) - an associative operation
- [Monoid](./Monoid.md) - associativity + identity
- [Group](./Group.md) - associativity + identity + inverse

### Stage 2: core container types

#### Basic containers

- [Maybe](./Maybe.md) - null-safe handling
- [Either](./Either.md) - error handling (fail-fast)
- [Validation](./Validation.md) - error accumulation (parallel validation)
- [NonEmptyList](./NonEmptyList.md) - a list that can never be empty (folds without a Monoid)

#### Async

- [Task](./Task.md) - asynchronous processing

#### Environment / state management

- [Reader](./Reader.md) - environment-based computation (dependency injection)
- [Writer](./Writer.md) - output tracking (logging)
- [State](./State.md) - state transformation

#### Advanced

- [Free](./Free.md) - stack-safe recursion, building DSLs

#### Working with data

- [Optics](./Optics.md) - an overview of Lens/Prism/Traversal and how they compose (**start here**)
- [Lens](./Lens.md) - composable accessors for nested immutable data
- [Transducer](./Transducer.md) - transformation pipelines with no intermediate arrays
- [Actor](./Actor.md) - a stateful container that processes messages sequentially

### Stage 3: transformation and composition

- [Functor](./Functor.md) - transforming values (map)
- [Applicative](./Applicative.md) - applying a function across several values (ap)
- [Monad](./Monad.md) - sequential execution (chain)
- [MonadError](./MonadError.md) - failure as a first-class citizen (raiseError/handleError, **outside the spec**)

### Stage 4: advanced patterns

- [Traversable](./Traversable.md) - traversing effects (traverse)
- [Foldable](./Foldable.md) - reduction (reduce)
- [Reducible](./Reducible.md) - reduction with no empty case (reduceLeft/reduceMap, **outside the spec**)
- [Filterable](./Filterable.md) - filtering

### Stage 5: function composition

- [Semigroupoid](./Semigroupoid.md) - function composition
- [Category](./Category.md) - function composition + identity function

### Stage 6: choosing between alternatives

- [Alt](./Alt.md) - choosing an alternative
- [Plus](./Plus.md) - the empty alternative
- [Alternative](./Alternative.md) - Applicative + Plus

### Stage 7: specialized transformations

- [Bifunctor](./Bifunctor.md) - two-way transformation
- [Contravariant](./Contravariant.md) - transforming the input
- [Profunctor](./Profunctor.md) - transforming input and output
- [Strong · Choice · Wander](./Profunctor.md#extensions) - the three profunctor extensions (**outside the spec** — used by optics)

### Stage 8: recursion and Comonad

- [ChainRec](./ChainRec.md) - stack-safe recursion
- [Extend](./Extend.md) - context-based transformation
- [Comonad](./Comonad.md) - the dual of Monad

### Stage 9: Monad Transformers

Composing two monads gives you combinations like "state + failure" or "environment + async".
It's built on top of [Free](./Free.md), so it's stack-safe.

**Read [StateT](./StateT.md) first.** The four transformers' shared concepts (`of`/`lift`, the
rule that `M` must be a string) are laid out there, and the other three refer back to it.

- [StateT](./StateT.md) - state transitions + effects (includes the shared concepts)
- [EitherT](./EitherT.md) - error handling + effects (`EitherT('task')` is the representative combination)
- [ReaderT](./ReaderT.md) - dependency injection + effects
- [WriterT](./WriterT.md) - output accumulation + effects

## Abstract functions

Higher-order functions built by combining type classes:


| Function   | Signature                                          | Description                          |
| ---------- | --------------------------------------------------- | ------------------------------------- |
| `sequence` | `(Traversable, Applicative, u) -> Applicative u`     | Flipping effects inside out           |
| `lift`     | `Applicative -> (a -> b) -> (F a -> F b)`            | Lifting a function into a container's context |
| `pipeK`    | `(Monad, Foldable?) -> [a -> M b] -> a -> M b`       | Kleisli composition (left to right)   |
| `composeK` | `(Monad, Foldable?) -> [a -> M b] -> a -> M b`       | Kleisli composition (right to left)   |
| `foldMap`  | `(Foldable, Monoid) -> (a -> b) -> F a -> b`         | Map, then reduce with a Monoid        |


## Type class dependency graph

This carries over the Static Land spec's "support X algebra for the same T" as-is. You need what's
on the left of an arrow to get what's on the right, and `+` means you need both.
`tests/staticland-spec.test.js` cross-checks this list against the code and the type
declarations. If the three ever diverge, the test stops.

```
Setoid ──────────────> Ord
Semigroup ───────────> Monoid ──> Group
Semigroupoid ────────> Category

Functor ─────────────> Apply ──> Applicative
Apply ───────────────> Chain ──> ChainRec
Functor ─────────────> Alt ────> Plus
Applicative + Chain ─> Monad
Applicative + Plus ──> Alternative
Functor ─────────────> Extend ──> Comonad
Functor + Foldable ──> Traversable

Bifunctor, Profunctor — the type with its first parameter fixed must be a Functor (not the same T)
Filterable, Contravariant — no superclass is required

outside the spec — profunctor extensions that optics require
Profunctor ──────────> Strong          first · second
Profunctor ──────────> Choice          left  · right
Strong + Choice ─────> Wander          wander
```

The last three aren't in the Static Land spec. Optics require them, so they're implemented
explicitly, and which optic each one produces is covered in [Optics](./Optics.md). Rationale:
[internals.md#optics](./internals.md#optics).

## Core concepts, summarized

### Type classes


| Type class    | Core operation   | One-line description |
| -------------- | ---------------- | --------------------- |
| Setoid         | equals            | Are they equal?        |
| Ord            | lte               | Order comparison       |
| Semigroup      | concat            | Combining               |
| Monoid         | empty             | The empty value         |
| Group          | invert            | The inverse             |
| Functor        | map               | Transforming             |
| Contravariant  | contramap         | Transforming the input  |
| Profunctor     | promap            | Transforming input/output |
| Bifunctor      | bimap             | Two-way transformation  |
| Apply          | ap                | Applying across several values |
| Applicative    | of                | Putting a value in       |
| Chain          | chain             | Sequential execution     |
| ChainRec       | chainRec          | Stack-safe recursion     |
| Monad          | of + chain        | The full sequential pattern |
| MonadError     | raiseError + handleError | Creating and catching failure (outside the spec) |
| Alt            | alt               | Choosing an alternative  |
| Plus           | zero              | The empty alternative    |
| Alternative    | ap + alt + zero   | Applicative + Plus       |
| Foldable       | reduce            | Reduction                |
| [Reducible](./Reducible.md) | reduceLeft + reduceMap | Folding with no empty case (outside the spec) |
| Traversable    | traverse          | Traversing effects       |
| Filterable     | filter            | Filtering out             |
| Semigroupoid   | compose           | Function composition      |
| Category       | id                | The identity function     |
| Extend         | extend            | Context transformation    |
| Comonad        | extract           | Extracting a value        |


### `lookup` and `of` — two names doing different jobs


|              | What it does                          | Where it lives                                              |
| ------------ | -------------------------------------- | ------------------------------------------------------------ |
| `lookup(key)` | **pulls an instance from the registry** | The 26 type classes (`Functor`, `Monoid`, …)                 |
| `of(value)`   | **puts a value into a container**       | The 9 data types (`Maybe`, `Either`, …) and `Applicative` instances |


```javascript
const { Maybe, Functor, Applicative } = FunFP;

Functor.lookup('maybe')            // pulls out the MaybeFunctor instance
Maybe.of(1)                        // Just(1) — puts a value in
Applicative.lookup('maybe').of(1)  // pulls it out, then puts one in

Maybe.of('array')                  // Just('array') — not a lookup
```

If one name did both jobs, that last line would read as a lookup. That's why type classes have
no `of` — `Functor.of` is `undefined`.

### `Algebra.all(type)` — every instance of one type, at once

`lookup` pulls out one instance. When you need several instances of the same type, instead of
calling them one at a time, receive them all through `Algebra.all` and destructure. `Algebra` is
the top-level class every instance inherits from. Pull from one type class and you get one
instance; pull from the root and you get every instance of that type.

```javascript
const { Algebra } = FunFP;

const { arraySemigroup, arrayFoldable, arrayTraversable } = Algebra.all('array');

console.log(arraySemigroup.concat([1], [2]));            // [1, 2]
console.log(arrayFoldable.reduce((a, b) => a + b, 0, [1, 2, 3]));  // 6
```

Names are **camelCase**. The class name is used as-is (`ArraySemigroup` → `arraySemigroup`), and
anything built from an assembled key gets its key fragment prefixed
(`maybe(array)`'s Semigroup → `maybeArraySemigroup`).

```javascript
const { Algebra: A } = FunFP;

const { maybeMonoid } = A.all('maybe');
console.log(maybeMonoid.empty().isNothing());   // true   ← derived from Plus
console.log(A.all('array').arrayMonoid.empty());  // []   ← Array uses its original ArrayMonoid
```

Three things to remember.


|                                                     |                                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Keys are **lowercase only**                          | `Algebra.all('Array')` throws. So does a type that doesn't exist.                                                                       |
| Grouped by **`.type`**, not by registry key           | `Semigroupoid`'s `maybe` instance is Kleisli composition, so its `.type` is `'function'` — it's in `all('function')`, not `all('maybe')`. |
| **"what exists right now", not an enumeration**       | A parameterized instance only appears once its factory has been called. After `Semigroup.Maybe('number')`, `all('maybe')` gains `maybeNumberSemigroup` too. |


Key order is not a promise. Destructure by name instead. `Object.keys` order follows registration
order, so it shifts whenever the library's internals change.

The third item isn't a limitation — it's a deliberate design choice. The inner type space isn't
closed, so it can't be enumerated in advance. `maybe(maybe(maybe(array)))` works too. **The inner
type is just a hint; if you need to name one exactly, `lookup` it by its assembled key.**

```javascript
const { Semigroup, Maybe } = FunFP;

const inner = Semigroup.lookup('maybe(number)');          // exactly one, by its explicit key
console.log(inner.concat(Maybe.Just(1), Maybe.Just(2)));  // Just { value: 3, _typeName: 'Maybe' }
```

### Registry keys — the parameterized ones

`Functor.lookup('array')`-style **type names** are the default, but there are assembled keys too.


| Key shape           | Meaning                                                    | Example                                   | Docs                              |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------ | ---------------------------------- |
| `<type>`              | That type's default instance                                  | `array`, `maybe`, `number`                 | Each type's own doc                |
| `<ClassName>`         | A different instance of the same type                         | `NumberProductMonoid`, `NumberMaxMonoid`   | [Monoid](./Monoid.md)              |
| `maybe(<inner>)`      | A Maybe with its inner Semigroup specified                    | `maybe(first)`, `maybe(array)`             | [Monoid](./Monoid.md)              |
| `<type>`              | **A Monoid derived from `Plus`** — only when that type has no Monoid of its own | `Monoid.lookup('maybe')`                   | [Plus](./Plus.md)                 |
| `const(<monoid>)`     | **The `Const` Applicative**                                    | `const(array)`, `const(number)`            | [Applicative](./Applicative.md)   |
| `writer(<monoid>)`    | **The `Writer` monad using that Monoid** — the registered `writer` is Array-only | `writer(number)`, `writer(string)`         | [Writer](./Writer.md)             |
| `statet(<M>)` etc.    | Transformer                                                    | `statet(maybe)`, `eithert(task)`           | [StateT](./StateT.md)             |


`identity` is also registered in seven places (`Functor`/`Apply`/`Applicative`/`Extend`/`Comonad`/
`Foldable`/`Reducible`). Passing it to `traverse` for "just mapping" is its main use
([Applicative](./Applicative.md)).

### Data types


| Type                            | Main use                          | Key traits                                                              |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| Identity                         | An effect-free wrapper                | Pass it to `traverse` for "just mapping"                                   |
| Maybe                             | Null-safe handling                    | Just / Nothing                                                              |
| Either                            | Error handling (fail-fast)            | Right / Left                                                                |
| Validation                        | Parallel validation (error accumulation) | Valid / Invalid (Monoid)                                                    |
| Task                              | Asynchronous processing                | A lazy Promise                                                              |
| Reader                            | Dependency injection                   | Propagating an environment                                                  |
| Writer                            | Logging / output tracking              | A value + output (Monoid)                                                   |
| State                             | State transformation                   | Threading state                                                             |
| Free                              | Separating program from execution, stack-safe recursion | Pure / Impure — [Free.api](./Free.md#api) lets you use Free without knowing it |
| [Optics](./Optics.md)            | Partial access and update              | The `Optics` module — Lens/Prism/Traversal, `compose`, `foldMapOf`          |
| [Lens](./Lens.md)                | Immutable updates on nested data       | A getter/setter pair, targets exactly one value                            |
| [Transducer](./Transducer.md)    | Transformation pipelines               | No intermediate arrays, early exit                                         |
| [Actor](./Actor.md)              | Sequential message processing          | A queue + state, `send` is a Task                                          |


### Monad Transformers

Composing two monads. **Pass `M` as a string** (`StateT('maybe')`). Passing an object makes the
type name depend on execution order. See [StateT](./StateT.md) for details.


| Type                      | Composition | Running it            | Result            |
| -------------------------- | ------------ | ----------------------- | -------------------- |
| [StateT](./StateT.md)     | State + M    | `runState(s, p)`        | `M [a, s]`            |
| [EitherT](./EitherT.md)   | Either + M   | `runEitherT(p)`         | `M (Either e a)`      |
| [ReaderT](./ReaderT.md)   | Reader + M   | `runReaderT(env, p)`    | `M a`                 |
| [WriterT](./WriterT.md)   | Writer + M   | `runWriterT(p)`         | `M [a, w]`            |


## Common patterns

### Safe null handling (Maybe.pipeK)

```javascript
const { Maybe } = FunFP;

const getAddress = user => user.address ? Maybe.of(user.address) : Maybe.Nothing();
const getCity = addr => addr.city ? Maybe.of(addr.city) : Maybe.Nothing();

// chain cleanly with pipeK
const getCityFromUser = Maybe.pipeK(getAddress, getCity);

getCityFromUser({ name: 'Alice', address: { city: 'Seoul' } });  // Just('Seoul')
getCityFromUser({ name: 'Bob' });  // Nothing
```

### An error-handling pipeline (Either.pipeK)

```javascript
const { Either } = FunFP;

const parseNumber = str => {
    const n = parseInt(str);
    return isNaN(n) ? Either.Left('Not a number') : Either.Right(n);
};
const validatePositive = n => n > 0 ? Either.Right(n) : Either.Left('Must be positive');

// build a validation pipeline with pipeK
const validate = Either.pipeK(parseNumber, validatePositive);

validate('50');   // Right(50)
validate('abc');  // Left('Not a number')
validate('-5');   // Left('Must be positive')
```

### Sequential asynchronous execution

```javascript
const fetchUser = id => Task.of({ id, name: 'Alice' });
const { Chain, Task } = FunFP;
const { chain } = Chain.lookup('task');

const fetchData = userId =>
    chain(user => fetchPosts(user.id),
        chain(posts => fetchComments(posts[0].id),
            fetchUser(userId)));

fetchData(1).fork(console.error, console.log);
```

### Running in parallel, then combining

```javascript
const fetchComments = postId => Task.of([{ id: 1, postId, body: 'a comment' }]);
const fetchPosts = userId => Task.of([{ id: 1, userId, title: 'first post' }]);
const fetchUser = id => Task.of({ id, name: 'Alice' });
const { Task } = FunFP;

Task.all([
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1)
]).fork(
    console.error,
    ([user, posts, comments]) => ({ user, posts, comments })
);
```

### Improving readability with the pipe utility

```javascript
const userId = 1;
const fetchUser = id => Task.of({ id, name: 'Alice' });
const fetchPosts = uid => Task.of([{ id: 10, uid, title: 'first post' }]);
const fetchComments = postId => Task.of([{ id: 100, postId, body: 'a comment' }]);
const { pipe, Chain } = FunFP;
const { chain } = Chain.lookup('task');

// pipe returns a function — pass functions in, not values, and apply it last
pipe(
    task => chain(user => fetchPosts(user.id), task),
    task => chain(posts => fetchComments(posts[0].id), task)
)(fetchUser(userId)).fork(console.error, console.log);
```

## To modify `index.js`

[Internals](./internals.md) — the `.type` convention, `'any'`, deriving `Plus`→`Monoid`,
Identity/Const, where the validation layers peel off, the Profunctor encoding behind optics,
transformer registration, the registry's write path. Source comments carry only a one-line
hint, and the rationale is collected over there.

## Learn more

- [Static Land Specification](https://github.com/fantasyland/static-land)
- [Fantasy Land Specification](https://github.com/fantasyland/fantasy-land)
