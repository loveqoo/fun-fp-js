# EitherT

> English: [./en/EitherT.md](./en/EitherT.md)

**에러 처리에 다른 효과를 합성**하는 Monad Transformer

> Transformer 4종의 공통 개념(`of`/`lift`, 문자열 M 규칙, Free 기반 스택 안전성)은
> [StateT](./StateT.md) 문서에 정리되어 있습니다. 여기서는 EitherT 고유 연산을 다룹니다.

## 개념

[Either](./Either.md)는 `Right | Left`로 성공과 실패를 나눕니다. 하지만 실패 여부를 **비동기로
알아내야 한다면** Either만으로는 부족합니다 — `Task<Either<E, A>>`가 되어 두 겹을 매번 벗겨야
합니다.

EitherT는 그 두 겹을 하나로 다룹니다.

```
Either    e a = Left e | Right a
EitherT M e a = M (Either e a)
```

가장 흔한 조합은 **`EitherT('task')`** 입니다 — 비동기이면서 실패할 수 있는 계산, 즉 대부분의
API 호출입니다.

## 왜 EitherT인가?

### 문제: Task 안의 Either는 껍질을 두 번 벗겨야 한다

```javascript no-run 문제 상황 — 일부러 나쁜 코드
// Task<Either<Error, User>> — 단계마다 두 겹을 다룬다
fetchUser(id)
    .chain(eitherUser =>
        eitherUser.isLeft()
            ? Task.of(eitherUser)                  // 실패를 수동으로 전파
            : fetchPosts(eitherUser.value).chain(eitherPosts =>
                eitherPosts.isLeft()
                    ? Task.of(eitherPosts)         // 또 전파
                    : Task.of(Either.Right({ ... }))
              )
    );

// 단계마다 isLeft 분기가 붙는다. 진짜 로직은 마지막 한 줄인데
// 나머지가 전부 실패 전파 배관이다.
```

### 해결: 실패 전파를 타입에 맡긴다

```javascript
const { EitherT, Task, Either } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));

const findUser = id => id > 0
    ? ET.of({ id, name: 'Anthony' })
    : ET.throwError('잘못된 id');

const program = findUser(1)
    .chain(user => ET.of({ ...user, greeting: `안녕 ${user.name}` }));

const ok = await run(ET.runEitherT(program));
console.log(ok.isRight(), ok.value.greeting);   // true '안녕 Anthony'

const bad = await run(ET.runEitherT(findUser(-1).chain(u => ET.of(u.name))));
console.log(bad.isLeft(), bad.value);           // true '잘못된 id'
```

`chain`만 이어붙이면 됩니다. 실패가 나오는 순간 나머지 단계는 실행되지 않습니다.

## M은 문자열로 넘긴다

