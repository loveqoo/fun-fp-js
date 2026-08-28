# Writer

> 한국어: [../Writer.md](../Writer.md)

**Output-tracking monad (logging)**

## Concept

Writer represents **a pair of a value and an output**.

- Manages the computation result (value) together with side information (output)
- Accumulates output through a Monoid
- Implements logging with pure functions (no side effects)

## Why Writer?

### The problem: computations are hard to trace

```javascript
// console.log is a side effect (hard to test)
const calculate = x => {
    console.log(`Start with ${x}`);
    const step1 = x + 5;
    console.log(`After +5: ${step1}`);
    const step2 = step1 * 2;
    console.log(`After *2: ${step2}`);
    return step2;
};

// Returning the log directly is cumbersome
const calculateWithLog = x => {
    const logs = [];
    logs.push(`Start with ${x}`);
    const step1 = x + 5;
    logs.push(`After +5: ${step1}`);
    const step2 = step1 * 2;
    logs.push(`After *2: ${step2}`);
    return [step2, logs];
};
```

**Problems:**
- `console.log` is not a pure function (hard to test)
- Managing the log directly makes the code complex
- The log-accumulation logic has to be written every time

### The fix: separate computation and log with Writer

```javascript
const { Writer, Chain } = FunFP;
const { chain } = Chain.lookup('writer');

const add5 = x => new Writer(x + 5, [`Added 5 to ${x}`]);
const double = x => new Writer(x * 2, [`Doubled ${x}`]);

const calculate = x =>
    chain(
        step1 => chain(
            step2 => Writer.of(step2),
            double(step1)
        ),
        add5(x)
    );

const [result, logs] = calculate(1).run();
// result: 12
// logs: ['Added 5 to 1', 'Doubled 6']
```

**Advantages:**
- Stays pure (easy to test)
- The log accumulates automatically
- Cleanly separates the value from the log

## Creation

```javascript
import FunFP from 'fun-fp-js';
const { Writer, Monoid } = FunFP;

// of - a value with empty output
const writer = Writer.of(42);
writer.run();  // [42, []] (default Array Monoid)

// new Writer - specify the value, output, and Monoid
const withLog = new Writer(42, ['log1', 'log2']);
withLog.run();  // [42, ['log1', 'log2']]

// tell - appends only the output (value is undefined)
const logOnly = Writer.tell(['Starting process']);
logOnly.run();  // [undefined, ['Starting process']]

// Custom Monoid (String)
const stringMonoid = Monoid.lookup('string');
const stringWriter = new Writer('result', 'log entry. ', stringMonoid);
stringWriter.run();  // ['result', 'log entry. ']
```

## Main operations (Static Land first)

### map - transform the value only (Functor)

The output stays as is; only the value is transformed.

```javascript
const { Functor } = FunFP;
const { map } = Functor.lookup('writer');

const writer = new Writer(21, ['log']);
map(x => x * 2, writer).run();
// [42, ['log']] - only the value changes, the log stays the same

// Or the Static method
Writer.map(x => x * 2, writer);
```

### chain - transform the value + accumulate the output (Chain)

Chains through a function that returns a Writer, and the output accumulates automatically.

```javascript
const { Chain } = FunFP;
const { chain } = Chain.lookup('writer');

const writer = new Writer(5, ['start']);
const addLog = x => new Writer(x * 2, ['doubled']);

chain(addLog, writer).run();
// [10, ['start', 'doubled']] - the outputs get concatenated!

// Chaining several times
Writer.of(1)
    .chain(a => new Writer(a + 2, ['added 2']))
    .chain(b => new Writer(b * 3, ['multiplied by 3']))
    .run();
// [9, ['added 2', 'multiplied by 3']]

// Or the Static method
Writer.chain(addLog, writer);
```

### ap - apply a function + accumulate the output (Apply)

Applies the function inside a Writer to the value inside a Writer, accumulating the output.

```javascript
const { Apply } = FunFP;
const { ap } = Apply.lookup('writer');

const wf = new Writer(x => x * 2, ['applying function']);
const wa = new Writer(21, ['to value']);

ap(wf, wa).run();
// [42, ['applying function', 'to value']]

// Or the Static method
Writer.ap(wf, wa);
```

### run / eval / exec - extracting the result

Same vocabulary as State's run/eval/exec. Following the Haskell `execWriter`
convention, `exec` returns the by-product (the output).

