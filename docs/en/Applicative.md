# Applicative

> 한국어: [../Applicative.md](../Applicative.md)

**A type that applies a function across several values**

## Concept

Applicative lets you **apply a function across several Functor values**.

Functor's `map` can only apply a function of one argument:
```javascript
const { map } = Functor.lookup('maybe');
map(x => x + 1, Maybe.Just(5))  // Maybe.Just(6)
```

What if the function needs two or more arguments?
```javascript
const add = a => b => a + b;  // 커리된 함수
const { map } = Functor.lookup('maybe');
// add = (a, b) => a + b 를 Maybe.Just(5)와 Maybe.Just(3)에 적용하려면?
map(add, Maybe.Just(5))  // Maybe.Just(b => 5 + b) - 부분 적용된 함수가 됨
// 이 함수를 어떻게 Maybe.Just(3)에 적용하지?
```

This is where `ap` comes in.

## Interface

```javascript no-run 시그니처·의사코드 표기
Apply.ap(mf, mv): Apply b   // mf: Apply (a -> b), mv: Apply a
Applicative.lookup(a): Applicative a  // 값을 Applicative로 감싸기
```

## Laws

### Identity
```javascript no-run 대수 법칙 — 자유변수 표기
const { ap } = Apply.lookup('maybe');
ap(of(x => x), v) === v
```

### Homomorphism
```javascript no-run 대수 법칙 — 자유변수 표기
const { ap } = Apply.lookup('maybe');
ap(of(f), of(x)) === of(f(x))
```

### Interchange
```javascript no-run 대수 법칙 — 자유변수 표기
const { ap } = Apply.lookup('maybe');
ap(u, of(y)) === ap(of(f => f(y)), u)
```

### Composition
```javascript no-run 대수 법칙 — 자유변수 표기
const { ap } = Apply.lookup('maybe');
ap(ap(ap(of(f => g => x => f(g(x))), u), v), w) === ap(u, ap(v, w))
```

## Usage examples

### Basic usage

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

### liftA2 — applying a binary function to two values

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

### liftA3 — applying a ternary function to three values

```javascript
const { ap } = Apply.lookup('maybe');

const liftA3 = (f, a, b, c) => ap(ap(a.map(f), b), c);

const fullName = first => middle => last => `${first} ${middle} ${last}`;

const result = liftA3(fullName, Maybe.of('John'), Maybe.of('Michael'), Maybe.of('Smith'));
// Maybe.Just('John Michael Smith')
```

## `identity` and `Const` — the two Applicatives you pass to traverse

`Traversable.traverse(applicative, f, ta)` does something different **depending on which
Applicative you pass it**. These two are what you reach for in that slot.

| what you pass | what traverse does |
| --- | --- |
| `Applicative.lookup('identity')` | carries the value through unchanged → **plain mapping** |
| `Applicative.Const(monoid)` | discards the value and folds via the monoid → **folding** |

[Optics](./Optics.md)'s `over` uses the first one; `foldMapOf`/`toList`/`preview` use the second.

### identity — carries the value through unchanged

```javascript
const { Applicative, Functor } = FunFP;

const Id = Applicative.lookup('identity');
console.log(Id.of(1).value);                            // 1
console.log(Id.ap(Id.of(x => x * 3), Id.of(2)).value);  // 6

// Functor / Apply 층도 같은 키로 등록돼 있습니다
// 캐리어는 반드시 of 로 만든다 — { value: 1 } 리터럴은 Identity 가 아니라 평범한 객체다.
console.log(Functor.lookup('identity').map(x => x + 1, Id.of(1)).value);  // 2
```

### Const — discards the value and folds via the monoid

`Applicative.Const(monoid)` is a **parameterized factory**. Given a key, it registers itself
under `const(<key>)`; given a `Monoid` instance that is not registered, it caches per instance
(the same shape as `Monoid.Maybe(innerSG)`).

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

The key point is that `map` discards the value — which is exactly what turns `traverse` into
"walk the structure and fold it with a monoid." `Optics.foldMapOf(monoid, optic, f, s)` is
precisely that.

There is one more factory of the same shape — `Applicative.Writer(monoid)`. The registered
`writer` instance is Array-Monoid-only, so an `of`-chaining Writer Applicative/Monad over any
other Monoid comes from this factory. See [Writer](./Writer.md#writer-factory) for details.

## Practical examples

### Form validation

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

### Parallel async requests

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
| execution | can run in parallel | sequential only |
| dependency | independent | depends on the previous result |
| use | combining several values | conditional branching |

```javascript no-run 개념 비교 — 의사코드
// ap: 두 요청이 서로 독립적 → 병렬 가능
ap(fetchUser, fetchPosts)

// chain: 두 번째가 첫 번째 결과에 의존 → 순차 필수
fetchUser.chain(user => fetchPosts(user.id))
```

## Related type classes

- **Functor**: provides `map`
- **Apply**: provides `ap` (the basis of Applicative)
- **Monad**: provides `chain` (sequential execution)
