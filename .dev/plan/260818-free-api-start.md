# 계획 — `start`: Free.api 실행의 협조적 취소

## Context — 왜 하는가

파이버 논의에서 출발해 CPS·defunctionalization 학습으로 토대를 다졌다: 우리 연속은
데이터(cons 리스트)이고 러너가 그것을 모는 해석기이므로, 실행 흐름의 제어(취소 포함)는
러너의 정책으로 넣을 수 있다. 구현의 전모는 미니어처로 합의됐다 — **변수 하나(깃발) +
매 걸음 직전 if 한 줄 + `{ promise, cancel }` 반환.** 취소는 진행 중인 단계를 끊지
않고 **다음 명령 경계에서 발효**된다(협조적 — saga·파이버와 같은 의미론). 비행 중인
효과의 내부 중단은 핸들러의 AbortController 몫으로 조합한다(실측 완료).

소유자 확정: 문 이름 `start`, 반환은 단순 손잡이 `{ promise, cancel }`(Fiber 포장은
나중에 덧붙이기 가능), 취소 식별은 거부 + `cancelled === true` 표식. `run` 은 그대로
(하위 호환 — start 의 promise 별칭이 됨). poll·자식 전파·경주 자동 취소는 범위 밖.

## 설계 — index.js 의 Free.api 구역, 약 25줄

현재: `interpreterRegistry`(WeakMap) + `makeApiRun(tables)` 를 단일 해석기와
`Free.interpreters` 라우터가 공유, 반환 객체 `{ run }`.

```javascript
const cancelledError = () => {
    const e = new Error('Free.api.run: cancelled');   // TypeError 아님 — 사용 오류가 아니다
    e.cancelled = true;
    return e;
};
const makeApiStart = tables => program => {
    const token = { cancelled: false };                              // ① 깃발 (run 마다 새로)
    const promise = Free.isFree(program)
        ? new Promise((resolve, reject) => {
            Free.runWithTask(cmd => {
                if (token.cancelled) return Task.rejected(cancelledError());   // ② 경계 검사
                /* …기존 러너 몸체 그대로: name → tables.get → 힌트 포함 거부 → lift → 연속… */
            })(program).then(resolve, reject);
        })
        : Promise.reject(new TypeError('Free.api.run: program must be a Free value'));
    return { promise, cancel: () => { token.cancelled = true; } };   // ③ 손잡이
};
```

두 반환 지점(단일 해석기·라우터) 공통:

```javascript
const start = makeApiStart(tables);
const it = { run: program => start(program).promise, start };
// interpreterRegistry.set(it, tables) 는 그대로
```

의미론: 취소는 다음 경계 발효(비행 중 단계는 완료, 결과 폐기) · 이중 취소·정착 후
취소는 무해(no-op) · `cancel()` 반환값 없음 · start 없는 `run` 경로는 토큰이 항상
false 인 분기 하나 외에 무변경.

## 함께 바꾸는 파일

- `tests/free.test.js` — 신규 검사 8건 + 뮤테이션 3종(아래).
- `types/data/Free.d.ts` — `FreeApiInterpreter` 에 `start` 추가,
  `FreeApiRunHandle { promise: Promise<unknown>; cancel(): void }` 신설.
- `docs/Free.md` — 2층 `Free.interpreters` 절 뒤 "실행 취소 — start" 반 절:
  경계 발효(협조적)·`cancelled` 식별·이중 취소 무해·AbortController 조합 예시.
  실행 예제는 틀리면 던지는 형태.
- `CHANGELOG.md` 미발행 절 항목 추가. `dist/` 재빌드(기능 커밋 → 빌드 → dist 커밋 순서).
- `.dev/TODO.md` 기록.

## 검증

1. **run 무변경** — 전후 한 프로세스 대조(HEAD 나란히 로드): 기존 시나리오(값·thenable·
   에러 문안·교차 api·동명 힌트) 불일치 0 + `run` 과 `start().promise` 동등성.
2. **신규 검사 8건**:
   ① 진행 중 취소 → 이후 단계 미시작 + 문안 `'Free.api.run: cancelled'` +
   `cancelled === true` ② 비행 중 단계는 마저 완료(실행 흔적 배열로 단언 — 협조적)
   ③ 정착 후 취소·이중 취소 no-op(결과 불변) ④ 라우터(`Free.interpreters`)의 start
   ⑤ 동기(mock) 핸들러에서도 경계 취소 ⑥ 취소 없는 start = run 과 같은 결과
   ⑦ start 반환 모양 `{ promise, cancel }` (키 정확히 둘) ⑧ 일반 실패 거부에는
   `cancelled` 필드가 없다(식별 배타성).
3. **뮤테이션 3종** — ㉮ 경계 검사 제거 → ① 빨강 ㉯ `cancelled` 필드 누락 → ①⑧ 빨강
   ㉰ 라우터에 start 미노출 → ④ 빨강. 각각 복원 확인.
4. **전체 게이트** — `npm test` 45 + 타입체크, 문서 예제, baseline(기대: 차이 없음 —
   start 는 해석기 인스턴스 층이라 격자 밖임을 명시), dist 재빌드.

## 절차 (관례)

1. 승인 → `.dev/plan/260818-free-api-start.md` 로 기록.
2. 코덱스 계획 리뷰 → 실질 지적 반영(v2) 보고 → 구현(테스트 선행, 빨강 확인) →
   검증 전부 → 코덱스 구현 리뷰 → TODO 기록. 커밋·푸시는 소유자 지시.

