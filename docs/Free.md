# Free Monad

**스택 안전한 재귀와 DSL 구축을 위한 모나드**

## 개념

Free Monad는 **연산을 데이터로 표현**하여 나중에 해석할 수 있게 합니다.
주요 용도:
- 스택 안전한 재귀 (trampoline)
- DSL(Domain Specific Language) 구축
- 효과 분리

## 핵심 구조

```javascript
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
const fib = n => {
    const go = (n, a, b) => n <= 0
        ? Thunk.done(a)
        : Thunk.suspend(() => go(n - 1, b, a + b));
    return trampoline(go(n, 0, 1));
};

fib(100);  // 354224848179262000000
```

## API

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

```javascript
import FunFP from 'fun-fp-js';
const { Free, Task } = FunFP;

// 1. DSL 정의 - 명령 타입
class FetchCmd {
    constructor(url) {
        this.url = url;
    }
}

class LogCmd {
    constructor(message) {
        this.message = message;
    }
}

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

```javascript
// 실용적 예시: API 조합
class GetUser {
    constructor(id) { this.id = id; }
}
class GetPosts {
    constructor(userId) { this.userId = userId; }
}

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

```javascript
const { Thunk } = Free;

Thunk.of(value)       // 지연된 값
Thunk.done(value)     // 완료 (Pure 반환)
Thunk.suspend(thunk)  // 다음 단계 (Impure 반환)
```

## Functor/Chain 사용

```javascript
const { Functor, Chain } = FunFP;

// map
Functor.of('free').map(x => x + 1, Free.pure(5));  // Pure(6)

// chain
Chain.of('free').chain(x => Free.pure(x * 2), Free.pure(5));  // Pure(10)
```

## 관련 타입 클래스

- **Functor**: map으로 값 변환
- **Chain**: chain으로 순차 연결
- **Monad**: 완전한 모나드 인터페이스
