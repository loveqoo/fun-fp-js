# optics 부채 정리 — Static Land 구조로

## Context

하네스 0.72.0 회신으로 앞 회차의 막힘이 전부 풀렸다. 이번 회차는 **실제 코드**를 고친다.

이미 처리한 것(Scaffolding·Context 단계):

| | 결과 |
| --- | --- |
| `stages.json` 낡은 설치본 | `dev_subdirs` 에 `review` 추가, `verification_evidence` 를 기본값으로 복원 → **doctor 진단 0건** |

**절차 오류 하나를 기록한다**: `stages.json` 수정은 **구조 변경이므로 Scaffolding 의 일**인데
Context 단계에서 했다. 게이트가 경로 클래스만 보기 때문에(두 단계 모두 `context` 쓰기 가능)
걸리지 않았다. 결과는 옳으므로 되돌리지 않고 진행하되, 규칙으로 남겼다
(`.dev/learning/260811-15c84c-1-judgment-rules.md` 4번).
| 판단 실수 규칙 | `.dev/learning/260811-15c84c-1-judgment-rules.md` — `recall` 이 끌어온다 |
| `review` 노드 | `path add review --after execution` — **계획 승인 전에** 배치 완료 |

## 실행 그래프 (승인 대상)

```
selection → scaffolding → context → planning → execution → [review] → verification → compounding
                                                            ↑ 회차 한정, review_recorded 강제
```

`review` 노드를 넣은 이유: **이 영역에서 내 판단이 네 번 틀렸다.** 레지스트리 미확인,
YAGNI 로 구조 기각, 전제가 다른 선례 인용, 인스턴스를 만들어놓고 가둠. 자기검증으로는
같은 편향이 남는다.

## 고칠 것 — 리뷰어가 지목한 목록

`staticland-reviewer` 가 앞 회차에 실측으로 짚은 것들이다.

| # | 대상 | 문제 | 처리 |
| --- | --- | --- | --- |
| 1 | `_arrayMonoid`(:2291) | `Monoid.of('array')` 와 **완전 동일** | 삭제하고 레지스트리 사용 |
| 2 | `_firstMonoid`(:2287) | 미등록. `Semigroup.types` 엔 `first` 가 **이미 있다** | Maybe 기반 First Monoid 를 **등록** |
| 3 | `_lastMonoid`(:2293) | 미등록. `Semigroup.types` 엔 `last` 가 있다 | 위와 같음 |
| 4 | `_Identity`(:2277) | 미등록 Applicative. `Applicative.types` 에 `identity` 없음 | 등록 |
| 5 | `_Const(monoid)`(:2282) | 미등록 Applicative (매개변수화) | `Maybe.Monoid(innerSG)` 선례를 따라 등록 |
| 6 | 최상위 bare export 11개 | `set`/`over`/`view` 등이 전역 이름을 먹는다. `transducer` 는 모듈 객체인데 | 모듈 객체로 묶는다 |

### 따라야 할 선례 (전부 `index.js` 안에 있다)

- 인스턴스 등록: `class ArrayFunctor extends Functor { super(impl, 'Array', Functor.types, 'array') }` + `modules.push`
- 매개변수화 인스턴스 + 캐시: `Maybe.Monoid(innerSG)` — `_keyCache`/`_instanceCache`
- 키 또는 인스턴스 수용: `resolveInnerSemigroup(label, innerSG)`, `normalizeMonad(M)`
- 모듈 객체: `transducer.{transduce,map,filter,take}`

### 모듈 이름

`optics` 로 묶는다. `transducer` 가 소문자 단수인 선례를 따른다.

```js
optics.{ Iso, Lens, Prism, traversed, compose, view, preview, toList, foldMap, over, set, review }
```

**`composeOptic` → `compose`, `toListOf` → `toList`** — 모듈 안이므로 이름을 길게 만들어
충돌을 피할 이유가 없다. 길게 지은 것 자체가 네임스페이스가 없다는 증거였다.

**`foldMap` 을 새로 낸다** — Monoid 를 인자로 받아 사용자가 레지스트리에서 골라 쓸 수 있게.
`toList` 는 그 특수 경우가 된다. 지금은 Monoid 가 함수 안에 박혀 있어 배열로 모으는 것밖에
못 한다.

## 회차 분할

한 회차에 다 하지 않는다. **각 회차 끝에 `npm test` 초록 + 리뷰 통과.**

| 회차 | 범위 |
| --- | --- |
| **1 (지금)** | Monoid 3건(#1·#2·#3) — 가장 작고 선례가 명확하다 |
| 2 | Applicative 2건(#4·#5) |
| 3 | 모듈 객체(#6) + `foldMap` 신설 + 타입·문서 |

회차 1을 작게 잡는 이유: **리뷰 노드가 실제로 작동하는지 먼저 확인**하기 위해서다.
게이트를 큰 변경으로 시험하면 게이트 문제와 코드 문제가 섞인다.

## 회차 1 상세

`Semigroup.types` 에 `first`/`last` 가 이미 등록돼 있다. 그 짝으로 Monoid 를 만든다.
`Maybe` 기반이므로 `Maybe.Monoid(innerSG)` 와 같은 계열이다 — **등록 위치와 캐시 방식을
그 선례에 맞춘다.**

`_arrayMonoid` 는 삭제하고 `Monoid.of('array')` 로 바꾼다.

주의: `_lastMonoid` 는 `view` 전용이고 `empty()` 가 `undefined` 였다 — 리뷰어가
"대상 없음과 값이 undefined 를 구분 못 한다" 고 지적했다. 등록하면서 이 문제도 함께 본다.

## Verification

1. **조건 4 가 이번 회차의 핵심** — `review` 노드에서 파일 없이 `advance` 를 시도해
   거부되는지 실측한다. 게이트가 실제로 닫히는지 확인하는 것이 코드 수정보다 먼저다
2. `staticland-reviewer` 를 불러 변경을 검토받고 결과를 `.dev/review/` 에 남긴다
3. 지적 사항은 **Review 노드에서 고친다** — `write: ["dev"]` 뿐이므로 소스 수정이 필요하면
   그 사실을 기록하고 다음 회차로 넘긴다(노드 쓰기 권한이 좁은 것은 프리셋 설계다)
4. `npm test` + `tsc` + 문서 예제 검사기
5. 기존 optics 테스트 59개가 **깨지지 않는지** — 내부 교체이므로 동작이 같아야 한다

## 되돌리는 법

회차별 커밋. 회차 1은 Monoid 3건만 건드리므로 revert 범위가 좁다.

## 범위 밖

- Strong/Choice/Wander 타입 클래스 — 이번 작업의 뒤 회차 또는 별도 작업
- indexed optics
- `Monoid.of(instance)` 가 인스턴스를 안 받는 문제(리뷰어가 덤으로 발견) — 별도
