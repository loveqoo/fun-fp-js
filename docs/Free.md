# Free

> English: [./en/Free.md](./en/Free.md)

**Free 는 프로그램을 데이터로 표현합니다. 실행 방법은 사용자가 나중에 정합니다.**

무엇을 할지(프로그램)와 어떻게 할지(해석기)를 분리하면, 사용자는 같은 프로그램을
실전·mock·계획 확인 등 여러 방식으로 실행할 수 있습니다. 이 문서는 사용에 필요한
내용부터 보여주고, 내부 구조는 3층에서 설명합니다. 1층만 읽어도 `Free.api` 를
사용할 수 있습니다.

---

## 1층 — `Free.api` 로 시작 {#api}

Free 를 몰라도 됩니다. 사용자는 명령의 이름(어휘)을 선언하고, 익숙한 `chain`/`map`
으로 프로그램을 만들고, 해석기를 연결해 실행합니다.

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

객체지향에 익숙하다면 이렇게 읽어도 됩니다. `Free.api` 는 인터페이스 선언이고,
해석기는 구현체 주입(DI)입니다. 다른 점은 하나입니다. 객체지향에서는 인터페이스 호출이
즉시 실행되지만, Free 에서는 호출 정보가 데이터(프로그램)로 남기 때문에 사용자가
실행할 때마다 다른 구현을 선택할 수 있습니다.

해석기는 몇 벌이든 만들 수 있습니다. 같은 프로그램을 다른 환경에서 그대로 실행할 수
있다는 것이 이 분리의 이점입니다.

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

## 2층 — 조금 더 쓰다 보면

### 프로그램은 값이다

`api.x(...)` 가 돌려주는 것은 평범한 값입니다. 사용자는 이 값을 변수에 담고, 함수로
감싸고, 몇 번이든 다시 실행할 수 있습니다. 큰 프로그램은 `Free.pipeK` 로 단계를 나누면
위에서 아래로 읽힙니다.

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

### 계획 보기 — 실행 없이 "무엇을 할지"

실행 대신 기록만 하는 해석기를 연결하면, 프로그램이 무엇을 할지를 실행 전에 데이터로
확인할 수 있습니다. 이것은 별도 기능이 아니라 해석기 교체의 한 사용법입니다.

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

### 여러 api 를 한 프로그램에서 — `Free.interpreters`

각 모듈이 자기 어휘를 따로 선언해도, 프로그램은 이미 섞을 수 있습니다 — 모든 api
프로그램이 같은 Free 값이라서 `chain` 이 그냥 잇습니다. 막히는 것은 실행뿐입니다.
해석기는 자기 어휘만 알기 때문입니다. `Free.interpreters` 는 여러 해석기를 하나로
합칩니다. 명령마다 자기 api 의 표식을 보고 명부를 고르므로 이름이 같은 명령이 있어도
섞이지 않고, 같은 api 의 해석기를 두 번 넣으면 만들 때 즉시 던집니다.

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

합성한 결과도 해석기이므로 다시 합칠 수 있고, 어느 명부에도 없는 api 의 명령은
단일 해석기와 같은 문안(`no handler for '<이름>'`)으로 거부됩니다. 그 이름을 다른
api 도 쓰고 있다면 문안에 원인 절이 덧붙습니다 — 명령을 소유한 api 의 해석기가
이 합성에 없다는 뜻입니다.

### 실행 취소 — `start`

`run` 은 결과만 돌려주지만, `start` 는 실행을 도중에 그만둘 손잡이를 함께 돌려줍니다.
`cancel()` 을 부르면 **다음 명령 경계에서** 실행이 멈춥니다 — 진행 중이던 핸들러는
마저 완료되지만 그 결과는 버려지고(뒤따르는 순수 단계도 실행되지 않음), 남은 명령들은
시작되지 않습니다. 취소된 실행은 `'Free.api.run: cancelled'` 문안과
`cancelled === true` 표식을 지닌 거부로 도착하므로, 호출자는 실패와 취소를 필드
하나로 가릅니다. 이미 끝난 실행의 `cancel` 은 아무 일도 하지 않고, 동기적으로
완주하는 프로그램은 취소할 틈이 없습니다. 취소와 비행 중 실패가 겹치면 **실패가
그대로 도착합니다** — 취소는 앞으로의 일을 막는 것이지, 이미 난 결과를 바꾸지 않습니다.

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

