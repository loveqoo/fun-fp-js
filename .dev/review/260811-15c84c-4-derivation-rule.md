# 적대적 리뷰 — `Plus` 유도 규칙 + `view` 계약 (회차 4)

리뷰어: `staticland-reviewer` (도구 호출 55회)

## 판정: 위반 12건

`Plus` 유도 규칙은 **작동한다** — 사용자가 자기 `Plus` 를 등록하면 짝이 따라온다
(`new Plus(alt, zero, 'Array', Plus.types, 'firstNonEmptyArray')` → `Monoid.of('plus(firstnonemptyarray)')`,
실행 확인). 회차 3의 9건 중 4건 해결, 4건 절반, 1건 악화.

---

## 소유자 지시와 직결되는 것 — 합성 가능한데 손으로 만든 것

> **"함수합성이 가능한데 합성하지 않고 직접 구현하는 것은 지울 겁니다.
> 합성에 필요한 타입이 있다면, 기존 타입 등록 및 구현 방법을 보고 구현하면 됩니다."**

### #7 `_asApplicative` 가 클래스를 우회한다 — 가장 나쁘다

`index.js:2315-2331` 이 `dict[Symbols.Functor|Apply|Applicative] = true` 를 **손으로 찍는다.**
즉 `checkAndSet('Functor')/('Apply')/('Applicative')` 를 **통째로 건너뛰고 심볼만 위조해**
`Traversable.traverse` 의 strict 검사를 통과시킨다. `CLAUDE.md` 의 "검증 로직은 한 곳에서
일관되게 관리" 를 정면으로 어긴다.

**등록하지 않고 인스턴스를 만드는 정식 경로가 이미 있다** — 생성자의 `registry` 인자를
생략하면 된다. 리뷰어가 실행으로 확인:

```javascript
new Applicative(
  new Apply(new Functor((f,x)=>({value:f(x.value)}), 'Object'),
            (ff,fa)=>({value:ff.value(fa.value)}), 'Object'),
  v=>({value:v}), 'Object')
→ traverse(Identity, a=>Identity.of(a*2), [1,2,3]) === {"value":[2,4,6]}   성공
```

`_Const` 도 같은 방식으로 성공. **등록(회차 5 예정)과 별개 문제다** — 등록하지 않더라도
클래스를 우회할 이유가 없다.

### #8 조합으로 대체 가능한 것 3건 (실행 확인)

| 위치 | 지금 | 조합 | 확인 |
| --- | --- | --- | --- |
| `index.js:2351` `_PFn.first` | `p => ([a,c]) => [p(a), c]` | `Bifunctor.of('tuple').bimap(p, identity, t)` | `bimap(x=>x*10, identity, [1,2])` → `[10,2]` **완전 일치** |
| `index.js:2352` `_PFn.left` | `p => e => e.isLeft() ? Left(p(e.value)) : e` | `Bifunctor.of('either').bimap(p, identity, e)` | 값 일치 (Right 를 새 객체로 만드는 차이만) |
| `index.js:2361` `_PForget.left` | `p => e => e.isLeft() ? p(e.value) : monoid.empty()` | `Either.fold(p, () => monoid.empty(), e)` | 정의상 동일 |

`Bifunctor.types` = `tuple, either, validation` — **이미 등록돼 있다.**
`_PForget.first`(`([a,_c]) => p(a)`) 는 대응하는 `fst` 가 없어(`fp.fst === undefined`)
손으로 쓰는 게 맞다.

---

## 이번 회차가 만든 문제

### #1 계획 항목이 조용히 빠졌고, 그 자리에 아무것도 못 잡는 테스트가 들어왔다 ← 회차 3 #8 재발

계획 37줄이 `semigroup.concat = plus.alt` (재래핑 회피)를 명시했다. **사용자가 그 줄을
"설명이 세 줄 필요한 코드" 라며 지우라고 했고 나는 지웠다** — 그 판단은 옳다.
**틀린 것은 테스트를 값 비교로 약화시킨 것이다:**

```javascript
test("Plus 유도 - alt 와 같은 결과를 준다")   // 재래핑을 해도 안 해도 통과한다
```

뮤테이션 확인: 재래핑 제거를 넣어도 **38/38 통과**. 구별력 0.

그리고 **계획의 어서션 자체가 틀렸다** — `plus.alt !== Alt.of('maybe').alt` 다
(`Plus` 생성자가 `super(alt, alt.alt, type)` 로 한 겹 더 씌운다). 계획대로 했어도 실패했다.

