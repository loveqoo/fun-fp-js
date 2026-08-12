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
```javascript no-run 대수 법칙 — 자유변수 표기
const objectMonoid = new Monoid(
    new Semigroup((a, b) => ({ ...a, ...b }), 'Object'),
    () => ({}),
    'Object'
);
const { concat, empty } = objectMonoid;
concat(a, empty) === a
```

### 2. 좌항등원 (Left Identity)
```javascript no-run 대수 법칙 — 자유변수 표기
const objectMonoid = new Monoid(
    new Semigroup((a, b) => ({ ...a, ...b }), 'Object'),
    () => ({}),
    'Object'
);
const { concat, empty } = objectMonoid;
concat(empty, a) === a
```

## 인터페이스

```javascript no-run 시그니처·의사코드 표기
Monoid.empty(): a         // 항등원 반환
Monoid.concat(a, b): a    // Semigroup에서 상속
```

## 사용 예시

### 기본 사용

```javascript
import FunFP from 'fun-fp-js';
const { Monoid } = FunFP;

// 문자열
const str = Monoid.lookup('string');
str.empty();  // ''
str.concat('Hello', str.empty());  // 'Hello'

// 배열
const arr = Monoid.lookup('array');
arr.empty();  // []
arr.concat([1, 2], arr.empty());  // [1, 2]

// 숫자 덧셈
const num = Monoid.lookup('number');
num.empty();  // 0
num.concat(5, num.empty());  // 5
```

## `plus(<타입>)` — Plus 에서 유도된 Monoid

`Plus` 는 `alt`(결합 연산)와 `zero`(항등원)를 **둘 다** 가집니다. 즉 구조적으로 Monoid 인데
태그만 없습니다. 그래서 **등록된 `Plus` 마다 짝 `Semigroup`/`Monoid` 가 `plus(<alias>)` 키로
자동으로 생깁니다.**

```javascript
const { Monoid, Semigroup, Maybe } = FunFP;

console.log(Monoid.lookup('plus(array)').concat([1], [2]));   // [1, 2]
console.log(Monoid.lookup('plus(array)').empty());            // []

const pm = Monoid.lookup('plus(maybe)');
console.log(pm.concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1  — 첫 Just 를 고른다
console.log(pm.empty().isNothing());                         // true

// Semigroup 짝도 함께 등록됩니다
console.log(Semigroup.lookup('plus(array)').concat([1], [2]));   // [1, 2]
```

### `plus(maybe)` 와 `maybe(first)` — 안을 여느냐

이름이 비슷하지만 **다른 모노이드**입니다. 갈리는 지점은 **payload 타입이 섞였을 때**입니다.

```javascript
const { Monoid, Maybe } = FunFP;

const plus = Monoid.lookup('plus(maybe)');    // 봉투째 고른다 — 안을 열지 않는다
const inner = Maybe.Monoid('first');       // 안을 열어 first 로 합친다

// payload 타입이 같으면 결과도 같다
console.log(plus.concat(Maybe.Just(1), Maybe.Just(2)).value);   // 1
console.log(inner.concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1

// 섞이면 갈린다
console.log(plus.concat(Maybe.Just(1), Maybe.Just('a')).value);  // 1
try {
    inner.concat(Maybe.Just(1), Maybe.Just('a'));
} catch (e) {
    console.log(e.message);  // Semigroup.concat: arguments must be the same type
}
```

**"합치기" 면 `maybe(first)`, "고르기" 면 `plus(maybe)`** 입니다.
`Optics.preview` 가 후자를 씁니다 — 배열에 뭐가 들었든 "첫 번째" 는 답할 수 있어야 하니까요.

항등원은 양쪽 다 `Nothing` 입니다.

## 실용적 활용

### 안전한 fold (빈 배열 처리)

Semigroup만으로는 빈 배열을 처리할 수 없지만, Monoid는 가능합니다:

```javascript
// Semigroup - 빈 배열에서 에러!
// arr.reduce((a, b) => semigroup.concat(a, b))  // Error on []

// Monoid - 안전!
const monoid = Monoid.lookup('number');

const foldMonoid = arr => arr.reduce(
    (acc, x) => monoid.concat(acc, x),
    monoid.empty()
);

foldMonoid([1, 2, 3]);  // 6
foldMonoid([]);         // 0 (안전!)
```

### 조건부 결합

```javascript
const errors = ['이름은 필수입니다'];
const warnings = [];
const hasErrors = errors.length > 0;
const hasWarnings = warnings.length > 0;
const arr = Monoid.lookup('array');

const concatIf = (condition, value) =>
    condition ? value : arr.empty();

const result = arr.concat(
    concatIf(hasErrors, errors),
    concatIf(hasWarnings, warnings)
);
// 조건에 맞는 것만 결합, 없으면 빈 배열
```

### 객체 기본값 패턴

```javascript
// 객체 병합 Monoid 는 기본 제공되지 않으므로 직접 만든다
const objectMonoid = new Monoid(
    new Semigroup((a, b) => ({ ...a, ...b }), 'Object'),
    () => ({}),
    'Object'
);
const { concat, empty } = objectMonoid;

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

const arr = Monoid.lookup('array');

const combineResults = (results) => results.reduce(
    (acc, r) => ({
        value: r.value,
        messages: arr.concat(acc.messages, r.messages)
    }),
    { value: null, messages: arr.empty() }
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
