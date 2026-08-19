# Setoid

> 한국어: [../Setoid.md](../Setoid.md)

**A type whose values can be compared for equality**

## Concept

Setoid defines a type whose two values can be compared to see whether they are "equal." It resembles JavaScript's `===`, but lets you define custom equality logic.

## Laws

A Setoid must satisfy the following laws:

### 1. Reflexivity
```javascript no-run 대수 법칙 — 자유변수 표기
equals(a, a) === true
```
A value is always equal to itself.

### 2. Symmetry
```javascript no-run 대수 법칙 — 자유변수 표기
equals(a, b) === equals(b, a)
```
Swapping the comparison order does not change the result.

### 3. Transitivity
```javascript no-run 대수 법칙 — 자유변수 표기
if (equals(a, b) && equals(b, c)) {
    equals(a, c) === true
}
```
If a equals b, and b equals c, then a equals c.

## Interface

```javascript no-run 시그니처·의사코드 표기
Setoid.equals(a, b): boolean
```

## Usage examples

### Comparing primitive types

```javascript
import FunFP from 'fun-fp-js';
const { Setoid } = FunFP;

// 숫자 비교
Setoid.lookup('number').equals(1, 1);    // true
Setoid.lookup('number').equals(1, 2);    // false

// 문자열 비교
Setoid.lookup('string').equals('hello', 'hello');  // true

// 배열·객체 Setoid 는 기본 제공되지 않는다 — 직접 만든다
const arraySetoid = new Setoid(
    (a, b) => a.length === b.length && a.every((x, i) => x === b[i]),
    'Array'
);
arraySetoid.equals([1, 2], [1, 2]);  // true
arraySetoid.equals([1, 2], [1, 3]);  // false
```

### Automatic type inference

```javascript
// Setoid.lookup로 타입에 맞는 인스턴스 자동 선택
const numSetoid = Setoid.lookup('number');
numSetoid.equals(1, 1);  // true
```

## Practical applications

### Removing duplicates
```javascript
const setoid = Setoid.lookup('number');

const uniqueBy = arr => arr.reduce((acc, item) => 
    acc.some(x => setoid.equals(x, item)) ? acc : [...acc, item],
    []
);

uniqueBy([1, 2, 1, 3, 2]);  // [1, 2, 3]
```

### Finding an element in an array
```javascript
// 객체 Setoid 는 기본 제공되지 않으므로 직접 만든다
const setoid = new Setoid((a, b) => a.id === b.id, 'Object');

const findBy = (target, arr) => arr.find(x => setoid.equals(x, target));

findBy({id: 1}, [{id: 1, name: 'a'}, {id: 2, name: 'b'}]);
// {id: 1, name: 'a'}
```

## Related type classes

- **Ord**: extends Setoid with order comparison (`lte`)
