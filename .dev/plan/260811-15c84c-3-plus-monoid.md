# 회차 3 — 회귀 수정: `preview` 의 Monoid 를 `Plus` 유도로

## 무엇이 밝혀졌나

회차 2가 `preview` 의 Monoid 를 `Maybe.Monoid('first')` 로 골랐고, 그것이 **회귀**였다.
타입이 섞인 대상에서 던진다 — HEAD 는 첫 대상을 돌려줬다.

### 이 구분은 우리가 만드는 게 아니다 — Haskell `base` 가 이미 두 타입으로 나눠뒀다

| | 정의 | 동작 | 우리 것 |
| --- | --- | --- | --- |
| `Monoid (Maybe a)` (`Semigroup a` 필요) | `Just a <> Just b = Just (a <> b)` | **안을 합친다** | `maybe(first)` = `Maybe.Monoid(innerSG)` |
| `newtype First a = First (Maybe a)` | `First (Just a) <> First (Just b) = First (Just a)` | **안을 안 본다** | `Alt`/`Plus` 유도 ← **없다** |

`base` 문서가 왼쪽을 이렇게 설명한다 — "Lift a semigroup into Maybe forming a Monoid…
`mempty = Nothing`, `Just a <> Just b = Just (a <> b)`". **`index.js:1365` 주석과 글자 그대로
같은 말이다.** 같은 구성이다.

그리고 **`lens` 의 `preview` 는 `First` 를 쓴다** — "the `First` monoid, which collects the
first non-Nothing value encountered during traversal".

**즉 표준이 두 개로 나눈 이유가 이 혼동을 막기 위해서인데, 우리는 하나만 갖고 있었고
회차 2가 잘못된 쪽을 골랐다.**

## 변경 사항

### A. `Plus` → `Monoid` 유도를 등록한다 — 키는 `plus(maybe)` / `plus(array)` (사용자 승인)

`Plus extends Alt` 라 인스턴스가 `.alt`(결합)와 `.zero`(항등원)를 **둘 다 갖는다.**
구조적으로 Monoid 인데 태그만 없다. `Monoid` 생성자가 `Symbols.Semigroup` 을 요구하므로
`Semigroup` 을 한 겹 만든다.

**프로토타입으로 동작을 확인했다** — 6가지 입력 전부 HEAD 와 일치(`Just(1)`, `Just(2)`,
`Just(1)`, `Nothing`, `Just(1)`, `Just(null)`), `empty()` 는 `Nothing`, `Symbols.Monoid` 도 붙는다.

```javascript no-run 변경안
// Plus 는 alt(결합)와 zero(항등원)를 다 갖고 있어 구조적으로 Monoid 다 — 태그만 없다.
// Haskell 의 Data.Monoid.First 에 해당한다: 안을 열지 않고 한쪽을 통째로 고른다.
// Maybe.Monoid(innerSG)(= maybe(first))와는 다른 모노이드다 — 그쪽은 안을 합친다.
class MaybePlusMonoid extends Monoid {
    constructor() {
        const p = Plus.types.MaybePlus;
        super(new Semigroup(p.alt, 'Maybe'), p.zero, 'Maybe', Monoid.types, 'plus(maybe)');
    }
}
modules.push(MaybePlusMonoid);
// array 도 대칭으로 — ArrayAlt/ArrayPlus 가 이미 등록돼 있다.
```

`array` 는 `ArrayAlt.alt` 와 `ArraySemigroup.concat` 이 둘 다 이어붙이기라 의미가 갈리지
않지만, **대칭을 위해 등록한다** — `Plus` 가 있는 타입은 전부 Monoid 를 얻는다는 규칙이
하나뿐인 특례보다 낫다.

### B. optics 의 `_firstM` 을 바꾼다 — **회귀 수정**

```javascript no-run 변경안
const _firstM = Monoid.of('plus(maybe)');   // Maybe.Monoid('first') 대신
const _arrayM = Monoid.of('array');         // 유지
```

`_arrayM = Monoid.of('array')` 와 형태가 대칭이 된다.

