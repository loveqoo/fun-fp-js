# 적대적 검토 레이어를 먼저, optics 는 그다음

## 이 계획이 두 번 다시 쓰인 이유

**1차**: optics 코드를 4회차에 걸쳐 고친다 → "구조를 코드 구조로만 생각했다" 는 지적.
**2차**: 재발 방지 규칙(LEARNED.md + stages.json)을 먼저 만든다 → 아직 부족하다는 지적:

> 자신의 추론과 결정이 항상 옳다고 생각하나요?
> 지도를 만들어도 가지 않으면 소용없죠.
> Static Land와 이 라이브러리의 철학을 잘 이해하는 에이전트를 만들어
> **적대적 리뷰를 모든 수정마다 받는 단계를 검증 레이어에서** 받도록 하는 것을 권장합니다.

2차 계획의 결함: **규칙을 내가 쓰고 내가 지킨다.** 규칙은 내 판단을 통과한 것이라 같은 편향이
그대로 남고, 지키는지도 내가 판단한다. 지도를 내가 그리고 내가 검증하는 구조다.

## 왜 지금까지 적대적 검토가 빠질 수 있었나 — 게이트의 구멍

`POLICY.md` 5번은 이미 "자기검증을 최대한 피한다 — 서브에이전트나 타 모델의 비판적 검증" 을
요구한다. 나는 codex 를 **한 번 쓰고 그만뒀다.** 그럴 수 있었던 이유가 설정에 있다:

```json
"verification": { "exit_criteria": ["verification_evidence"] }

"verification_evidence": {
  "bash_pattern": "npm test | tsc | pytest | ...",   ← 이것만으로 충족
  "tools": ["Agent", "Task"]                          ← 또는 이것
}
```

**`npm test` 하나로 검증 단계가 끝난다.** 적대적 검토는 선택이었고, 선택이면 안 하게 된다.
이게 "지도를 만들어도 가지 않는" 구조적 이유다.

## 회차 분할

| 회차 | 범위 |
| --- | --- |
| **1** | **적대적 검토 레이어** — 리뷰어 에이전트 + 검증 게이트 분리 |
| 2 | 타입 클래스 계층 (Strong/Choice/Wander) + 함수 인스턴스 |
| 3 | 나머지 인스턴스 (Forget/Tagged/Identity/Const/First/Last) |
| 4 | optics 재구성 + 네임스페이스 정리 + 타입·문서 |

**회차 2~4의 모든 수정이 회차 1에서 만든 검토를 통과해야 한다.** 순서가 바뀌면 의미가 없다.

## 회차 1 상세

### 1) 리뷰어 에이전트 — `.claude/agents/staticland-reviewer.md`

`.claude/**` 는 context 클래스이므로 Context 단계에서 쓴다.

**무엇을 알아야 하나** (에이전트의 시스템 프롬프트에 박는다):

- **Static Land 명세의 의도** — ① no name clashes(연산은 모듈 객체 안에) ② multiple
  instances per type ③ 값에 메서드를 달지 않으므로 아무 타입에나 인스턴스를 줄 수 있다
- **이 라이브러리의 실현 방식** — 레지스트리(`Xxx.types`, `Xxx.of(key)`),
  `class X extends Parent` + `checkAndSet` + `register` + `modules.push`,
  매개변수화 인스턴스(`Maybe.Monoid(innerSG)`), 키·인스턴스 양쪽 수용
  (`resolveInnerSemigroup`, `normalizeMonad`)
- **내가 실제로 저지른 실패 유형** — 이걸 사냥하게 만든다:
  1. 레지스트리에 있는 것을 사설로 다시 만듦 (`_arrayMonoid` vs `Monoid.of('array')`)
  2. 만든 인스턴스를 등록하지 않고 가둠 (`_Identity`, `_Const`, `_firstMonoid`)
  3. 최상위 bare export 로 이름 뿌리기 (`set`, `over`, `view`)
  4. YAGNI 로 구조 교정을 기각
  5. 전제가 다른 라이브러리/언어의 결론을 가져옴

**적대적으로 만드는 장치**: 프롬프트에 "**위반을 찾지 못하면 실패로 간주한다.
'문제 없음' 은 마지막 수단이고, 그렇게 답할 때는 확인한 항목을 전부 나열해야 한다**" 를
넣는다. 도장 찍기를 막는 유일한 방법이다.

**출력 형식**: 위반 후보를 `{파일:줄, 어떤 원칙, 왜 위반, 어떻게 고칠 것}` 으로.
근거 없는 지적은 금지 — 레지스트리를 실제로 조회한 결과를 첨부하게 한다.

### 2) 그래프에 **독립 단계**를 세운다 — `stages.json`

