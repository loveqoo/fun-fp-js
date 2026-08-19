# Free

> 한국어: [../Free.md](../Free.md)

**Free represents a program as data. How to run it is decided later, by the user.**

Separating *what to do* (the program) from *how to do it* (the interpreter) lets a
user run the same program in production, against a mock, or just to inspect the plan,
in several different ways. This document leads with what you need to use it, and saves
the internal structure for Floor 3. Reading Floor 1 alone is enough to use `Free.api`.

---

## Floor 1 — starting with `Free.api` {#api}

You don't need to know Free itself. You declare the names of your commands (a
vocabulary), build a program with the familiar `chain`/`map`, and wire up an
interpreter to run it.

```javascript
const { Free, Task } = FunFP;

// ① 어휘 선언 — 바깥세상에 요청할 것들의 이름
const api = Free.api('getUser', 'getPosts', 'saveUser');

// ② 프로그램 — 이 시점엔 아무것도 실행되지 않는다
const program = api.getUser(1)
    .chain(user => api.getPosts(user.id)
        .chain(posts => api.saveUser({ name: user.name, count: posts.length })))
    .map(saved => '저장: ' + saved.name + '/' + saved.count);

// ③ 해석기 — 핸들러는 인자를 그대로 받고, 값 | Promise | Task 아무거나 반환한다
const db = { users: { 1: { id: 1, name: 'anthony' } }, posts: { 1: [{}, {}] } };
const real = api.interpreter({
    getUser: id => Promise.resolve(db.users[id]),
    getPosts: userId => Task.of(db.posts[userId]),
    saveUser: user => user,
});

// ④ 실행
real.run(program).then(r => {
    if (r !== '저장: anthony/2') throw new Error('실전 해석이 틀렸다: ' + r);
    console.log(r);                       // 저장: anthony/2
});
```

If you're used to object-oriented thinking, here is one way to read this: `Free.api` is
an interface declaration, and the interpreter is dependency injection of an
implementation. The one difference is that in OO, calling through an interface executes
immediately, while in Free the call information stays behind as data (the program), so
the user can choose a different implementation every time they run it.

You can build as many interpreters as you like. The payoff of this separation is that
the same program runs, unchanged, in different environments.

```javascript
const { Free } = FunFP;

const api = Free.api('getUser', 'getPosts');
const program = api.getUser(1).chain(u => api.getPosts(u.id).map(p => u.name + ':' + p.length));

const mock = api.interpreter({ getUser: () => ({ id: 0, name: 'MOCK' }), getPosts: () => [] });
mock.run(program).then(r => {
    if (r !== 'MOCK:0') throw new Error('mock 해석이 틀렸다: ' + r);
    console.log(r);                       // MOCK:0 — 테스트가 곧 해석기 교체다
});
```

---

## Floor 2 — a bit further along

### A program is a value

What `api.x(...)` returns is an ordinary value. You can hold it in a variable, wrap it
in a function, or run it again as many times as you want. For a large program,
splitting it into stages with `Free.pipeK` lets it read top to bottom.

```javascript
const { Free } = FunFP;

const api = Free.api('fetch', 'log');
const step1 = () => api.fetch('/users/1');
const step2 = user => api.log('이름: ' + user.name).map(() => user);
const pipeline = Free.pipeK(step1, step2);   // 단계별 거시 구조

const it = api.interpreter({ fetch: path => ({ name: 'kim', path }), log: msg => msg });
it.run(pipeline()).then(r => {
    if (r.name !== 'kim') throw new Error('pipeK 단계가 어긋났다');
    console.log(r.name);                  // kim
});
```

### Viewing the plan — "what it would do," without running it

Wire up an interpreter that only records instead of executing, and you can inspect what
a program would do, as data, before ever running it for real. This isn't a separate
feature — it's just one use of swapping the interpreter.

```javascript
const { Free } = FunFP;

const api = Free.api('scan', 'fire');
const program = api.scan().chain(danger => danger ? api.fire() : Free.of('대기'));

const steps = [];
const plan = api.interpreter({
    scan: () => { steps.push('scan'); return true; },   // 가짜 상황을 주입하면
    fire: () => { steps.push('fire'); return '발사'; },  // 그 경로가 펼쳐진다
});
plan.run(program).then(() => {
    if (steps.join(',') !== 'scan,fire') throw new Error('계획이 다르다: ' + steps);
    console.log(steps);                   // ['scan', 'fire']
});
```

### Multiple apis in one program — `Free.interpreters`

