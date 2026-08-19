# Applicative

> 한국어: [../Applicative.md](../Applicative.md)

**A type that applies a function across several values**

## Concept

Applicative lets you **apply a function across several Functor values**.

Functor's `map` can only apply a function of one argument:
```javascript
const { map } = Functor.lookup('maybe');
map(x => x + 1, Maybe.Just(5))  // Maybe.Just(6)
```

What if the function needs two or more arguments?
```javascript
const add = a => b => a + b;  // a curried function
const { map } = Functor.lookup('maybe');
// how do you apply add = (a, b) => a + b to Maybe.Just(5) and Maybe.Just(3)?
map(add, Maybe.Just(5))  // Maybe.Just(b => 5 + b) - becomes a partially applied function
// how do you apply this function to Maybe.Just(3)?
```

This is where `ap` comes in.

## Interface

```javascript no-run signature / pseudocode
Apply.ap(mf, mv): Apply b   // mf: Apply (a -> b), mv: Apply a
Applicative.lookup(a): Applicative a  // wraps a value in an Applicative
```

## Laws

### Identity
```javascript no-run algebraic law — free-variable notation
const { ap } = Apply.lookup('maybe');
ap(of(x => x), v) === v
```

### Homomorphism
```javascript no-run algebraic law — free-variable notation
const { ap } = Apply.lookup('maybe');
ap(of(f), of(x)) === of(f(x))
```

### Interchange
```javascript no-run algebraic law — free-variable notation
const { ap } = Apply.lookup('maybe');
ap(u, of(y)) === ap(of(f => f(y)), u)
```

### Composition
```javascript no-run algebraic law — free-variable notation
const { ap } = Apply.lookup('maybe');
ap(ap(ap(of(f => g => x => f(g(x))), u), v), w) === ap(u, ap(v, w))
```

## Usage examples

### Basic usage

```javascript
import FunFP from 'fun-fp-js';
const { Maybe, Apply, Applicative } = FunFP;

const add = a => b => a + b;  // a curried function

// apply to Maybe
const maybeAdd = Maybe.of(add);      // Maybe.Just(a => b => a + b)
const maybeA = Maybe.of(5);          // Maybe.Just(5)
const maybeB = Maybe.of(3);          // Maybe.Just(3)

const { ap } = Apply.lookup('maybe');

const step1 = ap(maybeAdd, maybeA);  // Maybe.Just(b => 5 + b)
const step2 = ap(step1, maybeB);     // Maybe.Just(8)
```

### liftA2 — applying a binary function to two values

```javascript
const { ap } = Apply.lookup('maybe');

const liftA2 = (f, a, b) => ap(a.map(f), b);

// add two Maybe values
const result = liftA2(a => b => a + b, Maybe.of(5), Maybe.of(3));
// Maybe.Just(8)

// when even one is Nothing
const noResult = liftA2(a => b => a + b, Maybe.of(5), Maybe.Nothing());
// Nothing
```

### liftA3 — applying a ternary function to three values

```javascript
const { ap } = Apply.lookup('maybe');

const liftA3 = (f, a, b, c) => ap(ap(a.map(f), b), c);

const fullName = first => middle => last => `${first} ${middle} ${last}`;

const result = liftA3(fullName, Maybe.of('John'), Maybe.of('Michael'), Maybe.of('Smith'));
// Maybe.Just('John Michael Smith')
```

## `identity` and `Const` — the two Applicatives you pass to traverse

`Traversable.traverse(applicative, f, ta)` does something different **depending on which
Applicative you pass it**. These two are what you reach for in that slot.

| what you pass | what traverse does |
| --- | --- |
| `Applicative.lookup('identity')` | carries the value through unchanged → **plain mapping** |
| `Applicative.Const(monoid)` | discards the value and folds via the monoid → **folding** |

[Optics](./Optics.md)'s `over` uses the first one; `foldMapOf`/`toList`/`preview` use the second.

### identity — carries the value through unchanged

