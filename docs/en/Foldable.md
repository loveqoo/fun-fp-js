# Foldable

> 한국어: [../Foldable.md](../Foldable.md)

**A type that folds its values down to one**

## Concept

Foldable is a type that can **reduce all the elements of a container to a single value**.

The same idea as JavaScript's `Array.reduce`:
```javascript
[1, 2, 3, 4, 5].reduce((acc, x) => acc + x, 0)  // 15
```

## Interface

```javascript no-run 시그니처·의사코드 표기
Foldable.reduce(f, initial, t): b
// f: (b, a) -> b  (누적 함수)
// initial: b     (초기값)
// t: Foldable a  (접을 컨테이너)
```

## Usage examples

### Basic usage

```javascript
import FunFP from 'fun-fp-js';
const { Foldable } = FunFP;

const { reduce } = Foldable.lookup('array');

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

### Foldable objects

```javascript
const { reduce } = Foldable.lookup('object');

const obj = { a: 1, b: 2, c: 3 };

// 값 합계
reduce((acc, x) => acc + x, 0, obj);
// 6
```

## Practical examples

### Max / min

```javascript
const { reduce } = Foldable.lookup('array');

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

### Grouping

```javascript
const { reduce } = Foldable.lookup('array');
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

### Frequency count

```javascript
const { reduce } = Foldable.lookup('array');
const frequencies = arr => reduce(
    (acc, x) => ({ ...acc, [x]: (acc[x] || 0) + 1 }),
    {},
    arr
);

frequencies(['a', 'b', 'a', 'c', 'b', 'a']);
// { a: 3, b: 2, c: 1 }
```

### Using it in a pipeline

```javascript
const { reduce } = Foldable.lookup('array');
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

## foldMap — combining fold and map

`foldMap` is a powerful function that combines Foldable and Monoid to **map and then reduce**
in a single pass.

### Concept

The usual pattern:
1. transform the array's elements (map)
2. reduce the transformed values (reduce)

`foldMap` handles both steps at once, using a Monoid.

### Usage

```javascript
import FunFP from 'fun-fp-js';
const { foldMap, Foldable, Monoid } = FunFP;

// foldMap(Foldable, Monoid) -> (매핑함수) -> (컨테이너) -> 결과

// 기본 사용
const sumFold = foldMap(Foldable.lookup('array'), Monoid.lookup('number'));

sumFold(x => x * x)([1, 2, 3, 4]);
// 1² + 2² + 3² + 4² = 1 + 4 + 9 + 16 = 30
```

### How it works internally

```javascript
// foldMap의 간소화된 구현
const foldMap = (foldable, monoid) => f => container =>
    foldable.reduce(
        (acc, x) => monoid.concat(acc, f(x)),
        monoid.empty(),
        container
    );
```

1. `f(x)`: transform each element
2. `monoid.concat(acc, f(x))`: combine the transformed value with the Monoid
3. `monoid.empty()`: use the Monoid's empty value as the initial value

### Practical examples

#### Sum of squares

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

const sumFold = foldMap(Foldable.lookup('array'), Monoid.lookup('number'));

// 배열 요소의 제곱 합
sumFold(x => x * x)([1, 2, 3, 4]);
// 30

// 절대값의 합
sumFold(Math.abs)([-5, 3, -2, 7]);
// 17
```

#### Extracting an object field and summing it

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

const sumFold = foldMap(Foldable.lookup('array'), Monoid.lookup('number'));

const users = [
    { name: 'Alice', score: 10 },
    { name: 'Bob', score: 20 },
    { name: 'Charlie', score: 15 }
];

// 모든 사용자의 점수 합
sumFold(u => u.score)(users);
// 45
```

#### Summing string lengths

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

const sumFold = foldMap(Foldable.lookup('array'), Monoid.lookup('number'));

const words = ['hello', 'world', 'foo', 'bar'];

// 모든 단어의 길이 합
sumFold(str => str.length)(words);
// 5 + 5 + 3 + 3 = 16
```

#### With a custom Monoid

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

// String Monoid로 문자열 연결
const stringFold = foldMap(Foldable.lookup('array'), Monoid.lookup('string'));

stringFold(n => `${n}, `)([1, 2, 3, 4]);
// '1, 2, 3, 4, '

// Array Monoid로 배열 병합
const arrayFold = foldMap(Foldable.lookup('array'), Monoid.lookup('array'));

arrayFold(n => [n, n * 2])([1, 2, 3]);
// [1, 2, 2, 4, 3, 6]
```

#### With conditional filtering

```javascript
const { foldMap, Foldable, Monoid } = FunFP;

const sumFold = foldMap(Foldable.lookup('array'), Monoid.lookup('number'));

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
| steps | 2 (map → reduce) | 1 |
| intermediate array | created | not created |
| performance | pays for the intermediate allocation | more efficient |
| readability | straightforward | declarative |

```javascript
const sumFold = foldMap(Foldable.lookup('array'), Monoid.lookup('number'));
// map + reduce
[1, 2, 3, 4]
    .map(x => x * x)  // [1, 4, 9, 16] (중간 배열 생성)
    .reduce((a, b) => a + b, 0);  // 30

// foldMap
sumFold(x => x * x)([1, 2, 3, 4]);  // 30 (중간 배열 없음)
```

### When should you use foldMap?

**Good fits:**
1. when transforming and reducing at the same time
2. when the reduction can be expressed as a Monoid
3. when performance matters (no intermediate array)
4. when you prefer a declarative style

**Alternatives:**
- for a plain reduction: `Foldable.reduce`
- for complex logic: an explicit `map` + `reduce`

## Related type classes

- **Traversable**: Foldable + Functor + traversal with effects
- **Monoid**: frequently used as the result type of a fold
