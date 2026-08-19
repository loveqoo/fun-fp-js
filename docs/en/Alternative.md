# Alternative

> 한국어: [../Alternative.md](../Alternative.md)

A type class combining Applicative and Plus. It supports choice and
parallel-execution patterns.

## Definition

```javascript no-run 시그니처·의사코드 표기
class Alternative extends Applicative {
    constructor(applicative, plus, type, registry, ...aliases)
}
```

## Core operations

Inherits every operation of Alt, Plus, and Applicative:

| Operation | Source | Description |
|-----|------|-----|
| `of` | Applicative | wraps a value |
| `ap` | Apply | applies a function |
| `alt` | Alt | chooses an alternative |
| `zero` | Plus | the empty alternative |

## Laws

```javascript no-run 시그니처·의사코드 표기
// distributivity (왼쪽에서 오른쪽)
ap(alt(a, b), c) ≡ alt(ap(a, c), ap(b, c))

// annihilation
ap(zero(), a) ≡ zero()
```

## Usage example

```javascript
const { Maybe, Alt, Applicative } = FunFP;

const { alt } = Alt.lookup('maybe');

// 첫 번째 성공 값 선택
const result = alt(Maybe.Nothing(), Maybe.of(42));  // Just(42)

// 모두 실패하면 Nothing
const noResult = alt(Maybe.Nothing(), Maybe.Nothing());  // Nothing
```

## Relationship

```
Applicative ──┐
              ├──> Alternative
Plus ─────────┘
```

## See also

- [Applicative](./Applicative.md) - wrapping and applying values
- [Plus](./Plus.md) - the empty alternative
- [Alt](./Alt.md) - choosing an alternative
