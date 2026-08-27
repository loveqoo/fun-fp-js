# Apply

> 한국어: [../Apply.md](../Apply.md)

**The type class that applies a boxed function to a boxed value**

## Concept

`Functor.map` applies an ordinary function to a boxed value. When the function itself is inside
a box, `map` cannot reach it — that is where `Apply.ap` comes in.

Use it to apply a multi-argument function across several boxes. Chain one `ap` per box and a
curried function picks up its arguments one at a time.

## Interface

```javascript no-run signature / pseudocode notation
Apply.lookup(key): Apply instance
Apply.ap(mf, mv): Apply b   // mf: Apply (a -> b), mv: Apply a
```

## Laws

### Composition
```javascript no-run algebraic law — free-variable notation
ap(ap(map(f => g => x => f(g(x)), a), u), v) === ap(a, ap(u, v))
```

## Usage

```javascript
import FunFP from 'fun-fp-js';
const { Apply, Maybe } = FunFP;

const { ap } = Apply.lookup('maybe');
const add = a => b => a + b;

console.log(String(ap(Maybe.Just(add(3)), Maybe.Just(4))));    // Just(7)
console.log(String(ap(Maybe.Nothing(), Maybe.Just(4))));       // Nothing   an empty function box empties the result
console.log(String(ap(Maybe.Just(add(3)), Maybe.Nothing())));  // Nothing   an empty value box does too
```

### Several arguments from several boxes

```javascript
const { Apply, Applicative, Maybe } = FunFP;
const { ap } = Apply.lookup('maybe');
const { of } = Applicative.lookup('maybe');

const mkUser = name => age => ({ name, age });
const user = ap(ap(of(mkUser), Maybe.Just('kim')), Maybe.Just(40));
console.log(user.value);   // { name: 'kim', age: 40 }
```

### Validation — `ap` collects failures

This is where `ap` parts ways with `chain`. `chain` needs the previous result to continue, but
the two boxes of `ap` know nothing about each other — so **failures from both sides can be
collected.** [Validation](./Validation.md) is built on that property.

```javascript
const { Apply, Applicative, Validation } = FunFP;
const A = Applicative.lookup('validation');

const name = Validation.Invalid(['name is empty']);
const age = Validation.Invalid(['age is negative']);
console.log(A.ap(A.map(n => a => ({ n, a }), name), age).errors);
// [ 'name is empty', 'age is negative' ]   both collected — chain would stop at the first
```

## Related type classes

- **[Functor](./Functor.md)** — the parent. `map` applies an ordinary function.
- **[Applicative](./Applicative.md)** — the child. Adds `of`, which puts a value into the box.
- **[Chain](./Chain.md)** — when the next step depends on the previous result, go this way.
