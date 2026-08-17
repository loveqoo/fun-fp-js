# 계획 — `Free.interpreters`: 여러 api 의 프로그램을 한 해석으로

## Context — 왜 하는가

각 모듈이 자기 `Free.api`(어휘)를 따로 만드는 것이 자연스러운 구조인데, 두 api 의
명령을 섞은 프로그램은 **구성은 이미 되지만 실행이 막혀 있다**(실측: `db.load(...)
.chain(u => mail.send(...))` 는 성립하고, `db` 해석기로 돌리면 4차-2 의 벽이
`no handler for 'send'` 로 거부). 그 벽은 옳은 벽이므로 허물지 않고, **여러 명부를
아는 문지기(해석기 라우터)** 를 하나 만든다. 소유자 확정: 문 이름은
`Free.interpreters(...)`, 같은 api 중복은 라벨 에러로 거부.

핵심 통찰(대화에서 합의): 합칠 것은 AST 가 아니라 해석기다. 명령은 4차-2 표식
(`cmd.api` = 어휘 객체)을 지니므로 이름 충돌·중복 제거가 애초에 불필요하고, "full
path" 는 이미 api 객체가 이름공간(`db.load(...)`)이라 문법 추가도 불필요하다.

## 설계

디스패치는 `Map(어휘 객체 → 핸들러 테이블)`. 러너가 명령의 표식으로 명부를 찾고,
어느 명부에도 없으면 기존 문안 그대로 거부한다(문서 계약 유지).

### 변경 지점 — `index.js` 의 `Free.api` 구역 (~3416-3453행), 약 25줄

1. **내부 심볼** (수출 안 함): `const INTERPRETER_TABLES = Symbol('fun-fp-js/Free.api.tables');`
2. **공유 러너 추출** — 지금 `api.interpreter` 반환부의 `run` 몸체를 `makeApiRun(tables)`
   로 빼서 단일·합성 양쪽이 같은 몸을 쓴다(중복 구현 금지 — 합성 감사의 규율):

```javascript
const makeApiRun = tables => program => Free.isFree(program)
    ? new Promise((resolve, reject) => {
        Free.runWithTask(cmd => {
            // 표식(cmd.api)으로 명부를 찾는다 — 이름이 같아도 다른 api 면 못 찾는다.
            const table = tables.get(cmd.api);
            const h = table && table[cmd.name];
            if (typeof h !== 'function') return Task.rejected(new TypeError(`Free.api.run: no handler for '${cmd.name}'`));
            return liftInterpreterResult(h(...cmd.args)).map(v => runApiContinuation(cmd.fns, v));
        })(program).then(resolve, reject);
    })
    : Promise.reject(new TypeError('Free.api.run: program must be a Free value'));
```

   단일 해석기의 기존 가드 `typeof h !== 'function' || cmd.api !== vocabulary` 는
   `tables.get(cmd.api)` 가 대체한다(외부 api 면 테이블이 안 나옴) — 관측 동작 동일,
   전후 대조로 증명한다.
3. **`api.interpreter` 반환 변경**: `{ run: makeApiRun(tables), [INTERPRETER_TABLES]: tables }`
   (tables = `new Map([[vocabulary, table]])`). 검증 로직(plain-object·오타·누락)은 불변.
4. **새 문**:

```javascript
Free.interpreters = (...its) => {
    its.length > 0 || raise(new TypeError('Free.interpreters: at least one interpreter is required'));
    const tables = new Map();
    for (const it of its) {
        const m = it && it[INTERPRETER_TABLES];
        m || raise(new TypeError('Free.interpreters: arguments must be Free.api interpreters'));
        for (const [vocab, table] of m) {
            tables.has(vocab) && raise(new TypeError('Free.interpreters: duplicate interpreter for the same api'));
            tables.set(vocab, table);
        }
    }
    return { run: makeApiRun(tables), [INTERPRETER_TABLES]: tables };
};
```

   결과도 같은 표식을 지니므로 **중첩 합성이 자연히 된다**
   (`Free.interpreters(합성체, cacheIt)` — 병합 시 중복 검사 통과 필요).

### 함께 바꾸는 파일

- `tests/free.test.js` — 신규 검사 8건(아래).
- `types/data/Free.d.ts` — `FreeApiInterpreter` 인터페이스(`{ run }`)를 이름 붙여 빼고,
  `FreeApi.interpreter` 반환과 `Free.interpreters` 선언에 공용.
- `docs/Free.md` — 2층 "해석기 교체" 흐름 뒤에 "여러 api 를 한 프로그램에서" 절
  (실행 예제: db+mail 섞은 프로그램, 동명 명령 라우팅, 명부 밖 거부). 육하원칙 산문.
- `dist/` 재빌드.

## 검증

