# Extend

Functor에 컨텍스트 기반 변환(extend)을 추가한 타입 클래스.

## 정의

```javascript
class Extend extends Functor {
    constructor(functor, extend, type, registry, ...aliases)
}
```

## 핵심 연산

| 연산 | 시그니처 | 설명 |
|-----|---------|-----|
| `extend` | `(F a → b, F a) → F b` | 컨텍스트를 보존하며 변환 |

`map`은 값만 변환하지만, `extend`는 전체 컨텍스트를 함수에 전달합니다.

## 법칙

```javascript
// associativity
extend(f, extend(g, w)) ≡ extend(w => f(extend(g, w)), w)
```

## 예시: 배열 윈도우

```javascript
// extend는 "주변 컨텍스트를 보면서 계산"할 때 유용

const sum = arr => arr.reduce((a, b) => a + b, 0);
const avg = arr => sum(arr) / arr.length;

// 이동 평균 계산
const movingAvg = extend(avg, [1, 2, 3, 4, 5]);
// 각 위치에서 그 위치부터 끝까지의 평균
// [[1,2,3,4,5], [2,3,4,5], [3,4,5], [4,5], [5]]
// [3, 3.5, 4, 4.5, 5]
```

## map vs extend

```
map:    F a → (a → b)   → F b    // 값만 변환
extend: F a → (F a → b) → F b    // 전체 구조를 보고 변환
```

## 관계

```
Functor ──> Extend ──> Comonad
              │           │
           extend      extract
```

## 참고

- [Functor](./Functor.md) - 값 변환
- [Comonad](./Comonad.md) - Extend + extract
