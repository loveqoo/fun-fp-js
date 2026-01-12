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

const { reduce } = Foldable.types.ArrayFoldable;

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
const { reduce } = Foldable.types.ObjectFoldable;

const obj = { a: 1, b: 2, c: 3 };

// 값 합계
reduce((acc, x) => acc + x, 0, obj);
// 6
```

## 실용적 예시

### 최대/최소값

```javascript
const { reduce } = Foldable.types.ArrayFoldable;

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

## Foldable과 Monoid

Foldable은 Monoid와 함께 사용하면 강력합니다:

```javascript
const foldMap = (monoid, f, foldable) =>
    Foldable.types.ArrayFoldable.reduce(
        (acc, x) => monoid.concat(acc, f(x)),
        monoid.empty(),
        foldable
    );

// 예: 배열의 모든 길이 합
foldMap(
    Monoid.types.NumberAddMonoid,
    str => str.length,
    ['hello', 'world']
);
// 10
```

## 관련 타입 클래스

- **Traversable**: Foldable + Functor + 효과 순회
- **Monoid**: fold의 결과 타입으로 자주 사용
