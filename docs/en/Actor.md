# Actor

> 한국어: [../Actor.md](../Actor.md)

A lightweight stateful container that processes messages **sequentially**

## Concept

An Actor holds one piece of state and one message queue. No matter how many messages
arrive at once, they are processed **one at a time, in the order sent**, so state
updates never race.

```
handle : (state, msg) -> [result, newState]
       | (state, msg) -> Task [result, newState]     // async is also possible
```

`send` returns a [Task](./Task.md), so you can wait on the result or compose it with
other Tasks. **The key guarantee is that even when `handle` is async, no other
message can cut in ahead of it.**

## Why Actor?

### Problem: overlapping async updates corrupt state

```javascript no-run problem scenario — deliberately bad code
let balance = 100;

async function withdraw(amount) {
    const current = balance;          // read
    await checkFraud(amount);         // ← another request cuts in here
    balance = current - amount;       // overwrites with a stale value
}

// if you call it twice concurrently
await Promise.all([withdraw(30), withdraw(50)]);
// balance ends up 50 or 70 instead of 20 — depends on which write lands last
```

Whenever there is an `await` between a read and a write, another execution can slip
into that gap. You would have to add a lock or build a queue yourself.

### Solution: put messages on a queue and process them one at a time

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const account = Actor({
    init: 100,
    handle: (balance, msg) => {
        if (msg.type === 'withdraw') {
            const next = balance - msg.amount;
            return [next, next];
        }
        return [balance, balance];
    }
});

// processed in order even when sent concurrently
await Promise.all([
    run(account.send({ type: 'withdraw', amount: 30 })),
    run(account.send({ type: 'withdraw', amount: 50 }))
]);

console.log(account.getState());  // 20 — always
```

## Creation

`Actor({ init, handle, notifyInOrder, timeout })`: `handle` returns a `[result, newState]`
tuple. If it is asynchronous, return a **Promise or Task** wrapping that same tuple (this
matches the idiom used by `Free.api` interpreter handlers, so you can pass
`it.run(program).then(v => [v, newState])` directly). Whichever path is taken, returning
anything other than a tuple is rejected with the same message and the queue keeps
turning.

### Two optional settings

| Option | Default | What it does |
| --- | --- | --- |
| `notifyInOrder` | `true` | Subscribers are notified **in message order** |
| `timeout` | `1000` | If a single handler exceeds this many milliseconds, that message is rejected and the queue moves on |

**`timeout` prevents silent stalls.** If a handler never settles, the queue would be
stuck forever and even the Tasks for later messages would never arrive. Once the
deadline passes, that message arrives as a rejection carrying a `timedOut === true`
marker, **the state is not carried over**, and any late-arriving result is discarded.
For handlers where a long run is expected and normal, turn this off with
`timeout: Infinity`.

```javascript
const { Actor } = FunFP;

const slow = Actor({
    init: 0,
    timeout: 30,
    handle: () => new Promise(() => {}),   // never settles
});

slow.send('stuck').fork(
    e => console.log(e.message, '/ marker:', e.timedOut),   // Actor: handle timed out after 30ms / marker: true
    () => console.log('succeeded unexpectedly')
);
```

**In environments without a timer, expiry takes effect at the next boundary.** Google
Apps Script has no `setTimeout`. In such environments there is no way to wake up at the
exact deadline instant, so the deadline is checked and expired at the **next queue
boundary** (when a new message arrives or the queue advances to the next item). This is the
same semantics as [cooperative cancellation](./Free.md#api) in `Free.api`. If nothing
happens, the expiry is delayed accordingly.

```javascript
const { Actor } = FunFP;

const counter = Actor({
    init: 0,
    handle: (state, msg) => {
        const next = state + msg;
        return [next, next];   // [value returned to caller, next state]
    }
});

console.log(counter.getState());  // 0
```

Result and state **are allowed to differ.** State can accumulate while the result
returns something else entirely.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const collector = Actor({
    init: [],
    handle: (items, msg) => {
        const next = [...items, msg];
        return [next.length, next];   // result is the count, state is the list
    }
});

console.log(await run(collector.send('a')));  // 1
console.log(await run(collector.send('b')));  // 2
console.log(collector.getState());            // ['a', 'b']
```

If `handle` is not a function, a `TypeError` is thrown immediately.

```javascript
const { Actor } = FunFP;

try {
    Actor({ init: 0, handle: 'not a function' });
} catch (e) {
    console.log(e.constructor.name);  // TypeError
}
```

## Main operations

### send - sending a message

Returns a Task. It is not deferred execution: the message **enters the queue
immediately**, and the Task is only the channel through which you receive the result.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const echo = Actor({ init: null, handle: (_, msg) => [`echo: ${msg}`, msg] });

console.log(await run(echo.send('hello')));  // 'echo: hello'
console.log(echo.getState());                // 'hello'
```

### getState - reading the current state

A synchronous function. If messages remain queued, you see state that hasn't been
updated by them yet.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const acc = Actor({ init: 0, handle: (s, m) => [s + m, s + m] });

const pending = acc.send(10);
await run(pending);

console.log(acc.getState());  // 10
```

### subscribe - subscribing to state changes

Called with `(result, newState)` every time a message is processed. The return value is
an **unsubscribe function**.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const counter = Actor({ init: 0, handle: (s, m) => [s + m, s + m] });

const log = [];
const unsubscribe = counter.subscribe((result, state) => {
    log.push(`result ${result}, state ${state}`);
});

await run(counter.send(1));
await run(counter.send(2));

