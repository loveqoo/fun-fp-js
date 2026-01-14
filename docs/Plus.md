# Plus

Alt에 빈 대안(zero)을 추가한 타입 클래스.

## 정의

```javascript
class Plus extends Alt {
    constructor(alt, zero, type, registry, ...aliases)
}
```

## 핵심 연산

| 연산 | 시그니처 | 설명 |
|-----|---------|-----|
| `zero` | `() → F a` | 빈 대안 반환 |

Plus는 Alt를 확장하며, alt 연산의 항등원을 제공합니다.

## 법칙

```javascript
// right identity
Alt.alt(x, Plus.zero()) ≡ x

// left identity  
Alt.alt(Plus.zero(), x) ≡ x

// annihilation
Functor.map(f, Plus.zero()) ≡ Plus.zero()
```

## 예시

```javascript
const { Maybe, Alt } = FunFP;

// Maybe.Nothing()은 zero 역할
Alt.types.MaybeAlt.alt(Maybe.Nothing(), Maybe.of(1));  // Just(1)
Alt.types.MaybeAlt.alt(Maybe.of(1), Maybe.Nothing());  // Just(1)
```

## 관계

```
Alt ──> Plus ──> Alternative
         │
         zero (항등원)
```

## 참고

- [Alt](./Alt.md) - 부모 타입 클래스
- [Alternative](./Alternative.md) - Applicative + Plus
