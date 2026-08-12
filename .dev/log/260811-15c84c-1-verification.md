# Verification — 완료 조건 10개 대조 (회차 1)

작업 `260811-15c84c` 회차 1. 사용자가 이 회차에서 끊기로 했으므로 **미달 조건을 채우지 않고
그대로 기록한다.** 계획서가 조건 7·8 을 회차 2·3 으로 분할한 것이 이 판정의 전제다.

## 대조표

| # | 조건 | 판정 | 근거 |
| --- | --- | --- | --- |
| 1 | doctor 진단 0건 | ✅ | `harness doctor` (= `status` 별칭) 출력에 진단 줄 없음 |
| 2 | stages.json 0.72.0 스키마 + `dev_subdirs` 에 review | ✅ | `dev_subdirs` 8개에 `review` 포함, `loop_prefixed_dirs` 에도 포함, `node_presets.review` 존재 |
| 3 | `path add review` 를 계획 승인 전에 | ✅ | `harness path` 8노드에 `review (회차 한정)` 표시 |
| 4 | review 노드 실제 통과 + 기록 없으면 advance 거부 | ✅ | `.dev/review/260811-15c84c-1-monoid-registration.md`. 파일 없이 advance 시도 → 거부 확인 |
| 5 | 판단 실수 규칙을 `.dev/learning/` 에 | ✅ | `260811-15c84c-1-judgment-rules.md` (규칙 4개, 검색 키 포함) |
| 6 | 이전 회차 문서 오류 수정 | ✅ | `docs/Lens.md` → `docs/Optics.md` 재구성 회차에서 처리 |
| 7 | 사설 딕셔너리가 grep 되지 않음 | ⚠ **부분** | `_arrayMonoid`·`_firstMonoid`·`_lastMonoid` **0건**. `_Identity`·`_Const` **4건 잔존** — 계획서가 회차 2로 분할 |
| 8 | optics 가 모듈 객체로 묶임, bare export 11개 제거 | ❌ **미착수** | `index.js:2862` 에 `Iso, Lens, Prism, traversed, composeOptic, ...` 그대로 — 계획서가 회차 3으로 분할 |
| 9 | 모든 코드 수정이 리뷰를 **통과**했고 지적·처리가 기록됨 | ❌ **미통과** | 기록은 남았으나 **위반 6건**. 3건은 이번 회차에 내가 만든 것 |
| 10 | npm test·tsc·문서 예제 검사기 통과, CI Node 20/22 | ⚠ **부분** | 로컬 `38 passed / 0 failed`, `typecheck passed`. **CI 미실행 — 커밋 안 함** |

**충족 6 / 부분 2 / 미충족 2.** 조건 7·8 은 계획서의 회차 분할대로이므로 **이 회차의 실패가
아니다.** 조건 9 가 이 회차의 실질 결과다.

## 계획서 Verification 5번이 깨졌다 — 실측

계획서는 "기존 optics 테스트 59개가 깨지지 않는지 — **내부 교체이므로 동작이 같아야 한다**"
를 기준으로 삼았다. `git stash` 전후를 직접 실행해 대조했다.

| 호출 | 변경 전 | 변경 후 |
| --- | --- | --- |
| `view(prism, 5)` (매치 실패) | `undefined` | **TypeError** |
| `view(traversed('array'), [1,2,3])` | `3` (마지막) | `1` (첫째) |
| `view(traversed('array'), [])` | `undefined` | **TypeError** |

**3건이 달라졌다. 기준은 통과하지 않았다.**

그런데 **테스트 59개는 전부 초록이다.** 세 경우 중 어느 것도 테스트가 없기 때문이다.
`npm test` 초록이 "동작이 같다"의 증거가 되지 못한다는 것을 이 회차가 실측으로 보여줬다.

### 바뀐 동작이 더 나은가 — 별개 문제다

바뀐 쪽이 낫다고 **볼 여지는 있다**:
- `view(prism, 매치실패)` 가 조용히 `undefined` 를 주는 것은 "대상 없음"과 "값이 undefined"를
  구분하지 못한다. 계획서 79-88줄이 이미 지적한 문제다
- `view` 를 Traversal 에 쓰는 것 자체가 오용에 가깝다 — `preview`/`toListOf` 가 맞다

**그러나 그것은 결정이고, 결정에는 테스트·문서·`d.ts` 가 따라야 한다.** 지금은 Monoid 를
갈아끼운 **부수 효과**로 일어났고, 어디에도 적히지 않았다. 다음 회차에서 이 셋 중
하나를 골라야 한다:

1. 새 동작을 의도로 채택 → 테스트 3건 + `docs/Optics.md:189` 표 + `types/Lens.d.ts:79`
2. 이전 동작으로 되돌림 → `_lastM` 상당을 등록 인스턴스로 복원
3. `view` 를 Lens 전용으로 좁혀 Traversal 에 쓰면 별도 에러

## 이 회차가 실제로 증명한 것

완료 조건 4가 이번 회차의 핵심이었다 — **게이트가 실제로 닫히는가.**

- 파일 없이 `advance` → 거부됨 ✅
- 리뷰어가 **자기검증으로는 나올 수 없는 것**을 냈다: 내 계획서의 검증 기준이
  깨졌음을 stash 전후 실측으로 보임. 나는 `npm test` 초록만 보고 통과 처리했을 것이다
- 리뷰어가 지적한 6건 중 **3건이 이번 회차에 내가 만든 것**이고, 그중 1건(#1 CLAUDE.md 에
  존재하지 않는 Strong/Choice/Wander 계층)은 **이 세션에서 배운 교훈의 거울상**이다

## 미해결로 넘기는 것 — 다음 회차 Scaffolding/Execution

Verification 노드의 쓰기 권한은 `tests, dev` 뿐이라 소스·`CLAUDE.md` 를 고칠 수 없다.

**최우선**: `CLAUDE.md:240-247` 의 Strong/Choice/Wander 계층 도형. 항상 로드되는 문서가
코드에 없는 API 를 사실로 말하고 있다 — 다음 에이전트가 `Strong.of('function')` 을 부르고
`undefined` 를 받는다. **다음 회차 첫 작업으로 되돌린다.**

나머지 5건의 우선순위는 `.dev/review/260811-15c84c-1-monoid-registration.md` 표를 따른다.

## 커밋 상태

**아무것도 커밋하지 않았다.** 작업 트리에 `index.js`, `CLAUDE.md`, `stages.json`,
`.claude/agents/`, `.dev/**` 변경이 남아 있다. 조건 10 의 CI 항목은 그래서 미검증이다.