unsubscribe();
await run(counter.send(3));   // no longer recorded

console.log(log);                 // [ 'result 1, state 1', 'result 3, state 3' ]   only two entries
console.log(counter.getState());  // 6 — state is still updated as normal
```

If the subscriber is not a function, a `TypeError` is thrown.

```javascript
const { Actor } = FunFP;

const a = Actor({ init: 0, handle: (s, m) => [s, s] });

try {
    a.subscribe(42);
} catch (e) {
    console.log(e.constructor.name);  // TypeError
}
```

## Async handle

When `handle` returns a Task, the Actor **does not process the next message** until it
finishes. This is Actor's core guarantee.

```javascript
const { Actor, Task } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const delay = (ms, value) => new Task((reject, resolve) => {
    setTimeout(() => resolve(value), ms);
});

const order = [];
const slow = Actor({
    init: 0,
    handle: (state, msg) => {
        // order is preserved even though the earlier message takes longer
        const ms = msg === 'first' ? 30 : 1;
        return delay(ms, null).map(() => {
            order.push(msg);
            return [msg, state + 1];
        });
    }
});

await Promise.all([run(slow.send('first')), run(slow.send('second'))]);

console.log(order);              // ['first', 'second'] — same order as sent
console.log(slow.getState());    // 2
```

## Error handling

If `handle` throws, or its Task fails, **only that message's Task is rejected, and the
queue keeps going.** One failure does not stop the actor.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const strict = Actor({
    init: 0,
    handle: (state, msg) => {
        if (msg < 0) throw new Error(`negative not allowed: ${msg}`);
        return [state + msg, state + msg];
    }
});

console.log(await run(strict.send(10)));   // 10

try {
    await run(strict.send(-1));
} catch (e) {
    console.log('failed:', e.message);       // failed: negative not allowed: -1
}

// the queue still works normally after a failure
console.log(await run(strict.send(5)));    // 15
console.log(strict.getState());            // 15
```

A failed message **does not change state**. After processing `-1` above, the state
was still 10.

## Practical examples

### 1. A counter that guarantees request order

Concurrent increments from many places never lose a count.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const counter = Actor({
    init: { count: 0, history: [] },
    handle: (state, delta) => {
        const next = {
            count: state.count + delta,
            history: [...state.history, delta]
        };
        return [next.count, next];
    }
});

// 100 concurrent requests
await Promise.all(Array.from({ length: 100 }, () => run(counter.send(1))));

console.log(counter.getState().count);            // 100 — exactly
console.log(counter.getState().history.length);   // 100
```

### 2. A state machine

Treat messages as events and state as the current phase, and you get a state machine.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const transitions = {
    idle: { start: 'running' },
    running: { pause: 'paused', finish: 'done' },
    paused: { resume: 'running', finish: 'done' },
    done: {}
};

const machine = Actor({
    init: 'idle',
    handle: (state, event) => {
        const next = transitions[state][event];
        if (!next) throw new Error(`cannot '${event}' from state ${state}`);
        return [next, next];
    }
});

console.log(await run(machine.send('start')));   // 'running'
console.log(await run(machine.send('pause')));   // 'paused'

try {
    await run(machine.send('start'));            // not possible from paused
} catch (e) {
    console.log(e.message);
}

console.log(await run(machine.send('resume')));  // 'running'
console.log(await run(machine.send('finish')));  // 'done'
```

### 3. Relaying state changes through subscribe

`subscribe` is for separating concerns that observe state without changing it, such as
logging, auditing, or UI updates.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const cart = Actor({
    init: { items: [], total: 0 },
    handle: (state, item) => {
        const next = {
            items: [...state.items, item.name],
            total: state.total + item.price
        };
        return [next.total, next];
    }
});

const auditLog = [];
cart.subscribe((total, state) => {
    auditLog.push(`${state.items[state.items.length - 1]} added → total ${total}`);
});

await run(cart.send({ name: 'book', price: 15000 }));
await run(cart.send({ name: 'pen', price: 2000 }));

console.log(auditLog);
console.log(cart.getState().total);  // 17000
```

### 4. Wrapping an external call that needs serialization

Put a resource that must not be called concurrently (a file handle, a single
connection, a rate-limited API) behind an actor, and callers can call it freely.

```javascript
const { Actor, Task } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

// a hypothetical resource that cannot tolerate concurrent calls
let inFlight = 0;
const fragileWrite = line => new Task((reject, resolve) => {
    inFlight++;
    if (inFlight > 1) { reject(new Error('concurrent access detected')); return; }
    setTimeout(() => { inFlight--; resolve(line.length); }, 5);
});

const writer = Actor({
    init: 0,
    handle: (written, line) => fragileWrite(line).map(n => [n, written + n])
});

// even sending five lines at once, the actor serializes them
const sizes = await Promise.all(
    ['a', 'bc', 'def', 'g', 'hijk'].map(s => run(writer.send(s)))
);

console.log(sizes);                // [1, 2, 3, 1, 4]
console.log(writer.getState());    // 11 — accumulated byte count
```

## Related type classes

- [Task](./Task.md) - `send` returns a Task. You can compose it with other async flows
  via `map`/`chain`, or gather several with `Task.all`.
- [State](./State.md) - `handle`'s `(state, msg) -> [result, newState]` shape is the same
  shape as the State monad's `s -> [a, s]`. Actor adds a queue and a sequential-execution
  guarantee on top of that.
- [StateT](./StateT.md) - If state transitions need other effects mixed in (failure,
  async) but you don't need the actor's queue, StateT is the better fit.
