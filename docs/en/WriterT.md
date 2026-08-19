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

How the log gets combined is decided by a [Monoid](./Monoid.md) — the default is
Array (concatenation), and it can be swapped for String (string concatenation) or
Number (summation).

The difference from `console.log` is that **the log is part of the return value.**
Since it isn't a side effect, tests can inspect it directly.

## Why WriterT?

### The problem: recording what happened means either a side effect or more plumbing

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// 방법 1: console.log — 테스트에서 잡아내기 어렵고 순수하지 않다
function calculate(x) {
    console.log(`입력 ${x}`);
    const doubled = x * 2;
    console.log(`두 배 ${doubled}`);
    return doubled;
}

// 방법 2: 로그를 수동으로 나른다 — 모든 함수의 시그니처가 오염된다
function calculate(x, log) {
    const newLog = [...log, `입력 ${x}`];
    const doubled = x * 2;
    return [doubled, [...newLog, `두 배 ${doubled}`]];
}
// 호출부마다 [값, 로그] 구조분해와 병합이 필요하다
```

### The fix: let the type handle log accumulation

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');

const calculate = x => WT.tell([`입력 ${x}`])
    .chain(() => WT.of(x * 2))
    .chain(doubled => WT.tell([`두 배 ${doubled}`]).chain(() => WT.of(doubled)));

const [value, log] = WT.runWriterT(calculate(21)).value;

console.log(value);   // 42
console.log(log);     // ['입력 21', '두 배 42']
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

`WriterT(M, monoid)` — omit `monoid` and it defaults to Array.

```javascript
const { WriterT, Monoid } = FunFP;

const WA = WriterT('maybe');                          // Array (기본)
const WS = WriterT('maybe', Monoid.lookup('string'));     // String
const WN = WriterT('maybe', Monoid.lookup('number'));     // Number (합산)

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
    WriterT('maybe', { concat: (a, b) => a });   // empty가 없다
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
const [value, log] = WT.runWriterT(WT.tell(['첫 줄']).chain(() => WT.tell(['둘째 줄']))).value;

console.log(value);   // undefined   tell 만 했으니 값이 없다
console.log(log);     // ['첫 줄', '둘째 줄']
```

### of - a value with no log

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');
const [value, log] = WT.runWriterT(WT.of(42)).value;

console.log(value, JSON.stringify(log));   // 42 []
```

`log` is an empty array — the Monoid's identity element.

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

With `Nothing`, **the accumulated log disappears along with it** — a failure in `M`
swallows the whole thing.

```javascript
const { WriterT, Maybe } = FunFP;

const WT = WriterT('maybe');

const program = WT.tell(['시작'])
    .chain(() => WT.lift(Maybe.Nothing()))
    .chain(() => WT.tell(['끝']));

console.log(WT.runWriterT(program).isNothing());   // true — '시작' 로그도 남지 않는다
```

If the log absolutely must survive, either keep `M` from failing at all, or express
failure as a value instead (for example, embedding [Either](./Either.md) in the value
side).

## Swapping the Monoid

### String - a text log

```javascript
const { WriterT, Monoid } = FunFP;

const WT = WriterT('maybe', Monoid.lookup('string'));

const program = WT.tell('시작 → ')
    .chain(() => WT.tell('처리 → '))
    .chain(() => WT.tell('완료'))
    .chain(() => WT.of('ok'));

const [value, log] = WT.runWriterT(program).value;
console.log(value, '/', log);   // ok / 시작 → 처리 → 완료
```

### Number - summing cost or count

The log doesn't have to be text. Anything summable works.

```javascript
const { WriterT, Monoid } = FunFP;

const WT = WriterT('maybe', Monoid.lookup('number'));

// 각 단계의 비용을 누적한다
const step = (name, cost, value) => WT.tell(cost).chain(() => WT.of(value));

const program = step('파싱', 3, 10)
    .chain(v => step('검증', 5, v * 2))
    .chain(v => step('저장', 12, v + 1));

const [result, totalCost] = WT.runWriterT(program).value;
console.log('결과', result, '/ 총 비용', totalCost);   // 결과 21 / 총 비용 20
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
    WT.runWriterT(WT.of(1).chain(() => 42));   // 콜백이 WriterT를 안 돌려줌
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

const checkout = price => WT.tell([`정가 ${price}`])
    .chain(() => applyDiscount(price, 0.1, '회원 할인'))
    .chain(p => applyDiscount(p, 0.05, '쿠폰'))
    .chain(p => WT.tell([`최종 ${p}`]).chain(() => WT.of(p)));

const [final, audit] = WT.runWriterT(checkout(10000)).value;

console.log('최종가:', final);
audit.forEach(line => console.log('  ' + line));
```

Since the log is a value, tests can assert on `audit`'s contents directly.

### 2. Tracing an asynchronous pipeline (WriterT + Task)

```javascript
const { WriterT, Task } = FunFP;

const WT = WriterT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));
const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

const fetchStep = (name, ms, value) => WT.tell([`${name} 시작`])
    .chain(() => WT.lift(delay(ms, value)))
    .chain(v => WT.tell([`${name} 완료 (${ms}ms)`]).chain(() => WT.of(v)));

const pipeline = fetchStep('사용자', 3, { id: 1 })
    .chain(user => fetchStep('권한', 2, ['read', 'write'])
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
    if (value === undefined) return WT.tell([`${name} 없음 — 기본값 사용`]).chain(() => WT.of(null));
    if (typeof value === 'string' && value.length > 20) {
        return WT.tell([`${name} 너무 김 — 잘라냄`]).chain(() => WT.of(value.slice(0, 20)));
    }
    return WT.of(value);
};

const input = { name: '아주아주아주아주아주아주 긴 이름입니다', email: undefined };

const program = validateField('name', input.name)
    .chain(name => validateField('email', input.email)
        .chain(email => WT.of({ name, email })));

const [record, warnings] = WT.runWriterT(program).value;

console.log(JSON.stringify(record));
console.log('경고 ' + warnings.length + '건:');
warnings.forEach(w => console.log('  ' + w));
```

### 4. Collecting performance metrics (Number Monoid)

```javascript
const { WriterT, Monoid } = FunFP;

const WT = WriterT('maybe', Monoid.lookup('number'));

// 각 연산이 소비한 가상의 쿼리 수를 누적한다
const query = (n, result) => WT.tell(n).chain(() => WT.of(result));

const loadDashboard = query(1, { userId: 7 })
    .chain(user => query(3, ['post1', 'post2', 'post3'])
        .chain(posts => query(2, 12)
            .chain(comments => WT.of({ user, posts: posts.length, comments }))));

const [data, queryCount] = WT.runWriterT(loadDashboard).value;

console.log(JSON.stringify(data));
console.log('총 쿼리 수:', queryCount);   // 총 쿼리 수: 6

// N+1 문제 감지 같은 단언을 테스트에서 그대로 쓸 수 있다
console.log('쿼리 10회 미만?', queryCount < 10);
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
