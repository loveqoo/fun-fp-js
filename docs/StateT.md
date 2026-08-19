# StateT

**상태 전이에 다른 효과를 합성**하는 Monad Transformer

> 이 문서는 Monad Transformer 4종([StateT](./StateT.md) · [EitherT](./EitherT.md) ·
> [ReaderT](./ReaderT.md) · [WriterT](./WriterT.md))의 **공통 개념**도 함께 다룹니다.
> 다른 세 문서는 고유 연산에 집중하고 여기를 참조합니다.

## 개념

[State](./State.md)는 `s -> [a, s]`입니다. 상태를 받아 값과 새 상태를 돌려주지만
**실패하거나 비동기일 수는 없습니다.**

StateT는 그 결과를 다른 모나드 `M`으로 감쌉니다.

```
State  s a   = s -> [a, s]
StateT M s a = s -> M [a, s]
```

`M`이 [Maybe](./Maybe.md)면 "실패할 수 있는 상태 전이", [Task](./Task.md)면 "비동기 상태
전이"가 됩니다. 상태 스레딩은 StateT가 처리하고, 실패나 비동기는 `M`이 처리합니다.

fun-fp-js의 Transformer는 [Free](./Free.md) 모나드 위에 구현되어 있습니다. 프로그램을 먼저
자료구조로 쌓은 뒤 실행 시점에 해석하므로, 체인이 아무리 길어도 **스택 안전**합니다.

## 왜 Transformer인가?

### 문제: 상태와 실패를 수동으로 엮으면 배관이 코드를 덮는다

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// 상태를 넘기면서 실패도 다뤄야 한다
function step1(state) {
    const value = state.count;
    if (value > 10) return null;              // 실패
    return [value * 2, { ...state, count: value + 1 }];
}

function step2(state) {
    const prev = step1(state);
    if (prev === null) return null;           // 실패 전파 — 매 단계 반복
    const [v, s] = prev;
    if (v < 0) return null;
    return [v + 1, { ...s, count: s.count + 1 }];
}

// 단계가 늘어날수록 null 체크와 구조분해가 늘어난다.
// 진짜 로직은 `value * 2` 한 줄인데 나머지가 전부 배관이다.
```

### 해결: 상태 스레딩과 실패 전파를 타입에 맡긴다

```javascript
const { StateT, Maybe } = FunFP;

const ST = StateT('maybe');

const step = ST.get
    .chain(n => (n > 10 ? ST.lift(Maybe.Nothing()) : ST.of(n * 2)))
    .chain(v => ST.modify(s => s + 1).chain(() => ST.of(v)));

console.log(JSON.stringify(ST.runState(3, step).value));   // [6, 4]
console.log(ST.runState(20, step).isNothing());            // true — 즉시 중단
```

`chain`만 이어붙이면 됩니다. 상태는 자동으로 흐르고, `Nothing`이 나오는 순간 나머지 단계는
실행되지 않습니다.

## M은 문자열로 넘긴다

**이 항목은 4종 Transformer 모두에 해당합니다.**

`StateT('maybe')`처럼 **문자열**로 만드십시오. 데이터 타입 객체를 넘기면 타입명이
실행 순서에 따라 달라집니다.

| 호출 | `_typeName` | 레지스트리 alias |
| --- | --- | --- |
| `StateT('maybe')` | `StateT(Maybe)` | `statet(maybe)` |
| `StateT(Maybe)` | `StateT(M1)` | `statet(m1)` — 실행 순서에 따라 달라짐 |

객체에는 `type` 프로퍼티가 없어 `M1`, `M2`... 가 순서대로 붙기 때문입니다
(`index.js`의 `resolveMonadType`).

그리고 **두 형태는 서로 다른 클래스입니다.** nominal typing이 강제되므로 섞으면 실패합니다.

```javascript
const { StateT, Maybe } = FunFP;

const A = StateT('maybe');   // StateT(Maybe)
const B = StateT(Maybe);     // StateT(M1)

console.log(A === B);                  // false — 다른 클래스
console.log(A.of(1)._typeName);        // 'StateT(Maybe)'
console.log(B.of(1)._typeName);        // 'StateT(M1)'

