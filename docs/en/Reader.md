# Reader

> 한국어: [../Reader.md](../Reader.md)

**A monad for environment-based computation (dependency injection)**

## Concept

Reader represents **a computation that implicitly carries an environment
along.**

- The environment is never passed as an explicit parameter
- Inject it once with `run(env)` and every computation shares that environment
- A functional implementation of the dependency-injection pattern

## Why Reader?

### Problem: parameter drilling or global variables

```javascript no-run the problem — a network call
// config must be passed through every function
const fetchUser = (id, config) => {
    return fetch(`${config.apiUrl}/users/${id}`, {
        headers: { 'API-Key': config.apiKey }
    });
};

const getProfile = (userId, config) => {
    return fetchUser(userId, config).then(user => ({
        ...user,
        avatarUrl: `${config.cdnUrl}/avatars/${user.id}.png`
    }));
};

// keep passing config along
getProfile(123, config);
```

**Problems:**
- Even intermediate functions that never use the config have to accept it and pass it along
- Testing means passing a mock config to every single function
- Using a global variable instead makes testing hard

### Fix: propagate the environment with Reader

```javascript no-run a network call — not executed here
const { Reader, Chain } = FunFP;
const { chain } = Chain.lookup('reader');

const fetchUser = id => Reader.asks(config =>
    fetch(`${config.apiUrl}/users/${id}`, {
        headers: { 'API-Key': config.apiKey }
    })
);

const getProfile = userId =>
    chain(
        user => Reader.asks(config => ({
            ...user,
            avatarUrl: `${config.cdnUrl}/avatars/${user.id}.png`
        })),
        fetchUser(userId)
    );

// inject the environment only once via run
getProfile(123).run(config);
```

**Advantages:**
- The environment is injected exactly once (`run(config)`)
- Intermediate functions don't need to know the environment exists
- Injecting a mock for tests is simple
- Functions stay pure (no side effects)

## Construction

```javascript
import FunFP from 'fun-fp-js';
const { Reader } = FunFP;

// of - ignores the environment, returns a constant
const reader = Reader.of(42);
reader.run('any env');  // 42
reader.run(null);       // 42

// new Reader - takes the environment and computes
const envReader = new Reader(env => env.value * 2);
envReader.run({ value: 21 });  // 42

// ask - returns the environment itself
const askReader = Reader.ask;
askReader.run({ db: 'connection' });
// { db: 'connection' }

// asks - extracts a value from the environment
const getDb = Reader.asks(env => env.db);
getDb.run({ db: 'connection', user: 'admin' });
// 'connection'
```

## Main operations (Static Land first)

### map - transforming the result (Functor)

The environment stays as-is; only the result is transformed.

```javascript
const { Functor } = FunFP;
const { map } = Functor.lookup('reader');

const reader = Reader.of(21);
map(x => x * 2, reader);  // Reader that returns 42

// run it
map(x => x * 2, reader).run(null);  // 42

// when using the environment
const envReader = new Reader(env => env.base);
map(x => x + 10, envReader).run({ base: 32 });  // 42

// or the Static method
Reader.map(x => x * 2, reader);
```

### chain - chaining Readers (Chain)

Chains through a function that returns a Reader. The environment propagates
automatically.

```javascript
const { Chain } = FunFP;
const { chain } = Chain.lookup('reader');

const getConfig = Reader.ask;
const useConfig = config => Reader.of(config.value + 10);

chain(useConfig, getConfig).run({ value: 32 });  // 42

// chaining several times
const reader = Reader.of(1);
chain(
    b => Reader.of(b * 3),
    chain(
        a => Reader.of(a + 2),
        reader
    )
).run(null);  // 9

// or the Static method
Reader.chain(useConfig, getConfig);
```

### ap - applying a function (Apply)

Applies the function inside a Reader to the value inside another Reader.

```javascript
const { Apply } = FunFP;
const { ap } = Apply.lookup('reader');

const rf = Reader.of(x => x * 2);
const ra = Reader.of(21);
ap(rf, ra).run(null);  // 42

// an environment-dependent function
const envRf = new Reader(env => x => x * env.multiplier);
const ra2 = Reader.of(7);
ap(envRf, ra2).run({ multiplier: 6 });  // 42

// or the Static method
Reader.ap(rf, ra);
```

### Reader.local - a local change to the environment

Applies a modified environment to one specific Reader only.

```javascript
const reader = Reader.ask;
const modified = Reader.local(e => e * 2, reader);

reader.run(5);    // 5
modified.run(5);  // 10 (environment doubled)

// changing an object environment
const getMultiplier = Reader.asks(e => e.multiplier);
const doubled = Reader.local(
    e => ({ ...e, multiplier: e.multiplier * 2 }),
    getMultiplier
);

doubled.run({ multiplier: 5 });  // 10
```

