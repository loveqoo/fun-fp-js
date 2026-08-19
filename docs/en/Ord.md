# Ord

> 한국어: [../Ord.md](../Ord.md)

**A type whose values can be compared by order**

## Concept

Ord extends Setoid so that two values can also be compared by **order**. Once you define "less than or equal," every comparison — "<", ">", "==" — follows from it.

## Laws

In addition to Setoid's laws, Ord must satisfy the following:

### 1. Reflexivity
```javascript no-run 대수 법칙 — 자유변수 표기
const { lte } = Ord.lookup('number');
lte(a, a) === true
```

### 2. Antisymmetry
```javascript no-run 대수 법칙 — 자유변수 표기
const { lte } = Ord.lookup('number');
if (lte(a, b) && lte(b, a)) {
    equals(a, b) === true
}
```

### 3. Transitivity
```javascript no-run 대수 법칙 — 자유변수 표기
const { lte } = Ord.lookup('number');
if (lte(a, b) && lte(b, c)) {
    lte(a, c) === true
}
```

### 4. Totality
```javascript no-run 대수 법칙 — 자유변수 표기
const { lte } = Ord.lookup('number');
lte(a, b) === true || lte(b, a) === true
```
Any two values are comparable.

## Interface

```javascript no-run 시그니처·의사코드 표기
Ord.lte(a, b): boolean  // a ≤ b
```

## Usage examples

### Basic comparison

```javascript
import FunFP from 'fun-fp-js';
const { Ord } = FunFP;

// 숫자
const num = Ord.lookup('number');
num.lte(1, 2);   // true (1 ≤ 2)
num.lte(2, 1);   // false
num.lte(2, 2);   // true

// 문자열 (사전순)
const str = Ord.lookup('string');
str.lte('apple', 'banana');  // true
str.lte('z', 'a');           // false

// 날짜
const date = Ord.lookup('date');
const d1 = new Date('2023-01-01');
const d2 = new Date('2023-12-31');
date.lte(d1, d2);   // true
```

### Deriving other comparison operators

```javascript
const { lte } = Ord.lookup('number');

// a < b
const lt = (a, b) => lte(a, b) && !lte(b, a);

// a > b
const gt = (a, b) => !lte(a, b);

// a >= b
const gte = (a, b) => lte(b, a);

lt(1, 2);   // true
gt(3, 2);   // true
gte(2, 2);  // true
```

## Practical applications

### Sorting

```javascript
const ord = Ord.lookup('number');

const sortBy = arr => [...arr].sort((a, b) => 
    ord.lte(a, b) ? (ord.lte(b, a) ? 0 : -1) : 1
);

sortBy([3, 1, 4, 1, 5]);  // [1, 1, 3, 4, 5]
```

### Min / max

```javascript
const ord = Ord.lookup('number');

const min = (a, b) => ord.lte(a, b) ? a : b;
const max = (a, b) => ord.lte(a, b) ? b : a;

min(5, 3);  // 3
max(5, 3);  // 5

const minBy = arr => arr.reduce((acc, x) => min(acc, x));
minBy([3, 1, 4, 1, 5]);  // 1
```

### Range check

```javascript
const ord = Ord.lookup('number');

const between = (low, high, x) => ord.lte(low, x) && ord.lte(x, high);

between(1, 10, 5);   // true
between(1, 10, 15);  // false
```

## Related type classes

- **Setoid**: the base Ord builds on (provides equals)
