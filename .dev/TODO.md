# `.dev/TODO.md` — 지금 어디인가

이 폴더의 다른 파일은 **끝난 일의 기록**입니다. 이 파일만 **지금의 상태**입니다.
`INDEX.md` 처럼 계속 고칩니다.

## 왜 있나

작업이 목록이 아니라 **그래프**로 엮입니다. 리뷰 판정 하나를 고치다 새 판정이 나오고,
그것을 고치려면 앞의 결정을 다시 봐야 합니다. 그때 "여기가 어디고 무엇이 남았는지" 를
대화 안에만 두면 사람도 에이전트도 길을 잃습니다. 실제로 잃었습니다 — 에이전트가
리뷰어의 번호를 자기 번호로 다시 매겨 말하는 바람에 소유자가 어느 항목인지 못 찾았습니다.

## 규약

1. **번호는 출처의 번호를 그대로 쓴다.** 리뷰어가 7번이라 하면 끝까지 7번이다.
   에이전트가 다시 매기지 않는다.
2. **닫힌 노드는 지우지 말고 접는다.** 왜 그 길로 갔는지가 다음 회차의 입력이다.
3. **작업을 시작할 때 읽고, 상태가 바뀔 때마다 고친다.** 커밋 직전에 한꺼번에 쓰면
   이 파일은 일기가 되고, 일기는 아무도 안 본다.

### 항목 하나의 포맷 — 권장이지 강제는 아니다

한 줄로 충분한 것은 한 줄로 씁니다. 다만 **완료조건은 반드시**, 그리고 **닫을 때는 검증이
반드시** 있어야 합니다.

```markdown
### [출처-번호] 한 줄 제목

- **원인** — 왜 이렇게 됐나. 증상이 아니라 경위다. 이게 없으면 다음 사람이 같은 실수를 한다.
- **해결책** — 무엇을 하면 되나. 아직 모르면 "미정" 이라고 쓴다.
- **완료조건** — 무엇이 **참이어야** 닫히나. 검증 가능한 형태로.
- **검증** — 닫을 때 채운다. **돌린 명령과 그 출력.** 이것 없이는 ✅ 로 못 바꾼다.
- **참고** — 링크. 소스 위치·판정 기록·규칙 번호. 긴 내용은 여기로 빼고 본문은 짧게 둔다.
```

**「검증」이 이 파일의 핵심입니다.** 이유는 이렇습니다 — 2026-08-13 에 `1차-9` 를 두고
에이전트가 "게이트 둘을 신설해 상당 부분 해소됐다" 고 말했는데, 뒤늦게 뮤테이션을 심어보니
42/42 초록으로 그대로 통과했습니다. **「초록 테스트」는 영수증이 아닙니다** — 아무것도 안
보는 게이트도 초록이기 때문입니다. 게이트에 대한 주장의 영수증은 **그 게이트가 잡는 뮤테이션**
하나입니다.

영수증이 없으면 **「확인 안 함」이라고 쓰십시오.** 그것은 완결된 답이지 실패가 아닙니다.
문장을 낮추는 비용은 항상 나중에 철회하는 비용보다 쌉니다.

상태: `⬜` 안 함 · `🟡` 진행 중 · `✅` 닫힘 · `⏸` 소유자 결정 대기

---

## 현재 위치 — 2026-08-13, 브랜치 `static-land-cleanup`

**목표: Static Land 명세와 실제 코드를 일치시킨다.**

```
✅ 레지스트리 정합성
✅ Ord 를 Setoid 로            ← 이 회차의 본체
🟡 검증 장치                    ← 지금 여기 — Functor~Traversable 법칙 하나만 남았다
✅ 남은 정리 — 전부 닫힘
```

**커밋 3개** — 라이브러리+게이트 · 작업 방식(이 파일과 판정 기록) · `.type` 명단.
작업 트리 clean. (해시는 안 적는다 — amend·rebase 로 바뀌면 이 줄이 거짓이 된다.)
`dist/` 는 HEAD 상태다 — 요청 시에만 빌드한다.

