# ReaderT

> 한국어: [../ReaderT.md](../ReaderT.md)

**A Monad Transformer that composes another effect with dependency injection**

> The four Transformers' shared concepts (`of`/`lift`, the string-`M` rule, Free-based
> stack safety) are laid out in the [StateT](./StateT.md) document. Here we cover
> ReaderT's own operations.

## Concept

[Reader](./Reader.md) is `env -> a`. It's a computation that receives its environment
(config, a DB connection, a logger) later, but **it cannot fail or be asynchronous.**

ReaderT wraps that result in another monad `M`.

```
Reader    env a = env -> a
ReaderT M env a = env -> M a
```

When `M` is [Task](./Task.md), you get "an asynchronous computation that takes an
environment"; when `M` is [Maybe](./Maybe.md), you get "a computation that takes an
environment and can fail." A real application's service layer usually looks exactly
like this.

## Why ReaderT?

### The problem: passing a dependency to every function by hand

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// 모든 함수가 config를 받아 아래로 전달한다
function getUser(config, id) {
    return query(config.db, `SELECT * FROM users WHERE id=${id}`);
}

function getUserPosts(config, id) {
    const user = getUser(config, id);          // config 전달
    return query(config.db, `... ${user.id}`); // 또 전달
}

function renderProfile(config, id) {
    const posts = getUserPosts(config, id);    // 또
    return format(config.locale, posts);       // 또
}

// config를 실제로 쓰는 곳은 맨 아래인데
// 중간 함수 전부가 시그니처에 config를 달고 있다.
```

### The fix: let the type carry the environment

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

const getUser = id => RT.asks(env => ({ id, db: env.db }));
const getPosts = user => RT.asks(env => [`${env.db}의 ${user.id}번 글`]);

const profile = id => getUser(id).chain(user => getPosts(user));

// 환경은 실행 시점에 딱 한 번 주입한다
console.log(JSON.stringify(RT.runReaderT({ db: 'prod' }, profile(7)).value));
// ["prod의 7번 글"]

console.log(JSON.stringify(RT.runReaderT({ db: 'test' }, profile(7)).value));
// ["test의 7번 글"]
```

None of the intermediate functions have an `env` parameter. The same program can run
as-is against a different environment — **this is exactly what makes testing easier.**

## M is passed as a string

**This is a rule shared by all four Transformers.** Construct it as a string, like
`ReaderT('task')`. Passing an object makes the type name depend on execution order,
like `ReaderT(M1)`, and the two forms become different classes that can't be mixed.
See [StateT](./StateT.md#m-as-string) for details.

```javascript
const { ReaderT, Maybe } = FunFP;

const A = ReaderT('maybe');
const B = ReaderT(Maybe);

console.log(A.of(1)._typeName);   // 'ReaderT(Maybe)'
console.log(B.of(1)._typeName);   // 'ReaderT(M1)'

try {
    A.runReaderT({}, B.of(1));
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## Construction

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('task');     // 환경 + 비동기
const RM = ReaderT('maybe');    // 환경 + 실패 가능

console.log(RT.of(1)._typeName);   // 'ReaderT(Task)'
console.log(RM.of(1)._typeName);   // 'ReaderT(Maybe)'
```

## Key operations

### ask - read the whole environment

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');
const result = RT.runReaderT({ name: 'prod', port: 8080 }, RT.ask);

console.log(JSON.stringify(result.value));   // {"name":"prod","port":8080}
```

### asks - pull out just part of the environment

In most cases `asks` beats `ask` — extracting only what you need narrows the
dependency.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');
const result = RT.runReaderT({ x: 10, y: 20 }, RT.asks(env => env.x * 2));

console.log(result.value);   // 20
```

### local - run with a modified environment

Runs only a section under a different environment. The outer environment is
unaffected.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

const readX = RT.asks(env => env.x);

const program = readX.chain(outer =>
    RT.local(env => ({ ...env, x: 999 }), readX)
        .chain(inner => RT.asks(env => ({ outer, inner, after: env.x })))
);

console.log(JSON.stringify(RT.runReaderT({ x: 1 }, program).value));
// {"outer":1,"inner":999,"after":1}
```

The key point is that `after` is `1` again — `local`'s effect only holds inside it.

`local` validates its arguments.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

try { RT.local(42, RT.ask); } catch (e) { console.log('함수 아님:', e.constructor.name); }
try { RT.local(x => x, 42); } catch (e) { console.log('RT 아님:', e.constructor.name); }
```

### of / lift

`of` takes a value that doesn't depend on the environment, `lift` takes a value
already wrapped in `M`.

```javascript
const { ReaderT, Maybe } = FunFP;

const RT = ReaderT('maybe');

console.log(RT.runReaderT({}, RT.of(42)).value);                    // 42
console.log(RT.runReaderT({}, RT.lift(Maybe.Just(42))).value);      // 42
console.log(RT.runReaderT({}, RT.lift(Maybe.Nothing())).isNothing());  // true
```

## Type checking

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

try {
    RT.runReaderT({}, 42);
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## Practical examples

### 1. Injecting config — same code, different environment

Run the same program in production and in tests, swapping only the environment.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

// 비즈니스 로직 — 환경이 무엇인지 모른다
const buildUrl = path => RT.asks(env => `${env.protocol}://${env.host}:${env.port}${path}`);
const withAuth = url => RT.asks(env => `${url}?token=${env.token}`);

const endpoint = path => buildUrl(path).chain(withAuth);

const prod = { protocol: 'https', host: 'api.example.com', port: 443, token: 'REAL' };
const test = { protocol: 'http', host: 'localhost', port: 3000, token: 'FAKE' };

console.log(RT.runReaderT(prod, endpoint('/users')).value);
// https://api.example.com:443/users?token=REAL

console.log(RT.runReaderT(test, endpoint('/users')).value);
// http://localhost:3000/users?token=FAKE
```

The program itself was never touched — only the environment changed. This is exactly
how you'd inject a mock in tests.

### 2. An asynchronous storage layer (ReaderT + Task)

Set `M` to Task and you get an asynchronous service that takes an environment.

```javascript
const { ReaderT, Task } = FunFP;

const RT = ReaderT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));
const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

