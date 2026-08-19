# StateT

> 한국어: [../StateT.md](../StateT.md)

**A Monad Transformer that composes another effect with state transitions**

> This document also covers the **shared concepts** of the four Monad Transformers
> ([StateT](./StateT.md) · [EitherT](./EitherT.md) · [ReaderT](./ReaderT.md) ·
> [WriterT](./WriterT.md)). The other three documents focus on their own operations
> and refer back to this one.

## Concept

[State](./State.md) is `s -> [a, s]`. It takes a state and returns a value and a new
state, but **it cannot fail or be asynchronous.**

StateT wraps that result in another monad `M`.

```
State  s a   = s -> [a, s]
StateT M s a = s -> M [a, s]
```

When `M` is [Maybe](./Maybe.md), you get "a state transition that can fail"; when
`M` is [Task](./Task.md), you get "an asynchronous state transition." StateT handles
state threading, and `M` handles the failure or asynchrony.

fun-fp-js's Transformers are implemented on top of the [Free](./Free.md) monad. A
program is first built up as a data structure and interpreted at run time, so the
chain is **stack-safe** no matter how long it gets.

## Why a Transformer?

### The problem: wiring state and failure together by hand buries the code in plumbing

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// have to thread state through while also handling failure
function step1(state) {
    const value = state.count;
    if (value > 10) return null;              // failure
    return [value * 2, { ...state, count: value + 1 }];
}

function step2(state) {
    const prev = step1(state);
    if (prev === null) return null;           // propagate failure — repeated at every step
    const [v, s] = prev;
    if (v < 0) return null;
    return [v + 1, { ...s, count: s.count + 1 }];
}

// null checks and destructuring pile up as steps increase.
// The real logic is one line, `value * 2` — the rest is all plumbing.
```

### The fix: let the type handle state threading and failure propagation

```javascript
const { StateT, Maybe } = FunFP;

const ST = StateT('maybe');

const step = ST.get
    .chain(n => (n > 10 ? ST.lift(Maybe.Nothing()) : ST.of(n * 2)))
    .chain(v => ST.modify(s => s + 1).chain(() => ST.of(v)));

console.log(JSON.stringify(ST.runState(3, step).value));   // [6, 4]
console.log(ST.runState(20, step).isNothing());            // true — aborts immediately
```

Just chain `chain` calls together. State flows automatically, and the moment a
`Nothing` appears, the remaining steps never run.

## M is passed as a string {#m-as-string}

**This section applies to all four Transformers.**

Construct it as a **string**, like `StateT('maybe')`. Passing a data type object
makes the type name depend on execution order.

| Call | `_typeName` | Registry alias |
| --- | --- | --- |
| `StateT('maybe')` | `StateT(Maybe)` | `statet(maybe)` |
| `StateT(Maybe)` | `StateT(M1)` | `statet(m1)` — depends on execution order |

This is because an object has no `type` property, so `M1`, `M2`, ... get attached
in order instead (`resolveMonadType` in `index.js`).

And **the two forms are different classes.** Nominal typing is enforced, so mixing
them fails.

```javascript
const { StateT, Maybe } = FunFP;

const A = StateT('maybe');   // StateT(Maybe)
const B = StateT(Maybe);     // StateT(M1)

console.log(A === B);                  // false — different classes
console.log(A.of(1)._typeName);        // 'StateT(Maybe)'
console.log(B.of(1)._typeName);        // 'StateT(M1)'

