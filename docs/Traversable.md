# Traversable

**컨테이너 안의 효과를 밖으로 뒤집는 타입**

## 개념

Traversable은 컨테이너 안의 **각 요소에 효과(effect)를 적용하고, 그 효과를 밖으로 꺼내는** 능력입니다.

예를 들어:
```javascript
[Maybe.of(1), Maybe.of(2), Maybe.of(3)]  // Array of Maybe
// 를 뒤집어서
Maybe.of([1, 2, 3])  // Maybe of Array
```

## 왜 Traversable인가?

### 문제: map만으로는 부족함

```javascript
const users = [1, 2, 3];
const fetchUser = id => Task.fromPromise(() => fetch(`/api/users/${id}`))();

// map을 쓰면...
const tasks = users.map(fetchUser);
// [Task, Task, Task] - 배열 안에 Task들!
// 이걸 어떻게 하나의 Task로 만들지?
```

### 해결: traverse로 뒤집기

```javascript
Traversable.types.ArrayTraversable.traverse(
    Applicative.types.TaskApplicative,
    fetchUser,
    users
);
// Task([user1, user2, user3]) - 하나의 Task 안에 배열!
```

## 인터페이스

```javascript
Traversable.traverse(Applicative, f, t): Applicative (Traversable b)
// Applicative: 목표 Applicative 타입
// f: a -> Applicative b (각 요소에 적용할 함수)
// t: Traversable a (순회할 컨테이너)
```

## 법칙

### 항등 (Identity)
```javascript
traverse(Identity, Identity.of, t) === Identity.of(t)
```

### Naturality
```javascript
traverse(G, compose(eta, f), t) === eta(traverse(F, f, t))
```

## 사용 예시

### 기본 사용

```javascript
import FunFP from 'fun-fp-js';
const { Traversable, Applicative, Maybe, Either, Task } = FunFP;

const { traverse } = Traversable.types.ArrayTraversable;

// Array[Maybe] → Maybe[Array]
const maybes = [Maybe.of(1), Maybe.of(2), Maybe.of(3)];
traverse(Applicative.types.MaybeApplicative, x => x, maybes);
// Just([1, 2, 3])

// 하나라도 Nothing이면 전체가 Nothing
const hasNothing = [Maybe.of(1), Maybe.Nothing(), Maybe.of(3)];
traverse(Applicative.types.MaybeApplicative, x => x, hasNothing);
// Nothing
```

### 배열의 모든 요소 검증

```javascript
const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left(`${n} is not positive`);

const numbers = [1, 2, 3, 4, 5];

traverse(
    Applicative.types.EitherApplicative,
    validatePositive,
    numbers
);
// Right([1, 2, 3, 4, 5])

const withNegative = [1, -2, 3];

traverse(
    Applicative.types.EitherApplicative,
    validatePositive,
    withNegative
);
// Left('-2 is not positive')
```

### 병렬 API 호출

```javascript
const fetchUser = id => Task.fromPromise(() =>
    fetch(`/api/users/${id}`).then(r => r.json())
)();

const userIds = [1, 2, 3, 4, 5];

traverse(
    Applicative.types.TaskApplicative,
    fetchUser,
    userIds
).fork(
    err => console.error('Failed:', err),
    users => console.log('All users:', users)
);
// All users: [user1, user2, user3, user4, user5]
```

## sequence - traverse의 특수 케이스

`traverse(A, x => x, t)`는 매우 흔한 패턴이라 `sequence`로 제공됩니다:

```javascript
import FunFP from 'fun-fp-js';
const { sequence, Maybe, Applicative } = FunFP;

// 이미 Maybe가 담긴 배열을 뒤집기
const maybes = [Maybe.of(1), Maybe.of(2), Maybe.of(3)];

sequence(
    Traversable.types.ArrayTraversable,
    Applicative.types.MaybeApplicative,
    maybes
);
// Just([1, 2, 3])
```

## 실용적 예시

### 설정 파일 로딩

```javascript
const readFile = path => Task.fromPromise(() => 
    fs.promises.readFile(path, 'utf8')
)();

const configFiles = ['./config.json', './env.json', './secrets.json'];

traverse(
    Applicative.types.TaskApplicative,
    readFile,
    configFiles
).fork(
    err => console.error('Failed to read config:', err),
    contents => {
        const [config, env, secrets] = contents.map(JSON.parse);
        console.log('All configs loaded');
    }
);
```

### 데이터 변환 파이프라인

```javascript
const parseDate = str => {
    const d = new Date(str);
    return isNaN(d) ? Either.Left(`Invalid date: ${str}`) : Either.Right(d);
};

const dates = ['2023-01-01', '2023-06-15', '2023-12-31'];

traverse(
    Applicative.types.EitherApplicative,
    parseDate,
    dates
).fold(
    err => console.error('Parse error:', err),
    parsed => console.log('Parsed dates:', parsed)
);
```

### 옵셔널 필드 처리

```javascript
const { Functor } = FunFP;
const { map } = Functor.types.MaybeFunctor;

const user = {
    name: Maybe.of('Alice'),
    email: Maybe.of('alice@email.com'),
    phone: Maybe.Nothing()  // 없을 수도 있음
};

// 모든 필드가 Just일 때만 객체 생성
const fields = [user.name, user.email, user.phone];

const result = traverse(
    Applicative.types.MaybeApplicative,
    x => x,
    fields
);

map(([name, email, phone]) => ({ name, email, phone }), result);
// Nothing (phone이 Nothing이므로)
```

## traverse vs map

| | map | traverse |
|---|---|---|
| 결과 | 같은 구조 유지 | 구조 뒤집기 |
| 함수 타입 | `a -> b` | `a -> F b` |
| 용도 | 단순 변환 | 효과 있는 변환 |

```javascript
// map: 구조 유지
[1, 2, 3].map(x => x * 2)  // [2, 4, 6]

// traverse: 구조 뒤집기
traverse(MaybeApplicative, x => Maybe.of(x * 2), [1, 2, 3])
// Maybe([2, 4, 6])
```

## 관련 타입 클래스

- **Functor**: map 제공
- **Foldable**: reduce 제공
- **Applicative**: traverse의 결과 타입
