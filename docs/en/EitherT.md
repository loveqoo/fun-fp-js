# EitherT

> 한국어: [../EitherT.md](../EitherT.md)

**A Monad Transformer that composes another effect with error handling**

> The four Transformers' shared concepts (`of`/`lift`, the string-`M` rule, Free-based
> stack safety) are laid out in the [StateT](./StateT.md) document. Here we cover
> EitherT's own operations.

## Concept

[Either](./Either.md) splits success and failure as `Right | Left`. But if you need
to **find out whether it failed asynchronously**, Either alone isn't enough — you
end up with `Task<Either<E, A>>`, and you have to peel off both layers every time.

EitherT handles those two layers as one.

```
Either    e a = Left e | Right a
EitherT M e a = M (Either e a)
```

The most common combination is **`EitherT('task')`** — a computation that is both
asynchronous and can fail, which describes most API calls.

## Why EitherT?

### The problem: an Either inside a Task has to be unwrapped twice

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// Task<Either<Error, User>> — 단계마다 두 겹을 다룬다
fetchUser(id)
    .chain(eitherUser =>
        eitherUser.isLeft()
            ? Task.of(eitherUser)                  // 실패를 수동으로 전파
            : fetchPosts(eitherUser.value).chain(eitherPosts =>
                eitherPosts.isLeft()
                    ? Task.of(eitherPosts)         // 또 전파
                    : Task.of(Either.Right({ ... }))
              )
    );

// 단계마다 isLeft 분기가 붙는다. 진짜 로직은 마지막 한 줄인데
// 나머지가 전부 실패 전파 배관이다.
```

### The fix: let the type handle failure propagation

```javascript
const { EitherT, Task, Either } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));

const findUser = id => id > 0
    ? ET.of({ id, name: 'Anthony' })
    : ET.throwError('잘못된 id');

const program = findUser(1)
    .chain(user => ET.of({ ...user, greeting: `안녕 ${user.name}` }));

const ok = await run(ET.runEitherT(program));
console.log(ok.isRight(), ok.value.greeting);   // true '안녕 Anthony'

const bad = await run(ET.runEitherT(findUser(-1).chain(u => ET.of(u.name))));
console.log(bad.isLeft(), bad.value);           // true '잘못된 id'
```

Just chain `chain` calls together. The moment a failure appears, the remaining
steps never run.

## M is passed as a string

**This is a rule shared by all four Transformers.** Construct it as a string, like
`EitherT('task')`. Passing an object makes the type name depend on execution order,
like `EitherT(M1)`, and the two forms become different classes that can't be mixed.
See [StateT](./StateT.md#m-as-string) for details.

```javascript
const { EitherT, Maybe } = FunFP;

const A = EitherT('maybe');
const B = EitherT(Maybe);

console.log(A.of(1)._typeName);   // 'EitherT(Maybe)'
console.log(B.of(1)._typeName);   // 'EitherT(M1)' — 실행 순서에 따라 달라진다

try {
    A.runEitherT(B.of(1));
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## Construction

```javascript
const { EitherT } = FunFP;

const ET = EitherT('task');     // 비동기 + 에러 — 가장 흔한 조합
const EM = EitherT('maybe');    // 부재 + 에러

console.log(ET.of(1)._typeName);   // 'EitherT(Task)'
console.log(EM.of(1)._typeName);   // 'EitherT(Maybe)'
```

## Key operations

### of - the success value

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
const result = ET.runEitherT(ET.of(42));

console.log(result.value.isRight(), result.value.value);   // true 42
```

What comes out is the two-layer structure as-is — an `Either` inside `M` (Maybe).

### throwError - failure

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
const result = ET.runEitherT(ET.throwError('실패 사유'));

console.log(result.value.isLeft(), result.value.value);   // true '실패 사유'
```

The `chain` after a failure never runs.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
let reached = false;

const program = ET.throwError('boom').chain(() => {
    reached = true;               // 여기 오면 안 된다
    return ET.of(1);
});

const result = ET.runEitherT(program);
console.log(result.value.isLeft(), '콜백 실행됨:', reached);   // true '콜백 실행됨:' false
```

### catchError - recovering from failure

**It's a static method, and the argument order is `(program, handler)`.** It is not
an instance method.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

const risky = ET.throwError('네트워크 오류');
const safe = ET.catchError(risky, err => ET.of(`기본값 (원인: ${err})`));

const result = ET.runEitherT(safe);
console.log(result.value.isRight(), result.value.value);
// true '기본값 (원인: 네트워크 오류)'
```

The handler can also fail again — a pattern for translating the error and rethrowing.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

const rethrown = ET.catchError(
    ET.throwError('ECONNREFUSED'),
    err => ET.throwError(`서버에 연결할 수 없습니다 (${err})`)
);

const result = ET.runEitherT(rethrown);
console.log(result.value.isLeft(), result.value.value);
// true '서버에 연결할 수 없습니다 (ECONNREFUSED)'
```

The handler is never called for a program that succeeds.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
let handlerCalled = false;

const result = ET.runEitherT(
    ET.catchError(ET.of(1), () => { handlerCalled = true; return ET.of(0); })
);

console.log(result.value.value, '핸들러 호출됨:', handlerCalled);   // 1 '핸들러 호출됨:' false
```

### fromEither - pulling in an existing Either

If you already have a function that returns `Either`, use it as-is.

```javascript
const { EitherT, Either } = FunFP;

const ET = EitherT('maybe');

const parsePort = s => {
    const n = Number(s);
    return Number.isInteger(n) && n > 0 ? Either.Right(n) : Either.Left(`잘못된 포트: ${s}`);
};

const ok = ET.runEitherT(ET.fromEither(parsePort('8080')));
console.log(ok.value.isRight(), ok.value.value);      // true 8080

const bad = ET.runEitherT(ET.fromEither(parsePort('abc')));
console.log(bad.value.isLeft(), bad.value.value);     // true '잘못된 포트: abc'
```

### lift - pulling in a value of the underlying M

`of` takes a plain value, `lift` takes a value already wrapped in `M`.

```javascript
const { EitherT, Task } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));

const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

const result = await run(ET.runEitherT(ET.lift(delay(5, 'Task에서 온 값'))));
console.log(result.isRight(), result.value);   // true 'Task에서 온 값'
```

## Type checking

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

try {
    ET.runEitherT(42);
} catch (e) {
    console.log('runEitherT:', e.constructor.name);   // runEitherT: TypeError
}

try {
    ET.catchError(ET.of(1), () => 42);   // 핸들러가 EitherT를 안 돌려줌
    ET.runEitherT(ET.catchError(ET.throwError('x'), () => 42));
} catch (e) {
    console.log('catchError handler:', e.constructor.name);   // catchError handler: TypeError
}
```

## Practical examples

### 1. A multi-step API call (EitherT + Task)

Each step can fail and all of them are asynchronous. The failure branch is never
written even once.

```javascript
const { EitherT, Task } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));
const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

