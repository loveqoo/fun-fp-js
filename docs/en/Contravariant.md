# Contravariant

> 한국어: [../Contravariant.md](../Contravariant.md)

A type class that performs a contravariant transformation on the input type.

## Definition

```javascript no-run 시그니처·의사코드 표기
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

```javascript no-run 시그니처·의사코드 표기
// identity
contramap(x => x, u) ≡ u

// composition
contramap(f, contramap(g, u)) ≡ contramap(x => g(f(x)), u)
```

## Example: Predicate

```javascript
const { contramap } = Contravariant.lookup('predicate');
// Predicate는 대표적인 Contravariant 예시
// Predicate<A> = A → boolean

const isEven = n => n % 2 === 0;

// contramap: 입력을 먼저 변환
const isLengthEven = contramap(str => str.length, isEven);
// str → str.length → isEven

isLengthEven('hi');     // true  (length 2)
isLengthEven('hello');  // false (length 5)
```

## Functor vs Contravariant

```
Functor (공변):       F a → (a → b) → F b
                      값을 꺼내서 → 변환 → 다시 포장

Contravariant (반공변): F b → (a → b) → F a
                       입력을 먼저 변환 → 원래 함수 적용
```

## See also

- [Functor](./Functor.md) - covariant transformation
- [Profunctor](./Profunctor.md) - transforms both input and output