**Transformer 4종 공통 규칙입니다.** `EitherT('task')`처럼 문자열로 만드십시오.
객체를 넘기면 타입명이 `EitherT(M1)`처럼 실행 순서에 따라 달라지고, 두 형태는 서로 다른
클래스가 되어 섞어 쓸 수 없습니다. 자세한 내용은 [StateT](./StateT.md#m-as-string)를
보십시오.

```javascript
const { EitherT, Maybe } = FunFP;

const A = EitherT('maybe');
const B = EitherT(Maybe);

console.log(A.of(1)._typeName);   // 'EitherT(Maybe)'
console.log(B.of(1)._typeName);   // 'EitherT(M1)' — 실행 순서에 따라 달라진다

try {
    A.runEitherT(B.of(1));
} catch (e) {
    console.log(e.constructor.name);   // TypeError
}
```

## 생성

```javascript
const { EitherT } = FunFP;

const ET = EitherT('task');     // 비동기 + 에러 — 가장 흔한 조합
const EM = EitherT('maybe');    // 부재 + 에러

console.log(ET.of(1)._typeName);   // 'EitherT(Task)'
console.log(EM.of(1)._typeName);   // 'EitherT(Maybe)'
```

## 주요 연산

### of - 성공 값

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
const result = ET.runEitherT(ET.of(42));

console.log(result.value.isRight(), result.value.value);   // true 42
```

`M`(Maybe) 안에 `Either`가 들어 있는 두 겹 구조가 그대로 나옵니다.

### throwError - 실패

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
const result = ET.runEitherT(ET.throwError('실패 사유'));

console.log(result.value.isLeft(), result.value.value);   // true '실패 사유'
```

실패 뒤의 `chain`은 실행되지 않습니다.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
let reached = false;

const program = ET.throwError('boom').chain(() => {
    reached = true;               // 여기 오면 안 된다
    return ET.of(1);
});

const result = ET.runEitherT(program);
console.log(result.value.isLeft(), '콜백 실행됨:', reached);   // true '콜백 실행됨:' false
```

### catchError - 실패 복구

**정적 메서드이고 인자 순서는 `(프로그램, 핸들러)` 입니다.** 인스턴스 메서드가 아닙니다.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

const risky = ET.throwError('네트워크 오류');
const safe = ET.catchError(risky, err => ET.of(`기본값 (원인: ${err})`));

const result = ET.runEitherT(safe);
console.log(result.value.isRight(), result.value.value);
// true '기본값 (원인: 네트워크 오류)'
```

핸들러가 다시 실패시킬 수도 있습니다 — 에러를 변환해 다시 던지는 패턴입니다.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

const rethrown = ET.catchError(
    ET.throwError('ECONNREFUSED'),
    err => ET.throwError(`서버에 연결할 수 없습니다 (${err})`)
);

const result = ET.runEitherT(rethrown);
console.log(result.value.isLeft(), result.value.value);
// true '서버에 연결할 수 없습니다 (ECONNREFUSED)'
```

성공한 프로그램에는 핸들러가 호출되지 않습니다.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');
let handlerCalled = false;

const result = ET.runEitherT(
    ET.catchError(ET.of(1), () => { handlerCalled = true; return ET.of(0); })
);

console.log(result.value.value, '핸들러 호출됨:', handlerCalled);   // 1 '핸들러 호출됨:' false
```

### fromEither - 기존 Either를 끌어오기

이미 `Either`를 돌려주는 함수가 있다면 그대로 씁니다.

```javascript
const { EitherT, Either } = FunFP;

const ET = EitherT('maybe');

const parsePort = s => {
    const n = Number(s);
    return Number.isInteger(n) && n > 0 ? Either.Right(n) : Either.Left(`잘못된 포트: ${s}`);
};

const ok = ET.runEitherT(ET.fromEither(parsePort('8080')));
console.log(ok.value.isRight(), ok.value.value);      // true 8080

const bad = ET.runEitherT(ET.fromEither(parsePort('abc')));
console.log(bad.value.isLeft(), bad.value.value);     // true '잘못된 포트: abc'
```

### lift - 밑에 깔린 M의 값 끌어오기

`of`는 평범한 값을, `lift`는 이미 `M`에 담긴 값을 받습니다.

```javascript
const { EitherT, Task } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));

const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

const result = await run(ET.runEitherT(ET.lift(delay(5, 'Task에서 온 값'))));
console.log(result.isRight(), result.value);   // true 'Task에서 온 값'
```

## 타입 체크

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

try {
    ET.runEitherT(42);
} catch (e) {
    console.log('runEitherT:', e.constructor.name);   // runEitherT: TypeError
}

try {
    ET.catchError(ET.of(1), () => 42);   // 핸들러가 EitherT를 안 돌려줌
    ET.runEitherT(ET.catchError(ET.throwError('x'), () => 42));
} catch (e) {
    console.log('catchError handler:', e.constructor.name);   // catchError handler: TypeError
}
```

## 실용적 예시

### 1. 여러 단계 API 호출 (EitherT + Task)

각 단계가 실패할 수 있고 전부 비동기입니다. 실패 분기는 한 번도 쓰지 않습니다.

```javascript
const { EitherT, Task } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));
const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

const users = { 1: { id: 1, name: 'Anthony' } };
const posts = { 1: ['첫 글', '둘째 글'] };

const fetchUser = id => ET.lift(delay(3, users[id]))
    .chain(u => (u ? ET.of(u) : ET.throwError(`사용자 없음: ${id}`)));

const fetchPosts = user => ET.lift(delay(3, posts[user.id]))
    .chain(p => (p ? ET.of(p) : ET.throwError(`글 없음: ${user.id}`)));

