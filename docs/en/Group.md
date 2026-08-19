# Group

> 한국어: [../Group.md](../Group.md)

A type class that adds an inverse (`invert`) to Monoid.

## Definition

```javascript no-run signature / pseudocode notation
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

```javascript no-run signature / pseudocode notation
// right inverse
concat(a, invert(a)) ≡ empty()

// left inverse
concat(invert(a), a) ≡ empty()
```

## Example: the integer-addition group

```javascript
const { Group, Semigroup, Monoid, Symbols } = FunFP;

// Semigroup: addition
const addSemi = new Semigroup((a, b) => a + b, 'number');

// Monoid: addition + identity element (0)
const addMonoid = new Monoid(addSemi, () => 0, 'number');

// Group: addition + inverse (sign flip)
const addGroup = new Group(addMonoid, a => -a, 'number');

addGroup.concat(5, 3);      // 8
addGroup.invert(5);         // -5
addGroup.concat(5, addGroup.invert(5));  // 0 (empty)
```

## Example: the boolean-XOR group

```javascript
// XOR is its own inverse
const xorSemi = new Semigroup((a, b) => a !== b, 'boolean');
const xorMonoid = new Monoid(xorSemi, () => false, 'boolean');
const xorGroup = new Group(xorMonoid, a => a, 'boolean');  // its own inverse

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
