# 계획 — `Strong` / `Choice` / `Wander` 를 타입 클래스로 올린다

## 무엇을 / 왜

Optics 는 profunctor 딕셔너리 셋(`function` · `Forget` · `Tagged`)을 **IIFE 안 객체
리터럴**로 갖고 있다. 그 셋이 제공하는 `first` / `left` / `wander` 는 표준 이름이 각각
`Strong` / `Choice` / `Wander` 인 타입 클래스의 연산이다.

**소유자 판단 (2026-08-14)** — *"비록 Optics 내부에서 사용하지만, Free 처럼 내부에 필요한
타입 클래스는 명시적으로 구현되어야 한다."*

선례가 정확하다. `Free` 도 라이브러리 내부(트랜스포머 넷)에서 쓰이지만 숨기지 않는다 —
실측으로 **10개 키**가 등록돼 있다: `Functor.free` · `Apply.free` · `Applicative.free` ·
`Chain.free` · `Monad.free` (각각 클래스 이름 별칭까지). 지금 Optics 만 그 규칙 밖이다.

**2026-08-11 에는 반대로 결정했었다.** 근거는 "JS/TS 선례가 만장일치로 내부화" ·
"노출해도 실제 확장 용도가 안 열린다" 였고, **바꿔야 할 조건**도 함께 적혀 있었다 —
*"사용자가 자기 profunctor 를 등록해 optic 을 확장하려는 실제 요구가 생겼을 때."*
그 글은 `CLAUDE.md` 에 있었고 하네스 제거(`b970b96`) 때 지워졌으며 `docs/` 로 옮겨지지
않았다. 이번 회차에 되살린다(아래 5단계).

---

## 타당성 — 왜 지금이 그때인가

### ① 이미 필요해서 쓰고 있다. YAGNI 가 아니다

`Optics` 는 남의 타입 **내부 표현**을 직접 읽고 쓴다. 실측:

| 자리 | 지금 | 왜 그랬나 |
| --- | --- | --- |
| `forgetProfunctor.wander` | `a => ({ value: p(a) })` | `Const` 캐리어 생성자가 **없다**. `Const(m).of([7])` 는 `{value:[]}` — 값을 버린다 |
| `functionProfunctor.wander` 끝 | `.value` 직접 읽기 | `identity` `Comonad` 가 **없다** |
| `forgetProfunctor.first` | `Comonad.lookup('array').extract` | `fst` 가 **없다** (소스에 변명 주석이 달려 있다) |

숨겨서 안 쓰는 것이 아니라 **쓰면서 숨긴 것**이다. 리터럴로 위장돼 있어 아무도 감시하지
못한다 — `IdentityFunctor` 의 캐리어 모양이 바뀌면 Optics 가 조용히 깨진다.

### ② 감시가 0이다

레지스트리 밖이라 순회에 안 걸린다. 실측:

| 게이트 | Optics 언급 |
| --- | --- |
| `staticland-laws.test.js` (법칙) | **0건** |
| `staticland-spec.test.js` (메서드 존재) | **0건** |
| `algebra-type.test.js` (`.type` 태그) | **0건** |

`tests/optics.test.js` 76개가 있지만 **이름을 적어 둔 것만** 본다. `Ord` 가 `Setoid` 를 잃은
채 살아 있던 것과 **같은 모양의 구멍**이다.

### ③ 던지는 스텁이 구조로 바뀐다 — 이것이 가장 큰 값어치다

지금 `taggedProfunctor` 는 `first` 와 `wander` 를 **던지는 함수**로 채워 둔다.

```javascript
first: () => raise(new TypeError('review: argument must be a Prism (a Lens cannot be reviewed)')),
wander: () => raise(new TypeError('review: argument must be a Traversal cannot be reviewed')),
```

타입 클래스가 생기면 이것이 **없어진다.** `Tagged` 는 `Choice` 인스턴스이지만
`Strong`·`Wander` 인스턴스가 **아니다** — 그 부재가 곧 "Lens 는 review 할 수 없다" 다.
런타임 예외가 **인스턴스 미등록**으로 바뀐다. 이 저장소가 `Filterable` 에서 이미 한 판단과
같다: *"등록은 규칙을 지킨다는 보증이고, 지킬 수 없는 보증만 거둔다."*

### ④ 매개변수 인스턴스의 선례가 있다