Even when each module declares its own vocabulary separately, programs can already mix
them — every api's program is the same Free value, so `chain` simply links them
together. Only execution is where things stop: an interpreter only knows its own
vocabulary. `Free.interpreters` merges several interpreters into one. Each command
looks at its own api's tag to pick the right registry, so commands with the same name
never get mixed up, and registering two interpreters for the same api throws
immediately at construction time.

```javascript
const { Free } = FunFP;

const db = Free.api('load');
const mail = Free.api('send');

// 두 api 를 섞은 프로그램 — 구성은 chain 이 그냥 잇는다
const program = db.load('u1').chain(user => mail.send(user + '에게 인사'));

// 실행은 여러 명부를 아는 문지기가 맡는다
const it = Free.interpreters(
    db.interpreter({ load: k => '유저:' + k }),
    mail.interpreter({ send: msg => '발송:' + msg })
);
it.run(program).then(r => {
    if (r !== '발송:유저:u1에게 인사') throw new Error('라우팅이 틀렸다: ' + r);
    console.log(r);   // 발송:유저:u1에게 인사
});
```

The result of merging is itself an interpreter, so you can merge it again; and a
command for an api that appears in none of the merged registries is rejected with the
same message as a single interpreter would give (`no handler for '<name>'`). If some
other api happens to use that same name, the message gets an added clause — meaning the
interpreter that owns that command simply isn't part of this merge.

### Cancelling a run — `start`

`run` only returns the result, but `start` also hands back a handle for stopping the
run partway through. Calling `cancel()` halts execution **at the next command
boundary** — a handler already in flight is allowed to finish, but its result is
discarded (and any pure step that would follow it never runs), and remaining commands
never start. A cancelled run arrives as a rejection carrying the message
`'Free.api.run: cancelled'` and a `cancelled === true` marker, so callers can
distinguish a genuine failure from a cancellation by checking one field. Calling
`cancel` on a run that has already finished does nothing, and a program that completes
synchronously never has a window in which it can be cancelled. If a cancellation and an
in-flight failure happen to overlap, **the failure arrives as-is** — cancellation only
blocks what hasn't happened yet; it does not change a result that has already occurred.

```javascript
const { Free } = FunFP;

const api = Free.api('step');
const calls = [];
const it = api.interpreter({
    step: n => { calls.push(n); return new Promise(res => setTimeout(() => res(n), 20)); },
});
const program = api.step(1).chain(() => api.step(2)).chain(() => api.step(3));

const h = it.start(program);
setTimeout(h.cancel, 30);          // 2단계 비행 중에 취소
h.promise.then(
    () => { throw new Error('취소됐어야 한다'); },
    e => {
        if (e.cancelled !== true) throw new Error('취소 표식이 없다: ' + e.message);
        if (calls.join(',') !== '1,2') throw new Error('3단계가 실행됐다: ' + calls);
        console.log('취소됨, 실행된 단계:', calls);   // 취소됨, 실행된 단계: [ 1, 2 ]
    });
```

Two cautions. If your own code manually constructs an error carrying `cancelled: true`,
this distinction breaks down, so don't do that. And cancellation **does not itself
interrupt an in-flight request** — that's the handler's job; if you need it, you wire a
handler's `AbortController` together with `cancel` yourself (it is not wired up
automatically).

### Using it together with Reader, Writer, and State

In a Free program, real side effects happen only inside the interpreter. But the pure
computation that happens between effects still comes in three flavors — configuration
injected from outside, state carried from step to step, and a log that only ever
accumulates. [Reader](./Reader.md), [State](./State.md), and [Writer](./Writer.md)
handle these three, respectively.

| Need | Tool | Nature |
| --- | --- | --- |
| Inject config | [Reader](./Reader.md) | Pure — reads only |
| Keep state | [State](./State.md) | Pure — reads, writes, and threads it through |
| Accumulate a log | [Writer](./Writer.md) | Pure — only stacks up as a value |
| Real side effects | Vocabulary commands + interpreter | The only impure spot — which is exactly why it's swappable |

The example below processes a single order. The program only describes looking up a
price and charging for it; in the pure stretch where the looked-up price is already in
hand, Reader injects the discount rate, State threads the running total starting from
zero, and Writer records the process. Both the logging that shows up on screen and the
money that actually moves happen only inside the interpreter.