| 상태 | # | 무엇 |
| --- | --- | --- |
| 🟡 | — | [Functor~Traversable 법칙이 레지스트리 전체를 안 본다](#functor법칙) |
| ✅ | 1차-9 | [컨테이너 인스턴스의 `.type` 이 어떤 게이트에도 안 걸린다](#1차-9) |
| ✅ | 2차-3 | [`default` 의 동종 제약이 격자·문서에 없다](#2차-3) |
| ✅ | 2차-6 | [`FunctionFunctor.map` 이 `compose2` 를 손으로 다시 씀](#2차-6) |
| ✅ | 2차-8 | [부모 인스턴스 조회가 관례와 다름](#2차-8) |
| ✅ | 2차-9 | [거짓 주석 — "뼈대가 이미 정해 두고 있다"](#2차-9) |
| ✅ | 2차-10 | [죽은 앵커 `docs/internals.md#ord-setoid`](#2차-10) |
| ✅ | 2차-11 | [게이트 ③의 한계를 소스 주석이 과장](#2차-11) |
| ✅ | 1차-5 | [`_ordLte` — Ord 헬퍼가 Setoid 이름 아래](#1차-5) |
| ✅ | 1차-7 | [없어진 `struct(...)` 키를 광고하는 주석](#1차-7) |
| ⏸ | 1차-8 | [`either(...)` 항수가 레지스트리마다 다름](#1차-8) |
| ⏸ | — | [`NumberProductGroup` 이 0에서 군 법칙을 깬다](#곱셈군) |
| ⏸ | — | [`dist/` 재빌드](#dist) |

---

## 🟡 진행 중

<h3 id="functor법칙">Functor~Traversable 법칙이 레지스트리 전체를 안 본다</h3>

- **원인** — 값 수준 다섯 클래스(Setoid·Ord·Semigroup·Monoid·Group)는 표본만 있으면 법칙을
  돌릴 수 있어 먼저 했다. 컨테이너는 동등이 타입마다 달라 미뤘다 — `Task`·`Reader`·`State`
  는 안에 함수가 있어 구조 비교가 안 된다. **`Ord` 를 놓쳤던 것과 같은 모양의 구멍**이
  그대로 남아 있다: 각 `tests/*.test.js` 가 손으로 고른 인스턴스만 본다.
- **해결책** — 타입별 동등을 표로 두고(`Task` 는 `fork` 결과 비교 같은 관측 동등),
  `staticland-laws.test.js` 의 `LAWS`·`FACTORY_CASES` 구조를 그대로 확장한다.
- **완료조건** — `Functor` 등록 인스턴스 전부에 항등·합성 법칙이 돌고, 아무 인스턴스의 `map`
  을 뒤집는 뮤테이션이 잡힌다.
- **참고** — [`tests/staticland-laws.test.js`](./../tests/staticland-laws.test.js) 머리의
  「못 잡는 것」 · [`learning/INDEX.md`](./learning/INDEX.md) 규칙 31-1

## ⬜ 남은 것

<h3 id="2차-3">✅ [2차-3] <code>default</code> 의 동종 제약이 격자·문서에 없다</h3>

- **원인** — `lookup('default')` 를 정식 인스턴스로 만들면서 타입 검사가 붙었다.
  `equals(1,'a')` 가 `false` → 던짐으로 바뀌었다. **소유자 승인을 받은 의도된 변경**이지만,
  그 사실을 지키는 장치가 없다. `tests/baseline-report.js` 에 `default` 언급이 0건이고
  `docs/internals.md` 의 `'any'` 절은 새 인스턴스 둘을 모른다.
- **해결책** — 격자에 이종 비교 한 줄, `#any` 절에 `DefaultSetoid`/`DefaultOrd` 추가.
- **완료조건** — 그 제약을 되돌리는 뮤테이션(`type:'any'` → 검증 없는 리터럴)이 잡힌다.
- **검증 (2026-08-13)** — 세 곳에 박았다. ① `docs/internals.md#any` 에 절을 더했고 예제가
  `docs-examples.test.js` 에서 돈다(485개 통과) ② `tests/setoid.test.js`·`ord.test.js` 가
  이종 인자의 던짐과 인스턴스 동일성을 전문으로 고정 ③ `baseline` 격자에 네 줄.
  되돌리는 뮤테이션을 양쪽에 심어 확인: `DefaultSetoid.equals = Setoid.op` → **41/1**,
  `DefaultOrd.lte = Ord.op` → **41/1**. `npm run baseline` 차이 없음.
- **참고** — [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 3번 · [`index.js:1003`](./../index.js#L1003) · [`docs/internals.md`](./../docs/internals.md) `#any`

<h3 id="2차-6">✅ [2차-6] <code>FunctionFunctor.map</code> 이 <code>compose2</code> 를 손으로 다시 씀</h3>

- **원인** — 명세 게이트 ③을 만족시키려고 `FunctionFunctor` 를 급히 만들면서, 같은 파일에
  이미 있는 `compose2` 를 조회하지 않고 람다를 직접 썼다. **관례를 실행으로 조회하라는
  규칙 22를 어겼다** — 형제 둘은 이미 `super(compose2, …)` 로 넘기고 있다.
- **해결책** — `super(compose2, 'function', Functor.types, 'function')`.
- **완료조건** — 형제 셋의 형태가 같고, 전 입력에서 `map`/`concat`/`compose` 결과가 일치한다
  (이미 일치함을 실측). 합성 방향 뒤집기 뮤테이션은 이미 잡힌다.
- **검증 (2026-08-13)** — `super(compose2, 'function', Functor.types, 'function')` 로 바꿔 형제 둘과
  형태가 같아졌다. 전 입력 대조: `Functor.map` / `Semigroup.concat` / `Semigroupoid.compose` 가
  `[10,20,-10,80]` 로 셋 다 일치. `npm run baseline` 차이 없음.
- **참고** — [`index.js:803`](./../index.js#L803) vs [`index.js:94`](./../index.js#L94) ·
  형제: `FunctionSemigroup`·`FunctionSemigroupoid` · [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 6번 · [`learning/INDEX.md`](./learning/INDEX.md) 규칙 22

<h3 id="2차-8">✅ [2차-8] 부모 인스턴스 조회가 관례와 다름</h3>

- **원인** — `Ord extends Setoid` 를 만들며 짝 Setoid 를 `Setoid.lookup('number')` 로 꺼냈다.
  파일의 선례 68곳은 전부 `Parent.types.ClassName` 이다. 실행으로 관례를 조회하지 않았다.
- **해결책** — 68곳과 형태를 맞추거나, `lookup` 을 고르는 이유(미등록 시 라벨 있는 TypeError)를
  **한 줄로 적고 결정으로 기록**한다. 규칙 19: 다른 규칙을 들여놓는 것은 결정이다.
- **완료조건** — `grep` 집계가 한 형태로 모이거나, 두 형태가 공존하는 이유가 소스에 적혀 있다.
- **검증 (2026-08-13)** — 여섯 자리를 `Setoid.types.<클래스이름>` 으로 바꿨다.
  집계가 한 형태로 모였다: `.types.X` 68 → **74**, `Setoid.lookup` 6 → **0**.
  `npm run baseline` 차이 없음.
- **참고** — [`index.js:873`](./../index.js#L873) `946` `960` `972` `1011` `1222` ·
  현재 집계 `.types.X` 68 / `Setoid.lookup` 6 · [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 8번

<h3 id="2차-9">✅ [2차-9] 거짓 주석 — "뼈대가 <em>이미</em> 정해 두고 있다"</h3>

- **원인** — `Either.Setoid` 를 공용 뼈대에 올리며 주석을 달았는데 두 겹으로 틀렸다.
  ① 그 다인자 분기는 **같은 변경에서 새로 만든 것**이라 "이미" 가 아니다.
  ② 안쪽 하나라도 미등록이면 캐시가 **아예 안 걸린다**. 바로 위 주석이 그렇게 설명하는데
  이 줄이 반대로 말한다.
- **해결책** — "안쪽이 둘이면 양쪽 키를 다 알 때만 캐시된다" 로 고치거나 지운다.
- **완료조건** — 소스를 읽고 실행 결과와 모순이 없다(소유자 판단).
- **검증 (2026-08-13)** — `index.js:1565` 를 "양쪽 키를 다 알 때만 캐시된다 — 한쪽이 미등록이면
  캐시가 없다" 로 고쳤다. 실행 대조: 양쪽 키면 `Either.Setoid('string','number')` 동일성 `true`,
  왼쪽을 미등록 인스턴스로 주면 `false`.
- **참고** — [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 9번 · [`index.js:1565`](./../index.js#L1565)

<h3 id="2차-10">✅ [2차-10] 죽은 앵커 <code>docs/internals.md#ord-setoid</code></h3>

- **원인** — 주석이 두 줄을 넘어가서 `docs/` 로 빼고 힌트만 남기는 규약을 따랐는데,
  **가리킨 절을 만들지 않았다.** 지금 그 앵커는 0개다.
- **해결책** — `docs/internals.md` 에 `{#ord-setoid}` 절을 만들고 길이·로케일 예제를 넣는다.
  문서 예제는 테스트가 실행하므로 **그것이 곧 회귀 테스트**가 된다.
- **완료조건** — 앵커가 실재하고, 그 절의 예제가 `docs-examples.test.js` 에서 돈다.
- **검증 (2026-08-13)** — `docs/internals.md` 에 `{#ord-setoid}` 절을 만들었다(앵커 0개 → 1개).
  예제 넷이 `docs-examples.test.js` 에서 돈다 — 484개 전부 통과. 길이 순서의 반대칭과
  NFC/NFD 로케일 동치를 예제가 실행한다.
- **참고** — [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 10번 · [`index.js:951`](./../index.js#L951) · [`docs/internals.md`](./../docs/internals.md)

<h3 id="2차-11">✅ [2차-11] 게이트 ③의 한계를 소스 주석이 과장</h3>

- **원인** — `FunctionFunctor` 주석에 "명세가 요구하는 그것이다" 라고 단정했다. 그런데 그
  판정을 내리는 게이트는 `.type` **문자열**만 비교한다. `TupleBifunctor`(`.type='Array'`)가
  `ArrayFunctor` 로 만족되는데, 튜플의 둘째 자리만 매핑해야 할 자리에 배열 전체를 매핑하는
  Functor 다. **게이트가 확인한 것이 아닌데 확인한 것처럼 썼다.**
- **해결책** — 주석에서 단정을 빼고 무엇인지만 말한다(`map = 후합성`). 게이트 파일의
  「못 잡는 것」에 `TupleBifunctor` 사례를 명시한다.
- **완료조건** — 주석에 게이트가 보증하지 않는 주장이 없다(소유자 판단).
- **검증 (2026-08-13)** — `index.js:802` 에서 "명세가 요구하는 그것이다" 를 빼고
  "map 은 후합성이다 — compose2 와 같은 연산" 으로 바꿨다. 실행 대조: `map(g,fn)` 과
  `Semigroupoid.compose(g,fn)` 이 전 입력에서 `[10,20,-10,80]` 로 일치.
  게이트 ③의 한계(`TupleBifunctor` 가 `ArrayFunctor` 로 만족된다)를
  `tests/staticland-spec.test.js` 머리의 「못 잡는 것」에 실측값과 함께 적었다.
- **참고** — [`index.js:803`](./../index.js#L803) ·
  [`tests/staticland-spec.test.js`](./../tests/staticland-spec.test.js) 검사 ③ · [`review/260813-index-audit-2.md`](./review/260813-index-audit-2.md) 11번

<h3 id="1차-5">✅ [1차-5] <code>_ordLte</code> — Ord 헬퍼가 Setoid 이름 아래</h3>

- **원인** — 컨테이너 Ord 를 만들며 배열 사전식 비교 함수를 `Setoid.Array._ordLte` 로 붙였다.
  이 파일에서 공개 팩토리에 붙은 밑줄 속성은 **전부 캐시**인데 이것만 로직이다. 밖에서
  `fp.Setoid.Array._ordLte` 로 닿는다 — 공개 표면 오염이다.
- **해결책** — 파일의 다른 헬퍼처럼 모듈 지역 `const arrayOrdLte` 로 내리고 `Ord.Array` 위에 둔다.
- **완료조건** — `fp.Setoid.Array._ordLte` 가 `undefined` 이고 42/42 초록.
- **검증 (2026-08-13)** — 모듈 지역 `const arrayOrdLte` 로 내렸다.
  `fp.Setoid.Array._ordLte` 가 `undefined`(공개 표면에서 사라졌다). 사전식 동작 그대로:
  `lte([1,2],[1,3])` `true` · `lte([1,3],[1,2])` `false` · `lte([1],[1,0])` `true` ·
  반대칭 `equals([1,2],[1,2])` `true`. `npm run baseline` 차이 없음.
- **참고** — [`review/260813-index-audit.md`](./review/260813-index-audit.md) 5번 · [`index.js:1555`](./../index.js#L1555) · 사용처는 [`1564`](./../index.js#L1564) 한 줄뿐

<h3 id="1차-7">✅ [1차-7] 없어진 <code>struct(...)</code> 키를 광고하는 주석</h3>

- **원인** — `struct` 를 레지스트리 밖으로 빼면서 키 문법을 없앴는데, 그 문법을 설명하는
  주석을 안 고쳤다. 지금 그 키로 조회하면 던진다.
- **해결책** — `struct(age:number,name:string)` 를 지우고 "내부 캐시 키" 라고만 쓴다.
- **완료조건** — 주석이 광고하는 키가 실제로 조회된다, 또는 그런 주장이 없다.
- **검증 (2026-08-13)** — `index.js:1573` 을 "내부 캐시 키만 필드 이름 정렬로 정규화한다
  (조회 키는 없다)" 로 고쳤다. 실행 대조: `Setoid.lookup('struct(a:number)')` → `unsupported key`,
  `Setoid.Struct({b,a}) === Setoid.Struct({a,b})` → `true`.
- **참고** — [`review/260813-index-audit.md`](./review/260813-index-audit.md) 7번 · [`index.js:1573`](./../index.js#L1573)

## ⏸ 소유자 결정 대기

<h3 id="1차-8">[1차-8] <code>either(...)</code> 항수가 레지스트리마다 다름</h3>

- **원인** — `Setoid` 쪽 `either` 를 2항으로 도입할 때 `Semigroup` 에 이미 1항 `either` 가
  있다는 것을 근거에 넣지 않았다.
- **왜 에이전트가 못 정하나** — 조립 키는 이 라이브러리의 **공용 타입 문법**이다. 한쪽으로
  통일하는 것은 설계 결정이고, `Either.Semigroup` 을 2항으로 넓히면 `Validation` 처럼 왼쪽을
  누적하는 인스턴스로 가는 길이 열린다. 그 방향을 소유자가 정해야 한다.
- **참고** — [`review/260813-index-audit.md`](./review/260813-index-audit.md) 8번
- **실측** — `Semigroup.lookup('either(number)')` 성공 / `Setoid.lookup('either(number)')` 던짐,
  그 반대도 마찬가지.

<h3 id="곱셈군">[⏸] <code>NumberProductGroup</code> 이 0에서 군 법칙을 깬다</h3>

- **원인** — 0은 곱셈 역원이 없다(`1/0 = Infinity`, `0 × Infinity = NaN`). 수학적으로 옳다 —
  곱셈 군은 0을 뺀 수에서만 군이다. **그리고 0이 아니어도 부동소수점이 깬다** — `a × (1/a)` 가
  정확히 1이 되려면 반올림이 상쇄돼야 해서 `49`·`1e21`·`9.571…` 같은 평범한 값에서 깨진다
  (실측). `-3`·`0.1` 은 우연히 성립한다.
- **왜 에이전트가 못 정하나** — 결함이 아니라 사실이다. 문서에 경고를 넣을지, 그냥 둘지는 판단이다.
- **참고** — [`tests/staticland-laws.test.js`](./../tests/staticland-laws.test.js) 의
  `SAMPLE_OVERRIDES` — 이유가 적혀 있다

<h3 id="dist">[⏸] <code>dist/</code> 재빌드</h3>

오늘 `index.js` 가 크게 바뀌었지만 `dist/` 는 HEAD 상태다. 빌드·커밋·푸시는 요청 시에만 한다.

---

## ✅ 닫힌 것

<details><summary><b>[1차-9] 컨테이너 인스턴스의 <code>.type</code> 이 게이트 밖이었다</b></summary>

<span id="1차-9"></span>

- **원인** — `.type` 게이트의 "팩토리로만 생기는 파생 인스턴스" 명단이 다섯 개짜리 고정
  목록인데, 컨테이너 `Setoid`/`Ord` 여섯이 거기 없다. **주 에이전트가 "게이트 둘을 신설해
  상당 부분 해소됐다" 고 말했는데 근거 없는 말이었다** — 새 게이트는 *메서드가 있는가*와
  *메서드끼리 맞는가*를 보지 `.type` **값**을 안 본다.
- **해결책** — `tests/algebra-type.test.js` 의 그 명단에 여섯 줄을 더한다:
  `Maybe.Setoid`·`Maybe.Ord`·`Setoid.Array`·`Ord.Array`·`Either.Setoid`·`Setoid.Struct`.
  마지막 것은 레지스트리 밖이라 이 목록이 유일한 감시자다.
- **완료조건** — 여섯 자리의 `.type` 을 비정규 소문자로 바꾸는 뮤테이션이 **전부** 잡힌다.
- **검증 (2026-08-13)** — `tests/algebra-type.test.js` 의 팩토리 명단에 여섯 줄을 더한 뒤
  하나씩 심어 확인했다. 여섯 전부 `41 passed, 1 failed`:
  `Maybe.Setoid`→`'maybe'` · `Maybe.Ord`→`'maybe'` · `Setoid.Array`→`'array'` ·
  `Ord.Array`→`'array'` · `Either.Setoid`→`'either'` · `Setoid.Struct`→`'object'`.
  매번 `cmp` 로 작업 트리 복원을 확인했고 복원 후 42/42 초록.
  (고치기 전에는 같은 뮤테이션이 42/42 초록으로 통과했다.)
- **참고** — [`review/260813-index-audit.md`](./review/260813-index-audit.md) 9번 ·
  [`tests/algebra-type.test.js:172`](./../tests/algebra-type.test.js) ·
  [`learning/INDEX.md`](./learning/INDEX.md) 규칙 31-1

</details>


<details><summary><b>레지스트리 정합성</b> — 세 항목</summary>

| 무엇 | 완료조건 | 검증 (2026-08-13) |
| --- | --- | --- |
| `lookup('default')` 를 정식 인스턴스로 | 레지스트리·`Algebra.all`·`.type` 게이트에 보인다 | `Algebra.all('any')` → `firstSemigroup,lastSemigroup,defaultSetoid,defaultOrd` · `Setoid.Array('default')` 캐시 히트 `false`→`true` |
| 컨테이너 팩토리 뼈대 통합 (손코드 4개 제거) | `baseline` 차이가 에러 메시지뿐 | 41항목 대조 → 차이 9건 전부 에러 메시지. 동작·캐시·중첩 키·등록 키 목록 32건 차이 0 |
| 인자 개수 검증 복구 | 개수 오류에 던지고 레지스트리에 `undefined` 키 0개 | `Maybe.Setoid()` → `expects 1 inner argument, got 0` (8팩토리) · `undefined` 포함 키 `[]` · 검증 제거 뮤테이션 → **41/1** |

세 번째는 두 번째가 **낸 회귀**다. 뼈대를 가변 인자로 넓히며 `[].every()` 가 공허하게 참이
되는 것을 놓쳤다. 격자에 정상 호출만 있어 `baseline` 이 못 잡았다 — **격자는 실패 경로도 담아야 한다.**

</details>

<details><summary><b>Ord 를 Setoid 로</b> — 이 회차의 본체</summary>

명세: "Ord must support Setoid algebra for the same T". 코드는 `Ord extends Algebra` 였고
타입 선언은 `extends Setoid` 라고 **거짓말**하고 있었다 — `tsc` 통과 후 런타임 `TypeError`.

| 무엇 | 완료조건 | 검증 (2026-08-13) |
| --- | --- | --- |
| `class Ord extends Setoid` + 생성자 | `Ord.lookup(k).equals` 가 함수 | `Ord.lookup('number').equals(1,1)` → `true` (전 `TypeError`) · `new Ord({}, lte, 'number')` → `Ord: argument must be a Setoid` |
| 짝 Setoid 8자리 | `lte` 동작이 HEAD 와 동일 | `baseline` 35항목 → 차이 12건 전부 의도한 것, `lte` 11건 차이 0 |
| 길이·로케일 동치를 별도 Setoid 로 | `StringLengthOrd.equals('ab','cd') === true` | 실측 `true` · 짝을 `StringSetoid` 로 바꾸는 뮤테이션 → **41/1** (`반대칭 깨짐: "ab" 와 "cd"`) |

`StringLengthOrd` 는 `'ab'` 와 `'cd'` 를 같은 자리에 놓으므로 글자 동등과 **다른 동치**를
유도한다. `StringSetoid` 를 재활용했다면 "같은 자리인데 같지 않다" 는 모순된 물건이 됐다.

**[2차-7] 은 처방을 기각하고 닫았다.** 리뷰어가 "안쪽 키로 `Setoid.Array(key)` 를 불러
공유하라" 고 했는데, 그러면 `Ord.Array(StringLengthOrd)` 의 반대칭이 깨진다(키로 조회한
`Setoid.Array('string')` 은 `equals(['ab'],['cd'])` 를 `false` 라 한다). 코드 대신 그
지름길을 막는 법칙 케이스를 넣었고, 처방을 뮤테이션으로 심으니 41/1 로 잡힌다.

</details>

<details><summary><b>게이트 셋</b>과 뮤테이션 검증</summary>

`.type` 태그(`algebra-type`) → 메서드 존재(`staticland-spec`) → 메서드끼리 맞는가
(`staticland-laws`). 셋이 서로를 검사한다 — 인스턴스를 하나 늘리면 세 곳이 동시에 멈추고
각각 이유를 요구한다.

**검증 (2026-08-13)** — 리뷰어가 뚫었던 6건 + 인자 검증 제거를 다시 심어 전부 `41 passed,
1 failed`. 목록: `DateOrd` 짝 교체 · `Ord.Array` 짝 교체 · `Maybe.Ord` 짝 교체 · 인스턴스
캐시 arity 분기 제거 · `Ord.super` 검증 끄기 · `FunctionFunctor` 합성 뒤집기 · 인자 검증 제거.
매번 `cmp` 로 작업 트리 복원을 확인했다.

리뷰어가 법칙 게이트를 **6번 뚫었고** 전부 막았다. 원인은 둘이었다:
① 참조 타입 표본에 "서로 다른 객체인데 동치인 쌍" 이 없어 반대칭 분기가 `a === b` 일 때만 탔다.
② 레지스트리 순회만 해서 팩토리 산물을 안 봤다.

부수 발견: `tests/utils.js` 의 `assertThrows` 는 "던지는가" 만 보고 두 번째 인자는 설명으로만
쓴다. 그 파일의 기존 검증 테스트들이 넘기는 정규식은 **전부 장식**이다. 메시지를 대조하려면
`assertThrowsWith` 를 써야 한다.

</details>
