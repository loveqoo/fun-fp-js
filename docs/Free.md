# Free

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

### 규칙 — 조용히 틀리지 않는다

| 언제 | 무엇 | 결과 |
| --- | --- | --- |
| `interpreter(handlers)` 만들 때 | 핸들러 누락 / 어휘에 없는 이름(오타) | 이름을 지목하며 즉시 던짐 |
| `run` 실행 중 | 다른 `Free.api` 의 명령이 섞임 | `no handler for '<이름>'` 으로 거부 |
| `run` 실행 중 | 핸들러가 던짐 / Promise 거부 | 그대로 거부(reject) — 삼켜지지 않음 |

명령 이름은 `toString` 같은 프로토타입 이름이어도 안전합니다. 핸들러가 받는 인자는
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
| `Free.api(...names)` | 1층 | 어휘 선언 → 명령 함수 묶음 + `interpreter(handlers)` → `{ run }` |
| `Free.pipeK(...fns)` / `composeK` | 2층 | Kleisli 단계 합성 |
| `Free.of` / `Free.pure(value)` | 3층 | `Pure` 생성 |
| `Free.liftF(functor)` / `Free.impure(functor)` | 3층 | 명령 함자 → `Impure` |
| `Free.isPure` / `isImpure` / `isFree` | 3층 | 변형 판별 |
| `Free.runSync/runAsync/runWithTask(runner)(p)` | 3층 | 러너 — 전부 커리드 |
| `Free.Thunk` · `trampoline` | 3층 | 스택 안전 재귀 |

## 관련 타입 클래스

- **[Functor](./Functor.md)** — `map` · **[Chain](./Chain.md)** — `chain` ·
  **[Monad](./Monad.md)** — 완전한 순차 패턴
- 트랜스포머 4종은 Free 위에 구현되어 있습니다. [StateT](./StateT.md) 문서부터 읽으면 됩니다.
