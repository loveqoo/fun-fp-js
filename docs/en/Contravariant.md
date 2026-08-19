# Contravariant

> 한국어: [../Contravariant.md](../Contravariant.md)

A type class that performs a contravariant transformation on the input type.

## Definition

```javascript no-run signature / pseudocode notation
class Contravariant extends Algebra {
    constructor(contramap, type, registry, ...aliases)
}
```

## Core operation

| Operation | Signature | Description |
|-----|---------|-----|
| `contramap` | `(a → b, F b) → F a` | transforms the input |

Functor's `map` transforms the output, but `contramap` transforms the
**input**.

## Laws

```javascript no-run signature / pseudocode notation
// identity
contramap(x => x, u) ≡ u

// composition
contramap(f, contramap(g, u)) ≡ contramap(x => g(f(x)), u)
```

## Example: Predicate

```javascript
const { contramap } = Contravariant.lookup('predicate');
// Predicate is a representative Contravariant example
// Predicate<A> = A → boolean

const isEven = n => n % 2 === 0;

// contramap: transforms the input first
const isLengthEven = contramap(str => str.length, isEven);
// str → str.length → isEven

isLengthEven('hi');     // true  (length 2)
isLengthEven('hello');  // false (length 5)
```

## Functor vs Contravariant

```
Functor (covariant):       F a → (a → b) → F b
                            unwrap → transform → wrap again

Contravariant:              F b → (a → b) → F a
                            transform the input first → apply the original function
```

## See also

- [Functor](./Functor.md) - covariant transformation
- [Profunctor](./Profunctor.md) - transforms both input and output
