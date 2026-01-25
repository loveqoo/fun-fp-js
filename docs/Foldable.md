# Foldable

**값을 접어서(fold) 하나로 축소하는 타입**

## 개념

Foldable은 컨테이너의 **모든 요소를 하나의 값으로 축소**할 수 있는 타입입니다.

JavaScript의 `Array.reduce`와 같은 개념:
```javascript
[1, 2, 3, 4, 5].reduce((acc, x) => acc + x, 0)  // 15
```

## 인터페이스

```javascript
Foldable.reduce(f, initial, t): b
// f: (b, a) -> b  (누적 함수)
// initial: b     (초기값)
// t: Foldable a  (접을 컨테이너)
```

## 사용 예시

### 기본 사용

```javascript
import FunFP from 'fun-fp-js';
const { Foldable } = FunFP;

const { reduce } = Foldable.of('array');

// 합계
reduce((acc, x) => acc + x, 0, [1, 2, 3, 4, 5]);
// 15

// 곱
reduce((acc, x) => acc * x, 1, [1, 2, 3, 4, 5]);
// 120

// 문자열 연결
reduce((acc, x) => acc + x, '', ['a', 'b', 'c']);
// 'abc'

// 배열 평탄화
reduce((acc, x) => [...acc, ...x], [], [[1, 2], [3, 4], [5]]);
// [1, 2, 3, 4, 5]
```

### 객체 Foldable

```javascript
const { reduce } = Foldable.of('object');

const obj = { a: 1, b: 2, c: 3 };

// 값 합계
reduce((acc, x) => acc + x, 0, obj);
// 6
```

## 실용적 예시

### 최대/최소값

```javascript
const { reduce } = Foldable.of('array');

const max = arr => reduce(
    (acc, x) => x > acc ? x : acc,
    -Infinity,
    arr
);

const min = arr => reduce(
    (acc, x) => x < acc ? x : acc,
    Infinity,
    arr
);

max([3, 1, 4, 1, 5, 9]);  // 9
min([3, 1, 4, 1, 5, 9]);  // 1
```

### 그룹화

```javascript
const groupBy = (keyFn, arr) => reduce(
    (acc, x) => {
        const key = keyFn(x);
        return { ...acc, [key]: [...(acc[key] || []), x] };
    },
    {},
    arr
);

const people = [
    { name: 'Alice', dept: 'Dev' },
    { name: 'Bob', dept: 'Design' },
    { name: 'Charlie', dept: 'Dev' }
];

groupBy(p => p.dept, people);
// { Dev: [{name: 'Alice'...}, {name: 'Charlie'...}], Design: [{name: 'Bob'...}] }
```

### 빈도 계산

```javascript
const frequencies = arr => reduce(
    (acc, x) => ({ ...acc, [x]: (acc[x] || 0) + 1 }),
    {},
    arr
);

frequencies(['a', 'b', 'a', 'c', 'b', 'a']);
// { a: 3, b: 2, c: 1 }
```

### 파이프라인에서 사용

```javascript
const numbers = [1, 2, 3, 4, 5];

// fold로 통계 계산
const stats = reduce(
    (acc, x) => ({
        sum: acc.sum + x,
        count: acc.count + 1,
        min: Math.min(acc.min, x),
        max: Math.max(acc.max, x)
    }),
    { sum: 0, count: 0, min: Infinity, max: -Infinity },
    numbers
);

// { sum: 15, count: 5, min: 1, max: 5 }
const avg = stats.sum / stats.count;  // 3
```

## foldMap - Fold + Map 조합

`foldMap`는 Foldable과 Monoid를 조합하여 **매핑 후 축소**를 한번에 수행하는 강력한 함수입니다.

### 개념

일반적인 패턴:
1. 배열 요소를 변환 (map)
2. 변환된 값들을 축소 (reduce)

`foldMap`는 이 두 단계를 Monoid를 사용하여 한번에 처리합니다.

### 사용법

