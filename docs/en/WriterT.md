# WriterT

> 한국어: [../WriterT.md](../WriterT.md)

**A Monad Transformer that composes another effect with output accumulation**

> The four Transformers' shared concepts (`of`/`lift`, the string-`M` rule, Free-based
> stack safety) are laid out in the [StateT](./StateT.md) document. Here we cover
> WriterT's own operations.

## Concept

[Writer](./Writer.md) is `[a, log]`. It computes a value while accumulating a log
alongside it, but **it cannot fail or be asynchronous.**

WriterT wraps that result in another monad `M`.

```
Writer    w a = [a, w]
WriterT M w a = M [a, w]
```

How the log gets combined is decided by a [Monoid](./Monoid.md). The default is
Array (concatenation), and it can be swapped for String (string concatenation) or
Number (summation).

The difference from `console.log` is that **the log is part of the return value.**
Since it isn't a side effect, tests can inspect it directly.

## Why WriterT?

### The problem: recording what happened means either a side effect or more plumbing

```javascript no-run the problem — deliberately bad code
// Method 1: console.log — hard to catch in tests, and not pure
function calculate(x) {
    console.log(`input ${x}`);
    const doubled = x * 2;
    console.log(`doubled ${doubled}`);
    return doubled;
}

// Method 2: carry the log by hand — pollutes every function's signature
function calculate(x, log) {
    const newLog = [...log, `input ${x}`];
    const doubled = x * 2;
    return [doubled, [...newLog, `doubled ${doubled}`]];
}
// Every call site needs to destructure and merge [value, log]
```

### The fix: let the type handle log accumulation

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');

const calculate = x => WT.tell([`input ${x}`])
    .chain(() => WT.of(x * 2))
    .chain(doubled => WT.tell([`doubled ${doubled}`]).chain(() => WT.of(doubled)));

const [value, log] = WT.runWriterT(calculate(21)).value;

console.log(value);   // 42
console.log(log);     // ['input 21', 'doubled 42']
```

Since the log is a return value, **you can assert on it.** The calculation function
stays pure.

## M is passed as a string

**This is a rule shared by all four Transformers.** Construct it as a string, like
`WriterT('task')`. Passing an object makes the type name depend on execution order,
like `WriterT(M1,Array)`, and the two forms become different classes that can't be
mixed. See [StateT](./StateT.md#m-as-string) for details.

```javascript
const { WriterT, Maybe } = FunFP;

const A = WriterT('maybe');
const B = WriterT(Maybe);

console.log(A.of(1)._typeName);   // 'WriterT(Maybe,Array)'
console.log(B.of(1)._typeName);   // 'WriterT(M1,Array)'

try {
    A.runWriterT(B.of(1));
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## Construction

`WriterT(M, monoid)`: omit `monoid` and it defaults to Array.

```javascript
const { WriterT, Monoid } = FunFP;

const WA = WriterT('maybe');                          // Array (default)
const WS = WriterT('maybe', Monoid.lookup('string'));     // String
const WN = WriterT('maybe', Monoid.lookup('number'));     // Number (sum)

console.log(WA.of(1)._typeName);   // 'WriterT(Maybe,Array)'
console.log(WS.of(1)._typeName);   // 'WriterT(Maybe,string)'
console.log(WN.of(1)._typeName);   // 'WriterT(Maybe,number)'
```

The same `(M, monoid)` combination is cached and produces the same instance.

```javascript
const { WriterT } = FunFP;

console.log(WriterT('maybe') === WriterT('maybe'));   // true
```

An object that doesn't qualify as a Monoid is rejected.

```javascript
const { WriterT } = FunFP;

try {
    WriterT('maybe', { concat: (a, b) => a });   // no empty
} catch (e) {
    console.log(e.constructor.name);             // TypeError
}
```

## Key operations

### tell - leaving output

Produces no value, only accumulates the log.

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');
const [value, log] = WT.runWriterT(WT.tell(['first line']).chain(() => WT.tell(['second line']))).value;

console.log(value);   // undefined   only tell was called, so there's no value
console.log(log);     // ['first line', 'second line']
```

### of - a value with no log

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');
const [value, log] = WT.runWriterT(WT.of(42)).value;

console.log(value, JSON.stringify(log));   // 42 []
```

`log` is an empty array, the Monoid's identity element.

### runWriterT - running it

Returns `[value, log]` wrapped in `M`.

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');
const result = WT.runWriterT(WT.tell(['a']).chain(() => WT.of(7)));

console.log(result._typeName);              // 'Maybe'
console.log(JSON.stringify(result.value));  // [7,["a"]]
```

### lift - pulling in a value of the underlying M

```javascript
const { WriterT, Maybe } = FunFP;

const WT = WriterT('maybe');

console.log(JSON.stringify(WT.runWriterT(WT.lift(Maybe.Just(9))).value));   // [9,[]]
console.log(WT.runWriterT(WT.lift(Maybe.Nothing())).isNothing());           // true
```

With `Nothing`, **the accumulated log disappears along with it.** A failure in `M`
swallows the whole thing.

```javascript
const { WriterT, Maybe } = FunFP;

const WT = WriterT('maybe');

const program = WT.tell(['start'])
    .chain(() => WT.lift(Maybe.Nothing()))
    .chain(() => WT.tell(['end']));

console.log(WT.runWriterT(program).isNothing());   // true — even the 'start' log doesn't survive
```

If the log absolutely must survive, either keep `M` from failing at all, or express
failure as a value instead (for example, embedding [Either](./Either.md) in the value
side).

## Swapping the Monoid

### String - a text log

```javascript
const { WriterT, Monoid } = FunFP;

const WT = WriterT('maybe', Monoid.lookup('string'));

const program = WT.tell('start → ')
    .chain(() => WT.tell('process → '))
    .chain(() => WT.tell('done'))
    .chain(() => WT.of('ok'));

const [value, log] = WT.runWriterT(program).value;
console.log(value, '/', log);   // ok / start → process → done
```

### Number - summing cost or count

The log doesn't have to be text. Anything summable works.

```javascript
const { WriterT, Monoid } = FunFP;

const WT = WriterT('maybe', Monoid.lookup('number'));

// accumulate the cost of each step
const step = (name, cost, value) => WT.tell(cost).chain(() => WT.of(value));

const program = step('parse', 3, 10)
    .chain(v => step('validate', 5, v * 2))
    .chain(v => step('save', 12, v + 1));

const [result, totalCost] = WT.runWriterT(program).value;
console.log('result', result, '/ total cost', totalCost);   // result 21 / total cost 20
```

## Type checking

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');

try {
    WT.runWriterT(42);
} catch (e) {
    console.log('runWriterT:', e.constructor.name);   // runWriterT: TypeError
}

try {
    WT.runWriterT(WT.of(1).chain(() => 42));   // callback doesn't return a WriterT
} catch (e) {
    console.log('chain callback:', e.constructor.name);   // chain callback: TypeError
}
```

## Practical examples

### 1. A computation with an audit log

Returns not just the result but what happened and why.

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');

const applyDiscount = (price, rate, reason) =>
    WT.tell([`${reason}: ${price} → ${Math.round(price * (1 - rate))}`])
        .chain(() => WT.of(Math.round(price * (1 - rate))));

const checkout = price => WT.tell([`list price ${price}`])
    .chain(() => applyDiscount(price, 0.1, 'member discount'))
    .chain(p => applyDiscount(p, 0.05, 'coupon'))
    .chain(p => WT.tell([`final ${p}`]).chain(() => WT.of(p)));

const [final, audit] = WT.runWriterT(checkout(10000)).value;

console.log('final price:', final);
audit.forEach(line => console.log('  ' + line));
```

Since the log is a value, tests can assert on `audit`'s contents directly.

### 2. Tracing an asynchronous pipeline (WriterT + Task)

```javascript
const { WriterT, Task } = FunFP;

const WT = WriterT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));
const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

