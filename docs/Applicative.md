# Applicative

> English: [./en/Applicative.md](./en/Applicative.md)

**여러 값에 함수를 적용하는 타입**

## 개념

Applicative는 **여러 Functor 값에 함수를 적용**할 수 있게 합니다.

Functor의 `map`은 인자가 하나인 함수만 적용 가능:
```javascript
const { map } = Functor.lookup('maybe');
map(x => x + 1, Maybe.Just(5))  // Maybe.Just(6)
```

두 개 이상의 인자가 필요하면?
```javascript
const add = a => b => a + b;  // 커리된 함수
const { map } = Functor.lookup('maybe');
// add = (a, b) => a + b 를 Maybe.Just(5)와 Maybe.Just(3)에 적용하려면?
map(add, Maybe.Just(5))  // Maybe.Just(b => 5 + b) - 부분 적용된 함수가 됨
// 이 함수를 어떻게 Maybe.Just(3)에 적용하지?
```

여기서 `ap`가 필요합니다!

## 인터페이스

```javascript no-run 시그니처·의사코드 표기
Apply.ap(mf, mv): Apply b   // mf: Apply (a -> b), mv: Apply a
Applicative.lookup(키): Applicative 인스턴스   // 값을 감싸는 것은 그 인스턴스의 of
```

## 법칙

### 항등 (Identity)
```javascript no-run 대수 법칙 — 자유변수 표기
const { ap } = Apply.lookup('maybe');
ap(of(x => x), v) === v
```

### 동형사상 (Homomorphism)
```javascript no-run 대수 법칙 — 자유변수 표기
const { ap } = Apply.lookup('maybe');
ap(of(f), of(x)) === of(f(x))
```

### 교환 (Interchange)
```javascript no-run 대수 법칙 — 자유변수 표기
const { ap } = Apply.lookup('maybe');
ap(u, of(y)) === ap(of(f => f(y)), u)
```

### 합성 (Composition)
```javascript no-run 대수 법칙 — 자유변수 표기
const { ap } = Apply.lookup('maybe');
ap(ap(ap(of(f => g => x => f(g(x))), u), v), w) === ap(u, ap(v, w))
```

## 사용 예시

### 기본 사용

```javascript
import FunFP from 'fun-fp-js';
const { Maybe, Apply, Applicative } = FunFP;

const add = a => b => a + b;  // 커리된 함수

// Maybe에 적용
const maybeAdd = Maybe.of(add);      // Maybe.Just(a => b => a + b)
const maybeA = Maybe.of(5);          // Maybe.Just(5)
const maybeB = Maybe.of(3);          // Maybe.Just(3)

const { ap } = Apply.lookup('maybe');

const step1 = ap(maybeAdd, maybeA);  // Maybe.Just(b => 5 + b)
const step2 = ap(step1, maybeB);     // Maybe.Just(8)
```

### liftA2 - 두 값에 이항 함수 적용

```javascript
const { ap } = Apply.lookup('maybe');

const liftA2 = (f, a, b) => ap(a.map(f), b);

// 두 Maybe 값 더하기
const result = liftA2(a => b => a + b, Maybe.of(5), Maybe.of(3));
// Maybe.Just(8)

// 하나라도 Nothing이면
const noResult = liftA2(a => b => a + b, Maybe.of(5), Maybe.Nothing());
// Nothing
```

### liftA3 - 세 값에 삼항 함수 적용

```javascript
const { ap } = Apply.lookup('maybe');

const liftA3 = (f, a, b, c) => ap(ap(a.map(f), b), c);

const fullName = first => middle => last => `${first} ${middle} ${last}`;

const result = liftA3(fullName, Maybe.of('John'), Maybe.of('Michael'), Maybe.of('Smith'));
// Maybe.Just('John Michael Smith')
```

## `identity` 와 `Const` — traverse 에 넘기는 두 Applicative

`Traversable.traverse(applicative, f, ta)` 는 **어떤 Applicative 를 넘기느냐**에 따라 하는 일이
달라집니다. 그 자리에 넣으려고 있는 것이 이 둘입니다.

| 넘기는 것 | traverse 가 하는 일 |
| --- | --- |
| `Applicative.lookup('identity')` | 값을 그대로 나른다 → **그냥 매핑** |
| `Applicative.Const(monoid)` | 값을 버리고 monoid 로 모은다 → **접기** |

[Optics](./Optics.md) 의 `over` 가 앞엣것을, `foldMapOf`/`toList`/`preview` 가 뒤엣것을 씁니다.

### identity — 값을 그대로 나른다

```javascript
const { Applicative, Functor } = FunFP;

const Id = Applicative.lookup('identity');
console.log(Id.of(1).value);                            // 1
console.log(Id.ap(Id.of(x => x * 3), Id.of(2)).value);  // 6

// Functor / Apply 층도 같은 키로 등록돼 있습니다
// 캐리어는 반드시 of 로 만든다 — { value: 1 } 리터럴은 Identity 가 아니라 평범한 객체다.
console.log(Functor.lookup('identity').map(x => x + 1, Id.of(1)).value);  // 2
```

### Const — 값을 버리고 monoid 로 모은다

`Applicative.Const(monoid)` 는 **매개변수화 팩토리**입니다. 키를 주면 `const(<키>)` 로
레지스트리에 등록되고, 등록되지 않은 `Monoid` 인스턴스를 주면 인스턴스별로 캐시됩니다
(`Monoid.Maybe(innerSG)` 와 같은 모양입니다).

```javascript
const { Applicative } = FunFP;

const C = Applicative.Const('array');

console.log(C.of().value);                               // []        monoid 의 항등원
console.log(C.ap(C.wrap([1]), C.wrap([2])).value);       // [ 1, 2 ]  monoid 로 합침
console.log(C.map(x => x + 1, C.wrap([9])).value);       // [ 9 ]     값을 버린다

// of 는 값을 버리고 wrap 은 담는다 — 법칙이 of 를 그렇게 요구한다.
console.log(C.of([7]).value);                            // []
console.log(C.wrap([7]).value);                          // [ 7 ]

// 키로 만든 것은 레지스트리에서도 꺼낼 수 있습니다
console.log(Applicative.lookup('const(array)') === C);       // true
```

`map` 이 값을 버리는 것이 핵심입니다 — 그래서 `traverse` 가 "구조를 훑으며 monoid 로 모으는"
동작이 됩니다. `Optics.foldMapOf(monoid, optic, f, s)` 가 정확히 그것입니다.

같은 모양의 팩토리가 하나 더 있습니다 — `Applicative.Writer(monoid)`. 등록된 `writer` 는
Array Monoid 전용이라, 다른 Monoid 로 `of` 를 잇는 Writer Applicative/Monad 는 이 팩토리로
만듭니다. 자세한 것은 [Writer](./Writer.md#writer-factory) 에 있습니다.

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
const { ap } = Apply.lookup('either');

const liftA3 = (f, a, b, c) => ap(ap(a.map(f), b), c);

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
const { ap } = Apply.lookup('task');
const { map } = Functor.lookup('task');

const liftA3 = (f, a, b, c) => ap(ap(map(f, a), b), c);

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

```javascript no-run 개념 비교 — 의사코드
// ap: 두 요청이 서로 독립적 → 병렬 가능
ap(fetchUser, fetchPosts)

// chain: 두 번째가 첫 번째 결과에 의존 → 순차 필수
fetchUser.chain(user => fetchPosts(user.id))
```

## 관련 타입 클래스

- **Functor**: map 제공
- **Apply**: ap 제공 (Applicative의 기반)
- **Monad**: chain 제공 (순차 실행)
