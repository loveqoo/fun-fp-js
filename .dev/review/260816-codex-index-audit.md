# 코덱스 적대적 리뷰 — index.js 전체 (2026-08-16)

소유자 지시로 코덱스(세션 01a0072f-9d6b)가 `index.js` 전체를 적대적으로 검토했다.
공격 씨앗 12개를 주었고, **기존 게이트가 놓치는 것만** 가치 있다고 명시했다.
결과: **Critical 0 · Major 5 · Minor 1 — 6건 전부 CONFIRMED**(코덱스가 재현을 돌렸고,
주 에이전트가 여섯 재현 전부를 독립으로 다시 돌려 확인했다). 번호는 코덱스의 것을 그대로 쓴다.

| # | 심각도 | 무엇 | 실측 증상 |
| --- | --- | --- | --- |
| 1 | Major | `Task.catchError` 핸들러가 던지거나 Task 아닌 것을 반환하면 **영원히 미정착** | 동기: settled 가드가 예외를 삼킴 → PENDING. 비동기: unhandledRejection + PENDING |
| 2 | Major | 같은 `.type` 을 선언한 **다른** 모나드 객체로 트랜스포머를 두 번 만들면 두 번째가 첫 번째의 동적 레지스트리(Functor~Monad)를 덮어써 **첫 번째 인스턴스가 죽는다** | `A.of(1).map(...)` 이 B 생성 후 TypeError |
| 3 | Major | `Validation`/`Writer` 가 carrier 타입이 같은 **다른 모노이드**를 조용히 섞는다 — 항상 왼쪽 것을 채택 | `Invalid(2,합)⊕Invalid(3,곱)` = 5, 순서 바꾸면 6 |
| 4 | Major | 레지스트리 조회가 `Object.prototype` 구성원을 인스턴스처럼 돌려준다 | `Setoid.lookup('constructor')` → Object 생성자. `Setoid.Maybe('__proto__')` 는 쓸 수 없는 합성 인스턴스를 만든다. 오염 자체는 재현 안 됨 |
| 5 | Major | `Task.fromPromise` 가 일반 thenable(`then` 만 있는 것)을 받아 놓고 `.catch` 를 가정해 **TypeError 로 reject** | `{then(res){...}}` → REJECT TypeError |
| 6 | Minor | `showValue` 가 사용자 `toString` 예외를 보호하지 않아 문자열화가 던진다 | `Just({toString(){throw}})` → 전파 |

## 못 찾은 영역 (코덱스가 확인하고 깨끗했다고 보고)

`Task.all`/`race` 의 fork 간 상태 공유·다중 settle, `transducer.take` 재사용,
`curry` arity 0, `Optics.prop` 배열 구멍, `fromNullable` 의미, `pipeWhile` predicate 예외,
`kleisliCompose`, `Free.runSync` 재진입 가드 고착, `ArrayChainRec` 빈 배열,
익명 모나드 자동 별칭(M1/M2 로 분리됨 — 결함은 명시적 `.type` 충돌에 한정),
`__proto__` 를 통한 실제 프로토타입 오염(안 됨).

## 수리 방향 후보 (전부 소유자 승인 대기, 유효 입력의 동작은 여섯 다 불변)

1. 핸들러 호출을 try/catch 로 감싸 reject, 반환값이 Task 아니면 라벨 있는 reject.
2. 같은 alias 가 **다른** 인스턴스로 이미 등록돼 있으면 라벨 있는 에러로 거부(덮어쓰기 금지).
3. 양쪽 모노이드가 다르면(carrier 같아도) 라벨 있는 에러. 동일성은 인스턴스 비교.
4. `resolver` 를 own-property 검사로 좁힌다 — `lookup('constructor')` 가 `unsupported key` 로.
   컨테이너 팩토리의 안쪽 해석은 lookup 을 지나므로 함께 닫힌다.
5. `.then().catch()` 대신 `Promise.resolve(result).then(resolve, reject)` — thenable 동화.
6. 사용자 `toString` 호출을 try 안으로 — 실패 시 `[unprintable]`.

전체 판정 원문은 코덱스 세션 01a0072f-9d6b 에 있다.
