# Filterable

**요소를 걸러낼(filter) 수 있는 타입**

## 개념

Filterable은 컨테이너에서 **조건을 만족하는 요소만 남기는** 능력입니다.

JavaScript의 `Array.filter`와 같은 개념:
```javascript
[1, 2, 3, 4, 5].filter(x => x > 2)  // [3, 4, 5]
```

## 인터페이스

```javascript no-run 시그니처·의사코드 표기
Filterable.filter(pred, a): Filterable a
// pred: a -> Boolean
// a: Filterable a
```

## 법칙

### 분배법칙 (Distributivity)
```javascript no-run 대수 법칙 — 자유변수 표기
const { filter } = Filterable.lookup('array');
filter(x => p(x) && q(x), a) === filter(q, filter(p, a))
```

### 항등 (Identity)
```javascript no-run 대수 법칙 — 자유변수 표기
const { filter } = Filterable.lookup('array');
filter(x => true, a) === a
```

### 소멸 (Annihilation)
```javascript no-run 대수 법칙 — 자유변수 표기
const { filter } = Filterable.lookup('array');
filter(x => false, a) === empty
```

## 사용 예시

### 배열 필터링

```javascript
import FunFP from 'fun-fp-js';
const { Filterable } = FunFP;

const { filter } = Filterable.lookup('array');

filter(x => x > 2, [1, 2, 3, 4, 5]);
// [3, 4, 5]

filter(x => x % 2 === 0, [1, 2, 3, 4, 5]);
// [2, 4]

filter(x => x.active, [
    { name: 'a', active: true },
    { name: 'b', active: false },
    { name: 'c', active: true }
]);
// [{ name: 'a', active: true }, { name: 'c', active: true }]
```

### 객체 필터링

```javascript
const { filter } = Filterable.lookup('object');

filter(x => x > 1, { a: 1, b: 2, c: 3 });
// { b: 2, c: 3 }

filter(x => typeof x === 'string', { a: 1, b: 'hello', c: true });
// { b: 'hello' }
```

## 실용적 예시

### 검색 필터

```javascript
const { filter } = Filterable.lookup('array');
const users = [
    { name: 'Alice', age: 25, role: 'admin' },
    { name: 'Bob', age: 30, role: 'user' },
    { name: 'Charlie', age: 35, role: 'admin' }
];

// 복합 조건
const adminOver30 = filter(
    u => u.role === 'admin' && u.age >= 30,
    users
);
// [{ name: 'Charlie', age: 35, role: 'admin' }]
```

### null 제거

```javascript
const { filter } = Filterable.lookup('array');
const values = [1, null, 2, undefined, 3, null];

filter(x => x != null, values);
// [1, 2, 3]
```

### 설정 정리

```javascript
const { filter } = Filterable.lookup('object');
const config = {
    host: 'localhost',
    port: undefined,
    debug: true,
    timeout: null
};

filter(x => x != null, config);
// { host: 'localhost', debug: true }
```

### Maybe 필터링

```javascript
const { filter } = Filterable.lookup('maybe');

filter(x => x > 0, Maybe.Just(5));   // Just(5)
filter(x => x > 0, Maybe.Just(-1));  // Nothing
filter(x => x > 0, Maybe.Nothing()); // Nothing
```

### `Either` 와 `Task` 는 `Filterable` 이 아니다

거르는 기능은 있지만 **레지스트리에 등록돼 있지 않습니다.** `Either` 에는 "비어 있음" 에
해당하는 값이 없어서 소멸 규칙(전부 걸러내면 언제나 같은 것)을 지킬 수 없기 때문입니다.
`Task` 도 같습니다 — 거부된 `Task` 는 오류를 지고 있습니다. 근거는
[internals.md](./internals.md#filterable) 에 있습니다.

`Filterable.lookup` 대신 **타입이 직접 가진 함수**를 씁니다.

```javascript
const { Either, Task, Filterable } = FunFP;

console.log(Either.filter(x => x > 0, Either.Right(5)).value);      // 5
console.log(Either.filter(x => x > 0, Either.Right(-1)).isLeft());  // true   값이 왼쪽으로
console.log(Either.filter(x => x > 0, Either.Left('err')).value);   // 'err'  실패는 그대로

// 세 번째 인자로 걸러진 값을 어떻게 표시할지 정할 수 있다
console.log(Either.filter(x => x > 0, Either.Right(-1), () => '조건 불충족').value);
// '조건 불충족'

let message = '';
try { Filterable.lookup('either'); } catch (e) { message = e.message; }
console.log(message);   // 'Filterable.lookup: unsupported key either'
```

```javascript
const { Task } = FunFP;

Task.filter(x => x > 0, Task.of(5))
    .fork(e => console.log('rejected:', e), v => console.log(v));   // 5

Task.filter(x => x > 0, Task.of(-1))
    .fork(e => console.log('rejected:', e), v => console.log(v));   // rejected: -1
```

## 관련 타입 클래스

- **Functor**: 값 변환
- **Foldable**: 축소
