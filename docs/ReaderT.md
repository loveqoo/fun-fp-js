# ReaderT

**의존성 주입에 다른 효과를 합성**하는 Monad Transformer

> Transformer 4종의 공통 개념(`of`/`lift`, 문자열 M 규칙, Free 기반 스택 안전성)은
> [StateT](./StateT.md) 문서에 정리되어 있습니다. 여기서는 ReaderT 고유 연산을 다룹니다.

## 개념

[Reader](./Reader.md)는 `env -> a`입니다. 환경(설정, DB 연결, 로거)을 나중에 주입받는
계산이지만 **실패하거나 비동기일 수는 없습니다.**

ReaderT는 그 결과를 다른 모나드 `M`으로 감쌉니다.

```
Reader    env a = env -> a
ReaderT M env a = env -> M a
```

`M`이 [Task](./Task.md)면 "환경을 받는 비동기 계산", [Maybe](./Maybe.md)면 "환경을 받고
실패할 수 있는 계산"이 됩니다. 실제 애플리케이션의 서비스 계층이 대개 이 모양입니다.

## 왜 ReaderT인가?

### 문제: 의존성을 함수마다 수동으로 넘긴다

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// 모든 함수가 config를 받아 아래로 전달한다
function getUser(config, id) {
    return query(config.db, `SELECT * FROM users WHERE id=${id}`);
}

function getUserPosts(config, id) {
    const user = getUser(config, id);          // config 전달
    return query(config.db, `... ${user.id}`); // 또 전달
}

function renderProfile(config, id) {
    const posts = getUserPosts(config, id);    // 또
    return format(config.locale, posts);       // 또
}

// config를 실제로 쓰는 곳은 맨 아래인데
// 중간 함수 전부가 시그니처에 config를 달고 있다.
```

### 해결: 환경을 타입이 나르게 한다

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

const getUser = id => RT.asks(env => ({ id, db: env.db }));
const getPosts = user => RT.asks(env => [`${env.db}의 ${user.id}번 글`]);

const profile = id => getUser(id).chain(user => getPosts(user));

// 환경은 실행 시점에 딱 한 번 주입한다
console.log(JSON.stringify(RT.runReaderT({ db: 'prod' }, profile(7)).value));
// ["prod의 7번 글"]

console.log(JSON.stringify(RT.runReaderT({ db: 'test' }, profile(7)).value));
// ["test의 7번 글"]
```

중간 함수 어디에도 `env` 매개변수가 없습니다. 같은 프로그램을 다른 환경에서 그대로
돌릴 수 있습니다 — **테스트가 쉬워지는 지점이 여기입니다.**

## M은 문자열로 넘긴다

**Transformer 4종 공통 규칙입니다.** `ReaderT('task')`처럼 문자열로 만드십시오.
객체를 넘기면 타입명이 `ReaderT(M1)`처럼 실행 순서에 따라 달라지고, 두 형태는 서로 다른
클래스가 되어 섞어 쓸 수 없습니다. 자세한 내용은
[StateT](./StateT.md#m은-문자열로-넘긴다)를 보십시오.

```javascript
const { ReaderT, Maybe } = FunFP;

const A = ReaderT('maybe');
const B = ReaderT(Maybe);

console.log(A.of(1)._typeName);   // 'ReaderT(Maybe)'
console.log(B.of(1)._typeName);   // 'ReaderT(M1)'

try {
    A.runReaderT({}, B.of(1));
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## 생성

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('task');     // 환경 + 비동기
const RM = ReaderT('maybe');    // 환경 + 실패 가능

console.log(RT.of(1)._typeName);   // 'ReaderT(Task)'
console.log(RM.of(1)._typeName);   // 'ReaderT(Maybe)'
```

## 주요 연산

### ask - 환경 전체 읽기

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');
const result = RT.runReaderT({ name: 'prod', port: 8080 }, RT.ask);

console.log(JSON.stringify(result.value));   // {"name":"prod","port":8080}
```

### asks - 환경에서 일부만 뽑기

대부분의 경우 `ask`보다 `asks`가 낫습니다 — 필요한 것만 꺼내면 의존이 좁아집니다.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');
const result = RT.runReaderT({ x: 10, y: 20 }, RT.asks(env => env.x * 2));

console.log(result.value);   // 20
```

### local - 환경을 바꿔서 실행

일부 구간만 다른 환경으로 돌립니다. 바깥 환경은 영향받지 않습니다.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

const readX = RT.asks(env => env.x);

const program = readX.chain(outer =>
    RT.local(env => ({ ...env, x: 999 }), readX)
        .chain(inner => RT.asks(env => ({ outer, inner, after: env.x })))
);

console.log(JSON.stringify(RT.runReaderT({ x: 1 }, program).value));
// {"outer":1,"inner":999,"after":1}
```

`after`가 다시 `1`인 것이 핵심입니다 — `local`의 효과는 그 안에서만 유효합니다.

`local`은 인자를 검사합니다.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

try { RT.local(42, RT.ask); } catch (e) { console.log('함수 아님:', e.constructor.name); }
try { RT.local(x => x, 42); } catch (e) { console.log('RT 아님:', e.constructor.name); }
```

### of / lift

`of`는 환경과 무관한 값을, `lift`는 이미 `M`에 담긴 값을 넣습니다.

```javascript
const { ReaderT, Maybe } = FunFP;

const RT = ReaderT('maybe');

console.log(RT.runReaderT({}, RT.of(42)).value);                    // 42
console.log(RT.runReaderT({}, RT.lift(Maybe.Just(42))).value);      // 42
console.log(RT.runReaderT({}, RT.lift(Maybe.Nothing())).isNothing());  // true
```

## 타입 체크

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

try {
    RT.runReaderT({}, 42);
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## 실용적 예시

### 1. 설정 주입 — 같은 코드, 다른 환경

프로덕션과 테스트에서 같은 프로그램을 환경만 바꿔 돌립니다.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

// 비즈니스 로직 — 환경이 무엇인지 모른다
const buildUrl = path => RT.asks(env => `${env.protocol}://${env.host}:${env.port}${path}`);
const withAuth = url => RT.asks(env => `${url}?token=${env.token}`);

const endpoint = path => buildUrl(path).chain(withAuth);

const prod = { protocol: 'https', host: 'api.example.com', port: 443, token: 'REAL' };
const test = { protocol: 'http', host: 'localhost', port: 3000, token: 'FAKE' };

console.log(RT.runReaderT(prod, endpoint('/users')).value);
// https://api.example.com:443/users?token=REAL

console.log(RT.runReaderT(test, endpoint('/users')).value);
// http://localhost:3000/users?token=FAKE
```

프로그램을 고치지 않고 환경만 바꿨습니다. 테스트에서 목을 주입하는 방식이 바로 이것입니다.

### 2. 비동기 저장소 계층 (ReaderT + Task)

`M`을 Task로 두면 환경을 받는 비동기 서비스가 됩니다.

```javascript
const { ReaderT, Task } = FunFP;

const RT = ReaderT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));
const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

