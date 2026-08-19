# Plus

> 한국어: [../Plus.md](../Plus.md)

A type class that adds an empty alternative (`zero`) to Alt.

## Definition

```javascript no-run signature / pseudocode notation
class Plus extends Alt {
    constructor(alt, zero, type, registry, ...aliases)
}
```

## Core operation

| Operation | Signature | Description |
|-----|---------|-----|
| `zero` | `() → F a` | returns the empty alternative |

Plus extends Alt, providing an identity element for the `alt` operation.

## Laws

```javascript no-run signature / pseudocode notation
// right identity
Alt.alt(x, Plus.zero()) ≡ x

// left identity  
Alt.alt(Plus.zero(), x) ≡ x

// annihilation
Functor.map(f, Plus.zero()) ≡ Plus.zero()
```

## Example

```javascript
const { Maybe, Alt } = FunFP;

const { alt } = Alt.lookup('maybe');

// Maybe.Nothing() serves as zero
alt(Maybe.Nothing(), Maybe.of(1));  // Just(1)
alt(Maybe.of(1), Maybe.Nothing());  // Just(1)
```

## Relationship

```
Alt ──> Plus ──> Alternative
         │
         zero (identity element)
```

## You get a Monoid for free

`Plus` carries **both** `alt` (the combining operation) and `zero` (the
identity element) — that is precisely the definition of a Monoid. So **a
registered `Plus` gets a matching `Semigroup`/`Monoid` under that same type's
name, for free.** The one exception is when the type already has its own
`Monoid` — it is not derived in that case (`Array` is such a case).

```javascript
const { Plus, Monoid, Maybe } = FunFP;

console.log(Plus.lookup('maybe').alt(Maybe.Just(1), Maybe.Just(2)).value);      // 1
console.log(Monoid.lookup('maybe').concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1 — same
console.log(Monoid.lookup('maybe').empty().isNothing());                       // true
```

Registering a new `Plus` brings the pair along with it — there is no need to
build it separately. For details, and how this differs from `maybe(first)`,
see the [Monoid](./Monoid.md) document.

## See also

- [Alt](./Alt.md) - the parent type class
- [Alternative](./Alternative.md) - Applicative + Plus
- [Monoid](./Monoid.md) - derived under that same type's name
