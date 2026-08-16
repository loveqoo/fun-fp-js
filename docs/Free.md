# Free Monad

**스택 안전한 재귀와 DSL 구축을 위한 모나드**

## 개념

Free Monad는 **연산을 데이터로 표현**하여 나중에 해석할 수 있게 합니다.
주요 용도:
- 스택 안전한 재귀 (trampoline)
- DSL(Domain Specific Language) 구축
- 효과 분리

## 핵심 구조

```javascript no-run 구조·API 표기
Pure(value)     // 완료된 값
Impure(functor) // 다음 연산을 담은 컨테이너
```

## 사용 예시

### 스택 안전 재귀 (trampoline)

```javascript
import FunFP from 'fun-fp-js';
const { Free, trampoline } = FunFP;
const { Thunk } = Free;

// 재귀 합계 - 스택 오버플로우 없음!
const sum = n => {
    const go = (n, acc) => n <= 0
        ? Thunk.done(acc)
        : Thunk.suspend(() => go(n - 1, acc + n));
    return trampoline(go(n, 0));
};

sum(10000);  // 50005000 (스택 오버플로우 없음!)
```

### 피보나치 (trampoline)

```javascript
const { Thunk } = Free;
const fib = n => {
    const go = (n, a, b) => n <= 0
        ? Thunk.done(a)
        : Thunk.suspend(() => go(n - 1, b, a + b));
    return trampoline(go(n, 0, 1));
};

fib(100);  // 354224848179262000000
```

## Free.dsl — 3층의 1층 {#dsl}

**Free 를 몰라도 씁니다.** 어휘를 선언하면 명령 함수들이 나오고, 익숙한 `chain`/`map` 으로
프로그램을 짜고, 해석기를 몇 벌이든 꽂아 실행합니다 — 프로그램 정의와 실행이 완전히
분리됩니다. liftF·Functor·심볼은 라이브러리가 대신합니다(아래 Advanced 절이 그 속입니다).

```javascript
const { Free, Task } = FunFP;

// 1. 어휘 선언 — 이름이 전부. 이종 기능(조회·질문·출력…)이 한 어휘에 섞인다.
const api = Free.dsl('getUser', 'getPosts', 'saveUser');

// 2. 프로그램 — 평범한 chain/map. 이 시점엔 아무것도 실행되지 않는다.
const program = api.getUser(1)
    .chain(user => api.getPosts(user.id)
        .chain(posts => api.saveUser({ name: user.name, count: posts.length })))
    .map(saved => '저장: ' + saved.name + '/' + saved.count);

// 3. 해석기 — 몇 벌이든. 핸들러는 인자를 그대로 받고 값 | Promise | Task 를 반환한다.
const db = { users: { 1: { id: 1, name: 'anthony' } }, posts: { 1: [{}, {}] } };
const real = api.interpreter({
    getUser: id => Promise.resolve(db.users[id]),   // Promise 도
    getPosts: userId => Task.of(db.posts[userId]),  // Task 도
    saveUser: user => user,                          // 그냥 값도
});
const mock = api.interpreter({
    getUser: () => ({ id: 0, name: 'MOCK' }),
    getPosts: () => [],
    saveUser: user => user,
});

// 4. 실행 — 같은 프로그램, 다른 세계
real.run(program).then(r => {
    if (r !== '저장: anthony/2') throw new Error('실전 해석이 틀렸다: ' + r);
    console.log(r);                                  // 저장: anthony/2
});
mock.run(program).then(r => {
    if (r !== '저장: MOCK/0') throw new Error('mock 해석이 틀렸다: ' + r);
    console.log(r);                                  // 저장: MOCK/0
});
```

- 해석기는 **만들 때** 어휘와 대조됩니다 — 핸들러가 빠지거나(`missing handler`) 어휘에 없는
  이름이 있으면(`unknown command`) 그 자리에서 던집니다. 실행 중 조용히 터지지 않습니다.
- 명령 이름은 `toString` 같은 프로토타입 이름이어도 안전합니다(내부가 null-프로토타입).
- 다른 dsl 의 명령을 섞은 프로그램은 막지 않되, 모르는 해석기의 `run` 에서
  `no handler for '<이름>'` 으로 거부됩니다.
- 인자는 위치 그대로 핸들러에 전달됩니다 — 명령의 시그니처는 핸들러 시그니처가 말합니다.

## API

### Free.dsl(...names)
어휘 선언 → 명령 함수 묶음 + `interpreter(handlers)` → `{ run(program) }`. 위 절 참조.

### Free.pure(value)
값을 Pure로 감쌈.

### Free.impure(functor)
Functor를 Impure로 감쌈.

### Free.liftF(command)
일반 Functor를 Free로 변환.

### trampoline(free)
Free 구조를 동기적으로 실행.

### Free.runSync(runner)
커스텀 runner로 Free 실행 (동기).

### Free.runAsync(runner)
커스텀 runner로 Free 실행 (비동기).