`Forget` 은 monoid 를 받으므로 평범한 인스턴스가 아니라 팩토리다. 선례가 이미 돈다 —
`Applicative.Const(Monoid.lookup('array'))` 를 부르면 레지스트리에 `const(array)` 키가
생긴다(실측). `Setoid.Array(inner)` 도 같은 모양이다.

---

## 반대 근거 — 2026-08-11 판단이 아직 유효한 부분

정직하게 남긴다. **셋 중 둘은 여전히 사실이다.**

- **JS/TS 선례는 여전히 내부화다.** `optika` 는 "Internals — probably never need to use
  directly", `monocle-ts` 는 "only used internally". 이 계획은 **선례를 따르지 않는 쪽**이다.
- **indexed optics 는 여전히 안 열린다.** 커스텀 profunctor 의 대표 확장 용도인데
  `Indexed`/`StarI`/`ForgetI` 같은 별도 계열과 `itraversed` 생성자가 필요하다. 셋을
  올린다고 그것이 되지 않는다 — **"확장성이 열린다" 고 말하면 거짓이다.**
- 세 번째("Haskell 의 내부화 이유는 타입 추론 문제라 JS 에 무관")는 원래도 우리 근거가
  아니었다.

**그래서 이 변경의 근거는 확장성이 아니라 ①②③이다** — 이미 쓰고 있고, 감시가 없고,
던지는 스텁이 구조로 바뀐다.

---

## 무엇을 만드나

### 클래스 셋 — 표준 그대로 (소유자 결정 2026-08-14)

`Profunctor` 를 상속한다. `Wander` 의 부모 둘은 `Traversable` 선례를 따른다(결정 ③).

```
Strong extends Profunctor      first  · second
Choice extends Profunctor      left   · right
Wander extends Strong          wander        (choice 를 생성자로 받아 this.left/right 복사)
```

### 인스턴스 다섯 — 여섯 메서드가 전부 구현되는지 실측했다

| 인스턴스 | 클래스 | `first` | `second` | `left` | `right` | `wander` |
| --- | --- | --- | --- | --- | --- | --- |
| `FunctionStrong/Choice/Wander` | 셋 다 | ✅ | ✅ 실측 `[3,90]` | ✅ | ✅ 실측 | ✅ |
| `Forget(m)` | 셋 다 | ✅ | ✅ 실측 `[5]` | ✅ | ✅ 실측 `Left→[]` | ✅ |
| `Tagged` | **Choice 만** | — | — | ✅ | **✅ 신설** | — |

`.type` 은 `Function`/`Forget` 이 `'function'`(캐리어가 함수다), `Tagged` 가 `'any'`
(`Tagged a b = b` 라 값 타입을 안 본다 — 선례 넷: `firstSemigroup`·`lastSemigroup`·
`defaultSetoid`·`defaultOrd`).

**표준으로 가면 빠진 것이 채워진다 — 이것은 대칭을 위한 장식이 아니다.**
지금 `taggedProfunctor` 에는 `left` 만 있고 **`right` 가 없다.** `Choice` 는 둘을 요구하므로
현재의 Tagged 는 **불완전한 Choice** 다. `right` 가 생기면 `Right` 쪽으로 향한 Prism 도
`review` 할 수 있게 된다 — **지금은 안 되는 일이다.**

`Tagged` 가 `Strong`/`Wander` 가 아닌 것은 구조가 막는 것이다. `Tagged a b = b` 는 입력을
만들어낼 수 없어 `first`/`wander` 가 원리적으로 정의되지 않는다. 그 **부재**가 곧
"Lens/Traversal 은 review 할 수 없다" 이고, 지금의 던지는 스텁 둘을 대신한다.

### 함께 내는 공개 표면 — ✅ 결정 (소유자: "미루면 결국 부채가 된다")

이것 없이는 Optics 가 리터럴을 못 버린다. **미루지 않고 이번에 함께 낸다.**

| 무엇 | 왜 필요한가 | 넓이 |
| --- | --- | --- |
| `Const` 캐리어 생성자 | `Forget.wander` 의 `{ value: … }` 제거. **`of` 로는 불가능** — 값을 버린다 | 좁다 |
| `identity` `Comonad` | `.value` 직접 읽기 제거 (`extract`) | 좁다 — 레지스트리 인스턴스 1개 |
| `fst` / `snd` | `Comonad.lookup('array').extract` 대체 | **넓다 — 최상위 이름 둘** |