```javascript
const writer = new Writer(42, ['log1', 'log2']);

// run - a [value, output] tuple
writer.run();   // [42, ['log1', 'log2']]

// eval - value only
writer.eval();  // 42

// exec - output only
writer.exec();  // ['log1', 'log2']
```

## Writer's own methods

### Writer.tell - append output only

```javascript
Writer.tell(['Starting process']).run();
// [undefined, ['Starting process']]

// Append output only, via chain
Writer.of(42)
    .chain(x => Writer.tell([`Processing ${x}`]))
    .chain(_ => Writer.of(100))
    .run();
// [100, ['Processing 42']]
```

### Writer.listen - fold the output into the value

```javascript
const writer = new Writer(42, ['log1', 'log2']);
Writer.listen(writer).run();
// [[42, ['log1', 'log2']], ['log1', 'log2']]
// the value becomes [original value, output]
```

### Writer.listens - transform the output, then fold it into the value

```javascript
const writer = new Writer(42, ['a', 'b', 'c']);
Writer.listens(logs => logs.length, writer).run();
// [[42, 3], ['a', 'b', 'c']]
// the value becomes [original value, log count]
```

### Writer.pass - transform the output using a function carried in the value

```javascript
const writer = new Writer(
    [42, logs => logs.map(l => l.toUpperCase())],
    ['hello', 'world']
);
Writer.pass(writer).run();
// [42, ['HELLO', 'WORLD']]
// applies the value's function to the output
```

### Writer.censor - filter the output

```javascript
const writer = new Writer(42, ['secret', 'public', 'debug']);
Writer.censor(
    logs => logs.filter(l => l !== 'secret'),
    writer
).run();
// [42, ['public', 'debug']]
```

## Instance methods (conveniences)

Convenience methods added after the Static Land and static methods.

```javascript
// map
new Writer(21, ['log']).map(x => x * 2).run();
// [42, ['log']]

// chain
Writer.of(5)
    .chain(x => new Writer(x + 1, ['incremented']))
    .chain(x => new Writer(x * 2, ['doubled']))
    .run();
// [12, ['incremented', 'doubled']]
```

## Specifying a Monoid

Writer accumulates output through a Monoid. The default is the Array Monoid.

### The default Array Monoid

```javascript
const w1 = new Writer(1, ['log1']);
const w2 = w1.chain(x => new Writer(x + 1, ['log2']));
w2.run();
// [2, ['log1', 'log2']] - arrays merged via concat
```

### The String Monoid

```javascript
const { Monoid } = FunFP;
const stringMonoid = Monoid.lookup('string');

const w1 = new Writer(1, 'Hello ', stringMonoid);
const w2 = w1.chain(x => new Writer(x + 1, 'World!', stringMonoid));
w2.run();
// [2, 'Hello World!'] - string concatenation
```

### The Number Monoid (summing)

```javascript
const { Monoid } = FunFP;
const numberMonoid = Monoid.lookup('number');

const w1 = new Writer('step1', 10, numberMonoid);
const w2 = w1.chain(x => new Writer('step2', 25, numberMonoid));
w2.run();
// ['step2', 35] - numbers summed
```

### The registered `writer` instance is Array-Monoid-only — for another Monoid, use `Monad.Writer(m)` {#writer-factory}