## Running it

```javascript
const reader = Reader.asks(config => config.apiUrl);

// inject the environment via run
reader.run({ apiUrl: 'https://api.example.com' });
// 'https://api.example.com'
```

## Instance methods (convenience)

Convenience methods added on top of the Static Land and Static methods.

```javascript
// map
Reader.of(21).map(x => x * 2).run(null);  // 42

// chain
Reader.ask.chain(config => Reader.of(config.value)).run({ value: 42 });
// 42

// chaining in sequence
Reader.of(1)
    .chain(a => Reader.of(a + 2))
    .chain(b => Reader.of(b * 3))
    .run(null);  // 9
```

## Type checks

```javascript
Reader.isReader(Reader.of(5));         // true
Reader.isReader(new Reader(_ => 5));   // true
Reader.isReader(_ => 5);               // false (a function is not a Reader)
Reader.isReader(5);                    // false
```

## Practical examples

### 1. Injecting a database connection

```javascript
const createDatabaseConnection = cfg => ({ query: () => [], cfg });
const { Reader, Chain } = FunFP;
const { chain } = Chain.lookup('reader');

// database query functions (use the DB connection from the environment)
const findUser = id => Reader.asks(env =>
    env.db.query('SELECT * FROM users WHERE id = ?', [id])
);

const findPosts = userId => Reader.asks(env =>
    env.db.query('SELECT * FROM posts WHERE user_id = ?', [userId])
);

// fetch the user and posts together
const getUserWithPosts = userId =>
    chain(
        user => chain(
            posts => Reader.of({ user, posts }),
            findPosts(user.id)
        ),
        findUser(userId)
    );

// real usage: inject the DB connection
const db = createDatabaseConnection();
const result = getUserWithPosts(123).run({ db });
// { user: {...}, posts: [...] }

// test: inject a mock DB
const mockDb = {
    query: (sql, params) => Promise.resolve([
        { id: 123, name: 'Test User' }
    ])
};
const testResult = getUserWithPosts(123).run({ db: mockDb });
```

### 2. Propagating a logging context

```javascript
const { Reader, Chain } = FunFP;
const { chain } = Chain.lookup('reader');

// helper that pulls the logger from the environment
const log = message => Reader.asks(env => {
    env.logger.log(`[${env.requestId}] ${message}`);
});

// business logic
const processOrder = order =>
    chain(
        _ => chain(
            _ => chain(
                _ => Reader.of({ status: 'completed', orderId: order.id }),
                log('Payment processed')
            ),
            log('Inventory updated')
        ),
        log(`Processing order ${order.id}`)
    );

// inject requestId and logger for each request
const handleRequest = (req, order) => {
    const context = {
        requestId: req.id,
        logger: console
    };
    return processOrder(order).run(context);
};

handleRequest({ id: 'req-123' }, { id: 'order-456' });
// [req-123] Processing order order-456
// [req-123] Inventory updated
// [req-123] Payment processed
// { status: 'completed', orderId: 'order-456' }
```

### 3. Multi-level config management

```javascript
const { Reader, Chain } = FunFP;
const { chain } = Chain.lookup('reader');

// read several config values
const getApiUrl = Reader.asks(config => config.api.url);
const getApiKey = Reader.asks(config => config.api.key);
const getCdnUrl = Reader.asks(config => config.cdn.url);
const getTimeout = Reader.asks(config => config.timeout || 5000);

// combine the config into an HTTP client
const createHttpClient =
    chain(
        url => chain(
            key => chain(
                timeout => Reader.of({
                    baseURL: url,
                    headers: { 'API-Key': key },
                    timeout
                }),
                getTimeout
            ),
            getApiKey
        ),
        getApiUrl
    );

// or use Reader.lift (more concise)
const createHttpClient2 = Reader.lift(
    (url, key, timeout) => ({
        baseURL: url,
        headers: { 'API-Key': key },
        timeout
    })
)(getApiUrl, getApiKey, getTimeout);

// inject the config
const config = {
    api: {
        url: 'https://api.example.com',
        key: 'secret123'
    },
    cdn: {
        url: 'https://cdn.example.com'
    },
    timeout: 10000
};

const client = createHttpClient.run(config);
// {
//   baseURL: 'https://api.example.com',
//   headers: { 'API-Key': 'secret123' },
//   timeout: 10000
// }
```

### 4. Injecting mocks for tests

