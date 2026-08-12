# `Algebra.type` 전수조사 — 룰이 어디서 드리프트했나

## 룰 (소유자 확인)

> `Algebra.type` 은 **그 인스턴스가 다루는 첫 번째(대표하는) 타입**이다.
> `Maybe.Semigroup('number')` 는 `Semigroup<Maybe<number>>` 이므로 `.type === 'Maybe'` 이고,
> 매개변수는 `.type` 이 아니라 **레지스트리 키** `maybe(number)` 가 진다.

**방법**: 24개 레지스트리를 훑어 인스턴스를 동일성으로 중복 제거(**124개**), 각각의 `.type` 을
대표 인자의 런타임 태그와 대조했다. `Semigroupoid`/`Category` 는 Kleisli 합성이므로 인자가
함수 — 기대값 `'function'` 으로 따로 뒀다.

## 판정: 위반 2건 + 잠재 4건

### 위반 2건 — `Maybe` 만 Kleisli 규약을 어긴다

```
FunctionSemigroupoid  "function"  OK
MaybeSemigroupoid     "Maybe"     ← 위반
EitherSemigroupoid    "function"  OK
TaskSemigroupoid      "function"  OK
FunctionCategory      "function"  OK
MaybeCategory         "Maybe"     ← 위반
EitherCategory        "function"  OK
TaskCategory          "function"  OK
```

정의부는 **글자 하나만 다르다.**

```javascript
// index.js:1217
super((f, g) => x => Chain.types.MaybeChain.chain(f, g(x)),  'Maybe',    …)
// index.js:1338
super((f, g) => x => Chain.types.EitherChain.chain(f, g(x)), 'function', …)
```

`compose(f, g)` 가 받는 것은 양쪽 다 **함수**다. `'Maybe'` 는 합성 결과가 품는 타입이지
인자의 타입이 아니다.

**아무도 못 잡은 이유**: `Semigroupoid`/`Category` 의 `checkAndSet` 은 `instance.type` 을
**읽지 않는다.** `'function'` 이 하드코딩돼 있다.

```javascript
instance.compose = (f, g) => types.equals(f, g, 'function') ? compose(f, g) : raise(…)
```

`.type` 이 쓰이지 않는 자리라 **무엇을 적어도 테스트가 초록이다.** 고치더라도 뮤테이션으로
검출되지 않으므로, 고칠 때 `.type` 을 직접 읽는 테스트를 함께 박아야 의미가 있다(규칙 15).

`git log -S "MaybeSemigroupoid"` 는 대량 리팩터 커밋 `cb8a467` 하나만 준다 — **의도적으로
`'Maybe'` 를 고른 근거는 이력에 없다.**

### 잠재 4건 — 대소문자. 지금은 동작하지만 조건부다

| 인스턴스 | `.type` | `types.of(대표값)` |
| --- | --- | --- |
| `DateSetoid` `DateOrd` | `'date'` | `'Date'` |
| `ObjectFilterable` `ObjectFoldable` | `'object'` | `'Object'` |

**왜 지금은 통과하나**: `types.check` 에 대소문자 폴백이 있다.

```javascript
return actual === expected || actual.toLowerCase() === expected.toLowerCase();
```

**언제 깨지나**: 폴백이 **없는** 검사는 `types.equals(a, b, instance.type)` 3인자형이고,
파일 전체에서 **두 곳뿐이다.**

```
index.js:289   Apply.ap    types.equals(fs, values, instance.type)
index.js:313   Alt.alt     types.equals(a, b, instance.type)
```

위 4개는 `Setoid`/`Ord`/`Filterable`/`Foldable` 이라 그 두 경로를 지나지 않는다. **`date` 나
`object` 에 `Apply` 또는 `Alt` 인스턴스가 생기는 순간 조용히 깨진다.**

같은 이유로 `Identity*`/`Const` 의 `'Object'` **대문자는 옳다** — 그것들은 `Apply.ap` 를
지나므로 폴백이 없다. `index.js:1000~1005` 주석이 경고한 그것이며, 근거가 실측으로 확인됐다.

### 준수 118건

`'any'`(First/Last — 값 타입을 보지 않음, `CLAUDE.md` 「Traps」에 명시), `'Object'`(Identity/
Const 의 캐리어가 `{value}`), `'Array'`(TupleBifunctor — 런타임 튜플은 Array),
`'function'`(PredicateContravariant — predicate 는 함수) 는 **전부 룰대로 옳다.**

## 내가 처음에 오판한 것 — 기록해 둔다

전수조사 1차에서 **두 가지를 드리프트로 보고했다가 룰 확인 후 철회했다.**

| 1차 보고 | 실제 |
| --- | --- |
| "`.type` 이 레지스트리 키 표기가 아니라 `types.of` 태그다 → 드리프트" | **설계다.** `.type` 은 검사용이므로 런타임 태그여야 한다 |
| "`Maybe.Semigroup('number').type` 이 `'Maybe'` 다 → `'maybe(number)'` 여야" | **아니다.** 매개변수는 레지스트리 키가 진다 |

**원인**: 룰을 소유자에게 확인하기 전에 "규칙 위반" 을 세었다. 기준이 흔들리면 같은 데이터가
15건 위반도 되고 2건 위반도 된다 — 1차에는 클래스 이름 접두사를 기준으로 15건이 나왔다.

**신호**: 전수조사를 시작하기 전에 **판정 기준 한 문장을 먼저 쓰고 소유자에게 확인받아라.**
세는 것은 그다음이다.

## 확인하다가 아닌 것으로 판명된 것 4건

보고 전에 실행해서 걸렀다.

| 의심 | 실제 |
| --- | --- |
| `IdentityFunctor.map(f, 1)` 이 던진다 → 버그? | **아니다.** 캐리어가 `{value}` 이므로 `map(f, {value:1})` 이 올바른 용법 |
| `traverse(identity, x => x+1, [1,2,3])` 이 던진다 → 버그? | **아니다.** `a -> F b` 여야 하므로 `x => ({value: x+1})`. 결과 `{value:[2,3,4]}` |
| `MaybeCategory.id` 가 없다 | **있다.** `id` 가 화살표 자체다 — `id(3)` 이 `Just(3)` |
| `FunctionCategory.id()` 가 undefined | **정상.** `id` 가 `identity` 이므로 `id(3)` 이 `3` |

넷 다 **내 호출 방식이 틀린 것**이었다 — 규칙 24.
