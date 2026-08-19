# Monad

> 한국어: [../Monad.md](../Monad.md)

**A type that supports chaining and sequencing**

## Concept

In functional programming, Monad is a **pattern for safely handling side effects**.

Its core operation is `chain` (also known as `flatMap` or `bind`):
- pull the value out of the container and pass it to a function
- return the new container that function produces

This solves the **nested-container problem**.

## Why is Monad needed?

### The problem: Functor alone is not enough

```javascript
const { Maybe, Functor } = FunFP;
const { map } = Functor.lookup('maybe');

const getUser = id => Maybe.of({ id, name: 'Alice', addressId: 1 });
const getAddress = addrId => Maybe.of({ id: addrId, city: 'Seoul' });

// map만 사용하면 중첩됨!
const result = map(user => getAddress(user.addressId), getUser(1));
// Maybe(Maybe({ city: 'Seoul' }))  ← 이중 중첩!
```

### The fix: flatten it with chain

```javascript
const getAddress = addrId => Maybe.of({ id: addrId, city: 'Seoul' });
const getUser = id => Maybe.of({ id, name: 'Alice', addressId: 1 });
const { Chain } = FunFP;
const { chain } = Chain.lookup('maybe');

const result = chain(user => getAddress(user.addressId), getUser(1));
// Maybe({ city: 'Seoul' })  ← 깔끔!

// 또는 pipeK 사용
const getUserAddress = Maybe.pipeK(getUser, user => getAddress(user.addressId));
getUserAddress(1);  // Maybe({ city: 'Seoul' })
```

## Laws

### 1. Left Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const { chain } = Chain.lookup('maybe');
chain(f, of(a)) === f(a)
```
Wrapping a value with `of` and chaining it equals just calling the function.

### 2. Right Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const { chain } = Chain.lookup('maybe');
chain(of, m) === m
```
Chaining `of` onto a monad equals the original monad.

### 3. Associativity
```javascript no-run 대수 법칙 — 자유변수 표기
const { chain } = Chain.lookup('maybe');
chain(g, chain(f, m)) === chain(x => chain(g, f(x)), m)
```
Changing the grouping of `chain` calls does not change the result.

## Interface

```javascript no-run 시그니처·의사코드 표기
Monad.lookup(a): Monad a              // 값을 모나드에 넣기 (Applicative에서 상속)
Monad.chain(f, m): Monad b        // 변환 함수 적용 후 평탄화
                                  // f: a -> Monad b
```

## Usage examples

### Maybe — null-safe chaining

```javascript
import FunFP from 'fun-fp-js';
const { Maybe, Functor, Chain } = FunFP;
const { map } = Functor.lookup('maybe');
const { chain } = Chain.lookup('maybe');

const db = {
    users: { 1: { name: 'Alice', teamId: 10 } },
    teams: { 10: { name: 'Dev Team', leaderId: 1 } }
};

const getUser = id => db.users[id] ? Maybe.of(db.users[id]) : Maybe.Nothing();
const getTeam = id => db.teams[id] ? Maybe.of(db.teams[id]) : Maybe.Nothing();

// Static Land 방식
const teamName = map(
    team => team.name,
    chain(user => getTeam(user.teamId), getUser(1))
);
// Just('Dev Team')

// 또는 pipeK 사용 (더 가독성 좋음)
const getTeamName = Maybe.pipeK(
    getUser,
    user => getTeam(user.teamId)
);
map(team => team.name, getTeamName(1));  // Just('Dev Team')
```

### Either — error-handling chain

```javascript
const { Either, Chain } = FunFP;
const { chain } = Chain.lookup('either');

const parseNumber = str => {
    const n = parseInt(str);
    return isNaN(n) ? Either.Left('Not a number') : Either.Right(n);
};

const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left('Must be positive');

const validateMax = max => n =>
    n <= max ? Either.Right(n) : Either.Left(`Must be ≤ ${max}`);

// pipeK로 검증 파이프라인
const validate = Either.pipeK(
    parseNumber,
    validatePositive,
    validateMax(100)
);

validate('50');    // Right(50)
validate('abc');   // Left('Not a number')
validate('-5');    // Left('Must be positive')
validate('200');   // Left('Must be ≤ 100')
```

### Task — asynchronous chain

```javascript
const { Task, Chain, Functor } = FunFP;
const { chain } = Chain.lookup('task');
const { map } = Functor.lookup('task');

const fetchUser = id => Task.fromPromise(() => 
    fetch(`/api/users/${id}`).then(r => r.json())
)();

const fetchPosts = userId => Task.fromPromise(() =>
    fetch(`/api/users/${userId}/posts`).then(r => r.json())
)();

// Static Land 방식
const getUserPosts = userId =>
    chain(
        user => map(posts => ({ user, posts }), fetchPosts(user.id)),
        fetchUser(userId)
    );

getUserPosts(1).fork(
    err => console.error('Error:', err),
    data => console.log('Data:', data)
);
```