const users = { 1: { id: 1, name: 'Anthony' } };
const posts = { 1: ['첫 글', '둘째 글'] };

const fetchUser = id => ET.lift(delay(3, users[id]))
    .chain(u => (u ? ET.of(u) : ET.throwError(`사용자 없음: ${id}`)));

const fetchPosts = user => ET.lift(delay(3, posts[user.id]))
    .chain(p => (p ? ET.of(p) : ET.throwError(`글 없음: ${user.id}`)));

const profile = id => fetchUser(id)
    .chain(user => fetchPosts(user).chain(list => ET.of({ name: user.name, count: list.length })));

const ok = await run(ET.runEitherT(profile(1)));
console.log(ok.isRight(), JSON.stringify(ok.value));   // true {"name":"Anthony","count":2}

const missing = await run(ET.runEitherT(profile(99)));
console.log(missing.isLeft(), missing.value);          // true '사용자 없음: 99'
```

### 2. Retrying and falling back to a default

Assemble a recovery strategy with `catchError`.

```javascript
const { EitherT, Task } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));
const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

let attempts = 0;
const flaky = () => ET.lift(delay(1, null)).chain(() => {
    attempts++;
    return attempts < 3 ? ET.throwError(`시도 ${attempts} 실패`) : ET.of(`시도 ${attempts} 성공`);
});

// 두 번 복구를 걸어 세 번째에 성공시킨다
const withRetry = ET.catchError(
    ET.catchError(flaky(), () => flaky()),
    () => flaky()
);

const result = await run(ET.runEitherT(withRetry));
console.log(result.isRight(), result.value, '/ 총 시도', attempts);
// true '시도 3 성공' / 총 시도 3
```

### 3. A validation pipeline

Reuse an existing validation function as-is with `fromEither`.

```javascript
const { EitherT, Either } = FunFP;

const ET = EitherT('maybe');

const required = field => obj => obj[field]
    ? Either.Right(obj)
    : Either.Left(`${field} 는 필수입니다`);

const minLength = (field, n) => obj => obj[field].length >= n
    ? Either.Right(obj)
    : Either.Left(`${field} 는 ${n}자 이상이어야 합니다`);

const validate = input => ET.fromEither(required('name')(input))
    .chain(o => ET.fromEither(required('password')(o)))
    .chain(o => ET.fromEither(minLength('password', 8)(o)));

const ok = ET.runEitherT(validate({ name: 'A', password: 'longenough' }));
console.log(ok.value.isRight());                     // true

const short = ET.runEitherT(validate({ name: 'A', password: '123' }));
console.log(short.value.value);                      // 'password 는 8자 이상이어야 합니다'

const missing = ET.runEitherT(validate({ name: 'A' }));
console.log(missing.value.value);                    // 'password 는 필수입니다'
```

It stops at the first failure. If you want to collect every error, use
[Validation](./Validation.md).

### 4. Rewriting error messages layer by layer

Translate a low-level technical error into a user-facing message as it rises.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

const dbQuery = () => ET.throwError('ER_LOCK_WAIT_TIMEOUT');

const repository = () => ET.catchError(dbQuery(), e =>
    ET.throwError({ layer: 'repository', cause: e })
);

const service = () => ET.catchError(repository(), e =>
    ET.throwError({ layer: 'service', message: '잠시 후 다시 시도해 주세요', inner: e })
);

const result = ET.runEitherT(service());
const err = result.value.value;

console.log(err.layer, '/', err.message);        // 'service' / '잠시 후 다시 시도해 주세요'
console.log(err.inner.cause);                    // 'ER_LOCK_WAIT_TIMEOUT' — 원인은 보존
```

## Related type classes

- [Either](./Either.md) - the prototype without `M`. If you don't need asynchrony,
  Either is simpler.
- [Task](./Task.md) - the most common `M`. `EitherT('task')` is the representative
  combination.
- [Validation](./Validation.md) - when you want to **collect every error** instead of
  stopping at the first failure.
- [StateT](./StateT.md) - the Transformers' shared concepts (`of`/`lift`, string `M`,
  stack safety).
- [ReaderT](./ReaderT.md) · [WriterT](./WriterT.md) - the remaining Transformers.
