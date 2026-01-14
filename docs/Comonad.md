# Comonad

Extend에 값 추출(extract)을 추가한 타입 클래스. Monad의 쌍대(dual).

## 정의

```javascript
class Comonad extends Extend {
    constructor(extend, extract, type, registry, ...aliases)
}
```

## 핵심 연산

| 연산 | 시그니처 | 설명 |
|-----|---------|-----|
| `extract` | `F a → a` | 값 추출 |
| `extend` | (Extend) | 컨텍스트 기반 변환 |

## 법칙

```javascript
// left identity
extend(extract, w) ≡ w

// right identity
extract(extend(f, w)) ≡ f(w)

// associativity (Extend 법칙)
extend(f, extend(g, w)) ≡ extend(w => f(extend(g, w)), w)
```

## Monad vs Comonad

| Monad | Comonad |
|-------|---------|
| `of: a → F a` | `extract: F a → a` |
| `chain: (a → F b, F a) → F b` | `extend: (F a → b, F a) → F b` |
| 값을 컨텍스트에 넣음 | 컨텍스트에서 값을 꺼냄 |
| 순차 실행 | 컨텍스트 기반 계산 |

## 예시

```javascript
const { Comonad } = FunFP;

// Identity Comonad (가장 간단한 예시)
const identityExtend = {
    map: (f, { value }) => ({ value: f(value) }),
    extend: (f, w) => ({ value: f(w) }),
    extract: ({ value }) => value
};

const w = { value: 42 };

// extract: 값 추출
identityExtend.extract(w);  // 42

// extend with extract: 원본 유지 (left identity)
identityExtend.extend(identityExtend.extract, w);  // { value: 42 }
```

## 실용적 사용

Comonad는 다음과 같은 상황에서 유용합니다:

- **셀룰러 오토마타**: 각 셀이 이웃을 보고 다음 상태 결정
- **이미지 처리**: 픽셀 주변 컨텍스트 기반 필터
- **스프레드시트**: 셀이 다른 셀들을 참조
- **게임**: 캐릭터 주변 환경 인식

## 관계

```
Extend ──> Comonad
   │          │
extend     extract

(Monad의 쌍대)
   of  ↔  extract
 chain ↔  extend
```

## 참고

- [Extend](./Extend.md) - 부모 타입 클래스
- [Monad](./Monad.md) - 쌍대 개념
