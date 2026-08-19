# Extend

> 한국어: [../Extend.md](../Extend.md)

A type class that adds context-based transformation (`extend`) to Functor.

## Definition

```javascript no-run 시그니처·의사코드 표기
class Extend extends Functor {
    constructor(functor, extend, type, registry, ...aliases)
}
```

## Core operation

| Operation | Signature | Description |
|-----|---------|-----|
| `extend` | `(F a → b, F a) → F b` | transforms while preserving the context |

`map` transforms only the value, but `extend` passes the entire context to
the function.

## Laws

```javascript no-run 시그니처·의사코드 표기
// associativity
extend(f, extend(g, w)) ≡ extend(w => f(extend(g, w)), w)
```

## Example: array windows

```javascript
const { extend } = Extend.lookup('array');
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

## Relationship

```
Functor ──> Extend ──> Comonad
              │           │
           extend      extract
```

## See also

- [Functor](./Functor.md) - transforms values
- [Comonad](./Comonad.md) - Extend + extract
