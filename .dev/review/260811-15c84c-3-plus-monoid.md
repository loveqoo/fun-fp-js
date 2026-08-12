# 적대적 리뷰 — `Plus` 유도 Monoid + 회귀 수정 (회차 3)

리뷰어: `staticland-reviewer` (도구 호출 38회)
대상: 작업 트리 전체 diff — `plusMonoidArgs`, `plus(maybe)`/`plus(array)` 등록,
optics `_firstM` 교체, 테스트 12건, `tests/baseline.js` 신규

## 판정: 위반 9건 — **회귀는 잡혔다**

리뷰어가 `git show HEAD:index.js` 를 별도 로드해 격자로 대조한 결과:

> `preview` 18케이스 **차이 0건** (`[1,'a']`/`[null,1]`/`[undefined,1]`/`[{},1]`/`[[1],2]`/
> `[NaN,1]`/Maybe 중첩/합성 optic 포함)

**회차 2의 회귀는 해결됐다.** 그러나 고치는 과정에서 새 위반 4건이 들어왔고, 회차 2 리뷰
6건 중 3건이 미해결·1건이 형태만 바꿔 재발했다.

Haskell 근거 4개는 **전부 사실로 확인**됐다 (`Monoid (Maybe a)` 의 `Semigroup a` 제약,
`First` 의 무제약, `preview` 가 `Getting (First a) s a`, `view`+Traversal 이 `Monoid a` 요구).

---

## 이 단계에서 고친 것 (Verification 은 `tests`/`dev` 를 쓸 수 있다)

### #8 내 테스트가 아무것도 고정하지 못했다 — 뮤테이션으로 적발

리뷰어가 `binaryTypeError` 의 `'any'` 분기를 **통째로 지우고** 원래 메시지로 되돌렸는데
`npm test` 38 파일이 **전부 통과**했다.

원인은 내 어서션이 약해서다:

```javascript
assertThrowsWith(() => Semigroup.of('first').concat(1, 'a'), 'must be the same type');
```

HEAD 메시지 `"...arguments must be the same type and match object"` 도 이 부분 문자열을
포함한다 — **직접 확인했다**(`headMsg.includes('must be the same type') === true`).
즉 이 테스트는 HEAD 에서도 통과한다.

**고쳤다** — 부분 문자열이 아니라 전문 대조로 바꾸고, 반대 분기도 함께 고정:

| 테스트 | 기대 (전문) |
| --- | --- |
| `Semigroup.of('first').concat(1,'a')` | `Semigroup.concat: arguments must be the same type` |
| `Monoid.of('array').concat(1,2)` | `Semigroup.concat: arguments must be the same type and match Array` |

이제 `'any'` 분기를 지우면 첫 번째가 깨진다.

### #9 `tests/baseline.js` 가 이 라이브러리의 핵심 구분을 숨겼다

회귀를 잡으려고 만든 도구가 `JSON.stringify` 로 붕괴시켰다. **직접 재현했다:**

```
[Just(1), Nothing]          -> [{"value":1,"_typeName":"Maybe"},{"_typeName":"Maybe"}]
[Just(1), Just(undefined)]  -> [{"value":1,"_typeName":"Maybe"},{"_typeName":"Maybe"}]   ← 동일
[Right(2)]                  -> [{"value":2,"_typeName":"Either"}]
[Left(2)]                   -> [{"value":2,"_typeName":"Either"}]                        ← 동일
```

`render` 가 **최상위** Maybe/Either 만 풀고 안쪽은 `JSON.stringify` 에 넘겼다.
**차이를 숨기는 대조 도구는 없는 것보다 나쁘다.**

**고쳤다** — 재귀 구조 워크로 바꿨다. 확인:

```
[Just(1), Nothing]          -> [Just(1), Nothing]
[Just(1), Just(undefined)]  -> [Just(1), Just(undefined)]
[Right(2)] / [Left(2)]      -> [Right(2)] / [Left(2)]
NaN -> [NaN]   null -> [null]   -0/0 -> [-0, 0]
중첩 Maybe -> Just(Nothing)     Set -> Set{1}     순환 -> {a: 1, self: [Circular]}
```

`mkdtempSync` 디렉토리를 안 지우던 것도 함께 고쳤다(import 평가 후 `rmSync`).

### #7 내 검증 주장이 틀렸다 — "차이 3건" 이 아니라 7건

계획서 Verification 1번이 "남는 차이가 `view` 3건 + first/last 타입 확장뿐" 이라 썼다.
**"3건" 은 지운 테스트의 개수였지 동작 차이의 개수가 아니었다.** 고친 도구로 다시 재니:

```
≠ view [1,2,3]         3    ->  1
≠ view [1,"a"]         "a"  ->  1
≠ view ["a","b"]       "b"  ->  "a"
≠ view [null,1]        1    ->  null
≠ view [undef,1]       1    ->  undefined
≠ view [[1],[2]]       [2]  ->  [1]
≠ view [{z:1},{z:2}]   {z:2}->  {z:1}
≠ view []              undefined -> THROW
  view [7]  (1대상)     7          ← 동일
  preview 전부                     ← 동일
```

**단일 대상 `view` 와 `preview` 는 HEAD 와 완전히 동일하다.** 달라진 것은 세 명세가 전부
"보증하지 않는다" 고 말하는 다중 대상 경로뿐이다. 그러나 지금은 **명세 0 + 테스트 0** 이라
회차 1·2 회귀와 같은 상태다 — 리뷰어 지적이 옳다.

---

## 소스·타입 층이라 회차 4로 넘기는 것

