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

### 클래스 셋

`Profunctor` 를 상속한다. 부모 인스턴스를 받는 모양은 `Apply extends Functor` 선례를 따른다.

```
Strong  extends Profunctor   메서드 first   (+ second?  ← 결정 필요)
Choice  extends Profunctor   메서드 left    (+ right?   ← 결정 필요)
Wander  extends Strong,Choice?  메서드 wander  ← 다중 상속 불가, 결정 필요
```

### 인스턴스 다섯

| 인스턴스 | 클래스 | `.type` | 등록 키 |
| --- | --- | --- | --- |
| `FunctionStrong` | Strong | `'function'` | `function` |
| `FunctionChoice` | Choice | `'function'` | `function` |
| `FunctionWander` | Wander | `'function'` | `function` |
| `Strong.Forget(m)` | Strong·Choice·Wander | `'function'` | `forget(array)` 등 조립 키 |
| `TaggedChoice` | **Choice 만** | `'any'` | `tagged` |

`Tagged` 의 `.type` 이 `'any'` 인 근거: 캐리어가 `Tagged a b = b` 라 값 타입을 보지 않는다.
선례가 넷 있다 — `firstSemigroup` · `lastSemigroup` · `defaultSetoid` · `defaultOrd`(실측).

### 함께 나와야 하는 것 (2차에서 확인된 구멍)

이것 없이는 Optics 가 리터럴을 못 버린다.

- `Const` 캐리어 생성자 — `of` 로는 불가능(값을 버린다)
- `identity` `Comonad` — `.value` 를 대신할 `extract`
- `fst` / `snd` — `Comonad.lookup('array').extract` 를 대신할 것

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

## 결정이 필요한 것 — 코드에서 답이 안 나온다

### ① `SPEC` 표에 넣을 것인가

그 표의 이름은 **"Static Land 명세와 이 라이브러리를 대조하는 게이트"** 다. `Strong`·
`Choice`·`Wander` 는 **Static Land 에 없다.** 그대로 넣으면 표가 거짓말을 한다.

- (가) `SPEC` 에 넣고 "명세 밖" 표시를 단다
- (나) `EXTENSIONS` 표를 따로 만들고 검사 ①②⑤⑥이 두 표를 합쳐 본다
- (다) 넣지 않는다 — 그러면 이 셋만 다시 감시 밖이 되어 이 회차의 목적이 사라진다

**(다)는 자기모순이다.** (가)와 (나) 중 소유자가 정한다.

### ② `second` / `right` 를 함께 낼 것인가

표준 `Strong` 은 `first`·`second` 둘, `Choice` 는 `left`·`right` 둘이다. Optics 는 각각
하나만 쓴다. 안 내면 "표준 이름을 쓰면서 절반만 지는" 물건이 되고, 내면 **쓰지 않는 코드**가
생긴다(법칙으로는 서로 유도된다 — `second = dimap(swap, swap) ∘ first`).

### ③ `Wander` 의 부모

표준은 `Traversing extends Strong, Choice` 다. **JS 클래스는 다중 상속이 안 된다.**

- (가) `Wander extends Profunctor` 로 두고 부모 사슬을 포기한다
- (나) `Wander extends Strong` 으로 두고 `Choice` 는 문서로만 말한다
- (다) `Ord extends Setoid` 처럼 **생성자가 짝을 받는다** — `new Wander(strong, choice, wander, …)`

(다)가 이 저장소의 기존 해법이다(`Ord.super`·`Monoid.super`·`Apply.super` 가 전부 그 모양).
다만 검사 ②-1 이 **"명세 부모가 둘인 클래스는 셋뿐"** 을 못 박고 있어 그 단언도 함께 바뀐다.

### ④ 공개 표면을 어디까지 넓히나

`Const` 생성자 · `identity` Comonad · `fst`/`snd` 는 **되돌리기 어렵다.** 한 번 내보내면
사용자가 쓴다. 특히 `fst`/`snd` 는 최상위 이름 둘을 차지한다.

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
| 0 | 위 결정 넷을 소유자와 확정 | — |
| 1 | `Const` 생성자 · `identity` Comonad · `fst`/`snd` — 공개 표면 먼저 | 어려움 |
| 2 | 클래스 셋 + 규칙표 + `Symbols` | 쉬움 |
| 3 | 인스턴스 다섯 등록, Optics 를 조회로 전환 | 쉬움 |
| 4 | 게이트 갱신(개수·SPEC·`.d.ts`·문서 그래프) + 뮤테이션 | 쉬움 |
| 5 | `docs/internals.md#optics` 에 근거 복원 + 새 문서 3종 | 쉬움 |

**1단계가 가장 위험하다** — 되돌리기 어려운 것을 먼저 한다. 0단계 없이 시작하지 않는다.
