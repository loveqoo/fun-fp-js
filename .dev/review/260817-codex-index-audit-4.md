# 코덱스 index.js 적대 감사 4차 (2026-08-17)

- 대상: HEAD c81e401 (transduce 비커리드 + into 직후) · Node v24.13.0
- 지시: 영역 한정 없음, 이전 3차 감사의 각도 제외, CONFIRMED/SUSPECTED 구분
- 곁가지: 1차 시도는 보안 어휘 오탐으로 거부됨(2차 감사 때와 같은 패턴) — 품질보증
  어휘로 바꿔 재요청해 완주. 세션 01a00e18-65ff.
- **주 에이전트 독립 재현: 6건 전부 성공 (2026-08-17)** — 2회 실측 성립.
- 처리: 소유자 결정 대기. 결정과 수리는 .dev/TODO.md 의 [4차-N] 항목이 추적한다.

---

전체 감사 결과, 신규 결함 6건을 `CONFIRMED`로 확정했습니다. Critical은 없으며 Major 5건, Minor 1건입니다. 기존 감사에서 보고된 Actor 구독자 예외, `Setoid.Struct`, `NaN`, `once`, 기본 Writer 모노이드 문제 등은 중복 보고하지 않았습니다.

검증 대상은 HEAD `c81e401`, Node `v24.13.0`입니다. 모든 재현은 실제 `index.js`를 직접 import해 실행했으며 파일 변경·생성·삭제는 없었습니다. 마지막 `git status --short`도 출력이 없었습니다.

## 1. 객체 `into`가 `__proto__` 키를 데이터로 보존하지 못함

- 심각도: Major
- 상태: CONFIRMED
- 위치: `transducer.into`, `intoPair` — `index.js:2425–2434`
- 영향: 정상적인 `[key, value]` 입력의 키가 `__proto__`이면 own property가 만들어지지 않고 결과 객체의 프로토타입이 바뀝니다. 전역 `Object.prototype` 오염은 아니지만 결과 그릇의 데이터 무결성과 타입 가정이 깨집니다.

재현 코드 전문:

```javascript
import fp from './index.js';

const id = x => x;
const out = fp.transducer.into(
  {},
  id,
  [['safe', 1], ['__proto__', { polluted: 'yes' }]]
);

console.log(JSON.stringify({
  keys: Object.keys(out),
  hasOwnProto: Object.prototype.hasOwnProperty.call(out, '__proto__'),
  prototypePolluted: Object.getPrototypeOf(out).polluted,
  globalPolluted: ({}).polluted ?? null,
  safe: out.safe
}));
```

관측 출력:

```text
{"keys":["safe"],"hasOwnProto":false,"prototypePolluted":"yes","globalPolluted":null,"safe":1}
```

수정 호환성: 가능합니다. 객체 reducer에서 `acc[k] = val` 대신 `Object.defineProperty`를 사용하면 일반 키의 결과를 유지하면서 `__proto__`도 데이터 프로퍼티로 보존할 수 있습니다. null-prototype 결과를 쓰는 방법은 결과 객체의 프로토타입 계약을 바꾸므로 더 큰 호환성 검토가 필요합니다.

## 2. 별개 `Free.api`가 같은 명령명을 쓰면 교차 실행이 조용히 성공함

- 심각도: Major
- 상태: CONFIRMED
- 위치: `makeApiCommand`, `Free.api.interpreter().run()` — `index.js:3381–3438`
- 영향: 명령에는 API 정체성이 없고 `name`만 들어 있습니다. 따라서 의미가 전혀 다른 두 API가 같은 명령명을 쓰면 잘못된 해석기가 프로그램을 받아 실행합니다. 이는 문서의 “다른 `Free.api` 명령은 거부” 계약과도 충돌합니다.

재현 코드 전문:

```javascript
import fp from './index.js';

const billing = fp.Free.api('get');
const secrets = fp.Free.api('get');

const secretsInterpreter = secrets.interpreter({
  get: key => 'secret-handler:' + key
});

console.log(
  await secretsInterpreter.run(billing.get('invoice-42'))
);
```

관측 출력:

```text
secret-handler:invoice-42
```

수정 호환성: 가능합니다. `Free.api()`마다 고유 토큰을 만들고 명령에 비열거 혹은 내부 필드로 넣은 뒤 해석기에서 토큰까지 검사할 수 있습니다. 같은 API에서 만든 기존 프로그램과 해석기의 사용 경로는 유지됩니다. 의도적으로 서로 다른 API 사이의 구조적 호환성을 이용하던 사용만 breaking change가 됩니다.

