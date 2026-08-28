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

// ① vocabulary declaration — names of what we'll ask the outside world for
const api = Free.api('getUser', 'getPosts', 'saveUser');

// ② program — nothing executes yet at this point
const program = api.getUser(1)
    .chain(user => api.getPosts(user.id)
        .chain(posts => api.saveUser({ name: user.name, count: posts.length })))
    .map(saved => 'saved: ' + saved.name + '/' + saved.count);

// ③ interpreter — handlers receive the argument as-is and return a value | Promise | Task, whichever
const db = { users: { 1: { id: 1, name: 'anthony' } }, posts: { 1: [{}, {}] } };
const real = api.interpreter({
    getUser: id => Promise.resolve(db.users[id]),
    getPosts: userId => Task.of(db.posts[userId]),
    saveUser: user => user,
});

// ④ run
real.run(program).then(r => {
    if (r !== 'saved: anthony/2') throw new Error('the real interpreter got it wrong: ' + r);
    console.log(r);                       // saved: anthony/2
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
    if (r !== 'MOCK:0') throw new Error('the mock interpreter got it wrong: ' + r);
    console.log(r);                       // MOCK:0 — testing is just swapping the interpreter
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
const step2 = user => api.log('name: ' + user.name).map(() => user);
const pipeline = Free.pipeK(step1, step2);   // staged, macro-level structure

const it = api.interpreter({ fetch: path => ({ name: 'kim', path }), log: msg => msg });
it.run(pipeline()).then(r => {
    if (r.name !== 'kim') throw new Error('pipeK stages went out of sync');
    console.log(r.name);                  // kim
});
```

### Viewing the plan — "what it would do," without running it

Wire up an interpreter that only records instead of executing, and you can inspect what
a program would do, as data, before ever running it for real. This isn't a separate
feature. It's just one use of swapping the interpreter.

```javascript
const { Free } = FunFP;

const api = Free.api('scan', 'fire');
const program = api.scan().chain(danger => danger ? api.fire() : Free.of('standby'));

const steps = [];
const plan = api.interpreter({
    scan: () => { steps.push('scan'); return true; },   // inject a fake situation and
    fire: () => { steps.push('fire'); return 'fire'; },  // that path unfolds
});
plan.run(program).then(() => {
    if (steps.join(',') !== 'scan,fire') throw new Error('the plan differs: ' + steps);
    console.log(steps);                   // ['scan', 'fire']
});
```

### Multiple apis in one program — `Free.interpreters`

Even when each module declares its own vocabulary separately, programs can already mix
them: every api's program is the same Free value, so `chain` simply links them
together. Only execution is where things stop: an interpreter only knows its own
vocabulary. `Free.interpreters` merges several interpreters into one. Each command
looks at its own api's tag to pick the right registry, so commands with the same name
never get mixed up, and registering two interpreters for the same api throws
immediately at construction time.

```javascript
const { Free } = FunFP;

const db = Free.api('load');
const mail = Free.api('send');

// a program mixing two apis — composition is just chain linking them
const program = db.load('u1').chain(user => mail.send(user + ' greeting'));

// running it is the job of a gatekeeper that knows several registries
const it = Free.interpreters(
    db.interpreter({ load: k => 'user:' + k }),
    mail.interpreter({ send: msg => 'sent:' + msg })
);
it.run(program).then(r => {
    if (r !== 'sent:user:u1 greeting') throw new Error('routing went wrong: ' + r);
    console.log(r);   // sent:user:u1 greeting
});
```

The result of merging is itself an interpreter, so you can merge it again; and a
command for an api that appears in none of the merged registries is rejected with the
same message as a single interpreter would give (`no handler for '<name>'`). If some
other api happens to use that same name, the message gets an added clause, meaning the
interpreter that owns that command simply isn't part of this merge.

### Cancelling a run — `start`

`run` only returns the result, but `start` also hands back a handle for stopping the
run partway through. Calling `cancel()` halts execution **at the next command
boundary**: a handler already in flight is allowed to finish, but its result is
discarded (and any pure step that would follow it never runs), and remaining commands
never start. A cancelled run arrives as a rejection carrying the message
`'Free.api.run: cancelled'` and a `cancelled === true` marker, so callers can
distinguish a genuine failure from a cancellation by checking one field. Calling
`cancel` on a run that has already finished does nothing, and a program that completes
synchronously never has a window in which it can be cancelled. If a cancellation and an
in-flight failure happen to overlap, **the failure arrives as-is**: cancellation only
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
setTimeout(h.cancel, 30);          // cancel while step 2 is in flight
h.promise.then(
    () => { throw new Error('should have been cancelled'); },
    e => {
        if (e.cancelled !== true) throw new Error('missing cancellation marker: ' + e.message);
        if (calls.join(',') !== '1,2') throw new Error('step 3 ran: ' + calls);
        console.log('cancelled, steps that ran:', calls);   // cancelled, steps that ran: [ 1, 2 ]
    });
```

Two cautions. If your own code manually constructs an error carrying `cancelled: true`,
this distinction breaks down, so don't do that. And cancellation **does not itself
interrupt an in-flight request**: that's the handler's job; if you need it, you wire a
handler's `AbortController` together with `cancel` yourself (it is not wired up
automatically).

### Using it together with Reader, Writer, and State

In a Free program, real side effects happen only inside the interpreter. But the pure
computation that happens between effects still comes in three flavors: configuration
injected from outside, state carried from step to step, and a log that only ever
accumulates. [Reader](./Reader.md), [State](./State.md), and [Writer](./Writer.md)
handle these three, respectively.

| Need | Tool | Nature |
| --- | --- | --- |
| Inject config | [Reader](./Reader.md) | Pure, reads only |
| Keep state | [State](./State.md) | Pure, reads, writes, and threads it through |
| Accumulate a log | [Writer](./Writer.md) | Pure, only stacks up as a value |
| Real side effects | Vocabulary commands + interpreter | The only impure spot, which is exactly why it's swappable |

The example below processes a single order. The program only describes looking up a
price and charging for it; in the pure stretch where the looked-up price is already in
hand, Reader injects the discount rate, State threads the running total starting from
zero, and Writer records the process. Both the logging that shows up on screen and the
money that actually moves happen only inside the interpreter.

```javascript
const { Free, Reader, Writer, State } = FunFP;

// vocabulary — what we'll ask the outside world for: price lookup and payment
const api = Free.api('fetchPrice', 'charge');

// Reader — computing the discounted price depends on the config (discount)
const discounted = base => Reader.asks(cfg => Math.round(base * (1 - cfg.discount)));

// State — the running total starts at 0 and adds each price in turn
const totalOf = prices => prices
    .reduce((st, p) => st.chain(() => State.modify(t => t + p)), State.of(null))
    .exec(0);

// Writer — stacks up the computation process as a log value. nothing prints to the screen at this point
const journal = (names, prices, total) => names
    .reduce((w, name, i) => w.chain(() => Writer.tell([`${name}: ${prices[i]} won`])), Writer.of(null))
    .chain(() => Writer.tell([`total: ${total} won`]))
    .exec();

// program — effects are only described; three types split up the pure computation
const buy = (names, cfg) =>
    api.fetchPrice(names[0]).chain(b1 =>
    api.fetchPrice(names[1]).map(b2 => [b1, b2]))
        .map(bases => {
            const prices = bases.map(b => discounted(b).run(cfg));  // Reader runs here: the moment config is plugged in
            const total = totalOf(prices);                          // State runs here: initial state 0
            return { total, log: journal(names, prices, total) };   // Writer runs here: log collected
        })
        .chain(({ total, log }) => api.charge(total).map(receipt => ({ receipt, log })));

// interpreter — the actual action happens only here
const priceDb = { book: 12000, pen: 3000 };
const shop = api.interpreter({
    fetchPrice: name => Promise.resolve(priceDb[name]),
    charge: amount => ({ paid: amount }),
});

shop.run(buy(['book', 'pen'], { discount: 0.1 })).then(r => {
    if (r.receipt.paid !== 13500) throw new Error('total is wrong: ' + r.receipt.paid);
    if (r.log.join('/') !== 'book: 10800 won/pen: 2700 won/total: 13500 won') throw new Error('the log is wrong: ' + r.log);
    console.log(r.log);   // ['book: 10800 won', 'pen: 2700 won', 'total: 13500 won']
});
```

Change the config to `{ discount: 0.5 }` and the same program charges 6750, because
the config lives outside the program. `exec` means the same thing for both State and
Writer: it returns the computation's byproduct (the final state, the log).

### Rules — failing loudly, not quietly

| When | What | Result |
| --- | --- | --- |
| Building `interpreter(handlers)` | Missing handler / a name not in the vocabulary (typo) | Throws immediately, naming the offender |
| During `run` | A command from a different `Free.api` gets mixed in | Rejected with `no handler for '<name>'` |
| During `run` | The handler throws / its Promise rejects | Rejected as-is, never swallowed |

**Rejections leak through steps taken after an async boundary, too.** The first step
turns whatever the `Promise` constructor throws into a rejection for you, but a step
that follows after an async command finishes is on its own outside that, so the
runner wraps each step separately. Without that wrapping, the exception would vanish
somewhere no one can catch it.

```javascript
const { Free } = FunFP;

const api = Free.api('step');
const it = api.interpreter({
    step: n => n === 2
        ? Promise.reject(new Error('blew up at the second step'))
        : Promise.resolve('ok')
});

it.run(api.step(1).chain(() => api.step(2)))
    .then(() => console.log('swallowed'))
    .catch(e => console.log(e.message));   // 'blew up at the second step'
```

A command name is safe even when it matches a prototype name like `toString`: the
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
(`.map(v => …validate…)`) or inside the handler yourself: the library doesn't know what
counts as valid, because that's up to each domain.

---

## Floor 3 — internals: Free itself

From here on this is `Free.api`'s internal structure. None of it is needed to use
`Free.api`: read it only if you want to know how it works underneath.

### Pure / Impure — Free's two constructors

Every Free value is one of two things, holding the same standing as `Maybe`'s
`Just`/`Nothing`.

```javascript no-run structure/API notation
Pure(value)      // leaf: a completed value.       constructed by Free.of / Free.pure
Impure(functor)  // branch: a command functor carrying the next operation. constructed by Free.liftF / Free.impure
```

`Free.api`'s programs, the internals of all four transformers (`StateT`, `EitherT`,
`ReaderT`, `WriterT`), and the trampoline below are all built from just these two
constructors. Runners walk this tree with `isPure`/`isImpure` to interpret it.