// 환경에서 db를 꺼내 쓰는 저장소
const findUser = id => RT.ask.chain(env => RT.lift(env.db.findUser(id)));
const countPosts = user => RT.ask.chain(env => RT.lift(env.db.countPosts(user.id)));

const summary = id => findUser(id)
    .chain(user => countPosts(user).chain(n => RT.of(`${user.name}: 글 ${n}개`)));

// 가짜 DB를 환경으로 주입 — 실제 DB 없이 테스트할 수 있다
const fakeDb = {
    findUser: id => delay(3, { id, name: '테스트유저' }),
    countPosts: () => delay(3, 5)
};

console.log(await run(RT.runReaderT({ db: fakeDb }, summary(1))));
// 테스트유저: 글 5개
```

### 3. Running with reduced permissions via local

A pattern for running just a section under a restricted environment.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

const currentRole = RT.asks(env => env.role);
const canDelete = RT.asks(env => env.role === 'admin');

const audit = RT.ask.chain(() =>
    currentRole.chain(role => canDelete.chain(may => RT.of({ role, may })))
);

const program = audit.chain(outer =>
    // 이 블록만 게스트 권한으로
    RT.local(env => ({ ...env, role: 'guest' }), audit)
        .chain(inner => RT.of({ outer, inner }))
);

console.log(JSON.stringify(RT.runReaderT({ role: 'admin' }, program).value));
// {"outer":{"role":"admin","may":true},"inner":{"role":"guest","may":false}}
```

### 4. Failing on a value from the environment

Read with `asks` and fail with `lift`, and you get "abort if the config is missing."

```javascript
const { ReaderT, Maybe } = FunFP;

const RT = ReaderT('maybe');

const requireConfig = key => RT.asks(env => env[key])
    .chain(v => (v === undefined ? RT.lift(Maybe.Nothing()) : RT.of(v)));

const connectionString = requireConfig('host')
    .chain(host => requireConfig('port').chain(port => RT.of(`${host}:${port}`)));

console.log(RT.runReaderT({ host: 'db.local', port: 5432 }, connectionString).value);
// db.local:5432

console.log(RT.runReaderT({ host: 'db.local' }, connectionString).isNothing());
// true — port가 없으면 전체가 Nothing
```

## Related type classes

- [Reader](./Reader.md) - the prototype without `M`. If you don't need an effect,
  Reader is simpler.
- [Task](./Task.md) - `ReaderT('task')` is the base shape for an asynchronous service
  layer that takes an environment.
- [StateT](./StateT.md) - the Transformers' shared concepts (`of`/`lift`, string `M`,
  stack safety). If you need **changing state** rather than an environment, this is
  the one.
- [EitherT](./EitherT.md) · [WriterT](./WriterT.md) - the remaining Transformers.
