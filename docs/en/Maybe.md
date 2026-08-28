# Maybe

> 한국어: [../Maybe.md](../Maybe.md)

**A type for handling null safely**

## Concept

Maybe represents **a situation where a value may or may not be present**.

- `Just(value)`: a value is present
- `Nothing`: no value (a replacement for null, undefined)

## Why Maybe?

### The problem: null-check hell

```javascript
const getCity = user => {
    if (user === null) return null;
    if (user.address === null) return null;
    if (user.address.city === null) return null;
    return user.address.city;
};
```

### The fix: clean it up with Maybe

```javascript
const user = { name: 'Alice', address: { city: 'Seoul' } };
const { Maybe, Functor, Chain } = FunFP;
const { map } = Functor.lookup('maybe');
const { chain } = Chain.lookup('maybe');

const getCity = user =>
    map(
        a => a.city,
        chain(
            u => u.address ? Maybe.of(u.address) : Maybe.Nothing(),
            Maybe.of(user)
        )
    );

// or use Maybe.pipeK (more readable)
const getCityPipeK = Maybe.pipeK(
    u => u.address ? Maybe.of(u.address) : Maybe.Nothing(),
    a => a.city ? Maybe.of(a.city) : Maybe.Nothing()
);

// or use extra.path
extra.path('address.city')(user);  // returns an Either
```

## Construction

```javascript
import FunFP from 'fun-fp-js';
const { Maybe } = FunFP;

// create a Just from a value
const just = Maybe.of(5);           // Just(5)
const alsoJust = Maybe.Just(5);     // Just(5)

// create a Nothing
const nothing = Maybe.Nothing();    // Nothing

// null/undefined automatically become Nothing (the fromNullable pattern)
const safe = val => val == null ? Maybe.Nothing() : Maybe.Just(val);
safe(5);         // Just(5)
safe(null);      // Nothing
safe(undefined); // Nothing
```

## Key operations

### map — transform the value (Functor)

```javascript
const { Functor } = FunFP;
const { map } = Functor.lookup('maybe');

map(x => x * 2, Maybe.of(5));       // Just(10)
map(x => x * 2, Maybe.Nothing());   // Nothing (the function does not run)
```

### chain — avoid nesting (Monad)

```javascript
const { Chain } = FunFP;
const { chain } = Chain.lookup('maybe');

const double = x => x > 0 ? Maybe.of(x * 2) : Maybe.Nothing();

chain(double, Maybe.of(5));      // Just(10)
chain(double, Maybe.of(-5));     // Nothing
chain(double, Maybe.Nothing());  // Nothing
```

### fold — extract the value

```javascript
Maybe.fold(
    () => 'default',        // when it's Nothing
    value => `Got: ${value}`,  // when it's Just
    Maybe.of(5)
);
// 'Got: 5'

Maybe.fold(
    () => 'default',
    value => `Got: ${value}`,
    Maybe.Nothing()
);
// 'default'
```

### The getOrElse pattern (built on fold)

```javascript
// getOrElse is implemented with fold
const getOrElse = (defaultVal, maybe) => 
    Maybe.fold(() => defaultVal, v => v, maybe);

getOrElse(0, Maybe.of(5));       // 5
getOrElse(0, Maybe.Nothing());   // 0
```

## Type checks

```javascript
Maybe.isJust(Maybe.of(5));      // true
Maybe.isNothing(Maybe.of(5));   // false
Maybe.isMaybe(Maybe.of(5));     // true
Maybe.isMaybe({});              // false
```

## Practical examples

### Safe array access

```javascript
const head = arr => arr.length > 0 ? Maybe.of(arr[0]) : Maybe.Nothing();
const tail = arr => arr.length > 0 ? Maybe.of(arr.slice(1)) : Maybe.Nothing();

head([1, 2, 3]);     // Just(1)
head([]);            // Nothing

// chaining
head([1, 2, 3])
    .chain(x => head([x + 10, x + 20]))
    .map(x => x * 2);
// Just(22)
```

### Safe property access

```javascript
const prop = key => obj => 
    obj && obj[key] != null ? Maybe.of(obj[key]) : Maybe.Nothing();

const user = { name: 'Alice', address: { city: 'Seoul' } };

// getOrElse is not an instance method — use the helper from the "getOrElse pattern" section above
const getOrElse = (defaultVal, maybe) => Maybe.fold(() => defaultVal, v => v, maybe);

getOrElse('Unknown', prop('address')(user).chain(prop('city')));
// 'Seoul'

const noAddress = { name: 'Bob' };
getOrElse('Unknown', prop('address')(noAddress).chain(prop('city')));
// 'Unknown'
```

### Safe JSON parsing

```javascript
const prop = key => obj => 
    obj && obj[key] != null ? Maybe.of(obj[key]) : Maybe.Nothing();
const parseJson = str => {
    try {
        return Maybe.of(JSON.parse(str));
    } catch {
        return Maybe.Nothing();
    }
};

// getOrElse is not an instance method — use the helper from the "getOrElse pattern" section above
const getOrElse = (defaultVal, maybe) => Maybe.fold(() => defaultVal, v => v, maybe);

getOrElse('UNKNOWN',
    parseJson('{"name": "Alice"}').chain(prop('name')).map(name => name.toUpperCase())
);
// 'ALICE'

getOrElse('UNKNOWN',
    parseJson('invalid json').chain(prop('name')).map(name => name.toUpperCase())
);
// 'UNKNOWN'
```

