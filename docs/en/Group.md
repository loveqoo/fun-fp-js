# Group

> 한국어: [../Group.md](../Group.md)

A type class that adds an inverse (`invert`) to Monoid.

## Definition

```javascript no-run 시그니처·의사코드 표기
class Group extends Monoid {
    constructor(monoid, invert, type, registry, ...aliases)
}
```

## Core operations

| Operation | Signature | Description |
|-----|---------|-----|
| `invert` | `a → a` | returns the inverse |
| `concat` | (Monoid) | combining operation |
| `empty` | (Monoid) | identity element |

## Laws

```javascript no-run 시그니처·의사코드 표기
// right inverse
concat(a, invert(a)) ≡ empty()

// left inverse
concat(invert(a), a) ≡ empty()
```

## Example: the integer-addition group

```javascript
const { Group, Semigroup, Monoid, Symbols } = FunFP;

// Semigroup: 덧셈
const addSemi = new Semigroup((a, b) => a + b, 'number');

// Monoid: 덧셈 + 항등원(0)
const addMonoid = new Monoid(addSemi, () => 0, 'number');

// Group: 덧셈 + 역원(부호 반전)
const addGroup = new Group(addMonoid, a => -a, 'number');

addGroup.concat(5, 3);      // 8
addGroup.invert(5);         // -5
addGroup.concat(5, addGroup.invert(5));  // 0 (empty)
```

## Example: the boolean-XOR group

```javascript
// XOR은 자기 자신이 역원
const xorSemi = new Semigroup((a, b) => a !== b, 'boolean');
const xorMonoid = new Monoid(xorSemi, () => false, 'boolean');
const xorGroup = new Group(xorMonoid, a => a, 'boolean');  // 자기 자신이 역원

xorGroup.concat(true, xorGroup.invert(true));  // false (empty)
```

## Relationships

```
Semigroup ──> Monoid ──> Group
                │          │
              empty      invert
```

## See also

- [Semigroup](./Semigroup.md) - combining operation
- [Monoid](./Monoid.md) - combining + identity element
