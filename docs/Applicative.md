# Applicative

**여러 값에 함수를 적용하는 타입**

## 개념

Applicative는 **여러 Functor 값에 함수를 적용**할 수 있게 합니다.

Functor의 `map`은 인자가 하나인 함수만 적용 가능:
```javascript
map(x => x + 1, Just(5))  // Just(6)
```

두 개 이상의 인자가 필요하면?
```javascript
// add = (a, b) => a + b 를 Just(5)와 Just(3)에 적용하려면?
map(add, Just(5))  // Just(b => 5 + b) - 부분 적용된 함수가 됨
// 이 함수를 어떻게 Just(3)에 적용하지?
```

여기서 `ap`가 필요합니다!

## 인터페이스

```javascript
Apply.ap(mf, mv): Apply b   // mf: Apply (a -> b), mv: Apply a
Applicative.of(a): Applicative a  // 값을 Applicative로 감싸기
```

## 법칙

### 항등 (Identity)
```javascript
ap(of(x => x), v) === v
```

### 동형사상 (Homomorphism)
```javascript
ap(of(f), of(x)) === of(f(x))
```

### 교환 (Interchange)
```javascript
ap(u, of(y)) === ap(of(f => f(y)), u)
```

### 합성 (Composition)
```javascript
ap(ap(ap(of(f => g => x => f(g(x))), u), v), w) === ap(u, ap(v, w))
```

## 사용 예시

### 기본 사용

```javascript
import FunFP from 'fun-fp-js';
const { Maybe, Apply, Applicative } = FunFP;

const add = a => b => a + b;  // 커리된 함수

// Maybe에 적용
const maybeAdd = Maybe.of(add);      // Just(a => b => a + b)
const maybeA = Maybe.of(5);          // Just(5)
const maybeB = Maybe.of(3);          // Just(3)

const step1 = Apply.types.MaybeApply.ap(maybeAdd, maybeA);  // Just(b => 5 + b)
const step2 = Apply.types.MaybeApply.ap(step1, maybeB);     // Just(8)
```

### liftA2 - 두 값에 이항 함수 적용

```javascript
const liftA2 = (apply, f, a, b) =>
    apply.ap(a.map(f), b);

// 두 Maybe 값 더하기
const result = liftA2(
    Apply.types.MaybeApply,
    a => b => a + b,
    Maybe.of(5),
    Maybe.of(3)
);
// Just(8)

// 하나라도 Nothing이면
const noResult = liftA2(
    Apply.types.MaybeApply,
    a => b => a + b,
    Maybe.of(5),
    Maybe.Nothing()
);
// Nothing
```

### liftA3 - 세 값에 삼항 함수 적용

```javascript
const liftA3 = (apply, f, a, b, c) =>
    apply.ap(apply.ap(a.map(f), b), c);

const fullName = first => middle => last => `${first} ${middle} ${last}`;

const result = liftA3(
    Apply.types.MaybeApply,
    fullName,
    Maybe.of('John'),
    Maybe.of('Michael'),
    Maybe.of('Smith')
);
// Just('John Michael Smith')
```

## 실용적 예시

### 폼 검증

```javascript
const { Either } = FunFP;

const validateName = name =>
    name.length > 0 ? Either.Right(name) : Either.Left('Name required');

const validateAge = age =>
    age >= 0 ? Either.Right(age) : Either.Left('Age must be positive');

const validateEmail = email =>
    email.includes('@') ? Either.Right(email) : Either.Left('Invalid email');

const createUser = name => age => email => ({ name, age, email });

// 모든 검증 통과시에만 사용자 생성
const liftA3 = (f, a, b, c) =>
    Apply.types.EitherApply.ap(
        Apply.types.EitherApply.ap(a.map(f), b),
        c
    );

const result = liftA3(
    createUser,
    validateName('Alice'),
    validateAge(30),
    validateEmail('alice@email.com')
);
// Right({ name: 'Alice', age: 30, email: 'alice@email.com' })

const invalid = liftA3(
    createUser,
    validateName(''),       // Left!
    validateAge(30),
    validateEmail('alice@email.com')
);
// Left('Name required')
```

### 병렬 비동기 요청

```javascript
const { Task } = FunFP;

const fetchUser = id => Task.of({ id, name: 'Alice' });
const fetchPosts = userId => Task.of([{ id: 1, title: 'Hello' }]);
const fetchComments = postId => Task.of([{ id: 1, text: 'Nice!' }]);

const combine = user => posts => comments => ({ user, posts, comments });

// 세 개의 Task를 병렬로 실행하고 결합
const liftA3 = (f, a, b, c) =>
    Apply.types.TaskApply.ap(
        Apply.types.TaskApply.ap(
            Functor.types.TaskFunctor.map(f, a),
            b
        ),
        c
    );

liftA3(
    combine,
    fetchUser(1),
    fetchPosts(1),
    fetchComments(1)
).fork(
    console.error,
    data => console.log(data)
);
// { user: {...}, posts: [...], comments: [...] }
```

## ap vs chain

| | ap | chain |
|---|---|---|
| 실행 | 병렬 가능 | 순차만 |
| 의존성 | 독립적 | 이전 결과에 의존 |
| 용도 | 여러 값 결합 | 조건부 분기 |

```javascript
// ap: 두 요청이 서로 독립적 → 병렬 가능
ap(fetchUser, fetchPosts)

// chain: 두 번째가 첫 번째 결과에 의존 → 순차 필수
fetchUser.chain(user => fetchPosts(user.id))
```

## 관련 타입 클래스

- **Functor**: map 제공
- **Apply**: ap 제공 (Applicative의 기반)
- **Monad**: chain 제공 (순차 실행)
