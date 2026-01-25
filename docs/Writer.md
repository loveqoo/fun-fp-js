# Writer

**출력 추적 모나드 (로깅)**

## 개념

Writer는 **값과 출력(output)의 쌍**을 표현합니다.

- 계산 결과(value)와 부가 정보(output)를 함께 관리
- Monoid로 출력을 누적
- 순수 함수로 로깅 구현 (부수 효과 없음)

## 왜 Writer인가?

### 문제: 계산 과정을 추적하기 어려움

```javascript
// console.log는 부수 효과 (테스트가 어려움)
const calculate = x => {
    console.log(`Start with ${x}`);
    const step1 = x + 5;
    console.log(`After +5: ${step1}`);
    const step2 = step1 * 2;
    console.log(`After *2: ${step2}`);
    return step2;
};

// 로그를 직접 반환하면 번거로움
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

**문제점:**
- `console.log`는 순수 함수가 아님 (테스트 어려움)
- 로그를 직접 관리하면 코드가 복잡해짐
- 로그 누적 로직을 매번 작성해야 함

### 해결: Writer로 계산과 로그 분리

```javascript
const { Writer, Chain } = FunFP;
const { chain } = Chain.of('writer');

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

**장점:**
- 순수 함수 유지 (테스트 용이)
- 로그가 자동으로 누적됨
- 값과 로그를 깔끔하게 분리

## 생성

```javascript
import FunFP from 'fun-fp-js';
const { Writer, Monoid } = FunFP;

// of - 값과 빈 출력
const writer = Writer.of(42);
writer.run();  // [42, []] (기본 Array Monoid)

// new Writer - 값, 출력, Monoid 지정
const withLog = new Writer(42, ['log1', 'log2']);
withLog.run();  // [42, ['log1', 'log2']]

// tell - 출력만 추가 (값은 undefined)
const logOnly = Writer.tell(['Starting process']);
logOnly.run();  // [undefined, ['Starting process']]

// 커스텀 Monoid (String)
const stringMonoid = Monoid.of('string');
const stringWriter = new Writer('result', 'log entry. ', stringMonoid);
stringWriter.run();  // ['result', 'log entry. ']
```

## 주요 연산 (Static Land 우선)

### map - 값만 변환 (Functor)

출력은 그대로, 값만 변환합니다.

```javascript
const { Functor } = FunFP;
const { map } = Functor.of('writer');

const writer = new Writer(21, ['log']);
map(x => x * 2, writer).run();
// [42, ['log']] - 값만 변경, 로그는 그대로

// 또는 Static 메서드
Writer.map(x => x * 2, writer);
```

### chain - 값 변환 + 출력 누적 (Chain)

Writer를 반환하는 함수로 연쇄하며, 출력이 자동 누적됩니다.

```javascript
const { Chain } = FunFP;
const { chain } = Chain.of('writer');

const writer = new Writer(5, ['start']);
const addLog = x => new Writer(x * 2, ['doubled']);

chain(addLog, writer).run();
// [10, ['start', 'doubled']] - 출력이 concat됨!

// 여러 chain 연결
Writer.of(1)
    .chain(a => new Writer(a + 2, ['added 2']))
    .chain(b => new Writer(b * 3, ['multiplied by 3']))
    .run();
// [9, ['added 2', 'multiplied by 3']]

// 또는 Static 메서드
Writer.chain(addLog, writer);
```

### ap - 함수 적용 + 출력 누적 (Apply)

Writer 안의 함수를 Writer 안의 값에 적용하며, 출력을 누적합니다.

```javascript
const { Apply } = FunFP;
const { ap } = Apply.of('writer');

const wf = new Writer(x => x * 2, ['applying function']);
const wa = new Writer(21, ['to value']);

ap(wf, wa).run();
// [42, ['applying function', 'to value']]

// 또는 Static 메서드
Writer.ap(wf, wa);
```

### run / exec - 결과 추출

```javascript
const writer = new Writer(42, ['log1', 'log2']);

// run - [값, 출력] 튜플
writer.run();   // [42, ['log1', 'log2']]

// exec - 값만
writer.exec();  // 42
```

## Writer 특수 메서드

### Writer.tell - 출력만 추가

```javascript
Writer.tell(['Starting process']).run();
// [undefined, ['Starting process']]

// chain으로 출력만 추가
Writer.of(42)
    .chain(x => Writer.tell([`Processing ${x}`]))
    .chain(_ => Writer.of(100))
    .run();
// [100, ['Processing 42']]
```

### Writer.listen - 출력을 값에 포함

```javascript
const writer = new Writer(42, ['log1', 'log2']);
Writer.listen(writer).run();
// [[42, ['log1', 'log2']], ['log1', 'log2']]
// 값이 [원래값, 출력]으로 변경됨
```

### Writer.listens - 출력 변환하여 값에 포함

```javascript
const writer = new Writer(42, ['a', 'b', 'c']);
Writer.listens(logs => logs.length, writer).run();
// [[42, 3], ['a', 'b', 'c']]
// 값이 [원래값, 로그개수]로 변경됨
```

### Writer.pass - 값의 함수로 출력 변환

```javascript
const writer = new Writer(
    [42, logs => logs.map(l => l.toUpperCase())],
    ['hello', 'world']
);
Writer.pass(writer).run();
// [42, ['HELLO', 'WORLD']]
// 값의 함수를 출력에 적용
```

### Writer.censor - 출력 필터링

```javascript
const writer = new Writer(42, ['secret', 'public', 'debug']);
Writer.censor(
    logs => logs.filter(l => l !== 'secret'),
    writer
).run();
// [42, ['public', 'debug']]
```

