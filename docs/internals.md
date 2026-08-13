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
| `Monoid.lookup('plus(maybe)')` | 안을 **열지 않고** 첫 `Just` 를 통째로 고른다 |

payload 타입이 같으면 결과도 같습니다. **갈리는 것은 타입이 섞였을 때뿐**이고, 그때 앞엣것은
안쪽 `concat` 의 타입 검사에 걸려 던집니다.

```javascript
const { Maybe, Monoid } = FunFP;

const merge = Maybe.Monoid('first');
const pick = Monoid.lookup('plus(maybe)');

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
태그만 없습니다. 그래서 등록된 `Plus` 는 전부 짝 `Semigroup`/`Monoid` 를 `plus(<별칭>)` 키로
얻습니다. 특례를 손으로 쓰지 않으므로 **`Plus` 를 새로 등록하면 짝도 자동으로 따라옵니다.**

```javascript
const { Semigroup, Monoid, Plus } = FunFP;

console.log(Monoid.lookup('plus(array)').empty());              // []
console.log(Semigroup.lookup('plus(array)').concat([1], [2]));  // [1, 2]
console.log(Plus.lookup('array').zero());                       // []   같은 연산이다
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

담는 모양이 `{ value }` 라 **`.type` 이 `'Object'`(대문자)** 입니다.

```javascript
const { Traversable, Applicative, Functor } = FunFP;

const Id = Applicative.lookup('identity');
console.log(Traversable.lookup('array').traverse(Id, x => ({ value: x + 1 }), [1, 2, 3]));
// { value: [ 2, 3, 4 ] }
console.log(Functor.lookup('identity').map(x => x + 1, { value: 1 }));   // { value: 2 }
```

**여기를 소문자로 바꾸면 optics 가 전부 죽습니다.** Identity/Const 는 `Apply.ap` 를 지나고,
거기 쓰이는 `types.equals(a, b, instance.type)` 에는 [대소문자 폴백이 없습니다](#type).

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

`tests/utils.js` 의 `deepEquals`(2025-12-25 생성)가 `Maybe`/`Either` 를 손으로 분해해
비교했고, **그것을 검증하는 테스트는 0건인 채 58곳이 그것에 기대고 있었습니다.** 지금은
전부 라이브러리의 `Setoid` 로 갈아끼웠고 사설 구현은 지웠습니다 — 비교 규칙이 테스트
헬퍼가 아니라 검증 대상인 라이브러리 자신에게서 나옵니다(`assertEqualsBy`).

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
console.log(Monoid.lookup('plus(array)') === Monoid.types['plus(array)']);   // true
```

**직접 대입하지 마십시오.** `X.types[키] = 인스턴스` 로 쓰면 `lookup` 은 되지만
[역인덱스](#algebra-all)에 안 들어가서 `Algebra.all` 에서 **조용히 사라집니다.**

2026-08-13 이전에는 문이 14개였습니다(`register()` 1개 + 직접 대입 13곳). 그래서 등록 규칙을
한 자리에서 강제할 수 없었고, 같은 날의 `.type` 드리프트도 `.type` 게이트가 `plus(array)` 를
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
