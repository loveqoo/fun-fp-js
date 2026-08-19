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
// every function takes config and passes it down
function getUser(config, id) {
    return query(config.db, `SELECT * FROM users WHERE id=${id}`);
}

function getUserPosts(config, id) {
    const user = getUser(config, id);          // pass config
    return query(config.db, `... ${user.id}`); // pass it again
}

function renderProfile(config, id) {
    const posts = getUserPosts(config, id);    // again
    return format(config.locale, posts);       // again
}

// config is actually used only at the very bottom,
// yet every function in between carries it in its signature.
```

### The fix: let the type carry the environment

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

const getUser = id => RT.asks(env => ({ id, db: env.db }));
const getPosts = user => RT.asks(env => [`post #${user.id} of ${env.db}`]);

const profile = id => getUser(id).chain(user => getPosts(user));

// the environment is injected exactly once, at run time
console.log(JSON.stringify(RT.runReaderT({ db: 'prod' }, profile(7)).value));
// ["post #7 of prod"]

console.log(JSON.stringify(RT.runReaderT({ db: 'test' }, profile(7)).value));
// ["post #7 of test"]
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

const RT = ReaderT('task');     // env + async
const RM = ReaderT('maybe');    // env + can fail

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

try { RT.local(42, RT.ask); } catch (e) { console.log('not a function:', e.constructor.name); }
try { RT.local(x => x, 42); } catch (e) { console.log('not a RT:', e.constructor.name); }
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

// business logic — has no idea what the environment is
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

// a repository that pulls db out of the environment
const findUser = id => RT.ask.chain(env => RT.lift(env.db.findUser(id)));
const countPosts = user => RT.ask.chain(env => RT.lift(env.db.countPosts(user.id)));

const summary = id => findUser(id)
    .chain(user => countPosts(user).chain(n => RT.of(`${user.name}: ${n} posts`)));

// inject a fake DB as the environment — testable without a real DB
const fakeDb = {
    findUser: id => delay(3, { id, name: 'testuser' }),
    countPosts: () => delay(3, 5)
};

console.log(await run(RT.runReaderT({ db: fakeDb }, summary(1))));
// testuser: 5 posts
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
    // just this block, with guest permissions
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
// true — without port, the whole thing is Nothing
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