## 인스턴스 메서드 (편의 기능)

Static Land 및 Static 메서드 이후에 추가된 편의 메서드입니다.

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

## Monoid 지정

Writer는 Monoid로 출력을 누적합니다. 기본은 Array Monoid입니다.

### 기본 Array Monoid

```javascript
const w1 = new Writer(1, ['log1']);
const w2 = w1.chain(x => new Writer(x + 1, ['log2']));
w2.run();
// [2, ['log1', 'log2']] - concat으로 배열 병합
```

### String Monoid

```javascript
const { Monoid } = FunFP;
const stringMonoid = Monoid.of('string');

const w1 = new Writer(1, 'Hello ', stringMonoid);
const w2 = w1.chain(x => new Writer(x + 1, 'World!', stringMonoid));
w2.run();
// [2, 'Hello World!'] - 문자열 연결
```

### Number Monoid (합산)

```javascript
const { Monoid } = FunFP;
const numberMonoid = Monoid.of('number');

const w1 = new Writer('step1', 10, numberMonoid);
const w2 = w1.chain(x => new Writer('step2', 25, numberMonoid));
w2.run();
// ['step2', 35] - 숫자 합산
```

## 타입 체크

```javascript
Writer.isWriter(Writer.of(5));         // true
Writer.isWriter(new Writer(5, []));    // true
Writer.isWriter([5, []]);              // false (튜플은 Writer 아님)
Writer.isWriter(5);                    // false
```

## 실용적 예시

### 1. 계산 과정 디버깅

```javascript
const { Writer, Chain } = FunFP;
const { chain } = Chain.of('writer');

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

### 2. 실행 히스토리 추적

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

### 3. 감사 로그 생성

```javascript
const { Writer, Monoid } = FunFP;

// 감사 로그 타입
const auditLog = (action, userId, details) => ({
    timestamp: new Date().toISOString(),
    action,
    userId,
    details
});

// Array Monoid로 감사 로그 수집
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

### 4. String Monoid로 텍스트 로그 연결

```javascript
const { Writer, Monoid } = FunFP;
const stringMonoid = Monoid.of('string');

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

### 5. 성능 메트릭 수집

```javascript
const { Writer, Monoid } = FunFP;

// 커스텀 Monoid: 메트릭 병합
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

## 관련 타입 클래스

Writer가 구현하는 타입 클래스:

- **Functor**: `map` - 값 변환, 출력 유지
- **Apply**: `ap` - 함수 적용, 출력 누적
- **Applicative**: `of` - 빈 출력으로 Writer 생성
- **Chain**: `chain` - Writer 연쇄, 출력 누적
- **Monad**: Applicative + Chain

## Writer.pipeK / Writer.composeK

Kleisli 합성으로 Writer를 반환하는 함수들을 조합합니다.

### Writer.pipeK - 왼쪽에서 오른쪽 합성

```javascript
const add5 = x => new Writer(x + 5, ['add 5']);
const double = x => new Writer(x * 2, ['double']);
const toString = x => new Writer(`Result: ${x}`, ['to string']);

const pipeline = Writer.pipeK(add5, double, toString);
const [value, logs] = pipeline(1).run();
// value: 'Result: 12'
// logs: ['add 5', 'double', 'to string']
```

### Writer.composeK - 오른쪽에서 왼쪽 합성

```javascript
const pipeline = Writer.composeK(toString, double, add5);
const [value, logs] = pipeline(1).run();
// value: 'Result: 12' (동일한 결과)
```

## Writer.lift

다중 인자 함수를 Writer 컨텍스트로 리프트합니다. 출력이 자동으로 누적됩니다.

```javascript
const add = (a, b) => a + b;
const liftedAdd = Writer.lift(add);

const w1 = new Writer(10, ['w1']);
const w2 = new Writer(32, ['w2']);

const [value, logs] = liftedAdd(w1, w2).run();
// value: 42
// logs: ['w1', 'w2']
```

## Writer 사용 패턴

### 언제 Writer를 사용하는가?

**사용하면 좋은 경우:**
1. 계산 과정을 디버깅하고 싶을 때
2. 감사 로그를 순수 함수로 생성하고 싶을 때
3. 성능 메트릭이나 통계를 수집하고 싶을 때
4. 테스트 가능한 로깅이 필요할 때

**사용하지 않아도 되는 경우:**
1. 단순히 콘솔 출력만 필요할 때 (부수 효과가 문제 없는 경우)
2. 로그 양이 매우 많아 메모리 문제가 있을 때
3. 실시간 로그 스트리밍이 필요할 때 (Writer는 run까지 누적)

### Writer vs console.log

| | console.log | Writer |
|---|---|---|
| 순수성 | 부수 효과 | 순수 함수 |
| 테스트 | 어려움 (stdout 캡처) | 쉬움 (출력 검증) |
| 누적 | 불가능 | 자동 (Monoid) |
| 타이밍 | 즉시 출력 | run 시점 출력 |
| 용도 | 개발/디버깅 | 프로덕션 로깅 |

## 관련 문서

**비슷한 타입:**
- [Reader](./Reader.md) - 환경 기반 계산 (입력 측면)
- [State](./State.md) - 상태 변환 모나드

**사용하는 타입 클래스:**
- [Functor](./Functor.md)
- [Apply](./Apply.md)
- [Applicative](./Applicative.md)
- [Chain](./Chain.md)
- [Monad](./Monad.md)

**함께 사용:**
- [Monoid](./Monoid.md) - 출력 누적에 사용 (Array, String, Number 등)
