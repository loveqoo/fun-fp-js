# Monoid

**항등원을 가진 Semigroup**

## 개념

Monoid는 Semigroup에 **항등원(empty)**을 추가한 것입니다. 항등원은 다른 값과 결합해도 그 값을 변경하지 않는 "중립" 값입니다.

- 덧셈의 항등원: `0` (a + 0 = a)
- 곱셈의 항등원: `1` (a * 1 = a)
- 문자열의 항등원: `''` (s + '' = s)
- 배열의 항등원: `[]` ([...arr, ...[]] = arr)

## 법칙

Semigroup의 법칙(결합법칙)에 더해:

### 1. 우항등원 (Right Identity)
```javascript
concat(a, empty) === a
```

### 2. 좌항등원 (Left Identity)
```javascript
concat(empty, a) === a
```

## 인터페이스

```javascript
Monoid.empty(): a         // 항등원 반환
Monoid.concat(a, b): a    // Semigroup에서 상속
```

## 사용 예시

### 기본 사용

```javascript
import FunFP from 'fun-fp-js';
const { Monoid } = FunFP;

// 문자열
Monoid.types.StringMonoid.empty();  // ''
Monoid.types.StringMonoid.concat('Hello', Monoid.types.StringMonoid.empty());
// 'Hello'

// 배열
Monoid.types.ArrayMonoid.empty();  // []
Monoid.types.ArrayMonoid.concat([1, 2], Monoid.types.ArrayMonoid.empty());
// [1, 2]

// 숫자 덧셈
Monoid.types.NumberAddMonoid.empty();  // 0
Monoid.types.NumberAddMonoid.concat(5, Monoid.types.NumberAddMonoid.empty());
// 5

// 숫자 곱셈
Monoid.types.NumberMulMonoid.empty();  // 1
```

## 실용적 활용

### 안전한 fold (빈 배열 처리)

Semigroup만으로는 빈 배열을 처리할 수 없지만, Monoid는 가능합니다:

```javascript
// Semigroup - 빈 배열에서 에러!
// arr.reduce((a, b) => semigroup.concat(a, b))  // Error on []

// Monoid - 안전!
const foldMonoid = (monoid, arr) => arr.reduce(
    (acc, x) => monoid.concat(acc, x),
    monoid.empty()  // 초기값으로 항등원 사용
);

foldMonoid(Monoid.types.NumberAddMonoid, [1, 2, 3]);  // 6
foldMonoid(Monoid.types.NumberAddMonoid, []);         // 0 (안전!)

foldMonoid(Monoid.types.ArrayMonoid, [[1], [2], [3]]);  // [1, 2, 3]
foldMonoid(Monoid.types.ArrayMonoid, []);               // [] (안전!)
```

### 조건부 결합

```javascript
const concatIf = (monoid, condition, value) =>
    condition ? value : monoid.empty();

const result = monoid.concat(
    concatIf(Monoid.types.ArrayMonoid, hasErrors, errors),
    concatIf(Monoid.types.ArrayMonoid, hasWarnings, warnings)
);
// 조건에 맞는 것만 결합, 없으면 빈 배열
```

### 객체 기본값 패턴

```javascript
const { concat, empty } = Monoid.types.ObjectMonoid;

const withDefaults = (defaults, obj) => concat(defaults, obj);

const defaults = { theme: 'light', lang: 'en' };
const config = withDefaults(defaults, { lang: 'ko' });
// { theme: 'light', lang: 'ko' }
```

### 로그 수집

```javascript
const log = (msgs) => ({
    value: null,
    messages: msgs
});

const combineResults = (results) => results.reduce(
    (acc, r) => ({
        value: r.value,
        messages: Monoid.types.ArrayMonoid.concat(acc.messages, r.messages)
    }),
    { value: null, messages: Monoid.types.ArrayMonoid.empty() }
);
```

## Monoid vs Semigroup

| | Semigroup | Monoid |
|---|---|---|
| concat | ✅ | ✅ |
| empty | ❌ | ✅ |
| 빈 리스트 fold | 불가능 | 가능 |
| 기본값 패턴 | 수동 | 자동 |

## 관련 타입 클래스

- **Semigroup**: Monoid의 기반 (concat만 제공)
- **Group**: Monoid + 역원(invert)
