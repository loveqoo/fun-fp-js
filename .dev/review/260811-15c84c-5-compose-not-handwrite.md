# 적대적 리뷰 — optics 를 레지스트리 조합으로 (회차 5)

리뷰어: `staticland-reviewer` (도구 호출 44회)

## 판정: 위반 8건. 회차 4의 12건 중 **7건 해결**

| 해결 | `_asApplicative` 심볼 위조 제거 · `bimap` 조합 2건 · 네이밍(`^const _` optics 구간 0건) ·
`types/Lens.d.ts:78`(3회차 만에) · d.ts 뮤테이션 검거 · `CLAUDE.md` view 모순 · `docs/Optics.md` 과장 |
| 미해결 | `plus(` docs 0건 · 재래핑 · `plus(maybe)` 이름 · `plus(array)` 중복 |

---

## 소유자 지시에 직접 걸리는 것 — 즉시 고쳐야 한다

### #1 내가 쓴 "대안이 없다" 주석이 **거짓이다**

```javascript
// 짝의 왼쪽만 꺼내는 fst 는 레지스트리에 없다 — 이것만 손으로 쓴다.
first: p => ([a, _c]) => p(a),
```

**`Comonad.of('array').extract` 가 바로 그 연산이다.** 직접 확인:

```
index.js:1067  super(Extend.types.ArrayExtend, arr => arr[0], 'Array', Comonad.types, 'array')
Comonad.of('array').extract([3, 's'])  →  3
```

`fst` 라는 **이름**이 없을 뿐 **연산은 등록돼 있다.** 그리고 두 줄 위에서 내가 튜플을
`Bifunctor.of('tuple')` 로 다루기로 했으면 head 를 `Comonad.extract` 로 꺼내는 것도 같은 규칙이다.
**자기가 세운 규칙을 두 줄 아래에서 안 지키고 거짓 주석을 박았다.**

리뷰어 치환 실증: `first: p => t => p(Comonad.of('array').extract(t))` → **38/38 + tsc 통과,
baseline 차이 12건 그대로.**

### #2 `composeOptic` 이 이 파일의 `compose` 를 손으로 다시 쓴다

```javascript
return P => pab => optics.reduceRight((acc, o) => o(P)(acc), pab);
```

`index.js:127` 에 `compose` 가 있고 export 돼 있다(`typeof fp.compose === 'function'` 확인).
`compose(...optics.map(o => o(P)))(pab)` 와 정의상 동일하고, **바로 위 주석이
"optic 합성 = 함수 합성" 이라고 쓰고는 함수 합성을 안 쓴다.**

같은 줄기 3건:

| 위치 | 지금 | 조합 |
| --- | --- | --- |
| `index.js:2428` `set` | `over(optic, () => b, s)` | `over(optic, constant(b), s)` — `constant` export 확인 |
| `index.js:2387` | `a => Either.Left(a)` | `Either.Left` |
| `index.js:2396` | `(F,f,s) => instance.traverse(F,f,s)` | `instance.traverse` |

리뷰어 치환 실증: `composeOptic`+`set` 둘 다 바꿔 **38/38 + tsc 통과, baseline 그대로.**

**단 인자 검증 루프(`composeOptic: argument ${i}`)는 남겨야 한다** — `compose` 는 `o(P)`
결과만 보므로 인덱스가 붙은 조기 진단을 잃는다.

---

## 사람이 판단해야 하는 것 — 성능

### #4 optics 읽기 경로가 **2~20배** 느려졌다. 계획서에 측정 항목이 없었다

내가 직접 잰 것 (100원소 배열, 20000회):

| | HEAD | 현재 | 배율 |
| --- | --- | --- | --- |
| `preview` | 10.9ms | 221.3ms | **20.3배** |
| `toListOf` | 96.5ms | 367.2ms | 3.8배 |
| `over` | 111.0ms | 263.0ms | 2.4배 |

**리뷰어가 원인을 한 가지씩 되돌려 분해했다:**

| 되돌린 것 | preview |
| --- | --- |
| (현재) | 228.0 |
| **클래스 Applicative → 심볼 위조 dict** | **95.0** ← 주범 |
| `Monoid.of(...)` → 손으로 쓴 monoid | 181.6 |
| `bimap` 조합 → 손코드 | 262.3 (노이즈) |
| `constApplicative` 캐싱 | 219.7 (−4%) |