### Form value validation (using pipeK)

```javascript
const validateLength = min => str =>
    str.length >= min ? Maybe.of(str) : Maybe.Nothing();

const validatePattern = regex => str =>
    regex.test(str) ? Maybe.of(str) : Maybe.Nothing();

// build a validation pipeline with Maybe.pipeK
const validateEmail = Maybe.pipeK(
    validateLength(5),
    validatePattern(/^.+@.+\..+$/)
);

validateEmail('test@example.com');  // Just('test@example.com')
validateEmail('bad');                // Nothing
validateEmail('');                   // Nothing
```

## Maybe vs null

| | null | Maybe |
|---|---|---|
| On error | `null.prop` → TypeError | Nothing.map() → Nothing |
| Chaining | a null check every time | short-circuits automatically |
| Explicitness | implicit | explicit in the type |
| Composition | hard | natural |

## Converting Maybe to Either

```javascript
const maybeValue = Maybe.of(42);
// when you want to attach an error message to Nothing
Maybe.toEither('Value not found', maybeValue);

Maybe.toEither('Not found', Maybe.of(5));    // Right(5)
Maybe.toEither('Not found', Maybe.Nothing()); // Left('Not found')
```

## Related type classes

- **Functor**: provides map
- **Apply**: provides ap
- **Applicative**: provides of
- **Chain**: provides chain
- **Monad**: Applicative + Chain
- **Alt**: choose between alternatives

## Maybe.pipe / Maybe.pipeK

Static Land-style chaining that reads cleanly:

### Maybe.pipe — apply functions in sequence

```javascript
const user = { name: 'Alice', address: { city: 'Seoul' } };
const { map } = Functor.lookup('maybe');

Maybe.pipe(
    Maybe.of(user),
    m => map(u => u.address, m),
    m => map(a => a.city, m)
);
// Just('Seoul') or Nothing
```

`Maybe.pipe` sits on top of the general-purpose combinator `pipeWhile`: `pipeWhile(Maybe.isJust)`
is its body, and `Either.pipe` uses the same skeleton (`pipeWhile(Either.isRight)`).

### pipeWhile — a pipe that only continues while a predicate holds {#pipewhile}

A top-level utility independent of any container. At each step it asks the predicate first; if
false, it skips the remaining functions and passes the value straight through. Since an unchanged
value keeps producing the same predicate result, once it goes false the pipe effectively stops.

```javascript
const { pipeWhile } = FunFP;

const capped = pipeWhile(x => x < 100)(
    2,
    x => x * 10,   // 2 → 20 (20 < 100, continues)
    x => x * 10,   // 20 → 200 (200 exceeds 100, stops here)
    x => x + 1     // skipped
);
if (capped !== 200) throw new Error('pipeWhile did not stop: ' + capped);
console.log(capped);   // 200

// relationship to Maybe.pipe — same result
const halveEven = m => m.chain(x => (x % 2 === 0 ? Maybe.Just(x / 2) : Maybe.Nothing()));
const viaPipe = Maybe.pipe(Maybe.of(8), halveEven, halveEven, halveEven);
const viaWhile = pipeWhile(Maybe.isJust)(Maybe.of(8), halveEven, halveEven, halveEven);
if (String(viaPipe) !== String(viaWhile)) throw new Error('the two diverged');
console.log(String(viaPipe));   // Just(1) — 8 → 4 → 2 → 1
```

### Maybe.pipeK — Kleisli composition (for chain)

```javascript
// chain functions of the form a -> Maybe b
const getAddress = user => user.address ? Maybe.of(user.address) : Maybe.Nothing();
const getCity = addr => addr.city ? Maybe.of(addr.city) : Maybe.Nothing();

const getCityFromUser = Maybe.pipeK(getAddress, getCity);

getCityFromUser({ name: 'Alice', address: { city: 'Seoul' } });  // Just('Seoul')
getCityFromUser({ name: 'Bob' });  // Nothing
```

## Reading it in output — `toString` {#tostring}

`Just(1)` and `Nothing()` are nearly the same object underneath, so their string forms are made to
diverge. The JSON representation is unchanged: `_typeName` is what type checks read, so it is left
alone.

```javascript
const { Maybe } = FunFP;

if (String(Maybe.Just(1)) !== 'Just(1)') throw new Error('Just notation differs');
if (String(Maybe.Nothing()) !== 'Nothing') throw new Error('Nothing notation differs');
if (String(Maybe.Just(Maybe.Just('a'))) !== 'Just(Just("a"))') throw new Error('nested notation differs');
if (JSON.stringify(Maybe.Just(1)) !== '{"value":1,"_typeName":"Maybe"}') throw new Error('JSON changed');
console.log(`${Maybe.Just([1, 2])}`);   // Just([1,2])

// notation stays safe even when the inner value's toString throws
if (String(Maybe.Just({ toString() { throw new Error('pb'); } })) !== 'Just([unprintable])') throw new Error('the notation safeguard was breached');
```