비용 실측(preview, 20000회×100원소): HEAD `15.7ms` → 현재 `75.6ms` → 재래핑 제거 시 `46.3ms`.
**−39% 다. 무시할 크기가 아니다** — 다시 판단해야 한다.

### #2 문서가 코드와 정면 충돌 — 이번 회차가 새로 만들었다

`CLAUDE.md:252-254` 에 내가 **이번에 추가한** 문단이 `view` 다중 대상을
"**동작을 보증하지 않습니다**" 라고 쓴다. 그런데 같은 회차에 코드가 결정적으로 던지게 만들었다.
다음 사람은 "그럼 첫 값이 나오나 보다" 로 읽는다 — **회차 1·2 회귀가 정확히 그 독법에서 나왔다.**

### #11 문서 과장 — 검증 가능하게 거짓

`docs/Optics.md:196` — "`view`는 **항상 값을 돌려주거나 던집니다** — `undefined`를 흘리지 않습니다."

실측: `view(Lens(o=>o.a, ...), { a: undefined })` → **`undefined`**.
`view` 가 세는 것은 **대상 수**이지 값이 아니다.

### #9 네이밍을 이번 회차가 **악화시켰다**

`_firstMonoid`/`_arrayMonoid` → `_firstM`/`_arrayM`. 소유자가 "네이밍에 신중하십시오" 라
했는데 이름을 더 줄였고, 주석이 그 짐을 진다. 더 나쁜 것은 **`_firstM` 의 `first` 가
같은 파일의 `Semigroup.of('first')` 와 아무 관계가 없다**(내용물은 `plus(maybe)`)는 점이다.

**리뷰어의 사실 정정**: 내가 "나머지 2900줄에 언더스코어가 없다" 고 한 것은 **틀렸다.**
모듈 레벨 12개 중 optics 밖에 `_transformerAutoId`(2513), `_curry`(117) 2개가 있고,
프로퍼티는 `_mapChain`(46회) `_typeName`(18) `_cache`(18) 등이 있다.

**처방**: 두 상수는 **이름을 없애는 것이 낫다** — `preview`/`toListOf` 본문에
`Monoid.of('plus(maybe)')` 를 직접 쓰면 약자 2개와 주석 2줄이 함께 사라진다.

### #10 `plus(maybe)` 와 `maybe(first)` 는 같은 두 단어의 순서만 다르다

이 구분을 설명하려고 `CLAUDE.md` 12줄 + `index.js` 17줄, **주석 30줄**이 새로 필요했다.
`plus(<타입>)` 은 **유래한 타입 클래스**를, `maybe(<inner>)` 는 **감싼 구조**를 넣는다 —
규칙이 다른데 형태가 같다. `Plus` 를 모르면 `plus(maybe)` 는 정보를 안 준다.

**대안**: `alt(maybe)` — concat 이 곧 `Alt.alt` 라 기계적으로 참이고 `docs/Alt.md` 가
이미 설명한다. 또는 키를 없애고 `Monoid.fromPlus('maybe')` (= `Maybe.Monoid(innerSG)` 선례).
**지금이 가장 싸다 — 소비자가 `preview` 하나뿐이다.**

### #12 `plus(array)` 는 여전히 `Monoid.of('array')` 와 관측 차이 0

12쌍 전수 + `empty()` + 에러 메시지까지 **차이 0건**, 그런데 객체는 별개.

**"규칙의 산물" 이라는 내 변호가 부족하다**: Static Land 의 "Multiple instances per type" 은
**결과가 다른** 인스턴스가 여럿이라는 뜻이다(`NumberSum` vs `NumberProduct` 는 `2,3` 에서
`5` vs `6`). `plus(array)` 와 `array` 는 **어떤 입력에서도 안 갈린다** — 실패유형 1이
인스턴스 단위에서 규칙 단위로 올라갔을 뿐이다.

**선택해야 한다**: (a) 대칭을 지키고 "`plus(array)` 는 `array` 와 같다, 새 코드는 `array` 를
써라" 를 문서에 박거나 (b) `deriveFromPlus` 가 `Monoid.types[alias]` 가 이미 있으면
**키를 안 만든다**.

### #6 `foldMap` 이름 충돌 — 미래에 API 를 깬다

`index.js:2338` 주석이 약속한 `foldMap(monoid, optic, s)` 는 **이미 있는 최상위 export 와
충돌한다** — `index.js:1920` 의 `foldMap(foldable, monoid)(f)(container)`, `docs/Foldable.md` 가
문서화, 격자의 export 91개에 포함. **Static Land 의 "No name clashes" 를 정면으로 어긴다.**
→ 모듈 안 이름 `optics.foldMapOf(monoid, optic, s)` 로.

