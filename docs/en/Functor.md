# Functor

> 한국어: [../Functor.md](../Functor.md)

**A Mappable type**

## Concept

Functor is a type whose **value inside a container can be transformed**. The container's structure stays the same; only the value inside changes.

The most familiar example is `Array.map`:
```javascript
[1, 2, 3].map(x => x * 2)  // [2, 4, 6]
// the array structure stays the same, only each element is transformed
```

## Laws

### 1. Identity
```javascript no-run algebraic law — free-variable notation
const { map } = Functor.lookup('array');
map(x => x, a) === a
```
Mapping with the identity function gives back the original value.

### 2. Composition
```javascript no-run algebraic law — free-variable notation
const { map } = Functor.lookup('array');
map(x => f(g(x)), a) === map(f, map(g, a))
```
Mapping once with a composed function equals mapping twice, once with each function.

## Interface

```javascript no-run signature / pseudocode
Functor.map(f, a): Functor a
```
- `f`: the transform function `a -> b`
- `a`: the value held by the Functor
- returns: a new Functor holding the transformed value

## Usage examples

### Array

```javascript
import FunFP from 'fun-fp-js';
const { Functor } = FunFP;

const { map } = Functor.lookup('array');

map(x => x * 2, [1, 2, 3]);
// [2, 4, 6]

map(x => x.toUpperCase(), ['a', 'b', 'c']);
// ['A', 'B', 'C']
```

### Maybe

```javascript
const { Maybe, Functor } = FunFP;

const just = Maybe.of(5);
const nothing = Maybe.Nothing();

const { map } = Functor.lookup('maybe');

map(x => x * 2, just);
// Just(10)

map(x => x * 2, nothing);
// Nothing - no transform is attempted
```

### Either

```javascript
const { Either, Functor } = FunFP;

const right = Either.Right(5);
const left = Either.Left('error');

const { map } = Functor.lookup('either');

map(x => x * 2, right);
// Right(10)

map(x => x * 2, left);
// Left('error') - the error is left untouched
```

### Task

```javascript
const { Task, Functor } = FunFP;

const task = Task.of(5);
const { map } = Functor.lookup('task');

const doubled = map(x => x * 2, task);
doubled.fork(console.error, console.log);  // 10
```

## Practical applications

### Safe property access

```javascript
const user = Maybe.of({ name: 'Alice', address: { city: 'Seoul' } });

const { map } = Functor.lookup('maybe');

// safely access a nested property
map(u => u.name, user);
// Just('Alice')

map(u => u.address.city, user);
// Just('Seoul')

// safely Nothing when it's null
const noUser = Maybe.Nothing();
map(u => u.name, noUser);
// Nothing
```

### Combined with error handling

```javascript
const parseJson = str => {
    try {
        return Either.Right(JSON.parse(str));
    } catch (e) {
        return Either.Left(e.message);
    }
};

const data = '{"name": "Alice", "age": 30}';
const result = parseJson(data);

const { map } = Functor.lookup('either');

// transforms only when parsing succeeds
map(obj => obj.name, result);
// Right('Alice')
```

### Asynchronous transformation

```javascript no-run requires a network fetch — not meant to run
const fetchUser = userId => Task.fromPromise(
    () => fetch(`/api/users/${userId}`).then(r => r.json())
);

const { map } = Functor.lookup('task');

const getUserName = pipe(
    fetchUser,
    task => map(user => user.name, task)
);

getUserName(1).fork(console.error, console.log);
// 'Alice'
```

## Visualizing Functor

```
A Functor is like a Box:

┌─────────┐                    ┌─────────┐
│    5    │  map(x => x * 2)   │   10    │
└─────────┘  ───────────────>  └─────────┘
   Just                           Just

┌─────────┐                    ┌─────────┐
│ (empty) │  map(x => x * 2)   │ (empty) │
└─────────┘  ───────────────>  └─────────┘
  Nothing                        Nothing

You can transform the value inside without ever opening the box!
```

## Why Functor?

1. **null safety**: safe transformation with Maybe, no null checks
2. **error handling**: error propagation with Either, no try-catch
3. **async abstraction**: async transformation with Task, no callbacks or Promise chains
4. **composable**: chains transformations the way function composition does

## Related type classes

- **Apply**: Functor + applies a function held in one Functor to values in another
- **Applicative**: Apply + puts a value into a Functor
- **Monad**: Applicative + flattens a nested Functor
