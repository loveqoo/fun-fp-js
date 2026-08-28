# Bifunctor

> 한국어: [../Bifunctor.md](../Bifunctor.md)

**A type that can transform both sides**

## Concept

A Bifunctor is a **container with two type parameters where both can be
transformed**.

The typical example is Either:
- transforming the Left value
- transforming the Right value
- transforming both at once

## Interface

```javascript no-run signature / pseudocode
Bifunctor.bimap(f, g, a): Bifunctor c d
// f: a -> c  (transforms Left / the first value)
// g: b -> d  (transforms Right / the second value)
```

## Laws

### Identity
```javascript no-run algebraic law — free-variable notation
const { bimap } = Bifunctor.lookup('either');
bimap(x => x, x => x, a) === a
```

### Composition
```javascript no-run algebraic law — free-variable notation
const { bimap } = Bifunctor.lookup('either');
bimap(f, g, bimap(h, i, a)) === bimap(x => f(h(x)), x => g(i(x)), a)
```

## Usage examples

### Either

```javascript
import FunFP from 'fun-fp-js';
const { Bifunctor, Either } = FunFP;

const { bimap } = Bifunctor.lookup('either');

// transforms Right
bimap(
    err => err.toUpperCase(),  // for Left
    val => val * 2,            // for Right
    Either.Right(5)
);
// Right(10)

// transforms Left
bimap(
    err => err.toUpperCase(),
    val => val * 2,
    Either.Left('error')
);
// Left('ERROR')
```

### Tuple — must have exactly two elements

A tuple is not a distinct JavaScript type: it is an **array of length 2**.
So `.type` honestly stays `'Array'`, and "is it two?" is checked by the
instance itself.

```javascript
const { Bifunctor } = FunFP;

const { bimap } = Bifunctor.lookup('tuple');

console.log(bimap(n => n * 2, s => s + '!', [1, 'a']));   // [ 2, 'a!' ]

try { console.log(bimap(n => n * 2, s => s + '!', [1, 2, 3])); }
catch (e) { console.log(e.message); }   // 'Bifunctor.bimap: tuple must have exactly 2 elements, got 3'
```

**This check stays alive even in loose mode** (verified). What loose mode lets
go of is type checking, and getting `[NaN, NaN]` out of an empty array is not
a type problem, it is a **bug**.

## Practical examples

### Normalizing errors

```javascript
const { bimap } = Bifunctor.lookup('either');
const input = '{"value":1}';
const parseData = raw => raw ? Either.Right(JSON.parse(raw)) : Either.Left('empty input');
const normalizeError = err => ({
    message: err.message || String(err),
    timestamp: Date.now()
});

const formatResult = data => ({
    data,
    success: true
});

const result = parseData(input);

bimap(normalizeError, formatResult, result);
// if Left: Left({ message: '...', timestamp: ... })
// if Right: Right({ data: ..., success: true })
```

### Adding context to both sides

```javascript
const { bimap } = Bifunctor.lookup('either');

// Task has no Bifunctor instance — transforming both sides happens on Either
const fetchUser = id => id > 0
    ? Either.Right({ id, name: 'Alice' })
    : Either.Left({ code: 'INVALID_ID' });

const addContext = context => result =>
    bimap(
        err => ({ ...err, context }),
        data => ({ ...data, context }),
        result
    );

addContext('user-service')(fetchUser(1));
```

## map vs bimap

```javascript
const { bimap } = Bifunctor.lookup('either');
const { map } = Functor.lookup('either');

// map transforms only Right (success)
map(x => x * 2, Either.Right(5));     // Right(10)
map(x => x * 2, Either.Left('err'));  // Left('err') - not transformed

// bimap transforms both sides
bimap(e => e.toUpperCase(), x => x * 2, Either.Left('err'));
// Left('ERR')
```

## mapLeft - transforming only the left side

```javascript
const { bimap } = Bifunctor.lookup('either');
const mapLeft = (f, either) => bimap(f, x => x, either);

mapLeft(err => `Error: ${err}`, Either.Left('oops'));
// Left('Error: oops')
```

## Related type classes

- **Functor**: transforms only one side (Right)
- **Profunctor**: bidirectional transformation on functions