`of` from `Monad.lookup('writer')` / `Applicative.lookup('writer')` always uses
the **Array Monoid** (`Writer.of`'s default). So running a law such as
`chain(of, w)` against this registered instance on a Number-Monoid Writer
**mixes two different Monoids and throws**. To use a different Monoid, you
need an instance built with that Monoid, the same way `Const` needs one
instance per Monoid.

```javascript
const { Monoid, Monad, Applicative, Writer } = FunFP;
const num = Monoid.lookup('number');

// A Writer monad that knows the Number Monoid
const W = Monad.Writer(num);

// of carries that Monoid's empty(0) forward — the registered writer would have forced in [] and thrown in chain
if (JSON.stringify(W.of(9).run()) !== JSON.stringify([9, 0])) throw new Error('of does not carry the monoid forward');
console.log(W.of(9).run());   // [9, 0]

// The right-identity law chain(of, w) ≡ w now holds
const w = new Writer(7, 3, num);
if (JSON.stringify(W.chain(W.of, w).run()) !== JSON.stringify([7, 3])) throw new Error('right identity broken');
console.log(W.chain(W.of, w).run());   // [7, 3]

// The registered writer stays Array-only — also looked up by key
console.log(Monad.lookup('writer').of(1).run());     // [1, []]
console.log(Monad.Writer(num) === Monad.lookup('writer(number)'));   // true
```

## Type checking

```javascript
Writer.isWriter(Writer.of(5));         // true
Writer.isWriter(new Writer(5, []));    // true
Writer.isWriter([5, []]);              // false (a tuple is not a Writer)
Writer.isWriter(5);                    // false
```

## Practical examples

### 1. Debugging a computation

```javascript
const { Writer, Chain } = FunFP;
const { chain } = Chain.lookup('writer');

const parseInput = str => {
    const num = parseInt(str);
    return new Writer(num, [`Parsed '${str}' to ${num}`]);
};

const validatePositive = num => {
    if (num <= 0) {
        return new Writer(null, [`Validation failed: ${num} is not positive`]);
    }
    return new Writer(num, [`Validated: ${num} is positive`]);
};

const calculate = num => {
    const result = num * 2 + 10;
    return new Writer(result, [`Calculated: ${num} * 2 + 10 = ${result}`]);
};

const pipeline = input =>
    chain(
        num => chain(
            validated => validated
                ? chain(result => Writer.of(result), calculate(validated))
                : Writer.of(null),
            validatePositive(num)
        ),
        parseInput(input)
    );

const [result, logs] = pipeline('5').run();
console.log('Result:', result);
console.log('Logs:');
logs.forEach(log => console.log(`  - ${log}`));
// Result: 20
// Logs:
//   - Parsed '5' to 5
//   - Validated: 5 is positive
//   - Calculated: 5 * 2 + 10 = 20
```

### 2. Tracking an execution history

```javascript
const { Writer } = FunFP;

const fetchUser = userId =>
    new Writer(
        { id: userId, name: 'Alice' },
        [`[${new Date().toISOString()}] Fetched user ${userId}`]
    );

const updateUser = user =>
    new Writer(
        { ...user, updated: true },
        [`[${new Date().toISOString()}] Updated user ${user.id}`]
    );

const saveUser = user =>
    new Writer(
        { ...user, saved: true },
        [`[${new Date().toISOString()}] Saved user ${user.id}`]
    );

const workflow = fetchUser(123)
    .chain(updateUser)
    .chain(saveUser);

const [finalUser, history] = workflow.run();
console.log('Final state:', finalUser);
console.log('History:');
history.forEach(entry => console.log(`  ${entry}`));
// Final state: { id: 123, name: 'Alice', updated: true, saved: true }
// History:
//   [2026-01-25T...] Fetched user 123
//   [2026-01-25T...] Updated user 123
//   [2026-01-25T...] Saved user 123
```

### 3. Producing an audit log

```javascript
const { Writer, Monoid } = FunFP;

// Audit log type
const auditLog = (action, userId, details) => ({
    timestamp: new Date().toISOString(),
    action,
    userId,
    details
});

// Collect audit logs with the Array Monoid
const debitAccount = (accountId, amount, userId) =>
    new Writer(
        { accountId, newBalance: 1000 - amount },
        [auditLog('DEBIT', userId, { accountId, amount })]
    );

const creditAccount = (accountId, amount, userId) =>
    new Writer(
        { accountId, newBalance: 500 + amount },
        [auditLog('CREDIT', userId, { accountId, amount })]
    );

const transfer = (fromId, toId, amount, userId) =>
    debitAccount(fromId, amount, userId)
        .chain(debit =>
            creditAccount(toId, amount, userId)
                .map(credit => ({ debit, credit }))
        );

const [result, auditTrail] = transfer('ACC1', 'ACC2', 100, 'USER123').run();
console.log('Transfer result:', result);
console.log('Audit trail:', auditTrail);
// Transfer result: {
//   debit: { accountId: 'ACC1', newBalance: 900 },
//   credit: { accountId: 'ACC2', newBalance: 600 }
// }
// Audit trail: [
//   { timestamp: '...', action: 'DEBIT', userId: 'USER123', details: {...} },
//   { timestamp: '...', action: 'CREDIT', userId: 'USER123', details: {...} }
// ]
```

### 4. Concatenating text logs with the String Monoid

```javascript
const { Writer, Monoid } = FunFP;
const stringMonoid = Monoid.lookup('string');

const step1 = new Writer('data', 'Fetching data... ', stringMonoid);
const step2 = step1.chain(data =>
    new Writer(data + ' processed', 'Processing... ', stringMonoid)
);
const step3 = step2.chain(data =>
    new Writer(data + ' complete', 'Done!', stringMonoid)
);

const [result, log] = step3.run();
console.log('Result:', result);
console.log('Log:', log);
// Result: data processed complete
// Log: Fetching data... Processing... Done!
```

### 5. Collecting performance metrics

```javascript
const { Writer, Monoid } = FunFP;

// Custom Monoid: merge metrics
const metricsMonoid = {
    empty: () => ({ totalTime: 0, operations: 0 }),
    concat: (m1, m2) => ({
        totalTime: m1.totalTime + m2.totalTime,
        operations: m1.operations + m2.operations
    })
};

const timedOperation = (name, fn) => input => {
    const start = Date.now();
    const result = fn(input);
    const elapsed = Date.now() - start;
    return new Writer(
        result,
        { totalTime: elapsed, operations: 1 },
        metricsMonoid
    );
};

const parse = timedOperation('parse', str => parseInt(str));
const validate = timedOperation('validate', n => n > 0 ? n : null);
const transform = timedOperation('transform', n => n * 2);

const pipeline = input =>
    parse(input)
        .chain(validate)
        .chain(transform);

const [result, metrics] = pipeline('42').run();
console.log('Result:', result);
console.log('Metrics:', metrics);
// Result: 84
// Metrics: { totalTime: 3, operations: 3 }
```

## Related type classes

Type classes that Writer implements:

- **Functor**: `map` - transforms the value, keeps the output
- **Apply**: `ap` - applies a function, accumulates the output
- **Applicative**: `of` - creates a Writer with an empty output
- **Chain**: `chain` - chains Writers, accumulates the output
- **Monad**: Applicative + Chain

## Writer.pipeK / Writer.composeK

Combine functions that return a Writer through Kleisli composition.

### Writer.pipeK - left-to-right composition

```javascript
const add5 = x => new Writer(x + 5, ['add 5']);
const double = x => new Writer(x * 2, ['double']);
const toString = x => new Writer(`Result: ${x}`, ['to string']);

const pipeline = Writer.pipeK(add5, double, toString);
const [value, logs] = pipeline(1).run();
// value: 'Result: 12'
// logs: ['add 5', 'double', 'to string']
```

### Writer.composeK - right-to-left composition

```javascript
const add5 = x => new Writer(x + 5, ['add 5']);
const double = x => new Writer(x * 2, ['double']);
const toString = x => new Writer(`Result: ${x}`, ['to string']);

const pipeline = Writer.composeK(toString, double, add5);
const [value, logs] = pipeline(1).run();
// value: 'Result: 12' (same result)
```

## Writer.lift

Lifts a multi-argument function into the Writer context. The output accumulates automatically.

```javascript
const add = (a, b) => a + b;
const liftedAdd = Writer.lift(add);

const w1 = new Writer(10, ['w1']);
const w2 = new Writer(32, ['w2']);

const [value, logs] = liftedAdd(w1, w2).run();
// value: 42
// logs: ['w1', 'w2']
```

## Writer usage patterns

### When should you use Writer?

**Good use cases:**
1. You want to debug a computation's process
2. You want to produce an audit log with pure functions
3. You want to collect performance metrics or statistics
4. You need testable logging

**Cases where it's not needed:**
1. A plain console output is enough (side effects aren't a problem)
2. The log volume is so large it causes memory pressure
3. You need real-time log streaming (Writer accumulates until `run`)

### Writer vs console.log

| | console.log | Writer |
|---|---|---|
| Purity | side effect | pure function |
| Testing | hard (must capture stdout) | easy (verify the output) |
| Accumulation | not possible | automatic (Monoid) |
| Timing | immediate output | output at `run` time |
| Use case | development/debugging | production logging |

## Related documents

**Similar types:**
- [Reader](./Reader.md) - environment-based computation (the input side)
- [State](./State.md) - state-transforming monad

**Type classes used:**
- [Functor](./Functor.md)
- [Apply](./Applicative.md) - `ap` is documented under Applicative
- [Applicative](./Applicative.md)
- [Chain](./Monad.md) - `chain` is documented under Monad
- [Monad](./Monad.md)

**Used together with:**
- [Monoid](./Monoid.md) - used for output accumulation (Array, String, Number, etc.)
