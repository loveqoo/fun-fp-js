# Semigroup

**결합 가능한(Combinable) 타입**

## 개념

Semigroup은 두 값을 **결합(combine)**하여 같은 타입의 새 값을 만들 수 있는 타입입니다. 문자열 연결, 배열 병합, 숫자 덧셈 등이 대표적인 예입니다.

핵심은 **결합법칙(Associativity)**입니다: 결합 순서를 바꿔도 결과가 같습니다.

## 법칙

### 결합법칙 (Associativity)
```javascript
concat(concat(a, b), c) === concat(a, concat(b, c))
```

예:
```javascript
// 문자열
("a" + "b") + "c" === "a" + ("b" + "c")  // "abc" === "abc"

// 숫자 덧셈
(1 + 2) + 3 === 1 + (2 + 3)  // 6 === 6

// 배열
[...[...a, ...b], ...c] === [...a, ...[...b, ...c]]
```

## 인터페이스

```javascript
Semigroup.concat(a, b): a  // a와 b를 결합
```

## 사용 예시

### 기본 결합

```javascript
import FunFP from 'fun-fp-js';
const { Semigroup } = FunFP;

// 문자열 연결
Semigroup.types.StringSemigroup.concat('Hello, ', 'World!');
// 'Hello, World!'

// 배열 병합
Semigroup.types.ArraySemigroup.concat([1, 2], [3, 4]);
// [1, 2, 3, 4]

// 객체 병합
Semigroup.types.ObjectSemigroup.concat({a: 1}, {b: 2});
// {a: 1, b: 2}

// 숫자 덧셈
Semigroup.types.NumberAddSemigroup.concat(5, 3);
// 8

// 숫자 곱셈
Semigroup.types.NumberMulSemigroup.concat(5, 3);
// 15

// 함수 합성
const add1 = x => x + 1;
const mul2 = x => x * 2;
const composed = Semigroup.types.FunctionSemigroup.concat(add1, mul2);
composed(5);  // add1(mul2(5)) = add1(10) = 11
```

## 실용적 활용

### 여러 값 결합 (reduce 패턴)

```javascript
const concatAll = (semigroup, arr) => arr.reduce(
    (acc, x) => semigroup.concat(acc, x)
);

// 모든 문자열 결합
concatAll(Semigroup.types.StringSemigroup, ['a', 'b', 'c']);
// 'abc'

// 모든 배열 병합
concatAll(Semigroup.types.ArraySemigroup, [[1], [2], [3]]);
// [1, 2, 3]

// 모든 객체 병합
concatAll(Semigroup.types.ObjectSemigroup, [{a: 1}, {b: 2}, {c: 3}]);
// {a: 1, b: 2, c: 3}
```

### 설정 병합 (기본값 패턴)

```javascript
const defaultConfig = { theme: 'dark', lang: 'en', debug: false };
const userConfig = { lang: 'ko' };

const finalConfig = Semigroup.types.ObjectSemigroup.concat(defaultConfig, userConfig);
// { theme: 'dark', lang: 'ko', debug: false }
```

### 검증 결과 수집

```javascript
// 에러 메시지 수집
const errors = [];
const validate = (cond, msg) => cond ? [] : [msg];

const nameErrors = validate(name.length > 0, 'Name is required');
const emailErrors = validate(email.includes('@'), 'Invalid email');

const allErrors = Semigroup.types.ArraySemigroup.concat(nameErrors, emailErrors);
// 모든 에러 메시지가 하나의 배열에
```

## 왜 Semigroup인가?

일반 연산자 대신 Semigroup을 사용하면:

1. **추상화**: 같은 코드로 다양한 타입 처리
2. **안전성**: 타입 보장
3. **합성 가능**: 다른 FP 패턴과 결합

```javascript
// 추상화된 합계 함수
const sum = (semigroup, arr) => arr.reduce(semigroup.concat);

sum(Semigroup.types.NumberAddSemigroup, [1, 2, 3]);     // 6
sum(Semigroup.types.StringSemigroup, ['a', 'b', 'c']);  // 'abc'
```

## 관련 타입 클래스

- **Monoid**: Semigroup + 항등원(empty)
