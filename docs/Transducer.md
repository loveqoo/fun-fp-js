# Transducer

중간 배열을 만들지 않고 **변환 로직만 합성**하는 리듀서 변환기

## 개념

Transducer는 **리듀서를 받아 리듀서를 돌려주는 함수**입니다.

```
Transducer = Reducer -> Reducer
Reducer     = (acc, value) -> acc
```

`map`이나 `filter`를 "컬렉션에 대한 연산"이 아니라 "리듀서에 대한 연산"으로 다시 쓰면,
변환 단계를 **컬렉션과 무관하게** 조립할 수 있습니다. 조립이 끝난 뒤 `transduce`로 한 번만
순회합니다.

fun-fp-js의 transducer는 `Symbol.iterator`를 가진 모든 것에 동작합니다 — 배열, Set, Map,
문자열, 제너레이터 모두 포함됩니다.

## 왜 Transducer인가?

### 문제: 배열 메서드 체이닝은 단계마다 배열을 만든다

```javascript no-run
// 각 단계가 새 배열을 할당한다 — 100만 개면 중간 배열도 100만 개씩
const result = hugeArray
    .map(x => x * 2)        // 새 배열 1
    .filter(x => x > 10)    // 새 배열 2
    .slice(0, 3);           // 새 배열 3 — 앞의 두 단계는 전부 다 돌고 나서야 잘린다

// 그리고 변환 로직을 따로 떼어 재사용할 수 없다
```

`slice(0, 3)`이 마지막에 있어도 `map`과 `filter`는 **전체 원소를 다 처리한 뒤**에 잘립니다.

### 해결: 변환을 합성하고 한 번만 순회한다

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

// 변환 단계만 조립 — 아직 아무 데이터도 없다
const xf = compose(
    transducer.map(x => x * 2),
    transducer.filter(x => x > 10),
    transducer.take(3)
);