## 3. `Free.api`의 깊은 `map` 프로그램 구성은 O(n²)

- 심각도: Major
- 상태: CONFIRMED
- 위치: `makeApiCommand().map()` — `index.js:3383–3385`
- 영향: 실행은 반복문으로 스택 안전하지만, 각 `map`이 `fns.concat([f])`로 기존 배열 전체를 복사합니다. 10,000단계에서 5천만 개가 넘는 기존 원소 참조를 다시 복사했습니다. 문서와 테스트가 강조하는 깊은 `map` 경로에 성능 절벽이 남아 있습니다.

재현 코드 전문:

```javascript
import fp from './index.js';

const api = fp.Free.api('read');
const original = Array.prototype.concat;
let calls = 0;
let copied = 0;

Array.prototype.concat = function (...args) {
  calls++;
  copied += this.length;
  return original.apply(this, args);
};

let program = api.read();
for (let i = 0; i < 10000; i++) {
  program = program.map(x => x);
}

Array.prototype.concat = original;

console.log(JSON.stringify({
  maps: 10000,
  concatCalls: calls,
  priorElementsCopied: copied
}));
```

관측 출력:

```text
{"maps":10000,"concatCalls":10001,"priorElementsCopied":50005000}
```

첫 번째 추가 호출은 `Free.liftF`가 명령에 `Free.pure` continuation을 붙이는 과정입니다.

수정 호환성: 가능합니다. `_mapChain`처럼 persistent linked list로 continuation을 적재하고 실행 시 한 번 평탄화하거나, chunked 구조를 사용할 수 있습니다. continuation 적용 순서와 명령의 공개 모양을 보존해야 합니다.

## 4. `WriterT` 인스턴스 선택이 생성 순서에 의존함

- 심각도: Major
- 상태: CONFIRMED
- 위치: `WriterT`, `registerTransformerTypeClasses` — `index.js:3197–3242`, 특히 `3206`
- 영향: 모노이드 정체성으로 `writerMonoid.type`만 사용합니다. Number 합 모노이드와 곱 모노이드는 모두 `.type === "number"`이므로 같은 `WriterT(Maybe,number)` alias를 차지합니다. 먼저 생성한 쪽만 사용할 수 있고 다른 쪽은 거부됩니다.

재현 코드 전문 — 합을 먼저 생성:

```javascript
import fp from './index.js';

const M = fp.Monad.lookup('maybe');
const sum = fp.Monoid.types.NumberSumMonoid;
const product = fp.Monoid.types.NumberProductMonoid;

const W = fp.WriterT(M, sum);

console.log(
  'first-run',
  JSON.stringify(
    W.tell(3)
      .chain(() => W.tell(4))
      .chain(() => W.of('ok'))
      .run()
      .value
  )
);

try {
  fp.WriterT(M, product);
} catch (e) {
  console.log('second-error', e.name + ': ' + e.message);
}
```

관측 출력:

```text
first-run ["ok",7]
second-error TypeError: WriterT(Maybe,number): a transformer with the same .type is already registered
```

재현 코드 전문 — 곱을 먼저 생성:

```javascript
import fp from './index.js';

const M = fp.Monad.lookup('maybe');
const sum = fp.Monoid.types.NumberSumMonoid;
const product = fp.Monoid.types.NumberProductMonoid;

const W = fp.WriterT(M, product);

console.log(
  'first-run',
  JSON.stringify(
    W.tell(3)
      .chain(() => W.tell(4))
      .chain(() => W.of('ok'))
      .run()
      .value
  )
);

try {
  fp.WriterT(M, sum);
} catch (e) {
  console.log('second-error', e.name + ': ' + e.message);
}
```

관측 출력:

```text
first-run ["ok",12]
second-error TypeError: WriterT(Maybe,number): a transformer with the same .type is already registered
```

수정 호환성: 가능합니다. `Applicative.Const`와 `Writer` factory가 이미 쓰는 정규화된 registry key 또는 인스턴스 고유 ID를 `WriterT` 타입 정체성에 포함하면 됩니다. 이미 생성된 타입명의 문자열을 외부에서 비교하는 코드가 있다면 이름 호환성 검토가 필요합니다.

## 5. Actor 재진입 시 한 통지 안에서 result와 state가 서로 다른 메시지를 가리킴

- 심각도: Major
- 상태: CONFIRMED
- 위치: `Actor.process`, `onSuccess` — `index.js:3255–3268`
- 영향: `done()`이 구독자 통지 전에 다음 메시지 처리를 허용합니다. 앞선 구독자가 재진입해 다음 메시지를 처리하면, 뒤쪽 구독자는 첫 메시지의 `result`와 두 번째 메시지 이후의 `state`를 함께 받습니다.

