# Verification — 회차 2

## 계획서 Verification 6개 대조

| # | 조건 | 판정 | 근거 |
| --- | --- | --- | --- |
| 1 | `Maybe.Monoid('first')` 가 원시값·객체 모두 동작 | ✅ **그러나 조건 자체가 부실했다** | `Just(1)+Just(2)→Just(1)`, `Just({})+Just({})→첫째` 통과. **동종 입력만 보게 쓰여 있어 이종 회귀를 구조적으로 못 봤다** — 리뷰 #1 |
| 2 | `first.concat(1, 'a')` 가 여전히 거부 | ✅ | `TypeError: Semigroup.concat: arguments must be the same type`. **다만 테스트로 고정하지 않았다** — 리뷰 #5 |
| 3 | `maybe-first`/`MaybeFirst` grep 0건 | ✅ | `grep -c` → 0 |
| 4 | `view` 3건 테스트 | ✅ | 3건 모두 통과. 리뷰어가 테스트 품질 자체는 문제없다고 확인(`assertThrowsWith` 는 `includes` 기반이나 문자열이 충분히 특정) |
| 5 | `npm test` + `tsc` | ✅ | 38 files passed, typecheck passed |
| 6 | 리뷰어 재검토 + 회차 1의 6건 대조 | ⚠ **통과 못 함** | **위반 6건**. `.dev/review/260811-15c84c-2-first-any.md` |

## 회차 1 리뷰 6건의 현재 상태

| 회차 1 | 상태 |
| --- | --- |
| #1 `CLAUDE.md` 에 없는 Strong/Choice/Wander 계층 | ✅ 해소 (회차 1 Compounding 에서) |
| #2 `MaybeAlt` 중복 | ⚠ **부분** — 중복 클래스는 지웠으나 처방(`Plus`→`Monoid` 유도)을 채택하지 않아 **회차 2 리뷰 #2 로 되돌아왔다** |
| #3 TS 에서 새 키 못 씀 | ✅ 해소 — 키를 없애서 문제가 사라짐 |
| #4 주석이 없는 이득을 주장 | ❌ **재발** — 이번엔 `foldMap` 을 있다고 서술 (회차 2 #3) |
| #5 `maybe-first` 이름 규약 위반 | ✅ 해소 — 키 제거 |
| #6 `view` 동작 변경 무검증 | ✅ 해소 — 명세대로 채택 + 테스트 3건. **단 `CLAUDE.md:208` 미갱신** (회차 2 #6) |

**해소 4 / 부분 1 / 재발 1.**

## 이번 회차가 새로 만든 회귀

`preview`/`view` 가 **타입이 섞인 대상에서 던진다.** HEAD 는 첫 대상을 돌려줬다.
직접 재현했다:

```
preview(traversed('array'), [1,'a'])   HEAD: Just(1)     현재: TypeError
preview(traversed('array'), [null,1])  HEAD: Just(null)  현재: TypeError
toListOf 는 영향 없음 — Monoid.of('array') 를 쓰므로
```

원인은 `_firstM = Maybe.Monoid('first')` 다. `Maybe.Monoid(innerSG)` 는 둘 다 `Just` 일 때
**안쪽 값을 합치므로** strict 검사에 걸린다. `preview` 가 필요한 것은 "첫 `Just` 를 통째로
고르기" 라 안을 안 보는 `Alt` 가 맞다 — 전수 대조에서 `Alt.of('maybe')` 가 HEAD 와 **7/7 일치**.

**커밋 전이라 밖으로 나가지 않았다.** 회차 3에서 고친다.

## 완료 조건(Selection) 대조

| # | 판정 |
| --- | --- |
| 1~6 | ✅ 회차 1에서 충족, 유지 |
| 7 (사설 딕셔너리 grep 0건) | ⚠ `_Identity`/`_Const` 잔존 — 계획서가 회차 3으로 분할 |
| 8 (모듈 객체 + bare export 제거) | ❌ 미착수 — 회차 4 |
| 9 (모든 수정이 리뷰 통과) | ❌ **미통과** — 위반 6건 |
| 10 (npm test·tsc·CI) | ⚠ 로컬 통과, **CI 미실행 — 커밋 안 함** |

## 이 회차에서 검증 설계가 틀린 곳

**계획서 Verification 1번이 회귀를 못 보게 돼 있었다.** "원시값·객체 모두 동작하는지" 만
물었다 — 둘 다 **동종** 입력이다. 바꾼 것이 "안쪽 값을 합치는 Monoid" 인데 **합쳐지는
대상이 서로 다를 때**를 안 물었다.

검증 조건을 쓸 때 "무엇이 바뀌었나" 가 아니라 **"바뀐 것이 무엇을 건드리나"** 로 물어야 했다.
`Maybe.Monoid(innerSG)` 로 갈아끼웠으면 물어야 할 것은 "inner 가 호출되는 경로가 어디이고
거기 무엇이 흘러들어오나" 였다.