```javascript
const { Free, Reader, Writer, State } = FunFP;

// 어휘 — 바깥세상에 요청할 것: 가격 조회와 결제
const api = Free.api('fetchPrice', 'charge');

// Reader — 할인가 계산은 설정(discount)에 의존한다
const discounted = base => Reader.asks(cfg => Math.round(base * (1 - cfg.discount)));

// State — 합계는 0에서 시작해 가격을 하나씩 더해 잇는다
const totalOf = prices => prices
    .reduce((st, p) => st.chain(() => State.modify(t => t + p)), State.of(null))
    .exec(0);

// Writer — 계산 과정을 로그 값으로 쌓는다. 이 시점엔 화면에 아무것도 찍히지 않는다
const journal = (names, prices, total) => names
    .reduce((w, name, i) => w.chain(() => Writer.tell([`${name}: ${prices[i]}원`])), Writer.of(null))
    .chain(() => Writer.tell([`합계: ${total}원`]))
    .exec();

// 프로그램 — 효과는 서술만 하고, 순수 계산은 세 타입이 나눠 맡는다
const buy = (names, cfg) =>
    api.fetchPrice(names[0]).chain(b1 =>
    api.fetchPrice(names[1]).map(b2 => [b1, b2]))
        .map(bases => {
            const prices = bases.map(b => discounted(b).run(cfg));  // Reader 실행: 설정을 넣는 순간
            const total = totalOf(prices);                          // State 실행: 초기 상태 0
            return { total, log: journal(names, prices, total) };   // Writer 실행: 로그 회수
        })
        .chain(({ total, log }) => api.charge(total).map(receipt => ({ receipt, log })));

// 해석기 — 실제 동작은 여기서만 일어난다
const priceDb = { 책: 12000, 펜: 3000 };
const shop = api.interpreter({
    fetchPrice: name => Promise.resolve(priceDb[name]),
    charge: amount => ({ paid: amount }),
});

shop.run(buy(['책', '펜'], { discount: 0.1 })).then(r => {
    if (r.receipt.paid !== 13500) throw new Error('합계가 틀렸다: ' + r.receipt.paid);
    if (r.log.join('/') !== '책: 10800원/펜: 2700원/합계: 13500원') throw new Error('기록이 틀렸다: ' + r.log);
    console.log(r.log);   // ['책: 10800원', '펜: 2700원', '합계: 13500원']
});
```

Change the config to `{ discount: 0.5 }` and the same program charges 6750 — because
the config lives outside the program. `exec` means the same thing for both State and
Writer: it returns the computation's byproduct (the final state, the log).

### Rules — failing loudly, not quietly

| When | What | Result |
| --- | --- | --- |
| Building `interpreter(handlers)` | Missing handler / a name not in the vocabulary (typo) | Throws immediately, naming the offender |
| During `run` | A command from a different `Free.api` gets mixed in | Rejected with `no handler for '<name>'` |
| During `run` | The handler throws / its Promise rejects | Rejected as-is — never swallowed |

**Rejections leak through steps taken after an async boundary, too.** The first step
turns whatever the `Promise` constructor throws into a rejection for you, but a step
that follows after an async command finishes is on its own outside that — so the
runner wraps each step separately. Without that wrapping, the exception would vanish
somewhere no one can catch it.

```javascript
const { Free } = FunFP;

const api = Free.api('step');
const it = api.interpreter({
    step: n => n === 2
        ? Promise.reject(new Error('두 번째 걸음에서 터짐'))
        : Promise.resolve('ok')
});

it.run(api.step(1).chain(() => api.step(2)))
    .then(() => console.log('삼켜졌다'))
    .catch(e => console.log(e.message));   // '두 번째 걸음에서 터짐'
```

A command name is safe even when it matches a prototype name like `toString` — the
vocabulary, command, and handler tables are all prototype-less objects and only look at
their own properties.

```javascript
const { Free } = FunFP;

const api = Free.api('toString', 'hasOwnProperty');
const it = api.interpreter({ toString: () => 'T', hasOwnProperty: () => 'H' });

it.run(api.toString()).then(v => console.log(v));         // 'T'
it.run(api.hasOwnProperty()).then(v => console.log(v));   // 'H'
```

The argument a handler receives is
exactly what was passed at the call site (positional arguments). If you need to
validate the shape of a return value, do it in a pure step of the program
(`.map(v => …validate…)`) or inside the handler yourself — the library doesn't know what
counts as valid, because that's up to each domain.

---

## Floor 3 — internals: Free itself

From here on this is `Free.api`'s internal structure. None of it is needed to use
`Free.api` — read it only if you want to know how it works underneath.

### Pure / Impure — Free's two constructors

Every Free value is one of two things, holding the same standing as `Maybe`'s
`Just`/`Nothing`.

