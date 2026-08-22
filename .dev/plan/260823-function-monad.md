# 함수 타입에 Apply·Applicative·Chain·Monad 를 등록한다

- **날짜** 2026-08-23
- **상태** ✅ 구현 완료(2026-08-23). 검증은 [`../TODO.md`](../TODO.md) 의 닫힘 항목에.
  **5절 초안은 불충분했다 — `Monad` 좌항등까지 고쳐야 했다. 그 경위도 TODO 에.**
- **발단** fun-fp-book 세션의 질문. 「함수에 `chain` 을 등록했다면 그게 곧 Reader 였을 텐데,
  왜 `Reader` 를 별도 타입으로 두었나?」

## 1. 왜 하는가

### 근거 A — Static Land 명세의 존재 이유가 이것이다

명세가 fantasy-land 와 갈라선 지점을 자기 장점으로 적어 두었다(원문 인용).

> "We can implement modules that work with **built-in types as values** (Number, Boolean, Array, etc)."

> "We can implement many modules for one type, therefore we can have **more than one instance of
> the same Algebra for a single type**."

fantasy-land 는 값이 메서드를 지녀야 해서 맨 함수를 모나드로 만들 수 없다 —
`Function.prototype` 을 건드리지 않는 한. 그래서 `Reader` 같은 감싸는 타입이 **필수**다.
Static Land 는 그 제약이 없다. 함수는 JavaScript 의 내장 타입이므로,
**등록하는 쪽이 명세가 하라고 만들어진 일**이다.

두 번째 인용은 「함수 키에 이미 열여섯이라 `chain` 의 뜻이 애매하다」는 걱정을 지운다.
명세가 명시적으로 허용하고, **이 저장소는 이미 그렇게 하고 있다**(실측 2026-08-23):
`Monoid.types` 에 `number` 태그가 다섯(Sum·Product·Max·Min·기본 별칭), `boolean` 이 넷.

- 출처: <https://github.com/fantasyland/static-land> 「Difference from Fantasy Land」

### 근거 B — 주요 라이브러리 둘이 이미 그렇게 했다

| | 함수 자체에 Monad | `Reader` 의 정체 |
| --- | --- | --- |
| Haskell | 있음 (base) | 별도 newtype (mtl) |
| cats | **있음** — `implicit def catsStdMonadForFunction1[T1]: Monad[T1 => *]` | **별도 타입 아님** — `type Reader[A, B] = Kleisli[Id, A, B]` |
| fun-fp-js | **없음** | 별도 클래스 |

- 출처: <https://typelevel.org/cats/api/cats/instances/FunctionInstances.html>
- 출처: <https://typelevel.org/cats/datatypes/kleisli.html>

cats 가 함수에 붙인 것 — Contravariant, ContravariantMonoidal, Distributive, ArrowChoice,
CommutativeArrow, MonoidK, **Monad**. 우리가 붙인 것 — Semigroup, Monoid, Semigroupoid,
Category, Contravariant, Functor, Profunctor, Strong, Choice, Wander.
**그림이 거의 같고 우리에게만 Monad 가 없다.**

### 근거 C — 이 저장소의 원칙

`CLAUDE.md`: 「YAGNI 금지 — 구조적 정합이 당장의 구현 편의보다 앞선다」.
「지금 안 쓰니까 안 만든다」는 이 저장소가 이미 거부한 논리다.

### 하지 않는 이유가 기록에 없다

`.dev/` 전체·`docs/` 전체·`CLAUDE.md`·`CHANGELOG.md`·커밋 309개를 검색해 **0건**.
찬성도 반대도 없다. 연대기상 갈림길로 존재한 적이 없다 —
`Reader` 는 2026-01-25(`29810e1`), `FunctionFunctor` 는 7개월 뒤 2026-08-13(`79d49d0`,
`FunctionProfunctor` 의 짝을 명세 게이트 ③이 요구해서 사후에 만든 것).

## 2. 무엇을 하지 않는가 (범위 밖)

- **`Reader` 를 없애지 않는다.** `ReaderT` 가 붙을 자리가 필요하고, 트랜스포머는 Static Land 에
  없는 개념이라 명세로 판정할 수 없다. cats 식 Kleisli 통합은 **권하지 않는다** —
  `Id[A] = A` 는 고차 타입이 있어야 성립하고 JS 에는 없다.
- **`identity` 를 Monad 로 올리지 않는다.** 별개 사안. 아래 6절에 기록만 남긴다.
- 영어판 문서는 **범위 안**이다 — 번역 게이트가 정본과 짝을 요구한다. 7절 완료조건 6번.

## 3. 무엇을 만드는가

`index.js` 의 `modules.push(FunctionProfunctor);` 바로 뒤(현재 1011행 부근, `/* Function */`
구역 끝). 이 자리는 `Apply`(726)·`Applicative`(737)·`Chain`(795)·`Monad`(815) 정의 뒤이고
`load(...modules)`(3091) 앞이라 순서 문제가 없다.

