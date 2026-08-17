# 코덱스 5차 감사 — 재공격(상호작용 공격) (2026-08-18)

- 대상: HEAD 88bb94f · 4차 감사 이후의 수리 6건 + Free.interpreters + start/cancel + dist 헤더 계약
- 지시: 이전 각도 반복 금지, 조합 경로 공격(start×interpreters, 재진입, 동시 다중 start,
  트랜스포머 혼용, 취소 중 힌트 경로 등). CONFIRMED 는 실행 확인만.
- 결과: **CONFIRMED-BUG 1(medium) · SAFE 6 · 계약 밖 1**. 최근 기능·수리는 전부 견딤.
- 처리: 버그 1건 즉시 수리(아래 TODO 항목). 계약 밖 1건(Actor 가 Promise 를 안 받음)은 보류.

---

기준 리비전은 `88bb94f`입니다. 총 8개 조합 경로를 실행했고, `CONFIRMED-BUG` 1건, `CONFIRMED-SAFE` 6건, 계약상 비지원이라 결함으로 확정할 수 없는 `UNVERIFIED` 1건을 관측했습니다. 저장소 파일은 변경하지 않았습니다.

## 1. 객체 `into`의 기존 `__proto__` 데이터가 복제 과정에서 프로토타입 변조로 바뀜

- 제목: Free가 만든 쌍을 기존 객체 그릇에 넣을 때 그릇의 `__proto__` 데이터가 유실되고 결과 프로토타입이 변조된다
- 관련 커밋/파일/함수:
  - `b80cecb`
  - `index.js:2425-2434`
  - 특히 `index.js:2433`의 `Object.assign({}, vessel)`
- 재현 절차:

```js
import fp from './index.js';

const { Free, transducer } = fp;

const vessel = {};
Object.defineProperty(vessel, '__proto__', {
  value: { seed: true },
  enumerable: true
});
vessel.base = 1;

const API = Free.api('pair');
const pair = await API.interpreter({
  pair: () => ['k', 7]
}).run(API.pair());

const result = transducer.into(vessel, x => x, [pair]);

console.log(JSON.stringify({
  ownProto: Object.hasOwn(result, '__proto__'),
  protoSeed: Object.getPrototypeOf(result)?.seed,
  keys: Object.keys(result),
  k: result.k
}));
```

- 관측된 출력:

```json
{
  "ownProto": false,
  "protoSeed": true,
  "keys": ["base", "k"],
  "k": 7
}
```

- 판정: `CONFIRMED-BUG`
- 심각도: `medium`
- 설명:
  - 새 collection에서 들어오는 `['__proto__', value]`는 `defineProperty`로 방어하지만, 기존 vessel을 복제하는 앞 단계는 여전히 `Object.assign({}, vessel)`입니다.
  - 따라서 기존 own data property였던 `__proto__`가 결과에서 사라지고, 그 값이 결과 객체의 프로토타입으로 설정됩니다.
  - 원본은 변하지 않지만 “기존 내용 보존” 계약과 프로토타입 안전성을 동시에 위반합니다.

## 2. 같은 Free 프로그램을 동시에 두 번 `start`해도 취소 토큰과 연속이 격리됨

- 제목: 동명 명령을 포함한 동일 프로그램의 동시 실행에서 한쪽 취소가 다른 실행을 오염시키지 않는다
- 관련 커밋/파일/함수:
  - `953384b`, `bcd1690`, `9a32133`
  - `index.js:3395-3411`
  - `index.js:3429-3458`
  - `index.js:3492-3506`
- 재현 절차:

```js
const A = Free.api('same');
const B = Free.api('same');
let calls = 0;

const router = Free.interpreters(
  A.interpreter({
    same: n => new Promise(r =>
      setTimeout(() => r(`A${n}:${++calls}`), 10))
  }),
  B.interpreter({
    same: n => new Promise(r =>
      setTimeout(() => r(`B${n}:${++calls}`), 10))
  })
);

const program = A.same(1)
  .chain(x => B.same(2).map(y => `${x}|${y}`));

const h1 = router.start(program);
const h2 = router.start(program);
setTimeout(h1.cancel, 5);

console.log(await h1.promise.then(
  v => ({ ok: true, v }),
  e => ({ ok: false, message: e.message, cancelled: e.cancelled })
));
console.log(await h2.promise);
console.log(calls);
```