주의 둘. 사용자 코드가 `cancelled: true` 를 지닌 에러를 직접 만들면 이 구분이
무너지므로 만들지 마십시오. 그리고 취소는 **비행 중인 요청 자체를 끊지 않습니다** —
그것은 핸들러의 몫이라, 필요하면 핸들러의 `AbortController` 를 `cancel` 과 함께
사용자가 직접 배선합니다(자동으로 이어지지 않습니다).

### Reader·Writer·State 와 함께 쓰기

Free 프로그램에서 진짜 부수 효과는 해석기 안에서만 일어납니다. 그런데 효과와 효과 사이의
순수한 계산에도 흐름이 세 갈래 있습니다 — 밖에서 주입받는 설정, 단계마다 이어지는 상태,
쌓이기만 하는 기록. 이 세 갈래를 [Reader](./Reader.md)·[State](./State.md)·
[Writer](./Writer.md)가 각각 맡습니다.

| 필요한 것 | 도구 | 성격 |
| --- | --- | --- |
| 설정 주입 | [Reader](./Reader.md) | 순수 — 읽기만 한다 |
| 상태 유지 | [State](./State.md) | 순수 — 읽고 쓰며 잇는다 |
| 기록 누적 | [Writer](./Writer.md) | 순수 — 값으로 쌓기만 한다 |
| 진짜 부수 효과 | 어휘 명령 + 해석기 | 유일하게 불순한 자리 — 그래서 갈아끼울 수 있다 |

아래 예제는 주문 하나를 처리합니다. 프로그램은 가격 조회와 결제를 서술만 하고, 조회된
가격이 손에 들어온 순수 구간에서 Reader 가 할인율을 주입받고, State 가 합계를 0부터
잇고, Writer 가 과정을 기록합니다. 로그가 화면에 찍히는 일도 돈이 나가는 일도 전부
해석기 안에서만 일어납니다.

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

설정을 `{ discount: 0.5 }` 로 바꾸면 같은 프로그램이 6750원을 결제합니다 — 설정이
프로그램 밖에 있기 때문입니다. `exec` 는 State 와 Writer 에서 같은 의미입니다: 계산의
부산물(최종 상태, 로그)을 돌려줍니다.

### 규칙 — 조용히 틀리지 않는다

| 언제 | 무엇 | 결과 |
| --- | --- | --- |
| `interpreter(handlers)` 만들 때 | 핸들러 누락 / 어휘에 없는 이름(오타) | 이름을 지목하며 즉시 던짐 |
| `run` 실행 중 | 다른 `Free.api` 의 명령이 섞임 | `no handler for '<이름>'` 으로 거부 |
| `run` 실행 중 | 핸들러가 던짐 / Promise 거부 | 그대로 거부(reject) — 삼켜지지 않음 |

**거부는 비동기 뒤의 걸음에서도 샙니다.** 첫 걸음은 `Promise` 생성자가 던진 것을 거부로
바꿔 주지만, 비동기 명령이 끝난 뒤에 이어지는 걸음은 그 밖에서 돕니다 — 그래서 러너가
걸음마다 따로 감쌉니다. 감싸지 않으면 그 예외는 아무도 못 받는 곳으로 사라집니다.

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

명령 이름은 `toString` 같은 프로토타입 이름이어도 안전합니다 — 어휘·명령·핸들러 테이블이
전부 프로토타입 없는 객체이고 자기 소유 필드만 봅니다.

```javascript
const { Free } = FunFP;

const api = Free.api('toString', 'hasOwnProperty');
const it = api.interpreter({ toString: () => 'T', hasOwnProperty: () => 'H' });

it.run(api.toString()).then(v => console.log(v));         // 'T'
it.run(api.hasOwnProperty()).then(v => console.log(v));   // 'H'
```

핸들러가 받는 인자는
호출한 그대로입니다(위치 인자). 반환값의 타입 검증이 필요하면 프로그램의 순수 단계
(`.map(v => …검사…)`)나 핸들러 안에서 사용자가 직접 합니다. 어떤 값이 옳은지는
라이브러리가 아니라 각 도메인이 알기 때문입니다.