try {
    A.runState(0, B.of(1));            // 섞으면 거부된다
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

문자열로 만들면 타입 클래스 레지스트리에서도 찾을 수 있습니다.

```javascript
const { StateT, Functor, Monad } = FunFP;

StateT('maybe');   // 등록을 유발한다

console.log(typeof Functor.lookup('statet(maybe)').map);   // 'function'
console.log(typeof Monad.lookup('statet(maybe)').chain);   // 'function'
```

같은 인자로 다시 부르면 **같은 인스턴스**가 나옵니다(캐시).

```javascript
const { StateT } = FunFP;

console.log(StateT('maybe') === StateT('maybe'));   // true
```

## 공통 구조 (4종 공통)

Transformer는 모두 세 가지를 제공합니다.

| 연산 | 뜻 |
| --- | --- |
| `of(a)` | 순수한 값을 Transformer 안으로 |
| `lift(ma)` | **밑에 깔린 모나드 `M`의 값**을 Transformer 안으로 |
| `chain(f)` | 다음 단계로 잇기 |

`of`와 `lift`의 차이가 핵심입니다 — `of`는 평범한 값을, `lift`는 이미 `M`에 담긴 값을 받습니다.

```javascript
const { StateT, Maybe } = FunFP;

const ST = StateT('maybe');

// of: 그냥 값
console.log(JSON.stringify(ST.runState(0, ST.of(42)).value));        // [42, 0]

// lift: Maybe에 담긴 값 — Nothing이면 전체가 Nothing
console.log(JSON.stringify(ST.runState(0, ST.lift(Maybe.Just(42))).value));  // [42, 0]
console.log(ST.runState(0, ST.lift(Maybe.Nothing())).isNothing());           // true
```

`chain` 콜백이 같은 Transformer 인스턴스를 돌려주지 않으면 거부됩니다.

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

try {
    ST.runState(0, ST.of(1).chain(() => 42));   // Transformer가 아닌 값
} catch (e) {
    console.log(e.constructor.name);            // TypeError
}
```

## 생성

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');    // 실패할 수 있는 상태 전이
const STT = StateT('task');    // 비동기 상태 전이

console.log(ST.of(1)._typeName);    // 'StateT(Maybe)'
console.log(STT.of(1)._typeName);   // 'StateT(Task)'
```

## 주요 연산

### get - 현재 상태 읽기

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

console.log(JSON.stringify(ST.runState(7, ST.get).value));   // [7, 7]
```

값과 상태가 모두 `7`입니다 — `get`은 상태를 결과로도 내놓습니다.

### put - 상태 교체

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

console.log(JSON.stringify(ST.runState(0, ST.put(10)).value));   // [null, 10]
```

### modify - 상태 변환

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

console.log(JSON.stringify(ST.runState(3, ST.modify(s => s * 2)).value));   // [null, 6]
```

### gets - 상태에서 값 뽑기

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

console.log(JSON.stringify(ST.runState(5, ST.gets(s => s + 10)).value));   // [15, 5]
```

상태는 그대로 두고 파생 값만 꺼냅니다.

### runState / eval / exec - 실행

세 가지 실행 방식이 있습니다. 인스턴스 메서드 `run`/`eval`/`exec`도 같습니다.

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');
const program = ST.get.chain(n => ST.put(n + 1).chain(() => ST.of(n * 10)));

console.log(JSON.stringify(ST.runState(5, program).value));   // [50, 6] — 값과 상태 둘 다
console.log(JSON.stringify(program.run(5).value));            // [50, 6] — 인스턴스 메서드
console.log(JSON.stringify(program.eval(5).value));           // 50 — 값만
console.log(JSON.stringify(program.exec(5).value));           // 6  — 상태만
```

## 타입 체크

`runState`에 다른 타입을 주면 거부됩니다.

```javascript
const { StateT } = FunFP;

const ST = StateT('maybe');

try {
    ST.runState(0, 42);
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## 실용적 예시

### 1. 실패할 수 있는 재고 차감

상태(재고)를 옮기면서 부족하면 전체를 중단합니다.

```javascript
const { StateT, Maybe } = FunFP;

const ST = StateT('maybe');

const take = n => ST.get.chain(stock =>
    stock < n
        ? ST.lift(Maybe.Nothing())               // 재고 부족 — 여기서 끝
        : ST.put(stock - n).chain(() => ST.of(n))
);

const order = take(3).chain(a => take(5).chain(b => ST.of(a + b)));

// 재고 10: 3 + 5 = 8개 출고, 2개 남음
console.log(JSON.stringify(order.run(10).value));   // [8, 2]

// 재고 6: 3개는 되지만 5개에서 실패 — 상태 변화도 남지 않는다
console.log(order.run(6).isNothing());              // true
```

두 번째 줄이 중요합니다 — 중간에 실패하면 **부분 갱신이 새어나오지 않습니다.**

### 2. 비동기 상태 전이 (StateT + Task)

`M`을 Task로 바꾸면 같은 코드가 비동기가 됩니다.

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
console.log('총 길이', total, '/ 호출 횟수', calls);   // 총 길이 20 / 호출 횟수 2
```

### 3. 파서 상태 (남은 입력을 상태로)

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
console.log(three.run('ab').isNothing());               // true — 입력 부족
```

### 4. ID 생성기

상태를 카운터로 쓰면 순수 함수로 고유 ID를 만들 수 있습니다.

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

`reduce`로 프로그램을 쌓아도 안전합니다 — Free 기반이라 스택이 터지지 않습니다.

## 관련 타입 클래스

- [State](./State.md) - `M` 없는 원형. 효과가 필요 없으면 State가 더 간단합니다.
- [Free](./Free.md) - Transformer의 내부 표현. 스택 안전성이 여기서 나옵니다.
- [Monad](./Monad.md) - `Monad.lookup('statet(maybe)')`로 얻을 수 있습니다(문자열 형태로 만든 경우).
- [EitherT](./EitherT.md) · [ReaderT](./ReaderT.md) · [WriterT](./WriterT.md) - 나머지 3종.
- [Actor](./Actor.md) - 상태 전이에 큐와 순차 실행 보장이 필요하다면 이쪽입니다.
