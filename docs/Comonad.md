# Comonad

Extend에 값 추출(extract)을 추가한 타입 클래스. Monad의 쌍대(dual).

## 정의

```javascript no-run 시그니처·의사코드 표기
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

```javascript no-run 시그니처·의사코드 표기
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

등록된 인스턴스가 둘 있습니다 — `identity` 와 `array`. `lookup` 으로 꺼냅니다.

```javascript
const { Comonad, Identity } = FunFP;

// Identity Comonad — 상자 하나에 값 하나
const IC = Comonad.lookup('identity');
const w = Identity.of(42);
console.log(IC.extract(w));                          // 42 — 값 추출
console.log(IC.extract(IC.extend(IC.extract, w)));   // 42 — 좌항등 관측 (extend(extract, w) ≡ w)

// Array Comonad — extract 는 첫 원소, extend 는 각 꼬리(suffix)에 f 를 적용
const AC = Comonad.lookup('array');
console.log(AC.extract([1, 2, 3]));                  // 1
console.log(AC.extend(xs => xs.length, [1, 2, 3]));  // [3, 2, 1] — 각 위치에서 남은 길이
```

> **주의 — `Array` 는 비어 있지 않을 때만 `Comonad` 다.** `extract([])` 는 꺼낼 값이 없어
> `undefined` 입니다(수학에서도 배열 comonad 는 NonEmptyArray 에서만 성립). 빈 배열은 이
> 인스턴스의 정의역 밖입니다 —
> 근거: [`internals.md#array-comonad`](./internals.md#array-comonad).

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