`fst`/`snd` 는 optics 와 무관하게도 정당하다 — `tuple` 로 **만드는** 수단은 있는데
**꺼내는** 수단이 없는 비대칭을 메운다.

---

## 건드려야 하는 자리 — 실측으로 센 것

타입 클래스 하나를 늘리면 **최소 일곱 곳**이 함께 움직인다. 셋이면 그 세 배다.

| # | 파일 | 무엇 | 지금 값 |
| --- | --- | --- | --- |
| 1 | `index.js` | `checkAndSet` 규칙표에 항목 추가 | 37개 (193~446행) |
| 2 | `index.js` | 클래스 정의 + `Symbols` 항목 | — |
| 3 | `index.js` | 인스턴스 정의 + `register` | — |
| 4 | `types/TypeClasses.d.ts` | `export interface` 추가 | 48개 |
| 5 | `docs/README.md` | 타입 클래스 의존성 그래프 | 93행 |
| 6 | `tests/staticland-spec.test.js` | `SPEC` 표 | 24항목 |
| 7 | `tests/algebra-type.test.js` | 인스턴스 개수 단언 · `BY_PREFIX` · `EXCEPTIONS` | `all.length === 127` |
| 8 | `tests/staticland-laws.test.js` | 법칙 (아래 「못 하는 것」 참조) | — |
| 9 | `docs/` | 새 문서 3종 + `docs/README.md` 학습 순서 | — |

**검사 ⑤가 6·4·5를 동시에 요구한다** — "표·타입 선언·문서가 같은 타입 클래스 집합을
말한다". 하나만 고치면 그 자리에서 멈춘다. 검사 ⑥은 `.d.ts` 의 `extends` 가 `sameT` 부모와
일치할 것을 요구한다.

---

## 결정

### ① `SPEC` 표 — ✅ 결정 (2026-08-14, 소유자: "Free 의 예시와 결을 맞춘다")

**`Free` 가 실제로 어떻게 다뤄지는지 확인했다.**

| | 값 |
| --- | --- |
| `SPEC` 표에 `Free` | **0건** — Free 는 데이터 타입이지 타입 클래스가 아니다 |
| 레지스트리 등록 | **10개 키** (`Functor.free` · `Apply.free` · `Applicative.free` · `Chain.free` · `Monad.free` + 클래스 이름 별칭) |
| 전용 문서 | `docs/Free.md` **있음** |
| 법칙 게이트 표본 | **3곳** |
| 별도의 2등 표 | **없음** |

**Free 의 교훈은 "내부용이라는 것이 숨긴다는 뜻은 아니다" 이다.** 등록되고, 문서가 있고,
게이트가 보고, 그러면서 **별도의 2등 명단을 만들지 않는다.**

따라서 `EXTENSIONS` 표를 따로 만드는 안(나)은 뺀다 — 그것이 곧 2등 명단이다.
**표는 하나로 두고 각 항목이 명세 소속을 스스로 말하게 한다.**

```javascript
Traversable: { method: 'traverse', sameT: ['Functor', 'Foldable'] },
Strong:      { method: 'first',    sameT: ['Profunctor'], spec: false },
Choice:      { method: 'left',     sameT: ['Profunctor'], spec: false },
Wander:      { method: 'wander',   sameT: ['Strong', 'Choice'], spec: false },
```

- 검사 ①②⑤⑥은 표 전체를 본다 — 그래서 새 셋도 똑같이 감시된다.
- **Static Land 소속을 주장하는 검사만 `spec !== false` 로 거른다.** 지금 그런 검사는
  ②-1 하나다.
- `spec` 이 없으면 `true` 다 — 기존 24항목은 한 글자도 안 고친다.

이렇게 하면 표 머리의 "Static Land 명세와 대조" 라는 이름이 거짓이 되지 않는다.

### ② `second` / `right` — ✅ 결정 (2026-08-14, 소유자)

> *"표준으로 갑니다. YAGNI 는 반대합니다. 미루면 결국 부채가 됩니다."*

**표준대로 넷을 다 낸다.** 판단 재료는 아래 「`second`/`right` 를 왜 물었나」 절에 있다.

