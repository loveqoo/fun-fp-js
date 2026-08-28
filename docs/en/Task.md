# Task

> 한국어: [../Task.md](../Task.md)

**A type for handling asynchronous computation purely**

## Concept

Task represents a **deferred asynchronous computation**. It resembles a Promise, but:

- **Deferred execution**: it does not run when created, only when `fork` is called
- **Purity**: forking the same Task multiple times runs it fresh every time
- **Cancellability**: dropping the reference is enough (before it has started running)

## Why Task?

### The problem: Promise runs immediately

```javascript
// A Promise runs immediately upon creation!
const promise = new Promise((resolve) => {
    console.log('ran!');  // ran!   runs the moment it's created
    resolve(42);
});
// prints 'ran!' even though nothing else runs
```

### The fix: Task defers execution

```javascript
const task = new Task((reject, resolve) => {
    console.log('ran!');  // ran!   but only prints after fork is called
    resolve(42);
});
// nothing is printed

task.fork(console.error, console.log);  // 42   only now does the line above print, and the value arrives
```

## Construction

```javascript no-run signature/pseudocode notation
import FunFP from 'fun-fp-js';
const { Task } = FunFP;

// Basic creation
const task = new Task((reject, resolve) => {
    setTimeout(() => resolve(42), 1000);
});

// Immediate success
const success = Task.of(42);

// Immediate failure
const failure = Task.rejected('error');

// Converting from a Promise
const fetchTask = Task.fromPromise(
    url => fetch(url).then(r => r.json())
);
const task = fetchTask('/api/data');

// Converting from an Either
const fromEither = Task.fromEither(Either.Right(42));  // Task.of(42)
```

## Running it (fork)

```javascript
const task = Task.of(42);

task.fork(
    error => console.error('Error:', error),  // failure callback
    value => console.log('Success:', value)   // Success: 42
);
// 'Success: 42'
```

## Main operations

### map - transforming the value (Functor)

```javascript
Task.of(5)
    .map(x => x * 2)
    .fork(console.error, console.log);
// 10
```

### chain - sequential execution (Monad)

```javascript
const fetchUser = id => Task.fromPromise(() => 
    fetch(`/api/users/${id}`).then(r => r.json())
)();

const fetchPosts = userId => Task.fromPromise(() =>
    fetch(`/api/users/${userId}/posts`).then(r => r.json())
)();

fetchUser(1)
    .chain(user => fetchPosts(user.id))
    .map(posts => posts.length)
    .fork(
        err => console.error('Error:', err),
        count => console.log('Post count:', count)
    );
```

### Task.all - running in parallel

```javascript
const tasks = [
    Task.of(1),
    Task.of(2),
    Task.of(3)
];

Task.all(tasks).fork(
    console.error,
    results => console.log(results)  // [1, 2, 3]
);

// if even one fails, the whole thing fails
const tasksWithError = [
    Task.of(1),
    Task.rejected('oops'),
    Task.of(3)
];

Task.all(tasksWithError).fork(
    err => console.log('Error:', err),  // 'Error: oops'
    console.log
);
```

### Task.race - running as a race

```javascript
const fast = new Task((_, resolve) => 
    setTimeout(() => resolve('fast'), 100)
);
const slow = new Task((_, resolve) => 
    setTimeout(() => resolve('slow'), 500)
);

Task.race([fast, slow]).fork(
    console.error,
    result => console.log(result)  // 'fast'
);
```

## Practical examples

### Wrapping an API call

```javascript
const api = {
    get: url => Task.fromPromise(() =>
        fetch(url).then(r => {
            if (!r.ok) throw new Error(r.statusText);
            return r.json();
        })
    )()
};

// Usage
api.get('/api/users/1')
    .map(user => user.name)
    .fork(
        err => console.error('Failed:', err),
        name => console.log('Name:', name)
    );
```

### Retry logic

```javascript
const fetchUser = id => Task.fromPromise(() => 
    fetch(`/api/users/${id}`).then(r => r.json())
)();
const retry = (task, times) => 
    task.fork === undefined ? task :
    new Task((reject, resolve) => {
        let attempts = 0;
        const attempt = () => {
            task.fork(
                err => {
                    attempts++;
                    if (attempts < times) {
                        console.log(`Retry ${attempts}/${times}`);
                        setTimeout(attempt, 1000);
                    } else {
                        reject(err);
                    }
                },
                resolve
            );
        };
        attempt();
    });

retry(fetchUser(1), 3).fork(console.error, console.log);
```

### Timeout

```javascript
const fetchUser = id => Task.fromPromise(() => 
    fetch(`/api/users/${id}`).then(r => r.json())
)();
const timeout = (ms, task) => Task.race([
    task,
    new Task((reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
    )
]);

timeout(5000, fetchUser(1)).fork(
    err => console.error('Timed out or error:', err),
    user => console.log('User:', user)
);
```

### Sequential execution (series)

```javascript
const sequence = tasks => tasks.reduce(
    (acc, task) => acc.chain(results => 
        task.map(result => [...results, result])
    ),
    Task.of([])
);

const tasks = [
    Task.of(1),
    Task.of(2),
    Task.of(3)
];

sequence(tasks).fork(
    console.error,
    results => console.log(results)  // [ 1, 2, 3 ]   ran sequentially
);
```