### Three runners — all curried

```javascript no-run structure/API notation
Free.runSync(runner)(program)      // synchronous. runner receives the command and returns a value (or the next Free)
Free.runAsync(runner)(program)     // returns a Promise. runner returns a value or a Promise
Free.runWithTask(runner)(program)  // returns a Promise. runner returns a Task — this is the floor Free.api.run sits on
```

### liftF and custom command functors — what `Free.api` does for you

`liftF` requires the command to be a Functor (a `map` that composes continuations, plus
an internal symbol). `Free.api` builds a law-abiding command functor internally to
satisfy that requirement on your behalf. The only time a user needs to build a command
functor by hand is the special case where a command must be a functor with its own
logic.

```javascript no-run exposes an internal symbol — a door for the special case; normally use Free.api
const FunctorSymbol = Symbol.for('fun-fp-js/Functor');
class GetUser {
    constructor(id, next) { this.id = id; this.next = next; }        // carries the continuation (next)
    map(f) { return new GetUser(this.id, x => f(this.next(x))); }    // map must compose the continuation for the law to hold
}
GetUser.prototype[FunctorSymbol] = true;
const getUser = id => Free.liftF(new GetUser(id, x => x));
// interpretation: Free.runWithTask(cmd => fetchUser(cmd.id).map(cmd.next))(getUser(1).chain(...))
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
if (sum(10000) !== 50005000) throw new Error('trampoline got it wrong');
console.log(sum(10000));   // 50005000 — no stack overflow

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
| `interpreter.start(program)` | Floor 2 | A cancellation handle `{ promise, cancel }`, takes effect at the next command boundary |
| `Free.interpreters(...its)` | Floor 2 | Merges several apis' interpreters into one, routes by tag |
| `Free.pipeK(...fns)` / `composeK` | Floor 2 | Kleisli step composition |
| `Free.of` / `Free.pure(value)` | Floor 3 | Constructs `Pure` |
| `Free.liftF(functor)` / `Free.impure(functor)` | Floor 3 | Command functor → `Impure` |
| `Free.isPure` / `isImpure` / `isFree` | Floor 3 | Variant checks |
| `Free.runSync/runAsync/runWithTask(runner)(p)` | Floor 3 | Runners, all curried |
| `Free.Thunk` · `trampoline` | Floor 3 | Stack-safe recursion |

## Related type classes

- **[Functor](./Functor.md)**: `map` · **[Chain](./Monad.md)**: `chain` ·
  **[Monad](./Monad.md)**: the full sequencing pattern
- All four transformers are built on top of Free. Start with the
  [StateT](./StateT.md) document.
