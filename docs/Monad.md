# Monad

**체이닝과 시퀀싱이 가능한 타입**

## 개념

Monad는 함수형 프로그래밍에서 **부수 효과를 안전하게 다루기 위한 패턴**입니다.

핵심 연산은 `chain` (또는 `flatMap`, `bind`):
- 컨테이너 안의 값을 꺼내서 함수에 전달
- 그 함수가 반환하는 새 컨테이너를 반환

이를 통해 **중첩된 컨테이너 문제**를 해결합니다.

## 왜 Monad가 필요한가?

### 문제: Functor만으로는 부족함

```javascript
const { Maybe, Functor } = FunFP;
const { map } = Functor.of('maybe');

const getUser = id => Maybe.of({ id, name: 'Alice', addressId: 1 });
const getAddress = addrId => Maybe.of({ id: addrId, city: 'Seoul' });

// map만 사용하면 중첩됨!
const result = map(user => getAddress(user.addressId), getUser(1));
// Maybe(Maybe({ city: 'Seoul' }))  ← 이중 중첩!
```

### 해결: chain으로 평탄화

```javascript
const { Chain } = FunFP;
const { chain } = Chain.of('maybe');

const result = chain(user => getAddress(user.addressId), getUser(1));
// Maybe({ city: 'Seoul' })  ← 깔끔!

// 또는 pipeK 사용
const getUserAddress = Maybe.pipeK(getUser, user => getAddress(user.addressId));
getUserAddress(1);  // Maybe({ city: 'Seoul' })
```

## 법칙

### 1. 좌항등법칙 (Left Identity)
```javascript
chain(f, of(a)) === f(a)
```
값을 of로 감싸고 chain하면 = 그냥 함수 호출

### 2. 우항등법칙 (Right Identity)
```javascript
chain(of, m) === m
```
모나드에 of를 chain하면 = 원래 모나드

### 3. 결합법칙 (Associativity)
```javascript
chain(g, chain(f, m)) === chain(x => chain(g, f(x)), m)
```
chain 순서를 바꿔도 결과가 같음

## 인터페이스

```javascript
Monad.of(a): Monad a              // 값을 모나드에 넣기 (Applicative에서 상속)
Monad.chain(f, m): Monad b        // 변환 함수 적용 후 평탄화
                                  // f: a -> Monad b
```

## 사용 예시

### Maybe - null 안전한 체이닝

```javascript
import FunFP from 'fun-fp-js';
const { Maybe, Functor, Chain } = FunFP;
const { map } = Functor.of('maybe');
const { chain } = Chain.of('maybe');

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

### Either - 에러 처리 체이닝

```javascript
const { Either, Chain } = FunFP;
const { chain } = Chain.of('either');

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

### Task - 비동기 체이닝

```javascript
const { Task, Chain, Functor } = FunFP;
const { chain } = Chain.of('task');
const { map } = Functor.of('task');

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

## 모나드의 시각화

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
| 함수 타입 | `a -> b` | `a -> M b` |
| 결과 | 중첩 가능 | 항상 한 겹 |
| 용도 | 단순 변환 | 조건부/순차 실행 |

```javascript
const { map } = Functor.of('maybe');
const { chain } = Chain.of('maybe');

// map: 항상 성공하는 단순 변환
map(x => x + 1, maybe);

// chain: 실패할 수 있는 연산
chain(x => x > 0 ? Maybe.of(x) : Maybe.Nothing(), maybe);
```

## pipeK vs composeK - Kleisli 합성

Kleisli 합성은 `a -> M b` 형태의 함수들을 합성하는 방법입니다.

### pipeK - 왼쪽에서 오른쪽 합성

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

### composeK - 오른쪽에서 왼쪽 합성 (수학적 합성)

```javascript
const { Maybe } = FunFP;

// composeK: 우 → 좌 (수학적 합성 순서)
const pipeline = Maybe.composeK(asString, double, parse);

pipeline('5');     // Just('Result: 10')
pipeline('abc');   // Nothing
```

**같은 결과, 다른 방향:**
- `pipeK(f, g, h)` = f → g → h (순차적 읽기)
- `composeK(h, g, f)` = f → g → h (수학적 표기)

### 비교 테이블

| | pipeK | composeK |
|---|---|---|
| 방향 | 좌 → 우 | 우 → 좌 |
| 읽기 | 순차적 (실행 순서대로) | 수학적 (∘ 합성과 동일) |
| 첫 번째 인자 | 첫 번째로 실행 | 마지막으로 실행 |
| 사용 경향 | 파이프라인, 워크플로우 | 함수형 수학 스타일 |

### 예시: Either로 검증 파이프라인

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

### 지원 타입

모든 Monad 타입이 `pipeK`와 `composeK`를 지원합니다:
- **Maybe**: null 안전 파이프라인
- **Either**: 에러 처리 파이프라인
- **Task**: 비동기 워크플로우
- **Reader**: 환경 공유 합성
- **Writer**: 출력 누적 합성
- **State**: 상태 흐름 합성
- **Free**: DSL 합성

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

## 관련 타입 클래스

- **Functor**: map만 제공
- **Apply**: 여러 값에 함수 적용
- **Applicative**: of(값 넣기) 제공
- **Chain**: chain만 제공 (Monad에서 of 빼면 Chain)
