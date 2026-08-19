# Extend

> 한국어: [../Extend.md](../Extend.md)

A type class that adds context-based transformation (`extend`) to Functor.

## Definition

```javascript no-run signature / pseudocode notation
class Extend extends Functor {
    constructor(functor, extend, type, registry, ...aliases)
}
```

## Core operation

| Operation | Signature | Description |
|-----|---------|-----|
| `extend` | `(F a → b, F a) → F b` | transforms while preserving the context |

`map` transforms only the value, but `extend` passes the entire context to
the function.

## Laws

```javascript no-run signature / pseudocode notation
// associativity
extend(f, extend(g, w)) ≡ extend(w => f(extend(g, w)), w)
```

## Example: array windows

```javascript
const { extend } = Extend.lookup('array');
// extend is useful when a computation needs to "look at the surrounding context"

const sum = arr => arr.reduce((a, b) => a + b, 0);
const avg = arr => sum(arr) / arr.length;

// compute a moving average
const movingAvg = extend(avg, [1, 2, 3, 4, 5]);
// the average from each position to the end
// [[1,2,3,4,5], [2,3,4,5], [3,4,5], [4,5], [5]]
// [3, 3.5, 4, 4.5, 5]
```

## map vs extend

```
map:    F a → (a → b)   → F b    // transforms only the value
extend: F a → (F a → b) → F b    // transforms by looking at the whole structure
```

## Relationship

```
Functor ──> Extend ──> Comonad
              │           │
           extend      extract
```

## See also

- [Functor](./Functor.md) - transforms values
- [Comonad](./Comonad.md) - Extend + extract