```javascript
// production implementation (uses a real DB/SMTP). Must have the same shape as the test environment.
const realUserService = {
    findById: id => ({ id, email: 'alice@example.com', name: 'Alice' })
};
const realEmailService = {
    send: ({ to, subject, body }) => ({ to, subject, body, sent: true })
};

const { Reader, Chain } = FunFP;
const { chain } = Chain.lookup('reader');

// production implementation
const sendEmail = (to, subject, body) => Reader.asks(env =>
    env.emailService.send({ to, subject, body })
);

const notifyUser = userId =>
    chain(
        user => sendEmail(
            user.email,
            'Notification',
            `Hello ${user.name}`
        ),
        Reader.asks(env => env.userService.findById(userId))
    );

// production environment
const prodEnv = {
    userService: realUserService,
    emailService: realEmailService
};
notifyUser(123).run(prodEnv);

// test environment
const testEnv = {
    userService: {
        findById: id => ({ id, email: 'test@example.com', name: 'Test' })
    },
    emailService: {
        send: ({ to, subject, body }) => {
            console.log(`Mock: Sending to ${to}`);
            return Promise.resolve({ sent: true });
        }
    }
};
notifyUser(123).run(testEnv);
// Mock: Sending to test@example.com
// { sent: true }
```

### 5. Changing the environment with Reader.local

```javascript
const { Reader, Chain } = FunFP;
const { chain } = Chain.lookup('reader');

// default logger
const log = message => Reader.asks(env =>
    env.logger.log(`[${env.level}] ${message}`)
);

// switch just one part to DEBUG level
const withDebugLevel = reader =>
    Reader.local(env => ({ ...env, level: 'DEBUG' }), reader);

const processWithLogging =
    chain(
        _ => chain(
            _ => log('Processing completed'),
            withDebugLevel(log('Detailed debug info'))
        ),
        log('Starting process')
    );

const env = {
    logger: console,
    level: 'INFO'
};

processWithLogging.run(env);
// [INFO] Starting process
// [DEBUG] Detailed debug info  <- level changed!
// [INFO] Processing completed
```

## Related type classes

Type classes Reader implements:

- **Functor**: `map` - transforms the result
- **Apply**: `ap` - applies a function
- **Applicative**: `of` - creates a Reader that ignores the environment
- **Chain**: `chain` - chains Readers
- **Monad**: Applicative + Chain

## Reader.pipeK / Reader.composeK

Combines functions that return a Reader using Kleisli composition.

### Reader.pipeK - left-to-right composition

```javascript
const addEnv = x => Reader.asks(env => x + env.offset);
const double = x => Reader.of(x * 2);
const toString = x => Reader.of(`Result: ${x}`);

const pipeline = Reader.pipeK(addEnv, double, toString);
pipeline(5).run({ offset: 3 });
// (5 + 3) * 2 = 16
// 'Result: 16'
```

### Reader.composeK - right-to-left composition

```javascript
const addEnv = x => Reader.asks(env => x + env.offset);
const double = x => Reader.of(x * 2);
const toString = x => Reader.of(`Result: ${x}`);

// opposite direction from pipeK
const pipeline = Reader.composeK(toString, double, addEnv);
pipeline(5).run({ offset: 3 });
// 'Result: 16' (same result)
```

## Reader.lift

Lifts a multi-argument function into the Reader context.

```javascript
// a pure function
const add = (a, b) => a + b;

// lift into Reader
const liftedAdd = Reader.lift(add);

const r1 = Reader.of(10);
const r2 = Reader.of(32);
liftedAdd(r1, r2).run(null);  // 42

// environment-dependent Readers work too
const multiply = (a, b) => a * b;
const liftedMultiply = Reader.lift(multiply);

const rx = Reader.asks(env => env.x);
const ry = Reader.asks(env => env.y);
liftedMultiply(rx, ry).run({ x: 6, y: 7 });  // 42
```

## Usage patterns for Reader

### When should you use Reader?

**Good fit:**
1. When a config has to reach several functions
2. When you need dependency injection (DB, logger, HTTP client, etc.)
3. When tests need to inject mocks
4. When you want to avoid global variables

**Not necessary:**
1. When the environment is used by only one function
2. When simply passing an argument would be clearer
3. When the environment needs to change frequently (consider the State monad)

### Reader vs. passing parameters

| | Passing parameters | Reader |
|---|---|---|
| Explicitness | Spelled out in every function | Injected only at `run` |
| Boilerplate | High (intermediate functions pass it along too) | Low |
| Testing | Pass a mock to every function | Inject a mock at `run` |
| Readability | Intuitive | Concise once you're used to it |

## Related documents

**Similar types:**
- [State](./State.md) - a state-transformation monad (for when the environment itself changes)
- [Writer](./Writer.md) - a monad for tracking output

**Type classes it uses:**
- [Functor](./Functor.md)
- [Apply](./Applicative.md) - `ap` is documented under Applicative
- [Applicative](./Applicative.md)
- [Chain](./Monad.md) - `chain` is documented under Monad
- [Monad](./Monad.md)

**Used together with:**
- [Task](./Task.md) - combining asynchronous work with Reader (the Reader Task pattern)
