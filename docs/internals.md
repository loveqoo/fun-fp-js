# 내부 구조 — 왜 이렇게 되어 있나

**이 문서는 `index.js` 를 고치는 사람을 위한 것입니다.** 라이브러리를 *쓰는* 법은
[README](./README.md)와 각 타입 문서에 있습니다.

여기 있는 예제도 `npm test` 가 실행합니다 — **설명이 코드와 어긋나면 빌드가 빨개집니다.**
소스 주석은 한 줄 힌트만 남기고 근거는 여기로 모읍니다.

---

## `.type` — 인스턴스가 다루는 타입 {#type}

모든 인스턴스는 `Algebra` 를 상속하고 `.type` 을 하나 가집니다. **그 인스턴스의 연산이
인자로 받는 값의 타입**이며, `types.of()` 가 돌려주는 **정규 태그**여야 합니다.

```javascript
const { Setoid, Functor, Semigroupoid } = FunFP;

console.log(Setoid.lookup('date').type);        // 'Date'      대문자 — types.of(new Date())
console.log(Functor.lookup('array').type);      // 'Array'
console.log(Semigroupoid.lookup('maybe').type); // 'function'  Kleisli 합성이라 인자가 함수다
```

마지막 줄이 함정입니다. **레지스트리 키와 `.type` 은 다릅니다.** 키 `maybe` 로 꺼냈지만
`compose(f, g)` 가 받는 것은 `a -> Maybe b` 꼴의 **함수**입니다.

### 대소문자가 조건부로만 안전하다

검사 경로가 둘인데 하나에만 폴백이 있습니다.

대부분의 검사는 `types.check(val, type)` 를 지나고 **여기엔 대소문자 폴백이 있습니다** —
`'date'` 라고 적어도 통과합니다. 하지만 `.type` 을 **글자 그대로** 비교하는 자리가 셋 있고,
셋의 결과가 다릅니다.

| 자리 | 비교 | 어긋나면 |
| --- | --- | --- |
| `Apply.ap` | `types.equals(fs, values, instance.type)` | **던진다** |
| `Alt.alt` | `types.equals(a, b, instance.type)` | **던진다** |
| `unwrapIfSameType` | `instance.type !== source.type` | **조용히 겹을 안 벗긴다** — 값은 같다 |

앞의 둘만 보고 "내 인스턴스는 `Apply`/`Alt` 를 안 지나니 소문자로 적어도 안전하다" 고
판단하면 안 됩니다. 세 번째는 `Monoid`·`Apply`·`Applicative`·`Alt`·`Plus` **생성자가**
부르므로 훨씬 넓게 걸립니다.

```javascript
const { Functor, Apply } = FunFP;

const build = (fType, aType) => {
    const f = new Functor((g, x) => ({ value: g(x.value) }), fType);
    const a = new Apply(f, (ff, fa) => ({ value: ff.value(fa.value) }), aType);
    return a.map === f.map;              // 겹이 벗겨졌나
};

console.log(build('Object', 'Object'));  // true   같으면 벗긴다
console.log(build('object', 'Object'));  // false  대소문자만 달라도 안 벗긴다
```

**세 번째는 버그를 만들지 않습니다** — 검사가 한 겹 더 남을 뿐 값도 에러도 같습니다.
그래서 더 위험합니다: 앞의 둘은 던져서 알려주지만 이쪽은 아무 말도 안 합니다.

`Apply`/`Alt` 인스턴스가 없는 타입은 소문자로 적어도 **던지지는** 않습니다. 2026-08-13 에
`DateSetoid`·`DateOrd`(`'date'`), `ObjectFilterable`·`ObjectFoldable`(`'object'`) 네 개가
그 상태로 발견됐습니다 — 그 타입에 `Apply` 나 `Alt` 가 생기는 순간 깨질 지뢰였습니다.

`tests/algebra-type.test.js` 가 등록 인스턴스 전부에 대해 두 가지를 강제합니다 — ① 태그가
`Apply.ap` 를 실제로 통과하는가 ② 이름 접두사·예외표와 맞는가.

### `.type` 은 에러 메시지로 새어 나간다

```javascript
const { Filterable } = FunFP;

try { Filterable.lookup('object').filter(x => x, [1]); }
catch (e) { console.log(e.message); }  // 'Filterable.filter: arguments must be (function, Object)'
```

---

## `'any'` — 값 타입을 보지 않는 인스턴스 {#any}

`first`/`last` 는 `(a, b) => a` · `(a, b) => b` 라 값의 타입과 무관합니다. 그래서 `.type` 이
`'any'` 이고, `types.check` 는 무조건 통과시킵니다. **다만 "두 인자의 타입이 같아야 한다" 는
검사는 살아 있습니다** — 그것이 `'any'` 에서 남는 유일한 실패 이유입니다.

```javascript
const { Semigroup } = FunFP;

console.log(Semigroup.lookup('first').concat(1, 2));   // 1
try { Semigroup.lookup('first').concat(1, 'a'); }
catch (e) { console.log(e.message); }  // 'Semigroup.concat: arguments must be the same type'
```

한때 `/* Object */` 섹션에 있어 `'object'` 로 등록돼 있었는데, 그건 **위치를 따라간 것**이고
타입 선언(`types/data/builtins.d.ts` 의 `readonly first: unknown`)은 처음부터 모든 타입이었습니다.

### `lookup('default')` 도 `'any'` 다 — 그래서 이종 인자를 거부한다

`DefaultSetoid`(`===`)와 `DefaultOrd`(`<=`)도 값 타입을 보지 않으므로 `'any'` 입니다.
**이름이 "기본" 이라고 아무 두 값이나 받는다는 뜻은 아닙니다** — `'any'` 에 남는 유일한
검사, 곧 "두 인자의 타입이 같아야 한다" 가 여기에도 걸립니다.

```javascript
const { Setoid, Ord } = FunFP;

console.log(Setoid.lookup('default').equals(1, 1));   // true
console.log(Ord.lookup('default').lte(1, 2));         // true

try { Setoid.lookup('default').equals(1, 'a'); }
catch (e) { console.log(e.message); }  // 'Setoid.equals: arguments must be the same type'
try { Ord.lookup('default').lte(1, 'a'); }
catch (e) { console.log(e.message); }  // 'Ord.lte: arguments must be the same type'
```

한때 이 둘은 레지스트리 밖의 **맨 객체 리터럴**이었습니다(`{ equals: Setoid.op }`). 그때는
이종 인자에 조용히 `false` 를 돌려줬고, 꺼낼 때마다 새 객체라 컨테이너 캐시도 안 맞았습니다.
정식 인스턴스가 되면서 다른 `Setoid` 와 같은 규칙을 따릅니다 — **조용히 틀린 답을 주는 대신
비교할 수 없다고 멈춥니다.**

