# Plus

Alt에 빈 대안(zero)을 추가한 타입 클래스.

## 정의

```javascript no-run 시그니처·의사코드 표기
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

```javascript no-run 시그니처·의사코드 표기
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

const { alt } = Alt.lookup('maybe');

// Maybe.Nothing()은 zero 역할
alt(Maybe.Nothing(), Maybe.of(1));  // Just(1)
alt(Maybe.of(1), Maybe.Nothing());  // Just(1)
```

## 관계

```
Alt ──> Plus ──> Alternative
         │
         zero (항등원)
```

## Monoid 를 공짜로 얻는다

`Plus` 는 `alt`(결합 연산)와 `zero`(항등원)를 **둘 다** 가집니다 — 그것이 Monoid 의 정의입니다.
그래서 **등록된 `Plus` 마다 짝 `Semigroup`/`Monoid` 가 `plus(<alias>)` 키로 자동으로 생깁니다.**

```javascript
const { Plus, Monoid, Maybe } = FunFP;

console.log(Plus.lookup('maybe').alt(Maybe.Just(1), Maybe.Just(2)).value);      // 1
console.log(Monoid.lookup('plus(maybe)').concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1 — 같다
console.log(Monoid.lookup('plus(maybe)').empty().isNothing());                 // true
```

`Plus` 를 새로 등록하면 짝도 따라옵니다 — 손으로 만들 필요가 없습니다.
자세한 내용과 `maybe(first)` 와의 차이는 [Monoid](./Monoid.md) 문서를 보십시오.

## 참고

- [Alt](./Alt.md) - 부모 타입 클래스
- [Alternative](./Alternative.md) - Applicative + Plus
- [Monoid](./Monoid.md) - `plus(<타입>)` 키로 유도된다