## 하지 않는 것

- Fiber 포장(join/interrupt)·poll — 손잡이 위에 나중에 덧붙이기 호환으로 얹을 수 있음.
- Task 층 취소(조합자 배관·경주 패자 자동 취소) — 별개 회차.
- 진행 중 단계 강제 중단 — 협조적 의미론의 의도된 비선택. 비행 중 효과의 내부 중단은
  핸들러의 AbortController 조합(실측 완료된 패턴)으로.

---

## v2 — 코덱스 계획 리뷰 반영 (Blocker 2 · Major 5 · Minor 3, 2026-08-18)

**[Blocker 1] 첫 명령이 손잡이 반환 전에 시작됨 → 계약으로 해소.** 러너는 동기로
걸음을 떼므로 시작을 유예하지 않는 한 "첫 명령 이전 취소"는 불가능하다. 유예는 run 의
관측 시점을 바꾸므로 택하지 않고, **협조적 의미론을 정직하게 계약**한다: cancel 은
호출 이후 도달하는 경계부터 발효한다. 동기 완주 프로그램은 취소할 틈이 없다(자연
귀결 — saga 의 fork 도 즉시 시작). 동기 경로의 취소는 **핸들러 안에서 cancel 을
부르는** 형태로 검증한다(다음 경계에서 발효 — 검사 ⑤ 재정의).

**[Blocker 2] 취소 후 연속 실행 → 구현 보강으로 해소.** 경계 검사를 두 곳으로:
디스패치 직전 + **비행 완료 직후·연속 적용 직전**(`.map` 대신 `.chain` 으로 토큰을
한 번 더 보고 취소면 거부). 이로써 "결과 폐기"가 문자 그대로 참이 된다 — 취소 후에는
사용자 연속(.map 콜백)도 실행되지 않는다. 검사 ②를 "연속 부수 효과 미실행"으로 강화.

**[Major 반영]** ③ 취소와 복구: Free.api 층에는 복구 문이 없으므로(러너는 CatchF 를
해석하지 않고 핸들러는 러너 거부에 개입 불가) 취소는 **항상 최종 거부로 도달** — 계약
명시. ④ `cancelled` 표식은 규약이다 — 이 라이브러리는 보안 경계가 아니라 사용자 자신의
코드이므로 핸들러의 위조는 자기 발등이며, 문서에 "직접 만들지 말라"를 명시하고 취소
에러는 문안+필드 이중 신호로 고정. ⑤ 뮤테이션 ㉯ 기대 정정: ① 만 빨강(⑧ 은 취소
에러를 관찰하지 않음 — 검사 ⑧ 을 "취소 에러의 문안·필드 동시 단언"으로 재정의).
⑥ 기존 `Object.keys(it) === ['run']` 검사는 **의도된 갱신**(`['run','start']`) —
docs 의 `{ run }` 표기·API 표·d.ts 도 같은 표면으로 일괄 갱신(파일 목록에 추가).
⑦ 검사 8 → 11건: Pure 전용 프로그램 + cancel(경계 없음 — 정상 완주), 핸들러 내부
cancel(동기 경로), 취소 후 연속 부수 효과 미실행, 거부 1회성. 뮤테이션 ㉱ 추가:
경계 검사를 디스패치 뒤로 옮김 → 핸들러 호출 횟수 단언(①)이 빨강.

**[Minor 반영]** ⑧ start 도 러너 공용 라벨(`Free.api.run:`)을 쓴다 — "라벨은 문이
아니라 러너의 것"으로 문서 한 줄. ⑨ AbortController 조합은 자동이 아님을 예제에서
명시(사용자가 cancel 과 abort 를 함께 배선). ⑩ baseline "차이 없음"은 호환성 증명이
아니라 격자 사각지대임을 기록대로 유지.

**[구현 중 발견 — 경계 단일화]** v2 의 "경계 두 곳"에서 디스패치 직전 검사(①)는
**도달 불가능한 죽은 코드**로 판명됐다(뮤테이션 실측: 제거해도 전부 초록). 취소는
비동기 틈(비행)에서만 발효될 수 있고 비행 뒤엔 반드시 연속 적용 직전 검사(②)를
지나므로, ② 하나가 유일한 경계다. 검증 불가능한 코드는 두지 않는 규율대로 ① 을
제거했고, ② 의 제거 뮤테이션이 4건 빨강으로 잡힘을 확인했다.

**[구현 리뷰 반영 — 걸음 경계]** 코덱스 구현 리뷰가 "경계 단일화" 판단의 반례를
실측했다(Blocker): 연속은 사용자 코드라 그 **안에서 동기로** cancel 이 발효될 수 있고,
그 경우 후속 연속·다음 핸들러가 우회 실행됐다. 수리: 연속의 **걸음마다** 경계 검사
(`runApiContinuation` 이 토큰을 받아 걸음 사이 취소 시 내부 표식 반환 → 거부).
Major(취소-실패 경주)는 계약으로 고정: **실패가 이긴다** — 취소는 앞으로의 일을 막을
뿐 이미 난 결과를 바꾸지 않는다(문서 명시 + 테스트 ⑫). 코덱스 재현 2건을 테스트
⑩⑪로 박아 빨강→초록, 걸음 경계 뮤테이션 2종(검사 제거 2건·판정 제거 5건 빨강) 확인.
