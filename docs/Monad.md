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
const { map } = Functor.types.MaybeFunctor;

const getUser = id => Maybe.of({ id, name: 'Alice', addressId: 1 });
const getAddress = addrId => Maybe.of({ id: addrId, city: 'Seoul' });

// map만 사용하면 중첩됨!
const result = map(user => getAddress(user.addressId), getUser(1));
// Maybe(Maybe({ city: 'Seoul' }))  ← 이중 중첩!
```

### 해결: chain으로 평탄화

```javascript
const { Chain } = FunFP;
const { chain } = Chain.types.MaybeChain;

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
const { map } = Functor.types.MaybeFunctor;
const { chain } = Chain.types.MaybeChain;

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
const { chain } = Chain.types.EitherChain;

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
const { chain } = Chain.types.TaskChain;
const { map } = Functor.types.TaskFunctor;

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
const { map } = Functor.types.MaybeFunctor;
const { chain } = Chain.types.MaybeChain;

// map: 항상 성공하는 단순 변환
map(x => x + 1, maybe);

// chain: 실패할 수 있는 연산
chain(x => x > 0 ? Maybe.of(x) : Maybe.Nothing(), maybe);
```

## 관련 타입 클래스

- **Functor**: map만 제공
- **Apply**: 여러 값에 함수 적용
- **Applicative**: of(값 넣기) 제공
- **Chain**: chain만 제공 (Monad에서 of 빼면 Chain)
