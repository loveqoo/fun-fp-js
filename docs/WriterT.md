# WriterT

**출력 누적에 다른 효과를 합성**하는 Monad Transformer

> Transformer 4종의 공통 개념(`of`/`lift`, 문자열 M 규칙, Free 기반 스택 안전성)은
> [StateT](./StateT.md) 문서에 정리되어 있습니다. 여기서는 WriterT 고유 연산을 다룹니다.

## 개념

[Writer](./Writer.md)는 `[a, log]`입니다. 값을 계산하면서 로그를 함께 누적하지만
**실패하거나 비동기일 수는 없습니다.**

WriterT는 그 결과를 다른 모나드 `M`으로 감쌉니다.

```
Writer    w a = [a, w]
WriterT M w a = M [a, w]
```

로그를 어떻게 합칠지는 [Monoid](./Monoid.md)가 정합니다 — 기본은 Array(이어붙이기)이고,
String(문자열 연결)이나 Number(합산)로 바꿀 수 있습니다.

`console.log`와 다른 점은 **로그가 반환값의 일부**라는 것입니다. 부수효과가 아니므로
테스트에서 그대로 검사할 수 있습니다.

## 왜 WriterT인가?

### 문제: 계산 과정을 남기려면 부수효과를 쓰거나 배관을 늘려야 한다

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// 방법 1: console.log — 테스트에서 잡아내기 어렵고 순수하지 않다
function calculate(x) {
    console.log(`입력 ${x}`);
    const doubled = x * 2;
    console.log(`두 배 ${doubled}`);
    return doubled;
}

// 방법 2: 로그를 손으로 나른다 — 모든 함수의 시그니처가 오염된다
function calculate(x, log) {
    const newLog = [...log, `입력 ${x}`];
    const doubled = x * 2;
    return [doubled, [...newLog, `두 배 ${doubled}`]];
}
// 호출부마다 [값, 로그] 구조분해와 병합이 필요하다
```

### 해결: 로그 누적을 타입에 맡긴다

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

로그가 반환값이므로 **단언할 수 있습니다.** 계산 함수는 여전히 순수합니다.

## M은 문자열로 넘긴다

**Transformer 4종 공통 규칙입니다.** `WriterT('task')`처럼 문자열로 만드십시오.
객체를 넘기면 타입명이 `WriterT(M1,Array)`처럼 실행 순서에 따라 달라지고, 두 형태는 서로
다른 클래스가 되어 섞어 쓸 수 없습니다. 자세한 내용은
[StateT](./StateT.md#m은-문자열로-넘긴다)를 보십시오.

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

## 생성

`WriterT(M, monoid)` — monoid를 생략하면 Array입니다.

```javascript
const { WriterT, Monoid } = FunFP;

const WA = WriterT('maybe');                          // Array (기본)
const WS = WriterT('maybe', Monoid.lookup('string'));     // String
const WN = WriterT('maybe', Monoid.lookup('number'));     // Number (합산)

console.log(WA.of(1)._typeName);   // 'WriterT(Maybe,Array)'
console.log(WS.of(1)._typeName);   // 'WriterT(Maybe,string)'
console.log(WN.of(1)._typeName);   // 'WriterT(Maybe,number)'
```

같은 `(M, monoid)` 조합은 캐시되어 같은 인스턴스가 나옵니다.

```javascript
const { WriterT } = FunFP;

console.log(WriterT('maybe') === WriterT('maybe'));   // true
```

Monoid 자격을 갖추지 못한 객체는 거부됩니다.

```javascript
const { WriterT } = FunFP;

try {
    WriterT('maybe', { concat: (a, b) => a });   // empty가 없다
} catch (e) {
    console.log(e.constructor.name);             // TypeError
}
```

## 주요 연산

### tell - 출력 남기기

값은 내놓지 않고 로그만 쌓습니다.

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');
const [value, log] = WT.runWriterT(WT.tell(['첫 줄']).chain(() => WT.tell(['둘째 줄']))).value;

console.log(value);   // null
console.log(log);     // ['첫 줄', '둘째 줄']
```

