# Verification — 회차 6 (적대적 리뷰 없이 종료)

## 리뷰어를 부르지 않았다 — 사용자 결정

`staticland-reviewer` 호출이 회차당 **30~48분** 걸리고 그동안 턴이 막힌다.
사용자가 48분째에 강제 종료하고 **"여기서 멈추고 정리한다"** 를 골랐다.

**이것은 게이트 미통과다.** 회차 1~5는 전부 리뷰를 거쳤고 매번 6~12건이 나왔으며 그중
회귀도 있었다. 회차 6의 변경(특히 이중 래핑 제거)은 **타입 클래스 전체에 닿으므로**
리뷰 없이 커밋하면 안 된다.

## 계획서 Verification 5개 대조

| # | 조건 | 판정 | 근거 |
| --- | --- | --- | --- |
| 1 | `npm run baseline` — A 는 관측 동등 | ✅ | 53케이스, 차이 12건. 회차 5와 **동일**(새 차이 0) |
| 2 | 성능 3시점 비교표 | ✅ | 아래 |
| 3 | `npm test` + `tsc` | ✅ | 38 files passed, typecheck passed |
| 4 | 뮤테이션 — 심볼 위조 복원이 **잡혀야 한다** | ✅ | **2건 빨간불** (회차 5에서는 0건) |
| 5 | `staticland-reviewer` | ❌ **미실시** — 사용자 결정 |

## 성능 — 20.3배 → 7.3배

100원소 배열, 20000회:

| | HEAD | 회차 5 | 회차 6 |
| --- | --- | --- | --- |
| `preview` | 12.1ms | 221ms (20.3배) | **88.7ms (7.3배)** |
| `toListOf` | 101.7ms | 367ms (3.8배) | **225ms (2.2배)** |
| `over` | 109.1ms | 263ms (2.4배) | **177ms (1.6배)** |

**남은 7.3배는 검사를 실제로 도는 비용이다.** HEAD 가 빨랐던 것은 심볼을 위조해 검사를
통째로 건너뛰었기 때문이다 — 속도가 아니라 검사가 없었다.

### 안전성 증명 (사용자가 "타입 문제" 를 경고했으므로)

`unwrapIfSameType(instance, source, ...methods)` 는 **`instance.type !== source.type` 이면
아무것도 하지 않는다.** 같을 때만 바깥 겹을 안쪽으로 되돌린다.

근거 — 바깥 겹의 조건이 안쪽과 글자 그대로 같다:

```javascript
// Functor 가 씌우는 것 (두 겹 모두 이것이다)
instance.map = (f, a) =>
    (types.isFunction(f) && types.check(a, instance.type)) ? map(f, a) : raise(...)
```

실측 확인:

| 확인 | 결과 |
| --- | --- |
| 타입이 다른 `Apply`(Functor=Array, Apply=Maybe) | 바깥 겹 **유지**, `Apply` 의 타입으로 거부 — 둘 다 THROW |
| 타입이 같은 경우 | 한 겹이지만 함수 검사·타입 검사 모두 THROW |
| `Functor`·`Apply`·`Alt`·`Plus`·`Monoid`·`Semigroup`·`Traversable` 8종 | **전부 여전히 THROW** |

## 게이트가 하나 생겼다

`identity` 를 `Applicative.types` 에 등록하고 `Applicative.Const(monoid)` 를 팩토리로 냈다.

| 뮤테이션 | 회차 5 | 회차 6 |
| --- | --- | --- |
| 심볼 위조로 복원 | 38/38 통과 (**안 잡힘**) | **2건 빨간불** |

회차 5 리뷰 #7 이 "등록만이 게이트를 만든다" 고 했고 그대로 됐다.

## 완료 조건(Selection) 대조

| # | 판정 |
| --- | --- |
| 1~6 | ✅ 유지 |
| 7 (사설 딕셔너리 grep 0건) | ✅ **달성** — `_arrayMonoid`·`_firstMonoid`·`_lastMonoid`·`_Identity`·`_Const` 전부 0건. optics 구간 `^const _` 도 0건 |
| 8 (모듈 객체 + bare export 11개 제거) | ❌ **미착수** — 계획서가 회차 7로 분할 |
| 9 (모든 수정이 리뷰 통과) | ❌ 회차 6 미실시 |
| 10 (npm test·tsc·CI) | ⚠ 로컬 통과, **CI 미실행 — 커밋 안 함** |

## 커밋하기 전에 반드시 할 것

1. **회차 6에 대한 적대적 리뷰** — 특히 `unwrapIfSameType`(타입 클래스 전체에 닿는다)
2. 완료 조건 8 (모듈 객체 + bare export)
3. `docs/` 의 `plus(` 0건