### Conditional execution

```javascript
const fetchUser = id => Task.fromPromise(() => 
    fetch(`/api/users/${id}`).then(r => r.json())
)();
const fetchIfNeeded = (cache, id) =>
    cache[id] 
        ? Task.of(cache[id])  // return immediately if cached
        : fetchUser(id);       // otherwise call the API

// if not cached, it goes to a real fetch — this doc's runtime has no server, so it falls into the failure callback
fetchIfNeeded({}, 1).fork(console.error, console.log);
fetchIfNeeded({1: 'cached'}, 1).fork(console.error, console.log);  // cached
```

## Task.lift - exception-safe function lifting

`Task.lift` lifts a multi-argument function into the Task context, and automatically turns thrown exceptions into `Task.rejected`.

### Basic usage

```javascript
const { Task } = FunFP;

// A pure function
const add = (a, b) => a + b;

// Lift into Task
const taskAdd = Task.lift(add);

taskAdd(Task.of(5), Task.of(3)).fork(
    console.error,
    result => console.log(result)
);
// 8

// also supports 3 or more arguments
const sum3 = (a, b, c) => a + b + c;
const taskSum3 = Task.lift(sum3);

taskSum3(Task.of(10), Task.of(20), Task.of(12)).fork(
    console.error,
    result => console.log(result)
);
// 42
```

### Exception safety - the key feature

`Task.lift` catches exceptions thrown inside the function and turns them into `Task.rejected` automatically.

```javascript
const { Task } = FunFP;

// A function that throws
const divide = (a, b) => {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    return a / b;
};

// make it exception-safe with lift
const safeDivide = Task.lift(divide);

// Normal case
safeDivide(Task.of(10), Task.of(2)).fork(
    err => console.error('Error:', err.message),
    result => console.log('Result:', result)
);
// 'Result: 5'

// Exception case - throw is automatically converted to Task.rejected!
safeDivide(Task.of(10), Task.of(0)).fork(
    err => console.error('Error:', err.message),
    result => console.log('Result:', result)
);
// 'Error: Division by zero'

// also handles the case where the Task is already rejected
safeDivide(Task.rejected('Invalid input'), Task.of(2)).fork(
    err => console.error('Error:', err),
    result => console.log('Result:', result)
);
// 'Error: Invalid input'
```

### Practical example: parsing JSON

```javascript
const { Task } = FunFP;

// JSON.parse can throw
const parseJSON = str => JSON.parse(str);

// make it exception-safe with lift
const safeParseJSON = Task.lift(parseJSON);

// Normal case
safeParseJSON(Task.of('{"name": "Alice"}')).fork(
    err => console.error('Parse error:', err.message),
    obj => console.log('Parsed:', obj)
);
// Parsed: { name: 'Alice' }

// Exception case - parsing failure
safeParseJSON(Task.of('invalid json')).fork(
    err => console.error('Parse error:', err.message),
    obj => console.log('Parsed:', obj)
);
// Parse error: Unexpected token i in JSON at position 0
```

### Practical example: transforming an API response

```javascript
const { Task } = FunFP;

// API response transform function (includes validation)
const transformUser = data => {
    if (!data.id) throw new Error('Missing user ID');
    if (!data.email) throw new Error('Missing email');

    return {
        id: data.id,
        email: data.email.toLowerCase(),
        name: data.name || 'Unknown'
    };
};

const safeTransformUser = Task.lift(transformUser);

const fetchUser = id => Task.fromPromise(() =>
    fetch(`/api/users/${id}`).then(r => r.json())
)();

// Pipeline: fetch -> transform
fetchUser(1)
    .chain(data => safeTransformUser(Task.of(data)))
    .fork(
        err => console.error('Error:', err.message),
        user => console.log('User:', user)
    );
// if the data is valid: User: { id: 1, email: '...', name: '...' }
// if validation fails: Error: Missing user ID
```

### When should you use Task.lift?

**Good cases to use it:**
1. Wrapping a function that can throw into a Task
2. Making built-ins like `JSON.parse` or `parseInt` safe
3. Combining several Tasks and applying a pure function to them
4. A transformation function that includes validation logic

**lift vs fromPromise:**
- `Task.lift`: catches exceptions from a synchronous function (`try/catch`)
- `Task.fromPromise`: catches a Promise rejection

```javascript
// Synchronous function -> Task.lift
const parseJSON = Task.lift(str => JSON.parse(str));

// Asynchronous function -> Task.fromPromise
const fetchData = Task.fromPromise(url =>
    fetch(url).then(r => r.json())
);
```

## Task vs Promise

| | Promise | Task |
|---|---|---|
| When it runs | Immediately | When `fork` is called |
| Re-running | Not possible (already completed) | Possible (runs fresh every time) |
| Purity | Has side effects | A pure function |
| Cancellation | Complicated | Simple (drop the reference) |
| Composition | `then` chaining | `map`/`chain` |
| Error handling | `catch` | The first argument to `fork` |

## Related type classes

- **Functor**: provides `map`
- **Apply**: provides `ap`
- **Applicative**: provides `of`
- **Chain**: provides `chain`
- **Monad**: Applicative + Chain
- **Alt**: choosing an alternative value