### C. `foldMap` 주석의 시제 (리뷰 #3)

`index.js:2305` 의 `// … foldMap 으로 낸다` 가 **없는 API 를 있다고 말한다.** `foldMap` 은
존재하지만 Foldable 전용이라 optic 을 안 받는다. → `foldMap(monoid, optic, s) 로 낼 예정이다
(아직 없다 — 회차 5)`.

### D. `view` 계약을 "Lens 전용" 으로 확정한다 (리뷰 #6)

회차 2에서 내가 넣은 `view(traversed('array'), [1,2,3]) === 1` 이 **명세 세 곳과도, 참조
구현과도 다르다.** `lens` 문서: "You can use `view` on a Traversal, but only if the value you
extract is a **Monoid**" — 즉 `lens` 는 전부 `mconcat` 한다. "첫 대상" 이 아니다.

- `tests/optics.test.js` 에서 그 테스트 **제거**. 나머지 2건(대상 없으면 TypeError)은 유지 —
  Lens 가 아닌 것을 넘겼을 때의 안전망이다
- `CLAUDE.md:208` 에 "대상 없으면 TypeError" 한 줄 추가 (현재 던진다는 말이 없다)

### E. `'any'` 와 `first`/`last` 런타임 테스트 (리뷰 #5)

**저장소 전체에 0건이다.** 회차 2의 본체 변경이 `npm test` 어디에도 안 걸렸다.
`tests/monoid.test.js` (또는 `semigroup` 계열)에 추가:

| 테스트 | 기대 |
| --- | --- |
| `Semigroup.of('first').concat(1, 2)` | `1` |
| `Semigroup.of('first').concat('a', 'b')` | `'a'` |
| `Semigroup.of('first').concat(1, 'a')` | **throws** — `'any'` 가 타입 혼합까지 열지 않았다는 고정 |
| `Semigroup.of('last').concat(1, 2)` | `2` |
| `Monoid.of('plus(maybe)')` 항등원 좌/우 + `Just(1),Just('a')` | `Just(1)` — **회귀 재발 방지** |
| `preview(traversed('array'), [1, 'a'])` | `Just(1)` (optics 테스트에) |

## Verification

1. **`tests/baseline.js` 로 HEAD 전수 대조** (Scaffolding 에서 만든 것). 남는 차이가
   **`view` 3건 + `first`/`last` 타입 확장뿐**이어야 한다 — `preview` 차이는 **0건**이어야 한다
2. `npm test` — 38 파일 + `tsc`. **이번엔 E 의 테스트가 본체를 덮으므로 초록이 의미를 갖는다**
3. `grep "Maybe.Monoid('first')" index.js` → 0건
4. `staticland-reviewer` 재검토 → `.dev/review/260811-15c84c-3-*.md`.
   **회차 2의 6건 각각의 상태를 대조하도록 요구한다**

## 되돌리는 법

A(등록)와 B(optics 교체)를 **별도 커밋**으로. A 는 순수 추가라 되돌릴 일이 거의 없고,
B 가 동작을 바꾸는 쪽이다.

## 회차 번호 — 회차 2 계획서가 여기서 불일치했다

회차 2 계획서가 `foldMap` 을 C 절에서는 "회차 3", 하단 표에서는 "회차 4" 로 적어 리뷰어에게
지적받았다. **이번엔 한 곳에만 적는다:**

| 회차 | 범위 |
| --- | --- |
| **3 (지금)** | 회귀 수정 + 회차 2 리뷰 잔여 5건 |
| 4 | `_Identity`/`_Const` Applicative 등록 |
| 5 | optics 모듈 객체 + bare export 11개 제거 + `foldMap(monoid, optic, s)` 신설 |

## 범위 밖

- `Alt`/`Plus` 가 없는 타입의 Monoid 유도 (Either/Task 는 `Plus` 가 없다)
- `view` 를 TS 로 Lens 에만 강제하는 것 — `Lens`/`Prism`/`Traversal` 이 전부 `Optic<S,A>`
  별칭이라 타입 레벨 구분이 없다. 별도 작업이다