**이 둘은 Monoid 가 아닙니다 — 항등원이 없습니다.** `FirstMonoid`/`LastMonoid` 는 커밋
`e3d2b82` 에서 그 이유로 제거됐습니다. Monoid 가 필요하면 `Maybe` 로 감싸는데, **무엇을
원하느냐에 따라 둘로 갈립니다.**

| | 무엇을 하나 |
| --- | --- |
| `Maybe.Monoid('first')` (= `maybe(first)`) | 둘 다 `Just` 면 **안쪽 값을** `first` 로 합친다 |
| `Monoid.lookup('maybe')` | 안을 **열지 않고** 첫 `Just` 를 통째로 고른다 |

payload 타입이 같으면 결과도 같습니다. **갈리는 것은 타입이 섞였을 때뿐**이고, 그때 앞엣것은
안쪽 `concat` 의 타입 검사에 걸려 던집니다.

```javascript
const { Maybe, Monoid } = FunFP;

const merge = Maybe.Monoid('first');
const pick = Monoid.lookup('maybe');

console.log(merge.concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1  — 안쪽을 합친 결과
console.log(pick.concat(Maybe.Just(1), Maybe.Just(2)).value);   // 1  — 같다

try { merge.concat(Maybe.Just(1), Maybe.Just('a')); }
catch (e) { console.log('merge: throws'); }                     // 이종이면 던진다
console.log(pick.concat(Maybe.Just(1), Maybe.Just('a')).value); // 1  — 안 열어서 통과
```

**"합치기" 면 앞, "고르기" 면 뒤입니다.**

---

## `Plus` 에서 `Monoid` 를 유도한다 {#plus-monoid}

`Plus` 는 `alt`(결합 이항 연산)와 `zero`(항등원)를 둘 다 가지므로 **구조적으로 Monoid 입니다** —
태그만 없습니다. 그래서 등록된 `Plus` 는 짝 `Semigroup`/`Monoid` 를 **그 타입의 이름 그대로**
얻습니다. 특례를 따로 적어 두지 않으므로 **`Plus` 를 새로 등록하면 짝도 자동으로 따라옵니다.**

**단, 그 타입에 이미 `Monoid` 가 있으면 유도하지 않습니다.** `Array` 가 그렇습니다 — `alt` 가
곧 `concat` 이라 유도본과 `ArrayMonoid` 의 동작이 같습니다(실측). 등록을 강행하면 `registerAs`
가 조용히 `ArrayMonoid` 를 덮습니다.

> **한때 이 키가 `plus(<별칭>)` 이었습니다. 그것은 버그였습니다.** 이 라이브러리에서 `f(x)` 는
> `F<X>` 를 뜻하는데 `plus(maybe)` 는 `Plus` 가 아니라 `Monoid` 를 돌려줬고, 진짜 `Plus<Maybe>`
> 는 그냥 `Plus.lookup('maybe')` 였습니다. 괄호 안이 원소가 아니라 **출신**이었던 것입니다 —
> 출신 기록은 타입이 아닙니다(소유자 판단, 2026-08-14).

```javascript
const { Semigroup, Monoid, Plus, Maybe } = FunFP;

console.log(Monoid.lookup('maybe').empty().isNothing());        // true   Plus 에서 유도된 것
console.log(Semigroup.lookup('maybe').concat(Maybe.Just(1), Maybe.Just(2)).value);  // 1
console.log(Plus.lookup('maybe').zero().isNothing());           // true  같은 연산이다
```

유도에서 `register()` 를 쓰지 않는 이유가 있습니다. `register()` 는 `instance.constructor.name`
도 키로 넣는데, 유도된 것은 클래스 이름이 그냥 `Monoid` 라 `Monoid.types['Monoid']` 가 생기고
**`Plus` 들이 서로 덮습니다.** 그래서 `Maybe.Monoid` 의 선례대로 키를 직접 넣습니다.

---

## `Identity` / `Const` — `traverse` 에 넘기는 Applicative 둘 {#identity-const}

| | 무엇을 하나 | 어디에 쓰나 |
| --- | --- | --- |
| `identity` | 값을 그대로 나른다 | `traverse` 를 "그냥 매핑" 으로 — optics 의 `over` |
| `const(<monoid>)` | 값을 버리고 monoid 로만 모은다 | `traverse` 를 "접기" 로 — optics 의 `preview` |

**모양이 객체인 것과 타입이 `Object` 인 것은 다른 말입니다.** 둘은 각자 자기 타입을 가집니다 —
`Identity` 와 `Const(<모노이드키>)` 입니다. 캐리어가 스스로를 밝힙니다.

한때 `Identity`·`Const`·평범한 객체가 **셋 다 `'Object'`** 였습니다. 그때는 서로 섞여
들어갔습니다(실측):

```
Identity.map 에 Const 캐리어를   → 통과
Const.map 에 Identity 캐리어를   → 통과
Identity.map 에 그냥 { a: 1 } 을 → 통과 (결과가 {} 였다)
ObjectFoldable 에 Identity 를    → 통과
```

지금은 넷 다 거부합니다. **안쪽 값 타입이 있으면 `Object` 가 아니라 자기 타입이어야 하고,
그 타입의 값이 무엇인지를 태그가 말해야 합니다**(소유자 판단, 2026-08-14).

```javascript
const { Traversable, Applicative, Functor } = FunFP;

const Id = Applicative.lookup('identity');
console.log(Traversable.lookup('array').traverse(Id, x => Id.of(x + 1), [1, 2, 3]).value);
// [ 2, 3, 4 ]
console.log(Functor.lookup('identity').map(x => x + 1, Id.of(1)).value);   // 2
```