이 결정으로 드러난 사실 하나: **`Tagged` 에 `right` 가 없었다.** `Choice` 가 둘을 요구하는데
지금은 `left` 만 있으니 불완전한 `Choice` 다. 표준으로 가는 것이 "안 쓰는 코드를 더하는 것"
이 아니라 **빠진 것을 채우는 것**인 자리가 최소 하나 있다는 뜻이다.

내가 "쓰지 않는 코드 2개가 생긴다" 고 적었던 것은 **Optics 의 현재 사용처만 센 것**이었다.
클래스가 요구하는 것을 안 세었다.

### ③ `Wander` 의 부모 — ✅ 결정 (선례가 저장소 안에 있었다)

**소유자 지시대로 찾아보니 같은 문제를 이미 두 번 풀었다.** JS 다중 상속 없이 부모 둘을
지는 클래스가 **셋** 있다(검사 ②-1 이 그 목록을 못 박고 있다):
`Alternative` · `Monad` · `Traversable`.

`Traversable` 이 `Wander` 와 **정확히 같은 모양**이다 — 부모가 둘이고 자기 메서드도 있다.

```javascript
class Traversable extends Functor {                    // ← 하나만 상속
    constructor(functor, foldable, traverse, type, registry, ...aliases) {
        checkAndSet('Traversable.super')(functor, foldable);   // ← 둘 다 검증
        super(functor.map, type);
        this.reduce = foldable.reduce;                  // ← 둘째 부모의 메서드를 복사
        checkAndSet('Traversable')(this, functor, foldable, traverse);
        registry && register(registry, this, ...aliases);
    }
    traverse() { raise(new Error('Traversable: traverse is not implemented')); }
}
```

`Alternative` 은 같은 모양에 자기 메서드가 없는 판이다(`method: null`) —
`this.alt = plus.alt; this.zero = plus.zero;`.

**그대로 따른다.**

```javascript
class Wander extends Strong {
    constructor(strong, choice, wander, type, registry, ...aliases) {
        checkAndSet('Wander.super')(strong, choice);
        super(strong.promap, strong.first, type);
        this.left = choice.left;                        // ← Traversable 의 this.reduce 자리
        checkAndSet('Wander')(this, strong, choice, wander);
        registry && register(registry, this, ...aliases);
    }
    wander() { raise(new Error('Wander: wander is not implemented')); }
}
```

`'Wander.super'` 규칙도 `'Traversable.super'` 를 본뜬다 — 첫 인자가 `Symbols.Strong`,
둘째가 `Symbols.Choice` 인지 본다.

**함께 바뀌는 것**: 검사 ②-1 의 단언이 `'Alternative,Monad,Traversable'` →
`'Alternative,Monad,Traversable,Wander'` 가 된다. 그 검사는 "늘면 여기서 멈춘다" 가
목적이므로 **의도된 멈춤**이다.

### ④ 공개 표면 — ✅ 결정 (2026-08-14, 소유자: "미루면 결국 부채가 된다")

셋 다 이번에 낸다. 되돌리기 어려운 것은 사실이므로 **순서에서 1단계에 둔다** — 가장 먼저
하고, 틀렸으면 그 위에 아무것도 쌓기 전에 안다.

---

## `second` / `right` 를 왜 물었나 — 보강

### 표준은 둘씩이다

`Strong` 은 곱의 **어느 쪽**을 건드릴지로 둘이 나온다.

```
first  : p a b -> p (a, c) (b, c)      왼쪽만 건드리고 오른쪽은 통과
second : p a b -> p (c, a) (c, b)      오른쪽만 건드리고 왼쪽은 통과
```

`Choice` 는 합에서 같은 모양이다 — `left` 는 `Left` 만, `right` 는 `Right` 만 건드린다.

### 그런데 서로 유도된다 — 실측

`swap` 을 앞뒤로 끼우면 하나에서 다른 하나가 나온다.

```javascript
second = p => dimap(swap, swap, first(p))
```

실행 결과:

```
first  (x*10, [3, 9])  ->  [30, 9]
second (x*10, [3, 9])  ->  [3, 90]     ← first + swap 두 번으로 만든 것
```

### Optics 는 하나도 안 쓴다 — 실측

`index.js` 의 Optics 구역에서 `.second(` / `.right(` 호출은 **0건**이다.
이유는 `Lens` 가 **자기가 원하는 모양으로 `dimap` 해서 들어가기 때문**이다.

```javascript
Lens = (getter, setter) => P => pab =>
    P.dimap(s => tuple(getter(s), s), ([b, s]) => setter(b, s), P.first(pab));
```

