# Alt

> 한국어: [../Alt.md](../Alt.md)

**A type that can choose between alternatives**

## Concept

Alt is the ability to **choose one of two values**. If the first is a
"failure," the second is used.

- Maybe: falls back to the alternative on Nothing
- Either: falls back to the alternative on Left
- Task: falls back to the alternative on failure

## Interface

```javascript no-run signature / pseudocode notation
Alt.alt(a, b): Alt a
// a if a is a "success", otherwise b
```

## Laws

### Associativity
```javascript no-run algebraic law — free-variable notation
const { alt } = Alt.lookup('maybe');
alt(alt(a, b), c) === alt(a, alt(b, c))
```

### Distributivity
```javascript no-run algebraic law — free-variable notation
map(f, alt(a, b)) === alt(map(f, a), map(f, b))
```

## Usage examples

### Maybe - supplying a default

```javascript
import FunFP from 'fun-fp-js';
const { Alt, Maybe } = FunFP;

const { alt } = Alt.lookup('maybe');

alt(Maybe.of(5), Maybe.of(10));           // Just(5)
alt(Maybe.Nothing(), Maybe.of(10));       // Just(10)
alt(Maybe.Nothing(), Maybe.Nothing());    // Nothing
```

### Either - recovering from an error

```javascript
const { alt } = Alt.lookup('either');

alt(Either.Right(5), Either.Right(10));   // Right(5)
alt(Either.Left('err'), Either.Right(10)); // Right(10)
```

### Task - falling back

```javascript
const { alt } = Alt.lookup('task');

const mainServer = Task.rejected('timeout');
const backupServer = Task.of({ data: 'from backup' });

alt(mainServer, backupServer).fork(
    console.error,
    data => console.log(data)  // { data: 'from backup' }
);
```

## Practical examples

### Multiple fallbacks

```javascript
const { alt } = Alt.lookup('maybe');
const getFromCache = Maybe.Nothing();
const getFromDB = Maybe.Nothing();
const getDefault = Maybe.of({ default: true });

alt(getFromCache, alt(getFromDB, getDefault));
// Just({ default: true })
```

### Config priority

```javascript
const { alt } = Alt.lookup('maybe');
const envConfig = process.env.CONFIG ? Maybe.of(JSON.parse(process.env.CONFIG)) : Maybe.Nothing();
const fileConfig = Maybe.of({ port: 3000 });
const defaultConfig = Maybe.of({ port: 8080 });

alt(envConfig, alt(fileConfig, defaultConfig));
// tries in order: env var > file > default
```

## Plus - Alt + zero

Plus is Alt with a **zero value** added:

```javascript no-run algebraic law — free-variable notation
const { alt } = Alt.lookup('maybe');
const { Plus } = FunFP;

Plus.lookup('maybe').zero();  // Nothing

// zero is the identity element of alt
alt(a, zero) === a
alt(zero, a) === a
```

## Related type classes

- **Plus**: Alt + zero
- **Alternative**: Applicative + Alt