## Visualizing Monad

```
chain은 중첩을 펴줍니다:

┌─────────────────┐              ┌─────────┐
│ ┌─────────────┐ │   chain(f)   │         │
│ │    value    │ │   ───────>   │  value  │
│ └─────────────┘ │              │         │
└─────────────────┘              └─────────┘
  Maybe(Maybe(x))                  Maybe(x)
```

## Monad vs Functor

| | Functor (map) | Monad (chain) |
|---|---|---|
| function type | `a -> b` | `a -> M b` |
| result | can nest | always one layer |
| use | simple transformation | conditional / sequential execution |

```javascript
const maybe = Maybe.of(42);
const { map } = Functor.lookup('maybe');
const { chain } = Chain.lookup('maybe');

// map: 항상 성공하는 단순 변환
map(x => x + 1, maybe);

// chain: 실패할 수 있는 연산
chain(x => x > 0 ? Maybe.of(x) : Maybe.Nothing(), maybe);
```

## pipeK vs composeK — Kleisli composition

Kleisli composition is a way of composing functions of the shape `a -> M b`.

### pipeK — left-to-right composition

```javascript
const { Maybe } = FunFP;

const parse = str => {
    const n = parseInt(str);
    return isNaN(n) ? Maybe.Nothing() : Maybe.of(n);
};
const double = n => Maybe.of(n * 2);
const asString = n => Maybe.of(`Result: ${n}`);

// pipeK: 좌 → 우 (왼쪽부터 읽기)
const pipeline = Maybe.pipeK(parse, double, asString);

pipeline('5');     // Just('Result: 10')
pipeline('abc');   // Nothing
```

### composeK — right-to-left composition (mathematical composition)

```javascript
const parse = str => {
    const n = parseInt(str);
    return isNaN(n) ? Maybe.Nothing() : Maybe.of(n);
};
const double = n => Maybe.of(n * 2);
const asString = n => Maybe.of(`Result: ${n}`);
const { Maybe } = FunFP;

// composeK: 우 → 좌 (수학적 합성 순서)
const pipeline = Maybe.composeK(asString, double, parse);

pipeline('5');     // Just('Result: 10')
pipeline('abc');   // Nothing
```

**Same result, opposite direction:**
- `pipeK(f, g, h)` = f → g → h (read in sequence)
- `composeK(h, g, f)` = f → g → h (mathematical notation)

### Comparison table

| | pipeK | composeK |
|---|---|---|
| direction | left → right | right → left |
| reading | sequential (execution order) | mathematical (same as ∘ composition) |
| first argument | runs first | runs last |
| tends to be used for | pipelines, workflows | function-math style |

### Example: a validation pipeline with Either

```javascript
const { Either } = FunFP;

const parseNumber = str => {
    const n = parseInt(str);
    return isNaN(n) ? Either.Left('Not a number') : Either.Right(n);
};

const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left('Must be positive');

const double = n => Either.Right(n * 2);

// pipeK: 읽기 쉬운 순서
const validateAndDouble = Either.pipeK(
    parseNumber,
    validatePositive,
    double
);

// composeK: 수학적 순서 (역순으로 작성)
const validateAndDouble2 = Either.composeK(
    double,
    validatePositive,
    parseNumber
);

validateAndDouble('5');    // Right(10)
validateAndDouble2('5');   // Right(10) - 동일한 결과
```

### Supported types

Every Monad type supports both `pipeK` and `composeK`:
- **Maybe**: a null-safe pipeline
- **Either**: an error-handling pipeline
- **Task**: an async workflow
- **Reader**: composition sharing an environment
- **Writer**: composition accumulating output (the registered instance is Array-Monoid-only — for any other Monoid use the `Monad.Writer(m)` factory, see [Writer](./Writer.md))
- **State**: composition threading state
- **Free**: DSL composition

```javascript
// Task 예시
const { Task } = FunFP;

const fetchUser = id => Task.fromPromise(() =>
    fetch(`/api/users/${id}`).then(r => r.json())
)();

const fetchPosts = user => Task.fromPromise(() =>
    fetch(`/api/users/${user.id}/posts`).then(r => r.json())
)();

const formatData = posts => Task.of({ count: posts.length, posts });

// pipeK로 비동기 파이프라인
const getUserData = Task.pipeK(fetchUser, fetchPosts, formatData);

getUserData(1).fork(console.error, console.log);
```

## Related type classes

- **Functor**: provides only `map`
- **Apply**: applies a function to several values
- **Applicative**: provides `of` (putting a value in)
- **Chain**: provides only `chain` (Monad minus `of` is Chain)