초점을 항상 튜플의 **첫 자리**에 놓고 들어간다. 그래서 둘째 자리 렌즈도 `first` 만으로
만들어진다 — 실측: `view(sndLens, ['a', 7])` → `7`, `over` → `['a', 14]`.

### 그래서 무엇을 고르는 문제인가

| | 안 낸다 (`first`·`left` 만) | 낸다 (`second`·`right` 도) |
| --- | --- | --- |
| 이름 | 표준 이름을 쓰면서 **절반만 진다** | 표준과 같다 |
| 코드 | 쓰는 것만 있다 | **쓰지 않는 코드 2개**가 생긴다 |
| 법칙 게이트 | 검사할 것이 적다 | `first`↔`second` 유도 관계를 **법칙으로 고정**할 수 있다 |
| 사용자 확장 | 자기 profunctor 를 만들 때 절반만 구현하면 된다 | 넷을 다 구현해야 한다 |

**YAGNI 가 금지된 저장소라는 점이 판단에 걸린다.** 다만 `Filterable` 선례가 반대 방향을
가리킨다 — *"지킬 수 없는 보증은 거둔다."* 여기서는 *"쓰지 않는 것을 이름만 세운다"* 가
같은 부류인지가 쟁점이다.

**한 가지 사실은 분명하다.** 안 내기로 하면 그 사실이 문서에 있어야 한다 — 표준 `Strong` 을
아는 사람이 `second` 를 찾을 것이기 때문이다. 그리고 `second = dimap(swap, swap) ∘ first`
한 줄을 문서 예제로 두면 실행되는 회귀 테스트가 된다.

---

## 완료 조건

1. `Optics` 구역에 `{ value:` 리터럴이 **0개**이고, 세 딕셔너리가 레지스트리에서 조회된다.
2. `taggedProfunctor` 의 **던지는 스텁 둘이 사라진다.** `review(lens, …)` 는 여전히 실패하되,
   그 실패가 "인스턴스가 없다" 에서 나온다.
3. `npm run baseline` **차이 0** — 관측 동작이 그대로다(격자가 optics 를 36곳 본다).
4. `tests/optics.test.js` 76개를 **한 줄도 안 고치고** 통과한다.
5. 새 인스턴스 다섯이 `.type` 게이트·명세 게이트에 잡힌다. 각각의 `.type` 을 비정규 값으로
   바꾸는 뮤테이션이 **전부** 잡힌다.
6. 2026-08-11 의 미채택 근거와 **이번에 뒤집은 이유**가 `docs/internals.md#optics` 에 있다.

---

## 이 계획이 못 하는 것 — 미리 적는다

- **`Wander` 의 법칙은 안 넣는다.** 순회 자연변환이 필요해 등가식만으로는 불충분하다 —
  `Traversable` 을 법칙 게이트에서 뺀 것과 **같은 이유**다. `Strong`/`Choice` 는 넣을 수 있다
  (`lmap fst ≡ rmap fst ∘ first` 등 넷씩).
- **확장성이 열리지 않는다.** indexed optics 는 별도 profunctor 계열을 요구한다.
  이 변경의 근거는 확장성이 아니다.
- **`.type` 게이트는 태그 값만 본다.** 세 인스턴스가 전부 `'function'` 이라 서로 바꿔 끼워도
  그 게이트는 통과한다 — 그것은 법칙 게이트가 져야 한다.

---

## 순서

| 단계 | 무엇 | 되돌릴 수 있나 |
| --- | --- | --- |
| 0 | 결정 ①②③④ **전부 확정됨** | — |
| 1 | `Const` 생성자 · `identity` Comonad · `fst`/`snd` — 공개 표면 먼저 | 어려움 |
| 2 | 클래스 셋 + 규칙표 + `Symbols` | 쉬움 |
| 3 | 인스턴스 다섯 등록, Optics 를 조회로 전환 | 쉬움 |
| 4 | 게이트 갱신(개수·SPEC·`.d.ts`·문서 그래프) + 뮤테이션 | 쉬움 |
| 5 | `docs/internals.md#optics` 에 근거 복원 + 새 문서 3종 | 쉬움 |

**1단계가 가장 위험하다** — 되돌리기 어려운 것을 먼저 한다. 0단계 없이 시작하지 않는다.