부모 조회는 이 파일의 관례대로 `Parent.types.ClassName` 을 쓴다(74곳 선례, `2차-8` 참조).
`constant`(102행)를 재사용한다 — 규칙 22 「관례를 실행으로 조회하라」.

```javascript
// (a ->) 의 Apply — 같은 입력을 양쪽에 먹인다. docs/internals.md#function-monad
class FunctionApply extends Apply {
    constructor() {
        super(Functor.types.FunctionFunctor, (ff, fa) => x => ff(x)(fa(x)), 'function', Apply.types, 'function');
    }
}
modules.push(FunctionApply);
class FunctionApplicative extends Applicative {
    constructor() {
        super(Apply.types.FunctionApply, constant, 'function', Applicative.types, 'function');
    }
}
modules.push(FunctionApplicative);
// chain 은 환경을 두 번 먹인다 — 이것이 Reader 모나드다. docs/internals.md#function-monad
class FunctionChain extends Chain {
    constructor() {
        super(Apply.types.FunctionApply, (f, g) => x => f(g(x))(x), 'function', Chain.types, 'function');
    }
}
modules.push(FunctionChain);
class FunctionMonad extends Monad {
    constructor() {
        super(Applicative.types.FunctionApplicative, Chain.types.FunctionChain, 'function', Monad.types, 'function');
    }
}
modules.push(FunctionMonad);
```

**실측(스크래치패드 복사본, 2026-08-23)** — 위 초안 그대로 넣고 돌린 결과다. 저장소는 안 건드렸다.

```
Monad.lookup('function')
chain : a:1      chain(h => e => h + ':' + e.port, e => e.host)({host:'a',port:1})
of    : 7        of(7)('아무거나')
ap    : 11       ap(e => n => n + e.port, e => 10)({host:'a',port:1})
map   : 2        map(n => n * 2, e => e.port)({host:'a',port:1})
```

## 4. 게이트에 무엇이 걸리는가 (전부 실측)

복사본에 초안을 넣고 `node tests/run.js` 를 돌려 **실제로 빨개진 것만** 적는다.
(`.dev/` 를 복사하지 않아 난 상대링크 실패 3건은 인공물이라 제외했다.)

| # | 파일·줄 | 무엇이 깨지나 | 조치 |
| --- | --- | --- | --- |
| 1 | `tests/algebra-type.test.js:133` | `all.length` 잠금 **148 → 152** | 152 로 갱신 |
| 2 | `tests/staticland-laws.test.js` `OF` 표(404행) | `Apply.FunctionApply(function) — 표본 없음`, `Chain.FunctionChain(function) — 표본 없음` | `function: x => () => x` 한 줄 추가 |
| 3 | `tests/staticland-laws.test.js:819` | `checked` 잠금 **101 → 105** | 105 로 갱신 |

`Applicative` 와 `Monad` 법칙은 **손댈 것이 없다** — `FUNCTOR_SAMPLES.function`(218행)과
`OBSERVE.function`(198행)이 이미 있다. 위 세 가지를 넣은 뒤 복사본에서 실패 0건을 확인했다
(`test files : 48 passed, 3 failed` — 3은 위의 인공물).

**`types/*.d.ts` 는 손댈 것이 없다**(실측). 명세 게이트 ⑤·⑥은 클래스 계층을 보지
개별 타입의 등록을 보지 않아 초록을 유지했다.

## 5. ⚠️ 발견 — Chain 법칙이 함수 타입에서 눈멀어 있다

**이 계획의 핵심 항목이다.** 위 세 가지만 하면 초록이 나지만, **그 초록은 눈먼 초록이다.**

뮤테이션 셋을 심어 재 봤다(복사본).

| 뮤테이션 | 결과 |
| --- | --- |
| ② `ap` 가 둘째 인자를 무시 — `(ff, fa) => x => ff(x)(x)` | ✅ **잡힘** (3 → 4 failed) |
| ① `chain` 이 환경 대신 중간값을 먹임 — `f(g(x))(x)` → `f(g(x))(g(x))` | ❌ **안 잡힘** (3 failed, 기준선과 같음) |
| ③ `of` 가 감싸지 않고 값을 그대로 (`constant` → `identity`) | 미측정 — 시간 초과로 중단 |

**원인**(실측으로 확인). `Chain` 법칙(661~668행)이 쓰는 Kleisli 화살표가 이것이다.

```javascript
const fs = [x => of(fnA(x)), x => of(fnB(x)), ...];
```

`OF.function` 이 `x => () => x` 이므로 **모든 화살표가 환경을 무시하는 상수 함수**가 된다.
환경을 안 보는 화살표로는 「어느 환경이 넘어가는가」를 가릴 수 없다. 그래서 결합법칙은
양쪽이 똑같이 무너져 초록이 난다.

