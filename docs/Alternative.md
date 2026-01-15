# Alternative

Applicative와 Plus를 결합한 타입 클래스. 선택과 병렬 실행 패턴을 지원.

## 정의

```javascript
class Alternative extends Applicative {
    constructor(applicative, plus, type, registry, ...aliases)
}
```

## 핵심 연산

Alt, Plus, Applicative의 모든 연산을 상속:

| 연산 | 출처 | 설명 |
|-----|------|-----|
| `of` | Applicative | 값 포장 |
| `ap` | Apply | 함수 적용 |
| `alt` | Alt | 대안 선택 |
| `zero` | Plus | 빈 대안 |

## 법칙

```javascript
// distributivity (왼쪽에서 오른쪽)
ap(alt(a, b), c) ≡ alt(ap(a, c), ap(b, c))

// annihilation
ap(zero(), a) ≡ zero()
```

## 사용 예시

```javascript
const { Maybe, Alt, Applicative } = FunFP;

const { alt } = Alt.of('maybe');

// 첫 번째 성공 값 선택
const result = alt(Maybe.Nothing(), Maybe.of(42));  // Just(42)

// 모두 실패하면 Nothing
const noResult = alt(Maybe.Nothing(), Maybe.Nothing());  // Nothing
```

## 관계

```
Applicative ──┐
              ├──> Alternative
Plus ─────────┘
```

## 참고

- [Applicative](./Applicative.md) - 값 포장과 적용
- [Plus](./Plus.md) - 빈 대안
- [Alt](./Alt.md) - 대안 선택