### of - 로그 없이 값만

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');
const [value, log] = WT.runWriterT(WT.of(42)).value;

console.log(value, JSON.stringify(log));   // 42 []
```

`log`가 빈 배열입니다 — Monoid의 항등원입니다.

### runWriterT - 실행

`M`에 감싸인 `[값, 로그]`를 돌려줍니다.

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');
const result = WT.runWriterT(WT.tell(['a']).chain(() => WT.of(7)));

console.log(result._typeName);              // 'Maybe'
console.log(JSON.stringify(result.value));  // [7,["a"]]
```

### lift - 밑에 깔린 M의 값 끌어오기

```javascript
const { WriterT, Maybe } = FunFP;

const WT = WriterT('maybe');

console.log(JSON.stringify(WT.runWriterT(WT.lift(Maybe.Just(9))).value));   // [9,[]]
console.log(WT.runWriterT(WT.lift(Maybe.Nothing())).isNothing());           // true
```

`Nothing`이면 **쌓아둔 로그까지 함께 사라집니다** — `M`의 실패가 전체를 삼킵니다.

```javascript
const { WriterT, Maybe } = FunFP;

const WT = WriterT('maybe');

const program = WT.tell(['시작'])
    .chain(() => WT.lift(Maybe.Nothing()))
    .chain(() => WT.tell(['끝']));

console.log(WT.runWriterT(program).isNothing());   // true — '시작' 로그도 남지 않는다
```

로그를 반드시 보존해야 한다면 `M`을 실패하지 않는 것으로 두거나, 실패를 값으로
표현하십시오([Either](./Either.md)를 값 쪽에 담는 식).

## Monoid 바꾸기

### String - 텍스트 로그

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

### Number - 비용·횟수 합산

로그가 꼭 텍스트일 필요는 없습니다. 합산 가능한 무엇이든 됩니다.

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

## 타입 체크

```javascript
const { WriterT } = FunFP;

const WT = WriterT('maybe');

try {
    WT.runWriterT(42);
} catch (e) {
    console.log('runWriterT:', e.constructor.name);   // TypeError
}

try {
    WT.runWriterT(WT.of(1).chain(() => 42));   // 콜백이 WriterT를 안 돌려줌
} catch (e) {
    console.log('chain callback:', e.constructor.name);   // TypeError
}
```

## 실용적 예시

### 1. 감사 로그가 붙은 계산

무엇이 왜 그렇게 되었는지 결과와 함께 돌려줍니다.

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

로그가 값이므로 테스트에서 `audit`의 내용을 그대로 단언할 수 있습니다.

### 2. 비동기 파이프라인의 실행 추적 (WriterT + Task)

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

### 3. 경고를 모으면서 계속 진행하기

에러와 달리 경고는 흐름을 끊지 않아야 합니다. WriterT가 정확히 그 모양입니다.

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

### 4. 성능 메트릭 수집 (Number Monoid)

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
console.log('총 쿼리 수:', queryCount);   // 6

// N+1 문제 감지 같은 단언을 테스트에서 그대로 쓸 수 있다
console.log('쿼리 10회 미만?', queryCount < 10);
```

## 관련 타입 클래스

- [Writer](./Writer.md) - `M` 없는 원형. `listen`/`censor`/`pass` 같은 추가 연산이 있습니다.
- [Monoid](./Monoid.md) - 로그를 어떻게 합칠지 정합니다. Array / String / Number 외에
  직접 만든 Monoid도 쓸 수 있습니다.
- [StateT](./StateT.md) - Transformer 공통 개념(`of`/`lift`, 문자열 M, 스택 안전성).
  누적만이 아니라 **읽고 쓰는 상태**가 필요하면 이쪽입니다.
- [EitherT](./EitherT.md) · [ReaderT](./ReaderT.md) - 나머지 Transformer.