- 관측된 출력:

```json
{
  "one": {
    "ok": false,
    "name": "Error",
    "msg": "Free.api.run: cancelled",
    "cancelled": true
  },
  "two": {
    "ok": true,
    "v": "A1:2|B2:3"
  },
  "calls": 3
}
```

- 판정: `CONFIRMED-SAFE`
- 설명:
  - 각 호출이 `index.js:3430`에서 별도 token을 만들었습니다.
  - 취소된 실행은 첫 비행까지만 수행했고, 두 번째 실행은 A와 B 명령을 모두 정상 처리했습니다.
  - persistent continuation을 공유해도 실행 중 변경되는 상태는 공유되지 않았습니다.

## 3. 같은 해석기의 핸들러가 동일 해석기를 재진입해도 외부 취소와 내부 실행이 분리됨

- 제목: 핸들러 내부의 동일 interpreter `start` 재진입은 교착하지 않고 외부 취소만 외부 연속을 차단한다
- 관련 커밋/파일/함수:
  - `9a32133`
  - `index.js:3429-3458`
- 재현 절차:

```js
const API = Free.api('outer', 'inner');
let outerHandle;
let interpreter;
const events = [];

interpreter = API.interpreter({
  outer: async () => {
    events.push('outer-in');
    const value = await interpreter.start(API.inner()).promise;
    events.push('outer-out');
    return value;
  },
  inner: () => new Promise(resolve =>
    setTimeout(() => {
      events.push('inner-done');
      resolve(4);
    }, 10))
});

outerHandle = interpreter.start(
  API.outer().map(x => {
    events.push('outer-map');
    return x + 1;
  })
);
setTimeout(outerHandle.cancel, 2);

const result = await outerHandle.promise.then(
  v => ({ ok: true, v }),
  e => ({ ok: false, msg: e.message, cancelled: e.cancelled })
);

console.log(JSON.stringify({ result, events }));
```

- 관측된 출력:

```json
{
  "result": {
    "ok": false,
    "name": "Error",
    "msg": "Free.api.run: cancelled",
    "cancelled": true
  },
  "events": [
    "outer-in",
    "inner-done",
    "outer-out"
  ]
}
```

- 판정: `CONFIRMED-SAFE`
- 설명:
  - 내부 실행은 완료됐고 교착하지 않았습니다.
  - 외부 취소는 외부 핸들러 착륙 후 검사되어 `outer-map`만 차단했습니다.
  - 내부·외부 실행 토큰이 섞이지 않았습니다.

## 4. 취소 중 동명 명령 힌트 경로에서는 원래 라우팅 실패가 승리함

- 제목: 시작 직후 취소해도 다른 API의 동명 명령은 취소 오류로 위장되지 않는다
- 관련 커밋/파일/함수:
  - `d205f7b`, `9a32133`
  - `index.js:3433-3447`
- 재현 절차:

```js
const UI = Free.api('log');
const NET = Free.api('log');

const router = Free.interpreters(
  UI.interpreter({ log: () => 1 })
);

const handle = router.start(NET.log());
handle.cancel();

console.log(await handle.promise.then(
  v => ({ ok: true, v }),
  e => ({
    ok: false,
    name: e.name,
    msg: e.message,
    cancelled: e.cancelled
  })
));
```

- 관측된 출력:

```json
{
  "ok": false,
  "name": "TypeError",
  "msg": "Free.api.run: no handler for 'log' (the api owning this command has no interpreter here — another api also defines 'log')"
}
```

- 판정: `CONFIRMED-SAFE`
- 설명:
  - 명령 라우팅 실패가 보존됐으며 `cancelled` 표식은 붙지 않았습니다.
  - 실패-취소 경주에서 도메인/라우팅 실패가 취소로 오진되지 않았습니다.

## 5. WriterT 등록 키와 교차 Free API 라우팅이 함께 사용돼도 모노이드가 충돌하지 않음

- 제목: `WriterT('free')`의 합·곱 모노이드가 서로 다른 클래스로 유지되고 합성 router에서 각 Free 명령을 실행한다
- 관련 커밋/파일/함수:
  - `0833020`, `f21f679`, `bcd1690`
  - `index.js:3196-3247`
  - `index.js:3460-3506`
- 재현 절차:

