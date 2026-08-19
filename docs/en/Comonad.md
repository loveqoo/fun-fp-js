# Comonad

> 한국어: [../Comonad.md](../Comonad.md)

A type class that adds value extraction (`extract`) to Extend. The dual of
Monad.

## Definition

```javascript no-run signature / pseudocode
class Comonad extends Extend {
    constructor(extend, extract, type, registry, ...aliases)
}
```

## Core operations

| Operation | Signature | Description |
|-----|---------|-----|
| `extract` | `F a → a` | extracts the value |
| `extend` | (Extend) | context-based transformation |

## Laws

```javascript no-run signature / pseudocode
// left identity
extend(extract, w) ≡ w

// right identity
extract(extend(f, w)) ≡ f(w)

// associativity (Extend's law)
extend(f, extend(g, w)) ≡ extend(w => f(extend(g, w)), w)
```

## Monad vs Comonad

| Monad | Comonad |
|-------|---------|
| `of: a → F a` | `extract: F a → a` |
| `chain: (a → F b, F a) → F b` | `extend: (F a → b, F a) → F b` |
| puts a value into a context | takes a value out of a context |
| sequential execution | context-based computation |

## Example

There are two registered instances — `identity` and `array`. Pull them out
with `lookup`.

```javascript
const { Comonad, Identity } = FunFP;

// Identity Comonad — one box, one value
const IC = Comonad.lookup('identity');
const w = Identity.of(42);
console.log(IC.extract(w));                          // 42 — extracts the value
console.log(IC.extract(IC.extend(IC.extract, w)));   // 42 — observes left identity (extend(extract, w) ≡ w)

// Array Comonad — extract takes the first element, extend applies f to each tail (suffix)
const AC = Comonad.lookup('array');
console.log(AC.extract([1, 2, 3]));                  // 1
console.log(AC.extend(xs => xs.length, [1, 2, 3]));  // [3, 2, 1] — the remaining length at each position
```

> **Note — `Array` is a `Comonad` only when non-empty.** `extract([])` has no
> value to pull out, so it is `undefined` (mathematically too, the array
> comonad holds only for NonEmptyArray). The empty array falls outside this
> instance's domain —
> reasoning: [`internals.md#array-comonad`](./internals.md#array-comonad).

## Practical use

Comonad is useful in situations like:

- **Cellular automata**: each cell looks at its neighbors to decide its next state
- **Image processing**: filters based on the context around a pixel
- **Spreadsheets**: cells referencing other cells
- **Games**: a character sensing its surrounding environment

## Relationship

```
Extend ──> Comonad
   │          │
extend     extract

(the dual of Monad)
   of  ↔  extract
 chain ↔  extend
```

## See also

- [Extend](./Extend.md) - the parent type class
- [Monad](./Monad.md) - the dual concept
