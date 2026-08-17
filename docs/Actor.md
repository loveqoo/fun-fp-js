# Actor

메시지를 **순차 처리**하는 가벼운 상태 컨테이너

## 개념

Actor는 상태 하나와 메시지 큐 하나를 가집니다. 메시지가 아무리 몰려와도 **한 번에 하나씩,
보낸 순서대로** 처리되므로 상태 갱신에 경쟁 조건이 생기지 않습니다.

```
handle : (state, msg) -> [result, newState]
       | (state, msg) -> Task [result, newState]     // 비동기도 가능
```

`send`는 [Task](./Task.md)를 돌려주므로 결과를 기다리거나 다른 Task와 합성할 수 있습니다.
**핵심은 `handle`이 비동기여도 다음 메시지가 끼어들지 않는다**는 점입니다.

## 왜 Actor인가?

### 문제: 비동기 갱신이 겹치면 상태가 깨진다

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

읽기와 쓰기 사이에 `await`가 있으면 그 틈으로 다른 실행이 들어옵니다. 락을 걸거나 큐를
직접 만들어야 합니다.

### 해결: 메시지를 큐에 넣고 하나씩 처리한다

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

## 생성

`Actor({ init, handle })` — `handle`은 `[결과, 새상태]` 튜플을 돌려줍니다. 비동기라면
그 튜플을 담은 **Promise 나 Task** 를 돌려주면 됩니다(`Free.api` 해석기 핸들러와 같은
관용도라, `it.run(program).then(v => [v, 새상태])` 를 그대로 넘길 수 있습니다). 어느
경로든 튜플이 아닌 것을 내면 같은 문안으로 거부되고 큐는 계속 돕니다.

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

결과와 상태는 **달라도 됩니다.** 상태는 누적하고 결과는 다른 것을 돌려줄 수 있습니다.

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

`handle`이 함수가 아니면 즉시 `TypeError`가 납니다.

```javascript
const { Actor } = FunFP;

try {
    Actor({ init: 0, handle: 'not a function' });
} catch (e) {
    console.log(e.constructor.name);  // TypeError
}
```

## 주요 연산

### send - 메시지 보내기

Task를 돌려줍니다. 지연 실행이 아니라 **큐에 즉시 들어가고**, Task는 그 결과를 받는
통로입니다.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const echo = Actor({ init: null, handle: (_, msg) => [`echo: ${msg}`, msg] });

console.log(await run(echo.send('hello')));  // 'echo: hello'
console.log(echo.getState());                // 'hello'
```

### getState - 현재 상태 읽기

동기 함수입니다. 큐에 남은 메시지가 있으면 아직 반영되지 않은 상태를 봅니다.

```javascript
const { Actor } = FunFP;

const run = task => new Promise((resolve, reject) => task.fork(reject, resolve));

const acc = Actor({ init: 0, handle: (s, m) => [s + m, s + m] });

const pending = acc.send(10);
await run(pending);

console.log(acc.getState());  // 10
```

### subscribe - 상태 변화 구독

메시지가 처리될 때마다 `(result, newState)`로 호출됩니다. 반환값은 **구독 해제 함수**입니다.

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

console.log(log);                 // 두 건만
console.log(counter.getState());  // 6 — 상태는 그대로 갱신됨
```

구독자가 함수가 아니면 `TypeError`입니다.

```javascript
const { Actor } = FunFP;

const a = Actor({ init: 0, handle: (s, m) => [s, s] });

try {
    a.subscribe(42);
} catch (e) {
    console.log(e.constructor.name);  // TypeError
}
```

## 비동기 handle

`handle`이 Task를 돌려주면 Actor는 그것이 끝날 때까지 **다음 메시지를 처리하지 않습니다.**
이것이 Actor의 핵심 보장입니다.

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

## 에러 처리

`handle`이 던지거나 Task가 실패하면 **해당 메시지의 Task만 reject되고, 큐는 계속 돕니다.**
하나가 실패해도 액터가 멈추지 않습니다.

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
    console.log('실패:', e.message);       // '음수는 안 됨: -1'
}

// 실패 뒤에도 큐는 정상 동작한다
console.log(await run(strict.send(5)));    // 15
console.log(strict.getState());            // 15
```

실패한 메시지는 **상태를 바꾸지 않습니다** — 위에서 `-1` 처리 후에도 상태는 10이었습니다.

## 실용적 예시

### 1. 요청 순서를 보장하는 카운터

여러 곳에서 동시에 증가시켜도 값이 유실되지 않습니다.

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

### 2. 상태 머신

메시지를 이벤트로, 상태를 현재 단계로 두면 상태 머신이 됩니다.

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

### 3. 구독으로 상태 변화 중계하기

`subscribe`는 로깅·감사·UI 갱신처럼 상태를 바꾸지 않는 관심사를 분리하는 데 씁니다.

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

### 4. 직렬화가 필요한 외부 호출 감싸기

동시에 호출하면 안 되는 자원(파일 핸들, 단일 연결, 속도 제한 API)을 액터 뒤에 두면
호출부는 자유롭게 호출해도 됩니다.

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

## 관련 타입 클래스

- [Task](./Task.md) - `send`가 Task를 돌려줍니다. `map`/`chain`으로 다른 비동기 흐름과
  합성하거나 `Task.all`로 묶을 수 있습니다.
- [State](./State.md) - `handle`의 `(state, msg) -> [result, newState]` 형태는 State 모나드의
  `s -> [a, s]`와 같은 모양입니다. Actor는 여기에 큐와 순차 실행 보장을 더한 것입니다.
- [StateT](./StateT.md) - 상태 전이에 다른 효과(실패·비동기)를 섞어야 하는데 액터의 큐는
  필요 없다면 StateT 쪽이 맞습니다.