**이것은 함수 모나드의 유일한 특징을 검사하지 못한다는 뜻이다** — `chain` 이 같은 환경을
두 단계에 나눠 준다는 것, 그것 하나가 Reader 인 이유인데 그 자리가 비어 있다.

### 조치 (구현 시 함께)

`Chain` 법칙에 타입별 화살표 예외를 둔다. 형태는 이 파일에 이미 있는 `KLEISLI`(420행)·
`OF_BY_LABEL` 과 같은 방식으로 맞춘다. 초안:

```javascript
// 함수 모나드는 환경을 보는 화살표라야 검사가 된다 — of 로 만든 상수 화살표는 어느 환경이
// 넘어가는지 못 가린다(2026-08-23 실측: 환경 뒤바꾸기 뮤테이션이 안 잡혔다).
const CHAIN_FNS = { function: [x => e => x + e, x => e => x * e] };
```
그리고 662행을 `const fs = CHAIN_FNS[M.type] || [x => of(fnA(x)), ...]` 로.

**미검증** — 이 초안이 뮤테이션 ①을 잡는지는 **확인 안 했다.** 구현 회차에서 반드시 재고,
못 잡으면 화살표를 바꾼다.

## 6. 곁가지로 나온 사실 (이 계획 밖, 기록만)

cats 의 `Reader = Kleisli[Id, ...]` 를 우리 식으로 흉내 내려다 막혔다.

```
ReaderT('identity') → Monad.lookup: unsupported key identity
```

현재 Monad 등록은 아홉이다 — Array, Maybe, Either, Task, NonEmptyList, Reader, Writer,
State, Free. `Identity` 는 `Applicative` 까지만 있다. **결함인지 의도인지 확인 안 함.**

## 7. 완료조건

1. `Monad.lookup('function')` 이 인스턴스를 돌려주고, `chain`·`of`·`ap`·`map` 이
   3절의 실측값과 같다.
2. `npm test` 전량 통과. `algebra-type` 152, `staticland-laws` `checked` 105.
3. **뮤테이션 넷을 전부 잡는다** — ①(환경 뒤바꾸기) ②(둘째 인자 무시) ③(`of` 가 안 감쌈)
   ④(`chain` 을 `map` 으로). ①이 안 잡히면 5절의 화살표를 고칠 때까지 이 항목은 열려 있다.
4. `npm run baseline` 차이가 **새 인스턴스 넷의 등장뿐**이고 기존 행은 그대로다.
5. `docs/internals.md` 에 `{#function-monad}` 앵커로 절을 하나 두고, 3절 주석의 링크가 그것을 가리킨다. 그 절의 예제가 `docs-examples` 에서 돌고 값이 대조된다.
6. `docs/en/internals.md` 에 같은 절(번역 게이트가 짝을 요구한다).
7. `.dev/TODO.md` 갱신.

## 8. 결정 (2026-08-23, 소유자 「좋습니다」)

1. ~~별칭을 무엇으로 둘 것인가~~ **철회 — 결정할 것이 없다.** 에이전트가 「`'function'` 으로
   두면 `Chain.lookup('function')` 이 Reader 모나드를 뜻하게 되어 이름이 뜻을 말해 주지 않는다」
   고 적었으나 **부정확했다.** 소유자 지적으로 바로잡는다: 그것은 「함수 타입의 `Chain`
   인스턴스」를 뜻할 뿐이다. 「Reader 모나드」는 FP 문헌이 **같은 구조에 붙인 다른 이름**이지
   두 번째 뜻이 아니다(cats 가 `type Reader[A, B] = Kleisli[Id, A, B]` 로 그것을 그대로 보인다).
   그리고 「첫 인자를 고정한 함수」에 줄 수 있는 `chain` 은 하나뿐이라 모호할 여지가 없다.
   → 별칭은 `'function'`. `Functor`·`Semigroup`·`Monoid` 의 함수 인스턴스와 같은 이름이다.

   **대신 남는 것은 이름이 아니라 문서다.** 같은 일을 하는 길이 둘이 된다 —
   `Chain.lookup('function')` 과 `Chain.lookup('reader')`. 「둘이 같은 것이며 감싼 쪽만
   `ReaderT` 를 붙일 수 있다」를 7절 완료조건 5번의 절에 적고, 두 길의 결과가 같음을 예제로
   보이고 문서 게이트가 그 값을 대조하게 한다.
2. **잠금 숫자 갱신 승인** — `algebra-type` 148 → 152, `staticland-laws` `checked` 101 → 105.
3. **5절 게이트 보수를 같은 회차에 한다** — 눈먼 초록을 하루라도 두면 그것이 기준선이 된다.
