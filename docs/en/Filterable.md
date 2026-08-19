# Filterable

> 한국어: [../Filterable.md](../Filterable.md)

**A type whose elements can be filtered**

## Concept

Filterable is the ability to keep, from a container, **only the elements that satisfy a condition**.

The same idea as JavaScript's `Array.filter`:
```javascript
[1, 2, 3, 4, 5].filter(x => x > 2)  // [3, 4, 5]
```

## Interface

```javascript no-run 시그니처·의사코드 표기
Filterable.filter(pred, a): Filterable a
// pred: a -> Boolean
// a: Filterable a
```

## Laws

### Distributivity
```javascript no-run 대수 법칙 — 자유변수 표기
const { filter } = Filterable.lookup('array');
filter(x => p(x) && q(x), a) === filter(q, filter(p, a))
```

### Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const { filter } = Filterable.lookup('array');
filter(x => true, a) === a
```

### Annihilation
```javascript no-run 대수 법칙 — 자유변수 표기
const { filter } = Filterable.lookup('array');
filter(x => false, a) === empty
```

## Usage examples

### Filtering an array

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

### Filtering an object

```javascript
const { filter } = Filterable.lookup('object');

filter(x => x > 1, { a: 1, b: 2, c: 3 });
// { b: 2, c: 3 }

filter(x => typeof x === 'string', { a: 1, b: 'hello', c: true });
// { b: 'hello' }
```

## Practical examples

### Search filter

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

### Removing null

```javascript
const { filter } = Filterable.lookup('array');
const values = [1, null, 2, undefined, 3, null];

filter(x => x != null, values);
// [1, 2, 3]
```

### Cleaning up config

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

### Filtering Maybe

```javascript
const { filter } = Filterable.lookup('maybe');

filter(x => x > 0, Maybe.Just(5));   // Just(5)
filter(x => x > 0, Maybe.Just(-1));  // Nothing
filter(x => x > 0, Maybe.Nothing()); // Nothing
```

### `Either` and `Task` are not `Filterable`

They have a filtering operation, but they are **not registered in the registry.**
`Either` has no value that plays the role of "empty", so it cannot satisfy the
annihilation law (filtering everything out must always give the same result).
The same holds for `Task` — a rejected `Task` carries an error. The reasoning
is in [internals.md](./internals.md#filterable).

Instead of `Filterable.lookup`, use the function **the type itself carries.**

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

## Related type classes

- **Functor**: transforms values
- **Foldable**: reduces