const profile = id => fetchUser(id)
    .chain(user => fetchPosts(user).chain(list => ET.of({ name: user.name, count: list.length })));

const ok = await run(ET.runEitherT(profile(1)));
console.log(ok.isRight(), JSON.stringify(ok.value));   // true {"name":"Anthony","count":2}

const missing = await run(ET.runEitherT(profile(99)));
console.log(missing.isLeft(), missing.value);          // true '사용자 없음: 99'
```

### 2. 재시도 후 기본값으로 떨어지기

`catchError`로 복구 전략을 조립합니다.

```javascript
const { EitherT, Task } = FunFP;

const ET = EitherT('task');
const run = t => new Promise((resolve, reject) => t.fork(reject, resolve));
const delay = (ms, v) => new Task((reject, resolve) => setTimeout(() => resolve(v), ms));

let attempts = 0;
const flaky = () => ET.lift(delay(1, null)).chain(() => {
    attempts++;
    return attempts < 3 ? ET.throwError(`시도 ${attempts} 실패`) : ET.of(`시도 ${attempts} 성공`);
});

// 두 번 복구를 걸어 세 번째에 성공시킨다
const withRetry = ET.catchError(
    ET.catchError(flaky(), () => flaky()),
    () => flaky()
);

const result = await run(ET.runEitherT(withRetry));
console.log(result.isRight(), result.value, '/ 총 시도', attempts);
// true '시도 3 성공' / 총 시도 3
```

### 3. 검증 파이프라인

`fromEither`로 기존 검증 함수를 그대로 재사용합니다.

```javascript
const { EitherT, Either } = FunFP;

const ET = EitherT('maybe');

const required = field => obj => obj[field]
    ? Either.Right(obj)
    : Either.Left(`${field} 는 필수입니다`);

const minLength = (field, n) => obj => obj[field].length >= n
    ? Either.Right(obj)
    : Either.Left(`${field} 는 ${n}자 이상이어야 합니다`);

const validate = input => ET.fromEither(required('name')(input))
    .chain(o => ET.fromEither(required('password')(o)))
    .chain(o => ET.fromEither(minLength('password', 8)(o)));

const ok = ET.runEitherT(validate({ name: 'A', password: 'longenough' }));
console.log(ok.value.isRight());                     // true

const short = ET.runEitherT(validate({ name: 'A', password: '123' }));
console.log(short.value.value);                      // 'password 는 8자 이상이어야 합니다'

const missing = ET.runEitherT(validate({ name: 'A' }));
console.log(missing.value.value);                    // 'password 는 필수입니다'
```

첫 실패에서 멈춥니다. 모든 에러를 모으고 싶다면 [Validation](./Validation.md)을 쓰십시오.

### 4. 에러 메시지를 계층별로 다시 씌우기

낮은 층의 기술적 에러를 사용자용 메시지로 바꿔 올립니다.

```javascript
const { EitherT } = FunFP;

const ET = EitherT('maybe');

const dbQuery = () => ET.throwError('ER_LOCK_WAIT_TIMEOUT');

const repository = () => ET.catchError(dbQuery(), e =>
    ET.throwError({ layer: 'repository', cause: e })
);

const service = () => ET.catchError(repository(), e =>
    ET.throwError({ layer: 'service', message: '잠시 후 다시 시도해 주세요', inner: e })
);

const result = ET.runEitherT(service());
const err = result.value.value;

console.log(err.layer, '/', err.message);        // 'service' / '잠시 후 다시 시도해 주세요'
console.log(err.inner.cause);                    // 'ER_LOCK_WAIT_TIMEOUT' — 원인은 보존
```

## 관련 타입 클래스

- [Either](./Either.md) - `M` 없는 원형. 비동기가 필요 없으면 Either가 더 간단합니다.
- [Task](./Task.md) - 가장 흔한 `M`. `EitherT('task')`가 대표 조합입니다.
- [Validation](./Validation.md) - 첫 실패에서 멈추지 않고 **모든 에러를 모으고** 싶을 때.
- [StateT](./StateT.md) - Transformer 공통 개념(`of`/`lift`, 문자열 M, 스택 안전성).
- [ReaderT](./ReaderT.md) · [WriterT](./WriterT.md) - 나머지 Transformer.
