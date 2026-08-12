# Context — `Plus` → `Monoid` 유도의 재료 조사

회차 3 Context. 리뷰 #2 의 처방("`Plus`→`Monoid` 유도 헬퍼")을 구현하기 위해 기존 재료를
확인했다.

## `Plus` 는 이미 Monoid 의 재료를 전부 갖고 있다

```
class Plus extends Alt {
    constructor(alt, zero, type, registry, ...aliases) { ... }
}
```

`Plus extends Alt` 이므로 인스턴스가 **`.alt`(결합 이항 연산)와 `.zero`(항등원)를 둘 다**
갖는다. 구조적으로 Monoid 인데 태그만 없다.

```
Plus.types = ArrayPlus, array, MaybePlus, maybe
Plus.of('maybe') 가 Semigroup 인가 → false   (Symbols.Semigroup 없음)
```

`Monoid` 생성자는 `checkAndSet('Monoid.super')` 로 **`Symbols.Semigroup` 을 요구**하므로
`Plus` 를 그대로 넘길 수 없다. 중간에 `Semigroup` 을 한 겹 만들어야 한다:

```javascript no-run 유도 경로
new Semigroup(plus.alt, type)              // Symbols.Semigroup 을 얻는다
  -> new Monoid(thatSG, plus.zero, type, Monoid.types, alias)
```

## 정적 팩토리 선례

타입 클래스에 붙은 정적 멤버는 `types` / `resolver` / `of` **셋뿐**이다 (Semigroup, Monoid,
Alt, Plus, Applicative 모두 동일). 즉 `Monoid.fromPlus(...)` 같은 **타입 클래스 정적 팩토리는
선례가 없다.**

반면 **데이터 타입에 붙은 팩토리는 선례가 있다** — `Maybe.Semigroup(innerSG)`,
`Maybe.Monoid(innerSG)`, `Either.Semigroup(innerSG)`. 전부 `_keyCache`/`_instanceCache` 를
갖고 레지스트리에 `maybe(<key>)` 형태로 등록한다.

→ **두 선례 중 어느 쪽을 따를지가 회차 3 계획의 결정 사항이다.**

## 이름 후보와 각각의 문제

| 후보 | 문제 |
| --- | --- |
| `Monoid.of('maybe')` | `Monoid.of('array')` 와 대칭이고 리뷰어 제안이다. 다만 Haskell 의 `Monoid (Maybe a)` 는 **안쪽을 합치는** 쪽이라 FP 배경 사용자가 오해할 수 있다 — 여기서는 First 의미가 된다 |
| `Monoid.of('plus(maybe)')` | 조립 문법에 맞고 **유도 출처가 이름에 남는다.** `plus(array)` 도 대칭. 다만 기존 `maybe(first)` 는 "바깥(maybe) → 안(first)" 인데 `plus(maybe)` 는 "무엇에서 유도했나" 라 **괄호의 의미가 다르다** |
| `Monoid.of('maybe(alt)')` | 기존 괄호 형식 유지. 다만 `maybe(<key>)` 의 기존 의미가 "내부 Semigroup 이 `<key>`" 인데 `alt` 는 내부 Semigroup 이 아니다 — **같은 형식에 다른 규칙** |

**`array` 는 세 후보 어느 쪽이든 문제가 없다** — `ArrayAlt` 의 `alt` 와 `ArraySemigroup` 의
`concat` 이 둘 다 이어붙이기라 의미가 갈리지 않는다. 갈리는 것은 `Maybe` 뿐이다.

## optics 가 실제로 요구하는 것

`preview` 는 **"첫 `Just` 를 통째로 고르기"** 다 — 안을 안 본다. 회차 2 전수 대조:

| 케이스 | HEAD | `Alt.of('maybe').alt` | `Maybe.Monoid('first')` |
| --- | --- | --- | --- |
| 동종 4건 | — | 일치 | 일치 |
| `Just(1), Just('a')` | `Just(1)` | `Just(1)` | **THROW** |
| `Just(null), Just(1)` | `Just(null)` | `Just(null)` | **THROW** |
| `Just({}), Just([])` | `Just({})` | `Just({})` | **THROW** |

`Alt` 가 **7/7** 로 HEAD 와 일치한다.

## 이번 회차에 쓸 도구

Scaffolding 에서 `tests/baseline.js` 를 만들었다. `diffCases([[label, fp => ...]])` 로
HEAD 와 현재를 같은 입력에 돌려 값·예외를 한 표로 대조한다. **회차 1·2 의 회귀 두 건을
실제로 재현했다.** 회차 3 Verification 에서 이것으로 "계획에 없는 차이" 를 걸러낸다.

## 함께 정리할 것 (회차 2 리뷰 잔여)

- #3 `index.js:2305` 주석의 `foldMap` 시제 — 한 단어
- #5 `first`/`last` 런타임 테스트 4건 + `preview` 이종 1건 (**저장소 전체에 0건**)
- #6 `view` 계약 — `CLAUDE.md:208` 과 `tests/optics.test.js:146` 이 서로 다른 말을 한다.
  "Lens 전용" 을 유지할지 "첫 대상" 을 계약으로 올릴지 **결정이 필요하다**