### #3·#4·#5 미해결

| # | 내용 |
| --- | --- |
| 3 | `types/Lens.d.ts:78` 이 **3회차 연속** `view` 가 던지는 걸 모른다. 계획 C 가 명시했는데 diff 에 없다 |
| 4 | `plus(` 가 `docs/` 에 **0건** — 이제 TS 선언까지 붙은 공개 키인데 |
| 5 | d.ts 새 키 4줄을 **지워도 `tsc` 초록**. `NonHKTClasses.test-d.ts` 에 고정 안 함 |

---

## 리뷰어가 확인하고 문제없다고 한 것

- **`deriveFromPlus` 호출 시점 안전** — `super()`(Alt)와 `checkAndSet('Plus')` 가 둘 다 끝난
  뒤라 `this.alt`/`this.zero` 준비됨. `Alternative` 는 `Plus` 생성자를 안 부르므로 이중 유도 없음
- **레지스트리 정의 순서 충돌 없음** — `withTypeRegistry` 는 `:707-708`, `load()` 는 `:2299`
- **생성자 이름 키 오염 없음** — `Monoid.types['Monoid']` → `undefined`, 뮤테이션으로 검거 확인
- **d.ts 타입 정확** — `Monoid<Maybe<unknown>>` 나옴, 순환 참조 없음, 미등록 키는 여전히 거부
- **`view` 의 함수 검사 중복은 의도된 것이 맞다** — 없으면 메시지가 `toListOf:` 가 된다
- **`view` 를 `toListOf` 로 바꾼 비용 무시 가능** — Lens 경로 200000회 `7.3ms → 7.9ms` (+8%)
- **`view` 가 Iso·합성 Lens·`traversed('maybe')`·`traversed('either')`·합성 Iso∘Prism 에서 정상**
- **회차 3 #7 해결 확인** — 뮤테이션(가드 삭제)으로 검거됨
- **회차 3 #9 해결 확인** — 격자가 `view 다중` 3줄 + 레지스트리 키 2줄을 정확히 잡는다
- 신규 bare export 0건, 신규 사설 딕셔너리 0개
- Haskell `Data.Monoid.First` 인용은 **성립한다** — `plus(maybe)` 실측과 정확히 일치
- `npm test` 38/38, `npx tsc --noEmit` exit 0

## 부수

- `deriveFromPlus` 는 `aliases` 가 비면 인스턴스 2개를 만들고 아무 키도 등록 안 한다 — 죽은 할당
- 이름은 파일 관례에 맞으나(`resolveMonadType` 계열) 무엇을 유도하는지 안 말한다 →
  `registerMonoidFromPlus`
- **뮤테이션으로 안 잡히는 것 2개**: `_arrayM` 을 사설 딕셔너리로 되돌려도 38/38 통과,
  d.ts 키 삭제도 tsc 통과. **이번 회차의 핵심 주장("레지스트리에서 꺼낸다")을 어떤 게이트도
  지키지 않는다**
- 격자가 못 덮는 표면 5개: 파생 인스턴스의 **값**, **사용자 정의 `Plus` 의 유도**(이번 회차의
  유일한 새 기능인데 테스트도 없다), TS 층, 생성자 이름 오염, `view`+Iso/합성/다른 Traversable

## 다음 회차 (5) 우선순위

소유자 지시가 우선한다.

| 순위 | 항목 |
| --- | --- |
| **1** | **#7 `_asApplicative` 제거 — 생성자 체인으로.** 검증 우회가 가장 나쁘다 |
| **2** | **#8 `_PFn.first`/`_PFn.left`/`_PForget.left` 를 `Bifunctor`/`Either.fold` 조합으로** |
| 3 | #9 `_firstM`/`_arrayM` 이름 제거 (본문에 직접 조회) |
| 4 | #2·#11 문서가 코드와 어긋난 곳 — `CLAUDE.md:252`, `docs/Optics.md:196` |
| 5 | #3 `types/Lens.d.ts:78` (3회차 연속 미해결) |
| 6 | #1 재래핑 회피 재판단 (−39% 는 무시할 크기가 아니다) + 테스트를 동일성으로 |
| 7 | #10 `plus(maybe)` 키 이름 · #12 `plus(array)` 중복 · #6 `foldMap` 이름 · #4·#5 |
