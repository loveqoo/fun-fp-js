# Category

> 한국어: [../Category.md](../Category.md)

A type class that adds an identity function (`id`) to Semigroupoid.

## Definition

```javascript no-run signature / pseudocode notation
class Category extends Semigroupoid {
    constructor(semigroupoid, id, type, registry, ...aliases)
}
```

## Core operations

| Operation | Signature | Description |
|-----|---------|-----|
| `id` | `() → (a → a)` | the identity function |
| `compose` | (Semigroupoid) | function composition |

## Laws

```javascript no-run signature / pseudocode notation
// right identity
compose(f, id()) ≡ f

// left identity
compose(id(), f) ≡ f
```

## Example

```javascript
const { Category, Semigroupoid } = FunFP;

// Semigroupoid: function composition
const funcSemi = new Semigroupoid((f, g) => x => f(g(x)), 'function');

// Category: function composition + identity — pass the identity morphism itself (not a thunk)
const funcCategory = new Category(funcSemi, x => x, 'function');

const double = x => x * 2;
const addOne = x => x + 1;

// compose runs right to left
console.log(funcCategory.compose(double, addOne)(5));  // 12   5 + 1 = 6, 6 * 2 = 12

// id is the identity function — composing with it changes nothing
console.log(funcCategory.compose(double, funcCategory.id())(5));  // 10
console.log(funcCategory.compose(funcCategory.id(), double)(5));  // 10
```

## Relationship

```
Semigroupoid ──> Category
       │             │
    compose         id
```

## See also

- [Semigroupoid](./Semigroupoid.md) - function composition