```javascript
const { Applicative, Functor } = FunFP;

const Id = Applicative.lookup('identity');
console.log(Id.of(1).value);                            // 1
console.log(Id.ap(Id.of(x => x * 3), Id.of(2)).value);  // 6

// the Functor / Apply layers are registered under the same key too
// the carrier must be built with of — an { value: 1 } literal is a plain object, not an Identity.
console.log(Functor.lookup('identity').map(x => x + 1, Id.of(1)).value);  // 2
```

### Const — discards the value and folds via the monoid

`Applicative.Const(monoid)` is a **parameterized factory**. Given a key, it registers itself
under `const(<key>)`; given a `Monoid` instance that is not registered, it caches per instance
(the same shape as `Monoid.Maybe(innerSG)`).

```javascript
const { Applicative } = FunFP;

const C = Applicative.Const('array');

console.log(C.of().value);                               // []        the monoid's empty value
console.log(C.ap(C.wrap([1]), C.wrap([2])).value);       // [ 1, 2 ]  combined via the monoid
console.log(C.map(x => x + 1, C.wrap([9])).value);       // [ 9 ]     the value is discarded

// of discards the value and wrap holds it — the laws require of to behave that way.
console.log(C.of([7]).value);                            // []
console.log(C.wrap([7]).value);                          // [ 7 ]

// what a key creates can also be pulled from the registry
console.log(Applicative.lookup('const(array)') === C);       // true
```

The key point is that `map` discards the value — which is exactly what turns `traverse` into
"walk the structure and fold it with a monoid." `Optics.foldMapOf(monoid, optic, f, s)` is
precisely that.

There is one more factory of the same shape — `Applicative.Writer(monoid)`. The registered
`writer` instance is Array-Monoid-only, so an `of`-chaining Writer Applicative/Monad over any
other Monoid comes from this factory. See [Writer](./Writer.md#writer-factory) for details.

## Practical examples

### Form validation

```javascript
const { Either } = FunFP;

const validateName = name =>
    name.length > 0 ? Either.Right(name) : Either.Left('Name required');

const validateAge = age =>
    age >= 0 ? Either.Right(age) : Either.Left('Age must be positive');

const validateEmail = email =>
    email.includes('@') ? Either.Right(email) : Either.Left('Invalid email');

const createUser = name => age => email => ({ name, age, email });

// create the user only when every check passes
const { ap } = Apply.lookup('either');

const liftA3 = (f, a, b, c) => ap(ap(a.map(f), b), c);

const result = liftA3(
    createUser,
    validateName('Alice'),
    validateAge(30),
    validateEmail('alice@email.com')
);
// Right({ name: 'Alice', age: 30, email: 'alice@email.com' })

const invalid = liftA3(
    createUser,
    validateName(''),       // Left!
    validateAge(30),
    validateEmail('alice@email.com')
);
// Left('Name required')
```

### Parallel async requests

```javascript
const { Task } = FunFP;

const fetchUser = id => Task.of({ id, name: 'Alice' });
const fetchPosts = userId => Task.of([{ id: 1, title: 'Hello' }]);
const fetchComments = postId => Task.of([{ id: 1, text: 'Nice!' }]);

const combine = user => posts => comments => ({ user, posts, comments });

// run three Tasks in parallel and combine them
const { ap } = Apply.lookup('task');
const { map } = Functor.lookup('task');

const liftA3 = (f, a, b, c) => ap(ap(map(f, a), b), c);

liftA3(
    combine,
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1)
).fork(
    console.error,
    data => console.log(data)
);
// { user: {...}, posts: [...], comments: [...] }
```

## ap vs chain

| | ap | chain |
|---|---|---|
| execution | can run in parallel | sequential only |
| dependency | independent | depends on the previous result |
| use | combining several values | conditional branching |

```javascript no-run concept comparison — pseudocode
// ap: the two requests are independent → can run in parallel
ap(fetchUser, fetchPosts)

// chain: the second depends on the first's result → must run sequentially
fetchUser.chain(user => fetchPosts(user.id))
```

## Related type classes

- **Functor**: provides `map`
- **Apply**: provides `ap` (the basis of Applicative)
- **Monad**: provides `chain` (sequential execution)