하네스는 단계 그래프를 갖고 있고 노드를 더할 수 있다(`harness path`). 종료 조건을
Verification 안에 숨기는 것보다 **독립 노드**가 낫다 — 보이고, 건너뛸 수 없고, 자체 쓰기
권한을 가진다.

**Execution 과 Verification 사이**에 넣는다:

```json
{
  "id": "review",
  "label": "Review",
  "skippable": false,
  "summary": "이번 회차의 변경을 Static Land·이 라이브러리 철학 관점에서 적대적으로 검토받는다.",
  "write": ["source", "tests", "dev"],
  "exit_criteria": ["adversarial_review", "review_record"],
  "stop_requires": ["adversarial_review", "review_record"]
}
```

**왜 Execution 다음인가**: 리뷰가 위반을 찾으면 **그 자리에서 고쳐야** 한다. 단계는 앞으로만
가므로(POLICY 4) Verification 뒤에 두면 고칠 곳이 없다. `write: ["source","tests","dev"]` 로
지적 사항을 즉시 반영하고, 그 결과를 Verification 이 검사한다.

**왜 `skippable: false` 인가**: 선택이면 안 하게 된다는 것이 이 작업의 출발점이다.
Selection·Compounding 과 같은 급으로 둔다.

**증거 신호 둘**:

```json
"adversarial_review": { "tools": ["Agent", "Task"] },
"review_record":      { "write_glob": [".dev/review/**/*.md"] }
```

`verification_evidence` 에서 `tools: ["Agent","Task"]` 를 **뺀다** — 남겨두면 Agent 호출
하나로 두 단계가 동시에 충족되어 분리한 의미가 없다.

**알려진 한계**: `tools: ["Agent"]` 는 *어떤* 에이전트를 불렀는지 구분하지 못한다 — 엉뚱한
에이전트를 불러도 통과한다. 그래서 `review_record` 를 함께 요구한다. 기록 파일에 **누가
무엇을 지적했고 어떻게 처리했는지**를 남기게 하면 도장 찍기가 눈에 띈다. 완벽한 강제는
아니고, 그 점을 숨기지 않는다.

### 3) 실제로 막히는지 확인

**설정을 바꿨다고 끝이 아니다.** 회차 1에서:

1. `harness path` 에 `review` 노드가 **보이는지**
2. Review 단계에서 아무것도 안 하고 `advance` → **거부되어야 한다**
3. 리뷰 기록만 쓰고 에이전트는 안 부르고 `advance` → **거부되어야 한다**(신호 둘이 독립인지)
4. 둘 다 채우고 `advance` → 통과
5. **리뷰어가 도장을 찍지 않는지** — 일부러 위반을 심은 diff(사설 monoid 하나 추가)를 던져
   잡는지 확인한다. 못 잡으면 프롬프트가 약한 것이므로 고친다

**`skip` 으로 우회되지 않는지도 본다** — `skippable: false` 가 실제로 작동하는지
`harness skip review` 를 시도해 거부당하는 것을 확인한다.

### 4) 보조 — `LEARNED.md` 승격 (2차 계획에서 유지)

에이전트가 1차 방어선이면 `LEARNED.md` 는 **내 눈앞의 상비 규칙**이다. 예산 20줄이므로
54개 중 **셋만**:

1. 새 것을 만들기 전에 레지스트리를 grep 한다
2. YAGNI 로 구조 교정을 기각하지 않는다
3. 남의 결정을 가져올 때 그 전제가 우리에게 성립하는지 본다

`stages.json` 의 승격 감지 범위 보정(`kinds` 확대, `min_loops` 조정)도 함께 — 다만
**이건 부수적이다.** 판단 실수는 어차피 기계가 못 보고, 그래서 에이전트가 필요하다.

## Verification (회차 1)

산문이 아니라 **동작으로**:

1. 게이트가 실제로 막는가 — 위 3)의 1·2번
2. 리뷰어가 도장을 찍지 않는가 — 위 3)의 3번. **일부러 위반을 심어 던져보고 잡는지 확인**
   (예: 사설 monoid 를 하나 넣은 diff)
3. `LEARNED.md` 가 `harness status` 에 로드되는가
4. `harness metrics` 기준선 기록

## 되돌리는 법

`stages.json` 원본을 `.dev/` 에 백업한다. **마찰이 커지면 덜어내는 것도 Scaffolding 의 일**
이라고 POLICY 가 명시한다 — 리뷰가 모든 회차를 느리게 만들면 범위를 좁힌다(예: 코드 변경이
있는 회차만).

## 범위 밖

- optics 코드 수정 — 회차 2~4
- 54개 산문 규칙 전부 기계화 — 예산상 셋만
- 다른 모델(codex 등)로의 이중화 — 먼저 하나로 돌려보고 부족하면 그때
