# Semigroup

> 한국어: [../Semigroup.md](../Semigroup.md)

**A type whose values can be combined**

## Concept

Semigroup is a type whose two values can be **combined** (`concat`) into a new value of the same type. String concatenation, array merging, and number addition are typical examples.

The core property is **associativity**: changing the grouping of the combination does not change the result.

## Laws

### Associativity
```javascript no-run 대수 법칙 — 자유변수 표기
const { concat } = Semigroup.lookup('array');
concat(concat(a, b), c) === concat(a, concat(b, c))
```

Examples:
```javascript no-run 시그니처·의사코드 표기
// 문자열
("a" + "b") + "c" === "a" + ("b" + "c")  // "abc" === "abc"

// 숫자 덧셈
(1 + 2) + 3 === 1 + (2 + 3)  // 6 === 6

// 배열
[...[...a, ...b], ...c] === [...a, ...[...b, ...c]]
```

## Interface

```javascript no-run 시그니처·의사코드 표기
Semigroup.concat(a, b): a  // a와 b를 결합
```

## Usage examples

### Basic combination

```javascript
import FunFP from 'fun-fp-js';
const { Semigroup } = FunFP;

// 문자열 연결
Semigroup.lookup('string').concat('Hello, ', 'World!');  // 'Hello, World!'

// 배열 병합
Semigroup.lookup('array').concat([1, 2], [3, 4]);  // [1, 2, 3, 4]

// 숫자 덧셈
Semigroup.lookup('number').concat(5, 3);  // 8

// 함수 합성
const add1 = x => x + 1;
const mul2 = x => x * 2;
const composed = Semigroup.lookup('function').concat(add1, mul2);
composed(5);  // add1(mul2(5)) = add1(10) = 11
```

## Practical applications

### Combining many values (reduce pattern)

```javascript
const { concat } = Semigroup.lookup('array');

const concatAll = arr => arr.reduce(concat);
concatAll([[1], [2], [3]]);  // [1, 2, 3]
```

### Collecting validation results

```javascript
const name = 'Alice';
const email = 'alice@example.com';
// 에러 메시지 수집
const errors = [];
const validate = (cond, msg) => cond ? [] : [msg];

const { concat } = Semigroup.lookup('array');

const nameErrors = validate(name.length > 0, 'Name is required');
const emailErrors = validate(email.includes('@'), 'Invalid email');

const allErrors = concat(nameErrors, emailErrors);
```

## Why Semigroup?

Using Semigroup instead of plain operators gives you:

1. **Abstraction**: the same code handles many different types
2. **Safety**: types are guaranteed to line up
3. **Composability**: combines with other FP patterns

```javascript
// 추상화된 합계 함수
const sum = (type, arr) => arr.reduce(Semigroup.lookup(type).concat);

sum('number', [1, 2, 3]);     // 6
sum('string', ['a', 'b', 'c']);  // 'abc'
```

## Related type classes

- **Monoid**: Semigroup + identity element (empty)