**캐싱은 답이 아니다(−4%).** 비용은 인스턴스 생성이 아니라 **원소마다 `checkAndSet` 래퍼를
통과하는 것**이고, `Applicative → Apply → Functor` 가 **이중 래핑**한다
(`index.js:546` `super(functor.map, type)`, `:556` `super(apply, apply.ap, type)`).

**`bimap` 조합과 `Profunctor.of` 조회는 성능 원인이 아니다** — 조합 자체를 되돌릴 이유는 없다.

즉 **"검증을 우회하지 않는다" 의 대가가 20배다.** 회차 4 리뷰 #1 이 재래핑 제거로 −39%
가능함을 보였는데 회차 8로 미뤄뒀다 — **그 값이 이번 회차에 훨씬 비싸졌다.**

---

## 나머지

| # | 내용 |
| --- | --- |
| **3** | `identityApplicative`/`constApplicative` 가 **여전히 미등록**. `Applicative.types` 에 `identity`/`const` 없음. 심볼 위조는 없앴지만 **가둬둔 것은 그대로** — 「폐기된 판단」이 이미 이 실패를 적어놨다 |
| **5** | `CLAUDE.md` 6곳(186·187·188·205·207·301)이 **이번에 지운 이름**(`_PFn` 등)을 아직 부른다. **301줄은 내가 이번 세션에 새로 쓴 문단**이다 — 같은 diff 가 이름을 지우면서 그 이름으로 문서를 썼다. 부수: 302줄 "아래 「폐기된 판단」" → 그 절은 **위**에 있다 |
| **6** | bare export 11개 그대로. 이번에 `_runOptic`→`runOptic` 로 후보를 하나 늘렸다 — **지금이 모듈로 묶기 가장 싼 시점** |
| **7** | **이번 회차의 두 핵심 주장 모두 뮤테이션으로 안 잡힌다.** `bimap` 되돌리기도, **심볼 위조 복원도** 38/38 통과. 관측 동등이라 격자로도 원리적으로 못 잡는다. **유일한 실효 장치는 #3(등록)** — 등록하면 `Applicative.of('identity')` 로 꺼내 검사 동작을 고정할 수 있다 |
| **8** | `plus(` 가 `docs/` 에 **0건**(회차 4 #4 미해결). `preview` 가 `plus(maybe)` 로 모은다는 설명이 없어 "왜 이종 타입에서 안 던지나" 를 사용자가 알 길이 없다 |

## 리뷰어가 확인하고 문제없다고 한 것

- **`bimap` 치환이 관측 동등** — strict/loose 양쪽에서 Lens·Prism(매치/실패)·Traversal·합성
  전부 HEAD 와 동일. `Bifunctor.of('tuple')` 의 type 이 `'Array'` 라 2원소 배열이면 통과.
  Prism 미매치 시 `over` 가 원본 참조를 그대로 반환하는 것도 유지(`r === s` → true)
- **`Either.fold` 치환 정확** — 인자 순서·의미 모두 옳다(`index.js:1246`)
- **`'Object'` 대문자가 옳다** — `types.equals(a,b,'Object')` 는 `types.check` 와 달리
  **대소문자 폴백이 없다.** 소문자화하면 traversal optic 이 전부 죽는다(테스트가 잡는다).
  ⚠ 같은 파일이 `ObjectFilterable` 은 `'object'`, `ArrayFunctor` 는 `'Array'` 를 쓴다 —
  누군가 "일관성" 으로 정리하면 optics 가 통째로 죽는다. **주석 필요**
- **`wander` 이름 유지 판단 옳음** — `docs/Optics.md:484,497` 이 이미 「순회」로 적고 있고
  새 주석(곱/합/순회)이 그것과 일치. `Forget`/`Tagged` 도 `docs/Optics.md:474-475` 가 풀어 쓴다
- 신규 최상위 export 0건, 신규 관측 차이 0건, `npm test` 38/38, `tsc` exit 0

## 다음 회차(6) 우선순위

| 순위 | 항목 | 근거 |
| --- | --- | --- |
| **1** | #1 `Comonad.of('array').extract` · #2 `compose`/`constant`/`Either.Left`/`traverse` | **소유자 지시 직격.** 리뷰어가 치환 실증 완료 |
| **2** | #5 `CLAUDE.md` 6곳 죽은 이름 | 항상 로드되는 문서가 없는 이름을 가르친다 |
| **3** | #4 재래핑 제거 — **회차 8에서 6으로 당긴다** | 20배는 사람이 판단할 크기다 |
| **4** | #3 `identity`/`const` 등록 | **유일한 게이트다**(#7) |
| 5 | #6 모듈 객체 · #8 docs |
