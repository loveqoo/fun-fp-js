# Traversable

> 한국어: [../Traversable.md](../Traversable.md)

**A type that turns effects inside a container inside out**

## Concept

Traversable is the ability to **apply an effect to each element inside a container, and then
pull that effect out to the outside**.

For example:
```javascript
[Maybe.of(1), Maybe.of(2), Maybe.of(3)]  // Array of Maybe
// 를 뒤집어서
Maybe.of([1, 2, 3])  // Maybe of Array
```

## Why is Traversable needed?

### The problem: map alone is not enough

```javascript
const users = [1, 2, 3];
const fetchUser = id => Task.fromPromise(() => fetch(`/api/users/${id}`))();

// map을 쓰면...
const tasks = users.map(fetchUser);
// [Task, Task, Task] - 배열 안에 Task들!
// 이걸 어떻게 하나의 Task로 만들지?
```

### The fix: flip it with traverse

```javascript
const users = [1, 2, 3];
const fetchUser = id => Task.fromPromise(() => fetch(`/api/users/${id}`))();
const { traverse } = Traversable.lookup('array');

traverse(
    Applicative.lookup('task'),
    fetchUser,
    users
);
// Task([user1, user2, user3]) - 하나의 Task 안에 배열!
```

## Interface

```javascript no-run 시그니처·의사코드 표기
Traversable.traverse(Applicative, f, t): Applicative (Traversable b)
// Applicative: 목표 Applicative 타입
// f: a -> Applicative b (각 요소에 적용할 함수)
// t: Traversable a (순회할 컨테이너)
```

## Laws

### Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const { traverse } = Traversable.lookup('array');
traverse(Identity, Identity.of, t) === Identity.of(t)
```

### Naturality
```javascript no-run 대수 법칙 — 자유변수 표기
const { traverse } = Traversable.lookup('array');
traverse(G, compose(eta, f), t) === eta(traverse(F, f, t))
```

## Usage examples

### Basic usage

```javascript
import FunFP from 'fun-fp-js';
const { Traversable, Applicative, Maybe, Either, Task } = FunFP;

const { traverse } = Traversable.lookup('array');

// Array[Maybe] → Maybe[Array]
const maybes = [Maybe.of(1), Maybe.of(2), Maybe.of(3)];
traverse(Applicative.lookup('maybe'), x => x, maybes);
// Just([1, 2, 3])

// 하나라도 Nothing이면 전체가 Nothing
const hasNothing = [Maybe.of(1), Maybe.Nothing(), Maybe.of(3)];
traverse(Applicative.lookup('maybe'), x => x, hasNothing);
// Nothing
```

### Validating every element of an array

```javascript
const validatePositive = n =>
    n > 0 ? Either.Right(n) : Either.Left(`${n} is not positive`);

const { traverse } = Traversable.lookup('array');

const numbers = [1, 2, 3, 4, 5];
traverse(Applicative.lookup('either'), validatePositive, numbers);
// Right([1, 2, 3, 4, 5])

const withNegative = [1, -2, 3];
traverse(Applicative.lookup('either'), validatePositive, withNegative);
// Left('-2 is not positive')
```

### Parallel API calls

```javascript
const fetchUser = id => Task.fromPromise(() =>
    fetch(`/api/users/${id}`).then(r => r.json())
)();

const userIds = [1, 2, 3, 4, 5];

const { traverse } = Traversable.lookup('array');

traverse(Applicative.lookup('task'), fetchUser, userIds).fork(
    err => console.error('Failed:', err),
    users => console.log('All users:', users)
);
// All users: [user1, user2, user3, user4, user5]
```

## sequence — a special case of traverse

`traverse(A, x => x, t)` is common enough a pattern that it is provided as `sequence`:

```javascript
import FunFP from 'fun-fp-js';
const { sequence, Maybe, Applicative } = FunFP;

// 이미 Maybe가 담긴 배열을 뒤집기
const maybes = [Maybe.of(1), Maybe.of(2), Maybe.of(3)];

// sequence 의 첫 인자는 Traversable 인스턴스다
sequence(Traversable.lookup('array'), Applicative.lookup('maybe'), maybes);
// Just([1, 2, 3])
```

## Practical examples

### Loading config files

```javascript
const readFile = path => Task.fromPromise(() => 
    fs.promises.readFile(path, 'utf8')
)();

const configFiles = ['./config.json', './env.json', './secrets.json'];

const { traverse } = Traversable.lookup('array');

traverse(Applicative.lookup('task'), readFile, configFiles).fork(
    err => console.error('Failed to read config:', err),
    contents => {
        const [config, env, secrets] = contents.map(JSON.parse);
        console.log('All configs loaded');
    }
);
```

### A data-transformation pipeline

```javascript
const parseDate = str => {
    const d = new Date(str);
    return isNaN(d) ? Either.Left(`Invalid date: ${str}`) : Either.Right(d);
};

const dates = ['2023-01-01', '2023-06-15', '2023-12-31'];

const { traverse } = Traversable.lookup('array');

// fold 는 정적 메서드다 — Either.fold(onLeft, onRight, either)
Either.fold(
    err => console.error('Parse error:', err),
    parsed => console.log('Parsed dates:', parsed),
    traverse(Applicative.lookup('either'), parseDate, dates)
);
```

### Handling optional fields

```javascript
const { map } = Functor.lookup('maybe');
const { traverse } = Traversable.lookup('array');

const user = {
    name: Maybe.of('Alice'),
    email: Maybe.of('alice@email.com'),
    phone: Maybe.Nothing()
};

const fields = [user.name, user.email, user.phone];
const result = traverse(Applicative.lookup('maybe'), x => x, fields);

map(([name, email, phone]) => ({ name, email, phone }), result);
// Nothing (phone이 Nothing이므로)
```

## traverse vs map

| | map | traverse |
|---|---|---|
| result | keeps the same structure | flips the structure |
| function type | `a -> b` | `a -> F b` |
| use | simple transformation | transformation with effects |

```javascript
const MaybeApplicative = Applicative.lookup('maybe');
const { traverse } = Traversable.lookup('array');
// map: 구조 유지
[1, 2, 3].map(x => x * 2)  // [2, 4, 6]

// traverse: 구조 뒤집기
traverse(MaybeApplicative, x => Maybe.of(x * 2), [1, 2, 3])
// Maybe([2, 4, 6])
```

## Related type classes

- **Functor**: provides `map`
- **Foldable**: provides `reduce`
- **Applicative**: the result type of traverse