### Free.runWithTask(runner, free)
Task 기반 비동기 실행. runner가 Task를 반환할 때 사용하며, Promise를 반환하여 async/await 호환성을 제공합니다.

**Advanced — `Free.dsl` 이 대신 해 주는 일.** 아래는 dsl 없이 직접 명령 함자를 만드는
방법입니다. `Free.dsl` 의 속이 바로 이것이므로, 보통은 쓸 일이 없습니다 — 명령이 자체
로직을 가진 함자여야 하는 특수한 경우의 문입니다.

```javascript no-run 네트워크 호출 — 실행 대상 아님
import FunFP from 'fun-fp-js';
const { Free, Task } = FunFP;

// 1. DSL 정의 - 명령 타입
// liftF 는 명령이 Functor 임을 요구한다 — map 과 Functor 심볼이 있어야 한다.
const FunctorSymbol = Symbol.for('fun-fp-js/Functor');

class FetchCmd {
    constructor(url) {
        this.url = url;
    }
    map(f) { return this; }   // 명령 자체는 값을 담지 않으므로 그대로
}
FetchCmd.prototype[FunctorSymbol] = true;

class LogCmd {
    constructor(message) {
        this.message = message;
    }
    map(f) { return this; }
}
LogCmd.prototype[FunctorSymbol] = true;

// 2. Task 기반 인터프리터 (runner)
const interpreter = cmd => {
    if (cmd instanceof FetchCmd) {
        return Task.fromPromise(() =>
            fetch(cmd.url).then(r => r.json())
        )();
    }
    if (cmd instanceof LogCmd) {
        return Task.of(console.log(cmd.message));
    }
    return Task.rejected(new Error('Unknown command'));
};

// 3. Free 프로그램 작성
const program = Free.liftF(new FetchCmd('/api/users/1'))
    .chain(user => Free.liftF(new LogCmd(`User: ${user.name}`)))
    .chain(_ => Free.liftF(new FetchCmd(`/api/posts/${user.id}`)))
    .chain(posts => Free.pure({ user, posts }));

// 4. async/await로 실행
(async () => {
    try {
        const result = await Free.runWithTask(interpreter, program);
        console.log('Result:', result);
    } catch (err) {
        console.error('Error:', err);
    }
})();

// 또는 Promise then/catch
Free.runWithTask(interpreter, program)
    .then(result => console.log('Result:', result))
    .catch(err => console.error('Error:', err));
```

**runWithTask vs runAsync:**
- `runAsync`: 콜백 기반 (`(err, result) => ...`)
- `runWithTask`: Promise 반환 (async/await 사용 가능)

**사용 시나리오:**
1. HTTP 요청 DSL (fetch 래핑)
2. 파일 시스템 연산 DSL
3. 데이터베이스 쿼리 DSL
4. 모든 비동기 효과를 순수하게 표현

```javascript no-run 네트워크 호출 — 실행 대상 아님
// 실용적 예시: API 조합
// liftF 는 명령이 Functor 임을 요구한다 (위 예시 참조).
const FunctorSymbol = Symbol.for('fun-fp-js/Functor');

class GetUser {
    constructor(id) { this.id = id; }
    map(f) { return this; }
}
GetUser.prototype[FunctorSymbol] = true;

class GetPosts {
    constructor(userId) { this.userId = userId; }
    map(f) { return this; }
}
GetPosts.prototype[FunctorSymbol] = true;

const runAPI = cmd => {
    if (cmd instanceof GetUser) {
        return Task.fromPromise(() =>
            fetch(`/api/users/${cmd.id}`).then(r => r.json())
        )();
    }
    if (cmd instanceof GetPosts) {
        return Task.fromPromise(() =>
            fetch(`/api/users/${cmd.userId}/posts`).then(r => r.json())
        )();
    }
};

const getUserWithPosts = userId =>
    Free.liftF(new GetUser(userId))
        .chain(user =>
            Free.liftF(new GetPosts(user.id))
                .map(posts => ({ user, posts }))
        );

// Promise 기반 실행
await Free.runWithTask(runAPI, getUserWithPosts(1));
```

## Thunk 헬퍼

```javascript no-run 구조·API 표기
const { Thunk } = Free;

Thunk.of(value)       // 지연된 값
Thunk.done(value)     // 완료 (Pure 반환)
Thunk.suspend(thunk)  // 다음 단계 (Impure 반환)
```

## Functor/Chain 사용

```javascript
const { Functor, Chain } = FunFP;

// map
Functor.lookup('free').map(x => x + 1, Free.pure(5));  // Pure(6)

// chain
Chain.lookup('free').chain(x => Free.pure(x * 2), Free.pure(5));  // Pure(10)
```

## 관련 타입 클래스

- **Functor**: map으로 값 변환
- **Chain**: chain으로 순차 연결
- **Monad**: 완전한 모나드 인터페이스
