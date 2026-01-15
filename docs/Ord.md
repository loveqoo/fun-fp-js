# Ord

**순서(Order)를 비교할 수 있는 타입**

## 개념

Ord는 Setoid를 확장하여 두 값의 **순서**를 비교할 수 있게 합니다. "작거나 같다(less than or equal)"를 정의하면 "<", ">", "==" 모든 비교가 가능합니다.

## 법칙

Ord는 Setoid의 법칙에 더해 다음을 만족해야 합니다:

### 1. 반사성 (Reflexivity)
```javascript
lte(a, a) === true
```

### 2. 반대칭성 (Antisymmetry)
```javascript
if (lte(a, b) && lte(b, a)) {
    equals(a, b) === true
}
```

### 3. 추이성 (Transitivity)
```javascript
if (lte(a, b) && lte(b, c)) {
    lte(a, c) === true
}
```

### 4. 전체성 (Totality)
```javascript
lte(a, b) === true || lte(b, a) === true
```
모든 두 값은 비교 가능합니다.

## 인터페이스

```javascript
Ord.lte(a, b): boolean  // a ≤ b
```

## 사용 예시

### 기본 비교

```javascript
import FunFP from 'fun-fp-js';
const { Ord } = FunFP;

// 숫자
const num = Ord.of('number');
num.lte(1, 2);   // true (1 ≤ 2)
num.lte(2, 1);   // false
num.lte(2, 2);   // true

// 문자열 (사전순)
const str = Ord.of('string');
str.lte('apple', 'banana');  // true
str.lte('z', 'a');           // false

// 날짜
const date = Ord.of('date');
const d1 = new Date('2023-01-01');
const d2 = new Date('2023-12-31');
date.lte(d1, d2);   // true
```

### 파생 비교 연산자

```javascript
const { lte } = Ord.of('number');

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

## 실용적 활용

### 정렬

```javascript
const ord = Ord.of('number');

const sortBy = arr => [...arr].sort((a, b) => 
    ord.lte(a, b) ? (ord.lte(b, a) ? 0 : -1) : 1
);

sortBy([3, 1, 4, 1, 5]);  // [1, 1, 3, 4, 5]
```

### 최소/최대값

```javascript
const ord = Ord.of('number');

const min = (a, b) => ord.lte(a, b) ? a : b;
const max = (a, b) => ord.lte(a, b) ? b : a;

min(5, 3);  // 3
max(5, 3);  // 5

const minBy = arr => arr.reduce((acc, x) => min(acc, x));
minBy([3, 1, 4, 1, 5]);  // 1
```

### 범위 체크

```javascript
const ord = Ord.of('number');

const between = (low, high, x) => ord.lte(low, x) && ord.lte(x, high);

between(1, 10, 5);   // true
between(1, 10, 15);  // false
```

## 관련 타입 클래스

- **Setoid**: Ord의 기반 (equals 제공)