재현 코드 전문:

```javascript
import fp from './index.js';

const events = [];
const actor = fp.Actor({
  init: 0,
  handle: (state, msg) => [msg, state + 1]
});

actor.subscribe((result, state) => {
  events.push(['A', result, state]);

  if (result === 'one') {
    actor.send('two').fork(
      e => events.push(['nested-error', String(e)]),
      v => events.push(['nested-done', v])
    );
  }
});

actor.subscribe((result, state) => {
  events.push(['B', result, state]);
});

actor.send('one').fork(
  e => events.push(['outer-error', String(e)]),
  v => events.push(['outer-done', v])
);

console.log(JSON.stringify({
  events,
  state: actor.getState()
}));
```

관측 출력:

```text
{"events":[["outer-done","one"],["A","one",1],["nested-done","two"],["A","two",2],["B","two",2],["B","one",2]],"state":2}
```

마지막 `["B","one",2]`가 모순된 통지입니다. `one` 처리 직후 상태는 `1`이어야 합니다.

수정 호환성: 가능합니다. `const notificationState = newState`처럼 커밋 당시 상태를 캡처해 모든 구독자에게 전달하면 큐 진행 순서와 현재의 “settle 후 통지” 정책을 유지할 수 있습니다. 통지 자체의 중첩 순서는 그대로이므로 최소 수정입니다.

## 6. 비동기 Actor가 잘못된 성공 모양을 반환하면 예외가 탈출하고 큐가 정지함

- 심각도: Minor
- 상태: CONFIRMED
- 위치: `Actor.process`, 비동기 `returned.fork(onError, onSuccess)` — `index.js:3260–3279`
- 영향: 동기 `handle`의 잘못된 반환은 바깥 `try/catch`가 reject하지만, Task가 나중에 잘못된 값을 resolve하면 `onSuccess`의 배열 destructuring 예외가 비동기 경계 밖으로 탈출합니다. 현재 메시지와 뒤 메시지가 모두 pending으로 남습니다.
- Minor로 분류한 이유: `handle`의 명시 계약 `[result, newState]`를 위반한 입력이지만, 동기·비동기 경로의 실패 방식이 다르고 비동기 경로가 무음 대기로 악화됩니다.

재현 코드 전문:

```javascript
import fp from './index.js';

const events = [];

process.once('uncaughtException', e => {
  events.push('uncaught:' + e.message);
});

const actor = fp.Actor({
  init: 0,
  handle: () => new fp.Task((_, resolve) => {
    setTimeout(() => resolve(123), 0);
  })
});

actor.send('one').fork(
  e => events.push('one-reject:' + e),
  v => events.push('one-resolve:' + v)
);

actor.send('two').fork(
  e => events.push('two-reject:' + e),
  v => events.push('two-resolve:' + v)
);

setTimeout(() => {
  console.log(JSON.stringify({
    events,
    state: actor.getState()
  }));
}, 30);
```

관측 출력:

```text
{"events":["uncaught:number 123 is not iterable (cannot read property Symbol(Symbol.iterator))"],"state":0}
```

두 send 모두 resolve/reject되지 않았고 두 번째 메시지도 처리되지 않았습니다.

수정 호환성: 가능합니다. `onSuccess` 자체에서 결과 모양 검증과 destructuring을 `try/catch`로 감싸고 실패를 `onError`로 보내면 정상적인 `[result, newState]` 경로는 바뀌지 않습니다.

## 종합 판정

가장 먼저 고칠 항목은 다음 순서가 타당합니다.

1. `Free.api` 명령에 API 정체성 추가
2. Actor 재진입 통지에 상태 스냅샷 적용
3. `WriterT` 모노이드 identity를 alias에 반영
4. 객체 `into`의 안전한 own-property 정의
5. `Free.api` continuation 저장 구조의 O(n)화
6. Actor 비동기 성공값 검증

Writer `eval()/exec()` 정렬 자체에서는 신규 정확성 결함을 찾지 못했습니다. 문제는 Writer 계열의 `WriterT` 동적 등록 정체성에서 발견됐습니다. `transduce` 비커리드화 자체의 reduction 순서와 early termination에서도 신규 결함은 확인되지 않았습니다.


Codex session ID: 01a00e18-65ff-7f13-9590-195bdab39f08
Resume in Codex: codex resume 01a00e18-65ff-7f13-9590-195bdab39f08