// 이제 한 번 순회한다. 중간 배열 없음, take(3)에서 즉시 중단.
console.log(transducer.transduce(xf)(push)([])([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
// [12, 14, 16]
```

`take(3)`이 채워지는 순간 순회가 **멈춥니다** — 뒤쪽 원소는 아예 건드리지 않습니다.

## 생성

세 가지 기본 transducer가 있습니다. 모두 "리듀서를 받아 리듀서를 돌려주는" 형태입니다.

```javascript
const { transducer } = FunFP;

const double = transducer.map(x => x * 2);
const evens = transducer.filter(x => x % 2 === 0);
const firstThree = transducer.take(3);

// 셋 다 함수다 — 아직 실행된 것은 없다
console.log(typeof double, typeof evens, typeof firstThree);
// function function function
```

## 주요 연산

### transduce - 실행

커링된 4단계입니다: `transduce(변환기)(리듀서)(초기값)(컬렉션)`

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

transducer.transduce(transducer.map(x => x * 2))(push)([])([1, 2, 3]);
// [2, 4, 6]
```

리듀서를 바꾸면 결과 모양이 바뀝니다 — 배열로 모을 필요가 없습니다.

```javascript
const { transducer } = FunFP;

const sum = (acc, x) => acc + x;

// 두 배한 값들의 합 — 중간 배열을 전혀 만들지 않는다
console.log(transducer.transduce(transducer.map(x => x * 2))(sum)(0)([1, 2, 3, 4]));
// 20
```

### map - 값 변환

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

transducer.transduce(transducer.map(s => s.toUpperCase()))(push)([])(['a', 'b']);
// ['A', 'B']
```

### filter - 조건 통과만

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

transducer.transduce(transducer.filter(x => x % 2 === 0))(push)([])([1, 2, 3, 4, 5]);
// [2, 4]
```

### take - 앞에서 n개, 그리고 조기 종료

`take`는 개수를 채우면 `Reduced`를 돌려 **순회 자체를 중단시킵니다.**

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

// 원소가 n개보다 적으면 있는 만큼만
console.log(transducer.transduce(transducer.take(10))(push)([])([1, 2, 3]));
// [1, 2, 3]
```

조기 종료가 실제로 일어나는지는 부수효과로 확인할 수 있습니다.

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];
let touched = 0;

const counted = transducer.map(x => { touched++; return x; });
const xf = r => counted(transducer.take(2)(r));

transducer.transduce(xf)(push)([])([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

console.log('건드린 원소 수:', touched);  // 10개가 아니라 2개
```

`take`는 양의 정수만 받습니다.

```javascript
const { transducer } = FunFP;

[0, -1, 1.5, '3'].forEach(bad => {
    try {
        transducer.take(bad);
        console.log('통과하면 안 됨:', bad);
    } catch (e) {
        console.log(`take(${JSON.stringify(bad)}) → ${e.constructor.name}`);
    }
});
```

### 합성 — 데이터는 왼쪽에서 오른쪽으로 흐른다

여기서 헷갈리기 쉽습니다. `compose(a, b)`는 함수 합성으로는 `a(b(x))`지만,
transducer에서는 **데이터가 `a`를 먼저 통과합니다.**

리듀서를 감싸는 순서와 데이터가 흐르는 순서가 반대이기 때문입니다.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

// 데이터 흐름: filter 먼저 → 그다음 map
const filterThenMap = compose(
    transducer.filter(x => x % 2 === 0),
    transducer.map(x => x * 2)
);
console.log(transducer.transduce(filterThenMap)(push)([])([1, 2, 3, 4, 5]));
// [4, 8]   — [2,4]로 걸러진 뒤 두 배

// 순서를 뒤집으면 결과가 달라진다: map 먼저 → 그다음 filter
const mapThenFilter = compose(
    transducer.map(x => x * 2),
    transducer.filter(x => x % 2 === 0)
);
console.log(transducer.transduce(mapThenFilter)(push)([])([1, 2, 3, 4, 5]));
// [2, 4, 6, 8, 10]   — 전부 두 배 되어 모두 짝수
```

## 주의: take는 상태를 가진다

`transducer.take(n)` 자체는 **재사용해도 됩니다** — `transduce`가 실행될 때마다 새 카운터가
만들어집니다. 하지만 **리듀서에 미리 적용해둔 결과**는 카운터를 붙잡고 있어 두 번째 실행에서
이미 소진된 상태입니다.

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

// 안전: 적용되지 않은 transducer는 재사용 가능
const t = transducer.take(2);
console.log(transducer.transduce(t)(push)([])([1, 2, 3, 4, 5]));  // [1, 2]
console.log(transducer.transduce(t)(push)([])([1, 2, 3, 4, 5]));  // [1, 2] — 정상

// 위험: 미리 적용해두면 카운터가 공유된다
const applied = transducer.take(2)(push);
console.log(transducer.transduce(() => applied)(push)([])([1, 2, 3]));  // [1, 2]
console.log(transducer.transduce(() => applied)(push)([])([1, 2, 3]));  // [] — 소진됨
```

**규칙**: transducer는 적용되지 않은 상태로 보관하고, 적용은 `transduce`에 맡기십시오.

## 타입 체크

`transduce`는 이터러블이 아닌 것을 받으면 `TypeError`를 냅니다.

```javascript
const { transducer } = FunFP;

const push = (acc, x) => [...acc, x];

try {
    transducer.transduce(transducer.map(x => x))(push)([])(42);
} catch (e) {
    console.log(e.constructor.name);  // TypeError
}
```

## 실용적 예시

### 1. 큰 목록에서 조건에 맞는 앞의 몇 개만

로그 100만 줄에서 에러 5건만 찾을 때, 전체를 훑지 않습니다.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

const logs = [
    { level: 'info', msg: 'start' },
    { level: 'error', msg: 'disk full' },
    { level: 'warn', msg: 'slow' },
    { level: 'error', msg: 'timeout' },
    { level: 'error', msg: 'refused' },
    { level: 'info', msg: 'done' }
];

const firstTwoErrors = compose(
    transducer.filter(l => l.level === 'error'),
    transducer.map(l => l.msg),
    transducer.take(2)
);

console.log(transducer.transduce(firstTwoErrors)(push)([])(logs));
// ['disk full', 'timeout'] — 'refused'까지 가지 않고 멈춘다
```

### 2. 배열이 아닌 것에 그대로 쓰기

이터러블이면 무엇이든 됩니다. 무한 제너레이터도 `take`와 함께면 안전합니다.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

function* naturals() {
    let n = 1;
    while (true) yield n++;
}

const firstSquares = compose(
    transducer.filter(n => n % 3 === 0),
    transducer.map(n => n * n),
    transducer.take(4)
);

console.log(transducer.transduce(firstSquares)(push)([])(naturals()));
// [9, 36, 81, 144]
```

무한 수열에 `.filter().map().slice()`를 쓰면 첫 단계에서 영원히 멈추지 않습니다.
transducer는 `take`가 순회를 끊기 때문에 끝납니다.

```javascript
const { transducer } = FunFP;

// Set과 문자열에도 그대로
const push = (acc, x) => [...acc, x];
const upper = transducer.map(s => s.toUpperCase());

console.log(transducer.transduce(upper)(push)([])(new Set(['a', 'b', 'a'])));
// ['A', 'B'] — Set이라 중복 제거는 이미 되어 있다

console.log(transducer.transduce(upper)((acc, c) => acc + c)('')('hello'));
// 'HELLO'
```

### 3. 변환 로직을 이름 붙여 재사용

파이프라인 조각을 값으로 두면 여러 곳에서 조립해 쓸 수 있습니다.

```javascript
const { transducer, compose } = FunFP;

const push = (acc, x) => [...acc, x];

// 재사용할 조각들
const activeOnly = transducer.filter(u => u.active);
const toName = transducer.map(u => u.name);
const adultsOnly = transducer.filter(u => u.age >= 18);

const users = [
    { name: 'A', age: 30, active: true },
    { name: 'B', age: 15, active: true },
    { name: 'C', age: 40, active: false },
    { name: 'D', age: 22, active: true }
];

const activeAdultNames = compose(activeOnly, adultsOnly, toName);
console.log(transducer.transduce(activeAdultNames)(push)([])(users));
// ['A', 'D']

// 같은 조각으로 다른 파이프라인
const activeNames = compose(activeOnly, toName);
console.log(transducer.transduce(activeNames)(push)([])(users));
// ['A', 'B', 'D']
```

### 4. 배열로 모으지 않고 집계하기

리듀서를 바꾸면 순회 한 번으로 통계가 나옵니다.

```javascript
const { transducer, compose } = FunFP;

const orders = [
    { item: 'book', price: 15000, paid: true },
    { item: 'pen', price: 2000, paid: false },
    { item: 'desk', price: 89000, paid: true },
    { item: 'lamp', price: 34000, paid: true }
];

const paidWithTax = compose(
    transducer.filter(o => o.paid),
    transducer.map(o => Math.round(o.price * 1.1))
);

// 합계 — 중간 배열 없음
const total = transducer.transduce(paidWithTax)((acc, x) => acc + x)(0)(orders);
console.log('합계:', total);

// 같은 파이프라인, 다른 리듀서 — 최댓값
const max = transducer.transduce(paidWithTax)((acc, x) => Math.max(acc, x))(0)(orders);
console.log('최댓값:', max);
```

## 관련 타입 클래스

- [Foldable](./Foldable.md) - `transduce`는 결국 fold입니다. transducer는 그 fold에 쓰일
  리듀서를 조립하는 층입니다.
- [Semigroupoid](./Semigroupoid.md) - transducer는 `compose`로 합성됩니다. 단, 데이터가
  흐르는 방향이 함수 합성과 반대라는 점에 주의하십시오.
- [Filterable](./Filterable.md) - 컨테이너에 대한 `filter`. transducer의 `filter`는 컨테이너가
  아니라 리듀서를 변환한다는 점이 다릅니다.

## 더 알아보기

- [Clojure Transducers](https://clojure.org/reference/transducers)
