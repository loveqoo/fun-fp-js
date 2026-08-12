검색 키: `판단 실수` `레지스트리` `YAGNI` `전제` `Static Land`

# 판단 실수 세 가지 — Context 단계에서 읽어라

`LEARNED.md` 는 하네스가 소유하고 승격은 `block:`/`tool_fail:` 만 받는다. **판단 실수는
승격 대상이 아니어서** 항상 로드되는 규칙으로 만들 수 없다(하네스 담당자가 별도 회차로
잡았다). 그때까지 여기 둔다 — `recall` 이 Context 단계에서 끌어온다.

셋 다 **이 저장소에서 실제로 반복된 것**이고, 사용자가 네 번에 걸쳐 지적해야 고쳐졌다.

## 1. 새 것을 만들기 전에 레지스트리를 grep 한다

```
node --input-type=module -e "import fp from './index.js'; console.log(Object.keys(fp.Monoid.types))"
```

**실제로 일어난 일**: `Traversable` 은 재사용해놓고(`traversed`) `Profunctor` 와 `Monoid` 는
존재 여부도 안 봤다. `_arrayMonoid` 는 `Monoid.of('array')` 와 **완전히 동일**했다.
`_Identity`/`_Const`/`_firstMonoid`/`_lastMonoid` 도 전부 타입 클래스 모양인데 등록하지 않았다.

**신호**: 지역 변수가 `{empty, concat}` · `{of, map, ap}` · `{dimap, ...}` 모양이면 멈춰라.
그건 타입 클래스 인스턴스다. 레지스트리에 이미 있는지, 없다면 등록해야 하는지 물어라.

**비용**: grep 5초. 안 해서 든 비용 — 중복 구현 1건, 갇힌 인스턴스 4건, 대화 4왕복.

## 2. YAGNI 로 구조 교정을 기각하지 않는다

`POLICY.md` 6번과 정면 충돌한다 — "당장의 구현 이득보다 구조를 바꾸는 쪽을 택한다".

**실제로 일어난 일**: "Strong/Choice/Wander 를 타입 클래스로 올리지 않는다" 를 YAGNI 로
정당화했고, 검색까지 해가며 **안 하는 근거를 정교하게 만들었다.**

**청구서는 "안 만듦" 이 아니었다** — 사설 Applicative 2개, 사설 Monoid 3개, 최상위 bare
export 11개. **다 만들어놓고 아무도 못 쓰게 가뒀다.** 아끼려던 비용은 처음부터 없었고
구조만 잃었다.

**신호**: "지금은 필요 없다", "나중에", "YAGNI" 를 쓰려는 순간 — 그것이 **구조를 회피하는
것인지** 자문하라. 회피라면 비용은 0이 아니라 이연될 뿐이다.

## 3. 남의 결정을 가져올 때 그 전제가 우리에게 성립하는지 본다

**세 번 다 틀렸다:**

| 가져온 것 | 우리에게 성립하나 |
| --- | --- |
| Haskell 의 `Wander` 난이도 (rank-2 타입 강제) | ❌ JS 는 딕셔너리를 값으로 넘긴다 |
| Haskell `well-typed/optics` 의 내부화 이유 (에러 메시지 품질) | ❌ 타입 추론 문제라 JS 에 없다 |
| JS optics 선례 (`optika`/`monocle-ts` 가 profunctor 를 감춘다) | ❌ **그 라이브러리들엔 레지스트리가 없다** — 넣을 곳이 없어서 감춘 것 |

세 번째를 못 잡은 이유가 2번(YAGNI)이다. **결론이 이미 정해져 있으니 그걸 지지하는 근거만
검증했다.**

**신호**: 근거로 다른 언어·라이브러리가 인용되면, **그 결정의 이유**를 찾아 우리에게도
성립하는지 확인하라. 결론만 가져오면 전제가 따라오지 않는다.

## 4. 구조 변경은 Scaffolding 에서 한다

`stages.json`, `.claude/**` 같은 **구조**를 고치는 일은 Scaffolding 의 몫이다.
Scaffolding 힌트가 명시한다 — "규칙이 늘어 마찰이 커졌으면 `stages.json` 을 덜어내는 것도
여기서 한다".

**실제로 일어난 일**: `stages.json` 을 Context 단계에서 고쳤다. 결과는 옳았지만
(`doctor` 4건 → 0건) 단계가 틀렸다.

**왜 안 걸렸나**: 게이트는 **경로 클래스**만 본다. `.claude/**` 는 context 클래스이고
Context 단계도 그걸 쓸 수 있으니 통과했다. **"이 종류의 변경이 이 단계에 속하는가" 는
아무도 안 본다.**

| 단계 | 쓰기 허용 | 무엇을 하는 곳인가 |
| --- | --- | --- |
| Scaffolding | source, tests, **context**, dev | **구조** — 폴더링, 인덱스, `stages.json`, 정리 |
| Context | context, dev | **기록** — 계층적 컨텍스트, `CLAUDE.md` 갱신, recall |

둘 다 `context` 를 쓸 수 있어 형식으로는 구분되지 않는다. **스스로 물어야 한다 — 이건
구조를 바꾸는 일인가, 맥락을 기록하는 일인가.**

**신호**: `.claude/harness/` 아래를 건드리려는 순간, 지금이 Scaffolding 인지 확인하라.
아니라면 이번 회차에 그 변경이 정말 필요한지, 다음 회차 Scaffolding 으로 미룰 수 있는지 보라.

## 이 넷을 기계로 막는 방법 (있는 것 / 없는 것)

| | 상태 |
| --- | --- |
| `staticland-reviewer` 에이전트 | ✅ 세 가지를 사냥하도록 프롬프트에 박혀 있다 |
| `review` 노드 (`.dev/review/` 기록 강제) | ✅ `path add review` 로 회차에 넣는다 |
| `LEARNED.md` 승격 | ❌ 판단 실수는 승격 어휘에 없다 — 담당자가 별도 회차로 |
| 이 파일 | ⚠ `recall` 이 Context 에서 끌어와야 작동한다 |
