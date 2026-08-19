# Monoid

> 한국어: [../Monoid.md](../Monoid.md)

**A Semigroup with an identity element**

## Concept

Monoid adds an **identity element** (`empty`) to Semigroup. The identity element is a "neutral" value that leaves any other value unchanged when combined with it.

- Identity of addition: `0` (a + 0 = a)
- Identity of multiplication: `1` (a * 1 = a)
- Identity of string concatenation: `''` (s + '' = s)
- Identity of array concatenation: `[]` ([...arr, ...[]] = arr)

## Laws

In addition to Semigroup's law (associativity):

### 1. Right Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const objectMonoid = new Monoid(
    new Semigroup((a, b) => ({ ...a, ...b }), 'Object'),
    () => ({}),
    'Object'
);
const { concat, empty } = objectMonoid;
concat(a, empty) === a
```

### 2. Left Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const objectMonoid = new Monoid(
    new Semigroup((a, b) => ({ ...a, ...b }), 'Object'),
    () => ({}),
    'Object'
);
const { concat, empty } = objectMonoid;
concat(empty, a) === a
```

## Interface

```javascript no-run 시그니처·의사코드 표기
Monoid.empty(): a         // 항등원 반환
Monoid.concat(a, b): a    // Semigroup에서 상속
```

## Usage examples

### Basic usage

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

## Monoid derived from `Plus`

`Plus` has **both** `alt` (a combining operation) and `zero` (an identity element). That is, it is structurally a Monoid, just without the tag. So a registered `Plus` also gets a paired `Semigroup`/`Monoid` **under that same type name**.

**Except when that type already has a `Monoid`.** `Array` is one such case — its `alt` is exactly `concat`, so the derived instance would behave identically to `ArrayMonoid`, making it redundant.

```javascript
const { Monoid, Semigroup, Maybe } = FunFP;

const pm = Monoid.lookup('maybe');                           // Plus 에서 유도된 것
console.log(pm.concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1  — 첫 Just 를 고른다
console.log(pm.empty().isNothing());                         // true

// Semigroup 짝도 함께 등록됩니다
console.log(Semigroup.lookup('maybe').concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1

// Array 는 이미 ArrayMonoid 가 있으므로 유도본이 등록되지 않습니다
console.log(Monoid.lookup('array') === Monoid.types.ArrayMonoid);   // true
```

> **This key used to be `plus(array)`/`plus(maybe)`. That was a bug.** In this library
> `f(x)` means `F<X>`, but `plus(maybe)` returned a `Monoid`, not a `Plus`. What sat
> inside the parentheses was not the element but the **origin**, and an origin note is
> not a type.

### `Monoid.lookup('maybe')` vs `maybe(first)` — whether the inside gets opened

The names look similar, but these are **different monoids**. They diverge exactly where **payload types are mixed**.

```javascript
const { Monoid, Maybe } = FunFP;

const plus = Monoid.lookup('maybe');       // 봉투째 고른다 — 안을 열지 않는다
const inner = Monoid.Maybe('first');       // 안을 열어 first 로 합친다

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

**Use `maybe(first)` for "merge," and `maybe` for "pick."** The presence of the parentheses marks the difference — parentheses mean an inner comparator was supplied, and that is what lets the inside be opened. `Optics.preview` uses the latter, because it must be able to answer "the first one" regardless of what the array holds.

Either way, the identity element is `Nothing`.

## Practical applications

### Safe folding (handling empty arrays)

Semigroup alone cannot handle an empty array, but Monoid can:

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

### Conditional combination

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

### Object defaults pattern

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

### Collecting logs

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
| Folding an empty list | not possible | possible |
| Default-value pattern | manual | automatic |

## Related type classes

- **Semigroup**: the base Monoid builds on (provides concat only)
- **Group**: Monoid + inverse (invert)
