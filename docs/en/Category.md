# Category

> 한국어: [../Category.md](../Category.md)

A type class that adds an identity function (`id`) to Semigroupoid.

## Definition

```javascript no-run 시그니처·의사코드 표기
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

```javascript no-run 시그니처·의사코드 표기
// right identity
compose(f, id()) ≡ f

// left identity
compose(id(), f) ≡ f
```

## Example

```javascript
const { Category, Semigroupoid } = FunFP;

// Semigroupoid: 함수 합성
const funcSemi = new Semigroupoid((f, g) => x => f(g(x)), 'function');

// Category: 함수 합성 + 항등 함수
const funcCategory = new Category(funcSemi, () => x => x, 'function');

const double = x => x * 2;
const addOne = x => x + 1;

// compose는 오른쪽에서 왼쪽
funcCategory.compose(double, addOne)(5);  // 12 (5 + 1 = 6, 6 * 2 = 12)

// id는 항등 함수
funcCategory.compose(double, funcCategory.id())(5);  // 10
funcCategory.compose(funcCategory.id(), double)(5);  // 10
```

## Relationship

```
Semigroupoid ──> Category
       │             │
    compose         id
```

## See also

- [Semigroupoid](./Semigroupoid.md) - function composition
