# 회차 2 — PENDING 55건 수리

## Context

회차 1에서 검사기를 개조하고 문서를 대량 수리해 368개 예제가 실행되는 상태를 만들었다.
남은 55건(문서 24개)은 `PENDING` 으로 분리해 CI 를 초록으로 유지했다.
**이 회차의 목표는 그 목록을 비우는 것이다.**

## 분류 (회차 1에서 실측)

| 분류 | 건수 | 처리 |
| --- | --- | --- |
| 미정의 헬퍼 | 46 | 짧은 스텁을 넣어 실행 가능하게. 본질이 아니면 `no-run <이유>` |
| 대수 법칙 잔여 | 일부 | `no-run 대수 법칙 — 자유변수 표기` |
| 실제 API 불일치 | 9 | **개별 조사.** 라이브러리 버그가 더 나올 수 있다 |

실제 API 불일치 9건의 정체:

```
Free.liftF: expected a functor                 (2)
loadConfig(...).fold is not a function
prop(...)(...).chain(...).getOrElse is not a function
traverse(...).fold is not a function
sequence: first argument must be a Traversable
Functor.map: arguments must be (function, ...)
RangeError: Maximum call stack size exceeded
```

`.fold` / `.getOrElse` 가 없다는 것은 **문서가 존재하지 않는 인스턴스 메서드를 설명**한다는
뜻이다. 회차 1에서 찾은 `Monoid.of('sum')` 류와 같은 종류의 부패다.

## 진행 방식

**문서 단위로 처리한다.** 한 문서를 끝내면 `PENDING` 에서 빼고 검사기를 돌려 초록을
확인한다. 검사기가 이미 "이 문서는 이제 전부 통과한다 — PENDING 목록에서 빼라" 를 출력한다.

우선순위:
1. **실제 API 불일치 9건 먼저** — 라이브러리 버그를 찾는 것이 이 작업의 가장 큰 값어치다
2. 미정의 헬퍼 — 스텁 추가
3. 대수 법칙 잔여 — `no-run`

**스텁은 최소로.** 예제의 주제를 흐리지 않는 선에서 한두 줄. 스텁이 길어지면 그 블록은
`no-run` 이 맞다.

## Verification

- 조건 3 — `PENDING` 이 비고 `npm test` 실패 0
- 조건 4 — `no-run` 이 시그니처·법칙에 한정되는지 전수 확인 (이유 문자열로 grep)
- 조건 5 — 이번에 찾은 API 불일치도 문서를 실제 API 에 맞춰 고쳤다
- 조건 7·8 — 부패 주입 non-zero, CI Node 20/22 success
- **최종적으로 `PENDING` 상수와 관련 코드를 검사기에서 삭제한다** — 남겨두면 다음 사람이
  새 문서를 거기 넣는다

## 되돌리는 법

문서 수정은 커밋 단위로 되돌릴 수 있다. 검사기가 게이트이므로 잘못 고치면 즉시 빨간색이 된다.
