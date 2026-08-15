# 코덱스 적대적 리뷰 2차 — index.js (2026-08-16)

1차 수리(6건) 직후, 그 수리들을 공격하고 미탐 영역을 재수색하도록 다시 걸었다.
(중간에 프로토타입 공격 어휘로 코덱스가 사이버보안 오탐 거부 → 어휘를 빼고 재요청해 완주.)
결과: **새 결함 5건 — HIGH 2 · MEDIUM 1 · LOW 2, 전부 CONFIRMED**(코덱스 재현 + 주 에이전트
독립 재현 2회). **1차 수리 여섯은 재공격에도 견뎠고, 별칭 가드 의심은 REFUTED.**

## 새 결함 5건

| # | 심각도 | 무엇 | 증상 |
| --- | --- | --- | --- |
| 1 | HIGH | **Actor 의 비동기 subscriber 예외** — 성공 전달이 `resolve()`/`done()` **뒤**가 아니라 subscriber 루프 안에서 나므로, 비동기 handler 경로에서 subscriber 가 던지면 바깥 try/catch 는 이미 끝나 있다 | 예외가 uncaughtException 으로 샘 · 뒤 subscriber 안 불림 · 첫 send 미정착 · `processing=true` 고착으로 다음 메시지 영구 큐대기 · state 만 부분 적용 |
| 2 | HIGH | **`Free.runWithTask` 후속 runner throw** — 최초 `step()` 은 Promise executor 가 throw 를 reject 로 바꾸지만, 비동기 Task 가 부르는 **후속 step 에는 보호가 없다** | resolve·reject 둘 다 없이 **영구 pending** (runWithTask 는 Promise 반환) |
| 3 | MEDIUM | **`Setoid.Struct` 캐시 키 충돌** — 키가 escaping 없이 `필드:셋오이드키` 를 `,` 로 잇는다. 필드 이름에 `:`·`,` 가 들어가면 다른 모양이 같은 키가 된다 | `Struct({'a:number,b':'string'})` 와 `Struct({a:'number',b:'string'})` 가 **같은 인스턴스** — 자기 모양을 거부하고 남의 모양을 승인 |
| 4 | LOW | **`extra.path` 가 상속 프로퍼티를 통과** — own-property 검사 없이 `obj[key]` | `path('toString')({})` 이 `Right(함수)`. "안전한 객체 접근" 의미상 누락으로 봐야 할 것을 성공으로. 읽기만 하므로 실행 취약점은 아니고 데이터 경계 위반 |
| 5 | LOW | **`transducer.map`/`filter` 지연 검증** — mapper/predicate 를 생성 시가 아니라 원소 처리 시 검사 | `map(42)` 가 빈 입력에선 통과(0), 비빈 입력에선 THROW. 잘못된 API 호출의 성패가 컬렉션 크기에 좌우 |

## REFUTED — 1차 수리는 견뎠다

- **별칭 가드 부분 검사(Candidate 1)** — Functor 만 검사해도, 정상 경로는 Functor 를 **가장 먼저**
  등록하고 이후 넷은 내부 생성 함수라 "Functor 없이 하위만 등록"되는 지점을 공개 API 로 못 만든다.
  같은 입력 재생성은 가드 전 캐시 히트. 대소문자만 다른 `.type` 충돌은 의도대로 거부. → REFUTED.
- **깨끗 확인** — `Free.runAsync`(동기 throw·rejected Promise 둘 다 정상 reject),
  `Algebra.all`, `once`(첫 throw 캐시 안 함), `converge`, `useOrLift`, loose mode.

## 수리 방향 후보 (소유자 승인 대기)

1. **Actor** — 성공/실패 전달을 subscriber 루프 밖으로: 먼저 `resolve()`+`done()`+`processing=false`
   로 상태를 확정하고, subscriber 통지는 각각 try/catch(또는 큐 진행과 분리). 핵심은 "통지 예외가
   actor 진행을 막지 않는다".
2. **`Free.runWithTask`** — 후속 `step()` 을 try/catch 로 감싸 reject. `chainRec` Task 수리와 같은 결.
3. **`Setoid.Struct`** — 캐시 키를 충돌 불가하게(JSON.stringify(정렬된 엔트리) 등). 필드 이름의
   구분자를 무해화.
4. **`extra.path`** — own-property 검사(`Object.prototype.hasOwnProperty`)로 상속 프로퍼티 배제.
   ④ 1차 resolver 수리와 같은 성격.
5. **`transducer.map`/`filter`** — 검사를 생성 시점으로 올린다(`checkFunction` 을 팩토리에서).

전부 오류/경계 경로라 유효 입력의 동작은 불변일 것으로 본다(수리 시 전후 대조로 확인).
전체 판정 원문은 코덱스 세션 01a00746-2fbe 에 있다.

---

**적용 (2026-08-16, 소유자: "모두 수리")** — 다섯 전부 수리.
- ① Actor: 정착·큐진행을 subscriber 통지 **앞**으로 옮기고 통지는 각각 try/catch(tapErrorHandler).
- ② `Free.runWithTask`: `step` 을 try/catch 로 감싸 후속 runner 예외를 reject.
- ③ `Setoid.Struct`: 캐시 키를 `JSON.stringify(정렬 엔트리)` 로 — 구분자 무해화.
- ④ `extra.path`: `hasOwnProperty` 로 상속 프로퍼티 배제(중첩 own 은 그대로).
- ⑤ `transducer.map`/`filter`: 함수 검사를 생성 시점으로.

**검증** — 결함 재현 다섯이 수리 후 전부 고쳐짐(코덱스 + 주 에이전트 2회 실측). 유효 경로
불변: `npm test` **45/45** + 타입체크 + `npm run baseline` **차이 없음**. 회귀 검사 5건
(actor·free·setoid·extra·func 각 1)을 넣고 **수리를 하나씩 되돌리는 뮤테이션 5종 전부 잡힘**,
복원 확인. `dist/` 재빌드. 유효 경로 함께 실측: 정상 transducer=12, 중첩 path=7,
template 동작, runWithTask 정상=42, Struct 캐시 히트 유지.
