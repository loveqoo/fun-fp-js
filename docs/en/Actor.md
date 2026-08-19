# Actor

> 한국어: [../Actor.md](../Actor.md)

A lightweight stateful container that processes messages **sequentially**

## Concept

An Actor holds one piece of state and one message queue. No matter how many messages
arrive at once, they are processed **one at a time, in the order sent**, so state
updates never race.

```
handle : (state, msg) -> [result, newState]
       | (state, msg) -> Task [result, newState]     // 비동기도 가능
```

`send` returns a [Task](./Task.md), so you can wait on the result or compose it with
other Tasks. **The key guarantee is that even when `handle` is async, no other
message can cut in ahead of it.**

## Why Actor?

### Problem: overlapping async updates corrupt state

```javascript no-run 문제 상황 — 일부러 나쁜 코드
let balance = 100;

async function withdraw(amount) {
    const current = balance;          // 읽고
    await checkFraud(amount);         // ← 여기서 다른 요청이 끼어든다
    balance = current - amount;       // 낡은 값으로 덮어쓴다
}

// 동시에 두 번 호출하면
await Promise.all([withdraw(30), withdraw(50)]);
// balance가 20이 아니라 50이나 70이 된다 — 어느 쪽이 마지막에 썼느냐에 달렸다
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

// 동시에 보내도 순서대로 처리된다
await Promise.all([
    run(account.send({ type: 'withdraw', amount: 30 })),
    run(account.send({ type: 'withdraw', amount: 50 }))
]);

console.log(account.getState());  // 20 — 항상
```

## Creation

`Actor({ init, handle, notifyInOrder, timeout })` — `handle` returns a `[result, newState]`
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
    handle: () => new Promise(() => {}),   // 영영 정착하지 않는다
});

slow.send('멈춤').fork(
    e => console.log(e.message, '/ 표식:', e.timedOut),   // Actor: handle timed out after 30ms / 표식: true
    () => console.log('성공해버림')
);
```

**In environments without a timer, expiry takes effect at the next boundary.** Google
Apps Script has no `setTimeout`. In such environments there is no way to wake up at the
exact deadline instant, so the deadline is checked and expired at the **next queue
boundary** (when a new message arrives or the queue advances to the next item) — the
same semantics as [cooperative cancellation](./Free.md#api) in `Free.api`. If nothing
happens, the expiry is delayed accordingly.

```javascript
const { Actor } = FunFP;

const counter = Actor({
    init: 0,
    handle: (state, msg) => {
        const next = state + msg;
        return [next, next];   // [호출자에게 줄 값, 다음 상태]
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
        return [next.length, next];   // 결과는 개수, 상태는 목록
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

Returns a Task. It is not deferred execution — the message **enters the queue
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
    log.push(`결과 ${result}, 상태 ${state}`);
});

await run(counter.send(1));
await run(counter.send(2));

unsubscribe();
await run(counter.send(3));   // 더 이상 기록되지 않는다

console.log(log);                 // [ '결과 1, 상태 1', '결과 3, 상태 3' ]   두 건만
console.log(counter.getState());  // 6 — 상태는 그대로 갱신됨
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
        // 먼저 온 메시지가 더 오래 걸려도 순서는 지켜진다
        const ms = msg === 'first' ? 30 : 1;
        return delay(ms, null).map(() => {
            order.push(msg);
            return [msg, state + 1];
        });
    }
});

await Promise.all([run(slow.send('first')), run(slow.send('second'))]);

console.log(order);              // ['first', 'second'] — 보낸 순서 그대로
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
        if (msg < 0) throw new Error(`음수는 안 됨: ${msg}`);
        return [state + msg, state + msg];
    }
});

console.log(await run(strict.send(10)));   // 10

try {
    await run(strict.send(-1));
} catch (e) {
    console.log('실패:', e.message);       // 실패: 음수는 안 됨: -1
}

// 실패 뒤에도 큐는 정상 동작한다
console.log(await run(strict.send(5)));    // 15
console.log(strict.getState());            // 15
```

A failed message **does not change state** — after processing `-1` above, the state
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

// 100번 동시 요청
await Promise.all(Array.from({ length: 100 }, () => run(counter.send(1))));

console.log(counter.getState().count);            // 100 — 정확히
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
        if (!next) throw new Error(`${state} 상태에서 '${event}' 는 불가능`);
        return [next, next];
    }
});

console.log(await run(machine.send('start')));   // 'running'
console.log(await run(machine.send('pause')));   // 'paused'

try {
    await run(machine.send('start'));            // paused 에서는 불가
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
    auditLog.push(`${state.items[state.items.length - 1]} 추가 → 합계 ${total}`);
});

await run(cart.send({ name: '책', price: 15000 }));
await run(cart.send({ name: '펜', price: 2000 }));

console.log(auditLog);
console.log(cart.getState().total);  // 17000
```

### 4. Wrapping an external call that needs serialization

Put a resource that must not be called concurrently (a file handle, a single
connection, a rate-limited API) behind an actor, and callers can call it freely.

```javascript
const { Actor, Task } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

// 동시 호출을 견디지 못하는 가상의 자원
let inFlight = 0;
const fragileWrite = line => new Task((reject, resolve) => {
    inFlight++;
    if (inFlight > 1) { reject(new Error('동시 접근 감지')); return; }
    setTimeout(() => { inFlight--; resolve(line.length); }, 5);
});

const writer = Actor({
    init: 0,
    handle: (written, line) => fragileWrite(line).map(n => [n, written + n])
});

// 다섯 줄을 한꺼번에 보내도 액터가 직렬화한다
const sizes = await Promise.all(
    ['가', '나다', '라마바', '사', '아자차카'].map(s => run(writer.send(s)))
);

console.log(sizes);                // [1, 2, 3, 1, 4]
console.log(writer.getState());    // 11 — 누적 바이트 수
```

## Related type classes

- [Task](./Task.md) - `send` returns a Task. You can compose it with other async flows
  via `map`/`chain`, or gather several with `Task.all`.
- [State](./State.md) - `handle`'s `(state, msg) -> [result, newState]` shape is the same
  shape as the State monad's `s -> [a, s]`. Actor adds a queue and a sequential-execution
  guarantee on top of that.
- [StateT](./StateT.md) - If state transitions need other effects mixed in (failure,
  async) but you don't need the actor's queue, StateT is the better fit.
