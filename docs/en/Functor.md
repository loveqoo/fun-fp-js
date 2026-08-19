# Functor

> 한국어: [../Functor.md](../Functor.md)

**A Mappable type**

## Concept

Functor is a type whose **value inside a container can be transformed**. The container's structure stays the same; only the value inside changes.

The most familiar example is `Array.map`:
```javascript
[1, 2, 3].map(x => x * 2)  // [2, 4, 6]
// 배열 구조는 유지, 각 요소만 변환
```

## Laws

### 1. Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const { map } = Functor.lookup('array');
map(x => x, a) === a
```
Mapping with the identity function gives back the original value.

### 2. Composition
```javascript no-run 대수 법칙 — 자유변수 표기
const { map } = Functor.lookup('array');
map(x => f(g(x)), a) === map(f, map(g, a))
```
Mapping once with a composed function equals mapping twice, once with each function.

## Interface

```javascript no-run 시그니처·의사코드 표기
Functor.map(f, a): Functor a
```
- `f`: the transform function `a -> b`
- `a`: the value held by the Functor
- returns: a new Functor holding the transformed value

## Usage examples

### Array

```javascript
import FunFP from 'fun-fp-js';
const { Functor } = FunFP;

const { map } = Functor.lookup('array');

map(x => x * 2, [1, 2, 3]);
// [2, 4, 6]

map(x => x.toUpperCase(), ['a', 'b', 'c']);
// ['A', 'B', 'C']
```

### Maybe

```javascript
const { Maybe, Functor } = FunFP;

const just = Maybe.of(5);
const nothing = Maybe.Nothing();

const { map } = Functor.lookup('maybe');

map(x => x * 2, just);
// Just(10)

map(x => x * 2, nothing);
// Nothing - 변환 시도 안 함
```

### Either

```javascript
const { Either, Functor } = FunFP;

const right = Either.Right(5);
const left = Either.Left('error');

const { map } = Functor.lookup('either');

map(x => x * 2, right);
// Right(10)

map(x => x * 2, left);
// Left('error') - 에러는 그대로 유지
```

### Task

```javascript
const { Task, Functor } = FunFP;

const task = Task.of(5);
const { map } = Functor.lookup('task');

const doubled = map(x => x * 2, task);
doubled.fork(console.error, console.log);  // 10
```

## Practical applications

### Safe property access

```javascript
const user = Maybe.of({ name: 'Alice', address: { city: 'Seoul' } });

const { map } = Functor.lookup('maybe');

// 안전하게 중첩 속성 접근
map(u => u.name, user);
// Just('Alice')

map(u => u.address.city, user);
// Just('Seoul')

// null이면 안전하게 Nothing
const noUser = Maybe.Nothing();
map(u => u.name, noUser);
// Nothing
```

### Combined with error handling

```javascript
const parseJson = str => {
    try {
        return Either.Right(JSON.parse(str));
    } catch (e) {
        return Either.Left(e.message);
    }
};

const data = '{"name": "Alice", "age": 30}';
const result = parseJson(data);

const { map } = Functor.lookup('either');

// 파싱 성공시에만 변환
map(obj => obj.name, result);
// Right('Alice')
```

### Asynchronous transformation

```javascript no-run 네트워크 fetch 필요 — 실행 대상 아님
const fetchUser = userId => Task.fromPromise(
    () => fetch(`/api/users/${userId}`).then(r => r.json())
);

const { map } = Functor.lookup('task');

const getUserName = pipe(
    fetchUser,
    task => map(user => user.name, task)
);

getUserName(1).fork(console.error, console.log);
// 'Alice'
```

## Visualizing Functor

```
Functor는 상자(Box)와 같습니다:

┌─────────┐                    ┌─────────┐
│    5    │  map(x => x * 2)   │   10    │
└─────────┘  ───────────────>  └─────────┘
   Just                           Just

┌─────────┐                    ┌─────────┐
│ (empty) │  map(x => x * 2)   │ (empty) │
└─────────┘  ───────────────>  └─────────┘
  Nothing                        Nothing

상자를 열지 않고도 내부 값을 변환할 수 있습니다!
```

## Why Functor?

1. **null safety**: safe transformation with Maybe, no null checks
2. **error handling**: error propagation with Either, no try-catch
3. **async abstraction**: async transformation with Task, no callbacks or Promise chains
4. **composable**: chains transformations the way function composition does

## Related type classes

- **Apply**: Functor + applies a function held in one Functor to values in another
- **Applicative**: Apply + puts a value into a Functor
- **Monad**: Applicative + flattens a nested Functor
