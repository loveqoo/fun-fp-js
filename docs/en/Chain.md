# Chain

> 한국어: [../Chain.md](../Chain.md)

**The type class that builds the next box from the previous result**

## Concept

A `map` callback normally returns a value. When the callback **returns a box**, `map` nests the
boxes — `Maybe<Maybe<number>>`. `chain` takes the same callback but flattens the result back to
one layer. That gives you a sequence where each step looks at the previous result to decide the
next.

How it differs from `ap` ([Apply](./Apply.md)): the two boxes of `ap` know nothing about each
other (which is why failures can be collected), while the next box of `chain` only exists once
the previous value arrived (which is why it stops at the first failure).

## Interface

```javascript no-run signature / pseudocode notation
Chain.lookup(key): Chain instance
Chain.chain(f, m): Chain b   // f: a -> Chain b — the callback must return a box
```

## Laws

### Associativity
```javascript no-run algebraic law — free-variable notation
chain(g, chain(f, m)) === chain(x => chain(g, f(x)), m)
```

## Usage

```javascript
import FunFP from 'fun-fp-js';
const { Chain, Functor, Maybe } = FunFP;

const { chain } = Chain.lookup('maybe');
const { map } = Functor.lookup('maybe');
const half = n => n % 2 === 0 ? Maybe.Just(n / 2) : Maybe.Nothing();

console.log(String(map(half, Maybe.Just(8))));     // Just(Just(4))   map nests
console.log(String(chain(half, Maybe.Just(8))));   // Just(4)         chain flattens
console.log(String(chain(half, Maybe.Just(7))));   // Nothing         stops at failure
console.log(String(chain(half, chain(half, Maybe.Just(8)))));   // Just(2)   a sequence
```

### The callback must return a box

Using `chain` where `map` belongs is the most common mistake. Strict mode rejects it
**at the site of the mistake** — the rationale and the boundary (lazy types) are in
[internals](./internals.md#chain-return).

```javascript
const { Chain, Maybe } = FunFP;
const { chain } = Chain.lookup('maybe');

try { chain(n => n + 1, Maybe.Just(8)); }   // the callback returned a bare value — map territory
catch (e) { console.log(e.message); }   // 'Chain.chain: callback must return Maybe, got number'
```

### Kleisli composition — joining arrows before any value arrives

Functions of shape `a -> Chain b` (Kleisli arrows) can be composed before any value exists.
Chaining twice equals composing the arrows first and chaining once — that is the associativity
law above.

```javascript
const { Maybe } = FunFP;
const half = n => n % 2 === 0 ? Maybe.Just(n / 2) : Maybe.Nothing();
const dec = n => n > 0 ? Maybe.Just(n - 1) : Maybe.Nothing();

const pipeline = Maybe.pipeK(half, dec);   // composed before any value arrives
console.log(String(pipeline(8)));   // Just(3)
console.log(String(pipeline(7)));   // Nothing
```

## Related type classes

- **[Apply](./Apply.md)** — the parent. Combining boxes that know nothing about each other.
- **[Monad](./Monad.md)** — `chain` plus `of`. Every registered Chain goes all the way to Monad.
- **[ChainRec](./ChainRec.md)** — the sibling that runs `chain` recursion without a stack.