`Apply.ap` 는 `types.equals(a, b, instance.type)` 로 태그를 **글자 그대로** 비교하므로
([대소문자 폴백이 없습니다](#type)) 캐리어의 `_typeName` 과 인스턴스의 `.type` 이 정확히
같아야 합니다. `Const` 는 모노이드마다 태그가 달라집니다 — `Const(array)`·`Const(number)`.

등록은 `Functor` → `Apply` → `Applicative` **3단**입니다. `Applicative` 만 올리면
`Functor.lookup('const(array)')` 가 실패합니다.

---

## 검사 겹을 벗기는 자리 — `unwrapIfSameType` {#unwrap}

상위 클래스에 넘기는 `map`/`ap` 은 **이미 검사가 씌워진 것**입니다. `type` 이 같으면 상위가
씌우는 검사가 **글자 그대로 같으므로**(둘 다 `types.isFunction(f) && types.check(a, instance.type)`)
바깥 겹은 안전성을 더하지 않습니다. **그것이 벗기는 유일한 근거입니다.** `type` 이 다르면
바깥 검사가 다른 것이므로 그대로 둡니다.

`Alternative` 가 `this.alt = plus.alt` 로 재래핑을 피하는 것도 같은 처리입니다.

**성능을 근거로 삼지 마십시오.** 같은 회차가 `first`/`left` 를 `Bifunctor.bimap` 위임으로
바꿔 원소마다 레지스트리 조회를 새로 넣었고, **그쪽이 벗긴 겹보다 큽니다**(실측 1.37~1.60배).
레지스트리 재사용은 옳은 선택이고 되돌리지 않습니다.

---

## optics 의 Profunctor 인코딩 {#optics}

```
Optic s a = P => P a a -> P s s
```

**어떤 `P` 를 주입하느냐가 연산을 정합니다.** 하나의 정의에서 읽기·쓰기·역생성이 모두 나옵니다.

| 주입하는 P | 나오는 연산 | 필요한 메서드 |
| --- | --- | --- |
| 함수 | `over` / `set` | `dimap` `first` `left` `wander` |
| `Forget<r>` | `view` / `preview` / `toList` / `foldMapOf` | 같음 (monoid 로 누적) |
| `Tagged` | `review` | `dimap` `left` 만 |

**`Tagged` 에 `first` 와 `wander` 가 없다는 사실이 타입 안전성을 대신합니다** — Lens 나
Traversal 에 `review` 를 쓰면 그 자리에서 `TypeError` 가 납니다.

```javascript
const { Optics } = FunFP;

const aLens = Optics.Lens(o => o.a, (b, o) => ({ ...o, a: b }));
try { Optics.review(aLens, 1); }
catch (e) { console.log('review on a Lens throws'); }
```

`P` 가 첫 인자라 **평범한 `compose` 로는 합성되지 않습니다** — 그래서 `Optics.compose` 가
따로 있습니다.

### 세 딕셔너리가 공유하는 메서드가 optic 의 종류를 정한다

| 메서드 | 뜻 | 나오는 optic |
| --- | --- | --- |
| `first` | 곱 — 짝 `[a, c]` 의 한쪽만 건드린다 | Lens |
| `left` | 합 — `Either` 의 `Left` 만 건드린다 | Prism |
| `wander` | 순회 — 컨테이너 안의 모든 자리를 건드린다 | Traversal |

### `Iso` 가 optic 계층의 최상단인 이유

`Iso` 는 **`dimap` 만 씁니다.** 세 `P` 가 모두 `dimap` 을 가지므로 **모든 연산에서 동작합니다** —
Lens 이자 Prism 이라 `view` 도 `review` 도 됩니다.

```javascript
const { Optics } = FunFP;

const doubled = Optics.Iso(c => c * 2, x => x / 2);
console.log(Optics.view(doubled, 21));                  // 42
console.log(Optics.review(doubled, 42));                // 21   Lens 로는 안 되는 것
```

법칙은 무손실 변환입니다 — `from(to(s)) === s`, `to(from(a)) === a`.

### `view` 는 대상 수를 센다

`view` 는 Lens/Iso 전용입니다 — **"정확히 1대상" 을 문서가 아니라 코드가 강제합니다.**

`review` 는 구조가 막아 줍니다(`Tagged` 에 `first`/`wander` 가 없음). 그런데 `view` 쪽의
`Forget` 에는 `wander` 가 **있어서** Traversal 을 넘겨도 실행은 됩니다. 그래서 대상 수를
세는 것이 유일한 방법입니다 — 0개면 `undefined` 를 흘리지 않고, 2개 이상이면 첫 값을
조용히 주지 않습니다.

```javascript
const { Optics } = FunFP;

const each = Optics.traversed('array');
console.log(Optics.view(each, [7]));                       // 7   1대상이면 된다
try { Optics.view(each, [1, 2, 3]); }
catch (e) { console.log(e.message); }
// 'view: expected exactly one target, got 3 — use preview or toList'
```

### 읽기 셋은 전부 `foldMapOf` 의 특수 경우다

무엇으로 모으느냐만 다릅니다. 인자 순서는 `over(optic, f, s)` 에 맞추고 monoid 를 앞에 둡니다.

**monoid 는 `first` 경로(Lens/Iso)에서 한 번도 안 쓰입니다.** 그래서 검사하지 않으면 optic
종류에 따라 통과 여부가 갈립니다 — 기존 `foldMap(foldable, monoid)` 과 같은 규칙으로
요구합니다. 등록은 필요 없고 `new Monoid(...)` 로 만든 것이면 됩니다.

---

### 세 P 는 사설 딕셔너리가 아니라 등록된 인스턴스다

주입하는 셋은 `Strong`/`Choice`/`Wander` 인스턴스이고 레지스트리에 있습니다. 그래서 법칙·
명세·`.type` 게이트가 전부 봅니다.

| 레지스트리 | 키 |
| --- | --- |
| `Strong` | `FunctionStrong` · `forget(<모노이드키>)` |
| `Choice` | `FunctionChoice` · `forget(<모노이드키>)` · `TaggedChoice` |
| `Wander` | `FunctionWander` · `forget(<모노이드키>)` |

```javascript
const { Strong, Choice, Wander, Either } = FunFP;

const S = Strong.lookup('function');
console.log(S.first(x => x * 10)([3, 'c']));    // [ 30, 'c' ]   왼쪽만 건드린다
console.log(S.second(x => x * 10)(['c', 3]));   // [ 'c', 30 ]   오른쪽만 건드린다

const W = Wander.lookup('function');
console.log(W.left(x => x * 10)(Either.Left(4)).value);    // 40   Left 만
console.log(W.left(x => x * 10)(Either.Right(4)).value);   // 4    Right 는 통과
```

**`Tagged` 는 `Choice` 에만 있습니다.** `Strong` 에도 `Wander` 에도 없고, 그 **부재**가
"Lens 와 Traversal 은 `review` 할 수 없다" 입니다. 던지는 스텁이 하던 일을 구조가 합니다.

`Tagged` 는 `Profunctor` 레지스트리에도 안 올립니다. 명세가 `Profunctor` 에 "첫 매개변수를
고정하면 `Functor`" 를 요구하는데 `.type` 이 `'any'` 인 `Functor` 는 없습니다 — **지킬 수
없는 보증은 걸지 않습니다**(`Filterable` 에서 `Either`/`Task` 를 뺀 것과 같은 판단).

### 왜 처음에는 타입 클래스로 안 올렸나 — 그리고 왜 뒤집었나

**2026-08-11 에는 반대로 결정했습니다.** 근거가 셋이었습니다.

1. **JS/TS 선례가 만장일치로 내부화다.** `optika` 는 profunctor 인코딩을 쓰면서도
   "Internals — Functions which you probably never need to use directly" 로 분류하고,
   `monocle-ts` 는 전체 profunctor 버전이 있지만 "only used internally" 입니다.
2. **노출해도 실제 확장 용도가 안 열린다.** 커스텀 profunctor 의 대표 용도인 indexed
   optics 는 `Indexed`/`StarI`/`ForgetI` 같은 **별도 계열**과 `itraversed` 생성자를
   요구합니다 — 이 셋만으로는 안 됩니다.
3. Haskell `well-typed/optics` 가 내부화한 주된 이유는 **에러 메시지 품질**인데, 그건 타입
   추론의 문제라 JS 에는 해당하지 않습니다. 우리 근거가 아니었습니다.

**앞의 둘은 지금도 사실입니다.** 이 라이브러리는 선례를 따르지 않는 쪽을 골랐고,
**확장성이 열린 것도 아닙니다.** 뒤집은 근거는 다른 데 있습니다(2026-08-14).

- **이미 필요해서 쓰고 있었다.** 숨겨서 안 쓴 게 아니라 **쓰면서 숨겼습니다.** 그 결과
  Optics 가 남의 타입 내부 표현(`{ value: … }`)을 리터럴로 만들고 `.value` 로 뜯었습니다.
- **감시가 0이었다.** 레지스트리 밖이라 법칙·명세·`.type` 게이트 셋 다 optics 를 안 봤습니다.
  `Ord` 가 `Setoid` 를 잃은 채 살아 있던 것과 같은 모양의 구멍입니다.
- **던지는 스텁이 구조로 바뀐다.** 위의 `Tagged` 이야기가 그것입니다.

당시 기록에는 **바꿔야 할 조건**도 적혀 있었습니다 — *"사용자가 자기 profunctor 를 등록해
optic 을 확장하려는 실제 요구가 생겼을 때."* 실제로 온 요구는 그것과 달랐습니다. 확장이
아니라 **"내부에 필요한 타입 클래스는 명시적으로 구현되어야 한다"**(소유자, 2026-08-14)
였고, `Free` 가 그 선례입니다 — 트랜스포머 넷이 내부에서 쓰지만 10개 키로 등록돼 있고
전용 문서가 있습니다.

> 이 글은 한 번 사라진 적이 있습니다. 원래 `CLAUDE.md` 에 있었는데 하네스를 걷어내며
> (`b970b96`) 함께 지워졌고 `docs/` 로 옮겨지지 않았습니다. 그래서 같은 질문이 사흘 뒤에
> 다시 나왔습니다. **근거는 항상 로드되는 파일이 아니라 찾아올 수 있는 곳에 둡니다.**

### 못 하는 것

- **`Wander` 는 법칙이 0개입니다.** `wander` 의 법칙 셋 중 ①항등만 검사할 수 있고,
  ②합성은 두 Applicative 를 겹치는 `Compose` 가 필요한데 이 라이브러리에 없으며,
  ③자연성은 **모든** Applicative 준동형에 대한 요구라 표본으로 확인할 수 없습니다.
  `Traversable`·`ChainRec` 이 같은 이유로 빠져 있습니다. 하나만 넣고 "법칙이 돈다" 고 하면
  게이트가 막는 것을 과장하게 되므로 0개로 두고 `KNOWN_DEVIATIONS` 에 이유를 적었습니다.
- **`Strong`/`Choice` 도 표준 넷 중 둘만** 돕니다(쌍대·사영). 결합과 자연성은 튜플·`Either`
  재결합 함수가 더 필요합니다.
- **indexed optics 는 여전히 안 열립니다.** 위 근거 2번은 유효합니다.

---

## 트랜스포머의 타입클래스 등록 {#transformer-register}

트랜스포머는 만들어질 때 `Functor` → `Apply` → `Applicative` → `Chain` → `Monad` 다섯 곳에
**동적으로** 등록됩니다.

- `registry=null` 로 만들어 **generic 키 오염을 막고** 별칭만 수동으로 넣습니다. `register()`
  를 쓰면 `Functor.types['Functor']` 같은 키가 생겨 서로 덮습니다([같은 이유](#plus-monoid)).
- `instanceof XT` 로 **nominal typing** 을 강제합니다 — 다른 `StateT(M)` 의 값을 섞으면 던집니다.
- **전제**: 호출 시점에 `XT.of` 가 이미 완성돼 있어야 합니다. `WriterT` 처럼 추가 파라미터를
  캡처하는 경우 `of` 가 그 클로저를 제대로 품고 있어야 합니다.

```javascript
const { StateT, Functor, Monad } = FunFP;

const ST = StateT('maybe');
console.log(Functor.lookup('statet(maybe)').type);   // 'StateT(Maybe)'
console.log(Monad.lookup('statet(maybe)') === Monad.lookup('statet(maybe)'));  // true  캐시된다
```

### `M` 을 문자열로 넘겨야 하는 이유

`type` 이 없는 커스텀 모나드에 자동으로 붙는 별칭은 **프로세스 실행 순서에 따라 달라집니다.**
그 별칭을 `Functor.lookup('statet(m1)')` 처럼 밖에서 참조하지 마십시오. 문자열 `M`(`'maybe'`,
`'either'`)이나 `type` 프로퍼티가 있는 객체 `M` 을 쓰면 **결정적인 별칭**을 얻습니다.

---

## `Ord` 는 짝 `Setoid` 를 싣는다 {#ord-setoid}

Static Land 는 `Ord` 에 "support `Setoid` algebra for the same `T`" 를 겁니다. 순서를 아는
것은 같음도 안다는 뜻입니다. 그래서 `Ord` 는 `Setoid` 를 상속하고, 생성자가 **짝이 될
`Setoid` 를 받습니다** — `Monoid` 가 `Semigroup` 을 받는 것과 같은 모양입니다.

```javascript
const { Ord, Setoid } = FunFP;

const O = Ord.lookup('number');
console.log(O.lte(1, 2), O.equals(1, 1));   // true true   한 인스턴스가 둘 다 진다
console.log(O instanceof Setoid);           // true
```

### 짝은 아무 `Setoid` 나 되지 않는다

**순서가 유도하는 동치**여야 합니다. 문자열을 길이로 비교하면 `'ab'` 와 `'cd'` 는 서로
`lte` 가 양방향으로 참이므로 **같은 자리**입니다. 반대칭 법칙(`lte(a,b)` 이고 `lte(b,a)` 면
`equals(a,b)`)이 그 둘을 같다고 답할 것을 요구합니다. 글자 동등을 쓰면 그 법칙이 깨집니다.

```javascript
const { Ord, Setoid } = FunFP;

const byLength = Ord.lookup('StringLengthOrd');
console.log(byLength.lte('ab', 'cd'), byLength.lte('cd', 'ab'));  // true true  같은 자리
console.log(byLength.equals('ab', 'cd'));                          // true   그래서 같다

console.log(Setoid.lookup('string').equals('ab', 'cd'));           // false  글자 동등은 다르다
```

그래서 `StringLengthOrd`·`StringLocaleOrd` 는 `StringSetoid` 를 재활용하지 않고 각자의
짝(`StringLengthSetoid`·`StringLocaleSetoid`)을 따로 둡니다. 로케일 순서의 동치는 조합형과
완성형을 같다고 봅니다.

```javascript
const { Setoid } = FunFP;

const nfc = '\u00e9';    // é  완성형 (한 글자)
const nfd = 'e\u0301';   // é  조합형 (e + 결합 악센트)
console.log(Setoid.lookup('string').equals(nfc, nfd));               // false
console.log(Setoid.lookup('StringLocaleSetoid').equals(nfc, nfd));   // true
```

### 컨테이너도 같은 규칙을 따른다

`Ord.Array(inner)` 의 짝은 `Setoid.Array(inner)` 입니다 — **안쪽 `Ord` 자신**에게서 뽑습니다.
안쪽 키로 `Setoid` 를 조회하면(`Setoid.Array('string')`) 위의 길이 순서에서 법칙이 깨집니다.

```javascript
const { Ord } = FunFP;

const byLength = Ord.lookup('StringLengthOrd');
const arrays = Ord.Array(byLength);
console.log(arrays.lte(['ab'], ['cd']), arrays.lte(['cd'], ['ab']));  // true true
console.log(arrays.equals(['ab'], ['cd']));                            // true
```

`tests/staticland-laws.test.js` 가 등록된 인스턴스와 팩토리 산물 전부에 이 법칙을 돌립니다.

---

## 컨테이너 Setoid / Ord — 안쪽 비교법을 받아 상자 비교법을 만든다 {#container-setoid}

`Setoid.lookup('number')` 는 숫자를 비교합니다. `Just(1)` 같은 상자를 비교하려면 **안에 든
것을 비교하는 법**을 먼저 알아야 하므로, 조립 키로 안쪽을 밝힙니다. 매개변수 없는
`Setoid.lookup('maybe')` 는 없습니다 — 안쪽을 항상 밝힙니다.

```javascript
const { Setoid, Ord, Maybe, Either } = FunFP;

const S = Setoid.lookup('maybe(number)');
console.log(S.equals(Maybe.Just(1), Maybe.Just(1)));    // true
console.log(S.equals(Maybe.Just(1), Maybe.Nothing()));  // false

console.log(Setoid.lookup('array(number)').equals([1, 2], [1, 3]));   // false
console.log(Ord.lookup('maybe(number)').lte(Maybe.Nothing(), Maybe.Just(1)));  // true  Nothing 이 가장 작다
console.log(Ord.lookup('array(number)').lte([1, 2], [1, 3]));         // true  사전식
```

### `Either` 는 자리가 둘이라 비교법도 둘을 받는다

`Left` 에는 실패가, `Right` 에는 성공이 담기고 **서로 타입이 다릅니다.** 키는 쉼표로 둘을
담습니다 — `writert(maybe,array)` 가 이미 쓰는 형식입니다. Haskell(`(Eq a, Eq b) =>`)과
fp-ts(`getEq(EL, EA)`)도 둘을 받지만, 그쪽은 타입 검사기가 찾아주는 전제라 근거로 삼은 것은
우리 키 형식입니다.

```javascript
const { Setoid, Either } = FunFP;

const S = Setoid.lookup('either(string,number)');
console.log(S.equals(Either.Left('a'), Either.Left('a')));   // true   왼쪽은 문자열로
console.log(S.equals(Either.Right(1), Either.Right(1)));     // true   오른쪽은 숫자로
console.log(S.equals(Either.Left('a'), Either.Right(1)));    // false

// 중첩도 됩니다 — 쉼표는 최상위에서만 자릅니다
console.log(Setoid.lookup('either(maybe(number),array(string))')
    .equals(Either.Right(['a']), Either.Right(['a'])));      // true
```

**`Either` 의 `Ord` 는 일부러 없습니다.** `Left` 와 `Right` 중 무엇이 먼저인지에 정답이
없습니다. fp-ts 도 코어에서 뺐습니다. `Ord.lookup('either(...)')` 는 던집니다.

### 레코드는 `Setoid.Struct` — 팩토리만이 입구다

레코드(`{ name, age }`)는 필드마다 타입이 달라 안쪽 비교법이 하나로 안 정해집니다.
fp-ts 의 `Eq.struct` 에 해당합니다.

**문자열 키가 없습니다.** `maybe`/`array`/`either` 는 이 라이브러리의 이름 있는 타입이라
레지스트리에 살지만, 레코드는 **사용자마다 다른 즉석 모양**이라 무한히 많습니다 — 전역
명부에 올리면 `Algebra.all('object')` 가 `structAddressStructCityStringSetoid` 같은 이름으로
오염됩니다. 그래서 등록하지 않고(`registry=null` 경로) 팩토리만 둡니다.

```javascript
const { Setoid } = FunFP;

const S = Setoid.Struct({ name: 'string', age: 'number' });
console.log(S.equals({ name: 'A', age: 30 }, { name: 'A', age: 30 }));        // true
console.log(S.equals({ name: 'A', age: 30 }, { name: 'A', age: 30, x: 1 }));  // false  초과 필드도 거부
console.log(S === Setoid.Struct({ age: 'number', name: 'string' }));          // true   내부 정규화 캐시

// 중첩은 팩토리를 겹쳐 쓴다
const U = Setoid.Struct({ users: Setoid.Array(Setoid.Struct({ name: 'string' })) });
console.log(U.equals({ users: [{ name: 'a' }] }, { users: [{ name: 'a' }] })); // true
```

**엄격 비교입니다** — 선언한 필드 집합과 실제 키 집합이 정확히 같아야 합니다. fp-ts 는 초과
필드를 무시하지만, 이 라이브러리의 검사 철학(strict mode)과 맞추고 테스트 이행에서 약해지지
않기 위해 거부합니다. `Ord.Struct` 는 없습니다 — 레코드의 순서에도 정답이 없습니다.

### 왜 만들었나 — 테스트가 사설 구현을 갖고 있었다

`tests/utils.js` 의 `deepEquals`(2025-12-25 생성)가 `Maybe`/`Either` 를 직접 분해해
비교했고, **그것을 검증하는 테스트는 0건인 채 58곳이 그것에 기대고 있었습니다.** 지금은
전부 라이브러리의 `Setoid` 로 갈아끼웠고 사설 구현은 지웠습니다 — 비교 규칙이 테스트
헬퍼가 아니라 검증 대상인 라이브러리 자신에게서 나옵니다(`assertEqualsBy`).

---

## `NumberProductGroup` 의 역원은 모든 수에 있지 않다 {#product-group}

`Group` 은 "모든 값에 역원이 있다" 는 약속입니다. 곱셈에서 2의 역원은 0.5이고
`2 × 0.5 = 1` 입니다. **그 약속이 지켜지지 않는 값이 있습니다.** 원인이 둘입니다.

**0은 원리적으로 역원이 없습니다.** 어떤 수를 0에 곱해도 1이 되지 않습니다. 수학에서도
곱셈 군은 0을 뺀 수에서만 성립합니다 — 라이브러리 결함이 아닙니다.

**0이 아니어도 부동소수점이 깹니다.** `a × (1/a)` 가 정확히 1이 되려면 반올림이 상쇄돼야
하는데, 평범한 값에서도 어긋납니다.

```javascript
const { Group } = FunFP;

const G = Group.lookup('NumberProductGroup');
console.log(G.concat(2, G.invert(2)));    // 1     — 성립
console.log(G.concat(-3, G.invert(-3)));  // 1     — 성립
console.log(G.concat(49, G.invert(49)));  // 1.0000000000000002  — 어긋난다
console.log(G.concat(0, G.invert(0)));    // NaN   — 0 은 역원이 없다
```

덧셈 쪽은 이 문제가 없습니다 — `a + (-a)` 는 항상 정확히 0입니다.

```javascript
const { Group } = FunFP;

const G = Group.lookup('NumberSumGroup');
console.log(G.concat(0.1, G.invert(0.1)));  // 0
console.log(G.concat(49, G.invert(49)));    // 0
```

**정확한 나눗셈이 필요하면 `NumberProductGroup` 대신 유리수나 십진 타입을 쓰십시오.**
`tests/staticland-laws.test.js` 의 군 법칙 검사가 이 인스턴스만 표본을 따로 두는 이유가
이것이고, 그 표본에 이유가 적혀 있습니다.

---

## `Either`·`Task` 는 `Filterable` 이 아니다 {#filterable}

Static Land 의 `Filterable` 은 규칙 셋을 요구합니다.

| | 규칙 |
| --- | --- |
| 분배 | `filter(x => f(x) && g(x), a) ≡ filter(g, filter(f, a))` |
| 항등 | `filter(x => true, a) ≡ a` |
| 소멸 | `filter(x => false, a) ≡ filter(x => false, b)` |

**소멸 규칙은 "비어 있음" 을 요구합니다.** 전부 걸러내면 원래 무엇이 들어 있었든 같은 것이
나와야 하는데, 그러려면 그 타입에 "비어 있음" 에 해당하는 값이 있어야 합니다.

```javascript
const { Filterable, Maybe } = FunFP;

console.log(Filterable.lookup('array').filter(() => false, [1, 2, 3]));   // []
console.log(Filterable.lookup('array').filter(() => false, [9]));        // []
console.log(Filterable.lookup('maybe').filter(() => false, Maybe.Just(1)).isNothing());  // true
```

`Either` 에는 그런 값이 없습니다. 언제나 `Left` 아니면 `Right` 이고 **둘 다 값을 지고
있습니다.** `Left('DB 실패')` 는 "비어 있음" 이 아니라 특정한 실패입니다.

`Left` 를 만나면 걸러낼 값이 없으므로 술어를 부를 수 없고, 보존하거나 뭉개거나 하나로
정해야 합니다. **어느 쪽을 골라도 규칙 하나가 깨집니다.**

| `Left` 를 만나면 | 깨지는 규칙 |
| --- | --- |
| 보존한다 | 소멸 — `Left('e1')` 과 `Left('e2')` 가 그대로 남아 결과가 다르다 |
| 뭉갠다 | 항등 — `filter(x => true, Left('e'))` 도 뭉개진다 |

왼쪽에 "빈 값은 이것이다" 를 알려줘도 같습니다. 손을 안 대는 쪽을 고르면 소멸이 깨지고,
손을 대면 항등이 깨집니다 — **정보의 문제가 아니라 모양의 문제입니다.** `Task` 도 같습니다:
거부된 `Task` 는 오류를 지고 있습니다.

그래서 이 둘은 `Filterable` 로 등록하지 않습니다. 거르는 기능 자체는 그대로 씁니다 —
등록은 "규칙을 지킨다" 는 보증이고, 그 보증만 거둔 것입니다.

```javascript
const { Either, Filterable } = FunFP;

console.log(Either.filter(x => x > 0, Either.Right(1)).value);    // 1
console.log(Either.filter(x => x > 0, Either.Right(-1)).isLeft()); // true

let message = '';
try { Filterable.lookup('either'); } catch (e) { message = e.message; }
console.log(message);   // 'Filterable.lookup: unsupported key either'
```

fp-ts 와 Haskell 의 `witherable` 은 `Either` 에 거르기를 줍니다(왼쪽 `Monoid` 를 받는
조건으로). **그쪽 규칙집에는 소멸 규칙이 없기 때문입니다** — Haskell 의 `Filterable` 법칙은
보존과 합성 둘뿐입니다. 전제가 다른 곳의 결론이라 그대로 가져올 수 없습니다.

---

## 레지스트리에 쓰는 문은 하나다 {#registry-writes}

**레지스트리는 잘 알려진 타입의 명부입니다** — 이미 등록된 인스턴스를 이름으로 찾기 위한
것이고, 커스텀 타입은 지원하지 않습니다(소유자 결정, 2026-08-13). 사용자 정의 모양은
팩토리(`Setoid.Struct`)나 `registry=null` 생성자로 만들어 **명부 밖에서** 씁니다.

**`registerAs(types, 키, 인스턴스)` 가 유일한 문입니다.** `register(types, instance, ...별칭)`
도 그 위에 세워져 있습니다 — 클래스 이름과 별칭을 각각 `registerAs` 로 넣습니다.

```javascript
const { Semigroup, Monoid } = FunFP;

// register() 로 들어간 것: 클래스 이름과 소문자 별칭 둘 다 같은 인스턴스를 준다
console.log(Semigroup.lookup('array') === Semigroup.types.ArraySemigroup);   // true
// registerAs 로 키를 직접 넣은 것: 조립 키 하나만 있다
console.log(Monoid.lookup('maybe') === Monoid.types['maybe']);   // true
```

**직접 대입하지 마십시오.** `X.types[키] = 인스턴스` 로 쓰면 `lookup` 은 되지만
[역인덱스](#algebra-all)에 안 들어가서 `Algebra.all` 에서 **조용히 사라집니다.**

2026-08-13 이전에는 문이 14개였습니다(`register()` 1개 + 직접 대입 13곳). 그래서 등록 규칙을
한 자리에서 강제할 수 없었고, 같은 날의 `.type` 드리프트도 `.type` 게이트가 유도 인스턴스를
못 훑던 것도 거기서 나왔습니다.

**문법으로는 우회를 막을 수 없습니다.** `tests/registry-api.test.js` 가 "레지스트리에 있는
인스턴스가 전부 `Algebra.all` 에도 있는가" 를 대조하는 것이 유일한 게이트입니다. 그 대조는
**그 시점에 존재하는 인스턴스만** 봅니다 — 아무도 만들지 않는 파생을 우회하면 안 걸립니다.

---

## `Algebra.all` 은 등록 시점의 역인덱스를 꺼낸다 {#algebra-all}

쓰는 법은 [README](./README.md) 에 있습니다. 내부 사정은 이렇습니다.

[유일한 문](#registry-writes)이 인스턴스를 등록할 때 `.type`(소문자) → 인스턴스들의
역인덱스를 함께 갱신합니다. `Algebra.all` 은 그 인덱스를 꺼내므로 **O(k)** 입니다 —
훑지 않습니다.

| | 훑던 때 | 인덱스 |
| --- | --- | --- |
| `Algebra.all('array')` | 15.9μs | **1.5μs** |
| `Algebra.all('number')` | 13.5μs | **0.6μs** |
| `Functor.lookup('array')` | 0.009μs | 0.009μs |

**키 순서는 계약이 아닙니다.** 등록 순서를 따라가므로 등록 순서가 바뀌면 함께 바뀝니다 —
실제로 훑기에서 인덱스로 옮길 때 바뀌었습니다. 쓰는 쪽은 이름으로 구조분해하므로 순서에
의존하는 곳이 0건이고, 그래서 `npm run baseline` 격자도 **정렬해서** 봅니다. 정렬 안 한
줄을 두면 의미 없는 차이를 보고하고, 누군가 그것을 초록으로 만들려다 우연한 순서를
계약으로 굳힙니다.

---

## 배포되는 소스의 상한은 ES2018 이다 {#es-ceiling}

`index.js` 1번 줄의 `polyfills` 는 "구형 런타임도 받아준다" 는 약속입니다. 그런데 폴리필이
메울 수 있는 것은 **메서드뿐**입니다. `Array.prototype.flatMap` 이 없으면 `reduce` 로 대신
만들어 줄 수 있지만, `?.` 나 `??` 같은 **문법**은 그럴 수 없습니다 — 그 문법을 모르는
런타임은 파일을 *읽는* 단계에서 죽으므로, 1번 줄의 폴리필은 실행될 기회조차 없습니다.

**그래서 문법과 메서드는 규칙이 다릅니다.**

| | 상한을 넘으면 | 폴리필로 메울 수 있나 |
| --- | --- | --- |
| 문법 (`?.` `??` `??=` 클래스 필드) | 파싱 단계에서 죽는다 | **불가능** — 다른 표현으로 바꿔야 한다 |
| 메서드 (`flatMap` `fromEntries`) | 호출 시점에 죽는다 | 가능 — `polyfills` 블록에 넣는다 |

### 기준은 Google Apps Script 다

구글은 Apps Script 가 지원하는 ECMAScript **판번호를 어디에도 적어두지 않습니다.** 대신
개별 항목으로만 밝힙니다 — `async`/`await` 와 `Promise` 는 **된다고 명시**하고,
`#private` 필드는 **파싱 에러**라고, `static` 클래스 필드와 ES 모듈은 **지원 안 함**이라고
적습니다. 그 사이 구간(ES2018–ES2021)에 대해서는 아무 말이 없습니다.

```
ES2015 ─── ES2017 ─── ES2018 ─ ES2019 ─ ES2020 ─ ES2021 ─── ES2022
  │           │          │  └───── 구글이 말이 없는 구간 ──┘      │
  └─ 명시적으로 된다 ─────┘  ↑ 우리 상한                    파싱 에러 확인됨
     (async/await 까지)                                  (#private, static 필드)
```

**말이 없는 구간을 밟지 않는 것**이 방어 가능한 선입니다. 상한을 ES2018 로 둔 이유가
이것입니다. `Promise.prototype.finally`(ES2018)는 상한 안쪽이라 씁니다.

`?.` 와 `??` 가 Apps Script 에서 실제로 도는지는 **확인하지 않았습니다** — 1차 출처가 없고
실행해 볼 수단이 없었습니다. 확인되지 않은 것에 기대지 않는 쪽을 골랐습니다.

### 지운 문법을 무엇으로 바꿨나

`??` 는 `||` 와 다릅니다 — `0`·`''`·`false` 를 통과시킵니다. 그래서 `||` 로 갈아타지 않고
`undefined`/`null` 만 검사합니다.

```javascript no-run 문법 대조표일 뿐이라 실행할 것이 없다
a.constructor?.name || 'object'      →  (a.constructor && a.constructor.name) || 'object'
typeof instance?.type !== 'string'   →  !instance || typeof instance.type !== 'string'
bucket.get(k) ?? { name: null }      →  let e = bucket.get(k); if (e === undefined || e === null) e = { name: null };
entry.name ??= key                   →  if (entry.name === undefined || entry.name === null) entry.name = key;
found?.size > 0                      →  (found && found.size > 0)
```

폴리필을 지나는 경로는 겉으로 티가 나지 않습니다. `Object` 의 `filter` 는 안에서
`polyfills.object.fromEntries` 를 부르므로, `Object.fromEntries` 가 없는 런타임에서도 같은
답을 냅니다.

```javascript
const { Filterable } = FunFP;

const F = Filterable.lookup('object');
console.log(F.filter(v => v > 1, { a: 1, b: 2, c: 3 }));   // { b: 2, c: 3 }
```

### 폴리필은 상한 *위*의 것만 검사한다

상한을 정하면 폴리필의 절반이 무의미해집니다. `Object.entries`·`Object.values` 는
**ES2017** 이라 상한을 지키는 런타임에는 **반드시 있습니다** — 있는지 검사해 봐야 늘 있는
쪽으로 갑니다. 대체 구현은 영원히 안 불리고, 그렇게 **시험된 적 없는 코드**로 남습니다.
그래서 뺐습니다. 지금은 그냥 `Object.entries(...)` 를 직접 부릅니다.

남은 둘 — `Array.prototype.flatMap` 과 `Object.fromEntries` — 은 **ES2019** 라 상한 위입니다.
없을 수 있으므로 검사가 살아 있어야 합니다.

**대체 구현으로 고정하면 안 됩니다.** 검사를 없애고 `reduce`+`concat` 만 쓰면 편하지만,
그것은 **O(n²)** 입니다. `Array` 모나드의 `chain` 이 이 경로를 지납니다.

| 배열 크기 | 네이티브 `flatMap` | `reduce`+`concat` | 배수 |
| --- | --- | --- | --- |
| 100 | 0.0018ms | 0.0087ms | 4.8배 |
| 1,000 | 0.0180ms | 0.2835ms | 15.7배 |
| 5,000 | 0.0813ms | 5.6863ms | 69.9배 |
| 20,000 | 0.3869ms | **277.7724ms** | **718배** |

검사는 "구형에서도 돈다" 와 "신형에서는 빠르다" 를 **동시에** 삽니다. 둘 중 하나만 고르면
어느 쪽이든 손해입니다.

### 규칙은 저장소 전체에 걸린다

상한은 `index.js` 만이 아니라 **손으로 쓴 자바스크립트 전부**에 걸립니다 — 빌드 스크립트
둘과 `tests/` 의 모든 파일까지.

개발 파일은 배포되지 않고 `node:fs` 같은 Node 전용 API 를 쓰므로 구형 런타임에서 돌 일이
없습니다. 그러니 여기서 사는 것은 호환성이 아니라 **일관성**입니다. 사람은 옆 파일의 관례를
베껴 씁니다. 저장소 절반이 `?.` 를 쓰고 있으면 그것이 `index.js` 로 새어 들어옵니다.
규칙이 하나여야 새지 않습니다.

`String.prototype.matchAll`(ES2020)은 세 곳에서 쓰이고 있었습니다. 회피 코드를 세 번 베끼면
그것이 다음 드리프트의 씨앗이므로, `tests/utils.js` 에 `allMatches` 하나를 두고 모두
그것을 씁니다.

**예외는 이유와 함께 표에 적습니다.** 지금 하나 있습니다 — `tests/baseline.js` 의 동적
`import()` 입니다. HEAD 의 `index.js` 를 임시 파일로 써서 불러오는데 경로가 실행 시점에
정해지므로 ESM 에는 이것 말고 수단이 없습니다. 게이트가 ① 이유가 비어 있지 않은지
② 그 예외가 **아직도 실제로 쓰이는지**를 함께 봅니다. 원인이 사라졌는데 줄만 남으면 다음
사람이 "여기는 원래 예외" 라고 읽기 때문입니다.

### 규칙을 지키는 것은 게이트다

[`tests/es-ceiling.test.js`](../tests/es-ceiling.test.js) 가 `index.js` 를 **TypeScript
파서로** 읽어 구문 트리를 훑습니다. 정규식이 아닌 이유는 이 파일의 주석에 `Forget<r>`,
`a -> b`, `docs/internals.md#anchor` 같은 표기가 널려 있어 문자열 검색은 오탐이 나기
때문입니다. 구문 트리는 주석을 보지 않습니다.

면제는 **"폴리필 블록 안"이 아니라 "기능 검사 삼항 안"** 입니다. 처음에는 블록 전체를
면제했는데, 그러면 블록 안에서 검사 없이 직접 부르는 결함을 못 잡습니다 — 결함을 심어
확인했습니다. 원본 API 를 볼 자격이 있는 것은 삼항의 **조건과 참-가지뿐**이고, 그 밖의
자리는 `polyfills.*` 를 거쳐야 합니다.

게이트가 **못 잡는 것**도 파일 머리에 적혀 있습니다. 이름을 문자열로 만들어 부르는 경우
(`obj['flatMap']()`), 그리고 표준화된 것이 문법이 아니라 *동작*인 경우 — 대표적으로
`Array.prototype.sort` 의 안정성(ES2019)입니다. 지금 `index.js` 의 유일한 `sort` 는 중복
없는 키 배열이라 안정성과 무관합니다.

### `dist/` 는 따로 훑지 않는다 — 대신 소스와 묶는다

진실 소스는 `index.js` **하나**이고 `dist/` 는 그것을 문자열로 변환한 것입니다. `build.js`
에서 결정적이지 않은 입력은 헤더의 빌드 시각 하나뿐이고, `dist/fun-fp.js` 는 **헤더를 떼면
`index.js` 와 글자까지 같습니다.** 그러니 산출물을 따로 훑는 것은 같은 일을 두 번 하는
것입니다.

**다만 그 동일성은 빌드를 돌렸을 때만 참입니다.** 안 돌리면 `dist/` 는 옛 `index.js` 의
사본으로 남고, 그 순간 사용자가 받는 것과 소스가 달라집니다. 실제로 겪었습니다 —
`index.js` 에서 `?.` 를 지운 뒤에도 `dist/` 에는 `?.` 4건과 `??` 3건이 그대로 있었습니다.

그래서 [`tests/dist-sync.test.js`](../tests/dist-sync.test.js) 는 산출물의 *내용*을 검사하지
않고 **"`dist/` 가 지금 `index.js` 의 빌드 결과와 같은가"** 를 봅니다. 이 검사가 초록이면
`index.js` 에 대해 증명한 것이 `dist/` 에도 자동으로 성립합니다.

검사는 변환 규칙을 **베끼지 않습니다.** `build.js` 가 내보내는 `buildOutputs` 를 그대로
불러 씁니다 — 베껴 두면 `build.js` 가 바뀔 때 조용히 어긋나고, 그때 이 검사는 거짓 초록이
됩니다.

`dist/fun-fp.d.ts` 도 같은 방식으로 묶습니다. 다만 짝이 다릅니다 — 그것의 진실 소스는
`index.js` 가 아니라 `types/` 폴더이고, `build-types.js` 가 선언 파일 24개를 이어 붙여
만듭니다. 그래서 검사는 `types/` 를 읽어 다시 만든 결과와 `dist/fun-fp.d.ts` 를 대조합니다.

**여기에는 함정이 하나 더 있습니다.** `build-types.js` 의 파일 명단은 손으로 적습니다.
새 선언 파일을 만들고 명단에 안 넣으면 배포되는 `.d.ts` 에서 **조용히 빠집니다** — 타입만
사라지고 런타임 동작은 멀쩡하므로 다른 어떤 검사에도 안 걸립니다. 그래서 `types/` 아래
실재하는 `.d.ts` 와 명단을 양방향으로 대조합니다. 명단에 없는 파일도, 명단에만 있고
실재하지 않는 파일도 잡습니다. (`types/__tests__/*.test-d.ts` 는 배포물이 아니라 뺍니다.)
