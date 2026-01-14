# Contravariant

입력 타입에 대해 반공변적인(contravariant) 변환을 수행하는 타입 클래스.

## 정의

```javascript
class Contravariant extends Algebra {
    constructor(contramap, type, registry, ...aliases)
}
```

## 핵심 연산

| 연산 | 시그니처 | 설명 |
|-----|---------|-----|
| `contramap` | `(a → b, F b) → F a` | 입력 변환 |

Functor의 `map`은 출력을 변환하지만, `contramap`은 **입력**을 변환합니다.

## 법칙

```javascript
// identity
contramap(x => x, u) ≡ u

// composition
contramap(f, contramap(g, u)) ≡ contramap(x => g(f(x)), u)
```

## 예시: Predicate

```javascript
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

## 참고

- [Functor](./Functor.md) - 공변적 변환
- [Profunctor](./Profunctor.md) - 입력과 출력 모두 변환