```js
const X = Free.api('x');
const Y = Free.api('y');

const router = Free.interpreters(
  X.interpreter({ x: () => 2 }),
  Y.interpreter({ y: () => 3 })
);

const WS = WriterT('free', Monoid.types.NumberSumMonoid);
const WP = WriterT('free', Monoid.types.NumberProductMonoid);

const sumProgram = WS.runWriterT(
  WS.lift(X.x()).chain(x => WS.tell(x).map(() => x + 1))
);
const productProgram = WP.runWriterT(
  WP.lift(Y.y()).chain(y => WP.tell(y).map(() => y + 1))
);

console.log(JSON.stringify({
  sameClass: WS === WP,
  sum: await router.run(sumProgram),
  product: await router.run(productProgram)
}));
```

- 관측된 출력:

```json
{
  "sameClass": false,
  "sum": [3, 2],
  "product": [4, 3]
}
```

- 판정: `CONFIRMED-SAFE`

## 6. StateT와 Free.interpreters 혼용에서 상태와 API 표식이 보존됨

- 제목: `StateT('free')`가 만든 Free 프로그램도 합성 router가 올바른 API로 라우팅한다
- 관련 커밋/파일/함수:
  - `f21f679`, `bcd1690`
  - `index.js:3025-3078`
  - `index.js:3433-3455`
- 재현 절차:

```js
const X = Free.api('x');
const Y = Free.api('y');

const router = Free.interpreters(
  X.interpreter({ x: () => 2 }),
  Y.interpreter({ y: () => 3 })
);

const ST = StateT('free');
const freeProgram = ST.runState(
  10,
  ST.lift(X.x()).chain(x =>
    ST.get.chain(s =>
      ST.put(s + x).map(() => x)
    )
  )
);

console.log(await router.run(freeProgram));
```

- 관측된 출력:

```json
[2, 12]
```

- 판정: `CONFIRMED-SAFE`

## 7. 깊은 cons 연속은 중간 취소 경계를 지키며 200k 실행도 선형적으로 완료됨

- 제목: 100k map 중간 취소는 정확히 다음 연속을 막고, 취소 없는 200k 연속은 스택 초과 없이 완료된다
- 관련 커밋/파일/함수:
  - `953384b`, `64972ad`, `9a32133`
  - `index.js:3395-3411`
  - `index.js:3451-3453`
- 재현 절차:

```js
const API = Free.api('v');
const interpreter = API.interpreter({
  v: () => Promise.resolve(0)
});

let handle;
let calls = 0;
let cancelled = API.v();

for (let i = 0; i < 100000; i++) {
  cancelled = cancelled.map(x => {
    calls++;
    if (calls === 50000) handle.cancel();
    return x + 1;
  });
}

let started = Date.now();
handle = interpreter.start(cancelled);
const error = await handle.promise.then(() => null, e => e);

console.log(JSON.stringify({
  calls,
  cancelled: error?.cancelled,
  message: error?.message,
  ms: Date.now() - started
}));

let deep = API.v();
for (let i = 0; i < 200000; i++) deep = deep.map(x => x + 1);

started = Date.now();
console.log(JSON.stringify({
  deep: await interpreter.run(deep),
  ms: Date.now() - started
}));
```

- 관측된 출력:

```json
{"calls":50000,"cancelled":true,"message":"Free.api.run: cancelled","ms":10}
{"deep":200000,"ms":8}
```

- 판정: `CONFIRMED-SAFE`
- 설명:
  - 취소 이후 50,001번째 연속은 실행되지 않았습니다.
  - 현재 리비전의 200k 실행에서 스택 초과나 눈에 띄는 O(n²) 복사 징후는 관측되지 않았습니다.

## 8. Actor 핸들러에 Free.run Promise를 직접 반환하는 조합은 실패하지만 공개 계약 밖임

- 제목: `Actor.handle`에서 `Free.api.run()` Promise를 직접 반환하면 pair 검증에 걸린다
- 관련 커밋/파일/함수:
  - `aeba1e6`, `c49fb72`
  - `index.js:3262-3291`
  - `types/Actor.d.ts:19-24`
  - `types/data/Free.d.ts:63-66`
- 재현 절차:

```js
const API = Free.api('inc');
const interpreter = API.interpreter({
  inc: n => Promise.resolve(n + 1)
});

const actor = Actor({
  init: 0,
  handle: (state, n) =>
    interpreter.run(API.inc(n)).then(value => [value, state + value])
});

await new Promise((resolve, reject) =>
  actor.send(1).fork(reject, resolve)
);
```