```javascript
import FunFP from 'fun-fp-js';
const { foldMap, Foldable, Monoid } = FunFP;

// foldMap(Foldable, Monoid) -> (매핑함수) -> (컨테이너) -> 결과

// 기본 사용
const sumFold = foldMap(Foldable.of('array'), Monoid.of('sum'));

sumFold(x => x * x)([1, 2, 3, 4]);
// 1² + 2² + 3² + 4² = 1 + 4 + 9 + 16 = 30
```

### 내부 동작

```javascript
// foldMap의 간소화된 구현
const foldMap = (foldable, monoid) => f => container =>
    foldable.reduce(
        (acc, x) => monoid.concat(acc, f(x)),
        monoid.empty(),
        container
    );
```

1. `f(x)`: 각 요소를 변환
2. `monoid.concat(acc, f(x))`: 변환된 값을 Monoid로 결합
3. `monoid.empty()`: 초기값으로 Monoid의 빈 값 사용

### 실용적 예시

#### 제곱의 합

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

const sumFold = foldMap(Foldable.of('array'), Monoid.of('sum'));

// 배열 요소의 제곱 합
sumFold(x => x * x)([1, 2, 3, 4]);
// 30

// 절대값의 합
sumFold(Math.abs)([-5, 3, -2, 7]);
// 17
```

#### 객체 값 추출 후 합

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

const sumFold = foldMap(Foldable.of('array'), Monoid.of('sum'));

const users = [
    { name: 'Alice', score: 10 },
    { name: 'Bob', score: 20 },
    { name: 'Charlie', score: 15 }
];

// 모든 사용자의 점수 합
sumFold(u => u.score)(users);
// 45
```

#### 문자열 길이 합

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

const sumFold = foldMap(Foldable.of('array'), Monoid.of('sum'));

const words = ['hello', 'world', 'foo', 'bar'];

// 모든 단어의 길이 합
sumFold(str => str.length)(words);
// 5 + 5 + 3 + 3 = 16
```

#### 커스텀 Monoid와 함께

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

// String Monoid로 문자열 연결
const stringFold = foldMap(Foldable.of('array'), Monoid.of('string'));

stringFold(n => `${n}, `)([1, 2, 3, 4]);
// '1, 2, 3, 4, '

// Array Monoid로 배열 병합
const arrayFold = foldMap(Foldable.of('array'), Monoid.of('array'));

arrayFold(n => [n, n * 2])([1, 2, 3]);
// [1, 2, 2, 4, 3, 6]
```

#### 조건부 필터링과 함께

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

const sumFold = foldMap(Foldable.of('array'), Monoid.of('sum'));

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 짝수의 합
sumFold(n => n % 2 === 0 ? n : 0)(numbers);
// 2 + 4 + 6 + 8 + 10 = 30

// 5보다 큰 수의 합
sumFold(n => n > 5 ? n : 0)(numbers);
// 6 + 7 + 8 + 9 + 10 = 40
```

### foldMap vs map + reduce

| | map + reduce | foldMap |
|---|---|---|
| 단계 | 2단계 (map → reduce) | 1단계 |
| 중간 배열 | 생성됨 | 생성 안 됨 |
| 성능 | 중간 배열 할당 | 더 효율적 |
| 가독성 | 직관적 | 선언적 |

```javascript
// map + reduce
[1, 2, 3, 4]
    .map(x => x * x)  // [1, 4, 9, 16] (중간 배열 생성)
    .reduce((a, b) => a + b, 0);  // 30

// foldMap
sumFold(x => x * x)([1, 2, 3, 4]);  // 30 (중간 배열 없음)
```

### 언제 foldMap을 사용하는가?

**사용하면 좋은 경우:**
1. 변환과 축소를 동시에 수행할 때
2. Monoid로 표현 가능한 축소 연산
3. 성능이 중요한 경우 (중간 배열 없음)
4. 선언적 스타일 선호

**대안 사용:**
- 단순 축소만: `Foldable.reduce`
- 복잡한 로직: 명시적 `map` + `reduce`

## 관련 타입 클래스

- **Traversable**: Foldable + Functor + 효과 순회
- **Monoid**: fold의 결과 타입으로 자주 사용
