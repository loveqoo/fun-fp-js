# Identity

> 한국어: [../Identity.md](../Identity.md)

**The box that adds no effect**

## Concept

`Identity` only wraps a value and does nothing else — no failure, no delay, no accumulation.
A "box that does nothing" exists so it can **fill a slot that demands a box, without adding an
effect.** There are two such slots.

- **Pass it to `traverse` and you get "just mapping"** — optics' `over` takes this road.
  Rationale: [internals](./internals.md#identity-const).
- **Put it in a transformer's inner-monad slot and the plain monad comes back out** —
  `ReaderT('identity')` produces the same value as a bare `Reader`.

## The doors

```javascript
import FunFP from 'fun-fp-js';
const { Identity } = FunFP;

const w = Identity.of(7);
console.log(w.value);                                    // 7
console.log(String(w.map(n => n + 1).value));            // 8
console.log(w.chain(n => Identity.of(n * 3)).value);     // 21
console.log(w.extract());                                // 7   the Comonad door
console.log(Identity.isIdentity(w));                     // true
console.log(Identity.isIdentity({ value: 7 }));          // false   a shape-only copy is told apart
```

It is registered in nine places — `Functor`, `Apply`, `Applicative`, `Chain`, `Monad`,
`Extend`, `Comonad`, `Foldable`, `Reducible`.

## As a transformer's inner monad

```javascript
const { ReaderT, Reader } = FunFP;

const RT = ReaderT('identity');
const p = RT.asks(e => e.host).chain(h => RT.of(h + '!'));
const bare = Reader.asks(e => e.host).chain(h => Reader.of(h + '!'));

console.log(RT.runReaderT({ host: 'a' }, p).value);   // a!   wrapped in one layer of Identity
console.log(bare.run({ host: 'a' }));                 // a!   the same value as a bare Reader
```

## As the partner of `traverse`

```javascript
const { Traversable, Applicative, Maybe } = FunFP;

const T = Traversable.lookup('maybe');
const I = Applicative.lookup('identity');

// traversing with Identity is effect-free "just mapping"
console.log(String(T.traverse(I, n => I.of(n * 10), Maybe.Just(4)).value));   // Just(40)
```

## Related docs

- **[Applicative](./Applicative.md)** — the "Applicative you hand to `traverse`" viewpoint.
- **[Comonad](./Comonad.md)** — one of the four instances carrying `extract`.
- **[ReaderT](./ReaderT.md)** and the other transformers — the inner-monad slot.