- 관측된 출력:

```text
TypeError: Actor: handle must produce a [result, newState] pair
    at onSuccess (index.js:3269:77)
```

- 판정: `UNVERIFIED(추측)`
- 설명:
  - 런타임은 `fork`가 있는 Task만 비동기로 인정합니다.
  - 공개 타입도 `handle: [R,S] | Task<[R,S]>`로 Promise를 허용하지 않습니다. 따라서 자연스러운 조합성 문제는 있지만 현재 공개 계약 위반이라고 단정할 수 없습니다.
  - Free Promise를 Task로 감쌌을 때는 재진입 subscriber까지 정상 동작했습니다:

```json
{"first":2,"state":6,"seen":["2:2","4:6"]}
```

## Dist 헤더·빌더 계약 검증

다음 명령을 실행했습니다.

```sh
node tests/dist-sync.test.js
```

실제 출력:

```text
[PASS] dist/fun-fp.js 이 현재 index.js 의 빌드 결과와 같다
[PASS] dist/fun-fp.cjs 이 현재 index.js 의 빌드 결과와 같다
[PASS] dist/fun-fp.min.cjs 이 현재 index.js 의 빌드 결과와 같다
[PASS] dist/fun-fp.js 는 헤더를 떼면 index.js 와 글자까지 같다
[PASS] dist/fun-fp.d.ts 가 현재 types/ 의 빌드 결과와 같다
[PASS] types/ 의 선언 파일이 전부 빌드 명단에 있다
[PASS] 게이트가 실제로 탐지한다 (자기검사)
```

`buildOutputs`를 동일 인자로 두 번 호출하고 Version/Commit만 각각 바꾼 독립 probe의 결과:

```json
{
  "deterministic": true,
  "sourceSame": true,
  "headers": [
    " * Version: V",
    " * Commit: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    " * Built: 2000-01-01T00:00:00.000Z",
    " * Changelog: https://github.com/loveqoo/fun-fp-js/blob/main/CHANGELOG.md",
    " * Static Land specification compliant"
  ],
  "versionMutation": true,
  "commitMutation": true
}
```

판정은 `CONFIRMED-SAFE`입니다. 근거 소스는 `build.js:18-20`, `build.js:38-45`, `build.js:99-106`, `tests/dist-sync.test.js:30-41`, `tests/dist-sync.test.js:62-79`, `tests/dist-sync.test.js:112-120`입니다.

현재 dist 헤더는 `dist/fun-fp.js:1-7`에서 Version `0.1.0`, Commit `9a321335...`, Changelog URL을 포함합니다. Commit은 현재 문서-only HEAD가 아니라 직전 기능 커밋을 가리키며 의도된 빌드 시점 규율과 맞습니다.

## 감사 요약

| 구분 | 결과 |
|---|---:|
| 전체 발견/후보 경로 | 8 |
| CONFIRMED-BUG | 1 |
| CONFIRMED-SAFE | 6 |
| UNVERIFIED | 1 |
| 수정된 저장소 파일 | 0 |

| 재공격 대상 영역 | 상태 |
|---|---|
| Actor 통지 스냅샷·성공 모양 | Task로 감싼 Free 조합 및 subscriber 재진입 안전 확인. Promise 직접 반환은 계약 밖이라 UNVERIFIED |
| 객체 `into`의 `__proto__` | **기존 vessel의 own `__proto__` 복제 경로에서 medium 버그 확인** |
| WriterT 등록 키 | 서로 다른 Number 합·곱 모노이드와 Free 혼용 안전 확인 |
| Free.api 교차 API 표식 | 동명 API, WriterT/StateT, 재사용 프로그램에서 안전 확인 |
| 깊은 map cons 연속 | 100k 중간 취소와 200k 실행 안전 확인 |
| Free.interpreters | 동명 라우팅, 재진입, 동시 실행 격리 안전 확인 |
| start/cancel | 실행별 token 격리, 연속 경계, 라우팅 실패 승리 안전 확인 |
| dist 헤더·빌더 순수 계약 | dist-sync 7개 및 독립 결정성/민감도 probe 안전 확인 |


Codex session ID: 01a0107a-dafb-70f0-814e-344e089ca6f9
Resume in Codex: codex resume 01a0107a-dafb-70f0-814e-344e089ca6f9
