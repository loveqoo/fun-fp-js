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
// Task<Either<Error, User>> — every step deals with both layers
fetchUser(id)
    .chain(eitherUser =>
        eitherUser.isLeft()
            ? Task.of(eitherUser)                  // propagate the failure by hand
            : fetchPosts(eitherUser.value).chain(eitherPosts =>
                eitherPosts.isLeft()
                    ? Task.of(eitherPosts)         // propagate again
                    : Task.of(Either.Right({ ... }))
              )
    );

// every step gets an isLeft branch. The real logic is the last line,
// and the rest is nothing but failure-propagation plumbing.
```

### The fix: let the type handle failure propagation

```javascript
const { EitherT, Task, Either } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));

const findUser = id => id > 0
    ? ET.of({ id, name: 'Anthony' })
    : ET.throwError('invalid id');

const program = findUser(1)
    .chain(user => ET.of({ ...user, greeting: `hello ${user.name}` }));

const ok = await run(ET.runEitherT(program));
console.log(ok.isRight(), ok.value.greeting);   // true 'hello Anthony'

const bad = await run(ET.runEitherT(findUser(-1).chain(u => ET.of(u.name))));
console.log(bad.isLeft(), bad.value);           // true 'invalid id'
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
console.log(B.of(1)._typeName);   // 'EitherT(M1)' — depends on execution order

try {
    A.runEitherT(B.of(1));
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## Construction

```javascript
const { EitherT } = FunFP;

const ET = EitherT('task');     // async + error — the most common combination
const EM = EitherT('maybe');    // absence + error

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
const result = ET.runEitherT(ET.throwError('failure reason'));

console.log(result.value.isLeft(), result.value.value);   // true 'failure reason'
```

The `chain` after a failure never runs.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
let reached = false;

const program = ET.throwError('boom').chain(() => {
    reached = true;               // must never get here
    return ET.of(1);
});

const result = ET.runEitherT(program);
console.log(result.value.isLeft(), 'callback ran:', reached);   // true 'callback ran:' false
```

### catchError - recovering from failure

**It's a static method, and the argument order is `(program, handler)`.** It is not
an instance method.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

const risky = ET.throwError('network error');
const safe = ET.catchError(risky, err => ET.of(`default (cause: ${err})`));

const result = ET.runEitherT(safe);
console.log(result.value.isRight(), result.value.value);
// true 'default (cause: network error)'
```

The handler can also fail again — a pattern for translating the error and rethrowing.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

const rethrown = ET.catchError(
    ET.throwError('ECONNREFUSED'),
    err => ET.throwError(`could not connect to the server (${err})`)
);

const result = ET.runEitherT(rethrown);
console.log(result.value.isLeft(), result.value.value);
// true 'could not connect to the server (ECONNREFUSED)'
```

The handler is never called for a program that succeeds.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
let handlerCalled = false;

const result = ET.runEitherT(
    ET.catchError(ET.of(1), () => { handlerCalled = true; return ET.of(0); })
);

console.log(result.value.value, 'handler called:', handlerCalled);   // 1 'handler called:' false
```

### fromEither - pulling in an existing Either

If you already have a function that returns `Either`, use it as-is.

```javascript
const { EitherT, Either } = FunFP;

const ET = EitherT('maybe');

const parsePort = s => {
    const n = Number(s);
    return Number.isInteger(n) && n > 0 ? Either.Right(n) : Either.Left(`invalid port: ${s}`);
};

const ok = ET.runEitherT(ET.fromEither(parsePort('8080')));
console.log(ok.value.isRight(), ok.value.value);      // true 8080

const bad = ET.runEitherT(ET.fromEither(parsePort('abc')));
console.log(bad.value.isLeft(), bad.value.value);     // true 'invalid port: abc'
```

### lift - pulling in a value of the underlying M

`of` takes a plain value, `lift` takes a value already wrapped in `M`.

```javascript
const { EitherT, Task } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));

const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

const result = await run(ET.runEitherT(ET.lift(delay(5, 'value from Task'))));
console.log(result.isRight(), result.value);   // true 'value from Task'
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
    ET.catchError(ET.of(1), () => 42);   // handler doesn't return an EitherT
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
const posts = { 1: ['first post', 'second post'] };

const fetchUser = id => ET.lift(delay(3, users[id]))
    .chain(u => (u ? ET.of(u) : ET.throwError(`no such user: ${id}`)));

const fetchPosts = user => ET.lift(delay(3, posts[user.id]))
    .chain(p => (p ? ET.of(p) : ET.throwError(`no posts: ${user.id}`)));

const profile = id => fetchUser(id)
    .chain(user => fetchPosts(user).chain(list => ET.of({ name: user.name, count: list.length })));

const ok = await run(ET.runEitherT(profile(1)));
console.log(ok.isRight(), JSON.stringify(ok.value));   // true {"name":"Anthony","count":2}

const missing = await run(ET.runEitherT(profile(99)));
console.log(missing.isLeft(), missing.value);          // true 'no such user: 99'
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
    return attempts < 3 ? ET.throwError(`attempt ${attempts} failed`) : ET.of(`attempt ${attempts} succeeded`);
});

// hook up two recoveries so it succeeds on the third try
const withRetry = ET.catchError(
    ET.catchError(flaky(), () => flaky()),
    () => flaky()
);

const result = await run(ET.runEitherT(withRetry));
console.log(result.isRight(), result.value, '/ total attempts', attempts);
// true 'attempt 3 succeeded' / total attempts 3
```

### 3. A validation pipeline

Reuse an existing validation function as-is with `fromEither`.

```javascript
const { EitherT, Either } = FunFP;

const ET = EitherT('maybe');

const required = field => obj => obj[field]
    ? Either.Right(obj)
    : Either.Left(`${field} is required`);

const minLength = (field, n) => obj => obj[field].length >= n
    ? Either.Right(obj)
    : Either.Left(`${field} must be at least ${n} characters`);

const validate = input => ET.fromEither(required('name')(input))
    .chain(o => ET.fromEither(required('password')(o)))
    .chain(o => ET.fromEither(minLength('password', 8)(o)));

const ok = ET.runEitherT(validate({ name: 'A', password: 'longenough' }));
console.log(ok.value.isRight());                     // true

const short = ET.runEitherT(validate({ name: 'A', password: '123' }));
console.log(short.value.value);                      // 'password must be at least 8 characters'

const missing = ET.runEitherT(validate({ name: 'A' }));
console.log(missing.value.value);                    // 'password is required'
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
    ET.throwError({ layer: 'service', message: 'please try again later', inner: e })
);

const result = ET.runEitherT(service());
const err = result.value.value;

console.log(err.layer, '/', err.message);        // 'service' / 'please try again later'
console.log(err.inner.cause);                    // 'ER_LOCK_WAIT_TIMEOUT' — the cause is preserved
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