const fetchStep = (name, ms, value) => WT.tell([`${name} started`])
    .chain(() => WT.lift(delay(ms, value)))
    .chain(v => WT.tell([`${name} done (${ms}ms)`]).chain(() => WT.of(v)));

const pipeline = fetchStep('user', 3, { id: 1 })
    .chain(user => fetchStep('permissions', 2, ['read', 'write'])
        .chain(perms => WT.of({ ...user, perms })));

const [result, trace] = await run(WT.runWriterT(pipeline));

console.log(JSON.stringify(result));
trace.forEach(line => console.log('  ' + line));
```

### 3. Collecting warnings while continuing

Unlike errors, warnings must not interrupt the flow. WriterT is exactly that shape.

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');

const validateField = (name, value) => {
    if (value === undefined) return WT.tell([`${name} missing — using default`]).chain(() => WT.of(null));
    if (typeof value === 'string' && value.length > 20) {
        return WT.tell([`${name} too long — truncated`]).chain(() => WT.of(value.slice(0, 20)));
    }
    return WT.of(value);
};

const input = { name: 'extremely long name', email: undefined };

const program = validateField('name', input.name)
    .chain(name => validateField('email', input.email)
        .chain(email => WT.of({ name, email })));

const [record, warnings] = WT.runWriterT(program).value;

console.log(JSON.stringify(record));
console.log('warnings: ' + warnings.length);
warnings.forEach(w => console.log('  ' + w));
```

### 4. Collecting performance metrics (Number Monoid)

```javascript
const { WriterT, Monoid } = FunFP;

const WT = WriterT('maybe', Monoid.lookup('number'));

// accumulate the number of hypothetical queries each operation spent
const query = (n, result) => WT.tell(n).chain(() => WT.of(result));

const loadDashboard = query(1, { userId: 7 })
    .chain(user => query(3, ['post1', 'post2', 'post3'])
        .chain(posts => query(2, 12)
            .chain(comments => WT.of({ user, posts: posts.length, comments }))));

const [data, queryCount] = WT.runWriterT(loadDashboard).value;

console.log(JSON.stringify(data));
console.log('total queries:', queryCount);   // total queries: 6

// an assertion like N+1 detection can be used as-is in tests
console.log('under 10 queries?', queryCount < 10);
```

## Related type classes

- [Writer](./Writer.md) - the prototype without `M`. It has extra operations like
  `listen`/`censor`/`pass`.
- [Monoid](./Monoid.md) - decides how the log is combined. Beyond Array / String /
  Number, a custom Monoid works too.
- [StateT](./StateT.md) - the Transformers' shared concepts (`of`/`lift`, string `M`,
  stack safety). If you need **readable and writable state**, not just accumulation,
  this is the one.
- [EitherT](./EitherT.md) · [ReaderT](./ReaderT.md) - the remaining Transformers.