try {
    A.runState(0, B.of(1));            // mixing them is rejected
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

Building it as a string also makes it findable in the type class registry.

```javascript
const { StateT, Functor, Monad } = FunFP;

StateT('maybe');   // triggers registration

console.log(typeof Functor.lookup('statet(maybe)').map);   // 'function'
console.log(typeof Monad.lookup('statet(maybe)').chain);   // 'function'
```

Calling it again with the same arguments produces the **same instance** (cached).

```javascript
const { StateT } = FunFP;

console.log(StateT('maybe') === StateT('maybe'));   // true
```

## Shared structure (common to all four)

Every Transformer provides three things.

| Operation | Meaning |
| --- | --- |
| `of(a)` | Lift a plain value into the Transformer |
| `lift(ma)` | Lift a value **already inside the underlying monad `M`** into the Transformer |
| `chain(f)` | Chain to the next step |

The difference between `of` and `lift` is the key point — `of` takes a plain value,
`lift` takes a value already wrapped in `M`.

```javascript
const { StateT, Maybe } = FunFP;

const ST = StateT('maybe');

// of: just a plain value
console.log(JSON.stringify(ST.runState(0, ST.of(42)).value));        // [42, 0]

// lift: a value wrapped in Maybe — Nothing makes the whole thing Nothing
console.log(JSON.stringify(ST.runState(0, ST.lift(Maybe.Just(42))).value));  // [42, 0]
console.log(ST.runState(0, ST.lift(Maybe.Nothing())).isNothing());           // true
```

It's rejected if the `chain` callback doesn't return the same Transformer instance.

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

try {
    ST.runState(0, ST.of(1).chain(() => 42));   // not a Transformer value
} catch (e) {
    console.log(e.constructor.name);            // TypeError
}
```

## Construction

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');    // a state transition that can fail
const STT = StateT('task');    // an asynchronous state transition

console.log(ST.of(1)._typeName);    // 'StateT(Maybe)'
console.log(STT.of(1)._typeName);   // 'StateT(Task)'
```

## Key operations

### get - read the current state

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

console.log(JSON.stringify(ST.runState(7, ST.get).value));   // [7, 7]
```

Both the value and the state are `7` — `get` also produces the state as its result.

### put - replace the state

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

console.log(JSON.stringify(ST.runState(0, ST.put(10)).value));   // [null, 10]
```

### modify - transform the state

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

console.log(JSON.stringify(ST.runState(3, ST.modify(s => s * 2)).value));   // [null, 6]
```

### gets - pull a value out of the state

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

console.log(JSON.stringify(ST.runState(5, ST.gets(s => s + 10)).value));   // [15, 5]
```

The state itself is left untouched — only the derived value is extracted.

### runState / eval / exec - running it

There are three ways to run it. The instance methods `run`/`eval`/`exec` behave the
same way.

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');
const program = ST.get.chain(n => ST.put(n + 1).chain(() => ST.of(n * 10)));

console.log(JSON.stringify(ST.runState(5, program).value));   // [50, 6] — both the value and the state
console.log(JSON.stringify(program.run(5).value));            // [50, 6] — the instance method
console.log(JSON.stringify(program.eval(5).value));           // 50 — the value only
console.log(JSON.stringify(program.exec(5).value));           // 6  — the state only
```

## Type checking

Passing `runState` a different type gets rejected.

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

try {
    ST.runState(0, 42);
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## Practical examples

### 1. Stock deduction that can fail

Thread state (stock) through while aborting the whole thing if it runs short.

```javascript
const { StateT, Maybe } = FunFP;

const ST = StateT('maybe');

const take = n => ST.get.chain(stock =>
    stock < n
        ? ST.lift(Maybe.Nothing())               // out of stock — stop here
        : ST.put(stock - n).chain(() => ST.of(n))
);

const order = take(3).chain(a => take(5).chain(b => ST.of(a + b)));

// stock 10: ships 3 + 5 = 8, 2 remain
console.log(JSON.stringify(order.run(10).value));   // [8, 2]

// stock 6: 3 succeeds but 5 fails — even the state change doesn't survive
console.log(order.run(6).isNothing());              // true
```

The second line matters — if it fails partway through, **the partial update never
leaks out.**

### 2. Asynchronous state transitions (StateT + Task)

Swap `M` for Task and the same code becomes asynchronous.

```javascript
const { StateT, Task } = FunFP;

const ST = StateT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));

const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

const fetchAndCount = url => ST.lift(delay(5, `body of ${url}`))
    .chain(body => ST.modify(n => n + 1).chain(() => ST.of(body.length)));

const program = fetchAndCount('/a')
    .chain(len1 => fetchAndCount('/b').chain(len2 => ST.of(len1 + len2)));

const [total, calls] = await run(program.run(0));
console.log('total length', total, '/ call count', calls);   // total length 20 / call count 2
```

### 3. Parser state (remaining input as state)

```javascript
const { StateT, Maybe } = FunFP;

const ST = StateT('maybe');

const item = ST.get.chain(rest =>
    rest.length === 0
        ? ST.lift(Maybe.Nothing())
        : ST.put(rest.slice(1)).chain(() => ST.of(rest[0]))
);

const three = item.chain(a => item.chain(b => item.chain(c => ST.of([a, b, c]))));

console.log(JSON.stringify(three.run('abcd').value));   // [['a','b','c'], 'd']
console.log(three.run('ab').isNothing());               // true — not enough input
```

### 4. ID generator

Using the state as a counter lets you generate unique IDs with a pure function.

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

const nextId = prefix => ST.get.chain(n =>
    ST.put(n + 1).chain(() => ST.of(`${prefix}-${n}`))
);

const makeUsers = names =>
    names.reduce(
        (acc, name) => acc.chain(list =>
            nextId('user').chain(id => ST.of([...list, { id, name }]))
        ),
        ST.of([])
    );

const [users, nextCounter] = makeUsers(['A', 'B', 'C']).run(1).value;
console.log(users.map(u => u.id));   // ['user-1', 'user-2', 'user-3']
console.log(nextCounter);            // 4
```

It's safe to build up the program via `reduce`, too — being Free-based, the stack
never blows up.

## Related type classes

- [State](./State.md) - the prototype without `M`. If you don't need an effect, State
  is simpler.
- [Free](./Free.md) - the Transformer's internal representation. Stack safety comes
  from here.
- [Monad](./Monad.md) - obtainable via `Monad.lookup('statet(maybe)')` (when built
  from the string form).
- [EitherT](./EitherT.md) · [ReaderT](./ReaderT.md) · [WriterT](./WriterT.md) - the
  other three.
- [Actor](./Actor.md) - if state transitions need a queue and guaranteed sequential
  execution, this is the one.