1. **전후 한 프로세스 대조** — 공유 러너 추출이 단일 해석기 경로를 안 바꿨는지:
   HEAD 의 index.js 를 나란히 로드해 기존 시나리오(값·thenable·에러·교차 api 거부·
   에러 문안) 대조 불일치 0 목표.
2. **신규 검사 8건** (`tests/free.test.js`):
   ① 두 api 섞인 프로그램이 라우터로 실행된다(오늘의 실측 예제가 초록으로)
   ② **동명 명령**(`db.get`/`mail.get`)이 각자 명부로 정확히 라우팅
   ③ 명부 밖 api 는 기존 문안으로 거부 ④ 중첩 합성(합성체를 다시 합성)
   ⑤ 같은 api 중복 → `duplicate interpreter` 라벨 거부(중첩 경유 포함)
   ⑥ 빈 인자·비해석기 인자 → 라벨 거부 ⑦ 각 interpreter 의 생성 시점 검증
   (오타·누락)이 합성과 무관하게 산다 ⑧ 값/Promise/Task 핸들러 혼합.
3. **뮤테이션 3종** — ㉮ 표식 무시하고 이름만으로 디스패치(첫 명부 사용) → ② 빨강
   ㉯ 중복 검사 제거 → ⑤ 빨강 ㉰ 인자 검증 제거 → ⑥ 빨강. 각각 복원 확인.
4. **전체 게이트** — `npm test` 45 + 타입체크, 문서 예제(신규 절 포함), baseline
   (기대 차이: Free 표면 `interpreters` 추가 1건뿐), dist 재빌드.

## 절차 (이 저장소의 관례)

1. 승인되면 이 계획을 `.dev/plan/260817-free-interpreters.md` 로 옮겨 기록.
2. 코덱스 계획 리뷰 → 실질 지적은 반영하고 소유자에게 보고(v2).
3. 구현(테스트 선행 — 빨강 확인 후 수리) → 위 검증 전부.
4. 코덱스 구현 리뷰 → `.dev/TODO.md` 기록. 커밋·푸시는 소유자 지시.

## 하지 않는 것

- api(어휘) 자체의 병합·별칭·경로 문법 — 필요 없음이 확인됨(표식이 이름공간).
- `Free.all`(병렬 가지) — 별개 기능. 이 라우터와 러너 층에서 자연히 공존 가능.

---

## v2 — 코덱스 계획 리뷰 반영 (Blocker 2 · Major 6 · Minor 4, 2026-08-17)

**설계 변경(두 Blocker 해소): 심볼 필드 → 모듈 내부 WeakMap 등록부.**
반환 객체에 심볼로 명부를 실으면 `Object.getOwnPropertySymbols` 로 심볼이 새어
명부 변조·위조 해석기 주입이 가능했다(코덱스 Blocker ×2). v2 는 명부를 모듈 사설
`WeakMap(해석기 → Map)` 에 두고 반환 객체는 `{ run }` 그대로 둔다 — 밖에서는 등록도
열람도 변조도 불가(브랜드 = WeakMap 소속), 공개 표면 확대 없음(Major "baseline 기대
오류"도 함께 해소), 인자 검증은 등록부 조회 하나라 악성 iterable 경로도 소멸(Major).

**나머지 Major 반영:**
- 러너의 필드 읽기 순서를 옛 가드와 맞춘다(`cmd.name` 먼저, `cmd.api` 다음). 위조
  함자의 게터 호출 **횟수**까지는 계약이 아님을 명시하고, 전후 대조에 malformed 명령
  (api 표식 없는 수제 함자)의 거부 동일성을 추가한다.
- 신규 검사를 8건 → 12건으로: 라우터 경로에서 에러 재검증(비-Free 입력 문안·핸들러
  동기 throw·Promise 거부·깊은 cons 연속), 위조 인자(`{run}` 브랜드 없음) 라벨 거부 +
  반환 객체에 심볼 0개 단언, 중첩 순열((AB)C·A(BC)·중복 위치 앞/뒤/하위 합성체 간),
  검증 시점·에러 종류 명시(생성 = 동기 assertThrowsWith 전체 문안 / 실행 = 거부).
- 타입: `FreeApiInterpreter` 를 선언 전용 unique symbol 브랜드로 — 구조적 `{run}` 이
  정적으로도 통과하지 못하게(정적·런타임 계약 일치).

**뮤테이션 3 → 4종:** ㉮ 이름만 디스패치 ㉯ 중복 검사 제거 ㉰ 등록부 검증 제거
㉱ 합성체를 등록부에 등록 안 함(중첩 합성이 죽는다). 문서 예제는 틀리면 던지는
형태를 명시(성공 종료만 보는 게이트라서 — 코덱스 Minor).
