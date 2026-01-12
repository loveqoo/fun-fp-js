# Filterable

**요소를 걸러낼(filter) 수 있는 타입**

## 개념

Filterable은 컨테이너에서 **조건을 만족하는 요소만 남기는** 능력입니다.

JavaScript의 `Array.filter`와 같은 개념:
```javascript
[1, 2, 3, 4, 5].filter(x => x > 2)  // [3, 4, 5]
```

## 인터페이스

```javascript
Filterable.filter(pred, a): Filterable a
// pred: a -> Boolean
// a: Filterable a
```

## 법칙

### 분배법칙 (Distributivity)
```javascript
filter(x => p(x) && q(x), a) === filter(q, filter(p, a))
```

### 항등 (Identity)
```javascript
filter(x => true, a) === a
```

### 소멸 (Annihilation)
```javascript
filter(x => false, a) === empty
```

## 사용 예시

### 배열 필터링

```javascript
import FunFP from 'fun-fp-js';
const { Filterable } = FunFP;

const { filter } = Filterable.types.ArrayFilterable;

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
const { filter } = Filterable.types.ObjectFilterable;

filter(x => x > 1, { a: 1, b: 2, c: 3 });
// { b: 2, c: 3 }

filter(x => typeof x === 'string', { a: 1, b: 'hello', c: true });
// { b: 'hello' }
```

## 실용적 예시

### 검색 필터

```javascript
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
const values = [1, null, 2, undefined, 3, null];

filter(x => x != null, values);
// [1, 2, 3]
```

### 설정 정리

```javascript
const config = {
    host: 'localhost',
    port: undefined,
    debug: true,
    timeout: null
};

filter(x => x != null, config);
// { host: 'localhost', debug: true }
```

## 관련 타입 클래스

- **Functor**: 값 변환
- **Foldable**: 축소