```javascript no-run 구조·API 표기
Pure(value)      // 잎: 완료된 값.       Free.of / Free.pure 가 만든다
Impure(functor)  // 가지: 다음 연산을 담은 명령 함자. Free.liftF / Free.impure 가 만든다
```

`Free.api`'s programs, the internals of all four transformers (`StateT`, `EitherT`,
`ReaderT`, `WriterT`), and the trampoline below are all built from just these two
constructors. Runners walk this tree with `isPure`/`isImpure` to interpret it.

### Three runners — all curried

```javascript no-run 구조·API 표기
Free.runSync(runner)(program)      // 동기. runner 가 명령을 받아 값(또는 다음 Free)을 반환
Free.runAsync(runner)(program)     // Promise 반환. runner 가 값 또는 Promise 반환
Free.runWithTask(runner)(program)  // Promise 반환. runner 가 Task 반환 — Free.api.run 의 바닥
```

### liftF and custom command functors — what `Free.api` does for you

`liftF` requires the command to be a Functor (a `map` that composes continuations, plus
an internal symbol). `Free.api` builds a law-abiding command functor internally to
satisfy that requirement on your behalf. The only time a user needs to build a command
functor by hand is the special case where a command must be a functor with its own
logic.

```javascript no-run 내부 심볼 노출 — 특수한 경우의 문이며, 보통은 Free.api 를 쓴다
const FunctorSymbol = Symbol.for('fun-fp-js/Functor');
class GetUser {
    constructor(id, next) { this.id = id; this.next = next; }        // 연속(next)을 나른다
    map(f) { return new GetUser(this.id, x => f(this.next(x))); }    // map 이 연속을 합성해야 법칙이 선다
}
GetUser.prototype[FunctorSymbol] = true;
const getUser = id => Free.liftF(new GetUser(id, x => x));
// 해석: Free.runWithTask(cmd => fetchUser(cmd.id).map(cmd.next))(getUser(1).chain(...))
```

### Thunk and trampoline — stack-safe recursion

`trampoline` is a function that comes pre-defined as
`Free.runSync(thunk => thunk.run())`. It runs deep recursion without consuming stack.

```javascript
const { Free, trampoline } = FunFP;
const { Thunk } = Free;

const sum = n => {
    const go = (n, acc) => n <= 0 ? Thunk.done(acc) : Thunk.suspend(() => go(n - 1, acc + n));
    return trampoline(go(n, 0));
};
if (sum(10000) !== 50005000) throw new Error('trampoline 이 틀렸다');
console.log(sum(10000));   // 50005000 — 스택 오버플로 없음

const fib = n => {
    const go = (n, a, b) => n <= 0 ? Thunk.done(a) : Thunk.suspend(() => go(n - 1, b, a + b));
    return trampoline(go(n, 0, 1));
};
console.log(fib(100));     // 354224848179262000000
```

### Registered instances

Free is registered with all five of `Functor`/`Apply`/`Applicative`/`Chain`/`Monad`
under the name `'free'`. The law tests verify all five of these instances.

```javascript
const { Free, Functor, Chain } = FunFP;

console.log(Functor.lookup('free').map(x => x + 1, Free.pure(5)).value);              // 6
console.log(Chain.lookup('free').chain(x => Free.pure(x * 2), Free.pure(5)).value);   // 10
```

---

## API reference

| Form | Level | What |
| --- | --- | --- |
| `Free.api(...names)` | Floor 1 | Declares a vocabulary → a bundle of command functions + `interpreter(handlers)` → `{ run, start }` |
| `interpreter.start(program)` | Floor 2 | A cancellation handle `{ promise, cancel }` — takes effect at the next command boundary |
| `Free.interpreters(...its)` | Floor 2 | Merges several apis' interpreters into one — routes by tag |
| `Free.pipeK(...fns)` / `composeK` | Floor 2 | Kleisli step composition |
| `Free.of` / `Free.pure(value)` | Floor 3 | Constructs `Pure` |
| `Free.liftF(functor)` / `Free.impure(functor)` | Floor 3 | Command functor → `Impure` |
| `Free.isPure` / `isImpure` / `isFree` | Floor 3 | Variant checks |
| `Free.runSync/runAsync/runWithTask(runner)(p)` | Floor 3 | Runners — all curried |
| `Free.Thunk` · `trampoline` | Floor 3 | Stack-safe recursion |

## Related type classes

- **[Functor](./Functor.md)** — `map` · **[Chain](./Monad.md)** — `chain` ·
  **[Monad](./Monad.md)** — the full sequencing pattern
- All four transformers are built on top of Free. Start with the
  [StateT](./StateT.md) document.