| # | 지적 | 처방 |
| --- | --- | --- |
| **1** | `plus(array)` 가 `Monoid.of('array')` 와 **관측 차이 0** (입력 12쌍 + `empty()` 전수), 소비자 0 | 2번을 택하면 자동 해소, 아니면 삭제 |
| **2** | "Plus 가 있으면 Monoid 를 얻는다" 를 **규칙이 아니라 손복사 2개**로 구현 — 근거로 든 규칙을 안 만들었다 (POLICY 6) | `Plus` 생성자에서 유도. 리뷰어가 프로토타입으로 확인 — **38 파일 통과, −12줄** |
| **3** | 파생 Semigroup 이 **등록된 Monoid 중 유일하게 짝이 없다**. 래핑도 4겹(+36% 오버헤드 실측) | 유도로 옮기며 `Semigroup.types` 에 함께 등록하거나, `Alternative` 의 재래핑 회피 선례를 따름 |
| **4** | 새 키 2개가 **TS 에서 호출 불가** — `@ts-expect-error` 프로브로 확인 | `MonoidInstances` 에 두 키 추가 |
| **7** | `view` 다중 대상 — 명세 0 + 테스트 0 | `view` 를 `toListOf` 기반으로 바꿔 **대상 수 ≠ 1 이면 던진다** (문서가 아니라 코드가 강제) |

## `CLAUDE.md` — Compounding 에서 고친다

| # | 지적 |
| --- | --- |
| **5** | `plus(` 가 `CLAUDE.md`/`docs/`/`types/` 에 **0건**. 게다가 이번에 쓴 문장이 "Monoid 가 필요하면" 으로 시작해놓고 **Monoid 가 아닌 `Alt.of('maybe')`/`Plus.of('maybe')` 를 답으로 준다** |
| **6** | `CLAUDE.md:234` 와 `types/Lens.d.ts:78` 이 `view` 가 던진다는 것을 여전히 모른다. 계획서 D 가 명시했는데 안 됐다 (Execution 이 context 를 못 써서 미룬 것) |

## 부수 — 근거 문장 하나가 부정확하다

리뷰어 실측: `maybe(first)` 와 `plus(maybe)` 는 **동종 payload 25쌍 중 15/15 값 일치**이고,
차이 10건은 전부 `maybe(first)` 쪽의 THROW 다. **값이 다른 경우가 하나도 없다.**

즉 대수적으로는 같은 모노이드이고(`Data.Monoid.First a ≅ Maybe (Data.Semigroup.First a)`),
차이는 우리 strict 검사가 payload 에 붙느냐뿐이다. 일반 `Monoid (Maybe a)` 의 다른 멤버는
`Maybe.Monoid('number')`(`Just 1 <> Just 2 = Just 3`) 쪽이다.

**`preview` 에 `plus(maybe)` 를 고른 결정은 옳다 — 근거 문장만 다듬어야 한다.**
`index.js:915-919` 와 `CLAUDE.md:148-150` 의 Haskell 대응 서술.

## 회차 2 리뷰 6건 대조

| # | 상태 |
| --- | --- |
| 1 `preview` 회귀 | ✅ **해결** — 18케이스 차이 0 |
| 2 `Alt`/`Plus` 유도 | ⚠ 부분 — 유도는 했으나 새 위반 4건(1·2·3·4) |
| 3 `foldMap` 주석 | ✅ 해결 |
| 4 `'any'` 문서 0건 | ✅ 해결 — `CLAUDE.md:130-144` 신설, 주장 2건 실측 정확 |
| 5 본체에 테스트 0건 | ⚠ **형태만 바꿔 재발** → **이 단계에서 고침(#8)** |
| 6 `view` 네 출처 불일치 | ⚠ 부분 — `docs/` 만 고침. 다중 대상은 오히려 명세 0 + 테스트 0 |

## 리뷰어가 확인하고 문제없다고 한 것

- **최상위 export 91개 HEAD 와 완전 동일** — 신규 bare export 0건
- **`plus(maybe)` Monoid 법칙** — 좌/우 항등 16건 + 결합법칙 **512건 전수 PASS**
- **`Plus` vs `Alternative` 선택은 `Plus` 가 맞다** — 키 집합이 같아 커버리지 이득이 없고
  `Alternative` 는 불필요한 `Applicative` 를 끌어온다. `Alt` 는 `either`/`task` 를 더 갖지만
  `zero` 가 없어 Monoid 가 될 수 없다 — 올바르게 제외됨
- **`setStrictMode(false)` 일관성 안 깨짐** — 이번 변경이 만든 불일치 아님
- 사설 딕셔너리 3개(`_firstMonoid`/`_arrayMonoid`/`_lastMonoid`) 삭제 확인, 신규 0개
- 임시 파일 로드 자체는 안전 — `index.js` 가 외부 import 없고 `.mjs` 로 `type: module` 회피
- **문서 예제 통과가 안전의 증거가 아니다** — `view` 는 `docs/` 전부 Lens/Iso 에만 쓰이고
  `preview` 예제에 이종 대상이 없다. 즉 예제가 이번 변경 표면을 **덮지 못한다**

## 이 회차가 증명한 것

**뮤테이션 테스트가 "테스트가 있다" 와 "테스트가 잡는다" 를 갈랐다.** 나는 회차 2의 교훈대로
본체에 테스트를 10건 넣었는데, 그중 핵심 하나가 **HEAD 에서도 통과하는 어서션**이었다.
개수를 세는 것으로는 안 걸린다.

그리고 **내가 만든 검증 도구가 정확히 내가 잡으려던 것을 숨겼다.** 도구를 만든 것으로
안심했지 도구를 검증하지 않았다.