---

## 3층 — 내부: Free 그 자체

여기부터는 `Free.api` 의 내부 구조입니다. `Free.api` 를 쓰는 데는 필요 없고,
내부가 어떻게 동작하는지 알고 싶을 때 읽습니다.

### Pure / Impure — Free 의 두 생성자

모든 Free 값은 둘 중 하나입니다. `Maybe` 의 `Just`/`Nothing` 과 같은 지위입니다.

```javascript no-run 구조·API 표기
Pure(value)      // 잎: 완료된 값.       Free.of / Free.pure 가 만든다
Impure(functor)  // 가지: 다음 연산을 담은 명령 함자. Free.liftF / Free.impure 가 만든다
```

`Free.api` 의 프로그램도, 트랜스포머 4종(`StateT`·`EitherT`·`ReaderT`·`WriterT`)의
내부도, 아래 트램펄린도 전부 이 두 생성자로 만들어져 있습니다. 러너들은 `isPure`/`isImpure`
로 이 트리를 순회하며 해석합니다.

### 러너 셋 — 모두 커리드

```javascript no-run 구조·API 표기
Free.runSync(runner)(program)      // 동기. runner 가 명령을 받아 값(또는 다음 Free)을 반환
Free.runAsync(runner)(program)     // Promise 반환. runner 가 값 또는 Promise 반환
Free.runWithTask(runner)(program)  // Promise 반환. runner 가 Task 반환 — Free.api.run 의 바닥
```

### liftF 와 커스텀 명령 함자 — `Free.api` 가 대신 해 주는 일

`liftF` 는 명령이 Functor(연속을 합성하는 `map` + 내부 심볼)일 것을 요구합니다.
`Free.api` 는 법칙을 지키는 명령 함자를 내부에서 만들어 이 요구를 대신 충족합니다.
사용자가 명령 함자를 직접 만들 일은, 명령이 자체 로직을 가진 함자여야 하는 특수한
경우뿐입니다.

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

### Thunk 와 trampoline — 스택 안전 재귀

`trampoline` 은 `Free.runSync(thunk => thunk.run())` 을 미리 정의해 둔 함수입니다.
깊은 재귀를 스택 소모 없이 실행합니다.

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

### 등록 인스턴스

Free 는 `Functor`/`Apply`/`Applicative`/`Chain`/`Monad` 다섯 타입 클래스에 `'free'`
라는 이름으로 등록돼 있습니다. 법칙 테스트가 이 다섯 인스턴스를 검증합니다.

```javascript
const { Free, Functor, Chain } = FunFP;

console.log(Functor.lookup('free').map(x => x + 1, Free.pure(5)).value);              // 6
console.log(Chain.lookup('free').chain(x => Free.pure(x * 2), Free.pure(5)).value);   // 10
```

---

## API 참조

| 문 | 레벨 | 무엇 |
| --- | --- | --- |
| `Free.api(...names)` | 1층 | 어휘 선언 → 명령 함수 묶음 + `interpreter(handlers)` → `{ run, start }` |
| `해석기.start(program)` | 2층 | 취소 손잡이 `{ promise, cancel }` — 다음 명령 경계에서 발효 |
| `Free.interpreters(...its)` | 2층 | 여러 api 의 해석기를 하나로 — 표식으로 라우팅 |
| `Free.pipeK(...fns)` / `composeK` | 2층 | Kleisli 단계 합성 |
| `Free.of` / `Free.pure(value)` | 3층 | `Pure` 생성 |
| `Free.liftF(functor)` / `Free.impure(functor)` | 3층 | 명령 함자 → `Impure` |
| `Free.isPure` / `isImpure` / `isFree` | 3층 | 변형 판별 |
| `Free.runSync/runAsync/runWithTask(runner)(p)` | 3층 | 러너 — 전부 커리드 |
| `Free.Thunk` · `trampoline` | 3층 | 스택 안전 재귀 |

## 관련 타입 클래스

- **[Functor](./Functor.md)** — `map` · **[Chain](./Monad.md)** — `chain` ·
  **[Monad](./Monad.md)** — 완전한 순차 패턴
- 트랜스포머 4종은 Free 위에 구현되어 있습니다. [StateT](./StateT.md) 문서부터 읽으면 됩니다.