// 환경에서 db를 꺼내 쓰는 저장소
const findUser = id => RT.ask.chain(env => RT.lift(env.db.findUser(id)));
const countPosts = user => RT.ask.chain(env => RT.lift(env.db.countPosts(user.id)));

const summary = id => findUser(id)
    .chain(user => countPosts(user).chain(n => RT.of(`${user.name}: 글 ${n}개`)));

// 가짜 DB를 환경으로 주입 — 실제 DB 없이 테스트할 수 있다
const fakeDb = {
    findUser: id => delay(3, { id, name: '테스트유저' }),
    countPosts: () => delay(3, 5)
};

console.log(await run(RT.runReaderT({ db: fakeDb }, summary(1))));
// 테스트유저: 글 5개
```

### 3. local로 권한 낮춰 실행하기

일부 구간만 제한된 환경에서 돌리는 패턴입니다.

```javascript
const { ReaderT } = FunFP;

const RT = ReaderT('maybe');

const currentRole = RT.asks(env => env.role);
const canDelete = RT.asks(env => env.role === 'admin');

const audit = RT.ask.chain(() =>
    currentRole.chain(role => canDelete.chain(may => RT.of({ role, may })))
);

const program = audit.chain(outer =>
    // 이 블록만 게스트 권한으로
    RT.local(env => ({ ...env, role: 'guest' }), audit)
        .chain(inner => RT.of({ outer, inner }))
);

console.log(JSON.stringify(RT.runReaderT({ role: 'admin' }, program).value));
// {"outer":{"role":"admin","may":true},"inner":{"role":"guest","may":false}}
```

### 4. 환경에서 온 값으로 실패시키기

`asks`로 읽고 `lift`로 실패시키면 "설정이 없으면 중단"이 됩니다.

```javascript
const { ReaderT, Maybe } = FunFP;

const RT = ReaderT('maybe');

const requireConfig = key => RT.asks(env => env[key])
    .chain(v => (v === undefined ? RT.lift(Maybe.Nothing()) : RT.of(v)));

const connectionString = requireConfig('host')
    .chain(host => requireConfig('port').chain(port => RT.of(`${host}:${port}`)));

console.log(RT.runReaderT({ host: 'db.local', port: 5432 }, connectionString).value);
// db.local:5432

console.log(RT.runReaderT({ host: 'db.local' }, connectionString).isNothing());
// true — port가 없으면 전체가 Nothing
```

## 관련 타입 클래스

- [Reader](./Reader.md) - `M` 없는 원형. 효과가 필요 없으면 Reader가 더 간단합니다.
- [Task](./Task.md) - `ReaderT('task')`는 환경을 받는 비동기 서비스 계층의 기본형입니다.
- [StateT](./StateT.md) - Transformer 공통 개념(`of`/`lift`, 문자열 M, 스택 안전성).
  환경이 아니라 **변하는 상태**가 필요하면 이쪽입니다.
- [EitherT](./EitherT.md) · [WriterT](./WriterT.md) - 나머지 Transformer.
